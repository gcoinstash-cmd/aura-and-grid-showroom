/**
 * APEX-213 Event Replay & Snapshot Compaction Matrix
 * Mathematical State Fold: S_t = S_0 + sum(delta_e)
 * Interactive Event Time-Machine Scrubber with Active Field-Level State Diff
 * Dimensionless unit telemetry.
 */

import React, { useState } from 'react';
import {
  RotateCcw,
  Layers,
  FileCode,
  Database,
  Eye,
  Sliders,
  ArrowRight,
  GitBranch,
} from 'lucide-react';
import { EventEnvelope, AggregateSnapshot, AggregateState } from '../types/cqrs';
import { ClientCQRSEngine } from '../engine/cqrsEngine';

interface EventReplayTabProps {
  engine: ClientCQRSEngine;
  activeCorridor: string;
}

export const EventReplayTab: React.FC<EventReplayTabProps> = ({ engine, activeCorridor }) => {
  const maxSequence = engine.globalSequence;
  const [replaySequence, setReplaySequence] = useState<number>(maxSequence);
  const [selectedEvent, setSelectedEvent] = useState<EventEnvelope | null>(null);

  // Compute state at replaySequence and at replaySequence - 1 for state diff
  const replayedState: AggregateState = engine.getAggregateState(activeCorridor, replaySequence);
  const prevState: AggregateState = replaySequence > 0
    ? engine.getAggregateState(activeCorridor, replaySequence - 1)
    : replayedState;

  // Active event causing the mutation at replaySequence
  const activeEventAtSeq = engine.eventStream.find((e) => e.sequence_id === replaySequence);
  const snapshots: AggregateSnapshot[] = engine.snapshots.get(activeCorridor) || [];

  // Delta calculations
  const deltaLedger = replayedState.ledger_balance - prevState.ledger_balance;
  const deltaReserved = replayedState.reserved_balance - prevState.reserved_balance;
  const deltaAvailable = replayedState.available_balance - prevState.available_balance;

  return (
    <div className="space-y-4">
      {/* Time-Machine & State Fold Controller Card */}
      <div className="bg-[#0B111E] border border-slate-800 rounded-lg p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-cyan-400" />
              Deterministic State Fold Time-Machine
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Reconstruct aggregate state dynamically at any sequence point: S_t = S_0 + sum(delta_e).
            </p>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-slate-400">Target Corridor:</span>
            <span className="text-cyan-300 font-bold bg-slate-900 border border-slate-800 px-2.5 py-1 rounded">
              {activeCorridor}
            </span>
          </div>
        </div>

        {/* Feature 2: Interactive Range Scrubber (#0 to #HEAD) */}
        <div className="space-y-2 p-3.5 bg-slate-950/70 border border-slate-800 rounded-lg">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-200 font-bold flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              Scrubber Head: Sequence #{replaySequence} of #{maxSequence}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setReplaySequence(0)}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded text-xs font-semibold"
              >
                Genesis (#0)
              </button>
              <button
                onClick={() => setReplaySequence(maxSequence)}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 rounded text-xs font-semibold"
              >
                Head (#{maxSequence})
              </button>
            </div>
          </div>

          <input
            type="range"
            min="0"
            max={Math.max(0, maxSequence)}
            value={replaySequence}
            onChange={(e) => setReplaySequence(Number(e.target.value))}
            className="w-full accent-cyan-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
          />

          <div className="flex justify-between text-xs font-mono text-slate-500">
            <span>#0 (Uninitialized)</span>
            <span>Current Head: #{maxSequence}</span>
          </div>
        </div>

        {/* State Display & Active State Diff Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 font-mono text-xs">
          {/* Left: Reconstructed Aggregate State at Scrubber Point */}
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-slate-200">
                Reconstructed State at #{replaySequence}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-bold">
                {'v' + replayedState.version}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-slate-950/80 rounded border border-slate-800">
                <span className="text-slate-400">Ledger Balance:</span>
                <div className="text-sm font-bold text-slate-100 mt-0.5">
                  {replayedState.ledger_balance.toLocaleString() + ' Units'}
                </div>
              </div>

              <div className="p-2 bg-slate-950/80 rounded border border-slate-800">
                <span className="text-slate-400">Available Units:</span>
                <div className="text-sm font-bold text-emerald-300 mt-0.5">
                  {replayedState.available_balance.toLocaleString() + ' Units'}
                </div>
              </div>

              <div className="p-2 bg-slate-950/80 rounded border border-slate-800">
                <span className="text-slate-400">Reserved Units:</span>
                <div className="text-sm font-bold text-amber-300 mt-0.5">
                  {replayedState.reserved_balance.toLocaleString() + ' Units'}
                </div>
              </div>

              <div className="p-2 bg-slate-950/80 rounded border border-slate-800">
                <span className="text-slate-400">Corridor Status:</span>
                <div className="text-sm font-bold text-cyan-300 mt-0.5">
                  {replayedState.status}
                </div>
              </div>
            </div>

            <div className="text-slate-400 pt-1 flex justify-between">
              <span>Transactions Folded: {replayedState.transaction_count}</span>
              <span>Rate Limit: {replayedState.throughput_rate_limit} /s</span>
            </div>
          </div>

          {/* Right: Active State Diff & Mutating Event */}
          <div className="p-4 bg-slate-900/60 border border-cyan-500/30 rounded-lg space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
                Active Transition Diff (Seq #{replaySequence})
              </span>
              <span className="text-slate-400 text-xs">
                {activeEventAtSeq ? activeEventAtSeq.event_type : 'No mutation at #0'}
              </span>
            </div>

            {replaySequence === 0 ? (
              <div className="p-4 text-center text-slate-400 text-xs">
                State is at genesis S_0 baseline before any committed events.
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                {/* Field-level diff rows */}
                <div className="p-2 bg-slate-950/90 rounded border border-slate-800 space-y-1.5">
                  {/* Ledger Balance Diff */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">ledger_balance:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">{prevState.ledger_balance.toLocaleString()}</span>
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                      <span className="text-slate-100 font-semibold">{replayedState.ledger_balance.toLocaleString()}</span>
                      {deltaLedger !== 0 && (
                        <span className={'font-bold px-1.5 py-0.2 rounded ' + (deltaLedger > 0 ? 'text-emerald-400 bg-emerald-950/60' : 'text-rose-400 bg-rose-950/60')}>
                          {(deltaLedger > 0 ? '+' : '') + deltaLedger.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Reserved Balance Diff */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">reserved_balance:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">{prevState.reserved_balance.toLocaleString()}</span>
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                      <span className="text-amber-300 font-semibold">{replayedState.reserved_balance.toLocaleString()}</span>
                      {deltaReserved !== 0 && (
                        <span className={'font-bold px-1.5 py-0.2 rounded ' + (deltaReserved > 0 ? 'text-amber-400 bg-amber-950/60' : 'text-emerald-400 bg-emerald-950/60')}>
                          {(deltaReserved > 0 ? '+' : '') + deltaReserved.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Available Balance Diff */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">available_balance:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">{prevState.available_balance.toLocaleString()}</span>
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                      <span className="text-emerald-300 font-semibold">{replayedState.available_balance.toLocaleString()}</span>
                      {deltaAvailable !== 0 && (
                        <span className={'font-bold px-1.5 py-0.2 rounded ' + (deltaAvailable > 0 ? 'text-emerald-400 bg-emerald-950/60' : 'text-rose-400 bg-rose-950/60')}>
                          {(deltaAvailable > 0 ? '+' : '') + deltaAvailable.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Event Preimage Seal */}
                {activeEventAtSeq && (
                  <div className="p-2 bg-slate-950/70 border border-slate-800 rounded truncate">
                    <span className="text-slate-400">Committed Hash:</span>{' '}
                    <span className="text-cyan-300">{activeEventAtSeq.event_hash}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Snapshot Compaction Manager */}
      <div className="bg-[#0B111E] border border-slate-800 rounded-lg p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div>
            <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              Automated Snapshot Compaction (Interval N = 100)
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              O(1) state reconstitution checkpoint table.
            </p>
          </div>
          <span className="font-mono text-xs px-2.5 py-1 bg-slate-900 border border-slate-800 rounded text-amber-300 font-bold">
            {snapshots.length + ' Snapshots Captured'}
          </span>
        </div>

        {snapshots.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-400 bg-slate-950/50 rounded border border-dashed border-slate-800">
            No snapshots captured for this corridor yet. Snapshots trigger automatically every 100 version increments. Use "Trigger Next Snapshot (N=100)" in Command Bus to generate one instantly.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2 px-2.5">Snapshot Version</th>
                  <th className="py-2 px-2.5">Sequence At Capture</th>
                  <th className="py-2 px-2.5">Ledger Balance</th>
                  <th className="py-2 px-2.5">Snapshot SHA-256 Hash</th>
                  <th className="py-2 px-2.5 text-right">O(1) Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {snapshots.map((snap) => (
                  <tr key={snap.snapshot_version} className="hover:bg-slate-900/40">
                    <td className="py-2 px-2.5 text-amber-300 font-bold">
                      {'v' + snap.snapshot_version}
                    </td>
                    <td className="py-2 px-2.5 text-slate-200">
                      {'#' + snap.snapshot_sequence}
                    </td>
                    <td className="py-2 px-2.5 text-cyan-300">
                      {snap.state.ledger_balance.toLocaleString() + ' Units'}
                    </td>
                    <td className="py-2 px-2.5 text-slate-400 truncate max-w-[220px]" title={snap.snapshot_hash}>
                      {snap.snapshot_hash}
                    </td>
                    <td className="py-2 px-2.5 text-right">
                      <span className="px-2 py-0.5 rounded text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        COMPACTED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Append-Only Event Stream Table */}
      <div className="bg-[#0B111E] border border-slate-800 rounded-lg p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div>
            <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              Append-Only Event Store Stream
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Strictly immutable event envelopes with rolling cryptographic hash seals.
            </p>
          </div>
          <span className="font-mono text-xs px-2.5 py-1 bg-slate-900 border border-slate-800 rounded text-emerald-400 font-bold">
            {engine.eventStream.length + ' Events'}
          </span>
        </div>

        <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead className="sticky top-0 bg-[#0B111E] z-10">
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2 px-2.5">Sequence</th>
                <th className="py-2 px-2.5">Corridor</th>
                <th className="py-2 px-2.5">Version</th>
                <th className="py-2 px-2.5">Event Type</th>
                <th className="py-2 px-2.5">Rolling Hash Seal</th>
                <th className="py-2 px-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {engine.eventStream.map((ev) => (
                <tr
                  key={ev.sequence_id}
                  className="hover:bg-slate-900/50 transition-colors"
                >
                  <td className="py-2 px-2.5 text-cyan-400 font-bold">
                    {'#' + ev.sequence_id}
                  </td>
                  <td className="py-2 px-2.5 text-slate-300 truncate max-w-[140px]">
                    {ev.corridor_id}
                  </td>
                  <td className="py-2 px-2.5 text-amber-300 font-semibold">
                    {'v' + ev.aggregate_version}
                  </td>
                  <td className="py-2 px-2.5 text-emerald-300">
                    {ev.event_type}
                  </td>
                  <td className="py-2 px-2.5 text-slate-400 truncate max-w-[160px]" title={ev.event_hash}>
                    {ev.event_hash.slice(0, 16) + '...'}
                  </td>
                  <td className="py-2 px-2.5 text-right">
                    <button
                      onClick={() => setSelectedEvent(ev)}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded text-xs flex items-center gap-1 ml-auto font-sans"
                    >
                      <Eye className="w-3 h-3 text-cyan-400" />
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Event Envelope Inspector Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0B111E] border border-cyan-500/50 rounded-lg max-w-xl w-full p-5 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-cyan-400" />
                Event Envelope #{selectedEvent.sequence_id}
              </h4>
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
              >
                Close
              </button>
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-950 rounded border border-slate-800">
                <div>
                  <span className="text-slate-400">Corridor ID:</span>
                  <div className="text-slate-200 font-bold">{selectedEvent.corridor_id}</div>
                </div>
                <div>
                  <span className="text-slate-400">Aggregate Version:</span>
                  <div className="text-amber-400 font-bold">{'v' + selectedEvent.aggregate_version}</div>
                </div>
                <div className="mt-1">
                  <span className="text-slate-400">Event Type:</span>
                  <div className="text-emerald-400 font-bold">{selectedEvent.event_type}</div>
                </div>
                <div className="mt-1">
                  <span className="text-slate-400">Commit Timestamp:</span>
                  <div className="text-slate-200">{selectedEvent.commit_timestamp.toFixed(6)} s</div>
                </div>
              </div>

              <div>
                <span className="text-slate-400">Previous Hash (prev_hash):</span>
                <div className="p-2 bg-slate-950 border border-slate-800 rounded text-slate-300 break-all select-all mt-0.5">
                  {selectedEvent.prev_hash}
                </div>
              </div>

              <div>
                <span className="text-slate-400">Committed SHA-256 Hash Seal:</span>
                <div className="p-2 bg-slate-950 border border-cyan-500/40 rounded text-cyan-300 break-all select-all mt-0.5 font-bold">
                  {selectedEvent.event_hash}
                </div>
              </div>

              <div>
                <span className="text-slate-400">Payload:</span>
                <pre className="p-2.5 bg-slate-950 border border-slate-800 rounded text-slate-200 overflow-x-auto mt-0.5">
                  {JSON.stringify(selectedEvent.payload, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
