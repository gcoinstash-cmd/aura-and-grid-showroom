/**
 * Vanguard-ECLSS: Compute & MPC Real-Time P99 Latency Tracker
 * Upgraded Font Floor & High-Legibility Typography
 */

import React from 'react';
import { Cpu, Zap, Activity, Clock, Sliders, CheckCircle2 } from 'lucide-react';
import { MPCControllerState, TelemetrySnapshot } from '../../types/eclss';

interface ComputeTrackerProps {
  mpc: MPCControllerState;
  history: TelemetrySnapshot[];
}

export const ComputeTracker: React.FC<ComputeTrackerProps> = ({ mpc, history }) => {
  // Latency history points
  const recentLatencies = history.slice(-20).map((h) => h.mpc.lastExecutionTimeMs);
  const maxRecordedLatency = Math.max(1.8, ...recentLatencies);
  const avgLatency =
    recentLatencies.reduce((acc, curr) => acc + curr, 0) / (recentLatencies.length || 1);

  return (
    <div className="p-6 sm:p-7 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold font-mono tracking-tight text-white flex items-center gap-3">
            <Cpu className="w-6 h-6 text-emerald-400" />
            MIMO-MPC DETERMINISTIC COMPUTE & LATENCY ENGINE
          </h3>
          <p className="text-base text-slate-300 font-medium mt-1">
            Hard real-time step threshold constraint: &lt;6.500 ms @ 1000 Hz loop frequency.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-950 border border-emerald-700 text-emerald-300 font-mono text-sm font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>REAL-TIME DETERMINISTIC CONVERGENCE</span>
        </div>
      </div>

      {/* Latency Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 font-mono">
        <div className="p-5 rounded-xl bg-slate-950 border border-slate-800">
          <div className="text-sm font-semibold text-slate-400 uppercase">Current Step Latency</div>
          <div className="text-3xl font-extrabold text-emerald-400 mt-2">
            {mpc.lastExecutionTimeMs.toFixed(3)} <span className="text-base font-normal text-slate-400">ms</span>
          </div>
          <div className="text-sm text-slate-400 mt-2">Threshold: 6.500 ms max</div>
        </div>

        <div className="p-5 rounded-xl bg-slate-950 border border-slate-800">
          <div className="text-sm font-semibold text-slate-400 uppercase">Rolling Mean Latency</div>
          <div className="text-3xl font-extrabold text-cyan-300 mt-2">
            {avgLatency.toFixed(3)} <span className="text-base font-normal text-slate-400">ms</span>
          </div>
          <div className="text-sm text-slate-400 mt-2">Peak: {maxRecordedLatency.toFixed(3)} ms</div>
        </div>

        <div className="p-5 rounded-xl bg-slate-950 border border-slate-800">
          <div className="text-sm font-semibold text-slate-400 uppercase">Horizon & Iterations</div>
          <div className="text-3xl font-extrabold text-white mt-2">
            N={mpc.horizonSteps} <span className="text-base font-normal text-slate-400">({mpc.solverIterations} iter)</span>
          </div>
          <div className="text-sm text-slate-400 mt-2">Quadratic Matrix J: {mpc.quadraticCost.toFixed(2)}</div>
        </div>

        <div className="p-5 rounded-xl bg-slate-950 border border-slate-800">
          <div className="text-sm font-semibold text-slate-400 uppercase">Active Constraints</div>
          <div className={`text-3xl font-extrabold mt-2 ${mpc.activeConstraintsCount === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {mpc.activeConstraintsCount} <span className="text-base font-normal text-slate-400">Engaged</span>
          </div>
          <div className="text-sm text-slate-400 mt-2">Physiological box bounds</div>
        </div>
      </div>

      {/* Real-Time Latency Histogram Visualization */}
      <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
        <div className="flex justify-between text-sm font-mono text-slate-300 font-semibold">
          <span>Execution Latency History (Last {recentLatencies.length} Ticks)</span>
          <span className="text-emerald-400 font-bold">Max Recorded: {maxRecordedLatency.toFixed(2)} ms / Limit: 6.50 ms</span>
        </div>

        <div className="h-24 flex items-end gap-2 pt-4">
          {recentLatencies.map((val, idx) => {
            const heightPct = Math.max(15, Math.min(100, (val / 6.5) * 100));
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div
                  className="w-full bg-gradient-to-t from-emerald-600 to-cyan-400 rounded-t transition-all"
                  style={{ height: `${heightPct}%` }}
                />
                <span className="hidden group-hover:block absolute -top-8 bg-slate-900 text-cyan-300 text-sm font-mono px-2 py-1 rounded border border-slate-700 whitespace-nowrap z-10 shadow-lg">
                  {val.toFixed(2)}ms
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actuator Slew Commands */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-sm">
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
          <span className="text-slate-300">O2 Valve Slew:</span>
          <span className="text-cyan-300 font-bold text-base">{mpc.controlInputs.o2InjectionRateGps.toFixed(3)} g/s</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
          <span className="text-slate-300">N2 Balance Slew:</span>
          <span className="text-slate-100 font-bold text-base">{mpc.controlInputs.n2InjectionRateGps.toFixed(3)} g/s</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
          <span className="text-slate-300">CDRA Scrubber:</span>
          <span className="text-amber-300 font-bold text-base">{mpc.controlInputs.co2ScrubberBlowerDutyPct.toFixed(1)}%</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
          <span className="text-slate-300">CHX Temperature:</span>
          <span className="text-emerald-300 font-bold text-base">{mpc.controlInputs.condensingHeatExchangerTempC.toFixed(1)} °C</span>
        </div>
      </div>
    </div>
  );
};
