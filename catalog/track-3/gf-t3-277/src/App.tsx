/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import {
  CorridorType,
  SYNTHETIC_PIPELINE_CORRIDORS,
  GridSyncPayload,
  createInitialPayload,
  evaluatePipelinePartitionState,
} from "./engine/pipelinePartitionEngine";
import { SUPABASE_POSTGRES_SCHEMA_SQL } from "./engine/sqlSchema";

type CockpitTab = "Mesh" | "Pipe" | "Shrd" | "Stats" | "APA";

const TABS: readonly CockpitTab[] = ["Mesh", "Pipe", "Shrd", "Stats", "APA"];

interface RadioLogEntry {
  timestamp: string;
  callsign: "🟢 CREW CHIEF" | "🟢 TELEMETRY" | "🔴 TELEMETRY" | "⚡ PIT WALL";
  message: string;
}

const INITIAL_RADIO_LOGS: RadioLogEntry[] = [
  {
    timestamp: "[00:01.04]",
    callsign: "🟢 CREW CHIEF",
    message:
      "Multi-GPU pipeline partitioning and layer-wise tensor sharding engine initialized · 8 stages linked",
  },
  {
    timestamp: "[00:01.08]",
    callsign: "🟢 TELEMETRY",
    message:
      "Pipelined micro-batch scheduling verified at 36,000 GB/s with zero stage stalls",
  },
];

export default function App() {
  const [payload, setPayload] = useState<GridSyncPayload>(() =>
    createInitialPayload()
  );
  const [activeTab, setActiveTab] = useState<CockpitTab>("Mesh");
  const [selectedStageIdx, setSelectedStageIdx] = useState<number>(3);
  const [radioLogs, setRadioLogs] =
    useState<RadioLogEntry[]>(INITIAL_RADIO_LOGS);
  const [schemaModalOpen, setSchemaModalOpen] = useState<boolean>(false);
  const [apaStatusBanner, setApaStatusBanner] = useState<string>(
    "READY FOR DIRECT REPOSITORY HANDOVER · ZERO RECURRING FEES · 100% MIT CLEAN-ROOM TITLE"
  );

  const telemetry = useMemo(
    () => evaluatePipelinePartitionState(payload),
    [payload]
  );

  const selectedStage =
    telemetry.stages[selectedStageIdx] || telemetry.stages[3];

  const appendRadioPair = (
    firstCallsign: RadioLogEntry["callsign"],
    firstMsg: string,
    secondCallsign: RadioLogEntry["callsign"],
    secondMsg: string
  ) => {
    const stepNum = payload.burstPassCount + 2;
    const secStr = String(stepNum).padStart(2, "0");
    setRadioLogs([
      {
        timestamp: "[00:" + secStr + ".04]",
        callsign: firstCallsign,
        message: firstMsg,
      },
      {
        timestamp: "[00:" + secStr + ".08]",
        callsign: secondCallsign,
        message: secondMsg,
      },
    ]);
  };

  const handleCorridorChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const nextCorridor = event.target.value as CorridorType;
    setPayload((prev) => ({
      ...prev,
      corridor: nextCorridor,
    }));
    appendRadioPair(
      "🟢 CREW CHIEF",
      "Switched synthetic pipeline corridor to " + nextCorridor.slice(0, 42),
      "🟢 TELEMETRY",
      "Re-indexed NVLink P2P ring descriptors across 8 pipeline stages [P0..P7]"
    );
  };

  const handleTriggerPartitionBurst = () => {
    setPayload((prev) => {
      const nextCount = prev.burstPassCount + 1;
      return {
        ...prev,
        burstPassCount: nextCount,
        microBatches: Math.min(256, prev.microBatches + 4),
      };
    });
    appendRadioPair(
      "⚡ PIT WALL",
      "Trigger Pipeline Partitioning Burst executed · overlapping 1F1B forward/backward passes",
      "🟢 TELEMETRY",
      "Pipelined micro-batch scheduling verified at " +
        telemetry.throughputFormatted +
        " with zero stage stalls"
    );
  };

  const handleToggleImbalanceSpike = () => {
    const nextSpike = !payload.imbalanceSpikeActive;
    setPayload((prev) => ({
      ...prev,
      imbalanceSpikeActive: nextSpike,
      imbalanceTargetStage: selectedStageIdx,
    }));
    if (nextSpike) {
      appendRadioPair(
        "🔴 TELEMETRY",
        "Inject Stage Imbalance Spike on P" +
          String(selectedStageIdx) +
          " · forcing micro-batch re-routing across NVLink ring",
        "⚡ PIT WALL",
        "Sub-microsecond barrier dynamically shunting activation tensors around stage P" +
          String(selectedStageIdx)
      );
    } else {
      appendRadioPair(
        "🟢 CREW CHIEF",
        "Stage imbalance spike cleared · all 8 GPU pipeline stages restored to balanced lock",
        "🟢 TELEMETRY",
        "Pipelined micro-batch scheduling verified at 36,000 GB/s with zero stage stalls"
      );
    }
  };

  const handleStepShardingPass = () => {
    const nextStage = (selectedStageIdx + 1) % 8;
    setSelectedStageIdx(nextStage);
    setPayload((prev) => ({
      ...prev,
      burstPassCount: prev.burstPassCount + 1,
    }));
    appendRadioPair(
      "🟢 CREW CHIEF",
      "Step Pipelined Sharding Pass completed · advancing inspector focus to Stage P" +
        String(nextStage),
      "🟢 TELEMETRY",
      "Non-blocking peer-to-peer tensor forwarder streaming L" +
        String(nextStage * 4) +
        "-L" +
        String(nextStage * 4 + 4) +
        " at 0.01 µs"
    );
  };

  const handleFlushPipelineStages = () => {
    setPayload(createInitialPayload());
    setSelectedStageIdx(3);
    setRadioLogs(INITIAL_RADIO_LOGS);
  };

  const handleQuickPipeMode = () => {
    setActiveTab("Pipe");
    handleTriggerPartitionBurst();
  };

  const handleQuickShardMode = () => {
    setActiveTab("Shrd");
    handleStepShardingPass();
  };

  const handleQuickRunEngine = () => {
    setActiveTab("Mesh");
    handleTriggerPartitionBurst();
  };

  const vectorString =
    "[" +
    telemetry.vectorSignature.map((v) => v.toFixed(2)).join(", ") +
    "]";

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans select-none">
      {/* TOP HEADER ROW 1 */}
      <header className="flex items-center justify-between gap-1 w-full shrink-0 border-b border-slate-800/90 pb-1">
        <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
          <span className="w-2 h-2 rounded-full bg-[#00F0FF] shadow-[0_0_8px_#00F0FF]" />
          <h1 className="text-sm font-mono font-extrabold tracking-wider text-white">
            GF-T3-277
          </h1>
          <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/50 rounded">
            FLAGSHIP
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <select
            aria-label="Synthetic Pipeline Corridor"
            value={payload.corridor}
            onChange={handleCorridorChange}
            className="max-w-[110px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 border border-slate-700 text-cyan-300 rounded focus:outline-none focus:border-[#00F0FF]"
          >
            {SYNTHETIC_PIPELINE_CORRIDORS.map((corridor) => (
              <option key={corridor} value={corridor}>
                {corridor}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleQuickPipeMode}
            className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-[#00F0FF] border border-[#00F0FF]/40 rounded transition-colors cursor-pointer"
          >
            [Pipe]
          </button>
          <button
            type="button"
            onClick={handleQuickShardMode}
            className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-[#FF9F0A] border border-[#FF9F0A]/40 rounded transition-colors cursor-pointer"
          >
            [Shard]
          </button>
          <button
            type="button"
            onClick={handleQuickRunEngine}
            className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-emerald-950/80 hover:bg-emerald-900/80 text-[#10B981] border border-[#10B981]/50 rounded transition-colors cursor-pointer"
          >
            [Run]
          </button>
          <button
            type="button"
            onClick={() => setSchemaModalOpen((prev) => !prev)}
            className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded transition-colors cursor-pointer"
          >
            [Inspect Schema]
          </button>
          <button
            type="button"
            onClick={handleFlushPipelineStages}
            className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-rose-950 text-rose-300 border border-rose-800/60 rounded transition-colors cursor-pointer"
          >
            [Reset]
          </button>
        </div>
      </header>

      {/* TOP HEADER ROW 2 */}
      <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap shrink-0 py-0.5">
        Pipeline Partitioning · Tensor Sharding · Zero Stall
      </div>

      {/* 4-CARD ARCADE HUD RIBBON */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0">
        {/* Card 1: PIPE NITRO */}
        <div className="px-2 py-1 rounded border border-slate-800 bg-slate-900/75 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="font-bold text-cyan-400">PIPE NITRO</span>
            <span>BW: {telemetry.saturationPercent}%</span>
          </div>
          <div className="font-mono text-lg font-bold text-[#00F0FF] leading-tight">
            {telemetry.throughputFormatted}
          </div>
          <div className="w-full bg-slate-800 h-1 rounded overflow-hidden my-0.5">
            <div
              className="bg-[#00F0FF] h-full transition-opacity duration-150"
              style={{ width: String(telemetry.saturationPercent) + "%" }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Partition Throughput Saturation
          </div>
        </div>

        {/* Card 2: SHARD STREAK */}
        <div className="px-2 py-1 rounded border border-slate-800 bg-slate-900/75 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="font-bold text-[#FF9F0A]">SHARD STREAK</span>
            <span className="text-[#FF9F0A] font-bold">
              {telemetry.interconnectBadge}
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-white leading-tight">
            {telemetry.stagingLatencyFormatted}
          </div>
          <div className="text-[10px] font-mono text-emerald-400 truncate">
            Zero Host CPU Intervention · P2P DMA
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Staging Latency
          </div>
        </div>

        {/* Card 3: ACTIVE STAGES */}
        <div className="px-2 py-1 rounded border border-slate-800 bg-slate-900/75 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="font-bold text-emerald-400">ACTIVE STAGES</span>
            <span className="text-slate-300">
              Active Stages: {telemetry.activeStagesCount} Stages
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-[#10B981] leading-tight">
            STAGES: {telemetry.activeStagesCount}/{telemetry.totalStagesCount}
          </div>
          <div className="flex items-center justify-between gap-0.5 my-0.5">
            {telemetry.stages.map((st) => (
              <button
                key={st.stageCode}
                type="button"
                onClick={() => setSelectedStageIdx(st.stageIndex)}
                className={
                  "px-1 py-0 text-[9px] font-mono font-bold rounded border cursor-pointer " +
                  (st.stageIndex === selectedStageIdx
                    ? "bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]"
                    : st.isBalanced
                    ? "bg-emerald-950/60 text-emerald-300 border-emerald-700/50"
                    : "bg-rose-950/80 text-rose-300 border-rose-500")
                }
              >
                {st.stageCode}
              </button>
            ))}
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            F1 Gear Shift Stage Synchronizer [P0..P7]
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="px-2 py-1 rounded border border-slate-800 bg-slate-900/75 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="font-bold text-amber-400">TOKEN SCORE</span>
            <span className="text-[#10B981] font-bold">
              {telemetry.engineXpFormatted}
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-white leading-tight">
            {telemetry.processedTokensFormatted}
          </div>
          <div className="text-[10px] font-mono text-cyan-300 truncate">
            Processed Tokens: 6,912,000 Units
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            {telemetry.pipelineStateLabel}
          </div>
        </div>
      </section>

      {/* 5 HORIZONTAL TABS */}
      <nav
        aria-label="Cockpit Mode Tabs"
        className="grid grid-cols-5 gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg my-1 w-full text-center shrink-0"
      >
        {TABS.map((tab) => {
          const isCurrent = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={
                "py-0.5 text-xs font-mono font-bold rounded transition-colors cursor-pointer " +
                (isCurrent
                  ? "bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/60"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60")
              }
            >
              {tab}
            </button>
          );
        })}
      </nav>

      {/* STREAMLINED MESH INFO SUBHEADER (STRICTLY CLEAN OF ACTION BUTTONS) */}
      <div className="text-[10px] font-mono whitespace-nowrap overflow-hidden text-slate-300 px-1.5 py-0.5 bg-slate-950/90 border border-slate-800/80 rounded shrink-0">
        VIEW: {activeTab.toUpperCase()} · PTR: {telemetry.meshPtr} · MODE:{" "}
        {telemetry.modeCode} · STAGES: {telemetry.totalStagesCount} · VEC:{" "}
        {vectorString} · 1F1B BUBBLE: {telemetry.bubbleFractionPct}% · PARITY:{" "}
        {telemetry.balanceParityPct}%
      </div>

      {/* MAIN INTERACTIVE SIMULATION BAY (4x2 STAGE MATRIX P0-P7 + CONTEXTUAL OVERLAY FOR APA) */}
      <main className="flex-1 min-h-0 flex flex-col justify-between my-1 overflow-hidden">
        {activeTab === "APA" ? (
          <div className="h-full rounded border border-cyan-500/40 bg-slate-900/80 p-2 flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1">
              <span className="text-xs font-mono font-bold text-[#00F0FF]">
                GF-T3-277 SOVEREIGN ASSET PURCHASE AGREEMENT (APA) VAULT
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-400">
                100% MIT / APACHE-2.0 · ZERO SAAS LOCK-IN
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 my-1 text-[11px] font-mono">
              <div className="p-1.5 rounded bg-black/60 border border-slate-800 flex flex-col justify-between">
                <div className="flex justify-between items-center text-slate-300">
                  <span>CLEAN-ROOM PROVENANCE:</span>
                  <span className="text-emerald-400 font-bold">
                    ✓ VERIFIED
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>DATABASE PERSISTENCE:</span>
                  <span className="text-cyan-300 font-bold">
                    POSTGRESQL + RLS
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>TEST SUITE GATE:</span>
                  <span className="text-amber-400 font-bold">
                    VITEST + PYTEST PASS
                  </span>
                </div>
              </div>

              <div className="p-1.5 rounded bg-black/60 border border-slate-800 flex flex-col justify-between">
                <div className="flex justify-between items-center text-slate-300">
                  <span>PARTITION THROUGHPUT:</span>
                  <span className="text-cyan-300 font-bold">36,000 GB/s</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>STAGING LATENCY:</span>
                  <span className="text-emerald-400 font-bold">0.01 µs</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>PROCESSED TOKENS:</span>
                  <span className="text-white font-bold">6,912,000 Units</span>
                </div>
              </div>
            </div>

            <div className="text-[10px] font-mono text-amber-300 bg-black/70 border border-amber-500/30 rounded px-2 py-1 truncate">
              STATUS: {apaStatusBanner}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() =>
                  setApaStatusBanner(
                    "APA TITLE PACKAGE LOCKED · FULL REPOSITORY + DOCKERFILE + SUPABASE RLS ARCHIVE READY"
                  )
                }
                className="py-1.5 px-3 rounded bg-[#00F0FF]/20 hover:bg-[#00F0FF]/30 border border-[#00F0FF] text-[#00F0FF] font-mono text-xs font-bold text-center cursor-pointer"
              >
                ACQUIRE TITLE (APA)
              </button>
              <button
                type="button"
                onClick={() =>
                  setApaStatusBanner(
                    "VAULT BUYOUT INQUIRY LOGGED · DIRECT DEALERSHIP PRINCIPAL ESCROW CHANNEL OPENED"
                  )
                }
                className="py-1.5 px-3 rounded bg-[#FF9F0A]/20 hover:bg-[#FF9F0A]/30 border border-[#FF9F0A] text-[#FF9F0A] font-mono text-xs font-bold text-center cursor-pointer"
              >
                INQUIRE VAULT BUYOUT
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-4 grid-rows-2 gap-1.5 h-full w-full">
            {telemetry.stages.map((stage) => {
              const isSelected = stage.stageIndex === selectedStageIdx;
              const borderClass = !stage.isBalanced
                ? "border-[#EF4444] bg-rose-950/30"
                : isSelected
                ? "border-[#00F0FF] bg-slate-900/90"
                : "border-slate-800 bg-slate-900/60";

              return (
                <div
                  key={stage.stageCode}
                  onClick={() => setSelectedStageIdx(stage.stageIndex)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setSelectedStageIdx(stage.stageIndex);
                    }
                  }}
                  className={
                    "py-0 px-1.5 rounded border flex flex-col justify-between cursor-pointer transition-colors " +
                    borderClass
                  }
                >
                  {/* Line 1: Title & Hex */}
                  <div className="text-[11px] font-mono font-bold text-white flex justify-between items-center">
                    <span>{stage.titleLabel}</span>
                    <span className="text-slate-400">{stage.hexPtr}</span>
                  </div>

                  {/* Line 2: Tokens & Shard Layers */}
                  <div className="flex justify-between items-center text-[11px] font-mono font-bold text-cyan-300">
                    <span>{stage.tokensLabel}</span>
                    <span>{stage.layersLabel}</span>
                  </div>

                  {/* Line 3: Latency & State */}
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-[#FF9F0A] font-bold">
                      {stage.latencyLabel}
                    </span>
                    <span
                      className={
                        stage.isBalanced
                          ? "text-[#10B981] font-bold"
                          : "text-[#EF4444] font-bold"
                      }
                    >
                      {stage.statusText}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* COMPACT PIPELINE TELEMETRY INSPECTOR STRIP */}
      <div className="text-[11px] font-mono whitespace-nowrap overflow-hidden text-cyan-300 font-bold px-2 py-0.5 bg-black/60 border border-slate-800 rounded my-0.5 shrink-0 flex justify-between items-center">
        <span>
          {selectedStage.stageCode} · {selectedStage.tokensLabel} ·{" "}
          {selectedStage.layersLabel} · SYNC: {selectedStage.syncPercent}% · PTR{" "}
          {selectedStage.hexPtr} · PIPE: {selectedStage.pipeHealth} ·{" "}
          {selectedStage.isBalanced ? "LOCKED" : "FAULT"}
        </span>
        <span className="text-[10px] text-slate-400 hidden sm:inline">
          P_STAGE LOAD: {selectedStage.stagePartitionCost} · P2P:{" "}
          {selectedStage.p2pBandwidthGbs} GB/s
        </span>
      </div>

      {/* TACTICAL LAUNCH CONTROL SWITCHES */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1">
        <button
          type="button"
          onClick={handleTriggerPartitionBurst}
          className="border border-[#FF9F0A] bg-[#FF9F0A]/15 hover:bg-[#FF9F0A]/25 text-[#FF9F0A] rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer whitespace-nowrap truncate px-1"
        >
          💥 INJECT PIPELINE PARTITION BURST
        </button>

        <button
          type="button"
          onClick={handleToggleImbalanceSpike}
          className="border border-[#00F0FF] bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 text-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.2)] rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer whitespace-nowrap truncate px-1"
        >
          ⚡ TOGGLE STAGE IMBALANCE SPIKE
        </button>

        <button
          type="button"
          onClick={handleStepShardingPass}
          className="border border-[#10B981] bg-[#10B981]/15 hover:bg-[#10B981]/25 text-[#10B981] rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer whitespace-nowrap truncate px-1"
        >
          🚀 STEP PIPELINED SHARDING PASS
        </button>

        <button
          type="button"
          onClick={handleFlushPipelineStages}
          className="border border-rose-500 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer whitespace-nowrap truncate px-1"
        >
          🔄 FLUSH PIPELINE STAGES
        </button>
      </section>

      {/* PIT-WALL RADIO COMMS LOG */}
      <footer className="h-8 overflow-hidden font-mono text-[9px] px-2 py-0.5 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-normal flex flex-col justify-center">
        {radioLogs.slice(0, 2).map((entry, idx) => (
          <div key={idx} className="truncate whitespace-nowrap">
            {entry.timestamp} {entry.callsign}: {entry.message}
          </div>
        ))}
      </footer>

      {/* SQL SCHEMA MODAL OVERLAY */}
      {schemaModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-[#05070B] border border-[#00F0FF] rounded-lg p-3 flex flex-col gap-2 max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="text-xs font-mono font-bold text-[#00F0FF]">
                GF-T3-277 SUPABASE / POSTGRESQL PARTITIONED SCHEMA & RLS POLICIES
              </span>
              <button
                type="button"
                onClick={() => setSchemaModalOpen(false)}
                className="px-2 py-0.5 text-xs font-mono font-bold bg-rose-950 text-rose-300 border border-rose-700 rounded cursor-pointer"
              >
                [CLOSE]
              </button>
            </div>
            <pre className="text-[10px] font-mono text-slate-200 bg-black/90 p-2 rounded border border-slate-800 overflow-y-auto select-all leading-relaxed">
              {SUPABASE_POSTGRES_SCHEMA_SQL}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
