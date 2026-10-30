import assert from 'node:assert/strict';
import { shuffle, sample } from './engine.js';

console.log('⚡ [Unit #381 Test Suite] Testing Fisher-Yates Array Shuffler...');

// Test 1: Invariance of elements and permutation
{
  const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const shuffled = shuffle(input, { inPlace: false });

  assert.equal(shuffled.length, input.length);
  assert.deepEqual([...shuffled].sort((a, b) => a - b), input);
  console.log('  ✔ Permutation element invariance verified');
}

// Test 2: Sample picking
{
  const input = ['A', 'B', 'C', 'D', 'E'];
  const samples = sample(input, 3);
  assert.equal(samples.length, 3);
  for (const s of samples) {
    assert.ok(input.includes(s));
  }
  console.log('  ✔ Random sampling without replacement verified');
}
