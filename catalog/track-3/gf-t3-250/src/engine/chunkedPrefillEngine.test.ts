import { describe, it, expect } from 'vitest';
import {
  SYNTHETIC_CORRIDORS,
  splitPromptIntoBoundedChunks,
  computeChunkOverlapMetrics,
  evaluatePrefillEngineState,
  sanitizeAndValidateIngress,
} from './chunkedPrefillEngine';

describe('GF-T3-250 Chunked Prefill & Async Overlap Engine Suite', () => {
  it('splits a 4096-token context prompt into 8 bounded 512-token chunks', () => {
    const chunks = splitPromptIntoBoundedChunks(4096, 512, 8);
    expect(chunks).toHaveLength(8);
    expect(chunks.reduce((a, b) => a + b, 0)).toBe(4096);
    chunks.forEach((tok) => {
      expect(tok).toBe(512);
    });
  });

  it('handles oversized prompt saturation by balancing tokens across 8 chunk slots', () => {
    const chunks = splitPromptIntoBoundedChunks(8192, 512, 8);
    expect(chunks).toHaveLength(8);
    expect(chunks.reduce((a, b) => a + b, 0)).toBe(8192);
    chunks.forEach((tok) => {
      expect(tok).toBe(1024);
    });
  });

  it('rejects non-positive token or chunk bound parameters', () => {
    expect(() => splitPromptIntoBoundedChunks(0, 512, 8)).toThrow();
    expect(() => splitPromptIntoBoundedChunks(4096, 0, 8)).toThrow();
  });

  it('verifies nominal 99.8% async overlap and 0.12ms latency on PREFILL-CORRIDOR-ALPHA', () => {
    const metrics = computeChunkOverlapMetrics(
      512,
      512,
      64,
      SYNTHETIC_CORRIDORS[0],
      false,
      true
    );
    expect(metrics.overlapPct).toBe(99.8);
    expect(metrics.latencyMs).toBe(0.12);
    expect(metrics.interferenceUs).toBe(0.01);
    expect(metrics.quantaShare).toBe(0.5);
  });

  it('produces exact baseline telemetry snapshot for GF-T3-250', () => {
    const state = evaluatePrefillEngineState({
      promptTokens: 4096,
      chunkBoundTokens: 512,
      activeDecodeRequests: 64,
      corridor: SYNTHETIC_CORRIDORS[0],
      saturationFault: false,
      stepPassCount: 0,
      burstCount: 0,
      asyncOverlapEnabled: true,
    });

    expect(state.engineTitle).toBe('GF-T3-250');
    expect(state.prefillThroughputGbs).toBe(13000);
    expect(state.formattedThroughput).toBe('13,000 GB/s');
    expect(state.overlapLatencyUs).toBe(0.01);
    expect(state.formattedOverlapLatency).toBe('0.01 µs');
    expect(state.formattedProcessedTokens).toBe('3,072,000 UNITS');
    expect(state.prefillState).toBe('Chunked Active');
    expect(state.chunks).toHaveLength(8);
    expect(state.chunks[3].hexPtr).toBe('0xE300');
    expect(state.chunks[3].decodeSync).toBe('OK');
  });

  it('enforces GridSync Zero-Trust sanitization against SQLi and XSS payloads', () => {
    expect(() =>
      sanitizeAndValidateIngress({
        promptTokens: 4096,
        chunkBoundTokens: 512,
        activeDecodeRequests: 64,
        corridor: 'PREFILL-CORRIDOR-ALPHA; DROP TABLE prefill_sessions; --',
        saturationFault: false,
        stepPassCount: 0,
        burstCount: 0,
        asyncOverlapEnabled: true,
      })
    ).toThrow();

    expect(() =>
      sanitizeAndValidateIngress({
        promptTokens: 4096,
        chunkBoundTokens: 512,
        activeDecodeRequests: 64,
        corridor: '<script>alert(1)</script>',
        saturationFault: false,
        stepPassCount: 0,
        burstCount: 0,
        asyncOverlapEnabled: true,
      })
    ).toThrow();
  });
});
