/**
 * APEX-213 Command Bus & Optimistic Concurrency Control Pipeline
 * Write Command Execution, Invariant Enforcement, Dual-View Split & 5-Writer OCC Race
 * Dimensionless unit telemetry.
 */

import React, { useState } from 'react';
import {
  Send,
  AlertOctagon,
  FastForward,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  ArrowRight,
  Terminal,
  Columns,
  Activity,
  Flame,
  Gauge,
} from 'lucide-react';
import { CommandType, CorridorId, MaterializedCorridorView } from '../types/cqrs';
import { ClientCQRSEngine } from '../engine/cqrsEngine';

interface CommandBusTabProps {
  engine: ClientCQRSEngine;
  activeCorridor: string;
  onCorridorChange: (id: string) => void;
  onRefresh: () => void;
  projection?: MaterializedCorridorView;
}

export const CommandBusTab: React.FC<CommandBusTabProps> = ({
  engine,
  activeCorridor,
  onCorridorChange,
  onRefresh,
  projection,
}) => {
  const [commandType, setCommandType] = useState<CommandType>(CommandType.COMMIT_ALLOCATION);
  const [units, setUnits] = useState<number>(15000);
  const [purposeOrTag, setPurposeOrTag] = useState<string>('INSTITUTIONAL_BUFFER_REBALANCE');
  const [expectedVersionInput, setExpectedVersionInput] = useState<number | ''>('');
  const [customExpected, setCustomExpected] = useState<boolean>(false);
  const [isSplitView, setIsSplitView] = useState<boolean>(false);
  
  const [lastActionResult, setLastActionResult] = useState<{
    success: boolean;
    message: string;
    sequence?: number;
    hash?: string;
  } | null>(null);

  const [raceResults, setRaceResults] = useState<{
    totalWriters: number;
    succeededWriterId: string;
    newVersion: number;
    rejectedWriters: { writerId: string; expected: number; current: number; dlqId: string }[];
  } | null>(null);

  const currentVersion = engine.aggregateVersions.get(activeCorridor) || 1;
  const effectiveExpectedVersion = customExpected && expectedVersionInput !== ''
    ? Number(expectedVersionInput)
    : currentVersion;

  const handleDispatch = (overrideExpected?: number) => {
    setRaceResults(null);
    const expVer = overrideExpected !== undefined ? overrideExpected : effectiveExpectedVersion;
    const cmdId = 'CMD-' + Date.now().toString().slice(-6);

    let payload: Record<string, any> = {};

    if (commandType === CommandType.COMMIT_ALLOCATION) {
      payload = { units, purpose: purposeOrTag };
    } else if (commandType === CommandType.RESERVE_DEBIT) {
      payload = { units, reserve_tag: purposeOrTag };
    } else if (commandType === CommandType.FINALIZE_SETTLEMENT) {
      payload = { units, batch_id: 'BATCH-' + Date.now().toString().slice(-4) };
    } else if (commandType === CommandType.TRANSFER_CREDIT) {
      payload = {
        units,
        destination_corridor:
          activeCorridor === CorridorId.CORRIDOR_ALPHA
            ? CorridorId.ROUTER_BETA
            : CorridorId.CORRIDOR_ALPHA,
        routing_code: 'INTRA-CORRIDOR-CLEARING',
      };
    } else if (commandType === CommandType.ADJUST_RATE_LIMIT) {
      payload = { new_limit: units };
    } else if (commandType === CommandType.PAUSE_CORRIDOR) {
      payload = { reason: purposeOrTag || 'CIRCUIT_BREAKER_TRIGGERED' };
    } else if (commandType === CommandType.RESUME_CORRIDOR) {
      payload = { reason: purposeOrTag || 'OPERATIONAL_RESUMPTION' };
    }

    const res = engine.dispatchCommand({
      command_id: cmdId,
      corridor_id: activeCorridor,
      command_type: commandType,
      expected_version: expVer,
      payload,
      timestamp: Date.now() / 1000,
    });

    if (res.success && res.event) {
      setLastActionResult({
        success: true,
        message:
          'Command committed successfully as Sequence #' +
          res.event.sequence_id +
          ' (Aggregate v' +
          res.event.aggregate_version +
          ')',
        sequence: res.event.sequence_id,
        hash: res.event.event_hash,
      });
    } else {
      setLastActionResult({
        success: false,
        message: res.error || 'Command mutation rejected by aggregate invariants.',
      });
    }

    onRefresh();
  };

  const handleTriggerOCCConflict = () => {
    const staleVer = Math.max(0, currentVersion - 1);
    handleDispatch(staleVer);
  };

  // Feature 3: Concurrent Multi-Writer OCC Race Simulator
  const handleSimulateFiveWriterRace = () => {
    setLastActionResult(null);
    const lockedExpectedVersion = currentVersion;
    const writers = [
      { id: 'WRITER-THREAD-ALPHA', units: 5000, purpose: 'RACE_PARTICIPANT_1' },
      { id: 'WRITER-THREAD-BETA', units: 8000, purpose: 'RACE_PARTICIPANT_2' },
      { id: 'WRITER-THREAD-GAMMA', units: 12000, purpose: 'RACE_PARTICIPANT_3' },
      { id: 'WRITER-THREAD-DELTA', units: 15000, purpose: 'RACE_PARTICIPANT_4' },
      { id: 'WRITER-THREAD-EPSILON', units: 20000, purpose: 'RACE_PARTICIPANT_5' },
    ];

    let winnerWriterId = '';
    let updatedVersion = lockedExpectedVersion;
    const rejected: { writerId: string; expected: number; current: number; dlqId: string }[] = [];

    writers.forEach((w, index) => {
      const res = engine.dispatchCommand({
        command_id: 'RACE-' + w.id + '-' + Date.now(),
        corridor_id: activeCorridor,
        command_type: CommandType.COMMIT_ALLOCATION,
        expected_version: lockedExpectedVersion, // All 5 attempt the exact same version
        payload: { units: w.units, purpose: w.purpose },
        timestamp: Date.now() / 1000,
      });

      if (res.success && res.event) {
        winnerWriterId = w.id;
        updatedVersion = res.event.aggregate_version;
      } else {
        const latestDlq = engine.dlq[0];
        rejected.push({
          writerId: w.id,
          expected: lockedExpectedVersion,
          current: engine.aggregateVersions.get(activeCorridor) || lockedExpectedVersion + 1,
          dlqId: latestDlq ? latestDlq.record_id : 'DLQ-OCC-CAPTURED',
        });
      }
    });

    setRaceResults({
      totalWriters: 5,
      succeededWriterId: winnerWriterId,
      newVersion: updatedVersion,
      rejectedWriters: rejected,
    });

    onRefresh();
  };

  const handleBurstDispatch = (count: number = 10) => {
    setRaceResults(null);
    let successCount = 0;
    for (let i = 0; i < count; i++) {
      const v = engine.aggregateVersions.get(activeCorridor) || 1;
      const res = engine.dispatchCommand({
        command_id: 'BURST-' + Date.now() + '-' + i,
        corridor_id: activeCorridor,
        command_type: CommandType.COMMIT_ALLOCATION,
        expected_version: v,
        payload: {
          units: 1000 + i * 250,
          purpose: 'BURST_THROUGHPUT_STRESS_BATCH_' + (i + 1),
        },
        timestamp: Date.now() / 1000,
      });
      if (res.success) successCount++;
    }

    setLastActionResult({
      success: true,
      message:
        'Executed burst pipeline: ' +
        successCount +
        ' / ' +
        count +
        ' mutations committed sequentially under OCC lock.',
    });
    onRefresh();
  };

  const handleFastForwardToSnapshot = () => {
    setRaceResults(null);
    const curV = engine.aggregateVersions.get(activeCorridor) || 1;
    const targetV = Math.ceil((curV + 1) / 100) * 100;
    const needed = targetV - curV;

    for (let i = 0; i < needed; i++) {
      const v = engine.aggregateVersions.get(activeCorridor) || 1;
      engine.dispatchCommand({
        command_id: 'SNAP-BURST-' + Date.now() + '-' + i,
        corridor_id: activeCorridor,
        command_type: CommandType.COMMIT_ALLOCATION,
        expected_version: v,
        payload: { units: 500, purpose: 'SNAPSHOT_COMPACTION_SEED' },
        timestamp: Date.now() / 1000,
      });
    }

    setLastActionResult({
      success: true,
      message:
        'Advanced aggregate to v' +
        targetV +
        '. Automated Snapshot Compaction generated at checkpoint v' +
        targetV +
        '!',
    });
    onRefresh();
  };

  const allProjections = Array.from(engine.materializedViews.values());

  return (
    <div className="space-y-4">
      {/* Target Corridor & View Switcher Bar */}
      <div className="bg-[#0B111E] border border-slate-800 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold tracking-wide uppercase text-slate-400">
            Corridor:
          </span>
          {[
            { id: CorridorId.CORRIDOR_ALPHA, label: 'CORRIDOR-ALPHA' },
            { id: CorridorId.ROUTER_BETA, label: 'ROUTER-BETA' },
            { id: CorridorId.WORKER_GAMMA, label: 'WORKER-GAMMA' },
          ].map((c) => (
            <button
              key={c.id}
              onClick={() => onCorridorChange(c.id)}
              className={
                'px-3 py-1.5 text-xs font-bold rounded transition-colors ' +
                (activeCorridor === c.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200')
              }
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Feature 1: Dual-View Split Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSplitView(!isSplitView)}
            className={
              'px-3 py-1.5 text-xs font-bold rounded flex items-center gap-1.5 transition-all ' +
              (isSplitView
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/50 shadow-sm'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200')
            }
          >
            <Columns className="w-3.5 h-3.5 text-violet-400" />
            <span>{isSplitView ? 'Dual-View Split: ACTIVE' : 'Split Read/Write View'}</span>
          </button>

          <div className="flex items-center gap-2 font-mono text-xs text-slate-300">
            <span className="text-slate-400">OCC Head:</span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 font-bold text-amber-400">
              {'v' + currentVersion}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Command Builder (+ Read Projections if Split View is active) */}
      <div
        className={
          isSplitView
            ? 'grid grid-cols-1 lg:grid-cols-2 gap-4'
            : 'grid grid-cols-1 lg:grid-cols-3 gap-4'
        }
      >
        {/* Left Column: Command Builder Form */}
        <div
          className={
            (isSplitView ? 'lg:col-span-1' : 'lg:col-span-2') +
            ' bg-[#0B111E] border border-slate-800 rounded-lg p-5 space-y-4'
          }
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Write Pipeline Command Dispatcher
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Mutations enforce Optimistic Concurrency Control (OCC) version locking.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-cyan-400"></span>
              <span className="text-xs font-mono text-cyan-400 font-semibold">
                OCC WRITE BUS
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Command Type Selector */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Command Type
              </label>
              <select
                value={commandType}
                onChange={(e) => setCommandType(e.target.value as CommandType)}
                className="w-full px-3 py-2 text-xs font-medium bg-slate-900 border border-slate-700 rounded-md text-slate-100 focus:outline-none focus:border-cyan-400"
              >
                <option value={CommandType.COMMIT_ALLOCATION}>CommitAllocation (Add Liquidity)</option>
                <option value={CommandType.RESERVE_DEBIT}>ReserveDebit (Hold For Clearing)</option>
                <option value={CommandType.FINALIZE_SETTLEMENT}>FinalizeSettlement (Settle Debit)</option>
                <option value={CommandType.TRANSFER_CREDIT}>TransferCredit (Route Out)</option>
                <option value={CommandType.ADJUST_RATE_LIMIT}>AdjustRateLimit (Throughput Limit)</option>
                <option value={CommandType.PAUSE_CORRIDOR}>PauseCorridor (Circuit Breaker)</option>
                <option value={CommandType.RESUME_CORRIDOR}>ResumeCorridor (Reopen Flow)</option>
              </select>
            </div>

            {/* Units Input */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                Units Value / Limit
              </label>
              <input
                type="number"
                min="1"
                step="500"
                value={units}
                onChange={(e) => setUnits(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-mono font-medium bg-slate-900 border border-slate-700 rounded-md text-slate-100 focus:outline-none focus:border-cyan-400"
                placeholder="e.g. 15000"
              />
            </div>
          </div>

          {/* Purpose / Reserve Tag */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">
              Payload Identifier / Tag
            </label>
            <input
              type="text"
              value={purposeOrTag}
              onChange={(e) => setPurposeOrTag(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono bg-slate-900 border border-slate-700 rounded-md text-slate-100 focus:outline-none focus:border-cyan-400"
              placeholder="e.g. INSTITUTIONAL_BUFFER_REBALANCE"
            />
          </div>

          {/* OCC Lock Input Configuration */}
          <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-lg space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300">
                Optimistic Concurrency Control Lock
              </span>
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-400">
                <input
                  type="checkbox"
                  checked={customExpected}
                  onChange={(e) => {
                    setCustomExpected(e.target.checked);
                    if (e.target.checked && expectedVersionInput === '') {
                      setExpectedVersionInput(currentVersion);
                    }
                  }}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                />
                Override expected_version
              </label>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400">Current:</span>
              <span className="text-cyan-400 font-bold">{'v' + currentVersion}</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">Submitting expected:</span>
              <span className="text-amber-400 font-bold">
                {'v' + effectiveExpectedVersion}
              </span>
            </div>

            {customExpected && (
              <div className="pt-1">
                <input
                  type="number"
                  min="0"
                  value={expectedVersionInput}
                  onChange={(e) => setExpectedVersionInput(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Enter custom version for collision testing"
                  className="w-full px-3 py-1.5 text-xs font-mono bg-slate-950 border border-amber-500/50 rounded text-amber-200 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={() => handleDispatch()}
              className="px-4 py-2 text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded transition-all shadow-md flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              Dispatch Command (v{effectiveExpectedVersion})
            </button>

            <button
              onClick={handleTriggerOCCConflict}
              className="px-3.5 py-2 text-xs font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/50 rounded transition-all flex items-center gap-1.5"
            >
              <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
              Force OCC Collision
            </button>

            {/* Feature 3: Simulate 5-Writer Race Button */}
            <button
              onClick={handleSimulateFiveWriterRace}
              className="px-3.5 py-2 text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 rounded transition-all flex items-center gap-1.5"
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Simulate 5-Writer Race
            </button>
          </div>

          {/* Last Action Notification Box */}
          {lastActionResult && (
            <div
              className={
                'p-3 rounded border text-xs flex items-start gap-2.5 ' +
                (lastActionResult.success
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-200')
              }
            >
              {lastActionResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5 font-mono">
                <div className="font-semibold">{lastActionResult.message}</div>
                {lastActionResult.hash && (
                  <div className="text-slate-400 truncate max-w-md">
                    SHA-256 Seal: {lastActionResult.hash}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Feature 3: 5-Writer Race Result Breakdown */}
          {raceResults && (
            <div className="p-3.5 bg-slate-950/90 border border-amber-500/40 rounded-lg space-y-2.5 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-400" />
                  Concurrent 5-Writer OCC Race Completed
                </span>
                <span className="text-slate-400">
                  1 Accepted · 4 Rejected to DLQ
                </span>
              </div>

              {/* Winner */}
              <div className="p-2 bg-emerald-950/40 border border-emerald-500/30 rounded flex items-center justify-between">
                <span className="text-emerald-300 font-bold">
                  Commit Winner: {raceResults.succeededWriterId}
                </span>
                <span className="text-emerald-400 font-semibold">
                  Committed as v{raceResults.newVersion}
                </span>
              </div>

              {/* Rejected Replicas */}
              <div className="space-y-1">
                <div className="text-slate-400 font-semibold">
                  OCC Collisions Routed to Dead-Letter Queue (DLQ):
                </div>
                {raceResults.rejectedWriters.map((rw, idx) => (
                  <div
                    key={idx}
                    className="p-1.5 bg-rose-950/30 border border-rose-500/20 rounded flex items-center justify-between text-rose-300"
                  >
                    <span>
                      {rw.writerId}: expected v{rw.expected} != aggregate v{rw.current}
                    </span>
                    <span className="text-slate-400 text-xs">
                      {rw.dlqId}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Feature 1 (Split View): Real-Time Read Projection Materializer Table */}
        {isSplitView ? (
          <div className="bg-[#0B111E] border border-violet-500/40 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-violet-400" />
                  Materialized Read Projection
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time query view updated with live projection lag tau_lag.
                </p>
              </div>
              <span className="px-2 py-0.5 bg-violet-950/60 border border-violet-700/50 rounded font-mono text-xs text-violet-300 font-semibold">
                DUAL-VIEW SYNC
              </span>
            </div>

            {/* Live Corridor Materialized View Card */}
            {projection && (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 bg-slate-900/80 border border-slate-800 rounded space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Target Aggregate:</span>
                    <span className="text-violet-300 font-bold">{projection.corridor_id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Current Materialized Version:</span>
                    <span className="text-amber-400 font-bold">{'v' + projection.current_version}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Sequence Head:</span>
                    <span className="text-cyan-400 font-bold">{'#' + projection.last_sequence_id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Projection Lag (tau_lag):</span>
                    <span className="text-violet-400 font-bold">{projection.projection_lag_ms.toFixed(2) + ' ms'}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Ledger Balance:</span>
                    <span className="text-slate-100 font-bold">{projection.ledger_balance.toLocaleString() + ' Units'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Reserved Units:</span>
                    <span className="text-amber-300 font-semibold">{projection.reserved_balance.toLocaleString() + ' Units'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Available Balance:</span>
                    <span className="text-emerald-300 font-semibold">{projection.available_balance.toLocaleString() + ' Units'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Status:</span>
                    <span className="px-2 py-0.5 rounded text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      {projection.status}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded">
                  <div className="text-slate-400 mb-1">Last Cryptographic SHA-256 Seal:</div>
                  <div className="text-slate-300 truncate select-all">{projection.last_event_hash}</div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Normal View Right Column: Stress Generators & Stats */
          <div className="bg-[#0B111E] border border-slate-800 rounded-lg p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="border-b border-slate-800 pb-2">
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  Deterministic Load Generators
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  High-velocity pipeline testing and compaction triggers.
                </p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => handleBurstDispatch(10)}
                  className="w-full px-3.5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 rounded transition-all flex items-center justify-between"
                >
                  <span>Commit Burst (10 Events)</span>
                  <FastForward className="w-3.5 h-3.5 text-cyan-400" />
                </button>

                <button
                  onClick={handleFastForwardToSnapshot}
                  className="w-full px-3.5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 rounded transition-all flex items-center justify-between"
                >
                  <span>Trigger Next Snapshot (N=100)</span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                </button>
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Corridor Status:</span>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {projection ? projection.status : 'ACTIVE'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Ledger Balance:</span>
                  <span className="font-bold text-slate-200">
                    {projection ? projection.ledger_balance.toLocaleString() : '142,500'}{' '}
                    Units
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Reserved Units:</span>
                  <span className="font-semibold text-amber-300">
                    {projection ? projection.reserved_balance.toLocaleString() : '18,000'}{' '}
                    Units
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Available Units:</span>
                  <span className="font-semibold text-cyan-300">
                    {projection ? projection.available_balance.toLocaleString() : '124,500'}{' '}
                    Units
                  </span>
                </div>
              </div>
            </div>

            <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded text-xs text-slate-400 space-y-1">
              <div className="flex items-center gap-1 text-slate-300 font-semibold">
                <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
                Optimistic Concurrency Control Invariant:
              </div>
              <div>
                expected_version == current_version. All stale writes reject to Dead-Letter Queue.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
