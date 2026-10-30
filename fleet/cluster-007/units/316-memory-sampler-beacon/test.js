import assert from 'node:assert/strict';
import {
  sampleMemory,
  formatBytes,
  MemoryTracker,
  assertMemoryBudget,
  benchmarkMemorySampler,
  MemoryThresholdError
} from './engine.js';

console.log('⚡ [Unit #316 Test Suite] Initiating verification sequence...');

// Test 1: Memory Sampling Structure
{
  const mem = sampleMemory();
  assert.ok(mem.rss_bytes > 0);
  assert.ok(mem.heap_used_bytes > 0);
  assert.ok(mem.rss_mb > 0);
  assert.ok(mem.timestamp_epoch_ms > 0);
  assert.ok(mem.timestamp_iso.includes('T'));
  console.log(`  ✔ sampleMemory passed (RSS: ${mem.rss_mb} MB, Heap Used: ${mem.heap_used_mb} MB)`);
}

// Test 2: formatBytes Formatter
{
  assert.equal(formatBytes(0), '0 B');
  assert.equal(formatBytes(1024), '1.00 KB');
  assert.equal(formatBytes(1024 * 1024 * 50), '50.00 MB');
  assert.equal(formatBytes(1024 * 1024 * 1024 * 2.5), '2.50 GB');
  console.log('  ✔ formatBytes passed');
}

// Test 3: MemoryTracker Snapshots & Deltas
{
  const tracker = new MemoryTracker();
  assert.equal(tracker.history.length, 1);

  // Allocate an array to simulate memory delta
  const arr = new Array(100000).fill('ghost-factory-os-telemetry');
  const snap = tracker.snapshot('post_allocation');

  assert.equal(tracker.history.length, 2);
  assert.equal(snap.label, 'post_allocation');
  assert.ok('deltaFromBaseline' in snap);
  assert.ok('deltaFromLast' in snap);

  // Prevent GC optimization
  assert.ok(arr.length > 0);
  console.log('  ✔ MemoryTracker snapshot & delta tracking passed');
}

// Test 4: Memory Budget Assertion
{
  assert.equal(assertMemoryBudget(10000), true); // 10GB threshold passes

  assert.throws(() => {
    assertMemoryBudget(0.01); // 0.01 MB threshold fails immediately
  }, MemoryThresholdError);
  console.log('  ✔ assertMemoryBudget passed');
}

// Test 5: Benchmark
{
  const bench = benchmarkMemorySampler(1000);
  assert.ok(bench.opsPerSec > 20000, `Throughput was ${bench.opsPerSec} ops/sec`);
  console.log(`  ✔ benchmarkMemorySampler passed (${bench.opsPerSec} ops/sec, latency: ${bench.avgLatencyUs} µs)`);
}

console.log('🏁 [Unit #316 Test Suite] ALL CHECKS 100% GREEN.\n');
