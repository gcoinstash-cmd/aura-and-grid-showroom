/**
 * Unit #304 Test Suite: Ed25519 Token Signer & Verification Rig
 * Track 1 Verification Rig
 */

import assert from 'node:assert/strict';
import {
  generateEd25519KeyPair,
  signToken,
  verifyToken,
  decodeToken,
  canonicalJsonStringify,
  base64UrlEncode,
  base64UrlDecode,
  benchmarkTokenRig
} from './engine.js';

console.log('⚡ [Unit #304 Test Suite] Initiating verification sequence...');

// Test 1: Keypair generation
const { publicKeyPem, privateKeyPem } = generateEd25519KeyPair();
assert.ok(publicKeyPem.includes('BEGIN PUBLIC KEY'));
assert.ok(privateKeyPem.includes('BEGIN PRIVATE KEY'));
console.log('  ✔ generateEd25519KeyPair passed');

// Test 2: Canonical JSON serialization
{
  const obj1 = { b: 2, a: 1, c: { y: 20, x: 10 } };
  const obj2 = { a: 1, c: { x: 10, y: 20 }, b: 2 };
  assert.equal(canonicalJsonStringify(obj1), canonicalJsonStringify(obj2));
  console.log('  ✔ canonicalJsonStringify passed');
}

// Test 3: Base64URL roundtrip
{
  const testStr = 'Cluster007//Telemetry++Secure==Value';
  const encoded = base64UrlEncode(testStr);
  assert.equal(encoded.includes('+'), false);
  assert.equal(encoded.includes('/'), false);
  assert.equal(encoded.includes('='), false);
  const decoded = base64UrlDecode(encoded).toString('utf8');
  assert.equal(decoded, testStr);
  console.log('  ✔ base64UrlEncode / base64UrlDecode passed');
}

// Test 4: Token sign and verify roundtrip
{
  const payload = {
    user: 'lead-assembly-robot',
    clearance: 'T1-CREW-CHIEF',
    cluster: '007'
  };

  const token = signToken(payload, privateKeyPem, {
    issuer: 'GhostFactoryOS',
    audience: 'AuraAndGrid',
    expiresInSec: 600
  });

  assert.equal(typeof token, 'string');
  assert.equal(token.split('.').length, 3);

  const result = verifyToken(token, publicKeyPem, {
    issuer: 'GhostFactoryOS',
    audience: 'AuraAndGrid'
  });

  assert.equal(result.valid, true);
  assert.equal(result.payload.user, 'lead-assembly-robot');
  assert.equal(result.payload.iss, 'GhostFactoryOS');
  assert.equal(result.header.alg, 'Ed25519');
  console.log('  ✔ signToken & verifyToken passed');
}

// Test 5: Tamper resistance (tampering payload, signature, or header)
{
  const token = signToken({ role: 'guest' }, privateKeyPem, { expiresInSec: 3600 });
  const [header, payload, sig] = token.split('.');

  // Alter payload: change 'guest' to 'admin'
  const tamperedPayload = base64UrlEncode(JSON.stringify({ role: 'admin' }));
  const forgedToken = `${header}.${tamperedPayload}.${sig}`;

  const tamperResult = verifyToken(forgedToken, publicKeyPem);
  assert.equal(tamperResult.valid, false);
  assert.equal(tamperResult.errorCode, 'ERR_SIGNATURE_INVALID');

  // Alter signature bits
  const corruptSig = sig.substring(0, sig.length - 2) + 'AA';
  const corruptToken = `${header}.${payload}.${corruptSig}`;
  const corruptResult = verifyToken(corruptToken, publicKeyPem);
  assert.equal(corruptResult.valid, false);
  console.log('  ✔ Tamper detection passed (signature & payload forgery blocked)');
}

// Test 6: Expiration enforcement
{
  const expiredToken = signToken({ state: 'expired' }, privateKeyPem, {
    expiresInSec: -10 // expired 10 seconds ago
  });

  const expiredResult = verifyToken(expiredToken, publicKeyPem, { clockToleranceSec: 0 });
  assert.equal(expiredResult.valid, false);
  assert.equal(expiredResult.errorCode, 'ERR_TOKEN_EXPIRED');

  // Allowed with ignoreExpiration
  const bypassResult = verifyToken(expiredToken, publicKeyPem, { ignoreExpiration: true });
  assert.equal(bypassResult.valid, true);
  console.log('  ✔ Expiration enforcement passed');
}

// Test 7: Issuer and Audience validation
{
  const token = signToken({ sub: 'telemetry' }, privateKeyPem, {
    issuer: 'GF-HUB',
    audience: 'AG-NODE'
  });

  const badIssuer = verifyToken(token, publicKeyPem, { issuer: 'ROGUE-HUB' });
  assert.equal(badIssuer.valid, false);
  assert.equal(badIssuer.errorCode, 'ERR_ISSUER_MISMATCH');

  const badAudience = verifyToken(token, publicKeyPem, { audience: 'OTHER-NODE' });
  assert.equal(badAudience.valid, false);
  assert.equal(badAudience.errorCode, 'ERR_AUDIENCE_MISMATCH');
  console.log('  ✔ Issuer & Audience validation passed');
}

// Test 8: Decode token utility
{
  const token = signToken({ foo: 'bar' }, privateKeyPem);
  const decoded = decodeToken(token);
  assert.equal(decoded.payload.foo, 'bar');
  assert.equal(decoded.header.alg, 'Ed25519');
  console.log('  ✔ decodeToken inspection passed');
}

// Test 9: Benchmark execution
{
  const bench = benchmarkTokenRig(500);
  assert.ok(bench.opsPerSec > 1000, `Benchmark achieved ${bench.opsPerSec} ops/sec`);
  console.log(`  ✔ benchmarkTokenRig passed (${bench.opsPerSec} ops/sec, sign: ${bench.signLatencyUs} µs, verify: ${bench.verifyLatencyUs} µs)`);
}

console.log('🏁 [Unit #304 Test Suite] ALL CHECKS 100% GREEN.\n');
