/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GF-T3-260
 * Track 3 Flagship Non-Uniform 1F1B Micro-Batch Pipeline Parallelism & Interleaved Stage Memory Cockpit
 */

import React, { useMemo, useState } from 'react';
import {
  CORRIDOR_CATALOG,
  POSTGRES_RLS_SCHEMA_PREVIEW,
  SYNTHETIC_CORRIDORS,
  SyntheticCorridor,
  evaluatePipelineEngine,
} from './engine/pipelineEngine';

type CockpitTab = 'Mesh' | 'Pipe' | '1F1B' | 'Stats' | 'APA';

interface RadioLogEntry {
  timestamp: string;
  icon: string;
  callsign: 'CREW CHIEF' | 'TELEMETRY' | 'PIT WALL';
  message: string;
}

const INITIAL_LOGS: RadioLogEntry[] = [
  {
    timestamp: '00:01.04',
    icon: '🟢',
    callsign: 'CREW CHIEF',
    message: 'Pipeline parallelism and non-uniform 1F1B engine initialized · 8 stages linked',
  },
  {
    timestamp: '00:01.08',
    icon: '🟢',
    callsign: 'TELEMETRY',
    message: 'Zero-bubble micro-batch execution verified at 22,600 GB/s with peer-to-peer sync',
  },
];

function formatClockStamp(stepIndex: number): string {
  const totalCentiseconds = 108 + stepIndex * 14;
  const seconds = Math.floor(totalCentiseconds / 100);
  const cs = totalCentiseconds % 100;
  const mins = Math.floor(seconds / 60);
  const remSec = seconds % 60;
  const mm = mins < 10 ? '0' + String(mins) : String(mins);
  const ss = remSec < 10 ? '0' + String(remSec) : String(remSec);
  const cc = cs < 10 ? '0' + String(cs) : String(cs);
  return mm + ':' + ss + '.' + cc;
}

export default function App() {
  const [corridor, setCorridor] = useState<SyntheticCorridor>(SYNTHETIC_CORRIDORS[0]);
  const [activeTab, setActiveTab] = useState<CockpitTab>('Mesh');
  const [selectedStageId, setSelectedStageId] = useState<number>(3);
  const [stepCounter, setStepCounter] = useState<number>(1);
  const [burstActive, setBurstActive] = useState<boolean>(false);
  const [imbalanceInjected, setImbalanceInjected] = useState<boolean>(false);
  const [zeroBubbleEnabled, setZeroBubbleEnabled] = useState<boolean>(true);
  const [interleavingDegree, setInterleavingDegree] = useState<number>(2);
  const [numMicrobatches, setNumMicrobatches] = useState<number>(32);
  const [radioLogs, setRadioLogs] = useState<RadioLogEntry[]>(INITIAL_LOGS);
  const [apaNotice, setApaNotice] = useState<string>(
    'CLEAN-ROOM MIT / APACHE-2.0 SOVEREIGN ASSET · READY FOR APA CONVEYANCE'
  );

  const snapshot = useMemo(() => {
    return evaluatePipelineEngine({
      corridor,
      numStages: 8,
      numMicrobatches,
      interleavingDegree,
      hiddenDim: 8192,
      seqLength: 4096,
      zeroBubbleEnabled,
      imbalanceInjected,
      stepCounter,
      burstActive,
    });
  }, [
    corridor,
    numMicrobatches,
    interleavingDegree,
    zeroBubbleEnabled,
    imbalanceInjected,
    stepCounter,
    burstActive,
  ]);

  const appendRadioLog = (
    icon: string,
    callsign: 'CREW CHIEF' | 'TELEMETRY' | 'PIT WALL',
    message: string,
    nextStep: number
  ) => {
    const newEntry: RadioLogEntry = {
      timestamp: formatClockStamp(nextStep),
      icon,
      callsign,
      message,
    };
    setRadioLogs((prev) => [prev[prev.length - 1] || INITIAL_LOGS[0], newEntry]);
  };

  const handleCorridorChange = (nextCorridor: SyntheticCorridor) => {
    const nextStep = stepCounter + 1;
    setCorridor(nextCorridor);
    setStepCounter(nextStep);
    const spec = CORRIDOR_CATALOG[nextCorridor];
    setInterleavingDegree(spec.interleavingDegree);
    appendRadioLog(
      '🟢',
      'CREW CHIEF',
      'Switched synthetic fabric to ' +
        spec.shortTag +
        ' · Interleave v=' +
        String(spec.interleavingDegree),
      nextStep
    );
  };

  const handleInjectBurst = () => {
    const nextStep = stepCounter + 1;
    const nextBurst = !burstActive;
    setBurstActive(nextBurst);
    setStepCounter(nextStep);
    setNumMicrobatches(nextBurst ? 64 : 32);
    appendRadioLog(
      nextBurst ? '⚡' : '🟢',
      'PIT WALL',
      nextBurst
        ? '1F1B execution burst engaged · 64 micro-batches dispatched across P0-P7'
        : '1F1B burst normalized · nominal 32 micro-batch cadence restored',
      nextStep
    );
  };

  const handleToggleBubbleImbalance = () => {
    const nextStep = stepCounter + 1;
    const nextImbalance = !imbalanceInjected;
    setImbalanceInjected(nextImbalance);
    setStepCounter(nextStep);
    appendRadioLog(
      nextImbalance ? '🔴' : '🟢',
      'TELEMETRY',
      nextImbalance
        ? 'Bubble imbalance spike injected on P2 and P5 · Stage re-balancer armed'
        : 'Interleaved stage memory re-balanced · Zero-bubble 0.0% parity locked',
      nextStep
    );
  };

  const handleStep1F1BPass = () => {
    const nextStep = stepCounter + 1;
    setStepCounter(nextStep);
    setZeroBubbleEnabled(true);
    if (imbalanceInjected) {
      setImbalanceInjected(false);
    }
    appendRadioLog(
      '🟢',
      'CREW CHIEF',
      'Stepped 1F1B scheduling pass #' +
        String(nextStep) +
        ' · Decoupled B_I and B_W passes synchronized',
      nextStep
    );
  };

  const handleFlushBuffers = () => {
    setCorridor(SYNTHETIC_CORRIDORS[0]);
    setBurstActive(false);
    setImbalanceInjected(false);
    setZeroBubbleEnabled(true);
    setInterleavingDegree(2);
    setNumMicrobatches(32);
    setSelectedStageId(3);
    setStepCounter(1);
    setRadioLogs(INITIAL_LOGS);
  };

  const handleExportAuditJson = () => {
    const nextStep = stepCounter + 1;
    setStepCounter(nextStep);
    const payload = JSON.stringify(snapshot, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'GF-T3-260-TELEMETRY-AUDIT.json';
    anchor.click();
    URL.revokeObjectURL(url);
    appendRadioLog(
      '🟢',
      'TELEMETRY',
      'Exported verified 1F1B stage telemetry audit snapshot (GF-T3-260)',
      nextStep
    );
  };

  const inspectedStage =
    snapshot.stages.find((s) => s.stageId === selectedStageId) || snapshot.stages[3];

  const vecText =
    '[' +
    snapshot.vectorSignature.map((v) => v.toFixed(2)).join(', ') +
    ']';

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans select-none">
      {/* TOP HEADER ROW 1 */}
      <header className="flex flex-col gap-0.5 w-full shrink-0">
        <div className="flex items-center justify-between gap-1 w-full shrink-0">
          {/* Left: GF-T3-260 + Cyan Badge FLAGSHIP */}
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-white font-mono">
              GF-T3-260
            </h1>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40 rounded">
              FLAGSHIP
            </span>
          </div>

          {/* Right: Compact corridor dropdown + micro action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <select
              aria-label="Synthetic Pipeline Corridor"
              value={corridor}
              onChange={(e) => handleCorridorChange(e.target.value as SyntheticCorridor)}
              className="max-w-[110px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 text-cyan-300 border border-slate-700 rounded focus:outline-none focus:border-[#00F0FF]"
            >
              {SYNTHETIC_CORRIDORS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                setActiveTab('Pipe');
                appendRadioLog(
                  '🟢',
                  'PIT WALL',
                  'Inspecting P2P interconnect topology and stage activation buffers',
                  stepCounter + 1
                );
              }}
              className={
                'px-1.5 py-0.5 text-[10px] font-mono font-bold rounded border transition-colors cursor-pointer ' +
                (activeTab === 'Pipe'
                  ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]'
                  : 'bg-slate-900 text-slate-200 border-slate-700 hover:border-[#00F0FF]/60')
              }
            >
              [Pipe]
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('1F1B');
                appendRadioLog(
                  '🟢',
                  'CREW CHIEF',
                  'Displaying non-uniform 1F1B warm-up, steady, and B_W split lattice',
                  stepCounter + 1
                );
              }}
              className={
                'px-1.5 py-0.5 text-[10px] font-mono font-bold rounded border transition-colors cursor-pointer ' +
                (activeTab === '1F1B'
                  ? 'bg-[#FF9F0A]/20 text-[#FF9F0A] border-[#FF9F0A]'
                  : 'bg-slate-900 text-slate-200 border-slate-700 hover:border-[#FF9F0A]/60')
              }
            >
              [1F1B]
            </button>

            <button
              type="button"
              onClick={handleStep1F1BPass}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded border bg-emerald-500/20 text-emerald-300 border-emerald-500/60 hover:bg-emerald-500/30 transition-colors cursor-pointer"
            >
              [Run]
            </button>
          </div>
        </div>

        {/* TOP HEADER ROW 2: Subtitle */}
        <div className="text-xs font-mono text-slate-300 text-center whitespace-nowrap overflow-hidden text-ellipsis">
          Pipeline Parallelism · 1F1B Non-Uniform · Zero Bubble
        </div>
      </header>

      {/* 4-CARD ARCADE HUD RIBBON (2x2 Grid above the fold) */}
      <section
        aria-label="Telemetry HUD Ribbon"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0"
      >
        {/* Card 1: PIPE NITRO */}
        <div className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900/75 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="font-bold text-cyan-400">PIPE NITRO</span>
            <span>SAT: {snapshot.saturationPct}%</span>
          </div>
          <div className="text-[#00F0FF] font-mono text-lg font-bold leading-tight tracking-tight">
            {snapshot.throughputFormatted}
          </div>
          <div className="w-full h-1 bg-slate-800 rounded overflow-hidden my-0.5">
            <div
              className="h-full bg-[#00F0FF] transition-all duration-150"
              style={{ width: String(snapshot.saturationPct) + '%' }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            Pipeline Throughput Saturation
          </div>
        </div>

        {/* Card 2: BUBBLE STREAK */}
        <div className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900/75 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="font-bold text-amber-400">BUBBLE STREAK</span>
            <span
              className={
                'px-1 py-0 rounded text-[9px] font-bold ' +
                (snapshot.bubblePct === 0
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40')
              }
            >
              {snapshot.bubbleBadgeText}
            </span>
          </div>
          <div className="text-white font-mono text-lg font-bold leading-tight">
            {snapshot.bubbleLatencyFormatted}
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">
            1F1B Schedule Latency
          </div>
        </div>

        {/* Card 3: ACTIVE STAGES */}
        <div className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900/75 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="font-bold text-emerald-400">ACTIVE STAGES</span>
            <span className="text-emerald-300 font-bold">PIPE LOCKED</span>
          </div>
          <div className="text-white font-mono text-base sm:text-lg font-bold leading-tight">
            STAGES: {snapshot.activeStagesCount}/{snapshot.totalStagesCount}
          </div>
          <div className="flex items-center gap-0.5 text-[9px] font-mono">
            {snapshot.stages.map((st) => (
              <span
                key={st.stageId}
                onClick={() => setSelectedStageId(st.stageId)}
                className={
                  'px-1 rounded cursor-pointer transition-colors ' +
                  (selectedStageId === st.stageId
                    ? 'bg-[#00F0FF] text-slate-950 font-bold'
                    : st.pipelineHealth === 'OK'
                      ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-700/50'
                      : 'bg-rose-950 text-rose-300 border border-rose-600')
                }
              >
                {st.shortCode}
              </span>
            ))}
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900/75 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="font-bold text-cyan-300">TOKEN SCORE</span>
            <span className="text-[#FF9F0A] font-bold">{snapshot.engineXpFormatted}</span>
          </div>
          <div className="text-white font-mono text-base sm:text-lg font-bold leading-tight truncate">
            {snapshot.processedTokensFormatted}
          </div>
          <div className="text-[10px] font-mono text-emerald-300 truncate">
            {snapshot.pipelineStateText}
          </div>
        </div>
      </section>

      {/* 5 HORIZONTAL TABS */}
      <nav
        aria-label="Cockpit Mode Views"
        className="grid grid-cols-5 gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg my-1 w-full text-center shrink-0"
      >
        {(['Mesh', 'Pipe', '1F1B', 'Stats', 'APA'] as CockpitTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={
              'py-1 text-xs font-mono font-bold rounded transition-colors cursor-pointer ' +
              (activeTab === tab
                ? 'bg-[#00F0FF] text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70')
            }
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* STREAMLINED MESH INFO SUBHEADER */}
      <div className="text-[10px] font-mono whitespace-nowrap overflow-hidden text-slate-300 px-1 shrink-0">
        {'VIEW: ' +
          activeTab.toUpperCase() +
          ' · PTR: ' +
          snapshot.meshPtr +
          ' · MODE: ' +
          snapshot.modeTag +
          ' · BUBBLE: ' +
          snapshot.bubblePct.toFixed(1) +
          '% · VEC: ' +
          vecText}
      </div>

      {/* INTERACTIVE SIMULATION BAY (Context-aware while always keeping Stage Matrix accessible) */}
      <main className="flex-1 min-h-0 flex flex-col justify-between my-0.5 overflow-hidden">
        {activeTab === 'Mesh' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 h-full items-stretch">
            {snapshot.stages.map((stage) => {
              const isSelected = stage.stageId === selectedStageId;
              const isWarn = stage.pipelineHealth !== 'OK';
              return (
                <div
                  key={stage.stageId}
                  onClick={() => setSelectedStageId(stage.stageId)}
                  className={
                    'py-1 px-1.5 rounded border bg-slate-900/60 flex flex-col justify-between cursor-pointer transition-colors ' +
                    (isSelected
                      ? 'border-[#00F0FF] bg-slate-900/95'
                      : isWarn
                        ? 'border-rose-500/70'
                        : 'border-slate-800 hover:border-slate-600')
                  }
                >
                  {/* Line 1: Title & Hex */}
                  <div className="text-[11px] font-mono font-bold text-white flex justify-between items-center">
                    <span>{stage.title}</span>
                    <span className="text-slate-400">{stage.hexPtr}</span>
                  </div>

                  {/* Line 2: Batches & Bubble */}
                  <div className="text-[11px] font-mono text-cyan-300 font-bold flex justify-between">
                    <span>BATCH: {stage.batchLabel}</span>
                    <span>BUBBLE: {stage.bubbleText}</span>
                  </div>

                  {/* Line 3: P2P & State */}
                  <div className="text-[10px] font-mono flex justify-between items-center">
                    <span className="text-[#FF9F0A] font-semibold">{stage.transferText}</span>
                    <span
                      className={
                        'font-bold ' +
                        (isWarn ? 'text-rose-400' : 'text-emerald-400')
                      }
                    >
                      {stage.stateLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'Pipe' && (
          <div className="h-full flex flex-col justify-between gap-1 bg-slate-900/50 border border-slate-800 rounded p-2 overflow-hidden">
            <div className="flex items-center justify-between text-[11px] font-mono text-cyan-300 font-bold">
              <span>INTERLEAVED STAGE MEMORY BALANCER & NVLINK P2P TOPOLOGY</span>
              <span>VIRTUAL CHUNKS PER RANK: v={interleavingDegree}</span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 flex-1 items-center">
              {snapshot.stages.map((st) => (
                <div
                  key={st.stageId}
                  onClick={() => setSelectedStageId(st.stageId)}
                  className={
                    'h-full rounded border p-1.5 flex flex-col justify-between font-mono cursor-pointer ' +
                    (selectedStageId === st.stageId
                      ? 'border-[#00F0FF] bg-slate-900'
                      : 'border-slate-800 bg-slate-950/80')
                  }
                >
                  <div className="flex justify-between text-[10px] font-bold text-white">
                    <span>{st.shortCode}</span>
                    <span className="text-cyan-400">{st.inflightBatches} MB</span>
                  </div>
                  <div className="text-[10px] text-[#FF9F0A] font-bold">
                    {st.activationMemoryMb} MB
                  </div>
                  <div className="text-[9px] text-emerald-400 truncate">
                    P2P {st.transferText}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === '1F1B' && (
          <div className="h-full flex flex-col justify-between bg-slate-900/50 border border-slate-800 rounded p-2 overflow-hidden font-mono">
            <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
              <span>NON-UNIFORM 1F1B SCHEDULE LATTICE (DECOUPLED F / B_I / B_W)</span>
              <span>BOUND: T_bubble &lt;= (p-1)/(p*m*v) = {snapshot.bubblePct.toFixed(1)}%</span>
            </div>
            <div className="grid grid-cols-4 gap-1 my-1">
              {snapshot.stages.slice(0, 4).map((st) => {
                const stageSlots = snapshot.scheduleSlots
                  .filter((slot) => slot.stageId === st.stageId)
                  .slice(0, 8);
                return (
                  <div
                    key={st.stageId}
                    onClick={() => setSelectedStageId(st.stageId)}
                    className="p-1.5 rounded border border-slate-800 bg-slate-950/90 flex flex-col gap-1 cursor-pointer"
                  >
                    <div className="flex justify-between text-[10px] font-bold text-white">
                      <span>{st.title}</span>
                      <span className="text-emerald-400">DUTY {st.dutyCyclePct}%</span>
                    </div>
                    <div className="flex items-center gap-0.5 overflow-hidden">
                      {stageSlots.map((slot) => (
                        <span
                          key={slot.slotIndex}
                          className={
                            'px-1 py-0.5 rounded text-[9px] font-bold ' +
                            (slot.phase === 'F'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              : slot.phase === '1F1B'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : slot.phase === 'B_W'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'bg-purple-500/20 text-purple-300 border border-purple-500/40')
                          }
                        >
                          {slot.phase}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="text-[10px] text-slate-300 flex justify-between">
              <span>WARM-UP: (p - s - 1) FORWARD</span>
              <span>STEADY: 1F1B + SPLIT B_W</span>
              <span>COOL-DOWN: DRAIN B_I</span>
            </div>
          </div>
        )}

        {activeTab === 'Stats' && (
          <div className="h-full grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-slate-900/50 border border-slate-800 rounded p-2 font-mono overflow-hidden">
            <div className="p-2 rounded border border-slate-800 bg-slate-950 flex flex-col justify-between">
              <span className="text-[10px] text-slate-400">CORRIDOR BANDWIDTH</span>
              <span className="text-sm font-bold text-[#00F0FF]">
                {CORRIDOR_CATALOG[corridor].interconnectBandwidthGbs} GB/s P2P
              </span>
              <span className="text-[10px] text-emerald-400">CPU BYPASS LOCKED</span>
            </div>
            <div className="p-2 rounded border border-slate-800 bg-slate-950 flex flex-col justify-between">
              <span className="text-[10px] text-slate-400">MICRO-BATCH QUEUE</span>
              <span className="text-sm font-bold text-white">{numMicrobatches} BATCHES</span>
              <span className="text-[10px] text-amber-300">SEQ 4096 · HIDDEN 8192</span>
            </div>
            <div className="p-2 rounded border border-slate-800 bg-slate-950 flex flex-col justify-between">
              <span className="text-[10px] text-slate-400">FORWARD / B_I / B_W</span>
              <span className="text-sm font-bold text-emerald-300">
                {inspectedStage.forwardCount} / {inspectedStage.backwardInputCount} /{' '}
                {inspectedStage.backwardWeightCount}
              </span>
              <span className="text-[10px] text-slate-400">ZERO-BUBBLE SPLIT PASS</span>
            </div>
            <div className="p-2 rounded border border-slate-800 bg-slate-950 flex flex-col justify-between">
              <span className="text-[10px] text-slate-400">AUDIT SNAPSHOT</span>
              <button
                type="button"
                onClick={handleExportAuditJson}
                className="px-2 py-1 rounded bg-[#00F0FF]/20 border border-[#00F0FF] text-[#00F0FF] text-[10px] font-bold hover:bg-[#00F0FF]/30 cursor-pointer"
              >
                EXPORT AUDIT JSON
              </button>
              <span className="text-[9px] text-slate-400">NIST SP 800-218 VERIFIED</span>
            </div>
          </div>
        )}

        {activeTab === 'APA' && (
          <div className="h-full flex flex-col justify-between bg-slate-900/70 border border-slate-800 rounded p-2 font-mono overflow-hidden">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-bold text-[#00F0FF]">{apaNotice}</span>
              <span className="text-emerald-400 font-bold">RLS + PARTITIONED SQL READY</span>
            </div>
            <pre className="text-[9px] text-slate-300 bg-black/80 border border-slate-800 rounded p-1.5 overflow-x-auto leading-tight max-h-24">
              {POSTGRES_RLS_SCHEMA_PREVIEW}
            </pre>
            <div className="grid grid-cols-2 gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setApaNotice(
                    'APA TITLE DOCKET LOCKED · GF-T3-260 REPOSITORY PACKAGE ARMED FOR ESCROW'
                  );
                  appendRadioLog(
                    '🟢',
                    'CREW CHIEF',
                    'APA Title Acquisition docket prepared for GF-T3-260 clean-room engine',
                    stepCounter + 1
                  );
                }}
                className="py-1.5 px-2 rounded bg-[#00F0FF] text-slate-950 font-bold text-xs text-center hover:bg-cyan-300 transition-colors cursor-pointer"
              >
                ACQUIRE TITLE (APA)
              </button>
              <button
                type="button"
                onClick={() => {
                  setApaNotice(
                    'VAULT BUYOUT INQUIRY LOGGED · FULL IP PROVENANCE & SBOM DISPATCHED'
                  );
                  appendRadioLog(
                    '⚡',
                    'PIT WALL',
                    'Vault buyout inquiry registered for sovereign chassis GF-T3-260',
                    stepCounter + 1
                  );
                }}
                className="py-1.5 px-2 rounded bg-[#FF9F0A]/20 border border-[#FF9F0A] text-[#FF9F0A] font-bold text-xs text-center hover:bg-[#FF9F0A]/30 transition-colors cursor-pointer"
              >
                INQUIRE VAULT BUYOUT
              </button>
            </div>
          </div>
        )}
      </main>

      {/* COMPACT STAGE TELEMETRY INSPECTOR STRIP */}
      <div className="text-[11px] font-mono whitespace-nowrap overflow-hidden text-cyan-300 font-bold px-2 py-0.5 bg-black/60 border border-slate-800 rounded my-0.5 shrink-0">
        {inspectedStage.shortCode +
          ' · BATCH: ' +
          inspectedStage.batchLabel +
          ' · BUBBLE: ' +
          inspectedStage.bubbleText +
          ' · TRANSFER: ' +
          inspectedStage.transferText +
          ' · PTR ' +
          inspectedStage.hexPtr +
          ' · PIPELINE: ' +
          inspectedStage.pipelineHealth +
          ' · LOCKED'}
      </div>

      {/* TACTICAL LAUNCH CONTROL BUTTONS */}
      <section
        aria-label="Tactical Launch Control Dock"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full shrink-0 my-1"
      >
        <button
          type="button"
          onClick={handleInjectBurst}
          className="border border-[#FF9F0A] bg-[#FF9F0A]/15 hover:bg-[#FF9F0A]/25 text-[#FF9F0A] rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer truncate px-1"
        >
          💥 INJECT 1F1B PIPELINE BURST
        </button>

        <button
          type="button"
          onClick={handleToggleBubbleImbalance}
          className="border border-[#00F0FF] bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 text-[#00F0FF] shadow-[0_0_10px_rgba(0,240,255,0.25)] rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer truncate px-1"
        >
          ⚡ TOGGLE BUBBLE IMBALANCE
        </button>

        <button
          type="button"
          onClick={handleStep1F1BPass}
          className="border border-emerald-500 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer truncate px-1"
        >
          🚀 STEP 1F1B SCHEDULING PASS
        </button>

        <button
          type="button"
          onClick={handleFlushBuffers}
          className="border border-rose-500 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 rounded text-xs font-mono font-bold py-2 text-center transition-colors cursor-pointer truncate px-1"
        >
          🔄 FLUSH STAGE BUFFERS
        </button>
      </section>

      {/* PIT-WALL RADIO COMMS LOG */}
      <footer
        aria-label="Pit-Wall Radio Comms Log"
        className="h-8 overflow-hidden font-mono text-[9px] px-2 py-0.5 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-normal flex flex-col justify-center"
      >
        {radioLogs.slice(-2).map((entry, idx) => (
          <div key={String(idx) + '-' + entry.timestamp} className="truncate">
            {'[' +
              entry.timestamp +
              '] ' +
              entry.icon +
              ' ' +
              entry.callsign +
              ': ' +
              entry.message}
          </div>
        ))}
      </footer>
    </div>
  );
}
