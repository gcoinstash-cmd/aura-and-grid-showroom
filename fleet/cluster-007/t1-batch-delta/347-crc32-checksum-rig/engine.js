/**
 * Unit #347: CRC32 High-Throughput Checksum Rig
 * Track 1 (Lean Tuner) — Pure IEEE 802.3 Fast Table Checksum
 */

// Precompute IEEE 802.3 CRC32 table
const TABLE = new Int32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1);
  }
  TABLE[i] = c;
}

export function crc32(input) {
  let buf;
  if (Buffer.isBuffer(input)) {
    buf = input;
  } else if (typeof input === 'string') {
    buf = Buffer.from(input, 'utf8');
  } else {
    buf = Buffer.from(JSON.stringify(input), 'utf8');
  }

  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = TABLE[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ -1) >>> 0;
}

export function crc32Hex(input) {
  return crc32(input).toString(16).padStart(8, '0').toUpperCase();
}

export function verifyCrc32(input, expectedHex) {
  const actual = crc32Hex(input);
  return actual === expectedHex.trim().toUpperCase();
}
