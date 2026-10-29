/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GF-T3-283: Ultra-Wide Dynamic Prefill-Decode Disaggregation & Distributed KV-Streaming Engine
 * Zero-Mock Mathematical Core & GridSync Zero-Trust Sanitization Layer
 */

import { z } from 'zod';

export type CorridorId =
  | 'DISAGG-CORRIDOR-ALPHA'
  | 'DISAGG-CORRIDOR-BRAVO'
  | 'DISAGG-CORRIDOR-GAMMA'
  | 'DISAGG-CORRIDOR-DELTA';

export interface CorridorProfile {
  id: CorridorId;
  label: string;
  shortTag: string;
  rdmaBandwidthGbps: number;
  baseHandoffLatencyUs: number;
  prefillTflopsPerNode: number;
  decodeHbmBandwidthGbps: number;
  collocatedFallback: boolean;
  overlapEfficiency: number;
}

export const SYNTHETIC_CORRIDORS: Record<CorridorId, CorridorProfile> = {
  'DISAGG-CORRIDOR-ALPHA': {
    id: 'DISAGG-CORRIDOR-ALPHA',
    label: 'DISAGG-CORRIDOR-ALPHA (PREFILL-DECODE-DISAGGREGATION-FABRIC · 40800-GB/S)',
    shortTag: 'ALPHA · 40800-GB/S',
    rdmaBandwidthGbps: 40800,
    baseHandoffLatencyUs: 0.01,
    prefillTflopsPerNode: 1979,
    decodeHbmBandwidthGbps: 8000,
    collocatedFallback: false,
    overlapEfficiency: 0.994,
  },
  'DISAGG-CORRIDOR-BRAVO': {
    id: 'DISAGG-CORRIDOR-BRAVO',
    label: 'DISAGG-CORRIDOR-BRAVO (DISTRIBUTED-KV-STREAMING-ENGINE)',
    shortTag: 'BRAVO · KV-STREAM',
    rdmaBandwidthGbps: 36400,
    baseHandoffLatencyUs: 0.02,
    prefillTflopsPerNode: 1850,
    decodeHbmBandwidthGbps: 7600,
    collocatedFallback: false,
    overlapEfficiency: 0.982,
  },
  'DISAGG-CORRIDOR-GAMMA': {
    id: 'DISAGG-CORRIDOR-GAMMA',
    label: 'DISAGG-CORRIDOR-GAMMA (NON-BLOCKING-RDMA-KV-CHUNK-ROUTER)',
    shortTag: 'GAMMA · RDMA-ROUTER',
    rdmaBandwidthGbps: 38200,
    baseHandoffLatencyUs: 0.015,
    prefillTflopsPerNode: 1920,
    decodeHbmBandwidthGbps: 7850,
    collocatedFallback: false,
    overlapEfficiency: 0.989,
  },
  'DISAGG-CORRIDOR-DELTA': {
    id: 'DISAGG-CORRIDOR-DELTA',
    label: 'DISAGG-CORRIDOR-DELTA (FALLBACK-COLLOCATED-PREFILL-DECODE-PASS)',
    shortTag: 'DELTA · COLLOCATED',
    rdmaBandwidthGbps: 18400,
    baseHandoffLatencyUs: 0.14,
    prefillTflopsPerNode: 1240,
    decodeHbmBandwidthGbps: 4800,
    collocatedFallback: true,
    overlapEfficiency: 0.72,
  },
};

export type NodeRole =
  | 'PREFILL-P0'
  | 'PREFILL-P1'
  | 'PREFILL-P2'
  | 'DECODE-D3'
  | 'PREFILL-P4'
  | 'DECODE-D5'
  | 'PREFILL-P6'
  | 'DECODE-D7';

export type NodeOperationalState = 'STREAMING · LOCKED' | 'REROUTING · FAULT' | 'SYNCING · PASS';

export interface DisaggNodeUnit {
  nodeIndex: number;
  nodeCode: string;
  title: string;
  hexPtr: string;
  role: NodeRole;
  isPrefill: boolean;
  tokensK: number;
  latencyMs: number;
  syncPercent: number;
  disaggStatus: 'OK' | 'REROUTE' | 'PASS';
  stateLabel: NodeOperationalState;
  rdmaQueueDepth: number;
  kvChunkTransferredGb: number;
  checksumHex: string;
}

export interface DisaggCalculationResult {
  corridorId: CorridorId;
  streamingThroughputGbps: number;
  handoffLatencyUs: number;
  activeNodesCount: number;
  totalNodesCount: number;
  processedTokensUnits: number;
  engineXpUnits: number;
  disaggStateLabel: string;
  prefillTimeMs: number;
  decodeTimeMs: number;
  kvTransferTimeMs: number;
  disaggTotalLatencyMs: number;
  collocatedTotalLatencyMs: number;
  ttftReductionPercent: number;
  bufferParityPercent: number;
  kvStateSizeGb: number;
  vectorSignature: [number, number, number, number];
  nodes: DisaggNodeUnit[];
}

export interface DisaggSimulationInput {
  corridorId: CorridorId;
  burstMultiplier: number;
  congestionActive: boolean;
  chunkPassCount: number;
  seqLengthTokens: number;
  batchSize: number;
  numLayers: number;
  numKvHeads: number;
  headDim: number;
}

const BANNED_SQL_XSS_TOKENS = [
  'DROP TABLE',
  'DELETE FROM',
  'INSERT INTO',
  'UNION SELECT',
  '<SCRIPT',
  'JAVASCRIPT:',
  'ONERROR=',
  '--',
  ';--',
];

export function containsForbiddenPayload(raw: string): boolean {
  const upper = raw.toUpperCase();
  for (let i = 0; i < BANNED_SQL_XSS_TOKENS.length; i += 1) {
    if (upper.includes(BANNED_SQL_XSS_TOKENS[i])) {
      return true;
    }
  }
  return false;
}

export const GridSyncIngressSchema = z.object({
  corridorId: z.enum([
    'DISAGG-CORRIDOR-ALPHA',
    'DISAGG-CORRIDOR-BRAVO',
    'DISAGG-CORRIDOR-GAMMA',
    'DISAGG-CORRIDOR-DELTA',
  ]),
  burstMultiplier: z.number().min(1).max(8),
  congestionActive: z.boolean(),
  chunkPassCount: z.number().int().min(0).max(10000),
  seqLengthTokens: z.number().int().min(512).max(2097152),
  batchSize: z.number().int().min(1).max(512),
  numLayers: z.number().int().min(8).max(256),
  numKvHeads: z.number().int().min(1).max(128),
  headDim: z.number().int().min(32).max(512),
  operatorNote: z
    .string()
    .max(128)
    .optional()
    .refine((val) => !val || !containsForbiddenPayload(val), {
      message: 'GridSync Zero-Trust Gate: Malicious SQL/XSS token rejected',
    }),
});

/**
 * Deterministic FNV-1a 32-bit hash formatted as uppercase hex with 0x prefix
 */
export function computeDeterministicHexHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  const unsigned = hash >>> 0;
  return '0x' + unsigned.toString(16).toUpperCase().padStart(8, '0');
}

/**
 * Computes exact KV-Cache footprint in Gigabytes (GB) for FP16/BF16 (2 bytes per element):
 * KV_bytes = 2 (K and V) * numLayers * numKvHeads * headDim * 2 (bytes) * seqLengthTokens * batchSize
 */
export function computeKvCacheStateGb(
  seqLengthTokens: number,
  batchSize: number,
  numLayers: number,
  numKvHeads: number,
  headDim: number
): number {
  const bytesPerElement = 2; // BF16 / FP16
  const totalBytes =
    2 * numLayers * numKvHeads * headDim * bytesPerElement * seqLengthTokens * batchSize;
  const gigabytes = totalBytes / 1e9;
  return Number(gigabytes.toFixed(4));
}

/**
 * Core Asymmetric Disaggregated Serving Formula:
 * T_disagg = max(T_prefill, T_decode) + (KV_state_GB / Effective_Bandwidth_RDMA_GBps) * (1 - overlap)
 * vs Collocated Serving:
 * T_collocated = T_prefill + T_decode + TTFT_Interference_Penalty
 */
export function evaluateDisaggregatedEngine(
  rawInput: DisaggSimulationInput
): DisaggCalculationResult {
  const parsed = GridSyncIngressSchema.parse(rawInput);
  const profile = SYNTHETIC_CORRIDORS[parsed.corridorId];

  const kvStateSizeGb = computeKvCacheStateGb(
    parsed.seqLengthTokens,
    parsed.batchSize,
    parsed.numLayers,
    parsed.numKvHeads,
    parsed.headDim
  );

  // Effective RDMA bandwidth under burst and optional network congestion
  const congestionPenaltyFactor = parsed.congestionActive ? 0.84 : 1.0;
  const chunkBoostFactor = 1 + Math.min(parsed.chunkPassCount * 0.005, 0.12);
  const rawThroughputGbps =
    profile.rdmaBandwidthGbps * congestionPenaltyFactor * chunkBoostFactor;
  const streamingThroughputGbps = Math.round(rawThroughputGbps);

  // Compute-bound prefill phase duration (ms)
  const totalPrefillFlopsGiga =
    parsed.seqLengthTokens * parsed.batchSize * parsed.numLayers * 0.014;
  const clusterPrefillTflops = profile.prefillTflopsPerNode * 4;
  const prefillTimeMs = Number(
    ((totalPrefillFlopsGiga / clusterPrefillTflops) * parsed.burstMultiplier).toFixed(4)
  );

  // Memory-bandwidth-bound decode phase duration (ms)
  const decodeBytesMovedGb = kvStateSizeGb * 1.25;
  const clusterDecodeBandwidthGbps = profile.decodeHbmBandwidthGbps * 4;
  const decodeTimeMs = Number(
    (((decodeBytesMovedGb / clusterDecodeBandwidthGbps) * 1000) * parsed.burstMultiplier).toFixed(4)
  );

  // Non-blocking RDMA KV transfer time (ms)
  const unmaskedTransferTimeMs = (kvStateSizeGb / streamingThroughputGbps) * 1000;
  const kvTransferTimeMs = Number(
    (unmaskedTransferTimeMs * (1 - profile.overlapEfficiency)).toFixed(5)
  );

  // Asymmetric Disaggregated Latency Formula: T_disagg = max(T_prefill, T_decode) + KV_transfer
  const disaggTotalLatencyMs = Number(
    (Math.max(prefillTimeMs, decodeTimeMs) + kvTransferTimeMs).toFixed(4)
  );

  // Collocated baseline includes interference stall between compute-heavy prefill and decode
  const interferencePenaltyMs = (prefillTimeMs + decodeTimeMs) * 0.42;
  const collocatedTotalLatencyMs = Number(
    (prefillTimeMs + decodeTimeMs + interferencePenaltyMs).toFixed(4)
  );

  const ttftReductionPercent = Number(
    (
      ((collocatedTotalLatencyMs - disaggTotalLatencyMs) /
        Math.max(collocatedTotalLatencyMs, 0.0001)) *
      100
    ).toFixed(2)
  );

  const handoffLatencyUs = Number(
    (
      profile.baseHandoffLatencyUs *
      (parsed.congestionActive ? 2.0 : 1.0) *
      (parsed.burstMultiplier > 1 ? 1.15 : 1.0)
    ).toFixed(3)
  );

  const baseTokensPerNodeK = Math.round(
    (parsed.seqLengthTokens * parsed.batchSize * parsed.burstMultiplier) / 1024
  );
  const processedTokensUnits =
    7680000 +
    parsed.chunkPassCount * 512000 +
    Math.round((parsed.burstMultiplier - 1) * 1024000);
  const engineXpUnits = 75000 + parsed.chunkPassCount * 4200 + (parsed.burstMultiplier - 1) * 8500;

  const nodeRoles: NodeRole[] = [
    'PREFILL-P0',
    'PREFILL-P1',
    'PREFILL-P2',
    'DECODE-D3',
    'PREFILL-P4',
    'DECODE-D5',
    'PREFILL-P6',
    'DECODE-D7',
  ];

  const nodes: DisaggNodeUnit[] = nodeRoles.map((role, idx) => {
    const hexOffset = (0x11000 + idx * 0x10).toString(16).toUpperCase();
    const hexPtr = '0x' + hexOffset;
    const isPrefill = role.startsWith('PREFILL');
    const isCongestedNode = parsed.congestionActive && (idx === 2 || idx === 5);

    const nodeLatencyMs = Number(
      (
        0.02 +
        (idx % 3) * 0.005 +
        (isCongestedNode ? 0.04 : 0) +
        (parsed.burstMultiplier - 1) * 0.008
      ).toFixed(2)
    );

    const tokensK = baseTokensPerNodeK + (parsed.chunkPassCount * 16);
    const syncPercent = isCongestedNode ? 94 : 100;
    const disaggStatus: 'OK' | 'REROUTE' | 'PASS' = isCongestedNode
      ? 'REROUTE'
      : parsed.chunkPassCount > 0 && idx % 2 === parsed.chunkPassCount % 2
        ? 'PASS'
        : 'OK';

    const stateLabel: NodeOperationalState = isCongestedNode
      ? 'REROUTING · FAULT'
      : 'STREAMING · LOCKED';

    const checksumHex = computeDeterministicHexHash(
      parsed.corridorId + ':' + role + ':' + String(tokensK) + ':' + String(parsed.chunkPassCount)
    );

    return {
      nodeIndex: idx,
      nodeCode: 'N' + String(idx),
      title: 'Node ' + String(idx) + ' (N' + String(idx) + ')',
      hexPtr,
      role,
      isPrefill,
      tokensK,
      latencyMs: nodeLatencyMs,
      syncPercent,
      disaggStatus,
      stateLabel,
      rdmaQueueDepth: isCongestedNode ? 14 : 2 + (idx % 3),
      kvChunkTransferredGb: Number((kvStateSizeGb / 8).toFixed(3)),
      checksumHex,
    };
  });

  const activeNodesCount = nodes.filter((n) => n.stateLabel === 'STREAMING · LOCKED').length;
  const bufferParityPercent = parsed.congestionActive ? 98.4 : 99.98;

  const v0 = Number((4.51 + parsed.chunkPassCount * 0.01).toFixed(2));
  const v1 = Number((4.55 + (parsed.burstMultiplier - 1) * 0.04).toFixed(2));
  const v2 = Number((4.52 + (parsed.congestionActive ? -0.18 : 0.0)).toFixed(2));
  const v3 = Number((4.54 + parsed.chunkPassCount * 0.01).toFixed(2));

  const disaggStateLabel = parsed.congestionActive
    ? 'RDMA Re-Routing Active'
    : profile.collocatedFallback
      ? 'Fallback Collocated Pass'
      : 'Streaming Active';

  return {
    corridorId: parsed.corridorId,
    streamingThroughputGbps,
    handoffLatencyUs,
    activeNodesCount,
    totalNodesCount: 8,
    processedTokensUnits,
    engineXpUnits,
    disaggStateLabel,
    prefillTimeMs,
    decodeTimeMs,
    kvTransferTimeMs,
    disaggTotalLatencyMs,
    collocatedTotalLatencyMs,
    ttftReductionPercent,
    bufferParityPercent,
    kvStateSizeGb,
    vectorSignature: [v0, v1, v2, v3],
    nodes,
  };
}
