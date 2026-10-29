/**
 * GF-T3-227: Prefix-Tree Radix KV-Cache & Speculative Tree Attention Engine
 * SPDX-License-Identifier: MIT
 * Zero-Trust GridSync Ingress & Deterministic Radix Trie Mechanics
 */

import { z } from 'zod';

export type SyntheticCorridorId =
  | 'TREE-CORRIDOR-ALPHA (RADIX-TREE-LCP · DYNAMIC-PRUNING)'
  | 'TREE-CORRIDOR-BRAVO (TREE-MASK-VERIFY · MULTI-BRANCH)'
  | 'TREE-CORRIDOR-GAMMA (SPECULATIVE-DRAFT-TRIE · RESAMPLE)'
  | 'TREE-CORRIDOR-DELTA (LEAF-EVICTION-FALLBACK)';

export interface CorridorProfile {
  id: SyntheticCorridorId;
  shortCode: string;
  maxCachedTokens: number;
  evictionRatio: number;
  bandwidthGbs: number;
  verifyThreshold: number;
  baseTraversalMs: number;
}

export const SYNTHETIC_CORRIDORS: Record<SyntheticCorridorId, CorridorProfile> = {
  'TREE-CORRIDOR-ALPHA (RADIX-TREE-LCP · DYNAMIC-PRUNING)': {
    id: 'TREE-CORRIDOR-ALPHA (RADIX-TREE-LCP · DYNAMIC-PRUNING)',
    shortCode: 'CORRIDOR-ALPHA',
    maxCachedTokens: 512,
    evictionRatio: 0.25,
    bandwidthGbs: 1480,
    verifyThreshold: 0.72,
    baseTraversalMs: 0.28,
  },
  'TREE-CORRIDOR-BRAVO (TREE-MASK-VERIFY · MULTI-BRANCH)': {
    id: 'TREE-CORRIDOR-BRAVO (TREE-MASK-VERIFY · MULTI-BRANCH)',
    shortCode: 'CORRIDOR-BRAVO',
    maxCachedTokens: 768,
    evictionRatio: 0.20,
    bandwidthGbs: 1620,
    verifyThreshold: 0.68,
    baseTraversalMs: 0.24,
  },
  'TREE-CORRIDOR-GAMMA (SPECULATIVE-DRAFT-TRIE · RESAMPLE)': {
    id: 'TREE-CORRIDOR-GAMMA (SPECULATIVE-DRAFT-TRIE · RESAMPLE)',
    shortCode: 'CORRIDOR-GAMMA',
    maxCachedTokens: 640,
    evictionRatio: 0.30,
    bandwidthGbs: 1540,
    verifyThreshold: 0.75,
    baseTraversalMs: 0.26,
  },
  'TREE-CORRIDOR-DELTA (LEAF-EVICTION-FALLBACK)': {
    id: 'TREE-CORRIDOR-DELTA (LEAF-EVICTION-FALLBACK)',
    shortCode: 'CORRIDOR-DELTA',
    maxCachedTokens: 384,
    evictionRatio: 0.40,
    bandwidthGbs: 1390,
    verifyThreshold: 0.80,
    baseTraversalMs: 0.31,
  },
};

export const CORRIDOR_LIST: SyntheticCorridorId[] = [
  'TREE-CORRIDOR-ALPHA (RADIX-TREE-LCP · DYNAMIC-PRUNING)',
  'TREE-CORRIDOR-BRAVO (TREE-MASK-VERIFY · MULTI-BRANCH)',
  'TREE-CORRIDOR-GAMMA (SPECULATIVE-DRAFT-TRIE · RESAMPLE)',
  'TREE-CORRIDOR-DELTA (LEAF-EVICTION-FALLBACK)',
];

export type NodeTier = 'ROOT' | 'BRANCH' | 'LEAF';
export type VerificationState = 'VERIFIED' | 'SPECULATIVE' | 'PRUNED';

export interface RadixTreeNode {
  id: string;
  label: string;
  tier: NodeTier;
  tokens: number[];
  tokenTextPreview: string;
  parentId: string | null;
  childIds: string[];
  pinned: boolean;
  accessCount: number;
  lastAccessTick: number;
  kvPagePointer: string;
  lcpMatchScore: number;
  evictionPriority: number;
  verificationState: VerificationState;
  forkGearIndex: number; // 1..8
  acceptanceProb: number;
  depth: number;
}

export interface RadioLogEntry {
  id: string;
  timestamp: string;
  callsign: '🟢 CREW CHIEF' | '⚡ PIT WALL' | '🟢 TELEMETRY' | '🔴 TELEMETRY';
  message: string;
}

export interface EngineTelemetrySnapshot {
  corridor: SyntheticCorridorId;
  prefixHitRatePct: number;
  traversalLatencyMs: number;
  activeRadixNodes: number;
  activeBranchForks: number;
  branchGearsActive: boolean[];
  tokenReuseUnits: number;
  trieXpDelta: number;
  reusedKvRatioPct: number;
  cacheBandwidthGbs: number;
  lruPruningEnabled: boolean;
  maskParityDelta: number;
  engineStatus: 'LOCKED' | 'FAULT';
  verifyStepsCompleted: number;
}

// ============================================================================
// ZERO-TRUST GRIDSYNC INGRESS SANITIZATION (ZOD SCHEMAS)
// ============================================================================

const FORBIDDEN_PATTERNS = [
  'DROP TABLE',
  'DELETE FROM',
  'INSERT INTO',
  'UNION SELECT',
  '<SCRIPT',
  'JAVASCRIPT:',
  'ONERROR=',
  'ONLOAD=',
  '--',
  ';',
];

export const GridSyncPromptIngressSchema = z.object({
  corridor: z.enum([
    'TREE-CORRIDOR-ALPHA (RADIX-TREE-LCP · DYNAMIC-PRUNING)',
    'TREE-CORRIDOR-BRAVO (TREE-MASK-VERIFY · MULTI-BRANCH)',
    'TREE-CORRIDOR-GAMMA (SPECULATIVE-DRAFT-TRIE · RESAMPLE)',
    'TREE-CORRIDOR-DELTA (LEAF-EVICTION-FALLBACK)',
  ]),
  label: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .refine(
      (val) => {
        const upper = val.toUpperCase();
        return !FORBIDDEN_PATTERNS.some((pat) => upper.includes(pat));
      },
      { message: 'GridSync Security Gate: Label contains prohibited injection or script sequence' }
    ),
  tokens: z
    .array(z.number().int().min(0).max(200000))
    .min(1)
    .max(512),
});

export type GridSyncPromptIngress = z.infer<typeof GridSyncPromptIngressSchema>;

export function sanitizePromptIngress(rawInput: unknown): GridSyncPromptIngress {
  return GridSyncPromptIngressSchema.parse(rawInput);
}

// ============================================================================
// CORE MATHEMATICAL & ALGORITHMIC FUNCTIONS
// ============================================================================

/**
 * Computes exact Longest Common Prefix (LCP) length between two token sequences.
 */
export function computeLcpLength(seqA: readonly number[], seqB: readonly number[]): number {
  const limit = Math.min(seqA.length, seqB.length);
  let matched = 0;
  while (matched < limit && seqA[matched] === seqB[matched]) {
    matched += 1;
  }
  return matched;
}

/**
 * Calculates deterministic eviction priority score for a node.
 * Higher score = higher retention priority. Pinned root nodes return 9999.
 */
export function calculateEvictionPriority(
  pinned: boolean,
  accessCount: number,
  lastAccessTick: number,
  currentTick: number
): number {
  if (pinned) {
    return 9999.0;
  }
  const age = Math.max(1, currentTick - lastAccessTick);
  const raw = (accessCount * 12.5) / age;
  return Math.round(raw * 100) / 100;
}

/**
 * Constructs a 2D binary causal Tree Attention Mask M_tree[i][j] in {0, 1}
 * where M_tree[i][j] = 1 iff node j is an ancestor of (or identical to) node i.
 */
export function buildCausalTreeAttentionMask(
  nodes: readonly RadixTreeNode[]
): { nodeIds: string[]; matrix: number[][] } {
  const activeNodes = nodes.filter((n) => n.verificationState !== 'PRUNED');
  const nodeMap = new Map<string, RadixTreeNode>();
  for (const n of activeNodes) {
    nodeMap.set(n.id, n);
  }

  const ancestorSets = new Map<string, Set<string>>();
  for (const n of activeNodes) {
    const ancestors = new Set<string>();
    let cursor: RadixTreeNode | undefined = n;
    let safety = 0;
    while (cursor && safety < 64) {
      ancestors.add(cursor.id);
      cursor = cursor.parentId ? nodeMap.get(cursor.parentId) : undefined;
      safety += 1;
    }
    ancestorSets.set(n.id, ancestors);
  }

  const nodeIds = activeNodes.map((n) => n.id);
  const matrix: number[][] = [];

  for (const rowId of nodeIds) {
    const rowAncestors = ancestorSets.get(rowId) || new Set<string>();
    const row: number[] = [];
    for (const colId of nodeIds) {
      row.push(rowAncestors.has(colId) ? 1 : 0);
    }
    matrix.push(row);
  }

  return { nodeIds, matrix };
}

/**
 * Verifies numerical parity between 2D Masked Tree Attention over all candidate
 * tree nodes simultaneously and Sequential Linear Causal Attention along a
 * specific root-to-leaf ancestor path.
 */
export function verifyTreeAttentionNumericalParity(
  qMatrix: readonly (readonly number[])[],
  kMatrix: readonly (readonly number[])[],
  vMatrix: readonly (readonly number[])[],
  treeMask: readonly (readonly number[])[],
  rootToLeafPathIndices: readonly number[]
): {
  treeLeafOutput: number[];
  linearLeafOutput: number[];
  maxAbsDiff: number;
} {
  const dim = qMatrix[0].length;
  const scale = 1.0 / Math.sqrt(dim);
  const leafIdx = rootToLeafPathIndices[rootToLeafPathIndices.length - 1];
  const qLeaf = qMatrix[leafIdx];

  // 1. Masked Tree Attention at leafIdx across all tree nodes
  const treeLogits: number[] = [];
  const attendedIndices: number[] = [];
  const maskRow = treeMask[leafIdx];

  for (let j = 0; j < maskRow.length; j += 1) {
    if (maskRow[j] === 1) {
      let dot = 0;
      for (let d = 0; d < dim; d += 1) {
        dot += qLeaf[d] * kMatrix[j][d];
      }
      treeLogits.push(dot * scale);
      attendedIndices.push(j);
    }
  }

  const maxTreeLogit = Math.max(...treeLogits);
  const treeExps = treeLogits.map((l) => Math.exp(l - maxTreeLogit));
  const sumTreeExps = treeExps.reduce((a, b) => a + b, 0);
  const treeWeights = treeExps.map((e) => e / sumTreeExps);

  const treeLeafOutput = new Array<number>(dim).fill(0);
  for (let idx = 0; idx < attendedIndices.length; idx += 1) {
    const col = attendedIndices[idx];
    const w = treeWeights[idx];
    for (let d = 0; d < dim; d += 1) {
      treeLeafOutput[d] += w * vMatrix[col][d];
    }
  }

  // 2. Linear Sequential Attention strictly along rootToLeafPathIndices
  const linLogits: number[] = [];
  for (let s = 0; s < rootToLeafPathIndices.length; s += 1) {
    const seqIdx = rootToLeafPathIndices[s];
    let dot = 0;
    for (let d = 0; d < dim; d += 1) {
      dot += qLeaf[d] * kMatrix[seqIdx][d];
    }
    linLogits.push(dot * scale);
  }

  const maxLinLogit = Math.max(...linLogits);
  const linExps = linLogits.map((l) => Math.exp(l - maxLinLogit));
  const sumLinExps = linExps.reduce((a, b) => a + b, 0);
  const linWeights = linExps.map((e) => e / sumLinExps);

  const linearLeafOutput = new Array<number>(dim).fill(0);
  for (let s = 0; s < rootToLeafPathIndices.length; s += 1) {
    const seqIdx = rootToLeafPathIndices[s];
    const w = linWeights[s];
    for (let d = 0; d < dim; d += 1) {
      linearLeafOutput[d] += w * vMatrix[seqIdx][d];
    }
  }

  let maxAbsDiff = 0;
  for (let d = 0; d < dim; d += 1) {
    const diff = Math.abs(treeLeafOutput[d] - linearLeafOutput[d]);
    if (diff > maxAbsDiff) {
      maxAbsDiff = diff;
    }
  }

  return { treeLeafOutput, linearLeafOutput, maxAbsDiff };
}

// ============================================================================
// STATEFUL RADIX TREE ENGINE OPERATIONS
// ============================================================================

export function createInitialRadixTree(): RadixTreeNode[] {
  return [
    {
      id: 'RT-ROOT-00',
      label: 'System Prompt Root',
      tier: 'ROOT',
      tokens: [101, 2054, 2003, 1996, 3928, 4007, 1024, 2048],
      tokenTextPreview: '[SYS] Institutional Quant Execution Constitution v3.2 · Shared Prefix',
      parentId: null,
      childIds: ['RT-BRN-01', 'RT-BRN-02', 'RT-BRN-03'],
      pinned: true,
      accessCount: 128,
      lastAccessTick: 12,
      kvPagePointer: 'KV-BLK-0000:0128',
      lcpMatchScore: 100.0,
      evictionPriority: 9999.0,
      verificationState: 'VERIFIED',
      forkGearIndex: 1,
      acceptanceProb: 0.99,
      depth: 0,
    },
    {
      id: 'RT-BRN-01',
      label: 'Turn-1 Context: Orderbook Depth',
      tier: 'BRANCH',
      tokens: [4102, 4109, 4188, 4201, 4290, 4311],
      tokenTextPreview: 'CTX_A: Evaluate L3 liquidity imbalance across cross-venue books',
      parentId: 'RT-ROOT-00',
      childIds: ['RT-LEF-01', 'RT-LEF-02', 'RT-LEF-03'],
      pinned: false,
      accessCount: 42,
      lastAccessTick: 11,
      kvPagePointer: 'KV-BLK-0080:0096',
      lcpMatchScore: 96.4,
      evictionPriority: 525.0,
      verificationState: 'VERIFIED',
      forkGearIndex: 2,
      acceptanceProb: 0.94,
      depth: 1,
    },
    {
      id: 'RT-BRN-02',
      label: 'Turn-1 Context: Latency Hedging',
      tier: 'BRANCH',
      tokens: [5104, 5120, 5199, 5240, 5301],
      tokenTextPreview: 'CTX_B: Compute delta-neutral inventory skew under variance spike',
      parentId: 'RT-ROOT-00',
      childIds: ['RT-LEF-04', 'RT-LEF-05', 'RT-LEF-06'],
      pinned: false,
      accessCount: 34,
      lastAccessTick: 10,
      kvPagePointer: 'KV-BLK-00E0:0080',
      lcpMatchScore: 93.8,
      evictionPriority: 212.5,
      verificationState: 'VERIFIED',
      forkGearIndex: 5,
      acceptanceProb: 0.91,
      depth: 1,
    },
    {
      id: 'RT-BRN-03',
      label: 'Turn-1 Context: Risk Guardrail',
      tier: 'BRANCH',
      tokens: [6100, 6145, 6190, 6212],
      tokenTextPreview: 'CTX_C: Verify margin utilization bounds and tail drawdown limits',
      parentId: 'RT-ROOT-00',
      childIds: ['RT-LEF-07', 'RT-LEF-08'],
      pinned: false,
      accessCount: 19,
      lastAccessTick: 9,
      kvPagePointer: 'KV-BLK-0130:0064',
      lcpMatchScore: 91.2,
      evictionPriority: 79.17,
      verificationState: 'VERIFIED',
      forkGearIndex: 7,
      acceptanceProb: 0.88,
      depth: 1,
    },
    {
      id: 'RT-LEF-01',
      label: 'Draft Fork B1: Limit Sweep',
      tier: 'LEAF',
      tokens: [7011, 7012, 7015],
      tokenTextPreview: 'DRAFT_B1 -> route_ioc(venue=ALPHA, clip=250)',
      parentId: 'RT-BRN-01',
      childIds: [],
      pinned: false,
      accessCount: 18,
      lastAccessTick: 12,
      kvPagePointer: 'KV-BLK-0170:0048',
      lcpMatchScore: 95.8,
      evictionPriority: 225.0,
      verificationState: 'VERIFIED',
      forkGearIndex: 1,
      acceptanceProb: 0.93,
      depth: 2,
    },
    {
      id: 'RT-LEF-02',
      label: 'Draft Fork B2: Midpoint Peg',
      tier: 'LEAF',
      tokens: [7011, 7012, 7099],
      tokenTextPreview: 'DRAFT_B2 -> route_peg(offset=0, horizon_ms=15)',
      parentId: 'RT-BRN-01',
      childIds: [],
      pinned: false,
      accessCount: 14,
      lastAccessTick: 11,
      kvPagePointer: 'KV-BLK-01A0:0048',
      lcpMatchScore: 94.6,
      evictionPriority: 175.0,
      verificationState: 'SPECULATIVE',
      forkGearIndex: 2,
      acceptanceProb: 0.87,
      depth: 2,
    },
    {
      id: 'RT-LEF-03',
      label: 'Draft Fork B3: Iceberg Slice',
      tier: 'LEAF',
      tokens: [7044, 7050, 7088],
      tokenTextPreview: 'DRAFT_B3 -> split_child_orders(slices=8, jitter=true)',
      parentId: 'RT-BRN-01',
      childIds: [],
      pinned: false,
      accessCount: 7,
      lastAccessTick: 7,
      kvPagePointer: 'KV-BLK-01D0:0048',
      lcpMatchScore: 92.1,
      evictionPriority: 17.5,
      verificationState: 'SPECULATIVE',
      forkGearIndex: 3,
      acceptanceProb: 0.79,
      depth: 2,
    },
    {
      id: 'RT-LEF-04',
      label: 'Draft Fork B4: Gamma Hedge',
      tier: 'LEAF',
      tokens: [8010, 8022, 8045],
      tokenTextPreview: 'DRAFT_B4 -> rebalance_perp_delta(ratio=0.85)',
      parentId: 'RT-BRN-02',
      childIds: [],
      pinned: false,
      accessCount: 16,
      lastAccessTick: 11,
      kvPagePointer: 'KV-BLK-0200:0048',
      lcpMatchScore: 94.9,
      evictionPriority: 200.0,
      verificationState: 'VERIFIED',
      forkGearIndex: 4,
      acceptanceProb: 0.92,
      depth: 2,
    },
    {
      id: 'RT-LEF-05',
      label: 'Draft Fork B5: Skew Widen',
      tier: 'LEAF',
      tokens: [8010, 8066, 8091],
      tokenTextPreview: 'DRAFT_B5 -> adjust_half_spread(bps=4.2)',
      parentId: 'RT-BRN-02',
      childIds: [],
      pinned: false,
      accessCount: 9,
      lastAccessTick: 8,
      kvPagePointer: 'KV-BLK-0230:0048',
      lcpMatchScore: 93.2,
      evictionPriority: 28.13,
      verificationState: 'SPECULATIVE',
      forkGearIndex: 5,
      acceptanceProb: 0.84,
      depth: 2,
    },
    {
      id: 'RT-LEF-06',
      label: 'Draft Fork B6: Cold Fallback',
      tier: 'LEAF',
      tokens: [8099, 8104, 8112],
      tokenTextPreview: 'DRAFT_B6 -> cancel_resting_quotes(stale_ms=50)',
      parentId: 'RT-BRN-02',
      childIds: [],
      pinned: false,
      accessCount: 3,
      lastAccessTick: 4,
      kvPagePointer: 'KV-BLK-0260:0048',
      lcpMatchScore: 89.5,
      evictionPriority: 4.69,
      verificationState: 'SPECULATIVE',
      forkGearIndex: 6,
      acceptanceProb: 0.69,
      depth: 2,
    },
    {
      id: 'RT-LEF-07',
      label: 'Draft Fork B7: VaR Clamp',
      tier: 'LEAF',
      tokens: [9012, 9034, 9078],
      tokenTextPreview: 'DRAFT_B7 -> enforce_position_cap(max_units=12000)',
      parentId: 'RT-BRN-03',
      childIds: [],
      pinned: false,
      accessCount: 11,
      lastAccessTick: 10,
      kvPagePointer: 'KV-BLK-0290:0048',
      lcpMatchScore: 93.7,
      evictionPriority: 68.75,
      verificationState: 'VERIFIED',
      forkGearIndex: 7,
      acceptanceProb: 0.90,
      depth: 2,
    },
    {
      id: 'RT-LEF-08',
      label: 'Draft Fork B8: Cold Leaf Probe',
      tier: 'LEAF',
      tokens: [9055, 9088, 9099],
      tokenTextPreview: 'DRAFT_B8 -> audit_collateral_buffer(tier=3)',
      parentId: 'RT-BRN-03',
      childIds: [],
      pinned: false,
      accessCount: 2,
      lastAccessTick: 3,
      kvPagePointer: 'KV-BLK-02C0:0048',
      lcpMatchScore: 88.4,
      evictionPriority: 2.78,
      verificationState: 'SPECULATIVE',
      forkGearIndex: 8,
      acceptanceProb: 0.64,
      depth: 2,
    },
  ];
}

export function createInitialRadioLogs(): RadioLogEntry[] {
  return [
    {
      id: 'LOG-01',
      timestamp: '00:01.04',
      callsign: '🟢 CREW CHIEF',
      message: 'Radix prefix match confirmed · 128 tokens reused from Root',
    },
    {
      id: 'LOG-02',
      timestamp: '00:01.08',
      callsign: '⚡ PIT WALL',
      message: 'Speculative tree attention mask generated · 8 branches parallelized',
    },
    {
      id: 'LOG-03',
      timestamp: '00:01.12',
      callsign: '🟢 TELEMETRY',
      message: 'Leaf node verification complete · Zero KV recomputation',
    },
  ];
}

/**
 * Matches a candidate token sequence against the current Radix Tree nodes,
 * returning the matched path of node IDs and total LCP matched token count.
 */
export function evaluateRadixLcpMatch(
  nodes: readonly RadixTreeNode[],
  queryTokens: readonly number[]
): {
  matchedNodeIds: string[];
  matchedTokenCount: number;
  hitRatePct: number;
  terminalNodeId: string;
} {
  const activeMap = new Map<string, RadixTreeNode>();
  for (const n of nodes) {
    if (n.verificationState !== 'PRUNED') {
      activeMap.set(n.id, n);
    }
  }

  const root = activeMap.get('RT-ROOT-00') || nodes[0];
  if (!root) {
    return {
      matchedNodeIds: [],
      matchedTokenCount: 0,
      hitRatePct: 0,
      terminalNodeId: 'NONE',
    };
  }

  let cursor = root;
  const matchedNodeIds: string[] = [root.id];
  const rootLcp = computeLcpLength(root.tokens, queryTokens);
  let matchedTokenCount = rootLcp;
  let offset = rootLcp;

  while (offset < queryTokens.length) {
    const remaining = queryTokens.slice(offset);
    let bestChild: RadixTreeNode | null = null;
    let bestChildLcp = 0;

    for (const childId of cursor.childIds) {
      const child = activeMap.get(childId);
      if (!child) continue;
      const lcp = computeLcpLength(child.tokens, remaining);
      if (lcp > bestChildLcp) {
        bestChildLcp = lcp;
        bestChild = child;
      }
    }

    if (!bestChild || bestChildLcp === 0) {
      break;
    }

    matchedNodeIds.push(bestChild.id);
    matchedTokenCount += bestChildLcp;
    offset += bestChildLcp;
    cursor = bestChild;

    if (bestChildLcp < bestChild.tokens.length) {
      break;
    }
  }

  const hitRatePct =
    Math.round((matchedTokenCount / Math.max(1, queryTokens.length)) * 1000) / 10;

  return {
    matchedNodeIds,
    matchedTokenCount,
    hitRatePct,
    terminalNodeId: cursor.id,
  };
}

/**
 * Prunes the lowest-priority unpinned leaf nodes under LRU memory pressure.
 */
export function pruneColdLeafNodes(
  nodes: readonly RadixTreeNode[],
  maxLeavesToPrune: number,
  currentTick: number
): {
  updatedNodes: RadixTreeNode[];
  prunedNodeIds: string[];
} {
  const candidates = nodes
    .filter(
      (n) =>
        n.tier === 'LEAF' &&
        !n.pinned &&
        n.verificationState !== 'PRUNED' &&
        n.childIds.length === 0
    )
    .map((n) => ({
      node: n,
      priority: calculateEvictionPriority(
        n.pinned,
        n.accessCount,
        n.lastAccessTick,
        currentTick
      ),
    }))
    .sort((a, b) => a.priority - b.priority);

  const selectedIds = new Set(
    candidates.slice(0, Math.max(1, maxLeavesToPrune)).map((c) => c.node.id)
  );

  const prunedNodeIds = Array.from(selectedIds);
  const updatedNodes = nodes.map((n) => {
    if (selectedIds.has(n.id)) {
      return {
        ...n,
        verificationState: 'PRUNED' as VerificationState,
        evictionPriority: 0,
      };
    }
    if (n.childIds.some((cid) => selectedIds.has(cid))) {
      return {
        ...n,
        childIds: n.childIds.filter((cid) => !selectedIds.has(cid)),
      };
    }
    return n;
  });

  return { updatedNodes, prunedNodeIds };
}
