/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import React, { useState } from 'react';

type CorridorOption =
  | 'SPEC-CORRIDOR-ALPHA (DYNAMIC-SPECULATIVE-DECODING-FABRIC · 60400-GB/S)'
  | 'SPEC-CORRIDOR-BRAVO (DRAFT-VERIFICATION-ENGINE)'
  | 'SPEC-CORRIDOR-GAMMA (NON-BLOCKING-CANDIDATE-RECYCLER)'
  | 'SPEC-CORRIDOR-DELTA (FALLBACK-TARGET-ONLY-SERIAL-PASS)';

type TabKey = 'Mesh' | 'Spec' | 'Veri' | 'Stats' | 'APA';

interface CandidateNode {
  id: number;
  code: string;
  title: string;
  hex: string;
  tokensK: number;
  acceptPct: number;
  latencyMs: number;
  syncPct: number;
  specStatus: string;
  stateLabel: string;
  draftLogit: number;
  targetLogit: number;
}

const CORRIDORS: CorridorOption[] = [
  'SPEC-CORRIDOR-ALPHA (DYNAMIC-SPECULATIVE-DECODING-FABRIC · 60400-GB/S)',
  'SPEC-CORRIDOR-BRAVO (DRAFT-VERIFICATION-ENGINE)',
  'SPEC-CORRIDOR-GAMMA (NON-BLOCKING-CANDIDATE-RECYCLER)',
  'SPEC-CORRIDOR-DELTA (FALLBACK-TARGET-ONLY-SERIAL-PASS)',
];

const TABS: TabKey[] = ['Mesh', 'Spec', 'Veri', 'Stats', 'APA'];

function createInitialCandidates(): CandidateNode[] {
  const baseLogits = [6.31, 6.35, 6.32, 6.34, 6.30, 6.36, 6.33, 6.35];
  const list: CandidateNode[] = [];
  for (let i = 0; i < 8; i += 1) {
    list.push({
      id: i,
      code: 'D' + String(i),
      title: 'Candidate ' + String(i) + ' (D' + String(i) + ')',
      hex: '0x290' + String(i) + '0',
      tokensK: 256,
      acceptPct: 88.5,
      latencyMs: 0.02,
      syncPct: 100,
      specStatus: 'OK',
      stateLabel: 'VERIFIED · LOCKED',
      draftLogit: baseLogits[i],
      targetLogit: Number((baseLogits[i] - 0.01).toFixed(2)),
    });
  }
  return list;
}

function formatNumberWithCommas(val: number): string {
  return val.toLocaleString('en-US');
}

export default function App() {
  const [corridor, setCorridor] = useState<CorridorOption>(CORRIDORS[0]);
  const [activeTab, setActiveTab] = useState<TabKey>('Mesh');
  const [selectedCandidateIndex, setSelectedCandidateIndex] = useState<number>(3);
  const [candidates, setCandidates] = useState<CandidateNode[]>(createInitialCandidates);
  const [throughputGbs, setThroughputGbs] = useState<number>(60400);
  const [verifyLatencyUs, setVerifyLatencyUs] = useState<number>(0.01);
  const [processedTokens, setProcessedTokens] = useState<number>(10000000);
  const [engineXpK, setEngineXpK] = useState<number>(75.0);
  const [speedupFactor, setSpeedupFactor] = useState<number>(3.5);
  const [speculativeState, setSpeculativeState] = useState<string>('Verification Active');
  const [divergenceActive, setDivergenceActive] = useState<boolean>(false);
  const [apaTransferState, setApaTransferState] = useState<string>(
    'READY FOR SOVEREIGN APA TITLE TRANSFER · CLUSTER-006'
  );
  const [radioLogs, setRadioLogs] = useState<[string, string]>([
    '[00:01.04] 🟢 CREW CHIEF: Asynchronous speculative decoding and draft verification engine initialized · 8 candidates linked',
    '[00:01.08] 🟢 TELEMETRY: Parallel token validation verified at 60,400 GB/s with 3.5x generation speedup',
  ]);

  const appendRadioLog = (line1: string, line2: string) => {
    setRadioLogs([line1, line2]);
  };

  const handleCorridorChange = (nextCorridor: CorridorOption) => {
    setCorridor(nextCorridor);
    if (nextCorridor.indexOf('ALPHA') !== -1) {
      setThroughputGbs(60400);
      setVerifyLatencyUs(0.01);
      setSpeedupFactor(3.5);
      setSpeculativeState('Verification Active');
    } else if (nextCorridor.indexOf('BRAVO') !== -1) {
      setThroughputGbs(58900);
      setVerifyLatencyUs(0.01);
      setSpeedupFactor(3.4);
      setSpeculativeState('Exact Target Distribution Lock');
    } else if (nextCorridor.indexOf('GAMMA') !== -1) {
      setThroughputGbs(57200);
      setVerifyLatencyUs(0.01);
      setSpeedupFactor(3.3);
      setSpeculativeState('Non-Blocking Recycler Active');
    } else {
      setThroughputGbs(25400);
      setVerifyLatencyUs(0.04);
      setSpeedupFactor(1.0);
      setSpeculativeState('Fallback Target-Only Serial Pass');
    }
    appendRadioLog(
      '[00:02.12] 🟢 CREW CHIEF: Switched active corridor to ' + nextCorridor,
      '[00:02.16] 🟢 TELEMETRY: Sub-microsecond barrier synchronization locked across D0..D7'
    );
  };

  const handleTriggerBurst = () => {
    setThroughputGbs(64800);
    setVerifyLatencyUs(0.01);
    setProcessedTokens((prev) => prev + 1250000);
    setEngineXpK((prev) => Number((prev + 12.5).toFixed(1)));
    setSpeedupFactor(3.8);
    setSpeculativeState('Verification Active · Burst Locked');
    setCandidates((prev) =>
      prev.map((c) => ({
        ...c,
        tokensK: c.tokensK + 32,
        acceptPct: Number(Math.min(96.5, c.acceptPct + 1.2).toFixed(1)),
        latencyMs: 0.01,
        syncPct: 100,
        specStatus: 'OK',
        stateLabel: 'VERIFIED · LOCKED',
      }))
    );
    appendRadioLog(
      '[00:03.40] 🟠 CREW CHIEF: Speculative decoding burst injected across 8 candidate lanes',
      '[00:03.44] 🟢 TELEMETRY: Decoding Throughput: 64,800 GB/s · Verification Latency: 0.01 µs · Active Candidates: 8 Candidates'
    );
  };

  const handleToggleDivergence = () => {
    const nextDivergence = !divergenceActive;
    setDivergenceActive(nextDivergence);
    if (nextDivergence) {
      setThroughputGbs(51200);
      setVerifyLatencyUs(0.03);
      setSpeedupFactor(2.8);
      setSpeculativeState('Dynamic Re-Sampling Active');
      setCandidates((prev) =>
        prev.map((c, idx) => {
          if (idx === 2 || idx === 5 || idx === 7) {
            return {
              ...c,
              acceptPct: 68.4,
              latencyMs: 0.04,
              syncPct: 86,
              specStatus: 'RECYCLE',
              stateLabel: 'RE-SAMPLING · RECYCLED',
            };
          }
          return {
            ...c,
            acceptPct: 88.5,
            latencyMs: 0.02,
            syncPct: 100,
            specStatus: 'OK',
            stateLabel: 'VERIFIED · LOCKED',
          };
        })
      );
      appendRadioLog(
        '[00:04.18] ⚡ CREW CHIEF: Draft divergence spike injected · Force dynamic re-sampling on D2, D5, D7',
        '[00:04.22] 🟢 TELEMETRY: Non-blocking candidate recycler reclaimed 3 arenas with zero host CPU stall'
      );
    } else {
      setThroughputGbs(60400);
      setVerifyLatencyUs(0.01);
      setSpeedupFactor(3.5);
      setSpeculativeState('Verification Active');
      setCandidates((prev) =>
        prev.map((c) => ({
          ...c,
          acceptPct: 88.5,
          latencyMs: 0.02,
          syncPct: 100,
          specStatus: 'OK',
          stateLabel: 'VERIFIED · LOCKED',
        }))
      );
      appendRadioLog(
        '[00:04.85] 🟢 CREW CHIEF: Draft divergence spike cleared · Exact target output distribution restored',
        '[00:04.89] 🟢 TELEMETRY: Decoding Throughput: 60,400 GB/s · Active Candidates: 8 Candidates'
      );
    }
  };

  const handleStepVerification = () => {
    setProcessedTokens((prev) => prev + 256000);
    setEngineXpK((prev) => Number((prev + 2.5).toFixed(1)));
    setSpeculativeState('Verification Active');
    setCandidates((prev) =>
      prev.map((c, idx) => {
        const nextLogit = Number((6.30 + ((idx + 1) % 6) * 0.01).toFixed(2));
        return {
          ...c,
          tokensK: c.tokensK + 8,
          draftLogit: nextLogit,
          targetLogit: Number((nextLogit - 0.01).toFixed(2)),
          acceptPct: divergenceActive && (idx === 2 || idx === 5) ? 72.0 : 88.5,
          latencyMs: 0.02,
          syncPct: 100,
          specStatus: 'OK',
          stateLabel: 'VERIFIED · LOCKED',
        };
      })
    );
    appendRadioLog(
      '[00:05.50] 🚀 CREW CHIEF: Asynchronous verification pass stepped · S_spec = M_target(tau_draft) evaluated',
      '[00:05.54] 🟢 TELEMETRY: Processed Tokens: ' +
        formatNumberWithCommas(processedTokens + 256000) +
        ' Units · Verification Latency: ' +
        String(verifyLatencyUs) +
        ' µs'
    );
  };

  const handleFlushArenas = () => {
    setDivergenceActive(false);
    setThroughputGbs(60400);
    setVerifyLatencyUs(0.01);
    setProcessedTokens(10000000);
    setEngineXpK(75.0);
    setSpeedupFactor(3.5);
    setSpeculativeState('Verification Active');
    setSelectedCandidateIndex(3);
    setCandidates(createInitialCandidates());
    appendRadioLog(
      '[00:01.04] 🟢 CREW CHIEF: Asynchronous speculative decoding and draft verification engine initialized · 8 candidates linked',
      '[00:01.08] 🟢 TELEMETRY: Parallel token validation verified at 60,400 GB/s with 3.5x generation speedup'
    );
  };

  const activeCandidatesCount = candidates.filter(
    (c) => c.stateLabel.indexOf('LOCKED') !== -1
  ).length;
  const selectedCandidate = candidates[selectedCandidateIndex] || candidates[3];
  const vecString =
    '[' +
    candidates
      .slice(0, 4)
      .map((c) => c.draftLogit.toFixed(2))
      .join(', ') +
    ']';
  const saturationPct = Math.min(100, Math.round((throughputGbs / 64800) * 100));

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans select-none">
      {/* TOP HEADER BLOCK */}
      <header className="w-full shrink-0 flex flex-col gap-0.5 border-b border-slate-800/90 pb-1">
        {/* Top Header Row 1 */}
        <div className="flex items-center justify-between gap-1 w-full shrink-0">
          {/* Left */}
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <h1 className="text-base md:text-lg font-mono font-bold tracking-tight text-white">
              GF-T3-302
            </h1>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-cyan-500/15 text-[#00F0FF] border border-cyan-500/40 rounded">
              FLAGSHIP
            </span>
          </div>

          {/* Right */}
          <div className="flex items-center gap-1 shrink-0 overflow-hidden">
            <select
              aria-label="Speculative Corridor Selector"
              value={corridor}
              onChange={(e) => handleCorridorChange(e.target.value as CorridorOption)}
              className="max-w-[120px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 text-cyan-300 border border-slate-700 rounded shrink-0 focus:outline-none focus:border-cyan-400"
            >
              {CORRIDORS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                setActiveTab('Spec');
                handleTriggerBurst();
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 bg-slate-900 hover:bg-cyan-950 text-[#00F0FF] border border-cyan-500/40 rounded transition-colors cursor-pointer"
            >
              [Spec]
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('Veri');
                handleStepVerification();
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 bg-slate-900 hover:bg-amber-950 text-[#FF9F0A] border border-amber-500/40 rounded transition-colors cursor-pointer"
            >
              [Verify]
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('Mesh');
                handleStepVerification();
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 rounded transition-colors cursor-pointer"
            >
              [Run]
            </button>
          </div>
        </div>

        {/* Top Header Row 2 */}
        <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap">
          Speculative Decoding · Draft Verification · {speedupFactor.toFixed(1)}x Speedup
        </div>
      </header>

      {/* 4-CARD ARCADE HUD RIBBON (2x2 Grid) */}
      <section
        aria-label="Arcade HUD Telemetry Ribbon"
        className="grid grid-cols-2 gap-1.5 w-full shrink-0 my-0.5"
      >
        {/* Card 1 (SPEC NITRO) */}
        <div className="bg-slate-900/75 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              SPEC NITRO
            </span>
            <span className="font-mono text-lg font-bold text-[#00F0FF]">
              {formatNumberWithCommas(throughputGbs)} GB/s
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-950 rounded overflow-hidden border border-slate-800 my-0.5">
            <div
              className="h-full bg-[#00F0FF] transition-all duration-150"
              style={{ width: String(saturationPct) + '%' }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-300">
            <span>Decoding Throughput Saturation</span>
            <span className="text-cyan-300 font-bold">{saturationPct}%</span>
          </div>
        </div>

        {/* Card 2 (VERIFY STREAK) */}
        <div className="bg-slate-900/75 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              VERIFY STREAK
            </span>
            <span className="font-mono text-lg font-bold text-[#FF9F0A]">
              {verifyLatencyUs.toFixed(2)} µs
            </span>
          </div>
          <div className="flex items-center justify-between my-0.5">
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-amber-500/15 text-[#FF9F0A] border border-amber-500/40 rounded">
              🔥 DRAFT-VAL
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">
              BARRIER LOCKED
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-300">
            <span>Verification Latency</span>
            <span className="text-amber-300">Sub-Microsecond Sync</span>
          </div>
        </div>

        {/* Card 3 (ACTIVE CANDIDATES) */}
        <div className="bg-slate-900/75 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              ACTIVE CANDIDATES
            </span>
            <span className="font-mono text-sm md:text-base font-bold text-emerald-400">
              CANDIDATES: {activeCandidatesCount}/8
            </span>
          </div>
          <div className="grid grid-cols-8 gap-0.5 my-0.5">
            {candidates.map((cand, idx) => {
              const isSelected = idx === selectedCandidateIndex;
              const isLocked = cand.stateLabel.indexOf('LOCKED') !== -1;
              return (
                <button
                  key={cand.code}
                  type="button"
                  onClick={() => setSelectedCandidateIndex(idx)}
                  className={
                    'text-[9px] font-mono font-bold py-0.5 rounded border text-center transition-colors cursor-pointer ' +
                    (isSelected
                      ? 'bg-cyan-500/30 border-[#00F0FF] text-white'
                      : isLocked
                      ? 'bg-emerald-950/70 border-emerald-600/50 text-emerald-300'
                      : 'bg-amber-950/70 border-amber-500/60 text-amber-300')
                  }
                >
                  {cand.code}
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-300">
            <span>Active Candidates: {activeCandidatesCount} Candidates</span>
            <span className="text-emerald-300">[D0..D7]</span>
          </div>
        </div>

        {/* Card 4 (TOKEN SCORE) */}
        <div className="bg-slate-900/75 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              TOKEN SCORE
            </span>
            <span className="font-mono text-sm md:text-base font-bold text-white">
              {formatNumberWithCommas(processedTokens)} UNITS
            </span>
          </div>
          <div className="flex items-center justify-between my-0.5">
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-cyan-500/15 text-[#00F0FF] border border-cyan-500/40 rounded">
              +{engineXpK.toFixed(1)}k ENGINE XP
            </span>
            <span className="text-[10px] font-mono text-cyan-300 font-bold">
              EXACT TARGET DIST
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-300 truncate">
            <span>Speculative State: {speculativeState}</span>
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
                'py-1 text-xs font-mono font-bold rounded transition-colors cursor-pointer ' +
                (isCurrent
                  ? 'bg-[#00F0FF] text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70')
              }
            >
              {tab}
            </button>
          );
        })}
      </nav>

      {/* STREAMLINED MESH INFO SUBHEADER */}
      <div className="text-[10px] font-mono whitespace-nowrap overflow-hidden text-slate-300 px-1 py-0.5 bg-slate-950/90 border border-slate-800/80 rounded shrink-0">
        VIEW: {activeTab.toUpperCase()} · PTR: 0x23F8DC0 · MODE: SPECULATIVE_DECODING · CANDIDATES:{' '}
        {activeCandidatesCount} · VEC: {vecString}
      </div>

      {/* MAIN INTERACTIVE BAY: CANDIDATE MATRIX (D0-D7) + TAB CONTEXT */}
      <main className="flex-1 min-h-0 flex flex-col justify-between overflow-hidden my-0.5">
        {/* Contextual Tab Telemetry Strip when in Spec / Veri / Stats / APA */}
        {activeTab === 'Spec' && (
          <div className="px-2 py-1 mb-0.5 bg-slate-900/90 border border-cyan-500/40 rounded flex items-center justify-between text-[11px] font-mono text-cyan-200 shrink-0">
            <span>
              FORMULA: S_spec = M_target(tau_draft) · PARALLEL FORWARD EVALUATION (8 LANES)
            </span>
            <span className="text-[#00F0FF] font-bold">
              CORRIDOR: {corridor.split(' ')[0]}
            </span>
          </div>
        )}

        {activeTab === 'Veri' && (
          <div className="px-2 py-1 mb-0.5 bg-slate-900/90 border border-amber-500/40 rounded flex items-center justify-between text-[11px] font-mono text-amber-200 shrink-0">
            <span>
              ACCEPTANCE GATE: alpha_i = min(1.0, p(t_i) / q(t_i)) · ZERO HOST CPU STALLS
            </span>
            <span className="text-emerald-400 font-bold">
              BARRIER SYNC: {verifyLatencyUs.toFixed(2)} µs
            </span>
          </div>
        )}

        {activeTab === 'Stats' && (
          <div className="px-2 py-1 mb-0.5 bg-slate-900/90 border border-emerald-500/40 rounded flex items-center justify-between text-[11px] font-mono text-emerald-200 shrink-0">
            <span>
              DYNO GATES 01-04: PASS · PYTEST SUITE: 100% GREEN · CLEAN-ROOM MIT PERMISSIVE
            </span>
            <span className="text-white font-bold">
              Processed Tokens: {formatNumberWithCommas(processedTokens)} Units
            </span>
          </div>
        )}

        {activeTab === 'APA' && (
          <div className="p-2 mb-0.5 bg-slate-900/95 border border-amber-500/50 rounded flex flex-col justify-between gap-1.5 shrink-0">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="font-bold text-white">
                CHASSIS: GF-T3-302 · CLUSTER-006 · 100% SOVEREIGN IP TITLE TRANSFER
              </span>
              <span className="text-[#FF9F0A] font-bold">
                Retail Price: 75,000 - 150,000+ Units · Full Engine APA: 35,000 - 65,000 Units
              </span>
            </div>
            <div className="text-[10px] font-mono text-cyan-300">{apaTransferState}</div>
            <div className="flex flex-col gap-2 w-full">
              <button
                type="button"
                onClick={() => {
                  setApaTransferState(
                    'APA TITLE ESCROW INITIALIZED · CHASSIS GF-T3-302 LOCKED FOR TRANSFER'
                  );
                  appendRadioLog(
                    '[00:06.10] 🟢 CREW CHIEF: Sovereign APA Title Transfer packet prepared for GF-T3-302',
                    '[00:06.14] 🟢 TELEMETRY: Clean-room MIT provenance & NIST SP 800-218 SSDF audit verified'
                  );
                }}
                className="w-full py-1 text-xs font-mono font-bold bg-[#FF9F0A] hover:bg-amber-400 text-slate-950 rounded text-center transition-colors cursor-pointer"
              >
                ACQUIRE TITLE (APA)
              </button>
              <button
                type="button"
                onClick={() => {
                  setApaTransferState(
                    'CLUSTER-006 VAULT BUYOUT DOSSIER DISPATCHED · 50-UNIT CARVE-OUT'
                  );
                  appendRadioLog(
                    '[00:06.42] 🟠 CREW CHIEF: Vault buyout inquiry logged for CLUSTER-006 transport package',
                    '[00:06.46] 🟢 TELEMETRY: Zero licensing · 100% sovereign IP assignment confirmed'
                  );
                }}
                className="w-full py-1 text-xs font-mono font-bold bg-slate-800 hover:bg-slate-700 text-[#00F0FF] border border-cyan-500/50 rounded text-center transition-colors cursor-pointer"
              >
                INQUIRE VAULT BUYOUT
              </button>
            </div>
          </div>
        )}

        {/* Interactive Candidate Matrix Bay (D0-D7) */}
        <div
          aria-label="Interactive Candidate Matrix Bay"
          className="grid grid-cols-4 gap-1 p-1 bg-slate-950/80 border border-slate-800/90 rounded-lg flex-1 min-h-0 items-stretch"
        >
          {candidates.map((cand, idx) => {
            const isSelected = idx === selectedCandidateIndex;
            const isRecycled = cand.stateLabel.indexOf('RECYCLED') !== -1;
            return (
              <div
                key={cand.code}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedCandidateIndex(idx)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSelectedCandidateIndex(idx);
                  }
                }}
                className={
                  'px-2 py-1 rounded border flex flex-col justify-between transition-colors cursor-pointer ' +
                  (isSelected
                    ? 'bg-slate-900 border-[#00F0FF] shadow-sm'
                    : isRecycled
                    ? 'bg-slate-900/70 border-amber-500/60 hover:border-amber-400'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-600')
                }
              >
                {/* Line 1 (Title & Hex) */}
                <div className="text-[11px] font-mono font-bold text-white flex justify-between items-center">
                  <span>{cand.title}</span>
                  <span className="text-slate-400">{cand.hex}</span>
                </div>

                {/* Line 2 (Tokens & Acceptance Rate) */}
                <div className="flex justify-between items-center text-[11px] font-mono font-bold text-cyan-300">
                  <span>TOK: {cand.tokensK}K</span>
                  <span>ACCEPT: {cand.acceptPct.toFixed(1)}%</span>
                </div>

                {/* Line 3 (Latency & State) */}
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-[#FF9F0A]">{cand.latencyMs.toFixed(2)}ms</span>
                  <span
                    className={
                      isRecycled ? 'text-amber-300 font-bold' : 'text-emerald-400 font-bold'
                    }
                  >
                    {cand.stateLabel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* COMPACT SPECULATIVE TELEMETRY INSPECTOR STRIP */}
      <div className="text-[11px] font-mono whitespace-nowrap overflow-hidden text-cyan-300 font-bold px-2 py-0.5 bg-black/60 border border-slate-800 rounded my-0.5 shrink-0">
        {selectedCandidate.code} · TOK: {selectedCandidate.tokensK}K · ACCEPT:{' '}
        {selectedCandidate.acceptPct.toFixed(1)}% · SYNC: {selectedCandidate.syncPct}% · PTR{' '}
        {selectedCandidate.hex} · SPEC: {selectedCandidate.specStatus} · LOCKED
      </div>

      {/* TACTICAL LAUNCH CONTROL SWITCHES */}
      <section
        aria-label="Tactical Launch Control Switches"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1"
      >
        <button
          type="button"
          onClick={handleTriggerBurst}
          className="bg-amber-950/50 hover:bg-amber-900/70 text-[#FF9F0A] border border-[#FF9F0A] rounded text-xs font-mono font-bold py-2 px-2 text-center transition-colors cursor-pointer truncate"
        >
          💥 INJECT SPECULATIVE DECODING BURST
        </button>

        <button
          type="button"
          onClick={handleToggleDivergence}
          className="bg-cyan-950/50 hover:bg-cyan-900/70 text-[#00F0FF] border border-[#00F0FF] rounded text-xs font-mono font-bold py-2 px-2 text-center transition-colors cursor-pointer truncate"
        >
          ⚡ TOGGLE DRAFT DIVERGENCE SPIKE
        </button>

        <button
          type="button"
          onClick={handleStepVerification}
          className="bg-emerald-950/50 hover:bg-emerald-900/70 text-emerald-300 border border-emerald-400 rounded text-xs font-mono font-bold py-2 px-2 text-center transition-colors cursor-pointer truncate"
        >
          🚀 STEP ASYNCHRONOUS VERIFICATION PASS
        </button>

        <button
          type="button"
          onClick={handleFlushArenas}
          className="bg-rose-950/50 hover:bg-rose-900/70 text-rose-300 border border-rose-500 rounded text-xs font-mono font-bold py-2 px-2 text-center transition-colors cursor-pointer truncate"
        >
          🔄 FLUSH CANDIDATE ARENAS
        </button>
      </section>

      {/* PIT-WALL RADIO COMMS LOG */}
      <footer
        aria-label="Pit-Wall Radio Comms Log"
        className="h-8 overflow-hidden font-mono text-[9px] px-2 py-0.5 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-normal flex flex-col justify-center"
      >
        <div className="truncate">{radioLogs[0]}</div>
        <div className="truncate">{radioLogs[1]}</div>
      </footer>
    </div>
  );
}
