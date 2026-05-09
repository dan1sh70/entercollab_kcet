import { Router } from 'express';
import prisma from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { emitChatMessage, emitChatRoomsRefresh } from '../services/notificationService.js';
import { syncProjectChatMembers } from '../services/chatRoomMembers.js';
const router = Router();
/** Room list only (no message bodies) — rooms are separate from messages. */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const rooms = await prisma.chatRoom.findMany({
            where: { users: { some: { userId: req.user.id } } },
            include: {
                users: { include: { user: { select: { id: true, name: true, profilePhotoPath: true } } } },
                post: { select: { id: true, title: true } },
            },
            orderBy: { updatedAt: 'desc' },
        });
        res.json({ rooms });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
/** Single room metadata for a project (no messages). Owner or member only. */
router.get('/rooms/by-post/:postId', authMiddleware, async (req, res) => {
    try {
        const postId = parseInt(req.params.postId);
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
        const isProjectOwner = post.userId === req.user.id;
        const isMember = await prisma.chatRoomUser.findUnique({
            where: { chatRoomId_userId: { chatRoomId: room.id, userId: req.user.id } },
        });
        if (!isProjectOwner && !isMember) {
            res.json({ room: null });
            return;
        }
        res.json({
            room: { id: room.id, name: room.name, postId: room.postId },
        });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
/** Explicitly create a project chat room (owner only). No automatic / algorithmic creation. */
router.post('/rooms', authMiddleware, async (req, res) => {
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
        if (post.userId !== req.user.id) {
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
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
/** Find or create a 1:1 direct room (no project post). */
router.post('/direct/:userId', authMiddleware, async (req, res) => {
    try {
        const otherId = parseInt(String(req.params.userId), 10);
        const me = req.user.id;
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
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
router.get('/:roomId/messages', authMiddleware, async (req, res) => {
    try {
        const roomId = parseInt(req.params.roomId);
        if (Number.isNaN(roomId)) {
            res.status(400).json({ error: 'Invalid room' });
            return;
        }
        const isMember = await prisma.chatRoomUser.findUnique({
            where: { chatRoomId_userId: { chatRoomId: roomId, userId: req.user.id } },
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
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
router.post('/:roomId/send', authMiddleware, async (req, res) => {
    try {
        const roomId = parseInt(req.params.roomId);
        const { content } = req.body;
        if (!content) {
            res.status(422).json({ error: 'Content is required.' });
            return;
        }
        const isMember = await prisma.chatRoomUser.findUnique({
            where: { chatRoomId_userId: { chatRoomId: roomId, userId: req.user.id } },
        });
        if (!isMember) {
            res.status(403).json({ error: 'Not a member of this room' });
            return;
        }
        const message = await prisma.message.create({
            data: { chatRoomId: roomId, userId: req.user.id, content },
            include: { user: { select: { id: true, name: true, profilePhotoPath: true } } },
        });
        await prisma.chatRoom.update({
            where: { id: roomId },
            data: { updatedAt: new Date() },
        });
        await emitChatMessage(roomId, message);
        res.json({ message });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
export default router;
//# sourceMappingURL=chat.js.map