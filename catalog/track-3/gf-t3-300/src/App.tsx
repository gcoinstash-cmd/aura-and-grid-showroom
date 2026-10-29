/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';

type TabKey = 'Mesh' | 'Moee' | 'Load' | 'Stats' | 'APA';

interface CorridorSpec {
  id: string;
  label: string;
  shortTag: string;
  baseBandwidthGbs: number;
  baseLatencyUs: number;
  modeName: string;
}

interface ExpertNode {
  id: number;
  code: string;
  title: string;
  hex: string;
  ptr: string;
  tokensK: number;
  loadPct: number;
  latencyMs: number;
  syncPct: number;
  status: string;
  gatingWeight: number;
}

const CORRIDORS: CorridorSpec[] = [
  {
    id: 'MOE-CORRIDOR-ALPHA',
    label: 'MOE-CORRIDOR-ALPHA (DYNAMIC-MOE-TENSOR-PARALLELISM-FABRIC · 57200-GB/S)',
    shortTag: 'ALPHA · 57200-GB/S',
    baseBandwidthGbs: 57200,
    baseLatencyUs: 0.01,
    modeName: 'MOE_PARALLELISM',
  },
  {
    id: 'MOE-CORRIDOR-BRAVO',
    label: 'MOE-CORRIDOR-BRAVO (EXPERT-LOAD-BALANCER-ENGINE)',
    shortTag: 'BRAVO · BALANCER',
    baseBandwidthGbs: 54800,
    baseLatencyUs: 0.01,
    modeName: 'EXPERT_BALANCER',
  },
  {
    id: 'MOE-CORRIDOR-GAMMA',
    label: 'MOE-CORRIDOR-GAMMA (NON-BLOCKING-ALL-TO-ALL-ROUTER)',
    shortTag: 'GAMMA · ALL-TO-ALL',
    baseBandwidthGbs: 56400,
    baseLatencyUs: 0.01,
    modeName: 'ALL_TO_ALL_ROUTER',
  },
  {
    id: 'MOE-CORRIDOR-DELTA',
    label: 'MOE-CORRIDOR-DELTA (FALLBACK-DENSE-FEEDFORWARD-PASS)',
    shortTag: 'DELTA · FALLBACK',
    baseBandwidthGbs: 42900,
    baseLatencyUs: 0.03,
    modeName: 'DENSE_FALLBACK',
  },
];

const INITIAL_EXPERTS: ExpertNode[] = [
  { id: 0, code: 'E0', title: 'Expert 0 (E0)', hex: '0x27000', ptr: '0x27000', tokensK: 256, loadPct: 12.5, latencyMs: 0.02, syncPct: 100, status: 'ROUTED · LOCKED', gatingWeight: 0.125 },
  { id: 1, code: 'E1', title: 'Expert 1 (E1)', hex: '0x27010', ptr: '0x27010', tokensK: 256, loadPct: 12.5, latencyMs: 0.02, syncPct: 100, status: 'ROUTED · LOCKED', gatingWeight: 0.125 },
  { id: 2, code: 'E2', title: 'Expert 2 (E2)', hex: '0x27020', ptr: '0x27020', tokensK: 256, loadPct: 12.5, latencyMs: 0.02, syncPct: 100, status: 'ROUTED · LOCKED', gatingWeight: 0.125 },
  { id: 3, code: 'E3', title: 'Expert 3 (E3)', hex: '0x27030', ptr: '0x27030', tokensK: 256, loadPct: 12.5, latencyMs: 0.02, syncPct: 100, status: 'ROUTED · LOCKED', gatingWeight: 0.125 },
  { id: 4, code: 'E4', title: 'Expert 4 (E4)', hex: '0x27040', ptr: '0x27040', tokensK: 256, loadPct: 12.5, latencyMs: 0.02, syncPct: 100, status: 'ROUTED · LOCKED', gatingWeight: 0.125 },
  { id: 5, code: 'E5', title: 'Expert 5 (E5)', hex: '0x27050', ptr: '0x27050', tokensK: 256, loadPct: 12.5, latencyMs: 0.02, syncPct: 100, status: 'ROUTED · LOCKED', gatingWeight: 0.125 },
  { id: 6, code: 'E6', title: 'Expert 6 (E6)', hex: '0x27060', ptr: '0x27060', tokensK: 256, loadPct: 12.5, latencyMs: 0.02, syncPct: 100, status: 'ROUTED · LOCKED', gatingWeight: 0.125 },
  { id: 7, code: 'E7', title: 'Expert 7 (E7)', hex: '0x27070', ptr: '0x27070', tokensK: 256, loadPct: 12.5, latencyMs: 0.02, syncPct: 100, status: 'ROUTED · LOCKED', gatingWeight: 0.125 },
];

export default function App() {
  const [selectedCorridorId, setSelectedCorridorId] = useState<string>('MOE-CORRIDOR-ALPHA');
  const [activeTab, setActiveTab] = useState<TabKey>('Mesh');
  const [selectedExpertId, setSelectedExpertId] = useState<number>(3);
  const [experts, setExperts] = useState<ExpertNode[]>(INITIAL_EXPERTS);
  const [throughputGbs, setThroughputGbs] = useState<number>(57200);
  const [routerLatencyUs, setRouterLatencyUs] = useState<number>(0.01);
  const [processedTokens, setProcessedTokens] = useState<number>(9728000);
  const [engineXpK, setEngineXpK] = useState<number>(75.0);
  const [moeState, setMoeState] = useState<string>('Router Active');
  const [bottleneckSpikeActive, setBottleneckSpikeActive] = useState<boolean>(false);
  const [passCounter, setPassCounter] = useState<number>(1);
  const [vecValues, setVecValues] = useState<number[]>([6.11, 6.15, 6.12, 6.14]);
  const [apaNotice, setApaNotice] = useState<string>('READY FOR SOVEREIGN APA TITLE TRANSFER · CLUSTER-006 · UNIT #300');
  const [radioLogs, setRadioLogs] = useState<[string, string]>([
    '[00:01.04] 🟢 CREW CHIEF: Asynchronous MoE tensor parallelism and expert load balancer engine initialized · 8 experts linked',
    '[00:01.08] 🟢 TELEMETRY: All-to-all expert dispatch verified at 57,200 GB/s with zero expert starvation',
  ]);

  const currentCorridor = useMemo(
    () => CORRIDORS.find((c) => c.id === selectedCorridorId) || CORRIDORS[0],
    [selectedCorridorId]
  );

  const selectedExpert = useMemo(
    () => experts.find((e) => e.id === selectedExpertId) || experts[3],
    [experts, selectedExpertId]
  );

  const formatTimestamp = (step: number) => {
    const secs = (1.08 + step * 0.04).toFixed(2).padStart(5, '0');
    return '[00:' + secs + ']';
  };

  const handleCorridorChange = (newId: string) => {
    setSelectedCorridorId(newId);
    const corr = CORRIDORS.find((c) => c.id === newId) || CORRIDORS[0];
    setThroughputGbs(corr.baseBandwidthGbs);
    setRouterLatencyUs(corr.baseLatencyUs);
    setBottleneckSpikeActive(false);
    setMoeState('Router Active');
    setExperts(INITIAL_EXPERTS);
    const nextStep = passCounter + 1;
    setPassCounter(nextStep);
    setRadioLogs([
      formatTimestamp(nextStep) + ' 🟢 CREW CHIEF: Switched active fabric to ' + corr.label,
      formatTimestamp(nextStep + 1) +
        ' 🟢 TELEMETRY: All-to-all expert dispatch verified at ' +
        corr.baseBandwidthGbs.toLocaleString() +
        ' GB/s with zero expert starvation',
    ]);
  };

  // Trigger 1: Trigger MoE Tensor Parallelism Burst
  const handleInjectMoEBurst = () => {
    const nextStep = passCounter + 1;
    setPassCounter(nextStep);
    const burstBw = Math.min(64800, currentCorridor.baseBandwidthGbs + 2400);
    setThroughputGbs(burstBw);
    setRouterLatencyUs(0.01);
    setProcessedTokens((prev) => prev + 2048000);
    setEngineXpK((prev) => Number((prev + 12.5).toFixed(1)));
    setBottleneckSpikeActive(false);
    setMoeState('Router Active');
    setVecValues([6.24, 6.28, 6.25, 6.27]);

    const burstExperts = INITIAL_EXPERTS.map((exp) => ({
      ...exp,
      tokensK: 512,
      loadPct: 12.5,
      latencyMs: 0.01,
      syncPct: 100,
      status: 'ROUTED · LOCKED',
      gatingWeight: 0.125,
    }));
    setExperts(burstExperts);
    setRadioLogs([
      formatTimestamp(nextStep) + ' 🟢 CREW CHIEF: MoE Tensor Parallelism Burst injected across E0..E7 · 4,096K tokens dispatched',
      formatTimestamp(nextStep + 1) +
        ' 🟢 TELEMETRY: Non-blocking all-to-all fabric peaking at ' +
        burstBw.toLocaleString() +
        ' GB/s · 0.01 µs barrier lock',
    ]);
  };

  // Trigger 2: Inject Expert Bottleneck Spike (Force Dynamic Load Re-Balancing)
  const handleToggleBottleneckSpike = () => {
    const nextStep = passCounter + 1;
    setPassCounter(nextStep);

    if (!bottleneckSpikeActive) {
      setBottleneckSpikeActive(true);
      setThroughputGbs(49800);
      setRouterLatencyUs(0.02);
      setMoeState('Re-Balancing Active');
      setVecValues([7.42, 5.88, 5.91, 6.95]);
      const spiked = INITIAL_EXPERTS.map((exp) => {
        if (exp.id === selectedExpertId) {
          return {
            ...exp,
            tokensK: 640,
            loadPct: 31.25,
            latencyMs: 0.04,
            syncPct: 92,
            status: 'SPIKE · REBALANCING',
            gatingWeight: 0.3125,
          };
        }
        return {
          ...exp,
          tokensK: 201,
          loadPct: 9.82,
          latencyMs: 0.02,
          syncPct: 99,
          status: 'ROUTED · LOCKED',
          gatingWeight: 0.0982,
        };
      });
      setExperts(spiked);
      setRadioLogs([
        formatTimestamp(nextStep) +
          ' 🟡 CREW CHIEF: Bottleneck spike injected on ' +
          selectedExpert.code +
          ' (' +
          selectedExpert.hex +
          ') · Load surged to 31.25%',
        formatTimestamp(nextStep + 1) +
          ' 🟢 TELEMETRY: Dynamic load re-balancer engaged · Redistributing overflow tokens across peer experts',
      ]);
    } else {
      setBottleneckSpikeActive(false);
      setThroughputGbs(currentCorridor.baseBandwidthGbs);
      setRouterLatencyUs(0.01);
      setMoeState('Router Active');
      setVecValues([6.11, 6.15, 6.12, 6.14]);
      setExperts(INITIAL_EXPERTS);
      setRadioLogs([
        formatTimestamp(nextStep) + ' 🟢 CREW CHIEF: Expert bottleneck spike cleared · Uniform 12.5% gating equilibrium restored',
        formatTimestamp(nextStep + 1) +
          ' 🟢 TELEMETRY: All-to-all expert dispatch verified at ' +
          currentCorridor.baseBandwidthGbs.toLocaleString() +
          ' GB/s with zero expert starvation',
      ]);
    }
  };

  // Trigger 3: Step Asynchronous Expert Pass
  const handleStepAsyncRoutingPass = () => {
    const nextStep = passCounter + 1;
    setPassCounter(nextStep);
    setProcessedTokens((prev) => prev + 1024000);
    setEngineXpK((prev) => Number((prev + 5.0).toFixed(1)));
    setBottleneckSpikeActive(false);
    setThroughputGbs(currentCorridor.baseBandwidthGbs);
    setRouterLatencyUs(0.01);
    setMoeState('Router Active');

    const delta = Number(((nextStep % 4) * 0.01).toFixed(2));
    setVecValues([
      Number((6.11 + delta).toFixed(2)),
      Number((6.15 - delta).toFixed(2)),
      Number((6.12 + delta).toFixed(2)),
      Number((6.14 - delta).toFixed(2)),
    ]);

    const steppedExperts = INITIAL_EXPERTS.map((exp, idx) => ({
      ...exp,
      tokensK: 256 + ((nextStep + idx) % 2) * 4,
      loadPct: 12.5,
      latencyMs: 0.02,
      syncPct: 100,
      status: 'ROUTED · LOCKED',
      gatingWeight: 0.125,
    }));
    setExperts(steppedExperts);
    setSelectedExpertId((prev) => (prev + 1) % 8);
    setRadioLogs([
      formatTimestamp(nextStep) +
        ' 🟢 CREW CHIEF: Stepped Asynchronous Routing Pass #' +
        nextStep +
        ' · Sub-microsecond barrier synced',
      formatTimestamp(nextStep + 1) + ' 🟢 TELEMETRY: Token batch +1,024,000 Units committed across 8/8 experts at 0.01 µs',
    ]);
  };

  // Trigger 4: Flush Expert Arenas & Re-Zero Routing Buffers
  const handleFlushExpertArenas = () => {
    setPassCounter(1);
    setThroughputGbs(57200);
    setRouterLatencyUs(0.01);
    setProcessedTokens(9728000);
    setEngineXpK(75.0);
    setMoeState('Router Active');
    setBottleneckSpikeActive(false);
    setSelectedCorridorId('MOE-CORRIDOR-ALPHA');
    setSelectedExpertId(3);
    setVecValues([6.11, 6.15, 6.12, 6.14]);
    setExperts(INITIAL_EXPERTS);
    setRadioLogs([
      '[00:01.04] 🟢 CREW CHIEF: Asynchronous MoE tensor parallelism and expert load balancer engine initialized · 8 experts linked',
      '[00:01.08] 🟢 TELEMETRY: All-to-all expert dispatch verified at 57,200 GB/s with zero expert starvation',
    ]);
  };

  const saturationPercent = Math.min(100, Math.round((throughputGbs / 60000) * 100));

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans">
      {/* Top Header Stack */}
      <header className="w-full shrink-0 flex flex-col gap-0.5">
        {/* Top Header Row 1 */}
        <div className="flex items-center justify-between gap-1 w-full shrink-0">
          {/* Left: Primary Title & Flagship Badge */}
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <h1 className="text-base font-mono font-bold tracking-tight text-white">GF-T3-300</h1>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-cyan-950/90 text-[#00F0FF] border border-cyan-500/50 rounded">
              FLAGSHIP
            </span>
          </div>

          {/* Right: Compact Corridor Dropdown + Micro Action Buttons */}
          <div className="flex items-center gap-1 shrink-0 overflow-hidden">
            <select
              aria-label="Synthetic MoE Corridor Selector"
              value={selectedCorridorId}
              onChange={(e) => handleCorridorChange(e.target.value)}
              className="max-w-[120px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 text-cyan-300 border border-slate-700 rounded shrink-0 focus:outline-none focus:border-cyan-400"
            >
              {CORRIDORS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                setActiveTab('Moee');
                handleInjectMoEBurst();
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 bg-slate-900 hover:bg-cyan-950 text-[#00F0FF] border border-cyan-500/40 rounded transition-colors cursor-pointer"
            >
              [MoE]
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('Load');
                handleToggleBottleneckSpike();
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 bg-slate-900 hover:bg-amber-950 text-[#FF9F0A] border border-amber-500/40 rounded transition-colors cursor-pointer"
            >
              [Load]
            </button>
            <button
              type="button"
              onClick={handleStepAsyncRoutingPass}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 bg-slate-900 hover:bg-emerald-950 text-emerald-400 border border-emerald-500/40 rounded transition-colors cursor-pointer"
            >
              [Run]
            </button>
          </div>
        </div>

        {/* Top Header Row 2: Subtitle */}
        <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap">
          MoE Tensor Parallelism · Expert Load Balancer · Zero Starvation
        </div>
      </header>

      {/* 4-Card Arcade HUD Ribbon (2x2 Grid) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-0.5">
        {/* Card 1: MOE NITRO */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400">MOE NITRO</span>
            <span className="text-[10px] font-mono text-cyan-400">{saturationPercent}% SAT</span>
          </div>
          <div className="text-[#00F0FF] font-mono text-lg font-bold leading-tight">
            {throughputGbs.toLocaleString()} GB/s
          </div>
          <div className="w-full bg-slate-900 h-1 rounded overflow-hidden my-0.5">
            <div
              className="bg-[#00F0FF] h-full transition-transform duration-150 origin-left"
              style={{ transform: 'scaleX(' + saturationPercent / 100 + ')' }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">MoE Throughput Saturation</div>
        </div>

        {/* Card 2: LOAD STREAK */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400">LOAD STREAK</span>
            <span className="text-[10px] font-mono font-bold text-[#FF9F0A] bg-amber-950/60 border border-amber-500/40 px-1 rounded">
              🔥 ALL-TO-ALL
            </span>
          </div>
          <div className="text-white font-mono text-lg font-bold leading-tight">
            {routerLatencyUs.toFixed(2)} µs
          </div>
          <div className="text-[10px] font-mono text-emerald-400 truncate">Non-Blocking Barrier Lock</div>
          <div className="text-[10px] font-mono text-slate-300 truncate">Router Latency</div>
        </div>

        {/* Card 3: ACTIVE EXPERTS */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400">ACTIVE EXPERTS</span>
            <span className="text-[10px] font-mono font-bold text-emerald-400">ROUTED</span>
          </div>
          <div className="text-white font-mono text-lg font-bold leading-tight">EXPERTS: 8/8</div>
          <div className="grid grid-cols-8 gap-0.5 my-0.5">
            {experts.map((e) => (
              <span
                key={e.code}
                className={
                  'text-[9px] font-mono font-bold text-center rounded ' +
                  (e.id === selectedExpertId
                    ? 'bg-[#00F0FF] text-black'
                    : e.loadPct > 20
                    ? 'bg-[#FF9F0A] text-black'
                    : 'bg-slate-800 text-cyan-300')
                }
              >
                {e.code}
              </span>
            ))}
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">F1 Gear Shift Indicator [E0..E7]</div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400">TOKEN SCORE</span>
            <span className="text-[10px] font-mono font-bold text-[#FF9F0A]">+{engineXpK.toFixed(1)}k ENGINE XP</span>
          </div>
          <div className="text-white font-mono text-lg font-bold leading-tight">
            {processedTokens.toLocaleString()} UNITS
          </div>
          <div className="text-[10px] font-mono text-cyan-300 truncate">Zero Starvation Verified</div>
          <div className="text-[10px] font-mono text-slate-300 truncate">MoE State: {moeState}</div>
        </div>
      </section>

      {/* 5 Horizontal Tabs */}
      <nav
        aria-label="Cockpit View Tabs"
        className="grid grid-cols-5 gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg my-1 w-full text-center shrink-0"
      >
        {(['Mesh', 'Moee', 'Load', 'Stats', 'APA'] as TabKey[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={
              'py-1 text-xs font-mono font-bold rounded transition-colors cursor-pointer ' +
              (activeTab === tab
                ? 'bg-[#00F0FF] text-slate-950'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white')
            }
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* Streamlined Mesh Info Subheader (Strictly clean of action buttons) */}
      <div className="text-[10px] font-mono whitespace-nowrap overflow-hidden text-slate-300 px-2 py-0.5 bg-slate-950/80 border border-slate-800/80 rounded shrink-0">
        VIEW: {activeTab.toUpperCase()} · PTR: 0x21F8DC0 · MODE: {currentCorridor.modeName} · EXPERTS: 8 · VEC: [{vecValues.join(', ')}]
      </div>

      {/* Main Interactive Workspace Bay (Fits 100% in viewport) */}
      <main className="flex-1 min-h-0 flex flex-col justify-between overflow-hidden my-0.5">
        {activeTab === 'APA' ? (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-2 p-1.5 bg-slate-950/90 border border-slate-800 rounded-lg overflow-hidden items-center">
            <div className="flex flex-col gap-1 justify-between h-full p-1">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                <span className="text-sm font-mono font-bold text-[#00F0FF]">
                  GF-T3-300 · SOVEREIGN APA WINDOW STICKER
                </span>
                <span className="text-xs font-mono font-bold text-[#FF9F0A]">CLUSTER-006 · UNIT #300</span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-xs font-mono text-slate-200">
                <div className="p-1.5 bg-slate-900/80 border border-slate-800 rounded">
                  <div className="text-[10px] text-slate-400">TRACK TIER</div>
                  <div className="font-bold text-white">Track 3 Skunkworks Engine</div>
                </div>
                <div className="p-1.5 bg-slate-900/80 border border-slate-800 rounded">
                  <div className="text-[10px] text-slate-400">RETAIL PRICE</div>
                  <div className="font-bold text-[#00F0FF]">150,000 UNITS EQUIVALENT</div>
                </div>
                <div className="p-1.5 bg-slate-900/80 border border-slate-800 rounded">
                  <div className="text-[10px] text-slate-400">DYNO GATES 01–04</div>
                  <div className="font-bold text-emerald-400">VERIFIED · &gt;85% PYTEST</div>
                </div>
                <div className="p-1.5 bg-slate-900/80 border border-slate-800 rounded">
                  <div className="text-[10px] text-slate-400">IP PROVENANCE</div>
                  <div className="font-bold text-amber-400">100% MIT · ZERO COPYLEFT</div>
                </div>
              </div>
              <div className="text-[11px] font-mono text-emerald-400 truncate">{apaNotice}</div>
            </div>

            {/* Vertical Flex Container for APA Action CTAs */}
            <div className="flex flex-col gap-2 w-full p-1">
              <button
                type="button"
                onClick={() =>
                  setApaNotice(
                    'APA TITLE ACQUISITION PACKET LOCKED · 100% SOVEREIGN IP TRANSFER READY FOR ESCROW CLEARANCE'
                  )
                }
                className="w-full py-2.5 px-3 bg-[#00F0FF] hover:bg-cyan-300 text-slate-950 font-mono text-xs font-bold rounded text-center transition-colors cursor-pointer"
              >
                ACQUIRE TITLE (APA)
              </button>
              <button
                type="button"
                onClick={() =>
                  setApaNotice(
                    'CLUSTER-006 VAULT BUYOUT DOSSIER INITIALIZED · 50-UNIT CARVE-OUT ESCROW VERIFIED'
                  )
                }
                className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-[#FF9F0A] border border-[#FF9F0A] font-mono text-xs font-bold rounded text-center transition-colors cursor-pointer"
              >
                INQUIRE VAULT BUYOUT
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between overflow-hidden">
            {/* View Context Strip for Moee / Load / Stats */}
            {activeTab !== 'Mesh' && (
              <div className="px-2 py-0.5 bg-slate-900/90 border border-slate-800 rounded text-[10px] font-mono text-amber-300 flex items-center justify-between shrink-0 mb-0.5">
                {activeTab === 'Moee' && (
                  <span>
                    MOE EQUATION: M_moe = sum_k=1..8 g_k(x) * E_k(W_k * x) · CORRIDOR: {currentCorridor.label}
                  </span>
                )}
                {activeTab === 'Load' && (
                  <span>
                    DYNAMIC BALANCER: AUXILIARY-FREE GATING EQUILIBRIUM · TARGET LOAD: 12.5% PER EXPERT · ZERO STARVATION
                  </span>
                )}
                {activeTab === 'Stats' && (
                  <span>
                    DYNO TELEMETRY: 57,200 GB/s PEAK · 0.01 µs BARRIER · PYTEST &gt;85% COVERAGE · NIST SP 800-218 SSDF v1.1
                  </span>
                )}
                <span className="text-cyan-300 font-bold">ACTIVE: {selectedExpert.code}</span>
              </div>
            )}

            {/* Interactive Expert Matrix Bay (E0–E7) in 2-row x 4-column grid */}
            <div className="grid grid-cols-4 gap-1 p-1 flex-1 items-stretch">
              {experts.map((exp) => {
                const isSelected = exp.id === selectedExpertId;
                const isSpiked = exp.loadPct > 20;
                return (
                  <button
                    key={exp.code}
                    type="button"
                    onClick={() => setSelectedExpertId(exp.id)}
                    className={
                      'flex flex-col justify-between p-1.5 rounded border text-left transition-colors cursor-pointer ' +
                      (isSelected
                        ? 'bg-slate-900/95 border-[#00F0FF]'
                        : isSpiked
                        ? 'bg-amber-950/30 border-[#FF9F0A]'
                        : 'bg-slate-950/90 border-slate-800 hover:border-slate-700')
                    }
                  >
                    {/* Line 1: Title & Hex */}
                    <div className="text-[11px] font-mono font-bold text-white flex justify-between items-center w-full">
                      <span>{exp.title}</span>
                      <span className="text-slate-400">{exp.hex}</span>
                    </div>

                    {/* Line 2: Tokens & Expert Load */}
                    <div className="flex justify-between items-center text-[11px] font-mono font-bold text-cyan-300 w-full">
                      <span>TOK: {exp.tokensK}K</span>
                      <span>LOAD: {exp.loadPct}%</span>
                    </div>

                    {/* Line 3: Latency & State */}
                    <div className="flex justify-between items-center text-[10px] font-mono w-full">
                      <span className="text-[#FF9F0A]">{exp.latencyMs.toFixed(2)}ms</span>
                      <span className={isSpiked ? 'text-[#FF9F0A] font-bold' : 'text-emerald-400 font-bold'}>
                        {exp.status}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Compact MoE Telemetry Inspector Strip */}
      <div className="text-[11px] font-mono whitespace-nowrap overflow-hidden text-cyan-300 font-bold px-2 py-0.5 bg-black/60 border border-slate-800 rounded my-0.5 shrink-0">
        {selectedExpert.code} · TOK: {selectedExpert.tokensK}K · LOAD: {selectedExpert.loadPct}% · SYNC: {selectedExpert.syncPct}% · PTR {selectedExpert.ptr} · MOE: OK · LOCKED
      </div>

      {/* Tactical Launch Control Switches */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1">
        <button
          type="button"
          onClick={handleInjectMoEBurst}
          className="bg-amber-950/40 hover:bg-amber-900/60 border border-[#FF9F0A] text-[#FF9F0A] rounded text-xs font-mono font-bold py-2 px-2 text-center truncate transition-colors cursor-pointer"
        >
          💥 INJECT MOE PARALLELISM BURST
        </button>
        <button
          type="button"
          onClick={handleToggleBottleneckSpike}
          className="bg-cyan-950/40 hover:bg-cyan-900/60 border border-[#00F0FF] text-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.2)] rounded text-xs font-mono font-bold py-2 px-2 text-center truncate transition-colors cursor-pointer"
        >
          ⚡ TOGGLE EXPERT BOTTLENECK SPIKE
        </button>
        <button
          type="button"
          onClick={handleStepAsyncRoutingPass}
          className="bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-400 text-emerald-300 rounded text-xs font-mono font-bold py-2 px-2 text-center truncate transition-colors cursor-pointer"
        >
          🚀 STEP ASYNCHRONOUS ROUTING PASS
        </button>
        <button
          type="button"
          onClick={handleFlushExpertArenas}
          className="bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500 text-rose-300 rounded text-xs font-mono font-bold py-2 px-2 text-center truncate transition-colors cursor-pointer"
        >
          🔄 FLUSH EXPERT ARENAS
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
