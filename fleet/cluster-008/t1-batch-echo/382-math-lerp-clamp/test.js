import assert from 'node:assert/strict';
import { clamp, lerp, inverseLerp, mapRange, smoothstep } from './engine.js';

console.log('⚡ [Unit #382 Test Suite] Testing Precision Math Unit...');

// Test 1: Clamp & Lerp
{
  assert.equal(clamp(15, 0, 10), 10);
  assert.equal(clamp(-5, 0, 10), 0);
  assert.equal(clamp(7, 0, 10), 7);

  assert.equal(lerp(0, 100, 0.5), 50);
  assert.equal(lerp(10, 20, 0.25), 12.5);
  console.log('  ✔ Clamp and Linear Interpolation passed');
}

// Test 2: MapRange and Smoothstep
{
  // Map 50 from range [0, 100] to [-1, 1]
  const mapped = mapRange(50, 0, 100, -1, 1);
  assert.equal(mapped, 0);

  const mappedEnd = mapRange(100, 0, 100, -1, 1);
  assert.equal(mappedEnd, 1);

  const smooth = smoothstep(0, 100, 50);
  assert.equal(smooth, 0.5);
  console.log('  ✔ Range mapping & Hermite smoothstep passed');
}
