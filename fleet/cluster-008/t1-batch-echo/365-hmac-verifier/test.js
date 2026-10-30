import assert from 'node:assert/strict';
import { signHmac, verifyHmac } from './engine.js';

console.log('⚡ [Unit #365 Test Suite] Testing Constant-Time HMAC Verifier...');

// Test 1: Sign & Verify
{
  const payload = { account: 'ACC-8819', transferUsd: 14500 };
  const secret = 'cluster008-secret-hmac-key';
  const sig = signHmac(payload, secret);

  assert.equal(verifyHmac(payload, secret, sig), true);
  assert.equal(verifyHmac({ ...payload, transferUsd: 14501 }, secret, sig), false);
  console.log('  ✔ Constant-time HMAC signing & tampering rejection passed');
}
