/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from "vitest";
import {
  BASE_W0_MATRIX,
  GridSyncWarmSwapPayloadSchema,
  SYNTHETIC_CORRIDORS,
  buildDeterministicAdapterMatrices,
  computeLoRAWarmWeights,
  createInitialEngineState,
  executeWarmSwapBurst,
  flushSwapArenas,
  multiply4x4Matrices,
  sanitizeGridSyncString,
  stepAtomicPointerFlipPass,
  toggleAdapterCyclingSpike,
} from "../loraWarmSwapEngine";
import { SUPABASE_POSTGRES_SCHEMA_SQL } from "../sqlSchema";

describe("GF-T3-278 Continuous LoRA Parameter Warm-Swapping & Dual-Buffer Engine", () => {
  it("computes exact 4x4 matrix multiplication and W_warm = W_0 + (alpha/r)*B_next*A_next", () => {
    const { bNext, aNext } = buildDeterministicAdapterMatrices(0, 0);
    const product = multiply4x4Matrices(bNext, aNext);
    expect(product.length).toBe(4);
    expect(product[0].length).toBe(4);

    const { wWarm, diag } = computeLoRAWarmWeights(BASE_W0_MATRIX, bNext, aNext, 32, 16);
    // Scale = 32 / 16 = 2.0
    const expected00 = Number((BASE_W0_MATRIX[0][0] + 2.0 * product[0][0]).toFixed(4));
    expect(wWarm[0][0]).toBeCloseTo(expected00, 4);
    expect(diag.length).toBe(4);
    expect(diag[0]).toBeGreaterThan(4.0);
  });

  it("rejects non-positive rank or alpha values in boundary checks", () => {
    const { bNext, aNext } = buildDeterministicAdapterMatrices(1, 1);
    expect(() => computeLoRAWarmWeights(BASE_W0_MATRIX, bNext, aNext, 32, 0)).toThrow();
    expect(() => computeLoRAWarmWeights(BASE_W0_MATRIX, bNext, aNext, 0, 16)).toThrow();
  });

  it("executes lock-free dual-buffer warm-swap burst and swaps active/standby pointers across K0..K7", () => {
    const initial = createInitialEngineState();
    expect(initial.adapters[0].hexPtr).toBe("0xC000");
    expect(initial.adapters[0].standbyPtr).toBe("0xD000");
    expect(initial.adapters[0].activeBank).toBe("BANK_A");

    const afterBurst = executeWarmSwapBurst(initial);
    expect(afterBurst.totalPointerFlips).toBe(8);
    expect(afterBurst.adapters[0].hexPtr).toBe("0xD000");
    expect(afterBurst.adapters[0].standbyPtr).toBe("0xC000");
    expect(afterBurst.adapters[0].activeBank).toBe("BANK_B");
    expect(afterBurst.stagingLatencyUs).toBeLessThanOrEqual(0.02);
    expect(afterBurst.processedTokens).toBe(7552000);
  });

  it("toggles rapid adapter cycling spike (dual-buffer ping-pong) and maintains 100% sync coherence", () => {
    const initial = createInitialEngineState();
    const spiked = toggleAdapterCyclingSpike(initial);
    expect(spiked.cyclingSpikeActive).toBe(true);
    expect(spiked.swapState).toBe("Ping-Pong Spike");
    expect(spiked.swapThroughputGbps).toBeGreaterThanOrEqual(36800);
    expect(spiked.adapters.every((a) => a.syncPct === 100)).toBe(true);

    const recovered = toggleAdapterCyclingSpike(spiked);
    expect(recovered.cyclingSpikeActive).toBe(false);
    expect(recovered.swapState).toBe("Warm Active");
  });

  it("steps atomic pointer flip pass for a targeted adapter slot without disturbing neighbor pointers", () => {
    const initial = createInitialEngineState();
    const stepped = stepAtomicPointerFlipPass(initial, 3);
    expect(stepped.selectedAdapterIndex).toBe(3);
    expect(stepped.adapters[3].hexPtr).toBe("0xD030");
    expect(stepped.adapters[3].activeBank).toBe("BANK_B");
    expect(stepped.adapters[0].hexPtr).toBe("0xC000");
    expect(stepped.adapters[0].activeBank).toBe("BANK_A");
  });

  it("flushes swap arenas and re-zeros dual buffers to deterministic baseline", () => {
    const initial = createInitialEngineState();
    const mutated = executeWarmSwapBurst(toggleAdapterCyclingSpike(initial));
    const flushed = flushSwapArenas(mutated);
    expect(flushed.totalPointerFlips).toBe(0);
    expect(flushed.processedTokens).toBe(7040000);
    expect(flushed.globalPtr).toBe("0xBF8DC0");
    expect(flushed.adapters[3].hexPtr).toBe("0xC030");
  });

  it("enforces GridSync Zero-Trust Zod sanitization against SQLi, XSS, and ASCII 36 character", () => {
    const { bNext, aNext } = buildDeterministicAdapterMatrices(2, 1);
    const valid = GridSyncWarmSwapPayloadSchema.safeParse({
      adapterIndex: 2,
      alpha: 32,
      rank: 16,
      corridor: SYNTHETIC_CORRIDORS[0],
      tenantTag: "CLEAN_TENANT_SLOT_K2",
      bNext,
      aNext,
    });
    expect(valid.success).toBe(true);

    const sqlInjection = GridSyncWarmSwapPayloadSchema.safeParse({
      adapterIndex: 2,
      alpha: 32,
      rank: 16,
      corridor: SYNTHETIC_CORRIDORS[0],
      tenantTag: "K2; DROP TABLE gf_t3_278_adapters --",
      bNext,
      aNext,
    });
    expect(sqlInjection.success).toBe(false);

    const char36 = String.fromCharCode(36);
    const cleaned = sanitizeGridSyncString("TOK: 256K " + char36 + "100 <script>evil()</script>");
    expect(cleaned.includes(char36)).toBe(false);
    expect(cleaned.includes("<script>")).toBe(false);
  });

  it("verifies zero ASCII 36 characters in initial state, logs, and PostgreSQL schema", () => {
    const char36 = String.fromCharCode(36);
    const snapshotJson = JSON.stringify(createInitialEngineState());
    expect(snapshotJson.includes(char36)).toBe(false);
    expect(SUPABASE_POSTGRES_SCHEMA_SQL.includes(char36)).toBe(false);
  });
});
