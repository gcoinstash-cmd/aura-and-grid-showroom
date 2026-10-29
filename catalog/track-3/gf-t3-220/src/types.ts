export type BlockState =
  | 'free'
  | 'allocated'
  | 'shared_cow'
  | 'swapped'
  | 'evicted'
  | 'preempted';

export type MemoryCorridor =
  | 'MEM-POOL-ALPHA (VIRTUAL-PAGE-TABLE · 16-TOKEN-BLOCKS)'
  | 'MEM-POOL-BRAVO (KV-BLOCK-ALLOCATOR · ZERO-COPY-COW)'
  | 'MEM-POOL-GAMMA (SWAP-EVICTION-QUEUE)'
  | 'MEM-POOL-DELTA (PREEMPTION-CONTROLLER)';

export interface PhysicalBlock {
  blockId: number;
  state: BlockState;
  refCount: number;
  sequenceIds: string[];
  tokensOccupied: number;
  maxTokens: number;
  kvBytes: number;
  lastAccessedMs: number;
  corridor: MemoryCorridor;
  generation: number;
}

export interface LogicalBlockEntry {
  logicalBlockIndex: number;
  physicalBlockId: number;
  isCoW: boolean;
  tokensFilled: number;
}

export interface LogicalSequence {
  sequenceId: string;
  name: string;
  phase: 'prompt' | 'decode' | 'swapped' | 'preempted';
  tokenCount: number;
  pageTable: LogicalBlockEntry[];
  parentSequenceId: string | null;
  priority: number;
  createdAtMs: number;
  lastActiveMs: number;
}

export interface TelemetryMetrics {
  blockUtilizationPct: number;
  internalFragmentationPct: number;
  allocatorLatencyMs: number;
  allocatedTokens: number;
  totalBlocks: number;
  activeBlocksCount: number;
  freeBlocksCount: number;
  sharedCowBlocksCount: number;
  swappedBlocksCount: number;
  externalFragmentationPct: number;
  cowSavingsTokens: number;
  swapQueueDepth: number;
  preemptionEvents: number;
}

export interface EventLogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'success' | 'alert';
  corridor: string;
  message: string;
}
