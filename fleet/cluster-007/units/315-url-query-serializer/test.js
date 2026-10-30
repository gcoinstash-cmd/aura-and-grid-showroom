import assert from 'node:assert/strict';
import {
  stringifyQuery,
  parseQuery,
  mergeQuery,
  benchmarkQueryEngine
} from './engine.js';

console.log('⚡ [Unit #315 Test Suite] Initiating verification sequence...');

// Test 1: Basic Serialization and Parsing
{
  const obj = { cluster: '007', rpm: 6500, active: true };
  const str = stringifyQuery(obj);
  assert.equal(str, 'active=true&cluster=007&rpm=6500');

  const parsed = parseQuery(str);
  assert.equal(parsed.cluster, '007');
  assert.equal(parsed.rpm, 6500);
  assert.equal(parsed.active, true);
  console.log('  ✔ Basic stringifyQuery & parseQuery passed');
}

// Test 2: Array Formats (bracket, comma, repeat)
{
  const obj = { tags: ['tuner', 'lean'] };

  const bracketStr = stringifyQuery(obj, { arrayFormat: 'bracket' });
  assert.equal(bracketStr, 'tags%5B%5D=tuner&tags%5B%5D=lean');
  assert.deepEqual(parseQuery(bracketStr), { tags: ['tuner', 'lean'] });

  const commaStr = stringifyQuery(obj, { arrayFormat: 'comma' });
  assert.equal(commaStr, 'tags=tuner,lean');

  const repeatStr = stringifyQuery(obj, { arrayFormat: 'repeat' });
  assert.equal(repeatStr, 'tags=tuner&tags=lean');
  assert.deepEqual(parseQuery(repeatStr), { tags: ['tuner', 'lean'] });
  console.log('  ✔ Array formats passed');
}

// Test 3: Nested Objects
{
  const nested = { filter: { sector: 'powertrain', limit: 10 } };
  const str = stringifyQuery(nested);
  assert.ok(str.includes('filter%5Bsector%5D=powertrain'));
  assert.ok(str.includes('filter%5Blimit%5D=10'));

  const parsed = parseQuery(str);
  assert.equal(parsed.filter.sector, 'powertrain');
  assert.equal(parsed.filter.limit, 10);
  console.log('  ✔ Nested object serialization & parsing passed');
}

// Test 4: mergeQuery
{
  const url = 'https://auraandgrid.com/api/telemetry?cluster=007&tier=T1';
  const updated = mergeQuery(url, { tier: 'T2', limit: 50 });
  assert.equal(updated, 'https://auraandgrid.com/api/telemetry?cluster=007&limit=50&tier=T2');
  console.log('  ✔ mergeQuery passed');
}

// Test 5: Benchmark
{
  const bench = benchmarkQueryEngine(1000);
  assert.ok(bench.opsPerSec > 20000, `Throughput was ${bench.opsPerSec} ops/sec`);
  console.log(`  ✔ benchmarkQueryEngine passed (${bench.opsPerSec} ops/sec, latency: ${bench.avgLatencyUs} µs)`);
}

console.log('🏁 [Unit #315 Test Suite] ALL CHECKS 100% GREEN.\n');
