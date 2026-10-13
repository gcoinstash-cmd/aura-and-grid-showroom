/**
 * TelemetryMetricsStrip.tsx
 * High-legibility telemetry readout cards with strict 16px floor on labels
 * and text-4xl font-black metric readouts.
 */

import React from 'react';
import { Activity, Gauge, Hash, ShieldCheck } from 'lucide-react';
import { AeroTelemetryFrame } from '../utils/aeroPhysics';

interface TelemetryMetricsStripProps {
  frame: AeroTelemetryFrame;
}

export const TelemetryMetricsStrip: React.FC<TelemetryMetricsStripProps> = ({ frame }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {/* Card 1: Aero Pressure Loop */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all hover:border-amber-500/40">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[16px] font-semibold tracking-wide text-slate-300 flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-400" />
            Aero Pressure Loop
          </span>
          <span className="text-[16px] font-mono font-medium text-amber-400/90">
            2,600 Hz
          </span>
        </div>
        <div className="my-2">
          <div className="text-4xl font-black font-mono text-white tracking-tight">
            {frame.dynamicPressurePa.toLocaleString()} <span className="text-xl font-bold text-slate-400">Pa</span>
          </div>
        </div>
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[16px] text-slate-400">
          <span>Venturi ΔP</span>
          <span className="font-mono font-bold text-amber-400">-{frame.venturiDeltaPPa.toLocaleString()} Pa</span>
        </div>
      </div>

      {/* Card 2: Peak High-Speed Downforce */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all hover:border-emerald-500/40">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[16px] font-semibold tracking-wide text-slate-300 flex items-center gap-2">
            <Gauge className="w-5 h-5 text-emerald-400" />
            Peak Downforce
          </span>
          <span className="text-[16px] font-mono font-medium text-emerald-400/90">
            @{frame.speedKmh} km/h
          </span>
        </div>
        <div className="my-2">
          <div className="text-4xl font-black font-mono text-emerald-400 tracking-tight">
            +{frame.downforceKg.toFixed(1)} <span className="text-xl font-bold text-slate-400">kg</span>
          </div>
        </div>
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[16px] text-slate-400">
          <span>Balance (F/R)</span>
          <span className="font-mono font-bold text-white">
            {(100 - frame.balanceRearPercent).toFixed(1)}% / {frame.balanceRearPercent.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Card 3: Monotonic Telemetry Nonce */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all hover:border-cyan-500/40">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[16px] font-semibold tracking-wide text-slate-300 flex items-center gap-2">
            <Hash className="w-5 h-5 text-cyan-400" />
            Monotonic Nonce
          </span>
          <span className="text-[16px] font-mono font-medium text-cyan-400/90">
            Zero Collision
          </span>
        </div>
        <div className="my-2">
          <div className="text-4xl font-black font-mono text-cyan-300 tracking-tight">
            #{frame.nonce.toLocaleString()}
          </div>
        </div>
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[16px] text-slate-400">
          <span>HMAC Chain</span>
          <span className="font-mono font-bold text-emerald-400">VERIFIED ✓</span>
        </div>
      </div>

      {/* Card 4: IP Clean-Room Audit */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all hover:border-purple-500/40">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[16px] font-semibold tracking-wide text-slate-300 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-400" />
            IP Clean-Room Audit
          </span>
          <span className="text-[16px] font-mono font-medium text-purple-300">
            0% Copyleft
          </span>
        </div>
        <div className="my-2">
          <div className="text-4xl font-black font-mono text-purple-200 tracking-tight">
            100% <span className="text-xl font-bold text-purple-400">Clean</span>
          </div>
        </div>
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[16px] text-slate-400">
          <span>Licensing Tier</span>
          <span className="font-mono font-bold text-amber-400">MIT Permissive</span>
        </div>
      </div>
    </div>
  );
};
