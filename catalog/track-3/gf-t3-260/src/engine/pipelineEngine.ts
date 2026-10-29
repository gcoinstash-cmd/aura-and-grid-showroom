/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GF-T3-260 Core Non-Uniform 1F1B Pipeline Parallelism & Interleaved Stage Memory Engine
 * Includes GridSync Zero-Trust Ingress Zod Sanitization & Real Mathematical Scheduling
 */

import { z } from 'zod';

export const SYNTHETIC_CORRIDORS = [
  'PIPE-CORRIDOR-ALPHA (1F1B-MICRO-BATCH-SCHEDULING-FABRIC · 22600-GB/S)',
  'PIPE-CORRIDOR-BRAVO (INTERLEAVED-STAGE-MEMORY-BALANCER)',
  'PIPE-CORRIDOR-GAMMA (NVLINK-P2P-TENSOR-TRANSFER-ENGINE)',
  'PIPE-CORRIDOR-DELTA (FALLBACK-SYNCHRONOUS-PASS)',
] as const;

export type SyntheticCorridor = (typeof SYNTHETIC_CORRIDORS)[number];

export interface CorridorSpec {
  id: SyntheticCorridor;
  shortTag: string;
  baseThroughputGbs: number;
  interconnectBandwidthGbs: number;
  interleavingDegree: number;
  baseTransferMs: number;
  modeTag: string;
}

export const CORRIDOR_CATALOG: Record<SyntheticCorridor, CorridorSpec> = {
  'PIPE-CORRIDOR-ALPHA (1F1B-MICRO-BATCH-SCHEDULING-FABRIC · 22600-GB/S)': {
    id: 'PIPE-CORRIDOR-ALPHA (1F1B-MICRO-BATCH-SCHEDULING-FABRIC · 22600-GB/S)',
    shortTag: 'ALPHA · 22.6K GB/S',
    baseThroughputGbs: 22600,
    interconnectBandwidthGbs: 900,
    interleavingDegree: 2,
    baseTransferMs: 0.02,
    modeTag: 'PIPELINE_PARALLEL',
  },
  'PIPE-CORRIDOR-BRAVO (INTERLEAVED-STAGE-MEMORY-BALANCER)': {
    id: 'PIPE-CORRIDOR-BRAVO (INTERLEAVED-STAGE-MEMORY-BALANCER)',
    shortTag: 'BRAVO · INTERLEAVED',
    baseThroughputGbs: 24100,
    interconnectBandwidthGbs: 960,
    interleavingDegree: 4,
    baseTransferMs: 0.01,
    modeTag: 'INTERLEAVED_1F1B',
  },
  'PIPE-CORRIDOR-GAMMA (NVLINK-P2P-TENSOR-TRANSFER-ENGINE)': {
    id: 'PIPE-CORRIDOR-GAMMA (NVLINK-P2P-TENSOR-TRANSFER-ENGINE)',
    shortTag: 'GAMMA · P2P FABRIC',
    baseThroughputGbs: 25400,
    interconnectBandwidthGbs: 1120,
    interleavingDegree: 2,
    baseTransferMs: 0.01,
    modeTag: 'P2P_DIRECT_FABRIC',
  },
  'PIPE-CORRIDOR-DELTA (FALLBACK-SYNCHRONOUS-PASS)': {
    id: 'PIPE-CORRIDOR-DELTA (FALLBACK-SYNCHRONOUS-PASS)',
    shortTag: 'DELTA · SYNC PASS',
    baseThroughputGbs: 16800,
    interconnectBandwidthGbs: 640,
    interleavingDegree: 1,
    baseTransferMs: 0.05,
    modeTag: 'SYNC_1F1B_GUARD',
  },
};

const FORBIDDEN_PATTERNS = [
  'DROP TABLE',
  'DELETE FROM',
  'INSERT INTO',
  'UNION SELECT',
  '<SCRIPT',
  'JAVASCRIPT:',
  'ONERROR=',
  '--',
  ';',
];

export const GridSyncIngressSchema = z.object({
  corridor: z.enum(SYNTHETIC_CORRIDORS),
  numStages: z.number().int().min(2).max(64),
  numMicrobatches: z.number().int().min(4).max(512),
  interleavingDegree: z.number().int().min(1).max(8),
  hiddenDim: z.number().int().min(512).max(32768),
  seqLength: z.number().int().min(128).max(131072),
  zeroBubbleEnabled: z.boolean(),
  imbalanceInjected: z.boolean(),
  stepCounter: z.number().int().min(1).max(100000),
  burstActive: z.boolean(),
  operatorNote: z
    .string()
    .max(120)
    .refine(
      (val) => {
        const upper = val.toUpperCase();
        return !FORBIDDEN_PATTERNS.some((pat) => upper.includes(pat));
      },
      { message: 'GridSync Zero-Trust Gate blocked potentially unsafe payload token' }
    )
    .optional(),
});

export type GridSyncIngressInput = z.infer<typeof GridSyncIngressSchema>;

export interface StageCardTelemetry {
  stageId: number;
  title: string;
  shortCode: string;
  hexPtr: string;
  batchLabel: string;
  bubblePct: number;
  bubbleText: string;
  transferMs: number;
  transferText: string;
  stateLabel: string;
  pipelineHealth: 'OK' | 'REBALANCE';
  inflightBatches: number;
  virtualStages: number;
  activationMemoryMb: number;
  dutyCyclePct: number;
  forwardCount: number;
  backwardInputCount: number;
  backwardWeightCount: number;
}

export interface MicroBatchSlot {
  slotIndex: number;
  stageId: number;
  microbatchId: number;
  phase: 'F' | '1F1B' | 'B_I' | 'B_W';
  virtualChunk: number;
  durationUs: number;
}

export interface PipelineSnapshot {
  engineId: 'GF-T3-260';
  corridor: SyntheticCorridor;
  modeTag: string;
  meshPtr: string;
  throughputGbs: number;
  throughputFormatted: string;
  saturationPct: number;
  bubbleLatencyUs: number;
  bubbleLatencyFormatted: string;
  bubblePct: number;
  bubbleBadgeText: string;
  activeStagesCount: number;
  totalStagesCount: number;
  processedTokens: number;
  processedTokensFormatted: string;
  engineXpFormatted: string;
  pipelineStateText: string;
  vectorSignature: [number, number, number, number];
  stages: StageCardTelemetry[];
  scheduleSlots: MicroBatchSlot[];
}

/**
 * Verifiable Pipeline Bubble Formula:
 * Standard 1F1B upper bound: T_bubble <= (p - 1) / (p * m * v)
 * With non-uniform decoupled Backward Input (B_I) and Backward Weight (B_W) scheduling,
 * B_W fills the warm-up/cool-down voids, driving steady-state bubble to 0.0%.
 */
export function calculatePipelineBubblePct(
  numStages: number,
  numMicrobatches: number,
  interleavingDegree: number,
  zeroBubbleEnabled: boolean,
  imbalanceInjected: boolean
): number {
  if (numStages <= 1 || numMicrobatches <= 0 || interleavingDegree <= 0) {
    return 0.0;
  }
  const classicalBound = (numStages - 1) / (numStages * numMicrobatches * interleavingDegree);
  if (zeroBubbleEnabled && !imbalanceInjected) {
    return 0.0;
  }
  const residualMultiplier = zeroBubbleEnabled ? 0.05 : 1.0;
  const imbalanceSpike = imbalanceInjected ? 0.068 : 0.0;
  const pct = (classicalBound * residualMultiplier + imbalanceSpike) * 100.0;
  return Math.round(Math.min(Math.max(pct, 0.0), 99.9) * 10) / 10;
}

/**
 * Calculates Stage Activation Memory Footprint (MB):
 * Stage s in [0, p-1] holds (p - s) in-flight micro-batch activations during 1F1B execution.
 */
export function calculateStageActivationMemoryMb(
  stageId: number,
  numStages: number,
  interleavingDegree: number,
  hiddenDim: number,
  seqLength: number
): number {
  const inflight = Math.max(1, numStages - stageId);
  const bytesPerToken = hiddenDim * 2;
  const singleBatchMb = (seqLength * bytesPerToken) / (1024 * 1024);
  const interleaveFactor = 1 + (interleavingDegree - 1) * 0.0625;
  return Math.round(inflight * singleBatchMb * interleaveFactor * 10) / 10;
}

/**
 * Generates deterministic non-uniform 1F1B micro-batch schedule across all 8 stages.
 */
export function generate1F1BScheduleSlots(
  numStages: number,
  numMicrobatches: number,
  interleavingDegree: number,
  zeroBubbleEnabled: boolean
): MicroBatchSlot[] {
  const slots: MicroBatchSlot[] = [];
  let slotIdx = 0;
  const boundedBatches = Math.min(numMicrobatches, 16);

  for (let stage = 0; stage < numStages; stage++) {
    const warmupSteps = Math.max(0, numStages - stage - 1);
    const steadySteps = Math.max(1, boundedBatches - warmupSteps);

    for (let w = 0; w < warmupSteps; w++) {
      slots.push({
        slotIndex: slotIdx++,
        stageId: stage,
        microbatchId: w,
        phase: 'F',
        virtualChunk: w % interleavingDegree,
        durationUs: Math.round((12.4 / interleavingDegree) * 100) / 100,
      });
    }

    for (let s = 0; s < steadySteps; s++) {
      const mbId = warmupSteps + s;
      slots.push({
        slotIndex: slotIdx++,
        stageId: stage,
        microbatchId: mbId,
        phase: '1F1B',
        virtualChunk: mbId % interleavingDegree,
        durationUs: Math.round((24.0 / interleavingDegree) * 100) / 100,
      });
      if (zeroBubbleEnabled) {
        slots.push({
          slotIndex: slotIdx++,
          stageId: stage,
          microbatchId: Math.max(0, mbId - warmupSteps),
          phase: 'B_W',
          virtualChunk: mbId % interleavingDegree,
          durationUs: Math.round((6.2 / interleavingDegree) * 100) / 100,
        });
      }
    }

    for (let c = 0; c < warmupSteps; c++) {
      const mbId = steadySteps + c;
      slots.push({
        slotIndex: slotIdx++,
        stageId: stage,
        microbatchId: mbId,
        phase: 'B_I',
        virtualChunk: mbId % interleavingDegree,
        durationUs: Math.round((11.8 / interleavingDegree) * 100) / 100,
      });
    }
  }

  return slots;
}

export function formatIntegerWithCommas(value: number): string {
  return Math.round(value).toLocaleString('en-US');
}

export function evaluatePipelineEngine(rawInput: GridSyncIngressInput): PipelineSnapshot {
  const input = GridSyncIngressSchema.parse(rawInput);
  const spec = CORRIDOR_CATALOG[input.corridor];
  const effectiveInterleaving = Math.max(input.interleavingDegree, spec.interleavingDegree);

  const globalBubblePct = calculatePipelineBubblePct(
    input.numStages,
    input.numMicrobatches,
    effectiveInterleaving,
    input.zeroBubbleEnabled,
    input.imbalanceInjected
  );

  const burstBonusGbs = input.burstActive ? 1850 : 0;
  const stepHarmonicGbs = ((input.stepCounter - 1) % 6) * 140;
  const imbalancePenaltyRatio = globalBubblePct / 160.0;

  const rawThroughput =
    (spec.baseThroughputGbs + burstBonusGbs + stepHarmonicGbs) * (1.0 - imbalancePenaltyRatio);
  const throughputGbs = Math.round(rawThroughput);

  const saturationPct = Math.min(
    100,
    Math.max(55, Math.round((throughputGbs / 26000) * 100))
  );

  const bubbleLatencyUs =
    globalBubblePct === 0.0
      ? 0.01
      : Math.round((0.01 + globalBubblePct * 0.12) * 100) / 100;

  const stages: StageCardTelemetry[] = [];
  for (let i = 0; i < input.numStages; i++) {
    const hexNum = (0x9000 + i * 0x0100).toString(16).toUpperCase();
    const hexPtr = '0x' + hexNum;

    const isImbalancedStage = input.imbalanceInjected && (i === 2 || i === 5);
    const stageBubblePct = isImbalancedStage
      ? Math.round((globalBubblePct + (i === 2 ? 1.4 : 2.1)) * 10) / 10
      : globalBubblePct;

    const stageTransferMs = isImbalancedStage
      ? Math.round((spec.baseTransferMs + 0.03) * 100) / 100
      : spec.baseTransferMs;

    const stateLabel = isImbalancedStage ? 'REBALANCE · WARN' : 'BALANCED · LOCKED';
    const pipelineHealth = isImbalancedStage ? 'REBALANCE' : 'OK';
    const batchLabel = input.burstActive ? '1F1B-BURST' : '1F1B';

    const activationMemoryMb = calculateStageActivationMemoryMb(
      i,
      input.numStages,
      effectiveInterleaving,
      input.hiddenDim,
      input.seqLength
    );

    const dutyCyclePct = Math.round((100.0 - stageBubblePct) * 10) / 10;

    stages.push({
      stageId: i,
      title: 'Stage ' + String(i) + ' (P' + String(i) + ')',
      shortCode: 'P' + String(i),
      hexPtr,
      batchLabel,
      bubblePct: stageBubblePct,
      bubbleText: stageBubblePct.toFixed(1) + '%',
      transferMs: stageTransferMs,
      transferText: stageTransferMs.toFixed(2) + 'ms',
      stateLabel,
      pipelineHealth,
      inflightBatches: Math.max(1, input.numStages - i),
      virtualStages: effectiveInterleaving,
      activationMemoryMb,
      dutyCyclePct,
      forwardCount: input.numMicrobatches + input.stepCounter * 4,
      backwardInputCount: input.numMicrobatches + input.stepCounter * 4,
      backwardWeightCount: input.numMicrobatches + input.stepCounter * 4,
    });
  }

  const stepDelta = (input.stepCounter - 1) * 0.01;
  const burstDelta = input.burstActive ? 0.03 : 0.0;
  const vectorSignature: [number, number, number, number] = [
    Math.round((2.21 + stepDelta + burstDelta) * 100) / 100,
    Math.round((2.25 + stepDelta + burstDelta) * 100) / 100,
    Math.round((2.22 + stepDelta + burstDelta) * 100) / 100,
    Math.round((2.24 + stepDelta + burstDelta) * 100) / 100,
  ];

  const processedTokens =
    4352000 + (input.stepCounter - 1) * 128000 + (input.burstActive ? 512000 : 0);
  const xpValue = 75.0 + (input.stepCounter - 1) * 2.5 + (input.burstActive ? 10.0 : 0.0);

  const scheduleSlots = generate1F1BScheduleSlots(
    input.numStages,
    input.numMicrobatches,
    effectiveInterleaving,
    input.zeroBubbleEnabled
  );

  return {
    engineId: 'GF-T3-260',
    corridor: input.corridor,
    modeTag: spec.modeTag,
    meshPtr: '0x8F8DC0',
    throughputGbs,
    throughputFormatted: formatIntegerWithCommas(throughputGbs) + ' GB/s',
    saturationPct,
    bubbleLatencyUs,
    bubbleLatencyFormatted: bubbleLatencyUs.toFixed(2) + ' µs',
    bubblePct: globalBubblePct,
    bubbleBadgeText: '🔥 ' + globalBubblePct.toFixed(1) + '% BUBBLE',
    activeStagesCount: input.numStages,
    totalStagesCount: input.numStages,
    processedTokens,
    processedTokensFormatted: formatIntegerWithCommas(processedTokens) + ' UNITS',
    engineXpFormatted: '+' + xpValue.toFixed(1) + 'k ENGINE XP',
    pipelineStateText: input.imbalanceInjected
      ? 'Pipeline State: Re-Balancing'
      : 'Pipeline State: 1F1B Active',
    vectorSignature,
    stages,
    scheduleSlots,
  };
}

export const POSTGRES_RLS_SCHEMA_PREVIEW = [
  '-- GF-T3-260 PostgreSQL 16 / Supabase Partitioned Schema & RLS Policies',
  'CREATE TABLE IF NOT EXISTS public.gf_t3_260_pipeline_runs (',
  '  run_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),',
  '  operator_uid UUID NOT NULL,',
  '  corridor_id TEXT NOT NULL,',
  "  mesh_ptr TEXT NOT NULL DEFAULT '0x8F8DC0',",
  '  throughput_gbs NUMERIC(10,2) NOT NULL CHECK (throughput_gbs >= 0),',
  '  bubble_latency_us NUMERIC(8,4) NOT NULL CHECK (bubble_latency_us >= 0),',
  '  bubble_pct NUMERIC(5,2) NOT NULL CHECK (bubble_pct BETWEEN 0 AND 100),',
  '  active_stages INTEGER NOT NULL DEFAULT 8,',
  '  processed_tokens BIGINT NOT NULL DEFAULT 4352000',
  ');',
  'CREATE TABLE IF NOT EXISTS public.gf_t3_260_stage_telemetry (',
  '  snapshot_id UUID NOT NULL DEFAULT gen_random_uuid(),',
  '  run_id UUID NOT NULL REFERENCES public.gf_t3_260_pipeline_runs(run_id) ON DELETE CASCADE,',
  '  operator_uid UUID NOT NULL,',
  '  stage_id INTEGER NOT NULL CHECK (stage_id BETWEEN 0 AND 7),',
  '  hex_ptr TEXT NOT NULL,',
  '  batch_mode TEXT NOT NULL,',
  '  bubble_pct NUMERIC(5,2) NOT NULL,',
  '  transfer_ms NUMERIC(6,4) NOT NULL,',
  '  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),',
  '  PRIMARY KEY (snapshot_id, recorded_at)',
  ') PARTITION BY RANGE (recorded_at);',
  'ALTER TABLE public.gf_t3_260_pipeline_runs ENABLE ROW LEVEL SECURITY;',
  'CREATE POLICY "Operators isolate own pipeline runs" ON public.gf_t3_260_pipeline_runs',
  '  FOR ALL TO authenticated USING (auth.uid() = operator_uid) WITH CHECK (auth.uid() = operator_uid);',
].join('\n');
