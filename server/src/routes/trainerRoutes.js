import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authMiddleware.js';
import {
  getTrainerProfile, updateTrainerProfile,
  assignTrainerToBatch, removeTrainerFromBatch,
  getTrainingSessions, createOrUpdateTrainingSession, updateTrainingSession, deleteTrainingSession,
  getDailyProblems, createDailyProblem, updateDailyProblem, deleteDailyProblem,
  getTrainerBatchStudents,
  getTrainers, createTrainer, updateTrainer, deleteTrainer
} from '../controllers/trainerController.js';

const router = express.Router();
router.use(authenticate);

// Profile
router.get('/profile',                          getTrainerProfile);
router.get('/profile/:trainerId',               getTrainerProfile);
router.patch('/profile',                        authorize('TRAINER'), updateTrainerProfile);

// Trainer Directory & Management (ADMIN only)
router.get('/',                                 authorize('ADMIN'), getTrainers);
router.post('/',                                authorize('ADMIN'), createTrainer);
router.patch('/:id',                            authorize('ADMIN'), updateTrainer);
router.delete('/:id',                           authorize('ADMIN'), deleteTrainer);

// Batch assignments (ADMIN only)
router.post('/assign-batch',                    authorize('ADMIN'), assignTrainerToBatch);
router.delete('/assign-batch/:trainerId/:batchId', authorize('ADMIN'), removeTrainerFromBatch);

// Batch students
router.get('/batches/:batchId/students',        authorize('ADMIN','TRAINER'), getTrainerBatchStudents);

// Training Sessions (calendar)
router.get('/sessions',                         authorize('ADMIN','TRAINER','MENTOR','MENTEE'), getTrainingSessions);
router.post('/sessions',                        authorize('ADMIN','TRAINER'), createOrUpdateTrainingSession);
router.patch('/sessions/:id',                   authorize('ADMIN','TRAINER'), updateTrainingSession);
router.delete('/sessions/:id',                  authorize('ADMIN','TRAINER'), deleteTrainingSession);

// Daily Problems
router.get('/daily-problems',                   getDailyProblems);
router.post('/daily-problems',                  authorize('ADMIN','TRAINER'), createDailyProblem);
router.patch('/daily-problems/:id',             authorize('ADMIN','TRAINER'), updateDailyProblem);
router.delete('/daily-problems/:id',            authorize('ADMIN','TRAINER'), deleteDailyProblem);

export default router;
