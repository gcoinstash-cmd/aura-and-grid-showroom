import { describe, it, expect } from 'vitest';
import {
  createInitialEngineState,
  resolveVirtualToPhysicalBlock,
  switchEngineCorridor,
  triggerPagedBatchBurst,
  toggleFragmentationSpike,
  stepPagedAttentionPass,
  flushKvCacheBuffers,
  validateGridSyncInput,
  SYNTHETIC_CORRIDORS,
} from './pagedAttentionCore';

describe('GF-T3-253 PagedAttention & Continuous In-Flight Batching Core Suite', () => {
  it('initializes with 8 locked physical KV blocks, 15,200 GB/s throughput, and 0.0% fragmentation', () => {
    const state = createInitialEngineState();
    expect(state.throughputGbs).toBe(15200);
    expect(state.latencyUs).toBe(0.01);
    expect(state.totalFragPct).toBe(0.0);
    expect(state.activeBlocksCount).toBe(8);
    expect(state.totalBlocksCount).toBe(8);
    expect(state.processedTokens).toBe(3456000);
    expect(state.batchState).toBe('PagedActive');
    expect(state.blocks).toHaveLength(8);
    expect(state.blocks[0].hexPtr).toBe('0x2000');
    expect(state.blocks[3].hexPtr).toBe('0x2300');
  });

  it('resolves virtual-to-physical block table translations with accurate reference counts', () => {
    const state = createInitialEngineState();
    const b2 = resolveVirtualToPhysicalBlock(state, 'SEQ-ALPHA-101', 2);
    expect(b2.blockId).toBe('B2');
    expect(b2.hexPtr).toBe('0x2200');
    expect(b2.refCount).toBe(4);
    expect(b2.tokens).toBe(16);

    const b4 = resolveVirtualToPhysicalBlock(state, 'SEQ-BRAVO-102', 1);
    expect(b4.blockId).toBe('B4');
    expect(b4.hexPtr).toBe('0x2400');

    expect(() => resolveVirtualToPhysicalBlock(state, 'SEQ-ALPHA-101', 99)).toThrow();
    expect(() => resolveVirtualToPhysicalBlock(state, 'SEQ-UNKNOWN', 0)).toThrow();
  });

  it('retires completed sequences and slots new in-flight requests without starvation on step pass', () => {
    const state = createInitialEngineState();
    const nextState = stepPagedAttentionPass(state);

    expect(nextState.processedTokens).toBe(3520000);
    expect(nextState.engineXp).toBe(80000);
    expect(nextState.totalFragPct).toBe(0.0);
    expect(nextState.sequences.length).toBeGreaterThanOrEqual(3);
    expect(nextState.sequences.every((s) => s.status === 'IN_FLIGHT')).toBe(true);
  });

  it('handles Paged Batch Burst and increments shared reference counts across B0-B7', () => {
    const state = createInitialEngineState();
    const burstState = triggerPagedBatchBurst(state, 4);

    expect(burstState.processedTokens).toBe(3584000);
    expect(burstState.engineXp).toBe(85000);
    expect(burstState.throughputGbs).toBeGreaterThan(15200);
    expect(burstState.blocks.every((b) => b.refCount === 5)).toBe(true);
  });

  it('injects memory fragmentation spike and recovers to 0.0% waste on defrag or pipeline pass', () => {
    const state = createInitialEngineState();
    const spiked = toggleFragmentationSpike(state);

    expect(spiked.fragmentationSpikeActive).toBe(true);
    expect(spiked.totalFragPct).toBeGreaterThan(0);
    expect(spiked.batchState).toBe('FragAlert');
    expect(spiked.throughputGbs).toBeLessThan(15200);

    const recovered = stepPagedAttentionPass(spiked);
    expect(recovered.fragmentationSpikeActive).toBe(false);
    expect(recovered.totalFragPct).toBe(0.0);
    expect(recovered.batchState).toBe('PagedActive');
    expect(recovered.throughputGbs).toBe(15200);
  });

  it('switches across all 4 synthetic PagedAttention corridors and flushes back to baseline', () => {
    let state = createInitialEngineState();
    for (const corridor of SYNTHETIC_CORRIDORS) {
      state = switchEngineCorridor(state, corridor.id);
      expect(state.corridor).toBe(corridor.id);
    }

    const flushed = flushKvCacheBuffers();
    expect(flushed.processedTokens).toBe(3456000);
    expect(flushed.totalFragPct).toBe(0.0);
    expect(flushed.throughputGbs).toBe(15200);
  });

  it('enforces GridSync zero-trust sanitization and zero-currency gate', () => {
    const stateJson = JSON.stringify(createInitialEngineState());
    expect(stateJson.includes(String.fromCharCode(36))).toBe(false);

    expect(() => validateGridSyncInput('DROP TABLE kv_blocks;--')).toThrow();
    expect(() => validateGridSyncInput('<script>evil()</script>')).toThrow();
    expect(() => validateGridSyncInput('vllm_internal_engine')).toThrow();
    expect(() =>
      validateGridSyncInput('corridor_with_' + String.fromCharCode(36) + '_glyph')
    ).toThrow();
  });
});
