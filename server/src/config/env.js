import dotenv from 'dotenv';
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  if (!process.env.DATABASE_URL) {
    throw new Error('FATAL: DATABASE_URL must be provided in production environment.');
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'mentorhub_jwt_super_secret_production_key_2026' || process.env.JWT_SECRET === 'supersecretkey') {
    throw new Error('FATAL: A unique, secure JWT_SECRET must be provided in production environment.');
  }
  if (process.env.ADMIN_PASSWORD && (process.env.ADMIN_PASSWORD === 'Password@123' || process.env.ADMIN_PASSWORD.length < 12)) {
    throw new Error('FATAL: In production, ADMIN_PASSWORD must be a high-entropy string of at least 12 characters and cannot be default.');
  }
}

export const ENV = {
  PORT: process.env.PORT || 5001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || '',
  DIRECT_URL: process.env.DIRECT_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || 'mentorhub_dev_jwt_secret_key_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@sru.edu.in',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || '',
  TEST_DATABASE_URL: process.env.TEST_DATABASE_URL || '',
  ALLOW_DESTRUCTIVE_SEED: process.env.ALLOW_DESTRUCTIVE_SEED === 'true'
};

