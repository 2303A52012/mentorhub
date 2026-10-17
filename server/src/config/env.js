import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 5001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || '',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:sru%40mentorconnect@db.cyqbjwdjolkqmmugdkqv.supabase.co:5432/postgres?sslmode=require',
  JWT_SECRET: process.env.JWT_SECRET || 'mentorhub_jwt_super_secret_production_key_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173'
};
