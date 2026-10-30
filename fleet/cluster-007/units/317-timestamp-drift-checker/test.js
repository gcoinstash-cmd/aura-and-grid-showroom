import assert from 'node:assert/strict';
import {
  normalizeIsoTimestamp,
  measureClockDrift,
  formatDuration,
  benchmarkTimestampEngine
} from './engine.js';

console.log('⚡ [Unit #317 Test Suite] Initiating verification sequence...');

// Test 1: Timestamp Normalization across Formats
{
  const iso = normalizeIsoTimestamp('2026-10-30T12:00:00.000Z');
  assert.equal(iso.valid, true);
  assert.equal(iso.isoUtc, '2026-10-30T12:00:00.000Z');

  const sec = normalizeIsoTimestamp(1793361600); // 10-digit seconds
  assert.equal(sec.epochMs, 1793361600000);

  const ms = normalizeIsoTimestamp(1793361600000); // 13-digit ms
  assert.equal(ms.epochMs, 1793361600000);

  const invalid = normalizeIsoTimestamp('corrupted-date-xyz');
  assert.equal(invalid.valid, false);
  assert.ok(invalid.epochMs > 0);
  console.log('  ✔ normalizeIsoTimestamp passed');
}

// Test 2: Clock Drift & Severity Evaluation
{
  const local = 1793388000000;

  // In sync (<10ms)
  const inSync = measureClockDrift(local + 5, local);
  assert.equal(inSync.skewDirection, 'IN_SYNC');
  assert.equal(inSync.severity, 'NORMAL');

  // Ahead with warning (>500ms)
  const ahead = measureClockDrift(local + 750, local);
  assert.equal(ahead.skewDirection, 'AHEAD');
  assert.equal(ahead.severity, 'WARNING');

  // Behind with critical (>2000ms)
  const behind = measureClockDrift(local - 3500, local);
  assert.equal(behind.skewDirection, 'BEHIND');
  assert.equal(behind.severity, 'CRITICAL');
  console.log('  ✔ measureClockDrift passed');
}

// Test 3: formatDuration Formatter
{
  assert.equal(formatDuration(450), '450ms');
  assert.equal(formatDuration(15000), '15s');
  assert.equal(formatDuration(65000), '1m 5s');
  assert.equal(formatDuration(3665000), '1h 1m 5s');
  console.log('  ✔ formatDuration passed');
}

// Test 4: Benchmark
{
  const bench = benchmarkTimestampEngine(1000);
  assert.ok(bench.opsPerSec > 20000, `Throughput was ${bench.opsPerSec} ops/sec`);
  console.log(`  ✔ benchmarkTimestampEngine passed (${bench.opsPerSec} ops/sec, latency: ${bench.avgLatencyUs} µs)`);
}

console.log('🏁 [Unit #317 Test Suite] ALL CHECKS 100% GREEN.\n');
