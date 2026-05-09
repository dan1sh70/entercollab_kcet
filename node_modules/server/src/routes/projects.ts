import { Router, Response } from 'express';
import prisma from '../config/database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  createNotification,
  removeProjectLikeNotification,
  emitProjectLikes,
  emitProjectComment,
  emitProjectRefresh,
  emitChatRoomsRefresh,
} from '../services/notificationService.js';
import { syncProjectChatMembers } from '../services/chatRoomMembers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../../../uploads/images/projects');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (_req, file, cb) => cb(null, `${Date.now()}_${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const router = Router();

function parseTags(tags: string | null): string[] {
  if (!tags) return [];
  try {
    const parsed = JSON.parse(tags);
    if (Array.isArray(parsed)) return parsed.map((t: string) => String(t).replace(/^#/, ''));
    return [];
  } catch {
    return [];
  }
}

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { tag, category, page = '1', userId } = req.query;
    const take = 12;
    const skip = (parseInt(page as string) - 1) * take;

    const where: any = { type: 'project', status: 'published', visibility: 'public', deletedAt: null };
    if (tag) where.tags = { contains: `#${String(tag).replace(/^#/, '')}` };
    if (category) where.category = category as string;
    if (userId) where.userId = parseInt(userId as string);

    const [projects, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, profilePhotoPath: true, university: true } },
          likes: true,
          comments: true,
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      prisma.post.count({ where }),
    ]);

    const postIds = projects.map((p) => p.id);
    const bookmarkRows =
      postIds.length > 0
        ? await prisma.bookmark.findMany({
            where: { userId: req.user!.id, postId: { in: postIds } },
            select: { postId: true },
          })
        : [];
    const bookmarkedIds = new Set(bookmarkRows.map((b) => b.postId));

    res.json({
      projects: projects.map((p) => ({
        ...p,
        likes_count: p.likes.length,
        comments_count: p.comments.length,
        tags: parseTags(p.tags),
        bookmarked: bookmarkedIds.has(p.id),
      })),
      total,
      page: parseInt(page as string),
      lastPage: Math.ceil(total / take),
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', authMiddleware, upload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, category, tags, visibility } = req.body;

    if (!title || !description || !category) {
      res.status(422).json({ error: 'Title, description and category are required.' });
      return;
    }

    const tagsArr = tags ? (Array.isArray(tags) ? tags : JSON.parse(tags)) : [];
    const imagePath = req.file ? `/uploads/images/projects/${req.file.filename}` : null;

    const project = await prisma.post.create({
      data: {
        userId: req.user!.id,
        title,
        content: description,
        category,
        type: 'project',
        status: 'published',
        visibility: visibility || 'public',
        tags: JSON.stringify(tagsArr.map((t: string) => `#${t.replace(/^#/, '')}`)),
        image: imagePath,
      },
      include: { user: { select: { id: true, name: true, profilePhotoPath: true } } },
    });

    res.json({ success: true, project });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const project = await prisma.post.findFirst({
      where: { id: parseInt(req.params.id as string), type: 'project' },
      include: {
        user: { select: { id: true, name: true, profilePhotoPath: true, university: true, major: true } },
        comments: {
          include: { user: { select: { id: true, name: true, profilePhotoPath: true } } },
          orderBy: { createdAt: 'desc' },
        },
        likes: true,
        requests: { include: { user: { select: { id: true, name: true, profilePhotoPath: true } } } },
        boards: true,
      },
    });

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const isMember =
      project.userId === req.user!.id ||
      project.requests.some((r) => r.userId === req.user!.id && r.approved === 1);

    const bookmarkRow = await prisma.bookmark.findUnique({
      where: { userId_postId: { userId: req.user!.id, postId: project.id } },
    });

    res.json({
      project: {
        ...project,
        likes_count: project.likes.length,
        comments_count: project.comments.length,
        is_liked: project.likes.some((l) => l.userId === req.user!.id),
        tags: parseTags(project.tags),
      },
      isMember,
      bookmarked: !!bookmarkRow,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.patch('/:id', authMiddleware, upload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    const project = await prisma.post.findFirst({ where: { id: parseInt(req.params.id as string), type: 'project' } });
    if (!project || project.userId !== req.user!.id) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const { title, description, category, tags, visibility } = req.body;
    const data: any = {};
    if (title) data.title = title;
    if (description) data.content = description;
    if (category) data.category = category;
    if (visibility) data.visibility = visibility;
    if (tags) {
      const tagsArr = Array.isArray(tags) ? tags : tags.split(',').map((t: string) => t.trim());
      data.tags = JSON.stringify(tagsArr.map((t: string) => `#${t.replace(/^#/, '')}`));
    }
    if (req.file) data.image = `/uploads/images/projects/${req.file.filename}`;

    const updated = await prisma.post.update({ where: { id: project.id }, data });
    res.json({ success: true, project: updated });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const project = await prisma.post.findFirst({ where: { id: parseInt(req.params.id as string), type: 'project' } });
    if (!project || (project.userId !== req.user!.id && !req.user!.isAdmin)) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }
    await prisma.post.update({ where: { id: project.id }, data: { deletedAt: new Date() } });
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/:id/like', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const postId = parseInt(req.params.id as string);
    const existing = await prisma.like.findUnique({
      where: { userId_postId: { userId: req.user!.id, postId } },
    });

    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } });
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { userId: true, type: true },
      });
      if (post?.type === 'project' && post.userId !== req.user!.id) {
        await removeProjectLikeNotification({
          recipientUserId: post.userId,
          postId,
          actorId: req.user!.id,
        });
      }
    } else {
      await prisma.like.create({ data: { userId: req.user!.id, postId } });
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { userId: true, title: true, type: true },
      });
      if (post?.type === 'project' && post.userId !== req.user!.id) {
        const actor = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { name: true } });
        await createNotification({
          recipientUserId: post.userId,
          type: 'project_like',
          message: `${actor?.name ?? 'Someone'} liked your project “${post.title || 'Project'}”.`,
          link: `/projects/${postId}`,
          actorId: req.user!.id,
          actorName: actor?.name ?? undefined,
          meta: { postId },
        });
      }
    }

    const count = await prisma.like.count({ where: { postId } });
    const postMeta = await prisma.post.findUnique({ where: { id: postId }, select: { type: true } });
    if (postMeta?.type === 'project') {
      emitProjectLikes(postId, {
        likes_count: count,
        actorUserId: req.user!.id,
        liked: !existing,
      });
    }
    res.json({ status: existing ? 'unliked' : 'liked', likes_count: count });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/:id/comment', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const postId = parseInt(req.params.id as string);
    const content = req.body.content || req.body.comment;
    if (!content) {
      res.status(422).json({ error: 'Content is required.' });
      return;
    }

    const comment = await prisma.comment.create({
      data: { userId: req.user!.id, postId, content },
      include: { user: { select: { id: true, name: true, profilePhotoPath: true } } },
    });

    const post = await prisma.post.findFirst({
      where: { id: postId, type: 'project', deletedAt: null },
      select: { userId: true, title: true },
    });
    if (post && post.userId !== req.user!.id) {
      await createNotification({
        recipientUserId: post.userId,
        type: 'project_comment',
        message: `${comment.user.name} commented on your project “${post.title || 'Project'}”.`,
        link: `/projects/${postId}`,
        actorId: req.user!.id,
        actorName: comment.user.name,
        meta: { postId, commentId: comment.id },
      });
    }

    emitProjectComment(postId, comment);

    res.json({ success: true, comment });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/:id/join', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const postId = parseInt(req.params.id as string);
    const existing = await prisma.projectRequest.findFirst({
      where: { postId, userId: req.user!.id },
    });
    if (existing) {
      res.json({ status: 'exists' });
      return;
    }
    await prisma.projectRequest.create({ data: { userId: req.user!.id, postId } });
    const post = await prisma.post.findFirst({
      where: { id: postId, type: 'project', deletedAt: null },
      select: { userId: true, title: true },
    });
    if (post && post.userId !== req.user!.id) {
      const actor = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { name: true } });
      await createNotification({
        recipientUserId: post.userId,
        type: 'project_join_request',
        message: `${actor?.name ?? 'Someone'} requested to collaborate on “${post.title || 'your project'}”.`,
        link: `/projects/${postId}`,
        actorId: req.user!.id,
        actorName: actor?.name ?? undefined,
        meta: { postId },
      });
    }
    emitProjectRefresh(postId);
    res.json({ status: 'requested' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/:id/request/:userId/approve', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const postId = parseInt(req.params.id as string);
    const userId = parseInt(req.params.userId as string);
    const project = await prisma.post.findFirst({
      where: { id: postId, type: 'project', deletedAt: null },
    });
    if (!project || project.userId !== req.user!.id) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const updated = await prisma.projectRequest.updateMany({
      where: { postId, userId },
      data: { approved: 1 },
    });
    if (updated.count === 0) {
      res.status(404).json({ error: 'Join request not found' });
      return;
    }

    // Ensure a project chat exists so approved collaborators appear on Messages (GET /chat).
    let room = await prisma.chatRoom.findFirst({ where: { postId }, orderBy: { id: 'asc' } });
    if (!room) {
      room = await prisma.chatRoom.create({
        data: { name: project.title || 'Project chat', postId },
      });
    }
    await syncProjectChatMembers(room.id, postId);
    emitChatRoomsRefresh(userId);

    const owner = await prisma.user.findUnique({ where: { id: project.userId }, select: { name: true } });
    await createNotification({
      recipientUserId: userId,
      type: 'project_join_accepted',
      message: `${owner?.name ?? 'The project owner'} approved your collaboration request for “${project.title || 'a project'}”.`,
      link: `/projects/${postId}`,
      actorId: project.userId,
      actorName: owner?.name ?? undefined,
      meta: { postId },
    });

    emitProjectRefresh(postId);

    res.json({ status: 'approved' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/:id/request/:userId/reject', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const postId = parseInt(req.params.id as string);
    const userId = parseInt(req.params.userId as string);
    const project = await prisma.post.findFirst({ where: { id: postId, type: 'project' } });
    if (!project || project.userId !== req.user!.id) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }
    await prisma.projectRequest.deleteMany({ where: { postId, userId, approved: 0 } });
    const owner = await prisma.user.findUnique({ where: { id: project.userId }, select: { name: true } });
    await createNotification({
      recipientUserId: userId,
      type: 'project_join_rejected',
      message: `${owner?.name ?? 'The project owner'} declined your collaboration request for “${project.title || 'a project'}”.`,
      link: `/projects/${postId}`,
      actorId: project.userId,
      actorName: owner?.name ?? undefined,
      meta: { postId },
    });
    emitProjectRefresh(postId);
    res.json({ status: 'rejected' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/:id/bookmark', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const postId = parseInt(req.params.id as string);
    const existing = await prisma.bookmark.findUnique({
      where: { userId_postId: { userId: req.user!.id, postId } },
    });
    if (existing) {
      await prisma.bookmark.delete({ where: { id: existing.id } });
      res.json({ status: 'removed', bookmarked: false });
    } else {
      await prisma.bookmark.create({ data: { userId: req.user!.id, postId } });
      res.json({ status: 'added', bookmarked: true });
    }
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
