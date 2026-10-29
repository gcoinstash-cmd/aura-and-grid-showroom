/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Vitest Mechanical & Security Verification Suite for GF-T3-251
 */

import { describe, expect, it } from 'vitest';
import {
  calculateDynamicExpertLimit,
  computeAuxiliaryLossPenalty,
  createInitialSnapshot,
  runCapacityBalancerPass,
  SYNTHETIC_CORRIDORS,
} from './moeCapacityCore';

describe('GF-T3-251 Capacity Factor & Zero-Token-Dropping Engine', () => {
  it('calculates exact expert token quota limits using Capacity = 1.25 * (N / E)', () => {
    const limit = calculateDynamicExpertLimit(2560, 8, 1.25);
    expect(limit).toBe(400);

    const highCapLimit = calculateDynamicExpertLimit(2560, 8, 1.5);
    expect(highCapLimit).toBe(480);
  });

  it('rejects invalid boundary inputs on capacity limit calculation', () => {
    expect(() => calculateDynamicExpertLimit(-100, 8, 1.25)).toThrow();
    expect(() => calculateDynamicExpertLimit(2560, 0, 1.25)).toThrow();
    expect(() => calculateDynamicExpertLimit(2560, 8, 0.75)).toThrow();
  });

  it('initializes baseline E0..E7 snapshot with 384 routed on E0 and 390 on E3 with 0 drops', () => {
    const snap = createInitialSnapshot();
    expect(snap.engineId).toBe('GF-T3-251');
    expect(snap.capacityFactor).toBe(1.25);
    expect(snap.tokenLimit).toBe(400);
    expect(snap.droppedTokens).toBe(0);
    expect(snap.throughputGbs).toBe(13800);
    expect(snap.experts).toHaveLength(8);
    expect(snap.experts[0].routed).toBe(384);
    expect(snap.experts[3].routed).toBe(390);
    expect(snap.experts[3].pointer).toBe('0xF300');
  });

  it('reroutes overflowing tokens across secondary expert ranks with zero token drops', () => {
    const snap = runCapacityBalancerPass({
      totalTokens: 2560,
      numExperts: 8,
      capacityFactor: 1.25,
      corridor: SYNTHETIC_CORRIDORS[1],
      expertDemandWeights: [1.85, 0.7, 0.75, 1.9, 0.65, 0.7, 0.8, 0.75],
    });

    expect(snap.droppedTokens).toBe(0);
    expect(snap.redispatchedTokens).toBeGreaterThan(0);
    expect(snap.moeState).toBe('Zero-Drop Redispatch Active');

    const sumDemands = snap.experts.reduce((acc, e) => acc + e.incomingDemand, 0);
    expect(snap.totalProcessedTokens).toBe(sumDemands);
  });

  it('dynamically expands capacity limit when all 8 ranks experience a simultaneous burst', () => {
    const snap = runCapacityBalancerPass({
      totalTokens: 2560,
      numExperts: 8,
      capacityFactor: 1.25,
      corridor: SYNTHETIC_CORRIDORS[0],
      expertDemandWeights: [1.65, 1.55, 1.7, 1.6, 1.5, 1.6, 1.55, 1.65],
    });

    expect(snap.droppedTokens).toBe(0);
    expect(snap.tokenLimit).toBeGreaterThan(400);
    expect(snap.capacityFactor).toBeGreaterThan(1.25);
  });

  it('computes auxiliary imbalance loss accurately for balanced vs skewed distributions', () => {
    const uniformLoss = computeAuxiliaryLossPenalty(
      [384, 384, 384, 384, 384, 384, 384, 384],
      [384, 384, 384, 384, 384, 384, 384, 384],
      8
    );
    expect(uniformLoss).toBeCloseTo(1.0, 5);

    const skewedLoss = computeAuxiliaryLossPenalty(
      [920, 120, 120, 120, 120, 120, 120, 120],
      [400, 200, 200, 200, 190, 190, 190, 190],
      8
    );
    expect(skewedLoss).toBeGreaterThan(1.0);
  });

  it('enforces GridSync Zero-Trust sanitization against SQL injection and XSS payloads', () => {
    expect(() =>
      runCapacityBalancerPass({
        totalTokens: 2560,
        numExperts: 8,
        capacityFactor: 1.25,
        corridor: SYNTHETIC_CORRIDORS[0],
        expertDemandWeights: [1.2, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2],
        operatorNote: 'DROP TABLE moe_capacity_dispatch_passes; --',
      })
    ).toThrow();
  });
});
