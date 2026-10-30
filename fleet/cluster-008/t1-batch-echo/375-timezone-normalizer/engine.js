/**
 * Unit #375: Timezone Offset Normalizer & UTC Timestamp Synchronizer
 * Track 1 (Lean Tuner) — Strict ISO-8601 & UTC Timestamp Rig
 */

export function normalizeToUtc(dateInput) {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(d.getTime())) {
    throw new RangeError('Invalid date input provided');
  }
  return d.toISOString();
}

export function extractTimezoneOffsetMinutes(isoString) {
  if (typeof isoString !== 'string') return 0;
  if (isoString.endsWith('Z')) return 0;

  const match = isoString.match(/([+-])(\d{2}):?(\d{2})$/);
  if (!match) return 0;

  const sign = match[1] === '-' ? -1 : 1;
  const hours = parseInt(match[2], 10);
  const minutes = parseInt(match[3], 10);
  return sign * (hours * 60 + minutes);
}

export function formatWithCustomOffset(dateInput, offsetMinutes = 0) {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(d.getTime())) {
    throw new RangeError('Invalid date input');
  }

  // Shift UTC millis by offset
  const localTime = new Date(d.getTime() + offsetMinutes * 60000);
  const y = localTime.getUTCFullYear();
  const m = String(localTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(localTime.getUTCDate()).padStart(2, '0');
  const h = String(localTime.getUTCHours()).padStart(2, '0');
  const min = String(localTime.getUTCMinutes()).padStart(2, '0');
  const s = String(localTime.getUTCSeconds()).padStart(2, '0');
  const ms = String(localTime.getUTCMilliseconds()).padStart(3, '0');

  if (offsetMinutes === 0) {
    return `${y}-${m}-${day}T${h}:${min}:${s}.${ms}Z`;
  }

  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absOffset = Math.abs(offsetMinutes);
  const offH = String(Math.floor(absOffset / 60)).padStart(2, '0');
  const offM = String(absOffset % 60).padStart(2, '0');

  return `${y}-${m}-${day}T${h}:${min}:${s}.${ms}${sign}${offH}:${offM}`;
}
