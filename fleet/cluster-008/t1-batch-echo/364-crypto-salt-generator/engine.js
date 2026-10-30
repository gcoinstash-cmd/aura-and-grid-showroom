/**
 * Unit #364: Cryptographic Salts Generator & Entropy Rig
 * Track 1 (Lean Tuner) — Pure Node.js CSPRNG Entropy Engine
 */

import crypto from 'node:crypto';

export function generateSalt(length = 32, encoding = 'hex') {
  if (typeof length !== 'number' || length <= 0) {
    throw new TypeError('Salt length must be a positive number');
  }
  const buf = crypto.randomBytes(length);
  if (encoding === 'buffer') return buf;
  return buf.toString(encoding);
}

export function generateSaltedHash(data, salt, algorithm = 'sha256') {
  const saltBuf = Buffer.isBuffer(salt) ? salt : Buffer.from(salt, 'hex');
  const dataBuf = Buffer.isBuffer(data) ? data : Buffer.from(String(data), 'utf8');
  return crypto.createHash(algorithm).update(Buffer.concat([saltBuf, dataBuf])).digest('hex');
}

export function verifySaltedHash(data, salt, expectedHash, algorithm = 'sha256') {
  const actualHash = generateSaltedHash(data, salt, algorithm);
  const bufA = Buffer.from(actualHash, 'hex');
  const bufB = Buffer.from(expectedHash, 'hex');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
