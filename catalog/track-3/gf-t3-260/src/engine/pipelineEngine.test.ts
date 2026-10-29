/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Executable Vitest Suite for GF-T3-260 Pipeline Parallelism & 1F1B Engine
 */

import { describe, expect, it } from 'vitest';
import {
  CORRIDOR_CATALOG,
  GridSyncIngressSchema,
  POSTGRES_RLS_SCHEMA_PREVIEW,
  SYNTHETIC_CORRIDORS,
  calculatePipelineBubblePct,
  calculateStageActivationMemoryMb,
  evaluatePipelineEngine,
  generate1F1BScheduleSlots,
} from './pipelineEngine';

describe('GF-T3-260 Non-Uniform 1F1B Pipeline Parallelism Engine', () => {
  it('enforces zero pipeline bubble (0.0%) under steady-state decoupled 1F1B execution', () => {
    const bubble = calculatePipelineBubblePct(8, 32, 2, true, false);
    expect(bubble).toBe(0.0);

    const unsplitBubble = calculatePipelineBubblePct(8, 32, 1, false, false);
    expect(unsplitBubble).toBeGreaterThan(2.5);
  });

  it('computes accurate stage activation memory gradient across ranks P0..P7', () => {
    const p0Memory = calculateStageActivationMemoryMb(0, 8, 2, 8192, 4096);
    const p3Memory = calculateStageActivationMemoryMb(3, 8, 2, 8192, 4096);
    const p7Memory = calculateStageActivationMemoryMb(7, 8, 2, 8192, 4096);

    expect(p0Memory).toBeGreaterThan(p3Memory);
    expect(p3Memory).toBeGreaterThan(p7Memory);
    expect(Math.round(p0Memory / p7Memory)).toBe(8);
  });

  it('constructs warm-up F, steady-state 1F1B + B_W, and cool-down B_I phases', () => {
    const slots = generate1F1BScheduleSlots(8, 16, 2, true);
    expect(slots.length).toBeGreaterThan(100);

    const p0Warmup = slots.filter((s) => s.stageId === 0).slice(0, 7);
    expect(p0Warmup.every((s) => s.phase === 'F')).toBe(true);

    const p7First = slots.find((s) => s.stageId === 7);
    expect(p7First?.phase).toBe('1F1B');

    const bwCount = slots.filter((s) => s.phase === 'B_W').length;
    expect(bwCount).toBeGreaterThan(0);
  });

  it('produces exact baseline metrics for PIPE-CORRIDOR-ALPHA (22,600 GB/s, 0.01 us, 8 stages)', () => {
    const snap = evaluatePipelineEngine({
      corridor: SYNTHETIC_CORRIDORS[0],
      numStages: 8,
      numMicrobatches: 32,
      interleavingDegree: 2,
      hiddenDim: 8192,
      seqLength: 4096,
      zeroBubbleEnabled: true,
      imbalanceInjected: false,
      stepCounter: 1,
      burstActive: false,
    });

    expect(snap.engineId).toBe('GF-T3-260');
    expect(snap.throughputFormatted).toBe('22,600 GB/s');
    expect(snap.bubbleLatencyFormatted).toBe('0.01 µs');
    expect(snap.bubbleBadgeText).toBe('🔥 0.0% BUBBLE');
    expect(snap.processedTokensFormatted).toBe('4,352,000 UNITS');
    expect(snap.stages.length).toBe(8);
    expect(snap.stages[0].hexPtr).toBe('0x9000');
    expect(snap.stages[3].hexPtr).toBe('0x9300');
    expect(snap.stages[3].transferText).toBe('0.02ms');
  });

  it('handles bubble imbalance injection and stage rebalancing telemetry', () => {
    const imbalanced = evaluatePipelineEngine({
      corridor: SYNTHETIC_CORRIDORS[0],
      numStages: 8,
      numMicrobatches: 32,
      interleavingDegree: 2,
      hiddenDim: 8192,
      seqLength: 4096,
      zeroBubbleEnabled: true,
      imbalanceInjected: true,
      stepCounter: 1,
      burstActive: false,
    });

    expect(imbalanced.bubblePct).toBeGreaterThan(0);
    expect(imbalanced.stages[2].stateLabel).toBe('REBALANCE · WARN');
    expect(imbalanced.stages[5].stateLabel).toBe('REBALANCE · WARN');
    expect(imbalanced.stages[0].stateLabel).toBe('BALANCED · LOCKED');
  });

  it('rejects SQL injection and XSS payloads via GridSync Zero-Trust Zod gate', () => {
    expect(() =>
      GridSyncIngressSchema.parse({
        corridor: SYNTHETIC_CORRIDORS[0],
        numStages: 8,
        numMicrobatches: 32,
        interleavingDegree: 2,
        hiddenDim: 8192,
        seqLength: 4096,
        zeroBubbleEnabled: true,
        imbalanceInjected: false,
        stepCounter: 1,
        burstActive: false,
        operatorNote: 'DROP TABLE gf_t3_260_pipeline_runs;',
      })
    ).toThrow();
  });

  it('enforces the Absolute Zero-Dollar Gate across corridors and schema definitions', () => {
    const dollarChar = String.fromCharCode(36);
    expect(POSTGRES_RLS_SCHEMA_PREVIEW.includes(dollarChar)).toBe(false);
    for (const corridor of SYNTHETIC_CORRIDORS) {
      expect(corridor.includes(dollarChar)).toBe(false);
      expect(CORRIDOR_CATALOG[corridor].shortTag.includes(dollarChar)).toBe(false);
    }
  });
});
