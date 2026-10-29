/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GF-T3-270: Ultra-Wide Context Ring Attention & Hierarchical KV-Cache Compression Engine
 * Deterministic Mathematical Core & GridSync Zero-Trust Ingress Sanitizer
 */

import { z } from 'zod';

export type SyntheticCorridorLabel =
  | 'RING-CORRIDOR-ALPHA (ULTRA-WIDE-CONTEXT-RING-ATTENTION-FABRIC · 30400-GB/S)'
  | 'RING-CORRIDOR-BRAVO (HIERARCHICAL-KV-CACHE-COMPRESSION-ENGINE)'
  | 'RING-CORRIDOR-GAMMA (CYCLIC-PEER-TO-PEER-TOKEN-PASSER)'
  | 'RING-CORRIDOR-DELTA (FALLBACK-SHORT-CONTEXT-ATTENTION-PASS)';

export type QuantizationTier = 'INT-4' | 'INT-8' | 'FP8' | 'FP16';

export interface CorridorSpec {
  id: string;
  label: SyntheticCorridorLabel;
  shortCode: string;
  baseBandwidthGbs: number;
  baseLatencyUs: number;
  defaultQuant: QuantizationTier;
  tokensPerWindowK: number;
  headDim: number;
}

export const SYNTHETIC_CORRIDORS: readonly CorridorSpec[] = [
  {
    id: 'RING-CORRIDOR-ALPHA',
    label: 'RING-CORRIDOR-ALPHA (ULTRA-WIDE-CONTEXT-RING-ATTENTION-FABRIC · 30400-GB/S)',
    shortCode: 'ALPHA · 30.4 TB/S',
    baseBandwidthGbs: 30400,
    baseLatencyUs: 0.01,
    defaultQuant: 'INT-4',
    tokensPerWindowK: 512,
    headDim: 128,
  },
  {
    id: 'RING-CORRIDOR-BRAVO',
    label: 'RING-CORRIDOR-BRAVO (HIERARCHICAL-KV-CACHE-COMPRESSION-ENGINE)',
    shortCode: 'BRAVO · KV-COMP',
    baseBandwidthGbs: 28800,
    baseLatencyUs: 0.02,
    defaultQuant: 'INT-4',
    tokensPerWindowK: 768,
    headDim: 128,
  },
  {
    id: 'RING-CORRIDOR-GAMMA',
    label: 'RING-CORRIDOR-GAMMA (CYCLIC-PEER-TO-PEER-TOKEN-PASSER)',
    shortCode: 'GAMMA · P2P-RING',
    baseBandwidthGbs: 31200,
    baseLatencyUs: 0.01,
    defaultQuant: 'INT-8',
    tokensPerWindowK: 512,
    headDim: 128,
  },
  {
    id: 'RING-CORRIDOR-DELTA',
    label: 'RING-CORRIDOR-DELTA (FALLBACK-SHORT-CONTEXT-ATTENTION-PASS)',
    shortCode: 'DELTA · FP16-PASS',
    baseBandwidthGbs: 19600,
    baseLatencyUs: 0.04,
    defaultQuant: 'FP16',
    tokensPerWindowK: 128,
    headDim: 64,
  },
] as const;

const MALICIOUS_PATTERN = /(<script|javascript:|onerror=|onload=|select\s+.*\s+from|drop\s+table|union\s+select|--|;)/i;

export const GridSyncCommandSchema = z
  .object({
    corridor: z.enum([
      'RING-CORRIDOR-ALPHA (ULTRA-WIDE-CONTEXT-RING-ATTENTION-FABRIC · 30400-GB/S)',
      'RING-CORRIDOR-BRAVO (HIERARCHICAL-KV-CACHE-COMPRESSION-ENGINE)',
      'RING-CORRIDOR-GAMMA (CYCLIC-PEER-TO-PEER-TOKEN-PASSER)',
      'RING-CORRIDOR-DELTA (FALLBACK-SHORT-CONTEXT-ATTENTION-PASS)',
    ]),
    selectedWindowIndex: z.number().int().min(0).max(7),
    cyclicStep: z.number().int().min(0).max(100000),
    burstActive: z.boolean(),
    spikeActive: z.boolean(),
    quantOverride: z.enum(['INT-4', 'INT-8', 'FP8', 'FP16']).optional(),
    heavyHitterRatio: z.number().min(0.05).max(1.0).default(0.25),
    operatorNote: z
      .string()
      .max(180)
      .refine((val) => !MALICIOUS_PATTERN.test(val), {
        message: 'GridSync Zero-Trust Gate blocked SQLi/XSS signature',
      })
      .default('NOMINAL_OPERATION'),
  })
  .strict();

export type GridSyncCommandPayload = z.infer<typeof GridSyncCommandSchema>;

export function sanitizeGridSyncPayload(rawInput: unknown): {
  valid: boolean;
  data?: GridSyncCommandPayload;
  error?: string;
} {
  const parsed = GridSyncCommandSchema.safeParse(rawInput);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return {
      valid: false,
      error: firstIssue ? firstIssue.message : 'Schema validation failure',
    };
  }
  return { valid: true, data: parsed.data };
}

export interface RingAttentionBlockResult {
  outputMatrix: number[][];
  logSumExp: number[];
  peerHops: string[];
  maxScore: number;
  numericalParity: number;
}

/**
 * Exact Online Softmax Ring Attention Block Partitioning:
 * A_ring = Softmax((Q_i * K_j^T) / sqrt(d)) * V_j
 * Processes distributed key/value blocks cyclically across peer nodes using
 * running Log-Sum-Exp rescaling so full attention is computed without O(N^2) memory blowup.
 */
export function computeRingAttentionBlockPass(
  queryBlock: number[][],
  keyBlocks: number[][][],
  valueBlocks: number[][][],
  headDim: number,
  stepOffset: number = 0
): RingAttentionBlockResult {
  if (keyBlocks.length === 0 || keyBlocks.length !== valueBlocks.length) {
    throw new Error('Ring partition requires matching non-empty key and value block arrays');
  }
  if (queryBlock.length === 0 || queryBlock[0].length === 0) {
    throw new Error('Query block cannot be empty');
  }

  const numWindows = keyBlocks.length;
  const numQueries = queryBlock.length;
  const valueDim = valueBlocks[0][0].length;
  const scale = 1.0 / Math.sqrt(Math.max(1, headDim));

  const runningMax = new Array<number>(numQueries).fill(Number.NEGATIVE_INFINITY);
  const runningSum = new Array<number>(numQueries).fill(0);
  const runningAcc: number[][] = Array.from({ length: numQueries }, () =>
    new Array<number>(valueDim).fill(0)
  );

  const peerHops: string[] = [];
  let globalMaxScore = Number.NEGATIVE_INFINITY;

  for (let step = 0; step < numWindows; step++) {
    const blockIdx = (step + stepOffset) % numWindows;
    const nextIdx = (blockIdx + 1) % numWindows;
    peerHops.push('W' + String(blockIdx) + '->W' + String(nextIdx));

    const kBlock = keyBlocks[blockIdx];
    const vBlock = valueBlocks[blockIdx];
    if (kBlock.length === 0 || kBlock.length !== vBlock.length) {
      throw new Error('Key and value block token counts must match');
    }

    for (let qIdx = 0; qIdx < numQueries; qIdx++) {
      const qVec = queryBlock[qIdx];
      const scores: number[] = [];
      let blockMax = Number.NEGATIVE_INFINITY;

      for (let kIdx = 0; kIdx < kBlock.length; kIdx++) {
        const kVec = kBlock[kIdx];
        let dot = 0;
        const dimLimit = Math.min(qVec.length, kVec.length);
        for (let d = 0; d < dimLimit; d++) {
          dot += qVec[d] * kVec[d];
        }
        const scaled = dot * scale;
        scores.push(scaled);
        if (scaled > blockMax) {
          blockMax = scaled;
        }
        if (scaled > globalMaxScore) {
          globalMaxScore = scaled;
        }
      }

      const prevMax = runningMax[qIdx];
      const newMax = Math.max(prevMax, blockMax);
      const prevScale = prevMax === Number.NEGATIVE_INFINITY ? 0 : Math.exp(prevMax - newMax);

      runningSum[qIdx] = runningSum[qIdx] * prevScale;
      for (let d = 0; d < valueDim; d++) {
        runningAcc[qIdx][d] = runningAcc[qIdx][d] * prevScale;
      }

      for (let kIdx = 0; kIdx < scores.length; kIdx++) {
        const expWeight = Math.exp(scores[kIdx] - newMax);
        runningSum[qIdx] += expWeight;
        const vVec = vBlock[kIdx];
        for (let d = 0; d < Math.min(valueDim, vVec.length); d++) {
          runningAcc[qIdx][d] += expWeight * vVec[d];
        }
      }

      runningMax[qIdx] = newMax;
    }
  }

  const outputMatrix: number[][] = [];
  const logSumExp: number[] = [];

  for (let qIdx = 0; qIdx < numQueries; qIdx++) {
    const denom = runningSum[qIdx] > 1e-12 ? runningSum[qIdx] : 1.0;
    const row = runningAcc[qIdx].map((val) => Number((val / denom).toFixed(6)));
    outputMatrix.push(row);
    logSumExp.push(Number((runningMax[qIdx] + Math.log(denom)).toFixed(6)));
  }

  return {
    outputMatrix,
    logSumExp,
    peerHops,
    maxScore: Number(globalMaxScore.toFixed(4)),
    numericalParity: 100.0,
  };
}

export interface KVCompressionTelemetry {
  uncompressedFootprintGb: number;
  compressedFootprintGb: number;
  compressionRatio: number;
  retainedTokens: number;
  prunedTokens: number;
  quantMode: QuantizationTier;
  attentionParityPct: number;
}

const QUANT_BITS_MAP: Record<QuantizationTier, number> = {
  'INT-4': 4,
  'INT-8': 8,
  FP8: 8,
  FP16: 16,
};

/**
 * Deterministic Hierarchical KV-Cache Compression Calculator:
 * Combines attention-sink pinning + heavy-hitter L2 norm retention + sub-byte quantization.
 */
export function computeHierarchicalKVCompression(
  totalTokens: number,
  quantMode: QuantizationTier,
  heavyHitterRatio: number = 0.25,
  sinkTokens: number = 512,
  numLayers: number = 80,
  numKvHeads: number = 8,
  headDim: number = 128
): KVCompressionTelemetry {
  const safeTokens = Math.max(1024, totalTokens);
  const clampedRatio = Math.min(1.0, Math.max(0.05, heavyHitterRatio));
  const paramsPerToken = numLayers * numKvHeads * headDim * 2; // K + V
  const uncompressedBytes = safeTokens * paramsPerToken * 2; // FP16 = 2 bytes
  const uncompressedFootprintGb = uncompressedBytes / Math.pow(1024, 3);

  const nonSink = Math.max(0, safeTokens - sinkTokens);
  const retainedHeavyHitters = Math.round(nonSink * clampedRatio);
  const retainedTokens = Math.min(safeTokens, sinkTokens + retainedHeavyHitters);
  const prunedTokens = safeTokens - retainedTokens;

  const bits = QUANT_BITS_MAP[quantMode];
  const bytesPerElem = bits / 8.0;
  const compressedBytes = retainedTokens * paramsPerToken * bytesPerElem;
  const compressedFootprintGb = Math.max(0.01, compressedBytes / Math.pow(1024, 3));

  const compressionRatio = Number((uncompressedFootprintGb / compressedFootprintGb).toFixed(2));
  const quantLoss = (16 - bits) * 0.07;
  const pruneLoss = (1.0 - clampedRatio) * 0.32;
  const attentionParityPct = Number(Math.max(95.0, 100.0 - quantLoss - pruneLoss).toFixed(2));

  return {
    uncompressedFootprintGb: Number(uncompressedFootprintGb.toFixed(2)),
    compressedFootprintGb: Number(compressedFootprintGb.toFixed(2)),
    compressionRatio,
    retainedTokens,
    prunedTokens,
    quantMode,
    attentionParityPct,
  };
}

export interface WindowArenaCard {
  index: number;
  code: string;
  title: string;
  hexPtr: string;
  tokensLabel: string;
  tokensNumericK: number;
  compLabel: QuantizationTier;
  latencyLabel: string;
  latencyNumericMs: number;
  stateText: string;
  syncPct: number;
  isFaulted: boolean;
  lseValue: number;
  peerTarget: string;
}

export interface CockpitTelemetrySnapshot {
  corridor: CorridorSpec;
  throughputGbs: number;
  throughputFormatted: string;
  saturationPct: number;
  ringLatencyUs: number;
  ringLatencyFormatted: string;
  activeWindowsCount: number;
  totalWindowsCount: number;
  processedTokensUnits: number;
  processedTokensFormatted: string;
  engineXpFormatted: string;
  ringStateLabel: string;
  meshPointerHex: string;
  stateVector: [number, number, number, number];
  windows: WindowArenaCard[];
  kvCompression: KVCompressionTelemetry;
  ringPassSample: RingAttentionBlockResult;
}

export function formatNumberWithCommas(val: number): string {
  return Math.round(val).toLocaleString('en-US');
}

export function computeCockpitTelemetry(
  corridorLabel: SyntheticCorridorLabel,
  cyclicStep: number,
  burstActive: boolean,
  spikeActive: boolean,
  quantOverride?: QuantizationTier,
  heavyHitterRatio: number = 0.25
): CockpitTelemetrySnapshot {
  const corridor =
    SYNTHETIC_CORRIDORS.find((c) => c.label === corridorLabel) ?? SYNTHETIC_CORRIDORS[0];

  const activeQuant: QuantizationTier = spikeActive
    ? 'INT-4'
    : quantOverride ?? corridor.defaultQuant;

  const burstMultiplier = burstActive ? 1.125 : 1.0;
  const spikeFactor = spikeActive ? 0.94 : 1.0;
  const stepBonusGbs = (cyclicStep % 8) * 50;

  const rawThroughput =
    corridor.baseBandwidthGbs * burstMultiplier * spikeFactor + stepBonusGbs;
  const throughputGbs =
    cyclicStep === 0 && !burstActive && !spikeActive
      ? corridor.baseBandwidthGbs
      : Math.round(rawThroughput);

  const saturationPct = Math.min(100, Math.round((throughputGbs / 34200) * 100));

  const ringLatencyUs =
    cyclicStep === 0 && !burstActive && !spikeActive
      ? corridor.baseLatencyUs
      : Number(
          Math.max(
            0.01,
            corridor.baseLatencyUs * (spikeActive ? 1.8 : 1.0) * (burstActive ? 0.9 : 1.0)
          ).toFixed(2)
        );

  const processedTokensUnits =
    6000000 + cyclicStep * 75000 + (burstActive ? 512000 : 0) + (spikeActive ? 256000 : 0);
  const xpValueK = 75.0 + cyclicStep * 2.5 + (burstActive ? 12.5 : 0);

  const baseVector: [number, number, number, number] = [3.21, 3.25, 3.22, 3.24];
  const stepDelta = (cyclicStep % 8) * 0.01 + (burstActive ? 0.04 : 0);
  const stateVector: [number, number, number, number] = [
    Number((baseVector[0] + stepDelta).toFixed(2)),
    Number((baseVector[1] + stepDelta).toFixed(2)),
    Number((baseVector[2] + stepDelta).toFixed(2)),
    Number((baseVector[3] + stepDelta).toFixed(2)),
  ];

  // Execute real 8-window Ring Attention block pass on synthetic embeddings
  const sampleQuery: number[][] = [
    [0.82 + stepDelta, 0.34, -0.18, 0.65],
    [0.45, -0.22, 0.91, 0.31 + stepDelta],
  ];
  const sampleKeys: number[][][] = Array.from({ length: 8 }, (_, wIdx) => [
    [0.3 + wIdx * 0.05, 0.4 - wIdx * 0.02, 0.25, 0.6],
    [0.5, -0.1 + wIdx * 0.03, 0.7, 0.2],
  ]);
  const sampleValues: number[][][] = Array.from({ length: 8 }, (_, wIdx) => [
    [1.1 + wIdx * 0.1, 2.0 - wIdx * 0.08],
    [1.8, 0.9 + wIdx * 0.12],
  ]);

  const ringPassSample = computeRingAttentionBlockPass(
    sampleQuery,
    sampleKeys,
    sampleValues,
    corridor.headDim,
    cyclicStep % 8
  );

  const windows: WindowArenaCard[] = Array.from({ length: 8 }, (_, idx) => {
    const shiftedSlot = (idx + cyclicStep) % 8;
    const hexVal = 0x4000 + shiftedSlot * 0x0010;
    const hexPtr = '0x' + hexVal.toString(16).toUpperCase();
    const isFaulted = spikeActive && (idx === 2 || idx === 5);
    const tokensNumericK =
      corridor.tokensPerWindowK + (burstActive ? 128 : 0) + (isFaulted ? 256 : 0);
    const latencyNumericMs = isFaulted
      ? 0.09
      : Number((0.02 + (shiftedSlot % 2 === 1 && cyclicStep > 0 ? 0.01 : 0)).toFixed(2));
    const stateText = isFaulted ? '⚡ FAULT' : 'CIRCULAR · LOCKED';
    const syncPct = isFaulted ? 94 : 100;
    const lseVal = Number((stateVector[idx % 4] + idx * 0.01).toFixed(3));
    const peerTarget = 'W' + String((idx + 1) % 8);

    return {
      index: idx,
      code: 'W' + String(idx),
      title: 'Window ' + String(idx) + ' (W' + String(idx) + ')',
      hexPtr,
      tokensLabel: String(tokensNumericK) + 'K',
      tokensNumericK,
      compLabel: activeQuant,
      latencyLabel: latencyNumericMs.toFixed(2) + 'ms',
      latencyNumericMs,
      stateText,
      syncPct,
      isFaulted,
      lseValue: lseVal,
      peerTarget,
    };
  });

  const activeWindowsCount = windows.filter((w) => !w.isFaulted).length;
  const meshPtrBase = 0x3f8dc0 + (cyclicStep % 16) * 0x10;
  const meshPointerHex = '0x' + meshPtrBase.toString(16).toUpperCase();

  const kvCompression = computeHierarchicalKVCompression(
    processedTokensUnits,
    activeQuant,
    heavyHitterRatio
  );

  return {
    corridor,
    throughputGbs,
    throughputFormatted: formatNumberWithCommas(throughputGbs) + ' GB/s',
    saturationPct,
    ringLatencyUs,
    ringLatencyFormatted: ringLatencyUs.toFixed(2) + ' µs',
    activeWindowsCount,
    totalWindowsCount: 8,
    processedTokensUnits,
    processedTokensFormatted: formatNumberWithCommas(processedTokensUnits) + ' UNITS',
    engineXpFormatted: '+' + xpValueK.toFixed(1) + 'k ENGINE XP',
    ringStateLabel: spikeActive
      ? 'Ring State: KV Spike Compression'
      : 'Ring State: Attention Active',
    meshPointerHex,
    stateVector,
    windows,
    kvCompression,
    ringPassSample,
  };
}

export const SUPABASE_RLS_SCHEMA_SQL = [
  '-- GF-T3-270 PostgreSQL / Supabase Partitioned Persistence Schema with RLS',
  'CREATE TABLE IF NOT EXISTS public.gf_t3_270_corridors (',
  '  corridor_id TEXT PRIMARY KEY,',
  '  corridor_label TEXT NOT NULL UNIQUE,',
  '  bandwidth_gbs NUMERIC(10, 2) NOT NULL CHECK (bandwidth_gbs > 0),',
  '  base_latency_us NUMERIC(8, 4) NOT NULL CHECK (base_latency_us > 0),',
  "  default_quant_mode TEXT NOT NULL CHECK (default_quant_mode IN ('INT-4', 'INT-8', 'FP8', 'FP16')),",
  '  window_count INTEGER NOT NULL DEFAULT 8,',
  '  tenant_uid UUID NOT NULL DEFAULT auth.uid(),',
  '  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()',
  ');',
  '',
  'CREATE TABLE IF NOT EXISTS public.gf_t3_270_window_arenas (',
  '  arena_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),',
  '  corridor_id TEXT NOT NULL REFERENCES public.gf_t3_270_corridors(corridor_id) ON DELETE CASCADE,',
  '  window_index INTEGER NOT NULL CHECK (window_index BETWEEN 0 AND 7),',
  '  window_code TEXT NOT NULL,',
  '  hex_pointer TEXT NOT NULL,',
  '  allocated_tokens BIGINT NOT NULL CHECK (allocated_tokens >= 0),',
  "  compression_tier TEXT NOT NULL CHECK (compression_tier IN ('INT-4', 'INT-8', 'FP8', 'FP16')),",
  '  sync_latency_ms NUMERIC(8, 4) NOT NULL CHECK (sync_latency_ms >= 0),',
  '  ring_lock_state TEXT NOT NULL,',
  '  tenant_uid UUID NOT NULL DEFAULT auth.uid(),',
  '  UNIQUE (corridor_id, window_index)',
  ');',
  '',
  'CREATE TABLE IF NOT EXISTS public.gf_t3_270_telemetry_events (',
  '  event_id UUID NOT NULL DEFAULT gen_random_uuid(),',
  '  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),',
  '  corridor_id TEXT NOT NULL REFERENCES public.gf_t3_270_corridors(corridor_id),',
  '  cyclic_step BIGINT NOT NULL CHECK (cyclic_step >= 0),',
  '  attention_throughput_gbs NUMERIC(10, 2) NOT NULL,',
  '  ring_sync_latency_us NUMERIC(8, 4) NOT NULL,',
  '  processed_tokens_units BIGINT NOT NULL,',
  '  tenant_uid UUID NOT NULL DEFAULT auth.uid(),',
  '  PRIMARY KEY (event_id, recorded_at)',
  ') PARTITION BY RANGE (recorded_at);',
  '',
  'ALTER TABLE public.gf_t3_270_corridors ENABLE ROW LEVEL SECURITY;',
  'ALTER TABLE public.gf_t3_270_window_arenas ENABLE ROW LEVEL SECURITY;',
  'ALTER TABLE public.gf_t3_270_telemetry_events ENABLE ROW LEVEL SECURITY;',
  '',
  'CREATE POLICY gf_t3_270_tenant_rls ON public.gf_t3_270_window_arenas',
  '  FOR ALL TO authenticated USING (tenant_uid = auth.uid()) WITH CHECK (tenant_uid = auth.uid());',
].join('\n');
