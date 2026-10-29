import { describe, expect, it } from "vitest";
import {
  POSTGRES_RLS_SCHEMA_SQL,
  SYNTHETIC_CORRIDOR_LIST,
  computeContinuousBatchTokens,
  computeDynamicStepReallocation,
  computeSubMicrosecondSyncLatency,
  createInitialBatchEngineState,
  flushBatchQueuesAndReset,
  sanitizeGridSyncString,
  stepInFlightSchedulingPass,
  switchBatchCorridor,
  toggleConcurrencySpike,
  triggerContinuousBatchBurst,
  validateGridSyncPayload,
} from "./continuousBatchEngine";

describe("GF-T3-275 Continuous In-Flight Request Scheduler Engine", () => {
  it("initializes exact nominal baseline telemetry for H0-H7", () => {
    const state = createInitialBatchEngineState();
    expect(state.projectTitle).toBe("GF-T3-275");
    expect(state.batchThroughputGbps).toBe(34400);
    expect(state.schedulingLatencyUs).toBe(0.01);
    expect(state.activeBatchesCount).toBe(8);
    expect(state.totalBatchesCapacity).toBe(8);
    expect(state.processedTokensUnits).toBe(6656000);
    expect(state.engineXpK).toBe(75.0);
    expect(state.batchStateLabel).toBe("Continuous Active");
    expect(state.slots).toHaveLength(8);
    expect(state.slots[3].slotId).toBe("H3");
    expect(state.slots[3].inspectorPtr).toBe("0x9030");
    expect(state.slots[3].tokensK).toBe(256);
    expect(state.slots[3].queueReq).toBe(32);
    expect(state.slots[3].latencyMs).toBe(0.02);
    expect(state.slots[3].statusLabel).toBe("SCHEDULED · LOCKED");
  });

  it("computes continuous in-flight batch tokens accurately across edge cases", () => {
    const tokens = [256, 256, 256, 256, 256, 256, 256, 256];
    const queues = [32, 32, 32, 32, 32, 32, 32, 32];
    expect(computeContinuousBatchTokens(tokens, queues, 2)).toBe(6656000);
    expect(computeContinuousBatchTokens([], [])).toBe(0);
    expect(() => computeContinuousBatchTokens([256], [32, 32])).toThrow();
  });

  it("computes dynamic step reallocation and sub-microsecond queue sync latency", () => {
    const nominal = computeDynamicStepReallocation(256, 32, 1.0, false);
    expect(nominal.ratePct).toBe(100);
    expect(nominal.latencyMs).toBe(0.02);

    const spiked = computeDynamicStepReallocation(256, 64, 1.0, true);
    expect(spiked.ratePct).toBe(100);
    expect(spiked.latencyMs).toBe(0.06);

    expect(() => computeDynamicStepReallocation(-5, 10, 1.0, false)).toThrow();
    expect(computeSubMicrosecondSyncLatency(0.01, 8, false, 0)).toBe(0.01);
    expect(computeSubMicrosecondSyncLatency(0.01, 0, false, 0)).toBe(0.09);
  });

  it("executes continuous batch ingestion burst, concurrency spike, stepping, and flush", () => {
    const initial = createInitialBatchEngineState();
    const afterBurst = triggerContinuousBatchBurst(initial, 32, 8);
    expect(afterBurst.burstCycleCount).toBe(1);
    expect(afterBurst.processedTokensUnits).toBeGreaterThan(initial.processedTokensUnits);
    expect(afterBurst.engineXpK).toBe(79.5);

    const afterSpike = toggleConcurrencySpike(afterBurst);
    expect(afterSpike.concurrencySpikeActive).toBe(true);
    expect(afterSpike.slots[2].locked).toBe(false);
    expect(afterSpike.slots[2].statusLabel).toBe("RE-ORDER · SPIKE");

    const afterStep = stepInFlightSchedulingPass(afterSpike);
    expect(afterStep.stepPassCount).toBe(1);
    expect(afterStep.slots[0].iterationStep).toBe(3);

    const afterFlush = flushBatchQueuesAndReset();
    expect(afterFlush.processedTokensUnits).toBe(6656000);
    expect(afterFlush.concurrencySpikeActive).toBe(false);
  });

  it("switches across all 4 synthetic continuous batching corridors cleanly", () => {
    let state = createInitialBatchEngineState();
    for (const corridor of SYNTHETIC_CORRIDOR_LIST) {
      state = switchBatchCorridor(state, corridor);
      expect(state.corridor).toBe(corridor);
      expect(state.batchThroughputGbps).toBeGreaterThan(0);
    }
  });

  it("enforces GridSync zero-trust sanitization and zero-currency character gate", () => {
    expect(sanitizeGridSyncString("  CREW CHIEF  ")).toBe("CREW CHIEF");
    expect(() => sanitizeGridSyncString("DROP TABLE continuous_batch_telemetry")).toThrow();
    expect(() => sanitizeGridSyncString("<script>evil()</script>")).toThrow();
    expect(() => sanitizeGridSyncString("AMOUNT_" + String.fromCharCode(36) + "500")).toThrow();

    const validPayload = validateGridSyncPayload({
      corridor: SYNTHETIC_CORRIDOR_LIST[0],
      selectedSlotIndex: 3,
      addedTokensK: 32,
      addedRequests: 8,
      operatorCallsign: "CREW CHIEF",
    });
    expect(validPayload.selectedSlotIndex).toBe(3);

    const serializedState = JSON.stringify(createInitialBatchEngineState());
    expect(serializedState.indexOf(String.fromCharCode(36))).toBe(-1);
    expect(POSTGRES_RLS_SCHEMA_SQL.indexOf(String.fromCharCode(36))).toBe(-1);
  });
});
