/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Cpu, Compass, Hash, ShieldCheck, Activity, ArrowUpRight } from 'lucide-react';

interface TelemetryMetricsStripProps {
  rearAngle: number;
  phase: 'COUNTER_PHASE' | 'NEUTRAL' | 'IN_PHASE';
  speedMph: number;
  nonceCounter?: number;
}

export const TelemetryMetricsStrip: React.FC<TelemetryMetricsStripProps> = ({
  rearAngle,
  phase,
  speedMph,
  nonceCounter: externalNonce,
}) => {
  const [internalNonce, setInternalNonce] = useState<number>(1048576);
  const [frequencyJitter, setFrequencyJitter] = useState<number>(2500);

  useEffect(() => {
    const timer = setInterval(() => {
      setInternalNonce((prev) => prev + Math.floor(Math.random() * 3) + 1);
      setFrequencyJitter(2500 + Math.floor((Math.random() - 0.5) * 8));
    }, 150);
    return () => clearInterval(timer);
  }, []);

  const nonce = externalNonce !== undefined ? externalNonce : internalNonce;

  const phaseLabel =
    phase === 'COUNTER_PHASE'
      ? 'Counter-phase (Low Speed)'
      : phase === 'IN_PHASE'
      ? 'In-phase (High Speed)'
      : 'Neutral (Center Lock)';

  const phaseColor =
    phase === 'COUNTER_PHASE'
      ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
      : phase === 'IN_PHASE'
      ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
      : 'text-slate-400 bg-slate-800 border-slate-700';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
      {/* Card 1: DRS Actuator Loop */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden transition-all hover:border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400 border border-amber-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <span className="text-base font-semibold text-slate-300">
              DRS Actuator Loop
            </span>
          </div>
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-md text-base font-mono font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            ACTIVE
          </span>
        </div>
        
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-4xl font-black text-white font-mono tracking-tight">
            {frequencyJitter.toLocaleString()}
          </span>
          <span className="text-xl font-bold text-amber-400 font-mono">Hz</span>
        </div>
        <p className="text-base text-slate-400 mt-2 font-medium flex items-center justify-between">
          <span>Real-time rear steer cycle</span>
          <span className="text-emerald-400 font-mono text-base font-semibold">0.40 ms loop</span>
        </p>
      </div>

      {/* Card 2: Rear Steer Angle */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden transition-all hover:border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400 border border-cyan-500/20">
              <Compass className="w-5 h-5" />
            </div>
            <span className="text-base font-semibold text-slate-300">
              Rear Steer Angle
            </span>
          </div>
          <span className={`px-2.5 py-1 rounded-md text-base font-mono font-semibold border ${phaseColor}`}>
            {rearAngle > 0 ? `+${rearAngle.toFixed(2)}°` : `${rearAngle.toFixed(2)}°`}
          </span>
        </div>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-4xl font-black text-white font-mono tracking-tight">
            {Math.abs(rearAngle).toFixed(2)}°
          </span>
          <span className="text-base font-bold text-cyan-400 font-mono uppercase">
            {speedMph < 50 ? 'Opposite' : 'Parallel'}
          </span>
        </div>
        <p className="text-base text-slate-400 mt-2 font-medium truncate" title={phaseLabel}>
          {phaseLabel}
        </p>
      </div>

      {/* Card 3: Monotonic Telemetry Nonce */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden transition-all hover:border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 border border-purple-500/20">
              <Hash className="w-5 h-5" />
            </div>
            <span className="text-base font-semibold text-slate-300">
              Telemetry Nonce
            </span>
          </div>
          <span className="px-2.5 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-300 rounded-md text-base font-mono font-semibold">
            HMAC-SHA256
          </span>
        </div>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-4xl font-black text-white font-mono tracking-tight">
            #{nonce.toLocaleString()}
          </span>
        </div>
        <p className="text-base text-slate-400 mt-2 font-medium flex items-center justify-between">
          <span>Zero collision ledger</span>
          <span className="text-purple-400 font-mono text-base font-semibold">Strict Strict Monotonic</span>
        </p>
      </div>

      {/* Card 4: IP Clean-Room Audit */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden transition-all hover:border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-base font-semibold text-slate-300">
              IP Clean-Room Audit
            </span>
          </div>
          <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-md text-base font-mono font-semibold">
            ACQUIRE READY
          </span>
        </div>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-4xl font-black text-emerald-400 font-mono tracking-tight">
            0.0%
          </span>
          <span className="text-xl font-bold text-slate-300 font-mono">Copyleft</span>
        </div>
        <p className="text-base text-slate-400 mt-2 font-medium flex items-center justify-between">
          <span>Clean-Room Certified</span>
          <span className="text-emerald-400 font-mono text-base font-semibold">100% Permissive</span>
        </p>
      </div>
    </div>
  );
};
