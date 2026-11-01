/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

type TabKey = 'Mesh' | 'Batc' | 'Schd' | 'Stats' | 'APA';

interface SlotData {
  id: number;
  code: string;
  title: string;
  hex: string;
  inspectorHex: string;
  tokLabel: string;
  slotLoad: string;
  syncPct: string;
  latency: string;
  status: string;
  bubbles: string;
  seqId: string;
}

const CORRIDORS: string[] = [
  'BATCH-CORRIDOR-ALPHA (DYNAMIC-ITERATION-SCHEDULING-FABRIC · 140200-GB/S)',
  'BATCH-CORRIDOR-BRAVO (CONTINUOUS-BATCHING-ENGINE)',
  'BATCH-CORRIDOR-GAMMA (NON-BLOCKING-SLOT-ALLOCATOR-ROUTER)',
  'BATCH-CORRIDOR-DELTA (FALLBACK-STATIC-BATCH-PASS)',
];

const INITIAL_SLOTS: SlotData[] = [
  {
    id: 0,
    code: 'SL0',
    title: 'Slot 0 (SL0)',
    hex: '0x55000',
    inspectorHex: '0x55000',
    tokLabel: '256K',
    slotLoad: '100%',
    syncPct: '100%',
    latency: '0.02ms',
    status: 'SCHEDULED · LOCKED',
    bubbles: '0.0',
    seqId: 'REQ-INIT-000',
  },
  {
    id: 1,
    code: 'SL1',
    title: 'Slot 1 (SL1)',
    hex: '0x55010',
    inspectorHex: '0x55010',
    tokLabel: '256K',
    slotLoad: '100%',
    syncPct: '100%',
    latency: '0.02ms',
    status: 'SCHEDULED · LOCKED',
    bubbles: '0.0',
    seqId: 'REQ-INIT-001',
  },
  {
    id: 2,
    code: 'SL2',
    title: 'Slot 2 (SL2)',
    hex: '0x55020',
    inspectorHex: '0x55020',
    tokLabel: '256K',
    slotLoad: '100%',
    syncPct: '100%',
    latency: '0.02ms',
    status: 'SCHEDULED · LOCKED',
    bubbles: '0.0',
    seqId: 'REQ-INIT-002',
  },
  {
    id: 3,
    code: 'SL3',
    title: 'Slot 3 (SL3)',
    hex: '0x55030',
    inspectorHex: '0x55030',
    tokLabel: '256K',
    slotLoad: '100%',
    syncPct: '100%',
    latency: '0.02ms',
    status: 'SCHEDULED · LOCKED',
    bubbles: '0.0',
    seqId: 'REQ-INIT-003',
  },
  {
    id: 4,
    code: 'SL4',
    title: 'Slot 4 (SL4)',
    hex: '0x55040',
    inspectorHex: '0x55040',
    tokLabel: '256K',
    slotLoad: '100%',
    syncPct: '100%',
    latency: '0.02ms',
    status: 'SCHEDULED · LOCKED',
    bubbles: '0.0',
    seqId: 'REQ-INIT-004',
  },
  {
    id: 5,
    code: 'SL5',
    title: 'Slot 5 (SL5)',
    hex: '0x55050',
    inspectorHex: '0x55050',
    tokLabel: '256K',
    slotLoad: '100%',
    syncPct: '100%',
    latency: '0.02ms',
    status: 'SCHEDULED · LOCKED',
    bubbles: '0.0',
    seqId: 'REQ-INIT-005',
  },
  {
    id: 6,
    code: 'SL6',
    title: 'Slot 6 (SL6)',
    hex: '0x55060',
    inspectorHex: '0x55060',
    tokLabel: '256K',
    slotLoad: '100%',
    syncPct: '100%',
    latency: '0.02ms',
    status: 'SCHEDULED · LOCKED',
    bubbles: '0.0',
    seqId: 'REQ-INIT-006',
  },
  {
    id: 7,
    code: 'SL7',
    title: 'Slot 7 (SL7)',
    hex: '0x55070',
    inspectorHex: '0x55070',
    tokLabel: '256K',
    slotLoad: '100%',
    syncPct: '100%',
    latency: '0.02ms',
    status: 'SCHEDULED · LOCKED',
    bubbles: '0.0',
    seqId: 'REQ-INIT-007',
  },
];

const INITIAL_LOGS: string[] = [
  '[00:01.04] 🟢 CREW CHIEF: Asynchronous continuous batching and in-flight request scheduling engine initialized · 8 slots linked',
  '[00:01.08] 🟢 TELEMETRY: Iteration-level request interleaving verified at 140,200 GB/s with zero GPU idle bubbles',
];

export default function App() {
  const [selectedCorridor, setSelectedCorridor] = useState<string>(CORRIDORS[0]);
  const [activeTab, setActiveTab] = useState<TabKey>('Mesh');
  const [slots, setSlots] = useState<SlotData[]>(INITIAL_SLOTS);
  const [selectedSlotIdx, setSelectedSlotIdx] = useState<number>(3);
  const [throughputGbs, setThroughputGbs] = useState<number>(140200);
  const [latencyUs, setLatencyUs] = useState<string>('0.01');
  const [processedTokens, setProcessedTokens] = useState<number>(31800000);
  const [engineXpK, setEngineXpK] = useState<number>(75.0);
  const [surgeActive, setSurgeActive] = useState<boolean>(false);
  const [iterationPass, setIterationPass] = useState<number>(1);
  const [vecState, setVecState] = useState<string>('[1.03, 1.04, 1.03, 1.04]');
  const [radioLogs, setRadioLogs] = useState<string[]>(INITIAL_LOGS);
  const [apaNotice, setApaNotice] = useState<string>(
    'PURE APA SOVEREIGN TITLE TRANSFER READY · ZERO LICENSES · ZERO DILUTION'
  );

  const selectedSlot = slots[selectedSlotIdx] || slots[3];

  const pushRadioLog = (line1: string, line2: string) => {
    setRadioLogs([line1, line2]);
  };

  const handleCorridorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextCorridor = e.target.value;
    setSelectedCorridor(nextCorridor);
    if (nextCorridor.includes('ALPHA')) {
      setThroughputGbs(140200);
      setLatencyUs('0.01');
    } else if (nextCorridor.includes('BRAVO')) {
      setThroughputGbs(136400);
      setLatencyUs('0.01');
    } else if (nextCorridor.includes('GAMMA')) {
      setThroughputGbs(138900);
      setLatencyUs('0.01');
    } else {
      setThroughputGbs(112500);
      setLatencyUs('0.02');
    }
    pushRadioLog(
      '[00:02.12] 🟢 CREW CHIEF: Synthetic corridor switched to ' + nextCorridor,
      '[00:02.16] 🟢 TELEMETRY: Non-blocking slot allocator router locked with 0.0 GPU bubbles'
    );
  };

  const handleInjectContinuousBatchingBurst = () => {
    const nextStep = iterationPass + 1;
    setIterationPass(nextStep);
    setThroughputGbs(148600);
    setLatencyUs('0.01');
    setProcessedTokens((prev) => prev + 1250000);
    setEngineXpK((prev) => Number((prev + 5.0).toFixed(1)));
    setVecState('[1.06, 1.07, 1.06, 1.07]');

    const updated = slots.map((s, idx) => ({
      ...s,
      tokLabel: String(256 + (idx + 1) * 16) + 'K',
      slotLoad: '100%',
      latency: '0.01ms',
      status: 'SCHEDULED · LOCKED',
      seqId: 'BURST-SEQ-' + String(nextStep) + '-' + String(idx),
    }));
    setSlots(updated);

    pushRadioLog(
      '[00:03.40] 🟢 CREW CHIEF: Continuous Batching Burst injected across SL0..SL7 · Iteration ' +
        String(nextStep),
      '[00:03.44] 🟢 TELEMETRY: Batch Throughput: 148,600 GB/s · Scheduling Latency: 0.01 µs · Active Slots: 8 Slots'
    );
  };

  const handleToggleRequestSurgeSpike = () => {
    const nextSurge = !surgeActive;
    setSurgeActive(nextSurge);
    const nextStep = iterationPass + 1;
    setIterationPass(nextStep);

    if (nextSurge) {
      setThroughputGbs(154800);
      setLatencyUs('0.01');
      setProcessedTokens((prev) => prev + 640000);
      setEngineXpK((prev) => Number((prev + 2.5).toFixed(1)));
      setVecState('[1.08, 1.09, 1.08, 1.09]');
      setSlots(
        slots.map((s, idx) => ({
          ...s,
          tokLabel: '512K',
          slotLoad: '100%',
          latency: '0.01ms',
          status: 'SCHEDULED · LOCKED',
          seqId: 'SURGE-REQ-' + String(nextStep) + '-' + String(idx),
        }))
      );
      pushRadioLog(
        '[00:04.18] 🟢 CREW CHIEF: Request Surge Spike active · Dynamic non-blocking slot re-allocation engaged',
        '[00:04.22] 🟢 TELEMETRY: Sub-microsecond barrier handoff verified at 154,800 GB/s · Zero host CPU stalls'
      );
    } else {
      setThroughputGbs(140200);
      setLatencyUs('0.01');
      setVecState('[1.03, 1.04, 1.03, 1.04]');
      setSlots(
        slots.map((s, idx) => ({
          ...s,
          tokLabel: '256K',
          slotLoad: '100%',
          latency: '0.02ms',
          status: 'SCHEDULED · LOCKED',
          seqId: 'REQ-NOM-' + String(nextStep) + '-' + String(idx),
        }))
      );
      pushRadioLog(
        '[00:04.50] 🟢 CREW CHIEF: Request Surge Spike normalized · Returning to baseline continuous batching',
        '[00:04.54] 🟢 TELEMETRY: Batch Throughput: 140,200 GB/s · Active Slots: 8 Slots · Batch State: Active'
      );
    }
  };

  const handleStepAsynchronousSchedulingPass = () => {
    const nextStep = iterationPass + 1;
    setIterationPass(nextStep);
    setProcessedTokens((prev) => prev + 256000);
    setEngineXpK((prev) => Number((prev + 1.5).toFixed(1)));

    const rotated = slots.map((s, idx) => ({
      ...s,
      tokLabel: idx === selectedSlotIdx ? '384K' : '256K',
      latency: '0.01ms',
      status: 'SCHEDULED · LOCKED',
      seqId: 'STEP-' + String(nextStep) + '-SL' + String(idx),
    }));
    setSlots(rotated);

    pushRadioLog(
      '[00:05.10] 🟢 CREW CHIEF: Step Asynchronous Scheduling Pass #' +
        String(nextStep) +
        ' completed · Ejected finished sequences',
      '[00:05.14] 🟢 TELEMETRY: Spliced queued requests in-flight · Scheduling Latency: 0.01 µs · Bubbles: 0.0'
    );
  };

  const handleFlushBatchArenas = () => {
    setIterationPass(1);
    setSurgeActive(false);
    setThroughputGbs(140200);
    setLatencyUs('0.01');
    setProcessedTokens(31800000);
    setEngineXpK(75.0);
    setVecState('[1.03, 1.04, 1.03, 1.04]');
    setSlots(INITIAL_SLOTS);
    setSelectedSlotIdx(3);
    setRadioLogs(INITIAL_LOGS);
  };

  const formattedThroughput = throughputGbs.toLocaleString('en-US') + ' GB/s';
  const formattedTokens = processedTokens.toLocaleString('en-US') + ' UNITS';
  const formattedXp = '+' + engineXpK.toFixed(1) + 'k ENGINE XP';

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans">
      {/* Top Header Row 1 */}
      <header className="flex flex-col gap-0.5 w-full shrink-0">
        <div className="flex items-center justify-between gap-1 w-full shrink-0">
          {/* Left: Strict GF-T3-346 Title & FLAGSHIP Badge */}
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <h1 className="text-sm sm:text-base font-mono font-bold tracking-tight text-white">
              GF-T3-346
            </h1>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-cyan-500/20 text-[#00F0FF] border border-cyan-500/40 rounded">
              FLAGSHIP
            </span>
          </div>

          {/* Right: Compact Corridor Dropdown & Micro Action Buttons */}
          <div className="flex items-center gap-1 shrink-0 overflow-hidden">
            <select
              aria-label="Synthetic Batching Corridor"
              value={selectedCorridor}
              onChange={handleCorridorChange}
              className="max-w-[120px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 text-cyan-300 border border-slate-700 rounded shrink-0 focus:outline-none focus:border-cyan-400"
            >
              {CORRIDORS.map((corridor) => (
                <option key={corridor} value={corridor}>
                  {corridor}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                setActiveTab('Batc');
                handleInjectContinuousBatchingBurst();
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 rounded cursor-pointer"
            >
              [Batc]
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('Schd');
                handleStepAsynchronousSchedulingPass();
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 rounded cursor-pointer"
            >
              [Schd]
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('Mesh');
                handleStepAsynchronousSchedulingPass();
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 rounded cursor-pointer"
            >
              [Run]
            </button>
          </div>
        </div>

        {/* Top Header Row 2 */}
        <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap">
          Continuous Batching · In-Flight Scheduling · Zero GPU Bubbles
        </div>
      </header>

      {/* 4-Card Arcade HUD Ribbon (2x2 Grid) */}
      <section className="grid grid-cols-2 gap-1.5 w-full shrink-0 my-0.5">
        {/* Card 1: BATCH NITRO */}
        <div className="p-1.5 bg-slate-900/80 border border-slate-800 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="font-bold text-slate-200">BATCH NITRO</span>
            <span className="text-cyan-400">10X SATURATION</span>
          </div>
          <div className="text-[#00F0FF] font-mono text-lg font-bold leading-tight">
            {formattedThroughput}
          </div>
          <div className="w-full bg-slate-950 h-1.5 rounded overflow-hidden border border-slate-800 my-0.5">
            <div className="bg-[#00F0FF] h-full w-full" />
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Batch Throughput Saturation · Batch Throughput: {formattedThroughput}
          </div>
        </div>

        {/* Card 2: SCHD STREAK */}
        <div className="p-1.5 bg-slate-900/80 border border-slate-800 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="font-bold text-slate-200">SCHD STREAK</span>
            <span className="text-[#FF9F0A] font-bold">🔥 IN-FLIGHT</span>
          </div>
          <div className="text-[#FF9F0A] font-mono text-lg font-bold leading-tight">
            {latencyUs} µs
          </div>
          <div className="text-[10px] font-mono text-emerald-400 truncate">
            BARRIER SYNC: 0.008 µs · ZERO HOST STALLS
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Scheduling Latency · Scheduling Latency: {latencyUs} µs
          </div>
        </div>

        {/* Card 3: ACTIVE SLOTS */}
        <div className="p-1.5 bg-slate-900/80 border border-slate-800 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="font-bold text-slate-200">ACTIVE SLOTS</span>
            <span className="text-emerald-400 font-bold">SLOTS: 8/8</span>
          </div>
          <div className="grid grid-cols-8 gap-0.5 my-0.5">
            {slots.map((slot, idx) => (
              <button
                key={slot.code}
                type="button"
                onClick={() => setSelectedSlotIdx(idx)}
                className={
                  'text-[8px] font-mono font-bold py-0.5 rounded text-center cursor-pointer border ' +
                  (selectedSlotIdx === idx
                    ? 'bg-cyan-500/30 text-white border-cyan-400'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40')
                }
              >
                {slot.code}
              </button>
            ))}
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Active Slots: 8 Slots · [SL0..SL7] Interlocked
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="p-1.5 bg-slate-900/80 border border-slate-800 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="font-bold text-slate-200">TOKEN SCORE</span>
            <span className="text-amber-400 font-bold">{formattedXp}</span>
          </div>
          <div className="text-emerald-400 font-mono text-lg font-bold leading-tight truncate">
            {formattedTokens}
          </div>
          <div className="text-[10px] font-mono text-cyan-300 truncate">
            Processed Tokens: { processedTokens.toLocaleString('en-US') } Units
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Batch State: Active
          </div>
        </div>
      </section>

      {/* 5 Horizontal Tabs */}
      <nav className="grid grid-cols-5 gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg my-1 w-full text-center shrink-0">
        {(['Mesh', 'Batc', 'Schd', 'Stats', 'APA'] as TabKey[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={
              'py-1 text-xs font-mono font-bold rounded transition-colors cursor-pointer whitespace-nowrap ' +
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
      <div className="text-[10px] font-mono whitespace-nowrap overflow-hidden text-slate-300 px-1 shrink-0">
        {'VIEW: MESH · PTR: 0x55F8DC0 · MODE: CONTINUOUS_BATCHING · SLOTS: 8 · VEC: ' +
          vecState}
      </div>

      {/* Main Interactive Cockpit Bay */}
      <main className="flex-1 flex flex-col justify-between overflow-hidden my-0.5">
        {/* Interactive Slot Matrix Bay (SL0-SL7) */}
        {activeTab !== 'APA' ? (
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950/90 border border-slate-800 rounded-lg w-full flex-1 items-stretch">
            {slots.map((slot, idx) => {
              const isSelected = idx === selectedSlotIdx;
              return (
                <div
                  key={slot.code}
                  onClick={() => setSelectedSlotIdx(idx)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSelectedSlotIdx(idx);
                    }
                  }}
                  className={
                    'p-1.5 rounded border flex flex-col justify-between cursor-pointer transition-colors ' +
                    (isSelected
                      ? 'bg-slate-900 border-[#00F0FF]'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700')
                  }
                >
                  {/* Line 1: Title & Hex */}
                  <div className="text-[10px] font-mono font-bold text-white flex justify-between items-center w-full">
                    <span>{slot.title}</span>
                    <span className="text-slate-400 font-normal">{slot.hex}</span>
                  </div>

                  {/* Line 2: Tokens & Slot Load */}
                  <div className="text-[8px] font-mono font-bold text-cyan-300 flex justify-between items-center w-full px-1">
                    <span>{'TOK: ' + slot.tokLabel}</span>
                    <span>{'SLOT: ' + slot.slotLoad}</span>
                  </div>

                  {/* Line 3: Latency & Status */}
                  <div className="flex justify-between items-center text-[8px] font-mono text-slate-300 w-full px-1">
                    <span className="text-amber-400">{slot.latency}</span>
                    <span className="text-emerald-400">{slot.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* APA Exclusive Sovereignty Panel */
          <div className="p-2 bg-slate-950/90 border border-slate-800 rounded-lg w-full flex-1 flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-white border-b border-slate-800 pb-1">
              <span>CHASSIS: GF-T3-346 · CLUSTER-006 · TRACK 3 FLAGSHIP</span>
              <span className="text-cyan-400">Retail Price: 125,000 UNITS (PURE APA)</span>
            </div>
            <div className="text-[11px] font-mono text-slate-300 leading-tight my-1">
              {apaNotice}
            </div>
            <div className="flex flex-col gap-2 w-full">
              <button
                type="button"
                onClick={() => {
                  setApaNotice(
                    'APA TITLE TRANSFER PACKET ARMED FOR GF-T3-346 · 100% CLEAN-ROOM MIT PROVENANCE VERIFIED'
                  );
                  pushRadioLog(
                    '[00:06.12] 🟢 CREW CHIEF: Sovereign APA Title Transfer dossier prepared for GF-T3-346',
                    '[00:06.15] 🟢 TELEMETRY: All 4 Dyno Gates verified · Zero copyleft · Ready for escrow handoff'
                  );
                }}
                className="w-full py-1.5 px-3 text-xs font-mono font-bold bg-[#00F0FF] text-slate-950 rounded hover:bg-cyan-300 transition-colors cursor-pointer text-center"
              >
                ACQUIRE TITLE (APA)
              </button>
              <button
                type="button"
                onClick={() => {
                  setApaNotice(
                    'VAULT BUYOUT INQUIRY LOGGED FOR GF-T3-346 · CLUSTER-006 ALLOCATION LOCKED'
                  );
                  pushRadioLog(
                    '[00:06.42] 🟢 CREW CHIEF: Institutional Vault Buyout inquiry registered for GF-T3-346',
                    '[00:06.45] 🟢 TELEMETRY: Clean-room standalone repository package staged'
                  );
                }}
                className="w-full py-1.5 px-3 text-xs font-mono font-bold bg-slate-900 text-[#FF9F0A] border border-[#FF9F0A]/60 rounded hover:bg-slate-800 transition-colors cursor-pointer text-center"
              >
                INQUIRE VAULT BUYOUT
              </button>
            </div>
          </div>
        )}

        {/* Compact Batch Telemetry Inspector Strip */}
        <div className="text-[11px] font-mono whitespace-nowrap overflow-hidden text-cyan-300 font-bold px-2 py-0.5 bg-black/60 border border-slate-800 rounded my-0.5 shrink-0">
          {selectedSlot.code +
            ' · TOK: ' +
            selectedSlot.tokLabel +
            ' · SLOT: ' +
            selectedSlot.slotLoad +
            ' · SYNC: ' +
            selectedSlot.syncPct +
            ' · PTR ' +
            selectedSlot.inspectorHex +
            ' · SCHD: OK · LOCKED · SLOTS: 8 · BUBBLES: ' +
            selectedSlot.bubbles}
        </div>
      </main>

      {/* Tactical Launch Control Switches */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1">
        <button
          type="button"
          onClick={handleInjectContinuousBatchingBurst}
          className="text-[8px] sm:text-[9px] md:text-xs font-mono font-bold py-1.5 px-0.5 whitespace-nowrap text-center truncate border rounded w-full border-amber-500/80 bg-amber-950/40 hover:bg-amber-900/60 text-[#FF9F0A] cursor-pointer"
        >
          💥 INJECT CONTINUOUS BATCHING BURST
        </button>

        <button
          type="button"
          onClick={handleToggleRequestSurgeSpike}
          className="text-[8px] sm:text-[9px] md:text-xs font-mono font-bold py-1.5 px-0.5 whitespace-nowrap text-center truncate border rounded w-full border-cyan-400 bg-cyan-950/50 hover:bg-cyan-900/70 text-[#00F0FF] shadow-[0_0_8px_rgba(0,240,255,0.3)] cursor-pointer"
        >
          ⚡ TOGGLE REQUEST SURGE SPIKE
        </button>

        <button
          type="button"
          onClick={handleStepAsynchronousSchedulingPass}
          className="text-[8px] sm:text-[9px] md:text-xs font-mono font-bold py-1.5 px-0.5 whitespace-nowrap text-center truncate border rounded w-full border-emerald-500/80 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 cursor-pointer"
        >
          🚀 STEP ASYNCHRONOUS SCHEDULING PASS
        </button>

        <button
          type="button"
          onClick={handleFlushBatchArenas}
          className="text-[8px] sm:text-[9px] md:text-xs font-mono font-bold py-1.5 px-0.5 whitespace-nowrap text-center truncate border rounded w-full border-rose-500/80 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 cursor-pointer"
        >
          🔄 FLUSH BATCH ARENAS
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
