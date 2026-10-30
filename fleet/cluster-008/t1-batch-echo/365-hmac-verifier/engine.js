/**
 * Unit #365: Constant-Time HMAC Signature Verifier
 * Track 1 (Lean Tuner) — Timing-Attack Resilient HMAC Rig
 */

import crypto from 'node:crypto';

export function signHmac(payload, secret, algorithm = 'sha256') {
  const hmac = crypto.createHmac(algorithm, secret);
  hmac.update(typeof payload === 'string' ? payload : JSON.stringify(payload));
  return hmac.digest('hex');
}

export function verifyHmac(payload, secret, expectedHexSig, algorithm = 'sha256') {
  const actualHexSig = signHmac(payload, secret, algorithm);
  const actualBuf = Buffer.from(actualHexSig, 'hex');
  const expectedBuf = Buffer.from(expectedHexSig, 'hex');

  if (actualBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(actualBuf, expectedBuf);
}
