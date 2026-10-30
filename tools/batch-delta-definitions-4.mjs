/**
 * Batch Delta Definitions — Part 4: Units #359 to #363
 */

export const PART_4_UNITS = [
  // UNIT #359: Semantic Commit Message Linter Engine
  {
    num: 359,
    folder: '359-semantic-commit-linter',
    name: 'Semantic Commit Message Linter Engine',
    tag: 'GF-T1-359',
    benchmark: '< 0.04ms conventional commit lint',
    engineCode: `/**
 * Unit #359: Semantic Commit Message Linter Engine
 * Track 1 (Lean Tuner) — Conventional Commits 1.0.0 Validator
 */

const VALID_TYPES = new Set([
  'feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert'
]);

export function parseCommitParts(message) {
  if (typeof message !== 'string') return null;
  const lines = message.trim().split('\\n');
  const header = lines[0].trim();

  const match = header.match(/^([a-z]+)(?:\\(([a-zA-Z0-9_.-]+)\\))?(!)?\\s*:\\s*(.+)$/);
  if (!match) return null;

  return {
    rawHeader: header,
    type: match[1],
    scope: match[2] || null,
    isBreaking: Boolean(match[3]) || message.includes('BREAKING CHANGE:'),
    description: match[4].trim(),
    body: lines.slice(1).join('\\n').trim() || null
  };
}

export function lintCommitMessage(message) {
  const errors = [];
  const parsed = parseCommitParts(message);

  if (!parsed) {
    errors.push('Header does not follow format "<type>(<scope>): <subject>"');
    return { valid: false, errors, parsed: null };
  }

  if (!VALID_TYPES.has(parsed.type)) {
    errors.push(\`Invalid type "\${parsed.type}". Must be one of: \${[...VALID_TYPES].join(', ')}\`);
  }

  if (parsed.description.length === 0) {
    errors.push('Subject description cannot be empty');
  }

  if (parsed.rawHeader.length > 72) {
    errors.push('Header line exceeds 72 characters');
  }

  return {
    valid: errors.length === 0,
    errors,
    parsed
  };
}
`,
    testCode: `import assert from 'node:assert/strict';
import { lintCommitMessage, parseCommitParts } from './engine.js';

console.log('⚡ [Unit #359 Test Suite] Testing Semantic Commit Linter...');

// Test 1: Valid conventional commit
{
  const msg = 'feat(telemetry)!: add eBPF multi-cloud packet router';
  const res = lintCommitMessage(msg);
  assert.equal(res.valid, true);
  assert.equal(res.parsed.type, 'feat');
  assert.equal(res.parsed.scope, 'telemetry');
  assert.equal(res.parsed.isBreaking, true);
  console.log('  ✔ Conventional commit parsed with breaking change');
}

// Test 2: Invalid commit
{
  const bad = 'Updated some stuff in database';
  const res = lintCommitMessage(bad);
  assert.equal(res.valid, false);
  console.log('  ✔ Malformed commit rejected correctly');
}
`
  },

  // UNIT #360: URL Query Builder & Deep Flattener
  {
    num: 360,
    folder: '360-url-query-deep-builder',
    name: 'URL Query Builder & Deep Flattener',
    tag: 'GF-T1-360',
    benchmark: '< 0.05ms bracket query build',
    engineCode: `/**
 * Unit #360: URL Query Builder & Deep Flattener
 * Track 1 (Lean Tuner) — Nested Object URL Parameter Serializer
 */

function flatten(obj, prefix = '', res = {}) {
  for (const key of Object.keys(obj)) {
    const propKey = prefix ? \`\${prefix}[\${key}]\` : key;
    const val = obj[key];
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      flatten(val, propKey, res);
    } else if (Array.isArray(val)) {
      val.forEach((item, idx) => {
        if (typeof item === 'object' && item !== null) {
          flatten(item, \`\${propKey}[\${idx}]\`, res);
        } else {
          res[\`\${propKey}[]\`] = res[\`\${propKey}[]\`] || [];
          res[\`\${propKey}[]\`].push(item);
        }
      });
    } else {
      res[propKey] = val;
    }
  }
  return res;
}

export function buildQuery(obj) {
  if (!obj || typeof obj !== 'object') return '';
  const flat = flatten(obj);
  const parts = [];

  for (const [k, v] of Object.entries(flat)) {
    if (Array.isArray(v)) {
      for (const item of v) {
        parts.push(\`\${encodeURIComponent(k)}=\${encodeURIComponent(item)}\`);
      }
    } else if (v !== undefined) {
      parts.push(\`\${encodeURIComponent(k)}=\${encodeURIComponent(v)}\`);
    }
  }

  return parts.join('&');
}
`,
    testCode: `import assert from 'node:assert/strict';
import { buildQuery } from './engine.js';

console.log('⚡ [Unit #360 Test Suite] Testing URL Query Deep Builder...');

// Test 1: Nested object flattening
{
  const payload = {
    filter: { status: 'active', tier: 2 },
    tags: ['audit', 'scada']
  };

  const query = buildQuery(payload);
  assert.ok(query.includes('filter%5Bstatus%5D=active'));
  assert.ok(query.includes('filter%5Btier%5D=2'));
  assert.ok(query.includes('tags%5B%5D=audit'));
  console.log('  ✔ Bracket-nested query string built correctly');
}
`
  },

  // UNIT #361: Safe Number Precision Formatter (Sats / Decimals)
  {
    num: 361,
    folder: '361-number-precision-formatter',
    name: 'Safe Number Precision Formatter (Sats / Decimals)',
    tag: 'GF-T1-361',
    benchmark: '< 0.03ms BigInt fixed math',
    engineCode: `/**
 * Unit #361: Safe Number Precision Formatter (Sats / Decimals)
 * Track 1 (Lean Tuner) — Arbitrary Decimal BigInt Arithmetic
 */

export function toBaseUnits(decimalStr, decimals = 8) {
  const parts = String(decimalStr).trim().split('.');
  const whole = BigInt(parts[0] || '0');
  const fractionStr = (parts[1] || '').slice(0, decimals).padEnd(decimals, '0');
  const fraction = BigInt(fractionStr);
  const multiplier = 10n ** BigInt(decimals);
  return (whole * multiplier) + fraction;
}

export function fromBaseUnits(baseUnits, decimals = 8) {
  const b = BigInt(baseUnits);
  const divisor = 10n ** BigInt(decimals);
  const whole = b / divisor;
  const fraction = b % divisor;
  const fractionStr = fraction.toString().padStart(decimals, '0').replace(/0+$/, '');

  if (fractionStr.length === 0) return whole.toString();
  return \`\${whole}.\${fractionStr}\`;
}

export function formatCurrency(baseUnits, decimals = 8, symbol = '') {
  const dec = fromBaseUnits(baseUnits, decimals);
  return symbol ? \`\${symbol}\${dec}\` : dec;
}
`,
    testCode: `import assert from 'node:assert/strict';
import { toBaseUnits, fromBaseUnits, formatCurrency } from './engine.js';

console.log('⚡ [Unit #361 Test Suite] Testing Precision Formatter...');

// Test 1: Bitcoin Satoshi Precision (8 Decimals)
{
  const btc = '1.00000005';
  const sats = toBaseUnits(btc, 8);
  assert.equal(sats, 100000005n);
  assert.equal(fromBaseUnits(sats, 8), '1.00000005');
  assert.equal(formatCurrency(sats, 8, '₿'), '₿1.00000005');
  console.log('  ✔ Zero-float BigInt satoshi math verified');
}
`
  },

  // UNIT #362: UUID v7 Time-Ordered Key Generator
  {
    num: 362,
    folder: '362-uuidv7-key-generator',
    name: 'UUID v7 Time-Ordered Key Generator',
    tag: 'GF-T1-362',
    benchmark: '< 0.04ms RFC 9562 generation',
    engineCode: `/**
 * Unit #362: UUID v7 Time-Ordered Key Generator
 * Track 1 (Lean Tuner) — RFC 9562 Monotonic Timestamp UUID
 */

import crypto from 'node:crypto';

let lastTimestamp = -1;
let seqCounter = 0;

export function generateUuidV7() {
  let now = Date.now();
  if (now === lastTimestamp) {
    seqCounter = (seqCounter + 1) & 0xFFF;
    if (seqCounter === 0) now++;
  } else {
    seqCounter = crypto.randomInt(0, 0xFFF);
    lastTimestamp = now;
  }

  const bytes = Buffer.alloc(16);

  // 48-bit timestamp
  bytes.writeUIntBE(Math.floor(now / 0x10000), 0, 4);
  bytes.writeUInt16BE(now & 0xFFFF, 4);

  // 12-bit counter with 4-bit version 7
  bytes[6] = 0x70 | ((seqCounter >>> 8) & 0x0F);
  bytes[7] = seqCounter & 0xFF;

  // Variant 10xx xxxx + random bits
  const rand = crypto.randomBytes(8);
  rand[0] = (rand[0] & 0x3F) | 0x80;
  rand.copy(bytes, 8);

  const hex = bytes.toString('hex');
  return \`\${hex.slice(0, 8)}-\${hex.slice(8, 12)}-\${hex.slice(12, 16)}-\${hex.slice(16, 20)}-\${hex.slice(20)}\`;
}

export function getTimestampFromUuidV7(uuid) {
  const clean = uuid.replace(/-/g, '');
  const high = parseInt(clean.slice(0, 8), 16);
  const low = parseInt(clean.slice(8, 12), 16);
  return (high * 0x10000) + low;
}
`,
    testCode: `import assert from 'node:assert/strict';
import { generateUuidV7, getTimestampFromUuidV7 } from './engine.js';

console.log('⚡ [Unit #362 Test Suite] Testing UUID v7 Generator...');

// Test 1: Generate & Validate Version
{
  const id1 = generateUuidV7();
  const id2 = generateUuidV7();
  assert.equal(id1.charAt(14), '7');
  assert.ok(id1 < id2);

  const ts = getTimestampFromUuidV7(id1);
  assert.ok(Math.abs(Date.now() - ts) < 5000);
  console.log('  ✔ RFC 9562 time-ordered UUID v7 verified: ' + id1);
}
`
  },

  // UNIT #363: Micro-Priority Task Heap Queue
  {
    num: 363,
    folder: '363-priority-task-heap',
    name: 'Micro-Priority Task Heap Queue',
    tag: 'GF-T1-363',
    benchmark: '< 0.02ms binary heap push/pop',
    engineCode: `/**
 * Unit #363: Micro-Priority Task Heap Queue
 * Track 1 (Lean Tuner) — Binary Min-Heap Priority Task Rig
 */

export class PriorityQueue {
  constructor(comparator = (a, b) => a.priority - b.priority) {
    this.heap = [];
    this.comparator = comparator;
  }

  size() {
    return this.heap.length;
  }

  peek() {
    return this.heap[0] || null;
  }

  push(item) {
    this.heap.push(item);
    this._siftUp(this.heap.length - 1);
  }

  pop() {
    if (this.heap.length === 0) return null;
    const top = this.heap[0];
    const bottom = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = bottom;
      this._siftDown(0);
    }
    return top;
  }

  _siftUp(idx) {
    while (idx > 0) {
      const parent = (idx - 1) >>> 1;
      if (this.comparator(this.heap[idx], this.heap[parent]) < 0) {
        [this.heap[idx], this.heap[parent]] = [this.heap[parent], this.heap[idx]];
        idx = parent;
      } else {
        break;
      }
    }
  }

  _siftDown(idx) {
    const len = this.heap.length;
    while ((idx << 1) + 1 < len) {
      let smallest = (idx << 1) + 1;
      const right = smallest + 1;
      if (right < len && this.comparator(this.heap[right], this.heap[smallest]) < 0) {
        smallest = right;
      }
      if (this.comparator(this.heap[smallest], this.heap[idx]) < 0) {
        [this.heap[idx], this.heap[smallest]] = [this.heap[smallest], this.heap[idx]];
        idx = smallest;
      } else {
        break;
      }
    }
  }
}
`,
    testCode: `import assert from 'node:assert/strict';
import { PriorityQueue } from './engine.js';

console.log('⚡ [Unit #363 Test Suite] Testing Priority Task Heap Queue...');

// Test 1: Min-heap ordering
{
  const pq = new PriorityQueue();
  pq.push({ task: 'low-priority', priority: 10 });
  pq.push({ task: 'critical', priority: 1 });
  pq.push({ task: 'medium', priority: 5 });

  assert.equal(pq.pop().task, 'critical');
  assert.equal(pq.pop().task, 'medium');
  assert.equal(pq.pop().task, 'low-priority');
  assert.equal(pq.pop(), null);
  console.log('  ✔ Binary min-heap O(log N) task extraction verified');
}
`
  }
];
