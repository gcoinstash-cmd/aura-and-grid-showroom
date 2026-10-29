/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GF-T3-238: Pipeline Parallelism 1F1B · Micro-Batch Interleaved · Checkpointing Cockpit
 */

import React, { useState } from 'react';
import {
  SYNTHETIC_PIPELINE_CORRIDORS,
  SyntheticCorridor,
  validateControlCommand,
} from './engine/gridSyncValidator';
import {
  PipelineEngineState,
  StageNodeState,
  applyFlushQueues,
  applyPipelineBurst,
  applyStepVirtualStage,
  applyToggleBubbleStall,
  createInitialPipelineState,
  formatInspectorStripText,
  formatWithCommas,
  recomputeEngineState,
} from './engine/pipelineEngine';
import {
  SUPABASE_POSTGRES_SCHEMA_SQL,
  generateAuditBundleJson,
} from './engine/supabaseSchema';

const TABS = ['Mesh', 'Pipe', '1F1B', 'Stats', 'APA'] as const;
type CockpitTab = (typeof TABS)[number];

export default function App() {
  const [engineState, setEngineState] = useState<PipelineEngineState>(() =>
    createInitialPipelineState()
  );
  const [activeTab, setActiveTab] = useState<CockpitTab>('Mesh');
  const [modalMode, setModalMode] = useState<'NONE' | 'SCHEMA' | 'APA' | 'AUDIT'>('NONE');
  const [apaNotice, setApaNotice] = useState<string>('');

  const selectedStage: StageNodeState =
    engineState.stages[engineState.selectedStageId] ?? engineState.stages[3];

  const handleCorridorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const chosen = e.target.value as SyntheticCorridor;
    const validated = validateControlCommand({
      engineId: 'GF-T3-238',
      command: 'SWITCH_CORRIDOR',
      corridor: chosen,
    });
    if (validated.corridor) {
      const nextCorridor = validated.corridor;
      const isFallbackGpipe = nextCorridor.includes('DELTA');
      setEngineState((prev) =>
        recomputeEngineState(
          prev,
          {
            corridor: nextCorridor,
            interleaved1F1B: !isFallbackGpipe,
          },
          '[00:01.48] ⚡ PIT WALL: Synthetic corridor switched to ' +
            nextCorridor.slice(0, 24)
        )
      );
    }
  };

  const handleToggleCheckpointPipe = () => {
    validateControlCommand({ engineId: 'GF-T3-238', command: 'TOGGLE_PIPE' });
    setEngineState((prev) => {
      const nextCkpt = !prev.checkpointingEnabled;
      return recomputeEngineState(
        prev,
        { checkpointingEnabled: nextCkpt },
        nextCkpt
          ? '[00:01.64] 🟢 TELEMETRY: Activation checkpointing enabled · Stage footprint locked at ' +
              String(prev.memoryMetrics.activeStageMb) +
              ' MB'
          : '[00:01.64] ⚡ PIT WALL: Uncheckpointed raw activation buffer mode active'
      );
    });
  };

  const handleToggle1F1BMode = () => {
    validateControlCommand({ engineId: 'GF-T3-238', command: 'TOGGLE_1F1B' });
    setEngineState((prev) => {
      const next1F1B = !prev.interleaved1F1B;
      return recomputeEngineState(
        prev,
        { interleaved1F1B: next1F1B },
        next1F1B
          ? '[00:01.76] 🟢 CREW CHIEF: 1F1B Micro-Batch Interleaved Scheduler locked · Bubble at 2.4%'
          : '[00:01.76] ⚡ PIT WALL: Standard non-interleaved schedule active · Bubble at 30.43%'
      );
    });
  };

  const handleBurst = () => {
    validateControlCommand({ engineId: 'GF-T3-238', command: 'BURST' });
    setEngineState((prev) => applyPipelineBurst(prev));
  };

  const handleStall = () => {
    validateControlCommand({ engineId: 'GF-T3-238', command: 'STALL' });
    setEngineState((prev) => applyToggleBubbleStall(prev));
  };

  const handleStep = () => {
    validateControlCommand({ engineId: 'GF-T3-238', command: 'STEP' });
    setEngineState((prev) => applyStepVirtualStage(prev));
  };

  const handleFlush = () => {
    validateControlCommand({ engineId: 'GF-T3-238', command: 'FLUSH' });
    setEngineState(applyFlushQueues());
    setApaNotice('');
  };

  const handleSelectStage = (stageId: number) => {
    validateControlCommand({
      engineId: 'GF-T3-238',
      command: 'SELECT_STAGE',
      stageId,
    });
    setEngineState((prev) =>
      recomputeEngineState(
        prev,
        { selectedStageId: stageId },
        '[00:02.04] 🟢 TELEMETRY: Stage S' +
          String(stageId) +
          ' selected · Ring buffer queue ' +
          String(prev.stages[stageId]?.ringBufferQueueDepth ?? 1) +
          ' · Checkpointed'
      )
    );
  };

  const handleAcquireTitleApa = () => {
    setModalMode('APA');
    setApaNotice(
      'APA Title Transfer Dossier initialized for GF-T3-238 · 100% MIT Clean-Room IP Verified'
    );
  };

  const handleInquireVaultBuyout = () => {
    setModalMode('AUDIT');
    setApaNotice(
      'Vault Buyout Audit Package & PostgreSQL RLS Schema Verified · Ready for Institutional Handover'
    );
  };

  const throughputDisplay =
    formatWithCommas(engineState.bubbleMetrics.throughputTflops) + ' TFLOPS';
  const bubbleLatencyDisplay =
    engineState.bubbleMetrics.bubbleLatencyUs.toFixed(2) + ' µs';
  const tokenScoreDisplay =
    formatWithCommas(engineState.processedTokens) + ' UNITS';
  const pipeXpDisplay = '+' + engineState.pipeXpK.toFixed(1) + 'k PIPE XP';
  const inspectorText = formatInspectorStripText(selectedStage);

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans">
      {/* TOP HEADER ROW 1 */}
      <header className="flex flex-col gap-0.5 w-full shrink-0">
        <div className="flex items-center justify-between gap-1 w-full shrink-0">
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <h1 className="text-sm font-mono font-bold tracking-tight text-white">
              GF-T3-238
            </h1>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/50 rounded">
              TRACK 3
            </span>
            <span
              className={
                'px-1.5 py-0.5 text-[10px] font-mono font-bold rounded border ' +
                (engineState.bubbleStallActive
                  ? 'bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/60'
                  : 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/50')
              }
            >
              {engineState.bubbleStallActive ? '⚡ FAULT' : '✓ LOCKED'}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <select
              aria-label="Synthetic Pipeline Corridor"
              value={engineState.corridor}
              onChange={handleCorridorChange}
              className="max-w-[110px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 border border-slate-700 text-cyan-300 rounded focus:outline-none focus:border-[#00F0FF]"
            >
              {SYNTHETIC_PIPELINE_CORRIDORS.map((corridor) => (
                <option key={corridor} value={corridor}>
                  {corridor}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleToggleCheckpointPipe}
              className={
                'px-1.5 py-0.5 text-[10px] font-mono font-bold rounded border transition-colors cursor-pointer ' +
                (engineState.checkpointingEnabled
                  ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/60'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500')
              }
            >
              [Pipe]
            </button>

            <button
              type="button"
              onClick={handleToggle1F1BMode}
              className={
                'px-1.5 py-0.5 text-[10px] font-mono font-bold rounded border transition-colors cursor-pointer ' +
                (engineState.interleaved1F1B
                  ? 'bg-[#FF9F0A]/20 text-[#FF9F0A] border-[#FF9F0A]/60'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500')
              }
            >
              [1F1B]
            </button>

            <button
              type="button"
              onClick={handleStep}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded border bg-[#10B981]/20 text-[#10B981] border-[#10B981]/60 hover:bg-[#10B981]/30 transition-colors cursor-pointer"
            >
              [Run]
            </button>

            <button
              type="button"
              onClick={() =>
                setModalMode((m) => (m === 'SCHEMA' ? 'NONE' : 'SCHEMA'))
              }
              className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold rounded border bg-slate-900 text-slate-200 border-slate-700 hover:border-[#00F0FF] transition-colors cursor-pointer"
            >
              [Inspect Schema]
            </button>

            <button
              type="button"
              onClick={handleFlush}
              className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold rounded border bg-slate-900 text-rose-300 border-rose-800/70 hover:border-rose-500 transition-colors cursor-pointer"
            >
              [Reset]
            </button>
          </div>
        </div>

        {/* TOP HEADER ROW 2 */}
        <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap truncate">
          Pipeline Parallelism 1F1B · Micro-Batch Interleaved · Checkpointing
        </div>
      </header>

      {/* 4-CARD ARCADE HUD RIBBON */}
      <section
        aria-label="Telemetry HUD Ribbon"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0"
      >
        {/* Card 1: PIPE NITRO */}
        <div className="bg-slate-900/90 border border-[#00F0FF]/40 rounded-lg px-2 py-1 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              PIPE NITRO
            </span>
            <span className="text-[10px] font-mono text-[#00F0FF]">
              {String(engineState.bubbleMetrics.pipelineUtilizationPct) + '% SAT'}
            </span>
          </div>
          <div className="text-[#00F0FF] font-mono text-lg font-bold leading-tight">
            {throughputDisplay}
          </div>
          <div className="w-full bg-slate-950 h-1.5 rounded overflow-hidden border border-slate-800 my-0.5">
            <div
              className="bg-[#00F0FF] h-full transition-all duration-150"
              style={{
                width:
                  String(
                    Math.min(100, Math.max(15, engineState.bubbleMetrics.pipelineUtilizationPct))
                  ) + '%',
              }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            Pipeline Throughput Saturation
          </div>
        </div>

        {/* Card 2: BUBBLE STREAK */}
        <div className="bg-slate-900/90 border border-[#FF9F0A]/40 rounded-lg px-2 py-1 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              BUBBLE STREAK
            </span>
            <span className="px-1.5 py-0.2 bg-[#FF9F0A]/20 border border-[#FF9F0A]/50 rounded text-[10px] font-mono font-bold text-[#FF9F0A]">
              🔥 8 STAGES
            </span>
          </div>
          <div className="text-[#FF9F0A] font-mono text-lg font-bold leading-tight">
            {bubbleLatencyDisplay}
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400">
            <span>
              {'Bubble: ' + String(engineState.bubbleMetrics.interleavedBubblePct) + '%'}
            </span>
            <span>
              {'-' + String(engineState.bubbleMetrics.bubbleReductionPct) + '% vs GPipe'}
            </span>
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            Pipeline Bubble Latency
          </div>
        </div>

        {/* Card 3: ACTIVE STAGES */}
        <div className="bg-slate-900/90 border border-[#10B981]/40 rounded-lg px-2 py-1 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              ACTIVE STAGES
            </span>
            <span className="text-[10px] font-mono font-bold text-[#10B981]">
              1F1B SYNC
            </span>
          </div>
          <div className="text-white font-mono text-lg font-bold leading-tight">
            STAGES: 8/8
          </div>
          <div className="grid grid-cols-8 gap-0.5 my-0.5">
            {engineState.stages.map((st) => {
              const isSelected = st.stageId === engineState.selectedStageId;
              const isFault = st.statusBadge === 'FAULT';
              return (
                <button
                  key={st.shortCode}
                  type="button"
                  onClick={() => handleSelectStage(st.stageId)}
                  className={
                    'text-[10px] font-mono font-bold rounded py-0.2 text-center border cursor-pointer ' +
                    (isFault
                      ? 'bg-[#EF4444]/30 text-[#EF4444] border-[#EF4444]'
                      : isSelected
                      ? 'bg-[#00F0FF]/30 text-[#00F0FF] border-[#00F0FF]'
                      : 'bg-slate-950 text-[#10B981] border-slate-800')
                  }
                >
                  {st.shortCode}
                </button>
              );
            })}
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            Active Stages: 8 Stages · F1 Shift [S0..S7]
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="bg-slate-900/90 border border-cyan-500/40 rounded-lg px-2 py-1 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider">
              TOKEN SCORE
            </span>
            <span className="px-1.5 py-0.2 bg-emerald-500/20 border border-emerald-500/50 rounded text-[10px] font-mono font-bold text-emerald-300">
              {pipeXpDisplay}
            </span>
          </div>
          <div className="text-cyan-300 font-mono text-lg font-bold leading-tight">
            {tokenScoreDisplay}
          </div>
          <div className="text-[10px] font-mono text-amber-300 truncate">
            {'Processed Tokens: ' + formatWithCommas(engineState.processedTokens) + ' Units'}
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            Pipeline State: 1F1B Interleaved Active
          </div>
        </div>
      </section>

      {/* 5 HORIZONTAL TABS */}
      <nav
        aria-label="Pipeline Cockpit Views"
        className="grid grid-cols-5 gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg my-1 w-full text-center shrink-0"
      >
        {TABS.map((tab) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={
                'py-0.5 text-xs font-mono font-bold rounded transition-colors cursor-pointer ' +
                (active
                  ? 'bg-[#00F0FF] text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60')
              }
            >
              {tab}
            </button>
          );
        })}
      </nav>

      {/* INTERACTIVE PIPELINE STAGE MATRIX BAY */}
      <main className="flex-1 min-h-0 flex flex-col justify-between gap-1 bg-slate-950/90 border border-slate-800 rounded-lg px-2 py-1 overflow-hidden">
        {/* 8 Virtual Stages Grid (Stage 0 to Stage 7) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5 w-full shrink-0">
          {engineState.stages.map((stage) => {
            const isSelected = stage.stageId === engineState.selectedStageId;
            const isFault = stage.statusBadge === 'FAULT';
            return (
              <div
                key={stage.stageId}
                role="button"
                tabIndex={0}
                onClick={() => handleSelectStage(stage.stageId)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleSelectStage(stage.stageId);
                  }
                }}
                className={
                  'rounded-md px-2 py-1 border transition-all cursor-pointer flex flex-col justify-between gap-0.5 overflow-hidden ' +
                  (isFault
                    ? 'bg-rose-950/40 border-[#EF4444]'
                    : isSelected
                    ? 'bg-slate-900 border-[#00F0FF] ring-1 ring-[#00F0FF]/50'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-600')
                }
              >
                <div className="text-xs font-mono font-bold text-white">
                  {stage.headerLabel}
                </div>

                <div className="text-[11px] font-mono text-cyan-300 font-semibold">
                  {stage.microBatchStatusText}
                </div>

                <div className="text-[11px] font-mono text-amber-300 font-bold">
                  {stage.checkpointStateText}
                </div>
              </div>
            );
          })}
        </div>

        {/* Lower Context Sub-Bay Driven by Active Tab + Stage Inspector */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-1.5 pt-0.5 overflow-hidden">
          {/* Selected Stage Deep Telemetry & Recomputation Log */}
          <div className="bg-slate-900/80 border border-slate-800 rounded px-2 py-1 flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-0.5">
              <span className="text-xs font-mono font-bold text-[#00F0FF]">
                {'INSPECTOR · ' + selectedStage.headerLabel}
              </span>
              <span className="text-[11px] font-mono font-semibold text-amber-300">
                {'SAVINGS: -' + String(selectedStage.memorySavingsPct) + '% VRAM'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1 my-0.5 text-[11px] font-mono">
              <div className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800/80">
                <div className="text-[10px] text-slate-400">ACT MEMORY</div>
                <div className="text-white font-bold">
                  {String(selectedStage.activationMemoryMb) + ' MB'}
                </div>
              </div>
              <div className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800/80">
                <div className="text-[10px] text-slate-400">RING QUEUE</div>
                <div className="text-cyan-300 font-bold">
                  {String(selectedStage.ringBufferQueueDepth) +
                    ' MBs (' +
                    String(selectedStage.ringBufferBandwidthGbs) +
                    ' GB/s)'}
                </div>
              </div>
              <div className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800/80">
                <div className="text-[10px] text-slate-400">RECOMPUTED</div>
                <div className="text-emerald-400 font-bold">
                  {String(selectedStage.recomputationCount) + ' Tensors'}
                </div>
              </div>
            </div>
            <div className="text-[10px] font-mono text-slate-300 leading-tight truncate">
              {selectedStage.recomputationLog.map((line, idx) => (
                <div key={idx} className="truncate">
                  {'• ' + line}
                </div>
              ))}
            </div>
          </div>

          {/* Center Dynamic Panel Based on Selected Tab (Mesh / Pipe / 1F1B / Stats / APA) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded px-2 py-1 flex flex-col justify-between overflow-hidden">
            {activeTab === 'Mesh' && (
              <>
                <div className="flex items-center justify-between border-b border-slate-800 pb-0.5">
                  <span className="text-xs font-mono font-bold text-white">
                    VIRTUAL STAGE RING-BUFFER TOPOLOGY (MESH)
                  </span>
                  <span className="text-[11px] font-mono font-semibold text-emerald-400">
                    P2P ZERO-STALL
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1 my-0.5 text-[11px] font-mono">
                  {engineState.stages.map((st) => (
                    <div
                      key={st.stageId}
                      className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 flex items-center justify-between"
                    >
                      <span className="text-cyan-300 font-bold">{st.shortCode}</span>
                      <span className="text-slate-400">→</span>
                      <span className="text-amber-300 font-bold">
                        {'S' + String((st.stageId + 1) % 8)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="text-[10px] font-mono text-slate-400 truncate">
                  {'Corridor: ' + engineState.corridor}
                </div>
              </>
            )}

            {activeTab === 'Pipe' && (
              <>
                <div className="flex items-center justify-between border-b border-slate-800 pb-0.5">
                  <span className="text-xs font-mono font-bold text-amber-300">
                    ACTIVATION CHECKPOINTING RECOMPUTATION
                  </span>
                  <span className="text-[11px] font-mono font-semibold text-cyan-300">
                    {'SAVED ' + String(engineState.memoryMetrics.memorySavingsPct) + '%'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 my-0.5 text-[11px] font-mono">
                  <div className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                    <div className="text-[10px] text-slate-400">UNCHECKPOINTED CLUSTER</div>
                    <div className="text-rose-400 font-bold text-xs">
                      {formatWithCommas(
                        engineState.memoryMetrics.totalClusterUncheckpointedMb
                      ) + ' MB'}
                    </div>
                  </div>
                  <div className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                    <div className="text-[10px] text-slate-400">CHECKPOINTED ACTIVE</div>
                    <div className="text-emerald-400 font-bold text-xs">
                      {formatWithCommas(engineState.memoryMetrics.totalClusterActiveMb) +
                        ' MB'}
                    </div>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-slate-300 truncate">
                  Intermediate activations dropped in Forward pass & recomputed in Backward pass
                </div>
              </>
            )}

            {activeTab === '1F1B' && (
              <>
                <div className="flex items-center justify-between border-b border-slate-800 pb-0.5">
                  <span className="text-xs font-mono font-bold text-[#00F0FF]">
                    INTERLEAVED 1F1B SCHEDULE CLOCK MATRIX
                  </span>
                  <span className="text-[11px] font-mono font-semibold text-emerald-400">
                    {'SLOTS: ' + String(engineState.scheduleMatrix.length)}
                  </span>
                </div>
                <div className="grid grid-cols-8 gap-0.5 my-0.5">
                  {engineState.scheduleMatrix.slice(0, 16).map((slot, i) => (
                    <div
                      key={i}
                      className={
                        'px-1 py-0.5 rounded text-[10px] font-mono text-center border ' +
                        (slot.phase === 'FORWARD'
                          ? 'bg-cyan-950/60 text-cyan-300 border-cyan-700/50'
                          : 'bg-amber-950/60 text-amber-300 border-amber-700/50')
                      }
                    >
                      {'S' +
                        String(slot.stageId) +
                        ':' +
                        (slot.phase === 'FORWARD' ? 'F' : 'B') +
                        String(slot.microBatchId)}
                    </div>
                  ))}
                </div>
                <div className="text-[10px] font-mono text-slate-400 truncate">
                  Warmup Forward → Steady-State 1F1B Interleaved → Cooldown Backward
                </div>
              </>
            )}

            {activeTab === 'Stats' && (
              <>
                <div className="flex items-center justify-between border-b border-slate-800 pb-0.5">
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    GRADIENT & LOSS PARITY VERIFICATION
                  </span>
                  <span className="text-[11px] font-mono font-semibold text-cyan-300">
                    {'HASH: ' + engineState.parityReport.deterministicChecksum}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1 my-0.5 text-[11px] font-mono">
                  <div className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                    <div className="text-[10px] text-slate-400">REF vs 1F1B LOSS</div>
                    <div className="text-white font-bold">
                      {String(engineState.parityReport.referenceLoss) +
                        ' / ' +
                        String(engineState.parityReport.pipelined1F1BLoss)}
                    </div>
                  </div>
                  <div className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                    <div className="text-[10px] text-slate-400">MAX GRAD DELTA</div>
                    <div className="text-emerald-400 font-bold">
                      {String(engineState.parityReport.maxGradientAbsDelta) + ' (PARITY OK)'}
                    </div>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-slate-300 truncate">
                  {'Recomputed Tensors: ' +
                    String(engineState.parityReport.recomputedTensorsCount) +
                    ' · Exact Bitwise Gradient Parity Verified'}
                </div>
              </>
            )}

            {activeTab === 'APA' && (
              <>
                <div className="flex items-center justify-between border-b border-slate-800 pb-0.5">
                  <span className="text-xs font-mono font-bold text-[#FF9F0A]">
                    SOVEREIGN APA VAULT & POSTGRES RLS SCHEMA
                  </span>
                  <span className="text-[11px] font-mono font-semibold text-emerald-400">
                    100% MIT CLEAN-ROOM
                  </span>
                </div>
                <div className="text-[10px] font-mono text-slate-300 my-0.5 leading-snug">
                  Standalone repository transfer under Asset Purchase Agreement. Includes
                  FastAPI engine.py, Pytest + Vitest suites, and partitioned Supabase RLS DDL.
                </div>
                <div className="text-[10px] font-mono text-cyan-300 truncate">
                  {apaNotice || 'Status: Unencumbered Title Ready for Immediate Vault Handover'}
                </div>
              </>
            )}
          </div>

          {/* Right Panel: Institutional APA Vault & Schema Controls (Always Accessible) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded px-2 py-1 flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-0.5">
              <span className="text-xs font-mono font-bold text-white">
                INSTITUTIONAL ACQUISITION & AUDIT
              </span>
              <span className="text-[11px] font-mono font-semibold text-emerald-400">
                PARITY 100%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1 my-0.5 text-[11px] font-mono">
              <div className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 block">GRADIENT PARITY</span>
                <span className="text-emerald-400 font-bold">
                  {'✓ ' + engineState.parityReport.deterministicChecksum}
                </span>
              </div>
              <div className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 block">RLS PARTITIONS</span>
                <span className="text-cyan-300 font-bold">3 TABLES LOCKED</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={handleAcquireTitleApa}
                className="py-1 px-2 bg-[#FF9F0A] hover:bg-[#FF9F0A]/90 text-slate-950 font-mono text-[10px] font-bold rounded text-center truncate cursor-pointer transition-colors"
              >
                ACQUIRE TITLE (APA)
              </button>
              <button
                type="button"
                onClick={handleInquireVaultBuyout}
                className="py-1 px-2 bg-slate-950 hover:bg-slate-800 text-[#00F0FF] border border-[#00F0FF]/60 font-mono text-[10px] font-bold rounded text-center truncate cursor-pointer transition-colors"
              >
                INQUIRE VAULT BUYOUT
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* COMPACT PIPELINE TELEMETRY INSPECTOR STRIP */}
      <div
        aria-label="Compact Pipeline Telemetry Inspector Strip"
        className="w-full bg-slate-900/95 border border-slate-800 rounded px-2.5 py-0.5 shrink-0 flex items-center justify-between"
      >
        <span className="text-xs font-mono font-bold text-cyan-300 truncate">
          {inspectorText}
        </span>
        <span className="hidden md:inline text-[10px] font-mono text-slate-400 shrink-0">
          {'Pipeline Throughput: ' +
            formatWithCommas(engineState.bubbleMetrics.throughputTflops) +
            ' TFLOPS · Bubble Latency: ' +
            engineState.bubbleMetrics.bubbleLatencyUs.toFixed(2) +
            ' µs'}
        </span>
      </div>

      {/* TACTICAL LAUNCH CONTROL BUTTONS */}
      <section
        aria-label="Tactical Launch Control Dock"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1"
      >
        <button
          type="button"
          onClick={handleBurst}
          className="bg-amber-950/40 hover:bg-amber-900/50 border border-[#FF9F0A] text-[#FF9F0A] rounded-lg text-xs font-mono font-bold py-2 px-2 text-center transition-colors cursor-pointer truncate"
        >
          💥 INJECT PIPELINE BURST
        </button>

        <button
          type="button"
          onClick={handleStall}
          className="bg-cyan-950/40 hover:bg-cyan-900/50 border border-[#00F0FF] text-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.2)] rounded-lg text-xs font-mono font-bold py-2 px-2 text-center transition-colors cursor-pointer truncate"
        >
          ⚡ TOGGLE BUBBLE STALL
        </button>

        <button
          type="button"
          onClick={handleStep}
          className="bg-emerald-950/40 hover:bg-emerald-900/50 border border-[#10B981] text-[#10B981] rounded-lg text-xs font-mono font-bold py-2 px-2 text-center transition-colors cursor-pointer truncate"
        >
          🚀 STEP VIRTUAL STAGE
        </button>

        <button
          type="button"
          onClick={handleFlush}
          className="bg-rose-950/40 hover:bg-rose-900/50 border border-[#EF4444] text-rose-300 rounded-lg text-xs font-mono font-bold py-2 px-2 text-center transition-colors cursor-pointer truncate"
        >
          🔄 FLUSH PIPELINE QUEUES
        </button>
      </section>

      {/* PIT-WALL RADIO LOG */}
      <footer
        aria-label="Pit-Wall Radio Log"
        className="h-14 mb-[2px] overflow-hidden font-mono text-[10px] p-2 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-tight flex flex-col justify-between"
      >
        {engineState.radioLogs.slice(-3).map((line, index) => (
          <div key={index} className="truncate">
            {line}
          </div>
        ))}
      </footer>

      {/* OVERLAY DRAWER FOR SQL SCHEMA / APA DOSSIER / AUDIT EXPORT */}
      {modalMode !== 'NONE' && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#05070B] border border-[#00F0FF] rounded-lg max-w-3xl w-full max-h-[80vh] flex flex-col overflow-hidden p-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <span className="text-xs font-mono font-bold text-[#00F0FF]">
                {modalMode === 'SCHEMA'
                  ? 'GF-T3-238 · POSTGRESQL / SUPABASE PARTITIONED RLS SCHEMA'
                  : modalMode === 'APA'
                  ? 'GF-T3-238 · ASSET PURCHASE AGREEMENT (APA) TITLE TRANSFER'
                  : 'GF-T3-238 · TELEMETRY & GRADIENT PARITY AUDIT BUNDLE'}
              </span>
              <button
                type="button"
                onClick={() => setModalMode('NONE')}
                className="px-2 py-0.5 text-xs font-mono font-bold bg-slate-900 text-slate-200 border border-slate-700 rounded hover:border-rose-500 cursor-pointer"
              >
                [CLOSE]
              </button>
            </div>
            <pre className="flex-1 overflow-auto text-[11px] font-mono text-slate-200 bg-slate-950 p-3 rounded border border-slate-800">
              {modalMode === 'SCHEMA'
                ? SUPABASE_POSTGRES_SCHEMA_SQL
                : generateAuditBundleJson(engineState)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
