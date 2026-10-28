import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';

// ─── Trainer Profile ──────────────────────────────────────────────────────────

export const getTrainerProfile = async (req, res, next) => {
  try {
    const userId = req.params.trainerId || req.user.id;
    const trainer = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, email: true, role: true, accountStatus: true,
        trainerProfile: true,
        trainerBatches: {
          include: {
            batch: {
              select: {
                id: true,
                name: true,
                academicYear: true,
                description: true,
                _count: {
                  select: { mentees: true }
                }
              }
            }
          }
        },
        _count: {
          select: {
            trainingSessionsCreated: true,
            dailyProblemsCreated: true,
            tasksCreated: true
          }
        }
      }
    });
    if (!trainer || trainer.role !== 'TRAINER') return res.status(404).json({ success: false, message: 'Trainer not found.' });
    return res.json({ success: true, trainer });
  } catch (err) { next(err); }
};

export const updateTrainerProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, designation, bio } = req.body;
    if (name && name.trim()) {
      await prisma.user.update({
        where: { id: userId },
        data: { name: name.trim() }
      });
    }
    const profile = await prisma.trainerProfile.upsert({
      where: { userId },
      create: { userId, designation: designation || 'Corporate Trainer', bio: bio || '' },
      update: { ...(designation ? { designation } : {}), ...(bio !== undefined ? { bio } : {}) }
    });
    return res.json({ success: true, profile });
  } catch (err) { next(err); }
};

// ─── Trainer Batch Management (ADMIN only) ────────────────────────────────────

export const assignTrainerToBatch = async (req, res, next) => {
  try {
    const { trainerId, batchId, isPrimary = false } = req.body;
    const trainer = await prisma.user.findUnique({ where: { id: trainerId } });
    if (!trainer || trainer.role !== 'TRAINER') return res.status(400).json({ success: false, message: 'Invalid trainer.' });
    const batch = await prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found.' });
    const record = await prisma.trainerBatch.upsert({
      where: { trainerId_batchId: { trainerId, batchId } },
      create: { trainerId, batchId, isPrimary },
      update: { isPrimary }
    });
    return res.status(201).json({ success: true, record });
  } catch (err) { next(err); }
};

export const removeTrainerFromBatch = async (req, res, next) => {
  try {
    const { trainerId, batchId } = req.params;
    await prisma.trainerBatch.deleteMany({ where: { trainerId, batchId } });
    return res.json({ success: true, message: 'Trainer removed from batch.' });
  } catch (err) { next(err); }
};

// ─── Training Sessions (Calendar) ────────────────────────────────────────────

// Helper to reliably extract year, monthIndex (0-11), and day from any date format
const parseDateParts = (input) => {
  if (typeof input === 'string') {
    const match = input.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return {
        y: parseInt(match[1], 10),
        m: parseInt(match[2], 10) - 1,
        d: parseInt(match[3], 10)
      };
    }
  }
  const dt = new Date(input);
  return {
    y: dt.getUTCFullYear(),
    m: dt.getUTCMonth(),
    d: dt.getUTCDate()
  };
};

export const getTrainingSessions = async (req, res, next) => {
  try {
    const { role, id: userId } = req.user;
    const { batchId, month, year } = req.query;

    let where = {};

    // Role-based batch access restrictions
    if (role === 'TRAINER') {
      const myBatches = await prisma.trainerBatch.findMany({ where: { trainerId: userId }, select: { batchId: true } });
      const allowedBatches = myBatches.map(b => b.batchId);
      if (batchId && batchId !== 'ALL' && batchId !== 'all') {
        if (!allowedBatches.includes(batchId)) return res.status(403).json({ success: false, message: 'Access denied to this batch.' });
        where.batchId = batchId;
      } else {
        where.batchId = { in: allowedBatches };
      }
    } else if (role === 'MENTEE') {
      const myBatches = await prisma.batchMentee.findMany({ where: { menteeId: userId }, select: { batchId: true } });
      const allowedBatches = myBatches.map(b => b.batchId);
      if (batchId && batchId !== 'ALL' && batchId !== 'all') {
        if (!allowedBatches.includes(batchId)) return res.status(403).json({ success: false, message: 'Access denied to this batch.' });
        where.batchId = batchId;
      } else {
        where.batchId = { in: allowedBatches };
      }
    } else if (role === 'MENTOR') {
      const myBatches = await prisma.batchMentor.findMany({ where: { mentorId: userId }, select: { batchId: true } });
      const allowedBatches = myBatches.map(b => b.batchId);
      if (batchId && batchId !== 'ALL' && batchId !== 'all') {
        if (!allowedBatches.includes(batchId)) return res.status(403).json({ success: false, message: 'Access denied to this batch.' });
        where.batchId = batchId;
      } else {
        where.batchId = { in: allowedBatches };
      }
    } else {
      // ADMIN
      if (batchId && batchId !== 'ALL' && batchId !== 'all') {
        where.batchId = batchId;
      }
    }

    if (month && year) {
      const m = parseInt(month, 10);
      const y = parseInt(year, 10);
      // UTC boundaries to prevent local timezone shifts across days/months
      const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
      const end   = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
      where.date = { gte: start, lt: end };
    }

    const sessions = await prisma.trainingSession.findMany({
      where,
      orderBy: { date: 'asc' },
      include: {
        trainer: { select: { id: true, name: true, email: true } },
        batch: { select: { id: true, name: true } }
      }
    });
    return res.json({ success: true, sessions });
  } catch (err) { next(err); }
};

export const scheduleTrainingDay = async (req, res, next) => {
  try {
    const { date, batchIds = [], allBatches = false } = req.body;
    if (!date) return res.status(400).json({ success: false, message: 'date is required.' });

    let targetBatchIds = [];
    if (allBatches) {
      const all = await prisma.batch.findMany({ select: { id: true } });
      targetBatchIds = all.map(b => b.id);
    } else {
      targetBatchIds = Array.isArray(batchIds) ? batchIds : [batchIds];
    }

    if (targetBatchIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Please select at least one batch or All Batches.' });
    }

    const { y, m, d } = parseDateParts(date);
    const dayStart = new Date(Date.UTC(y, m, d, 0, 0, 0, 0));
    const dayEnd   = new Date(Date.UTC(y, m, d + 1, 0, 0, 0, 0));
    const canonicalDate = new Date(Date.UTC(y, m, d, 12, 0, 0, 0));

    let fallbackTrainer = await prisma.user.findFirst({ where: { role: 'TRAINER', accountStatus: 'ACTIVE' } });
    if (!fallbackTrainer) {
      fallbackTrainer = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    }

    const scheduled = [];
    for (const bId of targetBatchIds) {
      const existing = await prisma.trainingSession.findFirst({
        where: {
          batchId: bId,
          date: { gte: dayStart, lt: dayEnd }
        }
      });
      if (existing) {
        scheduled.push(existing);
        continue;
      }

      const tb = await prisma.trainerBatch.findFirst({ where: { batchId: bId } });
      const trainerId = tb?.trainerId || fallbackTrainer?.id;

      const created = await prisma.trainingSession.create({
        data: {
          batchId: bId,
          trainerId,
          date: canonicalDate,
          topicsTaught: [],
          problemsSolved: [],
          notes: ''
        },
        include: {
          batch: { select: { id: true, name: true } },
          trainer: { select: { id: true, name: true } }
        }
      });
      scheduled.push(created);
    }

    return res.status(201).json({
      success: true,
      message: `Marked training day for ${scheduled.length} batch(es).`,
      scheduled
    });
  } catch (err) { next(err); }
};

export const unscheduleTrainingDay = async (req, res, next) => {
  try {
    const { date, batchId } = req.query;
    if (!date) return res.status(400).json({ success: false, message: 'date query parameter is required.' });

    const { y, m, d } = parseDateParts(date);
    const dayStart = new Date(Date.UTC(y, m, d, 0, 0, 0, 0));
    const dayEnd   = new Date(Date.UTC(y, m, d + 1, 0, 0, 0, 0));

    let deleteWhere = {
      date: { gte: dayStart, lt: dayEnd }
    };

    if (batchId && batchId !== 'ALL' && batchId !== 'all') {
      deleteWhere.batchId = batchId;
    }

    const result = await prisma.trainingSession.deleteMany({
      where: deleteWhere
    });

    return res.json({
      success: true,
      message: `Removed training day schedule (${result.count} session entries deleted).`,
      count: result.count
    });
  } catch (err) { next(err); }
};

export const createOrUpdateTrainingSession = async (req, res, next) => {
  try {
    const { id: userId, role } = req.user;
    if (role === 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Admins cannot write or edit training session content. Only assigned trainers can report class topics and problems solved.'
      });
    }

    const { batchId, date, topicsTaught = [], problemsSolved = [], notes = '', trainerId } = req.body;

    if (!batchId || !date) return res.status(400).json({ success: false, message: 'batchId and date are required.' });

    let effectiveTrainerId = userId;
    if (role === 'TRAINER') {
      const access = await prisma.trainerBatch.findUnique({ where: { trainerId_batchId: { trainerId: userId, batchId } } });
      if (!access) return res.status(403).json({ success: false, message: 'Access denied to this batch.' });
    }

    const { y, m, d } = parseDateParts(date);
    const dayStart = new Date(Date.UTC(y, m, d, 0, 0, 0, 0));
    const dayEnd   = new Date(Date.UTC(y, m, d + 1, 0, 0, 0, 0));
    const canonicalDate = new Date(Date.UTC(y, m, d, 12, 0, 0, 0));

    const existing = await prisma.trainingSession.findFirst({
      where: {
        batchId,
        date: { gte: dayStart, lt: dayEnd }
      }
    });

    let session;
    if (existing) {
      session = await prisma.trainingSession.update({
        where: { id: existing.id },
        data: {
          topicsTaught: Array.isArray(topicsTaught) ? topicsTaught : [],
          problemsSolved: Array.isArray(problemsSolved) ? problemsSolved : [],
          notes: notes || '',
          trainerId: effectiveTrainerId
        }
      });
    } else {
      session = await prisma.trainingSession.create({
        data: {
          batchId,
          trainerId: effectiveTrainerId,
          date: canonicalDate,
          topicsTaught: Array.isArray(topicsTaught) ? topicsTaught : [],
          problemsSolved: Array.isArray(problemsSolved) ? problemsSolved : [],
          notes: notes || ''
        }
      });
    }

    const fullSession = await prisma.trainingSession.findUnique({
      where: { id: session.id },
      include: {
        trainer: { select: { id: true, name: true, email: true } },
        batch: { select: { id: true, name: true } }
      }
    });

    return res.status(201).json({ success: true, session: fullSession });
  } catch (err) { next(err); }
};

export const updateTrainingSession = async (req, res, next) => {
  try {
    const { id: userId, role } = req.user;
    if (role === 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Admins cannot write or edit training session content. Only assigned trainers can report class topics and problems solved.'
      });
    }

    const { id } = req.params;
    const { topicsTaught, problemsSolved, notes, date } = req.body;

    const session = await prisma.trainingSession.findUnique({ where: { id } });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found.' });

    if (role === 'TRAINER' && session.trainerId !== userId) {
      const access = await prisma.trainerBatch.findUnique({
        where: { trainerId_batchId: { trainerId: userId, batchId: session.batchId } }
      });
      if (!access) return res.status(403).json({ success: false, message: 'Permission denied.' });
    }

    let updateData = {};
    if (topicsTaught !== undefined) updateData.topicsTaught = Array.isArray(topicsTaught) ? topicsTaught : [];
    if (problemsSolved !== undefined) updateData.problemsSolved = Array.isArray(problemsSolved) ? problemsSolved : [];
    if (notes !== undefined) updateData.notes = notes;
    if (date) {
      const { y, m, d } = parseDateParts(date);
      updateData.date = new Date(Date.UTC(y, m, d, 12, 0, 0, 0));
    }

    const updated = await prisma.trainingSession.update({
      where: { id },
      data: updateData,
      include: {
        trainer: { select: { id: true, name: true, email: true } },
        batch: { select: { id: true, name: true } }
      }
    });

    return res.json({ success: true, session: updated });
  } catch (err) { next(err); }
};

export const deleteTrainingSession = async (req, res, next) => {
  try {
    const { id: userId, role } = req.user;
    const session = await prisma.trainingSession.findUnique({ where: { id: req.params.id } });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found.' });

    if (role === 'TRAINER' && session.trainerId !== userId) {
      const access = await prisma.trainerBatch.findUnique({
        where: { trainerId_batchId: { trainerId: userId, batchId: session.batchId } }
      });
      if (!access) return res.status(403).json({ success: false, message: 'Permission denied.' });
    }

    await prisma.trainingSession.delete({ where: { id: req.params.id } });
    return res.json({ success: true, message: 'Session deleted.' });
  } catch (err) { next(err); }
};

// ─── Daily Problems ────────────────────────────────────────────────────────────

export const getDailyProblems = async (req, res, next) => {
  try {
    const { role, id: userId } = req.user;
    const { batchId, date, page: p = 1, limit: l = 20 } = req.query;
    const page = Math.max(parseInt(p), 1);
    const limit = Math.min(parseInt(l), 100);

    let where = {};
    if (batchId) where.batchId = batchId;

    if (role === 'TRAINER') {
      const myBatches = await prisma.trainerBatch.findMany({ where: { trainerId: userId }, select: { batchId: true } });
      const allowedBatches = myBatches.map(b => b.batchId);
      if (batchId && !allowedBatches.includes(batchId)) return res.status(403).json({ success: false, message: 'Access denied.' });
      if (!batchId) where.batchId = { in: allowedBatches };
    } else if (role === 'MENTEE') {
      const myBatches = await prisma.batchMentee.findMany({ where: { menteeId: userId }, select: { batchId: true } });
      const batchIds = myBatches.map(b => b.batchId);
      where.batchId = { in: batchIds };
    }

    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      where.date = { gte: d, lt: next };
    }

    const [total, rawProblems] = await Promise.all([
      prisma.dailyProblem.count({ where }),
      prisma.dailyProblem.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          postedBy: { select: { id: true, name: true, email: true } },
          batch: {
            select: {
              id: true,
              name: true,
              _count: { select: { mentees: true } }
            }
          },
          _count: {
            select: { submissions: true }
          },
          ...(role === 'MENTEE' ? {
            submissions: {
              where: { studentId: userId },
              take: 1
            }
          } : {})
        }
      })
    ]);

    const problems = rawProblems.map(p => {
      const totalStudents = p.batch?._count?.mentees || 0;
      const solvedCount = p._count?.submissions || 0;
      const pendingCount = Math.max(0, totalStudents - solvedCount);
      const mySubmission = p.submissions?.[0] || null;
      return {
        ...p,
        totalStudents,
        solvedCount,
        pendingCount,
        isSolved: Boolean(mySubmission),
        mySubmission,
        submissions: undefined
      };
    });

    return res.json({ success: true, total, page, limit, problems });
  } catch (err) { next(err); }
};

export const getDailyProblemById = async (req, res, next) => {
  try {
    const { role, id: userId } = req.user;
    const { id } = req.params;

    const problem = await prisma.dailyProblem.findUnique({
      where: { id },
      include: {
        postedBy: { select: { id: true, name: true, email: true } },
        batch: {
          select: {
            id: true,
            name: true,
            _count: { select: { mentees: true } }
          }
        },
        _count: {
          select: { submissions: true }
        },
        ...(role === 'MENTEE' ? {
          submissions: {
            where: { studentId: userId },
            take: 1
          }
        } : {})
      }
    });

    if (!problem) return res.status(404).json({ success: false, message: 'Daily problem not found.' });

    if (role === 'TRAINER') {
      const access = await prisma.trainerBatch.findUnique({
        where: { trainerId_batchId: { trainerId: userId, batchId: problem.batchId } }
      });
      if (!access) return res.status(403).json({ success: false, message: 'Access denied: You are not assigned to this batch.' });
    } else if (role === 'MENTEE') {
      const inBatch = await prisma.batchMentee.findUnique({
        where: { batchId_menteeId: { batchId: problem.batchId, menteeId: userId } }
      });
      if (!inBatch) return res.status(403).json({ success: false, message: 'Access denied: Daily problem not assigned to your batch.' });
    } else if (role === 'MENTOR') {
      const hasMenteeInBatch = await prisma.batchMentee.findFirst({
        where: {
          batchId: problem.batchId,
          mentee: {
            mentorAssignments: {
              some: { mentorId: userId, status: 'ACTIVE' }
            }
          }
        }
      });
      if (!hasMenteeInBatch) {
        return res.status(403).json({ success: false, message: 'Access denied: No assigned mentees in this batch.' });
      }
    }

    const totalStudents = problem.batch?._count?.mentees || 0;
    const solvedCount = problem._count?.submissions || 0;
    const pendingCount = Math.max(0, totalStudents - solvedCount);
    const mySubmission = problem.submissions?.[0] || null;

    return res.json({
      success: true,
      problem: {
        ...problem,
        totalStudents,
        solvedCount,
        pendingCount,
        isSolved: Boolean(mySubmission),
        mySubmission,
        submissions: undefined
      }
    });
  } catch (err) { next(err); }
};

export const getDailyProblemSubmissions = async (req, res, next) => {
  try {
    const { role, id: userId } = req.user;
    const { id } = req.params;

    const problem = await prisma.dailyProblem.findUnique({
      where: { id },
      include: {
        batch: { select: { id: true, name: true } }
      }
    });

    if (!problem) return res.status(404).json({ success: false, message: 'Daily problem not found.' });

    if (role === 'TRAINER') {
      const access = await prisma.trainerBatch.findUnique({
        where: { trainerId_batchId: { trainerId: userId, batchId: problem.batchId } }
      });
      if (!access) return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const batchMentees = await prisma.batchMentee.findMany({
      where: { batchId: problem.batchId },
      include: {
        mentee: {
          select: {
            id: true,
            name: true,
            email: true,
            menteeProfile: true
          }
        }
      },
      orderBy: { mentee: { name: 'asc' } }
    });

    const submissions = await prisma.dailyProblemSubmission.findMany({
      where: { dailyProblemId: id }
    });

    const submissionMap = new Map();
    submissions.forEach(s => submissionMap.set(s.studentId, s));

    const studentList = batchMentees.map(bm => {
      const student = bm.mentee;
      const sub = submissionMap.get(student.id);
      return {
        studentId: student.id,
        name: student.name,
        email: student.email,
        rollNumber: student.menteeProfile?.rollNumber || '',
        section: student.menteeProfile?.section || 'A',
        status: sub ? 'COMPLETED' : 'PENDING',
        submission: sub || null
      };
    });

    const solvedCount = submissions.length;
    const totalStudents = batchMentees.length;
    const pendingCount = Math.max(0, totalStudents - solvedCount);

    return res.json({
      success: true,
      problem: {
        id: problem.id,
        title: problem.title,
        company: problem.company,
        difficulty: problem.difficulty,
        link: problem.link,
        batchName: problem.batch?.name
      },
      stats: {
        totalStudents,
        solvedCount,
        pendingCount
      },
      submissions: studentList
    });
  } catch (err) { next(err); }
};

export const submitDailyProblem = async (req, res, next) => {
  try {
    const { id: userId, role } = req.user;
    const { id: dailyProblemId } = req.params;
    const { submissionUrl, language = 'cpp', timeComplexity = '', spaceComplexity = '', approach = '', sourceCode = '' } = req.body;

    const problem = await prisma.dailyProblem.findUnique({
      where: { id: dailyProblemId }
    });
    if (!problem) return res.status(404).json({ success: false, message: 'Problem not found.' });

    const inBatch = await prisma.batchMentee.findUnique({
      where: { batchId_menteeId: { batchId: problem.batchId, menteeId: userId } }
    });
    if (!inBatch && role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'You are not enrolled in the batch for this daily problem.' });
    }

    if (!submissionUrl?.trim() && !sourceCode?.trim() && !approach?.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a submission URL, approach, or code.' });
    }

    const submission = await prisma.dailyProblemSubmission.upsert({
      where: {
        dailyProblemId_studentId: {
          dailyProblemId,
          studentId: userId
        }
      },
      create: {
        dailyProblemId,
        studentId: userId,
        status: 'COMPLETED',
        submissionUrl: (submissionUrl || '').trim(),
        language: (language || 'cpp').trim(),
        timeComplexity: (timeComplexity || '').trim(),
        spaceComplexity: (spaceComplexity || '').trim(),
        approach: (approach || '').trim(),
        sourceCode: (sourceCode || '').trim(),
        submittedAt: new Date()
      },
      update: {
        status: 'COMPLETED',
        submissionUrl: (submissionUrl || '').trim(),
        language: (language || 'cpp').trim(),
        timeComplexity: (timeComplexity || '').trim(),
        spaceComplexity: (spaceComplexity || '').trim(),
        approach: (approach || '').trim(),
        sourceCode: (sourceCode || '').trim(),
        submittedAt: new Date()
      }
    });

    return res.json({
      success: true,
      message: 'Daily problem marked as completed!',
      submission
    });
  } catch (err) { next(err); }
};

export const createDailyProblem = async (req, res, next) => {
  try {
    const { id: userId, role } = req.user;
    const { batchId, title, description, company = '', difficulty = 'MEDIUM', platform = 'CUSTOM', link = '', tags = [], date } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ success: false, message: 'Problem title is required.' });
    }

    let targetBatchId = batchId;
    if (!targetBatchId && role === 'TRAINER') {
      const myBatches = await prisma.trainerBatch.findMany({ where: { trainerId: userId }, select: { batchId: true } });
      if (myBatches.length > 0) targetBatchId = myBatches[0].batchId;
    }

    if (!targetBatchId) {
      return res.status(400).json({ success: false, message: 'Target batch is required.' });
    }

    if (role === 'TRAINER') {
      const access = await prisma.trainerBatch.findUnique({
        where: { trainerId_batchId: { trainerId: userId, batchId: targetBatchId } }
      });
      if (!access) return res.status(403).json({ success: false, message: 'Access denied: You are not assigned to this batch.' });
    }

    // Auto-detect platform from link
    let cleanPlatform = platform || 'CUSTOM';
    const lowerLink = (link || '').toLowerCase();
    if (lowerLink.includes('leetcode.com')) cleanPlatform = 'LEETCODE';
    else if (lowerLink.includes('hackerrank.com')) cleanPlatform = 'HACKERRANK';
    else if (lowerLink.includes('codechef.com')) cleanPlatform = 'CODECHEF';
    else if (lowerLink.includes('codeforces.com')) cleanPlatform = 'CODEFORCES';
    else if (!['LEETCODE', 'CODECHEF', 'CODEFORCES', 'HACKERRANK', 'CUSTOM'].includes(cleanPlatform)) {
      cleanPlatform = 'CUSTOM';
    }

    const cleanDesc = (description && description.trim()) ? description.trim() : title.trim();
    const cleanDiff = ['EASY', 'MEDIUM', 'HARD'].includes(difficulty) ? difficulty : 'MEDIUM';

    const problem = await prisma.dailyProblem.create({
      data: {
        batchId: targetBatchId,
        postedById: userId,
        title: title.trim(),
        description: cleanDesc,
        company: (company || '').trim(),
        difficulty: cleanDiff,
        platform: cleanPlatform,
        link: (link || '').trim(),
        tags: Array.isArray(tags) ? tags : [],
        date: date ? new Date(date) : new Date()
      },
      include: {
        postedBy: { select: { id: true, name: true } },
        batch: { select: { id: true, name: true, _count: { select: { mentees: true } } } },
        _count: { select: { submissions: true } }
      }
    });

    const formattedProblem = {
      ...problem,
      totalStudents: problem.batch?._count?.mentees || 0,
      solvedCount: 0,
      pendingCount: problem.batch?._count?.mentees || 0,
      isSolved: false,
      mySubmission: null
    };

    return res.status(201).json({ success: true, problem: formattedProblem });
  } catch (err) { next(err); }
};

export const updateDailyProblem = async (req, res, next) => {
  try {
    const { id: userId, role } = req.user;
    const problem = await prisma.dailyProblem.findUnique({ where: { id: req.params.id } });
    if (!problem) return res.status(404).json({ success: false, message: 'Problem not found.' });
    if (role !== 'ADMIN' && problem.postedById !== userId) return res.status(403).json({ success: false, message: 'Permission denied.' });

    const { title, description, company, difficulty, platform, link, tags, date, batchId } = req.body;

    let cleanPlatform = platform;
    if (link) {
      const lowerLink = link.toLowerCase();
      if (lowerLink.includes('leetcode.com')) cleanPlatform = 'LEETCODE';
      else if (lowerLink.includes('hackerrank.com')) cleanPlatform = 'HACKERRANK';
      else if (lowerLink.includes('codechef.com')) cleanPlatform = 'CODECHEF';
      else if (lowerLink.includes('codeforces.com')) cleanPlatform = 'CODEFORCES';
    }

    const updated = await prisma.dailyProblem.update({
      where: { id: req.params.id },
      data: {
        ...(title ? { title: title.trim() } : {}),
        ...(description !== undefined ? { description: description.trim() } : {}),
        ...(company !== undefined ? { company: (company || '').trim() } : {}),
        ...(difficulty ? { difficulty } : {}),
        ...(cleanPlatform ? { platform: cleanPlatform } : {}),
        ...(link !== undefined ? { link: (link || '').trim() } : {}),
        ...(tags !== undefined ? { tags: Array.isArray(tags) ? tags : [] } : {}),
        ...(date ? { date: new Date(date) } : {}),
        ...(batchId ? { batchId } : {})
      },
      include: {
        postedBy: { select: { id: true, name: true } },
        batch: { select: { id: true, name: true, _count: { select: { mentees: true } } } },
        _count: { select: { submissions: true } }
      }
    });

    const totalStudents = updated.batch?._count?.mentees || 0;
    const solvedCount = updated._count?.submissions || 0;
    const formatted = {
      ...updated,
      totalStudents,
      solvedCount,
      pendingCount: Math.max(0, totalStudents - solvedCount),
      isSolved: false,
      mySubmission: null
    };

    return res.json({ success: true, problem: formatted });
  } catch (err) { next(err); }
};

export const deleteDailyProblem = async (req, res, next) => {
  try {
    const { id: userId, role } = req.user;
    const problem = await prisma.dailyProblem.findUnique({ where: { id: req.params.id } });
    if (!problem) return res.status(404).json({ success: false, message: 'Problem not found.' });
    if (role !== 'ADMIN' && problem.postedById !== userId) return res.status(403).json({ success: false, message: 'Permission denied.' });
    await prisma.dailyProblem.delete({ where: { id: req.params.id } });
    return res.json({ success: true, message: 'Problem deleted.' });
  } catch (err) { next(err); }
};

// ─── Trainer's Batch Student list ─────────────────────────────────────────────

export const getTrainerBatchStudents = async (req, res, next) => {
  try {
    const { id: userId, role } = req.user;
    const { batchId } = req.params;

    if (role === 'TRAINER') {
      const access = await prisma.trainerBatch.findUnique({ where: { trainerId_batchId: { trainerId: userId, batchId } } });
      if (!access) return res.status(403).json({ success: false, message: 'Access denied to this batch.' });
    }

    const batchMentees = await prisma.batchMentee.findMany({
      where: { batchId },
      include: {
        mentee: {
          select: {
            id: true, name: true, email: true, accountStatus: true,
            menteeProfile: true,
            menteeAssignments: { where: { status: 'ACTIVE' }, include: { mentor: { select: { id: true, name: true, email: true } } } }
          }
        }
      }
    });

    const students = batchMentees.map(bm => ({
      ...bm.mentee,
      mentor: bm.mentee.menteeAssignments[0]?.mentor || null,
      menteeAssignments: undefined
    }));

    return res.json({ success: true, batchId, count: students.length, students });
  } catch (err) { next(err); }
};

// ─── Trainer Directory & Management (ADMIN only) ──────────────────────────────

export const getTrainers = async (req, res, next) => {
  try {
    const trainers = await prisma.user.findMany({
      where: { role: 'TRAINER' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        accountStatus: true,
        createdAt: true,
        trainerProfile: true,
        trainerBatches: {
          include: {
            batch: { select: { id: true, name: true, academicYear: true, description: true } }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    const enrichedTrainers = trainers.map((t) => ({
      _id: t.id,
      id: t.id,
      name: t.name,
      email: t.email,
      role: t.role,
      accountStatus: t.accountStatus,
      createdAt: t.createdAt,
      profile: t.trainerProfile || { designation: 'Corporate Trainer', bio: '' },
      batches: t.trainerBatches.map((tb) => ({
        ...tb.batch,
        _id: tb.batch.id,
        isPrimary: tb.isPrimary
      }))
    }));

    return res.json({ success: true, trainers: enrichedTrainers });
  } catch (err) {
    next(err);
  }
};

export const createTrainer = async (req, res, next) => {
  try {
    const { name, email, password, designation, bio, batchIds } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required.' });
    }

    const existing = await prisma.user.findFirst({
      where: { email: { equals: email.toLowerCase().trim(), mode: 'insensitive' } }
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'A user with this email already exists.' });
    }

    if (!password || typeof password !== 'string' || password.trim().length < 8) {
      return res.status(400).json({
        success: false,
        message: 'A secure password of at least 8 characters is required to provision a trainer.'
      });
    }

    if (password.trim() === 'Password@123') {
      return res.status(400).json({
        success: false,
        message: 'Default or predictable passwords like "Password@123" are not permitted.'
      });
    }

    const initialPassword = password.trim();
    const passwordHash = await bcrypt.hash(initialPassword, 10);

    const trainer = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role: 'TRAINER',
        mustChangePassword: true,
        trainerProfile: {
          create: {
            designation: designation?.trim() || 'Corporate Trainer',
            bio: bio?.trim() || ''
          }
        }
      },
      include: {
        trainerProfile: true
      }
    });

    if (Array.isArray(batchIds) && batchIds.length > 0) {
      await prisma.trainerBatch.createMany({
        data: batchIds.map((batchId, idx) => ({
          trainerId: trainer.id,
          batchId,
          isPrimary: idx === 0
        })),
        skipDuplicates: true
      });
    }

    const fullTrainer = await prisma.user.findUnique({
      where: { id: trainer.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        accountStatus: true,
        createdAt: true,
        trainerProfile: true,
        trainerBatches: {
          include: {
            batch: { select: { id: true, name: true, academicYear: true } }
          }
        }
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Trainer account created successfully.',
      trainer: {
        ...fullTrainer,
        _id: fullTrainer.id,
        profile: fullTrainer.trainerProfile,
        batches: fullTrainer.trainerBatches.map((tb) => ({
          ...tb.batch,
          _id: tb.batch.id,
          isPrimary: tb.isPrimary
        }))
      }
    });
  } catch (err) {
    next(err);
  }
};

export const updateTrainer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, designation, bio, accountStatus, batchIds } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || user.role !== 'TRAINER') {
      return res.status(404).json({ success: false, message: 'Trainer not found.' });
    }

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.toLowerCase().trim();
    if (accountStatus) updateData.accountStatus = accountStatus;

    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({ where: { id }, data: updateData });
    }

    if (designation !== undefined || bio !== undefined) {
      await prisma.trainerProfile.upsert({
        where: { userId: id },
        create: {
          userId: id,
          designation: designation || 'Corporate Trainer',
          bio: bio || ''
        },
        update: {
          ...(designation !== undefined ? { designation } : {}),
          ...(bio !== undefined ? { bio } : {})
        }
      });
    }

    if (Array.isArray(batchIds)) {
      await prisma.trainerBatch.deleteMany({ where: { trainerId: id } });
      if (batchIds.length > 0) {
        await prisma.trainerBatch.createMany({
          data: batchIds.map((batchId, idx) => ({
            trainerId: id,
            batchId,
            isPrimary: idx === 0
          })),
          skipDuplicates: true
        });
      }
    }

    return res.json({ success: true, message: 'Trainer updated successfully.' });
  } catch (err) {
    next(err);
  }
};

export const deleteTrainer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || user.role !== 'TRAINER') {
      return res.status(404).json({ success: false, message: 'Trainer not found.' });
    }

    await prisma.user.delete({ where: { id } });
    return res.json({ success: true, message: 'Trainer account deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

// ─── Mentor Interaction & Attendance Reports ────────────────────────────────

export const getMentorSessionReports = async (req, res, next) => {
  try {
    if (req.user.role === 'TRAINER') {
      return res.status(403).json({ success: false, message: 'Trainers are not permitted to view mentor attendance reports.' });
    }

    const { batchId, date } = req.query;
    if (!batchId || !date) {
      return res.status(400).json({ success: false, message: 'batchId and date are required.' });
    }

    const { y, m, d } = parseDateParts(date);
    const dayStart = new Date(Date.UTC(y, m, d, 0, 0, 0, 0));
    const dayEnd = new Date(Date.UTC(y, m, d + 1, 0, 0, 0, 0));

    // 1. Fetch mentors assigned to this batch
    const batchMentors = await prisma.batchMentor.findMany({
      where: { batchId },
      include: {
        mentor: {
          select: {
            id: true,
            name: true,
            email: true,
            mentorProfile: { select: { designation: true, department: true } }
          }
        }
      }
    });

    // Also include any mentors with active assignments in this batch
    const mentorAssignments = await prisma.mentorMenteeAssignment.findMany({
      where: { batchId, status: 'ACTIVE' },
      include: {
        mentor: {
          select: {
            id: true,
            name: true,
            email: true,
            mentorProfile: { select: { designation: true, department: true } }
          }
        }
      }
    });

    const mentorMap = new Map();
    batchMentors.forEach(bm => {
      if (bm.mentor) mentorMap.set(bm.mentor.id, bm.mentor);
    });
    mentorAssignments.forEach(ma => {
      if (ma.mentor) mentorMap.set(ma.mentor.id, ma.mentor);
    });

    let mentorsList = Array.from(mentorMap.values());

    // If request is from a MENTOR, restrict strictly to their own mentor profile
    if (req.user.role === 'MENTOR') {
      mentorsList = mentorsList.filter(m => m.id === req.user.id);
      if (mentorsList.length === 0) {
        const selfUser = await prisma.user.findUnique({
          where: { id: req.user.id },
          select: {
            id: true,
            name: true,
            email: true,
            mentorProfile: { select: { designation: true, department: true } }
          }
        });
        if (selfUser) mentorsList = [selfUser];
      }
    }

    // 2. Fetch existing reports for this batch on this date
    const existingReports = await prisma.$queryRaw`
      SELECT * FROM "MentorSessionReport"
      WHERE "batchId" = ${batchId}
        AND "date" >= ${dayStart}
        AND "date" < ${dayEnd}
    `;

    const reportByMentorId = {};
    if (Array.isArray(existingReports)) {
      existingReports.forEach(r => {
        reportByMentorId[r.mentorId] = r;
      });
    }

    // 3. Count mentees for each mentor in this batch
    const mentorSummaries = await Promise.all(
      mentorsList.map(async (m) => {
        const menteesCount = await prisma.mentorMenteeAssignment.count({
          where: { batchId, mentorId: m.id, status: 'ACTIVE' }
        });

        const report = reportByMentorId[m.id];
        const hasReport = !!report;
        const totalMentees = menteesCount || (report ? report.totalMentees : 0);
        const presentCount = report ? report.presentCount : 0;
        const absentCount = report ? report.absentCount : 0;
        const attendancePercentage = report
          ? Number(report.attendancePercentage)
          : (totalMentees > 0 && hasReport ? Math.round((presentCount / totalMentees) * 100) : 0);

        const isMyReport = req.user.role === 'MENTOR' && req.user.id === m.id;
        const canSubmit = isMyReport;

        return {
          mentorId: m.id,
          name: m.name,
          email: m.email,
          profileImage: m.profileImage,
          designation: m.mentorProfile?.designation || 'Technical Mentor',
          department: m.mentorProfile?.department || 'Computer Science & Engineering',
          totalMentees,
          hasReport,
          reportId: report ? report.id : null,
          presentCount,
          absentCount,
          attendancePercentage,
          submittedAt: report ? report.updatedAt : null,
          generalNotes: report ? report.generalNotes : '',
          isMyReport,
          canSubmit
        };
      })
    );

    return res.json({
      success: true,
      batchId,
      date,
      reports: mentorSummaries
    });
  } catch (err) {
    next(err);
  }
};

export const getMentorSessionReportDetails = async (req, res, next) => {
  try {
    if (req.user.role === 'TRAINER') {
      return res.status(403).json({ success: false, message: 'Trainers are not permitted to view mentor attendance reports.' });
    }

    const { mentorId } = req.params;
    const { batchId, date } = req.query;

    if (req.user.role === 'MENTOR' && mentorId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Mentors are only permitted to view their own assigned mentees.' });
    }

    if (!batchId || !date) {
      return res.status(400).json({ success: false, message: 'batchId and date are required.' });
    }

    const { y, m, d } = parseDateParts(date);
    const dayStart = new Date(Date.UTC(y, m, d, 0, 0, 0, 0));
    const dayEnd = new Date(Date.UTC(y, m, d + 1, 0, 0, 0, 0));

    const mentor = await prisma.user.findUnique({
      where: { id: mentorId },
      select: {
        id: true,
        name: true,
        email: true,
        mentorProfile: { select: { designation: true, department: true } }
      }
    });

    if (!mentor) {
      return res.status(404).json({ success: false, message: 'Mentor not found.' });
    }

    // If mentor has no assignments in the requested batch, auto-resolve to their assigned batch
    let targetBatchId = batchId;
    const directCount = await prisma.mentorMenteeAssignment.count({
      where: { batchId: targetBatchId, mentorId, status: 'ACTIVE' }
    });
    if (directCount === 0) {
      const fallback = await prisma.mentorMenteeAssignment.findFirst({
        where: { mentorId, status: 'ACTIVE' },
        select: { batchId: true }
      });
      if (fallback?.batchId) {
        targetBatchId = fallback.batchId;
      }
    }

    // Fetch all active mentees in this batch assigned to this mentor
    const assignments = await prisma.mentorMenteeAssignment.findMany({
      where: { batchId: targetBatchId, mentorId, status: 'ACTIVE' },
      include: {
        mentee: {
          select: {
            id: true,
            name: true,
            email: true,
            menteeProfile: {
              select: {
                studentId: true,
                rollNumber: true,
                branch: true,
                section: true,
                academicYear: true
              }
            }
          }
        }
      },
      orderBy: { mentee: { name: 'asc' } }
    });

    // Check if report exists
    const reports = await prisma.$queryRaw`
      SELECT * FROM "MentorSessionReport"
      WHERE "batchId" = ${batchId}
        AND "mentorId" = ${mentorId}
        AND "date" >= ${dayStart}
        AND "date" < ${dayEnd}
      LIMIT 1
    `;

    const report = Array.isArray(reports) && reports.length > 0 ? reports[0] : null;

    let recordsMap = {};
    if (report) {
      const records = await prisma.$queryRaw`
        SELECT * FROM "MenteeAttendanceReport"
        WHERE "reportId" = ${report.id}
      `;
      if (Array.isArray(records)) {
        records.forEach(r => {
          recordsMap[r.menteeId] = r;
        });
      }
    }

    const students = assignments.map(a => {
      const rec = recordsMap[a.mentee.id];
      return {
        menteeId: a.mentee.id,
        name: a.mentee.name,
        email: a.mentee.email,
        studentId: a.mentee.menteeProfile?.studentId || '',
        rollNumber: a.mentee.menteeProfile?.rollNumber || 'N/A',
        branch: a.mentee.menteeProfile?.branch || 'Computer Science & Engineering',
        section: a.mentee.menteeProfile?.section || 'A',
        status: rec ? rec.status : 'PRESENT',
        comments: rec ? rec.comments : ''
      };
    });

    const canEdit = req.user.role === 'MENTOR' && req.user.id === mentorId;

    return res.json({
      success: true,
      mentor,
      report,
      students,
      canEdit
    });
  } catch (err) {
    next(err);
  }
};

export const submitMentorSessionReport = async (req, res, next) => {
  try {
    const { batchId, date, generalNotes = '', records = [] } = req.body;

    if (req.user.role !== 'MENTOR') {
      return res.status(403).json({
        success: false,
        message: 'Only assigned mentors can submit mentee attendance and reviews. Admins cannot write or edit mentor reports.'
      });
    }

    if (!batchId || !date) {
      return res.status(400).json({ success: false, message: 'batchId and date are required.' });
    }

    const effectiveMentorId = req.user.id;

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, message: 'Attendance records for mentees are required.' });
    }

    // Validate that student comments are mandatory!
    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      if (!r.comments || !r.comments.trim()) {
        return res.status(400).json({
          success: false,
          message: `Comment / report on each student is mandatory. Please provide a review for student #${i + 1}.`
        });
      }
    }

    const { y, m, d } = parseDateParts(date);
    const dayStart = new Date(Date.UTC(y, m, d, 0, 0, 0, 0));
    const dayEnd = new Date(Date.UTC(y, m, d + 1, 0, 0, 0, 0));
    const canonicalDate = new Date(Date.UTC(y, m, d, 12, 0, 0, 0));

    // Calculate present and absent counts
    let presentCount = 0;
    records.forEach(r => {
      if (r.status === 'PRESENT') presentCount++;
    });
    const totalMentees = records.length;
    const absentCount = totalMentees - presentCount;
    const attendancePercentage = totalMentees > 0 ? Math.round((presentCount / totalMentees) * 1000) / 10 : 0.0;

    // Optional link to trainingSession
    const session = await prisma.trainingSession.findFirst({
      where: { batchId, date: { gte: dayStart, lt: dayEnd } }
    });
    const trainingSessionId = session ? session.id : null;

    // Check existing report
    const existingReports = await prisma.$queryRaw`
      SELECT "id" FROM "MentorSessionReport"
      WHERE "batchId" = ${batchId}
        AND "mentorId" = ${effectiveMentorId}
        AND "date" >= ${dayStart}
        AND "date" < ${dayEnd}
      LIMIT 1
    `;

    let reportId;
    if (Array.isArray(existingReports) && existingReports.length > 0) {
      reportId = existingReports[0].id;
      await prisma.$executeRawUnsafe(
        `UPDATE "MentorSessionReport"
         SET "presentCount" = $1, "absentCount" = $2, "totalMentees" = $3,
             "attendancePercentage" = $4, "generalNotes" = $5, "trainingSessionId" = $6,
             "updatedAt" = CURRENT_TIMESTAMP
         WHERE "id" = $7`,
        presentCount,
        absentCount,
        totalMentees,
        attendancePercentage,
        generalNotes || '',
        trainingSessionId,
        reportId
      );
    } else {
      const insertRes = await prisma.$queryRaw`
        INSERT INTO "MentorSessionReport"
          ("batchId", "mentorId", "trainingSessionId", "date", "status", "presentCount", "absentCount", "totalMentees", "attendancePercentage", "generalNotes", "createdAt", "updatedAt")
        VALUES
          (${batchId}, ${effectiveMentorId}, ${trainingSessionId}, ${canonicalDate}, 'SUBMITTED', ${presentCount}, ${absentCount}, ${totalMentees}, ${attendancePercentage}, ${generalNotes || ''}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING "id"
      `;
      reportId = insertRes[0].id;
    }

    // Upsert each mentee attendance and comment
    for (const rec of records) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "MenteeAttendanceReport" ("reportId", "menteeId", "status", "comments", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT ("reportId", "menteeId")
         DO UPDATE SET "status" = EXCLUDED."status", "comments" = EXCLUDED."comments", "updatedAt" = CURRENT_TIMESTAMP`,
        reportId,
        rec.menteeId,
        rec.status || 'PRESENT',
        rec.comments.trim()
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Mentor interaction attendance and student reviews submitted successfully.',
      reportId,
      presentCount,
      absentCount,
      totalMentees,
      attendancePercentage
    });
  } catch (err) {
    next(err);
  }
};


