import assert from 'node:assert/strict';
import { BitmaskFlags } from './engine.js';

console.log('⚡ [Unit #384 Test Suite] Testing Bitmask Flags Calculator...');

// Test 1: Flag operations
{
  const flags = new BitmaskFlags({
    READ: 1 << 0,
    WRITE: 1 << 1,
    EXECUTE: 1 << 2,
    ADMIN: 1 << 3
  });

  let mask = flags.fromList(['READ', 'WRITE']);
  assert.equal(flags.has(mask, 'READ'), true);
  assert.equal(flags.has(mask, 'WRITE'), true);
  assert.equal(flags.has(mask, 'EXECUTE'), false);

  mask = flags.add(mask, 'EXECUTE');
  assert.equal(flags.has(mask, 'EXECUTE'), true);

  mask = flags.remove(mask, 'READ');
  assert.equal(flags.has(mask, 'READ'), false);

  assert.deepEqual(flags.toList(mask).sort(), ['EXECUTE', 'WRITE'].sort());
  console.log('  ✔ Bitwise mask add/remove/list operations passed');
}
