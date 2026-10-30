/**
 * Unit #395: Exponential Moving Average (EMA) Smoother
 * Track 1 (Lean Tuner) — Realtime Low-Pass Noise Filter
 */

export class ExponentialMovingAverage {
  constructor(options = {}) {
    if (typeof options === 'number') {
      options = { alpha: options };
    }
    const { alpha, period = 10 } = options;
    this.alpha = alpha !== undefined ? alpha : 2 / (period + 1);
    if (this.alpha <= 0 || this.alpha > 1) {
      throw new RangeError('Alpha must be between (0, 1]');
    }
    this.ema = null;
    this.samples = 0;
  }

  push(value) {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      throw new TypeError('Value must be a valid number');
    }

    if (this.ema === null) {
      this.ema = value;
    } else {
      this.ema = this.alpha * value + (1 - this.alpha) * this.ema;
    }

    this.samples++;
    return Number(this.ema.toFixed(4));
  }

  get() {
    return this.ema !== null ? Number(this.ema.toFixed(4)) : null;
  }

  reset() {
    this.ema = null;
    this.samples = 0;
  }
}
