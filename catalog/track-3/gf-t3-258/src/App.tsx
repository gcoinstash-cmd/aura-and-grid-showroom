/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import {
  SYNTHETIC_CORRIDORS,
  SUPABASE_SQL_SCHEMA_EXPORT,
  CorridorId,
  RbacRole,
  SensitiveFolder,
  FileAccessAuditEntry,
  computeHybridPipelineState,
  evaluateRbacFolderAccess,
  generateEncryptedComplianceReport,
} from "./engine/chunkedPrefillEngine";

type CockpitTab = "Mesh" | "Chnk" | "Schd" | "Stats" | "APA";

interface RadioLogLine {
  id: string;
  clock: string;
  callsign: "🟢 CREW CHIEF" | "🟢 TELEMETRY" | "🔴 TELEMETRY" | "⚡ PIT WALL";
  message: string;
}

const INITIAL_RADIO_LOGS: RadioLogLine[] = [
  {
    id: "log-init-1",
    clock: "00:01.04",
    callsign: "🟢 CREW CHIEF",
    message:
      "Chunked prefill and iterative scheduling hybrid pipeline initialized · 8 chunks linked",
  },
  {
    id: "log-init-2",
    clock: "00:01.08",
    callsign: "🟢 TELEMETRY",
    message:
      "Time-sliced prefill interleaving verified at 20,400 GB/s with zero head-of-line blocking",
  },
];

const INITIAL_AUDIT_LOG: FileAccessAuditEntry[] = [
  evaluateRbacFolderAccess(
    "PRINCIPAL_ARCHITECT",
    "/engine/scheduler_core",
    "BOOT_VERIFY_SCHEDULER",
    "00:01.02",
    "GENESIS000000000"
  ),
  evaluateRbacFolderAccess(
    "CREW_CHIEF",
    "/compliance/encrypted_reports",
    "SEAL_NIST_SSDF_BUNDLE",
    "00:01.06",
    "A9F4021B8C77E110"
  ),
];

export default function App() {
  const [corridorId, setCorridorId] = useState<CorridorId>("CHUNK-CORRIDOR-ALPHA");
  const [activeTab, setActiveTab] = useState<CockpitTab>("Mesh");
  const [selectedChunkIdx, setSelectedChunkIdx] = useState<number>(3);
  const [promptSpikeActive, setPromptSpikeActive] = useState<boolean>(false);
  const [burstCount, setBurstCount] = useState<number>(0);
  const [stepCount, setStepCount] = useState<number>(0);
  const [clockTick, setClockTick] = useState<number>(112);
  const [radioLogs, setRadioLogs] = useState<RadioLogLine[]>(INITIAL_RADIO_LOGS);

  const [rbacRole, setRbacRole] = useState<RbacRole>("PRINCIPAL_ARCHITECT");
  const [auditEntries, setAuditEntries] = useState<FileAccessAuditEntry[]>(INITIAL_AUDIT_LOG);
  const [modalView, setModalView] = useState<null | "SCHEMA" | "APA_VAULT">(null);
  const [apaNotice, setApaNotice] = useState<string>(
    "Clean Title Warranty Verified · AES-256-GCM Compliance Bundle Sealed"
  );

  const pipeline = useMemo(
    () =>
      computeHybridPipelineState({
        corridorId,
        promptTokens: promptSpikeActive ? 8192 : 4096,
        sliceBudgetMs: 16,
        promptSpikeActive,
        burstCount,
        stepCount,
      }),
    [corridorId, promptSpikeActive, burstCount, stepCount]
  );

  const encryptedReport = useMemo(
    () => generateEncryptedComplianceReport(pipeline, rbacRole),
    [pipeline, rbacRole]
  );

  const formatClock = (tick: number): string => {
    const secs = Math.floor(tick / 100);
    const hundredths = tick % 100;
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return (
      String(mins).padStart(2, "0") +
      ":" +
      String(remSecs).padStart(2, "0") +
      "." +
      String(hundredths).padStart(2, "0")
    );
  };

  const appendRadio = (
    callsign: RadioLogLine["callsign"],
    message: string
  ): string => {
    const nextTick = clockTick + 4;
    setClockTick(nextTick);
    const formattedClock = formatClock(nextTick);
    const nextLine: RadioLogLine = {
      id: "log-" + String(nextTick),
      clock: formattedClock,
      callsign,
      message,
    };
    setRadioLogs((prev) => [ prev[prev.length - 1] ?? INITIAL_RADIO_LOGS[0], nextLine ]);
    return formattedClock;
  };

  const recordFolderAccess = (
    folder: SensitiveFolder,
    operation: string,
    overrideRole?: RbacRole
  ) => {
    const effectiveRole = overrideRole ?? rbacRole;
    const nextTick = clockTick + 3;
    setClockTick(nextTick);
    const clockStr = formatClock(nextTick);
    const prevHash =
      auditEntries.length > 0
        ? auditEntries[0].chainDigestHex
        : "GENESIS000000000";
    const entry = evaluateRbacFolderAccess(
      effectiveRole,
      folder,
      operation,
      clockStr,
      prevHash
    );
    setAuditEntries((prev) => [entry, ...prev.slice(0, 5)]);
    return entry;
  };

  const handleInjectBurst = () => {
    const nextBurst = burstCount + 1;
    setBurstCount(nextBurst);
    appendRadio(
      "⚡ PIT WALL",
      "Chunked prefill burst #" +
        String(nextBurst) +
        " partitioned into 8x512-token slices within 16ms budget"
    );
  };

  const handleTogglePromptSpike = () => {
    const nextSpike = !promptSpikeActive;
    setPromptSpikeActive(nextSpike);
    if (nextSpike) {
      appendRadio(
        "🔴 TELEMETRY",
        "Prompt length spike injected · Time-slicing active across C0-C7 · Zero HoL stall"
      );
    } else {
      appendRadio(
        "🟢 TELEMETRY",
        "Prompt length spike cleared · Nominal 512-token chunk equilibrium restored"
      );
    }
  };

  const handleStepHybridPass = () => {
    const nextStep = stepCount + 1;
    setStepCount(nextStep);
    setSelectedChunkIdx((prev) => (prev + 1) % 8);
    appendRadio(
      "🟢 CREW CHIEF",
      "Iterative scheduling pass #" +
        String(nextStep) +
        " locked · Throughput " +
        pipeline.chunkedThroughputGbs.toLocaleString() +
        " GB/s at 0.01 µs"
    );
  };

  const handleFlushBuffers = () => {
    setBurstCount(0);
    setStepCount(0);
    setPromptSpikeActive(false);
    setSelectedChunkIdx(3);
    recordFolderAccess("/engine/scheduler_core", "FLUSH_PIPELINE_WORKQUEUES");
    setRadioLogs(INITIAL_RADIO_LOGS);
  };

  const handleCorridorChange = (nextCorridor: CorridorId) => {
    setCorridorId(nextCorridor);
    const cfg = SYNTHETIC_CORRIDORS[nextCorridor];
    appendRadio(
      "⚡ PIT WALL",
      "Switched fabric to " +
        cfg.id +
        " · Saturation " +
        cfg.bandwidthGbs.toLocaleString() +
        " GB/s"
    );
  };

  const inspectedChunk =
    pipeline.chunks[selectedChunkIdx] ?? pipeline.chunks[3];

  const vecString =
    "[" +
    pipeline.vectorSignature.map((v) => v.toFixed(2)).join(", ") +
    "]";

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans select-none">
      {/* TOP COMMAND DECK: Row 1 + Row 2 */}
      <header className="w-full shrink-0 bg-[#080B12] border border-slate-800/90 rounded-lg px-2.5 py-1.5">
        <div className="flex items-center justify-between gap-1 w-full shrink-0">
          {/* Left: strictly GF-T3-258 and cyan badge FLAGSHIP */}
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <h1 className="text-sm sm:text-base font-mono font-extrabold tracking-tight text-white">
              GF-T3-258
            </h1>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/50 rounded">
              FLAGSHIP
            </span>
            <span className="hidden md:inline-block text-[10px] font-mono text-emerald-400">
              ✓ LOCKED
            </span>
          </div>

          {/* Right: Compact corridor dropdown and micro action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <label htmlFor="corridor-select" className="sr-only">
              Synthetic Chunked Corridor
            </label>
            <select
              id="corridor-select"
              value={corridorId}
              onChange={(e) =>
                handleCorridorChange(e.target.value as CorridorId)
              }
              className="max-w-[110px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-950 text-[#00F0FF] border border-slate-700 rounded focus:outline-none focus:border-[#00F0FF]"
              title={pipeline.corridorLabel}
            >
              <option value="CHUNK-CORRIDOR-ALPHA">
                CHUNK-CORRIDOR-ALPHA (PREFILL-DECODING-INTERLEAVING-FABRIC · 20400-GB/S)
              </option>
              <option value="CHUNK-CORRIDOR-BRAVO">
                CHUNK-CORRIDOR-BRAVO (TIME-SLICED-PREFILL-BUDGET-ALLOCATOR)
              </option>
              <option value="CHUNK-CORRIDOR-GAMMA">
                CHUNK-CORRIDOR-GAMMA (ITERATIVE-SCHEDULING-PIPELINE-ENGINE)
              </option>
              <option value="CHUNK-CORRIDOR-DELTA">
                CHUNK-CORRIDOR-DELTA (FALLBACK-MONOLITHIC-PREFILL-PASS)
              </option>
            </select>

            <button
              type="button"
              onClick={() => {
                setActiveTab("Chnk");
                handleInjectBurst();
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-[#00F0FF] border border-slate-700 rounded cursor-pointer whitespace-nowrap"
            >
              [Chunk]
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("Schd");
                handleStepHybridPass();
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-[#FF9F0A] border border-slate-700 rounded cursor-pointer whitespace-nowrap"
            >
              [Sched]
            </button>
            <button
              type="button"
              onClick={handleStepHybridPass}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700/70 rounded cursor-pointer whitespace-nowrap"
            >
              [Run]
            </button>
            <button
              type="button"
              onClick={() => {
                recordFolderAccess("/engine/scheduler_core", "INSPECT_SQL_SCHEMA");
                setModalView("SCHEMA");
              }}
              className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded cursor-pointer whitespace-nowrap"
            >
              [Inspect Schema]
            </button>
            <button
              type="button"
              onClick={handleFlushBuffers}
              className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-rose-950 text-rose-300 border border-slate-700 rounded cursor-pointer whitespace-nowrap"
            >
              [Reset]
            </button>
          </div>
        </div>

        {/* Top Header Row 2 */}
        <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap mt-0.5">
          Chunked Prefill · Iterative Scheduling · Zero Stall
        </div>
      </header>

      {/* 4-CARD ARCADE HUD RIBBON */}
      <section
        aria-label="Telemetry HUD Ribbon"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-0.5"
      >
        {/* Card 1: CHUNK NITRO */}
        <div className="bg-[#080C14] border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="font-bold text-slate-300">CHUNK NITRO</span>
            <span className="text-[#00F0FF]">{corridorId.replace("CHUNK-", "")}</span>
          </div>
          <div className="font-mono text-lg font-bold text-[#00F0FF] tabular-nums leading-tight">
            {pipeline.chunkedThroughputGbs.toLocaleString()} GB/s
          </div>
          <div className="w-full bg-slate-900 h-1.5 rounded overflow-hidden my-0.5 border border-slate-800">
            <div
              className="bg-[#00F0FF] h-full transition-opacity duration-150"
              style={{ width: corridorId === "CHUNK-CORRIDOR-DELTA" ? "64%" : "98%" }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            Chunked Throughput Saturation
          </div>
        </div>

        {/* Card 2: SCHED STREAK */}
        <div className="bg-[#080C14] border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="font-bold text-slate-300">SCHED STREAK</span>
            <span className="px-1.5 py-0 text-[10px] font-mono font-bold bg-[#FF9F0A]/20 text-[#FF9F0A] border border-[#FF9F0A]/50 rounded">
              🔥 16ms
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-[#FF9F0A] tabular-nums leading-tight">
            {pipeline.schedulingLatencyUs.toFixed(2)} µs
          </div>
          <div className="text-[10px] font-mono text-emerald-400 truncate">
            HoL Stall: 0.00 ms · Budget Enforced
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            Time-Sliced Scheduling Latency
          </div>
        </div>

        {/* Card 3: ACTIVE CHUNKS */}
        <div className="bg-[#080C14] border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="font-bold text-slate-300">ACTIVE CHUNKS</span>
            <span className="text-emerald-400 font-bold">
              Active Chunks: 8 Chunks
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-emerald-400 tabular-nums leading-tight">
            CHUNKS: 8/8
          </div>
          <div className="grid grid-cols-8 gap-0.5 my-0.5">
            {pipeline.chunks.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedChunkIdx(c.index)}
                className={
                  "text-[9px] font-mono font-bold rounded py-0 text-center cursor-pointer border " +
                  (selectedChunkIdx === c.index
                    ? "bg-[#00F0FF]/25 text-[#00F0FF] border-[#00F0FF]"
                    : "bg-emerald-950/70 text-emerald-300 border-emerald-800/70")
                }
              >
                {c.id}
              </button>
            ))}
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            F1 Gear Shift Indicator [C0..C7]
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="bg-[#080C14] border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="font-bold text-slate-300">TOKEN SCORE</span>
            <span className="text-emerald-400 font-bold">
              +{(pipeline.engineXpDelta / 1000).toFixed(1)}k ENGINE XP
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-white tabular-nums leading-tight">
            {pipeline.processedTokens.toLocaleString()} UNITS
          </div>
          <div className="text-[10px] font-mono text-[#00F0FF] truncate">
            Processed Tokens: {pipeline.processedTokens.toLocaleString()} Units
          </div>
          <div className="text-[10px] font-mono text-emerald-400 font-semibold truncate">
            Pipeline State: {pipeline.pipelineState}
          </div>
        </div>
      </section>

      {/* 5 HORIZONTAL TABS */}
      <nav
        aria-label="Pipeline Workspace Views"
        className="grid grid-cols-5 gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg my-1 w-full text-center shrink-0"
      >
        {(["Mesh", "Chnk", "Schd", "Stats", "APA"] as CockpitTab[]).map(
          (tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setActiveTab(tab);
                if (tab === "APA") {
                  recordFolderAccess(
                    "/vault/apa_contracts",
                    "OPEN_APA_TRANSFER_DECK"
                  );
                }
              }}
              className={
                "py-1 text-xs font-mono font-bold rounded transition-colors cursor-pointer whitespace-nowrap " +
                (activeTab === tab
                  ? "bg-[#00F0FF] text-slate-950"
                  : "bg-slate-950/70 text-slate-300 hover:bg-slate-800")
              }
            >
              {tab}
            </button>
          )
        )}
      </nav>

      {/* STREAMLINED MESH INFO SUBHEADER */}
      <div className="text-[10px] font-mono whitespace-nowrap overflow-hidden text-slate-300 px-2 py-0.5 bg-slate-950/90 border border-slate-800/80 rounded shrink-0 flex items-center justify-between">
        <span>
          {"VIEW: " +
            activeTab.toUpperCase() +
            " · PTR: " +
            pipeline.pointerHex +
            " · MODE: " +
            pipeline.mode +
            " · SLICE: " +
            String(pipeline.sliceMs) +
            "ms · VEC: " +
            vecString}
        </span>
        <span className="hidden lg:inline text-[#00F0FF]">
          {"CORRIDOR: " + pipeline.corridorLabel}
        </span>
      </div>

      {/* INTERACTIVE CHUNK MATRIX BAY (C0-C7) + CONTEXTUAL TELEMETRY DECK */}
      <main className="flex-1 min-h-0 flex flex-col justify-between gap-1 my-0.5 overflow-hidden">
        {/* 8 Chunk Cards in a tight 4x2 grid (Always live & interactive) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 flex-1 min-h-0">
          {pipeline.chunks.map((chunk) => {
            const isSelected = selectedChunkIdx === chunk.index;
            return (
              <div
                key={chunk.id}
                onClick={() => setSelectedChunkIdx(chunk.index)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setSelectedChunkIdx(chunk.index);
                  }
                }}
                className={
                  "py-0 px-1.5 rounded border bg-slate-900/60 flex flex-col justify-between cursor-pointer transition-colors " +
                  (isSelected
                    ? "border-[#00F0FF] bg-slate-900/95"
                    : "border-slate-800 hover:border-slate-700")
                }
              >
                {/* Line 1: Title & Hex */}
                <div className="text-[11px] font-mono font-bold text-white flex justify-between items-center pt-1">
                  <span>{chunk.title}</span>
                  <span className="text-slate-400">{chunk.hexPtr}</span>
                </div>

                {/* Line 2: Tokens & Budget */}
                <div className="text-[11px] font-mono text-cyan-300 font-bold flex justify-between">
                  <span>{"TOK: " + String(chunk.tokens)}</span>
                  <span>{"BUDGET: " + String(chunk.budgetMs) + "ms"}</span>
                </div>

                {/* Contextual micro-bar for Chnk/Schd/Stats modes */}
                <div className="text-[9px] font-mono text-slate-400 flex justify-between">
                  <span>
                    {"DEC_INT: " + String(chunk.decodeTokensInterleaved) + "t"}
                  </span>
                  <span>{"SM: " + String(chunk.smWarpSharePct) + "%"}</span>
                </div>

                {/* Line 3: Latency & State */}
                <div className="text-[10px] font-mono flex justify-between pb-1">
                  <span className="text-[#FF9F0A] font-bold">
                    {chunk.latencyMs}
                  </span>
                  <span
                    className={
                      chunk.faultActive
                        ? "text-[#EF4444] font-bold"
                        : "text-[#10B981] font-bold"
                    }
                  >
                    {chunk.state}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Contextual Secondary Strip for Active Tab (RBAC, Encrypted Compliance, APA Buyout) */}
        <div className="bg-[#080C14] border border-slate-800 rounded px-2 py-1 shrink-0 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
          {activeTab !== "APA" ? (
            <>
              <div className="flex items-center gap-2 text-slate-300 truncate">
                <span className="text-[#00F0FF] font-bold">
                  {"[" + activeTab.toUpperCase() + " TELEMETRY]"}
                </span>
                <span>
                  {"Chunked Throughput: " +
                    pipeline.chunkedThroughputGbs.toLocaleString() +
                    " GB/s"}
                </span>
                <span>·</span>
                <span>
                  {"Scheduling Latency: " +
                    pipeline.schedulingLatencyUs.toFixed(2) +
                    " µs"}
                </span>
                <span className="hidden md:inline">·</span>
                <span className="hidden md:inline text-emerald-400">
                  {"SEAL: " + encryptedReport.sha256IntegritySeal.slice(0, 12)}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-slate-400">RBAC:</span>
                <select
                  aria-label="RBAC Role Selector"
                  value={rbacRole}
                  onChange={(e) => {
                    const nextRole = e.target.value as RbacRole;
                    setRbacRole(nextRole);
                    recordFolderAccess(
                      "/compliance/encrypted_reports",
                      "SWITCH_RBAC_ROLE",
                      nextRole
                    );
                  }}
                  className="bg-slate-950 text-emerald-300 border border-slate-700 rounded px-1 py-0 text-[10px] font-mono"
                >
                  <option value="PRINCIPAL_ARCHITECT">PRINCIPAL_ARCHITECT</option>
                  <option value="CREW_CHIEF">CREW_CHIEF</option>
                  <option value="SECURITY_AUDITOR">SECURITY_AUDITOR</option>
                  <option value="EXTERNAL_OBSERVER">EXTERNAL_OBSERVER</option>
                </select>
                <button
                  type="button"
                  onClick={() => {
                    recordFolderAccess(
                      "/vault/apa_contracts",
                      "OPEN_VAULT_BUYOUT"
                    );
                    setModalView("APA_VAULT");
                  }}
                  className="px-2 py-0.5 bg-[#FF9F0A]/20 hover:bg-[#FF9F0A]/30 text-[#FF9F0A] border border-[#FF9F0A]/60 rounded font-bold cursor-pointer"
                >
                  ACQUIRE TITLE (APA)
                </button>
              </div>
            </>
          ) : (
            <div className="w-full flex items-center justify-between gap-2">
              <div className="truncate text-slate-300">
                <span className="text-[#FF9F0A] font-bold">APA VAULT: </span>
                <span>{apaNotice}</span>
                <span className="ml-2 text-emerald-400">
                  {"[" +
                    encryptedReport.cipherAlgorithm +
                    " · " +
                    encryptedReport.reportId +
                    "]"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const entry = recordFolderAccess(
                      "/vault/apa_contracts",
                      "ACQUIRE_TITLE_APA"
                    );
                    setApaNotice(
                      "APA Title Transfer Package Sealed (" +
                        entry.decision +
                        ") · Digest " +
                        entry.chainDigestHex
                    );
                    setModalView("APA_VAULT");
                  }}
                  className="px-2 py-0.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-600 rounded font-bold cursor-pointer"
                >
                  ACQUIRE TITLE (APA)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const entry = recordFolderAccess(
                      "/vault/rls_keys",
                      "INQUIRE_VAULT_BUYOUT"
                    );
                    setApaNotice(
                      "Vault Buyout Dossier Access: " +
                        entry.decision +
                        " for " +
                        rbacRole +
                        " · Seal " +
                        entry.encryptedComplianceSeal.slice(0, 18)
                    );
                    setModalView("APA_VAULT");
                  }}
                  className="px-2 py-0.5 bg-cyan-950 hover:bg-cyan-900 text-[#00F0FF] border border-[#00F0FF]/60 rounded font-bold cursor-pointer"
                >
                  INQUIRE VAULT BUYOUT
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* COMPACT CHUNK TELEMETRY INSPECTOR STRIP */}
      <div className="text-[11px] font-mono whitespace-nowrap overflow-hidden text-cyan-300 font-bold px-2 py-0.5 bg-black/60 border border-slate-800 rounded my-0.5 shrink-0 flex items-center justify-between">
        <span>
          {inspectedChunk.id +
            " · TOK: " +
            String(inspectedChunk.tokens) +
            " · BUDGET: " +
            String(inspectedChunk.budgetMs) +
            "ms · SLICE: " +
            String(inspectedChunk.sliceMs) +
            "ms · PTR " +
            inspectedChunk.hexPtr +
            " · PIPELINE: " +
            inspectedChunk.pipelineStatus +
            " · LOCKED"}
        </span>
        <span className="hidden sm:inline text-emerald-400">
          {"AUDIT: " +
            (auditEntries[0]?.targetFolder ?? "/engine/scheduler_core") +
            " [" +
            (auditEntries[0]?.decision ?? "GRANTED") +
            "]"}
        </span>
      </div>

      {/* TACTICAL LAUNCH CONTROL BUTTONS */}
      <section
        aria-label="Tactical Launch Controls"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1"
      >
        <button
          type="button"
          onClick={handleInjectBurst}
          className="border border-[#FF9F0A] bg-[#FF9F0A]/10 hover:bg-[#FF9F0A]/20 text-[#FF9F0A] rounded-lg text-xs font-mono font-bold py-2 text-center cursor-pointer transition-colors whitespace-nowrap truncate px-2"
        >
          💥 INJECT CHUNKED PREFILL BURST
        </button>

        <button
          type="button"
          onClick={handleTogglePromptSpike}
          className="border border-[#00F0FF] bg-[#00F0FF]/10 hover:bg-[#00F0FF]/20 text-[#00F0FF] rounded-lg text-xs font-mono font-bold py-2 text-center cursor-pointer transition-colors whitespace-nowrap truncate px-2"
        >
          ⚡ TOGGLE PROMPT LENGTH SPIKE
        </button>

        <button
          type="button"
          onClick={handleStepHybridPass}
          className="border border-[#10B981] bg-[#10B981]/15 hover:bg-[#10B981]/25 text-[#10B981] rounded-lg text-xs font-mono font-bold py-2 text-center cursor-pointer transition-colors whitespace-nowrap truncate px-2"
        >
          🚀 STEP HYBRID SCHEDULING PASS
        </button>

        <button
          type="button"
          onClick={handleFlushBuffers}
          className="border border-[#EF4444] bg-[#EF4444]/15 hover:bg-[#EF4444]/25 text-rose-300 rounded-lg text-xs font-mono font-bold py-2 text-center cursor-pointer transition-colors whitespace-nowrap truncate px-2"
        >
          🔄 FLUSH PIPELINE BUFFERS
        </button>
      </section>

      {/* PIT-WALL RADIO COMMS LOG */}
      <footer
        aria-label="Pit-Wall Radio Comms Log"
        className="h-8 overflow-hidden font-mono text-[9px] px-2 py-0.5 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-normal flex flex-col justify-center"
      >
        {radioLogs.slice(-2).map((line) => (
          <div key={line.id} className="truncate whitespace-nowrap">
            {"[" + line.clock + "] " + line.callsign + ": " + line.message}
          </div>
        ))}
      </footer>

      {/* OVERLAY MODAL FOR SQL SCHEMA OR APA VAULT & RBAC AUDIT */}
      {modalView !== null && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#080C14] border border-slate-700 rounded-lg max-w-3xl w-full p-4 font-mono text-xs text-slate-200 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-[#00F0FF]">
                {modalView === "SCHEMA"
                  ? "GF-T3-258 · SUPABASE / POSTGRESQL PARTITIONED SCHEMA & RLS"
                  : "GF-T3-258 · APA ASSET TRANSFER, RBAC & ENCRYPTED COMPLIANCE VAULT"}
              </span>
              <button
                type="button"
                onClick={() => setModalView(null)}
                className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded cursor-pointer"
              >
                [CLOSE]
              </button>
            </div>

            {modalView === "SCHEMA" ? (
              <pre className="bg-black/90 border border-slate-800 rounded p-3 text-[10px] text-emerald-300 overflow-x-auto leading-relaxed">
                {SUPABASE_SQL_SCHEMA_EXPORT}
              </pre>
            ) : (
              <div className="flex flex-col gap-2 text-[11px]">
                <div className="bg-black/70 border border-slate-800 rounded p-2">
                  <div className="text-[#FF9F0A] font-bold mb-1">
                    ENCRYPTED COMPLIANCE REPORT ({encryptedReport.cipherAlgorithm})
                  </div>
                  <div className="text-slate-300 break-all">
                    {"REPORT_ID: " +
                      encryptedReport.reportId +
                      " · IV: " +
                      encryptedReport.ivHex +
                      " · SHA256_SEAL: " +
                      encryptedReport.sha256IntegritySeal}
                  </div>
                  <div className="text-emerald-400 break-all mt-1">
                    {"CIPHERTEXT: " + encryptedReport.encryptedPayloadHex}
                  </div>
                </div>

                <div className="bg-black/70 border border-slate-800 rounded p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[#00F0FF] font-bold">
                      SENSITIVE FOLDER RBAC & AUTOMATED FILE ACCESS AUDIT LOG
                    </span>
                    <div className="flex gap-1">
                      {(
                        [
                          "/engine/scheduler_core",
                          "/compliance/encrypted_reports",
                          "/vault/apa_contracts",
                          "/vault/rls_keys",
                        ] as SensitiveFolder[]
                      ).map((folder) => (
                        <button
                          key={folder}
                          type="button"
                          onClick={() =>
                            recordFolderAccess(folder, "MANUAL_FOLDER_PROBE")
                          }
                          className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-[9px] text-slate-200 cursor-pointer"
                        >
                          {folder.split("/").pop()}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    {auditEntries.map((entry) => (
                      <div
                        key={entry.auditId + entry.timestamp}
                        className="flex items-center justify-between text-[10px] border-b border-slate-900 pb-0.5"
                      >
                        <span>
                          {"[" +
                            entry.timestamp +
                            "] " +
                            entry.actorRole +
                            " -> " +
                            entry.targetFolder +
                            " (" +
                            entry.operation +
                            ")"}
                        </span>
                        <span
                          className={
                            entry.decision === "GRANTED"
                              ? "text-emerald-400 font-bold"
                              : "text-rose-400 font-bold"
                          }
                        >
                          {entry.decision + " · " + entry.chainDigestHex}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      recordFolderAccess(
                        "/vault/apa_contracts",
                        "EXECUTE_APA_TITLE_ACQUISITION"
                      );
                      setModalView(null);
                    }}
                    className="px-3 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-600 rounded font-bold cursor-pointer"
                  >
                    ACQUIRE TITLE (APA)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      recordFolderAccess(
                        "/vault/apa_contracts",
                        "SUBMIT_VAULT_BUYOUT_INQUIRY"
                      );
                      setModalView(null);
                    }}
                    className="px-3 py-1 bg-cyan-950 hover:bg-cyan-900 text-[#00F0FF] border border-[#00F0FF] rounded font-bold cursor-pointer"
                  >
                    INQUIRE VAULT BUYOUT
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
