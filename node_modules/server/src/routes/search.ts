import { Router, Response } from 'express';
import prisma from '../config/database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const q = req.query.q as string;
    const type = (req.query.type as string) || 'all';
    const category = req.query.category as string | undefined;

    if (!q) {
      res.json({ projects: [], research: [], users: [], colleges: [] });
      return;
    }

    const results: any = { projects: [], research: [], users: [], colleges: [] };

    if (type === 'all' || type === 'projects') {
      const where: any = {
        type: 'project',
        status: 'published',
        deletedAt: null,
        OR: [
          { title: { contains: q } },
          { content: { contains: q } },
          { tags: { contains: q } },
        ],
      };
      if (category) where.category = category;
      const idMatches = await prisma.$queryRawUnsafe<Array<{ id: number }>>(
        `SELECT id FROM posts WHERE type = 'project' AND status = 'published' AND deleted_at IS NULL AND public_id = ? LIMIT 10;`,
        q
      );
      const matchedIds = idMatches.map((r) => r.id);

      const [byText, byId] = await Promise.all([
        prisma.post.findMany({
          where,
          include: { user: { select: { id: true, name: true, profilePhotoPath: true } } },
          take: 10,
        }),
        matchedIds.length
          ? prisma.post.findMany({
            where: { id: { in: matchedIds } },
            include: { user: { select: { id: true, name: true, profilePhotoPath: true } } },
          })
          : Promise.resolve([]),
      ]);

      const seen = new Set<number>();
      results.projects = [...byId, ...byText]
        .filter((p) => {
          if (seen.has(p.id)) return false;
          seen.add(p.id);
          return true;
        })
        .slice(0, 10);
    }

    if (type === 'all' || type === 'research') {
      const where: any = {
        status: 'published',
        OR: [
          { title: { contains: q } },
          { abstract: { contains: q } },
          { authors: { contains: q } },
          { field: { contains: q } },
          { doi: { contains: q } },
        ],
      };
      const idMatches = await prisma.$queryRawUnsafe<Array<{ id: number }>>(
        `SELECT id FROM research_papers WHERE status = 'published' AND public_id = ? LIMIT 10;`,
        q
      );
      const matchedIds = idMatches.map((r) => r.id);

      const [byText, byId] = await Promise.all([
        prisma.researchPaper.findMany({
          where,
          include: { user: { select: { id: true, name: true, profilePhotoPath: true } } },
          take: 10,
        }),
        matchedIds.length
          ? prisma.researchPaper.findMany({
            where: { id: { in: matchedIds } },
            include: { user: { select: { id: true, name: true, profilePhotoPath: true } } },
          })
          : Promise.resolve([]),
      ]);

      const seen = new Set<number>();
      results.research = [...byId, ...byText]
        .filter((p) => {
          if (seen.has(p.id)) return false;
          seen.add(p.id);
          return true;
        })
        .slice(0, 10);
    }

    if (type === 'all' || type === 'users') {
      results.users = await prisma.user.findMany({
        where: { OR: [{ name: { contains: q } }, { email: { contains: q } }] },
        select: { id: true, name: true, email: true, profilePhotoPath: true, university: true },
        take: 10,
      });
    }

    if (type === 'all' || type === 'colleges') {
      results.colleges = await prisma.college.findMany({
        where: { name: { contains: q } },
        take: 5,
      });
    }

    res.json(results);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
