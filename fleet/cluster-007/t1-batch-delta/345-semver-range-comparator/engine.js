/**
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
  const match = clean.match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+([0-9A-Za-z.-]+))?$/);
  if (!match) throw new SemverError(`Invalid semver format: "${v}"`);

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
