import express from 'express';
import {
  getPresentTasks,
  getCompletedTasks,
  getMenteeTaskById,
  saveProblemNotes,
  submitMenteeTask,
  getMenteeTaskHistory
} from '../controllers/menteeTaskController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/tasks', getPresentTasks);
router.get('/tasks/completed', getCompletedTasks);
router.get('/tasks/:id', getMenteeTaskById);
router.patch('/tasks/:id/problems/:problemId', saveProblemNotes);
router.post('/tasks/:id/submit', submitMenteeTask);
router.get('/tasks/:id/history', getMenteeTaskHistory);

export default router;
