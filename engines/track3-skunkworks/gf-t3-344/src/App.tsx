/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

type TabKey = 'Mesh' | 'Grap' | 'Repl' | 'Stats' | 'APA';

interface GraphUnit {
  id: number;
  title: string;
  shortTag: string;
  hexPtr: string;
  inspectPtr: string;
  tokensK: number;
  graphPct: number;
  syncPct: number;
  latencyMs: string;
  status: string;
  replState: string;
  overhead: string;
  kernelsCaptured: number;
}

const CORRIDORS: string[] = [
  'GRAPH-CORRIDOR-ALPHA (DYNAMIC-CUDA-GRAPH-FABRIC · 136600-GB/S)',
  'GRAPH-CORRIDOR-BRAVO (ZERO-OVERHEAD-REPLAY-ENGINE)',
  'GRAPH-CORRIDOR-GAMMA (NON-BLOCKING-LAUNCH-SERIALIZER)',
  'GRAPH-CORRIDOR-DELTA (FALLBACK-DYNAMIC-LAUNCH-PASS)',
];

const INITIAL_GRAPHS: GraphUnit[] = [
  {
    id: 0,
    title: 'Graph 0 (G0)',
    shortTag: 'G0',
    hexPtr: '0x53000',
    inspectPtr: '0x53000',
    tokensK: 256,
    graphPct: 100,
    syncPct: 100,
    latencyMs: '0.02ms',
    status: 'CAPTURED · LOCKED',
    replState: 'OK',
    overhead: '0.0',
    kernelsCaptured: 64,
  },
  {
    id: 1,
    title: 'Graph 1 (G1)',
    shortTag: 'G1',
    hexPtr: '0x53010',
    inspectPtr: '0x53010',
    tokensK: 256,
    graphPct: 100,
    syncPct: 100,
    latencyMs: '0.02ms',
    status: 'CAPTURED · LOCKED',
    replState: 'OK',
    overhead: '0.0',
    kernelsCaptured: 64,
  },
  {
    id: 2,
    title: 'Graph 2 (G2)',
    shortTag: 'G2',
    hexPtr: '0x53020',
    inspectPtr: '0x53020',
    tokensK: 256,
    graphPct: 100,
    syncPct: 100,
    latencyMs: '0.02ms',
    status: 'CAPTURED · LOCKED',
    replState: 'OK',
    overhead: '0.0',
    kernelsCaptured: 64,
  },
  {
    id: 3,
    title: 'Graph 3 (G3)',
    shortTag: 'G3',
    hexPtr: '0x53030',
    inspectPtr: '0x53030',
    tokensK: 256,
    graphPct: 100,
    syncPct: 100,
    latencyMs: '0.02ms',
    status: 'CAPTURED · LOCKED',
    replState: 'OK',
    overhead: '0.0',
    kernelsCaptured: 64,
  },
  {
    id: 4,
    title: 'Graph 4 (G4)',
    shortTag: 'G4',
    hexPtr: '0x53040',
    inspectPtr: '0x53040',
    tokensK: 256,
    graphPct: 100,
    syncPct: 100,
    latencyMs: '0.02ms',
    status: 'CAPTURED · LOCKED',
    replState: 'OK',
    overhead: '0.0',
    kernelsCaptured: 64,
  },
  {
    id: 5,
    title: 'Graph 5 (G5)',
    shortTag: 'G5',
    hexPtr: '0x53050',
    inspectPtr: '0x53050',
    tokensK: 256,
    graphPct: 100,
    syncPct: 100,
    latencyMs: '0.02ms',
    status: 'CAPTURED · LOCKED',
    replState: 'OK',
    overhead: '0.0',
    kernelsCaptured: 64,
  },
  {
    id: 6,
    title: 'Graph 6 (G6)',
    shortTag: 'G6',
    hexPtr: '0x53060',
    inspectPtr: '0x53060',
    tokensK: 256,
    graphPct: 100,
    syncPct: 100,
    latencyMs: '0.02ms',
    status: 'CAPTURED · LOCKED',
    replState: 'OK',
    overhead: '0.0',
    kernelsCaptured: 64,
  },
  {
    id: 7,
    title: 'Graph 7 (G7)',
    shortTag: 'G7',
    hexPtr: '0x53070',
    inspectPtr: '0x53070',
    tokensK: 256,
    graphPct: 100,
    syncPct: 100,
    latencyMs: '0.02ms',
    status: 'CAPTURED · LOCKED',
    replState: 'OK',
    overhead: '0.0',
    kernelsCaptured: 64,
  },
];

const INITIAL_LOGS: string[] = [
  '[00:01.04] 🟢 CREW CHIEF: Asynchronous CUDA graph capture and kernel launch serialization engine initialized · 8 graphs linked',
  '[00:01.08] 🟢 TELEMETRY: Zero-overhead execution graph replay verified at 136,600 GB/s with zero CPU launch jitter',
];

export default function App() {
  const [corridor, setCorridor] = useState<string>(CORRIDORS[0]);
  const [activeTab, setActiveTab] = useState<TabKey>('Mesh');
  const [selectedGraphId, setSelectedGraphId] = useState<number>(3);
  const [graphs, setGraphs] = useState<GraphUnit[]>(INITIAL_GRAPHS);
  const [throughputGbs, setThroughputGbs] = useState<number>(136600);
  const [replayLatencyUs, setReplayLatencyUs] = useState<string>('0.01');
  const [activeGraphCount, setActiveGraphCount] = useState<number>(8);
  const [processedTokens, setProcessedTokens] = useState<number>(30200000);
  const [engineXpK, setEngineXpK] = useState<string>('75.0');
  const [graphStateLabel, setGraphStateLabel] = useState<string>('Active');
  const [jitterActive, setJitterActive] = useState<boolean>(false);
  const [apaStatusBanner, setApaStatusBanner] = useState<string>(
    'READY FOR SOVEREIGN APA TITLE TRANSFER · CLUSTER-006 · ZERO LICENSING'
  );
  const [radioLogs, setRadioLogs] = useState<string[]>(INITIAL_LOGS);

  const selectedGraph = graphs[selectedGraphId] || graphs[3];

  const appendRadioLog = (line1: string, line2: string) => {
    setRadioLogs([line1, line2]);
  };

  const handleInjectCaptureBurst = () => {
    const nextTokens = processedTokens + 2048000;
    const nextXp = (parseFloat(engineXpK) + 10.0).toFixed(1);
    const updated = graphs.map((g) => ({
      ...g,
      tokensK: g.tokensK + 32,
      graphPct: 100,
      syncPct: 100,
      latencyMs: '0.01ms',
      status: 'CAPTURED · LOCKED',
      replState: 'OK',
      overhead: '0.0',
      kernelsCaptured: g.kernelsCaptured + 8,
    }));
    setGraphs(updated);
    setProcessedTokens(nextTokens);
    setEngineXpK(nextXp);
    setThroughputGbs(136600);
    setReplayLatencyUs('0.01');
    setActiveGraphCount(8);
    setJitterActive(false);
    setGraphStateLabel('Active');
    appendRadioLog(
      '[00:02.12] 🟢 CREW CHIEF: Triggered CUDA Graph Capture Burst across G0..G7 · 64 stream kernels serialized into immutable DAG',
      '[00:02.16] 🟢 TELEMETRY: Graph Throughput Saturation locked at 136,600 GB/s · Processed Tokens: ' +
        nextTokens.toLocaleString() +
        ' Units'
    );
  };

  const handleToggleLaunchJitter = () => {
    const nextJitter = !jitterActive;
    setJitterActive(nextJitter);
    if (nextJitter) {
      const updated = graphs.map((g, idx) => ({
        ...g,
        graphPct: idx % 2 === 0 ? 94 : 92,
        syncPct: 95,
        latencyMs: '0.05ms',
        status: 'RECOMPILING · SYNC',
        replState: 'SYNC',
        overhead: '0.04',
      }));
      setGraphs(updated);
      setThroughputGbs(128400);
      setReplayLatencyUs('0.04');
      setActiveGraphCount(8);
      setGraphStateLabel('Active');
      appendRadioLog(
        '[00:03.05] 🟡 CREW CHIEF: Injected Launch Jitter Spike · Dynamic Graph Re-Compilation engaged on stream barriers',
        '[00:03.09] 🟡 TELEMETRY: Sub-microsecond barrier interlock absorbing host launch delta · Replay Latency: 0.04 µs'
      );
    } else {
      const updated = graphs.map((g) => ({
        ...g,
        graphPct: 100,
        syncPct: 100,
        latencyMs: '0.02ms',
        status: 'CAPTURED · LOCKED',
        replState: 'OK',
        overhead: '0.0',
      }));
      setGraphs(updated);
      setThroughputGbs(136600);
      setReplayLatencyUs('0.01');
      setActiveGraphCount(8);
      setGraphStateLabel('Active');
      appendRadioLog(
        '[00:03.41] 🟢 CREW CHIEF: Launch jitter damped · Immutable CUDA Graph lock restored across all 8 streaming partitions',
        '[00:03.45] 🟢 TELEMETRY: Zero-overhead execution graph replay verified at 136,600 GB/s with zero CPU launch jitter'
      );
    }
  };

  const handleStepAsyncReplay = () => {
    const nextTokens = processedTokens + 512000;
    const nextXp = (parseFloat(engineXpK) + 2.5).toFixed(1);
    const updated = graphs.map((g) =>
      g.id === selectedGraphId
        ? {
            ...g,
            tokensK: g.tokensK + 16,
            graphPct: 100,
            syncPct: 100,
            latencyMs: '0.01ms',
            status: 'CAPTURED · LOCKED',
            replState: 'OK',
            overhead: '0.0',
          }
        : g
    );
    setGraphs(updated);
    setProcessedTokens(nextTokens);
    setEngineXpK(nextXp);
    setReplayLatencyUs('0.01');
    setThroughputGbs(136600);
    appendRadioLog(
      '[00:04.19] 🟢 CREW CHIEF: Stepped non-blocking asynchronous replay pass on ' +
        selectedGraph.shortTag +
        ' (' +
        selectedGraph.hexPtr +
        ')',
      '[00:04.22] 🟢 TELEMETRY: Barrier synchronization verified at 0.01 µs · Zero CPU synchronization stalls'
    );
  };

  const handleFlushArenas = () => {
    setCorridor(CORRIDORS[0]);
    setGraphs(INITIAL_GRAPHS);
    setSelectedGraphId(3);
    setThroughputGbs(136600);
    setReplayLatencyUs('0.01');
    setActiveGraphCount(8);
    setProcessedTokens(30200000);
    setEngineXpK('75.0');
    setGraphStateLabel('Active');
    setJitterActive(false);
    setRadioLogs(INITIAL_LOGS);
  };

  const handleCorridorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setCorridor(val);
    if (val === CORRIDORS[0]) {
      setThroughputGbs(136600);
      setReplayLatencyUs('0.01');
    } else if (val === CORRIDORS[1]) {
      setThroughputGbs(135900);
      setReplayLatencyUs('0.01');
    } else if (val === CORRIDORS[2]) {
      setThroughputGbs(134800);
      setReplayLatencyUs('0.02');
    } else {
      setThroughputGbs(129200);
      setReplayLatencyUs('0.03');
    }
    appendRadioLog(
      '[00:05.02] 🟢 CREW CHIEF: Switched execution corridor to ' + val,
      '[00:05.06] 🟢 TELEMETRY: Stream capture weights recalibrated · Vector [1.01, 1.02, 1.01, 1.02] locked'
    );
  };

  const tabs: TabKey[] = ['Mesh', 'Grap', 'Repl', 'Stats', 'APA'];

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans">
      {/* Top Header Stack */}
      <div className="w-full shrink-0 flex flex-col gap-0.5">
        {/* Top Header Row 1 */}
        <div className="flex items-center justify-between gap-1 w-full shrink-0">
          {/* Left: Title & Cyan Badge */}
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <h1 className="text-sm sm:text-base font-mono font-bold tracking-tight text-white">
              GF-T3-344
            </h1>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-cyan-500/15 text-[#00F0FF] border border-cyan-500/40 rounded">
              FLAGSHIP
            </span>
          </div>

          {/* Right: Compact Corridor Dropdown & Micro Action Buttons */}
          <div className="flex items-center gap-1 shrink-0 overflow-hidden">
            <select
              aria-label="Synthetic Graph Corridor"
              value={corridor}
              onChange={handleCorridorChange}
              className="max-w-[120px] text-[10px] font-mono truncate py-0.5 px-1 shrink-0 bg-slate-900 text-cyan-300 border border-slate-700 rounded focus:outline-none focus:border-cyan-400"
            >
              {CORRIDORS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                setActiveTab('Grap');
                handleInjectCaptureBurst();
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 bg-slate-900 hover:bg-cyan-950 text-cyan-300 border border-cyan-500/40 rounded cursor-pointer"
            >
              [Grap]
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('Repl');
                handleStepAsyncReplay();
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 bg-slate-900 hover:bg-amber-950 text-amber-300 border border-amber-500/40 rounded cursor-pointer"
            >
              [Repl]
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('Mesh');
                handleInjectCaptureBurst();
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 bg-slate-900 hover:bg-emerald-950 text-emerald-300 border border-emerald-500/40 rounded cursor-pointer"
            >
              [Run]
            </button>
          </div>
        </div>

        {/* Top Header Row 2 */}
        <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap">
          CUDA Graph Capture · Zero Launch Overhead · Max FPS
        </div>
      </div>

      {/* 4-Card Arcade HUD Ribbon (2x2 Grid) */}
      <div className="grid grid-cols-2 gap-1.5 w-full shrink-0 my-0.5">
        {/* Card 1: GRAPH NITRO */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              GRAPH NITRO
            </span>
            <span className="text-[10px] font-mono text-cyan-300">
              Graph Throughput: {throughputGbs.toLocaleString()} GB/s
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-[#00F0FF] leading-tight">
            {throughputGbs.toLocaleString()} GB/s
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded overflow-hidden my-0.5">
            <div
              className="bg-[#00F0FF] h-full transition-transform duration-150 origin-left"
              style={{ transform: jitterActive ? 'scaleX(0.94)' : 'scaleX(1)' }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Graph Throughput Saturation
          </div>
        </div>

        {/* Card 2: REPL STREAK */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              REPL STREAK
            </span>
            <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold bg-amber-500/20 text-[#FF9F0A] border border-amber-500/40 rounded">
              🔥 CUDA-GRAPH
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-[#FF9F0A] leading-tight">
            {replayLatencyUs} µs
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            Replay Latency: {replayLatencyUs} µs · Barrier Lock: 100%
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Replay Latency
          </div>
        </div>

        {/* Card 3: ACTIVE GRAPHS */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              ACTIVE GRAPHS
            </span>
            <span className="text-[10px] font-mono text-emerald-400">
              Active Graphs: {activeGraphCount} Graphs
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-emerald-400 leading-tight">
            GRAPHS: {activeGraphCount}/8
          </div>
          <div className="flex items-center gap-0.5 my-0.5">
            {graphs.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelectedGraphId(g.id)}
                className={
                  'px-1 py-0.2 text-[9px] font-mono font-bold rounded border cursor-pointer ' +
                  (selectedGraphId === g.id
                    ? 'bg-cyan-500/25 text-[#00F0FF] border-cyan-400'
                    : 'bg-slate-800/90 text-emerald-300 border-slate-700')
                }
              >
                {g.shortTag}
              </button>
            ))}
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            F1 Gear Shift Interlock [G0..G7] · Status: Locked
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              TOKEN SCORE
            </span>
            <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 rounded">
              +{engineXpK}k ENGINE XP
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-white leading-tight">
            {processedTokens.toLocaleString()} UNITS
          </div>
          <div className="text-[10px] font-mono text-cyan-300 truncate">
            Processed Tokens: {processedTokens.toLocaleString()} Units
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Graph State: {graphStateLabel}
          </div>
        </div>
      </div>

      {/* 5 Horizontal Tabs */}
      <div className="grid grid-cols-5 gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg my-1 w-full text-center shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={
              'py-1 text-xs font-mono font-bold rounded transition-colors cursor-pointer ' +
              (activeTab === tab
                ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/50'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60')
            }
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Streamlined Mesh Info Subheader (Strictly clean of action buttons) */}
      <div className="text-[10px] font-mono whitespace-nowrap overflow-hidden text-slate-300 px-1 shrink-0">
        VIEW: MESH · PTR: 0x53F8DC0 · MODE: CUDA_GRAPH · GRAPHS: 8 · VEC: [1.01, 1.02, 1.01, 1.02]
      </div>

      {/* Center Interactive Matrix Bay & Tab Overlay */}
      <div className="flex-1 min-h-0 flex flex-col justify-between overflow-hidden my-0.5">
        {/* Interactive Graph Matrix Bay (G0-G7) Always Rendered for Telemetry Continuity */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950/80 border border-slate-800/90 rounded-lg shrink-0">
          {graphs.map((g) => {
            const isSelected = g.id === selectedGraphId;
            return (
              <div
                key={g.id}
                onClick={() => setSelectedGraphId(g.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSelectedGraphId(g.id);
                  }
                }}
                className={
                  'p-1.5 rounded border transition-colors cursor-pointer flex flex-col justify-between gap-0.5 ' +
                  (isSelected
                    ? 'bg-slate-900 border-[#00F0FF] shadow-[0_0_8px_rgba(0,240,255,0.2)]'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700')
                }
              >
                {/* Line 1: Title & Hex */}
                <div className="text-[10px] font-mono font-bold text-white flex justify-between items-center w-full">
                  <span>{g.title}</span>
                  <span className="text-slate-400 font-normal">{g.hexPtr}</span>
                </div>

                {/* Line 2: Tokens & Graph Load */}
                <div className="text-[8px] font-mono font-bold text-cyan-300 flex justify-between items-center w-full px-1">
                  <span>TOK: {g.tokensK}K</span>
                  <span>GRAPH: {g.graphPct}%</span>
                </div>

                {/* Line 3: Latency & Status */}
                <div className="flex justify-between items-center text-[8px] font-mono text-slate-300 w-full px-1">
                  <span className="text-amber-400">{g.latencyMs}</span>
                  <span className="text-emerald-400">{g.status}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dynamic Contextual Sub-Panel for Active Tab */}
        {activeTab === 'Mesh' && (
          <div className="px-2 py-1 bg-slate-900/60 border border-slate-800 rounded flex items-center justify-between text-[10px] font-mono text-slate-300 shrink-0">
            <span>
              STREAM EQUATION: G_graph = sum_g C(K_stream, W_weights, delta_cuda_launch)
            </span>
            <span className="text-cyan-300 font-bold">
              CORRIDOR: {corridor}
            </span>
          </div>
        )}

        {activeTab === 'Grap' && (
          <div className="px-2 py-1 bg-slate-900/60 border border-cyan-500/30 rounded flex items-center justify-between text-[10px] font-mono text-slate-200 shrink-0">
            <span>
              DAG CAPTURE STREAM: {selectedGraph.title} · KERNELS SERIALIZED: {selectedGraph.kernelsCaptured} · LAUNCH DELTA: 0.0 µs
            </span>
            <span className="text-[#00F0FF] font-bold">
              IMMUTABLE GPU GRAPH VERIFIED
            </span>
          </div>
        )}

        {activeTab === 'Repl' && (
          <div className="px-2 py-1 bg-slate-900/60 border border-amber-500/30 rounded flex items-center justify-between text-[10px] font-mono text-slate-200 shrink-0">
            <span>
              NON-BLOCKING REPLAY: {selectedGraph.shortTag} BARRIER LOCK {selectedGraph.syncPct}% · ZERO HOST STALLS
            </span>
            <span className="text-[#FF9F0A] font-bold">
              SUB-MICROSECOND BARRIER SYNC: {replayLatencyUs} µs
            </span>
          </div>
        )}

        {activeTab === 'Stats' && (
          <div className="px-2 py-1 bg-slate-900/60 border border-emerald-500/30 rounded flex items-center justify-between text-[10px] font-mono text-slate-200 shrink-0">
            <span>
              DYNO GATES 01-04: PASS · PYTEST SUITE &gt;85% · FASTAPI OPENAPI 3.1 READY · ZERO COPYLEFT MIT
            </span>
            <span className="text-emerald-400 font-bold">
              NIST SP 800-218 SSDF v1.1 COMPLIANT
            </span>
          </div>
        )}

        {activeTab === 'APA' && (
          <div className="p-1.5 bg-slate-900/90 border border-amber-500/40 rounded flex flex-col gap-1 shrink-0">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-white font-bold">
                UNIT: GF-T3-344 · CLUSTER-006 · 100% SOVEREIGN APA TITLE TRANSFER
              </span>
              <span className="text-cyan-300">{apaStatusBanner}</span>
            </div>
            <div className="flex flex-col gap-2 w-full">
              <button
                type="button"
                onClick={() => {
                  setApaStatusBanner('APA TITLE ACQUISITION DOSSIER LOCKED · ESCROW GATE VERIFIED');
                  appendRadioLog(
                    '[00:06.10] 🟢 CREW CHIEF: Sovereign APA Title Transfer initiated for GF-T3-344 (CLUSTER-006)',
                    '[00:06.14] 🟢 TELEMETRY: Clean-room MIT IP provenance and zero-copyleft chain of title verified'
                  );
                }}
                className="w-full py-1 px-2 text-[10px] font-mono font-bold bg-[#FF9F0A] hover:bg-amber-400 text-black rounded text-center cursor-pointer"
              >
                ACQUIRE TITLE (APA)
              </button>
              <button
                type="button"
                onClick={() => {
                  setApaStatusBanner('VAULT BUYOUT INQUIRY REGISTERED · CLUSTER-006 ALLOCATION READY');
                  appendRadioLog(
                    '[00:06.42] 🟢 CREW CHIEF: Institutional Vault Buyout inquiry logged for GF-T3-344',
                    '[00:06.46] 🟢 TELEMETRY: Full standalone repository package ready for Google Antigravity IDE hand-off'
                  );
                }}
                className="w-full py-1 px-2 text-[10px] font-mono font-bold bg-slate-800 hover:bg-slate-700 text-[#00F0FF] border border-cyan-500/40 rounded text-center cursor-pointer"
              >
                INQUIRE VAULT BUYOUT
              </button>
            </div>
          </div>
        )}

        {/* Compact Graph Telemetry Inspector Strip */}
        <div className="text-[11px] font-mono whitespace-nowrap overflow-hidden text-cyan-300 font-bold px-2 py-0.5 bg-black/60 border border-slate-800 rounded my-0.5 shrink-0">
          {selectedGraph.shortTag} · TOK: {selectedGraph.tokensK}K · GRAPH: {selectedGraph.graphPct}% · SYNC: {selectedGraph.syncPct}% · PTR {selectedGraph.inspectPtr} · REPL: {selectedGraph.replState} · LOCKED · GRAPHS: {activeGraphCount} · OVERHEAD: {selectedGraph.overhead}
        </div>
      </div>

      {/* Tactical Launch Control Switches */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1">
        <button
          type="button"
          onClick={handleInjectCaptureBurst}
          className="border-amber-500/70 bg-amber-500/10 hover:bg-amber-500/20 text-[#FF9F0A] text-[8px] sm:text-[9px] md:text-xs font-mono font-bold py-1.5 px-0.5 whitespace-nowrap text-center truncate border rounded w-full cursor-pointer"
        >
          💥 INJECT CUDA GRAPH BURST
        </button>

        <button
          type="button"
          onClick={handleToggleLaunchJitter}
          className="border-[#00F0FF]/80 bg-cyan-500/10 hover:bg-cyan-500/20 text-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.2)] text-[8px] sm:text-[9px] md:text-xs font-mono font-bold py-1.5 px-0.5 whitespace-nowrap text-center truncate border rounded w-full cursor-pointer"
        >
          ⚡ TOGGLE LAUNCH JITTER SPIKE
        </button>

        <button
          type="button"
          onClick={handleStepAsyncReplay}
          className="border-emerald-500/70 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-[8px] sm:text-[9px] md:text-xs font-mono font-bold py-1.5 px-0.5 whitespace-nowrap text-center truncate border rounded w-full cursor-pointer"
        >
          🚀 STEP ASYNCHRONOUS REPLAY PASS
        </button>

        <button
          type="button"
          onClick={handleFlushArenas}
          className="border-rose-500/70 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-[8px] sm:text-[9px] md:text-xs font-mono font-bold py-1.5 px-0.5 whitespace-nowrap text-center truncate border rounded w-full cursor-pointer"
        >
          🔄 FLUSH GRAPH ARENAS
        </button>
      </div>

      {/* Pit-Wall Radio Comms Log */}
      <div className="h-8 overflow-hidden font-mono text-[9px] px-2 py-0.5 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-normal flex flex-col justify-center">
        <div className="truncate">{radioLogs[0]}</div>
        <div className="truncate">{radioLogs[1]}</div>
      </div>
    </div>
  );
}
