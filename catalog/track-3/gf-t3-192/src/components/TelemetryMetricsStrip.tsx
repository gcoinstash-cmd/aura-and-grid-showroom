import React from 'react';
import { Activity, Compass, Cpu, ShieldCheck } from 'lucide-react';

interface TelemetryMetricsStripProps {
  nonce: number;
  currentToeAngle: number;
  phaseMode: string;
  cycleTimeUs: number;
  canFreqHz: number;
}

export const TelemetryMetricsStrip: React.FC<TelemetryMetricsStripProps> = ({
  nonce,
  currentToeAngle,
  phaseMode,
  cycleTimeUs,
  canFreqHz,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Card 1: DRS Actuator Loop */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-400 font-semibold tracking-wide text-base">
            DRS Actuator Loop
          </span>
          <Activity className="w-5 h-5 text-amber-400" />
        </div>
        <div className="text-4xl font-black text-white font-mono tracking-tight my-1">
          {canFreqHz.toLocaleString()} <span className="text-2xl font-bold text-amber-400">Hz</span>
        </div>
        <div className="text-slate-300 font-medium text-base mt-2 flex items-center justify-between">
          <span>CAN-FD Cycle Time</span>
          <span className="font-mono text-emerald-400 font-bold bg-slate-800/80 px-2 py-0.5 rounded">
            {cycleTimeUs.toFixed(1)} µs
          </span>
        </div>
      </div>

      {/* Card 2: Maximum Steering Phase */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-400 font-semibold tracking-wide text-base">
            Steering Phase Limit
          </span>
          <Compass className="w-5 h-5 text-cyan-400" />
        </div>
        <div className="text-4xl font-black text-white font-mono tracking-tight my-1">
          ±4.0<span className="text-2xl font-bold text-cyan-400">°</span>
        </div>
        <div className="text-slate-300 font-medium text-base mt-2 flex items-center justify-between">
          <span className="truncate mr-2">Current Toe Target</span>
          <span
            className={`font-mono font-bold px-2 py-0.5 rounded ${
              phaseMode.includes('ANTI')
                ? 'text-amber-400 bg-amber-950/40 border border-amber-800/50'
                : 'text-cyan-400 bg-cyan-950/40 border border-cyan-800/50'
            }`}
          >
            {currentToeAngle > 0 ? `+${currentToeAngle.toFixed(2)}` : currentToeAngle.toFixed(2)}°
          </span>
        </div>
      </div>

      {/* Card 3: Monotonic Telemetry Nonce */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-400 font-semibold tracking-wide text-base">
            Telemetry Nonce
          </span>
          <Cpu className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="text-4xl font-black text-white font-mono tracking-tight my-1">
          #{nonce.toLocaleString()}
        </div>
        <div className="text-slate-300 font-medium text-base mt-2 flex items-center justify-between">
          <span>HMAC Chain State</span>
          <span className="font-mono text-emerald-400 font-bold bg-slate-800/80 px-2 py-0.5 rounded">
            0 Collisions
          </span>
        </div>
      </div>

      {/* Card 4: IP Clean-Room Audit */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-400 font-semibold tracking-wide text-base">
            IP Clean-Room Audit
          </span>
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="text-4xl font-black text-emerald-400 font-mono tracking-tight my-1">
          0% <span className="text-2xl font-bold text-white">Copyleft</span>
        </div>
        <div className="text-slate-300 font-medium text-base mt-2 flex items-center justify-between">
          <span>Audit Status</span>
          <span className="font-mono text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
            Verified Clean
          </span>
        </div>
      </div>
    </div>
  );
};
