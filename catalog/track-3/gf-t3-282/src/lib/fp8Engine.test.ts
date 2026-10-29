/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it } from 'vitest';
import {
  buildInitialEngineSnapshot,
  clipValue,
  CORRIDOR_PROFILES,
  CorridorId,
  executeDynamicFp8Quantization,
  roundFp8Grid,
  stepEngineQuantizationPass,
  synthesizeDeterministicTensor,
  toggleOutlierMagnitudeSpike,
} from './fp8Engine';
import { SUPABASE_SQL_SCHEMA } from './supabaseSchema';

describe('GF-T3-282 FP8 Dynamic Quantization & Calibration Engine', () => {
  it('clips values accurately to FP8-E4M3 [-448, 448] and FP8-E5M2 [-57344, 57344] bounds', () => {
    expect(clipValue(512.4, -448, 448)).toBe(448);
    expect(clipValue(-600.0, -448, 448)).toBe(-448);
    expect(clipValue(128.5, -448, 448)).toBe(128.5);
    expect(roundFp8Grid(447.6)).toBe(448);
    expect(roundFp8Grid(-447.6)).toBe(-448);
  });

  it('executes per-tensor and per-token FP8 quantization with high SQNR and minimal MSE', () => {
    const tensor = synthesizeDeterministicTensor(3, 1, 32);
    const result = executeDynamicFp8Quantization({
      corridorId: CorridorId.ALPHA,
      matrixIndex: 3,
      weights: tensor.weights,
      activations: tensor.activations,
      clipMax: 448.0,
      outlierMultiplier: 1.0,
      operatorCallsign: 'UNIT_TEST_ALPHA',
    });

    expect(result.amax).toBeGreaterThan(0);
    expect(result.scaleFactor).toBeCloseTo(result.amax / 448.0, 6);
    expect(result.inverseScaleFactor).toBeCloseTo(448.0 / result.amax, 4);
    expect(result.quantizedWeights.length).toBe(32);
    expect(result.dequantizedWeights.length).toBe(32);
    expect(result.clippedCount).toBe(0);
    expect(result.meanSquaredError).toBeLessThan(0.001);
    expect(result.sqnrDb).toBeGreaterThan(40);
    expect(result.effectiveThroughputGbs).toBe(40000);
    expect(result.calibrationLatencyUs).toBe(0.01);
  });

  it('rejects SQL injection and XSS payloads at the GridSync Zero-Trust Zod ingress gate', () => {
    const tensor = synthesizeDeterministicTensor(0, 1, 8);
    expect(() =>
      executeDynamicFp8Quantization({
        corridorId: CorridorId.ALPHA,
        matrixIndex: 0,
        weights: tensor.weights,
        activations: tensor.activations,
        clipMax: 448.0,
        outlierMultiplier: 1.0,
        operatorCallsign: 'DROP TABLE fp8_corridors; --',
      })
    ).toThrow(/GridSync Zero-Trust Gate/);

    expect(() =>
      executeDynamicFp8Quantization({
        corridorId: CorridorId.BRAVO,
        matrixIndex: 0,
        weights: tensor.weights,
        activations: tensor.activations,
        clipMax: 448.0,
        outlierMultiplier: 1.0,
        operatorCallsign: '<script>evil()</script>',
      })
    ).toThrow(/GridSync Zero-Trust Gate/);
  });

  it('initializes 8 hardware-accelerated matrix arenas (M0..M7) with canonical telemetry', () => {
    const snap = buildInitialEngineSnapshot(CorridorId.ALPHA);
    expect(snap.matrices.length).toBe(8);
    expect(snap.quantThroughputGbs).toBe(40000);
    expect(snap.calibrationLatencyUs).toBe(0.01);
    expect(snap.processedTokensUnits).toBe(7552000);
    expect(snap.selectedMatrixIndex).toBe(3);
    expect(snap.matrices[3].ptrHex).toBe('0x10030');
    expect(snap.matrices[0].ptrHex).toBe('0x10000');
  });

  it('steps activation passes, rotates buffers, and handles outlier magnitude spikes', () => {
    const initial = buildInitialEngineSnapshot(CorridorId.ALPHA);
    const burst = stepEngineQuantizationPass(initial, 'BURST');
    expect(burst.processedTokensUnits).toBe(initial.processedTokensUnits + 512000);
    expect(burst.rotationCount).toBe(2);

    const spiked = toggleOutlierMagnitudeSpike(burst);
    expect(spiked.outlierSpikeActive).toBe(true);
    expect(spiked.activeMatricesCount).toBe(6);
    expect(spiked.matrices[2].isFault).toBe(true);
    expect(spiked.matrices[5].isFault).toBe(true);

    const recalibrated = stepEngineQuantizationPass(spiked, 'CALIBRATE');
    expect(recalibrated.outlierSpikeActive).toBe(false);
    expect(recalibrated.activeMatricesCount).toBe(8);
  });

  it('enforces the absolute zero-dollar gate across all corridor profiles and SQL schema', () => {
    const serialized = JSON.stringify(CORRIDOR_PROFILES) + SUPABASE_SQL_SCHEMA;
    expect(serialized.includes('\x24')).toBe(false);
  });
});
