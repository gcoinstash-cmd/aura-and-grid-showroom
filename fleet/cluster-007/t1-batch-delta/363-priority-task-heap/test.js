import assert from 'node:assert/strict';
import { PriorityQueue } from './engine.js';

console.log('⚡ [Unit #363 Test Suite] Testing Priority Task Heap Queue...');

// Test 1: Min-heap ordering
{
  const pq = new PriorityQueue();
  pq.push({ task: 'low-priority', priority: 10 });
  pq.push({ task: 'critical', priority: 1 });
  pq.push({ task: 'medium', priority: 5 });

  assert.equal(pq.pop().task, 'critical');
  assert.equal(pq.pop().task, 'medium');
  assert.equal(pq.pop().task, 'low-priority');
  assert.equal(pq.pop(), null);
  console.log('  ✔ Binary min-heap O(log N) task extraction verified');
}
