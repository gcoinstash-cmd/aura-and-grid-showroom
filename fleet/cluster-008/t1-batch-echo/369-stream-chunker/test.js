import assert from 'node:assert/strict';
import { chunkBuffer, chunkByDelimiter } from './engine.js';

console.log('⚡ [Unit #369 Test Suite] Testing Stream Chunker...');

// Test 1: Fixed-size buffer chunking
{
  const buf = Buffer.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'utf8');
  const chunks = chunkBuffer(buf, 10);
  assert.equal(chunks.length, 3);
  assert.equal(chunks[0].toString('utf8'), 'ABCDEFGHIJ');
  assert.equal(chunks[1].toString('utf8'), 'KLMNOPQRST');
  assert.equal(chunks[2].toString('utf8'), 'UVWXYZ');
  console.log('  ✔ Fixed-size buffer chunking passed');
}

// Test 2: Delimiter chunking
{
  const buf = Buffer.from('packet1||packet2||packet3', 'utf8');
  const chunks = chunkByDelimiter(buf, '||');
  assert.equal(chunks.length, 3);
  assert.equal(chunks[0].toString('utf8'), 'packet1');
  assert.equal(chunks[1].toString('utf8'), 'packet2');
  assert.equal(chunks[2].toString('utf8'), 'packet3');
  console.log('  ✔ Delimiter chunking passed');
}
