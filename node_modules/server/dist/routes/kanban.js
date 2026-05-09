import { Router } from 'express';
import prisma from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
const router = Router();
router.get('/projects/:projectId/board', authMiddleware, async (req, res) => {
    try {
        const projectId = parseInt(req.params.projectId);
        const project = await prisma.post.findFirst({ where: { id: projectId, type: 'project' } });
        if (!project) {
            res.status(404).json({ error: 'Project not found' });
            return;
        }
        let board = await prisma.projectBoard.findFirst({ where: { projectId } });
        if (!board) {
            board = await prisma.projectBoard.create({ data: { projectId, name: 'Main Board' } });
            await prisma.boardColumn.createMany({
                data: [
                    { boardId: board.id, name: 'To Do', orderIndex: 0, color: 'bg-gray-100' },
                    { boardId: board.id, name: 'In Progress', orderIndex: 1, color: 'bg-blue-50' },
                    { boardId: board.id, name: 'Done', orderIndex: 2, color: 'bg-green-50' },
                ],
            });
        }
        const fullBoard = await prisma.projectBoard.findUnique({
            where: { id: board.id },
            include: {
                columns: {
                    orderBy: { orderIndex: 'asc' },
                    include: {
                        tasks: {
                            orderBy: { orderIndex: 'asc' },
                            include: { assignee: { select: { id: true, name: true, profilePhotoPath: true } } },
                        },
                    },
                },
            },
        });
        res.json({ project, board: fullBoard });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
router.post('/boards/:boardId/tasks', authMiddleware, async (req, res) => {
    try {
        const { title, column_id } = req.body;
        if (!title || !column_id) {
            res.status(422).json({ error: 'Title and column_id are required.' });
            return;
        }
        const task = await prisma.boardTask.create({
            data: { columnId: parseInt(column_id), title, userId: req.user.id, orderIndex: 999 },
            include: { assignee: { select: { id: true, name: true, profilePhotoPath: true } } },
        });
        res.json(task);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
router.post('/tasks/:taskId/move', authMiddleware, async (req, res) => {
    try {
        const { column_id, order_index } = req.body;
        await prisma.boardTask.update({
            where: { id: parseInt(req.params.taskId) },
            data: { columnId: parseInt(column_id), orderIndex: parseInt(order_index) },
        });
        res.json({ success: true });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
export default router;
//# sourceMappingURL=kanban.js.map