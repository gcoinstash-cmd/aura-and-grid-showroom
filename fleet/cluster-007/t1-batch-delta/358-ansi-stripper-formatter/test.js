import assert from 'node:assert/strict';
import { stripAnsi, hasAnsi, visualLength } from './engine.js';

console.log('⚡ [Unit #358 Test Suite] Testing ANSI Stripper...');

// Test 1: Strip color codes
{
  const colored = '\u001b[31mRED_ERROR\u001b[39m and \u001b[32mGREEN_OK\u001b[39m';
  assert.equal(hasAnsi(colored), true);
  assert.equal(stripAnsi(colored), 'RED_ERROR and GREEN_OK');
  assert.equal(visualLength(colored), 22);
  console.log('  ✔ Terminal ANSI color codes stripped cleanly');
}
