/**
 * Unit #387: XML Safe Character Entity Escaper & Unescaper
 * Track 1 (Lean Tuner) — Strict XML 1.0 Entity Escaper
 */

const ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;'
};

const UNESCAPE_MAP = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'"
};

export function escapeXml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[&<>"']/g, match => ESCAPE_MAP[match]);
}

export function unescapeXml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&(?:amp|lt|gt|quot|apos|#(\d+)|#x([0-9a-fA-F]+));/g, (match, dec, hex) => {
    if (UNESCAPE_MAP[match]) return UNESCAPE_MAP[match];
    if (dec) return String.fromCharCode(parseInt(dec, 10));
    if (hex) return String.fromCharCode(parseInt(hex, 16));
    return match;
  });
}

export function stripXmlTags(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '');
}
