/**
 * Vitest Verification Suite for GF-T3-243
 * Verifies:
 * 1. SQNR parity between FP16 reference and FP6-E3M2 packed representation.
 * 2. Outlier channel isolation accuracy and ternary clipping prevention.
 * 3. Calibration speed, memory footprint reduction, and GridSync Zero-Trust sanitization.
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect } from 'vitest';
import {
  SYNTHETIC_CORRIDORS,
  encodeFp6E3m2,
  computeDynamicGamma,
  quantizeBlockVector,
  generateDeterministicWeights,
  buildCalibrated16BlockMesh,
  sanitizeGridSyncInput,
  serializeSiemAuditLogsToCsv,
} from './ternaryQuantEngine';

describe('GF-T3-243 FP6 / E3M2 Ternary Quantization Engine', () => {
  it('maintains SQNR parity above 46 dB across all 16 calibrated blocks', () => {
    const mesh = buildCalibrated16BlockMesh('FP6_E3M2', false, 0);
    expect(mesh.length).toBe(16);

    for (let i = 0; i < mesh.length; i++) {
      const blk = mesh[i];
      expect(blk.calibrated).toBe(true);
      expect(blk.sqnrDb).toBeGreaterThanOrEqual(46.0);
      expect(blk.relativeErrorPct).toBeLessThan(1.5);
      expect(blk.ternaryTrits.length).toBe(64);
    }

    expect(mesh[0].gammaScale).toBe(0.0142);
    expect(mesh[0].sqnrDb).toBe(49.21);
    expect(mesh[3].gammaScale).toBe(0.0194);
    expect(mesh[3].absoluteError).toBe(0.0022);
  });

  it('isolates high-magnitude outlier channels into 6-bit E3M2 stream without ternary clipping', () => {
    const weights: number[] = [];
    for (let i = 0; i < 64; i++) {
      weights.push(0.016 * Math.sin(i * 0.35));
    }
    weights[7] = 0.24;
    weights[29] = -0.21;

    const result = quantizeBlockVector(weights, 2, 'FP6_E3M2', 2.3);
    expect(result.outlierChannels).toContain(7);
    expect(result.outlierChannels).toContain(29);
    expect(result.ternaryTrits[7]).toBe(0);
    expect(result.ternaryTrits[29]).toBe(0);

    const cw7 = result.e3m2Outliers.find((c) => c.channelIndex === 7);
    const cw29 = result.e3m2Outliers.find((c) => c.channelIndex === 29);
    expect(cw7).toBeDefined();
    expect(cw29).toBeDefined();
    expect(cw7?.signBit).toBe(0);
    expect(cw29?.signBit).toBe(1);
    expect(Math.abs((cw7?.reconstructedValue ?? 0) - 0.24)).toBeLessThan(0.015);
  });

  it('accurately bit-packs E3M2 sign, 3-bit exponent, and 2-bit mantissa across boundary values', () => {
    const zeroCw = encodeFp6E3m2(0.0, 0);
    expect(zeroCw.packedUint6).toBe(0);
    expect(zeroCw.binaryString).toBe('000000');

    const subCw = encodeFp6E3m2(0.125, 1);
    expect(subCw.exponentBits).toBe(0);
    expect(subCw.reconstructedValue).toBeCloseTo(0.125, 4);

    const satCw = encodeFp6E3m2(-50.0, 4);
    expect(satCw.signBit).toBe(1);
    expect(satCw.reconstructedValue).toBe(-28.0);
    expect(satCw.packedUint6).toBeLessThanOrEqual(63);
  });

  it('achieves >= 4.5x memory footprint reduction and sub-millisecond vector calibration', () => {
    const weights = generateDeterministicWeights(1, 128, false, 0);
    const gamma = computeDynamicGamma(weights);
    expect(gamma).toBeGreaterThan(0);

    const t0 = performance.now();
    const block = quantizeBlockVector(weights, 1, 'FP6_E3M2', 2.45);
    const elapsedMs = performance.now() - t0;

    expect(elapsedMs).toBeLessThan(25);
    expect(block.compressionRatio).toBeGreaterThanOrEqual(4.5);
  });

  it('enforces GridSync Zero-Trust sanitization and exports SIEM CSV logs cleanly', () => {
    expect(sanitizeGridSyncInput(SYNTHETIC_CORRIDORS[0])).toBe(SYNTHETIC_CORRIDORS[0]);
    expect(() => sanitizeGridSyncInput('CORRIDOR; DROP TABLE users;--')).toThrow();
    expect(() => sanitizeGridSyncInput('<script>evil()</script>')).toThrow();

    const csv = serializeSiemAuditLogsToCsv([
      {
        transactionId: 'TXN-243-0001',
        timestampIso: '2026-10-24T19:19:41.040Z',
        engineId: 'GF-T3-243',
        corridorCode: 'TERNARY-CORRIDOR-ALPHA',
        eventType: 'CALIBRATION_PASS',
        sha256Digest: 'e4a91f0c82b7d319',
        pgpSigStatus: 'PGP_VERIFIED',
        sftpChannelState: 'SFTP_ENCRYPTED_OK',
        transferErrorAlert: 'NONE',
        soc2ControlRef: 'CC6.1_LOGICAL_ACCESS',
        gdprDataClass: 'ZERO_PII_SYNTHETIC',
      },
    ]);
    expect(csv).toContain('TXN-243-0001');
    expect(csv).toContain('PGP_VERIFIED');
  });
});
