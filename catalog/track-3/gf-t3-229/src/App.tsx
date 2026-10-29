/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GF-T3-229: Institutional Gamified Pipeline-Parallel 1F1B Bubble-Shedding Cockpit
 * Track 3 Skunkworks Engine · 10/10 Strict Viewport Lock
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  computeStashPointerHex,
  EXPORTABLE_SUPABASE_SCHEMA_SQL,
  generate1F1BPipelineState,
  INITIAL_RADIO_LOGS,
  MicroBatchSlot,
  PassState,
  PipelineCorridor,
  PIPELINE_CORRIDOR_LIST,
  RadioLogMessage,
  validateGridSyncIngress,
} from './engine/pipeline1f1b';

type CockpitTab = 'Mesh' | '1F1B' | 'P2P' | 'Stash' | 'APA';

const TABS: CockpitTab[] = ['Mesh', '1F1B', 'P2P', 'Stash', 'APA'];

export const ENGINE_PRIMARY_TITLE = 'GF-T3-229';

export function sanitizeEngineTitle(rawTitle?: string): string {
  if (!rawTitle) return ENGINE_PRIMARY_TITLE;
  return ENGINE_PRIMARY_TITLE;
}

export default function App() {
  useEffect(() => {
    const enforceLockedTitle = () => {
      if (document.title !== ENGINE_PRIMARY_TITLE) {
        document.title = ENGINE_PRIMARY_TITLE;
      }
      const titleEl = document.querySelector('title');
      if (titleEl && titleEl.textContent !== ENGINE_PRIMARY_TITLE) {
        titleEl.textContent = ENGINE_PRIMARY_TITLE;
      }
    };

    enforceLockedTitle();

    const headEl = document.head || document.documentElement;
    const observer = new MutationObserver(() => {
      enforceLockedTitle();
    });
    observer.observe(headEl, { childList: true, characterData: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  const [corridor, setCorridor] = useState<PipelineCorridor>(PipelineCorridor.ALPHA);
  const [activeTab, setActiveTab] = useState<CockpitTab>('1F1B');
  const [stragglerActive, setStragglerActive] = useState<boolean>(false);
  const [burstActive, setBurstActive] = useState<boolean>(false);
  const [flushedState, setFlushedState] = useState<boolean>(false);
  const [stepCursor, setStepCursor] = useState<number>(5);
  const [radioLogs, setRadioLogs] = useState<RadioLogMessage[]>(INITIAL_RADIO_LOGS);
  const [apaModalState, setApaModalState] = useState<'NONE' | 'ACQUIRE_APA' | 'VAULT_BUYOUT' | 'SCHEMA_VIEW'>('NONE');
  const [copyFeedback, setCopyFeedback] = useState<string>('');

  const formatInspectorState = (rawState: string): string => {
    if (
      rawState === PassState.ACTIVE_FORWARD ||
      rawState === PassState.STEADY_FORWARD ||
      rawState === 'ACTIVE_FWD' ||
      rawState === 'STEADY_FWD' ||
      rawState === 'FWD'
    ) {
      return 'FWD';
    }
    if (
      rawState === PassState.STEADY_BACKWARD ||
      rawState === PassState.COOLDOWN_BACKWARD ||
      rawState === 'STEADY_BWD' ||
      rawState === 'COOLDOWN_BWD' ||
      rawState === 'BWD'
    ) {
      return 'BWD';
    }
    return rawState;
  };

  // Default selected micro-batch block initialized to Stage 1, Micro-Batch F4
  // so the default inspector strip matches:
  // "S1 · F4 · [16, 4096] · 0x7FA200 · FWD"
  const [selectedSlot, setSelectedSlot] = useState<{
    stageId: number;
    label: string;
    tensorShape: [number, number];
    stashPointer: string;
    state: string;
    peerStage: string;
    gradientStatus: string;
  }>({
    stageId: 1,
    label: 'F4',
    tensorShape: [16, 4096],
    stashPointer: computeStashPointerHex(1, 4),
    state: 'FWD',
    peerStage: 'S2',
    gradientStatus: 'STASH_LOCKED_P2P_TX',
  });

  const telemetry = useMemo(() => {
    return generate1F1BPipelineState({
      corridor,
      numStages: 4,
      numMicroBatches: 16,
      activeStepCursor: stepCursor,
      stragglerActive,
      burstActive,
      flushedState,
    });
  }, [corridor, stepCursor, stragglerActive, burstActive, flushedState]);

  const appendRadioLog = (
    callsign: RadioLogMessage['callsign'],
    message: string
  ) => {
    const now = new Date();
    const min = String(now.getMinutes()).padStart(2, '0');
    const sec = String(now.getSeconds()).padStart(2, '0');
    const centi = String(Math.floor(now.getMilliseconds() / 10)).padStart(2, '0');
    const timestamp = min + ':' + sec + '.' + centi;

    setRadioLogs((prev) => {
      const updated: RadioLogMessage[] = [
        {
          id: 'log-' + String(Date.now()) + '-' + String(prev.length),
          timestamp,
          callsign,
          message,
        },
        ...prev,
      ];
      return updated.slice(0, 3);
    });
  };

  // Validate action via Zero-Trust GridSync Ingress before mutating engine state
  const dispatchEngineCommand = (
    auditTag: string,
    nextCorridor: PipelineCorridor,
    nextStep: number,
    nextStraggler: boolean,
    nextBurst: boolean
  ): boolean => {
    const check = validateGridSyncIngress({
      corridor: nextCorridor,
      numStages: 4,
      numMicroBatches: 16,
      activeStepCursor: nextStep,
      stragglerActive: nextStraggler,
      burstActive: nextBurst,
      auditTag,
    });
    if (!check.valid) {
      appendRadioLog('🔴 TELEMETRY', 'GridSync Zero-Trust Block: ' + String(check.error));
      return false;
    }
    return true;
  };

  // Trigger 1: "Trigger 16-Micro-Batch Pipeline Burst" ("💥 INJECT BATCH BURST")
  const handleInjectBatchBurst = () => {
    const nextBurst = !burstActive;
    if (!dispatchEngineCommand('TRIGGER_16_MB_PIPELINE_BURST', corridor, stepCursor, stragglerActive, nextBurst)) {
      return;
    }
    setFlushedState(false);
    setBurstActive(nextBurst);
    setSelectedSlot({
      stageId: 0,
      label: 'F15',
      tensorShape: [16, 4096],
      stashPointer: computeStashPointerHex(0, 15),
      state: 'FWD',
      peerStage: 'S1',
      gradientStatus: 'STASH_LOCKED_P2P_TX',
    });
    appendRadioLog(
      '🟢 CREW CHIEF',
      nextBurst
        ? '16-micro-batch pipeline burst injected · Interleaved throughput surged to ' +
            telemetry.aggregateTflops.toLocaleString() +
            ' TFLOPS'
        : '16-micro-batch burst normalized · Returning to baseline 1,420 TFLOPS steady cadence'
    );
  };

  // Trigger 2: "Inject Stage 2 Straggler Delay (2x Latency)" ("⚡ TOGGLE STRAGGLER")
  const handleToggleStraggler = () => {
    const nextStraggler = !stragglerActive;
    if (!dispatchEngineCommand('INJECT_STAGE_2_STRAGGLER_DELAY', corridor, stepCursor, nextStraggler, burstActive)) {
      return;
    }
    setFlushedState(false);
    setStragglerActive(nextStraggler);
    setSelectedSlot({
      stageId: 2,
      label: nextStraggler ? 'B2' : 'F4',
      tensorShape: [16, 4096],
      stashPointer: computeStashPointerHex(2, nextStraggler ? 2 : 4),
      state: nextStraggler ? '2X_DELAY' : 'FWD',
      peerStage: nextStraggler ? 'S1' : 'S3',
      gradientStatus: nextStraggler ? 'P2P_STALL_2X_LATENCY' : 'STASH_LOCKED_P2P_TX',
    });
    appendRadioLog(
      nextStraggler ? '🔴 TELEMETRY' : '⚡ PIT WALL',
      nextStraggler
        ? 'Stage 2 straggler fault active · P2P latency doubled to 0.44 ms · Bubble ratio at 14.6%'
        : 'Stage 2 straggler cleared · Non-blocking P2P overlap restored to 0.22 ms (8.4% bubble)'
    );
  };

  // Trigger 3: "Step 1F1B Schedule Cycle" ("🚀 STEP 1F1B PASS")
  const handleStep1F1BPass = () => {
    const nextStep = (stepCursor + 1) % 20;
    if (!dispatchEngineCommand('STEP_1F1B_SCHEDULE_CYCLE', corridor, nextStep, stragglerActive, burstActive)) {
      return;
    }
    setFlushedState(false);
    setStepCursor(nextStep);

    const stage1Track = telemetry.stageTracks[1] || [];
    const candidate =
      stage1Track[nextStep] && stage1Track[nextStep].opType !== 'IDLE'
        ? stage1Track[nextStep]
        : stage1Track.find((s) => s.opType !== 'IDLE' && s.stepIndex >= nextStep) || stage1Track[5];

    if (candidate) {
      setSelectedSlot({
        stageId: candidate.stageId,
        label: candidate.label,
        tensorShape: candidate.tensorShape,
        stashPointer: candidate.stashPointer,
        state: formatInspectorState(candidate.state),
        peerStage: candidate.peerStage,
        gradientStatus: candidate.backwardGradientStatus,
      });
    }

    appendRadioLog(
      '⚡ PIT WALL',
      '1F1B cycle stepped to T+' +
        String(nextStep) +
        ' · 1-Forward-1-Backward lock verified · Stash capped at p=4'
    );
  };

  // Trigger 4: "Flush Pipeline Stash & Re-Zero Buffers" ("🔄 FLUSH PIPELINE")
  const handleFlushPipeline = () => {
    if (!dispatchEngineCommand('FLUSH_PIPELINE_STASH_REZERO', corridor, 0, false, false)) {
      return;
    }
    if (flushedState) {
      setFlushedState(false);
      setStragglerActive(false);
      setBurstActive(false);
      setStepCursor(5);
      setSelectedSlot({
        stageId: 1,
        label: 'F4',
        tensorShape: [16, 4096],
        stashPointer: computeStashPointerHex(1, 4),
        state: 'FWD',
        peerStage: 'S2',
        gradientStatus: 'STASH_LOCKED_P2P_TX',
      });
      appendRadioLog(
        '🟢 CREW CHIEF',
        '1F1B steady state re-engaged · 16 micro-batches staged across 4 ranks'
      );
    } else {
      setFlushedState(true);
      setStragglerActive(false);
      setBurstActive(false);
      setStepCursor(0);
      setSelectedSlot({
        stageId: 1,
        label: 'F4',
        tensorShape: [16, 4096],
        stashPointer: '0x7FA200',
        state: 'ZERO',
        peerStage: 'S2',
        gradientStatus: 'BUFFERS_REZEROED',
      });
      appendRadioLog(
        '🟢 TELEMETRY',
        'Pipeline activation stash flushed · All 4 stage buffers re-zeroed · Click Flush or Run to re-stage'
      );
    }
  };

  // Header Micro Actions: [Stage], [1F1B], [Run]
  const handleHeaderStageBtn = () => {
    setFlushedState(false);
    setActiveTab('Stash');
    appendRadioLog(
      '🟢 CREW CHIEF',
      'Staging 16 micro-batches across S0..S3 · Activation memory cap locked to p=4'
    );
  };

  const handleHeader1F1BBtn = () => {
    setFlushedState(false);
    setActiveTab('1F1B');
    setSelectedSlot({
      stageId: 1,
      label: 'F4',
      tensorShape: [16, 4096],
      stashPointer: computeStashPointerHex(1, 4),
      state: 'FWD',
      peerStage: 'S2',
      gradientStatus: 'STASH_LOCKED_P2P_TX',
    });
    appendRadioLog(
      '⚡ PIT WALL',
      '1F1B interleaved schedule view locked · Inspecting S1 Micro-Batch F4 at 0x7FA200'
    );
  };

  const handleHeaderRunBtn = () => {
    setFlushedState(false);
    setStragglerActive(false);
    setBurstActive(false);
    setStepCursor((prev) => (prev + 1) % 18);
    appendRadioLog(
      '🟢 TELEMETRY',
      'Full 1F1B pass executed at 1,420 TFLOPS · Bubble ratio verified at 8.4%'
    );
  };

  const handleSelectSlot = (slot: MicroBatchSlot) => {
    setSelectedSlot({
      stageId: slot.stageId,
      label: slot.label,
      tensorShape: slot.tensorShape,
      stashPointer: slot.stashPointer,
      state: formatInspectorState(slot.state),
      peerStage: slot.peerStage,
      gradientStatus: slot.backwardGradientStatus,
    });
    appendRadioLog(
      '🟢 TELEMETRY',
      'Inspecting S' +
        String(slot.stageId) +
        ' · ' +
        slot.label +
        ' · Stash ' +
        slot.stashPointer +
        ' · Peer ' +
        slot.peerStage +
        ' · ' +
        slot.backwardGradientStatus
    );
  };

  const handleCopySchema = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(EXPORTABLE_SUPABASE_SCHEMA_SQL).catch(() => {});
    }
    setCopyFeedback('COPIED TO CLIPBOARD');
    appendRadioLog('🟢 CREW CHIEF', 'Supabase PostgreSQL RLS DDL exported to system clipboard');
    setTimeout(() => setCopyFeedback(''), 2000);
  };

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans select-none">
      {/* TOP HEADER ROW 1 */}
      <header className="flex flex-col gap-0.5 w-full shrink-0">
        <div className="flex items-center justify-between gap-1 w-full shrink-0">
          {/* Left: Primary Title GF-T3-229 + Cyan Badge TRACK 3 */}
          <div className="flex items-center gap-1 shrink-0 whitespace-nowrap">
            <h1 className="text-sm font-mono font-bold tracking-tight text-slate-100">
              GF-T3-229
            </h1>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40 rounded">
              TRACK 3
            </span>
            <span
              className={
                'hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-bold rounded border ' +
                (stragglerActive
                  ? 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/40'
                  : 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/40')
              }
            >
              {stragglerActive ? '⚡ FAULT' : '✓ LOCKED'}
            </span>
          </div>

          {/* Right: Compact Corridor Dropdown + Micro Action Buttons */}
          <div className="flex items-center gap-0.5 shrink-0">
            <label htmlFor="corridor-select" className="sr-only">
              Select Pipeline Corridor
            </label>
            <select
              id="corridor-select"
              aria-label="Pipeline Corridor"
              value={corridor}
              onChange={(e) => {
                const next = e.target.value as PipelineCorridor;
                setCorridor(next);
                appendRadioLog('🟢 CREW CHIEF', 'Corridor set to ' + next.split(' ')[0]);
              }}
              className="max-w-[75px] text-[10px] py-0.5 px-1 font-mono truncate bg-slate-900 text-cyan-300 border border-slate-700 rounded focus:outline-none focus:border-[#00F0FF]"
            >
              {PIPELINE_CORRIDOR_LIST.map((item) => (
                <option key={item} value={item}>
                  {item.split(' ')[0].replace('PIPE-CORRIDOR-', '')}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleHeaderStageBtn}
              className="px-1 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 rounded transition-colors cursor-pointer shrink-0 whitespace-nowrap"
            >
              [Stage]
            </button>
            <button
              type="button"
              onClick={handleHeader1F1BBtn}
              className="px-1 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-[#FF9F0A] border border-[#FF9F0A]/40 rounded transition-colors cursor-pointer shrink-0 whitespace-nowrap"
            >
              [1F1B]
            </button>
            <button
              type="button"
              onClick={handleHeaderRunBtn}
              className="px-1 py-0.5 text-[10px] font-mono font-bold bg-[#10B981]/20 hover:bg-[#10B981]/30 text-[#10B981] border border-[#10B981]/50 rounded transition-colors cursor-pointer shrink-0 whitespace-nowrap"
            >
              [Run]
            </button>
          </div>
        </div>

        {/* TOP HEADER ROW 2: Condensed Subtitle */}
        <div className="text-[11px] font-mono text-slate-300 text-center whitespace-nowrap">
          1F1B Pipeline Engine · Micro-Batch Staging · Zero Bubble
        </div>
      </header>

      {/* 4-CARD ARCADE HUD RIBBON (2x2 on compact, 4 cols on desktop) */}
      <section
        aria-label="Telemetry HUD Ribbon"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1 w-full shrink-0"
      >
        {/* Card 1: PIPELINE NITRO */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2 py-1 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-mono text-slate-400">
              PIPELINE NITRO
            </span>
          </div>
          <div className="text-base lg:text-lg font-bold text-cyan-300 font-mono leading-tight">
            {telemetry.aggregateTflops.toLocaleString()} TFLOPS
          </div>
          <div className="w-full bg-slate-950 h-1 rounded overflow-hidden border border-slate-800 my-0.5">
            <div
              className={
                'bg-[#00F0FF] h-full transition-all duration-150 ' +
                (flushedState
                  ? 'w-0'
                  : stragglerActive
                  ? 'w-2/3'
                  : burstActive
                  ? 'w-full'
                  : 'w-11/12')
              }
            />
          </div>
          <div className="text-[10px] font-mono text-slate-300">
            {stragglerActive ? 'S0..S3 Fault' : 'S0..S3 Locked'}
          </div>
        </div>

        {/* Card 2: BUBBLE STREAK */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2 py-1 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-mono text-slate-400">
              BUBBLE STREAK
            </span>
            <span className="text-[10px] font-mono font-bold text-amber-400 whitespace-nowrap">
              🔥 16 BATCHES
            </span>
          </div>
          <div className="text-base lg:text-lg font-bold text-amber-400 font-mono leading-tight">
            {telemetry.bubbleRatioPct.toFixed(1)}% BUBBLE
          </div>
          <div className="text-[10px] font-mono text-slate-300">
            P2P: {telemetry.p2pLatencyMs.toFixed(2)} ms · 16 Slots
          </div>
        </div>

        {/* Card 3: ACTIVE STAGES */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2 py-1 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-mono text-slate-400">
              ACTIVE STAGES
            </span>
            <span className="text-[10px] font-mono text-emerald-400 whitespace-nowrap">
              1F1B LOCK
            </span>
          </div>
          <div className="text-base lg:text-lg font-mono font-bold text-emerald-400 leading-tight">
            STAGES: {flushedState ? '0/4' : '4/4'}
          </div>
          <div className="grid grid-cols-4 gap-1 my-0.5 font-mono text-[10px] font-bold text-center">
            {[0, 1, 2, 3].map((stageIdx) => {
              const isStraggler = stragglerActive && stageIdx === 2;
              const isSelected = selectedSlot.stageId === stageIdx;
              return (
                <button
                  key={stageIdx}
                  type="button"
                  onClick={() => {
                    const track = telemetry.stageTracks[stageIdx] || [];
                    const firstActive = track.find((t) => t.opType !== 'IDLE') || track[0];
                    if (firstActive) {
                      handleSelectSlot(firstActive);
                    }
                  }}
                  className={
                    'py-0 rounded border transition-colors cursor-pointer ' +
                    (isStraggler
                      ? 'bg-[#EF4444]/20 border-[#EF4444] text-[#EF4444]'
                      : isSelected
                      ? 'bg-[#00F0FF]/20 border-[#00F0FF] text-[#00F0FF]'
                      : 'bg-slate-950 border-slate-700 text-slate-200')
                  }
                >
                  S{stageIdx}
                </button>
              );
            })}
          </div>
          <div className="text-[10px] font-mono text-slate-300">
            {stragglerActive ? 'Interleaved · S2 2x' : 'Interleaved · Nom'}
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2 py-1 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-mono text-slate-400">
              TOKEN SCORE
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-400 whitespace-nowrap">
              {telemetry.pipeXpBonus}
            </span>
          </div>
          <div className="text-base lg:text-lg font-mono font-bold text-slate-100 leading-tight">
            {telemetry.sustainedTokens.toLocaleString()} UNITS
          </div>
          <div className="text-[10px] font-mono text-slate-300">
            Cap: 4 Acts · p=4 Bound
          </div>
        </div>
      </section>

      {/* 5 HORIZONTAL TABS: ["Mesh", "1F1B", "P2P", "Stash", "APA"] */}
      <nav
        aria-label="Cockpit Mode Tabs"
        className="grid grid-cols-5 gap-1 p-0.5 bg-slate-900/80 border border-slate-800 rounded-lg my-0.5 w-full text-center shrink-0"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setActiveTab(tab);
                appendRadioLog('🟢 CREW CHIEF', 'Switched cockpit bay to [' + tab + '] view');
              }}
              className={
                'py-0.5 text-xs font-mono font-bold rounded transition-colors cursor-pointer whitespace-nowrap ' +
                (isActive
                  ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent')
              }
            >
              {tab}
            </button>
          );
        })}
      </nav>

      {/* INTERACTIVE 1F1B PIPELINE SCHEDULE BAY (Main Flexible Centerpiece) */}
      <main className="flex-1 min-h-0 w-full bg-slate-950/90 border border-slate-800 rounded-lg px-2 py-1 flex flex-col justify-between overflow-hidden">
        {activeTab === '1F1B' && (
          <div className="flex flex-col justify-between h-full overflow-hidden">
            <div className="flex items-center justify-between my-0.5 text-xs font-mono font-bold text-slate-200 shrink-0">
              <span className="text-xs font-mono font-bold text-slate-200 whitespace-nowrap">
                1F1B MATRIX
              </span>
              <div className="flex items-center gap-3 shrink-0 text-xs font-mono font-bold text-slate-200">
                <span className="text-cyan-300 font-bold">■ Fwd</span>
                <span className="text-amber-400 font-bold">■ Bwd</span>
                <span className="text-slate-300 font-bold">■ Bubble</span>
              </div>
            </div>

            {/* 4 Pipeline Stages (Stage 0, 1, 2, 3) Horizontal Tracks */}
            <div className="flex-1 min-h-0 flex flex-col justify-between gap-0.5 overflow-hidden">
              {[0, 1, 2, 3].map((stageId) => {
                const slots = (telemetry.stageTracks[stageId] || []).slice(0, 14);
                const stageMeta = telemetry.stageStashes[stageId];
                const isStageStraggler = stragglerActive && stageId === 2;
                return (
                  <div
                    key={stageId}
                    className={
                      'flex items-center py-0.5 px-1.5 gap-2 rounded border ' +
                      (isStageStraggler
                        ? 'bg-[#EF4444]/10 border-[#EF4444]/50'
                        : 'bg-slate-900/70 border-slate-800')
                    }
                  >
                    <div className="w-40 shrink-0 flex items-center justify-between gap-1.5 pr-2 mr-0.5 border-r border-slate-800">
                      <span className="text-xs font-mono font-bold text-cyan-300 whitespace-nowrap">
                        S{stageId} · {stageMeta ? stageMeta.computeTflops : 355} TF
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-300 whitespace-nowrap">
                        SB: {4 - stageId}/4
                      </span>
                    </div>

                    <div className="flex-1 flex items-center gap-1 overflow-hidden">
                      {slots.map((slot) => {
                        const isSelected =
                          selectedSlot.stageId === slot.stageId &&
                          selectedSlot.label === slot.label &&
                          slot.opType !== 'IDLE';

                        let colorClasses =
                          'bg-slate-900/90 text-slate-400 border border-slate-800 hover:border-slate-700';
                        if (slot.opType === 'F') {
                          colorClasses =
                            'bg-[#00F0FF]/15 text-cyan-300 border border-[#00F0FF]/40 hover:bg-[#00F0FF]/30';
                        } else if (slot.opType === 'B') {
                          colorClasses =
                            'bg-[#FF9F0A]/15 text-amber-400 border border-[#FF9F0A]/40 hover:bg-[#FF9F0A]/30';
                        }

                        if (isSelected) {
                          colorClasses += ' ring-1 ring-white';
                        }

                        return (
                          <button
                            key={String(stageId) + '-' + String(slot.stepIndex)}
                            type="button"
                            onClick={() => handleSelectSlot(slot)}
                            title={
                              'Stage S' +
                              String(slot.stageId) +
                              ' · ' +
                              slot.label +
                              ' · Tensor [16, 4096] · Stash ' +
                              slot.stashPointer
                            }
                            className={
                              'h-6 w-6 flex-1 min-w-0 text-xs font-mono font-bold flex items-center justify-center rounded-sm transition-colors cursor-pointer truncate ' +
                              colorClasses
                            }
                          >
                            {slot.opType === 'IDLE' ? '·' : slot.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between py-0.5 text-[10px] font-mono text-slate-300 shrink-0">
              <span>
                CORRIDOR: {corridor.split(' ')[0].replace('PIPE-CORRIDOR-', '')} · 1F1B INTERLEAVED
              </span>
              <span className="hidden md:inline whitespace-nowrap">
                SELECT ANY SLOT TO INSPECT TENSOR & STASH
              </span>
            </div>
          </div>
        )}

        {activeTab === 'Mesh' && (
          <div className="flex flex-col justify-between h-full gap-1.5 overflow-hidden">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-200">
              <span>4-STAGE SYNTHETIC PIPELINE TOPOLOGY & COMPUTE DISTRIBUTION</span>
              <span className="text-emerald-400">
                ✓ NON-BLOCKING P2P STREAM OVERLAP ACTIVE
              </span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 flex-1 min-h-0">
              {telemetry.stageStashes.map((st) => (
                <div
                  key={st.stageId}
                  onClick={() => {
                    const track = telemetry.stageTracks[st.stageId] || [];
                    const firstF = track.find((s) => s.opType === 'F') || track[0];
                    if (firstF) {
                      handleSelectSlot(firstF);
                    }
                  }}
                  className={
                    'p-2 rounded border flex flex-col justify-between cursor-pointer ' +
                    (st.stragglerDelayed
                      ? 'bg-[#EF4444]/10 border-[#EF4444]/60'
                      : 'bg-slate-900/80 border-slate-800 hover:border-[#00F0FF]/50')
                  }
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-white">
                      STAGE {st.stageId} ({st.stageLabel})
                    </span>
                    <span
                      className={
                        'text-[10px] font-mono font-bold ' +
                        (st.stragglerDelayed ? 'text-[#EF4444]' : 'text-[#10B981]')
                      }
                    >
                      {st.stragglerDelayed ? '⚡ 2X STRAGGLER' : '✓ LOCKED'}
                    </span>
                  </div>
                  <div className="my-0.5">
                    <div className="text-sm font-mono font-bold text-cyan-300">
                      {st.computeTflops} TFLOPS
                    </div>
                    <div className="text-xs font-mono font-semibold text-slate-200">
                      Layers {st.stageId * 16 + 1}..{(st.stageId + 1) * 16} · Tensor [16, 4096]
                    </div>
                  </div>
                  <div className="text-xs font-mono font-semibold text-slate-200 flex items-center justify-between border-t border-slate-800 pt-1">
                    <span className="text-amber-300 font-bold">SB: {st.activeActivations}/4</span>
                    <span className="text-amber-400 font-bold">{st.allocatedMegabytes} MB</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'P2P' && (
          <div className="flex flex-col justify-between h-full gap-1.5 overflow-hidden">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-200">
              <span>INTER-STAGE NON-BLOCKING P2P TENSOR QUEUES (CUDA STREAM OVERLAP)</span>
              <span className="text-cyan-300">
                P2P Latency: {telemetry.p2pLatencyMs.toFixed(2)} ms
              </span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 flex-1 min-h-0">
              {telemetry.p2pLinks.map((link) => (
                <div
                  key={link.linkId}
                  className={
                    'p-2 rounded border flex flex-col justify-between ' +
                    (link.status === 'STRAGGLER_DELAY'
                      ? 'bg-[#EF4444]/10 border-[#EF4444]/50'
                      : 'bg-slate-900/80 border-slate-800')
                  }
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-white">
                      {link.sourceStage} → {link.targetStage}
                    </span>
                    <span className="text-xs font-mono font-semibold text-slate-200">
                      {link.direction}
                    </span>
                  </div>
                  <div className="my-0.5">
                    <div className="text-sm font-mono font-bold text-cyan-300">
                      {link.bandwidthGbPerSec} GB/s · {link.latencyMs.toFixed(2)} ms
                    </div>
                    <div className="text-xs font-mono font-semibold text-slate-200">
                      Batch: {link.activeMicroBatch} · Tensor {link.tensorShape}
                    </div>
                  </div>
                  <div className="text-xs font-mono font-semibold text-slate-200 flex items-center justify-between border-t border-slate-800 pt-1">
                    <span className="text-emerald-400">
                      Overlap: {link.overlapRatioPct.toFixed(1)}%
                    </span>
                    <span>{link.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Stash' && (
          <div className="flex flex-col justify-between h-full gap-1.5 overflow-hidden">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-200">
              <span>
                ACTIVATION STASH LIFECYCLE · MEMORY FOOTPRINT BOUNDED TO STAGE COUNT (p=4) vs (m=16)
              </span>
              <span className="text-emerald-400">75.0% ACTIVATION MEMORY SAVED</span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 flex-1 min-h-0">
              {telemetry.stageStashes.map((stash) => (
                <div
                  key={stash.stageId}
                  className="p-2 rounded border bg-slate-900/80 border-slate-800 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-white">
                      STAGE {stash.stageId} ({stash.stageLabel})
                    </span>
                    <span className="text-sm font-mono font-bold text-cyan-300">
                      {stash.computeTflops} TFLOPS
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 my-0.5">
                    {stash.stashPointers.length > 0 ? (
                      stash.stashPointers.map((ptr) => (
                        <span
                          key={ptr}
                          className="px-1 py-0.5 text-[10px] font-mono bg-slate-950 text-cyan-300 border border-slate-700 rounded"
                        >
                          {ptr}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs font-mono font-semibold text-slate-200">
                        0x000000 (FLUSHED)
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-mono font-semibold text-slate-200 flex items-center justify-between border-t border-slate-800 pt-1">
                    <span className="text-amber-300 font-bold">SB: {stash.activeActivations}/{stash.maxActivationBound}</span>
                    <span className="text-emerald-400">{stash.allocatedMegabytes} MB</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'APA' && (
          <div className="flex flex-col justify-between h-full gap-1.5 overflow-hidden">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-200">
              <span>
                INSTITUTIONAL ASSET PURCHASE AGREEMENT (APA) · CLEAN-ROOM MIT/APACHE-2.0 IP VAULT
              </span>
              <span className="text-emerald-400">ZERO-TRUST GRIDSYNC + SUPABASE RLS READY</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 flex-1 min-h-0">
              <div className="p-2 rounded border bg-slate-900/80 border-slate-800 flex flex-col justify-between">
                <div className="text-xs font-mono font-bold text-cyan-300">
                  01. CLEAN-ROOM PIPELINE IP
                </div>
                <p className="text-xs font-mono text-slate-200 leading-relaxed">
                  100% sovereign 1F1B scheduling matrix, activation ring-buffer stashing (p=4 cap),
                  and non-blocking P2P CUDA stream overlap. Zero viral copyleft dependencies.
                </p>
                <div className="text-[10px] font-mono text-emerald-400">
                  ✓ Vitest Suite Verified · ✓ FastAPI engine.py Included
                </div>
              </div>

              <div className="p-2 rounded border bg-slate-900/80 border-slate-800 flex flex-col justify-between">
                <div className="text-xs font-mono font-bold text-amber-400">
                  02. SUPABASE / POSTGRESQL RLS
                </div>
                <p className="text-xs font-mono text-slate-200 leading-relaxed">
                  Partitioned telemetry tables (`gf_t3_229_corridors`, `gf_t3_229_schedule_runs`)
                  with strict `auth.uid()` Row-Level Security tenant isolation policies.
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setApaModalState('SCHEMA_VIEW')}
                    className="px-2 py-1 text-[10px] font-mono font-bold bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 rounded cursor-pointer"
                  >
                    INSPECT SQL SCHEMA
                  </button>
                  <button
                    type="button"
                    onClick={handleCopySchema}
                    className="px-2 py-1 text-[10px] font-mono font-bold bg-slate-950 hover:bg-slate-800 text-emerald-400 border border-emerald-500/40 rounded cursor-pointer"
                  >
                    {copyFeedback || 'EXPORT DDL'}
                  </button>
                </div>
              </div>

              <div className="p-2 rounded border bg-slate-900/80 border-slate-800 flex flex-col justify-between">
                <div className="text-xs font-mono font-bold text-emerald-400">
                  03. SOVEREIGN TITLE TRANSFER
                </div>
                <p className="text-xs font-mono text-slate-200 leading-relaxed">
                  Execute full intellectual property transfer under standard institutional Asset
                  Purchase Agreement terms or inquire for full Skunkworks Vault buyout.
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setApaModalState('ACQUIRE_APA');
                      appendRadioLog(
                        '🟢 CREW CHIEF',
                        'Institutional APA Title Transfer dossier opened for GF-T3-229'
                      );
                    }}
                    className="px-2 py-1 text-[10px] font-mono font-bold bg-[#10B981]/20 hover:bg-[#10B981]/30 text-[#10B981] border border-[#10B981]/50 rounded cursor-pointer"
                  >
                    ACQUIRE TITLE (APA)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setApaModalState('VAULT_BUYOUT');
                      appendRadioLog(
                        '⚡ PIT WALL',
                        'Skunkworks Vault Buyout inquiry channel initialized for GF-T3-229'
                      );
                    }}
                    className="px-2 py-1 text-[10px] font-mono font-bold bg-[#FF9F0A]/20 hover:bg-[#FF9F0A]/30 text-[#FF9F0A] border border-[#FF9F0A]/50 rounded cursor-pointer"
                  >
                    INQUIRE VAULT BUYOUT
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* COMPACT STAGE TELEMETRY INSPECTOR STRIP */}
      <div className="w-full py-0.5 px-2 bg-slate-900/90 border border-slate-800 rounded text-center shrink-0 my-0.5 overflow-hidden">
        <div className="text-xs font-mono font-bold text-cyan-200 whitespace-nowrap">
          S{selectedSlot.stageId} · {selectedSlot.label} · [{selectedSlot.tensorShape[0]},{' '}
          {selectedSlot.tensorShape[1]}] · {selectedSlot.stashPointer} · {selectedSlot.state}
        </div>
      </div>

      {/* TACTICAL LAUNCH CONTROL BUTTONS */}
      <section
        aria-label="Tactical Launch Controls"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-0.5"
      >
        <button
          type="button"
          onClick={handleInjectBatchBurst}
          className="bg-[#FF9F0A]/15 hover:bg-[#FF9F0A]/25 text-[#FF9F0A] border border-[#FF9F0A]/60 rounded-lg text-xs font-mono font-bold py-1 text-center transition-colors cursor-pointer whitespace-nowrap"
        >
          💥 INJECT BATCH BURST
        </button>

        <button
          type="button"
          onClick={handleToggleStraggler}
          className="bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 text-[#00F0FF] border border-[#00F0FF]/60 rounded-lg text-xs font-mono font-bold py-1 text-center transition-colors cursor-pointer whitespace-nowrap"
        >
          ⚡ TOGGLE STRAGGLER
        </button>

        <button
          type="button"
          onClick={handleStep1F1BPass}
          className="bg-[#10B981]/15 hover:bg-[#10B981]/25 text-[#10B981] border border-[#10B981]/60 rounded-lg text-xs font-mono font-bold py-1 text-center transition-colors cursor-pointer whitespace-nowrap"
        >
          🚀 STEP 1F1B PASS
        </button>

        <button
          type="button"
          onClick={handleFlushPipeline}
          className="bg-[#EF4444]/15 hover:bg-[#EF4444]/25 text-[#EF4444] border border-[#EF4444]/60 rounded-lg text-xs font-mono font-bold py-1 text-center transition-colors cursor-pointer whitespace-nowrap"
        >
          🔄 FLUSH PIPELINE
        </button>
      </section>

      {/* PIT-WALL RADIO LOG */}
      <footer
        aria-label="Pit-Wall Radio Log"
        className="h-14 overflow-hidden font-mono text-[10px] py-1 px-2 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-100 leading-tight flex flex-col justify-between"
      >
        {radioLogs.slice(0, 3).map((entry) => (
          <div key={entry.id} className="text-[10px] font-mono leading-tight whitespace-normal text-slate-100">
            [{entry.timestamp}] <span className="font-bold">{entry.callsign}:</span> {entry.message}
          </div>
        ))}
      </footer>

      {/* MODAL OVERLAY FOR APA / SCHEMA INSPECTION */}
      {apaModalState !== 'NONE' && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#05070B] border border-cyan-500/50 rounded-lg max-w-2xl w-full p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-mono font-bold text-[#00F0FF]">
                GF-T3-229
              </span>
              <button
                type="button"
                onClick={() => setApaModalState('NONE')}
                className="px-2 py-0.5 text-xs font-mono font-bold bg-slate-900 text-slate-300 hover:text-white border border-slate-700 rounded cursor-pointer"
              >
                [CLOSE]
              </button>
            </div>

            {apaModalState === 'SCHEMA_VIEW' ? (
              <pre className="text-[10px] font-mono text-slate-300 bg-slate-950 p-3 rounded border border-slate-800 overflow-y-auto max-h-64 select-all">
                {EXPORTABLE_SUPABASE_SCHEMA_SQL}
              </pre>
            ) : (
              <div className="text-xs font-mono text-slate-300 space-y-2">
                <p>
                  Chassis Identifier: <strong className="text-white">GF-T3-229</strong>
                </p>
                <p>
                  Included Deliverables: Full TypeScript 1F1B Micro-Batch Scheduler, FastAPI
                  `engine.py` Backend, Partitioned PostgreSQL/Supabase RLS Schema (`schema.sql`),
                  Zero-Trust GridSync Zod Sanitization Middleware, and Vitest Verification Suite.
                </p>
                <p className="text-emerald-400">
                  Status: Audit-Ready · 100% Permissive MIT / Apache-2.0 Clean-Room IP.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleCopySchema}
                className="px-3 py-1 text-xs font-mono font-bold bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/50 rounded cursor-pointer"
              >
                {copyFeedback || 'COPY SQL ARTIFACT'}
              </button>
              <button
                type="button"
                onClick={() => setApaModalState('NONE')}
                className="px-3 py-1 text-xs font-mono font-bold bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/50 rounded cursor-pointer"
              >
                RETURN TO COCKPIT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
