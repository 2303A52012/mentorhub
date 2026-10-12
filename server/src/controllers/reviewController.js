import prisma from '../config/prisma.js';

export const getTaskReviews = async (req, res, next) => {
  try {
    const { status, weekNo, menteeId } = req.query;
    const userId = req.user.id || req.user._id;

    let where = {};

    if (req.user.role === 'MENTOR') {
      const myAssignments = await prisma.mentorMenteeAssignment.findMany({
        where: { mentorId: userId, status: 'ACTIVE' },
        select: { menteeId: true }
      });
      const menteeIds = myAssignments.map((a) => a.menteeId);

      where = {
        OR: [{ reviewerId: userId }, { menteeId: { in: menteeIds } }]
      };
    }

    if (status) {
      if (status === 'AWAITING_REVIEW') {
        where.status = { in: ['SUBMITTED', 'UNDER_REVIEW'] };
      } else {
        where.status = status;
      }
    }

    if (menteeId) {
      where.menteeId = menteeId;
    }

    const menteeTasks = await prisma.menteeTask.findMany({
      where,
      include: {
        task: {
          include: { problems: true }
        },
        mentee: {
          select: { id: true, name: true, email: true, menteeProfile: true }
        },
        reviewer: { select: { id: true, name: true, email: true } },
        submissions: {
          orderBy: { version: 'desc' },
          take: 1
        },
        reviews: {
          orderBy: { reviewedAt: 'desc' },
          take: 1
        }
      },
      orderBy: [{ submittedAt: 'desc' }, { updatedAt: 'desc' }]
    });

    let results = menteeTasks.map((mt) => ({
      _id: mt.id,
      id: mt.id,
      taskId: {
        ...mt.task,
        _id: mt.task.id,
        problems: mt.task.problems.map((p) => ({ ...p, _id: p.id }))
      },
      menteeId: {
        ...mt.mentee,
        _id: mt.mentee.id,
        profile: mt.mentee.menteeProfile || {}
      },
      reviewerId: mt.reviewer ? { ...mt.reviewer, _id: mt.reviewer.id } : null,
      status: mt.status,
      assignedAt: mt.assignedAt,
      submittedAt: mt.submittedAt,
      approvedAt: mt.approvedAt,
      latestSubmission: mt.submissions[0] ? { ...mt.submissions[0], _id: mt.submissions[0].id } : null,
      latestReview: mt.reviews[0] ? { ...mt.reviews[0], _id: mt.reviews[0].id } : null
    }));

    if (weekNo) {
      results = results.filter(
        (r) => r.taskId && Number(r.taskId.weekNo) === Number(weekNo)
      );
    }

    return res.status(200).json({
      success: true,
      count: results.length,
      reviews: results
    });
  } catch (error) {
    next(error);
  }
};

export const getTaskReviewById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const menteeTask = await prisma.menteeTask.findUnique({
      where: { id },
      include: {
        task: {
          include: { problems: true }
        },
        mentee: {
          select: {
            id: true,
            name: true,
            email: true,
            menteeProfile: true,
            codingProfile: true
          }
        },
        reviewer: { select: { id: true, name: true, email: true } },
        submissions: {
          orderBy: { version: 'desc' }
        },
        reviews: {
          orderBy: { reviewedAt: 'desc' },
          include: {
            reviewer: { select: { id: true, name: true, email: true } }
          }
        },
        problemProgress: true
      }
    });

    if (!menteeTask) {
      return res.status(404).json({
        success: false,
        message: 'Task assignment not found.'
      });
    }

    const formattedTask = {
      _id: menteeTask.id,
      id: menteeTask.id,
      taskId: {
        ...menteeTask.task,
        _id: menteeTask.task.id,
        problems: menteeTask.task.problems.map((p) => ({ ...p, _id: p.id }))
      },
      menteeId: {
        ...menteeTask.mentee,
        _id: menteeTask.mentee.id,
        profile: menteeTask.mentee.menteeProfile || {}
      },
      reviewerId: menteeTask.reviewer ? { ...menteeTask.reviewer, _id: menteeTask.reviewer.id } : null,
      status: menteeTask.status,
      assignedAt: menteeTask.assignedAt,
      submittedAt: menteeTask.submittedAt,
      approvedAt: menteeTask.approvedAt,
      problemProgress: menteeTask.problemProgress.map((p) => ({ ...p, _id: p.id }))
    };

    return res.status(200).json({
      success: true,
      menteeTask: formattedTask,
      menteeProfile: menteeTask.mentee?.menteeProfile || {},
      codingProfile: menteeTask.mentee?.codingProfile || {},
      submissions: menteeTask.submissions.map((s) => ({ ...s, _id: s.id })),
      reviewHistory: menteeTask.reviews.map((r) => ({ ...r, _id: r.id }))
    });
  } catch (error) {
    next(error);
  }
};

export const submitReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { decision, overallFeedback, score, problemReviews } = req.body;
    const reviewerId = req.user.id || req.user._id;

    if (!decision || !['APPROVED', 'RESUBMISSION_REQUIRED'].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: 'Decision must be either APPROVED or RESUBMISSION_REQUIRED.'
      });
    }

    if (decision === 'RESUBMISSION_REQUIRED' && !overallFeedback) {
      return res.status(400).json({
        success: false,
        message: 'Overall feedback is required when requesting resubmission.'
      });
    }

    const menteeTask = await prisma.menteeTask.findUnique({
      where: { id },
      include: { task: true }
    });

    if (!menteeTask) {
      return res.status(404).json({
        success: false,
        message: 'Task assignment not found.'
      });
    }

    const latestSubmission = await prisma.taskSubmission.findFirst({
      where: { menteeTaskId: id },
      orderBy: { version: 'desc' }
    });

    if (!latestSubmission) {
      return res.status(400).json({
        success: false,
        message: 'No submission recorded for this task to review.'
      });
    }

    const reviewRecord = await prisma.taskReview.create({
      data: {
        menteeTaskId: id,
        submissionId: latestSubmission.id,
        reviewerId,
        decision,
        overallFeedback: overallFeedback || '',
        score: score !== undefined && score !== null ? Number(score) : null,
        problemReviews: Array.isArray(problemReviews) ? problemReviews : [],
        reviewedAt: new Date()
      }
    });

    let updatedMenteeTask;

    if (decision === 'APPROVED') {
      updatedMenteeTask = await prisma.menteeTask.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedAt: new Date(),
          reviewerId
        }
      });

      await prisma.notification.create({
        data: {
          userId: menteeTask.menteeId,
          type: 'REVIEW_APPROVED',
          title: `Task Approved: Week ${menteeTask.task.weekNo}`,
          message: `Great job! Your submission for "${menteeTask.task.title}" was approved.${score ? ` Score: ${score}/10.` : ''}`,
          link: `/mentee/tasks/completed`
        }
      });

      await checkAndAwardAchievements(menteeTask.menteeId);
    } else {
      updatedMenteeTask = await prisma.menteeTask.update({
        where: { id },
        data: {
          status: 'RESUBMISSION_REQUIRED',
          reviewerId
        }
      });

      await prisma.notification.create({
        data: {
          userId: menteeTask.menteeId,
          type: 'RESUBMISSION_REQUESTED',
          title: `Changes Requested: Week ${menteeTask.task.weekNo}`,
          message: `Your reviewer requested updates for "${menteeTask.task.title}": ${overallFeedback}`,
          link: `/mentee/tasks/${id}`
        }
      });
    }

    await prisma.auditLog.create({
      data: {
        actorId: reviewerId,
        action: 'REVIEW_TASK',
        resourceType: 'MenteeTask',
        resourceId: id,
        details: {
          decision,
          score,
          submissionVersion: latestSubmission.version
        }
      }
    });

    return res.status(200).json({
      success: true,
      message:
        decision === 'APPROVED'
          ? 'Task approved and moved to completed.'
          : 'Resubmission requested and mentee notified.',
      review: { ...reviewRecord, _id: reviewRecord.id },
      menteeTask: { ...updatedMenteeTask, _id: updatedMenteeTask.id }
    });
  } catch (error) {
    next(error);
  }
};

const checkAndAwardAchievements = async (menteeId) => {
  try {
    const approvedTasksCount = await prisma.menteeTask.count({
      where: {
        menteeId,
        status: 'APPROVED'
      }
    });

    if (approvedTasksCount >= 1) {
      await unlockAchievement(menteeId, 'FIRST_TASK_APPROVED', 'First Task Approved');
    }

    if (approvedTasksCount >= 3) {
      await unlockAchievement(menteeId, 'CONSISTENT_LEARNER', 'Consistent Learner');
    }

    const onTimeSubmissions = await prisma.taskSubmission.count({
      where: {
        menteeId,
        submittedLate: false
      }
    });
    if (onTimeSubmissions >= 1) {
      await unlockAchievement(menteeId, 'ON_TIME_PERFORMER', 'On-Time Performer');
    }
  } catch (err) {
    console.error('Error awarding achievements:', err);
  }
};

const unlockAchievement = async (menteeId, code, defaultName) => {
  let achievement = await prisma.achievement.findUnique({ where: { code } });
  if (!achievement) {
    achievement = await prisma.achievement.create({
      data: {
        name: defaultName,
        code,
        description: `Awarded for milestone: ${defaultName}`,
        icon: 'Award',
        points: 50
      }
    });
  }

  const existing = await prisma.menteeAchievement.findUnique({
    where: {
      menteeId_achievementId: {
        menteeId,
        achievementId: achievement.id
      }
    }
  });

  if (!existing) {
    await prisma.menteeAchievement.create({
      data: {
        menteeId,
        achievementId: achievement.id
      }
    });

    await prisma.notification.create({
      data: {
        userId: menteeId,
        type: 'ACHIEVEMENT_UNLOCKED',
        title: '🏆 Achievement Unlocked!',
        message: `You earned the "${achievement.name}" badge (+${achievement.points} pts)!`,
        link: '/mentee/achievements'
      }
    });
  }
};

export const getMenteeProgressDetail = async (req, res, next) => {
  try {
    const { id } = req.params;

    const tasks = await prisma.menteeTask.findMany({
      where: { menteeId: id },
      include: {
        task: {
          include: { problems: true }
        },
        reviewer: { select: { id: true, name: true, email: true } },
        reviews: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const reviews = tasks.flatMap((t) => t.reviews);
    const approvedCount = tasks.filter((t) => t.status === 'APPROVED').length;
    const totalCount = tasks.length;
    const completionRate =
      totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;

    const formattedTasks = tasks.map((t) => ({
      ...t,
      _id: t.id,
      taskId: {
        ...t.task,
        _id: t.task.id,
        problems: t.task.problems.map((p) => ({ ...p, _id: p.id }))
      },
      reviewerId: t.reviewer ? { ...t.reviewer, _id: t.reviewer.id } : null
    }));

    return res.status(200).json({
      success: true,
      stats: {
        totalTasks: totalCount,
        approvedTasks: approvedCount,
        completionRate
      },
      tasks: formattedTasks,
      reviews: reviews.map((r) => ({ ...r, _id: r.id }))
    });
  } catch (error) {
    next(error);
  }
};
