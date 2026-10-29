import { describe, it, expect } from 'vitest';
import {
  SYNTHETIC_CORRIDORS,
  GridSyncVerifyPayloadSchema,
  computeAcceptanceProbability,
  computeResidualDistribution,
  computeExpectedAcceptedTokens,
  computeSpeedupFactor,
  createInitialTelemetry,
  stepSpeculativeEngine,
} from './speculativeEngine';

describe('GF-T3-257 Speculative Decoding & Draft Model Verification Engine', () => {
  it('validates target-draft probability thresholds via rejection sampling formula', () => {
    expect(computeAcceptanceProbability(0.92, 0.85)).toBe(1.0);
    expect(computeAcceptanceProbability(0.88, 0.88)).toBe(1.0);
    expect(computeAcceptanceProbability(0.45, 0.90)).toBeCloseTo(0.5, 4);
    expect(() => computeAcceptanceProbability(0.5, 0)).toThrow();
    expect(() => computeAcceptanceProbability(-0.2, 0.5)).toThrow();
  });

  it('normalizes residual probability distribution without accuracy loss', () => {
    const target = [0.65, 0.20, 0.15];
    const draft = [0.35, 0.35, 0.30];
    const residual = computeResidualDistribution(target, draft);
    expect(residual.length).toBe(3);
    const sum = residual.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 3);
    expect(residual[0]).toBeCloseTo(1.0, 4);
    expect(residual[1]).toBe(0);
    expect(residual[2]).toBe(0);
  });

  it('computes multi-token expected acceptance and 2.5x speedup multiplier', () => {
    expect(computeExpectedAcceptedTokens(1.0, 4)).toBe(5);
    expect(computeExpectedAcceptedTokens(0.0, 4)).toBe(1);
    const speedup = computeSpeedupFactor(0.88, 4, 0.14);
    expect(speedup).toBeGreaterThanOrEqual(2.4);
    expect(speedup).toBeLessThanOrEqual(2.6);
  });

  it('initializes 8 verified draft channels (D0-D7) at 19,500 GB/s and 2.5x speedup', () => {
    const state = createInitialTelemetry();
    expect(state.throughputGbs).toBe(19500);
    expect(state.verificationLatencyUs).toBe(0.01);
    expect(state.speedupMultiplier).toBe(2.5);
    expect(state.processedTokens).toBe(3968000);
    expect(state.drafts.length).toBe(8);
    expect(state.drafts[3].id).toBe('D3');
    expect(state.drafts[3].pointerHex).toBe('0x6300');
    expect(state.drafts[3].acceptancePct).toBe(88);
    expect(state.drafts[3].locked).toBe(true);
  });

  it('handles discrepancy injection, speculative burst, and buffer flush transitions', () => {
    const initial = createInitialTelemetry();
    const discrepancyState = stepSpeculativeEngine(initial, { toggleDiscrepancy: true });
    expect(discrepancyState.discrepancyActive).toBe(true);
    expect(discrepancyState.drafts[0].state).toBe('REJECT_FALLBACK');
    expect(discrepancyState.drafts[0].locked).toBe(false);

    const burstState = stepSpeculativeEngine(initial, { triggerBurst: true });
    expect(burstState.burstActive).toBe(true);
    expect(burstState.throughputGbs).toBeGreaterThan(19500);

    const flushed = stepSpeculativeEngine(burstState, { flushReset: true });
    expect(flushed.throughputGbs).toBe(19500);
    expect(flushed.processedTokens).toBe(3968000);
    expect(flushed.discrepancyActive).toBe(false);
  });

  it('enforces GridSync zero-trust Zod payload sanitization', () => {
    const valid = GridSyncVerifyPayloadSchema.safeParse({
      corridor: SYNTHETIC_CORRIDORS[0],
      draftIndex: 3,
      lookaheadK: 4,
      costCoefficientC: 0.08,
      targetProbs: [0.89, 0.91, 0.87, 0.90],
      draftProbs: [0.92, 0.94, 0.91, 0.93],
      thresholdsU: [0.35, 0.40, 0.38, 0.42],
      discrepancyActive: false,
    });
    expect(valid.success).toBe(true);

    const invalid = GridSyncVerifyPayloadSchema.safeParse({
      corridor: 'UNTRUSTED_SQL_DROP_TABLE',
      draftIndex: 99,
      lookaheadK: 0,
      costCoefficientC: -1,
      targetProbs: [],
      draftProbs: [],
      thresholdsU: [],
      discrepancyActive: false,
    });
    expect(invalid.success).toBe(false);
  });
});
