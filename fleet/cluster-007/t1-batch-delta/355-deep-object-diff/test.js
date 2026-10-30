import assert from 'node:assert/strict';
import { diffObjects, hasDifferences } from './engine.js';

console.log('⚡ [Unit #355 Test Suite] Testing Deep Object Diff Engine...');

// Test 1: Recursive Diff
{
  const o1 = { user: { name: 'Alice', age: 30, roles: ['admin'] } };
  const o2 = { user: { name: 'Alice', age: 31, roles: ['admin', 'dev'] } };

  const diffs = diffObjects(o1, o2);
  assert.equal(diffs.length, 2);
  assert.equal(diffs.find(d => d.path === 'user.age').type, 'UPDATED');
  assert.equal(hasDifferences(o1, o2), true);
  console.log('  ✔ Recursive delta path extraction passed');
}
