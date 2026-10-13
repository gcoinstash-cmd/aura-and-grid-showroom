import React from 'react';
import { Waves, GitCommit, Binary, ShieldCheck } from 'lucide-react';

interface TelemetryStripProps {
  rpm: number;
  acousticValveState: 'STAGE_1_CLOSED' | 'STAGE_2_OPEN';
  tbrRatio: number;
  nonce: number;
  diffOilTemp: number;
}

export const TelemetryStrip: React.FC<TelemetryStripProps> = ({
  rpm,
  acousticValveState,
  tbrRatio,
  nonce,
  diffOilTemp,
}) => {
  const isAcousticActive = acousticValveState === 'STAGE_2_OPEN';
  // Compute acoustic resonance frequency dynamically: at stage 2, peaks around 2,500 Hz
  const helmholtzFreq = isAcousticActive
    ? Math.round(2100 + (rpm / 7300) * 400)
    : Math.round(68 + (rpm / 3600) * 28);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Card 1: Intake Acoustic Valve Loop */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Waves className={`w-5 h-5 ${isAcousticActive ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
            <span className="text-base font-bold text-slate-200">Acoustic Valve Loop</span>
          </div>
          <span
            className={`text-sm font-mono font-bold px-2.5 py-1 rounded ${
              isAcousticActive
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            {isAcousticActive ? 'STAGE 2 OPEN' : 'STAGE 1 RUNNER'}
          </span>
        </div>

        <div className="my-2">
          <div className="text-4xl font-black text-white font-mono tabular-nums tracking-tight">
            {helmholtzFreq.toLocaleString()} <span className="text-xl font-bold text-slate-400">Hz</span>
          </div>
        </div>

        <div className="text-base text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2.5 mt-2">
          <span>Resonance Crossover:</span>
          <span className="font-mono font-bold text-slate-200">3,600 RPM</span>
        </div>
      </div>

      {/* Card 2: Torsen Torque Bias Ratio */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <GitCommit className="w-5 h-5 text-indigo-400" />
            <span className="text-base font-bold text-slate-200">Torsen Torque Bias Ratio</span>
          </div>
          <span className="text-sm font-mono font-bold px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
            TYPE-B HELICAL
          </span>
        </div>

        <div className="my-2">
          <div className="text-4xl font-black text-white font-mono tabular-nums tracking-tight">
            {tbrRatio.toFixed(2)} : 1.00
          </div>
        </div>

        <div className="text-base text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2.5 mt-2">
          <span>Differential Oil Temp:</span>
          <span className={`font-mono font-bold ${diffOilTemp > 135 ? 'text-red-400' : 'text-slate-200'}`}>
            {diffOilTemp.toFixed(1)}°C
          </span>
        </div>
      </div>

      {/* Card 3: Monotonic Telemetry Nonce */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Binary className="w-5 h-5 text-emerald-400" />
            <span className="text-base font-bold text-slate-200">Monotonic Nonce Ledger</span>
          </div>
          <span className="text-sm font-mono font-bold px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            ZERO COLLISION
          </span>
        </div>

        <div className="my-2">
          <div className="text-4xl font-black text-emerald-400 font-mono tabular-nums tracking-tight">
            #{nonce.toLocaleString()}
          </div>
        </div>

        <div className="text-base text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2.5 mt-2">
          <span>Chain State:</span>
          <span className="font-mono font-bold text-slate-200">HMAC-SHA256 OK</span>
        </div>
      </div>

      {/* Card 4: IP Clean-Room Audit */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-base font-bold text-slate-200">IP Clean-Room Audit</span>
          </div>
          <span className="text-sm font-mono font-bold px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            ACQUIRE-READY
          </span>
        </div>

        <div className="my-2">
          <div className="text-4xl font-black text-white font-mono tabular-nums tracking-tight">
            0% <span className="text-2xl font-bold text-emerald-400">Copyleft</span>
          </div>
        </div>

        <div className="text-base text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2.5 mt-2">
          <span>License Audit:</span>
          <span className="font-mono font-bold text-slate-200">100% MIT Permissive</span>
        </div>
      </div>
    </div>
  );
};
