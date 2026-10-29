/**
 * @license
 * SPDX-License-Identifier: MIT
 * GF-T3-228: Speculative Tree Decoding & Multi-Candidate Verification Cockpit
 * Strictly Zero-Dollar Gate Compliant & Clean-Room Sovereign Architecture
 */

import React, { useMemo, useState } from 'react';
import {
  GridSyncIngressSchema,
  NodeStatus,
  runSpeculativeTreeCycle,
  SpecCorridor,
  SpecTreeNode,
} from './engine/specTreeEngine';

type CockpitTab = 'Mesh' | 'Tree' | 'Mask' | 'Stats' | 'APA';

const CORRIDOR_LIST: SpecCorridor[] = [
  SpecCorridor.ALPHA,
  SpecCorridor.BRAVO,
  SpecCorridor.GAMMA,
  SpecCorridor.DELTA,
];

const TAB_LIST: CockpitTab[] = ['Mesh', 'Tree', 'Mask', 'Stats', 'APA'];

export default function App() {
  const [corridor, setCorridor] = useState<SpecCorridor>(SpecCorridor.ALPHA);
  const [activeTab, setActiveTab] = useState<CockpitTab>('Tree');
  const [rootToken, setRootToken] = useState<string>('def');
  const [pruningEnabled, setPruningEnabled] = useState<boolean>(true);
  const [pruningThreshold, setPruningThreshold] = useState<number>(0.72);
  const [temperature, setTemperature] = useState<number>(0.8);
  const [lowConfidenceDivergence, setLowConfidenceDivergence] = useState<boolean>(false);
  const [burstMode, setBurstMode] = useState<boolean>(false);
  const [stepSeed, setStepSeed] = useState<number>(228);
  const [verificationPhase, setVerificationPhase] = useState<'DRAFT_STAGED' | 'VERIFIED'>('VERIFIED');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('P1');

  const [radioLogs, setRadioLogs] = useState<string[]>([
    '[00:01.04] 🟢 CREW CHIEF: Non-autoregressive draft expansion active · 8 candidates staged',
    '[00:01.08] ⚡ PIT WALL: Unified tree-attention verification complete · 7/8 tokens accepted',
    '[00:01.12] 🟢 TELEMETRY: Speculative speedup verified at 2.85x · Zero fallback penalties',
  ]);

  const appendRadioLog = (callsign: string, message: string) => {
    const tick = ((stepSeed % 89) + 10) / 100;
    const formattedTick = '[00:0' + String((1 + tick).toFixed(2)) + '] ';
    const line = formattedTick + callsign + ': ' + message;
    setRadioLogs((prev) => [line, prev[0], prev[1]].slice(0, 3));
  };

  const engineResult = useMemo(() => {
    const parsed = GridSyncIngressSchema.safeParse({
      rootToken,
      corridor,
      pruningEnabled,
      pruningThreshold,
      temperature,
      lowConfidenceDivergence,
      burstMode,
      stepSeed,
      verificationPhase,
    });

    if (!parsed.success) {
      return runSpeculativeTreeCycle({
        rootToken: 'def',
        corridor: SpecCorridor.ALPHA,
        pruningEnabled: true,
        pruningThreshold: 0.72,
        temperature: 0.8,
        lowConfidenceDivergence: false,
        burstMode: false,
        stepSeed: 228,
        verificationPhase: 'VERIFIED',
      });
    }

    return runSpeculativeTreeCycle(parsed.data);
  }, [
    rootToken,
    corridor,
    pruningEnabled,
    pruningThreshold,
    temperature,
    lowConfidenceDivergence,
    burstMode,
    stepSeed,
    verificationPhase,
  ]);

  const selectedNode: SpecTreeNode = useMemo(() => {
    const found = engineResult.allNodes.find((n) => n.nodeId === selectedNodeId);
    return found ?? engineResult.level2Leaves[0];
  }, [engineResult, selectedNodeId]);

  // Top Header Row 1 Micro Action Handlers
  const handleStageDraft = () => {
    setVerificationPhase('DRAFT_STAGED');
    setStepSeed((prev) => prev + 1);
    appendRadioLog('🟢 CREW CHIEF', 'Draft expansion active · 8 candidates staged on ' + rootToken);
  };

  const handleVerifyTree = () => {
    setVerificationPhase('VERIFIED');
    appendRadioLog(
      '⚡ PIT WALL',
      'Unified tree-attention verification complete · ' +
        String(engineResult.acceptedCount) +
        '/8 tokens accepted'
    );
  };

  const handleRunEngine = () => {
    setVerificationPhase('VERIFIED');
    setLowConfidenceDivergence(false);
    setBurstMode(false);
    setStepSeed((prev) => prev + 2);
    appendRadioLog(
      '🟢 TELEMETRY',
      'Speculative speedup verified at ' +
        String(engineResult.speculativeSpeedup.toFixed(2)) +
        'x · Zero fallback penalties'
    );
  };

  // 4 Launch Control Handlers
  const handleInjectDraftBurst = () => {
    const nextBurst = !burstMode;
    setBurstMode(nextBurst);
    setLowConfidenceDivergence(false);
    setVerificationPhase('VERIFIED');
    appendRadioLog(
      '🟢 CREW CHIEF',
      nextBurst
        ? '8-Path Speculative Burst engaged · +8.2k XP surge'
        : '8-Path Speculative Burst normalized to baseline cadence'
    );
  };

  const handleTogglePruning = () => {
    const nextPruning = !pruningEnabled;
    setPruningEnabled(nextPruning);
    setLowConfidenceDivergence(!nextPruning ? true : false);
    appendRadioLog(
      '⚡ PIT WALL',
      'Branch pruning gate ' +
        (nextPruning ? 'LOCKED at ' + String(pruningThreshold.toFixed(2)) : 'FORCE PRUNE DIVERGENCE ACTIVE')
    );
  };

  const handleStepTreeVerify = () => {
    setVerificationPhase('VERIFIED');
    setStepSeed((prev) => prev + 1);
    appendRadioLog('⚡ PIT WALL', 'Parallel verification step complete · Causal mask delta 0.0000');
  };

  const handleResetDraftTrie = () => {
    setCorridor(SpecCorridor.ALPHA);
    setRootToken('def');
    setPruningEnabled(true);
    setPruningThreshold(0.72);
    setTemperature(0.8);
    setLowConfidenceDivergence(false);
    setBurstMode(false);
    setStepSeed(228);
    setVerificationPhase('VERIFIED');
    setSelectedNodeId('P1');
    setRadioLogs([
      '[00:01.04] 🟢 CREW CHIEF: Non-autoregressive draft expansion active · 8 candidates staged',
      '[00:01.08] ⚡ PIT WALL: Unified tree-attention verification complete · 7/8 tokens accepted',
      '[00:01.12] 🟢 TELEMETRY: Speculative speedup verified at 2.85x · Zero fallback penalties',
    ]);
  };

  const getNodeStyle = (status: NodeStatus, isSelected: boolean) => {
    const ring = isSelected ? ' ring-1 ring-[#00F0FF]' : '';
    if (status === NodeStatus.VERIFIED_ACCEPTED) {
      return (
        'bg-emerald-950/70 border-emerald-400 text-emerald-200 shadow-[0_0_8px_rgba(16,185,129,0.25)]' +
        ring
      );
    }
    if (status === NodeStatus.PRUNED_REJECTED) {
      return (
        'bg-rose-950/60 border-amber-500/90 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.2)]' +
        ring
      );
    }
    return (
      'bg-cyan-950/70 border-[#00F0FF] text-cyan-200 shadow-[0_0_8px_rgba(0,240,255,0.25)]' + ring
    );
  };

  const getTier1StatusIcon = (status: NodeStatus) => {
    if (status === NodeStatus.VERIFIED_ACCEPTED) {
      return '✓';
    }
    if (status === NodeStatus.PRUNED_REJECTED) {
      return '⚡';
    }
    return '•';
  };

  const getTier2StatusLabel = (status: NodeStatus) => {
    if (status === NodeStatus.VERIFIED_ACCEPTED) {
      return '✓ LCK';
    }
    if (status === NodeStatus.PRUNED_REJECTED) {
      return '⚡ FLT';
    }
    return 'ACTV';
  };

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans select-none">
      {/* TOP HEADER BLOCK */}
      <header className="w-full shrink-0 flex flex-col gap-0.5 border-b border-slate-800/90 pb-1">
        {/* Top Header Row 1 */}
        <div className="flex items-center justify-between gap-1 w-full shrink-0">
          {/* Left */}
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <h1 className="text-sm md:text-base font-mono font-bold tracking-tight text-white">
              GF-T3-228
            </h1>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/50 rounded">
              TRACK 3
            </span>
          </div>

          {/* Right */}
          <div className="flex items-center gap-1 shrink-0">
            <select
              aria-label="Speculative Corridor Selector"
              value={corridor}
              onChange={(e) => {
                const nextCorridor = e.target.value as SpecCorridor;
                setCorridor(nextCorridor);
                appendRadioLog('🟢 CREW CHIEF', 'Corridor locked: ' + nextCorridor.slice(0, 20));
              }}
              className="max-w-[100px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 text-cyan-300 border border-slate-700 rounded focus:outline-none focus:border-[#00F0FF]"
            >
              {CORRIDOR_LIST.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleStageDraft}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-[#00F0FF] border border-[#00F0FF]/50 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              [Draft]
            </button>
            <button
              type="button"
              onClick={handleVerifyTree}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/50 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              [Verify]
            </button>
            <button
              type="button"
              onClick={handleRunEngine}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-400/60 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              [Run]
            </button>
          </div>
        </div>

        {/* Top Header Row 2 */}
        <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap overflow-hidden">
          Dynamic Speculative Tree Decoding · Multi-Candidate Verify
        </div>
      </header>

      {/* 4-CARD ARCADE HUD RIBBON */}
      <section
        aria-label="Telemetry HUD Ribbon"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-0.5"
      >
        {/* Card 1: SPEEDUP */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              SPEEDUP
            </span>
            <span className="text-[10px] font-mono text-cyan-400 font-bold">1-PASS</span>
          </div>
          <div className="text-lg font-bold text-cyan-300 font-mono leading-tight my-0.5">
            {String(engineResult.speculativeSpeedup.toFixed(2))}x GAIN
          </div>
          <div className="w-full bg-slate-900 h-1 rounded overflow-hidden border border-slate-800 mb-0.5">
            <div
              className="bg-[#00F0FF] h-full"
              style={{
                width: String(Math.min(100, Math.round((engineResult.speculativeSpeedup / 3.2) * 100))) + '%',
              }}
            />
          </div>
          <div className="text-xs text-slate-300 font-mono">
            Effective: 248.4 tok/s
          </div>
        </div>

        {/* Card 2: ACCEPTANCE */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              ACCEPTANCE
            </span>
            <span className="px-1.5 py-0.2 bg-amber-950/80 border border-[#FF9F0A]/60 rounded text-[10px] font-mono font-bold text-[#FF9F0A]">
              🔥 8 PATHS
            </span>
          </div>
          <div className="text-lg font-bold text-emerald-400 font-mono leading-tight my-0.5">
            {String(engineResult.acceptanceRatePct.toFixed(1))}% ACC
          </div>
          <div className="text-xs text-slate-300 font-mono">
            Latency: {String(engineResult.verificationOverheadMs.toFixed(2))} ms
          </div>
        </div>

        {/* Card 3: BRANCH SLOTS */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              BRANCH SLOTS
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">GEAR HUD</span>
          </div>
          <div className="text-lg font-bold text-white font-mono leading-tight my-0.5">
            SLOTS: {String(engineResult.acceptedCount)}/8
          </div>
          <div className="grid grid-cols-8 gap-0.5">
            {engineResult.level2Leaves.map((leaf) => {
              const accepted = leaf.status === NodeStatus.VERIFIED_ACCEPTED;
              const active = leaf.status === NodeStatus.ACTIVE_DRAFT;
              return (
                <button
                  key={leaf.nodeId}
                  type="button"
                  onClick={() => setSelectedNodeId(leaf.nodeId)}
                  className={
                    'text-[10px] font-mono font-bold py-0.2 rounded border text-center cursor-pointer ' +
                    (accepted
                      ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300'
                      : active
                      ? 'bg-cyan-950/90 border-[#00F0FF] text-cyan-200'
                      : 'bg-rose-950/70 border-amber-500/80 text-amber-300 line-through')
                  }
                >
                  {leaf.nodeId}
                </button>
              );
            })}
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              TOKEN SCORE
            </span>
            <span className="px-1.5 py-0.2 bg-cyan-950/80 border border-[#00F0FF]/50 rounded text-[10px] font-mono font-bold text-[#00F0FF]">
              +8.2k XP
            </span>
          </div>
          <div className="text-lg font-bold text-amber-300 font-mono leading-tight my-0.5">
            {engineResult.verifiedTokensUnits.toLocaleString()} UNITS
          </div>
          <div className="text-xs text-slate-300 font-mono">
            Efficiency: {String(engineResult.speculativeEfficiencyPct)}% · Zero Delta
          </div>
        </div>
      </section>

      {/* 5 HORIZONTAL TABS */}
      <nav
        aria-label="Cockpit Workspace Modes"
        className="grid grid-cols-5 gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg my-0.5 w-full text-center shrink-0"
      >
        {TAB_LIST.map((tab) => {
          const isCurrent = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={
                'py-0.5 text-xs font-mono font-bold rounded transition-colors cursor-pointer ' +
                (isCurrent
                  ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/60'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60')
              }
            >
              {tab}
            </button>
          );
        })}
      </nav>

      {/* INTERACTIVE 12-NODE SPECULATIVE CANDIDATE TREE BAY */}
      <main className="flex-1 min-h-0 w-full bg-slate-950/90 border border-slate-800 rounded-lg px-2 py-1.5 flex flex-col justify-between overflow-hidden">
        {/* Tree Bay Header */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-1 shrink-0">
          <span className="text-xs font-mono font-bold text-white whitespace-nowrap">
            SPECULATIVE TRIE: 12 Nodes · VERIFIED: {String(engineResult.acceptedCount)}/8
          </span>
          <span className="text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-1.5 py-0.5 rounded shrink-0">
            RLS Locked
          </span>
        </div>

        {/* FULL 12-NODE CANDIDATE TREE VISUALIZER */}
        <div className="flex-1 min-h-0 flex flex-col justify-around py-1 overflow-hidden">
          {/* Tier 0: ROOT-0 chip centered */}
          <div className="flex items-center justify-center w-full shrink-0">
            <button
              type="button"
              onClick={() => setSelectedNodeId(engineResult.rootNode.nodeId)}
              className={
                'text-xs font-mono font-bold py-1 px-3 rounded border flex items-center gap-2 cursor-pointer ' +
                getNodeStyle(
                  engineResult.rootNode.status,
                  selectedNode.nodeId === engineResult.rootNode.nodeId
                )
              }
            >
              <span className="text-cyan-300">ROOT-0</span>
              <span className="text-white">"{engineResult.rootNode.tokenText}"</span>
              <span className="text-emerald-300">
                {String((engineResult.rootNode.targetProbability * 100).toFixed(1))}%
              </span>
              <span className="text-[10px] text-emerald-400">✓ LOCKED</span>
            </button>
          </div>

          {/* Tier 1: 3 Draft Nodes (L1-1, L1-2, L1-3) in an even 3-column row */}
          <div className="grid grid-cols-3 gap-2 w-full shrink-0">
            {engineResult.level1Nodes.map((l1) => {
              const pct = String(Math.round(l1.draftConfidence * 100)) + '%';
              const icon = getTier1StatusIcon(l1.status);
              return (
                <button
                  key={l1.nodeId}
                  type="button"
                  onClick={() => setSelectedNodeId(l1.nodeId)}
                  className={
                    'text-xs font-mono font-bold py-1 px-1 text-center rounded border cursor-pointer ' +
                    getNodeStyle(l1.status, selectedNode.nodeId === l1.nodeId)
                  }
                >
                  {l1.tokenText + ' ' + pct + ' ' + icon}
                </button>
              );
            })}
          </div>

          {/* Tier 2: 8 Candidate Leaves (P1..P8) in an 8-column compact grid */}
          <div className="grid grid-cols-8 gap-1 w-full shrink-0">
            {engineResult.level2Leaves.map((leaf) => {
              const rejected = leaf.status === NodeStatus.PRUNED_REJECTED;
              const pct = String(Math.round(leaf.draftConfidence * 100)) + '%';
              return (
                <button
                  key={leaf.nodeId}
                  type="button"
                  onClick={() => setSelectedNodeId(leaf.nodeId)}
                  className={
                    'text-[11px] font-mono font-bold py-1 px-1 text-center rounded border flex flex-col items-center justify-between cursor-pointer ' +
                    getNodeStyle(leaf.status, selectedNode.nodeId === leaf.nodeId)
                  }
                >
                  <div className="text-[10px] font-mono font-bold text-white leading-tight">
                    {leaf.nodeId + ' ' + pct}
                  </div>
                  <div
                    className={
                      'text-[10px] font-mono leading-tight my-0.5 ' +
                      (rejected ? 'line-through text-amber-300' : 'text-cyan-300')
                    }
                  >
                    {leaf.tokenText}
                  </div>
                  <div className="text-[9px] font-mono font-bold leading-tight">
                    {getTier2StatusLabel(leaf.status)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* COMPACT NODE TELEMETRY INSPECTOR STRIP */}
        <div
          aria-label="Node Telemetry Inspector Strip"
          className="pt-1 border-t border-slate-800/90 flex items-center justify-between gap-1 text-[10px] sm:text-xs font-mono font-bold text-cyan-300 whitespace-nowrap overflow-hidden shrink-0"
        >
          <span>TARGET PROB: {String(selectedNode.targetProbability.toFixed(3))}</span>
          <span className="text-slate-600">·</span>
          <span>DRAFT CONF: {String(selectedNode.draftConfidence.toFixed(3))}</span>
          <span className="text-slate-600">·</span>
          <span>TREE MASK: {selectedNode.treeMaskBits}</span>
          <span className="text-slate-600">·</span>
          <span
            className={
              selectedNode.status === NodeStatus.VERIFIED_ACCEPTED
                ? 'text-emerald-400'
                : selectedNode.status === NodeStatus.PRUNED_REJECTED
                ? 'text-amber-400'
                : 'text-cyan-300'
            }
          >
            STATUS: {selectedNode.status}
          </span>
        </div>
      </main>

      {/* TACTICAL LAUNCH CONTROL BUTTONS */}
      <section
        aria-label="Tactical Launch Controls"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1"
      >
        <button
          type="button"
          onClick={handleInjectDraftBurst}
          className="bg-amber-950/40 hover:bg-amber-900/50 border border-[#FF9F0A] text-[#FF9F0A] rounded-lg text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer"
        >
          💥 INJECT DRAFT BURST
        </button>
        <button
          type="button"
          onClick={handleTogglePruning}
          className="bg-cyan-950/40 hover:bg-cyan-900/50 border border-[#00F0FF] text-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.2)] rounded-lg text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer"
        >
          ⚡ TOGGLE PRUNING
        </button>
        <button
          type="button"
          onClick={handleStepTreeVerify}
          className="bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500 text-emerald-300 rounded-lg text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer"
        >
          🚀 STEP TREE VERIFY
        </button>
        <button
          type="button"
          onClick={handleResetDraftTrie}
          className="bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500 text-rose-300 rounded-lg text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer"
        >
          🔄 RESET DRAFT TRIE
        </button>
      </section>

      {/* PIT-WALL RADIO LOG */}
      <footer
        aria-label="Pit-Wall Radio Log"
        className="h-14 overflow-hidden font-mono text-[10px] p-2 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-tight flex flex-col justify-between"
      >
        {radioLogs.map((logLine, idx) => (
          <div key={String(idx) + '-' + logLine} className="text-[10px] font-mono truncate">
            {logLine}
          </div>
        ))}
      </footer>
    </div>
  );
}
