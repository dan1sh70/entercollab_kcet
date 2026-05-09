import jwt from 'jsonwebtoken';
export function setupSocket(io) {
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token)
            return next(new Error('Authentication required'));
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
            const uid = typeof decoded.userId === 'number' ? decoded.userId : Number(decoded.userId);
            if (!Number.isFinite(uid))
                return next(new Error('Invalid token'));
            socket.userId = uid;
            next();
        }
        catch {
            next(new Error('Invalid token'));
        }
    });
    io.on('connection', (socket) => {
        const userId = socket.userId;
        socket.join(`user:${userId}`);
        socket.on('join:room', (roomId) => {
            socket.join(`room:${roomId}`);
        });
        socket.on('leave:room', (roomId) => {
            socket.leave(`room:${roomId}`);
        });
        socket.on('join:project', (postId) => {
            if (typeof postId === 'number' && !Number.isNaN(postId))
                socket.join(`project:${postId}`);
        });
        socket.on('leave:project', (postId) => {
            if (typeof postId === 'number' && !Number.isNaN(postId))
                socket.leave(`project:${postId}`);
        });
        socket.on('message:send', (data) => {
            socket.to(`room:${data.roomId}`).emit('message:receive', data);
        });
        socket.on('disconnect', () => {
            socket.leave(`user:${userId}`);
        });
    });
}
//# sourceMappingURL=index.js.map