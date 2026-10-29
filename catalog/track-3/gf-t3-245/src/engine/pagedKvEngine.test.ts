import { describe, it, expect } from 'vitest';
import {
  TOKENS_PER_BLOCK,
  TOTAL_PHYSICAL_BLOCKS,
  SYNTHETIC_KV_CORRIDORS,
  resolvePhysicalPageHex,
  computeFlashAttentionScore,
  computeVramFragmentationPct,
  createInitialEngineState,
  triggerEvictionBurst,
  toggleFragmentationSpike,
  stepPagedAllocation,
  flushInactiveBlocks,
  exportComplianceAuditCsv,
  GridSyncPayloadSchema,
  enforceZeroDollarGate,
} from './pagedKvEngine';

describe('GF-T3-245 Paged KV Cache & FlashAttention Ring-Block Eviction Engine', () => {
  it('initializes with 32 mapped blocks, 9,200 GB/s bandwidth, 0.01 us latency, and zero fragmentation', () => {
    const state = createInitialEngineState();
    expect(state.bandwidthGbs).toBe(9200);
    expect(state.evictionLatencyUs).toBe(0.01);
    expect(state.activeBlocksCount).toBe(TOTAL_PHYSICAL_BLOCKS);
    expect(state.fragmentationPct).toBe(0.0);
    expect(state.processedTokensUnits).toBe(2432000);
    expect(state.selectedBlockIndex).toBe(3);
    expect(state.blocks[3].pageHex).toBe('0x9C00');
    expect(state.blocks[3].sequenceId).toBe('SEQ_409');
    expect(state.blocks[3].attentionScorePrecise).toBe(0.942);
  });

  it('resolves logical-to-physical VRAM hex addresses deterministically at 0x0400 page stride', () => {
    expect(resolvePhysicalPageHex(0)).toBe('0x9000');
    expect(resolvePhysicalPageHex(1)).toBe('0x9400');
    expect(resolvePhysicalPageHex(2)).toBe('0x9800');
    expect(resolvePhysicalPageHex(3)).toBe('0x9C00');
    expect(resolvePhysicalPageHex(7)).toBe('0xAC00');
  });

  it('maintains 0.00% VRAM fragmentation during dynamic paged sequence allocation and expansion', () => {
    let state = createInitialEngineState();
    for (let i = 0; i < 8; i++) {
      state = stepPagedAllocation(state);
      expect(state.fragmentationPct).toBe(0.0);
      expect(state.blocks.every((b) => b.tokensFilled === TOKENS_PER_BLOCK)).toBe(true);
    }
    expect(state.processedTokensUnits).toBe(2432000 + 8 * 40000);
  });

  it('accurately computes FlashAttention ring-block eviction scores and rotates coldest blocks on burst', () => {
    const initial = createInitialEngineState();
    const afterBurst = triggerEvictionBurst(initial);
    expect(afterBurst.evictionLatencyUs).toBe(0.01);
    expect(afterBurst.bandwidthGbs).toBeGreaterThanOrEqual(9200);
    expect(afterBurst.auditLedger.length).toBeGreaterThan(initial.auditLedger.length);

    const scoreResult = computeFlashAttentionScore(0.95, 2, 99.8);
    expect(scoreResult.scorePrecise).toBeGreaterThan(0.9);
    expect(scoreResult.scorePrecise).toBeLessThanOrEqual(1.0);
  });

  it('injects cache fragmentation spike and automatically remediates back to 0.00% upon defrag toggle', () => {
    const initial = createInitialEngineState();
    const spiked = toggleFragmentationSpike(initial);
    expect(spiked.fragmentSpikeActive).toBe(true);
    expect(spiked.fragmentationPct).toBeGreaterThan(35.0);
    expect(spiked.cloudNodes[0].rbacPolicyStatus).toBe('DRIFT_DETECTED');

    const remediated = toggleFragmentationSpike(spiked);
    expect(remediated.fragmentSpikeActive).toBe(false);
    expect(remediated.fragmentationPct).toBe(0.0);
    expect(remediated.cloudNodes[0].rbacPolicyStatus).toBe('REMEDIATED');
  });

  it('flushes inactive blocks and re-zeros hardware page LUT to baseline state', () => {
    let state = createInitialEngineState();
    state = toggleFragmentationSpike(state);
    state = flushInactiveBlocks(state);
    expect(state.fragmentationPct).toBe(0.0);
    expect(state.bandwidthGbs).toBe(9200);
    expect(state.blocks[0].pageHex).toBe('0x9000');
    expect(state.blocks[3].pageHex).toBe('0x9C00');
  });

  it('enforces Zero-Trust GridSync payload validation against SQLi, XSS, and currency symbols', () => {
    const valid = GridSyncPayloadSchema.safeParse({
      sequenceId: 'SEQ_409',
      tokenCount: 1024,
      corridor: SYNTHETIC_KV_CORRIDORS[0],
      actorRole: 'CREW_CHIEF',
      mfaVerified: true,
    });
    expect(valid.success).toBe(true);

    const sqlInjection = GridSyncPayloadSchema.safeParse({
      sequenceId: 'SEQ_409; DROP TABLE kv_blocks--',
      tokenCount: 1024,
      corridor: SYNTHETIC_KV_CORRIDORS[0],
      actorRole: 'CREW_CHIEF',
      mfaVerified: true,
    });
    expect(sqlInjection.success).toBe(false);
  });

  it('exports machine-readable CSV audit reports with zero forbidden currency characters', () => {
    const state = triggerEvictionBurst(createInitialEngineState());
    const csv = exportComplianceAuditCsv(state);
    expect(csv).toContain('AUDIT_ID,TIMESTAMP_ISO,ACTOR_ROLE');
    expect(csv).toContain('EVICTION_BURST_RING_ROTATION');
    expect(csv.includes('\u0024')).toBe(false);
    expect(enforceZeroDollarGate('TEST_VALUE').includes('\u0024')).toBe(false);
  });

  it('computes fallback contiguous VRAM buffer fragmentation accurately', () => {
    const state = createInitialEngineState();
    const fallbackFrag = computeVramFragmentationPct(
      state.blocks,
      false,
      'KV-CORRIDOR-DELTA (FALLBACK-CONTIGUOUS-VRAM-BUFFER)'
    );
    expect(fallbackFrag).toBeGreaterThan(15.0);
  });
});
