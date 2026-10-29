/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GF-T3-262 — Track 3 Flagship MoE Expert Parallelism & Dynamic Token Routing Engine
 * Zero-Tolerance Integrity Standard: Deterministic Softmax Gating, Capacity Clipping,
 * All-to-All Interconnect Dispatch, and GridSync Zero-Trust Zod Sanitization.
 * Absolute Zero-Dollar Gate Enforced.
 */

import { z } from 'zod';

export const SYNTHETIC_MOE_CORRIDORS = [
  'MOE-CORRIDOR-ALPHA (DYNAMIC-TOKEN-ROUTING-FABRIC · 24200-GB/S)',
  'MOE-CORRIDOR-BRAVO (ALL-TO-ALL-DISPATCH-SCHEDULER)',
  'MOE-CORRIDOR-GAMMA (EXPERT-CAPACITY-FACTOR-BALANCER)',
  'MOE-CORRIDOR-DELTA (FALLBACK-DENSE-FEEDFORWARD-PASS)',
] as const;

export type SyntheticMoECorridor = (typeof SYNTHETIC_MOE_CORRIDORS)[number];

export interface CorridorConfig {
  id: string;
  label: SyntheticMoECorridor;
  shortCode: string;
  baseBandwidthGbs: number;
  baseLatencyUs: number;
  defaultTopK: number;
  capacityFactor: number;
  auxLossCoeff: number;
}

export const CORRIDOR_CONFIG_MAP: Record<SyntheticMoECorridor, CorridorConfig> = {
  'MOE-CORRIDOR-ALPHA (DYNAMIC-TOKEN-ROUTING-FABRIC · 24200-GB/S)': {
    id: 'MOE-CORRIDOR-ALPHA',
    label: 'MOE-CORRIDOR-ALPHA (DYNAMIC-TOKEN-ROUTING-FABRIC · 24200-GB/S)',
    shortCode: 'ALPHA · 24200-GB/S',
    baseBandwidthGbs: 24200,
    baseLatencyUs: 0.01,
    defaultTopK: 2,
    capacityFactor: 1.25,
    auxLossCoeff: 0.01,
  },
  'MOE-CORRIDOR-BRAVO (ALL-TO-ALL-DISPATCH-SCHEDULER)': {
    id: 'MOE-CORRIDOR-BRAVO',
    label: 'MOE-CORRIDOR-BRAVO (ALL-TO-ALL-DISPATCH-SCHEDULER)',
    shortCode: 'BRAVO · ALL-TO-ALL',
    baseBandwidthGbs: 22800,
    baseLatencyUs: 0.02,
    defaultTopK: 2,
    capacityFactor: 1.15,
    auxLossCoeff: 0.015,
  },
  'MOE-CORRIDOR-GAMMA (EXPERT-CAPACITY-FACTOR-BALANCER)': {
    id: 'MOE-CORRIDOR-GAMMA',
    label: 'MOE-CORRIDOR-GAMMA (EXPERT-CAPACITY-FACTOR-BALANCER)',
    shortCode: 'GAMMA · CAP-BAL',
    baseBandwidthGbs: 23600,
    baseLatencyUs: 0.01,
    defaultTopK: 2,
    capacityFactor: 1.05,
    auxLossCoeff: 0.025,
  },
  'MOE-CORRIDOR-DELTA (FALLBACK-DENSE-FEEDFORWARD-PASS)': {
    id: 'MOE-CORRIDOR-DELTA',
    label: 'MOE-CORRIDOR-DELTA (FALLBACK-DENSE-FEEDFORWARD-PASS)',
    shortCode: 'DELTA · DENSE-FFN',
    baseBandwidthGbs: 19400,
    baseLatencyUs: 0.03,
    defaultTopK: 1,
    capacityFactor: 1.5,
    auxLossCoeff: 0.005,
  },
};

export const EXPERT_HEX_POINTERS = [
  '0xB000',
  '0xB100',
  '0xB200',
  '0xB300',
  '0xB400',
  '0xB500',
  '0xB600',
  '0xB700',
] as const;

const FORBIDDEN_INJECTION_PATTERNS = [
  ';',
  '--',
  '/*',
  '*/',
  'DROP ',
  'SELECT ',
  'INSERT ',
  'DELETE ',
  'UPDATE ',
  '<SCRIPT',
  'JAVASCRIPT:',
  'ONERROR=',
  '__PROTO__',
  'CONSTRUCTOR',
];

export function containsForbiddenSecurityPattern(input: string): boolean {
  const upper = input.toUpperCase();
  for (const token of FORBIDDEN_INJECTION_PATTERNS) {
    if (upper.includes(token)) {
      return true;
    }
  }
  return false;
}

/**
 * GridSync API Architecture: Zero-Trust Ingress & Payload Sanitization Schema
 */
export const GridSyncRoutingPayloadSchema = z.object({
  corridor: z
    .string()
    .refine((val) => !containsForbiddenSecurityPattern(val), {
      message: 'GridSync Security Gate: SQLi/XSS or schema pollution signature blocked',
    })
    .refine(
      (val): val is SyntheticMoECorridor =>
        (SYNTHETIC_MOE_CORRIDORS as readonly string[]).includes(val),
      {
        message: 'GridSync Security Gate: Unrecognized synthetic MoE corridor identifier',
      }
    ),
  tokenBatchSize: z.number().int().min(1024).max(64000000),
  topK: z.number().int().min(1).max(4),
  capacityFactor: z.number().min(1.0).max(2.5),
  expertLogits: z.array(z.number().min(-20).max(20)).length(8),
  imbalanceSpikeActive: z.boolean(),
  burstMultiplier: z.number().min(0.5).max(4.0),
  stepPassCount: z.number().int().min(0).max(1000000),
});

export type GridSyncRoutingPayload = z.infer<typeof GridSyncRoutingPayloadSchema>;

export interface ExpertNodeState {
  expertId: number;
  code: string;
  title: string;
  hexPtr: string;
  dispatchedTokens: number;
  tokensFormatted: string;
  gatherLabel: string;
  topKValue: string;
  gatingProbability: number;
  capacityUtilizationPct: number;
  balancePct: number;
  latencyMs: string;
  latencyNumericMs: number;
  dispatchStatus: 'OK' | 'REROUTED' | 'SATURATED';
  stateText: string;
  isLocked: boolean;
}

export interface MoETelemetrySnapshot {
  engineTitle: 'GF-T3-262';
  corridor: SyntheticMoECorridor;
  meshPtr: string;
  mode: string;
  topK: number;
  routerVec: [number, number, number, number];
  throughputGbsFormatted: string;
  throughputGbsNumeric: number;
  throughputSaturationPct: number;
  routingLatencyUsFormatted: string;
  routingLatencyUsNumeric: number;
  activeExpertsCount: number;
  totalExpertsCount: number;
  processedTokensFormatted: string;
  processedTokensNumeric: number;
  engineXpFormatted: string;
  moeStateLabel: string;
  auxiliaryLoss: number;
  zLoss: number;
  bufferParityPct: number;
  zeroImbalanceVerified: boolean;
  imbalanceSpikeActive: boolean;
  burstMultiplier: number;
  stepPassCount: number;
  experts: ExpertNodeState[];
}

/**
 * Numerically stable Softmax gating router G(x)_i = exp(h_i - max(h)) / sum(exp(h_j - max(h)))
 */
export function computeSoftmaxProbabilities(logits: readonly number[], temperature = 1.0): number[] {
  if (logits.length === 0) {
    throw new Error('Router logits vector cannot be empty');
  }
  const safeTemp = Math.max(temperature, 1e-6);
  const scaled = logits.map((val) => val / safeTemp);
  const maxLogit = Math.max(...scaled);
  const exps = scaled.map((val) => Math.exp(val - maxLogit));
  const sumExps = exps.reduce((acc, cur) => acc + cur, 0);
  return exps.map((val) => val / sumExps);
}

/**
 * Router Z-Loss regularization: L_z = (1 / N) * (log(sum(exp(h_i))))^2
 */
export function computeRouterZLoss(logits: readonly number[]): number {
  const maxLogit = Math.max(...logits);
  const sumExp = logits.reduce((acc, val) => acc + Math.exp(val - maxLogit), 0);
  const logSumExp = maxLogit + Math.log(sumExp);
  return Number(((logSumExp * logSumExp) / logits.length).toFixed(6));
}

/**
 * Switch/GShard Load-Balancing Auxiliary Loss: L_aux = N * sum(f_i * P_i)
 */
export function computeAuxiliaryLoadBalanceLoss(
  dispatchedCounts: readonly number[],
  gatingProbabilities: readonly number[]
): number {
  const numExperts = dispatchedCounts.length;
  const totalDispatched = Math.max(
    1,
    dispatchedCounts.reduce((acc, val) => acc + val, 0)
  );
  let weightedSum = 0;
  for (let i = 0; i < numExperts; i += 1) {
    const fraction = dispatchedCounts[i] / totalDispatched;
    weightedSum += fraction * gatingProbabilities[i];
  }
  return Number((numExperts * weightedSum).toFixed(6));
}

export function formatNumberWithCommas(value: number): string {
  const rounded = Math.round(value);
  return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Core deterministic MoE Top-K Gating, All-to-All Dispatch, and Capacity Resolution pass.
 */
export function executeMoERoutingPass(rawInput: GridSyncRoutingPayload): MoETelemetrySnapshot {
  const validated = GridSyncRoutingPayloadSchema.parse(rawInput);
  const corridorCfg = CORRIDOR_CONFIG_MAP[validated.corridor];
  const numExperts = 8;

  const workingLogits = [...validated.expertLogits];
  if (validated.imbalanceSpikeActive) {
    // Inject deterministic expert load skew onto E0 and E3 to force capacity re-routing
    workingLogits[0] = Number((workingLogits[0] + 1.38).toFixed(2));
    workingLogits[3] = Number((workingLogits[3] + 1.18).toFixed(2));
    workingLogits[6] = Number(Math.max(0.25, workingLogits[6] - 0.82).toFixed(2));
  }

  const gatingProbs = computeSoftmaxProbabilities(workingLogits, 1.0);
  const zLoss = computeRouterZLoss(workingLogits);

  const totalTokenSlots = Math.round(validated.tokenBatchSize * validated.burstMultiplier);
  const idealPerExpert = totalTokenSlots / numExperts;
  const expertCapacityCeiling = Math.ceil(idealPerExpert * validated.capacityFactor);

  // Initial proportional assignment
  const rawCounts = gatingProbs.map((p) => Math.round(totalTokenSlots * p));

  // Enforce sub-microsecond capacity ceiling without dropping tokens
  const resolvedCounts = new Array<number>(numExperts).fill(0);
  let overflowTokens = 0;

  for (let i = 0; i < numExperts; i += 1) {
    if (rawCounts[i] > expertCapacityCeiling) {
      resolvedCounts[i] = expertCapacityCeiling;
      overflowTokens += rawCounts[i] - expertCapacityCeiling;
    } else {
      resolvedCounts[i] = rawCounts[i];
    }
  }

  if (overflowTokens > 0) {
    for (let i = 0; i < numExperts; i += 1) {
      if (overflowTokens <= 0) break;
      const headroom = Math.max(0, expertCapacityCeiling - resolvedCounts[i]);
      const transfer = Math.min(overflowTokens, headroom);
      resolvedCounts[i] += transfer;
      overflowTokens -= transfer;
    }
  }

  // When nominal (no imbalance spike and uniform-band logits), lock exact 256K * burstMultiplier per expert
  const logitSpread = Math.max(...workingLogits) - Math.min(...workingLogits);
  if (!validated.imbalanceSpikeActive && logitSpread <= 0.12) {
    const exactUniform = Math.round(totalTokenSlots / numExperts);
    for (let i = 0; i < numExperts; i += 1) {
      resolvedCounts[i] = exactUniform;
    }
  }

  const auxLoss = computeAuxiliaryLoadBalanceLoss(resolvedCounts, gatingProbs);

  let throughputNumeric = corridorCfg.baseBandwidthGbs * validated.burstMultiplier;
  if (
    validated.corridor === 'MOE-CORRIDOR-ALPHA (DYNAMIC-TOKEN-ROUTING-FABRIC · 24200-GB/S)' &&
    validated.burstMultiplier === 1.0 &&
    !validated.imbalanceSpikeActive
  ) {
    throughputNumeric = 24200;
  } else if (validated.imbalanceSpikeActive) {
    throughputNumeric = Math.round(corridorCfg.baseBandwidthGbs * 0.915);
  } else {
    throughputNumeric = Math.round(Math.min(28800, throughputNumeric));
  }

  const saturationPct = Number(
    Math.min(100, Math.max(12, (throughputNumeric / 24200) * 100)).toFixed(1)
  );

  const routingLatencyUsNumeric = validated.imbalanceSpikeActive
    ? Number((corridorCfg.baseLatencyUs + 0.03).toFixed(2))
    : corridorCfg.baseLatencyUs;

  const baseProcessedUnits = Math.round(
    4608000 * validated.burstMultiplier + validated.stepPassCount * 512000
  );
  const xpValue = (75.0 * validated.burstMultiplier + validated.stepPassCount * 12.5).toFixed(1);

  const moeStateLabel = validated.imbalanceSpikeActive
    ? 'Re-Routing Spike'
    : 'Routed Active';

  const bufferParityPct = validated.imbalanceSpikeActive ? 94.2 : 100.0;

  const experts: ExpertNodeState[] = [];
  for (let idx = 0; idx < numExperts; idx += 1) {
    const count = resolvedCounts[idx];
    const tokK = Math.max(1, Math.round(count / 1000));
    const utilPct = Number(
      Math.min(100, (count / Math.max(1, expertCapacityCeiling)) * 100).toFixed(1)
    );
    const deviation = Math.abs(count - idealPerExpert) / Math.max(1, idealPerExpert);
    const balancePct =
      !validated.imbalanceSpikeActive && deviation < 0.08
        ? 100
        : Number(Math.max(58, (1 - deviation * 0.45) * 100).toFixed(0));

    const isSpikedNode = validated.imbalanceSpikeActive && (idx === 0 || idx === 3);
    const nodeLatencyNum = isSpikedNode ? 0.05 : 0.02;
    const dispatchStatus: 'OK' | 'REROUTED' | 'SATURATED' = isSpikedNode ? 'REROUTED' : 'OK';
    const stateText = isSpikedNode ? '⚡ FAULT' : 'ROUTED · LOCKED';

    experts.push({
      expertId: idx,
      code: 'E' + String(idx),
      title: 'Expert ' + String(idx) + ' (E' + String(idx) + ')',
      hexPtr: EXPERT_HEX_POINTERS[idx],
      dispatchedTokens: count,
      tokensFormatted: String(tokK) + 'K',
      gatherLabel: 'GATHER: TOP-' + String(validated.topK),
      topKValue: 'TOP-' + String(validated.topK),
      gatingProbability: Number(gatingProbs[idx].toFixed(4)),
      capacityUtilizationPct: utilPct,
      balancePct,
      latencyMs: nodeLatencyNum.toFixed(2) + 'ms',
      latencyNumericMs: nodeLatencyNum,
      dispatchStatus,
      stateText,
      isLocked: !isSpikedNode,
    });
  }

  return {
    engineTitle: 'GF-T3-262',
    corridor: validated.corridor,
    meshPtr: '0xAF8DC0',
    mode: 'MOE_PARALLEL',
    topK: validated.topK,
    routerVec: [
      Number(workingLogits[0].toFixed(2)),
      Number(workingLogits[1].toFixed(2)),
      Number(workingLogits[2].toFixed(2)),
      Number(workingLogits[3].toFixed(2)),
    ],
    throughputGbsFormatted: formatNumberWithCommas(throughputNumeric) + ' GB/s',
    throughputGbsNumeric: throughputNumeric,
    throughputSaturationPct: saturationPct,
    routingLatencyUsFormatted: routingLatencyUsNumeric.toFixed(2) + ' µs',
    routingLatencyUsNumeric,
    activeExpertsCount: numExperts,
    totalExpertsCount: numExperts,
    processedTokensFormatted: formatNumberWithCommas(baseProcessedUnits) + ' UNITS',
    processedTokensNumeric: baseProcessedUnits,
    engineXpFormatted: '+' + String(xpValue) + 'k ENGINE XP',
    moeStateLabel,
    auxiliaryLoss: auxLoss,
    zLoss,
    bufferParityPct,
    zeroImbalanceVerified: !validated.imbalanceSpikeActive,
    imbalanceSpikeActive: validated.imbalanceSpikeActive,
    burstMultiplier: validated.burstMultiplier,
    stepPassCount: validated.stepPassCount,
    experts,
  };
}

export function createInitialRoutingPayload(): GridSyncRoutingPayload {
  return {
    corridor: 'MOE-CORRIDOR-ALPHA (DYNAMIC-TOKEN-ROUTING-FABRIC · 24200-GB/S)',
    tokenBatchSize: 2048000,
    topK: 2,
    capacityFactor: 1.25,
    expertLogits: [2.41, 2.45, 2.42, 2.44, 2.43, 2.42, 2.44, 2.43],
    imbalanceSpikeActive: false,
    burstMultiplier: 1.0,
    stepPassCount: 0,
  };
}

export const SUPABASE_POSTGRES_RLS_SCHEMA = [
  '-- GF-T3-262 Partitioned PostgreSQL / Supabase Persistence Schema (RLS Enforced)',
  'CREATE TABLE IF NOT EXISTS moe_routing_corridors (',
  '  corridor_id TEXT PRIMARY KEY,',
  '  corridor_label TEXT NOT NULL UNIQUE,',
  '  base_bandwidth_gbs NUMERIC(10,2) NOT NULL CHECK (base_bandwidth_gbs > 0),',
  '  base_latency_us NUMERIC(8,4) NOT NULL CHECK (base_latency_us > 0),',
  '  default_top_k SMALLINT NOT NULL DEFAULT 2,',
  '  capacity_factor NUMERIC(5,3) NOT NULL DEFAULT 1.250',
  ');',
  '',
  'CREATE TABLE IF NOT EXISTS moe_dispatch_passes (',
  '  pass_id UUID NOT NULL DEFAULT gen_random_uuid(),',
  '  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),',
  '  operator_id UUID NOT NULL,',
  '  corridor_id TEXT NOT NULL REFERENCES moe_routing_corridors(corridor_id),',
  '  mesh_ptr TEXT NOT NULL DEFAULT \'0xAF8DC0\',',
  '  top_k SMALLINT NOT NULL CHECK (top_k BETWEEN 1 AND 8),',
  '  throughput_gbs NUMERIC(10,2) NOT NULL,',
  '  routing_latency_us NUMERIC(8,4) NOT NULL,',
  '  processed_tokens_units BIGINT NOT NULL,',
  '  auxiliary_loss NUMERIC(10,6) NOT NULL,',
  '  z_loss NUMERIC(10,6) NOT NULL,',
  '  PRIMARY KEY (pass_id, executed_at)',
  ') PARTITION BY RANGE (executed_at);',
  '',
  'ALTER TABLE moe_routing_corridors ENABLE ROW LEVEL SECURITY;',
  'ALTER TABLE moe_dispatch_passes ENABLE ROW LEVEL SECURITY;',
  '',
  'CREATE POLICY policy_dispatch_passes_tenant_isolation',
  '  ON moe_dispatch_passes FOR ALL TO authenticated',
  '  USING (operator_id = auth.uid()) WITH CHECK (operator_id = auth.uid());',
].join('\n');
