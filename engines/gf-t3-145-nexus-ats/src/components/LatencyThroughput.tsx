/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Ghost FactoryOS GF-T3-145 (Nexus-ATS)
 * P99 Latency & Sub-Millisecond Throughput HUD
 */

import React from 'react';
import { LatencyMetrics } from '../types/trading';
import { Zap, Cpu, Gauge, CheckCircle2, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';

interface LatencyThroughputProps {
  metrics: LatencyMetrics;
}

export const LatencyThroughput: React.FC<LatencyThroughputProps> = ({
  metrics
}) => {
  const isWithinSla = metrics.p99Us <= 850;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-2xl flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-cyan-400" />
          <h2 className="text-xl font-bold text-white tracking-wide">
            Sub-Millisecond Latency HUD <span className="text-slate-400 text-base font-medium">(Hardware Threshold)</span>
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase px-2.5 py-1 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-600/50 flex items-center gap-1.5">
            <Cpu className="w-4 h-4" /> Core Pin: IsolCPU #2
          </span>
          <span className="text-xs font-bold uppercase px-2.5 py-1 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-600/50 flex items-center gap-1">
            <ShieldCheck className="w-4 h-4" /> 0-Byte Hot Path
          </span>
        </div>
      </div>

      {/* Primary Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* P99 Latency (The Sovereign Metric) */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 col-span-2 md:col-span-1 border-l-4 border-l-cyan-500">
          <div className="text-xs font-bold uppercase text-slate-400">P99 Latency Threshold</div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`text-3xl font-black font-mono-numbers ${isWithinSla ? 'text-cyan-400' : 'text-rose-400'}`}>
              {metrics.p99Us}
            </span>
            <span className="text-base font-semibold text-slate-400">µs</span>
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1 font-medium">
            {isWithinSla ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> SLA Met (&lt;850µs)
              </span>
            ) : (
              <span className="text-rose-400 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Threshold Breach
              </span>
            )}
          </div>
        </div>

        {/* P50 Latency (Median) */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
          <div className="text-xs font-bold uppercase text-slate-400">P50 (Median)</div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-black text-emerald-400 font-mono-numbers">
              {metrics.p50Us}
            </span>
            <span className="text-base font-semibold text-slate-400">µs</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Min: <span className="text-slate-200 font-bold font-mono-numbers">{metrics.minUs} µs</span>
          </div>
        </div>

        {/* P90 Latency */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
          <div className="text-xs font-bold uppercase text-slate-400">P90 Quantile</div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-black text-blue-400 font-mono-numbers">
              {metrics.p90Us}
            </span>
            <span className="text-base font-semibold text-slate-400">µs</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Max Tail: <span className="text-amber-400 font-bold font-mono-numbers">{metrics.maxUs} µs</span>
          </div>
        </div>

        {/* Throughput TPS */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
          <div className="text-xs font-bold uppercase text-slate-400">Ingress Throughput</div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-black text-amber-400 font-mono-numbers">
              {metrics.throughputTps.toLocaleString()}
            </span>
            <span className="text-base font-semibold text-slate-400">TPS</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Total Orders: <span className="text-slate-200 font-bold font-mono-numbers">{metrics.totalOrdersProcessed.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Latency Quantile Distribution Histogram */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex-1 flex flex-col justify-between">
        <div className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
          <span>Latency Jitter Distribution (Sample Count: 2,000 Ring Slots)</span>
          <span className="text-xs font-mono-numbers text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
            Pre-Allocated Static Float64Array
          </span>
        </div>

        <div className="space-y-2">
          {metrics.histogram.map((bin) => (
            <div key={bin.bucketLabel} className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-300 font-mono-numbers">
                <span>{bin.bucketLabel}</span>
                <span>{bin.count} orders ({bin.percentage}%)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    bin.maxUs <= 100
                      ? 'bg-emerald-400'
                      : bin.maxUs <= 250
                      ? 'bg-teal-400'
                      : bin.maxUs <= 500
                      ? 'bg-blue-400'
                      : bin.maxUs <= 850
                      ? 'bg-amber-400'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.max(bin.percentage > 0 ? 3 : 0, bin.percentage)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-base">
          <span className="text-slate-400 font-medium">Hot-Path Heap Allocation:</span>
          <span className="text-emerald-400 font-extrabold font-mono-numbers text-lg">
            0 BYTES HEAP ALLOCATED (Lock-Free SPSC)
          </span>
        </div>
      </div>
    </div>
  );
};
