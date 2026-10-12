import prisma from '../config/prisma.js';

export const getLeaderboard = async (req, res, next) => {
  try {
    const mentees = await prisma.user.findMany({
      where: {
        role: 'MENTEE',
        accountStatus: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        email: true,
        menteeProfile: true,
        menteeTasks: {
          where: { status: 'APPROVED' },
          include: {
            reviews: {
              where: { score: { not: null } }
            }
          }
        },
        submissions: {
          where: { submittedLate: false }
        },
        achievements: true
      }
    });

    const leaderboard = mentees.map((mentee) => {
      const approvedCount = mentee.menteeTasks.length;
      const onTimeCount = mentee.submissions.length;
      const achievementsCount = mentee.achievements.length;

      let totalScore = 0;
      mentee.menteeTasks.forEach((t) => {
        t.reviews.forEach((r) => {
          totalScore += r.score || 0;
        });
      });

      const points =
        approvedCount * 100 +
        onTimeCount * 20 +
        Math.round(totalScore * 10) +
        achievementsCount * 50;

      return {
        _id: mentee.id,
        id: mentee.id,
        name: mentee.name,
        email: mentee.email,
        rollNumber: mentee.menteeProfile?.rollNumber || 'N/A',
        branch: mentee.menteeProfile?.branch || 'CSE',
        approvedCount,
        onTimeCount,
        points,
        achievementsCount
      };
    });

    // Sort descending by points
    leaderboard.sort((a, b) => b.points - a.points);

    // Add rank
    const ranked = leaderboard.map((item, idx) => ({
      ...item,
      rank: idx + 1
    }));

    return res.status(200).json({
      success: true,
      leaderboard: ranked
    });
  } catch (error) {
    next(error);
  }
};

export const getAchievements = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;

    const allAchievements = await prisma.achievement.findMany({
      where: { isActive: true }
    });

    const unlocked = await prisma.menteeAchievement.findMany({
      where: { menteeId: userId }
    });

    const unlockedMap = new Map(unlocked.map((u) => [u.achievementId, u.unlockedAt]));

    const achievementsWithStatus = allAchievements.map((ach) => ({
      _id: ach.id,
      id: ach.id,
      name: ach.name,
      code: ach.code,
      description: ach.description,
      icon: ach.icon,
      points: ach.points,
      isUnlocked: unlockedMap.has(ach.id),
      unlockedAt: unlockedMap.get(ach.id) || null
    }));

    return res.status(200).json({
      success: true,
      achievements: achievementsWithStatus
    });
  } catch (error) {
    next(error);
  }
};
