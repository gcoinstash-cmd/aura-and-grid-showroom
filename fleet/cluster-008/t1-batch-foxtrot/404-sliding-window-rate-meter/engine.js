/**
 * Unit #404: Sliding Window Counter & Requests-Per-Second (RPS) Meter
 * Track 1 (Lean Tuner) — Multi-Bucket Sliding Window Rate Meter
 */

export class SlidingWindowMeter {
  constructor(windowMs = 1000, bucketCount = 10) {
    this.windowMs = windowMs;
    this.bucketCount = bucketCount;
    this.bucketDuration = windowMs / bucketCount;
    this.buckets = new Array(bucketCount).fill(0);
    this.bucketTimestamps = new Array(bucketCount).fill(0);
  }

  _getBucketIndex(now) {
    const bucketIdx = Math.floor(now / this.bucketDuration) % this.bucketCount;
    const bucketTime = Math.floor(now / this.bucketDuration);

    if (this.bucketTimestamps[bucketIdx] !== bucketTime) {
      this.buckets[bucketIdx] = 0;
      this.bucketTimestamps[bucketIdx] = bucketTime;
    }

    return bucketIdx;
  }

  mark(count = 1, now = Date.now()) {
    const idx = this._getBucketIndex(now);
    this.buckets[idx] += count;
  }

  getCount(now = Date.now()) {
    const minTime = Math.floor((now - this.windowMs) / this.bucketDuration);
    let total = 0;

    for (let i = 0; i < this.bucketCount; i++) {
      if (this.bucketTimestamps[i] > minTime) {
        total += this.buckets[i];
      }
    }

    return total;
  }

  getRate(now = Date.now()) {
    const count = this.getCount(now);
    return Number(((count / this.windowMs) * 1000).toFixed(2));
  }
}
