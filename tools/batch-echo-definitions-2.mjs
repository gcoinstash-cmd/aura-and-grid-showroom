/**
 * Batch Echo Definitions — Part 2: Units #369 to #373
 * Stream chunker, Backpressure buffer gauge, Line-by-line parser, NDJSON Streamer, Event-Emitter Bus
 */

export const PART_2_UNITS = [
  // UNIT #369: Fixed-Size & Delimiter Stream Chunker
  {
    num: 369,
    folder: '369-stream-chunker',
    name: 'Fixed-Size & Delimiter Stream Chunker',
    tag: 'GF-T1-369',
    benchmark: '< 0.04ms stream buffer chunking',
    engineCode: `/**
 * Unit #369: Fixed-Size & Delimiter Stream Chunker
 * Track 1 (Lean Tuner) — Pure Node.js Memory Buffer & Stream Chunker
 */

import { Transform } from 'node:stream';

export function chunkBuffer(buffer, chunkSize = 1024) {
  if (!Buffer.isBuffer(buffer)) {
    buffer = Buffer.from(buffer);
  }
  if (chunkSize <= 0) throw new RangeError('chunkSize must be > 0');
  
  const chunks = [];
  let offset = 0;
  while (offset < buffer.length) {
    const end = Math.min(offset + chunkSize, buffer.length);
    chunks.push(buffer.subarray(offset, end));
    offset = end;
  }
  return chunks;
}

export function chunkByDelimiter(buffer, delimiter = '\\n') {
  if (!Buffer.isBuffer(buffer)) {
    buffer = Buffer.from(buffer);
  }
  const delimBuf = Buffer.isBuffer(delimiter) ? delimiter : Buffer.from(delimiter);
  const chunks = [];
  let start = 0;
  let idx = buffer.indexOf(delimBuf, start);

  while (idx !== -1) {
    chunks.push(buffer.subarray(start, idx));
    start = idx + delimBuf.length;
    idx = buffer.indexOf(delimBuf, start);
  }

  if (start < buffer.length) {
    chunks.push(buffer.subarray(start));
  }
  return chunks;
}

export function createFixedChunkStream(chunkSize = 1024) {
  let accumulator = Buffer.alloc(0);
  return new Transform({
    transform(chunk, encoding, callback) {
      accumulator = Buffer.concat([accumulator, chunk]);
      while (accumulator.length >= chunkSize) {
        this.push(accumulator.subarray(0, chunkSize));
        accumulator = accumulator.subarray(chunkSize);
      }
      callback();
    },
    flush(callback) {
      if (accumulator.length > 0) {
        this.push(accumulator);
      }
      callback();
    }
  });
}
`,
    testCode: `import assert from 'node:assert/strict';
import { chunkBuffer, chunkByDelimiter } from './engine.js';

console.log('⚡ [Unit #369 Test Suite] Testing Stream Chunker...');

// Test 1: Fixed-size buffer chunking
{
  const buf = Buffer.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'utf8');
  const chunks = chunkBuffer(buf, 10);
  assert.equal(chunks.length, 3);
  assert.equal(chunks[0].toString('utf8'), 'ABCDEFGHIJ');
  assert.equal(chunks[1].toString('utf8'), 'KLMNOPQRST');
  assert.equal(chunks[2].toString('utf8'), 'UVWXYZ');
  console.log('  ✔ Fixed-size buffer chunking passed');
}

// Test 2: Delimiter chunking
{
  const buf = Buffer.from('packet1||packet2||packet3', 'utf8');
  const chunks = chunkByDelimiter(buf, '||');
  assert.equal(chunks.length, 3);
  assert.equal(chunks[0].toString('utf8'), 'packet1');
  assert.equal(chunks[1].toString('utf8'), 'packet2');
  assert.equal(chunks[2].toString('utf8'), 'packet3');
  console.log('  ✔ Delimiter chunking passed');
}
`
  },

  // UNIT #370: High-Watermark Backpressure Gauge & Queue Meter
  {
    num: 370,
    folder: '370-backpressure-buffer-gauge',
    name: 'High-Watermark Backpressure Gauge & Queue Meter',
    tag: 'GF-T1-370',
    benchmark: '< 0.02ms buffer queue state evaluation',
    engineCode: `/**
 * Unit #370: High-Watermark Backpressure Gauge & Queue Meter
 * Track 1 (Lean Tuner) — Queue Depth & Backpressure Controller
 */

export class BackpressureGauge {
  constructor(options = {}) {
    this.highWatermark = options.highWatermark ?? 100;
    this.lowWatermark = options.lowWatermark ?? 20;
    this.maxBytes = options.maxBytes ?? 1024 * 1024; // 1MB default
    this.queue = [];
    this.currentBytes = 0;
    this.isPaused = false;
  }

  push(item, byteSize = 1) {
    this.queue.push(item);
    this.currentBytes += byteSize;

    let pausedNow = false;
    if (!this.isPaused && (this.queue.length >= this.highWatermark || this.currentBytes >= this.maxBytes)) {
      this.isPaused = true;
      pausedNow = true;
    }

    return {
      queued: this.queue.length,
      bytes: this.currentBytes,
      pressureRatio: Number((this.queue.length / this.highWatermark).toFixed(4)),
      isPaused: this.isPaused,
      pausedNow
    };
  }

  shift(byteSize = 1) {
    if (this.queue.length === 0) return null;
    const item = this.queue.shift();
    this.currentBytes = Math.max(0, this.currentBytes - byteSize);

    let resumedNow = false;
    if (this.isPaused && this.queue.length <= this.lowWatermark && this.currentBytes < this.maxBytes * 0.5) {
      this.isPaused = false;
      resumedNow = true;
    }

    return {
      item,
      queued: this.queue.length,
      bytes: this.currentBytes,
      pressureRatio: Number((this.queue.length / this.highWatermark).toFixed(4)),
      isPaused: this.isPaused,
      resumedNow
    };
  }

  getStats() {
    return {
      queued: this.queue.length,
      bytes: this.currentBytes,
      highWatermark: this.highWatermark,
      lowWatermark: this.lowWatermark,
      isPaused: this.isPaused
    };
  }
}
`,
    testCode: `import assert from 'node:assert/strict';
import { BackpressureGauge } from './engine.js';

console.log('⚡ [Unit #370 Test Suite] Testing Backpressure Gauge...');

// Test 1: High and low watermark transitions
{
  const gauge = new BackpressureGauge({ highWatermark: 5, lowWatermark: 2 });
  
  // Fill up to high watermark
  for (let i = 0; i < 4; i++) {
    const res = gauge.push({ id: i });
    assert.equal(res.isPaused, false);
  }
  const tripRes = gauge.push({ id: 4 });
  assert.equal(tripRes.isPaused, true);
  assert.equal(tripRes.pausedNow, true);

  // Drain down to low watermark
  gauge.shift(); // 4 left (paused)
  gauge.shift(); // 3 left (paused)
  const resumeRes = gauge.shift(); // 2 left (resumed!)
  assert.equal(resumeRes.isPaused, false);
  assert.equal(resumeRes.resumedNow, true);
  console.log('  ✔ Watermark tripping and backpressure recovery verified');
}
`
  },

  // UNIT #371: Zero-Copy Stream Line-by-Line Telemetry Parser
  {
    num: 371,
    folder: '371-line-by-line-parser',
    name: 'Zero-Copy Stream Line-by-Line Telemetry Parser',
    tag: 'GF-T1-371',
    benchmark: '< 0.03ms line-by-line chunk parsing',
    engineCode: `/**
 * Unit #371: Zero-Copy Stream Line-by-Line Telemetry Parser
 * Track 1 (Lean Tuner) — Multi-chunk newline aggregator
 */

export function parseLinesSync(textOrBuffer) {
  const str = Buffer.isBuffer(textOrBuffer) ? textOrBuffer.toString('utf8') : String(textOrBuffer);
  if (!str) return [];
  // Split on CR LF or LF
  const raw = str.split(/\\r?\\n/);
  // If string ends with newline, pop empty trailing element
  if (raw.length > 0 && raw[raw.length - 1] === '') {
    raw.pop();
  }
  return raw;
}

export class StreamLineSplitter {
  constructor() {
    this.remainder = '';
  }

  feed(chunk) {
    const str = this.remainder + (Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk));
    const lines = str.split(/\\r?\\n/);
    this.remainder = lines.pop() ?? '';
    return lines;
  }

  flush() {
    const final = this.remainder;
    this.remainder = '';
    return final ? [final] : [];
  }
}
`,
    testCode: `import assert from 'node:assert/strict';
import { parseLinesSync, StreamLineSplitter } from './engine.js';

console.log('⚡ [Unit #371 Test Suite] Testing Line-by-Line Parser...');

// Test 1: Sync parser with mixed newlines
{
  const input = 'line1\\r\\nline2\\nline3\\n';
  const lines = parseLinesSync(input);
  assert.deepEqual(lines, ['line1', 'line2', 'line3']);
  console.log('  ✔ Mixed CRLF line parsing verified');
}

// Test 2: Chunk accumulator across streaming boundaries
{
  const splitter = new StreamLineSplitter();
  const chunk1 = 'hello telemetry\\nchunk split in';
  const chunk2 = ' middle\\nfinal row';

  const out1 = splitter.feed(chunk1);
  assert.deepEqual(out1, ['hello telemetry']);

  const out2 = splitter.feed(chunk2);
  assert.deepEqual(out2, ['chunk split in middle']);

  const out3 = splitter.flush();
  assert.deepEqual(out3, ['final row']);
  console.log('  ✔ Stream chunk boundary reconstitution verified');
}
`
  },

  // UNIT #372: NDJSON (Newline-Delimited JSON) Streamer & Validator
  {
    num: 372,
    folder: '372-ndjson-streamer',
    name: 'NDJSON (Newline-Delimited JSON) Streamer & Validator',
    tag: 'GF-T1-372',
    benchmark: '< 0.05ms NDJSON encode/decode roundtrip',
    engineCode: `/**
 * Unit #372: NDJSON (Newline-Delimited JSON) Streamer & Validator
 * Track 1 (Lean Tuner) — High-Performance NDJSON Parser & Serializer
 */

export function serializeNdjson(records) {
  if (!Array.isArray(records)) {
    throw new TypeError('Records must be an array');
  }
  return records.map(r => JSON.stringify(r)).join('\\n') + (records.length > 0 ? '\\n' : '');
}

export function parseNdjson(ndjsonString, options = {}) {
  const { ignoreErrors = false } = options;
  if (!ndjsonString || typeof ndjsonString !== 'string') return [];

  const lines = ndjsonString.split(/\\r?\\n/).filter(line => line.trim().length > 0);
  const results = [];

  for (let i = 0; i < lines.length; i++) {
    try {
      results.push(JSON.parse(lines[i]));
    } catch (err) {
      if (!ignoreErrors) {
        throw new Error(\`NDJSON Parse Error at line \${i + 1}: \${err.message}\`);
      }
    }
  }

  return results;
}
`,
    testCode: `import assert from 'node:assert/strict';
import { serializeNdjson, parseNdjson } from './engine.js';

console.log('⚡ [Unit #372 Test Suite] Testing NDJSON Streamer & Validator...');

// Test 1: Serialize and parse roundtrip
{
  const records = [
    { id: 1, event: 'telemetry_ping', latencyMs: 4.2 },
    { id: 2, event: 'telemetry_pong', latencyMs: 3.8 }
  ];
  const ndjson = serializeNdjson(records);
  assert.ok(ndjson.includes('\\n'));

  const parsed = parseNdjson(ndjson);
  assert.deepEqual(parsed, records);
  console.log('  ✔ NDJSON serialization & parsing roundtrip passed');
}

// Test 2: Error handling & ignoreErrors option
{
  const malformed = '{"ok": true}\\nNOT_JSON\\n{"ok": 2}';
  assert.throws(() => parseNdjson(malformed, { ignoreErrors: false }));
  const tolerant = parseNdjson(malformed, { ignoreErrors: true });
  assert.equal(tolerant.length, 2);
  console.log('  ✔ Malformed row filtering passed');
}
`
  },

  // UNIT #373: Wildcard Telemetry Event Bus & Topic Dispatcher
  {
    num: 373,
    folder: '373-event-emitter-bus',
    name: 'Wildcard Telemetry Event Bus & Topic Dispatcher',
    tag: 'GF-T1-373',
    benchmark: '< 0.01ms event bus topic dispatch',
    engineCode: `/**
 * Unit #373: Wildcard Telemetry Event Bus & Topic Dispatcher
 * Track 1 (Lean Tuner) — Pattern-Matching Event Hub
 */

export class TelemetryEventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(topic, handler) {
    if (typeof handler !== 'function') throw new TypeError('Handler must be a function');
    if (!this.listeners.has(topic)) {
      this.listeners.set(topic, new Set());
    }
    this.listeners.get(topic).add(handler);

    return () => this.off(topic, handler);
  }

  once(topic, handler) {
    const wrapped = (...args) => {
      this.off(topic, wrapped);
      handler(...args);
    };
    wrapped._original = handler;
    return this.on(topic, wrapped);
  }

  off(topic, handler) {
    if (!this.listeners.has(topic)) return;
    const set = this.listeners.get(topic);
    set.delete(handler);
    for (const h of set) {
      if (h._original === handler) {
        set.delete(h);
      }
    }
    if (set.size === 0) {
      this.listeners.delete(topic);
    }
  }

  emit(topic, payload) {
    let dispatchCount = 0;

    for (const [registeredTopic, handlerSet] of this.listeners.entries()) {
      if (this._matchesTopic(registeredTopic, topic)) {
        for (const handler of Array.from(handlerSet)) {
          handler(payload, topic);
          dispatchCount++;
        }
      }
    }

    return dispatchCount;
  }

  _matchesTopic(pattern, topic) {
    if (pattern === '*' || pattern === topic) return true;
    if (pattern.endsWith(':*')) {
      const prefix = pattern.slice(0, -2);
      return topic === prefix || topic.startsWith(prefix + ':');
    }
    return false;
  }

  clear() {
    this.listeners.clear();
  }
}
`,
    testCode: `import assert from 'node:assert/strict';
import { TelemetryEventBus } from './engine.js';

console.log('⚡ [Unit #373 Test Suite] Testing Wildcard Event Bus...');

// Test 1: Exact and wildcard matching
{
  const bus = new TelemetryEventBus();
  const received = [];

  bus.on('sensor:voltage', (data) => received.push(['exact', data]));
  bus.on('sensor:*', (data) => received.push(['wildcard', data]));
  bus.on('*', (data) => received.push(['all', data]));

  const count = bus.emit('sensor:voltage', 12.4);
  assert.equal(count, 3);
  assert.equal(received.length, 3);

  const count2 = bus.emit('sensor:temp', 45);
  assert.equal(count2, 2); // wildcard and all
  console.log('  ✔ Exact and wildcard topic matching verified');
}

// Test 2: Once and unsubscribe
{
  const bus = new TelemetryEventBus();
  let calls = 0;
  bus.once('ping', () => calls++);
  bus.emit('ping', 1);
  bus.emit('ping', 2);
  assert.equal(calls, 1);
  console.log('  ✔ One-time listener lifecycle verified');
}
`
  }
];
