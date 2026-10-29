/**
 * Executable Test Suite for GF-T3-236 FlashAttention Ring-Block Scale & Causal Mask Engine
 * Verifies:
 * 1. Numerical equivalence between online tiled softmax and standard O(N^2) attention.
 * 2. Dynamic causal mask upper-triangular tile skipping.
 * 3. Shared memory staging, bandwidth saturation, and Zero-Trust GridSync sanitization.
 */

import {
  SYNTHETIC_FLASH_CORRIDORS,
  computeBlockWiseOnlineSoftmax,
  computeStandardAttentionON2,
  generateDeterministicQKV,
  runFlashAttentionCockpitPass,
  sanitizeGridSyncInput,
} from "./flashAttentionEngine";

export interface TestCaseResult {
  name: string;
  passed: boolean;
  detail: string;
}

export function runSelfContainedVerificationSuite(): {
  total: number;
  passed: number;
  passRatePct: number;
  results: TestCaseResult[];
} {
  const results: TestCaseResult[] = [];

  // Test 1: Numerical Equivalence (Causal Active)
  {
    const { Q, K, V } = generateDeterministicQKV(32, 32, 0);
    const online = computeBlockWiseOnlineSoftmax(Q, K, V, 8, true, false, false);
    const standard = computeStandardAttentionON2(Q, K, V, true);
    let maxDiff = 0;
    for (let i = 0; i < 32; i++) {
      for (let d = 0; d < 32; d++) {
        const diff = Math.abs(online.output[i][d] - standard[i][d]);
        if (diff > maxDiff) maxDiff = diff;
      }
    }
    results.push({
      name: "Online Softmax vs O(N^2) Causal Equivalence",
      passed: maxDiff < 1e-9,
      detail: "Max numerical drift: " + maxDiff.toExponential(3) + " (Threshold < 1e-9)",
    });
  }

  // Test 2: Numerical Equivalence (Dense Unmasked)
  {
    const { Q, K, V } = generateDeterministicQKV(24, 16, 1);
    const online = computeBlockWiseOnlineSoftmax(Q, K, V, 6, false, false, false);
    const standard = computeStandardAttentionON2(Q, K, V, false);
    let maxDiff = 0;
    for (let i = 0; i < 24; i++) {
      for (let d = 0; d < 16; d++) {
        const diff = Math.abs(online.output[i][d] - standard[i][d]);
        if (diff > maxDiff) maxDiff = diff;
      }
    }
    results.push({
      name: "Online Softmax vs O(N^2) Unmasked Equivalence",
      passed: maxDiff < 1e-9 && online.skippedTiles === 0,
      detail: "Max drift: " + maxDiff.toExponential(3) + " · Skipped tiles: " + String(online.skippedTiles),
    });
  }

  // Test 3: Causal Mask Upper-Triangular Tile Omission
  {
    const { Q, K, V } = generateDeterministicQKV(64, 64, 0);
    const online = computeBlockWiseOnlineSoftmax(Q, K, V, 8, true, false, false);
    // 8x8 tile grid = 64 tiles total; 36 lower-triangular + diagonal evaluated, 28 upper-triangular skipped
    const passed = online.evaluatedTiles === 36 && online.skippedTiles === 28;
    results.push({
      name: "Causal Mask Upper-Triangular Tile Omission",
      passed,
      detail:
        "Evaluated: " +
        String(online.evaluatedTiles) +
        " tiles · Skipped: " +
        String(online.skippedTiles) +
        " upper-triangular tiles (43.8% saved)",
    });
  }

  // Test 4: Canonical Block B3 Telemetry & Scale Factor
  {
    const state = runFlashAttentionCockpitPass({
      corridor: SYNTHETIC_FLASH_CORRIDORS[0],
      causalEnabled: true,
      contextSpillFault: false,
      burstActive: false,
      flushed: false,
      stepPassCount: 0,
    });
    const b3 = state.blocks[3];
    const passed =
      state.attentionBandwidthGbs === 2100 &&
      state.kernelLatencyUs === 0.09 &&
      state.activeBlocks === 16 &&
      b3.blockId === "B3" &&
      b3.tileCoords[0] === 64 &&
      b3.tileCoords[1] === 64 &&
      b3.scaleFactor === 0.125;
    results.push({
      name: "SRAM Ring Staging & Block B3 [64, 64] Lock",
      passed,
      detail:
        "B3 Tile: [" +
        String(b3.tileCoords[0]) +
        ", " +
        String(b3.tileCoords[1]) +
        "] · Scale: " +
        b3.scaleFactor.toFixed(4) +
        " · BW: " +
        state.bandwidthFormatted,
    });
  }

  // Test 5: GridSync Security Gate & Zero-Dollar Gate
  {
    let sqliBlocked = false;
    let currencyBlocked = false;
    try {
      sanitizeGridSyncInput("FLASH-CORRIDOR-ALPHA; DROP TABLE flash_kernel_runs;--");
    } catch {
      sqliBlocked = true;
    }
    try {
      sanitizeGridSyncInput("INVALID_CURRENCY_\x24_PAYLOAD");
    } catch {
      currencyBlocked = true;
    }
    results.push({
      name: "GridSync Zero-Trust SQLi & Zero-Dollar Gate",
      passed: sqliBlocked && currencyBlocked,
      detail: "SQLi payload rejected · Forbidden symbol rejected",
    });
  }

  const passedCount = results.filter((r) => r.passed).length;
  return {
    total: results.length,
    passed: passedCount,
    passRatePct: Math.round((passedCount / results.length) * 100),
    results,
  };
}
