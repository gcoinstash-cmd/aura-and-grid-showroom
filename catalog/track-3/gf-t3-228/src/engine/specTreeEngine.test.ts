/**
 * Vitest Executable Verification Suite for GF-T3-228
 * SPDX-License-Identifier: MIT
 * Tests:
 * 1. Numerical equivalence of unified tree-attention verification vs serial sequential inference.
 * 2. Speculative acceptance logic under varying confidence thresholds.
 * 3. Dynamic branch pruning when candidate confidence falls below tolerance.
 * 4. GridSync Zero-Trust Zod sanitization against SQLi/XSS payloads.
 */

import { describe, expect, it } from 'vitest';
import {
  buildTreeAttentionMask,
  computeParallelTreeVerificationProbs,
  computeSerialSequentialVerificationProbs,
  GridSyncIngressSchema,
  NodeStatus,
  runSpeculativeTreeCycle,
  SpecCorridor,
} from './specTreeEngine';

describe('GF-T3-228 Speculative Tree Decoding & Verification Kernel', () => {
  it('proves numerical equivalence between parallel tree-attention verification and serial sequential inference', () => {
    const result = runSpeculativeTreeCycle({
      rootToken: 'def',
      corridor: SpecCorridor.ALPHA,
      pruningEnabled: true,
      pruningThreshold: 0.72,
      temperature: 0.8,
      lowConfidenceDivergence: false,
      burstMode: false,
      stepSeed: 228,
      verificationPhase: 'VERIFIED',
    });

    const mask = buildTreeAttentionMask(result.allNodes);
    const parallelProbs = computeParallelTreeVerificationProbs(result.allNodes, mask, 0.8);
    const serialProbs = computeSerialSequentialVerificationProbs(result.allNodes, 0.8);

    expect(parallelProbs.length).toBe(12);
    expect(serialProbs.length).toBe(12);
    for (let i = 0; i < 12; i++) {
      expect(Math.abs(parallelProbs[i] - serialProbs[i])).toBeLessThan(1e-7);
    }
    expect(result.numericalEquivalenceDelta).toBe(0);
  });

  it('enforces causal lower-triangular ancestry invariants on the 12x12 tree attention mask', () => {
    const result = runSpeculativeTreeCycle({
      rootToken: 'forward',
      corridor: SpecCorridor.ALPHA,
      pruningEnabled: true,
      pruningThreshold: 0.72,
      temperature: 0.8,
      lowConfidenceDivergence: false,
      burstMode: false,
      stepSeed: 228,
      verificationPhase: 'VERIFIED',
    });

    const mask = result.attentionMaskMatrix;
    expect(mask.length).toBe(12);
    for (let i = 0; i < 12; i++) {
      expect(mask[i][i]).toBe(1);
      expect(mask[i][0]).toBe(1);
      for (let j = i + 1; j < 12; j++) {
        expect(mask[i][j]).toBe(0);
      }
    }
  });

  it('verifies speculative acceptance rate under varying confidence thresholds', () => {
    const permissive = runSpeculativeTreeCycle({
      rootToken: 'attn_kernel',
      corridor: SpecCorridor.ALPHA,
      pruningEnabled: true,
      pruningThreshold: 0.52,
      temperature: 0.8,
      lowConfidenceDivergence: false,
      burstMode: false,
      stepSeed: 228,
      verificationPhase: 'VERIFIED',
    });

    const strict = runSpeculativeTreeCycle({
      rootToken: 'attn_kernel',
      corridor: SpecCorridor.ALPHA,
      pruningEnabled: true,
      pruningThreshold: 0.91,
      temperature: 0.8,
      lowConfidenceDivergence: false,
      burstMode: false,
      stepSeed: 228,
      verificationPhase: 'VERIFIED',
    });

    expect(permissive.acceptedCount).toBeGreaterThanOrEqual(strict.acceptedCount);
    expect(permissive.speculativeSpeedup).toBeGreaterThanOrEqual(strict.speculativeSpeedup);
  });

  it('triggers dynamic branch pruning when low-confidence divergence is injected', () => {
    const nominal = runSpeculativeTreeCycle({
      rootToken: 'def',
      corridor: SpecCorridor.ALPHA,
      pruningEnabled: true,
      pruningThreshold: 0.72,
      temperature: 0.8,
      lowConfidenceDivergence: false,
      burstMode: false,
      stepSeed: 228,
      verificationPhase: 'VERIFIED',
    });

    const divergent = runSpeculativeTreeCycle({
      rootToken: 'def',
      corridor: SpecCorridor.BRAVO,
      pruningEnabled: true,
      pruningThreshold: 0.72,
      temperature: 0.8,
      lowConfidenceDivergence: true,
      burstMode: false,
      stepSeed: 228,
      verificationPhase: 'VERIFIED',
    });

    const prunedCount = divergent.level2Leaves.filter((n) => n.status === NodeStatus.PRUNED_REJECTED).length;
    expect(prunedCount).toBeGreaterThan(0);
    expect(divergent.acceptedCount).toBeLessThan(nominal.acceptedCount);
  });

  it('blocks SQL injection and XSS payloads via GridSync Zero-Trust Zod sanitization', () => {
    expect(() =>
      GridSyncIngressSchema.parse({
        rootToken: 'def; DROP TABLE spec_verification_runs;--',
        corridor: SpecCorridor.ALPHA,
        pruningEnabled: true,
        pruningThreshold: 0.72,
        temperature: 0.8,
        lowConfidenceDivergence: false,
        burstMode: false,
        stepSeed: 228,
        verificationPhase: 'VERIFIED',
      })
    ).toThrow();
  });
});
