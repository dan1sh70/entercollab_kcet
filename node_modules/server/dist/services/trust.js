import prisma from '../config/database.js';
const POINTS = {
    project_create: 10,
    request_approved: 5,
    project_completed: 50,
    endorsement_received: 15,
    endorsement_given: 2,
};
export async function awardPoints(userId, action, referenceType, referenceId) {
    const points = POINTS[action] ?? 0;
    if (points === 0)
        return;
    await prisma.trustPoint.create({
        data: { userId, action, points, referenceType, referenceId },
    });
    await checkBadges(userId);
}
export async function endorse(endorserId, endorsedId, skill, comment, projectId) {
    if (endorserId === endorsedId) {
        throw new Error('You cannot endorse yourself.');
    }
    const endorsement = await prisma.endorsement.create({
        data: { endorserId, endorsedId, skill, comment, projectId },
    });
    await awardPoints(endorsedId, 'endorsement_received', 'Endorsement', endorsement.id);
    await awardPoints(endorserId, 'endorsement_given', 'Endorsement', endorsement.id);
    return endorsement;
}
async function checkBadges(userId) {
    const totalPoints = await prisma.trustPoint.aggregate({
        where: { userId },
        _sum: { points: true },
    });
    const total = totalPoints._sum.points || 0;
    const eligibleBadges = await prisma.badge.findMany({
        where: { pointsRequired: { lte: total } },
    });
    const existingBadgeIds = (await prisma.badgeUser.findMany({
        where: { userId },
        select: { badgeId: true },
    })).map((b) => b.badgeId);
    for (const badge of eligibleBadges) {
        if (!existingBadgeIds.includes(badge.id)) {
            await prisma.badgeUser.create({
                data: { badgeId: badge.id, userId },
            });
        }
    }
}
//# sourceMappingURL=trust.js.map