import express from 'express';
import {
  getComplaints,
  getComplaintById,
  getMyAssignedMentor,
  createComplaint,
  addComplaintMessage,
  forwardComplaintToAdmin,
  updateComplaintStatus
} from '../controllers/complaintController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// All complaint routes require authentication
router.use(authenticate);

// List complaints (scoped automatically per role and privacy rules)
router.get('/', getComplaints);

// Mentee helper to get assigned mentor info
router.get('/info/my-mentor', getMyAssignedMentor);

// Get single complaint details and conversation history
router.get('/:id', getComplaintById);

// Create a complaint (Mentee -> Mentor or Admin, Mentor -> Admin)
router.post('/', createComplaint);

// Post a reply / message in complaint thread
router.post('/:id/messages', addComplaintMessage);

// Escalate / forward complaint to Admin
router.post('/:id/forward', forwardComplaintToAdmin);

// Update status (PENDING, IN_REVIEW, RESOLVED, REJECTED)
router.patch('/:id/status', updateComplaintStatus);

export default router;
