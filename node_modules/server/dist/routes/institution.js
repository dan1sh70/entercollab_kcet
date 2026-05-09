import { Router } from 'express';
import prisma from '../config/database.js';
import { authMiddleware, institutionMiddleware } from '../middleware/auth.js';
const router = Router();
router.use(authMiddleware, institutionMiddleware);
router.get('/', async (req, res) => {
    try {
        const user = req.user;
        const college = user.managedCollegeId
            ? await prisma.college.findUnique({ where: { id: user.managedCollegeId } })
            : null;
        const upcomingEvents = await prisma.event.findMany({
            where: { userId: user.id, NOT: { status: 'cancelled' }, eventDate: { gte: new Date() } },
            orderBy: { eventDate: 'asc' },
            take: 5,
        });
        const [eventsTotal, upcoming] = await Promise.all([
            prisma.event.count({ where: { userId: user.id } }),
            prisma.event.count({ where: { userId: user.id, status: 'upcoming', eventDate: { gte: new Date() } } }),
        ]);
        res.json({ college, upcomingEvents, stats: { events_total: eventsTotal, upcoming } });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
router.get('/events', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const take = 12;
        const [events, total] = await Promise.all([
            prisma.event.findMany({
                where: { userId: req.user.id },
                orderBy: { eventDate: 'desc' },
                take,
                skip: (page - 1) * take,
            }),
            prisma.event.count({ where: { userId: req.user.id } }),
        ]);
        res.json({ events, total, page, lastPage: Math.ceil(total / take) });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
export default router;
//# sourceMappingURL=institution.js.map