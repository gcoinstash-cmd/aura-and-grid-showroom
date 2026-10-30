import assert from 'node:assert/strict';
import { FastBloomFilter } from './engine.js';

console.log('⚡ [Unit #405 Test Suite] Testing Fast Bloom Filter...');

// Test 1: Membership check & zero false negatives
{
  const filter = new FastBloomFilter(1024, 3);
  filter.add('telemetry_alpha');
  filter.add('telemetry_beta');

  assert.equal(filter.has('telemetry_alpha'), true);
  assert.equal(filter.has('telemetry_beta'), true);
  assert.equal(filter.has('telemetry_nonexistent_xyz'), false);
  assert.ok(filter.bitCount() > 0);
  console.log('  ✔ Zero false negative probabilistic filter passed');
}
