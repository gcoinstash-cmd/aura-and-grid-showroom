/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod';

export enum CorridorId {
  ALPHA = 'FP8-CORRIDOR-ALPHA',
  BRAVO = 'FP8-CORRIDOR-BRAVO',
  GAMMA = 'FP8-CORRIDOR-GAMMA',
  DELTA = 'FP8-CORRIDOR-DELTA',
}

export interface CorridorProfile {
  id: CorridorId;
  fullLabel: string;
  shortTag: string;
  precisionFormat: 'FP8-E4M3' | 'FP8-E5M2' | 'BF16-PASS';
  clipMax: number;
  nominalBandwidthGbs: number;
  nominalLatencyUs: number;
  granularity: 'PER_TENSOR' | 'PER_TOKEN' | 'HYBRID_SM_SYNC';
}

export const CORRIDOR_PROFILES: Record<CorridorId, CorridorProfile> = {
  [CorridorId.ALPHA]: {
    id: CorridorId.ALPHA,
    fullLabel: 'FP8-CORRIDOR-ALPHA (DYNAMIC-QUANTIZATION-CALIBRATION-FABRIC · 40000-GB/S)',
    shortTag: 'ALPHA · 40K-GB/S',
    precisionFormat: 'FP8-E4M3',
    clipMax: 448.0,
    nominalBandwidthGbs: 40000,
    nominalLatencyUs: 0.01,
    granularity: 'HYBRID_SM_SYNC',
  },
  [CorridorId.BRAVO]: {
    id: CorridorId.BRAVO,
    fullLabel: 'FP8-CORRIDOR-BRAVO (HARDWARE-ACCELERATED-FP8-WEIGHT-ACTIVATION-ENGINE)',
    shortTag: 'BRAVO · HW-WA-FP8',
    precisionFormat: 'FP8-E4M3',
    clipMax: 448.0,
    nominalBandwidthGbs: 38400,
    nominalLatencyUs: 0.01,
    granularity: 'PER_TENSOR',
  },
  [CorridorId.GAMMA]: {
    id: CorridorId.GAMMA,
    fullLabel: 'FP8-CORRIDOR-GAMMA (PER-TENSOR-PER-TOKEN-SCALE-FACTOR-ROUTER)',
    shortTag: 'GAMMA · PT-ROUTER',
    precisionFormat: 'FP8-E5M2',
    clipMax: 57344.0,
    nominalBandwidthGbs: 36800,
    nominalLatencyUs: 0.02,
    granularity: 'PER_TOKEN',
  },
  [CorridorId.DELTA]: {
    id: CorridorId.DELTA,
    fullLabel: 'FP8-CORRIDOR-DELTA (FALLBACK-BF16-HIGH-PRECISION-PASS)',
    shortTag: 'DELTA · BF16-PASS',
    precisionFormat: 'BF16-PASS',
    clipMax: 65504.0,
    nominalBandwidthGbs: 20000,
    nominalLatencyUs: 0.04,
    granularity: 'PER_TENSOR',
  },
};

// GridSync Zero-Trust Ingress Validation Schemas (Zod)
const DANGEROUS_PATTERN = /(--|;|\/\*|\*\/|<script|DROP\s+TABLE|UNION\s+SELECT|INSERT\s+INTO|DELETE\s+FROM)/i;

export const QuantizeIngressSchema = z.object({
  corridorId: z.nativeEnum(CorridorId),
  matrixIndex: z.number().int().min(0).max(7),
  weights: z.array(z.number().finite()).min(4).max(1024),
  activations: z.array(z.number().finite()).min(4).max(1024),
  clipMax: z.number().positive().max(65504),
  outlierMultiplier: z.number().min(1).max(100).default(1),
  operatorCallsign: z
    .string()
    .min(2)
    .max(64)
    .refine((val) => !DANGEROUS_PATTERN.test(val), {
      message: 'GridSync Zero-Trust Gate blocked potentially malicious payload token',
    }),
});

export type QuantizeIngressPayload = z.infer<typeof QuantizeIngressSchema>;

export interface QuantizationMathResult {
  scaleFactor: number;
  inverseScaleFactor: number;
  amax: number;
  quantizedWeights: number[];
  dequantizedWeights: number[];
  quantizedActivations: number[];
  dequantizedActivations: number[];
  clippedCount: number;
  meanSquaredError: number;
  sqnrDb: number;
  effectiveThroughputGbs: number;
  calibrationLatencyUs: number;
}

export interface MatrixUnitState {
  index: number;
  idLabel: string;
  ptrHex: string;
  tokensK: number;
  precision: 'FP8-E4M3' | 'FP8-E5M2' | 'BF16-PASS';
  latencyMs: number;
  stateLabel: 'QUANTIZED · LOCKED' | '⚡ FAULT · SPIKE';
  isFault: boolean;
  scalePercent: number;
  scaleFactor: number;
  inverseScale: number;
  amax: number;
  sqnrDb: number;
  mse: number;
  clippedCount: number;
  vectorSample: [number, number, number, number];
  bufferRotationGeneration: number;
}

export interface EngineTelemetrySnapshot {
  corridor: CorridorProfile;
  quantThroughputGbs: number;
  throughputSaturationPct: number;
  calibrationLatencyUs: number;
  activeMatricesCount: number;
  totalMatricesCount: number;
  processedTokensUnits: number;
  engineXpK: number;
  fp8StateLabel: string;
  meshPtrHex: string;
  meshMode: string;
  meshVector: [number, number, number, number];
  matrices: MatrixUnitState[];
  selectedMatrixIndex: number;
  outlierSpikeActive: boolean;
  rotationCount: number;
}

/**
 * Clips a numeric value strictly into [minVal, maxVal].
 */
export function clipValue(val: number, minVal: number, maxVal: number): number {
  if (val < minVal) return minVal;
  if (val > maxVal) return maxVal;
  return val;
}

/**
 * Nearest-even / standard hardware rounding for FP8 grid projection.
 */
export function roundFp8Grid(val: number): number {
  return Math.round(val);
}

/**
 * Computes dynamic scale factor s = amax / clipMax and inverse scale s^-1 = clipMax / amax.
 * Implements hardware FP8 quantization equation:
 * W_fp8 = Clip(round(W * s^-1), -clipMax, clipMax) * s
 */
export function executeDynamicFp8Quantization(rawPayload: unknown): QuantizationMathResult {
  const payload = QuantizeIngressSchema.parse(rawPayload);
  const { weights, activations, clipMax, outlierMultiplier } = payload;

  // Apply deterministic outlier magnitude multiplier if active
  const scaledWeights = weights.map((w, idx) =>
    idx === 0 && outlierMultiplier > 1 ? w * outlierMultiplier : w
  );

  // Compute absolute maximum (amax) across tensor
  let weightAmax = 0;
  for (let i = 0; i < scaledWeights.length; i++) {
    const absW = Math.abs(scaledWeights[i]);
    if (absW > weightAmax) {
      weightAmax = absW;
    }
  }
  // Prevent division by zero on zero tensors
  const safeAmax = weightAmax > 1e-9 ? weightAmax : 1e-9;

  // Scale factor s and inverse scale factor s^-1
  const scaleFactor = safeAmax / clipMax;
  const inverseScaleFactor = clipMax / safeAmax;

  const quantizedWeights: number[] = [];
  const dequantizedWeights: number[] = [];
  let clippedCount = 0;
  let sumSquaredSignal = 0;
  let sumSquaredError = 0;

  for (let i = 0; i < scaledWeights.length; i++) {
    const w = scaledWeights[i];
    const unclippedGrid = roundFp8Grid(w * inverseScaleFactor);
    if (unclippedGrid > clipMax || unclippedGrid < -clipMax) {
      clippedCount += 1;
    }
    const clippedGrid = clipValue(unclippedGrid, -clipMax, clipMax);
    const wFp8 = clippedGrid * scaleFactor;

    quantizedWeights.push(clippedGrid);
    dequantizedWeights.push(Number(wFp8.toFixed(6)));

    sumSquaredSignal += w * w;
    const err = w - wFp8;
    sumSquaredError += err * err;
  }

  // Per-token activation quantization
  let actAmax = 0;
  for (let i = 0; i < activations.length; i++) {
    const absA = Math.abs(activations[i]);
    if (absA > actAmax) {
      actAmax = absA;
    }
  }
  const safeActAmax = actAmax > 1e-9 ? actAmax : 1e-9;
  const actScale = safeActAmax / clipMax;
  const actInvScale = clipMax / safeActAmax;

  const quantizedActivations: number[] = [];
  const dequantizedActivations: number[] = [];

  for (let i = 0; i < activations.length; i++) {
    const a = activations[i];
    const gridA = clipValue(roundFp8Grid(a * actInvScale), -clipMax, clipMax);
    quantizedActivations.push(gridA);
    dequantizedActivations.push(Number((gridA * actScale).toFixed(6)));
  }

  const meanSquaredError = sumSquaredError / scaledWeights.length;
  const rawSqnr =
    sumSquaredError > 1e-15
      ? 10 * Math.log10(Math.max(sumSquaredSignal, 1e-12) / sumSquaredError)
      : 62.4;
  const sqnrDb = Number(clipValue(rawSqnr, 0, 99.9).toFixed(2));

  const profile = CORRIDOR_PROFILES[payload.corridorId];
  const penaltyFactor = outlierMultiplier > 1 ? 0.94 : 1.0;
  const effectiveThroughputGbs = Math.round(profile.nominalBandwidthGbs * penaltyFactor);
  const calibrationLatencyUs = Number(
    (profile.nominalLatencyUs * (outlierMultiplier > 1 ? 2.0 : 1.0)).toFixed(2)
  );

  return {
    scaleFactor: Number(scaleFactor.toFixed(8)),
    inverseScaleFactor: Number(inverseScaleFactor.toFixed(6)),
    amax: Number(safeAmax.toFixed(4)),
    quantizedWeights,
    dequantizedWeights,
    quantizedActivations,
    dequantizedActivations,
    clippedCount,
    meanSquaredError: Number(meanSquaredError.toFixed(10)),
    sqnrDb,
    effectiveThroughputGbs,
    calibrationLatencyUs,
  };
}

/**
 * Generates deterministic harmonic tensor weights for a given matrix index and generation pass.
 * Strictly zero Math.random() calls.
 */
export function synthesizeDeterministicTensor(
  matrixIndex: number,
  generationStep: number,
  length = 16
): { weights: number[]; activations: number[] } {
  const weights: number[] = [];
  const activations: number[] = [];
  for (let i = 0; i < length; i++) {
    const phase = (matrixIndex + 1) * 0.37 + generationStep * 0.19 + i * 0.53;
    const w = Number((Math.sin(phase) * 4.42 + Math.cos(phase * 0.5) * 0.31).toFixed(4));
    const a = Number((Math.cos(phase * 1.1) * 3.85 + Math.sin(phase * 0.7) * 0.24).toFixed(4));
    weights.push(w);
    activations.push(a);
  }
  return { weights, activations };
}

/**
 * Creates the canonical 8-matrix initial state matching exact specification telemetry.
 */
export function buildInitialEngineSnapshot(
  corridorId: CorridorId = CorridorId.ALPHA
): EngineTelemetrySnapshot {
  const corridor = CORRIDOR_PROFILES[corridorId];
  const baseVectors: [number, number, number, number][] = [
    [4.41, 4.45, 4.42, 4.44],
    [4.39, 4.43, 4.40, 4.46],
    [4.42, 4.44, 4.41, 4.45],
    [4.41, 4.45, 4.42, 4.44],
    [4.40, 4.46, 4.43, 4.41],
    [4.44, 4.42, 4.45, 4.43],
    [4.38, 4.41, 4.44, 4.42],
    [4.43, 4.45, 4.40, 4.44],
  ];

  const matrices: MatrixUnitState[] = Array.from({ length: 8 }, (_, idx) => {
    const tensor = synthesizeDeterministicTensor(idx, 1, 16);
    const quant = executeDynamicFp8Quantization({
      corridorId,
      matrixIndex: idx,
      weights: tensor.weights,
      activations: tensor.activations,
      clipMax: corridor.clipMax,
      outlierMultiplier: 1,
      operatorCallsign: 'CREW_CHIEF_INIT',
    });

    const ptrVal = 0x10000 + idx * 0x10;
    const ptrHex = '0x' + ptrVal.toString(16).toUpperCase();

    return {
      index: idx,
      idLabel: 'Matrix ' + String(idx) + ' (M' + String(idx) + ')',
      ptrHex,
      tokensK: 256,
      precision: corridor.precisionFormat,
      latencyMs: 0.02,
      stateLabel: 'QUANTIZED · LOCKED',
      isFault: false,
      scalePercent: 100,
      scaleFactor: quant.scaleFactor,
      inverseScale: quant.inverseScaleFactor,
      amax: quant.amax,
      sqnrDb: quant.sqnrDb,
      mse: quant.meanSquaredError,
      clippedCount: quant.clippedCount,
      vectorSample: baseVectors[idx],
      bufferRotationGeneration: 1,
    };
  });

  return {
    corridor,
    quantThroughputGbs: corridor.nominalBandwidthGbs,
    throughputSaturationPct: corridorId === CorridorId.ALPHA ? 100 : 92,
    calibrationLatencyUs: corridor.nominalLatencyUs,
    activeMatricesCount: 8,
    totalMatricesCount: 8,
    processedTokensUnits: 7552000,
    engineXpK: 75.0,
    fp8StateLabel: 'FP8 State: Quantization Active',
    meshPtrHex: '0xFF8DC0',
    meshMode: 'FP8_QUANT',
    meshVector: [4.41, 4.45, 4.42, 4.44],
    matrices,
    selectedMatrixIndex: 3, // Default M3 inspected per spec ("M3 · TOK: 256K · PREC: FP8-E4M3 · SCALE: 100% · PTR 0x10030 · QUANT: OK · LOCKED")
    outlierSpikeActive: false,
    rotationCount: 1,
  };
}

/**
 * Executes a stepped FP8 activation pass or quantization burst across all 8 matrices.
 */
export function stepEngineQuantizationPass(
  prev: EngineTelemetrySnapshot,
  mode: 'BURST' | 'STEP' | 'CALIBRATE'
): EngineTelemetrySnapshot {
  const nextRotation = prev.rotationCount + 1;
  const tokenDelta = mode === 'BURST' ? 512000 : mode === 'CALIBRATE' ? 128000 : 256000;
  const xpDelta = mode === 'BURST' ? 5.1 : mode === 'CALIBRATE' ? 1.3 : 2.5;

  const updatedMatrices: MatrixUnitState[] = prev.matrices.map((m) => {
    const tensor = synthesizeDeterministicTensor(m.index, nextRotation, 16);
    const outlierMult = m.isFault ? 14.5 : 1.0;
    const quant = executeDynamicFp8Quantization({
      corridorId: prev.corridor.id,
      matrixIndex: m.index,
      weights: tensor.weights,
      activations: tensor.activations,
      clipMax: prev.corridor.clipMax,
      outlierMultiplier: outlierMult,
      operatorCallsign: 'GRIDSYNC_STEP_' + mode,
    });

    const rotatedPtr = 0x10000 + m.index * 0x10 + ((nextRotation - 1) % 4) * 0x100;
    const ptrHex =
      nextRotation === 1
        ? '0x' + (0x10000 + m.index * 0x10).toString(16).toUpperCase()
        : '0x' + rotatedPtr.toString(16).toUpperCase();

    const v0 = Number((4.40 + ((m.index + nextRotation) % 7) * 0.01).toFixed(2));
    const v1 = Number((4.42 + ((m.index * 2 + nextRotation) % 6) * 0.01).toFixed(2));
    const v2 = Number((4.41 + ((m.index + nextRotation * 3) % 5) * 0.01).toFixed(2));
    const v3 = Number((4.43 + ((m.index + nextRotation) % 4) * 0.01).toFixed(2));

    const clearFault = mode === 'CALIBRATE' ? false : m.isFault;

    return {
      ...m,
      ptrHex: mode === 'CALIBRATE' ? '0x' + (0x10000 + m.index * 0x10).toString(16).toUpperCase() : ptrHex,
      tokensK: mode === 'BURST' ? m.tokensK + 64 : m.tokensK + 32,
      precision: prev.corridor.precisionFormat,
      latencyMs: clearFault ? 0.09 : 0.02,
      stateLabel: clearFault ? '⚡ FAULT · SPIKE' : 'QUANTIZED · LOCKED',
      isFault: clearFault,
      scalePercent: clearFault ? 64 : 100,
      scaleFactor: quant.scaleFactor,
      inverseScale: quant.inverseScaleFactor,
      amax: quant.amax,
      sqnrDb: quant.sqnrDb,
      mse: quant.meanSquaredError,
      clippedCount: quant.clippedCount,
      vectorSample: [v0, v1, v2, v3],
      bufferRotationGeneration: nextRotation,
    };
  });

  const faultCount = updatedMatrices.filter((m) => m.isFault).length;
  const activeCount = 8 - faultCount;
  const throughputFactor = faultCount > 0 ? (activeCount / 8) * 0.92 : mode === 'BURST' ? 1.05 : 1.0;
  const quantThroughputGbs = Math.round(prev.corridor.nominalBandwidthGbs * throughputFactor);
  const saturationPct = Math.min(100, Math.round((quantThroughputGbs / 40000) * 100));

  return {
    ...prev,
    quantThroughputGbs,
    throughputSaturationPct: saturationPct,
    calibrationLatencyUs: faultCount > 0 ? 0.04 : prev.corridor.nominalLatencyUs,
    activeMatricesCount: activeCount,
    processedTokensUnits: prev.processedTokensUnits + tokenDelta,
    engineXpK: Number((prev.engineXpK + xpDelta).toFixed(1)),
    fp8StateLabel:
      faultCount > 0
        ? 'FP8 State: Scale Re-Calibration Needed'
        : mode === 'BURST'
        ? 'FP8 State: Burst Saturation Locked'
        : 'FP8 State: Quantization Active',
    meshVector: updatedMatrices[prev.selectedMatrixIndex].vectorSample,
    matrices: updatedMatrices,
    outlierSpikeActive: faultCount > 0,
    rotationCount: nextRotation,
  };
}

/**
 * Toggles an outlier magnitude spike on Matrices M2 and M5 (or clears it and recalibrates).
 */
export function toggleOutlierMagnitudeSpike(
  prev: EngineTelemetrySnapshot
): EngineTelemetrySnapshot {
  const spikeNowActive = !prev.outlierSpikeActive;

  const updatedMatrices: MatrixUnitState[] = prev.matrices.map((m) => {
    const isTarget = m.index === 2 || m.index === 5;
    const faultState = spikeNowActive && isTarget;
    const tensor = synthesizeDeterministicTensor(m.index, prev.rotationCount, 16);
    const quant = executeDynamicFp8Quantization({
      corridorId: prev.corridor.id,
      matrixIndex: m.index,
      weights: tensor.weights,
      activations: tensor.activations,
      clipMax: prev.corridor.clipMax,
      outlierMultiplier: faultState ? 18.5 : 1.0,
      operatorCallsign: 'OUTLIER_INJECTOR',
    });

    return {
      ...m,
      isFault: faultState,
      stateLabel: faultState ? '⚡ FAULT · SPIKE' : 'QUANTIZED · LOCKED',
      latencyMs: faultState ? 0.11 : 0.02,
      scalePercent: faultState ? 58 : 100,
      scaleFactor: quant.scaleFactor,
      inverseScale: quant.inverseScaleFactor,
      amax: quant.amax,
      sqnrDb: quant.sqnrDb,
      mse: quant.meanSquaredError,
      clippedCount: faultState ? 3 : 0,
      vectorSample: faultState ? [79.38, 4.45, 4.42, 4.44] : [4.41, 4.45, 4.42, 4.44],
    };
  });

  const activeMatricesCount = spikeNowActive ? 6 : 8;
  const quantThroughputGbs = spikeNowActive
    ? Math.round(prev.corridor.nominalBandwidthGbs * 0.78)
    : prev.corridor.nominalBandwidthGbs;

  return {
    ...prev,
    quantThroughputGbs,
    throughputSaturationPct: Math.min(100, Math.round((quantThroughputGbs / 40000) * 100)),
    calibrationLatencyUs: spikeNowActive ? 0.05 : prev.corridor.nominalLatencyUs,
    activeMatricesCount,
    fp8StateLabel: spikeNowActive
      ? 'FP8 State: Outlier Spike Detected (M2, M5)'
      : 'FP8 State: Quantization Active',
    matrices: updatedMatrices,
    outlierSpikeActive: spikeNowActive,
  };
}
