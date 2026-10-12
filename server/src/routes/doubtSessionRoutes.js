import express from 'express';
import {
  getDoubtSessions,
  getDoubtSessionById,
  createDoubtSessionRequest,
  scheduleDoubtSession,
  completeDoubtSession,
  cancelOrRejectDoubtSession
} from '../controllers/doubtSessionController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

// All routes require authentication and are restricted to MENTEE and MENTOR
router.use(authenticate);
router.use(authorizeRoles('MENTEE', 'MENTOR'));

// List doubt sessions (mentee, mentor, admin)
router.get('/', getDoubtSessions);

// Get single session details
router.get('/:id', getDoubtSessionById);

// Mentee creates request
router.post('/', createDoubtSessionRequest);

// Mentor schedules timeslot & link / venue
router.post('/:id/schedule', scheduleDoubtSession);

// Mark session as completed
router.post('/:id/complete', completeDoubtSession);

// Cancel or reject session
router.post('/:id/cancel', cancelOrRejectDoubtSession);

export default router;
