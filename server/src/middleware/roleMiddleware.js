import { MentorMenteeAssignment } from '../models/MentorMenteeAssignment.js';

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: role ${req.user?.role || 'Guest'} is not permitted to access this resource.`
      });
    }
    next();
  };
};

export const checkMentorMenteeAccess = async (req, res, next) => {
  try {
    if (req.user.role === 'ADMIN') {
      return next();
    }

    const menteeId = req.params.id || req.params.menteeId || req.body.menteeId;
    if (!menteeId) {
      return next();
    }

    if (req.user.role === 'MENTEE') {
      if (req.user._id.toString() !== menteeId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only access your own mentee data.'
        });
      }
      return next();
    }

    if (req.user.role === 'MENTOR') {
      const assignment = await MentorMenteeAssignment.findOne({
        mentorId: req.user._id,
        menteeId,
        status: 'ACTIVE'
      });

      if (!assignment) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are not assigned as mentor for this mentee.'
        });
      }
      return next();
    }

    return res.status(403).json({ success: false, message: 'Forbidden' });
  } catch (error) {
    return next(error);
  }
};
