import assert from 'node:assert/strict';
import { SlidingWindowLimiter } from './engine.js';

console.log('⚡ [Unit #352 Test Suite] Testing Sliding Window Limiter...');

// Test 1: Allowance & Rejection
{
  const limiter = new SlidingWindowLimiter(3, 1000);
  assert.equal(limiter.check('ip-1').allowed, true);
  assert.equal(limiter.check('ip-1').allowed, true);
  assert.equal(limiter.check('ip-1').allowed, true);
  assert.equal(limiter.check('ip-1').allowed, false);
  console.log('  ✔ Rate limit cutoff verified at 3 requests');
}
