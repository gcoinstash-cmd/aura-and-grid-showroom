/**
 * Unit #349: Micro-Bench Execution Clock Sampler
 * Track 1 (Lean Tuner) — Nanosecond Precision Benchmark Harness
 */

export function sampleMicroBench(fn, options = {}) {
  const { warmupIterations = 100, sampleIterations = 1000 } = options;
  if (typeof fn !== 'function') throw new TypeError('Target must be a callable function');

  // Warmup loop for JIT optimization
  for (let i = 0; i < warmupIterations; i++) {
    fn();
  }

  const times = new Float64Array(sampleIterations);
  for (let i = 0; i < sampleIterations; i++) {
    const start = process.hrtime.bigint();
    fn();
    const end = process.hrtime.bigint();
    times[i] = Number(end - start);
  }

  times.sort();
  let sum = 0;
  for (let i = 0; i < times.length; i++) sum += times[i];

  const meanNs = sum / times.length;
  const p50Ns = times[Math.floor(times.length * 0.50)];
  const p95Ns = times[Math.floor(times.length * 0.95)];
  const p99Ns = times[Math.floor(times.length * 0.99)];
  const minNs = times[0];
  const maxNs = times[times.length - 1];
  const opsPerSec = meanNs > 0 ? Math.floor(1e9 / meanNs) : 0;

  return {
    iterations: sampleIterations,
    minNs,
    maxNs,
    meanNs: Number(meanNs.toFixed(2)),
    p50Ns,
    p95Ns,
    p99Ns,
    opsPerSec
  };
}

export function formatDurationNs(ns) {
  if (ns < 1000) return `${ns.toFixed(0)}ns`;
  if (ns < 1e6) return `${(ns / 1000).toFixed(2)}µs`;
  return `${(ns / 1e6).toFixed(2)}ms`;
}
