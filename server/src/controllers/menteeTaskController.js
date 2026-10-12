import prisma from '../config/prisma.js';

export const getPresentTasks = async (req, res, next) => {
  try {
    const menteeId = req.user.id || req.user._id;

    const tasks = await prisma.menteeTask.findMany({
      where: {
        menteeId,
        status: { not: 'APPROVED' }
      },
      include: {
        task: {
          include: {
            problems: { orderBy: { position: 'asc' } }
          }
        },
        reviewer: { select: { id: true, name: true, email: true } },
        problemProgress: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const now = new Date();
    const updatedTasks = tasks.map((mt) => {
      const isPastDeadline = mt.task && new Date(mt.task.lastDate) < now;
      let effectiveStatus = mt.status;

      if (
        isPastDeadline &&
        (mt.status === 'IN_PROGRESS' || mt.status === 'UPCOMING')
      ) {
        effectiveStatus = 'OVERDUE';
      }

      const totalProblems = mt.task?.problems?.length || 0;
      const savedCount = (mt.problemProgress || []).filter(
        (p) => p.notes && p.notes.trim().length > 0
      ).length;

      return {
        _id: mt.id,
        id: mt.id,
        taskId: {
          ...mt.task,
          _id: mt.task.id,
          problems: mt.task.problems.map((p) => ({ ...p, _id: p.id }))
        },
        reviewerId: mt.reviewer ? { ...mt.reviewer, _id: mt.reviewer.id } : null,
        status: effectiveStatus,
        assignedAt: mt.assignedAt,
        submittedAt: mt.submittedAt,
        problemProgress: mt.problemProgress.map((p) => ({ ...p, _id: p.id })),
        totalProblems,
        savedCount
      };
    });

    return res.status(200).json({
      success: true,
      count: updatedTasks.length,
      tasks: updatedTasks
    });
  } catch (error) {
    next(error);
  }
};

export const getCompletedTasks = async (req, res, next) => {
  try {
    const menteeId = req.user.id || req.user._id;

    const completed = await prisma.menteeTask.findMany({
      where: {
        menteeId,
        status: 'APPROVED'
      },
      include: {
        task: {
          include: {
            problems: { orderBy: { position: 'asc' } }
          }
        },
        reviewer: { select: { id: true, name: true, email: true } },
        reviews: {
          orderBy: { reviewedAt: 'desc' },
          take: 1,
          include: {
            reviewer: { select: { id: true, name: true, email: true } }
          }
        }
      },
      orderBy: { approvedAt: 'desc' }
    });

    const tasksWithReviews = completed.map((mt) => ({
      _id: mt.id,
      id: mt.id,
      taskId: {
        ...mt.task,
        _id: mt.task.id,
        problems: mt.task.problems.map((p) => ({ ...p, _id: p.id }))
      },
      reviewerId: mt.reviewer ? { ...mt.reviewer, _id: mt.reviewer.id } : null,
      status: mt.status,
      assignedAt: mt.assignedAt,
      submittedAt: mt.submittedAt,
      approvedAt: mt.approvedAt,
      latestReview: mt.reviews[0] ? { ...mt.reviews[0], _id: mt.reviews[0].id } : null
    }));

    return res.status(200).json({
      success: true,
      count: tasksWithReviews.length,
      tasks: tasksWithReviews
    });
  } catch (error) {
    next(error);
  }
};

export const getMenteeTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;

    let menteeTask = await prisma.menteeTask.findUnique({
      where: { id },
      include: {
        task: {
          include: {
            problems: { orderBy: { position: 'asc' } },
            createdBy: { select: { id: true, name: true, email: true } }
          }
        },
        reviewer: { select: { id: true, name: true, email: true } },
        problemProgress: true,
        reviews: {
          orderBy: { reviewedAt: 'desc' },
          include: {
            reviewer: { select: { id: true, name: true, email: true } }
          }
        },
        submissions: {
          orderBy: { version: 'desc' }
        }
      }
    });

    if (!menteeTask) {
      // Fallback: check if id is a parent Task ID
      menteeTask = await prisma.menteeTask.findFirst({
        where: {
          taskId: id,
          ...(req.user.role === 'MENTEE' ? { menteeId: userId } : {})
        },
        include: {
          task: {
            include: {
              problems: { orderBy: { position: 'asc' } },
              createdBy: { select: { id: true, name: true, email: true } }
            }
          },
          reviewer: { select: { id: true, name: true, email: true } },
          problemProgress: true,
          reviews: {
            orderBy: { reviewedAt: 'desc' },
            include: {
              reviewer: { select: { id: true, name: true, email: true } }
            }
          },
          submissions: {
            orderBy: { version: 'desc' }
          }
        }
      });
    }

    if (!menteeTask) {
      return res.status(404).json({
        success: false,
        message: 'Task assignment not found.'
      });
    }

    if (req.user.role === 'MENTEE' && menteeTask.menteeId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied.'
      });
    }

    const formatted = {
      _id: menteeTask.id,
      id: menteeTask.id,
      menteeId: menteeTask.menteeId,
      status: menteeTask.status,
      assignedAt: menteeTask.assignedAt,
      submittedAt: menteeTask.submittedAt,
      approvedAt: menteeTask.approvedAt,
      taskId: {
        ...menteeTask.task,
        _id: menteeTask.task.id,
        problems: menteeTask.task.problems.map((p) => ({ ...p, _id: p.id }))
      },
      reviewerId: menteeTask.reviewer ? { ...menteeTask.reviewer, _id: menteeTask.reviewer.id } : null,
      problemProgress: menteeTask.problemProgress.map((p) => ({ ...p, _id: p.id }))
    };

    return res.status(200).json({
      success: true,
      menteeTask: formatted,
      reviews: menteeTask.reviews.map((r) => ({ ...r, _id: r.id })),
      submissions: menteeTask.submissions.map((s) => ({ ...s, _id: s.id }))
    });
  } catch (error) {
    next(error);
  }
};

export const saveProblemNotes = async (req, res, next) => {
  try {
    const { id, problemId } = req.params;
    const {
      notes,
      approach,
      timeComplexity,
      spaceComplexity,
      submissionUrl,
      sourceCode,
      language
    } = req.body;
    const userId = req.user.id || req.user._id;

    let menteeTask = await prisma.menteeTask.findUnique({
      where: { id },
      include: { problemProgress: true }
    });

    if (!menteeTask) {
      menteeTask = await prisma.menteeTask.findFirst({
        where: { taskId: id, menteeId: userId },
        include: { problemProgress: true }
      });
    }

    if (!menteeTask) {
      return res.status(404).json({
        success: false,
        message: 'Task assignment not found.'
      });
    }

    if (menteeTask.menteeId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only save notes for your own tasks.'
      });
    }

    if (
      menteeTask.status === 'SUBMITTED' ||
      menteeTask.status === 'UNDER_REVIEW' ||
      menteeTask.status === 'APPROVED'
    ) {
      return res.status(400).json({
        success: false,
        message: `Task is currently ${menteeTask.status.toLowerCase().replace('_', ' ')}. Notes cannot be edited at this stage.`
      });
    }

    // Structure the payload
    let storedNotesString = '';
    if (
      approach !== undefined ||
      timeComplexity !== undefined ||
      spaceComplexity !== undefined ||
      submissionUrl !== undefined ||
      sourceCode !== undefined
    ) {
      storedNotesString = JSON.stringify({
        approach: approach || '',
        timeComplexity: timeComplexity || '',
        spaceComplexity: spaceComplexity || '',
        submissionUrl: submissionUrl || '',
        sourceCode: sourceCode || '',
        language: language || 'cpp',
        notes: notes || approach || ''
      });
    } else {
      storedNotesString = typeof notes === 'object' ? JSON.stringify(notes) : (notes ?? '');
    }

    const existingProgress = menteeTask.problemProgress.find(
      (p) => p.problemId === problemId
    );

    if (existingProgress) {
      await prisma.problemProgress.update({
        where: { id: existingProgress.id },
        data: {
          notes: storedNotesString,
          savedAt: new Date()
        }
      });
    } else {
      await prisma.problemProgress.create({
        data: {
          menteeTaskId: id,
          problemId,
          notes: storedNotesString,
          savedAt: new Date()
        }
      });
    }

    if (menteeTask.status === 'UPCOMING') {
      await prisma.menteeTask.update({
        where: { id },
        data: { status: 'IN_PROGRESS' }
      });
    }

    const updated = await prisma.problemProgress.findMany({
      where: { menteeTaskId: id }
    });

    return res.status(200).json({
      success: true,
      message: 'Problem solution saved successfully.',
      problemProgress: updated.map((p) => ({ ...p, _id: p.id }))
    });
  } catch (error) {
    next(error);
  }
};

export const submitMenteeTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;

    let menteeTask = await prisma.menteeTask.findUnique({
      where: { id },
      include: { task: true, problemProgress: true }
    });

    if (!menteeTask) {
      menteeTask = await prisma.menteeTask.findFirst({
        where: { taskId: id, menteeId: userId },
        include: { task: true, problemProgress: true }
      });
    }

    if (!menteeTask) {
      return res.status(404).json({
        success: false,
        message: 'Task assignment not found.'
      });
    }

    if (menteeTask.menteeId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only submit your own tasks.'
      });
    }

    if (menteeTask.status === 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: 'This task has already been approved.'
      });
    }

    if (
      menteeTask.status === 'SUBMITTED' ||
      menteeTask.status === 'UNDER_REVIEW'
    ) {
      return res.status(400).json({
        success: false,
        message: 'This task has already been submitted and is awaiting review.'
      });
    }

    const now = new Date();
    const isLate =
      menteeTask.task && new Date(menteeTask.task.lastDate) < now;

    const lastSubmission = await prisma.taskSubmission.findFirst({
      where: { menteeTaskId: id },
      orderBy: { version: 'desc' }
    });

    const newVersion = lastSubmission ? lastSubmission.version + 1 : 1;

    const problemSnapshot = menteeTask.problemProgress.map((p) => {
      let parsed = {};
      try {
        parsed = JSON.parse(p.notes);
      } catch (e) {
        parsed = { notes: p.notes, approach: p.notes };
      }
      return {
        problemId: p.problemId,
        approach: parsed.approach || parsed.notes || p.notes || '',
        timeComplexity: parsed.timeComplexity || '',
        spaceComplexity: parsed.spaceComplexity || '',
        submissionUrl: parsed.submissionUrl || '',
        sourceCode: parsed.sourceCode || '',
        language: parsed.language || 'cpp',
        notes: parsed.notes || p.notes || ''
      };
    });

    const submission = await prisma.taskSubmission.create({
      data: {
        menteeTaskId: id,
        menteeId: userId,
        version: newVersion,
        problemSnapshot,
        submittedAt: now,
        submittedLate: isLate
      }
    });

    const updatedMenteeTask = await prisma.menteeTask.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        submittedAt: now
      }
    });

    const reviewerId = menteeTask.reviewerId || menteeTask.task.createdById;
    if (reviewerId) {
      await prisma.notification.create({
        data: {
          userId: reviewerId,
          type: 'TASK_SUBMITTED',
          title: 'Task Submission Received',
          message: `${req.user.name} submitted Week ${menteeTask.task.weekNo} (${menteeTask.task.title}).`,
          link: `/mentor/task-reviews/${id}`
        }
      });
    }

    await prisma.auditLog.create({
      data: {
        actorId: userId,
        action: 'SUBMIT_TASK',
        resourceType: 'MenteeTask',
        resourceId: id,
        details: {
          version: newVersion,
          submittedLate: isLate
        }
      }
    });

    return res.status(200).json({
      success: true,
      message: isLate
        ? 'Task submitted (marked late).'
        : 'Task submitted successfully for mentor review.',
      submission: { ...submission, _id: submission.id },
      menteeTask: { ...updatedMenteeTask, _id: updatedMenteeTask.id }
    });
  } catch (error) {
    next(error);
  }
};

export const getMenteeTaskHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;

    let targetMenteeTaskId = id;
    const directMenteeTask = await prisma.menteeTask.findUnique({ where: { id } });
    if (!directMenteeTask) {
      const fallback = await prisma.menteeTask.findFirst({
        where: { taskId: id, menteeId: userId }
      });
      if (fallback) targetMenteeTaskId = fallback.id;
    }

    const submissions = await prisma.taskSubmission.findMany({
      where: { menteeTaskId: targetMenteeTaskId },
      orderBy: { version: 'desc' }
    });

    const reviews = await prisma.taskReview.findMany({
      where: { menteeTaskId: targetMenteeTaskId },
      include: {
        reviewer: { select: { id: true, name: true, email: true } }
      },
      orderBy: { reviewedAt: 'desc' }
    });

    return res.status(200).json({
      success: true,
      submissions: submissions.map((s) => ({ ...s, _id: s.id })),
      reviews: reviews.map((r) => ({ ...r, _id: r.id }))
    });
  } catch (error) {
    next(error);
  }
};
