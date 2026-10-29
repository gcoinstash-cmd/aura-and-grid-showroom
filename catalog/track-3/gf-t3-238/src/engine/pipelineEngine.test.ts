/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GF-T3-238 Vitest Verification Suite
 */

import { describe, expect, it } from 'vitest';
import {
  SYNTHETIC_PIPELINE_CORRIDORS,
  scrubInputString,
  validateControlCommand,
} from './gridSyncValidator';
import {
  applyFlushQueues,
  applyPipelineBurst,
  applyStepVirtualStage,
  applyToggleBubbleStall,
  computeBubbleMetrics,
  computeCheckpointMemory,
  createInitialPipelineState,
  formatInspectorStripText,
  generate1F1BSchedule,
  verify1F1BGradientParity,
} from './pipelineEngine';
import { SUPABASE_POSTGRES_SCHEMA_SQL, generateAuditBundleJson } from './supabaseSchema';

describe('GF-T3-238 Pipeline Parallelism 1F1B & Activation Checkpointing Suite', () => {
  it('verifies gradient correctness and loss parity between reference and interleaved 1F1B execution', () => {
    const report = verify1F1BGradientParity(8, 16);
    expect(report.parityVerified).toBe(true);
    expect(report.lossAbsDelta).toBeLessThan(1e-12);
    expect(report.maxGradientAbsDelta).toBeLessThan(1e-12);
    expect(report.referenceGradients.length).toBe(8);
    expect(report.pipelined1F1BGradients.length).toBe(8);
    expect(report.recomputedTensorsCount).toBe(128);
  });

  it('verifies activation memory savings under checkpointing recomputation (>90% reduction)', () => {
    const ckptEnabled = computeCheckpointMemory(8, 12, 16, 4096, 2048, true);
    const ckptDisabled = computeCheckpointMemory(8, 12, 16, 4096, 2048, false);

    expect(ckptEnabled.activeStageMb).toBeLessThan(ckptDisabled.activeStageMb);
    expect(ckptEnabled.memorySavingsPct).toBeGreaterThan(90);
    expect(ckptDisabled.memorySavingsPct).toBe(0);
    expect(ckptEnabled.totalClusterActiveMb).toBeLessThan(ckptEnabled.totalClusterUncheckpointedMb);
  });

  it('verifies pipeline bubble reduction efficiency and 4,200 TFLOPS throughput saturation', () => {
    const interleaved = computeBubbleMetrics(8, 16, 6, true, false);
    const nonInterleaved = computeBubbleMetrics(8, 16, 6, false, false);

    expect(interleaved.interleavedBubblePct).toBeLessThan(nonInterleaved.standardBubblePct);
    expect(interleaved.bubbleReductionPct).toBeGreaterThan(75);
    expect(interleaved.bubbleLatencyUs).toBe(0.05);
    expect(interleaved.throughputTflops).toBe(4200);
  });

  it('generates complete 1F1B interleaved forward and backward schedule slots', () => {
    const schedule = generate1F1BSchedule(8, 16, 2, true);
    expect(schedule.length).toBe(8 * 16 * 2 * 2);
    const fwd = schedule.filter((s) => s.phase === 'FORWARD');
    const bwd = schedule.filter((s) => s.phase === 'BACKWARD');
    expect(fwd.length).toBe(256);
    expect(bwd.length).toBe(256);
    expect(bwd.every((s) => s.recomputed)).toBe(true);
  });

  it('initializes GF-T3-238 state and executes burst, bubble stall, step, and flush transitions', () => {
    const initial = createInitialPipelineState();
    expect(initial.engineTitle).toBe('GF-T3-238');
    expect(initial.stages.length).toBe(8);
    expect(initial.stages[0].headerLabel).toBe('Stage 0 (S0)');
    expect(initial.stages[0].microBatchStatusText).toBe('1F1B · MB: 4/16');
    expect(initial.stages[0].checkpointStateText).toBe('0x5000 · CHECKPOINTED');
    expect(formatInspectorStripText(initial.stages[3])).toBe(
      'STAGE: S3 · MICRO-BATCH: MB_07 · OP: FORWARD_1F1B · PTR: 0x5800 · ACTIVE'
    );

    const afterBurst = applyPipelineBurst(initial);
    expect(afterBurst.processedTokens).toBe(1536000 + 384000);

    const afterStall = applyToggleBubbleStall(afterBurst);
    expect(afterStall.bubbleStallActive).toBe(true);
    expect(afterStall.stages[2].statusBadge).toBe('FAULT');

    const afterStep = applyStepVirtualStage(afterStall);
    expect(afterStep.stepCounter).toBe(afterStall.stepCounter + 1);

    const afterFlush = applyFlushQueues();
    expect(afterFlush.processedTokens).toBe(1536000);
    expect(afterFlush.bubbleStallActive).toBe(false);
  });

  it('enforces GridSync Zero-Trust input sanitization and Zero-Dollar Gate', () => {
    expect(SYNTHETIC_PIPELINE_CORRIDORS.length).toBe(4);
    const validCmd = validateControlCommand({
      engineId: 'GF-T3-238',
      command: 'STEP',
      stageId: 3,
    });
    expect(validCmd.command).toBe('STEP');

    expect(() => scrubInputString('DROP TABLE pipeline_runs;--')).toThrow();
    expect(() => scrubInputString('<script>evil()</script>')).toThrow();
    expect(() => scrubInputString('cost: ' + String.fromCharCode(36) + '500')).toThrow();

    const auditJson = generateAuditBundleJson(createInitialPipelineState());
    expect(auditJson.includes(String.fromCharCode(36))).toBe(false);
    expect(SUPABASE_POSTGRES_SCHEMA_SQL.includes('ENABLE ROW LEVEL SECURITY')).toBe(true);
  });
});
