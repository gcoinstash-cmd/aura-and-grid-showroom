import assert from 'node:assert/strict';
import { parseContentType, sniffMimeType } from './engine.js';

console.log('⚡ [Unit #353 Test Suite] Testing Content-Type MIME Sniffer...');

// Test 1: Header parsing
{
  const res = parseContentType('application/json; charset=utf-8; boundary="frontier"');
  assert.equal(res.type, 'application/json');
  assert.equal(res.parameters.charset, 'utf-8');
  assert.equal(res.parameters.boundary, 'frontier');
  console.log('  ✔ RFC 7231 header parsed correctly');
}

// Test 2: Magic Byte Sniffing
{
  const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.equal(sniffMimeType(pngHeader), 'image/png');
  console.log('  ✔ Magic byte signature detected as image/png');
}
