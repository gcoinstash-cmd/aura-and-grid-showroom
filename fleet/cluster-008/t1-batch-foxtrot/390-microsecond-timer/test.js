import assert from 'node:assert/strict';
import { startTimer, timeSync } from './engine.js';

console.log('⚡ [Unit #390 Test Suite] Testing High-Res Timer...');

// Test 1: Start/Stop timer
{
  const timer = startTimer();
  let acc = 0;
  for (let i = 0; i < 10000; i++) acc += i;
  const elapsed = timer.stop();

  assert.ok(elapsed.durationNs > 0);
  assert.ok(elapsed.durationUs > 0);
  assert.ok(elapsed.durationMs >= 0);
  console.log('  ✔ Nanosecond/microsecond duration metrics verified');
}

// Test 2: Synchronous execution wrapper
{
  const { result, durationUs } = timeSync(() => 42 * 2);
  assert.equal(result, 84);
  assert.ok(durationUs >= 0);
  console.log('  ✔ Function wrapper benchmarking verified');
}
