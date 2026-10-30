import assert from 'node:assert/strict';
import { sampleMicroBench, formatDurationNs } from './engine.js';

console.log('⚡ [Unit #349 Test Suite] Testing Micro-Bench Execution Clock Sampler...');

// Test 1: Benchmarking simple math
{
  const result = sampleMicroBench(() => Math.sin(0.42) * Math.cos(0.88), {
    warmupIterations: 50,
    sampleIterations: 200
  });

  assert.equal(result.iterations, 200);
  assert.ok(result.meanNs >= 0);
  assert.ok(result.opsPerSec > 0);
  console.log('  ✔ Benchmark timing loop verified (' + formatDurationNs(result.meanNs) + ')');
}
