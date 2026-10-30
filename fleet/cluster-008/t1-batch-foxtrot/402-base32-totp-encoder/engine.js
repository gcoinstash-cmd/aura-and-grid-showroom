/**
 * Unit #402: Base32 (RFC 4648) & TOTP Secret Key Rig
 * Track 1 (Lean Tuner) — RFC 4648 Base32 Secret Key Rig
 */

import crypto from 'node:crypto';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function encodeBase32(bufferOrString) {
  const buf = Buffer.isBuffer(bufferOrString) ? bufferOrString : Buffer.from(bufferOrString, 'utf8');
  if (buf.length === 0) return '';

  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buf.length; i++) {
    value = (value << 8) | buf[i];
    bits += 8;
    while (bits >= 5) {
      output += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

export function decodeBase32(str) {
  if (typeof str !== 'string' || !str) return Buffer.alloc(0);
  const cleaned = str.toUpperCase().replace(/=+$/, '');

  let bits = 0;
  let value = 0;
  const bytes = [];

  for (let i = 0; i < cleaned.length; i++) {
    const idx = ALPHABET.indexOf(cleaned[i]);
    if (idx === -1) throw new Error(`Invalid Base32 character: '${cleaned[i]}'`);

    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

export function generateTotpSecret(bytes = 20) {
  return encodeBase32(crypto.randomBytes(bytes));
}
