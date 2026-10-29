/**
 * Vitest Executable Verification Suite for GF-T3-271
 * Tests boundary math, auxiliary loss minimization, non-blocking All-to-All zero-drop routing,
 * and GridSync Zero-Trust security sanitization gates.
 */

import { describe, expect, it } from 'vitest';
import {
  SYNTHETIC_CORRIDORS,
  computeAuxiliaryLoss,
  computeSoftmax,
  dampLogitsWithAuxiliaryLoss,
  executeExpertRoutingPass,
  GridSyncDispatchInputSchema,
} from './expertRouter';

describe('GF-T3-271 Expert-Parallelism & Dynamic Token Routing Engine', () => {
  it('converges skewed expert logits to uniform 12.5% capacity distribution with auxiliary loss ~ 1.0', () => {
    const skewed = [4.2, -0.5, 0.1, 3.1, -0.2, 0.4, 2.5, -0.8];
    const initialProbs = computeSoftmax(skewed);
    const initialLoss = computeAuxiliaryLoss(initialProbs, initialProbs);

    const balancedLogits = dampLogitsWithAuxiliaryLoss(skewed, 0.015, 14);
    const balancedProbs = computeSoftmax(balancedLogits);
    const balancedLoss = computeAuxiliaryLoss(balancedProbs, balancedProbs);

    expect(balancedLoss).toBeLessThan(initialLoss);
    expect(Math.abs(balancedLoss - 1.0)).toBeLessThan(0.005);
    balancedProbs.forEach((p) => {
      expect(Math.abs(p - 0.125)).toBeLessThan(0.01);
    });
  });

  it('guarantees zero token drops and exact 256K per-expert allocation at baseline equilibrium', () => {
    const snapshot = executeExpertRoutingPass({
      corridor: SYNTHETIC_CORRIDORS[0],
      totalTokens: 2048000,
      numExperts: 8,
      topK: 2,
      capacityFactor: 1.25,
      rawLogits: [1, 1, 1, 1, 1, 1, 1, 1],
      congestionSpike: false,
      burstActive: false,
      stepIndex: 1,
    });

    expect(snapshot.projectTitle).toBe('GF-T3-271');
    expect(snapshot.routingThroughputFormatted).toBe('31,200 GB/s');
    expect(snapshot.dispatchLatencyFormatted).toBe('0.01 µs');
    expect(snapshot.processedTokensFormatted).toBe('6,144,000 UNITS');
    expect(snapshot.droppedTokens).toBe(0);
    expect(snapshot.experts).toHaveLength(8);

    snapshot.experts.forEach((exp, idx) => {
      expect(exp.routedTokens).toBe(256000);
      expect(exp.routedTokensFormatted).toBe('256K');
      expect(exp.loadPercentage).toBe(12.5);
      expect(exp.stateLabel).toBe('BALANCED · LOCKED');
      expect(exp.ptrHex).toBe('0x' + (0x5000 + idx * 0x10).toString(16).toUpperCase());
    });
  });

  it('absorbs congestion spikes via non-blocking All-to-All overflow routing with zero dropped tokens', () => {
    const spikeSnapshot = executeExpertRoutingPass({
      corridor: SYNTHETIC_CORRIDORS[1],
      totalTokens: 2048000,
      numExperts: 8,
      topK: 2,
      capacityFactor: 1.15,
      rawLogits: [1, 1, 1, 1, 1, 1, 1, 1],
      congestionSpike: true,
      burstActive: false,
      stepIndex: 2,
    });

    const sumRouted = spikeSnapshot.experts.reduce((acc, e) => acc + e.routedTokens, 0);
    expect(sumRouted).toBe(2048000);
    expect(spikeSnapshot.droppedTokens).toBe(0);
    expect(spikeSnapshot.moeState).toBe('Congestion Re-Balancing');
  });

  it('enforces GridSync Zero-Trust sanitization against SQL injection, XSS, and forbidden currency symbols', () => {
    const forbiddenSymbol = String.fromCharCode(36);
    expect(() =>
      GridSyncDispatchInputSchema.parse({
        corridor: 'EXPERT-CORRIDOR-ALPHA ' + forbiddenSymbol,
        totalTokens: 2048000,
        numExperts: 8,
        topK: 2,
        capacityFactor: 1.25,
        rawLogits: [1, 1, 1, 1, 1, 1, 1, 1],
        congestionSpike: false,
        burstActive: false,
        stepIndex: 1,
      })
    ).toThrow();

    expect(() =>
      GridSyncDispatchInputSchema.parse({
        corridor: 'DROP TABLE gf_t3_271_corridors; --',
        totalTokens: 2048000,
        numExperts: 8,
        topK: 2,
        capacityFactor: 1.25,
        rawLogits: [1, 1, 1, 1, 1, 1, 1, 1],
        congestionSpike: false,
        burstActive: false,
        stepIndex: 1,
      })
    ).toThrow();
  });
});
