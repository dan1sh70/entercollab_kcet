import { Router } from 'express';
import prisma from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
const router = Router();
router.get('/', authMiddleware, async (req, res) => {
    try {
        const projects = await prisma.post.findMany({
            where: { type: 'project', deletedAt: null },
            include: {
                user: { select: { id: true, name: true, profilePhotoPath: true, university: true, major: true } },
                comments: {
                    include: { user: { select: { id: true, name: true, profilePhotoPath: true } } },
                    orderBy: { createdAt: 'desc' },
                },
                likes: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        const projectsWithCounts = projects.map((p) => ({
            ...p,
            likes_count: p.likes.length,
            comments_count: p.comments.length,
            is_liked: p.likes.some((l) => l.userId === req.user.id),
            tags: parseTags(p.tags),
        }));
        const suggestedUsers = await prisma.user.findMany({
            where: {
                id: { not: req.user.id },
                NOT: { followersRel: { some: { followerId: req.user.id } } },
            },
            select: { id: true, name: true, profilePhotoPath: true, university: true, major: true },
            take: 5,
        });
        res.json({ projects: projectsWithCounts, suggestedUsers });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
router.post('/posts', authMiddleware, async (req, res) => {
    try {
        const { content } = req.body;
        if (!content) {
            res.status(422).json({ error: 'Content is required.' });
            return;
        }
        const post = await prisma.post.create({
            data: { userId: req.user.id, content, type: 'text', status: 'published' },
            include: { user: { select: { id: true, name: true, profilePhotoPath: true } } },
        });
        res.json({ success: true, post });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
function parseTags(tags) {
    if (!tags)
        return [];
    try {
        const parsed = JSON.parse(tags);
        if (Array.isArray(parsed))
            return parsed.map((t) => String(t).replace(/^#/, ''));
        return [];
    }
    catch {
        return [];
    }
}
export default router;
//# sourceMappingURL=dashboard.js.map