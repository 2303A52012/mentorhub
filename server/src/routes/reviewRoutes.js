import express from 'express';
import {
  getTaskReviews,
  getTaskReviewById,
  submitReview,
  getMenteeProgressDetail
} from '../controllers/reviewController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get(
  '/task-reviews',
  authorizeRoles('ADMIN', 'MENTOR', 'TRAINER'),
  getTaskReviews
);
router.get(
  '/task-reviews/:id',
  authorizeRoles('ADMIN', 'MENTOR', 'TRAINER'),
  getTaskReviewById
);
router.post(
  '/task-reviews/:id/review',
  authorizeRoles('ADMIN', 'MENTOR', 'TRAINER'),
  submitReview
);
router.get(
  '/mentees/:id/progress',
  authorizeRoles('ADMIN', 'MENTOR', 'TRAINER'),
  getMenteeProgressDetail
);

export default router;
