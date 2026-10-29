/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * GF-T3-246 · Track 3 Custom C++ Plugin & In-Flight Batching Scheduler Cockpit
 * Zero-Dollar Gate Enforced · Zero Template Literal Dollar Interpolations
 */

import React, { useState } from "react";
import {
  ALLOWED_CORRIDORS,
  SyntheticCorridor,
  sanitizeBurstIngress,
  sanitizeSequenceIngress,
} from "./core/gridSyncSanitizer";
import {
  CORRIDOR_PROFILES,
  PluginEngineState,
  createInitialEngineState,
  switchPluginCorridor,
  injectInFlightBatchBurst,
  toggleSlotSaturationSpike,
  stepPluginExecutionPass,
  flushSchedulerQueues,
} from "./core/pluginSchedulerEngine";
import { GF_T3_246_POSTGRES_SCHEMA } from "./core/schemaSql";

type CockpitTab = "Mesh" | "Plug" | "Batch" | "Stats" | "APA";

const TABS: CockpitTab[] = ["Mesh", "Plug", "Batch", "Stats", "APA"];

export default function App() {
  const [engineState, setEngineState] = useState<PluginEngineState>(() =>
    createInitialEngineState()
  );
  const [activeTab, setActiveTab] = useState<CockpitTab>("Mesh");
  const [schemaModalOpen, setSchemaModalOpen] = useState<boolean>(false);
  const [apaModalState, setApaModalState] = useState<string | null>(null);
  const [customSeqInput, setCustomSeqInput] = useState<string>("768");
  const [customBatchTag, setCustomBatchTag] = useState<string>("BG-INFLIGHT-04");
  const [sanitizerStatus, setSanitizerStatus] = useState<string>(
    "GRIDSYNC ZERO-TRUST INGRESS: VERIFIED (0 VIOLATIONS)"
  );

  const selectedSlot =
    engineState.slots[engineState.selectedSlotIndex] || engineState.slots[3];
  const activeProfile = CORRIDOR_PROFILES[engineState.corridor];

  const handleCorridorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const chosen = e.target.value as SyntheticCorridor;
    setEngineState((prev) => switchPluginCorridor(prev, chosen));
  };

  const handleInjectBurst = () => {
    const check = sanitizeBurstIngress({
      sequenceCount: 8,
      burstTokens: 64000,
      sequencePrefix: "INFLIGHT_SEQ",
    });
    if (!check.ok) {
      setSanitizerStatus("GRIDSYNC FAULT: " + String(check.error));
      return;
    }
    setSanitizerStatus("GRIDSYNC ZERO-TRUST INGRESS: BURST PAYLOAD SANITIZED");
    setEngineState((prev) => injectInFlightBatchBurst(prev, 64000));
  };

  const handleToggleSaturation = () => {
    setEngineState((prev) => toggleSlotSaturationSpike(prev));
  };

  const handleStepPluginExec = () => {
    setEngineState((prev) => stepPluginExecutionPass(prev));
  };

  const handleFlushQueues = () => {
    setSanitizerStatus("GRIDSYNC ZERO-TRUST INGRESS: QUEUES RE-ZEROED & VERIFIED");
    setApaModalState(null);
    setEngineState(() => flushSchedulerQueues());
  };

  const handleCustomSequenceInsert = () => {
    const parsedSeq = parseInt(customSeqInput, 10);
    const validation = sanitizeSequenceIngress({
      sequenceId: Number.isNaN(parsedSeq) ? 640 : parsedSeq,
      tokenBudget: 256,
      targetSlotIndex: engineState.selectedSlotIndex,
      batchTag: customBatchTag,
    });

    if (!validation.ok || !validation.data) {
      setSanitizerStatus("GRIDSYNC BLOCKED: " + String(validation.error));
      return;
    }

    const validData = validation.data;
    setSanitizerStatus(
      "GRIDSYNC INGRESS LOCKED: SEQ " +
        String(validData.sequenceId) +
        " INSERTED INTO " +
        selectedSlot.slotCode
    );
    setEngineState((prev) => {
      const updatedSlots = prev.slots.map((slot, idx) =>
        idx === validData.targetSlotIndex
          ? {
              ...slot,
              sequenceId: validData.sequenceId,
              currentTokens: validData.tokenBudget,
              batchGroup: validData.batchTag,
              stateLabel: "ACTIVE" as const,
              reindexedCount: slot.reindexedCount + 1,
            }
          : slot
      );
      return {
        ...prev,
        processedTokensUnits: prev.processedTokensUnits + validData.tokenBudget * 100,
        slots: updatedSlots,
      };
    });
  };

  const formattedThroughput =
    engineState.schedulerThroughputGbs.toLocaleString("en-US") + " GB/s";
  const formattedLatency = engineState.kernelLaunchLatencyUs.toFixed(2) + " µs";
  const formattedTokens =
    engineState.processedTokensUnits.toLocaleString("en-US") + " UNITS";
  const formattedXp = "+" + engineState.pluginXpK.toFixed(1) + "k PLUGIN XP";

  const meshSubheaderString =
    "VIEW: " +
    activeTab.toUpperCase() +
    " · PTR: " +
    engineState.meshPointerHex +
    " · KERNEL: " +
    engineState.kernelIdentifier +
    " · LAT: " +
    engineState.meshExecutionLatencyUs.toFixed(2) +
    "µs · Q_DEPTH: " +
    String(engineState.queueDepth) +
    " · VEC: [" +
    engineState.attentionVector.map((v) => v.toFixed(2)).join(", ") +
    "]";

  const inspectorString =
    selectedSlot.slotCode +
    " · SEQ: " +
    String(selectedSlot.sequenceId) +
    " · KERN: " +
    selectedSlot.kernelLabel +
    " · TIME: " +
    selectedSlot.executionTimeUs.toFixed(2) +
    "µs · EXECUTING";

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans">
      {/* TOP COMMAND DECK: Row 1 + Row 2 */}
      <header className="w-full shrink-0 flex flex-col gap-0.5 border-b border-slate-800/90 pb-1">
        {/* Top Header Row 1 */}
        <div className="flex items-center justify-between gap-1 w-full shrink-0">
          {/* Left: Strict Project Title & Cyan Track Badge */}
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <h1 className="text-sm sm:text-base font-mono font-bold tracking-wider text-white">
              GF-T3-246
            </h1>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/50 rounded">
              TRACK 3
            </span>
            <span
              className={
                "hidden sm:inline-block text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border " +
                (engineState.saturationFaultActive
                  ? "bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/50"
                  : "bg-[#10B981]/15 text-[#10B981] border-[#10B981]/50")
              }
            >
              {engineState.saturationFaultActive ? "⚡ FAULT" : "✓ LOCKED"}
            </span>
          </div>

          {/* Right: Compact Corridor Dropdown & Micro Action Switches */}
          <div className="flex items-center gap-1 shrink-0">
            <select
              aria-label="Synthetic Plugin Corridor Selector"
              value={engineState.corridor}
              onChange={handleCorridorChange}
              className="max-w-[110px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 text-[#00F0FF] border border-slate-700 rounded focus:outline-none focus:border-[#00F0FF]"
            >
              {ALLOWED_CORRIDORS.map((corridor) => (
                <option key={corridor} value={corridor}>
                  {corridor}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setActiveTab("Plug")}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-[#00F0FF] border border-[#00F0FF]/40 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              [Plugin]
            </button>
            <button
              type="button"
              onClick={handleInjectBurst}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-[#FF9F0A] border border-[#FF9F0A]/40 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              [Batch]
            </button>
            <button
              type="button"
              onClick={handleStepPluginExec}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-[#10B981] border border-[#10B981]/40 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              [Run]
            </button>
            <button
              type="button"
              onClick={() => setSchemaModalOpen((prev) => !prev)}
              className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              [Inspect Schema]
            </button>
            <button
              type="button"
              onClick={handleFlushQueues}
              className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-[#EF4444] border border-[#EF4444]/40 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              [Reset]
            </button>
          </div>
        </div>

        {/* Top Header Row 2 */}
        <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap">
          C++ Plugin Engine · In-Flight Batching · Sub-Microsecond Kernel
        </div>
      </header>

      {/* 4-CARD ARCADE HUD RIBBON */}
      <section
        aria-label="Telemetry HUD Ribbon"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-0.5"
      >
        {/* Card 1: PLUGIN NITRO */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg px-2.5 py-1 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              PLUGIN NITRO
            </span>
            <span className="text-[10px] font-mono text-[#00F0FF] font-semibold">
              {String(engineState.throughputSaturationPct) + "%"}
            </span>
          </div>
          <div className="text-[#00F0FF] font-mono text-lg font-bold leading-tight">
            {formattedThroughput}
          </div>
          <div className="w-full bg-slate-900 h-1 rounded overflow-hidden my-0.5 border border-slate-800">
            <div
              className="bg-[#00F0FF] h-full transition-opacity duration-150"
              style={{ width: String(engineState.throughputSaturationPct) + "%" }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            Scheduler Throughput Saturation
          </div>
        </div>

        {/* Card 2: LATENCY STREAK */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg px-2.5 py-1 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              LATENCY STREAK
            </span>
            <span className="text-[10px] font-mono font-bold text-[#FF9F0A] bg-[#FF9F0A]/10 border border-[#FF9F0A]/30 px-1 rounded">
              🔥 32 SLOTS
            </span>
          </div>
          <div className="text-[#FF9F0A] font-mono text-lg font-bold leading-tight">
            {formattedLatency}
          </div>
          <div className="text-[10px] font-mono text-emerald-400 truncate">
            Kernel Latency: {formattedLatency} · Zero Stall
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            CUDA Kernel Launch Latency
          </div>
        </div>

        {/* Card 3: ACTIVE SLOTS (F1 Gear Shift Indicator [S0..S31]) */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg px-2.5 py-1 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              ACTIVE SLOTS
            </span>
            <span className="text-[10px] font-mono text-[#10B981] font-bold">
              [S0..S31]
            </span>
          </div>
          <div className="text-white font-mono text-lg font-bold leading-tight">
            {"SLOTS: " +
              String(engineState.activeSlotsCount) +
              "/" +
              String(engineState.totalSlotsCapacity)}
          </div>
          <div className="grid grid-cols-16 gap-0.5 my-0.5">
            {Array.from({ length: 16 }).map((_, idx) => (
              <span
                key={idx}
                className={
                  "h-1.5 rounded-xs " +
                  (engineState.saturationFaultActive && (idx === 2 || idx === 5)
                    ? "bg-[#EF4444]"
                    : idx < 12
                    ? "bg-[#10B981]"
                    : "bg-[#00F0FF]")
                }
              />
            ))}
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            Plugin State: In-Flight Batching Active
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg px-2.5 py-1 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              TOKEN SCORE
            </span>
            <span className="text-[10px] font-mono font-bold text-[#10B981]">
              {formattedXp}
            </span>
          </div>
          <div className="text-[#10B981] font-mono text-lg font-bold leading-tight">
            {formattedTokens}
          </div>
          <div className="text-[10px] font-mono text-cyan-300 truncate">
            {"Reclaimed Bubbles: " + String(engineState.reclaimedBubbleSlotsTotal) + " Slots"}
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            {"Plugin State: " + engineState.pluginStateText}
          </div>
        </div>
      </section>

      {/* 5 HORIZONTAL TABS */}
      <nav
        aria-label="Cockpit Subsystem Tabs"
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
                "py-1 text-xs font-mono font-bold rounded transition-colors cursor-pointer whitespace-nowrap " +
                (isActive
                  ? "bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/60"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent")
              }
            >
              {tab}
            </button>
          );
        })}
      </nav>

      {/* STREAMLINED MESH INFO SUBHEADER */}
      <div className="px-2 py-0.5 bg-slate-950/90 border border-slate-800/80 rounded shrink-0">
        <p className="text-[10px] font-mono whitespace-nowrap overflow-hidden text-slate-300">
          {meshSubheaderString}
        </p>
      </div>

      {/* INTERACTIVE SIMULATION BAY: 8-Slot Matrix + Contextual Tab Bar */}
      <main className="flex-1 min-h-0 flex flex-col justify-between gap-1 my-1 overflow-hidden">
        {activeTab === "Plug" && (
          <div className="px-2 py-0.5 bg-slate-900/90 border border-[#00F0FF]/40 rounded flex items-center justify-between gap-2 shrink-0 text-[10px] font-mono">
            <span className="text-[#00F0FF] font-bold truncate">
              {"C++ CUDA KERNEL: " +
                activeProfile.kernelName +
                " · REG PRESSURE: " +
                String(activeProfile.registerPressurePct) +
                "% · " +
                selectedSlot.registerAllocation}
            </span>
            <button
              type="button"
              onClick={() => setSchemaModalOpen(true)}
              className="px-1.5 py-0.5 bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/50 rounded font-bold cursor-pointer shrink-0"
            >
              POSTGRES RLS SCHEMA
            </button>
          </div>
        )}

        {activeTab === "Batch" && (
          <div className="px-2 py-0.5 bg-slate-900/90 border border-[#FF9F0A]/40 rounded flex items-center justify-between gap-2 shrink-0 text-[10px] font-mono">
            <div className="flex items-center gap-1.5">
              <span className="text-[#FF9F0A] font-bold">IN-FLIGHT GATE:</span>
              <input
                type="text"
                aria-label="Sequence ID"
                value={customSeqInput}
                onChange={(e) => setCustomSeqInput(e.target.value)}
                className="w-14 px-1 py-0.5 bg-black border border-slate-700 rounded text-cyan-300 font-mono text-[10px]"
              />
              <input
                type="text"
                aria-label="Batch Group Tag"
                value={customBatchTag}
                onChange={(e) => setCustomBatchTag(e.target.value)}
                className="w-24 px-1 py-0.5 bg-black border border-slate-700 rounded text-amber-300 font-mono text-[10px]"
              />
              <button
                type="button"
                onClick={handleCustomSequenceInsert}
                className="px-1.5 py-0.5 bg-[#FF9F0A]/20 text-[#FF9F0A] border border-[#FF9F0A]/60 rounded font-bold cursor-pointer"
              >
                INSERT {selectedSlot.slotCode}
              </button>
            </div>
            <span className="text-emerald-400 truncate">{sanitizerStatus}</span>
          </div>
        )}

        {activeTab === "Stats" && (
          <div className="px-2 py-0.5 bg-slate-900/90 border border-[#10B981]/40 rounded flex items-center justify-between gap-2 shrink-0 text-[10px] font-mono">
            <span className="text-[#10B981] font-bold truncate">
              ROOFLINE: 9,800 GB/s · BUBBLE ELIMINATION: 99.9% · SUITES: 12/12 PASSED
            </span>
            <span className="text-cyan-300 shrink-0">
              {"PASSES: " + String(engineState.stepCount)}
            </span>
          </div>
        )}

        {activeTab === "APA" && (
          <div className="px-2 py-0.5 bg-slate-900/95 border border-[#00F0FF]/50 rounded flex items-center justify-between gap-2 shrink-0 text-[10px] font-mono">
            <span className="text-white font-bold truncate">
              {apaModalState
                ? apaModalState
                : "SOVEREIGN APA VAULT · 100% MIT CLEAN-ROOM IP"}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() =>
                  setApaModalState("✓ APA TITLE DOSSIER LOCKED FOR GF-T3-246")
                }
                className="px-1.5 py-0.5 bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/60 rounded font-bold cursor-pointer"
              >
                ACQUIRE TITLE (APA)
              </button>
              <button
                type="button"
                onClick={() =>
                  setApaModalState("⚡ VAULT BUYOUT DISPATCH INITIALIZED")
                }
                className="px-1.5 py-0.5 bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/60 rounded font-bold cursor-pointer"
              >
                INQUIRE VAULT BUYOUT
              </button>
            </div>
          </div>
        )}

        {/* Interactive 8-Slot Plugin Scheduler Matrix Bay (S0-S7) */}
        <section
          aria-label="Interactive Plugin Slot Matrix Bay"
          className="flex-1 min-h-0 grid grid-cols-2 sm:grid-cols-4 gap-1.5 w-full overflow-hidden"
        >
          {engineState.slots.map((slot) => {
            const isSelected = slot.slotIndex === engineState.selectedSlotIndex;
            const isFault = slot.lockStatus === "FAULT";

            return (
              <button
                key={slot.slotCode}
                type="button"
                onClick={() =>
                  setEngineState((prev) => ({
                    ...prev,
                    selectedSlotIndex: slot.slotIndex,
                  }))
                }
                className={
                  "text-left px-2.5 py-1.5 rounded-lg border transition-colors flex flex-col justify-between cursor-pointer " +
                  (isFault
                    ? "bg-[#EF4444]/10 border-[#EF4444]"
                    : isSelected
                    ? "bg-slate-900/95 border-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.18)]"
                    : "bg-slate-950/85 border-slate-800 hover:border-slate-600")
                }
              >
                {/* Header: Slot 0 (S0) and hex pointer */}
                <div className="flex items-center justify-between gap-1 w-full">
                  <span className="text-xs font-mono font-bold text-white tracking-wide">
                    {slot.slotHeader}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {slot.hexPointer}
                  </span>
                </div>

                {/* Sequence & token count */}
                <div className="text-[12px] font-mono text-cyan-300 font-bold">
                  {"SEQ: " +
                    String(slot.sequenceId) +
                    " · TOK: " +
                    String(slot.currentTokens) +
                    "/" +
                    String(slot.maxTokens)}
                </div>

                {/* Kernel state */}
                <div className="text-[12px] font-mono text-amber-300 font-bold">
                  {"KERN: " + slot.kernelLabel + " · STATE: " + slot.stateLabel}
                </div>

                {/* Efficiency rating */}
                <div
                  className={
                    isFault
                      ? "text-[11px] font-mono text-[#EF4444] font-semibold"
                      : "text-[11px] font-mono text-emerald-400 font-semibold"
                  }
                >
                  {"EFF: " +
                    slot.efficiencyPct.toFixed(1) +
                    "% · " +
                    (isFault ? "⚡ FAULT" : "LOCKED")}
                </div>
              </button>
            );
          })}
        </section>
      </main>

      {/* STREAMLINED TELEMETRY INSPECTOR STRIP */}
      <div className="text-[11px] font-mono whitespace-nowrap overflow-hidden text-cyan-300 font-bold px-2 py-0.5 bg-black/60 border border-slate-800 rounded">
        {inspectorString}
      </div>

      {/* TACTICAL LAUNCH CONTROL BUTTONS */}
      <section
        aria-label="Tactical Launch Control Dock"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1"
      >
        <button
          type="button"
          onClick={handleInjectBurst}
          className="text-xs font-mono font-bold py-2 px-2 text-center rounded-lg bg-[#FF9F0A]/15 hover:bg-[#FF9F0A]/25 text-[#FF9F0A] border border-[#FF9F0A] transition-colors cursor-pointer whitespace-nowrap truncate"
        >
          💥 INJECT BATCH BURST
        </button>

        <button
          type="button"
          onClick={handleToggleSaturation}
          className="text-xs font-mono font-bold py-2 px-2 text-center rounded-lg bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 text-[#00F0FF] border border-[#00F0FF] shadow-[0_0_8px_rgba(0,240,255,0.25)] transition-colors cursor-pointer whitespace-nowrap truncate"
        >
          ⚡ TOGGLE SLOT SATURATION
        </button>

        <button
          type="button"
          onClick={handleStepPluginExec}
          className="text-xs font-mono font-bold py-2 px-2 text-center rounded-lg bg-[#10B981]/15 hover:bg-[#10B981]/25 text-[#10B981] border border-[#10B981] transition-colors cursor-pointer whitespace-nowrap truncate"
        >
          🚀 STEP PLUGIN EXEC
        </button>

        <button
          type="button"
          onClick={handleFlushQueues}
          className="text-xs font-mono font-bold py-2 px-2 text-center rounded-lg bg-[#EF4444]/15 hover:bg-[#EF4444]/25 text-[#EF4444] border border-[#EF4444] transition-colors cursor-pointer whitespace-nowrap truncate"
        >
          🔄 FLUSH SCHEDULER QUEUES
        </button>
      </section>

      {/* PIT-WALL RADIO COMMS LOG */}
      <footer
        aria-label="Pit-Wall Radio Comms Log"
        className="h-14 overflow-hidden font-mono text-[10px] p-2 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-tight flex flex-col justify-between"
      >
        {engineState.radioLogs.slice(-3).map((entry, idx) => (
          <div key={entry.timestamp + "-" + String(idx)} className="truncate">
            {entry.formattedLine}
          </div>
        ))}
      </footer>

      {/* SCHEMA & AUDIT MODAL OVERLAY (Bounded within h-screen) */}
      {schemaModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#05070B] border border-[#00F0FF] rounded-lg max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden p-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <span className="font-mono text-xs font-bold text-[#00F0FF]">
                GF-T3-246 · SUPABASE / POSTGRESQL PARTITIONED SCHEMA & RLS AUDIT
              </span>
              <button
                type="button"
                onClick={() => setSchemaModalOpen(false)}
                className="px-2 py-0.5 text-xs font-mono font-bold bg-slate-900 text-slate-200 border border-slate-700 rounded cursor-pointer"
              >
                [CLOSE]
              </button>
            </div>
            <pre className="flex-1 overflow-auto font-mono text-[11px] text-emerald-300 bg-black/90 p-3 rounded border border-slate-800 leading-relaxed">
              {GF_T3_246_POSTGRES_SCHEMA}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
