import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from './engine.js';

console.log('⚡ [Unit #367 Test Suite] Testing PBKDF2 Password Hashing...');

// Test 1: Hash & Verify
{
  const pass = 'DealershipMasterPassphrase2026!';
  const hash = hashPassword(pass, { iterations: 2000 });
  assert.ok(hash.startsWith('pbkdf2_sha256$2000$'));
  assert.equal(verifyPassword(pass, hash), true);
  assert.equal(verifyPassword('WrongPassphrase', hash), false);
  console.log('  ✔ PBKDF2 password hashing & verification passed');
}
