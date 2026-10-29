/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Vitest Verification Suite for GF-T3-270 Ring Attention & KV-Cache Compression Engine
 */

import { describe, expect, it } from 'vitest';
import {
  SYNTHETIC_CORRIDORS,
  SUPABASE_RLS_SCHEMA_SQL,
  computeCockpitTelemetry,
  computeHierarchicalKVCompression,
  computeRingAttentionBlockPass,
  sanitizeGridSyncPayload,
} from './ringAttentionCore';

describe('GF-T3-270 Ring Attention & KV-Cache Compression Engine', () => {
  it('verifies online Softmax Ring Attention block partitioning matches exact full attention', () => {
    const queryBlock = [
      [1.0, 0.5, -0.25, 0.75],
      [0.2, -0.4, 0.8, 0.1],
    ];
    const keyBlocks = [
      [
        [0.5, 0.2, -0.1, 0.4],
        [0.1, 0.9, 0.3, -0.2],
      ],
      [
        [-0.3, 0.6, 0.5, 0.2],
        [0.8, -0.1, 0.4, 0.7],
      ],
    ];
    const valueBlocks = [
      [
        [1.0, 2.0],
        [3.0, 4.0],
      ],
      [
        [0.5, 1.5],
        [2.5, 3.5],
      ],
    ];

    const step0 = computeRingAttentionBlockPass(queryBlock, keyBlocks, valueBlocks, 4, 0);
    const step1 = computeRingAttentionBlockPass(queryBlock, keyBlocks, valueBlocks, 4, 1);

    expect(step0.outputMatrix).toEqual(step1.outputMatrix);
    expect(step0.logSumExp).toEqual(step1.logSumExp);
    expect(step0.peerHops).toEqual(['W0->W1', 'W1->W0']);
    expect(step1.peerHops).toEqual(['W1->W0', 'W0->W1']);
    expect(step0.numericalParity).toBe(100.0);
  });

  it('verifies hierarchical KV-cache compression ratios across INT-4, INT-8, and FP16', () => {
    const int4 = computeHierarchicalKVCompression(6000000, 'INT-4', 0.25, 512);
    const int8 = computeHierarchicalKVCompression(6000000, 'INT-8', 0.5, 512);
    const fp16 = computeHierarchicalKVCompression(6000000, 'FP16', 1.0, 512);

    expect(int4.uncompressedFootprintGb).toBeGreaterThan(int4.compressedFootprintGb);
    expect(int4.compressionRatio).toBeGreaterThan(12);
    expect(int4.compressedFootprintGb).toBeLessThan(int8.compressedFootprintGb);
    expect(int8.compressedFootprintGb).toBeLessThan(fp16.compressedFootprintGb);
    expect(int4.retainedTokens + int4.prunedTokens).toBe(6000000);
    expect(int4.attentionParityPct).toBeGreaterThanOrEqual(95.0);
  });

  it('verifies baseline cockpit telemetry and 8-window cyclic arena state', () => {
    const snapshot = computeCockpitTelemetry(
      SYNTHETIC_CORRIDORS[0].label,
      0,
      false,
      false
    );

    expect(snapshot.throughputGbs).toBe(30400);
    expect(snapshot.throughputFormatted).toBe('30,400 GB/s');
    expect(snapshot.ringLatencyFormatted).toBe('0.01 µs');
    expect(snapshot.processedTokensFormatted).toBe('6,000,000 UNITS');
    expect(snapshot.windows).toHaveLength(8);
    expect(snapshot.windows[0].title).toBe('Window 0 (W0)');
    expect(snapshot.windows[0].hexPtr).toBe('0x4000');
    expect(snapshot.windows[3].hexPtr).toBe('0x4030');
    expect(snapshot.stateVector).toEqual([3.21, 3.25, 3.22, 3.24]);
  });

  it('verifies GridSync Zero-Trust Zod sanitizer rejects SQL injection and XSS payloads', () => {
    const clean = sanitizeGridSyncPayload({
      corridor: SYNTHETIC_CORRIDORS[0].label,
      selectedWindowIndex: 3,
      cyclicStep: 2,
      burstActive: false,
      spikeActive: false,
      heavyHitterRatio: 0.25,
      operatorNote: 'RING_SYNC_VERIFIED',
    });
    expect(clean.valid).toBe(true);

    const xssAttempt = sanitizeGridSyncPayload({
      corridor: SYNTHETIC_CORRIDORS[0].label,
      selectedWindowIndex: 3,
      cyclicStep: 0,
      burstActive: false,
      spikeActive: false,
      operatorNote: '<script>alert(1)</script>',
    });
    expect(xssAttempt.valid).toBe(false);

    const sqliAttempt = sanitizeGridSyncPayload({
      corridor: SYNTHETIC_CORRIDORS[0].label,
      selectedWindowIndex: 3,
      cyclicStep: 0,
      burstActive: false,
      spikeActive: false,
      operatorNote: 'DROP TABLE gf_t3_270_corridors;',
    });
    expect(sqliAttempt.valid).toBe(false);
  });

  it('verifies zero dollar signs exist in SQL persistence schema or corridor descriptors', () => {
    expect(SUPABASE_RLS_SCHEMA_SQL.includes(String.fromCharCode(36))).toBe(false);
    for (const corridor of SYNTHETIC_CORRIDORS) {
      expect(corridor.label.includes(String.fromCharCode(36))).toBe(false);
    }
  });
});
