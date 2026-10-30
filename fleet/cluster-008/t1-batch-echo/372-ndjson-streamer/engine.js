/**
 * Unit #372: NDJSON (Newline-Delimited JSON) Streamer & Validator
 * Track 1 (Lean Tuner) — High-Performance NDJSON Parser & Serializer
 */

export function serializeNdjson(records) {
  if (!Array.isArray(records)) {
    throw new TypeError('Records must be an array');
  }
  return records.map(r => JSON.stringify(r)).join('\n') + (records.length > 0 ? '\n' : '');
}

export function parseNdjson(ndjsonString, options = {}) {
  const { ignoreErrors = false } = options;
  if (!ndjsonString || typeof ndjsonString !== 'string') return [];

  const lines = ndjsonString.split(/\r?\n/).filter(line => line.trim().length > 0);
  const results = [];

  for (let i = 0; i < lines.length; i++) {
    try {
      results.push(JSON.parse(lines[i]));
    } catch (err) {
      if (!ignoreErrors) {
        throw new Error(`NDJSON Parse Error at line ${i + 1}: ${err.message}`);
      }
    }
  }

  return results;
}
