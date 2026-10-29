/**
 * GF-T3-240: Executable Vitest Verification Suite
 * Verifies Zero-Copy GPUDirect P2P mechanics, CUDA event synchronization,
 * BAR1 ring pointer arithmetic, and GridSync Zero-Trust sanitization gates.
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from 'vitest';
import {
  SyntheticCorridor,
  computeAsyncStreamLatencyUs,
  computeBufferParityPct,
  computeRingPointerHex,
  computeZeroCopyBandwidthGbs,
  createInitialEngineState,
  transitionEngineState,
  validateGridSyncIngress,
  SUPABASE_POSTGRES_SCHEMA_SQL,
} from './ncclEngine';

describe('GF-T3-240 Zero-Copy NCCL P2P Ring Stream Engine', () => {
  it('initializes with exact GF-T3-240 Track 3 telemetry baseline and zero-copy pointers', () => {
    const state = createInitialEngineState();
    expect(state.engineId).toBe('GF-T3-240');
    expect(state.trackBadge).toBe('TRACK 3');
    expect(state.bandwidthGbs).toBe(5600);
    expect(state.formattedBandwidth).toBe('5,600 GB/s');
    expect(state.streamLatencyUs).toBe(0.03);
    expect(state.formattedLatency).toBe('0.03 µs');
    expect(state.activeStreamsCount).toBe(8);
    expect(state.totalStreamsCount).toBe(8);
    expect(state.processedTokens).toBe(1792000);
    expect(state.formattedTokens).toBe('1,792,000 UNITS');
    expect(state.formattedXp).toBe('+30.2k NCCL XP');
    expect(state.ncclStateLabel).toBe('NCCL State: P2P Ring Active');
    expect(state.inspectorStripText).toBe(
      'STREAM: ST3 · PEER: GPU_4 · SIZE: 64 MB · PTR: 0x7800 · ZERO_COPY_ACTIVE'
    );
    expect(state.streams).toHaveLength(8);
    expect(state.streams[0].pointerHex).toBe('0x7000');
    expect(state.streams[3].pointerHex).toBe('0x7800');
  });

  it('calculates GPUDirect P2P bandwidth saturation across all 4 synthetic corridors', () => {
    const bwAlpha = computeZeroCopyBandwidthGbs(SyntheticCorridor.ALPHA, 8, 64, false, false);
    const bwBravo = computeZeroCopyBandwidthGbs(SyntheticCorridor.BRAVO, 8, 64, false, false);
    const bwGamma = computeZeroCopyBandwidthGbs(SyntheticCorridor.GAMMA, 8, 64, false, false);
    const bwDelta = computeZeroCopyBandwidthGbs(SyntheticCorridor.DELTA, 8, 64, false, false);

    expect(bwAlpha).toBe(5600);
    expect(bwBravo).toBeGreaterThan(5000);
    expect(bwGamma).toBeGreaterThan(4400);
    expect(bwDelta).toBeLessThan(1200);
    expect(computeZeroCopyBandwidthGbs(SyntheticCorridor.ALPHA, 0, 64, false, false)).toBe(0);
  });

  it('executes P2P Ring Stream Burst, Step Zero-Copy Pass, and NVLink Stall Resync transitions', () => {
    const initial = createInitialEngineState();

    // 1. Trigger P2P Ring Stream Burst
    const burstResult = transitionEngineState(initial, {
      corridor: SyntheticCorridor.ALPHA,
      commandType: 'INJECT_BURST',
      streamId: 3,
    });
    expect(burstResult.state.burstActive).toBe(true);
    expect(burstResult.state.bandwidthGbs).toBe(6300);
    expect(burstResult.state.processedTokens).toBe(1792000 + 256000);

    // 2. Inject NVLink Link Stall (Force Stream Resync)
    const stallResult = transitionEngineState(burstResult.state, {
      corridor: SyntheticCorridor.ALPHA,
      commandType: 'TOGGLE_STALL',
      streamId: 2,
    });
    expect(stallResult.state.linkStallActive).toBe(true);
    expect(stallResult.state.activeStreamsCount).toBe(6);
    expect(stallResult.state.streams[2].lockBadge).toBe('⚡ FAULT');
    expect(stallResult.state.streams[2].eventState).toBe('STALL_RESYNC');
    expect(stallResult.state.streamLatencyUs).toBeGreaterThan(0.8);

    // 3. Step Zero-Copy Transfer Pass advances deterministic ring pointer
    const stepResult = transitionEngineState(stallResult.state, {
      corridor: SyntheticCorridor.ALPHA,
      commandType: 'STEP_ZERO_COPY',
      streamId: 0,
    });
    expect(stepResult.state.stepCount).toBe(2);
    expect(stepResult.state.streams[0].pointerHex).toBe(computeRingPointerHex(0, 2));

    // 4. Flush P2P Queues & Re-Zero CUDA Events restores baseline
    const flushResult = transitionEngineState(stepResult.state, {
      corridor: SyntheticCorridor.ALPHA,
      commandType: 'FLUSH_QUEUES',
      streamId: 3,
    });
    expect(flushResult.state.bandwidthGbs).toBe(5600);
    expect(flushResult.state.streamLatencyUs).toBe(0.03);
    expect(flushResult.state.processedTokens).toBe(1792000);
    expect(flushResult.state.linkStallActive).toBe(false);
  });

  it('enforces GridSync Zero-Trust ingress sanitization against SQLi and XSS', () => {
    const cleanCheck = validateGridSyncIngress({
      corridor: SyntheticCorridor.ALPHA,
      commandType: 'STEP_ZERO_COPY',
      streamId: 4,
      customAuditTag: 'RING_VERIFY_PASS_04',
    });
    expect(cleanCheck.valid).toBe(true);

    const sqliCheck = validateGridSyncIngress({
      corridor: SyntheticCorridor.ALPHA,
      commandType: 'STEP_ZERO_COPY',
      streamId: 4,
      customAuditTag: 'PASS; DROP TABLE p2p_ring_streams;--',
    });
    expect(sqliCheck.valid).toBe(false);
    expect(sqliCheck.error).toContain('GridSync Zero-Trust Gate');

    const xssCheck = validateGridSyncIngress({
      corridor: SyntheticCorridor.ALPHA,
      commandType: 'STEP_ZERO_COPY',
      streamId: 4,
      customAuditTag: '<script>evil()</script>',
    });
    expect(xssCheck.valid).toBe(false);
  });

  it('enforces the Absolute Zero-Dollar Gate across state snapshots and SQL schema', () => {
    const snapshotJson = JSON.stringify(createInitialEngineState());
    expect(snapshotJson.includes('\x24')).toBe(false);
    expect(SUPABASE_POSTGRES_SCHEMA_SQL.includes('\x24')).toBe(false);
    expect(computeBufferParityPct(SyntheticCorridor.ALPHA, false, false)).toBe(100);
    expect(computeAsyncStreamLatencyUs(SyntheticCorridor.ALPHA, 8, false, false)).toBe(0.03);
  });
});
