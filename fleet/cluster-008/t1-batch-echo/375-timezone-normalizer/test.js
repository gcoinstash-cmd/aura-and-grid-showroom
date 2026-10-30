import assert from 'node:assert/strict';
import { normalizeToUtc, extractTimezoneOffsetMinutes, formatWithCustomOffset } from './engine.js';

console.log('⚡ [Unit #375 Test Suite] Testing Timezone Normalizer...');

// Test 1: Normalize with offset to UTC
{
  const input = '2026-10-30T10:00:00+02:00';
  const utc = normalizeToUtc(input);
  assert.equal(utc, '2026-10-30T08:00:00.000Z');

  const offset = extractTimezoneOffsetMinutes(input);
  assert.equal(offset, 120);

  const custom = formatWithCustomOffset('2026-10-30T08:00:00.000Z', 120);
  assert.equal(custom, '2026-10-30T10:00:00.000+02:00');
  console.log('  ✔ UTC normalization & custom offset formatting verified');
}
