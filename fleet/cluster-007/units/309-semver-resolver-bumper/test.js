import assert from 'node:assert/strict';
import {
  parseSemver,
  isValidSemver,
  compareSemver,
  satisfiesRange,
  bumpSemver,
  benchmarkSemver,
  SemverError
} from './engine.js';

console.log('⚡ [Unit #309 Test Suite] Initiating verification sequence...');

// Test 1: Parsing & Validation
{
  const v = parseSemver('v2.4.1-rc.2+exp.sha.5114f85');
  assert.equal(v.major, 2);
  assert.equal(v.minor, 4);
  assert.equal(v.patch, 1);
  assert.equal(v.prerelease, 'rc.2');
  assert.equal(v.build, 'exp.sha.5114f85');
  assert.equal(isValidSemver('1.0.0'), true);
  assert.equal(isValidSemver('invalid.ver'), false);
  assert.throws(() => parseSemver('not-a-ver'), SemverError);
  console.log('  ✔ parseSemver & isValidSemver passed');
}

// Test 2: Version Comparison Ordering
{
  assert.equal(compareSemver('1.0.0', '1.0.0'), 0);
  assert.equal(compareSemver('2.0.0', '1.9.9'), 1);
  assert.equal(compareSemver('1.2.3', '1.2.4'), -1);
  assert.equal(compareSemver('1.0.0', '1.0.0-alpha'), 1);
  assert.equal(compareSemver('1.0.0-alpha.1', '1.0.0-alpha.2'), -1);
  console.log('  ✔ compareSemver passed');
}

// Test 3: Range Matching (^, ~, >=, <=)
{
  assert.equal(satisfiesRange('1.2.5', '^1.2.0'), true);
  assert.equal(satisfiesRange('2.0.0', '^1.2.0'), false);
  assert.equal(satisfiesRange('1.2.5', '~1.2.0'), true);
  assert.equal(satisfiesRange('1.3.0', '~1.2.0'), false);
  assert.equal(satisfiesRange('2.4.0', '>=2.0.0'), true);
  console.log('  ✔ satisfiesRange passed');
}

// Test 4: Version Bumping
{
  assert.equal(bumpSemver('1.2.3', 'major'), '2.0.0');
  assert.equal(bumpSemver('1.2.3', 'minor'), '1.3.0');
  assert.equal(bumpSemver('1.2.3', 'patch'), '1.2.4');
  assert.equal(bumpSemver('1.2.3', 'prerelease', 'beta'), '1.2.4-beta.1');
  assert.equal(bumpSemver('1.2.4-beta.1', 'prerelease'), '1.2.4-beta.2');
  console.log('  ✔ bumpSemver passed');
}

// Test 5: Benchmark
{
  const bench = benchmarkSemver(1000);
  assert.ok(bench.opsPerSec > 10000, `Throughput was ${bench.opsPerSec} ops/sec`);
  console.log(`  ✔ benchmarkSemver passed (${bench.opsPerSec} ops/sec, latency: ${bench.avgLatencyUs} µs)`);
}

console.log('🏁 [Unit #309 Test Suite] ALL CHECKS 100% GREEN.\n');
