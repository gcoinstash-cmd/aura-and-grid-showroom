/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from "vitest";
import {
  CorridorType,
  SYNTHETIC_PIPELINE_CORRIDORS,
  calculateLayerFlops,
  calculateStagePartitionCost,
  calculate1F1BBubblePercent,
  calculateP2PTensorForwardLatencyUs,
  evaluatePipelinePartitionState,
  createInitialPayload,
  sanitizeGridSyncInput,
} from "./pipelinePartitionEngine";
import { SUPABASE_POSTGRES_SCHEMA_SQL } from "./sqlSchema";

describe("GF-T3-277 Multi-GPU Pipeline Partitioning & Layer-Wise Tensor Sharding Suite", () => {
  it("verifies initial 8-stage balanced partition telemetry and exact HUD baseline metrics", () => {
    const initialPayload = createInitialPayload();
    const state = evaluatePipelinePartitionState(initialPayload);

    expect(state.throughputFormatted).toBe("36,000 GB/s");
    expect(state.stagingLatencyFormatted).toBe("0.01 µs");
    expect(state.activeStagesCount).toBe(8);
    expect(state.totalStagesCount).toBe(8);
    expect(state.processedTokensFormatted).toBe("6,912,000 UNITS");
    expect(state.engineXpFormatted).toBe("+75.0k ENGINE XP");
    expect(state.pipelineStateLabel).toBe("Pipeline State: Partition Active");
    expect(state.stages).toHaveLength(8);

    // Check P0 and P3 exact stage specifications
    expect(state.stages[0].titleLabel).toBe("Stage 0 (P0)");
    expect(state.stages[0].hexPtr).toBe("0xB000");
    expect(state.stages[0].tokensLabel).toBe("TOK: 256K");
    expect(state.stages[0].layersLabel).toBe("LAYERS: L0-L4");
    expect(state.stages[0].latencyLabel).toBe("0.02ms");
    expect(state.stages[0].statusText).toBe("BALANCED · LOCKED");

    expect(state.stages[3].stageCode).toBe("P3");
    expect(state.stages[3].hexPtr).toBe("0xB030");
    expect(state.stages[3].layersLabel).toBe("LAYERS: L12-L16");
    expect(state.stages[3].syncPercent).toBe(100);
  });

  it("verifies layer-wise pipeline stage sharding FLOPs and NVLink bandwidth cost equation", () => {
    const flops4k = calculateLayerFlops(4096, 2048, 4);
    const flops8k = calculateLayerFlops(8192, 4096, 4);
    expect(flops8k).toBeGreaterThan(flops4k * 4);

    const alphaCost = calculateStagePartitionCost(4, 8192, 4096, 36000, 1.0);
    const deltaCost = calculateStagePartitionCost(4, 8192, 4096, 9600, 1.0);
    expect(alphaCost).toBeGreaterThan(0);
    expect(deltaCost).toBeGreaterThan(alphaCost * 3.5);

    expect(() => calculateStagePartitionCost(4, 8192, 4096, 0)).toThrow();
  });

  it("verifies 1F1B micro-batch schedule bubble reduction and non-blocking P2P forwarding", () => {
    const bubble8 = calculate1F1BBubblePercent(8, 8);
    const bubble32 = calculate1F1BBubblePercent(8, 32);
    const bubble64 = calculate1F1BBubblePercent(8, 64);

    expect(bubble64).toBeLessThan(bubble32);
    expect(bubble32).toBeLessThan(bubble8);
    expect(calculate1F1BBubblePercent(1, 32)).toBe(0);

    const p2pNonBlocking = calculateP2PTensorForwardLatencyUs(8192, 4096, 36000, true);
    const p2pBlocking = calculateP2PTensorForwardLatencyUs(8192, 4096, 36000, false);
    expect(p2pNonBlocking).toBe(0.01);
    expect(p2pBlocking).toBeGreaterThan(p2pNonBlocking);
  });

  it("verifies stage imbalance spike injection and micro-batch re-routing across neighboring stages", () => {
    const base = createInitialPayload();
    const spiked = evaluatePipelinePartitionState({
      ...base,
      imbalanceSpikeActive: true,
      imbalanceTargetStage: 3,
    });

    expect(spiked.imbalanceSpikeActive).toBe(true);
    expect(spiked.activeStagesCount).toBe(7);
    expect(spiked.pipelineStateLabel).toBe("Pipeline State: Micro-Batch Re-Routing");
    expect(spiked.stages[3].isBalanced).toBe(false);
    expect(spiked.stages[3].statusText).toContain("FAULT");
    expect(spiked.stages[3].pipeHealth).toBe("REROUTE");
    expect(spiked.balanceParityPct).toBeLessThan(100);
  });

  it("enforces GridSync zero-trust Zod payload sanitization against SQLi and XSS vectors", () => {
    const base = createInitialPayload();
    expect(() =>
      sanitizeGridSyncInput({
        ...base,
        customTag: "DROP TABLE pipeline_partition_runs; --",
      })
    ).toThrow();

    expect(() =>
      sanitizeGridSyncInput({
        ...base,
        customTag: "<script>alert(1)</script>",
      })
    ).toThrow();

    expect(() =>
      sanitizeGridSyncInput({
        ...base,
        numStages: 99,
      })
    ).toThrow();
  });

  it("enforces absolute zero-dollar gate across all corridors, telemetry outputs, and SQL schema", () => {
    const forbiddenChar = String.fromCharCode(36); // ASCII 36
    for (const corridor of SYNTHETIC_PIPELINE_CORRIDORS) {
      expect(corridor.includes(forbiddenChar)).toBe(false);
      const state = evaluatePipelinePartitionState({
        ...createInitialPayload(),
        corridor,
      });
      const serialized = JSON.stringify(state);
      expect(serialized.includes(forbiddenChar)).toBe(false);
    }
    expect(SUPABASE_POSTGRES_SCHEMA_SQL.includes(forbiddenChar)).toBe(false);
  });
});
