import { Router, Response } from 'express';
import prisma from '../config/database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const followingIds = (
      await prisma.userFollow.findMany({
        where: { followerId: req.user!.id },
        select: { followingId: true },
      })
    ).map((f) => f.followingId);

    const feedItems = await prisma.activityFeedItem.findMany({
      where: { userId: { in: [...followingIds, req.user!.id] } },
      include: { user: { select: { id: true, name: true, profilePhotoPath: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const recommendedUsersRaw = await prisma.user.findMany({
      where: { id: { not: req.user!.id } },
      select: { id: true, name: true, profilePhotoPath: true, university: true },
      take: 3,
    });

    const followingSet = new Set(followingIds);
    const recommendedUsers = recommendedUsersRaw.map((u) => ({
      ...u,
      isFollowing: followingSet.has(u.id),
    }));

    res.json({ feedItems, recommendedUsers });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/users/:id/follow', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const followingId = parseInt(req.params.id as string);
    if (followingId === req.user!.id) {
      res.status(422).json({ error: 'Cannot follow yourself.' });
      return;
    }

    const existing = await prisma.userFollow.findUnique({
      where: { followerId_followingId: { followerId: req.user!.id, followingId } },
    });

    if (existing) {
      await prisma.userFollow.delete({ where: { id: existing.id } });
      res.json({ following: false });
    } else {
      await prisma.userFollow.create({ data: { followerId: req.user!.id, followingId } });
      res.json({ following: true });
    }
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
