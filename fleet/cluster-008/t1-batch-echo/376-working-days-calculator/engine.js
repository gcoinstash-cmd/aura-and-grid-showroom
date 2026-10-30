/**
 * Unit #376: Business Days & Operational Workday Schedule Calculator
 * Track 1 (Lean Tuner) — Timezone-Agnostic Working Days & Holiday Calendar Engine
 */

export function parseUtcDate(input) {
  if (input instanceof Date) {
    return new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate()));
  }
  if (typeof input === 'string') {
    const parts = input.slice(0, 10).split('-').map(Number);
    if (parts.length === 3) {
      return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    }
  }
  const d = new Date(input);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function isWeekend(date) {
  const day = date.getUTCDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

export function countWorkingDays(startDate, endDate, holidays = []) {
  const start = parseUtcDate(startDate);
  const end = parseUtcDate(endDate);

  if (start > end) {
    return 0;
  }

  const holidaySet = new Set(holidays.map(h => parseUtcDate(h).toISOString().slice(0, 10)));
  let count = 0;
  const current = new Date(start);

  while (current <= end) {
    const isoDate = current.toISOString().slice(0, 10);
    if (!isWeekend(current) && !holidaySet.has(isoDate)) {
      count++;
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return count;
}

export function addWorkingDays(startDate, daysToAdd, holidays = []) {
  if (daysToAdd <= 0) return parseUtcDate(startDate);

  const holidaySet = new Set(holidays.map(h => parseUtcDate(h).toISOString().slice(0, 10)));
  const current = parseUtcDate(startDate);
  let added = 0;

  while (added < daysToAdd) {
    current.setUTCDate(current.getUTCDate() + 1);
    const isoDate = current.toISOString().slice(0, 10);
    if (!isWeekend(current) && !holidaySet.has(isoDate)) {
      added++;
    }
  }

  return current;
}
