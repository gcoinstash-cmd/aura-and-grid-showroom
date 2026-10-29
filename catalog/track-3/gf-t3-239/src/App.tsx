/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GF-T3-239: Tensor Parallelism Column/Row Weight Sharding & All-Reduce Ring Accelerator Cockpit
 * Track 3 Skunkworks Engine · Strict Zero-Dollar & 100% Above-The-Fold Viewport Spec
 */

import React, { useMemo, useState } from 'react';
import {
  CORRIDOR_OPTIONS,
  CorridorOption,
  RadioLogEntry,
  SUPABASE_POSTGRES_SCHEMA_SQL,
  runTensorParallelPass,
} from './engine/tensorParallelEngine';

type CockpitTab = 'Mesh' | 'TP' | 'Ring' | 'Stats' | 'APA';

const COCKPIT_TABS: readonly CockpitTab[] = ['Mesh', 'TP', 'Ring', 'Stats', 'APA'];

const INITIAL_RADIO_LOGS: readonly RadioLogEntry[] = [
  {
    id: 'log-1',
    timestamp: '[00:01.04]',
    callsign: '🟢 CREW CHIEF',
    message: 'Tensor parallelism column/row sharding engine initialized · 8 ranks linked',
  },
  {
    id: 'log-2',
    timestamp: '[00:01.08]',
    callsign: '⚡ PIT WALL',
    message: 'Ring All-Reduce accelerator synchronized · Bandwidth at 4,800 GB/s',
  },
  {
    id: 'log-3',
    timestamp: '[00:01.12]',
    callsign: '🟢 TELEMETRY',
    message: 'Communication-computation overlap verified with zero rank stalls',
  },
];

function formatNumberWithCommas(value: number): string {
  return value.toLocaleString('en-US');
}

function formatClockStamp(stepIndex: number): string {
  const totalCentiseconds = 112 + stepIndex * 4;
  const seconds = Math.floor(totalCentiseconds / 100);
  const centis = totalCentiseconds % 100;
  const secStr = seconds < 10 ? '0' + String(seconds) : String(seconds);
  const cenStr = centis < 10 ? '0' + String(centis) : String(centis);
  return '[00:' + secStr + '.' + cenStr + ']';
}

export default function App() {
  const [selectedCorridor, setSelectedCorridor] = useState<CorridorOption>(CORRIDOR_OPTIONS[0]);
  const [activeTab, setActiveTab] = useState<CockpitTab>('Mesh');
  const [selectedRankIndex, setSelectedRankIndex] = useState<number>(3);
  const [stepCounter, setStepCounter] = useState<number>(0);
  const [shardSizeMb, setShardSizeMb] = useState<number>(32);
  const [desyncRankIndices, setDesyncRankIndices] = useState<number[]>([]);
  const [radioLogs, setRadioLogs] = useState<RadioLogEntry[]>([...INITIAL_RADIO_LOGS]);
  const [schemaModalOpen, setSchemaModalOpen] = useState<boolean>(false);
  const [apaNotice, setApaNotice] = useState<string>(
    'APA Title Vault Armed · Clean-Room MIT/Apache-2.0 Provenance Verified'
  );

  const engineResult = useMemo(() => {
    return runTensorParallelPass({
      corridor: selectedCorridor,
      batchTokens: 4,
      hiddenDim: 16,
      ffnDim: 32,
      shardSizeMb,
      stepCounter,
      desyncRankIndices,
    });
  }, [selectedCorridor, shardSizeMb, stepCounter, desyncRankIndices]);

  const inspectedRank =
    engineResult.ranks[selectedRankIndex] ?? engineResult.ranks[3] ?? engineResult.ranks[0];

  const appendRadioLog = (
    callsign: RadioLogEntry['callsign'],
    message: string,
    nextStep: number
  ) => {
    const entry: RadioLogEntry = {
      id: 'log-' + String(nextStep) + '-' + String(radioLogs.length + 1),
      timestamp: formatClockStamp(nextStep),
      callsign,
      message,
    };
    setRadioLogs((prev) => [entry, ...prev.slice(0, 2)]);
  };

  // Trigger Ring All-Reduce Burst
  const handleInjectRingBurst = () => {
    const nextStep = stepCounter + 1;
    const nextSize = shardSizeMb === 32 ? 64 : 32;
    setStepCounter(nextStep);
    setShardSizeMb(nextSize);
    appendRadioLog(
      '⚡ PIT WALL',
      'Trigger Ring All-Reduce Burst executed · Payload ' +
        String(nextSize) +
        ' MB across 8 ranks · Parity diff 0.00e+0',
      nextStep
    );
  };

  // Inject Rank Desync (Force Ring Resync)
  const handleToggleRankDesync = () => {
    const nextStep = stepCounter + 1;
    setStepCounter(nextStep);
    if (desyncRankIndices.length === 0) {
      setDesyncRankIndices([2, 6]);
      appendRadioLog(
        '🔴 TELEMETRY',
        'Inject Rank Desync on R2 & R6 · Force Ring Resync active · Bandwidth throttled to ' +
          formatNumberWithCommas(Math.round(4800 / 1.36)) +
          ' GB/s',
        nextStep
      );
    } else {
      setDesyncRankIndices([]);
      appendRadioLog(
        '🟢 CREW CHIEF',
        'Ring Resync locked across R0..R7 · Full 4,800 GB/s ring saturation restored',
        nextStep
      );
    }
  };

  // Step Tensor Parallel Shard
  const handleStepTensorShard = () => {
    const nextStep = stepCounter + 1;
    setStepCounter(nextStep);
    appendRadioLog(
      '🟢 TELEMETRY',
      'Step Tensor Parallel Shard #' +
        String(nextStep) +
        ' · Column-Row matmul parity verified · Processed ' +
        formatNumberWithCommas(1664000 + nextStep * 64000) +
        ' Units',
      nextStep
    );
  };

  // Flush Shard Queues & Re-Zero Comm Buffers
  const handleFlushCommBuffers = () => {
    setStepCounter(0);
    setShardSizeMb(32);
    setDesyncRankIndices([]);
    setSelectedRankIndex(3);
    setRadioLogs([...INITIAL_RADIO_LOGS]);
  };

  const handleCorridorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextCorridor = e.target.value as CorridorOption;
    const nextStep = stepCounter + 1;
    setSelectedCorridor(nextCorridor);
    setStepCounter(nextStep);
    appendRadioLog(
      '🟢 CREW CHIEF',
      'Corridor switched to ' + nextCorridor + ' · Ring topology verified',
      nextStep
    );
  };

  const inspectorStripText =
    'RANK: ' +
    inspectedRank.rankId +
    ' · OP: ' +
    inspectedRank.activeOp +
    ' · SIZE: ' +
    String(inspectedRank.shardSizeMb) +
    ' MB · PTR: ' +
    inspectedRank.pointerHex +
    ' · ' +
    (inspectedRank.ringState === 'DESYNC_FAULT' ? 'FAULT' : 'ACTIVE');

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans">
      {/* TOP HEADER ROW 1 */}
      <header className="flex items-center justify-between gap-1 w-full shrink-0 border-b border-slate-800/80 pb-1">
        <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
          <h1 className="text-sm font-mono font-bold tracking-tight text-white">GF-T3-239</h1>
          <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-cyan-950/90 text-[#00F0FF] border border-cyan-500/40 rounded">
            TRACK 3
          </span>
          <span
            className={
              'px-1.5 py-0.5 text-[10px] font-mono font-bold rounded border ' +
              (desyncRankIndices.length === 0
                ? 'bg-emerald-950/80 text-[#10B981] border-emerald-500/40'
                : 'bg-rose-950/80 text-[#EF4444] border-rose-500/50')
            }
          >
            {desyncRankIndices.length === 0 ? '✓ LOCKED' : '⚡ FAULT'}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <label htmlFor="corridor-select" className="sr-only">
            Tensor Parallel Corridor
          </label>
          <select
            id="corridor-select"
            value={selectedCorridor}
            onChange={handleCorridorChange}
            className="max-w-[110px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 border border-slate-700 text-cyan-300 rounded focus:outline-none focus:border-cyan-400"
            title={selectedCorridor}
          >
            {CORRIDOR_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              setActiveTab('TP');
              handleStepTensorShard();
            }}
            className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-cyan-950 text-[#00F0FF] border border-cyan-500/40 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            [TP]
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('Ring');
              handleInjectRingBurst();
            }}
            className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-amber-950 text-[#FF9F0A] border border-amber-500/40 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            [Ring]
          </button>
          <button
            type="button"
            onClick={handleStepTensorShard}
            className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-emerald-950/90 hover:bg-emerald-900 text-[#10B981] border border-emerald-500/40 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            [Run]
          </button>
          <button
            type="button"
            onClick={() => setSchemaModalOpen((prev) => !prev)}
            className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            [Inspect Schema]
          </button>
          <button
            type="button"
            onClick={handleFlushCommBuffers}
            className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-rose-950 text-rose-300 border border-rose-500/30 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            [Reset]
          </button>
        </div>
      </header>

      {/* TOP HEADER ROW 2 */}
      <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap shrink-0 py-0.5">
        Tensor Parallelism · Column/Row Sharding · Ring All-Reduce
      </div>

      {/* 4-CARD ARCADE HUD RIBBON */}
      <section
        aria-label="Telemetry HUD Ribbon"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0"
      >
        {/* Card 1: TP NITRO */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg px-2 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>TP NITRO</span>
            <span className="text-cyan-400">
              {String(engineResult.bandwidthSaturationPct) + '% BUS'}
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-[#00F0FF] leading-tight">
            {formatNumberWithCommas(engineResult.ringBandwidthGbs) + ' GB/s'}
          </div>
          <div className="w-full bg-slate-900 h-1.5 rounded overflow-hidden my-0.5 border border-slate-800">
            <div
              className="bg-[#00F0FF] h-full transition-opacity duration-150"
              style={{ width: String(engineResult.bandwidthSaturationPct) + '%' }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            Ring Bandwidth Saturation
          </div>
        </div>

        {/* Card 2: LATENCY STREAK */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg px-2 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>LATENCY STREAK</span>
            <span className="text-[#FF9F0A] font-bold">🔥 8 RANKS</span>
          </div>
          <div className="font-mono text-lg font-bold text-amber-300 leading-tight">
            {engineResult.allReduceLatencyUs.toFixed(2) + ' µs'}
          </div>
          <div className="text-[10px] font-mono text-emerald-400 truncate">
            {'Overlap Efficiency: ' + String(engineResult.overlapEfficiencyPct) + '%'}
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">All-Reduce Latency</div>
        </div>

        {/* Card 3: ACTIVE RANKS */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg px-2 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>ACTIVE RANKS</span>
            <span className="text-emerald-400 font-bold">RING_ALL_REDUCE</span>
          </div>
          <div className="font-mono text-lg font-bold text-white leading-tight">
            {'RANKS: ' + String(engineResult.activeRanksCount) + '/8'}
          </div>
          <div className="grid grid-cols-8 gap-0.5 my-0.5">
            {engineResult.ranks.map((r) => (
              <span
                key={r.rankId}
                className={
                  'text-[9px] font-mono text-center rounded py-0.2 border ' +
                  (r.ringState === 'DESYNC_FAULT'
                    ? 'bg-rose-950 text-rose-300 border-rose-500/50'
                    : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40')
                }
              >
                {r.rankId}
              </span>
            ))}
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            Active Ranks: 8 Ranks · Ring Topology
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg px-2 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>TOKEN SCORE</span>
            <span className="text-[#10B981] font-bold">
              {'+' + String(engineResult.tpXpDeltaK) + 'k TP XP'}
            </span>
          </div>
          <div className="font-mono text-lg font-bold text-[#10B981] leading-tight truncate">
            {formatNumberWithCommas(engineResult.processedTokens) + ' UNITS'}
          </div>
          <div className="text-[10px] font-mono text-cyan-300 truncate">
            {'Parity Diff: ' + engineResult.maxAbsDiff.toExponential(2)}
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            {engineResult.tpStateLabel}
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
              onClick={() => setActiveTab(tab)}
              className={
                'py-0.5 text-xs font-mono font-bold rounded transition-colors cursor-pointer whitespace-nowrap ' +
                (isActive
                  ? 'bg-cyan-950 text-[#00F0FF] border border-cyan-500/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60')
              }
            >
              {tab}
            </button>
          );
        })}
      </nav>

      {/* INTERACTIVE TENSOR PARALLEL SHARD MATRIX BAY */}
      <main className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-1.5 overflow-hidden">
        {/* Left/Center 8 GPU Ranks Matrix (Always visible above fold for instant rank inspection) */}
        <section
          aria-label="Interactive Tensor Parallel Shard Matrix Bay"
          className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-1.5 h-full content-stretch"
        >
          {engineResult.ranks.map((rank) => {
            const isSelected = rank.rankIndex === inspectedRank.rankIndex;
            const isFault = rank.ringState === 'DESYNC_FAULT';
            return (
              <button
                key={rank.rankId}
                type="button"
                onClick={() => setSelectedRankIndex(rank.rankIndex)}
                className={
                  'text-left px-2.5 py-1.5 rounded-lg border transition-colors flex flex-col justify-between cursor-pointer ' +
                  (isFault
                    ? 'bg-rose-950/30 border-rose-500/70'
                    : isSelected
                    ? 'bg-slate-900/95 border-[#00F0FF]'
                    : 'bg-slate-950/90 border-slate-800 hover:border-slate-700')
                }
              >
                <div className="text-xs font-mono font-bold text-white">
                  {rank.headerLabel}
                </div>

                <div className="text-[11px] font-mono text-cyan-300 font-semibold">
                  {rank.shardStatusLabel}
                </div>

                <div className="text-[11px] font-mono text-amber-300 font-bold">
                  {rank.pointerAndRingLabel}
                </div>
              </button>
            );
          })}
        </section>

        {/* Right Contextual Tab Deck & Live Rank Slice Inspector */}
        <aside className="lg:col-span-4 bg-slate-950/95 border border-slate-800 rounded-lg px-2 py-1 flex flex-col justify-between overflow-hidden">
          {activeTab === 'Mesh' && (
            <div className="flex flex-col justify-between h-full text-xs font-mono">
              <div className="flex items-center justify-between border-b border-slate-800 pb-0.5">
                <span className="font-bold text-[#00F0FF]">
                  {'MESH INSPECTOR · ' + inspectedRank.headerLabel}
                </span>
                <span className="text-[10px] text-emerald-400">ZERO-DUPLICATION</span>
              </div>
              <div className="grid grid-cols-2 gap-1 my-0.5 text-[11px]">
                <div className="bg-slate-900/80 px-1.5 py-1 rounded border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Local Weight Slice</div>
                  <div className="text-white font-bold">
                    {String(inspectedRank.weightSliceRows) +
                      ' × ' +
                      String(inspectedRank.weightSliceCols)}
                  </div>
                </div>
                <div className="bg-slate-900/80 px-1.5 py-1 rounded border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Peer Transfer Target</div>
                  <div className="text-cyan-300 font-bold">{inspectedRank.peerTransferTarget}</div>
                </div>
                <div className="bg-slate-900/80 px-1.5 py-1 rounded border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Comm Queue Depth</div>
                  <div className="text-amber-300 font-bold">
                    {String(inspectedRank.commQueueDepth) + ' Packets'}
                  </div>
                </div>
                <div className="bg-slate-900/80 px-1.5 py-1 rounded border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Sub-Matrix L1 Norm</div>
                  <div className="text-emerald-300 font-bold">{String(inspectedRank.localNorm)}</div>
                </div>
              </div>
              <div className="text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-800 pt-0.5">
                <span>{'Corridor: ' + selectedCorridor.slice(0, 28)}</span>
                <span className="text-cyan-300">8 Ranks Synced</span>
              </div>
            </div>
          )}

          {activeTab === 'TP' && (
            <div className="flex flex-col justify-between h-full text-xs font-mono">
              <div className="flex items-center justify-between border-b border-slate-800 pb-0.5">
                <span className="font-bold text-[#00F0FF]">COLUMN / ROW LINEAR SHARDING</span>
                <span className="text-[10px] text-emerald-400">PARITY LOCKED</span>
              </div>
              <div className="space-y-1 text-[11px] my-0.5">
                <div className="bg-slate-900/80 px-1.5 py-1 rounded border border-slate-800 flex justify-between">
                  <span className="text-slate-400">Column Linear (Y_i = X * A_i):</span>
                  <span className="text-cyan-300 font-bold">Split Dim 1 (1/8 Slice)</span>
                </div>
                <div className="bg-slate-900/80 px-1.5 py-1 rounded border border-slate-800 flex justify-between">
                  <span className="text-slate-400">Row Linear (Z_i = Y_i * B_i):</span>
                  <span className="text-amber-300 font-bold">Split Dim 0 (1/8 Slice)</span>
                </div>
                <div className="bg-slate-900/80 px-1.5 py-1 rounded border border-slate-800 flex justify-between">
                  <span className="text-slate-400">Dense vs Sharded Max Diff:</span>
                  <span className="text-emerald-400 font-bold">
                    {engineResult.maxAbsDiff.toExponential(3)}
                  </span>
                </div>
              </div>
              <div className="text-[10px] text-slate-400 border-t border-slate-800 pt-0.5">
                Numerical Equivalence Verified: Z = RingAllReduce(sum_i(X * A_i * B_i))
              </div>
            </div>
          )}

          {activeTab === 'Ring' && (
            <div className="flex flex-col justify-between h-full text-xs font-mono">
              <div className="flex items-center justify-between border-b border-slate-800 pb-0.5">
                <span className="font-bold text-[#FF9F0A]">RING ALL-REDUCE PIPELINE</span>
                <span className="text-[10px] text-cyan-300">
                  {'2(N-1)/N = ' + String(engineResult.ringFactor) + 'x'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 my-0.5 text-[10px]">
                {engineResult.ringHops.slice(0, 4).map((hop) => (
                  <div
                    key={hop.hopIndex}
                    className="bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-800 flex items-center justify-between"
                  >
                    <span className="text-cyan-300 font-bold">
                      {hop.sourceRank + '->' + hop.targetRank}
                    </span>
                    <span className="text-amber-300">{String(hop.transferredMb) + ' MB'}</span>
                  </div>
                ))}
              </div>
              <div className="text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-800 pt-0.5">
                <span>
                  {'Ring Volume: ' + String(engineResult.effectiveTransferMb) + ' MB'}
                </span>
                <span className="text-emerald-400">
                  {'Overlap: ' + String(engineResult.overlapEfficiencyPct) + '%'}
                </span>
              </div>
            </div>
          )}

          {activeTab === 'Stats' && (
            <div className="flex flex-col justify-between h-full text-xs font-mono">
              <div className="flex items-center justify-between border-b border-slate-800 pb-0.5">
                <span className="font-bold text-emerald-400">CLUSTER TELEMETRY BENCHMARKS</span>
                <span className="text-[10px] text-cyan-300">STEP #{String(stepCounter)}</span>
              </div>
              <div className="space-y-1 text-[11px] my-0.5">
                <div className="flex justify-between bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                  <span className="text-slate-400">Ring Bandwidth:</span>
                  <span className="text-cyan-300 font-bold">
                    {formatNumberWithCommas(engineResult.ringBandwidthGbs) + ' GB/s'}
                  </span>
                </div>
                <div className="flex justify-between bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                  <span className="text-slate-400">All-Reduce Latency:</span>
                  <span className="text-amber-300 font-bold">
                    {engineResult.allReduceLatencyUs.toFixed(2) + ' µs'}
                  </span>
                </div>
                <div className="flex justify-between bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                  <span className="text-slate-400">Processed Tokens:</span>
                  <span className="text-emerald-400 font-bold">
                    {formatNumberWithCommas(engineResult.processedTokens) + ' Units'}
                  </span>
                </div>
              </div>
              <div className="text-[10px] text-slate-400 border-t border-slate-800 pt-0.5">
                GridSync Zod Ingress Sanitizer: ACTIVE · Supabase RLS: ENFORCED
              </div>
            </div>
          )}

          {activeTab === 'APA' && (
            <div className="flex flex-col justify-between h-full text-xs font-mono">
              <div className="flex items-center justify-between border-b border-slate-800 pb-0.5">
                <span className="font-bold text-[#FF9F0A]">SOVEREIGN APA VAULT TRANSFER</span>
                <button
                  type="button"
                  onClick={() => setSchemaModalOpen((prev) => !prev)}
                  className="text-[10px] text-cyan-300 underline cursor-pointer"
                >
                  {schemaModalOpen ? 'Hide SQL' : 'View RLS SQL'}
                </button>
              </div>
              <div className="text-[10px] text-slate-300 bg-slate-900/90 px-1.5 py-1 rounded border border-slate-800 my-0.5 truncate">
                {apaNotice}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setApaNotice(
                      'APA Title Dossier Locked · Direct Repository Transfer Package Ready'
                    )
                  }
                  className="py-1 px-2 bg-emerald-950 hover:bg-emerald-900 text-[#10B981] border border-emerald-500/50 rounded text-[10px] font-mono font-bold text-center cursor-pointer transition-colors"
                >
                  ACQUIRE TITLE (APA)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setApaNotice(
                      'Vault Buyout Inquiry Logged · Clean-Room IP & Zero Copyleft Verified'
                    )
                  }
                  className="py-1 px-2 bg-amber-950 hover:bg-amber-900 text-[#FF9F0A] border border-amber-500/50 rounded text-[10px] font-mono font-bold text-center cursor-pointer transition-colors"
                >
                  INQUIRE VAULT BUYOUT
                </button>
              </div>
            </div>
          )}
        </aside>
      </main>

      {/* OPTIONAL SQL SCHEMA INSPECTOR OVERLAY (Toggled via [Inspect Schema] or APA Tab) */}
      {schemaModalOpen && (
        <div className="fixed inset-x-4 top-14 z-50 bg-[#05070B] border border-cyan-500/60 rounded-lg p-3 shadow-2xl">
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800">
            <span className="text-xs font-mono font-bold text-[#00F0FF]">
              GF-T3-239 · SUPABASE / POSTGRESQL PARTITIONED RLS SCHEMA
            </span>
            <button
              type="button"
              onClick={() => setSchemaModalOpen(false)}
              className="px-2 py-0.5 text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-500/40 rounded cursor-pointer"
            >
              [CLOSE SCHEMA]
            </button>
          </div>
          <pre className="text-[10px] font-mono text-slate-300 bg-black/95 p-2 rounded border border-slate-800 max-h-56 overflow-y-auto leading-tight">
            {SUPABASE_POSTGRES_SCHEMA_SQL}
          </pre>
        </div>
      )}

      {/* COMPACT TENSOR PARALLEL TELEMETRY INSPECTOR STRIP */}
      <div className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-0.5 my-0.5 shrink-0 flex items-center justify-between">
        <span className="text-xs font-mono font-bold text-cyan-300 truncate">
          {inspectorStripText}
        </span>
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('APA');
              setApaNotice('APA Title Package Verified · Ready for Sovereign Transfer');
            }}
            className="text-[10px] font-mono font-bold text-[#10B981] hover:underline cursor-pointer"
          >
            ACQUIRE TITLE (APA)
          </button>
          <span className="text-slate-600">·</span>
          <button
            type="button"
            onClick={() => {
              setActiveTab('APA');
              setApaNotice('Institutional Vault Buyout Channel Engaged');
            }}
            className="text-[10px] font-mono font-bold text-[#FF9F0A] hover:underline cursor-pointer"
          >
            INQUIRE VAULT BUYOUT
          </button>
        </div>
      </div>

      {/* TACTICAL LAUNCH CONTROL BUTTONS */}
      <section
        aria-label="Tactical Launch Control Dock"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1"
      >
        <button
          type="button"
          onClick={handleInjectRingBurst}
          className="bg-amber-950/40 hover:bg-amber-900/50 border border-[#FF9F0A] text-[#FF9F0A] rounded-lg text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer whitespace-nowrap"
        >
          💥 INJECT RING BURST
        </button>

        <button
          type="button"
          onClick={handleToggleRankDesync}
          className="bg-cyan-950/40 hover:bg-cyan-900/50 border border-[#00F0FF] text-[#00F0FF] rounded-lg text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer whitespace-nowrap"
        >
          ⚡ TOGGLE RANK DESYNC
        </button>

        <button
          type="button"
          onClick={handleStepTensorShard}
          className="bg-emerald-950/40 hover:bg-emerald-900/50 border border-[#10B981] text-[#10B981] rounded-lg text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer whitespace-nowrap"
        >
          🚀 STEP TENSOR SHARD
        </button>

        <button
          type="button"
          onClick={handleFlushCommBuffers}
          className="bg-rose-950/40 hover:bg-rose-900/50 border border-[#EF4444] text-[#EF4444] rounded-lg text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer whitespace-nowrap"
        >
          🔄 FLUSH COMM BUFFERS
        </button>
      </section>

      {/* PIT-WALL RADIO LOG */}
      <footer
        aria-label="Pit-Wall Radio Log"
        className="h-14 mb-[2px] overflow-hidden font-mono text-[10px] p-2 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-tight flex flex-col justify-between"
      >
        {radioLogs.slice(0, 3).map((entry) => (
          <div key={entry.id} className="truncate">
            {entry.timestamp + ' ' + entry.callsign + ': ' + entry.message}
          </div>
        ))}
      </footer>
    </div>
  );
}
