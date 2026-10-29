/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Vitest Verification Suite for GF-T3-255 GQA & KV Cache Compression Engine
 */

import { describe, expect, it } from 'vitest';
import {
  SYNTHETIC_GQA_CORRIDORS,
  calculateKvCacheFootprint,
  computeGqaSharingFactor,
  computeScaledDotProductAttention,
  evaluateTemporalEvictionPool,
  generateEngineSnapshot,
  sanitizeGridSyncPayload,
} from './gqaEngine';

describe('GF-T3-255 GQA & KV Cache Compression Engine Suite', () => {
  it('verifies GQA head sharing ratio math and rejects non-divisible head counts', () => {
    expect(computeGqaSharingFactor(64, 8)).toBe(8);
    expect(computeGqaSharingFactor(64, 64)).toBe(1);
    expect(() => computeGqaSharingFactor(64, 0)).toThrow();
    expect(() => computeGqaSharingFactor(60, 8)).toThrow();
  });

  it('verifies scaled dot-product attention softmax probability normalization', () => {
    const q = [1.0, 0.5, -0.25, 0.75];
    const k = [
      [1.0, 0.5, -0.25, 0.75],
      [-1.0, -0.5, 0.25, -0.75],
      [0.1, 0.1, 0.1, 0.1],
    ];
    const probs = computeScaledDotProductAttention(q, k, 128);
    expect(probs.length).toBe(3);
    const total = probs.reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1.0, 6);
    expect(probs[0]).toBeGreaterThan(probs[2]);
    expect(probs[2]).toBeGreaterThan(probs[1]);
  });

  it('verifies KV cache temporal eviction pooling and memory footprint reduction', () => {
    const importances = [0.96, 0.11, 0.89, 0.14, 0.93, 0.08, 0.85, 0.12];
    const ages = [1, 45, 3, 50, 2, 60, 4, 55];
    const pool = evaluateTemporalEvictionPool(importances, ages, 0.05, 0.25);

    expect(pool.retainedCount).toBe(2);
    expect(pool.evictedCount).toBe(6);
    expect(pool.compactionRatio).toBe(4.0);
    expect(pool.evictionRatePct).toBe(75.0);
    expect(pool.retainedIndices).toContain(0);
    expect(pool.retainedIndices).toContain(4);

    const footprint = calculateKvCacheFootprint(1, 32768, 32, 8, 128, 2, 4.0);
    expect(footprint.rawBytes).toBe(4 * footprint.compressedBytes);
    expect(footprint.savedPct).toBe(75.0);
  });

  it('verifies GridSync Zero-Trust ingress sanitization blocks injection and currency symbols', () => {
    const valid = sanitizeGridSyncPayload({
      corridorKey: 'ALPHA',
      queryHeads: 64,
      kvHeads: 8,
      sequenceLength: 32768,
      headDim: 128,
      operatorCallsign: 'CREW_CHIEF_GARRETT',
    });
    expect(valid.corridorKey).toBe('ALPHA');

    expect(() =>
      sanitizeGridSyncPayload({
        corridorKey: 'ALPHA',
        queryHeads: 64,
        kvHeads: 8,
        sequenceLength: 32768,
        headDim: 128,
        operatorCallsign: '<script>evil()</script>',
      })
    ).toThrow();

    expect(() =>
      sanitizeGridSyncPayload({
        corridorKey: 'ALPHA',
        queryHeads: 64,
        kvHeads: 8,
        sequenceLength: 32768,
        headDim: 128,
        operatorCallsign: 'BAD_' + String.fromCharCode(36) + '_TOKEN',
      })
    ).toThrow();
  });

  it('verifies deterministic 8-head telemetry snapshot and Zero-Dollar Gate', () => {
    const snap = generateEngineSnapshot('ALPHA', 0, false, false, 3712000, 75000);
    expect(snap.throughputFormatted).toBe('17,400 GB/s');
    expect(snap.attentionLatencyFormatted).toBe('0.01 µs');
    expect(snap.compactionRatioFormatted).toBe('4.00x');
    expect(snap.heads.length).toBe(8);
    expect(snap.heads[3].hexPointer).toBe('0x4300');
    expect(snap.heads[3].ratioDisplay).toBe('4.0x');
    expect(snap.heads[3].gqaRatioDisplay).toBe('8:1');

    const serialized = JSON.stringify(snap) + JSON.stringify(SYNTHETIC_GQA_CORRIDORS);
    expect(serialized.includes(String.fromCharCode(36))).toBe(false);
  });
});
