/**
 * Unit #405: Fast Bloom Filter Probabilistic Set Rig
 * Track 1 (Lean Tuner) — Bitset Probabilistic Membership Filter
 */

function fnv1a(str, seed = 0) {
  let hash = 0x811c9dc5 ^ seed;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export class FastBloomFilter {
  constructor(sizeBits = 1024, hashCount = 3) {
    this.size = sizeBits;
    this.hashCount = hashCount;
    this.buffer = new Uint8Array(Math.ceil(sizeBits / 8));
  }

  _getHashes(element) {
    const str = String(element);
    const hashes = [];
    for (let i = 0; i < this.hashCount; i++) {
      hashes.push(fnv1a(str, i * 0x5bd1e995) % this.size);
    }
    return hashes;
  }

  add(element) {
    const hashes = this._getHashes(element);
    for (const h of hashes) {
      const byteIdx = Math.floor(h / 8);
      const bitIdx = h % 8;
      this.buffer[byteIdx] |= 1 << bitIdx;
    }
  }

  has(element) {
    const hashes = this._getHashes(element);
    for (const h of hashes) {
      const byteIdx = Math.floor(h / 8);
      const bitIdx = h % 8;
      if ((this.buffer[byteIdx] & (1 << bitIdx)) === 0) {
        return false; // Definitely not in set
      }
    }
    return true; // Probably in set
  }

  bitCount() {
    let count = 0;
    for (let i = 0; i < this.buffer.length; i++) {
      let b = this.buffer[i];
      while (b > 0) {
        count += b & 1;
        b >>= 1;
      }
    }
    return count;
  }

  clear() {
    this.buffer.fill(0);
  }
}
