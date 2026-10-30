import assert from 'node:assert/strict';
import { SlidingWindowMeter } from './engine.js';

console.log('⚡ [Unit #404 Test Suite] Testing Sliding Window Rate Meter...');

// Test 1: Mark & GetCount
{
  const meter = new SlidingWindowMeter(1000, 10);
  const now = 1000000;

  meter.mark(10, now);
  meter.mark(15, now + 200);

  assert.equal(meter.getCount(now + 300), 25);
  assert.equal(meter.getRate(now + 300), 25.0);

  // Advance past window (now + 1200)
  assert.equal(meter.getCount(now + 1200), 0);
  console.log('  ✔ Sliding window multi-bucket expiry and rate verified');
}
