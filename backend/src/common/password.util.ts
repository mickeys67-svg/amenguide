import * as crypto from 'crypto';

/**
 * Shared password hashing utilities (scrypt-based).
 * Used by both AuthService and AdminAuthService.
 */

export function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derived) => {
      if (err) reject(err);
      else resolve(`${salt}:${derived.toString('hex')}`);
    });
  });
}

export function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return Promise.resolve(false);
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derived) => {
      if (err) reject(err);
      else {
        try {
          resolve(crypto.timingSafeEqual(derived, Buffer.from(hash, 'hex')));
        } catch {
          resolve(false);
        }
      }
    });
  });
}
