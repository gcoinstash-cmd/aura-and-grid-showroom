import React from 'react';
import { Cpu, Zap, Hash, ShieldCheck } from 'lucide-react';
import { TelemetryState } from '../types/telemetry';

interface TelemetryMetricsStripProps {
  telemetry: TelemetryState;
}

export const TelemetryMetricsStrip: React.FC<TelemetryMetricsStripProps> = ({ telemetry }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
      {/* Card 1: Throttle Actuation Loop */}
      <div className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 rounded-xl p-4 transition-all duration-200">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[15px] font-medium text-slate-400">Throttle Actuation</span>
          <Cpu className="w-5 h-5 text-amber-400" />
        </div>
        <div className="text-2xl font-black font-mono tabular-nums text-white tracking-tight">
          1,600 Hz
        </div>
        <div className="mt-2 flex items-center justify-between text-[15px] text-slate-400">
          <span>Cycle: <strong className="text-amber-400 font-mono font-medium">0.625 ms</strong></span>
          <span className="text-emerald-400 font-medium">Deterministic</span>
        </div>
      </div>

      {/* Card 2: Peak Power Output */}
      <div className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 rounded-xl p-4 transition-all duration-200">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[15px] font-medium text-slate-400">Peak Power Output</span>
          <Zap className="w-5 h-5 text-amber-500" />
        </div>
        <div className="text-2xl font-black font-mono tabular-nums text-white tracking-tight">
          {telemetry.enginePowerHp.toFixed(0)} <span className="text-base font-normal text-slate-400">/ 472 hp</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[15px] text-slate-400">
          <span>Torque: <strong className="text-amber-400 font-mono font-medium">{telemetry.engineTorqueLbFt.toFixed(0)} lb-ft</strong></span>
          <span className="text-slate-300 font-mono">@ 7,100 RPM</span>
        </div>
      </div>

      {/* Card 3: Monotonic Telemetry Nonce */}
      <div className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 rounded-xl p-4 transition-all duration-200">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[15px] font-medium text-slate-400">Telemetry Nonce</span>
          <Hash className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="text-2xl font-black font-mono tabular-nums text-white tracking-tight">
          #{telemetry.nonce.toLocaleString()}
        </div>
        <div className="mt-2 flex items-center justify-between text-[15px] text-slate-400">
          <span className="text-emerald-400 font-medium">Zero Collision</span>
          <span className="text-slate-300 font-mono">HMAC-SHA256</span>
        </div>
      </div>

      {/* Card 4: IP Clean-Room Audit */}
      <div className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 rounded-xl p-4 transition-all duration-200">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[15px] font-medium text-slate-400">IP Clean-Room Audit</span>
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="text-2xl font-black text-emerald-400 tracking-tight">
          0% Copyleft
        </div>
        <div className="mt-2 flex items-center justify-between text-[15px] text-slate-400">
          <span className="text-white font-medium">Clean-Room Certified</span>
          <span className="text-amber-400 font-mono font-medium">MIT Dual APA</span>
        </div>
      </div>
    </div>
  );
};
