/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod';

export enum PagedCorridor {
  ALPHA = 'PAGE-CORRIDOR-ALPHA (CONTINUOUS-PAGED-ATTENTION-FABRIC · 38400-GB/S)',
  BRAVO = 'PAGE-CORRIDOR-BRAVO (HARDWARE-ACCELERATED-BLOCK-ALLOCATION-ENGINE)',
  GAMMA = 'PAGE-CORRIDOR-GAMMA (VIRTUAL-TO-PHYSICAL-PAGE-TABLE-ROUTER)',
  DELTA = 'PAGE-CORRIDOR-DELTA (FALLBACK-MONOLITHIC-KV-PASS)',
}

export const SYNTHETIC_CORRIDORS: readonly PagedCorridor[] = [
  PagedCorridor.ALPHA,
  PagedCorridor.BRAVO,
  PagedCorridor.GAMMA,
  PagedCorridor.DELTA,
];

const UNSAFE_PATTERNS = [
  'select ',
  'insert ',
  'update ',
  'delete ',
  'drop ',
  'union ',
  '<script',
  'javascript:',
  'onerror=',
  'onload=',
  '--',
  ';',
  '__proto__',
  'constructor',
];

export const GridSyncTranslationIngressSchema = z.object({
  corridor: z
    .string()
    .min(3)
    .max(120)
    .refine(
      (val) => {
        const lower = val.toLowerCase();
        return !UNSAFE_PATTERNS.some((pat) => lower.includes(pat));
      },
      { message: 'GridSync Zero-Trust Gate rejected unsafe payload token' }
    ),
  logicalBlock: z.number().int().min(0).max(7),
  pageOffset: z.number().int().min(0).max(15),
  blockSizeTokens: z.number().int().min(16).max(256).default(16),
  sequenceTokens: z.number().int().min(16).max(8388608).default(256000),
});

export type GridSyncTranslationIngress = z.infer<typeof GridSyncTranslationIngressSchema>;

export interface PageUnitState {
  index: number;
  gear: string;
  title: string;
  physicalHex: string;
  physicalAddress: number;
  logicalBlock: number;
  pageOffset: number;
  virtualAddressHex: string;
  tokensK: number;
  blockSizeTokens: number;
  latencyMs: number;
  syncPct: number;
  fragmentationPct: number;
  statusLabel: 'PAGED · LOCKED' | 'RE-INDEX · FAULT';
  pageHealth: 'OK' | 'FAULT';
}

export interface RadioLogLine {
  id: string;
  timestamp: string;
  callsign: '🟢 CREW CHIEF' | '🟢 TELEMETRY' | '🔴 TELEMETRY' | '⚡ PIT WALL';
  message: string;
}

export interface PagedEngineState {
  corridor: PagedCorridor;
  pageThroughputGbs: number;
  throughputSaturationPct: number;
  allocationLatencyUs: number;
  activePagesCount: number;
  totalPagesCount: number;
  processedTokensUnits: number;
  engineXpDeltaK: number;
  pagedStateLabel: string;
  meshPtrHex: string;
  attentionVector: [number, number, number, number];
  selectedPageIndex: number;
  fragmentationSpikeActive: boolean;
  stepCount: number;
  recycledBlocksTotal: number;
  pages: PageUnitState[];
  radioLogs: RadioLogLine[];
}

export interface VirtualBlockTranslationResult {
  logicalBlock: number;
  pageOffset: number;
  physicalBaseAddress: number;
  physicalBaseHex: string;
  virtualPageAddress: number;
  virtualPageHex: string;
  internalFragmentationPct: number;
  formulaExpression: string;
}

export function formatHexAddress(addr: number, minWidth = 4): string {
  const clean = Math.max(0, Math.floor(addr)).toString(16).toUpperCase();
  const padded = clean.padStart(minWidth, '0');
  return '0x' + padded;
}

export function formatNumberWithCommas(val: number): string {
  return Math.round(val).toLocaleString('en-US');
}

/**
 * Deterministic Virtual-to-Physical Page Table Address Translation:
 * V_page = BlockTable[LogicalBlock] + PageOffset
 */
export function computeVirtualPageTranslation(
  blockTable: ReadonlyArray<number>,
  logicalBlock: number,
  pageOffset: number,
  blockSizeTokens = 16
): VirtualBlockTranslationResult {
  if (!Number.isInteger(logicalBlock) || logicalBlock < 0 || logicalBlock >= blockTable.length) {
    throw new Error('LogicalBlock index out of bounds [0..' + String(blockTable.length - 1) + ']');
  }
  if (!Number.isInteger(pageOffset) || pageOffset < 0 || pageOffset >= blockSizeTokens) {
    throw new Error('PageOffset exceeds physical block boundary [0..' + String(blockSizeTokens - 1) + ']');
  }

  const physicalBaseAddress = blockTable[logicalBlock];
  const virtualPageAddress = physicalBaseAddress + pageOffset;

  return {
    logicalBlock,
    pageOffset,
    physicalBaseAddress,
    physicalBaseHex: formatHexAddress(physicalBaseAddress, 4),
    virtualPageAddress,
    virtualPageHex: formatHexAddress(virtualPageAddress, 4),
    internalFragmentationPct: 0.0,
    formulaExpression: 'V_page = BlockTable[LogicalBlock] + PageOffset',
  };
}

/**
 * Sanitizes incoming translation payload through GridSync Zero-Trust Zod gate
 */
export function sanitizeAndTranslateBlock(rawInput: unknown, blockTable: ReadonlyArray<number>): VirtualBlockTranslationResult {
  const parsed = GridSyncTranslationIngressSchema.parse(rawInput);
  return computeVirtualPageTranslation(
    blockTable,
    parsed.logicalBlock,
    parsed.pageOffset,
    parsed.blockSizeTokens
  );
}

/**
 * Calculates internal memory fragmentation percentage for a paged allocation arena.
 */
export function calculateArenaFragmentationPct(
  pages: ReadonlyArray<PageUnitState>,
  isMonolithicFallback = false
): number {
  if (pages.length === 0) {
    return 0;
  }
  if (isMonolithicFallback) {
    return 18.4;
  }
  const totalFrag = pages.reduce((acc, item) => acc + item.fragmentationPct, 0);
  return Number((totalFrag / pages.length).toFixed(2));
}

/**
 * Simulates O(1) asynchronous block recycling upon sequence completion with zero CPU lock intervention.
 */
export function recycleCompletedSequenceBlocks(
  pages: ReadonlyArray<PageUnitState>,
  completedLogicalBlocks: ReadonlyArray<number>
): {
  updatedPages: PageUnitState[];
  recycledCount: number;
  cpuInterventionMs: number;
  memoryWasteBytes: number;
} {
  const targetSet = new Set(completedLogicalBlocks);
  let recycledCount = 0;

  const updatedPages = pages.map((page) => {
    if (!targetSet.has(page.logicalBlock)) {
      return page;
    }
    recycledCount += 1;
    const resetPhys = 0xE000 + page.index * 0x0010;
    return {
      ...page,
      physicalAddress: resetPhys,
      physicalHex: formatHexAddress(resetPhys, 4),
      virtualAddressHex: formatHexAddress(resetPhys + page.pageOffset, 4),
      latencyMs: 0.02,
      syncPct: 100,
      fragmentationPct: 0.0,
      statusLabel: 'PAGED · LOCKED' as const,
      pageHealth: 'OK' as const,
    };
  });

  return {
    updatedPages,
    recycledCount,
    cpuInterventionMs: 0.0,
    memoryWasteBytes: 0,
  };
}

export function createInitialPages(): PageUnitState[] {
  const units: PageUnitState[] = [];
  for (let i = 0; i < 8; i++) {
    const physAddr = 0xE000 + i * 0x0010;
    units.push({
      index: i,
      gear: 'G' + String(i),
      title: 'Page ' + String(i) + ' (G' + String(i) + ')',
      physicalHex: formatHexAddress(physAddr, 4),
      physicalAddress: physAddr,
      logicalBlock: i,
      pageOffset: 0,
      virtualAddressHex: formatHexAddress(physAddr, 4),
      tokensK: 256,
      blockSizeTokens: 16,
      latencyMs: 0.02,
      syncPct: 100,
      fragmentationPct: 0.0,
      statusLabel: 'PAGED · LOCKED',
      pageHealth: 'OK',
    });
  }
  return units;
}

export function createInitialEngineState(): PagedEngineState {
  return {
    corridor: PagedCorridor.ALPHA,
    pageThroughputGbs: 38400,
    throughputSaturationPct: 99.4,
    allocationLatencyUs: 0.01,
    activePagesCount: 8,
    totalPagesCount: 8,
    processedTokensUnits: 7296000,
    engineXpDeltaK: 75.0,
    pagedStateLabel: 'Allocation Active',
    meshPtrHex: '0xDF8DC0',
    attentionVector: [4.21, 4.25, 4.22, 4.24],
    selectedPageIndex: 3,
    fragmentationSpikeActive: false,
    stepCount: 0,
    recycledBlocksTotal: 64,
    pages: createInitialPages(),
    radioLogs: [
      {
        id: 'init-1',
        timestamp: '00:01.04',
        callsign: '🟢 CREW CHIEF',
        message: 'Continuous paged attention and block allocation engine initialized · 8 pages linked',
      },
      {
        id: 'init-2',
        timestamp: '00:01.08',
        callsign: '🟢 TELEMETRY',
        message: 'Virtual-to-physical block table translation verified at 38,400 GB/s with zero memory fragmentation',
      },
    ],
  };
}

function nextTimestamp(stepCount: number): string {
  const totalCentiseconds = 108 + stepCount * 14;
  const minutes = Math.floor(totalCentiseconds / 6000);
  const seconds = Math.floor((totalCentiseconds % 6000) / 100);
  const centis = totalCentiseconds % 100;
  return (
    String(minutes).padStart(2, '0') +
    ':' +
    String(seconds).padStart(2, '0') +
    '.' +
    String(centis).padStart(2, '0')
  );
}

export function executePagedBurst(state: PagedEngineState): PagedEngineState {
  const nextStep = state.stepCount + 1;
  const ts = nextTimestamp(nextStep);
  const updatedPages: PageUnitState[] = state.pages.map((p, idx) => {
    const newOffset = (p.pageOffset + 4) % p.blockSizeTokens;
    const translated = computeVirtualPageTranslation(
      state.pages.map((item) => item.physicalAddress),
      idx,
      newOffset,
      p.blockSizeTokens
    );
    return {
      ...p,
      pageOffset: newOffset,
      virtualAddressHex: translated.virtualPageHex,
      tokensK: p.tokensK + 32,
      latencyMs: 0.01,
      syncPct: 100,
      fragmentationPct: 0.0,
      statusLabel: 'PAGED · LOCKED',
      pageHealth: 'OK',
    };
  });

  const newLogs: RadioLogLine[] = [
    {
      id: 'burst-' + String(nextStep) + '-a',
      timestamp: ts,
      callsign: '⚡ PIT WALL',
      message: 'Trigger Paged Attention Burst executed · +512,000 Units streamed across G0..G7 at 38,400 GB/s',
    },
    {
      id: 'burst-' + String(nextStep) + '-b',
      timestamp: ts,
      callsign: '🟢 TELEMETRY',
      message: 'Sub-microsecond page table synchronization locked at 0.01 µs · Internal fragmentation 0.00%',
    },
  ];

  return {
    ...state,
    stepCount: nextStep,
    pageThroughputGbs: 38400,
    throughputSaturationPct: 99.8,
    allocationLatencyUs: 0.01,
    activePagesCount: 8,
    processedTokensUnits: state.processedTokensUnits + 512000,
    engineXpDeltaK: Number((state.engineXpDeltaK + 12.5).toFixed(1)),
    pagedStateLabel: 'Allocation Active',
    fragmentationSpikeActive: false,
    meshPtrHex: formatHexAddress(0xDF8DC0 + nextStep * 0x10, 6),
    attentionVector: [
      Number((4.21 + (nextStep % 4) * 0.02).toFixed(2)),
      Number((4.25 + (nextStep % 3) * 0.02).toFixed(2)),
      Number((4.22 + (nextStep % 5) * 0.01).toFixed(2)),
      Number((4.24 + (nextStep % 4) * 0.02).toFixed(2)),
    ],
    pages: updatedPages,
    radioLogs: newLogs,
  };
}

export function toggleFragmentationSpike(state: PagedEngineState): PagedEngineState {
  const nextStep = state.stepCount + 1;
  const ts = nextTimestamp(nextStep);
  const spikeNow = !state.fragmentationSpikeActive;

  if (spikeNow) {
    const spikedPages: PageUnitState[] = state.pages.map((p, idx) => {
      if (idx === 2 || idx === 5) {
        return {
          ...p,
          latencyMs: 0.09,
          syncPct: 92,
          fragmentationPct: 4.8,
          statusLabel: 'RE-INDEX · FAULT',
          pageHealth: 'FAULT',
        };
      }
      return p;
    });

    return {
      ...state,
      stepCount: nextStep,
      fragmentationSpikeActive: true,
      pageThroughputGbs: 31200,
      throughputSaturationPct: 81.2,
      allocationLatencyUs: 0.04,
      activePagesCount: 6,
      pagedStateLabel: 'Re-Indexing Page Table',
      pages: spikedPages,
      radioLogs: [
        {
          id: 'spike-' + String(nextStep) + '-a',
          timestamp: ts,
          callsign: '🔴 TELEMETRY',
          message: 'Memory Fragmentation Spike detected on G2 (0xE020) and G5 (0xE050) · Forcing Page Table Re-Indexing',
        },
        {
          id: 'spike-' + String(nextStep) + '-b',
          timestamp: ts,
          callsign: '⚡ PIT WALL',
          message: 'Execute Step Block Allocation Pass or toggle spike to re-map non-contiguous physical frames',
        },
      ],
    };
  }

  const recycled = recycleCompletedSequenceBlocks(state.pages, [0, 1, 2, 3, 4, 5, 6, 7]);
  return {
    ...state,
    stepCount: nextStep,
    fragmentationSpikeActive: false,
    pageThroughputGbs: 38400,
    throughputSaturationPct: 99.4,
    allocationLatencyUs: 0.01,
    activePagesCount: 8,
    recycledBlocksTotal: state.recycledBlocksTotal + recycled.recycledCount,
    pagedStateLabel: 'Allocation Active',
    pages: recycled.updatedPages,
    radioLogs: [
      {
        id: 'spike-clear-' + String(nextStep) + '-a',
        timestamp: ts,
        callsign: '🟢 CREW CHIEF',
        message: 'Page table re-indexing complete · G2 and G5 physical frames remapped with 0.00% fragmentation',
      },
      {
        id: 'spike-clear-' + String(nextStep) + '-b',
        timestamp: ts,
        callsign: '🟢 TELEMETRY',
        message: 'All 8 pages locked at 38,400 GB/s · Allocation latency restored to 0.01 µs',
      },
    ],
  };
}

export function stepBlockAllocationPass(state: PagedEngineState): PagedEngineState {
  const nextStep = state.stepCount + 1;
  const ts = nextTimestamp(nextStep);

  const rotatedTable = state.pages.map((_, idx) => {
    const slot = (idx + nextStep) % 8;
    return 0xE000 + slot * 0x0010;
  });

  const updatedPages: PageUnitState[] = state.pages.map((p, idx) => {
    const nextOffset = (p.pageOffset + 1) % p.blockSizeTokens;
    const translation = computeVirtualPageTranslation(rotatedTable, idx, nextOffset, p.blockSizeTokens);
    return {
      ...p,
      physicalAddress: translation.physicalBaseAddress,
      physicalHex: translation.physicalBaseHex,
      pageOffset: nextOffset,
      virtualAddressHex: translation.virtualPageHex,
      tokensK: p.tokensK + 16,
      latencyMs: 0.02,
      syncPct: 100,
      fragmentationPct: 0.0,
      statusLabel: 'PAGED · LOCKED',
      pageHealth: 'OK',
    };
  });

  return {
    ...state,
    stepCount: nextStep,
    fragmentationSpikeActive: false,
    pageThroughputGbs: 38400,
    throughputSaturationPct: 99.6,
    allocationLatencyUs: 0.01,
    activePagesCount: 8,
    processedTokensUnits: state.processedTokensUnits + 75000,
    engineXpDeltaK: Number((state.engineXpDeltaK + 5.0).toFixed(1)),
    recycledBlocksTotal: state.recycledBlocksTotal + 8,
    pagedStateLabel: 'Allocation Active',
    meshPtrHex: formatHexAddress(0xDF8DC0 + nextStep * 0x08, 6),
    attentionVector: [
      Number((4.21 + (nextStep % 3) * 0.01).toFixed(2)),
      Number((4.25 + (nextStep % 2) * 0.01).toFixed(2)),
      Number((4.22 + (nextStep % 4) * 0.01).toFixed(2)),
      Number((4.24 + (nextStep % 3) * 0.01).toFixed(2)),
    ],
    pages: updatedPages,
    radioLogs: [
      {
        id: 'step-' + String(nextStep) + '-a',
        timestamp: ts,
        callsign: '🟢 CREW CHIEF',
        message: 'Step Asynchronous Block Allocation Pass complete · 8 physical blocks rotated with 0.00ms CPU lock',
      },
      {
        id: 'step-' + String(nextStep) + '-b',
        timestamp: ts,
        callsign: '🟢 TELEMETRY',
        message: 'V_page = BlockTable[LogicalBlock] + PageOffset verified across G0..G7 · +75,000 Units processed',
      },
    ],
  };
}

export function flushPageArenas(corridor: PagedCorridor): PagedEngineState {
  const fresh = createInitialEngineState();
  fresh.corridor = corridor;
  fresh.radioLogs = [
    {
      id: 'flush-1',
      timestamp: '00:01.00',
      callsign: '🟢 CREW CHIEF',
      message: 'Page buffers flushed & allocation arenas re-zeroed to 0xE000..0xE070 · 8/8 pages locked',
    },
    {
      id: 'flush-2',
      timestamp: '00:01.04',
      callsign: '🟢 TELEMETRY',
      message: 'Zero-fragmentation state verified · Throughput 38,400 GB/s · Latency 0.01 µs',
    },
  ];
  return fresh;
}
