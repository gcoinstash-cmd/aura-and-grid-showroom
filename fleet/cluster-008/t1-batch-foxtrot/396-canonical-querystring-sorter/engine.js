/**
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
    .map(([k, v]) => `${encodeRfc3986(k)}=${encodeRfc3986(v)}`)
    .join('&');
}
