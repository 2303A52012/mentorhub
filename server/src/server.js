import app from './app.js';
import { ENV } from './config/env.js';
import { connectDB, closeDB } from './config/database.js';
import prisma from './config/prisma.js';
import { seedDatabase } from './seeds/seedPrisma.js';

const startServer = async () => {
  try {
    await connectDB();

    // Ensure primary Admin user exists
    const adminExists = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!adminExists) {
      console.log('No Admin found. Initializing primary Admin user...');
      const bcrypt = (await import('bcryptjs')).default;
      const defaultPasswordHash = await bcrypt.hash('Password@123', 10);
      await prisma.user.create({
        data: {
          name: 'Dr. Evelyn Reed (Admin)',
          email: 'admin@sru.edu.in',
          passwordHash: defaultPasswordHash,
          role: 'ADMIN',
          accountStatus: 'ACTIVE',
          mustChangePassword: false
        }
      });
      console.log('✅ Admin initialized: admin@sru.edu.in (Password: Password@123)');
    } else {
      const userCount = await prisma.user.count();
      console.log(`Database ready with ${userCount} users (Admin: ${adminExists.email}).`);
    }

    const server = app.listen(ENV.PORT, () => {
      console.log(`
=============================================================
  🚀 MentorHub Server Running
  📡 Mode: ${ENV.NODE_ENV}
  🌐 Listening on http://localhost:${ENV.PORT}
  🔗 API Health: http://localhost:${ENV.PORT}/api/health
=============================================================
      `);
    });

    const shutdown = async () => {
      console.log('Shutting down server gracefully...');
      server.close(() => {
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    process.on('unhandledRejection', (reason) => {
      console.warn('⚠️ Non-fatal unhandled rejection caught:', reason?.message || reason);
    });

    process.on('uncaughtException', (err) => {
      console.warn('⚠️ Non-fatal uncaught exception caught:', err?.message || err);
    });
  } catch (error) {
    console.error('Fatal Server Startup Error:', error);
    process.exit(1);
  }
};

startServer();
