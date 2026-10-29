/**
 * GF-T3-224 Executable Vitest Verification Suite
 * Verifies numerical equivalence, clockwise ring chunk accumulation order,
 * GridSync zero-trust Zod sanitization, and ring desync fault recovery.
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from 'vitest';
import {
  GridSyncPayloadSchema,
  computeSingleNodeReferenceReduce,
  createInitialSimulationState,
  executeFullAllReduceCycle,
  injectBusThrottleAndDesync,
  stepRingAllReduceState,
} from './tensorEngine';

describe('GF-T3-224 Tensor-Parallel Ring All-Reduce Engine', () => {
  it('1. verifies numerical equivalence between sharded Ring All-Reduce and single-node reference reduce', () => {
    const initial = createInitialSimulationState('TP-CORRIDOR-ALPHA');
    const reference = computeSingleNodeReferenceReduce(
      initial.ranks.map((r) => r.initialActivations)
    );

    const synchronizedState = executeFullAllReduceCycle(initial);
    expect(synchronizedState.phase).toBe('LOCKED');
    expect(synchronizedState.currentStep).toBe(6);

    for (const rank of synchronizedState.ranks) {
      const flatValues = rank.chunks.flatMap((c) => c.values);
      expect(flatValues.length).toBe(reference.length);
      for (let i = 0; i < reference.length; i++) {
        expect(flatValues[i]).toBeCloseTo(reference[i], 5);
      }
      expect(rank.parityHash).toBe(synchronizedState.ranks[0].parityHash);
    }
  });

  it('2. verifies exact clockwise bucket accumulation order across Scatter-Reduce and All-Gather steps', () => {
    let state = createInitialSimulationState('TP-CORRIDOR-ALPHA');
    const reference = computeSingleNodeReferenceReduce(
      state.ranks.map((r) => r.initialActivations)
    );

    // Execute 3 Scatter-Reduce steps for N = 4
    for (let step = 0; step < 3; step++) {
      state = stepRingAllReduceState(state);
      expect(state.phase).toBe('SCATTER-REDUCE');
      for (const link of state.activeLinks) {
        expect(link.toRank).toBe((link.fromRank + 1) % 4);
      }
    }

    // After Scatter-Reduce (step 3), Rank r holds the fully reduced partition at chunk (r + 1) % 4
    for (let r = 0; r < 4; r++) {
      const reducedChunkIdx = (r + 1) % 4;
      const chunk = state.ranks[r].chunks[reducedChunkIdx];
      expect(chunk.isFullyReduced).toBe(true);
      expect(chunk.accumulatedCount).toBe(4);
      const expectedSlice = reference.slice(
        reducedChunkIdx * 4,
        (reducedChunkIdx + 1) * 4
      );
      expect(chunk.values).toEqual(expectedSlice);
    }

    // Execute 3 All-Gather steps
    for (let step = 0; step < 3; step++) {
      state = stepRingAllReduceState(state);
    }
    expect(state.phase).toBe('LOCKED');
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        expect(state.ranks[r].chunks[c].isFullyReduced).toBe(true);
      }
    }
  });

  it('3. verifies zero memory drift and ring desync recovery after bus fault injection', () => {
    const initial = executeFullAllReduceCycle(
      createInitialSimulationState('TP-CORRIDOR-GAMMA')
    );
    const baselineHash = initial.ranks[0].parityHash;

    const faulted = injectBusThrottleAndDesync(initial, 2);
    expect(faulted.phase).toBe('FAULT');
    expect(faulted.parityStatus).toBe('DRIFT FAULT');
    expect(faulted.ranks[2].packetDropFault).toBe(true);
    expect(faulted.ranks[2].parityHash).not.toBe(baselineHash);

    const recovered = executeFullAllReduceCycle({
      ...faulted,
      busThrottled: false,
    });
    expect(recovered.phase).toBe('LOCKED');
    expect(recovered.parityStatus).toBe('OK');
    for (const rank of recovered.ranks) {
      expect(rank.parityHash).toBe(baselineHash);
    }
  });

  it('4. enforces GridSync zero-trust Zod payload sanitization', () => {
    const valid = GridSyncPayloadSchema.safeParse({
      corridorId: 'TP-CORRIDOR-ALPHA',
      worldSize: 4,
      tensorUnits: 128000,
      busThrottleRatio: 1.0,
      commOverlapEnabled: true,
      commandNote: 'EXECUTE_RING_SYNC',
    });
    expect(valid.success).toBe(true);

    const malicious = GridSyncPayloadSchema.safeParse({
      corridorId: 'TP-CORRIDOR-ALPHA',
      worldSize: 4,
      tensorUnits: 128000,
      busThrottleRatio: 1.0,
      commOverlapEnabled: true,
      commandNote: 'DROP TABLE ring_all_reduce_runs; --',
    });
    expect(malicious.success).toBe(false);
  });
});
