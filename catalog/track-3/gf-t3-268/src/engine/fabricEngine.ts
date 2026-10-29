import { z } from 'zod';

/**
 * GF-T3-268 · Track 3 Flagship Tensor-Parallel Pipeline Interconnect & Ring-Reduce Engine
 * Pure Mathematical Execution · GridSync Zero-Trust Zod Ingress Sanitization
 * Strictly zero dollar-sign characters anywhere in codebase or outputs.
 */

export type SyntheticCorridorId =
  | 'FABRIC-CORRIDOR-ALPHA'
  | 'FABRIC-CORRIDOR-BRAVO'
  | 'FABRIC-CORRIDOR-GAMMA'
  | 'FABRIC-CORRIDOR-DELTA';

export interface CorridorProfile {
  id: SyntheticCorridorId;
  shortTag: string;
  fullLabel: string;
  peakBandwidthGbps: number;
  baseLatencyUs: number;
  overlapEfficiency: number;
  activeRanks: number;
}

export const SYNTHETIC_CORRIDORS: Record<SyntheticCorridorId, CorridorProfile> = {
  'FABRIC-CORRIDOR-ALPHA': {
    id: 'FABRIC-CORRIDOR-ALPHA',
    shortTag: 'ALPHA · 28.8TB/s',
    fullLabel: 'FABRIC-CORRIDOR-ALPHA (TENSOR-PARALLEL-PIPELINE-INTERCONNECT-FABRIC · 28800-GB/S)',
    peakBandwidthGbps: 28800,
    baseLatencyUs: 0.01,
    overlapEfficiency: 0.996,
    activeRanks: 8,
  },
  'FABRIC-CORRIDOR-BRAVO': {
    id: 'FABRIC-CORRIDOR-BRAVO',
    shortTag: 'BRAVO · RING-AG',
    fullLabel: 'FABRIC-CORRIDOR-BRAVO (RING-REDUCE-SCATTER-ALL-GATHER-ENGINE)',
    peakBandwidthGbps: 25600,
    baseLatencyUs: 0.02,
    overlapEfficiency: 0.988,
    activeRanks: 8,
  },
  'FABRIC-CORRIDOR-GAMMA': {
    id: 'FABRIC-CORRIDOR-GAMMA',
    shortTag: 'GAMMA · OVERLAP',
    fullLabel: 'FABRIC-CORRIDOR-GAMMA (ASYNC-NCCL-COMMUNICATION-OVERLAPPER)',
    peakBandwidthGbps: 27200,
    baseLatencyUs: 0.015,
    overlapEfficiency: 0.998,
    activeRanks: 8,
  },
  'FABRIC-CORRIDOR-DELTA': {
    id: 'FABRIC-CORRIDOR-DELTA',
    shortTag: 'DELTA · FALLBACK',
    fullLabel: 'FABRIC-CORRIDOR-DELTA (FALLBACK-SINGLE-NODE-PASS)',
    peakBandwidthGbps: 14400,
    baseLatencyUs: 0.04,
    overlapEfficiency: 0.945,
    activeRanks: 8,
  },
};

export interface RankNodeState {
  rankIndex: number;
  rankCode: string;
  title: string;
  ptrHex: string;
  tokensK: number;
  ringHop: string;
  latencyMs: number;
  syncPct: number;
  statusText: string;
  fabricHealth: 'OK' | 'REROUTE' | 'BURST' | 'FAULT';
  localShard: [number, number, number, number];
  reducedVector: [number, number, number, number];
  nextHopRank: number;
}

export interface RadioLogEntry {
  timestamp: string;
  callsign: '🟢 CREW CHIEF' | '🟢 TELEMETRY' | '🔴 TELEMETRY' | '⚡ PIT WALL';
  message: string;
}

export interface FabricTelemetryState {
  corridorId: SyntheticCorridorId;
  corridorLabel: string;
  fabricThroughputGbps: number;
  saturationPct: number;
  ringLatencyUs: number;
  activeRanksCount: number;
  totalRanksCount: number;
  processedTokensUnits: number;
  engineXpK: number;
  fabricStateLabel: string;
  meshPtrHex: string;
  modeLabel: string;
  consensusVector: [number, number, number, number];
  reduceScatterSumVector: [number, number, number, number];
  asyncOverlapPct: number;
  pipelineStallUs: number;
  stepCount: number;
  congestionActive: boolean;
  burstActive: boolean;
  ranks: RankNodeState[];
  selectedRankIndex: number;
  radioLogs: RadioLogEntry[];
}

// GridSync Zero-Trust Payload Sanitization Schema
const dangerousPattern = /(--|;|\/\*|\*\/|<script|javascript:|onerror=|onload=|DROP\s+TABLE|UNION\s+SELECT|INSERT\s+INTO|DELETE\s+FROM)/i;

export const GridSyncCommandSchema = z.object({
  corridorId: z.enum([
    'FABRIC-CORRIDOR-ALPHA',
    'FABRIC-CORRIDOR-BRAVO',
    'FABRIC-CORRIDOR-GAMMA',
    'FABRIC-CORRIDOR-DELTA',
  ]),
  action: z.enum(['BURST', 'CONGESTION', 'STEP', 'FLUSH', 'SELECT_RANK', 'SWITCH_CORRIDOR']),
  selectedRankIndex: z.number().int().min(0).max(7).optional(),
  operatorNote: z
    .string()
    .max(120)
    .refine((val) => !dangerousPattern.test(val), {
      message: 'GridSync Security Gate blocked potentially unsafe SQL/XSS payload sequence',
    })
    .optional(),
});

export type GridSyncCommandInput = z.infer<typeof GridSyncCommandSchema>;

export function sanitizeFabricPayload(rawInput: unknown): GridSyncCommandInput {
  if (typeof rawInput === 'object' && rawInput !== null) {
    const protoKeys = Object.keys(rawInput);
    if (protoKeys.includes('__proto__') || protoKeys.includes('constructor') || protoKeys.includes('prototype')) {
      throw new Error('GridSync Security Gate blocked prototype pollution attempt');
    }
  }
  const parsed = GridSyncCommandSchema.parse(rawInput);
  if (parsed.operatorNote && parsed.operatorNote.indexOf(String.fromCharCode(36)) !== -1) {
    throw new Error('Zero-Dollar Gate violation detected in payload');
  }
  return parsed;
}

/**
 * Pure Mathematical Ring-Reduce Scatter + All-Gather Primitive
 * R_agg = Sum_{i=1..N} ReduceScatter(X_i) + AllGather
 */
export function computeRingReduceScatterAllGather(
  rankShards: ReadonlyArray<[number, number, number, number]>
): {
  reduceScatterSum: [number, number, number, number];
  allGatherConsensus: [number, number, number, number];
} {
  const n = rankShards.length;
  if (n === 0) {
    return {
      reduceScatterSum: [0, 0, 0, 0],
      allGatherConsensus: [0, 0, 0, 0],
    };
  }

  const accum: [number, number, number, number] = [0, 0, 0, 0];

  // N-step ring-reduce accumulation across all ranks
  for (let hop = 0; hop < n; hop += 1) {
    for (let dim = 0; dim < 4; dim += 1) {
      const sourceRank = (((dim - hop) % n) + n) % n;
      accum[dim] = Number((accum[dim] + rankShards[sourceRank][dim]).toFixed(6));
    }
  }

  const consensus: [number, number, number, number] = [
    Number((accum[0] / n).toFixed(2)),
    Number((accum[1] / n).toFixed(2)),
    Number((accum[2] / n).toFixed(2)),
    Number((accum[3] / n).toFixed(2)),
  ];

  return {
    reduceScatterSum: accum,
    allGatherConsensus: consensus,
  };
}

/**
 * Computes Asynchronous Interconnect Overlap & Ring-Reduce Bandwidth Saturation
 */
export function computeInterconnectTelemetry(
  corridorId: SyntheticCorridorId,
  congestionActive: boolean,
  burstActive: boolean,
  stepCount: number
): {
  throughputGbps: number;
  saturationPct: number;
  ringLatencyUs: number;
  asyncOverlapPct: number;
  pipelineStallUs: number;
} {
  const profile = SYNTHETIC_CORRIDORS[corridorId];
  const burstFactor = burstActive ? 1.125 : 1.0;
  const congestionPenalty = congestionActive ? 0.84 : 1.0;
  const stepHarmonic = stepCount > 0 ? 1.0 + ((stepCount % 4) * 0.0025) : 1.0;

  const rawThroughput = profile.peakBandwidthGbps * burstFactor * congestionPenalty * stepHarmonic;
  const throughputGbps = Math.round(rawThroughput);

  const saturationPct = Number(
    Math.min(100, Math.max(50, (throughputGbps / 32400) * 100)).toFixed(1)
  );

  const rawLatency =
    profile.baseLatencyUs *
    (congestionActive ? 2.0 : 1.0) *
    (burstActive ? 0.9 : 1.0);
  const ringLatencyUs = Number(Math.max(0.01, rawLatency).toFixed(2));

  const asyncOverlapPct = Number(
    (profile.overlapEfficiency * (congestionActive ? 98.4 : 100.0)).toFixed(2)
  );
  const pipelineStallUs = congestionActive ? 0.02 : 0.0;

  return {
    throughputGbps,
    saturationPct,
    ringLatencyUs,
    asyncOverlapPct,
    pipelineStallUs,
  };
}

function formatClockTimestamp(stepCount: number, offsetCentiseconds: number): string {
  const totalCs = 104 + stepCount * 12 + offsetCentiseconds;
  const minutes = Math.floor(totalCs / 6000);
  const seconds = Math.floor((totalCs % 6000) / 100);
  const cs = totalCs % 100;
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  const cc = String(cs).padStart(2, '0');
  return '[' + mm + ':' + ss + '.' + cc + ']';
}

export function createInitialFabricState(
  corridorId: SyntheticCorridorId = 'FABRIC-CORRIDOR-ALPHA'
): FabricTelemetryState {
  const profile = SYNTHETIC_CORRIDORS[corridorId];
  const baseShard: [number, number, number, number] = [3.01, 3.05, 3.02, 3.04];
  const shards = Array.from({ length: 8 }, () => [...baseShard] as [number, number, number, number]);
  const ringResult = computeRingReduceScatterAllGather(shards);

  const ranks: RankNodeState[] = Array.from({ length: 8 }, (_, idx) => {
    const ptrVal = 0x2000 + idx * 0x0010;
    const ptrHex = '0x' + ptrVal.toString(16).toUpperCase();
    return {
      rankIndex: idx,
      rankCode: 'R' + String(idx),
      title: 'Rank ' + String(idx) + ' (R' + String(idx) + ')',
      ptrHex,
      tokensK: 256,
      ringHop: 'RANK-8',
      latencyMs: 0.02,
      syncPct: 100,
      statusText: 'SYNCED · LOCKED',
      fabricHealth: 'OK',
      localShard: [...baseShard] as [number, number, number, number],
      reducedVector: [...ringResult.allGatherConsensus] as [number, number, number, number],
      nextHopRank: (idx + 1) % 8,
    };
  });

  return {
    corridorId,
    corridorLabel: profile.fullLabel,
    fabricThroughputGbps: profile.peakBandwidthGbps,
    saturationPct: 88.9,
    ringLatencyUs: profile.baseLatencyUs,
    activeRanksCount: 8,
    totalRanksCount: 8,
    processedTokensUnits: 5376000,
    engineXpK: 75.0,
    fabricStateLabel: 'Interconnect Active',
    meshPtrHex: '0x1F8DC0',
    modeLabel: 'TENSOR_PARALLEL',
    consensusVector: ringResult.allGatherConsensus,
    reduceScatterSumVector: ringResult.reduceScatterSum,
    asyncOverlapPct: Number((profile.overlapEfficiency * 100).toFixed(2)),
    pipelineStallUs: 0.0,
    stepCount: 0,
    congestionActive: false,
    burstActive: false,
    ranks,
    selectedRankIndex: 3,
    radioLogs: [
      {
        timestamp: '[00:01.04]',
        callsign: '🟢 CREW CHIEF',
        message: 'Tensor-parallel pipeline interconnect & ring-reduce fabric initialized · 8 ranks linked',
      },
      {
        timestamp: '[00:01.08]',
        callsign: '🟢 TELEMETRY',
        message: 'Reduce-Scatter and All-Gather verified at 28,800 GB/s with zero interconnect stalls',
      },
    ],
  };
}

export function transitionFabricState(
  prevState: FabricTelemetryState,
  rawCommand: GridSyncCommandInput
): FabricTelemetryState {
  const cmd = sanitizeFabricPayload(rawCommand);

  if (cmd.action === 'SELECT_RANK') {
    const targetRank = cmd.selectedRankIndex !== undefined ? cmd.selectedRankIndex : prevState.selectedRankIndex;
    const r = prevState.ranks[targetRank] || prevState.ranks[3];
    const ts = formatClockTimestamp(prevState.stepCount, 6);
    return {
      ...prevState,
      selectedRankIndex: targetRank,
      radioLogs: [
        prevState.radioLogs[prevState.radioLogs.length - 1],
        {
          timestamp: ts,
          callsign: '🟢 TELEMETRY',
          message:
            'Inspector locked on ' +
            r.rankCode +
            ' (' +
            r.ptrHex +
            ') · Hop -> R' +
            String(r.nextHopRank) +
            ' · Sync ' +
            String(r.syncPct) +
            '%',
        },
      ],
    };
  }

  if (cmd.action === 'FLUSH') {
    const fresh = createInitialFabricState(cmd.corridorId);
    return {
      ...fresh,
      selectedRankIndex: prevState.selectedRankIndex,
      radioLogs: [
        {
          timestamp: '[00:01.04]',
          callsign: '🟢 CREW CHIEF',
          message: 'Interconnect buffers flushed & all 8 tensor-parallel ranks re-zeroed to baseline parity',
        },
        {
          timestamp: '[00:01.08]',
          callsign: '🟢 TELEMETRY',
          message:
            'Reduce-Scatter and All-Gather verified at ' +
            fresh.fabricThroughputGbps.toLocaleString('en-US') +
            ' GB/s with zero interconnect stalls',
        },
      ],
    };
  }

  const nextCorridorId = cmd.corridorId;
  const profile = SYNTHETIC_CORRIDORS[nextCorridorId];
  const nextStep = prevState.stepCount + 1;
  const nextCongestion =
    cmd.action === 'CONGESTION' ? !prevState.congestionActive : prevState.congestionActive;
  const nextBurst =
    cmd.action === 'BURST' ? !prevState.burstActive : prevState.burstActive;

  const deltaIncrement = Number(((nextStep % 5) * 0.01).toFixed(2));
  const updatedShards: [number, number, number, number][] = prevState.ranks.map((_, idx) => {
    const rankBias = Number(((idx % 2 === 0 ? 1 : -1) * 0.01 * (nextBurst ? 2 : 1)).toFixed(2));
    return [
      Number((3.01 + deltaIncrement + rankBias).toFixed(2)),
      Number((3.05 + deltaIncrement - rankBias).toFixed(2)),
      Number((3.02 + deltaIncrement + rankBias).toFixed(2)),
      Number((3.04 + deltaIncrement - rankBias).toFixed(2)),
    ];
  });

  const ringMath = computeRingReduceScatterAllGather(updatedShards);
  const telemetry = computeInterconnectTelemetry(
    nextCorridorId,
    nextCongestion,
    nextBurst,
    nextStep
  );

  const tokensPerRankK = nextBurst ? 384 : 256;
  const addedTokens = tokensPerRankK * 1000 * 8;
  const nextTotalTokens = prevState.processedTokensUnits + addedTokens;
  const nextXpK = Number((prevState.engineXpK + (nextBurst ? 25.0 : 12.5)).toFixed(1));

  const stride = nextCongestion ? 3 : 1;
  const updatedRanks: RankNodeState[] = prevState.ranks.map((r, idx) => {
    const isCongestedNode = nextCongestion && (idx === 2 || idx === 5);
    const hopLatencyMs = isCongestedNode
      ? 0.05
      : nextBurst
      ? 0.01
      : 0.02;
    const statusText = isCongestedNode
      ? '⚡ FAULT · REROUTE'
      : nextBurst
      ? '✓ BURST · LOCKED'
      : 'SYNCED · LOCKED';
    const fabricHealth: RankNodeState['fabricHealth'] = isCongestedNode
      ? 'FAULT'
      : nextBurst
      ? 'BURST'
      : 'OK';

    return {
      ...r,
      tokensK: tokensPerRankK,
      ringHop: nextCongestion ? 'BYPASS-S3' : 'RANK-8',
      latencyMs: hopLatencyMs,
      syncPct: isCongestedNode ? 99.4 : 100,
      statusText,
      fabricHealth,
      localShard: updatedShards[idx],
      reducedVector: ringMath.allGatherConsensus,
      nextHopRank: (idx + stride) % 8,
    };
  });

  const ptrOffset = 0x1f8dc0 + nextStep * 0x40;
  const nextMeshPtr = '0x' + ptrOffset.toString(16).toUpperCase();

  const ts1 = formatClockTimestamp(nextStep, 2);
  const ts2 = formatClockTimestamp(nextStep, 6);

  let log1: RadioLogEntry;
  let log2: RadioLogEntry;

  if (cmd.action === 'CONGESTION') {
    if (nextCongestion) {
      log1 = {
        timestamp: ts1,
        callsign: '🔴 TELEMETRY',
        message: 'Interconnect congestion spike injected on R2/R5 · Coprime stride-3 topology bypass engaged',
      };
      log2 = {
        timestamp: ts2,
        callsign: '⚡ PIT WALL',
        message:
          'Sub-microsecond reroute locked at ' +
          telemetry.throughputGbps.toLocaleString('en-US') +
          ' GB/s · Ring latency ' +
          String(telemetry.ringLatencyUs) +
          ' µs',
      };
    } else {
      log1 = {
        timestamp: ts1,
        callsign: '🟢 CREW CHIEF',
        message: 'Interconnect congestion cleared · Unitary 8-rank ring topology restored to nominal',
      };
      log2 = {
        timestamp: ts2,
        callsign: '🟢 TELEMETRY',
        message:
          'All 8 ranks synced at ' +
          telemetry.throughputGbps.toLocaleString('en-US') +
          ' GB/s · Zero stall verified',
      };
    }
  } else if (cmd.action === 'BURST') {
    log1 = {
      timestamp: ts1,
      callsign: '⚡ PIT WALL',
      message:
        'Ring-Reduce Fabric Burst ' +
        (nextBurst ? 'ENGAGED' : 'NORMALIZED') +
        ' on ' +
        nextCorridorId +
        ' · ' +
        String(tokensPerRankK) +
        'K TOK/rank',
    };
    log2 = {
      timestamp: ts2,
      callsign: '🟢 TELEMETRY',
      message:
        'Throughput saturated at ' +
        telemetry.throughputGbps.toLocaleString('en-US') +
        ' GB/s · Ring latency ' +
        String(telemetry.ringLatencyUs) +
        ' µs',
    };
  } else {
    log1 = {
      timestamp: ts1,
      callsign: '🟢 CREW CHIEF',
      message:
        'Step #' +
        String(nextStep) +
        ' Reduce-Scatter + All-Gather pass complete across 8 ranks (' +
        nextMeshPtr +
        ')',
    };
    log2 = {
      timestamp: ts2,
      callsign: '🟢 TELEMETRY',
      message:
        'Consensus VEC [' +
        ringMath.allGatherConsensus.map((n) => n.toFixed(2)).join(', ') +
        '] verified at ' +
        telemetry.throughputGbps.toLocaleString('en-US') +
        ' GB/s',
    };
  }

  return {
    ...prevState,
    corridorId: nextCorridorId,
    corridorLabel: profile.fullLabel,
    fabricThroughputGbps: telemetry.throughputGbps,
    saturationPct: telemetry.saturationPct,
    ringLatencyUs: telemetry.ringLatencyUs,
    activeRanksCount: nextCongestion ? 8 : 8,
    processedTokensUnits: nextTotalTokens,
    engineXpK: nextXpK,
    fabricStateLabel: nextCongestion
      ? 'Topology Re-Routed'
      : nextBurst
      ? 'Burst Overdrive Active'
      : 'Interconnect Active',
    meshPtrHex: nextMeshPtr,
    modeLabel: nextBurst ? 'BURST_OVERLAP' : nextCongestion ? 'BYPASS_RING' : 'TENSOR_PARALLEL',
    consensusVector: ringMath.allGatherConsensus,
    reduceScatterSumVector: ringMath.reduceScatterSum,
    asyncOverlapPct: telemetry.asyncOverlapPct,
    pipelineStallUs: telemetry.pipelineStallUs,
    stepCount: nextStep,
    congestionActive: nextCongestion,
    burstActive: nextBurst,
    ranks: updatedRanks,
    radioLogs: [log1, log2],
  };
}
