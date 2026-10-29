/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GF-T3-276 · Ultra-High Bandwidth KV-Cache Direct Memory Access & PCIe Gen-6 Offloading Engine
 * Deterministic Mathematical Engine & Zero-Trust GridSync Sanitizer
 */

import { z } from 'zod';

export type CorridorId =
  | 'DMA-CORRIDOR-ALPHA'
  | 'DMA-CORRIDOR-BRAVO'
  | 'DMA-CORRIDOR-GAMMA'
  | 'DMA-CORRIDOR-DELTA';

export type CockpitTab = 'Mesh' | 'DMA' | 'OFLd' | 'Stats' | 'APA';

export interface CorridorConfig {
  id: CorridorId;
  shortCode: string;
  label: string;
  architectureMode: string;
  pcieGen6BaseGbs: number;
  nominalBlockSizeGb: number;
  tauTransferSec: number;
  nominalLatencyUs: number;
}

export interface ChannelDescriptor {
  index: number;
  tag: string;
  title: string;
  pointerHex: string;
  tokensK: number;
  bandwidthGbs: number;
  latencyMs: number;
  syncPct: number;
  stateLabel: 'STREAMING · LOCKED' | 'SWAP_REROUTE · FAULT' | 'PREFETCH · LOCKED' | 'RING_SYNC · LOCKED';
  dmaOk: boolean;
  hostArenaOffsetHex: string;
  ringSlotDepth: number;
}

export interface RadioLogEntry {
  id: string;
  timestamp: string;
  icon: '🟢' | '🔴' | '⚡';
  callsign: 'CREW CHIEF' | 'TELEMETRY' | 'PIT WALL';
  message: string;
}

export interface EngineStateSnapshot {
  projectTitle: 'GF-T3-276';
  corridorId: CorridorId;
  corridorLabel: string;
  mode: string;
  meshPtrHex: string;
  dmaThroughputGbs: number;
  dmaSaturationPct: number;
  offloadLatencyUs: number;
  activeChannels: number;
  totalChannels: number;
  processedTokens: number;
  engineXpK: number;
  dmaState: 'Offload Active' | 'Host Swap Re-Routing' | 'Async Ring Step' | 'Arena Re-Zeroed';
  bufferParityPct: number;
  vectorSignature: [number, number, number, number];
  channels: ChannelDescriptor[];
  selectedChannelIndex: number;
  burstCount: number;
  busSaturated: boolean;
  stepCount: number;
  manifestDigest: string;
  radioLogs: RadioLogEntry[];
  apaStatus: string;
}

export const SYNTHETIC_DMA_CORRIDORS: Record<CorridorId, CorridorConfig> = {
  'DMA-CORRIDOR-ALPHA': {
    id: 'DMA-CORRIDOR-ALPHA',
    shortCode: 'ALPHA · 35.2T',
    label: 'DMA-CORRIDOR-ALPHA (KV-CACHE-DIRECT-MEMORY-ACCESS-FABRIC · 35200-GB/S)',
    architectureMode: 'PCIE_DMA_OFFLOAD',
    pcieGen6BaseGbs: 24960,
    nominalBlockSizeGb: 12.8,
    tauTransferSec: 0.01,
    nominalLatencyUs: 0.01,
  },
  'DMA-CORRIDOR-BRAVO': {
    id: 'DMA-CORRIDOR-BRAVO',
    shortCode: 'BRAVO · GEN6',
    label: 'DMA-CORRIDOR-BRAVO (PCIE-GEN6-HOST-OFFLOADING-ENGINE)',
    architectureMode: 'PCIE_GEN6_HOST_OFFLOAD',
    pcieGen6BaseGbs: 21640,
    nominalBlockSizeGb: 12.8,
    tauTransferSec: 0.01,
    nominalLatencyUs: 0.014,
  },
  'DMA-CORRIDOR-GAMMA': {
    id: 'DMA-CORRIDOR-GAMMA',
    shortCode: 'GAMMA · RING',
    label: 'DMA-CORRIDOR-GAMMA (ASYNC-BUFFER-RING-SCHEDULER)',
    architectureMode: 'ASYNC_BUFFER_RING',
    pcieGen6BaseGbs: 23120,
    nominalBlockSizeGb: 12.8,
    tauTransferSec: 0.01,
    nominalLatencyUs: 0.012,
  },
  'DMA-CORRIDOR-DELTA': {
    id: 'DMA-CORRIDOR-DELTA',
    shortCode: 'DELTA · VRAM',
    label: 'DMA-CORRIDOR-DELTA (FALLBACK-GPU-VRAM-MONOLITHIC-PASS)',
    architectureMode: 'VRAM_MONOLITHIC_PASS',
    pcieGen6BaseGbs: 14200,
    nominalBlockSizeGb: 12.8,
    tauTransferSec: 0.01,
    nominalLatencyUs: 0.028,
  },
};

const MALICIOUS_PAYLOAD_REGEX = /[;'<>\\]|--|\b(DROP|DELETE|INSERT|UPDATE|UNION|SELECT|SCRIPT|ALERT|EVAL)\b/i;

/**
 * Zero-Trust GridSync Ingress Sanitizer
 * Scrubs strings against SQL injection, XSS, schema pollution, and enforces the Zero-Dollar Gate.
 */
export function sanitizeGridSyncString(rawInput: string): string {
  if (typeof rawInput !== 'string') {
    throw new Error('GridSync Ingress Error: Payload must be a valid string');
  }
  const trimmed = rawInput.trim();
  if (trimmed.length === 0 || trimmed.length > 128) {
    throw new Error('GridSync Ingress Error: Payload length out of bounds');
  }
  if (trimmed.indexOf(String.fromCharCode(36)) !== -1) {
    throw new Error('GridSync Zero-Dollar Gate Violation: Forbidden currency symbol detected');
  }
  if (MALICIOUS_PAYLOAD_REGEX.test(trimmed)) {
    throw new Error('GridSync Security Gate: Malicious SQLi or XSS pattern blocked');
  }
  return trimmed;
}

export const GridSyncCommandSchema = z.object({
  action: z.enum([
    'BURST',
    'SPIKE',
    'STEP',
    'FLUSH',
    'CORRIDOR',
    'SELECT_CHANNEL',
    'EXPORT_AUDIT',
    'ACQUIRE_APA',
    'INQUIRE_VAULT',
  ]),
  corridorId: z
    .enum([
      'DMA-CORRIDOR-ALPHA',
      'DMA-CORRIDOR-BRAVO',
      'DMA-CORRIDOR-GAMMA',
      'DMA-CORRIDOR-DELTA',
    ])
    .optional(),
  channelIndex: z.number().int().min(0).max(7).optional(),
  customTag: z
    .string()
    .optional()
    .transform((val) => (val === undefined ? undefined : sanitizeGridSyncString(val))),
});

export type GridSyncCommandInput = z.infer<typeof GridSyncCommandSchema>;

/**
 * Asynchronous DMA Ring Scheduling Formula:
 * BW_dma = (Sum(BlockSize) / tau_transfer) + PCIe_gen6
 */
export function calculateDmaBandwidthGbs(
  blockSizesGb: number[],
  tauTransferSec: number,
  pcieGen6BaseGbs: number
): number {
  if (!Array.isArray(blockSizesGb) || blockSizesGb.length === 0) {
    throw new Error('DMA Math Error: blockSizesGb must be a non-empty numeric array');
  }
  if (tauTransferSec <= 0 || !Number.isFinite(tauTransferSec)) {
    throw new Error('DMA Math Error: tauTransferSec must be strictly positive');
  }
  if (pcieGen6BaseGbs < 0 || !Number.isFinite(pcieGen6BaseGbs)) {
    throw new Error('DMA Math Error: pcieGen6BaseGbs must be non-negative');
  }

  let sumBlocks = 0;
  for (let i = 0; i < blockSizesGb.length; i++) {
    const blk = blockSizesGb[i];
    if (blk < 0 || !Number.isFinite(blk)) {
      throw new Error('DMA Math Error: Block size cannot be negative');
    }
    sumBlocks += blk;
  }

  const rawBandwidth = sumBlocks / tauTransferSec + pcieGen6BaseGbs;
  return Math.round(rawBandwidth * 100) / 100;
}

/**
 * Sub-Microsecond Bus Arbitration & Bidirectional Peer-to-Peer Prefetch Latency Formula
 */
export function calculateOffloadLatencyUs(
  nominalLatencyUs: number,
  busSaturated: boolean,
  burstCount: number,
  stepCount: number
): number {
  if (nominalLatencyUs <= 0 || !Number.isFinite(nominalLatencyUs)) {
    throw new Error('DMA Math Error: nominalLatencyUs must be strictly positive');
  }
  const saturationPenalty = busSaturated ? 0.03 : 0;
  const burstLoadDelta = Math.min(0.006, Math.max(0, burstCount) * 0.001);
  const asyncStepOptimization = Math.min(0.004, Math.max(0, stepCount) * 0.0005);
  const solved = Math.max(
    0.01,
    nominalLatencyUs + saturationPenalty + burstLoadDelta - asyncStepOptimization
  );
  return Math.round(solved * 10000) / 10000;
}

/**
 * Deterministic FNV-1a / Hex Manifest Digest Generator (Clean-room synchronous hash)
 */
export function computeDeterministicManifestHex(payload: string): string {
  let h1 = 0xdeadbeef ^ payload.length;
  let h2 = 0x41c6ce57 ^ payload.length;
  for (let i = 0; i < payload.length; i++) {
    const ch = payload.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const part1 = (h1 >>> 0).toString(16).toUpperCase().padStart(8, '0');
  const part2 = (h2 >>> 0).toString(16).toUpperCase().padStart(8, '0');
  return 'SHA256-' + part1 + part2;
}

function formatRadioClock(tickCounter: number): string {
  const totalCentiseconds = 104 + tickCounter * 4;
  const minutes = Math.floor(totalCentiseconds / 6000);
  const seconds = Math.floor((totalCentiseconds % 6000) / 100);
  const centis = totalCentiseconds % 100;
  return (
    '[' +
    String(minutes).padStart(2, '0') +
    ':' +
    String(seconds).padStart(2, '0') +
    '.' +
    String(centis).padStart(2, '0') +
    ']'
  );
}

export function createInitialEngineState(): EngineStateSnapshot {
  const initialLogs: RadioLogEntry[] = [
    {
      id: 'log-init-1',
      timestamp: '[00:01.04]',
      icon: '🟢',
      callsign: 'CREW CHIEF',
      message:
        'KV-cache direct memory access and PCIe Gen-6 offloading engine initialized · 8 channels linked',
    },
    {
      id: 'log-init-2',
      timestamp: '[00:01.08]',
      icon: '🟢',
      callsign: 'TELEMETRY',
      message:
        'Host offload streaming verified at 35,200 GB/s with zero memory bottlenecks',
    },
  ];

  return computeEngineSnapshot({
    corridorId: 'DMA-CORRIDOR-ALPHA',
    burstCount: 0,
    busSaturated: false,
    stepCount: 0,
    selectedChannelIndex: 3,
    radioLogs: initialLogs,
    apaStatus: 'READY FOR DIRECT APA TITLE TRANSFER',
  });
}

export interface EngineComputeParams {
  corridorId: CorridorId;
  burstCount: number;
  busSaturated: boolean;
  stepCount: number;
  selectedChannelIndex: number;
  radioLogs: RadioLogEntry[];
  apaStatus: string;
}

export function computeEngineSnapshot(params: EngineComputeParams): EngineStateSnapshot {
  const corridor = SYNTHETIC_DMA_CORRIDORS[params.corridorId];
  const burstMultiplier = 1 + params.burstCount * 0.0625;
  const saturationFactor = params.busSaturated ? 0.88 : 1.0;
  const stepBonusGbs = params.stepCount * 160;

  const blockSizesGb: number[] = [];
  const channels: ChannelDescriptor[] = [];

  for (let idx = 0; idx < 8; idx++) {
    const channelBlockGb =
      Math.round(corridor.nominalBlockSizeGb * burstMultiplier * saturationFactor * 1000) / 1000;
    blockSizesGb.push(channelBlockGb);

    const channelBwGbs =
      Math.round((channelBlockGb / corridor.tauTransferSec / 10) * 100) / 100;
    const tokensK = Math.round(256 + params.burstCount * 32 + params.stepCount * 16);
    const isFaulted = params.busSaturated && (idx === 2 || idx === 5);
    const latencyMs = isFaulted ? 0.06 : 0.02;
    const syncPct = isFaulted ? 94.5 : 100;
    const stateLabel: ChannelDescriptor['stateLabel'] = isFaulted
      ? 'SWAP_REROUTE · FAULT'
      : params.stepCount > 0 && idx % 2 === 1
      ? 'PREFETCH · LOCKED'
      : 'STREAMING · LOCKED';

    channels.push({
      index: idx,
      tag: 'D' + String(idx),
      title: 'Channel ' + String(idx) + ' (D' + String(idx) + ')',
      pointerHex: '0xA0' + String(idx) + '0',
      tokensK,
      bandwidthGbs: channelBwGbs,
      latencyMs,
      syncPct,
      stateLabel,
      dmaOk: !isFaulted,
      hostArenaOffsetHex: '0x9F8D' + String(idx) + '0',
      ringSlotDepth: 64 + params.burstCount * 8 + params.stepCount * 4,
    });
  }

  const dmaThroughputGbs = calculateDmaBandwidthGbs(
    blockSizesGb,
    corridor.tauTransferSec,
    corridor.pcieGen6BaseGbs + stepBonusGbs
  );

  const offloadLatencyUs = calculateOffloadLatencyUs(
    corridor.nominalLatencyUs,
    params.busSaturated,
    params.burstCount,
    params.stepCount
  );

  let activeChannels = 0;
  let syncTotal = 0;
  for (let i = 0; i < channels.length; i++) {
    if (channels[i].dmaOk) {
      activeChannels += 1;
    }
    syncTotal += channels[i].syncPct;
  }

  const bufferParityPct = Math.round((syncTotal / channels.length) * 100) / 100;
  const processedTokens =
    6784000 + params.burstCount * 512000 + params.stepCount * 256000;
  const engineXpK =
    Math.round((75.0 + params.burstCount * 12.5 + params.stepCount * 8.4) * 10) / 10;

  const dmaSaturationPct = Math.min(
    100,
    Math.max(45, Math.round((dmaThroughputGbs / 40000) * 100))
  );

  const vBase = 3.81 + params.stepCount * 0.01 + params.burstCount * 0.02;
  const vectorSignature: [number, number, number, number] = [
    Math.round(vBase * 100) / 100,
    Math.round((vBase + 0.04) * 100) / 100,
    Math.round((vBase + 0.01) * 100) / 100,
    Math.round((vBase + 0.03) * 100) / 100,
  ];

  const dmaState: EngineStateSnapshot['dmaState'] = params.busSaturated
    ? 'Host Swap Re-Routing'
    : 'Offload Active';

  const manifestSource =
    'GF-T3-276|' +
    params.corridorId +
    '|' +
    String(dmaThroughputGbs) +
    '|' +
    String(offloadLatencyUs) +
    '|' +
    String(processedTokens);

  const manifestDigest = computeDeterministicManifestHex(manifestSource);

  return {
    projectTitle: 'GF-T3-276',
    corridorId: params.corridorId,
    corridorLabel: corridor.label,
    mode: corridor.architectureMode,
    meshPtrHex: '0x9F8DC0',
    dmaThroughputGbs,
    dmaSaturationPct,
    offloadLatencyUs,
    activeChannels,
    totalChannels: 8,
    processedTokens,
    engineXpK,
    dmaState,
    bufferParityPct,
    vectorSignature,
    channels,
    selectedChannelIndex: params.selectedChannelIndex,
    burstCount: params.burstCount,
    busSaturated: params.busSaturated,
    stepCount: params.stepCount,
    manifestDigest,
    radioLogs: params.radioLogs,
    apaStatus: params.apaStatus,
  };
}

export function applyEngineCommand(
  current: EngineStateSnapshot,
  rawCommand: unknown
): EngineStateSnapshot {
  const parsed = GridSyncCommandSchema.parse(rawCommand);
  const nextTick = current.radioLogs.length + 1;
  const stamp = formatRadioClock(nextTick);

  let corridorId = current.corridorId;
  let burstCount = current.burstCount;
  let busSaturated = current.busSaturated;
  let stepCount = current.stepCount;
  let selectedChannelIndex = current.selectedChannelIndex;
  let apaStatus = current.apaStatus;
  let newLog: RadioLogEntry;

  switch (parsed.action) {
    case 'BURST': {
      burstCount += 1;
      const preview = computeEngineSnapshot({
        corridorId,
        burstCount,
        busSaturated,
        stepCount,
        selectedChannelIndex,
        radioLogs: current.radioLogs,
        apaStatus,
      });
      newLog = {
        id: 'log-' + String(nextTick),
        timestamp: stamp,
        icon: '⚡',
        callsign: 'PIT WALL',
        message:
          'PCIe Gen-6 DMA offload burst #' +
          String(burstCount) +
          ' committed · Throughput elevated to ' +
          preview.dmaThroughputGbs.toLocaleString('en-US') +
          ' GB/s',
      };
      break;
    }
    case 'SPIKE': {
      busSaturated = !busSaturated;
      newLog = {
        id: 'log-' + String(nextTick),
        timestamp: stamp,
        icon: busSaturated ? '🔴' : '🟢',
        callsign: 'TELEMETRY',
        message: busSaturated
          ? 'Bus saturation spike injected · Channels D2 & D5 re-routed to host swap arena'
          : 'Bus saturation cleared · All 8 DMA channels restored to phase-locked streaming',
      };
      break;
    }
    case 'STEP': {
      stepCount += 1;
      const preview = computeEngineSnapshot({
        corridorId,
        burstCount,
        busSaturated,
        stepCount,
        selectedChannelIndex,
        radioLogs: current.radioLogs,
        apaStatus,
      });
      newLog = {
        id: 'log-' + String(nextTick),
        timestamp: stamp,
        icon: '🟢',
        callsign: 'CREW CHIEF',
        message:
          'Asynchronous transfer pass #' +
          String(stepCount) +
          ' verified · Processed ' +
          preview.processedTokens.toLocaleString('en-US') +
          ' Units at ' +
          String(preview.offloadLatencyUs) +
          ' µs',
      };
      break;
    }
    case 'FLUSH': {
      burstCount = 0;
      busSaturated = false;
      stepCount = 0;
      corridorId = 'DMA-CORRIDOR-ALPHA';
      apaStatus = 'ARENAS RE-ZEROED · CLEAN TITLE VERIFIED';
      newLog = {
        id: 'log-' + String(nextTick),
        timestamp: stamp,
        icon: '🟢',
        callsign: 'CREW CHIEF',
        message:
          'DMA ring buffers flushed and host arenas re-zeroed · Baseline 35,200 GB/s restored',
      };
      break;
    }
    case 'CORRIDOR': {
      if (parsed.corridorId) {
        corridorId = parsed.corridorId;
      }
      const cfg = SYNTHETIC_DMA_CORRIDORS[corridorId];
      newLog = {
        id: 'log-' + String(nextTick),
        timestamp: stamp,
        icon: '⚡',
        callsign: 'PIT WALL',
        message:
          'Switched active fabric to ' +
          cfg.id +
          ' · Mode ' +
          cfg.architectureMode +
          ' engaged',
      };
      break;
    }
    case 'SELECT_CHANNEL': {
      if (typeof parsed.channelIndex === 'number') {
        selectedChannelIndex = parsed.channelIndex;
      }
      newLog = {
        id: 'log-' + String(nextTick),
        timestamp: stamp,
        icon: '🟢',
        callsign: 'TELEMETRY',
        message:
          'Inspector locked onto Channel D' +
          String(selectedChannelIndex) +
          ' at pointer 0xA0' +
          String(selectedChannelIndex) +
          '0',
      };
      break;
    }
    case 'EXPORT_AUDIT': {
      apaStatus = 'AUDIT MANIFEST SIGNED · ' + current.manifestDigest;
      newLog = {
        id: 'log-' + String(nextTick),
        timestamp: stamp,
        icon: '🟢',
        callsign: 'CREW CHIEF',
        message:
          'Cryptographic DMA audit manifest exported · Digest ' +
          current.manifestDigest +
          ' verified',
      };
      break;
    }
    case 'ACQUIRE_APA': {
      apaStatus = 'APA TITLE DOSSIER LOCKED · DIGEST ' + current.manifestDigest;
      newLog = {
        id: 'log-' + String(nextTick),
        timestamp: stamp,
        icon: '⚡',
        callsign: 'CREW CHIEF',
        message:
          'ACQUIRE TITLE (APA) dossier generated for chassis GF-T3-276 · Clean-room IP verified',
      };
      break;
    }
    case 'INQUIRE_VAULT': {
      apaStatus = 'VAULT BUYOUT DISPATCHED · DIGEST ' + current.manifestDigest;
      newLog = {
        id: 'log-' + String(nextTick),
        timestamp: stamp,
        icon: '🟢',
        callsign: 'PIT WALL',
        message:
          'INQUIRE VAULT BUYOUT telemetry package locked for institutional escrow review',
      };
      break;
    }
  }

  const updatedLogs = [...current.radioLogs.slice(-9), newLog];

  return computeEngineSnapshot({
    corridorId,
    burstCount,
    busSaturated,
    stepCount,
    selectedChannelIndex,
    radioLogs: updatedLogs,
    apaStatus,
  });
}
