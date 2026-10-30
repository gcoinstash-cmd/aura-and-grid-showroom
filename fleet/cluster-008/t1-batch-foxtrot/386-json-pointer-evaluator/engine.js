/**
 * Unit #386: JSON Pointer (RFC 6901) Evaluator & Mutator
 * Track 1 (Lean Tuner) — Strict RFC 6901 Pointer Implementation
 */

export function unescapeToken(token) {
  return token.replace(/~1/g, '/').replace(/~0/g, '~');
}

export function escapeToken(token) {
  return token.replace(/~/g, '~0').replace(/\//g, '~1');
}

export function parsePointer(pointer) {
  if (pointer === '' || pointer === '/') return [];
  if (!pointer.startsWith('/')) {
    throw new Error(`Invalid JSON Pointer '${pointer}': must start with '/'`);
  }
  return pointer.slice(1).split('/').map(unescapeToken);
}

export function getPointer(doc, pointer, defaultValue = undefined) {
  if (pointer === '') return doc;
  const tokens = parsePointer(pointer);
  let current = doc;

  for (const token of tokens) {
    if (current == null) return defaultValue;

    if (Array.isArray(current)) {
      if (token === '-') return defaultValue;
      const idx = parseInt(token, 10);
      if (String(idx) !== token || idx < 0 || idx >= current.length) {
        return defaultValue;
      }
      current = current[idx];
    } else if (typeof current === 'object') {
      if (!Object.prototype.hasOwnProperty.call(current, token)) {
        return defaultValue;
      }
      current = current[token];
    } else {
      return defaultValue;
    }
  }

  return current === undefined ? defaultValue : current;
}

export function setPointer(doc, pointer, value) {
  if (pointer === '') throw new Error('Cannot replace root document via setPointer');
  const tokens = parsePointer(pointer);
  let current = doc;

  for (let i = 0; i < tokens.length - 1; i++) {
    const token = tokens[i];
    if (current[token] == null || typeof current[token] !== 'object') {
      const nextToken = tokens[i + 1];
      current[token] = /^[0-9]+$/.test(nextToken) ? [] : {};
    }
    current = current[token];
  }

  const lastToken = tokens[tokens.length - 1];
  if (Array.isArray(current) && lastToken === '-') {
    current.push(value);
  } else if (Array.isArray(current)) {
    const idx = parseInt(lastToken, 10);
    current[idx] = value;
  } else {
    current[lastToken] = value;
  }

  return doc;
}
