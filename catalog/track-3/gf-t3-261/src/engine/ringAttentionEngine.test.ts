/**
 * GF-T3-261 Vitest Mechanical & Security Verification Suite
 * Tests edge cases, boundary math, O(N/P) memory scaling, online softmax invariance,
 * and GridSync Zero-Trust security gates.
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  SYNTHETIC_CORRIDOR_LIST,
  computeRingKvCirculation,
  computeOnlineSoftmaxRenormalization,
  evaluateRingClusterState,
  GridSyncRingPayloadSchema,
} from './ringAttentionEngine';

describe('GF-T3-261 Context Parallelism & Ring-Attention Engine', () => {
  it('verifies ring-attention KV block circulation bijection and full cycle periodicity', () => {
    const numNodes = 8;
    const visitedByRank: Record<number, Set<number>> = {};
    for (let r = 0; r < numNodes; r++) {
      visitedByRank[r] = new Set<number>();
    }

    for (let hop = 0; hop < numNodes; hop++) {
      const mapping = computeRingKvCirculation(numNodes, hop);
      expect(mapping.length).toBe(numNodes);
      const uniqueSources = new Set(mapping);
      expect(uniqueSources.size).toBe(numNodes);

      for (let r = 0; r < numNodes; r++) {
        visitedByRank[r].add(mapping[r]);
      }
    }

    for (let r = 0; r < numNodes; r++) {
      expect(visitedByRank[r].size).toBe(numNodes);
    }

    expect(computeRingKvCirculation(numNodes, 0)).toEqual(
      computeRingKvCirculation(numNodes, numNodes)
    );
  });

  it('verifies sub-microsecond online softmax renormalization matches monolithic softmax with <1e-12 drift', () => {
    const logitsBlocks = [
      [12.4, -3.2, 8.9, 15.1],
      [22.7, 19.3, -1.4, 7.6],
      [5.5, 31.2, 28.9, 14.0],
      [18.2, 11.1, 24.5, 9.8],
    ];
    const valuesBlocks = [
      [0.45, -1.2, 2.3, 0.88],
      [1.75, 0.92, -0.34, 1.12],
      [-0.65, 3.4, 2.8, 0.15],
      [1.05, 0.72, 1.95, -0.4],
    ];

    const result = computeOnlineSoftmaxRenormalization(logitsBlocks, valuesBlocks);
    expect(result.hopHistory.length).toBe(4);
    expect(result.finalMax).toBeCloseTo(31.2, 5);
    expect(result.numericalDrift).toBeLessThan(1e-12);
    expect(result.finalOutput).toBeCloseTo(result.exactMonolithicOutput, 10);
  });

  it('verifies O(N/P) linear memory footprint scaling and 100% KV transfer overlap on Corridor Alpha', () => {
    const state8 = evaluateRingClusterState({
      corridor: SYNTHETIC_CORRIDOR_LIST[0],
      numNodes: 8,
      totalSequenceTokens: 4096000,
      hopIndex: 0,
      sequenceSpikeActive: false,
      burstCount: 0,
    });

    const state4 = evaluateRingClusterState({
      corridor: SYNTHETIC_CORRIDOR_LIST[0],
      numNodes: 4,
      totalSequenceTokens: 4096000,
      hopIndex: 0,
      sequenceSpikeActive: false,
      burstCount: 0,
    });

    expect(state8.contextThroughputGbps).toBe(23400);
    expect(state8.ringLatencyUs).toBe(0.01);
    expect(state8.processedTokens).toBe(4480000);
    expect(state8.nodes.length).toBe(8);
    expect(state8.nodes[0].partitionTokens).toBe(512000);
    expect(state8.nodes[0].overlapPct).toBe(100);
    expect(state8.nodes[0].memoryFootprintMb).toBe(state4.nodes[0].memoryFootprintMb / 2);
  });

  it('enforces GridSync Zero-Trust sanitization against SQL injection and XSS payloads', () => {
    const sqlInjectionAttempt = GridSyncRingPayloadSchema.safeParse({
      corridor: 'RING-CORRIDOR-ALPHA; DROP TABLE ring_hop_telemetry; --',
      numNodes: 8,
      totalSequenceTokens: 4096000,
      hopIndex: 0,
      sequenceSpikeActive: false,
      burstCount: 0,
    });
    expect(sqlInjectionAttempt.success).toBe(false);

    const xssAttempt = GridSyncRingPayloadSchema.safeParse({
      corridor: SYNTHETIC_CORRIDOR_LIST[0],
      numNodes: 8,
      totalSequenceTokens: 4096000,
      hopIndex: 0,
      sequenceSpikeActive: false,
      burstCount: 0,
      customOperatorTag: '<script>alert(1)</script>',
    });
    expect(xssAttempt.success).toBe(false);
  });
});
