/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  SYNTHETIC_CORRIDORS,
  SyntheticCorridor,
  SpeculativeEngineTelemetry,
  createInitialTelemetry,
  stepSpeculativeEngine,
  POSTGRES_RLS_SCHEMA_SQL,
} from './engine/speculativeEngine';

type CockpitTab = 'Mesh' | 'Spec' | 'Dft' | 'Stats' | 'APA';

const TABS: CockpitTab[] = ['Mesh', 'Spec', 'Dft', 'Stats', 'APA'];

function formatNumberWithCommas(num: number): string {
  return num.toLocaleString('en-US');
}

function formatXpK(xp: number): string {
  const inK = (xp / 1000).toFixed(1);
  return '+' + inK + 'k ENGINE XP';
}

export default function App() {
  const [telemetry, setTelemetry] = useState<SpeculativeEngineTelemetry>(() =>
    createInitialTelemetry()
  );
  const [selectedDraftIndex, setSelectedDraftIndex] = useState<number>(3);
  const [activeTab, setActiveTab] = useState<CockpitTab>('Mesh');
  const [schemaModalOpen, setSchemaModalOpen] = useState<boolean>(false);
  const [apaNotice, setApaNotice] = useState<string>('');
  const [radioLogs, setRadioLogs] = useState<[string, string]>([
    '[00:01.04] 🟢 CREW CHIEF: Speculative decoding and draft model verification engine initialized · 8 drafts linked',
    '[00:01.08] 🟢 TELEMETRY: Target-draft rejection sampling verified at 19,500 GB/s with 2.5x speedup factor',
  ]);

  const selectedDraft =
    telemetry.drafts[selectedDraftIndex] ?? telemetry.drafts[3];

  const appendLog = (callsign: string, message: string) => {
    const nextStep = telemetry.stepCounter + 2;
    const sec = String(Math.floor(nextStep / 10) + 1).padStart(2, '0');
    const hundredths = String((nextStep * 7) % 100).padStart(2, '0');
    const line = '[00:' + sec + '.' + hundredths + '] ' + callsign + ': ' + message;
    setRadioLogs((prev) => [prev[1], line]);
  };

  const handleCorridorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextCorridor = e.target.value as SyntheticCorridor;
    const updated = stepSpeculativeEngine(telemetry, { corridor: nextCorridor });
    setTelemetry(updated);
    appendLog(
      '⚡ PIT WALL',
      'Corridor switched to ' +
        nextCorridor.split(' ')[0] +
        ' · Bandwidth ' +
        formatNumberWithCommas(updated.throughputGbs) +
        ' GB/s'
    );
  };

  const handleInjectBurst = () => {
    const updated = stepSpeculativeEngine(telemetry, { triggerBurst: true });
    setTelemetry(updated);
    appendLog(
      '🟢 CREW CHIEF',
      'Trigger Speculative Verification Burst · Multi-token acceptance saturated at ' +
        formatNumberWithCommas(updated.throughputGbs) +
        ' GB/s · ' +
        String(updated.speedupMultiplier) +
        'x speedup'
    );
  };

  const handleToggleDiscrepancy = () => {
    const updated = stepSpeculativeEngine(telemetry, { toggleDiscrepancy: true });
    setTelemetry(updated);
    if (updated.discrepancyActive) {
      appendLog(
        '🔴 TELEMETRY',
        'Inject Draft Discrepancy Spike (Force Rejection Fallback) · Residual distribution sampling engaged'
      );
    } else {
      appendLog(
        '🟢 CREW CHIEF',
        'Draft discrepancy cleared · Target-draft probability threshold lock restored across D0-D7'
      );
    }
  };

  const handleStepPipeline = () => {
    const updated = stepSpeculativeEngine(telemetry);
    setTelemetry(updated);
    appendLog(
      '⚡ PIT WALL',
      'Step Speculative Pipeline Pass #' +
        String(updated.stepCounter) +
        ' · Processed Tokens: ' +
        formatNumberWithCommas(updated.processedTokens) +
        ' Units'
    );
  };

  const handleFlushBuffers = () => {
    const resetState = stepSpeculativeEngine(telemetry, { flushReset: true });
    setTelemetry(resetState);
    setSelectedDraftIndex(3);
    setApaNotice('');
    setRadioLogs([
      '[00:01.04] 🟢 CREW CHIEF: Speculative decoding and draft model verification engine initialized · 8 drafts linked',
      '[00:01.08] 🟢 TELEMETRY: Target-draft rejection sampling verified at 19,500 GB/s with 2.5x speedup factor',
    ]);
  };

  const handleSelectDraft = (idx: number) => {
    setSelectedDraftIndex(idx);
    const d = telemetry.drafts[idx];
    if (d) {
      appendLog(
        '🟢 TELEMETRY',
        'Inspecting ' +
          d.id +
          ' (' +
          d.pointerHex +
          ') · TOK: ' +
          String(d.tokensCount) +
          ' · ACCEPT: ' +
          String(d.acceptancePct) +
          '% · RATIO: ' +
          String(d.speedupRatio.toFixed(1)) +
          'x'
      );
    }
  };

  const saturationPct = Math.min(
    100,
    Math.round((telemetry.throughputGbs / 22400) * 100)
  );

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans select-none">
      {/* TOP COMMAND DECK: Row 1 + Row 2 */}
      <header className="w-full shrink-0 flex flex-col gap-0.5">
        {/* Top Header Row 1 */}
        <div className="flex items-center justify-between gap-1 w-full shrink-0">
          {/* Left: Title + Cyan Badge */}
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <h1 className="text-sm font-mono font-bold tracking-tight text-white">
              GF-T3-257
            </h1>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-cyan-500/15 text-[#00F0FF] border border-cyan-500/40 rounded">
              FLAGSHIP
            </span>
          </div>

          {/* Right: Corridor Dropdown + Micro Action Buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <select
              aria-label="Synthetic Speculative Corridor"
              value={telemetry.corridor}
              onChange={handleCorridorChange}
              className="max-w-[110px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 text-cyan-300 border border-slate-700 rounded focus:outline-none focus:border-cyan-400"
            >
              {SYNTHETIC_CORRIDORS.map((corridor) => (
                <option key={corridor} value={corridor}>
                  {corridor}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                setActiveTab('Spec');
                appendLog(
                  '⚡ PIT WALL',
                  'Switched view to Speculative Rejection Sampling matrix'
                );
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 rounded transition-colors cursor-pointer"
            >
              [Spec]
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('Dft');
                appendLog(
                  '⚡ PIT WALL',
                  'Switched view to Multi-Token Draft Acceptance tree'
                );
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 rounded transition-colors cursor-pointer"
            >
              [Draft]
            </button>
            <button
              type="button"
              onClick={handleStepPipeline}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/50 rounded transition-colors cursor-pointer"
            >
              [Run]
            </button>
            <button
              type="button"
              onClick={() => setSchemaModalOpen((prev) => !prev)}
              className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded transition-colors cursor-pointer"
            >
              [Inspect Schema]
            </button>
            <button
              type="button"
              onClick={handleFlushBuffers}
              className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-rose-950 text-rose-300 border border-rose-500/40 rounded transition-colors cursor-pointer"
            >
              [Reset]
            </button>
          </div>
        </div>

        {/* Top Header Row 2 */}
        <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap">
          Speculative Decoding · Draft Verification · 2.5x Speedup
        </div>
      </header>

      {/* 4-CARD ARCADE HUD RIBBON (2x2 Grid) */}
      <section className="grid grid-cols-2 gap-1.5 w-full shrink-0">
        {/* Card 1: SPEC NITRO */}
        <div className="px-2 py-1 rounded border border-slate-800 bg-slate-900/70 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-semibold text-slate-400">
              SPEC NITRO
            </span>
            <span className="font-mono text-lg font-bold text-[#00F0FF] leading-tight">
              {formatNumberWithCommas(telemetry.throughputGbs)} GB/s
            </span>
          </div>
          <div className="w-full h-1 bg-slate-950 rounded overflow-hidden my-0.5 border border-slate-800">
            <div
              className="h-full bg-[#00F0FF] transition-opacity duration-150"
              style={{ width: String(saturationPct) + '%' }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            Speculative Throughput Saturation
          </div>
        </div>

        {/* Card 2: SPEED STREAK */}
        <div className="px-2 py-1 rounded border border-slate-800 bg-slate-900/70 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-semibold text-slate-400">
              SPEED STREAK
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-lg font-bold text-white leading-tight">
                {telemetry.verificationLatencyUs.toFixed(2)} µs
              </span>
              <span className="px-1 py-0.5 text-[10px] font-mono font-bold bg-amber-500/20 text-[#FF9F0A] border border-amber-500/40 rounded">
                🔥 {telemetry.speedupMultiplier.toFixed(1)}x
              </span>
            </div>
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            Draft Verification Latency
          </div>
        </div>

        {/* Card 3: ACTIVE DRAFTS */}
        <div className="px-2 py-1 rounded border border-slate-800 bg-slate-900/70 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-semibold text-slate-400">
              ACTIVE DRAFTS
            </span>
            <span className="font-mono text-xs font-bold text-emerald-400">
              DRAFTS: {telemetry.activeDraftsCount}/{telemetry.totalDraftsCount}
            </span>
          </div>
          <div className="grid grid-cols-8 gap-0.5 my-0.5">
            {telemetry.drafts.map((d, idx) => (
              <button
                key={d.id}
                type="button"
                onClick={() => handleSelectDraft(idx)}
                className={
                  'text-[9px] font-mono font-bold rounded py-0.2 text-center border cursor-pointer ' +
                  (selectedDraftIndex === idx
                    ? 'bg-cyan-500/30 text-white border-cyan-400'
                    : d.locked
                      ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700/50'
                      : 'bg-rose-950/70 text-rose-300 border-rose-700/50')
                }
              >
                {d.id}
              </button>
            ))}
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            Active Drafts: {telemetry.activeDraftsCount} Drafts · F1 Gear Bus [D0..D7]
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="px-2 py-1 rounded border border-slate-800 bg-slate-900/70 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-semibold text-slate-400">
              TOKEN SCORE
            </span>
            <span className="text-[10px] font-mono font-bold text-[#10B981]">
              {formatXpK(telemetry.engineXp)}
            </span>
          </div>
          <div className="font-mono text-sm sm:text-base font-bold text-white leading-tight truncate">
            {formatNumberWithCommas(telemetry.processedTokens)} UNITS
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            Spec State: {telemetry.specState}
          </div>
        </div>
      </section>

      {/* 5 HORIZONTAL TABS */}
      <nav
        aria-label="Cockpit Views"
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
                'py-0.5 text-[11px] font-mono font-bold rounded transition-colors cursor-pointer whitespace-nowrap ' +
                (isActive
                  ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60')
              }
            >
              {tab}
            </button>
          );
        })}
      </nav>

      {/* STREAMLINED MESH INFO SUBHEADER */}
      <div className="text-[10px] font-mono whitespace-nowrap overflow-hidden text-slate-300 shrink-0 px-1">
        VIEW: {activeTab.toUpperCase()} · PTR: {telemetry.pointerBaseHex} · MODE:{' '}
        {telemetry.modeLabel} · SPEED: {telemetry.speedupMultiplier.toFixed(1)}x · VEC: [
        {telemetry.vectorTelemetry.map((v) => v.toFixed(2)).join(', ')}]
      </div>

      {/* INTERACTIVE SIMULATION BAY: D0-D7 MATRIX */}
      <main className="flex-1 min-h-0 flex flex-col justify-center my-0.5 overflow-hidden">
        <div className="grid grid-cols-4 gap-1.5 w-full">
          {telemetry.drafts.map((draft, idx) => {
            const isSelected = selectedDraftIndex === idx;
            return (
              <div
                key={draft.id}
                role="button"
                tabIndex={0}
                onClick={() => handleSelectDraft(idx)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectDraft(idx);
                  }
                }}
                className={
                  'py-0.5 px-1.5 rounded border border-slate-800 bg-slate-900/60 flex flex-col justify-between transition-colors cursor-pointer ' +
                  (isSelected
                    ? 'ring-1 ring-[#00F0FF]'
                    : draft.locked
                      ? 'hover:border-slate-700'
                      : 'ring-1 ring-rose-500/60')
                }
              >
                {/* Line 1: Title & Hex on one line */}
                <div className="text-[11px] font-mono font-bold text-white flex justify-between items-center">
                  <span>{draft.id}</span>
                  <span className="text-slate-400 font-normal">
                    {draft.pointerHex}
                  </span>
                </div>

                {/* Line 2: Tokens & Ratio combined */}
                <div className="text-[11px] font-mono text-cyan-300 font-bold flex justify-between">
                  <span>TOK: {draft.tokensCount}</span>
                  <span>RATIO: {draft.speedupRatio.toFixed(1)}x</span>
                </div>

                {/* Line 3: Latency & State combined */}
                <div className="text-[10px] font-mono flex justify-between">
                  <span className="text-amber-300 font-bold">
                    {draft.latencyMs.toFixed(2)}ms
                  </span>
                  <span
                    className={
                      draft.locked
                        ? 'text-emerald-400 font-semibold'
                        : 'text-rose-400 font-semibold'
                    }
                  >
                    {draft.state} · {draft.locked ? 'LOCKED' : 'FAULT'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* COMPACT SPEC TELEMETRY INSPECTOR STRIP */}
      <div className="text-[11px] font-mono whitespace-nowrap overflow-hidden text-cyan-300 font-bold px-2 py-0.5 bg-black/60 border border-slate-800 rounded my-0.5 shrink-0 flex items-center justify-between gap-2">
        <span className="truncate">
          {selectedDraft.id} · TOK: {selectedDraft.tokensCount} · ACCEPT:{' '}
          {selectedDraft.acceptancePct}% · RATIO: {selectedDraft.speedupRatio.toFixed(1)}x ·
          PTR {selectedDraft.pointerHex} · VERIFY: {selectedDraft.verifyStatus} ·{' '}
          {selectedDraft.locked ? 'LOCKED' : 'FAULT'}
          {apaNotice ? ' · ' + apaNotice : ''}
        </span>
        {activeTab === 'APA' && (
          <span className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                setApaNotice('APA TITLE LOCKED');
                appendLog(
                  '🟢 CREW CHIEF',
                  'ACQUIRE TITLE (APA) initiated · Sovereign repository package verified'
                );
              }}
              className="px-1.5 py-0 text-[10px] rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-bold cursor-pointer"
            >
              ACQUIRE TITLE (APA)
            </button>
            <button
              type="button"
              onClick={() => {
                setApaNotice('BUYOUT DOSSIER READY');
                appendLog(
                  '⚡ PIT WALL',
                  'INQUIRE VAULT BUYOUT logged · Clean-room SBOM and NIST SSDF audit attached'
                );
              }}
              className="px-1.5 py-0 text-[10px] rounded bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold cursor-pointer"
            >
              INQUIRE VAULT BUYOUT
            </button>
          </span>
        )}
      </div>

      {/* TACTICAL LAUNCH CONTROL BUTTONS */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1">
        <button
          type="button"
          onClick={handleInjectBurst}
          className="border border-amber-500/70 bg-amber-950/40 hover:bg-amber-900/50 text-[#FF9F0A] rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer whitespace-nowrap truncate px-1"
        >
          💥 INJECT SPECULATIVE BURST
        </button>

        <button
          type="button"
          onClick={handleToggleDiscrepancy}
          className="border border-[#00F0FF]/80 bg-cyan-950/40 hover:bg-cyan-900/50 text-[#00F0FF] rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer whitespace-nowrap truncate px-1"
        >
          ⚡ TOGGLE DRAFT DISCREPANCY
        </button>

        <button
          type="button"
          onClick={handleStepPipeline}
          className="border border-emerald-500/70 bg-emerald-950/40 hover:bg-emerald-900/50 text-[#10B981] rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer whitespace-nowrap truncate px-1"
        >
          🚀 STEP SPECULATIVE VERIFY
        </button>

        <button
          type="button"
          onClick={handleFlushBuffers}
          className="border border-rose-500/70 bg-rose-950/40 hover:bg-rose-900/50 text-rose-400 rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer whitespace-nowrap truncate px-1"
        >
          🔄 FLUSH DRAFT BUFFERS
        </button>
      </section>

      {/* PIT-WALL RADIO COMMS LOG */}
      <footer className="h-8 overflow-hidden font-mono text-[9px] px-2 py-0.5 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-normal flex flex-col justify-center">
        <div className="truncate">{radioLogs[0]}</div>
        <div className="truncate">{radioLogs[1]}</div>
      </footer>

      {/* SQL & APA SCHEMA INSPECTOR OVERLAY MODAL */}
      {schemaModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-[#05070B] border border-cyan-500/50 rounded-lg p-3 flex flex-col gap-2 max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="text-xs font-mono font-bold text-[#00F0FF]">
                GF-T3-257 · SUPABASE / POSTGRESQL PARTITIONED RLS SCHEMA & APA SOVEREIGNTY
              </span>
              <button
                type="button"
                onClick={() => setSchemaModalOpen(false)}
                className="px-2 py-0.5 text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-500/40 rounded cursor-pointer"
              >
                [CLOSE]
              </button>
            </div>
            <pre className="text-[10px] font-mono text-slate-300 bg-black/90 p-2 rounded border border-slate-800 overflow-y-auto flex-1">
              {POSTGRES_RLS_SCHEMA_SQL}
            </pre>
            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-[10px] font-mono text-emerald-400">
                ✓ Zero-Trust GridSync Zod Ingress · ✓ Partitioned Tables · ✓ RLS Enforced
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setSchemaModalOpen(false);
                    setActiveTab('APA');
                    setApaNotice('APA TITLE PACKAGE VERIFIED');
                  }}
                  className="px-2 py-1 text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 rounded cursor-pointer"
                >
                  ACQUIRE TITLE (APA)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSchemaModalOpen(false);
                    setActiveTab('APA');
                    setApaNotice('VAULT BUYOUT INQUIRY REGISTERED');
                  }}
                  className="px-2 py-1 text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50 rounded cursor-pointer"
                >
                  INQUIRE VAULT BUYOUT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
