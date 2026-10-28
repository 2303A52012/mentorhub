import prisma from '../config/prisma.js';

export const getAdminDashboard = async (req, res, next) => {
  try {
    const totalMentors = await prisma.user.count({ where: { role: 'MENTOR' } });
    const totalMentees = await prisma.user.count({ where: { role: 'MENTEE' } });
    const totalBatches = await prisma.batch.count();
    const tasksPublished = await prisma.task.count();

    const allAssignments = await prisma.menteeTask.findMany({
      include: {
        task: { select: { title: true, weekNo: true } }
      }
    });

    const totalAssignments = allAssignments.length;
    const approvedTasks = allAssignments.filter((a) => a.status === 'APPROVED').length;
    const awaitingReview = allAssignments.filter(
      (a) => a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW'
    ).length;
    const overdueTasks = allAssignments.filter((a) => a.status === 'OVERDUE').length;
    const inProgressTasks = allAssignments.filter((a) => a.status === 'IN_PROGRESS').length;

    const overallCompletionRate =
      totalAssignments > 0
        ? Math.round((approvedTasks / totalAssignments) * 100)
        : 0;

    const batches = await prisma.batch.findMany({
      include: {
        mentees: {
          include: {
            mentee: {
              include: { menteeTasks: true }
            }
          }
        }
      }
    });

    const batchPerformance = batches.map((b) => {
      const allBatchTasks = b.mentees.flatMap((m) => m.mentee.menteeTasks);
      const batchApproved = allBatchTasks.filter((t) => t.status === 'APPROVED').length;
      const rate =
        allBatchTasks.length > 0
          ? Math.round((batchApproved / allBatchTasks.length) * 100)
          : 0;

      return {
        _id: b.id,
        id: b.id,
        name: b.name,
        menteeCount: b.mentees.length,
        totalAssigned: allBatchTasks.length,
        approvedCount: batchApproved,
        completionRate: rate
      };
    });

    const recentSubmissions = await prisma.menteeTask.findMany({
      where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } },
      include: {
        mentee: { select: { id: true, name: true, email: true } },
        task: { select: { id: true, title: true, weekNo: true } }
      },
      orderBy: { submittedAt: 'desc' },
      take: 6
    });

    return res.status(200).json({
      success: true,
      stats: {
        totalMentors,
        totalMentees,
        totalBatches,
        tasksPublished,
        awaitingReview,
        overdueTasks,
        inProgressTasks,
        approvedTasks,
        overallCompletionRate
      },
      batchPerformance,
      recentSubmissions: recentSubmissions.map((s) => ({
        ...s,
        _id: s.id,
        menteeId: s.mentee ? { ...s.mentee, _id: s.mentee.id } : null,
        taskId: s.task ? { ...s.task, _id: s.task.id } : null
      }))
    });
  } catch (error) {
    next(error);
  }
};

export const getMentorDashboard = async (req, res, next) => {
  try {
    const mentorId = req.user.id || req.user._id;

    const assignments = await prisma.mentorMenteeAssignment.findMany({
      where: { mentorId, status: 'ACTIVE' },
      select: { menteeId: true }
    });

    const menteeIds = assignments.map((a) => a.menteeId);
    const totalMentees = menteeIds.length;

    const menteeTasks = await prisma.menteeTask.findMany({
      where: {
        OR: [{ reviewerId: mentorId }, { menteeId: { in: menteeIds } }]
      },
      include: {
        task: { select: { id: true, title: true, weekNo: true, lastDate: true } },
        mentee: { select: { id: true, name: true, email: true } }
      }
    });

    const totalTasks = menteeTasks.length;
    const approvedCount = menteeTasks.filter((t) => t.status === 'APPROVED').length;
    const awaitingReview = menteeTasks.filter(
      (t) => t.status === 'SUBMITTED' || t.status === 'UNDER_REVIEW'
    ).length;
    const overdueCount = menteeTasks.filter((t) => t.status === 'OVERDUE').length;
    const inProgressCount = menteeTasks.filter(
      (t) => t.status === 'IN_PROGRESS' || t.status === 'RESUBMISSION_REQUIRED'
    ).length;

    const avgCompletionRate =
      totalTasks > 0 ? Math.round((approvedCount / totalTasks) * 100) : 0;

    const menteeUsers = await prisma.user.findMany({
      where: { id: { in: menteeIds } },
      select: {
        id: true,
        name: true,
        email: true,
        menteeProfile: {
          select: {
            rollNumber: true,
            studentId: true,
            branch: true,
            section: true
          }
        },
        menteeBatches: {
          include: {
            batch: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    const atRiskMentees = [];
    const menteesList = [];
    for (const mentee of menteeUsers) {
      const studentTasks = menteeTasks.filter((mt) => mt.menteeId === mentee.id);
      const studentTotal = studentTasks.length;
      const studentApproved = studentTasks.filter((t) => t.status === 'APPROVED').length;
      const studentSubmitted = studentTasks.filter(
        (t) => t.status === 'SUBMITTED' || t.status === 'UNDER_REVIEW'
      ).length;
      const studentOverdue = studentTasks.filter((t) => t.status === 'OVERDUE').length;
      const rate =
        studentTotal > 0 ? Math.round((studentApproved / studentTotal) * 100) : 0;

      const batchName = mentee.menteeBatches?.[0]?.batch?.name || 'Assigned Cohort';

      menteesList.push({
        _id: mentee.id,
        id: mentee.id,
        name: mentee.name,
        email: mentee.email,
        rollNumber: mentee.menteeProfile?.rollNumber || '',
        studentId: mentee.menteeProfile?.studentId || '',
        branch: mentee.menteeProfile?.branch || 'CSE',
        section: mentee.menteeProfile?.section || 'A',
        batchName,
        totalTasks: studentTotal,
        approvedCount: studentApproved,
        submittedCount: studentSubmitted,
        overdueCount: studentOverdue,
        completionRate: rate
      });

      if ((studentTotal >= 2 && rate < 50) || studentOverdue >= 1) {
        atRiskMentees.push({
          _id: mentee.id,
          id: mentee.id,
          name: mentee.name,
          email: mentee.email,
          totalAssigned: studentTotal,
          completionRate: rate,
          overdueCount: studentOverdue,
          reason:
            studentOverdue >= 1
              ? `${studentOverdue} overdue task(s)`
              : `Low completion rate (${rate}%)`
        });
      }
    }

    const recentSubmissions = menteeTasks
      .filter((t) => t.status === 'SUBMITTED' || t.status === 'UNDER_REVIEW')
      .slice(0, 5)
      .map((t) => ({
        ...t,
        _id: t.id,
        menteeId: t.mentee ? { ...t.mentee, _id: t.mentee.id } : null,
        taskId: t.task ? { ...t.task, _id: t.task.id } : null
      }));

    return res.status(200).json({
      success: true,
      stats: {
        totalMentees,
        awaitingReview,
        overdueCount,
        inProgressCount,
        approvedCount,
        avgCompletionRate
      },
      atRiskMentees,
      recentSubmissions,
      mentees: menteesList
    });
  } catch (error) {
    next(error);
  }
};

export const getMenteeDashboard = async (req, res, next) => {
  try {
    const menteeId = req.user.id || req.user._id;

    const allTasks = await prisma.menteeTask.findMany({
      where: { menteeId },
      include: {
        task: { include: { problems: true } },
        reviewer: { select: { id: true, name: true, email: true } },
        problemProgress: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const presentTasks = allTasks.filter((t) => t.status !== 'APPROVED');
    const completedTasks = allTasks.filter((t) => t.status === 'APPROVED');

    const totalAssigned = allTasks.length;
    const approvedCount = completedTasks.length;
    const completionRate =
      totalAssigned > 0 ? Math.round((approvedCount / totalAssigned) * 100) : 0;

    let totalNotesSaved = 0;
    allTasks.forEach((t) => {
      (t.problemProgress || []).forEach((p) => {
        if (p.notes && p.notes.trim().length > 0) {
          totalNotesSaved++;
        }
      });
    });

    const taskIds = allTasks.map((t) => t.id);
    const recentReviews = await prisma.taskReview.findMany({
      where: { menteeTaskId: { in: taskIds } },
      include: {
        reviewer: { select: { id: true, name: true, email: true } }
      },
      orderBy: { reviewedAt: 'desc' },
      take: 3
    });

    const earnedAchievements = await prisma.menteeAchievement.findMany({
      where: { menteeId },
      include: { achievement: true }
    });

    // Latest Problem of the Day for student's batch
    const menteeBatches = await prisma.batchMentee.findMany({
      where: { menteeId },
      select: { batchId: true }
    });
    const batchIds = menteeBatches.map(b => b.batchId);

    let latestDailyProblem = null;
    if (batchIds.length > 0) {
      const dp = await prisma.dailyProblem.findFirst({
        where: { batchId: { in: batchIds } },
        orderBy: { date: 'desc' },
        include: {
          postedBy: { select: { id: true, name: true } },
          batch: { select: { id: true, name: true } },
          submissions: {
            where: { studentId: menteeId },
            take: 1
          }
        }
      });
      if (dp) {
        latestDailyProblem = {
          ...dp,
          isSolved: dp.submissions && dp.submissions.length > 0,
          mySubmission: dp.submissions?.[0] || null,
          submissions: undefined
        };
      }
    }

    const formatTask = (t) => ({
      ...t,
      _id: t.id,
      taskId: {
        ...t.task,
        _id: t.task.id,
        problems: t.task.problems.map((p) => ({ ...p, _id: p.id }))
      },
      reviewerId: t.reviewer ? { ...t.reviewer, _id: t.reviewer.id } : null
    });

    return res.status(200).json({
      success: true,
      stats: {
        presentCount: presentTasks.length,
        completedCount: completedTasks.length,
        totalAssigned,
        completionRate,
        totalNotesSaved,
        achievementsCount: earnedAchievements.length
      },
      latestDailyProblem,
      presentTasks: presentTasks.slice(0, 4).map(formatTask),
      completedTasks: completedTasks.slice(0, 4).map(formatTask),
      recentReviews: recentReviews.map((r) => ({
        ...r,
        _id: r.id,
        reviewerId: r.reviewer ? { ...r.reviewer, _id: r.reviewer.id } : null
      })),
      earnedAchievements: earnedAchievements.map((ea) => ({
        ...ea,
        _id: ea.id,
        achievementId: { ...ea.achievement, _id: ea.achievement.id }
      }))
    });
  } catch (error) {
    next(error);
  }
};
