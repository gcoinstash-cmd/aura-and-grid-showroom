/**
 * Unit #316: Memory RSS Footprint Sampler Beacon
 * Track 1 (Lean Tuner) — Zero-Dependency Memory Profiling & Health Beacon
 * 
 * GhostFactoryOS Architecture: Cluster-007
 * Pure ESM | Zero External Dependencies (Node.js standard library: node:process)
 */

export class MemoryThresholdError extends Error {
  constructor(message, metrics) {
    super(message);
    this.name = 'MemoryThresholdError';
    this.metrics = metrics;
  }
}

/**
 * Formats a byte quantity into a human-readable string (e.g. "128.45 MB").
 * @param {number} bytes 
 * @param {number} [decimals=2] 
 * @returns {string}
 */
export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  const sign = bytes < 0 ? '-' : '';
  const val = Math.abs(bytes) / Math.pow(k, i);
  return `${sign}${val.toFixed(dm)} ${sizes[i] || 'B'}`;
}

/**
 * Samples current process memory metrics with both raw bytes and MB floats.
 * 
 * @returns {{
 *   rss_bytes: number,
 *   rss_mb: number,
 *   heap_total_bytes: number,
 *   heap_total_mb: number,
 *   heap_used_bytes: number,
 *   heap_used_mb: number,
 *   external_bytes: number,
 *   external_mb: number,
 *   array_buffers_bytes: number,
 *   array_buffers_mb: number,
 *   timestamp_iso: string,
 *   timestamp_epoch_ms: number
 * }}
 */
export function sampleMemory() {
  const mem = process.memoryUsage();
  const toMb = (bytes) => Number((bytes / (1024 * 1024)).toFixed(2));
  const now = Date.now();

  return {
    rss_bytes: mem.rss,
    rss_mb: toMb(mem.rss),
    heap_total_bytes: mem.heapTotal,
    heap_total_mb: toMb(mem.heapTotal),
    heap_used_bytes: mem.heapUsed,
    heap_used_mb: toMb(mem.heapUsed),
    external_bytes: mem.external,
    external_mb: toMb(mem.external),
    array_buffers_bytes: mem.arrayBuffers || 0,
    array_buffers_mb: toMb(mem.arrayBuffers || 0),
    timestamp_iso: new Date(now).toISOString(),
    timestamp_epoch_ms: now
  };
}

/**
 * Memory tracker that records successive snapshots and calculates memory deltas.
 */
export class MemoryTracker {
  constructor() {
    this.baseline = sampleMemory();
    this.history = [this.baseline];
  }

  /**
   * Captures a new snapshot and computes deltas from baseline and last snapshot.
   */
  snapshot(label = '') {
    const current = sampleMemory();
    const last = this.history[this.history.length - 1];

    const deltaFromBaseline = {
      rss_diff_mb: Number((current.rss_mb - this.baseline.rss_mb).toFixed(2)),
      heap_used_diff_mb: Number((current.heap_used_mb - this.baseline.heap_used_mb).toFixed(2))
    };

    const deltaFromLast = {
      rss_diff_mb: Number((current.rss_mb - last.rss_mb).toFixed(2)),
      heap_used_diff_mb: Number((current.heap_used_mb - last.heap_used_mb).toFixed(2))
    };

    const entry = {
      label,
      ...current,
      deltaFromBaseline,
      deltaFromLast
    };

    this.history.push(entry);
    return entry;
  }

  reset() {
    this.baseline = sampleMemory();
    this.history = [this.baseline];
  }
}

/**
 * Asserts that current heap usage does not exceed a specified threshold.
 * 
 * @param {number} maxHeapMb - Maximum allowed heapUsed in megabytes
 * @returns {boolean} True if within threshold, throws MemoryThresholdError if breached
 */
export function assertMemoryBudget(maxHeapMb) {
  const sample = sampleMemory();
  if (sample.heap_used_mb > maxHeapMb) {
    throw new MemoryThresholdError(
      `Heap memory breach: current heap used ${sample.heap_used_mb}MB exceeds maximum budget ${maxHeapMb}MB`,
      sample
    );
  }
  return true;
}

/**
 * Performance benchmark.
 * @param {number} [iterations=2000] 
 */
export function benchmarkMemorySampler(iterations = 2000) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    sampleMemory();
  }
  const totalMs = performance.now() - start;

  return {
    iterations,
    totalMs: Number(totalMs.toFixed(3)),
    avgLatencyUs: Number(((totalMs * 1000) / iterations).toFixed(2)),
    opsPerSec: Math.round((iterations / totalMs) * 1000)
  };
}
