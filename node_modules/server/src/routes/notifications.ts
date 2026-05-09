import { Router, Response } from 'express';
import prisma from '../config/database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const take = 20;
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { notifiableId: req.user!.id },
        orderBy: { createdAt: 'desc' },
        take,
        skip: (page - 1) * take,
      }),
      prisma.notification.count({ where: { notifiableId: req.user!.id } }),
    ]);
    res.json({ notifications: notifications.map((n) => ({ ...n, data: JSON.parse(n.data || '{}') })), total, page, lastPage: Math.ceil(total / take) });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/fetch', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { notifiableId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    const unreadCount = await prisma.notification.count({
      where: { notifiableId: req.user!.id, readAt: null },
    });
    res.json({
      notifications: notifications.map((n) => ({ ...n, data: JSON.parse(n.data || '{}') })),
      unread_count: unreadCount,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/:id/read', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { id: req.params.id as string, notifiableId: req.user!.id },
      data: { readAt: new Date() },
    });
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/read-all', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { notifiableId: req.user!.id, readAt: null },
      data: { readAt: new Date() },
    });
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
