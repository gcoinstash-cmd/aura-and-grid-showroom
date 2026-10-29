/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import React, { useState } from 'react';

type TabKey = 'Mesh' | 'Btch' | 'Schd' | 'Stats' | 'APA';

interface SlotData {
  id: number;
  shortCode: string;
  title: string;
  hexPtr: string;
   inspectorPtr: string;
  tokLabel: string;
  slotPct: string;
  syncPct: string;
  latencyLabel: string;
  stateLabel: string;
  batchHealth: string;
  seqTag: string;
}

const SYNTHETIC_CORRIDORS: string[] = [
  'BATCH-CORRIDOR-ALPHA (DYNAMIC-CONTINUOUS-BATCHING-FABRIC · 52800-GB/S)',
  'BATCH-CORRIDOR-BRAVO (IN-FLIGHT-TOKEN-SCHEDULER-ENGINE)',
  'BATCH-CORRIDOR-GAMMA (NON-BLOCKING-SLOT-ALLOCATOR-ROUTER)',
  'BATCH-CORRIDOR-DELTA (FALLBACK-STATIC-BATCH-PASS)',
];

const INITIAL_SLOTS: SlotData[] = [
  {
    id: 0,
    shortCode: 'S0',
    title: 'Slot 0 (S0)',
    hexPtr: '0x24000',
    inspectorPtr: '0x24000',
    tokLabel: '256K',
    slotPct: '100%',
    syncPct: '100%',
    latencyLabel: '0.02ms',
    stateLabel: 'IN-FLIGHT · LOCKED',
    batchHealth: 'OK',
    seqTag: 'SEQ-INIT-0',
  },
  {
    id: 1,
    shortCode: 'S1',
    title: 'Slot 1 (S1)',
    hexPtr: '0x24010',
    inspectorPtr: '0x24010',
    tokLabel: '256K',
    slotPct: '100%',
    syncPct: '100%',
    latencyLabel: '0.02ms',
    stateLabel: 'IN-FLIGHT · LOCKED',
    batchHealth: 'OK',
    seqTag: 'SEQ-INIT-1',
  },
  {
    id: 2,
    shortCode: 'S2',
    title: 'Slot 2 (S2)',
    hexPtr: '0x24020',
    inspectorPtr: '0x24020',
    tokLabel: '256K',
    slotPct: '100%',
    syncPct: '100%',
    latencyLabel: '0.02ms',
    stateLabel: 'IN-FLIGHT · LOCKED',
    batchHealth: 'OK',
    seqTag: 'SEQ-INIT-2',
  },
  {
    id: 3,
    shortCode: 'S3',
    title: 'Slot 3 (S3)',
    hexPtr: '0x24030',
    inspectorPtr: '0x24030',
    tokLabel: '256K',
    slotPct: '100%',
    syncPct: '100%',
    latencyLabel: '0.02ms',
    stateLabel: 'IN-FLIGHT · LOCKED',
    batchHealth: 'OK',
    seqTag: 'SEQ-INIT-3',
  },
  {
    id: 4,
    shortCode: 'S4',
    title: 'Slot 4 (S4)',
    hexPtr: '0x24040',
    inspectorPtr: '0x24040',
    tokLabel: '256K',
    slotPct: '100%',
    syncPct: '100%',
    latencyLabel: '0.02ms',
    stateLabel: 'IN-FLIGHT · LOCKED',
    batchHealth: 'OK',
    seqTag: 'SEQ-INIT-4',
  },
  {
    id: 5,
    shortCode: 'S5',
    title: 'Slot 5 (S5)',
    hexPtr: '0x24050',
    inspectorPtr: '0x24050',
    tokLabel: '256K',
    slotPct: '100%',
    syncPct: '100%',
    latencyLabel: '0.02ms',
    stateLabel: 'IN-FLIGHT · LOCKED',
    batchHealth: 'OK',
    seqTag: 'SEQ-INIT-5',
  },
  {
    id: 6,
    shortCode: 'S6',
    title: 'Slot 6 (S6)',
    hexPtr: '0x24060',
    inspectorPtr: '0x24060',
    tokLabel: '256K',
    slotPct: '100%',
    syncPct: '100%',
    latencyLabel: '0.02ms',
    stateLabel: 'IN-FLIGHT · LOCKED',
    batchHealth: 'OK',
    seqTag: 'SEQ-INIT-6',
  },
  {
    id: 7,
    shortCode: 'S7',
    title: 'Slot 7 (S7)',
    hexPtr: '0x24070',
    inspectorPtr: '0x24070',
    tokLabel: '256K',
    slotPct: '100%',
    syncPct: '100%',
    latencyLabel: '0.02ms',
    stateLabel: 'IN-FLIGHT · LOCKED',
    batchHealth: 'OK',
    seqTag: 'SEQ-INIT-7',
  },
];

const INITIAL_LOGS: [string, string] = [
  '[00:01.04] 🟢 CREW CHIEF: Asynchronous continuous batching and in-flight token scheduler engine initialized · 8 slots linked',
  '[00:01.08] 🟢 TELEMETRY: In-flight token scheduling verified at 52,800 GB/s with zero sequence starvation',
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('Mesh');
  const [selectedCorridor, setSelectedCorridor] = useState<string>(SYNTHETIC_CORRIDORS[0]);
  const [slots, setSlots] = useState<SlotData[]>(INITIAL_SLOTS);
  const [selectedSlotId, setSelectedSlotId] = useState<number>(3);
  const [throughputValue, setThroughputValue] = useState<string>('52,800 GB/s');
  const [saturationPct, setSaturationPct] = useState<number>(96);
  const [schedLatency, setSchedLatency] = useState<string>('0.01 µs');
  const [activeSlotsRatio, setActiveSlotsRatio] = useState<string>('SLOTS: 8/8');
  const [tokenScoreUnits, setTokenScoreUnits] = useState<number>(9344000);
  const [engineXpK, setEngineXpK] = useState<string>('+75.0k ENGINE XP');
  const [batchStateText, setBatchStateText] = useState<string>('Batch State: In-Flight Active');
  const [preemptionActive, setPreemptionActive] = useState<boolean>(false);
  const [iterationStep, setIterationStep] = useState<number>(1);
  const [radioLogs, setRadioLogs] = useState<[string, string]>(INITIAL_LOGS);
  const [apaNotice, setApaNotice] = useState<string>(
    'PURE APA SOVEREIGN TITLE TRANSFER READY · ZERO LICENSING · ZERO DILUTION'
  );

  const selectedSlot = slots[selectedSlotId] || slots[3];

  const handleCorridorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextCorridor = e.target.value;
    setSelectedCorridor(nextCorridor);
    if (nextCorridor.indexOf('ALPHA') !== -1) {
      setThroughputValue('52,800 GB/s');
      setSchedLatency('0.01 µs');
      setSaturationPct(96);
    } else if (nextCorridor.indexOf('BRAVO') !== -1) {
      setThroughputValue('54,100 GB/s');
      setSchedLatency('0.01 µs');
      setSaturationPct(98);
    } else if (nextCorridor.indexOf('GAMMA') !== -1) {
      setThroughputValue('53,600 GB/s');
      setSchedLatency('0.01 µs');
      setSaturationPct(97);
    } else {
      setThroughputValue('48,200 GB/s');
      setSchedLatency('0.02 µs');
      setSaturationPct(88);
    }
    setRadioLogs([
      '[00:02.12] 🟢 CREW CHIEF: Switched active fabric to ' + nextCorridor,
      '[00:02.16] 🟢 TELEMETRY: In-flight token scheduling verified at 52,800 GB/s with zero sequence starvation',
    ]);
  };

  const handleTriggerContinuousBatchBurst = () => {
    const nextStep = iterationStep + 1;
    setIterationStep(nextStep);
    setThroughputValue('56,400 GB/s');
    setSaturationPct(100);
    setSchedLatency('0.01 µs');
    const nextTokens = tokenScoreUnits + 512000;
    setTokenScoreUnits(nextTokens);
    setEngineXpK('+82.5k ENGINE XP');
    setBatchStateText('Batch State: In-Flight Active');
    setSlots(
      slots.map((s) => ({
        ...s,
        tokLabel: '320K',
        slotPct: '100%',
        syncPct: '100%',
        latencyLabel: '0.01ms',
        stateLabel: 'IN-FLIGHT · LOCKED',
        batchHealth: 'OK',
        seqTag: 'SEQ-BURST-' + String(nextStep) + '-' + String(s.id),
      }))
    );
    setRadioLogs([
      '[00:03.40] 🟠 CREW CHIEF: Trigger Continuous Batching Burst executed across S0..S7 · 56,400 GB/s peak',
      '[00:03.44] 🟢 TELEMETRY: In-flight token scheduling verified at 52,800 GB/s with zero sequence starvation',
    ]);
  };

  const handleTogglePreemptionSpike = () => {
    const nextPreempt = !preemptionActive;
    setPreemptionActive(nextPreempt);
    if (nextPreempt) {
      setThroughputValue('54,200 GB/s');
      setSchedLatency('0.01 µs');
      setSlots(
        slots.map((s) =>
          s.id >= 6
            ? {
                ...s,
                tokLabel: '256K',
                slotPct: '100%',
                syncPct: '100%',
                latencyLabel: '0.01ms',
                stateLabel: 'PREEMPT · LOCKED',
                batchHealth: 'OK',
                seqTag: 'SEQ-URGENT-S' + String(s.id),
              }
            : s
        )
      );
      setRadioLogs([
        '[00:04.18] ⚡ CREW CHIEF: Inject Request Preemption Spike (Force Dynamic Slot Eviction) active on S6..S7',
        '[00:04.22] 🟢 TELEMETRY: Reclaimed KV cache slots re-bound in 0.01 µs with zero sequence starvation',
      ]);
    } else {
      setThroughputValue('52,800 GB/s');
      setSchedLatency('0.01 µs');
      setSlots(INITIAL_SLOTS);
      setRadioLogs(INITIAL_LOGS);
    }
  };

  const handleStepInFlightPass = () => {
    const nextStep = iterationStep + 1;
    setIterationStep(nextStep);
    const nextTokens = tokenScoreUnits + 256000;
    setTokenScoreUnits(nextTokens);
    setThroughputValue('52,800 GB/s');
    setSchedLatency('0.01 µs');
    setEngineXpK('+77.5k ENGINE XP');
    setSlots(
      slots.map((s) => ({
        ...s,
        tokLabel: '256K',
        slotPct: '100%',
        syncPct: '100%',
        latencyLabel: '0.02ms',
        stateLabel: 'IN-FLIGHT · LOCKED',
        batchHealth: 'OK',
        seqTag: 'SEQ-STEP-' + String(nextStep) + '-S' + String(s.id),
      }))
    );
    setRadioLogs([
      '[00:05.02] 🚀 CREW CHIEF: Step Asynchronous In-Flight Pass #' +
        String(nextStep) +
        ' completed · EOS sequences evicted and replenished',
      '[00:05.06] 🟢 TELEMETRY: In-flight token scheduling verified at 52,800 GB/s with zero sequence starvation',
    ]);
  };

  const handleFlushSlotArenas = () => {
    setIterationStep(1);
    setPreemptionActive(false);
    setThroughputValue('52,800 GB/s');
    setSaturationPct(96);
    setSchedLatency('0.01 µs');
    setActiveSlotsRatio('SLOTS: 8/8');
    setTokenScoreUnits(9344000);
    setEngineXpK('+75.0k ENGINE XP');
    setBatchStateText('Batch State: In-Flight Active');
    setSelectedSlotId(3);
    setSlots(INITIAL_SLOTS);
    setRadioLogs(INITIAL_LOGS);
  };

  const formattedTokenScore = tokenScoreUnits.toLocaleString('en-US') + ' UNITS';

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans select-none">
      {/* Top Header Section */}
      <header className="w-full shrink-0 flex flex-col gap-0.5">
        {/* Top Header Row 1 */}
        <div className="flex items-center justify-between gap-1 w-full shrink-0">
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <h1 className="text-sm font-mono font-bold tracking-wider text-white">GF-T3-297</h1>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-cyan-950/90 text-[#00F0FF] border border-cyan-500/40 rounded">
              FLAGSHIP
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0 overflow-hidden">
            <select
              aria-label="Synthetic Batching Corridor"
              value={selectedCorridor}
              onChange={handleCorridorChange}
              className="max-w-[120px] text-[10px] font-mono truncate py-0.5 px-1 shrink-0 bg-slate-900 text-cyan-300 border border-slate-700 rounded focus:outline-none focus:border-cyan-400"
            >
              {SYNTHETIC_CORRIDORS.map((corridor) => (
                <option key={corridor} value={corridor}>
                  {corridor}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleTriggerContinuousBatchBurst}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 bg-slate-900 hover:bg-slate-800 text-[#00F0FF] border border-cyan-500/40 rounded transition-colors cursor-pointer"
            >
              [Batch]
            </button>
            <button
              type="button"
              onClick={handleStepInFlightPass}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 bg-slate-900 hover:bg-slate-800 text-[#FF9F0A] border border-amber-500/40 rounded transition-colors cursor-pointer"
            >
              [Sched]
            </button>
            <button
              type="button"
              onClick={handleTogglePreemptionSpike}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/40 rounded transition-colors cursor-pointer"
            >
              [Run]
            </button>
          </div>
        </div>

        {/* Top Header Row 2 */}
        <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap">
          Continuous Batching · In-Flight Scheduling · Zero Starvation
        </div>
      </header>

      {/* 4-Card Arcade HUD Ribbon (2x2 grid above the fold) */}
      <section
        aria-label="Arcade HUD Telemetry Ribbon"
        className="grid grid-cols-2 gap-1.5 w-full shrink-0 my-0.5"
      >
        {/* Card 1: BATCH NITRO */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              BATCH NITRO
            </span>
            <span className="text-[10px] font-mono text-cyan-300">
              Batch Throughput: {throughputValue}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-2 my-0.5">
            <span className="text-[#00F0FF] font-mono text-lg font-bold leading-none tabular-nums">
              {throughputValue}
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">
              {String(saturationPct) + '% SAT'}
            </span>
          </div>
          <div className="w-full bg-slate-950 h-1.5 rounded overflow-hidden border border-slate-800">
            <div
              className="bg-[#00F0FF] h-full transition-opacity duration-150"
              style={{ width: String(saturationPct) + '%' }}
            />
          </div>
          <span className="text-[10px] font-mono text-slate-300 mt-0.5">
            Batch Throughput Saturation
          </span>
        </div>

        {/* Card 2: SCHED STREAK */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              SCHED STREAK
            </span>
            <span className="px-1.5 py-0.2 bg-amber-500/20 border border-amber-500/50 rounded text-[10px] font-mono font-bold text-[#FF9F0A]">
              🔥 IN-FLIGHT
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-2 my-0.5">
            <span className="text-[#FF9F0A] font-mono text-lg font-bold leading-none tabular-nums">
              {schedLatency}
            </span>
            <span className="text-[10px] font-mono text-slate-300">
              Schedule Latency: {schedLatency}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-300">Schedule Latency</span>
        </div>

        {/* Card 3: ACTIVE SLOTS */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              ACTIVE SLOTS
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">
              Active Slots: 8 Slots
            </span>
          </div>
          <div className="flex items-center justify-between gap-1 my-0.5">
            <span className="text-white font-mono text-lg font-bold leading-none tabular-nums">
              {activeSlotsRatio}
            </span>
            <div className="flex items-center gap-0.5 font-mono text-[9px]">
              {slots.map((s) => (
                <span
                  key={s.shortCode}
                  className={
                    'px-1 py-0.2 rounded border ' +
                    (selectedSlotId === s.id
                      ? 'bg-cyan-500/30 border-cyan-400 text-white font-bold'
                      : 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300')
                  }
                >
                  {s.shortCode}
                </span>
              ))}
            </div>
          </div>
          <span className="text-[10px] font-mono text-slate-300">
            F1 Gear Shift Indicator [S0..S7] · Non-Blocking
          </span>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              TOKEN SCORE
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-400">{engineXpK}</span>
          </div>
          <div className="flex items-baseline justify-between gap-2 my-0.5">
            <span className="text-cyan-300 font-mono text-lg font-bold leading-none tabular-nums">
              {formattedTokenScore}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Processed Tokens: 9,344,000 Units
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-300">{batchStateText}</span>
        </div>
      </section>

      {/* 5 Horizontal Tabs */}
      <nav
        aria-label="Cockpit Mode Tabs"
        className="grid grid-cols-5 gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg my-1 w-full text-center shrink-0"
      >
        {(['Mesh', 'Btch', 'Schd', 'Stats', 'APA'] as TabKey[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={
              'py-1 text-xs font-mono font-bold rounded transition-colors cursor-pointer whitespace-nowrap shrink-0 ' +
              (activeTab === tab
                ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/50'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60')
            }
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* Streamlined Mesh Info Subheader (strictly clean of action buttons) */}
      <div className="text-[10px] font-mono whitespace-nowrap overflow-hidden text-slate-300 px-1 shrink-0">
        VIEW: MESH · PTR: 0x1DF8DC0 · MODE: CONTINUOUS_BATCHING · SLOTS: 8 · VEC: [5.81, 5.85, 5.82, 5.84]
      </div>

      {/* Main Cockpit Bay: Interactive Slot Matrix Bay (S0–S7) + Tab Overlay Info */}
      <main className="flex-1 min-h-0 flex flex-col justify-between overflow-hidden">
        {activeTab === 'APA' ? (
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-900/70 border border-slate-800 rounded-lg flex-1 min-h-0 overflow-hidden items-center">
            <div className="flex flex-col gap-1 font-mono text-xs text-slate-200">
              <div className="text-sm font-bold text-[#00F0FF]">
                UNIT #297 · CHASSIS GF-T3-297 · CLUSTER-006
              </div>
              <div>Track 3 Flagship Engine · 100% Sovereign IP Title Transfer (Zero Copyleft)</div>
              <div>Retail Price: 150,000 Units · Full Engine APA Buyout: 65,000 Units</div>
              <div className="text-[11px] text-amber-300">{apaNotice}</div>
            </div>
            <div className="flex flex-col gap-2 w-full">
              <button
                type="button"
                onClick={() =>
                  setApaNotice(
                    'APA TITLE TRANSFER DOSSIER LOCKED FOR GF-T3-297 · ESCROW GATE VERIFIED'
                  )
                }
                className="w-full py-1.5 px-3 bg-cyan-950/90 hover:bg-cyan-900 text-[#00F0FF] border border-cyan-400 rounded font-mono text-xs font-bold text-center cursor-pointer"
              >
                ACQUIRE TITLE (APA)
              </button>
              <button
                type="button"
                onClick={() =>
                  setApaNotice(
                    'CLUSTER-006 VAULT BUYOUT INQUIRY DISPATCHED TO DEALERSHIP PRINCIPAL'
                  )
                }
                className="w-full py-1.5 px-3 bg-amber-950/80 hover:bg-amber-900 text-[#FF9F0A] border border-amber-400 rounded font-mono text-xs font-bold text-center cursor-pointer"
              >
                INQUIRE VAULT BUYOUT
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950/80 border border-slate-800/90 rounded-lg flex-1 min-h-0 items-stretch">
            {slots.map((slot) => {
              const isSelected = slot.id === selectedSlotId;
              return (
                <div
                  key={slot.shortCode}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedSlotId(slot.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSelectedSlotId(slot.id);
                    }
                  }}
                  className={
                    'flex flex-col justify-between p-1.5 rounded border transition-colors cursor-pointer ' +
                    (isSelected
                      ? 'bg-slate-900 border-[#00F0FF] shadow-sm'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700')
                  }
                >
                  {/* Line 1: Title & Hex */}
                  <div className="text-[11px] font-mono font-bold text-white flex justify-between items-center">
                    <span>{slot.title}</span>
                    <span>{slot.hexPtr}</span>
                  </div>

                  {/* Line 2: Tokens & Slot Load */}
                  <div className="flex justify-between items-center text-[11px] font-mono font-bold text-cyan-300">
                    <span>{'TOK: ' + slot.tokLabel}</span>
                    <span>{'SLOT: ' + slot.slotPct}</span>
                  </div>

                  {/* Line 3: Latency & State */}
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-[#FF9F0A]">{slot.latencyLabel}</span>
                    <span className="text-emerald-400">{slot.stateLabel}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Compact Batch Telemetry Inspector Strip */}
        <div className="text-[11px] font-mono whitespace-nowrap overflow-hidden text-cyan-300 font-bold px-2 py-0.5 bg-black/60 border border-slate-800 rounded my-0.5 shrink-0">
          {selectedSlot.shortCode +
            ' · TOK: ' +
            selectedSlot.tokLabel +
            ' · SLOT: ' +
            selectedSlot.slotPct +
            ' · SYNC: ' +
            selectedSlot.syncPct +
            ' · PTR ' +
            selectedSlot.inspectorPtr +
            ' · BATCH: ' +
            selectedSlot.batchHealth +
            ' · LOCKED'}
        </div>
      </main>

      {/* Tactical Launch Control Switches */}
      <section
        aria-label="Tactical Launch Control Switches"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1"
      >
        <button
          type="button"
          onClick={handleTriggerContinuousBatchBurst}
          className="amber alert border border-[#FF9F0A] bg-amber-950/40 hover:bg-amber-900/50 text-[#FF9F0A] rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer whitespace-nowrap truncate px-1"
        >
          💥 INJECT CONTINUOUS BATCH BURST
        </button>

        <button
          type="button"
          onClick={handleTogglePreemptionSpike}
          className="bright cyan electric glow border border-[#00F0FF] bg-cyan-950/40 hover:bg-cyan-900/50 text-[#00F0FF] rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer whitespace-nowrap truncate px-1"
        >
          ⚡ TOGGLE PREEMPTION SPIKE
        </button>

        <button
          type="button"
          onClick={handleStepInFlightPass}
          className="emerald launch switch border border-emerald-400 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer whitespace-nowrap truncate px-1"
        >
          🚀 STEP ASYNCHRONOUS IN-FLIGHT PASS
        </button>

        <button
          type="button"
          onClick={handleFlushSlotArenas}
          className="rose reset switch border border-rose-500 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer whitespace-nowrap truncate px-1"
        >
          🔄 FLUSH SLOT ARENAS
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
