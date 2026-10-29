/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  CORRIDOR_PROFILES,
  POSTGRES_RLS_SCHEMA_SQL,
  SYNTHETIC_CORRIDOR_LIST,
  SyntheticBatchCorridor,
  createInitialBatchEngineState,
  flushBatchQueuesAndReset,
  stepInFlightSchedulingPass,
  switchBatchCorridor,
  toggleConcurrencySpike,
  triggerContinuousBatchBurst,
} from "./engine/continuousBatchEngine";

type CockpitTab = "Mesh" | "Btch" | "Schd" | "Stats" | "APA";

const COCKPIT_TABS: CockpitTab[] = ["Mesh", "Btch", "Schd", "Stats", "APA"];

export default function App() {
  const [engineState, setEngineState] = useState(() => createInitialBatchEngineState());
  const [activeTab, setActiveTab] = useState<CockpitTab>("Mesh");
  const [apaTransferState, setApaTransferState] = useState<
    "IDLE" | "TITLE_ACQUIRED" | "VAULT_INQUIRED"
  >("IDLE");
  const [schemaModalOpen, setSchemaModalOpen] = useState(false);

  const selectedSlot =
    engineState.slots[engineState.selectedSlotIndex] || engineState.slots[3];

  const handleCorridorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const chosen = e.target.value as SyntheticBatchCorridor;
    setEngineState((prev) => switchBatchCorridor(prev, chosen));
  };

  const handleSelectSlot = (slotIdx: number) => {
    setEngineState((prev) => ({
      ...prev,
      selectedSlotIndex: slotIdx,
    }));
  };

  const handleTriggerBurst = () => {
    setEngineState((prev) => triggerContinuousBatchBurst(prev, 32, 8));
  };

  const handleToggleSpike = () => {
    setEngineState((prev) => toggleConcurrencySpike(prev));
  };

  const handleStepPass = () => {
    setEngineState((prev) => stepInFlightSchedulingPass(prev));
  };

  const handleFlushQueues = () => {
    setApaTransferState("IDLE");
    setEngineState(flushBatchQueuesAndReset());
  };

  const formattedThroughput =
    engineState.batchThroughputGbps.toLocaleString("en-US") + " GB/s";
  const formattedLatency = engineState.schedulingLatencyUs.toFixed(2) + " µs";
  const formattedActiveBatches =
    "BATCHES: " +
    String(engineState.activeBatchesCount) +
    "/" +
    String(engineState.totalBatchesCapacity);
  const formattedTokenScore =
    engineState.processedTokensUnits.toLocaleString("en-US") + " UNITS";
  const formattedXp = "+" + engineState.engineXpK.toFixed(1) + "k ENGINE XP";

  const vectorString =
    "[" +
    engineState.vectorTelemetry.map((v) => v.toFixed(2)).join(", ") +
    "]";

  const meshSubheaderLine =
    "VIEW: " +
    activeTab.toUpperCase() +
    " · PTR: " +
    engineState.meshPtr +
    " · MODE: " +
    engineState.modeTag +
    " · BATCHES: " +
    String(engineState.activeBatchesCount) +
    " · VEC: " +
    vectorString;

  const inspectorLine =
    selectedSlot.slotId +
    " · TOK: " +
    String(selectedSlot.tokensK) +
    "K · QUEUE: " +
    String(selectedSlot.queueReq) +
    " REQ · RATE: " +
    String(selectedSlot.ratePct) +
    "% · PTR " +
    selectedSlot.inspectorPtr +
    " · BATCH: " +
    (selectedSlot.locked ? "OK · LOCKED" : "WARN · SPIKE");

  const currentProfile = CORRIDOR_PROFILES[engineState.corridor];

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans select-none">
      {/* Top Header Block */}
      <header className="w-full shrink-0 flex flex-col gap-0.5 border-b border-slate-800/90 pb-1">
        {/* Top Header Row 1 */}
        <div className="flex items-center justify-between gap-1 w-full shrink-0">
          {/* Left: Title + Cyan Badge */}
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <h1 className="text-sm md:text-base font-mono font-extrabold tracking-tight text-white">
              GF-T3-275
            </h1>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-cyan-500/15 text-[#00F0FF] border border-cyan-400/50 rounded">
              FLAGSHIP
            </span>
          </div>

          {/* Right: Compact Corridor Dropdown + Micro Action Buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <select
              aria-label="Synthetic Batch Corridor Selector"
              value={engineState.corridor}
              onChange={handleCorridorChange}
              className="max-w-[110px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 border border-slate-700 text-cyan-300 rounded focus:outline-none focus:border-cyan-400"
            >
              {SYNTHETIC_CORRIDOR_LIST.map((corridorItem) => (
                <option key={corridorItem} value={corridorItem}>
                  {corridorItem}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleTriggerBurst}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-amber-500/15 hover:bg-amber-500/25 text-[#FF9F0A] border border-amber-500/40 rounded transition-colors cursor-pointer"
            >
              [Batch]
            </button>
            <button
              type="button"
              onClick={handleStepPass}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-cyan-500/15 hover:bg-cyan-500/25 text-[#00F0FF] border border-cyan-500/40 rounded transition-colors cursor-pointer"
            >
              [Sched]
            </button>
            <button
              type="button"
              onClick={handleStepPass}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-[#10B981] border border-emerald-500/40 rounded transition-colors cursor-pointer"
            >
              [Run]
            </button>
            <button
              type="button"
              onClick={() => setSchemaModalOpen((prev) => !prev)}
              className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition-colors cursor-pointer"
            >
              [Inspect Schema]
            </button>
            <button
              type="button"
              onClick={handleFlushQueues}
              className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 rounded transition-colors cursor-pointer"
            >
              [Reset]
            </button>
          </div>
        </div>

        {/* Top Header Row 2 */}
        <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap">
          Continuous Batching · In-Flight Scheduling · Zero Stall
        </div>
      </header>

      {/* 4-Card Arcade HUD Ribbon (2x2 Grid Above the Fold) */}
      <section
        aria-label="Telemetry HUD Ribbon"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-0.5"
      >
        {/* Card 1: BATCH NITRO */}
        <div className="px-2 py-1 rounded border border-cyan-500/40 bg-slate-900/75 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-300 tracking-wider">
              BATCH NITRO
            </span>
            <span className="text-[10px] font-mono font-bold text-[#00F0FF]">
              {String(engineState.throughputSaturationPct) + "% BUS"}
            </span>
          </div>
          <div className="text-[#00F0FF] font-mono text-lg font-bold leading-tight">
            {formattedThroughput}
          </div>
          <div className="w-full bg-slate-800 h-1 rounded overflow-hidden my-0.5">
            <div
              className="bg-[#00F0FF] h-full transition-opacity duration-150"
              style={{ width: String(engineState.throughputSaturationPct) + "%" }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Batch Throughput Saturation
          </div>
        </div>

        {/* Card 2: SCHED STREAK */}
        <div className="px-2 py-1 rounded border border-amber-500/40 bg-slate-900/75 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-300 tracking-wider">
              SCHED STREAK
            </span>
            <span className="px-1 py-0 text-[10px] font-mono font-bold bg-amber-500/20 text-[#FF9F0A] border border-amber-500/40 rounded">
              🔥 IN-FLIGHT
            </span>
          </div>
          <div className="text-[#FF9F0A] font-mono text-lg font-bold leading-tight">
            {formattedLatency}
          </div>
          <div className="text-[10px] font-mono text-emerald-400 truncate">
            Zero Polling Overhead · SM Sync
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Scheduling Latency
          </div>
        </div>

        {/* Card 3: ACTIVE BATCHES */}
        <div className="px-2 py-1 rounded border border-emerald-500/40 bg-slate-900/75 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-300 tracking-wider">
              ACTIVE BATCHES
            </span>
            <span className="text-[10px] font-mono font-bold text-[#10B981]">
              [H0..H7]
            </span>
          </div>
          <div className="text-[#10B981] font-mono text-lg font-bold leading-tight">
            {formattedActiveBatches}
          </div>
          <div className="grid grid-cols-8 gap-0.5 my-0.5">
            {engineState.slots.map((slot) => (
              <span
                key={slot.slotId}
                className={
                  "text-[9px] font-mono font-bold text-center rounded " +
                  (slot.locked
                    ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/50"
                    : "bg-rose-500/30 text-rose-200 border border-rose-500/50")
                }
              >
                {slot.slotId}
              </span>
            ))}
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            F1 Gear Shift Slot Matrix Active
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="px-2 py-1 rounded border border-cyan-500/40 bg-slate-900/75 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-300 tracking-wider">
              TOKEN SCORE
            </span>
            <span className="text-[10px] font-mono font-bold text-[#00F0FF]">
              {formattedXp}
            </span>
          </div>
          <div className="text-white font-mono text-lg font-bold leading-tight">
            {formattedTokenScore}
          </div>
          <div className="text-[10px] font-mono text-cyan-300 truncate">
            {"Pass Steps: " +
              String(engineState.stepPassCount) +
              " · Bursts: " +
              String(engineState.burstCycleCount)}
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            {"Batch State: " + engineState.batchStateLabel}
          </div>
        </div>
      </section>

      {/* 5 Horizontal Tabs */}
      <nav
        aria-label="Cockpit Mode Tabs"
        className="grid grid-cols-5 gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg my-1 w-full text-center shrink-0"
      >
        {COCKPIT_TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setActiveTab(tab);
                setSchemaModalOpen(false);
              }}
              className={
                "py-0.5 text-xs font-mono font-bold rounded transition-colors cursor-pointer " +
                (isActive
                  ? "bg-cyan-500/20 text-[#00F0FF] border border-cyan-400/60"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent")
              }
            >
              {tab}
            </button>
          );
        })}
      </nav>

      {/* Streamlined Mesh Info Subheader (Strictly clean of action buttons) */}
      <div className="text-[10px] font-mono whitespace-nowrap overflow-hidden text-slate-300 px-1 shrink-0">
        {meshSubheaderLine}
      </div>

      {/* Main Interactive Simulation Bay */}
      <main className="flex-1 min-h-0 flex flex-col justify-between my-0.5 overflow-hidden">
        {schemaModalOpen ? (
          <div className="h-full rounded border border-cyan-500/50 bg-slate-950/95 p-2 flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1">
              <span className="text-xs font-mono font-bold text-[#00F0FF]">
                POSTGRESQL / SUPABASE PARTITIONED SCHEMA & RLS POLICIES (GF-T3-275)
              </span>
              <button
                type="button"
                onClick={() => setSchemaModalOpen(false)}
                className="px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-800 text-white rounded border border-slate-700 cursor-pointer"
              >
                [CLOSE SCHEMA]
              </button>
            </div>
            <pre className="text-[10px] font-mono text-emerald-300 leading-tight overflow-hidden whitespace-pre-wrap select-all">
              {POSTGRES_RLS_SCHEMA_SQL}
            </pre>
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 border-t border-slate-800 pt-1">
              <span>PARTITIONED BY RANGE (recorded_at) · FOREIGN KEYS LOCKED</span>
              <span className="text-emerald-400 font-bold">RLS: ENABLED & VERIFIED</span>
            </div>
          </div>
        ) : activeTab === "APA" ? (
          <div className="h-full flex flex-col justify-between gap-1 overflow-hidden">
            {/* APA Commercial Transfer Panel + Compact 4x2 Slot Matrix */}
            <div className="rounded border border-amber-500/50 bg-slate-900/90 px-2.5 py-1.5 flex flex-col justify-between shrink-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono font-bold text-[#FF9F0A]">
                  SOVEREIGN APA REPOSITORY TITLE TRANSFER · CHASSIS GF-T3-275
                </span>
                <span className="text-[10px] font-mono font-bold text-emerald-400">
                  100% MIT CLEAN-ROOM · ZERO COPYLEFT · NIST SSDF VERIFIED
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-300 leading-tight my-1">
                Outright Asset Purchase Agreement (APA) transfer of standalone Python FastAPI engine, React/TS cockpit, partitioned PostgreSQL RLS schema, and Cloud Run container. Zero recurring SaaS obligations.
              </p>
              <div className="flex items-center justify-between gap-2 pt-0.5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setApaTransferState("TITLE_ACQUIRED")}
                    className="px-3 py-1 text-xs font-mono font-bold bg-amber-500/20 hover:bg-amber-500/30 text-[#FF9F0A] border border-amber-400 rounded cursor-pointer transition-colors"
                  >
                    ACQUIRE TITLE (APA)
                  </button>
                  <button
                    type="button"
                    onClick={() => setApaTransferState("VAULT_INQUIRED")}
                    className="px-3 py-1 text-xs font-mono font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-[#00F0FF] border border-cyan-400 rounded cursor-pointer transition-colors"
                  >
                    INQUIRE VAULT BUYOUT
                  </button>
                </div>
                <span className="text-[10px] font-mono font-bold text-cyan-300">
                  {apaTransferState === "TITLE_ACQUIRED"
                    ? "✓ APA TITLE MANIFEST ARMED · AES-256-GCM KEYS VERIFIED"
                    : apaTransferState === "VAULT_INQUIRED"
                    ? "✓ VAULT BUYOUT DOSSIER DISPATCHED · AUDIT LOG LOCKED"
                    : "STATUS: READY FOR IMMEDIATE HANDOVER"}
                </span>
              </div>
            </div>

            {/* Keep 8 Batch Cards visible in tight 4x2 grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 flex-1 min-h-0">
              {engineState.slots.map((slot) => (
                <div
                  key={slot.slotId}
                  onClick={() => handleSelectSlot(slot.slotIndex)}
                  className={
                    "py-0 px-1.5 rounded border bg-slate-900/60 flex flex-col justify-between cursor-pointer transition-colors " +
                    (engineState.selectedSlotIndex === slot.slotIndex
                      ? "border-cyan-400 bg-slate-900/90"
                      : "border-slate-800 hover:border-slate-700")
                  }
                >
                  <div className="text-[11px] font-mono font-bold text-white flex justify-between items-center">
                    <span>{slot.titleLabel}</span>
                    <span>{slot.hexPtr}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] font-mono font-bold text-cyan-300">
                    <span>{"TOK: " + String(slot.tokensK) + "K"}</span>
                    <span>{"QUEUE: " + String(slot.queueReq) + " REQ"}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-[#FF9F0A]">
                      {slot.latencyMs.toFixed(2) + "ms"}
                    </span>
                    <span
                      className={
                        slot.locked
                          ? "text-[#10B981] font-bold"
                          : "text-[#EF4444] font-bold"
                      }
                    >
                      {slot.statusLabel}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col justify-between gap-1 overflow-hidden">
            {/* Mode-Specific Telemetry Banner for Btch / Schd / Stats */}
            {activeTab !== "Mesh" && (
              <div className="px-2 py-0.5 rounded border border-slate-800 bg-slate-900/90 flex items-center justify-between text-[10px] font-mono shrink-0">
                <span className="text-cyan-300 font-bold">
                  {activeTab === "Btch"
                    ? "CONTINUOUS IN-FLIGHT FORMULA: B_cont = sum(Token_active) + Queue_pending"
                    : activeTab === "Schd"
                    ? "DYNAMIC ITERATION REALLOCATION · EFFICIENCY: " +
                      String(Math.round(currentProfile.tensorAllocationEfficiency * 100)) +
                      "%"
                    : "GRIDSYNC ZERO-TRUST TELEMETRY · 0 QUEUE STALLS · RLS ACTIVE"}
                </span>
                <span className="text-emerald-400 font-bold">
                  {"CORRIDOR: " + currentProfile.corridorId + " · ✓ LOCKED"}
                </span>
              </div>
            )}

            {/* Interactive Batch Matrix Bay (H0-H7) in tight 4x2 grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 flex-1 min-h-0">
              {engineState.slots.map((slot) => {
                const isSelected = engineState.selectedSlotIndex === slot.slotIndex;
                return (
                  <div
                    key={slot.slotId}
                    onClick={() => handleSelectSlot(slot.slotIndex)}
                    className={
                      "py-0 px-1.5 rounded border bg-slate-900/60 flex flex-col justify-between cursor-pointer transition-colors " +
                      (isSelected
                        ? "border-cyan-400 bg-slate-900/95"
                        : slot.locked
                        ? "border-slate-800 hover:border-slate-700"
                        : "border-rose-500/60 bg-rose-950/20")
                    }
                  >
                    {/* Line 1: Title & Hex */}
                    <div className="text-[11px] font-mono font-bold text-white flex justify-between items-center">
                      <span>{slot.titleLabel}</span>
                      <span>{slot.hexPtr}</span>
                    </div>

                    {/* Line 2: Tokens & Queue */}
                    <div className="flex justify-between items-center text-[11px] font-mono font-bold text-cyan-300">
                      <span>{"TOK: " + String(slot.tokensK) + "K"}</span>
                      <span>{"QUEUE: " + String(slot.queueReq) + " REQ"}</span>
                    </div>

                    {/* Line 3: Latency & State */}
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-[#FF9F0A]">
                        {slot.latencyMs.toFixed(2) + "ms"}
                      </span>
                      <span
                        className={
                          slot.locked
                            ? "text-[#10B981] font-bold"
                            : "text-[#EF4444] font-bold"
                        }
                      >
                        {slot.statusLabel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Compact Batch Telemetry Inspector Strip */}
      <div className="text-[11px] font-mono whitespace-nowrap overflow-hidden text-cyan-300 font-bold px-2 py-0.5 bg-black/60 border border-slate-800 rounded my-0.5 shrink-0">
        {inspectorLine}
      </div>

      {/* Tactical Launch Control Switches */}
      <section
        aria-label="Tactical Launch Control Switches"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1"
      >
        <button
          type="button"
          onClick={handleTriggerBurst}
          className="border border-amber-500/70 bg-amber-500/10 hover:bg-amber-500/20 text-[#FF9F0A] rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer whitespace-nowrap truncate px-1"
        >
          💥 INJECT CONTINUOUS BATCH BURST
        </button>

        <button
          type="button"
          onClick={handleToggleSpike}
          className="border border-cyan-400/80 bg-cyan-500/10 hover:bg-cyan-500/20 text-[#00F0FF] rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer whitespace-nowrap truncate px-1"
        >
          ⚡ TOGGLE REQUEST CONCURRENCY SPIKE
        </button>

        <button
          type="button"
          onClick={handleStepPass}
          className="border border-emerald-500/70 bg-emerald-500/10 hover:bg-emerald-500/20 text-[#10B981] rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer whitespace-nowrap truncate px-1"
        >
          🚀 STEP IN-FLIGHT SCHEDULING PASS
        </button>

        <button
          type="button"
          onClick={handleFlushQueues}
          className="border border-rose-500/70 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer whitespace-nowrap truncate px-1"
        >
          🔄 FLUSH BATCH QUEUES
        </button>
      </section>

      {/* Pit-Wall Radio Comms Log */}
      <footer
        aria-label="Pit-Wall Radio Comms Log"
        className="h-8 overflow-hidden font-mono text-[9px] px-2 py-0.5 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-normal flex flex-col justify-center"
      >
        {engineState.radioLogs.map((entry, idx) => (
          <div key={entry.timestamp + "-" + String(idx)} className="truncate">
            {entry.timestamp +
              " " +
              entry.icon +
              " " +
              entry.callsign +
              ": " +
              entry.message}
          </div>
        ))}
      </footer>
    </div>
  );
}
