import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authMiddleware.js';
import {
  getTrainerProfile, updateTrainerProfile,
  assignTrainerToBatch, removeTrainerFromBatch,
  getTrainingSessions, scheduleTrainingDay, unscheduleTrainingDay,
  createOrUpdateTrainingSession, updateTrainingSession, deleteTrainingSession,
  getMentorSessionReports, getMentorSessionReportDetails, submitMentorSessionReport,
  getDailyProblems, getDailyProblemById, getDailyProblemSubmissions, submitDailyProblem,
  createDailyProblem, updateDailyProblem, deleteDailyProblem,
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
router.post('/sessions/schedule-day',           authorize('ADMIN'), scheduleTrainingDay);
router.delete('/sessions/schedule-day',         authorize('ADMIN'), unscheduleTrainingDay);
router.post('/sessions',                        authorize('TRAINER'), createOrUpdateTrainingSession);
router.patch('/sessions/:id',                   authorize('TRAINER'), updateTrainingSession);
router.delete('/sessions/:id',                  authorize('ADMIN','TRAINER'), deleteTrainingSession);

// Mentor Interaction & Attendance Reports (TRAINER excluded; write strictly for MENTOR)
router.get('/sessions/mentor-reports',                        authorize('ADMIN','MENTOR','MENTEE'), getMentorSessionReports);
router.get('/sessions/mentor-reports/:mentorId/details',      authorize('ADMIN','MENTOR','MENTEE'), getMentorSessionReportDetails);
router.post('/sessions/mentor-reports',                       authorize('MENTOR'), submitMentorSessionReport);

// Daily Problems
router.get('/daily-problems',                   getDailyProblems);
router.get('/daily-problems/:id',               getDailyProblemById);
router.get('/daily-problems/:id/submissions',   authorize('ADMIN','TRAINER'), getDailyProblemSubmissions);
router.post('/daily-problems/:id/submit',        authorize('MENTEE'), submitDailyProblem);
router.post('/daily-problems',                  authorize('ADMIN','TRAINER'), createDailyProblem);
router.patch('/daily-problems/:id',             authorize('ADMIN','TRAINER'), updateDailyProblem);
router.delete('/daily-problems/:id',            authorize('ADMIN','TRAINER'), deleteDailyProblem);

export default router;
