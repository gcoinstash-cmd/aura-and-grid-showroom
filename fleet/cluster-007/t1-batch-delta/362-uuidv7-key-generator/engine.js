/**
 * Unit #362: UUID v7 Time-Ordered Key Generator
 * Track 1 (Lean Tuner) — RFC 9562 Monotonic Timestamp UUID
 */

import crypto from 'node:crypto';

let lastTimestamp = -1;
let seqCounter = 0;

export function generateUuidV7() {
  let now = Date.now();
  if (now === lastTimestamp) {
    seqCounter = (seqCounter + 1) & 0xFFF;
    if (seqCounter === 0) now++;
  } else {
    seqCounter = crypto.randomInt(0, 0xFFF);
    lastTimestamp = now;
  }

  const bytes = Buffer.alloc(16);

  // 48-bit timestamp
  bytes.writeUIntBE(Math.floor(now / 0x10000), 0, 4);
  bytes.writeUInt16BE(now & 0xFFFF, 4);

  // 12-bit counter with 4-bit version 7
  bytes[6] = 0x70 | ((seqCounter >>> 8) & 0x0F);
  bytes[7] = seqCounter & 0xFF;

  // Variant 10xx xxxx + random bits
  const rand = crypto.randomBytes(8);
  rand[0] = (rand[0] & 0x3F) | 0x80;
  rand.copy(bytes, 8);

  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function getTimestampFromUuidV7(uuid) {
  const clean = uuid.replace(/-/g, '');
  const high = parseInt(clean.slice(0, 8), 16);
  const low = parseInt(clean.slice(8, 12), 16);
  return (high * 0x10000) + low;
}
