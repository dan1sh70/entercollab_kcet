import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import projectRoutes from './routes/projects.js';
import profileRoutes from './routes/profile.js';
import chatRoutes from './routes/chat.js';
import collegeRoutes from './routes/colleges.js';
import feedRoutes from './routes/feed.js';
import searchRoutes from './routes/search.js';
import researchRoutes from './routes/research.js';
import eventRoutes from './routes/events.js';
import adminRoutes from './routes/admin.js';
import institutionRoutes from './routes/institution.js';
import notificationRoutes from './routes/notifications.js';
import aiRoutes from './routes/ai.js';
import kanbanRoutes from './routes/kanban.js';
import { setupSocket } from './socket/index.js';
import { setNotificationIo } from './services/notificationService.js';
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.NODE_ENV === 'production' ? false : 'http://localhost:5173',
        methods: ['GET', 'POST'],
    },
});
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/colleges', collegeRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/research', researchRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/institution', institutionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/kanban', kanbanRoutes);
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../../client/dist')));
    app.get('*', (_req, res) => {
        res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
    });
}
setupSocket(io);
setNotificationIo(io);
const PORT = Number(process.env.PORT) || 3001;
httpServer.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`[server] Port ${PORT} is already in use. Stop the other process (e.g. an old Node server) or set PORT in .env.\n` +
            `  Windows: netstat -ano | findstr :${PORT}  then  taskkill /PID <pid> /F`);
        process.exit(1);
    }
    throw err;
});
httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
export { io };
//# sourceMappingURL=index.js.map