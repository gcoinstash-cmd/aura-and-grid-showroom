import React from 'react';
import { Activity, Volume2, ShieldCheck, Hash } from 'lucide-react';

interface TelemetryStripProps {
  harmonicFrequencyHz: number;
  suppressionDeltaDb: number;
  currentNonce: number;
  isSimulating: boolean;
  roofState: 'STOWED' | 'CLOSED';
}

export const TelemetryStrip: React.FC<TelemetryStripProps> = ({
  harmonicFrequencyHz,
  suppressionDeltaDb,
  currentNonce,
  isSimulating,
  roofState,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Card 1: Cowl Damper Frequency */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden transition-all hover:border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-base font-semibold text-slate-300 flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-400" />
            Cowl Damper Frequency
          </span>
          <span className="text-base font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
            2,400 Hz Loop
          </span>
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-4xl font-black text-white font-mono tracking-tight">
            {harmonicFrequencyHz.toFixed(1)}
          </span>
          <span className="text-xl font-bold text-slate-400">Hz</span>
        </div>
        <div className="text-base text-slate-400 flex items-center justify-between">
          <span>Active micro-deflection</span>
          <span className="text-emerald-400 font-semibold">Torsion Damped</span>
        </div>
        {isSimulating && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500 animate-pulse" />
        )}
      </div>

      {/* Card 2: Cabin Acoustic Index */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden transition-all hover:border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-base font-semibold text-slate-300 flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-cyan-400" />
            Cabin Acoustic Index
          </span>
          <span className="text-base font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
            {roofState === 'STOWED' ? 'Top Open' : 'Top Closed'}
          </span>
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-4xl font-black text-cyan-400 font-mono tracking-tight">
            -{suppressionDeltaDb.toFixed(1)}
          </span>
          <span className="text-xl font-bold text-slate-400">dB</span>
        </div>
        <div className="text-base text-slate-400 flex items-center justify-between">
          <span>Open-Top Turbulence</span>
          <span className="text-cyan-300 font-semibold">Active Suppression</span>
        </div>
        {isSimulating && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-cyan-500 animate-pulse" />
        )}
      </div>

      {/* Card 3: Monotonic Telemetry Nonce */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden transition-all hover:border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-base font-semibold text-slate-300 flex items-center gap-2">
            <Hash className="w-5 h-5 text-indigo-400" />
            Monotonic Nonce
          </span>
          <span className="text-base font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
            0 Collision
          </span>
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-4xl font-black text-white font-mono tracking-tight">
            #{currentNonce.toLocaleString()}
          </span>
        </div>
        <div className="text-base text-slate-400 flex items-center justify-between">
          <span>HMAC Sequence</span>
          <span className="text-indigo-300 font-semibold">Strict Monotonic</span>
        </div>
        {isSimulating && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 animate-pulse" />
        )}
      </div>

      {/* Card 4: IP Clean-Room Audit */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden transition-all hover:border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-base font-semibold text-slate-300 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            IP Clean-Room Audit
          </span>
          <span className="text-base font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
            100% Pass
          </span>
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-4xl font-black text-emerald-400 font-mono tracking-tight">
            0%
          </span>
          <span className="text-xl font-bold text-slate-400">Copyleft</span>
        </div>
        <div className="text-base text-slate-400 flex items-center justify-between">
          <span>License Provenance</span>
          <span className="text-emerald-300 font-semibold">Clean-Room Certified</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500/50" />
      </div>
    </div>
  );
};
