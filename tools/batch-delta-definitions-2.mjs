/**
 * Batch Delta Definitions — Part 2: Units #349 to #353
 */

export const PART_2_UNITS = [
  // UNIT #349: Micro-Bench Execution Clock Sampler
  {
    num: 349,
    folder: '349-micro-bench-sampler',
    name: 'Micro-Bench Execution Clock Sampler',
    tag: 'GF-T1-349',
    benchmark: '< 0.01ms timer harness',
    engineCode: `/**
 * Unit #349: Micro-Bench Execution Clock Sampler
 * Track 1 (Lean Tuner) — Nanosecond Precision Benchmark Harness
 */

export function sampleMicroBench(fn, options = {}) {
  const { warmupIterations = 100, sampleIterations = 1000 } = options;
  if (typeof fn !== 'function') throw new TypeError('Target must be a callable function');

  // Warmup loop for JIT optimization
  for (let i = 0; i < warmupIterations; i++) {
    fn();
  }

  const times = new Float64Array(sampleIterations);
  for (let i = 0; i < sampleIterations; i++) {
    const start = process.hrtime.bigint();
    fn();
    const end = process.hrtime.bigint();
    times[i] = Number(end - start);
  }

  times.sort();
  let sum = 0;
  for (let i = 0; i < times.length; i++) sum += times[i];

  const meanNs = sum / times.length;
  const p50Ns = times[Math.floor(times.length * 0.50)];
  const p95Ns = times[Math.floor(times.length * 0.95)];
  const p99Ns = times[Math.floor(times.length * 0.99)];
  const minNs = times[0];
  const maxNs = times[times.length - 1];
  const opsPerSec = meanNs > 0 ? Math.floor(1e9 / meanNs) : 0;

  return {
    iterations: sampleIterations,
    minNs,
    maxNs,
    meanNs: Number(meanNs.toFixed(2)),
    p50Ns,
    p95Ns,
    p99Ns,
    opsPerSec
  };
}

export function formatDurationNs(ns) {
  if (ns < 1000) return \`\${ns.toFixed(0)}ns\`;
  if (ns < 1e6) return \`\${(ns / 1000).toFixed(2)}µs\`;
  return \`\${(ns / 1e6).toFixed(2)}ms\`;
}
`,
    testCode: `import assert from 'node:assert/strict';
import { sampleMicroBench, formatDurationNs } from './engine.js';

console.log('⚡ [Unit #349 Test Suite] Testing Micro-Bench Execution Clock Sampler...');

// Test 1: Benchmarking simple math
{
  const result = sampleMicroBench(() => Math.sin(0.42) * Math.cos(0.88), {
    warmupIterations: 50,
    sampleIterations: 200
  });

  assert.equal(result.iterations, 200);
  assert.ok(result.meanNs >= 0);
  assert.ok(result.opsPerSec > 0);
  console.log('  ✔ Benchmark timing loop verified (' + formatDurationNs(result.meanNs) + ')');
}
`
  },

  // UNIT #350: MurmurHash3 Fast Hash Core
  {
    num: 350,
    folder: '350-murmurhash3-core',
    name: 'MurmurHash3 Fast Hash Core',
    tag: 'GF-T1-350',
    benchmark: '< 0.03ms 32-bit hash',
    engineCode: `/**
 * Unit #350: MurmurHash3 Fast Hash Core
 * Track 1 (Lean Tuner) — Pure 32-Bit Bitwise Murmur3 Implementation
 */

export function murmur32(key, seed = 0) {
  const buf = typeof key === 'string' ? Buffer.from(key, 'utf8') : Buffer.from(key);
  const remainder = buf.length & 3;
  const bytes = buf.length - remainder;
  let h1 = seed >>> 0;

  const c1 = 0xcc9e2d51;
  const c2 = 0x1b873593;

  for (let i = 0; i < bytes; i += 4) {
    let k1 = (buf[i] & 0xff) |
      ((buf[i + 1] & 0xff) << 8) |
      ((buf[i + 2] & 0xff) << 16) |
      ((buf[i + 3] & 0xff) << 24);

    k1 = Math.imul(k1, c1);
    k1 = (k1 << 15) | (k1 >>> 17);
    k1 = Math.imul(k1, c2);

    h1 ^= k1;
    h1 = (h1 << 13) | (h1 >>> 19);
    h1 = (Math.imul(h1, 5) + 0xe6546b64) | 0;
  }

  let k1 = 0;
  switch (remainder) {
    case 3:
      k1 ^= (buf[bytes + 2] & 0xff) << 16;
    case 2:
      k1 ^= (buf[bytes + 1] & 0xff) << 8;
    case 1:
      k1 ^= (buf[bytes] & 0xff);
      k1 = Math.imul(k1, c1);
      k1 = (k1 << 15) | (k1 >>> 17);
      k1 = Math.imul(k1, c2);
      h1 ^= k1;
  }

  h1 ^= buf.length;
  h1 ^= h1 >>> 16;
  h1 = Math.imul(h1, 0x85ebca6b);
  h1 ^= h1 >>> 13;
  h1 = Math.imul(h1, 0xc2b2ae35);
  h1 ^= h1 >>> 16;

  return h1 >>> 0;
}

export function murmur32Hex(key, seed = 0) {
  return murmur32(key, seed).toString(16).padStart(8, '0');
}
`,
    testCode: `import assert from 'node:assert/strict';
import { murmur32, murmur32Hex } from './engine.js';

console.log('⚡ [Unit #350 Test Suite] Testing MurmurHash3 Fast Hash Core...');

// Test 1: Deterministic Vectors
{
  assert.equal(murmur32(''), 0);
  const hashHello = murmur32Hex('hello world');
  assert.equal(typeof hashHello, 'string');
  assert.equal(hashHello.length, 8);
  console.log('  ✔ Deterministic 32-bit Murmur3 hash verified: ' + hashHello);
}
`
  },

  // UNIT #351: Hex Dump Formatter & Byte Visualizer
  {
    num: 351,
    folder: '351-hex-dump-visualizer',
    name: 'Hex Dump Formatter & Byte Visualizer',
    tag: 'GF-T1-351',
    benchmark: '< 0.06ms binary dump',
    engineCode: `/**
 * Unit #351: Hex Dump Formatter & Byte Visualizer
 * Track 1 (Lean Tuner) — Binary Buffer XXD-Style Hex Visualizer
 */

export function formatHexDump(input, options = {}) {
  const { bytesPerLine = 16 } = options;
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(String(input), 'utf8');

  const lines = [];
  for (let i = 0; i < buf.length; i += bytesPerLine) {
    const chunk = buf.slice(i, i + bytesPerLine);
    const addr = i.toString(16).padStart(8, '0');

    let hexPart = '';
    let asciiPart = '';

    for (let j = 0; j < bytesPerLine; j++) {
      if (j < chunk.length) {
        const b = chunk[j];
        hexPart += b.toString(16).padStart(2, '0') + ' ';
        asciiPart += (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.';
      } else {
        hexPart += '   ';
      }
    }

    lines.push(\`\${addr}: \${hexPart} |\${asciiPart}|\`);
  }

  return lines.join('\\n');
}
`,
    testCode: `import assert from 'node:assert/strict';
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
`
  },

  // UNIT #352: Rate-Limit Sliding Window Calculator
  {
    num: 352,
    folder: '352-sliding-window-rate-limiter',
    name: 'Rate-Limit Sliding Window Calculator',
    tag: 'GF-T1-352',
    benchmark: '< 0.02ms token check',
    engineCode: `/**
 * Unit #352: Rate-Limit Sliding Window Calculator
 * Track 1 (Lean Tuner) — Standalone In-Memory Sliding Log Limiter
 */

export class SlidingWindowLimiter {
  constructor(limit = 60, windowMs = 60000) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.buckets = new Map();
  }

  check(key, cost = 1) {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    let timestamps = this.buckets.get(key) || [];
    // Prune stale timestamps
    timestamps = timestamps.filter(t => t > windowStart);

    if (timestamps.length + cost <= this.limit) {
      for (let i = 0; i < cost; i++) timestamps.push(now);
      this.buckets.set(key, timestamps);
      return {
        allowed: true,
        remaining: this.limit - timestamps.length,
        resetMs: Math.max(0, timestamps[0] + this.windowMs - now)
      };
    } else {
      this.buckets.set(key, timestamps);
      return {
        allowed: false,
        remaining: 0,
        resetMs: Math.max(0, timestamps[0] + this.windowMs - now)
      };
    }
  }

  reset(key) {
    this.buckets.delete(key);
  }
}
`,
    testCode: `import assert from 'node:assert/strict';
import { SlidingWindowLimiter } from './engine.js';

console.log('⚡ [Unit #352 Test Suite] Testing Sliding Window Limiter...');

// Test 1: Allowance & Rejection
{
  const limiter = new SlidingWindowLimiter(3, 1000);
  assert.equal(limiter.check('ip-1').allowed, true);
  assert.equal(limiter.check('ip-1').allowed, true);
  assert.equal(limiter.check('ip-1').allowed, true);
  assert.equal(limiter.check('ip-1').allowed, false);
  console.log('  ✔ Rate limit cutoff verified at 3 requests');
}
`
  },

  // UNIT #353: Content-Type MIME Sniffer & Header Parser
  {
    num: 353,
    folder: '353-content-type-sniffer',
    name: 'Content-Type MIME Sniffer & Header Parser',
    tag: 'GF-T1-353',
    benchmark: '< 0.03ms header & magic bytes',
    engineCode: `/**
 * Unit #353: Content-Type MIME Sniffer & Header Parser
 * Track 1 (Lean Tuner) — RFC 7231 Header Parser & Magic Byte Sniffer
 */

export function parseContentType(headerStr) {
  if (typeof headerStr !== 'string') return { type: 'application/octet-stream', parameters: {} };

  const parts = headerStr.split(';').map(p => p.trim());
  const type = parts[0].toLowerCase();
  const parameters = {};

  for (let i = 1; i < parts.length; i++) {
    const eqIdx = parts[i].indexOf('=');
    if (eqIdx !== -1) {
      const key = parts[i].slice(0, eqIdx).trim().toLowerCase();
      let val = parts[i].slice(eqIdx + 1).trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      parameters[key] = val;
    }
  }

  return { type, parameters };
}

export function sniffMimeType(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) return 'application/octet-stream';

  // PNG
  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return 'image/png';
  }
  // JPEG
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  // GIF
  if (buffer.length >= 6 && buffer.slice(0, 3).toString('ascii') === 'GIF') {
    return 'image/gif';
  }
  // PDF
  if (buffer.length >= 4 && buffer.slice(0, 4).toString('ascii') === '%PDF') {
    return 'application/pdf';
  }

  return 'application/octet-stream';
}
`,
    testCode: `import assert from 'node:assert/strict';
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
`
  }
];
