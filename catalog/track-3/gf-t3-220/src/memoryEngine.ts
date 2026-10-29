import {
  PhysicalBlock,
  LogicalSequence,
  LogicalBlockEntry,
  TelemetryMetrics,
  EventLogEntry,
  MemoryCorridor
} from './types';

export const TOTAL_PHYSICAL_BLOCKS = 64;
export const TOKENS_PER_BLOCK = 16;
export const BYTES_PER_BLOCK = 4096; // 16 tokens * 32 heads * 64 dim * 2 bytes (fp16)

export interface EngineState {
  blocks: PhysicalBlock[];
  sequences: LogicalSequence[];
  selectedBlockId: number | null;
  selectedSequenceId: string | null;
  activeCorridor: MemoryCorridor;
  logs: EventLogEntry[];
  simulatedTimeMs: number;
}

export function createInitialEngineState(): EngineState {
  const blocks: PhysicalBlock[] = [];
  for (let i = 0; i < TOTAL_PHYSICAL_BLOCKS; i++) {
    blocks.push({
      blockId: i,
      state: 'free',
      refCount: 0,
      sequenceIds: [],
      tokensOccupied: 0,
      maxTokens: TOKENS_PER_BLOCK,
      kvBytes: BYTES_PER_BLOCK,
      lastAccessedMs: 100,
      corridor: 'MEM-POOL-ALPHA (VIRTUAL-PAGE-TABLE · 16-TOKEN-BLOCKS)',
      generation: 1
    });
  }

  // Seed nominal realistic state matching Track 3 benchmark:
  // Sequences:
  // SEQ-ALPHA-01: 68 tokens -> 5 blocks (scattered non-contiguous)
  // SEQ-BETA-02: 48 tokens -> 3 blocks
  // BEAM-SEARCH-0, 1, 2, 3: sharing 4 prompt blocks (refCount = 4), diverged terminal blocks
  // SEQ-SWAP-01: Swapped to host buffer
  const initialSequences: LogicalSequence[] = [];

  // Sequence ALPHA-01
  const alphaBlocks = [2, 7, 14, 21, 35];
  const alphaPageTable: LogicalBlockEntry[] = alphaBlocks.map((physId, idx) => {
    const filled = idx === 4 ? 4 : 16;
    return {
      logicalBlockIndex: idx,
      physicalBlockId: physId,
      isCoW: false,
      tokensFilled: filled
    };
  });
  alphaBlocks.forEach((bId, idx) => {
    const blk = blocks[bId];
    blk.state = 'allocated';
    blk.refCount = 1;
    blk.sequenceIds = ['SEQ-ALPHA-01'];
    blk.tokensOccupied = idx === 4 ? 4 : 16;
    blk.corridor = 'MEM-POOL-ALPHA (VIRTUAL-PAGE-TABLE · 16-TOKEN-BLOCKS)';
  });
  initialSequences.push({
    sequenceId: 'SEQ-ALPHA-01',
    name: 'Inference Decoder Thread 0',
    phase: 'decode',
    tokenCount: 68,
    pageTable: alphaPageTable,
    parentSequenceId: null,
    priority: 100,
    createdAtMs: 120,
    lastActiveMs: 450
  });

  // Sequence BETA-02
  const betaBlocks = [5, 12, 28];
  const betaPageTable: LogicalBlockEntry[] = betaBlocks.map((physId, idx) => {
    return {
      logicalBlockIndex: idx,
      physicalBlockId: physId,
      isCoW: false,
      tokensFilled: 16
    };
  });
  betaBlocks.forEach((bId) => {
    const blk = blocks[bId];
    blk.state = 'allocated';
    blk.refCount = 1;
    blk.sequenceIds = ['SEQ-BETA-02'];
    blk.tokensOccupied = 16;
    blk.corridor = 'MEM-POOL-ALPHA (VIRTUAL-PAGE-TABLE · 16-TOKEN-BLOCKS)';
  });
  initialSequences.push({
    sequenceId: 'SEQ-BETA-02',
    name: 'Context Pre-Fill Engine',
    phase: 'prompt',
    tokenCount: 48,
    pageTable: betaPageTable,
    parentSequenceId: null,
    priority: 85,
    createdAtMs: 240,
    lastActiveMs: 460
  });

  // Beam Search 4x Cluster sharing prompt blocks [18, 19, 20, 22] (refCount = 4)
  const sharedPromptBlocks = [18, 19, 20, 22];
  sharedPromptBlocks.forEach((bId) => {
    const blk = blocks[bId];
    blk.state = 'shared_cow';
    blk.refCount = 4;
    blk.sequenceIds = ['BEAM-0', 'BEAM-1', 'BEAM-2', 'BEAM-3'];
    blk.tokensOccupied = 16;
    blk.corridor = 'MEM-POOL-BRAVO (KV-BLOCK-ALLOCATOR · ZERO-COPY-COW)';
  });

  // Unique diverged blocks for each beam
  const beamDiverged: { [key: string]: number[] } = {
    'BEAM-0': [30, 31],
    'BEAM-1': [33, 34],
    'BEAM-2': [38, 39],
    'BEAM-3': [42, 43]
  };

  Object.entries(beamDiverged).forEach(([beamId, bIds]) => {
    const pageTable: LogicalBlockEntry[] = [];
    sharedPromptBlocks.forEach((pId, idx) => {
      pageTable.push({
        logicalBlockIndex: idx,
        physicalBlockId: pId,
        isCoW: true,
        tokensFilled: 16
      });
    });
    bIds.forEach((pId, idx) => {
      const blk = blocks[pId];
      blk.state = 'allocated';
      blk.refCount = 1;
      blk.sequenceIds = [beamId];
      blk.tokensOccupied = idx === 1 ? 12 : 16;
      blk.corridor = 'MEM-POOL-BRAVO (KV-BLOCK-ALLOCATOR · ZERO-COPY-COW)';

      pageTable.push({
        logicalBlockIndex: sharedPromptBlocks.length + idx,
        physicalBlockId: pId,
        isCoW: false,
        tokensFilled: idx === 1 ? 12 : 16
      });
    });

    initialSequences.push({
      sequenceId: beamId,
      name: 'Parallel Sampling ' + beamId,
      phase: 'decode',
      tokenCount: 64 + 28,
      pageTable: pageTable,
      parentSequenceId: 'SEQ-PROMPT-ROOT',
      priority: 90,
      createdAtMs: 300,
      lastActiveMs: 480
    });
  });

  // Additional batch allocations to fill realistic nominal ~94.2% block saturation
  const batchAllocations = [
    { id: 'BATCH-WORKER-0', blocks: [1, 3, 4, 6, 8, 9, 10, 11] },
    { id: 'BATCH-WORKER-1', blocks: [13, 15, 16, 17, 23, 24, 25, 26] },
    { id: 'BATCH-WORKER-2', blocks: [27, 29, 32, 36, 37, 40, 41, 44] },
    { id: 'BATCH-WORKER-3', blocks: [46, 47, 48, 49, 50, 51, 53, 54] },
    { id: 'BATCH-WORKER-4', blocks: [55, 56, 57, 58, 59, 60, 61, 62] }
  ];

  batchAllocations.forEach((item, itemIdx) => {
    const pt: LogicalBlockEntry[] = [];
    item.blocks.forEach((bId, idx) => {
      const blk = blocks[bId];
      blk.state = 'allocated';
      blk.refCount = 1;
      blk.sequenceIds = [item.id];
      blk.tokensOccupied = 16;
      blk.corridor = 'MEM-POOL-ALPHA (VIRTUAL-PAGE-TABLE · 16-TOKEN-BLOCKS)';
      pt.push({
        logicalBlockIndex: idx,
        physicalBlockId: bId,
        isCoW: false,
        tokensFilled: 16
      });
    });

    initialSequences.push({
      sequenceId: item.id,
      name: 'Batch Vector Stream ' + itemIdx,
      phase: 'decode',
      tokenCount: item.blocks.length * 16,
      pageTable: pt,
      parentSequenceId: null,
      priority: 70,
      createdAtMs: 180 + itemIdx * 20,
      lastActiveMs: 420
    });
  });

  // Slot 63 marked swapped to host virtual memory (GAMMA corridor)
  blocks[63].state = 'swapped';
  blocks[63].refCount = 1;
  blocks[63].sequenceIds = ['SEQ-EVICTED-01'];
  blocks[63].tokensOccupied = 16;
  blocks[63].corridor = 'MEM-POOL-GAMMA (SWAP-EVICTION-QUEUE)';

  // Slots 0, 45, 52 left as free blocks
  blocks[0].state = 'free';
  blocks[45].state = 'free';
  blocks[52].state = 'free';

  const initialLogs: EventLogEntry[] = [
    {
      id: 'EVT-01',
      timestamp: '00:00:00.100',
      level: 'info',
      corridor: 'MEM-POOL-ALPHA',
      message: 'Initialized physical memory partition with 64 blocks (1,024 token slots).'
    },
    {
      id: 'EVT-02',
      timestamp: '00:00:00.240',
      level: 'info',
      corridor: 'MEM-POOL-ALPHA',
      message: 'Virtual page table registered SEQ-ALPHA-01 (68 tokens, 5 non-contiguous blocks).'
    },
    {
      id: 'EVT-03',
      timestamp: '00:00:00.320',
      level: 'success',
      corridor: 'MEM-POOL-BRAVO',
      message: 'Zero-Copy COW Fork: Spanned 4 parallel beams sharing blocks [18, 19, 20, 22] (refCount = 4).'
    },
    {
      id: 'EVT-04',
      timestamp: '00:00:00.410',
      level: 'info',
      corridor: 'MEM-POOL-GAMMA',
      message: 'Preemption controller calibrated swap queue with High Watermark 95.0% / Low Watermark 80.0%.'
    }
  ];

  return {
    blocks,
    sequences: initialSequences,
    selectedBlockId: 18,
    selectedSequenceId: 'BEAM-0',
    activeCorridor: 'MEM-POOL-ALPHA (VIRTUAL-PAGE-TABLE · 16-TOKEN-BLOCKS)',
    logs: initialLogs,
    simulatedTimeMs: 480
  };
}

export function computeTelemetry(state: EngineState): TelemetryMetrics {
  const totalBlocks = state.blocks.length;
  let activeCount = 0;
  let freeCount = 0;
  let sharedCowCount = 0;
  let swappedCount = 0;
  let totalOccupiedTokens = 0;
  let totalAllocatedCapacityTokens = 0;
  let cowSavedTokens = 0;

  state.blocks.forEach((blk) => {
    if (blk.state === 'free') {
      freeCount++;
    } else if (blk.state === 'swapped') {
      swappedCount++;
    } else {
      activeCount++;
      totalOccupiedTokens += blk.tokensOccupied;
      totalAllocatedCapacityTokens += blk.maxTokens;
      if (blk.state === 'shared_cow') {
        sharedCowCount++;
        if (blk.refCount > 1) {
          cowSavedTokens += (blk.refCount - 1) * blk.tokensOccupied;
        }
      }
    }
  });

  const blockUtilizationPct = totalBlocks > 0
    ? Number((((totalBlocks - freeCount) / totalBlocks) * 100).toFixed(1))
    : 0;

  // Internal fragmentation is the unused fraction of allocated blocks
  const wastedTokens = totalAllocatedCapacityTokens - totalOccupiedTokens;
  const internalFragmentationPct = totalAllocatedCapacityTokens > 0
    ? Number(((wastedTokens / totalAllocatedCapacityTokens) * 100).toFixed(1))
    : 0;

  // In PagedAttention, external fragmentation is mathematically 0.0%
  const externalFragmentationPct = 0.0;

  // Deterministic realistic allocator latency
  const allocatorLatencyMs = 0.45;

  // Institutional scaled token throughput: 16,384 base scaled metric
  const allocatedTokens = 16384 + (totalOccupiedTokens * 16);

  return {
    blockUtilizationPct,
    internalFragmentationPct,
    allocatorLatencyMs,
    allocatedTokens,
    totalBlocks,
    activeBlocksCount: activeCount,
    freeBlocksCount: freeCount,
    sharedCowBlocksCount: sharedCowCount,
    swappedBlocksCount: swappedCount,
    externalFragmentationPct,
    cowSavingsTokens: cowSavedTokens,
    swapQueueDepth: swappedCount,
    preemptionEvents: swappedCount > 0 ? swappedCount * 2 : 0
  };
}

// Interactive Action: Allocate New Logical Sequence
export function allocateSequenceAction(
  state: EngineState,
  seqName: string,
  tokenCount: number = 32
): EngineState {
  const neededBlocks = Math.ceil(tokenCount / TOKENS_PER_BLOCK);
  const freeBlocks = state.blocks.filter((b) => b.state === 'free');

  if (freeBlocks.length < neededBlocks) {
    const newLog: EventLogEntry = {
      id: 'EVT-' + (state.logs.length + 1),
      timestamp: '00:00:0' + (state.simulatedTimeMs / 1000).toFixed(3),
      level: 'alert',
      corridor: state.activeCorridor,
      message: 'Allocation rejected: Insufficient free blocks. Needed ' + neededBlocks + ', available ' + freeBlocks.length + '.'
    };
    return {
      ...state,
      logs: [newLog, ...state.logs]
    };
  }

  // Allocate non-contiguous scattered free blocks
  const chosenBlocks = freeBlocks.slice(0, neededBlocks);
  const newSeqId = 'SEQ-ALLOC-' + Math.floor(Math.random() * 900 + 100);

  const updatedBlocks = [...state.blocks];
  const pageTable: LogicalBlockEntry[] = [];

  let tokensRemaining = tokenCount;
  chosenBlocks.forEach((blk, idx) => {
    const tokensInThisBlock = Math.min(tokensRemaining, TOKENS_PER_BLOCK);
    tokensRemaining -= tokensInThisBlock;

    updatedBlocks[blk.blockId] = {
      ...blk,
      state: 'allocated',
      refCount: 1,
      sequenceIds: [newSeqId],
      tokensOccupied: tokensInThisBlock,
      lastAccessedMs: state.simulatedTimeMs + 10,
      corridor: 'MEM-POOL-ALPHA (VIRTUAL-PAGE-TABLE · 16-TOKEN-BLOCKS)'
    };

    pageTable.push({
      logicalBlockIndex: idx,
      physicalBlockId: blk.blockId,
      isCoW: false,
      tokensFilled: tokensInThisBlock
    });
  });

  const newSequence: LogicalSequence = {
    sequenceId: newSeqId,
    name: seqName || 'Dynamic Worker ' + newSeqId,
    phase: 'decode',
    tokenCount: tokenCount,
    pageTable: pageTable,
    parentSequenceId: null,
    priority: 80,
    createdAtMs: state.simulatedTimeMs,
    lastActiveMs: state.simulatedTimeMs + 10
  };

  const newLog: EventLogEntry = {
    id: 'EVT-' + (state.logs.length + 1),
    timestamp: '00:00:0' + (state.simulatedTimeMs / 1000).toFixed(3),
    level: 'success',
    corridor: 'MEM-POOL-ALPHA',
    message: 'Allocated ' + tokenCount + ' tokens (' + neededBlocks + ' non-contiguous blocks: [' + chosenBlocks.map(b => b.blockId).join(', ') + ']) for ' + newSeqId + '.'
  };

  return {
    ...state,
    blocks: updatedBlocks,
    sequences: [newSequence, ...state.sequences],
    selectedSequenceId: newSeqId,
    selectedBlockId: chosenBlocks[0].blockId,
    logs: [newLog, ...state.logs],
    simulatedTimeMs: state.simulatedTimeMs + 15
  };
}

// Interactive Action: Zero-Copy Copy-on-Write Fork
export function forkSequenceAction(
  state: EngineState,
  targetSeqId?: string
): EngineState {
  const seqToFork = state.sequences.find(
    (s) => s.sequenceId === (targetSeqId || state.selectedSequenceId)
  ) || state.sequences[0];

  if (!seqToFork) return state;

  const childSeqId = 'FORK-' + seqToFork.sequenceId + '-' + Math.floor(Math.random() * 90 + 10);
  const updatedBlocks = [...state.blocks];

  // Deep copy page table pointers, increment ref count of physical blocks
  const newPageTable: LogicalBlockEntry[] = seqToFork.pageTable.map((entry) => {
    const physId = entry.physicalBlockId;
    const blk = updatedBlocks[physId];
    updatedBlocks[physId] = {
      ...blk,
      refCount: blk.refCount + 1,
      state: 'shared_cow',
      sequenceIds: Array.from(new Set([...blk.sequenceIds, childSeqId])),
      corridor: 'MEM-POOL-BRAVO (KV-BLOCK-ALLOCATOR · ZERO-COPY-COW)'
    };
    return {
      ...entry,
      isCoW: true
    };
  });

  const childSeq: LogicalSequence = {
    sequenceId: childSeqId,
    name: 'COW Fork of ' + seqToFork.sequenceId,
    phase: 'decode',
    tokenCount: seqToFork.tokenCount,
    pageTable: newPageTable,
    parentSequenceId: seqToFork.sequenceId,
    priority: seqToFork.priority,
    createdAtMs: state.simulatedTimeMs,
    lastActiveMs: state.simulatedTimeMs + 5
  };

  const newLog: EventLogEntry = {
    id: 'EVT-' + (state.logs.length + 1),
    timestamp: '00:00:0' + (state.simulatedTimeMs / 1000).toFixed(3),
    level: 'success',
    corridor: 'MEM-POOL-BRAVO',
    message: 'Zero-Copy COW Fork: Cloned ' + seqToFork.sequenceId + ' -> ' + childSeqId + ' in 0.02 ms (Zero physical copy, ref counts incremented).'
  };

  return {
    ...state,
    blocks: updatedBlocks,
    sequences: [childSeq, ...state.sequences],
    selectedSequenceId: childSeqId,
    selectedBlockId: newPageTable[0]?.physicalBlockId || state.selectedBlockId,
    logs: [newLog, ...state.logs],
    simulatedTimeMs: state.simulatedTimeMs + 10
  };
}

// Interactive Action: Autoregressive Token Step (Advance Decode Phase)
export function stepAutoregressiveAction(state: EngineState): EngineState {
  const activeSeq = state.sequences.find(
    (s) => s.sequenceId === state.selectedSequenceId && s.phase === 'decode'
  ) || state.sequences.find((s) => s.phase === 'decode');

  if (!activeSeq) {
    const newLog: EventLogEntry = {
      id: 'EVT-' + (state.logs.length + 1),
      timestamp: '00:00:0' + (state.simulatedTimeMs / 1000).toFixed(3),
      level: 'warn',
      corridor: 'MEM-POOL-ALPHA',
      message: 'No active decode sequence found to step.'
    };
    return {
      ...state,
      logs: [newLog, ...state.logs]
    };
  }

  const updatedBlocks = [...state.blocks];
  const lastEntry = activeSeq.pageTable[activeSeq.pageTable.length - 1];
  let updatedPageTable = [...activeSeq.pageTable];
  let logMsg = '';

  if (lastEntry) {
    const currBlock = updatedBlocks[lastEntry.physicalBlockId];

    // Case A: Block is shared (COW trigger!)
    if (currBlock.refCount > 1) {
      // Find a free block to unshare
      const freeBlock = updatedBlocks.find((b) => b.state === 'free');
      if (freeBlock) {
        // Clone block to unshare
        updatedBlocks[freeBlock.blockId] = {
          ...freeBlock,
          state: 'allocated',
          refCount: 1,
          sequenceIds: [activeSeq.sequenceId],
          tokensOccupied: Math.min(currBlock.tokensOccupied + 1, TOKENS_PER_BLOCK),
          corridor: 'MEM-POOL-BRAVO (KV-BLOCK-ALLOCATOR · ZERO-COPY-COW)'
        };

        // Decrement old block ref count
        updatedBlocks[currBlock.blockId] = {
          ...currBlock,
          refCount: currBlock.refCount - 1,
          sequenceIds: currBlock.sequenceIds.filter((id) => id !== activeSeq.sequenceId),
          state: currBlock.refCount - 1 === 1 ? 'allocated' : 'shared_cow'
        };

        updatedPageTable[updatedPageTable.length - 1] = {
          ...lastEntry,
          physicalBlockId: freeBlock.blockId,
          isCoW: false,
          tokensFilled: Math.min(currBlock.tokensOccupied + 1, TOKENS_PER_BLOCK)
        };

        logMsg = 'COW Unshare Triggered: ' + activeSeq.sequenceId + ' mutated shared block ' + currBlock.blockId + ' -> duplicated to block ' + freeBlock.blockId + '.';
      } else {
        logMsg = 'COW Unshare stalled: Memory saturated, no free blocks for unshare.';
      }
    } else if (currBlock.tokensOccupied < TOKENS_PER_BLOCK) {
      // Case B: Slot available in current unshared block
      updatedBlocks[currBlock.blockId] = {
        ...currBlock,
        tokensOccupied: currBlock.tokensOccupied + 1
      };
      updatedPageTable[updatedPageTable.length - 1] = {
        ...lastEntry,
        tokensFilled: currBlock.tokensOccupied + 1
      };
      logMsg = 'Emitted token to block ' + currBlock.blockId + ' (' + (currBlock.tokensOccupied + 1) + '/16 slots filled).';
    } else {
      // Case C: Current block full, allocate next block
      const freeBlock = updatedBlocks.find((b) => b.state === 'free');
      if (freeBlock) {
        updatedBlocks[freeBlock.blockId] = {
          ...freeBlock,
          state: 'allocated',
          refCount: 1,
          sequenceIds: [activeSeq.sequenceId],
          tokensOccupied: 1,
          corridor: 'MEM-POOL-ALPHA (VIRTUAL-PAGE-TABLE · 16-TOKEN-BLOCKS)'
        };
        updatedPageTable.push({
          logicalBlockIndex: activeSeq.pageTable.length,
          physicalBlockId: freeBlock.blockId,
          isCoW: false,
          tokensFilled: 1
        });
        logMsg = 'Block boundary crossed: Allocated block ' + freeBlock.blockId + ' for ' + activeSeq.sequenceId + '.';
      } else {
        logMsg = 'Sequence allocation stalled: Physical blocks full.';
      }
    }
  }

  const updatedSequences = state.sequences.map((s) => {
    if (s.sequenceId === activeSeq.sequenceId) {
      return {
        ...s,
        tokenCount: s.tokenCount + 1,
        pageTable: updatedPageTable,
        lastActiveMs: state.simulatedTimeMs + 5
      };
    }
    return s;
  });

  const newLog: EventLogEntry = {
    id: 'EVT-' + (state.logs.length + 1),
    timestamp: '00:00:0' + (state.simulatedTimeMs / 1000).toFixed(3),
    level: 'info',
    corridor: 'MEM-POOL-ALPHA',
    message: logMsg
  };

  return {
    ...state,
    blocks: updatedBlocks,
    sequences: updatedSequences,
    logs: [newLog, ...state.logs],
    simulatedTimeMs: state.simulatedTimeMs + 12
  };
}

// Chaos Trigger 1: Trigger 4x Beam Divergence (Test COW Forking)
export function triggerBeamDivergenceChaos(state: EngineState): EngineState {
  const updatedBlocks = [...state.blocks];

  // Pick or allocate 3 root prompt blocks
  const rootBlocks = [18, 19, 20];
  rootBlocks.forEach((bId) => {
    updatedBlocks[bId] = {
      ...updatedBlocks[bId],
      state: 'shared_cow',
      refCount: 4,
      sequenceIds: ['BEAM-DIV-0', 'BEAM-DIV-1', 'BEAM-DIV-2', 'BEAM-DIV-3'],
      tokensOccupied: 16,
      corridor: 'MEM-POOL-BRAVO (KV-BLOCK-ALLOCATOR · ZERO-COPY-COW)'
    };
  });

  // Divergent terminal blocks for beams
  const divergedSlots = [22, 23, 24, 25];
  const newSequences: LogicalSequence[] = [];

  divergedSlots.forEach((slotId, beamIdx) => {
    const beamId = 'BEAM-DIV-' + beamIdx;
    updatedBlocks[slotId] = {
      ...updatedBlocks[slotId],
      state: 'allocated',
      refCount: 1,
      sequenceIds: [beamId],
      tokensOccupied: 8 + beamIdx * 2,
      corridor: 'MEM-POOL-BRAVO (KV-BLOCK-ALLOCATOR · ZERO-COPY-COW)'
    };

    const pt: LogicalBlockEntry[] = [
      { logicalBlockIndex: 0, physicalBlockId: rootBlocks[0], isCoW: true, tokensFilled: 16 },
      { logicalBlockIndex: 1, physicalBlockId: rootBlocks[1], isCoW: true, tokensFilled: 16 },
      { logicalBlockIndex: 2, physicalBlockId: rootBlocks[2], isCoW: true, tokensFilled: 16 },
      { logicalBlockIndex: 3, physicalBlockId: slotId, isCoW: false, tokensFilled: 8 + beamIdx * 2 }
    ];

    newSequences.push({
      sequenceId: beamId,
      name: 'Beam Divergence Branch ' + beamIdx,
      phase: 'decode',
      tokenCount: 48 + 8 + beamIdx * 2,
      pageTable: pt,
      parentSequenceId: 'PROMPT-ROOT',
      priority: 95,
      createdAtMs: state.simulatedTimeMs,
      lastActiveMs: state.simulatedTimeMs + 10
    });
  });

  const newLog: EventLogEntry = {
    id: 'EVT-' + (state.logs.length + 1),
    timestamp: '00:00:0' + (state.simulatedTimeMs / 1000).toFixed(3),
    level: 'success',
    corridor: 'MEM-POOL-BRAVO',
    message: 'Triggered 4x Beam Divergence: Shared 3 prompt blocks (refCount = 4), branched into 4 independent terminal slots in 0.04 ms.'
  };

  return {
    ...state,
    blocks: updatedBlocks,
    sequences: [...newSequences, ...state.sequences],
    selectedSequenceId: 'BEAM-DIV-0',
    selectedBlockId: 18,
    activeCorridor: 'MEM-POOL-BRAVO (KV-BLOCK-ALLOCATOR · ZERO-COPY-COW)',
    logs: [newLog, ...state.logs],
    simulatedTimeMs: state.simulatedTimeMs + 20
  };
}

// Chaos Trigger 2: Simulate 98% Memory Saturation (Stress Test)
export function triggerSaturationChaos(state: EngineState): EngineState {
  const updatedBlocks = [...state.blocks];

  // Allocate all blocks except block 0 (63 out of 64 allocated = 98.4% utilization)
  for (let i = 1; i < TOTAL_PHYSICAL_BLOCKS; i++) {
    if (updatedBlocks[i].state === 'free') {
      updatedBlocks[i] = {
        ...updatedBlocks[i],
        state: 'allocated',
        refCount: 1,
        sequenceIds: ['STRESS-INJECTOR'],
        tokensOccupied: 16,
        corridor: 'MEM-POOL-ALPHA (VIRTUAL-PAGE-TABLE · 16-TOKEN-BLOCKS)'
      };
    }
  }
  // Ensure block 0 is free for contrast
  updatedBlocks[0].state = 'free';
  updatedBlocks[0].refCount = 0;
  updatedBlocks[0].sequenceIds = [];
  updatedBlocks[0].tokensOccupied = 0;

  const newLog: EventLogEntry = {
    id: 'EVT-' + (state.logs.length + 1),
    timestamp: '00:00:0' + (state.simulatedTimeMs / 1000).toFixed(3),
    level: 'alert',
    corridor: 'MEM-POOL-DELTA',
    message: 'Stress Test: Memory saturated at 98.4% (63/64 physical slots allocated). High Watermark (95.0%) breached!'
  };

  return {
    ...state,
    blocks: updatedBlocks,
    selectedBlockId: 1,
    activeCorridor: 'MEM-POOL-DELTA (PREEMPTION-CONTROLLER)',
    logs: [newLog, ...state.logs],
    simulatedTimeMs: state.simulatedTimeMs + 30
  };
}

// Chaos Trigger 3: Force Sequence Preemption (Test Swap Queue)
export function triggerPreemptionChaos(state: EngineState): EngineState {
  // Find a candidate sequence to preempt (lowest priority or oldest)
  const candidate = state.sequences.find((s) => s.phase === 'decode' && s.sequenceId !== undefined)
    || state.sequences.find((s) => s.phase === 'decode')
    || state.sequences[0];

  if (!candidate) return state;

  const updatedBlocks = [...state.blocks];
  const victimBlocks: number[] = [];

  candidate.pageTable.forEach((entry) => {
    const blk = updatedBlocks[entry.physicalBlockId];
    if (blk) {
      victimBlocks.push(blk.blockId);
      if (blk.refCount <= 1) {
        // Move to swapped pool
        updatedBlocks[blk.blockId] = {
          ...blk,
          state: 'swapped',
          corridor: 'MEM-POOL-GAMMA (SWAP-EVICTION-QUEUE)'
        };
      } else {
        // Decrement ref count
        updatedBlocks[blk.blockId] = {
          ...blk,
          refCount: blk.refCount - 1,
          sequenceIds: blk.sequenceIds.filter((id) => id !== candidate.sequenceId)
        };
      }
    }
  });

  const updatedSequences = state.sequences.map((s) => {
    if (s.sequenceId === candidate.sequenceId) {
      return {
        ...s,
        phase: 'swapped' as const,
        lastActiveMs: state.simulatedTimeMs
      };
    }
    return s;
  });

  const newLog: EventLogEntry = {
    id: 'EVT-' + (state.logs.length + 1),
    timestamp: '00:00:0' + (state.simulatedTimeMs / 1000).toFixed(3),
    level: 'warn',
    corridor: 'MEM-POOL-GAMMA',
    message: 'Preemption Controller: Victim sequence ' + candidate.sequenceId + ' evicted. ' + victimBlocks.length + ' physical blocks transferred to Host Virtual Swap Queue.'
  };

  return {
    ...state,
    blocks: updatedBlocks,
    sequences: updatedSequences,
    selectedSequenceId: candidate.sequenceId,
    selectedBlockId: victimBlocks[0] !== undefined ? victimBlocks[0] : state.selectedBlockId,
    activeCorridor: 'MEM-POOL-GAMMA (SWAP-EVICTION-QUEUE)',
    logs: [newLog, ...state.logs],
    simulatedTimeMs: state.simulatedTimeMs + 25
  };
}

// Reset Block Allocator to Nominal
export function resetNominalAction(): EngineState {
  return createInitialEngineState();
}
