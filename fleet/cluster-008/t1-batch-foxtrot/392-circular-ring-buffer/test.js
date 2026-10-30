import assert from 'node:assert/strict';
import { CircularRingBuffer } from './engine.js';

console.log('⚡ [Unit #392 Test Suite] Testing Circular Ring Buffer...');

// Test 1: Capacity overrun & FIFO order
{
  const ring = new CircularRingBuffer(3);
  ring.push(1);
  ring.push(2);
  ring.push(3);
  assert.equal(ring.isFull(), true);

  const dropped = ring.push(4);
  assert.equal(dropped, 1);
  assert.deepEqual(ring.toArray(), [2, 3, 4]);

  assert.equal(ring.shift(), 2);
  assert.equal(ring.shift(), 3);
  assert.equal(ring.shift(), 4);
  assert.equal(ring.isEmpty(), true);
  console.log('  ✔ Cyclic overwrite and FIFO retrieval passed');
}
