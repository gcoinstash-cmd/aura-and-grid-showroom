/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod';

export type CorridorId =
  | 'FP4-CORRIDOR-ALPHA (BLOCK-SCALED-QUANTIZATION-FABRIC · 21800-GB/S)'
  | 'FP4-CORRIDOR-BRAVO (DYNAMIC-OUTLIER-RETENTION-ENGINE)'
  | 'FP4-CORRIDOR-GAMMA (FP4-TENSOR-CORE-ACCELERATION-PIPELINE)'
  | 'FP4-CORRIDOR-DELTA (FALLBACK-FP8-PRECISION-PASS)';

export const SYNTHETIC_FP4_CORRIDORS: readonly CorridorId[] = [
  'FP4-CORRIDOR-ALPHA (BLOCK-SCALED-QUANTIZATION-FABRIC · 21800-GB/S)',
  'FP4-CORRIDOR-BRAVO (DYNAMIC-OUTLIER-RETENTION-ENGINE)',
  'FP4-CORRIDOR-GAMMA (FP4-TENSOR-CORE-ACCELERATION-PIPELINE)',
  'FP4-CORRIDOR-DELTA (FALLBACK-FP8-PRECISION-PASS)',
] as const;

/**
 * E2M1 4-bit floating-point quantization lattice (15 distinct representable values + signed zero)
 * Maps normalized values in [-7.0, 7.0] to discrete 4-bit levels.
 */
export const FP4_LATTICE_LEVELS: readonly number[] = [
  -7.0, -6.0, -5.0, -4.0, -3.0, -2.0, -1.5, -1.0, -0.5,
  0.0,
  0.5, 1.0, 1.5, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0,
] as const;

export const FP4_MAX_MAGNITUDE = 7.0;
export const BLOCK_ELEMENT_COUNT = 16;
export const TOTAL_BLOCKS = 8;

export interface QuantizedBlockTelemetry {
  blockIndex: number;
  blockId: string;
  title: string;
  hexAddress: string;
  bitsLabel: 'FP4' | 'FP8';
  scaleLabel: string;
  scaleFactor: number;
  outlierRatioPct: number;
  outlierFormatted: string;
  accuracyPct: number;
  accuracyFormatted: string;
  stateLabel: 'QUANTIZED · LOCKED' | 'SATURATED · RECAL' | 'FALLBACK · LOCKED';
  statusBadge: 'LOCKED' | 'FAULT' | 'RECAL';
  rawWeights: number[];
  quantizedIndices: number[];
  reconstructedWeights: number[];
  outlierMask: boolean[];
  meanSquaredError: number;
  compressionRatio: string;
}

export interface EngineTelemetrySnapshot {
  corridor: CorridorId;
  throughputGbPerSec: number;
  throughputFormatted: string;
  throughputSaturationPct: number;
  latencyMicroSec: number;
  latencyFormatted: string;
  compressionRatioLabel: string;
  activeBlocksCount: number;
  totalBlocksCount: number;
  processedTokens: number;
  processedTokensFormatted: string;
  engineXpFormatted: string;
  fp4StateLabel: string;
  meshPointerHex: string;
  meshModeLabel: string;
  meshVectorPreview: number[];
  blocks: QuantizedBlockTelemetry[];
  selectedBlockIndex: number;
  outlierSaturationActive: boolean;
  stepPassCount: number;
  burstCount: number;
  perplexityDelta: number;
}

export interface RadioLogEntry {
  id: string;
  timestamp: string;
  callsign: '🟢 CREW CHIEF' | '🟢 TELEMETRY' | '⚡ PIT WALL' | '🔴 TELEMETRY';
  message: string;
}

/**
 * GridSync Zero-Trust Ingress Payload Schema (Zod)
 * Scrubs against SQL injection, XSS, and schema pollution.
 */
export const GridSyncQuantizationIngressSchema = z.object({
  corridor: z.enum([
    'FP4-CORRIDOR-ALPHA (BLOCK-SCALED-QUANTIZATION-FABRIC · 21800-GB/S)',
    'FP4-CORRIDOR-BRAVO (DYNAMIC-OUTLIER-RETENTION-ENGINE)',
    'FP4-CORRIDOR-GAMMA (FP4-TENSOR-CORE-ACCELERATION-PIPELINE)',
    'FP4-CORRIDOR-DELTA (FALLBACK-FP8-PRECISION-PASS)',
  ]),
  weights: z.array(z.number().finite().min(-1000).max(1000)).min(16).max(1024),
  outlierThresholdSigma: z.number().finite().min(1.0).max(10.0).default(3.0),
  operatorCallsign: z
    .string()
    .min(2)
    .max(32)
    .refine(
      (val) =>
        !val.includes('<') &&
        !val.includes('>') &&
        !val.includes(';') &&
        !val.includes('--') &&
        !val.toLowerCase().includes('drop ') &&
        !val.toLowerCase().includes('select ') &&
        !val.toLowerCase().includes('script'),
      { message: 'GridSync Zero-Trust Gate rejected unsafe operatorCallsign tokens.' }
    ),
});

export type GridSyncQuantizationIngress = z.infer<typeof GridSyncQuantizationIngressSchema>;

/**
 * Quantizes a single normalized value w/s into the nearest 4-bit FP4 lattice level.
 * Formula: W_quant = quant_4(W / s)
 */
export function quantizeValueFp4(normalizedValue: number): number {
  const clamped = Math.max(-FP4_MAX_MAGNITUDE, Math.min(FP4_MAX_MAGNITUDE, normalizedValue));
  let bestLevel = FP4_LATTICE_LEVELS[0];
  let minDiff = Math.abs(clamped - bestLevel);

  for (let i = 1; i < FP4_LATTICE_LEVELS.length; i++) {
    const level = FP4_LATTICE_LEVELS[i];
    const diff = Math.abs(clamped - level);
    if (diff < minDiff) {
      minDiff = diff;
      bestLevel = level;
    }
  }
  return bestLevel;
}

/**
 * Deterministic generator for 16-element weight blocks based on block index, step count,
 * burst intensity, and outlier saturation flag. Uses pure trigonometric harmonic synthesis
 * (zero Math.random() calls).
 */
export function synthesizeDeterministicBlockWeights(
  blockIndex: number,
  stepPass: number,
  burstCount: number,
  outlierSaturation: boolean
): number[] {
  const weights: number[] = [];
  const phaseOffset = blockIndex * 0.45 + stepPass * 0.19 + burstCount * 0.31;

  for (let i = 0; i < BLOCK_ELEMENT_COUNT; i++) {
    const harmonicA = Math.sin(phaseOffset + i * 0.52) * 1.65;
    const harmonicB = Math.cos(phaseOffset * 1.3 - i * 0.27) * 0.72;
    let value = Number((harmonicA + harmonicB).toFixed(4));

    if (outlierSaturation && (i === 3 || i === 11)) {
      const spikeSign = i % 2 === 0 ? 1 : -1;
      value = Number((spikeSign * (9.45 + blockIndex * 0.65 + burstCount * 0.4)).toFixed(4));
    }
    weights.push(value);
  }
  return weights;
}

/**
 * Executes 16-element Block-Scaled FP4 Quantization with Dynamic Outlier Retention.
 * Formula: s = max(|W_inlier|) / 7.0, W_quant = quant_4(W / s)
 */
export function quantizeBlock16(
  rawWeights: number[],
  blockIndex: number,
  corridor: CorridorId,
  outlierSaturation: boolean,
  outlierThresholdSigma = 2.65
): QuantizedBlockTelemetry {
  if (rawWeights.length !== BLOCK_ELEMENT_COUNT) {
    throw new Error('Block quantization requires strictly 16 elements per block.');
  }

  // Compute mean and standard deviation for dynamic outlier detection
  let sum = 0;
  for (let i = 0; i < rawWeights.length; i++) {
    sum += rawWeights[i];
  }
  const mean = sum / rawWeights.length;

  let varianceSum = 0;
  for (let i = 0; i < rawWeights.length; i++) {
    const diff = rawWeights[i] - mean;
    varianceSum += diff * diff;
  }
  const stdDev = Math.sqrt(varianceSum / rawWeights.length) || 1e-6;
  const threshold = Math.max(3.8, Math.abs(mean) + outlierThresholdSigma * stdDev);

  const outlierMask: boolean[] = [];
  const inlierMagnitudes: number[] = [];
  let outlierCount = 0;

  for (let i = 0; i < rawWeights.length; i++) {
    const absVal = Math.abs(rawWeights[i]);
    const isOutlier = outlierSaturation ? absVal > 4.2 : absVal > threshold;
    outlierMask.push(isOutlier);
    if (isOutlier) {
      outlierCount += 1;
    } else {
      inlierMagnitudes.push(absVal);
    }
  }

  const maxInlier =
    inlierMagnitudes.length > 0 ? Math.max(...inlierMagnitudes, 1e-5) : 1.0;

  const isFallbackFp8 = corridor === 'FP4-CORRIDOR-DELTA (FALLBACK-FP8-PRECISION-PASS)';
  const maxQuantLevel = isFallbackFp8 ? 127.0 : FP4_MAX_MAGNITUDE;
  const scaleFactor = Number((maxInlier / maxQuantLevel).toFixed(6));

  const quantizedIndices: number[] = [];
  const reconstructedWeights: number[] = [];
  let sqErrorSum = 0;
  let signalEnergySum = 0;

  for (let i = 0; i < rawWeights.length; i++) {
    const w = rawWeights[i];
    signalEnergySum += w * w;

    if (outlierMask[i]) {
      // Dynamic Outlier Retention: isolated in high-precision sparse sub-matrix
      quantizedIndices.push(0);
      reconstructedWeights.push(w);
    } else {
      const normalized = w / scaleFactor;
      const qVal = isFallbackFp8
        ? Math.round(Math.max(-127, Math.min(127, normalized)))
        : quantizeValueFp4(normalized);
      const recon = Number((qVal * scaleFactor).toFixed(5));
      quantizedIndices.push(qVal);
      reconstructedWeights.push(recon);
      const err = w - recon;
      sqErrorSum += err * err;
    }
  }

  const mse = Number((sqErrorSum / rawWeights.length).toFixed(6));
  const relativeErr = signalEnergySum > 0 ? Math.sqrt(sqErrorSum / signalEnergySum) : 0;

  // Baseline accuracy is 99.9% under nominal FP4 block scaling with outlier retention
  const accuracyPct = outlierSaturation
    ? Number(Math.max(96.4, 99.2 - blockIndex * 0.15 - relativeErr * 2.5).toFixed(1))
    : 99.9;

  const outlierRatioPct = outlierSaturation
    ? Number(((outlierCount / BLOCK_ELEMENT_COUNT) * 100).toFixed(2))
    : 0.01;

  const hexNum = 0x8000 + blockIndex * 0x0100;
  const hexAddress = '0x' + hexNum.toString(16).toUpperCase();
  const blockId = 'F' + String(blockIndex);
  const title = 'Block ' + String(blockIndex) + ' (' + blockId + ')';

  const bitsLabel: 'FP4' | 'FP8' = isFallbackFp8 ? 'FP8' : 'FP4';
  const stateLabel: QuantizedBlockTelemetry['stateLabel'] = outlierSaturation
    ? 'SATURATED · RECAL'
    : isFallbackFp8
      ? 'FALLBACK · LOCKED'
      : 'QUANTIZED · LOCKED';

  const statusBadge: QuantizedBlockTelemetry['statusBadge'] = outlierSaturation
    ? 'RECAL'
    : 'LOCKED';

  return {
    blockIndex,
    blockId,
    title,
    hexAddress,
    bitsLabel,
    scaleLabel: '16-EL',
    scaleFactor,
    outlierRatioPct,
    outlierFormatted: String(outlierRatioPct) + '%',
    accuracyPct,
    accuracyFormatted: String(accuracyPct) + '%',
    stateLabel,
    statusBadge,
    rawWeights,
    quantizedIndices,
    reconstructedWeights,
    outlierMask,
    meanSquaredError: mse,
    compressionRatio: isFallbackFp8 ? '4:1' : '8:1',
  };
}

/**
 * Formats integer with comma separators without locale dependency issues.
 */
export function formatIntegerWithCommas(value: number): string {
  const rounded = Math.round(value);
  return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Computes a complete deterministic engine telemetry snapshot across all 8 FP4 blocks (F0-F7).
 */
export function computeEngineTelemetrySnapshot(
  corridor: CorridorId,
  stepPassCount: number,
  burstCount: number,
  outlierSaturationActive: boolean,
  selectedBlockIndex: number
): EngineTelemetrySnapshot {
  const clampedSelected = Math.max(0, Math.min(TOTAL_BLOCKS - 1, selectedBlockIndex));
  const blocks: QuantizedBlockTelemetry[] = [];

  for (let b = 0; b < TOTAL_BLOCKS; b++) {
    const rawWeights = synthesizeDeterministicBlockWeights(
      b,
      stepPassCount,
      burstCount,
      outlierSaturationActive
    );
    const blockTelemetry = quantizeBlock16(
      rawWeights,
      b,
      corridor,
      outlierSaturationActive
    );
    blocks.push(blockTelemetry);
  }

  const isFallbackFp8 = corridor === 'FP4-CORRIDOR-DELTA (FALLBACK-FP8-PRECISION-PASS)';
  const baseThroughput =
    corridor === 'FP4-CORRIDOR-ALPHA (BLOCK-SCALED-QUANTIZATION-FABRIC · 21800-GB/S)'
      ? 21800
      : corridor === 'FP4-CORRIDOR-BRAVO (DYNAMIC-OUTLIER-RETENTION-ENGINE)'
        ? 21450
        : corridor === 'FP4-CORRIDOR-GAMMA (FP4-TENSOR-CORE-ACCELERATION-PIPELINE)'
          ? 22400
          : 14200;

  const burstBonus = burstCount * 320 + stepPassCount * 45;
  const saturationPenalty = outlierSaturationActive ? -1150 : 0;
  const throughputGbPerSec = Math.max(8000, baseThroughput + burstBonus + saturationPenalty);
  const throughputFormatted = formatIntegerWithCommas(throughputGbPerSec) + ' GB/s';
  const throughputSaturationPct = Math.min(100, Math.max(45, Math.round((throughputGbPerSec / 24000) * 100)));

  const latencyMicroSec = outlierSaturationActive
    ? 0.04
    : isFallbackFp8
      ? 0.02
      : 0.01;
  const latencyFormatted = latencyMicroSec.toFixed(2) + ' µs';
  const compressionRatioLabel = isFallbackFp8 ? '4:1' : '8:1';

  const baseTokens = 4224000;
  const processedTokens = baseTokens + stepPassCount * 64000 + burstCount * 256000;
  const processedTokensFormatted = formatIntegerWithCommas(processedTokens) + ' UNITS';

  const xpValueK = (75.0 + stepPassCount * 2.5 + burstCount * 5.0).toFixed(1);
  const engineXpFormatted = '+' + xpValueK + 'k ENGINE XP';

  const fp4StateLabel = outlierSaturationActive
    ? 'FP4 State: Outlier Recalibration'
    : 'FP4 State: Quantized Active';

  const ptrHexVal = 0x7f8dc0 + stepPassCount * 0x10;
  const meshPointerHex = '0x' + ptrHexVal.toString(16).toUpperCase();

  const vecBase = 2.11 + (stepPassCount % 5) * 0.01;
  const meshVectorPreview = [
    Number(vecBase.toFixed(2)),
    Number((vecBase + 0.04).toFixed(2)),
    Number((vecBase + 0.01).toFixed(2)),
    Number((vecBase + 0.03).toFixed(2)),
  ];

  const perplexityDelta = outlierSaturationActive ? 0.0042 : 0.0;

  return {
    corridor,
    throughputGbPerSec,
    throughputFormatted,
    throughputSaturationPct,
    latencyMicroSec,
    latencyFormatted,
    compressionRatioLabel,
    activeBlocksCount: TOTAL_BLOCKS,
    totalBlocksCount: TOTAL_BLOCKS,
    processedTokens,
    processedTokensFormatted,
    engineXpFormatted,
    fp4StateLabel,
    meshPointerHex,
    meshModeLabel: isFallbackFp8 ? 'FP8_FALLBACK_PASS' : 'FP4_QUANTIZATION',
    meshVectorPreview,
    blocks,
    selectedBlockIndex: clampedSelected,
    outlierSaturationActive,
    stepPassCount,
    burstCount,
    perplexityDelta,
  };
}
