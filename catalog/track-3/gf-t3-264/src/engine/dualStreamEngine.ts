/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GF-T3-264 Dual-Stream Async Disaggregation & Non-Blocking Event Synchronizer
 * Clean-room mathematical execution engine & GridSync Zod sanitization gate.
 * Zero-Dollar Gate Verified.
 */

import { z } from 'zod';

export enum SyntheticCorridor {
  ALPHA = 'STREAM-CORRIDOR-ALPHA (DUAL-STREAM-ASYNC-DISAGGREGATION-FABRIC · 25600-GB/S)',
  BRAVO = 'STREAM-CORRIDOR-BRAVO (NON-BLOCKING-EVENT-SYNCHRONIZER)',
  GAMMA = 'STREAM-CORRIDOR-GAMMA (REMOTE-KV-CACHE-MIGRATION-ENGINE)',
  DELTA = 'STREAM-CORRIDOR-DELTA (FALLBACK-MONOLITHIC-STREAM-PASS)',
}

export enum StreamExecutionMode {
  PREFILL = 'PREFILL',
  DECODE = 'DECODE',
  DUAL_ASYNC = 'DUAL-ASYNC',
  MONOLITHIC = 'MONOLITHIC',
}

export enum StreamLockState {
  LOCKED = 'ASYNC · LOCKED',
  DESYNC = '⚡ FAULT · DESYNC',
  KV_MIGRATING = 'KV · MIGRATING',
}

export interface StreamLaneMetrics {
  index: number;
  code: string;
  title: string;
  hexPtr: string;
  tokensK: number;
  mode: StreamExecutionMode;
  latencyMs: number;
  state: StreamLockState;
  syncParityPct: number;
  prefillBwGbs: number;
  decodeBwGbs: number;
  kvTransferUs: number;
  eventWaitCycles: number;
  pipelineStatus: 'OK' | 'RECALIBRATING';
}

export interface RadioLogEntry {
  id: string;
  timestamp: string;
  badge: '🟢 CREW CHIEF' | '🟢 TELEMETRY' | '🔴 TELEMETRY' | '⚡ PIT WALL';
  message: string;
}

export interface EngineTelemetryState {
  engineId: 'GF-T3-264';
  corridor: SyntheticCorridor;
  streamThroughputGbs: number;
  throughputSaturationPct: number;
  syncLatencyUs: number;
  activeStreamsCount: number;
  totalStreamsCount: number;
  processedTokens: number;
  engineXpK: number;
  streamStateLabel: string;
  bufferParityPct: number;
  meshPtr: string;
  vectorSignature: [number, number, number, number];
  selectedStreamIndex: number;
  stepCount: number;
  desyncSpikeActive: boolean;
  burstFactor: number;
  streams: StreamLaneMetrics[];
  radioLogs: RadioLogEntry[];
}

const FORBIDDEN_PATTERNS = [
  ';',
  '--',
  'DROP ',
  'SELECT ',
  'UNION ',
  'INSERT ',
  'DELETE ',
  '<SCRIPT',
  'JAVASCRIPT:',
  'ONERROR=',
];

export const GridSyncCommandSchema = z.object({
  directive: z.enum([
    'INJECT_BURST',
    'TOGGLE_DESYNC',
    'STEP_INTERLEAVE',
    'FLUSH_QUEUES',
    'SELECT_CORRIDOR',
    'SELECT_STREAM',
    'SYNC_EVENTS',
    'RUN_CYCLE',
  ]),
  corridor: z.nativeEnum(SyntheticCorridor).optional(),
  streamIndex: z.number().int().min(0).max(7).optional(),
  operatorNote: z
    .string()
    .max(120)
    .refine(
      (val) => {
        const upper = val.toUpperCase();
        return !FORBIDDEN_PATTERNS.some((pat) => upper.includes(pat));
      },
      { message: 'GridSync Zero-Trust Gate rejected unsafe payload pattern' }
    )
    .optional(),
});

export type GridSyncCommand = z.infer<typeof GridSyncCommandSchema>;

export function formatNumberWithCommas(val: number): string {
  return Math.round(val).toLocaleString('en-US');
}

export function computeCorridorEfficiency(corridor: SyntheticCorridor): number {
  switch (corridor) {
    case SyntheticCorridor.ALPHA:
      return 1.0;
    case SyntheticCorridor.BRAVO:
      return 0.96;
    case SyntheticCorridor.GAMMA:
      return 0.94;
    case SyntheticCorridor.DELTA:
      return 0.62;
  }
}

export function createInitialStreams(): StreamLaneMetrics[] {
  const baseAddr = 0xd000;
  const stride = 0x0100;
  const streams: StreamLaneMetrics[] = [];

  for (let i = 0; i < 8; i++) {
    const hex = '0x' + (baseAddr + i * stride).toString(16).toUpperCase();
    let mode = i % 2 === 0 ? StreamExecutionMode.PREFILL : StreamExecutionMode.DECODE;
    if (i === 3 || i === 7) {
      mode = StreamExecutionMode.DUAL_ASYNC;
    }

    const prefillBw =
      mode === StreamExecutionMode.PREFILL
        ? 1920
        : mode === StreamExecutionMode.DUAL_ASYNC
          ? 1600
          : 1280;
    const decodeBw =
      mode === StreamExecutionMode.DECODE
        ? 1920
        : mode === StreamExecutionMode.DUAL_ASYNC
          ? 1600
          : 1280;

    streams.push({
      index: i,
      code: 'M' + String(i),
      title: 'Stream ' + String(i) + ' (M' + String(i) + ')',
      hexPtr: hex,
      tokensK: 256,
      mode,
      latencyMs: 0.02,
      state: StreamLockState.LOCKED,
      syncParityPct: 100,
      prefillBwGbs: prefillBw,
      decodeBwGbs: decodeBw,
      kvTransferUs: 0.01,
      eventWaitCycles: 0,
      pipelineStatus: 'OK',
    });
  }

  return streams;
}

export function createInitialEngineState(): EngineTelemetryState {
  return {
    engineId: 'GF-T3-264',
    corridor: SyntheticCorridor.ALPHA,
    streamThroughputGbs: 25600,
    throughputSaturationPct: 100,
    syncLatencyUs: 0.01,
    activeStreamsCount: 8,
    totalStreamsCount: 8,
    processedTokens: 4864000,
    engineXpK: 75.0,
    streamStateLabel: 'Dual-Async Active',
    bufferParityPct: 100,
    meshPtr: '0xCF8DC0',
    vectorSignature: [2.61, 2.65, 2.62, 2.64],
    selectedStreamIndex: 3,
    stepCount: 0,
    desyncSpikeActive: false,
    burstFactor: 1.0,
    streams: createInitialStreams(),
    radioLogs: [
      {
        id: 'log-init-1',
        timestamp: '00:01.04',
        badge: '🟢 CREW CHIEF',
        message: 'Dual-stream async disaggregated engine initialized · 8 streams linked',
      },
      {
        id: 'log-init-2',
        timestamp: '00:01.08',
        badge: '🟢 TELEMETRY',
        message:
          'Asynchronous prefill and decode interleaving verified at 25,600 GB/s with zero stalls',
      },
    ],
  };
}

function formatRadioClock(stepCount: number): string {
  const totalCentiseconds = 108 + stepCount * 19;
  const seconds = Math.floor(totalCentiseconds / 100);
  const cs = totalCentiseconds % 100;
  const minutes = Math.floor(seconds / 60);
  const remSec = seconds % 60;
  const mm = String(minutes).padStart(2, '0');
  const ss = String(remSec).padStart(2, '0');
  const cc = String(cs).padStart(2, '0');
  return mm + ':' + ss + '.' + cc;
}

export function executeEngineCommand(
  currentState: EngineTelemetryState,
  rawCommand: unknown
): EngineTelemetryState {
  const parsed = GridSyncCommandSchema.parse(rawCommand);
  const nextStep = currentState.stepCount + 1;
  const clock = formatRadioClock(nextStep);

  let nextCorridor = parsed.corridor ?? currentState.corridor;
  let nextDesync = currentState.desyncSpikeActive;
  let nextBurst = currentState.burstFactor;
  let nextProcessedTokens = currentState.processedTokens;
  let nextXpK = currentState.engineXpK;
  let nextSelectedIdx =
    parsed.streamIndex !== undefined ? parsed.streamIndex : currentState.selectedStreamIndex;
  let nextStreams = currentState.streams.map((s) => ({ ...s }));
  let nextLogs = [...currentState.radioLogs];

  const appendLog = (
    badge: RadioLogEntry['badge'],
    message: string
  ) => {
    nextLogs = [
      ...nextLogs.slice(-7),
      {
        id: 'log-' + String(nextStep) + '-' + String(nextLogs.length),
        timestamp: clock,
        badge,
        message,
      },
    ];
  };

  if (parsed.directive === 'FLUSH_QUEUES') {
    const fresh = createInitialEngineState();
    return {
      ...fresh,
      stepCount: nextStep,
      radioLogs: [
        fresh.radioLogs[0],
        {
          id: 'log-flush-' + String(nextStep),
          timestamp: clock,
          badge: '🟢 CREW CHIEF',
          message:
            'Stream queues flushed and execution ring re-zeroed · 25,600 GB/s baseline locked',
        },
      ],
    };
  }

  if (parsed.directive === 'SELECT_STREAM') {
    const targetStream = nextStreams[nextSelectedIdx] ?? nextStreams[3];
    appendLog(
      '⚡ PIT WALL',
      'Inspector locked on ' +
        targetStream.code +
        ' (' +
        targetStream.hexPtr +
        ') · Mode: ' +
        targetStream.mode +
        ' · Sync: ' +
        String(targetStream.syncParityPct) +
        '%'
    );
    return {
      ...currentState,
      selectedStreamIndex: nextSelectedIdx,
      stepCount: nextStep,
      radioLogs: nextLogs,
    };
  }

  if (parsed.directive === 'INJECT_BURST') {
    nextBurst = currentState.burstFactor >= 1.25 ? 1.0 : 1.25;
    nextDesync = false;
    nextProcessedTokens += 512000;
    nextXpK = Math.round((nextXpK + 12.5) * 10) / 10;
    nextStreams = nextStreams.map((s, idx) => ({
      ...s,
      tokensK: 256 + (idx + 1) * 32,
      prefillBwGbs: 2048,
      decodeBwGbs: 1152,
      latencyMs: 0.01,
      kvTransferUs: 0.01,
      state: StreamLockState.LOCKED,
      syncParityPct: 100,
      eventWaitCycles: 0,
      pipelineStatus: 'OK',
    }));
    appendLog(
      '⚡ PIT WALL',
      'Dual-stream async burst injected · Prefill/Decode concurrency boosted across M0..M7'
    );
  } else if (parsed.directive === 'TOGGLE_DESYNC') {
    nextDesync = !currentState.desyncSpikeActive;
    if (nextDesync) {
      appendLog(
        '🔴 TELEMETRY',
        'Stream desync spike detected on M2 and M5 · Hardware event recalibration armed'
      );
    } else {
      appendLog(
        '🟢 CREW CHIEF',
        'Hardware event barrier recalibrated · All 8 streams restored to 0.01 µs sync lock'
      );
    }
  } else if (
    parsed.directive === 'STEP_INTERLEAVE' ||
    parsed.directive === 'RUN_CYCLE'
  ) {
    nextDesync = false;
    nextBurst = 1.0;
    nextProcessedTokens += 256000;
    nextXpK = Math.round((nextXpK + 6.4) * 10) / 10;
    nextStreams = nextStreams.map((s, idx) => {
      const phase = (idx + nextStep) % 3;
      const mode =
        phase === 0
          ? StreamExecutionMode.PREFILL
          : phase === 1
            ? StreamExecutionMode.DECODE
            : StreamExecutionMode.DUAL_ASYNC;
      const prefillBw =
        mode === StreamExecutionMode.PREFILL
          ? 1980
          : mode === StreamExecutionMode.DUAL_ASYNC
            ? 1600
            : 1220;
      const decodeBw = 3200 - prefillBw;
      return {
        ...s,
        mode,
        tokensK: s.tokensK + 16,
        prefillBwGbs: prefillBw,
        decodeBwGbs: decodeBw,
        latencyMs: 0.02,
        kvTransferUs: 0.01,
        state: StreamLockState.LOCKED,
        syncParityPct: 100,
        eventWaitCycles: 0,
        pipelineStatus: 'OK',
      };
    });
    appendLog(
      '🟢 TELEMETRY',
      'Interleaved async pass #' +
        String(nextStep) +
        ' committed · Remote KV tensors migrated in 0.01 µs'
    );
  } else if (parsed.directive === 'SYNC_EVENTS') {
    nextDesync = false;
    nextProcessedTokens += 128000;
    nextXpK = Math.round((nextXpK + 3.2) * 10) / 10;
    appendLog(
      '🟢 CREW CHIEF',
      'Non-blocking CUDA event synchronization barrier verified · Zero host CPU polling stalls'
    );
  } else if (parsed.directive === 'SELECT_CORRIDOR') {
    appendLog(
      '🟢 CREW CHIEF',
      'Switched active fabric to ' + nextCorridor
    );
  }

  const efficiency = computeCorridorEfficiency(nextCorridor);
  let aggregateBw = 0;
  let parityTotal = 0;
  let activeStreams = 0;

  nextStreams = nextStreams.map((s) => {
    let mode = s.mode;
    if (nextCorridor === SyntheticCorridor.DELTA) {
      mode = StreamExecutionMode.MONOLITHIC;
    } else if (s.index === 3 || s.index === 7) {
      mode = StreamExecutionMode.DUAL_ASYNC;
    }

    const isFaulted = nextDesync && (s.index === 2 || s.index === 5);
    const state = isFaulted ? StreamLockState.DESYNC : StreamLockState.LOCKED;
    const syncParityPct = isFaulted
      ? 74.5
      : nextCorridor === SyntheticCorridor.DELTA
        ? 91.0
        : 100.0;
    const latencyMs = isFaulted
      ? 0.19
      : nextCorridor === SyntheticCorridor.DELTA
        ? 0.08
        : nextBurst > 1.0
          ? 0.01
          : 0.02;
    const kvTransferUs = isFaulted ? 0.42 : 0.01;
    const eventWaitCycles = isFaulted ? 14 : 0;
    const pipelineStatus: 'OK' | 'RECALIBRATING' = isFaulted ? 'RECALIBRATING' : 'OK';

    if (!isFaulted) {
      activeStreams += 1;
    }

    const rawLaneBw = (s.prefillBwGbs + s.decodeBwGbs) * efficiency * nextBurst;
    const effectiveLaneBw = isFaulted ? rawLaneBw * 0.55 : rawLaneBw;
    aggregateBw += effectiveLaneBw;
    parityTotal += syncParityPct;

    return {
      ...s,
      mode,
      state,
      syncParityPct,
      latencyMs,
      kvTransferUs,
      eventWaitCycles,
      pipelineStatus,
    };
  });

  const roundedThroughput = Math.round(aggregateBw);
  const saturationPct = Math.min(
    100,
    Math.round((roundedThroughput / 25600) * 100)
  );
  const bufferParityPct = Math.round((parityTotal / 8) * 10) / 10;
  const syncLatencyUs = nextDesync
    ? 0.38
    : nextCorridor === SyntheticCorridor.DELTA
      ? 0.14
      : 0.01;

  const vec: [number, number, number, number] = [
    Math.round(2.61 * efficiency * (nextDesync ? 0.91 : 1.0) * 100) / 100,
    Math.round(2.65 * efficiency * nextBurst * 100) / 100,
    Math.round(2.62 * efficiency * 100) / 100,
    Math.round(2.64 * (bufferParityPct / 100) * 100) / 100,
  ];

  const streamStateLabel = nextDesync
    ? 'Desync Recalibration Armed'
    : nextCorridor === SyntheticCorridor.DELTA
      ? 'Fallback Monolithic Pass'
      : 'Dual-Async Active';

  const meshHexNum = 0xcf8dc0 + (nextStep % 16) * 0x10;
  const meshPtr = '0x' + meshHexNum.toString(16).toUpperCase();

  return {
    engineId: 'GF-T3-264',
    corridor: nextCorridor,
    streamThroughputGbs: roundedThroughput,
    throughputSaturationPct: saturationPct,
    syncLatencyUs,
    activeStreamsCount: activeStreams,
    totalStreamsCount: 8,
    processedTokens: nextProcessedTokens,
    engineXpK: nextXpK,
    streamStateLabel,
    bufferParityPct,
    meshPtr,
    vectorSignature: vec,
    selectedStreamIndex: nextSelectedIdx,
    stepCount: nextStep,
    desyncSpikeActive: nextDesync,
    burstFactor: nextBurst,
    streams: nextStreams,
    radioLogs: nextLogs,
  };
}
