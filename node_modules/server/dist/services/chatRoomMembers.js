import prisma from '../config/database.js';
import { emitChatRoomsRefresh } from './notificationService.js';
/** Owner + all approved collaborators are members of the project chat room. */
export async function syncProjectChatMembers(roomId, postId) {
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { userId: true } });
    if (!post)
        return;
    const memberIds = new Set([post.userId]);
    const approved = await prisma.projectRequest.findMany({
        where: { postId, approved: { not: 0 } },
        select: { userId: true },
    });
    for (const r of approved)
        memberIds.add(r.userId);
    for (const uid of memberIds) {
        await prisma.chatRoomUser.upsert({
            where: { chatRoomId_userId: { chatRoomId: roomId, userId: uid } },
            create: { chatRoomId: roomId, userId: uid },
            update: {},
        });
    }
    for (const uid of memberIds) {
        emitChatRoomsRefresh(uid);
    }
}
//# sourceMappingURL=chatRoomMembers.js.map