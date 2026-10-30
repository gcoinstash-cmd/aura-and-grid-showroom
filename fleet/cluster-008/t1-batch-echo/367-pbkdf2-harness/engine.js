/**
 * Unit #367: PBKDF2 Password Hashing Micro-Harness
 * Track 1 (Lean Tuner) — Pure Node.js PBKDF2 Cryptographic Rig
 */

import crypto from 'node:crypto';

export function hashPassword(password, options = {}) {
  const {
    iterations = 10000,
    keyLength = 32,
    digest = 'sha256',
    salt = crypto.randomBytes(16).toString('hex')
  } = options;

  const derived = crypto.pbkdf2Sync(password, salt, iterations, keyLength, digest);
  return `pbkdf2_${digest}$${iterations}$${salt}$${derived.toString('hex')}`;
}

export function verifyPassword(password, storedHash) {
  if (typeof storedHash !== 'string') return false;
  const parts = storedHash.split('$');
  if (parts.length !== 4) return false;

  const digest = parts[0].replace('pbkdf2_', '');
  const iterations = parseInt(parts[1], 10);
  const salt = parts[2];
  const expectedHashHex = parts[3];

  const derived = crypto.pbkdf2Sync(password, salt, iterations, Buffer.from(expectedHashHex, 'hex').length, digest);
  const expectedBuf = Buffer.from(expectedHashHex, 'hex');

  if (derived.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(derived, expectedBuf);
}
