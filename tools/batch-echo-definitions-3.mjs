/**
 * Batch Echo Definitions — Part 3: Units #374 to #378
 * GeoIP distancer, Timezone normalizer, Working days calculator, Cron interval matcher, ISO duration parser
 */

export const PART_3_UNITS = [
  // UNIT #374: Haversine GeoIP Great-Circle Distancer & Proximity Rig
  {
    num: 374,
    folder: '374-geoip-distancer',
    name: 'Haversine GeoIP Great-Circle Distancer & Proximity Rig',
    tag: 'GF-T1-374',
    benchmark: '< 0.01ms haversine distance calculation',
    engineCode: `/**
 * Unit #374: Haversine GeoIP Great-Circle Distancer & Proximity Rig
 * Track 1 (Lean Tuner) — Great-Circle Distance Engine
 */

const EARTH_RADIUS_KM = 6371;
const EARTH_RADIUS_MILES = 3958.8;

function toRad(degrees) {
  return (degrees * Math.PI) / 180;
}

export function calculateDistance(coordA, coordB, unit = 'km') {
  const lat1 = Array.isArray(coordA) ? coordA[0] : coordA.lat;
  const lon1 = Array.isArray(coordA) ? coordA[1] : (coordA.lon ?? coordA.lng);
  const lat2 = Array.isArray(coordB) ? coordB[0] : coordB.lat;
  const lon2 = Array.isArray(coordB) ? coordB[1] : (coordB.lon ?? coordB.lng);

  if ([lat1, lon1, lat2, lon2].some(v => typeof v !== 'number' || Number.isNaN(v))) {
    throw new TypeError('Coordinates must contain valid numerical lat and lon values');
  }

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const rLat1 = toRad(lat1);
  const rLat2 = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const radius = unit === 'miles' ? EARTH_RADIUS_MILES : EARTH_RADIUS_KM;

  return Number((radius * c).toFixed(2));
}

export function isWithinRadius(coordA, coordB, radius, unit = 'km') {
  const dist = calculateDistance(coordA, coordB, unit);
  return dist <= radius;
}
`,
    testCode: `import assert from 'node:assert/strict';
import { calculateDistance, isWithinRadius } from './engine.js';

console.log('⚡ [Unit #374 Test Suite] Testing GeoIP Distancer...');

// Test 1: London to Paris distance (~343 km)
{
  const london = { lat: 51.5074, lon: -0.1278 };
  const paris = { lat: 48.8566, lon: 2.3522 };

  const distKm = calculateDistance(london, paris, 'km');
  assert.ok(distKm >= 340 && distKm <= 350, \`Expected ~343km, got \${distKm}\`);

  const distMiles = calculateDistance(london, paris, 'miles');
  assert.ok(distMiles >= 210 && distMiles <= 220, \`Expected ~213 miles, got \${distMiles}\`);

  assert.equal(isWithinRadius(london, paris, 400, 'km'), true);
  assert.equal(isWithinRadius(london, paris, 300, 'km'), false);
  console.log('  ✔ Haversine great-circle distance & proximity checks passed');
}
`
  },

  // UNIT #375: Timezone Offset Normalizer & UTC Timestamp Synchronizer
  {
    num: 375,
    folder: '375-timezone-normalizer',
    name: 'Timezone Offset Normalizer & UTC Timestamp Synchronizer',
    tag: 'GF-T1-375',
    benchmark: '< 0.02ms ISO timezone offset normalization',
    engineCode: `/**
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

  const match = isoString.match(/([+-])(\\d{2}):?(\\d{2})$/);
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
    return \`\${y}-\${m}-\${day}T\${h}:\${min}:\${s}.\${ms}Z\`;
  }

  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absOffset = Math.abs(offsetMinutes);
  const offH = String(Math.floor(absOffset / 60)).padStart(2, '0');
  const offM = String(absOffset % 60).padStart(2, '0');

  return \`\${y}-\${m}-\${day}T\${h}:\${min}:\${s}.\${ms}\${sign}\${offH}:\${offM}\`;
}
`,
    testCode: `import assert from 'node:assert/strict';
import { normalizeToUtc, extractTimezoneOffsetMinutes, formatWithCustomOffset } from './engine.js';

console.log('⚡ [Unit #375 Test Suite] Testing Timezone Normalizer...');

// Test 1: Normalize with offset to UTC
{
  const input = '2026-10-30T10:00:00+02:00';
  const utc = normalizeToUtc(input);
  assert.equal(utc, '2026-10-30T08:00:00.000Z');

  const offset = extractTimezoneOffsetMinutes(input);
  assert.equal(offset, 120);

  const custom = formatWithCustomOffset('2026-10-30T08:00:00.000Z', 120);
  assert.equal(custom, '2026-10-30T10:00:00.000+02:00');
  console.log('  ✔ UTC normalization & custom offset formatting verified');
}
`
  },

  // UNIT #376: Business Days & Operational Workday Schedule Calculator
  {
    num: 376,
    folder: '376-working-days-calculator',
    name: 'Business Days & Operational Workday Schedule Calculator',
    tag: 'GF-T1-376',
    benchmark: '< 0.03ms working days calculation',
    engineCode: `/**
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
`,
    testCode: `import assert from 'node:assert/strict';
import { countWorkingDays, addWorkingDays } from './engine.js';

console.log('⚡ [Unit #376 Test Suite] Testing Working Days Calculator...');

// Test 1: Count working days in Mon-Sun week
{
  // Monday 2026-10-05 to Friday 2026-10-09 = 5 business days
  const workdays = countWorkingDays('2026-10-05', '2026-10-09');
  assert.equal(workdays, 5);

  // With a holiday on Wednesday 2026-10-07
  const withHoliday = countWorkingDays('2026-10-05', '2026-10-09', ['2026-10-07']);
  assert.equal(withHoliday, 4);
  console.log('  ✔ Workday counting with holidays passed');
}

// Test 2: Add working days across weekend
{
  // Friday 2026-10-09 + 1 working day = Monday 2026-10-12
  const nextWorkDay = addWorkingDays('2026-10-09', 1);
  assert.equal(nextWorkDay.toISOString().slice(0, 10), '2026-10-12');
  console.log('  ✔ Weekend skipping workday addition passed');
}
`
  },

  // UNIT #377: 5-Field Cron Expression Matcher & Next Execution Estimator
  {
    num: 377,
    folder: '377-cron-interval-matcher',
    name: '5-Field Cron Expression Matcher & Next Execution Estimator',
    tag: 'GF-T1-377',
    benchmark: '< 0.04ms cron expression match & next evaluation',
    engineCode: `/**
 * Unit #377: 5-Field Cron Expression Matcher & Next Execution Estimator
 * Track 1 (Lean Tuner) — Pure Node.js Cron Syntax Evaluator
 */

function matchField(pattern, val, min, max) {
  if (pattern === '*') return true;

  // Step expressions */5 or 10-30/5
  if (pattern.includes('/')) {
    const [rangePart, stepStr] = pattern.split('/');
    const step = parseInt(stepStr, 10);
    let start = min;
    let end = max;
    if (rangePart !== '*') {
      const [r1, r2] = rangePart.split('-').map(Number);
      start = r1;
      end = r2 ?? max;
    }
    if (val < start || val > end) return false;
    return (val - start) % step === 0;
  }

  // Lists: 1,5,10
  if (pattern.includes(',')) {
    return pattern.split(',').some(p => matchField(p.trim(), val, min, max));
  }

  // Ranges: 1-5
  if (pattern.includes('-')) {
    const [r1, r2] = pattern.split('-').map(Number);
    return val >= r1 && val <= r2;
  }

  return parseInt(pattern, 10) === val;
}

export function matchesCron(cronExpr, date = new Date()) {
  const parts = cronExpr.trim().split(/\\s+/);
  if (parts.length !== 5) {
    throw new Error(\`Invalid cron expression '\${cronExpr}': must have 5 fields\`);
  }

  const [minPart, hourPart, domPart, monthPart, dowPart] = parts;

  const min = date.getMinutes();
  const hour = date.getHours();
  const dom = date.getDate();
  const month = date.getMonth() + 1; // 1-12
  const dow = date.getDay(); // 0-6

  return (
    matchField(minPart, min, 0, 59) &&
    matchField(hourPart, hour, 0, 23) &&
    matchField(domPart, dom, 1, 31) &&
    matchField(monthPart, month, 1, 12) &&
    matchField(dowPart, dow, 0, 6)
  );
}

export function getNextCronRun(cronExpr, fromDate = new Date(), maxMinutes = 1440 * 7) {
  const d = new Date(fromDate);
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() + 1); // Next minute

  for (let i = 0; i < maxMinutes; i++) {
    if (matchesCron(cronExpr, d)) {
      return new Date(d);
    }
    d.setMinutes(d.getMinutes() + 1);
  }

  return null;
}
`,
    testCode: `import assert from 'node:assert/strict';
import { matchesCron, getNextCronRun } from './engine.js';

console.log('⚡ [Unit #377 Test Suite] Testing Cron Interval Matcher...');

// Test 1: Match every 5 minutes
{
  const d1 = new Date('2026-10-30T14:15:00');
  const d2 = new Date('2026-10-30T14:16:00');

  assert.equal(matchesCron('*/5 * * * *', d1), true);
  assert.equal(matchesCron('*/5 * * * *', d2), false);
  console.log('  ✔ Step-based cron matching passed');
}

// Test 2: Next cron run estimator
{
  const start = new Date('2026-10-30T14:11:00');
  const next = getNextCronRun('*/5 * * * *', start);
  assert.equal(next.getMinutes(), 15);
  console.log('  ✔ Next cron execution projection verified');
}
`
  },

  // UNIT #378: ISO 8601 Duration Parser & Millisecond Converter
  {
    num: 378,
    folder: '378-iso-duration-parser',
    name: 'ISO 8601 Duration Parser & Millisecond Converter',
    tag: 'GF-T1-378',
    benchmark: '< 0.02ms ISO 8601 duration parse',
    engineCode: `/**
 * Unit #378: ISO 8601 Duration Parser & Millisecond Converter
 * Track 1 (Lean Tuner) — ISO 8601 Duration Deconstructor & Formatter
 */

const DURATION_REGEX = /^P(?:(\\d+(?:\\.\\d+)?)Y)?(?:(\\d+(?:\\.\\d+)?)M)?(?:(\\d+(?:\\.\\d+)?)W)?(?:(\\d+(?:\\.\\d+)?)D)?(?:T(?:(\\d+(?:\\.\\d+)?)H)?(?:(\\d+(?:\\.\\d+)?)M)?(?:(\\d+(?:\\.\\d+)?)S)?)?$/;

export function parseIsoDuration(durationStr) {
  if (typeof durationStr !== 'string') {
    throw new TypeError('Duration must be a string');
  }

  const match = durationStr.match(DURATION_REGEX);
  if (!match) {
    throw new Error(\`Invalid ISO 8601 duration: '\${durationStr}'\`);
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
  if (hours > 0) out += \`\${hours}H\`;
  if (minutes > 0) out += \`\${minutes}M\`;
  if (seconds > 0) out += \`\${seconds}S\`;
  return out === 'PT' ? 'PT0S' : out;
}
`,
    testCode: `import assert from 'node:assert/strict';
import { parseIsoDuration, durationToMilliseconds, formatMillisecondsToIsoDuration } from './engine.js';

console.log('⚡ [Unit #378 Test Suite] Testing ISO Duration Parser...');

// Test 1: Parse and convert to milliseconds
{
  const dur = 'PT1H30M';
  const parsed = parseIsoDuration(dur);
  assert.equal(parsed.hours, 1);
  assert.equal(parsed.minutes, 30);

  const ms = durationToMilliseconds(dur);
  assert.equal(ms, 5400000);

  const formatted = formatMillisecondsToIsoDuration(5400000);
  assert.equal(formatted, 'PT1H30M');
  console.log('  ✔ ISO 8601 duration parsing & ms roundtrip verified');
}
`
  }
];
