/**
 * Unit #393: Percentile & Histogram Quantile Calculator
 * Track 1 (Lean Tuner) — High-Performance SLA Quantile Engine
 */

export function calculatePercentile(samples, percentile = 95) {
  if (!Array.isArray(samples) || samples.length === 0) return 0;
  if (percentile <= 0) return Math.min(...samples);
  if (percentile >= 100) return Math.max(...samples);

  const sorted = [...samples].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  if (lower === upper) return sorted[lower];
  return Number((sorted[lower] * (1 - weight) + sorted[upper] * weight).toFixed(2));
}

export function calculateLatencySummary(samples) {
  if (!Array.isArray(samples) || samples.length === 0) {
    return { count: 0, min: 0, max: 0, mean: 0, p50: 0, p90: 0, p95: 0, p99: 0 };
  }

  const sorted = [...samples].sort((a, b) => a - b);
  const count = sorted.length;
  const sum = sorted.reduce((acc, v) => acc + v, 0);

  return {
    count,
    min: sorted[0],
    max: sorted[count - 1],
    mean: Number((sum / count).toFixed(2)),
    p50: calculatePercentile(sorted, 50),
    p90: calculatePercentile(sorted, 90),
    p95: calculatePercentile(sorted, 95),
    p99: calculatePercentile(sorted, 99)
  };
}
