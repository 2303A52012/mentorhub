import prisma from '../config/prisma.js';

/**
 * GET /api/v1/doubt-sessions
 * List doubt/explanation sessions scoped to authenticated user
 */
export const getDoubtSessions = async (req, res, next) => {
  try {
    const user = req.user;
    const userId = user.id || user._id;
    const { status, search } = req.query;

    const where = {};

    if (user.role === 'MENTEE') {
      where.menteeId = userId;
    } else if (user.role === 'MENTOR') {
      where.mentorId = userId;
    }
    // ADMIN can see all

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { topic: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { mentee: { name: { contains: q, mode: 'insensitive' } } },
        { mentor: { name: { contains: q, mode: 'insensitive' } } }
      ];
    }

    const sessions = await prisma.doubtSession.findMany({
      where,
      include: {
        mentee: {
          select: {
            id: true,
            name: true,
            email: true,
            menteeProfile: {
              select: { rollNumber: true, branch: true, section: true }
            }
          }
        },
        mentor: {
          select: {
            id: true,
            name: true,
            email: true,
            mentorProfile: {
              select: { designation: true, department: true }
            }
          }
        }
      },
      orderBy: [
        { status: 'asc' }, // PENDING first
        { scheduledDate: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    res.status(200).json({
      success: true,
      count: sessions.length,
      sessions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/doubt-sessions/:id
 * Retrieve details of a specific doubt session
 */
export const getDoubtSessionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const userId = user.id || user._id;

    const session = await prisma.doubtSession.findUnique({
      where: { id },
      include: {
        mentee: {
          select: {
            id: true,
            name: true,
            email: true,
            menteeProfile: {
              select: { rollNumber: true, branch: true, section: true }
            }
          }
        },
        mentor: {
          select: {
            id: true,
            name: true,
            email: true,
            mentorProfile: {
              select: { designation: true, department: true }
            }
          }
        }
      }
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Doubt session not found.' });
    }

    if (user.role === 'MENTEE' && session.menteeId !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this session.' });
    }

    if (user.role === 'MENTOR' && session.mentorId !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this session.' });
    }

    res.status(200).json({ success: true, session });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/doubt-sessions
 * Mentee creates a doubt session / explanation request with their mentor
 */
export const createDoubtSessionRequest = async (req, res, next) => {
  try {
    const user = req.user;
    const userId = user.id || user._id;
    const { topic, description, preferredDate, preferredTime, mode = 'ONLINE' } = req.body;

    if (!topic?.trim() || !description?.trim()) {
      return res.status(400).json({ success: false, message: 'Topic and description are required.' });
    }

    // Find active assigned mentor
    const assignment = await prisma.mentorMenteeAssignment.findFirst({
      where: {
        menteeId: userId,
        status: 'ACTIVE'
      },
      include: {
        mentor: { select: { id: true, name: true, email: true } }
      }
    });

    if (!assignment || !assignment.mentor) {
      return res.status(400).json({
        success: false,
        message: 'You do not have an active assigned mentor to request a session with.'
      });
    }

    const session = await prisma.doubtSession.create({
      data: {
        topic: topic.trim(),
        description: description.trim(),
        preferredDate: preferredDate ? new Date(preferredDate) : null,
        preferredTime: preferredTime?.trim() || 'Flexible / Any time',
        mode,
        status: 'PENDING',
        menteeId: userId,
        mentorId: assignment.mentorId
      },
      include: {
        mentor: { select: { id: true, name: true, email: true } },
        mentee: { select: { id: true, name: true, email: true } }
      }
    });

    // Notify Mentor
    try {
      await prisma.notification.create({
        data: {
          userId: assignment.mentorId,
          type: 'DOUBT_SESSION_REQUEST',
          title: 'New Doubt Session Request',
          message: `${user.name} requested a 1-on-1 session on "${session.topic}".`,
          link: '/mentor/doubt-sessions'
        }
      });
    } catch (notifErr) {
      console.error('Notification error:', notifErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Doubt session request submitted to your mentor.',
      session
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/doubt-sessions/:id/schedule
 * Mentor schedules the session with a timeslot, meet link, or venue
 */
export const scheduleDoubtSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const userId = user.id || user._id;
    const {
      scheduledDate,
      startTime,
      endTime,
      mode = 'ONLINE',
      meetLink = '',
      venue = '',
      mentorNotes = ''
    } = req.body;

    if (!scheduledDate || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Scheduled date, start time, and end time are required.'
      });
    }

    const session = await prisma.doubtSession.findUnique({
      where: { id },
      include: {
        mentee: { select: { id: true, name: true } }
      }
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Doubt session not found.' });
    }

    // Must be assigned mentor or admin
    if (user.role === 'MENTOR' && session.mentorId !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to schedule this session.' });
    }

    const updated = await prisma.doubtSession.update({
      where: { id },
      data: {
        status: 'SCHEDULED',
        scheduledDate: new Date(scheduledDate),
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        mode,
        meetLink: meetLink.trim(),
        venue: venue.trim(),
        mentorNotes: mentorNotes.trim()
      },
      include: {
        mentee: { select: { id: true, name: true, email: true } },
        mentor: { select: { id: true, name: true, email: true } }
      }
    });

    // Notify Mentee
    try {
      const formattedDate = new Date(scheduledDate).toLocaleDateString();
      const locInfo = mode === 'ONLINE' ? 'Online Meet' : venue ? `Venue: ${venue}` : 'In Person';
      await prisma.notification.create({
        data: {
          userId: session.menteeId,
          type: 'DOUBT_SESSION_SCHEDULED',
          title: 'Doubt Session Confirmed & Scheduled',
          message: `Your mentor ${user.name} scheduled your session for ${formattedDate} at ${startTime} - ${endTime} (${locInfo}).`,
          link: '/mentee/doubt-sessions'
        }
      });
    } catch (notifErr) {
      console.error('Notification error:', notifErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Session successfully scheduled and confirmed with the mentee.',
      session: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/doubt-sessions/:id/complete
 * Mark session as COMPLETED with outcome summary notes
 */
export const completeDoubtSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const userId = user.id || user._id;
    const { summaryNotes = '' } = req.body;

    const session = await prisma.doubtSession.findUnique({ where: { id } });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    if (user.role === 'MENTOR' && session.mentorId !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    const updated = await prisma.doubtSession.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        summaryNotes: summaryNotes.trim(),
        completedAt: new Date()
      }
    });

    // Notify Mentee
    try {
      await prisma.notification.create({
        data: {
          userId: session.menteeId,
          type: 'DOUBT_SESSION_COMPLETED',
          title: 'Doubt Session Completed',
          message: `Your session on "${session.topic}" has been marked completed by ${user.name}.`,
          link: '/mentee/doubt-sessions'
        }
      });
    } catch (e) {
      console.error('Notification error:', e);
    }

    res.status(200).json({
      success: true,
      message: 'Session marked as completed.',
      session: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/doubt-sessions/:id/cancel
 * Cancel or Reject doubt session
 */
export const cancelOrRejectDoubtSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const userId = user.id || user._id;
    const { reason = '' } = req.body;

    const session = await prisma.doubtSession.findUnique({ where: { id } });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    const isMentee = session.menteeId === userId;
    const isMentor = session.mentorId === userId;
    const isAdmin = user.role === 'ADMIN';

    if (!isMentee && !isMentor && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    const newStatus = isMentor ? 'REJECTED' : 'CANCELLED';

    const updated = await prisma.doubtSession.update({
      where: { id },
      data: {
        status: newStatus,
        rejectionReason: reason.trim()
      }
    });

    // Notify the other party
    try {
      const recipientId = isMentee ? session.mentorId : session.menteeId;
      await prisma.notification.create({
        data: {
          userId: recipientId,
          type: 'DOUBT_SESSION_CANCELLED',
          title: `Doubt Session ${newStatus}`,
          message: `${user.name} marked the session on "${session.topic}" as ${newStatus}. ${reason ? `Reason: ${reason}` : ''}`,
          link: user.role === 'MENTEE' ? '/mentor/doubt-sessions' : '/mentee/doubt-sessions'
        }
      });
    } catch (e) {
      console.error('Notification error:', e);
    }

    res.status(200).json({
      success: true,
      message: `Session ${newStatus.toLowerCase()}.`,
      session: updated
    });
  } catch (error) {
    next(error);
  }
};
