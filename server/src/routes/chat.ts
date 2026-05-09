import { Router, Response } from 'express';
import prisma from '../config/database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { emitChatMessage, emitChatRoomsRefresh } from '../services/notificationService.js';
import { syncProjectChatMembers } from '../services/chatRoomMembers.js';
import { callOpenAI } from '../services/ai.js';

const router = Router();

/** Room list only (no message bodies) — rooms are separate from messages. */
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const rooms = await prisma.chatRoom.findMany({
      where: { users: { some: { userId: req.user!.id } } },
      include: {
        users: { include: { user: { select: { id: true, name: true, profilePhotoPath: true } } } },
        post: { select: { id: true, title: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    res.json({ rooms });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/** Single room metadata for a project (no messages). Owner or member only. */
router.get('/rooms/by-post/:postId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const postId = parseInt(req.params.postId as string);
    const post = await prisma.post.findFirst({ where: { id: postId, type: 'project', deletedAt: null } });
    if (!post) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const room = await prisma.chatRoom.findFirst({ where: { postId } });
    if (!room) {
      res.json({ room: null });
      return;
    }

    const isProjectOwner = post.userId === req.user!.id;
    const isMember = await prisma.chatRoomUser.findUnique({
      where: { chatRoomId_userId: { chatRoomId: room.id, userId: req.user!.id } },
    });
    if (!isProjectOwner && !isMember) {
      res.json({ room: null });
      return;
    }

    res.json({
      room: { id: room.id, name: room.name, postId: room.postId },
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/** Explicitly create a project chat room (owner only). No automatic / algorithmic creation. */
router.post('/rooms', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const postId = parseInt(String(req.body?.postId ?? ''), 10);
    if (!postId || Number.isNaN(postId)) {
      res.status(422).json({ error: 'postId is required' });
      return;
    }

    const post = await prisma.post.findFirst({ where: { id: postId, type: 'project', deletedAt: null } });
    if (!post) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    if (post.userId !== req.user!.id) {
      res.status(403).json({ error: 'Only the project owner can create a chat room' });
      return;
    }

    const existing = await prisma.chatRoom.findFirst({ where: { postId } });
    if (existing) {
      await syncProjectChatMembers(existing.id, postId);
      res.json({ room: existing, created: false });
      return;
    }

    const room = await prisma.chatRoom.create({
      data: { name: post.title || 'Project chat', postId },
    });
    await syncProjectChatMembers(room.id, postId);
    res.json({ room, created: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/** Find or create a 1:1 direct room (no project post). */
router.post('/direct/:userId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const otherId = parseInt(String(req.params.userId), 10);
    const me = req.user!.id;
    if (Number.isNaN(otherId) || otherId === me) {
      res.status(400).json({ error: 'Invalid user' });
      return;
    }
    const other = await prisma.user.findUnique({ where: { id: otherId }, select: { id: true, name: true } });
    if (!other) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const candidates = await prisma.chatRoom.findMany({
      where: {
        postId: null,
        users: { some: { userId: me } },
      },
      include: { users: { select: { userId: true } } },
    });
    for (const room of candidates) {
      const ids = new Set(room.users.map((u) => u.userId));
      if (ids.size === 2 && ids.has(me) && ids.has(otherId)) {
        res.json({ room: { id: room.id }, created: false });
        return;
      }
    }

    const room = await prisma.chatRoom.create({
      data: {
        name: `Direct · ${other.name}`,
        postId: null,
        users: {
          create: [{ userId: me }, { userId: otherId }],
        },
      },
    });
    emitChatRoomsRefresh(me);
    emitChatRoomsRefresh(otherId);
    res.json({ room: { id: room.id }, created: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:roomId/messages', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const roomId = parseInt(req.params.roomId as string);
    if (Number.isNaN(roomId)) {
      res.status(400).json({ error: 'Invalid room' });
      return;
    }
    const isMember = await prisma.chatRoomUser.findUnique({
      where: { chatRoomId_userId: { chatRoomId: roomId, userId: req.user!.id } },
    });
    if (!isMember) {
      res.status(403).json({ error: 'Not a member of this room' });
      return;
    }

    const messages = await prisma.message.findMany({
      where: { chatRoomId: roomId },
      include: { user: { select: { id: true, name: true, profilePhotoPath: true } } },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ messages });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/:roomId/send', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const roomId = parseInt(req.params.roomId as string);
    const { content } = req.body;
    if (!content) {
      res.status(422).json({ error: 'Content is required.' });
      return;
    }

    const isMember = await prisma.chatRoomUser.findUnique({
      where: { chatRoomId_userId: { chatRoomId: roomId, userId: req.user!.id } },
    });
    if (!isMember) {
      res.status(403).json({ error: 'Not a member of this room' });
      return;
    }

    const message = await prisma.message.create({
      data: { chatRoomId: roomId, userId: req.user!.id, content },
      include: { user: { select: { id: true, name: true, profilePhotoPath: true } } },
    });

    await prisma.chatRoom.update({
      where: { id: roomId },
      data: { updatedAt: new Date() },
    });

    await emitChatMessage(roomId, message);

    res.json({ message });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
    // Auto-generate AI response if it's an AI room (fire and forget)
    if (true) {
      (async () => {
        try {
          const room = await prisma.chatRoom.findUnique({ where: { id: roomId }, select: { isAI: true } });
          if (room?.isAI === 1) {
            // Get previous messages for context
            const recentMsgs = await prisma.message.findMany({
              where: { chatRoomId: roomId },
              orderBy: { createdAt: 'desc' },
              take: 20,
              include: { user: { select: { id: true } } },
            });

            // Build conversation history (most recent first, so reverse)
            const history: { role: string; content: string }[] = [];
            for (const msg of recentMsgs.reverse()) {
              history.push({
                role: msg.userId === req.user!.id ? 'user' : 'assistant',
                content: msg.content,
              });
            }

            const systemPrompt = `You are EnterCollab AI, a helpful assistant for university collaboration, research projects, and academic purposes. You help with:
  - Research guidance and academic support
  - Project collaboration assistance
  - Technical problem-solving
  - Academic writing tips and presentation advice
  - Resource recommendations for learning
  - General academic mentoring
  /** Get or create AI assistant chat room for user */
  Be helpful, clear, and professional. Keep responses concise.`;

            const msgs: { role: string; content: string }[] = [
              { role: 'system', content: systemPrompt },
              ...history,
            ];

            const aiResponse = await callOpenAI(msgs);

            // Create a system user for AI responses if it doesn't exist
            let aiUser = await prisma.user.findFirst({
              where: { email: 'ai-assistant@entercollab.app' },
            });

            if (!aiUser) {
              aiUser = await prisma.user.create({
                data: {
                  name: 'AI Assistant',
                  email: 'ai-assistant@entercollab.app',
                  password: 'system-ai',
                  emailVerifiedAt: new Date(),
                },
              });
              // Add to the room
              await prisma.chatRoomUser.create({
                data: { chatRoomId: roomId, userId: aiUser.id },
              });
            }

            const aiMessage = await prisma.message.create({
              data: {
                chatRoomId: roomId,
                userId: aiUser.id,
                content: aiResponse,
              },
              include: { user: { select: { id: true, name: true, profilePhotoPath: true } } },
            });

            await emitChatMessage(roomId, aiMessage);
          }
        } catch (err) {
          console.error('AI response generation failed:', err);
        }
      })();
    }
  router.post('/ai/assistant', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;

      // Find existing AI assistant room for this user
      let room = await prisma.chatRoom.findFirst({
        where: {
          isAI: 1,
          users: { some: { userId } },
        },
        include: {
          users: { include: { user: { select: { id: true, name: true, profilePhotoPath: true } } } },
        },
      });

      // Create new AI assistant room if it doesn't exist
      if (!room) {
        room = await prisma.chatRoom.create({
          data: {
            name: 'AI Assistant',
            isAI: 1,
            users: {
              create: [{ userId }],
            },
          },
          include: {
            users: { include: { user: { select: { id: true, name: true, profilePhotoPath: true } } } },
          },
        });
      }

      res.json({ room });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
});

export default router;
