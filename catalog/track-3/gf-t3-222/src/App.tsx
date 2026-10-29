/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  GitBranch,
  Cpu,
  Layers,
  ShieldCheck,
  Terminal,
  RefreshCw,
  Database,
  CheckCircle2,
  Sliders,
  Lock,
  FileCode2,
} from 'lucide-react';

type CorridorId =
  | 'RADIX-CORRIDOR-ALPHA'
  | 'RADIX-CORRIDOR-BRAVO'
  | 'RADIX-CORRIDOR-GAMMA'
  | 'RADIX-CORRIDOR-DELTA';

type TabId = 'Mesh' | 'Tree' | 'Prefixes' | 'Eviction' | 'Transfer';

interface RadixNodeItem {
  id: string;
  parentId: string | null;
  label: string;
  corridor: CorridorId;
  tokenCount: number;
  tokenPreview: string;
  memPtr: string;
  lruRank: number;
  refCount: number;
  hitCount: number;
  ttftMs: number;
  tier: 'ROOT' | 'BRANCH' | 'LEAF';
  lastAccessTick: number;
  status: 'CACHED_ACTIVE' | 'UNREFERENCED_WARM' | 'EVICTION_CANDIDATE';
}

interface TelemetryEvent {
  id: string;
  tick: string;
  action: string;
  detail: string;
  metricDelta: string;
}

const CORRIDOR_OPTIONS: {
  id: CorridorId;
  fullLabel: string;
  bannerLabel: string;
  shortCode: string;
}[] = [
  {
    id: 'RADIX-CORRIDOR-ALPHA',
    fullLabel: 'RADIX-CORRIDOR-ALPHA (ROOT-SYSTEM-PROMPT · 4,096-TOKENS)',
    bannerLabel: 'RADIX-ALPHA · Root System Prompt (4k Tokens)',
    shortCode: 'ALPHA',
  },
  {
    id: 'RADIX-CORRIDOR-BRAVO',
    fullLabel: 'RADIX-CORRIDOR-BRAVO (AGENT-MULTI-TURN-BRANCH)',
    bannerLabel: 'RADIX-BRAVO · Agent Multi-Turn Branch',
    shortCode: 'BRAVO',
  },
  {
    id: 'RADIX-CORRIDOR-GAMMA',
    fullLabel: 'RADIX-CORRIDOR-GAMMA (SPECULATIVE-TREE-SUBTREE)',
    bannerLabel: 'RADIX-GAMMA · Speculative Tree Subtree',
    shortCode: 'GAMMA',
  },
  {
    id: 'RADIX-CORRIDOR-DELTA',
    fullLabel: 'RADIX-CORRIDOR-DELTA (LRU-EVICTION-HORIZON)',
    bannerLabel: 'RADIX-DELTA · LRU Eviction Horizon',
    shortCode: 'DELTA',
  },
];

const INITIAL_NODES: RadixNodeItem[] = [
  {
    id: 'node-root-000',
    parentId: null,
    label: 'ROOT SYSTEM PROMPT',
    corridor: 'RADIX-CORRIDOR-ALPHA',
    tokenCount: 4096,
    tokenPreview: '[101, 2048, 3091, 4096]',
    memPtr: '0x7F00',
    lruRank: 6,
    refCount: 4,
    hitCount: 142,
    ttftMs: 0.42,
    tier: 'ROOT',
    lastAccessTick: 990,
    status: 'CACHED_ACTIVE',
  },
  {
    id: 'node-bravo-101',
    parentId: 'node-root-000',
    label: 'MULTI-TURN CTX A',
    corridor: 'RADIX-CORRIDOR-BRAVO',
    tokenCount: 2048,
    tokenPreview: '[5102, 5109, 5880, 6120]',
    memPtr: '0x7F0A',
    lruRank: 1,
    refCount: 2,
    hitCount: 64,
    ttftMs: 0.88,
    tier: 'BRANCH',
    lastAccessTick: 975,
    status: 'CACHED_ACTIVE',
  },
  {
    id: 'node-bravo-102',
    parentId: 'node-root-000',
    label: 'MULTI-TURN CTX B',
    corridor: 'RADIX-CORRIDOR-BRAVO',
    tokenCount: 1536,
    tokenPreview: '[7011, 7094, 7400, 7912]',
    memPtr: '0x7F1B',
    lruRank: 2,
    refCount: 1,
    hitCount: 39,
    ttftMs: 1.04,
    tier: 'BRANCH',
    lastAccessTick: 960,
    status: 'CACHED_ACTIVE',
  },
  {
    id: 'node-gamma-201',
    parentId: 'node-bravo-101',
    label: 'SPECULATIVE LEAF 01',
    corridor: 'RADIX-CORRIDOR-GAMMA',
    tokenCount: 1024,
    tokenPreview: '[8801, 8802, 8809, 8910]',
    memPtr: '0x7F2C',
    lruRank: 3,
    refCount: 1,
    hitCount: 28,
    ttftMs: 1.12,
    tier: 'LEAF',
    lastAccessTick: 985,
    status: 'CACHED_ACTIVE',
  },
  {
    id: 'node-gamma-202',
    parentId: 'node-bravo-101',
    label: 'SPECULATIVE LEAF 02',
    corridor: 'RADIX-CORRIDOR-GAMMA',
    tokenCount: 1024,
    tokenPreview: '[9012, 9044, 9108, 9200]',
    memPtr: '0x7F3D',
    lruRank: 4,
    refCount: 1,
    hitCount: 19,
    ttftMs: 1.15,
    tier: 'LEAF',
    lastAccessTick: 970,
    status: 'CACHED_ACTIVE',
  },
  {
    id: 'node-delta-301',
    parentId: 'node-bravo-102',
    label: 'IDLE TURN LEAF 03',
    corridor: 'RADIX-CORRIDOR-DELTA',
    tokenCount: 1536,
    tokenPreview: '[3301, 3309, 3412, 3590]',
    memPtr: '0x7F4E',
    lruRank: 5,
    refCount: 0,
    hitCount: 7,
    ttftMs: 1.38,
    tier: 'LEAF',
    lastAccessTick: 410,
    status: 'EVICTION_CANDIDATE',
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('Tree');
  const [selectedCorridor, setSelectedCorridor] = useState<CorridorId>('RADIX-CORRIDOR-ALPHA');
  const [nodes, setNodes] = useState<RadixNodeItem[]>(INITIAL_NODES);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('node-bravo-101');
  const [hitRatePct, setHitRatePct] = useState<string>('86.4%');
  const [ttftDeltaText, setTtftDeltaText] = useState<string>('1.12 ms vs 14.8 ms');
  const [activeNodeCount, setActiveNodeCount] = useState<number>(42);
  const [sharedPrefixTokens, setSharedPrefixTokens] = useState<number>(124800);
  const [evictedUnits, setEvictedUnits] = useState<number>(0);
  const [tickCounter, setTickCounter] = useState<number>(1000);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [rbacRole, setRbacRole] = useState<'OPERATOR_BRANCH' | 'ADMIN_EVICT_AUDIT'>(
    'ADMIN_EVICT_AUDIT'
  );

  const [eventLog, setEventLog] = useState<TelemetryEvent[]>([
    {
      id: 'evt-1',
      tick: '00:01.04',
      action: 'O(L) PREFIX MATCH',
      detail: 'RADIX-CORRIDOR-ALPHA matched 4,096 root tokens (0x7F00)',
      metricDelta: '1.12 ms vs 14.8 ms',
    },
    {
      id: 'evt-2',
      tick: '00:00.82',
      action: 'ZERO-COPY SPLIT',
      detail: 'RADIX-CORRIDOR-BRAVO split edge at 0x7F0A (Ref Count: 2)',
      metricDelta: 'Prefix Reuse: 86.4%',
    },
  ]);

  const appendEvent = (action: string, detail: string, metricDelta: string) => {
    const nextTick = tickCounter + 1;
    setTickCounter(nextTick);
    const newEvt: TelemetryEvent = {
      id: 'evt-' + String(nextTick),
      tick: '00:0' + String((nextTick % 9) + 1) + '.18',
      action,
      detail,
      metricDelta,
    };
    setEventLog((prev) => [newEvt, ...prev.slice(0, 3)]);
  };

  // Top Header Micro-Action: [Match]
  const handleMicroMatch = () => {
    setHitRatePct('91.8%');
    setTtftDeltaText('0.84 ms vs 14.8 ms');
    setSharedPrefixTokens((prev) => prev + 4096);
    setNodes((prev) =>
      prev.map((n) =>
        n.corridor === selectedCorridor || n.tier === 'ROOT'
          ? { ...n, hitCount: n.hitCount + 8, lastAccessTick: tickCounter + 5 }
          : n
      )
    );
    appendEvent(
      'LONGEST PREFIX MATCH',
      selectedCorridor + ' traversed in O(L) with 4,096 KV slots reused',
      'Prefix Reuse: 91.8%'
    );
  };

  // Top Header Micro-Action: [Branch]
  const handleMicroBranch = () => {
    const branchId = 'node-leaf-' + String(tickCounter);
    const hexSuffix = (nodes.length + 10).toString(16).toUpperCase();
    const newBranch: RadixNodeItem = {
      id: branchId,
      parentId: 'node-bravo-101',
      label: 'DYNAMIC FORK ' + String(nodes.length + 1),
      corridor: selectedCorridor,
      tokenCount: 1024,
      tokenPreview: '[6401, 6402, 6488, 6512]',
      memPtr: '0x7F' + hexSuffix,
      lruRank: nodes.length + 1,
      refCount: 1,
      hitCount: 12,
      ttftMs: 0.96,
      tier: 'LEAF',
      lastAccessTick: tickCounter + 10,
      status: 'CACHED_ACTIVE',
    };
    setNodes((prev) => [
      ...prev.map((n) => (n.id === 'node-root-000' ? { ...n, refCount: n.refCount + 1 } : n)),
      ...prev.filter((n) => n.tier !== 'ROOT').slice(0, 4),
      newBranch,
    ]);
    setActiveNodeCount((prev) => prev + 1);
    setSharedPrefixTokens((prev) => prev + 1024);
    setSelectedNodeId(branchId);
    appendEvent(
      'SUBTREE BRANCH FORK',
      'Spawned zero-copy leaf ' + branchId + ' (' + newBranch.memPtr + ')',
      'Active Nodes: ' + String(activeNodeCount + 1) + ' Slots'
    );
  };

  // Top Header Micro-Action: [Run]
  const handleMicroRun = () => {
    setHitRatePct('88.6%');
    setTtftDeltaText('1.05 ms vs 14.8 ms');
    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        hitCount: n.hitCount + 3,
      }))
    );
    appendEvent(
      'BATCH STREAM VERIFY',
      'Executed multi-turn radix sweep across active corridors',
      'TTFT: 1.05 ms vs 14.8 ms'
    );
  };

  // Chaos Trigger 1: [Inject Root 4k]
  const triggerInjectSharedRoot = () => {
    setSelectedCorridor('RADIX-CORRIDOR-ALPHA');
    setHitRatePct('93.2%');
    setTtftDeltaText('0.68 ms vs 14.8 ms');
    setSharedPrefixTokens((prev) => prev + 4096);
    setNodes((prev) =>
      prev.map((n) =>
        n.id === 'node-root-000'
          ? {
              ...n,
              refCount: n.refCount + 2,
              hitCount: n.hitCount + 24,
              ttftMs: 0.38,
              status: 'CACHED_ACTIVE',
            }
          : n
      )
    );
    setSelectedNodeId('node-root-000');
    appendEvent(
      'INJECT SHARED ROOT (4K)',
      'Pinned 4,096-token root prompt at 0x7F00 across concurrent sessions',
      'Cached: ' + String((sharedPrefixTokens + 4096).toLocaleString()) + ' Units'
    );
  };

  // Chaos Trigger 2: [Fork 4 Branches]
  const triggerForkFourBranches = () => {
    setSelectedCorridor('RADIX-CORRIDOR-BRAVO');
    const baseTick = tickCounter + 1;
    const ptrCodes = ['0x7F5A', '0x7F6B', '0x7F7C'];
    const forkedNodes: RadixNodeItem[] = [1, 2, 3].map((idx) => ({
      id: 'node-fork-0' + String(idx),
      parentId: 'node-bravo-101',
      label: 'MULTI-TURN FORK #' + String(idx),
      corridor: 'RADIX-CORRIDOR-BRAVO',
      tokenCount: 512 * idx,
      tokenPreview: '[440' + String(idx) + ', 4410, 4499, 4520]',
      memPtr: ptrCodes[idx - 1],
      lruRank: idx + 2,
      refCount: idx === 3 ? 0 : 1,
      hitCount: 15 + idx * 4,
      ttftMs: Number((0.92 + idx * 0.05).toFixed(2)),
      tier: 'LEAF',
      lastAccessTick: baseTick - idx * 30,
      status: idx === 3 ? 'EVICTION_CANDIDATE' : 'CACHED_ACTIVE',
    }));

    setNodes((prev) => [
      ...prev.slice(0, 3).map((n) =>
        n.id === 'node-root-000' || n.id === 'node-bravo-101'
          ? { ...n, refCount: n.refCount + 3, hitCount: n.hitCount + 16 }
          : n
      ),
      ...forkedNodes,
    ]);
    setActiveNodeCount(46);
    setSharedPrefixTokens(141184);
    setHitRatePct('89.7%');
    setTtftDeltaText('0.94 ms vs 14.8 ms');
    setSelectedNodeId('node-fork-01');
    appendEvent(
      'FORK 4 MULTI-TURN BRANCHES',
      'Branched concurrent turns from 0x7F0A without duplicating KV pages',
      'Active Nodes: 46 Slots'
    );
  };

  // Chaos Trigger 3: [Simulate LRU]
  const triggerSimulateLruEviction = () => {
    setSelectedCorridor('RADIX-CORRIDOR-DELTA');
    const surviving = nodes.filter((n) => n.refCount > 0 || n.tier === 'ROOT');
    const evictedCount = Math.max(1, nodes.length - surviving.length);
    const evictedTokenSum = evictedCount * 1536;

    setNodes(
      surviving.map((n, idx) =>
        idx === surviving.length - 1 && n.tier === 'LEAF'
          ? { ...n, refCount: 0, lruRank: 1, status: 'UNREFERENCED_WARM' }
          : n
      )
    );
    setEvictedUnits((prev) => prev + evictedTokenSum);
    setActiveNodeCount((prev) => Math.max(38, prev - evictedCount));
    setSharedPrefixTokens((prev) => Math.max(96000, prev - evictedTokenSum));
    setSelectedNodeId('node-bravo-101');
    appendEvent(
      'ZERO-COPY LRU EVICTION',
      'Evicted unreferenced leaf subtrees (ref_count == 0) in oldest-tick order',
      'Evictions: ' + String(evictedUnits + evictedTokenSum) + ' Units'
    );
  };

  // Chaos Trigger 4: [Prune & Reset]
  const triggerPruneAndReset = () => {
    setNodes(INITIAL_NODES);
    setSelectedCorridor('RADIX-CORRIDOR-ALPHA');
    setSelectedNodeId('node-bravo-101');
    setHitRatePct('86.4%');
    setTtftDeltaText('1.12 ms vs 14.8 ms');
    setActiveNodeCount(42);
    setSharedPrefixTokens(124800);
    setEvictedUnits(0);
    appendEvent(
      'PRUNE & RESET CACHE',
      'Pruned unreferenced subtrees and restored baseline 42-node topology',
      'Prefix Reuse: 86.4%'
    );
  };

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) || nodes[0],
    [nodes, selectedNodeId]
  );

  const filteredNodes = useMemo(() => {
    if (!searchFilter.trim()) return nodes;
    const q = searchFilter.toLowerCase();
    return nodes.filter(
      (n) =>
        n.id.toLowerCase().includes(q) ||
        n.label.toLowerCase().includes(q) ||
        n.corridor.toLowerCase().includes(q) ||
        n.memPtr.toLowerCase().includes(q)
    );
  }, [nodes, searchFilter]);

  const rootNode = nodes.find((n) => n.tier === 'ROOT') || INITIAL_NODES[0];
  const branchNodes = nodes.filter((n) => n.tier === 'BRANCH');
  const leafNodes = nodes.filter((n) => n.tier === 'LEAF');

  const activeCorridorBanner =
    CORRIDOR_OPTIONS.find((c) => c.id === selectedCorridor)?.bannerLabel ||
    'RADIX-ALPHA · Root System Prompt (4k Tokens)';

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans select-none">
      {/* TOP SECTION: HEADER + 4-CARD HUD + TABS + ACTIVE CORRIDOR */}
      <div className="shrink-0">
        {/* Header */}
        <header className="bg-[#0f172a] border border-slate-800 rounded-lg px-2.5 py-1 flex flex-col">
          {/* Header Row 1 */}
          <div className="flex items-center justify-between gap-1 w-full">
            <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
              <Cpu className="w-4 h-4 text-cyan-400 shrink-0" />
              <h1 className="text-sm md:text-base font-bold tracking-tight text-white">
                GF-T3-222
              </h1>
              <span className="px-1.5 py-0.5 text-[11px] font-mono font-semibold bg-cyan-950/90 text-cyan-300 border border-cyan-700/60 rounded">
                TRACK 3
              </span>
            </div>

            <div className="flex items-center gap-0.5 shrink-0">
              <select
                aria-label="Select Synthetic Radix Corridor"
                value={selectedCorridor}
                onChange={(e) => setSelectedCorridor(e.target.value as CorridorId)}
                className="max-w-[55px] truncate bg-slate-900 text-slate-200 border border-slate-700 rounded px-1 py-0.5 text-[10px] font-mono focus:outline-none focus:border-cyan-500"
                title={selectedCorridor}
              >
                {CORRIDOR_OPTIONS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.shortCode} · {c.fullLabel}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleMicroMatch}
                className="px-1 py-0.5 text-[10px] font-mono font-semibold bg-slate-800 hover:bg-cyan-950 text-cyan-300 border border-slate-700 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                [Match]
              </button>
              <button
                type="button"
                onClick={handleMicroBranch}
                className="px-1 py-0.5 text-[10px] font-mono font-semibold bg-slate-800 hover:bg-emerald-950 text-emerald-300 border border-slate-700 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                [Branch]
              </button>
              <button
                type="button"
                onClick={handleMicroRun}
                className="px-1 py-0.5 text-[10px] font-mono font-semibold bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                [Run]
              </button>
            </div>
          </div>

          {/* Header Row 2 */}
          <p className="text-[11px] text-slate-400 truncate mt-0.5">
            Prefix-Tree (Radix) KV Cache · Dynamic Multi-Turn Reuse · Zero-Copy LRU · O(L) Matching
          </p>
        </header>

        {/* 4-Card HUD */}
        <section
          aria-label="Key Performance Telemetry Ribbon"
          className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 my-1 w-full"
        >
          {/* Card 1 */}
          <div className="py-1.5 px-2.5 bg-slate-900/80 border border-slate-800 rounded-lg flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-semibold text-slate-300 tracking-wide truncate">
                Prefix Cache Hit Rate
              </span>
              <span className="text-[11px] font-mono font-medium text-slate-400 shrink-0">
                Reuse
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-1 mt-0.5">
              <span className="text-base lg:text-lg font-bold font-mono text-cyan-300">
                {hitRatePct}
              </span>
              <span className="text-[11px] font-mono font-medium text-slate-400 truncate">
                O(L) Index
              </span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="py-1.5 px-2.5 bg-slate-900/80 border border-slate-800 rounded-lg flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-semibold text-slate-300 tracking-wide truncate">
                TTFT Reduction Delta
              </span>
              <span className="text-[11px] font-mono font-medium text-slate-400 shrink-0">
                -92.4%
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-1 mt-0.5">
              <span className="text-sm lg:text-base font-bold text-emerald-400 font-mono whitespace-nowrap">
                {ttftDeltaText}
              </span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="py-1.5 px-2.5 bg-slate-900/80 border border-slate-800 rounded-lg flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-semibold text-slate-300 tracking-wide truncate">
                Active Tree Nodes
              </span>
              <span className="text-[11px] font-mono font-medium text-slate-400 shrink-0">
                Evicted: {evictedUnits}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-1 mt-0.5">
              <div className="text-base lg:text-lg font-bold text-slate-100 flex items-baseline gap-1 font-mono">
                <span className="text-emerald-400">{activeNodeCount}</span>
                <span className="text-xs font-semibold text-emerald-300">Nodes</span>
              </div>
              <span className="text-[11px] font-mono font-medium text-slate-400 truncate">
                Zero-Copy
              </span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="py-1.5 px-2.5 bg-slate-900/80 border border-slate-800 rounded-lg flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-semibold text-slate-300 tracking-wide truncate">
                Shared Prefix Tokens
              </span>
              <span className="text-[11px] font-mono font-medium text-slate-400 shrink-0">
                KV Pages
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-1 mt-0.5">
              <div className="text-base lg:text-lg font-bold text-slate-100 flex items-baseline gap-1 font-mono">
                <span>{sharedPrefixTokens.toLocaleString()}</span>
                <span className="text-xs font-semibold text-cyan-300">Units</span>
              </div>
              <span className="text-[11px] font-mono font-medium text-slate-400 truncate">
                Cached
              </span>
            </div>
          </div>
        </section>

        {/* Tabs Strip + Active Corridor Banner */}
        <div className="flex items-center justify-between gap-2 bg-[#0f172a] border border-slate-800 rounded-lg my-1 p-1 px-2.5">
          <div className="flex items-center gap-1 overflow-x-auto" role="tablist">
            {(['Mesh', 'Tree', 'Prefixes', 'Eviction', 'Transfer'] as TabId[]).map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab)}
                  className={
                    'px-2.5 py-0.5 text-[11px] shrink-0 font-mono font-semibold rounded transition-colors cursor-pointer ' +
                    (isActive
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800')
                  }
                >
                  {tab}
                </button>
              );
            })}
          </div>

          <div className="text-xs font-mono text-cyan-300 font-medium whitespace-nowrap truncate">
            Active Corridor: {activeCorridorBanner}
          </div>
        </div>
      </div>

      {/* MIDDLE SECTION: RADIX TREE VISUALIZER */}
      <main className="flex-1 min-h-0 flex flex-col justify-between p-2 bg-slate-950/80 border border-slate-800 rounded-lg overflow-hidden">
        {activeTab === 'Tree' && (
          <div className="flex flex-col gap-1.5 my-0.5">
            {/* Header */}
            <div className="text-xs font-semibold text-cyan-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
                Interactive 2D Radix Tree KV-Cache Topology
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Click Tier 0 / Tier 1 / Tier 2 node to inspect hardware pointer &amp; LRU rank
              </span>
            </div>

            {/* Tier 0 (Root) */}
            <div className="flex flex-col gap-0.5">
              <div className="text-xs font-bold font-mono tracking-wider text-cyan-400">
                TIER 0 · SHARED ROOT
              </div>
              <button
                type="button"
                onClick={() => setSelectedNodeId(rootNode.id)}
                className={
                  'w-full p-2 bg-slate-950 border rounded-lg text-left transition-colors cursor-pointer flex items-center justify-between gap-2 ' +
                  (selectedNode.id === rootNode.id
                    ? 'border-cyan-400 bg-cyan-950/30'
                    : 'border-slate-800 hover:border-cyan-500/60')
                }
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/70">
                    {rootNode.memPtr}
                  </span>
                  <span className="text-xs font-bold text-slate-100 truncate">
                    {rootNode.label}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                    ({rootNode.corridor})
                  </span>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="text-xs font-mono font-semibold text-slate-200">
                    {rootNode.tokenCount} Tokens
                  </span>
                  <span className="text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded bg-cyan-900/60 text-cyan-200">
                    Ref: {rootNode.refCount}
                  </span>
                  <span className="text-xs font-mono font-semibold text-emerald-400">
                    {rootNode.ttftMs} ms
                  </span>
                </div>
              </button>
            </div>

            {/* Tier 1 (Branches) */}
            <div className="flex flex-col gap-0.5">
              <div className="text-xs font-bold font-mono tracking-wider text-cyan-400">
                TIER 1 · MULTI-TURN ({branchNodes.length})
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {branchNodes.map((bNode) => (
                  <button
                    key={bNode.id}
                    type="button"
                    onClick={() => setSelectedNodeId(bNode.id)}
                    className={
                      'p-2 bg-slate-950 border rounded-lg text-left transition-colors cursor-pointer flex flex-col justify-between gap-1 ' +
                      (selectedNode.id === bNode.id
                        ? 'border-emerald-400 bg-emerald-950/30'
                        : 'border-slate-800 hover:border-emerald-700/60')
                    }
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-xs font-bold text-slate-100 truncate">
                        {bNode.label}
                      </span>
                      <span className="text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 shrink-0">
                        Ref: {bNode.refCount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900 text-emerald-300 border border-slate-800">
                        {bNode.memPtr}
                      </span>
                      <span className="text-xs font-mono font-semibold text-slate-200">
                        +{bNode.tokenCount} Tokens
                      </span>
                      <span className="text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-900 text-cyan-300">
                        LRU #{bNode.lruRank}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Tier 2 (Leaves) */}
            <div className="flex flex-col gap-0.5">
              <div className="text-xs font-bold font-mono tracking-wider text-cyan-400">
                TIER 2 · STREAM LEAVES ({leafNodes.length})
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {leafNodes.map((lNode) => {
                  const isEvictCandidate = lNode.refCount === 0;
                  return (
                    <button
                      key={lNode.id}
                      type="button"
                      onClick={() => setSelectedNodeId(lNode.id)}
                      className={
                        'p-2 bg-slate-950 border rounded-lg text-left transition-colors cursor-pointer flex flex-col justify-between gap-1 ' +
                        (selectedNode.id === lNode.id
                          ? 'border-amber-400 bg-slate-900'
                          : isEvictCandidate
                          ? 'border-amber-800/60 bg-amber-950/20'
                          : 'border-slate-800 hover:border-slate-700')
                      }
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-100 truncate">
                          {lNode.label}
                        </span>
                        <span
                          className={
                            'text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded border shrink-0 ' +
                            (isEvictCandidate
                              ? 'bg-amber-950 text-amber-300 border-amber-700'
                              : 'bg-emerald-950 text-emerald-300 border-emerald-800')
                          }
                        >
                          Ref: {lNode.refCount}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900 text-cyan-300 border border-slate-800">
                          {lNode.memPtr}
                        </span>
                        <span className="text-xs font-mono font-semibold text-slate-200">
                          +{lNode.tokenCount}T
                        </span>
                        <span className="text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-900 text-amber-300">
                          LRU #{lNode.lruRank}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Mesh' && (
          <div className="grid grid-cols-2 gap-2 my-auto">
            {CORRIDOR_OPTIONS.map((corridorItem) => {
              const countInCorridor = nodes.filter((n) => n.corridor === corridorItem.id).length;
              const isSelected = selectedCorridor === corridorItem.id;
              return (
                <div
                  key={corridorItem.id}
                  onClick={() => setSelectedCorridor(corridorItem.id)}
                  className={
                    'p-2.5 rounded-lg border transition-colors cursor-pointer text-xs font-mono ' +
                    (isSelected
                      ? 'bg-cyan-950/40 border-cyan-500'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700')
                  }
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-cyan-300 truncate">{corridorItem.id}</span>
                    <span className="text-emerald-400 shrink-0">{countInCorridor} Nodes</span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1 truncate">
                    {corridorItem.fullLabel}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'Prefixes' && (
          <div className="flex-1 min-h-0 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs font-bold text-white flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                Longest Common Prefix Match Directory
              </span>
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter node or pointer..."
                className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="overflow-y-auto flex-1 min-h-0">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-1 px-1.5">Node ID</th>
                    <th className="py-1 px-1.5">Pointer</th>
                    <th className="py-1 px-1.5 text-right">Tokens</th>
                    <th className="py-1 px-1.5 text-right">Ref</th>
                    <th className="py-1 px-1.5 text-right">LRU</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNodes.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedNodeId(row.id)}
                      className="border-b border-slate-800/60 hover:bg-slate-900 cursor-pointer"
                    >
                      <td className="py-1 px-1.5 text-cyan-300 font-semibold">{row.id}</td>
                      <td className="py-1 px-1.5 text-slate-300">{row.memPtr}</td>
                      <td className="py-1 px-1.5 text-right text-slate-200 font-semibold">
                        {row.tokenCount} Tokens
                      </td>
                      <td className="py-1 px-1.5 text-right text-emerald-400 font-bold">
                        {row.refCount}
                      </td>
                      <td className="py-1 px-1.5 text-right text-amber-300">#{row.lruRank}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'Eviction' && (
          <div className="grid grid-cols-3 gap-1.5 my-auto">
            {nodes.map((nodeItem) => {
              const isEvictable = nodeItem.refCount === 0 && nodeItem.tier === 'LEAF';
              return (
                <div
                  key={nodeItem.id}
                  onClick={() => setSelectedNodeId(nodeItem.id)}
                  className={
                    'p-2 rounded-lg border flex flex-col justify-between text-xs font-mono cursor-pointer ' +
                    (isEvictable
                      ? 'bg-amber-950/30 border-amber-700/70 text-amber-200'
                      : 'bg-slate-950 border-slate-800 text-slate-300')
                  }
                >
                  <div className="text-xs font-bold text-slate-100 truncate">{nodeItem.label}</div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">
                    {nodeItem.memPtr} · Ref: {nodeItem.refCount} · LRU #{nodeItem.lruRank}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'Transfer' && (
          <div className="grid grid-cols-3 gap-2 my-auto text-xs font-mono">
            <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg">
              <div className="text-cyan-300 font-bold flex items-center gap-1">
                <FileCode2 className="w-3.5 h-3.5" /> engine.py + Pytest
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                FastAPI O(L) Radix engine, test_radix_cache_engine.py, Cloud Run Dockerfile.
              </p>
            </div>
            <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg">
              <div className="text-emerald-300 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> ENGINE_SPEC &amp; AUDIT
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Prefix proofs, PostgreSQL DDL, OpenAPI 3.1, 100% MIT SBOM, NIST SSDF v1.1.
              </p>
            </div>
            <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg flex flex-col justify-between">
              <div className="text-amber-300 font-bold flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5" /> ASSET_TRANSFER
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setRbacRole(
                      rbacRole === 'ADMIN_EVICT_AUDIT' ? 'OPERATOR_BRANCH' : 'ADMIN_EVICT_AUDIT'
                    )
                  }
                  className="px-1.5 py-0.5 bg-slate-800 rounded text-[11px] text-cyan-300 flex items-center gap-0.5 cursor-pointer"
                >
                  <Lock className="w-3 h-3" /> {rbacRole}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Direct APA repo handoff, clean title warranty, zero-SaaS SLA disclaimer.
              </p>
            </div>
          </div>
        )}

        {/* Selected Node Inspector */}
        <div className="py-1 px-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono font-medium text-cyan-300 truncate flex items-center justify-between gap-2 shrink-0">
          <span className="truncate">
            SELECTED: <strong className="text-white">{selectedNode.id}</strong> ·{' '}
            <strong className="text-emerald-300">
              {selectedNode.memPtr} · Ref Count: {selectedNode.refCount} · LRU Rank: #
              {selectedNode.lruRank}
            </strong>
          </span>
          <span className="shrink-0 text-slate-200 font-semibold">
            Slice: {selectedNode.tokenPreview} · TTFT: {selectedNode.ttftMs} ms
          </span>
        </div>
      </main>

      {/* BOTTOM SECTION: CHAOS CONTROLS & TELEMETRY LOG */}
      <div className="shrink-0 mt-1">
        {/* Chaos Buttons Bar */}
        <div className="grid grid-cols-4 gap-1.5 w-full">
          <button
            type="button"
            onClick={triggerInjectSharedRoot}
            className="py-1.5 text-xs font-semibold bg-cyan-950/40 border border-cyan-700/50 text-cyan-300 hover:bg-cyan-900/60 rounded-lg transition-colors cursor-pointer truncate"
          >
            [Inject Root 4k]
          </button>
          <button
            type="button"
            onClick={triggerForkFourBranches}
            className="py-1.5 text-xs font-semibold bg-emerald-950/40 border border-emerald-700/50 text-emerald-300 hover:bg-emerald-900/60 rounded-lg transition-colors cursor-pointer truncate"
          >
            [Fork 4 Branches]
          </button>
          <button
            type="button"
            onClick={triggerSimulateLruEviction}
            className="py-1.5 text-xs font-semibold bg-amber-950/40 border border-amber-700/50 text-amber-300 hover:bg-amber-900/60 rounded-lg transition-colors cursor-pointer truncate"
          >
            [Simulate LRU]
          </button>
          <button
            type="button"
            onClick={triggerPruneAndReset}
            className="py-1.5 text-xs font-semibold bg-rose-950/40 border border-rose-700/50 text-rose-300 hover:bg-rose-900/60 rounded-lg transition-colors cursor-pointer truncate"
          >
            [Prune &amp; Reset]
          </button>
        </div>

        {/* Telemetry Log */}
        <div className="text-[11px] font-mono text-slate-300 leading-relaxed p-2 h-16 overflow-hidden bg-black/80 border border-slate-800/80 rounded-lg mt-1 flex flex-col justify-between">
          <div className="flex items-center justify-between text-cyan-400 font-semibold border-b border-slate-900 pb-0.5">
            <span className="flex items-center gap-1">
              <Terminal className="w-3 h-3" /> RADIX TELEMETRY STREAM · GF-T3-222
            </span>
            <span className="text-emerald-400">O(L) ZERO-COPY VERIFIED</span>
          </div>
          {eventLog.slice(0, 1).map((ev) => (
            <div key={ev.id} className="flex items-center justify-between gap-2 truncate">
              <span className="truncate">
                <strong className="text-cyan-300">
                  [{ev.tick}] {ev.action}:
                </strong>{' '}
                {ev.detail}
              </span>
              <span className="text-emerald-400 font-semibold shrink-0">{ev.metricDelta}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
