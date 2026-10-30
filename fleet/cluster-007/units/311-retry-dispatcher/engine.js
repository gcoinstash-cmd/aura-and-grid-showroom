/**
 * Unit #311: Exponential Backoff Retry Dispatcher
 * Track 1 (Lean Tuner) — Resilient Async Task Dispatcher Rig
 * 
 * GhostFactoryOS Architecture: Cluster-007
 * Pure ESM | Zero External Dependencies (Node.js Standard Library Only)
 */

export class RetryExhaustedError extends Error {
  constructor(message, attempts, lastError) {
    super(message);
    this.name = 'RetryExhaustedError';
    this.attempts = attempts;
    this.lastError = lastError;
  }
}

/**
 * Calculates exponential backoff delay with jitter.
 * 
 * @param {number} attempt - Current attempt (1-indexed)
 * @param {number} [baseDelayMs=50] 
 * @param {number} [maxDelayMs=5000] 
 * @param {number} [multiplier=2] 
 * @param {'full'|'equal'|'none'} [jitter='full'] 
 * @returns {number} Delay in milliseconds
 */
export function calculateBackoffDelay(attempt, baseDelayMs = 50, maxDelayMs = 5000, multiplier = 2, jitter = 'full') {
  const exponential = Math.min(maxDelayMs, baseDelayMs * Math.pow(multiplier, attempt - 1));
  if (jitter === 'none') {
    return exponential;
  }
  if (jitter === 'equal') {
    const half = exponential / 2;
    return Math.round(half + Math.random() * half);
  }
  // Full jitter: random between 0 and exponential
  return Math.round(Math.random() * exponential);
}

/**
 * Dispatches an asynchronous operation with exponential backoff and jitter.
 * 
 * @template T
 * @param {() => Promise<T>|T} operation 
 * @param {{
 *   maxRetries?: number,
 *   baseDelayMs?: number,
 *   maxDelayMs?: number,
 *   multiplier?: number,
 *   jitter?: 'full'|'equal'|'none',
 *   retryIf?: (err: any) => boolean,
 *   onRetry?: (attempt: number, err: any, delayMs: number) => void
 * }} [options={}] 
 * @returns {Promise<T>}
 */
export async function executeWithRetry(operation, options = {}) {
  const maxRetries = options.maxRetries ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 20;
  const maxDelayMs = options.maxDelayMs ?? 2000;
  const multiplier = options.multiplier ?? 2;
  const jitter = options.jitter ?? 'full';
  const retryIf = options.retryIf ?? (() => true);
  const onRetry = options.onRetry ?? (() => {});

  let attempt = 0;
  let lastError = null;

  while (attempt <= maxRetries) {
    attempt++;
    try {
      return await operation();
    } catch (err) {
      lastError = err;
      if (attempt > maxRetries || !retryIf(err)) {
        throw new RetryExhaustedError(
          `Operation failed after ${attempt} attempt(s): ${err.message}`,
          attempt,
          err
        );
      }

      const delay = calculateBackoffDelay(attempt, baseDelayMs, maxDelayMs, multiplier, jitter);
      onRetry(attempt, err, delay);

      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new RetryExhaustedError('Operation failed with unknown error', attempt, lastError);
}

/**
 * Performance benchmark.
 * @param {number} [iterations=1000] 
 */
export function benchmarkRetryDispatcher(iterations = 1000) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    calculateBackoffDelay(3, 50, 5000, 2, 'full');
    calculateBackoffDelay(2, 50, 5000, 2, 'equal');
  }
  const totalMs = performance.now() - start;
  return {
    iterations,
    totalMs: Number(totalMs.toFixed(3)),
    avgLatencyUs: Number(((totalMs * 1000) / iterations).toFixed(2)),
    opsPerSec: Math.round((iterations / totalMs) * 1000)
  };
}
