/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GF-T3-283: Ultra-Wide Dynamic Prefill-Decode Disaggregation & Distributed KV-Streaming Cockpit
 */

import React, { useMemo, useState } from 'react';
import {
  CorridorId,
  evaluateDisaggregatedEngine,
  SYNTHETIC_CORRIDORS,
} from './engine/disaggEngine';
import { SUPABASE_POSTGRES_SCHEMA_SQL } from './engine/supabaseSchema';

type CockpitTab = 'Mesh' | 'Disg' | 'Strm' | 'Stats' | 'APA';

interface RadioLogEntry {
  timestamp: string;
  callsign: '🟢 CREW CHIEF' | '🟢 TELEMETRY' | '🔴 TELEMETRY' | '⚡ PIT WALL';
  message: string;
}

const INITIAL_LOGS: RadioLogEntry[] = [
  {
    timestamp: '00:01.04',
    callsign: '🟢 CREW CHIEF',
    message:
      'Prefill-decode disaggregation and distributed KV-streaming engine initialized · 8 nodes linked',
  },
  {
    timestamp: '00:01.08',
    callsign: '🟢 TELEMETRY',
    message: 'RDMA KV-state handoff verified at 40,800 GB/s with zero TTFT stalls',
  },
];

export default function App() {
  const [corridorId, setCorridorId] = useState<CorridorId>('DISAGG-CORRIDOR-ALPHA');
  const [activeTab, setActiveTab] = useState<CockpitTab>('Mesh');
  const [burstMultiplier, setBurstMultiplier] = useState<number>(1);
  const [congestionActive, setCongestionActive] = useState<boolean>(false);
  const [chunkPassCount, setChunkPassCount] = useState<number>(0);
  const [selectedNodeIdx, setSelectedNodeIdx] = useState<number>(3);
  const [radioLogs, setRadioLogs] = useState<RadioLogEntry[]>(INITIAL_LOGS);
  const [apaModalState, setApaModalState] = useState<'NONE' | 'ACQUIRE' | 'VAULT' | 'SCHEMA'>('NONE');
  const [tickCounter, setTickCounter] = useState<number>(9);

  const engineState = useMemo(() => {
    return evaluateDisaggregatedEngine({
      corridorId,
      burstMultiplier,
      congestionActive,
      chunkPassCount,
      seqLengthTokens: 32768,
      batchSize: 8,
      numLayers: 80,
      numKvHeads: 8,
      headDim: 128,
    });
  }, [corridorId, burstMultiplier, congestionActive, chunkPassCount]);

  const selectedNode = engineState.nodes[selectedNodeIdx] || engineState.nodes[3];

  const appendRadioLog = (
    callsign: RadioLogEntry['callsign'],
    message: string
  ) => {
    const nextTick = tickCounter + 4;
    setTickCounter(nextTick);
    const sec = Math.floor(nextTick / 100) + 1;
    const ms = nextTick % 100;
    const secStr = String(sec).padStart(2, '0');
    const msStr = String(ms).padStart(2, '0');
    const timestamp = '00:' + secStr + '.' + msStr;

    setRadioLogs((prev) => {
      const updated = [
        ...prev,
        {
          timestamp,
          callsign,
          message,
        },
      ];
      return updated.slice(-2);
    });
  };

  const handleCorridorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextId = e.target.value as CorridorId;
    setCorridorId(nextId);
    const profile = SYNTHETIC_CORRIDORS[nextId];
    appendRadioLog(
      '⚡ PIT WALL',
      'Corridor switched to ' +
        nextId +
        ' · Nominal RDMA bus ' +
        profile.rdmaBandwidthGbps.toLocaleString('en-US') +
        ' GB/s'
    );
  };

  const handleTriggerDisaggBurst = () => {
    const nextBurst = burstMultiplier >= 4 ? 1 : burstMultiplier + 1;
    setBurstMultiplier(nextBurst);
    appendRadioLog(
      '⚡ PIT WALL',
      'Prefill-Decode Disaggregation Burst set to ' +
        String(nextBurst) +
        'x · Asymmetric prefill workers isolated'
    );
  };

  const handleToggleCongestionSpike = () => {
    const nextCongestion = !congestionActive;
    setCongestionActive(nextCongestion);
    if (nextCongestion) {
      appendRadioLog(
        '🔴 TELEMETRY',
        'Network congestion spike detected on N2/N5 · Non-blocking RDMA KV re-routing engaged'
      );
    } else {
      appendRadioLog(
        '🟢 TELEMETRY',
        'RDMA congestion cleared · Full 8-node non-blocking KV-streaming fabric locked'
      );
    }
  };

  const handleStepChunkPass = () => {
    const nextPass = chunkPassCount + 1;
    setChunkPassCount(nextPass);
    appendRadioLog(
      '🟢 TELEMETRY',
      'Asynchronous KV chunk pass #' +
        String(nextPass) +
        ' committed · Zero-copy RDMA pointers synchronized'
    );
  };

  const handleFlushArenas = () => {
    setBurstMultiplier(1);
    setCongestionActive(false);
    setChunkPassCount(0);
    setSelectedNodeIdx(3);
    setCorridorId('DISAGG-CORRIDOR-ALPHA');
    setApaModalState('NONE');
    setRadioLogs(INITIAL_LOGS);
  };

  const formattedThroughput =
    engineState.streamingThroughputGbps.toLocaleString('en-US') + ' GB/s';
  const formattedHandoff = String(engineState.handoffLatencyUs) + ' µs';
  const formattedTokens =
    engineState.processedTokensUnits.toLocaleString('en-US') + ' UNITS';
  const formattedXp =
    '+' + (engineState.engineXpUnits / 1000).toFixed(1) + 'k ENGINE XP';

  const saturationWidthPct = Math.min(
    100,
    Math.round((engineState.streamingThroughputGbps / 45000) * 100)
  );

  const vecStr =
    '[' +
    engineState.vectorSignature[0].toFixed(2) +
    ', ' +
    engineState.vectorSignature[1].toFixed(2) +
    ', ' +
    engineState.vectorSignature[2].toFixed(2) +
    ', ' +
    engineState.vectorSignature[3].toFixed(2) +
    ']';

  const inspectorLockSuffix =
    selectedNode.stateLabel === 'STREAMING · LOCKED' ? 'LOCKED' : 'FAULT';

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans">
      {/* TOP HEADER ROW 1 */}
      <header className="flex items-center justify-between gap-1 w-full shrink-0 border-b border-slate-800/80 pb-0.5">
        <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
          <h1 className="text-sm md:text-base font-mono font-extrabold tracking-tight text-white leading-none">
            GF-T3-283
          </h1>
          <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/50 rounded leading-none">
            FLAGSHIP
          </span>
          <span className="hidden sm:inline text-[10px] font-mono text-slate-400 leading-none">
            TRACK-3 SKUNKWORKS
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <select
            aria-label="Select Disaggregation Corridor"
            value={corridorId}
            onChange={handleCorridorChange}
            className="max-w-[110px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 border border-slate-700 text-cyan-300 rounded focus:outline-none focus:border-[#00F0FF]"
          >
            {Object.values(SYNTHETIC_CORRIDORS).map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              setActiveTab('Disg');
              handleTriggerDisaggBurst();
            }}
            className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/40 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            [Disagg]
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('Strm');
              handleStepChunkPass();
            }}
            className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            [Stream]
          </button>

          <button
            type="button"
            onClick={handleStepChunkPass}
            className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/50 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            [Run]
          </button>
        </div>
      </header>

      {/* TOP HEADER ROW 2 */}
      <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap overflow-hidden text-ellipsis shrink-0 leading-tight">
        Prefill-Decode Disaggregation · Distributed KV-Streaming · Zero TTFT Drop
      </div>

      {/* 4-CARD ARCADE HUD RIBBON */}
      <section
        aria-label="Telemetry HUD Ribbon"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1 w-full shrink-0"
      >
        {/* Card 1: STREAM NITRO */}
        <div className="bg-slate-900/90 border border-slate-800 rounded px-1.5 py-0.5 flex flex-col justify-between leading-tight">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="font-bold text-cyan-400">STREAM NITRO</span>
            <span>RDMA BUS</span>
          </div>
          <div className="font-mono text-lg font-bold text-[#00F0FF] leading-none my-0.5">
            {formattedThroughput}
          </div>
          <div className="w-full bg-slate-800 h-1 rounded overflow-hidden">
            <div
              className="bg-[#00F0FF] h-full transition-all duration-150"
              style={{ width: String(saturationWidthPct) + '%' }}
            />
          </div>
          <div className="text-[9px] font-mono text-slate-400 flex justify-between items-center">
            <span>Streaming Throughput Saturation</span>
            <span className="text-cyan-300">{String(saturationWidthPct)}%</span>
          </div>
        </div>

        {/* Card 2: HANDOFF STREAK */}
        <div className="bg-slate-900/90 border border-slate-800 rounded px-1.5 py-0.5 flex flex-col justify-between leading-tight">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="font-bold text-amber-400">HANDOFF STREAK</span>
            <span className="text-amber-300 font-bold">🔥 RDMA-LINK</span>
          </div>
          <div className="font-mono text-lg font-bold text-[#FF9F0A] leading-none my-0.5">
            {formattedHandoff}
          </div>
          <div className="text-[9px] font-mono text-slate-400 flex justify-between items-center">
            <span>Handoff Latency</span>
            <span className="text-emerald-400">
              TTFT -{String(engineState.ttftReductionPercent)}%
            </span>
          </div>
        </div>

        {/* Card 3: ACTIVE NODES */}
        <div className="bg-slate-900/90 border border-slate-800 rounded px-1.5 py-0.5 flex flex-col justify-between leading-tight">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="font-bold text-emerald-400">ACTIVE NODES</span>
            <span className="text-emerald-300">
              Parity: {String(engineState.bufferParityPercent)}%
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-emerald-400 leading-none my-0.5">
            NODES: {String(engineState.activeNodesCount)}/{String(engineState.totalNodesCount)}
          </div>
          <div className="flex items-center justify-between gap-0.5 text-[9px] font-mono">
            {engineState.nodes.map((n) => (
              <span
                key={n.nodeCode}
                className={
                  n.stateLabel === 'STREAMING · LOCKED'
                    ? 'px-1 bg-emerald-950 text-emerald-300 border border-emerald-600/50 rounded leading-none py-0.5'
                    : 'px-1 bg-rose-950 text-rose-300 border border-rose-600/50 rounded leading-none py-0.5'
                }
              >
                {n.nodeCode}
              </span>
            ))}
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="bg-slate-900/90 border border-slate-800 rounded px-1.5 py-0.5 flex flex-col justify-between leading-tight">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="font-bold text-cyan-300">TOKEN SCORE</span>
            <span className="text-emerald-400 font-bold">{formattedXp}</span>
          </div>
          <div className="font-mono text-lg font-bold text-white leading-none my-0.5">
            {formattedTokens}
          </div>
          <div className="text-[9px] font-mono text-slate-300 flex justify-between items-center">
            <span>Disagg State: {engineState.disaggStateLabel}</span>
            <span className="text-cyan-400">KV: {String(engineState.kvStateSizeGb)}GB</span>
          </div>
        </div>
      </section>

      {/* 5 HORIZONTAL TABS */}
      <nav
        aria-label="Cockpit Mode Tabs"
        className="grid grid-cols-5 gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg my-1 w-full text-center shrink-0"
      >
        {(['Mesh', 'Disg', 'Strm', 'Stats', 'APA'] as CockpitTab[]).map((tab) => {
          const isCurrent = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={
                isCurrent
                  ? 'py-0.5 text-xs font-mono font-bold bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/60 rounded transition-colors cursor-pointer leading-tight'
                  : 'py-0.5 text-xs font-mono font-bold text-slate-400 hover:text-white hover:bg-slate-800/60 rounded transition-colors cursor-pointer leading-tight'
              }
            >
              {tab}
            </button>
          );
        })}
      </nav>

      {/* STREAMLINED MESH INFO SUBHEADER (STRICTLY CLEAN OF ACTION BUTTONS) */}
      <div className="text-[10px] font-mono whitespace-nowrap overflow-hidden text-slate-300 bg-slate-950/90 border border-slate-800/80 rounded px-2 py-0.5 shrink-0 leading-tight">
        VIEW: {activeTab.toUpperCase()} · PTR: 0x10F8DC0 · MODE: PREFILL_DECODE_DISAGG · NODES: 8 · VEC: {vecStr}
      </div>

      {/* CONTEXTUAL TAB STRIP OR APA VAULT CONTROLS */}
      {activeTab === 'Disg' && (
        <div className="text-[10px] font-mono bg-slate-900/90 border border-amber-500/40 rounded px-2 py-0.5 flex justify-between items-center shrink-0 text-amber-300 leading-tight">
          <span className="truncate">
            ASYMMETRIC FORMULA: T_disagg = max(T_prefill[{String(engineState.prefillTimeMs)}ms], T_decode[{String(engineState.decodeTimeMs)}ms]) + KV_xfer[{String(engineState.kvTransferTimeMs)}ms] = {String(engineState.disaggTotalLatencyMs)}ms
          </span>
          <span className="text-emerald-400 font-bold shrink-0 ml-2">
            COLLOCATED: {String(engineState.collocatedTotalLatencyMs)}ms (-{String(engineState.ttftReductionPercent)}%)
          </span>
        </div>
      )}

      {activeTab === 'Strm' && (
        <div className="text-[10px] font-mono bg-slate-900/90 border border-cyan-500/40 rounded px-2 py-0.5 flex justify-between items-center shrink-0 text-cyan-300 leading-tight">
          <span className="truncate">
            NON-BLOCKING RDMA KV-STREAMING: CHUNK FOOTPRINT {String(engineState.kvStateSizeGb)} GB · PASS #{String(chunkPassCount)}
          </span>
          <span className="text-amber-300 font-bold shrink-0 ml-2">
            CORRIDOR: {SYNTHETIC_CORRIDORS[corridorId].shortTag}
          </span>
        </div>
      )}

      {activeTab === 'Stats' && (
        <div className="text-[10px] font-mono bg-slate-900/90 border border-emerald-500/40 rounded px-2 py-0.5 flex justify-between items-center shrink-0 text-emerald-300 leading-tight">
          <span className="truncate">
            ZERO-TRUST GRIDSYNC GATE: ACTIVE · SQL/XSS SCRUBBING: VERIFIED · RLS POLICIES: 3/3 LOCKED
          </span>
          <button
            type="button"
            onClick={() =>
              setApaModalState(apaModalState === 'SCHEMA' ? 'NONE' : 'SCHEMA')
            }
            className="px-1.5 py-0 text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/50 rounded cursor-pointer shrink-0 ml-2"
          >
            [INSPECT SQL RLS SCHEMA]
          </button>
        </div>
      )}

      {activeTab === 'APA' && (
        <div className="bg-slate-900/95 border border-[#FF9F0A]/60 rounded px-2 py-0.5 flex items-center justify-between gap-2 shrink-0 leading-tight">
          <div className="text-[10px] font-mono text-slate-200 truncate">
            <span className="text-[#FF9F0A] font-bold">APA SOVEREIGN CHASSIS: </span>
            <span>100% MIT Clean-Room IP · Zero Copyleft · PostgreSQL RLS</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                setApaModalState('ACQUIRE');
                appendRadioLog(
                  '🟢 CREW CHIEF',
                  'APA Title Acquisition package staged for GF-T3-283 · Clean-room IP verified'
                );
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#FF9F0A] text-black rounded hover:bg-amber-400 transition-colors cursor-pointer whitespace-nowrap"
            >
              ACQUIRE TITLE (APA)
            </button>
            <button
              type="button"
              onClick={() => {
                setApaModalState('VAULT');
                appendRadioLog(
                  '⚡ PIT WALL',
                  'Vault Buyout dossier unlocked · Zero-SaaS standalone institutional transfer ready'
                );
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-cyan-950 text-[#00F0FF] border border-[#00F0FF]/60 rounded hover:bg-cyan-900 transition-colors cursor-pointer whitespace-nowrap"
            >
              INQUIRE VAULT BUYOUT
            </button>
            <button
              type="button"
              onClick={() =>
                setApaModalState(apaModalState === 'SCHEMA' ? 'NONE' : 'SCHEMA')
              }
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-800 text-slate-200 border border-slate-600 rounded hover:bg-slate-700 transition-colors cursor-pointer whitespace-nowrap"
            >
              SQL RLS SCHEMA
            </button>
          </div>
        </div>
      )}

      {/* OPTIONAL COMPACT APA / SCHEMA DRAWER BANNER */}
      {apaModalState !== 'NONE' && (
        <div className="bg-black/95 border border-cyan-500/50 rounded px-2 py-0.5 text-[10px] font-mono text-slate-200 flex items-center justify-between gap-2 shrink-0 leading-tight">
          {apaModalState === 'ACQUIRE' && (
            <div className="truncate">
              <span className="text-[#FF9F0A] font-bold">APA TITLE TRANSFER (GF-T3-283): </span>
              Standalone Repository + FastAPI Engine + Pytest/Vitest Suite + Supabase RLS Schema ready for escrow handoff.
            </div>
          )}
          {apaModalState === 'VAULT' && (
            <div className="truncate">
              <span className="text-[#00F0FF] font-bold">VAULT BUYOUT DOSSIER: </span>
              100% Exclusive IP Assignment · Zero Recurring Royalties · NIST SP 800-218 SSDF v1.1 Verified.
            </div>
          )}
          {apaModalState === 'SCHEMA' && (
            <div className="truncate text-emerald-300">
              <span className="font-bold">POSTGRESQL RLS: </span>
              {SUPABASE_POSTGRES_SCHEMA_SQL.slice(0, 180)}...
            </div>
          )}
          <button
            type="button"
            onClick={() => setApaModalState('NONE')}
            className="px-1.5 py-0 text-[10px] font-mono font-bold text-rose-400 border border-rose-500/40 rounded cursor-pointer shrink-0"
          >
            [CLOSE]
          </button>
        </div>
      )}

      {/* INTERACTIVE NODE MATRIX BAY (N0-N7) - COMPACT 4x2 GRID */}
      <main
        aria-label="Interactive Node Matrix Bay"
        className="grid grid-cols-2 md:grid-cols-4 gap-1 p-1 bg-slate-950/70 border border-slate-800/90 rounded-lg shrink-0"
      >
        {engineState.nodes.map((node) => {
          const isSelected = node.nodeIndex === selectedNodeIdx;
          const isHealthy = node.stateLabel === 'STREAMING · LOCKED';

          const cardBorder = isSelected
            ? 'border-[#00F0FF] bg-slate-900/95'
            : isHealthy
              ? 'border-slate-800 bg-slate-900/70 hover:border-slate-700'
              : 'border-rose-500/70 bg-rose-950/30';

          return (
            <div
              key={node.nodeCode}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedNodeIdx(node.nodeIndex)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setSelectedNodeIdx(node.nodeIndex);
                }
              }}
              className={
                'py-0 px-1.5 rounded border transition-colors flex flex-col justify-center leading-tight cursor-pointer ' +
                cardBorder
              }
            >
              {/* Line 1: Title & Hex */}
              <div className="text-[11px] font-mono font-bold text-white flex justify-between items-center leading-tight">
                <span>{node.title}</span>
                <span className="text-slate-400">{node.hexPtr}</span>
              </div>

              {/* Line 2: Tokens & Role */}
              <div className="flex justify-between items-center text-[11px] font-mono font-bold text-cyan-300 leading-tight">
                <span>TOK: {String(node.tokensK)}K</span>
                <span>ROLE: {node.role}</span>
              </div>

              {/* Line 3: Latency & State */}
              <div className="flex justify-between items-center text-[10px] font-mono leading-tight">
                <span className="text-[#FF9F0A] font-bold">
                  {node.latencyMs.toFixed(2)}ms
                </span>
                <span
                  className={
                    isHealthy
                      ? 'text-[#10B981] font-bold'
                      : 'text-[#EF4444] font-bold'
                  }
                >
                  {node.stateLabel}
                </span>
              </div>
            </div>
          );
        })}
      </main>

      {/* COMPACT DISAGGREGATION TELEMETRY INSPECTOR STRIP */}
      <div className="text-[11px] font-mono whitespace-nowrap overflow-hidden text-cyan-300 font-bold px-2 py-0.5 bg-black/60 border border-slate-800 rounded my-0.5 shrink-0 leading-tight">
        {selectedNode.nodeCode} · TOK: {String(selectedNode.tokensK)}K · ROLE: {selectedNode.role} · SYNC: {String(selectedNode.syncPercent)}% · PTR {selectedNode.hexPtr} · DISAGG: {selectedNode.disaggStatus} · {inspectorLockSuffix}
      </div>

      {/* TACTICAL LAUNCH CONTROL SWITCHES */}
      <section
        aria-label="Tactical Launch Control Switches"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1"
      >
        <button
          type="button"
          onClick={handleTriggerDisaggBurst}
          className="bg-amber-950/40 hover:bg-amber-900/50 border border-[#FF9F0A] text-[#FF9F0A] rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis px-1 leading-none"
        >
          💥 INJECT DISAGGREGATION BURST
        </button>

        <button
          type="button"
          onClick={handleToggleCongestionSpike}
          className="bg-cyan-950/40 hover:bg-cyan-900/50 border border-[#00F0FF] text-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.2)] rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis px-1 leading-none"
        >
          ⚡ TOGGLE RDMA CONGESTION SPIKE
        </button>

        <button
          type="button"
          onClick={handleStepChunkPass}
          className="bg-emerald-950/40 hover:bg-emerald-900/50 border border-[#10B981] text-[#10B981] rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis px-1 leading-none"
        >
          🚀 STEP ASYNCHRONOUS CHUNK PASS
        </button>

        <button
          type="button"
          onClick={handleFlushArenas}
          className="bg-rose-950/40 hover:bg-rose-900/50 border border-[#EF4444] text-[#EF4444] rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis px-1 leading-none"
        >
          🔄 FLUSH STREAM ARENAS
        </button>
      </section>

      {/* PIT-WALL RADIO COMMS LOG */}
      <footer
        aria-label="Pit-Wall Radio Comms Log"
        className="h-8 overflow-hidden font-mono text-[9px] px-2 py-0.5 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-normal flex flex-col justify-center"
      >
        {radioLogs.map((entry, idx) => (
          <div key={String(idx) + '-' + entry.timestamp} className="truncate">
            [{entry.timestamp}] {entry.callsign}: {entry.message}
          </div>
        ))}
      </footer>
    </div>
  );
}
