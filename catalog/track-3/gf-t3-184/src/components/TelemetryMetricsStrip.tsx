import React from 'react';
import { Gauge, Timer, Hash, ShieldCheck, Flame } from 'lucide-react';
import { TelemetryState } from '../types/telemetry';

interface TelemetryMetricsStripProps {
  telemetry: TelemetryState;
}

export const TelemetryMetricsStrip: React.FC<TelemetryMetricsStripProps> = ({ telemetry }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {/* Card 1: Rev Response Rate */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4.5 transition-all hover:border-amber-500/40 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/10 transition-all"></div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-base font-semibold text-slate-300 flex items-center gap-2">
            <Gauge className="w-5 h-5 text-amber-400" />
            Rev Response Rate
          </span>
          <span className="text-sm font-mono font-bold px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
            0.60s Peak
          </span>
        </div>
        <div className="flex items-baseline gap-2 mb-1.5">
          <span className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight">
            {telemetry.rpm.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </span>
          <span className="text-base font-mono text-amber-400 font-bold">RPM</span>
        </div>
        <p className="text-base text-slate-400 leading-normal">
          Optical digital cluster pulse (0.6s idle-to-9,000 RPM tachometer telemetry).
        </p>
        <div className="mt-3.5 w-full bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-100 ${
              telemetry.rpm > 8500 ? 'bg-red-500' : 'bg-gradient-to-r from-amber-500 to-amber-300'
            }`}
            style={{ width: `${Math.min(100, (telemetry.rpm / 9000) * 100)}%` }}
          />
        </div>
      </div>

      {/* Card 2: Shift Actuation Speed */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4.5 transition-all hover:border-cyan-500/40 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-cyan-500/10 transition-all"></div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-base font-semibold text-slate-300 flex items-center gap-2">
            <Timer className="w-5 h-5 text-cyan-400" />
            Shift Actuation Speed
          </span>
          <span className="text-sm font-mono font-bold px-2.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
            {telemetry.isShifting ? 'SHIFTING' : 'LOCKED'}
          </span>
        </div>
        <div className="flex items-baseline gap-2 mb-1.5">
          <span className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight">
            {telemetry.asgShiftDurationMs.toFixed(0)}
          </span>
          <span className="text-base font-mono text-cyan-400 font-bold">ms</span>
        </div>
        <p className="text-base text-slate-400 leading-normal">
          150 ms electro-hydraulic ASG single-clutch dog actuator cycle.
        </p>
        <div className="mt-3.5 flex items-center gap-2">
          <span className="text-base font-mono text-slate-400">Gear:</span>
          <span className="text-base font-mono font-bold text-white px-2.5 py-0.5 bg-slate-800 rounded border border-slate-700">
            {telemetry.gear === 0 ? 'N' : `G${telemetry.gear}`}
          </span>
          <span className="text-base font-mono text-slate-400 ml-auto font-medium">
            {telemetry.asgHydraulicPressurePsi.toFixed(0)} PSI
          </span>
        </div>
      </div>

      {/* Card 3: Monotonic Telemetry Nonce */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4.5 transition-all hover:border-emerald-500/40 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/10 transition-all"></div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-base font-semibold text-slate-300 flex items-center gap-2">
            <Hash className="w-5 h-5 text-emerald-400" />
            Monotonic Nonce
          </span>
          <span className="text-sm font-mono font-bold px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            0 Collision
          </span>
        </div>
        <div className="flex items-baseline gap-2 mb-1.5">
          <span className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight">
            #{telemetry.telemetryNonce.toLocaleString()}
          </span>
        </div>
        <p className="text-base text-slate-400 leading-normal">
          Strict sequence telemetry nonce for Postgres 16 HMAC ledger chain.
        </p>
        <div className="mt-3.5 flex items-center gap-1.5 text-base font-mono text-slate-400 truncate">
          <span className="text-emerald-400 font-bold">HMAC:</span>
          <span className="truncate text-slate-400 text-base">
            {telemetry.hmacSignature.slice(0, 16)}...
          </span>
        </div>
      </div>

      {/* Card 4: IP Clean-Room Audit */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4.5 transition-all hover:border-purple-500/40 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-purple-500/10 transition-all"></div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-base font-semibold text-slate-300 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-400" />
            IP Clean-Room Audit
          </span>
          <span className="text-sm font-mono font-bold px-2.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
            Passed
          </span>
        </div>
        <div className="flex items-baseline gap-2 mb-1.5">
          <span className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight">
            0%
          </span>
          <span className="text-base font-mono text-purple-300 font-bold">Copyleft</span>
        </div>
        <p className="text-base text-slate-400 leading-normal">
          Clean-room institutional certification, MIT permissive, zero GPL/AGPL.
        </p>
        <div className="mt-3.5 flex items-center justify-between text-base font-mono text-slate-400">
          <span className="text-purple-300 flex items-center gap-1.5 font-medium">
            <Flame className="w-4 h-4 text-purple-400" />
            Monopoly Asset Transfer
          </span>
          <span className="text-white font-bold">20 kHz (0.48ms)</span>
        </div>
      </div>
    </div>
  );
};
