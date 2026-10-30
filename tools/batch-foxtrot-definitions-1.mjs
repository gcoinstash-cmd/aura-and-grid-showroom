/**
 * Batch Foxtrot Definitions — Part 1: Units #384 to #389
 * Binary bitmask flags, Color space converter, JSON pointer (RFC 6901), XML entity escaper, Semver prerelease, System load parser
 */

export const PART_1_UNITS = [
  // UNIT #384: Binary Bitmask Flags Calculator & Permission Rig
  {
    num: 384,
    folder: '384-bitmask-flags-calculator',
    name: 'Binary Bitmask Flags Calculator & Permission Rig',
    tag: 'GF-T1-384',
    benchmark: '< 0.005ms bitmask manipulation',
    engineCode: `/**
 * Unit #384: Binary Bitmask Flags Calculator & Permission Rig
 * Track 1 (Lean Tuner) — High-Speed Bitwise Flag Engine
 */

export class BitmaskFlags {
  constructor(flagMap = {}) {
    this.flagMap = { ...flagMap };
    this.reverseMap = {};
    for (const [name, bit] of Object.entries(this.flagMap)) {
      this.reverseMap[bit] = name;
    }
  }

  has(mask, flagName) {
    const bit = this.flagMap[flagName];
    if (bit === undefined) return false;
    return (mask & bit) === bit;
  }

  add(mask, flagName) {
    const bit = this.flagMap[flagName];
    if (bit === undefined) throw new Error(\`Unknown flag '\${flagName}'\`);
    return mask | bit;
  }

  remove(mask, flagName) {
    const bit = this.flagMap[flagName];
    if (bit === undefined) throw new Error(\`Unknown flag '\${flagName}'\`);
    return mask & ~bit;
  }

  toggle(mask, flagName) {
    const bit = this.flagMap[flagName];
    if (bit === undefined) throw new Error(\`Unknown flag '\${flagName}'\`);
    return mask ^ bit;
  }

  toList(mask) {
    const active = [];
    for (const [name, bit] of Object.entries(this.flagMap)) {
      if ((mask & bit) === bit) {
        active.push(name);
      }
    }
    return active;
  }

  fromList(names) {
    let mask = 0;
    for (const name of names) {
      mask = this.add(mask, name);
    }
    return mask;
  }
}
`,
    testCode: `import assert from 'node:assert/strict';
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
`
  },

  // UNIT #385: Color Space Converter (HEX, RGB, HSL, LAB)
  {
    num: 385,
    folder: '385-color-space-converter',
    name: 'Color Space Converter (HEX, RGB, HSL, LAB)',
    tag: 'GF-T1-385',
    benchmark: '< 0.02ms color space conversion',
    engineCode: `/**
 * Unit #385: Color Space Converter (HEX, RGB, HSL, LAB)
 * Track 1 (Lean Tuner) — Multi-Space Color Deconstruction & Math Rig
 */

export function hexToRgb(hex) {
  let cleaned = hex.replace(/^#/, '');
  if (cleaned.length === 3) {
    cleaned = cleaned.split('').map(c => c + c).join('');
  }
  if (cleaned.length !== 6) {
    throw new Error(\`Invalid HEX color '\${hex}'\`);
  }
  const num = parseInt(cleaned, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

export function rgbToHex(r, g, b) {
  const clamp = v => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = v => clamp(v).toString(16).padStart(2, '0').toUpperCase();
  return \`#\${toHex(r)}\${toHex(g)}\${toHex(b)}\`;
}

export function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }

  return {
    h: Math.round(h),
    s: Number((s * 100).toFixed(1)),
    l: Number((l * 100).toFixed(1))
  };
}

export function rgbToLab(r, g, b) {
  // Convert RGB to XYZ (D65 standard)
  let varR = r / 255;
  let varG = g / 255;
  let varB = b / 255;

  varR = varR > 0.04045 ? Math.pow((varR + 0.055) / 1.055, 2.4) : varR / 12.92;
  varG = varG > 0.04045 ? Math.pow((varG + 0.055) / 1.055, 2.4) : varG / 12.92;
  varB = varB > 0.04045 ? Math.pow((varB + 0.055) / 1.055, 2.4) : varB / 12.92;

  varR *= 100;
  varG *= 100;
  varB *= 100;

  const x = varR * 0.4124 + varG * 0.3576 + varB * 0.1805;
  const y = varR * 0.2126 + varG * 0.7152 + varB * 0.0722;
  const z = varR * 0.0193 + varG * 0.1192 + varB * 0.9505;

  // D65 reference white
  const refX = 95.047;
  const refY = 100.000;
  const refZ = 108.883;

  let varX = x / refX;
  let varY = y / refY;
  let varZ = z / refZ;

  const f = t => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  varX = f(varX);
  varY = f(varY);
  varZ = f(varZ);

  return {
    L: Number((116 * varY - 16).toFixed(2)),
    a: Number((500 * (varX - varY)).toFixed(2)),
    b: Number((200 * (varY - varZ)).toFixed(2))
  };
}
`,
    testCode: `import assert from 'node:assert/strict';
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
`
  },

  // UNIT #386: JSON Pointer (RFC 6901) Evaluator & Mutator
  {
    num: 386,
    folder: '386-json-pointer-evaluator',
    name: 'JSON Pointer (RFC 6901) Evaluator & Mutator',
    tag: 'GF-T1-386',
    benchmark: '< 0.01ms RFC 6901 pointer evaluation',
    engineCode: `/**
 * Unit #386: JSON Pointer (RFC 6901) Evaluator & Mutator
 * Track 1 (Lean Tuner) — Strict RFC 6901 Pointer Implementation
 */

export function unescapeToken(token) {
  return token.replace(/~1/g, '/').replace(/~0/g, '~');
}

export function escapeToken(token) {
  return token.replace(/~/g, '~0').replace(/\\//g, '~1');
}

export function parsePointer(pointer) {
  if (pointer === '' || pointer === '/') return [];
  if (!pointer.startsWith('/')) {
    throw new Error(\`Invalid JSON Pointer '\${pointer}': must start with '/'\`);
  }
  return pointer.slice(1).split('/').map(unescapeToken);
}

export function getPointer(doc, pointer, defaultValue = undefined) {
  if (pointer === '') return doc;
  const tokens = parsePointer(pointer);
  let current = doc;

  for (const token of tokens) {
    if (current == null) return defaultValue;

    if (Array.isArray(current)) {
      if (token === '-') return defaultValue;
      const idx = parseInt(token, 10);
      if (String(idx) !== token || idx < 0 || idx >= current.length) {
        return defaultValue;
      }
      current = current[idx];
    } else if (typeof current === 'object') {
      if (!Object.prototype.hasOwnProperty.call(current, token)) {
        return defaultValue;
      }
      current = current[token];
    } else {
      return defaultValue;
    }
  }

  return current === undefined ? defaultValue : current;
}

export function setPointer(doc, pointer, value) {
  if (pointer === '') throw new Error('Cannot replace root document via setPointer');
  const tokens = parsePointer(pointer);
  let current = doc;

  for (let i = 0; i < tokens.length - 1; i++) {
    const token = tokens[i];
    if (current[token] == null || typeof current[token] !== 'object') {
      const nextToken = tokens[i + 1];
      current[token] = /^[0-9]+$/.test(nextToken) ? [] : {};
    }
    current = current[token];
  }

  const lastToken = tokens[tokens.length - 1];
  if (Array.isArray(current) && lastToken === '-') {
    current.push(value);
  } else if (Array.isArray(current)) {
    const idx = parseInt(lastToken, 10);
    current[idx] = value;
  } else {
    current[lastToken] = value;
  }

  return doc;
}
`,
    testCode: `import assert from 'node:assert/strict';
import { getPointer, setPointer } from './engine.js';

console.log('⚡ [Unit #386 Test Suite] Testing RFC 6901 JSON Pointer...');

// Test 1: Standard RFC 6901 retrieval
{
  const doc = {
    foo: ['bar', 'baz'],
    'm~n': 42,
    nested: { 'a/b': 'found' }
  };

  assert.equal(getPointer(doc, '/foo/0'), 'bar');
  assert.equal(getPointer(doc, '/foo/1'), 'baz');
  assert.equal(getPointer(doc, '/m~0n'), 42);
  assert.equal(getPointer(doc, '/nested/a~1b'), 'found');
  assert.equal(getPointer(doc, '/nonexistent', 'DEF'), 'DEF');
  console.log('  ✔ RFC 6901 unescaping and traversal passed');
}

// Test 2: Mutate via Pointer
{
  const doc = { items: [1, 2] };
  setPointer(doc, '/items/-', 3);
  assert.deepEqual(doc.items, [1, 2, 3]);
  setPointer(doc, '/items/1', 99);
  assert.deepEqual(doc.items, [1, 99, 3]);
  console.log('  ✔ RFC 6901 append and replacement mutation passed');
}
`
  },

  // UNIT #387: XML Safe Character Entity Escaper & Unescaper
  {
    num: 387,
    folder: '387-xml-entity-escaper',
    name: 'XML Safe Character Entity Escaper & Unescaper',
    tag: 'GF-T1-387',
    benchmark: '< 0.01ms XML entity escape',
    engineCode: `/**
 * Unit #387: XML Safe Character Entity Escaper & Unescaper
 * Track 1 (Lean Tuner) — Strict XML 1.0 Entity Escaper
 */

const ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;'
};

const UNESCAPE_MAP = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'"
};

export function escapeXml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[&<>"']/g, match => ESCAPE_MAP[match]);
}

export function unescapeXml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&(?:amp|lt|gt|quot|apos|#(\\d+)|#x([0-9a-fA-F]+));/g, (match, dec, hex) => {
    if (UNESCAPE_MAP[match]) return UNESCAPE_MAP[match];
    if (dec) return String.fromCharCode(parseInt(dec, 10));
    if (hex) return String.fromCharCode(parseInt(hex, 16));
    return match;
  });
}

export function stripXmlTags(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '');
}
`,
    testCode: `import assert from 'node:assert/strict';
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
`
  },

  // UNIT #388: Semver Pre-Release Tag Extractor & Normalizer
  {
    num: 388,
    folder: '388-semver-prerelease-extractor',
    name: 'Semver Pre-Release Tag Extractor & Normalizer',
    tag: 'GF-T1-388',
    benchmark: '< 0.01ms semver prerelease resolution',
    engineCode: `/**
 * Unit #388: Semver Pre-Release Tag Extractor & Normalizer
 * Track 1 (Lean Tuner) — SemVer 2.0.0 Pre-Release Resolver
 */

const SEMVER_REGEX = /^(\\d+)\\.(\\d+)\\.(\\d+)(?:-([0-9A-Za-z.-]+))?(?:\\+([0-9A-Za-z.-]+))?$/;

export function parseSemver(versionStr) {
  if (typeof versionStr !== 'string') throw new TypeError('Version must be a string');
  const match = versionStr.trim().replace(/^v/, '').match(SEMVER_REGEX);
  if (!match) throw new Error(\`Invalid SemVer string '\${versionStr}'\`);

  const [
    ,
    major,
    minor,
    patch,
    prerelease = null,
    build = null
  ] = match;

  const identifiers = prerelease ? prerelease.split('.') : [];
  let channel = 'release';
  let iteration = 0;

  if (identifiers.length > 0) {
    channel = identifiers[0];
    const numPart = identifiers.find(id => /^[0-9]+$/.test(id));
    if (numPart !== undefined) {
      iteration = parseInt(numPart, 10);
    }
  }

  return {
    major: parseInt(major, 10),
    minor: parseInt(minor, 10),
    patch: parseInt(patch, 10),
    prerelease,
    identifiers,
    channel,
    iteration,
    isPrerelease: prerelease !== null,
    build
  };
}

export function comparePrerelease(tagA, tagB) {
  if (!tagA && !tagB) return 0;
  if (!tagA) return 1; // Normal version has higher precedence than prerelease
  if (!tagB) return -1;

  const partsA = tagA.split('.');
  const partsB = tagB.split('.');
  const maxLen = Math.max(partsA.length, partsB.length);

  for (let i = 0; i < maxLen; i++) {
    const a = partsA[i];
    const b = partsB[i];
    if (a === undefined) return -1;
    if (b === undefined) return 1;
    if (a === b) continue;

    const numA = /^[0-9]+$/.test(a) ? parseInt(a, 10) : NaN;
    const numB = /^[0-9]+$/.test(b) ? parseInt(b, 10) : NaN;

    if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
      return numA < numB ? -1 : 1;
    }
    if (!Number.isNaN(numA)) return -1; // Numeric identifiers have lower precedence than alphanumeric
    if (!Number.isNaN(numB)) return 1;

    return a < b ? -1 : 1;
  }

  return 0;
}
`,
    testCode: `import assert from 'node:assert/strict';
import { parseSemver, comparePrerelease } from './engine.js';

console.log('⚡ [Unit #388 Test Suite] Testing Semver Pre-Release Extractor...');

// Test 1: Parse Pre-Release Details
{
  const parsed = parseSemver('v2.4.0-alpha.3+build.891');
  assert.equal(parsed.major, 2);
  assert.equal(parsed.minor, 4);
  assert.equal(parsed.patch, 0);
  assert.equal(parsed.channel, 'alpha');
  assert.equal(parsed.iteration, 3);
  assert.equal(parsed.isPrerelease, true);
  assert.equal(parsed.build, 'build.891');
  console.log('  ✔ Pre-release channel and iteration extraction passed');
}

// Test 2: Precedence comparison
{
  assert.equal(comparePrerelease('alpha', 'beta'), -1);
  assert.equal(comparePrerelease('alpha.1', 'alpha.2'), -1);
  assert.equal(comparePrerelease('beta.2', 'alpha.99'), 1);
  assert.equal(comparePrerelease(null, 'alpha.1'), 1); // 1.0.0 > 1.0.0-alpha.1
  console.log('  ✔ SemVer 2.0.0 pre-release precedence comparison passed');
}
`
  },

  // UNIT #389: System Load Average & CPU Telemetry Parser
  {
    num: 389,
    folder: '389-system-load-parser',
    name: 'System Load Average & CPU Telemetry Parser',
    tag: 'GF-T1-389',
    benchmark: '< 0.005ms system load normalization',
    engineCode: `/**
 * Unit #389: System Load Average & CPU Telemetry Parser
 * Track 1 (Lean Tuner) — Multi-Core CPU Saturation & Load Meter
 */

import os from 'node:os';

export function parseLoadAvg(loadArray, cpuCount = os.cpus().length) {
  const cpus = Math.max(1, cpuCount);
  const [load1m = 0, load5m = 0, load15m = 0] = loadArray || os.loadavg();

  const ratio1m = Number((load1m / cpus).toFixed(4));
  const ratio5m = Number((load5m / cpus).toFixed(4));
  const ratio15m = Number((load15m / cpus).toFixed(4));

  let status = 'NORMAL';
  if (ratio1m >= 1.0) {
    status = 'SATURATED';
  } else if (ratio1m >= 0.7) {
    status = 'ELEVATED';
  }

  return {
    cpus,
    rawLoad: [load1m, load5m, load15m],
    saturationRatio: {
      '1m': ratio1m,
      '5m': ratio5m,
      '15m': ratio15m
    },
    percentLoad: {
      '1m': Number((ratio1m * 100).toFixed(1)),
      '5m': Number((ratio5m * 100).toFixed(1)),
      '15m': Number((ratio15m * 100).toFixed(1))
    },
    status
  };
}
`,
    testCode: `import assert from 'node:assert/strict';
import { parseLoadAvg } from './engine.js';

console.log('⚡ [Unit #389 Test Suite] Testing System Load Parser...');

// Test 1: Normalize load averages across cores
{
  const resNormal = parseLoadAvg([1.6, 1.2, 0.8], 4);
  assert.equal(resNormal.cpus, 4);
  assert.equal(resNormal.percentLoad['1m'], 40);
  assert.equal(resNormal.status, 'NORMAL');

  const resSaturated = parseLoadAvg([8.5, 6.0, 4.0], 8);
  assert.equal(resSaturated.status, 'SATURATED');
  assert.ok(resSaturated.saturationRatio['1m'] > 1.0);
  console.log('  ✔ Load average saturation ratios and status thresholds verified');
}
`
  }
];
