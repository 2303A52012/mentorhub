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
  authorizeRoles('ADMIN', 'MENTOR'),
  getTaskReviews
);
router.get(
  '/task-reviews/:id',
  authorizeRoles('ADMIN', 'MENTOR'),
  getTaskReviewById
);
router.post(
  '/task-reviews/:id/review',
  authorizeRoles('ADMIN', 'MENTOR'),
  submitReview
);
router.get(
  '/mentees/:id/progress',
  authorizeRoles('ADMIN', 'MENTOR'),
  getMenteeProgressDetail
);

export default router;
