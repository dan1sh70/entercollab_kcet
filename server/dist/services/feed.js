import prisma from '../config/database.js';
export async function logActivity(userId, type, subjectType, subjectId, metadata) {
    return prisma.activityFeedItem.create({
        data: {
            userId,
            type,
            subjectType: subjectType || null,
            subjectId: subjectId || null,
            metadata: metadata ? JSON.stringify(metadata) : null,
        },
    });
}
export async function getFeedForUser(userId, limit = 20) {
    const followingIds = (await prisma.userFollow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
    })).map((f) => f.followingId);
    return prisma.activityFeedItem.findMany({
        where: { userId: { in: [...followingIds, userId] } },
        include: { user: { select: { id: true, name: true, profilePhotoPath: true } } },
        orderBy: { createdAt: 'desc' },
        take: limit,
    });
}
//# sourceMappingURL=feed.js.map