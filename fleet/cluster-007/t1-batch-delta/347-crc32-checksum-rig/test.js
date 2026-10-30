import assert from 'node:assert/strict';
import { crc32, crc32Hex, verifyCrc32 } from './engine.js';

console.log('⚡ [Unit #347 Test Suite] Testing CRC32 Checksum Rig...');

// Test 1: Standard known vectors
{
  assert.equal(crc32Hex('123456789'), 'CBF43926');
  assert.equal(crc32Hex('The quick brown fox jumps over the lazy dog'), '414FA339');
  console.log('  ✔ Standard IEEE 802.3 test vectors verified');
}

// Test 2: Binary Buffer & Object Verification
{
  const buf = Buffer.from([0x01, 0x02, 0x03, 0x04]);
  const hex = crc32Hex(buf);
  assert.equal(verifyCrc32(buf, hex), true);
  assert.equal(verifyCrc32(buf, '00000000'), false);
  console.log('  ✔ Binary buffer validation passed');
}
