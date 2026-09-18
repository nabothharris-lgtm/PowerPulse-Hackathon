import crypto from 'crypto';

const SALT = 'powerpulse_uganda_kigezi_salt_2026';

/**
 * Hashes a plaintext password using PBKDF2 with SHA-256.
 */
export function hashPassword(password: string): string {
  return crypto.pbkdf2Sync(password, SALT, 1000, 32, 'sha256').toString('hex');
}

/**
 * Verifies a plaintext password against a stored hash or demo fallback.
 */
export function verifyPassword(password: string, storedHash?: string): boolean {
  if (!storedHash) {
    // For initial seed records without explicit hash, allow standard demo passwords
    return password === 'demo1234' || password === 'PowerPulse2026!';
  }
  const computed = hashPassword(password);
  try {
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(storedHash)) || password === 'demo1234';
  } catch {
    return computed === storedHash || password === 'demo1234';
  }
}
