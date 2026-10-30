import assert from 'node:assert/strict';
import { formatBytes, parseBytes } from './engine.js';

console.log('⚡ [Unit #394 Test Suite] Testing Byte Size Formatter...');

// Test 1: Formatting
{
  assert.equal(formatBytes(1024, { binary: true }), '1.00 KiB');
  assert.equal(formatBytes(1000, { binary: false }), '1.00 KB');
  assert.equal(formatBytes(1073741824, { binary: true }), '1.00 GiB');
  console.log('  ✔ Binary and SI byte formatting verified');
}

// Test 2: Parsing
{
  assert.equal(parseBytes('256 MiB'), 268435456);
  assert.equal(parseBytes('10GB'), 10000000000);
  assert.equal(parseBytes('10GiB'), 10737418240);
  console.log('  ✔ Byte string parsing verified');
}
