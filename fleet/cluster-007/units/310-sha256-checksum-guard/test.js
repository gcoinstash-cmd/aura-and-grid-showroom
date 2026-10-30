import assert from 'node:assert/strict';
import {
  computeSha256,
  computeHmacSha256,
  verifySha256,
  verifyHmacSha256,
  canonicalJson,
  benchmarkIntegrityGuard,
  IntegrityGuardError
} from './engine.js';

console.log('⚡ [Unit #310 Test Suite] Initiating verification sequence...');

// Test 1: Deterministic Object Hashing
{
  const objA = { z: 26, a: 1, nested: { y: 2, x: 1 } };
  const objB = { a: 1, nested: { x: 1, y: 2 }, z: 26 };
  assert.equal(canonicalJson(objA), canonicalJson(objB));

  const hashA = computeSha256(objA, 'hex');
  const hashB = computeSha256(objB, 'hex');
  assert.equal(hashA, hashB);
  assert.equal(hashA.length, 64);
  console.log('  ✔ Deterministic Canonical Hashing passed');
}

// Test 2: SHA-256 Checksum Verification
{
  const data = 'GhostFactoryOS::TelemetryStream';
  const checksum = computeSha256(data, 'hex');
  assert.equal(verifySha256(data, checksum, 'hex'), true);
  assert.equal(verifySha256('TamperedData', checksum, 'hex'), false);
  console.log('  ✔ verifySha256 passed');
}

// Test 3: HMAC-SHA256 Sign & Verification
{
  const secret = 'ultra_secret_factory_key';
  const payload = { chassis: 'GF-310', rpm: 9200 };
  const signature = computeHmacSha256(payload, secret, 'hex');

  assert.equal(verifyHmacSha256(payload, secret, signature, 'hex'), true);
  assert.equal(verifyHmacSha256(payload, 'wrong_key', signature, 'hex'), false);
  assert.throws(() => computeHmacSha256('data', ''), IntegrityGuardError);
  console.log('  ✔ computeHmacSha256 & verifyHmacSha256 passed');
}

// Test 4: Base64 Encoding Mode
{
  const text = 'Base64TelemetryData';
  const b64Hash = computeSha256(text, 'base64');
  assert.equal(verifySha256(text, b64Hash, 'base64'), true);
  console.log('  ✔ Base64 hash verification passed');
}

// Test 5: Benchmark
{
  const bench = benchmarkIntegrityGuard(1000);
  assert.ok(bench.opsPerSec > 10000, `Throughput was ${bench.opsPerSec} ops/sec`);
  console.log(`  ✔ benchmarkIntegrityGuard passed (${bench.opsPerSec} ops/sec, latency: ${bench.avgLatencyUs} µs)`);
}

console.log('🏁 [Unit #310 Test Suite] ALL CHECKS 100% GREEN.\n');
