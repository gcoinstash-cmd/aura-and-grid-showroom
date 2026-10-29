/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Executable Vitest Suite for GF-T3-279 Speculative Tree Sharding & Candidate Scoring Engine
 */

import { describe, it, expect } from "vitest";
import {
  SYNTHETIC_CORRIDORS,
  computeBatchedTreeVerification,
  buildEngineTelemetrySnapshot,
  sanitizeGridSyncPayload,
} from "./speculativeTreeEngine";

describe("GF-T3-279 Speculative Tree Sharding & Candidate Scoring Engine", () => {
  it("computes batched tree speculative verification V_tree = max_k sum log P correctly", () => {
    const matrix = [
      [-0.08, -0.07, -0.09, -0.08, -0.08, -0.07, -0.09, -0.08],
      [-0.03, -0.04, -0.03, -0.04, -0.03, -0.04, -0.03, -0.04],
      [-0.12, -0.11, -0.13, -0.10, -0.12, -0.11, -0.13, -0.10],
    ];
    const res = computeBatchedTreeVerification(matrix, -1.5);
    expect(res.winningBranchIndex).toBe(1);
    expect(res.winningBranchId).toBe("T1");
    expect(res.vTreeMaxScore).toBeCloseTo(-0.28, 2);
    expect(res.verifiedFlags).toEqual([true, true, true]);
    expect(res.totalAcceptedTokens).toBe(24);
    expect(res.speedupMultiplier).toBe(3);
  });

  it("prunes diverging draft branches when log-probability drops below threshold", () => {
    const matrix = [
      [-0.05, -0.06, -3.5, -0.05],
      [-0.04, -0.05, -0.04, -0.05],
    ];
    const res = computeBatchedTreeVerification(matrix, -2.0);
    expect(res.acceptedDepths).toEqual([2, 4]);
    expect(res.verifiedFlags).toEqual([false, true]);
    expect(res.winningBranchIndex).toBe(1);
  });

  it("rejects empty or positive log-probability inputs at mathematical boundary", () => {
    expect(() => computeBatchedTreeVerification([])).toThrow();
    expect(() => computeBatchedTreeVerification([[]])).toThrow();
    expect(() => computeBatchedTreeVerification([[0.5, -0.1]])).toThrow();
  });

  it("generates exact baseline GF-T3-279 telemetry snapshot across 8 branches (T0..T7)", () => {
    const snap = buildEngineTelemetrySnapshot({
      corridor: SYNTHETIC_CORRIDORS[0],
      stepCounter: 0,
      burstLevel: 0,
      divergenceSpikeActive: false,
    });

    expect(snap.throughputGbs).toBe(37600);
    expect(snap.throughputFormatted).toBe("37,600 GB/s");
    expect(snap.latencyFormatted).toBe("0.01 µs");
    expect(snap.activeBranchesCount).toBe(8);
    expect(snap.processedTokensUnits).toBe(7168000);
    expect(snap.processedTokensFormatted).toBe("7,168,000 UNITS");
    expect(snap.engineXpFormatted).toBe("+75.0k ENGINE XP");
    expect(snap.treeStateLabel).toBe("Tree State: Verification Active");
    expect(snap.candidateVector).toEqual([4.11, 4.15, 4.12, 4.14]);
    expect(snap.branches).toHaveLength(8);
    expect(snap.branches[0].title).toBe("Branch 0 (T0)");
    expect(snap.branches[0].hexPtr).toBe("0xD000");
    expect(snap.branches[3].hexPtr).toBe("0xD030");
    expect(snap.branches[0].tokensK).toBe(256);
    expect(snap.branches[0].depthLabel).toBe("D-8");
  });

  it("handles divergence spike fault injection and branch re-pruning", () => {
    const snap = buildEngineTelemetrySnapshot({
      corridor: SYNTHETIC_CORRIDORS[0],
      stepCounter: 1,
      burstLevel: 1,
      divergenceSpikeActive: true,
    });

    expect(snap.activeBranchesCount).toBe(6);
    expect(snap.branches[2].verified).toBe(false);
    expect(snap.branches[2].statusText).toContain("FAULT");
    expect(snap.branches[5].verified).toBe(false);
    expect(snap.branches[0].verified).toBe(true);
  });

  it("enforces GridSync Zero-Trust Zod sanitization against SQLi and XSS payloads", () => {
    expect(() =>
      sanitizeGridSyncPayload({
        corridor: SYNTHETIC_CORRIDORS[0],
        stepCounter: 0,
        burstLevel: 0,
        divergenceSpikeActive: false,
        customNote: "normal_telemetry_tag",
      })
    ).not.toThrow();

    expect(() =>
      sanitizeGridSyncPayload({
        corridor: SYNTHETIC_CORRIDORS[0],
        stepCounter: 0,
        burstLevel: 0,
        divergenceSpikeActive: false,
        customNote: "DROP TABLE gf_t3_279_tree_runs;--",
      })
    ).toThrow();

    expect(() =>
      sanitizeGridSyncPayload({
        corridor: SYNTHETIC_CORRIDORS[0],
        stepCounter: 0,
        burstLevel: 0,
        divergenceSpikeActive: false,
        customNote: "<script>alert(1)</script>",
      })
    ).toThrow();
  });
});
