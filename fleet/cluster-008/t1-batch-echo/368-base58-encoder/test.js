import assert from 'node:assert/strict';
import { encodeBase58, decodeBase58 } from './engine.js';

console.log('⚡ [Unit #368 Test Suite] Testing Base58 Encoder & Decoder...');

// Test 1: Standard known vectors
{
  const text = 'Hello World';
  const encoded = encodeBase58(Buffer.from(text, 'utf8'));
  assert.equal(encoded, 'JxF12TrwUP45BMd');
  const decoded = decodeBase58(encoded).toString('utf8');
  assert.equal(decoded, text);
  console.log('  ✔ Base58 encoding & decoding roundtrip verified');
}
