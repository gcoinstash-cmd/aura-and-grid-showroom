/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Executable Vitest Suite for GF-T3-235 Tensor Core Asynchronous MMA Engine
 */

import { describe, expect, it } from 'vitest';
import {
  SYNTHETIC_MMA_CORRIDORS,
  analyzeWarpBankConflicts,
  computeEngineTelemetry,
  computeSharedMemoryBankIndex,
  createDeterministic16x16Matrix,
  executeWarpMma16x16x16,
  formatInspectorStrip,
  generateComplianceCsvReport,
  quantizeToFp16,
  quantizeToFp32,
  validateGridSyncIngress,
} from './tensorCoreEngine';

describe('GF-T3-235 Tensor Core Asynchronous MMA Engine Suite', () => {
  it('quantizes FP16 and FP32 values within IEEE-754 bounds', () => {
    const sample = 1.625;
    expect(quantizeToFp16(sample)).toBeCloseTo(1.625, 4);
    expect(quantizeToFp32(sample)).toBeCloseTo(1.625, 6);
    expect(quantizeToFp16(120000)).toBe(65504);
    expect(quantizeToFp16(-120000)).toBe(-65504);
    expect(quantizeToFp16(0)).toBe(0);
  });

  it('executes authentic 16x16x16 FP16-to-FP32 matrix multiply-accumulate', () => {
    const identity = Array.from({ length: 16 }, (_, r) =>
      Array.from({ length: 16 }, (__, c) => (r === c ? 1.0 : 0.0))
    );
    const matA = createDeterministic16x16Matrix(2);
    const biasC = Array.from({ length: 16 }, () => new Array<number>(16).fill(0.25));

    const mma = executeWarpMma16x16x16(matA, identity, biasC);
    expect(mma.dimensions).toEqual([16, 16, 16]);
    expect(mma.macOperations).toBe(8192);
    expect(mma.maxFp16Drift).toBeLessThan(0.001);
    expect(mma.frobeniusNorm).toBeGreaterThan(0);

    for (let r = 0; r < 16; r++) {
      for (let c = 0; c < 16; c++) {
        expect(mma.outputMatrixFp32[r][c]).toBeCloseTo(matA[r][c] + 0.25, 3);
      }
    }
  });

  it('eliminates 32-way shared memory bank conflicts under XOR swizzle mask 0x4', () => {
    const unswizzled = analyzeWarpBankConflicts(0x0, false);
    expect(unswizzled.conflictFree).toBe(false);
    expect(unswizzled.totalConflicts).toBeGreaterThan(0);
    expect(unswizzled.maxWayConflictDegree).toBe(8);

    const swizzled = analyzeWarpBankConflicts(0x4, false);
    expect(swizzled.conflictFree).toBe(true);
    expect(swizzled.totalConflicts).toBe(0);
    expect(swizzled.uniqueBanksUtilized).toBe(32);

    const stallInjected = analyzeWarpBankConflicts(0x4, true);
    expect(stallInjected.conflictFree).toBe(false);
    expect(stallInjected.effectiveSwizzleHex).toBe('0x0');
  });

  it('validates shared memory bank coordinates and rejects out-of-range indices', () => {
    const res = computeSharedMemoryBankIndex(3, 6, 0x4);
    expect(res.bankIndex).toBeGreaterThanOrEqual(0);
    expect(res.bankIndex).toBeLessThan(32);
    expect(() => computeSharedMemoryBankIndex(18, 0, 0x4)).toThrow();
  });

  it('computes nominal 1,850 TFLOPS and 0.08 us latency on MMA-CORRIDOR-ALPHA', () => {
    const snap = computeEngineTelemetry({
      corridorLabel: 'MMA-CORRIDOR-ALPHA (ASYNC-WARP-LEVEL-TILE-SWIZZLE · 1850-TFLOPS)',
      passCount: 0,
      burstActive: false,
      bankStallsInjected: false,
      flushedState: false,
    });

    expect(snap.engineTitle).toBe('GF-T3-235');
    expect(snap.formattedThroughput).toBe('1,850 TFLOPS');
    expect(snap.formattedLatency).toBe('0.08 µs');
    expect(snap.formattedTokens).toBe('1,152,000 UNITS');
    expect(snap.tiles).toHaveLength(8);
    expect(formatInspectorStrip(snap.tiles[3])).toBe(
      'T3 · [16,16,16] · SWZ: 0x4 · CONFLICTS: 0 · MMA_ACTIVE'
    );
  });

  it('enforces GridSync Zero-Trust Zod payload sanitization against SQLi and XSS', () => {
    const validCheck = validateGridSyncIngress({
      corridorLabel: SYNTHETIC_MMA_CORRIDORS[0].label,
      passCount: 4,
      selectedTileIndex: 3,
      burstActive: true,
      bankStallsInjected: false,
      operatorRole: 'CREW_CHIEF_ADMIN',
      mfaVerified: true,
      auditNote: 'Nominal pass verified across 32 warps',
    });
    expect(validCheck.valid).toBe(true);

    const maliciousCheck = validateGridSyncIngress({
      corridorLabel: SYNTHETIC_MMA_CORRIDORS[0].label,
      passCount: 4,
      selectedTileIndex: 3,
      burstActive: false,
      bankStallsInjected: false,
      operatorRole: 'CREW_CHIEF_ADMIN',
      mfaVerified: true,
      auditNote: 'DROP TABLE gf_t3_235_telemetry_runs; --',
    });
    expect(maliciousCheck.valid).toBe(false);
  });

  it('generates zero-dollar compliant CSV compliance audit reports', () => {
    const snap = computeEngineTelemetry({
      corridorLabel: 'MMA-CORRIDOR-ALPHA (ASYNC-WARP-LEVEL-TILE-SWIZZLE · 1850-TFLOPS)',
      passCount: 1,
      burstActive: false,
      bankStallsInjected: false,
      flushedState: false,
    });
    const csv = generateComplianceCsvReport(snap, [
      {
        auditId: 'AUD-001',
        timestampTag: '00:01.04',
        callsign: '🟢 CREW CHIEF',
        role: 'CREW_CHIEF_ADMIN',
        mfaVerified: true,
        actionCode: 'INIT_MMA_PIPELINE',
        corridorId: 'MMA-CORRIDOR-ALPHA',
        sha256Seal: '811c9dc5cbf29ce4',
        message: 'Tensor Core asynchronous MMA pipeline initialized',
      },
    ]);
    expect(csv).toContain('AUD-001');
    expect(csv.includes(String.fromCharCode(36))).toBe(false);
  });
});
