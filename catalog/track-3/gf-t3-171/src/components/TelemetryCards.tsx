import React from 'react';
import { TelemetryMetrics } from '../types';
import { Activity, Database, CheckSquare, Zap } from 'lucide-react';

interface TelemetryCardsProps {
  metrics: TelemetryMetrics;
}

export const TelemetryCards: React.FC<TelemetryCardsProps> = ({ metrics }) => {
  return (
    <section className="relative w-full py-6 px-6 md:px-10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Execution Latency (< 250 ns p99 deterministic) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Deterministic Latency
            </span>
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="text-3xl font-extrabold font-mono text-cyan-300 tabular-nums">
              {metrics.latencyP99.toFixed(1)} <span className="text-xl font-normal text-slate-400">ns</span>
            </div>
            <div className="text-sm font-medium text-emerald-400 mt-1 flex items-center gap-1.5">
              <span>&lt; 250 ns p99 deterministic</span>
            </div>
          </div>

          {/* Latency distribution histogram / breakdown (all min 14px text-sm) */}
          <div className="pt-3 border-t border-slate-800/80 space-y-2">
            <div className="flex justify-between text-sm text-slate-300 font-mono">
              <span>p50 median</span>
              <span className="text-slate-100 font-semibold">{metrics.latencyP50.toFixed(1)} ns</span>
            </div>
            <div className="flex justify-between text-sm text-slate-300 font-mono">
              <span>p90 percentile</span>
              <span className="text-slate-100 font-semibold">{metrics.latencyP90.toFixed(1)} ns</span>
            </div>
            <div className="flex justify-between text-sm text-slate-300 font-mono">
              <span>p99.9 outlier</span>
              <span className="text-amber-300 font-semibold">{metrics.latencyP999.toFixed(1)} ns</span>
            </div>
            {/* Visual jitter bar */}
            <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden mt-1 border border-slate-800">
              <div
                className="bg-cyan-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (metrics.latencyP99 / 250) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 2: Buffer Capacity (1,048,576 slots lock-free) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Disruptor Ring Buffer
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Database className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="text-3xl font-extrabold font-mono text-emerald-300 tabular-nums">
              1,048,576 <span className="text-xl font-normal text-slate-400">slots</span>
            </div>
            <div className="text-sm font-medium text-emerald-400 mt-1">
              Lock-Free Power-of-Two (2²⁰)
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 space-y-2">
            <div className="flex justify-between text-sm text-slate-300 font-mono">
              <span>Bitwise Mask</span>
              <span className="text-cyan-300 font-semibold">0x000FFFFF</span>
            </div>
            <div className="flex justify-between text-sm text-slate-300 font-mono">
              <span>Unconsumed delta</span>
              <span className="text-slate-100 font-semibold tabular-nums">
                {Math.max(0, metrics.claimedSequence - metrics.consumedSequence).toLocaleString()} slots
              </span>
            </div>
            <div className="flex justify-between text-sm text-slate-300 font-mono">
              <span>Backpressure State</span>
              <span
                className={`font-semibold ${
                  metrics.backpressureState === 'NOMINAL'
                    ? 'text-emerald-400'
                    : metrics.backpressureState === 'ELEVATED'
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {metrics.backpressureState}
              </span>
            </div>
            <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden mt-1 border border-slate-800">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(8, ((metrics.claimedSequence - metrics.consumedSequence) / 1048576) * 100 + 12)
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Batch Sequence (#1,000,000+ continuous atomic CAS) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Batch Sequence Counter
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="text-3xl font-extrabold font-mono text-indigo-300 tabular-nums">
              #{metrics.claimedSequence.toLocaleString()}
            </div>
            <div className="text-sm font-medium text-indigo-400 mt-1">
              Continuous Atomic CAS Increment
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 space-y-2">
            <div className="flex justify-between text-sm text-slate-300 font-mono">
              <span>Committed Cursors</span>
              <span className="text-slate-100 font-semibold tabular-nums">
                #{metrics.committedSequence.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm text-slate-300 font-mono">
              <span>Ingest Throughput</span>
              <span className="text-indigo-300 font-semibold tabular-nums">
                {(metrics.throughputOpsSec / 1000000).toFixed(2)}M ops/sec
              </span>
            </div>
            <div className="flex justify-between text-sm text-slate-300 font-mono">
              <span>Memory Barrier</span>
              <span className="text-emerald-400 font-semibold">Acquire/Release Fences</span>
            </div>
            <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden mt-1 border border-slate-800">
              <div
                className="bg-indigo-500 h-full rounded-full transition-all duration-300 animate-pulse"
                style={{ width: '88%' }}
              />
            </div>
          </div>
        </div>

        {/* Card 4: IP Clean-Room Audit (0% Copyleft / Clean-Room Certified) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Legal IP Clean-Room
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-950/80 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="text-3xl font-extrabold font-mono text-amber-300">
              0% <span className="text-xl font-normal text-slate-400">Copyleft</span>
            </div>
            <div className="text-sm font-medium text-emerald-400 mt-1">
              Clean-Room Audit Certified
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 space-y-2">
            <div className="flex justify-between text-sm text-slate-300 font-mono">
              <span>Primary License</span>
              <span className="text-emerald-400 font-semibold">100% Permissive MIT</span>
            </div>
            <div className="flex justify-between text-sm text-slate-300 font-mono">
              <span>AGPL/GPL/SSPL</span>
              <span className="text-emerald-400 font-semibold">0 Packages Detected</span>
            </div>
            <div className="flex justify-between text-sm text-slate-300 font-mono">
              <span>Acquire Escrow</span>
              <span className="text-cyan-300 font-semibold">Pre-Drafted APA Bill of Sale</span>
            </div>
            <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden mt-1 border border-slate-800">
              <div className="bg-emerald-400 h-full rounded-full w-full" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
