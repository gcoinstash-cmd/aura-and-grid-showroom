import assert from 'node:assert/strict';
import { parseSemver, comparePrerelease } from './engine.js';

console.log('⚡ [Unit #388 Test Suite] Testing Semver Pre-Release Extractor...');

// Test 1: Parse Pre-Release Details
{
  const parsed = parseSemver('v2.4.0-alpha.3+build.891');
  assert.equal(parsed.major, 2);
  assert.equal(parsed.minor, 4);
  assert.equal(parsed.patch, 0);
  assert.equal(parsed.channel, 'alpha');
  assert.equal(parsed.iteration, 3);
  assert.equal(parsed.isPrerelease, true);
  assert.equal(parsed.build, 'build.891');
  console.log('  ✔ Pre-release channel and iteration extraction passed');
}

// Test 2: Precedence comparison
{
  assert.equal(comparePrerelease('alpha', 'beta'), -1);
  assert.equal(comparePrerelease('alpha.1', 'alpha.2'), -1);
  assert.equal(comparePrerelease('beta.2', 'alpha.99'), 1);
  assert.equal(comparePrerelease(null, 'alpha.1'), 1); // 1.0.0 > 1.0.0-alpha.1
  console.log('  ✔ SemVer 2.0.0 pre-release precedence comparison passed');
}
