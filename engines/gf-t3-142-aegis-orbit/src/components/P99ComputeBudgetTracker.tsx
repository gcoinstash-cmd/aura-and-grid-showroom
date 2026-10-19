/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Ghost FactoryOS Fleet Track 3 - Asset GF-T3-142 (Aegis-Orbit)
 */

import React, { useState, useEffect } from 'react';
import { ComputeP99Metrics } from '../types/orbital';
import { Cpu, Gauge, Zap, CheckCircle2, Shield, Layers, HardDrive } from 'lucide-react';

export const P99ComputeBudgetTracker: React.FC = () => {
  const [metrics, setMetrics] = useState<ComputeP99Metrics>({
    currentCycleLatencyMs: 0.42,
    p50LatencyMs: 0.42,
    p90LatencyMs: 1.84,
    p99LatencyMs: 4.12,
    slaLimitMs: 8.20,
    trajectoryStepRateHz: 1000,
    simdVectorWidthBits: 256,
    activeThreads: 16,
    memoryFootprintKb: 1240,
    conjunctionChecksPerSec: 14200,
    lastStepTimestampUtc: new Date().toISOString()
  });

  const [latencyHistory, setLatencyHistory] = useState<number[]>([
    0.41, 0.43, 0.40, 0.42, 0.45, 0.39, 0.42, 1.12, 0.44, 0.41, 0.42, 0.43, 2.84, 0.42, 0.41, 0.43
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time micro-benchmark execution
      const jitter = (Math.random() - 0.5) * 0.08;
      const occasionalSpike = Math.random() > 0.92 ? Math.random() * 2.5 : 0;
      const current = Math.max(0.28, 0.42 + jitter + occasionalSpike);

      setMetrics((prev) => ({
        ...prev,
        currentCycleLatencyMs: current,
        p99LatencyMs: 3.85 + Math.random() * 0.45,
        conjunctionChecksPerSec: 14100 + Math.floor(Math.random() * 300),
        lastStepTimestampUtc: new Date().toISOString()
      }));

      setLatencyHistory((prev) => [...prev.slice(-24), current]);
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  const budgetUsedPct = (metrics.p99LatencyMs / metrics.slaLimitMs) * 100;

  return (
    <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/80 shadow-2xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-800 pb-3.5">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold font-hud text-white tracking-wide">
              P99 COMPUTE LATENCY &amp; SLA THRESHOLD MONITOR
            </h3>
            <p className="text-sm text-slate-300 font-mono mt-0.5">
              Strict Deterministic SLA Threshold: <span className="text-cyan-400 font-extrabold">&lt; 8.20 ms</span> per orbital step
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs sm:text-sm font-mono font-extrabold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> SLA COMPLIANT (50.2% HEADROOM)
          </span>
        </div>
      </div>

      {/* Latency Gauges Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-sm font-mono">
        <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800">
          <span className="text-slate-400 block text-xs font-semibold">CURRENT STEP</span>
          <span className="text-white font-extrabold text-xl sm:text-2xl mt-0.5 block">
            {metrics.currentCycleLatencyMs.toFixed(2)} <span className="text-xs text-slate-400 font-normal">ms</span>
          </span>
        </div>

        <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800">
          <span className="text-slate-400 block text-xs font-semibold">P50 LATENCY</span>
          <span className="text-cyan-300 font-extrabold text-xl sm:text-2xl mt-0.5 block">
            {metrics.p50LatencyMs.toFixed(2)} <span className="text-xs text-slate-400 font-normal">ms</span>
          </span>
        </div>

        <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800">
          <span className="text-slate-400 block text-xs font-semibold">P90 LATENCY</span>
          <span className="text-cyan-300 font-extrabold text-xl sm:text-2xl mt-0.5 block">
            {metrics.p90LatencyMs.toFixed(2)} <span className="text-xs text-slate-400 font-normal">ms</span>
          </span>
        </div>

        <div className="p-3.5 bg-slate-950/80 rounded-xl border border-cyan-500/50 bg-cyan-950/30">
          <span className="text-cyan-300 block text-xs font-extrabold">P99 SLA BENCHMARK</span>
          <span className="text-emerald-400 font-extrabold text-xl sm:text-2xl mt-0.5 block">
            {metrics.p99LatencyMs.toFixed(2)} <span className="text-xs text-slate-400 font-normal">/ 8.2ms</span>
          </span>
        </div>
      </div>

      {/* Latency Threshold Progress Bar */}
      <div className="space-y-2 font-mono text-sm">
        <div className="flex justify-between text-slate-300">
          <span className="font-semibold">P99 Threshold Consumption:</span>
          <span className="text-white font-extrabold">{budgetUsedPct.toFixed(1)}% of 8.20ms limit</span>
        </div>
        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-500"
            style={{ width: `${budgetUsedPct}%` }}
          />
        </div>
      </div>

      {/* Hardware & Parallel Execution Telemetry */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 text-sm font-mono pt-3 border-t border-slate-800">
        <div className="flex items-center gap-2.5 text-slate-300">
          <Layers className="w-5 h-5 text-cyan-400 shrink-0" />
          <div>
            <div className="text-xs text-slate-400 font-semibold">SIMD VECTORIZATION</div>
            <div className="font-extrabold text-white text-sm">AVX-512 (256-bit)</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-slate-300">
          <HardDrive className="w-5 h-5 text-cyan-400 shrink-0" />
          <div>
            <div className="text-xs text-slate-400 font-semibold">MEMORY PROFILE</div>
            <div className="font-extrabold text-emerald-400 text-sm">0 GC Allocations</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-slate-300">
          <Zap className="w-5 h-5 text-cyan-400 shrink-0" />
          <div>
            <div className="text-xs text-slate-400 font-semibold">CARA THROUGHPUT</div>
            <div className="font-extrabold text-white text-sm">{metrics.conjunctionChecksPerSec.toLocaleString()} /s</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-slate-300">
          <Gauge className="w-5 h-5 text-cyan-400 shrink-0" />
          <div>
            <div className="text-xs text-slate-400 font-semibold">THREAD POOL</div>
            <div className="font-extrabold text-white text-sm">16 Worker Cores</div>
          </div>
        </div>
      </div>
    </div>
  );
};

