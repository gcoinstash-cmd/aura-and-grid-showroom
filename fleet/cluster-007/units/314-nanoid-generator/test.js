import assert from 'node:assert/strict';
import {
  nanoid,
  customAlphabet,
  generateTelemetryId,
  isValidId,
  URL_SAFE_ALPHABET,
  benchmarkNanoid
} from './engine.js';

console.log('⚡ [Unit #314 Test Suite] Initiating verification sequence...');

// Test 1: Standard ID Generation & Size
{
  const id21 = nanoid();
  assert.equal(id21.length, 21);
  assert.equal(isValidId(id21, 21), true);

  const id10 = nanoid(10);
  assert.equal(id10.length, 10);
  assert.equal(isValidId(id10, 10), true);
  console.log('  ✔ Standard nanoid length & validation passed');
}

// Test 2: Custom Alphabet Generator
{
  const numericId = customAlphabet('0123456789', 8);
  const code = numericId();
  assert.equal(code.length, 8);
  assert.ok(/^[0-9]{8}$/.test(code));
  console.log('  ✔ customAlphabet passed');
}

// Test 3: Telemetry ID Generator
{
  const telId = generateTelemetryId('GF_TEL', 12);
  assert.ok(telId.startsWith('GF_TEL_'));
  assert.equal(telId.length, 7 + 12);
  console.log('  ✔ generateTelemetryId passed');
}

// Test 4: Uniqueness and Collision Avoidance
{
  const set = new Set();
  const count = 5000;
  for (let i = 0; i < count; i++) {
    const id = nanoid(16);
    assert.equal(set.has(id), false);
    set.add(id);
  }
  assert.equal(set.size, count);
  console.log(`  ✔ Collision test passed (${count} unique IDs verified)`);
}

// Test 5: Benchmark
{
  const bench = benchmarkNanoid(1000);
  assert.ok(bench.opsPerSec > 20000, `Throughput was ${bench.opsPerSec} ops/sec`);
  console.log(`  ✔ benchmarkNanoid passed (${bench.opsPerSec} IDs/sec, latency: ${bench.avgLatencyUs} µs)`);
}

console.log('🏁 [Unit #314 Test Suite] ALL CHECKS 100% GREEN.\n');
