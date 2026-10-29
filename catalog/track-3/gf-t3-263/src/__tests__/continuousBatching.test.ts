/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Vitest Executable Test Suite for GF-T3-263 Continuous Batching & In-Flight Expansion Engine
 */

import { describe, expect, it } from 'vitest';
import {
  CORRIDOR_PROFILES,
  GridSyncIngressSchema,
  SUPABASE_RLS_SCHEMA_SQL,
  SYNTHETIC_CORRIDORS,
  calculateInFlightBatchExpansion,
  createInitialEngineState,
  flushBatchBuffersAndReset,
  sanitizeZeroDollarText,
  stepIterativeSchedulingPass,
  switchBatchCorridor,
  toggleRequestQueueSpike,
  triggerContinuousBatchBurst,
} from '../engine/continuousBatchingEngine';

describe('GF-T3-263 Continuous Batching & In-Flight Expansion Suite', () => {
  it('1. verifies initial state strictly conforms to 25,000 GB/s, 0.01 us, and 8/8 active slots', () => {
    const state = createInitialEngineState();
    expect(state.throughputGbs).toBe(25000);
    expect(state.schedulerLatencyUs).toBe(0.01);
    expect(state.activeSlotsCount).toBe(8);
    expect(state.maxSlotsCount).toBe(8);
    expect(state.processedTokens).toBe(4736000);
    expect(state.engineXpK).toBe(75.0);
    expect(state.batchStateLabel).toBe('In-Flight Active');
    expect(state.slots).toHaveLength(8);
    expect(state.slots[0].hexPtr).toBe('0xC000');
    expect(state.slots[3].hexPtr).toBe('0xC300');
  });

  it('2. verifies in-flight batch expansion conservation math (N_active = N_retained + N_admitted)', () => {
    // Full turnover case: 8 active, 4 completed evicted, 4 incoming admitted -> 8 active
    const fullRefill = calculateInFlightBatchExpansion(8, 4, 10, 8);
    expect(fullRefill.completedEvicted).toBe(4);
    expect(fullRefill.retainedInFlight).toBe(4);
    expect(fullRefill.incomingAdmitted).toBe(4);
    expect(fullRefill.nextActiveSlots).toBe(8);
    expect(fullRefill.remainingQueueDepth).toBe(6);
    expect(fullRefill.utilizationRatio).toBe(1.0);

    // Partial refill boundary case: 8 active, 6 completed, only 3 incoming waiting -> 5 active
    const partialRefill = calculateInFlightBatchExpansion(8, 6, 3, 8);
    expect(partialRefill.completedEvicted).toBe(6);
    expect(partialRefill.retainedInFlight).toBe(2);
    expect(partialRefill.incomingAdmitted).toBe(3);
    expect(partialRefill.nextActiveSlots).toBe(5);
    expect(partialRefill.remainingQueueDepth).toBe(0);
  });

  it('3. verifies iterative token scheduling pass increments tokens and maintains 8/8 slot lock', () => {
    const initial = createInitialEngineState();
    const stepped = stepIterativeSchedulingPass(initial, 6);
    expect(stepped.iterationPass).toBe(initial.iterationPass + 1);
    expect(stepped.activeSlotsCount).toBe(8);
    expect(stepped.processedTokens).toBeGreaterThan(initial.processedTokens);
    expect(stepped.engineXpK).toBeGreaterThan(initial.engineXpK);
  });

  it('4. verifies continuous batch burst and request queue spike state transitions', () => {
    const initial = createInitialEngineState();
    const burst = triggerContinuousBatchBurst(initial);
    expect(burst.burstActive).toBe(true);
    expect(burst.throughputGbs).toBe(25000);
    expect(burst.schedulerLatencyUs).toBe(0.01);
    expect(burst.slots.every((s) => s.latencyMs === 0.01)).toBe(true);

    const spiked = toggleRequestQueueSpike(burst);
    expect(spiked.spikeActive).toBe(true);
    expect(spiked.slots.some((s) => s.queueTag === 'RE-ALLOC')).toBe(true);

    const flushed = flushBatchBuffersAndReset();
    expect(flushed.spikeActive).toBe(false);
    expect(flushed.processedTokens).toBe(4736000);
  });

  it('5. verifies synthetic continuous batching corridor switching and zero-trust sanitization', () => {
    const initial = createInitialEngineState();
    const bravo = switchBatchCorridor(initial, SYNTHETIC_CORRIDORS[1]);
    expect(bravo.corridor).toBe(SYNTHETIC_CORRIDORS[1]);
    expect(bravo.throughputGbs).toBe(CORRIDOR_PROFILES[SYNTHETIC_CORRIDORS[1]].peakBandwidthGbs);

    expect(() => sanitizeZeroDollarText('SELECT * FROM slots; DROP TABLE batch_corridors;--')).toThrow();

    const parsed = GridSyncIngressSchema.parse({
      corridor: SYNTHETIC_CORRIDORS[0],
      incomingRequests: 8,
      completedRequests: 4,
      operatorNote: 'Nominal pass verified',
    });
    expect(parsed.incomingRequests).toBe(8);
  });

  it('6. enforces absolute zero-dollar character gate across serialized state and SQL schema', () => {
    const state = createInitialEngineState();
    const serialized = JSON.stringify(state) + SUPABASE_RLS_SCHEMA_SQL;
    const forbiddenDollar = String.fromCharCode(36);
    expect(serialized.includes(forbiddenDollar)).toBe(false);
  });
});
