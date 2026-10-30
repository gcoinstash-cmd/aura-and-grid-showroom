/**
 * Unit #494: Fast 128-bit String & Buffer Hasher (MurmurHash3)
 * Track 1 (Lean Tuner) — Non-Cryptographic Fast Hash Engine
 */

export class MurmurHash3 {
  /**
   * Fast 32-bit MurmurHash3
   * @param {string|Uint8Array|Buffer} key 
   * @param {number} seed 
   * @returns {number} Unsigned 32-bit integer
   */
  static hash32(key, seed = 0) {
    const bytes = typeof key === 'string' ? Buffer.from(key, 'utf8') : key;
    let h1 = seed >>> 0;
    const c1 = 0xcc9e2d51;
    const c2 = 0x1b873593;
    const len = bytes.length;
    const nblocks = Math.floor(len / 4);

    for (let i = 0; i < nblocks; i++) {
      const idx = i * 4;
      let k1 = (bytes[idx] & 0xff) |
        ((bytes[idx + 1] & 0xff) << 8) |
        ((bytes[idx + 2] & 0xff) << 16) |
        ((bytes[idx + 3] & 0xff) << 24);

      k1 = Math.imul(k1, c1);
      k1 = (k1 << 15) | (k1 >>> 17);
      k1 = Math.imul(k1, c2);

      h1 ^= k1;
      h1 = (h1 << 13) | (h1 >>> 19);
      h1 = (Math.imul(h1, 5) + 0xe6546b64) >>> 0;
    }

    let k1 = 0;
    const tail = len % 4;
    const tailIdx = nblocks * 4;

    if (tail === 3) k1 ^= (bytes[tailIdx + 2] & 0xff) << 16;
    if (tail >= 2) k1 ^= (bytes[tailIdx + 1] & 0xff) << 8;
    if (tail >= 1) {
      k1 ^= (bytes[tailIdx] & 0xff);
      k1 = Math.imul(k1, c1);
      k1 = (k1 << 15) | (k1 >>> 17);
      k1 = Math.imul(k1, c2);
      h1 ^= k1;
    }

    h1 ^= len;
    h1 ^= h1 >>> 16;
    h1 = Math.imul(h1, 0x85ebca6b);
    h1 ^= h1 >>> 13;
    h1 = Math.imul(h1, 0xc2b2ae35);
    h1 ^= h1 >>> 16;

    return h1 >>> 0;
  }

  /**
   * Fast 128-bit MurmurHash3 (x86_128 architecture equivalent)
   * @param {string|Uint8Array|Buffer} key 
   * @param {number} seed 
   * @returns {string} 32-character hexadecimal string (128 bits)
   */
  static hash128(key, seed = 0) {
    const bytes = typeof key === 'string' ? Buffer.from(key, 'utf8') : key;
    let h1 = seed >>> 0;
    let h2 = seed >>> 0;
    let h3 = seed >>> 0;
    let h4 = seed >>> 0;

    const c1 = 0x239b961b;
    const c2 = 0xab0e9789;
    const c3 = 0x38b34ae5;
    const c4 = 0xa1e38b93;

    const len = bytes.length;
    const nblocks = Math.floor(len / 16);

    for (let i = 0; i < nblocks; i++) {
      const idx = i * 16;
      let k1 = (bytes[idx] & 0xff) | ((bytes[idx + 1] & 0xff) << 8) | ((bytes[idx + 2] & 0xff) << 16) | ((bytes[idx + 3] & 0xff) << 24);
      let k2 = (bytes[idx + 4] & 0xff) | ((bytes[idx + 5] & 0xff) << 8) | ((bytes[idx + 6] & 0xff) << 16) | ((bytes[idx + 7] & 0xff) << 24);
      let k3 = (bytes[idx + 8] & 0xff) | ((bytes[idx + 9] & 0xff) << 8) | ((bytes[idx + 10] & 0xff) << 16) | ((bytes[idx + 11] & 0xff) << 24);
      let k4 = (bytes[idx + 12] & 0xff) | ((bytes[idx + 13] & 0xff) << 8) | ((bytes[idx + 14] & 0xff) << 16) | ((bytes[idx + 15] & 0xff) << 24);

      k1 = Math.imul(k1, c1); k1 = (k1 << 15) | (k1 >>> 17); k1 = Math.imul(k1, c2); h1 ^= k1;
      h1 = (h1 << 19) | (h1 >>> 13); h1 = (h1 + h2) >>> 0; h1 = (Math.imul(h1, 5) + 0x561ccd1b) >>> 0;

      k2 = Math.imul(k2, c2); k2 = (k2 << 16) | (k2 >>> 16); k2 = Math.imul(k2, c3); h2 ^= k2;
      h2 = (h2 << 17) | (h2 >>> 15); h2 = (h2 + h3) >>> 0; h2 = (Math.imul(h2, 5) + 0x0bcaa747) >>> 0;

      k3 = Math.imul(k3, c3); k3 = (k3 << 17) | (k3 >>> 15); k3 = Math.imul(k3, c4); h3 ^= k3;
      h3 = (h3 << 15) | (h3 >>> 17); h3 = (h3 + h4) >>> 0; h3 = (Math.imul(h3, 5) + 0x96cd1c35) >>> 0;

      k4 = Math.imul(k4, c4); k4 = (k4 << 18) | (k4 >>> 14); k4 = Math.imul(k4, c1); h4 ^= k4;
      h4 = (h4 << 13) | (h4 >>> 19); h4 = (h4 + h1) >>> 0; h4 = (Math.imul(h4, 5) + 0x32ac3b17) >>> 0;
    }

    const tailIdx = nblocks * 16;
    let k1 = 0, k2 = 0, k3 = 0, k4 = 0;
    const rem = len % 16;

    if (rem >= 15) k4 ^= (bytes[tailIdx + 14] & 0xff) << 16;
    if (rem >= 14) k4 ^= (bytes[tailIdx + 13] & 0xff) << 8;
    if (rem >= 13) {
      k4 ^= (bytes[tailIdx + 12] & 0xff);
      k4 = Math.imul(k4, c4); k4 = (k4 << 18) | (k4 >>> 14); k4 = Math.imul(k4, c1); h4 ^= k4;
    }

    if (rem >= 12) k3 ^= (bytes[tailIdx + 11] & 0xff) << 24;
    if (rem >= 11) k3 ^= (bytes[tailIdx + 10] & 0xff) << 16;
    if (rem >= 10) k3 ^= (bytes[tailIdx + 9] & 0xff) << 8;
    if (rem >= 9) {
      k3 ^= (bytes[tailIdx + 8] & 0xff);
      k3 = Math.imul(k3, c3); k3 = (k3 << 17) | (k3 >>> 15); k3 = Math.imul(k3, c4); h3 ^= k3;
    }

    if (rem >= 8) k2 ^= (bytes[tailIdx + 7] & 0xff) << 24;
    if (rem >= 7) k2 ^= (bytes[tailIdx + 6] & 0xff) << 16;
    if (rem >= 6) k2 ^= (bytes[tailIdx + 5] & 0xff) << 8;
    if (rem >= 5) {
      k2 ^= (bytes[tailIdx + 4] & 0xff);
      k2 = Math.imul(k2, c2); k2 = (k2 << 16) | (k2 >>> 16); k2 = Math.imul(k2, c3); h2 ^= k2;
    }

    if (rem >= 4) k1 ^= (bytes[tailIdx + 3] & 0xff) << 24;
    if (rem >= 3) k1 ^= (bytes[tailIdx + 2] & 0xff) << 16;
    if (rem >= 2) k1 ^= (bytes[tailIdx + 1] & 0xff) << 8;
    if (rem >= 1) {
      k1 ^= (bytes[tailIdx] & 0xff);
      k1 = Math.imul(k1, c1); k1 = (k1 << 15) | (k1 >>> 17); k1 = Math.imul(k1, c2); h1 ^= k1;
    }

    h1 ^= len; h2 ^= len; h3 ^= len; h4 ^= len;

    h1 = (h1 + h2) >>> 0; h1 = (h1 + h3) >>> 0; h1 = (h1 + h4) >>> 0;
    h2 = (h2 + h1) >>> 0; h3 = (h3 + h1) >>> 0; h4 = (h4 + h1) >>> 0;

    const fmix = (h) => {
      h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b);
      h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35);
      h ^= h >>> 16;
      return h >>> 0;
    };

    h1 = fmix(h1); h2 = fmix(h2); h3 = fmix(h3); h4 = fmix(h4);

    h1 = (h1 + h2) >>> 0; h1 = (h1 + h3) >>> 0; h1 = (h1 + h4) >>> 0;
    h2 = (h2 + h1) >>> 0; h3 = (h3 + h1) >>> 0; h4 = (h4 + h1) >>> 0;

    const hex = (n) => n.toString(16).padStart(8, '0');
    return `${hex(h1)}${hex(h2)}${hex(h3)}${hex(h4)}`;
  }
}
