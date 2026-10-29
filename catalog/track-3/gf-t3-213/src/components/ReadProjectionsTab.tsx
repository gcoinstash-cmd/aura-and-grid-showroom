/**
 * APEX-213 Read Model Projections & Dual-View Latency Telemetry
 * Real-Time Projection Lag tau_lag = t_projection - t_commit
 * Strictly 14px+ typographic floor. Dimensionless unit telemetry.
 */

import React from 'react';
import {
  Layers,
  Activity,
  CheckCircle,
  Hash,
  Shield,
  Gauge,
  ArrowUpRight,
} from 'lucide-react';
import { MaterializedCorridorView, CorridorId } from '../types/cqrs';
import { ClientCQRSEngine } from '../engine/cqrsEngine';

interface ReadProjectionsTabProps {
  engine: ClientCQRSEngine;
  activeCorridor: string;
  onSelectCorridor: (id: string) => void;
}

export const ReadProjectionsTab: React.FC<ReadProjectionsTabProps> = ({
  engine,
  activeCorridor,
  onSelectCorridor,
}) => {
  const views = Array.from(engine.materializedViews.values());

  return (
    <div className="space-y-6">
      {/* Projection Materialization Header Card */}
      <div className="bg-[#0B111E] border border-slate-800 rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Activity className="w-5 h-5 text-violet-400" />
              Asynchronous Read View Materializer
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              Read models are decoupled from the write bus, consuming committed event envelopes to build query-optimized projections with sub-millisecond lag.
            </p>
          </div>
          <div className="flex items-center gap-4 font-mono text-sm">
            <div className="bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded">
              <span className="text-slate-400">Projection Engine:</span>{' '}
              <span className="text-violet-400 font-bold">SYNCHRONOUS FOLD</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded">
              <span className="text-slate-400">Total Projections:</span>{' '}
              <span className="text-emerald-400 font-bold">{views.length}</span>
            </div>
          </div>
        </div>

        {/* Latency Formula Callout */}
        <div className="mt-4 p-4 bg-slate-950/70 border border-slate-800/80 rounded-md flex flex-wrap items-center justify-between gap-4 text-sm font-mono">
          <div className="flex items-center gap-3">
            <span className="text-slate-400">Projection Lag Equation:</span>
            <span className="text-violet-300 font-semibold px-2 py-0.5 bg-violet-950/40 rounded border border-violet-800/40">
              tau_lag = t_projection - t_commit
            </span>
          </div>
          <div className="text-slate-400">
            Target SLA: <span className="text-emerald-400 font-semibold">&lt; 5.00 ms</span> across high-concurrency partitions
          </div>
        </div>
      </div>

      {/* Grid of Materialized Corridor Views */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {views.map((view) => {
          const isActive = view.corridor_id === activeCorridor;
          const availableRatio = view.ledger_balance > 0
            ? Math.round((view.available_balance / view.ledger_balance) * 100)
            : 0;

          return (
            <div
              key={view.corridor_id}
              onClick={() => onSelectCorridor(view.corridor_id)}
              className={
                'cursor-pointer bg-[#0B111E] border rounded-lg p-6 space-y-5 transition-all shadow-sm hover:border-violet-500/60 ' +
                (isActive
                  ? 'border-violet-500 shadow-violet-500/10'
                  : 'border-slate-800')
              }
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-mono text-violet-400 font-semibold">
                    {view.corridor_id === CorridorId.CORRIDOR_ALPHA
                      ? 'SETTLEMENT-LEDGER-01'
                      : view.corridor_id === CorridorId.ROUTER_BETA
                      ? 'HIGH-VELOCITY-DISPATCH'
                      : 'READ-VIEW-MATERIALIZER'}
                  </div>
                  <h4 className="text-lg font-bold text-slate-100 mt-0.5 truncate max-w-[240px]">
                    {view.corridor_id}
                  </h4>
                </div>
                <span
                  className={
                    'px-3 py-1 text-sm font-semibold rounded-md border ' +
                    (view.status === 'ACTIVE'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40')
                  }
                >
                  {view.status}
                </span>
              </div>

              {/* Balances */}
              <div className="space-y-3 p-4 bg-slate-900/60 border border-slate-800 rounded-md">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-slate-400">Total Ledger Units:</span>
                  <span className="text-2xl font-mono font-bold text-slate-100">
                    {view.ledger_balance.toLocaleString()}
                  </span>
                </div>

                {/* Balance Progress Bar */}
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: availableRatio + '%' }}
                    className="bg-cyan-500 h-full"
                    title="Available Units"
                  ></div>
                  <div
                    style={{ width: (100 - availableRatio) + '%' }}
                    className="bg-amber-500 h-full"
                    title="Reserved Units"
                  ></div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 text-sm font-mono">
                  <div>
                    <div className="text-slate-400">Available:</div>
                    <div className="font-semibold text-cyan-300">
                      {view.available_balance.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-slate-400">Reserved:</div>
                    <div className="font-semibold text-amber-300">
                      {view.reserved_balance.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Real-time Telemetry Row */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-slate-900/40 border border-slate-800/80 rounded">
                  <span className="text-slate-400 flex items-center gap-1.5 mb-1">
                    <Activity className="w-4 h-4 text-violet-400" />
                    Projection Lag
                  </span>
                  <span className="font-mono text-base font-bold text-violet-300">
                    {view.projection_lag_ms.toFixed(2) + ' ms'}
                  </span>
                </div>

                <div className="p-3 bg-slate-900/40 border border-slate-800/80 rounded">
                  <span className="text-slate-400 flex items-center gap-1.5 mb-1">
                    <Gauge className="w-4 h-4 text-emerald-400" />
                    Rate Limit
                  </span>
                  <span className="font-mono text-base font-bold text-slate-200">
                    {view.throughput_rate_limit.toLocaleString() + ' /s'}
                  </span>
                </div>
              </div>

              {/* Version & Cryptographic Hash Footer */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-sm font-mono text-slate-400">
                <div className="flex justify-between">
                  <span>Aggregate Version:</span>
                  <span className="text-slate-200 font-bold">{'v' + view.current_version}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Sequence Committed:</span>
                  <span className="text-cyan-400 font-bold">{'#' + view.last_sequence_id}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400 truncate pt-1">
                  <span className="shrink-0 mr-2">SHA-256 Seal:</span>
                  <span className="text-slate-300 truncate" title={view.last_event_hash}>
                    {view.last_event_hash.slice(0, 16) + '...'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
