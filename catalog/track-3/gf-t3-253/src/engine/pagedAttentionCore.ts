import { z } from 'zod';

export type SyntheticCorridorId =
  | 'PAGED-CORRIDOR-ALPHA (CONTINUOUS-IN-FLIGHT-BATCHING-FABRIC · 15200-GB/S)'
  | 'PAGED-CORRIDOR-BRAVO (PAGED-ATTENTION-VIRTUAL-MEMORY-MAP)'
  | 'PAGED-CORRIDOR-GAMMA (ZERO-WASTE-BLOCK-ALLOCATION-ENGINE)'
  | 'PAGED-CORRIDOR-DELTA (FALLBACK-MONOLITHIC-KV-CACHE)';

export interface CorridorProfile {
  id: SyntheticCorridorId;
  shortTag: string;
  baseThroughputGbs: number;
  baseLatencyUs: number;
  baseFragPct: number;
  pagedEnabled: boolean;
  modeLabel: string;
}

export const SYNTHETIC_CORRIDORS: readonly CorridorProfile[] = [
  {
    id: 'PAGED-CORRIDOR-ALPHA (CONTINUOUS-IN-FLIGHT-BATCHING-FABRIC · 15200-GB/S)',
    shortTag: 'ALPHA · 15200-GB/S',
    baseThroughputGbs: 15200,
    baseLatencyUs: 0.01,
    baseFragPct: 0.0,
    pagedEnabled: true,
    modeLabel: 'PAGED_ATTENTION',
  },
  {
    id: 'PAGED-CORRIDOR-BRAVO (PAGED-ATTENTION-VIRTUAL-MEMORY-MAP)',
    shortTag: 'BRAVO · VMEM-MAP',
    baseThroughputGbs: 14850,
    baseLatencyUs: 0.01,
    baseFragPct: 0.0,
    pagedEnabled: true,
    modeLabel: 'PAGED_VMEM_MAP',
  },
  {
    id: 'PAGED-CORRIDOR-GAMMA (ZERO-WASTE-BLOCK-ALLOCATION-ENGINE)',
    shortTag: 'GAMMA · ZERO-WASTE',
    baseThroughputGbs: 15640,
    baseLatencyUs: 0.01,
    baseFragPct: 0.0,
    pagedEnabled: true,
    modeLabel: 'ZERO_WASTE_ALLOC',
  },
  {
    id: 'PAGED-CORRIDOR-DELTA (FALLBACK-MONOLITHIC-KV-CACHE)',
    shortTag: 'DELTA · MONOLITHIC',
    baseThroughputGbs: 6400,
    baseLatencyUs: 0.42,
    baseFragPct: 38.5,
    pagedEnabled: false,
    modeLabel: 'MONOLITHIC_KV',
  },
] as const;

export interface KVPhysicalBlock {
  blockIndex: number;
  blockId: string;
  label: string;
  hexPtr: string;
  tokens: number;
  capacity: number;
  refCount: number;
  fragPct: number;
  latencyMs: number;
  state: 'ALLOCATED' | 'FRAGMENTED' | 'FREE';
  locked: boolean;
  virtualPages: string[];
  mappedSequenceId: string;
  batchStatus: 'ACTIVE' | 'DEFRAG_REQ' | 'IDLE';
}

export interface InFlightSequenceRecord {
  sequenceId: string;
  promptTokens: number;
  generatedTokens: number;
  maxTokens: number;
  virtualBlocks: number[];
  physicalBlockTable: number[];
  status: 'IN_FLIGHT' | 'RETIRED';
  beamWidth: number;
}

export interface RadioLogEntry {
  timestamp: string;
  callsign: '🟢 CREW CHIEF' | '🟢 TELEMETRY' | '🔴 TELEMETRY' | '⚡ PIT WALL';
  message: string;
}

export interface EngineStateSnapshot {
  corridor: SyntheticCorridorId;
  modeLabel: string;
  meshPtr: string;
  throughputGbs: number;
  latencyUs: number;
  totalFragPct: number;
  activeBlocksCount: number;
  totalBlocksCount: number;
  processedTokens: number;
  engineXp: number;
  batchState: 'PagedActive' | 'FragAlert' | 'MonolithicFallback';
  fragmentationSpikeActive: boolean;
  stepCount: number;
  attentionVec: [number, number, number, number];
  blocks: KVPhysicalBlock[];
  sequences: InFlightSequenceRecord[];
  selectedBlockIndex: number;
  radioLogs: RadioLogEntry[];
}

const ForbiddenGlyphChar = String.fromCharCode(36);

export const GridSyncIngressSchema = z.object({
  corridor: z.string().min(3).max(160).refine(
    (val) => !val.includes(ForbiddenGlyphChar),
    { message: 'Zero-currency gate violation detected' }
  ).refine(
    (val) => {
      const lower = val.toLowerCase();
      return (
        !lower.includes('<script') &&
        !lower.includes('drop table') &&
        !lower.includes('union select') &&
        !lower.includes(';--') &&
        !lower.includes('vllm') &&
        !lower.includes('sglang') &&
        !lower.includes('radixattention')
      );
    },
    { message: 'GridSync zero-trust security or clean-room IP gate rejected input' }
  ),
  burstSize: z.number().int().min(1).max(64).optional(),
});

export function validateGridSyncInput(corridor: string, burstSize = 4): { valid: boolean; sanitizedCorridor: string } {
  const parsed = GridSyncIngressSchema.safeParse({ corridor, burstSize });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || 'Invalid GridSync payload');
  }
  return {
    valid: true,
    sanitizedCorridor: parsed.data.corridor.trim(),
  };
}

export function formatNumberWithCommas(value: number): string {
  return Math.round(value).toLocaleString('en-US');
}

export function formatEngineXp(xp: number): string {
  const kVal = xp / 1000;
  return '+' + kVal.toFixed(1) + 'k ENGINE XP';
}

export function createInitialBlocks(): KVPhysicalBlock[] {
  const sequenceAssignments = [
    'SEQ-ALPHA-101',
    'SEQ-ALPHA-101',
    'SEQ-ALPHA-101',
    'SEQ-BRAVO-102',
    'SEQ-BRAVO-102',
    'SEQ-BRAVO-102',
    'SEQ-GAMMA-103',
    'SEQ-GAMMA-103',
  ];

  const blocks: KVPhysicalBlock[] = [];
  for (let i = 0; i < 8; i++) {
    const ptrNum = 0x2000 + i * 0x0100;
    const hexPtr = '0x' + ptrNum.toString(16).toUpperCase();
    const vp0 = 'VP-' + String(i * 2).padStart(2, '0');
    const vp1 = 'VP-' + String(i * 2 + 1).padStart(2, '0');
    blocks.push({
      blockIndex: i,
      blockId: 'B' + String(i),
      label: 'Block ' + String(i) + ' (B' + String(i) + ')',
      hexPtr,
      tokens: 16,
      capacity: 16,
      refCount: 4,
      fragPct: 0.0,
      latencyMs: 0.08,
      state: 'ALLOCATED',
      locked: true,
      virtualPages: [vp0, vp1],
      mappedSequenceId: sequenceAssignments[i],
      batchStatus: 'ACTIVE',
    });
  }
  return blocks;
}

export function createInitialSequences(): InFlightSequenceRecord[] {
  return [
    {
      sequenceId: 'SEQ-ALPHA-101',
      promptTokens: 32,
      generatedTokens: 16,
      maxTokens: 64,
      virtualBlocks: [0, 1, 2],
      physicalBlockTable: [0, 1, 2],
      status: 'IN_FLIGHT',
      beamWidth: 4,
    },
    {
      sequenceId: 'SEQ-BRAVO-102',
      promptTokens: 32,
      generatedTokens: 16,
      maxTokens: 64,
      virtualBlocks: [0, 1, 2],
      physicalBlockTable: [3, 4, 5],
      status: 'IN_FLIGHT',
      beamWidth: 4,
    },
    {
      sequenceId: 'SEQ-GAMMA-103',
      promptTokens: 16,
      generatedTokens: 16,
      maxTokens: 48,
      virtualBlocks: [0, 1],
      physicalBlockTable: [6, 7],
      status: 'IN_FLIGHT',
      beamWidth: 4,
    },
  ];
}

export function createInitialEngineState(): EngineStateSnapshot {
  return {
    corridor: 'PAGED-CORRIDOR-ALPHA (CONTINUOUS-IN-FLIGHT-BATCHING-FABRIC · 15200-GB/S)',
    modeLabel: 'PAGED_ATTENTION',
    meshPtr: '0x1F8DC0',
    throughputGbs: 15200,
    latencyUs: 0.01,
    totalFragPct: 0.0,
    activeBlocksCount: 8,
    totalBlocksCount: 8,
    processedTokens: 3456000,
    engineXp: 75000,
    batchState: 'PagedActive',
    fragmentationSpikeActive: false,
    stepCount: 1,
    attentionVec: [1.51, 1.55, 1.52, 1.54],
    blocks: createInitialBlocks(),
    sequences: createInitialSequences(),
    selectedBlockIndex: 3,
    radioLogs: [
      {
        timestamp: '00:01.04',
        callsign: '🟢 CREW CHIEF',
        message: 'Continuous in-flight batching and PagedAttention engine initialized · 8 blocks linked',
      },
      {
        timestamp: '00:01.08',
        callsign: '🟢 TELEMETRY',
        message: 'PagedAttention KV cache throughput verified at 15,200 GB/s with zero fragmentation',
      },
    ],
  };
}

function formatRadioClock(stepCount: number, minorTick: number): string {
  const totalSeconds = stepCount * 2 + minorTick;
  const mins = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const secs = String(totalSeconds % 60).padStart(2, '0');
  const hundredths = String((stepCount * 7 + minorTick * 4) % 100).padStart(2, '0');
  return mins + ':' + secs + '.' + hundredths;
}

export function resolveVirtualToPhysicalBlock(
  state: EngineStateSnapshot,
  sequenceId: string,
  virtualBlockIdx: number
): KVPhysicalBlock {
  validateGridSyncInput(sequenceId, 1);
  const seq = state.sequences.find((s) => s.sequenceId === sequenceId);
  if (!seq) {
    throw new Error('Sequence not found in active in-flight table: ' + sequenceId);
  }
  if (virtualBlockIdx < 0 || virtualBlockIdx >= seq.physicalBlockTable.length) {
    throw new Error('Virtual block index out of bounds');
  }
  const physIdx = seq.physicalBlockTable[virtualBlockIdx];
  const block = state.blocks[physIdx];
  if (!block) {
    throw new Error('Physical block index invalid');
  }
  return block;
}

export function switchEngineCorridor(
  state: EngineStateSnapshot,
  newCorridor: SyntheticCorridorId
): EngineStateSnapshot {
  validateGridSyncInput(newCorridor, 1);
  const profile = SYNTHETIC_CORRIDORS.find((c) => c.id === newCorridor);
  if (!profile) {
    throw new Error('Unsupported synthetic corridor: ' + newCorridor);
  }

  const nextStep = state.stepCount + 1;
  const isMonolithic = !profile.pagedEnabled;

  const updatedBlocks: KVPhysicalBlock[] = state.blocks.map((blk) => {
    if (isMonolithic) {
      const monoFrag = Number((34.0 + (blk.blockIndex % 3) * 4.5).toFixed(1));
      return {
        ...blk,
        tokens: 12,
        fragPct: monoFrag,
        latencyMs: 0.42,
        state: 'FRAGMENTED',
        locked: false,
        batchStatus: 'DEFRAG_REQ',
      };
    }
    if (state.fragmentationSpikeActive) {
      return blk;
    }
    return {
      ...blk,
      tokens: 16,
      fragPct: 0.0,
      latencyMs: 0.08,
      state: 'ALLOCATED',
      locked: true,
      batchStatus: 'ACTIVE',
    };
  });

  const avgFrag = Number(
    (updatedBlocks.reduce((acc, b) => acc + b.fragPct, 0) / updatedBlocks.length).toFixed(1)
  );
  const effectiveThroughput = Math.round(profile.baseThroughputGbs * (1 - avgFrag / 200));

  return {
    ...state,
    corridor: profile.id,
    modeLabel: profile.modeLabel,
    throughputGbs: effectiveThroughput,
    latencyUs: state.fragmentationSpikeActive ? 0.19 : profile.baseLatencyUs,
    totalFragPct: avgFrag,
    batchState: isMonolithic
      ? 'MonolithicFallback'
      : state.fragmentationSpikeActive
      ? 'FragAlert'
      : 'PagedActive',
    stepCount: nextStep,
    blocks: updatedBlocks,
    radioLogs: [
      {
        timestamp: formatRadioClock(nextStep, 1),
        callsign: '🟢 CREW CHIEF',
        message: 'Corridor switched to ' + profile.shortTag + ' · virtual block tables synchronized',
      },
      {
        timestamp: formatRadioClock(nextStep, 2),
        callsign: isMonolithic ? '🔴 TELEMETRY' : '🟢 TELEMETRY',
        message:
          'KV cache throughput locked at ' +
          formatNumberWithCommas(effectiveThroughput) +
          ' GB/s · Frag: ' +
          avgFrag.toFixed(1) +
          '%',
      },
    ],
  };
}

export function triggerPagedBatchBurst(
  state: EngineStateSnapshot,
  burstRequests = 4
): EngineStateSnapshot {
  validateGridSyncInput(state.corridor, burstRequests);
  const nextStep = state.stepCount + 1;
  const profile =
    SYNTHETIC_CORRIDORS.find((c) => c.id === state.corridor) || SYNTHETIC_CORRIDORS[0];

  const updatedBlocks: KVPhysicalBlock[] = state.blocks.map((blk) => ({
    ...blk,
    tokens: 16,
    refCount: Math.min(16, blk.refCount + 1),
    fragPct: 0.0,
    latencyMs: 0.08,
    state: 'ALLOCATED',
    locked: true,
    batchStatus: 'ACTIVE',
  }));

  const burstTokenDelta = burstRequests * 32000;
  const nextTokens = state.processedTokens + burstTokenDelta;
  const nextXp = state.engineXp + burstRequests * 2500;
  const newSeqId = 'SEQ-BURST-' + String(100 + nextStep);

  const nextSequences: InFlightSequenceRecord[] = [
    ...state.sequences.slice(-3),
    {
      sequenceId: newSeqId,
      promptTokens: 32,
      generatedTokens: 16,
      maxTokens: 64,
      virtualBlocks: [0, 1, 2],
      physicalBlockTable: [nextStep % 8, (nextStep + 1) % 8, (nextStep + 2) % 8],
      status: 'IN_FLIGHT',
      beamWidth: 4,
    },
  ];

  const burstThroughput = Math.round(profile.baseThroughputGbs + burstRequests * 50);

  return {
    ...state,
    throughputGbs: burstThroughput,
    latencyUs: 0.01,
    totalFragPct: 0.0,
    activeBlocksCount: 8,
    processedTokens: nextTokens,
    engineXp: nextXp,
    batchState: 'PagedActive',
    fragmentationSpikeActive: false,
    stepCount: nextStep,
    attentionVec: [1.53, 1.57, 1.54, 1.56],
    blocks: updatedBlocks,
    sequences: nextSequences,
    radioLogs: [
      {
        timestamp: formatRadioClock(nextStep, 1),
        callsign: '⚡ PIT WALL',
        message:
          'In-flight batch burst injected (' +
          String(burstRequests) +
          ' sequences) · COW reference counts incremented across B0-B7',
      },
      {
        timestamp: formatRadioClock(nextStep, 2),
        callsign: '🟢 TELEMETRY',
        message:
          'Batch Throughput surged to ' +
          formatNumberWithCommas(burstThroughput) +
          ' GB/s · Processed Tokens: ' +
          formatNumberWithCommas(nextTokens) +
          ' Units',
      },
    ],
  };
}

export function toggleFragmentationSpike(state: EngineStateSnapshot): EngineStateSnapshot {
  const nextSpike = !state.fragmentationSpikeActive;
  const nextStep = state.stepCount + 1;
  const profile =
    SYNTHETIC_CORRIDORS.find((c) => c.id === state.corridor) || SYNTHETIC_CORRIDORS[0];

  if (nextSpike) {
    const spikedBlocks: KVPhysicalBlock[] = state.blocks.map((blk) => {
      const isOdd = blk.blockIndex % 2 === 1;
      const fragVal = Number((12.5 + (blk.blockIndex % 4) * 3.5).toFixed(1));
      return {
        ...blk,
        tokens: isOdd ? 11 : 14,
        fragPct: fragVal,
        latencyMs: 0.24,
        state: isOdd ? 'FRAGMENTED' : 'ALLOCATED',
        locked: !isOdd,
        batchStatus: isOdd ? 'DEFRAG_REQ' : 'ACTIVE',
      };
    });

    const avgFrag = Number(
      (spikedBlocks.reduce((acc, b) => acc + b.fragPct, 0) / spikedBlocks.length).toFixed(1)
    );
    const degradedTp = Math.round(profile.baseThroughputGbs * (1 - avgFrag / 140));

    return {
      ...state,
      throughputGbs: degradedTp,
      latencyUs: 0.19,
      totalFragPct: avgFrag,
      activeBlocksCount: 4,
      batchState: 'FragAlert',
      fragmentationSpikeActive: true,
      stepCount: nextStep,
      attentionVec: [1.18, 1.24, 1.15, 1.21],
      blocks: spikedBlocks,
      radioLogs: [
        {
          timestamp: formatRadioClock(nextStep, 1),
          callsign: '🔴 TELEMETRY',
          message:
            'Memory fragmentation spike injected (' +
            avgFrag.toFixed(1) +
            '% waste) · non-contiguous KV pages detected',
        },
        {
          timestamp: formatRadioClock(nextStep, 2),
          callsign: '⚡ PIT WALL',
          message:
            'Execute PagedAttention Pass or Defrag toggle to remap virtual block tables to 0.0% waste',
        },
      ],
    };
  }

  const restoredBlocks: KVPhysicalBlock[] = state.blocks.map((blk) => ({
    ...blk,
    tokens: 16,
    fragPct: 0.0,
    latencyMs: 0.08,
    state: 'ALLOCATED',
    locked: true,
    batchStatus: 'ACTIVE',
  }));

  return {
    ...state,
    throughputGbs: profile.baseThroughputGbs,
    latencyUs: 0.01,
    totalFragPct: 0.0,
    activeBlocksCount: 8,
    batchState: 'PagedActive',
    fragmentationSpikeActive: false,
    stepCount: nextStep,
    attentionVec: [1.51, 1.55, 1.52, 1.54],
    blocks: restoredBlocks,
    radioLogs: [
      {
        timestamp: formatRadioClock(nextStep, 1),
        callsign: '🟢 CREW CHIEF',
        message: 'Sub-microsecond block defragmentation complete · 8/8 physical KV blocks locked',
      },
      {
        timestamp: formatRadioClock(nextStep, 2),
        callsign: '🟢 TELEMETRY',
        message:
          'Fragmentation restored to 0.0% · Throughput locked at ' +
          formatNumberWithCommas(profile.baseThroughputGbs) +
          ' GB/s',
      },
    ],
  };
}

export function stepPagedAttentionPass(state: EngineStateSnapshot): EngineStateSnapshot {
  const nextStep = state.stepCount + 1;
  const profile =
    SYNTHETIC_CORRIDORS.find((c) => c.id === state.corridor) || SYNTHETIC_CORRIDORS[0];

  let retiredCount = 0;
  const progressedSequences: InFlightSequenceRecord[] = [];

  for (const seq of state.sequences) {
    const nextGen = seq.generatedTokens + 16;
    if (seq.promptTokens + nextGen >= seq.maxTokens) {
      retiredCount += 1;
    } else {
      progressedSequences.push({
        ...seq,
        generatedTokens: nextGen,
        status: 'IN_FLIGHT',
      });
    }
  }

  while (progressedSequences.length < 3) {
    const idx = nextStep + progressedSequences.length;
    progressedSequences.push({
      sequenceId: 'SEQ-INFLIGHT-' + String(100 + idx),
      promptTokens: 16,
      generatedTokens: 16,
      maxTokens: 64,
      virtualBlocks: [0, 1, 2],
      physicalBlockTable: [idx % 8, (idx + 1) % 8, (idx + 2) % 8],
      status: 'IN_FLIGHT',
      beamWidth: 4,
    });
  }

  const updatedBlocks: KVPhysicalBlock[] = state.blocks.map((blk, idx) => {
    const mappedSeq = progressedSequences[idx % progressedSequences.length];
    return {
      ...blk,
      tokens: 16,
      fragPct: 0.0,
      latencyMs: 0.08,
      state: 'ALLOCATED',
      locked: true,
      mappedSequenceId: mappedSeq ? mappedSeq.sequenceId : blk.mappedSequenceId,
      batchStatus: 'ACTIVE',
    };
  });

  const nextTokens = state.processedTokens + 64000;
  const nextXp = state.engineXp + 5000;
  const ptrNum = 0x1f8dc0 + nextStep * 0x40;
  const nextPtr = '0x' + ptrNum.toString(16).toUpperCase();
  const delta = Number(((nextStep % 4) * 0.01).toFixed(2));

  return {
    ...state,
    meshPtr: nextPtr,
    throughputGbs: profile.baseThroughputGbs,
    latencyUs: 0.01,
    totalFragPct: 0.0,
    activeBlocksCount: 8,
    processedTokens: nextTokens,
    engineXp: nextXp,
    batchState: 'PagedActive',
    fragmentationSpikeActive: false,
    stepCount: nextStep,
    attentionVec: [
      Number((1.51 + delta).toFixed(2)),
      Number((1.55 + delta).toFixed(2)),
      Number((1.52 + delta).toFixed(2)),
      Number((1.54 + delta).toFixed(2)),
    ],
    blocks: updatedBlocks,
    sequences: progressedSequences,
    radioLogs: [
      {
        timestamp: formatRadioClock(nextStep, 1),
        callsign: '🟢 CREW CHIEF',
        message:
          'Iteration pass #' +
          String(nextStep) +
          ' complete · ' +
          String(retiredCount) +
          ' completed sequences retired, new in-flight requests slotted',
      },
      {
        timestamp: formatRadioClock(nextStep, 2),
        callsign: '🟢 TELEMETRY',
        message:
          'Virtual-to-physical block tables verified · 0.0% fragmentation · ' +
          formatNumberWithCommas(nextTokens) +
          ' Units processed',
      },
    ],
  };
}

export function flushKvCacheBuffers(): EngineStateSnapshot {
  const initial = createInitialEngineState();
  return {
    ...initial,
    radioLogs: [
      {
        timestamp: '00:01.00',
        callsign: '⚡ PIT WALL',
        message: 'KV cache buffers flushed and physical block tables B0-B7 re-zeroed to baseline',
      },
      {
        timestamp: '00:01.04',
        callsign: '🟢 TELEMETRY',
        message: 'PagedAttention KV cache throughput verified at 15,200 GB/s with zero fragmentation',
      },
    ],
  };
}
