/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from "react";
import {
  SYNTHETIC_FLASH_CORRIDORS,
  SyntheticCorridor,
  runFlashAttentionCockpitPass,
  sanitizeGridSyncInput,
} from "./flashAttentionEngine";
import { runSelfContainedVerificationSuite } from "./flashAttentionEngine.test";

type CockpitTab = "Mesh" | "Flash" | "Mask" | "Stats" | "APA";

const TABS: CockpitTab[] = ["Mesh", "Flash", "Mask", "Stats", "APA"];

const INITIAL_LOGS: string[] = [
  "[00:01.04] 🟢 CREW CHIEF: FlashAttention ring-block engine initialized · 16 attention tiles linked",
  "[00:01.08] ⚡ PIT WALL: Block-wise online softmax scaling complete · Zero attention matrix materialization",
  "[00:01.12] 🟢 TELEMETRY: Causal masked throughput verified at 2,100 GB/s bandwidth saturation",
];

export default function App() {
  const [corridor, setCorridor] = useState<SyntheticCorridor>(
    SYNTHETIC_FLASH_CORRIDORS[0]
  );
  const [activeTab, setActiveTab] = useState<CockpitTab>("Mesh");
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number>(3);
  const [causalEnabled, setCausalEnabled] = useState<boolean>(true);
  const [contextSpillFault, setContextSpillFault] = useState<boolean>(false);
  const [burstActive, setBurstActive] = useState<boolean>(false);
  const [flushed, setFlushed] = useState<boolean>(false);
  const [stepPassCount, setStepPassCount] = useState<number>(0);
  const [radioLogs, setRadioLogs] = useState<string[]>(INITIAL_LOGS);
  const [apaModalState, setApaModalState] = useState<
    "NONE" | "ACQUIRE" | "INQUIRE" | "SCHEMA"
  >("NONE");

  const telemetry = useMemo(() => {
    return runFlashAttentionCockpitPass({
      corridor,
      causalEnabled,
      contextSpillFault,
      burstActive,
      flushed,
      stepPassCount,
    });
  }, [
    corridor,
    causalEnabled,
    contextSpillFault,
    burstActive,
    flushed,
    stepPassCount,
  ]);

  const verificationReport = useMemo(() => {
    return runSelfContainedVerificationSuite();
  }, []);

  const selectedBlock =
    telemetry.blocks[selectedBlockIndex] || telemetry.blocks[3];

  const appendLog = (callsign: string, message: string) => {
    const cleanMsg = sanitizeGridSyncInput(message);
    const totalSec = 1.16 + (stepPassCount + radioLogs.length) * 0.04;
    const secStr = totalSec.toFixed(2).padStart(5, "0");
    const entry = "[00:" + secStr + "] " + callsign + ": " + cleanMsg;
    setRadioLogs((prev) => [entry, prev[0], prev[1]]);
  };

  const handleCorridorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const rawVal = e.target.value;
    const cleanVal = sanitizeGridSyncInput(rawVal) as SyntheticCorridor;
    setCorridor(cleanVal);
    setFlushed(false);
    appendLog(
      "🟢 CREW CHIEF",
      "Switched synthetic flash corridor to " + cleanVal.slice(0, 22)
    );
  };

  const handleTriggerFlashBurst = () => {
    setFlushed(false);
    const nextBurst = !burstActive;
    const nextSpill = !contextSpillFault;
    setBurstActive(nextBurst);
    setContextSpillFault(nextSpill);
    appendLog(
      "🔴 TELEMETRY",
      nextSpill
        ? "Trigger Flash Attention Burst · Context Window Spill injected on B2 and B5"
        : "Flash Attention Burst stabilized · Ring-block accumulators resynchronized"
    );
  };

  const handleToggleCausalMask = () => {
    setFlushed(false);
    const nextCausal = !causalEnabled;
    setCausalEnabled(nextCausal);
    appendLog(
      "⚡ PIT WALL",
      nextCausal
        ? "Causal Masked Attention Tiling locked · Upper-triangular blocks skipped"
        : "Causal Mask disengaged · Evaluating full dense attention tiles"
    );
  };

  const handleStepFlashKernel = () => {
    setFlushed(false);
    setContextSpillFault(false);
    const nextStep = stepPassCount + 1;
    setStepPassCount(nextStep);
    appendLog(
      "🟢 CREW CHIEF",
      "Step Causal Mask Kernel Pass #" +
        String(nextStep) +
        " · Online softmax drift " +
        String(telemetry.maxNumericalDrift)
    );
  };

  const handleFlushBuffers = () => {
    setFlushed(true);
    setBurstActive(false);
    setContextSpillFault(false);
    appendLog(
      "⚡ PIT WALL",
      "Flush Attention Buffers & Re-Zero Accumulators complete · SRAM rings cleared"
    );
  };

  const handleQuickReset = () => {
    setCorridor(SYNTHETIC_FLASH_CORRIDORS[0]);
    setCausalEnabled(true);
    setContextSpillFault(false);
    setBurstActive(false);
    setFlushed(false);
    setStepPassCount(0);
    setSelectedBlockIndex(3);
    setRadioLogs(INITIAL_LOGS);
    setApaModalState("NONE");
  };

  const compactStateLabel =
    selectedBlock.state === "SOFTMAX_ACTIVE"
      ? "ACTIVE"
      : selectedBlock.state === "TILE_RESYNC_FAULT"
      ? "FAULT"
      : selectedBlock.state === "BUFFER_FLUSHED"
      ? "FLUSHED"
      : "SKIPPED";

  const inspectorLine =
    selectedBlock.blockId +
    " · [" +
    String(selectedBlock.tileCoords[0]) +
    "," +
    String(selectedBlock.tileCoords[1]) +
    "] · MASK: " +
    (causalEnabled ? "CAUSAL" : "DENSE") +
    " · SCALE: " +
    selectedBlock.scaleFactor.toFixed(4) +
    " · " +
    compactStateLabel;

  const saturationPct = Math.min(
    100,
    Math.round((telemetry.attentionBandwidthGbs / 2100) * 100)
  );

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans select-none">
      {/* Top Header Row 1 */}
      <header className="flex flex-col gap-0.5 w-full shrink-0">
        <div className="flex items-center justify-between gap-1 w-full shrink-0">
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <h1 className="text-sm font-mono font-extrabold tracking-tight text-white">
              GF-T3-236
            </h1>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/50 rounded">
              TRACK 3
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono text-emerald-400">
              {contextSpillFault ? "⚡ FAULT" : "✓ LOCKED"}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <select
              aria-label="Synthetic Flash Corridor"
              value={corridor}
              onChange={handleCorridorChange}
              className="max-w-[110px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 text-cyan-300 border border-slate-700 rounded focus:outline-none focus:border-[#00F0FF]"
            >
              {SYNTHETIC_FLASH_CORRIDORS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleTriggerFlashBurst}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#FF9F0A]/15 text-[#FF9F0A] border border-[#FF9F0A]/50 rounded hover:bg-[#FF9F0A]/25 transition-colors cursor-pointer"
            >
              [Flash]
            </button>
            <button
              type="button"
              onClick={handleToggleCausalMask}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/50 rounded hover:bg-[#00F0FF]/25 transition-colors cursor-pointer"
            >
              [Mask]
            </button>
            <button
              type="button"
              onClick={handleStepFlashKernel}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/50 rounded hover:bg-emerald-500/25 transition-colors cursor-pointer"
            >
              [Run]
            </button>
            <button
              type="button"
              onClick={() =>
                setApaModalState(apaModalState === "SCHEMA" ? "NONE" : "SCHEMA")
              }
              className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-800 text-slate-200 border border-slate-700 rounded hover:border-cyan-400 transition-colors cursor-pointer"
            >
              [Inspect Schema]
            </button>
            <button
              type="button"
              onClick={handleQuickReset}
              className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700 rounded hover:border-rose-400 transition-colors cursor-pointer"
            >
              [Reset]
            </button>
          </div>
        </div>

        {/* Top Header Row 2 */}
        <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap truncate">
          FlashAttention Ring-Block Scale · Causal Mask · Zero Materialization
        </div>
      </header>

      {/* 4-Card Arcade HUD Ribbon (2x2 on mobile, 4 cols on desktop) */}
      <section
        aria-label="Telemetry HUD Ribbon"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-0.5"
      >
        {/* Card 1: FLASH NITRO */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="font-bold text-cyan-400">FLASH NITRO</span>
            <span>Attention Bandwidth: {telemetry.bandwidthFormatted}</span>
          </div>
          <div className="font-mono text-lg font-bold text-[#00F0FF] leading-tight tabular-nums">
            {telemetry.bandwidthFormatted}
          </div>
          <div className="w-full bg-slate-950 h-1.5 rounded overflow-hidden border border-slate-800 my-0.5">
            <div
              className="bg-[#00F0FF] h-full transition-all duration-150"
              style={{ width: String(saturationPct) + "%" }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            Attention Bandwidth Saturation
          </div>
        </div>

        {/* Card 2: LATENCY STREAK */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="font-bold text-[#FF9F0A]">LATENCY STREAK</span>
            <span className="px-1 py-0.2 bg-[#FF9F0A]/20 text-[#FF9F0A] border border-[#FF9F0A]/40 rounded font-bold">
              🔥 16 BLOCKS
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-amber-400 leading-tight tabular-nums">
            {telemetry.latencyFormatted}
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            Kernel Execution Latency · Kernel Latency: {telemetry.latencyFormatted}
          </div>
        </div>

        {/* Card 3: ACTIVE BLOCKS */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="font-bold text-emerald-400">ACTIVE BLOCKS</span>
            <span>Active Blocks: {telemetry.activeBlocks} Blocks</span>
          </div>
          <div className="font-mono text-lg font-bold text-emerald-400 leading-tight tabular-nums">
            BLOCKS: {telemetry.activeBlocks}/{telemetry.totalBlocks}
          </div>
          <div
            className="grid grid-cols-16 gap-0.5 my-0.5"
            title="F1 Gear Shift Indicator [B0..B15]"
          >
            {telemetry.gearIndicators.map((gear) => (
              <span
                key={gear.id}
                className={
                  "h-1.5 rounded-xs " +
                  (gear.fault
                    ? "bg-rose-500"
                    : gear.active
                    ? gear.masked
                      ? "bg-[#00F0FF]"
                      : "bg-emerald-400"
                    : "bg-slate-800")
                }
              />
            ))}
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            [B0..B15] Gear Shift · Causal Omission: {telemetry.causalOmissionPct}%
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="font-bold text-cyan-300">TOKEN SCORE</span>
            <span className="text-emerald-400 font-bold">
              {telemetry.flashXpDelta}
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-slate-100 leading-tight tabular-nums">
            {telemetry.tokensFormatted}
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            Processed Tokens: 1,280,000 Units
          </div>
          <div className="text-[10px] font-mono text-cyan-300 truncate">
            Mask State: {telemetry.maskState}
          </div>
        </div>
      </section>

      {/* 5 Horizontal Tabs */}
      <nav
        aria-label="Cockpit Mode Tabs"
        className="grid grid-cols-5 gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg my-1 w-full text-center shrink-0"
      >
        {TABS.map((tab) => {
          const isSelected = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setActiveTab(tab);
                setApaModalState("NONE");
              }}
              className={
                "py-1 text-xs font-mono font-bold rounded transition-colors cursor-pointer " +
                (isSelected
                  ? "bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/60"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50")
              }
            >
              {tab}
            </button>
          );
        })}
      </nav>

      {/* Interactive Flash Attention Matrix Bay */}
      <main className="flex-1 min-h-0 flex flex-col justify-between bg-slate-950/90 border border-slate-800 rounded-lg p-2 overflow-hidden">
        {/* Top Context Banner inside Simulation Bay */}
        <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-2 text-[11px] font-mono">
            <span className="text-[#00F0FF] font-bold">
              RING-BLOCK MATRIX BAY [{activeTab.toUpperCase()}]
            </span>
            <span className="text-slate-400 hidden sm:inline">
              · SRAM Ring: {telemetry.sramStagingKb} KB · Parity:{" "}
              {telemetry.bufferParityPct}% · Drift: {telemetry.maxNumericalDrift}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setApaModalState("ACQUIRE")}
              className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/60 rounded hover:bg-emerald-500/30 cursor-pointer"
            >
              ACQUIRE TITLE (APA)
            </button>
            <button
              type="button"
              onClick={() => setApaModalState("INQUIRE")}
              className="px-2 py-0.5 text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/60 rounded hover:bg-amber-500/30 cursor-pointer"
            >
              INQUIRE VAULT BUYOUT
            </button>
          </div>
        </div>

        {/* 8 Interactive Attention Blocks (Block 0 to Block 7) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 my-auto py-1">
          {telemetry.blocks.map((blk) => {
            const isSelected = blk.blockIndex === selectedBlock.blockIndex;
            const isFault = blk.state === "TILE_RESYNC_FAULT";
            return (
              <button
                key={blk.blockId}
                type="button"
                onClick={() => {
                  setSelectedBlockIndex(blk.blockIndex);
                  appendLog(
                    "🟢 TELEMETRY",
                    "Inspected " +
                      blk.blockId +
                      " · SRAM " +
                      blk.sramPtr +
                      " · KV_IDX " +
                      String(blk.kvCacheIdx) +
                      " · " +
                      blk.state
                  );
                }}
                className={
                  "text-left p-1.5 rounded border transition-all font-mono cursor-pointer flex flex-col justify-between " +
                  (isFault
                    ? "bg-rose-950/40 border-rose-500 text-rose-200"
                    : isSelected
                    ? "bg-cyan-950/40 border-[#00F0FF] text-slate-100"
                    : "bg-slate-900/75 border-slate-800 text-slate-300 hover:border-slate-600")
                }
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-mono font-bold text-white truncate">
                    {blk.blockLabel} ({blk.blockId})
                  </span>
                  <span
                    className={
                      "text-[10px] font-mono font-bold shrink-0 " +
                      (isFault ? "text-rose-400" : "text-emerald-400")
                    }
                  >
                    {blk.lockBadge}
                  </span>
                </div>

                <div className="text-[11px] font-mono text-cyan-300 truncate my-0.5">
                  Tile: [{blk.tileCoords[0]}, {blk.tileCoords[1]}] · Mask:{" "}
                  {blk.causalRange}
                </div>

                <div className="text-[11px] font-mono text-amber-300 font-bold truncate pt-0.5 border-t border-slate-800/80">
                  Max: {blk.runningMax.toFixed(2)} · SRAM: {blk.sramPtr}
                </div>
              </button>
            );
          })}
        </div>

        {/* Dynamic Sub-Strip for Active Tab or APA / Schema Modal Info */}
        <div className="flex items-center justify-between gap-2 px-2 py-1 bg-slate-900/90 border border-slate-800 rounded text-[10px] font-mono text-slate-300 shrink-0">
          {apaModalState === "SCHEMA" ? (
            <div className="flex items-center justify-between w-full gap-2 truncate">
              <span className="text-cyan-300 font-bold truncate">
                SUPABASE RLS SCHEMA: PARTITIONED TABLE flash_kernel_runs ·
                flash_block_tiles · POLICY operator_uid = auth.uid()
              </span>
              <button
                type="button"
                onClick={() => setApaModalState("NONE")}
                className="text-rose-400 font-bold cursor-pointer shrink-0"
              >
                [CLOSE]
              </button>
            </div>
          ) : apaModalState === "ACQUIRE" || apaModalState === "INQUIRE" ? (
            <div className="flex items-center justify-between w-full gap-2 truncate">
              <span className="text-emerald-400 font-bold truncate">
                {apaModalState === "ACQUIRE"
                  ? "APA VAULT TRANSFER READY · 100% MIT/APACHE-2.0 CLEAN-ROOM IP · ZERO ENCUMBRANCES"
                  : "VAULT BUYOUT DOSSIER DISPATCHED · DIRECT REPOSITORY TRANSFER · ZERO RECURRING SLA"}
              </span>
              <button
                type="button"
                onClick={() => setApaModalState("NONE")}
                className="text-cyan-300 font-bold cursor-pointer shrink-0"
              >
                [ACKNOWLEDGE]
              </button>
            </div>
          ) : activeTab === "Stats" ? (
            <div className="flex items-center justify-between w-full gap-2 overflow-hidden">
              <span className="truncate">
                TESTS: {verificationReport.passed}/{verificationReport.total} (
                {verificationReport.passRatePct}%) · DRIFT:{" "}
                {telemetry.maxNumericalDrift}
              </span>
              <span className="text-emerald-400 font-bold shrink-0">
                SSDF VERIFIED
              </span>
            </div>
          ) : activeTab === "APA" ? (
            <div className="flex items-center justify-between w-full gap-2 overflow-hidden">
              <span className="truncate">
                APA CHASSIS: GF-T3-236 · MIT/APACHE-2.0 · SUPABASE RLS
              </span>
              <span className="text-amber-400 font-bold shrink-0">
                CLEAN TITLE
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full gap-2 overflow-hidden">
              <span className="truncate">
                SRAM: {selectedBlock.sramPtr} · KV_IDX:{" "}
                {selectedBlock.kvCacheIdx} · {compactStateLabel}
              </span>
              <span className="text-cyan-400 font-bold shrink-0">
                SKIP: {selectedBlock.skippedTiles} / EVAL:{" "}
                {selectedBlock.evaluatedTiles}
              </span>
            </div>
          )}
        </div>
      </main>

      {/* Compact Flash Attention Telemetry Inspector Strip */}
      <div
        aria-label="Flash Attention Telemetry Inspector Strip"
        className="w-full py-1 px-2 bg-slate-900/95 border border-slate-800 rounded text-center shrink-0 my-0.5 overflow-hidden"
      >
        <p className="text-xs font-mono font-bold text-cyan-300 truncate">
          {inspectorLine}
        </p>
      </div>

      {/* Tactical Launch Control Buttons */}
      <section
        aria-label="Tactical Launch Controls"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1"
      >
        <button
          type="button"
          onClick={handleTriggerFlashBurst}
          title="Trigger Flash Attention Burst / Inject Context Window Spill (Force Tile Resync)"
          className="bg-amber-950/40 hover:bg-amber-900/50 border border-[#FF9F0A] text-[#FF9F0A] rounded-lg text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer truncate px-1"
        >
          💥 INJECT FLASH BURST
        </button>

        <button
          type="button"
          onClick={handleToggleCausalMask}
          title="Toggle Causal Masked Attention Tiling"
          className="bg-cyan-950/40 hover:bg-cyan-900/50 border border-[#00F0FF] text-[#00F0FF] rounded-lg text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer truncate px-1"
        >
          ⚡ TOGGLE CAUSAL MASK
        </button>

        <button
          type="button"
          onClick={handleStepFlashKernel}
          title="Step Causal Mask Kernel Pass"
          className="bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500 text-emerald-400 rounded-lg text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer truncate px-1"
        >
          🚀 STEP FLASH KERNEL
        </button>

        <button
          type="button"
          onClick={handleFlushBuffers}
          title="Flush Attention Buffers & Re-Zero Accumulators"
          className="bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500 text-rose-400 rounded-lg text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer truncate px-1"
        >
          🔄 FLUSH ATTENTION BUFFERS
        </button>
      </section>

      {/* Pit-Wall Radio Log */}
      <footer
        aria-label="Pit-Wall Radio Log"
        className="h-14 overflow-hidden font-mono text-[10px] p-2 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-tight flex flex-col justify-between"
      >
        {radioLogs.slice(0, 3).map((line, idx) => (
          <div key={idx} className="truncate">
            {line}
          </div>
        ))}
      </footer>
    </div>
  );
}
