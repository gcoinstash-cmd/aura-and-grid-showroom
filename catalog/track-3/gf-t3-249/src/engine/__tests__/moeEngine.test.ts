/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Executable Vitest Suite for GF-T3-249 Expert Parallelism & Top-2 Routing Engine
 */

import { describe, expect, it } from 'vitest';
import {
  MOE_CORRIDORS,
  containsMaliciousPattern,
  validateIngressPayload,
} from '../gridSync';
import {
  computeAuxiliaryLoadBalancingLoss,
  computeRouterZLoss,
  computeSoftmax,
  createInitialMoeEngineState,
  evaluateMoeRoutingPass,
  selectTop2Experts,
  verifyDispatchThroughGridSync,
} from '../moeEngine';

describe('GF-T3-249 Expert Parallelism & Switch Transformer Top-2 Routing Engine', () => {
  it('computes normalized softmax probability distributions across 8 experts', () => {
    const logits = [1.14, 1.18, 1.15, 1.29, 1.12, 1.16, 1.11, 1.17];
    const probs = computeSoftmax(logits);
    expect(probs).toHaveLength(8);
    const totalProb = probs.reduce((acc, val) => acc + val, 0);
    expect(totalProb).toBeCloseTo(1.0, 6);

    const top2 = selectTop2Experts(probs);
    expect(top2.top1Index).toBe(3);
    expect(top2.top1Gate + top2.top2Gate).toBeCloseTo(1.0, 3);
    expect(top2.top1Gate).toBeGreaterThan(top2.top2Gate);
  });

  it('calculates Switch auxiliary load balancing loss and detects expert collapse', () => {
    const uniformFractions = [0.125, 0.125, 0.125, 0.125, 0.125, 0.125, 0.125, 0.125];
    const uniformProbs = [0.125, 0.125, 0.125, 0.125, 0.125, 0.125, 0.125, 0.125];
    const balancedLoss = computeAuxiliaryLoadBalancingLoss(uniformFractions, uniformProbs, 0.0012);
    expect(balancedLoss).toBeCloseTo(0.0012, 5);

    const collapsedFractions = [1.0, 0, 0, 0, 0, 0, 0, 0];
    const collapsedProbs = [0.93, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01];
    const collapsedLoss = computeAuxiliaryLoadBalancingLoss(
      collapsedFractions,
      collapsedProbs,
      0.0012
    );
    expect(collapsedLoss).toBeGreaterThan(balancedLoss * 7);

    const zLoss = computeRouterZLoss([1.14, 1.18, 1.15, 1.16, 1.12, 1.15, 1.13, 1.17]);
    expect(zLoss).toBeGreaterThan(0);
  });

  it('enforces zero dropped tokens and capacity factor limits across routing steps', () => {
    const initial = createInitialMoeEngineState();
    expect(initial.throughputGbs).toBe(12000);
    expect(initial.routingLatencyUs).toBe(0.01);
    expect(initial.activeExperts).toBe(8);
    expect(initial.processedTokensTotal).toBe(2944000);
    expect(initial.droppedTokens).toBe(0);

    const stepped = evaluateMoeRoutingPass({
      stepCounter: 1,
      corridor: MOE_CORRIDORS[0],
      featureVector: [1.16, 1.21, 1.14, 1.19],
      currentBatchTokens: 2944,
      processedTokensTotal: initial.processedTokensTotal + 2944,
      moeXpEarned: initial.moeXpEarned + 1200,
      saturationSpikeActive: true,
      selectedExpertIndex: 3,
    });

    const sumDispatched = stepped.experts.reduce((acc, exp) => acc + exp.dispatchedTokens, 0);
    expect(sumDispatched).toBe(2944);
    expect(stepped.droppedTokens).toBe(0);
    expect(verifyDispatchThroughGridSync(stepped)).toBe(true);
  });

  it('scrubs and blocks SQLi, XSS, and prototype pollution at the GridSync ingress gate', () => {
    expect(containsMaliciousPattern('<script>alert(1)</script>')).toBe(true);
    expect(containsMaliciousPattern('SELECT * FROM moe_routing_epochs WHERE 1=1')).toBe(true);

    const maliciousResult = validateIngressPayload({
      corridor: MOE_CORRIDORS[0],
      tokenBatchCount: 2944,
      capacityFactor: 1.25,
      auxiliaryLossAlpha: 0.0012,
      featureVector: [1.14, 1.18, 1.15, 1.16],
      saturationSpikeActive: false,
      operatorCallsign: 'DROP TABLE expert_rank_telemetry; --',
    });
    expect(maliciousResult.ok).toBe(false);
  });
});
