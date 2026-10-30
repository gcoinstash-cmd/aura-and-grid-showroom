import assert from 'node:assert/strict';
import { hexToRgb, rgbToHex, rgbToHsl, rgbToLab } from './engine.js';

console.log('⚡ [Unit #385 Test Suite] Testing Color Space Converter...');

// Test 1: HEX to RGB and roundtrip
{
  const cyberAmber = '#FF9F0A';
  const rgb = hexToRgb(cyberAmber);
  assert.deepEqual(rgb, { r: 255, g: 159, b: 10 });
  assert.equal(rgbToHex(rgb.r, rgb.g, rgb.b), cyberAmber);
  console.log('  ✔ HEX <-> RGB roundtrip verified');
}

// Test 2: RGB to HSL and LAB
{
  const hsl = rgbToHsl(255, 159, 10);
  assert.equal(hsl.h, 36);
  assert.equal(hsl.s, 100);
  assert.equal(hsl.l, 52);

  const lab = rgbToLab(255, 159, 10);
  assert.ok(lab.L > 70 && lab.L < 75);
  assert.ok(lab.a > 25 && lab.a < 35);
  console.log('  ✔ HSL and CIE-L*a*b* space conversions verified');
}
