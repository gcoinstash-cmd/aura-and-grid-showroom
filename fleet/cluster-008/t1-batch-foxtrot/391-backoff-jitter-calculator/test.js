import assert from 'node:assert/strict';
import { calculateBackoff } from './engine.js';

console.log('⚡ [Unit #391 Test Suite] Testing Backoff Jitter Calculator...');

// Test 1: Deterministic non-jitter backoff
{
  const b1 = calculateBackoff(1, { baseMs: 100, factor: 2, jitter: 'none' });
  const b2 = calculateBackoff(2, { baseMs: 100, factor: 2, jitter: 'none' });
  const b3 = calculateBackoff(3, { baseMs: 100, factor: 2, jitter: 'none' });

  assert.equal(b1, 100);
  assert.equal(b2, 200);
  assert.equal(b3, 400);
  console.log('  ✔ Non-jittered exponential backoff verified');
}

// Test 2: Jitter bounds
{
  for (let i = 0; i < 20; i++) {
    const full = calculateBackoff(3, { baseMs: 100, maxMs: 1000, jitter: 'full' });
    assert.ok(full >= 0 && full <= 400);

    const equal = calculateBackoff(3, { baseMs: 100, maxMs: 1000, jitter: 'equal' });
    assert.ok(equal >= 200 && equal <= 400);
  }
  console.log('  ✔ Full and Equal jitter distribution constraints verified');
}
