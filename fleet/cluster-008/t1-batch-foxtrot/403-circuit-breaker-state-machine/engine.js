/**
 * Unit #403: Circuit Breaker Failure Guard & Tripper
 * Track 1 (Lean Tuner) — Fault-Tolerance Circuit Breaker Rig
 */

export class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.resetTimeoutMs = options.resetTimeoutMs ?? 10000;
    this.halfOpenSuccessThreshold = options.halfOpenSuccessThreshold ?? 2;

    this.state = 'CLOSED'; // 'CLOSED', 'OPEN', 'HALF_OPEN'
    this.failureCount = 0;
    this.consecutiveSuccesses = 0;
    this.nextAttempt = Date.now();
  }

  getState() {
    if (this.state === 'OPEN' && Date.now() >= this.nextAttempt) {
      this.state = 'HALF_OPEN';
      this.consecutiveSuccesses = 0;
    }
    return this.state;
  }

  recordSuccess() {
    this.failureCount = 0;
    if (this.state === 'HALF_OPEN') {
      this.consecutiveSuccesses++;
      if (this.consecutiveSuccesses >= this.halfOpenSuccessThreshold) {
        this.state = 'CLOSED';
      }
    }
  }

  recordFailure() {
    this.failureCount++;
    if (this.state === 'HALF_OPEN' || this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.resetTimeoutMs;
    }
  }

  execute(fn) {
    if (this.getState() === 'OPEN') {
      throw new Error('CircuitBreakerOpenError: Circuit is OPEN, fast-failing call');
    }

    try {
      const res = fn();
      this.recordSuccess();
      return res;
    } catch (err) {
      this.recordFailure();
      throw err;
    }
  }

  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.consecutiveSuccesses = 0;
    this.nextAttempt = Date.now();
  }
}
