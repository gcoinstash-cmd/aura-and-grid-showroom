/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * GF-T3-291 Clean-Room Deterministic Ring-Attention & Context Parallelism Engine
 * Zero Copyleft · Zero Proprietary Marks · Zero-Dollar Gate Verified
 */

export type CorridorId =
  | 'CTX-CORRIDOR-ALPHA (DYNAMIC-CONTEXT-PARALLELISM-FABRIC · 46400-GB/S)'
  | 'CTX-CORRIDOR-BRAVO (RING-ATTENTION-KV-CHUNK-PARTITIONING-ENGINE)'
  | 'CTX-CORRIDOR-GAMMA (NON-BLOCKING-PEER-TO-PEER-KV-ROUTER)'
  | 'CTX-CORRIDOR-DELTA (FALLBACK-TRUNCATED-SEQUENCE-PASS)';

export const CORRIDORS: CorridorId[] = [
  'CTX-CORRIDOR-ALPHA (DYNAMIC-CONTEXT-PARALLELISM-FABRIC · 46400-GB/S)',
  'CTX-CORRIDOR-BRAVO (RING-ATTENTION-KV-CHUNK-PARTITIONING-ENGINE)',
  'CTX-CORRIDOR-GAMMA (NON-BLOCKING-PEER-TO-PEER-KV-ROUTER)',
  'CTX-CORRIDOR-DELTA (FALLBACK-TRUNCATED-SEQUENCE-PASS)',
];

export type TabId = 'Mesh' | 'Ctx' | 'Ring' | 'Stats' | 'APA';

export interface ShardTelemetry {
  index: number;
  code: string;
  title: string;
  hexPtr: string;
  inspectorPtr: string;
  tokensLabel: string;
  tokensNumeric: number;
  chunkLabel: string;
  chunkNumeric: number;
  latencyLabel: string;
  latencyMs: number;
  stateLabel: string;
  syncPct: number;
  ctxHealth: 'OK' | 'REROUTE' | 'BURST';
  sourceRank: number;
  targetRank: number;
  ringSoftmaxWeight: number;
  attentionOutputNorm: number;
}

export interface EngineState {
  corridor: CorridorId;
  activeTab: TabId;
  selectedShardIndex: number;
  throughputGbs: number;
  throughputFormatted: string;
  saturationPct: number;
  ringLatencyUs: number;
  ringLatencyFormatted: string;
  activeShardsCount: number;
  totalShardsCount: number;
  processedTokens: number;
  processedTokensFormatted: string;
  engineXpFormatted: string;
  contextStateLabel: string;
  ringStepCount: number;
  stallSpikeActive: boolean;
  burstModeActive: boolean;
  meshPtr: string;
  modeTag: string;
  attentionVector: [number, number, number, number];
  shards: ShardTelemetry[];
  radioLogs: string[];
}

/**
 * Deterministic Softmax & Ring-Attention Partitioning Solver:
 * A_ring = sum_{r=0..R-1} Softmax(Q * K_{(i-r) mod R}^T) * V_{(i-r) mod R}
 */
export function computeRingAttentionBlock(
  rankIndex: number,
  rotationStep: number,
  totalRanks: number = 8,
  stallActive: boolean = false,
  burstActive: boolean = false
): {
  sourceRank: number;
  targetRank: number;
  softmaxWeight: number;
  outputNorm: number;
} {
  const R = Math.max(1, totalRanks);
  const sourceRank = ((rankIndex - rotationStep) % R + R) % R;
  const targetRank = (rankIndex + 1) % R;

  // Deterministic Q, K, V projections per rank and step
  const qVal = 1.15 + ((rankIndex * 0.07 + rotationStep * 0.03) % 0.45);
  const logits: number[] = [];
  for (let r = 0; r < R; r++) {
    const permRank = ((rankIndex - r) % R + R) % R;
    const kVal = 1.1 + ((permRank * 0.09 + rotationStep * 0.02) % 0.5);
    const scale = stallActive && permRank === 2 ? 0.65 : burstActive ? 1.18 : 1.0;
    logits.push(qVal * kVal * scale);
  }

  const maxLogit = Math.max(...logits);
  const expScores = logits.map((x) => Math.exp(x - maxLogit));
  const sumExp = expScores.reduce((acc, v) => acc + v, 0);
  const weights = expScores.map((e) => e / sumExp);

  let ringAccum = 0;
  for (let r = 0; r < R; r++) {
    const permRank = ((rankIndex - r) % R + R) % R;
    const vVal = 5.15 + ((permRank * 0.035 + rotationStep * 0.015) % 0.22);
    ringAccum += weights[r] * vVal;
  }

  const currentRankWeight = Number((weights[rotationStep % R] * 100).toFixed(2));
  const outputNorm = Number(ringAccum.toFixed(2));

  return {
    sourceRank,
    targetRank,
    softmaxWeight: currentRankWeight,
    outputNorm,
  };
}

export function formatNumberWithCommas(val: number): string {
  return Math.round(val)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

const HEX_BASE_ADDRESSES = [
  '0x18000',
  '0x18010',
  '0x18020',
  '0x18030',
  '0x18040',
  '0x18050',
  '0x18060',
  '0x18070',
];

export function buildShards(
  rotationStep: number,
  stallActive: boolean,
  burstActive: boolean,
  corridor: CorridorId
): ShardTelemetry[] {
  const isFallback = corridor.includes('CTX-CORRIDOR-DELTA');
  const shards: ShardTelemetry[] = [];

  for (let i = 0; i < 8; i++) {
    const ringMath = computeRingAttentionBlock(i, rotationStep, 8, stallActive, burstActive);
    const isStalledRank = stallActive && (i === 2 || i === 5);

    const tokensM = burstActive ? 2 : 1;
    const chunkK = burstActive ? 256 : isFallback ? 64 : 128;
    const baseLatency = isStalledRank ? 0.09 : burstActive ? 0.01 : 0.02;

    const stateLabel = isStalledRank
      ? 'REROUTING · P2P'
      : burstActive
      ? 'BURST · LOCKED'
      : 'ROUTING · LOCKED';

    const syncPct = isStalledRank ? 98 : 100;
    const ctxHealth: 'OK' | 'REROUTE' | 'BURST' = isStalledRank
      ? 'REROUTE'
      : burstActive
      ? 'BURST'
      : 'OK';

    shards.push({
      index: i,
      code: 'X' + String(i),
      title: 'Shard ' + String(i) + ' (X' + String(i) + ')',
      hexPtr: HEX_BASE_ADDRESSES[i],
      inspectorPtr: HEX_BASE_ADDRESSES[i],
      tokensLabel: 'TOK: ' + String(tokensM) + 'M',
      tokensNumeric: tokensM * 1000000,
      chunkLabel: 'CHUNK: ' + String(chunkK) + 'K',
      chunkNumeric: chunkK * 1024,
      latencyLabel: baseLatency.toFixed(2) + 'ms',
      latencyMs: baseLatency,
      stateLabel,
      syncPct,
      ctxHealth,
      sourceRank: ringMath.sourceRank,
      targetRank: ringMath.targetRank,
      ringSoftmaxWeight: ringMath.softmaxWeight,
      attentionOutputNorm: ringMath.outputNorm,
    });
  }

  return shards;
}

export function createInitialEngineState(): EngineState {
  const corridor: CorridorId =
    'CTX-CORRIDOR-ALPHA (DYNAMIC-CONTEXT-PARALLELISM-FABRIC · 46400-GB/S)';
  const shards = buildShards(0, false, false, corridor);

  return {
    corridor,
    activeTab: 'Mesh',
    selectedShardIndex: 3, // Default X3 per inspector strip spec
    throughputGbs: 46400,
    throughputFormatted: '46,400 GB/s',
    saturationPct: 96,
    ringLatencyUs: 0.01,
    ringLatencyFormatted: '0.01 µs',
    activeShardsCount: 8,
    totalShardsCount: 8,
    processedTokens: 8576000,
    processedTokensFormatted: '8,576,000 UNITS',
    engineXpFormatted: '+75.0k ENGINE XP',
    contextStateLabel: 'Context State: Parallel Active',
    ringStepCount: 0,
    stallSpikeActive: false,
    burstModeActive: false,
    meshPtr: '0x17F8DC0',
    modeTag: 'CONTEXT_PARALLEL',
    attentionVector: [5.21, 5.25, 5.22, 5.24],
    shards,
    radioLogs: [
      '[00:01.04] 🟢 CREW CHIEF: Asynchronous context parallelism and ring-attention KV-chunk partitioning engine initialized · 8 shards linked',
      '[00:01.08] 🟢 TELEMETRY: Ring-attention chunk partitioning verified at 46,400 GB/s with zero memory overflow',
    ],
  };
}
