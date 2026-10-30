/**
 * Unit #309: Semantic Version Semver Resolver & Bumper
 * Track 1 (Lean Tuner) — Zero-Dependency SemVer 2.0.0 Engine
 * 
 * GhostFactoryOS Architecture: Cluster-007
 * Pure ESM | Zero External Dependencies (Node.js Standard Library Only)
 */

export class SemverError extends Error {
  constructor(message, code = 'ERR_SEMVER', details = null) {
    super(message);
    this.name = 'SemverError';
    this.code = code;
    this.details = details;
  }
}

const SEMVER_REGEX = /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

/**
 * Parses a semantic version string into structured components.
 * @param {string} vStr 
 * @returns {{ major: number, minor: number, patch: number, prerelease: string|null, build: string|null, raw: string }}
 */
export function parseSemver(vStr) {
  if (typeof vStr !== 'string') {
    throw new SemverError('Version must be a string', 'ERR_INVALID_SEMVER');
  }
  const match = vStr.trim().match(SEMVER_REGEX);
  if (!match) {
    throw new SemverError(`Invalid SemVer string: "${vStr}"`, 'ERR_INVALID_SEMVER');
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] || null,
    build: match[5] || null,
    raw: vStr.trim()
  };
}

/**
 * Validates whether a version string complies with SemVer 2.0.0.
 * @param {string} vStr 
 * @returns {boolean}
 */
export function isValidSemver(vStr) {
  if (typeof vStr !== 'string') return false;
  return SEMVER_REGEX.test(vStr.trim());
}

/**
 * Compares two SemVer versions.
 * Returns -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2.
 * 
 * @param {string} v1Str 
 * @param {string} v2Str 
 * @returns {-1|0|1}
 */
export function compareSemver(v1Str, v2Str) {
  const v1 = parseSemver(v1Str);
  const v2 = parseSemver(v2Str);

  if (v1.major !== v2.major) return v1.major > v2.major ? 1 : -1;
  if (v1.minor !== v2.minor) return v1.minor > v2.minor ? 1 : -1;
  if (v1.patch !== v2.patch) return v1.patch > v2.patch ? 1 : -1;

  // Prerelease comparison: normal version has higher precedence than prerelease
  if (!v1.prerelease && v2.prerelease) return 1;
  if (v1.prerelease && !v2.prerelease) return -1;
  if (!v1.prerelease && !v2.prerelease) return 0;

  // Compare prerelease identifiers dot by dot
  const p1 = v1.prerelease.split('.');
  const p2 = v2.prerelease.split('.');
  const len = Math.max(p1.length, p2.length);

  for (let i = 0; i < len; i++) {
    const id1 = p1[i];
    const id2 = p2[i];
    if (id1 === undefined) return -1;
    if (id2 === undefined) return 1;
    if (id1 === id2) continue;

    const num1 = /^\d+$/.test(id1) ? Number(id1) : null;
    const num2 = /^\d+$/.test(id2) ? Number(id2) : null;

    if (num1 !== null && num2 !== null) {
      return num1 > num2 ? 1 : -1;
    }
    if (num1 !== null && num2 === null) return -1;
    if (num1 === null && num2 !== null) return 1;

    return id1.localeCompare(id2) > 0 ? 1 : -1;
  }

  return 0;
}

/**
 * Checks if a version satisfies basic ranges (^, ~, >=, <=, =).
 * @param {string} versionStr 
 * @param {string} rangeStr 
 * @returns {boolean}
 */
export function satisfiesRange(versionStr, rangeStr) {
  const v = parseSemver(versionStr);
  const range = rangeStr.trim();

  if (range === '*' || range === 'x' || range === '') return true;

  // Caret ^ (compatible with version without breaking major)
  if (range.startsWith('^')) {
    const base = parseSemver(range.slice(1));
    if (compareSemver(versionStr, base.raw) < 0) return false;
    if (base.major > 0) {
      return v.major === base.major;
    }
    if (base.minor > 0) {
      return v.major === 0 && v.minor === base.minor;
    }
    return v.major === 0 && v.minor === 0 && v.patch === base.patch;
  }

  // Tilde ~ (compatible with patch changes in same minor)
  if (range.startsWith('~')) {
    const base = parseSemver(range.slice(1));
    if (compareSemver(versionStr, base.raw) < 0) return false;
    return v.major === base.major && v.minor === base.minor;
  }

  // Exact or comparison operators
  if (range.startsWith('>=')) return compareSemver(versionStr, range.slice(2)) >= 0;
  if (range.startsWith('<=')) return compareSemver(versionStr, range.slice(2)) <= 0;
  if (range.startsWith('>')) return compareSemver(versionStr, range.slice(1)) > 0;
  if (range.startsWith('<')) return compareSemver(versionStr, range.slice(1)) < 0;
  if (range.startsWith('=')) return compareSemver(versionStr, range.slice(1)) === 0;

  return compareSemver(versionStr, range) === 0;
}

/**
 * Bumps a semantic version.
 * @param {string} versionStr 
 * @param {'major'|'minor'|'patch'|'prerelease'} releaseType 
 * @param {string} [identifier='alpha'] 
 * @returns {string} Bumped version string
 */
export function bumpSemver(versionStr, releaseType, identifier = 'alpha') {
  const v = parseSemver(versionStr);

  switch (releaseType) {
    case 'major':
      return `${v.major + 1}.0.0`;
    case 'minor':
      return `${v.major}.${v.minor + 1}.0`;
    case 'patch':
      if (v.prerelease) {
        return `${v.major}.${v.minor}.${v.patch}`;
      }
      return `${v.major}.${v.minor}.${v.patch + 1}`;
    case 'prerelease': {
      if (v.prerelease) {
        const parts = v.prerelease.split('.');
        const lastPart = parts[parts.length - 1];
        if (/^\d+$/.test(lastPart)) {
          parts[parts.length - 1] = String(Number(lastPart) + 1);
          return `${v.major}.${v.minor}.${v.patch}-${parts.join('.')}`;
        }
        return `${v.major}.${v.minor}.${v.patch}-${v.prerelease}.1`;
      }
      return `${v.major}.${v.minor}.${v.patch + 1}-${identifier}.1`;
    }
    default:
      throw new SemverError(`Unsupported bump type: ${releaseType}`, 'ERR_INVALID_BUMP');
  }
}

/**
 * Performance benchmark.
 * @param {number} [iterations=2000] 
 */
export function benchmarkSemver(iterations = 2000) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    parseSemver('1.24.8-beta.2+build.99');
    compareSemver('2.1.0', '2.0.9');
    satisfiesRange('1.5.2', '^1.4.0');
    bumpSemver('1.5.2', 'patch');
  }
  const totalMs = performance.now() - start;
  return {
    iterations,
    totalMs: Number(totalMs.toFixed(3)),
    avgLatencyUs: Number(((totalMs * 1000) / iterations).toFixed(2)),
    opsPerSec: Math.round((iterations / totalMs) * 1000)
  };
}
