/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Executable Vitest Suite for GF-T3-233 Asynchronous Kernel Stream Concurrency
 * & Priority Scheduler Engine.
 */

import { describe, expect, it } from 'vitest';
import {
  calculateSchedulerLatencyUs,
  computeDeterministicEventHex,
  createInitialEngineState,
  flushStreamQueues,
  formatInspectorStrip,
  stepAsyncEventCycle,
  switchStreamCorridor,
  togglePreemptionAndInjectConflict,
  triggerConcurrencyBurst,
} from './streamScheduler';
import {
  STREAM_CORRIDORS,
  isCleanHexFlag,
  isCleanIdentifier,
  sanitizeKernelDispatch,
} from './validation';

describe('GF-T3-233 Asynchronous Stream Concurrency & Priority Scheduler Suite', () => {
  it('initializes canonical 16-stream baseline state with exact telemetry invariants', () => {
    const state = createInitialEngineState();
    expect(state.activeStreamsCount).toBe(16);
    expect(state.totalStreamsCount).toBe(16);
    expect(state.schedulerLatencyUs).toBe(0.18);
    expect(state.processedTokens).toBe(896000);
    expect(state.streams).toHaveLength(16);

    const stream3 = state.streams[3];
    expect(formatInspectorStrip(stream3)).toBe(
      'S3 · HIGH · ATTN_DECODE · EVT: 0x7F91_E200 · ACTIVE'
    );
  });

  it('computes deterministic non-blocking event hex flags without random state', () => {
    const flagA = computeDeterministicEventHex(3, 1, 0);
    const flagB = computeDeterministicEventHex(3, 1, 0);
    const flagC = computeDeterministicEventHex(4, 2, 1);

    expect(flagA).toBe('0x7F91_E200');
    expect(flagA).toBe(flagB);
    expect(flagC).not.toBe(flagA);
    expect(isCleanHexFlag(flagC)).toBe(true);
  });

  it('executes asynchronous event cycles and advances token counters monotonically', () => {
    const initial = createInitialEngineState();
    const stepped = stepAsyncEventCycle(initial);

    expect(stepped.cycleCount).toBe(2);
    expect(stepped.processedTokens).toBeGreaterThan(initial.processedTokens);
    expect(stepped.streamXpDelta).toBeGreaterThan(initial.streamXpDelta);
    expect(stepped.schedulerLatencyUs).toBeGreaterThanOrEqual(0.11);
    expect(stepped.schedulerLatencyUs).toBeLessThanOrEqual(0.5);
  });

  it('dispatches 16-stream concurrency burst and validates all payloads via GridSync', () => {
    const initial = createInitialEngineState();
    const burst = triggerConcurrencyBurst(initial);

    expect(burst.activeStreamsCount).toBe(16);
    expect(burst.processedTokens).toBeGreaterThan(initial.processedTokens + 100000);
    expect(burst.streams.every((s) => s.utilizationPct === 99)).toBe(true);
    expect(burst.lastSanitizationStatus).toContain('GRIDSYNC_BURST_OK');
  });

  it('toggles preemption mode and resolves or exposes inter-stream KV barrier contention', () => {
    const initial = createInitialEngineState();
    const faulted = togglePreemptionAndInjectConflict(initial);

    expect(faulted.preemptionEnabled).toBe(false);
    expect(faulted.streams[2].barrierState).toBe('FAULT');
    expect(faulted.streams[5].barrierState).toBe('FAULT');
    expect(faulted.schedulerLatencyUs).toBeGreaterThan(initial.schedulerLatencyUs);

    const resolved = togglePreemptionAndInjectConflict(faulted);
    expect(resolved.preemptionEnabled).toBe(true);
    expect(resolved.streams[2].barrierState).toBe('LOCKED');
    expect(resolved.schedulerLatencyUs).toBeLessThan(faulted.schedulerLatencyUs);
  });

  it('flushes stream queues and restores baseline 0.18 us latency', () => {
    const burst = triggerConcurrencyBurst(createInitialEngineState());
    const flushed = flushStreamQueues(burst);

    expect(flushed.schedulerLatencyUs).toBe(0.18);
    expect(flushed.processedTokens).toBe(896000);
    expect(flushed.streams[3].eventSyncFlag).toBe('0x7F91_E200');
  });

  it('switches synthetic stream corridors and adjusts priority scheduling envelopes', () => {
    const initial = createInitialEngineState();
    const deltaCorridor = switchStreamCorridor(initial, STREAM_CORRIDORS[3]);

    expect(deltaCorridor.corridor).toBe(STREAM_CORRIDORS[3]);
    expect(deltaCorridor.streams[0].barrierState).toBe('LOCKED');
    expect(
      calculateSchedulerLatencyUs(
        deltaCorridor.streams,
        deltaCorridor.preemptionEnabled,
        deltaCorridor.corridor
      )
    ).toBeGreaterThan(0.18);
  });

  it('blocks SQL injection and XSS vectors in GridSync ingress sanitization gate', () => {
    expect(isCleanIdentifier('ATTN_DECODE')).toBe(true);
    expect(isCleanIdentifier('DROP TABLE gf_t3_233_stream_lanes;--')).toBe(false);
    expect(isCleanIdentifier('<script>alert(1)</script>')).toBe(false);

    const malicious = sanitizeKernelDispatch(
      {
        streamId: 3,
        priority: 'HIGH',
        kernelName: 'ATTN_DECODE; DROP TABLE lanes;--',
        tokenUnits: 4096,
        eventDependencyFlag: '0x7F91_E200',
        kvBlockIndex: 12,
        corridor: STREAM_CORRIDORS[0],
      },
      1
    );
    expect(malicious.ok).toBe(false);
    expect(malicious.error).toContain('GRIDSYNC_INGRESS_REJECT');
  });
});
