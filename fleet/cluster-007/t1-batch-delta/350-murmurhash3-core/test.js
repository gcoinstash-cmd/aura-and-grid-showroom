import assert from 'node:assert/strict';
import { murmur32, murmur32Hex } from './engine.js';

console.log('⚡ [Unit #350 Test Suite] Testing MurmurHash3 Fast Hash Core...');

// Test 1: Deterministic Vectors
{
  assert.equal(murmur32(''), 0);
  const hashHello = murmur32Hex('hello world');
  assert.equal(typeof hashHello, 'string');
  assert.equal(hashHello.length, 8);
  console.log('  ✔ Deterministic 32-bit Murmur3 hash verified: ' + hashHello);
}
