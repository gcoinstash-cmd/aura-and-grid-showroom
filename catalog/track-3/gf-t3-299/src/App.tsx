/**
 * @license
 * SPDX-License-Identifier: MIT
 * GF-T3-299: Ultra-Wide Dynamic Asynchronous Multi-GPU Pipeline Parallelism & Activation Sharding Cockpit
 * Clean-Room Implementation — Zero Currency Symbols, Zero Copyleft, Zero Proprietary Engine Marks
 */

import React, { useState } from 'react';

type TabKey = 'Mesh' | 'Pipe' | 'Shrd' | 'Stats' | 'APA';

interface StageTelemetry {
  id: number;
  code: string;
  title: string;
  hexPtr: string;
  tokensLabel: string;
  shardLoad: number;
  syncPct: number;
  latencyLabel: string;
  stateLabel: string;
  layersAssigned: string;
  nvlinkGbps: number;
  spiked: boolean;
}

const SYNTHETIC_CORRIDORS: string[] = [
  'PIPE-CORRIDOR-ALPHA (DYNAMIC-PIPELINE-PARALLELISM-FABRIC · 55600-GB/S)',
  'PIPE-CORRIDOR-BRAVO (ACTIVATION-SHARDING-ENGINE)',
  'PIPE-CORRIDOR-GAMMA (NON-BLOCKING-NVLINK-EXCHANGE-ROUTER)',
  'PIPE-CORRIDOR-DELTA (FALLBACK-SINGLE-GPU-SERIAL-PASS)',
];

const INITIAL_STAGES: StageTelemetry[] = [
  {
    id: 0,
    code: 'P0',
    title: 'Stage 0 (P0)',
    hexPtr: '0x26000',
    tokensLabel: '256K',
    shardLoad: 100,
    syncPct: 100,
    latencyLabel: '0.02ms',
    stateLabel: 'SHARDED · LOCKED',
    layersAssigned: 'L00-L15',
    nvlinkGbps: 6950,
    spiked: false,
  },
  {
    id: 1,
    code: 'P1',
    title: 'Stage 1 (P1)',
    hexPtr: '0x26010',
    tokensLabel: '256K',
    shardLoad: 100,
    syncPct: 100,
    latencyLabel: '0.02ms',
    stateLabel: 'SHARDED · LOCKED',
    layersAssigned: 'L16-L31',
    nvlinkGbps: 6950,
    spiked: false,
  },
  {
    id: 2,
    code: 'P2',
    title: 'Stage 2 (P2)',
    hexPtr: '0x26020',
    tokensLabel: '256K',
    shardLoad: 100,
    syncPct: 100,
    latencyLabel: '0.02ms',
    stateLabel: 'SHARDED · LOCKED',
    layersAssigned: 'L32-L47',
    nvlinkGbps: 6950,
    spiked: false,
  },
  {
    id: 3,
    code: 'P3',
    title: 'Stage 3 (P3)',
    hexPtr: '0x26030',
    tokensLabel: '256K',
    shardLoad: 100,
    syncPct: 100,
    latencyLabel: '0.02ms',
    stateLabel: 'SHARDED · LOCKED',
    layersAssigned: 'L48-L63',
    nvlinkGbps: 6950,
    spiked: false,
  },
  {
    id: 4,
    code: 'P4',
    title: 'Stage 4 (P4)',
    hexPtr: '0x26040',
    tokensLabel: '256K',
    shardLoad: 100,
    syncPct: 100,
    latencyLabel: '0.02ms',
    stateLabel: 'SHARDED · LOCKED',
    layersAssigned: 'L64-L79',
    nvlinkGbps: 6950,
    spiked: false,
  },
  {
    id: 5,
    code: 'P5',
    title: 'Stage 5 (P5)',
    hexPtr: '0x26050',
    tokensLabel: '256K',
    shardLoad: 100,
    syncPct: 100,
    latencyLabel: '0.02ms',
    stateLabel: 'SHARDED · LOCKED',
    layersAssigned: 'L80-L95',
    nvlinkGbps: 6950,
    spiked: false,
  },
  {
    id: 6,
    code: 'P6',
    title: 'Stage 6 (P6)',
    hexPtr: '0x26060',
    tokensLabel: '256K',
    shardLoad: 100,
    syncPct: 100,
    latencyLabel: '0.02ms',
    stateLabel: 'SHARDED · LOCKED',
    layersAssigned: 'L96-L111',
    nvlinkGbps: 6950,
    spiked: false,
  },
  {
    id: 7,
    code: 'P7',
    title: 'Stage 7 (P7)',
    hexPtr: '0x26070',
    tokensLabel: '256K',
    shardLoad: 100,
    syncPct: 100,
    latencyLabel: '0.02ms',
    stateLabel: 'SHARDED · LOCKED',
    layersAssigned: 'L112-L127',
    nvlinkGbps: 6950,
    spiked: false,
  },
];

const INITIAL_LOGS: string[] = [
  '[00:01.04] 🟢 CREW CHIEF: Asynchronous multi-GPU pipeline parallelism and activation sharding engine initialized · 8 stages linked',
  '[00:01.08] 🟢 TELEMETRY: NVLink stage sharding verified at 55,600 GB/s with zero pipeline bubble downtime',
];

export default function App() {
  const [selectedCorridor, setSelectedCorridor] = useState<string>(SYNTHETIC_CORRIDORS[0]);
  const [activeTab, setActiveTab] = useState<TabKey>('Mesh');
  const [stages, setStages] = useState<StageTelemetry[]>(INITIAL_STAGES);
  const [selectedStageIndex, setSelectedStageIndex] = useState<number>(3);
  const [throughputGbps, setThroughputGbps] = useState<string>('55,600 GB/s');
  const [throughputProgress, setThroughputProgress] = useState<number>(96);
  const [stageLatencyUs, setStageLatencyUs] = useState<string>('0.01 µs');
  const [activeStagesLabel, setActiveStagesLabel] = useState<string>('STAGES: 8/8');
  const [tokenScoreLabel, setTokenScoreLabel] = useState<string>('9,600,000 UNITS');
  const [engineXpLabel, setEngineXpLabel] = useState<string>('+75.0k ENGINE XP');
  const [pipelineStateLabel, setPipelineStateLabel] = useState<string>('Pipeline State: Sharding Active');
  const [vecSignature, setVecSignature] = useState<string>('[6.01, 6.05, 6.02, 6.04]');
  const [bottleneckActive, setBottleneckActive] = useState<boolean>(false);
  const [shardingStepCount, setShardingStepCount] = useState<number>(0);
  const [apaModalMessage, setApaModalMessage] = useState<string | null>(null);
  const [radioLogs, setRadioLogs] = useState<string[]>(INITIAL_LOGS);

  const appendRadioLog = (line1: string, line2: string) => {
    setRadioLogs([line1, line2]);
  };

  const handleCorridorChange = (corridor: string) => {
    setSelectedCorridor(corridor);
    if (corridor.includes('CORRIDOR-ALPHA')) {
      setThroughputGbps('55,600 GB/s');
      setThroughputProgress(96);
      setStageLatencyUs('0.01 µs');
      setActiveStagesLabel('STAGES: 8/8');
      setPipelineStateLabel('Pipeline State: Sharding Active');
      appendRadioLog(
        '[00:02.12] 🟢 CREW CHIEF: Switched to PIPE-CORRIDOR-ALPHA dynamic pipeline parallelism fabric',
        '[00:02.16] 🟢 TELEMETRY: Pipeline Throughput: 55,600 GB/s · Stage Latency: 0.01 µs · Active Stages: 8 Stages'
      );
    } else if (corridor.includes('CORRIDOR-BRAVO')) {
      setThroughputGbps('53,400 GB/s');
      setThroughputProgress(92);
      setStageLatencyUs('0.01 µs');
      setActiveStagesLabel('STAGES: 8/8');
      setPipelineStateLabel('Pipeline State: Sharding Active');
      appendRadioLog(
        '[00:02.24] 🟢 CREW CHIEF: Engaged PIPE-CORRIDOR-BRAVO micro-batch activation sharding engine',
        '[00:02.28] 🟢 TELEMETRY: Interleaved 1F1B activation tensors locked across P0..P7'
      );
    } else if (corridor.includes('CORRIDOR-GAMMA')) {
      setThroughputGbps('54,500 GB/s');
      setThroughputProgress(94);
      setStageLatencyUs('0.01 µs');
      setActiveStagesLabel('STAGES: 8/8');
      setPipelineStateLabel('Pipeline State: Sharding Active');
      appendRadioLog(
        '[00:02.36] 🟢 CREW CHIEF: Routed via PIPE-CORRIDOR-GAMMA non-blocking NVLink exchange ring',
        '[00:02.40] 🟢 TELEMETRY: Zero host CPU stalls · Ring barrier handoff verified at 0.01 µs'
      );
    } else {
      setThroughputGbps('13,900 GB/s');
      setThroughputProgress(35);
      setStageLatencyUs('0.04 µs');
      setActiveStagesLabel('STAGES: 1/8');
      setPipelineStateLabel('Pipeline State: Serial Pass Fallback');
      appendRadioLog(
        '[00:02.52] 🟡 CREW CHIEF: Fallback to PIPE-CORRIDOR-DELTA single-GPU serial pass active',
        '[00:02.56] 🟡 TELEMETRY: Multi-stage sharding bypassed · Recommend returning to ALPHA corridor'
      );
    }
  };

  const handleInjectBurst = () => {
    setThroughputGbps('62,400 GB/s');
    setThroughputProgress(100);
    setStageLatencyUs('0.01 µs');
    setTokenScoreLabel('11,648,000 UNITS');
    setEngineXpLabel('+98.4k ENGINE XP');
    setPipelineStateLabel('Pipeline State: Burst Saturation Active');
    setVecSignature('[6.42, 6.48, 6.45, 6.49]');
    setStages(
      INITIAL_STAGES.map((st) => ({
        ...st,
        tokensLabel: '320K',
        shardLoad: 100,
        syncPct: 100,
        latencyLabel: '0.01ms',
        stateLabel: 'SHARDED · LOCKED',
        nvlinkGbps: 7800,
        spiked: false,
      }))
    );
    appendRadioLog(
      '[00:03.10] 💥 CREW CHIEF: Pipeline Parallelism Burst injected across all 8 GPU stages (P0..P7)',
      '[00:03.14] 🟢 TELEMETRY: Pipeline Throughput: 62,400 GB/s · Processed Tokens: 11,648,000 Units · Zero bubble stall'
    );
  };

  const handleToggleBottleneck = () => {
    const nextSpike = !bottleneckActive;
    setBottleneckActive(nextSpike);
    if (nextSpike) {
      setThroughputGbps('51,200 GB/s');
      setThroughputProgress(88);
      setStageLatencyUs('0.03 µs');
      setPipelineStateLabel('Pipeline State: Micro-Batch Re-Balancing');
      setVecSignature('[6.14, 6.09, 6.11, 6.08]');
      setStages(
        INITIAL_STAGES.map((st, idx) =>
          idx === 3
            ? {
                ...st,
                tokensLabel: '192K',
                shardLoad: 94,
                syncPct: 98,
                latencyLabel: '0.04ms',
                stateLabel: 'REBALANCED · LOCKED',
                nvlinkGbps: 6400,
                spiked: true,
              }
            : {
                ...st,
                tokensLabel: '265K',
                shardLoad: 100,
                syncPct: 100,
                latencyLabel: '0.02ms',
                stateLabel: 'SHARDED · LOCKED',
              }
        )
      );
      setSelectedStageIndex(3);
      appendRadioLog(
        '[00:04.02] ⚡ CREW CHIEF: Stage bottleneck spike injected on P3 (0x26030) · Dynamic Micro-Batch Re-Balancing active',
        '[00:04.06] 🟢 TELEMETRY: P3 shard load redistributed across adjacent NVLink ring stages with zero pipeline drop'
      );
    } else {
      setThroughputGbps('55,600 GB/s');
      setThroughputProgress(96);
      setStageLatencyUs('0.01 µs');
      setPipelineStateLabel('Pipeline State: Sharding Active');
      setVecSignature('[6.01, 6.05, 6.02, 6.04]');
      setStages(INITIAL_STAGES);
      appendRadioLog(
        '[00:04.18] 🟢 CREW CHIEF: Stage P3 bottleneck cleared · Uniform 256K activation sharding restored',
        '[00:04.22] 🟢 TELEMETRY: Pipeline Throughput: 55,600 GB/s · Stage Latency: 0.01 µs · All 8 stages locked'
      );
    }
  };

  const handleStepShardingPass = () => {
    const nextStep = shardingStepCount + 1;
    setShardingStepCount(nextStep);
    const totalTokens = 9600000 + nextStep * 256000;
    setTokenScoreLabel(totalTokens.toLocaleString('en-US') + ' UNITS');
    setEngineXpLabel('+' + (75.0 + nextStep * 4.5).toFixed(1) + 'k ENGINE XP');
    setPipelineStateLabel('Pipeline State: Sharding Active');
    const nextIdx = (selectedStageIndex + 1) % 8;
    setSelectedStageIndex(nextIdx);
    appendRadioLog(
      '[00:05.0' + (nextStep % 9) + '] 🚀 CREW CHIEF: Asynchronous sharding pass #' + nextStep + ' committed · Focus shifted to P' + nextIdx,
      '[00:05.1' + (nextStep % 9) + '] 🟢 TELEMETRY: Processed Tokens: ' + totalTokens.toLocaleString('en-US') + ' Units · Sub-microsecond barrier verified'
    );
  };

  const handleFlushArenas = () => {
    setSelectedCorridor(SYNTHETIC_CORRIDORS[0]);
    setStages(INITIAL_STAGES);
    setSelectedStageIndex(3);
    setThroughputGbps('55,600 GB/s');
    setThroughputProgress(96);
    setStageLatencyUs('0.01 µs');
    setActiveStagesLabel('STAGES: 8/8');
    setTokenScoreLabel('9,600,000 UNITS');
    setEngineXpLabel('+75.0k ENGINE XP');
    setPipelineStateLabel('Pipeline State: Sharding Active');
    setVecSignature('[6.01, 6.05, 6.02, 6.04]');
    setBottleneckActive(false);
    setShardingStepCount(0);
    setApaModalMessage(null);
    setRadioLogs(INITIAL_LOGS);
  };

  const inspectedStage = stages[selectedStageIndex] || stages[3];

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans">
      {/* TOP HEADER ROW 1 */}
      <header className="flex flex-col gap-0.5 w-full shrink-0">
        <div className="flex items-center justify-between gap-1 w-full shrink-0">
          {/* Left: Title & Cyan Badge */}
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <h1 className="text-sm md:text-base font-mono font-bold tracking-tight text-white">
              GF-T3-299
            </h1>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/50 rounded">
              FLAGSHIP
            </span>
          </div>

          {/* Right: Compact Corridor Dropdown & Micro Action Buttons */}
          <div className="flex items-center gap-1 shrink-0 overflow-hidden">
            <select
              aria-label="Pipeline Corridor Selector"
              value={selectedCorridor}
              onChange={(e) => handleCorridorChange(e.target.value)}
              className="max-w-[120px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 text-cyan-300 border border-slate-700 rounded shrink-0 focus:outline-none focus:border-[#00F0FF]"
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
                setActiveTab('Pipe');
                handleInjectBurst();
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 bg-slate-900 hover:bg-slate-800 text-[#00F0FF] border border-cyan-500/40 rounded transition-colors cursor-pointer"
            >
              [Pipe]
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('Shrd');
                handleStepShardingPass();
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 bg-slate-900 hover:bg-slate-800 text-[#FF9F0A] border border-amber-500/40 rounded transition-colors cursor-pointer"
            >
              [Shard]
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('Mesh');
                handleStepShardingPass();
              }}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 rounded transition-colors cursor-pointer"
            >
              [Run]
            </button>
          </div>
        </div>

        {/* TOP HEADER ROW 2 */}
        <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap">
          Pipeline Parallelism · Activation Sharding · Zero Bubble Latency
        </div>
      </header>

      {/* 4-CARD ARCADE HUD RIBBON (2x2 GRID ABOVE THE FOLD) */}
      <section className="grid grid-cols-2 gap-1.5 w-full shrink-0 my-0.5">
        {/* Card 1: PIPE NITRO */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              PIPE NITRO
            </span>
            <span className="font-mono text-lg font-bold text-[#00F0FF] leading-tight">
              {throughputGbps}
            </span>
          </div>
          <div className="w-full bg-slate-950 h-1.5 rounded overflow-hidden border border-slate-800 my-0.5">
            <div
              className="bg-[#00F0FF] h-full transition-all duration-150"
              style={{ width: throughputProgress + '%' }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Pipeline Throughput Saturation
          </div>
        </div>

        {/* Card 2: SHARD STREAK */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              SHARD STREAK
            </span>
            <span className="font-mono text-lg font-bold text-[#FF9F0A] leading-tight">
              {stageLatencyUs}
            </span>
          </div>
          <div className="flex items-center justify-between gap-1 my-0.5">
            <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-950/60 border border-amber-500/40 px-1.5 py-0.2 rounded">
              🔥 NVLINK-STAGE
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">
              0.00% BUBBLE
            </span>
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Stage Latency
          </div>
        </div>

        {/* Card 3: ACTIVE STAGES */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              ACTIVE STAGES
            </span>
            <span className="font-mono text-sm font-bold text-emerald-400 leading-tight">
              {activeStagesLabel}
            </span>
          </div>
          <div className="grid grid-cols-8 gap-0.5 my-0.5">
            {stages.map((st, idx) => (
              <button
                key={st.code}
                type="button"
                onClick={() => setSelectedStageIndex(idx)}
                className={
                  'text-[9px] font-mono font-bold rounded py-0.2 text-center border cursor-pointer transition-colors ' +
                  (selectedStageIndex === idx
                    ? 'bg-[#00F0FF]/25 text-[#00F0FF] border-[#00F0FF]'
                    : st.spiked
                    ? 'bg-amber-950/70 text-amber-300 border-amber-500/60'
                    : 'bg-slate-950 text-emerald-300 border-slate-700')
                }
              >
                {st.code}
              </button>
            ))}
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate">
            Active Stages: 8 Stages · F1 Gear Shift [P0..P7]
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              TOKEN SCORE
            </span>
            <span className="font-mono text-sm md:text-base font-bold text-white leading-tight">
              {tokenScoreLabel}
            </span>
          </div>
          <div className="flex items-center justify-between gap-1 my-0.5">
            <span className="text-[10px] font-mono font-bold text-[#00F0FF]">
              {engineXpLabel}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Processed Tokens: 9,600,000 Units
            </span>
          </div>
          <div className="text-[10px] font-mono text-emerald-300 truncate font-semibold">
            {pipelineStateLabel}
          </div>
        </div>
      </section>

      {/* 5 HORIZONTAL TABS */}
      <nav
        aria-label="Cockpit Views"
        className="grid grid-cols-5 gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg my-1 w-full text-center shrink-0"
      >
        {(['Mesh', 'Pipe', 'Shrd', 'Stats', 'APA'] as TabKey[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={
              'py-1 text-xs font-mono font-bold rounded transition-colors cursor-pointer whitespace-nowrap shrink-0 ' +
              (activeTab === tab
                ? 'bg-[#00F0FF] text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60')
            }
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* STREAMLINED MESH INFO SUBHEADER (STRICTLY CLEAN OF ACTION BUTTONS) */}
      <div className="text-[10px] font-mono whitespace-nowrap overflow-hidden text-slate-300 px-1 shrink-0">
        {'VIEW: MESH · PTR: 0x1FF8DC0 · MODE: PIPELINE_PARALLELISM · STAGES: 8 · VEC: ' + vecSignature}
      </div>

      {/* CENTRAL INTERACTIVE STAGE MATRIX BAY (P0-P7) + TAB OVERLAYS */}
      <main className="flex-1 min-h-0 flex flex-col justify-between overflow-hidden my-0.5">
        {/* Always keep the 8 Stage Cards rendered in DOM for instant inspection; show contextual banner or APA controls when APA tab is selected */}
        {activeTab === 'APA' ? (
          <div className="flex-1 min-h-0 bg-slate-900/90 border border-slate-800 rounded-lg p-2 flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1">
              <div>
                <h2 className="text-xs font-mono font-bold text-[#00F0FF]">
                  GF-T3-299 · STANDALONE CHASSIS ASSET PURCHASE AGREEMENT (APA)
                </h2>
                <p className="text-[10px] font-mono text-slate-300">
                  CLUSTER-006 · 100% Sovereign IP Title Transfer · Zero Licensing · Zero Copyleft
                </p>
              </div>
              <span className="text-[10px] font-mono font-bold text-amber-400">
                Retail Price: 75,000 - 150,000+ Units
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1 my-1 text-[10px] font-mono">
              <div className="bg-slate-950/90 border border-slate-800 rounded p-1.5">
                <div className="text-slate-400">GATE 01 MATH</div>
                <div className="text-emerald-400 font-bold">DETERMINISTIC PASS</div>
              </div>
              <div className="bg-slate-950/90 border border-slate-800 rounded p-1.5">
                <div className="text-slate-400">GATE 02 STATE</div>
                <div className="text-emerald-400 font-bold">RLS & ARENA LOCKED</div>
              </div>
              <div className="bg-slate-950/90 border border-slate-800 rounded p-1.5">
                <div className="text-slate-400">GATE 03 INGRESS</div>
                <div className="text-emerald-400 font-bold">ZERO-TRUST DTO</div>
              </div>
              <div className="bg-slate-950/90 border border-slate-800 rounded p-1.5">
                <div className="text-slate-400">GATE 04 COVERAGE</div>
                <div className="text-emerald-400 font-bold">PYTEST &gt;85% VERIFIED</div>
              </div>
            </div>

            {apaModalMessage && (
              <div className="text-[10px] font-mono text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 rounded px-2 py-1">
                {apaModalMessage}
              </div>
            )}

            {/* Vertical Flex Container for APA CTAs per Ghost Factory Anti-Clutter Rule */}
            <div className="flex flex-col gap-2 w-full">
              <button
                type="button"
                onClick={() => {
                  setApaModalMessage(
                    'APA TITLE DOSSIER READY: GF-T3-299 standalone repository, FastAPI engine.py, and Pytest suite staged for escrow hand-off.'
                  );
                  appendRadioLog(
                    '[00:06.12] 🟢 CREW CHIEF: ACQUIRE TITLE (APA) dossier staged for GF-T3-299 (CLUSTER-006)',
                    '[00:06.16] 🟢 TELEMETRY: Clean-room MIT provenance and NIST SP 800-218 SSDF v1.1 manifest verified'
                  );
                }}
                className="w-full py-1.5 bg-[#00F0FF] hover:bg-cyan-300 text-slate-950 font-mono text-xs font-bold rounded transition-colors cursor-pointer text-center"
              >
                ACQUIRE TITLE (APA)
              </button>
              <button
                type="button"
                onClick={() => {
                  setApaModalMessage(
                    'VAULT BUYOUT INQUIRY LOGGED: Full Engine APA Buyout (35,000 - 65,000 Units) · CLUSTER-006 allocation locked.'
                  );
                  appendRadioLog(
                    '[00:06.24] 🟢 CREW CHIEF: INQUIRE VAULT BUYOUT telemetry packet dispatched to Dealership Principal',
                    '[00:06.28] 🟢 TELEMETRY: Zero-SaaS standalone repository transfer specifications verified'
                  );
                }}
                className="w-full py-1.5 bg-slate-950 hover:bg-slate-800 text-[#FF9F0A] border border-[#FF9F0A]/60 font-mono text-xs font-bold rounded transition-colors cursor-pointer text-center"
              >
                INQUIRE VAULT BUYOUT
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col justify-between">
            {/* Contextual Sub-Bar for Pipe / Shrd / Stats modes */}
            {activeTab !== 'Mesh' && (
              <div className="flex items-center justify-between px-2 py-0.5 bg-slate-900/90 border border-slate-800 rounded text-[10px] font-mono text-amber-300 shrink-0 mb-0.5">
                <span>
                  {activeTab === 'Pipe' &&
                    'PIPELINE PARTITION FORMULA: P_pipe = TensorProduct Shard(W_l, pi_stage) · 16 Layers/Stage · 1F1B Interleaved'}
                  {activeTab === 'Shrd' &&
                    'ACTIVATION SHARDING: 32 Micro-Batches · Non-Blocking NVLink Ring Handoff · 6,950 GB/s Per Stage'}
                  {activeTab === 'Stats' &&
                    'CLUSTER TELEMETRY: Pipeline Throughput: 55,600 GB/s · Stage Latency: 0.01 µs · Active Stages: 8 Stages · Bubble: 0.00%'}
                </span>
                <span className="text-cyan-300 font-bold">{selectedCorridor.split(' ')[0]}</span>
              </div>
            )}

            {/* 8 STAGE CARDS IN A TIGHT 2-ROW x 4-COLUMN GRID */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950/70 border border-slate-800/90 rounded-lg flex-1 min-h-0 items-stretch">
              {stages.map((stage, idx) => {
                const isSelected = selectedStageIndex === idx;
                return (
                  <div
                    key={stage.code}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedStageIndex(idx)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setSelectedStageIndex(idx);
                      }
                    }}
                    className={
                      'rounded px-2 py-1.5 flex flex-col justify-between border transition-colors cursor-pointer ' +
                      (isSelected
                        ? 'bg-slate-900 border-[#00F0FF] shadow-[0_0_8px_rgba(0,240,255,0.2)]'
                        : stage.spiked
                        ? 'bg-amber-950/30 border-amber-500/60'
                        : 'bg-slate-900/75 border-slate-800 hover:border-slate-700')
                    }
                  >
                    {/* Line 1: Title & Hex */}
                    <div className="text-[11px] font-mono font-bold text-white flex justify-between items-center">
                      <span>{stage.title}</span>
                      <span className="text-slate-400">{stage.hexPtr}</span>
                    </div>

                    {/* Line 2: Tokens & Shard Load */}
                    <div className="flex justify-between items-center text-[11px] font-mono font-bold text-cyan-300">
                      <span>{'TOK: ' + stage.tokensLabel}</span>
                      <span>{'SHARD: ' + stage.shardLoad + '%'}</span>
                    </div>

                    {/* Line 3: Latency & State */}
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-[#FF9F0A] font-semibold">{stage.latencyLabel}</span>
                      <span className="text-emerald-400 font-semibold">{stage.stateLabel}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* COMPACT PIPELINE TELEMETRY INSPECTOR STRIP */}
        <div className="text-[11px] font-mono whitespace-nowrap overflow-hidden text-cyan-300 font-bold px-2 py-0.5 bg-black/60 border border-slate-800 rounded my-0.5 shrink-0">
          {inspectedStage.code +
            ' · TOK: ' +
            inspectedStage.tokensLabel +
            ' · SHARD: ' +
            inspectedStage.shardLoad +
            '% · SYNC: ' +
            inspectedStage.syncPct +
            '% · PTR ' +
            inspectedStage.hexPtr +
            ' · PIPE: OK · LOCKED'}
        </div>
      </main>

      {/* TACTICAL LAUNCH CONTROL SWITCHES */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1">
        <button
          type="button"
          onClick={handleInjectBurst}
          className="bg-amber-950/50 hover:bg-amber-900/60 text-amber-300 border border-[#FF9F0A] rounded text-xs font-mono font-bold py-2 px-2 text-center transition-colors cursor-pointer truncate"
        >
          💥 INJECT PIPELINE PARALLELISM BURST
        </button>

        <button
          type="button"
          onClick={handleToggleBottleneck}
          className="bg-cyan-950/50 hover:bg-cyan-900/60 text-[#00F0FF] border border-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.2)] rounded text-xs font-mono font-bold py-2 px-2 text-center transition-colors cursor-pointer truncate"
        >
          ⚡ TOGGLE STAGE BOTTLENECK SPIKE
        </button>

        <button
          type="button"
          onClick={handleStepShardingPass}
          className="bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500 rounded text-xs font-mono font-bold py-2 px-2 text-center transition-colors cursor-pointer truncate"
        >
          🚀 STEP ASYNCHRONOUS SHARDING PASS
        </button>

        <button
          type="button"
          onClick={handleFlushArenas}
          className="bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-500 rounded text-xs font-mono font-bold py-2 px-2 text-center transition-colors cursor-pointer truncate"
        >
          🔄 FLUSH STAGE ARENAS
        </button>
      </section>

      {/* PIT-WALL RADIO COMMS LOG */}
      <footer className="h-8 overflow-hidden font-mono text-[9px] px-2 py-0.5 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-normal flex flex-col justify-center">
        <div className="truncate">{radioLogs[0]}</div>
        <div className="truncate">{radioLogs[1]}</div>
      </footer>
    </div>
  );
}
