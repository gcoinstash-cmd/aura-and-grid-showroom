import { describe, expect, it } from 'vitest';
import {
  SyntheticCorridorId,
  buildInitialStreams,
  computeMultiTokenParallelAcceptance,
  rotateStreamPointerHex,
  sanitizeVerificationPayload,
} from './speculativeEngine';

describe('GF-T3-281 Speculative Acceptance & Verification Engine', () => {
  it('verifies multi-token parallel acceptance formula A_multi = sum min(1, P/Q)', () => {
    const targetP = [0.95, 0.90, 0.88, 0.92];
    const draftQ = [0.92, 0.85, 0.88, 0.90];
    const result = computeMultiTokenParallelAcceptance(targetP, draftQ);

    expect(result.aMulti).toBe(4.0);
    expect(result.meanAcceptancePct).toBe(100.0);
    expect(result.velocityMultiplier).toBe(5.0);
    expect(result.candidates).toHaveLength(4);
  });

  it('accurately computes divergence penalty when draft distribution Q diverges from target P', () => {
    const targetP = [0.45, 0.30, 0.20, 0.15];
    const draftQ = [0.90, 0.60, 0.80, 0.60];
    // Ratios: 0.5, 0.5, 0.25, 0.25 -> sum = 1.50
    const result = computeMultiTokenParallelAcceptance(targetP, draftQ);

    expect(result.aMulti).toBe(1.5);
    expect(result.meanAcceptancePct).toBe(37.5);
    expect(result.velocityMultiplier).toBe(2.5);
    expect(result.klDivergenceNats).toBeGreaterThan(0);
  });

  it('rejects out-of-range or mismatched probability distributions', () => {
    expect(() => computeMultiTokenParallelAcceptance([], [])).toThrow();
    expect(() => computeMultiTokenParallelAcceptance([0.5, 0.6], [0.5])).toThrow();
    expect(() => computeMultiTokenParallelAcceptance([0.0], [0.5])).toThrow();
    expect(() => computeMultiTokenParallelAcceptance([1.2], [0.5])).toThrow();
  });

  it('initializes 8 hardware verification streams (X0..X7) with locked ring synchronization', () => {
    const streams = buildInitialStreams(SyntheticCorridorId.ALPHA);
    expect(streams).toHaveLength(8);
    expect(streams[0].streamCode).toBe('X0');
    expect(streams[0].pointerHex).toBe('0xF000');
    expect(streams[3].streamCode).toBe('X3');
    expect(streams[3].pointerHex).toBe('0xF030');
    expect(streams[3].acceptanceRatePct).toBe(96.5);
    expect(streams[3].ringSyncPct).toBe(100);
  });

  it('performs deterministic sub-microsecond buffer pointer rotation', () => {
    const rotated = rotateStreamPointerHex('0xF030', 1);
    expect(rotated).toBe('0xF034');
  });

  it('enforces GridSync Zero-Trust Zod payload sanitization against SQLi and XSS', () => {
    const validPayload = sanitizeVerificationPayload({
      corridorId: SyntheticCorridorId.ALPHA,
      streamIndex: 3,
      commandTag: 'STEP_PARALLEL_VERIFY',
      targetProbs: [0.94, 0.91, 0.89],
      draftProbs: [0.95, 0.92, 0.90],
    });
    expect(validPayload.streamIndex).toBe(3);

    expect(() =>
      sanitizeVerificationPayload({
        corridorId: SyntheticCorridorId.ALPHA,
        streamIndex: 3,
        commandTag: 'DROP TABLE verification_streams;',
        targetProbs: [0.94],
        draftProbs: [0.95],
      })
    ).toThrow();

    expect(() =>
      sanitizeVerificationPayload({
        corridorId: SyntheticCorridorId.ALPHA,
        streamIndex: 3,
        commandTag: '<script>alert(1)</script>',
        targetProbs: [0.94],
        draftProbs: [0.95],
      })
    ).toThrow();
  });
});
