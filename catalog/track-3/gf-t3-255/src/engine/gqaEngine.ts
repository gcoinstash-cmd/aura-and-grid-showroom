/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GF-T3-255: Grouped-Query Attention (GQA) & KV Cache Compression Tensor Fabric
 * Deterministic Mathematical Core + GridSync Zero-Trust Ingress Sanitizer
 * Strictly Zero Currency Symbols Across Entire File
 */

import { z } from 'zod';

export type CorridorKey = 'ALPHA' | 'BRAVO' | 'GAMMA' | 'DELTA';

export interface CorridorDefinition {
  key: CorridorKey;
  id: string;
  shortTag: string;
  mode: string;
  baseThroughputGbs: number;
  targetCompactionRatio: number;
  queryHeads: number;
  kvHeads: number;
  evictionThresholdPct: number;
  baseLatencyUs: number;
  baseHeadLatencyMs: number;
}

export const SYNTHETIC_GQA_CORRIDORS: Record<CorridorKey, CorridorDefinition> = {
  ALPHA: {
    key: 'ALPHA',
    id: 'GQA-CORRIDOR-ALPHA (KV-CACHE-COMPRESSION-FABRIC · 17400-GB/S)',
    shortTag: 'GQA-CORRIDOR-ALPHA',
    mode: 'GQA_COMPRESSION',
    baseThroughputGbs: 17400,
    targetCompactionRatio: 4.0,
    queryHeads: 64,
    kvHeads: 8,
    evictionThresholdPct: 0.01,
    baseLatencyUs: 0.01,
    baseHeadLatencyMs: 0.04,
  },
  BRAVO: {
    key: 'BRAVO',
    id: 'GQA-CORRIDOR-BRAVO (GROUPED-QUERY-ATTENTION-HEAD-SHARING)',
    shortTag: 'GQA-CORRIDOR-BRAVO',
    mode: 'GQA_HEAD_SHARING',
    baseThroughputGbs: 18250,
    targetCompactionRatio: 4.5,
    queryHeads: 64,
    kvHeads: 8,
    evictionThresholdPct: 0.01,
    baseLatencyUs: 0.01,
    baseHeadLatencyMs: 0.04,
  },
  GAMMA: {
    key: 'GAMMA',
    id: 'GQA-CORRIDOR-GAMMA (TEMPORAL-EVICTION-POOLING-ENGINE)',
    shortTag: 'GQA-CORRIDOR-GAMMA',
    mode: 'TEMPORAL_EVICTION',
    baseThroughputGbs: 19100,
    targetCompactionRatio: 6.0,
    queryHeads: 64,
    kvHeads: 8,
    evictionThresholdPct: 0.02,
    baseLatencyUs: 0.01,
    baseHeadLatencyMs: 0.03,
  },
  DELTA: {
    key: 'DELTA',
    id: 'GQA-CORRIDOR-DELTA (FALLBACK-FULL-ATTENTION-MATRIX)',
    shortTag: 'GQA-CORRIDOR-DELTA',
    mode: 'FULL_ATTENTION_FALLBACK',
    baseThroughputGbs: 9600,
    targetCompactionRatio: 1.0,
    queryHeads: 64,
    kvHeads: 64,
    evictionThresholdPct: 0.0,
    baseLatencyUs: 0.08,
    baseHeadLatencyMs: 0.14,
  },
};

/**
 * GridSync Zero-Trust Ingress Validation Schema
 * Rejects SQL injection vectors, script tags, currency symbols, and invalid tensor geometries.
 */
export const GridSyncIngressSchema = z.object({
  corridorKey: z.enum(['ALPHA', 'BRAVO', 'GAMMA', 'DELTA']),
  queryHeads: z.number().int().min(8).max(128).refine((val) => val % 8 === 0, {
    message: 'queryHeads must be a multiple of 8 for tensor core alignment',
  }),
  kvHeads: z.number().int().min(1).max(64),
  sequenceLength: z.number().int().min(512).max(131072),
  headDim: z.number().int().min(64).max(256),
  operatorCallsign: z
    .string()
    .min(2)
    .max(48)
    .refine(
      (str) =>
        !str.includes('<') &&
        !str.includes('>') &&
        !str.includes(';') &&
        !str.includes('--') &&
        !str.includes(String.fromCharCode(36)),
      {
        message: 'Zero-Trust Violation: Disallowed control or currency character detected',
      }
    ),
});

export type GridSyncIngressPayload = z.infer<typeof GridSyncIngressSchema>;

export function sanitizeGridSyncPayload(rawInput: unknown): GridSyncIngressPayload {
  return GridSyncIngressSchema.parse(rawInput);
}

/**
 * Computes Grouped-Query Attention head sharing factor G = h_q / h_kv
 */
export function computeGqaSharingFactor(queryHeads: number, kvHeads: number): number {
  if (!Number.isInteger(queryHeads) || !Number.isInteger(kvHeads) || queryHeads <= 0 || kvHeads <= 0) {
    throw new Error('Head counts must be positive integers');
  }
  if (queryHeads < kvHeads || queryHeads % kvHeads !== 0) {
    throw new Error('queryHeads must be evenly divisible by kvHeads');
  }
  return queryHeads / kvHeads;
}

/**
 * Computes exact Scaled Dot-Product Attention probabilities across compressed KV pool:
 * softmax((Q * K^T) / sqrt(d_k))
 */
export function computeScaledDotProductAttention(
  queryVector: number[],
  keyMatrix: number[][],
  headDim: number
): number[] {
  if (queryVector.length === 0 || keyMatrix.length === 0 || headDim <= 0) {
    throw new Error('Invalid tensor dimensions for scaled dot-product attention');
  }
  const scale = 1.0 / Math.sqrt(headDim);
  const logits: number[] = [];

  for (let r = 0; r < keyMatrix.length; r++) {
    const row = keyMatrix[r];
    if (row.length !== queryVector.length) {
      throw new Error('Dimension mismatch between queryVector and keyMatrix');
    }
    let dot = 0;
    for (let c = 0; c < queryVector.length; c++) {
      dot += queryVector[c] * row[c];
    }
    logits.push(dot * scale);
  }

  const maxLogit = Math.max(...logits);
  const expValues = logits.map((val) => Math.exp(val - maxLogit));
  const sumExp = expValues.reduce((acc, curr) => acc + curr, 0);
  return expValues.map((val) => val / sumExp);
}

export interface TemporalEvictionResult {
  retainedIndices: number[];
  retainedCount: number;
  evictedCount: number;
  compactionRatio: number;
  evictionRatePct: number;
}

/**
 * Evaluates KV Cache Temporal Eviction Pooling:
 * Score(i) = Importance(i) * exp(-lambda * Age(i))
 */
export function evaluateTemporalEvictionPool(
  importances: number[],
  ages: number[],
  decayLambda: number,
  keepRatio: number
): TemporalEvictionResult {
  if (importances.length !== ages.length) {
    throw new Error('Importance and age arrays must have equal length');
  }
  if (keepRatio < 0.05 || keepRatio > 1.0) {
    throw new Error('keepRatio must be between 0.05 and 1.0');
  }
  const total = importances.length;
  if (total === 0) {
    return {
      retainedIndices: [],
      retainedCount: 0,
      evictedCount: 0,
      compactionRatio: 1.0,
      evictionRatePct: 0.0,
    };
  }

  const scored = importances.map((imp, idx) => {
    const age = Math.max(0, ages[idx]);
    const weight = imp * Math.exp(-decayLambda * age);
    return { idx, weight };
  });

  scored.sort((a, b) => b.weight - a.weight);
  const targetRetained = Math.max(1, Math.ceil(total * keepRatio));
  const retainedIndices = scored
    .slice(0, targetRetained)
    .map((item) => item.idx)
    .sort((a, b) => a - b);

  const evictedCount = total - retainedIndices.length;
  const compactionRatio = Number((total / retainedIndices.length).toFixed(4));
  const evictionRatePct = Number(((evictedCount / total) * 100).toFixed(4));

  return {
    retainedIndices,
    retainedCount: retainedIndices.length,
    evictedCount,
    compactionRatio,
    evictionRatePct,
  };
}

export interface KvFootprintStats {
  rawBytes: number;
  compressedBytes: number;
  savedBytes: number;
  savedPct: number;
}

/**
 * Calculates uncompressed vs compressed KV cache memory footprint
 */
export function calculateKvCacheFootprint(
  batchSize: number,
  sequenceLength: number,
  numLayers: number,
  kvHeads: number,
  headDim: number,
  bytesPerElement: number,
  compactionRatio: number
): KvFootprintStats {
  if (
    batchSize <= 0 ||
    sequenceLength <= 0 ||
    numLayers <= 0 ||
    kvHeads <= 0 ||
    headDim <= 0 ||
    bytesPerElement <= 0 ||
    compactionRatio < 1.0
  ) {
    throw new Error('All KV cache parameters must be positive and compactionRatio >= 1.0');
  }
  const rawBytes = 2 * batchSize * sequenceLength * numLayers * kvHeads * headDim * bytesPerElement;
  const compressedBytes = Math.round(rawBytes / compactionRatio);
  const savedBytes = rawBytes - compressedBytes;
  const savedPct = Number(((savedBytes / rawBytes) * 100).toFixed(2));
  return {
    rawBytes,
    compressedBytes,
    savedBytes,
    savedPct,
  };
}

export interface GqaHeadNode {
  headIndex: number;
  headTitle: string;
  shortCode: string;
  hexPointer: string;
  ratioDisplay: string;
  gqaRatioDisplay: string;
  evictDisplay: string;
  latencyDisplay: string;
  stateDisplay: string;
  accuracyDisplay: string;
  locked: boolean;
  queryGroupIndices: number[];
  retainedTokens: number;
  evictedTokens: number;
  attentionEntropy: number;
}

export interface EngineStateSnapshot {
  corridorKey: CorridorKey;
  corridorId: string;
  mode: string;
  pointerHex: string;
  throughputGbs: number;
  throughputFormatted: string;
  throughputSaturationPct: number;
  attentionLatencyUs: number;
  attentionLatencyFormatted: string;
  compactionRatio: number;
  compactionRatioFormatted: string;
  activeHeadsCount: number;
  totalHeadsCount: number;
  processedTokens: number;
  processedTokensFormatted: string;
  engineXp: number;
  engineXpFormatted: string;
  gqaStateLabel: string;
  evictionSpikeActive: boolean;
  burstActive: boolean;
  stepCount: number;
  featureVector: [number, number, number, number];
  heads: GqaHeadNode[];
  kvFootprint: KvFootprintStats;
}

export function formatIntegerWithCommas(val: number): string {
  return Math.round(val).toLocaleString('en-US');
}

export function generateEngineSnapshot(
  corridorKey: CorridorKey,
  stepCount: number,
  evictionSpikeActive: boolean,
  burstActive: boolean,
  processedTokens: number,
  engineXp: number
): EngineStateSnapshot {
  const corridor = SYNTHETIC_GQA_CORRIDORS[corridorKey];
  const sharingRatio = computeGqaSharingFactor(corridor.queryHeads, corridor.kvHeads);

  let effectiveThroughput = corridor.baseThroughputGbs;
  let effectiveRatio = corridor.targetCompactionRatio;
  let effectiveLatencyUs = corridor.baseLatencyUs;
  let gqaStateLabel = 'Compressed Active';

  if (burstActive) {
    effectiveThroughput = Math.round(corridor.baseThroughputGbs * 1.12);
    effectiveRatio = Number((corridor.targetCompactionRatio * 1.25).toFixed(2));
  }

  if (evictionSpikeActive) {
    effectiveThroughput = Math.round(effectiveThroughput * 0.94);
    effectiveLatencyUs = 0.03;
    gqaStateLabel = 'Eviction Spike Active';
  }

  const saturationPct = Math.min(100, Math.max(15, Math.round((effectiveThroughput / 20000) * 100)));

  const heads: GqaHeadNode[] = [];
  for (let idx = 0; idx < 8; idx++) {
    const hexAddr = '0x' + (0x4000 + idx * 0x0100).toString(16).toUpperCase();
    const qStart = idx * sharingRatio;
    const queryGroupIndices: number[] = [];
    for (let q = 0; q < sharingRatio; q++) {
      queryGroupIndices.push(qStart + q);
    }

    const qVec: number[] = [];
    const kMat: number[][] = [[], [], [], []];
    for (let d = 0; d < 8; d++) {
      qVec.push(Math.sin(0.35 * (idx + 1) + 0.12 * d + 0.07 * stepCount));
      for (let r = 0; r < 4; r++) {
        kMat[r].push(Math.cos(0.25 * (idx + 1) + 0.09 * (d + r) + 0.05 * stepCount));
      }
    }
    const probs = computeScaledDotProductAttention(qVec, kMat, 128);
    const entropy = Number(
      (-probs.reduce((acc, p) => acc + p * Math.log(Math.max(p, 1e-12)), 0)).toFixed(4)
    );

    const isFaultedHead = evictionSpikeActive && (idx === 2 || idx === 5);
    const evictVal = isFaultedHead ? 0.08 : corridor.evictionThresholdPct;
    const latVal = isFaultedHead
      ? Number((corridor.baseHeadLatencyMs + 0.05).toFixed(2))
      : corridor.baseHeadLatencyMs;
    const locked = !isFaultedHead;
    const accuracyVal = isFaultedHead ? '99.4%' : '99.9%';

    const seqLen = 32768;
    const retainedTokens = Math.round(seqLen / Math.max(1, effectiveRatio));
    const evictedTokens = seqLen - retainedTokens;

    heads.push({
      headIndex: idx,
      headTitle: 'Head ' + String(idx) + ' (H' + String(idx) + ')',
      shortCode: 'H' + String(idx),
      hexPointer: hexAddr,
      ratioDisplay: effectiveRatio.toFixed(1) + 'x',
      gqaRatioDisplay: String(sharingRatio) + ':1',
      evictDisplay: evictVal.toFixed(2) + '%',
      latencyDisplay: latVal.toFixed(2) + 'ms',
      stateDisplay: locked ? 'COMPRESSED · LOCKED' : 'EVICTING · FAULT',
      accuracyDisplay: accuracyVal,
      locked,
      queryGroupIndices,
      retainedTokens,
      evictedTokens,
      attentionEntropy: entropy,
    });
  }

  const v0 = Number((1.71 + (stepCount === 0 ? 0 : 0.01 * Math.sin(stepCount))).toFixed(2));
  const v1 = Number((1.75 + (stepCount === 0 ? 0 : 0.01 * Math.cos(stepCount))).toFixed(2));
  const v2 = Number((1.72 + (stepCount === 0 ? 0 : 0.01 * Math.sin(stepCount + 1))).toFixed(2));
  const v3 = Number((1.74 + (stepCount === 0 ? 0 : 0.01 * Math.cos(stepCount + 1))).toFixed(2));

  const kvFootprint = calculateKvCacheFootprint(
    1,
    32768,
    32,
    corridor.kvHeads,
    128,
    2,
    Math.max(1.0, effectiveRatio)
  );

  const activeHeadsCount = heads.filter((h) => h.locked).length;
  const xpThousands = (engineXp / 1000).toFixed(1);

  return {
    corridorKey,
    corridorId: corridor.id,
    mode: corridor.mode,
    pointerHex: '0x3F8DC0',
    throughputGbs: effectiveThroughput,
    throughputFormatted: formatIntegerWithCommas(effectiveThroughput) + ' GB/s',
    throughputSaturationPct: saturationPct,
    attentionLatencyUs: effectiveLatencyUs,
    attentionLatencyFormatted: effectiveLatencyUs.toFixed(2) + ' µs',
    compactionRatio: effectiveRatio,
    compactionRatioFormatted: effectiveRatio.toFixed(2) + 'x',
    activeHeadsCount,
    totalHeadsCount: 8,
    processedTokens,
    processedTokensFormatted: formatIntegerWithCommas(processedTokens),
    engineXp,
    engineXpFormatted: '+' + xpThousands + 'k ENGINE XP',
    gqaStateLabel,
    evictionSpikeActive,
    burstActive,
    stepCount,
    featureVector: [v0, v1, v2, v3],
    heads,
    kvFootprint,
  };
}

export const SUPABASE_SQL_SCHEMA_EXPORT = [
  '-- GF-T3-255 PostgreSQL / Supabase Partitioned Schema with Strict RLS',
  'CREATE TABLE IF NOT EXISTS gqa_corridors (',
  '  corridor_code VARCHAR(16) PRIMARY KEY,',
  '  corridor_label VARCHAR(128) NOT NULL UNIQUE,',
  '  base_throughput_gbs NUMERIC(10, 2) NOT NULL,',
  '  target_compaction_ratio NUMERIC(6, 2) NOT NULL,',
  '  query_to_kv_ratio INTEGER NOT NULL,',
  '  tenant_org_id UUID NOT NULL',
  ');',
  '',
  'CREATE TABLE IF NOT EXISTS gqa_telemetry_epochs (',
  '  epoch_id UUID NOT NULL DEFAULT gen_random_uuid(),',
  '  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),',
  '  corridor_code VARCHAR(16) NOT NULL REFERENCES gqa_corridors(corridor_code),',
  '  tenant_org_id UUID NOT NULL,',
  '  compression_throughput_gbs NUMERIC(10, 2) NOT NULL,',
  '  attention_latency_us NUMERIC(8, 4) NOT NULL,',
  '  compaction_ratio NUMERIC(6, 2) NOT NULL,',
  '  active_heads INTEGER NOT NULL CHECK (active_heads BETWEEN 0 AND 8),',
  '  processed_tokens BIGINT NOT NULL,',
  '  PRIMARY KEY (epoch_id, recorded_at)',
  ') PARTITION BY RANGE (recorded_at);',
  '',
  'ALTER TABLE gqa_corridors ENABLE ROW LEVEL SECURITY;',
  'ALTER TABLE gqa_telemetry_epochs ENABLE ROW LEVEL SECURITY;',
  'CREATE POLICY rls_tenant_isolation ON gqa_telemetry_epochs',
  "  USING (tenant_org_id = current_setting('app.current_tenant_id', true)::UUID);",
].join('\n');
