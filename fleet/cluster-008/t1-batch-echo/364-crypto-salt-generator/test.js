import assert from 'node:assert/strict';
import { generateSalt, generateSaltedHash, verifySaltedHash } from './engine.js';

console.log('⚡ [Unit #364 Test Suite] Testing Salt Generator & Entropy Rig...');

// Test 1: Generate Salts
{
  const hexSalt = generateSalt(16, 'hex');
  assert.equal(hexSalt.length, 32);
  const b64Salt = generateSalt(16, 'base64');
  assert.ok(b64Salt.length > 0);
  console.log('  ✔ CSPRNG salt generation passed');
}

// Test 2: Salted Hash & Timing-Safe Verification
{
  const secret = 'AuraGridSuperPassword42';
  const salt = generateSalt(16, 'hex');
  const hash = generateSaltedHash(secret, salt);
  assert.equal(verifySaltedHash(secret, salt, hash), true);
  assert.equal(verifySaltedHash(secret + 'wrong', salt, hash), false);
  console.log('  ✔ Salted hash generation and verification passed');
}
