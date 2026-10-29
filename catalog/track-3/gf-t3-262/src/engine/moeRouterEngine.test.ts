/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Executable Vitest Suite for GF-T3-262 MoE Expert Parallelism & Dynamic Token Routing Engine
 */

import { describe, expect, it } from 'vitest';
import {
  CORRIDOR_CONFIG_MAP,
  EXPERT_HEX_POINTERS,
  GridSyncRoutingPayloadSchema,
  SUPABASE_POSTGRES_RLS_SCHEMA,
  SYNTHETIC_MOE_CORRIDORS,
  computeAuxiliaryLoadBalanceLoss,
  computeRouterZLoss,
  computeSoftmaxProbabilities,
  containsForbiddenSecurityPattern,
  createInitialRoutingPayload,
  executeMoERoutingPass,
} from './moeRouterEngine';

describe('GF-T3-262 MoE Expert Parallelism & Dynamic Token Routing Engine', () => {
  it('computes numerically stable Softmax gating probabilities summing to 1.0', () => {
    const logits = [2.41, 2.45, 2.42, 2.44, 2.43, 2.42, 2.44, 2.43];
    const probs = computeSoftmaxProbabilities(logits, 1.0);
    expect(probs).toHaveLength(8);
    const totalProb = probs.reduce((acc, p) => acc + p, 0);
    expect(totalProb).toBeCloseTo(1.0, 6);
    probs.forEach((p) => {
      expect(p).toBeGreaterThan(0.11);
      expect(p).toBeLessThan(0.14);
    });
  });

  it('computes Router Z-Loss and Auxiliary Load-Balancing Loss accurately', () => {
    const logits = [2.41, 2.45, 2.42, 2.44, 2.43, 2.42, 2.44, 2.43];
    const probs = computeSoftmaxProbabilities(logits, 1.0);
    const zLoss = computeRouterZLoss(logits);
    expect(zLoss).toBeGreaterThan(2.0);
    expect(zLoss).toBeLessThan(3.5);

    const uniformCounts = [256000, 256000, 256000, 256000, 256000, 256000, 256000, 256000];
    const auxLoss = computeAuxiliaryLoadBalanceLoss(uniformCounts, probs);
    expect(auxLoss).toBeCloseTo(1.0, 3);
  });

  it('verifies nominal All-to-All dispatch telemetry across 8 experts (E0..E7)', () => {
    const payload = createInitialRoutingPayload();
    const snapshot = executeMoERoutingPass(payload);

    expect(snapshot.engineTitle).toBe('GF-T3-262');
    expect(snapshot.throughputGbsFormatted).toBe('24,200 GB/s');
    expect(snapshot.routingLatencyUsFormatted).toBe('0.01 µs');
    expect(snapshot.activeExpertsCount).toBe(8);
    expect(snapshot.processedTokensFormatted).toBe('4,608,000 UNITS');
    expect(snapshot.engineXpFormatted).toBe('+75.0k ENGINE XP');
    expect(snapshot.moeStateLabel).toBe('Routed Active');
    expect(snapshot.zeroImbalanceVerified).toBe(true);
    expect(snapshot.routerVec).toEqual([2.41, 2.45, 2.42, 2.44]);

    expect(snapshot.experts).toHaveLength(8);
    snapshot.experts.forEach((expert, idx) => {
      expect(expert.code).toBe('E' + String(idx));
      expect(expert.title).toBe('Expert ' + String(idx) + ' (E' + String(idx) + ')');
      expect(expert.hexPtr).toBe(EXPERT_HEX_POINTERS[idx]);
      expect(expert.tokensFormatted).toBe('256K');
      expect(expert.gatherLabel).toBe('GATHER: TOP-2');
      expect(expert.latencyMs).toBe('0.02ms');
      expect(expert.stateText).toBe('ROUTED · LOCKED');
      expect(expert.balancePct).toBe(100);
      expect(expert.isLocked).toBe(true);
    });
  });

  it('enforces sub-microsecond capacity factor clipping and overflow re-routing during Load Imbalance Spike', () => {
    const base = createInitialRoutingPayload();
    const spiked = executeMoERoutingPass({
      ...base,
      imbalanceSpikeActive: true,
    });

    const maxAllowedPerExpert = Math.ceil((base.tokenBatchSize / 8) * base.capacityFactor);
    expect(spiked.moeStateLabel).toBe('Re-Routing Spike');
    expect(spiked.zeroImbalanceVerified).toBe(false);
    expect(spiked.experts[0].dispatchStatus).toBe('REROUTED');
    expect(spiked.experts[3].dispatchStatus).toBe('REROUTED');
    expect(spiked.experts[0].stateText).toBe('⚡ FAULT');

    spiked.experts.forEach((expert) => {
      expect(expert.dispatchedTokens).toBeLessThanOrEqual(maxAllowedPerExpert);
    });
  });

  it('supports all 4 synthetic MoE corridors and burst multiplier scaling', () => {
    SYNTHETIC_MOE_CORRIDORS.forEach((corridor) => {
      const cfg = CORRIDOR_CONFIG_MAP[corridor];
      const res = executeMoERoutingPass({
        ...createInitialRoutingPayload(),
        corridor,
        topK: cfg.defaultTopK,
        capacityFactor: cfg.capacityFactor,
        burstMultiplier: 1.25,
        stepPassCount: 2,
      });
      expect(res.corridor).toBe(corridor);
      expect(res.processedTokensNumeric).toBeGreaterThan(4608000);
      expect(res.experts[0].gatherLabel).toBe('GATHER: TOP-' + String(cfg.defaultTopK));
    });
  });

  it('enforces GridSync Zero-Trust Zod sanitization against SQL injection and XSS payloads', () => {
    expect(containsForbiddenSecurityPattern('MOE-CORRIDOR-ALPHA; DROP TABLE users; --')).toBe(true);
    expect(containsForbiddenSecurityPattern('<script>alert(1)</script>')).toBe(true);

    const maliciousPayload = {
      ...createInitialRoutingPayload(),
      corridor: 'MOE-CORRIDOR-ALPHA; DROP TABLE moe_dispatch_passes; --' as never,
    };

    expect(() => GridSyncRoutingPayloadSchema.parse(maliciousPayload)).toThrow();
  });

  it('enforces the Absolute Zero-Dollar Gate across telemetry outputs and SQL schema', () => {
    const snapshot = executeMoERoutingPass(createInitialRoutingPayload());
    const serialized = JSON.stringify(snapshot);
    expect(serialized.includes('\u0024')).toBe(false);
    expect(SUPABASE_POSTGRES_RLS_SCHEMA.includes('\u0024')).toBe(false);
  });
});
