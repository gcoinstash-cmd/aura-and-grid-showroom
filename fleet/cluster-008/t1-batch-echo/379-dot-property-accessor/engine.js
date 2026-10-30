/**
 * Unit #379: Path-Safe Dot-Notation Property Getter & Setter
 * Track 1 (Lean Tuner) — Prototype-Safe Object Path Navigation
 */

const BLOCKED_PROPS = new Set(['__proto__', 'prototype', 'constructor']);

function parsePath(path) {
  if (Array.isArray(path)) return path;
  if (typeof path !== 'string') return [];
  // Matches dot segments and array index brackets: "a.b[0].c" -> ["a", "b", "0", "c"]
  return path
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .filter(segment => segment.length > 0);
}

export function get(obj, path, defaultValue = undefined) {
  if (obj == null) return defaultValue;
  const segments = parsePath(path);
  let current = obj;

  for (const seg of segments) {
    if (current == null) return defaultValue;
    if (BLOCKED_PROPS.has(seg)) return defaultValue;
    current = current[seg];
  }

  return current === undefined ? defaultValue : current;
}

export function set(obj, path, value) {
  if (obj == null || typeof obj !== 'object') {
    throw new TypeError('Target must be an object');
  }

  const segments = parsePath(path);
  let current = obj;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (BLOCKED_PROPS.has(seg)) {
      throw new Error(`Prototype pollution attempt blocked on '${seg}'`);
    }

    if (i === segments.length - 1) {
      current[seg] = value;
      return obj;
    }

    const nextSeg = segments[i + 1];
    const isNextNumeric = /^[0-9]+$/.test(nextSeg);

    if (current[seg] == null || typeof current[seg] !== 'object') {
      current[seg] = isNextNumeric ? [] : {};
    }

    current = current[seg];
  }

  return obj;
}

export function has(obj, path) {
  return get(obj, path) !== undefined;
}
