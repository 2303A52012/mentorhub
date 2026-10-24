import prisma from './prisma.js';
import { ENV } from './env.js';

export const connectDB = async (retries = 3, delayMs = 2000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`⚡ Connecting to PostgreSQL database (Supabase) [Attempt ${attempt}/${retries}]...`);
      await prisma.$connect();
      console.log(`🚀 PostgreSQL Connected successfully to ${new URL(ENV.DATABASE_URL).host}`);
      return prisma;
    } catch (error) {
      console.error(`❌ PostgreSQL Connection Attempt ${attempt} failed:`, error.message || error);
      if (attempt < retries) {
        console.log(`⏳ Retrying database connection in ${delayMs / 1000}s...`);
        await new Promise((r) => setTimeout(r, delayMs));
      } else {
        console.error('❌ PostgreSQL Connection Error: All connection attempts failed.');
        process.exit(1);
      }
    }
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
export default prisma;
export { prisma };
