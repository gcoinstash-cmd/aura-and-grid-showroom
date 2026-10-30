import assert from 'node:assert/strict';
import { parseCronExpression, matchesCron } from './engine.js';

console.log('⚡ [Unit #357 Test Suite] Testing Micro-Cron Engine...');

// Test 1: Pattern Matching
{
  const parsed = parseCronExpression('*/15 0-4 1,15 * 1-5');
  assert.equal(parsed.minutes.has(0), true);
  assert.equal(parsed.minutes.has(15), true);
  assert.equal(parsed.hours.has(2), true);
  assert.equal(parsed.daysOfMonth.has(15), true);
  console.log('  ✔ Cron 5-field expression parsing passed');
}
