import assert from 'node:assert/strict';
import { toBaseUnits, fromBaseUnits, formatCurrency } from './engine.js';

console.log('⚡ [Unit #361 Test Suite] Testing Precision Formatter...');

// Test 1: Bitcoin Satoshi Precision (8 Decimals)
{
  const btc = '1.00000005';
  const sats = toBaseUnits(btc, 8);
  assert.equal(sats, 100000005n);
  assert.equal(fromBaseUnits(sats, 8), '1.00000005');
  assert.equal(formatCurrency(sats, 8, '₿'), '₿1.00000005');
  console.log('  ✔ Zero-float BigInt satoshi math verified');
}
