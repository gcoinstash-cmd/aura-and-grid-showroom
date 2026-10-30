/**
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
  const parts = cronExpr.trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new Error(`Invalid cron expression '${cronExpr}': must have 5 fields`);
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
