/**
 * Unit #360: URL Query Builder & Deep Flattener
 * Track 1 (Lean Tuner) — Nested Object URL Parameter Serializer
 */

function flatten(obj, prefix = '', res = {}) {
  for (const key of Object.keys(obj)) {
    const propKey = prefix ? `${prefix}[${key}]` : key;
    const val = obj[key];
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      flatten(val, propKey, res);
    } else if (Array.isArray(val)) {
      val.forEach((item, idx) => {
        if (typeof item === 'object' && item !== null) {
          flatten(item, `${propKey}[${idx}]`, res);
        } else {
          res[`${propKey}[]`] = res[`${propKey}[]`] || [];
          res[`${propKey}[]`].push(item);
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
        parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(item)}`);
      }
    } else if (v !== undefined) {
      parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
    }
  }

  return parts.join('&');
}
