/**
 * Unit #366: HKDF Key Derivation Helper (RFC 5869)
 * Track 1 (Lean Tuner) — RFC 5869 HMAC-based Extract-and-Expand KDF
 */

import crypto from 'node:crypto';

export function deriveHkdfKey(ikm, salt, info, keyLength = 32, digest = 'sha256') {
  const ikmBuf = Buffer.isBuffer(ikm) ? ikm : Buffer.from(ikm, 'utf8');
  const saltBuf = salt ? (Buffer.isBuffer(salt) ? salt : Buffer.from(salt, 'utf8')) : Buffer.alloc(0);
  const infoBuf = Buffer.isBuffer(info) ? info : Buffer.from(info, 'utf8');

  return new Promise((resolve, reject) => {
    crypto.hkdf(digest, ikmBuf, saltBuf, infoBuf, keyLength, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(Buffer.from(derivedKey));
    });
  });
}

export function deriveHkdfKeySync(ikm, salt, info, keyLength = 32, digest = 'sha256') {
  const ikmBuf = Buffer.isBuffer(ikm) ? ikm : Buffer.from(ikm, 'utf8');
  const saltBuf = salt ? (Buffer.isBuffer(salt) ? salt : Buffer.from(salt, 'utf8')) : Buffer.alloc(32);
  const infoBuf = Buffer.isBuffer(info) ? info : Buffer.from(info, 'utf8');

  // RFC 5869 Extract: PRK = HMAC-Hash(salt, IKM)
  const prk = crypto.createHmac(digest, saltBuf).update(ikmBuf).digest();

  // RFC 5869 Expand: T(1) = HMAC-Hash(PRK, info | 0x01)
  let t = Buffer.alloc(0);
  let okm = Buffer.alloc(0);
  let counter = 1;

  while (okm.length < keyLength) {
    const hmac = crypto.createHmac(digest, prk);
    hmac.update(t);
    hmac.update(infoBuf);
    hmac.update(Buffer.from([counter]));
    t = hmac.digest();
    okm = Buffer.concat([okm, t]);
    counter++;
  }

  return okm.slice(0, keyLength);
}
