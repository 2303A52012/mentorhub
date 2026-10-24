import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

/**
 * Computes a deterministic SHA-256 fingerprint for a database connection URL.
 * Sanitizes and extracts host/database while preserving a unique cryptographic hash
 * so that live servers and test runners can verify exact database identity without
 * leaking credentials in API responses or logs.
 */
export function computeDatabaseFingerprint(url) {
  if (!url || typeof url !== 'string' || !url.trim()) return 'none';
  const cleanUrl = url.trim();
  try {
    const parsed = new URL(cleanUrl);
    const host = parsed.hostname;
    const port = parsed.port || '5432';
    const dbName = parsed.pathname.replace(/^\//, '');
    const hash = crypto.createHash('sha256').update(cleanUrl).digest('hex').substring(0, 16);
    return `${host}:${port}/${dbName}#${hash}`;
  } catch {
    const hash = crypto.createHash('sha256').update(cleanUrl).digest('hex').substring(0, 16);
    return `opaque#${hash}`;
  }
}

/**
 * Evaluates whether the current test execution environment has an explicitly
 * configured, verified isolated test database configuration.
 * 
 * Static Safety Rules:
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

  const testFingerprint = computeDatabaseFingerprint(testDbUrl);
  const primaryFingerprint = computeDatabaseFingerprint(primaryDbUrl);

  if (testFingerprint === primaryFingerprint) {
    return {
      isIsolated: false,
      reason: 'TEST_DATABASE_URL matches the primary DATABASE_URL. An isolated test database is required for mutating tests.'
    };
  }

  return {
    isIsolated: true,
    testDbUrl,
    testFingerprint,
    primaryFingerprint
  };
}

/**
 * Asynchronously verifies that the live API server is actually connected to
 * the isolated test database, preventing tests from silently continuing against
 * a pre-existing server connected to the primary or an unknown database.
 */
export async function verifyServerDatabaseIsolation(apiBase = 'http://localhost:5001') {
  const envCheck = checkDatabaseIsolation();
  if (!envCheck.isIsolated) {
    return envCheck;
  }

  try {
    const healthUrl = apiBase.endsWith('/api/health') ? apiBase : `${apiBase.replace(/\/api\/v1\/?$/, '')}/api/health`;
    const res = await fetch(healthUrl, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) {
      return {
        isIsolated: false,
        reason: `Live API server responded with HTTP ${res.status} at ${healthUrl}.`
      };
    }

    const data = await res.json();
    const serverFingerprint = data.databaseFingerprint;

    if (!serverFingerprint) {
      return {
        isIsolated: false,
        reason: 'Live API server did not return a databaseFingerprint. Server must be restarted with Phase 4 security update.'
      };
    }

    // Refuse mutating tests if server connects to primary database
    if (serverFingerprint === envCheck.primaryFingerprint) {
      return {
        isIsolated: false,
        reason: `Live API server is connected to the PRIMARY database (${serverFingerprint}). Mutating tests strictly blocked.`
      };
    }

    // Refuse mutating tests if server connects to anything other than TEST_DATABASE_URL
    if (serverFingerprint !== envCheck.testFingerprint) {
      return {
        isIsolated: false,
        reason: `Live API server database (${serverFingerprint}) does not match configured TEST_DATABASE_URL (${envCheck.testFingerprint}). Tests cannot continue against unverified server.`
      };
    }

    return {
      isIsolated: true,
      serverFingerprint,
      testFingerprint: envCheck.testFingerprint
    };
  } catch (err) {
    return {
      isIsolated: false,
      reason: `Could not verify live server isolation: ${err.message}`
    };
  }
}

/**
 * Asserts database isolation for mutating tests.
 * Logs standardized safety information and returns isolation status.
 */
export function assertDatabaseIsolation(testSuiteName, isolationStatus = null) {
  const status = isolationStatus || checkDatabaseIsolation();
  if (!status.isIsolated) {
    console.log(`\n🛡️  [TEST SAFETY GUARD] ${testSuiteName} — Mutating database tests SKIPPED`);
    console.log(`   Reason: ${status.reason}`);
    console.log(`   Safety Guarantee: Primary database records preserved; no mutating operations performed.`);
    console.log(`   To enable mutating integration tests: configure an isolated TEST_DATABASE_URL and start API against it.\n`);
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
