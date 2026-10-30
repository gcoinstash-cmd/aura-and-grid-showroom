/**
 * Unit #391: Exponential Backoff Full & Equal Jitter Calculator
 * Track 1 (Lean Tuner) — AWS Architecture Exponential Backoff Engine
 */

export function calculateBackoff(attempt, options = {}) {
  const {
    baseMs = 100,
    maxMs = 10000,
    factor = 2,
    jitter = 'full', // 'none', 'full', 'equal', 'decorrelated'
    prevSleepMs = baseMs
  } = options;

  if (attempt <= 0) return 0;

  // Unjittered exponential backoff: min(maxMs, baseMs * factor^(attempt - 1))
  const rawSleep = Math.min(maxMs, baseMs * Math.pow(factor, attempt - 1));

  let delay = rawSleep;

  if (jitter === 'full') {
    // Full jitter: Uniform(0, rawSleep)
    delay = Math.floor(Math.random() * rawSleep);
  } else if (jitter === 'equal') {
    // Equal jitter: rawSleep / 2 + Uniform(0, rawSleep / 2)
    const half = rawSleep / 2;
    delay = Math.floor(half + Math.random() * half);
  } else if (jitter === 'decorrelated') {
    // Decorrelated jitter: min(maxMs, Uniform(baseMs, prevSleepMs * 3))
    delay = Math.min(maxMs, Math.floor(baseMs + Math.random() * (prevSleepMs * 3 - baseMs)));
  }

  return Math.max(0, Math.min(maxMs, delay));
}
