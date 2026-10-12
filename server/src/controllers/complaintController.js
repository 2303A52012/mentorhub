import prisma from '../config/prisma.js';

/**
 * Helper to build access filter based on user role & ID
 * Enforces strict privacy boundaries:
 * - Mentee: only sees their own created complaints
 * - Mentor: only sees complaints created by themselves OR addressed to them as MENTOR (NEVER mentee complaints to ADMIN)
 * - Admin: only sees complaints addressed to ADMIN OR complaints escalated/forwarded to Admin (NEVER mentee->mentor complaints until forwarded)
 */
const getComplaintAccessFilter = (user) => {
  const userId = user.id || user._id;

  if (user.role === 'MENTEE') {
    return { creatorId: userId };
  }

  if (user.role === 'MENTOR') {
    return {
      OR: [
        { creatorId: userId },
        {
          targetType: 'MENTOR',
          mentorId: userId
        }
      ]
    };
  }

  if (user.role === 'ADMIN') {
    return {
      OR: [
        { targetType: 'ADMIN' },
        { isForwardedToAdmin: true }
      ]
    };
  }

  // Fallback no access
  return { id: '__NO_ACCESS__' };
};

/**
 * GET /api/v1/complaints
 * List all complaints accessible to the authenticated user
 */
export const getComplaints = async (req, res, next) => {
  try {
    const user = req.user;
    const { status, targetType, priority, category, search } = req.query;

    const accessFilter = getComplaintAccessFilter(user);

    const andConditions = [accessFilter];

    if (status && status !== 'ALL') {
      andConditions.push({ status });
    }

    if (targetType && targetType !== 'ALL') {
      andConditions.push({ targetType });
    }

    if (priority && priority !== 'ALL') {
      andConditions.push({ priority });
    }

    if (category && category !== 'ALL') {
      andConditions.push({ category });
    }

    if (search && search.trim()) {
      const q = search.trim();
      andConditions.push({
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { creator: { name: { contains: q, mode: 'insensitive' } } }
        ]
      });
    }

    const complaints = await prisma.complaint.findMany({
      where: { AND: andConditions },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            menteeProfile: { select: { rollNumber: true, branch: true, section: true } },
            mentorProfile: { select: { designation: true, department: true } }
          }
        },
        mentor: {
          select: {
            id: true,
            name: true,
            email: true,
            mentorProfile: { select: { designation: true, department: true } }
          }
        },
        forwardedBy: {
          select: { id: true, name: true, role: true }
        },
        resolvedBy: {
          select: { id: true, name: true, role: true }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        _count: {
          select: { messages: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.status(200).json({
      success: true,
      count: complaints.length,
      complaints
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/complaints/:id
 * Retrieve single complaint details with full message thread
 */
export const getComplaintById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const userId = user.id || user._id;

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            menteeProfile: { select: { rollNumber: true, branch: true, section: true } },
            mentorProfile: { select: { designation: true, department: true } }
          }
        },
        mentor: {
          select: {
            id: true,
            name: true,
            email: true,
            mentorProfile: { select: { designation: true, department: true } }
          }
        },
        forwardedBy: {
          select: { id: true, name: true, role: true }
        },
        resolvedBy: {
          select: { id: true, name: true, role: true }
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    // STRICT PERMISSION CHECK:
    // Mentee: can only view if creator
    if (user.role === 'MENTEE' && complaint.creatorId !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this complaint.' });
    }

    // Mentor: can only view if creator OR (targetType === MENTOR && mentorId === userId)
    if (user.role === 'MENTOR') {
      const isCreator = complaint.creatorId === userId;
      const isAssignedMentor = complaint.targetType === 'MENTOR' && complaint.mentorId === userId;
      if (!isCreator && !isAssignedMentor) {
        return res.status(403).json({ success: false, message: 'Unauthorized: You cannot view this complaint.' });
      }
    }

    // Admin: can only view if targetType === ADMIN OR isForwardedToAdmin === true
    if (user.role === 'ADMIN') {
      const isDirectToAdmin = complaint.targetType === 'ADMIN';
      const isForwarded = complaint.isForwardedToAdmin === true;
      if (!isDirectToAdmin && !isForwarded) {
        return res.status(403).json({
          success: false,
          message: 'Admin cannot view mentor-confidential complaints until forwarded by mentee or mentor.'
        });
      }
    }

    res.status(200).json({ success: true, complaint });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/complaints/info/my-mentor
 * Helper for mentee to get their active assigned mentor details
 */
export const getMyAssignedMentor = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;

    const assignment = await prisma.mentorMenteeAssignment.findFirst({
      where: {
        menteeId: userId,
        status: 'ACTIVE'
      },
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

    res.status(200).json({
      success: true,
      hasMentor: !!assignment?.mentor,
      mentor: assignment?.mentor || null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/complaints
 * Create a new complaint / grievance
 */
export const createComplaint = async (req, res, next) => {
  try {
    const user = req.user;
    const userId = user.id || user._id;
    const { title, description, category = 'GENERAL', priority = 'MEDIUM', targetType = 'MENTOR' } = req.body;

    if (!title?.trim() || !description?.trim()) {
      return res.status(400).json({ success: false, message: 'Title and description are required.' });
    }

    let finalTargetType = targetType;
    let assignedMentorId = null;

    if (user.role === 'MENTEE') {
      if (finalTargetType === 'MENTOR') {
        // Look up mentee's assigned active mentor
        const assignment = await prisma.mentorMenteeAssignment.findFirst({
          where: {
            menteeId: userId,
            status: 'ACTIVE'
          }
        });

        if (!assignment) {
          return res.status(400).json({
            success: false,
            message: 'You do not have an active assigned mentor yet. You can submit this complaint directly to Admins.'
          });
        }
        assignedMentorId = assignment.mentorId;
      } else {
        // Targeted to ADMIN -> Mentor will NEVER see this!
        finalTargetType = 'ADMIN';
        assignedMentorId = null;
      }
    } else if (user.role === 'MENTOR') {
      // Mentor raising a grievance -> directed to Admin
      finalTargetType = 'ADMIN';
      assignedMentorId = null;
    } else {
      // Admin creating a record (if applicable)
      finalTargetType = 'ADMIN';
    }

    const complaint = await prisma.complaint.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        targetType: finalTargetType,
        status: 'PENDING',
        creatorId: userId,
        mentorId: assignedMentorId
      },
      include: {
        creator: { select: { id: true, name: true, email: true, role: true } },
        mentor: { select: { id: true, name: true, email: true } }
      }
    });

    // Send notifications
    try {
      if (finalTargetType === 'MENTOR' && assignedMentorId) {
        // Notify the assigned mentor
        await prisma.notification.create({
          data: {
            userId: assignedMentorId,
            type: 'COMPLAINT_RECEIVED',
            title: 'New Mentee Grievance',
            message: `${user.name} submitted a complaint: "${complaint.title}"`,
            link: '/mentor/complaints'
          }
        });
      } else if (finalTargetType === 'ADMIN') {
        // Notify all admins
        const admins = await prisma.user.findMany({
          where: { role: 'ADMIN' },
          select: { id: true }
        });

        for (const admin of admins) {
          await prisma.notification.create({
            data: {
              userId: admin.id,
              type: 'COMPLAINT_RECEIVED',
              title: 'Direct Grievance to Administration',
              message: `${user.name} (${user.role}) submitted a complaint: "${complaint.title}"`,
              link: '/admin/complaints'
            }
          });
        }
      }
    } catch (notifErr) {
      console.error('Failed to dispatch complaint notification:', notifErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Complaint created successfully.',
      complaint
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/complaints/:id/messages
 * Add a message / reply to a complaint thread
 */
export const addComplaintMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const userId = user.id || user._id;
    const { message } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required.' });
    }

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true } },
        mentor: { select: { id: true, name: true } }
      }
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    // Check permission to participate
    const isCreator = complaint.creatorId === userId;
    const isAssignedMentor = complaint.targetType === 'MENTOR' && complaint.mentorId === userId;
    const isAdminWithAccess = user.role === 'ADMIN' && (complaint.targetType === 'ADMIN' || complaint.isForwardedToAdmin);

    if (!isCreator && !isAssignedMentor && !isAdminWithAccess) {
      return res.status(403).json({ success: false, message: 'You are not authorized to reply to this complaint.' });
    }

    const newMessage = await prisma.complaintMessage.create({
      data: {
        complaintId: id,
        senderId: userId,
        message: message.trim()
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    });

    // Auto update status to IN_REVIEW if still PENDING and message is from responder
    if (complaint.status === 'PENDING' && !isCreator) {
      await prisma.complaint.update({
        where: { id },
        data: { status: 'IN_REVIEW' }
      });
    } else {
      // Touch updatedAt
      await prisma.complaint.update({
        where: { id },
        data: { updatedAt: new Date() }
      });
    }

    // Send notifications to other participants
    try {
      const recipientIds = new Set();
      if (complaint.creatorId !== userId) recipientIds.add(complaint.creatorId);
      if (complaint.targetType === 'MENTOR' && complaint.mentorId && complaint.mentorId !== userId) {
        recipientIds.add(complaint.mentorId);
      }
      if (complaint.isForwardedToAdmin || complaint.targetType === 'ADMIN') {
        const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } });
        admins.forEach((a) => {
          if (a.id !== userId) recipientIds.add(a.id);
        });
      }

      for (const recId of recipientIds) {
        await prisma.notification.create({
          data: {
            userId: recId,
            type: 'COMPLAINT_MESSAGE',
            title: `Update on "${complaint.title}"`,
            message: `${user.name} posted a new response.`,
            link: user.role === 'MENTEE' ? '/mentee/complaints' : user.role === 'MENTOR' ? '/mentor/complaints' : '/admin/complaints'
          }
        });
      }
    } catch (notifErr) {
      console.error('Failed to dispatch message notification:', notifErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Reply posted.',
      complaintMessage: newMessage
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/complaints/:id/forward
 * Forward / Escalate a mentor-level complaint to administration
 * Allowed by: Creator mentee or assigned mentor
 */
export const forwardComplaintToAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const userId = user.id || user._id;
    const { forwardReason = 'Escalated to college administration for review' } = req.body;

    const complaint = await prisma.complaint.findUnique({
      where: { id }
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    if (complaint.targetType !== 'MENTOR') {
      return res.status(400).json({ success: false, message: 'This complaint is already directly addressed to Administration.' });
    }

    if (complaint.isForwardedToAdmin) {
      return res.status(400).json({ success: false, message: 'This complaint has already been forwarded to Administration.' });
    }

    // Only creator mentee or assigned mentor can forward
    const isCreator = complaint.creatorId === userId;
    const isAssignedMentor = complaint.mentorId === userId;

    if (!isCreator && !isAssignedMentor) {
      return res.status(403).json({
        success: false,
        message: 'Only the mentee or assigned mentor can escalate this complaint to admins.'
      });
    }

    const updatedComplaint = await prisma.complaint.update({
      where: { id },
      data: {
        isForwardedToAdmin: true,
        forwardedAt: new Date(),
        forwardedById: userId,
        forwardReason: forwardReason.trim()
      },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        mentor: { select: { id: true, name: true, email: true } },
        forwardedBy: { select: { id: true, name: true, role: true } }
      }
    });

    // Add an audit trail message to the complaint thread
    await prisma.complaintMessage.create({
      data: {
        complaintId: id,
        senderId: userId,
        message: `📢 [ESCALATED TO ADMIN]: "${forwardReason.trim()}"`
      }
    });

    // Notify Admins
    try {
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true }
      });

      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: 'COMPLAINT_ESCALATED',
            title: 'Escalated Grievance Received',
            message: `${user.name} forwarded complaint "${complaint.title}" to Administration. Reason: ${forwardReason}`,
            link: '/admin/complaints'
          }
        });
      }
    } catch (notifErr) {
      console.error('Failed to notify admins of escalation:', notifErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Complaint successfully escalated to Administration.',
      complaint: updatedComplaint
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/complaints/:id/status
 * Update complaint status (PENDING, IN_REVIEW, RESOLVED, REJECTED)
 */
export const updateComplaintStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const userId = user.id || user._id;
    const { status, resolutionNotes } = req.body;

    const validStatuses = ['PENDING', 'IN_REVIEW', 'RESOLVED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const complaint = await prisma.complaint.findUnique({
      where: { id }
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    const isCreator = complaint.creatorId === userId;
    const isAssignedMentor = complaint.targetType === 'MENTOR' && complaint.mentorId === userId;
    const isAdminWithAccess = user.role === 'ADMIN' && (complaint.targetType === 'ADMIN' || complaint.isForwardedToAdmin);

    // Permission rules:
    // Mentee creator can only mark RESOLVED (close their grievance)
    if (user.role === 'MENTEE') {
      if (!isCreator || status !== 'RESOLVED') {
        return res.status(403).json({
          success: false,
          message: 'As a mentee, you can only close your complaint as RESOLVED when satisfied.'
        });
      }
    } else if (user.role === 'MENTOR') {
      // Mentor can update if assigned mentor and not escalated to admin exclusively
      if (!isAssignedMentor) {
        return res.status(403).json({ success: false, message: 'Unauthorized to update this complaint.' });
      }
    } else if (user.role === 'ADMIN') {
      if (!isAdminWithAccess) {
        return res.status(403).json({ success: false, message: 'Admin cannot manage mentor complaints before escalation.' });
      }
    } else {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    const isResolving = status === 'RESOLVED' || status === 'REJECTED';

    const updateData = {
      status,
      ...(resolutionNotes !== undefined && { resolutionNotes: resolutionNotes.trim() }),
      ...(isResolving && {
        resolvedById: userId,
        resolvedAt: new Date()
      })
    };

    const updatedComplaint = await prisma.complaint.update({
      where: { id },
      data: updateData,
      include: {
        resolvedBy: { select: { id: true, name: true, role: true } }
      }
    });

    // Notify creator if someone else updated status
    if (complaint.creatorId !== userId) {
      try {
        await prisma.notification.create({
          data: {
            userId: complaint.creatorId,
            type: 'COMPLAINT_STATUS_UPDATED',
            title: `Complaint Status: ${status}`,
            message: `Your complaint "${complaint.title}" has been updated to ${status} by ${user.name}.`,
            link: '/mentee/complaints'
          }
        });
      } catch (e) {
        console.error('Notification error:', e);
      }
    }

    res.status(200).json({
      success: true,
      message: `Complaint marked as ${status}.`,
      complaint: updatedComplaint
    });
  } catch (error) {
    next(error);
  }
};
