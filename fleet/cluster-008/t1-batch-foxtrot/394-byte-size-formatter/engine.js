/**
 * Unit #394: Memory Byte Size Humanizer & Parser
 * Track 1 (Lean Tuner) — Binary & SI Byte Representation Engine
 */

const BINARY_UNITS = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'];
const SI_UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

export function formatBytes(bytes, options = {}) {
  const { binary = true, decimals = 2 } = options;
  if (typeof bytes !== 'number' || Number.isNaN(bytes) || bytes === 0) return '0 B';

  const base = binary ? 1024 : 1000;
  const units = binary ? BINARY_UNITS : SI_UNITS;
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(base));
  const safeIdx = Math.min(i, units.length - 1);
  const val = (bytes / Math.pow(base, safeIdx)).toFixed(decimals);

  return `${val} ${units[safeIdx]}`;
}

export function parseBytes(sizeStr) {
  if (typeof sizeStr !== 'string') return 0;
  const match = sizeStr.trim().match(/^([0-9.]+)\s*([a-zA-Z]*)$/);
  if (!match) return 0;

  const num = parseFloat(match[1]);
  const unit = match[2].toUpperCase();

  const multipliers = {
    'B': 1,
    'KB': 1000,
    'KIB': 1024,
    'MB': 1000 * 1000,
    'MIB': 1024 * 1024,
    'GB': 1000 * 1000 * 1000,
    'GIB': 1024 * 1024 * 1024,
    'TB': 1000 * 1000 * 1000 * 1000,
    'TIB': 1024 * 1024 * 1024 * 1024
  };

  const mult = multipliers[unit] || (unit.startsWith('K') ? 1024 : unit.startsWith('M') ? 1024 * 1024 : unit.startsWith('G') ? 1024 * 1024 * 1024 : 1);
  return Math.round(num * mult);
}
