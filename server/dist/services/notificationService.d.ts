import type { Server } from 'socket.io';
export declare function setNotificationIo(server: Server): void;
export type NotificationData = {
    message: string;
    link?: string;
    type: string;
    actorId?: number;
    actorName?: string;
    [key: string]: unknown;
};
/** Persist notification and push to recipient's socket room `user:{id}`. */
export declare function createNotification(opts: {
    recipientUserId: number;
    type: string;
    message: string;
    link?: string;
    actorId?: number;
    actorName?: string;
    meta?: Record<string, unknown>;
}): Promise<{
    id: string;
    createdAt: Date;
    updatedAt: Date;
    data: string;
    type: string;
    notifiableType: string;
    readAt: Date | null;
    notifiableId: number;
} | null>;
/** Remove the like notification for this actor + post (when the like is withdrawn). */
export declare function removeProjectLikeNotification(opts: {
    recipientUserId: number;
    postId: number;
    actorId: number;
}): Promise<string | null>;
/** Real-time updates for everyone viewing a project page (room `project:{postId}`). */
export declare function emitProjectLikes(postId: number, payload: {
    likes_count: number;
    actorUserId: number;
    liked: boolean;
}): void;
export declare function emitProjectComment(postId: number, comment: unknown): void;
/** Tell viewers to pull fresh project payload (requests/members, etc.). */
export declare function emitProjectRefresh(postId: number): void;
/** Push each room member (user:{id}) so delivery works without relying on join:room. */
export declare function emitChatMessage(roomId: number, message: unknown): Promise<void>;
/** Client should refetch GET /api/chat (e.g. after approval or room sync). */
export declare function emitChatRoomsRefresh(userId: number): void;
//# sourceMappingURL=notificationService.d.ts.map