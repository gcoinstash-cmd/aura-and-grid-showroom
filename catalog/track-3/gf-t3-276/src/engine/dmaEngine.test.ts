/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GF-T3-276 · Executable Vitest Verification Suite
 * Tests edge cases, boundary math, asynchronous DMA ring scheduling, and GridSync security gates.
 */

import { describe, it, expect } from 'vitest';
import {
  SYNTHETIC_DMA_CORRIDORS,
  calculateDmaBandwidthGbs,
  calculateOffloadLatencyUs,
  sanitizeGridSyncString,
  createInitialEngineState,
  applyEngineCommand,
  computeDeterministicManifestHex,
} from './dmaEngine';

describe('GF-T3-276 Core DMA & PCIe Gen-6 Offloading Engine', () => {
  it('initializes baseline telemetry with exact GF-T3-276 specifications and zero dollar characters', () => {
    const state = createInitialEngineState();
    expect(state.projectTitle).toBe('GF-T3-276');
    expect(state.corridorId).toBe('DMA-CORRIDOR-ALPHA');
    expect(state.dmaThroughputGbs).toBe(35200);
    expect(state.offloadLatencyUs).toBe(0.01);
    expect(state.activeChannels).toBe(8);
    expect(state.totalChannels).toBe(8);
    expect(state.processedTokens).toBe(6784000);
    expect(state.engineXpK).toBe(75.0);
    expect(state.dmaState).toBe('Offload Active');
    expect(state.vectorSignature).toEqual([3.81, 3.85, 3.82, 3.84]);
    expect(state.channels).toHaveLength(8);
    expect(state.channels[0].pointerHex).toBe('0xA000');
    expect(state.channels[3].pointerHex).toBe('0xA030');
    expect(state.channels[3].tokensK).toBe(256);
    expect(state.channels[3].bandwidthGbs).toBe(128);

    const serialized = JSON.stringify(state);
    expect(serialized.includes(String.fromCharCode(36))).toBe(false);
  });

  it('calculates asynchronous DMA ring scheduling bandwidth accurately and rejects invalid boundary inputs', () => {
    const blocks = [12.8, 12.8, 12.8, 12.8, 12.8, 12.8, 12.8, 12.8];
    const bw = calculateDmaBandwidthGbs(blocks, 0.01, 24960);
    expect(bw).toBe(35200);

    expect(() => calculateDmaBandwidthGbs([], 0.01, 24960)).toThrow();
    expect(() => calculateDmaBandwidthGbs(blocks, 0, 24960)).toThrow();
    expect(() => calculateDmaBandwidthGbs(blocks, -0.05, 24960)).toThrow();
    expect(() => calculateDmaBandwidthGbs(blocks, 0.01, -100)).toThrow();
    expect(() => calculateDmaBandwidthGbs([12.8, -1], 0.01, 24960)).toThrow();
  });

  it('computes sub-microsecond bidirectional peer-to-peer prefetch latency and enforces boundary floor', () => {
    expect(calculateOffloadLatencyUs(0.01, false, 0, 0)).toBe(0.01);
    expect(calculateOffloadLatencyUs(0.01, true, 0, 0)).toBe(0.04);
    expect(calculateOffloadLatencyUs(0.012, false, 2, 1)).toBe(0.0135);
    expect(() => calculateOffloadLatencyUs(0, false, 0, 0)).toThrow();
  });

  it('executes PCIe DMA offload burst, bus saturation spike, async transfer step, and buffer flush', () => {
    let state = createInitialEngineState();

    state = applyEngineCommand(state, { action: 'BURST' });
    expect(state.burstCount).toBe(1);
    expect(state.dmaThroughputGbs).toBeGreaterThan(35200);
    expect(state.processedTokens).toBe(6784000 + 512000);
    expect(state.channels[0].tokensK).toBe(288);

    state = applyEngineCommand(state, { action: 'SPIKE' });
    expect(state.busSaturated).toBe(true);
    expect(state.dmaState).toBe('Host Swap Re-Routing');
    expect(state.activeChannels).toBe(6);
    expect(state.channels[2].stateLabel).toBe('SWAP_REROUTE · FAULT');
    expect(state.channels[5].stateLabel).toBe('SWAP_REROUTE · FAULT');
    expect(state.bufferParityPct).toBeLessThan(100);

    state = applyEngineCommand(state, { action: 'STEP' });
    expect(state.stepCount).toBe(1);
    expect(state.processedTokens).toBe(6784000 + 512000 + 256000);

    state = applyEngineCommand(state, {
      action: 'CORRIDOR',
      corridorId: 'DMA-CORRIDOR-BRAVO',
    });
    expect(state.corridorId).toBe('DMA-CORRIDOR-BRAVO');
    expect(state.corridorLabel).toBe(
      SYNTHETIC_DMA_CORRIDORS['DMA-CORRIDOR-BRAVO'].label
    );

    state = applyEngineCommand(state, {
      action: 'SELECT_CHANNEL',
      channelIndex: 6,
    });
    expect(state.selectedChannelIndex).toBe(6);

    state = applyEngineCommand(state, { action: 'ACQUIRE_APA' });
    expect(state.apaStatus).toContain('APA TITLE DOSSIER LOCKED');

    state = applyEngineCommand(state, { action: 'INQUIRE_VAULT' });
    expect(state.apaStatus).toContain('VAULT BUYOUT DISPATCHED');

    state = applyEngineCommand(state, { action: 'EXPORT_AUDIT' });
    expect(state.apaStatus).toContain('AUDIT MANIFEST SIGNED');

    state = applyEngineCommand(state, { action: 'FLUSH' });
    expect(state.burstCount).toBe(0);
    expect(state.busSaturated).toBe(false);
    expect(state.stepCount).toBe(0);
    expect(state.dmaThroughputGbs).toBe(35200);
    expect(state.activeChannels).toBe(8);
  });

  it('enforces GridSync Zero-Trust input sanitization and Zero-Dollar Gate', () => {
    expect(sanitizeGridSyncString('  DMA-CORRIDOR-GAMMA  ')).toBe(
      'DMA-CORRIDOR-GAMMA'
    );
    expect(() => sanitizeGridSyncString('')).toThrow();
    expect(() =>
      sanitizeGridSyncString('DROP TABLE kv_cache_arena_blocks;')
    ).toThrow();
    expect(() =>
      sanitizeGridSyncString('<script>alert("xss")</script>')
    ).toThrow();
    expect(() =>
      sanitizeGridSyncString('COST_' + String.fromCharCode(36) + '500')
    ).toThrow();

    const digest1 = computeDeterministicManifestHex('GF-T3-276|ALPHA');
    const digest2 = computeDeterministicManifestHex('GF-T3-276|ALPHA');
    expect(digest1).toBe(digest2);
    expect(digest1.startsWith('SHA256-')).toBe(true);
  });
});
