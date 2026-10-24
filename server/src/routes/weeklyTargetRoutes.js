import express from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import {
  getTargetSchedule,
  getStudentTargets,
  getBatchAuditSheet,
  verifyStudentTarget,
  updateBatchTargets,
  updateCodingCounters
} from '../controllers/weeklyTargetController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// View weekly target schedule & student's progress
router.get('/schedule', getTargetSchedule);

// View specific student's weekly verification status & history
router.get('/student/:studentId', getStudentTargets);

// Senior live review audit sheet for a batch & week (Mentor, Trainer, Admin)
router.get('/batch/:batchId/audit', authorize('MENTOR', 'TRAINER', 'ADMIN'), getBatchAuditSheet);

// Confirm & save senior live verification (Strict Target Rule)
router.post('/verify', authorize('MENTOR', 'TRAINER', 'ADMIN'), verifyStudentTarget);

// Batch target customization for pacing adjustments (Trainer, Admin)
router.patch('/batch/:batchId/custom', authorize('TRAINER', 'ADMIN'), updateBatchTargets);

// Update platform counters (+, -, custom increment) with auto-sync to Weekly Cumulative Targets
router.patch('/counters', updateCodingCounters);
router.put('/counters', updateCodingCounters);

export default router;
