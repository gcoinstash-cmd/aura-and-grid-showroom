/**
 * APEX-213 Distributed CQRS Top HUD Telemetry Ribbon
 * 4-Card Balanced Telemetry Grid with Snapshot Compaction Gauge
 * Dimensionless unit telemetry.
 */

import React from 'react';
import { Activity, Database, GitCommit, Layers, Hourglass } from 'lucide-react';
import { TelemetrySummary } from '../types/cqrs';

interface HudRibbonProps {
  telemetry: TelemetrySummary;
  activeCorridorVersion: number;
}

export const HudRibbon: React.FC<HudRibbonProps> = ({ telemetry, activeCorridorVersion }) => {
  const eventsInCycle = activeCorridorVersion % 100;
  const progressPercent = Math.min(100, Math.max(1, eventsInCycle));

  return (
    <div className="space-y-2 w-full my-3">
      {/* 4-Card Responsive Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full">
        {/* 1. Sequence # */}
        <div className="bg-[#0B111E] border border-slate-800 rounded-lg px-3.5 py-2.5 shadow-sm hover:border-cyan-500/50 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold tracking-wide uppercase text-slate-300">
              Sequence #
            </span>
            <Database className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-xl lg:text-2xl font-bold tracking-tight text-cyan-400">
              {'#' + telemetry.global_sequence_id.toLocaleString()}
            </span>
            <span className="text-xs font-medium text-slate-400">
              Committed
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-400 font-mono flex items-center justify-between">
            <span>Log Head</span>
            <span className="text-cyan-400 font-medium">Strict Append</span>
          </div>
        </div>

        {/* 2. Projection Lag ms */}
        <div className="bg-[#0B111E] border border-slate-800 rounded-lg px-3.5 py-2.5 shadow-sm hover:border-violet-500/50 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold tracking-wide uppercase text-slate-300">
              Projection Lag
            </span>
            <Activity className="w-4 h-4 text-violet-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-xl lg:text-2xl font-bold tracking-tight text-violet-400">
              {telemetry.projection_lag_ms.toFixed(2) + ' ms'}
            </span>
            <span className="text-xs font-medium text-slate-400">
              tau_lag
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-400 font-mono flex items-center justify-between">
            <span>Materializer</span>
            <span className="text-emerald-400 font-medium">Sync Read</span>
          </div>
        </div>

        {/* 3. Commit Throughput */}
        <div className="bg-[#0B111E] border border-slate-800 rounded-lg px-3.5 py-2.5 shadow-sm hover:border-emerald-500/50 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold tracking-wide uppercase text-slate-300">
              Commit Throughput
            </span>
            <GitCommit className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-xl lg:text-2xl font-bold tracking-tight text-emerald-400">
              {telemetry.commit_throughput_events_per_sec.toFixed(1)}
            </span>
            <span className="text-xs font-medium text-slate-400">
              events/sec
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-400 font-mono flex items-center justify-between">
            <span>Processed</span>
            <span className="text-slate-300 font-medium">
              {telemetry.total_commands_processed + ' Cmds'}
            </span>
          </div>
        </div>

        {/* 4. Active Version */}
        <div className="bg-[#0B111E] border border-slate-800 rounded-lg px-3.5 py-2.5 shadow-sm hover:border-amber-500/50 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold tracking-wide uppercase text-slate-300">
              Active Version
            </span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-xl lg:text-2xl font-bold tracking-tight text-slate-100">
              {'v' + activeCorridorVersion}
            </span>
            <span className="text-xs font-medium text-slate-400">
              OCC Head
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-400 font-mono flex items-center justify-between">
            <span>OCC Collisions</span>
            <span className={telemetry.total_occ_conflicts > 0 ? 'text-rose-400 font-bold' : 'text-slate-400 font-medium'}>
              {telemetry.total_occ_conflicts + ' Rejected'}
            </span>
          </div>
        </div>
      </div>

      {/* Feature 4: Snapshot Compaction Progress Gauge */}
      <div className="bg-[#0B111E] border border-slate-800/90 rounded-md px-3.5 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-300">
          <Hourglass className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-400">Snapshot Cadence:</span>
          <span className="font-bold text-amber-300">
            {eventsInCycle + ' / 100 Events'}
          </span>
          <span className="text-slate-500">
            ({(100 - eventsInCycle) + ' events to auto-compaction'})
          </span>
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-xs min-w-[140px]">
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-amber-400 h-full transition-all duration-300 rounded-full"
              style={{ width: progressPercent + '%' }}
            />
          </div>
          <span className="text-slate-400 text-xs shrink-0">{progressPercent + '%'}</span>
        </div>

        <div className="text-slate-400">
          Total Snapshots Stored: <strong className="text-slate-200">{telemetry.total_snapshots}</strong>
        </div>
      </div>
    </div>
  );
};
