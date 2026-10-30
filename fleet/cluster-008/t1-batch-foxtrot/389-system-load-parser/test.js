import assert from 'node:assert/strict';
import { parseLoadAvg } from './engine.js';

console.log('⚡ [Unit #389 Test Suite] Testing System Load Parser...');

// Test 1: Normalize load averages across cores
{
  const resNormal = parseLoadAvg([1.6, 1.2, 0.8], 4);
  assert.equal(resNormal.cpus, 4);
  assert.equal(resNormal.percentLoad['1m'], 40);
  assert.equal(resNormal.status, 'NORMAL');

  const resSaturated = parseLoadAvg([8.5, 6.0, 4.0], 8);
  assert.equal(resSaturated.status, 'SATURATED');
  assert.ok(resSaturated.saturationRatio['1m'] > 1.0);
  console.log('  ✔ Load average saturation ratios and status thresholds verified');
}
