/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GF-T3-240 — Zero-Copy NCCL Point-to-Point Ring Stream & GPUDirect P2P Cockpit
 * Track 3 Skunkworks Sovereign Compute Engine
 */

import React, { useState } from 'react';
import {
  CORRIDOR_PHYSICS_MAP,
  SUPABASE_POSTGRES_SCHEMA_SQL,
  SYNTHETIC_CORRIDORS,
  SyntheticCorridor,
  createInitialEngineState,
  formatNumberWithCommas,
  transitionEngineState,
  validateGridSyncIngress,
} from './engine/ncclEngine';

type CockpitTab = 'Mesh' | 'NCCL' | 'P2P' | 'Stats' | 'APA';

const COCKPIT_TABS: readonly CockpitTab[] = ['Mesh', 'NCCL', 'P2P', 'Stats', 'APA'];

export default function App() {
  const [engineState, setEngineState] = useState(() => createInitialEngineState());
  const [activeTab, setActiveTab] = useState<CockpitTab>('Mesh');
  const [schemaModalOpen, setSchemaModalOpen] = useState<boolean>(false);
  const [apaModalMode, setApaModalMode] = useState<'ACQUIRE' | 'VAULT' | null>(null);
  const [customAuditInput, setCustomAuditInput] = useState<string>('RING_SYNC_VERIFIED_08');
  const [sanitizerStatus, setSanitizerStatus] = useState<string>(
    'GridSync Zero-Trust Gate: READY (Zod Strict Mode)'
  );

  const selectedStream = engineState.streams[engineState.selectedStreamId];
  const activePhysics = CORRIDOR_PHYSICS_MAP[engineState.corridor];

  const dispatchCommand = (
    commandType:
      | 'INJECT_BURST'
      | 'TOGGLE_STALL'
      | 'STEP_ZERO_COPY'
      | 'FLUSH_QUEUES'
      | 'SELECT_STREAM'
      | 'SWITCH_CORRIDOR'
      | 'RUN_DIAGNOSTIC',
    overrides?: { corridor?: SyntheticCorridor; streamId?: number; customAuditTag?: string }
  ) => {
    const payload = {
      corridor: overrides?.corridor ?? engineState.corridor,
      commandType,
      streamId: overrides?.streamId ?? engineState.selectedStreamId,
      customAuditTag: overrides?.customAuditTag,
    };
    const next = transitionEngineState(engineState, payload);
    setEngineState(next.state);
    if (next.validationError) {
      setSanitizerStatus('BLOCKED: ' + next.validationError);
    } else {
      setSanitizerStatus('VERIFIED: Payload scrubbed & committed (' + commandType + ')');
    }
  };

  const handleCorridorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const chosen = e.target.value as SyntheticCorridor;
    dispatchCommand('SWITCH_CORRIDOR', { corridor: chosen });
  };

  const handleSelectStream = (streamId: number) => {
    dispatchCommand('SELECT_STREAM', { streamId });
  };

  const handleExportAuditJson = () => {
    const reportPayload = {
      asset: engineState.engineId,
      track: engineState.trackBadge,
      corridor: engineState.corridor,
      bandwidth: engineState.formattedBandwidth,
      latency: engineState.formattedLatency,
      activeStreams:
        String(engineState.activeStreamsCount) + '/' + String(engineState.totalStreamsCount),
      processedTokens: engineState.formattedTokens,
      bufferParityPct: String(engineState.bufferParityPct) + '%',
      inspector: engineState.inspectorStripText,
      streams: engineState.streams,
    };
    const blob = new Blob([JSON.stringify(reportPayload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'GF-T3-240-audit-snapshot.json';
    anchor.click();
    URL.revokeObjectURL(url);
    dispatchCommand('RUN_DIAGNOSTIC');
  };

  const handleVerifySanitizer = () => {
    const check = validateGridSyncIngress({
      corridor: engineState.corridor,
      commandType: 'RUN_DIAGNOSTIC',
      streamId: engineState.selectedStreamId,
      customAuditTag: customAuditInput,
    });
    if (!check.valid) {
      setSanitizerStatus('GRIDSYNC REJECTED: ' + (check.error ?? 'Invalid input'));
      dispatchCommand('RUN_DIAGNOSTIC', { customAuditTag: customAuditInput });
    } else {
      setSanitizerStatus('GRIDSYNC PASSED: Clean zero-trust token verified');
      dispatchCommand('RUN_DIAGNOSTIC', { customAuditTag: customAuditInput });
    }
  };

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans">
      {/* TOP COMMAND DECK: ROW 1 & ROW 2 */}
      <header className="w-full shrink-0 border-b border-slate-800/90 pb-1">
        {/* Top Header Row 1 */}
        <div className="flex items-center justify-between gap-1 w-full shrink-0">
          {/* Left: Strict GF-T3-240 Heading + Cyan TRACK 3 Badge */}
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <h1 className="text-sm sm:text-base font-mono font-bold tracking-tight text-white">
              GF-T3-240
            </h1>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40 rounded">
              TRACK 3
            </span>
            <span className="hidden md:inline text-[10px] font-mono text-emerald-400">
              {engineState.linkStallActive ? '⚡ FAULT · RESYNC' : '✓ LOCKED · ZERO-COPY'}
            </span>
          </div>

          {/* Right: Compact Corridor Dropdown + Micro Action Buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <label htmlFor="corridor-select" className="sr-only">
              Synthetic NCCL Corridor
            </label>
            <select
              id="corridor-select"
              aria-label="Synthetic NCCL Corridor"
              value={engineState.corridor}
              onChange={handleCorridorChange}
              className="max-w-[110px] sm:max-w-[190px] text-[10px] font-mono truncate py-0.5 px-1.5 bg-slate-900 text-[#00F0FF] border border-slate-700 rounded focus:outline-none focus:border-[#00F0FF]"
            >
              {SYNTHETIC_CORRIDORS.map((corridorOption) => (
                <option key={corridorOption} value={corridorOption}>
                  {corridorOption}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                setActiveTab('NCCL');
                dispatchCommand('STEP_ZERO_COPY');
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-[#00F0FF] border border-[#00F0FF]/40 rounded transition-colors cursor-pointer"
            >
              [NCCL]
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('P2P');
                dispatchCommand('INJECT_BURST');
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-[#FF9F0A] border border-[#FF9F0A]/40 rounded transition-colors cursor-pointer"
            >
              [P2P]
            </button>
            <button
              type="button"
              onClick={() => dispatchCommand('RUN_DIAGNOSTIC')}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 rounded transition-colors cursor-pointer"
            >
              [Run]
            </button>
            <button
              type="button"
              onClick={() => setSchemaModalOpen((prev) => !prev)}
              className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded transition-colors cursor-pointer"
            >
              [Inspect Schema]
            </button>
            <button
              type="button"
              onClick={() => dispatchCommand('FLUSH_QUEUES')}
              className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-rose-950/60 text-rose-300 border border-rose-500/40 rounded transition-colors cursor-pointer"
            >
              [Reset]
            </button>
          </div>
        </div>

        {/* Top Header Row 2 */}
        <p className="text-xs font-mono text-slate-300 text-center whitespace-nowrap truncate mt-0.5">
          Zero-Copy NCCL P2P · Ring Stream · GPUDirect Direct Memory
        </p>
      </header>

      {/* 4-CARD ARCADE HUD RIBBON (2x2 Grid / 4-col Desktop) */}
      <section
        aria-label="Telemetry HUD Ribbon"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-0.5"
      >
        {/* Card 1: NCCL NITRO */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400">NCCL NITRO</span>
            <span className="text-[10px] font-mono text-[#00F0FF]">
              {String(engineState.bandwidthSaturationPct) + '% SAT'}
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-[#00F0FF] leading-tight">
            {engineState.formattedBandwidth}
          </div>
          <div className="w-full bg-slate-800 h-1 rounded overflow-hidden my-0.5">
            <div
              className="bg-[#00F0FF] h-full transition-transform duration-150 origin-left"
              style={{
                transform:
                  'scaleX(' + String(Math.max(0.05, engineState.bandwidthSaturationPct / 100)) + ')',
              }}
            />
          </div>
          <span className="text-[10px] font-mono text-slate-400 truncate">
            GPUDirect P2P Bandwidth Saturation
          </span>
        </div>

        {/* Card 2: LATENCY STREAK */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400">LATENCY STREAK</span>
            <span className="text-[10px] font-mono font-bold text-[#FF9F0A]">🔥 8 STREAMS</span>
          </div>
          <div className="font-mono text-lg font-bold text-[#FF9F0A] leading-tight">
            {engineState.formattedLatency}
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400">
            <span>CPU STAGING: 0 MB</span>
            <span>{'PARITY: ' + String(engineState.bufferParityPct) + '%'}</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 truncate">
            Async Stream Latency
          </span>
        </div>

        {/* Card 3: ACTIVE STREAMS */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400">ACTIVE STREAMS</span>
            <span className="text-[10px] font-mono font-bold text-emerald-400">
              {engineState.linkStallActive ? '⚡ FAULT' : '✓ LOCKED'}
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-emerald-400 leading-tight">
            {'STREAMS: ' +
              String(engineState.activeStreamsCount) +
              '/' +
              String(engineState.totalStreamsCount)}
          </div>
          {/* F1 Gear Shift Indicator [ST0..ST7] */}
          <div className="grid grid-cols-8 gap-0.5 my-0.5">
            {engineState.streams.map((st) => {
              const isSelected = st.streamId === engineState.selectedStreamId;
              const toneClass = !st.zeroCopyActive
                ? 'bg-rose-500/30 text-rose-300 border-rose-500/60'
                : isSelected
                  ? 'bg-[#00F0FF]/30 text-[#00F0FF] border-[#00F0FF]'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
              return (
                <button
                  key={st.streamCode}
                  type="button"
                  onClick={() => handleSelectStream(st.streamId)}
                  className={
                    'text-[9px] font-mono font-bold py-0.5 rounded border text-center cursor-pointer ' +
                    toneClass
                  }
                >
                  {st.streamCode}
                </button>
              );
            })}
          </div>
          <span className="text-[10px] font-mono text-slate-400 truncate">
            F1 Gear Shift Ring [ST0..ST7]
          </span>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400">TOKEN SCORE</span>
            <span className="text-[10px] font-mono font-bold text-emerald-400">
              {engineState.formattedXp}
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-white leading-tight">
            {engineState.formattedTokens}
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-[#00F0FF]">
            <span>{'PASSES: ' + String(2048 + engineState.stepCount * 8)}</span>
            <span>BAR1 PINNED</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 truncate">
            {engineState.ncclStateLabel}
          </span>
        </div>
      </section>

      {/* 5 HORIZONTAL TABS */}
      <nav
        aria-label="Cockpit Subsystem Tabs"
        className="grid grid-cols-5 gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg my-1 w-full text-center shrink-0"
      >
        {COCKPIT_TABS.map((tab) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={
                'py-0.5 text-xs font-mono font-bold rounded transition-colors cursor-pointer ' +
                (active
                  ? 'bg-[#00F0FF] text-slate-950'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70')
              }
            >
              {tab}
            </button>
          );
        })}
      </nav>

      {/* INTERACTIVE NCCL RING STREAM MATRIX BAY (100% Above-the-Fold Flex-1 Container) */}
      <main className="flex-1 min-h-0 w-full bg-slate-950/90 border border-slate-800 rounded-lg px-2 py-1.5 flex flex-col justify-between overflow-hidden">
        {/* Matrix Bay Top Context Strip */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-0.5 shrink-0">
          <div className="flex items-center gap-2 truncate">
            <span className="text-[11px] font-mono font-bold text-[#00F0FF]">
              {'[' + activeTab.toUpperCase() + ' BAY]'}
            </span>
            <span className="text-[11px] font-mono text-slate-300 truncate">
              {activePhysics.code}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0 text-[10px] font-mono">
            <span className="text-slate-400">{activePhysics.pcieGen}</span>
            <span className="text-amber-300 font-bold">
              {'BRIDGES: ' + String(activePhysics.nvlinkBridges)}
            </span>
          </div>
        </div>

        {/* 8 P2P Ring Streams Grid (Tightened Vertical Padding for Clean Bottom Clearance) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 my-0.5 flex-1 min-h-0 items-stretch">
          {engineState.streams.map((stream) => {
            const isSelected = stream.streamId === engineState.selectedStreamId;
            const isFault = !stream.zeroCopyActive;
            const cardBorder = isFault
              ? 'border-rose-500/80 bg-rose-950/20'
              : isSelected
                ? 'border-[#00F0FF] bg-slate-900/95'
                : 'border-slate-800 bg-slate-900/60 hover:border-slate-700';

            return (
              <button
                key={stream.streamCode}
                type="button"
                onClick={() => handleSelectStream(stream.streamId)}
                className={
                  'border rounded-lg px-2 py-1 text-left flex flex-col justify-between transition-colors cursor-pointer ' +
                  cardBorder
                }
              >
                <div className="flex items-center justify-between gap-1 w-full">
                  <span className="text-xs font-mono font-bold text-white">
                    {stream.label}
                  </span>
                  <span
                    className={
                      'text-[10px] font-mono font-bold ' +
                      (isFault ? 'text-rose-400' : 'text-emerald-400')
                    }
                  >
                    {stream.lockBadge}
                  </span>
                </div>

                <div className="text-[11px] font-mono text-cyan-300 font-semibold">
                  {'P2P · BUFF: ' + String(stream.bufferSizeMb) + ' MB'}
                </div>

                <div className="text-[11px] font-mono text-amber-300 font-bold">
                  {stream.pointerHex + ' · ' + stream.eventState}
                </div>
              </button>
            );
          })}
        </div>

        {/* Dynamic Subsystem Drawer Bar (Mesh / NCCL / P2P / Stats / APA) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded px-2 py-0.5 shrink-0">
          {activeTab === 'Mesh' && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
              <span className="text-slate-200">
                {'PEER DESTINATION: ' +
                  selectedStream.sourceGpu +
                  ' → ' +
                  selectedStream.peerGpu +
                  ' · HANDLE: ' +
                  selectedStream.cudaEventHandle}
              </span>
              <span className="text-[#00F0FF] font-bold">
                {'STREAM RATE: ' +
                  formatNumberWithCommas(selectedStream.transferRateGbs) +
                  ' GB/s · LATENCY: ' +
                  selectedStream.streamLatencyUs.toFixed(2) +
                  ' µs'}
              </span>
              <button
                type="button"
                onClick={handleExportAuditJson}
                className="px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-800 hover:bg-slate-700 text-[#00F0FF] border border-[#00F0FF]/40 rounded cursor-pointer"
              >
                [EXPORT AUDIT]
              </button>
            </div>
          )}

          {activeTab === 'NCCL' && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
              <span className="text-emerald-300">
                {'ASYNC CUDA EVENT SYNC · HANDLE ' +
                  selectedStream.cudaEventHandle +
                  ' · PASSES: ' +
                  String(selectedStream.completedPasses)}
              </span>
              <span className="text-amber-300">
                {'BAR1 RING OFFSET: ' +
                  selectedStream.pointerHex +
                  ' · REALLOCATION BYPASS: VERIFIED'}
              </span>
            </div>
          )}

          {activeTab === 'P2P' && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-300">GRIDSYNC SANITIZER:</span>
                <input
                  type="text"
                  aria-label="GridSync Audit Tag Input"
                  value={customAuditInput}
                  onChange={(e) => setCustomAuditInput(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-[10px] font-mono text-[#00F0FF] w-44"
                />
                <button
                  type="button"
                  onClick={handleVerifySanitizer}
                  className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/50 rounded cursor-pointer"
                >
                  VERIFY GATE
                </button>
              </div>
              <span className="text-[10px] font-mono text-emerald-300 truncate">
                {sanitizerStatus}
              </span>
            </div>
          )}

          {activeTab === 'Stats' && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
              <span className="text-slate-200">
                {'BANDWIDTH BUS: ' +
                  engineState.formattedBandwidth +
                  ' · PARITY: ' +
                  String(engineState.bufferParityPct) +
                  '% · TOKENS: ' +
                  engineState.formattedTokens}
              </span>
              <button
                type="button"
                onClick={() => setSchemaModalOpen(true)}
                className="px-2 py-0.5 text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50 rounded cursor-pointer"
              >
                VIEW POSTGRES RLS SCHEMA
              </button>
            </div>
          )}

          {activeTab === 'APA' && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
              <span className="text-slate-200">
                SOVEREIGN CLEAN-ROOM APA TITLE · 100% MIT / APACHE-2.0 · ZERO COPYLEFT
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setApaModalMode('ACQUIRE')}
                  className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-500 text-slate-950 rounded hover:bg-emerald-400 transition-colors cursor-pointer"
                >
                  ACQUIRE TITLE (APA)
                </button>
                <button
                  type="button"
                  onClick={() => setApaModalMode('VAULT')}
                  className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#FF9F0A] text-slate-950 rounded hover:bg-amber-400 transition-colors cursor-pointer"
                >
                  INQUIRE VAULT BUYOUT
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* COMPACT NCCL TELEMETRY INSPECTOR STRIP */}
      <div
        aria-label="Compact NCCL Telemetry Inspector Strip"
        className="w-full bg-slate-900/95 border border-slate-800 rounded px-2.5 py-0.5 mt-0.5 shrink-0 flex items-center justify-between gap-2"
      >
        <span className="text-xs font-mono font-bold text-cyan-300 truncate">
          {engineState.inspectorStripText}
        </span>
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-mono text-slate-400">
            {'HANDLE: ' + selectedStream.cudaEventHandle}
          </span>
          <button
            type="button"
            onClick={() => setApaModalMode('ACQUIRE')}
            className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 rounded cursor-pointer"
          >
            ACQUIRE TITLE (APA)
          </button>
          <button
            type="button"
            onClick={() => setApaModalMode('VAULT')}
            className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#FF9F0A]/20 text-[#FF9F0A] border border-[#FF9F0A]/50 rounded cursor-pointer"
          >
            INQUIRE VAULT BUYOUT
          </button>
        </div>
      </div>

      {/* TACTICAL LAUNCH CONTROL BUTTONS */}
      <section
        aria-label="Tactical Launch Control Buttons"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1"
      >
        <button
          type="button"
          onClick={() => dispatchCommand('INJECT_BURST')}
          className="border border-[#FF9F0A] bg-[#FF9F0A]/15 hover:bg-[#FF9F0A]/25 text-[#FF9F0A] rounded-lg text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer"
        >
          💥 INJECT P2P BURST
        </button>

        <button
          type="button"
          onClick={() => dispatchCommand('TOGGLE_STALL')}
          className="border border-[#00F0FF] bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 text-[#00F0FF] rounded-lg text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer"
        >
          ⚡ TOGGLE LINK STALL
        </button>

        <button
          type="button"
          onClick={() => dispatchCommand('STEP_ZERO_COPY')}
          className="border border-emerald-500 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 rounded-lg text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer"
        >
          🚀 STEP ZERO-COPY
        </button>

        <button
          type="button"
          onClick={() => dispatchCommand('FLUSH_QUEUES')}
          className="border border-rose-500 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 rounded-lg text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer"
        >
          🔄 FLUSH P2P QUEUES
        </button>
      </section>

      {/* PIT-WALL RADIO LOG */}
      <footer
        aria-label="Pit-Wall Radio Log"
        className="h-14 overflow-hidden font-mono text-[10px] p-2 mb-0.5 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-tight flex flex-col justify-between"
      >
        {engineState.radioLogs.slice(-3).map((entry) => (
          <div key={entry.id} className="truncate whitespace-nowrap">
            {entry.timestamp + ' ' + entry.callsign + ': ' + entry.message}
          </div>
        ))}
      </footer>

      {/* SQL RLS SCHEMA INSPECTOR MODAL */}
      {schemaModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Supabase PostgreSQL RLS Schema Inspector"
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
        >
          <div className="bg-[#05070B] border border-[#00F0FF]/60 rounded-lg max-w-3xl w-full p-4 flex flex-col gap-2 max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-mono font-bold text-[#00F0FF]">
                GF-T3-240 · SUPABASE / POSTGRESQL PARTITIONED RLS SCHEMA
              </span>
              <button
                type="button"
                onClick={() => setSchemaModalOpen(false)}
                className="px-2 py-0.5 text-xs font-mono font-bold bg-slate-800 text-slate-200 rounded cursor-pointer"
              >
                [CLOSE]
              </button>
            </div>
            <pre className="text-[11px] font-mono text-emerald-300 bg-slate-950 p-3 rounded border border-slate-800 overflow-y-auto flex-1 select-all">
              {SUPABASE_POSTGRES_SCHEMA_SQL}
            </pre>
          </div>
        </div>
      )}

      {/* APA COMMERCIAL TITLE TRANSFER MODAL */}
      {apaModalMode !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Institutional APA Title Transfer"
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
        >
          <div className="bg-[#05070B] border border-emerald-500/60 rounded-lg max-w-lg w-full p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-mono font-bold text-emerald-400">
                {apaModalMode === 'ACQUIRE'
                  ? 'ACQUIRE TITLE (APA) — GF-T3-240'
                  : 'INQUIRE VAULT BUYOUT — GF-T3-240'}
              </span>
              <button
                type="button"
                onClick={() => setApaModalMode(null)}
                className="px-2 py-0.5 text-xs font-mono font-bold bg-slate-800 text-slate-200 rounded cursor-pointer"
              >
                [CLOSE]
              </button>
            </div>
            <p className="text-xs font-mono text-slate-300 leading-relaxed">
              Sovereign Clean-Room Asset Purchase Agreement (APA) package ready for institutional
              handover. Includes full React 19 cockpit, FastAPI Zero-Copy P2P engine, Vitest &
              Pytest suites, and partitioned PostgreSQL RLS schema with 100% MIT permissive title.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  handleExportAuditJson();
                  setApaModalMode(null);
                }}
                className="px-3 py-1 text-xs font-mono font-bold bg-emerald-500 text-slate-950 rounded cursor-pointer"
              >
                ACQUIRE TITLE (APA)
              </button>
              <button
                type="button"
                onClick={() => setApaModalMode(null)}
                className="px-3 py-1 text-xs font-mono font-bold bg-[#FF9F0A] text-slate-950 rounded cursor-pointer"
              >
                INQUIRE VAULT BUYOUT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
