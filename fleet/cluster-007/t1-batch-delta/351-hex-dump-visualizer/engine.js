/**
 * Unit #351: Hex Dump Formatter & Byte Visualizer
 * Track 1 (Lean Tuner) — Binary Buffer XXD-Style Hex Visualizer
 */

export function formatHexDump(input, options = {}) {
  const { bytesPerLine = 16 } = options;
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(String(input), 'utf8');

  const lines = [];
  for (let i = 0; i < buf.length; i += bytesPerLine) {
    const chunk = buf.slice(i, i + bytesPerLine);
    const addr = i.toString(16).padStart(8, '0');

    let hexPart = '';
    let asciiPart = '';

    for (let j = 0; j < bytesPerLine; j++) {
      if (j < chunk.length) {
        const b = chunk[j];
        hexPart += b.toString(16).padStart(2, '0') + ' ';
        asciiPart += (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.';
      } else {
        hexPart += '   ';
      }
    }

    lines.push(`${addr}: ${hexPart} |${asciiPart}|`);
  }

  return lines.join('\n');
}
