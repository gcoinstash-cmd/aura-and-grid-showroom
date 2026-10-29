/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GF-T3-251: Dynamic Capacity Factor & Zero-Token-Dropping Load Balancer Core
 * Zero-Trust GridSync Ingress & Deterministic Mathematical Engine
 */

import { z } from 'zod';

export const SYNTHETIC_CORRIDORS = [
  'CAPACITY-CORRIDOR-ALPHA (DYNAMIC-CAPACITY-FACTOR-BALANCER · 13800-GB/S)',
  'CAPACITY-CORRIDOR-BRAVO (ZERO-TOKEN-DROPPING-REDISPATCH)',
  'CAPACITY-CORRIDOR-GAMMA (AUXILIARY-IMBALANCE-LOSS-PENALTY)',
  'CAPACITY-CORRIDOR-DELTA (FALLBACK-FIXED-CAPACITY-ROUTER)',
] as const;

export type SyntheticCorridor = (typeof SYNTHETIC_CORRIDORS)[number];

export const EXPERT_POINTERS: readonly string[] = [
  '0xF000',
  '0xF100',
  '0xF200',
  '0xF300',
  '0xF400',
  '0xF500',
  '0xF600',
  '0xF700',
];

const DANGEROUS_PATTERN = /(--|;|\/\*|\*\/|<script|DROP\s+TABLE|UNION\s+SELECT|INSERT\s+INTO|DELETE\s+FROM)/i;

export const GridSyncCapacityInputSchema = z.object({
  totalTokens: z.number().int().min(64).max(1024000),
  numExperts: z.number().int().min(2).max(64),
  capacityFactor: z.number().min(1.0).max(4.0),
  corridor: z.enum(SYNTHETIC_CORRIDORS),
  expertDemandWeights: z
    .array(z.number().min(0.0).max(10.0).refine((n) => Number.isFinite(n), 'Weight must be finite'))
    .length(8),
  operatorNote: z
    .string()
    .max(120)
    .refine((val) => !DANGEROUS_PATTERN.test(val), 'GridSync Security Gate: Malicious payload rejected')
    .optional(),
});

export type GridSyncCapacityInput = z.infer<typeof GridSyncCapacityInputSchema>;

export interface ExpertRankTelemetry {
  expertId: number;
  title: string;
  shortTag: string;
  pointer: string;
  capacityFactor: number;
  limit: number;
  incomingDemand: number;
  routed: number;
  redispatched: number;
  dropped: number;
  auxiliaryLossContribution: number;
  utilizationPct: number;
  state: 'BALANCED' | 'REDISPATCHED' | 'SATURATED';
  locked: boolean;
}

export interface CapacityEngineSnapshot {
  engineId: string;
  corridor: SyntheticCorridor;
  pointer: string;
  mode: 'DYNAMIC_CAPACITY' | 'ZERO_DROP_REDISPATCH' | 'AUX_LOSS_PENALTY' | 'FIXED_FALLBACK';
  capacityFactor: number;
  tokenLimit: number;
  totalProcessedTokens: number;
  cumulativeTokensUnits: number;
  capacityXpUnits: number;
  droppedTokens: number;
  redispatchedTokens: number;
  auxiliaryImbalanceLoss: number;
  throughputGbs: number;
  routingLatencyUs: number;
  activeExperts: number;
  moeState: string;
  vectorPreview: [number, number, number, number];
  experts: ExpertRankTelemetry[];
}

/**
 * Calculates dynamic expert token limit:
 * Capacity = ceil(capacityFactor * (totalTokens / numExperts))
 */
export function calculateDynamicExpertLimit(
  totalTokens: number,
  numExperts: number,
  capacityFactor: number
): number {
  if (!Number.isFinite(totalTokens) || totalTokens < 0) {
    throw new Error('Invalid totalTokens: must be non-negative finite number');
  }
  if (!Number.isFinite(numExperts) || numExperts <= 0) {
    throw new Error('Invalid numExperts: must be strictly positive finite number');
  }
  if (!Number.isFinite(capacityFactor) || capacityFactor < 1.0) {
    throw new Error('Invalid capacityFactor: must be >= 1.0');
  }
  const quota = capacityFactor * (totalTokens / numExperts);
  return Math.ceil(quota);
}

/**
 * Computes sub-microsecond auxiliary load-balancing loss across all E expert ranks:
 * L_aux = E * sum_{i=0}^{E-1} (f_i * P_i)
 */
export function computeAuxiliaryLossPenalty(
  demands: readonly number[],
  routed: readonly number[],
  numExperts: number
): number {
  const sumDemand = demands.reduce((acc, v) => acc + v, 0);
  const sumRouted = routed.reduce((acc, v) => acc + v, 0);
  if (sumDemand <= 0 || sumRouted <= 0 || numExperts <= 0) {
    return 0;
  }
  let dotProduct = 0;
  for (let i = 0; i < numExperts; i++) {
    const p_i = demands[i] / sumDemand;
    const f_i = routed[i] / sumRouted;
    dotProduct += f_i * p_i;
  }
  return Number((numExperts * dotProduct).toFixed(6));
}

/**
 * Validates and sanitizes incoming payload via GridSync zero-trust schema,
 * then executes the deterministic capacity factor and zero-token-dropping pass.
 */
export function runCapacityBalancerPass(
  rawInput: unknown,
  previousCumulativeTokens = 3200000,
  previousXpUnits = 52000
): CapacityEngineSnapshot {
  const parsed = GridSyncCapacityInputSchema.parse(rawInput);
  const numExperts = parsed.numExperts;
  let effectiveFactor = parsed.capacityFactor;
  let tokenLimit = calculateDynamicExpertLimit(
    parsed.totalTokens,
    numExperts,
    effectiveFactor
  );

  const uniformTokensPerExpert = parsed.totalTokens / numExperts;
  const demands: number[] = parsed.expertDemandWeights.map((w) =>
    Math.round(uniformTokensPerExpert * w)
  );

  const routed: number[] = new Array(numExperts).fill(0);
  const redispatched: number[] = new Array(numExperts).fill(0);
  const dropped: number[] = new Array(numExperts).fill(0);

  let overflowPool = 0;

  // Stage 1: Primary Expert Capacity Allocation
  for (let i = 0; i < numExperts; i++) {
    if (demands[i] <= tokenLimit) {
      routed[i] = demands[i];
    } else {
      routed[i] = tokenLimit;
      overflowPool += demands[i] - tokenLimit;
    }
  }

  // Stage 2: Zero-Token-Dropping Secondary Redispatch
  if (overflowPool > 0) {
    for (let i = 0; i < numExperts; i++) {
      if (overflowPool === 0) break;
      const availableSlack = tokenLimit - routed[i];
      if (availableSlack > 0) {
        const transfer = Math.min(availableSlack, overflowPool);
        routed[i] += transfer;
        redispatched[i] += transfer;
        overflowPool -= transfer;
      }
    }

    // Stage 3: Dynamic Capacity Expansion / Residual Bypass if all ranks saturated
    if (overflowPool > 0) {
      const perExpertResidual = Math.floor(overflowPool / numExperts);
      const remainder = overflowPool % numExperts;
      for (let i = 0; i < numExperts; i++) {
        const extra = perExpertResidual + (i < remainder ? 1 : 0);
        routed[i] += extra;
        redispatched[i] += extra;
      }
      const maxRouted = Math.max(...routed);
      if (maxRouted > tokenLimit) {
        tokenLimit = maxRouted;
        effectiveFactor = Number((tokenLimit / uniformTokensPerExpert).toFixed(2));
      }
      overflowPool = 0;
    }
  }

  const auxLoss = computeAuxiliaryLossPenalty(demands, routed, numExperts);
  const totalRouted = routed.reduce((acc, v) => acc + v, 0);
  const totalRedispatched = redispatched.reduce((acc, v) => acc + v, 0);
  const totalDropped = dropped.reduce((acc, v) => acc + v, 0);

  const avgRouted = Math.max(1, totalRouted / numExperts);

  const experts: ExpertRankTelemetry[] = [];
  for (let i = 0; i < numExperts; i++) {
    const util = Number(((routed[i] / tokenLimit) * 100).toFixed(1));
    const lossContrib = Number(((auxLoss / numExperts) * (routed[i] / avgRouted)).toFixed(4));
    let rankState: 'BALANCED' | 'REDISPATCHED' | 'SATURATED' = 'BALANCED';
    if (redispatched[i] > 0) {
      rankState = 'REDISPATCHED';
    } else if (util >= 99.5) {
      rankState = 'SATURATED';
    }

    experts.push({
      expertId: i,
      title: 'Expert ' + String(i) + ' (E' + String(i) + ')',
      shortTag: 'E' + String(i),
      pointer: EXPERT_POINTERS[i] || '0xF000',
      capacityFactor: Number(effectiveFactor.toFixed(2)),
      limit: tokenLimit,
      incomingDemand: demands[i],
      routed: routed[i],
      redispatched: redispatched[i],
      dropped: dropped[i],
      auxiliaryLossContribution: lossContrib,
      utilizationPct: util,
      state: rankState,
      locked: true,
    });
  }

  let baseThroughput = 13800;
  let modeLabel: CapacityEngineSnapshot['mode'] = 'DYNAMIC_CAPACITY';
  if (parsed.corridor === 'CAPACITY-CORRIDOR-BRAVO (ZERO-TOKEN-DROPPING-REDISPATCH)') {
    baseThroughput = 14120;
    modeLabel = 'ZERO_DROP_REDISPATCH';
  } else if (parsed.corridor === 'CAPACITY-CORRIDOR-GAMMA (AUXILIARY-IMBALANCE-LOSS-PENALTY)') {
    baseThroughput = 13640;
    modeLabel = 'AUX_LOSS_PENALTY';
  } else if (parsed.corridor === 'CAPACITY-CORRIDOR-DELTA (FALLBACK-FIXED-CAPACITY-ROUTER)') {
    baseThroughput = 12950;
    modeLabel = 'FIXED_FALLBACK';
  }

  const imbalanceDrag = Math.max(0, auxLoss - 1.0) * 160;
  const throughputGbs = Math.round(baseThroughput - imbalanceDrag);
  const routingLatencyUs = totalRedispatched > 0 ? 0.01 : 0.01;

  const vectorPreview: [number, number, number, number] = [
    Number((effectiveFactor + 0.06).toFixed(2)),
    Number((effectiveFactor + 0.10).toFixed(2)),
    Number((effectiveFactor + 0.07).toFixed(2)),
    Number((effectiveFactor + 0.08).toFixed(2)),
  ];

  const moeState =
    totalRedispatched === 0 ? 'Capacity Balanced' : 'Zero-Drop Redispatch Active';

  return {
    engineId: 'GF-T3-251',
    corridor: parsed.corridor,
    pointer: '0xEF8DC0',
    mode: modeLabel,
    capacityFactor: Number(effectiveFactor.toFixed(2)),
    tokenLimit,
    totalProcessedTokens: totalRouted,
    cumulativeTokensUnits: previousCumulativeTokens,
    capacityXpUnits: previousXpUnits,
    droppedTokens: totalDropped,
    redispatchedTokens: totalRedispatched,
    auxiliaryImbalanceLoss: auxLoss,
    throughputGbs,
    routingLatencyUs,
    activeExperts: numExperts,
    moeState,
    vectorPreview,
    experts,
  };
}

export const INITIAL_BASELINE_WEIGHTS: number[] = [
  1.2, 1.2, 1.2, 1.21875, 1.2, 1.2, 1.2, 1.2,
];

export function createInitialSnapshot(): CapacityEngineSnapshot {
  return runCapacityBalancerPass(
    {
      totalTokens: 2560,
      numExperts: 8,
      capacityFactor: 1.25,
      corridor: 'CAPACITY-CORRIDOR-ALPHA (DYNAMIC-CAPACITY-FACTOR-BALANCER · 13800-GB/S)',
      expertDemandWeights: INITIAL_BASELINE_WEIGHTS,
      operatorNote: 'Baseline initialization pass',
    },
    3200000,
    52000
  );
}
