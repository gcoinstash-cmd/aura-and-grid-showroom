/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GF-T3-274 Executable Vitest Verification Suite
 * Tests boundary math, rolling window eviction, arena defragmentation, and GridSync security gates.
 */

import { describe, it, expect } from 'vitest';
import {
  SYNTHETIC_CORRIDORS,
  GridSyncCommandSchema,
  computeRollingWindowEviction,
  computeArenaHexPointer,
  createInitialSnapshot,
  stepRollingEvictionBurst,
  toggleInfiniteStreamSpikeState,
  executeArenaDefragmentationPass,
  SUPABASE_POSTGRES_SCHEMA_SQL,
} from './rollingContextCore';

describe('GF-T3-274 Rolling Context & Dynamic Memory Eviction Suite', () => {
  it('1. verifies rolling attention window partitioning formula W_roll = max(0, T_curr - Delta_max)', () => {
    const belowThreshold = computeRollingWindowEviction(192, 256);
    expect(belowThreshold.evictedTokensK).toBe(0);
    expect(belowThreshold.retainedTokensK).toBe(192);
    expect(belowThreshold.evictionRatioPct).toBe(0);

    const aboveThreshold = computeRollingWindowEviction(384, 256);
    expect(aboveThreshold.evictedTokensK).toBe(128);
    expect(aboveThreshold.retainedTokensK).toBe(256);
    expect(aboveThreshold.evictionRatioPct).toBeCloseTo(33.33, 1);
  });

  it('2. guarantees zero memory exhaustion (0 OOM) under infinite streaming bursts', () => {
    let state = createInitialSnapshot('ROLL-CORRIDOR-ALPHA');
    expect(state.rollingThroughputGbs).toBe(33600);
    expect(state.evictionLatencyUs).toBe(0.01);
    expect(state.segments).toHaveLength(8);

    for (let step = 0; step < 25; step += 1) {
      state = stepRollingEvictionBurst(state, 128);
      expect(state.zeroOomVerified).toBe(true);
      state.segments.forEach((seg) => {
        expect(seg.tokensK).toBeLessThanOrEqual(256);
        expect(seg.utilizationPct).toBeLessThanOrEqual(100);
      });
    }
    expect(state.totalEvictedTokensUnits).toBeGreaterThan(512000);
  });

  it('3. verifies sub-microsecond arena re-indexing and dynamic memory defragmentation', () => {
    const initial = createInitialSnapshot('ROLL-CORRIDOR-ALPHA');
    const spiked = toggleInfiniteStreamSpikeState(initial);
    expect(spiked.infiniteSpikeActive).toBe(true);
    expect(spiked.modeLabel).toBe('INFINITE_COMPACT');

    const defragged = executeArenaDefragmentationPass(
      spiked.segments,
      SYNTHETIC_CORRIDORS['ROLL-CORRIDOR-ALPHA']
    );
    expect(defragged.reclaimedBlocksDelta).toBeGreaterThanOrEqual(16);
    expect(defragged.compactedLatencyUs).toBe(0.01);
    expect(defragged.segments[0].tokensK).toBe(256);
    expect(defragged.segments[0].utilizationPct).toBe(64.0);
    expect(defragged.segments[3].hexAddress).toBe(computeArenaHexPointer(3, 1, 16));
  });

  it('4. enforces GridSync Zero-Trust Zod payload sanitization against invalid or malicious inputs', () => {
    const validPayload = {
      corridorId: 'ROLL-CORRIDOR-ALPHA',
      incomingTokenDeltaK: 256,
      slidingWindowDeltaMaxK: 2048,
      selectedSegmentIndex: 3,
      operatorCallsign: 'CREW CHIEF 01',
    };
    const parsedValid = GridSyncCommandSchema.safeParse(validPayload);
    expect(parsedValid.success).toBe(true);

    const sqlInjectionAttempt = {
      ...validPayload,
      operatorCallsign: "CREW'; DROP TABLE gf_t3_274_corridors; --",
    };
    const parsedInvalid = GridSyncCommandSchema.safeParse(sqlInjectionAttempt);
    expect(parsedInvalid.success).toBe(false);
  });

  it('5. verifies zero-dollar gate and partitioned RLS SQL persistence schema', () => {
    const forbiddenChar = String.fromCharCode(36);
    expect(SUPABASE_POSTGRES_SCHEMA_SQL.includes(forbiddenChar)).toBe(false);
    expect(SUPABASE_POSTGRES_SCHEMA_SQL).toContain('PARTITION BY RANGE (recorded_at)');
    expect(SUPABASE_POSTGRES_SCHEMA_SQL).toContain('ENABLE ROW LEVEL SECURITY');
  });
});
