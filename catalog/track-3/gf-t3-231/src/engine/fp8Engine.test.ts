/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * GF-T3-231: Vitest Verification Suite (>80% Coverage)
 * Tests FP8 E4M3/E5M2 bit encoding, SNR fidelity, dynamic scaling under outliers, and GridSync security
 */

import { describe, expect, it } from 'vitest';
import {
  FP8Format,
  FP8_FORMAT_SPECS,
  buildAPAVerificationRecord,
  computeBlockAmax,
  computeDynamicScaleFactor,
  createInitialQuantBlocks,
  encodeFP8Scalar,
  quantizeTensorBlock,
  sanitizeGridSyncInput,
} from './fp8Engine';

describe('GF-T3-231 FP8 Quantization & Dynamic Scaling Engine', () => {
  it('verifies E4M3 and E5M2 bit allocation and finite range limits', () => {
    const e4m3 = FP8_FORMAT_SPECS[FP8Format.E4M3];
    const e5m2 = FP8_FORMAT_SPECS[FP8Format.E5M2];

    expect(e4m3.signBits + e4m3.exponentBits + e4m3.mantissaBits).toBe(8);
    expect(e5m2.signBits + e5m2.exponentBits + e5m2.mantissaBits).toBe(8);
    expect(e4m3.maxNormal).toBe(448.0);
    expect(e5m2.maxNormal).toBe(57344.0);

    const clippedE4 = encodeFP8Scalar(600.0, FP8Format.E4M3);
    expect(clippedE4.clipped).toBe(true);
    expect(clippedE4.dequantizedValue).toBe(448.0);
    expect(clippedE4.formattedBits).toBe('0|1111|110');

    const clippedE5 = encodeFP8Scalar(-70000.0, FP8Format.E5M2);
    expect(clippedE5.clipped).toBe(true);
    expect(clippedE5.dequantizedValue).toBe(-57344.0);
    expect(clippedE5.formattedBits).toBe('1|11110|11');
  });

  it('verifies quantization precision bounds and SNR fidelity relative to FP16 master weights', () => {
    const masterWeights = [42.5, -118.25, 210.75, -305.5, 398.0, -88.125, 164.5, 440.0];
    const e4Result = quantizeTensorBlock('B0', 0, masterWeights, FP8Format.E4M3);
    const e5Result = quantizeTensorBlock('B0', 0, masterWeights, FP8Format.E5M2);

    expect(e4Result.snrDb).toBeGreaterThan(24.0);
    expect(e5Result.snrDb).toBeGreaterThan(18.0);
    expect(e4Result.snrDb).toBeGreaterThan(e5Result.snrDb);
    expect(e4Result.clippingRatio).toBe(0);
    expect(e4Result.state).toBe('QUANT_OPTIMIZED');
  });

  it('adapts dynamic scaling factor under synthetic outlier activation spikes', () => {
    const nominalSlice = [20.0, -40.0, 60.0, -80.0, 55.0, -35.0, 75.0, 100.0];
    const outlierSlice = [20.0, -40.0, 60.0, -80.0, 55.0, -35.0, 75.0, 4000.0];

    const amaxNominal = computeBlockAmax(nominalSlice);
    const amaxOutlier = computeBlockAmax(outlierSlice);

    expect(amaxNominal).toBe(100.0);
    expect(amaxOutlier).toBe(4000.0);

    const scaleNominal = computeDynamicScaleFactor(amaxNominal, FP8Format.E4M3);
    const scaleOutlier = computeDynamicScaleFactor(amaxOutlier, FP8Format.E4M3);

    expect(scaleNominal.encodeMultiplier / scaleOutlier.encodeMultiplier).toBeCloseTo(40.0, 4);

    // If we force unscaled multiplier during an outlier spike, saturation fallback triggers
    const saturated = quantizeTensorBlock(
      'B2',
      2,
      [900.0, -850.0, 20.0, -10.0, 950.0, 15.0, -30.0, 40.0],
      FP8Format.E4M3,
      1.0
    );
    expect(saturated.clippingRatio).toBeGreaterThan(0.125);
    expect(saturated.saturationFallback).toBe(true);
    expect(saturated.state).toBe('FALLBACK_FP16');
  });

  it('initializes all 8 hardware blocks with B2 matching exact cockpit telemetry contract', () => {
    const blocks = createInitialQuantBlocks();
    expect(blocks).toHaveLength(8);
    const b2 = blocks[2];
    expect(b2.id).toBe('B2');
    expect(b2.format).toBe(FP8Format.E4M3);
    expect(b2.amax).toBe(448.25);
    expect(b2.scale).toBe(0.0039);
    expect(b2.state).toBe('QUANT_OPTIMIZED');
  });

  it('enforces GridSync zero-trust input sanitization and APA dual-party cryptographic signing', () => {
    expect(sanitizeGridSyncInput('B2_VALID')).toBe('B2_VALID');
    expect(() => sanitizeGridSyncInput('B2; DROP TABLE fp8_quant_blocks')).toThrow();
    expect(() => sanitizeGridSyncInput('<script>evil()</script>')).toThrow();
    expect(() => sanitizeGridSyncInput('FORBIDDEN_' + String.fromCharCode(36))).toThrow();

    const apaRecord = buildAPAVerificationRecord('GF-T3-231-RELEASE-2026', true);
    expect(apaRecord.chassisId).toBe('GF-T3-231');
    expect(apaRecord.dualSignedStatus).toBe('VERIFIED_DUAL_SIGNED');
    expect(apaRecord.merkleEscrowRoot).toHaveLength(32);
  });
});
