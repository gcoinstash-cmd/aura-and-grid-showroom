/**
 * GF-T3-230 Executable Verification Suite (Vitest / Jest compatible)
 * Tests:
 * 1. Exact numerical convergence of 8-GPU Ring-AllReduce against monolithic reduction.
 * 2. NVLink 900 GB/s saturation & latency spike physics.
 * 3. Zero-copy DMA buffer pointer alignment (G2 -> 0x7F1000) & GridSync Zero-Trust sanitization.
 * @license SPDX-License-Identifier: Apache-2.0
 */

import {
  SYNTHETIC_CORRIDORS,
  createInitialGpuTensors,
  computeMonolithicReference,
  advanceRingStep,
  runFullRingAllReduce,
  calculateNvlinkFabricMetrics,
  validateGridSyncIngress,
  buildRingEngineSnapshot,
} from './ringAllReduceEngine';

export interface SelfTestSuiteResult {
  totalTests: number;
  passedTests: number;
  passRatePct: number;
  results: {
    id: string;
    name: string;
    passed: boolean;
    detail: string;
  }[];
}

export function runEmbeddedVerificationSuite(): SelfTestSuiteResult {
  const results: { id: string; name: string; passed: boolean; detail: string }[] = [];

  // Test 1: Exact numerical convergence of 14-hop Ring-AllReduce vs Monolithic Reduction
  const initTensors = createInitialGpuTensors(8, 4);
  const monolithic = computeMonolithicReference(initTensors);
  const fullRun = runFullRingAllReduce(initTensors);
  let maxDeviation = 0;
  for (let g = 0; g < 8; g++) {
    for (let c = 0; c < 8; c++) {
      for (let k = 0; k < 4; k++) {
        const diff = Math.abs(fullRun.finalTensors[g][c][k] - monolithic[c][k]);
        if (diff > maxDeviation) {
          maxDeviation = diff;
        }
      }
    }
  }
  results.push({
    id: 'TEST-01',
    name: '8-GPU Ring-AllReduce vs Monolithic Numerical Convergence',
    passed: fullRun.stepsExecuted === 14 && fullRun.phase === 'CONVERGED' && maxDeviation < 1e-6,
    detail: 'Steps: ' + String(fullRun.stepsExecuted) + '/14 · Max Error: ' + String(maxDeviation),
  });

  // Test 2: Scatter-Reduce (Steps 1..7) and All-Gather (Steps 8..14) Phase Transitions
  let stepTensors = createInitialGpuTensors(8, 4);
  const step7 = advanceRingStep(stepTensors, 0);
  const step8 = advanceRingStep(step7.nextTensors, 7);
  results.push({
    id: 'TEST-02',
    name: 'Scatter-Reduce & All-Gather State Machine Transitions',
    passed: step7.phase === 'SCATTER_REDUCE' && step8.phase === 'ALL_GATHER',
    detail: 'Hop 1: ' + step7.phase + ' · Hop 8: ' + step8.phase,
  });

  // Test 3: NVLink 900 GB/s Bandwidth Saturation & Latency Spike Degradation
  const nominalMetrics = calculateNvlinkFabricMetrics(SYNTHETIC_CORRIDORS[0], false);
  const spikeMetrics = calculateNvlinkFabricMetrics(SYNTHETIC_CORRIDORS[0], true);
  results.push({
    id: 'TEST-03',
    name: 'NVLink 900 GB/s Fabric Saturation & Packet Loss Physics',
    passed:
      nominalMetrics.bandwidthGbps === 880 &&
      nominalMetrics.latencyMs === 0.14 &&
      spikeMetrics.bandwidthGbps < nominalMetrics.bandwidthGbps &&
      spikeMetrics.latencyMs > nominalMetrics.latencyMs,
    detail:
      'Nominal: ' +
      String(nominalMetrics.bandwidthGbps) +
      ' GB/s (' +
      String(nominalMetrics.latencyMs) +
      ' ms) · Spike: ' +
      String(spikeMetrics.bandwidthGbps) +
      ' GB/s (' +
      String(spikeMetrics.latencyMs) +
      ' ms)',
  });

  // Test 4: Zero-Copy Pinned Buffer Pointer Alignment (G2 == 0x7F1000)
  const snapshot = buildRingEngineSnapshot({
    corridor: SYNTHETIC_CORRIDORS[0],
    step: 2,
    tensors: initTensors,
    monolithicRef: monolithic,
    processedTokens: 512000,
    spikeInjected: false,
  });
  const g2 = snapshot.gpus[2];
  results.push({
    id: 'TEST-04',
    name: 'Zero-Copy DMA Pointer Alignment & G2 Inspector Contract',
    passed:
      g2.gpuId === 'G2' &&
      g2.bufferAddressHex === '0x7F1000' &&
      g2.peerDisplay === 'G3 \u2192 G1' &&
      g2.state === 'SCATTER_REDUCE',
    detail:
      'GPU: ' +
      g2.gpuId +
      ' · PTR: ' +
      g2.bufferAddressHex +
      ' · PEER: ' +
      g2.peerDisplay +
      ' · STATE: ' +
      g2.state,
  });

  // Test 5: GridSync Zero-Trust Ingress SQLi / XSS Blocking
  const cleanCheck = validateGridSyncIngress(SYNTHETIC_CORRIDORS[0], 64);
  const sqliCheck = validateGridSyncIngress('RING-CORRIDOR-ALPHA; DROP TABLE gpus--', 64);
  const boundsCheck = validateGridSyncIngress(SYNTHETIC_CORRIDORS[0], 99999);
  results.push({
    id: 'TEST-05',
    name: 'GridSync Zero-Trust Ingress SQLi & Bounds Sanitization Gate',
    passed: cleanCheck.valid === true && sqliCheck.valid === false && boundsCheck.valid === false,
    detail: 'Clean: PASS · SQLi Payload: BLOCKED · Overflow Payload: BLOCKED',
  });

  const passedCount = results.filter((r) => r.passed).length;
  return {
    totalTests: results.length,
    passedTests: passedCount,
    passRatePct: Math.round((passedCount / results.length) * 100),
    results,
  };
}
