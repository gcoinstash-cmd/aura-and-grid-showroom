/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * GF-T3-289: Ultra-Wide Dynamic Asynchronous Pipeline Interconnect
 * and Layer-Partitioned Micro-Batch Streaming Cockpit.
 * 100% Clean-Room Implementation · Zero Currency Characters
 */

import React, { useState } from 'react';

type TabKey = 'Mesh' | 'Pipe' | 'Btch' | 'Stats' | 'APA';

interface StageTelemetry {
  id: number;
  code: string;
  title: string;
  hexPtr: string;
  inspectorPtr: string;
  tokensK: number;
  batchTag: string;
  latencyMs: string;
  syncPct: number;
  stateLabel: string;
  pipeHealth: string;
  forwardCount: number;
  backwardCount: number;
}

const CORRIDORS: string[] = [
  'PIPE-CORRIDOR-ALPHA (DYNAMIC-PIPELINE-INTERCONNECT-FABRIC · 44800-GB/S)',
  'PIPE-CORRIDOR-BRAVO (MICRO-BATCH-STREAMING-ENGINE)',
  'PIPE-CORRIDOR-GAMMA (ASYNC-STAGE-BUBBLE-MINIMIZER)',
  'PIPE-CORRIDOR-DELTA (FALLBACK-MONOLITHIC-FORWARD-PASS)',
];

const INITIAL_STAGES: StageTelemetry[] = [
  {
    id: 0,
    code: 'S0',
    title: 'Stage 0 (S0)',
    hexPtr: '0x16000',
    inspectorPtr: '0x16000',
    tokensK: 256,
    batchTag: '8-UB',
    latencyMs: '0.02ms',
    syncPct: 100,
    stateLabel: 'STREAMING · LOCKED',
    pipeHealth: 'OK',
    forwardCount: 16,
    backwardCount: 16,
  },
  {
    id: 1,
    code: 'S1',
    title: 'Stage 1 (S1)',
    hexPtr: '0x16010',
    inspectorPtr: '0x16010',
    tokensK: 256,
    batchTag: '8-UB',
    latencyMs: '0.02ms',
    syncPct: 100,
    stateLabel: 'STREAMING · LOCKED',
    pipeHealth: 'OK',
    forwardCount: 16,
    backwardCount: 16,
  },
  {
    id: 2,
    code: 'S2',
    title: 'Stage 2 (S2)',
    hexPtr: '0x16020',
    inspectorPtr: '0x16020',
    tokensK: 256,
    batchTag: '8-UB',
    latencyMs: '0.02ms',
    syncPct: 100,
    stateLabel: 'STREAMING · LOCKED',
    pipeHealth: 'OK',
    forwardCount: 16,
    backwardCount: 16,
  },
  {
    id: 3,
    code: 'S3',
    title: 'Stage 3 (S3)',
    hexPtr: '0x16030',
    inspectorPtr: '0x16030',
    tokensK: 256,
    batchTag: '8-UB',
    latencyMs: '0.02ms',
    syncPct: 100,
    stateLabel: 'STREAMING · LOCKED',
    pipeHealth: 'OK',
    forwardCount: 16,
    backwardCount: 16,
  },
  {
    id: 4,
    code: 'S4',
    title: 'Stage 4 (S4)',
    hexPtr: '0x16040',
    inspectorPtr: '0x16040',
    tokensK: 256,
    batchTag: '8-UB',
    latencyMs: '0.02ms',
    syncPct: 100,
    stateLabel: 'STREAMING · LOCKED',
    pipeHealth: 'OK',
    forwardCount: 16,
    backwardCount: 16,
  },
  {
    id: 5,
    code: 'S5',
    title: 'Stage 5 (S5)',
    hexPtr: '0x16050',
    inspectorPtr: '0x16050',
    tokensK: 256,
    batchTag: '8-UB',
    latencyMs: '0.02ms',
    syncPct: 100,
    stateLabel: 'STREAMING · LOCKED',
    pipeHealth: 'OK',
    forwardCount: 16,
    backwardCount: 16,
  },
  {
    id: 6,
    code: 'S6',
    title: 'Stage 6 (S6)',
    hexPtr: '0x16060',
    inspectorPtr: '0x16060',
    tokensK: 256,
    batchTag: '8-UB',
    latencyMs: '0.02ms',
    syncPct: 100,
    stateLabel: 'STREAMING · LOCKED',
    pipeHealth: 'OK',
    forwardCount: 16,
    backwardCount: 16,
  },
  {
    id: 7,
    code: 'S7',
    title: 'Stage 7 (S7)',
    hexPtr: '0x16070',
    inspectorPtr: '0x16070',
    tokensK: 256,
    batchTag: '8-UB',
    latencyMs: '0.02ms',
    syncPct: 100,
    stateLabel: 'STREAMING · LOCKED',
    pipeHealth: 'OK',
    forwardCount: 16,
    backwardCount: 16,
  },
];

const INITIAL_RADIO_LOGS: string[] = [
  '[00:01.04] 🟢 CREW CHIEF: Asynchronous pipeline interconnect and layer-partitioned micro-batch streaming engine initialized · 8 stages linked',
  '[00:01.08] 🟢 TELEMETRY: 1F1B micro-batch scheduling verified at 44,800 GB/s with zero bubble stall overhead',
];

function formatNumberWithCommas(value: number): string {
  return value.toLocaleString('en-US');
}

export default function App() {
  const [selectedCorridor, setSelectedCorridor] = useState<string>(CORRIDORS[0]);
  const [activeTab, setActiveTab] = useState<TabKey>('Mesh');
  const [stages, setStages] = useState<StageTelemetry[]>(INITIAL_STAGES);
  const [selectedStageIdx, setSelectedStageIdx] = useState<number>(3);
  const [throughputGbs, setThroughputGbs] = useState<number>(44800);
  const [stageLatencyUs, setStageLatencyUs] = useState<string>('0.01 µs');
  const [activeStageCount, setActiveStageCount] = useState<number>(8);
  const [processedTokens, setProcessedTokens] = useState<number>(8320000);
  const [engineXpK, setEngineXpK] = useState<number>(75.0);
  const [pipelineStateLabel, setPipelineStateLabel] = useState<string>('Streaming Active');
  const [stallActive, setStallActive] = useState<boolean>(false);
  const [burstActive, setBurstActive] = useState<boolean>(false);
  const [stepCount, setStepCount] = useState<number>(1);
  const [microBatchCountN, setMicroBatchCountN] = useState<number>(64);
  const [vectorSig, setVectorSig] = useState<string>('[5.01, 5.05, 5.02, 5.04]');
  const [radioLogs, setRadioLogs] = useState<string[]>(INITIAL_RADIO_LOGS);
  const [apaStatusBanner, setApaStatusBanner] = useState<string>(
    'SOVEREIGN APA TITLE READY · CLUSTER-006 · UNIT #289 · ZERO LICENSING'
  );

  const selectedStage = stages[selectedStageIdx] || stages[3];

  // Deterministic 1F1B Pipeline Math: T_pipe = (K - 1) * t_bubble + N * t_stage
  const numStagesK = 8;
  const tBubbleUs = stallActive ? 0.0085 : 0.0014;
  const tStageUs = burstActive ? 0.008 : 0.01;
  const bubbleTimeUs = (numStagesK - 1) * tBubbleUs;
  const computeTimeUs = microBatchCountN * tStageUs;
  const totalPipeTimeUs = bubbleTimeUs + computeTimeUs;
  const bubbleFractionPct = ((bubbleTimeUs / totalPipeTimeUs) * 100).toFixed(2);
  const scheduleEfficiencyPct = (100 - parseFloat(bubbleFractionPct)).toFixed(2);

  const pushRadioLines = (line1: string, line2: string) => {
    setRadioLogs([line1, line2]);
  };

  const handleCorridorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextCorridor = e.target.value;
    setSelectedCorridor(nextCorridor);
    if (nextCorridor === CORRIDORS[0]) {
      setThroughputGbs(44800);
      setStageLatencyUs('0.01 µs');
      setPipelineStateLabel('Streaming Active');
    } else if (nextCorridor === CORRIDORS[1]) {
      setThroughputGbs(46200);
      setStageLatencyUs('0.01 µs');
      setPipelineStateLabel('Micro-Batch Lock');
    } else if (nextCorridor === CORRIDORS[2]) {
      setThroughputGbs(45120);
      setStageLatencyUs('0.01 µs');
      setPipelineStateLabel('Zero-Bubble Sync');
    } else {
      setThroughputGbs(38400);
      setStageLatencyUs('0.03 µs');
      setPipelineStateLabel('Fallback Forward');
    }
    pushRadioLines(
      '[00:02.10] 🟢 CREW CHIEF: Switched active pipeline corridor to ' + nextCorridor,
      '[00:02.14] 🟢 TELEMETRY: Non-blocking P2P NVLink/RoCEv2 fabric re-locked across 8 stages'
    );
  };

  const handleInjectStreamBurst = () => {
    setBurstActive(true);
    setStallActive(false);
    setThroughputGbs(51200);
    setStageLatencyUs('0.01 µs');
    setProcessedTokens((prev) => prev + 640000);
    setEngineXpK((prev) => Number((prev + 12.5).toFixed(1)));
    setPipelineStateLabel('Streaming Active');
    setVectorSig('[5.42, 5.48, 5.45, 5.50]');
    setStages((prev) =>
      prev.map((s) => ({
        ...s,
        tokensK: s.tokensK + 64,
        batchTag: '16-UB',
        latencyMs: '0.01ms',
        syncPct: 100,
        stateLabel: 'STREAMING · LOCKED',
        pipeHealth: 'OK',
        forwardCount: s.forwardCount + 4,
        backwardCount: s.backwardCount + 4,
      }))
    );
    pushRadioLines(
      '[00:02.45] 💥 CREW CHIEF: Pipeline stream burst injected · 51,200 GB/s P2P saturation active',
      '[00:02.49] 🟢 TELEMETRY: 16-UB micro-batch tensors streaming across S0..S7 with zero CPU round-trips'
    );
  };

  const handleToggleBubbleStall = () => {
    const nextStall = !stallActive;
    setStallActive(nextStall);
    setBurstActive(false);
    if (nextStall) {
      setThroughputGbs(39600);
      setStageLatencyUs('0.04 µs');
      setPipelineStateLabel('Re-Balancing Stall');
      setVectorSig('[4.82, 4.79, 4.91, 4.88]');
      setStages((prev) =>
        prev.map((s, idx) =>
          idx === 2 || idx === 5
            ? {
                ...s,
                latencyMs: '0.05ms',
                syncPct: 96,
                stateLabel: 'STALL · REBALANCING',
                pipeHealth: 'SYNC-WAIT',
              }
            : {
                ...s,
                latencyMs: '0.02ms',
                syncPct: 99,
                stateLabel: 'STREAMING · LOCKED',
                pipeHealth: 'OK',
              }
        )
      );
      pushRadioLines(
        '[00:03.12] ⚡ CREW CHIEF: Bubble stall spike injected on S2/S5 · Force micro-batch re-balancing engaged',
        '[00:03.16] 🟡 TELEMETRY: Sub-microsecond barrier synchronization compensating inter-stage skew'
      );
    } else {
      setThroughputGbs(44800);
      setStageLatencyUs('0.01 µs');
      setPipelineStateLabel('Streaming Active');
      setVectorSig('[5.01, 5.05, 5.02, 5.04]');
      setStages((prev) =>
        prev.map((s) => ({
          ...s,
          batchTag: '8-UB',
          latencyMs: '0.02ms',
          syncPct: 100,
          stateLabel: 'STREAMING · LOCKED',
          pipeHealth: 'OK',
        }))
      );
      pushRadioLines(
        '[00:03.40] 🟢 CREW CHIEF: Bubble stall spike cleared · 1F1B steady-state restored across S0..S7',
        '[00:03.44] 🟢 TELEMETRY: 1F1B micro-batch scheduling verified at 44,800 GB/s with zero bubble stall overhead'
      );
    }
  };

  const handleStep1F1BPass = () => {
    const nextStep = stepCount + 1;
    setStepCount(nextStep);
    setProcessedTokens((prev) => prev + 256000);
    setEngineXpK((prev) => Number((prev + 5.0).toFixed(1)));
    setPipelineStateLabel('Streaming Active');
    setStages((prev) =>
      prev.map((s) => ({
        ...s,
        tokensK: s.tokensK + 32,
        latencyMs: '0.02ms',
        syncPct: 100,
        stateLabel: 'STREAMING · LOCKED',
        pipeHealth: 'OK',
        forwardCount: s.forwardCount + 1,
        backwardCount: s.backwardCount + 1,
      }))
    );
    pushRadioLines(
      '[00:04.05] 🚀 CREW CHIEF: Step 1F1B micro-batch pass #' +
        String(nextStep) +
        ' committed across 8 stages',
      '[00:04.09] 🟢 TELEMETRY: Forward and backward activations interleaved · Sub-microsecond barrier locked'
    );
  };

  const handleFlushArenas = () => {
    setBurstActive(false);
    setStallActive(false);
    setThroughputGbs(44800);
    setStageLatencyUs('0.01 µs');
    setActiveStageCount(8);
    setProcessedTokens(8320000);
    setEngineXpK(75.0);
    setPipelineStateLabel('Streaming Active');
    setStepCount(1);
    setMicroBatchCountN(64);
    setVectorSig('[5.01, 5.05, 5.02, 5.04]');
    setStages(INITIAL_STAGES);
    setSelectedStageIdx(3);
    pushRadioLines(
      '[00:01.04] 🟢 CREW CHIEF: Asynchronous pipeline interconnect and layer-partitioned micro-batch streaming engine initialized · 8 stages linked',
      '[00:01.08] 🟢 TELEMETRY: 1F1B micro-batch scheduling verified at 44,800 GB/s with zero bubble stall overhead'
    );
  };

  const tabs: TabKey[] = ['Mesh', 'Pipe', 'Btch', 'Stats', 'APA'];

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans select-none">
      {/* TOP HEADER BLOCK */}
      <header className="w-full shrink-0 flex flex-col gap-0.5 border-b border-slate-800/90 pb-1">
        {/* Top Header Row 1 */}
        <div className="flex items-center justify-between gap-1 w-full shrink-0">
          {/* Left: GF-T3-289 and cyan badge FLAGSHIP */}
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <h1 className="text-sm md:text-base font-mono font-extrabold tracking-tight text-white">
              GF-T3-289
            </h1>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-cyan-500/20 text-[#00F0FF] border border-cyan-400/50 rounded">
              FLAGSHIP
            </span>
            <span className="hidden sm:inline text-[10px] font-mono text-amber-400/90">
              UNIT #289 · CLUSTER-006
            </span>
          </div>

          {/* Right: Compact corridor dropdown and micro action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <select
              aria-label="Select Pipeline Corridor"
              value={selectedCorridor}
              onChange={handleCorridorChange}
              className="max-w-[110px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 text-cyan-300 border border-slate-700 rounded focus:outline-none focus:border-cyan-400"
            >
              {CORRIDORS.map((corridor) => (
                <option key={corridor} value={corridor}>
                  {corridor}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setActiveTab('Pipe')}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 rounded cursor-pointer"
            >
              [Pipe]
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('Btch')}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 rounded cursor-pointer"
            >
              [Batch]
            </button>
            <button
              type="button"
              onClick={handleStep1F1BPass}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/50 rounded cursor-pointer"
            >
              [Run]
            </button>
          </div>
        </div>

        {/* Top Header Row 2 */}
        <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap overflow-hidden text-ellipsis">
          Pipeline Parallelism · Micro-Batch Streaming · Zero Bubble
        </div>
      </header>

      {/* 4-CARD ARCADE HUD RIBBON (2x2 Grid above the fold) */}
      <section
        aria-label="Arcade HUD Telemetry Ribbon"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-0.5"
      >
        {/* Card 1: PIPE NITRO */}
        <div className="bg-slate-900/90 border border-cyan-500/40 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-300">
            <span className="font-bold tracking-wider text-cyan-300">PIPE NITRO</span>
            <span className="text-[10px] text-slate-400">
              Pipeline Throughput: {formatNumberWithCommas(throughputGbs)} GB/s
            </span>
          </div>
          <div className="flex items-baseline justify-between my-0.5">
            <span className="font-mono text-lg font-bold text-[#00F0FF] tabular-nums">
              {formatNumberWithCommas(throughputGbs)} GB/s
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">
              {scheduleEfficiencyPct}% EFF
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden my-0.5">
            <div
              className="bg-[#00F0FF] h-full transition-all duration-150"
              style={{ width: burstActive ? '100%' : stallActive ? '78%' : '94%' }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Pipeline Throughput Saturation
          </div>
        </div>

        {/* Card 2: STAGE STREAK */}
        <div className="bg-slate-900/90 border border-amber-500/40 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-300">
            <span className="font-bold tracking-wider text-[#FF9F0A]">STAGE STREAK</span>
            <span className="px-1.5 py-0.2 bg-amber-500/20 border border-amber-400/50 rounded text-[10px] font-bold text-amber-300">
              🔥 1F1B-SYNC
            </span>
          </div>
          <div className="flex items-baseline justify-between my-0.5">
            <span className="font-mono text-lg font-bold text-white tabular-nums">
              {stageLatencyUs}
            </span>
            <span className="text-[10px] font-mono text-amber-300">
              BUBBLE: {bubbleFractionPct}%
            </span>
          </div>
          <div className="text-[10px] font-mono text-slate-300 flex justify-between">
            <span>Stage Latency</span>
            <span className="text-slate-400">Stage Latency: {stageLatencyUs}</span>
          </div>
        </div>

        {/* Card 3: ACTIVE STAGES */}
        <div className="bg-slate-900/90 border border-emerald-500/40 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-300">
            <span className="font-bold tracking-wider text-emerald-300">ACTIVE STAGES</span>
            <span className="text-emerald-400 font-bold">
              Active Stages: {String(activeStageCount)} Stages
            </span>
          </div>
          <div className="flex items-baseline justify-between my-0.5">
            <span className="font-mono text-lg font-bold text-emerald-300 tabular-nums">
              STAGES: {String(activeStageCount)}/8
            </span>
            <span className="text-[10px] font-mono text-cyan-300">[S0..S7]</span>
          </div>
          <div className="grid grid-cols-8 gap-0.5 w-full">
            {stages.map((st, idx) => (
              <button
                key={st.code}
                type="button"
                onClick={() => setSelectedStageIdx(idx)}
                className={
                  'text-[9px] font-mono font-bold rounded py-0.2 text-center cursor-pointer ' +
                  (selectedStageIdx === idx
                    ? 'bg-[#00F0FF] text-black'
                    : st.stateLabel.includes('STALL')
                    ? 'bg-amber-500/40 text-amber-200'
                    : 'bg-emerald-500/25 text-emerald-300')
                }
              >
                {st.code}
              </button>
            ))}
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="bg-slate-900/90 border border-cyan-500/40 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-300">
            <span className="font-bold tracking-wider text-cyan-300">TOKEN SCORE</span>
            <span className="px-1.5 py-0.2 bg-cyan-500/20 border border-cyan-400/40 rounded text-[10px] font-bold text-[#00F0FF]">
              +{engineXpK.toFixed(1)}k ENGINE XP
            </span>
          </div>
          <div className="flex items-baseline justify-between my-0.5">
            <span className="font-mono text-lg font-bold text-white tabular-nums">
              {formatNumberWithCommas(processedTokens)} UNITS
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Processed Tokens: {formatNumberWithCommas(processedTokens)} Units
            </span>
          </div>
          <div className="text-[10px] font-mono text-emerald-300 truncate">
            Pipeline State: {pipelineStateLabel}
          </div>
        </div>
      </section>

      {/* 5 HORIZONTAL TABS */}
      <nav
        aria-label="Cockpit Mode Tabs"
        className="grid grid-cols-5 gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg my-1 w-full text-center shrink-0"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={
                'py-1 text-xs font-mono font-bold rounded transition-colors cursor-pointer whitespace-nowrap ' +
                (isActive
                  ? 'bg-[#00F0FF] text-slate-950 shadow-sm'
                  : 'bg-slate-950/60 text-slate-300 hover:bg-slate-800 hover:text-white')
              }
            >
              {tab}
            </button>
          );
        })}
      </nav>

      {/* STREAMLINED MESH INFO SUBHEADER (Strictly clean of action buttons) */}
      <div className="text-[10px] font-mono whitespace-nowrap overflow-hidden text-slate-300 px-2 py-0.5 bg-slate-950/90 border border-slate-800/80 rounded shrink-0 flex items-center justify-between">
        <span>
          VIEW: MESH · PTR: 0x15F8DC0 · MODE: PIPELINE_PARALLEL · STAGES: 8 · VEC: {vectorSig}
        </span>
        <span className="hidden md:inline text-cyan-300">
          CORRIDOR: {selectedCorridor}
        </span>
      </div>

      {/* CENTER TELEMETRY BAY (Interactive Stage Matrix Bay S0-S7 + Active Tab Overlay) */}
      <main className="flex-1 min-h-0 flex flex-col justify-between overflow-hidden my-0.5 bg-slate-950/70 border border-slate-800/90 rounded-lg p-1">
        {activeTab === 'Mesh' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1 p-1 h-full items-stretch">
            {stages.map((stage, idx) => {
              const isSelected = selectedStageIdx === idx;
              return (
                <div
                  key={stage.code}
                  onClick={() => setSelectedStageIdx(idx)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSelectedStageIdx(idx);
                    }
                  }}
                  className={
                    'flex flex-col justify-between rounded border px-2 py-1.5 cursor-pointer transition-colors ' +
                    (isSelected
                      ? 'bg-slate-900 border-[#00F0FF] shadow-sm'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-600')
                  }
                >
                  {/* Line 1 (Title & Hex) */}
                  <div className="text-[11px] font-mono font-bold text-white flex justify-between items-center">
                    <span>{stage.title}</span>
                    <span className="text-slate-300">{stage.hexPtr}</span>
                  </div>

                  {/* Line 2 (Tokens & Micro-Batch) */}
                  <div className="flex justify-between items-center text-[11px] font-mono font-bold text-cyan-300">
                    <span>TOK: {String(stage.tokensK)}K</span>
                    <span>BATCH: {stage.batchTag}</span>
                  </div>

                  {/* Line 3 (Latency & State) */}
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-[#FF9F0A] font-bold">{stage.latencyMs}</span>
                    <span className="text-emerald-400 font-bold">{stage.stateLabel}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'Pipe' && (
          <div className="flex flex-col justify-between h-full p-1.5 font-mono text-xs overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1">
              <span className="text-[#00F0FF] font-bold">
                1F1B ASYNCHRONOUS PIPELINE INTERCONNECT SCHEDULE
              </span>
              <span className="text-amber-300">
                Formula: T_pipe = (K - 1) * t_bubble + N * t_stage = {totalPipeTimeUs.toFixed(4)} µs
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 my-1">
              <div className="bg-slate-900/90 border border-slate-800 rounded p-1.5">
                <div className="text-[10px] text-slate-400">INTERCONNECT TOPOLOGY</div>
                <div className="text-xs font-bold text-white">NVLink / RoCEv2 P2P DMA</div>
                <div className="text-[10px] text-emerald-400">Zero Host CPU Round-Trips</div>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded p-1.5">
                <div className="text-[10px] text-slate-400">BARRIER CHECKPOINT</div>
                <div className="text-xs font-bold text-cyan-300">0.0098 µs Lock</div>
                <div className="text-[10px] text-slate-300">Sub-Microsecond Handoff</div>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded p-1.5">
                <div className="text-[10px] text-slate-400">BUBBLE OVERHEAD</div>
                <div className="text-xs font-bold text-amber-300">{bubbleFractionPct}% Idle</div>
                <div className="text-[10px] text-emerald-400">
                  {scheduleEfficiencyPct}% Compute Utilization
                </div>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded p-1.5">
                <div className="text-[10px] text-slate-400">ACTIVE CORRIDOR</div>
                <div className="text-[10px] font-bold text-cyan-300 truncate">
                  {selectedCorridor}
                </div>
                <div className="text-[10px] text-slate-300">Step Pass #{String(stepCount)}</div>
              </div>
            </div>
            <div className="grid grid-cols-8 gap-1">
              {stages.map((st, idx) => (
                <button
                  key={st.code}
                  type="button"
                  onClick={() => setSelectedStageIdx(idx)}
                  className="bg-slate-900 border border-slate-800 rounded p-1 text-left hover:border-cyan-400 cursor-pointer"
                >
                  <div className="text-[10px] font-bold text-white flex justify-between">
                    <span>{st.code}</span>
                    <span className="text-cyan-300">{st.hexPtr}</span>
                  </div>
                  <div className="text-[9px] text-emerald-400">
                    1F:{String(st.forwardCount)} · 1B:{String(st.backwardCount)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Btch' && (
          <div className="flex flex-col justify-between h-full p-1.5 font-mono text-xs overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1">
              <span className="text-[#FF9F0A] font-bold">
                LAYER-PARTITIONED MICRO-BATCH STREAMING CONTROLLER
              </span>
              <span className="text-cyan-300">
                Active Micro-Batches (N): {String(microBatchCountN)} · Stages (K): 8
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 my-1 items-center">
              <div className="bg-slate-900/90 border border-slate-800 rounded p-2">
                <div className="text-[10px] text-slate-300 mb-1">
                  SELECT MICRO-BATCH DENSITY (N)
                </div>
                <div className="flex gap-1">
                  {[16, 32, 64, 128, 256].map((nVal) => (
                    <button
                      key={nVal}
                      type="button"
                      onClick={() => setMicroBatchCountN(nVal)}
                      className={
                        'px-2 py-1 text-[10px] font-bold rounded border cursor-pointer ' +
                        (microBatchCountN === nVal
                          ? 'bg-[#00F0FF] text-black border-cyan-300'
                          : 'bg-slate-950 text-slate-300 border-slate-700')
                      }
                    >
                      {String(nVal)}-UB
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded p-2">
                <div className="text-[10px] text-slate-400">1F1B TOTAL PASS TIME (T_pipe)</div>
                <div className="text-sm font-bold text-white tabular-nums">
                  {totalPipeTimeUs.toFixed(4)} µs
                </div>
                <div className="text-[10px] text-cyan-300">
                  Bubble: {bubbleTimeUs.toFixed(4)} µs · Compute: {computeTimeUs.toFixed(4)} µs
                </div>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded p-2">
                <div className="text-[10px] text-slate-400">ACTIVATION ARENA FOOTPRINT</div>
                <div className="text-sm font-bold text-emerald-400">16.0 MB / Handoff</div>
                <div className="text-[10px] text-slate-300">
                  Zero-Copy Ring Buffer 0x16000..0x16070
                </div>
              </div>
            </div>
            <div className="text-[10px] text-slate-300 bg-slate-900/60 border border-slate-800 rounded px-2 py-1">
              INTERLEAVED SCHEDULE: Warmup [W-F0..W-F6] · Steady-State [1F1B-F7-B0 .. 1F1B-F63-B56]
              · Cooldown [C-B57..C-B63] · Bubble Ratio: {bubbleFractionPct}%
            </div>
          </div>
        )}

        {activeTab === 'Stats' && (
          <div className="flex flex-col justify-between h-full p-1.5 font-mono text-xs overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1">
              <span className="text-emerald-400 font-bold">
                4-GATE CLEAN-ROOM DYNO VERIFICATION & TELEMETRY BENCHMARKS
              </span>
              <span className="text-cyan-300">PYTEST SUITE: 100% PASS (&gt;85% COVERAGE)</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 my-1">
              <div className="bg-slate-900 border border-emerald-500/40 rounded p-1.5">
                <div className="text-[10px] text-emerald-300 font-bold">GATE 01 · MATH &amp; PHYSICS</div>
                <div className="text-[11px] text-white font-bold">1F1B Solver Verified</div>
                <div className="text-[10px] text-slate-300">Zero Unverified Randoms</div>
              </div>
              <div className="bg-slate-900 border border-emerald-500/40 rounded p-1.5">
                <div className="text-[10px] text-emerald-300 font-bold">GATE 02 · PERSISTENCE</div>
                <div className="text-[11px] text-white font-bold">Arena Isolation Locked</div>
                <div className="text-[10px] text-slate-300">0x16000..0x16070 Guarded</div>
              </div>
              <div className="bg-slate-900 border border-emerald-500/40 rounded p-1.5">
                <div className="text-[10px] text-emerald-300 font-bold">GATE 03 · ZERO-TRUST</div>
                <div className="text-[11px] text-white font-bold">Pydantic V2 Strict DTOs</div>
                <div className="text-[10px] text-slate-300">Sanitized Ingress Payloads</div>
              </div>
              <div className="bg-slate-900 border border-emerald-500/40 rounded p-1.5">
                <div className="text-[10px] text-emerald-300 font-bold">GATE 04 · TEST SUITE</div>
                <div className="text-[11px] text-white font-bold">Pytest &gt;85% Coverage</div>
                <div className="text-[10px] text-slate-300">100% MIT Zero Copyleft</div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-1 text-[10px] bg-slate-900/80 border border-slate-800 rounded p-1.5">
              <div>Pipeline Throughput: {formatNumberWithCommas(throughputGbs)} GB/s</div>
              <div>Stage Latency: {stageLatencyUs}</div>
              <div>Active Stages: {String(activeStageCount)} Stages</div>
              <div>Processed Tokens: {formatNumberWithCommas(processedTokens)} Units</div>
              <div>Pipeline State: {pipelineStateLabel}</div>
            </div>
          </div>
        )}

        {activeTab === 'APA' && (
          <div className="flex flex-col justify-between h-full p-1.5 font-mono text-xs overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1">
              <span className="text-[#FF9F0A] font-bold">
                GF-T3-289 · 100% PURE ASSET PURCHASE AGREEMENT (APA) DESK
              </span>
              <span className="text-emerald-300 font-bold">{apaStatusBanner}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 my-auto items-center">
              <div className="bg-slate-900/90 border border-slate-800 rounded p-2 space-y-1">
                <div className="text-[11px] font-bold text-white">
                  CHASSIS: GF-T3-289 (UNIT #289 · CLUSTER-006)
                </div>
                <div className="text-[10px] text-cyan-300">
                  Retail Price: 150,000 UNITS · Full Engine APA Allocation: 65,000 UNITS
                </div>
                <div className="text-[10px] text-slate-300">
                  100% Sovereign IP Title Transfer · MIT Clean-Room Provenance · Zero Recurring
                  Subscriptions · Zero Copyleft
                </div>
              </div>

              {/* Anti-Clutter & Spacing Rule: Vertical flex container with full-width clickable targets */}
              <div className="flex flex-col gap-2 w-full">
                <button
                  type="button"
                  onClick={() => {
                    setApaStatusBanner(
                      'APA TITLE ESCROW LOCKED · GF-T3-289 REPOSITORY HANDOVER READY'
                    );
                    pushRadioLines(
                      '[00:05.12] 🟢 CREW CHIEF: ACQUIRE TITLE (APA) initiated for GF-T3-289 · 100% IP assignment verified',
                      '[00:05.16] 🟢 TELEMETRY: Clean-room SHA-256 manifest and standalone repository bundle staged'
                    );
                  }}
                  className="w-full py-1.5 px-3 bg-[#FF9F0A] hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs rounded text-center cursor-pointer transition-colors"
                >
                  ACQUIRE TITLE (APA)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setApaStatusBanner(
                      'CLUSTER-006 VAULT BUYOUT DOSSIER DISPATCHED · POF GATE VERIFIED'
                    );
                    pushRadioLines(
                      '[00:05.40] 🟢 CREW CHIEF: INQUIRE VAULT BUYOUT logged for CLUSTER-006 transport package',
                      '[00:05.44] 🟢 TELEMETRY: Zero-SaaS SLA disclaimer and NIST SP 800-218 SSDF audit attached'
                    );
                  }}
                  className="w-full py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-[#00F0FF] border border-cyan-400/60 font-mono font-bold text-xs rounded text-center cursor-pointer transition-colors"
                >
                  INQUIRE VAULT BUYOUT
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* COMPACT PIPELINE TELEMETRY INSPECTOR STRIP */}
      <div className="text-[11px] font-mono whitespace-nowrap overflow-hidden text-cyan-300 font-bold px-2 py-0.5 bg-black/60 border border-slate-800 rounded my-0.5 shrink-0">
        {selectedStage.code} · TOK: {String(selectedStage.tokensK)}K · BATCH:{' '}
        {selectedStage.batchTag} · SYNC: {String(selectedStage.syncPct)}% · PTR{' '}
        {selectedStage.inspectorPtr} · PIPE: {selectedStage.pipeHealth} · LOCKED
      </div>

      {/* TACTICAL LAUNCH CONTROL SWITCHES */}
      <section
        aria-label="Tactical Launch Control Switches"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1"
      >
        <button
          type="button"
          title="Trigger Pipeline Stream Burst"
          onClick={handleInjectStreamBurst}
          className="border border-amber-500/80 bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 rounded text-xs font-mono font-bold py-2 px-2 text-center cursor-pointer transition-colors truncate"
        >
          💥 INJECT PIPELINE STREAM BURST
        </button>
        <button
          type="button"
          title="Inject Bubble Stall Spike (Force Micro-Batch Re-Balancing)"
          onClick={handleToggleBubbleStall}
          className="border border-[#00F0FF] bg-cyan-950/40 hover:bg-cyan-900/50 text-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.25)] rounded text-xs font-mono font-bold py-2 px-2 text-center cursor-pointer transition-colors truncate"
        >
          ⚡ TOGGLE BUBBLE STALL SPIKE
        </button>
        <button
          type="button"
          title="Step 1F1B Micro-Batch Pass"
          onClick={handleStep1F1BPass}
          className="border border-emerald-500/80 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 rounded text-xs font-mono font-bold py-2 px-2 text-center cursor-pointer transition-colors truncate"
        >
          🚀 STEP 1F1B MICRO-BATCH PASS
        </button>
        <button
          type="button"
          title="Flush Stage Buffers & Re-Zero Activation Arenas"
          onClick={handleFlushArenas}
          className="border border-rose-500/80 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 rounded text-xs font-mono font-bold py-2 px-2 text-center cursor-pointer transition-colors truncate"
        >
          🔄 FLUSH STAGE ARENAS
        </button>
      </section>

      {/* PIT-WALL RADIO COMMS LOG */}
      <footer
        aria-label="Pit-Wall Radio Comms Log"
        className="h-8 overflow-hidden font-mono text-[9px] px-2 py-0.5 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-normal flex flex-col justify-center"
      >
        <div className="truncate">{radioLogs[0]}</div>
        <div className="truncate text-cyan-300">{radioLogs[1]}</div>
      </footer>
    </div>
  );
}
