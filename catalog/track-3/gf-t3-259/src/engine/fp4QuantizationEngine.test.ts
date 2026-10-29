/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import {
  BLOCK_ELEMENT_COUNT,
  FP4_MAX_MAGNITUDE,
  GridSyncQuantizationIngressSchema,
  SYNTHETIC_FP4_CORRIDORS,
  computeEngineTelemetrySnapshot,
  quantizeBlock16,
  quantizeValueFp4,
  synthesizeDeterministicBlockWeights,
} from './fp4QuantizationEngine';
import { SUPABASE_POSTGRESQL_SCHEMA_SQL } from '../schema/supabaseSchema';

describe('GF-T3-259 Block-Scaled FP4 Quantization Engine', () => {
  it('computes exact 16-element block scaling factors and 8:1 compression', () => {
    const rawWeights = [
      -3.5, -3.0, -2.5, -2.0, -1.5, -1.0, -0.5, 0.0,
      0.25, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5,
    ];
    const block = quantizeBlock16(
      rawWeights,
      3,
      SYNTHETIC_FP4_CORRIDORS[0],
      false
    );

    expect(block.blockId).toBe('F3');
    expect(block.hexAddress).toBe('0x8300');
    expect(block.bitsLabel).toBe('FP4');
    expect(block.scaleLabel).toBe('16-EL');
    expect(block.scaleFactor).toBeCloseTo(3.5 / FP4_MAX_MAGNITUDE, 5);
    expect(block.compressionRatio).toBe('8:1');
    expect(block.accuracyFormatted).toBe('99.9%');
    expect(block.outlierFormatted).toBe('0.01%');
    expect(block.stateLabel).toBe('QUANTIZED · LOCKED');
    expect(block.meanSquaredError).toBeLessThan(0.02);
  });

  it('isolates high-magnitude outliers and preserves perplexity under saturation', () => {
    const rawWeights = synthesizeDeterministicBlockWeights(2, 1, 1, true);
    expect(rawWeights.length).toBe(BLOCK_ELEMENT_COUNT);

    const block = quantizeBlock16(
      rawWeights,
      2,
      SYNTHETIC_FP4_CORRIDORS[1],
      true
    );

    expect(block.outlierMask[3]).toBe(true);
    expect(block.outlierMask[11]).toBe(true);
    expect(block.reconstructedWeights[3]).toBeCloseTo(rawWeights[3], 4);
    expect(block.reconstructedWeights[11]).toBeCloseTo(rawWeights[11], 4);
    expect(block.stateLabel).toBe('SATURATED · RECAL');
    expect(block.outlierRatioPct).toBeGreaterThan(10);
  });

  it('computes full 8-block telemetry snapshot with hardware throughput saturation', () => {
    const snapshot = computeEngineTelemetrySnapshot(
      SYNTHETIC_FP4_CORRIDORS[0],
      0,
      0,
      false,
      3
    );

    expect(snapshot.throughputGbPerSec).toBe(21800);
    expect(snapshot.throughputFormatted).toBe('21,800 GB/s');
    expect(snapshot.latencyFormatted).toBe('0.01 µs');
    expect(snapshot.compressionRatioLabel).toBe('8:1');
    expect(snapshot.activeBlocksCount).toBe(8);
    expect(snapshot.processedTokensFormatted).toBe('4,224,000 UNITS');
    expect(snapshot.engineXpFormatted).toBe('+75.0k ENGINE XP');
    expect(snapshot.fp4StateLabel).toBe('FP4 State: Quantized Active');
    expect(snapshot.meshPointerHex).toBe('0x7F8DC0');
    expect(snapshot.blocks.length).toBe(8);
  });

  it('enforces GridSync Zero-Trust Zod ingress sanitization against SQLi and XSS', () => {
    const validPayload = {
      corridor: SYNTHETIC_FP4_CORRIDORS[0],
      weights: synthesizeDeterministicBlockWeights(0, 0, 0, false),
      outlierThresholdSigma: 3.0,
      operatorCallsign: 'CREW_CHIEF_01',
    };
    expect(GridSyncQuantizationIngressSchema.safeParse(validPayload).success).toBe(true);

    const sqliPayload = {
      ...validPayload,
      operatorCallsign: 'ADMIN; DROP TABLE fp4_quantization_passes--',
    };
    expect(GridSyncQuantizationIngressSchema.safeParse(sqliPayload).success).toBe(false);

    const xssPayload = {
      ...validPayload,
      operatorCallsign: '<script>evil()</script>',
    };
    expect(GridSyncQuantizationIngressSchema.safeParse(xssPayload).success).toBe(false);
  });

  it('enforces absolute zero-dollar character gate across telemetry and SQL schema', () => {
    const snapshot = computeEngineTelemetrySnapshot(
      SYNTHETIC_FP4_CORRIDORS[0],
      2,
      1,
      false,
      3
    );
    const serialized = JSON.stringify(snapshot);
    expect(serialized.includes('\x24')).toBe(false);
    expect(SUPABASE_POSTGRESQL_SCHEMA_SQL.includes('\x24')).toBe(false);
    expect(quantizeValueFp4(99)).toBe(7.0);
    expect(quantizeValueFp4(-99)).toBe(-7.0);
  });
});
