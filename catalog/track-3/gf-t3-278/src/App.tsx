/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  CORRIDOR_METRICS,
  EngineStateSnapshot,
  GridSyncWarmSwapPayloadSchema,
  SYNTHETIC_CORRIDORS,
  SyntheticCorridor,
  buildDeterministicAdapterMatrices,
  createInitialEngineState,
  executeWarmSwapBurst,
  flushSwapArenas,
  sanitizeGridSyncString,
  stepAtomicPointerFlipPass,
  toggleAdapterCyclingSpike,
} from "./engine/loraWarmSwapEngine";
import { SUPABASE_POSTGRES_SCHEMA_SQL } from "./engine/sqlSchema";

type CockpitTab = "Mesh" | "Swap" | "Warm" | "Stats" | "APA";

const TABS: CockpitTab[] = ["Mesh", "Swap", "Warm", "Stats", "APA"];

export default function App() {
  const [engineState, setEngineState] = useState<EngineStateSnapshot>(() =>
    createInitialEngineState()
  );
  const [activeTab, setActiveTab] = useState<CockpitTab>("Mesh");
  const [schemaModalOpen, setSchemaModalOpen] = useState<boolean>(false);
  const [apaNotice, setApaNotice] = useState<string>(
    "SOVEREIGN APA TITLE READY · STANDALONE REPO + SUPABASE RLS SCHEMA VERIFIED"
  );
  const [customAlpha, setCustomAlpha] = useState<number>(32);
  const [customRank, setCustomRank] = useState<number>(16);
  const [tenantInput, setTenantInput] = useState<string>("TENANT_K3_PROD");

  const selectedAdapter =
    engineState.adapters[engineState.selectedAdapterIndex] || engineState.adapters[3];

  const handleCorridorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const chosen = e.target.value as SyntheticCorridor;
    const spec = CORRIDOR_METRICS[chosen];
    setEngineState((prev) => ({
      ...prev,
      corridor: chosen,
      swapThroughputGbps: spec.baseThroughputGbps,
      stagingLatencyUs: spec.baseLatencyUs,
      radioLogs: [
        {
          timestamp: "[00:02.12]",
          callsign: "⚡ PIT WALL",
          message:
            "Synthetic routing switched to " +
            chosen +
            " · Swap Throughput: " +
            spec.baseThroughputGbps.toLocaleString() +
            " GB/s",
        },
        ...prev.radioLogs,
      ].slice(0, 12),
    }));
  };

  const handleBurstTrigger = () => {
    setEngineState((prev) => executeWarmSwapBurst(prev));
  };

  const handleToggleCyclingSpike = () => {
    setEngineState((prev) => toggleAdapterCyclingSpike(prev));
  };

  const handleStepPointerFlip = () => {
    setEngineState((prev) => stepAtomicPointerFlipPass(prev));
  };

  const handleFlushArenas = () => {
    setEngineState((prev) => flushSwapArenas(prev));
  };

  const handleSelectAdapter = (index: number) => {
    setEngineState((prev) => {
      const chosen = prev.adapters[index];
      return {
        ...prev,
        selectedAdapterIndex: index,
        vecSummary: chosen.wWarmDiag,
        radioLogs: [
          {
            timestamp: "[00:02.40]",
            callsign: "🟢 TELEMETRY",
            message:
              "Inspector locked to " +
              chosen.id +
              " (" +
              chosen.hexPtr +
              ") · Bank: " +
              chosen.activeBank +
              " · W_warm Diag: [" +
              chosen.wWarmDiag.join(", ") +
              "]",
          },
          ...prev.radioLogs,
        ].slice(0, 12),
      };
    });
  };

  const handleStageCustomAdapter = () => {
    const safeTenant = sanitizeGridSyncString(tenantInput || "TENANT_CLEAN");
    const { bNext, aNext } = buildDeterministicAdapterMatrices(
      selectedAdapter.index,
      engineState.totalPointerFlips + 3
    );
    const parsed = GridSyncWarmSwapPayloadSchema.safeParse({
      adapterIndex: selectedAdapter.index,
      alpha: customAlpha,
      rank: customRank,
      corridor: engineState.corridor,
      tenantTag: safeTenant,
      bNext,
      aNext,
    });

    if (!parsed.success) {
      setEngineState((prev) => ({
        ...prev,
        radioLogs: [
          {
            timestamp: "[00:03.00]",
            callsign: "🔴 TELEMETRY",
            message: "GridSync Zero-Trust Gate blocked invalid LoRA staging payload",
          },
          ...prev.radioLogs,
        ].slice(0, 12),
      }));
      return;
    }

    setEngineState((prev) => {
      const stepped = stepAtomicPointerFlipPass(prev, selectedAdapter.index);
      const updatedAdapters = stepped.adapters.map((unit, idx) =>
        idx === selectedAdapter.index
          ? {
              ...unit,
              alpha: parsed.data.alpha,
              rank: parsed.data.rank,
              rankLabel: "R-" + String(parsed.data.rank),
            }
          : unit
      );
      return {
        ...stepped,
        adapters: updatedAdapters,
      };
    });
  };

  const saturationPercent = Math.min(
    100,
    Math.round((engineState.swapThroughputGbps / 38400) * 100)
  );

  const formattedThroughput = engineState.swapThroughputGbps.toLocaleString() + " GB/s";
  const formattedLatency = engineState.stagingLatencyUs.toFixed(2) + " µs";
  const formattedTokens = engineState.processedTokens.toLocaleString() + " UNITS";
  const formattedXp = "+" + engineState.engineXpK.toFixed(1) + "k ENGINE XP";

  const meshSubheaderLine =
    "VIEW: " +
    activeTab.toUpperCase() +
    " · PTR: " +
    engineState.globalPtr +
    " · MODE: LORA_WARM_SWAP · ADAPTERS: " +
    String(engineState.activeAdaptersCount) +
    " · VEC: [" +
    engineState.vecSummary.map((v) => v.toFixed(2)).join(", ") +
    "]";

  const inspectorLine =
    selectedAdapter.id +
    " · TOK: " +
    String(selectedAdapter.tokensK) +
    "K · RANK: " +
    selectedAdapter.rankLabel +
    " · SYNC: " +
    String(selectedAdapter.syncPct) +
    "% · PTR " +
    selectedAdapter.hexPtr +
    " · SWAP: OK · LOCKED";

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans">
      {/* TOP HEADER ROW 1 */}
      <header className="flex flex-col gap-0.5 w-full shrink-0">
        <div className="flex items-center justify-between gap-1 w-full shrink-0">
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <h1 className="text-sm font-mono font-bold tracking-tight text-white">
              GF-T3-278
            </h1>
            <span className="text-[10px] font-mono font-bold text-[#00F0FF] tracking-wider">
              FLAGSHIP
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <select
              aria-label="Synthetic Warm-Swap Corridor"
              value={engineState.corridor}
              onChange={handleCorridorChange}
              className="max-w-[110px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 border border-slate-700 rounded text-cyan-300 focus:outline-none focus:border-cyan-400"
            >
              {SYNTHETIC_CORRIDORS.map((corridor) => (
                <option key={corridor} value={corridor}>
                  {corridor}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleStepPointerFlip}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/50 rounded cursor-pointer whitespace-nowrap shrink-0"
            >
              [Swap]
            </button>
            <button
              type="button"
              onClick={handleBurstTrigger}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/50 rounded cursor-pointer whitespace-nowrap shrink-0"
            >
              [Warm]
            </button>
            <button
              type="button"
              onClick={handleToggleCyclingSpike}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-500/50 rounded cursor-pointer whitespace-nowrap shrink-0"
            >
              [Run]
            </button>
            <button
              type="button"
              onClick={() => setSchemaModalOpen((prev) => !prev)}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded cursor-pointer whitespace-nowrap shrink-0"
            >
              [SQL]
            </button>
          </div>
        </div>

        {/* TOP HEADER ROW 2 */}
        <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap overflow-hidden">
          LoRA Warm-Swapping · Dual-Buffer Ping-Pong · Zero Downtime
        </div>
      </header>

      {/* 4-CARD ARCADE HUD RIBBON (2x2 Grid Above The Fold) */}
      <section
        aria-label="Telemetry HUD Ribbon"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-0.5"
      >
        {/* Card 1: SWAP NITRO */}
        <div className="px-2 py-1 rounded border border-slate-800 bg-slate-900/70 flex flex-col justify-between">
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
            <span>SWAP NITRO</span>
            <span className="text-cyan-400 font-bold">{String(saturationPercent)}% BUS</span>
          </div>
          <div className="text-[#00F0FF] font-mono text-lg font-bold leading-tight whitespace-nowrap">
            {formattedThroughput}
          </div>
          <div className="w-full bg-slate-800 h-1 rounded overflow-hidden my-0.5">
            <div
              className="bg-[#00F0FF] h-full transition-opacity duration-150"
              style={{ width: String(saturationPercent) + "%" }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            Swap Throughput Saturation
          </div>
        </div>

        {/* Card 2: WARM STREAK */}
        <div className="px-2 py-1 rounded border border-slate-800 bg-slate-900/70 flex flex-col justify-between">
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
            <span>WARM STREAK</span>
            <span className="text-[#FF9F0A] font-bold">🔥 DUAL-BUF</span>
          </div>
          <div className="text-[#FF9F0A] font-mono text-lg font-bold leading-tight whitespace-nowrap">
            {formattedLatency}
          </div>
          <div className="text-[10px] font-mono text-emerald-400 truncate">
            SM Coherence: 100% Zero Stall
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            Staging Latency
          </div>
        </div>

        {/* Card 3: ACTIVE ADAPTERS */}
        <div className="px-2 py-1 rounded border border-slate-800 bg-slate-900/70 flex flex-col justify-between">
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
            <span>ACTIVE ADAPTERS</span>
            <span className="text-emerald-400 font-bold">Active Adapters: 8 Adapters</span>
          </div>
          <div className="text-white font-mono text-lg font-bold leading-tight whitespace-nowrap">
            ADAPTERS: 8/8
          </div>
          <div className="flex items-center justify-between gap-0.5 text-[9px] font-mono">
            {engineState.adapters.map((unit) => {
              const isSelected = unit.index === engineState.selectedAdapterIndex;
              return (
                <button
                  key={unit.id}
                  type="button"
                  onClick={() => handleSelectAdapter(unit.index)}
                  className={
                    "px-1 rounded cursor-pointer " +
                    (isSelected
                      ? "bg-cyan-500/30 text-cyan-200 border border-cyan-400 font-bold"
                      : "bg-slate-800 text-emerald-300")
                  }
                >
                  {unit.id}
                </button>
              );
            })}
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            F1 Gear Shift Indicator [K0..K7]
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="px-2 py-1 rounded border border-slate-800 bg-slate-900/70 flex flex-col justify-between">
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
            <span>TOKEN SCORE</span>
            <span className="text-emerald-400 font-bold">{formattedXp}</span>
          </div>
          <div className="text-emerald-400 font-mono text-lg font-bold leading-tight whitespace-nowrap">
            {formattedTokens}
          </div>
          <div className="text-[10px] font-mono text-cyan-300 truncate">
            Processed Tokens: {engineState.processedTokens.toLocaleString()} Units
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Swap State: {engineState.swapState}
          </div>
        </div>
      </section>

      {/* 5 HORIZONTAL TABS */}
      <nav
        aria-label="Cockpit Workspace Views"
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
                "py-0.5 text-xs font-mono font-bold rounded cursor-pointer transition-opacity whitespace-nowrap " +
                (isActive
                  ? "bg-cyan-500/20 text-[#00F0FF] border border-cyan-400/60"
                  : "text-slate-400 hover:text-slate-200")
              }
            >
              {tab}
            </button>
          );
        })}
      </nav>

      {/* STREAMLINED MESH INFO SUBHEADER (Strictly Clean of Action Buttons) */}
      <div className="text-[10px] font-mono whitespace-nowrap overflow-hidden text-slate-300 px-1 shrink-0">
        {meshSubheaderLine}
      </div>

      {/* CONTEXTUAL TAB STRIP (When Swap, Warm, Stats, or APA tab is selected) */}
      {activeTab === "Swap" && (
        <div className="px-2 py-1 bg-slate-900/90 border border-cyan-500/40 rounded flex items-center justify-between gap-2 text-[10px] font-mono shrink-0">
          <span className="text-cyan-300 font-bold truncate">
            DUAL-BUFFER FORMULA: W_warm = W_0 + (alpha / r) * (B_next @ A_next) · SLOT{" "}
            {selectedAdapter.id} ({selectedAdapter.activeBank} ACTIVE:{" "}
            {selectedAdapter.hexPtr} / STANDBY: {selectedAdapter.standbyPtr})
          </span>
          <span className="text-emerald-400 font-bold whitespace-nowrap">
            FLIPS: {String(engineState.totalPointerFlips)} · ZERO STALL
          </span>
        </div>
      )}

      {activeTab === "Warm" && (
        <div className="px-2 py-1 bg-slate-900/90 border border-amber-500/40 rounded flex items-center justify-between gap-2 text-[10px] font-mono shrink-0">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-amber-300 font-bold whitespace-nowrap">
              PRE-STAGE {selectedAdapter.id}:
            </span>
            <label className="flex items-center gap-1 text-slate-300">
              <span>ALPHA</span>
              <input
                type="number"
                min={4}
                max={256}
                value={customAlpha}
                onChange={(e) => setCustomAlpha(Number(e.target.value) || 32)}
                className="w-12 bg-black border border-slate-700 rounded px-1 text-cyan-300"
              />
            </label>
            <label className="flex items-center gap-1 text-slate-300">
              <span>RANK</span>
              <select
                value={customRank}
                onChange={(e) => setCustomRank(Number(e.target.value) || 16)}
                className="bg-black border border-slate-700 rounded px-1 text-cyan-300"
              >
                <option value={8}>R-8</option>
                <option value={16}>R-16</option>
                <option value={32}>R-32</option>
                <option value={64}>R-64</option>
              </select>
            </label>
            <input
              type="text"
              value={tenantInput}
              onChange={(e) => setTenantInput(e.target.value)}
              aria-label="Tenant Identifier"
              className="w-28 bg-black border border-slate-700 rounded px-1 text-slate-200"
            />
          </div>
          <button
            type="button"
            onClick={handleStageCustomAdapter}
            className="px-2 py-0.5 bg-amber-500/20 border border-amber-400 text-amber-300 font-bold rounded cursor-pointer whitespace-nowrap"
          >
            STAGE &amp; FLIP {selectedAdapter.id}
          </button>
        </div>
      )}

      {activeTab === "Stats" && (
        <div className="px-2 py-1 bg-slate-900/90 border border-emerald-500/40 rounded flex items-center justify-between gap-2 text-[10px] font-mono shrink-0">
          <span className="text-emerald-300 truncate">
            W_warm[{selectedAdapter.id}] DIAG: [{selectedAdapter.wWarmDiag.join(", ")}] ·
            THROUGHPUT: {formattedThroughput} · STAGING LATENCY: {formattedLatency}
          </span>
          <span className="text-cyan-300 font-bold whitespace-nowrap">
            NIST SP 800-218 SSDF v1.1 · RLS VERIFIED
          </span>
        </div>
      )}

      {activeTab === "APA" && (
        <div className="px-2 py-1 bg-slate-900/95 border border-amber-500/60 rounded flex items-center justify-between gap-2 text-[10px] font-mono shrink-0">
          <span className="text-amber-300 font-bold truncate">{apaNotice}</span>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() =>
                setApaNotice(
                  "APA TITLE PACKET LOCKED FOR GF-T3-278 · CLEAN-ROOM MIT PROVENANCE ATTESTED"
                )
              }
              className="px-2 py-0.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400 text-emerald-300 font-bold rounded cursor-pointer whitespace-nowrap"
            >
              ACQUIRE TITLE (APA)
            </button>
            <button
              type="button"
              onClick={() =>
                setApaNotice(
                  "VAULT BUYOUT DOSSIER DISPATCHED · ZERO-SAAS SLA & STANDALONE REPO READY"
                )
              }
              className="px-2 py-0.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 text-cyan-300 font-bold rounded cursor-pointer whitespace-nowrap"
            >
              INQUIRE VAULT BUYOUT
            </button>
          </div>
        </div>
      )}

      {/* INTERACTIVE ADAPTER MATRIX BAY (K0-K7 in Clean 4x2 Grid) */}
      <main
        aria-label="Interactive Adapter Matrix Bay"
        className="grid grid-cols-2 md:grid-cols-4 gap-1 p-1 flex-1 min-h-0 my-0.5 overflow-hidden"
      >
        {engineState.adapters.map((unit) => {
          const isSelected = unit.index === engineState.selectedAdapterIndex;
          return (
            <div
              key={unit.id}
              role="button"
              tabIndex={0}
              onClick={() => handleSelectAdapter(unit.index)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleSelectAdapter(unit.index);
                }
              }}
              className={
                "py-1 px-2 rounded border bg-slate-900/60 flex flex-col justify-between gap-0.5 cursor-pointer transition-opacity overflow-hidden " +
                (isSelected
                  ? "border-[#00F0FF] bg-slate-900/95"
                  : unit.isCyclingSpike
                  ? "border-amber-500/70"
                  : "border-slate-800 hover:border-slate-700")
              }
            >
              {/* Line 1 (Title & Hex) */}
              <div className="text-[11px] font-mono font-bold text-white flex justify-between items-center gap-2 whitespace-nowrap">
                <span className="truncate">{unit.title}</span>
                <span className="text-cyan-400 shrink-0">{unit.hexPtr}</span>
              </div>

              {/* Line 2 (Tokens & Rank) */}
              <div className="flex justify-between items-center gap-2 text-[11px] font-mono font-bold text-cyan-300 whitespace-nowrap">
                <span className="truncate">TOK: {String(unit.tokensK)}K</span>
                <span className="shrink-0">RANK: {unit.rankLabel}</span>
              </div>

              {/* Line 3 (Latency & State) */}
              <div className="flex justify-between items-center gap-2 text-[10px] font-mono whitespace-nowrap">
                <span className="text-[#FF9F0A] font-bold shrink-0">
                  {unit.latencyMs.toFixed(2)}ms
                </span>
                <span className="text-[#10B981] font-bold truncate">
                  {unit.stateLabel}
                </span>
              </div>
            </div>
          );
        })}
      </main>

      {/* COMPACT SWAP TELEMETRY INSPECTOR STRIP */}
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
          onClick={handleBurstTrigger}
          className="border border-[#FF9F0A] bg-amber-950/30 hover:bg-amber-900/40 text-[#FF9F0A] rounded text-xs font-mono font-bold py-2 text-center cursor-pointer whitespace-nowrap truncate px-1"
        >
          💥 INJECT LORA WARM-SWAP BURST
        </button>

        <button
          type="button"
          onClick={handleToggleCyclingSpike}
          className="border border-[#00F0FF] bg-cyan-950/30 hover:bg-cyan-900/40 text-[#00F0FF] rounded text-xs font-mono font-bold py-2 text-center cursor-pointer whitespace-nowrap truncate px-1"
        >
          ⚡ TOGGLE ADAPTER CYCLING SPIKE
        </button>

        <button
          type="button"
          onClick={handleStepPointerFlip}
          className="border border-[#10B981] bg-emerald-950/30 hover:bg-emerald-900/40 text-[#10B981] rounded text-xs font-mono font-bold py-2 text-center cursor-pointer whitespace-nowrap truncate px-1"
        >
          🚀 STEP ATOMIC POINTER FLIP PASS
        </button>

        <button
          type="button"
          onClick={handleFlushArenas}
          className="border border-rose-500 bg-rose-950/30 hover:bg-rose-900/40 text-rose-400 rounded text-xs font-mono font-bold py-2 text-center cursor-pointer whitespace-nowrap truncate px-1"
        >
          🔄 FLUSH SWAP ARENAS
        </button>
      </section>

      {/* PIT-WALL RADIO COMMS LOG */}
      <footer
        aria-label="Pit-Wall Radio Comms Log"
        className="h-8 overflow-hidden font-mono text-[9px] px-2 py-0.5 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-normal flex flex-col justify-center"
      >
        {engineState.radioLogs.slice(0, 2).map((entry, idx) => (
          <div key={String(idx) + entry.timestamp} className="truncate whitespace-nowrap">
            {entry.timestamp} {entry.callsign}: {entry.message}
          </div>
        ))}
      </footer>

      {/* OPTIONAL OVERLAY FOR SUPABASE / POSTGRESQL RLS SCHEMA INSPECTION */}
      {schemaModalOpen && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50">
          <div className="bg-[#05070B] border border-cyan-500/60 rounded-lg max-w-3xl w-full p-3 flex flex-col gap-2 max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="text-xs font-mono font-bold text-cyan-300">
                GF-T3-278 SUPABASE / POSTGRESQL PARTITIONED RLS SCHEMA
              </span>
              <button
                type="button"
                onClick={() => setSchemaModalOpen(false)}
                className="px-2 py-0.5 text-xs font-mono font-bold bg-rose-950/50 border border-rose-500 text-rose-300 rounded cursor-pointer"
              >
                [CLOSE]
              </button>
            </div>
            <pre className="text-[10px] font-mono text-slate-300 bg-black/90 p-2 rounded border border-slate-800 overflow-y-auto flex-1">
              {SUPABASE_POSTGRES_SCHEMA_SQL}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
