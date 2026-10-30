import assert from 'node:assert/strict';
import { canonicalizeQuery } from './engine.js';

console.log('⚡ [Unit #396 Test Suite] Testing Canonical Query String Sorter...');

// Test 1: Out-of-order query string
{
  const qs = 'z=1&a=hello%20world&m=test&a=alpha';
  const canonical = canonicalizeQuery(qs);
  assert.equal(canonical, 'a=alpha&a=hello%20world&m=test&z=1');
  console.log('  ✔ Lexicographical query string sorting verified');
}

// Test 2: Object input with arrays
{
  const obj = { gamma: 3, beta: ['two', 'one'], alpha: 'first' };
  const canonical = canonicalizeQuery(obj);
  assert.equal(canonical, 'alpha=first&beta=one&beta=two&gamma=3');
  console.log('  ✔ Object canonicalization with multi-value keys verified');
}
