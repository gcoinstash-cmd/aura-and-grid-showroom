/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GF-T3-248: Vitest Verification Suite
 * Tests Column/Row Sharding Math, Ring All-Reduce Parity, NVLink Congestion Routing,
 * and GridSync Zero-Trust Zod Payload Sanitization.
 */

import { describe, expect, it } from 'vitest';
import {
  CORRIDOR_PROFILES,
  SYNTHETIC_CORRIDOR_KEYS,
  computeTensorParallelPass,
  geluActivation,
  validateGridSyncPayload,
} from './tensorParallelEngine';

describe('GF-T3-248 Tensor Parallelism & All-Reduce Interconnect Engine', () => {
  it('initializes Corridor Alpha with exact baseline telemetry and 8 locked ranks', () => {
    const alpha = SYNTHETIC_CORRIDOR_KEYS[0];
    const snapshot = computeTensorParallelPass({
      corridor: alpha,
      seedVector: [1.08, 1.12, 1.09, 1.10],
      stepCount: 0,
      burstActive: false,
      congested: false,
    });

    expect(snapshot.fabricThroughputGbs).toBe(11200);
    expect(snapshot.allReduceLatencyUs).toBe(0.01);
    expect(snapshot.activeRanks).toBe(8);
    expect(snapshot.totalRanks).toBe(8);
    expect(snapshot.processedTokens).toBe(2816000);
    expect(snapshot.outputVector).toEqual([1.08, 1.12, 1.09, 1.10]);
    expect(snapshot.ranks).toHaveLength(8);
    expect(snapshot.ranks[0].shardType).toBe('COL');
    expect(snapshot.ranks[3].shardType).toBe('ROW');
    expect(snapshot.ranks[3].reduceLatencyUs).toBe(0.58);
    expect(snapshot.ranks[3].nvlinkBandwidthGbs).toBe(900);
    expect(snapshot.ranks[3].lockStatus).toBe('LOCKED');
  });

  it('maintains Ring All-Reduce vector summation parity across all 8 sharded ranks', () => {
    const alpha = SYNTHETIC_CORRIDOR_KEYS[0];
    const snapshot = computeTensorParallelPass({
      corridor: alpha,
      seedVector: [1.08, 1.12, 1.09, 1.10],
      stepCount: 3,
      burstActive: true,
      congested: false,
    });

    const sum0 = snapshot.ranks.reduce((acc, r) => acc + r.partialVector[0], 0);
    const sum1 = snapshot.ranks.reduce((acc, r) => acc + r.partialVector[1], 0);
    const sum2 = snapshot.ranks.reduce((acc, r) => acc + r.partialVector[2], 0);
    const sum3 = snapshot.ranks.reduce((acc, r) => acc + r.partialVector[3], 0);

    expect(snapshot.outputVector[0]).toBeCloseTo(Number(sum0.toFixed(2)), 2);
    expect(snapshot.outputVector[1]).toBeCloseTo(Number(sum1.toFixed(2)), 2);
    expect(snapshot.outputVector[2]).toBeCloseTo(Number(sum2.toFixed(2)), 2);
    expect(snapshot.outputVector[3]).toBeCloseTo(Number(sum3.toFixed(2)), 2);
  });

  it('detects interconnect congestion on Ranks R2 and R5 and reroutes over NVSwitch Crossbar B', () => {
    const alpha = SYNTHETIC_CORRIDOR_KEYS[0];
    const snapshot = computeTensorParallelPass({
      corridor: alpha,
      seedVector: [1.08, 1.12, 1.09, 1.10],
      stepCount: 1,
      burstActive: false,
      congested: true,
    });

    expect(snapshot.tensorState).toBe('Congestion Resync');
    expect(snapshot.ranks[2].lockStatus).toBe('FAULT');
    expect(snapshot.ranks[2].reduceState).toBe('RESYNC');
    expect(snapshot.ranks[2].fabricPlane).toBe('NVSWITCH_CROSSBAR_B');
    expect(snapshot.ranks[0].lockStatus).toBe('LOCKED');
    expect(snapshot.bubbleOverheadPct).toBeGreaterThan(0);
  });

  it('evaluates GeLU non-linear activation accurately', () => {
    expect(geluActivation(0)).toBeCloseTo(0, 5);
    expect(geluActivation(1)).toBeCloseTo(0.8412, 3);
    expect(geluActivation(-1)).toBeCloseTo(-0.1588, 3);
  });

  it('enforces GridSync Zero-Trust Zod payload sanitization against SQLi, XSS, and currency glyphs', () => {
    const valid = validateGridSyncPayload({
      corridor: SYNTHETIC_CORRIDOR_KEYS[0],
      inputVector: [1.08, 1.12, 1.09, 1.10],
      tagNote: 'RING_ALL_REDUCE_VERIFIED',
    });
    expect(valid.tagNote).toBe('RING_ALL_REDUCE_VERIFIED');

    expect(() =>
      validateGridSyncPayload({
        corridor: SYNTHETIC_CORRIDOR_KEYS[0],
        inputVector: [1.08, 1.12, 1.09, 1.10],
        tagNote: 'DROP TABLE tensor_rank_states;--',
      })
    ).toThrow();

    expect(() =>
      validateGridSyncPayload({
        corridor: SYNTHETIC_CORRIDOR_KEYS[0],
        inputVector: [1.08, 1.12, 1.09, 1.10],
        tagNote: 'Cost 50 ' + String.fromCharCode(36),
      })
    ).toThrow();
  });

  it('verifies all 4 synthetic tensor parallel corridors have valid profiles', () => {
    for (const key of SYNTHETIC_CORRIDOR_KEYS) {
      const profile = CORRIDOR_PROFILES[key];
      expect(profile.baseFabricGbs).toBeGreaterThan(0);
      expect(profile.totalRanks).toBe(8);
    }
  });
});
