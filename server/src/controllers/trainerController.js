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

export const getTrainingSessions = async (req, res, next) => {
  try {
    const { role, id: userId } = req.user;
    const { batchId, month, year } = req.query;

    let where = {};
    if (batchId && batchId !== 'ALL' && batchId !== 'all') {
      where.batchId = batchId;
    }

    // Restrict trainer to assigned batches
    if (role === 'TRAINER') {
      const myBatches = await prisma.trainerBatch.findMany({ where: { trainerId: userId }, select: { batchId: true } });
      const allowedBatches = myBatches.map(b => b.batchId);
      if (batchId && batchId !== 'ALL' && !allowedBatches.includes(batchId)) return res.status(403).json({ success: false, message: 'Access denied to this batch.' });
      if (!batchId || batchId === 'ALL') where.batchId = { in: allowedBatches };
    }

    // Mentee: filter by enrolled batches if not specified
    if (role === 'MENTEE') {
      const myBatches = await prisma.batchMentee.findMany({ where: { menteeId: userId }, select: { batchId: true } });
      const allowedBatches = myBatches.map(b => b.batchId);
      if (batchId && batchId !== 'ALL') {
        where.batchId = batchId;
      } else if (allowedBatches.length > 0) {
        where.batchId = { in: allowedBatches };
      }
    }

    // Mentor: filter by assigned batches if not specified
    if (role === 'MENTOR') {
      if (batchId && batchId !== 'ALL') {
        where.batchId = batchId;
      } else {
        const myBatches = await prisma.batchMentor.findMany({ where: { mentorId: userId }, select: { batchId: true } });
        const allowedBatches = myBatches.map(b => b.batchId);
        if (allowedBatches.length > 0) {
          where.batchId = { in: allowedBatches };
        }
      }
    }

    if (month && year) {
      const start = new Date(parseInt(year), parseInt(month) - 1, 1);
      const end   = new Date(parseInt(year), parseInt(month), 1);
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

export const createOrUpdateTrainingSession = async (req, res, next) => {
  try {
    const { id: userId, role } = req.user;
    const { batchId, date, topicsTaught = [], problemsSolved = [], notes = '', trainerId } = req.body;

    if (!batchId || !date) return res.status(400).json({ success: false, message: 'batchId and date are required.' });

    let effectiveTrainerId = userId;
    if (role === 'TRAINER') {
      const access = await prisma.trainerBatch.findUnique({ where: { trainerId_batchId: { trainerId: userId, batchId } } });
      if (!access) return res.status(403).json({ success: false, message: 'Access denied to this batch.' });
    } else if (role === 'ADMIN') {
      if (trainerId) {
        effectiveTrainerId = trainerId;
      } else {
        const tb = await prisma.trainerBatch.findFirst({ where: { batchId } });
        if (tb) effectiveTrainerId = tb.trainerId;
      }
    }

    const sessionDate = new Date(date);
    sessionDate.setHours(0, 0, 0, 0);

    const existing = await prisma.trainingSession.findFirst({
      where: { batchId, date: sessionDate }
    });

    let session;
    if (existing) {
      session = await prisma.trainingSession.update({
        where: { id: existing.id },
        data: { topicsTaught, notes, trainerId: effectiveTrainerId }
      });
      if (Array.isArray(problemsSolved)) {
        await prisma.$executeRawUnsafe(
          `UPDATE "TrainingSession" SET "problemsSolved" = $1 WHERE "id" = $2`,
          problemsSolved,
          existing.id
        );
      }
    } else {
      session = await prisma.trainingSession.create({
        data: { batchId, trainerId: effectiveTrainerId, date: sessionDate, topicsTaught, notes }
      });
      if (Array.isArray(problemsSolved) && problemsSolved.length > 0) {
        await prisma.$executeRawUnsafe(
          `UPDATE "TrainingSession" SET "problemsSolved" = $1 WHERE "id" = $2`,
          problemsSolved,
          session.id
        );
      }
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
    const { id } = req.params;
    const { topicsTaught, problemsSolved, notes, date } = req.body;

    const session = await prisma.trainingSession.findUnique({ where: { id } });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found.' });
    if (role === 'TRAINER' && session.trainerId !== userId) return res.status(403).json({ success: false, message: 'Permission denied.' });

    const updated = await prisma.trainingSession.update({
      where: { id },
      data: {
        ...(topicsTaught ? { topicsTaught } : {}),
        ...(notes !== undefined ? { notes } : {}),
        ...(date ? { date: new Date(date) } : {})
      }
    });

    if (Array.isArray(problemsSolved)) {
      await prisma.$executeRawUnsafe(
        `UPDATE "TrainingSession" SET "problemsSolved" = $1 WHERE "id" = $2`,
        problemsSolved,
        id
      );
    }

    const fullSession = await prisma.trainingSession.findUnique({
      where: { id },
      include: {
        trainer: { select: { id: true, name: true, email: true } },
        batch: { select: { id: true, name: true } }
      }
    });

    return res.json({ success: true, session: fullSession });
  } catch (err) { next(err); }
};

export const deleteTrainingSession = async (req, res, next) => {
  try {
    const { id: userId, role } = req.user;
    const session = await prisma.trainingSession.findUnique({ where: { id: req.params.id } });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found.' });
    if (role === 'TRAINER' && session.trainerId !== userId) return res.status(403).json({ success: false, message: 'Permission denied.' });
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

    const [total, problems] = await Promise.all([
      prisma.dailyProblem.count({ where }),
      prisma.dailyProblem.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          postedBy: { select: { id: true, name: true } },
          batch: { select: { id: true, name: true } }
        }
      })
    ]);
    return res.json({ success: true, total, page, limit, problems });
  } catch (err) { next(err); }
};

export const createDailyProblem = async (req, res, next) => {
  try {
    const { id: userId, role } = req.user;
    const { batchId, title, description, company = '', difficulty = 'MEDIUM', platform = 'CUSTOM', link = '', tags = [], date } = req.body;

    if (!batchId || !title?.trim() || !description?.trim()) return res.status(400).json({ success: false, message: 'batchId, title, and description are required.' });

    if (role === 'TRAINER') {
      const access = await prisma.trainerBatch.findUnique({ where: { trainerId_batchId: { trainerId: userId, batchId } } });
      if (!access) return res.status(403).json({ success: false, message: 'Access denied to this batch.' });
    }

    const problem = await prisma.dailyProblem.create({
      data: { batchId, postedById: userId, title: title.trim(), description: description.trim(), company, difficulty, platform, link, tags, date: date ? new Date(date) : new Date() },
      include: { postedBy: { select: { id: true, name: true } }, batch: { select: { id: true, name: true } } }
    });
    return res.status(201).json({ success: true, problem });
  } catch (err) { next(err); }
};

export const updateDailyProblem = async (req, res, next) => {
  try {
    const { id: userId, role } = req.user;
    const problem = await prisma.dailyProblem.findUnique({ where: { id: req.params.id } });
    if (!problem) return res.status(404).json({ success: false, message: 'Problem not found.' });
    if (role !== 'ADMIN' && problem.postedById !== userId) return res.status(403).json({ success: false, message: 'Permission denied.' });
    const { title, description, company, difficulty, platform, link, tags, date } = req.body;
    const updated = await prisma.dailyProblem.update({
      where: { id: req.params.id },
      data: {
        ...(title       ? { title: title.trim() }       : {}),
        ...(description ? { description: description.trim() } : {}),
        ...(company !== undefined  ? { company }   : {}),
        ...(difficulty ? { difficulty }             : {}),
        ...(platform   ? { platform }               : {}),
        ...(link !== undefined     ? { link }       : {}),
        ...(tags       ? { tags }                   : {}),
        ...(date       ? { date: new Date(date) }   : {})
      }
    });
    return res.json({ success: true, problem: updated });
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

    const initialPassword = password || 'Password@123';
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

