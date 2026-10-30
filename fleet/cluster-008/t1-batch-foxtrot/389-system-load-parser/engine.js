/**
 * Unit #389: System Load Average & CPU Telemetry Parser
 * Track 1 (Lean Tuner) — Multi-Core CPU Saturation & Load Meter
 */

import os from 'node:os';

export function parseLoadAvg(loadArray, cpuCount = os.cpus().length) {
  const cpus = Math.max(1, cpuCount);
  const [load1m = 0, load5m = 0, load15m = 0] = loadArray || os.loadavg();

  const ratio1m = Number((load1m / cpus).toFixed(4));
  const ratio5m = Number((load5m / cpus).toFixed(4));
  const ratio15m = Number((load15m / cpus).toFixed(4));

  let status = 'NORMAL';
  if (ratio1m >= 1.0) {
    status = 'SATURATED';
  } else if (ratio1m >= 0.7) {
    status = 'ELEVATED';
  }

  return {
    cpus,
    rawLoad: [load1m, load5m, load15m],
    saturationRatio: {
      '1m': ratio1m,
      '5m': ratio5m,
      '15m': ratio15m
    },
    percentLoad: {
      '1m': Number((ratio1m * 100).toFixed(1)),
      '5m': Number((ratio5m * 100).toFixed(1)),
      '15m': Number((ratio15m * 100).toFixed(1))
    },
    status
  };
}
