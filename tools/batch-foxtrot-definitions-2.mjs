/**
 * Batch Foxtrot Definitions — Part 2: Units #390 to #395
 * High-res execution timer, Exponential backoff jitter, Circular ring buffer, Percentile calculator, Byte size formatter, EMA smoother
 */

export const PART_2_UNITS = [
  // UNIT #390: Microsecond & Nanosecond High-Res Execution Timer
  {
    num: 390,
    folder: '390-microsecond-timer',
    name: 'Microsecond & Nanosecond High-Res Execution Timer',
    tag: 'GF-T1-390',
    benchmark: '< 0.001ms timer invocation overhead',
    engineCode: `/**
 * Unit #390: Microsecond & Nanosecond High-Res Execution Timer
 * Track 1 (Lean Tuner) — High-Resolution hrtime Execution Benchmark Rig
 */

export function startTimer() {
  const start = process.hrtime.bigint();
  return {
    stop() {
      const end = process.hrtime.bigint();
      const durationNs = Number(end - start);
      const durationUs = Number((durationNs / 1e3).toFixed(2));
      const durationMs = Number((durationNs / 1e6).toFixed(3));
      const durationSec = Number((durationNs / 1e9).toFixed(6));

      return {
        durationNs,
        durationUs,
        durationMs,
        durationSec
      };
    }
  };
}

export function timeSync(fn) {
  const timer = startTimer();
  const result = fn();
  const metrics = timer.stop();
  return { result, ...metrics };
}

export async function timeAsync(asyncFn) {
  const timer = startTimer();
  const result = await asyncFn();
  const metrics = timer.stop();
  return { result, ...metrics };
}
`,
    testCode: `import assert from 'node:assert/strict';
import { startTimer, timeSync } from './engine.js';

console.log('⚡ [Unit #390 Test Suite] Testing High-Res Timer...');

// Test 1: Start/Stop timer
{
  const timer = startTimer();
  let acc = 0;
  for (let i = 0; i < 10000; i++) acc += i;
  const elapsed = timer.stop();

  assert.ok(elapsed.durationNs > 0);
  assert.ok(elapsed.durationUs > 0);
  assert.ok(elapsed.durationMs >= 0);
  console.log('  ✔ Nanosecond/microsecond duration metrics verified');
}

// Test 2: Synchronous execution wrapper
{
  const { result, durationUs } = timeSync(() => 42 * 2);
  assert.equal(result, 84);
  assert.ok(durationUs >= 0);
  console.log('  ✔ Function wrapper benchmarking verified');
}
`
  },

  // UNIT #391: Exponential Backoff Full & Equal Jitter Calculator
  {
    num: 391,
    folder: '391-backoff-jitter-calculator',
    name: 'Exponential Backoff Full & Equal Jitter Calculator',
    tag: 'GF-T1-391',
    benchmark: '< 0.005ms backoff calculation',
    engineCode: `/**
 * Unit #391: Exponential Backoff Full & Equal Jitter Calculator
 * Track 1 (Lean Tuner) — AWS Architecture Exponential Backoff Engine
 */

export function calculateBackoff(attempt, options = {}) {
  const {
    baseMs = 100,
    maxMs = 10000,
    factor = 2,
    jitter = 'full', // 'none', 'full', 'equal', 'decorrelated'
    prevSleepMs = baseMs
  } = options;

  if (attempt <= 0) return 0;

  // Unjittered exponential backoff: min(maxMs, baseMs * factor^(attempt - 1))
  const rawSleep = Math.min(maxMs, baseMs * Math.pow(factor, attempt - 1));

  let delay = rawSleep;

  if (jitter === 'full') {
    // Full jitter: Uniform(0, rawSleep)
    delay = Math.floor(Math.random() * rawSleep);
  } else if (jitter === 'equal') {
    // Equal jitter: rawSleep / 2 + Uniform(0, rawSleep / 2)
    const half = rawSleep / 2;
    delay = Math.floor(half + Math.random() * half);
  } else if (jitter === 'decorrelated') {
    // Decorrelated jitter: min(maxMs, Uniform(baseMs, prevSleepMs * 3))
    delay = Math.min(maxMs, Math.floor(baseMs + Math.random() * (prevSleepMs * 3 - baseMs)));
  }

  return Math.max(0, Math.min(maxMs, delay));
}
`,
    testCode: `import assert from 'node:assert/strict';
import { calculateBackoff } from './engine.js';

console.log('⚡ [Unit #391 Test Suite] Testing Backoff Jitter Calculator...');

// Test 1: Deterministic non-jitter backoff
{
  const b1 = calculateBackoff(1, { baseMs: 100, factor: 2, jitter: 'none' });
  const b2 = calculateBackoff(2, { baseMs: 100, factor: 2, jitter: 'none' });
  const b3 = calculateBackoff(3, { baseMs: 100, factor: 2, jitter: 'none' });

  assert.equal(b1, 100);
  assert.equal(b2, 200);
  assert.equal(b3, 400);
  console.log('  ✔ Non-jittered exponential backoff verified');
}

// Test 2: Jitter bounds
{
  for (let i = 0; i < 20; i++) {
    const full = calculateBackoff(3, { baseMs: 100, maxMs: 1000, jitter: 'full' });
    assert.ok(full >= 0 && full <= 400);

    const equal = calculateBackoff(3, { baseMs: 100, maxMs: 1000, jitter: 'equal' });
    assert.ok(equal >= 200 && equal <= 400);
  }
  console.log('  ✔ Full and Equal jitter distribution constraints verified');
}
`
  },

  // UNIT #392: Fixed-Capacity Circular Ring Buffer Queue
  {
    num: 392,
    folder: '392-circular-ring-buffer',
    name: 'Fixed-Capacity Circular Ring Buffer Queue',
    tag: 'GF-T1-392',
    benchmark: '< 0.005ms ring buffer push/pop',
    engineCode: `/**
 * Unit #392: Fixed-Capacity Circular Ring Buffer Queue
 * Track 1 (Lean Tuner) — Zero-Allocation Cyclic Telemetry Buffer
 */

export class CircularRingBuffer {
  constructor(capacity = 100) {
    if (capacity <= 0) throw new RangeError('Capacity must be > 0');
    this.capacity = capacity;
    this.buffer = new Array(capacity);
    this.head = 0; // write pointer
    this.tail = 0; // read pointer
    this.count = 0;
  }

  push(item) {
    let dropped = null;
    if (this.count === this.capacity) {
      dropped = this.buffer[this.tail];
      this.tail = (this.tail + 1) % this.capacity;
      this.count--;
    }

    this.buffer[this.head] = item;
    this.head = (this.head + 1) % this.capacity;
    this.count++;

    return dropped;
  }

  shift() {
    if (this.count === 0) return null;
    const item = this.buffer[this.tail];
    this.buffer[this.tail] = undefined;
    this.tail = (this.tail + 1) % this.capacity;
    this.count--;
    return item;
  }

  peek() {
    if (this.count === 0) return null;
    const idx = (this.head - 1 + this.capacity) % this.capacity;
    return this.buffer[idx];
  }

  peekOldest() {
    if (this.count === 0) return null;
    return this.buffer[this.tail];
  }

  toArray() {
    const res = [];
    let curr = this.tail;
    for (let i = 0; i < this.count; i++) {
      res.push(this.buffer[curr]);
      curr = (curr + 1) % this.capacity;
    }
    return res;
  }

  size() {
    return this.count;
  }

  isFull() {
    return this.count === this.capacity;
  }

  isEmpty() {
    return this.count === 0;
  }
}
`,
    testCode: `import assert from 'node:assert/strict';
import { CircularRingBuffer } from './engine.js';

console.log('⚡ [Unit #392 Test Suite] Testing Circular Ring Buffer...');

// Test 1: Capacity overrun & FIFO order
{
  const ring = new CircularRingBuffer(3);
  ring.push(1);
  ring.push(2);
  ring.push(3);
  assert.equal(ring.isFull(), true);

  const dropped = ring.push(4);
  assert.equal(dropped, 1);
  assert.deepEqual(ring.toArray(), [2, 3, 4]);

  assert.equal(ring.shift(), 2);
  assert.equal(ring.shift(), 3);
  assert.equal(ring.shift(), 4);
  assert.equal(ring.isEmpty(), true);
  console.log('  ✔ Cyclic overwrite and FIFO retrieval passed');
}
`
  },

  // UNIT #393: Percentile & Histogram Quantile Calculator
  {
    num: 393,
    folder: '393-percentile-quantile-calculator',
    name: 'Percentile & Histogram Quantile Calculator',
    tag: 'GF-T1-393',
    benchmark: '< 0.02ms 1,000-sample percentile calculation',
    engineCode: `/**
 * Unit #393: Percentile & Histogram Quantile Calculator
 * Track 1 (Lean Tuner) — High-Performance SLA Quantile Engine
 */

export function calculatePercentile(samples, percentile = 95) {
  if (!Array.isArray(samples) || samples.length === 0) return 0;
  if (percentile <= 0) return Math.min(...samples);
  if (percentile >= 100) return Math.max(...samples);

  const sorted = [...samples].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  if (lower === upper) return sorted[lower];
  return Number((sorted[lower] * (1 - weight) + sorted[upper] * weight).toFixed(2));
}

export function calculateLatencySummary(samples) {
  if (!Array.isArray(samples) || samples.length === 0) {
    return { count: 0, min: 0, max: 0, mean: 0, p50: 0, p90: 0, p95: 0, p99: 0 };
  }

  const sorted = [...samples].sort((a, b) => a - b);
  const count = sorted.length;
  const sum = sorted.reduce((acc, v) => acc + v, 0);

  return {
    count,
    min: sorted[0],
    max: sorted[count - 1],
    mean: Number((sum / count).toFixed(2)),
    p50: calculatePercentile(sorted, 50),
    p90: calculatePercentile(sorted, 90),
    p95: calculatePercentile(sorted, 95),
    p99: calculatePercentile(sorted, 99)
  };
}
`,
    testCode: `import assert from 'node:assert/strict';
import { calculatePercentile, calculateLatencySummary } from './engine.js';

console.log('⚡ [Unit #393 Test Suite] Testing Percentile Quantile Calculator...');

// Test 1: Known 100-sample distribution
{
  const samples = Array.from({ length: 100 }, (_, i) => i + 1); // 1 to 100
  assert.equal(calculatePercentile(samples, 50), 50.5);
  assert.equal(calculatePercentile(samples, 90), 90.1);
  assert.equal(calculatePercentile(samples, 99), 99.01);

  const summary = calculateLatencySummary(samples);
  assert.equal(summary.count, 100);
  assert.equal(summary.min, 1);
  assert.equal(summary.max, 100);
  assert.equal(summary.mean, 50.5);
  console.log('  ✔ SLA percentiles (P50, P90, P99) and metrics verified');
}
`
  },

  // UNIT #394: Memory Byte Size Humanizer & Parser
  {
    num: 394,
    folder: '394-byte-size-formatter',
    name: 'Memory Byte Size Humanizer & Parser',
    tag: 'GF-T1-394',
    benchmark: '< 0.005ms byte size parse/format',
    engineCode: `/**
 * Unit #394: Memory Byte Size Humanizer & Parser
 * Track 1 (Lean Tuner) — Binary & SI Byte Representation Engine
 */

const BINARY_UNITS = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'];
const SI_UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

export function formatBytes(bytes, options = {}) {
  const { binary = true, decimals = 2 } = options;
  if (typeof bytes !== 'number' || Number.isNaN(bytes) || bytes === 0) return '0 B';

  const base = binary ? 1024 : 1000;
  const units = binary ? BINARY_UNITS : SI_UNITS;
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(base));
  const safeIdx = Math.min(i, units.length - 1);
  const val = (bytes / Math.pow(base, safeIdx)).toFixed(decimals);

  return \`\${val} \${units[safeIdx]}\`;
}

export function parseBytes(sizeStr) {
  if (typeof sizeStr !== 'string') return 0;
  const match = sizeStr.trim().match(/^([0-9.]+)\\s*([a-zA-Z]*)$/);
  if (!match) return 0;

  const num = parseFloat(match[1]);
  const unit = match[2].toUpperCase();

  const multipliers = {
    'B': 1,
    'KB': 1000,
    'KIB': 1024,
    'MB': 1000 * 1000,
    'MIB': 1024 * 1024,
    'GB': 1000 * 1000 * 1000,
    'GIB': 1024 * 1024 * 1024,
    'TB': 1000 * 1000 * 1000 * 1000,
    'TIB': 1024 * 1024 * 1024 * 1024
  };

  const mult = multipliers[unit] || (unit.startsWith('K') ? 1024 : unit.startsWith('M') ? 1024 * 1024 : unit.startsWith('G') ? 1024 * 1024 * 1024 : 1);
  return Math.round(num * mult);
}
`,
    testCode: `import assert from 'node:assert/strict';
import { formatBytes, parseBytes } from './engine.js';

console.log('⚡ [Unit #394 Test Suite] Testing Byte Size Formatter...');

// Test 1: Formatting
{
  assert.equal(formatBytes(1024, { binary: true }), '1.00 KiB');
  assert.equal(formatBytes(1000, { binary: false }), '1.00 KB');
  assert.equal(formatBytes(1073741824, { binary: true }), '1.00 GiB');
  console.log('  ✔ Binary and SI byte formatting verified');
}

// Test 2: Parsing
{
  assert.equal(parseBytes('256 MiB'), 268435456);
  assert.equal(parseBytes('10GB'), 10000000000);
  assert.equal(parseBytes('10GiB'), 10737418240);
  console.log('  ✔ Byte string parsing verified');
}
`
  },

  // UNIT #395: Exponential Moving Average (EMA) Smoother
  {
    num: 395,
    folder: '395-exponential-moving-average',
    name: 'Exponential Moving Average (EMA) Smoother',
    tag: 'GF-T1-395',
    benchmark: '< 0.002ms EMA update step',
    engineCode: `/**
 * Unit #395: Exponential Moving Average (EMA) Smoother
 * Track 1 (Lean Tuner) — Realtime Low-Pass Noise Filter
 */

export class ExponentialMovingAverage {
  constructor(options = {}) {
    if (typeof options === 'number') {
      options = { alpha: options };
    }
    const { alpha, period = 10 } = options;
    this.alpha = alpha !== undefined ? alpha : 2 / (period + 1);
    if (this.alpha <= 0 || this.alpha > 1) {
      throw new RangeError('Alpha must be between (0, 1]');
    }
    this.ema = null;
    this.samples = 0;
  }

  push(value) {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      throw new TypeError('Value must be a valid number');
    }

    if (this.ema === null) {
      this.ema = value;
    } else {
      this.ema = this.alpha * value + (1 - this.alpha) * this.ema;
    }

    this.samples++;
    return Number(this.ema.toFixed(4));
  }

  get() {
    return this.ema !== null ? Number(this.ema.toFixed(4)) : null;
  }

  reset() {
    this.ema = null;
    this.samples = 0;
  }
}
`,
    testCode: `import assert from 'node:assert/strict';
import { ExponentialMovingAverage } from './engine.js';

console.log('⚡ [Unit #395 Test Suite] Testing EMA Smoother...');

// Test 1: Smoothing response
{
  const filter = new ExponentialMovingAverage({ alpha: 0.5 });
  assert.equal(filter.push(10), 10);
  assert.equal(filter.push(20), 15); // 0.5 * 20 + 0.5 * 10 = 15
  assert.equal(filter.push(20), 17.5);
  console.log('  ✔ EMA attenuation and recursive convergence passed');
}
`
  }
];
