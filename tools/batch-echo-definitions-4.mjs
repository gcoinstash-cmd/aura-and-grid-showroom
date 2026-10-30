/**
 * Batch Echo Definitions — Part 4: Units #379 to #383
 * Dot-notation property getter/setter, Deep clone memory pool, Array shuffle/Fisher-Yates rig, Math lerp/clamp math unit, Levenshtein distance matcher
 */

export const PART_4_UNITS = [
  // UNIT #379: Path-Safe Dot-Notation Property Getter & Setter
  {
    num: 379,
    folder: '379-dot-property-accessor',
    name: 'Path-Safe Dot-Notation Property Getter & Setter',
    tag: 'GF-T1-379',
    benchmark: '< 0.01ms path resolution',
    engineCode: `/**
 * Unit #379: Path-Safe Dot-Notation Property Getter & Setter
 * Track 1 (Lean Tuner) — Prototype-Safe Object Path Navigation
 */

const BLOCKED_PROPS = new Set(['__proto__', 'prototype', 'constructor']);

function parsePath(path) {
  if (Array.isArray(path)) return path;
  if (typeof path !== 'string') return [];
  // Matches dot segments and array index brackets: "a.b[0].c" -> ["a", "b", "0", "c"]
  return path
    .replace(/\\[(\\d+)\\]/g, '.$1')
    .split('.')
    .filter(segment => segment.length > 0);
}

export function get(obj, path, defaultValue = undefined) {
  if (obj == null) return defaultValue;
  const segments = parsePath(path);
  let current = obj;

  for (const seg of segments) {
    if (current == null) return defaultValue;
    if (BLOCKED_PROPS.has(seg)) return defaultValue;
    current = current[seg];
  }

  return current === undefined ? defaultValue : current;
}

export function set(obj, path, value) {
  if (obj == null || typeof obj !== 'object') {
    throw new TypeError('Target must be an object');
  }

  const segments = parsePath(path);
  let current = obj;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (BLOCKED_PROPS.has(seg)) {
      throw new Error(\`Prototype pollution attempt blocked on '\${seg}'\`);
    }

    if (i === segments.length - 1) {
      current[seg] = value;
      return obj;
    }

    const nextSeg = segments[i + 1];
    const isNextNumeric = /^[0-9]+$/.test(nextSeg);

    if (current[seg] == null || typeof current[seg] !== 'object') {
      current[seg] = isNextNumeric ? [] : {};
    }

    current = current[seg];
  }

  return obj;
}

export function has(obj, path) {
  return get(obj, path) !== undefined;
}
`,
    testCode: `import assert from 'node:assert/strict';
import { get, set, has } from './engine.js';

console.log('⚡ [Unit #379 Test Suite] Testing Dot-Notation Property Accessor...');

// Test 1: Get & Default value
{
  const obj = { telemetry: { cluster: { nodes: [{ id: 'NODE-01', load: 0.42 }] } } };
  assert.equal(get(obj, 'telemetry.cluster.nodes[0].id'), 'NODE-01');
  assert.equal(get(obj, 'telemetry.cluster.nodes[0].load'), 0.42);
  assert.equal(get(obj, 'telemetry.cluster.nodes[99].id', 'UNKNOWN'), 'UNKNOWN');
  assert.equal(has(obj, 'telemetry.cluster.nodes[0].id'), true);
  console.log('  ✔ Deep path retrieval & array index access passed');
}

// Test 2: Set & Prototype pollution guard
{
  const target = {};
  set(target, 'fleet.cluster[0].capacity', 102);
  assert.equal(target.fleet.cluster[0].capacity, 102);

  assert.throws(() => set(target, '__proto__.polluted', true), /Prototype pollution/);
  assert.equal(Object.prototype.polluted, undefined);
  console.log('  ✔ Deep path mutation & prototype security verified');
}
`
  },

  // UNIT #380: Zero-Pollution Structured Deep Clone & Object Replicator
  {
    num: 380,
    folder: '380-deep-clone-pool',
    name: 'Zero-Pollution Structured Deep Clone & Object Replicator',
    tag: 'GF-T1-380',
    benchmark: '< 0.02ms deep clone execution',
    engineCode: `/**
 * Unit #380: Zero-Pollution Structured Deep Clone & Object Replicator
 * Track 1 (Lean Tuner) — Circular-Safe Deep Clone Engine
 */

export function deepClone(val, hash = new WeakMap()) {
  if (val === null || typeof val !== 'object') {
    return val;
  }

  // Handle circular references
  if (hash.has(val)) {
    return hash.get(val);
  }

  // Handle Date
  if (val instanceof Date) {
    return new Date(val.getTime());
  }

  // Handle RegExp
  if (val instanceof RegExp) {
    return new RegExp(val.source, val.flags);
  }

  // Handle Buffer
  if (Buffer.isBuffer(val)) {
    return Buffer.from(val);
  }

  // Handle Map
  if (val instanceof Map) {
    const copy = new Map();
    hash.set(val, copy);
    for (const [k, v] of val.entries()) {
      copy.set(deepClone(k, hash), deepClone(v, hash));
    }
    return copy;
  }

  // Handle Set
  if (val instanceof Set) {
    const copy = new Set();
    hash.set(val, copy);
    for (const v of val.values()) {
      copy.add(deepClone(v, hash));
    }
    return copy;
  }

  // Handle Array
  if (Array.isArray(val)) {
    const copy = [];
    hash.set(val, copy);
    for (let i = 0; i < val.length; i++) {
      copy[i] = deepClone(val[i], hash);
    }
    return copy;
  }

  // Handle Plain Object (guarding prototype)
  const copy = Object.create(null);
  hash.set(val, copy);

  for (const key of Object.keys(val)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
    copy[key] = deepClone(val[key], hash);
  }

  return copy;
}
`,
    testCode: `import assert from 'node:assert/strict';
import { deepClone } from './engine.js';

console.log('⚡ [Unit #380 Test Suite] Testing Deep Clone Engine...');

// Test 1: Complex object with circular reference and nested structures
{
  const original = {
    name: 'Aura-Fleet-Telemetry',
    timestamp: new Date('2026-10-30T14:00:00Z'),
    regex: /telemetry-\\d+/gi,
    buffer: Buffer.from('binary-payload'),
    map: new Map([['key1', 'val1']]),
    set: new Set([1, 2, 3]),
    nested: { a: 100 }
  };
  // Circular ref
  original.self = original;

  const cloned = deepClone(original);
  assert.notEqual(cloned, original);
  assert.notEqual(cloned.nested, original.nested);
  assert.equal(cloned.self, cloned);
  assert.equal(cloned.timestamp.getTime(), original.timestamp.getTime());
  assert.equal(cloned.buffer.toString(), 'binary-payload');
  assert.equal(cloned.map.get('key1'), 'val1');
  assert.ok(cloned.set.has(3));
  console.log('  ✔ Deep cloning with circular references and binary types passed');
}
`
  },

  // UNIT #381: Cryptographically Uniform Fisher-Yates Array Shuffler
  {
    num: 381,
    folder: '381-fisher-yates-shuffle',
    name: 'Cryptographically Uniform Fisher-Yates Array Shuffler',
    tag: 'GF-T1-381',
    benchmark: '< 0.02ms uniform 100-item shuffle',
    engineCode: `/**
 * Unit #381: Cryptographically Uniform Fisher-Yates Array Shuffler
 * Track 1 (Lean Tuner) — CSPRNG Durstenfeld Shuffler & Sampler
 */

import crypto from 'node:crypto';

export function shuffle(array, options = {}) {
  if (!Array.isArray(array)) {
    throw new TypeError('Input must be an array');
  }

  const { inPlace = false, secure = true } = options;
  const target = inPlace ? array : [...array];
  const len = target.length;

  for (let i = len - 1; i > 0; i--) {
    let j;
    if (secure) {
      j = crypto.randomInt(0, i + 1);
    } else {
      j = Math.floor(Math.random() * (i + 1));
    }
    const temp = target[i];
    target[i] = target[j];
    target[j] = temp;
  }

  return target;
}

export function sample(array, count = 1) {
  if (!Array.isArray(array)) throw new TypeError('Input must be an array');
  if (count <= 0) return [];
  if (count >= array.length) return shuffle(array);

  const shuffled = shuffle(array, { inPlace: false, secure: true });
  return shuffled.slice(0, count);
}
`,
    testCode: `import assert from 'node:assert/strict';
import { shuffle, sample } from './engine.js';

console.log('⚡ [Unit #381 Test Suite] Testing Fisher-Yates Array Shuffler...');

// Test 1: Invariance of elements and permutation
{
  const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const shuffled = shuffle(input, { inPlace: false });

  assert.equal(shuffled.length, input.length);
  assert.deepEqual([...shuffled].sort((a, b) => a - b), input);
  console.log('  ✔ Permutation element invariance verified');
}

// Test 2: Sample picking
{
  const input = ['A', 'B', 'C', 'D', 'E'];
  const samples = sample(input, 3);
  assert.equal(samples.length, 3);
  for (const s of samples) {
    assert.ok(input.includes(s));
  }
  console.log('  ✔ Random sampling without replacement verified');
}
`
  },

  // UNIT #382: Precision Math Interpolation, Clamp & Scale Unit
  {
    num: 382,
    folder: '382-math-lerp-clamp',
    name: 'Precision Math Interpolation, Clamp & Scale Unit',
    tag: 'GF-T1-382',
    benchmark: '< 0.005ms lerp & clamp calculation',
    engineCode: `/**
 * Unit #382: Precision Math Interpolation, Clamp & Scale Unit
 * Track 1 (Lean Tuner) — Telemetry Math & Normalization Primitives
 */

export function clamp(val, min, max) {
  if (min > max) [min, max] = [max, min];
  return Math.max(min, Math.min(max, val));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function inverseLerp(a, b, val, shouldClamp = false) {
  if (a === b) return 0;
  const t = (val - a) / (b - a);
  return shouldClamp ? clamp(t, 0, 1) : t;
}

export function mapRange(val, inMin, inMax, outMin, outMax, shouldClamp = false) {
  const t = inverseLerp(inMin, inMax, val, shouldClamp);
  const result = lerp(outMin, outMax, t);
  return shouldClamp ? clamp(result, Math.min(outMin, outMax), Math.max(outMin, outMax)) : result;
}

export function smoothstep(min, max, val) {
  const x = clamp((val - min) / (max - min), 0, 1);
  return x * x * (3 - 2 * x);
}
`,
    testCode: `import assert from 'node:assert/strict';
import { clamp, lerp, inverseLerp, mapRange, smoothstep } from './engine.js';

console.log('⚡ [Unit #382 Test Suite] Testing Precision Math Unit...');

// Test 1: Clamp & Lerp
{
  assert.equal(clamp(15, 0, 10), 10);
  assert.equal(clamp(-5, 0, 10), 0);
  assert.equal(clamp(7, 0, 10), 7);

  assert.equal(lerp(0, 100, 0.5), 50);
  assert.equal(lerp(10, 20, 0.25), 12.5);
  console.log('  ✔ Clamp and Linear Interpolation passed');
}

// Test 2: MapRange and Smoothstep
{
  // Map 50 from range [0, 100] to [-1, 1]
  const mapped = mapRange(50, 0, 100, -1, 1);
  assert.equal(mapped, 0);

  const mappedEnd = mapRange(100, 0, 100, -1, 1);
  assert.equal(mappedEnd, 1);

  const smooth = smoothstep(0, 100, 50);
  assert.equal(smooth, 0.5);
  console.log('  ✔ Range mapping & Hermite smoothstep passed');
}
`
  },

  // UNIT #383: Levenshtein String Distance & Fuzzy Similarity Matcher
  {
    num: 383,
    folder: '383-levenshtein-matcher',
    name: 'Levenshtein String Distance & Fuzzy Similarity Matcher',
    tag: 'GF-T1-383',
    benchmark: '< 0.05ms string distance matrix evaluation',
    engineCode: `/**
 * Unit #383: Levenshtein String Distance & Fuzzy Similarity Matcher
 * Track 1 (Lean Tuner) — Memory-Optimized Dynamic Programming Distance Rig
 */

export function levenshteinDistance(a, b) {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // Swap to ensure b is the shorter string (minimizes row array size)
  if (a.length < b.length) [a, b] = [b, a];

  let prevRow = new Int32Array(b.length + 1);
  let currRow = new Int32Array(b.length + 1);

  for (let j = 0; j <= b.length; j++) {
    prevRow[j] = j;
  }

  for (let i = 1; i <= a.length; i++) {
    currRow[0] = i;
    const aChar = a.charCodeAt(i - 1);

    for (let j = 1; j <= b.length; j++) {
      const cost = aChar === b.charCodeAt(j - 1) ? 0 : 1;
      currRow[j] = Math.min(
        currRow[j - 1] + 1,       // Insertion
        prevRow[j] + 1,           // Deletion
        prevRow[j - 1] + cost     // Substitution
      );
    }

    // Copy currRow to prevRow
    prevRow.set(currRow);
  }

  return currRow[b.length];
}

export function similarityRatio(a, b) {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshteinDistance(a, b);
  return Number((1.0 - dist / maxLen).toFixed(4));
}

export function findBestMatch(target, candidates) {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return { bestMatch: null, ratings: [] };
  }

  const ratings = candidates.map(candidate => ({
    target: candidate,
    distance: levenshteinDistance(target, candidate),
    similarity: similarityRatio(target, candidate)
  }));

  ratings.sort((a, b) => b.similarity - a.similarity);

  return {
    bestMatch: ratings[0],
    ratings
  };
}
`,
    testCode: `import assert from 'node:assert/strict';
import { levenshteinDistance, similarityRatio, findBestMatch } from './engine.js';

console.log('⚡ [Unit #383 Test Suite] Testing Levenshtein Matcher...');

// Test 1: Standard known vector ('kitten' -> 'sitting' = 3)
{
  const dist = levenshteinDistance('kitten', 'sitting');
  assert.equal(dist, 3);

  const ratio = similarityRatio('kitten', 'sitting');
  assert.ok(ratio > 0.5 && ratio < 0.6);
  console.log('  ✔ Levenshtein distance matrix calculation passed');
}

// Test 2: Find best match in candidate pool
{
  const target = 'apex_telemetry';
  const candidates = ['apex_radar', 'apex_telemetry_v2', 'drift_shield', 'cipher_strike'];
  const match = findBestMatch(target, candidates);

  assert.equal(match.bestMatch.target, 'apex_telemetry_v2');
  assert.ok(match.bestMatch.similarity > 0.8);
  console.log('  ✔ Candidate pool fuzzy matching passed');
}
`
  }
];
