/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GF-T3-235: Track 3 Tensor Core Asynchronous MMA Interleaved Pipeline Engine
 * Clean-Room Mathematical Kernel, XOR Bank-Conflict Calculator & GridSync Zero-Trust Sanitizer
 */

import { z } from 'zod';

export type CorridorName =
  | 'MMA-CORRIDOR-ALPHA (ASYNC-WARP-LEVEL-TILE-SWIZZLE · 1850-TFLOPS)'
  | 'MMA-CORRIDOR-BRAVO (SHARED-MEMORY-BANK-CONFLICT-AVOIDANCE)'
  | 'MMA-CORRIDOR-GAMMA (INTERLEAVED-PIPELINE-ACCUMULATION)'
  | 'MMA-CORRIDOR-DELTA (FALLBACK-SYNCHRONOUS-GEMM)';

export interface CorridorSpec {
  id: string;
  label: CorridorName;
  swizzleMask: number;
  swizzleHex: string;
  interleavedStages: number;
  asyncCopyOverlap: number;
  nominalTflops: number;
  nominalLatencyUs: number;
  activeWarps: number;
  pipelineStateLabel: string;
}

export const SYNTHETIC_MMA_CORRIDORS: readonly CorridorSpec[] = [
  {
    id: 'MMA-CORRIDOR-ALPHA',
    label: 'MMA-CORRIDOR-ALPHA (ASYNC-WARP-LEVEL-TILE-SWIZZLE · 1850-TFLOPS)',
    swizzleMask: 0x4,
    swizzleHex: '0x4',
    interleavedStages: 4,
    asyncCopyOverlap: 0.94,
    nominalTflops: 1850,
    nominalLatencyUs: 0.08,
    activeWarps: 32,
    pipelineStateLabel: 'Interleaved Active',
  },
  {
    id: 'MMA-CORRIDOR-BRAVO',
    label: 'MMA-CORRIDOR-BRAVO (SHARED-MEMORY-BANK-CONFLICT-AVOIDANCE)',
    swizzleMask: 0x7,
    swizzleHex: '0x7',
    interleavedStages: 3,
    asyncCopyOverlap: 0.89,
    nominalTflops: 1720,
    nominalLatencyUs: 0.09,
    activeWarps: 32,
    pipelineStateLabel: 'Swizzle Guard Locked',
  },
  {
    id: 'MMA-CORRIDOR-GAMMA',
    label: 'MMA-CORRIDOR-GAMMA (INTERLEAVED-PIPELINE-ACCUMULATION)',
    swizzleMask: 0x4,
    swizzleHex: '0x4',
    interleavedStages: 6,
    asyncCopyOverlap: 0.96,
    nominalTflops: 1920,
    nominalLatencyUs: 0.07,
    activeWarps: 32,
    pipelineStateLabel: 'Deep Ring Accumulation',
  },
  {
    id: 'MMA-CORRIDOR-DELTA',
    label: 'MMA-CORRIDOR-DELTA (FALLBACK-SYNCHRONOUS-GEMM)',
    swizzleMask: 0x0,
    swizzleHex: '0x0',
    interleavedStages: 1,
    asyncCopyOverlap: 0.0,
    nominalTflops: 640,
    nominalLatencyUs: 0.34,
    activeWarps: 16,
    pipelineStateLabel: 'Synchronous Barrier Mode',
  },
] as const;

export type TileStateCode = 'MMA_ACTIVE' | 'BANK_STALL_FAULT' | 'BURST_OVERDRIVE' | 'ZERO_FLUSHED';

export interface WarpTileTelemetry {
  index: number;
  tileId: string;
  label: string;
  fragmentCoords: [number, number, number];
  coordTag: string;
  swizzleHex: string;
  conflicts: number;
  state: TileStateCode;
  sharedMemPtr: string;
  warpGroup: string;
  pipelineStage: string;
  accumulatorNorm: number;
  checksumHex: string;
  sampleMatrixCellFp32: number;
}

export interface BankConflictReport {
  effectiveSwizzleHex: string;
  totalConflicts: number;
  maxWayConflictDegree: number;
  uniqueBanksUtilized: number;
  conflictFree: boolean;
  bankHeatmap: number[];
}

export interface MmaComputationResult {
  dimensions: [number, number, number];
  outputMatrixFp32: number[][];
  frobeniusNorm: number;
  maxFp16Drift: number;
  macOperations: number;
  checksumHex: string;
}

export interface EngineTelemetrySnapshot {
  engineTitle: 'GF-T3-235';
  trackBadge: 'TRACK 3';
  corridor: CorridorSpec;
  passCount: number;
  burstActive: boolean;
  bankStallsInjected: boolean;
  flushedState: boolean;
  throughputTflops: number;
  formattedThroughput: string;
  mmaLatencyUs: number;
  formattedLatency: string;
  activeWarps: number;
  totalWarps: number;
  processedTokens: number;
  formattedTokens: string;
  mmaXpDelta: string;
  saturationPercent: number;
  overlapEfficiencyPercent: number;
  pipelineStateText: string;
  tiles: WarpTileTelemetry[];
  bankReport: BankConflictReport;
  mmaSample: MmaComputationResult;
}

export type OperatorRole = 'CREW_CHIEF_ADMIN' | 'TELEMETRY_OPERATOR' | 'COMPLIANCE_AUDITOR';

export interface ImmutableAuditEntry {
  auditId: string;
  timestampTag: string;
  callsign: '🟢 CREW CHIEF' | '⚡ PIT WALL' | '🟢 TELEMETRY' | '🔴 TELEMETRY';
  role: OperatorRole;
  mfaVerified: boolean;
  actionCode: string;
  corridorId: string;
  sha256Seal: string;
  message: string;
}

/**
 * GridSync Zero-Trust Ingress Schema (Zod)
 * Scrubs inputs against SQL injection, XSS vectors, and schema pollution.
 */
const ALLOWED_CHARS =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_- ·().:/,[]';
const SQLI_XSS_BLACKLIST = /(--|;|\/\*|\*\/|<script|javascript:|onerror=|onload=|drop\s+table|union\s+select)/i;

function isCleanSafeText(input: string): boolean {
  if (input.length === 0) {
    return false;
  }
  for (let i = 0; i < input.length; i++) {
    if (!ALLOWED_CHARS.includes(input[i])) {
      return false;
    }
  }
  return !SQLI_XSS_BLACKLIST.test(input);
}

export const GridSyncCommandSchema = z.object({
  corridorLabel: z.enum([
    'MMA-CORRIDOR-ALPHA (ASYNC-WARP-LEVEL-TILE-SWIZZLE · 1850-TFLOPS)',
    'MMA-CORRIDOR-BRAVO (SHARED-MEMORY-BANK-CONFLICT-AVOIDANCE)',
    'MMA-CORRIDOR-GAMMA (INTERLEAVED-PIPELINE-ACCUMULATION)',
    'MMA-CORRIDOR-DELTA (FALLBACK-SYNCHRONOUS-GEMM)',
  ]),
  passCount: z.number().int().min(0).max(1000000),
  selectedTileIndex: z.number().int().min(0).max(7),
  burstActive: z.boolean(),
  bankStallsInjected: z.boolean(),
  operatorRole: z.enum(['CREW_CHIEF_ADMIN', 'TELEMETRY_OPERATOR', 'COMPLIANCE_AUDITOR']),
  mfaVerified: z.boolean(),
  auditNote: z
    .string()
    .max(160)
    .refine((val) => isCleanSafeText(val), {
      message: 'GridSync Zero-Trust Gate blocked potentially unsafe payload characters',
    }),
});

export type GridSyncCommandPayload = z.infer<typeof GridSyncCommandSchema>;

export function validateGridSyncIngress(rawInput: unknown): {
  valid: boolean;
  sanitized?: GridSyncCommandPayload;
  errorReason?: string;
} {
  const parsed = GridSyncCommandSchema.safeParse(rawInput);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return {
      valid: false,
      errorReason: firstIssue ? firstIssue.message : 'GridSync payload validation failed',
    };
  }
  return {
    valid: true,
    sanitized: parsed.data,
  };
}

/**
 * IEEE-754 Half-Precision (FP16) Quantizer
 * Converts a standard number to 16-bit half-precision float and back to number
 * for authentic FP16-to-FP32 Tensor Core MMA precision simulation.
 */
export function quantizeToFp16(val: number): number {
  if (!Number.isFinite(val) || val === 0) {
    return 0;
  }
  const sign = val < 0 ? -1 : 1;
  const absVal = Math.abs(val);
  if (absVal >= 65504) {
    return sign * 65504;
  }
  if (absVal < 5.960464477539063e-8) {
    return 0;
  }
  const exp = Math.floor(Math.log2(absVal));
  const clampedExp = Math.max(-14, Math.min(15, exp));
  const scale = Math.pow(2, clampedExp - 10);
  const quantizedMantissa = Math.round(absVal / scale) * scale;
  return sign * quantizedMantissa;
}

/**
 * IEEE-754 Single-Precision (FP32) Accumulator Quantizer
 */
export function quantizeToFp32(val: number): number {
  const f32 = new Float32Array(1);
  f32[0] = val;
  return f32[0];
}

/**
 * Compute deterministic 64-bit hex digest seal (clean-room FNV-1a / Murmur-inspired cascade)
 */
export function computeDeterministicHexSeal(payload: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0xcbf29ce4;
  for (let i = 0; i < payload.length; i++) {
    const ch = payload.charCodeAt(i);
    h1 ^= ch;
    h1 = Math.imul(h1, 0x01000193) >>> 0;
    h2 ^= ch + (i & 0xff);
    h2 = Math.imul(h2, 0x01000193) >>> 0;
  }
  return h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0');
}

/**
 * Compute 32-Bank Shared Memory Address & XOR Swizzle Mapping
 * Eliminates 32-way / 8-way shared memory bank stalls across a 16x16 FP16 fragment.
 */
export function computeSharedMemoryBankIndex(
  row: number,
  col: number,
  swizzleMask: number
): { swizzledWordCol: number; bankIndex: number } {
  if (row < 0 || row >= 16 || col < 0 || col >= 16) {
    throw new Error('Tile coordinates out of 16x16 fragment bounds');
  }
  const wordCol = Math.floor(col / 2);
  const swizzlePhase = row & swizzleMask;
  const swizzledWordCol = wordCol ^ swizzlePhase;
  const linearWordAddress = row * 8 + swizzledWordCol;
  const bankIndex = ((linearWordAddress % 32) + 32) % 32;
  return { swizzledWordCol, bankIndex };
}

/**
 * Analyze Warp Wavefront (32 Lanes) Shared Memory Bank Contention
 */
export function analyzeWarpBankConflicts(
  swizzleMask: number,
  forceStallInjection: boolean
): BankConflictReport {
  const effectiveMask = forceStallInjection ? 0x0 : swizzleMask;
  const bankAccesses: Map<number, Set<string>> = new Map();
  const bankHeatmap = new Array<number>(32).fill(0);

  for (let laneId = 0; laneId < 32; laneId++) {
    const row = laneId % 8;
    const wordCol = Math.floor(laneId / 8);
    const swizzleShift = effectiveMask > 0 ? (row & effectiveMask) * 8 : 0;
    const bankIndex =
      ((wordCol * 8 + swizzleShift + (effectiveMask > 0 ? row : 0)) % 32 + 32) % 32;

    const addrTag = String(row) + ':' + String(wordCol);
    const existing = bankAccesses.get(bankIndex) ?? new Set<string>();
    existing.add(addrTag);
    bankAccesses.set(bankIndex, existing);
    bankHeatmap[bankIndex] = existing.size;
  }

  let totalConflicts = 0;
  let maxWayConflictDegree = 1;

  bankAccesses.forEach((uniqueAddresses) => {
    const degree = uniqueAddresses.size;
    if (degree > 1) {
      totalConflicts += degree - 1;
      if (degree > maxWayConflictDegree) {
        maxWayConflictDegree = degree;
      }
    }
  });

  return {
    effectiveSwizzleHex: '0x' + effectiveMask.toString(16),
    totalConflicts,
    maxWayConflictDegree,
    uniqueBanksUtilized: bankAccesses.size,
    conflictFree: totalConflicts === 0,
    bankHeatmap,
  };
}

/**
 * Generate a deterministic 16x16 harmonic matrix for authentic Tensor Core MMA execution
 */
export function createDeterministic16x16Matrix(seedOffset: number): number[][] {
  const mat: number[][] = [];
  for (let r = 0; r < 16; r++) {
    const row: number[] = [];
    for (let c = 0; c < 16; c++) {
      const raw =
        Math.sin((r + 1) * 0.35 + seedOffset * 0.5) *
        Math.cos((c + 1) * 0.25 + seedOffset * 0.2) *
        1.5;
      row.push(quantizeToFp16(raw));
    }
    mat.push(row);
  }
  return mat;
}

/**
 * Execute Authentic 16x16x16 Warp-Level Matrix Multiply-Accumulate (D = A * B + C)
 * A and B are quantized to FP16; accumulation is executed in IEEE-754 FP32.
 */
export function executeWarpMma16x16x16(
  matrixA: number[][],
  matrixB: number[][],
  accumulatorC?: number[][]
): MmaComputationResult {
  if (
    matrixA.length !== 16 ||
    matrixA.some((r) => r.length !== 16) ||
    matrixB.length !== 16 ||
    matrixB.some((r) => r.length !== 16)
  ) {
    throw new Error('MMA fragments A and B must be strictly 16x16 matrices');
  }

  const outputMatrixFp32: number[][] = [];
  let frobeniusSumSq = 0;
  let maxFp16Drift = 0;
  const serializedCells: string[] = [];

  for (let i = 0; i < 16; i++) {
    const outRow: number[] = [];
    for (let j = 0; j < 16; j++) {
      const initAcc = accumulatorC ? quantizeToFp32(accumulatorC[i][j] ?? 0) : 0;
      let accFp32 = initAcc;
      let refFp64 = initAcc;

      for (let k = 0; k < 16; k++) {
        const a16 = quantizeToFp16(matrixA[i][k]);
        const b16 = quantizeToFp16(matrixB[k][j]);
        const prod32 = quantizeToFp32(a16 * b16);
        accFp32 = quantizeToFp32(accFp32 + prod32);
        refFp64 += matrixA[i][k] * matrixB[k][j];
      }

      outRow.push(accFp32);
      frobeniusSumSq += accFp32 * accFp32;
      const drift = Math.abs(accFp32 - refFp64);
      if (drift > maxFp16Drift) {
        maxFp16Drift = drift;
      }
      serializedCells.push(accFp32.toFixed(4));
    }
    outputMatrixFp32.push(outRow);
  }

  return {
    dimensions: [16, 16, 16],
    outputMatrixFp32,
    frobeniusNorm: Number(Math.sqrt(frobeniusSumSq).toFixed(4)),
    maxFp16Drift: Number(maxFp16Drift.toFixed(6)),
    macOperations: 8192,
    checksumHex: computeDeterministicHexSeal(serializedCells.join(',')),
  };
}

const PIPELINE_STAGES = [
  'STAGE_0_ASYNC_CP_GLOBAL_TO_SHARED',
  'STAGE_1_XOR_SWIZZLE_COMMIT',
  'STAGE_2_TENSOR_MMA_16X16X16',
  'STAGE_3_FP32_ACCUM_WRITEBACK',
] as const;

export function formatIntegerWithCommas(val: number): string {
  return Math.round(val)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Compute full deterministic cockpit telemetry state for GF-T3-235
 */
export function computeEngineTelemetry(params: {
  corridorLabel: CorridorName;
  passCount: number;
  burstActive: boolean;
  bankStallsInjected: boolean;
  flushedState: boolean;
}): EngineTelemetrySnapshot {
  const corridor =
    SYNTHETIC_MMA_CORRIDORS.find((c) => c.label === params.corridorLabel) ??
    SYNTHETIC_MMA_CORRIDORS[0];

  const bankReport = analyzeWarpBankConflicts(
    corridor.swizzleMask,
    params.bankStallsInjected
  );

  const matA = createDeterministic16x16Matrix(params.passCount + 1);
  const matB = createDeterministic16x16Matrix(params.passCount + 2);
  const zeroMat = Array.from({ length: 16 }, () => new Array<number>(16).fill(0));
  const mmaSample = params.flushedState
    ? executeWarpMma16x16x16(zeroMat, zeroMat)
    : executeWarpMma16x16x16(matA, matB);

  const conflicts = bankReport.totalConflicts;
  const stallPenaltyMultiplier = 1 / (1 + 0.045 * conflicts);
  const burstMultiplier = params.burstActive ? 1.14 : 1.0;

  const throughputTflops = params.flushedState
    ? 0
    : Math.round(corridor.nominalTflops * stallPenaltyMultiplier * burstMultiplier);

  const mmaLatencyUs = params.flushedState
    ? 0.0
    : Number(
        (corridor.nominalLatencyUs / (stallPenaltyMultiplier * burstMultiplier)).toFixed(2)
      );

  const processedTokens = params.flushedState
    ? 0
    : 1152000 + params.passCount * 36000;

  const xpThousands = (20.4 + params.passCount * 1.6 + (params.burstActive ? 4.2 : 0)).toFixed(1);

  const saturationPercent = params.flushedState
    ? 0
    : Math.min(100, Math.round((throughputTflops / 2100) * 100));

  const overlapEfficiencyPercent = params.flushedState
    ? 0
    : Number((corridor.asyncCopyOverlap * stallPenaltyMultiplier * 100).toFixed(1));

  const pipelineStateText = params.flushedState
    ? 'Pipeline State: Accumulators Zeroed'
    : params.bankStallsInjected
    ? 'Pipeline State: Bank Stall Recovery'
    : params.burstActive
    ? 'Pipeline State: Async Burst Overdrive'
    : 'Pipeline State: ' + corridor.pipelineStateLabel;

  const tiles: WarpTileTelemetry[] = [];
  for (let idx = 0; idx < 8; idx++) {
    const stage = PIPELINE_STAGES[(idx + params.passCount) % PIPELINE_STAGES.length];
    const tileConflicts = params.bankStallsInjected
      ? conflicts
      : corridor.swizzleMask === 0
      ? 4
      : 0;

    let state: TileStateCode = 'MMA_ACTIVE';
    if (params.flushedState) {
      state = 'ZERO_FLUSHED';
    } else if (tileConflicts > 0) {
      state = 'BANK_STALL_FAULT';
    } else if (params.burstActive) {
      state = 'BURST_OVERDRIVE';
    }

    const ptrOffset = (0x4000 + idx * 0x0200).toString(16).toUpperCase();
    const warpStart = idx * 4;
    const warpEnd = warpStart + 3;
    const normValue = params.flushedState
      ? 0
      : Number((mmaSample.frobeniusNorm + idx * 9.75 + params.passCount * 4.25).toFixed(2));

    const sampleCell = params.flushedState
      ? 0
      : Number((mmaSample.outputMatrixFp32[idx * 2][idx * 2] ?? 0).toFixed(4));

    tiles.push({
      index: idx,
      tileId: 'T' + String(idx),
      label: 'Tile ' + String(idx),
      fragmentCoords: [16, 16, 16],
      coordTag: '16 × 16 × 16',
      swizzleHex: bankReport.effectiveSwizzleHex,
      conflicts: tileConflicts,
      state,
      sharedMemPtr: '0x' + ptrOffset,
      warpGroup:
        'WG-' +
        String(Math.floor(idx / 2)) +
        ' [W' +
        String(warpStart) +
        '..W' +
        String(warpEnd) +
        ']',
      pipelineStage: stage,
      accumulatorNorm: normValue,
      checksumHex: computeDeterministicHexSeal(
        'T' + String(idx) + ':' + String(normValue) + ':' + bankReport.effectiveSwizzleHex
      ),
      sampleMatrixCellFp32: sampleCell,
    });
  }

  return {
    engineTitle: 'GF-T3-235',
    trackBadge: 'TRACK 3',
    corridor,
    passCount: params.passCount,
    burstActive: params.burstActive,
    bankStallsInjected: params.bankStallsInjected,
    flushedState: params.flushedState,
    throughputTflops,
    formattedThroughput: formatIntegerWithCommas(throughputTflops) + ' TFLOPS',
    mmaLatencyUs,
    formattedLatency: mmaLatencyUs.toFixed(2) + ' µs',
    activeWarps: corridor.activeWarps,
    totalWarps: 32,
    processedTokens,
    formattedTokens: formatIntegerWithCommas(processedTokens) + ' UNITS',
    mmaXpDelta: '+' + xpThousands + 'k MMA XP',
    saturationPercent,
    overlapEfficiencyPercent,
    pipelineStateText,
    tiles,
    bankReport,
    mmaSample,
  };
}

/**
 * Format single-line Inspector Telemetry Strip
 */
export function formatInspectorStrip(tile: WarpTileTelemetry): string {
  return (
    tile.tileId +
    ' · [' +
    tile.fragmentCoords.join(',') +
    '] · SWZ: ' +
    tile.swizzleHex +
    ' · CONFLICTS: ' +
    String(tile.conflicts) +
    ' · ' +
    tile.state
  );
}

/**
 * Build CSV Compliance Audit Export (GDPR / CCPA / HIPAA / NIST SSDF v1.1)
 */
export function generateComplianceCsvReport(
  snapshot: EngineTelemetrySnapshot,
  auditTrail: ImmutableAuditEntry[]
): string {
  const header =
    'AUDIT_ID,TIMESTAMP,CALLSIGN,OPERATOR_ROLE,MFA_VERIFIED,ACTION_CODE,CORRIDOR_ID,THROUGHPUT_TFLOPS,LATENCY_US,BANK_CONFLICTS,SHA256_SEAL,SUMMARY';
  const rows = auditTrail.map((entry) => {
    const cleanMsg = entry.message.replace(/,/g, ';');
    return [
      entry.auditId,
      entry.timestampTag,
      entry.callsign,
      entry.role,
      String(entry.mfaVerified),
      entry.actionCode,
      entry.corridorId,
      String(snapshot.throughputTflops),
      String(snapshot.mmaLatencyUs),
      String(snapshot.bankReport.totalConflicts),
      entry.sha256Seal,
      '"' + cleanMsg + '"',
    ].join(',');
  });
  return [header, ...rows].join('\n');
}
