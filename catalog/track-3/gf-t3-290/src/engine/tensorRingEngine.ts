/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GF-T3-290 Clean-Room Deterministic Tensor Parallelism & Ring All-Reduce Engine
 * Strictly Zero-Dollar Gate Compliant (Zero ASCII 36 characters)
 */

export enum SyntheticCorridor {
  ALPHA = 'TENSOR-CORRIDOR-ALPHA (DYNAMIC-TENSOR-PARALLELISM-FABRIC · 45600-GB/S)',
  BRAVO = 'TENSOR-CORRIDOR-BRAVO (ALL-REDUCE-RING-TOPOLOGY-ENGINE)',
  GAMMA = 'TENSOR-CORRIDOR-GAMMA (NON-BLOCKING-PEER-TO-PEER-TENSOR-SLICER)',
  DELTA = 'TENSOR-CORRIDOR-DELTA (FALLBACK-MONOLITHIC-TENSOR-PASS)',
}

export interface RankNodeState {
  rankIndex: number;
  code: string;
  title: string;
  hexPtr: string;
  tokensK: number;
  ringGbps: number;
  latencyMs: string;
  syncPct: number;
  statusText: string;
  tensorHealth: string;
  columnSliceWeight: number;
  rowSliceWeight: number;
}

export interface CockpitEngineState {
  corridor: SyntheticCorridor;
  throughputGbps: number;
  throughputFormatted: string;
  saturationPct: number;
  ringLatencyUs: string;
  activeRanks: number;
  totalRanks: number;
  processedTokens: number;
  processedTokensFormatted: string;
  engineXpFormatted: string;
  tensorState: string;
  basePtr: string;
  modeLabel: string;
  collectiveVec: number[];
  selectedRankIndex: number;
  congestionSpikeActive: boolean;
  ringPassStep: number;
  ranks: RankNodeState[];
  radioComms: [string, string];
  apaOrderStatus: string;
}

export function formatNumberWithCommas(val: number): string {
  return val.toLocaleString('en-US');
}

/**
 * Deterministic Ring All-Reduce Latency Solver:
 * T_allreduce = 2 * ((N - 1) / N) * (M / Bandwidth_NVLink) + alpha
 */
export function calculateRingAllReduceLatencyUs(
  numRanks: number,
  payloadBytes: number,
  bandwidthGbps: number,
  alphaUs: number
): number {
  if (numRanks <= 1) {
    return Number(alphaUs.toFixed(2));
  }
  const ringFactor = (2 * (numRanks - 1)) / numRanks;
  const bytesPerUs = (bandwidthGbps * 1e9) / 1e6;
  const transferUs = payloadBytes / bytesPerUs;
  const totalUs = ringFactor * transferUs + alphaUs;
  return Number(totalUs.toFixed(2));
}

export function createInitialRanks(
  tokensK: number,
  ringGbps: number,
  latencyMs: string,
  statusText: string,
  stepOffset: number
): RankNodeState[] {
  const list: RankNodeState[] = [];
  for (let i = 0; i < 8; i++) {
    const hexNum = (0x17000 + i * 0x10).toString(16).toUpperCase();
    const colW = Number((5.1 + ((i * 3 + stepOffset) % 7) * 0.01).toFixed(2));
    const rowW = Number((5.11 + ((i * 5 + stepOffset) % 6) * 0.01).toFixed(2));
    list.push({
      rankIndex: i,
      code: 'K' + String(i),
      title: 'Rank ' + String(i) + ' (K' + String(i) + ')',
      hexPtr: '0x' + hexNum,
      tokensK,
      ringGbps,
      latencyMs,
      syncPct: 100,
      statusText,
      tensorHealth: 'OK',
      columnSliceWeight: colW,
      rowSliceWeight: rowW,
    });
  }
  return list;
}

export function createInitialCockpitState(): CockpitEngineState {
  return {
    corridor: SyntheticCorridor.ALPHA,
    throughputGbps: 45600,
    throughputFormatted: '45,600 GB/s',
    saturationPct: 96,
    ringLatencyUs: '0.01 µs',
    activeRanks: 8,
    totalRanks: 8,
    processedTokens: 8448000,
    processedTokensFormatted: '8,448,000 UNITS',
    engineXpFormatted: '+75.0k ENGINE XP',
    tensorState: 'Parallel Active',
    basePtr: '0x16F8DC0',
    modeLabel: 'TENSOR_PARALLEL',
    collectiveVec: [5.11, 5.15, 5.12, 5.14],
    selectedRankIndex: 3,
    congestionSpikeActive: false,
    ringPassStep: 1,
    ranks: createInitialRanks(256, 100, '0.02ms', 'REDUCED · LOCKED', 1),
    radioComms: [
      '[00:01.04] 🟢 CREW CHIEF: Asynchronous tensor parallelism and all-reduce ring-topology engine initialized · 8 ranks linked',
      '[00:01.08] 🟢 TELEMETRY: Ring All-Reduce tensor slicing verified at 45,600 GB/s with zero communication stalls',
    ],
    apaOrderStatus: 'READY FOR SOVEREIGN APA TITLE TRANSFER · CLUSTER-006',
  };
}
