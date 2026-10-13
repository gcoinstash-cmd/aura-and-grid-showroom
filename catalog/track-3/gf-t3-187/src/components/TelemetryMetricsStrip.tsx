import React from 'react';

interface TelemetryMetricsStripProps {
  currentHz: number;
  pistonVelocityMs: number;
  swingAperturePct: number;
  thermalEfficiencyPct: number;
  monotonicNonce: number;
  activeRegime: string;
}

export const TelemetryMetricsStrip: React.FC<TelemetryMetricsStripProps> = ({
  currentHz,
  pistonVelocityMs,
  swingAperturePct,
  thermalEfficiencyPct,
  monotonicNonce,
  activeRegime,
}) => {
  return (
    <section
      aria-label="Live Telemetry Metrics Strip"
      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6"
    >
      {/* Card 1: Swing-Valve Damping Loop */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
        <div>
          <div className="text-xs font-mono font-semibold text-amber-400 mb-1">
            Swing-Valve Damping Loop
          </div>
          <div className="text-4xl font-black text-white font-mono tabular-nums tracking-tight my-1">
            {currentHz.toLocaleString()} Hz
          </div>
        </div>
        <div className="pt-3 mt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300 font-mono tabular-nums">
          <span>Stroke: {pistonVelocityMs.toFixed(4)} m/s</span>
          <span className="text-amber-400 font-semibold">
            Bypass: {swingAperturePct.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Card 2: Thermal Efficiency */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
        <div>
          <div className="text-xs font-mono font-semibold text-emerald-400 mb-1">
            Thermal Efficiency
          </div>
          <div className="text-4xl font-black text-white font-mono tabular-nums tracking-tight my-1">
            {thermalEfficiencyPct.toFixed(1)}%
          </div>
        </div>
        <div className="pt-3 mt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300 font-mono tabular-nums">
          <span>A25A-FXS 2.5L Atkinson</span>
          <span className="text-emerald-400 font-semibold">Peak Brake Energy</span>
        </div>
      </div>

      {/* Card 3: Monotonic Telemetry Nonce */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
        <div>
          <div className="text-xs font-mono font-semibold text-sky-400 mb-1">
            Monotonic Telemetry Nonce
          </div>
          <div className="text-4xl font-black text-white font-mono tabular-nums tracking-tight my-1">
            #{monotonicNonce.toLocaleString()}
          </div>
        </div>
        <div className="pt-3 mt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300 font-mono tabular-nums">
          <span>Zero Collision Sequence</span>
          <span className="text-sky-400 font-semibold">{activeRegime}</span>
        </div>
      </div>

      {/* Card 4: IP Clean-Room Audit */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
        <div>
          <div className="text-xs font-mono font-semibold text-emerald-400 mb-1">
            IP Clean-Room Audit
          </div>
          <div className="text-4xl font-black text-white font-mono tabular-nums tracking-tight my-1">
            0% Copyleft
          </div>
        </div>
        <div className="pt-3 mt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300 font-mono tabular-nums">
          <span>MIT / BSD-3 / Apache-2.0</span>
          <span className="text-emerald-400 font-semibold">Clean-Room Certified</span>
        </div>
      </div>
    </section>
  );
};
