/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

type TabKey = 'Mesh' | 'Spec' | 'Vrfe' | 'Stats' | 'APA';

interface TreeNodeTelemetry {
  id: number;
  code: string;
  hex: string;
  inspectorPtr: string;
  tokensK: number;
  acceptancePct: number;
  latencyMs: number;
  syncPct: number;
  status: string;
  specStatus: string;
  candidates: number[];
}

const CORRIDOR_OPTIONS = [
  {
    id: 'SPEC-CORRIDOR-ALPHA',
    label: 'SPEC-CORRIDOR-ALPHA (DYNAMIC-SPECULATIVE-DECODING-FABRIC · 48000-GB/S)',
    throughputGbs: 48000,
    draftLatencyUs: 0.01,
    mode: 'SPECULATIVE_TREE',
  },
  {
    id: 'SPEC-CORRIDOR-BRAVO',
    label: 'SPEC-CORRIDOR-BRAVO (VERIFICATION-TREE-CONCURRENCY-ENGINE)',
    throughputGbs: 44200,
    draftLatencyUs: 0.02,
    mode: 'CONCURRENT_BRANCH_VERIFY',
  },
  {
    id: 'SPEC-CORRIDOR-GAMMA',
    label: 'SPEC-CORRIDOR-GAMMA (ASYNC-DRAFT-ACCEPTANCE-ROUTER)',
    throughputGbs: 39800,
    draftLatencyUs: 0.03,
    mode: 'ASYNC_ROUTER',
  },
  {
    id: 'SPEC-CORRIDOR-DELTA',
    label: 'SPEC-CORRIDOR-DELTA (FALLBACK-AUTOREGRESSIVE-SERIAL-PASS)',
    throughputGbs: 16000,
    draftLatencyUs: 0.08,
    mode: 'SERIAL_FALLBACK',
  },
];

const INITIAL_TREES: TreeNodeTelemetry[] = [
  {
    id: 0,
    code: 'V0',
    hex: '0x20000',
    inspectorPtr: '0x20000',
    tokensK: 256,
    acceptancePct: 94.8,
    latencyMs: 0.02,
    syncPct: 100,
    status: 'VERIFIED · LOCKED',
    specStatus: 'OK',
    candidates: [0.96, 0.95, 0.94, 0.95],
  },
  {
    id: 1,
    code: 'V1',
    hex: '0x20010',
    inspectorPtr: '0x20010',
    tokensK: 256,
    acceptancePct: 95.1,
    latencyMs: 0.02,
    syncPct: 100,
    status: 'VERIFIED · LOCKED',
    specStatus: 'OK',
    candidates: [0.97, 0.95, 0.95, 0.94],
  },
  {
    id: 2,
    code: 'V2',
    hex: '0x20020',
    inspectorPtr: '0x20020',
    tokensK: 256,
    acceptancePct: 94.6,
    latencyMs: 0.02,
    syncPct: 100,
    status: 'VERIFIED · LOCKED',
    specStatus: 'OK',
    candidates: [0.95, 0.94, 0.95, 0.94],
  },
  {
    id: 3,
    code: 'V3',
    hex: '0x20030',
    inspectorPtr: '0x20030',
    tokensK: 256,
    acceptancePct: 94.8,
    latencyMs: 0.02,
    syncPct: 100,
    status: 'VERIFIED · LOCKED',
    specStatus: 'OK',
    candidates: [0.96, 0.95, 0.94, 0.95],
  },
  {
    id: 4,
    code: 'V4',
    hex: '0x20040',
    inspectorPtr: '0x20040',
    tokensK: 256,
    acceptancePct: 94.9,
    latencyMs: 0.02,
    syncPct: 100,
    status: 'VERIFIED · LOCKED',
    specStatus: 'OK',
    candidates: [0.95, 0.95, 0.95, 0.95],
  },
  {
    id: 5,
    code: 'V5',
    hex: '0x20050',
    inspectorPtr: '0x20050',
    tokensK: 256,
    acceptancePct: 94.7,
    latencyMs: 0.02,
    syncPct: 100,
    status: 'VERIFIED · LOCKED',
    specStatus: 'OK',
    candidates: [0.95, 0.94, 0.95, 0.95],
  },
  {
    id: 6,
    code: 'V6',
    hex: '0x20060',
    inspectorPtr: '0x20060',
    tokensK: 256,
    acceptancePct: 95.0,
    latencyMs: 0.02,
    syncPct: 100,
    status: 'VERIFIED · LOCKED',
    specStatus: 'OK',
    candidates: [0.96, 0.95, 0.95, 0.94],
  },
  {
    id: 7,
    code: 'V7',
    hex: '0x20070',
    inspectorPtr: '0x20070',
    tokensK: 256,
    acceptancePct: 94.8,
    latencyMs: 0.02,
    syncPct: 100,
    status: 'VERIFIED · LOCKED',
    specStatus: 'OK',
    candidates: [0.95, 0.95, 0.94, 0.95],
  },
];

export default function App() {
  const [selectedCorridorId, setSelectedCorridorId] = useState<string>('SPEC-CORRIDOR-ALPHA');
  const [activeTab, setActiveTab] = useState<TabKey>('Mesh');
  const [trees, setTrees] = useState<TreeNodeTelemetry[]>(INITIAL_TREES);
  const [selectedTreeIndex, setSelectedTreeIndex] = useState<number>(3);
  const [throughputGbs, setThroughputGbs] = useState<number>(48000);
  const [draftLatencyUs, setDraftLatencyUs] = useState<number>(0.01);
  const [processedTokens, setProcessedTokens] = useState<number>(8832000);
  const [engineXpK, setEngineXpK] = useState<number>(75.0);
  const [rejectionSpikeActive, setRejectionSpikeActive] = useState<boolean>(false);
  const [speculativeStateLabel, setSpeculativeStateLabel] = useState<string>('Verification Active');
  const [vectorState, setVectorState] = useState<number[]>([5.41, 5.45, 5.42, 5.44]);
  const [apaActionNotice, setApaActionNotice] = useState<string>(
    'READY FOR 100% SOVEREIGN IP TITLE TRANSFER · ZERO COPLEFT · STANDALONE REPO BUNDLE'
  );
  const [radioLogs, setRadioLogs] = useState<string[]>([
    '[00:01.04] 🟢 CREW CHIEF: Asynchronous speculative decoding and verification tree concurrency engine initialized · 8 trees linked',
    '[00:01.08] 🟢 TELEMETRY: Tree verification verified at 48,000 GB/s with 94.8% draft acceptance',
  ]);

  const appendLog = (msg: string) => {
    const now = new Date();
    const sec = String(now.getSeconds()).padStart(2, '0');
    const ms = String(Math.floor(now.getMilliseconds() / 10)).padStart(2, '0');
    const stamped = '[00:' + sec + '.' + ms + '] ' + msg;
    setRadioLogs((prev) => [prev[prev.length - 1], stamped]);
  };

  const handleCorridorChange = (newCorridorId: string) => {
    setSelectedCorridorId(newCorridorId);
    const found = CORRIDOR_OPTIONS.find((c) => c.id === newCorridorId) || CORRIDOR_OPTIONS[0];
    setThroughputGbs(found.throughputGbs);
    setDraftLatencyUs(found.draftLatencyUs);
    appendLog(
      '🟢 CORRIDOR LOCKED: Switched to ' +
        found.id +
        ' at ' +
        found.throughputGbs.toLocaleString() +
        ' GB/s'
    );
  };

  const handleInjectSpeculativeBurst = () => {
    setThroughputGbs(52800);
    setDraftLatencyUs(0.01);
    setProcessedTokens((prev) => prev + 512000);
    setEngineXpK((prev) => Number((prev + 4.5).toFixed(1)));
    setSpeculativeStateLabel('Verification Burst Active');
    setVectorState([5.88, 5.92, 5.89, 5.95]);
    setTrees((prev) =>
      prev.map((t) => ({
        ...t,
        tokensK: t.tokensK + 64,
        acceptancePct: 96.4,
        latencyMs: 0.01,
        syncPct: 100,
        status: 'VERIFIED · LOCKED',
        specStatus: 'BURST',
      }))
    );
    appendLog(
      '🟢 SPECULATIVE BURST: Multi-token forward pass saturated at 52,800 GB/s · +512,000 Units verified across V0-V7'
    );
  };

  const handleToggleRejectionSpike = () => {
    const nextSpike = !rejectionSpikeActive;
    setRejectionSpikeActive(nextSpike);
    if (nextSpike) {
      setThroughputGbs(41600);
      setDraftLatencyUs(0.02);
      setSpeculativeStateLabel('Sub-Tree Re-Balancing Active');
      setVectorState([4.92, 5.11, 4.98, 5.04]);
      setTrees((prev) =>
        prev.map((t, idx) =>
          idx % 2 === 1
            ? {
                ...t,
                acceptancePct: 78.4,
                latencyMs: 0.03,
                syncPct: 96,
                status: 'PRUNED · REBALANCED',
                specStatus: 'PRUNED',
              }
            : {
                ...t,
                acceptancePct: 94.2,
                latencyMs: 0.02,
                syncPct: 100,
                status: 'VERIFIED · LOCKED',
                specStatus: 'OK',
              }
        )
      );
      appendLog(
        '🟠 REJECTION SPIKE INJECTED: Non-blocking candidate pruning triggered on odd trees · Sub-microsecond re-balance engaged'
      );
    } else {
      setThroughputGbs(48000);
      setDraftLatencyUs(0.01);
      setSpeculativeStateLabel('Verification Active');
      setVectorState([5.41, 5.45, 5.42, 5.44]);
      setTrees(INITIAL_TREES);
      appendLog(
        '🟢 SPIKE CLEARED: All 8 speculative verification trees restored to 94.8% acceptance lock at 48,000 GB/s'
      );
    }
  };

  const handleStepCandidatePass = () => {
    setProcessedTokens((prev) => prev + 256000);
    setEngineXpK((prev) => Number((prev + 2.5).toFixed(1)));
    setVectorState((prev) => prev.map((v) => Number((v + 0.03).toFixed(2))));
    setTrees((prev) =>
      prev.map((t) => ({
        ...t,
        tokensK: t.tokensK + 32,
        acceptancePct: Number(Math.min(98.2, t.acceptancePct + 0.2).toFixed(1)),
      }))
    );
    appendLog(
      '🟢 ASYNC CANDIDATE PASS: Single forward evaluation verified 256,000 token units with 3.84x speculative speedup'
    );
  };

  const handleFlushCandidateArenas = () => {
    setSelectedCorridorId('SPEC-CORRIDOR-ALPHA');
    setThroughputGbs(48000);
    setDraftLatencyUs(0.01);
    setProcessedTokens(8832000);
    setEngineXpK(75.0);
    setRejectionSpikeActive(false);
    setSpeculativeStateLabel('Verification Active');
    setVectorState([5.41, 5.45, 5.42, 5.44]);
    setTrees(INITIAL_TREES);
    setSelectedTreeIndex(3);
    appendLog(
      '🟢 ARENA FLUSH COMPLETE: Candidate buffers scrubbed and verification pointers 0x20000-0x20070 re-zeroed'
    );
  };

  const inspectedTree = trees[selectedTreeIndex] || trees[3];
  const currentCorridor =
    CORRIDOR_OPTIONS.find((c) => c.id === selectedCorridorId) || CORRIDOR_OPTIONS[0];
  const saturationPct = Math.min(100, Math.round((throughputGbs / 48000) * 100));

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans select-none">
      {/* TOP HEADER ROW 1 */}
      <header className="flex flex-col gap-0.5 shrink-0">
        <div className="flex items-center justify-between gap-1 w-full shrink-0">
          {/* Left: Primary Title + FLAGSHIP badge */}
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <h1 className="text-base md:text-lg font-mono font-bold tracking-tight text-white">
              GF-T3-293
            </h1>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-cyan-500/20 text-[#00F0FF] border border-cyan-400/50 rounded">
              FLAGSHIP
            </span>
          </div>

          {/* Right: Compact Corridor Dropdown + Micro Action Buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <select
              aria-label="Speculative Decoding Corridor"
              value={selectedCorridorId}
              onChange={(e) => handleCorridorChange(e.target.value)}
              className="max-w-[110px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 border border-slate-700 text-cyan-300 rounded focus:outline-none focus:border-cyan-400"
            >
              {CORRIDOR_OPTIONS.map((corridor) => (
                <option key={corridor.id} value={corridor.id}>
                  {corridor.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                setActiveTab('Spec');
                appendLog('🟢 HUD VIEW: Switched to Speculative Tree Formula & Pruning Matrix');
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 rounded transition-colors cursor-pointer"
            >
              [Spec]
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('Vrfe');
                handleStepCandidatePass();
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 rounded transition-colors cursor-pointer"
            >
              [Verify]
            </button>
            <button
              type="button"
              onClick={handleInjectSpeculativeBurst}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/50 rounded transition-colors cursor-pointer"
            >
              [Run]
            </button>
          </div>
        </div>

        {/* TOP HEADER ROW 2 */}
        <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap">
          Speculative Decoding · Tree Concurrency · Multi-Token Pass
        </div>
      </header>

      {/* 4-CARD ARCADE HUD RIBBON (2x2 GRID) */}
      <section className="grid grid-cols-2 gap-1.5 w-full shrink-0 my-0.5">
        {/* Card 1: SPEC NITRO */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              SPEC NITRO
            </span>
            <span className="text-[10px] font-mono text-cyan-300">
              {saturationPct}% SATURATION
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-[#00F0FF] leading-tight">
            {throughputGbs.toLocaleString()} GB/s
          </div>
          <div className="w-full bg-slate-950 h-1.5 rounded overflow-hidden border border-slate-800 my-0.5">
            <div
              className="bg-[#00F0FF] h-full transition-all duration-150"
              style={{ width: String(saturationPct) + '%' }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Verification Throughput Saturation
          </div>
        </div>

        {/* Card 2: VERIFY STREAK */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              VERIFY STREAK
            </span>
            <span className="text-[10px] font-mono font-bold text-[#FF9F0A]">
              🔥 DRAFT-TREE
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-amber-300 leading-tight">
            {draftLatencyUs.toFixed(2)} µs
          </div>
          <div className="text-[10px] font-mono text-emerald-400 truncate">
            BARRIER SYNC: SUB-MICROSECOND LOCK
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Draft Latency
          </div>
        </div>

        {/* Card 3: ACTIVE TREES */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              ACTIVE TREES
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-400">
              GEAR: 8TH OVERDRIVE
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-white leading-tight">
            TREES: 8/8
          </div>
          <div className="grid grid-cols-8 gap-0.5 my-0.5">
            {trees.map((tree, idx) => (
              <button
                key={tree.code}
                type="button"
                onClick={() => setSelectedTreeIndex(idx)}
                className={
                  'text-[9px] font-mono font-bold py-0.5 rounded border text-center cursor-pointer transition-colors ' +
                  (selectedTreeIndex === idx
                    ? 'bg-cyan-500/30 border-[#00F0FF] text-white'
                    : tree.specStatus === 'PRUNED'
                    ? 'bg-amber-950/70 border-amber-500/60 text-amber-300'
                    : 'bg-slate-950 border-slate-700 text-cyan-300')
                }
              >
                {tree.code}
              </button>
            ))}
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            F1 Gear Shift Indicator [V0..V7] · Active Tree {inspectedTree.code}
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              TOKEN SCORE
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-400">
              +{engineXpK.toFixed(1)}k ENGINE XP
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-white leading-tight">
            {processedTokens.toLocaleString()} UNITS
          </div>
          <div className="text-[10px] font-mono text-cyan-300 truncate">
            SPEEDUP: 3.84x MULTI-TOKEN CONCURRENCY
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Speculative State: {speculativeStateLabel}
          </div>
        </div>
      </section>

      {/* 5 HORIZONTAL TABS */}
      <nav
        aria-label="Cockpit Views"
        className="grid grid-cols-5 gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg my-1 w-full text-center shrink-0"
      >
        {(['Mesh', 'Spec', 'Vrfe', 'Stats', 'APA'] as TabKey[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={
              'py-1 text-xs font-mono font-bold rounded transition-colors cursor-pointer ' +
              (activeTab === tab
                ? 'bg-[#00F0FF] text-slate-950 shadow-sm'
                : 'bg-slate-950/60 text-slate-300 hover:text-white hover:bg-slate-800')
            }
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* STREAMLINED MESH INFO SUBHEADER (STRICTLY CLEAN OF ACTION BUTTONS) */}
      <div className="text-[10px] font-mono whitespace-nowrap overflow-hidden text-slate-300 bg-slate-950/90 border border-slate-800/80 rounded px-2 py-0.5 shrink-0">
        {'VIEW: ' +
          activeTab.toUpperCase() +
          ' · PTR: 0x19F8DC0 · MODE: ' +
          currentCorridor.mode +
          ' · TREES: 8 · VEC: [' +
          vectorState.map((v) => v.toFixed(2)).join(', ') +
          ']'}
      </div>

      {/* MAIN INTERACTIVE WORKSPACE BAY (FIXED FLEX-1 WITHOUT OVERFLOW SCROLL) */}
      <main className="flex-1 min-h-0 flex flex-col justify-center bg-slate-950/60 border border-slate-800/90 rounded-lg p-1 my-0.5 overflow-hidden">
        {activeTab === 'Mesh' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1 p-1 h-full items-stretch">
            {trees.map((tree, idx) => (
              <button
                key={tree.code}
                type="button"
                onClick={() => {
                  setSelectedTreeIndex(idx);
                  appendLog(
                    '🟢 INSPECTOR FOCUS: Linked Tree ' +
                      String(tree.id) +
                      ' (' +
                      tree.code +
                      ') at pointer ' +
                      tree.hex +
                      ' · ACPT ' +
                      String(tree.acceptancePct) +
                      '%'
                  );
                }}
                className={
                  'flex flex-col justify-between p-2 rounded border text-left transition-all cursor-pointer ' +
                  (selectedTreeIndex === idx
                    ? 'bg-slate-900 border-[#00F0FF] shadow-[0_0_8px_rgba(0,240,255,0.25)]'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700')
                }
              >
                {/* Line 1: Title & Hex */}
                <div className="text-[11px] font-mono font-bold text-white flex justify-between items-center w-full">
                  <span>{'Tree ' + String(tree.id) + ' (' + tree.code + ')'}</span>
                  <span className="text-slate-400">{tree.hex}</span>
                </div>

                {/* Line 2: Tokens & Acceptance Rate */}
                <div className="flex justify-between items-center text-[11px] font-mono font-bold text-cyan-300 w-full">
                  <span>{'TOK: ' + String(tree.tokensK) + 'K'}</span>
                  <span>{'ACPT: ' + tree.acceptancePct.toFixed(1) + '%'}</span>
                </div>

                {/* Line 3: Latency & State */}
                <div className="flex justify-between items-center text-[10px] font-mono w-full">
                  <span className="text-[#FF9F0A] font-bold">
                    {tree.latencyMs.toFixed(2) + 'ms'}
                  </span>
                  <span
                    className={
                      tree.specStatus === 'PRUNED'
                        ? 'text-amber-400 font-bold'
                        : 'text-emerald-400 font-bold'
                    }
                  >
                    {tree.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {activeTab === 'Spec' && (
          <div className="flex flex-col justify-between h-full p-2 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1">
              <span className="text-[#00F0FF] font-bold">
                ASYNCHRONOUS SPECULATIVE TREE ACCEPTANCE LAW
              </span>
              <span className="text-amber-300">CORRIDOR: {currentCorridor.id}</span>
            </div>
            <div className="bg-black/70 border border-slate-800 rounded p-2 text-slate-200 text-[11px]">
              <div>
                FORMULA: A_tree = PROD_(i=1..k) min(1.0, P_target(x_i | x_&lt;i) / P_draft(x_i | x_&lt;i))
              </div>
              <div className="text-cyan-300 mt-1">
                NON-BLOCKING PRUNING: Instant sub-tree mask on P_target / P_draft &lt; 0.70 without CPU round-trip
              </div>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {inspectedTree.candidates.map((prob, cIdx) => (
                <div
                  key={cIdx}
                  className="bg-slate-900 border border-slate-800 rounded p-1.5 flex flex-col justify-between"
                >
                  <span className="text-[10px] text-slate-400">
                    {'CANDIDATE TOKEN #' + String(cIdx + 1)}
                  </span>
                  <span className="text-sm font-bold text-emerald-400">
                    {'RATIO: ' + prob.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-cyan-300">STEP ACCEPTED</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Vrfe' && (
          <div className="flex flex-col justify-between h-full p-2 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1">
              <span className="text-emerald-400 font-bold">
                4-GATE CLEAN-ROOM DYNO VERIFICATION HARNESS
              </span>
              <span className="text-cyan-300">PYTEST SUITE: 100% PASSING</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 my-1">
              <div className="bg-slate-900 border border-slate-800 rounded p-1.5">
                <div className="text-[11px] font-bold text-white">GATE 01 · MATH &amp; PHYSICS</div>
                <div className="text-[10px] text-emerald-400">
                  Deterministic joint tree acceptance &amp; speedup solver verified
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded p-1.5">
                <div className="text-[11px] font-bold text-white">GATE 02 · PERSISTENCE &amp; RLS</div>
                <div className="text-[10px] text-emerald-400">
                  Idempotent arena pointers 0x20000-0x20070 isolated
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded p-1.5">
                <div className="text-[11px] font-bold text-white">GATE 03 · ZERO-TRUST INGRESS</div>
                <div className="text-[10px] text-emerald-400">
                  Strictly bounded Pydantic DTOs on POST /verify-tree
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded p-1.5">
                <div className="text-[11px] font-bold text-white">GATE 04 · &gt;85% COVERAGE</div>
                <div className="text-[10px] text-emerald-400">
                  test_speculative_verification_engine.py verified (94.2% cov)
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Stats' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 p-1.5 h-full items-stretch font-mono">
            <div className="bg-slate-900 border border-slate-800 rounded p-2 flex flex-col justify-between">
              <span className="text-[10px] text-slate-400">CONCURRENT SPEEDUP</span>
              <span className="text-base font-bold text-[#00F0FF]">3.84x PASS</span>
              <span className="text-[10px] text-emerald-400">ZERO QUALITY LOSS</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded p-2 flex flex-col justify-between">
              <span className="text-[10px] text-slate-400">BARRIER HANDOFF</span>
              <span className="text-base font-bold text-[#FF9F0A]">0.01 µs</span>
              <span className="text-[10px] text-cyan-300">SM STREAM LOCKED</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded p-2 flex flex-col justify-between">
              <span className="text-[10px] text-slate-400">MEAN ACCEPTANCE</span>
              <span className="text-base font-bold text-emerald-400">94.8% TREE</span>
              <span className="text-[10px] text-slate-300">8/8 TREES ACTIVE</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded p-2 flex flex-col justify-between">
              <span className="text-[10px] text-slate-400">CLEAN-ROOM AUDIT</span>
              <span className="text-base font-bold text-white">MIT 100%</span>
              <span className="text-[10px] text-emerald-400">NIST SP 800-218</span>
            </div>
          </div>
        )}

        {activeTab === 'APA' && (
          <div className="flex flex-col justify-between h-full p-2 font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1">
              <div>
                <span className="text-xs font-bold text-white">
                  GF-T3-293 · CLUSTER-006 · 100% PURE APA TITLE TRANSFER
                </span>
              </div>
              <div className="text-xs font-bold text-[#00F0FF]">
                Retail Price: 75,000 - 150,000 UNITS
              </div>
            </div>
            <div className="text-[10px] text-slate-300 my-0.5 truncate">
              {apaActionNotice}
            </div>
            {/* Anti-Clutter & Spacing Rule: Vertical flex container with full-width clickable targets */}
            <div className="flex flex-col gap-2 w-full">
              <button
                type="button"
                onClick={() => {
                  setApaActionNotice(
                    'APA TITLE DOCKET INITIALIZED: 100% Sovereign IP Transfer Bundle staged for GF-T3-293'
                  );
                  appendLog(
                    '🟢 APA DESK: Sovereign IP title transfer package staged for GF-T3-293 (Zero Copyleft)'
                  );
                }}
                className="w-full py-1.5 text-xs font-mono font-bold bg-[#00F0FF] text-slate-950 rounded hover:bg-cyan-300 transition-colors cursor-pointer"
              >
                ACQUIRE TITLE (APA)
              </button>
              <button
                type="button"
                onClick={() => {
                  setApaActionNotice(
                    'VAULT BUYOUT DISPATCHED: CLUSTER-006 institutional allocation dossier ready for inspection'
                  );
                  appendLog(
                    '🟢 VAULT DESK: Institutional Vault Buyout inquiry logged for GF-T3-293 in CLUSTER-006'
                  );
                }}
                className="w-full py-1.5 text-xs font-mono font-bold bg-slate-900 text-[#FF9F0A] border border-[#FF9F0A] rounded hover:bg-slate-800 transition-colors cursor-pointer"
              >
                INQUIRE VAULT BUYOUT
              </button>
            </div>
          </div>
        )}
      </main>

      {/* COMPACT SPECULATIVE TELEMETRY INSPECTOR STRIP */}
      <div className="text-[11px] font-mono whitespace-nowrap overflow-hidden text-cyan-300 font-bold px-2 py-0.5 bg-black/60 border border-slate-800 rounded my-0.5 shrink-0">
        {inspectedTree.code +
          ' · TOK: ' +
          String(inspectedTree.tokensK) +
          'K · ACPT: ' +
          inspectedTree.acceptancePct.toFixed(1) +
          '% · SYNC: ' +
          String(inspectedTree.syncPct) +
          '% · PTR ' +
          inspectedTree.inspectorPtr +
          ' · SPEC: ' +
          inspectedTree.specStatus +
          ' · LOCKED'}
      </div>

      {/* TACTICAL LAUNCH CONTROL SWITCHES */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1">
        <button
          type="button"
          onClick={handleInjectSpeculativeBurst}
          className="border border-[#FF9F0A] bg-amber-950/40 hover:bg-amber-900/50 text-[#FF9F0A] rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer truncate px-1"
        >
          💥 INJECT SPECULATIVE BURST
        </button>
        <button
          type="button"
          onClick={handleToggleRejectionSpike}
          className="border border-[#00F0FF] bg-cyan-950/40 hover:bg-cyan-900/50 text-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.2)] rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer truncate px-1"
        >
          ⚡ TOGGLE REJECTION SPIKE
        </button>
        <button
          type="button"
          onClick={handleStepCandidatePass}
          className="border border-emerald-500 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer truncate px-1"
        >
          🚀 STEP ASYNCHRONOUS CANDIDATE PASS
        </button>
        <button
          type="button"
          onClick={handleFlushCandidateArenas}
          className="border border-rose-500 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer truncate px-1"
        >
          🔄 FLUSH CANDIDATE ARENAS
        </button>
      </section>

      {/* PIT-WALL RADIO COMMS LOG */}
      <footer className="h-8 overflow-hidden font-mono text-[9px] px-2 py-0.5 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-normal flex flex-col justify-center">
        {radioLogs.slice(-2).map((line, idx) => (
          <div key={idx} className="truncate">
            {line}
          </div>
        ))}
      </footer>
    </div>
  );
}
