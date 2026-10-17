import prisma from '../config/prisma.js';

export const getTasks = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    let where = {};

    if (req.user.role === 'MENTEE') {
      where = {
        menteeTasks: {
          some: { menteeId: userId }
        }
      };
    } else if (req.user.role === 'MENTOR') {
      // When a mentor adds a task, another mentor cannot see it:
      // A mentor only sees tasks they created, or tasks published by ADMIN
      where = {
        OR: [
          { createdById: userId },
          { createdBy: { role: 'ADMIN' } }
        ]
      };
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true, email: true, role: true } },
        reviewer: { select: { id: true, name: true, email: true, role: true } },
        problems: { orderBy: { position: 'asc' } },
        menteeTasks: true
      },
      orderBy: [{ weekNo: 'desc' }, { createdAt: 'desc' }]
    });

    const tasksWithStats = tasks.map((task) => {
      const totalAssignments = task.menteeTasks.length;
      const approvedCount = task.menteeTasks.filter((t) => t.status === 'APPROVED').length;
      const submittedCount = task.menteeTasks.filter(
        (t) => t.status === 'SUBMITTED' || t.status === 'UNDER_REVIEW'
      ).length;
      const overdueCount = task.menteeTasks.filter((t) => t.status === 'OVERDUE').length;

      return {
        _id: task.id,
        id: task.id,
        createdById: task.createdById,
        title: task.title,
        weekNo: task.weekNo,
        assignmentDate: task.assignmentDate,
        lastDate: task.lastDate,
        instructions: task.instructions,
        status: task.status,
        targetType: task.targetType,
        targetIds: task.targetIds,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        createdBy: task.createdBy ? { ...task.createdBy, _id: task.createdBy.id } : null,
        reviewerId: task.reviewer ? { ...task.reviewer, _id: task.reviewer.id } : null,
        problems: task.problems.map((p) => ({ ...p, _id: p.id })),
        stats: {
          totalAssignments,
          approvedCount,
          submittedCount,
          overdueCount,
          completionRate:
            totalAssignments > 0 ? Math.round((approvedCount / totalAssignments) * 100) : 0
        }
      };
    });

    return res.status(200).json({
      success: true,
      count: tasksWithStats.length,
      tasks: tasksWithStats
    });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req, res, next) => {
  try {
    const {
      title,
      weekNo,
      assignmentDate,
      lastDate,
      instructions,
      problems,
      reviewerId,
      targetType = 'ALL',
      targetIds = []
    } = req.body;

    const userId = req.user.id || req.user._id;

    if (!title || !weekNo || !assignmentDate || !lastDate) {
      return res.status(400).json({
        success: false,
        message: 'Title, week number, assignment date, and deadline are required.'
      });
    }

    const startDate = new Date(assignmentDate);
    const deadline = new Date(lastDate);

    if (deadline <= startDate) {
      return res.status(400).json({
        success: false,
        message: 'Deadline cannot precede or equal the start date.'
      });
    }

    if (!problems || !Array.isArray(problems) || problems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Task must contain at least one coding problem.'
      });
    }

    const orderedProblems = problems.map((p, idx) => ({
      name: p.name.trim(),
      problemUrl: p.problemUrl.trim(),
      platform: (p.platform || 'LEETCODE').toUpperCase(),
      position: p.position || idx + 1
    }));

    const designatedReviewerId =
      reviewerId || (req.user.role === 'MENTOR' ? userId : null);

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        weekNo: Number(weekNo),
        assignmentDate: startDate,
        lastDate: deadline,
        instructions: instructions || '',
        createdById: userId,
        reviewerId: designatedReviewerId,
        targetType,
        targetIds: Array.isArray(targetIds) ? targetIds : [],
        status: 'PUBLISHED',
        problems: {
          create: orderedProblems
        }
      },
      include: {
        problems: true
      }
    });

    // Resolve recipient mentees
    const recipientIdsSet = new Set();

    if (req.user.role === 'MENTOR') {
      const assignments = await prisma.mentorMenteeAssignment.findMany({
        where: { mentorId: userId, status: 'ACTIVE' },
        select: { menteeId: true }
      });
      const authorizedMenteeIds = assignments.map((a) => a.menteeId);

      if (targetType === 'ALL') {
        authorizedMenteeIds.forEach((id) => recipientIdsSet.add(id));
      } else if (targetType === 'BATCH') {
        const batchMentees = await prisma.batchMentee.findMany({
          where: {
            batchId: { in: targetIds },
            batch: { mentors: { some: { mentorId: userId } } }
          }
        });
        batchMentees.forEach((bm) => {
          if (authorizedMenteeIds.includes(bm.menteeId)) {
            recipientIdsSet.add(bm.menteeId);
          }
        });
      } else {
        targetIds.forEach((id) => {
          if (authorizedMenteeIds.includes(id)) {
            recipientIdsSet.add(id);
          }
        });
      }
    } else if (req.user.role === 'ADMIN') {
      if (targetType === 'ALL') {
        const allMentees = await prisma.user.findMany({
          where: { role: 'MENTEE', accountStatus: 'ACTIVE' },
          select: { id: true }
        });
        allMentees.forEach((m) => recipientIdsSet.add(m.id));
      } else if (targetType === 'BATCH') {
        const batchMentees = await prisma.batchMentee.findMany({
          where: { batchId: { in: targetIds } }
        });
        batchMentees.forEach((bm) => recipientIdsSet.add(bm.menteeId));
      } else {
        targetIds.forEach((id) => recipientIdsSet.add(id));
      }
    }

    const recipientIds = Array.from(recipientIdsSet);

    for (const menteeId of recipientIds) {
      await prisma.menteeTask.create({
        data: {
          taskId: task.id,
          menteeId,
          reviewerId: designatedReviewerId,
          status: 'IN_PROGRESS',
          assignedAt: new Date(),
          problemProgress: {
            create: task.problems.map((p) => ({
              problemId: p.id,
              notes: '',
              savedAt: new Date()
            }))
          }
        }
      });

      await prisma.notification.create({
        data: {
          userId: menteeId,
          type: 'TASK_ASSIGNED',
          title: `New Task: Week ${task.weekNo}`,
          message: `Task "${task.title}" with ${task.problems.length} problems has been assigned. Due on ${task.lastDate.toLocaleDateString()}.`,
          link: `/mentee/tasks`
        }
      });
    }

    await prisma.auditLog.create({
      data: {
        actorId: userId,
        action: 'PUBLISH_TASK',
        resourceType: 'Task',
        resourceId: task.id,
        details: {
          weekNo: task.weekNo,
          assignedCount: recipientIds.length
        }
      }
    });

    return res.status(201).json({
      success: true,
      message: `Task published and assigned to ${recipientIds.length} mentees successfully.`,
      task: {
        ...task,
        _id: task.id,
        problems: task.problems.map((p) => ({ ...p, _id: p.id }))
      },
      assignedCount: recipientIds.length
    });
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true, role: true } },
        reviewer: { select: { id: true, name: true, email: true, role: true } },
        problems: { orderBy: { position: 'asc' } }
      }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.'
      });
    }

    const userId = req.user.id || req.user._id;
    if (req.user.role === 'MENTOR' && task.createdById !== userId && task.createdBy?.role === 'MENTOR') {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: You cannot view tasks created by another mentor.'
      });
    }

    return res.status(200).json({
      success: true,
      task: {
        ...task,
        _id: task.id,
        createdBy: task.createdBy ? { ...task.createdBy, _id: task.createdBy.id } : null,
        reviewerId: task.reviewer ? { ...task.reviewer, _id: task.reviewer.id } : null,
        problems: task.problems.map((p) => ({ ...p, _id: p.id }))
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;
    const {
      title,
      weekNo,
      assignmentDate,
      lastDate,
      instructions,
      reviewerId,
      status,
      problems
    } = req.body;

    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: { problems: true, menteeTasks: true }
    });

    if (!existingTask) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.'
      });
    }

    // Admin, Mentor, or creator of this task can edit it
    if (existingTask.createdById !== userId && req.user.role !== 'ADMIN' && req.user.role !== 'MENTOR') {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: Only mentors or administrators can edit this task.'
      });
    }

    const updateData = {};
    if (title) updateData.title = title.trim();
    if (weekNo) updateData.weekNo = Number(weekNo);
    if (instructions !== undefined) updateData.instructions = instructions;

    let newStart = existingTask.assignmentDate;
    let newEnd = existingTask.lastDate;

    if (assignmentDate) {
      newStart = new Date(assignmentDate);
      updateData.assignmentDate = newStart;
    }
    if (lastDate) {
      newEnd = new Date(lastDate);
      updateData.lastDate = newEnd;
    }

    if (newEnd <= newStart) {
      return res.status(400).json({
        success: false,
        message: 'Deadline cannot precede or equal the assignment start date.'
      });
    }

    if (reviewerId) updateData.reviewerId = reviewerId;
    if (status) updateData.status = status;

    // Update main task details
    await prisma.task.update({
      where: { id },
      data: updateData
    });

    // If deadline was modified, handle reopening or closing assigned mentee tasks
    if (lastDate) {
      const endBoundary = new Date(newEnd);
      if (endBoundary.getUTCHours() === 0 && endBoundary.getUTCMinutes() === 0 && endBoundary.getUTCSeconds() === 0) {
        endBoundary.setUTCHours(23, 59, 59, 999);
      }
      const isNowFuture = endBoundary > new Date();

      if (isNowFuture) {
        // Re-open tasks that were OVERDUE or CLOSED back to IN_PROGRESS so student can submit
        await prisma.menteeTask.updateMany({
          where: {
            taskId: id,
            status: { in: ['OVERDUE', 'CLOSED'] }
          },
          data: {
            status: 'IN_PROGRESS'
          }
        });

        const assignedMentees = await prisma.menteeTask.findMany({
          where: { taskId: id },
          select: { menteeId: true }
        });

        if (assignedMentees.length > 0) {
          const formattedDate = newEnd.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });
          await prisma.notification.createMany({
            data: assignedMentees.map((m) => ({
              userId: m.menteeId,
              type: 'TASK_DEADLINE_EXTENDED',
              title: 'Task Deadline Extended',
              message: `The deadline for "${existingTask.title}" has been extended to ${formattedDate}. You can now submit your work.`
            }))
          }).catch(() => {});
        }
      } else {
        // Deadline set in past -> mark incomplete tasks as OVERDUE
        await prisma.menteeTask.updateMany({
          where: {
            taskId: id,
            status: { in: ['UPCOMING', 'IN_PROGRESS'] }
          },
          data: {
            status: 'OVERDUE'
          }
        });
      }
    }

    // If problems array is provided, synchronize questions
    if (Array.isArray(problems)) {
      if (problems.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Task must contain at least one coding problem.'
        });
      }

      // Format incoming problems
      const formattedProblems = problems.map((p, idx) => ({
        name: (p.name || '').trim(),
        problemUrl: (p.problemUrl || '').trim(),
        platform: (p.platform || 'LEETCODE').toUpperCase(),
        position: p.position || idx + 1
      }));

      for (let i = 0; i < formattedProblems.length; i++) {
        if (!formattedProblems[i].name || !formattedProblems[i].problemUrl) {
          return res.status(400).json({
            success: false,
            message: `Problem #${i + 1} requires both a name and a valid URL.`
          });
        }
      }

      // Delete existing problemProgress and problems, then re-create
      await prisma.problemProgress.deleteMany({
        where: {
          menteeTask: { taskId: id }
        }
      });

      await prisma.problem.deleteMany({
        where: { taskId: id }
      });

      // Create new problems
      await prisma.problem.createMany({
        data: formattedProblems.map((p) => ({
          taskId: id,
          ...p
        }))
      });

      // Fetch fresh problems to get their generated IDs
      const freshProblems = await prisma.problem.findMany({
        where: { taskId: id },
        orderBy: { position: 'asc' }
      });

      // Synchronize ProblemProgress for all assigned mentee tasks
      const menteeTasks = await prisma.menteeTask.findMany({
        where: { taskId: id }
      });

      for (const mt of menteeTasks) {
        await prisma.problemProgress.createMany({
          data: freshProblems.map((p) => ({
            menteeTaskId: mt.id,
            problemId: p.id,
            notes: '',
            savedAt: new Date()
          }))
        });
      }
    }

    const finalUpdatedTask = await prisma.task.findUnique({
      where: { id },
      include: {
        problems: { orderBy: { position: 'asc' } },
        createdBy: { select: { id: true, name: true, email: true } },
        reviewer: { select: { id: true, name: true, email: true } }
      }
    });

    await prisma.auditLog.create({
      data: {
        actorId: userId,
        action: 'UPDATE_TASK',
        resourceType: 'Task',
        resourceId: id,
        details: { title: finalUpdatedTask.title, weekNo: finalUpdatedTask.weekNo }
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Task updated successfully.',
      task: {
        ...finalUpdatedTask,
        _id: finalUpdatedTask.id,
        problems: finalUpdatedTask.problems.map((p) => ({ ...p, _id: p.id }))
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;

    const task = await prisma.task.findUnique({
      where: { id }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.'
      });
    }

    // Only the creator of this task can delete it
    if (task.createdById !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: Only the creator of this task can delete it.'
      });
    }

    // Cascade delete task and all its dependencies
    await prisma.task.delete({
      where: { id }
    });

    await prisma.auditLog.create({
      data: {
        actorId: userId,
        action: 'DELETE_TASK',
        resourceType: 'Task',
        resourceId: id,
        details: { title: task.title, weekNo: task.weekNo }
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

export const assignTaskToRecipients = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { targetType, targetIds } = req.body;

    const task = await prisma.task.findUnique({
      where: { id },
      include: { problems: true }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.'
      });
    }

    let menteeIdsToAdd = [];
    if (targetType === 'BATCH') {
      const batchMentees = await prisma.batchMentee.findMany({
        where: { batchId: { in: targetIds } }
      });
      menteeIdsToAdd = batchMentees.map((bm) => bm.menteeId);
    } else {
      menteeIdsToAdd = targetIds || [];
    }

    let createdCount = 0;
    for (const menteeId of menteeIdsToAdd) {
      const exists = await prisma.menteeTask.findUnique({
        where: { taskId_menteeId: { taskId: id, menteeId } }
      });

      if (!exists) {
        await prisma.menteeTask.create({
          data: {
            taskId: id,
            menteeId,
            reviewerId: task.reviewerId,
            status: 'IN_PROGRESS',
            problemProgress: {
              create: task.problems.map((p) => ({
                problemId: p.id,
                notes: '',
                savedAt: new Date()
              }))
            }
          }
        });

        await prisma.notification.create({
          data: {
            userId: menteeId,
            type: 'TASK_ASSIGNED',
            title: `New Task: Week ${task.weekNo}`,
            message: `Task "${task.title}" has been assigned.`,
            link: `/mentee/tasks`
          }
        });
        createdCount++;
      }
    }

    return res.status(200).json({
      success: true,
      message: `Assigned task to ${createdCount} additional mentees.`,
      assignedCount: createdCount
    });
  } catch (error) {
    next(error);
  }
};

export const getTaskProgress = async (req, res, next) => {
  try {
    const { id } = req.params;

    const assignments = await prisma.menteeTask.findMany({
      where: { taskId: id },
      include: {
        mentee: {
          select: {
            id: true,
            name: true,
            email: true,
            menteeProfile: true
          }
        },
        reviewer: { select: { id: true, name: true, email: true } },
        problemProgress: true
      }
    });

    const progressList = assignments.map((a) => ({
      _id: a.id,
      id: a.id,
      taskId: a.taskId,
      menteeId: {
        ...a.mentee,
        _id: a.mentee.id,
        profile: a.mentee.menteeProfile || {}
      },
      reviewerId: a.reviewer ? { ...a.reviewer, _id: a.reviewer.id } : null,
      status: a.status,
      assignedAt: a.assignedAt,
      submittedAt: a.submittedAt,
      approvedAt: a.approvedAt,
      problemProgress: a.problemProgress.map((p) => ({ ...p, _id: p.id }))
    }));

    return res.status(200).json({
      success: true,
      count: progressList.length,
      assignments: progressList
    });
  } catch (error) {
    next(error);
  }
};

export const extendTaskDeadline = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { lastDate } = req.body;
    const userId = req.user.id || req.user._id;

    if (!lastDate) {
      return res.status(400).json({
        success: false,
        message: 'A new deadline (lastDate) is required.'
      });
    }

    const task = await prisma.task.findUnique({
      where: { id },
      include: { menteeTasks: true }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.'
      });
    }

    if (task.createdById !== userId && req.user.role !== 'ADMIN' && req.user.role !== 'MENTOR') {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: Only mentors or administrators can extend task deadlines.'
      });
    }

    const newEnd = new Date(lastDate);
    if (isNaN(newEnd.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid deadline date format.'
      });
    }

    if (newEnd <= task.assignmentDate) {
      return res.status(400).json({
        success: false,
        message: 'New deadline cannot precede or equal the task assignment date.'
      });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: { lastDate: newEnd },
      include: {
        problems: { orderBy: { position: 'asc' } },
        createdBy: { select: { id: true, name: true, email: true } },
        reviewer: { select: { id: true, name: true, email: true } }
      }
    });

    // Check if newEnd is in the future
    const endBoundary = new Date(newEnd);
    if (endBoundary.getUTCHours() === 0 && endBoundary.getUTCMinutes() === 0 && endBoundary.getUTCSeconds() === 0) {
      endBoundary.setUTCHours(23, 59, 59, 999);
    }
    const isNowFuture = endBoundary > new Date();

    if (isNowFuture) {
      // Re-open tasks that were OVERDUE or CLOSED back to IN_PROGRESS
      await prisma.menteeTask.updateMany({
        where: {
          taskId: id,
          status: { in: ['OVERDUE', 'CLOSED'] }
        },
        data: {
          status: 'IN_PROGRESS'
        }
      });

      // Notify assigned students
      const assignedMentees = await prisma.menteeTask.findMany({
        where: { taskId: id },
        select: { menteeId: true }
      });

      if (assignedMentees.length > 0) {
        const formattedDate = newEnd.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
        await prisma.notification.createMany({
          data: assignedMentees.map((m) => ({
            userId: m.menteeId,
            type: 'TASK_DEADLINE_EXTENDED',
            title: 'Task Deadline Extended',
            message: `The deadline for "${task.title}" has been extended to ${formattedDate}. You can now submit your work.`
          }))
        }).catch(() => {});
      }
    } else {
      await prisma.menteeTask.updateMany({
        where: {
          taskId: id,
          status: { in: ['UPCOMING', 'IN_PROGRESS'] }
        },
        data: {
          status: 'OVERDUE'
        }
      });
    }

    await prisma.auditLog.create({
      data: {
        actorId: userId,
        action: 'EXTEND_TASK_DEADLINE',
        entityType: 'Task',
        entityId: id,
        details: { oldDeadline: task.lastDate, newDeadline: newEnd }
      }
    }).catch(() => {});

    return res.status(200).json({
      success: true,
      message: 'Task deadline extended successfully.',
      task: {
        ...updatedTask,
        _id: updatedTask.id,
        problems: updatedTask.problems.map((p) => ({ ...p, _id: p.id }))
      }
    });
  } catch (error) {
    next(error);
  }
};

