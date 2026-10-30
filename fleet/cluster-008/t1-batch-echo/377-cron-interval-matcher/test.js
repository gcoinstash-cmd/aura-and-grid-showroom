import assert from 'node:assert/strict';
import { matchesCron, getNextCronRun } from './engine.js';

console.log('⚡ [Unit #377 Test Suite] Testing Cron Interval Matcher...');

// Test 1: Match every 5 minutes
{
  const d1 = new Date('2026-10-30T14:15:00');
  const d2 = new Date('2026-10-30T14:16:00');

  assert.equal(matchesCron('*/5 * * * *', d1), true);
  assert.equal(matchesCron('*/5 * * * *', d2), false);
  console.log('  ✔ Step-based cron matching passed');
}

// Test 2: Next cron run estimator
{
  const start = new Date('2026-10-30T14:11:00');
  const next = getNextCronRun('*/5 * * * *', start);
  assert.equal(next.getMinutes(), 15);
  console.log('  ✔ Next cron execution projection verified');
}
