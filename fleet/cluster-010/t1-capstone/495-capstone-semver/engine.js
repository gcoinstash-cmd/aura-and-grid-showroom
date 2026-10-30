/**
 * Unit #495: Loose Semver Parser & Lockfile Matrix Matcher
 * Track 1 (Lean Tuner) — Version Matrix & Dependency Resolution Rig
 */

export class SemverParser {
  /**
   * Parse a semver string (standard or loose)
   * @param {string} raw 
   * @returns {{ major: number, minor: number, patch: number, prerelease: string|null, build: string|null, raw: string }}
   */
  static parse(raw) {
    if (typeof raw !== 'string') {
      throw new TypeError('Version must be a string');
    }
    const clean = raw.trim().replace(/^[v=]/, '');
    const regex = /^(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:-([0-9A-Za-z.-]+))?(?:\+([0-9A-Za-z.-]+))?$/;
    const match = clean.match(regex);
    if (!match) {
      throw new Error(`Invalid semver string: "${raw}"`);
    }

    return {
      major: parseInt(match[1], 10),
      minor: match[2] !== undefined ? parseInt(match[2], 10) : 0,
      patch: match[3] !== undefined ? parseInt(match[3], 10) : 0,
      prerelease: match[4] || null,
      build: match[5] || null,
      raw
    };
  }

  /**
   * Compare two parsed or raw semver versions
   * @param {string|object} a 
   * @param {string|object} b 
   * @returns {-1|0|1}
   */
  static compare(a, b) {
    const vA = typeof a === 'string' ? SemverParser.parse(a) : a;
    const vB = typeof b === 'string' ? SemverParser.parse(b) : b;

    if (vA.major !== vB.major) return vA.major > vB.major ? 1 : -1;
    if (vA.minor !== vB.minor) return vA.minor > vB.minor ? 1 : -1;
    if (vA.patch !== vB.patch) return vA.patch > vB.patch ? 1 : -1;

    // Prerelease comparison: non-prerelease has higher precedence than prerelease
    if (!vA.prerelease && vB.prerelease) return 1;
    if (vA.prerelease && !vB.prerelease) return -1;
    if (vA.prerelease && vB.prerelease) {
      if (vA.prerelease !== vB.prerelease) {
        return vA.prerelease.localeCompare(vB.prerelease, undefined, { numeric: true }) > 0 ? 1 : -1;
      }
    }

    return 0;
  }

  /**
   * Check if a version satisfies a semver range
   * Supports: exact ('1.2.3'), caret ('^1.2.3'), tilde ('~1.2.3'), wildcard ('*', 'x'), comparison ('>=1.0.0 <2.0.0')
   * @param {string} version 
   * @param {string} range 
   * @returns {boolean}
   */
  static satisfies(version, range) {
    const v = SemverParser.parse(version);
    let r = range.trim();

    if (r === '*' || r === 'x' || r === '') return true;

    // Caret ranges: ^1.2.3 allows changes that do not modify left-most non-zero digit
    if (r.startsWith('^')) {
      const base = SemverParser.parse(r.slice(1));
      if (SemverParser.compare(v, base) < 0) return false;
      if (base.major > 0) {
        return v.major === base.major;
      } else if (base.minor > 0) {
        return v.major === 0 && v.minor === base.minor;
      } else {
        return v.major === 0 && v.minor === 0 && v.patch === base.patch;
      }
    }

    // Tilde ranges: ~1.2.3 allows patch-level changes if minor is specified
    if (r.startsWith('~')) {
      const base = SemverParser.parse(r.slice(1));
      if (SemverParser.compare(v, base) < 0) return false;
      return v.major === base.major && v.minor === base.minor;
    }

    // Collapse whitespace between operator and version, e.g. ">= 2.0.0" -> ">=2.0.0"
    r = r.replace(/(>=|<=|>|<|=)\s+/g, '$1');

    // Exact or direct comparison without operators
    if (/^[v\d]/.test(r)) {
      const base = SemverParser.parse(r);
      return SemverParser.compare(v, base) === 0;
    }

    // Range comparisons, e.g. ">=2.0.0 <3.0.0"
    const clauses = r.split(/\s+/);
    let passes = true;
    for (const c of clauses) {
      const opMatch = c.match(/^(>=|<=|>|<|=)?\s*([v\d.-]+)$/);
      if (!opMatch) continue;
      const op = opMatch[1] || '=';
      const target = SemverParser.parse(opMatch[2]);
      const comp = SemverParser.compare(v, target);

      if (op === '>=' && comp < 0) passes = false;
      if (op === '<=' && comp > 0) passes = false;
      if (op === '>' && comp <= 0) passes = false;
      if (op === '<' && comp >= 0) passes = false;
      if (op === '=' && comp !== 0) passes = false;
    }

    return passes;
  }

  /**
   * Match an application package.json dependency matrix against resolved lockfile packages
   * @param {Record<string, string>} dependencies 
   * @param {Record<string, { version: string }>} lockfilePackages 
   * @returns {Array<{ pkg: string, specRange: string, lockVersion: string, satisfies: boolean }>}
   */
  static matchLockfileMatrix(dependencies, lockfilePackages) {
    const results = [];
    for (const [pkg, specRange] of Object.entries(dependencies)) {
      const lockEntry = lockfilePackages[pkg] || lockfilePackages[`node_modules/${pkg}`];
      if (!lockEntry || !lockEntry.version) {
        results.push({ pkg, specRange, lockVersion: 'UNRESOLVED', satisfies: false });
        continue;
      }
      const sat = SemverParser.satisfies(lockEntry.version, specRange);
      results.push({ pkg, specRange, lockVersion: lockEntry.version, satisfies: sat });
    }
    return results;
  }
}
