import dotenv from 'dotenv';
dotenv.config();

/**
 * Evaluates whether the current test execution environment has an explicitly
 * configured, verified isolated test database.
 * 
 * Safety Rules:
 * 1. NODE_ENV === 'production' immediately blocks all mutating tests.
 * 2. TEST_DATABASE_URL must be explicitly configured.
 * 3. TEST_DATABASE_URL cannot match the primary/production DATABASE_URL.
 */
export function checkDatabaseIsolation() {
  const isProd = process.env.NODE_ENV === 'production';
  const testDbUrl = (process.env.TEST_DATABASE_URL || '').trim();
  const primaryDbUrl = (process.env.DATABASE_URL || '').trim();

  if (isProd) {
    return {
      isIsolated: false,
      reason: 'Mutating tests are strictly prohibited in production mode (NODE_ENV=production).'
    };
  }

  if (!testDbUrl) {
    return {
      isIsolated: false,
      reason: 'TEST_DATABASE_URL is not configured. Automated tests cannot mutate the unverified primary database.'
    };
  }

  if (testDbUrl === primaryDbUrl) {
    return {
      isIsolated: false,
      reason: 'TEST_DATABASE_URL matches the primary DATABASE_URL. An isolated test database is required for mutating tests.'
    };
  }

  return {
    isIsolated: true,
    testDbUrl
  };
}

/**
 * Asserts database isolation for mutating tests.
 * If not isolated, logs a standardized safety warning and returns false so the caller
 * can safely skip mutating operations without throwing uncaught errors.
 */
export function assertDatabaseIsolation(testSuiteName) {
  const status = checkDatabaseIsolation();
  if (!status.isIsolated) {
    console.log(`\n🛡️  [TEST SAFETY GUARD] ${testSuiteName} — Mutating database tests SKIPPED`);
    console.log(`   Reason: ${status.reason}`);
    console.log(`   Safety Guarantee: Primary database records preserved; no mutating operations performed.`);
    console.log(`   To enable mutating integration tests: configure an isolated TEST_DATABASE_URL in server/.env.\n`);
    return false;
  }
  return true;
}

/**
 * Sanitizes and masks sensitive strings for safe test logging.
 */
export function maskSensitive(value) {
  if (!value || typeof value !== 'string') return '[REDACTED]';
  if (value.includes('@')) {
    const parts = value.split('@');
    return `${parts[0].substring(0, 2)}***@${parts[1]}`;
  }
  return `${value.substring(0, 2)}******`;
}
