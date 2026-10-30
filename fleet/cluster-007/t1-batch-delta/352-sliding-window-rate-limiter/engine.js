/**
 * Unit #352: Rate-Limit Sliding Window Calculator
 * Track 1 (Lean Tuner) — Standalone In-Memory Sliding Log Limiter
 */

export class SlidingWindowLimiter {
  constructor(limit = 60, windowMs = 60000) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.buckets = new Map();
  }

  check(key, cost = 1) {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    let timestamps = this.buckets.get(key) || [];
    // Prune stale timestamps
    timestamps = timestamps.filter(t => t > windowStart);

    if (timestamps.length + cost <= this.limit) {
      for (let i = 0; i < cost; i++) timestamps.push(now);
      this.buckets.set(key, timestamps);
      return {
        allowed: true,
        remaining: this.limit - timestamps.length,
        resetMs: Math.max(0, timestamps[0] + this.windowMs - now)
      };
    } else {
      this.buckets.set(key, timestamps);
      return {
        allowed: false,
        remaining: 0,
        resetMs: Math.max(0, timestamps[0] + this.windowMs - now)
      };
    }
  }

  reset(key) {
    this.buckets.delete(key);
  }
}
