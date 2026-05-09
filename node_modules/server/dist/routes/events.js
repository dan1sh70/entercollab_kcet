import { Router } from 'express';
import prisma from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../../../uploads/images/events');
fs.mkdirSync(uploadsDir, { recursive: true });
const storage = multer.diskStorage({
    destination: uploadsDir,
    filename: (_req, file, cb) => cb(null, `${Date.now()}_${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } });
const router = Router();
router.get('/', authMiddleware, async (_req, res) => {
    try {
        const events = await prisma.event.findMany({
            where: { NOT: { status: 'cancelled' } },
            include: {
                user: { select: { id: true, name: true, profilePhotoPath: true } },
                registrations: true,
            },
            orderBy: { eventDate: 'asc' },
        });
        res.json({
            events: events.map((e) => ({
                ...e,
                attendees_count: e.registrations.filter((r) => r.status === 'registered').length,
            })),
        });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
    try {
        const { title, description, location, event_date, max_attendees, type } = req.body;
        if (!title || !description || !location || !event_date || !type) {
            res.status(422).json({ error: 'All fields are required.' });
            return;
        }
        const data = {
            userId: req.user.id, title, description, location,
            eventDate: new Date(event_date), type,
        };
        if (max_attendees)
            data.maxAttendees = parseInt(max_attendees);
        if (req.file)
            data.image = `/uploads/images/events/${req.file.filename}`;
        const event = await prisma.event.create({ data });
        res.json({ success: true, event });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const event = await prisma.event.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                user: { select: { id: true, name: true, profilePhotoPath: true } },
                registrations: { include: { user: { select: { id: true, name: true, profilePhotoPath: true } } } },
            },
        });
        if (!event) {
            res.status(404).json({ error: 'Not found' });
            return;
        }
        const isRegistered = event.registrations.some((r) => r.userId === req.user.id);
        const attendeesCount = event.registrations.filter((r) => r.status === 'registered').length;
        res.json({ event: { ...event, attendees_count: attendeesCount }, isRegistered });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
router.patch('/:id', authMiddleware, upload.single('image'), async (req, res) => {
    try {
        const event = await prisma.event.findUnique({ where: { id: parseInt(req.params.id) } });
        if (!event || event.userId !== req.user.id) {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }
        const { title, description, location, event_date, max_attendees, type, status } = req.body;
        const data = {};
        if (title)
            data.title = title;
        if (description)
            data.description = description;
        if (location)
            data.location = location;
        if (event_date)
            data.eventDate = new Date(event_date);
        if (max_attendees)
            data.maxAttendees = parseInt(max_attendees);
        if (type)
            data.type = type;
        if (status)
            data.status = status;
        if (req.file)
            data.image = `/uploads/images/events/${req.file.filename}`;
        const updated = await prisma.event.update({ where: { id: event.id }, data });
        res.json({ success: true, event: updated });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const event = await prisma.event.findUnique({ where: { id: parseInt(req.params.id) } });
        if (!event || event.userId !== req.user.id) {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }
        await prisma.event.delete({ where: { id: event.id } });
        res.json({ success: true });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
router.post('/:id/register', authMiddleware, async (req, res) => {
    try {
        const eventId = parseInt(req.params.id);
        const event = await prisma.event.findUnique({ where: { id: eventId }, include: { registrations: true } });
        if (!event) {
            res.status(404).json({ error: 'Not found' });
            return;
        }
        const attendees = event.registrations.filter((r) => r.status === 'registered').length;
        if (event.maxAttendees && attendees >= event.maxAttendees) {
            res.status(422).json({ error: 'Event is full.' });
            return;
        }
        const existing = event.registrations.find((r) => r.userId === req.user.id);
        if (existing) {
            res.status(422).json({ error: 'Already registered.' });
            return;
        }
        await prisma.eventRegistration.create({ data: { eventId, userId: req.user.id, status: 'registered' } });
        res.json({ success: true });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
router.delete('/:id/unregister', authMiddleware, async (req, res) => {
    try {
        const eventId = parseInt(req.params.id);
        await prisma.eventRegistration.deleteMany({ where: { eventId, userId: req.user.id } });
        res.json({ success: true });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
export default router;
//# sourceMappingURL=events.js.map