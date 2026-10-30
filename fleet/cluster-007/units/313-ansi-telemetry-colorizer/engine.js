/**
 * Unit #313: ANSI Terminal Telemetry Colorizer & Formatter
 * Track 1 (Lean Tuner) — Standalone Terminal Visual Styling Rig
 * 
 * GhostFactoryOS Architecture: Cluster-007
 * Pure ESM | Zero External Dependencies (Node.js Standard Library Only)
 */

export const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',
  inverse: '\x1b[7m',

  // Foreground
  black: '\x1b[30m',
  red: '\x1b[32m\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',

  // Background
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

/**
 * Strips all ANSI escape sequences from a string.
 * @param {string} str 
 * @returns {string} Plain text
 */
export function stripAnsi(str) {
  if (typeof str !== 'string') return '';
  // Complete ANSI escape code stripper regex
  return str.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
}

/**
 * Wraps text in an ANSI style code and appends a reset code.
 * @param {string} code 
 * @param {string} text 
 * @returns {string}
 */
export function wrapAnsi(code, text) {
  return `${code}${text}${ANSI.reset}`;
}

export const color = {
  bold: (t) => wrapAnsi(ANSI.bold, t),
  dim: (t) => wrapAnsi(ANSI.dim, t),
  underline: (t) => wrapAnsi(ANSI.underline, t),
  red: (t) => wrapAnsi(ANSI.red, t),
  green: (t) => wrapAnsi(ANSI.green, t),
  yellow: (t) => wrapAnsi(ANSI.yellow, t),
  blue: (t) => wrapAnsi(ANSI.blue, t),
  magenta: (t) => wrapAnsi(ANSI.magenta, t),
  cyan: (t) => wrapAnsi(ANSI.cyan, t),
  white: (t) => wrapAnsi(ANSI.white, t),
  gray: (t) => wrapAnsi(ANSI.gray, t),

  /**
   * 24-bit TrueColor foreground styling.
   * @param {string} hexColor - e.g. '#FF5500'
   * @param {string} text 
   * @returns {string}
   */
  hex: (hexColor, text) => {
    const clean = hexColor.replace(/^#/, '');
    const r = parseInt(clean.substring(0, 2), 16) || 0;
    const g = parseInt(clean.substring(2, 4), 16) || 0;
    const b = parseInt(clean.substring(4, 6), 16) || 0;
    return `\x1b[38;2;${r};${g};${b}m${text}${ANSI.reset}`;
  }
};

/**
 * Renders an ASCII / Unicode box around text content.
 * 
 * @param {string} text 
 * @param {{ title?: string, padding?: number, borderStyle?: 'single'|'double'|'rounded' }} [options={}] 
 * @returns {string}
 */
export function drawBox(text, options = {}) {
  const border = options.borderStyle || 'rounded';
  const padding = options.padding ?? 1;
  const title = options.title ? ` ${options.title} ` : '';

  const chars = {
    rounded: { tl: '╭', tr: '╮', bl: '╰', br: '╯', h: '─', v: '│' },
    double: { tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║' },
    single: { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│' }
  }[border] || chars.rounded;

  const rawLines = String(text).split('\n');
  const maxLineLen = Math.max(...rawLines.map(l => stripAnsi(l).length), stripAnsi(title).length);
  const innerWidth = maxLineLen + (padding * 2);

  // Top border
  let topHeader = chars.h.repeat(innerWidth);
  if (title) {
    const titleLen = stripAnsi(title).length;
    topHeader = chars.h.repeat(2) + title + chars.h.repeat(Math.max(0, innerWidth - 2 - titleLen));
  }
  const top = `${chars.tl}${topHeader}${chars.tr}`;

  // Content lines
  const padSpaces = ' '.repeat(padding);
  const midLines = rawLines.map(line => {
    const visualLen = stripAnsi(line).length;
    const trailingSpaces = ' '.repeat(Math.max(0, maxLineLen - visualLen));
    return `${chars.v}${padSpaces}${line}${trailingSpaces}${padSpaces}${chars.v}`;
  });

  // Bottom border
  const bottom = `${chars.bl}${chars.h.repeat(innerWidth)}${chars.br}`;

  return [top, ...midLines, bottom].join('\n');
}

/**
 * Renders an inline telemetry progress bar.
 * 
 * @param {number} percent - 0 to 100
 * @param {number} [barLength=20] 
 * @param {boolean} [showPercent=true] 
 * @returns {string}
 */
export function renderProgressBar(percent, barLength = 20, showPercent = true) {
  const clamped = Math.max(0, Math.min(100, percent));
  const filled = Math.round((clamped / 100) * barLength);
  const empty = barLength - filled;

  const bar = `${color.green('█'.repeat(filled))}${color.gray('░'.repeat(empty))}`;
  return showPercent ? `[${bar}] ${clamped.toFixed(0)}%` : `[${bar}]`;
}

/**
 * Performance benchmark.
 * @param {number} [iterations=2000] 
 */
export function benchmarkColorizer(iterations = 2000) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    const styled = color.green(color.bold('TELEMETRY_OK'));
    stripAnsi(styled);
    renderProgressBar(78, 15);
  }
  const totalMs = performance.now() - start;
  return {
    iterations,
    totalMs: Number(totalMs.toFixed(3)),
    avgLatencyUs: Number(((totalMs * 1000) / iterations).toFixed(2)),
    opsPerSec: Math.round((iterations / totalMs) * 1000)
  };
}
