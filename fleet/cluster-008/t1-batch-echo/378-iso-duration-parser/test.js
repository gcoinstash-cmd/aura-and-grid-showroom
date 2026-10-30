import assert from 'node:assert/strict';
import { parseIsoDuration, durationToMilliseconds, formatMillisecondsToIsoDuration } from './engine.js';

console.log('⚡ [Unit #378 Test Suite] Testing ISO Duration Parser...');

// Test 1: Parse and convert to milliseconds
{
  const dur = 'PT1H30M';
  const parsed = parseIsoDuration(dur);
  assert.equal(parsed.hours, 1);
  assert.equal(parsed.minutes, 30);

  const ms = durationToMilliseconds(dur);
  assert.equal(ms, 5400000);

  const formatted = formatMillisecondsToIsoDuration(5400000);
  assert.equal(formatted, 'PT1H30M');
  console.log('  ✔ ISO 8601 duration parsing & ms roundtrip verified');
}
