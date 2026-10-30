import assert from 'node:assert/strict';
import { deriveHkdfKeySync } from './engine.js';

console.log('⚡ [Unit #366 Test Suite] Testing HKDF Key Derivation Helper...');

// Test 1: Deterministic HKDF derivation
{
  const ikm = 'master-secret-input-keying-material';
  const salt = 'salt-vector-1234';
  const info = 'telemetry-encryption-v1';

  const key1 = deriveHkdfKeySync(ikm, salt, info, 32);
  const key2 = deriveHkdfKeySync(ikm, salt, info, 32);
  assert.equal(key1.length, 32);
  assert.equal(key1.toString('hex'), key2.toString('hex'));
  console.log('  ✔ RFC 5869 HKDF deterministic key derivation passed');
}
