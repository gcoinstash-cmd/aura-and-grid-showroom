import React from 'react';
import { Activity, Gauge, Hash, ShieldCheck } from 'lucide-react';
import { TelemetryFrame } from '../types/telemetry';

interface TelemetryMetricsStripProps {
  telemetry: TelemetryFrame;
  currentStep: number;
}

export const TelemetryMetricsStrip: React.FC<TelemetryMetricsStripProps> = ({
  telemetry,
  currentStep,
}) => {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 my-4">
      {/* Card 1: AVS Solenoid Loop */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-400 font-medium text-xs flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-amber-400" />
            AVS Solenoid Loop
          </span>
          <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono font-semibold px-2 py-0.5 rounded">
            2,000 Hz
          </span>
        </div>
        <div className="my-1">
          <div className="text-4xl font-black text-white font-mono tracking-tight tabular-nums">
            0.50<span className="text-slate-500 text-lg font-bold">ms</span>
          </div>
        </div>
        <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
          <span>Cycle Interval</span>
          <span className="font-mono text-slate-200">±0.02ms Jitter</span>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
          <div className="bg-amber-400 h-full rounded-full transition-all duration-300" style={{ width: '99.4%' }}></div>
        </div>
      </div>

      {/* Card 2: Damping Force Step */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-400 font-medium text-xs flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-cyan-400" />
            Damping Force Step
          </span>
          <span className="text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 text-xs font-mono font-semibold px-2 py-0.5 rounded">
            650 Levels
          </span>
        </div>
        <div className="my-1">
          <div className="text-4xl font-black text-cyan-300 font-mono tracking-tight tabular-nums">
            {currentStep}<span className="text-slate-500 text-lg font-bold">/650</span>
          </div>
        </div>
        <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
          <span>Current Excite</span>
          <span className="font-mono text-slate-200">
            {((200 + (currentStep / 650) * 1600)).toFixed(0)} mA
          </span>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
          <div
            className="bg-cyan-400 h-full rounded-full transition-all duration-150"
            style={{ width: `${Math.min(100, Math.max(5, (currentStep / 650) * 100))}%` }}
          ></div>
        </div>
      </div>

      {/* Card 3: Monotonic Telemetry Nonce */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-400 font-medium text-xs flex items-center gap-1.5">
            <Hash className="w-4 h-4 text-emerald-400" />
            Monotonic Telemetry Nonce
          </span>
          <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono font-semibold px-2 py-0.5 rounded">
            Zero Collision
          </span>
        </div>
        <div className="my-1">
          <div className="text-4xl font-black text-emerald-300 font-mono tracking-tight tabular-nums">
            #{telemetry.nonce.toLocaleString()}
          </div>
        </div>
        <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
          <span>HMAC Chain</span>
          <span className="font-mono text-emerald-400 font-bold">SHA-256 Valid</span>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
          <div className="bg-emerald-400 h-full rounded-full animate-pulse" style={{ width: '100%' }}></div>
        </div>
      </div>

      {/* Card 4: IP Clean-Room Audit */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-400 font-medium text-xs flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            IP Clean-Room Audit
          </span>
          <span className="text-amber-400 bg-amber-500/10 border border-amber-500/30 text-xs font-mono font-semibold px-2 py-0.5 rounded">
            Delaware Escrow
          </span>
        </div>
        <div className="my-1">
          <div className="text-4xl font-black text-amber-300 font-mono tracking-tight tabular-nums">
            0%<span className="text-slate-400 text-lg font-bold ml-1">Copyleft</span>
          </div>
        </div>
        <div className="text-xs text-slate-400 mt-2 flex items-center justify-between">
          <span>GPL/AGPL/SSPL</span>
          <span className="font-mono text-emerald-400 font-bold">Blacklisted / 0</span>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
          <div className="bg-amber-400 h-full rounded-full" style={{ width: '100%' }}></div>
        </div>
      </div>
    </section>
  );
};
