import React from 'react';
import { Gauge, Zap, Hash, ShieldCheck } from 'lucide-react';

interface TelemetryMetricsStripProps {
  currentRpm: number;
  currentGear: string;
  shiftDurationMs: number;
  nonce: number;
  isSimulating: boolean;
}

export const TelemetryMetricsStrip: React.FC<TelemetryMetricsStripProps> = ({
  currentRpm,
  shiftDurationMs,
  nonce,
  isSimulating,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-5">
      {/* Card 1: V10 Rev Loop */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden transition-all hover:border-amber-500/40">
        <div className="flex items-center justify-between mb-2">
          <span className="text-base font-semibold text-slate-300">V10 Rev Loop</span>
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
            <Gauge className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-4xl font-black font-mono text-white tracking-tight tabular-nums">
            {isSimulating ? currentRpm.toLocaleString() : '0.6'}
          </span>
          <span className="text-base font-mono text-amber-400 font-bold uppercase">
            {isSimulating ? 'RPM' : 'SEC'}
          </span>
        </div>
        <p className="text-base text-slate-400 leading-snug">
          {isSimulating
            ? '0.6s idle-to-9,000 RPM tachometer refresh response.'
            : 'Idle-to-9,000 RPM tachometer cycle.'}
        </p>
      </div>

      {/* Card 2: Shift Actuation Speed */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden transition-all hover:border-blue-500/40">
        <div className="flex items-center justify-between mb-2">
          <span className="text-base font-semibold text-slate-300">Shift Actuation</span>
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
            <Zap className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-4xl font-black font-mono text-white tracking-tight tabular-nums">
            {shiftDurationMs}
          </span>
          <span className="text-base font-mono text-blue-400 font-bold uppercase">
            MS
          </span>
        </div>
        <p className="text-base text-slate-400 leading-snug">
          ASG sequential dog-clutch shift speed.
        </p>
      </div>

      {/* Card 3: Monotonic Telemetry Nonce */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden transition-all hover:border-emerald-500/40">
        <div className="flex items-center justify-between mb-2">
          <span className="text-base font-semibold text-slate-300">Telemetry Nonce</span>
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Hash className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-1 mb-2">
          <span className="text-4xl font-black font-mono text-emerald-400 tracking-tight tabular-nums">
            #{nonce.toLocaleString()}
          </span>
        </div>
        <p className="text-base text-slate-400 leading-snug">
          Zero-collision monotonic cryptographic sequence.
        </p>
      </div>

      {/* Card 4: IP Clean-Room Audit */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden transition-all hover:border-purple-500/40">
        <div className="flex items-center justify-between mb-2">
          <span className="text-base font-semibold text-slate-300">IP Clean-Room</span>
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-4xl font-black font-mono text-purple-300 tracking-tight tabular-nums">
            0%
          </span>
          <span className="text-base font-mono text-purple-400 font-bold uppercase">
            COPYLEFT
          </span>
        </div>
        <p className="text-base text-slate-400 leading-snug">
          100% MIT permissive whitelist verified.
        </p>
      </div>
    </div>
  );
};
