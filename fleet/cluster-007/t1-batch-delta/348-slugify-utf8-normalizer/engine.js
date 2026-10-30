/**
 * Unit #348: Slugify & UTF-8 Normalizer Guard
 * Track 1 (Lean Tuner) — Unicode Normalization & URL Kebab Rig
 */

export function normalizeUtf8(str) {
  if (typeof str !== 'string') return '';
  // Unicode NFKD decomposition + strip non-spacing diacritical marks
  return str.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
}

export function stripInvisibleChars(str) {
  if (typeof str !== 'string') return '';
  // Strip zero-width spaces, joiners, RTL/LTR overrides
  return str.replace(/[\u200B-\u200D\uFEFF\u202A-\u202E]/g, '');
}

export function slugify(str, options = {}) {
  const { separator = '-', lowercase = true, maxLength = 100 } = options;
  if (typeof str !== 'string') return '';

  let clean = stripInvisibleChars(str);
  clean = normalizeUtf8(clean);

  if (lowercase) {
    clean = clean.toLowerCase();
  }

  // Replace invalid chars with separator
  clean = clean.replace(/[^a-z0-9]+/gi, separator);

  // Trim leading/trailing separators and multiple repeats
  const escapedSep = separator.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const multiRegex = new RegExp(`(${escapedSep})+`, 'g');
  clean = clean.replace(multiRegex, separator);

  const trimRegex = new RegExp(`^${escapedSep}+|${escapedSep}+$`, 'g');
  clean = clean.replace(trimRegex, '');

  if (maxLength && clean.length > maxLength) {
    clean = clean.slice(0, maxLength).replace(trimRegex, '');
  }

  return clean;
}
