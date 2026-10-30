/**
 * Unit #380: Zero-Pollution Structured Deep Clone & Object Replicator
 * Track 1 (Lean Tuner) — Circular-Safe Deep Clone Engine
 */

export function deepClone(val, hash = new WeakMap()) {
  if (val === null || typeof val !== 'object') {
    return val;
  }

  // Handle circular references
  if (hash.has(val)) {
    return hash.get(val);
  }

  // Handle Date
  if (val instanceof Date) {
    return new Date(val.getTime());
  }

  // Handle RegExp
  if (val instanceof RegExp) {
    return new RegExp(val.source, val.flags);
  }

  // Handle Buffer
  if (Buffer.isBuffer(val)) {
    return Buffer.from(val);
  }

  // Handle Map
  if (val instanceof Map) {
    const copy = new Map();
    hash.set(val, copy);
    for (const [k, v] of val.entries()) {
      copy.set(deepClone(k, hash), deepClone(v, hash));
    }
    return copy;
  }

  // Handle Set
  if (val instanceof Set) {
    const copy = new Set();
    hash.set(val, copy);
    for (const v of val.values()) {
      copy.add(deepClone(v, hash));
    }
    return copy;
  }

  // Handle Array
  if (Array.isArray(val)) {
    const copy = [];
    hash.set(val, copy);
    for (let i = 0; i < val.length; i++) {
      copy[i] = deepClone(val[i], hash);
    }
    return copy;
  }

  // Handle Plain Object (guarding prototype)
  const copy = Object.create(null);
  hash.set(val, copy);

  for (const key of Object.keys(val)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
    copy[key] = deepClone(val[key], hash);
  }

  return copy;
}
