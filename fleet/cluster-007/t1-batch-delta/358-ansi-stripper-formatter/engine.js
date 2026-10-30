/**
 * Unit #358: ANSI Stripper & Plain-Text Formatter
 * Track 1 (Lean Tuner) — Clean Terminal Telemetry Sanitizer
 */

const ANSI_REGEX = new RegExp(
  '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%_~]*)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%_~]*)*)?\\u0007)|(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))',
  'g'
);

export function stripAnsi(str) {
  if (typeof str !== 'string') return '';
  return str.replace(ANSI_REGEX, '');
}

export function hasAnsi(str) {
  return typeof str === 'string' && ANSI_REGEX.test(str);
}

export function visualLength(str) {
  return stripAnsi(str).length;
}
