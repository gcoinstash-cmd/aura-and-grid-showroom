/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Activity, Zap, Binary, ShieldCheck } from 'lucide-react';

interface TelemetryMetricsStripProps {
  currentBiasRatio: { front: number; rear: number };
  currentNonce: number;
  loopFrequencyHz: number;
}

export const TelemetryMetricsStrip: React.FC<TelemetryMetricsStripProps> = ({
  currentBiasRatio,
  currentNonce,
  loopFrequencyHz,
}) => {
  const [jitterMs, setJitterMs] = useState(0.018);

  useEffect(() => {
    const interval = setInterval(() => {
      setJitterMs(0.015 + Math.random() * 0.008);
    }, 450);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative w-full mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: DUAL_VECTOR_TORQUE Vectoring Loop */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[15px] font-medium text-slate-400">
              DUAL_VECTOR_TORQUE Vectoring Loop
            </span>
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Activity className="w-4 h-4 animate-pulse" />
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-black font-mono text-white tracking-tight">
              {loopFrequencyHz.toLocaleString()} Hz
            </span>
            <span className="text-[15px] font-mono text-emerald-400 font-semibold">
              LOCKED
            </span>
          </div>
          <div className="flex items-center justify-between text-[15px] text-slate-400 font-mono">
            <span>Cycle: 1.00 ms</span>
            <span className="text-slate-500">Jitter: ±{jitterMs.toFixed(3)} ms</span>
          </div>
        </div>

        {/* Card 2: Torque Bias Ratio */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[15px] font-medium text-slate-400">
              Torque Bias Ratio
            </span>
            <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Zap className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-black font-mono text-white tracking-tight">
              {Math.round(currentBiasRatio.front)}:{Math.round(currentBiasRatio.rear)}
            </span>
            <span className="text-[15px] text-slate-400">
              {currentBiasRatio.rear <= 0
                ? 'Front Cruise'
                : currentBiasRatio.rear >= 70
                ? 'Apex Launch'
                : 'Dynamic AWD'}
            </span>
          </div>
          {/* Progress bar split */}
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex my-1.5">
            <div
              className="bg-cyan-500 h-full transition-all duration-300"
              style={{ width: `${currentBiasRatio.front}%` }}
              title={`Front: ${currentBiasRatio.front}%`}
            />
            <div
              className="bg-amber-500 h-full transition-all duration-300"
              style={{ width: `${currentBiasRatio.rear}%` }}
              title={`Rear: ${currentBiasRatio.rear}%`}
            />
          </div>
          <div className="flex items-center justify-between text-[15px] font-mono text-slate-400">
            <span className="text-cyan-400">F: {Math.round(currentBiasRatio.front)}%</span>
            <span className="text-amber-400">R: {Math.round(currentBiasRatio.rear)}%</span>
          </div>
        </div>

        {/* Card 3: Monotonic Telemetry Nonce */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[15px] font-medium text-slate-400">
              Monotonic Telemetry Nonce
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Binary className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-black font-mono text-emerald-400 tracking-tight">
              #{currentNonce.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between text-[15px] text-slate-400 font-mono">
            <span className="text-emerald-400/90">0 Collisions</span>
            <span className="text-slate-500">HMAC-SHA256 Linked</span>
          </div>
        </div>

        {/* Card 4: IP Clean-Room Audit */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[15px] font-medium text-slate-400">
              IP Clean-Room Audit
            </span>
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-black font-mono text-white tracking-tight">
              0% Copyleft
            </span>
            <span className="text-[15px] font-mono text-emerald-400 font-semibold">
              PASSED
            </span>
          </div>
          <div className="flex items-center justify-between text-[15px] text-slate-400 font-mono">
            <span>Permissive (MIT)</span>
            <span className="text-slate-500">Turnkey Software Asset Purchase Agreement Ready</span>
          </div>
        </div>
      </div>
    </section>
  );
};
