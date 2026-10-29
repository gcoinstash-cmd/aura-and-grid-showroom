import { describe, expect, it } from 'vitest';
import {
  SYNTHETIC_CORRIDORS,
  computeInterconnectTelemetry,
  computeRingReduceScatterAllGather,
  createInitialFabricState,
  sanitizeFabricPayload,
  transitionFabricState,
} from '../fabricEngine';
import { GF_T3_268_POSTGRES_SCHEMA } from '../schemaSql';

describe('GF-T3-268 Tensor-Parallel Interconnect & Ring-Reduce Fabric Suite', () => {
  it('initializes baseline 8-rank state matching exact cockpit telemetry specifications', () => {
    const state = createInitialFabricState('FABRIC-CORRIDOR-ALPHA');
    expect(state.fabricThroughputGbps).toBe(28800);
    expect(state.ringLatencyUs).toBe(0.01);
    expect(state.activeRanksCount).toBe(8);
    expect(state.processedTokensUnits).toBe(5376000);
    expect(state.meshPtrHex).toBe('0x1F8DC0');
    expect(state.consensusVector).toEqual([3.01, 3.05, 3.02, 3.04]);
    expect(state.ranks).toHaveLength(8);
    expect(state.ranks[0].ptrHex).toBe('0x2000');
    expect(state.ranks[3].ptrHex).toBe('0x2030');
  });

  it('executes exact mathematical Reduce-Scatter and All-Gather consensus across 8 ranks', () => {
    const shards: [number, number, number, number][] = Array.from({ length: 8 }, () => [
      3.01, 3.05, 3.02, 3.04,
    ]);
    const res = computeRingReduceScatterAllGather(shards);
    expect(res.reduceScatterSum).toEqual([24.08, 24.4, 24.16, 24.32]);
    expect(res.allGatherConsensus).toEqual([3.01, 3.05, 3.02, 3.04]);
  });

  it('Steps synchronization pass and increments token score deterministically', () => {
    const initial = createInitialFabricState('FABRIC-CORRIDOR-ALPHA');
    const stepped = transitionFabricState(initial, {
      corridorId: 'FABRIC-CORRIDOR-ALPHA',
      action: 'STEP',
    });
    expect(stepped.stepCount).toBe(1);
    expect(stepped.processedTokensUnits).toBe(5376000 + 256000 * 8);
    expect(stepped.meshPtrHex).toBe('0x1F8E00');
  });

  it('handles Ring-Reduce Fabric Burst and Interconnect Congestion Topology Re-Routing', () => {
    const initial = createInitialFabricState('FABRIC-CORRIDOR-ALPHA');
    const burstState = transitionFabricState(initial, {
      corridorId: 'FABRIC-CORRIDOR-ALPHA',
      action: 'BURST',
    });
    expect(burstState.burstActive).toBe(true);
    expect(burstState.fabricThroughputGbps).toBeGreaterThan(28800);
    expect(burstState.ranks[0].tokensK).toBe(384);

    const congestedState = transitionFabricState(burstState, {
      corridorId: 'FABRIC-CORRIDOR-ALPHA',
      action: 'CONGESTION',
    });
    expect(congestedState.congestionActive).toBe(true);
    expect(congestedState.ranks[2].fabricHealth).toBe('FAULT');
    expect(congestedState.ranks[2].nextHopRank).toBe((2 + 3) % 8);

    const flushedState = transitionFabricState(congestedState, {
      corridorId: 'FABRIC-CORRIDOR-ALPHA',
      action: 'FLUSH',
    });
    expect(flushedState.congestionActive).toBe(false);
    expect(flushedState.burstActive).toBe(false);
    expect(flushedState.processedTokensUnits).toBe(5376000);
  });

  it('enforces GridSync Zero-Trust payload sanitization against SQLi, XSS, and schema pollution', () => {
    expect(() =>
      sanitizeFabricPayload({
        corridorId: 'FABRIC-CORRIDOR-ALPHA',
        action: 'STEP',
        operatorNote: 'DROP TABLE fabric_corridors;--',
      })
    ).toThrow(/GridSync Security Gate/);

    expect(() =>
      sanitizeFabricPayload({
        corridorId: 'FABRIC-CORRIDOR-ALPHA',
        action: 'STEP',
        operatorNote: '<script>alert(1)</script>',
      })
    ).toThrow(/GridSync Security Gate/);

    expect(() =>
      sanitizeFabricPayload({
        corridorId: 'FABRIC-CORRIDOR-ALPHA',
        action: 'SELECT_RANK',
        selectedRankIndex: 99,
      })
    ).toThrow();
  });

  it('verifies Zero-Dollar Gate compliance across all synthetic corridors and SQL schema', () => {
    const forbiddenChar = String.fromCharCode(36);
    const serializedCorridors = JSON.stringify(SYNTHETIC_CORRIDORS);
    const serializedState = JSON.stringify(createInitialFabricState('FABRIC-CORRIDOR-ALPHA'));
    expect(serializedCorridors.includes(forbiddenChar)).toBe(false);
    expect(serializedState.includes(forbiddenChar)).toBe(false);
    expect(GF_T3_268_POSTGRES_SCHEMA.includes(forbiddenChar)).toBe(false);

    const metrics = computeInterconnectTelemetry('FABRIC-CORRIDOR-GAMMA', false, false, 0);
    expect(metrics.asyncOverlapPct).toBeGreaterThanOrEqual(99.0);
  });
});
