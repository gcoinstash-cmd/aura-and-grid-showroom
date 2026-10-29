/**
 * Welford's Algorithm for Numerically Stable Rolling Z-Score in O(1) Time
 * Permissive MIT Clean-Room Implementation
 *
 * Prevents catastrophic cancellation (loss of significance) common in naive sum-of-squares.
 * Implements sliding window queue with zero-division guards.
 */

import { WelfordStats } from './types';

export class WelfordRollingStats {
  private windowSize: number;
  private buffer: number[];
  private head: number = 0;
  private count: number = 0;

  // Running Welford moments
  private mean: number = 0.0;
  private M2: number = 0.0; // Sum of squared deviations

  constructor(windowSize: number = 50) {
    this.windowSize = Math.max(5, windowSize);
    this.buffer = new Array(this.windowSize).fill(0.0);
  }

  /**
   * Pushes a new sample value (e.g. Kalman spread) and computes updated Z-Score in O(1).
   */
  public update(val: number): WelfordStats {
    if (this.count < this.windowSize) {
      // Buffer is still warming up
      this.buffer[this.count] = val;
      this.count++;

      const delta = val - this.mean;
      this.mean += delta / this.count;
      const delta2 = val - this.mean;
      this.M2 += delta * delta2;
    } else {
      // Buffer is full: perform O(1) sliding window eviction and inclusion
      const oldVal = this.buffer[this.head];
      this.buffer[this.head] = val;
      this.head = (this.head + 1) % this.windowSize;

      const oldMean = this.mean;
      const delta = val - oldVal;
      this.mean += delta / this.windowSize;

      // Sliding window variance update
      this.M2 += (val - oldVal) * (val - this.mean + (oldVal - oldMean));

      // Guard against minor floating point drift under heavy iterations
      if (this.M2 < 0 || this.head === 0) {
        this.recomputeMoments();
      }
    }

    const variance = this.count > 1 ? Math.max(0, this.M2 / (this.count - 1)) : 0.0;
    const stdev = Math.sqrt(variance);

    // Zero-division guard
    const EPSILON = 1e-8;
    const zScore = stdev > EPSILON ? (val - this.mean) / stdev : 0.0;

    return {
      count: this.count,
      mean: this.mean,
      variance,
      stdev,
      zScore,
    };
  }

  /**
   * Resets the running statistics.
   */
  public reset(windowSize?: number): void {
    if (windowSize) {
      this.windowSize = Math.max(5, windowSize);
    }
    this.buffer = new Array(this.windowSize).fill(0.0);
    this.head = 0;
    this.count = 0;
    this.mean = 0.0;
    this.M2 = 0.0;
  }

  /**
   * Periodic recomputation over current buffer items to preserve pristine precision.
   */
  private recomputeMoments(): void {
    const n = this.count;
    if (n === 0) return;

    let mean = 0.0;
    let m2 = 0.0;
    for (let i = 0; i < n; i++) {
      const x = this.buffer[i];
      const delta = x - mean;
      mean += delta / (i + 1);
      const delta2 = x - mean;
      m2 += delta * delta2;
    }
    this.mean = mean;
    this.M2 = Math.max(0, m2);
  }

  public getStats(): { mean: number; stdev: number; count: number } {
    const variance = this.count > 1 ? Math.max(0, this.M2 / (this.count - 1)) : 0.0;
    return {
      mean: this.mean,
      stdev: Math.sqrt(variance),
      count: this.count,
    };
  }
}
