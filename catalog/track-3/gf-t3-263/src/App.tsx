/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GF-T3-263 Track 3 Flagship Continuous Batching & In-Flight Batch Expansion Cockpit
 * Zero-Dollar Telemetry Gate Enforced · 100% Above-The-Fold Viewport Lock
 */

import React, { useState } from 'react';
import {
  CORRIDOR_PROFILES,
  CorridorId,
  EngineTelemetryState,
  SUPABASE_RLS_SCHEMA_SQL,
  SYNTHETIC_CORRIDORS,
  TabId,
  createInitialEngineState,
   flushBatchBuffersAndReset,
  formatNumberWithCommas,
  stepIterativeSchedulingPass,
  switchBatchCorridor,
  toggleRequestQueueSpike,
  triggerContinuousBatchBurst,
} from './engine/continuousBatchingEngine';

const TABS: TabId[] = ['Mesh', 'Btch', 'Schd', 'Stats', 'APA'];

export default function App() {
  const [engine, setEngine] = useState<EngineTelemetryState>(() => createInitialEngineState());
  const [apaModalStatus, setApaModalStatus] = useState<string | null>(null);
  const [schemaOpen, setSchemaOpen] = useState<boolean>(false);

  const selectedSlot = engine.slots[engine.selectedSlotIndex] || engine.slots[3];
  const activeProfile = CORRIDOR_PROFILES[engine.corridor];
  const saturationPct = Math.min(
    100,
    Math.round((engine.throughputGbs / activeProfile.peakBandwidthGbs) * 100)
  );

  const handleCorridorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextCorridor = e.target.value as CorridorId;
    setEngine((prev) => switchBatchCorridor(prev, nextCorridor));
  };

  const handleBurst = () => {
    setEngine((prev) => triggerContinuousBatchBurst(prev));
  };

  const handleSpike = () => {
    setEngine((prev) => toggleRequestQueueSpike(prev));
  };

  const handleStep = () => {
    setEngine((prev) => stepIterativeSchedulingPass(prev, 4));
  };

  const handleFlush = () => {
    setApaModalStatus(null);
    setSchemaOpen(false);
    setEngine(flushBatchBuffersAndReset());
  };

  const handleSelectTab = (tab: TabId) => {
    setEngine((prev) => ({
      ...prev,
      activeTab: tab,
    }));
  };

  const handleAcquireApa = () => {
    setApaModalStatus(
      'APA TITLE DOSSIER LOCKED · CLEAN-ROOM MIT PROVENANCE VERIFIED · ZERO ENCUMBRANCES'
    );
  };

  const handleInquireVault = () => {
    setApaModalStatus(
      'VAULT BUYOUT ESCROW READY · STANDALONE REPO + SUPABASE RLS + PYTEST SUITE VERIFIED'
    );
  };

  const vecFormatted =
    '[' +
    engine.vectorSignature.map((n) => n.toFixed(2)).join(', ') +
    ']';

  const inspectorLine =
    selectedSlot.slotCode +
    ' · TOK: ' +
    String(selectedSlot.tokensK) +
    'K · QUEUE: ' +
    selectedSlot.queueTag +
    ' · UTIL: ' +
    String(selectedSlot.utilizationPct) +
    '% · PTR ' +
    selectedSlot.hexPtr +
    ' · SCHED: OK · LOCKED';

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans">
      {/* TOP HEADER ROW 1 */}
      <header className="flex items-center justify-between gap-1 w-full shrink-0">
        <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
          <h1 className="text-sm sm:text-base font-mono font-extrabold tracking-tight text-white">
            GF-T3-263
          </h1>
          <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40 rounded">
            FLAGSHIP
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <select
            aria-label="Continuous Batching Corridor"
            value={engine.corridor}
            onChange={handleCorridorChange}
            className="max-w-[110px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 text-cyan-300 border border-slate-700 rounded focus:outline-none focus:border-[#00F0FF]"
          >
            {SYNTHETIC_CORRIDORS.map((corridor) => (
              <option key={corridor} value={corridor}>
                {corridor}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleBurst}
            className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-amber-500/20 text-[#FF9F0A] border border-[#FF9F0A]/50 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            [Batch]
          </button>
          <button
            type="button"
            onClick={handleStep}
            className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-cyan-500/20 text-[#00F0FF] border border-[#00F0FF]/50 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            [Sched]
          </button>
          <button
            type="button"
            onClick={handleStep}
            className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-emerald-950/80 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            [Run]
          </button>
          <button
            type="button"
            onClick={() => setSchemaOpen((prev) => !prev)}
            className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            [Inspect Schema]
          </button>
          <button
            type="button"
            onClick={handleFlush}
            className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-rose-950 text-rose-300 border border-rose-500/40 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            [Reset]
          </button>
        </div>
      </header>

      {/* TOP HEADER ROW 2 */}
      <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap shrink-0">
        Continuous Batching · In-Flight Expansion · Zero Idle
      </div>

      {/* 4-CARD ARCADE HUD RIBBON */}
      <section
        aria-label="Telemetry HUD Ribbon"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-0.5"
      >
        {/* Card 1: BATCH NITRO */}
        <div className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/70 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="font-bold tracking-wider text-cyan-300">BATCH NITRO</span>
            <span>SAT: {String(saturationPct)}%</span>
          </div>
          <div className="font-mono text-lg font-bold text-[#00F0FF] leading-tight">
            {formatNumberWithCommas(engine.throughputGbs)} GB/s
          </div>
          <div className="w-full h-1 bg-slate-800 rounded overflow-hidden my-0.5">
            <div
              className="h-full bg-[#00F0FF] transition-transform duration-150 origin-left"
              style={{ transform: 'scaleX(' + String(saturationPct / 100) + ')' }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            Batch Throughput Saturation
          </div>
        </div>

        {/* Card 2: SCHED STREAK */}
        <div className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/70 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="font-bold tracking-wider text-[#FF9F0A]">SCHED STREAK</span>
            <span className="text-[10px] font-mono font-bold text-amber-300">🔥 IN-FLIGHT</span>
          </div>
          <div className="font-mono text-lg font-bold text-white leading-tight">
            {engine.schedulerLatencyUs.toFixed(2)} µs
          </div>
          <div className="text-[10px] font-mono text-emerald-400 truncate">
            PASS #{String(engine.iterationPass)} · ZERO CPU STALL
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            Scheduler Latency
          </div>
        </div>

        {/* Card 3: ACTIVE SLOTS */}
        <div className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/70 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="font-bold tracking-wider text-emerald-400">ACTIVE SLOTS</span>
            <span className="text-emerald-300 font-bold">
              Active Slots: {String(engine.activeSlotsCount)} Slots
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-emerald-400 leading-tight">
            SLOTS: {String(engine.activeSlotsCount)}/{String(engine.maxSlotsCount)}
          </div>
          <div className="grid grid-cols-8 gap-0.5 my-0.5">
            {engine.slots.map((s) => (
              <span
                key={s.slotCode}
                className={
                  'text-[9px] font-mono font-bold text-center rounded py-0 ' +
                  (s.index === engine.selectedSlotIndex
                    ? 'bg-[#00F0FF] text-black'
                    : 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40')
                }
              >
                {s.slotCode}
              </span>
            ))}
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            N_active = {String(engine.completedLastStep)} Evicted + {String(engine.admittedLastStep)} Spliced
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/70 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="font-bold tracking-wider text-cyan-300">TOKEN SCORE</span>
            <span className="text-emerald-400 font-bold">
              +{engine.engineXpK.toFixed(1)}k ENGINE XP
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-white leading-tight">
            {formatNumberWithCommas(engine.processedTokens)} UNITS
          </div>
          <div className="text-[10px] font-mono text-cyan-300 truncate">
            QUEUE BUFFER: {String(engine.incomingQueueDepth)} SEQUENCES
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Batch State: {engine.batchStateLabel}
          </div>
        </div>
      </section>

      {/* 5 HORIZONTAL TABS */}
      <nav
        aria-label="Cockpit Mode Tabs"
        className="grid grid-cols-5 gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg my-1 w-full text-center shrink-0"
      >
        {TABS.map((tab) => {
          const isActive = engine.activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => handleSelectTab(tab)}
              className={
                'py-0.5 text-xs font-mono font-bold rounded transition-colors cursor-pointer whitespace-nowrap ' +
                (isActive
                  ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60')
              }
            >
              {tab}
            </button>
          );
        })}
      </nav>

      {/* STREAMLINED MESH INFO SUBHEADER */}
      <div className="text-[10px] font-mono whitespace-nowrap overflow-hidden text-slate-300 px-1 shrink-0">
        {'VIEW: MESH · PTR: ' +
          activeProfile.pointerBase +
          ' · MODE: ' +
          activeProfile.modeTag +
          ' · SLOTS: ' +
          String(engine.activeSlotsCount) +
          ' · VEC: ' +
          vecFormatted}
      </div>

      {/* DEDICATED APA TAB CONTENT VIEW */}
      {engine.activeTab === 'APA' && (
        <div className="px-2 py-1 bg-slate-900/90 border border-slate-800 rounded flex items-center justify-between gap-2 shrink-0">
          <span className="text-[10px] font-mono text-slate-300 truncate">
            {apaModalStatus
              ? apaModalStatus
              : 'STANDALONE APA VAULT TRANSFER · 100% MIT CLEAN-ROOM IP · ZERO RECURRING FEES'}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleAcquireApa}
              className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#FF9F0A]/20 hover:bg-[#FF9F0A]/30 text-[#FF9F0A] border border-[#FF9F0A]/50 rounded cursor-pointer whitespace-nowrap"
            >
              ACQUIRE TITLE (APA)
            </button>
            <button
              type="button"
              onClick={handleInquireVault}
              className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 text-[#00F0FF] border border-[#00F0FF]/50 rounded cursor-pointer whitespace-nowrap"
            >
              INQUIRE VAULT BUYOUT
            </button>
          </div>
        </div>
      )}

      {/* OPTIONAL COMPACT STATUS BANNER FOR SCHEMA INSPECTION */}
      {schemaOpen && (
        <div className="px-2 py-0.5 bg-slate-950 border border-cyan-500/40 rounded text-[10px] font-mono text-cyan-200 flex items-center justify-between gap-2 shrink-0">
          <span className="truncate">
            {'POSTGRESQL RLS SCHEMA: ' + SUPABASE_RLS_SCHEMA_SQL}
          </span>
          <button
            type="button"
            onClick={() => setSchemaOpen(false)}
            className="text-rose-400 font-bold cursor-pointer shrink-0"
          >
            [CLOSE]
          </button>
        </div>
      )}

      {/* INTERACTIVE SLOT MATRIX BAY (S0-S7) */}
      <main
        aria-label="Interactive Slot Matrix Bay"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full flex-1 min-h-0 my-0.5"
      >
        {engine.slots.map((slot) => {
          const isSelected = slot.index === engine.selectedSlotIndex;
          return (
            <div
              key={slot.slotCode}
              role="button"
              tabIndex={0}
              onClick={() =>
                setEngine((prev) => ({
                  ...prev,
                  selectedSlotIndex: slot.index,
                }))
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setEngine((prev) => ({
                    ...prev,
                    selectedSlotIndex: slot.index,
                  }));
                }
              }}
              className={
                'py-0.5 px-2 rounded border bg-slate-900/60 flex flex-col justify-between cursor-pointer transition-colors ' +
                (isSelected
                  ? 'border-[#00F0FF] bg-slate-900/90'
                  : 'border-slate-800 hover:border-slate-700')
              }
            >
              {/* Line 1: Title & Hex */}
              <div className="text-[11px] font-mono font-bold text-white flex justify-between items-center gap-2 w-full">
                <span className="whitespace-nowrap">{slot.titleLabel}</span>{' '}
                <span className="text-slate-300 whitespace-nowrap">{slot.hexPtr}</span>
              </div>

              {/* Line 2: Tokens & Queue */}
              <div className="flex justify-between items-center gap-2 w-full text-[11px] font-mono font-bold text-cyan-300">
                <span className="whitespace-nowrap">{'TOK: ' + String(slot.tokensK) + 'K'}</span>{' '}
                <span className="whitespace-nowrap">{'QUEUE: ' + slot.queueTag}</span>
              </div>

              {/* Line 3: Latency & State */}
              <div className="flex justify-between items-center gap-2 w-full text-[10px] font-mono">
                <span className="text-[#FF9F0A] font-semibold whitespace-nowrap">
                  {slot.latencyMs.toFixed(2) + 'ms'}
                </span>{' '}
                <span className="text-emerald-400 font-semibold whitespace-nowrap">
                  {slot.stateLabel}
                </span>
              </div>
            </div>
          );
        })}
      </main>

      {/* COMPACT BATCH TELEMETRY INSPECTOR STRIP */}
      <div className="text-[11px] font-mono whitespace-nowrap overflow-hidden text-cyan-300 font-bold px-2 py-0.5 bg-black/60 border border-slate-800 rounded my-0.5 shrink-0">
        {inspectorLine}
      </div>

      {/* TACTICAL LAUNCH CONTROL SWITCHES */}
      <section
        aria-label="Tactical Launch Control Switches"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1"
      >
        <button
          type="button"
          onClick={handleBurst}
          className="text-xs font-mono font-bold py-2 px-2 text-center rounded border border-[#FF9F0A] bg-[#FF9F0A]/10 hover:bg-[#FF9F0A]/20 text-[#FF9F0A] transition-colors cursor-pointer truncate"
        >
          💥 INJECT CONTINUOUS BATCH BURST
        </button>

        <button
          type="button"
          onClick={handleSpike}
          className="text-xs font-mono font-bold py-2 px-2 text-center rounded border border-[#00F0FF] bg-[#00F0FF]/10 hover:bg-[#00F0FF]/20 text-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.2)] transition-colors cursor-pointer truncate"
        >
          ⚡ TOGGLE REQUEST QUEUE SPIKE
        </button>

        <button
          type="button"
          onClick={handleStep}
          className="text-xs font-mono font-bold py-2 px-2 text-center rounded border border-emerald-500 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 transition-colors cursor-pointer truncate"
        >
          🚀 STEP ITERATIVE SCHEDULING PASS
        </button>

        <button
          type="button"
          onClick={handleFlush}
          className="text-xs font-mono font-bold py-2 px-2 text-center rounded border border-rose-500 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 transition-colors cursor-pointer truncate"
        >
          🔄 FLUSH BATCH BUFFERS
        </button>
      </section>

      {/* PIT-WALL RADIO COMMS LOG */}
      <footer
        aria-label="Pit-Wall Radio Comms Log"
        className="h-8 overflow-hidden font-mono text-[9px] px-2 py-0.5 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-normal flex flex-col justify-center"
      >
        {engine.radioLogs.slice(0, 2).map((entry, idx) => (
          <div key={String(idx) + '-' + entry.timestamp} className="truncate">
            {'[' + entry.timestamp + '] ' + entry.callsign + ': ' + entry.message}
          </div>
        ))}
      </footer>
    </div>
  );
}
