/**
 * Unit #315: URL Query Parameter Serializer & Parser
 * Track 1 (Lean Tuner) — Zero-Dependency Query String Engine
 * 
 * GhostFactoryOS Architecture: Cluster-007
 * Pure ESM | Zero External Dependencies (Node.js Standard Library Only)
 */

export class QueryStringError extends Error {
  constructor(message, code = 'ERR_QUERY_STRING') {
    super(message);
    this.name = 'QueryStringError';
    this.code = code;
  }
}

/**
 * Serializes an object into an HTTP query string.
 * Supports arrays (repeat, comma, bracket), booleans, numbers, and nested objects.
 * 
 * @param {Record<string, any>} obj 
 * @param {{
 *   arrayFormat?: 'bracket'|'repeat'|'comma',
 *   encode?: boolean,
 *   sortKeys?: boolean,
 *   prefixQuestionMark?: boolean
 * }} [options={}] 
 * @returns {string} Query string (e.g. "foo=bar&baz=1")
 */
export function stringifyQuery(obj, options = {}) {
  if (!obj || typeof obj !== 'object') return '';

  const arrayFormat = options.arrayFormat || 'bracket';
  const shouldEncode = options.encode !== false;
  const sortKeys = options.sortKeys !== false;
  const encodeVal = (v) => (shouldEncode ? encodeURIComponent(String(v)) : String(v));

  let keys = Object.keys(obj);
  if (sortKeys) keys = keys.sort();

  const pairs = [];

  for (const key of keys) {
    const val = obj[key];
    if (val === undefined || val === null) continue;

    const encodedKey = encodeVal(key);

    if (Array.isArray(val)) {
      if (arrayFormat === 'comma') {
        const joined = val.map(encodeVal).join(',');
        pairs.push(`${encodedKey}=${joined}`);
      } else if (arrayFormat === 'repeat') {
        for (const item of val) {
          pairs.push(`${encodedKey}=${encodeVal(item)}`);
        }
      } else {
        // 'bracket' -> key[]=val1&key[]=val2
        for (const item of val) {
          pairs.push(`${encodeVal(`${key}[]`)}=${encodeVal(item)}`);
        }
      }
    } else if (typeof val === 'object') {
      // Nested object: filter[name]=value
      for (const [subK, subV] of Object.entries(val)) {
        if (subV !== undefined && subV !== null) {
          pairs.push(`${encodeVal(`${key}[${subK}]`)}=${encodeVal(subV)}`);
        }
      }
    } else {
      pairs.push(`${encodedKey}=${encodeVal(val)}`);
    }
  }

  const query = pairs.join('&');
  return (options.prefixQuestionMark && query) ? `?${query}` : query;
}

/**
 * Parses an HTTP query string into a structured JavaScript object.
 * Automatically casts booleans, numbers, and parses bracket/comma/repeat arrays.
 * 
 * @param {string} queryString 
 * @param {{ parseBooleans?: boolean, parseNumbers?: boolean }} [options={}] 
 * @returns {Record<string, any>}
 */
export function parseQuery(queryString, options = {}) {
  if (typeof queryString !== 'string') return {};

  let str = queryString.trim();
  if (str.startsWith('?')) str = str.slice(1);
  if (!str) return {};

  const parseBooleans = options.parseBooleans !== false;
  const parseNumbers = options.parseNumbers !== false;

  const result = {};
  const pairs = str.split('&');

  for (const pair of pairs) {
    if (!pair) continue;
    const eqIdx = pair.indexOf('=');
    let rawKey = eqIdx !== -1 ? pair.slice(0, eqIdx) : pair;
    let rawVal = eqIdx !== -1 ? pair.slice(eqIdx + 1) : '';

    let key = '';
    let val = '';
    try {
      key = decodeURIComponent(rawKey.replace(/\+/g, ' '));
      val = decodeURIComponent(rawVal.replace(/\+/g, ' '));
    } catch {
      key = rawKey;
      val = rawVal;
    }

    let parsedVal = val;
    if (parseBooleans && (val === 'true' || val === 'false')) {
      parsedVal = val === 'true';
    } else if (parseNumbers && /^(0|-?[1-9]\d*)(\.\d+)?$/.test(val)) {
      parsedVal = Number(val);
    }

    // Bracket notation: key[] or key[subKey]
    const bracketMatch = key.match(/^([^\[]+)\[([^\]]*)\]$/);
    if (bracketMatch) {
      const mainKey = bracketMatch[1];
      const subKey = bracketMatch[2];

      if (!subKey) {
        // Array: key[]
        if (!Array.isArray(result[mainKey])) result[mainKey] = [];
        result[mainKey].push(parsedVal);
      } else {
        // Nested Object: key[subKey]
        if (!result[mainKey] || typeof result[mainKey] !== 'object' || Array.isArray(result[mainKey])) {
          result[mainKey] = {};
        }
        result[mainKey][subKey] = parsedVal;
      }
    } else if (key in result) {
      // Repeat notation: key=1&key=2
      if (!Array.isArray(result[key])) {
        result[key] = [result[key]];
      }
      result[key].push(parsedVal);
    } else {
      result[key] = parsedVal;
    }
  }

  return result;
}

/**
 * Merges query parameters into an existing URL or query string.
 * @param {string} urlOrQuery 
 * @param {Record<string, any>} updates 
 * @returns {string} Updated URL or query string
 */
export function mergeQuery(urlOrQuery, updates) {
  if (typeof urlOrQuery !== 'string') return stringifyQuery(updates);

  const qIdx = urlOrQuery.indexOf('?');
  const base = qIdx !== -1 ? urlOrQuery.slice(0, qIdx) : urlOrQuery;
  const existingQuery = qIdx !== -1 ? urlOrQuery.slice(qIdx + 1) : (urlOrQuery.includes('=') ? urlOrQuery : '');

  const parsed = parseQuery(existingQuery);
  const merged = { ...parsed, ...updates };
  const newQuery = stringifyQuery(merged);

  if (qIdx !== -1 || (!urlOrQuery.includes('=') && urlOrQuery.includes('/'))) {
    return newQuery ? `${base}?${newQuery}` : base;
  }
  return newQuery;
}

/**
 * Performance benchmark.
 * @param {number} [iterations=2000] 
 */
export function benchmarkQueryEngine(iterations = 2000) {
  const sample = {
    cluster: '007',
    active: true,
    telemetry_ids: ['GF-303', 'GF-315'],
    filter: { status: 'SEALED', minRpm: 4000 }
  };

  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    const q = stringifyQuery(sample, { arrayFormat: 'bracket' });
    parseQuery(q);
  }
  const totalMs = performance.now() - start;

  return {
    iterations,
    totalMs: Number(totalMs.toFixed(3)),
    avgLatencyUs: Number(((totalMs * 1000) / iterations).toFixed(2)),
    opsPerSec: Math.round((iterations / totalMs) * 1000)
  };
}
