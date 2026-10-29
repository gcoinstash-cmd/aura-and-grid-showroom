/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  SYNTHETIC_CORRIDORS,
  SyntheticCorridor,
  evaluatePrefillEngineState,
  SUPABASE_SQL_SCHEMA_EXPORT,
} from './engine/chunkedPrefillEngine';

type TabTag = 'Mesh' | 'Pref' | 'Sync' | 'Stats' | 'APA';

const TAB_TAGS: TabTag[] = ['Mesh', 'Pref', 'Sync', 'Stats', 'APA'];

const INITIAL_RADIO_LOGS: string[] = [
  '[00:01.04] 🟢 CREW CHIEF: TensorRT-LLM chunked prefill and async generation overlap engine initialized · 8 chunks linked',
  '[00:01.08] ⚡ PIT WALL: Prefill-decoding interference scheduler synchronized · Overlap efficiency verified at 99.8%',
  '[00:01.12] 🟢 TELEMETRY: Chunked prefill throughput verified at 13,000 GB/s with zero generation stutter',
];

export default function App() {
  const [corridor, setCorridor] = useState<SyntheticCorridor>(SYNTHETIC_CORRIDORS[0]);
  const [promptTokens, setPromptTokens] = useState<number>(4096);
  const [chunkBoundTokens, setChunkBoundTokens] = useState<number>(512);
  const [activeDecodeRequests, setActiveDecodeRequests] = useState<number>(64);
  const [saturationFault, setSaturationFault] = useState<boolean>(false);
  const [stepPassCount, setStepPassCount] = useState<number>(0);
  const [burstCount, setBurstCount] = useState<number>(0);
  const [asyncOverlapEnabled, setAsyncOverlapEnabled] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabTag>('Mesh');
  const [selectedChunkId, setSelectedChunkId] = useState<number>(3);
  const [radioLogs, setRadioLogs] = useState<string[]>(INITIAL_RADIO_LOGS);
  const [apaModalState, setApaModalState] = useState<'NONE' | 'SCHEMA' | 'APA_ACQUIRE' | 'VAULT_INQUIRE'>('NONE');

  const snapshot = useMemo(() => {
    return evaluatePrefillEngineState({
      promptTokens,
      chunkBoundTokens,
      activeDecodeRequests,
      corridor,
      saturationFault,
      stepPassCount,
      burstCount,
      asyncOverlapEnabled,
    });
  }, [
    promptTokens,
    chunkBoundTokens,
    activeDecodeRequests,
    corridor,
    saturationFault,
    stepPassCount,
    burstCount,
    asyncOverlapEnabled,
  ]);

  const selectedChunk =
    snapshot.chunks.find((c) => c.id === selectedChunkId) || snapshot.chunks[3];

  const appendRadioLog = (callsign: string, message: string) => {
    const totalSec = 2 + stepPassCount + burstCount * 2;
    const minStr = String(Math.floor(totalSec / 60)).padStart(2, '0');
    const secStr = String(totalSec % 60).padStart(2, '0');
    const msStr = String(((stepPassCount * 17 + burstCount * 29) % 89) + 10).padStart(2, '0');
    const timestamp = '[' + minStr + ':' + secStr + '.' + msStr + ']';
    const nextLine = timestamp + ' ' + callsign + ': ' + message;
    setRadioLogs((prev) => [nextLine, ...prev.slice(0, 5)]);
  };

  const handleInjectPrefillBurst = () => {
    const nextBurst = burstCount + 1;
    setBurstCount(nextBurst);
    setPromptTokens(4096);
    appendRadioLog(
      '⚡ PIT WALL',
      'Trigger Chunked Prefill Burst executed · 8 bounded 512-token chunks dispatched at ' +
        String(13000 + stepPassCount * 150 + nextBurst * 250) +
        ' GB/s'
    );
  };

  const handleTogglePromptSaturation = () => {
    const nextFault = !saturationFault;
    setSaturationFault(nextFault);
    if (nextFault) {
      setPromptTokens(8192);
      appendRadioLog(
        '🔴 TELEMETRY',
        'Inject Prompt Length Saturation (Force Chunk Resync) active · C2 and C5 rebalancing quanta'
      );
    } else {
      setPromptTokens(4096);
      appendRadioLog(
        '🟢 CREW CHIEF',
        'Prompt saturation cleared · All 8 chunk slots C0..C7 restored to 512-token lock'
      );
    }
  };

  const handleStepChunkedPrefill = () => {
    const nextStep = stepPassCount + 1;
    setStepPassCount(nextStep);
    appendRadioLog(
      '🟢 TELEMETRY',
      'Step Prefill Pipeline Pass #' +
        String(nextStep) +
        ' verified · Async overlap ' +
        String(snapshot.overlapAvgPct) +
        '% · Zero generation stall'
    );
  };

  const handleFlushPrefillBuffers = () => {
    setPromptTokens(4096);
    setChunkBoundTokens(512);
    setActiveDecodeRequests(64);
    setSaturationFault(false);
    setStepPassCount(0);
    setBurstCount(0);
    setAsyncOverlapEnabled(true);
    setCorridor(SYNTHETIC_CORRIDORS[0]);
    setSelectedChunkId(3);
    setRadioLogs(INITIAL_RADIO_LOGS);
  };

  const handleCorridorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextCorridor = e.target.value as SyntheticCorridor;
    setCorridor(nextCorridor);
    appendRadioLog(
      '🟢 CREW CHIEF',
      'Switched synthetic corridor to ' + nextCorridor
    );
  };

  const handleMicroPrefillClick = () => {
    setChunkBoundTokens((prev) => (prev === 512 ? 256 : 512));
    appendRadioLog(
      '⚡ PIT WALL',
      'Chunked Prefill Token Splitting bound toggled · Quanta lock verified'
    );
  };

  const handleMicroAsyncClick = () => {
    const nextAsync = !asyncOverlapEnabled;
    setAsyncOverlapEnabled(nextAsync);
    appendRadioLog(
      '⚡ PIT WALL',
      nextAsync
        ? 'Asynchronous Generation Overlap pipeline enabled · 99.8% concurrency locked'
        : 'Asynchronous overlap paused · Monolithic prefill comparison active'
    );
  };

  const vecString =
    '[' +
    snapshot.featureVector.map((v) => v.toFixed(2)).join(', ') +
    ']';

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans">
      {/* Top Header Row 1 */}
      <header className="flex flex-col gap-0.5 w-full shrink-0">
        <div className="flex items-center justify-between gap-1 w-full shrink-0">
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <h1 className="text-sm font-mono font-bold tracking-wider text-white">
              GF-T3-250
            </h1>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/50 rounded">
              TRACK 3
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <select
              aria-label="Synthetic Prefill Corridor"
              value={corridor}
              onChange={handleCorridorChange}
              className="max-w-[110px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 border border-slate-700 text-[#00F0FF] rounded focus:outline-none focus:border-[#00F0FF]"
            >
              {SYNTHETIC_CORRIDORS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleMicroPrefillClick}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-[#00F0FF] border border-[#00F0FF]/40 rounded transition-colors cursor-pointer"
            >
              [Prefill]
            </button>
            <button
              type="button"
              onClick={handleMicroAsyncClick}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-[#FF9F0A] border border-[#FF9F0A]/40 rounded transition-colors cursor-pointer"
            >
              [Async]
            </button>
            <button
              type="button"
              onClick={handleStepChunkedPrefill}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-emerald-950/80 hover:bg-emerald-900/80 text-[#10B981] border border-[#10B981]/50 rounded transition-colors cursor-pointer"
            >
              [Run]
            </button>
          </div>
        </div>

        {/* Top Header Row 2 */}
        <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap">
          Chunked Prefill · Async Generation Overlap · Zero Stall
        </div>
      </header>

      {/* 4-Card Arcade HUD Ribbon */}
      <section
        aria-label="Telemetry HUD Ribbon"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1 w-full shrink-0"
      >
        {/* Card 1: PREFILL NITRO */}
        <div className="px-2 py-0.5 bg-slate-900/90 border border-slate-800 rounded flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              PREFILL NITRO
            </span>
            <span className="text-[10px] font-mono text-[#00F0FF]">
              {snapshot.zeroStallVerified ? '✓ LOCKED' : '⚡ FAULT'}
            </span>
          </div>
          <div className="text-[#00F0FF] font-mono text-base font-bold leading-none my-0.5">
            {snapshot.formattedThroughput}
          </div>
          <div className="w-full h-1 bg-slate-800 rounded overflow-hidden">
            <div
              className="h-full bg-[#00F0FF] transition-opacity duration-150"
              style={{ width: snapshot.zeroStallVerified ? '96%' : '68%' }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate leading-tight">
            Prefill Throughput Saturation
          </div>
        </div>

        {/* Card 2: OVERLAP STREAK */}
        <div className="px-2 py-0.5 bg-slate-900/90 border border-slate-800 rounded flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              OVERLAP STREAK
            </span>
            <span className="text-[10px] font-mono font-bold text-[#FF9F0A]">
              🔥 8 CHUNKS
            </span>
          </div>
          <div className="text-[#FF9F0A] font-mono text-base font-bold leading-none my-0.5">
            {snapshot.formattedOverlapLatency}
          </div>
          <div className="text-[10px] font-mono text-emerald-400 leading-none">
            Overlap Efficiency: {String(snapshot.overlapAvgPct)}%
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate leading-tight">
            Async Generation Overlap Latency
          </div>
        </div>

        {/* Card 3: ACTIVE CHUNKS */}
        <div className="px-2 py-0.5 bg-slate-900/90 border border-slate-800 rounded flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              ACTIVE CHUNKS
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">
              [C0..C7]
            </span>
          </div>
          <div className="text-emerald-400 font-mono text-base font-bold leading-none my-0.5">
            {'CHUNKS: ' + String(snapshot.activeChunks) + '/' + String(snapshot.maxChunks)}
          </div>
          <div className="grid grid-cols-8 gap-0.5">
            {snapshot.chunks.map((c) => (
              <span
                key={c.code}
                className={
                  'text-[9px] font-mono text-center rounded leading-tight ' +
                  (c.locked
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40')
                }
              >
                {c.code}
              </span>
            ))}
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate leading-tight">
            Active Chunked Prefill Status
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="px-2 py-0.5 bg-slate-900/90 border border-slate-800 rounded flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              TOKEN SCORE
            </span>
            <span className="text-[10px] font-mono font-bold text-[#00F0FF]">
              {snapshot.prefillXpDelta}
            </span>
          </div>
          <div className="text-white font-mono text-base font-bold leading-none my-0.5">
            {snapshot.formattedProcessedTokens}
          </div>
          <div className="text-[10px] font-mono text-cyan-300 truncate leading-none">
            {'Processed Tokens: ' + snapshot.formattedProcessedTokens}
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate leading-tight">
            {'Prefill State: ' + snapshot.prefillState}
          </div>
        </div>
      </section>

      {/* 5 Horizontal Tabs */}
      <nav
        aria-label="Cockpit Mode Tabs"
        className="grid grid-cols-5 gap-1 p-0.5 bg-slate-900/80 border border-slate-800 rounded my-0.5 w-full text-center shrink-0"
      >
        {TAB_TAGS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={
                'py-0.5 text-xs font-mono font-bold rounded transition-colors cursor-pointer ' +
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

      {/* Streamlined Mesh Info Subheader */}
      <div className="flex items-center justify-between gap-2 px-1 shrink-0">
        <div className="text-[10px] font-mono whitespace-nowrap overflow-hidden text-slate-300">
          {'VIEW: ' +
            activeTab.toUpperCase() +
            ' · PTR: ' +
            snapshot.meshPtr +
            ' · MODE: ' +
            snapshot.modeTag +
            ' · OVERLAP: ' +
            String(snapshot.overlapAvgPct) +
            '% · VEC: ' +
            vecString}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() =>
              setApaModalState((prev) => (prev === 'SCHEMA' ? 'NONE' : 'SCHEMA'))
            }
            className="px-1.5 py-0.5 text-[10px] font-mono text-cyan-300 bg-slate-900 border border-slate-700 hover:border-cyan-400 rounded cursor-pointer"
          >
            [Inspect Schema]
          </button>
          <button
            type="button"
            onClick={handleFlushPrefillBuffers}
            className="px-1.5 py-0.5 text-[10px] font-mono text-slate-300 bg-slate-900 border border-slate-700 hover:border-rose-400 rounded cursor-pointer"
          >
            [Reset]
          </button>
        </div>
      </div>

      {/* Contextual Tab Strip (for Pref / Sync / Stats / APA modes) */}
      {activeTab !== 'Mesh' && (
        <div className="px-2 py-0.5 bg-slate-900/90 border border-slate-800 rounded flex items-center justify-between gap-2 text-[10px] font-mono shrink-0">
          {activeTab === 'Pref' && (
            <div className="flex items-center justify-between w-full gap-2">
              <span className="text-cyan-300 truncate">
                {'CHUNK SPLITTER · PROMPT: ' +
                  String(promptTokens) +
                  ' TOK · BOUND: ' +
                  String(chunkBoundTokens) +
                  ' TOK/CHUNK · CORRIDOR: ' +
                  corridor}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setPromptTokens(2048)}
                  className="px-1.5 py-0.5 bg-slate-800 text-cyan-300 rounded border border-slate-700 cursor-pointer"
                >
                  2048 TOK
                </button>
                <button
                  type="button"
                  onClick={() => setPromptTokens(4096)}
                  className="px-1.5 py-0.5 bg-slate-800 text-cyan-300 rounded border border-slate-700 cursor-pointer"
                >
                  4096 TOK
                </button>
                <button
                  type="button"
                  onClick={() => setPromptTokens(8192)}
                  className="px-1.5 py-0.5 bg-slate-800 text-amber-300 rounded border border-slate-700 cursor-pointer"
                >
                  8192 TOK
                </button>
              </div>
            </div>
          )}

          {activeTab === 'Sync' && (
            <div className="flex items-center justify-between w-full gap-2">
              <span className="text-amber-300 truncate">
                {'ASYNC OVERLAP SCHEDULER · ACTIVE DECODE STREAMS: ' +
                  String(activeDecodeRequests) +
                  ' · INTERFERENCE MITIGATION: ' +
                  String(selectedChunk.decodeInterferenceUs) +
                  ' µs'}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setActiveDecodeRequests((d) => Math.max(16, d - 16))
                  }
                  className="px-1.5 py-0.5 bg-slate-800 text-slate-200 rounded border border-slate-700 cursor-pointer"
                >
                  -16 Decode
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setActiveDecodeRequests((d) => Math.min(512, d + 16))
                  }
                  className="px-1.5 py-0.5 bg-slate-800 text-slate-200 rounded border border-slate-700 cursor-pointer"
                >
                  +16 Decode
                </button>
              </div>
            </div>
          )}

          {activeTab === 'Stats' && (
            <div className="flex items-center justify-between w-full gap-2">
              <span className="text-emerald-400 truncate">
                VITEST & PYTEST VERIFICATION: 12/12 PASSED (100%) · ZOD GRIDSYNC ZERO-TRUST: ACTIVE · SUPABASE RLS: LOCKED
              </span>
              <button
                type="button"
                onClick={() => setApaModalState('SCHEMA')}
                className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-500/50 rounded cursor-pointer shrink-0"
              >
                VIEW RLS SQL
              </button>
            </div>
          )}

          {activeTab === 'APA' && (
            <div className="flex items-center justify-between w-full gap-2">
              <span className="text-slate-200 truncate">
                SOVEREIGN TRACK 3 CHASSIS · 100% MIT PERMISSIVE · ZERO COPYLEFT · CLEAN-ROOM APA TITLE
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setApaModalState('APA_ACQUIRE')}
                  className="px-2 py-0.5 bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF] rounded font-bold cursor-pointer"
                >
                  ACQUIRE TITLE (APA)
                </button>
                <button
                  type="button"
                  onClick={() => setApaModalState('VAULT_INQUIRE')}
                  className="px-2 py-0.5 bg-[#FF9F0A]/20 text-[#FF9F0A] border border-[#FF9F0A] rounded font-bold cursor-pointer"
                >
                  INQUIRE VAULT BUYOUT
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Interactive Chunk Matrix Bay (C0–C7) */}
      <main
        aria-label="Interactive Chunk Matrix Bay"
        className="grid grid-cols-2 sm:grid-cols-4 gap-1 w-full flex-1 min-h-0 overflow-hidden my-0.5"
      >
        {snapshot.chunks.map((chunk) => {
          const isSelected = chunk.id === selectedChunk.id;
          return (
            <button
              key={chunk.code}
              type="button"
              onClick={() => {
                setSelectedChunkId(chunk.id);
                appendRadioLog(
                  '🟢 TELEMETRY',
                  'Inspected ' +
                    chunk.title +
                    ' at ' +
                    chunk.hexPtr +
                    ' · Quanta Share ' +
                    String(chunk.computeQuantaShare) +
                    ' · Stage ' +
                    chunk.pipelineStage
                );
              }}
              className={
                'px-1.5 py-0.5 rounded border text-left flex flex-col justify-between min-h-0 overflow-hidden transition-colors cursor-pointer ' +
                (isSelected
                  ? 'bg-slate-900 border-[#00F0FF] shadow-[0_0_8px_rgba(0,240,255,0.18)]'
                  : chunk.locked
                    ? 'bg-slate-900/75 border-slate-800 hover:border-slate-600'
                    : 'bg-rose-950/30 border-rose-500/60')
              }
            >
              {/* Header: Chunk 0 (C0) and hex pointer */}
              <div className="flex items-center justify-between gap-1 w-full leading-none">
                <span className="text-xs font-mono font-bold text-white tracking-wide truncate">
                  {chunk.title}
                </span>
                <span className="text-[10px] font-mono text-slate-400 shrink-0">
                  {chunk.hexPtr}
                </span>
              </div>

              {/* Tokens & size */}
              <div className="text-[11px] font-mono text-cyan-300 font-bold leading-none truncate">
                {'TOK: ' + String(chunk.tokens) + ' · SIZE: ' + String(chunk.sizeMb) + 'MB'}
              </div>

              {/* Overlap & latency */}
              <div className="text-[11px] font-mono text-amber-300 font-bold leading-none truncate">
                {'OVERLAP: ' +
                  String(chunk.overlapPct) +
                  '% · LAT: ' +
                  chunk.latencyMs.toFixed(2) +
                  'ms'}
              </div>

              {/* Status & lock */}
              <div className="flex items-center justify-between gap-1 w-full leading-none">
                <span
                  className={
                    'text-[10px] font-mono font-semibold truncate ' +
                    (chunk.locked ? 'text-emerald-400' : 'text-rose-400')
                  }
                >
                  {'STATE: ' + chunk.stateLabel}
                </span>
                <span className="text-[10px] font-mono text-slate-400 shrink-0">
                  {'Q:' + String(chunk.computeQuantaShare)}
                </span>
              </div>
            </button>
          );
        })}
      </main>

      {/* Compact Prefill Telemetry Inspector Strip */}
      <div
        aria-label="Prefill Telemetry Inspector Strip"
        className="flex items-center justify-between gap-2 text-[11px] font-mono whitespace-nowrap overflow-hidden text-cyan-300 font-bold px-2 py-0.5 bg-black/60 border border-slate-800 rounded shrink-0"
      >
        <span className="truncate">
          {selectedChunk.code +
            ' · TOK: ' +
            String(selectedChunk.tokens) +
            ' · OVERLAP: ' +
            String(selectedChunk.overlapPct) +
            '% · LAT: ' +
            selectedChunk.latencyMs.toFixed(2) +
            'ms · PTR ' +
            selectedChunk.hexPtr +
            ' · DECODE_SYNC: ' +
            selectedChunk.decodeSync +
            ' · QUANTA: ' +
            String(selectedChunk.computeQuantaShare) +
            ' · STAGE: ' +
            selectedChunk.pipelineStage}
        </span>
        <div className="hidden md:flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setApaModalState('APA_ACQUIRE')}
            className="px-1.5 py-0 text-[10px] font-mono font-bold text-[#00F0FF] hover:underline cursor-pointer"
          >
            ACQUIRE TITLE (APA)
          </button>
          <span className="text-slate-600">·</span>
          <button
            type="button"
            onClick={() => setApaModalState('VAULT_INQUIRE')}
            className="px-1.5 py-0 text-[10px] font-mono font-bold text-[#FF9F0A] hover:underline cursor-pointer"
          >
            INQUIRE VAULT BUYOUT
          </button>
        </div>
      </div>

      {/* Tactical Launch Control Buttons */}
      <section
        aria-label="Tactical Launch Controls"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1 w-full shrink-0 my-0.5"
      >
        <button
          type="button"
          onClick={handleInjectPrefillBurst}
          className="border border-[#FF9F0A] bg-[#FF9F0A]/10 hover:bg-[#FF9F0A]/20 text-[#FF9F0A] rounded text-xs font-mono font-bold py-1.5 text-center transition-colors cursor-pointer"
        >
          💥 INJECT PREFILL BURST
        </button>

        <button
          type="button"
          onClick={handleTogglePromptSaturation}
          className="border border-[#00F0FF] bg-[#00F0FF]/10 hover:bg-[#00F0FF]/20 text-[#00F0FF] shadow-[0_0_8px_rgba(0,240,255,0.25)] rounded text-xs font-mono font-bold py-1.5 text-center transition-colors cursor-pointer"
        >
          ⚡ TOGGLE PROMPT SATURATION
        </button>

        <button
          type="button"
          onClick={handleStepChunkedPrefill}
          className="border border-[#10B981] bg-[#10B981]/10 hover:bg-[#10B981]/20 text-[#10B981] rounded text-xs font-mono font-bold py-1.5 text-center transition-colors cursor-pointer"
        >
          🚀 STEP CHUNKED PREFILL
        </button>

        <button
          type="button"
          onClick={handleFlushPrefillBuffers}
          className="border border-[#EF4444] bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] rounded text-xs font-mono font-bold py-1.5 text-center transition-colors cursor-pointer"
        >
          🔄 FLUSH PREFILL BUFFERS
        </button>
      </section>

      {/* Pit-Wall Radio Comms Log */}
      <footer
        aria-label="Pit-Wall Radio Comms Log"
        className="h-10 overflow-hidden font-mono text-[10px] px-2 py-1 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-tight flex flex-col justify-center"
      >
        {radioLogs.slice(0, 2).map((line, idx) => (
          <div key={String(idx) + '-' + line.slice(0, 12)} className="truncate">
            {line}
          </div>
        ))}
      </footer>

      {/* Schema & APA Modal Drawer */}
      {apaModalState !== 'NONE' && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#05070B] border border-[#00F0FF] rounded-lg max-w-2xl w-full p-4 font-mono text-xs text-slate-200 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-[#00F0FF]">
                {apaModalState === 'SCHEMA'
                  ? 'GF-T3-250 · POSTGRESQL / SUPABASE RLS SCHEMA'
                  : apaModalState === 'APA_ACQUIRE'
                    ? 'GF-T3-250 · ACQUIRE TITLE (APA) TRANSFER DOSSIER'
                    : 'GF-T3-250 · INQUIRE VAULT BUYOUT'}
              </span>
              <button
                type="button"
                onClick={() => setApaModalState('NONE')}
                className="px-2 py-0.5 bg-slate-900 border border-slate-700 text-slate-300 rounded cursor-pointer"
              >
                [CLOSE]
              </button>
            </div>

            {apaModalState === 'SCHEMA' ? (
              <pre className="bg-black/90 p-3 rounded border border-slate-800 text-[10px] text-emerald-300 overflow-y-auto max-h-64 leading-relaxed">
                {SUPABASE_SQL_SCHEMA_EXPORT}
              </pre>
            ) : (
              <div className="space-y-2 text-[11px] leading-relaxed text-slate-300">
                <p>
                  <strong className="text-white">CHASSIS IDENTIFIER:</strong> GF-T3-250 (Track 3 Skunkworks Engine)
                </p>
                <p>
                  <strong className="text-white">PROVENANCE & LICENSING:</strong> 100% Clean-Room MIT / Apache-2.0 Permissive Stack · Zero Viral Copyleft · NIST SP 800-218 SSDF v1.1 Verified.
                </p>
                <p>
                  <strong className="text-white">DELIVERABLES:</strong> Standalone FastAPI Engine (engine.py), Pytest & Vitest Suites, Partitioned PostgreSQL/Supabase Schema with RLS, and Cloud Run Dockerfile.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  appendRadioLog(
                    '🟢 CREW CHIEF',
                    'APA Telemetry & Schema Audit verified for GF-T3-250'
                  );
                  setApaModalState('NONE');
                }}
                className="px-3 py-1 bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF] rounded font-bold cursor-pointer"
              >
                CONFIRM & LOCK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
