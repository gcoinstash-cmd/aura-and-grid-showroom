import assert from 'node:assert/strict';
import { generateUuidV7, getTimestampFromUuidV7 } from './engine.js';

console.log('⚡ [Unit #362 Test Suite] Testing UUID v7 Generator...');

// Test 1: Generate & Validate Version
{
  const id1 = generateUuidV7();
  const id2 = generateUuidV7();
  assert.equal(id1.charAt(14), '7');
  assert.ok(id1 < id2);

  const ts = getTimestampFromUuidV7(id1);
  assert.ok(Math.abs(Date.now() - ts) < 5000);
  console.log('  ✔ RFC 9562 time-ordered UUID v7 verified: ' + id1);
}
