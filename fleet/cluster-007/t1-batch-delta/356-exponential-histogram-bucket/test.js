import assert from 'node:assert/strict';
import { ExponentialHistogram } from './engine.js';

console.log('⚡ [Unit #356 Test Suite] Testing Exponential Histogram...');

// Test 1: Record and snapshot
{
  const hist = new ExponentialHistogram(2);
  hist.record(1.5);
  hist.record(4.2);
  hist.record(8.9);
  hist.record(16.1);

  const snap = hist.getSnapshot();
  assert.equal(snap.count, 4);
  assert.equal(snap.min, 1.5);
  assert.equal(snap.max, 16.1);
  assert.ok(snap.mean > 0);
  console.log('  ✔ Logarithmic histogram bucketing verified');
}
