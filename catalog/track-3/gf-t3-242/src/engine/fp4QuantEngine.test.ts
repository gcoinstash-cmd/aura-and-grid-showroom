/**
 * Executable Verification Suite for GF-T3-242 TypeScript Quantization Core
 * Verifies:
 * 1. Block 0 (B0) and Block 3 (B3) exact scale and outlier calibration telemetry.
 * 2. Outlier isolation and zero-clipping scale calibration across FP4_E2M1 and INT4.
 * 3. SQNR parity (>24 dB) and >3.0x memory footprint compression ratio.
 * 4. GridSync Zero-Trust input sanitization and Zero-Dollar Gate enforcement.
 */

import {
  buildQuantizationMatrix,
  formatInspectorTelemetryLine,
  isolateOutliers,
  quantizeTensorBlock,
  SYNTHETIC_CORRIDORS,
  validateGridSyncInput,
} from './fp4QuantEngine';

export interface VerificationSuiteReport {
  totalTests: number;
  passedTests: number;
  passRatePct: number;
  results: { name: string; passed: boolean; detail: string }[];
}

export function runVerificationSuite(): VerificationSuiteReport {
  const results: { name: string; passed: boolean; detail: string }[] = [];

  // Test 1: Canonical 16-Block Mixed-Precision Matrix Calibration
  const matrix = buildQuantizationMatrix('MIXED', 0, false, 1.0, 2.45);
  const b0 = matrix[0];
  const b3 = matrix[3];
  const t1Passed =
    matrix.length === 16 &&
    b0.blockName === 'Block 0 (B0)' &&
    b0.displayFormat === 'INT4' &&
    b0.scale === 0.0124 &&
    b0.outlierChannels === 2 &&
    b0.errorPct === 0.42;
  results.push({
    name: 'Block 0 (B0) INT4 Scale & Outlier Calibration Parity',
    passed: t1Passed,
    detail:
      'B0 scale=' +
      b0.scale.toFixed(4) +
      ', outliers=' +
      String(b0.outlierChannels) +
      ' ch, err=' +
      String(b0.errorPct) +
      '%',
  });

  // Test 2: Block 3 (B3) FP4_E2M1 Inspector Line Parity
  const inspectorLine = formatInspectorTelemetryLine(b3);
  const expectedLine =
    'BLOCK: B3 · FORMAT: FP4_E2M1 · SCALE: 0.0185 · ERROR: 0.0031 · CALIBRATED';
  const t2Passed = inspectorLine === expectedLine;
  results.push({
    name: 'Block 3 (B3) FP4_E2M1 Telemetry Inspector Line Verification',
    passed: t2Passed,
    detail: inspectorLine,
  });

  // Test 3: Outlier Channel Isolation & Zero Clipping
  const syntheticTensor = Array.from({ length: 64 }, (_, i) => Math.sin(i * 0.2) * 0.04);
  syntheticTensor[9] = 1.75;
  syntheticTensor[51] = -1.92;
  const isolated = isolateOutliers(syntheticTensor, 2.5);
  const t3Passed =
    isolated.outlierIndices.includes(9) &&
    isolated.outlierIndices.includes(51) &&
    isolated.bulkWeights[9] === 0 &&
    isolated.bulkWeights[51] === 0;
  results.push({
    name: 'Outlier Channel Preservation (FP16 Sparse Stream Isolation)',
    passed: t3Passed,
    detail: 'Isolated outlier indices: [' + isolated.outlierIndices.join(', ') + ']',
  });

  // Test 4: SQNR Parity & Memory Footprint Reduction (>3.0x)
  const fp4Block = quantizeTensorBlock(2, 'FP4_E2M1', 1, false, 1.0, 2.45);
  const t4Passed = fp4Block.sqnrDb > 30.0 && fp4Block.compressionRatio >= 3.0;
  results.push({
    name: 'SQNR Parity (>30 dB) & Memory Compression (>3.0x vs FP16)',
    passed: t4Passed,
    detail:
      'SQNR=' +
      String(fp4Block.sqnrDb) +
      ' dB, Compression=' +
      String(fp4Block.compressionRatio) +
      'x',
  });

  // Test 5: Outlier Saturation Spike Resynchronization
  const spikeBlock = quantizeTensorBlock(4, 'FP4_E2M1', 1, true, 1.25, 2.35);
  const t5Passed =
    spikeBlock.status === 'SPIKE_LOCK' && spikeBlock.outlierChannels >= 2 && spikeBlock.scale > 0;
  results.push({
    name: 'Chaos Outlier Spike Injection & Dynamic Scale Resync',
    passed: t5Passed,
    detail:
      'Status=' +
      spikeBlock.status +
      ', Outliers=' +
      String(spikeBlock.outlierChannels) +
      ' ch, Scale=' +
      spikeBlock.scale.toFixed(4),
  });

  // Test 6: GridSync Zero-Trust Sanitization & Zero-Dollar Gate
  const cleanCheck = validateGridSyncInput(SYNTHETIC_CORRIDORS[0]);
  const sqlCheck = validateGridSyncInput('FP4-CORRIDOR-ALPHA; DROP TABLE gf_t3_242_corridors;--');
  const xssCheck = validateGridSyncInput('<script>alert(1)</script>');
  const dollarCheck = validateGridSyncInput('Cost: \x24100');
  const t6Passed =
    cleanCheck.valid && !sqlCheck.valid && !xssCheck.valid && !dollarCheck.valid;
  results.push({
    name: 'GridSync Zero-Trust Ingress & Zero-Dollar Gate Enforcement',
    passed: t6Passed,
    detail: 'SQLi/XSS/Currency payloads blocked deterministically',
  });

  const passedTests = results.filter((r) => r.passed).length;
  const passRatePct = Number(((passedTests / results.length) * 100).toFixed(1));

  return {
    totalTests: results.length,
    passedTests,
    passRatePct,
    results,
  };
}
