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
      const adminEmail = ENV.ADMIN_EMAIL || 'admin@sru.edu.in';
      const initialPassword = ENV.ADMIN_PASSWORD || 'Password@123';
      const isDefault = initialPassword === 'Password@123';
      const bcrypt = (await import('bcryptjs')).default;
      const passwordHash = await bcrypt.hash(initialPassword, 10);
      await prisma.user.create({
        data: {
          name: 'Dr. Evelyn Reed (Admin)',
          email: adminEmail,
          passwordHash,
          role: 'ADMIN',
          accountStatus: 'ACTIVE',
          mustChangePassword: isDefault
        }
      });
      console.log(`✅ Admin account provisioned: ${adminEmail} (Must change password: ${isDefault})`);
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

    const shutdown = async (signal = 'SIGTERM') => {
      console.log(`Shutting down server gracefully (${signal})...`);
      server.close(async () => {
        try {
          await prisma.$disconnect();
          await closeDB();
          console.log('Database connections cleanly closed.');
        } catch (e) {
          console.error('Error during database disconnect:', e);
        }
        process.exit(0);
      });

      // Watchdog timeout to prevent hung processes
      setTimeout(() => {
        console.error('Forced shutdown due to timeout (10s elapsed).');
        process.exit(1);
      }, 10000).unref();
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    process.on('unhandledRejection', (reason) => {
      console.error('Unhandled Promise Rejection:', reason?.message || reason);
    });

    process.on('uncaughtException', (err) => {
      console.error('Fatal Uncaught Exception:', err?.message || err);
      shutdown('uncaughtException');
    });
  } catch (error) {
    console.error('Fatal Server Startup Error:', error);
    process.exit(1);
  }
};

startServer();
