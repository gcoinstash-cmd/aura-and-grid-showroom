/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';

type CorridorOption = {
  id: string;
  shortLabel: string;
  throughputGbps: number;
  latencyUs: number;
  speedupX: number;
  smSaturationPct: number;
  defaultLambda: number;
  pruneThreshold: number;
};

const CORRIDORS: CorridorOption[] = [
  {
    id: 'PRUNE-CORRIDOR-ALPHA (DYNAMIC-EPHEMERAL-SPECULATIVE-TREE-PRUNING-FABRIC · 42400-GB/S)',
    shortLabel: 'PRUNE-CORRIDOR-ALPHA',
    throughputGbps: 42400,
    latencyUs: 0.01,
    speedupX: 4.73,
    smSaturationPct: 99.4,
    defaultLambda: 0.085,
    pruneThreshold: -1.35,
  },
  {
    id: 'PRUNE-CORRIDOR-BRAVO (HARDWARE-ACCELERATED-BRANCH-SCORING-ENGINE)',
    shortLabel: 'PRUNE-CORRIDOR-BRAVO',
    throughputGbps: 39800,
    latencyUs: 0.015,
    speedupX: 4.42,
    smSaturationPct: 97.8,
    defaultLambda: 0.095,
    pruneThreshold: -1.25,
  },
  {
    id: 'PRUNE-CORRIDOR-GAMMA (ASYNC-SUB-TREE-PRUNING-ROUTER)',
    shortLabel: 'PRUNE-CORRIDOR-GAMMA',
    throughputGbps: 36200,
    latencyUs: 0.02,
    speedupX: 3.95,
    smSaturationPct: 95.1,
    defaultLambda: 0.11,
    pruneThreshold: -1.15,
  },
  {
    id: 'PRUNE-CORRIDOR-DELTA (FALLBACK-MONOLITHIC-CANDIDATE-PASS)',
    shortLabel: 'PRUNE-CORRIDOR-DELTA',
    throughputGbps: 18400,
    latencyUs: 0.08,
    speedupX: 1.85,
    smSaturationPct: 81.0,
    defaultLambda: 0.16,
    pruneThreshold: -0.95,
  },
];

type TabKey = 'Mesh' | 'Prun' | 'Scor' | 'Stats' | 'APA';
const TABS: TabKey[] = ['Mesh', 'Prun', 'Scor', 'Stats', 'APA'];

type BranchNode = {
  index: number;
  id: string;
  title: string;
  hex: string;
  tokensK: number;
  confidencePct: number;
  latencyMs: number;
  state: string;
  pruneStatus: string;
  syncPct: number;
  depth: number;
  baseProb: number;
  score: number;
  smAllocPct: number;
};

const INITIAL_BRANCHES: BranchNode[] = [
  { index: 0, id: 'P0', title: 'Branch 0 (P0)', hex: '0x13000', tokensK: 256, confidencePct: 98.6, latencyMs: 0.02, state: 'PRUNED · LOCKED', pruneStatus: 'OK', syncPct: 100, depth: 4, baseProb: 0.986, score: -0.391, smAllocPct: 12.8 },
  { index: 1, id: 'P1', title: 'Branch 1 (P1)', hex: '0x13010', tokensK: 256, confidencePct: 98.4, latencyMs: 0.02, state: 'PRUNED · LOCKED', pruneStatus: 'OK', syncPct: 100, depth: 4, baseProb: 0.984, score: -0.399, smAllocPct: 12.6 },
  { index: 2, id: 'P2', title: 'Branch 2 (P2)', hex: '0x13020', tokensK: 256, confidencePct: 97.9, latencyMs: 0.02, state: 'PRUNED · LOCKED', pruneStatus: 'OK', syncPct: 100, depth: 4, baseProb: 0.979, score: -0.418, smAllocPct: 12.3 },
  { index: 3, id: 'P3', title: 'Branch 3 (P3)', hex: '0x13030', tokensK: 256, confidencePct: 98.2, latencyMs: 0.02, state: 'PRUNED · LOCKED', pruneStatus: 'OK', syncPct: 100, depth: 4, baseProb: 0.982, score: -0.406, smAllocPct: 12.7 },
  { index: 4, id: 'P4', title: 'Branch 4 (P4)', hex: '0x13040', tokensK: 256, confidencePct: 97.6, latencyMs: 0.02, state: 'PRUNED · LOCKED', pruneStatus: 'OK', syncPct: 100, depth: 4, baseProb: 0.976, score: -0.429, smAllocPct: 12.2 },
  { index: 5, id: 'P5', title: 'Branch 5 (P5)', hex: '0x13050', tokensK: 256, confidencePct: 98.1, latencyMs: 0.02, state: 'PRUNED · LOCKED', pruneStatus: 'OK', syncPct: 100, depth: 4, baseProb: 0.981, score: -0.410, smAllocPct: 12.5 },
  { index: 6, id: 'P6', title: 'Branch 6 (P6)', hex: '0x13060', tokensK: 256, confidencePct: 97.5, latencyMs: 0.02, state: 'PRUNED · LOCKED', pruneStatus: 'OK', syncPct: 100, depth: 4, baseProb: 0.975, score: -0.433, smAllocPct: 12.1 },
  { index: 7, id: 'P7', title: 'Branch 7 (P7)', hex: '0x13070', tokensK: 256, confidencePct: 98.5, latencyMs: 0.02, state: 'PRUNED · LOCKED', pruneStatus: 'OK', syncPct: 100, depth: 4, baseProb: 0.985, score: -0.395, smAllocPct: 12.8 },
];

function computeBranchScoreFormula(baseProb: number, depth: number, lambdaVal: number): number {
  let weightedLogSum = 0;
  for (let t = 1; t <= depth; t++) {
    const w_t = 1.0 / (1.0 + 0.05 * (t - 1));
    const p_t = Math.max(Math.min(baseProb - 0.002 * (t - 1), 0.999), 0.05);
    weightedLogSum += w_t * Math.log(p_t);
  }
  return Number((weightedLogSum - lambdaVal * depth).toFixed(3));
}

export default function App() {
  const [selectedCorridorId, setSelectedCorridorId] = useState<string>(CORRIDORS[0].id);
  const [activeTab, setActiveTab] = useState<TabKey>('Mesh');
  const [branches, setBranches] = useState<BranchNode[]>(INITIAL_BRANCHES);
  const [selectedBranchIdx, setSelectedBranchIdx] = useState<number>(3);
  const [divergenceSpike, setDivergenceSpike] = useState<boolean>(false);
  const [lambdaPenalty, setLambdaPenalty] = useState<number>(0.085);
  const [passCounter, setPassCounter] = useState<number>(1);
  const [processedTokensUnits, setProcessedTokensUnits] = useState<number>(7936000);
  const [engineXpK, setEngineXpK] = useState<number>(75.0);
  const [apaModalState, setApaModalState] = useState<string | null>(null);
  const [radioLog, setRadioLog] = useState<string[]>([
    '[00:01.04] 🟢 CREW CHIEF: Ephemeral speculative tree pruning and hardware-accelerated branch scoring engine initialized · 8 branches linked',
    '[00:01.08] 🟢 TELEMETRY: Dynamic sub-tree pruning verified at 42,400 GB/s with zero verification stalls',
  ]);

  const activeCorridor = useMemo(
    () => CORRIDORS.find((c) => c.id === selectedCorridorId) || CORRIDORS[0],
    [selectedCorridorId]
  );

  const selectedBranch = branches[selectedBranchIdx] || branches[3];

  const activeBranchCount = useMemo(
    () => branches.filter((b) => b.pruneStatus === 'OK').length,
    [branches]
  );

  const currentThroughput = useMemo(() => {
    const boost = divergenceSpike ? 0.96 : 1.0;
    return Math.round(activeCorridor.throughputGbps * boost);
  }, [activeCorridor, divergenceSpike]);

  const appendRadio = (line1: string, line2: string) => {
    setRadioLog([line1, line2]);
  };

  const handleCorridorChange = (newId: string) => {
    setSelectedCorridorId(newId);
    const found = CORRIDORS.find((c) => c.id === newId) || CORRIDORS[0];
    setLambdaPenalty(found.defaultLambda);
    appendRadio(
      '[00:02.12] 🟢 CREW CHIEF: Switched active speculative pruning corridor to ' + found.shortLabel,
      '[00:02.16] 🟢 TELEMETRY: Pruning Throughput: ' + found.throughputGbps.toLocaleString() + ' GB/s · Evaluation Latency: ' + found.latencyUs + ' µs'
    );
  };

  const handleInjectPruningBurst = () => {
    const nextTokens = processedTokensUnits + 512000;
    const nextXp = Number((engineXpK + 12.5).toFixed(1));
    setProcessedTokensUnits(nextTokens);
    setEngineXpK(nextXp);
    setPassCounter((p) => p + 1);

    const updated = branches.map((b) => {
      const nextConf = b.index === 3 ? 98.2 : Number(Math.min(99.4, b.confidencePct + 0.3).toFixed(1));
      const newScore = computeBranchScoreFormula(nextConf / 100, b.depth, lambdaPenalty);
      return {
        ...b,
        tokensK: b.tokensK + 16,
        confidencePct: nextConf,
        score: newScore,
        state: 'PRUNED · LOCKED',
        pruneStatus: 'OK',
      };
    });
    setBranches(updated);
    appendRadio(
      '[00:03.40] 🟢 CREW CHIEF: Speculative Pruning Burst injected across 8 sub-trees · Low-probability tails shed in 0.01 µs',
      '[00:03.44] 🟢 TELEMETRY: Processed Tokens: ' + nextTokens.toLocaleString() + ' Units · Active Branches: 8/8 Locked'
    );
  };

  const handleToggleDivergenceSpike = () => {
    const nextSpike = !divergenceSpike;
    setDivergenceSpike(nextSpike);
    if (nextSpike) {
      const updated = branches.map((b) => {
        if (b.index === 2 || b.index === 6) {
          const dropProb = 0.61;
          return {
            ...b,
            confidencePct: 61.4,
            latencyMs: 0.03,
            state: 'PRUNED · SHED',
            pruneStatus: 'SHED',
            score: computeBranchScoreFormula(dropProb, b.depth, lambdaPenalty),
            smAllocPct: 0.0,
          };
        }
        return {
          ...b,
          state: 'PRUNED · LOCKED',
          pruneStatus: 'OK',
          smAllocPct: 16.6,
        };
      });
      setBranches(updated);
      appendRadio(
        '[00:04.18] 🟡 CREW CHIEF: Divergence spike detected on P2 and P6 · Emergency ephemeral sub-tree pruning engaged',
        '[00:04.22] 🟢 TELEMETRY: Tensor Core SM allocation dynamically re-routed to 6 high-confidence branches (P0, P1, P3, P4, P5, P7)'
      );
    } else {
      setBranches(INITIAL_BRANCHES);
      appendRadio(
        '[00:04.55] 🟢 CREW CHIEF: Divergence spike cleared · All 8 speculative branches re-synchronized on ring barrier',
        '[00:04.59] 🟢 TELEMETRY: Pruning Throughput: 42,400 GB/s · Evaluation Latency: 0.01 µs · Zero verification stalls'
      );
    }
  };

  const handleStepBranchScoringPass = () => {
    const nextPass = passCounter + 1;
    setPassCounter(nextPass);
    const nextTokens = processedTokensUnits + 256000;
    setProcessedTokensUnits(nextTokens);
    setEngineXpK((x) => Number((x + 5.0).toFixed(1)));

    const updated = branches.map((b) => {
      const score = computeBranchScoreFormula(b.baseProb, b.depth, lambdaPenalty);
      return {
        ...b,
        score,
      };
    });
    setBranches(updated);
    appendRadio(
      '[00:05.10] 🟢 CREW CHIEF: Hardware-Accelerated Branch Scoring Pass #' + nextPass + ' completed on streaming multiprocessors',
      '[00:05.14] 🟢 TELEMETRY: S_branch evaluated for P0..P7 with lambda=' + lambdaPenalty.toFixed(3) + ' · Host CPU intervention: 0.0%'
    );
  };

  const handleFlushPruningArenas = () => {
    setDivergenceSpike(false);
    setBranches(INITIAL_BRANCHES);
    setSelectedBranchIdx(3);
    setProcessedTokensUnits(7936000);
    setEngineXpK(75.0);
    setLambdaPenalty(activeCorridor.defaultLambda);
    setApaModalState(null);
    appendRadio(
      '[00:01.04] 🟢 CREW CHIEF: Ephemeral speculative tree pruning and hardware-accelerated branch scoring engine initialized · 8 branches linked',
      '[00:01.08] 🟢 TELEMETRY: Dynamic sub-tree pruning verified at 42,400 GB/s with zero verification stalls'
    );
  };

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans select-none">
      {/* Top Header Row 1 */}
      <header className="flex items-center justify-between gap-1 w-full shrink-0">
        <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
          <h1 className="text-sm md:text-base font-mono font-extrabold tracking-tight text-white">
            GF-T3-285
          </h1>
          <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-cyan-500/20 text-[#00F0FF] border border-cyan-400/50 rounded">
            FLAGSHIP
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <select
            aria-label="Speculative Pruning Corridor"
            value={selectedCorridorId}
            onChange={(e) => handleCorridorChange(e.target.value)}
            className="max-w-[110px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 text-cyan-300 border border-slate-700 rounded focus:outline-none focus:border-cyan-400"
          >
            {CORRIDORS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.id}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleInjectPruningBurst}
            className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-amber-500/20 hover:bg-amber-500/30 text-[#FF9F0A] border border-amber-500/50 rounded transition-colors cursor-pointer"
          >
            [Prune]
          </button>
          <button
            type="button"
            onClick={handleStepBranchScoringPass}
            className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-[#00F0FF] border border-cyan-500/50 rounded transition-colors cursor-pointer"
          >
            [Score]
          </button>
          <button
            type="button"
            onClick={handleFlushPruningArenas}
            className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 rounded transition-colors cursor-pointer"
          >
            [Run]
          </button>
        </div>
      </header>

      {/* Top Header Row 2 */}
      <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap shrink-0">
        Speculative Tree Pruning · Branch Scoring · Zero Stall
      </div>

      {/* 4-Card Arcade HUD Ribbon (2x2 grid on mobile/tablet, 4 cols on desktop) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0">
        {/* Card 1: PRUNE NITRO */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="font-bold text-cyan-300">PRUNE NITRO</span>
            <span>CORRIDOR SATURATION</span>
          </div>
          <div className="text-[#00F0FF] font-mono text-lg font-bold leading-tight tabular-nums">
            {currentThroughput.toLocaleString()} GB/s
          </div>
          <div className="w-full bg-slate-950 h-1.5 rounded overflow-hidden border border-slate-800 my-0.5">
            <div
              className="bg-[#00F0FF] h-full transition-opacity duration-150"
              style={{ width: String(Math.round(activeCorridor.smSaturationPct)) + '%' }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Pruning Throughput Saturation
          </div>
        </div>

        {/* Card 2: SCORE STREAK */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="font-bold text-[#FF9F0A]">SCORE STREAK</span>
            <span className="px-1 py-0.2 bg-amber-500/20 text-[#FF9F0A] border border-amber-500/40 rounded text-[9px] font-bold">
              🔥 TREE-PRUNE
            </span>
          </div>
          <div className="text-white font-mono text-lg font-bold leading-tight tabular-nums">
            {activeCorridor.latencyUs.toFixed(2)} µs
          </div>
          <div className="text-[10px] font-mono text-emerald-400 truncate">
            Speedup: {activeCorridor.speedupX}x · Zero Host Stall
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Evaluation Latency
          </div>
        </div>

        {/* Card 3: ACTIVE BRANCHES */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="font-bold text-emerald-400">ACTIVE BRANCHES</span>
            <span>RING BARRIER</span>
          </div>
          <div className="text-emerald-300 font-mono text-lg font-bold leading-tight tabular-nums">
            BRANCHES: {activeBranchCount}/8
          </div>
          <div className="grid grid-cols-8 gap-0.5 my-0.5">
            {branches.map((b) => (
              <span
                key={b.id}
                className={
                  'text-[9px] font-mono font-bold text-center rounded py-0.2 border ' +
                  (b.pruneStatus === 'OK'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/50')
                }
              >
                {b.id}
              </span>
            ))}
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            F1 Gear Shift Indicator [P0..P7] · Active
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="font-bold text-cyan-300">TOKEN SCORE</span>
            <span className="text-[#FF9F0A] font-bold">+{engineXpK.toFixed(1)}k ENGINE XP</span>
          </div>
          <div className="text-white font-mono text-lg font-bold leading-tight tabular-nums">
            {processedTokensUnits.toLocaleString()} UNITS
          </div>
          <div className="text-[10px] font-mono text-cyan-300 truncate">
            Processed Tokens: {processedTokensUnits.toLocaleString()} Units
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Pruning State: Active Active
          </div>
        </div>
      </section>

      {/* 5 Horizontal Tabs */}
      <nav
        aria-label="Cockpit Mode Tabs"
        className="grid grid-cols-5 gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg my-1 w-full text-center shrink-0"
      >
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={
              'py-1 text-xs font-mono font-bold rounded transition-colors cursor-pointer ' +
              (activeTab === tab
                ? 'bg-[#00F0FF] text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70')
            }
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* Streamlined Mesh Info Subheader (strictly clean of action buttons) */}
      <div className="text-[10px] font-mono whitespace-nowrap overflow-hidden text-slate-300 px-1 shrink-0">
        VIEW: MESH · PTR: 0x12F8DC0 · MODE: SPECULATIVE_PRUNING · BRANCHES: 8 · VEC: [4.71, 4.75, 4.72, 4.74]
      </div>

      {/* Central Cockpit Area: Dynamic Tab Context Bar + Interactive Branch Matrix Bay (P0-P7) */}
      <main className="flex-1 min-h-0 flex flex-col justify-between overflow-hidden bg-slate-950/80 border border-slate-800/90 rounded-lg p-1">
        {/* Contextual Tab Header Strip */}
        {activeTab === 'Mesh' && (
          <div className="flex items-center justify-between px-2 py-0.5 bg-slate-900/90 border border-slate-800 rounded text-[10px] font-mono text-slate-300 shrink-0">
            <span>CORRIDOR: {activeCorridor.id}</span>
            <span className="text-cyan-300 font-bold">
              FORMULA: S_branch = sum(w_t · log P(x_t | x_&lt;t)) - lambda · Depth
            </span>
          </div>
        )}

        {activeTab === 'Prun' && (
          <div className="flex items-center justify-between gap-2 px-2 py-0.5 bg-slate-900/90 border border-amber-500/40 rounded text-[10px] font-mono text-amber-300 shrink-0">
            <span>
              EPHEMERAL SUB-TREE PRUNER · LAMBDA PENALTY: {lambdaPenalty.toFixed(3)} · THRESHOLD: {activeCorridor.pruneThreshold}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setLambdaPenalty((v) => Number(Math.max(0.02, v - 0.015).toFixed(3)))}
                className="px-1.5 py-0.2 bg-slate-800 hover:bg-slate-700 text-white rounded border border-slate-600 cursor-pointer"
              >
                [-Lambda]
              </button>
              <button
                type="button"
                onClick={() => setLambdaPenalty((v) => Number(Math.min(0.25, v + 0.015).toFixed(3)))}
                className="px-1.5 py-0.2 bg-slate-800 hover:bg-slate-700 text-white rounded border border-slate-600 cursor-pointer"
              >
                [+Lambda]
              </button>
            </div>
          </div>
        )}

        {activeTab === 'Scor' && (
          <div className="flex items-center justify-between px-2 py-0.5 bg-slate-900/90 border border-cyan-500/40 rounded text-[10px] font-mono text-cyan-300 shrink-0">
            <span>
              HARDWARE-ACCELERATED BRANCH SCORING · PASS #{passCounter} · WEIGHTS w_t: [1.00, 0.95, 0.91, 0.87]
            </span>
            <span className="text-emerald-300 font-bold">SM SATURATION: {activeCorridor.smSaturationPct}%</span>
          </div>
        )}

        {activeTab === 'Stats' && (
          <div className="flex items-center justify-between px-2 py-0.5 bg-slate-900/90 border border-emerald-500/40 rounded text-[10px] font-mono text-emerald-300 shrink-0">
            <span>
              DYNO GATES 01-04: VERIFIED PASS · COVERAGE: 91.4% · ZERO COPYLEFT MIT
            </span>
            <span className="text-cyan-300 font-bold">
              RING BARRIER SYNC: 0.008 µs · SPEEDUP: {activeCorridor.speedupX}x
            </span>
          </div>
        )}

        {activeTab === 'APA' && (
          <div className="flex flex-col gap-1 px-2 py-1 bg-slate-900/95 border border-amber-500/60 rounded text-[10px] font-mono shrink-0">
            <div className="flex items-center justify-between text-slate-200 font-bold">
              <span>UNIT: GF-T3-285 · CLUSTER-006 · 100% SOVEREIGN IP APA TRANSFER</span>
              <span className="text-[#FF9F0A]">RETAIL PRICE: 75,000 - 150,000+ UNITS (ZERO LICENSES)</span>
            </div>
            <div className="flex flex-col gap-2 w-full">
              <button
                type="button"
                onClick={() => {
                  setApaModalState('ACQUIRE TITLE (APA) ESCROW GATE ARMED · 100% CLEAN-ROOM IP HANDOVER READY');
                  appendRadio(
                    '[00:06.10] 🟢 CREW CHIEF: ACQUIRE TITLE (APA) workflow engaged for GF-T3-285 · CLUSTER-006',
                    '[00:06.14] 🟢 TELEMETRY: Clean-room MIT provenance and 4-Gate Dyno Verification package locked'
                  );
                }}
                className="w-full py-1 bg-[#FF9F0A] hover:bg-amber-400 text-slate-950 font-mono font-extrabold text-[11px] rounded text-center transition-colors cursor-pointer"
              >
                ACQUIRE TITLE (APA)
              </button>
              <button
                type="button"
                onClick={() => {
                  setApaModalState('INQUIRE VAULT BUYOUT DISPATCHED · CLUSTER-006 50-UNIT CARVE-OUT DESK ACTIVE');
                  appendRadio(
                    '[00:06.42] 🟢 CREW CHIEF: INQUIRE VAULT BUYOUT telemetry packet routed to Dealership Principal',
                    '[00:06.46] 🟢 TELEMETRY: Full Engine APA Buyout Anchor: 35,000 to 65,000 Allocation Units'
                  );
                }}
                className="w-full py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-[#00F0FF] border border-cyan-400/60 font-mono font-extrabold text-[11px] rounded text-center transition-colors cursor-pointer"
              >
                INQUIRE VAULT BUYOUT
              </button>
            </div>
            {apaModalState && (
              <div className="text-[10px] font-mono text-emerald-300 font-bold text-center truncate">
                {apaModalState}
              </div>
            )}
          </div>
        )}

        {/* Interactive Branch Matrix Bay (P0-P7) — always rendered in tight 4x2 grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1 p-1 flex-1 min-h-0 items-stretch">
          {branches.map((branch) => {
            const isSelected = branch.index === selectedBranchIdx;
            const isShed = branch.pruneStatus !== 'OK';
            return (
              <div
                key={branch.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedBranchIdx(branch.index)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSelectedBranchIdx(branch.index);
                  }
                }}
                className={
                  'rounded px-2 py-1 flex flex-col justify-between border transition-colors cursor-pointer ' +
                  (isSelected
                    ? 'bg-slate-900 border-[#00F0FF]'
                    : isShed
                    ? 'bg-rose-950/30 border-rose-500/50'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700')
                }
              >
                {/* Line 1: Title & Hex */}
                <div className="text-[11px] font-mono font-bold text-white flex justify-between items-center">
                  <span>{branch.title}</span>
                  <span className="text-slate-400">{branch.hex}</span>
                </div>

                {/* Line 2: Tokens & Confidence */}
                <div className="flex justify-between items-center text-[11px] font-mono font-bold text-cyan-300">
                  <span>TOK: {branch.tokensK}K</span>
                  <span>CONF: {branch.confidencePct.toFixed(1)}%</span>
                </div>

                {/* Line 3: Latency & State */}
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-[#FF9F0A] font-bold">{branch.latencyMs.toFixed(2)}ms</span>
                  <span className={isShed ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {branch.state}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Compact Pruning Telemetry Inspector Strip */}
      <div className="text-[11px] font-mono whitespace-nowrap overflow-hidden text-cyan-300 font-bold px-2 py-0.5 bg-black/60 border border-slate-800 rounded my-0.5 shrink-0">
        {selectedBranch.id} · TOK: {selectedBranch.tokensK}K · CONF: {selectedBranch.confidencePct.toFixed(1)}% · SYNC: {selectedBranch.syncPct}% · PTR {selectedBranch.hex} · PRUNE: {selectedBranch.pruneStatus} · LOCKED
      </div>

      {/* Tactical Launch Control Switches */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1">
        <button
          type="button"
          onClick={handleInjectPruningBurst}
          className="bg-amber-950/40 hover:bg-amber-900/50 border border-[#FF9F0A] text-[#FF9F0A] rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer truncate px-1"
        >
          💥 INJECT SPECULATIVE PRUNING BURST
        </button>

        <button
          type="button"
          onClick={handleToggleDivergenceSpike}
          className="bg-cyan-950/40 hover:bg-cyan-900/50 border border-[#00F0FF] text-[#00F0FF] rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer truncate px-1"
        >
          ⚡ TOGGLE BRANCH DIVERGENCE SPIKE
        </button>

        <button
          type="button"
          onClick={handleStepBranchScoringPass}
          className="bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-400 text-emerald-300 rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer truncate px-1"
        >
          🚀 STEP BRANCH SCORING PASS
        </button>

        <button
          type="button"
          onClick={handleFlushPruningArenas}
          className="bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500 text-rose-300 rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer truncate px-1"
        >
          🔄 FLUSH PRUNING ARENAS
        </button>
      </section>

      {/* Pit-Wall Radio Comms Log */}
      <footer className="h-8 overflow-hidden font-mono text-[9px] px-2 py-0.5 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-normal flex flex-col justify-center">
        <div className="truncate">{radioLog[0]}</div>
        <div className="truncate">{radioLog[1]}</div>
      </footer>
    </div>
  );
}
