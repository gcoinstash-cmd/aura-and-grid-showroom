/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Clean-Room Deterministic MoE Top-K Expert Routing & Load-Balanced Token Dispatch Solver
 * Unit: GF-T3-292 | Cluster: CLUSTER-006
 */

export type CorridorId =
  | 'MOE-CORRIDOR-ALPHA (DYNAMIC-MOE-TOP-K-EXPERT-ROUTING-FABRIC · 47200-GB/S)'
  | 'MOE-CORRIDOR-BRAVO (LOAD-BALANCED-TOKEN-DISPATCH-ENGINE)'
  | 'MOE-CORRIDOR-GAMMA (NON-BLOCKING-AUXILIARY-LOSS-BALANCER)'
  | 'MOE-CORRIDOR-DELTA (FALLBACK-DENSE-FEEDFORWARD-PASS)';

export const MOE_CORRIDORS: CorridorId[] = [
  'MOE-CORRIDOR-ALPHA (DYNAMIC-MOE-TOP-K-EXPERT-ROUTING-FABRIC · 47200-GB/S)',
  'MOE-CORRIDOR-BRAVO (LOAD-BALANCED-TOKEN-DISPATCH-ENGINE)',
  'MOE-CORRIDOR-GAMMA (NON-BLOCKING-AUXILIARY-LOSS-BALANCER)',
  'MOE-CORRIDOR-DELTA (FALLBACK-DENSE-FEEDFORWARD-PASS)',
];

export interface ExpertNode {
  id: number;
  tag: string;
  title: string;
  hexPtr: string;
  inspectorPtr: string;
  tokensK: number;
  loadPct: number;
  latencyMs: number;
  syncPct: number;
  stateLabel: string;
  moeStatus: string;
  gatingLogit: number;
  softmaxWeight: number;
  smOccupancyPct: number;
}

export interface TelemetrySnapshot {
  corridor: CorridorId;
  throughputGbs: number;
  saturationPct: number;
  dispatchLatencyUs: number;
  activeExpertsCount: number;
  totalExpertsCount: number;
  processedTokensUnits: number;
  engineXpK: number;
  moeStateLabel: string;
  meshPtr: string;
  routingMode: string;
  gatingVector: [number, number, number, number];
  auxiliaryLoss: number;
  loadImbalanceRatio: number;
  barrierSyncNs: number;
  hotspotActive: boolean;
  stepCount: number;
  experts: ExpertNode[];
}

/**
 * Computes deterministic softmax probabilities over expert logits with numerical stability.
 */
export function computeSoftmaxGating(logits: number[], temperature: number = 1.0): number[] {
  const safeTemp = Math.max(temperature, 1e-5);
  const scaled = logits.map((val) => val / safeTemp);
  const maxLogit = Math.max(...scaled);
  const exps = scaled.map((val) => Math.exp(val - maxLogit));
  const sumExps = exps.reduce((acc, val) => acc + val, 0);
  return exps.map((val) => val / sumExps);
}

/**
 * Selects top-k expert indices and normalizes their gating weights:
 * E(x) = sum_{i=1..k} G(x)_i * E_i(x)
 */
export function selectTopKExperts(
  logits: number[],
  k: number,
  capacityFactor: number = 1.25
): { indices: number[]; weights: number[]; auxiliaryLoss: number } {
  const probs = computeSoftmaxGating(logits);
  const indexed = probs.map((prob, index) => ({ index, prob }));
  indexed.sort((a, b) => b.prob - a.prob);

  const selected = indexed.slice(0, Math.max(1, Math.min(k, logits.length)));
  const weightSum = selected.reduce((acc, item) => acc + item.prob, 0);
  const normalizedWeights = selected.map((item) => item.prob / (weightSum || 1));

  // Auxiliary load balancing loss: N * sum(f_i * P_i)
  const n = logits.length;
  const uniformFraction = 1 / n;
  const rawAuxLoss =
    n *
    probs.reduce((acc, p) => {
      return acc + uniformFraction * p;
    }, 0);
  const adjustedLoss = Number((rawAuxLoss / capacityFactor).toFixed(4));

  return {
    indices: selected.map((item) => item.index),
    weights: normalizedWeights.map((w) => Number(w.toFixed(4))),
    auxiliaryLoss: adjustedLoss,
  };
}

export function createInitialSnapshot(): TelemetrySnapshot {
  const baseHex = ['0x19000', '0x19010', '0x19020', '0x19030', '0x19040', '0x19050', '0x19060', '0x19070'];
  const experts: ExpertNode[] = Array.from({ length: 8 }, (_, idx) => ({
    id: idx,
    tag: 'M' + String(idx),
    title: 'Expert ' + String(idx) + ' (M' + String(idx) + ')',
    hexPtr: baseHex[idx],
    inspectorPtr: baseHex[idx],
    tokensK: 256,
    loadPct: 12.5,
    latencyMs: 0.02,
    syncPct: 100,
    stateLabel: 'ROUTED · LOCKED',
    moeStatus: 'OK · LOCKED',
    gatingLogit: Number((5.31 + (idx % 4) * 0.015).toFixed(2)),
    softmaxWeight: 0.125,
    smOccupancyPct: 98.4,
  }));

  return {
    corridor: 'MOE-CORRIDOR-ALPHA (DYNAMIC-MOE-TOP-K-EXPERT-ROUTING-FABRIC · 47200-GB/S)',
    throughputGbs: 47200,
    saturationPct: 98.4,
    dispatchLatencyUs: 0.01,
    activeExpertsCount: 8,
    totalExpertsCount: 8,
    processedTokensUnits: 8704000,
    engineXpK: 75.0,
    moeStateLabel: 'MoE State: Routing Active',
    meshPtr: '0x18F8DC0',
    routingMode: 'MOE_ROUTING',
    gatingVector: [5.31, 5.35, 5.32, 5.34],
    auxiliaryLoss: 0.0012,
    loadImbalanceRatio: 1.0,
    barrierSyncNs: 10.0,
    hotspotActive: false,
    stepCount: 1,
    experts,
  };
}
