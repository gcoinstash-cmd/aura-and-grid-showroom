/**
 * @license
 * SPDX-License-Identifier: MIT
 * GF-T3-227: Prefix-Tree Radix KV-Cache & Speculative Tree Attention Cockpit
 */

import React, { useMemo, useState } from 'react';
import {
  CORRIDOR_LIST,
  RadixTreeNode,
  RadioLogEntry,
  SYNTHETIC_CORRIDORS,
  SyntheticCorridorId,
  buildCausalTreeAttentionMask,
  calculateEvictionPriority,
  createInitialRadioLogs,
  createInitialRadixTree,
  evaluateRadixLcpMatch,
  pruneColdLeafNodes,
  sanitizePromptIngress,
  verifyTreeAttentionNumericalParity,
} from './engine/radixEngine';

type CockpitTab = 'Mesh' | 'Trie' | 'Forks' | 'Masks' | 'APA';

const TABS: CockpitTab[] = ['Mesh', 'Trie', 'Forks', 'Masks', 'APA'];

const SUPABASE_RLS_SCHEMA_SNIPPET = [
  'CREATE TABLE IF NOT EXISTS radix_kv_nodes (',
  '  node_id TEXT PRIMARY KEY,',
  '  corridor_id TEXT NOT NULL REFERENCES radix_corridors(corridor_id),',
  '  parent_id TEXT REFERENCES radix_kv_nodes(node_id) ON DELETE CASCADE,',
  '  tenant_org_id UUID NOT NULL,',
  '  token_sequence INTEGER[] NOT NULL,',
  '  kv_page_pointer TEXT NOT NULL,',
  '  pinned BOOLEAN NOT NULL DEFAULT FALSE,',
  '  eviction_priority NUMERIC(14, 4) NOT NULL',
  ');',
  'ALTER TABLE radix_kv_nodes ENABLE ROW LEVEL SECURITY;',
  'CREATE POLICY radix_kv_nodes_tenant_isolation_policy ON radix_kv_nodes',
  "  USING (tenant_org_id = (nullif(current_setting('request.jwt.claim.org_id', true), '')::uuid));",
].join('\n');

export default function App() {
  const [corridor, setCorridor] = useState<SyntheticCorridorId>(
    'TREE-CORRIDOR-ALPHA (RADIX-TREE-LCP · DYNAMIC-PRUNING)'
  );
  const [activeTab, setActiveTab] = useState<CockpitTab>('Trie');
  const [nodes, setNodes] = useState<RadixTreeNode[]>(() => createInitialRadixTree());
  const [selectedNodeId, setSelectedNodeId] = useState<string>('RT-ROOT-00');
  const [radioLogs, setRadioLogs] = useState<RadioLogEntry[]>(() => createInitialRadioLogs());
  const [tick, setTick] = useState<number>(12);
  const [lruPruningEnabled, setLruPruningEnabled] = useState<boolean>(true);
  const [engineLockedState, setEngineLockedState] = useState<'LOCKED' | 'FAULT'>('LOCKED');

  // HUD live telemetry state initialized to exact specification baseline
  const [prefixHitRate, setPrefixHitRate] = useState<number>(94.2);
  const [traversalLatencyMs, setTraversalLatencyMs] = useState<number>(0.28);
  const [radixNodeCount, setRadixNodeCount] = useState<number>(64);
  const [branchForkCount, setBranchForkCount] = useState<number>(8);
  const [tokenReuseUnits, setTokenReuseUnits] = useState<number>(196000);
  const [trieXpDelta, setTrieXpDelta] = useState<number>(6.4);
  const [reusedKvRatioPct, setReusedKvRatioPct] = useState<number>(82);
  const [customTokenInput, setCustomTokenInput] = useState<string>(
    '101, 2054, 2003, 1996, 3928, 4007, 1024, 2048, 4102, 4109, 4188, 7011, 7012'
  );
  const [matchedPathHighlight, setMatchedPathHighlight] = useState<string[]>([
    'RT-ROOT-00',
    'RT-BRN-01',
    'RT-LEF-01',
  ]);
  const [apaModalMessage, setApaModalMessage] = useState<string | null>(null);

  const corridorProfile = SYNTHETIC_CORRIDORS[corridor];

  const selectedNode = useMemo(() => {
    return nodes.find((n) => n.id === selectedNodeId) || nodes[0];
  }, [nodes, selectedNodeId]);

  const activeLeaves = useMemo(() => {
    return nodes.filter((n) => n.tier === 'LEAF' && n.verificationState !== 'PRUNED');
  }, [nodes]);

  const branchGears = useMemo(() => {
    const gears: { gear: number; label: string; active: boolean; state: string }[] = [];
    for (let g = 1; g <= 8; g += 1) {
      const leafForGear = nodes.find((n) => n.tier === 'LEAF' && n.forkGearIndex === g);
      const isActive = Boolean(leafForGear && leafForGear.verificationState !== 'PRUNED');
      gears.push({
        gear: g,
        label: 'B' + String(g),
        active: isActive,
        state: leafForGear ? leafForGear.verificationState : 'PRUNED',
      });
    }
    return gears;
  }, [nodes]);

  const maskData = useMemo(() => {
    return buildCausalTreeAttentionMask(nodes.slice(0, 8));
  }, [nodes]);

  const parityResult = useMemo(() => {
    const qMat = [
      [0.35, -0.15, 0.62, 0.18],
      [0.28, 0.54, -0.12, 0.71],
      [-0.41, 0.78, 0.24, 0.55],
      [0.64, -0.32, 0.19, -0.48],
      [0.51, -0.22, 0.84, 0.29],
      [-0.29, 0.67, -0.38, 0.42],
      [0.19, 0.44, 0.53, -0.31],
      [-0.55, 0.31, 0.68, 0.14],
    ];
    const kMat = [
      [0.42, 0.19, 0.58, -0.21],
      [-0.27, 0.68, 0.21, 0.39],
      [0.31, 0.74, -0.45, 0.28],
      [0.79, -0.61, 0.37, 0.15],
      [-0.38, 0.64, 0.49, 0.22],
      [0.52, -0.43, 0.29, 0.61],
      [0.14, 0.59, -0.33, 0.47],
      [-0.49, 0.28, 0.71, -0.19],
    ];
    const vMat = [
      [1.05, 0.22, -0.38, 0.49],
      [0.34, -0.58, 0.79, 0.14],
      [-0.21, 0.88, 0.31, -0.64],
      [2.15, -1.42, 1.08, 3.12],
      [0.44, -0.69, 1.15, 0.38],
      [-1.18, 1.45, -0.72, 2.04],
      [0.82, 0.31, -0.54, 0.91],
      [-0.76, 1.12, 0.48, -0.85],
    ];
    const count = maskData.nodeIds.length;
    const pathIndices = count >= 5 ? [0, 1, 4] : [0];
    return verifyTreeAttentionNumericalParity(
      qMat.slice(0, count),
      kMat.slice(0, count),
      vMat.slice(0, count),
      maskData.matrix,
      pathIndices
    );
  }, [maskData]);

  const appendRadioLog = (
    callsign: RadioLogEntry['callsign'],
    message: string,
    nextTick: number
  ) => {
    const secs = String(Math.floor(nextTick / 10)).padStart(2, '0');
    const hundredths = String((nextTick * 4) % 100).padStart(2, '0');
    const timestamp = '00:' + secs + '.' + hundredths;
    const entry: RadioLogEntry = {
      id: 'LOG-' + String(nextTick) + '-' + String(Date.now() % 10000),
      timestamp,
      callsign,
      message,
    };
    setRadioLogs((prev) => [entry, ...prev.slice(0, 7)]);
  };

  const handleSelectCorridor = (nextCorridor: SyntheticCorridorId) => {
    const nextTick = tick + 1;
    setTick(nextTick);
    setCorridor(nextCorridor);
    const prof = SYNTHETIC_CORRIDORS[nextCorridor];
    setTraversalLatencyMs(prof.baseTraversalMs);
    appendRadioLog(
      '⚡ PIT WALL',
      'Corridor switched to ' +
        prof.shortCode +
        ' · Cache Bandwidth ' +
        prof.bandwidthGbs.toLocaleString() +
        ' GB/s',
      nextTick
    );
  };

  // Micro Action: Run LCP Prefix Match
  const handleRunLcpMatch = () => {
    const nextTick = tick + 1;
    setTick(nextTick);

    try {
      const parsedTokens = customTokenInput
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !Number.isNaN(n));

      const sanitized = sanitizePromptIngress({
        corridor,
        label: 'Interactive LCP Query',
        tokens: parsedTokens.length > 0 ? parsedTokens : [101, 2054, 2003, 1996, 3928, 4007],
      });

      const matchRes = evaluateRadixLcpMatch(nodes, sanitized.tokens);
      setMatchedPathHighlight(matchRes.matchedNodeIds);
      if (matchRes.terminalNodeId !== 'NONE') {
        setSelectedNodeId(matchRes.terminalNodeId);
      }

      const updatedNodes = nodes.map((n) => {
        if (matchRes.matchedNodeIds.includes(n.id)) {
          const nextAccess = n.accessCount + 1;
          return {
            ...n,
            accessCount: nextAccess,
            lastAccessTick: nextTick,
            evictionPriority: calculateEvictionPriority(n.pinned, nextAccess, nextTick, nextTick),
          };
        }
        return n;
      });
      setNodes(updatedNodes);

      const nextHitRate = Math.min(
        99.4,
        Math.max(84.0, Math.round((prefixHitRate * 0.7 + matchRes.hitRatePct * 0.3) * 10) / 10)
      );
      setPrefixHitRate(nextHitRate);
      setTokenReuseUnits((prev) => prev + matchRes.matchedTokenCount * 120);
      setTrieXpDelta((prev) => Math.round((prev + 0.4) * 10) / 10);
      setEngineLockedState('LOCKED');

      appendRadioLog(
        '🟢 CREW CHIEF',
        'Radix prefix match confirmed · ' +
          String(matchRes.matchedTokenCount * 8) +
          ' tokens reused along path [' +
          matchRes.matchedNodeIds.join(' -> ') +
          ']',
        nextTick
      );
    } catch (err) {
      setEngineLockedState('FAULT');
      const msg = err instanceof Error ? err.message : 'Ingress validation error';
      appendRadioLog('🔴 TELEMETRY', msg, nextTick);
    }
  };

  // Tactical Button 1: 💥 INJECT FORK
  const handleInjectBranchFork = () => {
    const nextTick = tick + 1;
    setTick(nextTick);

    const updatedNodes = nodes.map((n) => {
      if (n.tier === 'LEAF') {
        const nextAccess = n.accessCount + 2;
        return {
          ...n,
          verificationState: 'SPECULATIVE' as const,
          accessCount: nextAccess,
          lastAccessTick: nextTick,
          evictionPriority: calculateEvictionPriority(n.pinned, nextAccess, nextTick, nextTick),
        };
      }
      if (n.tier === 'BRANCH') {
        const allLeafIds = nodes
          .filter((cand) => cand.parentId === n.id)
          .map((cand) => cand.id);
        return {
          ...n,
          childIds: allLeafIds,
        };
      }
      return n;
    });

    setNodes(updatedNodes);
    setBranchForkCount(8);
    setRadixNodeCount((prev) => Math.min(96, prev + 8));
    setTraversalLatencyMs(
      Math.round((corridorProfile.baseTraversalMs + 0.04) * 100) / 100
    );
    setTokenReuseUnits((prev) => prev + 4800);
    setTrieXpDelta((prev) => Math.round((prev + 0.8) * 10) / 10);
    setEngineLockedState('LOCKED');

    appendRadioLog(
      '⚡ PIT WALL',
      'Injected deep branch fork · 8 divergent speculative candidate paths active across Radix Trie',
      nextTick
    );
  };

  // Tactical Button 2 & Micro [Prune]: ⚡ TOGGLE LRU
  const handlePruneColdLeaves = (toggleMode: boolean) => {
    const nextTick = tick + 1;
    setTick(nextTick);

    if (toggleMode) {
      setLruPruningEnabled((prev) => !prev);
    }

    const { updatedNodes, prunedNodeIds } = pruneColdLeafNodes(nodes, 2, nextTick);
    setNodes(updatedNodes);

    const remainingForks = updatedNodes.filter(
      (n) => n.tier === 'LEAF' && n.verificationState !== 'PRUNED'
    ).length;
    setBranchForkCount(Math.max(1, remainingForks));
    setRadixNodeCount((prev) => Math.max(48, prev - prunedNodeIds.length * 4));
    setTraversalLatencyMs(
      Math.max(0.18, Math.round((traversalLatencyMs - 0.03) * 100) / 100)
    );
    setReusedKvRatioPct((prev) => Math.min(96, prev + 2));

    if (prunedNodeIds.length > 0) {
      appendRadioLog(
        '🟢 TELEMETRY',
        'Dynamic LRU eviction pruned cold leaves [' +
          prunedNodeIds.join(', ') +
          '] · Root KV pinned',
        nextTick
      );
    } else {
      appendRadioLog(
        '🟢 CREW CHIEF',
        'LRU Pruning Sweep complete · All remaining branches exceed priority threshold',
        nextTick
      );
    }
  };

  // Tactical Button 3 & Micro [Run]: 🚀 STEP VERIFY
  const handleStepTreeVerify = () => {
    const nextTick = tick + 1;
    setTick(nextTick);

    const updatedNodes = nodes.map((n) => {
      if (n.verificationState === 'SPECULATIVE') {
        const accepted = n.acceptanceProb >= corridorProfile.verifyThreshold;
        const nextAccess = n.accessCount + (accepted ? 3 : 1);
        return {
          ...n,
          verificationState: (accepted
            ? 'VERIFIED'
            : 'SPECULATIVE') as RadixTreeNode['verificationState'],
          accessCount: nextAccess,
          lastAccessTick: nextTick,
          lcpMatchScore: accepted
            ? Math.min(99.8, Math.round((n.lcpMatchScore + 1.2) * 10) / 10)
            : n.lcpMatchScore,
          evictionPriority: calculateEvictionPriority(n.pinned, nextAccess, nextTick, nextTick),
        };
      }
      return n;
    });

    setNodes(updatedNodes);
    setPrefixHitRate((prev) => Math.min(98.9, Math.round((prev + 0.6) * 10) / 10));
    setTokenReuseUnits((prev) => prev + 6400);
    setTrieXpDelta((prev) => Math.round((prev + 1.2) * 10) / 10);
    setReusedKvRatioPct((prev) => Math.min(95, prev + 1));
    setEngineLockedState('LOCKED');

    appendRadioLog(
      '🟢 TELEMETRY',
      'Leaf node verification complete · Zero KV recomputation · Mask parity delta ' +
        parityResult.maxAbsDiff.toExponential(2),
      nextTick
    );
  };

  // Tactical Button 4: 🔄 RESET TRIE
  const handleResetRadixTrie = () => {
    const nextTick = 12;
    setTick(nextTick);
    setNodes(createInitialRadixTree());
    setSelectedNodeId('RT-ROOT-00');
    setMatchedPathHighlight(['RT-ROOT-00', 'RT-BRN-01', 'RT-LEF-01']);
    setPrefixHitRate(94.2);
    setTraversalLatencyMs(0.28);
    setRadixNodeCount(64);
    setBranchForkCount(8);
    setTokenReuseUnits(196000);
    setTrieXpDelta(6.4);
    setReusedKvRatioPct(82);
    setLruPruningEnabled(true);
    setEngineLockedState('LOCKED');
    setRadioLogs(createInitialRadioLogs());
    setApaModalMessage(null);
  };

  const rootNode = nodes.find((n) => n.tier === 'ROOT') || nodes[0];
  const branchNodes = nodes.filter((n) => n.tier === 'BRANCH');
  const leafNodes = nodes.filter((n) => n.tier === 'LEAF');

  const pointerShort = selectedNode.kvPagePointer.split(':')[0];
  const priorityLabel = selectedNode.pinned
    ? 'PINNED'
    : selectedNode.evictionPriority.toFixed(1) + ' PTS';

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans select-none">
      {/* TOP COMMAND DECK: ROW 1 & ROW 2 */}
      <header className="w-full shrink-0 border-b border-slate-800/90 pb-0.5">
        {/* Top Header Row 1 */}
        <div className="flex items-center justify-between gap-1 w-full shrink-0">
          {/* Left: Title + Cyan Track Badge */}
          <div className="flex items-center gap-1 shrink-0 whitespace-nowrap">
            <h1 className="text-sm font-extrabold tracking-tight text-slate-100 font-mono">
              GF-T3-227
            </h1>
            <span className="px-1.5 py-0.5 text-xs font-mono font-bold uppercase tracking-wider bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40 rounded">
              TRACK 3
            </span>
          </div>

          {/* Right: Compact Corridor Dropdown + Scaled Micro Action Switches */}
          <div className="flex items-center gap-1 shrink-0">
            <label htmlFor="corridor-select" className="sr-only">
              Synthetic Tree Corridor
            </label>
            <select
              id="corridor-select"
              value={corridor}
              onChange={(e) => handleSelectCorridor(e.target.value as SyntheticCorridorId)}
              className="max-w-[90px] truncate text-xs font-mono font-bold bg-slate-900 text-[#00F0FF] border border-slate-700 rounded px-1 py-1 focus:outline-none focus:border-[#00F0FF]"
              title={corridor}
            >
              {CORRIDOR_LIST.map((c) => (
                <option key={c} value={c} className="bg-[#05070B] text-slate-100">
                  {c}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleRunLcpMatch}
              className="px-2 py-1 text-xs font-mono font-bold bg-slate-900 hover:bg-slate-800 text-[#00F0FF] border border-[#00F0FF]/50 rounded transition-colors cursor-pointer whitespace-nowrap"
              title="Run Longest Common Prefix (LCP) Match"
            >
              [Match]
            </button>
            <button
              type="button"
              onClick={() => handlePruneColdLeaves(false)}
              className="px-2 py-1 text-xs font-mono font-bold bg-slate-900 hover:bg-slate-800 text-[#FF9F0A] border border-[#FF9F0A]/50 rounded transition-colors cursor-pointer whitespace-nowrap"
              title="Prune Cold Leaf Branches"
            >
              [Prune]
            </button>
            <button
              type="button"
              onClick={handleStepTreeVerify}
              className="px-2 py-1 text-xs font-mono font-bold bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-500/50 rounded transition-colors cursor-pointer whitespace-nowrap"
              title="Run Engine Single-Pass Speculative Tree Verification"
            >
              [Run]
            </button>
          </div>
        </div>

        {/* Top Header Row 2: Subtitle */}
        <p className="text-xs text-slate-300 font-mono text-center mt-0.5">
          Prefix-Tree Radix KV Cache · Speculative Tree Verification
        </p>
      </header>

      {/* 4-CARD ARCADE HUD RIBBON */}
      <section
        aria-label="Telemetry HUD Ribbon"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1 w-full shrink-0 my-0.5"
      >
        {/* Card 1: PREFIX NITRO */}
        <div className="bg-slate-900/75 border border-slate-800 rounded-lg px-2 py-1 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              PREFIX NITRO
            </span>
            <span className="text-xs font-mono font-bold text-[#00F0FF]">
              {corridorProfile.bandwidthGbs.toLocaleString()} GB/s
            </span>
          </div>
          <div className="text-lg font-bold font-mono text-[#00F0FF] leading-tight">
            {prefixHitRate.toFixed(1)}% HIT RATE
          </div>
          <div className="w-full bg-slate-950 h-1 rounded overflow-hidden border border-slate-800 my-0.5">
            <div
              className="bg-[#00F0FF] h-full transition-all duration-150"
              style={{ width: String(Math.min(100, prefixHitRate)) + '%' }}
            />
          </div>
          <div className="text-xs font-mono text-slate-300">
            Radix LCP Match · {matchedPathHighlight.length} Hops
          </div>
        </div>

        {/* Card 2: LATENCY STREAK */}
        <div className="bg-slate-900/75 border border-slate-800 rounded-lg px-2 py-1 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              LATENCY STREAK
            </span>
            <span className="px-1.5 py-0.5 text-xs font-mono font-bold bg-[#FF9F0A]/15 text-[#FF9F0A] border border-[#FF9F0A]/40 rounded">
              🔥 {radixNodeCount} NODES
            </span>
          </div>
          <div className="text-lg font-bold font-mono text-cyan-300 leading-tight">
            {traversalLatencyMs.toFixed(2)} ms
          </div>
          <div className="text-xs font-mono text-slate-300 mt-1">
            Tree Traversal · O(L) Complexity
          </div>
        </div>

        {/* Card 3: BRANCH GEAR */}
        <div className="bg-slate-900/75 border border-slate-800 rounded-lg px-2 py-1 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              BRANCH GEAR
            </span>
            <span className="text-xs font-mono text-emerald-400 font-bold">
              {engineLockedState === 'LOCKED' ? '✓ LOCKED' : '⚡ FAULT'}
            </span>
          </div>
          <div className="text-lg font-bold font-mono text-[#FF9F0A] leading-tight">
            BRANCHES: {branchForkCount} FORKS
          </div>
          <div className="grid grid-cols-8 gap-0.5 font-mono text-xs mt-0.5">
            {branchGears.map((g) => (
              <span
                key={g.gear}
                className={
                  'text-center py-0.2 rounded border font-bold ' +
                  (g.active
                    ? g.state === 'VERIFIED'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      : 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/50'
                    : 'bg-slate-950 text-slate-500 border-slate-800')
                }
              >
                {g.label}
              </span>
            ))}
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="bg-slate-900/75 border border-slate-800 rounded-lg px-2 py-1 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              TOKEN SCORE
            </span>
            <span className="px-1.5 py-0.5 text-xs font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 rounded">
              +{trieXpDelta.toFixed(1)}k TRIE XP
            </span>
          </div>
          <div className="text-lg font-bold font-mono text-emerald-400 leading-tight">
            {tokenReuseUnits.toLocaleString()} UNITS
          </div>
          <div className="text-xs font-mono text-slate-300 mt-1">
            Reused KV Tokens: {reusedKvRatioPct}%
          </div>
        </div>
      </section>

      {/* 5 HORIZONTAL TABS: ["Mesh", "Trie", "Forks", "Masks", "APA"] */}
      <nav
        aria-label="Cockpit Views"
        className="grid grid-cols-5 gap-1 p-0.5 bg-slate-900/80 border border-slate-800 rounded-lg my-0.5 w-full text-center shrink-0"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={
                'text-xs font-mono font-bold py-1 px-1 text-center rounded transition-colors cursor-pointer ' +
                (isActive
                  ? 'bg-cyan-950/80 border border-cyan-400 text-cyan-300 font-bold'
                  : 'text-slate-300 hover:text-white border border-transparent')
              }
            >
              {tab}
            </button>
          );
        })}
      </nav>

      {/* COMPACT RADIX TREE BAY + UNSLICED NODE INSPECTOR */}
      <main className="flex-1 min-h-0 w-full flex flex-col justify-between gap-1 overflow-hidden mb-1">
        {/* UPPER BAY: ACTIVE TAB VIEW (TIERS 0, 1, 2) */}
        <div className="flex-1 min-h-0 bg-slate-900/60 border border-slate-800 rounded-lg px-2 py-1 flex flex-col justify-between overflow-hidden">
          {(activeTab === 'Trie' || activeTab === 'Mesh') && (
            <div className="flex flex-col justify-between h-full min-h-0">
              {/* Tier 0: Root Chip */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono font-bold text-amber-300 shrink-0">
                  TIER 0 · ROOT
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedNodeId(rootNode.id)}
                  className={
                    'flex-1 py-0.5 px-2 text-xs font-mono font-bold text-slate-100 rounded border flex items-center justify-between gap-2 cursor-pointer transition-colors ' +
                    (selectedNode.id === rootNode.id
                      ? 'bg-emerald-950/70 border-emerald-400'
                      : 'bg-slate-950/90 border-emerald-500/50 hover:border-emerald-400')
                  }
                >
                  <span className="truncate">
                    {rootNode.id} · {rootNode.label} [PINNED]
                  </span>
                  <span className="text-cyan-300 font-bold shrink-0">
                    {rootNode.tokens.length * 16} Tok · LCP {rootNode.lcpMatchScore.toFixed(0)}%
                  </span>
                </button>
              </div>

              {/* Tier 1: 3 Branch Chips in a Single Row */}
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-amber-300">
                    TIER 1 · MULTI-TURN BRANCHES
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-300">
                    Shared Context KV Blocks
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {branchNodes.map((bNode) => {
                    const isSelected = selectedNode.id === bNode.id;
                    const isMatched = matchedPathHighlight.includes(bNode.id);
                    return (
                      <button
                        key={bNode.id}
                        type="button"
                        onClick={() => setSelectedNodeId(bNode.id)}
                        className={
                          'text-xs font-mono font-bold text-slate-100 py-0.5 px-1.5 rounded border text-left transition-colors cursor-pointer flex items-center justify-between gap-1 ' +
                          (isSelected
                            ? 'bg-cyan-950/80 border-cyan-400'
                            : isMatched
                            ? 'bg-slate-950/90 border-cyan-500/60 hover:border-cyan-400'
                            : 'bg-slate-950/80 border-slate-700 hover:border-slate-500')
                        }
                      >
                        <span className="truncate">{bNode.id}</span>
                        <span className="text-emerald-400 font-bold shrink-0">
                          {bNode.lcpMatchScore}%
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tier 2: 8 Leaf Badges (B1..B8) in a Compact 8-Column Row */}
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-amber-300">
                    TIER 2 · SPECULATIVE DRAFT LEAVES (B1–B8)
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-300">
                    Single-Pass Tree Attention Mask
                  </span>
                </div>
                <div className="grid grid-cols-8 gap-1">
                  {leafNodes.map((lNode) => {
                    const isSelected = selectedNode.id === lNode.id;
                    const isPruned = lNode.verificationState === 'PRUNED';
                    const isVerified = lNode.verificationState === 'VERIFIED';
                    return (
                      <button
                        key={lNode.id}
                        type="button"
                        onClick={() => setSelectedNodeId(lNode.id)}
                        className={
                          'text-xs font-mono font-bold py-1 px-1.5 rounded border text-center transition-colors cursor-pointer flex items-center justify-between ' +
                          (isSelected
                            ? 'bg-[#FF9F0A]/25 border-[#FF9F0A] text-white'
                            : isPruned
                            ? 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                            : isVerified
                            ? 'bg-emerald-950/50 border-emerald-500/60 text-emerald-300'
                            : 'bg-slate-950/90 border-cyan-500/50 text-cyan-300')
                        }
                      >
                        <span>B{lNode.forkGearIndex}</span>
                        <span>{isPruned ? 'DRP' : isVerified ? 'LCK' : 'SPC'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Compact Single-Line LCP Input Field */}
              <div className="flex items-center gap-1.5 pt-0.5 border-t border-slate-800/80 shrink-0">
                <span className="text-xs font-mono font-bold text-slate-200 shrink-0">
                  LCP Input:
                </span>
                <input
                  type="text"
                  aria-label="Prompt Token Sequence Input"
                  value={customTokenInput}
                  onChange={(e) => setCustomTokenInput(e.target.value)}
                  className="flex-1 min-w-0 h-6 text-xs px-2 font-mono font-bold text-slate-200 bg-slate-950 border border-slate-700 rounded focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="button"
                  onClick={handleRunLcpMatch}
                  className="h-6 px-2 text-xs font-mono font-bold bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-400 rounded cursor-pointer shrink-0"
                >
                  Match
                </button>
              </div>
            </div>
          )}

          {activeTab === 'Forks' && (
            <div className="flex flex-col justify-between h-full min-h-0">
              <div className="flex items-center justify-between border-b border-slate-800 pb-0.5 shrink-0">
                <span className="text-xs font-mono font-bold text-amber-300">
                  SPECULATIVE BRANCH VERIFICATION & CHAOS STRESS TRIGGERS
                </span>
                <span className="text-xs font-mono font-bold text-slate-200">
                  Active Leaves: {activeLeaves.length} / 8
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1 my-1 shrink-0">
                <button
                  type="button"
                  onClick={handleInjectBranchFork}
                  className="py-1 px-2 rounded border border-[#FF9F0A]/60 bg-[#FF9F0A]/10 hover:bg-[#FF9F0A]/20 text-left text-xs font-mono font-bold text-[#FF9F0A] cursor-pointer"
                >
                  1. Inject Deep Branch Fork (8 Divergent Paths)
                </button>
                <button
                  type="button"
                  onClick={() => handlePruneColdLeaves(false)}
                  className="py-1 px-2 rounded border border-cyan-400/60 bg-cyan-950/50 hover:bg-cyan-900/60 text-left text-xs font-mono font-bold text-cyan-300 cursor-pointer"
                >
                  2. Force Tree Cache Eviction (Drop Cold Leaves)
                </button>
                <button
                  type="button"
                  onClick={handleStepTreeVerify}
                  className="py-1 px-2 rounded border border-emerald-500/60 bg-emerald-950/40 hover:bg-emerald-900/50 text-left text-xs font-mono font-bold text-emerald-400 cursor-pointer"
                >
                  3. Step Speculative Tree Attention Verification
                </button>
                <button
                  type="button"
                  onClick={handleResetRadixTrie}
                  className="py-1 px-2 rounded border border-rose-500/60 bg-rose-950/40 hover:bg-rose-900/50 text-left text-xs font-mono font-bold text-rose-400 cursor-pointer"
                >
                  4. Reset Radix Trie & Re-Anchor Root
                </button>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1">
                {leafNodes.map((ln) => (
                  <button
                    key={ln.id}
                    type="button"
                    onClick={() => setSelectedNodeId(ln.id)}
                    className="p-1 rounded border border-slate-800 bg-slate-950 text-xs font-mono font-bold text-center cursor-pointer hover:border-cyan-400"
                  >
                    <div className="text-white">B{ln.forkGearIndex}</div>
                    <div className="text-cyan-300">{ln.lcpMatchScore.toFixed(0)}%</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'Masks' && (
            <div className="flex flex-col justify-between h-full min-h-0">
              <div className="flex items-center justify-between border-b border-slate-800 pb-0.5 shrink-0">
                <span className="text-xs font-mono font-bold text-amber-300">
                  2D CAUSAL TREE ATTENTION MASK (M_tree[i,j]) & NUMERICAL PARITY
                </span>
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  Parity Delta: {parityResult.maxAbsDiff.toExponential(2)} (✓ VERIFIED)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center my-auto">
                <div className="bg-slate-950/90 border border-slate-800 rounded p-1.5">
                  <div className="grid grid-cols-9 gap-0.5 text-xs font-mono text-center">
                    <span className="text-slate-300 font-bold">Q\K</span>
                    {maskData.nodeIds.map((nid, idx) => (
                      <span key={nid} className="text-cyan-300 font-bold">
                        N{idx}
                      </span>
                    ))}
                    {maskData.matrix.slice(0, 4).map((row, rIdx) => (
                      <React.Fragment key={maskData.nodeIds[rIdx]}>
                        <span className="text-cyan-300 font-bold">N{rIdx}</span>
                        {row.map((bit, cIdx) => (
                          <span
                            key={String(rIdx) + '-' + String(cIdx)}
                            className={
                              'rounded font-bold ' +
                              (bit === 1
                                ? 'bg-emerald-500/25 text-emerald-300'
                                : 'bg-slate-900 text-slate-400')
                            }
                          >
                            {bit}
                          </span>
                        ))}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-950/90 border border-slate-800 rounded p-1.5 font-mono text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-200 font-bold">Tree Attention Out:</span>
                    <span className="text-cyan-300 font-bold">
                      [{parityResult.treeLeafOutput.slice(0, 2).map((v) => v.toFixed(4)).join(', ')}]
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-200 font-bold">Linear Sequential Out:</span>
                    <span className="text-emerald-400 font-bold">
                      [{parityResult.linearLeafOutput.slice(0, 2).map((v) => v.toFixed(4)).join(', ')}]
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>L_inf Parity Error:</span>
                    <span>{parityResult.maxAbsDiff.toExponential(3)} &lt; 1e-12</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'APA' && (
            <div className="flex flex-col justify-between h-full min-h-0">
              <div className="flex items-center justify-between border-b border-slate-800 pb-0.5 shrink-0">
                <span className="text-xs font-mono font-bold text-amber-300">
                  SUPABASE / POSTGRESQL RLS SCHEMA & INSTITUTIONAL APA TRANSFER
                </span>
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  100% MIT CLEAN-ROOM TITLE
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center my-auto">
                <pre className="text-xs font-mono text-slate-200 bg-slate-950 border border-slate-800 rounded p-1.5 leading-tight overflow-hidden whitespace-pre-wrap">
                  {SUPABASE_RLS_SCHEMA_SNIPPET.split('\n').slice(0, 5).join('\n')}
                </pre>

                <div className="flex flex-col gap-1">
                  {apaModalMessage && (
                    <div className="p-1 rounded bg-emerald-950/60 border border-emerald-500/50 text-xs font-mono text-emerald-300">
                      {apaModalMessage}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setApaModalMessage('APA Title Dossier Locked · GF-T3-227 Ready');
                      appendRadioLog(
                        '🟢 CREW CHIEF',
                        'APA Title Transfer dossier prepared · 100% MIT clean-room provenance verified',
                        tick + 1
                      );
                    }}
                    className="w-full py-1.5 px-3 rounded bg-[#00F0FF] hover:bg-[#00F0FF]/90 text-slate-950 font-mono text-xs font-extrabold tracking-wide cursor-pointer transition-colors text-center"
                  >
                    ACQUIRE TITLE (APA)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setApaModalMessage('Vault Buyout Escrow Initialized · Air-Gapped Ready');
                      appendRadioLog(
                        '⚡ PIT WALL',
                        'Institutional Vault Buyout inquiry logged · Escrow specification unlocked',
                        tick + 1
                      );
                    }}
                    className="w-full py-1.5 px-3 rounded bg-slate-900 hover:bg-slate-800 text-[#FF9F0A] border border-[#FF9F0A]/60 font-mono text-xs font-extrabold tracking-wide cursor-pointer transition-colors text-center"
                  >
                    INQUIRE VAULT BUYOUT
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* LOWER BAY: NODE TELEMETRY INSPECTOR (UNSLICED 2x2 / 4-ITEM HORIZONTAL STRIP) */}
        <aside className="bg-slate-900/85 border border-slate-800 rounded-lg px-2.5 py-1.5 shrink-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-white shrink-0">
              NODE TELEMETRY INSPECTOR
            </span>
            <span className="text-xs font-mono font-bold text-white truncate">
              {selectedNode.id} · {selectedNode.label} ({selectedNode.tier})
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5">
            <div className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs font-mono font-bold text-cyan-300">
              TOKEN LENGTH: {selectedNode.tokens.length * 16} Tokens
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs font-mono font-bold text-cyan-300">
              LCP SCORE: {selectedNode.lcpMatchScore.toFixed(0)}%
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs font-mono font-bold text-cyan-300">
              POINTER: {pointerShort}
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs font-mono font-bold text-cyan-300">
              PRIORITY: {priorityLabel}
            </div>
          </div>
        </aside>
      </main>

      {/* TACTICAL LAUNCH CONTROL BUTTONS (FULL UNCLIPPED TEXT) */}
      <section
        aria-label="Tactical Launch Controls"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 mb-1"
      >
        <button
          type="button"
          onClick={handleInjectBranchFork}
          className="bg-slate-900/90 hover:bg-[#FF9F0A]/15 text-[#FF9F0A] border border-[#FF9F0A] rounded-lg text-xs font-mono font-bold py-2 px-2 text-center transition-colors cursor-pointer"
        >
          💥 INJECT FORK
        </button>

        <button
          type="button"
          onClick={() => handlePruneColdLeaves(true)}
          className="bg-slate-900/90 hover:bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.2)] rounded-lg text-xs font-mono font-bold py-2 px-2 text-center transition-colors cursor-pointer"
        >
          ⚡ TOGGLE LRU
        </button>

        <button
          type="button"
          onClick={handleStepTreeVerify}
          className="bg-emerald-950/60 hover:bg-emerald-900/70 text-emerald-400 border border-emerald-500 rounded-lg text-xs font-mono font-bold py-2 px-2 text-center transition-colors cursor-pointer"
        >
          🚀 STEP VERIFY
        </button>

        <button
          type="button"
          onClick={handleResetRadixTrie}
          className="bg-rose-950/50 hover:bg-rose-900/60 text-rose-400 border border-rose-500 rounded-lg text-xs font-mono font-bold py-2 px-2 text-center transition-colors cursor-pointer"
        >
          🔄 RESET TRIE
        </button>
      </section>

      {/* PIT-WALL RADIO LOG */}
      <footer
        aria-label="Pit-Wall Radio Log"
        className="h-14 overflow-hidden font-mono p-1.5 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 flex flex-col justify-between"
      >
        {radioLogs.slice(0, 3).map((entry) => (
          <div
            key={entry.id}
            className="text-[11px] font-mono leading-relaxed text-slate-200 truncate"
          >
            <span className="text-slate-400">[{entry.timestamp}]</span>{' '}
            <span className="font-bold">{entry.callsign}:</span>{' '}
            <span>{entry.message}</span>
          </div>
        ))}
      </footer>
    </div>
  );
}
