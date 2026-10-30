/**
 * Unit #388: Semver Pre-Release Tag Extractor & Normalizer
 * Track 1 (Lean Tuner) — SemVer 2.0.0 Pre-Release Resolver
 */

const SEMVER_REGEX = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+([0-9A-Za-z.-]+))?$/;

export function parseSemver(versionStr) {
  if (typeof versionStr !== 'string') throw new TypeError('Version must be a string');
  const match = versionStr.trim().replace(/^v/, '').match(SEMVER_REGEX);
  if (!match) throw new Error(`Invalid SemVer string '${versionStr}'`);

  const [
    ,
    major,
    minor,
    patch,
    prerelease = null,
    build = null
  ] = match;

  const identifiers = prerelease ? prerelease.split('.') : [];
  let channel = 'release';
  let iteration = 0;

  if (identifiers.length > 0) {
    channel = identifiers[0];
    const numPart = identifiers.find(id => /^[0-9]+$/.test(id));
    if (numPart !== undefined) {
      iteration = parseInt(numPart, 10);
    }
  }

  return {
    major: parseInt(major, 10),
    minor: parseInt(minor, 10),
    patch: parseInt(patch, 10),
    prerelease,
    identifiers,
    channel,
    iteration,
    isPrerelease: prerelease !== null,
    build
  };
}

export function comparePrerelease(tagA, tagB) {
  if (!tagA && !tagB) return 0;
  if (!tagA) return 1; // Normal version has higher precedence than prerelease
  if (!tagB) return -1;

  const partsA = tagA.split('.');
  const partsB = tagB.split('.');
  const maxLen = Math.max(partsA.length, partsB.length);

  for (let i = 0; i < maxLen; i++) {
    const a = partsA[i];
    const b = partsB[i];
    if (a === undefined) return -1;
    if (b === undefined) return 1;
    if (a === b) continue;

    const numA = /^[0-9]+$/.test(a) ? parseInt(a, 10) : NaN;
    const numB = /^[0-9]+$/.test(b) ? parseInt(b, 10) : NaN;

    if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
      return numA < numB ? -1 : 1;
    }
    if (!Number.isNaN(numA)) return -1; // Numeric identifiers have lower precedence than alphanumeric
    if (!Number.isNaN(numB)) return 1;

    return a < b ? -1 : 1;
  }

  return 0;
}
