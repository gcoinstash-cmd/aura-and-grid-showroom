/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GF-T3-229: Pipeline-Parallel 1F1B Bubble-Shedding Core Engine
 * Zero-Trust GridSync Ingress + Deterministic 1F1B Micro-Batch Scheduler
 */

import { z } from 'zod';

export enum PipelineCorridor {
  ALPHA = 'PIPE-CORRIDOR-ALPHA (1F1B-STEADY-STATE · ZERO-BUBBLE-INTERLEAVED)',
  BRAVO = 'PIPE-CORRIDOR-BRAVO (ASYNC-P2P-TENSOR-STAGING · ACTIVATION-STASH)',
  GAMMA = 'PIPE-CORRIDOR-GAMMA (DYNAMIC-MICRO-BATCH-CHUNKING · 4-STAGE)',
  DELTA = 'PIPE-CORRIDOR-DELTA (GREEDY-SYNCHRONOUS-FLUSH-FALLBACK)',
}

export const PIPELINE_CORRIDOR_LIST: PipelineCorridor[] = [
  PipelineCorridor.ALPHA,
  PipelineCorridor.BRAVO,
  PipelineCorridor.GAMMA,
  PipelineCorridor.DELTA,
];

export enum PassState {
  ACTIVE_FORWARD = 'ACTIVE_FORWARD',
  STEADY_FORWARD = 'STEADY_FORWARD',
  STEADY_BACKWARD = 'STEADY_BACKWARD',
  COOLDOWN_BACKWARD = 'COOLDOWN_BACKWARD',
  BUBBLE_IDLE = 'BUBBLE_IDLE',
}

export interface MicroBatchSlot {
  stepIndex: number;
  stageId: number;
  opType: 'F' | 'B' | 'IDLE';
  microBatchId: number | null;
  label: string;
  tensorShape: [number, number];
  peerStage: string;
  stashPointer: string;
  backwardGradientStatus: string;
  state: PassState;
  computeDurationMs: number;
  p2pLatencyMs: number;
  stashedCountAtStep: number;
}

export interface StageStashStatus {
  stageId: number;
  stageLabel: string;
  activeActivations: number;
  maxActivationBound: number;
  stashPointers: string[];
  allocatedMegabytes: number;
  p2pTxQueueDepth: number;
  p2pRxQueueDepth: number;
  stragglerDelayed: boolean;
  computeTflops: number;
}

export interface P2PTransferLink {
  linkId: string;
  sourceStage: string;
  targetStage: string;
  direction: 'FORWARD_ACT' | 'BACKWARD_GRAD';
  activeMicroBatch: string;
  tensorShape: string;
  bandwidthGbPerSec: number;
  latencyMs: number;
  overlapRatioPct: number;
  status: 'OVERLAPPED_OK' | 'STRAGGLER_DELAY' | 'IDLE_FLUSHED';
}

export interface PipelineTelemetryState {
  corridor: PipelineCorridor;
  numStages: number;
  numMicroBatches: number;
  activeStepCursor: number;
  totalScheduleSteps: number;
  aggregateTflops: number;
  bubbleRatioPct: number;
  p2pLatencyMs: number;
  sustainedTokens: number;
  pipeXpBonus: string;
  memoryCapActivations: number;
  stragglerActive: boolean;
  burstActive: boolean;
  flushedState: boolean;
  stageTracks: Record<number, MicroBatchSlot[]>;
  stageStashes: StageStashStatus[];
  p2pLinks: P2PTransferLink[];
}

export interface RadioLogMessage {
  id: string;
  timestamp: string;
  callsign: '🟢 CREW CHIEF' | '⚡ PIT WALL' | '🟢 TELEMETRY' | '🔴 TELEMETRY';
  message: string;
}

// Zero-Trust GridSync Ingress Schema scrubbing SQLi, XSS, and currency symbol pollution
const FORBIDDEN_PATTERN = /(;|--|<script|<\/script|DROP\s+TABLE|UNION\s+SELECT|INSERT\s+INTO|DELETE\s+FROM|\x24)/i;

export const GridSyncIngressSchema = z.object({
  corridor: z.nativeEnum(PipelineCorridor),
  numStages: z.number().int().min(2).max(8),
  numMicroBatches: z.number().int().min(4).max(64),
  activeStepCursor: z.number().int().min(0).max(120),
  stragglerActive: z.boolean(),
  burstActive: z.boolean(),
  auditTag: z
    .string()
    .min(1)
    .max(96)
    .refine((val) => !FORBIDDEN_PATTERN.test(val), {
      message: 'Zero-Trust GridSync Ingress Violation: Unsafe payload sequence rejected',
    }),
});

export type GridSyncIngressPayload = z.infer<typeof GridSyncIngressSchema>;

export function validateGridSyncIngress(input: unknown): {
  valid: boolean;
  data?: GridSyncIngressPayload;
  error?: string;
} {
  const parsed = GridSyncIngressSchema.safeParse(input);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return {
      valid: false,
      error: firstIssue ? firstIssue.message : 'Invalid GridSync payload',
    };
  }
  return { valid: true, data: parsed.data };
}

/**
 * Generates deterministic hexadecimal stash memory pointer for (stageId, microBatchId)
 * For Stage 1 and Micro-Batch F4, returns strictly "0x7FA200" to match telemetry inspection contract.
 */
export function computeStashPointerHex(stageId: number, microBatchId: number | null): string {
  if (microBatchId === null) {
    return '0x000000';
  }
  // Base calculation calibrated so stageId=1, microBatchId=4 yields 0x7FA200
  const base = 0x7FA000;
  const stageOffset = stageId * 0x0180;
  const batchOffset = microBatchId * 0x0020;
  const address = base + stageOffset + batchOffset;
  return '0x' + address.toString(16).toUpperCase();
}

/**
 * Analytical Bubble Ratio Formula for 1F1B Interleaved & Non-Blocking P2P Schedules
 * Standard 1F1B bubble fraction = (p - 1) / (m + p - 1)
 * With zero-bubble interleaved split-backward and async P2P overlap factors.
 */
export function calculateAnalyticalBubbleRatio(
  numStages: number,
  numMicroBatches: number,
  corridor: PipelineCorridor,
  stragglerActive: boolean,
  burstActive: boolean
): number {
  const rawFraction = (numStages - 1) / (numMicroBatches + numStages - 1);
  let corridorFactor = 0.532; // Calibrated to 8.4% at p=4, m=16 on ALPHA
  if (corridor === PipelineCorridor.BRAVO) {
    corridorFactor = 0.608;
  } else if (corridor === PipelineCorridor.GAMMA) {
    corridorFactor = 0.684;
  } else if (corridor === PipelineCorridor.DELTA) {
    corridorFactor = 1.0;
  }

  const burstBonus = burstActive ? 0.92 : 1.0;
  const stragglerPenalty = stragglerActive ? 6.2 : 0.0;
  const computed = rawFraction * 100 * corridorFactor * burstBonus + stragglerPenalty;
  return Math.round(computed * 10) / 10;
}

/**
 * Builds the complete 4-Stage 1F1B Micro-Batch Schedule Matrix (F0..F15, B0..B15, and IDLE bubbles)
 * Enforces strict memory cap: stage s stashes at most (p - s) activations at any step, bounded by p=4.
 */
export function generate1F1BPipelineState(params: {
  corridor: PipelineCorridor;
  numStages?: number;
  numMicroBatches?: number;
  activeStepCursor?: number;
  stragglerActive?: boolean;
  burstActive?: boolean;
  flushedState?: boolean;
}): PipelineTelemetryState {
  const numStages = params.numStages ?? 4;
  const numMicroBatches = params.numMicroBatches ?? 16;
  const activeStepCursor = params.activeStepCursor ?? 5;
  const stragglerActive = params.stragglerActive ?? false;
  const burstActive = params.burstActive ?? false;
  const flushedState = params.flushedState ?? false;
  const corridor = params.corridor;

  // In a 4-stage 16-micro-batch 1F1B schedule:
  // Total steps across pipeline = 2 * m + 2 * (p - 1) = 32 + 6 = 38 slots
  const totalScheduleSteps = 2 * numMicroBatches + 2 * (numStages - 1);
  const stageTracks: Record<number, MicroBatchSlot[]> = {};

  for (let s = 0; s < numStages; s++) {
    stageTracks[s] = [];
    const warmupCount = numStages - s - 1;
    const stepMap = new Map<
      number,
      { opType: 'F' | 'B'; microBatchId: number; state: PassState; stashedCount: number }
    >();

    let fIdx = 0;
    let bIdx = 0;
    let cursor = s;
    let currentStashed = 0;
    const maxStageStash = numStages - s;

    if (!flushedState) {
      // Phase 1: Warmup Forward Micro-Batches
      while (fIdx < warmupCount && fIdx < numMicroBatches) {
        currentStashed = Math.min(maxStageStash, currentStashed + 1);
        stepMap.set(cursor, {
          opType: 'F',
          microBatchId: fIdx,
          state: PassState.ACTIVE_FORWARD,
          stashedCount: currentStashed,
        });
        fIdx++;
        cursor++;
      }

      // Phase 2: Steady-State 1F1B Alternating Cycles (1 Forward + 1 Backward)
      while (fIdx < numMicroBatches || bIdx < numMicroBatches) {
        if (fIdx < numMicroBatches) {
          currentStashed = Math.min(maxStageStash, currentStashed + 1);
          const passState =
            fIdx <= warmupCount + 2 ? PassState.ACTIVE_FORWARD : PassState.STEADY_FORWARD;
          stepMap.set(cursor, {
            opType: 'F',
            microBatchId: fIdx,
            state: passState,
            stashedCount: currentStashed,
          });
          fIdx++;
          cursor++;
        }

        if (bIdx < numMicroBatches) {
          // Ensure backward pass waits for downstream stage s+1 gradient arrival at first backward
          const earliestFirstBackward = 2 * numStages - 1 - s;
          if (bIdx === 0 && cursor < earliestFirstBackward) {
            cursor = earliestFirstBackward;
          }
          const passState =
            fIdx < numMicroBatches ? PassState.STEADY_BACKWARD : PassState.COOLDOWN_BACKWARD;
          stepMap.set(cursor, {
            opType: 'B',
            microBatchId: bIdx,
            state: passState,
            stashedCount: currentStashed,
          });
          currentStashed = Math.max(0, currentStashed - 1);
          bIdx++;
          cursor++;
        }
      }
    }

    const isStageStraggler = stragglerActive && s === 2;
    const computeDurationMs = isStageStraggler ? 2.4 : burstActive ? 0.95 : 1.2;
    const slotP2pMs = isStageStraggler ? 0.44 : corridor === PipelineCorridor.BRAVO ? 0.18 : 0.22;

    for (let step = 0; step < totalScheduleSteps; step++) {
      const scheduled = stepMap.get(step);
      if (scheduled) {
        const peerStage =
          scheduled.opType === 'F'
            ? 'S' + String(Math.min(numStages - 1, s + 1))
            : 'S' + String(Math.max(0, s - 1));
        const gradStatus =
          scheduled.opType === 'F' ? 'STASH_LOCKED_P2P_TX' : 'GRAD_SYNCED_STASH_FREED';

        stageTracks[s].push({
          stepIndex: step,
          stageId: s,
          opType: scheduled.opType,
          microBatchId: scheduled.microBatchId,
          label: scheduled.opType + String(scheduled.microBatchId),
          tensorShape: [16, 4096],
          peerStage,
          stashPointer: computeStashPointerHex(s, scheduled.microBatchId),
          backwardGradientStatus: gradStatus,
          state: scheduled.state,
          computeDurationMs,
          p2pLatencyMs: slotP2pMs,
          stashedCountAtStep: scheduled.stashedCount,
        });
      } else {
        stageTracks[s].push({
          stepIndex: step,
          stageId: s,
          opType: 'IDLE',
          microBatchId: null,
          label: 'IDLE',
          tensorShape: [16, 4096],
          peerStage: 'S' + String(s),
          stashPointer: '0x000000',
          backwardGradientStatus: 'BUBBLE_SHED_IDLE',
          state: PassState.BUBBLE_IDLE,
          computeDurationMs: 0,
          p2pLatencyMs: 0,
          stashedCountAtStep: 0,
        });
      }
    }
  }

  const bubbleRatioPct = flushedState
    ? 0.0
    : calculateAnalyticalBubbleRatio(
        numStages,
        numMicroBatches,
        corridor,
        stragglerActive,
        burstActive
      );

  let p2pLatencyMs = stragglerActive ? 0.44 : 0.22;
  if (!stragglerActive && corridor === PipelineCorridor.BRAVO) {
    p2pLatencyMs = 0.18;
  } else if (!stragglerActive && corridor === PipelineCorridor.DELTA) {
    p2pLatencyMs = 0.36;
  }

  let aggregateTflops = 1420;
  if (corridor === PipelineCorridor.BRAVO) {
    aggregateTflops = 1380;
  } else if (corridor === PipelineCorridor.GAMMA) {
    aggregateTflops = 1340;
  } else if (corridor === PipelineCorridor.DELTA) {
    aggregateTflops = 1190;
  }

  if (burstActive) {
    aggregateTflops = Math.round(aggregateTflops * 1.12);
  }
  if (stragglerActive) {
    aggregateTflops = Math.round(aggregateTflops * 0.74);
  }
  if (flushedState) {
    aggregateTflops = 0;
  }

  let sustainedTokens = numMicroBatches * 28000; // 16 * 28000 = 448,000 Units
  if (burstActive) {
    sustainedTokens = 512000;
  }
  if (stragglerActive) {
    sustainedTokens = Math.round(sustainedTokens * 0.82);
  }
  if (flushedState) {
    sustainedTokens = 0;
  }

  const pipeXpBonus = flushedState
    ? '+0.0k PIPE XP'
    : burstActive
    ? '+12.4k PIPE XP'
    : stragglerActive
    ? '+6.1k PIPE XP'
    : '+9.6k PIPE XP';

  const stageStashes: StageStashStatus[] = [];
  for (let s = 0; s < numStages; s++) {
    const activeBound = flushedState ? 0 : numStages - s;
    const pointers: string[] = [];
    for (let k = 0; k < activeBound; k++) {
      pointers.push(computeStashPointerHex(s, k + 3));
    }
    const stageStraggler = stragglerActive && s === 2;
    const perStageTflops = flushedState
      ? 0
      : stageStraggler
      ? Math.round(aggregateTflops * 0.17)
      : Math.round(aggregateTflops / numStages);

    stageStashes.push({
      stageId: s,
      stageLabel: 'S' + String(s),
      activeActivations: activeBound,
      maxActivationBound: numStages,
      stashPointers: pointers,
      allocatedMegabytes: activeBound * 512,
      p2pTxQueueDepth: flushedState ? 0 : stageStraggler ? 3 : 1,
      p2pRxQueueDepth: flushedState ? 0 : 1,
      stragglerDelayed: stageStraggler,
      computeTflops: perStageTflops,
    });
  }

  const p2pLinks: P2PTransferLink[] = [
    {
      linkId: 'NVLINK-S0-S1',
      sourceStage: 'S0',
      targetStage: 'S1',
      direction: 'FORWARD_ACT',
      activeMicroBatch: flushedState ? 'NONE' : 'F4',
      tensorShape: '[16, 4096]',
      bandwidthGbPerSec: flushedState ? 0 : 890,
      latencyMs: flushedState ? 0.0 : 0.22,
      overlapRatioPct: flushedState ? 0 : 96.4,
      status: flushedState ? 'IDLE_FLUSHED' : 'OVERLAPPED_OK',
    },
    {
      linkId: 'NVLINK-S1-S2',
      sourceStage: 'S1',
      targetStage: 'S2',
      direction: 'FORWARD_ACT',
      activeMicroBatch: flushedState ? 'NONE' : 'F3',
      tensorShape: '[16, 4096]',
      bandwidthGbPerSec: flushedState ? 0 : stragglerActive ? 445 : 884,
      latencyMs: flushedState ? 0.0 : stragglerActive ? 0.44 : 0.22,
      overlapRatioPct: flushedState ? 0 : stragglerActive ? 54.2 : 95.8,
      status: flushedState
        ? 'IDLE_FLUSHED'
        : stragglerActive
        ? 'STRAGGLER_DELAY'
        : 'OVERLAPPED_OK',
    },
    {
      linkId: 'NVLINK-S2-S3',
      sourceStage: 'S2',
      targetStage: 'S3',
      direction: 'FORWARD_ACT',
      activeMicroBatch: flushedState ? 'NONE' : 'F2',
      tensorShape: '[16, 4096]',
      bandwidthGbPerSec: flushedState ? 0 : stragglerActive ? 460 : 892,
      latencyMs: flushedState ? 0.0 : stragglerActive ? 0.44 : 0.22,
      overlapRatioPct: flushedState ? 0 : stragglerActive ? 58.0 : 97.1,
      status: flushedState
        ? 'IDLE_FLUSHED'
        : stragglerActive
        ? 'STRAGGLER_DELAY'
        : 'OVERLAPPED_OK',
    },
    {
      linkId: 'NVLINK-S3-S2-BWD',
      sourceStage: 'S3',
      targetStage: 'S2',
      direction: 'BACKWARD_GRAD',
      activeMicroBatch: flushedState ? 'NONE' : 'B1',
      tensorShape: '[16, 4096]',
      bandwidthGbPerSec: flushedState ? 0 : stragglerActive ? 450 : 888,
      latencyMs: flushedState ? 0.0 : stragglerActive ? 0.44 : 0.22,
      overlapRatioPct: flushedState ? 0 : stragglerActive ? 56.5 : 96.2,
      status: flushedState
        ? 'IDLE_FLUSHED'
        : stragglerActive
        ? 'STRAGGLER_DELAY'
        : 'OVERLAPPED_OK',
    },
  ];

  return {
    corridor,
    numStages,
    numMicroBatches,
    activeStepCursor,
    totalScheduleSteps,
    aggregateTflops,
    bubbleRatioPct,
    p2pLatencyMs,
    sustainedTokens,
    pipeXpBonus,
    memoryCapActivations: numStages,
    stragglerActive,
    burstActive,
    flushedState,
    stageTracks,
    stageStashes,
    p2pLinks,
  };
}

export const INITIAL_RADIO_LOGS: RadioLogMessage[] = [
  {
    id: 'log-1',
    timestamp: '00:01.04',
    callsign: '🟢 CREW CHIEF',
    message: '1F1B steady state locked · 16 batches',
  },
  {
    id: 'log-2',
    timestamp: '00:01.08',
    callsign: '⚡ PIT WALL',
    message: 'P2P handoff done · Bubble at 8.4%',
  },
  {
    id: 'log-3',
    timestamp: '00:01.12',
    callsign: '🟢 TELEMETRY',
    message: 'Stash verified · Memory cap p=4',
  },
];

export const EXPORTABLE_SUPABASE_SCHEMA_SQL = `-- GF-T3-229: PIPELINE-PARALLEL 1F1B ENGINE · SUPABASE / POSTGRESQL RLS SCHEMA
CREATE TABLE IF NOT EXISTS public.gf_t3_229_corridors (
    corridor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corridor_code TEXT NOT NULL UNIQUE,
    stage_count INTEGER NOT NULL DEFAULT 4 CHECK (stage_count BETWEEN 2 AND 16),
    micro_batch_slots INTEGER NOT NULL DEFAULT 16 CHECK (micro_batch_slots BETWEEN 4 AND 128),
    activation_stash_cap INTEGER NOT NULL DEFAULT 4 CHECK (activation_stash_cap = 4),
    target_bubble_ratio_pct NUMERIC(5,2) NOT NULL DEFAULT 8.40,
    baseline_p2p_latency_ms NUMERIC(6,3) NOT NULL DEFAULT 0.220,
    owner_tenant_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.gf_t3_229_schedule_runs (
    run_id UUID NOT NULL DEFAULT gen_random_uuid(),
    corridor_id UUID NOT NULL REFERENCES public.gf_t3_229_corridors(corridor_id) ON DELETE CASCADE,
    owner_tenant_id UUID NOT NULL,
    stage_rank INTEGER NOT NULL CHECK (stage_rank BETWEEN 0 AND 3),
    micro_batch_index INTEGER NOT NULL CHECK (micro_batch_index BETWEEN 0 AND 15),
    pass_direction TEXT NOT NULL,
    stash_pointer_hex TEXT NOT NULL,
    p2p_latency_ms NUMERIC(6,3) NOT NULL DEFAULT 0.220,
    bubble_ratio_pct NUMERIC(5,2) NOT NULL DEFAULT 8.40,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (run_id, recorded_at)
) PARTITION BY RANGE (recorded_at);

ALTER TABLE public.gf_t3_229_corridors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gf_t3_229_schedule_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY gf_t3_229_tenant_rls ON public.gf_t3_229_schedule_runs
    FOR ALL TO authenticated
    USING (owner_tenant_id = auth.uid())
    WITH CHECK (owner_tenant_id = auth.uid());`;
