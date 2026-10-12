import express from 'express';
import { getLeaderboard, getAchievements } from '../controllers/analyticsController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/leaderboard', getLeaderboard);
router.get('/achievements', getAchievements);

export default router;
