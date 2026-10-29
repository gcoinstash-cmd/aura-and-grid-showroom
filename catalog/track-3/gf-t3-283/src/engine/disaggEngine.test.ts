/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GF-T3-283 Executable Vitest Verification Suite
 * Verifies Prefill-Decode Disaggregation Math, RDMA KV-Streaming, and GridSync Zero-Trust Gates
 */

import { describe, expect, it } from 'vitest';
import {
  computeDeterministicHexHash,
  computeKvCacheStateGb,
  evaluateDisaggregatedEngine,
  GridSyncIngressSchema,
  SYNTHETIC_CORRIDORS,
} from './disaggEngine';
import { SUPABASE_POSTGRES_SCHEMA_SQL } from './supabaseSchema';

describe('GF-T3-283 Prefill-Decode Disaggregation & KV-Streaming Engine', () => {
  it('computes exact KV cache memory footprint in GB for BF16 precision', () => {
    const kvGb = computeKvCacheStateGb(32768, 8, 80, 8, 128);
    // 2 * 80 * 8 * 128 * 2 * 32768 * 8 = 85,899,345,920 bytes = 85.8993 GB
    expect(kvGb).toBeCloseTo(85.8993, 3);
  });

  it('verifies disaggregated latency is strictly lower than collocated baseline under normal operation', () => {
    const result = evaluateDisaggregatedEngine({
      corridorId: 'DISAGG-CORRIDOR-ALPHA',
      burstMultiplier: 1,
      congestionActive: false,
      chunkPassCount: 0,
      seqLengthTokens: 32768,
      batchSize: 8,
      numLayers: 80,
      numKvHeads: 8,
      headDim: 128,
    });

    expect(result.streamingThroughputGbps).toBe(40800);
    expect(result.handoffLatencyUs).toBe(0.01);
    expect(result.activeNodesCount).toBe(8);
    expect(result.totalNodesCount).toBe(8);
    expect(result.processedTokensUnits).toBe(7680000);
    expect(result.disaggTotalLatencyMs).toBeLessThan(result.collocatedTotalLatencyMs);
    expect(result.ttftReductionPercent).toBeGreaterThan(35);
    expect(result.nodes).toHaveLength(8);
    expect(result.nodes[0].role).toBe('PREFILL-P0');
    expect(result.nodes[0].hexPtr).toBe('0x11000');
    expect(result.nodes[3].role).toBe('DECODE-D3');
    expect(result.nodes[3].hexPtr).toBe('0x11030');
  });

  it('reroutes RDMA KV transfers and adjusts telemetry when network congestion spike is injected', () => {
    const baseline = evaluateDisaggregatedEngine({
      corridorId: 'DISAGG-CORRIDOR-ALPHA',
      burstMultiplier: 1,
      congestionActive: false,
      chunkPassCount: 0,
      seqLengthTokens: 32768,
      batchSize: 8,
      numLayers: 80,
      numKvHeads: 8,
      headDim: 128,
    });

    const congested = evaluateDisaggregatedEngine({
      corridorId: 'DISAGG-CORRIDOR-ALPHA',
      burstMultiplier: 1,
      congestionActive: true,
      chunkPassCount: 0,
      seqLengthTokens: 32768,
      batchSize: 8,
      numLayers: 80,
      numKvHeads: 8,
      headDim: 128,
    });

    expect(congested.streamingThroughputGbps).toBeLessThan(baseline.streamingThroughputGbps);
    expect(congested.handoffLatencyUs).toBeGreaterThan(baseline.handoffLatencyUs);
    expect(congested.activeNodesCount).toBe(6);
    expect(congested.nodes[2].stateLabel).toBe('REROUTING · FAULT');
    expect(congested.nodes[5].stateLabel).toBe('REROUTING · FAULT');
  });

  it('enforces GridSync Zero-Trust sanitization against SQL injection and out-of-range inputs', () => {
    expect(() =>
      GridSyncIngressSchema.parse({
        corridorId: 'DISAGG-CORRIDOR-ALPHA',
        burstMultiplier: 1,
        congestionActive: false,
        chunkPassCount: 0,
        seqLengthTokens: 32768,
        batchSize: 8,
        numLayers: 80,
        numKvHeads: 8,
        headDim: 128,
        operatorNote: 'DROP TABLE disagg_corridors;--',
      })
    ).toThrow();

    expect(() =>
      GridSyncIngressSchema.parse({
        corridorId: 'DISAGG-CORRIDOR-ALPHA',
        burstMultiplier: 99,
        congestionActive: false,
        chunkPassCount: 0,
        seqLengthTokens: 32768,
        batchSize: 8,
        numLayers: 80,
        numKvHeads: 8,
        headDim: 128,
      })
    ).toThrow();
  });

  it('verifies deterministic checksums and PostgreSQL RLS schema integrity with zero currency signs', () => {
    const h1 = computeDeterministicHexHash('DISAGG-CORRIDOR-ALPHA:PREFILL-P0:256:0');
    const h2 = computeDeterministicHexHash('DISAGG-CORRIDOR-ALPHA:PREFILL-P0:256:0');
    expect(h1).toBe(h2);
    expect(h1.startsWith('0x')).toBe(true);

    expect(SUPABASE_POSTGRES_SCHEMA_SQL).toContain('ENABLE ROW LEVEL SECURITY');
    expect(SUPABASE_POSTGRES_SCHEMA_SQL).toContain('PARTITION BY RANGE');
    expect(Object.keys(SYNTHETIC_CORRIDORS)).toHaveLength(4);
  });
});
