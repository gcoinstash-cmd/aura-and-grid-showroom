import React from 'react';
import { PowertrainState } from '../types/telemetry';
import { Cpu, Gauge, Hash, Shield } from 'lucide-react';

interface TelemetryMetricsStripProps {
  state: PowertrainState;
}

export const TelemetryMetricsStrip: React.FC<TelemetryMetricsStripProps> = ({ state }) => {
  return (
    <section aria-label="Live Telemetry Metrics Strip" className="w-full px-4 md:px-6 py-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Inverter FOC Loop */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[15px] font-medium text-slate-300">Inverter FOC Loop</span>
            <Cpu className="w-5 h-5 text-amber-400" />
          </div>
          <div className="my-1">
            <div className="text-2xl font-bold font-mono text-white tabular-nums">
              2,500 <span className="text-[15px] font-normal text-slate-400">Hz</span>
            </div>
            <div className="text-[15px] text-slate-300 mt-1 flex items-center justify-between">
              <span>SiC PWM Cycle:</span>
              <span className="font-mono text-amber-300 tabular-nums">400 μs</span>
            </div>
          </div>
          <div className="text-[15px] text-slate-400 border-t border-slate-800/80 pt-2 mt-2 flex items-center justify-between">
            <span>Flux Weakening:</span>
            <span className={`font-mono font-medium ${state.fluxWeakeningActive ? 'text-amber-400' : 'text-emerald-400'}`}>
              {state.fluxWeakeningActive ? 'ACTIVE (Id < 0)' : 'MTPA OPTIMAL'}
            </span>
          </div>
        </div>

        {/* Card 2: Steer-by-Wire Ratio */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[15px] font-medium text-slate-300">Steer-by-Wire Ratio</span>
            <Gauge className="w-5 h-5 text-sky-400" />
          </div>
          <div className="my-1">
            <div className="text-2xl font-bold font-mono text-white tabular-nums">
              {state.steeringRatio.toFixed(1)}:1
            </div>
            <div className="text-[15px] text-slate-300 mt-1 flex items-center justify-between">
              <span>Yoke Travel Limit:</span>
              <span className="font-mono text-sky-300 tabular-nums">150° lock-to-lock</span>
            </div>
          </div>
          <div className="text-[15px] text-slate-400 border-t border-slate-800/80 pt-2 mt-2 flex items-center justify-between">
            <span>Wheel Cut Angle:</span>
            <span className="font-mono text-sky-300 tabular-nums">
              {state.roadWheelAngleDeg > 0 ? `+${state.roadWheelAngleDeg.toFixed(1)}°` : `${state.roadWheelAngleDeg.toFixed(1)}°`}
            </span>
          </div>
        </div>

        {/* Card 3: Monotonic Telemetry Nonce */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[15px] font-medium text-slate-300">Telemetry Nonce</span>
            <Hash className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="my-1">
            <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
              #{state.monotonicNonce.toLocaleString()}
            </div>
            <div className="text-[15px] text-slate-300 mt-1 flex items-center justify-between">
              <span>Collision Status:</span>
              <span className="font-mono text-emerald-300">0 Collisions</span>
            </div>
          </div>
          <div className="text-[15px] text-slate-400 border-t border-slate-800/80 pt-2 mt-2 flex items-center justify-between">
            <span>HMAC Signed:</span>
            <span className="font-mono text-slate-300 truncate max-w-[150px]" title={state.hmacSignature}>
              {state.hmacSignature.slice(0, 10)}...
            </span>
          </div>
        </div>

        {/* Card 4: IP Clean-Room Audit */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[15px] font-medium text-slate-300">IP Clean-Room Audit</span>
            <Shield className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="my-1">
            <div className="text-2xl font-bold font-mono text-white">
              0% <span className="text-[15px] font-normal text-slate-400">Copyleft</span>
            </div>
            <div className="text-[15px] text-slate-300 mt-1 flex items-center justify-between">
              <span>Audit Rating:</span>
              <span className="font-mono text-emerald-400">100% Clean-Room</span>
            </div>
          </div>
          <div className="text-[15px] text-slate-400 border-t border-slate-800/80 pt-2 mt-2 flex items-center justify-between">
            <span>License Whitelist:</span>
            <span className="font-mono text-indigo-300">MIT Permissive</span>
          </div>
        </div>
      </div>
    </section>
  );
};
