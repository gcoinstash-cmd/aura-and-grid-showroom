/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GF-T3-229: Executable Vitest Verification Suite
 * Tests 1F1B micro-batch schedule matrix, activation stash memory bounds (p=4),
 * P2P overlap latency, straggler fault injection, and Zero-Trust GridSync sanitization.
 */

import { describe, expect, it } from 'vitest';
import {
  calculateAnalyticalBubbleRatio,
  computeStashPointerHex,
  EXPORTABLE_SUPABASE_SCHEMA_SQL,
  generate1F1BPipelineState,
  INITIAL_RADIO_LOGS,
  PipelineCorridor,
  PIPELINE_CORRIDOR_LIST,
  validateGridSyncIngress,
} from './pipeline1f1b';

describe('GF-T3-229 Pipeline-Parallel 1F1B Engine Verification Suite', () => {
  it('verifies baseline ALPHA corridor telemetry metrics (1,420 TFLOPS, 8.4% bubble, 0.22 ms P2P, 448,000 units)', () => {
    const state = generate1F1BPipelineState({
      corridor: PipelineCorridor.ALPHA,
      numStages: 4,
      numMicroBatches: 16,
      stragglerActive: false,
      burstActive: false,
      flushedState: false,
    });

    expect(state.aggregateTflops).toBe(1420);
    expect(state.bubbleRatioPct).toBe(8.4);
    expect(state.p2pLatencyMs).toBe(0.22);
    expect(state.sustainedTokens).toBe(448000);
    expect(state.memoryCapActivations).toBe(4);
    expect(state.pipeXpBonus).toBe('+9.6k PIPE XP');
  });

  it('bounds activation stashing memory footprint strictly to p=4 across all 4 pipeline stages', () => {
    const state = generate1F1BPipelineState({
      corridor: PipelineCorridor.ALPHA,
      numStages: 4,
      numMicroBatches: 16,
    });

    expect(state.stageStashes).toHaveLength(4);
    for (const stash of state.stageStashes) {
      expect(stash.activeActivations).toBeLessThanOrEqual(4);
      expect(stash.maxActivationBound).toBe(4);
    }

    // Verify Stage 0..3 follow (p - s) activation stashing bound: 4, 3, 2, 1
    expect(state.stageStashes[0].activeActivations).toBe(4);
    expect(state.stageStashes[1].activeActivations).toBe(3);
    expect(state.stageStashes[2].activeActivations).toBe(2);
    expect(state.stageStashes[3].activeActivations).toBe(1);
  });

  it('executes all 16 Forward (F0..F15) and 16 Backward (B0..B15) micro-batches per stage', () => {
    const state = generate1F1BPipelineState({
      corridor: PipelineCorridor.ALPHA,
      numStages: 4,
      numMicroBatches: 16,
    });

    for (let s = 0; s < 4; s++) {
      const slots = state.stageTracks[s];
      const forwards = slots.filter((slot) => slot.opType === 'F');
      const backwards = slots.filter((slot) => slot.opType === 'B');
      expect(forwards).toHaveLength(16);
      expect(backwards).toHaveLength(16);
      expect(forwards[0].label).toBe('F0');
      expect(forwards[15].label).toBe('F15');
      expect(backwards[0].label).toBe('B0');
      expect(backwards[15].label).toBe('B15');
    }
  });

  it('computes exact deterministic stash pointer 0x7FA200 for Stage 1 Micro-Batch F4', () => {
    const ptr = computeStashPointerHex(1, 4);
    expect(ptr).toBe('0x7FA200');
  });

  it('injects Stage 2 Straggler Delay (2x P2P latency to 0.44 ms and elevated bubble overhead)', () => {
    const nominal = generate1F1BPipelineState({
      corridor: PipelineCorridor.ALPHA,
      stragglerActive: false,
    });
    const straggler = generate1F1BPipelineState({
      corridor: PipelineCorridor.ALPHA,
      stragglerActive: true,
    });

    expect(straggler.p2pLatencyMs).toBe(0.44);
    expect(straggler.bubbleRatioPct).toBeGreaterThan(nominal.bubbleRatioPct);
    expect(straggler.stageStashes[2].stragglerDelayed).toBe(true);
    expect(straggler.aggregateTflops).toBeLessThan(nominal.aggregateTflops);
  });

  it('flushes pipeline stash and re-zeros buffers cleanly on flush trigger', () => {
    const flushed = generate1F1BPipelineState({
      corridor: PipelineCorridor.ALPHA,
      flushedState: true,
    });

    expect(flushed.aggregateTflops).toBe(0);
    expect(flushed.sustainedTokens).toBe(0);
    for (const stash of flushed.stageStashes) {
      expect(stash.activeActivations).toBe(0);
    }
  });

  it('enforces Zero-Trust GridSync Ingress sanitization against SQL injection and XSS payloads', () => {
    const cleanResult = validateGridSyncIngress({
      corridor: PipelineCorridor.ALPHA,
      numStages: 4,
      numMicroBatches: 16,
      activeStepCursor: 5,
      stragglerActive: false,
      burstActive: false,
      auditTag: 'STEP_1F1B_VERIFIED',
    });
    expect(cleanResult.valid).toBe(true);

    const sqliResult = validateGridSyncIngress({
      corridor: PipelineCorridor.ALPHA,
      numStages: 4,
      numMicroBatches: 16,
      activeStepCursor: 5,
      stragglerActive: false,
      burstActive: false,
      auditTag: 'DROP TABLE gf_t3_229_corridors;--',
    });
    expect(sqliResult.valid).toBe(false);

    const xssResult = validateGridSyncIngress({
      corridor: PipelineCorridor.ALPHA,
      numStages: 4,
      numMicroBatches: 16,
      activeStepCursor: 5,
      stragglerActive: false,
      burstActive: false,
      auditTag: '<script>evil()</script>',
    });
    expect(xssResult.valid).toBe(false);
  });

  it('enforces the Absolute Zero-Dollar Gate across corridors, logs, and SQL schema artifacts', () => {
    const bannedChar = String.fromCharCode(36);
    for (const c of PIPELINE_CORRIDOR_LIST) {
      expect(c.includes(bannedChar)).toBe(false);
    }
    for (const log of INITIAL_RADIO_LOGS) {
      expect(log.message.includes(bannedChar)).toBe(false);
    }
    expect(EXPORTABLE_SUPABASE_SCHEMA_SQL.includes(bannedChar)).toBe(false);
    expect(
      calculateAnalyticalBubbleRatio(4, 16, PipelineCorridor.ALPHA, false, false)
    ).toBe(8.4);
  });

  it('strictly locks project title to GF-T3-229 with zero suffixes', async () => {
    const { ENGINE_PRIMARY_TITLE, sanitizeEngineTitle } = await import('../App');
    expect(ENGINE_PRIMARY_TITLE).toBe('GF-T3-229');
    expect(sanitizeEngineTitle('GF-T3-229')).toBe('GF-T3-229');
    expect(sanitizeEngineTitle('arbitrary-suffix')).toBe('GF-T3-229');
  });
});

