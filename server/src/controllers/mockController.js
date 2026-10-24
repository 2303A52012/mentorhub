import prisma from '../config/prisma.js';

/**
 * Check if two time intervals overlap (HH:MM format)
 * Allows back-to-back: startA === endB or endA === startB is NOT an overlap.
 */
export const isTimeOverlap = (startA, endA, startB, endB) => {
  return startA < endB && endA > startB;
};

/**
 * Normalize date to UTC YYYY-MM-DD
 */
export const normalizeDate = (dateInput) => {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
};

export const formatDateString = (dateInput) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  return d.toISOString().split('T')[0];
};

/**
 * Helper to get mentor's authorized mentee IDs
 */
export const getAuthorizedMenteeIds = async (mentorId, userRole) => {
  if (userRole === 'ADMIN') {
    const allMentees = await prisma.user.findMany({
      where: { role: 'MENTEE' },
      select: { id: true }
    });
    return allMentees.map((m) => m.id);
  }

  const assignments = await prisma.mentorMenteeAssignment.findMany({
    where: {
      mentorId,
      status: 'ACTIVE'
    },
    select: { menteeId: true }
  });

  return assignments.map((a) => a.menteeId);
};

// ==========================================
// 1. LIST MOCK SECTIONS (WITH SUMMARY STATS)
// ==========================================
export const getMockSections = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const { weekNumber, status, mockType, search } = req.query;

    const authorizedMenteeIds = await getAuthorizedMenteeIds(userId, req.user.role);

    // Filter condition
    const where = {};

    if (req.user.role !== 'ADMIN') {
      where.OR = [
        { createdById: userId },
        { slots: { some: { evaluatorId: userId } } }
      ];
    }

    if (weekNumber) {
      where.weekNumber = parseInt(weekNumber, 10);
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (mockType && mockType !== 'ALL') {
      where.mockType = mockType;
    }

    if (search && search.trim()) {
      where.title = { contains: search.trim(), mode: 'insensitive' };
    }

    const sections = await prisma.mockSection.findMany({
      where,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        targetBatch: {
          select: { id: true, name: true }
        },
        sessions: {
          orderBy: { sessionDate: 'asc' }
        },
        slots: {
          include: {
            evaluation: true
          }
        }
      },
      orderBy: [{ weekNumber: 'desc' }, { createdAt: 'desc' }]
    });

    const totalCohortMentees = authorizedMenteeIds.length;

    // Process summary counts per section
    const formattedSections = sections.map((sec) => {
      const activeSlots = sec.slots.filter((s) => s.status !== 'CANCELLED');
      const scheduledCount = sec.slots.filter((s) => s.status === 'SCHEDULED').length;
      const completedCount = sec.slots.filter((s) => s.status === 'COMPLETED').length;
      const missedCount = sec.slots.filter((s) => s.status === 'MISSED').length;
      const cancelledCount = sec.slots.filter((s) => s.status === 'CANCELLED').length;

      // Unique mentees assigned in this section
      const assignedMenteeIdsInSec = new Set(activeSlots.map((s) => s.menteeId));
      const notPlannedCount = Math.max(0, totalCohortMentees - assignedMenteeIdsInSec.size);

      // Determine date range representation
      let dateRangeStr = 'Dates not configured';
      if (sec.sessions && sec.sessions.length > 0) {
        const sortedDates = sec.sessions.map((s) => formatDateString(s.sessionDate)).sort();
        dateRangeStr = sortedDates.length === 1
          ? sortedDates[0]
          : `${sortedDates[0]} to ${sortedDates[sortedDates.length - 1]}`;
      } else if (sec.sessionStartDate) {
        dateRangeStr = sec.sessionEndDate
          ? `${formatDateString(sec.sessionStartDate)} to ${formatDateString(sec.sessionEndDate)}`
          : formatDateString(sec.sessionStartDate);
      }

      return {
        id: sec.id,
        title: sec.title,
        weekNumber: sec.weekNumber,
        mockType: sec.mockType,
        description: sec.description,
        status: sec.status,
        defaultVenue: sec.defaultVenue,
        defaultSlotDurationMinutes: sec.defaultSlotDurationMinutes,
        targetBatch: sec.targetBatch,
        createdBy: sec.createdBy,
        createdAt: sec.createdAt,
        updatedAt: sec.updatedAt,
        dateRange: dateRangeStr,
        totalAssignedMentees: assignedMenteeIdsInSec.size,
        scheduledCount,
        completedCount,
        missedCount,
        cancelledCount,
        notPlannedCount
      };
    });

    // Global summary across all sections
    const globalSummary = {
      totalSections: formattedSections.length,
      scheduledTotal: formattedSections.reduce((acc, s) => acc + s.scheduledCount, 0),
      completedTotal: formattedSections.reduce((acc, s) => acc + s.completedCount, 0),
      missedTotal: formattedSections.reduce((acc, s) => acc + s.missedCount, 0),
      notPlannedCohort: totalCohortMentees
    };

    return res.status(200).json({
      success: true,
      sections: formattedSections,
      globalSummary
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. CREATE NEW MOCK SECTION
// ==========================================
export const createMockSection = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const {
      title,
      weekNumber,
      mockType,
      description,
      targetBatchId,
      defaultSlotDurationMinutes,
      defaultVenue,
      sessionStartDate,
      sessionEndDate,
      sessions
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Mock section title is required.' });
    }

    if (!weekNumber || parseInt(weekNumber, 10) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid week number is required.' });
    }

    const duration = defaultSlotDurationMinutes ? parseInt(defaultSlotDurationMinutes, 10) : 30;

    const newSection = await prisma.mockSection.create({
      data: {
        title: title.trim(),
        weekNumber: parseInt(weekNumber, 10),
        mockType: mockType || 'TECHNICAL',
        description: description || '',
        targetBatchId: targetBatchId || null,
        defaultSlotDurationMinutes: duration,
        defaultVenue: defaultVenue || 'Lab 3 / Meeting Room',
        sessionStartDate: sessionStartDate ? normalizeDate(sessionStartDate) : null,
        sessionEndDate: sessionEndDate ? normalizeDate(sessionEndDate) : null,
        createdById: userId,
        status: 'DRAFT',
        sessions: {
          create: Array.isArray(sessions) && sessions.length > 0
            ? sessions.map((s) => ({
                sessionDate: normalizeDate(s.sessionDate),
                startTime: s.startTime || '10:00',
                endTime: s.endTime || '17:00',
                defaultSlotDurationMinutes: duration,
                defaultRoom: s.defaultRoom || defaultVenue || 'Main Interview Hall',
                evaluatorId: s.evaluatorId || userId
              }))
            : []
        }
      },
      include: {
        sessions: true,
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Mock section created in draft state.',
      section: newSection
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. GET DEDICATED MOCK SECTION DETAILS
// ==========================================
export const getMockSectionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;

    const section = await prisma.mockSection.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        targetBatch: { select: { id: true, name: true } },
        sessions: {
          orderBy: { sessionDate: 'asc' },
          include: {
            evaluator: { select: { id: true, name: true, email: true } }
          }
        },
        slots: {
          orderBy: [{ sessionDate: 'asc' }, { startTime: 'asc' }],
          include: {
            mentee: {
              select: {
                id: true,
                name: true,
                email: true,
                menteeProfile: true
              }
            },
            evaluator: {
              select: { id: true, name: true, email: true }
            },
            evaluation: true,
            history: {
              orderBy: { createdAt: 'desc' },
              include: {
                changedBy: { select: { id: true, name: true } }
              }
            }
          }
        }
      }
    });

    if (!section) {
      return res.status(404).json({ success: false, message: 'Mock section not found.' });
    }

    // Verify mentor access (creator or evaluator or admin)
    if (req.user.role !== 'ADMIN' && section.createdById !== userId) {
      const isEvaluator = section.slots.some((s) => s.evaluatorId === userId);
      if (!isEvaluator) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this mock section.'
        });
      }
    }

    // Retrieve full authorized mentee cohort for this mentor
    const authorizedMenteeIds = await getAuthorizedMenteeIds(userId, req.user.role);

    const authorizedMentees = await prisma.user.findMany({
      where: {
        id: { in: authorizedMenteeIds },
        accountStatus: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        email: true,
        menteeProfile: true,
        menteeBatches: {
          include: { batch: { select: { id: true, name: true } } }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Match active slot per mentee
    const activeSlotMap = new Map();
    section.slots.forEach((slot) => {
      if (slot.status !== 'CANCELLED') {
        activeSlotMap.set(slot.menteeId, slot);
      }
    });

    const menteesWithAssignment = authorizedMentees.map((m) => {
      const assignedSlot = activeSlotMap.get(m.id) || null;
      return {
        ...m,
        assignedSlot: assignedSlot
          ? {
              id: assignedSlot.id,
              sessionDate: assignedSlot.sessionDate,
              startTime: assignedSlot.startTime,
              endTime: assignedSlot.endTime,
              roomNumber: assignedSlot.roomNumber,
              status: assignedSlot.status,
              evaluator: assignedSlot.evaluator,
              evaluation: assignedSlot.evaluation
            }
          : null,
        isAssigned: !!assignedSlot
      };
    });

    const unassignedMentees = menteesWithAssignment.filter((m) => !m.isAssigned);

    // Section Stats
    const scheduledCount = section.slots.filter((s) => s.status === 'SCHEDULED').length;
    const completedCount = section.slots.filter((s) => s.status === 'COMPLETED').length;
    const missedCount = section.slots.filter((s) => s.status === 'MISSED').length;
    const cancelledCount = section.slots.filter((s) => s.status === 'CANCELLED').length;
    const notPlannedCount = unassignedMentees.length;

    return res.status(200).json({
      success: true,
      section: {
        ...section,
        stats: {
          totalCohort: authorizedMentees.length,
          scheduledCount,
          completedCount,
          missedCount,
          cancelledCount,
          notPlannedCount
        }
      },
      cohortMentees: menteesWithAssignment,
      unassignedMentees
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 4. UPDATE MOCK SECTION
// ==========================================
export const updateMockSection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;
    const {
      title,
      weekNumber,
      mockType,
      description,
      targetBatchId,
      defaultSlotDurationMinutes,
      defaultVenue,
      sessionStartDate,
      sessionEndDate
    } = req.body;

    const existing = await prisma.mockSection.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Mock section not found.' });
    }

    if (req.user.role !== 'ADMIN' && existing.createdById !== userId) {
      return res.status(403).json({ success: false, message: 'Permission denied.' });
    }

    const updated = await prisma.mockSection.update({
      where: { id },
      data: {
        title: title ? title.trim() : existing.title,
        weekNumber: weekNumber ? parseInt(weekNumber, 10) : existing.weekNumber,
        mockType: mockType || existing.mockType,
        description: description !== undefined ? description : existing.description,
        targetBatchId: targetBatchId !== undefined ? targetBatchId : existing.targetBatchId,
        defaultSlotDurationMinutes: defaultSlotDurationMinutes
          ? parseInt(defaultSlotDurationMinutes, 10)
          : existing.defaultSlotDurationMinutes,
        defaultVenue: defaultVenue !== undefined ? defaultVenue : existing.defaultVenue,
        sessionStartDate: sessionStartDate ? normalizeDate(sessionStartDate) : existing.sessionStartDate,
        sessionEndDate: sessionEndDate ? normalizeDate(sessionEndDate) : existing.sessionEndDate
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Mock section updated.',
      section: updated
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 5. MANUAL TIME-SLOT ASSIGNMENT
// ==========================================
export const assignSlot = async (req, res, next) => {
  try {
    const { id: sectionId } = req.params;
    const userId = req.user.id || req.user._id;
    const {
      menteeId,
      sessionDate,
      startTime,
      endTime,
      roomNumber,
      sessionId,
      evaluatorId
    } = req.body;

    // 1. Basic validation
    if (!menteeId || !sessionDate || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Mentee, session date, start time, and end time are required.'
      });
    }

    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        message: 'Slot end time must be after start time.'
      });
    }

    const section = await prisma.mockSection.findUnique({ where: { id: sectionId } });
    if (!section) {
      return res.status(404).json({ success: false, message: 'Mock section not found.' });
    }

    // 2. Validate mentee belongs to mentor's authorized cohort
    const authorizedMentees = await getAuthorizedMenteeIds(userId, req.user.role);
    if (!authorizedMentees.includes(menteeId)) {
      return res.status(403).json({
        success: false,
        message: 'Selected mentee does not belong to your authorized cohort.'
      });
    }

    const targetEvaluatorId = evaluatorId || userId;
    const targetRoom = roomNumber?.trim() || section.defaultVenue || 'Room 101';
    const targetDate = normalizeDate(sessionDate);
    const dateStr = formatDateString(targetDate);

    // 3. Reject duplicate active assignment for the same mentee in this section
    const existingMenteeSlotInSection = await prisma.mockSlot.findFirst({
      where: {
        sectionId,
        menteeId,
        status: { not: 'CANCELLED' }
      }
    });

    if (existingMenteeSlotInSection) {
      return res.status(400).json({
        success: false,
        message: `Mentee already has an active slot in this section (${existingMenteeSlotInSection.startTime} - ${existingMenteeSlotInSection.endTime}). Edit or reschedule the existing slot instead.`
      });
    }

    // 4. Overlap & Conflict Validations across the entire platform on targetDate
    const dateStart = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate(), 0, 0, 0, 0));
    const dateEnd = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate(), 23, 59, 59, 999));

    const activeSlotsOnDate = await prisma.mockSlot.findMany({
      where: {
        sessionDate: {
          gte: dateStart,
          lte: dateEnd
        },
        status: { not: 'CANCELLED' }
      },
      include: {
        mentee: { select: { name: true } },
        evaluator: { select: { name: true } }
      }
    });

    // Check Evaluator conflict
    const evaluatorConflict = activeSlotsOnDate.find((s) =>
      s.evaluatorId === targetEvaluatorId && isTimeOverlap(s.startTime, s.endTime, startTime, endTime)
    );
    if (evaluatorConflict) {
      return res.status(400).json({
        success: false,
        message: `Conflict: Evaluator is already booked from ${evaluatorConflict.startTime} to ${evaluatorConflict.endTime} with student ${evaluatorConflict.mentee?.name}.`
      });
    }

    // Check Mentee conflict
    const menteeConflict = activeSlotsOnDate.find((s) =>
      s.menteeId === menteeId && isTimeOverlap(s.startTime, s.endTime, startTime, endTime)
    );
    if (menteeConflict) {
      return res.status(400).json({
        success: false,
        message: `Conflict: Mentee already has another mock slot from ${menteeConflict.startTime} to ${menteeConflict.endTime}.`
      });
    }

    // Check Room conflict
    if (targetRoom && targetRoom.toLowerCase() !== 'tbd') {
      const roomConflict = activeSlotsOnDate.find((s) =>
        s.roomNumber &&
        s.roomNumber.trim().toLowerCase() === targetRoom.trim().toLowerCase() &&
        isTimeOverlap(s.startTime, s.endTime, startTime, endTime)
      );
      if (roomConflict) {
        return res.status(400).json({
          success: false,
          message: `Conflict: ${targetRoom} is already occupied from ${roomConflict.startTime} to ${roomConflict.endTime}.`
        });
      }
    }

    // 5. Create the slot inside transaction
    const newSlot = await prisma.$transaction(async (tx) => {
      const slot = await tx.mockSlot.create({
        data: {
          sectionId,
          sessionId: sessionId || null,
          menteeId,
          evaluatorId: targetEvaluatorId,
          sessionDate: targetDate,
          startTime,
          endTime,
          roomNumber: targetRoom,
          status: 'SCHEDULED'
        },
        include: {
          mentee: { select: { id: true, name: true, email: true, menteeProfile: true } },
          evaluator: { select: { id: true, name: true, email: true } }
        }
      });

      await tx.mockSlotHistory.create({
        data: {
          slotId: slot.id,
          action: 'CREATED',
          previousDate: targetDate,
          previousStartTime: startTime,
          previousEndTime: endTime,
          previousRoom: targetRoom,
          reason: 'Initial slot scheduled',
          changedById: userId
        }
      });

      return slot;
    }, { timeout: 25000, maxWait: 10000 });

    // If section was already published, send notification to mentee
    if (section.status === 'PUBLISHED') {
      await prisma.notification.create({
        data: {
          userId: menteeId,
          type: 'MOCK_SCHEDULED',
          title: `Weekly Mock Scheduled: ${section.title}`,
          message: `Your interview slot is set for ${dateStr} from ${startTime} to ${endTime} at ${targetRoom}.`,
          link: '/mentee/mocks'
        }
      }).catch(() => null);
    }

    return res.status(201).json({
      success: true,
      message: 'Time-slot assigned successfully.',
      slot: newSlot
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 6. EDIT OR RESCHEDULE TIME-SLOT
// ==========================================
export const updateSlot = async (req, res, next) => {
  try {
    const { slotId } = req.params;
    const userId = req.user.id || req.user._id;
    const {
      sessionDate,
      startTime,
      endTime,
      roomNumber,
      evaluatorId,
      reason
    } = req.body;

    const slot = await prisma.mockSlot.findUnique({
      where: { id: slotId },
      include: {
        section: true,
        mentee: { select: { id: true, name: true } },
        evaluator: { select: { id: true, name: true } }
      }
    });

    if (!slot) {
      return res.status(404).json({ success: false, message: 'Mock slot not found.' });
    }

    if (slot.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Completed slots cannot be rescheduled.'
      });
    }

    const targetStartTime = startTime || slot.startTime;
    const targetEndTime = endTime || slot.endTime;

    if (targetStartTime >= targetEndTime) {
      return res.status(400).json({
        success: false,
        message: 'Slot end time must be after start time.'
      });
    }

    const targetDate = sessionDate ? normalizeDate(sessionDate) : slot.sessionDate;
    const targetEvaluatorId = evaluatorId || slot.evaluatorId;
    const targetRoom = roomNumber ? roomNumber.trim() : slot.roomNumber;

    // Check conflicts excluding this slot itself
    const dateStart = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate(), 0, 0, 0, 0));
    const dateEnd = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate(), 23, 59, 59, 999));

    const activeSlotsOnDate = await prisma.mockSlot.findMany({
      where: {
        id: { not: slotId },
        sessionDate: {
          gte: dateStart,
          lte: dateEnd
        },
        status: { not: 'CANCELLED' }
      },
      include: {
        mentee: { select: { name: true } }
      }
    });

    // Check Evaluator conflict
    const evaluatorConflict = activeSlotsOnDate.find((s) =>
      s.evaluatorId === targetEvaluatorId && isTimeOverlap(s.startTime, s.endTime, targetStartTime, targetEndTime)
    );
    if (evaluatorConflict) {
      return res.status(400).json({
        success: false,
        message: `Conflict: Evaluator already booked from ${evaluatorConflict.startTime} to ${evaluatorConflict.endTime} with ${evaluatorConflict.mentee?.name}.`
      });
    }

    // Check Mentee conflict
    const menteeConflict = activeSlotsOnDate.find((s) =>
      s.menteeId === slot.menteeId && isTimeOverlap(s.startTime, s.endTime, targetStartTime, targetEndTime)
    );
    if (menteeConflict) {
      return res.status(400).json({
        success: false,
        message: `Conflict: Mentee already has another slot from ${menteeConflict.startTime} to ${menteeConflict.endTime}.`
      });
    }

    // Check Room conflict
    if (targetRoom && targetRoom.toLowerCase() !== 'tbd') {
      const roomConflict = activeSlotsOnDate.find((s) =>
        s.roomNumber &&
        s.roomNumber.trim().toLowerCase() === targetRoom.trim().toLowerCase() &&
        isTimeOverlap(s.startTime, s.endTime, targetStartTime, targetEndTime)
      );
      if (roomConflict) {
        return res.status(400).json({
          success: false,
          message: `Conflict: ${targetRoom} is already booked from ${roomConflict.startTime} to ${roomConflict.endTime}.`
        });
      }
    }

    const updatedSlot = await prisma.$transaction(async (tx) => {
      const s = await tx.mockSlot.update({
        where: { id: slotId },
        data: {
          sessionDate: targetDate,
          startTime: targetStartTime,
          endTime: targetEndTime,
          roomNumber: targetRoom,
          evaluatorId: targetEvaluatorId,
          status: 'SCHEDULED'
        },
        include: {
          mentee: { select: { id: true, name: true, email: true, menteeProfile: true } },
          evaluator: { select: { id: true, name: true, email: true } },
          evaluation: true
        }
      });

      await tx.mockSlotHistory.create({
        data: {
          slotId,
          action: 'RESCHEDULED',
          previousDate: slot.sessionDate,
          previousStartTime: slot.startTime,
          previousEndTime: slot.endTime,
          previousRoom: slot.roomNumber,
          reason: reason || 'Slot rescheduled by mentor',
          changedById: userId
        }
      });

      return s;
    }, { timeout: 25000, maxWait: 10000 });

    // Notify mentee if section was published
    if (slot.section.status === 'PUBLISHED') {
      await prisma.notification.create({
        data: {
          userId: slot.menteeId,
          type: 'MOCK_RESCHEDULED',
          title: `Mock Interview Rescheduled: ${slot.section.title}`,
          message: `Your appointment is updated to ${formatDateString(targetDate)} at ${targetStartTime} - ${targetEndTime} (${targetRoom}).`,
          link: '/mentee/mocks'
        }
      }).catch(() => null);
    }

    return res.status(200).json({
      success: true,
      message: 'Slot rescheduled successfully.',
      slot: updatedSlot
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 7. CANCEL TIME-SLOT
// ==========================================
export const cancelSlot = async (req, res, next) => {
  try {
    const { slotId } = req.params;
    const userId = req.user.id || req.user._id;
    const { reason } = req.body;

    const slot = await prisma.mockSlot.findUnique({
      where: { id: slotId },
      include: { section: true }
    });

    if (!slot) {
      return res.status(404).json({ success: false, message: 'Mock slot not found.' });
    }

    const cancelledSlot = await prisma.$transaction(async (tx) => {
      const s = await tx.mockSlot.update({
        where: { id: slotId },
        data: { status: 'CANCELLED' }
      });

      await tx.mockSlotHistory.create({
        data: {
          slotId,
          action: 'CANCELLED',
          previousDate: slot.sessionDate,
          previousStartTime: slot.startTime,
          previousEndTime: slot.endTime,
          previousRoom: slot.roomNumber,
          reason: reason || 'Cancelled by mentor',
          changedById: userId
        }
      });

      return s;
    }, { timeout: 25000, maxWait: 10000 });

    // If section was published, notify mentee
    if (slot.section.status === 'PUBLISHED') {
      await prisma.notification.create({
        data: {
          userId: slot.menteeId,
          type: 'MOCK_CANCELLED',
          title: `Mock Slot Cancelled: ${slot.section.title}`,
          message: `Your interview appointment on ${formatDateString(slot.sessionDate)} has been cancelled.`,
          link: '/mentee/mocks'
        }
      }).catch(() => null);
    }

    return res.status(200).json({
      success: true,
      message: 'Slot cancelled successfully. Mentee is now unassigned for this section.',
      slot: cancelledSlot
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 8. MARK SLOT AS MISSED (CONFIRMATION REQUIRED)
// ==========================================
export const markSlotMissed = async (req, res, next) => {
  try {
    const { slotId } = req.params;
    const userId = req.user.id || req.user._id;
    const { reason } = req.body;

    const slot = await prisma.mockSlot.findUnique({
      where: { id: slotId },
      include: { section: true }
    });

    if (!slot) {
      return res.status(404).json({ success: false, message: 'Mock slot not found.' });
    }

    if (slot.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'A completed mock cannot be marked as missed.'
      });
    }

    const updatedSlot = await prisma.$transaction(async (tx) => {
      const s = await tx.mockSlot.update({
        where: { id: slotId },
        data: { status: 'MISSED' }
      });

      await tx.mockSlotHistory.create({
        data: {
          slotId,
          action: 'MARKED_MISSED',
          previousDate: slot.sessionDate,
          previousStartTime: slot.startTime,
          previousEndTime: slot.endTime,
          previousRoom: slot.roomNumber,
          reason: reason || 'Candidate was absent during scheduled window',
          changedById: userId
        }
      });

      return s;
    }, { timeout: 25000, maxWait: 10000 });

    await prisma.notification.create({
      data: {
        userId: slot.menteeId,
        type: 'MOCK_MISSED',
        title: `Mock Interview Missed: ${slot.section.title}`,
        message: `You were marked absent for your mock session on ${formatDateString(slot.sessionDate)} at ${slot.startTime}. Please reach out to your mentor.`,
        link: '/mentee/mocks'
      }
    }).catch(() => null);

    return res.status(200).json({
      success: true,
      message: 'Slot recorded as missed.',
      slot: updatedSlot
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 9. PUBLISH MOCK SECTION AND NOTIFY
// ==========================================
export const publishSection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;

    const section = await prisma.mockSection.findUnique({
      where: { id },
      include: {
        slots: {
          where: { status: 'SCHEDULED' },
          include: {
            mentee: { select: { id: true, name: true, email: true } }
          }
        }
      }
    });

    if (!section) {
      return res.status(404).json({ success: false, message: 'Mock section not found.' });
    }

    // Check cohort coverage
    const authorizedMentees = await getAuthorizedMenteeIds(userId, req.user.role);
    const assignedMenteeIds = new Set(section.slots.map((s) => s.menteeId));
    const unassignedCount = authorizedMentees.filter((mId) => !assignedMenteeIds.has(mId)).length;

    await prisma.mockSection.update({
      where: { id },
      data: { status: 'PUBLISHED' }
    });

    // Notify all mentees with scheduled slots (prevent duplicates by checking recent notifications)
    for (const slot of section.slots) {
      const alreadyNotified = await prisma.notification.findFirst({
        where: {
          userId: slot.menteeId,
          type: 'MOCK_PUBLISHED',
          title: `Weekly Mock Published: ${section.title}`
        }
      });

      if (!alreadyNotified) {
        await prisma.notification.create({
          data: {
            userId: slot.menteeId,
            type: 'MOCK_PUBLISHED',
            title: `Weekly Mock Published: ${section.title}`,
            message: `Week ${section.weekNumber} (${section.mockType}) schedule is published. Your slot: ${formatDateString(slot.sessionDate)} at ${slot.startTime} - ${slot.endTime} in ${slot.roomNumber}.`,
            link: '/mentee/mocks'
          }
        }).catch(() => null);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Mock section published successfully. Confirmed appointments are now visible to mentees.',
      unassignedWarning: unassignedCount > 0
        ? `${unassignedCount} mentees in your cohort still do not have slots assigned.`
        : null,
      publishedSlotsCount: section.slots.length
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 10. RECORD EVALUATION INSIDE MENTEE'S SLOT
// ==========================================
export const recordEvaluation = async (req, res, next) => {
  try {
    const { slotId } = req.params;
    const evaluatorId = req.user.id || req.user._id;
    const {
      overallScore,
      technicalScore,
      communicationScore,
      problemSolvingScore,
      recommendation,
      notes
    } = req.body;

    const slot = await prisma.mockSlot.findUnique({
      where: { id: slotId },
      include: {
        section: true,
        mentee: { select: { id: true, name: true, email: true } },
        evaluation: true
      }
    });

    if (!slot) {
      return res.status(404).json({ success: false, message: 'Mock slot not found.' });
    }

    // Validation of scores
    const overall = parseFloat(overallScore);
    const tech = parseFloat(technicalScore);
    const comm = parseFloat(communicationScore);
    const problemSolving = parseFloat(problemSolvingScore);

    if (isNaN(overall) || overall < 0 || overall > 10) {
      return res.status(400).json({ success: false, message: 'Overall score must be between 0 and 10.' });
    }
    if (isNaN(tech) || tech < 0 || tech > 5) {
      return res.status(400).json({ success: false, message: 'Technical score must be between 0 and 5.' });
    }
    if (isNaN(comm) || comm < 0 || comm > 5) {
      return res.status(400).json({ success: false, message: 'Communication score must be between 0 and 5.' });
    }
    if (isNaN(problemSolving) || problemSolving < 0 || problemSolving > 5) {
      return res.status(400).json({ success: false, message: 'Problem-solving score must be between 0 and 5.' });
    }

    const validRecommendations = [
      'STRONGLY_RECOMMENDED',
      'RECOMMENDED',
      'RECOMMENDED_WITH_IMPROVEMENT',
      'NOT_RECOMMENDED_YET'
    ];

    if (!recommendation || !validRecommendations.includes(recommendation)) {
      return res.status(400).json({
        success: false,
        message: 'Valid recommendation is required (STRONGLY_RECOMMENDED, RECOMMENDED, RECOMMENDED_WITH_IMPROVEMENT, or NOT_RECOMMENDED_YET).'
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Upsert evaluation
      const evalRecord = await tx.mockEvaluation.upsert({
        where: { slotId },
        create: {
          slotId,
          menteeId: slot.menteeId,
          evaluatorId,
          overallScore: overall,
          technicalScore: tech,
          communicationScore: comm,
          problemSolvingScore: problemSolving,
          recommendation,
          notes: notes || ''
        },
        update: {
          evaluatorId,
          overallScore: overall,
          technicalScore: tech,
          communicationScore: comm,
          problemSolvingScore: problemSolving,
          recommendation,
          notes: notes || ''
        }
      });

      // Update slot to COMPLETED
      await tx.mockSlot.update({
        where: { id: slotId },
        data: { status: 'COMPLETED' }
      });

      await tx.mockSlotHistory.create({
        data: {
          slotId,
          action: 'EVALUATED',
          previousDate: slot.sessionDate,
          previousStartTime: slot.startTime,
          previousEndTime: slot.endTime,
          previousRoom: slot.roomNumber,
          reason: `Evaluation recorded: Overall ${overall}/10 (${recommendation})`,
          changedById: evaluatorId
        }
      });

      return evalRecord;
    }, { timeout: 25000, maxWait: 10000 });

    // Notify candidate
    await prisma.notification.create({
      data: {
        userId: slot.menteeId,
        type: 'MOCK_EVALUATION_RELEASED',
        title: `Mock Evaluation Available: ${slot.section.title}`,
        message: `Your performance score (${overall}/10) and feedback for Week ${slot.section.weekNumber} have been published.`,
        link: '/mentee/mocks'
      }
    }).catch(() => null);

    return res.status(200).json({
      success: true,
      message: 'Evaluation saved successfully and slot marked as COMPLETED.',
      evaluation: result
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 11. MENTEE VIEW: CONFIRMED MOCKS & EVALUATIONS
// ==========================================
export const getMenteeMocks = async (req, res, next) => {
  try {
    const menteeId = req.user.id || req.user._id;

    // Published slots OR completed evaluations are visible to the candidate
    const slots = await prisma.mockSlot.findMany({
      where: {
        menteeId,
        OR: [
          { section: { status: 'PUBLISHED' } },
          { status: 'COMPLETED' }
        ]
      },
      include: {
        section: {
          select: {
            id: true,
            title: true,
            weekNumber: true,
            mockType: true,
            description: true,
            defaultVenue: true
          }
        },
        evaluator: {
          select: {
            id: true,
            name: true,
            email: true,
            mentorProfile: true
          }
        },
        evaluation: true
      },
      orderBy: [{ sessionDate: 'desc' }, { startTime: 'desc' }]
    });

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Partition upcoming vs completed/previous
    const upcoming = [];
    const completedOrPast = [];

    slots.forEach((slot) => {
      const slotDateStr = formatDateString(slot.sessionDate);
      if (slot.status === 'SCHEDULED' && slotDateStr >= todayStr) {
        upcoming.push(slot);
      } else {
        completedOrPast.push(slot);
      }
    });

    return res.status(200).json({
      success: true,
      upcoming,
      history: completedOrPast,
      totalCount: slots.length
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 12. MENTOR VIEW: MENTEE'S MOCK HISTORY
// ==========================================
export const getMenteeMockHistory = async (req, res, next) => {
  try {
    const { menteeId } = req.params;
    const userId = req.user.id || req.user._id;

    const authorizedMentees = await getAuthorizedMenteeIds(userId, req.user.role);
    if (!authorizedMentees.includes(menteeId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this mentee\'s mock history.'
      });
    }

    const mentee = await prisma.user.findUnique({
      where: { id: menteeId },
      select: {
        id: true,
        name: true,
        email: true,
        menteeProfile: true
      }
    });

    if (!mentee) {
      return res.status(404).json({ success: false, message: 'Mentee not found.' });
    }

    const slots = await prisma.mockSlot.findMany({
      where: { menteeId },
      include: {
        section: {
          select: { id: true, title: true, weekNumber: true, mockType: true, status: true }
        },
        evaluator: { select: { id: true, name: true, email: true } },
        evaluation: true,
        history: { orderBy: { createdAt: 'desc' } }
      },
      orderBy: [{ sessionDate: 'desc' }, { startTime: 'desc' }]
    });

    // Compute metrics
    const completedEvaluations = slots.filter((s) => s.evaluation);
    const avgOverall = completedEvaluations.length > 0
      ? (completedEvaluations.reduce((acc, s) => acc + s.evaluation.overallScore, 0) / completedEvaluations.length).toFixed(1)
      : null;

    return res.status(200).json({
      success: true,
      mentee,
      slots,
      metrics: {
        totalMocksScheduled: slots.filter((s) => s.status !== 'CANCELLED').length,
        completedCount: slots.filter((s) => s.status === 'COMPLETED').length,
        missedCount: slots.filter((s) => s.status === 'MISSED').length,
        averageOverallScore: avgOverall
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 13. MENTOR AVAILABILITY / TIMELINE HELPER
// ==========================================
export const getMentorAvailability = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const { date, roomNumber } = req.query;

    if (!date) {
      return res.status(400).json({ success: false, message: 'Date is required.' });
    }

    const targetDate = normalizeDate(date);
    const dateStart = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate(), 0, 0, 0, 0));
    const dateEnd = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate(), 23, 59, 59, 999));

    const bookedSlots = await prisma.mockSlot.findMany({
      where: {
        sessionDate: {
          gte: dateStart,
          lte: dateEnd
        },
        status: { not: 'CANCELLED' },
        OR: [
          { evaluatorId: userId },
          roomNumber ? { roomNumber: { equals: roomNumber.trim(), mode: 'insensitive' } } : {}
        ]
      },
      include: {
        mentee: { select: { name: true } }
      },
      orderBy: { startTime: 'asc' }
    });

    const busyIntervals = bookedSlots.map((s) => ({
      slotId: s.id,
      startTime: s.startTime,
      endTime: s.endTime,
      roomNumber: s.roomNumber,
      isEvaluator: s.evaluatorId === userId,
      menteeName: s.mentee?.name
    }));

    return res.status(200).json({
      success: true,
      date: formatDateString(targetDate),
      busyIntervals
    });
  } catch (error) {
    next(error);
  }
};
