/**
 * GF-T3-232: Executable Vitest Verification Suite
 * Verifies numerical equivalence, CPU launch overhead compression,
 * DAG topological & memory alias safety, and GridSync Zero-Trust sanitization.
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from 'vitest';
import {
  INITIAL_CAPTURED_NODES,
  applyCaptureBurst,
  applyFlushCapturedNodes,
  applyStepGraphReplay,
  applyToggleStallConflict,
  computeGraphSpeedupMetrics,
  createInitialEngineState,
  executeCapturedGraphReplayPass,
  executeEagerStreamPass,
  validateGraphTopologyAndAliases,
} from './cudaGraphEngine';
import { sanitizeBurstIngress, sanitizeNodeIngress } from './gridSyncSchema';

describe('GF-T3-232 CUDA Graph Capture & Kernel Launch Acceleration Suite', () => {
  it('1. verifies numerical equivalence between standard eager stream and captured graph replay', () => {
    const vectors = [
      [1.0, 2.0, 3.0, 4.0],
      [-1.5, 0.0, 2.25, 8.5],
      [12.4, -3.2, 6.1, 0.9, 4.4, 9.8],
    ];

    for (const vec of vectors) {
      const eagerOutput = executeEagerStreamPass(INITIAL_CAPTURED_NODES, vec);
      const replayOutput = executeCapturedGraphReplayPass(
        INITIAL_CAPTURED_NODES,
        vec,
        false
      );
      expect(eagerOutput.length).toBe(replayOutput.length);
      for (let i = 0; i < eagerOutput.length; i++) {
        expect(Math.abs(eagerOutput[i] - replayOutput[i])).toBeLessThan(1e-9);
      }
    }
  });

  it('2. verifies CPU launch overhead compression ratio (5.0 us per kernel -> 0.35 us replay, 4.85x gain)', () => {
    const metrics = computeGraphSpeedupMetrics(
      INITIAL_CAPTURED_NODES,
      'GRAPH-CORRIDOR-ALPHA (STREAM-CAPTURE-ISOLATION · 128-NODES)',
      16,
      false
    );
    expect(metrics.eagerDispatchLatencyUs).toBe(40.0);
    expect(metrics.dispatchLatencyUs).toBe(0.35);
    expect(metrics.graphSpeedupX).toBe(4.85);
    expect(metrics.eagerDispatchLatencyUs / metrics.dispatchLatencyUs).toBeGreaterThan(100);
  });

  it('3. verifies node dependency DAG topological integrity and memory alias collision detection', () => {
    const result = validateGraphTopologyAndAliases(INITIAL_CAPTURED_NODES);
    expect(result.valid).toBe(true);
    expect(result.topologicalOrder).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);

    // Concurrent sibling nodes N1 and N2 sharing identical memory alias pointer must throw
    const collidingNodes = INITIAL_CAPTURED_NODES.map((n) => ({ ...n }));
    collidingNodes[2].memoryAliasPtr = collidingNodes[1].memoryAliasPtr;
    expect(() => validateGraphTopologyAndAliases(collidingNodes)).toThrow(
      /collision/i
    );

    // Cyclic dependency between N0 and N7 must throw
    const cyclicNodes = INITIAL_CAPTURED_NODES.map((n) => ({ ...n }));
    cyclicNodes[0].parentIds = [7];
    cyclicNodes[7].childIds = [0];
    expect(() => validateGraphTopologyAndAliases(cyclicNodes)).toThrow(/Cycle/i);
  });

  it('4. verifies chaos stress triggers: capture burst, stall conflict invalidation, step replay, and flush', () => {
    const initial = createInitialEngineState();
    expect(initial.projectId).toBe('GF-T3-232');
    expect(initial.capturedNodesCount).toBe(128);
    expect(initial.selectedNodeId).toBe(3);

    const burstState = applyCaptureBurst(initial, {
      corridor: 'GRAPH-CORRIDOR-BRAVO (CPU-DISPATCH-BYPASS · ZERO-OVERHEAD)',
      subGraphClusters: 16,
      tokensPerPass: 64000,
      operatorCallsign: 'CREW_CHIEF',
    });
    expect(burstState.processedTokensUnits).toBe(832000);
    expect(burstState.graphSpeedupX).toBeGreaterThan(4.85);

    const conflictState = applyToggleStallConflict(burstState);
    expect(conflictState.stallConflictActive).toBe(true);
    expect(conflictState.streamState).toBe('STALL_CONFLICT');
    expect(conflictState.activeStreams).toBe(2);
    expect(() =>
      executeCapturedGraphReplayPass(conflictState.nodes, [1, 2, 3, 4], true)
    ).toThrow(/stall conflict/i);

    const steppedState = applyStepGraphReplay(conflictState);
    expect(steppedState.stallConflictActive).toBe(false);
    expect(steppedState.selectedNodeId).toBe(4);

    const flushedState = applyFlushCapturedNodes();
    expect(flushedState.processedTokensUnits).toBe(768000);
    expect(flushedState.dispatchLatencyUs).toBe(0.35);
    expect(flushedState.graphSpeedupX).toBe(4.85);
  });

  it('5. enforces GridSync Zero-Trust Zod sanitization against SQLi, XSS, and invalid pointers', () => {
    expect(() =>
      sanitizeBurstIngress({
        corridor: 'GRAPH-CORRIDOR-ALPHA (STREAM-CAPTURE-ISOLATION · 128-NODES)',
        subGraphClusters: 16,
        tokensPerPass: 64000,
        operatorCallsign: '<script>alert(1)</script>',
      })
    ).toThrow();

    expect(() =>
      sanitizeNodeIngress({
        ...INITIAL_CAPTURED_NODES[0],
        memoryAliasPtr: 'INVALID_PTR_DROP_TABLE',
      })
    ).toThrow();
  });
});
