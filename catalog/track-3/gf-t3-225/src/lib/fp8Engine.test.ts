/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GF-T3-225 — Automated Vitest Verification Suite (>80% Coverage Gate)
 */

import { describe, expect, it } from 'vitest';
import {
  E4M3_MAX_VAL,
  E5M2_MAX_VAL,
  PrecisionFormat,
  ScalingMode,
  SYNTHETIC_CORRIDORS,
  computeScaleFactors,
  encodeFp8Scalar,
  executeFp8GemmPass,
  sanitizeAndValidateGemmInput,
} from './fp8Engine';

describe('GF-T3-225 FP8 Mixed-Precision GEMM & Microscaling Engine', () => {
  it('1. Verifies numerical equivalence and SNR parity within 0.5% on power-of-two aligned matrices', () => {
    const exactA = [
      [1.0, 2.0, -4.0, 0.5],
      [0.25, -1.0, 2.0, 0.5],
      [2.0, 4.0, 1.0, -2.0],
      [0.5, 1.0, -0.5, 2.0],
    ];
    const exactB = [
      [2.0, -1.0, 0.5, 4.0],
      [1.0, 2.0, -2.0, 0.5],
      [0.5, 1.0, 4.0, -1.0],
      [4.0, -0.5, 1.0, 2.0],
    ];

    const res = executeFp8GemmPass({
      corridor: SYNTHETIC_CORRIDORS[0],
      formatA: PrecisionFormat.E4M3,
      formatB: PrecisionFormat.E4M3,
      scalingMode: ScalingMode.DYNAMIC_BLOCK,
      outlierClipThreshold: null,
      outlierSpikeActive: false,
      stepIndex: 1,
      customMatrixA: exactA,
      customMatrixB: exactB,
    });

    expect(res.telemetry.relativeL2Error).toBeLessThanOrEqual(0.005);
    expect(res.telemetry.snrParityPct).toBeGreaterThanOrEqual(99.5);
  });

  it('2. Verifies exact scale factor generation across 10x heavy-tailed outlier activations', () => {
    const outlierMatrix = [
      [1.5, -2.0, 224.0, 0.5],
      [-4.0, 14.0, 7.0, -3.5],
      [2.0, -8.0, 4.0, 1.0],
      [28.0, -14.0, 7.0, 3.5],
    ];

    const dynamicScales = computeScaleFactors(
      outlierMatrix,
      PrecisionFormat.E4M3,
      ScalingMode.DYNAMIC_BLOCK,
      'row'
    );
    expect(dynamicScales[0]).toBeCloseTo(E4M3_MAX_VAL / 224.0, 6);
    expect(dynamicScales[1]).toBeCloseTo(E4M3_MAX_VAL / 14.0, 6);
    expect(dynamicScales[2]).toBeCloseTo(E4M3_MAX_VAL / 8.0, 6);
    expect(dynamicScales[3]).toBeCloseTo(E4M3_MAX_VAL / 28.0, 6);

    const staticScales = computeScaleFactors(
      outlierMatrix,
      PrecisionFormat.E4M3,
      ScalingMode.STATIC_TENSOR,
      'row'
    );
    expect(staticScales[0]).toBeCloseTo(E4M3_MAX_VAL / 224.0, 6);
    expect(staticScales[1]).toBeCloseTo(E4M3_MAX_VAL / 224.0, 6);

    const e5m2Scales = computeScaleFactors(
      outlierMatrix,
      PrecisionFormat.E5M2,
      ScalingMode.DYNAMIC_BLOCK,
      'row'
    );
    expect(e5m2Scales[0]).toBeCloseTo(E5M2_MAX_VAL / 224.0, 6);
  });

  it('3. Verifies memory footprint reduction is strictly 50% relative to BF16 baseline', () => {
    const res = executeFp8GemmPass({
      corridor: SYNTHETIC_CORRIDORS[1],
      formatA: PrecisionFormat.E4M3,
      formatB: PrecisionFormat.E5M2,
      scalingMode: ScalingMode.DYNAMIC_BLOCK,
      outlierClipThreshold: 45.0,
      outlierSpikeActive: true,
      stepIndex: 2,
    });

    expect(res.telemetry.bf16FootprintBytes).toBe(64);
    expect(res.telemetry.fp8FootprintBytes).toBe(32);
    expect(res.telemetry.memoryReductionPct).toBe(50.0);
    expect(res.telemetry.clippedElementsCount).toBeGreaterThanOrEqual(2);
  });

  it('4. Verifies E4M3 and E5M2 bit-level saturation, subnormals, and GridSync Zero-Trust gates', () => {
    const zeroEnc = encodeFp8Scalar(0, PrecisionFormat.E4M3);
    expect(zeroEnc.bitString).toBe('00000000');
    expect(zeroEnc.quantizedValue).toBe(0);

    const satE4M3 = encodeFp8Scalar(-900.0, PrecisionFormat.E4M3);
    expect(satE4M3.quantizedValue).toBe(-448.0);
    expect(satE4M3.isSaturated).toBe(true);
    expect(satE4M3.signBit).toBe(1);

    const subE4M3 = encodeFp8Scalar(0.004, PrecisionFormat.E4M3);
    expect(subE4M3.exponentBits).toBe('0000');
    expect(subE4M3.isSubnormal).toBe(true);

    // Reject SQLi / XSS payload in GridSync Zero-Trust sanitizer
    expect(() =>
      sanitizeAndValidateGemmInput({
        corridor: SYNTHETIC_CORRIDORS[0],
        formatA: PrecisionFormat.E4M3,
        formatB: PrecisionFormat.E4M3,
        scalingMode: ScalingMode.DYNAMIC_BLOCK,
        outlierClipThreshold: null,
        matrixA: [[1, 2], [3, 4]],
        matrixB: [[1, 2], [3, 4]],
        operatorNote: 'DROP TABLE gf_t3_225_gemm_runs;--',
      })
    ).toThrow();
  });
});
