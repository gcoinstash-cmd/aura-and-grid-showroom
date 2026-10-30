import assert from 'node:assert/strict';
import { deepClone } from './engine.js';

console.log('⚡ [Unit #380 Test Suite] Testing Deep Clone Engine...');

// Test 1: Complex object with circular reference and nested structures
{
  const original = {
    name: 'Aura-Fleet-Telemetry',
    timestamp: new Date('2026-10-30T14:00:00Z'),
    regex: /telemetry-\d+/gi,
    buffer: Buffer.from('binary-payload'),
    map: new Map([['key1', 'val1']]),
    set: new Set([1, 2, 3]),
    nested: { a: 100 }
  };
  // Circular ref
  original.self = original;

  const cloned = deepClone(original);
  assert.notEqual(cloned, original);
  assert.notEqual(cloned.nested, original.nested);
  assert.equal(cloned.self, cloned);
  assert.equal(cloned.timestamp.getTime(), original.timestamp.getTime());
  assert.equal(cloned.buffer.toString(), 'binary-payload');
  assert.equal(cloned.map.get('key1'), 'val1');
  assert.ok(cloned.set.has(3));
  console.log('  ✔ Deep cloning with circular references and binary types passed');
}
