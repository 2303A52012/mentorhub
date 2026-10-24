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

  // Content-Security-Policy (CSP) tailored for MentorHub React SPA
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' http://localhost:5001 http://localhost:5173 https://*.supabase.co https://*.sru.edu.in",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
  res.setHeader('Content-Security-Policy', cspDirectives);

  if (ENV.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  next();
});

// Production-aware CORS origin validator
const isAllowedOrigin = (origin) => {
  if (!origin) return true;

  if (ENV.NODE_ENV === 'production') {
    try {
      const parsed = new URL(origin);
      // In production, strictly require https protocol
      if (parsed.protocol !== 'https:') {
        return false;
      }

      // Check explicit CLIENT_URL
      if (ENV.CLIENT_URL) {
        try {
          const clientParsed = new URL(ENV.CLIENT_URL);
          if (parsed.origin === clientParsed.origin) return true;
        } catch {
          // ignore invalid client URL
        }
      }

      // Validate exact university domain or exact subdomain of sru.edu.in
      const hostname = parsed.hostname.toLowerCase();
      if (hostname === 'sru.edu.in' || hostname.endsWith('.sru.edu.in')) {
        // Ensure not evil-sru.edu.in: prefix must be dot
        const suffix = '.sru.edu.in';
        if (hostname === 'sru.edu.in' || (hostname.endsWith(suffix) && hostname.length > suffix.length)) {
          return true;
        }
      }

      return false;
    } catch {
      return false;
    }
  }

  // Development mode: permit explicitly configured local dev origins
  const devAllowed = [
    ENV.CLIENT_URL,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000'
  ].filter(Boolean);

  try {
    const parsed = new URL(origin);
    return devAllowed.includes(parsed.origin);
  } catch {
    return false;
  }
};

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., server-to-server, mobile app native fetch, health checks)
      if (!origin) return callback(null, true);

      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      const corsErr = new Error(`CORS blocked: Origin '${origin}' is not permitted.`);
      corsErr.statusCode = 403;
      return callback(corsErr);
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

// 404 catch-all handler for unmapped API endpoints
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} not found.`
  });
});

// Error handler
app.use(errorHandler);

export default app;
