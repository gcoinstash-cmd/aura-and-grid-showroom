/**
 * Unit #317: ISO 8601 Timestamp Normalizer & Drift Checker
 * Track 1 (Lean Tuner) — Zero-Dependency Time Telemetry Engine
 * 
 * GhostFactoryOS Architecture: Cluster-007
 * Pure ESM | Zero External Dependencies (Node.js Standard Library Only)
 */

export class TimeSyncError extends Error {
  constructor(message, code = 'ERR_TIME_SYNC', details = null) {
    super(message);
    this.name = 'TimeSyncError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Normalizes diverse timestamp formats into strict UTC ISO 8601.
 * Supports ISO-8601 strings, UNIX epoch seconds, UNIX epoch ms, and Date objects.
 * 
 * @param {string|number|Date} rawTime 
 * @returns {{ isoUtc: string, epochMs: number, valid: boolean }}
 */
export function normalizeIsoTimestamp(rawTime) {
  if (rawTime === null || rawTime === undefined || rawTime === '') {
    const now = Date.now();
    return { isoUtc: new Date(now).toISOString(), epochMs: now, valid: false };
  }

  let ms;
  let parseFailed = false;

  if (rawTime instanceof Date) {
    ms = rawTime.getTime();
    if (Number.isNaN(ms)) parseFailed = true;
  } else if (typeof rawTime === 'number') {
    // 10-digit seconds vs 13-digit ms
    ms = (rawTime > 0 && rawTime < 10000000000) ? Math.round(rawTime * 1000) : Math.round(rawTime);
  } else if (typeof rawTime === 'string') {
    const trimmed = rawTime.trim();
    if (/^\d+(\.\d+)?$/.test(trimmed)) {
      const num = Number(trimmed);
      ms = num < 10000000000 ? Math.round(num * 1000) : Math.round(num);
    } else {
      const parsed = Date.parse(trimmed);
      if (Number.isNaN(parsed)) {
        ms = Date.now();
        parseFailed = true;
      } else {
        ms = parsed;
      }
    }
  } else {
    ms = Date.now();
    parseFailed = true;
  }

  const isValid = !parseFailed && Number.isFinite(ms) && ms > 0 && ms < 4102444800000;
  const safeMs = isValid ? ms : Date.now();

  return {
    isoUtc: new Date(safeMs).toISOString(),
    epochMs: safeMs,
    valid: isValid
  };
}

/**
 * Calculates clock drift between local machine clock and remote telemetry timestamp.
 * 
 * @param {string|number|Date} remoteTime 
 * @param {number} [localEpochMs=Date.now()] 
 * @param {{ warningThresholdMs?: number, criticalThresholdMs?: number }} [options={}] 
 * @returns {{
 *   driftMs: number,
 *   driftSec: number,
 *   skewDirection: 'AHEAD'|'BEHIND'|'IN_SYNC',
 *   severity: 'NORMAL'|'WARNING'|'CRITICAL'
 * }}
 */
export function measureClockDrift(remoteTime, localEpochMs = Date.now(), options = {}) {
  const norm = normalizeIsoTimestamp(remoteTime);
  const warnLimit = options.warningThresholdMs ?? 500;
  const critLimit = options.criticalThresholdMs ?? 2000;

  const driftMs = norm.epochMs - localEpochMs;
  const absDrift = Math.abs(driftMs);

  let skewDirection = 'IN_SYNC';
  if (driftMs > 10) skewDirection = 'AHEAD';
  else if (driftMs < -10) skewDirection = 'BEHIND';

  let severity = 'NORMAL';
  if (absDrift >= critLimit) severity = 'CRITICAL';
  else if (absDrift >= warnLimit) severity = 'WARNING';

  return {
    driftMs,
    driftSec: Number((driftMs / 1000).toFixed(3)),
    skewDirection,
    severity
  };
}

/**
 * Formats a millisecond duration into human-readable notation (e.g. "2h 14m 30s 120ms").
 * @param {number} durationMs 
 * @returns {string}
 */
export function formatDuration(durationMs) {
  if (durationMs < 1000) return `${Math.round(durationMs)}ms`;
  const sec = Math.floor(durationMs / 1000) % 60;
  const min = Math.floor(durationMs / (1000 * 60)) % 60;
  const hr = Math.floor(durationMs / (1000 * 60 * 60));

  const parts = [];
  if (hr > 0) parts.push(`${hr}h`);
  if (min > 0) parts.push(`${min}m`);
  if (sec > 0 || parts.length === 0) parts.push(`${sec}s`);

  return parts.join(' ');
}

/**
 * Performance benchmark.
 * @param {number} [iterations=2000] 
 */
export function benchmarkTimestampEngine(iterations = 2000) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    normalizeIsoTimestamp('2026-10-30T12:00:00.000Z');
    measureClockDrift(1793388000000, 1793388000500);
  }
  const totalMs = performance.now() - start;

  return {
    iterations,
    totalMs: Number(totalMs.toFixed(3)),
    avgLatencyUs: Number(((totalMs * 1000) / iterations).toFixed(2)),
    opsPerSec: Math.round((iterations / totalMs) * 1000)
  };
}
