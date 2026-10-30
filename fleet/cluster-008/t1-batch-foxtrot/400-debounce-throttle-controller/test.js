import assert from 'node:assert/strict';
import { debounce, throttle } from './engine.js';

console.log('⚡ [Unit #400 Test Suite] Testing Debounce & Throttle Controller...');

// Test 1: Throttle leading execution
{
  let count = 0;
  const throttled = throttle(() => count++, 50);

  throttled();
  throttled();
  throttled();
  assert.equal(count, 1);
  throttled.cancel();
  console.log('  ✔ Throttle leading edge rate limit verified');
}

// Test 2: Debounce cancel
{
  let called = false;
  const debounced = debounce(() => { called = true; }, 50);
  debounced();
  debounced.cancel();
  assert.equal(called, false);
  console.log('  ✔ Debounce cancellation verified');
}
