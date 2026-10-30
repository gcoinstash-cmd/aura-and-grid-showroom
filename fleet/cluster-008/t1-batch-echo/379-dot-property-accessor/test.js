import assert from 'node:assert/strict';
import { get, set, has } from './engine.js';

console.log('⚡ [Unit #379 Test Suite] Testing Dot-Notation Property Accessor...');

// Test 1: Get & Default value
{
  const obj = { telemetry: { cluster: { nodes: [{ id: 'NODE-01', load: 0.42 }] } } };
  assert.equal(get(obj, 'telemetry.cluster.nodes[0].id'), 'NODE-01');
  assert.equal(get(obj, 'telemetry.cluster.nodes[0].load'), 0.42);
  assert.equal(get(obj, 'telemetry.cluster.nodes[99].id', 'UNKNOWN'), 'UNKNOWN');
  assert.equal(has(obj, 'telemetry.cluster.nodes[0].id'), true);
  console.log('  ✔ Deep path retrieval & array index access passed');
}

// Test 2: Set & Prototype pollution guard
{
  const target = {};
  set(target, 'fleet.cluster[0].capacity', 102);
  assert.equal(target.fleet.cluster[0].capacity, 102);

  assert.throws(() => set(target, '__proto__.polluted', true), /Prototype pollution/);
  assert.equal(Object.prototype.polluted, undefined);
  console.log('  ✔ Deep path mutation & prototype security verified');
}
