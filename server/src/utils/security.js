import crypto from 'crypto';

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
 * Validates whether an incoming HTTP request origin is permitted under
 * strict production or development CORS policy.
 * 
 * Rules:
 * - Production strictly requires HTTPS.
 * - Production allows only the configured CLIENT_URL and exact sru.edu.in or subdomains (*.sru.edu.in).
 * - Production rejects lookalikes (e.g. evil-sru.edu.in, sru.edu.in.evil.com), HTTP, and localhost.
 * - Development permits configured localhost/127.0.0.1 origins and CLIENT_URL.
 */
export function isAllowedOrigin(origin, env = 'development', clientUrl = '') {
  if (!origin) return true;

  if (env === 'production') {
    try {
      const parsed = new URL(origin);
      if (parsed.protocol !== 'https:') {
        return false;
      }

      if (clientUrl) {
        try {
          const clientParsed = new URL(clientUrl);
          if (parsed.origin === clientParsed.origin) return true;
        } catch {
          // ignore invalid client URL
        }
      }

      const hostname = parsed.hostname.toLowerCase();
      const suffix = '.sru.edu.in';
      if (hostname === 'sru.edu.in' || (hostname.endsWith(suffix) && hostname.length > suffix.length)) {
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  // Development mode: permit explicitly configured local dev origins
  const devAllowed = [
    clientUrl,
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
}
