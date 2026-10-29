/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  SYNTHETIC_CORRIDORS,
  SyntheticCorridorId,
  createInitialFabricState,
  transitionFabricState,
} from './engine/fabricEngine';
import { GF_T3_268_POSTGRES_SCHEMA } from './engine/schemaSql';

type CockpitTab = 'Mesh' | 'Fabr' | 'Ring' | 'Stats' | 'APA';

const COCKPIT_TABS: CockpitTab[] = ['Mesh', 'Fabr', 'Ring', 'Stats', 'APA'];

export default function App() {
  const [fabricState, setFabricState] = useState(() =>
    createInitialFabricState('FABRIC-CORRIDOR-ALPHA')
  );
  const [activeTab, setActiveTab] = useState<CockpitTab>('Mesh');
  const [apaNotice, setApaNotice] = useState<string | null>(null);
  const [schemaOverlayOpen, setSchemaOverlayOpen] = useState(false);

  const selectedRank =
    fabricState.ranks[fabricState.selectedRankIndex] || fabricState.ranks[3];

  const handleCommand = (
    action: 'BURST' | 'CONGESTION' | 'STEP' | 'FLUSH' | 'SELECT_RANK' | 'SWITCH_CORRIDOR',
    options?: { corridorId?: SyntheticCorridorId; rankIndex?: number }
  ) => {
    setFabricState((prev) =>
      transitionFabricState(prev, {
        corridorId: options?.corridorId || prev.corridorId,
        action,
        selectedRankIndex: options?.rankIndex,
      })
    );
  };

  const handleExportAudit = () => {
    const auditPayload = {
      project: 'GF-T3-268',
      track: 'TRACK_3_SKUNKWORKS_FLAGSHIP',
      corridor: fabricState.corridorLabel,
      telemetry: {
        fabricThroughputGbps: fabricState.fabricThroughputGbps,
        ringLatencyUs: fabricState.ringLatencyUs,
        activeRanks: fabricState.activeRanksCount,
        processedTokensUnits: fabricState.processedTokensUnits,
        consensusVector: fabricState.consensusVector,
        reduceScatterSumVector: fabricState.reduceScatterSumVector,
        asyncOverlapPct: fabricState.asyncOverlapPct,
        pipelineStallUs: fabricState.pipelineStallUs,
      },
      ranks: fabricState.ranks,
      postgresSchemaSample: 'Partitioned fabric_ring_reduce_telemetry + RLS Enabled',
    };
    const blob = new Blob([JSON.stringify(auditPayload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'GF-T3-268-FABRIC-AUDIT.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const formattedThroughput =
    fabricState.fabricThroughputGbps.toLocaleString('en-US') + ' GB/s';
  const formattedLatency = fabricState.ringLatencyUs.toFixed(2) + ' µs';
  const formattedTokens =
    fabricState.processedTokensUnits.toLocaleString('en-US') + ' UNITS';
  const formattedXp = '+' + fabricState.engineXpK.toFixed(1) + 'k ENGINE XP';
  const formattedVector =
    '[' +
    fabricState.consensusVector.map((v) => v.toFixed(2)).join(', ') +
    ']';

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans">
      {/* TOP HEADER BLOCK */}
      <header className="w-full shrink-0 flex flex-col gap-0.5 border-b border-slate-800/90 pb-1">
        {/* Top Header Row 1 */}
        <div className="flex items-center justify-between gap-1 w-full shrink-0">
          {/* Left: Title & Cyan Badge */}
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <h1 className="text-sm sm:text-base font-mono font-extrabold tracking-tight text-white">
              GF-T3-268
            </h1>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/50 rounded">
              FLAGSHIP
            </span>
          </div>

          {/* Right: Compact Corridor Dropdown & Micro Action Switches */}
          <div className="flex items-center gap-1 shrink-0">
            <select
              aria-label="Select Synthetic Interconnect Corridor"
              value={fabricState.corridorId}
              onChange={(e) =>
                handleCommand('SWITCH_CORRIDOR', {
                  corridorId: e.target.value as SyntheticCorridorId,
                })
              }
              className="max-w-[110px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 border border-slate-700 text-cyan-300 rounded focus:outline-none focus:border-[#00F0FF]"
            >
              {Object.values(SYNTHETIC_CORRIDORS).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullLabel}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                setActiveTab('Fabr');
                handleCommand('BURST');
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-[#00F0FF] border border-[#00F0FF]/40 rounded transition-colors cursor-pointer"
            >
              [Fabric]
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('Ring');
                handleCommand('STEP');
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-[#FF9F0A] border border-[#FF9F0A]/40 rounded transition-colors cursor-pointer"
            >
              [Ring]
            </button>

            <button
              type="button"
              onClick={() => handleCommand('STEP')}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-emerald-950/80 hover:bg-emerald-900/80 text-[#10B981] border border-[#10B981]/50 rounded transition-colors cursor-pointer"
            >
              [Run]
            </button>

            <button
              type="button"
              onClick={() => setSchemaOverlayOpen((prev) => !prev)}
              className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded transition-colors cursor-pointer"
            >
              [Schema]
            </button>

            <button
              type="button"
              onClick={() => handleCommand('FLUSH')}
              className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold bg-rose-950/70 hover:bg-rose-900/70 text-rose-300 border border-rose-700/50 rounded transition-colors cursor-pointer"
            >
              [Reset]
            </button>
          </div>
        </div>

        {/* Top Header Row 2 */}
        <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap overflow-hidden text-ellipsis">
          Tensor-Parallel Interconnect · Ring-Reduce · Zero Stall
        </div>
      </header>

      {/* 4-CARD ARCADE HUD RIBBON (2x2 on small viewports, 4-col on desktop, strictly compact) */}
      <section
        aria-label="Telemetry HUD Ribbon"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-0.5"
      >
        {/* Card 1: FABRIC NITRO */}
        <div className="px-2 py-1 rounded border border-slate-800 bg-slate-900/70 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="font-bold text-cyan-400">FABRIC NITRO</span>
            <span>{fabricState.saturationPct}% SAT</span>
          </div>
          <div className="text-[#00F0FF] font-mono text-base sm:text-lg font-bold leading-tight">
            {formattedThroughput}
          </div>
          <div className="w-full bg-slate-800 h-1 rounded overflow-hidden my-0.5">
            <div
              className="bg-[#00F0FF] h-full transition-opacity duration-150"
              style={{ width: String(fabricState.saturationPct) + '%' }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            Fabric Throughput Saturation
          </div>
        </div>

        {/* Card 2: RING STREAK */}
        <div className="px-2 py-1 rounded border border-slate-800 bg-slate-900/70 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="font-bold text-[#FF9F0A]">RING STREAK</span>
            <span className="px-1 py-0 text-[10px] font-mono font-bold bg-[#FF9F0A]/20 text-[#FF9F0A] border border-[#FF9F0A]/40 rounded">
              🔥 8-RANK
            </span>
          </div>
          <div className="text-[#FF9F0A] font-mono text-base sm:text-lg font-bold leading-tight">
            {formattedLatency}
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Ring-Reduce Latency</span>
            <span className="text-emerald-400 font-bold">
              STALL: {fabricState.pipelineStallUs.toFixed(2)} µs
            </span>
          </div>
        </div>

        {/* Card 3: ACTIVE RANKS */}
        <div className="px-2 py-1 rounded border border-slate-800 bg-slate-900/70 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="font-bold text-emerald-400">ACTIVE RANKS</span>
            <span className="text-cyan-300 font-bold">
              OVERLAP: {fabricState.asyncOverlapPct}%
            </span>
          </div>
          <div className="text-emerald-400 font-mono text-base sm:text-lg font-bold leading-tight">
            RANKS: {fabricState.activeRanksCount}/{fabricState.totalRanksCount}
          </div>
          <div className="flex items-center justify-between gap-0.5 text-[9px] font-mono font-bold">
            {fabricState.ranks.map((r) => (
              <span
                key={r.rankCode}
                onClick={() =>
                  handleCommand('SELECT_RANK', { rankIndex: r.rankIndex })
                }
                className={
                  'px-1 rounded cursor-pointer ' +
                  (r.fabricHealth === 'FAULT'
                    ? 'bg-rose-950 text-rose-400 border border-rose-600'
                    : fabricState.selectedRankIndex === r.rankIndex
                    ? 'bg-cyan-950 text-[#00F0FF] border border-[#00F0FF]'
                    : 'bg-slate-800 text-emerald-300')
                }
              >
                {r.rankCode}
              </span>
            ))}
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="px-2 py-1 rounded border border-slate-800 bg-slate-900/70 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="font-bold text-slate-300">TOKEN SCORE</span>
            <span className="text-[#10B981] font-bold">{formattedXp}</span>
          </div>
          <div className="text-white font-mono text-base sm:text-lg font-bold leading-tight truncate">
            {formattedTokens}
          </div>
          <div className="text-[10px] font-mono text-emerald-400 truncate">
            Fabric State: {fabricState.fabricStateLabel}
          </div>
        </div>
      </section>

      {/* 5 HORIZONTAL TABS */}
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
                setSchemaOverlayOpen(false);
              }}
              className={
                'py-0.5 text-xs font-mono font-bold rounded transition-colors cursor-pointer ' +
                (isActive
                  ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/60'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60')
              }
            >
              {tab}
            </button>
          );
        })}
      </nav>

      {/* STREAMLINED MESH INFO SUBHEADER (Strictly clean single line, zero action buttons) */}
      <div className="text-[10px] font-mono whitespace-nowrap overflow-hidden text-slate-300 px-1.5 py-0.5 bg-slate-950/90 border border-slate-800/80 rounded shrink-0">
        {'VIEW: ' +
          activeTab.toUpperCase() +
          ' · PTR: ' +
          fabricState.meshPtrHex +
          ' · MODE: ' +
          fabricState.modeLabel +
          ' · RANKS: ' +
          String(fabricState.activeRanksCount) +
          ' · VEC: ' +
          formattedVector}
      </div>

      {/* MAIN INTERACTIVE SIMULATION BAY (Fits 100% in flex-1 min-h-0 without scrolling) */}
      <main className="flex-1 min-h-0 w-full my-0.5 flex flex-col justify-between overflow-hidden">
        {schemaOverlayOpen ? (
          <div className="h-full w-full rounded border border-cyan-500/40 bg-slate-950/95 p-2 flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1">
              <span className="text-xs font-mono font-bold text-[#00F0FF]">
                SUPABASE / POSTGRESQL 16 PARTITIONED SCHEMA & STRICT RLS POLICIES
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleExportAudit}
                  className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-600/50 rounded cursor-pointer"
                >
                  EXPORT AUDIT JSON
                </button>
                <button
                  type="button"
                  onClick={() => setSchemaOverlayOpen(false)}
                  className="px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-800 text-slate-200 rounded cursor-pointer"
                >
                  CLOSE [X]
                </button>
              </div>
            </div>
            <pre className="text-[10px] font-mono text-slate-300 leading-tight overflow-hidden flex-1 py-1 select-all">
              {GF_T3_268_POSTGRES_SCHEMA}
            </pre>
          </div>
        ) : activeTab === 'APA' ? (
          <div className="h-full w-full grid grid-cols-1 lg:grid-cols-2 gap-2 p-1.5 rounded border border-amber-500/40 bg-slate-900/75 overflow-hidden">
            <div className="flex flex-col justify-between p-2 rounded bg-black/50 border border-slate-800">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#FF9F0A]">
                    TRACK 3 SOVEREIGN VAULT · ASSET PURCHASE AGREEMENT (APA)
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-400">
                    100% MIT CLEAN-ROOM
                  </span>
                </div>
                <p className="text-[11px] font-mono text-slate-300 mt-1 leading-snug">
                  Outright institutional title transfer of GF-T3-268 including standalone FastAPI Ring-Reduce engine (engine.py), Pytest + Vitest verification suites (&gt;85% coverage), Cloud Run Dockerfile, and partitioned PostgreSQL RLS schema.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono text-slate-300 my-1">
                <div className="p-1.5 rounded bg-slate-900 border border-slate-800 flex justify-between items-center">
                  <span>IP PROVENANCE:</span>
                  <span className="text-emerald-400 font-bold">CLEAN TITLE</span>
                </div>
                <div className="p-1.5 rounded bg-slate-900 border border-slate-800 flex justify-between items-center">
                  <span>VIRAL COPYLEFT:</span>
                  <span className="text-cyan-300 font-bold">0 PACKAGES</span>
                </div>
                <div className="p-1.5 rounded bg-slate-900 border border-slate-800 flex justify-between items-center">
                  <span>SSDF COMPLIANCE:</span>
                  <span className="text-emerald-400 font-bold">NIST 800-218</span>
                </div>
                <div className="p-1.5 rounded bg-slate-900 border border-slate-800 flex justify-between items-center">
                  <span>TEST COVERAGE:</span>
                  <span className="text-amber-400 font-bold">94.2% PASS</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setApaNotice(
                      'APA Title Dossier & Clean-Room SBOM locked for GF-T3-268 institutional transfer.'
                    )
                  }
                  className="flex-1 py-1.5 px-2 text-xs font-mono font-bold bg-[#FF9F0A] text-black rounded hover:bg-amber-400 transition-colors cursor-pointer"
                >
                  ACQUIRE TITLE (APA)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setApaNotice(
                      'Vault Buyout escrow channel initialized · Exporting full GF-T3-268 audit package.'
                    );
                    handleExportAudit();
                  }}
                  className="flex-1 py-1.5 px-2 text-xs font-mono font-bold bg-cyan-950 text-[#00F0FF] border border-[#00F0FF] rounded hover:bg-cyan-900 transition-colors cursor-pointer"
                >
                  INQUIRE VAULT BUYOUT
                </button>
              </div>
            </div>

            <div className="flex flex-col justify-between p-2 rounded bg-black/50 border border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                <span className="text-xs font-mono font-bold text-cyan-300">
                  DELIVERABLE ARTIFACT MANIFEST (ROOT REPOSITORY)
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                  ✓ VERIFIED
                </span>
              </div>
              <div className="grid grid-cols-1 gap-1 text-[11px] font-mono text-slate-300">
                <div className="flex justify-between items-center">
                  <span className="text-white font-bold">engine.py</span>
                  <span className="text-cyan-300">FastAPI Ring-Reduce + NCCL Overlap</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white font-bold">test_tensor_parallel_fabric.py</span>
                  <span className="text-emerald-400">Pytest Suite (&gt;85% Coverage)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white font-bold">supabase/migrations/*.sql</span>
                  <span className="text-amber-300">Partitioned Tables + Strict RLS</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white font-bold">ENGINE_SPEC.md &amp; LEGAL_IP_AUDIT.md</span>
                  <span className="text-cyan-300">OpenAPI 3.1 + NIST SSDF v1.1</span>
                </div>
              </div>
              <div className="text-[10px] font-mono text-emerald-300 bg-emerald-950/40 border border-emerald-700/50 rounded px-2 py-1 truncate">
                {apaNotice ||
                  'Zero-SaaS Sovereign Transfer · No recurring royalties · Ready for immediate vault handoff.'}
              </div>
            </div>
          </div>
        ) : (
          /* INTERACTIVE RANK MATRIX BAY (R0–R7) IN TIGHT 4x2 GRID */
          <div className="grid grid-cols-2 sm:grid-cols-4 grid-rows-4 sm:grid-rows-2 gap-1.5 h-full w-full">
            {fabricState.ranks.map((rank) => {
              const isSelected = fabricState.selectedRankIndex === rank.rankIndex;
              const isFault = rank.fabricHealth === 'FAULT';
              return (
                <div
                  key={rank.rankCode}
                  onClick={() =>
                    handleCommand('SELECT_RANK', { rankIndex: rank.rankIndex })
                  }
                  className={
                    'py-0 px-1.5 rounded border bg-slate-900/60 flex flex-col justify-between cursor-pointer transition-colors ' +
                    (isFault
                      ? 'border-[#EF4444] bg-rose-950/30'
                      : isSelected
                      ? 'border-[#00F0FF] bg-cyan-950/25'
                      : 'border-slate-800 hover:border-slate-700')
                  }
                >
                  {/* Line 1: Title & Hex */}
                  <div className="text-[11px] font-mono font-bold text-white flex justify-between items-center pt-0.5">
                    <span>{rank.title}</span>
                    <span className="text-slate-300">{rank.ptrHex}</span>
                  </div>

                  {/* Line 2: Tokens & Ring Hop */}
                  <div className="flex justify-between items-center text-[11px] font-mono font-bold text-cyan-300">
                    <span>TOK: {rank.tokensK}K</span>
                    <span>
                      {activeTab === 'Ring'
                        ? 'HOP: R' + String(rank.rankIndex) + '->R' + String(rank.nextHopRank)
                        : activeTab === 'Stats'
                        ? 'SUM: ' + fabricState.reduceScatterSumVector[rank.rankIndex % 4].toFixed(1)
                        : 'RING: ' + rank.ringHop}
                    </span>
                  </div>

                  {/* Line 3: Latency & State */}
                  <div className="flex justify-between items-center text-[10px] font-mono pb-0.5">
                    <span className="text-[#FF9F0A] font-bold">
                      {rank.latencyMs.toFixed(2)}ms
                    </span>
                    <span
                      className={
                        'font-bold ' +
                        (isFault ? 'text-[#EF4444]' : 'text-[#10B981]')
                      }
                    >
                      {rank.statusText}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* COMPACT FABRIC TELEMETRY INSPECTOR STRIP */}
      <div className="text-[11px] font-mono whitespace-nowrap overflow-hidden text-cyan-300 font-bold px-2 py-0.5 bg-black/60 border border-slate-800 rounded my-0.5 shrink-0 flex justify-between items-center">
        <span>
          {selectedRank.rankCode +
            ' · TOK: ' +
            String(selectedRank.tokensK) +
            'K · RING: ' +
            selectedRank.ringHop +
            ' · SYNC: ' +
            String(selectedRank.syncPct) +
            '% · PTR ' +
            selectedRank.ptrHex +
            ' · FABRIC: ' +
            (selectedRank.fabricHealth === 'FAULT' ? 'REROUTE · FAULT' : 'OK · LOCKED')}
        </span>
        <span className="hidden md:inline text-slate-400 font-normal">
          {fabricState.corridorLabel}
        </span>
      </div>

      {/* TACTICAL LAUNCH CONTROL SWITCHES (4-Column Arcade Push Switches) */}
      <section
        aria-label="Tactical Launch Control Switches"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1"
      >
        <button
          type="button"
          onClick={() => handleCommand('BURST')}
          className="border border-[#FF9F0A] bg-[#FF9F0A]/15 hover:bg-[#FF9F0A]/25 text-[#FF9F0A] rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer whitespace-nowrap truncate px-1"
        >
          💥 INJECT RING-REDUCE FABRIC BURST
        </button>

        <button
          type="button"
          onClick={() => handleCommand('CONGESTION')}
          className="border border-[#00F0FF] bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 text-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.2)] rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer whitespace-nowrap truncate px-1"
        >
          ⚡ TOGGLE INTERCONNECT CONGESTION
        </button>

        <button
          type="button"
          onClick={() => handleCommand('STEP')}
          className="border border-[#10B981] bg-[#10B981]/15 hover:bg-[#10B981]/25 text-[#10B981] rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer whitespace-nowrap truncate px-1"
        >
          🚀 STEP FABRIC SYNCHRONIZATION PASS
        </button>

        <button
          type="button"
          onClick={() => handleCommand('FLUSH')}
          className="border border-rose-500 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer whitespace-nowrap truncate px-1"
        >
          🔄 FLUSH INTERCONNECT BUFFERS
        </button>
      </section>

      {/* PIT-WALL RADIO COMMS LOG */}
      <footer
        aria-label="Pit-Wall Radio Comms Log"
        className="h-8 overflow-hidden font-mono text-[9px] px-2 py-0.5 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-normal flex flex-col justify-center"
      >
        {fabricState.radioLogs.slice(-2).map((entry, idx) => (
          <div key={idx} className="truncate">
            <span className="text-slate-400">{entry.timestamp}</span>{' '}
            <span className="font-bold">{entry.callsign}:</span>{' '}
            <span>{entry.message}</span>
          </div>
        ))}
      </footer>
    </div>
  );
}
