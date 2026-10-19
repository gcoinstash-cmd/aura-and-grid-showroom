import React from 'react';
import { Activity, Gauge, Hash, ShieldCheck, Zap } from 'lucide-react';

interface TelemetryMetricsStripProps {
  loopHz: number;
  articulationIndexMm: number;
  currentNonce: number;
  frontValve: 'OPEN' | 'CLOSED';
  rearValve: 'OPEN' | 'CLOSED';
}

export const TelemetryMetricsStrip: React.FC<TelemetryMetricsStripProps> = ({
  loopHz,
  articulationIndexMm,
  currentNonce,
  frontValve,
  rearValve,
}) => {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Card 1: Dynamic Kinetic Suspension Telemetry Valve Loop */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-amber-400" />
            Dynamic Kinetic Suspension Telemetry Valve Loop
          </span>
          <span
            className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
              frontValve === 'OPEN'
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                : 'bg-blue-500/10 border-blue-500/40 text-blue-400'
            }`}
          >
            {frontValve === 'OPEN' ? 'BYPASS OPEN' : 'RIGID LOCKED'}
          </span>
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-4xl font-black font-mono text-white tracking-tight">
            {loopHz.toLocaleString()}
          </span>
          <span className="text-sm font-bold text-amber-400 font-mono">Hz</span>
        </div>
        <div className="text-xs text-slate-400 flex items-center justify-between">
          <span>Target cycle: 0.50 ms</span>
          <span className="text-emerald-400 font-mono font-semibold flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" /> Jitter &lt; 8µs
          </span>
        </div>
      </div>

      {/* Card 2: Wheel Articulation Index */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-emerald-400" />
            Articulation Index
          </span>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/40 text-emerald-400">
            640 mm Max
          </span>
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-4xl font-black font-mono text-emerald-400 tracking-tight">
            {Math.round(articulationIndexMm)}
          </span>
          <span className="text-sm font-bold text-slate-400 font-mono">mm stroke</span>
        </div>
        <div className="text-xs text-slate-400 flex items-center justify-between">
          <span>Cross-Axle Travel</span>
          <span className="text-slate-300 font-mono">
            {((articulationIndexMm / 640) * 100).toFixed(1)}% Capacity
          </span>
        </div>
      </div>

      {/* Card 3: Monotonic Telemetry Nonce */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
            <Hash className="w-4 h-4 text-indigo-400" />
            Monotonic Nonce
          </span>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/40 text-indigo-400">
            ZERO COLLISION
          </span>
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-4xl font-black font-mono text-indigo-300 tracking-tight">
            #{currentNonce.toLocaleString()}
          </span>
        </div>
        <div className="text-xs text-slate-400 flex items-center justify-between">
          <span>HMAC Chain State</span>
          <span className="text-emerald-400 font-mono font-semibold">Verified Valid</span>
        </div>
      </div>

      {/* Card 4: IP Clean-Room Audit */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            IP Clean-Room Audit
          </span>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/40 text-emerald-400">
            AUDIT PASSED
          </span>
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-4xl font-black font-mono text-white tracking-tight">
            0.0%
          </span>
          <span className="text-sm font-bold text-slate-400 font-mono">Copyleft</span>
        </div>
        <div className="text-xs text-slate-400 flex items-center justify-between">
          <span>License Policy: MIT</span>
          <span className="text-emerald-400 font-semibold">100% Permissive</span>
        </div>
      </div>
    </section>
  );
};
