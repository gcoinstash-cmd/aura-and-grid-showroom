/**
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
    const path = prefix ? `${prefix}.${k}` : k;
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
