/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Vitest Verification Suite for GF-T3-264
 * Tests:
 * 1. Dual-Stream Async concurrency and non-blocking event synchronization.
 * 2. Memory bandwidth separation between prefill and decode lanes.
 * 3. Burst saturation, fault injection, and GridSync Zero-Trust Zod sanitization.
 */

import { describe, expect, it } from 'vitest';
import {
  createInitialEngineState,
  executeEngineCommand,
  StreamExecutionMode,
  StreamLockState,
  SyntheticCorridor,
} from './dualStreamEngine';

describe('GF-T3-264 Dual-Stream Async Disaggregation Engine', () => {
  it('initializes 8 concurrent streams at 25,600 GB/s and 0.01 µs event sync latency', () => {
    const state = createInitialEngineState();
    expect(state.engineId).toBe('GF-T3-264');
    expect(state.streamThroughputGbs).toBe(25600);
    expect(state.syncLatencyUs).toBe(0.01);
    expect(state.activeStreamsCount).toBe(8);
    expect(state.processedTokens).toBe(4864000);
    expect(state.streams).toHaveLength(8);
    expect(state.streams[3].mode).toBe(StreamExecutionMode.DUAL_ASYNC);
    expect(state.streams[3].hexPtr).toBe('0xD300');
  });

  it('enforces memory bandwidth separation between prefill and decode passes', () => {
    const state = createInitialEngineState();
    const prefillStreams = state.streams.filter(
      (s) => s.mode === StreamExecutionMode.PREFILL
    );
    const decodeStreams = state.streams.filter(
      (s) => s.mode === StreamExecutionMode.DECODE
    );

    expect(prefillStreams.length).toBeGreaterThanOrEqual(2);
    expect(decodeStreams.length).toBeGreaterThanOrEqual(2);

    for (const ps of prefillStreams) {
      expect(ps.prefillBwGbs).toBeGreaterThan(ps.decodeBwGbs);
      expect(ps.prefillBwGbs + ps.decodeBwGbs).toBe(3200);
    }

    for (const ds of decodeStreams) {
      expect(ds.decodeBwGbs).toBeGreaterThan(ds.prefillBwGbs);
      expect(ds.prefillBwGbs + ds.decodeBwGbs).toBe(3200);
    }
  });

  it('executes Dual-Stream Async Burst and increases token score deterministically', () => {
    const initial = createInitialEngineState();
    const burst = executeEngineCommand(initial, {
      directive: 'INJECT_BURST',
    });

    expect(burst.streamThroughputGbs).toBe(32000);
    expect(burst.processedTokens).toBe(5376000);
    expect(burst.engineXpK).toBe(87.5);
    expect(burst.streams.every((s) => s.state === StreamLockState.LOCKED)).toBe(
      true
    );
  });

  it('injects Stream Desync Spike on M2 and M5 and recovers on Interleave Step', () => {
    const initial = createInitialEngineState();
    const spiked = executeEngineCommand(initial, {
      directive: 'TOGGLE_DESYNC',
    });

    expect(spiked.desyncSpikeActive).toBe(true);
    expect(spiked.activeStreamsCount).toBe(6);
    expect(spiked.syncLatencyUs).toBe(0.38);
    expect(spiked.streams[2].state).toBe(StreamLockState.DESYNC);
    expect(spiked.streams[5].state).toBe(StreamLockState.DESYNC);

    const recovered = executeEngineCommand(spiked, {
      directive: 'STEP_INTERLEAVE',
    });
    expect(recovered.desyncSpikeActive).toBe(false);
    expect(recovered.activeStreamsCount).toBe(8);
    expect(recovered.syncLatencyUs).toBe(0.01);
    expect(recovered.bufferParityPct).toBe(100);
  });

  it('switches synthetic corridors and recalculates fallback monolithic penalty', () => {
    const initial = createInitialEngineState();
    const deltaState = executeEngineCommand(initial, {
      directive: 'SELECT_CORRIDOR',
      corridor: SyntheticCorridor.DELTA,
    });

    expect(deltaState.corridor).toBe(SyntheticCorridor.DELTA);
    expect(deltaState.streamThroughputGbs).toBeLessThan(25600);
    expect(deltaState.syncLatencyUs).toBe(0.14);
    expect(
      deltaState.streams.every((s) => s.mode === StreamExecutionMode.MONOLITHIC)
    ).toBe(true);
  });

  it('blocks SQL injection and XSS payloads at the GridSync Zod ingress boundary', () => {
    const initial = createInitialEngineState();
    expect(() =>
      executeEngineCommand(initial, {
        directive: 'STEP_INTERLEAVE',
        operatorNote: '1; DROP TABLE gf_t3_264_stream_telemetry; --',
      })
    ).toThrow();

    expect(() =>
      executeEngineCommand(initial, {
        directive: 'STEP_INTERLEAVE',
        operatorNote: '<script>evil()</script>',
      })
    ).toThrow();
  });
});
