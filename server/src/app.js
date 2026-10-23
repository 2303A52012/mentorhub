import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { ENV } from './config/env.js';
import { errorHandler } from './middleware/errorMiddleware.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import batchRoutes from './routes/batchRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import menteeTaskRoutes from './routes/menteeTaskRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import bulkImportRoutes from './routes/bulkImportRoutes.js';
import mockRoutes from './routes/mockRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import doubtSessionRoutes from './routes/doubtSessionRoutes.js';
import trainerRoutes from './routes/trainerRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import weeklyTargetRoutes from './routes/weeklyTargetRoutes.js';

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      // allow localhost and any client port in dev
      callback(null, true);
    },
    credentials: true
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
if (ENV.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'MentorHub API', timestamp: new Date() });
});

// REST API v1 routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', userRoutes);
app.use('/api/v1/batches', batchRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/mentee', menteeTaskRoutes);
app.use('/api/v1/mentor', reviewRoutes);
app.use('/api/v1', dashboardRoutes);
app.use('/api/v1', analyticsRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/bulk-import', bulkImportRoutes);
app.use('/api/v1', mockRoutes);
app.use('/api/v1/complaints', complaintRoutes);
app.use('/api/v1/doubt-sessions', doubtSessionRoutes);
app.use('/api/v1/trainer', trainerRoutes);
app.use('/api/v1/announcements', announcementRoutes);
app.use('/api/v1/weekly-targets', weeklyTargetRoutes);

// Error handler
app.use(errorHandler);

export default app;
