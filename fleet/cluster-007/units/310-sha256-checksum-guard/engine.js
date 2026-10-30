/**
 * Unit #310: Fast SHA-256 Checksum Integrity Guard
 * Track 1 (Lean Tuner) — Cryptographic Integrity Verification Engine
 * 
 * GhostFactoryOS Architecture: Cluster-007
 * Pure ESM | Zero External Dependencies (Node.js standard library: node:crypto)
 */

import crypto from 'node:crypto';

export class IntegrityGuardError extends Error {
  constructor(message, code = 'ERR_INTEGRITY_GUARD', details = null) {
    super(message);
    this.name = 'IntegrityGuardError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Normalizes arbitrary data into a deterministic Buffer.
 * Objects are sorted canonically by key before hashing.
 * 
 * @param {string|Buffer|Object} data 
 * @returns {Buffer}
 */
export function toBufferDeterministic(data) {
  if (Buffer.isBuffer(data)) return data;
  if (typeof data === 'string') return Buffer.from(data, 'utf8');
  if (typeof data === 'object' && data !== null) {
    return Buffer.from(canonicalJson(data), 'utf8');
  }
  return Buffer.from(String(data), 'utf8');
}

/**
 * Deterministic JSON stringify with sorted keys.
 * @param {any} obj 
 * @returns {string}
 */
export function canonicalJson(obj) {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return '[' + obj.map(canonicalJson).join(',') + ']';
  const keys = Object.keys(obj).sort();
  return '{' + keys.map(k => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`).join(',') + '}';
}

/**
 * Computes SHA-256 digest of data.
 * 
 * @param {string|Buffer|Object} data 
 * @param {'hex'|'base64'|'binary'} [encoding='hex'] 
 * @returns {string|Buffer}
 */
export function computeSha256(data, encoding = 'hex') {
  const buf = toBufferDeterministic(data);
  const hash = crypto.createHash('sha256').update(buf);
  return encoding === 'binary' ? hash.digest() : hash.digest(encoding);
}

/**
 * Computes HMAC-SHA256 signature using a secret key.
 * 
 * @param {string|Buffer|Object} data 
 * @param {string|Buffer} secretKey 
 * @param {'hex'|'base64'} [encoding='hex'] 
 * @returns {string}
 */
export function computeHmacSha256(data, secretKey, encoding = 'hex') {
  if (!secretKey) {
    throw new IntegrityGuardError('Secret key is required for HMAC computation', 'ERR_MISSING_SECRET');
  }
  const buf = toBufferDeterministic(data);
  const keyBuf = Buffer.isBuffer(secretKey) ? secretKey : Buffer.from(String(secretKey), 'utf8');
  return crypto.createHmac('sha256', keyBuf).update(buf).digest(encoding);
}

/**
 * Validates data against an expected SHA-256 checksum using constant-time comparison.
 * 
 * @param {string|Buffer|Object} data 
 * @param {string} expectedChecksum 
 * @param {'hex'|'base64'} [encoding='hex'] 
 * @returns {boolean}
 */
export function verifySha256(data, expectedChecksum, encoding = 'hex') {
  if (typeof expectedChecksum !== 'string' || !expectedChecksum.trim()) {
    return false;
  }
  const computed = computeSha256(data, encoding);
  const computedBuf = Buffer.from(computed, 'utf8');
  const expectedBuf = Buffer.from(expectedChecksum.trim(), 'utf8');

  if (computedBuf.length !== expectedBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(computedBuf, expectedBuf);
}

/**
 * Validates HMAC signature with constant-time equality check.
 * 
 * @param {string|Buffer|Object} data 
 * @param {string|Buffer} secretKey 
 * @param {string} expectedHmac 
 * @param {'hex'|'base64'} [encoding='hex'] 
 * @returns {boolean}
 */
export function verifyHmacSha256(data, secretKey, expectedHmac, encoding = 'hex') {
  if (typeof expectedHmac !== 'string' || !expectedHmac.trim()) return false;
  const computed = computeHmacSha256(data, secretKey, encoding);
  const computedBuf = Buffer.from(computed, 'utf8');
  const expectedBuf = Buffer.from(expectedHmac.trim(), 'utf8');

  if (computedBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(computedBuf, expectedBuf);
}

/**
 * Performance benchmark.
 * @param {number} [iterations=2000] 
 */
export function benchmarkIntegrityGuard(iterations = 2000) {
  const sample = { asset_id: 'GF-T1-310', telemetry: [1.2, 4.5, 9.8], status: 'nominal' };
  const key = 'secret_integrity_key_omega';
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    const hash = computeSha256(sample, 'hex');
    verifySha256(sample, hash, 'hex');
    const hmac = computeHmacSha256(sample, key, 'hex');
    verifyHmacSha256(sample, key, hmac, 'hex');
  }
  const totalMs = performance.now() - start;
  return {
    iterations,
    totalMs: Number(totalMs.toFixed(3)),
    avgLatencyUs: Number(((totalMs * 1000) / iterations).toFixed(2)),
    opsPerSec: Math.round((iterations / totalMs) * 1000)
  };
}
