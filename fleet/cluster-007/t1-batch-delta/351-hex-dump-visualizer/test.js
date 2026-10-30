import assert from 'node:assert/strict';
import { formatHexDump } from './engine.js';

console.log('⚡ [Unit #351 Test Suite] Testing Hex Dump Formatter...');

// Test 1: Simple string dump
{
  const dump = formatHexDump('Aura & Grid Telemetry');
  assert.ok(dump.includes('00000000:'));
  assert.ok(dump.includes('|Aura & Grid Tele|'));
  assert.ok(dump.includes('|metry|'));
  console.log('  ✔ Hex dump 16-byte alignment verified');
}
