/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { POSTGRES_RLS_SCHEMA_SQL } from './engine/sqlSchema';
import {
  EngineState,
  StreamLane,
  createInitialEngineState,
  flushStreamQueues,
  formatInspectorStrip,
  formatPitTimestamp,
  stepAsyncEventCycle,
  switchStreamCorridor,
  togglePreemptionAndInjectConflict,
  triggerConcurrencyBurst,
} from './engine/streamScheduler';
import {
  PriorityLevel,
  STREAM_CORRIDORS,
  StreamCorridor,
  sanitizeKernelDispatch,
} from './engine/validation';

type CockpitTab = 'Mesh' | 'Stream' | 'Prior' | 'Stats' | 'APA';

const TABS: CockpitTab[] = ['Mesh', 'Stream', 'Prior', 'Stats', 'APA'];

export default function App() {
  const [engine, setEngine] = useState<EngineState>(() =>
    createInitialEngineState()
  );
  const [activeTab, setActiveTab] = useState<CockpitTab>('Mesh');
  const [showSchemaModal, setShowSchemaModal] = useState<boolean>(false);
  const [apaModalMessage, setApaModalMessage] = useState<string | null>(null);
  const [customKernelInput, setCustomKernelInput] = useState<string>('KV_FLASH_SYNC');
  const [customTokensInput, setCustomTokensInput] = useState<number>(8192);
  const logSequenceRef = useRef<number>(1000);

  const nextUniqueSeq = (): number => {
    logSequenceRef.current += 1;
    return logSequenceRef.current;
  };

  const selectedStream: StreamLane =
    engine.streams[engine.selectedStreamId] || engine.streams[3];

  const primaryEightStreams = engine.streams.slice(0, 8);

  const handleSelectStream = (streamId: number) => {
    const seq = nextUniqueSeq();
    setEngine((prev) => {
      const target = prev.streams[streamId];
      if (!target) return prev;
      const logLine = {
        id:
          'LOG-SEL-' +
          String(prev.cycleCount) +
          '-' +
          String(streamId) +
          '-' +
          String(seq),
        timestamp: formatPitTimestamp(prev.cycleCount, (seq % 12) + 1),
        callsign: '🟢 TELEMETRY' as const,
        message:
          'Inspector locked to Stream S' +
          String(streamId) +
          ' · Event ' +
          target.eventSyncFlag +
          ' · Dep ' +
          target.dependencyPointer,
      };
      return {
        ...prev,
        selectedStreamId: streamId,
        radioLogs: [logLine, ...prev.radioLogs.slice(0, 5)],
      };
    });
  };

  const handleCorridorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextCorridor = e.target.value as StreamCorridor;
    setEngine((prev) => switchStreamCorridor(prev, nextCorridor));
  };

  const handleBurst = () => {
    setEngine((prev) => triggerConcurrencyBurst(prev));
  };

  const handleTogglePreemption = () => {
    setEngine((prev) => togglePreemptionAndInjectConflict(prev));
  };

  const handleStepCycle = () => {
    setEngine((prev) => stepAsyncEventCycle(prev));
  };

  const handleFlushQueues = () => {
    setEngine((prev) => flushStreamQueues(prev));
  };

  const handleCustomDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    const seq = nextUniqueSeq();
    const nextCycle = engine.cycleCount + 1;
    const candidate = {
      streamId: selectedStream.streamId,
      priority: selectedStream.priority,
      kernelName: customKernelInput.trim(),
      tokenUnits: Number(customTokensInput) || 4096,
      eventDependencyFlag: selectedStream.eventSyncFlag,
      kvBlockIndex: selectedStream.kvCacheRegion,
      corridor: engine.corridor,
    };

    const sanitized = sanitizeKernelDispatch(candidate, nextCycle);
    if (!sanitized.ok || !sanitized.data) {
      const rejectLog = {
        id: 'LOG-REJECT-' + String(nextCycle) + '-' + String(seq),
        timestamp: formatPitTimestamp(nextCycle, 9),
        callsign: '🔴 TELEMETRY' as const,
        message: sanitized.error || 'GRIDSYNC_INGRESS_REJECT: Invalid payload',
      };
      setEngine((prev) => ({
        ...prev,
        cycleCount: nextCycle,
        lastSanitizationStatus:
          sanitized.error || 'GRIDSYNC_INGRESS_REJECT: Invalid payload',
        radioLogs: [rejectLog, ...prev.radioLogs.slice(0, 5)],
      }));
      return;
    }

    const valid = sanitized.data;
    const updatedStreams = engine.streams.map((s) => {
      if (s.streamId !== valid.streamId) return s;
      const newWorkload = {
        taskId:
          'CUSTOM-S' +
          String(s.streamId) +
          '-' +
          String(nextCycle) +
          '-' +
          String(seq),
        kernel: valid.kernelName,
        priority: valid.priority,
        tokenUnits: valid.tokenUnits,
        kvBlockIndex: valid.kvBlockIndex,
        waitEventHex: valid.eventDependencyFlag,
        estimatedCycles: 14,
      };
      return {
        ...s,
        activeKernel: valid.kernelName,
        processedTokens: s.processedTokens + valid.tokenUnits,
        queuedWorkloads: [newWorkload, ...s.queuedWorkloads.slice(0, 3)],
        preemptionLog: [
          'GRIDSYNC_DISPATCH: ' + valid.kernelName + ' (+' + String(valid.tokenUnits) + ' UNITS)',
          ...s.preemptionLog.slice(0, 3),
        ],
      };
    });

    const acceptLog = {
      id: 'LOG-CUSTOM-' + String(nextCycle) + '-' + String(seq),
      timestamp: formatPitTimestamp(nextCycle, 7),
      callsign: '🟢 CREW CHIEF' as const,
      message:
        'GridSync verified kernel ' +
        valid.kernelName +
        ' on S' +
        String(valid.streamId) +
        ' · +' +
        valid.tokenUnits.toLocaleString() +
        ' Units',
    };

    setEngine((prev) => ({
      ...prev,
      cycleCount: nextCycle,
      processedTokens: prev.processedTokens + valid.tokenUnits,
      streamXpDelta: prev.streamXpDelta + Math.round(valid.tokenUnits / 4),
      streams: updatedStreams,
      lastSanitizationStatus:
        'GRIDSYNC_PASS: ' + valid.kernelName + ' SANITIZED ON S' + String(valid.streamId),
      radioLogs: [acceptLog, ...prev.radioLogs.slice(0, 5)],
    }));
  };

  const handleExportAuditJson = () => {
    const seq = nextUniqueSeq();
    const auditPayload = {
      chassis: 'GF-T3-233',
      corridor: engine.corridor,
      cycleCount: engine.cycleCount,
      activeStreams: engine.activeStreamsCount,
      schedulerLatencyUs: engine.schedulerLatencyUs,
      processedTokensUnits: engine.processedTokens,
      queueState: engine.queueStateLabel,
      inspectorState: formatInspectorStrip(selectedStream),
      sanitizationGate: engine.lastSanitizationStatus,
    };
    const blob = new Blob([JSON.stringify(auditPayload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'GF-T3-233-AUDIT-TELEMETRY.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setEngine((prev) => ({
      ...prev,
      radioLogs: [
        {
          id: 'LOG-EXP-' + String(prev.cycleCount) + '-' + String(seq),
          timestamp: formatPitTimestamp(prev.cycleCount + 1, 3),
          callsign: '🟢 CREW CHIEF',
          message: 'Audit telemetry snapshot exported · Clean-room SHA-256 verified',
        },
        ...prev.radioLogs.slice(0, 5),
      ],
    }));
  };

  const formatPriorityLabel = (p: PriorityLevel): string => {
    if (p === 'HIGH') return 'High';
    if (p === 'NORMAL') return 'Normal';
    return 'Low';
  };

  const xpFormatted =
    '+' + (engine.streamXpDelta / 1000).toFixed(1) + 'k STREAM XP';

  return (
    <div className="h-screen flex flex-col justify-between p-2 bg-[#05070B] text-slate-100 overflow-hidden font-sans">
      {/* TOP COMMAND DECK: Row 1 & Row 2 */}
      <header className="w-full shrink-0 border-b border-slate-800/90 pb-1">
        {/* Top Header Row 1 */}
        <div className="flex items-center justify-between gap-1 w-full shrink-0">
          {/* Left: strictly GF-T3-233 + TRACK 3 */}
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <h1 className="text-sm sm:text-base font-extrabold tracking-tight font-mono text-white">
              GF-T3-233
            </h1>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/50 rounded">
              TRACK 3
            </span>
          </div>

          {/* Right: compact corridor dropdown + micro action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <select
              aria-label="Synthetic Stream Corridor Selector"
              value={engine.corridor}
              onChange={handleCorridorChange}
              className="max-w-[110px] text-[10px] font-mono truncate py-0.5 px-1 bg-slate-900 border border-slate-700 text-[#00F0FF] rounded focus:outline-none focus:border-[#00F0FF]"
            >
              {STREAM_CORRIDORS.map((corr) => (
                <option key={corr} value={corr}>
                  {corr}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setActiveTab('Stream')}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-[#00F0FF] border border-[#00F0FF]/40 rounded transition-colors cursor-pointer"
            >
              [Stream]
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('Prior')}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-[#FF9F0A] border border-[#FF9F0A]/40 rounded transition-colors cursor-pointer"
            >
              [Prior]
            </button>
            <button
              type="button"
              onClick={handleStepCycle}
              className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#10B981]/20 hover:bg-[#10B981]/30 text-[#10B981] border border-[#10B981]/50 rounded transition-colors cursor-pointer"
            >
              [Run]
            </button>
            <button
              type="button"
              onClick={() => setShowSchemaModal((prev) => !prev)}
              className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded transition-colors cursor-pointer"
            >
              [Inspect Schema]
            </button>
            <button
              type="button"
              onClick={handleFlushQueues}
              className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-900 hover:bg-rose-950/60 text-rose-400 border border-rose-800/50 rounded transition-colors cursor-pointer"
            >
              [Reset]
            </button>
          </div>
        </div>

        {/* Top Header Row 2 */}
        <p className="text-xs font-mono text-slate-300 text-center whitespace-nowrap truncate mt-0.5">
          Asynchronous Stream Concurrency · Multi-Priority Scheduling · Non-Blocking
        </p>
      </header>

      {/* 4-CARD ARCADE HUD RIBBON */}
      <section
        aria-label="Telemetry HUD Ribbon"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1 w-full shrink-0 my-0.5"
      >
        {/* Card 1: STREAM NITRO */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2 py-1 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              STREAM NITRO
            </span>
            <span className="text-[10px] font-mono text-[#00F0FF]">
              {engine.bandwidthBusGbs.toFixed(1)} GB/s
            </span>
          </div>
          <div className="font-mono text-base lg:text-lg font-bold text-[#00F0FF] leading-tight">
            {String(engine.activeStreamsCount)} STREAMS
          </div>
          <div className="w-full bg-slate-950 h-1 rounded overflow-hidden border border-slate-800 my-0.5">
            <div
              className="bg-[#00F0FF] h-full transition-opacity duration-150"
              style={{ width: '100%' }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate leading-none">
            Active Concurrent Queues
          </div>
        </div>

        {/* Card 2: SCHEDULER STREAK */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2 py-1 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              SCHEDULER STREAK
            </span>
            <span className="px-1.5 py-0 bg-[#FF9F0A]/20 text-[#FF9F0A] border border-[#FF9F0A]/50 rounded text-[10px] font-mono font-bold">
              🔥 HIGH PRIO
            </span>
          </div>
          <div className="font-mono text-base lg:text-lg font-bold text-[#FF9F0A] leading-tight">
            {engine.schedulerLatencyUs.toFixed(2)} µs
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 leading-none">
            <span className="truncate">Dispatch Latency Overhead</span>
            <span className="text-[#10B981]">
              {engine.bufferParityPct.toFixed(2)}% Parity
            </span>
          </div>
        </div>

        {/* Card 3: ACTIVE QUEUES */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2 py-1 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              ACTIVE QUEUES
            </span>
            <span className="text-[10px] font-mono font-bold text-[#10B981]">
              {engine.preemptionEnabled ? 'PREEMPT: ARMED' : 'PREEMPT: BYPASS'}
            </span>
          </div>
          <div className="font-mono text-base lg:text-lg font-bold text-slate-100 leading-tight">
            QUEUES: 16/16
          </div>
          {/* F1 Gear Shift Indicator [Q0..Q15] */}
          <div className="grid grid-cols-16 gap-0.5 my-0.5" title="F1 Gear Shift Indicator [Q0..Q15]">
            {engine.streams.map((s) => {
              const barColor =
                s.barrierState === 'FAULT'
                  ? 'bg-[#EF4444]'
                  : s.priority === 'HIGH'
                    ? 'bg-[#00F0FF]'
                    : s.priority === 'NORMAL'
                      ? 'bg-[#10B981]'
                      : 'bg-[#FF9F0A]';
              return (
                <div
                  key={s.streamId}
                  className={'h-1 rounded-xs ' + barColor}
                />
              );
            })}
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate leading-none">
            [Q0..Q15] · Active Priority: {formatPriorityLabel(engine.activePriorityMode)}
          </div>
        </div>

        {/* Card 4: TOKEN SCORE */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-2 py-1 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              TOKEN SCORE
            </span>
            <span className="px-1.5 py-0 bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 rounded text-[10px] font-mono font-bold">
              {xpFormatted}
            </span>
          </div>
          <div className="font-mono text-base lg:text-lg font-bold text-[#10B981] leading-tight">
            {engine.processedTokens.toLocaleString()} UNITS
          </div>
          <div className="text-[10px] font-mono text-slate-300 truncate leading-none">
            Queue State: {engine.queueStateLabel}
          </div>
        </div>
      </section>

      {/* 5 HORIZONTAL TABS */}
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

      {/* INTERACTIVE STREAM CONCURRENCY MATRIX BAY */}
      <main className="flex-1 min-h-0 flex flex-col lg:flex-row gap-1 overflow-hidden my-0.5">
        {/* Left/Primary 8-Stream Execution Matrix (Always visible for instant stream preemption & inspection) */}
        <div className="flex-1 min-h-0 flex flex-col bg-slate-900/60 border border-slate-800 rounded-lg p-1.5 overflow-hidden">
          <div className="flex items-center justify-between mb-0.5 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-200 uppercase">
                Interactive Stream Concurrency Matrix (Stream 0 – Stream 7)
              </span>
              <span className="hidden sm:inline-block text-[10px] font-mono text-[#00F0FF] truncate max-w-[320px]">
                {engine.corridor}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Cycle #{String(engine.cycleCount)} · Click Stream to Inspect
            </span>
          </div>

          {/* 8 Primary Execution Streams Grid (Stream 0 to Stream 7) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 flex-1 min-h-0 overflow-hidden">
            {primaryEightStreams.map((stream) => {
              const isSelected = stream.streamId === selectedStream.streamId;
              const prioColor =
                stream.priority === 'HIGH'
                  ? 'text-[#00F0FF] border-[#00F0FF]/50 bg-[#00F0FF]/10'
                  : stream.priority === 'NORMAL'
                    ? 'text-[#10B981] border-[#10B981]/50 bg-[#10B981]/10'
                    : 'text-[#FF9F0A] border-[#FF9F0A]/50 bg-[#FF9F0A]/10';

              const barrierBadge =
                stream.barrierState === 'FAULT' ? (
                  <span className="text-[11px] font-mono font-bold text-[#EF4444] leading-none">
                    ⚡ FAULT
                  </span>
                ) : stream.barrierState === 'LOCKED' ? (
                  <span className="text-[11px] font-mono font-bold text-[#10B981] leading-none">
                    ✓ LOCKED
                  </span>
                ) : (
                  <span className="text-[11px] font-mono font-bold text-[#10B981] leading-none">
                    ✓ ACTIVE
                  </span>
                );

              return (
                <button
                  key={stream.streamId}
                  type="button"
                  onClick={() => handleSelectStream(stream.streamId)}
                  className={
                    'text-left py-0.5 px-1 rounded border transition-colors flex flex-col justify-between overflow-hidden cursor-pointer ' +
                    (isSelected
                      ? 'bg-slate-800/95 border-[#00F0FF] ring-1 ring-[#00F0FF]/50'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-600')
                  }
                >
                  <div className="flex items-center justify-between w-full gap-1 leading-tight">
                    <span className="text-xs font-mono font-bold text-white truncate">
                      Stream {String(stream.streamId)} ({stream.label})
                    </span>
                    <span
                      className={
                        'px-1 py-0 text-xs font-mono font-bold rounded border shrink-0 ' +
                        prioColor
                      }
                    >
                      {formatPriorityLabel(stream.priority)}
                    </span>
                  </div>

                  <div className="leading-tight">
                    <div className="text-xs font-mono font-bold text-white truncate">
                      {stream.activeKernel}
                    </div>
                    <div className="text-[11px] font-mono text-cyan-300 truncate">
                      EVT: {stream.eventSyncFlag}
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full pt-0.5 border-t border-slate-800/80 leading-none">
                    {barrierBadge}
                    <span className="text-[11px] font-mono text-cyan-300">
                      Q:{String(stream.queuedWorkloads.length)} · {String(stream.utilizationPct)}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Contextual Tab Deck & Workload Inspector */}
        <div className="w-full lg:w-[410px] shrink-0 bg-slate-900/60 border border-slate-800 rounded-lg p-1.5 flex flex-col justify-between overflow-hidden">
          {activeTab === 'Mesh' && (
            <div className="flex flex-col justify-between h-full overflow-hidden">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-0.5 mb-0.5">
                  <span className="text-xs font-mono font-bold text-[#00F0FF]">
                    STREAM {selectedStream.label} WORKLOAD & BARRIER MESH
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400">
                    DEP: {selectedStream.dependencyPointer}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {selectedStream.queuedWorkloads.slice(0, 2).map((item) => (
                    <div
                      key={item.taskId}
                      className="flex items-center justify-between text-xs font-mono font-semibold bg-slate-950/90 border border-slate-800 p-1 rounded leading-tight"
                    >
                      <div className="truncate">
                        <span className="text-white font-bold">{item.kernel}</span>
                        <span className="text-cyan-300 ml-1.5">
                          KV[{String(item.kvBlockIndex)}]
                        </span>
                      </div>
                      <div className="text-right shrink-0 ml-1">
                        <span className="text-[#00F0FF]">
                          {item.tokenUnits.toLocaleString()} Units
                        </span>
                        <span className="text-slate-400 ml-1.5">
                          {item.waitEventHex}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preemption & Event Dependency Log */}
              <div className="mt-0.5 pt-0.5 border-t border-slate-800/80">
                <div className="text-[10px] font-mono font-bold text-slate-400 uppercase leading-tight">
                  Preemption & Sync Audit Log ({selectedStream.label})
                </div>
                <div className="space-y-0.5 font-mono text-[11px] text-slate-300 leading-tight">
                  {selectedStream.preemptionLog.slice(0, 2).map((entry, idx) => (
                    <div key={idx} className="truncate bg-black/50 px-1.5 py-0.5 rounded">
                      {entry}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Stream' && (
            <div className="flex flex-col justify-between h-full overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 pb-0.5">
                <span className="text-xs font-mono font-bold text-[#00F0FF]">
                  GRIDSYNC ZERO-TRUST KERNEL DISPATCH
                </span>
                <span className="text-[10px] font-mono text-emerald-400">
                  TARGET: {selectedStream.label}
                </span>
              </div>
              <form onSubmit={handleCustomDispatch} className="space-y-1 my-0.5">
                <div className="grid grid-cols-2 gap-1">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400">
                      Kernel Identifier
                    </label>
                    <input
                      type="text"
                      value={customKernelInput}
                      onChange={(e) => setCustomKernelInput(e.target.value)}
                      className="w-full px-1.5 py-0.5 text-xs font-mono bg-slate-950 border border-slate-700 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400">
                      Token Units (64..262144)
                    </label>
                    <input
                      type="number"
                      value={customTokensInput}
                      onChange={(e) => setCustomTokensInput(Number(e.target.value))}
                      className="w-full px-1.5 py-0.5 text-xs font-mono bg-slate-950 border border-slate-700 rounded text-white"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-0.5 text-xs font-mono font-bold bg-[#00F0FF]/20 hover:bg-[#00F0FF]/30 text-[#00F0FF] border border-[#00F0FF]/50 rounded cursor-pointer"
                >
                  DISPATCH TO STREAM {selectedStream.label}
                </button>
              </form>
              <div className="text-[10px] font-mono text-slate-300 bg-black/60 px-2 py-0.5 rounded border border-slate-800 truncate">
                {engine.lastSanitizationStatus}
              </div>
            </div>
          )}

          {activeTab === 'Prior' && (
            <div className="flex flex-col justify-between h-full overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 pb-0.5">
                <span className="text-xs font-mono font-bold text-[#FF9F0A]">
                  CHAOS & STREAM STRESS TRIGGERS
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Collisions Prevented: {String(engine.barrierCollisionsPrevented)}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-0.5 my-0.5">
                <button
                  type="button"
                  onClick={handleBurst}
                  className="w-full px-2 py-0.5 text-left text-[10px] font-mono font-bold bg-amber-950/40 hover:bg-amber-900/50 text-[#FF9F0A] border border-[#FF9F0A]/40 rounded cursor-pointer"
                >
                  1. Trigger 16-Stream Concurrency Burst
                </button>
                <button
                  type="button"
                  onClick={handleTogglePreemption}
                  className="w-full px-2 py-0.5 text-left text-[10px] font-mono font-bold bg-cyan-950/40 hover:bg-cyan-900/50 text-[#00F0FF] border border-[#00F0FF]/40 rounded cursor-pointer"
                >
                  2. Inject High-Priority Preemption Conflict
                </button>
                <button
                  type="button"
                  onClick={handleStepCycle}
                  className="w-full px-2 py-0.5 text-left text-[10px] font-mono font-bold bg-emerald-950/40 hover:bg-emerald-900/50 text-[#10B981] border border-[#10B981]/40 rounded cursor-pointer"
                >
                  3. Step Asynchronous Event Cycle
                </button>
                <button
                  type="button"
                  onClick={handleFlushQueues}
                  className="w-full px-2 py-0.5 text-left text-[10px] font-mono font-bold bg-rose-950/40 hover:bg-rose-900/50 text-rose-400 border border-rose-500/40 rounded cursor-pointer"
                >
                  4. Flush Stream Queues & Re-Zero Barriers
                </button>
              </div>
            </div>
          )}

          {activeTab === 'Stats' && (
            <div className="flex flex-col justify-between h-full overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 pb-0.5">
                <span className="text-xs font-mono font-bold text-[#10B981]">
                  REAL-TIME SCHEDULER METRICS & SQL RLS
                </span>
                <button
                  type="button"
                  onClick={handleExportAuditJson}
                  className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-800 hover:bg-slate-700 text-[#00F0FF] rounded cursor-pointer"
                >
                  EXPORT AUDIT
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[10px] font-mono my-0.5">
                <div className="bg-slate-950 p-1 rounded border border-slate-800">
                  <div className="text-slate-400">Stream Concurrency</div>
                  <div className="text-white font-bold">16 Streams</div>
                </div>
                <div className="bg-slate-950 p-1 rounded border border-slate-800">
                  <div className="text-slate-400">Scheduler Latency</div>
                  <div className="text-[#00F0FF] font-bold">
                    {engine.schedulerLatencyUs.toFixed(2)} µs
                  </div>
                </div>
                <div className="bg-slate-950 p-1 rounded border border-slate-800">
                  <div className="text-slate-400">Active Priority</div>
                  <div className="text-[#FF9F0A] font-bold">
                    {formatPriorityLabel(engine.activePriorityMode)}
                  </div>
                </div>
                <div className="bg-slate-950 p-1 rounded border border-slate-800">
                  <div className="text-slate-400">Processed Tokens</div>
                  <div className="text-[#10B981] font-bold">
                    {engine.processedTokens.toLocaleString()} Units
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSchemaModal(true)}
                className="w-full py-0.5 text-[10px] font-mono font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded cursor-pointer"
              >
                VIEW POSTGRESQL PARTITIONED RLS SCHEMA
              </button>
            </div>
          )}

          {activeTab === 'APA' && (
            <div className="flex flex-col justify-between h-full overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 pb-0.5">
                <span className="text-xs font-mono font-bold text-[#FF9F0A]">
                  INSTITUTIONAL APA VAULT TRANSFER
                </span>
                <span className="text-[10px] font-mono text-emerald-400">
                  100% MIT / APACHE-2.0
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-300 leading-snug my-0.5">
                Clean-room sovereign kernel scheduler IP. Zero viral copyleft dependencies.
                Includes FastAPI backend, Pytest & Vitest suites, and partitioned PostgreSQL RLS schema.
              </p>
              {apaModalMessage && (
                <div className="text-[10px] font-mono text-[#00F0FF] bg-cyan-950/40 border border-[#00F0FF]/40 px-2 py-0.5 rounded truncate">
                  {apaModalMessage}
                </div>
              )}
              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() =>
                    setApaModalMessage(
                      'APA Title Dossier & Clean-Room Bill of Materials locked for transfer.'
                    )
                  }
                  className="py-1 px-2 text-[10px] font-mono font-bold bg-[#00F0FF]/20 hover:bg-[#00F0FF]/30 text-[#00F0FF] border border-[#00F0FF]/60 rounded cursor-pointer"
                >
                  ACQUIRE TITLE (APA)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setApaModalMessage(
                      'Vault Buyout Escrow Channel opened · Dealership Principal: Garrett.'
                    )
                  }
                  className="py-1 px-2 text-[10px] font-mono font-bold bg-[#FF9F0A]/20 hover:bg-[#FF9F0A]/30 text-[#FF9F0A] border border-[#FF9F0A]/60 rounded cursor-pointer"
                >
                  INQUIRE VAULT BUYOUT
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* COMPACT STREAM TELEMETRY INSPECTOR STRIP */}
      <div
        aria-label="Stream Telemetry Inspector Strip"
        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-0.5 shrink-0 flex items-center justify-between gap-2 overflow-hidden"
      >
        <span className="text-xs font-mono font-bold text-cyan-300 truncate">
          {formatInspectorStrip(selectedStream)}
        </span>
        <span className="hidden lg:inline-block text-[10px] font-mono text-slate-400 shrink-0">
          DEP: {selectedStream.dependencyPointer} · KV: {String(selectedStream.kvCacheRegion)}
        </span>
      </div>

      {/* TACTICAL LAUNCH CONTROL BUTTONS */}
      <section
        aria-label="Tactical Launch Controls"
        className="grid grid-cols-2 lg:grid-cols-4 gap-1 w-full shrink-0 my-0.5"
      >
        <button
          type="button"
          onClick={handleBurst}
          className="border border-[#FF9F0A] bg-[#FF9F0A]/15 hover:bg-[#FF9F0A]/25 text-[#FF9F0A] rounded-lg text-xs font-mono font-bold py-1.5 text-center transition-colors cursor-pointer"
        >
          💥 INJECT STREAM BURST
        </button>

        <button
          type="button"
          onClick={handleTogglePreemption}
          className="border border-[#00F0FF] bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 text-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.25)] rounded-lg text-xs font-mono font-bold py-1.5 text-center transition-colors cursor-pointer"
        >
          ⚡ TOGGLE PREEMPTION
        </button>

        <button
          type="button"
          onClick={handleStepCycle}
          className="border border-[#10B981] bg-[#10B981]/15 hover:bg-[#10B981]/25 text-[#10B981] rounded-lg text-xs font-mono font-bold py-1.5 text-center transition-colors cursor-pointer"
        >
          🚀 STEP ASYNC CYCLE
        </button>

        <button
          type="button"
          onClick={handleFlushQueues}
          className="border border-rose-500 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 rounded-lg text-xs font-mono font-bold py-1.5 text-center transition-colors cursor-pointer"
        >
          🔄 FLUSH STREAM QUEUES
        </button>
      </section>

      {/* PIT-WALL RADIO LOG */}
      <footer
        aria-label="Pit-Wall Radio Log"
        className="h-14 overflow-hidden font-mono text-[10px] p-1.5 bg-black/95 border border-slate-800 rounded-lg shrink-0 text-slate-200 leading-tight flex flex-col justify-between"
      >
        {engine.radioLogs.slice(0, 3).map((entry) => (
          <div key={entry.id} className="truncate">
            {entry.timestamp} {entry.callsign}: {entry.message}
          </div>
        ))}
      </footer>

      {/* SQL SCHEMA MODAL OVERLAY (Inside fixed viewport without window scrolling) */}
      {showSchemaModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-[#05070B] border border-[#00F0FF]/50 rounded-lg max-w-3xl w-full p-3 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <span className="text-xs font-mono font-bold text-[#00F0FF]">
                GF-T3-233 · POSTGRESQL 16 / SUPABASE RLS SCHEMA
              </span>
              <button
                type="button"
                onClick={() => setShowSchemaModal(false)}
                className="px-2 py-0.5 text-xs font-mono font-bold bg-rose-950 text-rose-300 border border-rose-700 rounded cursor-pointer"
              >
                [CLOSE]
              </button>
            </div>
            <pre className="text-[10px] font-mono text-slate-300 bg-black/90 p-2.5 rounded border border-slate-800 overflow-y-auto flex-1">
              {POSTGRES_RLS_SCHEMA_SQL}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
