import assert from 'node:assert/strict';
import { slugify, normalizeUtf8, stripInvisibleChars } from './engine.js';

console.log('⚡ [Unit #348 Test Suite] Testing Slugify & UTF-8 Normalizer...');

// Test 1: Diacritics & Accents
{
  const input = 'Crème Brûlée & Café au Lait!';
  assert.equal(slugify(input), 'creme-brulee-cafe-au-lait');
  console.log('  ✔ Accents converted & stripped cleanly');
}

// Test 2: Invisible homoglyphs & zero-width characters
{
  const malicious = 'admin\u200B\uFEFF-console';
  assert.equal(stripInvisibleChars(malicious), 'admin-console');
  assert.equal(slugify(malicious), 'admin-console');
  console.log('  ✔ Invisible unicode homoglyphs removed');
}
