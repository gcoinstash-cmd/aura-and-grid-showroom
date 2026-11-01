/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

type CorridorOption = {
  id: string;
  label: string;
  shortCode: string;
  throughputNum: number;
  throughputDisplay: string;
  ringLatencyDisplay: string;
  overlapPct: string;
};

const SYNTHETIC_CORRIDORS: CorridorOption[] = [
  {
    id: 'ALPHA',
    label: 'CONTEXT-CORRIDOR-ALPHA (DYNAMIC-RING-ATTENTION-FABRIC · 130200-GB/S)',
    shortCode: 'CORRIDOR-ALPHA',
    throughputNum: 130200,
    throughputDisplay: '130,200 GB/s',
    ringLatencyDisplay: '0.01 µs',
    overlapPct: '99.96%',
  },
  {
    id: 'BRAVO',
    label: 'CONTEXT-CORRIDOR-BRAVO (SEQUENCE-SHARDING-ENGINE)',
    shortCode: 'CORRIDOR-BRAVO',
    throughputNum: 124800,
    throughputDisplay: '124,800 GB/s',
    ringLatencyDisplay: '0.01 µs',
    overlapPct: '99.40%',
  },
  {
    id: 'GAMMA',
    label: 'CONTEXT-CORRIDOR-GAMMA (NON-BLOCKING-P2P-KV-ROUTER)',
    shortCode: 'CORRIDOR-GAMMA',
    throughputNum: 128400,
    throughputDisplay: '128,400 GB/s',
    ringLatencyDisplay: '0.01 µs',
    overlapPct: '99.82%',
  },
  {
    id: 'DELTA',
    label: 'CONTEXT-CORRIDOR-DELTA (FALLBACK-SINGLE-DEVICE-PASS)',
    shortCode: 'CORRIDOR-DELTA',
    throughputNum: 64500,
    throughputDisplay: '64,500 GB/s',
    ringLatencyDisplay: '0.08 µs',
    overlapPct: '51.44%',
  },
];

type TabKey = 'Mesh' | 'Ring' | 'Seq_' | 'Stats' | 'APA';

const TABS: TabKey[] = ['Mesh', 'Ring', 'Seq_', 'Stats', 'APA'];

type SegmentData = {
  id: number;
  title: string;
  shortTag: string;
  hex: string;
  inspectorPtr: string;
  tokens: string;
  ringLoad: string;
  syncLoad: string;
  latency: string;
  status: string;
  peerNext: number;
};

export default function App() {
  const [selectedCorridorId, setSelectedCorridorId] = useState<string>('ALPHA');
  const [activeTab, setActiveTab] = useState<TabKey>('Mesh');
  const [selectedSegmentIndex, setSelectedSegmentIndex] = useState<number>(3);
  const [burstActive, setBurstActive] = useState<boolean>(false);
  const [spikeActive, setSpikeActive] = useState<boolean>(false);
  const [ringStep, setRingStep] = useState<number>(0);
  const [processedTokens, setProcessedTokens] = useState<number>(27800000);
  const [engineXp, setEngineXp] = useState<number>(75.0);
  const [apaNotice, setApaNotice] = useState<string>(
    'SOVEREIGN APA TITLE READY · CLUSTER-006 · ZERO LICENSING · 100% IP TRANSFER'
  );
  const [radioLogs, setRadioLogs] = useState<[string, string]>([
    '[00:01.04] 🟢 CREW CHIEF: Asynchronous context parallelism and ring-attention engine initialized · 8 segments linked',
    '[00:01.08] 🟢 TELEMETRY: Peer-to-peer ring KV exchange verified at 130,200 GB/s across million-token context',
  ]);

  const currentCorridor =
    SYNTHETIC_CORRIDORS.find((c) => c.id === selectedCorridorId) || SYNTHETIC_CORRIDORS[0];

  const computeThroughputDisplay = (): string => {
    if (burstActive && !spikeActive && selectedCorridorId === 'ALPHA') {
      return '145,800 GB/s';
    }
    if (spikeActive) {
      return '126,300 GB/s';
    }
    return currentCorridor.throughputDisplay;
  };

  const computeLatencyDisplay = (): string => {
    if (spikeActive) {
      return '0.03 µs';
    }
    return currentCorridor.ringLatencyDisplay;
  };

  const segments: SegmentData[] = Array.from({ length: 8 }, (_, idx) => {
    const peerNext = (idx + ringStep + 1) % 8;
    const isRerouted = spikeActive && (idx === 2 || idx === 5);
    const hexBase = '0x5000' + String(idx);
    const inspectorPtr = '0x500' + String(idx) + '0';
    return {
      id: idx,
      title: 'Segment ' + String(idx) + ' (S' + String(idx) + ')',
      shortTag: 'S' + String(idx),
      hex: idx === 0 ? '0x50000' : hexBase,
      inspectorPtr,
      tokens: burstActive ? '512K' : '256K',
      ringLoad: isRerouted ? '94%' : '100%',
      syncLoad: isRerouted ? '98%' : '100%',
      latency: isRerouted ? '0.04ms' : burstActive ? '0.01ms' : '0.02ms',
      status: isRerouted ? 'REROUTED · LOCKED' : 'SHIFTED · LOCKED',
      peerNext,
    };
  });

  const activeSeg = segments[selectedSegmentIndex] || segments[3];

  const handleCorridorChange = (newId: string) => {
    setSelectedCorridorId(newId);
    const found = SYNTHETIC_CORRIDORS.find((c) => c.id === newId) || SYNTHETIC_CORRIDORS[0];
    setRadioLogs([
      '[00:02.12] 🟢 CREW CHIEF: Switched active fabric to ' + found.label,
      '[00:02.16] 🟢 TELEMETRY: Ring barrier locked at ' +
        found.throughputDisplay +
        ' · Overlap efficiency ' +
        found.overlapPct,
    ]);
  };

  const handleTriggerBurst = () => {
    const nextBurst = !burstActive;
    setBurstActive(nextBurst);
    if (nextBurst) {
      setProcessedTokens((prev) => prev + 4200000);
      setEngineXp((prev) => Number((prev + 12.5).toFixed(1)));
      setRadioLogs([
        '[00:03.02] 🟠 CREW CHIEF: Context Parallelism Burst engaged · 512K tokens/segment sharded across S0..S7',
        '[00:03.05] 🟢 TELEMETRY: Non-blocking P2P ring saturation boosted to 145,800 GB/s · Zero OOM overhead',
      ]);
    } else {
      setRadioLogs([
        '[00:03.40] 🟢 CREW CHIEF: Context Parallelism Burst normalized back to 256K tokens/segment baseline',
        '[00:03.44] 🟢 TELEMETRY: Peer-to-peer ring KV exchange verified at 130,200 GB/s across million-token context',
      ]);
    }
  };

  const handleToggleSpike = () => {
    const nextSpike = !spikeActive;
    setSpikeActive(nextSpike);
    if (nextSpike) {
      setRadioLogs([
        '[00:04.11] 🔵 CREW CHIEF: Ring Latency Spike injected on S2/S5 · Dynamic P2P KV Re-Routing engaged',
        '[00:04.15] 🟢 TELEMETRY: Sub-microsecond barrier compensated at 0.03 µs · Zero host CPU stall',
      ]);
    } else {
      setRadioLogs([
        '[00:04.52] 🟢 CREW CHIEF: Ring Latency Spike cleared · All 8 segments locked at 100% ring load',
        '[00:04.56] 🟢 TELEMETRY: Peer-to-peer ring KV exchange verified at 130,200 GB/s across million-token context',
      ]);
    }
  };

  const handleStepRingPass = () => {
    const nextStep = (ringStep + 1) % 8;
    setRingStep(nextStep);
    setProcessedTokens((prev) => prev + 1024000);
    setEngineXp((prev) => Number((prev + 2.5).toFixed(1)));
    setRadioLogs([
      '[00:05.20] 🟢 CREW CHIEF: Stepped Asynchronous Ring Pass #' +
        String(nextStep) +
        ' · Non-blocking KV shard permutation complete',
      '[00:05.24] 🟢 TELEMETRY: C_context interlock verified across S0..S7 · 0.01 µs barrier sync',
    ]);
  };

  const handleFlushArenas = () => {
    setBurstActive(false);
    setSpikeActive(false);
    setRingStep(0);
    setSelectedCorridorId('ALPHA');
    setSelectedSegmentIndex(3);
    setProcessedTokens(27800000);
    setEngineXp(75.0);
    setRadioLogs([
      '[00:01.04] 🟢 CREW CHIEF: Asynchronous context parallelism and ring-attention engine initialized · 8 segments linked',
      '[00:01.08] 🟢 TELEMETRY: Peer-to-peer ring KV exchange verified at 130,200 GB/s across million-token context',
    ]);
  };

  const vectorDisplay = burstActive
    ? '[9.99, 10.00, 9.99, 10.00]'
    : spikeActive
      ? '[9.95, 9.97, 9.96, 9.98]'
      : '[9.98, 9.99, 9.98, 9.99]';

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans select-none">
      {/* TOP HEADER ROW 1 */}
      <header className="flex flex-col gap-0.5 w-full shrink-0">
        <div className="flex items-center justify-between gap-1 w-full shrink-0">
          {/* Left: Strictly GF-T3-341 and cyan badge FLAGSHIP */}
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <h1 className="text-sm sm:text-base font-mono font-bold tracking-tight text-white">
              GF-T3-341
            </h1>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-cyan-950/90 text-[#00F0FF] border border-cyan-500/50 rounded">
              FLAGSHIP
            </span>
          </div>

          {/* Right: Compact corridor dropdown and micro action buttons [Ring], [Seq_], [Run] */}
          <div className="flex items-center gap-1 shrink-0 overflow-hidden">
            <select
              aria-label="Synthetic Context Corridor"
              value={selectedCorridorId}
              onChange={(e) => handleCorridorChange(e.target.value)}
              className="max-w-[120px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 text-cyan-300 border border-slate-700 rounded shrink-0 focus:outline-none focus:border-cyan-400"
            >
              {SYNTHETIC_CORRIDORS.map((corr) => (
                <option key={corr.id} value={corr.id}>
                  {corr.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                setActiveTab('Ring');
                handleStepRingPass();
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 bg-slate-900 hover:bg-cyan-950 text-cyan-300 border border-slate-700 hover:border-cyan-500 rounded transition-colors cursor-pointer"
            >
              [Ring]
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('Seq_');
                handleTriggerBurst();
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 bg-slate-900 hover:bg-amber-950 text-amber-300 border border-slate-700 hover:border-amber-500 rounded transition-colors cursor-pointer"
            >
              [Seq_]
            </button>
            <button
              type="button"
              onClick={handleStepRingPass}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-600/60 rounded transition-colors cursor-pointer"
            >
              [Run]
            </button>
          </div>
        </div>

        {/* TOP HEADER ROW 2 */}
        <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap truncate">
          Context Parallelism · Ring-Attention · Million-Token Scaling
        </div>
      </header>

      {/* 4-CARD ARCADE HUD RIBBON (2x2 Grid Above the Fold) */}
      <section
        aria-label="Arcade Telemetry HUD"
        className="grid grid-cols-2 gap-1.5 w-full shrink-0 my-0.5"
      >
        {/* Card 1: RING NITRO */}
        <div className="bg-slate-900/75 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              RING NITRO
            </span>
            <span className="text-[10px] font-mono text-cyan-400">
              OVERLAP: {currentCorridor.overlapPct}
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-[#00F0FF] leading-tight truncate">
            {computeThroughputDisplay()}
          </div>
          <div className="w-full bg-slate-950 h-1 rounded overflow-hidden my-0.5 border border-slate-800">
            <div
              className={
                'h-full bg-[#00F0FF] transition-transform duration-150 origin-left ' +
                (selectedCorridorId === 'DELTA' ? 'scale-x-50' : 'scale-x-100')
              }
            />
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Sequence Throughput Saturation
          </div>
        </div>

        {/* Card 2: STEP STREAK */}
        <div className="bg-slate-900/75 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              STEP STREAK
            </span>
            <span className="text-[10px] font-mono font-bold text-[#FF9F0A]">
              🔥 RING-ATTN
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-amber-400 leading-tight truncate">
            {computeLatencyDisplay()}
          </div>
          <div className="text-[9px] font-mono text-emerald-400 truncate">
            BARRIER STEP #{ringStep} · P2P NON-BLOCKING
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Ring Step Latency
          </div>
        </div>

        {/* Card 3: ACTIVE SEGMENTS */}
        <div className="bg-slate-900/75 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              ACTIVE SEGMENTS
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-400">
              LOCKED
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-white leading-tight truncate">
            SEGMENTS: 8/8
          </div>
          <div className="flex items-center gap-0.5 font-mono text-[9px]">
            {segments.map((seg) => (
              <span
                key={seg.id}
                className={
                  'px-1 rounded ' +
                  (seg.id === selectedSegmentIndex
                    ? 'bg-cyan-500 text-black font-bold'
                    : 'bg-slate-950 text-cyan-300 border border-slate-800')
                }
              >
                S{seg.id}
              </span>
            ))}
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            F1 Gear Shift Ring Topology [S0..S7]
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="bg-slate-900/75 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              TOKEN SCORE
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-400">
              +{engineXp.toFixed(1)}k ENGINE XP
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-white leading-tight truncate">
            {processedTokens.toLocaleString('en-US')} UNITS
          </div>
          <div className="text-[9px] font-mono text-cyan-300 truncate">
            MILLION-TOKEN WINDOW · ZERO OOM
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Context State: Active
          </div>
        </div>
      </section>

      {/* 5 HORIZONTAL TABS */}
      <nav
        aria-label="Cockpit Mode Tabs"
        className="grid grid-cols-5 gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg my-1 w-full text-center shrink-0"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={
                'py-1 text-xs font-mono font-bold rounded transition-colors cursor-pointer whitespace-nowrap truncate ' +
                (isActive
                  ? 'bg-[#00F0FF] text-slate-950'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70')
              }
            >
              {tab}
            </button>
          );
        })}
      </nav>

      {/* STREAMLINED MESH INFO SUBHEADER (Strictly single row, zero action buttons) */}
      <div className="text-[10px] font-mono whitespace-nowrap overflow-hidden text-slate-300 px-1 shrink-0">
        VIEW: MESH · PTR: 0x4AF8DC0 · MODE: CONTEXT_PARALLELISM · SEGS: 8 · VEC: {vectorDisplay}
      </div>

      {/* INTERACTIVE SEGMENT MATRIX BAY (S0-S7) + TAB TELEMETRY OVERLAY */}
      <main className="flex flex-col justify-center shrink-0">
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950/80 border border-slate-800/90 rounded-lg">
          {segments.map((seg) => {
            const isSelected = seg.id === selectedSegmentIndex;
            return (
              <div
                key={seg.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedSegmentIndex(seg.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSelectedSegmentIndex(seg.id);
                  }
                }}
                className={
                  'p-1.5 rounded border transition-colors cursor-pointer flex flex-col justify-between gap-0.5 ' +
                  (isSelected
                    ? 'bg-slate-900 border-[#00F0FF]'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-600')
                }
              >
                {/* Line 1 (Title & Hex) */}
                <div className="text-[10px] font-mono font-bold text-white flex justify-between items-center w-full">
                  <span>{seg.title}</span>
                  <span className="text-slate-400 font-normal">{seg.hex}</span>
                </div>

                {/* Line 2 (Tokens & Ring Load) */}
                <div className="text-[8px] font-mono font-bold text-cyan-300 flex justify-between items-center w-full px-1">
                  <span>TOK: {seg.tokens}</span>
                  <span>RING: {seg.ringLoad}</span>
                </div>

                {/* Line 3 (Latency & Status) */}
                <div className="flex justify-between items-center text-[8px] font-mono text-slate-300 w-full px-1">
                  <span className="text-amber-400">{seg.latency}</span>
                  <span className="text-emerald-400">{seg.status}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Contextual Tab Bar Strip for Ring / Seq_ / Stats / APA */}
        {activeTab === 'APA' ? (
          <div className="mt-1 p-1.5 bg-slate-900/95 border border-amber-500/40 rounded-lg flex flex-col gap-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-200">
              <span className="font-bold text-[#FF9F0A]">
                CHASSIS: GF-T3-341 · CLUSTER-006
              </span>
              <span className="text-cyan-300">
                Retail Price: 75,000 - 150,000+ UNITS · APA Anchor: 35,000 - 65,000 UNITS
              </span>
            </div>
            <div className="text-[9px] font-mono text-emerald-300 truncate">
              {apaNotice}
            </div>
            <div className="flex flex-col gap-2 w-full">
              <button
                type="button"
                onClick={() =>
                  setApaNotice(
                    'APA TITLE TRANSFER DISPATCHED · CHASSIS GF-T3-341 LOCKED FOR SOVEREIGN ESCROW CLOSING'
                  )
                }
                className="w-full py-1 px-2 text-[10px] font-mono font-bold bg-[#FF9F0A] text-slate-950 rounded hover:bg-amber-400 transition-colors cursor-pointer text-center"
              >
                ACQUIRE TITLE (APA)
              </button>
              <button
                type="button"
                onClick={() =>
                  setApaNotice(
                    'CLUSTER-006 VAULT INQUIRY LOGGED · 50-UNIT CARVE-OUT FLOOR VERIFIED · ZERO EQUITY DILUTION'
                  )
                }
                className="w-full py-1 px-2 text-[10px] font-mono font-bold bg-slate-800 text-[#00F0FF] border border-cyan-500/50 rounded hover:bg-slate-700 transition-colors cursor-pointer text-center"
              >
                INQUIRE VAULT BUYOUT
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-0.5 px-2 py-0.5 bg-slate-900/60 border border-slate-800/80 rounded flex items-center justify-between text-[9px] font-mono text-slate-300">
            <span>
              ACTIVE TAB: <strong className="text-white">{activeTab.toUpperCase()}</strong> · CORRIDOR:{' '}
              <strong className="text-cyan-300">{currentCorridor.shortCode}</strong>
            </span>
            <span>
              FORMULA: C_context = SUM_k R(Q_local, K_ring_peer, V_ring_peer, phi_p2p) · HOP:{' '}
              {ringStep}/8
            </span>
          </div>
        )}
      </main>

      {/* COMPACT RING TELEMETRY INSPECTOR STRIP */}
      <div className="text-[11px] font-mono whitespace-nowrap overflow-hidden text-cyan-300 font-bold px-2 py-0.5 bg-black/60 border border-slate-800 rounded my-0.5 shrink-0">
        {activeSeg.shortTag} · TOK: {activeSeg.tokens} · RING: {activeSeg.ringLoad} · SYNC:{' '}
        {activeSeg.syncLoad} · PTR {activeSeg.inspectorPtr} · ATTN: OK · LOCKED · SEGS: 8 ·
        TOPOLOGY: RING
      </div>

      {/* TACTICAL LAUNCH CONTROL SWITCHES */}
      <section
        aria-label="Tactical Launch Control Switches"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1"
      >
        <button
          type="button"
          onClick={handleTriggerBurst}
          className="border-amber-500/80 bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 text-[8px] sm:text-[9px] md:text-xs font-mono font-bold py-1.5 px-0.5 whitespace-nowrap text-center truncate border rounded w-full transition-colors cursor-pointer"
        >
          💥 INJECT CONTEXT PARALLELISM BURST
        </button>

        <button
          type="button"
          onClick={handleToggleSpike}
          className="border-cyan-400/80 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-200 text-[8px] sm:text-[9px] md:text-xs font-mono font-bold py-1.5 px-0.5 whitespace-nowrap text-center truncate border rounded w-full transition-colors cursor-pointer"
        >
          ⚡ TOGGLE RING LATENCY SPIKE
        </button>

        <button
          type="button"
          onClick={handleStepRingPass}
          className="border-emerald-500/80 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 text-[8px] sm:text-[9px] md:text-xs font-mono font-bold py-1.5 px-0.5 whitespace-nowrap text-center truncate border rounded w-full transition-colors cursor-pointer"
        >
          🚀 STEP ASYNCHRONOUS RING PASS
        </button>

        <button
          type="button"
          onClick={handleFlushArenas}
          className="border-rose-500/80 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-[8px] sm:text-[9px] md:text-xs font-mono font-bold py-1.5 px-0.5 whitespace-nowrap text-center truncate border rounded w-full transition-colors cursor-pointer"
        >
          🔄 FLUSH CONTEXT ARENAS
        </button>
      </section>

      {/* PIT-WALL RADIO COMMS LOG */}
      <footer className="h-8 overflow-hidden font-mono text-[9px] px-2 py-0.5 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-normal flex flex-col justify-center">
        <div className="truncate">{radioLogs[0]}</div>
        <div className="truncate">{radioLogs[1]}</div>
      </footer>
    </div>
  );
}
