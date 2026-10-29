/**
 * GF-T3-254: Executable Vitest Verification Suite
 * Tests FP8 scaling factor calibration, outlier isolation, corridor saturation,
 * GridSync Zero-Trust Zod sanitization, and Zero-Dollar Gate compliance.
 */

import { describe, expect, it } from 'vitest';
import {
  calibrateScaleChannel,
  computeMagnitudeStats,
  createInitialEngineState,
  GridSyncChannelPayloadSchema,
  stepCalibrationPass,
  SUPABASE_POSTGRES_SCHEMA_SQL,
  SYNTHETIC_FP8_CORRIDORS,
  toggleOutlierSaturationState,
} from './fp8Engine';

describe('GF-T3-254 FP8 Quantization & Dynamic Scaling Engine', () => {
  it('initializes all 8 scale channels (S0..S7) locked at 16,500 GB/s baseline', () => {
    const state = createInitialEngineState('FP8-CORRIDOR-ALPHA');
    expect(state.throughputGbps).toBe(16500);
    expect(state.calibrationLatencyUs).toBe(0.01);
    expect(state.activeScalesCount).toBe(8);
    expect(state.processedTokens).toBe(3584000);
    expect(state.scales).toHaveLength(8);
    expect(state.scales[3].scaleId).toBe('S3');
    expect(state.scales[3].pointerHex).toBe('0x3300');
    expect(state.scales[3].scaleFactor).toBe(1.0);
    expect(state.scales[3].bitsFormat).toBe('FP8');
    expect(state.scales[3].outlierPct).toBe(0.02);
    expect(state.scales[3].locked).toBe(true);
  });

  it('computes accurate magnitude mean, standard deviation, and amax', () => {
    const stats = computeMagnitudeStats([1.6, -1.6, 1.6, -1.6]);
    expect(stats.mean).toBeCloseTo(1.6, 4);
    expect(stats.stdDev).toBeCloseTo(0.0, 4);
    expect(stats.amax).toBeCloseTo(1.6, 4);
  });

  it('mitigates high-magnitude outlier channels when outlier mitigation is enabled', () => {
    const channelWithOutlier = [1.61, 1.65, 1.62, 1.64, -1.6, 1.63, -1.62, 18.5];
    const mitigated = calibrateScaleChannel(3, {
      scaleId: 'S3',
      pointerHex: '0x3300',
      activations: channelWithOutlier,
      corridorId: 'FP8-CORRIDOR-BRAVO',
      outlierMitigationEnabled: true,
    });
    const unmitigated = calibrateScaleChannel(3, {
      scaleId: 'S3',
      pointerHex: '0x3300',
      activations: channelWithOutlier,
      corridorId: 'FP8-CORRIDOR-BRAVO',
      outlierMitigationEnabled: false,
    });

    expect(mitigated.amaxClipped).toBeLessThan(mitigated.amaxRaw);
    expect(mitigated.locked).toBe(true);
    expect(mitigated.state).toBe('QUANTIZED');
    expect(unmitigated.locked).toBe(false);
    expect(unmitigated.state).toBe('FAULT');
    expect(mitigated.scaleFactor).toBeGreaterThan(unmitigated.scaleFactor);
  });

  it('transitions state cleanly across burst, calibration pass, and outlier saturation toggles', () => {
    const initial = createInitialEngineState('FP8-CORRIDOR-ALPHA');
    const stepped = stepCalibrationPass(initial, 1.5);
    expect(stepped.processedTokens).toBeGreaterThan(initial.processedTokens);
    expect(stepped.engineXpK).toBeGreaterThan(initial.engineXpK);
    expect(stepped.stepPassCount).toBe(2);

    const saturated = toggleOutlierSaturationState(stepped, true);
    expect(saturated.outlierSaturationActive).toBe(true);
    expect(saturated.activeScalesCount).toBeLessThan(8);
    expect(saturated.scales[3].state).toBe('FAULT');

    const recovered = toggleOutlierSaturationState(saturated, false);
    expect(recovered.outlierSaturationActive).toBe(false);
    expect(recovered.activeScalesCount).toBe(8);
    expect(recovered.scales[3].state).toBe('QUANTIZED');
  });

  it('enforces GridSync Zero-Trust Zod sanitization against SQLi and malformed pointers', () => {
    expect(() =>
      GridSyncChannelPayloadSchema.parse({
        scaleId: 'S0',
        pointerHex: '0x3000; DROP TABLE fp8_scale_channels--',
        activations: [1.1, 1.2, 1.3, 1.4],
        corridorId: 'FP8-CORRIDOR-ALPHA',
        outlierMitigationEnabled: true,
      })
    ).toThrow();

    expect(() =>
      GridSyncChannelPayloadSchema.parse({
        scaleId: 'S99',
        pointerHex: '0x3000',
        activations: [1.1, 1.2, 1.3, 1.4],
        corridorId: 'FP8-CORRIDOR-ALPHA',
        outlierMitigationEnabled: true,
      })
    ).toThrow();
  });

  it('contains zero forbidden currency symbols across synthetic corridors and SQL schema', () => {
    const forbiddenChar = String.fromCharCode(36);
    expect(SUPABASE_POSTGRES_SCHEMA_SQL.includes(forbiddenChar)).toBe(false);
    Object.values(SYNTHETIC_FP8_CORRIDORS).forEach((c) => {
      expect(c.label.includes(forbiddenChar)).toBe(false);
    });
  });
});
