/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GF-T3-237: Executable Vitest Suite
 * Verifies numerical fidelity (E4M3 vs E5M2 SQNR), outlier channel isolation,
 * boundary saturation, and GridSync Zero-Trust Zod security gates.
 */

import { describe, expect, it } from 'vitest';
import {
  E4M3_MAX_NORMAL,
  E5M2_MAX_NORMAL,
  SYNTHETIC_FP8_CORRIDORS,
  calibrateTensorBlock,
  computeMatrixBayState,
  isolateOutlierChannels,
  quantizeFp8Scalar,
} from './fp8QuantEngine';

describe('GF-T3-237 FP8 Quantization & Dynamic Block Calibration Suite', () => {
  it('verifies E4M3 achieves higher SQNR than E5M2 on bounded activation blocks', () => {
    const smoothTensor = Array.from({ length: 64 }, (_, i) => Math.sin(i * 0.2) * 14.0);

    const e4m3Block = calibrateTensorBlock({
      blockId: 0,
      format: 'E4M3',
      corridor: SYNTHETIC_FP8_CORRIDORS[0],
      sigmaThreshold: 3.0,
      isolateOutliers: false,
      tensorValues: smoothTensor,
    });

    const e5m2Block = calibrateTensorBlock({
      blockId: 0,
      format: 'E5M2',
      corridor: SYNTHETIC_FP8_CORRIDORS[2],
      sigmaThreshold: 3.0,
      isolateOutliers: false,
      tensorValues: smoothTensor,
    });

    expect(e4m3Block.sqnrDb).toBeGreaterThan(e5m2Block.sqnrDb);
    expect(e4m3Block.sqnrDb).toBeGreaterThan(22.0);
  });

  it('isolates high-magnitude outlier channels and prevents dynamic range collapse', () => {
    const tensor = Array.from({ length: 64 }, (_, i) => Math.cos(i * 0.25) * 5.0);
    tensor[14] = 390.0;
    tensor[51] = -420.0;

    const isolation = isolateOutlierChannels(tensor, 2.5);
    expect(isolation.isolatedIndices).toContain(14);
    expect(isolation.isolatedIndices).toContain(51);
    expect(isolation.amaxRaw).toBe(420.0);
    expect(isolation.amaxFiltered).toBeLessThanOrEqual(5.0);

    const withIsolation = calibrateTensorBlock({
      blockId: 1,
      format: 'E4M3',
      corridor: SYNTHETIC_FP8_CORRIDORS[1],
      sigmaThreshold: 2.5,
      isolateOutliers: true,
      tensorValues: tensor,
    });

    const withoutIsolation = calibrateTensorBlock({
      blockId: 1,
      format: 'E4M3',
      corridor: SYNTHETIC_FP8_CORRIDORS[3],
      sigmaThreshold: 2.5,
      isolateOutliers: false,
      tensorValues: tensor,
    });

    expect(withIsolation.outlierCount).toBe(2);
    expect(withIsolation.sqnrDb).toBeGreaterThan(withoutIsolation.sqnrDb + 10);
  });

  it('enforces hardware saturation boundaries on E4M3 and E5M2 scalars', () => {
    expect(quantizeFp8Scalar(0, 'E4M3')).toBe(0);
    expect(quantizeFp8Scalar(1200, 'E4M3')).toBe(E4M3_MAX_NORMAL);
    expect(quantizeFp8Scalar(-1200, 'E4M3')).toBe(-E4M3_MAX_NORMAL);
    expect(quantizeFp8Scalar(95000, 'E5M2')).toBe(E5M2_MAX_NORMAL);
    expect(quantizeFp8Scalar(-95000, 'E5M2')).toBe(-E5M2_MAX_NORMAL);
  });

  it('produces exact baseline telemetry on Block B3 in the 8-block Matrix Bay', () => {
    const bay = computeMatrixBayState({
      corridor: SYNTHETIC_FP8_CORRIDORS[0],
      primaryFormat: 'E4M3',
      stepPass: 0,
      outlierSpikeActive: false,
      burstMode: false,
    });

    expect(bay).toHaveLength(8);
    const b3 = bay[3];
    expect(b3.blockLabel).toBe('B3');
    expect(b3.format).toBe('E4M3');
    expect(b3.scalingFactor).toBe(0.0312);
    expect(b3.quantErrorMargin).toBe(0.0014);
    expect(b3.state).toBe('CALIBRATED');
  });

  it('blocks SQL injection and untrusted corridors via GridSync Zod ingress validation', () => {
    expect(() =>
      calibrateTensorBlock({
        blockId: 2,
        format: 'E4M3',
        corridor: 'FP8-CORRIDOR-ALPHA; DROP TABLE fp8_corridors;--',
        sigmaThreshold: 2.5,
        isolateOutliers: true,
        tensorValues: [1.0, 2.0, 3.0, 4.0],
      })
    ).toThrow();
  });
});
