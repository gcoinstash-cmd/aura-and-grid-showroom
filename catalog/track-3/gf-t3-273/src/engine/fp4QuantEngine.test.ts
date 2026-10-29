/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Executable Vitest Test Suite for GF-T3-273
 * Verifies block-scaled FP4 E2M1 quantization math, sub-byte packing, outlier rescaling,
 * 75% memory reduction, and GridSync zero-trust Zod sanitization.
 */

import { describe, it, expect } from 'vitest';
import {
  encodeScalarToFp4Nibble,
  decodeFp4NibbleToScalar,
  packFp4NibblesToSubBytes,
  quantizeWeightBlock,
  buildEngineSnapshot,
  GridSyncBlockPayloadSchema,
  sanitizeGridSyncString,
  SYNTHETIC_FP4_CORRIDORS,
} from './fp4QuantEngine';

describe('GF-T3-273 Block-Scaled FP4 Quantization & Mixed-Precision Engine', () => {
  it('encodes and decodes E2M1 4-bit floating-point levels accurately', () => {
    const zeroEncoded = encodeScalarToFp4Nibble(0.0);
    expect(zeroEncoded.nibble).toBe(0x0);
    expect(decodeFp4NibbleToScalar(zeroEncoded.nibble)).toBe(0.0);

    const posMax = encodeScalarToFp4Nibble(6.0);
    expect(posMax.nibble).toBe(0x7);
    expect(decodeFp4NibbleToScalar(posMax.nibble)).toBe(6.0);

    const negFour = encodeScalarToFp4Nibble(-4.0);
    expect(negFour.nibble).toBe(0x8 | 0x6);
    expect(decodeFp4NibbleToScalar(negFour.nibble)).toBe(-4.0);
  });

  it('packs pairs of 4-bit FP4 nibbles into 8-bit hardware sub-bytes without loss', () => {
    const nibbles = [0x7, 0xf, 0x2, 0xa];
    const packed = packFp4NibblesToSubBytes(nibbles);
    expect(packed).toEqual(['0x7F', '0x2A']);
  });

  it('achieves exact 75% memory footprint reduction vs FP16 with high SQNR', () => {
    const weights = [-12.0, -6.0, -3.0, 0.0, 3.0, 6.0, 9.0, 12.0];
    const block = quantizeWeightBlock(weights, 3);

    expect(block.blockId).toBe('B3');
    expect(block.hexPtr).toBe('0x7030');
    expect(block.memoryFootprintReductionPct).toBe(75.0);
    expect(block.scaleFactor).toBeCloseTo(2.0, 5);
    expect(block.sqnrDb).toBeGreaterThan(25.0);
    expect(block.statusLabel).toBe('QUANTIZED · LOCKED');
  });

  it('dynamically recomputes block scaling factor when an outlier magnitude spike occurs', () => {
    const weights = [6.0, -3.0, 2.0, -1.0, 4.0, -2.0, 1.5, -0.5];
    const normalBlock = quantizeWeightBlock(weights, 1, { outlierSpike: false });
    const spikedBlock = quantizeWeightBlock(weights, 1, { outlierSpike: true });

    expect(spikedBlock.scaleFactor).toBeGreaterThan(normalBlock.scaleFactor * 4.0);
    expect(spikedBlock.precisionMode).toBe('BF16-GUARD');
    expect(spikedBlock.statusLabel).toBe('RESCALING · SPIKE');
  });

  it('builds complete 8-block telemetry snapshot at 32,800 GB/s nominal saturation', () => {
    const snap = buildEngineSnapshot({
      corridor: SYNTHETIC_FP4_CORRIDORS[0],
      cycleCount: 0,
      outlierSpikeBlocks: [],
      mixedPassActive: false,
      selectedBlockIndex: 3,
      processedTokensUnits: 6400000,
      engineXpK: 75.0,
    });

    expect(snap.blocks.length).toBe(8);
    expect(snap.throughputGbs).toBe(32800);
    expect(snap.scalingLatencyUs).toBe(0.01);
    expect(snap.meanScaleVector).toEqual([3.51, 3.55, 3.52, 3.54]);
  });

  it('enforces GridSync zero-trust Zod validation and scrubs SQL/XSS injection vectors', () => {
    const validResult = GridSyncBlockPayloadSchema.safeParse({
      blockIndex: 3,
      corridor: SYNTHETIC_FP4_CORRIDORS[0],
      weights: [1.5, -2.0, 3.0, 4.5],
      forceOutlierSpike: false,
    });
    expect(validResult.success).toBe(true);

    const invalidResult = GridSyncBlockPayloadSchema.safeParse({
      blockIndex: 99,
      corridor: 'INVALID-CORRIDOR',
      weights: [1.0],
    });
    expect(invalidResult.success).toBe(false);

    const dirtyInput = '<script>DROP TABLE blocks;</script>';
    const cleanOutput = sanitizeGridSyncString(dirtyInput);
    expect(cleanOutput).not.toContain('<script>');
    expect(cleanOutput).not.toContain('DROP');
  });
});
