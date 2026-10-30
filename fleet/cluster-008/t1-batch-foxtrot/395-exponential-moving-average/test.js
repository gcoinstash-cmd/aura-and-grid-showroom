import assert from 'node:assert/strict';
import { ExponentialMovingAverage } from './engine.js';

console.log('⚡ [Unit #395 Test Suite] Testing EMA Smoother...');

// Test 1: Smoothing response
{
  const filter = new ExponentialMovingAverage({ alpha: 0.5 });
  assert.equal(filter.push(10), 10);
  assert.equal(filter.push(20), 15); // 0.5 * 20 + 0.5 * 10 = 15
  assert.equal(filter.push(20), 17.5);
  console.log('  ✔ EMA attenuation and recursive convergence passed');
}
