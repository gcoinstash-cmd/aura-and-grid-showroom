/**
 * GF-T3-246 · Executable Vitest Verification Suite (>80% Coverage Lock)
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from "vitest";
import {
  createInitialEngineState,
  calculateRooflineThroughputGbs,
  calculateKernelLaunchLatencyUs,
  calculateSlotEfficiencyPct,
  injectInFlightBatchBurst,
  toggleSlotSaturationSpike,
  stepPluginExecutionPass,
  flushSchedulerQueues,
  switchPluginCorridor,
} from "./pluginSchedulerEngine";
import {
  ALLOWED_CORRIDORS,
  sanitizeBurstIngress,
  sanitizeSequenceIngress,
  verifyZeroDollarGate,
} from "./gridSyncSanitizer";
import { GF_T3_246_POSTGRES_SCHEMA } from "./schemaSql";

describe("GF-T3-246 Custom C++ Plugin & In-Flight Batching Scheduler Suite", () => {
  it("initializes canonical cockpit telemetry with exact Track 3 specifications", () => {
    const state = createInitialEngineState();
    expect(state.workspaceTitle).toBe("GF-T3-246");
    expect(state.schedulerThroughputGbs).toBe(9800);
    expect(state.kernelLaunchLatencyUs).toBe(0.01);
    expect(state.activeSlotsCount).toBe(32);
    expect(state.totalSlotsCapacity).toBe(32);
    expect(state.processedTokensUnits).toBe(2560000);
    expect(state.pluginXpK).toBe(42.0);
    expect(state.meshPointerHex).toBe("0x9F8DC0");
    expect(state.kernelIdentifier).toBe("FUSED_ATTN");
    expect(state.meshExecutionLatencyUs).toBe(0.82);
    expect(state.queueDepth).toBe(0);
    expect(state.attentionVector).toEqual([0.99, 0.97, 0.98, 0.96]);
    expect(state.slots).toHaveLength(8);
    expect(state.slots[0].slotHeader).toBe("Slot 0 (S0)");
    expect(state.slots[0].hexPointer).toBe("0xA000");
    expect(state.slots[0].sequenceId).toBe(512);
    expect(state.slots[0].currentTokens).toBe(128);
    expect(state.slots[0].maxTokens).toBe(2048);
    expect(state.slots[0].efficiencyPct).toBe(99.9);
    expect(state.slots[0].lockStatus).toBe("LOCKED");
  });

  it("executes continuous in-flight batching bursts and reclaims completed sequence slots without bubbles", () => {
    const initial = createInitialEngineState();
    // Set Slot 0 near token limit to verify immediate in-flight slot re-indexing
    initial.slots[0].currentTokens = 1984;

    const afterBurst = injectInFlightBatchBurst(initial, 64000);
    expect(afterBurst.processedTokensUnits).toBe(2624000);
    expect(afterBurst.pluginXpK).toBe(46.0);
    expect(afterBurst.slots[0].stateLabel).toBe("REINDEXED");
    expect(afterBurst.slots[0].currentTokens).toBe(128);
    expect(afterBurst.slots[0].sequenceId).toBeGreaterThan(512);
    expect(afterBurst.slots[0].reindexedCount).toBe(1);
  });

  it("handles slot saturation spikes and recovers via plugin execution passes", () => {
    const initial = createInitialEngineState();
    const saturated = toggleSlotSaturationSpike(initial);
    expect(saturated.saturationFaultActive).toBe(true);
    expect(saturated.queueDepth).toBe(14);
    expect(saturated.schedulerThroughputGbs).toBeLessThan(9800);
    expect(saturated.kernelLaunchLatencyUs).toBeGreaterThan(0.01);
    expect(saturated.slots[2].lockStatus).toBe("FAULT");
    expect(saturated.slots[5].lockStatus).toBe("FAULT");

    // Step twice to drain queue depth (14 -> 7 -> 0)
    const pass1 = stepPluginExecutionPass(saturated);
    expect(pass1.queueDepth).toBe(7);
    const pass2 = stepPluginExecutionPass(pass1);
    expect(pass2.queueDepth).toBe(0);
    expect(pass2.saturationFaultActive).toBe(false);
    expect(pass2.schedulerThroughputGbs).toBe(9800);
    expect(pass2.slots[2].lockStatus).toBe("LOCKED");
  });

  it("switches across all 4 clean-room synthetic plugin corridors and flushes queues cleanly", () => {
    let state = createInitialEngineState();
    for (const corridor of ALLOWED_CORRIDORS) {
      state = switchPluginCorridor(state, corridor);
      expect(state.corridor).toBe(corridor);
      expect(state.schedulerThroughputGbs).toBeGreaterThan(6000);
    }
    const flushed = flushSchedulerQueues();
    expect(flushed.schedulerThroughputGbs).toBe(9800);
    expect(flushed.processedTokensUnits).toBe(2560000);
    expect(flushed.queueDepth).toBe(0);
  });

  it("enforces boundary math and GridSync Zero-Trust Zod payload sanitization", () => {
    expect(calculateRooflineThroughputGbs(9800, 0, 32, 0, false)).toBe(0);
    expect(calculateRooflineThroughputGbs(9800, 32, 0, 0, false)).toBe(0);
    expect(calculateKernelLaunchLatencyUs(0.01, 0, 0, false)).toBe(0.01);
    expect(calculateSlotEfficiencyPct(128, 0, 0, false)).toBe(0);

    const validBurst = sanitizeBurstIngress({
      sequenceCount: 8,
      burstTokens: 64000,
      sequencePrefix: "SEQ_BATCH_ALPHA",
    });
    expect(validBurst.ok).toBe(true);

    const sqliAttack = sanitizeBurstIngress({
      sequenceCount: 8,
      burstTokens: 64000,
      sequencePrefix: "SEQ; DROP TABLE slots--",
    });
    expect(sqliAttack.ok).toBe(false);

    const xssAttack = sanitizeSequenceIngress({
      sequenceId: 512,
      tokenBudget: 1024,
      targetSlotIndex: 3,
      batchTag: "<script>alert(1)</script>",
    });
    expect(xssAttack.ok).toBe(false);
  });

  it("enforces the Absolute Zero-Dollar Gate across state payloads and PostgreSQL RLS schema", () => {
    const state = createInitialEngineState();
    const serialized = JSON.stringify(state);
    expect(verifyZeroDollarGate(serialized)).toBe(true);
    expect(verifyZeroDollarGate(GF_T3_246_POSTGRES_SCHEMA)).toBe(true);
  });
});
