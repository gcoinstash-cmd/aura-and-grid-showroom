import assert from 'node:assert/strict';
import { escapeXml, unescapeXml, stripXmlTags } from './engine.js';

console.log('⚡ [Unit #387 Test Suite] Testing XML Entity Escaper...');

// Test 1: Escape & Unescape
{
  const raw = '<telemetry id="GF-01" label="AT&T & Co.">Safe & Sound</telemetry>';
  const escaped = escapeXml(raw);
  assert.ok(!escaped.includes('<telemetry'));
  assert.ok(escaped.includes('&lt;telemetry'));
  assert.ok(escaped.includes('&amp;'));

  const unescaped = unescapeXml(escaped);
  assert.equal(unescaped, raw);
  console.log('  ✔ XML entity escaping and unescaping roundtrip passed');
}

// Test 2: Numerical entities and tag stripping
{
  const withEntities = 'Price: &#36;14,500 &#x26; <b>Discount</b>';
  const unescaped = unescapeXml(withEntities);
  assert.ok(unescaped.includes('$14,500 & <b>Discount</b>'));
  assert.equal(stripXmlTags(unescaped), 'Price: $14,500 & Discount');
  console.log('  ✔ Numerical entity decoding and XML tag stripping passed');
}
