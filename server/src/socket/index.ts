import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

export function setupSocket(io: Server) {
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: number | string };
      const uid = typeof decoded.userId === 'number' ? decoded.userId : Number(decoded.userId);
      if (!Number.isFinite(uid)) return next(new Error('Invalid token'));
      (socket as any).userId = uid;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;
    socket.join(`user:${userId}`);

    socket.on('join:room', (roomId: number) => {
      socket.join(`room:${roomId}`);
    });

    socket.on('leave:room', (roomId: number) => {
      socket.leave(`room:${roomId}`);
    });

    socket.on('join:project', (postId: number) => {
      if (typeof postId === 'number' && !Number.isNaN(postId)) socket.join(`project:${postId}`);
    });

    socket.on('leave:project', (postId: number) => {
      if (typeof postId === 'number' && !Number.isNaN(postId)) socket.leave(`project:${postId}`);
    });

    socket.on('message:send', (data: { roomId: number; content: string; user: any }) => {
      socket.to(`room:${data.roomId}`).emit('message:receive', data);
    });

    socket.on('disconnect', () => {
      socket.leave(`user:${userId}`);
    });
  });
}
