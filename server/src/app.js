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

import prisma from './config/prisma.js';

const app = express();

// Disable X-Powered-By header to prevent fingerprinting
app.disable('x-powered-by');

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  if (ENV.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  next();
});

// Production-aware CORS configuration
const allowedOrigins = [
  ENV.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000'
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      if (ENV.NODE_ENV === 'production') {
        const isAllowed = allowedOrigins.includes(origin) || origin.endsWith('.sru.edu.in');
        if (isAllowed) {
          return callback(null, true);
        }
        const corsErr = new Error(`CORS blocked: Origin ${origin} not permitted in production.`);
        corsErr.statusCode = 403;
        return callback(corsErr);
      }

      // Development mode: permit localhost and dev environments
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
if (ENV.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Deep Health check endpoint with database connectivity check
app.get('/api/health', async (req, res) => {
  try {
    // Ping PostgreSQL to verify PgBouncer and DB responsiveness
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'ok',
      service: 'MentorHub API',
      database: 'connected',
      environment: ENV.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(503).json({
      status: 'degraded',
      service: 'MentorHub API',
      database: 'disconnected',
      error: ENV.NODE_ENV === 'production' ? 'Database connection failure' : err.message,
      timestamp: new Date().toISOString()
    });
  }
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
