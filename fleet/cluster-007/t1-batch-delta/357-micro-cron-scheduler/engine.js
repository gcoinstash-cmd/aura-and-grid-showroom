/**
 * Unit #357: Micro-Cron Next-Execution Engine
 * Track 1 (Lean Tuner) — 5-Field Standard Cron Horizon Rig
 */

function parseField(field, min, max) {
  const allowed = new Set();
  const parts = field.split(',');

  for (const part of parts) {
    if (part === '*') {
      for (let i = min; i <= max; i++) allowed.add(i);
    } else if (part.startsWith('*/')) {
      const step = parseInt(part.slice(2), 10);
      for (let i = min; i <= max; i += step) allowed.add(i);
    } else if (part.includes('-')) {
      const [start, end] = part.split('-').map(n => parseInt(n, 10));
      for (let i = start; i <= end; i++) allowed.add(i);
    } else {
      allowed.add(parseInt(part, 10));
    }
  }

  return allowed;
}

export function parseCronExpression(cronStr) {
  const fields = cronStr.trim().split(/\s+/);
  if (fields.length !== 5) throw new Error('Cron expression must have 5 fields');

  return {
    minutes: parseField(fields[0], 0, 59),
    hours: parseField(fields[1], 0, 23),
    daysOfMonth: parseField(fields[2], 1, 31),
    months: parseField(fields[3], 1, 12),
    daysOfWeek: parseField(fields[4], 0, 6)
  };
}

export function matchesCron(cronStr, date = new Date()) {
  const parsed = parseCronExpression(cronStr);
  return (
    parsed.minutes.has(date.getMinutes()) &&
    parsed.hours.has(date.getHours()) &&
    parsed.daysOfMonth.has(date.getDate()) &&
    parsed.months.has(date.getMonth() + 1) &&
    parsed.daysOfWeek.has(date.getDay())
  );
}
