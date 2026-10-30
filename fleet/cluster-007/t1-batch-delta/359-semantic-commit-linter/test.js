import assert from 'node:assert/strict';
import { lintCommitMessage, parseCommitParts } from './engine.js';

console.log('⚡ [Unit #359 Test Suite] Testing Semantic Commit Linter...');

// Test 1: Valid conventional commit
{
  const msg = 'feat(telemetry)!: add eBPF multi-cloud packet router';
  const res = lintCommitMessage(msg);
  assert.equal(res.valid, true);
  assert.equal(res.parsed.type, 'feat');
  assert.equal(res.parsed.scope, 'telemetry');
  assert.equal(res.parsed.isBreaking, true);
  console.log('  ✔ Conventional commit parsed with breaking change');
}

// Test 2: Invalid commit
{
  const bad = 'Updated some stuff in database';
  const res = lintCommitMessage(bad);
  assert.equal(res.valid, false);
  console.log('  ✔ Malformed commit rejected correctly');
}
