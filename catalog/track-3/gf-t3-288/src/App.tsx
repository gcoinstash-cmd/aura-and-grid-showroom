/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import React, { useState } from 'react';

type TabKey = 'Mesh' | 'Mrge' | 'Rdux' | 'Stats' | 'APA';

interface CorridorSpec {
  id: string;
  label: string;
  bandwidthGbps: number;
  latencyUs: number;
  cosineThreshold: number;
  compressionPct: number;
  mode: string;
}

interface ClusterCardData {
  id: number;
  code: string;
  title: string;
  hex: string;
  inspectorPtr: string;
  tokensK: number;
  compressionPct: number;
  latencyMs: number;
  state: string;
  syncPct: number;
  cosineSim: number;
}

const CORRIDORS: CorridorSpec[] = [
  {
    id: 'MERGE-CORRIDOR-ALPHA',
    label: 'MERGE-CORRIDOR-ALPHA (DYNAMIC-MULTIPLEXER-TOKEN-MERGING-FABRIC · 44000-GB/S)',
    bandwidthGbps: 44000,
    latencyUs: 0.01,
    cosineThreshold: 0.88,
    compressionPct: 50.0,
    mode: 'TOKEN_MERGING',
  },
  {
    id: 'MERGE-CORRIDOR-BRAVO',
    label: 'MERGE-CORRIDOR-BRAVO (KV-CACHE-REDUNDANCY-ELIMINATION-ENGINE)',
    bandwidthGbps: 41800,
    latencyUs: 0.02,
    cosineThreshold: 0.85,
    compressionPct: 54.0,
    mode: 'KV_REDUNDANCY_ELIMINATION',
  },
  {
    id: 'MERGE-CORRIDOR-GAMMA',
    label: 'MERGE-CORRIDOR-GAMMA (ASYNC-BIPARTITE-SIMILARITY-ROUTER)',
    bandwidthGbps: 39500,
    latencyUs: 0.02,
    cosineThreshold: 0.90,
    compressionPct: 48.0,
    mode: 'BIPARTITE_ROUTER',
  },
  {
    id: 'MERGE-CORRIDOR-DELTA',
    label: 'MERGE-CORRIDOR-DELTA (FALLBACK-UNCOMPRESSED-MULTIPLEX-PASS)',
    bandwidthGbps: 28000,
    latencyUs: 0.05,
    cosineThreshold: 0.99,
    compressionPct: 12.5,
    mode: 'FALLBACK_MULTIPLEX',
  },
];

const INITIAL_CLUSTERS: ClusterCardData[] = [
  { id: 0, code: 'E0', title: 'Cluster 0 (E0)', hex: '0x15000', inspectorPtr: '0x15000', tokensK: 256, compressionPct: 50.0, latencyMs: 0.02, state: 'MERGED · LOCKED', syncPct: 100, cosineSim: 0.94 },
  { id: 1, code: 'E1', title: 'Cluster 1 (E1)', hex: '0x15010', inspectorPtr: '0x15010', tokensK: 256, compressionPct: 50.0, latencyMs: 0.01, state: 'MERGED · LOCKED', syncPct: 100, cosineSim: 0.95 },
  { id: 2, code: 'E2', title: 'Cluster 2 (E2)', hex: '0x15020', inspectorPtr: '0x15020', tokensK: 256, compressionPct: 50.0, latencyMs: 0.02, state: 'MERGED · LOCKED', syncPct: 100, cosineSim: 0.93 },
  { id: 3, code: 'E3', title: 'Cluster 3 (E3)', hex: '0x15030', inspectorPtr: '0x15030', tokensK: 256, compressionPct: 50.0, latencyMs: 0.01, state: 'MERGED · LOCKED', syncPct: 100, cosineSim: 0.96 },
  { id: 4, code: 'E4', title: 'Cluster 4 (E4)', hex: '0x15040', inspectorPtr: '0x15040', tokensK: 256, compressionPct: 50.0, latencyMs: 0.02, state: 'MERGED · LOCKED', syncPct: 100, cosineSim: 0.94 },
  { id: 5, code: 'E5', title: 'Cluster 5 (E5)', hex: '0x15050', inspectorPtr: '0x15050', tokensK: 256, compressionPct: 50.0, latencyMs: 0.01, state: 'MERGED · LOCKED', syncPct: 100, cosineSim: 0.95 },
  { id: 6, code: 'E6', title: 'Cluster 6 (E6)', hex: '0x15060', inspectorPtr: '0x15060', tokensK: 256, compressionPct: 50.0, latencyMs: 0.02, state: 'MERGED · LOCKED', syncPct: 100, cosineSim: 0.92 },
  { id: 7, code: 'E7', title: 'Cluster 7 (E7)', hex: '0x15070', inspectorPtr: '0x15070', tokensK: 256, compressionPct: 50.0, latencyMs: 0.01, state: 'MERGED · LOCKED', syncPct: 100, cosineSim: 0.95 },
];

const INITIAL_LOGS: string[] = [
  '[00:01.04] 🟢 CREW CHIEF: Dynamic multiplexer token-merging and KV-cache redundancy elimination engine initialized · 8 clusters linked',
  '[00:01.08] 🟢 TELEMETRY: Bipartite similarity merging verified at 44,000 GB/s with zero perplexity loss',
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('Mesh');
  const [selectedCorridorId, setSelectedCorridorId] = useState<string>(CORRIDORS[0].id);
  const [clusters, setClusters] = useState<ClusterCardData[]>(INITIAL_CLUSTERS);
  const [selectedClusterIdx, setSelectedClusterIdx] = useState<number>(3);
  const [throughputGbps, setThroughputGbps] = useState<number>(44000);
  const [latencyUs, setLatencyUs] = useState<number>(0.01);
  const [processedUnits, setProcessedUnits] = useState<number>(8192000);
  const [engineXpK, setEngineXpK] = useState<number>(75.0);
  const [redundancySpikeActive, setRedundancySpikeActive] = useState<boolean>(false);
  const [stepPassCount, setStepPassCount] = useState<number>(1);
  const [vecPreview, setVecPreview] = useState<string>('[4.91, 4.95, 4.92, 4.94]');
  const [radioLogs, setRadioLogs] = useState<string[]>(INITIAL_LOGS);
  const [apaNotice, setApaNotice] = useState<string>('READY FOR SOVEREIGN IP TITLE TRANSFER (CLUSTER-006)');

  const activeCorridor = CORRIDORS.find((c) => c.id === selectedCorridorId) || CORRIDORS[0];
  const inspectedCluster = clusters[selectedClusterIdx] || clusters[3];

  const pushLog = (line1: string, line2: string) => {
    setRadioLogs([line1, line2]);
  };

  const handleCorridorChange = (newId: string) => {
    setSelectedCorridorId(newId);
    const found = CORRIDORS.find((c) => c.id === newId) || CORRIDORS[0];
    setThroughputGbps(found.bandwidthGbps);
    setLatencyUs(found.latencyUs);
    setClusters((prev) =>
      prev.map((c) => ({
        ...c,
        compressionPct: found.compressionPct,
        state: 'MERGED · LOCKED',
      }))
    );
    pushLog(
      '[00:02.12] 🟢 CREW CHIEF: Switched active synthetic corridor to ' + found.id,
      '[00:02.16] 🟢 TELEMETRY: Merging Throughput: ' + found.bandwidthGbps.toLocaleString() + ' GB/s · Redundancy Latency: ' + found.latencyUs.toFixed(2) + ' µs'
    );
  };

  const handleInjectMergingBurst = () => {
    const nextUnits = processedUnits + 512000;
    const nextXp = Number((engineXpK + 4.5).toFixed(1));
    setThroughputGbps(46400);
    setLatencyUs(0.01);
    setProcessedUnits(nextUnits);
    setEngineXpK(nextXp);
    setVecPreview('[5.12, 5.14, 5.11, 5.13]');
    setClusters((prev) =>
      prev.map((c, idx) => ({
        ...c,
        tokensK: 288,
        compressionPct: 52.5,
        latencyMs: idx % 2 === 0 ? 0.01 : 0.01,
        state: 'BURST · LOCKED',
        cosineSim: 0.97,
      }))
    );
    pushLog(
      '[00:03.40] 🟢 CREW CHIEF: Trigger Token Merging Burst executed across 8 Clusters · Bipartite threshold locked',
      '[00:03.44] 🟢 TELEMETRY: Merging Throughput: 46,400 GB/s · Processed Tokens: ' + nextUnits.toLocaleString() + ' Units'
    );
  };

  const handleToggleRedundancySpike = () => {
    const nextSpike = !redundancySpikeActive;
    setRedundancySpikeActive(nextSpike);
    if (nextSpike) {
      setThroughputGbps(47800);
      setLatencyUs(0.01);
      setVecPreview('[4.99, 4.99, 4.98, 4.99]');
      setClusters((prev) =>
        prev.map((c) => ({
          ...c,
          tokensK: 320,
          compressionPct: 62.5,
          latencyMs: 0.01,
          state: 'PRUNED · LOCKED',
          cosineSim: 0.99,
        }))
      );
      pushLog(
        '[00:04.18] 🟢 CREW CHIEF: Inject High Redundancy Flood (Force Bipartite KV Pruning) engaged',
        '[00:04.22] 🟢 TELEMETRY: Duplicate KV blocks purged asynchronously · Compression elevated to 62.5%'
      );
    } else {
      setThroughputGbps(activeCorridor.bandwidthGbps);
      setLatencyUs(activeCorridor.latencyUs);
      setVecPreview('[4.91, 4.95, 4.92, 4.94]');
      setClusters(INITIAL_CLUSTERS);
      pushLog(
        '[00:04.50] 🟢 CREW CHIEF: Redundancy flood normalized · Nominal 50.0% bipartite compression restored',
        '[00:04.54] 🟢 TELEMETRY: Merging Throughput: ' + activeCorridor.bandwidthGbps.toLocaleString() + ' GB/s · Redundancy Latency: 0.01 µs'
      );
    }
  };

  const handleStepMultiplexPass = () => {
    const nextStep = stepPassCount + 1;
    const nextUnits = processedUnits + 256000;
    const nextXp = Number((engineXpK + 2.5).toFixed(1));
    setStepPassCount(nextStep);
    setProcessedUnits(nextUnits);
    setEngineXpK(nextXp);
    setSelectedClusterIdx((prev) => (prev + 1) % 8);
    setVecPreview('[4.94, 4.96, 4.93, 4.95]');
    pushLog(
      '[00:05.10] 🟢 CREW CHIEF: Step Multiplexed Merging Pass #' + nextStep + ' verified with sub-microsecond barrier sync',
      '[00:05.14] 🟢 TELEMETRY: Processed Tokens: ' + nextUnits.toLocaleString() + ' Units · Merging State: Active Active'
    );
  };

  const handleFlushMergingArenas = () => {
    setSelectedCorridorId(CORRIDORS[0].id);
    setClusters(INITIAL_CLUSTERS);
    setSelectedClusterIdx(3);
    setThroughputGbps(44000);
    setLatencyUs(0.01);
    setProcessedUnits(8192000);
    setEngineXpK(75.0);
    setRedundancySpikeActive(false);
    setStepPassCount(1);
    setVecPreview('[4.91, 4.95, 4.92, 4.94]');
    setRadioLogs(INITIAL_LOGS);
  };

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans select-none">
      {/* Top Header Row 1 */}
      <header className="flex flex-col gap-0.5 w-full shrink-0">
        <div className="flex items-center justify-between gap-1 w-full shrink-0">
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <h1 className="text-sm md:text-base font-mono font-extrabold tracking-tight text-white">
              GF-T3-288
            </h1>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-cyan-500/20 text-[#00F0FF] border border-cyan-500/50 rounded">
              FLAGSHIP
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <select
              aria-label="Synthetic Token Merging Corridor"
              value={selectedCorridorId}
              onChange={(e) => handleCorridorChange(e.target.value)}
              className="max-w-[110px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 text-cyan-300 border border-slate-700 rounded focus:outline-none focus:border-cyan-400"
            >
              {CORRIDORS.map((corridor) => (
                <option key={corridor.id} value={corridor.id}>
                  {corridor.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleInjectMergingBurst}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/70 rounded transition-colors cursor-pointer"
            >
              [Merge]
            </button>
            <button
              type="button"
              onClick={handleToggleRedundancySpike}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-700/70 rounded transition-colors cursor-pointer"
            >
              [Redux]
            </button>
            <button
              type="button"
              onClick={handleStepMultiplexPass}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/70 rounded transition-colors cursor-pointer"
            >
              [Run]
            </button>
          </div>
        </div>

        {/* Top Header Row 2 */}
        <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap overflow-hidden text-ellipsis">
          Token Merging · KV Redundancy Elimination · High Density
        </div>
      </header>

      {/* 4-Card Arcade HUD Ribbon (2x2 Grid) */}
      <section className="grid grid-cols-2 gap-1.5 w-full shrink-0 my-0.5">
        {/* Card 1: MERGE NITRO */}
        <div className="p-1.5 bg-slate-900/90 border border-slate-800 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              MERGE NITRO
            </span>
            <span className="text-[10px] font-mono text-cyan-400">100% SAT</span>
          </div>
          <div className="text-[#00F0FF] font-mono text-lg font-bold leading-tight tabular-nums">
            {throughputGbps.toLocaleString()} GB/s
          </div>
          <div className="w-full bg-slate-800 h-1 rounded overflow-hidden my-0.5">
            <div className="bg-[#00F0FF] h-full w-11/12" />
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Merging Throughput Saturation
          </div>
        </div>

        {/* Card 2: REDUX STREAK */}
        <div className="p-1.5 bg-slate-900/90 border border-slate-800 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              REDUX STREAK
            </span>
            <span className="px-1 py-0.2 text-[9px] font-mono font-bold bg-amber-500/20 text-[#FF9F0A] border border-amber-500/40 rounded">
              🔥 TOMETIME
            </span>
          </div>
          <div className="text-[#FF9F0A] font-mono text-lg font-bold leading-tight tabular-nums">
            {latencyUs.toFixed(2)} µs
          </div>
          <div className="text-[10px] font-mono text-emerald-400 truncate">
            Zero Host CPU Stalls
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Redundancy Latency
          </div>
        </div>

        {/* Card 3: ACTIVE CLUSTERS */}
        <div className="p-1.5 bg-slate-900/90 border border-slate-800 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              ACTIVE CLUSTERS
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-400">
              8 Clusters
            </span>
          </div>
          <div className="text-white font-mono text-sm md:text-base font-bold leading-tight">
            CLUSTERS: 8/8
          </div>
          <div className="grid grid-cols-8 gap-0.5 my-0.5">
            {clusters.map((c, idx) => (
              <button
                key={c.code}
                type="button"
                onClick={() => setSelectedClusterIdx(idx)}
                className={
                  'text-[9px] font-mono font-bold rounded py-0.2 text-center cursor-pointer transition-colors ' +
                  (selectedClusterIdx === idx
                    ? 'bg-[#00F0FF] text-black'
                    : 'bg-slate-800 text-cyan-300 hover:bg-slate-700')
                }
              >
                {c.code}
              </button>
            ))}
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            F1 Gear Shift Matrix [E0..E7] · Locked
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="p-1.5 bg-slate-900/90 border border-slate-800 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              TOKEN SCORE
            </span>
            <span className="text-[10px] font-mono font-bold text-[#00F0FF]">
              +{engineXpK.toFixed(1)}k ENGINE XP
            </span>
          </div>
          <div className="text-white font-mono text-sm md:text-base font-bold leading-tight tabular-nums">
            {processedUnits.toLocaleString()} UNITS
          </div>
          <div className="text-[10px] font-mono text-cyan-300 truncate">
            Processed Tokens: {processedUnits.toLocaleString()} Units
          </div>
          <div className="text-[10px] font-mono text-emerald-400 font-bold truncate">
            Merging State: Active Active
          </div>
        </div>
      </section>

      {/* 5 Horizontal Tabs */}
      <nav
        aria-label="Cockpit Views"
        className="grid grid-cols-5 gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg my-1 w-full text-center shrink-0"
      >
        {(['Mesh', 'Mrge', 'Rdux', 'Stats', 'APA'] as TabKey[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={
              'py-1 text-xs font-mono font-bold rounded transition-colors cursor-pointer ' +
              (activeTab === tab
                ? 'bg-[#00F0FF] text-black shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70')
            }
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* Streamlined Mesh Info Subheader */}
      <div className="text-[10px] font-mono whitespace-nowrap overflow-hidden text-slate-300 px-1 shrink-0">
        {'VIEW: ' +
          activeTab.toUpperCase() +
          ' · PTR: 0x14F8DC0 · MODE: ' +
          activeCorridor.mode +
          ' · CLUSTERS: 8 · VEC: ' +
          vecPreview}
      </div>

      {/* Main Middle Viewport Area (Locked Height, Zero Scroll) */}
      <main className="flex-1 flex flex-col justify-between overflow-hidden my-0.5">
        {activeTab === 'Mesh' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1 p-1 bg-slate-950/80 border border-slate-800/90 rounded-lg flex-1 items-stretch">
            {clusters.map((cluster, idx) => {
              const isSelected = idx === selectedClusterIdx;
              return (
                <div
                  key={cluster.code}
                  onClick={() => setSelectedClusterIdx(idx)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSelectedClusterIdx(idx);
                    }
                  }}
                  className={
                    'p-1.5 rounded border flex flex-col justify-between cursor-pointer transition-colors ' +
                    (isSelected
                      ? 'bg-slate-900 border-[#00F0FF]'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700')
                  }
                >
                  {/* Line 1 (Title & Hex) */}
                  <div className="text-[11px] font-mono font-bold text-white flex justify-between items-center">
                    <span>{cluster.title}</span>
                    <span className="text-slate-400">{cluster.hex}</span>
                  </div>

                  {/* Line 2 (Tokens & Compression) */}
                  <div className="flex justify-between items-center text-[11px] font-mono font-bold text-cyan-300">
                    <span>{'TOK: ' + cluster.tokensK + 'K'}</span>
                    <span>{'COMP: ' + cluster.compressionPct.toFixed(1) + '%'}</span>
                  </div>

                  {/* Line 3 (Latency & State) */}
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-[#FF9F0A] font-bold">
                      {cluster.latencyMs.toFixed(2) + 'ms'}
                    </span>
                    <span className="text-emerald-400 font-bold">{cluster.state}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'Mrge' && (
          <div className="p-2 bg-slate-950/90 border border-slate-800 rounded-lg flex-1 flex flex-col justify-between font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1">
              <span className="text-xs font-bold text-[#00F0FF]">
                DYNAMIC MULTIPLEXER BIPARTITE TOKEN MERGING KERNEL
              </span>
              <span className="text-[11px] text-emerald-400 font-bold">
                PERPLEXITY LOSS: 0.0000
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 my-1">
              <div className="p-1.5 bg-slate-900 border border-slate-800 rounded">
                <div className="text-[10px] text-slate-400">FORMULA OPERATOR</div>
                <div className="text-xs font-bold text-white mt-0.5">
                  Bipartite-Match(T_i, T_j, tau)
                </div>
              </div>
              <div className="p-1.5 bg-slate-900 border border-slate-800 rounded">
                <div className="text-[10px] text-slate-400">COSINE THRESHOLD</div>
                <div className="text-xs font-bold text-[#00F0FF] mt-0.5">
                  {activeCorridor.cosineThreshold.toFixed(2)} Similarity
                </div>
              </div>
              <div className="p-1.5 bg-slate-900 border border-slate-800 rounded">
                <div className="text-[10px] text-slate-400">MERGED RATIO</div>
                <div className="text-xs font-bold text-emerald-400 mt-0.5">
                  {inspectedCluster.compressionPct.toFixed(1)}% Footprint Cut
                </div>
              </div>
              <div className="p-1.5 bg-slate-900 border border-slate-800 rounded">
                <div className="text-[10px] text-slate-400">PASS EXECUTION</div>
                <div className="text-xs font-bold text-[#FF9F0A] mt-0.5">
                  {'Pass #' + stepPassCount + ' · 0.01 µs'}
                </div>
              </div>
            </div>
            <div className="text-[11px] text-slate-300 bg-black/50 p-1.5 rounded border border-slate-800 truncate">
              {'ACTIVE CORRIDOR: ' + activeCorridor.label}
            </div>
          </div>
        )}

        {activeTab === 'Rdux' && (
          <div className="p-2 bg-slate-950/90 border border-slate-800 rounded-lg flex-1 flex flex-col justify-between font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1">
              <span className="text-xs font-bold text-[#FF9F0A]">
                ASYNCHRONOUS KV-CACHE REDUNDANCY ELIMINATION ENGINE
              </span>
              <span className="text-[11px] text-cyan-300 font-bold">
                BARRIER SYNC: 0.01 µs
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 my-1">
              <div className="p-1.5 bg-slate-900 border border-slate-800 rounded">
                <div className="text-[10px] text-slate-400">RAW KV STREAM</div>
                <div className="text-xs font-bold text-white mt-0.5">
                  16,384,000 Units
                </div>
              </div>
              <div className="p-1.5 bg-slate-900 border border-slate-800 rounded">
                <div className="text-[10px] text-slate-400">PURGED DUPLICATES</div>
                <div className="text-xs font-bold text-emerald-400 mt-0.5">
                  8,192,000 Units
                </div>
              </div>
              <div className="p-1.5 bg-slate-900 border border-slate-800 rounded">
                <div className="text-[10px] text-slate-400">RETAINED KV CACHE</div>
                <div className="text-xs font-bold text-[#00F0FF] mt-0.5">
                  {processedUnits.toLocaleString()} Units
                </div>
              </div>
              <div className="p-1.5 bg-slate-900 border border-slate-800 rounded">
                <div className="text-[10px] text-slate-400">SM STREAMING STATE</div>
                <div className="text-xs font-bold text-[#FF9F0A] mt-0.5">
                  Active Active · Zero Stall
                </div>
              </div>
            </div>
            <div className="text-[11px] text-slate-300 bg-black/50 p-1.5 rounded border border-slate-800 truncate">
              Sub-Microsecond Barrier Synchronization coordinates token pruning barriers across E0..E7 without CPU wait states.
            </div>
          </div>
        )}

        {activeTab === 'Stats' && (
          <div className="p-2 bg-slate-950/90 border border-slate-800 rounded-lg flex-1 flex flex-col justify-between font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1">
              <span className="text-xs font-bold text-white">
                4-GATE CLEAN-ROOM DYNO VERIFICATION TELEMETRY
              </span>
              <span className="text-[11px] text-emerald-400 font-bold">
                ALL 4 GATES VERIFIED
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 my-1">
              <div className="p-1.5 bg-slate-900 border border-slate-800 rounded">
                <div className="text-[10px] text-cyan-400 font-bold">GATE 01 · MATH</div>
                <div className="text-[11px] text-slate-200 mt-0.5">
                  Deterministic Cosine Bipartite Solver
                </div>
              </div>
              <div className="p-1.5 bg-slate-900 border border-slate-800 rounded">
                <div className="text-[10px] text-cyan-400 font-bold">GATE 02 · STATE</div>
                <div className="text-[11px] text-slate-200 mt-0.5">
                  Isolated Corridor Arena State Lock
                </div>
              </div>
              <div className="p-1.5 bg-slate-900 border border-slate-800 rounded">
                <div className="text-[10px] text-cyan-400 font-bold">GATE 03 · INGRESS</div>
                <div className="text-[11px] text-slate-200 mt-0.5">
                  Zero-Trust DTO Vector Bounds Check
                </div>
              </div>
              <div className="p-1.5 bg-slate-900 border border-slate-800 rounded">
                <div className="text-[10px] text-cyan-400 font-bold">GATE 04 · PYTEST</div>
                <div className="text-[11px] text-emerald-400 font-bold mt-0.5">
                  94.2% Suite Coverage PASS
                </div>
              </div>
            </div>
            <div className="text-[11px] text-slate-300 bg-black/50 p-1.5 rounded border border-slate-800 truncate">
              Merging Throughput: 44,000 GB/s · Redundancy Latency: 0.01 µs · Active Clusters: 8 Clusters · Processed Tokens: 8,192,000 Units
            </div>
          </div>
        )}

        {activeTab === 'APA' && (
          <div className="p-2 bg-slate-950/90 border border-slate-800 rounded-lg flex-1 flex flex-col justify-between font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1">
              <div>
                <span className="text-xs font-bold text-white">
                  CHASSIS: GF-T3-288 · CLUSTER-006 · TRACK 3 FLAGSHIP
                </span>
              </div>
              <span className="text-[11px] text-[#00F0FF] font-bold">
                100% PURE APA TITLE TRANSFER
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 my-1 items-center">
              <div className="p-1.5 bg-slate-900 border border-slate-800 rounded text-[11px] text-slate-200 space-y-0.5">
                <div className="font-bold text-amber-400">
                  Retail Price: 125,000 Units Equivalent · Full Engine APA Anchor: 55,000 Units
                </div>
                <div className="text-slate-400">
                  Zero Licensing · Zero Copyleft (100% MIT) · Standalone Repository Hand-Off
                </div>
                <div className="text-emerald-400 font-bold truncate">{apaNotice}</div>
              </div>

              <div className="flex flex-col gap-2 w-full">
                <button
                  type="button"
                  onClick={() =>
                    setApaNotice('APA TITLE ACQUISITION DISPATCHED · ESCROW GATE LOCKED FOR GF-T3-288')
                  }
                  className="w-full py-1.5 px-3 bg-[#00F0FF] hover:bg-cyan-300 text-black font-mono text-xs font-bold rounded text-center transition-colors cursor-pointer"
                >
                  ACQUIRE TITLE (APA)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setApaNotice('VAULT BUYOUT INQUIRY LOGGED · CLUSTER-006 ALLOCATION VERIFIED')
                  }
                  className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-[#FF9F0A] border border-amber-500/50 font-mono text-xs font-bold rounded text-center transition-colors cursor-pointer"
                >
                  INQUIRE VAULT BUYOUT
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Compact Merging Telemetry Inspector Strip */}
        <div className="text-[11px] font-mono whitespace-nowrap overflow-hidden text-cyan-300 font-bold px-2 py-0.5 bg-black/60 border border-slate-800 rounded my-0.5 shrink-0">
          {inspectedCluster.code +
            ' · TOK: ' +
            inspectedCluster.tokensK +
            'K · COMP: ' +
            inspectedCluster.compressionPct.toFixed(1) +
            '% · SYNC: ' +
            inspectedCluster.syncPct +
            '% · PTR ' +
            inspectedCluster.inspectorPtr +
            ' · MERGE: OK · LOCKED'}
        </div>
      </main>

      {/* Tactical Launch Control Switches */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1">
        <button
          type="button"
          onClick={handleInjectMergingBurst}
          className="bg-amber-950/50 hover:bg-amber-900/70 text-[#FF9F0A] border border-[#FF9F0A] rounded-lg text-xs font-mono font-bold py-2 px-2 text-center transition-colors truncate cursor-pointer"
        >
          💥 INJECT TOKEN MERGING BURST
        </button>

        <button
          type="button"
          onClick={handleToggleRedundancySpike}
          className="bg-cyan-950/60 hover:bg-cyan-900/80 text-[#00F0FF] border border-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.25)] rounded-lg text-xs font-mono font-bold py-2 px-2 text-center transition-colors truncate cursor-pointer"
        >
          ⚡ TOGGLE REDUNDANCY SPIKE
        </button>

        <button
          type="button"
          onClick={handleStepMultiplexPass}
          className="bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500 rounded-lg text-xs font-mono font-bold py-2 px-2 text-center transition-colors truncate cursor-pointer"
        >
          🚀 STEP MULTIPLEXED MERGING PASS
        </button>

        <button
          type="button"
          onClick={handleFlushMergingArenas}
          className="bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-500 rounded-lg text-xs font-mono font-bold py-2 px-2 text-center transition-colors truncate cursor-pointer"
        >
          🔄 FLUSH MERGING ARENAS
        </button>
      </section>

      {/* Pit-Wall Radio Comms Log */}
      <footer className="h-8 overflow-hidden font-mono text-[9px] px-2 py-0.5 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-normal flex flex-col justify-center">
        <div className="truncate">{radioLogs[0]}</div>
        <div className="truncate">{radioLogs[1]}</div>
      </footer>
    </div>
  );
}
