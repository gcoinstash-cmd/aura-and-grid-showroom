/**
 * Unit #350: MurmurHash3 Fast Hash Core
 * Track 1 (Lean Tuner) — Pure 32-Bit Bitwise Murmur3 Implementation
 */

export function murmur32(key, seed = 0) {
  const buf = typeof key === 'string' ? Buffer.from(key, 'utf8') : Buffer.from(key);
  const remainder = buf.length & 3;
  const bytes = buf.length - remainder;
  let h1 = seed >>> 0;

  const c1 = 0xcc9e2d51;
  const c2 = 0x1b873593;

  for (let i = 0; i < bytes; i += 4) {
    let k1 = (buf[i] & 0xff) |
      ((buf[i + 1] & 0xff) << 8) |
      ((buf[i + 2] & 0xff) << 16) |
      ((buf[i + 3] & 0xff) << 24);

    k1 = Math.imul(k1, c1);
    k1 = (k1 << 15) | (k1 >>> 17);
    k1 = Math.imul(k1, c2);

    h1 ^= k1;
    h1 = (h1 << 13) | (h1 >>> 19);
    h1 = (Math.imul(h1, 5) + 0xe6546b64) | 0;
  }

  let k1 = 0;
  switch (remainder) {
    case 3:
      k1 ^= (buf[bytes + 2] & 0xff) << 16;
    case 2:
      k1 ^= (buf[bytes + 1] & 0xff) << 8;
    case 1:
      k1 ^= (buf[bytes] & 0xff);
      k1 = Math.imul(k1, c1);
      k1 = (k1 << 15) | (k1 >>> 17);
      k1 = Math.imul(k1, c2);
      h1 ^= k1;
  }

  h1 ^= buf.length;
  h1 ^= h1 >>> 16;
  h1 = Math.imul(h1, 0x85ebca6b);
  h1 ^= h1 >>> 13;
  h1 = Math.imul(h1, 0xc2b2ae35);
  h1 ^= h1 >>> 16;

  return h1 >>> 0;
}

export function murmur32Hex(key, seed = 0) {
  return murmur32(key, seed).toString(16).padStart(8, '0');
}
