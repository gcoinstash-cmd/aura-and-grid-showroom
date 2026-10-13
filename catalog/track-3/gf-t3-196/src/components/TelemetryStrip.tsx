import React from 'react';
import { Activity, Gauge, Hash, ShieldCheck, Zap } from 'lucide-react';
import { SbwState } from '../types/telemetry';

interface TelemetryStripProps {
  state: SbwState;
}

export const TelemetryStrip: React.FC<TelemetryStripProps> = ({ state }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Card 1: Steer-by-Wire Loop */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <span className="text-slate-400 text-base font-semibold uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-400 animate-pulse" />
            SBW Loop Frequency
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 text-base font-mono font-bold border border-amber-500/30">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            4,000 Hz
          </span>
        </div>
        <div className="my-2">
          <div className="text-4xl font-black text-white font-mono tracking-tight flex items-baseline gap-2">
            250 <span className="text-xl text-slate-400 font-bold font-sans">µs Cycle</span>
          </div>
        </div>
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-base">
          <span className="text-slate-400 font-medium">Dual CAN-FD Bus:</span>
          <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
            <Zap className="w-4 h-4 text-emerald-400" />
            {state.activeCanBus} Active (5 Mbps)
          </span>
        </div>
      </div>

      {/* Card 2: Lock-to-Lock Yoke Angle */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <span className="text-slate-400 text-base font-semibold uppercase tracking-wider flex items-center gap-2">
            <Gauge className="w-5 h-5 text-cyan-400" />
            One-Motion Grip
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded bg-cyan-500/10 text-cyan-300 text-base font-mono font-bold border border-cyan-500/30">
            ±150° Yoke
          </span>
        </div>
        <div className="my-2">
          <div className="text-4xl font-black text-white font-mono tracking-tight flex items-baseline gap-2">
            {state.yokeAngleDeg > 0 ? `+${state.yokeAngleDeg.toFixed(1)}` : state.yokeAngleDeg.toFixed(1)}°
            <span className="text-xl text-cyan-400 font-bold font-sans">
              (1:{state.steeringRatio.toFixed(1)})
            </span>
          </div>
        </div>
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-base">
          <span className="text-slate-400 font-medium">Road Rack Angle:</span>
          <span className="text-cyan-300 font-mono font-bold">
            {state.rackAngleDeg > 0 ? `+${state.rackAngleDeg.toFixed(1)}` : state.rackAngleDeg.toFixed(1)}°
          </span>
        </div>
      </div>

      {/* Card 3: Monotonic Telemetry Nonce */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <span className="text-slate-400 text-base font-semibold uppercase tracking-wider flex items-center gap-2">
            <Hash className="w-5 h-5 text-emerald-400" />
            Monotonic Nonce
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 text-base font-mono font-bold border border-emerald-500/30">
            Collision-Free
          </span>
        </div>
        <div className="my-2">
          <div className="text-4xl font-black text-emerald-400 font-mono tracking-tight">
            #{state.nonce.toLocaleString()}
          </div>
        </div>
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-base">
          <span className="text-slate-400 font-medium">HMAC-SHA256:</span>
          <span className="text-slate-300 font-mono text-base truncate max-w-[170px]" title={state.hmacSignature}>
            {state.hmacSignature.slice(0, 10)}...{state.hmacSignature.slice(-6)}
          </span>
        </div>
      </div>

      {/* Card 4: IP Clean-Room Audit */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <span className="text-slate-400 text-base font-semibold uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            IP Clean-Room Audit
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-300 text-base font-mono font-bold border border-indigo-500/30">
            0% Copyleft
          </span>
        </div>
        <div className="my-2">
          <div className="text-4xl font-black text-white font-mono tracking-tight flex items-baseline gap-2">
            100% <span className="text-xl text-emerald-400 font-bold font-sans">Permissive</span>
          </div>
        </div>
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-base">
          <span className="text-slate-400 font-medium">Vault Certification:</span>
          <span className="text-emerald-400 font-bold font-mono">
            DELAWARE-MICRO-APA
          </span>
        </div>
      </div>
    </div>
  );
};
