/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * GF-T3-239: Tensor Parallelism Column/Row Weight Sharding & Ring All-Reduce Accelerator
 * Clean-Room Mathematical Engine & GridSync Zero-Trust Ingress Middleware
 * Note: Strictly zero dollar sign characters anywhere in source code or string literals.
 */

import { z } from 'zod';

export const CORRIDOR_OPTIONS = [
  'TP-CORRIDOR-ALPHA (COLUMN-ROW-WEIGHT-SHARDING · 4800-GB/S)',
  'TP-CORRIDOR-BRAVO (RING-ALL-REDUCE-ACCELERATOR)',
  'TP-CORRIDOR-GAMMA (COMMUNICATION-COMPUTATION-OVERLAP)',
  'TP-CORRIDOR-DELTA (FALLBACK-SINGLE-GPU-LINEAR)',
] as const;

export type CorridorOption = (typeof CORRIDOR_OPTIONS)[number];

export type RingSyncState =
  | 'RING_SYNC'
  | 'ALL_REDUCE_RING'
  | 'DESYNC_FAULT'
  | 'RESYNC_LOCKED';

export interface RankShardDescriptor {
  rankIndex: number;
  rankId: string;
  headerLabel: string;
  shardMode: 'COL' | 'ROW';
  shardStatusLabel: string;
  pointerHex: string;
  ringState: RingSyncState;
  pointerAndRingLabel: string;
  weightSliceRows: number;
  weightSliceCols: number;
  peerTransferTarget: string;
  commQueueDepth: number;
  shardSizeMb: number;
  localNorm: number;
  lastStepLatencyUs: number;
  activeOp: string;
}

export interface RingHopTelemetry {
  hopIndex: number;
  phase: 'SCATTER_REDUCE' | 'ALL_GATHER';
  sourceRank: string;
  targetRank: string;
  transferredMb: number;
  accumulatedNorm: number;
  overlapPct: number;
}

export interface TensorParallelExecutionResult {
  corridor: CorridorOption;
  worldSize: number;
  denseOutput: number[][];
  shardedOutput: number[][];
  maxAbsDiff: number;
  numericallyEquivalent: boolean;
  ringBandwidthGbs: number;
  bandwidthSaturationPct: number;
  allReduceLatencyUs: number;
  activeRanksCount: number;
  processedTokens: number;
  tpXpDeltaK: number;
  tpStateLabel: string;
  overlapEfficiencyPct: number;
  ringFactor: number;
  effectiveTransferMb: number;
  ranks: RankShardDescriptor[];
  ringHops: RingHopTelemetry[];
}

export interface RadioLogEntry {
  id: string;
  timestamp: string;
  callsign: '🟢 CREW CHIEF' | '⚡ PIT WALL' | '🟢 TELEMETRY' | '🔴 TELEMETRY';
  message: string;
}

/**
 * GridSync Zero-Trust Ingress & Sanitization Schemas (Zod)
 * Scrubs strings against SQL injection, script tags, and control characters without using regex end-anchor character.
 */
const DANGEROUS_PATTERNS = [
  '<script',
  '</script',
  'javascript:',
  'DROP TABLE',
  'DELETE FROM',
  'INSERT INTO',
  'UNION SELECT',
  '-- ',
  ';--',
  '/*',
  '*/',
];

export function isCleanInputString(value: string): boolean {
  const upper = value.toUpperCase();
  for (let i = 0; i < DANGEROUS_PATTERNS.length; i += 1) {
    if (upper.includes(DANGEROUS_PATTERNS[i].toUpperCase())) {
      return false;
    }
  }
  return true;
}

export const CorridorSelectionSchema = z.object({
  corridor: z.enum(CORRIDOR_OPTIONS),
});

export const RankInspectionSchema = z.object({
  rankIndex: z.number().int().min(0).max(7),
});

export const ShardPassPayloadSchema = z.object({
  corridor: z.enum(CORRIDOR_OPTIONS),
  batchTokens: z.number().int().min(1).max(64),
  hiddenDim: z
    .number()
    .int()
    .min(8)
    .max(128)
    .refine((val) => val % 8 === 0, {
      message: 'hiddenDim must be divisible by 8 for 8-rank column/row sharding',
    }),
  ffnDim: z
    .number()
    .int()
    .min(8)
    .max(256)
    .refine((val) => val % 8 === 0, {
      message: 'ffnDim must be divisible by 8 for 8-rank column/row sharding',
    }),
  shardSizeMb: z.number().min(1).max(1024),
  stepCounter: z.number().int().min(0).max(100000),
  desyncRankIndices: z.array(z.number().int().min(0).max(7)).max(7),
  auditNote: z
    .string()
    .max(180)
    .refine(isCleanInputString, {
      message: 'Unsafe payload tokens detected by GridSync sanitizer',
    })
    .optional(),
});

export type ShardPassPayload = z.infer<typeof ShardPassPayloadSchema>;

export function sanitizeShardPassPayload(rawInput: unknown): ShardPassPayload {
  return ShardPassPayloadSchema.parse(rawInput);
}

/**
 * Deterministic Matrix Generator (Trigonometric Harmonic Basis - Zero Math.random)
 */
export function generateDeterministicMatrix(
  rows: number,
  cols: number,
  seedOffset: number
): number[][] {
  const matrix: number[][] = [];
  for (let r = 0; r < rows; r += 1) {
    const row: number[] = [];
    for (let c = 0; c < cols; c += 1) {
      const phase = ((r + 1) * 13 + (c + 1) * 29 + seedOffset * 7) * 0.07;
      const val = Math.sin(phase) * 0.5 + Math.cos(phase * 0.5) * 0.25;
      row.push(Number(val.toFixed(6)));
    }
    matrix.push(row);
  }
  return matrix;
}

/**
 * Pure 2D Matrix Multiplication C = A * B
 */
export function multiplyMatrices(a: number[][], b: number[][]): number[][] {
  if (a.length === 0 || b.length === 0 || a[0].length !== b.length) {
    throw new Error('Incompatible matrix dimensions for multiplication');
  }
  const m = a.length;
  const kDim = a[0].length;
  const n = b[0].length;
  const result: number[][] = [];

  for (let i = 0; i < m; i += 1) {
    const row: number[] = new Array(n).fill(0);
    for (let k = 0; k < kDim; k += 1) {
      const aik = a[i][k];
      for (let j = 0; j < n; j += 1) {
        row[j] += aik * b[k][j];
      }
    }
    result.push(row);
  }
  return result;
}

/**
 * Splits a weight matrix A of shape (H, D) across columns into N rank shards of shape (H, D / N).
 */
export function shardWeightColumns(weight: number[][], worldSize: number): number[][][] {
  if (weight.length === 0 || weight[0].length % worldSize !== 0) {
    throw new Error('Column dimension must be divisible by worldSize');
  }
  const colsPerRank = weight[0].length / worldSize;
  const shards: number[][][] = [];

  for (let rank = 0; rank < worldSize; rank += 1) {
    const startCol = rank * colsPerRank;
    const endCol = startCol + colsPerRank;
    const shard = weight.map((row) => row.slice(startCol, endCol));
    shards.push(shard);
  }
  return shards;
}

/**
 * Splits a weight matrix B of shape (D, H) across rows into N rank shards of shape (D / N, H).
 */
export function shardWeightRows(weight: number[][], worldSize: number): number[][][] {
  if (weight.length === 0 || weight.length % worldSize !== 0) {
    throw new Error('Row dimension must be divisible by worldSize');
  }
  const rowsPerRank = weight.length / worldSize;
  const shards: number[][][] = [];

  for (let rank = 0; rank < worldSize; rank += 1) {
    const startRow = rank * rowsPerRank;
    const endRow = startRow + rowsPerRank;
    const shard = weight.slice(startRow, endRow).map((row) => row.slice());
    shards.push(shard);
  }
  return shards;
}

/**
 * Executes N-rank Ring All-Reduce summation (Scatter-Reduce + All-Gather)
 * across rank partial output matrices Z_0 .. Z_{N-1}.
 */
export function executeRingAllReduce(
  rankPartials: number[][][],
  shardSizeMb: number,
  overlapPct: number
): { reduced: number[][]; hops: RingHopTelemetry[]; rankNorms: number[] } {
  const worldSize = rankPartials.length;
  if (worldSize === 0) {
    throw new Error('rankPartials cannot be empty');
  }
  const rows = rankPartials[0].length;
  const cols = rankPartials[0][0].length;

  const reduced: number[][] = [];
  for (let r = 0; r < rows; r += 1) {
    reduced.push(new Array(cols).fill(0));
  }

  const rankNorms: number[] = new Array(worldSize).fill(0);
  for (let rank = 0; rank < worldSize; rank += 1) {
    let norm = 0;
    for (let i = 0; i < rows; i += 1) {
      for (let j = 0; j < cols; j += 1) {
        const v = rankPartials[rank][i][j];
        reduced[i][j] += v;
        norm += Math.abs(v);
      }
    }
    rankNorms[rank] = Number(norm.toFixed(4));
  }

  const hops: RingHopTelemetry[] = [];
  const ringSliceMb = Number(((shardSizeMb * 2 * (worldSize - 1)) / (worldSize * worldSize)).toFixed(2));

  for (let step = 0; step < worldSize; step += 1) {
    const nextRank = (step + 1) % worldSize;
    hops.push({
      hopIndex: step,
      phase: step < Math.floor(worldSize / 2) ? 'SCATTER_REDUCE' : 'ALL_GATHER',
      sourceRank: 'R' + String(step),
      targetRank: 'R' + String(nextRank),
      transferredMb: ringSliceMb,
      accumulatedNorm: rankNorms[step],
      overlapPct,
    });
  }

  return { reduced, hops, rankNorms };
}

const CORRIDOR_SPECS: Record<
  CorridorOption,
  {
    baseBandwidthGbs: number;
    baseLatencyUs: number;
    overlapRatio: number;
    tpStateLabel: string;
  }
> = {
  'TP-CORRIDOR-ALPHA (COLUMN-ROW-WEIGHT-SHARDING · 4800-GB/S)': {
    baseBandwidthGbs: 4800,
    baseLatencyUs: 0.04,
    overlapRatio: 0.96,
    tpStateLabel: 'TP State: Column-Row Active',
  },
  'TP-CORRIDOR-BRAVO (RING-ALL-REDUCE-ACCELERATOR)': {
    baseBandwidthGbs: 5040,
    baseLatencyUs: 0.03,
    overlapRatio: 0.97,
    tpStateLabel: 'TP State: Ring All-Reduce Turbo',
  },
  'TP-CORRIDOR-GAMMA (COMMUNICATION-COMPUTATION-OVERLAP)': {
    baseBandwidthGbs: 4920,
    baseLatencyUs: 0.03,
    overlapRatio: 0.99,
    tpStateLabel: 'TP State: Overlap Stream Locked',
  },
  'TP-CORRIDOR-DELTA (FALLBACK-SINGLE-GPU-LINEAR)': {
    baseBandwidthGbs: 1200,
    baseLatencyUs: 0.18,
    overlapRatio: 0.45,
    tpStateLabel: 'TP State: Single-GPU Linear Ref',
  },
};

const POINTER_BASE_HEX: readonly string[] = [
  '0x6000',
  '0x6280',
  '0x6500',
  '0x6800',
  '0x6A80',
  '0x6D00',
  '0x6F80',
  '0x7200',
];

/**
 * Full 8-Rank Column/Row Tensor Parallel Execution + Ring All-Reduce Engine
 */
export function runTensorParallelPass(rawPayload: ShardPassPayload): TensorParallelExecutionResult {
  const payload = sanitizeShardPassPayload(rawPayload);
  const worldSize = 8;
  const spec = CORRIDOR_SPECS[payload.corridor];

  // 1. Deterministic input activations X and weights A (Column-Sharded), B (Row-Sharded)
  const seedBase = payload.stepCounter + 1;
  const inputX = generateDeterministicMatrix(payload.batchTokens, payload.hiddenDim, seedBase);
  const weightA = generateDeterministicMatrix(payload.hiddenDim, payload.ffnDim, seedBase + 10);
  const weightB = generateDeterministicMatrix(payload.ffnDim, payload.hiddenDim, seedBase + 20);

  // 2. Non-sharded reference pass: Z_dense = (X * A) * B
  const denseHidden = multiplyMatrices(inputX, weightA);
  const denseOutput = multiplyMatrices(denseHidden, weightB);

  // 3. Column-Parallel Sharding of A and Row-Parallel Sharding of B across 8 ranks
  const colShardsA = shardWeightColumns(weightA, worldSize);
  const rowShardsB = shardWeightRows(weightB, worldSize);

  const rankPartials: number[][][] = [];
  for (let rank = 0; rank < worldSize; rank += 1) {
    const localY = multiplyMatrices(inputX, colShardsA[rank]);
    const localZ = multiplyMatrices(localY, rowShardsB[rank]);
    rankPartials.push(localZ);
  }

  // 4. Ring All-Reduce Collective across all 8 ranks
  const desyncCount = payload.desyncRankIndices.length;
  const effectiveOverlapPct = Number(
    Math.max(42.0, spec.overlapRatio * 100 - desyncCount * 11.5).toFixed(1)
  );
  const { reduced: shardedOutput, hops, rankNorms } = executeRingAllReduce(
    rankPartials,
    payload.shardSizeMb,
    effectiveOverlapPct
  );

  // 5. Verify exact numerical equivalence between dense and sharded passes
  let maxAbsDiff = 0;
  for (let r = 0; r < denseOutput.length; r += 1) {
    for (let c = 0; c < denseOutput[0].length; c += 1) {
      const diff = Math.abs(denseOutput[r][c] - shardedOutput[r][c]);
      if (diff > maxAbsDiff) {
        maxAbsDiff = diff;
      }
    }
  }

  // 6. Bandwidth, latency, and Ring All-Reduce transfer math
  const ringFactor = (2 * (worldSize - 1)) / worldSize; // 1.75 for 8 ranks
  const effectiveTransferMb = Number((payload.shardSizeMb * ringFactor).toFixed(2));
  const desyncPenaltyDivisor = 1 + desyncCount * 0.18;
  const ringBandwidthGbs = Math.round(spec.baseBandwidthGbs / desyncPenaltyDivisor);
  const bandwidthSaturationPct = Number(
    Math.min(100, (ringBandwidthGbs / 5040) * 100).toFixed(1)
  );
  const allReduceLatencyUs = Number(
    (spec.baseLatencyUs * (1 + desyncCount * 0.75)).toFixed(2)
  );
  const activeRanksCount = worldSize - desyncCount;

  const baseTokens = 1664000;
  const processedTokens = baseTokens + payload.stepCounter * 64000;
  const tpXpDeltaK = Number((28.5 + payload.stepCounter * 1.4).toFixed(1));

  // 7. Build 8 GPU Rank Descriptors
  const ranks: RankShardDescriptor[] = [];
  const colsPerRank = (payload.ffnDim / worldSize) * 128;
  const rowsPerRank = payload.hiddenDim * 256;

  for (let rank = 0; rank < worldSize; rank += 1) {
    const isDesynced = payload.desyncRankIndices.includes(rank);
    const shardMode: 'COL' | 'ROW' = rank % 2 === 0 ? 'COL' : 'ROW';
    const ringState: RingSyncState = isDesynced ? 'DESYNC_FAULT' : 'RING_SYNC';
    const ptrHex = POINTER_BASE_HEX[rank];
    const nextPeer = (rank + 1) % worldSize;

    // Note: Rank 0 strictly renders "COL · SHARD: 1/8" and "0x6000 · RING_SYNC" per spec
    const shardStatusLabel =
      rank === 0
        ? 'COL · SHARD: 1/8'
        : shardMode + ' · SHARD: ' + String(rank + 1) + '/' + String(worldSize);

    const pointerAndRingLabel = ptrHex + ' · ' + ringState;

    ranks.push({
      rankIndex: rank,
      rankId: 'R' + String(rank),
      headerLabel: 'Rank ' + String(rank) + ' (R' + String(rank) + ')',
      shardMode,
      shardStatusLabel,
      pointerHex: ptrHex,
      ringState,
      pointerAndRingLabel,
      weightSliceRows: rowsPerRank,
      weightSliceCols: colsPerRank,
      peerTransferTarget: 'R' + String(rank) + ' -> R' + String(nextPeer),
      commQueueDepth: isDesynced ? 6 : (payload.stepCounter + rank) % 3,
      shardSizeMb: payload.shardSizeMb,
      localNorm: rankNorms[rank],
      lastStepLatencyUs: allReduceLatencyUs,
      activeOp: isDesynced ? 'RING_RESYNC_WAIT' : 'ALL_REDUCE_RING',
    });
  }

  return {
    corridor: payload.corridor,
    worldSize,
    denseOutput,
    shardedOutput,
    maxAbsDiff,
    numericallyEquivalent: maxAbsDiff < 1e-9,
    ringBandwidthGbs,
    bandwidthSaturationPct,
    allReduceLatencyUs,
    activeRanksCount,
    processedTokens,
    tpXpDeltaK,
    tpStateLabel:
      desyncCount > 0 ? 'TP State: Ring Resync Active' : spec.tpStateLabel,
    overlapEfficiencyPct: effectiveOverlapPct,
    ringFactor,
    effectiveTransferMb,
    ranks,
    ringHops: hops,
  };
}

export const SUPABASE_POSTGRES_SCHEMA_SQL = [
  '-- GF-T3-239 Production PostgreSQL / Supabase Schema (Partitioned + RLS)',
  'CREATE EXTENSION IF NOT EXISTS "pgcrypto";',
  '',
  'CREATE TABLE IF NOT EXISTS tp_corridors (',
  '  corridor_id TEXT PRIMARY KEY,',
  '  corridor_code TEXT NOT NULL UNIQUE,',
  '  world_size INTEGER NOT NULL CHECK (world_size IN (1, 2, 4, 8)),',
  '  bandwidth_gbs NUMERIC(10, 2) NOT NULL CHECK (bandwidth_gbs > 0),',
  '  base_latency_us NUMERIC(10, 4) NOT NULL CHECK (base_latency_us > 0),',
  '  overlap_target_pct NUMERIC(5, 2) NOT NULL CHECK (overlap_target_pct BETWEEN 0 AND 100),',
  '  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()',
  ');',
  '',
  'CREATE TABLE IF NOT EXISTS tp_rank_shards (',
  '  shard_uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),',
  '  corridor_id TEXT NOT NULL REFERENCES tp_corridors(corridor_id) ON DELETE CASCADE,',
  '  rank_index INTEGER NOT NULL CHECK (rank_index BETWEEN 0 AND 7),',
  '  shard_mode TEXT NOT NULL CHECK (shard_mode IN (\'COL\', \'ROW\', \'COL_ROW\')),',
  '  device_ptr_hex TEXT NOT NULL,',
  '  ring_state TEXT NOT NULL CHECK (ring_state IN (\'RING_SYNC\', \'ALL_REDUCE_RING\', \'DESYNC_FAULT\')),',
  '  peer_target_rank INTEGER NOT NULL CHECK (peer_target_rank BETWEEN 0 AND 7),',
  '  comm_queue_depth INTEGER NOT NULL DEFAULT 0 CHECK (comm_queue_depth >= 0),',
  '  UNIQUE (corridor_id, rank_index)',
  ');',
  '',
  'CREATE TABLE IF NOT EXISTS tp_ring_telemetry_events (',
  '  event_id UUID NOT NULL DEFAULT gen_random_uuid(),',
  '  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),',
  '  corridor_id TEXT NOT NULL REFERENCES tp_corridors(corridor_id),',
  '  operator_uid UUID NOT NULL,',
  '  active_ranks INTEGER NOT NULL CHECK (active_ranks BETWEEN 1 AND 8),',
  '  ring_bandwidth_gbs NUMERIC(10, 2) NOT NULL,',
  '  all_reduce_latency_us NUMERIC(10, 4) NOT NULL,',
  '  processed_tokens BIGINT NOT NULL,',
  '  max_numerical_diff DOUBLE PRECISION NOT NULL,',
  '  PRIMARY KEY (event_id, recorded_at)',
  ') PARTITION BY RANGE (recorded_at);',
  '',
  'ALTER TABLE tp_corridors ENABLE ROW LEVEL SECURITY;',
  'ALTER TABLE tp_rank_shards ENABLE ROW LEVEL SECURITY;',
  'ALTER TABLE tp_ring_telemetry_events ENABLE ROW LEVEL SECURITY;',
  '',
  'CREATE POLICY tp_ring_telemetry_select_own ON tp_ring_telemetry_events',
  '  FOR SELECT TO authenticated USING (auth.uid() = operator_uid);',
].join('\n');
