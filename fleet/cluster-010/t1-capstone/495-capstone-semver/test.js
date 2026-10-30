import assert from 'node:assert/strict';
import { SemverParser } from './engine.js';

console.log('⚡ [Unit #495 Test Suite] Testing Loose Semver Parser & Lockfile Matcher...');

// Test 1: Parsing variations
{
  const v1 = SemverParser.parse('v2.14.0-rc.3+sha.123');
  assert.equal(v1.major, 2);
  assert.equal(v1.minor, 14);
  assert.equal(v1.patch, 0);
  assert.equal(v1.prerelease, 'rc.3');
  assert.equal(v1.build, 'sha.123');

  const loose = SemverParser.parse('3');
  assert.equal(loose.major, 3);
  assert.equal(loose.minor, 0);
  assert.equal(loose.patch, 0);
  console.log('  ✔ Standard and loose semver parser validated');
}

// Test 2: Precedence & Comparisons
{
  assert.equal(SemverParser.compare('1.2.3', '1.2.4'), -1);
  assert.equal(SemverParser.compare('2.0.0', '1.99.99'), 1);
  assert.equal(SemverParser.compare('1.0.0-beta.1', '1.0.0'), -1); // Prerelease is lower than release
  assert.equal(SemverParser.compare('v1.5.0', '1.5.0'), 0);
  console.log('  ✔ Precedence comparison rules verified');
}

// Test 3: Range satisfaction (^, ~, >=, <=)
{
  assert.equal(SemverParser.satisfies('1.5.4', '^1.2.0'), true);
  assert.equal(SemverParser.satisfies('2.0.0', '^1.2.0'), false);
  assert.equal(SemverParser.satisfies('1.2.9', '~1.2.0'), true);
  assert.equal(SemverParser.satisfies('1.3.0', '~1.2.0'), false);
  assert.equal(SemverParser.satisfies('2.5.0', '>= 2.0.0 < 3.0.0'), true);
  assert.equal(SemverParser.satisfies('3.0.0', '>= 2.0.0 < 3.0.0'), false);
  console.log('  ✔ Caret, tilde, and compound range satisfaction verified');
}

// Test 4: Lockfile matrix matcher
{
  const deps = {
    'react': '^19.0.0',
    'fast-bloom': '~2.1.0',
    'missing-dep': '^1.0.0'
  };
  const lock = {
    'react': { version: '19.0.2' },
    'fast-bloom': { version: '2.1.4' }
  };
  const matrix = SemverParser.matchLockfileMatrix(deps, lock);
  assert.equal(matrix.length, 3);
  assert.equal(matrix[0].satisfies, true);
  assert.equal(matrix[1].satisfies, true);
  assert.equal(matrix[2].satisfies, false);
  console.log('  ✔ Lockfile dependency matrix auditor verified');
}

console.log('✅ Unit #495: All tests passed 100% green.');
