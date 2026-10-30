/**
 * Unit #493: Hardware CSPRNG Random Byte Sampler
 * Track 1 (Lean Tuner) — Cryptographic Random Entropy Engine
 */

import { randomBytes, randomFillSync, randomInt } from 'node:crypto';

export class EntropySampler {
  /**
   * Sample secure pseudo-random bytes
   * @param {number} count 
   * @param {string} encoding 'hex' | 'base64' | 'buffer'
   * @returns {string|Buffer}
   */
  static sampleBytes(count = 32, encoding = 'hex') {
    if (count <= 0 || !Number.isInteger(count)) {
      throw new TypeError('Byte count must be a positive integer');
    }
    const buf = randomBytes(count);
    if (encoding === 'buffer') return buf;
    return buf.toString(encoding);
  }

  /**
   * Fill a pre-allocated Uint8Array in-place
   * @param {Uint8Array} target 
   * @returns {Uint8Array}
   */
  static fillBuffer(target) {
    if (!(target instanceof Uint8Array)) {
      throw new TypeError('Target must be a Uint8Array or Buffer');
    }
    return randomFillSync(target);
  }

  /**
   * Cryptographically secure uniform integer sampling [min, max)
   * @param {number} min 
   * @param {number} max 
   * @returns {number}
   */
  static sampleSecureInt(min, max) {
    return randomInt(min, max);
  }

  /**
   * Calculate Shannon entropy of a byte buffer in bits per byte [0.0 - 8.0]
   * @param {Buffer|Uint8Array} buffer 
   * @returns {number}
   */
  static shannonEntropy(buffer) {
    if (!buffer || buffer.length === 0) return 0;
    const freq = new Array(256).fill(0);
    for (let i = 0; i < buffer.length; i++) {
      freq[buffer[i]]++;
    }
    let entropy = 0;
    const len = buffer.length;
    for (let i = 0; i < 256; i++) {
      if (freq[i] > 0) {
        const p = freq[i] / len;
        entropy -= p * Math.log2(p);
      }
    }
    return Number(entropy.toFixed(4));
  }

  /**
   * Generate RFC 4122 v4 compliant UUID using CSPRNG
   * @returns {string}
   */
  static sampleUUIDv4() {
    const bytes = randomBytes(16);
    // Set version to 0100 (v4)
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    // Set variant to 10xx (RFC 4122)
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const h = bytes.toString('hex');
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  }
}
