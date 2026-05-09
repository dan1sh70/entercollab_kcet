/**
 * One-time / maintenance: ensure project chat rooms exist and chat_room_user
 * matches approved collaborators (fixes data from before approve auto-created rooms).
 *
 * Run from collab-node: npm run db:backfill-chat-members --workspace=server
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
import prisma from '../config/database.js';
import { syncProjectChatMembers } from '../services/chatRoomMembers.js';
async function main() {
    const posts = await prisma.post.findMany({
        where: {
            type: 'project',
            deletedAt: null,
            requests: { some: { approved: { not: 0 } } },
        },
        select: { id: true, title: true },
        orderBy: { id: 'asc' },
    });
    let createdRooms = 0;
    let synced = 0;
    for (const post of posts) {
        let room = await prisma.chatRoom.findFirst({
            where: { postId: post.id },
            orderBy: { id: 'asc' },
        });
        if (!room) {
            room = await prisma.chatRoom.create({
                data: { name: post.title || 'Project chat', postId: post.id },
            });
            createdRooms += 1;
        }
        await syncProjectChatMembers(room.id, post.id);
        synced += 1;
    }
    console.log(`Backfill done: ${posts.length} project(s) with approved collaborator(s); ` +
        `${createdRooms} new chat room(s); ${synced} sync run(s).`);
}
main()
    .then(async () => prisma.$disconnect())
    .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
//# sourceMappingURL=backfill_project_chat_members.js.map