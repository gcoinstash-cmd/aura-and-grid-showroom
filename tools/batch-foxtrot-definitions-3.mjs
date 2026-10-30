/**
 * Batch Foxtrot Definitions — Part 3: Units #396 to #400
 * Canonical querystring sorter, Prometheus metric formatter, IP subnet overlap, JSON chunk accumulator, Debounce & Throttle
 */

export const PART_3_UNITS = [
  // UNIT #396: Canonical Query String Sorter & Signature Rig
  {
    num: 396,
    folder: '396-canonical-querystring-sorter',
    name: 'Canonical Query String Sorter & Signature Rig',
    tag: 'GF-T1-396',
    benchmark: '< 0.01ms querystring canonicalization',
    engineCode: `/**
 * Unit #396: Canonical Query String Sorter & Signature Rig
 * Track 1 (Lean Tuner) — RFC 3986 Deterministic Query String Canonicalizer
 */

function encodeRfc3986(str) {
  return encodeURIComponent(str).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

export function canonicalizeQuery(input) {
  let params = [];

  if (typeof input === 'string') {
    const raw = input.startsWith('?') ? input.slice(1) : input;
    if (!raw) return '';
    const searchParams = new URLSearchParams(raw);
    for (const [k, v] of searchParams.entries()) {
      params.push([k, v]);
    }
  } else if (input && typeof input === 'object') {
    for (const [k, v] of Object.entries(input)) {
      if (Array.isArray(v)) {
        for (const item of v) {
          params.push([k, String(item)]);
        }
      } else if (v !== undefined && v !== null) {
        params.push([k, String(v)]);
      }
    }
  }

  // Sort primarily by key, secondarily by value
  params.sort((a, b) => {
    const kCmp = a[0].localeCompare(b[0]);
    if (kCmp !== 0) return kCmp;
    return a[1].localeCompare(b[1]);
  });

  return params
    .map(([k, v]) => \`\${encodeRfc3986(k)}=\${encodeRfc3986(v)}\`)
    .join('&');
}
`,
    testCode: `import assert from 'node:assert/strict';
import { canonicalizeQuery } from './engine.js';

console.log('⚡ [Unit #396 Test Suite] Testing Canonical Query String Sorter...');

// Test 1: Out-of-order query string
{
  const qs = 'z=1&a=hello%20world&m=test&a=alpha';
  const canonical = canonicalizeQuery(qs);
  assert.equal(canonical, 'a=alpha&a=hello%20world&m=test&z=1');
  console.log('  ✔ Lexicographical query string sorting verified');
}

// Test 2: Object input with arrays
{
  const obj = { gamma: 3, beta: ['two', 'one'], alpha: 'first' };
  const canonical = canonicalizeQuery(obj);
  assert.equal(canonical, 'alpha=first&beta=one&beta=two&gamma=3');
  console.log('  ✔ Object canonicalization with multi-value keys verified');
}
`
  },

  // UNIT #397: OpenMetrics & Prometheus Text Exposition Formatter
  {
    num: 397,
    folder: '397-prometheus-metric-formatter',
    name: 'OpenMetrics & Prometheus Text Exposition Formatter',
    tag: 'GF-T1-397',
    benchmark: '< 0.01ms metric serialization',
    engineCode: `/**
 * Unit #397: OpenMetrics & Prometheus Text Exposition Formatter
 * Track 1 (Lean Tuner) — Prometheus Exposition Line Protocol Serializer
 */

export function formatMetric(name, value, labels = {}, help = null, type = 'gauge') {
  if (typeof name !== 'string' || !name) {
    throw new TypeError('Metric name must be a non-empty string');
  }

  const lines = [];
  if (help) {
    lines.push(\`# HELP \${name} \${help}\`);
  }
  if (type) {
    lines.push(\`# TYPE \${name} \${type}\`);
  }

  const labelKeys = Object.keys(labels).sort();
  let labelStr = '';
  if (labelKeys.length > 0) {
    const parts = labelKeys.map(k => {
      const escapedVal = String(labels[k])
        .replace(/\\\\/g, '\\\\\\\\')
        .replace(/\\n/g, '\\\\n')
        .replace(/"/g, '\\\\"');
      return \`\${k}="\${escapedVal}"\`;
    });
    labelStr = \`{\${parts.join(',')}}\`;
  }

  lines.push(\`\${name}\${labelStr} \${value}\`);
  return lines.join('\\n');
}

export function formatMetricsBatch(metrics) {
  if (!Array.isArray(metrics)) return '';
  return metrics.map(m => formatMetric(m.name, m.value, m.labels, m.help, m.type)).join('\\n') + '\\n';
}
`,
    testCode: `import assert from 'node:assert/strict';
import { formatMetric, formatMetricsBatch } from './engine.js';

console.log('⚡ [Unit #397 Test Suite] Testing Prometheus Metric Formatter...');

// Test 1: Single metric with labels and help
{
  const out = formatMetric('fleet_telemetry_latency_ms', 12.4, { cluster: '008', track: '1' }, 'Telemetry latency in milliseconds', 'gauge');
  assert.ok(out.includes('# HELP fleet_telemetry_latency_ms'));
  assert.ok(out.includes('# TYPE fleet_telemetry_latency_ms gauge'));
  assert.ok(out.includes('fleet_telemetry_latency_ms{cluster="008",track="1"} 12.4'));
  console.log('  ✔ Prometheus standard line formatting verified');
}

// Test 2: Batch formatting
{
  const batch = [
    { name: 'requests_total', value: 1050, labels: { method: 'POST' }, type: 'counter' },
    { name: 'active_sessions', value: 42, labels: {}, type: 'gauge' }
  ];
  const rendered = formatMetricsBatch(batch);
  assert.ok(rendered.includes('requests_total{method="POST"} 1050'));
  assert.ok(rendered.includes('active_sessions 42'));
  console.log('  ✔ Prometheus batch output verified');
}
`
  },

  // UNIT #398: IPv4 CIDR Subnet Overlap & Inclusion Detector
  {
    num: 398,
    folder: '398-ip-subnet-overlap-detector',
    name: 'IPv4 CIDR Subnet Overlap & Inclusion Detector',
    tag: 'GF-T1-398',
    benchmark: '< 0.005ms bitwise IP subnet evaluation',
    engineCode: `/**
 * Unit #398: IPv4 CIDR Subnet Overlap & Inclusion Detector
 * Track 1 (Lean Tuner) — Bitwise IPv4 Network Range Evaluator
 */

export function ipToInt(ip) {
  const octets = ip.split('.').map(Number);
  if (octets.length !== 4 || octets.some(o => Number.isNaN(o) || o < 0 || o > 255)) {
    throw new Error(\`Invalid IPv4 address '\${ip}'\`);
  }
  return ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0;
}

export function intToIp(int) {
  return [
    (int >>> 24) & 255,
    (int >>> 16) & 255,
    (int >>> 8) & 255,
    int & 255
  ].join('.');
}

export function parseCidr(cidr) {
  const [ipStr, maskStr = '32'] = cidr.split('/');
  const prefix = parseInt(maskStr, 10);
  if (Number.isNaN(prefix) || prefix < 0 || prefix > 32) {
    throw new Error(\`Invalid CIDR prefix '\${maskStr}'\`);
  }

  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  const ip = ipToInt(ipStr);
  const network = (ip & mask) >>> 0;
  const broadcast = (network | ~mask) >>> 0;

  return {
    cidr,
    prefix,
    networkInt: network,
    broadcastInt: broadcast,
    startIp: intToIp(network),
    endIp: intToIp(broadcast),
    totalIps: Math.pow(2, 32 - prefix)
  };
}

export function subnetsOverlap(cidrA, cidrB) {
  const subA = parseCidr(cidrA);
  const subB = parseCidr(cidrB);

  return subA.networkInt <= subB.broadcastInt && subB.networkInt <= subA.broadcastInt;
}

export function subnetContains(parentCidr, target) {
  const parent = parseCidr(parentCidr);
  const targetInt = target.includes('/') ? parseCidr(target).networkInt : ipToInt(target);

  if (target.includes('/')) {
    const child = parseCidr(target);
    return parent.networkInt <= child.networkInt && parent.broadcastInt >= child.broadcastInt;
  }

  return targetInt >= parent.networkInt && targetInt <= parent.broadcastInt;
}
`,
    testCode: `import assert from 'node:assert/strict';
import { parseCidr, subnetsOverlap, subnetContains } from './engine.js';

console.log('⚡ [Unit #398 Test Suite] Testing IP Subnet Overlap Detector...');

// Test 1: Subnet overlapping
{
  assert.equal(subnetsOverlap('10.0.0.0/16', '10.0.1.0/24'), true);
  assert.equal(subnetsOverlap('10.0.0.0/24', '10.0.1.0/24'), false);
  assert.equal(subnetsOverlap('192.168.1.0/24', '192.168.0.0/16'), true);
  console.log('  ✔ CIDR overlap detection verified');
}

// Test 2: Subnet containment
{
  assert.equal(subnetContains('10.0.0.0/16', '10.0.50.1'), true);
  assert.equal(subnetContains('10.0.0.0/16', '10.1.0.1'), false);
  assert.equal(subnetContains('10.0.0.0/16', '10.0.2.0/24'), true);
  console.log('  ✔ IP and CIDR subnet containment verified');
}
`
  },

  // UNIT #399: Streaming JSON Chunk Buffer & Balanced Object Framer
  {
    num: 399,
    folder: '399-json-chunk-accumulator',
    name: 'Streaming JSON Chunk Buffer & Balanced Object Framer',
    tag: 'GF-T1-399',
    benchmark: '< 0.02ms chunk balance and parse',
    engineCode: `/**
 * Unit #399: Streaming JSON Chunk Buffer & Balanced Object Framer
 * Track 1 (Lean Tuner) — Brace-Balancing Stream Chunk Reassembler
 */

export class JsonChunkAccumulator {
  constructor() {
    this.buffer = '';
  }

  feed(chunk) {
    this.buffer += String(chunk);
    const parsedObjects = [];
    let startIdx = -1;
    let depth = 0;
    let inString = false;
    let isEscaped = false;

    for (let i = 0; i < this.buffer.length; i++) {
      const char = this.buffer[i];

      if (inString) {
        if (isEscaped) {
          isEscaped = false;
        } else if (char === '\\\\') {
          isEscaped = true;
        } else if (char === '"') {
          inString = false;
        }
        continue;
      }

      if (char === '"') {
        inString = true;
        continue;
      }

      if (char === '{' || char === '[') {
        if (depth === 0) startIdx = i;
        depth++;
      } else if (char === '}' || char === ']') {
        depth--;
        if (depth === 0 && startIdx !== -1) {
          const jsonSubstring = this.buffer.slice(startIdx, i + 1);
          try {
            parsedObjects.push(JSON.parse(jsonSubstring));
            this.buffer = this.buffer.slice(i + 1);
            i = -1; // reset pointer to search next object in remaining buffer
            startIdx = -1;
          } catch {
            // keep accumulating if malformed
          }
        }
      }
    }

    return parsedObjects;
  }

  clear() {
    this.buffer = '';
  }
}
`,
    testCode: `import assert from 'node:assert/strict';
import { JsonChunkAccumulator } from './engine.js';

console.log('⚡ [Unit #399 Test Suite] Testing JSON Chunk Accumulator...');

// Test 1: Fragmented JSON chunks
{
  const acc = new JsonChunkAccumulator();
  const chunk1 = '{"telemetry": "start", "payl';
  const chunk2 = 'oad": [1, 2, 3]} {"next": true} trailing';

  const res1 = acc.feed(chunk1);
  assert.equal(res1.length, 0);

  const res2 = acc.feed(chunk2);
  assert.equal(res2.length, 2);
  assert.deepEqual(res2[0], { telemetry: 'start', payload: [1, 2, 3] });
  assert.deepEqual(res2[1], { next: true });
  console.log('  ✔ Stream chunk balancing & multi-object parsing passed');
}
`
  },

  // UNIT #400: High-Precision Debounce & Throttle Rate Controller
  {
    num: 400,
    folder: '400-debounce-throttle-controller',
    name: 'High-Precision Debounce & Throttle Rate Controller',
    tag: 'GF-T1-400',
    benchmark: '< 0.005ms timer schedule',
    engineCode: `/**
 * Unit #400: High-Precision Debounce & Throttle Rate Controller
 * Track 1 (Lean Tuner) — Zero-Dependency Rate Limiting Wrappers
 */

export function debounce(fn, waitMs = 100) {
  let timeoutId = null;

  const debounced = function (...args) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      timeoutId = null;
      fn.apply(this, args);
    }, waitMs);
  };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}

export function throttle(fn, waitMs = 100) {
  let lastTime = 0;
  let timeoutId = null;
  let lastArgs = null;
  let lastThis = null;

  const throttled = function (...args) {
    const now = Date.now();
    const remaining = waitMs - (now - lastTime);

    lastArgs = args;
    lastThis = this;

    if (remaining <= 0 || remaining > waitMs) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastTime = now;
      fn.apply(this, args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastTime = Date.now();
        timeoutId = null;
        fn.apply(lastThis, lastArgs);
      }, remaining);
    }
  };

  throttled.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastTime = 0;
  };

  return throttled;
}
`,
    testCode: `import assert from 'node:assert/strict';
import { debounce, throttle } from './engine.js';

console.log('⚡ [Unit #400 Test Suite] Testing Debounce & Throttle Controller...');

// Test 1: Throttle leading execution
{
  let count = 0;
  const throttled = throttle(() => count++, 50);

  throttled();
  throttled();
  throttled();
  assert.equal(count, 1);
  throttled.cancel();
  console.log('  ✔ Throttle leading edge rate limit verified');
}

// Test 2: Debounce cancel
{
  let called = false;
  const debounced = debounce(() => { called = true; }, 50);
  debounced();
  debounced.cancel();
  assert.equal(called, false);
  console.log('  ✔ Debounce cancellation verified');
}
`
  }
];
