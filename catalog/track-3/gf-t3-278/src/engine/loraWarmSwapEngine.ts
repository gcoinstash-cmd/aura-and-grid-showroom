/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from "zod";

export const SYNTHETIC_CORRIDORS = [
  "SWAP-CORRIDOR-ALPHA (CONTINUOUS-LORA-PARAMETER-WARM-SWAPPING-FABRIC · 36800-GB/S)",
  "SWAP-CORRIDOR-BRAVO (ZERO-DOWNTIME-ADAPTER-FABRIC-ENGINE)",
  "SWAP-CORRIDOR-GAMMA (LOCK-FREE-DUAL-BUFFER-PING-PONG-ROUTER)",
  "SWAP-CORRIDOR-DELTA (FALLBACK-STATIC-BASE-WEIGHT-PASS)",
] as const;

export type SyntheticCorridor = (typeof SYNTHETIC_CORRIDORS)[number];

export const CORRIDOR_METRICS: Record<
  SyntheticCorridor,
  { baseThroughputGbps: number; baseLatencyUs: number; smCoherenceGbps: number }
> = {
  "SWAP-CORRIDOR-ALPHA (CONTINUOUS-LORA-PARAMETER-WARM-SWAPPING-FABRIC · 36800-GB/S)": {
    baseThroughputGbps: 36800,
    baseLatencyUs: 0.01,
    smCoherenceGbps: 18400,
  },
  "SWAP-CORRIDOR-BRAVO (ZERO-DOWNTIME-ADAPTER-FABRIC-ENGINE)": {
    baseThroughputGbps: 35200,
    baseLatencyUs: 0.01,
    smCoherenceGbps: 17600,
  },
  "SWAP-CORRIDOR-GAMMA (LOCK-FREE-DUAL-BUFFER-PING-PONG-ROUTER)": {
    baseThroughputGbps: 36100,
    baseLatencyUs: 0.01,
    smCoherenceGbps: 18050,
  },
  "SWAP-CORRIDOR-DELTA (FALLBACK-STATIC-BASE-WEIGHT-PASS)": {
    baseThroughputGbps: 24600,
    baseLatencyUs: 0.02,
    smCoherenceGbps: 12300,
  },
};

export type Matrix4x4 = [
  [number, number, number, number],
  [number, number, number, number],
  [number, number, number, number],
  [number, number, number, number]
];

export interface AdapterUnitState {
  id: string;
  index: number;
  title: string;
  hexPtr: string;
  standbyPtr: string;
  activeBank: "BANK_A" | "BANK_B";
  tokensK: number;
  rank: number;
  rankLabel: string;
  alpha: number;
  latencyMs: number;
  syncPct: number;
  stateLabel: string;
  isCyclingSpike: boolean;
  wWarmMatrix: Matrix4x4;
  wWarmDiag: [number, number, number, number];
  flipsCount: number;
}

export interface RadioLogEntry {
  timestamp: string;
  callsign: "🟢 CREW CHIEF" | "🟢 TELEMETRY" | "🔴 TELEMETRY" | "⚡ PIT WALL";
  message: string;
}

export interface EngineStateSnapshot {
  corridor: SyntheticCorridor;
  globalPtr: string;
  swapThroughputGbps: number;
  stagingLatencyUs: number;
  activeAdaptersCount: number;
  totalAdaptersCount: number;
  processedTokens: number;
  engineXpK: number;
  swapState: "Warm Active" | "Ping-Pong Spike" | "Burst Locked";
  selectedAdapterIndex: number;
  cyclingSpikeActive: boolean;
  totalPointerFlips: number;
  vecSummary: [number, number, number, number];
  adapters: AdapterUnitState[];
  radioLogs: RadioLogEntry[];
}

const Row4Schema = z.tuple([
  z.number().finite().min(-64).max(64),
  z.number().finite().min(-64).max(64),
  z.number().finite().min(-64).max(64),
  z.number().finite().min(-64).max(64),
]);

export const GridSyncWarmSwapPayloadSchema = z.object({
  adapterIndex: z.number().int().min(0).max(7),
  alpha: z.number().finite().gt(0).max(512),
  rank: z.number().int().min(4).max(128),
  corridor: z.enum(SYNTHETIC_CORRIDORS),
  tenantTag: z
    .string()
    .min(2)
    .max(48)
    .refine(
      (val) => {
        const upper = val.toUpperCase();
        const forbidden = [
          "DROP TABLE",
          "UNION SELECT",
          "--",
          "<SCRIPT",
          "JAVASCRIPT:",
          "ONERROR=",
          String.fromCharCode(36),
        ];
        return !forbidden.some((token) => upper.includes(token));
      },
      { message: "GridSync Zero-Trust Gate rejected unsafe or forbidden payload sequence." }
    ),
  bNext: z.tuple([Row4Schema, Row4Schema, Row4Schema, Row4Schema]),
  aNext: z.tuple([Row4Schema, Row4Schema, Row4Schema, Row4Schema]),
});

export type GridSyncWarmSwapPayload = z.infer<typeof GridSyncWarmSwapPayloadSchema>;

/**
 * Scrubs any string against SQL injection, XSS, and the forbidden ASCII 36 character.
 */
export function sanitizeGridSyncString(rawInput: string): string {
  const char36 = String.fromCharCode(36);
  const withoutForbiddenChar = rawInput.split(char36).join("");
  return withoutForbiddenChar
    .replace(/[<>'"`;]/g, "")
    .replace(/--/g, "")
    .trim();
}

export const BASE_W0_MATRIX: Matrix4x4 = [
  [4.0, 0.02, 0.01, 0.0],
  [0.01, 4.03, 0.02, 0.01],
  [0.0, 0.01, 4.0, 0.02],
  [0.02, 0.0, 0.01, 4.02],
];

/**
 * Multiplies two 4x4 matrices B_next and A_next deterministically.
 */
export function multiply4x4Matrices(matB: Matrix4x4, matA: Matrix4x4): Matrix4x4 {
  const out: Matrix4x4 = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  for (let i = 0; i < 4; i += 1) {
    for (let j = 0; j < 4; j += 1) {
      let sum = 0;
      for (let k = 0; k < 4; k += 1) {
        sum += matB[i][k] * matA[k][j];
      }
      out[i][j] = Number(sum.toFixed(6));
    }
  }
  return out;
}

/**
 * Executes the core Lock-Free Dual-Buffer Adapter Warm-Swapping formula:
 * W_warm = W_0 + (alpha / r) * (B_next * A_next)
 */
export function computeLoRAWarmWeights(
  w0: Matrix4x4,
  bNext: Matrix4x4,
  aNext: Matrix4x4,
  alpha: number,
  rank: number
): { wWarm: Matrix4x4; diag: [number, number, number, number] } {
  if (rank <= 0) {
    throw new Error("LoRA rank r must be strictly greater than zero.");
  }
  if (alpha <= 0) {
    throw new Error("LoRA scaling alpha must be strictly greater than zero.");
  }
  const scale = alpha / rank;
  const ba = multiply4x4Matrices(bNext, aNext);
  const wWarm: Matrix4x4 = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  for (let i = 0; i < 4; i += 1) {
    for (let j = 0; j < 4; j += 1) {
      wWarm[i][j] = Number((w0[i][j] + scale * ba[i][j]).toFixed(4));
    }
  }
  const diag: [number, number, number, number] = [
    Number(wWarm[0][0].toFixed(2)),
    Number(wWarm[1][1].toFixed(2)),
    Number(wWarm[2][2].toFixed(2)),
    Number(wWarm[3][3].toFixed(2)),
  ];
  return { wWarm, diag };
}

/**
 * Generates deterministic B_next and A_next low-rank projection tiles for adapter index and step.
 */
export function buildDeterministicAdapterMatrices(
  adapterIndex: number,
  stepSeed: number
): { bNext: Matrix4x4; aNext: Matrix4x4 } {
  const offset = (adapterIndex + 1) * 0.015 + (stepSeed % 7) * 0.004;
  const bNext: Matrix4x4 = [
    [Number((0.05 + offset).toFixed(4)), 0.01, 0.0, 0.02],
    [0.01, Number((0.08 + offset).toFixed(4)), 0.02, 0.0],
    [0.02, 0.0, Number((0.06 + offset).toFixed(4)), 0.01],
    [0.0, 0.02, 0.01, Number((0.07 + offset).toFixed(4))],
  ];
  const aNext: Matrix4x4 = [
    [0.1, 0.02, 0.01, 0.0],
    [0.01, 0.12, 0.0, 0.02],
    [0.0, 0.01, 0.15, 0.01],
    [0.02, 0.0, 0.01, 0.11],
  ];
  return { bNext, aNext };
}

function formatClock(stepCounter: number): string {
  const totalCentiseconds = 104 + stepCounter * 4;
  const minutes = Math.floor(totalCentiseconds / 6000);
  const seconds = Math.floor((totalCentiseconds % 6000) / 100);
  const cs = totalCentiseconds % 100;
  const mm = minutes < 10 ? "0" + String(minutes) : String(minutes);
  const ss = seconds < 10 ? "0" + String(seconds) : String(seconds);
  const cc = cs < 10 ? "0" + String(cs) : String(cs);
  return "[" + mm + ":" + ss + "." + cc + "]";
}

export function createInitialEngineState(): EngineStateSnapshot {
  const adapters: AdapterUnitState[] = [];
  for (let i = 0; i < 8; i += 1) {
    const { bNext, aNext } = buildDeterministicAdapterMatrices(i, 0);
    const { wWarm, diag } = computeLoRAWarmWeights(BASE_W0_MATRIX, bNext, aNext, 32, 16);
    adapters.push({
      id: "K" + String(i),
      index: i,
      title: "Adapter " + String(i) + " (K" + String(i) + ")",
      hexPtr: "0xC0" + String(i) + "0",
      standbyPtr: "0xD0" + String(i) + "0",
      activeBank: "BANK_A",
      tokensK: 256,
      rank: 16,
      rankLabel: "R-16",
      alpha: 32,
      latencyMs: 0.02,
      syncPct: 100,
      stateLabel: "WARM · LOCKED",
      isCyclingSpike: false,
      wWarmMatrix: wWarm,
      wWarmDiag: i === 0 ? [4.01, 4.05, 4.02, 4.04] : diag,
      flipsCount: 0,
    });
  }

  return {
    corridor:
      "SWAP-CORRIDOR-ALPHA (CONTINUOUS-LORA-PARAMETER-WARM-SWAPPING-FABRIC · 36800-GB/S)",
    globalPtr: "0xBF8DC0",
    swapThroughputGbps: 36800,
    stagingLatencyUs: 0.01,
    activeAdaptersCount: 8,
    totalAdaptersCount: 8,
    processedTokens: 7040000,
    engineXpK: 75.0,
    swapState: "Warm Active",
    selectedAdapterIndex: 3,
    cyclingSpikeActive: false,
    totalPointerFlips: 0,
    vecSummary: [4.01, 4.05, 4.02, 4.04],
    adapters,
    radioLogs: [
      {
        timestamp: "[00:01.04]",
        callsign: "🟢 CREW CHIEF",
        message:
          "Continuous LoRA warm-swapping and dual-buffer adapter fabric engine initialized · 8 adapters linked",
      },
      {
        timestamp: "[00:01.08]",
        callsign: "🟢 TELEMETRY",
        message:
          "Lock-free background pre-staging verified at 36,800 GB/s with zero downtime",
      },
    ],
  };
}

/**
 * Trigger 1: INJECT LORA WARM-SWAP BURST
 * Pre-stages upcoming tenant LoRA weights in background VRAM arenas across all 8 adapters
 * and executes atomic pointer flips.
 */
export function executeWarmSwapBurst(state: EngineStateSnapshot): EngineStateSnapshot {
  const nextStep = state.totalPointerFlips + 1;
  const corridorSpec = CORRIDOR_METRICS[state.corridor];
  const nextAdapters: AdapterUnitState[] = state.adapters.map((unit) => {
    const nextRank = unit.rank === 16 ? 32 : 16;
    const nextAlpha = nextRank * 2;
    const { bNext, aNext } = buildDeterministicAdapterMatrices(unit.index, nextStep);
    const validated = GridSyncWarmSwapPayloadSchema.parse({
      adapterIndex: unit.index,
      alpha: nextAlpha,
      rank: nextRank,
      corridor: state.corridor,
      tenantTag: "TENANT_BURST_" + unit.id,
      bNext,
      aNext,
    });
    const { wWarm, diag } = computeLoRAWarmWeights(
      BASE_W0_MATRIX,
      validated.bNext,
      validated.aNext,
      validated.alpha,
      validated.rank
    );
    const nextBank = unit.activeBank === "BANK_A" ? "BANK_B" : "BANK_A";
    return {
      ...unit,
      hexPtr: unit.standbyPtr,
      standbyPtr: unit.hexPtr,
      activeBank: nextBank,
      tokensK: unit.tokensK + 64,
      rank: nextRank,
      rankLabel: "R-" + String(nextRank),
      alpha: nextAlpha,
      latencyMs: 0.01,
      syncPct: 100,
      stateLabel: "WARM · LOCKED",
      isCyclingSpike: false,
      wWarmMatrix: wWarm,
      wWarmDiag: diag,
      flipsCount: unit.flipsCount + 1,
    };
  });

  const newFlips = state.totalPointerFlips + 8;
  const newTokens = state.processedTokens + 512000;
  const newXp = Number((state.engineXpK + 12.5).toFixed(1));
  const throughputGbps = corridorSpec.baseThroughputGbps + ((newFlips % 4) * 150);
  const newGlobalPtr = "0xBF8D" + (192 + (newFlips % 60)).toString(16).toUpperCase();

  const log1: RadioLogEntry = {
    timestamp: formatClock(newFlips),
    callsign: "⚡ PIT WALL",
    message:
      "LoRA Warm-Swap Burst executed across K0..K7 · Dual-buffer arenas flipped to " +
      nextAdapters[0].activeBank,
  };
  const log2: RadioLogEntry = {
    timestamp: formatClock(newFlips + 1),
    callsign: "🟢 TELEMETRY",
    message:
      "Atomic pointer swap locked at " +
      throughputGbps.toLocaleString() +
      " GB/s · Staging Latency: 0.01 µs",
  };

  return {
    ...state,
    globalPtr: newGlobalPtr,
    swapThroughputGbps: throughputGbps,
    stagingLatencyUs: 0.01,
    processedTokens: newTokens,
    engineXpK: newXp,
    swapState: "Warm Active",
    cyclingSpikeActive: false,
    totalPointerFlips: newFlips,
    vecSummary: nextAdapters[state.selectedAdapterIndex].wWarmDiag,
    adapters: nextAdapters,
    radioLogs: [log1, log2, ...state.radioLogs].slice(0, 12),
  };
}

/**
 * Trigger 2: TOGGLE ADAPTER CYCLING SPIKE (Force Dual-Buffer Ping-Pong)
 */
export function toggleAdapterCyclingSpike(state: EngineStateSnapshot): EngineStateSnapshot {
  const nextSpike = !state.cyclingSpikeActive;
  const nextStep = state.totalPointerFlips + 2;
  const corridorSpec = CORRIDOR_METRICS[state.corridor];

  const nextAdapters: AdapterUnitState[] = state.adapters.map((unit) => {
    const { bNext, aNext } = buildDeterministicAdapterMatrices(unit.index, nextStep);
    const { wWarm, diag } = computeLoRAWarmWeights(
      BASE_W0_MATRIX,
      bNext,
      aNext,
      unit.alpha,
      unit.rank
    );
    return {
      ...unit,
      hexPtr: unit.standbyPtr,
      standbyPtr: unit.hexPtr,
      activeBank: unit.activeBank === "BANK_A" ? "BANK_B" : "BANK_A",
      tokensK: unit.tokensK + (nextSpike ? 128 : 32),
      latencyMs: nextSpike ? 0.03 : 0.02,
      syncPct: 100,
      stateLabel: nextSpike ? "PING-PONG · SYNC" : "WARM · LOCKED",
      isCyclingSpike: nextSpike,
      wWarmMatrix: wWarm,
      wWarmDiag: diag,
      flipsCount: unit.flipsCount + 1,
    };
  });

  const newFlips = state.totalPointerFlips + 4;
  const newTokens = state.processedTokens + (nextSpike ? 1024000 : 256000);
  const newXp = Number((state.engineXpK + (nextSpike ? 25.0 : 5.0)).toFixed(1));
  const throughputGbps = nextSpike
    ? corridorSpec.baseThroughputGbps + 1600
    : corridorSpec.baseThroughputGbps;

  const log1: RadioLogEntry = {
    timestamp: formatClock(newFlips),
    callsign: nextSpike ? "🔴 TELEMETRY" : "🟢 CREW CHIEF",
    message: nextSpike
      ? "Rapid Adapter Cycling Spike injected · Dual-Buffer Ping-Pong active across 8 VRAM banks"
      : "Adapter Cycling Spike nominalized · All 8 dual-buffer locks returned to steady Warm Active",
  };
  const log2: RadioLogEntry = {
    timestamp: formatClock(newFlips + 1),
    callsign: "⚡ PIT WALL",
    message:
      "Sub-microsecond SM cache coherence held at 100% · Swap Throughput: " +
      throughputGbps.toLocaleString() +
      " GB/s",
  };

  return {
    ...state,
    swapThroughputGbps: throughputGbps,
    stagingLatencyUs: nextSpike ? 0.02 : 0.01,
    processedTokens: newTokens,
    engineXpK: newXp,
    swapState: nextSpike ? "Ping-Pong Spike" : "Warm Active",
    cyclingSpikeActive: nextSpike,
    totalPointerFlips: newFlips,
    vecSummary: nextAdapters[state.selectedAdapterIndex].wWarmDiag,
    adapters: nextAdapters,
    radioLogs: [log1, log2, ...state.radioLogs].slice(0, 12),
  };
}

/**
 * Trigger 3: STEP ATOMIC POINTER FLIP PASS
 * Routes execution stream for the selected or next adapter slot between consecutive batch steps.
 */
export function stepAtomicPointerFlipPass(
  state: EngineStateSnapshot,
  targetAdapterIndex?: number
): EngineStateSnapshot {
  const idx =
    typeof targetAdapterIndex === "number"
      ? Math.max(0, Math.min(7, targetAdapterIndex))
      : state.selectedAdapterIndex;
  const nextStep = state.totalPointerFlips + 1;

  const nextAdapters: AdapterUnitState[] = state.adapters.map((unit, i) => {
    if (i !== idx) {
      return unit;
    }
    const { bNext, aNext } = buildDeterministicAdapterMatrices(i, nextStep);
    const { wWarm, diag } = computeLoRAWarmWeights(
      BASE_W0_MATRIX,
      bNext,
      aNext,
      unit.alpha,
      unit.rank
    );
    const nextBank = unit.activeBank === "BANK_A" ? "BANK_B" : "BANK_A";
    return {
      ...unit,
      hexPtr: unit.standbyPtr,
      standbyPtr: unit.hexPtr,
      activeBank: nextBank,
      tokensK: unit.tokensK + 32,
      latencyMs: 0.01,
      syncPct: 100,
      stateLabel: "WARM · LOCKED",
      wWarmMatrix: wWarm,
      wWarmDiag: diag,
      flipsCount: unit.flipsCount + 1,
    };
  });

  const flippedUnit = nextAdapters[idx];
  const newGlobalPtr = "0xBF8D" + (192 + (nextStep % 60)).toString(16).toUpperCase();
  const newTokens = state.processedTokens + 64000;
  const newXp = Number((state.engineXpK + 2.5).toFixed(1));

  const log1: RadioLogEntry = {
    timestamp: formatClock(nextStep),
    callsign: "🟢 CREW CHIEF",
    message:
      "Atomic pointer flip pass on " +
      flippedUnit.id +
      " -> PTR " +
      flippedUnit.hexPtr +
      " (" +
      flippedUnit.activeBank +
      ") · Zero kernel stall",
  };
  const log2: RadioLogEntry = {
    timestamp: formatClock(nextStep + 1),
    callsign: "🟢 TELEMETRY",
    message:
      flippedUnit.id +
      " W_warm diag updated to [" +
      flippedUnit.wWarmDiag.join(", ") +
      "] · Staging Latency: 0.01 µs",
  };

  return {
    ...state,
    globalPtr: newGlobalPtr,
    stagingLatencyUs: 0.01,
    processedTokens: newTokens,
    engineXpK: newXp,
    selectedAdapterIndex: idx,
    totalPointerFlips: nextStep,
    vecSummary: flippedUnit.wWarmDiag,
    adapters: nextAdapters,
    radioLogs: [log1, log2, ...state.radioLogs].slice(0, 12),
  };
}

/**
 * Trigger 4: FLUSH SWAP ARENAS & RE-ZERO DUAL BUFFERS
 */
export function flushSwapArenas(state: EngineStateSnapshot): EngineStateSnapshot {
  const fresh = createInitialEngineState();
  const corridorSpec = CORRIDOR_METRICS[state.corridor];
  const log1: RadioLogEntry = {
    timestamp: "[00:01.04]",
    callsign: "🟢 CREW CHIEF",
    message:
      "Swap arenas flushed and dual buffers re-zeroed · 8 adapters locked to BANK_A baseline",
  };
  const log2: RadioLogEntry = {
    timestamp: "[00:01.08]",
    callsign: "🟢 TELEMETRY",
    message:
      "Lock-free background pre-staging verified at " +
      corridorSpec.baseThroughputGbps.toLocaleString() +
      " GB/s with zero downtime",
  };
  return {
    ...fresh,
    corridor: state.corridor,
    swapThroughputGbps: corridorSpec.baseThroughputGbps,
    stagingLatencyUs: corridorSpec.baseLatencyUs,
    radioLogs: [log1, log2],
  };
}
