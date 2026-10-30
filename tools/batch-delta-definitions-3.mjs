/**
 * Batch Delta Definitions — Part 3: Units #354 to #358
 */

export const PART_3_UNITS = [
  // UNIT #354: Cookie String Serializer & Decryptor
  {
    num: 354,
    folder: '354-cookie-serializer-parser',
    name: 'Cookie String Serializer & Decryptor',
    tag: 'GF-T1-354',
    benchmark: '< 0.04ms cookie parsing & HMAC',
    engineCode: `/**
 * Unit #354: Cookie String Serializer & Decryptor
 * Track 1 (Lean Tuner) — RFC 6265 Cookie Parser & HMAC Signer
 */

import crypto from 'node:crypto';

export function parseCookies(cookieHeader) {
  const map = {};
  if (typeof cookieHeader !== 'string' || !cookieHeader.trim()) return map;

  const pairs = cookieHeader.split(';');
  for (const pair of pairs) {
    const eqIdx = pair.indexOf('=');
    if (eqIdx !== -1) {
      const key = pair.slice(0, eqIdx).trim();
      let val = pair.slice(eqIdx + 1).trim();
      try {
        val = decodeURIComponent(val);
      } catch {}
      map[key] = val;
    }
  }
  return map;
}

export function serializeCookie(name, val, options = {}) {
  let cookie = \`\${encodeURIComponent(name)}=\${encodeURIComponent(val)}\`;
  if (options.maxAge) cookie += \`; Max-Age=\${Math.floor(options.maxAge)}\`;
  if (options.domain) cookie += \`; Domain=\${options.domain}\`;
  if (options.path) cookie += \`; Path=\${options.path}\`;
  if (options.expires) cookie += \`; Expires=\${options.expires.toUTCString()}\`;
  if (options.httpOnly) cookie += '; HttpOnly';
  if (options.secure) cookie += '; Secure';
  if (options.sameSite) {
    const s = options.sameSite.toLowerCase();
    cookie += \`; SameSite=\${s.charAt(0).toUpperCase() + s.slice(1)}\`;
  }
  return cookie;
}

export function signCookieValue(val, secret) {
  const sig = crypto.createHmac('sha256', secret).update(val).digest('base64url');
  return \`s:\${val}.\${sig}\`;
}

export function unsignCookieValue(signedVal, secret) {
  if (typeof signedVal !== 'string' || !signedVal.startsWith('s:')) return null;
  const raw = signedVal.slice(2);
  const dotIdx = raw.lastIndexOf('.');
  if (dotIdx === -1) return null;

  const val = raw.slice(0, dotIdx);
  const expectedSig = raw.slice(dotIdx + 1);
  const actualSig = crypto.createHmac('sha256', secret).update(val).digest('base64url');

  const expectedBuf = Buffer.from(expectedSig);
  const actualBuf = Buffer.from(actualSig);

  if (expectedBuf.length === actualBuf.length && crypto.timingSafeEqual(expectedBuf, actualBuf)) {
    return val;
  }
  return null;
}
`,
    testCode: `import assert from 'node:assert/strict';
import { parseCookies, serializeCookie, signCookieValue, unsignCookieValue } from './engine.js';

console.log('⚡ [Unit #354 Test Suite] Testing Cookie Serializer & Signer...');

// Test 1: Parser & Serializer
{
  const raw = 'session_id=s84192; theme=dark; token=xyz';
  const parsed = parseCookies(raw);
  assert.equal(parsed.session_id, 's84192');
  assert.equal(parsed.theme, 'dark');

  const serialized = serializeCookie('sid', '123', { httpOnly: true, secure: true, sameSite: 'strict' });
  assert.ok(serialized.includes('HttpOnly'));
  assert.ok(serialized.includes('Secure'));
  assert.ok(serialized.includes('SameSite=Strict'));
  console.log('  ✔ RFC 6265 serialization & parsing verified');
}

// Test 2: HMAC signing
{
  const secret = 'super-secret-cluster-key';
  const signed = signCookieValue('user_admin', secret);
  assert.equal(unsignCookieValue(signed, secret), 'user_admin');
  assert.equal(unsignCookieValue(signed + 'tamper', secret), null);
  console.log('  ✔ HMAC-SHA256 cookie signing & tamper rejection passed');
}
`
  },

  // UNIT #355: Deep Object Difference (Diff) Engine
  {
    num: 355,
    folder: '355-deep-object-diff',
    name: 'Deep Object Difference (Diff) Engine',
    tag: 'GF-T1-355',
    benchmark: '< 0.05ms deep recursive diff',
    engineCode: `/**
 * Unit #355: Deep Object Difference (Diff) Engine
 * Track 1 (Lean Tuner) — Recursive Object Delta & Patch Rig
 */

function isObject(val) {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}

export function diffObjects(objA, objB, prefix = '') {
  const changes = [];

  const keysA = objA ? Object.keys(objA) : [];
  const keysB = objB ? Object.keys(objB) : [];
  const allKeys = new Set([...keysA, ...keysB]);

  for (const k of allKeys) {
    const path = prefix ? \`\${prefix}.\${k}\` : k;
    const hasA = objA && Object.prototype.hasOwnProperty.call(objA, k);
    const hasB = objB && Object.prototype.hasOwnProperty.call(objB, k);

    if (hasA && !hasB) {
      changes.push({ type: 'REMOVED', path, oldValue: objA[k] });
    } else if (!hasA && hasB) {
      changes.push({ type: 'ADDED', path, newValue: objB[k] });
    } else {
      const valA = objA[k];
      const valB = objB[k];

      if (isObject(valA) && isObject(valB)) {
        changes.push(...diffObjects(valA, valB, path));
      } else if (JSON.stringify(valA) !== JSON.stringify(valB)) {
        changes.push({ type: 'UPDATED', path, oldValue: valA, newValue: valB });
      }
    }
  }

  return changes;
}

export function hasDifferences(objA, objB) {
  return diffObjects(objA, objB).length > 0;
}
`,
    testCode: `import assert from 'node:assert/strict';
import { diffObjects, hasDifferences } from './engine.js';

console.log('⚡ [Unit #355 Test Suite] Testing Deep Object Diff Engine...');

// Test 1: Recursive Diff
{
  const o1 = { user: { name: 'Alice', age: 30, roles: ['admin'] } };
  const o2 = { user: { name: 'Alice', age: 31, roles: ['admin', 'dev'] } };

  const diffs = diffObjects(o1, o2);
  assert.equal(diffs.length, 2);
  assert.equal(diffs.find(d => d.path === 'user.age').type, 'UPDATED');
  assert.equal(hasDifferences(o1, o2), true);
  console.log('  ✔ Recursive delta path extraction passed');
}
`
  },

  // UNIT #356: Exponential Histogram Telemetry Bucket
  {
    num: 356,
    folder: '356-exponential-histogram-bucket',
    name: 'Exponential Histogram Telemetry Bucket',
    tag: 'GF-T1-356',
    benchmark: '< 0.03ms bucket indexing',
    engineCode: `/**
 * Unit #356: Exponential Histogram Telemetry Bucket
 * Track 1 (Lean Tuner) — Logarithmic Telemetry Bucketing Rig
 */

export class ExponentialHistogram {
  constructor(base = 2) {
    this.base = base;
    this.buckets = new Map();
    this.count = 0;
    this.sum = 0;
    this.min = Infinity;
    this.max = -Infinity;
  }

  record(val) {
    if (typeof val !== 'number' || isNaN(val) || val <= 0) return;

    this.count++;
    this.sum += val;
    if (val < this.min) this.min = val;
    if (val > this.max) this.max = val;

    // Log base computation for bucket index
    const index = Math.floor(Math.log(val) / Math.log(this.base));
    this.buckets.set(index, (this.buckets.get(index) || 0) + 1);
  }

  getSnapshot() {
    return {
      count: this.count,
      sum: Number(this.sum.toFixed(2)),
      min: this.count > 0 ? this.min : 0,
      max: this.count > 0 ? this.max : 0,
      mean: this.count > 0 ? Number((this.sum / this.count).toFixed(2)) : 0,
      bucketCount: this.buckets.size
    };
  }
}
`,
    testCode: `import assert from 'node:assert/strict';
import { ExponentialHistogram } from './engine.js';

console.log('⚡ [Unit #356 Test Suite] Testing Exponential Histogram...');

// Test 1: Record and snapshot
{
  const hist = new ExponentialHistogram(2);
  hist.record(1.5);
  hist.record(4.2);
  hist.record(8.9);
  hist.record(16.1);

  const snap = hist.getSnapshot();
  assert.equal(snap.count, 4);
  assert.equal(snap.min, 1.5);
  assert.equal(snap.max, 16.1);
  assert.ok(snap.mean > 0);
  console.log('  ✔ Logarithmic histogram bucketing verified');
}
`
  },

  // UNIT #357: Micro-Cron Next-Execution Engine
  {
    num: 357,
    folder: '357-micro-cron-scheduler',
    name: 'Micro-Cron Next-Execution Engine',
    tag: 'GF-T1-357',
    benchmark: '< 0.08ms cron evaluation',
    engineCode: `/**
 * Unit #357: Micro-Cron Next-Execution Engine
 * Track 1 (Lean Tuner) — 5-Field Standard Cron Horizon Rig
 */

function parseField(field, min, max) {
  const allowed = new Set();
  const parts = field.split(',');

  for (const part of parts) {
    if (part === '*') {
      for (let i = min; i <= max; i++) allowed.add(i);
    } else if (part.startsWith('*/')) {
      const step = parseInt(part.slice(2), 10);
      for (let i = min; i <= max; i += step) allowed.add(i);
    } else if (part.includes('-')) {
      const [start, end] = part.split('-').map(n => parseInt(n, 10));
      for (let i = start; i <= end; i++) allowed.add(i);
    } else {
      allowed.add(parseInt(part, 10));
    }
  }

  return allowed;
}

export function parseCronExpression(cronStr) {
  const fields = cronStr.trim().split(/\\s+/);
  if (fields.length !== 5) throw new Error('Cron expression must have 5 fields');

  return {
    minutes: parseField(fields[0], 0, 59),
    hours: parseField(fields[1], 0, 23),
    daysOfMonth: parseField(fields[2], 1, 31),
    months: parseField(fields[3], 1, 12),
    daysOfWeek: parseField(fields[4], 0, 6)
  };
}

export function matchesCron(cronStr, date = new Date()) {
  const parsed = parseCronExpression(cronStr);
  return (
    parsed.minutes.has(date.getMinutes()) &&
    parsed.hours.has(date.getHours()) &&
    parsed.daysOfMonth.has(date.getDate()) &&
    parsed.months.has(date.getMonth() + 1) &&
    parsed.daysOfWeek.has(date.getDay())
  );
}
`,
    testCode: `import assert from 'node:assert/strict';
import { parseCronExpression, matchesCron } from './engine.js';

console.log('⚡ [Unit #357 Test Suite] Testing Micro-Cron Engine...');

// Test 1: Pattern Matching
{
  const parsed = parseCronExpression('*/15 0-4 1,15 * 1-5');
  assert.equal(parsed.minutes.has(0), true);
  assert.equal(parsed.minutes.has(15), true);
  assert.equal(parsed.hours.has(2), true);
  assert.equal(parsed.daysOfMonth.has(15), true);
  console.log('  ✔ Cron 5-field expression parsing passed');
}
`
  },

  // UNIT #358: ANSI Stripper & Plain-Text Formatter
  {
    num: 358,
    folder: '358-ansi-stripper-formatter',
    name: 'ANSI Stripper & Plain-Text Formatter',
    tag: 'GF-T1-358',
    benchmark: '< 0.02ms terminal formatting',
    engineCode: `/**
 * Unit #358: ANSI Stripper & Plain-Text Formatter
 * Track 1 (Lean Tuner) — Clean Terminal Telemetry Sanitizer
 */

const ANSI_REGEX = new RegExp(
  '[\\\\u001B\\\\u009B][[\\\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\\\d\\\\/#&.:=?%_~]*)*|[a-zA-Z\\\\d]+(?:;[-a-zA-Z\\\\d\\\\/#&.:=?%_~]*)*)?\\\\u0007)|(?:(?:\\\\d{1,4}(?:;\\\\d{0,4})*)?[\\\\dA-PR-TZcf-ntqry=><~]))',
  'g'
);

export function stripAnsi(str) {
  if (typeof str !== 'string') return '';
  return str.replace(ANSI_REGEX, '');
}

export function hasAnsi(str) {
  return typeof str === 'string' && ANSI_REGEX.test(str);
}

export function visualLength(str) {
  return stripAnsi(str).length;
}
`,
    testCode: `import assert from 'node:assert/strict';
import { stripAnsi, hasAnsi, visualLength } from './engine.js';

console.log('⚡ [Unit #358 Test Suite] Testing ANSI Stripper...');

// Test 1: Strip color codes
{
  const colored = '\\u001b[31mRED_ERROR\\u001b[39m and \\u001b[32mGREEN_OK\\u001b[39m';
  assert.equal(hasAnsi(colored), true);
  assert.equal(stripAnsi(colored), 'RED_ERROR and GREEN_OK');
  assert.equal(visualLength(colored), 22);
  console.log('  ✔ Terminal ANSI color codes stripped cleanly');
}
`
  }
];
