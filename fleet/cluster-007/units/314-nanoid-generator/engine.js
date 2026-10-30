/**
 * Unit #314: Nano-ID Cryptographic Identifier Generator
 * Track 1 (Lean Tuner) — Zero-Dependency Unique Identifier Rig
 * 
 * GhostFactoryOS Architecture: Cluster-007
 * Pure ESM | Zero External Dependencies (Node.js standard library: node:crypto)
 */

import crypto from 'node:crypto';

export const DEFAULT_ALPHABET = 'useandom-26T1983_40STFnvecighkpqz567AZKM-Index';
export const URL_SAFE_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz-';

/**
 * Generates a cryptographically secure, URL-safe random string.
 * 
 * @param {number} [size=21] - Character length
 * @param {string} [alphabet=URL_SAFE_ALPHABET] - Character set
 * @returns {string} Unique ID
 */
export function nanoid(size = 21, alphabet = URL_SAFE_ALPHABET) {
  if (size <= 0) return '';
  const alphabetLen = alphabet.length;

  // Mask algorithm for unbiased distribution
  const mask = (2 << (31 - Math.clz32((alphabetLen - 1) | 1))) - 1;
  const step = Math.ceil((1.6 * mask * size) / alphabetLen);

  let id = '';
  while (id.length < size) {
    const bytes = crypto.randomBytes(step);
    for (let i = 0; i < step; i++) {
      const byte = bytes[i] & mask;
      if (alphabet[byte]) {
        id += alphabet[byte];
        if (id.length === size) return id;
      }
    }
  }

  return id;
}

/**
 * Creates a reusable custom-alphabet generator function.
 * @param {string} alphabet 
 * @param {number} defaultSize 
 * @returns {(size?: number) => string}
 */
export function customAlphabet(alphabet, defaultSize = 21) {
  if (typeof alphabet !== 'string' || alphabet.length < 2) {
    throw new Error('Alphabet must contain at least 2 characters');
  }
  return (size = defaultSize) => nanoid(size, alphabet);
}

/**
 * Generates a standardized telemetry asset / frame ID.
 * @param {string} [prefix='GF'] 
 * @param {number} [size=16] 
 * @returns {string} e.g. "GF_a8B92x1Q..."
 */
export function generateTelemetryId(prefix = 'GF', size = 16) {
  return `${prefix}_${nanoid(size, URL_SAFE_ALPHABET)}`;
}

/**
 * Validates whether an ID conforms to length and character set.
 * @param {string} id 
 * @param {number} expectedSize 
 * @param {string} [alphabet=URL_SAFE_ALPHABET] 
 * @returns {boolean}
 */
export function isValidId(id, expectedSize, alphabet = URL_SAFE_ALPHABET) {
  if (typeof id !== 'string' || id.length !== expectedSize) return false;
  for (let i = 0; i < id.length; i++) {
    if (!alphabet.includes(id[i])) return false;
  }
  return true;
}

/**
 * Performance benchmark.
 * @param {number} [iterations=2000] 
 */
export function benchmarkNanoid(iterations = 2000) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    nanoid(21);
  }
  const totalMs = performance.now() - start;
  return {
    iterations,
    totalMs: Number(totalMs.toFixed(3)),
    avgLatencyUs: Number(((totalMs * 1000) / iterations).toFixed(2)),
    opsPerSec: Math.round((iterations / totalMs) * 1000)
  };
}
