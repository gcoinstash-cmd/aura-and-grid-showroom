/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Executable Vitest Suite for GF-T3-272 Speculative Decoding & Multi-Candidate Verification Engine
 */

import { describe, expect, it } from 'vitest';
import {
  SpeculativeCorridor,
  SUPABASE_POSTGRES_SCHEMA_SQL,
  computeExpectedAcceptedTokens,
  computeKlDivergenceNats,
  computeResidualDistribution,
  computeSpeculativeAcceptance,
  computeTreeSpeedupMultiplier,
  createBaselineCandidateInputs,
  executeSpeculativeVerificationPass,
  isValidHexPointer,
  sanitizeGridSyncInput,
} from './speculativeEngine';

describe('GF-T3-272 Speculative Decoding & Multi-Candidate Verification Engine', () => {
  it('computes exact speculative acceptance probability P_accept = min(1, P(x)/Q(x))', () => {
    expect(computeSpeculativeAcceptance(0.92, 0.85)).toBe(1.0);
    expect(computeSpeculativeAcceptance(0.47, 0.94)).toBeCloseTo(0.5, 5);
    expect(computeSpeculativeAcceptance(0.25, 0.0)).toBe(1.0);
    expect(computeSpeculativeAcceptance(0.0, 0.0)).toBe(0.0);
  });

  it('rejects out-of-range or non-finite probabilities', () => {
    expect(() => computeSpeculativeAcceptance(-0.1, 0.5)).toThrow();
    expect(() => computeSpeculativeAcceptance(0.5, 1.2)).toThrow();
    expect(() => computeSpeculativeAcceptance(Number.NaN, 0.5)).toThrow();
  });

  it('normalizes residual distribution P_prime(x) = norm(max(0, P(x) - Q(x)))', () => {
    const residual = computeResidualDistribution([0.65, 0.25, 0.1], [0.25, 0.45, 0.3]);
    expect(residual).toHaveLength(3);
    const sum = residual.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 5);
    expect(residual[0]).toBeCloseTo(1.0, 5);
    expect(residual[1]).toBe(0);
    expect(residual[2]).toBe(0);
  });

  it('calculates KL divergence and expected contiguous accepted prefix tokens', () => {
    const klZero = computeKlDivergenceNats([0.3, 0.4, 0.3], [0.3, 0.4, 0.3]);
    expect(klZero).toBeCloseTo(0, 5);

    const klPositive = computeKlDivergenceNats([0.8, 0.1, 0.1], [0.2, 0.4, 0.4]);
    expect(klPositive).toBeGreaterThan(0.2);

    const expectedLen = computeExpectedAcceptedTokens([0.942, 0.942, 0.942, 0.942, 0.942, 0.942]);
    expect(expectedLen).toBeGreaterThan(4.2);

    const speedup = computeTreeSpeedupMultiplier(expectedLen, 6, 0.03125, 8);
    expect(speedup).toBeGreaterThan(4.0);
  });

  it('verifies baseline 8-candidate tree pass saturation at 32,000 GB/s and 0.01 us', () => {
    const snapshot = executeSpeculativeVerificationPass({
      corridor: SpeculativeCorridor.ALPHA,
      candidates: createBaselineCandidateInputs(),
      draftCostCoefficient: 0.03125,
      divergenceSpikeActive: false,
      burstMultiplier: 1,
      stepCounter: 0,
    });

    expect(snapshot.engineId).toBe('GF-T3-272');
    expect(snapshot.verificationThroughputGbs).toBe(32000);
    expect(snapshot.verificationThroughputFormatted).toBe('32,000 GB/s');
    expect(snapshot.draftLatencyUs).toBe(0.01);
    expect(snapshot.activeCandidatesCount).toBe(8);
    expect(snapshot.processedTokensUnits).toBe(6272000);
    expect(snapshot.speculativeState).toBe('Verification Active');
    expect(snapshot.candidates[3].pointerHex).toBe('0x6030');
    expect(snapshot.candidates[3].acceptancePct).toBe(94.2);
    expect(snapshot.candidates[3].tokensK).toBe(256);
    expect(snapshot.candidates[3].verifiedLocked).toBe(true);
  });

  it('triggers tree re-pruning when draft divergence spike is injected', () => {
    const spikeSnapshot = executeSpeculativeVerificationPass({
      corridor: SpeculativeCorridor.ALPHA,
      candidates: createBaselineCandidateInputs(),
      draftCostCoefficient: 0.03125,
      divergenceSpikeActive: true,
      burstMultiplier: 1,
      stepCounter: 0,
    });

    expect(spikeSnapshot.activeCandidatesCount).toBe(6);
    expect(spikeSnapshot.speculativeState).toBe('Tree Re-Pruning Active');
    expect(spikeSnapshot.candidates[2].verifiedLocked).toBe(false);
    expect(spikeSnapshot.candidates[5].verifiedLocked).toBe(false);
  });

  it('enforces GridSync Zero-Trust security sanitization and hex pointer checks', () => {
    expect(sanitizeGridSyncInput('0x6030')).toBe('0x6030');
    expect(isValidHexPointer('0x6030')).toBe(true);
    expect(isValidHexPointer('6030')).toBe(false);
    expect(() => sanitizeGridSyncInput('0x6030; DROP TABLE speculative_corridors;')).toThrow();
    expect(() => sanitizeGridSyncInput('<script>evil()</script>')).toThrow();
  });

  it('exports partitioned PostgreSQL / Supabase schema with RLS policies and zero prohibited symbols', () => {
    expect(SUPABASE_POSTGRES_SCHEMA_SQL).toContain('PARTITION BY RANGE (recorded_at)');
    expect(SUPABASE_POSTGRES_SCHEMA_SQL).toContain('ENABLE ROW LEVEL SECURITY');
    expect(SUPABASE_POSTGRES_SCHEMA_SQL.indexOf('\u0024')).toBe(-1);
  });
});
