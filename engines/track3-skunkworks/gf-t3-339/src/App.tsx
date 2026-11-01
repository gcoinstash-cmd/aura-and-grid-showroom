/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

type TabKey = 'Mesh' | 'MoE_' | 'Expr' | 'Stats' | 'APA';

interface ExpertUnit {
  id: number;
  code: string;
  title: string;
  hex: string;
  tokensK: number;
  loadPct: number;
  syncPct: number;
  latencyMs: string;
  status: string;
  gateWeight: string;
}

const SYNTHETIC_CORRIDORS: string[] = [
  'MOE-CORRIDOR-ALPHA (DYNAMIC-EXPERT-DISPATCH-FABRIC · 126800-GB/S)',
  'MOE-CORRIDOR-BRAVO (EXPERT-PARALLELISM-ENGINE)',
  'MOE-CORRIDOR-GAMMA (NON-BLOCKING-ALL-TO-ALL-ROUTER)',
  'MOE-CORRIDOR-DELTA (FALLBACK-DENSE-FORWARD-PASS)',
];

const INITIAL_EXPERTS: ExpertUnit[] = [
  { id: 0, code: 'E0', title: 'Expert 0 (E0)', hex: '0x4E000', tokensK: 256, loadPct: 100, syncPct: 100, latencyMs: '0.02ms', status: 'ROUTED · LOCKED', gateWeight: '0.512' },
  { id: 1, code: 'E1', title: 'Expert 1 (E1)', hex: '0x4E010', tokensK: 256, loadPct: 100, syncPct: 100, latencyMs: '0.02ms', status: 'ROUTED · LOCKED', gateWeight: '0.488' },
  { id: 2, code: 'E2', title: 'Expert 2 (E2)', hex: '0x4E020', tokensK: 256, loadPct: 100, syncPct: 100, latencyMs: '0.02ms', status: 'ROUTED · LOCKED', gateWeight: '0.504' },
  { id: 3, code: 'E3', title: 'Expert 3 (E3)', hex: '0x4E030', tokensK: 256, loadPct: 100, syncPct: 100, latencyMs: '0.02ms', status: 'ROUTED · LOCKED', gateWeight: '0.496' },
  { id: 4, code: 'E4', title: 'Expert 4 (E4)', hex: '0x4E040', tokensK: 256, loadPct: 100, syncPct: 100, latencyMs: '0.02ms', status: 'ROUTED · LOCKED', gateWeight: '0.518' },
  { id: 5, code: 'E5', title: 'Expert 5 (E5)', hex: '0x4E050', tokensK: 256, loadPct: 100, syncPct: 100, latencyMs: '0.02ms', status: 'ROUTED · LOCKED', gateWeight: '0.482' },
  { id: 6, code: 'E6', title: 'Expert 6 (E6)', hex: '0x4E060', tokensK: 256, loadPct: 100, syncPct: 100, latencyMs: '0.02ms', status: 'ROUTED · LOCKED', gateWeight: '0.509' },
  { id: 7, code: 'E7', title: 'Expert 7 (E7)', hex: '0x4E070', tokensK: 256, loadPct: 100, syncPct: 100, latencyMs: '0.02ms', status: 'ROUTED · LOCKED', gateWeight: '0.491' },
];

const INITIAL_LOGS: string[] = [
  '[00:01.04] 🟢 CREW CHIEF: Asynchronous expert parallelism and MoE token routing engine initialized · 8 experts linked',
  '[00:01.08] 🟢 TELEMETRY: Top-k expert token dispatch verified at 126,800 GB/s with zero expert imbalance',
];

export default function App() {
  const [corridor, setCorridor] = useState<string>(SYNTHETIC_CORRIDORS[0]);
  const [activeTab, setActiveTab] = useState<TabKey>('Mesh');
  const [selectedExpertId, setSelectedExpertId] = useState<number>(3);
  const [experts, setExperts] = useState<ExpertUnit[]>(INITIAL_EXPERTS);
  const [throughputGbs, setThroughputGbs] = useState<number>(126800);
  const [dispatchLatencyUs, setDispatchLatencyUs] = useState<string>('0.01');
  const [processedTokens, setProcessedTokens] = useState<number>(26200000);
  const [engineXpK, setEngineXpK] = useState<number>(75.0);
  const [moeState, setMoeState] = useState<string>('Active');
  const [overloadActive, setOverloadActive] = useState<boolean>(false);
  const [stepCount, setStepCount] = useState<number>(1);
  const [radioLogs, setRadioLogs] = useState<string[]>(INITIAL_LOGS);
  const [apaTransferState, setApaTransferState] = useState<string>('READY_FOR_TITLE_TRANSFER');

  const selectedExpert = experts.find((e) => e.id === selectedExpertId) || experts[3];

  const appendRadioLog = (line1: string, line2: string) => {
    setRadioLogs([line1, line2]);
  };

  const handleCorridorChange = (nextCorridor: string) => {
    setCorridor(nextCorridor);
    if (nextCorridor === SYNTHETIC_CORRIDORS[0]) {
      setThroughputGbs(126800);
      setDispatchLatencyUs('0.01');
    } else if (nextCorridor === SYNTHETIC_CORRIDORS[1]) {
      setThroughputGbs(118400);
      setDispatchLatencyUs('0.02');
    } else if (nextCorridor === SYNTHETIC_CORRIDORS[2]) {
      setThroughputGbs(122600);
      setDispatchLatencyUs('0.01');
    } else {
      setThroughputGbs(94200);
      setDispatchLatencyUs('0.04');
    }
    appendRadioLog(
      '[00:02.12] 🟢 CREW CHIEF: Switched active fabric to ' + nextCorridor.split(' ')[0],
      '[00:02.16] 🟢 TELEMETRY: Non-blocking all-to-all barrier re-locked across 8 experts'
    );
  };

  const triggerRoutingBurst = () => {
    const nextTokens = processedTokens + 2048000;
    const nextXp = Number((engineXpK + 12.5).toFixed(1));
    setProcessedTokens(nextTokens);
    setEngineXpK(nextXp);
    setThroughputGbs(134200);
    setDispatchLatencyUs('0.01');
    setMoeState('Active');
    setExperts(
      experts.map((ex) => ({
        ...ex,
        tokensK: ex.tokensK + 64,
        loadPct: 100,
        syncPct: 100,
        latencyMs: '0.01ms',
        status: 'BURST · LOCKED',
      }))
    );
    appendRadioLog(
      '[00:03.40] 💥 CREW CHIEF: Triggered MoE Token Routing Burst across E0-E7 top-2 gates',
      '[00:03.44] 🟢 TELEMETRY: Routing Throughput surged to 134,200 GB/s · Dispatch Latency: 0.01 µs'
    );
  };

  const toggleOverloadSpike = () => {
    const nextOverload = !overloadActive;
    setOverloadActive(nextOverload);
    if (nextOverload) {
      setThroughputGbs(119400);
      setDispatchLatencyUs('0.02');
      setMoeState('Active · Throttled');
      setExperts(
        experts.map((ex) =>
          ex.id === 2 || ex.id === 5
            ? {
                ...ex,
                tokensK: 240,
                loadPct: 92,
                syncPct: 98,
                latencyMs: '0.03ms',
                status: 'THROTTLED · BALANCED',
              }
            : {
                ...ex,
                tokensK: 264,
                loadPct: 100,
                syncPct: 100,
                latencyMs: '0.02ms',
                status: 'ROUTED · LOCKED',
              }
        )
      );
      appendRadioLog(
        '[00:04.18] ⚡ CREW CHIEF: Injected Expert Overload Spike on E2 & E5 · Dynamic capacity throttling active',
        '[00:04.22] 🟢 TELEMETRY: Overflow tokens shifted to adjacent ring ranks with zero dropped shards'
      );
    } else {
      setThroughputGbs(126800);
      setDispatchLatencyUs('0.01');
      setMoeState('Active');
      setExperts(INITIAL_EXPERTS);
      appendRadioLog(
        '[00:04.50] 🟢 CREW CHIEF: Cleared Expert Overload Spike · Full capacity factor restored',
        '[00:04.54] 🟢 TELEMETRY: Routing Throughput stabilized at 126,800 GB/s across 8 experts'
      );
    }
  };

  const stepAsyncDispatchPass = () => {
    const nextStep = stepCount + 1;
    setStepCount(nextStep);
    setProcessedTokens(processedTokens + 512000);
    setEngineXpK(Number((engineXpK + 5.0).toFixed(1)));
    const nextExpertId = (selectedExpertId + 1) % 8;
    setSelectedExpertId(nextExpertId);
    appendRadioLog(
      '[00:05.10] 🚀 CREW CHIEF: Stepped Asynchronous Dispatch Pass #' + String(nextStep) + ' · Zero host CPU stalls',
      '[00:05.14] 🟢 TELEMETRY: Active focus cycled to E' + String(nextExpertId) + ' · Barrier sync verified at 0.01 µs'
    );
  };

  const flushMoeArenas = () => {
    setCorridor(SYNTHETIC_CORRIDORS[0]);
    setExperts(INITIAL_EXPERTS);
    setSelectedExpertId(3);
    setThroughputGbs(126800);
    setDispatchLatencyUs('0.01');
    setProcessedTokens(26200000);
    setEngineXpK(75.0);
    setMoeState('Active');
    setOverloadActive(false);
    setStepCount(1);
    setRadioLogs(INITIAL_LOGS);
  };

  const tabs: TabKey[] = ['Mesh', 'MoE_', 'Expr', 'Stats', 'APA'];

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans">
      {/* Top Header Block */}
      <header className="w-full shrink-0 flex flex-col gap-0.5">
        {/* Top Header Row 1 */}
        <div className="flex items-center justify-between gap-1 w-full shrink-0">
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <h1 className="text-sm sm:text-base font-mono font-bold tracking-tight text-white">GF-T3-339</h1>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40 rounded">
              FLAGSHIP
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0 overflow-hidden">
            <select
              aria-label="Select Synthetic MoE Corridor"
              value={corridor}
              onChange={(e) => handleCorridorChange(e.target.value)}
              className="max-w-[120px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 border border-slate-700 text-cyan-300 rounded shrink-0 focus:outline-none focus:border-[#00F0FF]"
            >
              {SYNTHETIC_CORRIDORS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setActiveTab('MoE_')}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 bg-slate-900 hover:bg-slate-800 text-[#00F0FF] border border-slate-700 rounded cursor-pointer"
            >
              [MoE_]
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('Expr')}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 bg-slate-900 hover:bg-slate-800 text-[#FF9F0A] border border-slate-700 rounded cursor-pointer"
            >
              [Expr]
            </button>
            <button
              type="button"
              onClick={stepAsyncDispatchPass}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 rounded cursor-pointer"
            >
              [Run]
            </button>
          </div>
        </div>

        {/* Top Header Row 2 */}
        <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap">
          Expert Parallelism · MoE Token Routing · Zero Bottlenecks
        </div>
      </header>

      {/* 4-Card Arcade HUD Ribbon (2x2 Grid) */}
      <section className="grid grid-cols-2 gap-1.5 w-full shrink-0 my-0.5">
        {/* Card 1: MOE NITRO */}
        <div className="bg-slate-900/75 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400">MOE NITRO</span>
            <span className="text-[10px] font-mono text-[#00F0FF]">CORRIDOR LOCKED</span>
          </div>
          <div className="font-mono text-lg font-bold text-[#00F0FF] leading-tight">
            {throughputGbs.toLocaleString()} GB/s
          </div>
          <div className="w-full bg-slate-800 h-1 rounded overflow-hidden my-0.5">
            <div className="bg-[#00F0FF] h-full w-11/12" />
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">Routing Throughput Saturation</div>
        </div>

        {/* Card 2: DISP STREAK */}
        <div className="bg-slate-900/75 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400">DISP STREAK</span>
            <span className="text-[10px] font-mono font-bold text-[#FF9F0A] bg-[#FF9F0A]/10 px-1 rounded">
              🔥 TOP-K MOE
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-white leading-tight">{dispatchLatencyUs} µs</div>
          <div className="text-[10px] font-mono text-emerald-400 truncate">Barrier Sync: Non-Blocking</div>
          <div className="text-[10px] font-mono text-slate-300 truncate">Dispatch Latency</div>
        </div>

        {/* Card 3: ACTIVE EXPERTS */}
        <div className="bg-slate-900/75 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400">ACTIVE EXPERTS</span>
            <span className="text-[10px] font-mono font-bold text-emerald-400">8 Experts</span>
          </div>
          <div className="font-mono text-lg font-bold text-white leading-tight">EXPERTS: 8/8</div>
          <div className="flex items-center gap-0.5 text-[9px] font-mono">
            {experts.map((ex) => (
              <span
                key={ex.code}
                className={
                  ex.id === selectedExpertId
                    ? 'px-1 rounded bg-[#00F0FF] text-black font-bold'
                    : 'px-1 rounded bg-slate-800 text-cyan-300'
                }
              >
                {ex.code}
              </span>
            ))}
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">F1 Gear Shift Indicator [E0..E7]</div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="bg-slate-900/75 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400">TOKEN SCORE</span>
            <span className="text-[10px] font-mono font-bold text-[#FF9F0A]">+{engineXpK.toFixed(1)}k ENGINE XP</span>
          </div>
          <div className="font-mono text-lg font-bold text-white leading-tight">
            {processedTokens.toLocaleString()} UNITS
          </div>
          <div className="text-[10px] font-mono text-cyan-300 truncate">
            Processed Tokens: {processedTokens.toLocaleString()} Units
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">MoE State: {moeState}</div>
        </div>
      </section>

      {/* 5 Horizontal Tabs */}
      <nav className="grid grid-cols-5 gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg my-1 w-full text-center shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={
              activeTab === tab
                ? 'py-1 text-xs font-mono font-bold rounded bg-[#00F0FF] text-slate-950 cursor-pointer transition-colors'
                : 'py-1 text-xs font-mono font-bold rounded text-slate-300 hover:text-white hover:bg-slate-800/60 cursor-pointer transition-colors'
            }
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* Streamlined Mesh Info Subheader */}
      <div className="text-[10px] font-mono whitespace-nowrap overflow-hidden text-slate-300 px-1 shrink-0">
        VIEW: MESH · PTR: 0x48F8DC0 · MODE: EXPERT_PARALLELISM · EXPERTS: 8 · VEC: [9.95, 9.98, 9.96, 9.97]
      </div>

      {/* Main Viewport Area: Always renders the 8-Expert Matrix Bay or contextual overlay */}
      <main className="flex-1 min-h-0 flex flex-col justify-center overflow-hidden my-0.5">
        {activeTab === 'APA' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2 bg-slate-900/70 border border-slate-800 rounded-lg h-full items-center">
            <div className="flex flex-col gap-1 font-mono">
              <div className="text-xs font-bold text-[#00F0FF]">
                CHASSIS: GF-T3-339 · CLUSTER-006 · TRACK 3 FLAGSHIP ENGINE
              </div>
              <div className="text-[11px] text-slate-200">
                Retail Price: 75,000 to 150,000+ Units | Full Engine APA Buyout: 35,000 to 65,000 Units
              </div>
              <div className="text-[10px] text-slate-400">
                100% Sovereign IP Title Transfer · Zero Copyleft · MIT Clean-Room Attested · Gate 01-04 Verified
              </div>
              <div className="text-[10px] text-emerald-400 font-bold">
                ESCROW STATUS: {apaTransferState}
              </div>
            </div>
            <div className="flex flex-col gap-2 w-full">
              <button
                type="button"
                onClick={() => {
                  setApaTransferState('APA_TITLE_RESERVATION_LOCKED');
                  appendRadioLog(
                    '[00:06.10] 🟢 CREW CHIEF: Sovereign APA Title acquisition dossier locked for GF-T3-339',
                    '[00:06.14] 🟢 TELEMETRY: Clean-room repository package verified for immediate hand-off'
                  );
                }}
                className="w-full py-1.5 px-3 text-xs font-mono font-bold bg-[#FF9F0A] text-slate-950 rounded hover:bg-[#FF9F0A]/90 cursor-pointer text-center"
              >
                ACQUIRE TITLE (APA)
              </button>
              <button
                type="button"
                onClick={() => {
                  setApaTransferState('VAULT_BUYOUT_INQUIRY_LOGGED');
                  appendRadioLog(
                    '[00:06.42] 🟢 CREW CHIEF: Cluster-006 Vault Buyout inquiry logged with Pit Wall desk',
                    '[00:06.46] 🟢 TELEMETRY: 4-Gate Dyno verification certificate attached to transfer packet'
                  );
                }}
                className="w-full py-1.5 px-3 text-xs font-mono font-bold bg-slate-800 text-[#00F0FF] border border-[#00F0FF]/50 rounded hover:bg-slate-700 cursor-pointer text-center"
              >
                INQUIRE VAULT BUYOUT
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950/70 border border-slate-800/90 rounded-lg h-full items-stretch">
            {experts.map((expert) => {
              const isSelected = expert.id === selectedExpertId;
              return (
                <button
                  key={expert.code}
                  type="button"
                  onClick={() => setSelectedExpertId(expert.id)}
                  className={
                    isSelected
                      ? 'flex flex-col justify-between p-1.5 rounded bg-slate-900 border border-[#00F0FF] text-left cursor-pointer transition-colors'
                      : 'flex flex-col justify-between p-1.5 rounded bg-slate-900/60 border border-slate-800 hover:border-slate-700 text-left cursor-pointer transition-colors'
                  }
                >
                  {/* Line 1 (Title & Hex) */}
                  <div className="text-[10px] font-mono font-bold text-white flex justify-between items-center w-full">
                    <span>{expert.title}</span>
                    <span className="text-slate-400 font-normal">{expert.hex}</span>
                  </div>

                  {/* Line 2 (Tokens & Expert Load) */}
                  <div className="text-[8px] font-mono font-bold text-cyan-300 flex justify-between items-center w-full px-1">
                    <span>TOK: {expert.tokensK}K</span>
                    <span>LOAD: {expert.loadPct}%</span>
                  </div>

                  {/* Line 3 (Latency & Status) */}
                  <div className="flex justify-between items-center text-[8px] font-mono text-slate-300 w-full px-1">
                    <span className="text-amber-400">{expert.latencyMs}</span>
                    <span className="text-emerald-400">{expert.status}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>

      {/* Compact MoE Telemetry Inspector Strip */}
      <div className="text-[11px] font-mono whitespace-nowrap overflow-hidden text-cyan-300 font-bold px-2 py-0.5 bg-black/60 border border-slate-800 rounded my-0.5 shrink-0">
        {selectedExpert.code} · TOK: {selectedExpert.tokensK}K · LOAD: {selectedExpert.loadPct}% · SYNC: {selectedExpert.syncPct}% · PTR {selectedExpert.hex} · MOE: OK · LOCKED · EXPERTS: 8 · TOP-K: 2 · MODE: {activeTab.toUpperCase()}
      </div>

      {/* Tactical Launch Control Switches */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1">
        <button
          type="button"
          onClick={triggerRoutingBurst}
          className="border-amber-500/80 bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 text-[8px] sm:text-[9px] md:text-xs font-mono font-bold py-1.5 px-0.5 whitespace-nowrap text-center truncate border rounded w-full cursor-pointer"
        >
          💥 INJECT MOE ROUTING BURST
        </button>
        <button
          type="button"
          onClick={toggleOverloadSpike}
          className="border-[#00F0FF] bg-cyan-950/40 hover:bg-cyan-900/50 text-[#00F0FF] text-[8px] sm:text-[9px] md:text-xs font-mono font-bold py-1.5 px-0.5 whitespace-nowrap text-center truncate border rounded w-full cursor-pointer"
        >
          ⚡ TOGGLE EXPERT OVERLOAD SPIKE
        </button>
        <button
          type="button"
          onClick={stepAsyncDispatchPass}
          className="border-emerald-500/80 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 text-[8px] sm:text-[9px] md:text-xs font-mono font-bold py-1.5 px-0.5 whitespace-nowrap text-center truncate border rounded w-full cursor-pointer"
        >
          🚀 STEP ASYNCHRONOUS DISPATCH PASS
        </button>
        <button
          type="button"
          onClick={flushMoeArenas}
          className="border-rose-500/80 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 text-[8px] sm:text-[9px] md:text-xs font-mono font-bold py-1.5 px-0.5 whitespace-nowrap text-center truncate border rounded w-full cursor-pointer"
        >
          🔄 FLUSH MOE ARENAS
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
