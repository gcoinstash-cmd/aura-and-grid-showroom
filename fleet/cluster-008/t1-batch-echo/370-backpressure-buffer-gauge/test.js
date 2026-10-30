import assert from 'node:assert/strict';
import { BackpressureGauge } from './engine.js';

console.log('⚡ [Unit #370 Test Suite] Testing Backpressure Gauge...');

// Test 1: High and low watermark transitions
{
  const gauge = new BackpressureGauge({ highWatermark: 5, lowWatermark: 2 });
  
  // Fill up to high watermark
  for (let i = 0; i < 4; i++) {
    const res = gauge.push({ id: i });
    assert.equal(res.isPaused, false);
  }
  const tripRes = gauge.push({ id: 4 });
  assert.equal(tripRes.isPaused, true);
  assert.equal(tripRes.pausedNow, true);

  // Drain down to low watermark
  gauge.shift(); // 4 left (paused)
  gauge.shift(); // 3 left (paused)
  const resumeRes = gauge.shift(); // 2 left (resumed!)
  assert.equal(resumeRes.isPaused, false);
  assert.equal(resumeRes.resumedNow, true);
  console.log('  ✔ Watermark tripping and backpressure recovery verified');
}
