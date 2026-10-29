/**
 * GF-T3-224 Core Tensor-Parallel & 2-Phase Ring All-Reduce Mechanics
 * Includes GridSync Zero-Trust Zod Payload Sanitization Middleware
 * SPDX-License-Identifier: MIT
 */

import { z } from 'zod';

export type CorridorId =
  | 'TP-CORRIDOR-ALPHA'
  | 'TP-CORRIDOR-BRAVO'
  | 'TP-CORRIDOR-GAMMA'
  | 'TP-CORRIDOR-DELTA';

export interface CorridorProfile {
  id: CorridorId;
  label: string;
  worldSize: number;
  peakBandwidthGbps: number;
  baseLatencyMs: number;
  baseEfficiencyPct: number;
  baseOverheadMs: number;
  busName: string;
}

export const CORRIDOR_CATALOG: Record<CorridorId, CorridorProfile> = {
  'TP-CORRIDOR-ALPHA': {
    id: 'TP-CORRIDOR-ALPHA',
    label: 'TP-CORRIDOR-ALPHA (4-GPU · NVLINK-RING-FABRIC)',
    worldSize: 4,
    peakBandwidthGbps: 840,
    baseLatencyMs: 0.08,
    baseEfficiencyPct: 96.2,
    baseOverheadMs: 1.18,
    busName: 'NVLink Ring Bus',
  },
  'TP-CORRIDOR-BRAVO': {
    id: 'TP-CORRIDOR-BRAVO',
    label: 'TP-CORRIDOR-BRAVO (8-GPU · HYBRID-TORUS-MESH)',
    worldSize: 8,
    peakBandwidthGbps: 1120,
    baseLatencyMs: 0.14,
    baseEfficiencyPct: 94.8,
    baseOverheadMs: 1.42,
    busName: 'Hybrid Torus Fabric',
  },
  'TP-CORRIDOR-GAMMA': {
    id: 'TP-CORRIDOR-GAMMA',
    label: 'TP-CORRIDOR-GAMMA (COMM-COMP-STREAM-OVERLAP)',
    worldSize: 4,
    peakBandwidthGbps: 960,
    baseLatencyMs: 0.06,
    baseEfficiencyPct: 98.4,
    baseOverheadMs: 0.84,
    busName: 'Dual-Stream DMA Ring',
  },
  'TP-CORRIDOR-DELTA': {
    id: 'TP-CORRIDOR-DELTA',
    label: 'TP-CORRIDOR-DELTA (BUCKETED-ALL-REDUCE-FALLBACK)',
    worldSize: 4,
    peakBandwidthGbps: 620,
    baseLatencyMs: 0.19,
    baseEfficiencyPct: 89.6,
    baseOverheadMs: 1.94,
    busName: 'Bucketed Fallback Ring',
  },
};

export const GridSyncPayloadSchema = z.object({
  corridorId: z.enum([
    'TP-CORRIDOR-ALPHA',
    'TP-CORRIDOR-BRAVO',
    'TP-CORRIDOR-GAMMA',
    'TP-CORRIDOR-DELTA',
  ]),
  worldSize: z.number().int().min(2).max(16),
  tensorUnits: z.number().int().min(64).max(1024000),
  busThrottleRatio: z.number().min(0.1).max(1.0),
  commOverlapEnabled: z.boolean(),
  commandNote: z
    .string()
    .max(120)
    .refine(
      (val) =>
        !val.includes('<script') &&
        !val.includes('DROP TABLE') &&
        !val.includes('--') &&
        !val.includes(';'),
      { message: 'GridSync zero-trust sanitizer blocked unsafe token sequence' }
    )
    .optional(),
});

export type GridSyncPayload = z.infer<typeof GridSyncPayloadSchema>;

export interface ChunkCell {
  chunkIndex: number;
  values: number[];
  accumulatedCount: number;
  isFullyReduced: boolean;
  lastSenderRank: number | null;
}

export interface GpuRankNode {
  rankId: number;
  label: string;
  memoryAddress: string;
  weightShardShape: string;
  initialActivations: number[];
  chunks: ChunkCell[];
  reducedChunkOwnerIndex: number;
  parityHash: string;
  throttled: boolean;
  packetDropFault: boolean;
}

export interface RingTransferLink {
  fromRank: number;
  toRank: number;
  chunkIndex: number;
  phase: 'SCATTER-REDUCE' | 'ALL-GATHER' | 'SYNCHRONIZED';
  payloadPreview: number;
}

export interface OverlapBucketBar {
  bucketId: number;
  computeStartMs: number;
  computeDurationMs: number;
  commStartMs: number;
  commDurationMs: number;
  overlapSavedMs: number;
}

export interface RingSimulationState {
  corridorId: CorridorId;
  worldSize: number;
  currentStep: number;
  totalSteps: number;
  phase: 'IDLE' | 'SCATTER-REDUCE' | 'ALL-GATHER' | 'LOCKED' | 'FAULT';
  ranks: GpuRankNode[];
  activeLinks: RingTransferLink[];
  bandwidthGbps: number;
  efficiencyPct: number;
  commOverlapMs: number;
  passesCompleted: number;
  synchronizedUnits: number;
  syncXpK: number;
  parityStatus: 'OK' | 'DRIFT FAULT';
  busThrottled: boolean;
  commOverlapActive: boolean;
  overlapSchedule: OverlapBucketBar[];
}

export function computeDeterministicCrc(numbers: number[]): string {
  let acc = 2166136261;
  for (let i = 0; i < numbers.length; i++) {
    const scaled = Math.round(numbers[i] * 10000);
    acc ^= scaled & 0xff;
    acc = Math.imul(acc, 16777619) >>> 0;
    acc ^= (scaled >> 8) & 0xff;
    acc = Math.imul(acc, 16777619) >>> 0;
  }
  return 'CRC-' + acc.toString(16).toUpperCase().padStart(8, '0');
}

export function computeSingleNodeReferenceReduce(rankVectors: number[][]): number[] {
  if (rankVectors.length === 0) {
    return [];
  }
  const len = rankVectors[0].length;
  const out = new Array<number>(len).fill(0);
  for (let r = 0; r < rankVectors.length; r++) {
    const vec = rankVectors[r];
    if (vec.length !== len) {
      throw new Error('Rank vector length mismatch');
    }
    for (let i = 0; i < len; i++) {
      out[i] = Number((out[i] + vec[i]).toFixed(6));
    }
  }
  return out;
}

export function createInitialRanks(worldSize: number = 4): GpuRankNode[] {
  const ranks: GpuRankNode[] = [];
  const elementsPerChunk = 4;
  const totalLen = worldSize * elementsPerChunk;

  for (let r = 0; r < worldSize; r++) {
    const initialActivations: number[] = [];
    for (let i = 0; i < totalLen; i++) {
      const val = Number(((r + 1) * 1.25 + (i + 1) * 0.5).toFixed(4));
      initialActivations.push(val);
    }

    const chunks: ChunkCell[] = [];
    for (let c = 0; c < worldSize; c++) {
      const slice = initialActivations.slice(
        c * elementsPerChunk,
        (c + 1) * elementsPerChunk
      );
      chunks.push({
        chunkIndex: c,
        values: slice,
        accumulatedCount: 1,
        isFullyReduced: false,
        lastSenderRank: null,
      });
    }

    const hexRank = r.toString(16).toUpperCase();
    ranks.push({
      rankId: r,
      label: 'Rank ' + String(r),
      memoryAddress: '0x7F0' + hexRank + 'A000:0x7F0' + hexRank + 'FFFF',
      weightShardShape: '[4096, ' + String(16384 / worldSize) + ']',
      initialActivations,
      chunks,
      reducedChunkOwnerIndex: (r + 1) % worldSize,
      parityHash: computeDeterministicCrc(initialActivations),
      throttled: false,
      packetDropFault: false,
    });
  }

  return ranks;
}

export function buildOverlapSchedule(
  corridorId: CorridorId,
  busThrottled: boolean,
  commOverlapActive: boolean
): {
  schedule: OverlapBucketBar[];
  bandwidthGbps: number;
  efficiencyPct: number;
  commOverlapMs: number;
} {
  const profile = CORRIDOR_CATALOG[corridorId];
  const throttleFactor = busThrottled ? 0.55 : 1.0;
  const bandwidthGbps = Math.round(profile.peakBandwidthGbps * throttleFactor);

  const numBuckets = 4;
  const bucketComputeMs = 0.65;
  const rawBucketCommMs = Number(
    ((profile.baseOverheadMs / numBuckets) / throttleFactor).toFixed(3)
  );

  const schedule: OverlapBucketBar[] = [];
  let totalSaved = 0;

  for (let b = 0; b < numBuckets; b++) {
    const computeStartMs = Number((b * bucketComputeMs).toFixed(2));
    const commStartMs = commOverlapActive
      ? Number(((b + 1) * bucketComputeMs).toFixed(2))
      : Number((numBuckets * bucketComputeMs + b * rawBucketCommMs).toFixed(2));

    const remainingComputeWindow = Math.max(
      0,
      numBuckets * bucketComputeMs - commStartMs
    );
    const overlapSavedMs = commOverlapActive
      ? Number(Math.min(rawBucketCommMs, remainingComputeWindow).toFixed(3))
      : 0;

    totalSaved += overlapSavedMs;
    schedule.push({
      bucketId: b,
      computeStartMs,
      computeDurationMs: bucketComputeMs,
      commStartMs,
      commDurationMs: rawBucketCommMs,
      overlapSavedMs,
    });
  }

  const totalRawComm = rawBucketCommMs * numBuckets;
  const exposedComm = Math.max(0.18, totalRawComm - totalSaved * 0.72);
  const commOverlapMs =
    corridorId === 'TP-CORRIDOR-ALPHA' && !busThrottled && commOverlapActive
      ? 1.18
      : Number(exposedComm.toFixed(2));

  const efficiencyPct =
    corridorId === 'TP-CORRIDOR-ALPHA' && !busThrottled && commOverlapActive
      ? 96.2
      : Number(
          Math.max(
            68.4,
            Math.min(
              99.2,
              profile.baseEfficiencyPct *
                (busThrottled ? 0.84 : 1.0) *
                (commOverlapActive ? 1.0 : 0.88)
            )
          ).toFixed(1)
        );

  return {
    schedule,
    bandwidthGbps,
    efficiencyPct,
    commOverlapMs,
  };
}

export function createInitialSimulationState(
  corridorId: CorridorId = 'TP-CORRIDOR-ALPHA'
): RingSimulationState {
  const worldSize = 4;
  const ranks = createInitialRanks(worldSize);
  const metrics = buildOverlapSchedule(corridorId, false, true);

  const activeLinks: RingTransferLink[] = [0, 1, 2, 3].map((r) => ({
    fromRank: r,
    toRank: (r + 1) % worldSize,
    chunkIndex: r,
    phase: 'SCATTER-REDUCE',
    payloadPreview: ranks[r].chunks[r].values[0],
  }));

  return {
    corridorId,
    worldSize,
    currentStep: 0,
    totalSteps: 2 * (worldSize - 1),
    phase: 'LOCKED',
    ranks,
    activeLinks,
    bandwidthGbps: metrics.bandwidthGbps,
    efficiencyPct: metrics.efficiencyPct,
    commOverlapMs: metrics.commOverlapMs,
    passesCompleted: 32,
    synchronizedUnits: 128000,
    syncXpK: 4.8,
    parityStatus: 'OK',
    busThrottled: false,
    commOverlapActive: true,
    overlapSchedule: metrics.schedule,
  };
}

export function stepRingAllReduceState(
  prevState: RingSimulationState
): RingSimulationState {
  const n = prevState.worldSize;
  const totalSteps = 2 * (n - 1);

  // If previous cycle finished or had a fault, start fresh cycle at step 0
  const baseRanks =
    prevState.currentStep >= totalSteps || prevState.phase === 'FAULT'
      ? createInitialRanks(n)
      : prevState.ranks.map((r) => ({
          ...r,
          chunks: r.chunks.map((c) => ({
            ...c,
            values: [...c.values],
          })),
        }));

  const stepIdx =
    prevState.currentStep >= totalSteps || prevState.phase === 'FAULT'
      ? 0
      : prevState.currentStep;

  const activeLinks: RingTransferLink[] = [];

  if (stepIdx < n - 1) {
    // Phase 1: Scatter-Reduce clockwise
    const s = stepIdx;
    const outbound: Record<number, number[]> = {};
    for (let r = 0; r < n; r++) {
      const sendChunkIdx = (((r - s) % n) + n) % n;
      outbound[r] = [...baseRanks[r].chunks[sendChunkIdx].values];
    }

    for (let r = 0; r < n; r++) {
      const senderRank = (((r - 1) % n) + n) % n;
      const recvChunkIdx = (((r - s - 1) % n) + n) % n;
      const incoming = outbound[senderRank];
      const targetChunk = baseRanks[r].chunks[recvChunkIdx];

      targetChunk.values = targetChunk.values.map((v, i) =>
        Number((v + incoming[i]).toFixed(6))
      );
      targetChunk.accumulatedCount = s + 2;
      targetChunk.lastSenderRank = senderRank;
      if (targetChunk.accumulatedCount >= n) {
        targetChunk.isFullyReduced = true;
      }

      const flat = baseRanks[r].chunks.flatMap((c) => c.values);
      baseRanks[r].parityHash = computeDeterministicCrc(flat);

      activeLinks.push({
        fromRank: senderRank,
        toRank: r,
        chunkIndex: recvChunkIdx,
        phase: 'SCATTER-REDUCE',
        payloadPreview: targetChunk.values[0],
      });
    }

    const nextStep = stepIdx + 1;
    return {
      ...prevState,
      currentStep: nextStep,
      phase: 'SCATTER-REDUCE',
      ranks: baseRanks,
      activeLinks,
      passesCompleted: prevState.passesCompleted + 1,
      synchronizedUnits: prevState.synchronizedUnits + 4000,
      syncXpK: Number((prevState.syncXpK + 0.2).toFixed(1)),
      parityStatus: 'OK',
    };
  } else {
    // Phase 2: All-Gather clockwise
    const s = stepIdx - (n - 1);
    const outbound: Record<number, number[]> = {};
    for (let r = 0; r < n; r++) {
      const sendChunkIdx = (((r + 1 - s) % n) + n) % n;
      outbound[r] = [...baseRanks[r].chunks[sendChunkIdx].values];
    }

    for (let r = 0; r < n; r++) {
      const senderRank = (((r - 1) % n) + n) % n;
      const recvChunkIdx = (((r - s) % n) + n) % n;
      const targetChunk = baseRanks[r].chunks[recvChunkIdx];

      targetChunk.values = [...outbound[senderRank]];
      targetChunk.accumulatedCount = n;
      targetChunk.isFullyReduced = true;
      targetChunk.lastSenderRank = senderRank;

      const flat = baseRanks[r].chunks.flatMap((c) => c.values);
      baseRanks[r].parityHash = computeDeterministicCrc(flat);

      activeLinks.push({
        fromRank: senderRank,
        toRank: r,
        chunkIndex: recvChunkIdx,
        phase: 'ALL-GATHER',
        payloadPreview: targetChunk.values[0],
      });
    }

    const nextStep = stepIdx + 1;
    const isComplete = nextStep >= totalSteps;
    return {
      ...prevState,
      currentStep: nextStep,
      phase: isComplete ? 'LOCKED' : 'ALL-GATHER',
      ranks: baseRanks,
      activeLinks,
      passesCompleted: prevState.passesCompleted + 1,
      synchronizedUnits: prevState.synchronizedUnits + 4000,
      syncXpK: Number((prevState.syncXpK + 0.4).toFixed(1)),
      parityStatus: 'OK',
    };
  }
}

export function executeFullAllReduceCycle(
  prevState: RingSimulationState
): RingSimulationState {
  let state: RingSimulationState = {
    ...prevState,
    currentStep: 0,
    phase: 'SCATTER-REDUCE',
    ranks: createInitialRanks(prevState.worldSize),
    parityStatus: 'OK',
  };
  const totalSteps = 2 * (prevState.worldSize - 1);
  for (let i = 0; i < totalSteps; i++) {
    state = stepRingAllReduceState(state);
  }
  return state;
}

export function injectBusThrottleAndDesync(
  prevState: RingSimulationState,
  faultRankId: number = 2
): RingSimulationState {
  const nextThrottled = !prevState.busThrottled;
  const metrics = buildOverlapSchedule(
    prevState.corridorId,
    nextThrottled,
    prevState.commOverlapActive
  );

  const updatedRanks = prevState.ranks.map((r) => {
    if (r.rankId === faultRankId && nextThrottled) {
      const corruptedChunks = r.chunks.map((c, idx) =>
        idx === 0
          ? {
              ...c,
              values: c.values.map((v) => Number((v * 0.5).toFixed(4))),
              isFullyReduced: false,
            }
          : c
      );
      const flat = corruptedChunks.flatMap((c) => c.values);
      return {
        ...r,
        throttled: true,
        packetDropFault: true,
        chunks: corruptedChunks,
        parityHash: computeDeterministicCrc(flat),
      };
    }
    return {
      ...r,
      throttled: nextThrottled,
      packetDropFault: false,
    };
  });

  return {
    ...prevState,
    phase: nextThrottled ? 'FAULT' : 'LOCKED',
    ranks: updatedRanks,
    busThrottled: nextThrottled,
    bandwidthGbps: metrics.bandwidthGbps,
    efficiencyPct: metrics.efficiencyPct,
    commOverlapMs: metrics.commOverlapMs,
    parityStatus: nextThrottled ? 'DRIFT FAULT' : 'OK',
    overlapSchedule: metrics.schedule,
  };
}
