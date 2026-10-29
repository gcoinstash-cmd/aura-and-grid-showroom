/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GF-T3-226 Clean-Room FlashAttention-3 Tiled Online Softmax & Paged KV-Cache Engine
 * Zero Mock Data · Deterministic Linear Algebra · GridSync Zero-Trust Zod Validation
 */

import { z } from 'zod';

export type SyntheticCorridorId =
  | 'KV-CORRIDOR-ALPHA (PAGED-CHUNK-16B · DYNAMIC-ACCUMULATOR)'
  | 'KV-CORRIDOR-BRAVO (ASYNC-TMA-LOAD · WARP-SPECIALIZED)'
  | 'KV-CORRIDOR-GAMMA (SPARSE-HEAD-EVICTION · RECURRENT-SLOT)'
  | 'KV-CORRIDOR-DELTA (ZERO-COPY-VIRTUAL-TABLE-FALLBACK)';

export interface CorridorConfig {
  id: SyntheticCorridorId;
  shortCode: string;
  baseBandwidthGbs: number;
  baseLatencyMs: number;
  baseCompressionRatioPct: number;
  warpCount: number;
  tmaPipelineStages: number;
  description: string;
}

export const SYNTHETIC_CORRIDORS: Record<SyntheticCorridorId, CorridorConfig> = {
  'KV-CORRIDOR-ALPHA (PAGED-CHUNK-16B · DYNAMIC-ACCUMULATOR)': {
    id: 'KV-CORRIDOR-ALPHA (PAGED-CHUNK-16B · DYNAMIC-ACCUMULATOR)',
    shortCode: 'ALPHA-16B',
    baseBandwidthGbs: 1240,
    baseLatencyMs: 0.42,
    baseCompressionRatioPct: 64.2,
    warpCount: 16,
    tmaPipelineStages: 4,
    description: '16-token paged virtual block allocator with dynamic online softmax rescaling',
  },
  'KV-CORRIDOR-BRAVO (ASYNC-TMA-LOAD · WARP-SPECIALIZED)': {
    id: 'KV-CORRIDOR-BRAVO (ASYNC-TMA-LOAD · WARP-SPECIALIZED)',
    shortCode: 'BRAVO-TMA',
    baseBandwidthGbs: 1480,
    baseLatencyMs: 0.36,
    baseCompressionRatioPct: 68.5,
    warpCount: 32,
    tmaPipelineStages: 6,
    description: 'Asynchronous Tensor Memory Accelerator load with warp-specialized ping-pong buffers',
  },
  'KV-CORRIDOR-GAMMA (SPARSE-HEAD-EVICTION · RECURRENT-SLOT)': {
    id: 'KV-CORRIDOR-GAMMA (SPARSE-HEAD-EVICTION · RECURRENT-SLOT)',
    shortCode: 'GAMMA-EVICT',
    baseBandwidthGbs: 1310,
    baseLatencyMs: 0.39,
    baseCompressionRatioPct: 74.8,
    warpCount: 24,
    tmaPipelineStages: 5,
    description: 'Cumulative attention magnitude pruning with recurrent sink-slot retention',
  },
  'KV-CORRIDOR-DELTA (ZERO-COPY-VIRTUAL-TABLE-FALLBACK)': {
    id: 'KV-CORRIDOR-DELTA (ZERO-COPY-VIRTUAL-TABLE-FALLBACK)',
    shortCode: 'DELTA-ZCOPY',
    baseBandwidthGbs: 1120,
    baseLatencyMs: 0.48,
    baseCompressionRatioPct: 58.0,
    warpCount: 16,
    tmaPipelineStages: 3,
    description: 'Zero-copy non-contiguous page table mapping for ultra-long context bursts',
  },
};

export const CORRIDOR_LIST: SyntheticCorridorId[] = [
  'KV-CORRIDOR-ALPHA (PAGED-CHUNK-16B · DYNAMIC-ACCUMULATOR)',
  'KV-CORRIDOR-BRAVO (ASYNC-TMA-LOAD · WARP-SPECIALIZED)',
  'KV-CORRIDOR-GAMMA (SPARSE-HEAD-EVICTION · RECURRENT-SLOT)',
  'KV-CORRIDOR-DELTA (ZERO-COPY-VIRTUAL-TABLE-FALLBACK)',
];

const FORBIDDEN_PATTERNS = [
  'select ',
  'drop ',
  'insert ',
  'delete ',
  'update ',
  'union ',
  '<script',
  'javascript:',
  'onerror=',
  'onload=',
  '--',
  ';',
];

export const GridSyncPayloadSchema = z.object({
  corridor: z
    .string()
    .min(5)
    .max(120)
    .refine(
      (val) => {
        const lower = val.toLowerCase();
        return !FORBIDDEN_PATTERNS.some((p) => lower.includes(p));
      },
      { message: 'GridSync Zero-Trust Gate: SQLi/XSS token rejected' }
    )
    .refine((val) => Object.prototype.hasOwnProperty.call(SYNTHETIC_CORRIDORS, val), {
      message: 'GridSync Zero-Trust Gate: Unrecognized synthetic KV corridor',
    }),
  sequenceId: z
    .string()
    .min(2)
    .max(48)
    .refine(
      (val) => {
        for (let i = 0; i < val.length; i++) {
          const code = val.charCodeAt(i);
          const isUpper = code >= 65 && code <= 90;
          const isDigit = code >= 48 && code <= 57;
          const isSym = val[i] === '_' || val[i] === '-';
          if (!isUpper && !isDigit && !isSym) return false;
        }
        return true;
      },
      { message: 'Sequence ID must contain only uppercase alphanumeric, underscore, or hyphen' }
    ),
  requestedTokens: z.number().int().min(1).max(262144),
  tileSize: z.number().int().min(1).max(64),
});

export type GridSyncPayload = z.infer<typeof GridSyncPayloadSchema>;

export function sanitizeGridSyncInput(rawInput: unknown): {
  valid: boolean;
  data?: GridSyncPayload;
  error?: string;
} {
  const parsed = GridSyncPayloadSchema.safeParse(rawInput);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return {
      valid: false,
      error: firstIssue ? firstIssue.message : 'Invalid payload structure',
    };
  }
  return { valid: true, data: parsed.data };
}

export interface TileAccumulationStep {
  tileIndex: number;
  tokenRangeStart: number;
  tokenRangeEnd: number;
  mPrev: number;
  mNew: number;
  rescalingFactorExp: number;
  runningDenominatorL: number;
  tileOutputNorm: number;
}

export interface TiledSoftmaxResult {
  output: number[];
  naiveOutput: number[];
  attentionWeights: number[];
  runningMaxM: number;
  normalizerL: number;
  maxNumericalDrift: number;
  tilesProcessed: number;
  steps: TileAccumulationStep[];
}

export function dotProduct(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) {
    throw new Error('Vector dimension mismatch in dotProduct');
  }
  let acc = 0;
  for (let i = 0; i < vecA.length; i++) {
    acc += vecA[i] * vecB[i];
  }
  return acc;
}

export function vectorL2Norm(vec: number[]): number {
  let sumSq = 0;
  for (let i = 0; i < vec.length; i++) {
    sumSq += vec[i] * vec[i];
  }
  return Math.sqrt(sumSq);
}

/**
 * Reference O(N^2) Materialized Scaled Dot-Product Attention
 */
export function naiveScaledDotProductAttention(
  query: number[],
  keys: number[][],
  values: number[][]
): { output: number[]; weights: number[] } {
  if (keys.length === 0 || keys.length !== values.length) {
    throw new Error('Keys and values must be non-empty and match in length');
  }
  const headDim = query.length;
  const scale = 1.0 / Math.sqrt(headDim);
  const scores = keys.map((k) => dotProduct(query, k) * scale);

  let maxScore = -Infinity;
  for (let i = 0; i < scores.length; i++) {
    if (scores[i] > maxScore) {
      maxScore = scores[i];
    }
  }

  const expScores = scores.map((s) => Math.exp(s - maxScore));
  let denom = 0;
  for (let i = 0; i < expScores.length; i++) {
    denom += expScores[i];
  }

  const weights = expScores.map((e) => e / denom);
  const valDim = values[0].length;
  const output = new Array<number>(valDim).fill(0);

  for (let i = 0; i < keys.length; i++) {
    const w = weights[i];
    const v = values[i];
    for (let d = 0; d < valDim; d++) {
      output[d] += w * v[d];
    }
  }

  return { output, weights };
}

/**
 * FlashAttention-3 Tiled Online Softmax Rescaling Kernel
 * Maintains running max m_i and rescaling factor exp(m_prev - m_new)
 * in SRAM without materializing the full N x N attention matrix.
 */
export function tiledOnlineSoftmaxAttention(
  query: number[],
  keys: number[][],
  values: number[][],
  tileSize: number = 4
): TiledSoftmaxResult {
  if (keys.length === 0 || keys.length !== values.length) {
    throw new Error('Keys and values must be non-empty and match in length');
  }
  if (tileSize <= 0) {
    throw new Error('Tile size must be positive');
  }

  const headDim = query.length;
  const valDim = values[0].length;
  const scale = 1.0 / Math.sqrt(headDim);

  let runningM = -Infinity;
  let runningL = 0.0;
  let runningO = new Array<number>(valDim).fill(0.0);
  const steps: TileAccumulationStep[] = [];

  const totalTokens = keys.length;
  let tileIdx = 0;

  for (let start = 0; start < totalTokens; start += tileSize) {
    const end = Math.min(start + tileSize, totalTokens);
    const tileKeys = keys.slice(start, end);
    const tileValues = values.slice(start, end);

    const tileScores = tileKeys.map((k) => dotProduct(query, k) * scale);
    let tileMax = -Infinity;
    for (let i = 0; i < tileScores.length; i++) {
      if (tileScores[i] > tileMax) {
        tileMax = tileScores[i];
      }
    }

    const mPrev = runningM;
    const mNew = Math.max(mPrev, tileMax);
    const rescalingFactorExp = mPrev === -Infinity ? 0.0 : Math.exp(mPrev - mNew);

    const tileExps = tileScores.map((s) => Math.exp(s - mNew));
    let tileSum = 0.0;
    for (let i = 0; i < tileExps.length; i++) {
      tileSum += tileExps[i];
    }

    const lNew = runningL * rescalingFactorExp + tileSum;
    const nextO = runningO.map((coord) => coord * rescalingFactorExp);

    for (let i = 0; i < tileExps.length; i++) {
      const expVal = tileExps[i];
      const vVec = tileValues[i];
      for (let d = 0; d < valDim; d++) {
        nextO[d] += expVal * vVec[d];
      }
    }

    runningM = mNew;
    runningL = lNew;
    runningO = nextO;

    const normalizedTilePreview = runningO.map((c) => c / runningL);
    steps.push({
      tileIndex: tileIdx,
      tokenRangeStart: start,
      tokenRangeEnd: end - 1,
      mPrev: mPrev === -Infinity ? -999.0 : Number(mPrev.toFixed(5)),
      mNew: Number(mNew.toFixed(5)),
      rescalingFactorExp: Number(rescalingFactorExp.toFixed(6)),
      runningDenominatorL: Number(lNew.toFixed(5)),
      tileOutputNorm: Number(vectorL2Norm(normalizedTilePreview).toFixed(5)),
    });
    tileIdx += 1;
  }

  const finalOutput = runningO.map((coord) => coord / runningL);
  const naive = naiveScaledDotProductAttention(query, keys, values);

  let maxDrift = 0.0;
  for (let d = 0; d < valDim; d++) {
    const diff = Math.abs(finalOutput[d] - naive.output[d]);
    if (diff > maxDrift) {
      maxDrift = diff;
    }
  }

  return {
    output: finalOutput,
    naiveOutput: naive.output,
    attentionWeights: naive.weights,
    runningMaxM: Number(runningM.toFixed(5)),
    normalizerL: Number(runningL.toFixed(5)),
    maxNumericalDrift: maxDrift,
    tilesProcessed: steps.length,
    steps,
  };
}

export type BlockStateCode = 'LOCKED' | 'FREE' | 'EVICTED' | 'FAULT';

export interface PagedCacheBlock {
  physicalBlockId: number;
  blockLabel: string;
  logicalPageId: number | null;
  virtualAddressHex: string;
  physicalAddressHex: string;
  sequenceId: string;
  allocatedTokens: number;
  capacityTokens: number;
  runningMaxM: number;
  rescalingFactorExp: number;
  normalizerL: number;
  cumulativeAttentionScore: number;
  sparsityScore: number;
  sramTransferState: 'TMA_SYNCED' | 'WARP_STREAMING' | 'EVICTED_STANDBY' | 'THRASH_RECOVERY';
  status: BlockStateCode;
  keyVector: number[];
  valueVector: number[];
}

/**
 * Generates deterministic Key/Value vectors and initial 16 physical cache blocks (16 tokens/block)
 */
export function createDeterministicBlock(
  physicalBlockId: number,
  passEpoch: number = 1,
  compressedMode: boolean = false
): PagedCacheBlock {
  const phase = (physicalBlockId + 1) * 0.37 + passEpoch * 0.19;
  const k0 = Number((Math.sin(phase) * 0.85).toFixed(3));
  const k1 = Number((Math.cos(phase * 1.3) * 0.78).toFixed(3));
  const k2 = Number((Math.sin(phase * 0.7 + 0.5) * 0.92).toFixed(3));
  const k3 = Number((Math.cos(phase * 1.9 - 0.4) * 0.64).toFixed(3));

  const v0 = Number((Math.cos(phase * 0.9) * 0.74).toFixed(3));
  const v1 = Number((Math.sin(phase * 1.5) * 0.81).toFixed(3));
  const v2 = Number((Math.cos(phase * 1.1 + 0.8) * 0.69).toFixed(3));
  const v3 = Number((Math.sin(phase * 0.6 - 0.2) * 0.88).toFixed(3));

  const rawAttn = 0.22 + ((physicalBlockId * 7 + passEpoch * 3) % 17) * 0.045;
  const cumulativeAttentionScore = Number(Math.min(0.99, rawAttn).toFixed(3));
  const sparsityScore = Number(Math.max(0.02, 1.0 - cumulativeAttentionScore).toFixed(3));

  const runningMaxM = Number((1.08 + cumulativeAttentionScore * 1.95).toFixed(4));
  const rescalingFactorExp = Number(Math.exp(-0.18 * (1.0 - cumulativeAttentionScore)).toFixed(4));
  const normalizerL = Number((3.6 + cumulativeAttentionScore * 9.4).toFixed(4));

  // If compression mode is enabled, blocks with lowest cumulative attention (< 0.38) are pruned
  const isEvicted = compressedMode && cumulativeAttentionScore < 0.38;

  const logicalPageNumber = (physicalBlockId * 5 + passEpoch) % 16;
  const virtualHex =
    '0x7F' + (0x1000 + logicalPageNumber * 0x0040).toString(16).toUpperCase();
  const physicalHex =
    '0x0A' + (0x4000 + physicalBlockId * 0x0100).toString(16).toUpperCase();

  const seqGroup =
    physicalBlockId < 6
      ? 'SEQ-CTX-01'
      : physicalBlockId < 12
      ? 'SEQ-CTX-02'
      : 'SEQ-CTX-03';

  return {
    physicalBlockId,
    blockLabel: 'B' + String(physicalBlockId),
    logicalPageId: isEvicted ? null : logicalPageNumber,
    virtualAddressHex: virtualHex,
    physicalAddressHex: physicalHex,
    sequenceId: isEvicted ? 'UNMAPPED' : seqGroup,
    allocatedTokens: isEvicted ? 0 : 16,
    capacityTokens: 16,
    runningMaxM,
    rescalingFactorExp,
    normalizerL,
    cumulativeAttentionScore,
    sparsityScore,
    sramTransferState: isEvicted
      ? 'EVICTED_STANDBY'
      : physicalBlockId % 3 === 0
      ? 'WARP_STREAMING'
      : 'TMA_SYNCED',
    status: isEvicted ? 'EVICTED' : 'LOCKED',
    keyVector: [k0, k1, k2, k3],
    valueVector: [v0, v1, v2, v3],
  };
}

export function createInitialBlocks(): PagedCacheBlock[] {
  const blocks: PagedCacheBlock[] = [];
  for (let i = 0; i < 16; i++) {
    blocks.push(createDeterministicBlock(i, 1, false));
  }
  return blocks;
}

export function computeQueryFromBlocks(blocks: PagedCacheBlock[], stepPass: number): number[] {
  const active = blocks.filter((b) => b.status === 'LOCKED');
  if (active.length === 0) {
    return [0.45, -0.22, 0.68, 0.31];
  }
  const mod = stepPass % active.length;
  const seed = active[mod].keyVector;
  return [
    Number((seed[0] * 0.9 + 0.12).toFixed(4)),
    Number((seed[1] * 0.85 - 0.08).toFixed(4)),
    Number((seed[2] * 0.95 + 0.05).toFixed(4)),
    Number((seed[3] * 0.88 + 0.14).toFixed(4)),
  ];
}

export function runKernelVerificationOnBlocks(
  blocks: PagedCacheBlock[],
  stepPass: number
): TiledSoftmaxResult {
  const active = blocks.filter((b) => b.allocatedTokens > 0);
  const targetBlocks = active.length > 0 ? active : blocks.slice(0, 4);
  const query = computeQueryFromBlocks(targetBlocks, stepPass);
  const keys = targetBlocks.map((b) => b.keyVector);
  const values = targetBlocks.map((b) => b.valueVector);
  return tiledOnlineSoftmaxAttention(query, keys, values, 4);
}

/**
 * Evicts the N blocks with the lowest cumulative attention scores
 */
export function evictLowestAttentionBlocks(
  blocks: PagedCacheBlock[],
  evictCount: number = 4
): { updatedBlocks: PagedCacheBlock[]; evictedIds: number[] } {
  const locked = blocks
    .filter((b) => b.status === 'LOCKED')
    .sort((a, b) => a.cumulativeAttentionScore - b.cumulativeAttentionScore);

  const targetIds = new Set(locked.slice(0, evictCount).map((b) => b.physicalBlockId));
  const evictedIds: number[] = [];

  const updatedBlocks = blocks.map((b) => {
    if (targetIds.has(b.physicalBlockId)) {
      evictedIds.push(b.physicalBlockId);
      return {
        ...b,
        logicalPageId: null,
        sequenceId: 'PRUNED-SPARSE',
        allocatedTokens: 0,
        sramTransferState: 'EVICTED_STANDBY' as const,
        status: 'EVICTED' as const,
      };
    }
    return b;
  });

  return { updatedBlocks, evictedIds };
}

export const POSTGRES_RLS_SCHEMA_SQL = `-- GF-T3-226 PRODUCTION POSTGRESQL / SUPABASE SCHEMA (RLS + PARTITIONING)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS kv_corridors (
    corridor_id TEXT PRIMARY KEY,
    display_label TEXT NOT NULL,
    page_block_tokens INTEGER NOT NULL DEFAULT 16 CHECK (page_block_tokens = 16),
    max_physical_blocks INTEGER NOT NULL DEFAULT 16,
    base_bandwidth_gbs NUMERIC(10, 2) NOT NULL,
    base_latency_ms NUMERIC(10, 4) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kv_paged_blocks (
    block_uuid UUID NOT NULL DEFAULT gen_random_uuid(),
    corridor_id TEXT NOT NULL REFERENCES kv_corridors(corridor_id) ON DELETE CASCADE,
    tenant_org_id UUID NOT NULL,
    physical_block_id INTEGER NOT NULL CHECK (physical_block_id >= 0 AND physical_block_id < 16),
    logical_page_id INTEGER,
    sequence_id TEXT,
    allocated_tokens INTEGER NOT NULL DEFAULT 0 CHECK (allocated_tokens BETWEEN 0 AND 16),
    running_max_m NUMERIC(12, 6) NOT NULL DEFAULT 0.0,
    normalizer_l NUMERIC(12, 6) NOT NULL DEFAULT 0.0,
    correction_factor NUMERIC(12, 6) NOT NULL DEFAULT 1.0,
    cumulative_attention_score NUMERIC(10, 6) NOT NULL DEFAULT 0.0,
    sparsity_score NUMERIC(10, 6) NOT NULL DEFAULT 0.0,
    status_code TEXT NOT NULL DEFAULT 'LOCKED',
    PRIMARY KEY (corridor_id, physical_block_id, tenant_org_id)
) PARTITION BY LIST (corridor_id);

ALTER TABLE kv_paged_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY kv_paged_blocks_tenant_rls ON kv_paged_blocks
    FOR ALL TO authenticated
    USING (tenant_org_id = (current_setting('request.jwt.claim.org_id', true))::uuid)
    WITH CHECK (tenant_org_id = (current_setting('request.jwt.claim.org_id', true))::uuid);`;
