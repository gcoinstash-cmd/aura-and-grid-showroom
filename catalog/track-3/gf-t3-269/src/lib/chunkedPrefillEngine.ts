/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GF-T3-269: Clean-Room Chunked Prefill & Iterative Decode Interleaving Engine
 * Zero-Trust GridSync Sanitization & Deterministic Mathematical Scheduling Core
 */

import { z } from 'zod';

export const SYNTHETIC_CORRIDORS = [
  'CHUNK-CORRIDOR-ALPHA (CHUNKED-PREFILL-DECODE-INTERLEAVING-FABRIC · 29600-GB/S)',
  'CHUNK-CORRIDOR-BRAVO (SUB-MILLISECOND-TIME-TO-FIRST-TOKEN-ROUTER)',
  'CHUNK-CORRIDOR-GAMMA (DYNAMIC-TOKEN-BUDGET-BALANCER)',
  'CHUNK-CORRIDOR-DELTA (FALLBACK-MONOLITHIC-PREFILL-PASS)',
] as const;

export type SyntheticCorridor = (typeof SYNTHETIC_CORRIDORS)[number];

export type ChunkStateLabel =
  | 'INTERLEAVED · LOCKED'
  | 'BURST · BALANCING'
  | 'SPIKE · RE-ALLOC'
  | 'DECODE · STEPPED'
  | 'MONOLITHIC · PASS';

export interface ChunkSlot {
  id: number;
  code: string;
  title: string;
  hexPtr: string;
  promptTokens: number;
  chunkSize: number;
  tokensLabel: string;
  modeLabel: string;
  kernelTimeMs: number;
  decodeTimeMs: number;
  latencyMs: number;
  latencyLabel: string;
  ttftPercent: number;
  chunkHealth: 'OK' | 'REALLOC' | 'BURST';
  stateLabel: ChunkStateLabel;
  locked: boolean;
  interleaveRatio: number;
  activeStreams: number;
}

export interface TelemetrySnapshot {
  corridor: SyntheticCorridor;
  throughputGbs: number;
  throughputFormatted: string;
  saturationPercent: number;
  schedulingLatencyUs: number;
  schedulingLatencyFormatted: string;
  activeChunksCount: number;
  totalChunksCount: number;
  processedTokens: number;
  processedTokensFormatted: string;
  engineXp: number;
  engineXpFormatted: string;
  chunkStateSummary: string;
  meshPtr: string;
  meshMode: string;
  meshVector: [number, number, number, number];
  chunks: ChunkSlot[];
  spikeActive: boolean;
  burstGeneration: number;
  decodeStepCount: number;
}

const FORBIDDEN_PATTERNS = [
  'DROP TABLE',
  'DELETE FROM',
  'INSERT INTO',
  'UPDATE ',
  '<script',
  'javascript:',
  'onerror=',
  'onload=',
  '--',
  ';',
];

export const GridSyncPayloadSchema = z.object({
  corridor: z.enum(SYNTHETIC_CORRIDORS),
  promptLengthTokens: z.number().int().min(1024).max(2097152),
  chunkCapacityTokens: z.number().int().min(256).max(262144),
  kernelExecutionMs: z.number().min(0.001).max(10.0),
  decodeExecutionMs: z.number().min(0.001).max(10.0),
  concurrencyStreams: z.number().int().min(1).max(1024),
  operatorTag: z
    .string()
    .min(2)
    .max(64)
    .refine(
      (val) => {
        const upper = val.toUpperCase();
        return !FORBIDDEN_PATTERNS.some((pat) => upper.includes(pat.toUpperCase()));
      },
      { message: 'GridSync Zero-Trust Gate: Disallowed token or injection pattern detected' }
    ),
});

export type GridSyncPayload = z.infer<typeof GridSyncPayloadSchema>;

/**
 * Core Formula:
 * T_latency = ceil(S_prompt / C_chunk) * t_kernel + t_decode
 * Returns latency in milliseconds rounded to 4 decimal places.
 */
export function computeChunkedPrefillLatencyMs(
  promptLengthTokens: number,
  chunkCapacityTokens: number,
  kernelTimeMs: number,
  decodeTimeMs: number
): {
  chunkCount: number;
  totalLatencyMs: number;
  perChunkInterleavedMs: number;
} {
  const safePrompt = Math.max(1, promptLengthTokens);
  const safeChunk = Math.max(1, chunkCapacityTokens);
  const chunkCount = Math.ceil(safePrompt / safeChunk);
  const totalLatencyMs = Number((chunkCount * kernelTimeMs + decodeTimeMs).toFixed(4));
  const perChunkInterleavedMs = Number((totalLatencyMs / chunkCount).toFixed(4));
  return {
    chunkCount,
    totalLatencyMs,
    perChunkInterleavedMs,
  };
}

/**
 * Dynamic Token Budget Balancing:
 * Adjusts prefill chunk capacity per iteration based on concurrency pressure and prompt spike status
 * to prevent decode latency spikes under heavy concurrency.
 */
export function computeDynamicTokenBudget(
  baseChunkTokens: number,
  concurrencyStreams: number,
  spikeActive: boolean,
  corridor: SyntheticCorridor
): {
  adjustedChunkTokens: number;
  decodeBudgetTokens: number;
  interleaveCadence: string;
  jitterUs: number;
} {
  let corridorMultiplier = 1.0;
  if (corridor.includes('ALPHA')) {
    corridorMultiplier = 1.0;
  } else if (corridor.includes('BRAVO')) {
    corridorMultiplier = 0.75;
  } else if (corridor.includes('GAMMA')) {
    corridorMultiplier = 0.875;
  } else {
    corridorMultiplier = 2.0;
  }

  const concurrencyDampener = concurrencyStreams > 64 ? 0.5 : concurrencyStreams > 16 ? 0.75 : 1.0;
  const spikeFactor = spikeActive ? 0.5 : 1.0;

  const rawAdjusted = Math.round(baseChunkTokens * corridorMultiplier * concurrencyDampener * spikeFactor);
  const adjustedChunkTokens = Math.max(512, Math.min(262144, rawAdjusted));
  const decodeBudgetTokens = Math.max(64, Math.round(adjustedChunkTokens / 16));
  const modeNum = Math.max(1, Math.min(8, Math.round(131072 / adjustedChunkTokens) * 4));
  const interleaveCadence = 'CHUNK-' + String(modeNum);
  const jitterUs = corridor.includes('DELTA') ? 0.04 : 0.0;

  return {
    adjustedChunkTokens,
    decodeBudgetTokens,
    interleaveCadence,
    jitterUs,
  };
}

export function formatNumberWithCommas(val: number): string {
  return Math.round(val).toLocaleString('en-US');
}

export function buildInitialChunks(corridor: SyntheticCorridor = SYNTHETIC_CORRIDORS[0]): ChunkSlot[] {
  const baseHex = 0x3000;
  const slots: ChunkSlot[] = [];

  for (let i = 0; i < 8; i++) {
    const hexVal = (baseHex + i * 0x0010).toString(16).toUpperCase();
    const hexPtr = '0x' + hexVal;
    const promptTokens = 131072; // 128K
    const chunkSize = 32768; // 32K -> 4 chunks per slot
    const kernelTimeMs = 0.0025;
    const decodeTimeMs = 0.01;
    const calc = computeChunkedPrefillLatencyMs(promptTokens, chunkSize, kernelTimeMs, decodeTimeMs);

    slots.push({
      id: i,
      code: 'C' + String(i),
      title: 'Chunk ' + String(i) + ' (C' + String(i) + ')',
      hexPtr,
      promptTokens,
      chunkSize,
      tokensLabel: '128K',
      modeLabel: corridor.includes('DELTA') ? 'MONO-1' : 'CHUNK-4',
      kernelTimeMs,
      decodeTimeMs,
      latencyMs: calc.totalLatencyMs,
      latencyLabel: calc.totalLatencyMs.toFixed(2) + 'ms',
      ttftPercent: 100,
      chunkHealth: 'OK',
      stateLabel: 'INTERLEAVED · LOCKED',
      locked: true,
      interleaveRatio: 4,
      activeStreams: 16 + i * 2,
    });
  }

  return slots;
}

export function buildInitialSnapshot(corridor: SyntheticCorridor = SYNTHETIC_CORRIDORS[0]): TelemetrySnapshot {
  const chunks = buildInitialChunks(corridor);
  return {
    corridor,
    throughputGbs: 29600,
    throughputFormatted: '29,600 GB/s',
    saturationPercent: 98.6,
    schedulingLatencyUs: 0.01,
    schedulingLatencyFormatted: '0.01 µs',
    activeChunksCount: 8,
    totalChunksCount: 8,
    processedTokens: 5504000,
    processedTokensFormatted: '5,504,000 UNITS',
    engineXp: 75000,
    engineXpFormatted: '+75.0k ENGINE XP',
    chunkStateSummary: 'Chunk State: Interleaved Active',
    meshPtr: '0x2F8DC0',
    meshMode: 'CHUNKED_PREFILL',
    meshVector: [3.11, 3.15, 3.12, 3.14],
    chunks,
    spikeActive: false,
    burstGeneration: 0,
    decodeStepCount: 0,
  };
}

export function applyCorridorSelection(
  snapshot: TelemetrySnapshot,
  corridor: SyntheticCorridor
): TelemetrySnapshot {
  const isBravo = corridor.includes('BRAVO');
  const isGamma = corridor.includes('GAMMA');
  const isDelta = corridor.includes('DELTA');

  const throughputGbs = isDelta ? 24800 : isBravo ? 31200 : isGamma ? 28900 : 29600;
  const schedulingLatencyUs = isDelta ? 0.04 : isBravo ? 0.01 : isGamma ? 0.01 : 0.01;
  const meshMode = isDelta
    ? 'MONOLITHIC_FALLBACK'
    : isBravo
    ? 'SUB_MS_TTFT_ROUTER'
    : isGamma
    ? 'DYNAMIC_BUDGET_BAL'
    : 'CHUNKED_PREFILL';

  const updatedChunks = snapshot.chunks.map((slot, idx) => {
    const budget = computeDynamicTokenBudget(32768, slot.activeStreams, snapshot.spikeActive, corridor);
    const calc = computeChunkedPrefillLatencyMs(
      slot.promptTokens,
      budget.adjustedChunkTokens,
      slot.kernelTimeMs,
      slot.decodeTimeMs
    );
    return {
      ...slot,
      chunkSize: budget.adjustedChunkTokens,
      modeLabel: isDelta ? 'MONO-1' : budget.interleaveCadence,
      latencyMs: calc.totalLatencyMs,
      latencyLabel: calc.totalLatencyMs.toFixed(2) + 'ms',
      stateLabel: (isDelta ? 'MONOLITHIC · PASS' : 'INTERLEAVED · LOCKED') as ChunkStateLabel,
      ttftPercent: isDelta ? 94 : 100,
      interleaveRatio: Math.max(1, Math.round(slot.promptTokens / budget.adjustedChunkTokens)),
      activeStreams: 16 + idx * 2,
    };
  });

  const vectorBase = isBravo ? 3.21 : isGamma ? 3.08 : isDelta ? 2.85 : 3.11;

  return {
    ...snapshot,
    corridor,
    throughputGbs,
    throughputFormatted: formatNumberWithCommas(throughputGbs) + ' GB/s',
    saturationPercent: isDelta ? 86.4 : isBravo ? 99.4 : 98.6,
    schedulingLatencyUs,
    schedulingLatencyFormatted: schedulingLatencyUs.toFixed(2) + ' µs',
    meshMode,
    meshVector: [
      Number(vectorBase.toFixed(2)),
      Number((vectorBase + 0.04).toFixed(2)),
      Number((vectorBase + 0.01).toFixed(2)),
      Number((vectorBase + 0.03).toFixed(2)),
    ],
    chunks: updatedChunks,
  };
}

export function triggerChunkedPrefillBurst(snapshot: TelemetrySnapshot): TelemetrySnapshot {
  const nextBurst = snapshot.burstGeneration + 1;
  const throughputGbs = 29600 + nextBurst * 420;
  const addedTokens = 512000;
  const nextTokens = snapshot.processedTokens + addedTokens;
  const nextXp = snapshot.engineXp + 12500;

  const updatedChunks: ChunkSlot[] = snapshot.chunks.map((slot, idx) => {
    const burstPrompt = 196608; // 192K burst
    const chunkCap = 24576; // 24K chunk size -> 8 chunks
    const calc = computeChunkedPrefillLatencyMs(burstPrompt, chunkCap, 0.0022, 0.008);
    return {
      ...slot,
      promptTokens: burstPrompt,
      chunkSize: chunkCap,
      tokensLabel: '192K',
      modeLabel: 'CHUNK-8',
      latencyMs: calc.totalLatencyMs,
      latencyLabel: calc.totalLatencyMs.toFixed(2) + 'ms',
      ttftPercent: 100,
      chunkHealth: 'BURST',
      stateLabel: 'BURST · BALANCING',
      locked: true,
      interleaveRatio: 8,
      activeStreams: slot.activeStreams + 4 + (idx % 3),
    };
  });

  return {
    ...snapshot,
    burstGeneration: nextBurst,
    throughputGbs,
    throughputFormatted: formatNumberWithCommas(throughputGbs) + ' GB/s',
    saturationPercent: Math.min(99.9, Number((98.6 + nextBurst * 0.2).toFixed(1))),
    schedulingLatencyUs: 0.01,
    schedulingLatencyFormatted: '0.01 µs',
    processedTokens: nextTokens,
    processedTokensFormatted: formatNumberWithCommas(nextTokens) + ' UNITS',
    engineXp: nextXp,
    engineXpFormatted: '+' + (nextXp / 1000).toFixed(1) + 'k ENGINE XP',
    chunkStateSummary: 'Chunk State: Burst Interleaving',
    meshPtr: '0x2F8E' + String((10 + (nextBurst % 89)).toString(16).toUpperCase()),
    meshVector: [3.28, 3.31, 3.29, 3.34],
    chunks: updatedChunks,
  };
}

export function togglePromptLengthSpike(snapshot: TelemetrySnapshot): TelemetrySnapshot {
  const nextSpike = !snapshot.spikeActive;
  if (!nextSpike) {
    return applyCorridorSelection(
      {
        ...snapshot,
        spikeActive: false,
        chunkStateSummary: 'Chunk State: Interleaved Active',
      },
      snapshot.corridor
    );
  }

  const updatedChunks: ChunkSlot[] = snapshot.chunks.map((slot, idx) => {
    const spikedPrompt = idx % 2 === 0 ? 262144 : 196608; // 256K / 192K prompt spike
    const budget = computeDynamicTokenBudget(16384, 48, true, snapshot.corridor);
    const calc = computeChunkedPrefillLatencyMs(
      spikedPrompt,
      budget.adjustedChunkTokens,
      0.0018,
      0.008
    );

    return {
      ...slot,
      promptTokens: spikedPrompt,
      chunkSize: budget.adjustedChunkTokens,
      tokensLabel: idx % 2 === 0 ? '256K' : '192K',
      modeLabel: 'CHUNK-16',
      latencyMs: calc.totalLatencyMs,
      latencyLabel: calc.totalLatencyMs.toFixed(2) + 'ms',
      ttftPercent: 99,
      chunkHealth: 'REALLOC',
      stateLabel: 'SPIKE · RE-ALLOC',
      locked: true,
      interleaveRatio: 16,
      activeStreams: slot.activeStreams + 8,
    };
  });

  return {
    ...snapshot,
    spikeActive: true,
    throughputGbs: 30840,
    throughputFormatted: '30,840 GB/s',
    saturationPercent: 99.7,
    schedulingLatencyUs: 0.01,
    schedulingLatencyFormatted: '0.01 µs',
    chunkStateSummary: 'Chunk State: Re-Allocated Spike',
    meshMode: 'DYNAMIC_CHUNK_REALLOC',
    meshVector: [3.42, 3.48, 3.45, 3.49],
    chunks: updatedChunks,
  };
}

export function stepInterleavedDecodePass(snapshot: TelemetrySnapshot): TelemetrySnapshot {
  const nextStep = snapshot.decodeStepCount + 1;
  const nextTokens = snapshot.processedTokens + 256000;
  const nextXp = snapshot.engineXp + 6400;

  const updatedChunks: ChunkSlot[] = snapshot.chunks.map((slot, idx) => {
    const steppedLatency = Math.max(0.01, Number((slot.latencyMs * 0.92).toFixed(2)));
    const nextHexOffset = 0x3000 + idx * 0x0010 + (nextStep % 8);
    return {
      ...slot,
      hexPtr: '0x' + nextHexOffset.toString(16).toUpperCase(),
      latencyMs: steppedLatency,
      latencyLabel: steppedLatency.toFixed(2) + 'ms',
      ttftPercent: 100,
      chunkHealth: 'OK',
      stateLabel: 'DECODE · STEPPED',
      locked: true,
    };
  });

  return {
    ...snapshot,
    decodeStepCount: nextStep,
    processedTokens: nextTokens,
    processedTokensFormatted: formatNumberWithCommas(nextTokens) + ' UNITS',
    engineXp: nextXp,
    engineXpFormatted: '+' + (nextXp / 1000).toFixed(1) + 'k ENGINE XP',
    chunkStateSummary: 'Chunk State: Interleaved Step #' + String(nextStep),
    meshVector: [
      Number((3.11 + (nextStep % 5) * 0.02).toFixed(2)),
      Number((3.15 + (nextStep % 5) * 0.02).toFixed(2)),
      Number((3.12 + (nextStep % 5) * 0.02).toFixed(2)),
      Number((3.14 + (nextStep % 5) * 0.02).toFixed(2)),
    ],
    chunks: updatedChunks,
  };
}
