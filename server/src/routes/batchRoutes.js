import express from 'express';
import {
  getBatches,
  createBatch,
  updateBatch,
  addBatchMembers,
  removeBatchMember
} from '../controllers/batchController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getBatches);
router.post('/', authorizeRoles('ADMIN', 'MENTOR'), createBatch);
router.patch('/:id', authorizeRoles('ADMIN', 'MENTOR'), updateBatch);
router.post('/:id/members', authorizeRoles('ADMIN', 'MENTOR'), addBatchMembers);
router.delete('/:id/members/:menteeId', authorizeRoles('ADMIN', 'MENTOR'), removeBatchMember);

export default router;
