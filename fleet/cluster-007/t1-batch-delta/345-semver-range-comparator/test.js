import assert from 'node:assert/strict';
import { parseSemver, compareSemver, satisfiesRange, maxSatisfying } from './engine.js';

console.log('⚡ [Unit #345 Test Suite] Testing Semver Range Comparator...');

// Test 1: Parser
{
  const v = parseSemver('v2.14.7-beta.1+exp.sha.5114f85');
  assert.equal(v.major, 2);
  assert.equal(v.minor, 14);
  assert.equal(v.patch, 7);
  assert.equal(v.prerelease, 'beta.1');
  console.log('  ✔ Semver string parsed correctly');
}

// Test 2: Comparison
{
  assert.equal(compareSemver('1.2.3', '1.2.4'), -1);
  assert.equal(compareSemver('2.0.0', '1.9.9'), 1);
  assert.equal(compareSemver('3.4.5', '3.4.5'), 0);
  console.log('  ✔ Version comparisons accurate');
}

// Test 3: Caret & Tilde Range Saturation
{
  assert.equal(satisfiesRange('1.8.2', '^1.2.0'), true);
  assert.equal(satisfiesRange('2.0.0', '^1.2.0'), false);
  assert.equal(satisfiesRange('1.2.9', '~1.2.0'), true);
  assert.equal(satisfiesRange('1.3.0', '~1.2.0'), false);

  const pool = ['1.0.0', '1.2.4', '1.3.1', '2.0.0'];
  assert.equal(maxSatisfying(pool, '^1.2.0'), '1.3.1');
  console.log('  ✔ Range evaluation & maxSatisfying passed');
}
