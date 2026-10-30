import assert from 'node:assert/strict';
import { calculatePercentile, calculateLatencySummary } from './engine.js';

console.log('⚡ [Unit #393 Test Suite] Testing Percentile Quantile Calculator...');

// Test 1: Known 100-sample distribution
{
  const samples = Array.from({ length: 100 }, (_, i) => i + 1); // 1 to 100
  assert.equal(calculatePercentile(samples, 50), 50.5);
  assert.equal(calculatePercentile(samples, 90), 90.1);
  assert.equal(calculatePercentile(samples, 99), 99.01);

  const summary = calculateLatencySummary(samples);
  assert.equal(summary.count, 100);
  assert.equal(summary.min, 1);
  assert.equal(summary.max, 100);
  assert.equal(summary.mean, 50.5);
  console.log('  ✔ SLA percentiles (P50, P90, P99) and metrics verified');
}
