import assert from 'node:assert/strict';
import {
  LruCache,
  benchmarkLruCache,
  CacheError
} from './engine.js';

console.log('⚡ [Unit #318 Test Suite] Initiating verification sequence...');

// Test 1: Basic Set, Get, Has
{
  const cache = new LruCache(3);
  cache.set('a', 1);
  cache.set('b', 2);
  cache.set('c', 3);

  assert.equal(cache.get('a'), 1);
  assert.equal(cache.get('b'), 2);
  assert.equal(cache.has('c'), true);
  assert.equal(cache.has('non_existent'), false);
  console.log('  ✔ Basic Set, Get, Has passed');
}

// Test 2: LRU Eviction Order
{
  const evicted = [];
  const cache = new LruCache(3, 0, (k, v, r) => evicted.push({ k, v, r }));

  cache.set('item1', 'v1');
  cache.set('item2', 'v2');
  cache.set('item3', 'v3');

  // Touch item1 so it becomes recently used: Order is now item2 (oldest), item3, item1
  cache.get('item1');

  // Inserting item4 should evict item2
  cache.set('item4', 'v4');

  assert.equal(cache.has('item2'), false);
  assert.equal(cache.has('item1'), true);
  assert.equal(cache.has('item3'), true);
  assert.equal(cache.has('item4'), true);
  assert.equal(evicted.length, 1);
  assert.equal(evicted[0].k, 'item2');
  console.log('  ✔ LRU Eviction Order passed');
}

// Test 3: TTL Expiration
{
  const cache = new LruCache(10);
  cache.set('fast_expire', 'quick', 20); // 20ms TTL

  assert.equal(cache.get('fast_expire'), 'quick');

  await new Promise(r => setTimeout(r, 30));

  assert.equal(cache.get('fast_expire'), undefined);
  assert.equal(cache.has('fast_expire'), false);
  console.log('  ✔ TTL Expiration passed');
}

// Test 4: Telemetry Stats & Hit Rate
{
  const cache = new LruCache(5);
  cache.set('k1', 10);
  cache.get('k1'); // hit
  cache.get('k1'); // hit
  cache.get('k2'); // miss

  const stats = cache.getTelemetry();
  assert.equal(stats.hits, 2);
  assert.equal(stats.misses, 1);
  assert.equal(stats.hitRatePct, 66.67);
  console.log('  ✔ Telemetry Stats passed');
}

// Test 5: Benchmark
{
  const bench = benchmarkLruCache(1000);
  assert.ok(bench.opsPerSec > 50000, `Throughput was ${bench.opsPerSec} ops/sec`);
  console.log(`  ✔ benchmarkLruCache passed (${bench.opsPerSec} ops/sec, latency: ${bench.avgLatencyUs} µs)`);
}

console.log('🏁 [Unit #318 Test Suite] ALL CHECKS 100% GREEN.\n');
