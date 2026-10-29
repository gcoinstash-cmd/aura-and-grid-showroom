/**
 * GF-T3-240: Zero-Copy NCCL Point-to-Point Ring Stream & GPUDirect P2P Engine
 * Clean-Room Mathematical Simulation, GridSync Zero-Trust Ingress & Supabase RLS Export
 * SPDX-License-Identifier: MIT
 */

import { z } from 'zod';

export enum SyntheticCorridor {
  ALPHA = 'NCCL-CORRIDOR-ALPHA (ZERO-COPY-GPUDIRECT-RING · 5600-GB/S)',
  BRAVO = 'NCCL-CORRIDOR-BRAVO (ASYNC-CUDA-EVENT-STREAM-SYNC)',
  GAMMA = 'NCCL-CORRIDOR-GAMMA (PEER-TO-PEER-MEMORY-STAGING)',
  DELTA = 'NCCL-CORRIDOR-DELTA (FALLBACK-HOST-BUFFER-COPY)',
}

export const SYNTHETIC_CORRIDORS: readonly SyntheticCorridor[] = [
  SyntheticCorridor.ALPHA,
  SyntheticCorridor.BRAVO,
  SyntheticCorridor.GAMMA,
  SyntheticCorridor.DELTA,
];

export interface CorridorPhysics {
  readonly code: SyntheticCorridor;
  readonly shortTag: string;
  readonly peakBandwidthGbs: number;
  readonly baseLatencyUs: number;
  readonly protocolOverhead: number;
  readonly cpuStagingFactor: number;
  readonly nvlinkBridges: number;
  readonly pcieGen: string;
}

export const CORRIDOR_PHYSICS_MAP: Record<SyntheticCorridor, CorridorPhysics> = {
  [SyntheticCorridor.ALPHA]: {
    code: SyntheticCorridor.ALPHA,
    shortTag: 'ALPHA · 5600 GB/S RING',
    peakBandwidthGbs: 5600,
    baseLatencyUs: 0.03,
    protocolOverhead: 0.0,
    cpuStagingFactor: 0.0,
    nvlinkBridges: 18,
    pcieGen: 'NVLink-5 + PCIe-Gen5 Direct',
  },
  [SyntheticCorridor.BRAVO]: {
    code: SyntheticCorridor.BRAVO,
    shortTag: 'BRAVO · ASYNC EVENT SYNC',
    peakBandwidthGbs: 5320,
    baseLatencyUs: 0.04,
    protocolOverhead: 0.02,
    cpuStagingFactor: 0.0,
    nvlinkBridges: 16,
    pcieGen: 'Async Event Descriptor Bus',
  },
  [SyntheticCorridor.GAMMA]: {
    code: SyntheticCorridor.GAMMA,
    shortTag: 'GAMMA · P2P MEM STAGING',
    peakBandwidthGbs: 4800,
    baseLatencyUs: 0.08,
    protocolOverhead: 0.05,
    cpuStagingFactor: 0.05,
    nvlinkBridges: 12,
    pcieGen: 'Peer L2 Staging Fabric',
  },
  [SyntheticCorridor.DELTA]: {
    code: SyntheticCorridor.DELTA,
    shortTag: 'DELTA · HOST BUFFER COPY',
    peakBandwidthGbs: 1420,
    baseLatencyUs: 1.85,
    protocolOverhead: 0.28,
    cpuStagingFactor: 1.0,
    nvlinkBridges: 0,
    pcieGen: 'Host Pinned QPI Fallback',
  },
};

export const RING_BAR1_BASE_ADDRESSES: readonly number[] = [
  0x7000,
  0x7200,
  0x7400,
  0x7800,
  0x7a00,
  0x7c00,
  0x7e00,
  0x8000,
];

export interface RingStreamNode {
  readonly streamId: number;
  readonly streamCode: string;
  readonly label: string;
  readonly sourceGpu: string;
  readonly peerGpu: string;
  readonly bufferSizeMb: number;
  readonly pointerHex: string;
  readonly cudaEventHandle: string;
  readonly eventState: 'EVENT_SYNC' | 'BURST_SYNC' | 'STALL_RESYNC';
  readonly lockBadge: '✓ LOCKED' | '⚡ FAULT';
  readonly transferRateGbs: number;
  readonly streamLatencyUs: number;
  readonly bufferParityPct: number;
  readonly completedPasses: number;
  readonly zeroCopyActive: boolean;
}

export interface RadioLogEntry {
  readonly id: string;
  readonly timestamp: string;
  readonly callsign: '🟢 CREW CHIEF' | '⚡ PIT WALL' | '🟢 TELEMETRY' | '🔴 TELEMETRY';
  readonly message: string;
}

export interface EngineStateSnapshot {
  readonly engineId: 'GF-T3-240';
  readonly trackBadge: 'TRACK 3';
  readonly corridor: SyntheticCorridor;
  readonly bandwidthGbs: number;
  readonly formattedBandwidth: string;
  readonly bandwidthSaturationPct: number;
  readonly streamLatencyUs: number;
  readonly formattedLatency: string;
  readonly activeStreamsCount: number;
  readonly totalStreamsCount: 8;
  readonly processedTokens: number;
  readonly formattedTokens: string;
  readonly ncclXp: number;
  readonly formattedXp: string;
  readonly ncclStateLabel: string;
  readonly bufferParityPct: number;
  readonly selectedStreamId: number;
  readonly inspectorStripText: string;
  readonly linkStallActive: boolean;
  readonly burstActive: boolean;
  readonly stepCount: number;
  readonly streams: readonly RingStreamNode[];
  readonly radioLogs: readonly RadioLogEntry[];
}

/**
 * GridSync Zero-Trust Ingress Validation Schema (Zod)
 * Scrubs inputs against SQL injection, XSS vectors, and schema pollution.
 */
const SQLI_XSS_PATTERN = /(;|--|\bDROP\b|\bDELETE\b|\bINSERT\b|\bUPDATE\b|\bUNION\b|<script|onerror=|javascript:)/i;

export const GridSyncCommandSchema = z.object({
  corridor: z.nativeEnum(SyntheticCorridor),
  commandType: z.enum([
    'INJECT_BURST',
    'TOGGLE_STALL',
    'STEP_ZERO_COPY',
    'FLUSH_QUEUES',
    'SELECT_STREAM',
    'SWITCH_CORRIDOR',
    'RUN_DIAGNOSTIC',
  ]),
  streamId: z.number().int().min(0).max(7).default(3),
  customAuditTag: z
    .string()
    .max(64)
    .refine((val) => !SQLI_XSS_PATTERN.test(val), {
      message: 'GridSync Zero-Trust Gate blocked malicious payload signature',
    })
    .optional(),
});

export type GridSyncCommandInput = z.infer<typeof GridSyncCommandSchema>;

export function validateGridSyncIngress(rawInput: unknown): {
  valid: boolean;
  data?: GridSyncCommandInput;
  error?: string;
} {
  const parsed = GridSyncCommandSchema.safeParse(rawInput);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return {
      valid: false,
      error: firstIssue ? firstIssue.message : 'GridSync validation failed',
    };
  }
  return { valid: true, data: parsed.data };
}

/**
 * Computes deterministic pre-allocated GPU BAR1 ring pointer address.
 * Eliminates runtime allocation stalls during forward/backward passes.
 */
export function computeRingPointerHex(streamId: number, stepCount: number): string {
  const safeStream = Math.min(Math.max(Math.trunc(streamId), 0), 7);
  const safeStep = Math.max(Math.trunc(stepCount), 0);
  const baseAddress = RING_BAR1_BASE_ADDRESSES[safeStream];
  const stepOffset = safeStep > 0 ? (safeStep * 16) % 0x0200 : 0;
  const finalAddress = baseAddress + stepOffset;
  return '0x' + finalAddress.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Computes aggregate GPUDirect P2P Ring Bandwidth in GB/s using deterministic
 * ring topology saturation equations.
 */
export function computeZeroCopyBandwidthGbs(
  corridor: SyntheticCorridor,
  activeStreams: number,
  bufferSizeMb: number,
  linkStallActive: boolean,
  burstActive: boolean
): number {
  if (activeStreams <= 0 || bufferSizeMb <= 0) {
    return 0;
  }
  const physics = CORRIDOR_PHYSICS_MAP[corridor];
  const clampedStreams = Math.min(Math.max(activeStreams, 0), 8);
  const streamRatio = clampedStreams / 8.0;
  const bufferEfficiency = Math.min(1.0, Math.log2(Math.max(bufferSizeMb, 2)) / 6.0);
  const protocolFactor = 1.0 - physics.protocolOverhead;
  const stallMultiplier = linkStallActive ? 0.38 : 1.0;
  const burstMultiplier = burstActive && !linkStallActive ? 1.125 : 1.0;

  const rawBandwidth =
    physics.peakBandwidthGbs *
    streamRatio *
    bufferEfficiency *
    protocolFactor *
    stallMultiplier *
    burstMultiplier;

  return Math.round(rawBandwidth * 100) / 100;
}

/**
 * Computes non-blocking CUDA Event Stream Synchronization latency in microseconds (µs).
 */
export function computeAsyncStreamLatencyUs(
  corridor: SyntheticCorridor,
  activeStreams: number,
  linkStallActive: boolean,
  burstActive: boolean
): number {
  if (activeStreams <= 0) {
    return 99.99;
  }
  const physics = CORRIDOR_PHYSICS_MAP[corridor];
  const clampedStreams = Math.min(Math.max(activeStreams, 0), 8);
  const ringHopPenalty = (8 - clampedStreams) * 0.015;
  const stallPenalty = linkStallActive ? 0.82 : 0.0;
  const stagingDelay = physics.cpuStagingFactor * 0.45;
  const burstTrim = burstActive && !linkStallActive && physics.baseLatencyUs >= 0.03 ? -0.005 : 0.0;

  const totalLatency = Math.max(
    0.01,
    physics.baseLatencyUs + ringHopPenalty + stallPenalty + stagingDelay + burstTrim
  );
  return Math.round(totalLatency * 1000) / 1000;
}

/**
 * Computes deterministic Buffer Parity percentage across the 8-stream ring.
 */
export function computeBufferParityPct(
  corridor: SyntheticCorridor,
  linkStallActive: boolean,
  burstActive: boolean
): number {
  const physics = CORRIDOR_PHYSICS_MAP[corridor];
  const baseParity = 100.0 - physics.cpuStagingFactor * 14.5;
  const stallDrop = linkStallActive ? 24.8 : 0.0;
  const burstGain = burstActive && !linkStallActive ? 0.0 : 0.0;
  return Math.round(Math.max(50.0, Math.min(100.0, baseParity - stallDrop + burstGain)) * 10) / 10;
}

export function formatNumberWithCommas(val: number): string {
  return Math.round(val).toLocaleString('en-US');
}

export function formatStopwatchTimestamp(sequenceIndex: number): string {
  const totalCentiseconds = 104 + sequenceIndex * 4;
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

export const INITIAL_RADIO_LOGS: readonly RadioLogEntry[] = [
  {
    id: 'log-0',
    timestamp: '[00:01.04]',
    callsign: '🟢 CREW CHIEF',
    message: 'Zero-copy NCCL P2P ring stream engine initialized · 8 streams linked',
  },
  {
    id: 'log-1',
    timestamp: '[00:01.08]',
    callsign: '⚡ PIT WALL',
    message: 'GPUDirect P2P memory staging active · Bandwidth verified at 5,600 GB/s',
  },
  {
    id: 'log-2',
    timestamp: '[00:01.12]',
    callsign: '🟢 TELEMETRY',
    message: 'Asynchronous CUDA event stream synchronization verified with zero CPU stalls',
  },
];

export function buildInspectorStripLine(node: RingStreamNode): string {
  const stateSuffix = node.zeroCopyActive ? 'ZERO_COPY_ACTIVE' : 'NVLINK_RESYNC_REQUIRED';
  return (
    'STREAM: ' +
    node.streamCode +
    ' · PEER: ' +
    node.peerGpu +
    ' · SIZE: ' +
    String(node.bufferSizeMb) +
    ' MB · PTR: ' +
    node.pointerHex +
    ' · ' +
    stateSuffix
  );
}

export function buildEngineSnapshot(params: {
  corridor: SyntheticCorridor;
  linkStallActive: boolean;
  burstActive: boolean;
  stepCount: number;
  processedTokens: number;
  ncclXp: number;
  selectedStreamId: number;
  radioLogs: readonly RadioLogEntry[];
}): EngineStateSnapshot {
  const {
    corridor,
    linkStallActive,
    burstActive,
    stepCount,
    processedTokens,
    ncclXp,
    selectedStreamId,
    radioLogs,
  } = params;

  const activeStreamsCount = linkStallActive ? 6 : 8;
  const bandwidthGbs = computeZeroCopyBandwidthGbs(
    corridor,
    activeStreamsCount,
    64,
    linkStallActive,
    burstActive
  );
  const streamLatencyUs = computeAsyncStreamLatencyUs(
    corridor,
    activeStreamsCount,
    linkStallActive,
    burstActive
  );
  const bufferParityPct = computeBufferParityPct(corridor, linkStallActive, burstActive);

  const perStreamBandwidth =
    activeStreamsCount > 0 ? Math.round((bandwidthGbs / activeStreamsCount) * 10) / 10 : 0;

  const streams: RingStreamNode[] = [];
  for (let i = 0; i < 8; i++) {
    const peerIdx = (i + 1) % 8;
    const isStalledStream = linkStallActive && (i === 2 || i === 5);
    const pointerHex = computeRingPointerHex(i, stepCount);
    const eventState: RingStreamNode['eventState'] = isStalledStream
      ? 'STALL_RESYNC'
      : burstActive
        ? 'BURST_SYNC'
        : 'EVENT_SYNC';
    const lockBadge: RingStreamNode['lockBadge'] = isStalledStream ? '⚡ FAULT' : '✓ LOCKED';
    const handleHex = (0xe400 + i * 0x10 + (stepCount % 16)).toString(16).toUpperCase();

    streams.push({
      streamId: i,
      streamCode: 'ST' + String(i),
      label: 'Stream ' + String(i) + ' (ST' + String(i) + ')',
      sourceGpu: 'GPU_' + String(i),
      peerGpu: 'GPU_' + String(peerIdx),
      bufferSizeMb: 64,
      pointerHex,
      cudaEventHandle: 'EVT_0x' + handleHex,
      eventState,
      lockBadge,
      transferRateGbs: isStalledStream ? 0 : perStreamBandwidth,
      streamLatencyUs: isStalledStream
        ? Math.round(streamLatencyUs * 4.2 * 1000) / 1000
        : streamLatencyUs,
      bufferParityPct: isStalledStream ? 62.5 : bufferParityPct,
      completedPasses: 2048 + stepCount * 8 + i * 16,
      zeroCopyActive: !isStalledStream && corridor !== SyntheticCorridor.DELTA,
    });
  }

  const safeSelected = Math.min(Math.max(selectedStreamId, 0), 7);
  const selectedNode = streams[safeSelected];
  const inspectorStripText = buildInspectorStripLine(selectedNode);

  const xpKilo = (ncclXp / 1000).toFixed(1);
  const bandwidthSaturationPct = Math.min(100, Math.round((bandwidthGbs / 5600) * 100));

  const ncclStateLabel = linkStallActive
    ? 'NCCL State: NVLink Resync'
    : burstActive
      ? 'NCCL State: P2P Burst Ring'
      : 'NCCL State: P2P Ring Active';

  return {
    engineId: 'GF-T3-240',
    trackBadge: 'TRACK 3',
    corridor,
    bandwidthGbs,
    formattedBandwidth: formatNumberWithCommas(bandwidthGbs) + ' GB/s',
    bandwidthSaturationPct,
    streamLatencyUs,
    formattedLatency: streamLatencyUs.toFixed(2) + ' µs',
    activeStreamsCount,
    totalStreamsCount: 8,
    processedTokens,
    formattedTokens: formatNumberWithCommas(processedTokens) + ' UNITS',
    ncclXp,
    formattedXp: '+' + xpKilo + 'k NCCL XP',
    ncclStateLabel,
    bufferParityPct,
    selectedStreamId: safeSelected,
    inspectorStripText,
    linkStallActive,
    burstActive,
    stepCount,
    streams,
    radioLogs,
  };
}

export function createInitialEngineState(): EngineStateSnapshot {
  return buildEngineSnapshot({
    corridor: SyntheticCorridor.ALPHA,
    linkStallActive: false,
    burstActive: false,
    stepCount: 0,
    processedTokens: 1792000,
    ncclXp: 30200,
    selectedStreamId: 3,
    radioLogs: INITIAL_RADIO_LOGS,
  });
}

export function transitionEngineState(
  current: EngineStateSnapshot,
  rawCommand: unknown
): { state: EngineStateSnapshot; validationError?: string } {
  const check = validateGridSyncIngress(rawCommand);
  if (!check.valid || !check.data) {
    const errLog: RadioLogEntry = {
      id: 'log-err-' + String(current.radioLogs.length),
      timestamp: formatStopwatchTimestamp(current.radioLogs.length),
      callsign: '🔴 TELEMETRY',
      message: 'GridSync Zero-Trust Gate blocked malformed ingress payload',
    };
    return {
      state: {
        ...current,
        radioLogs: [...current.radioLogs, errLog].slice(-12),
      },
      validationError: check.error,
    };
  }

  const cmd = check.data;
  let corridor = cmd.corridor;
  let linkStallActive = current.linkStallActive;
  let burstActive = current.burstActive;
  let stepCount = current.stepCount;
  let processedTokens = current.processedTokens;
  let ncclXp = current.ncclXp;
  let selectedStreamId = cmd.streamId ?? current.selectedStreamId;
  const nextLogIndex = current.radioLogs.length;
  let logEntry: RadioLogEntry;

  switch (cmd.commandType) {
    case 'INJECT_BURST': {
      burstActive = true;
      linkStallActive = false;
      stepCount += 1;
      processedTokens += 256000;
      ncclXp += 4800;
      const burstBw = computeZeroCopyBandwidthGbs(corridor, 8, 64, false, true);
      logEntry = {
        id: 'log-' + String(nextLogIndex),
        timestamp: formatStopwatchTimestamp(nextLogIndex),
        callsign: '⚡ PIT WALL',
        message:
          'P2P Ring Stream Burst triggered · Saturation surged to ' +
          formatNumberWithCommas(burstBw) +
          ' GB/s across 8 streams',
      };
      break;
    }
    case 'TOGGLE_STALL': {
      linkStallActive = !linkStallActive;
      if (linkStallActive) {
        burstActive = false;
        logEntry = {
          id: 'log-' + String(nextLogIndex),
          timestamp: formatStopwatchTimestamp(nextLogIndex),
          callsign: '🔴 TELEMETRY',
          message:
            'NVLink link stall injected on ST2 and ST5 · Forcing asynchronous CUDA stream resync',
        };
      } else {
        logEntry = {
          id: 'log-' + String(nextLogIndex),
          timestamp: formatStopwatchTimestamp(nextLogIndex),
          callsign: '🟢 CREW CHIEF',
          message:
            'NVLink bridge resynchronized · All 8/8 P2P ring streams locked in zero-copy mode',
        };
      }
      break;
    }
    case 'STEP_ZERO_COPY': {
      stepCount += 1;
      processedTokens += 128000;
      ncclXp += 2400;
      const nextPtr = computeRingPointerHex(selectedStreamId, stepCount);
      logEntry = {
        id: 'log-' + String(nextLogIndex),
        timestamp: formatStopwatchTimestamp(nextLogIndex),
        callsign: '🟢 TELEMETRY',
        message:
          'Zero-copy transfer pass stepped · ST' +
          String(selectedStreamId) +
          ' pointer advanced to ' +
          nextPtr +
          ' with 0 CPU staging',
      };
      break;
    }
    case 'FLUSH_QUEUES': {
      linkStallActive = false;
      burstActive = false;
      stepCount = 0;
      processedTokens = 1792000;
      ncclXp = 30200;
      corridor = SyntheticCorridor.ALPHA;
      selectedStreamId = 3;
      return {
        state: createInitialEngineState(),
      };
    }
    case 'SELECT_STREAM': {
      const targetPtr = computeRingPointerHex(selectedStreamId, stepCount);
      logEntry = {
        id: 'log-' + String(nextLogIndex),
        timestamp: formatStopwatchTimestamp(nextLogIndex),
        callsign: '🟢 CREW CHIEF',
        message:
          'Telemetry inspector locked to ST' +
          String(selectedStreamId) +
          ' · BAR1 ring pointer ' +
          targetPtr +
          ' verified',
      };
      break;
    }
    case 'SWITCH_CORRIDOR': {
      const targetBw = computeZeroCopyBandwidthGbs(
        corridor,
        linkStallActive ? 6 : 8,
        64,
        linkStallActive,
        burstActive
      );
      logEntry = {
        id: 'log-' + String(nextLogIndex),
        timestamp: formatStopwatchTimestamp(nextLogIndex),
        callsign: '⚡ PIT WALL',
        message:
          'Switched fabric to ' +
          CORRIDOR_PHYSICS_MAP[corridor].shortTag +
          ' · Effective rate ' +
          formatNumberWithCommas(targetBw) +
          ' GB/s',
      };
      break;
    }
    case 'RUN_DIAGNOSTIC': {
      stepCount += 1;
      processedTokens += 64000;
      ncclXp += 1200;
      logEntry = {
        id: 'log-' + String(nextLogIndex),
        timestamp: formatStopwatchTimestamp(nextLogIndex),
        callsign: '🟢 CREW CHIEF',
        message:
          'Full 8-stream GPUDirect P2P ring audit passed · Parity ' +
          String(computeBufferParityPct(corridor, linkStallActive, burstActive)) +
          '% verified',
      };
      break;
    }
  }

  const updatedLogs = [...current.radioLogs, logEntry].slice(-10);

  return {
    state: buildEngineSnapshot({
      corridor,
      linkStallActive,
      burstActive,
      stepCount,
      processedTokens,
      ncclXp,
      selectedStreamId,
      radioLogs: updatedLogs,
    }),
  };
}

export const SUPABASE_POSTGRES_SCHEMA_SQL = [
  '-- GF-T3-240: Production PostgreSQL 16 / Supabase Schema (Partitioned + RLS)',
  'CREATE EXTENSION IF NOT EXISTS "pgcrypto";',
  '',
  'CREATE TABLE IF NOT EXISTS nccl_corridors (',
  '  corridor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),',
  '  corridor_code TEXT NOT NULL UNIQUE,',
  '  peak_bandwidth_gbs NUMERIC(10,2) NOT NULL CHECK (peak_bandwidth_gbs > 0),',
  '  base_latency_us NUMERIC(8,4) NOT NULL CHECK (base_latency_us > 0),',
  '  zero_copy_enabled BOOLEAN NOT NULL DEFAULT TRUE',
  ');',
  '',
  'CREATE TABLE IF NOT EXISTS p2p_ring_streams (',
  '  stream_uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),',
  '  tenant_org_id UUID NOT NULL,',
  '  corridor_id UUID NOT NULL REFERENCES nccl_corridors(corridor_id),',
  '  stream_index SMALLINT NOT NULL CHECK (stream_index BETWEEN 0 AND 7),',
  '  stream_code TEXT NOT NULL,',
  '  source_gpu TEXT NOT NULL,',
  '  peer_gpu TEXT NOT NULL,',
  '  buffer_size_mb INTEGER NOT NULL DEFAULT 64,',
  '  ring_pointer_hex TEXT NOT NULL,',
  '  event_marker TEXT NOT NULL,',
  '  sync_status TEXT NOT NULL,',
  '  transfer_rate_gbs NUMERIC(10,2) NOT NULL,',
  '  UNIQUE (tenant_org_id, stream_index)',
  ');',
  '',
  'CREATE TABLE IF NOT EXISTS nccl_telemetry_events (',
  '  event_id UUID NOT NULL DEFAULT gen_random_uuid(),',
  '  tenant_org_id UUID NOT NULL,',
  '  stream_uuid UUID NOT NULL REFERENCES p2p_ring_streams(stream_uuid) ON DELETE CASCADE,',
  '  action_type TEXT NOT NULL,',
  '  aggregate_bandwidth_gbs NUMERIC(10,2) NOT NULL,',
  '  stream_latency_us NUMERIC(8,4) NOT NULL,',
  '  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),',
  '  PRIMARY KEY (event_id, recorded_at)',
  ') PARTITION BY RANGE (recorded_at);',
  '',
  'ALTER TABLE p2p_ring_streams ENABLE ROW LEVEL SECURITY;',
  'ALTER TABLE nccl_telemetry_events ENABLE ROW LEVEL SECURITY;',
  '',
  'CREATE POLICY tenant_isolation_p2p_streams ON p2p_ring_streams',
  '  FOR ALL TO authenticated',
  "  USING (tenant_org_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'org_id')::uuid);",
].join('\n');
