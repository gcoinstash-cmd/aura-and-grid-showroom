/**
 * Unit #368: Bitcoin/IPFS Base58 Binary Encoder & Decoder
 * Track 1 (Lean Tuner) — Pure Bitcoin Alphabet Base58 Rig
 */

const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const BASE = BigInt(58);

export function encodeBase58(buffer) {
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer, typeof buffer === 'string' ? 'utf8' : undefined);
  if (buf.length === 0) return '';

  let num = 0n;
  for (let i = 0; i < buf.length; i++) {
    num = (num << 8n) + BigInt(buf[i]);
  }

  let str = '';
  while (num > 0n) {
    const rem = num % BASE;
    num = num / BASE;
    str = ALPHABET[Number(rem)] + str;
  }

  // Preserve leading zeros as '1'
  for (let i = 0; i < buf.length && buf[i] === 0; i++) {
    str = '1' + str;
  }

  return str;
}

export function decodeBase58(str) {
  if (typeof str !== 'string' || str.length === 0) return Buffer.alloc(0);

  let num = 0n;
  for (let i = 0; i < str.length; i++) {
    const idx = ALPHABET.indexOf(str[i]);
    if (idx === -1) throw new Error(`Invalid Base58 character: ${str[i]}`);
    num = (num * BASE) + BigInt(idx);
  }

  const bytes = [];
  while (num > 0n) {
    bytes.unshift(Number(num & 0xFFn));
    num = num >> 8n;
  }

  // Restore leading zeros
  let leadingZeros = 0;
  for (let i = 0; i < str.length && str[i] === '1'; i++) {
    leadingZeros++;
  }

  const finalBuf = Buffer.alloc(leadingZeros + bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    finalBuf[leadingZeros + i] = bytes[i];
  }

  return finalBuf;
}
