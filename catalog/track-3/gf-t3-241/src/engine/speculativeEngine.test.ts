/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from "vitest";
import {
  SPEC_CORRIDORS,
  advanceSpeculativeSimulation,
  buildTreeCausalMask,
  computeAcceptanceRatio,
  computeKvPointerRollback,
  computeResidualDistribution,
  createInitialTelemetryState,
  sanitizeGridSyncPayload,
  verifyDistributionParity,
} from "./speculativeEngine";

describe("GF-T3-241 Speculative Decoding & Tree Attention Verification Suite", () => {
  it("computes target-draft acceptance criterion alpha = min(1, P_target / P_draft) accurately", () => {
    expect(computeAcceptanceRatio(0.85, 0.70)).toBe(1.0);
    expect(computeAcceptanceRatio(0.45, 0.90)).toBeCloseTo(0.5, 5);
    expect(computeAcceptanceRatio(0.0, 0.65)).toBe(0.0);
    expect(() => computeAcceptanceRatio(0.5, 0.0)).toThrow();
    expect(() => computeAcceptanceRatio(-0.1, 0.5)).toThrow();
  });

  it("proves exact distribution parity between speculative sampling and target autoregressive decoding", () => {
    const targetDist = [0.44, 0.26, 0.16, 0.09, 0.05];
    const draftDist = [0.20, 0.38, 0.22, 0.12, 0.08];

    const parity = verifyDistributionParity(targetDist, draftDist);
    expect(parity.maxAbsError).toBeLessThan(1e-9);
    parity.speculativeDist.forEach((pSpec, idx) => {
      expect(pSpec).toBeCloseTo(parity.normalizedTargetDist[idx], 9);
    });
  });

  it("matches greedy one-hot autoregressive decoding distribution with zero loss", () => {
    const greedyTarget = [0, 0, 1, 0];
    const draft = [0.25, 0.25, 0.25, 0.25];
    const parity = verifyDistributionParity(greedyTarget, draft);
    expect(parity.maxAbsError).toBeLessThan(1e-9);
    expect(parity.speculativeDist[2]).toBeCloseTo(1.0, 9);
  });

  it("validates non-flat tree attention causal mask shape and prevents cross-branch leakage", () => {
    // 0: root, 1->2: Branch A, 3->4: Branch B
    const parents = [-1, 0, 1, 0, 3];
    const mask = buildTreeCausalMask(parents);

    expect(mask.length).toBe(5);
    expect(mask[0]).toEqual([1, 0, 0, 0, 0]);
    expect(mask[2]).toEqual([1, 1, 1, 0, 0]);
    expect(mask[4]).toEqual([1, 0, 0, 1, 1]);

    // Cycle detection
    expect(() => buildTreeCausalMask([1, 0])).toThrow();
  });

  it("executes dynamic KV cache pointer rollback under partial and full draft rejection", () => {
    const partial = computeKvPointerRollback(0x8500, 4, 3, 0x100);
    expect(partial.allocatedTipPointer).toBe(0x8900);
    expect(partial.restoredCommitPointer).toBe(0x8800);
    expect(partial.restoredHex).toBe("0x8800");
    expect(partial.reclaimedSlots).toBe(1);

    const fullRollback = computeKvPointerRollback(0x8800, 4, 0, 0x100);
    expect(fullRollback.restoredCommitPointer).toBe(0x8800);
    expect(fullRollback.reclaimedSlots).toBe(4);
  });

  it("enforces GridSync Zero-Trust Zod payload sanitization against SQLi and XSS vectors", () => {
    const clean = sanitizeGridSyncPayload({
      action: "VERIFY_BURST",
      corridor: SPEC_CORRIDORS[0],
      branchId: 3,
      operatorNote: "Telemetry pass verified",
    });
    expect(clean.action).toBe("VERIFY_BURST");

    expect(() =>
      sanitizeGridSyncPayload({
        action: "STEP_TREE",
        operatorNote: "DROP TABLE spec_corridors; --",
      })
    ).toThrow();

    expect(() =>
      sanitizeGridSyncPayload({
        action: "STEP_TREE",
        operatorNote: "<script>evil()</script>",
      })
    ).toThrow();
  });

  it("transitions state deterministically across burst, entropy spike, step, and flush triggers", () => {
    const initial = createInitialTelemetryState();
    expect(initial.branches).toHaveLength(8);
    expect(initial.branches[0].draftCount).toBe(4);
    expect(initial.branches[0].alpha).toBe(0.94);
    expect(initial.branches[3].tokens).toEqual(["t82", "t19", "t44"]);
    expect(initial.branches[3].alpha).toBe(0.892);
    expect(initial.branches[3].kvRollbackPointerHex).toBe("0x8800");

    const spiked = advanceSpeculativeSimulation(initial, "TOGGLE_SPIKE");
    expect(spiked.entropySpikeActive).toBe(true);
    expect(spiked.specState).toBe("Rollback Guard");
    expect(spiked.activeBranches).toBeLessThan(8);

    const flushed = advanceSpeculativeSimulation(spiked, "FLUSH_TOKENS");
    expect(flushed.entropySpikeActive).toBe(false);
    expect(flushed.activeBranches).toBe(8);
    expect(flushed.verificationSpeed).toBe(6400);
  });
});
