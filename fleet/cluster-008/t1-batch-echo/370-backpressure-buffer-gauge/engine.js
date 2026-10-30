/**
 * Unit #370: High-Watermark Backpressure Gauge & Queue Meter
 * Track 1 (Lean Tuner) — Queue Depth & Backpressure Controller
 */

export class BackpressureGauge {
  constructor(options = {}) {
    this.highWatermark = options.highWatermark ?? 100;
    this.lowWatermark = options.lowWatermark ?? 20;
    this.maxBytes = options.maxBytes ?? 1024 * 1024; // 1MB default
    this.queue = [];
    this.currentBytes = 0;
    this.isPaused = false;
  }

  push(item, byteSize = 1) {
    this.queue.push(item);
    this.currentBytes += byteSize;

    let pausedNow = false;
    if (!this.isPaused && (this.queue.length >= this.highWatermark || this.currentBytes >= this.maxBytes)) {
      this.isPaused = true;
      pausedNow = true;
    }

    return {
      queued: this.queue.length,
      bytes: this.currentBytes,
      pressureRatio: Number((this.queue.length / this.highWatermark).toFixed(4)),
      isPaused: this.isPaused,
      pausedNow
    };
  }

  shift(byteSize = 1) {
    if (this.queue.length === 0) return null;
    const item = this.queue.shift();
    this.currentBytes = Math.max(0, this.currentBytes - byteSize);

    let resumedNow = false;
    if (this.isPaused && this.queue.length <= this.lowWatermark && this.currentBytes < this.maxBytes * 0.5) {
      this.isPaused = false;
      resumedNow = true;
    }

    return {
      item,
      queued: this.queue.length,
      bytes: this.currentBytes,
      pressureRatio: Number((this.queue.length / this.highWatermark).toFixed(4)),
      isPaused: this.isPaused,
      resumedNow
    };
  }

  getStats() {
    return {
      queued: this.queue.length,
      bytes: this.currentBytes,
      highWatermark: this.highWatermark,
      lowWatermark: this.lowWatermark,
      isPaused: this.isPaused
    };
  }
}
