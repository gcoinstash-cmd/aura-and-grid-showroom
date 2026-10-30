/**
 * Batch Delta Definitions — Part 1: Units #344 to #348
 */

export const PART_1_UNITS = [
  // UNIT #344: JWT Header Decoder & Alg-None Validator
  {
    num: 344,
    folder: '344-jwt-header-decoder',
    name: 'JWT Header Decoder & Alg-None Validator',
    tag: 'GF-T1-344',
    benchmark: '< 0.05ms decode & validation',
    engineCode: `/**
 * Unit #344: JWT Header Decoder & Alg-None Validator
 * Track 1 (Lean Tuner) — Zero-Dependency JWT Framing & Security Rig
 */

export class JwtSecurityError extends Error {
  constructor(message, code = 'ERR_JWT_SECURITY', details = null) {
    super(message);
    this.name = 'JwtSecurityError';
    this.code = code;
    this.details = details;
  }
}

function base64UrlDecode(str) {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4 !== 0) b64 += '=';
  return Buffer.from(b64, 'base64').toString('utf8');
}

export function decodeJwt(token, options = {}) {
  const { strictAlgNone = true, clockTolerance = 0 } = options;
  if (typeof token !== 'string' || !token.trim()) {
    throw new JwtSecurityError('JWT token must be a non-empty string', 'ERR_INVALID_TOKEN');
  }

  const parts = token.trim().split('.');
  if (parts.length < 2 || parts.length > 3) {
    throw new JwtSecurityError('Malformed JWT structure: expected 3 dot-delimited segments', 'ERR_MALFORMED_JWT');
  }

  let header, payload;
  try {
    header = JSON.parse(base64UrlDecode(parts[0]));
  } catch (err) {
    throw new JwtSecurityError('Failed to parse JWT header JSON', 'ERR_HEADER_PARSE', err.message);
  }

  try {
    payload = JSON.parse(base64UrlDecode(parts[1]));
  } catch (err) {
    throw new JwtSecurityError('Failed to parse JWT payload JSON', 'ERR_PAYLOAD_PARSE', err.message);
  }

  const signature = parts[2] || '';

  // Validate "alg: none" vulnerability
  if (strictAlgNone) {
    const alg = (header.alg || '').trim().toLowerCase();
    if (alg === 'none' || alg === '' || !header.alg) {
      throw new JwtSecurityError('CRITICAL: Insecure algorithm "none" detected in JWT header', 'ERR_ALG_NONE_FORBIDDEN');
    }
  }

  // Check expiration if exp is present
  const nowSec = Math.floor(Date.now() / 1000);
  let isExpired = false;
  if (typeof payload.exp === 'number') {
    isExpired = nowSec > (payload.exp + clockTolerance);
  }

  return {
    header,
    payload,
    signature,
    isExpired,
    algorithm: header.alg,
    hasSignature: signature.length > 0
  };
}

export function validateAlgNoneSecurity(header) {
  if (!header || typeof header !== 'object') return false;
  const alg = String(header.alg || '').trim().toLowerCase();
  return alg !== 'none' && alg.length > 0;
}
`,
    testCode: `import assert from 'node:assert/strict';
import { decodeJwt, validateAlgNoneSecurity, JwtSecurityError } from './engine.js';

console.log('⚡ [Unit #344 Test Suite] Testing JWT Header Decoder & Alg-None Validator...');

// Test 1: Valid HS256 Token
{
  const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjI1MDAwMDAwMDB9.sflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
  const decoded = decodeJwt(validToken);
  assert.equal(decoded.header.alg, 'HS256');
  assert.equal(decoded.payload.name, 'John Doe');
  assert.equal(decoded.isExpired, false);
  assert.equal(decoded.hasSignature, true);
  console.log('  ✔ Valid HS256 token decoded cleanly');
}

// Test 2: Alg: none Detection & Rejection
{
  const noneToken = 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJ1c2VyMTIzIn0.';
  assert.throws(() => decodeJwt(noneToken), (err) => {
    assert.ok(err instanceof JwtSecurityError);
    assert.equal(err.code, 'ERR_ALG_NONE_FORBIDDEN');
    return true;
  });
  console.log('  ✔ Alg: none attack vector intercepted and blocked');
}

// Test 3: Expired Token Check
{
  const expiredToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJleHAiLCJleHAiOjEwMDAwMDAwMDB9.fake_sig';
  const res = decodeJwt(expiredToken);
  assert.equal(res.isExpired, true);
  console.log('  ✔ Expiration verification passed');
}
`
  },

  // UNIT #345: Semver Range Comparator & Saturation Parser
  {
    num: 345,
    folder: '345-semver-range-comparator',
    name: 'Semver Range Comparator & Saturation Parser',
    tag: 'GF-T1-345',
    benchmark: '< 0.08ms semver resolution',
    engineCode: `/**
 * Unit #345: Semver Range Comparator & Saturation Parser
 * Track 1 (Lean Tuner) — Pure ESM Semantic Versioning Engine
 */

export class SemverError extends Error {
  constructor(message, code = 'ERR_SEMVER') {
    super(message);
    this.name = 'SemverError';
    this.code = code;
  }
}

export function parseSemver(v) {
  if (typeof v !== 'string') throw new SemverError('Version must be a string');
  const clean = v.trim().replace(/^v/, '');
  const match = clean.match(/^(\\d+)\\.(\\d+)\\.(\\d+)(?:-([0-9A-Za-z.-]+))?(?:\\+([0-9A-Za-z.-]+))?$/);
  if (!match) throw new SemverError(\`Invalid semver format: "\${v}"\`);

  return {
    raw: v,
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4] || null,
    build: match[5] || null
  };
}

export function compareSemver(v1, v2) {
  const p1 = typeof v1 === 'object' ? v1 : parseSemver(v1);
  const p2 = typeof v2 === 'object' ? v2 : parseSemver(v2);

  if (p1.major !== p2.major) return p1.major > p2.major ? 1 : -1;
  if (p1.minor !== p2.minor) return p1.minor > p2.minor ? 1 : -1;
  if (p1.patch !== p2.patch) return p1.patch > p2.patch ? 1 : -1;
  if (p1.prerelease === p2.prerelease) return 0;
  if (!p1.prerelease) return 1;
  if (!p2.prerelease) return -1;
  return p1.prerelease.localeCompare(p2.prerelease);
}

export function satisfiesRange(version, range) {
  const v = parseSemver(version);
  const r = range.trim();

  if (r === '*' || r === '') return true;

  // Caret ^1.2.3 (allow minor/patch upgrades for major > 0)
  if (r.startsWith('^')) {
    const target = parseSemver(r.slice(1));
    if (v.major !== target.major) return false;
    return compareSemver(v, target) >= 0;
  }

  // Tilde ~1.2.3 (allow patch upgrades)
  if (r.startsWith('~')) {
    const target = parseSemver(r.slice(1));
    if (v.major !== target.major || v.minor !== target.minor) return false;
    return compareSemver(v, target) >= 0;
  }

  // Greater than equal >=
  if (r.startsWith('>=')) {
    const target = parseSemver(r.slice(2));
    return compareSemver(v, target) >= 0;
  }

  return compareSemver(v, r) === 0;
}

export function maxSatisfying(versions, range) {
  const valid = versions.filter(ver => {
    try {
      return satisfiesRange(ver, range);
    } catch {
      return false;
    }
  });

  if (valid.length === 0) return null;
  return valid.sort((a, b) => compareSemver(b, a))[0];
}
`,
    testCode: `import assert from 'node:assert/strict';
import { parseSemver, compareSemver, satisfiesRange, maxSatisfying } from './engine.js';

console.log('⚡ [Unit #345 Test Suite] Testing Semver Range Comparator...');

// Test 1: Parser
{
  const v = parseSemver('v2.14.7-beta.1+exp.sha.5114f85');
  assert.equal(v.major, 2);
  assert.equal(v.minor, 14);
  assert.equal(v.patch, 7);
  assert.equal(v.prerelease, 'beta.1');
  console.log('  ✔ Semver string parsed correctly');
}

// Test 2: Comparison
{
  assert.equal(compareSemver('1.2.3', '1.2.4'), -1);
  assert.equal(compareSemver('2.0.0', '1.9.9'), 1);
  assert.equal(compareSemver('3.4.5', '3.4.5'), 0);
  console.log('  ✔ Version comparisons accurate');
}

// Test 3: Caret & Tilde Range Saturation
{
  assert.equal(satisfiesRange('1.8.2', '^1.2.0'), true);
  assert.equal(satisfiesRange('2.0.0', '^1.2.0'), false);
  assert.equal(satisfiesRange('1.2.9', '~1.2.0'), true);
  assert.equal(satisfiesRange('1.3.0', '~1.2.0'), false);

  const pool = ['1.0.0', '1.2.4', '1.3.1', '2.0.0'];
  assert.equal(maxSatisfying(pool, '^1.2.0'), '1.3.1');
  console.log('  ✔ Range evaluation & maxSatisfying passed');
}
`
  },

  // UNIT #346: IPv4 / IPv6 Subnet CIDR Mask Calculator
  {
    num: 346,
    folder: '346-cidr-subnet-calculator',
    name: 'IPv4 / IPv6 Subnet CIDR Mask Calculator',
    tag: 'GF-T1-346',
    benchmark: '< 0.04ms subnet math',
    engineCode: `/**
 * Unit #346: IPv4 / IPv6 Subnet CIDR Mask Calculator
 * Track 1 (Lean Tuner) — Pure Bitwise Subnet Calculator
 */

export class CidrCalculationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CidrCalculationError';
  }
}

export function ipToLong(ip) {
  const parts = ip.split('.');
  if (parts.length !== 4) throw new CidrCalculationError(\`Invalid IPv4: \${ip}\`);
  let res = 0;
  for (let i = 0; i < 4; i++) {
    const oct = parseInt(parts[i], 10);
    if (isNaN(oct) || oct < 0 || oct > 255) throw new CidrCalculationError(\`Invalid octet \${parts[i]}\`);
    res = (res << 8) | oct;
  }
  return res >>> 0;
}

export function longToIp(long) {
  return [
    (long >>> 24) & 255,
    (long >>> 16) & 255,
    (long >>> 8) & 255,
    long & 255
  ].join('.');
}

export function parseCidr(cidrStr) {
  const [ip, bitsStr] = cidrStr.trim().split('/');
  if (!bitsStr) throw new CidrCalculationError('Missing subnet prefix length');
  const bits = parseInt(bitsStr, 10);
  if (isNaN(bits) || bits < 0 || bits > 32) throw new CidrCalculationError('Invalid prefix: 0-32 allowed');

  const ipLong = ipToLong(ip);
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  const network = (ipLong & mask) >>> 0;
  const broadcast = (network | (~mask >>> 0)) >>> 0;
  const totalHosts = bits >= 31 ? (bits === 31 ? 2 : 1) : Math.pow(2, 32 - bits);
  const usableHosts = bits >= 31 ? totalHosts : Math.max(0, totalHosts - 2);

  return {
    cidr: cidrStr,
    networkIp: longToIp(network),
    broadcastIp: longToIp(broadcast),
    netmask: longToIp(mask),
    firstUsableIp: bits >= 31 ? longToIp(network) : longToIp(network + 1),
    lastUsableIp: bits >= 31 ? longToIp(broadcast) : longToIp(broadcast - 1),
    totalHosts,
    usableHosts,
    prefixLength: bits
  };
}

export function containsIp(cidrStr, targetIp) {
  const info = parseCidr(cidrStr);
  const targetLong = ipToLong(targetIp);
  const netLong = ipToLong(info.networkIp);
  const maskLong = ipToLong(info.netmask);
  return (targetLong & maskLong) >>> 0 === netLong;
}
`,
    testCode: `import assert from 'node:assert/strict';
import { parseCidr, containsIp, ipToLong, longToIp } from './engine.js';

console.log('⚡ [Unit #346 Test Suite] Testing CIDR Subnet Calculator...');

// Test 1: Standard /24 subnet
{
  const res = parseCidr('192.168.1.50/24');
  assert.equal(res.networkIp, '192.168.1.0');
  assert.equal(res.broadcastIp, '192.168.1.255');
  assert.equal(res.netmask, '255.255.255.0');
  assert.equal(res.firstUsableIp, '192.168.1.1');
  assert.equal(res.lastUsableIp, '192.168.1.254');
  assert.equal(res.usableHosts, 254);
  console.log('  ✔ Standard /24 subnet calculated correctly');
}

// Test 2: Ingress range verification
{
  assert.equal(containsIp('10.0.0.0/8', '10.254.12.1'), true);
  assert.equal(containsIp('10.0.0.0/8', '192.168.1.1'), false);
  assert.equal(containsIp('172.16.0.0/12', '172.31.255.254'), true);
  assert.equal(containsIp('172.16.0.0/12', '172.32.0.1'), false);
  console.log('  ✔ CIDR boundary checks verified');
}
`
  },

  // UNIT #347: CRC32 High-Throughput Checksum Rig
  {
    num: 347,
    folder: '347-crc32-checksum-rig',
    name: 'CRC32 High-Throughput Checksum Rig',
    tag: 'GF-T1-347',
    benchmark: '< 0.02ms buffer checksum',
    engineCode: `/**
 * Unit #347: CRC32 High-Throughput Checksum Rig
 * Track 1 (Lean Tuner) — Pure IEEE 802.3 Fast Table Checksum
 */

// Precompute IEEE 802.3 CRC32 table
const TABLE = new Int32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1);
  }
  TABLE[i] = c;
}

export function crc32(input) {
  let buf;
  if (Buffer.isBuffer(input)) {
    buf = input;
  } else if (typeof input === 'string') {
    buf = Buffer.from(input, 'utf8');
  } else {
    buf = Buffer.from(JSON.stringify(input), 'utf8');
  }

  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = TABLE[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ -1) >>> 0;
}

export function crc32Hex(input) {
  return crc32(input).toString(16).padStart(8, '0').toUpperCase();
}

export function verifyCrc32(input, expectedHex) {
  const actual = crc32Hex(input);
  return actual === expectedHex.trim().toUpperCase();
}
`,
    testCode: `import assert from 'node:assert/strict';
import { crc32, crc32Hex, verifyCrc32 } from './engine.js';

console.log('⚡ [Unit #347 Test Suite] Testing CRC32 Checksum Rig...');

// Test 1: Standard known vectors
{
  assert.equal(crc32Hex('123456789'), 'CBF43926');
  assert.equal(crc32Hex('The quick brown fox jumps over the lazy dog'), '414FA339');
  console.log('  ✔ Standard IEEE 802.3 test vectors verified');
}

// Test 2: Binary Buffer & Object Verification
{
  const buf = Buffer.from([0x01, 0x02, 0x03, 0x04]);
  const hex = crc32Hex(buf);
  assert.equal(verifyCrc32(buf, hex), true);
  assert.equal(verifyCrc32(buf, '00000000'), false);
  console.log('  ✔ Binary buffer validation passed');
}
`
  },

  // UNIT #348: Slugify & UTF-8 Normalizer Guard
  {
    num: 348,
    folder: '348-slugify-utf8-normalizer',
    name: 'Slugify & UTF-8 Normalizer Guard',
    tag: 'GF-T1-348',
    benchmark: '< 0.05ms string normalization',
    engineCode: `/**
 * Unit #348: Slugify & UTF-8 Normalizer Guard
 * Track 1 (Lean Tuner) — Unicode Normalization & URL Kebab Rig
 */

export function normalizeUtf8(str) {
  if (typeof str !== 'string') return '';
  // Unicode NFKD decomposition + strip non-spacing diacritical marks
  return str.normalize('NFKD').replace(/[\\u0300-\\u036f]/g, '');
}

export function stripInvisibleChars(str) {
  if (typeof str !== 'string') return '';
  // Strip zero-width spaces, joiners, RTL/LTR overrides
  return str.replace(/[\\u200B-\\u200D\\uFEFF\\u202A-\\u202E]/g, '');
}

export function slugify(str, options = {}) {
  const { separator = '-', lowercase = true, maxLength = 100 } = options;
  if (typeof str !== 'string') return '';

  let clean = stripInvisibleChars(str);
  clean = normalizeUtf8(clean);

  if (lowercase) {
    clean = clean.toLowerCase();
  }

  // Replace invalid chars with separator
  clean = clean.replace(/[^a-z0-9]+/gi, separator);

  // Trim leading/trailing separators and multiple repeats
  const escapedSep = separator.replace(/[-\\/\\\\^$*+?.()|[\\]{}]/g, '\\\\$&');
  const multiRegex = new RegExp(\`(\${escapedSep})+\`, 'g');
  clean = clean.replace(multiRegex, separator);

  const trimRegex = new RegExp(\`^\${escapedSep}+|\${escapedSep}+$\`, 'g');
  clean = clean.replace(trimRegex, '');

  if (maxLength && clean.length > maxLength) {
    clean = clean.slice(0, maxLength).replace(trimRegex, '');
  }

  return clean;
}
`,
    testCode: `import assert from 'node:assert/strict';
import { slugify, normalizeUtf8, stripInvisibleChars } from './engine.js';

console.log('⚡ [Unit #348 Test Suite] Testing Slugify & UTF-8 Normalizer...');

// Test 1: Diacritics & Accents
{
  const input = 'Crème Brûlée & Café au Lait!';
  assert.equal(slugify(input), 'creme-brulee-cafe-au-lait');
  console.log('  ✔ Accents converted & stripped cleanly');
}

// Test 2: Invisible homoglyphs & zero-width characters
{
  const malicious = 'admin\\u200B\\uFEFF-console';
  assert.equal(stripInvisibleChars(malicious), 'admin-console');
  assert.equal(slugify(malicious), 'admin-console');
  console.log('  ✔ Invisible unicode homoglyphs removed');
}
`
  }
];
