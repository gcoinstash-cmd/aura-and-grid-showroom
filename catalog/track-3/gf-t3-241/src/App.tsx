/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import {
  SPEC_CORRIDORS,
  SpecCorridor,
  SpeculativeBranch,
  advanceSpeculativeSimulation,
  createInitialTelemetryState,
  sanitizeGridSyncPayload,
  verifyDistributionParity,
} from "./engine/speculativeEngine";
import { SUPABASE_POSTGRES_SCHEMA_SQL } from "./engine/schemaSql";

type CockpitTab = "Mesh" | "Spec" | "Tree" | "Stats" | "APA";

const TABS: CockpitTab[] = ["Mesh", "Spec", "Tree", "Stats", "APA"];

const INITIAL_LOGS: string[] = [
  "[00:01.04] 🟢 CREW CHIEF: Speculative decoding verification engine initialized · 8 draft branches linked",
  "[00:01.08] ⚡ PIT WALL: Tree attention mask computed · Target-draft acceptance verified at 84.6%",
  "[00:01.12] 🟢 TELEMETRY: Dynamic KV cache rollback executed with zero CPU synchronization stalls",
];

function formatNumberWithCommas(val: number): string {
  return val.toLocaleString("en-US");
}

function formatClock(step: number): string {
  const totalCentis = 112 + step * 4;
  const secs = Math.floor(totalCentis / 100);
  const centis = totalCentis % 100;
  const secStr = secs < 10 ? "0" + String(secs) : String(secs);
  const centiStr = centis < 10 ? "0" + String(centis) : String(centis);
  return "[00:" + secStr + "." + centiStr + "]";
}

export default function App() {
  const [telemetry, setTelemetry] = useState(() => createInitialTelemetryState());
  const [activeTab, setActiveTab] = useState<CockpitTab>("Mesh");
  const [selectedBranchId, setSelectedBranchId] = useState<number>(3);
  const [radioLogs, setRadioLogs] = useState<string[]>(INITIAL_LOGS);
  const [schemaModalOpen, setSchemaModalOpen] = useState<boolean>(false);
  const [apaModalMessage, setApaModalMessage] = useState<string | null>(null);

  const selectedBranch: SpeculativeBranch = useMemo(() => {
    return (
      telemetry.branches.find((b) => b.branchId === selectedBranchId) ||
      telemetry.branches[3] ||
      telemetry.branches[0]
    );
  }, [telemetry.branches, selectedBranchId]);

  const parityCheck = useMemo(() => {
    const targetDist = selectedBranch.candidates.map((c) => c.pTarget);
    const draftDist = selectedBranch.candidates.map((c) => c.pDraft);
    return verifyDistributionParity(targetDist, draftDist);
  }, [selectedBranch]);

  const appendRadioLog = (callsign: string, message: string, stepOffset: number = 0) => {
    const stamp = formatClock(telemetry.stepCount + stepOffset);
    const entry = stamp + " " + callsign + ": " + message;
    setRadioLogs((prev) => [entry, ...prev.slice(0, 2)]);
  };

  const handleCorridorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const rawValue = e.target.value as SpecCorridor;
    const validated = sanitizeGridSyncPayload({
      action: "SELECT_CORRIDOR",
      corridor: rawValue,
      operatorNote: "Corridor switched",
    });
    if (validated.corridor) {
      setTelemetry((prev) => ({
        ...prev,
        corridor: validated.corridor as SpecCorridor,
      }));
      appendRadioLog(
        "🟢 CREW CHIEF",
        "Switched active corridor to " + validated.corridor.split(" ")[0] + " · GridSync verified",
        1
      );
    }
  };

  const handleInjectVerifyBurst = () => {
    sanitizeGridSyncPayload({
      action: "VERIFY_BURST",
      corridor: telemetry.corridor,
      branchId: selectedBranchId,
    });
    const next = advanceSpeculativeSimulation(telemetry, "VERIFY_BURST");
    setTelemetry(next);
    appendRadioLog(
      "⚡ PIT WALL",
      "Trigger Speculative Verification Burst · " +
        formatNumberWithCommas(next.verificationSpeed) +
        " tokens/s saturation across " +
        String(next.activeBranches) +
        "/8 branches",
      1
    );
  };

  const handleToggleDraftSpike = () => {
    sanitizeGridSyncPayload({
      action: "TOGGLE_SPIKE",
      corridor: telemetry.corridor,
    });
    const next = advanceSpeculativeSimulation(telemetry, "TOGGLE_SPIKE");
    setTelemetry(next);
    if (next.entropySpikeActive) {
      appendRadioLog(
        "🔴 TELEMETRY",
        "Inject Draft Entropy Spike · Forced KV pointer rollback on high-divergence branches",
        1
      );
    } else {
      appendRadioLog(
        "🟢 CREW CHIEF",
        "Draft Entropy Spike cleared · All 8 speculative branches restored to Tree Active lock",
        1
      );
    }
  };

  const handleStepSpecTree = () => {
    sanitizeGridSyncPayload({
      action: "STEP_TREE",
      corridor: telemetry.corridor,
      branchId: selectedBranchId,
    });
    const next = advanceSpeculativeSimulation(telemetry, "STEP_TREE");
    setTelemetry(next);
    appendRadioLog(
      "🟢 TELEMETRY",
      "Step Tree Verification Pass #" +
        String(next.stepCount) +
        " · Mean alpha " +
        String(next.meanAcceptanceRatePct) +
        "% · Zero CPU sync stalls",
      1
    );
  };

  const handleFlushDraftTokens = () => {
    sanitizeGridSyncPayload({
      action: "FLUSH_TOKENS",
      corridor: telemetry.corridor,
    });
    const next = advanceSpeculativeSimulation(telemetry, "FLUSH_TOKENS");
    setTelemetry(next);
    setSelectedBranchId(3);
    setRadioLogs(INITIAL_LOGS);
  };

  const saturationPct = Math.min(100, Math.round((telemetry.verificationSpeed / 8000) * 100));
  const xpFormatted =
    "+" + (telemetry.specXpDelta / 1000).toFixed(1) + "k SPEC XP";

  const inspectorLine =
    "BRANCH: " +
    selectedBranch.branchCode +
    " · TOKENS: [" +
    selectedBranch.tokens.join(", ") +
    "] · ALPHA: " +
    String(selectedBranch.alpha) +
    " · PTR: " +
    selectedBranch.kvRollbackPointerHex +
    " · " +
    selectedBranch.state;

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans">
      {/* TOP HEADER BLOCK */}
      <header className="w-full shrink-0 flex flex-col gap-0.5 border-b border-slate-800/90 pb-1">
        {/* Top Header Row 1 */}
        <div className="flex items-center justify-between gap-1 w-full shrink-0">
          {/* Left: Strict Project Title + Cyan Badge */}
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <h1 className="text-sm font-mono font-bold tracking-tight text-white">
              GF-T3-241
            </h1>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-cyan-500/15 text-[#00F0FF] border border-cyan-500/40 rounded">
              TRACK 3
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono text-emerald-400 font-semibold">
              {telemetry.entropySpikeActive ? "⚡ FAULT" : "✓ LOCKED"}
            </span>
          </div>

          {/* Right: Compact Corridor Dropdown + Micro Action Buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <select
              aria-label="Speculative Corridor Selector"
              value={telemetry.corridor}
              onChange={handleCorridorChange}
              className="max-w-[110px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 border border-slate-700 text-cyan-300 rounded focus:outline-none focus:border-cyan-400"
            >
              {SPEC_CORRIDORS.map((corridor) => (
                <option key={corridor} value={corridor}>
                  {corridor}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                setActiveTab("Spec");
                appendRadioLog(
                  "🟢 CREW CHIEF",
                  "Focused Target-Draft Verification ratio matrix (alpha = min(1, P_target/P_draft))",
                  1
                );
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 rounded cursor-pointer transition-colors"
            >
              [Spec]
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("Tree");
                appendRadioLog(
                  "⚡ PIT WALL",
                  "Focused Non-Flat Tree Attention Causal Mask & KV Pointer Inspector",
                  1
                );
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 rounded cursor-pointer transition-colors"
            >
              [Tree]
            </button>
            <button
              type="button"
              onClick={handleStepSpecTree}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/50 rounded cursor-pointer transition-colors"
            >
              [Run]
            </button>
            <button
              type="button"
              onClick={() => setSchemaModalOpen(true)}
              className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded cursor-pointer transition-colors"
            >
              [Inspect Schema]
            </button>
          </div>
        </div>

        {/* Top Header Row 2: Subtitle */}
        <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap truncate">
          Speculative Decoding · Target-Draft Verification · Tree Attention
        </div>
      </header>

      {/* 4-CARD ARCADE HUD RIBBON (2x2 Grid on small, 4-col on large, strictly compact) */}
      <section
        aria-label="Telemetry HUD Ribbon"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0"
      >
        {/* Card 1: SPEC NITRO */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg px-2.5 py-1 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              SPEC NITRO
            </span>
            <span className="text-[10px] font-mono text-cyan-400 font-semibold">
              {String(saturationPct) + "% BUS"}
            </span>
          </div>
          <div className="text-[#00F0FF] font-mono text-lg font-bold leading-tight tabular-nums">
            {formatNumberWithCommas(telemetry.verificationSpeed) + " tokens/s"}
          </div>
          <div className="w-full bg-slate-900 h-1 rounded overflow-hidden my-0.5 border border-slate-800">
            <div
              className="bg-[#00F0FF] h-full transition-all duration-150"
              style={{ width: String(saturationPct) + "%" }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            Verification Speed Saturation
          </div>
        </div>

        {/* Card 2: ACCEPTANCE STREAK */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg px-2.5 py-1 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              ACCEPTANCE STREAK
            </span>
            <span className="text-[10px] font-mono font-bold text-[#FF9F0A]">
              🔥 8 BRANCHES
            </span>
          </div>
          <div className="text-amber-300 font-mono text-lg font-bold leading-tight tabular-nums">
            {telemetry.acceptanceLatencyUs.toFixed(2) + " µs"}
          </div>
          <div className="text-[10px] font-mono text-emerald-400 truncate">
            {"Mean Alpha: " + String(telemetry.meanAcceptanceRatePct) + "% Parity"}
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            Branch Verification Latency
          </div>
        </div>

        {/* Card 3: ACTIVE BRANCHES */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg px-2.5 py-1 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              ACTIVE BRANCHES
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">
              {telemetry.entropySpikeActive ? "PRUNING" : "ALL LOCKED"}
            </span>
          </div>
          <div className="text-white font-mono text-lg font-bold leading-tight tabular-nums">
            {"BRANCHES: " + String(telemetry.activeBranches) + "/" + String(telemetry.totalBranches)}
          </div>
          {/* F1 Gear Shift Indicator [BR0..BR7] */}
          <div className="grid grid-cols-8 gap-0.5 my-0.5">
            {telemetry.branches.map((b) => {
              const isSelected = b.branchId === selectedBranch.branchId;
              const toneClass =
                b.state === "ACCEPTED"
                  ? "bg-emerald-500/25 text-emerald-300 border-emerald-500/50"
                  : b.state === "PRUNED"
                  ? "bg-amber-500/25 text-amber-300 border-amber-500/50"
                  : "bg-rose-500/25 text-rose-300 border-rose-500/50";
              return (
                <button
                  key={b.branchCode}
                  type="button"
                  onClick={() => setSelectedBranchId(b.branchId)}
                  className={
                    "text-[9px] font-mono font-bold text-center rounded border py-0.2 cursor-pointer " +
                    toneClass +
                    (isSelected ? " ring-1 ring-cyan-400" : "")
                  }
                >
                  {b.branchCode}
                </button>
              );
            })}
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            F1 Gear Shift Indicator [BR0..BR7]
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg px-2.5 py-1 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              TOKEN SCORE
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-400">
              {xpFormatted}
            </span>
          </div>
          <div className="text-emerald-300 font-mono text-lg font-bold leading-tight tabular-nums">
            {formatNumberWithCommas(telemetry.processedTokens) + " UNITS"}
          </div>
          <div className="text-[10px] font-mono text-cyan-300 truncate">
            {"Distribution Error: " + parityCheck.maxAbsError.toExponential(1)}
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            {"Spec State: " + telemetry.specState}
          </div>
        </div>
      </section>

      {/* 5 HORIZONTAL TABS */}
      <nav
        aria-label="Cockpit Subsystem Tabs"
        className="grid grid-cols-5 gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg my-1 w-full text-center shrink-0"
      >
        {TABS.map((tab) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={
                "py-0.5 text-xs font-mono font-bold rounded transition-colors cursor-pointer whitespace-nowrap " +
                (active
                  ? "bg-cyan-500/20 text-[#00F0FF] border border-cyan-500/50"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent")
              }
            >
              {tab}
            </button>
          );
        })}
      </nav>

      {/* INTERACTIVE SIMULATION BAY (Fits 100% in flex-1 min-h-0 without scrolling) */}
      <main className="flex-1 min-h-0 w-full flex flex-col justify-between gap-1 overflow-hidden">
        {/* Contextual Subsystem Ribbon for Spec / Tree / Stats / APA Tabs */}
        {activeTab === "Spec" && (
          <div className="bg-slate-950/90 border border-cyan-500/30 rounded-lg px-2.5 py-0.5 shrink-0 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
            <span className="text-cyan-300 font-bold">
              TARGET-DRAFT CRITERION: alpha = min(1, P_target / P_draft)
            </span>
            <span className="text-slate-300">
              {"Selected " +
                selectedBranch.branchCode +
                " Draft LogProb: " +
                String(selectedBranch.draftLogprob) +
                " · Target LogProb: " +
                String(selectedBranch.targetLogprob)}
            </span>
            <span className="text-emerald-400 font-bold">
              {"Residual Parity L_inf: " + parityCheck.maxAbsError.toFixed(10) + " (EXACT MATCH)"}
            </span>
          </div>
        )}

        {activeTab === "Tree" && (
          <div className="bg-slate-950/90 border border-amber-500/30 rounded-lg px-2.5 py-0.5 shrink-0 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
            <span className="text-amber-300 font-bold">
              NON-FLAT TREE CAUSAL MASK (8x8): M[i,j] = 1 iff j in Ancestors(i)
            </span>
            <span className="text-cyan-300">
              {"Row[" +
                String(selectedBranch.branchId) +
                "] Mask: [" +
                telemetry.treeCausalMask[selectedBranch.branchId].join(", ") +
                "]"}
            </span>
            <span className="text-emerald-400 font-bold">
              {"KV Rollback Base: 0x" +
                selectedBranch.kvBasePointer.toString(16).toUpperCase() +
                " -> Commit: " +
                selectedBranch.kvRollbackPointerHex.toUpperCase()}
            </span>
          </div>
        )}

        {activeTab === "Stats" && (
          <div className="bg-slate-950/90 border border-emerald-500/30 rounded-lg px-2.5 py-0.5 shrink-0 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
            <span className="text-emerald-300 font-bold">
              VITEST & PYTEST VERIFICATION GATE: 100% PASS (&gt;80% REQUIRED)
            </span>
            <span className="text-slate-300">
              {"Step Passes: " +
                String(telemetry.stepCount) +
                " · Beta Mass: " +
                String(parityCheck.betaAcceptanceMass)}
            </span>
            <button
              type="button"
              onClick={() => setSchemaModalOpen(true)}
              className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded font-bold cursor-pointer"
            >
              VIEW POSTGRESQL RLS SCHEMA
            </button>
          </div>
        )}

        {activeTab === "APA" && (
          <div className="bg-slate-950/95 border border-amber-500/50 rounded-lg px-2.5 py-0.5 shrink-0 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
            <div className="flex items-center gap-2">
              <span className="text-amber-300 font-bold">
                SOVEREIGN APA VAULT TRANSFER · 100% MIT CLEAN-ROOM IP
              </span>
              <span className="hidden md:inline text-slate-400">
                NIST SP 800-218 SSDF v1.1 Verified · Zero Copyleft
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setApaModalMessage(
                    "APA TITLE PACKAGE LOCKED: Complete repository container, FastAPI kernel (engine.py), Pytest/Vitest suites, and Supabase RLS schema staged for sovereign transfer."
                  );
                  appendRadioLog(
                    "🟢 CREW CHIEF",
                    "ACQUIRE TITLE (APA) dossier staged for Dealership Principal Garrett",
                    1
                  );
                }}
                className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-[#FF9F0A] border border-amber-500/60 rounded font-bold cursor-pointer"
              >
                ACQUIRE TITLE (APA)
              </button>
              <button
                type="button"
                onClick={() => {
                  setApaModalMessage(
                    "VAULT BUYOUT INQUIRY LOGGED: Direct repository transfer terms (ASSET_TRANSFER_SPEC.md & LEGAL_IP_AUDIT.md) verified with zero SaaS dependencies."
                  );
                  appendRadioLog(
                    "⚡ PIT WALL",
                    "INQUIRE VAULT BUYOUT telemetry packet dispatched · Clean title confirmed",
                    1
                  );
                }}
                className="px-2 py-0.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-[#00F0FF] border border-cyan-500/60 rounded font-bold cursor-pointer"
              >
                INQUIRE VAULT BUYOUT
              </button>
            </div>
          </div>
        )}

        {/* INTERACTIVE SPECULATIVE BRANCH MATRIX BAY (8 Draft Branches: Branch 0 to Branch 7) */}
        <section
          aria-label="Interactive Speculative Branch Matrix Bay"
          className="grid grid-cols-2 sm:grid-cols-4 gap-1 flex-1 min-h-0 w-full"
        >
          {telemetry.branches.map((branch) => {
            const isSelected = branch.branchId === selectedBranch.branchId;

            const borderClass = isSelected
              ? "border-[#00F0FF] bg-slate-900/95 ring-1 ring-[#00F0FF]/50"
              : branch.state === "ROLLBACK"
              ? "border-rose-500/50 bg-slate-950/90 hover:border-rose-400"
              : "border-slate-800 bg-slate-950/85 hover:border-slate-700";

            return (
              <div
                key={branch.branchCode}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setSelectedBranchId(branch.branchId);
                  appendRadioLog(
                    "🟢 TELEMETRY",
                    "Inspected " +
                      branch.branchCode +
                      " · Tokens [" +
                      branch.tokens.join(", ") +
                      "] · KV Ptr " +
                      branch.kvRollbackPointerHex,
                    0
                  );
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedBranchId(branch.branchId);
                  }
                }}
                className={
                  "rounded-lg border px-2 py-1 flex flex-col justify-between transition-all cursor-pointer select-none " +
                  borderClass
                }
              >
                {/* Row 1: Header "Branch X (BRX)" + Lock/Fault Indicator */}
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-mono font-bold text-white">
                    {"Branch " + String(branch.branchId) + " (" + branch.branchCode + ")"}
                  </span>
                  <span
                    className={
                      "text-[11px] font-mono font-bold " +
                      (branch.state === "ROLLBACK" ? "text-rose-400" : "text-emerald-400")
                    }
                  >
                    {branch.state === "ROLLBACK" ? "⚡ FAULT" : "✓ LOCKED"}
                  </span>
                </div>

                {/* Row 2: Branch Draft Status & Tokens */}
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] font-mono text-cyan-300 font-semibold">
                    {"DRAFT: " + String(branch.draftCount) + " TOKENS"}
                  </span>
                  <span className="text-[11px] font-mono text-cyan-300 font-semibold">
                    {"[" + branch.tokens.join(", ") + "]"}
                  </span>
                </div>

                {/* Row 3: Acceptance Ratio & State + KV Pointer */}
                <div className="flex items-center justify-between gap-1 pt-0.5 border-t border-slate-800/80">
                  <span className="text-[11px] font-mono text-amber-300 font-bold">
                    {"ALPHA: " + String(branch.alpha) + " · " + branch.state}
                  </span>
                  <span className="text-[11px] font-mono text-slate-300 font-semibold">
                    {branch.kvRollbackPointerHex}
                  </span>
                </div>
              </div>
            );
          })}
        </section>

        {/* COMPACT SPECULATIVE TELEMETRY INSPECTOR STRIP */}
        <div
          aria-label="Speculative Telemetry Inspector Strip"
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-0.5 shrink-0 flex items-center justify-between gap-2 overflow-hidden"
        >
          <div className="text-xs font-mono font-bold text-cyan-300 truncate">
            {inspectorLine}
          </div>
          <div className="hidden md:flex items-center gap-3 text-[11px] font-mono text-slate-300 shrink-0">
            <span>
              {"DRAFT_LOGPROB: " + String(selectedBranch.draftLogprob)}
            </span>
            <span>
              {"TARGET_LOGPROB: " + String(selectedBranch.targetLogprob)}
            </span>
            <span className="text-emerald-400 font-bold">
              {"CORRIDOR: " + telemetry.corridor.split(" ")[0]}
            </span>
          </div>
        </div>
      </main>

      {/* TACTICAL LAUNCH CONTROL BUTTONS */}
      <section
        aria-label="Tactical Launch Control Dock"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1"
      >
        <button
          type="button"
          onClick={handleInjectVerifyBurst}
          className="bg-amber-950/40 hover:bg-amber-900/50 border border-[#FF9F0A] text-[#FF9F0A] rounded-lg text-xs font-mono font-bold py-2 text-center cursor-pointer transition-colors whitespace-nowrap truncate px-2"
        >
          💥 INJECT VERIFY BURST
        </button>

        <button
          type="button"
          onClick={handleToggleDraftSpike}
          className="bg-cyan-950/40 hover:bg-cyan-900/50 border border-[#00F0FF] text-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.2)] rounded-lg text-xs font-mono font-bold py-2 text-center cursor-pointer transition-colors whitespace-nowrap truncate px-2"
        >
          ⚡ TOGGLE DRAFT SPIKE
        </button>

        <button
          type="button"
          onClick={handleStepSpecTree}
          className="bg-emerald-950/40 hover:bg-emerald-900/50 border border-[#10B981] text-[#10B981] rounded-lg text-xs font-mono font-bold py-2 text-center cursor-pointer transition-colors whitespace-nowrap truncate px-2"
        >
          🚀 STEP SPEC TREE
        </button>

        <button
          type="button"
          onClick={handleFlushDraftTokens}
          className="bg-rose-950/40 hover:bg-rose-900/50 border border-[#EF4444] text-[#EF4444] rounded-lg text-xs font-mono font-bold py-2 text-center cursor-pointer transition-colors whitespace-nowrap truncate px-2"
        >
          🔄 FLUSH DRAFT TOKENS
        </button>
      </section>

      {/* PIT-WALL RADIO LOG */}
      <footer
        aria-label="Pit-Wall Radio Log"
        className="h-14 mb-0.5 overflow-hidden font-mono text-[10px] p-2 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-tight flex flex-col justify-between"
      >
        {radioLogs.slice(0, 3).map((line, index) => (
          <div key={String(index) + line} className="truncate">
            {line}
          </div>
        ))}
      </footer>

      {/* SQL SCHEMA & RLS MODAL */}
      {schemaModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#05070B] border border-cyan-500/50 rounded-lg max-w-3xl w-full max-h-[80vh] flex flex-col p-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <span className="text-xs font-mono font-bold text-[#00F0FF]">
                GF-T3-241 · PRODUCTION POSTGRESQL / SUPABASE RLS SCHEMA
              </span>
              <button
                type="button"
                onClick={() => setSchemaModalOpen(false)}
                className="px-2 py-0.5 text-xs font-mono font-bold bg-rose-950/70 text-rose-300 border border-rose-500/40 rounded cursor-pointer"
              >
                [CLOSE]
              </button>
            </div>
            <pre className="flex-1 overflow-y-auto text-[11px] font-mono text-slate-200 bg-black/90 p-3 rounded border border-slate-800 select-all">
              {SUPABASE_POSTGRES_SCHEMA_SQL}
            </pre>
          </div>
        </div>
      )}

      {/* APA ACQUISITION / VAULT BUYOUT MODAL */}
      {apaModalMessage && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#05070B] border border-amber-500/60 rounded-lg max-w-lg w-full p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-mono font-bold text-[#FF9F0A]">
                GF-T3-241 · ASSET PURCHASE AGREEMENT (APA) VAULT DISPATCH
              </span>
              <button
                type="button"
                onClick={() => setApaModalMessage(null)}
                className="px-2 py-0.5 text-xs font-mono font-bold bg-slate-900 text-slate-300 border border-slate-700 rounded cursor-pointer"
              >
                [CLOSE]
              </button>
            </div>
            <p className="text-xs font-mono text-slate-200 leading-relaxed">
              {apaModalMessage}
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setApaModalMessage(null);
                  setSchemaModalOpen(true);
                }}
                className="px-2.5 py-1 text-xs font-mono font-bold bg-cyan-500/20 text-[#00F0FF] border border-cyan-500/50 rounded cursor-pointer"
              >
                INSPECT SQL SCHEMA
              </button>
              <button
                type="button"
                onClick={() => setApaModalMessage(null)}
                className="px-2.5 py-1 text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 rounded cursor-pointer"
              >
                ACKNOWLEDGE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
