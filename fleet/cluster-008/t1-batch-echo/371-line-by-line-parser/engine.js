/**
 * Unit #371: Zero-Copy Stream Line-by-Line Telemetry Parser
 * Track 1 (Lean Tuner) — Multi-chunk newline aggregator
 */

export function parseLinesSync(textOrBuffer) {
  const str = Buffer.isBuffer(textOrBuffer) ? textOrBuffer.toString('utf8') : String(textOrBuffer);
  if (!str) return [];
  // Split on CR LF or LF
  const raw = str.split(/\r?\n/);
  // If string ends with newline, pop empty trailing element
  if (raw.length > 0 && raw[raw.length - 1] === '') {
    raw.pop();
  }
  return raw;
}

export class StreamLineSplitter {
  constructor() {
    this.remainder = '';
  }

  feed(chunk) {
    const str = this.remainder + (Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk));
    const lines = str.split(/\r?\n/);
    this.remainder = lines.pop() ?? '';
    return lines;
  }

  flush() {
    const final = this.remainder;
    this.remainder = '';
    return final ? [final] : [];
  }
}
