/**
 * Executable Verification Test Suite for GF-T3-252 Speculative Decoding Engine
 * SPDX-License-Identifier: MIT
 */

import {
  SYNTHETIC_CORRIDORS,
  buildInitialDraftLanes,
  buildInitialTelemetry,
  computeAcceptanceProbability,
  computeOptimalDraftWindowK,
  computeResidualDistribution,
  computeSpeculativeSpeedup,
  executeSpeculativePass,
  logitsToProbabilities,
  sanitizeGridSyncPayload,
} from './speculativeCore';

export interface TestCaseResult {
  id: string;
  name: string;
  category: 'ACCEPTANCE_MATH' | 'RESIDUAL_SAMPLING' | 'WINDOW_SCALING' | 'ZERO_TRUST_SECURITY';
  passed: boolean;
  assertionDetail: string;
}

export function runEmbeddedVerificationSuite(): {
  total: number;
  passed: number;
  passRatePct: number;
  results: TestCaseResult[];
} {
  const results: TestCaseResult[] = [];

  // Test 1: Parallel acceptance probability cap at 1.0 when p(x) >= q(x)
  const acc1 = computeAcceptanceProbability(0.94, 0.82);
  results.push({
    id: 'T1',
    name: 'Parallel Acceptance Cap min(1, p/q)',
    category: 'ACCEPTANCE_MATH',
    passed: acc1 === 1.0,
    assertionDetail: 'min(1.0, 0.94 / 0.82) === ' + acc1.toFixed(2),
  });

  // Test 2: Fractional acceptance ratio when p(x) < q(x)
  const acc2 = computeAcceptanceProbability(0.45, 0.90);
  results.push({
    id: 'T2',
    name: 'Fractional Acceptance Ratio p(x)/q(x)',
    category: 'ACCEPTANCE_MATH',
    passed: acc2 === 0.5,
    assertionDetail: '0.45 / 0.90 === ' + acc2.toFixed(2),
  });

  // Test 3: Residual distribution normalization on draft token rejection
  const resDist = computeResidualDistribution([0.55, 0.25, 0.15, 0.05], [0.15, 0.45, 0.25, 0.15]);
  const resSum = resDist.reduce((a, b) => a + b, 0);
  results.push({
    id: 'T3',
    name: 'Residual Rejection Sampling Normalization',
    category: 'RESIDUAL_SAMPLING',
    passed: resDist[0] === 1.0 && Math.abs(resSum - 1.0) < 1e-4,
    assertionDetail: 'p_res = [' + resDist.join(', ') + '] (sum=' + resSum.toFixed(2) + ')',
  });

  // Test 4: Softmax logit normalization
  const probs = logitsToProbabilities([1.41, 1.45, 1.42, 1.44]);
  const probSum = probs.reduce((a, b) => a + b, 0);
  results.push({
    id: 'T4',
    name: 'Target Logit Softmax Probability Parity',
    category: 'RESIDUAL_SAMPLING',
    passed: probs.length === 4 && Math.abs(probSum - 1.0) < 0.002,
    assertionDetail: 'sum(softmax([1.41, 1.45, 1.42, 1.44])) === ' + probSum.toFixed(4),
  });

  // Test 5: Speculative Speedup validation & compute bubble elimination
  const speedup = computeSpeculativeSpeedup(5, 0.824, 0.074);
  results.push({
    id: 'T5',
    name: 'Speculative Speedup Factor Validation (K=5)',
    category: 'WINDOW_SCALING',
    passed: speedup === 2.85,
    assertionDetail: 'S(K=5, alpha=0.824, c=0.074) === ' + speedup.toFixed(2) + 'x',
  });

  // Test 6: Dynamic window scaling increases K on high acceptance
  const winUp = computeOptimalDraftWindowK(5, 0.92, 0.038);
  results.push({
    id: 'T6',
    name: 'Dynamic Window Scaling Depth Expansion',
    category: 'WINDOW_SCALING',
    passed: winUp.nextDepthK > 5 && winUp.optimalSpeedupX > 2.85,
    assertionDetail: 'K: 5 -> ' + winUp.nextDepthK + ' (Speedup ' + winUp.optimalSpeedupX + 'x)',
  });

  // Test 7: GridSync Zero-Trust SQLi & Forbidden Glyph Gate
  const sqliCheck = sanitizeGridSyncPayload('D0; DROP TABLE draft_lanes;--');
  const glyphCheck = sanitizeGridSyncPayload('TokenCost' + String.fromCharCode(36) + '100');
  const cleanCheck = sanitizeGridSyncPayload('SPECULATIVE-CORRIDOR-ALPHA');
  results.push({
    id: 'T7',
    name: 'GridSync Zero-Trust SQLi & Currency Scrub',
    category: 'ZERO_TRUST_SECURITY',
    passed: !sqliCheck.valid && !glyphCheck.valid && cleanCheck.valid,
    assertionDetail:
      'SQLi=' + sqliCheck.violation + ' · Glyph=' + glyphCheck.violation + ' · Clean=OK',
  });

  // Test 8: Full 8-Lane Parallel Pipeline Step Execution
  const initLanes = buildInitialDraftLanes();
  const initTel = buildInitialTelemetry();
  const stepped = executeSpeculativePass(
    initLanes,
    initTel,
    1,
    SYNTHETIC_CORRIDORS[0],
    false
  );
  results.push({
    id: 'T8',
    name: '8-Lane Draft-Target Parallel Pass Invariant',
    category: 'ACCEPTANCE_MATH',
    passed:
      stepped.nextLanes.length === 8 &&
      stepped.nextTelemetry.processedTokens > initTel.processedTokens,
    assertionDetail:
      'Lanes=' +
      stepped.nextLanes.length +
      ' · Tokens=' +
      stepped.nextTelemetry.processedTokens.toLocaleString(),
  });

  const passedCount = results.filter((r) => r.passed).length;
  return {
    total: results.length,
    passed: passedCount,
    passRatePct: Math.round((passedCount / results.length) * 1000) / 10,
    results,
  };
}
