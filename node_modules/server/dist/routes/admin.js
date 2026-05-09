import { Router } from 'express';
import prisma from '../config/database.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
const router = Router();
router.use(authMiddleware, adminMiddleware);
router.get('/', async (_req, res) => {
    try {
        const [users, projects, colleges] = await Promise.all([
            prisma.user.count(),
            prisma.post.count({ where: { type: 'project', deletedAt: null } }),
            prisma.college.count(),
        ]);
        const recentUsers = await prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, name: true, email: true, createdAt: true } });
        const recentProjects = await prisma.post.findMany({ where: { type: 'project', deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, title: true, createdAt: true } });
        res.json({ stats: { users, projects, colleges }, recentUsers, recentProjects });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
router.get('/users', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const take = 20;
        const [users, total] = await Promise.all([
            prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take, skip: (page - 1) * take, select: { id: true, name: true, email: true, university: true, accountType: true, createdAt: true } }),
            prisma.user.count(),
        ]);
        res.json({ users, total, page, lastPage: Math.ceil(total / take) });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
router.get('/projects', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const take = 20;
        const [projects, total] = await Promise.all([
            prisma.post.findMany({ where: { type: 'project', deletedAt: null }, orderBy: { createdAt: 'desc' }, take, skip: (page - 1) * take, include: { user: { select: { id: true, name: true } } } }),
            prisma.post.count({ where: { type: 'project', deletedAt: null } }),
        ]);
        res.json({ projects, total, page, lastPage: Math.ceil(total / take) });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
router.post('/users/:id/ban', async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        await prisma.collegeUser.deleteMany({ where: { userId } });
        res.json({ success: true });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
router.delete('/projects/:id', async (req, res) => {
    try {
        await prisma.post.update({ where: { id: parseInt(req.params.id) }, data: { deletedAt: new Date() } });
        res.json({ success: true });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
export default router;
//# sourceMappingURL=admin.js.map