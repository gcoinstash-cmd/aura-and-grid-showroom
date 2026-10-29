/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GF-T3-226 Automated Vitest Verification Suite
 * Tests Tiled Online Softmax Equivalence, Zero Fragmentation Paged Allocation,
 * Dynamic Low-Magnitude Eviction, and GridSync Zero-Trust Sanitization.
 */

import { describe, expect, it } from 'vitest';
import {
  CORRIDOR_LIST,
  createInitialBlocks,
  evictLowestAttentionBlocks,
  naiveScaledDotProductAttention,
  runKernelVerificationOnBlocks,
  sanitizeGridSyncInput,
  tiledOnlineSoftmaxAttention,
} from './flashAttnEngine';

describe('GF-T3-226 FlashAttention-3 & Paged KV-Cache Verification Suite', () => {
  it('verifies exact numerical equivalence between tiled online softmax and naive scaled dot-product attention', () => {
    const query = [0.54, -0.31, 0.82, 0.19, -0.44, 0.67, 0.12, -0.28];
    const keys: number[][] = [];
    const values: number[][] = [];

    for (let i = 0; i < 32; i++) {
      const kRow: number[] = [];
      const vRow: number[] = [];
      for (let j = 0; j < 8; j++) {
        kRow.push(Math.sin((i + 1) * 0.4 + j * 0.25) * 0.8);
        vRow.push(Math.cos((i + 1) * 0.35 - j * 0.15) * 0.75);
      }
      keys.push(kRow);
      values.push(vRow);
    }

    const naive = naiveScaledDotProductAttention(query, keys, values);
    const tiled = tiledOnlineSoftmaxAttention(query, keys, values, 4);

    expect(tiled.output.length).toBe(naive.output.length);
    expect(tiled.tilesProcessed).toBe(8);
    expect(tiled.maxNumericalDrift).toBeLessThan(1e-7);

    for (let d = 0; d < naive.output.length; d++) {
      expect(tiled.output[d]).toBeCloseTo(naive.output[d], 6);
    }
  });

  it('allocates 16 physical blocks of 16 tokens each with 0% external fragmentation', () => {
    const blocks = createInitialBlocks();
    expect(blocks.length).toBe(16);

    const totalCapacity = blocks.reduce((acc, b) => acc + b.capacityTokens, 0);
    const totalAllocated = blocks.reduce((acc, b) => acc + b.allocatedTokens, 0);

    expect(totalCapacity).toBe(256);
    expect(totalAllocated).toBe(256);
    expect(blocks.every((b) => b.status === 'LOCKED')).toBe(true);
  });

  it('evicts the lowest-magnitude cumulative attention score blocks accurately', () => {
    const blocks = createInitialBlocks();
    const sortedScores = [...blocks]
      .sort((a, b) => a.cumulativeAttentionScore - b.cumulativeAttentionScore)
      .slice(0, 4)
      .map((b) => b.physicalBlockId);

    const { updatedBlocks, evictedIds } = evictLowestAttentionBlocks(blocks, 4);
    expect(evictedIds.length).toBe(4);
    expect(new Set(evictedIds)).toEqual(new Set(sortedScores));

    const remainingLocked = updatedBlocks.filter((b) => b.status === 'LOCKED');
    expect(remainingLocked.length).toBe(12);
  });

  it('enforces GridSync Zero-Trust Zod payload sanitization against SQLi and XSS', () => {
    const validPayload = sanitizeGridSyncInput({
      corridor: CORRIDOR_LIST[0],
      sequenceId: 'SEQ_BURST_128K',
      requestedTokens: 128000,
      tileSize: 16,
    });
    expect(validPayload.valid).toBe(true);

    const sqliPayload = sanitizeGridSyncInput({
      corridor: 'KV-CORRIDOR-ALPHA; DROP TABLE kv_paged_blocks;--',
      sequenceId: 'SEQ_01',
      requestedTokens: 256,
      tileSize: 16,
    });
    expect(sqliPayload.valid).toBe(false);

    const xssPayload = sanitizeGridSyncInput({
      corridor: '<script>alert(1)</script>',
      sequenceId: 'SEQ_01',
      requestedTokens: 256,
      tileSize: 16,
    });
    expect(xssPayload.valid).toBe(false);
  });

  it('executes online softmax pass directly over active PagedCacheBlocks', () => {
    const blocks = createInitialBlocks();
    const kernelResult = runKernelVerificationOnBlocks(blocks, 2);
    expect(kernelResult.tilesProcessed).toBe(4);
    expect(kernelResult.maxNumericalDrift).toBeLessThan(1e-7);
    expect(kernelResult.steps.length).toBe(4);
  });
});
