/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

type TabKey = 'Mesh' | 'Clus' | 'Vault' | 'Stats' | 'APA';

interface NodeTelemetry {
  id: number;
  tag: string;
  hex: string;
  tokensK: number;
  loadPct: number;
  syncPct: number;
  latencyMs: string;
  stateLabel: string;
}

const SYNTHETIC_CORRIDORS: string[] = [
  'CLU-CORRIDOR-ALPHA (DYNAMIC-CLUSTER-ORCHESTRATION-FABRIC · 58800-GB/S)',
  'CLU-CORRIDOR-BRAVO (SOVEREIGN-APA-VAULT-GATEWAY)',
  'CLU-CORRIDOR-GAMMA (NON-BLOCKING-INFINIBAND-ROUTER)',
  'CLU-CORRIDOR-DELTA (FALLBACK-SINGLE-NODE-SERIAL-PASS)',
];

const INITIAL_NODES: NodeTelemetry[] = [
  { id: 0, tag: 'C0', hex: '0x28000', tokensK: 256, loadPct: 100, syncPct: 100, latencyMs: '0.02ms', stateLabel: 'FEDERATED · LOCKED' },
  { id: 1, tag: 'C1', hex: '0x28010', tokensK: 256, loadPct: 100, syncPct: 100, latencyMs: '0.02ms', stateLabel: 'FEDERATED · LOCKED' },
  { id: 2, tag: 'C2', hex: '0x28020', tokensK: 256, loadPct: 100, syncPct: 100, latencyMs: '0.02ms', stateLabel: 'FEDERATED · LOCKED' },
  { id: 3, tag: 'C3', hex: '0x28030', tokensK: 256, loadPct: 100, syncPct: 100, latencyMs: '0.02ms', stateLabel: 'FEDERATED · LOCKED' },
  { id: 4, tag: 'C4', hex: '0x28040', tokensK: 256, loadPct: 100, syncPct: 100, latencyMs: '0.02ms', stateLabel: 'FEDERATED · LOCKED' },
  { id: 5, tag: 'C5', hex: '0x28050', tokensK: 256, loadPct: 100, syncPct: 100, latencyMs: '0.02ms', stateLabel: 'FEDERATED · LOCKED' },
  { id: 6, tag: 'C6', hex: '0x28060', tokensK: 256, loadPct: 100, syncPct: 100, latencyMs: '0.02ms', stateLabel: 'FEDERATED · LOCKED' },
  { id: 7, tag: 'C7', hex: '0x28070', tokensK: 256, loadPct: 100, syncPct: 100, latencyMs: '0.02ms', stateLabel: 'FEDERATED · LOCKED' },
];

const INITIAL_RADIO_LOG: string[] = [
  '[00:01.04] 🟢 CREW CHIEF: Asynchronous Cluster-006 master orchestration and sovereign APA vault gateway initialized · 300 nodes federated',
  '[00:01.08] 🟢 TELEMETRY: InfiniBand fleet synchronization verified at 58,800 GB/s with zero licensing overhead',
];

export default function App() {
  const [corridor, setCorridor] = useState<string>(SYNTHETIC_CORRIDORS[0]);
  const [activeTab, setActiveTab] = useState<TabKey>('Mesh');
  const [selectedNodeIdx, setSelectedNodeIdx] = useState<number>(3);
  const [throughputGbs, setThroughputGbs] = useState<number>(58800);
  const [latencyUs, setLatencyUs] = useState<string>('0.01');
  const [activeNodesCount, setActiveNodesCount] = useState<number>(300);
  const [processedTokens, setProcessedTokens] = useState<number>(9856000);
  const [xpBonus, setXpBonus] = useState<string>('+150.0k CAPSTONE XP');
  const [clusterState, setClusterState] = useState<string>('Federation Active');
  const [syncVector, setSyncVector] = useState<string>('[6.21, 6.25, 6.22, 6.24]');
  const [failoverActive, setFailoverActive] = useState<boolean>(false);
  const [nodes, setNodes] = useState<NodeTelemetry[]>(INITIAL_NODES);
  const [radioLogs, setRadioLogs] = useState<string[]>(INITIAL_RADIO_LOG);
  const [apaReceipt, setApaReceipt] = useState<string>('SOVEREIGN APA VAULT SEALED · 100% IP TITLE READY');
  const [stepCounter, setStepCounter] = useState<number>(1);

  const selectedNode = nodes[selectedNodeIdx] || INITIAL_NODES[3];

  const handleCorridorChange = (nextCorridor: string) => {
    setCorridor(nextCorridor);
    if (nextCorridor.indexOf('DELTA') !== -1) {
      setThroughputGbs(14200);
      setLatencyUs('0.18');
      setClusterState('Serial Fallback Active');
      setSyncVector('[5.42, 5.44, 5.41, 5.43]');
      setNodes(
        nodes.map((n, idx) => ({
          ...n,
          loadPct: idx === 0 ? 100 : 68,
          latencyMs: '0.14ms',
          stateLabel: 'SERIAL · PASS',
        }))
      );
      setRadioLogs([
        '[00:02.12] 🟠 CREW CHIEF: Switched corridor to CLU-CORRIDOR-DELTA fallback single-node serial pass',
        '[00:02.16] 🟢 TELEMETRY: Cluster Throughput: 14,200 GB/s · Orchestration Latency: 0.18 µs · Zero licensing overhead',
      ]);
    } else if (nextCorridor.indexOf('BRAVO') !== -1) {
      setThroughputGbs(56400);
      setLatencyUs('0.01');
      setClusterState('Federation Active');
      setSyncVector('[6.19, 6.23, 6.20, 6.22]');
      setNodes(
        nodes.map((n) => ({
          ...n,
          loadPct: 100,
          latencyMs: '0.02ms',
          stateLabel: 'VAULT · LOCKED',
        }))
      );
      setRadioLogs([
        '[00:02.24] 🟢 CREW CHIEF: Engaged CLU-CORRIDOR-BRAVO Sovereign APA Vault Gateway',
        '[00:02.28] 🟢 TELEMETRY: 100% pure APA title lock verified across 300 nodes at 56,400 GB/s',
      ]);
    } else if (nextCorridor.indexOf('GAMMA') !== -1) {
      setThroughputGbs(57900);
      setLatencyUs('0.01');
      setClusterState('Federation Active');
      setSyncVector('[6.20, 6.24, 6.21, 6.23]');
      setNodes(
        nodes.map((n) => ({
          ...n,
          loadPct: 100,
          latencyMs: '0.02ms',
          stateLabel: 'FEDERATED · LOCKED',
        }))
      );
      setRadioLogs([
        '[00:02.34] 🟢 CREW CHIEF: Routed fabric through CLU-CORRIDOR-GAMMA non-blocking InfiniBand router',
        '[00:02.39] 🟢 TELEMETRY: Sub-microsecond barrier commit confirmed at 57,900 GB/s',
      ]);
    } else {
      setThroughputGbs(58800);
      setLatencyUs('0.01');
      setClusterState('Federation Active');
      setSyncVector('[6.21, 6.25, 6.22, 6.24]');
      setNodes(INITIAL_NODES);
      setRadioLogs(INITIAL_RADIO_LOG);
    }
  };

  const handleTriggerFederationBurst = () => {
    const nextThroughput = throughputGbs + 420;
    const nextTokens = processedTokens + 512000;
    const nextStep = stepCounter + 1;
    setThroughputGbs(nextThroughput);
    setProcessedTokens(nextTokens);
    setStepCounter(nextStep);
    setXpBonus('+175.0k CAPSTONE XP');
    setClusterState('Federation Active');
    setSyncVector('[6.28, 6.31, 6.29, 6.30]');
    setNodes(
      nodes.map((n) => ({
        ...n,
        tokensK: n.tokensK + 64,
        loadPct: 100,
        syncPct: 100,
        latencyMs: '0.01ms',
        stateLabel: 'FEDERATED · LOCKED',
      }))
    );
    setRadioLogs([
      '[00:03.10] 🟢 CREW CHIEF: Triggered Cluster Federation Burst across all 300 Cluster-006 units',
      '[00:03.14] 🟢 TELEMETRY: Cluster Throughput: ' +
        nextThroughput.toLocaleString() +
        ' GB/s · Processed Tokens: ' +
        nextTokens.toLocaleString() +
        ' Units',
    ]);
  };

  const handleToggleFailoverSpike = () => {
    const nextFailover = !failoverActive;
    setFailoverActive(nextFailover);
    if (nextFailover) {
      setThroughputGbs(58450);
      setLatencyUs('0.02');
      setClusterState('Failover Re-Routing Active');
      setSyncVector('[6.14, 6.25, 6.22, 6.24]');
      setNodes(
        nodes.map((n, idx) =>
          idx === 0
            ? {
                ...n,
                loadPct: 94,
                syncPct: 99,
                latencyMs: '0.04ms',
                stateLabel: 'FAILOVER · REROUTED',
              }
            : {
                ...n,
                loadPct: 100,
                syncPct: 100,
                latencyMs: '0.02ms',
                stateLabel: 'DYNAMIC · MESH',
              }
        )
      );
      setRadioLogs([
        '[00:04.02] 🟠 CREW CHIEF: Master Node Failover Spike injected on C0 · Dynamic telemetry re-routing engaged',
        '[00:04.06] 🟢 TELEMETRY: Non-blocking InfiniBand failover absorbed spike in 0.02 µs · 300/300 nodes online',
      ]);
    } else {
      setThroughputGbs(58800);
      setLatencyUs('0.01');
      setClusterState('Federation Active');
      setSyncVector('[6.21, 6.25, 6.22, 6.24]');
      setNodes(
        nodes.map((n) => ({
          ...n,
          loadPct: 100,
          syncPct: 100,
          latencyMs: '0.02ms',
          stateLabel: 'FEDERATED · LOCKED',
        }))
      );
      setRadioLogs([
        '[00:04.45] 🟢 CREW CHIEF: Failover spike cleared · Master barrier locked to nominal C0..C7 symmetry',
        '[00:04.49] 🟢 TELEMETRY: Cluster Throughput restored to 58,800 GB/s at 0.01 µs latency',
      ]);
    }
  };

  const handleStepOrchestrationPass = () => {
    const nextStep = stepCounter + 1;
    const nextTokens = processedTokens + 128000;
    setStepCounter(nextStep);
    setProcessedTokens(nextTokens);
    setSyncVector('[6.23, 6.26, 6.24, 6.25]');
    setNodes(
      nodes.map((n) => ({
        ...n,
        tokensK: n.tokensK + 16,
        loadPct: 100,
        syncPct: 100,
      }))
    );
    setRadioLogs([
      '[00:05.18] 🟢 CREW CHIEF: Executed Step Asynchronous Orchestration Pass #' +
        String(nextStep) +
        ' across C0..C7',
      '[00:05.22] 🟢 TELEMETRY: Sub-microsecond commit barrier verified · Processed Tokens: ' +
        nextTokens.toLocaleString() +
        ' Units',
    ]);
  };

  const handleFlushFleetArenas = () => {
    setCorridor(SYNTHETIC_CORRIDORS[0]);
    setThroughputGbs(58800);
    setLatencyUs('0.01');
    setActiveNodesCount(300);
    setProcessedTokens(9856000);
    setXpBonus('+150.0k CAPSTONE XP');
    setClusterState('Federation Active');
    setSyncVector('[6.21, 6.25, 6.22, 6.24]');
    setFailoverActive(false);
    setSelectedNodeIdx(3);
    setStepCounter(1);
    setNodes(INITIAL_NODES);
    setRadioLogs(INITIAL_RADIO_LOG);
  };

  const saturationPct = Math.min(100, Math.round((throughputGbs / 60000) * 100));

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans select-none">
      {/* Top Header Row 1 */}
      <header className="flex flex-col gap-0.5 shrink-0">
        <div className="flex items-center justify-between gap-1 w-full shrink-0">
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <h1 className="text-base font-mono font-bold tracking-tight text-white">GF-T3-301</h1>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-cyan-500/20 text-[#00F0FF] border border-cyan-500/40 rounded">
              CAPSTONE
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0 overflow-hidden">
            <select
              aria-label="Orchestration Corridor"
              value={corridor}
              onChange={(e) => handleCorridorChange(e.target.value)}
              className="max-w-[120px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 text-cyan-300 border border-slate-700 rounded shrink-0 focus:outline-none focus:border-cyan-400"
            >
              {SYNTHETIC_CORRIDORS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setActiveTab('Clus')}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 rounded cursor-pointer"
            >
              [Clu]
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('Vault')}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 rounded cursor-pointer"
            >
              [Vault]
            </button>
            <button
              type="button"
              onClick={handleStepOrchestrationPass}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 rounded cursor-pointer"
            >
              [Run]
            </button>
          </div>
        </div>

        {/* Top Header Row 2 */}
        <p className="text-xs font-mono text-slate-300 text-center whitespace-nowrap">
          Cluster Orchestration · Sovereign APA Vault · Zero Licensing
        </p>
      </header>

      {/* 4-Card Arcade HUD Ribbon (2x2 Grid) */}
      <section className="grid grid-cols-2 gap-1.5 w-full shrink-0 my-0.5">
        {/* Card 1: CLU NITRO */}
        <div className="p-2 bg-slate-950/90 border border-slate-800 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400">CLU NITRO</span>
            <span className="font-mono text-lg font-bold text-[#00F0FF] tabular-nums">
              {throughputGbs.toLocaleString()} GB/s
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-900 rounded overflow-hidden my-1 border border-slate-800">
            <div
              className="h-full bg-[#00F0FF] transition-opacity duration-150"
              style={{ width: String(saturationPct) + '%' }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Cluster Throughput Saturation
          </div>
        </div>

        {/* Card 2: VAULT STREAK */}
        <div className="p-2 bg-slate-950/90 border border-slate-800 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400">VAULT STREAK</span>
            <span className="font-mono text-lg font-bold text-[#FF9F0A] tabular-nums">
              {latencyUs} µs
            </span>
          </div>
          <div className="flex items-center justify-between my-0.5">
            <span className="text-[10px] font-mono font-bold text-amber-300">🔥 INFINIBAND</span>
            <span className="text-[10px] font-mono text-emerald-400">BARRIER LOCKED</span>
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Orchestration Latency
          </div>
        </div>

        {/* Card 3: ACTIVE NODES */}
        <div className="p-2 bg-slate-950/90 border border-slate-800 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400">ACTIVE NODES</span>
            <span className="font-mono text-sm font-bold text-emerald-400 tabular-nums">
              NODES: {activeNodesCount}/300
            </span>
          </div>
          <div className="grid grid-cols-8 gap-0.5 my-0.5">
            {nodes.map((n, idx) => (
              <button
                key={n.tag}
                type="button"
                onClick={() => setSelectedNodeIdx(idx)}
                className={
                  'text-[9px] font-mono font-bold py-0.5 rounded border text-center cursor-pointer ' +
                  (selectedNodeIdx === idx
                    ? 'bg-cyan-500/30 text-white border-cyan-400'
                    : 'bg-slate-900 text-cyan-300 border-slate-800')
                }
              >
                {n.tag}
              </button>
            ))}
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Active Nodes: 300 Nodes · Gear Shift [C0..C7]
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="p-2 bg-slate-950/90 border border-slate-800 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400">TOKEN SCORE</span>
            <span className="font-mono text-sm font-bold text-white tabular-nums">
              {processedTokens.toLocaleString()} UNITS
            </span>
          </div>
          <div className="flex items-center justify-between my-0.5">
            <span className="text-[10px] font-mono font-bold text-[#00F0FF]">{xpBonus}</span>
            <span className="text-[10px] font-mono text-amber-300">CLUSTER-006</span>
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Cluster State: {clusterState}
          </div>
        </div>
      </section>

      {/* 5 Horizontal Tabs */}
      <nav
        aria-label="Cockpit Views"
        className="grid grid-cols-5 gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg my-1 w-full text-center shrink-0"
      >
        {(['Mesh', 'Clus', 'Vault', 'Stats', 'APA'] as TabKey[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={
              'py-1 text-xs font-mono font-bold rounded transition-colors cursor-pointer whitespace-nowrap ' +
              (activeTab === tab
                ? 'bg-cyan-500/20 text-[#00F0FF] border border-cyan-500/50'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60')
            }
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* Streamlined Mesh Info Subheader (strictly clean of action buttons) */}
      <div className="text-[10px] font-mono whitespace-nowrap overflow-hidden text-slate-300 px-1 shrink-0">
        {'VIEW: ' +
          activeTab.toUpperCase() +
          ' · PTR: 0x22F8DC0 · MODE: CLUSTER_ORCHESTRATION · NODES: 300 · VEC: ' +
          syncVector}
      </div>

      {/* Contextual APA / Vault / Stats Banner when non-Mesh tab is active */}
      {activeTab === 'APA' && (
        <div className="p-1.5 bg-slate-950/95 border border-amber-500/40 rounded-lg shrink-0 my-0.5">
          <div className="flex items-center justify-between text-[10px] font-mono text-amber-300 mb-1">
            <span>SOVEREIGN APA VAULT GATEWAY · CLUSTER-006 · 100% IP TITLE TRANSFER</span>
            <span>{apaReceipt}</span>
          </div>
          <div className="flex flex-col gap-2 w-full">
            <button
              type="button"
              onClick={() => {
                setApaReceipt('TITLE TRANSFER EXECUTED · ZERO LICENSING OVERHEAD');
                setRadioLogs([
                  '[00:06.01] 🟢 CREW CHIEF: Executed Sovereign APA Title Transfer for GF-T3-301',
                  '[00:06.05] 🟢 TELEMETRY: 100% clean-room MIT repository sealed · 0% copyleft · 0% licensing overhead',
                ]);
              }}
              className="w-full py-1 text-[11px] font-mono font-bold bg-amber-500/20 hover:bg-amber-500/30 text-[#FF9F0A] border border-amber-400 rounded text-center cursor-pointer"
            >
              ACQUIRE TITLE (APA)
            </button>
            <button
              type="button"
              onClick={() => {
                setApaReceipt('VAULT BUYOUT DISPATCHED · ESCROW GATE VERIFIED');
                setRadioLogs([
                  '[00:06.12] 🟢 CREW CHIEF: Dispatched CLUSTER-006 Sovereign Vault Buyout dossier',
                  '[00:06.16] 🟢 TELEMETRY: All 4 Clean-Room Dyno Gates verified at 58,800 GB/s',
                ]);
              }}
              className="w-full py-1 text-[11px] font-mono font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-[#00F0FF] border border-cyan-400 rounded text-center cursor-pointer"
            >
              INQUIRE VAULT BUYOUT
            </button>
          </div>
        </div>
      )}

      {activeTab !== 'Mesh' && activeTab !== 'APA' && (
        <div className="px-2 py-1 bg-slate-950/90 border border-slate-800 rounded text-[10px] font-mono text-cyan-300 flex items-center justify-between shrink-0">
          <span>
            {activeTab === 'Clus' &&
              'CLUSTER-006 MASTER FABRIC: 300 Federated Units · Non-Blocking All-Reduce Sync: 100%'}
            {activeTab === 'Vault' &&
              'SOVEREIGN APA VAULT: SHA-256 Title Seal Verified · Permissive MIT Clean-Room · 0% Royalty'}
            {activeTab === 'Stats' &&
              'DYNO GATE METRICS: Gate 01 Math PASS · Gate 02 RLS PASS · Gate 03 Zero-Trust PASS · Gate 04 >85% Pytest PASS'}
          </span>
          <span className="text-emerald-400 font-bold">CORRIDOR LOCKED</span>
        </div>
      )}

      {/* Interactive Node Matrix Bay (C0-C7): 8 cluster node cards in 2-row x 4-column grid */}
      <main className="grid grid-cols-4 gap-1 p-1 bg-slate-950/60 border border-slate-800/90 rounded-lg shrink-0">
        {nodes.map((node, index) => {
          const isSelected = selectedNodeIdx === index;
          return (
            <div
              key={node.tag}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedNodeIdx(index)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setSelectedNodeIdx(index);
                }
              }}
              className={
                'p-1.5 rounded border transition-colors cursor-pointer flex flex-col justify-between gap-0.5 ' +
                (isSelected
                  ? 'bg-slate-900/95 border-[#00F0FF]'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700')
              }
            >
              {/* Line 1: Title & Hex */}
              <div className="text-[11px] font-mono font-bold text-white flex justify-between items-center">
                <span>{'Node ' + String(node.id) + ' (' + node.tag + ')'}</span>
                <span className="text-slate-400">{node.hex}</span>
              </div>

              {/* Line 2: Tokens & Node Load */}
              <div className="flex justify-between items-center text-[11px] font-mono font-bold text-cyan-300">
                <span>{'TOK: ' + String(node.tokensK) + 'K'}</span>
                <span>{'LOAD: ' + String(node.loadPct) + '%'}</span>
              </div>

              {/* Line 3: Latency & State */}
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-amber-400">{node.latencyMs}</span>
                <span className="text-emerald-400 truncate ml-1">{node.stateLabel}</span>
              </div>
            </div>
          );
        })}
      </main>

      {/* Compact Cluster Telemetry Inspector Strip */}
      <div className="text-[11px] font-mono whitespace-nowrap overflow-hidden text-cyan-300 font-bold px-2 py-0.5 bg-black/60 border border-slate-800 rounded my-0.5 shrink-0">
        {selectedNode.tag +
          ' · TOK: ' +
          String(selectedNode.tokensK) +
          'K · LOAD: ' +
          String(selectedNode.loadPct) +
          '% · SYNC: ' +
          String(selectedNode.syncPct) +
          '% · PTR ' +
          selectedNode.hex +
          ' · CLU: OK · LOCKED'}
      </div>

      {/* Tactical Launch Control Switches */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1">
        <button
          type="button"
          onClick={handleTriggerFederationBurst}
          className="bg-amber-950/50 hover:bg-amber-900/60 border border-amber-500/80 text-amber-300 rounded text-xs font-mono font-bold py-2 px-2 text-center cursor-pointer truncate"
        >
          💥 INJECT CLUSTER FEDERATION BURST
        </button>

        <button
          type="button"
          onClick={handleToggleFailoverSpike}
          className="bg-cyan-950/60 hover:bg-cyan-900/70 border border-[#00F0FF] text-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.25)] rounded text-xs font-mono font-bold py-2 px-2 text-center cursor-pointer truncate"
        >
          ⚡ TOGGLE FAILOVER SPIKE
        </button>

        <button
          type="button"
          onClick={handleStepOrchestrationPass}
          className="bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-500/80 text-emerald-300 rounded text-xs font-mono font-bold py-2 px-2 text-center cursor-pointer truncate"
        >
          🚀 STEP ASYNCHRONOUS ORCHESTRATION PASS
        </button>

        <button
          type="button"
          onClick={handleFlushFleetArenas}
          className="bg-rose-950/60 hover:bg-rose-900/70 border border-rose-500/80 text-rose-300 rounded text-xs font-mono font-bold py-2 px-2 text-center cursor-pointer truncate"
        >
          🔄 FLUSH FLEET ARENAS
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
