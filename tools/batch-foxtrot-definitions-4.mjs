/**
 * Batch Foxtrot Definitions — Part 4: Units #401 to #405
 * GeoJSON bbox & centroid, Base32 TOTP secret, Circuit breaker, Sliding window rate meter, Fast Bloom filter
 */

export const PART_4_UNITS = [
  // UNIT #401: GeoJSON Bounding Box & Centroid Rig
  {
    num: 401,
    folder: '401-geojson-bbox-centroid',
    name: 'GeoJSON Bounding Box & Centroid Rig',
    tag: 'GF-T1-401',
    benchmark: '< 0.01ms bbox & centroid calculation',
    engineCode: `/**
 * Unit #401: GeoJSON Bounding Box & Centroid Rig
 * Track 1 (Lean Tuner) — GIS Spatial Bounding Box & Centroid Math
 */

function extractCoordinates(geojson) {
  if (Array.isArray(geojson)) {
    // If array of [lon, lat]
    if (typeof geojson[0] === 'number') return [geojson];
    // If nested array
    const flat = [];
    const flatten = arr => {
      if (typeof arr[0] === 'number') {
        flat.push(arr);
      } else {
        arr.forEach(flatten);
      }
    };
    flatten(geojson);
    return flat;
  }

  if (geojson && geojson.type === 'FeatureCollection') {
    return geojson.features.flatMap(f => extractCoordinates(f.geometry));
  }
  if (geojson && geojson.type === 'Feature') {
    return extractCoordinates(geojson.geometry);
  }
  if (geojson && geojson.coordinates) {
    return extractCoordinates(geojson.coordinates);
  }

  return [];
}

export function calculateBbox(geojson) {
  const coords = extractCoordinates(geojson);
  if (coords.length === 0) return [0, 0, 0, 0];

  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;

  for (const [lon, lat] of coords) {
    if (lon < minLon) minLon = lon;
    if (lat < minLat) minLat = lat;
    if (lon > maxLon) maxLon = lon;
    if (lat > maxLat) maxLat = lat;
  }

  return [minLon, minLat, maxLon, maxLat];
}

export function calculateCentroid(geojson) {
  const coords = extractCoordinates(geojson);
  if (coords.length === 0) return { lon: 0, lat: 0 };

  let sumLon = 0;
  let sumLat = 0;

  for (const [lon, lat] of coords) {
    sumLon += lon;
    sumLat += lat;
  }

  return {
    lon: Number((sumLon / coords.length).toFixed(6)),
    lat: Number((sumLat / coords.length).toFixed(6))
  };
}

export function bboxToPolygon(bbox) {
  const [minLon, minLat, maxLon, maxLat] = bbox;
  return [
    [
      [minLon, minLat],
      [maxLon, minLat],
      [maxLon, maxLat],
      [minLon, maxLat],
      [minLon, minLat]
    ]
  ];
}
`,
    testCode: `import assert from 'node:assert/strict';
import { calculateBbox, calculateCentroid, bboxToPolygon } from './engine.js';

console.log('⚡ [Unit #401 Test Suite] Testing GeoJSON Bbox & Centroid Rig...');

// Test 1: Bbox calculation
{
  const feature = {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [[-118.4, 33.9], [-118.2, 33.9], [-118.2, 34.1], [-118.4, 34.1], [-118.4, 33.9]]
      ]
    }
  };

  const bbox = calculateBbox(feature);
  assert.deepEqual(bbox, [-118.4, 33.9, -118.2, 34.1]);

  const centroid = calculateCentroid(feature);
  assert.ok(Math.abs(centroid.lon - (-118.3)) < 0.05);
  assert.ok(Math.abs(centroid.lat - 34.0) < 0.05);

  const poly = bboxToPolygon(bbox);
  assert.equal(poly[0].length, 5);
  console.log('  ✔ Bbox, centroid, and bounding polygon verified');
}
`
  },

  // UNIT #402: Base32 (RFC 4648) & TOTP Secret Key Rig
  {
    num: 402,
    folder: '402-base32-totp-encoder',
    name: 'Base32 (RFC 4648) & TOTP Secret Key Rig',
    tag: 'GF-T1-402',
    benchmark: '< 0.02ms Base32 encode/decode',
    engineCode: `/**
 * Unit #402: Base32 (RFC 4648) & TOTP Secret Key Rig
 * Track 1 (Lean Tuner) — RFC 4648 Base32 Secret Key Rig
 */

import crypto from 'node:crypto';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function encodeBase32(bufferOrString) {
  const buf = Buffer.isBuffer(bufferOrString) ? bufferOrString : Buffer.from(bufferOrString, 'utf8');
  if (buf.length === 0) return '';

  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buf.length; i++) {
    value = (value << 8) | buf[i];
    bits += 8;
    while (bits >= 5) {
      output += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

export function decodeBase32(str) {
  if (typeof str !== 'string' || !str) return Buffer.alloc(0);
  const cleaned = str.toUpperCase().replace(/=+$/, '');

  let bits = 0;
  let value = 0;
  const bytes = [];

  for (let i = 0; i < cleaned.length; i++) {
    const idx = ALPHABET.indexOf(cleaned[i]);
    if (idx === -1) throw new Error(\`Invalid Base32 character: '\${cleaned[i]}'\`);

    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

export function generateTotpSecret(bytes = 20) {
  return encodeBase32(crypto.randomBytes(bytes));
}
`,
    testCode: `import assert from 'node:assert/strict';
import { encodeBase32, decodeBase32, generateTotpSecret } from './engine.js';

console.log('⚡ [Unit #402 Test Suite] Testing Base32 TOTP Encoder...');

// Test 1: Standard RFC 4648 test vectors
{
  assert.equal(encodeBase32(''), '');
  assert.equal(encodeBase32('f'), 'MY');
  assert.equal(encodeBase32('fo'), 'MZXQ');
  assert.equal(encodeBase32('foo'), 'MZXW6');
  assert.equal(encodeBase32('foob'), 'MZXW6YQ');
  assert.equal(encodeBase32('foobar'), 'MZXW6YTBOI');

  assert.equal(decodeBase32('MZXW6YTBOI').toString('utf8'), 'foobar');
  console.log('  ✔ RFC 4648 Base32 test vectors verified');
}

// Test 2: TOTP Secret Generation
{
  const secret = generateTotpSecret(20);
  assert.equal(secret.length, 32);
  const decoded = decodeBase32(secret);
  assert.equal(decoded.length, 20);
  console.log('  ✔ 160-bit TOTP secret key generation passed');
}
`
  },

  // UNIT #403: Circuit Breaker Failure Guard & Tripper
  {
    num: 403,
    folder: '403-circuit-breaker-state-machine',
    name: 'Circuit Breaker Failure Guard & Tripper',
    tag: 'GF-T1-403',
    benchmark: '< 0.005ms circuit state evaluation',
    engineCode: `/**
 * Unit #403: Circuit Breaker Failure Guard & Tripper
 * Track 1 (Lean Tuner) — Fault-Tolerance Circuit Breaker Rig
 */

export class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.resetTimeoutMs = options.resetTimeoutMs ?? 10000;
    this.halfOpenSuccessThreshold = options.halfOpenSuccessThreshold ?? 2;

    this.state = 'CLOSED'; // 'CLOSED', 'OPEN', 'HALF_OPEN'
    this.failureCount = 0;
    this.consecutiveSuccesses = 0;
    this.nextAttempt = Date.now();
  }

  getState() {
    if (this.state === 'OPEN' && Date.now() >= this.nextAttempt) {
      this.state = 'HALF_OPEN';
      this.consecutiveSuccesses = 0;
    }
    return this.state;
  }

  recordSuccess() {
    this.failureCount = 0;
    if (this.state === 'HALF_OPEN') {
      this.consecutiveSuccesses++;
      if (this.consecutiveSuccesses >= this.halfOpenSuccessThreshold) {
        this.state = 'CLOSED';
      }
    }
  }

  recordFailure() {
    this.failureCount++;
    if (this.state === 'HALF_OPEN' || this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.resetTimeoutMs;
    }
  }

  execute(fn) {
    if (this.getState() === 'OPEN') {
      throw new Error('CircuitBreakerOpenError: Circuit is OPEN, fast-failing call');
    }

    try {
      const res = fn();
      this.recordSuccess();
      return res;
    } catch (err) {
      this.recordFailure();
      throw err;
    }
  }

  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.consecutiveSuccesses = 0;
    this.nextAttempt = Date.now();
  }
}
`,
    testCode: `import assert from 'node:assert/strict';
import { CircuitBreaker } from './engine.js';

console.log('⚡ [Unit #403 Test Suite] Testing Circuit Breaker State Machine...');

// Test 1: Trip to OPEN state after threshold failures
{
  const cb = new CircuitBreaker({ failureThreshold: 3, resetTimeoutMs: 100 });
  assert.equal(cb.getState(), 'CLOSED');

  cb.recordFailure();
  cb.recordFailure();
  assert.equal(cb.getState(), 'CLOSED');

  cb.recordFailure();
  assert.equal(cb.getState(), 'OPEN');

  assert.throws(() => cb.execute(() => 'should fail'), /CircuitBreakerOpenError/);
  console.log('  ✔ Circuit tripping and fast-failure verified');
}
`
  },

  // UNIT #404: Sliding Window Counter & Requests-Per-Second (RPS) Meter
  {
    num: 404,
    folder: '404-sliding-window-rate-meter',
    name: 'Sliding Window Counter & Requests-Per-Second (RPS) Meter',
    tag: 'GF-T1-404',
    benchmark: '< 0.005ms sliding bucket increment',
    engineCode: `/**
 * Unit #404: Sliding Window Counter & Requests-Per-Second (RPS) Meter
 * Track 1 (Lean Tuner) — Multi-Bucket Sliding Window Rate Meter
 */

export class SlidingWindowMeter {
  constructor(windowMs = 1000, bucketCount = 10) {
    this.windowMs = windowMs;
    this.bucketCount = bucketCount;
    this.bucketDuration = windowMs / bucketCount;
    this.buckets = new Array(bucketCount).fill(0);
    this.bucketTimestamps = new Array(bucketCount).fill(0);
  }

  _getBucketIndex(now) {
    const bucketIdx = Math.floor(now / this.bucketDuration) % this.bucketCount;
    const bucketTime = Math.floor(now / this.bucketDuration);

    if (this.bucketTimestamps[bucketIdx] !== bucketTime) {
      this.buckets[bucketIdx] = 0;
      this.bucketTimestamps[bucketIdx] = bucketTime;
    }

    return bucketIdx;
  }

  mark(count = 1, now = Date.now()) {
    const idx = this._getBucketIndex(now);
    this.buckets[idx] += count;
  }

  getCount(now = Date.now()) {
    const minTime = Math.floor((now - this.windowMs) / this.bucketDuration);
    let total = 0;

    for (let i = 0; i < this.bucketCount; i++) {
      if (this.bucketTimestamps[i] > minTime) {
        total += this.buckets[i];
      }
    }

    return total;
  }

  getRate(now = Date.now()) {
    const count = this.getCount(now);
    return Number(((count / this.windowMs) * 1000).toFixed(2));
  }
}
`,
    testCode: `import assert from 'node:assert/strict';
import { SlidingWindowMeter } from './engine.js';

console.log('⚡ [Unit #404 Test Suite] Testing Sliding Window Rate Meter...');

// Test 1: Mark & GetCount
{
  const meter = new SlidingWindowMeter(1000, 10);
  const now = 1000000;

  meter.mark(10, now);
  meter.mark(15, now + 200);

  assert.equal(meter.getCount(now + 300), 25);
  assert.equal(meter.getRate(now + 300), 25.0);

  // Advance past window (now + 1200)
  assert.equal(meter.getCount(now + 1200), 0);
  console.log('  ✔ Sliding window multi-bucket expiry and rate verified');
}
`
  },

  // UNIT #405: Fast Bloom Filter Probabilistic Set Rig
  {
    num: 405,
    folder: '405-fast-bloom-filter',
    name: 'Fast Bloom Filter Probabilistic Set Rig',
    tag: 'GF-T1-405',
    benchmark: '< 0.005ms bloom filter lookup',
    engineCode: `/**
 * Unit #405: Fast Bloom Filter Probabilistic Set Rig
 * Track 1 (Lean Tuner) — Bitset Probabilistic Membership Filter
 */

function fnv1a(str, seed = 0) {
  let hash = 0x811c9dc5 ^ seed;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export class FastBloomFilter {
  constructor(sizeBits = 1024, hashCount = 3) {
    this.size = sizeBits;
    this.hashCount = hashCount;
    this.buffer = new Uint8Array(Math.ceil(sizeBits / 8));
  }

  _getHashes(element) {
    const str = String(element);
    const hashes = [];
    for (let i = 0; i < this.hashCount; i++) {
      hashes.push(fnv1a(str, i * 0x5bd1e995) % this.size);
    }
    return hashes;
  }

  add(element) {
    const hashes = this._getHashes(element);
    for (const h of hashes) {
      const byteIdx = Math.floor(h / 8);
      const bitIdx = h % 8;
      this.buffer[byteIdx] |= 1 << bitIdx;
    }
  }

  has(element) {
    const hashes = this._getHashes(element);
    for (const h of hashes) {
      const byteIdx = Math.floor(h / 8);
      const bitIdx = h % 8;
      if ((this.buffer[byteIdx] & (1 << bitIdx)) === 0) {
        return false; // Definitely not in set
      }
    }
    return true; // Probably in set
  }

  bitCount() {
    let count = 0;
    for (let i = 0; i < this.buffer.length; i++) {
      let b = this.buffer[i];
      while (b > 0) {
        count += b & 1;
        b >>= 1;
      }
    }
    return count;
  }

  clear() {
    this.buffer.fill(0);
  }
}
`,
    testCode: `import assert from 'node:assert/strict';
import { FastBloomFilter } from './engine.js';

console.log('⚡ [Unit #405 Test Suite] Testing Fast Bloom Filter...');

// Test 1: Membership check & zero false negatives
{
  const filter = new FastBloomFilter(1024, 3);
  filter.add('telemetry_alpha');
  filter.add('telemetry_beta');

  assert.equal(filter.has('telemetry_alpha'), true);
  assert.equal(filter.has('telemetry_beta'), true);
  assert.equal(filter.has('telemetry_nonexistent_xyz'), false);
  assert.ok(filter.bitCount() > 0);
  console.log('  ✔ Zero false negative probabilistic filter passed');
}
`
  }
];
