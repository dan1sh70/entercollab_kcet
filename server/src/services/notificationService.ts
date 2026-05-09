import type { Server } from 'socket.io';
import prisma from '../config/database.js';

let io: Server | null = null;

export function setNotificationIo(server: Server) {
  io = server;
}

export type NotificationData = {
  message: string;
  link?: string;
  type: string;
  actorId?: number;
  actorName?: string;
  [key: string]: unknown;
};

/** Persist notification and push to recipient's socket room `user:{id}`. */
export async function createNotification(opts: {
  recipientUserId: number;
  type: string;
  message: string;
  link?: string;
  actorId?: number;
  actorName?: string;
  meta?: Record<string, unknown>;
}) {
  const { recipientUserId, actorId } = opts;
  if (actorId != null && recipientUserId === actorId) {
    return null;
  }

  const payload: NotificationData = {
    message: opts.message,
    link: opts.link ?? '',
    type: opts.type,
    actorId: opts.actorId,
    actorName: opts.actorName,
    ...opts.meta,
  };

  const row = await prisma.notification.create({
    data: {
      type: opts.type,
      notifiableType: 'App\\Notification',
      notifiableId: recipientUserId,
      data: JSON.stringify(payload),
    },
  });

  io?.to(`user:${recipientUserId}`).emit('notification:new', {
    id: row.id,
    type: row.type,
    data: payload,
    readAt: row.readAt,
    createdAt: row.createdAt,
  });

  return row;
}

/** Remove the like notification for this actor + post (when the like is withdrawn). */
export async function removeProjectLikeNotification(opts: {
  recipientUserId: number;
  postId: number;
  actorId: number;
}) {
  const { recipientUserId, postId, actorId } = opts;

  const candidates = await prisma.notification.findMany({
    where: {
      notifiableId: recipientUserId,
      type: 'project_like',
    },
    select: { id: true, data: true, readAt: true },
  });

  for (const n of candidates) {
    try {
      const d = JSON.parse(n.data || '{}') as { postId?: number; actorId?: number };
      if (d.postId === postId && d.actorId === actorId) {
        await prisma.notification.delete({ where: { id: n.id } });
        io?.to(`user:${recipientUserId}`).emit('notification:removed', {
          id: n.id,
          wasUnread: !n.readAt,
        });
        return n.id;
      }
    } catch {
      /* skip malformed */
    }
  }
  return null;
}

/** Real-time updates for everyone viewing a project page (room `project:{postId}`). */
export function emitProjectLikes(
  postId: number,
  payload: { likes_count: number; actorUserId: number; liked: boolean }
) {
  io?.to(`project:${postId}`).emit('project:likes', { postId, ...payload });
}

export function emitProjectComment(postId: number, comment: unknown) {
  io?.to(`project:${postId}`).emit('project:comment', { postId, comment });
}

/** Tell viewers to pull fresh project payload (requests/members, etc.). */
export function emitProjectRefresh(postId: number) {
  io?.to(`project:${postId}`).emit('project:refresh', { postId });
}

/** Push each room member (user:{id}) so delivery works without relying on join:room. */
export async function emitChatMessage(roomId: number, message: unknown) {
  if (!io) return;
  const members = await prisma.chatRoomUser.findMany({
    where: { chatRoomId: roomId },
    select: { userId: true },
  });
  const payload = { roomId, message };
  for (const m of members) {
    io.to(`user:${m.userId}`).emit('message:receive', payload);
  }
}

/** Client should refetch GET /api/chat (e.g. after approval or room sync). */
export function emitChatRoomsRefresh(userId: number) {
  io?.to(`user:${userId}`).emit('chat:rooms:refresh');
}
