import assert from 'node:assert/strict';
import { getPointer, setPointer } from './engine.js';

console.log('⚡ [Unit #386 Test Suite] Testing RFC 6901 JSON Pointer...');

// Test 1: Standard RFC 6901 retrieval
{
  const doc = {
    foo: ['bar', 'baz'],
    'm~n': 42,
    nested: { 'a/b': 'found' }
  };

  assert.equal(getPointer(doc, '/foo/0'), 'bar');
  assert.equal(getPointer(doc, '/foo/1'), 'baz');
  assert.equal(getPointer(doc, '/m~0n'), 42);
  assert.equal(getPointer(doc, '/nested/a~1b'), 'found');
  assert.equal(getPointer(doc, '/nonexistent', 'DEF'), 'DEF');
  console.log('  ✔ RFC 6901 unescaping and traversal passed');
}

// Test 2: Mutate via Pointer
{
  const doc = { items: [1, 2] };
  setPointer(doc, '/items/-', 3);
  assert.deepEqual(doc.items, [1, 2, 3]);
  setPointer(doc, '/items/1', 99);
  assert.deepEqual(doc.items, [1, 99, 3]);
  console.log('  ✔ RFC 6901 append and replacement mutation passed');
}
