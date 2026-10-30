/**
 * Unit #390: Microsecond & Nanosecond High-Res Execution Timer
 * Track 1 (Lean Tuner) — High-Resolution hrtime Execution Benchmark Rig
 */

export function startTimer() {
  const start = process.hrtime.bigint();
  return {
    stop() {
      const end = process.hrtime.bigint();
      const durationNs = Number(end - start);
      const durationUs = Number((durationNs / 1e3).toFixed(2));
      const durationMs = Number((durationNs / 1e6).toFixed(3));
      const durationSec = Number((durationNs / 1e9).toFixed(6));

      return {
        durationNs,
        durationUs,
        durationMs,
        durationSec
      };
    }
  };
}

export function timeSync(fn) {
  const timer = startTimer();
  const result = fn();
  const metrics = timer.stop();
  return { result, ...metrics };
}

export async function timeAsync(asyncFn) {
  const timer = startTimer();
  const result = await asyncFn();
  const metrics = timer.stop();
  return { result, ...metrics };
}
