import prisma from '../config/prisma.js';

export const getBatches = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    let where = {};

    if (req.user.role === 'MENTOR') {
      where = {
        mentors: {
          some: { mentorId: userId }
        }
      };
    } else if (req.user.role === 'MENTEE') {
      where = {
        mentees: {
          some: { menteeId: userId }
        }
      };
    } else if (req.user.role === 'TRAINER') {
      where = {
        trainers: {
          some: { trainerId: userId }
        }
      };
    }

    const batches = await prisma.batch.findMany({
      where,
      include: {
        mentors: {
          include: {
            mentor: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        mentees: {
          include: {
            mentee: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedBatches = batches.map((b) => ({
      _id: b.id,
      id: b.id,
      name: b.name,
      academicYear: b.academicYear,
      description: b.description,
      mentorIds: b.mentors.map((m) => ({ ...m.mentor, _id: m.mentor.id })),
      menteeIds: b.mentees.map((m) => ({ ...m.mentee, _id: m.mentee.id })),
      mentorCount: b.mentors.length,
      menteeCount: b.mentees.length,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt
    }));

    return res.status(200).json({
      success: true,
      count: formattedBatches.length,
      batches: formattedBatches
    });
  } catch (error) {
    next(error);
  }
};

export const createBatch = async (req, res, next) => {
  try {
    const { name, academicYear, description, mentorIds, menteeIds } = req.body;
    const userId = req.user.id || req.user._id;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Batch name is required.'
      });
    }

    const batch = await prisma.batch.create({
      data: {
        name: name.trim(),
        academicYear: Number(academicYear) || 2027,
        description: description || '',
        createdById: userId,
        mentors: {
          create: Array.isArray(mentorIds) ? mentorIds.map((id) => ({ mentorId: id })) : []
        },
        mentees: {
          create: Array.isArray(menteeIds) ? menteeIds.map((id) => ({ menteeId: id })) : []
        }
      },
      include: {
        mentors: { include: { mentor: { select: { id: true, name: true, email: true } } } },
        mentees: { include: { mentee: { select: { id: true, name: true, email: true } } } }
      }
    });

    await prisma.auditLog.create({
      data: {
        actorId: userId,
        action: 'CREATE_BATCH',
        resourceType: 'Batch',
        resourceId: batch.id,
        details: { name: batch.name }
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Batch created successfully.',
      batch: {
        ...batch,
        _id: batch.id,
        mentorIds: batch.mentors.map((m) => m.mentorId),
        menteeIds: batch.mentees.map((m) => m.menteeId)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateBatch = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, academicYear, description, mentorIds, menteeIds } = req.body;

    const existing = await prisma.batch.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found.'
      });
    }

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (academicYear) updateData.academicYear = Number(academicYear);
    if (description !== undefined) updateData.description = description;

    if (Array.isArray(mentorIds)) {
      await prisma.batchMentor.deleteMany({ where: { batchId: id } });
      updateData.mentors = {
        create: mentorIds.map((mId) => ({ mentorId: mId }))
      };
    }

    if (Array.isArray(menteeIds)) {
      await prisma.batchMentee.deleteMany({ where: { batchId: id } });
      updateData.mentees = {
        create: menteeIds.map((mId) => ({ menteeId: mId }))
      };
    }

    const batch = await prisma.batch.update({
      where: { id },
      data: updateData,
      include: {
        mentors: { include: { mentor: { select: { id: true, name: true, email: true } } } },
        mentees: { include: { mentee: { select: { id: true, name: true, email: true } } } }
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Batch updated successfully.',
      batch: {
        ...batch,
        _id: batch.id,
        mentorIds: batch.mentors.map((m) => m.mentorId),
        menteeIds: batch.mentees.map((m) => m.menteeId)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const addBatchMembers = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { menteeIds } = req.body;

    if (!menteeIds || !Array.isArray(menteeIds)) {
      return res.status(400).json({
        success: false,
        message: 'menteeIds array is required.'
      });
    }

    for (const menteeId of menteeIds) {
      await prisma.batchMentee.upsert({
        where: {
          batchId_menteeId: { batchId: id, menteeId }
        },
        create: { batchId: id, menteeId },
        update: {}
      });
    }

    const batch = await prisma.batch.findUnique({
      where: { id },
      include: {
        mentors: true,
        mentees: true
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Members added to batch successfully.',
      batch: {
        ...batch,
        _id: batch.id,
        mentorIds: batch.mentors.map((m) => m.mentorId),
        menteeIds: batch.mentees.map((m) => m.menteeId)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const removeBatchMember = async (req, res, next) => {
  try {
    const { id, menteeId } = req.params;

    await prisma.batchMentee.deleteMany({
      where: { batchId: id, menteeId }
    });

    const batch = await prisma.batch.findUnique({
      where: { id },
      include: { mentors: true, mentees: true }
    });

    return res.status(200).json({
      success: true,
      message: 'Member removed from batch.',
      batch: {
        ...batch,
        _id: batch.id,
        mentorIds: batch?.mentors.map((m) => m.mentorId) || [],
        menteeIds: batch?.mentees.map((m) => m.menteeId) || []
      }
    });
  } catch (error) {
    next(error);
  }
};
