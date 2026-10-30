import assert from 'node:assert/strict';
import { encodeBase32, decodeBase32, generateTotpSecret } from './engine.js';

console.log('⚡ [Unit #402 Test Suite] Testing Base32 TOTP Encoder...');

// Test 1: Standard RFC 4648 test vectors
{
  assert.equal(encodeBase32(''), '');
  assert.equal(encodeBase32('f'), 'MY');
  assert.equal(encodeBase32('fo'), 'MZXQ');
  assert.equal(encodeBase32('foo'), 'MZXW6');
  assert.equal(encodeBase32('foob'), 'MZXW6YQ');
  assert.equal(encodeBase32('foobar'), 'MZXW6YTBOI');

  assert.equal(decodeBase32('MZXW6YTBOI').toString('utf8'), 'foobar');
  console.log('  ✔ RFC 4648 Base32 test vectors verified');
}

// Test 2: TOTP Secret Generation
{
  const secret = generateTotpSecret(20);
  assert.equal(secret.length, 32);
  const decoded = decodeBase32(secret);
  assert.equal(decoded.length, 20);
  console.log('  ✔ 160-bit TOTP secret key generation passed');
}
