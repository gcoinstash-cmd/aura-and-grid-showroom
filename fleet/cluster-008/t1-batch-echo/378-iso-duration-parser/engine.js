/**
 * Unit #378: ISO 8601 Duration Parser & Millisecond Converter
 * Track 1 (Lean Tuner) — ISO 8601 Duration Deconstructor & Formatter
 */

const DURATION_REGEX = /^P(?:(\d+(?:\.\d+)?)Y)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)W)?(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/;

export function parseIsoDuration(durationStr) {
  if (typeof durationStr !== 'string') {
    throw new TypeError('Duration must be a string');
  }

  const match = durationStr.match(DURATION_REGEX);
  if (!match) {
    throw new Error(`Invalid ISO 8601 duration: '${durationStr}'`);
  }

  const [
    ,
    years = 0,
    months = 0,
    weeks = 0,
    days = 0,
    hours = 0,
    minutes = 0,
    seconds = 0
  ] = match;

  return {
    years: parseFloat(years) || 0,
    months: parseFloat(months) || 0,
    weeks: parseFloat(weeks) || 0,
    days: parseFloat(days) || 0,
    hours: parseFloat(hours) || 0,
    minutes: parseFloat(minutes) || 0,
    seconds: parseFloat(seconds) || 0
  };
}

export function durationToMilliseconds(durationStr) {
  const p = parseIsoDuration(durationStr);

  const msInSecond = 1000;
  const msInMinute = 60 * msInSecond;
  const msInHour = 60 * msInMinute;
  const msInDay = 24 * msInHour;
  const msInWeek = 7 * msInDay;
  const msInMonth = 30 * msInDay; // approximate standard
  const msInYear = 365 * msInDay; // approximate standard

  return (
    p.years * msInYear +
    p.months * msInMonth +
    p.weeks * msInWeek +
    p.days * msInDay +
    p.hours * msInHour +
    p.minutes * msInMinute +
    p.seconds * msInSecond
  );
}

export function formatMillisecondsToIsoDuration(ms) {
  if (typeof ms !== 'number' || ms < 0) throw new TypeError('ms must be a non-negative number');
  if (ms === 0) return 'PT0S';

  let remaining = ms;
  const hours = Math.floor(remaining / 3600000);
  remaining %= 3600000;
  const minutes = Math.floor(remaining / 60000);
  remaining %= 60000;
  const seconds = Number((remaining / 1000).toFixed(3));

  let out = 'PT';
  if (hours > 0) out += `${hours}H`;
  if (minutes > 0) out += `${minutes}M`;
  if (seconds > 0) out += `${seconds}S`;
  return out === 'PT' ? 'PT0S' : out;
}
