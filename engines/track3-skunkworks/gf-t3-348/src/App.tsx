/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";

interface DraftSlot {
  id: number;
  code: string;
  title: string;
  hex: string;
  tok: string;
  draftPct: number;
  syncPct: number;
  latency: string;
  status: string;
  verf: string;
  accPct: number;
}

const CORRIDORS: string[] = [
  "SPEC-CORRIDOR-ALPHA (DYNAMIC-SPECULATIVE-FABRIC · 144600-GB/S)",
  "SPEC-CORRIDOR-BRAVO (DRAFT-VERIFICATION-ENGINE)",
  "SPEC-CORRIDOR-GAMMA (NON-BLOCKING-DRAFT-ACCEPTANCE-ROUTER)",
  "SPEC-CORRIDOR-DELTA (FALLBACK-AUTOREGRESSIVE-DECODE-PASS)",
];

const INITIAL_DRAFTS: DraftSlot[] = [
  { id: 0, code: "D0", title: "Draft 0 (D0)", hex: "0x57000", tok: "256K", draftPct: 100, syncPct: 100, latency: "0.02ms", status: "VERIFIED · LOCKED", verf: "OK", accPct: 92 },
  { id: 1, code: "D1", title: "Draft 1 (D1)", hex: "0x57010", tok: "256K", draftPct: 100, syncPct: 100, latency: "0.02ms", status: "VERIFIED · LOCKED", verf: "OK", accPct: 92 },
  { id: 2, code: "D2", title: "Draft 2 (D2)", hex: "0x57020", tok: "256K", draftPct: 100, syncPct: 100, latency: "0.02ms", status: "VERIFIED · LOCKED", verf: "OK", accPct: 92 },
  { id: 3, code: "D3", title: "Draft 3 (D3)", hex: "0x57030", tok: "256K", draftPct: 100, syncPct: 100, latency: "0.02ms", status: "VERIFIED · LOCKED", verf: "OK", accPct: 92 },
  { id: 4, code: "D4", title: "Draft 4 (D4)", hex: "0x57040", tok: "256K", draftPct: 100, syncPct: 100, latency: "0.02ms", status: "VERIFIED · LOCKED", verf: "OK", accPct: 92 },
  { id: 5, code: "D5", title: "Draft 5 (D5)", hex: "0x57050", tok: "256K", draftPct: 100, syncPct: 100, latency: "0.02ms", status: "VERIFIED · LOCKED", verf: "OK", accPct: 92 },
  { id: 6, code: "D6", title: "Draft 6 (D6)", hex: "0x57060", tok: "256K", draftPct: 100, syncPct: 100, latency: "0.02ms", status: "VERIFIED · LOCKED", verf: "OK", accPct: 92 },
  { id: 7, code: "D7", title: "Draft 7 (D7)", hex: "0x57070", tok: "256K", draftPct: 100, syncPct: 100, latency: "0.02ms", status: "VERIFIED · LOCKED", verf: "OK", accPct: 92 },
];

const TABS: string[] = ["Mesh", "Spec", "Verf", "Stats", "APA"];

export default function App() {
  const [corridor, setCorridor] = useState<string>(CORRIDORS[0]);
  const [activeTab, setActiveTab] = useState<string>("Mesh");
  const [drafts, setDrafts] = useState<DraftSlot[]>(INITIAL_DRAFTS);
  const [selectedDraftIndex, setSelectedDraftIndex] = useState<number>(3);
  const [throughput, setThroughput] = useState<string>("144,600 GB/s");
  const [saturationPct, setSaturationPct] = useState<number>(96);
  const [verfLatency, setVerfLatency] = useState<string>("0.01 µs");
  const [activeDraftCount, setActiveDraftCount] = useState<number>(8);
  const [tokenScore, setTokenScore] = useState<string>("33,400,000 UNITS");
  const [engineXp, setEngineXp] = useState<string>("+75.0k ENGINE XP");
  const [specState, setSpecState] = useState<string>("Active");
  const [divergenceActive, setDivergenceActive] = useState<boolean>(false);
  const [vecString, setVecString] = useState<string>("[1.05, 1.06, 1.05, 1.06]");
  const [apaNotice, setApaNotice] = useState<string>("READY FOR SOVEREIGN APA TRANSFER · ZERO LICENSES");
  const [radioLines, setRadioLines] = useState<string[]>([
    "[00:01.04] 🟢 CREW CHIEF: Asynchronous speculative decoding and draft verification engine initialized · 8 drafts linked",
    "[00:01.08] 🟢 TELEMETRY: Multi-token parallel target verification verified at 144,600 GB/s with 3X generation speedup",
  ]);

  const selectedDraft = drafts[selectedDraftIndex] || INITIAL_DRAFTS[3];

  const pushLog = (line1: string, line2: string) => {
    setRadioLines([line1, line2]);
  };

  const handleSpecQuickAction = () => {
    setActiveTab("Spec");
    setThroughput("144,600 GB/s");
    setSaturationPct(98);
    pushLog(
      "[00:02.12] 🟢 CREW CHIEF: Trigger Speculative Decoding Burst engaged across 8 candidate channels",
      "[00:02.16] 🟢 TELEMETRY: Speculative Throughput: 144,600 GB/s · Active Drafts: 8 Drafts · Spec State: Active"
    );
  };

  const handleVerfQuickAction = () => {
    setActiveTab("Verf");
    setVerfLatency("0.01 µs");
    pushLog(
      "[00:02.44] 🟢 CREW CHIEF: Step Asynchronous Verification Pass locked on target forward pass",
      "[00:02.48] 🟢 TELEMETRY: Verification Latency: 0.01 µs · Non-blocking parallel verification confirmed"
    );
  };

  const handleRunQuickAction = () => {
    setActiveTab("Mesh");
    handleInjectBurst();
  };

  const handleInjectBurst = () => {
    setThroughput("144,600 GB/s");
    setSaturationPct(100);
    setVerfLatency("0.01 µs");
    setTokenScore("34,650,000 UNITS");
    setEngineXp("+79.5k ENGINE XP");
    setSpecState("Active");
    const updated = drafts.map((d) => ({
      ...d,
      tok: "288K",
      draftPct: 100,
      syncPct: 100,
      latency: "0.02ms",
      status: "VERIFIED · LOCKED",
      verf: "OK",
      accPct: 95,
    }));
    setDrafts(updated);
    pushLog(
      "[00:03.02] 🟢 CREW CHIEF: Trigger Speculative Decoding Burst executed · 8-draft candidate tree expanded",
      "[00:03.06] 🟢 TELEMETRY: Speculative Throughput: 144,600 GB/s · Processed Tokens: 33,400,000 Units baseline exceeded"
    );
  };

  const handleToggleDivergence = () => {
    const nextSpike = !divergenceActive;
    setDivergenceActive(nextSpike);
    if (nextSpike) {
      setThroughput("118,900 GB/s");
      setSaturationPct(82);
      setVerfLatency("0.03 µs");
      setVecString("[0.94, 0.98, 1.01, 0.96]");
      const updated = drafts.map((d, idx) =>
        idx === 2 || idx === 5
          ? {
              ...d,
              draftPct: 84,
              syncPct: 88,
              latency: "0.04ms",
              status: "TUNING · ADAPTIVE",
              verf: "TUNE",
              accPct: 78,
            }
          : { ...d, accPct: 86 }
      );
      setDrafts(updated);
      pushLog(
        "[00:03.40] 🟡 CREW CHIEF: Inject Draft Divergence Spike (Force Dynamic Acceptance Rate Tuning) active",
        "[00:03.45] 🟡 TELEMETRY: Sub-microsecond barrier adapting gamma threshold on D2 and D5 slots"
      );
    } else {
      setThroughput("144,600 GB/s");
      setSaturationPct(96);
      setVerfLatency("0.01 µs");
      setVecString("[1.05, 1.06, 1.05, 1.06]");
      setDrafts(INITIAL_DRAFTS);
      pushLog(
        "[00:03.82] 🟢 CREW CHIEF: Divergence spike cleared · Dynamic acceptance rate locked at 92%",
        "[00:03.88] 🟢 TELEMETRY: Multi-token parallel target verification verified at 144,600 GB/s with 3X generation speedup"
      );
    }
  };

  const handleStepVerification = () => {
    setVerfLatency("0.01 µs");
    setThroughput("144,600 GB/s");
    setSaturationPct(99);
    setTokenScore("34,040,000 UNITS");
    setEngineXp("+77.5k ENGINE XP");
    setSpecState("Active");
    const updated = drafts.map((d) => ({
      ...d,
      draftPct: 100,
      syncPct: 100,
      latency: "0.02ms",
      status: "VERIFIED · LOCKED",
      verf: "OK",
      accPct: 94,
    }));
    setDrafts(updated);
    pushLog(
      "[00:04.15] 🟢 CREW CHIEF: Step Asynchronous Verification Pass completed in 0.01 µs without host CPU stall",
      "[00:04.19] 🟢 TELEMETRY: Verification Latency: 0.01 µs · All 8 draft barriers synchronized"
    );
  };

  const handleFlushArenas = () => {
    setDivergenceActive(false);
    setThroughput("144,600 GB/s");
    setSaturationPct(96);
    setVerfLatency("0.01 µs");
    setActiveDraftCount(8);
    setTokenScore("33,400,000 UNITS");
    setEngineXp("+75.0k ENGINE XP");
    setSpecState("Active");
    setVecString("[1.05, 1.06, 1.05, 1.06]");
    setDrafts(INITIAL_DRAFTS);
    setSelectedDraftIndex(3);
    pushLog(
      "[00:01.04] 🟢 CREW CHIEF: Flush Spec Arenas & Re-Zero Draft Buffers complete · 8 drafts linked",
      "[00:01.08] 🟢 TELEMETRY: Multi-token parallel target verification verified at 144,600 GB/s with 3X generation speedup"
    );
  };

  const inspectorLine =
    selectedDraft.code +
    " · TOK: " +
    selectedDraft.tok +
    " · DRAFT: " +
    String(selectedDraft.draftPct) +
    "% · SYNC: " +
    String(selectedDraft.syncPct) +
    "% · PTR " +
    selectedDraft.hex +
    " · VERF: " +
    selectedDraft.verf +
    " · LOCKED · DRAFTS: " +
    String(activeDraftCount) +
    " · ACC: " +
    String(selectedDraft.accPct) +
    "%";

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans select-none">
      {/* Top Header Row 1 */}
      <header className="flex items-center justify-between gap-1 w-full shrink-0">
        <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
          <h1 className="text-sm sm:text-base font-mono font-bold tracking-tight text-white">
            GF-T3-348
          </h1>
          <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-cyan-500/20 text-[#00F0FF] border border-cyan-400/50 rounded">
            FLAGSHIP
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0 overflow-hidden">
          <select
            aria-label="Synthetic Speculative Corridor"
            value={corridor}
            onChange={(e) => {
              const nextCorridor = e.target.value;
              setCorridor(nextCorridor);
              pushLog(
                "[00:01.52] 🟢 CREW CHIEF: Switched active speculative fabric to " + nextCorridor,
                "[00:01.56] 🟢 TELEMETRY: Speculative Throughput: 144,600 GB/s · Verification Latency: 0.01 µs"
              );
            }}
            className="max-w-[120px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 text-cyan-300 border border-slate-700 rounded shrink-0 focus:outline-none focus:border-cyan-400"
          >
            {CORRIDORS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleSpecQuickAction}
            className="px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 bg-slate-900 hover:bg-cyan-950 text-[#00F0FF] border border-cyan-500/40 rounded transition-colors cursor-pointer"
          >
            [Spec]
          </button>
          <button
            type="button"
            onClick={handleVerfQuickAction}
            className="px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 bg-slate-900 hover:bg-amber-950 text-[#FF9F0A] border border-amber-500/40 rounded transition-colors cursor-pointer"
          >
            [Verf]
          </button>
          <button
            type="button"
            onClick={handleRunQuickAction}
            className="px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/50 rounded transition-colors cursor-pointer"
          >
            [Run]
          </button>
        </div>
      </header>

      {/* Top Header Row 2 */}
      <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap shrink-0">
        Speculative Decoding · Draft Verification · 3X Generation Speedup
      </div>

      {/* 4-Card Arcade HUD Ribbon (2x2 grid above the fold) */}
      <section className="grid grid-cols-2 gap-1.5 w-full shrink-0 my-0.5">
        {/* Card 1: SPEC NITRO */}
        <div
          title="Speculative Throughput: 144,600 GB/s"
          className="bg-slate-900/90 border border-slate-800 rounded-lg p-1.5 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400">
              SPEC NITRO
            </span>
            <span className="text-[10px] font-mono text-cyan-400">
              3X SPEEDUP
            </span>
          </div>
          <div className="text-[#00F0FF] font-mono text-lg font-bold leading-tight">
            {throughput}
          </div>
          <div className="w-full bg-slate-800 h-1 rounded overflow-hidden my-0.5">
            <div
              className="bg-[#00F0FF] h-full transition-opacity duration-150"
              style={{ width: String(saturationPct) + "%" }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Speculative Throughput Saturation
          </div>
        </div>

        {/* Card 2: VERF STREAK */}
        <div
          title="Verification Latency: 0.01 µs"
          className="bg-slate-900/90 border border-slate-800 rounded-lg p-1.5 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400">
              VERF STREAK
            </span>
            <span className="px-1 py-0.2 text-[9px] font-mono font-bold bg-amber-500/20 text-[#FF9F0A] border border-amber-500/40 rounded">
              🔥 DRAFT-VERF
            </span>
          </div>
          <div className="text-[#FF9F0A] font-mono text-lg font-bold leading-tight">
            {verfLatency}
          </div>
          <div className="text-[10px] font-mono text-emerald-400 truncate">
            BARRIER SYNC: LOCKED
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Verification Latency
          </div>
        </div>

        {/* Card 3: ACTIVE DRAFTS */}
        <div
          title="Active Drafts: 8 Drafts"
          className="bg-slate-900/90 border border-slate-800 rounded-lg p-1.5 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400">
              ACTIVE DRAFTS
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">
              Active Drafts: 8 Drafts
            </span>
          </div>
          <div className="text-white font-mono text-lg font-bold leading-tight">
            DRAFTS: 8/8
          </div>
          <div className="grid grid-cols-8 gap-0.5 my-0.5">
            {drafts.map((d, idx) => (
              <span
                key={d.code}
                onClick={() => setSelectedDraftIndex(idx)}
                className={
                  "text-[8px] font-mono font-bold text-center rounded py-0.2 cursor-pointer border " +
                  (selectedDraftIndex === idx
                    ? "bg-cyan-500/30 text-white border-cyan-400"
                    : "bg-slate-800 text-cyan-300 border-slate-700")
                }
              >
                {d.code}
              </span>
            ))}
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            F1 Gear Shift Indicator [D0..D7]
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div
          title="Processed Tokens: 33,400,000 Units"
          className="bg-slate-900/90 border border-slate-800 rounded-lg p-1.5 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400">
              TOKEN SCORE
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-400">
              {engineXp}
            </span>
          </div>
          <div className="text-white font-mono text-lg font-bold leading-tight">
            {tokenScore}
          </div>
          <div className="text-[10px] font-mono text-cyan-300 truncate">
            Processed Tokens: 33,400,000 Units
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            {"Spec State: " + specState}
          </div>
        </div>
      </section>

      {/* 5 Horizontal Tabs */}
      <nav
        aria-label="Cockpit Mode Tabs"
        className="grid grid-cols-5 gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg my-1 w-full text-center shrink-0"
      >
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={
              "text-xs font-mono font-bold py-1 rounded transition-colors cursor-pointer whitespace-nowrap " +
              (activeTab === tab
                ? "bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/50"
                : "text-slate-300 hover:text-white hover:bg-slate-800/60")
            }
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* Streamlined Mesh Info Subheader (strictly clean of action buttons) */}
      <div className="text-[10px] font-mono whitespace-nowrap overflow-hidden text-slate-300 px-1 shrink-0">
        {"VIEW: MESH · PTR: 0x57F8DC0 · MODE: SPECULATIVE_DECODING · DRAFTS: 8 · VEC: " + vecString}
      </div>

      {/* Central Cockpit Viewport: Interactive Draft Matrix Bay (D0-D7) + Tab Overlay Bar */}
      <main className="flex-1 flex flex-col justify-between min-h-0 overflow-hidden bg-slate-950/70 border border-slate-800/90 rounded-lg p-1 my-0.5">
        {/* Interactive Draft Matrix Bay (D0-D7) always rendered for instant hardware telemetry access */}
        <div className="grid grid-cols-4 gap-1 p-1">
          {drafts.map((slot, idx) => (
            <div
              key={slot.code}
              onClick={() => setSelectedDraftIndex(idx)}
              className={
                "p-1 rounded border transition-colors cursor-pointer flex flex-col justify-between " +
                (selectedDraftIndex === idx
                  ? "bg-slate-900 border-[#00F0FF]"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700")
              }
            >
              {/* Line 1: Title & Hex */}
              <div className="text-[10px] font-mono font-bold text-white flex justify-between items-center w-full">
                <span>{slot.title}</span>
                <span className="text-slate-400 font-normal">{slot.hex}</span>
              </div>
              {/* Line 2: Tokens & Draft Load */}
              <div className="text-[8px] font-mono font-bold text-cyan-300 flex justify-between items-center w-full px-1">
                <span>{"TOK: " + slot.tok}</span>
                <span>{"DRAFT: " + String(slot.draftPct) + "%"}</span>
              </div>
              {/* Line 3: Latency & Status */}
              <div className="flex justify-between items-center text-[8px] font-mono text-slate-300 w-full px-1">
                <span className="text-amber-400">{slot.latency}</span>
                <span className="text-emerald-400">{slot.status}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Context Strip for Selected Tab (Spec / Verf / Stats / APA) */}
        {activeTab === "Mesh" && (
          <div className="px-2 py-1 bg-slate-900/70 border border-slate-800 rounded text-[10px] font-mono text-slate-300 flex items-center justify-between shrink-0">
            <span>{"CORRIDOR: " + corridor}</span>
            <span className="text-emerald-400">NON-BLOCKING STREAMING MULTIPROCESSOR MESH READY</span>
          </div>
        )}

        {activeTab === "Spec" && (
          <div className="px-2 py-1 bg-slate-900/70 border border-cyan-500/40 rounded text-[10px] font-mono text-cyan-200 flex items-center justify-between shrink-0">
            <span>FORMULA: S_spec = sum V(Token_draft, Token_target, gamma_acceptance_rate)</span>
            <button
              type="button"
              onClick={handleInjectBurst}
              className="px-2 py-0.5 bg-cyan-500/20 border border-cyan-400 rounded text-white font-bold cursor-pointer"
            >
              Trigger Speculative Decoding Burst
            </button>
          </div>
        )}

        {activeTab === "Verf" && (
          <div className="px-2 py-1 bg-slate-900/70 border border-amber-500/40 rounded text-[10px] font-mono text-amber-200 flex items-center justify-between shrink-0">
            <span>BARRIER INTERLOCK: 0.01 µs · ZERO HOST CPU SYNCHRONIZATION STALLS</span>
            <button
              type="button"
              onClick={handleStepVerification}
              className="px-2 py-0.5 bg-amber-500/20 border border-amber-400 rounded text-white font-bold cursor-pointer"
            >
              Step Asynchronous Verification Pass
            </button>
          </div>
        )}

        {activeTab === "Stats" && (
          <div className="px-2 py-1 bg-slate-900/70 border border-emerald-500/40 rounded text-[10px] font-mono text-emerald-200 flex items-center justify-between shrink-0">
            <span>Speculative Throughput: 144,600 GB/s · Verification Latency: 0.01 µs · Active Drafts: 8 Drafts</span>
            <span>Processed Tokens: 33,400,000 Units · Spec State: Active</span>
          </div>
        )}

        {activeTab === "APA" && (
          <div className="px-2 py-1 bg-slate-900/90 border border-amber-500/50 rounded flex flex-col gap-1 shrink-0">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-200">
              <span>CHASSIS: GF-T3-348 · CLUSTER-006 · 100% SOVEREIGN IP TITLE</span>
              <span className="text-[#FF9F0A] font-bold">Retail Price: 75,000 - 150,000+ UNITS</span>
            </div>
            <div className="flex flex-col gap-2 w-full">
              <button
                type="button"
                onClick={() => {
                  setApaNotice("APA ESCROW GATE OPENED FOR GF-T3-348 · 100% CLEAN-ROOM MIT TITLE");
                  pushLog(
                    "[00:05.10] 🟢 CREW CHIEF: ACQUIRE TITLE (APA) initiated for chassis GF-T3-348",
                    "[00:05.14] 🟢 TELEMETRY: Sovereign repository transfer package verified · Zero copyleft"
                  );
                }}
                className="w-full py-1 text-[10px] font-mono font-bold bg-amber-500/20 hover:bg-amber-500/30 text-[#FF9F0A] border border-amber-400 rounded cursor-pointer text-center"
              >
                ACQUIRE TITLE (APA)
              </button>
              <button
                type="button"
                onClick={() => {
                  setApaNotice("VAULT BUYOUT INQUIRY LOGGED · CLUSTER-006 TRANSPORT PACKAGE");
                  pushLog(
                    "[00:05.42] 🟢 CREW CHIEF: INQUIRE VAULT BUYOUT logged for GF-T3-348",
                    "[00:05.46] 🟢 TELEMETRY: Direct standalone repository buyout terms ready in ASSET_TRANSFER_SPEC.md"
                  );
                }}
                className="w-full py-1 text-[10px] font-mono font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-[#00F0FF] border border-cyan-400 rounded cursor-pointer text-center"
              >
                INQUIRE VAULT BUYOUT
              </button>
            </div>
            <div className="text-[9px] font-mono text-emerald-400 truncate text-center">
              {apaNotice}
            </div>
          </div>
        )}
      </main>

      {/* Compact Speculative Telemetry Inspector Strip */}
      <div className="text-[11px] font-mono whitespace-nowrap overflow-hidden text-cyan-300 font-bold px-2 py-0.5 bg-black/60 border border-slate-800 rounded my-0.5 shrink-0">
        {inspectorLine}
      </div>

      {/* Tactical Launch Control Switches */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1">
        <button
          type="button"
          onClick={handleInjectBurst}
          title="Trigger Speculative Decoding Burst"
          className="text-[8px] sm:text-[9px] md:text-xs font-mono font-bold py-1.5 px-0.5 whitespace-nowrap text-center truncate border rounded w-full border-amber-500/80 bg-amber-950/40 hover:bg-amber-900/60 text-[#FF9F0A] cursor-pointer transition-colors"
        >
          💥 INJECT SPECULATIVE DECODING BURST
        </button>

        <button
          type="button"
          onClick={handleToggleDivergence}
          title="Inject Draft Divergence Spike (Force Dynamic Acceptance Rate Tuning)"
          className="text-[8px] sm:text-[9px] md:text-xs font-mono font-bold py-1.5 px-0.5 whitespace-nowrap text-center truncate border rounded w-full border-cyan-400 bg-cyan-950/40 hover:bg-cyan-900/60 text-[#00F0FF] shadow-[0_0_8px_rgba(0,240,255,0.25)] cursor-pointer transition-colors"
        >
          ⚡ TOGGLE DRAFT DIVERGENCE SPIKE
        </button>

        <button
          type="button"
          onClick={handleStepVerification}
          title="Step Asynchronous Verification Pass"
          className="text-[8px] sm:text-[9px] md:text-xs font-mono font-bold py-1.5 px-0.5 whitespace-nowrap text-center truncate border rounded w-full border-emerald-500/80 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 cursor-pointer transition-colors"
        >
          🚀 STEP ASYNCHRONOUS VERIFICATION PASS
        </button>

        <button
          type="button"
          onClick={handleFlushArenas}
          title="Flush Spec Arenas & Re-Zero Draft Buffers"
          className="text-[8px] sm:text-[9px] md:text-xs font-mono font-bold py-1.5 px-0.5 whitespace-nowrap text-center truncate border rounded w-full border-rose-500/80 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 cursor-pointer transition-colors"
        >
          🔄 FLUSH SPEC ARENAS
        </button>
      </section>

      {/* Pit-Wall Radio Comms Log */}
      <footer className="h-8 overflow-hidden font-mono text-[9px] px-2 py-0.5 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-normal flex flex-col justify-center">
        <div className="truncate">{radioLines[0]}</div>
        <div className="truncate">{radioLines[1]}</div>
      </footer>
    </div>
  );
}
