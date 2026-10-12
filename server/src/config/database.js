import prisma from './prisma.js';
import { ENV } from './env.js';

export const connectDB = async () => {
  try {
    console.log('⚡ Connecting to PostgreSQL database (Supabase)...');
    await prisma.$connect();
    console.log(`🚀 PostgreSQL Connected successfully to ${new URL(ENV.DATABASE_URL).host}`);
    return prisma;
  } catch (error) {
    console.error('❌ PostgreSQL Connection Error:', error);
    process.exit(1);
  }
};

export const closeDB = async () => {
  try {
    await prisma.$disconnect();
    console.log('🔒 Disconnected from PostgreSQL database.');
  } catch (err) {
    console.error('Error closing database:', err);
  }
};

