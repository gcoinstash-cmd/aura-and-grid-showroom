/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

interface CorridorSpec {
  id: string;
  throughputNumber: number;
  throughputDisplay: string;
  latencyDisplay: string;
  tpDegree: number;
  ppDegree: number;
  saturationPct: number;
}

const HYBRID_CORRIDORS: CorridorSpec[] = [
  {
    id: 'HYBRID-CORRIDOR-ALPHA (DYNAMIC-3D-PARALLEL-FABRIC · 134800-GB/S)',
    throughputNumber: 134800,
    throughputDisplay: '134,800 GB/s',
    latencyDisplay: '0.01 µs',
    tpDegree: 4,
    ppDegree: 2,
    saturationPct: 99,
  },
  {
    id: 'HYBRID-CORRIDOR-BRAVO (TENSOR-PIPELINE-MESH-ENGINE)',
    throughputNumber: 118400,
    throughputDisplay: '118,400 GB/s',
    latencyDisplay: '0.02 µs',
    tpDegree: 2,
    ppDegree: 4,
    saturationPct: 92,
  },
  {
    id: 'HYBRID-CORRIDOR-GAMMA (NON-BLOCKING-NVLINK-RDMA-ROUTER)',
    throughputNumber: 96200,
    throughputDisplay: '96,200 GB/s',
    latencyDisplay: '0.03 µs',
    tpDegree: 4,
    ppDegree: 2,
    saturationPct: 84,
  },
  {
    id: 'HYBRID-CORRIDOR-DELTA (FALLBACK-SINGLE-NODE-PASS)',
    throughputNumber: 42500,
    throughputDisplay: '42,500 GB/s',
    latencyDisplay: '0.09 µs',
    tpDegree: 1,
    ppDegree: 8,
    saturationPct: 58,
  },
];

interface NodeState {
  index: number;
  title: string;
  shortTag: string;
  hexPtr: string;
  tokensLabel: string;
  meshLoadLabel: string;
  syncLabel: string;
  latencyLabel: string;
  statusLabel: string;
}

const INITIAL_NODES: NodeState[] = [
  { index: 0, title: 'Node 0 (N0)', shortTag: 'N0', hexPtr: '0x52000', tokensLabel: '256K', meshLoadLabel: '100%', syncLabel: '100%', latencyLabel: '0.02ms', statusLabel: 'PIPELINED · LOCKED' },
  { index: 1, title: 'Node 1 (N1)', shortTag: 'N1', hexPtr: '0x52010', tokensLabel: '256K', meshLoadLabel: '100%', syncLabel: '100%', latencyLabel: '0.02ms', statusLabel: 'PIPELINED · LOCKED' },
  { index: 2, title: 'Node 2 (N2)', shortTag: 'N2', hexPtr: '0x52020', tokensLabel: '256K', meshLoadLabel: '100%', syncLabel: '100%', latencyLabel: '0.02ms', statusLabel: 'PIPELINED · LOCKED' },
  { index: 3, title: 'Node 3 (N3)', shortTag: 'N3', hexPtr: '0x52030', tokensLabel: '256K', meshLoadLabel: '100%', syncLabel: '100%', latencyLabel: '0.02ms', statusLabel: 'PIPELINED · LOCKED' },
  { index: 4, title: 'Node 4 (N4)', shortTag: 'N4', hexPtr: '0x52040', tokensLabel: '256K', meshLoadLabel: '100%', syncLabel: '100%', latencyLabel: '0.02ms', statusLabel: 'PIPELINED · LOCKED' },
  { index: 5, title: 'Node 5 (N5)', shortTag: 'N5', hexPtr: '0x52050', tokensLabel: '256K', meshLoadLabel: '100%', syncLabel: '100%', latencyLabel: '0.02ms', statusLabel: 'PIPELINED · LOCKED' },
  { index: 6, title: 'Node 6 (N6)', shortTag: 'N6', hexPtr: '0x52060', tokensLabel: '256K', meshLoadLabel: '100%', syncLabel: '100%', latencyLabel: '0.02ms', statusLabel: 'PIPELINED · LOCKED' },
  { index: 7, title: 'Node 7 (N7)', shortTag: 'N7', hexPtr: '0x52070', tokensLabel: '256K', meshLoadLabel: '100%', syncLabel: '100%', latencyLabel: '0.02ms', statusLabel: 'PIPELINED · LOCKED' },
];

const TAB_LABELS: string[] = ['Mesh', 'Hybr', 'Mesh', 'Stats', 'APA'];

export default function App() {
  const [selectedCorridorId, setSelectedCorridorId] = useState<string>(HYBRID_CORRIDORS[0].id);
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const [selectedNodeIdx, setSelectedNodeIdx] = useState<number>(3);
  const [burstActive, setBurstActive] = useState<boolean>(false);
  const [bubbleSpikeActive, setBubbleSpikeActive] = useState<boolean>(false);
  const [stepPassCount, setStepPassCount] = useState<number>(0);
  const [processedTokens, setProcessedTokens] = useState<number>(29400000);
  const [engineXpK, setEngineXpK] = useState<number>(75.0);
  const [apaStatusBanner, setApaStatusBanner] = useState<string>('CHASSIS GF-T3-343 · CLUSTER-006 · 100% SOVEREIGN IP TITLE TRANSFER READY');
  const [radioLogLines, setRadioLogLines] = useState<string[]>([
    '[00:01.04] 🟢 CREW CHIEF: Asynchronous hybrid tensor and pipeline parallelism engine initialized · 8 nodes linked',
    '[00:01.08] 🟢 TELEMETRY: 3D cluster mesh sharding verified at 134,800 GB/s with zero pipeline bubbles',
  ]);

  const currentCorridor =
    HYBRID_CORRIDORS.find((c) => c.id === selectedCorridorId) || HYBRID_CORRIDORS[0];

  const computedThroughputNumber = Math.round(
    currentCorridor.throughputNumber *
      (burstActive ? 1.08 : 1.0) *
      (bubbleSpikeActive ? 0.92 : 1.0)
  );

  const formattedThroughput =
    selectedCorridorId === HYBRID_CORRIDORS[0].id && !burstActive && !bubbleSpikeActive
      ? '134,800 GB/s'
      : computedThroughputNumber.toLocaleString('en-US') + ' GB/s';

  const formattedLatency = bubbleSpikeActive
    ? '0.03 µs'
    : burstActive
    ? '0.01 µs'
    : currentCorridor.latencyDisplay;

  const formattedTokens = processedTokens.toLocaleString('en-US') + ' UNITS';
  const formattedXp = '+' + engineXpK.toFixed(1) + 'k ENGINE XP';
  const hybridStateLabel = bubbleSpikeActive
    ? 'Hybrid State: Re-Scheduling'
    : 'Hybrid State: Active';

  const nodes: NodeState[] = INITIAL_NODES.map((baseNode) => {
    const tokVal = 256 + stepPassCount * 8 + (burstActive ? 64 : 0);
    const meshPct = bubbleSpikeActive ? (baseNode.index % 2 === 1 ? '88%' : '96%') : '100%';
    const syncPct = bubbleSpikeActive ? '94%' : '100%';
    const latLabel = bubbleSpikeActive
      ? baseNode.index % 2 === 1
        ? '0.05ms'
        : '0.03ms'
      : burstActive
      ? '0.01ms'
      : '0.02ms';
    const statusText = bubbleSpikeActive
      ? baseNode.index % 2 === 1
        ? 'RESCHEDULE · SYNC'
        : 'PIPELINED · LOCKED'
      : 'PIPELINED · LOCKED';

    return {
      ...baseNode,
      tokensLabel: String(tokVal) + 'K',
      meshLoadLabel: meshPct,
      syncLabel: syncPct,
      latencyLabel: latLabel,
      statusLabel: statusText,
    };
  });

  const activeNode = nodes[selectedNodeIdx] || nodes[3];

  const handleCorridorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextId = e.target.value;
    setSelectedCorridorId(nextId);
    const found = HYBRID_CORRIDORS.find((c) => c.id === nextId) || HYBRID_CORRIDORS[0];
    setRadioLogLines([
      '[00:02.12] 🟢 CREW CHIEF: Switched active fabric to ' + found.id,
      '[00:02.16] 🟢 TELEMETRY: 3D cluster mesh sharding verified at ' +
        found.throughputDisplay +
        ' with zero pipeline bubbles',
    ]);
  };

  const handleTriggerBurst = () => {
    const nextBurst = !burstActive;
    setBurstActive(nextBurst);
    setProcessedTokens((prev) => prev + 1200000);
    setEngineXpK((prev) => Number((prev + 4.5).toFixed(1)));
    setRadioLogLines([
      '[00:03.04] 🟢 CREW CHIEF: Hybrid Parallelism Burst ' +
        (nextBurst ? 'ENGAGED across 8 nodes' : 'returned to nominal baseline'),
      '[00:03.09] 🟢 TELEMETRY: Non-blocking NVLink-RDMA activation overlap locked at 100% saturation',
    ]);
  };

  const handleToggleBubbleSpike = () => {
    const nextSpike = !bubbleSpikeActive;
    setBubbleSpikeActive(nextSpike);
    setEngineXpK((prev) => Number((prev + 2.0).toFixed(1)));
    setRadioLogLines([
      nextSpike
        ? '[00:04.11] 🟡 CREW CHIEF: Pipeline Bubble Spike injected · Dynamic Micro-Batch Re-Scheduling active'
        : '[00:04.15] 🟢 CREW CHIEF: Pipeline Bubble Spike cleared · 1F1B stage barriers locked',
      '[00:04.19] 🟢 TELEMETRY: Sub-microsecond barrier synchronization verified across N0..N7',
    ]);
  };

  const handleStepMeshPass = () => {
    const nextStep = stepPassCount + 1;
    setStepPassCount(nextStep);
    setProcessedTokens((prev) => prev + 650000);
    setEngineXpK((prev) => Number((prev + 2.5).toFixed(1)));
    setRadioLogLines([
      '[00:05.02] 🟢 CREW CHIEF: Asynchronous mesh pass #' +
        String(nextStep) +
        ' completed across 2D TP+PP interlock',
      '[00:05.06] 🟢 TELEMETRY: Activation tensors streamed across GPU SMs with zero host CPU stalls',
    ]);
  };

  const handleFlushArenas = () => {
    setSelectedCorridorId(HYBRID_CORRIDORS[0].id);
    setBurstActive(false);
    setBubbleSpikeActive(false);
    setStepPassCount(0);
    setProcessedTokens(29400000);
    setEngineXpK(75.0);
    setSelectedNodeIdx(3);
    setRadioLogLines([
      '[00:01.04] 🟢 CREW CHIEF: Asynchronous hybrid tensor and pipeline parallelism engine initialized · 8 nodes linked',
      '[00:01.08] 🟢 TELEMETRY: 3D cluster mesh sharding verified at 134,800 GB/s with zero pipeline bubbles',
    ]);
  };

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans">
      {/* Top Header Stack */}
      <header className="w-full shrink-0 flex flex-col gap-0.5">
        {/* Top Header Row 1 */}
        <div className="flex items-center justify-between gap-1 w-full shrink-0">
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <h1 className="text-sm sm:text-base font-mono font-bold tracking-tight text-white">
              GF-T3-343
            </h1>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-cyan-500/15 text-[#00F0FF] border border-cyan-500/40 rounded">
              FLAGSHIP
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0 overflow-hidden">
            <select
              aria-label="Synthetic Hybrid Corridor Selector"
              value={selectedCorridorId}
              onChange={handleCorridorChange}
              className="max-w-[120px] text-[10px] font-mono truncate py-0.5 px-1 shrink-0 bg-slate-900 text-cyan-300 border border-slate-700 rounded focus:outline-none focus:border-cyan-400"
            >
              {HYBRID_CORRIDORS.map((corridor) => (
                <option key={corridor.id} value={corridor.id}>
                  {corridor.id}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setActiveTabIndex(1)}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/40 rounded cursor-pointer"
            >
              [Hybr]
            </button>
            <button
              type="button"
              onClick={() => setActiveTabIndex(0)}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 rounded cursor-pointer"
            >
              [Mesh]
            </button>
            <button
              type="button"
              onClick={handleStepMeshPass}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 rounded cursor-pointer"
            >
              [Run]
            </button>
          </div>
        </div>

        {/* Top Header Row 2 */}
        <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap">
          Hybrid Parallelism · TP + PP Mesh · Zero Bubble Stalls
        </div>
      </header>

      {/* 4-Card Arcade HUD Ribbon (2x2 Grid) */}
      <section className="grid grid-cols-2 gap-1.5 w-full shrink-0 my-0.5">
        {/* Card 1: HYBR NITRO */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              HYBR NITRO
            </span>
            <span className="text-[10px] font-mono font-bold text-[#00F0FF]">
              SAT: {String(currentCorridor.saturationPct)}%
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-[#00F0FF] leading-tight">
            {formattedThroughput}
          </div>
          <div className="w-full bg-slate-800 h-1 rounded overflow-hidden my-0.5">
            <div
              className="bg-[#00F0FF] h-full transition-opacity duration-150"
              style={{ width: String(currentCorridor.saturationPct) + '%' }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Cluster Throughput Saturation
          </div>
        </div>

        {/* Card 2: MESH STREAK */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              MESH STREAK
            </span>
            <span className="text-[10px] font-mono font-bold text-[#FF9F0A]">
              🔥 TP+PP MESH
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-amber-400 leading-tight">
            {formattedLatency}
          </div>
          <div className="text-[10px] font-mono text-emerald-400 truncate">
            Barrier Sync: Sub-Microsecond Lock
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Pipeline Latency
          </div>
        </div>

        {/* Card 3: ACTIVE NODES */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              ACTIVE NODES
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-400">
              NODES: 8/8
            </span>
          </div>
          <div className="grid grid-cols-8 gap-0.5 my-0.5">
            {nodes.map((n) => (
              <button
                key={n.shortTag}
                type="button"
                onClick={() => setSelectedNodeIdx(n.index)}
                className={
                  'text-[9px] font-mono font-bold py-0.5 rounded text-center cursor-pointer border ' +
                  (selectedNodeIdx === n.index
                    ? 'bg-cyan-500/25 text-[#00F0FF] border-cyan-400'
                    : 'bg-black/60 text-emerald-300 border-slate-800 hover:border-slate-700')
                }
              >
                {n.shortTag}
              </button>
            ))}
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            F1 Gear Shift Mesh [N0..N7] · Active: {activeNode.shortTag}
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              TOKEN SCORE
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-400">
              {formattedXp}
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-white leading-tight truncate">
            {formattedTokens}
          </div>
          <div className="text-[10px] font-mono text-cyan-300 truncate">
            Processed Tokens: {processedTokens.toLocaleString('en-US')} Units
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            {hybridStateLabel}
          </div>
        </div>
      </section>

      {/* 5 Horizontal Tabs */}
      <nav
        aria-label="Cockpit Mode Tabs"
        className="grid grid-cols-5 gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg my-1 w-full text-center shrink-0"
      >
        {TAB_LABELS.map((label, idx) => (
          <button
            key={String(idx) + '-' + label}
            type="button"
            onClick={() => setActiveTabIndex(idx)}
            className={
              'py-1 text-xs font-mono font-bold rounded transition-colors cursor-pointer whitespace-nowrap ' +
              (activeTabIndex === idx
                ? 'bg-cyan-500/20 text-[#00F0FF] border border-cyan-500/50'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60')
            }
          >
            {label}
          </button>
        ))}
      </nav>

      {/* Streamlined Mesh Info Subheader */}
      <div className="text-[10px] font-mono whitespace-nowrap overflow-hidden text-slate-300 px-1 shrink-0">
        VIEW: MESH · PTR: 0x52F8DC0 · MODE: HYBRID_PARALLELISM · NODES: 8 · VEC: [1.00, 1.01, 1.00, 1.01]
      </div>

      {/* Central Interactive Matrix & Contextual Tab Deck */}
      <main className="flex-1 min-h-0 flex flex-col justify-center overflow-hidden my-0.5">
        {activeTabIndex === 4 ? (
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2 flex flex-col justify-between gap-1.5 h-full overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1">
              <span className="text-xs font-mono font-bold text-[#00F0FF]">
                GF-T3-343 · SOVEREIGN APA TITLE TRANSFER CONSOLE
              </span>
              <span className="text-[10px] font-mono text-amber-400">
                CLUSTER-006 · 100% CLEAN-ROOM MIT IP
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono text-slate-200">
              <div className="bg-black/60 border border-slate-800 rounded p-1.5">
                <div className="text-slate-400">Retail Price Tier</div>
                <div className="font-bold text-white">FLAGSHIP TRACK 3 ENGINE</div>
              </div>
              <div className="bg-black/60 border border-slate-800 rounded p-1.5">
                <div className="text-slate-400">Transfer Standard</div>
                <div className="font-bold text-emerald-400">100% Pure APA Buyout</div>
              </div>
              <div className="bg-black/60 border border-slate-800 rounded p-1.5">
                <div className="text-slate-400">Verification Gates</div>
                <div className="font-bold text-cyan-300">Gates 01-04 Verified</div>
              </div>
            </div>
            <div className="text-[10px] font-mono text-emerald-300 truncate">
              {apaStatusBanner}
            </div>
            <div className="flex flex-col gap-2 w-full">
              <button
                type="button"
                onClick={() =>
                  setApaStatusBanner(
                    'APA TITLE ACQUISITION DISPATCHED · DIRECT REPOSITORY TRANSFER PACKAGE LOCKED FOR GF-T3-343'
                  )
                }
                className="w-full py-1.5 px-3 text-xs font-mono font-bold bg-amber-500/20 hover:bg-amber-500/30 text-[#FF9F0A] border border-amber-500/60 rounded cursor-pointer text-center"
              >
                ACQUIRE TITLE (APA)
              </button>
              <button
                type="button"
                onClick={() =>
                  setApaStatusBanner(
                    'VAULT BUYOUT INQUIRY LOGGED · CLUSTER-006 ESCROW VERIFICATION GATE READY'
                  )
                }
                className="w-full py-1.5 px-3 text-xs font-mono font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-[#00F0FF] border border-cyan-500/60 rounded cursor-pointer text-center"
              >
                INQUIRE VAULT BUYOUT
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col justify-between h-full overflow-hidden">
            {activeTabIndex === 1 && (
              <div className="text-[10px] font-mono text-amber-300 bg-slate-900/90 border border-slate-800 rounded px-2 py-0.5 mb-0.5 truncate shrink-0">
                HYBRID INTERLOCK EQUATION: M_hybrid = sum(p=0..P-1) sum(t=0..T-1) P(W_layer, X_micro_batch, tau_nvlink_ib) · TP={String(currentCorridor.tpDegree)} · PP={String(currentCorridor.ppDegree)}
              </div>
            )}
            {activeTabIndex === 3 && (
              <div className="text-[10px] font-mono text-emerald-300 bg-slate-900/90 border border-slate-800 rounded px-2 py-0.5 mb-0.5 truncate shrink-0">
                DYNO STATS: Hybrid Throughput: {formattedThroughput} · Pipeline Latency: {formattedLatency} · Active Nodes: 8 Nodes · Mesh State: Active
              </div>
            )}

            {/* Interactive Node Matrix Bay (N0–N7) */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950/90 border border-slate-800 rounded-lg h-full items-stretch">
              {nodes.map((node) => (
                <div
                  key={node.shortTag}
                  onClick={() => setSelectedNodeIdx(node.index)}
                  className={
                    'flex flex-col justify-between p-1.5 rounded border cursor-pointer transition-colors ' +
                    (selectedNodeIdx === node.index
                      ? 'bg-slate-900 border-cyan-400'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700')
                  }
                >
                  {/* Line 1: Title & Hex */}
                  <div className="text-[10px] font-mono font-bold text-white flex justify-between items-center w-full">
                    <span>{node.title}</span>
                    <span className="text-slate-400 font-normal">{node.hexPtr}</span>
                  </div>

                  {/* Line 2: Tokens & Mesh Load */}
                  <div className="text-[8px] font-mono font-bold text-cyan-300 flex justify-between items-center w-full px-1">
                    <span>TOK: {node.tokensLabel}</span>
                    <span>MESH: {node.meshLoadLabel}</span>
                  </div>

                  {/* Line 3: Latency & Status */}
                  <div className="flex justify-between items-center text-[8px] font-mono text-slate-300 w-full px-1">
                    <span className="text-amber-400">{node.latencyLabel}</span>
                    <span className="text-emerald-400">{node.statusLabel}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Compact Hybrid Telemetry Inspector Strip */}
      <div className="text-[11px] font-mono whitespace-nowrap overflow-hidden text-cyan-300 font-bold px-2 py-0.5 bg-black/60 border border-slate-800 rounded my-0.5 shrink-0">
        {activeNode.shortTag} · TOK: {activeNode.tokensLabel} · MESH: {activeNode.meshLoadLabel} · SYNC: {activeNode.syncLabel} · PTR {activeNode.hexPtr} · STAGE: OK · LOCKED · NODES: 8 · MESH: 3D
      </div>

      {/* Tactical Launch Control Switches */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1">
        <button
          type="button"
          onClick={handleTriggerBurst}
          className="text-[8px] sm:text-[9px] md:text-xs font-mono font-bold py-1.5 px-0.5 whitespace-nowrap text-center truncate border rounded w-full border-amber-500/70 bg-amber-950/40 hover:bg-amber-900/50 text-[#FF9F0A] cursor-pointer"
        >
          💥 INJECT HYBRID PARALLELISM BURST
        </button>

        <button
          type="button"
          onClick={handleToggleBubbleSpike}
          className="text-[8px] sm:text-[9px] md:text-xs font-mono font-bold py-1.5 px-0.5 whitespace-nowrap text-center truncate border rounded w-full border-cyan-400/80 bg-cyan-950/40 hover:bg-cyan-900/50 text-[#00F0FF] cursor-pointer"
        >
          ⚡ TOGGLE PIPELINE BUBBLE SPIKE
        </button>

        <button
          type="button"
          onClick={handleStepMeshPass}
          className="text-[8px] sm:text-[9px] md:text-xs font-mono font-bold py-1.5 px-0.5 whitespace-nowrap text-center truncate border rounded w-full border-emerald-500/70 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 cursor-pointer"
        >
          🚀 STEP ASYNCHRONOUS MESH PASS
        </button>

        <button
          type="button"
          onClick={handleFlushArenas}
          className="text-[8px] sm:text-[9px] md:text-xs font-mono font-bold py-1.5 px-0.5 whitespace-nowrap text-center truncate border rounded w-full border-rose-500/70 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 cursor-pointer"
        >
          🔄 FLUSH HYBRID ARENAS
        </button>
      </section>

      {/* Pit-Wall Radio Comms Log */}
      <footer className="h-8 overflow-hidden font-mono text-[9px] px-2 py-0.5 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-normal flex flex-col justify-center">
        <div className="truncate">{radioLogLines[0]}</div>
        <div className="truncate">{radioLogLines[1]}</div>
      </footer>
    </div>
  );
}
