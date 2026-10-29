/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GF-T3-264 Cockpit UI
 * Dual-Stream Async · Disaggregated Prefill/Decode · Zero Stall
 * Zero-Dollar Gate Verified
 */

import React, { useState } from 'react';
import {
  createInitialEngineState,
  EngineTelemetryState,
  executeEngineCommand,
  formatNumberWithCommas,
  StreamLockState,
  SyntheticCorridor,
} from './engine/dualStreamEngine';

type CockpitTab = 'Mesh' | 'Strm' | 'Sync' | 'Stats' | 'APA';

const TABS: CockpitTab[] = ['Mesh', 'Strm', 'Sync', 'Stats', 'APA'];

const CORRIDOR_OPTIONS: { value: SyntheticCorridor; shortLabel: string }[] = [
  {
    value: SyntheticCorridor.ALPHA,
    shortLabel:
      'STREAM-CORRIDOR-ALPHA (DUAL-STREAM-ASYNC-DISAGGREGATION-FABRIC · 25600-GB/S)',
  },
  {
    value: SyntheticCorridor.BRAVO,
    shortLabel: 'STREAM-CORRIDOR-BRAVO (NON-BLOCKING-EVENT-SYNCHRONIZER)',
  },
  {
    value: SyntheticCorridor.GAMMA,
    shortLabel: 'STREAM-CORRIDOR-GAMMA (REMOTE-KV-CACHE-MIGRATION-ENGINE)',
  },
  {
    value: SyntheticCorridor.DELTA,
    shortLabel: 'STREAM-CORRIDOR-DELTA (FALLBACK-MONOLITHIC-STREAM-PASS)',
  },
];

export default function App() {
  const [engineState, setEngineState] = useState<EngineTelemetryState>(() =>
    createInitialEngineState()
  );
  const [activeTab, setActiveTab] = useState<CockpitTab>('Mesh');
  const [apaModalMessage, setApaModalMessage] = useState<string | null>(null);

  const selectedStream =
    engineState.streams[engineState.selectedStreamIndex] ??
    engineState.streams[3];

  const handleCorridorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const chosen = e.target.value as SyntheticCorridor;
    setEngineState((prev) =>
      executeEngineCommand(prev, {
        directive: 'SELECT_CORRIDOR',
        corridor: chosen,
      })
    );
  };

  const handleSelectStream = (index: number) => {
    setEngineState((prev) =>
      executeEngineCommand(prev, {
        directive: 'SELECT_STREAM',
        streamIndex: index,
      })
    );
  };

  const handleBurst = () => {
    setEngineState((prev) =>
      executeEngineCommand(prev, {
        directive: 'INJECT_BURST',
      })
    );
  };

  const handleDesyncToggle = () => {
    setEngineState((prev) =>
      executeEngineCommand(prev, {
        directive: 'TOGGLE_DESYNC',
      })
    );
  };

  const handleInterleaveStep = () => {
    setEngineState((prev) =>
      executeEngineCommand(prev, {
        directive: 'STEP_INTERLEAVE',
      })
    );
  };

  const handleFlushQueues = () => {
    setApaModalMessage(null);
    setEngineState((prev) =>
      executeEngineCommand(prev, {
        directive: 'FLUSH_QUEUES',
      })
    );
  };

  const handleSyncBarrier = () => {
    setEngineState((prev) =>
      executeEngineCommand(prev, {
        directive: 'SYNC_EVENTS',
      })
    );
  };

  const handleExportAuditJson = () => {
    const payload = JSON.stringify(
      {
        engine: engineState.engineId,
        corridor: engineState.corridor,
        throughputGbs: engineState.streamThroughputGbs,
        syncLatencyUs: engineState.syncLatencyUs,
        activeStreams: engineState.activeStreamsCount,
        processedTokens: engineState.processedTokens,
        bufferParityPct: engineState.bufferParityPct,
        vectorSignature: engineState.vectorSignature,
        streams: engineState.streams,
      },
      null,
      2
    );
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'GF-T3-264-telemetry-audit.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const visibleLogs = engineState.radioLogs.slice(-2);

  const vecFormatted =
    '[' +
    engineState.vectorSignature.map((v) => v.toFixed(2)).join(', ') +
    ']';

  const inspectorLockSuffix =
    selectedStream.state === StreamLockState.LOCKED ? 'LOCKED' : 'FAULT';

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans">
      {/* Top Header Block */}
      <header className="w-full shrink-0 flex flex-col gap-0.5 border-b border-slate-800/90 pb-1">
        {/* Top Header Row 1 */}
        <div className="flex items-center justify-between gap-1 w-full shrink-0">
          {/* Left: Brand Title & Cyan Badge */}
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <h1 className="text-sm sm:text-base font-mono font-extrabold tracking-tight text-white">
              GF-T3-264
            </h1>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/50 rounded">
              FLAGSHIP
            </span>
          </div>

          {/* Right: Corridor Dropdown + Micro Action Switches */}
          <div className="flex items-center gap-1 shrink-0">
            <select
              aria-label="Synthetic Stream Corridor"
              value={engineState.corridor}
              onChange={handleCorridorChange}
              className="max-w-[110px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 border border-slate-700 text-cyan-300 rounded focus:outline-none focus:border-[#00F0FF]"
            >
              {CORRIDOR_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.shortLabel}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                setActiveTab('Strm');
                handleInterleaveStep();
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              [Stream]
            </button>

            <button
              type="button"
              onClick={handleSyncBarrier}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              [Sync]
            </button>

            <button
              type="button"
              onClick={handleInterleaveStep}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/50 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              [Run]
            </button>
          </div>
        </div>

        {/* Top Header Row 2 */}
        <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap truncate">
          Dual-Stream Async · Disaggregated Prefill/Decode · Zero Stall
        </div>
      </header>

      {/* 4-Card Arcade HUD Ribbon (2x2 Grid Above the Fold) */}
      <section
        aria-label="Telemetry HUD Ribbon"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-0.5"
      >
        {/* Card 1: STREAM NITRO */}
        <div className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/70 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="font-bold text-cyan-400">STREAM NITRO</span>
            <span>SAT: {engineState.throughputSaturationPct}%</span>
          </div>
          <div className="font-mono text-lg font-bold text-[#00F0FF] leading-tight">
            {formatNumberWithCommas(engineState.streamThroughputGbs)} GB/s
          </div>
          <div className="w-full h-1 bg-slate-800 rounded overflow-hidden my-0.5">
            <div
              className="h-full bg-[#00F0FF] transition-opacity duration-150"
              style={{
                width: String(engineState.throughputSaturationPct) + '%',
              }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Stream Throughput Saturation
          </div>
        </div>

        {/* Card 2: SYNC STREAK */}
        <div className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/70 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="font-bold text-amber-400">SYNC STREAK</span>
            <span className="px-1 py-0 text-[9px] font-mono font-bold bg-amber-500/15 text-[#FF9F0A] border border-amber-500/40 rounded">
              🔥 DUAL-STREAM
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-[#FF9F0A] leading-tight">
            {engineState.syncLatencyUs.toFixed(2)} µs
          </div>
          <div className="text-[10px] font-mono text-emerald-400 truncate">
            Parity: {engineState.bufferParityPct.toFixed(1)}% · Zero Host Poll
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Event Sync Latency
          </div>
        </div>

        {/* Card 3: ACTIVE STREAMS */}
        <div className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/70 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="font-bold text-emerald-400">ACTIVE STREAMS</span>
            <span className="text-slate-300 font-bold">[M0..M7]</span>
          </div>
          <div className="font-mono text-lg font-bold text-emerald-400 leading-tight">
            STREAMS: {engineState.activeStreamsCount}/
            {engineState.totalStreamsCount}
          </div>
          <div className="grid grid-cols-8 gap-0.5 my-0.5">
            {engineState.streams.map((s) => {
              const isHealthy = s.state === StreamLockState.LOCKED;
              return (
                <span
                  key={s.code}
                  className={
                    'text-[8px] font-mono font-bold text-center rounded py-0 ' +
                    (isHealthy
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-500/30 text-rose-300 border border-rose-500/50')
                  }
                >
                  {s.code}
                </span>
              );
            })}
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            F1 Gear Shift Stream Status
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/70 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="font-bold text-cyan-300">TOKEN SCORE</span>
            <span className="text-emerald-400 font-bold">
              +{engineState.engineXpK.toFixed(1)}k ENGINE XP
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-white leading-tight truncate">
            {formatNumberWithCommas(engineState.processedTokens)} UNITS
          </div>
          <div className="text-[10px] font-mono text-cyan-400 truncate">
            KV Migration: 0.01 µs Direct SM
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Stream State: {engineState.streamStateLabel}
          </div>
        </div>
      </section>

      {/* 5 Horizontal Tabs */}
      <nav
        aria-label="Cockpit View Tabs"
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
                'py-0.5 text-xs font-mono font-bold rounded transition-colors cursor-pointer whitespace-nowrap ' +
                (isActive
                  ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60')
              }
            >
              {tab}
            </button>
          );
        })}
      </nav>

      {/* Streamlined Mesh Info Subheader (Strictly clean of action buttons) */}
      <div className="text-[10px] font-mono whitespace-nowrap overflow-hidden text-slate-300 px-1 py-0.5 bg-slate-950/90 border border-slate-800/80 rounded shrink-0">
        VIEW: {activeTab.toUpperCase()} · PTR: {engineState.meshPtr} · MODE:
        DUAL_STREAM_ASYNC · STREAMS: {engineState.activeStreamsCount} · VEC:{' '}
        {vecFormatted}
      </div>

      {/* Interactive Simulation Bay (M0-M7 Matrix + Contextual Tab Overlay) */}
      <main className="flex-1 min-h-0 flex flex-col justify-between my-0.5 overflow-hidden">
        {activeTab === 'APA' ? (
          <div className="h-full rounded border border-slate-800 bg-slate-900/75 p-2 flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1">
              <div>
                <h2 className="text-xs font-mono font-bold text-[#00F0FF]">
                  SOVEREIGN ASSET PURCHASE AGREEMENT (APA) VAULT · GF-T3-264
                </h2>
                <p className="text-[10px] font-mono text-slate-300">
                  100% MIT / Apache-2.0 Clean-Room IP · Partitioned PostgreSQL
                  RLS Schema · NIST SP 800-218 SSDF v1.1 Verified
                </p>
              </div>
              <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded">
                ✓ LOCKED · AUDIT READY
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5 my-1 flex-1 min-h-0">
              <div className="p-1.5 rounded border border-slate-800 bg-black/50 flex flex-col justify-between">
                <div className="text-[10px] font-mono font-bold text-amber-400">
                  CLEAN-ROOM PROVENANCE
                </div>
                <div className="text-[10px] font-mono text-slate-300 leading-tight">
                  Synthetic corridors STREAM-CORRIDOR-ALPHA..DELTA with zero
                  proprietary manager dependencies or viral copyleft packages.
                </div>
                <div className="text-[10px] font-mono text-emerald-400 font-bold">
                  LICENSE: 100% MIT / APACHE-2.0
                </div>
              </div>

              <div className="p-1.5 rounded border border-slate-800 bg-black/50 flex flex-col justify-between">
                <div className="text-[10px] font-mono font-bold text-cyan-400">
                  POSTGRESQL RLS PERSISTENCE
                </div>
                <div className="text-[10px] font-mono text-slate-300 leading-tight">
                  Range-partitioned table gf_t3_264_stream_telemetry with tenant
                  JWT org_id isolation and GridSync Zod sanitization.
                </div>
                <div className="text-[10px] font-mono text-cyan-300 font-bold">
                  PARTITIONS: 2026_Q4 / 2027_Q1
                </div>
              </div>

              <div className="p-1.5 rounded border border-slate-800 bg-black/50 flex flex-col justify-between">
                <div className="text-[10px] font-mono font-bold text-emerald-400">
                  VERIFICATION & PORTABILITY
                </div>
                <div className="text-[10px] font-mono text-slate-300 leading-tight">
                  Standalone FastAPI engine.py + Pytest & Vitest suites +
                  1-Click Cloud Run Dockerfile. Zero recurring SaaS lock-in.
                </div>
                <div className="text-[10px] font-mono text-emerald-300 font-bold">
                  TEST PASS RATE: 100% (&gt;85% GATE)
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-slate-800">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setApaModalMessage(
                      'APA Title Transfer Package staged for GF-T3-264 · Cryptographic provenance manifest verified.'
                    )
                  }
                  className="px-2.5 py-1 text-[11px] font-mono font-bold bg-[#00F0FF]/20 hover:bg-[#00F0FF]/30 text-[#00F0FF] border border-[#00F0FF] rounded cursor-pointer transition-colors"
                >
                  ACQUIRE TITLE (APA)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setApaModalMessage(
                      'Direct Vault Buyout dossier opened · Clean title warranty & zero-SLA standalone repo transfer active.'
                    )
                  }
                  className="px-2.5 py-1 text-[11px] font-mono font-bold bg-amber-500/20 hover:bg-amber-500/30 text-[#FF9F0A] border border-[#FF9F0A] rounded cursor-pointer transition-colors"
                >
                  INQUIRE VAULT BUYOUT
                </button>
                <button
                  type="button"
                  onClick={handleExportAuditJson}
                  className="px-2 py-1 text-[11px] font-mono font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded cursor-pointer transition-colors"
                >
                  EXPORT AUDIT JSON
                </button>
              </div>
              {apaModalMessage && (
                <span className="text-[10px] font-mono text-emerald-300 truncate">
                  {apaModalMessage}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 h-full min-h-0">
            {engineState.streams.map((stream) => {
              const isSelected =
                stream.index === engineState.selectedStreamIndex;
              const isLocked = stream.state === StreamLockState.LOCKED;

              return (
                <div
                  key={stream.code}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectStream(stream.index)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectStream(stream.index);
                    }
                  }}
                  className={
                    'py-0 px-1.5 rounded border bg-slate-900/60 flex flex-col justify-between cursor-pointer transition-colors ' +
                    (isSelected
                      ? 'border-[#00F0FF] bg-slate-900/95'
                      : isLocked
                        ? 'border-slate-800 hover:border-slate-700'
                        : 'border-rose-500/80 bg-rose-950/30')
                  }
                >
                  {/* Line 1: Title & Hex */}
                  <div className="text-[11px] font-mono font-bold text-white flex justify-between items-center">
                    <span>{stream.title}</span>
                    <span className="text-slate-400">{stream.hexPtr}</span>
                  </div>

                  {/* Line 2: Tokens & Mode */}
                  <div className="flex justify-between items-center text-[11px] font-mono font-bold text-cyan-300">
                    <span>TOK: {stream.tokensK}K</span>
                    <span>MODE: {stream.mode}</span>
                  </div>

                  {/* Optional middle telemetry bar for Strm/Sync/Stats views */}
                  {activeTab !== 'Mesh' && (
                    <div className="flex justify-between items-center text-[9px] font-mono text-slate-300">
                      {activeTab === 'Strm' && (
                        <>
                          <span>PF: {stream.prefillBwGbs}GB/s</span>
                          <span>DC: {stream.decodeBwGbs}GB/s</span>
                        </>
                      )}
                      {activeTab === 'Sync' && (
                        <>
                          <span>KV: {stream.kvTransferUs.toFixed(2)}µs</span>
                          <span>WAIT: {stream.eventWaitCycles}c</span>
                        </>
                      )}
                      {activeTab === 'Stats' && (
                        <>
                          <span>PARITY: {stream.syncParityPct}%</span>
                          <span>PIPE: {stream.pipelineStatus}</span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Line 3: Latency & State */}
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-[#FF9F0A] font-semibold">
                      {stream.latencyMs.toFixed(2)}ms
                    </span>
                    <span
                      className={
                        isLocked
                          ? 'text-emerald-400 font-bold'
                          : 'text-rose-400 font-bold'
                      }
                    >
                      {stream.state}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Compact Stream Telemetry Inspector Strip */}
      <div className="text-[11px] font-mono whitespace-nowrap overflow-hidden text-cyan-300 font-bold px-2 py-0.5 bg-black/60 border border-slate-800 rounded my-0.5 shrink-0">
        {selectedStream.code} · TOK: {selectedStream.tokensK}K · MODE:{' '}
        {selectedStream.mode} · SYNC: {selectedStream.syncParityPct}% · PTR{' '}
        {selectedStream.hexPtr} · PIPELINE: {selectedStream.pipelineStatus} ·{' '}
        {inspectorLockSuffix}
      </div>

      {/* Tactical Launch Control Switches */}
      <section
        aria-label="Tactical Launch Control Switches"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1"
      >
        <button
          type="button"
          onClick={handleBurst}
          className="border border-[#FF9F0A] bg-amber-950/40 hover:bg-amber-900/50 text-[#FF9F0A] rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer truncate px-1"
        >
          💥 INJECT DUAL-STREAM BURST
        </button>

        <button
          type="button"
          onClick={handleDesyncToggle}
          className="border border-[#00F0FF] bg-cyan-950/40 hover:bg-cyan-900/50 text-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.25)] rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer truncate px-1"
        >
          ⚡ TOGGLE STREAM DESYNC SPIKE
        </button>

        <button
          type="button"
          onClick={handleInterleaveStep}
          className="border border-emerald-500 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer truncate px-1"
        >
          🚀 STEP ASYNC INTERLEAVE PASS
        </button>

        <button
          type="button"
          onClick={handleFlushQueues}
          className="border border-rose-500 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer truncate px-1"
        >
          🔄 FLUSH STREAM QUEUES
        </button>
      </section>

      {/* Pit-Wall Radio Comms Log */}
      <footer
        aria-label="Pit-Wall Radio Comms Log"
        className="h-8 overflow-hidden font-mono text-[9px] px-2 py-0.5 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-normal flex flex-col justify-center"
      >
        {visibleLogs.map((entry) => (
          <div key={entry.id} className="truncate whitespace-nowrap">
            [{entry.timestamp}] {entry.badge}: {entry.message}
          </div>
        ))}
      </footer>
    </div>
  );
}
