/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Executable Vitest Suite for GF-T3-239 Tensor Parallelism & Ring All-Reduce Accelerator
 * Verifies numerical equivalence, Ring All-Reduce accumulation, overlap math, and GridSync Zod gates.
 */

import { describe, expect, it } from 'vitest';
import {
  CORRIDOR_OPTIONS,
  SUPABASE_POSTGRES_SCHEMA_SQL,
  executeRingAllReduce,
  generateDeterministicMatrix,
  isCleanInputString,
  multiplyMatrices,
  runTensorParallelPass,
  sanitizeShardPassPayload,
  shardWeightColumns,
  shardWeightRows,
} from '../engine/tensorParallelEngine';

describe('GF-T3-239 Tensor Parallelism & Ring All-Reduce Engine', () => {
  it('verifies numerical equivalence between non-sharded linear layers and 8-rank column-row sharded passes', () => {
    const result = runTensorParallelPass({
      corridor: 'TP-CORRIDOR-ALPHA (COLUMN-ROW-WEIGHT-SHARDING · 4800-GB/S)',
      batchTokens: 4,
      hiddenDim: 16,
      ffnDim: 32,
      shardSizeMb: 32,
      stepCounter: 0,
      desyncRankIndices: [],
    });

    expect(result.numericallyEquivalent).toBe(true);
    expect(result.maxAbsDiff).toBeLessThan(1e-9);
    expect(result.ranks.length).toBe(8);
    expect(result.ranks[0].headerLabel).toBe('Rank 0 (R0)');
    expect(result.ranks[0].shardStatusLabel).toBe('COL · SHARD: 1/8');
    expect(result.ranks[0].pointerAndRingLabel).toBe('0x6000 · RING_SYNC');
    expect(result.ranks[3].pointerHex).toBe('0x6800');
  });

  it('verifies column and row weight sharding partition conservation with zero duplication', () => {
    const weightA = generateDeterministicMatrix(16, 32, 3);
    const colShards = shardWeightColumns(weightA, 8);
    expect(colShards.length).toBe(8);
    expect(colShards[0].length).toBe(16);
    expect(colShards[0][0].length).toBe(4);

    const weightB = generateDeterministicMatrix(32, 16, 7);
    const rowShards = shardWeightRows(weightB, 8);
    expect(rowShards.length).toBe(8);
    expect(rowShards[0].length).toBe(4);
    expect(rowShards[0][0].length).toBe(16);

    // Reconstruct and verify exact identity with original matrices
    for (let r = 0; r < 16; r += 1) {
      const reconstructedRow: number[] = [];
      for (let rank = 0; rank < 8; rank += 1) {
        reconstructedRow.push(...colShards[rank][r]);
      }
      expect(reconstructedRow).toEqual(weightA[r]);
    }
  });

  it('verifies 8-rank Ring All-Reduce gradient and activation accumulation accuracy', () => {
    const partials = Array.from({ length: 8 }, (_, rank) =>
      generateDeterministicMatrix(4, 8, rank + 10)
    );
    const { reduced, hops, rankNorms } = executeRingAllReduce(partials, 32, 96.0);

    expect(hops.length).toBe(8);
    expect(hops[0].phase).toBe('SCATTER_REDUCE');
    expect(hops[7].phase).toBe('ALL_GATHER');
    expect(rankNorms.length).toBe(8);

    for (let r = 0; r < 4; r += 1) {
      for (let c = 0; c < 8; c += 1) {
        let manualSum = 0;
        for (let rank = 0; rank < 8; rank += 1) {
          manualSum += partials[rank][r][c];
        }
        expect(Math.abs(reduced[r][c] - manualSum)).toBeLessThan(1e-9);
      }
    }
  });

  it('verifies communication bandwidth saturation and rank desync penalty mechanics', () => {
    const healthy = runTensorParallelPass({
      corridor: 'TP-CORRIDOR-ALPHA (COLUMN-ROW-WEIGHT-SHARDING · 4800-GB/S)',
      batchTokens: 4,
      hiddenDim: 16,
      ffnDim: 32,
      shardSizeMb: 32,
      stepCounter: 1,
      desyncRankIndices: [],
    });

    const desynced = runTensorParallelPass({
      corridor: 'TP-CORRIDOR-ALPHA (COLUMN-ROW-WEIGHT-SHARDING · 4800-GB/S)',
      batchTokens: 4,
      hiddenDim: 16,
      ffnDim: 32,
      shardSizeMb: 32,
      stepCounter: 1,
      desyncRankIndices: [2, 5],
    });

    expect(healthy.ringBandwidthGbs).toBe(4800);
    expect(healthy.allReduceLatencyUs).toBe(0.04);
    expect(healthy.ringFactor).toBe(1.75);
    expect(healthy.effectiveTransferMb).toBe(56);
    expect(desynced.ringBandwidthGbs).toBeLessThan(healthy.ringBandwidthGbs);
    expect(desynced.allReduceLatencyUs).toBeGreaterThan(healthy.allReduceLatencyUs);
    expect(desynced.activeRanksCount).toBe(6);
    expect(desynced.ranks[2].ringState).toBe('DESYNC_FAULT');
  });

  it('enforces GridSync Zero-Trust Zod sanitization against invalid dimensions and SQLi/XSS payloads', () => {
    expect(() =>
      sanitizeShardPassPayload({
        corridor: CORRIDOR_OPTIONS[0],
        batchTokens: 4,
        hiddenDim: 15, // Not divisible by 8
        ffnDim: 32,
        shardSizeMb: 32,
        stepCounter: 0,
        desyncRankIndices: [],
      })
    ).toThrow();

    expect(() =>
      sanitizeShardPassPayload({
        corridor: CORRIDOR_OPTIONS[0],
        batchTokens: 4,
        hiddenDim: 16,
        ffnDim: 32,
        shardSizeMb: 32,
        stepCounter: 0,
        desyncRankIndices: [],
        auditNote: 'DROP TABLE tp_rank_shards;--',
      })
    ).toThrow();

    expect(isCleanInputString('<script>evil()</script>')).toBe(false);
    expect(isCleanInputString('Verified Ring All-Reduce Step 4')).toBe(true);
  });

  it('rejects incompatible matrix dimensions and verifies zero-dollar policy in SQL schema', () => {
    expect(() => multiplyMatrices([[1, 2]], [[1, 2]])).toThrow();
    expect(SUPABASE_POSTGRES_SCHEMA_SQL.includes('ROW LEVEL SECURITY')).toBe(true);
    expect(SUPABASE_POSTGRES_SCHEMA_SQL.indexOf('\x24')).toBe(-1);
  });
});
