import React from 'react';
import { Activity, ArrowUpDown, Hash, ShieldCheck, Zap } from 'lucide-react';
import { RideHeightMode } from '../types/cockpit';

interface TelemetryMetricsStripProps {
  currentMode: RideHeightMode;
  heightDeltaIn: number;
  nonce: number;
  isSimulating: boolean;
}

export const TelemetryMetricsStrip: React.FC<TelemetryMetricsStripProps> = ({
  currentMode,
  heightDeltaIn,
  nonce,
  isSimulating,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Card 1: AHC Suspension Loop */}
      <div className="relative bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg hover:border-amber-500/40 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[15px] font-semibold text-slate-300 flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-400" />
            AHC Suspension Loop
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[15px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            ACTIVE
          </span>
        </div>
        <div className="text-2xl font-black font-mono text-white tracking-tight mb-1">
          1,250 Hz
        </div>
        <div className="text-[15px] text-slate-400 flex items-center justify-between">
          <span>Real-time valve cycle</span>
          <span className="font-mono text-amber-400 text-[15px]">jitter &lt;0.02ms</span>
        </div>
      </div>

      {/* Card 2: Ride Height Adjustment */}
      <div className="relative bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg hover:border-sky-500/40 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[15px] font-semibold text-slate-300 flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-sky-400" />
            Ride Height Adjustment
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[15px] font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
            {currentMode}
          </span>
        </div>
        <div className="text-2xl font-black font-mono text-white tracking-tight mb-1 flex items-baseline gap-2">
          <span>{heightDeltaIn >= 0 ? `+${heightDeltaIn.toFixed(1)}` : heightDeltaIn.toFixed(1)} in</span>
          <span className="text-[15px] font-normal text-slate-400 font-mono">
            ({(heightDeltaIn * 25.4).toFixed(0)} mm)
          </span>
        </div>
        <div className="text-[15px] text-slate-400 flex items-center justify-between">
          <span>Span Range:</span>
          <span className="font-mono text-sky-400 text-[15px]">+2.8 in High2 / -1.2 in Low Exit</span>
        </div>
      </div>

      {/* Card 3: Monotonic Telemetry Nonce */}
      <div className="relative bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg hover:border-emerald-500/40 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[15px] font-semibold text-slate-300 flex items-center gap-2">
            <Hash className="w-4 h-4 text-emerald-400" />
            Monotonic Nonce
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[15px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            ZERO COLLISION
          </span>
        </div>
        <div className="text-2xl font-black font-mono text-white tracking-tight mb-1">
          #{nonce.toLocaleString()}
        </div>
        <div className="text-[15px] text-slate-400 flex items-center justify-between">
          <span>Replay Armor:</span>
          <span className="font-mono text-emerald-400 text-[15px]">HMAC-SHA256 Bound</span>
        </div>
      </div>

      {/* Card 4: IP Clean-Room Audit */}
      <div className="relative bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg hover:border-purple-500/40 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[15px] font-semibold text-slate-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            IP Clean-Room Audit
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[15px] font-mono font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
            100% AUDITED
          </span>
        </div>
        <div className="text-2xl font-black font-mono text-white tracking-tight mb-1">
          0% Copyleft
        </div>
        <div className="text-[15px] text-slate-400 flex items-center justify-between">
          <span>Title Status:</span>
          <span className="font-mono text-purple-300 text-[15px]">Delaware Escrow Ready</span>
        </div>
      </div>
    </div>
  );
};
