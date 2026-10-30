/**
 * Unit #356: Exponential Histogram Telemetry Bucket
 * Track 1 (Lean Tuner) — Logarithmic Telemetry Bucketing Rig
 */

export class ExponentialHistogram {
  constructor(base = 2) {
    this.base = base;
    this.buckets = new Map();
    this.count = 0;
    this.sum = 0;
    this.min = Infinity;
    this.max = -Infinity;
  }

  record(val) {
    if (typeof val !== 'number' || isNaN(val) || val <= 0) return;

    this.count++;
    this.sum += val;
    if (val < this.min) this.min = val;
    if (val > this.max) this.max = val;

    // Log base computation for bucket index
    const index = Math.floor(Math.log(val) / Math.log(this.base));
    this.buckets.set(index, (this.buckets.get(index) || 0) + 1);
  }

  getSnapshot() {
    return {
      count: this.count,
      sum: Number(this.sum.toFixed(2)),
      min: this.count > 0 ? this.min : 0,
      max: this.count > 0 ? this.max : 0,
      mean: this.count > 0 ? Number((this.sum / this.count).toFixed(2)) : 0,
      bucketCount: this.buckets.size
    };
  }
}
