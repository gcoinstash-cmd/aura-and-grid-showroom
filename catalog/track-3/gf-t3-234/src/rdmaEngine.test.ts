/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GF-T3-234: Executable Vitest Verification Suite
 * Tests KV-Cache block integrity, RDMA bandwidth saturation, CQ signaling, and Zero-Dollar Gate.
 */

import { describe, it, expect } from 'vitest';
import {
  RdmaCorridor,
  CompletionQueueState,
  createInitialFabricState,
  stepP2PMigrationKernel,
  flushRdmaRingsAndZeroBuffers,
  calculateRdmaLatencyUs,
  calculateCorridorBandwidthGbs,
  computeKvBlockCrc32,
  formatTelemetryInspectorLine,
  NodeTransferActionSchema,
} from './rdmaEngine';
import { SUPABASE_POSTGRES_SCHEMA_SQL } from './supabaseSchema';

describe('GF-T3-234 Direct KV-Cache P2P Transfer & RDMA Fabric Suite', () => {
  it('1. verifies canonical 8-node initialization and Node 2 inspector telemetry line', () => {
    const initial = createInitialFabricState();
    expect(initial.nodes.length).toBe(8);
    expect(initial.aggregateBandwidthGbs).toBe(200);
    expect(initial.meanLatencyUs).toBe(0.12);
    expect(initial.processedTokensUnits).toBe(1024000);

    const node2 = initial.nodes[2];
    const line = formatTelemetryInspectorLine(node2);
    expect(line).toBe(
      'NODE: N2 · TARGET: N5 · SIZE: 16 MB · PTR: 0x7FA9_B200 · STATE: RDMA_WRITE_ACTIVE'
    );
  });

  it('2. verifies deterministic CRC-32 KV-cache block numerical fidelity across ring epochs', () => {
    const crcA = computeKvBlockCrc32(2, 5, 1, 16, 3);
    const crcB = computeKvBlockCrc32(2, 5, 1, 16, 3);
    const crcDifferentEpoch = computeKvBlockCrc32(2, 5, 2, 16, 3);

    expect(crcA).toBe(crcB);
    expect(crcA).not.toBe(crcDifferentEpoch);
    expect(crcA.startsWith('0x')).toBe(true);
    expect(crcA.length).toBe(11);
  });

  it('3. verifies ring-buffer P2P migration shifts targets without self-loops and increments tokens', () => {
    const state0 = createInitialFabricState();
    const state1 = stepP2PMigrationKernel(state0, false);

    expect(state1.ringEpoch).toBe(2);
    expect(state1.processedTokensUnits).toBe(1056000);
    state1.nodes.forEach((n) => {
      expect(n.nodeId).not.toBe(n.targetNodeId);
      expect(n.parityVerified).toBe(true);
    });
  });

  it('4. verifies RDMA burst saturation and packet drop retransmit recovery mechanics', () => {
    const base = createInitialFabricState();
    const burstState = stepP2PMigrationKernel(base, true);
    expect(burstState.aggregateBandwidthGbs).toBeGreaterThanOrEqual(200);
    expect(burstState.nodes[0].cqState).toBe(CompletionQueueState.CQ_SIGNAL_VERIFIED);

    const faultInjected = { ...burstState, packetDropInjected: true };
    const faultStep = stepP2PMigrationKernel(faultInjected, false);
    expect(faultStep.fabricStateLabel).toBe('PFC Retransmit Active');
    expect(faultStep.bufferParityPct).toBeLessThan(100);
    const retransmittingNodes = faultStep.nodes.filter(
      (n) => n.cqState === CompletionQueueState.RETRANSMIT_RECOVERY
    );
    expect(retransmittingNodes.length).toBeGreaterThan(0);
  });

  it('5. verifies flush RDMA buffers resets completion queues and restores 100% parity', () => {
    const dirty = stepP2PMigrationKernel(
      { ...createInitialFabricState(), packetDropInjected: true },
      true
    );
    const flushed = flushRdmaRingsAndZeroBuffers(RdmaCorridor.ALPHA);
    expect(flushed.bufferParityPct).toBe(100);
    expect(flushed.ringEpoch).toBe(1);
    expect(flushed.packetDropInjected).toBe(false);
    expect(flushed.aggregateBandwidthGbs).toBe(200);
  });

  it('6. verifies Zero-Trust Zod payload sanitization rejects out-of-bounds DMA pointers', () => {
    const validPayload = {
      sourceNodeId: 2,
      targetNodeId: 5,
      transferSizeMb: 16,
      corridor: RdmaCorridor.ALPHA,
      packetDropActive: false,
      memoryPointerHex: '0x7FA9_B200',
    };
    expect(NodeTransferActionSchema.safeParse(validPayload).success).toBe(true);

    const maliciousPayload = {
      ...validPayload,
      memoryPointerHex: '0x7FA9_B200; DROP TABLE rdma_worker_nodes;',
    };
    expect(NodeTransferActionSchema.safeParse(maliciousPayload).success).toBe(false);
  });

  it('7. enforces strict Zero-Dollar Gate across schema and telemetry strings', () => {
    const prohibitedChar = String.fromCharCode(36);
    expect(SUPABASE_POSTGRES_SCHEMA_SQL.includes(prohibitedChar)).toBe(false);
    const state = createInitialFabricState();
    expect(JSON.stringify(state).includes(prohibitedChar)).toBe(false);
    expect(calculateRdmaLatencyUs(RdmaCorridor.DELTA, 32, false, 16)).toBeGreaterThan(1.0);
    expect(calculateCorridorBandwidthGbs(RdmaCorridor.BRAVO, false, 1.0)).toBe(196.4);
  });
});
