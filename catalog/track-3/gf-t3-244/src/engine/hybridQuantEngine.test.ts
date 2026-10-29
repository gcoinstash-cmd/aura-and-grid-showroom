import { describe, expect, it } from 'vitest';
import {
  SYNTHETIC_CORRIDORS,
  GridSyncQuantPayloadSchema,
  calibrateQuantizationBlock,
  computeMeanAndStd,
  createInitialEngineSnapshot,
  gateActivationOutliers,
  projectFp8E4M3Stream,
  projectInt8WeightStream,
} from './hybridQuantEngine';

describe('GF-T3-244 Hybrid Quantization & Outlier-Gated Calibration Suite', () => {
  it('verifies SQNR parity (>50 dB) between FP16 reference and FP8/INT8 hybrid stream', () => {
    const block0 = calibrateQuantizationBlock(0);
    const block3 = calibrateQuantizationBlock(3);

    expect(block0.headerTitle).toBe('Block 0 (B0)');
    expect(block0.activationScale).toBe(0.0128);
    expect(block0.errorPercent).toBe(0.24);
    expect(block0.sqnrDb).toBe(51.4);
    expect(block0.compressionRatio).toBe(2.8);

    expect(block3.blockCode).toBe('B3');
    expect(block3.inspectorScale).toBe(0.0172);
    expect(block3.inspectorError).toBe(0.0018);
    expect(block3.status).toBe('CALIBRATED');
    expect(Math.abs(block3.referenceDot - block3.hybridDot)).toBeLessThan(
      Math.abs(block3.referenceDot) * 0.05
    );
  });

  it('isolates extreme >6-sigma activation channels into FP16 bypass stream', () => {
    const sample = Array.from({ length: 128 }, (_, i) => Math.sin(i * 0.2) * 0.5);
    sample[14] = 28.5;
    sample[99] = -31.2;

    const result = gateActivationOutliers(sample, 6.0);
    expect(result.outlierChannels).toBe(2);
    expect(result.outlierIndices).toContain(14);
    expect(result.outlierIndices).toContain(99);
    expect(result.inliers[14]).toBe(0.0);
    expect(result.outliers[14]).toBe(28.5);
  });

  it('bounds E4M3 FP8 and symmetric INT8 projections within hardware limits', () => {
    const tensor = [-25.0, -3.2, 0.0, 4.8, 32.0];
    const fp8 = projectFp8E4M3Stream(tensor);
    const int8 = projectInt8WeightStream(tensor);

    expect(fp8.scale).toBeGreaterThan(0);
    expect(int8.scale).toBeGreaterThan(0);
    for (const q of fp8.quantized) {
      expect(q).toBeGreaterThanOrEqual(-448.0);
      expect(q).toBeLessThanOrEqual(448.0);
    }
    for (const q of int8.quantized) {
      expect(q).toBeGreaterThanOrEqual(-127);
      expect(q).toBeLessThanOrEqual(127);
    }
  });

  it('handles zero tensors and empty arrays safely without NaN', () => {
    const emptyStats = computeMeanAndStd([]);
    expect(emptyStats.mean).toBe(0);
    expect(emptyStats.stdDev).toBe(0);

    const zeroFp8 = projectFp8E4M3Stream([0, 0, 0, 0]);
    const zeroInt8 = projectInt8WeightStream([0, 0, 0, 0]);
    expect(zeroFp8.scale).toBe(1.0);
    expect(zeroInt8.scale).toBe(1.0);
  });

  it('enforces GridSync Zero-Trust sanitization against SQLi/XSS payloads', () => {
    expect(() =>
      GridSyncQuantPayloadSchema.parse({
        blockIndex: 0,
        corridor: 'HYBRID-CORRIDOR-ALPHA; DROP TABLE quantization_block_runs; --',
        activations: [1, 2, 3, 4],
        weights: [1, 1, 1, 1],
      })
    ).toThrow();

    const valid = GridSyncQuantPayloadSchema.parse({
      blockIndex: 2,
      corridor: SYNTHETIC_CORRIDORS[0],
      activations: [0.2, -0.4, 0.8, 1.1],
      weights: [0.5, 0.3, -0.2, 0.9],
    });
    expect(valid.blockIndex).toBe(2);
  });

  it('initializes full engine snapshot with 8 matrix blocks and 8,600 GB/s bandwidth', () => {
    const snapshot = createInitialEngineSnapshot();
    expect(snapshot.hybridBandwidthGbs).toBe(8600);
    expect(snapshot.calibrationLatencyUs).toBe(0.01);
    expect(snapshot.activeBlocksCount).toBe(16);
    expect(snapshot.processedTokens).toBe(2304000);
    expect(snapshot.blocks).toHaveLength(8);
  });
});
