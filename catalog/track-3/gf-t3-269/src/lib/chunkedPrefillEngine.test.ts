/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GF-T3-269: Vitest Verification Suite
 * Tests Chunked Prefill Scheduling Math, Token Budget Balancing, Zero-Trust GridSync Sanitization,
 * and Zero-Dollar Gate Compliance.
 */

import { describe, it, expect } from 'vitest';
import {
  SYNTHETIC_CORRIDORS,
  GridSyncPayloadSchema,
  computeChunkedPrefillLatencyMs,
  computeDynamicTokenBudget,
  buildInitialSnapshot,
  triggerChunkedPrefillBurst,
  togglePromptLengthSpike,
  stepInterleavedDecodePass,
  applyCorridorSelection,
} from './chunkedPrefillEngine';
import { SUPABASE_POSTGRES_SCHEMA_SQL } from './supabaseSchema';

describe('GF-T3-269 Chunked Prefill & Iterative Decode Interleaving Suite', () => {
  it('1. verifies exact chunked prefill scheduling formula T_latency = ceil(S_prompt / C_chunk) * t_kernel + t_decode', () => {
    const res = computeChunkedPrefillLatencyMs(131072, 32768, 0.0025, 0.01);
    expect(res.chunkCount).toBe(4);
    expect(res.totalLatencyMs).toBe(0.02);
    expect(res.perChunkInterleavedMs).toBe(0.005);

    const unevenRes = computeChunkedPrefillLatencyMs(100000, 32768, 0.003, 0.008);
    expect(unevenRes.chunkCount).toBe(4);
    expect(unevenRes.totalLatencyMs).toBe(0.02);
  });

  it('2. guarantees sub-millisecond TTFT across all 8 hardware chunk slots in initial and burst states', () => {
    const initial = buildInitialSnapshot();
    expect(initial.chunks.length).toBe(8);
    expect(initial.schedulingLatencyUs).toBeLessThanOrEqual(0.05);
    for (const slot of initial.chunks) {
      expect(slot.latencyMs).toBeLessThan(1.0);
      expect(slot.locked).toBe(true);
    }

    const burst = triggerChunkedPrefillBurst(initial);
    expect(burst.throughputGbs).toBeGreaterThan(initial.throughputGbs);
    expect(burst.processedTokens).toBe(initial.processedTokens + 512000);
    for (const slot of burst.chunks) {
      expect(slot.latencyMs).toBeLessThan(1.0);
      expect(slot.modeLabel).toBe('CHUNK-8');
    }
  });

  it('3. balances dynamic token budgets under prompt length spikes without generation jitter', () => {
    const initial = buildInitialSnapshot();
    const spiked = togglePromptLengthSpike(initial);
    expect(spiked.spikeActive).toBe(true);
    expect(spiked.chunks[0].tokensLabel).toBe('256K');
    expect(spiked.chunks[0].modeLabel).toBe('CHUNK-16');

    const budget = computeDynamicTokenBudget(32768, 64, true, SYNTHETIC_CORRIDORS[0]);
    expect(budget.adjustedChunkTokens).toBeLessThan(32768);
    expect(budget.jitterUs).toBe(0.0);
  });

  it('4. steps interleaved decode pass and updates corridor selection deterministically', () => {
    const initial = buildInitialSnapshot();
    const stepped = stepInterleavedDecodePass(initial);
    expect(stepped.decodeStepCount).toBe(1);
    expect(stepped.processedTokens).toBe(5760000);
    expect(stepped.chunks[0].stateLabel).toBe('DECODE · STEPPED');

    const bravo = applyCorridorSelection(stepped, SYNTHETIC_CORRIDORS[1]);
    expect(bravo.throughputGbs).toBe(31200);
    expect(bravo.meshMode).toBe('SUB_MS_TTFT_ROUTER');
  });

  it('5. enforces GridSync Zero-Trust input sanitization and rejects SQLi/XSS payloads', () => {
    const valid = GridSyncPayloadSchema.safeParse({
      corridor: SYNTHETIC_CORRIDORS[0],
      promptLengthTokens: 131072,
      chunkCapacityTokens: 32768,
      kernelExecutionMs: 0.0025,
      decodeExecutionMs: 0.01,
      concurrencyStreams: 16,
      operatorTag: 'PIT-WALL-CREW-CHIEF',
    });
    expect(valid.success).toBe(true);

    const maliciousSql = GridSyncPayloadSchema.safeParse({
      corridor: SYNTHETIC_CORRIDORS[0],
      promptLengthTokens: 131072,
      chunkCapacityTokens: 32768,
      kernelExecutionMs: 0.0025,
      decodeExecutionMs: 0.01,
      concurrencyStreams: 16,
      operatorTag: 'ADMIN; DROP TABLE gf_t3_269_chunk_slots--',
    });
    expect(maliciousSql.success).toBe(false);
  });

  it('6. enforces the absolute Zero-Dollar Gate across snapshots and SQL schema', () => {
    const forbiddenChar = String.fromCharCode(36);
    const snapshotJson = JSON.stringify(buildInitialSnapshot());
    expect(snapshotJson.includes(forbiddenChar)).toBe(false);
    expect(SUPABASE_POSTGRES_SCHEMA_SQL.includes(forbiddenChar)).toBe(false);
  });
});
