import assert from 'node:assert/strict';
import { JsonChunkAccumulator } from './engine.js';

console.log('⚡ [Unit #399 Test Suite] Testing JSON Chunk Accumulator...');

// Test 1: Fragmented JSON chunks
{
  const acc = new JsonChunkAccumulator();
  const chunk1 = '{"telemetry": "start", "payl';
  const chunk2 = 'oad": [1, 2, 3]} {"next": true} trailing';

  const res1 = acc.feed(chunk1);
  assert.equal(res1.length, 0);

  const res2 = acc.feed(chunk2);
  assert.equal(res2.length, 2);
  assert.deepEqual(res2[0], { telemetry: 'start', payload: [1, 2, 3] });
  assert.deepEqual(res2[1], { next: true });
  console.log('  ✔ Stream chunk balancing & multi-object parsing passed');
}
