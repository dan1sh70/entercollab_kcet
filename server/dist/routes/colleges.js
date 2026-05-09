import { Router } from 'express';
import prisma from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
const router = Router();
router.get('/', authMiddleware, async (_req, res) => {
    try {
        const colleges = await prisma.college.findMany({
            where: { isVerified: 1 },
            orderBy: { name: 'asc' },
        });
        res.json({ colleges });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
router.get('/:slug', authMiddleware, async (req, res) => {
    try {
        const college = await prisma.college.findUnique({
            where: { slug: req.params.slug },
            include: {
                users: {
                    include: { user: true },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!college) {
            res.status(404).json({ error: 'College not found' });
            return;
        }
        const isMember = college.users.some((cu) => cu.userId === req.user.id);
        const projects = await prisma.post.findMany({
            where: { type: 'project', status: 'published', deletedAt: null },
            take: 6,
            orderBy: { createdAt: 'desc' },
            include: {
                user: true,
                likes: true,
                comments: true,
            },
        });
        const projectsWithCounts = projects.map((p) => ({
            id: p.id,
            title: p.title,
            content: p.content,
            image: p.image,
            category: p.category,
            createdAt: p.createdAt,
            user: { id: p.user.id, name: p.user.name, profilePhotoPath: p.user.profilePhotoPath },
            likesCount: p.likes.length,
            commentsCount: p.comments.length,
        }));
        res.json({
            college: {
                ...college,
                users: college.users.map((cu) => ({
                    ...cu,
                    user: { id: cu.user.id, name: cu.user.name, profilePhotoPath: cu.user.profilePhotoPath, university: cu.user.university, major: cu.user.major },
                })),
            },
            projects: projectsWithCounts,
            isMember,
            membersCount: college.users.length,
        });
    }
    catch (e) {
        console.error('College show error:', e);
        res.status(500).json({ error: e.message });
    }
});
router.post('/:id/join', authMiddleware, async (req, res) => {
    try {
        const collegeId = parseInt(req.params.id);
        const existing = await prisma.collegeUser.findUnique({
            where: { collegeId_userId: { collegeId, userId: req.user.id } },
        });
        if (!existing) {
            await prisma.collegeUser.create({ data: { collegeId, userId: req.user.id, role: 'student' } });
        }
        res.json({ success: true });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
export default router;
//# sourceMappingURL=colleges.js.map