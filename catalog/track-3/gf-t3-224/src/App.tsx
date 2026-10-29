/**
 * GF-T3-224: Institutional Gamified Tensor-Parallel Ring All-Reduce Cockpit
 * SPDX-License-Identifier: MIT
 */

import React, { useEffect, useState } from 'react';
import {
  CORRIDOR_CATALOG,
  CorridorId,
  GridSyncPayloadSchema,
  RingSimulationState,
  buildOverlapSchedule,
  computeSingleNodeReferenceReduce,
  createInitialSimulationState,
  executeFullAllReduceCycle,
  injectBusThrottleAndDesync,
  stepRingAllReduceState,
} from './tensorEngine';

type CockpitTab = 'Mesh' | 'Ring' | 'Shards' | 'Overlap' | 'Transfer';

const INITIAL_RADIO_LOGS: string[] = [
  '[00:01.04] 🟢 CREW CHIEF: Ring All-Reduce step initiated across 4 ranks',
  '[00:01.08] ⚡ PIT WALL: Scatter-Reduce complete · Chunks accumulated clockwise',
  '[00:01.12] 🟢 TELEMETRY: All-Gather broadcast complete · Zero memory drift',
];

const SUPABASE_SCHEMA_PREVIEW =
  'CREATE TABLE ring_all_reduce_runs (run_id UUID, recorded_at TIMESTAMPTZ, corridor_id TEXT, world_size INT, effective_bandwidth_gbps NUMERIC, ring_efficiency_pct NUMERIC, global_parity_checksum TEXT, PRIMARY KEY (run_id, recorded_at)) PARTITION BY RANGE (recorded_at); ALTER TABLE ring_all_reduce_runs ENABLE ROW LEVEL SECURITY;';

export default function App() {
  const [simState, setSimState] = useState<RingSimulationState>(() =>
    createInitialSimulationState('TP-CORRIDOR-ALPHA')
  );
  const [activeTab, setActiveTab] = useState<CockpitTab>('Ring');
  const [selectedRankId, setSelectedRankId] = useState<number>(0);
  const [autoRunning, setAutoRunning] = useState<boolean>(false);
  const [radioLogs, setRadioLogs] = useState<string[]>(INITIAL_RADIO_LOGS);
  const [apaNotice, setApaNotice] = useState<string | null>(null);
  const [tickCounter, setTickCounter] = useState<number>(116);

  const appendRadioLog = (callsign: string, message: string) => {
    setTickCounter((prev) => {
      const next = prev + 4;
      const secs = Math.floor(next / 100);
      const hundredths = next % 100;
      const formattedTime =
        '[00:' +
        String(secs).padStart(2, '0') +
        '.' +
        String(hundredths).padStart(2, '0') +
        ']';
      const entry = formattedTime + ' ' + callsign + ': ' + message;
      setRadioLogs((prevLogs) => [entry, ...prevLogs.slice(0, 2)]);
      return next;
    });
  };

  useEffect(() => {
    if (!autoRunning) {
      return;
    }
    const timer = window.setInterval(() => {
      setSimState((prev) => stepRingAllReduceState(prev));
      appendRadioLog(
        '⚡ PIT WALL',
        'Auto-stepping clockwise ring chunk transfer across 4 ranks'
      );
    }, 950);
    return () => window.clearInterval(timer);
  }, [autoRunning]);

  const handleCorridorChange = (nextCorridor: CorridorId) => {
    const check = GridSyncPayloadSchema.safeParse({
      corridorId: nextCorridor,
      worldSize: 4,
      tensorUnits: simState.synchronizedUnits,
      busThrottleRatio: simState.busThrottled ? 0.55 : 1.0,
      commOverlapEnabled: simState.commOverlapActive,
      commandNote: 'SWITCH_CORRIDOR',
    });
    if (!check.success) {
      return;
    }
    const fresh = createInitialSimulationState(nextCorridor);
    setSimState(fresh);
    appendRadioLog(
      '🟢 CREW CHIEF',
      'Corridor switched to ' +
        CORRIDOR_CATALOG[nextCorridor].label +
        ' · BusBandwidth=' +
        String(fresh.bandwidthGbps) +
        ' GB/s'
    );
  };

  const handleStepAllReduce = () => {
    const next = stepRingAllReduceState(simState);
    setSimState(next);
    if (next.phase === 'SCATTER-REDUCE') {
      appendRadioLog(
        '🟢 CREW CHIEF',
        'Ring All-Reduce step ' +
          String(next.currentStep) +
          '/' +
          String(next.totalSteps) +
          ' initiated across 4 ranks (Scatter-Reduce clockwise)'
      );
    } else if (next.phase === 'ALL-GATHER') {
      appendRadioLog(
        '⚡ PIT WALL',
        'Scatter-Reduce complete · All-Gather step ' +
          String(next.currentStep) +
          '/' +
          String(next.totalSteps) +
          ' circulating clockwise'
      );
    } else {
      appendRadioLog(
        '🟢 TELEMETRY',
        'All-Gather broadcast complete · Zero memory drift · Hash ' +
          next.ranks[0].parityHash
      );
    }
  };

  const handleFullReduceAll = () => {
    const next = executeFullAllReduceCycle(simState);
    setSimState(next);
    appendRadioLog(
      '🟢 TELEMETRY',
      'Full 2-phase Ring All-Reduce locked across 4 ranks · Parity Checksum: OK (' +
        next.ranks[0].parityHash +
        ')'
    );
  };

  const handleInjectBusThrottle = () => {
    const next = injectBusThrottleAndDesync(simState, selectedRankId);
    setSimState(next);
    if (next.busThrottled) {
      appendRadioLog(
        '🔴 TELEMETRY',
        'Bus throttle injected on Rank ' +
          String(selectedRankId) +
          ' · Bandwidth throttled to ' +
          String(next.bandwidthGbps) +
          ' GB/s · Parity DRIFT FAULT'
      );
    } else {
      appendRadioLog(
        '🟢 CREW CHIEF',
        'NVLink Ring Bus throttle cleared · Nominal ' +
          String(next.bandwidthGbps) +
          ' GB/s restored'
      );
    }
  };

  const handleEngageCommOverlap = () => {
    const nextOverlap = !simState.commOverlapActive;
    const metrics = buildOverlapSchedule(
      simState.corridorId,
      simState.busThrottled,
      nextOverlap
    );
    setSimState({
      ...simState,
      commOverlapActive: nextOverlap,
      bandwidthGbps: metrics.bandwidthGbps,
      efficiencyPct: metrics.efficiencyPct,
      commOverlapMs: metrics.commOverlapMs,
      overlapSchedule: metrics.schedule,
    });
    appendRadioLog(
      '⚡ PIT WALL',
      nextOverlap
        ? 'Comm-Comp stream overlap engaged · All-Reduce overhead reduced to ' +
            String(metrics.commOverlapMs) +
            ' ms'
        : 'Stream overlap disengaged · Sequential compute-then-transfer mode active (' +
            String(metrics.commOverlapMs) +
            ' ms)'
    );
  };

  const handleFlushAndRealign = () => {
    setAutoRunning(false);
    const resetState = createInitialSimulationState(simState.corridorId);
    setSimState(resetState);
    setApaNotice(null);
    setRadioLogs(INITIAL_RADIO_LOGS);
  };

  const selectedRank =
    simState.ranks.find((r) => r.rankId === selectedRankId) || simState.ranks[0];
  const shortRankAddress = selectedRank.memoryAddress.split(':')[0];
  const referenceVector = computeSingleNodeReferenceReduce(
    simState.ranks.map((r) => r.initialActivations)
  );
  const activeCorridorProfile = CORRIDOR_CATALOG[simState.corridorId];
  const nitroBarWidthPct = Math.min(
    100,
    Math.max(15, Math.round((simState.bandwidthGbps / 1120) * 100))
  );

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans">
      {/* TOP COMMAND DECK: Row 1 + Row 2 */}
      <header className="w-full shrink-0 border-b border-slate-800/90 pb-1">
        {/* Top Header Row 1 */}
        <div className="flex items-center justify-between gap-1 w-full shrink-0">
          {/* Left */}
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <h1 className="text-sm md:text-base font-bold tracking-tight text-slate-100 font-mono">
              GF-T3-224
            </h1>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/50 rounded">
              TRACK 3
            </span>
          </div>

          {/* Right */}
          <div className="flex items-center gap-0.5 shrink-0">
            <label htmlFor="corridor-select" className="sr-only">
              Select Tensor-Parallel Corridor
            </label>
            <select
              id="corridor-select"
              value={simState.corridorId}
              onChange={(e) =>
                handleCorridorChange(e.target.value as CorridorId)
              }
              className="max-w-[140px] truncate text-[10px] bg-slate-900 border border-slate-700 text-slate-200 font-mono px-1.5 py-0.5 rounded focus:outline-none focus:border-[#00F0FF]"
            >
              <option value="TP-CORRIDOR-ALPHA">
                TP-CORRIDOR-ALPHA (4-GPU · NVLINK-RING-FABRIC)
              </option>
              <option value="TP-CORRIDOR-BRAVO">
                TP-CORRIDOR-BRAVO (8-GPU · HYBRID-TORUS-MESH)
              </option>
              <option value="TP-CORRIDOR-GAMMA">
                TP-CORRIDOR-GAMMA (COMM-COMP-STREAM-OVERLAP)
              </option>
              <option value="TP-CORRIDOR-DELTA">
                TP-CORRIDOR-DELTA (BUCKETED-ALL-REDUCE-FALLBACK)
              </option>
            </select>

            <button
              type="button"
              onClick={handleFullReduceAll}
              className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-900 hover:bg-slate-800 text-[#00F0FF] border border-[#00F0FF]/40 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              [Reduce]
            </button>
            <button
              type="button"
              onClick={handleStepAllReduce}
              className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/40 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              [Step]
            </button>
            <button
              type="button"
              onClick={() => setAutoRunning((v) => !v)}
              className={
                'px-1.5 py-0.5 text-[10px] font-mono border rounded transition-colors cursor-pointer whitespace-nowrap shrink-0 ' +
                (autoRunning
                  ? 'bg-[#FF9F0A]/20 text-[#FF9F0A] border-[#FF9F0A]'
                  : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-amber-500/40')
              }
            >
              [Run]
            </button>
          </div>
        </div>

        {/* Top Header Row 2 */}
        <p className="text-xs text-slate-400 text-center mt-0.5 truncate">
          Tensor-Parallel Fabric · Ring All-Reduce Topology · Comm-Comp Stream Overlap
        </p>
      </header>

      {/* 4-CARD ARCADE HUD RIBBON */}
      <section
        aria-label="Telemetry HUD Ribbon"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 my-1.5 w-full shrink-0"
      >
        {/* Card 1: FABRIC NITRO */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
            FABRIC NITRO
          </div>
          <div className="text-base font-bold font-mono text-cyan-400 tracking-tight leading-tight">
            {simState.bandwidthGbps} GB/s
          </div>
          <div className="w-full bg-slate-950 h-1 rounded overflow-hidden border border-slate-800 my-0.5">
            <div
              className={
                'h-full transition-all duration-150 ' +
                (simState.busThrottled ? 'bg-[#FF9F0A]' : 'bg-cyan-400')
              }
              style={{ width: String(nitroBarWidthPct) + '%' }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">
            NVLink Ring Bus
          </div>
        </div>

        {/* Card 2: SYNC STREAK */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
            SYNC STREAK
          </div>
          <div className="flex items-center justify-between gap-1">
            <span className="text-base font-bold font-mono text-emerald-400 tracking-tight leading-tight">
              {simState.efficiencyPct}%
            </span>
            <span className="px-1.5 py-0.5 bg-[#FF9F0A]/15 border border-[#FF9F0A]/40 rounded text-[10px] font-mono text-[#FF9F0A] whitespace-nowrap shrink-0">
              🔥 {simState.passesCompleted} PASSES
            </span>
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">
            Overhead: {simState.commOverlapMs} ms
          </div>
        </div>

        {/* Card 3: ACTIVE GEAR */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
            ACTIVE GEAR
          </div>
          <div className="text-base font-bold font-mono text-emerald-400 tracking-tight leading-tight">
            TP SIZE: 4
          </div>
          <div className="flex items-center justify-between gap-1 text-[10px] font-mono mt-0.5">
            <span className="text-slate-400">[R0|R1|R2|R3]</span>
            <div className="flex items-center gap-0.5">
              {[0, 1, 2, 3].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelectedRankId(r)}
                  className={
                    'px-1 py-0.2 rounded border transition-colors cursor-pointer ' +
                    (selectedRankId === r
                      ? 'bg-cyan-400/20 border-cyan-400 text-cyan-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200')
                  }
                >
                  R{r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
            TOKEN SCORE
          </div>
          <div className="flex items-center justify-between gap-1">
            <span className="text-base font-bold font-mono text-slate-100 tracking-tight leading-tight">
              {simState.synchronizedUnits.toLocaleString('en-US')}
            </span>
            <span className="px-1.5 py-0.5 bg-emerald-500/15 border border-emerald-500/40 rounded text-[10px] font-mono text-emerald-400 whitespace-nowrap shrink-0">
              +{simState.syncXpK}k XP
            </span>
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">
            Parity: {simState.parityStatus} · CRC Valid
          </div>
        </div>
      </section>

      {/* 5 HORIZONTAL TABS */}
      <nav
        aria-label="Topology Views"
        className="grid grid-cols-5 gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg my-1 w-full text-center shrink-0"
      >
        {(['Mesh', 'Ring', 'Shards', 'Overlap', 'Transfer'] as CockpitTab[]).map(
          (tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={
                'py-1 px-2 text-xs font-mono font-medium rounded transition-colors cursor-pointer whitespace-nowrap shrink-0 ' +
                (activeTab === tab
                  ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/50'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60')
              }
            >
              {tab}
            </button>
          )
        )}
      </nav>

      {/* INTERACTIVE RING VISUALIZER BAY */}
      <main className="flex-1 min-h-0 w-full bg-slate-950/90 border border-slate-800 rounded-lg p-2 flex flex-col justify-between overflow-hidden">
        {/* Top Sub-bar Inside Simulation Bay */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-1 shrink-0">
          <div className="flex items-center gap-2 text-[11px] font-mono truncate">
            <span className="text-[#00F0FF] font-semibold">
              RING TOPOLOGY BAY [{activeTab.toUpperCase()}]
            </span>
            <span className="text-slate-500">·</span>
            <span
              className={
                simState.phase === 'FAULT'
                  ? 'text-[#EF4444] font-semibold'
                  : 'text-[#10B981] font-semibold'
              }
            >
              {simState.phase === 'FAULT' ? '⚡ FAULT' : '✓ ' + simState.phase}
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-[10px] shrink-0">
            <span className="text-slate-400">
              Step {simState.currentStep}/{simState.totalSteps}
            </span>
          </div>
        </div>

        {/* Center Split: 4-GPU Clockwise Ring Grid + Contextual Mode Deck */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-2 my-1 overflow-hidden">
          {/* 4 GPU Ranks Clockwise Ring Layout (Left 7 Cols) */}
          <div className="lg:col-span-7 grid grid-cols-2 gap-1.5 h-full min-h-0">
            {[0, 1, 3, 2].map((rankIdx) => {
              const rank = simState.ranks[rankIdx];
              const isSelected = selectedRankId === rank.rankId;
              const nextClockwise = (rank.rankId + 1) % simState.worldSize;
              const activeLink = simState.activeLinks.find(
                (l) => l.fromRank === rank.rankId
              );

              return (
                <div
                  key={rank.rankId}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedRankId(rank.rankId)}
                  onMouseEnter={() => setSelectedRankId(rank.rankId)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSelectedRankId(rank.rankId);
                    }
                  }}
                  className={
                    'rounded-lg p-1.5 border transition-all cursor-pointer flex flex-col justify-between overflow-hidden ' +
                    (rank.packetDropFault
                      ? 'bg-[#EF4444]/10 border-[#EF4444]'
                      : isSelected
                      ? 'bg-slate-900 border-[#00F0FF]'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700')
                  }
                >
                  {/* Rank Card Header */}
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold font-mono text-slate-100">
                        Rank {rank.rankId}
                      </span>
                      <span className="text-[10px] font-mono text-[#00F0FF]">
                        → R{nextClockwise}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      {rank.memoryAddress.split(':')[0]}
                    </span>
                  </div>

                  {/* 4 Partition Chunks C0..C3 inside Rank */}
                  <div className="grid grid-cols-4 gap-1 my-0.5">
                    {rank.chunks.map((chunk) => {
                      const isOwnerChunk =
                        chunk.chunkIndex === rank.reducedChunkOwnerIndex;
                      return (
                        <div
                          key={chunk.chunkIndex}
                          className={
                            'px-1 py-0.5 rounded border text-center font-mono text-[10px] ' +
                            (chunk.isFullyReduced
                              ? 'bg-[#10B981]/20 border-[#10B981]/60 text-[#10B981]'
                              : isOwnerChunk
                              ? 'bg-[#00F0FF]/15 border-[#00F0FF]/50 text-[#00F0FF]'
                              : 'bg-slate-950 border-slate-800 text-slate-300')
                          }
                        >
                          <div className="text-[9px] text-slate-400">
                            C{chunk.chunkIndex} ({chunk.accumulatedCount}/4)
                          </div>
                          <div className="font-semibold truncate">
                            {chunk.values[0].toFixed(1)}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Rank Footer: Clockwise Link & Parity */}
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>
                      {activeLink
                        ? 'TX C' +
                          String(activeLink.chunkIndex) +
                          ' (' +
                          String(activeLink.payloadPreview) +
                          ')'
                        : 'RING READY'}
                    </span>
                    <span
                      className={
                        rank.packetDropFault
                          ? 'text-[#EF4444]'
                          : 'text-[#10B981]'
                      }
                    >
                      {rank.parityHash}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Contextual Telemetry & Tab Inspector Panel (Right 5 Cols) */}
          <div className="lg:col-span-5 bg-slate-900/75 border border-slate-800 rounded-lg p-2 flex flex-col justify-between overflow-hidden">
            {activeTab === 'Overlap' && (
              <div className="flex flex-col justify-between h-full">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#00F0FF]">
                  <span>COMM-COMP PIPELINED BUCKET OVERLAP</span>
                  <span>
                    {simState.commOverlapActive ? 'OVERLAP ON' : 'SEQUENTIAL'}
                  </span>
                </div>
                <div className="space-y-1 my-1">
                  {simState.overlapSchedule.map((b) => (
                    <div
                      key={b.bucketId}
                      className="text-[10px] font-mono bg-slate-950/90 border border-slate-800 rounded px-2 py-1 flex items-center justify-between"
                    >
                      <span className="text-slate-300">
                        Bucket B{b.bucketId}
                      </span>
                      <span className="text-emerald-400">
                        Comp: {b.computeStartMs}s+{b.computeDurationMs}ms
                      </span>
                      <span className="text-[#00F0FF]">
                        DMA: {b.commStartMs}s+{b.commDurationMs}ms
                      </span>
                      <span className="text-[#FF9F0A]">
                        Saved: {b.overlapSavedMs}ms
                      </span>
                    </div>
                  ))}
                </div>
                <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
                  <span>Compute Stream: Matrix Multiply</span>
                  <span>Transfer Stream: NVLink Ring DMA</span>
                </div>
              </div>
            )}

            {activeTab === 'Shards' && (
              <div className="flex flex-col justify-between h-full">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#00F0FF]">
                  <span>
                    SHARDED WEIGHTS & NUMERICAL PARITY (RANK {selectedRank.rankId})
                  </span>
                  <span>Shape {selectedRank.weightShardShape}</span>
                </div>
                <div className="grid grid-cols-2 gap-1 my-1 font-mono text-[10px]">
                  <div className="bg-slate-950 border border-slate-800 rounded p-1.5">
                    <div className="text-slate-400">Local Shard Slice [0..3]</div>
                    <div className="text-slate-100 font-semibold mt-0.5">
                      {selectedRank.chunks[0].values
                        .map((v) => v.toFixed(2))
                        .join(', ')}
                    </div>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded p-1.5">
                    <div className="text-slate-400">Single-Node Ref [0..3]</div>
                    <div className="text-[#10B981] font-semibold mt-0.5">
                      {referenceVector
                        .slice(0, 4)
                        .map((v) => v.toFixed(2))
                        .join(', ')}
                    </div>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
                  <span>Column-Parallel → Row-Parallel All-Reduce</span>
                  <span className="text-[#10B981]">Memory Drift: 0.0000 nats</span>
                </div>
              </div>
            )}

            {activeTab === 'Transfer' && (
              <div className="flex flex-col justify-between h-full">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#FF9F0A]">
                  <span>SUPABASE RLS SCHEMA & APA VAULT TRANSFER</span>
                  <span>CLEAN ROOM MIT</span>
                </div>
                <pre className="text-[9px] font-mono text-slate-300 bg-slate-950 border border-slate-800 rounded p-1.5 overflow-hidden whitespace-pre-wrap leading-tight my-1">
                  {SUPABASE_SCHEMA_PREVIEW}
                </pre>
                <div className="flex items-center justify-between gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setApaNotice(
                        'APA Title Package Verified · Ready for Repository Handover'
                      );
                      appendRadioLog(
                        '🟢 CREW CHIEF',
                        'ACQUIRE TITLE (APA) dossier locked · Clean-room SBOM verified'
                      );
                    }}
                    className="flex-1 py-1 px-2 text-[10px] font-mono font-semibold bg-[#10B981]/20 hover:bg-[#10B981]/30 text-[#10B981] border border-[#10B981]/60 rounded cursor-pointer whitespace-nowrap"
                  >
                    ACQUIRE TITLE (APA)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setApaNotice(
                        'Vault Buyout Telemetry Exported · Zero-SaaS SLA Confirmed'
                      );
                      appendRadioLog(
                        '⚡ PIT WALL',
                        'INQUIRE VAULT BUYOUT logged · Direct repository transfer ready'
                      );
                    }}
                    className="flex-1 py-1 px-2 text-[10px] font-mono font-semibold bg-[#00F0FF]/20 hover:bg-[#00F0FF]/30 text-[#00F0FF] border border-[#00F0FF]/60 rounded cursor-pointer whitespace-nowrap"
                  >
                    INQUIRE VAULT BUYOUT
                  </button>
                </div>
              </div>
            )}

            {(activeTab === 'Ring' || activeTab === 'Mesh') && (
              <div className="flex flex-col justify-between h-full">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#00F0FF]">
                  <span>
                    {activeTab === 'Mesh'
                      ? 'NVLINK HYBRID TORUS MESH MATRIX'
                      : '2-PHASE CLOCKWISE RING SCHEDULE'}
                  </span>
                  <span>{activeCorridorProfile.id}</span>
                </div>

                <div className="space-y-1 my-1 font-mono text-[10px]">
                  <div className="bg-slate-950 border border-slate-800 rounded px-2 py-1 flex items-center justify-between">
                    <span className="text-slate-300">
                      Phase 1: Scatter-Reduce (Steps 1..3)
                    </span>
                    <span className="text-[#00F0FF]">
                      Accumulates 1/N shard clockwise
                    </span>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded px-2 py-1 flex items-center justify-between">
                    <span className="text-slate-300">
                      Phase 2: All-Gather (Steps 4..6)
                    </span>
                    <span className="text-[#10B981]">
                      Broadcasts reduced chunks clockwise
                    </span>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded px-2 py-1 flex items-center justify-between">
                    <span className="text-slate-400">
                      Volume Formula: 2*(N-1)/N * M
                    </span>
                    <span className="text-[#FF9F0A]">
                      Bus Bandwidth: {simState.bandwidthGbps} GB/s
                    </span>
                  </div>
                </div>

                <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between pt-0.5">
                  <span>Clockwise Ring: R0 → R1 → R2 → R3 → R0</span>
                  <span className="text-emerald-400">Zero Memory Drift</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Clean Unclipped Rank Telemetry Inspector Bar */}
        <div className="bg-slate-900 border border-slate-700/80 rounded px-2.5 py-1 flex items-center justify-between gap-2 shrink-0">
          <div className="text-[11px] font-mono text-cyan-300 truncate">
            {'INSPECTING RANK ' +
              String(selectedRank.rankId) +
              ' · ' +
              shortRankAddress +
              ' · SHARD ' +
              selectedRank.weightShardShape +
              ' · ' +
              selectedRank.parityHash}
          </div>
          {apaNotice && (
            <span className="text-[10px] font-mono text-[#FF9F0A] hidden md:inline shrink-0">
              {apaNotice}
            </span>
          )}
        </div>
      </main>

      {/* TACTICAL LAUNCH CONTROL BUTTONS (2x2 on narrow, 4-col on desktop, zero ellipsis) */}
      <section
        aria-label="Tactical Launch Controls"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1 w-full shrink-0 my-1"
      >
        <button
          type="button"
          onClick={handleInjectBusThrottle}
          className="text-xs font-bold py-1.5 px-1 text-center bg-slate-900/95 hover:bg-[#FF9F0A]/15 text-[#FF9F0A] border border-[#FF9F0A] rounded-lg font-mono tracking-tight transition-colors cursor-pointer whitespace-nowrap"
        >
          💥 THROTTLE BUS
        </button>

        <button
          type="button"
          onClick={handleEngageCommOverlap}
          className="text-xs font-bold py-1.5 px-1 text-center bg-slate-900/95 hover:bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.22)] rounded-lg font-mono tracking-tight transition-colors cursor-pointer whitespace-nowrap"
        >
          ⚡ COMM OVERLAP
        </button>

        <button
          type="button"
          onClick={handleStepAllReduce}
          className="text-xs font-bold py-1.5 px-1 text-center bg-slate-900/95 hover:bg-[#10B981]/15 text-[#10B981] border border-[#10B981] rounded-lg font-mono tracking-tight transition-colors cursor-pointer whitespace-nowrap"
        >
          🚀 STEP ALL-REDUCE
        </button>

        <button
          type="button"
          onClick={handleFlushAndRealign}
          className="text-xs font-bold py-1.5 px-1 text-center bg-slate-900/95 hover:bg-rose-500/15 text-rose-400 border border-rose-500 rounded-lg font-mono tracking-tight transition-colors cursor-pointer whitespace-nowrap"
        >
          🔄 RE-ALIGN RINGS
        </button>
      </section>

      {/* PIT-WALL RADIO LOG */}
      <footer
        aria-label="Pit-Wall Radio Log"
        className="h-14 overflow-hidden font-mono text-[10px] p-2 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-300 leading-tight flex flex-col justify-between"
      >
        {radioLogs.slice(0, 3).map((line, index) => (
          <div key={index} className="truncate">
            {line}
          </div>
        ))}
      </footer>
    </div>
  );
}
