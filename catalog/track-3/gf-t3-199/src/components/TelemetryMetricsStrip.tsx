import React from 'react';
import { TelemetryState } from '../types/telemetry';
import { Activity, Compass, Hash, ShieldCheck } from 'lucide-react';

interface TelemetryMetricsStripProps {
  telemetry: TelemetryState;
  onSelectTab: (tabId: string) => void;
}

export const TelemetryMetricsStrip: React.FC<TelemetryMetricsStripProps> = ({
  telemetry,
  onSelectTab,
}) => {
  const isCounterPhase = telemetry.speedMph < 31.0; // 50 km/h is ~31 mph

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* Card 1: DUAL_VECTOR_TORQUE Inverter Loop */}
      <div 
        onClick={() => onSelectTab('dual_vector_torque')}
        className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-xl p-5 cursor-pointer transition-all hover:bg-slate-850 shadow-md group"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-400 font-medium text-base">Inverter Loop</span>
          <Activity className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-4xl font-black text-white font-mono tracking-tight">
            2,500
          </span>
          <span className="text-amber-400 font-bold text-lg font-mono">Hz</span>
        </div>
        <div className="text-base text-slate-300 font-mono flex items-center justify-between pt-2 border-t border-slate-800">
          <span>Split Ratio:</span>
          <span className="text-white font-bold">
            {telemetry.frontTorqueSplit}:{telemetry.rearTorqueSplit} F/R
          </span>
        </div>
        <div className="text-sm text-slate-400 mt-1">
          2,500 Hz high-output torque vectoring cycle
        </div>
      </div>

      {/* Card 2: Rear Dynamic Steer */}
      <div 
        onClick={() => onSelectTab('dual_vector_torque')}
        className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-xl p-5 cursor-pointer transition-all hover:bg-slate-850 shadow-md group"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-400 font-medium text-base">Rear Dynamic Steer</span>
          <Compass className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-4xl font-black text-white font-mono tracking-tight">
            {telemetry.drsAngleDeg > 0 ? `+${telemetry.drsAngleDeg.toFixed(1)}` : telemetry.drsAngleDeg.toFixed(1)}°
          </span>
          <span className="text-cyan-400 font-bold text-base font-mono">
            {isCounterPhase ? 'Counter' : 'In-phase'}
          </span>
        </div>
        <div className="text-base text-slate-300 font-mono flex items-center justify-between pt-2 border-t border-slate-800">
          <span>Toe Resolver:</span>
          <span className="text-white font-bold">
            ±4.0° Max Range
          </span>
        </div>
        <div className="text-sm text-slate-400 mt-1">
          {isCounterPhase ? 'Counter-phase agile yaw' : 'In-phase high-speed stability'}
        </div>
      </div>

      {/* Card 3: Monotonic Telemetry Nonce */}
      <div 
        onClick={() => onSelectTab('ledger')}
        className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-xl p-5 cursor-pointer transition-all hover:bg-slate-850 shadow-md group"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-400 font-medium text-base">Telemetry Nonce</span>
          <Hash className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
        </div>
        <div className="flex items-baseline gap-1 mb-2">
          <span className="text-slate-500 font-mono text-2xl font-bold">#</span>
          <span className="text-4xl font-black text-white font-mono tracking-tight">
            {telemetry.nonce.toLocaleString()}
          </span>
        </div>
        <div className="text-base text-slate-300 font-mono flex items-center justify-between pt-2 border-t border-slate-800">
          <span>HMAC Chain:</span>
          <span className="text-emerald-400 font-bold font-mono text-sm">
            {telemetry.ledgerHmac.slice(0, 10)}...
          </span>
        </div>
        <div className="text-sm text-slate-400 mt-1">
          Zero collision cryptographic proof
        </div>
      </div>

      {/* Card 4: IP Clean-Room Audit */}
      <div 
        onClick={() => onSelectTab('covenant')}
        className="bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-xl p-5 cursor-pointer transition-all hover:bg-slate-850 shadow-md group"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-400 font-medium text-base">Clean-Room Audit</span>
          <ShieldCheck className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-4xl font-black text-emerald-400 font-mono tracking-tight">
            0.0%
          </span>
          <span className="text-slate-300 font-bold text-base font-mono">Copyleft</span>
        </div>
        <div className="text-base text-slate-300 font-mono flex items-center justify-between pt-2 border-t border-slate-800">
          <span>Permissive:</span>
          <span className="text-purple-300 font-bold">
            100% MIT Whitelisted
          </span>
        </div>
        <div className="text-sm text-slate-400 mt-1">
          Clean-Room Certified & Escrow Ready
        </div>
      </div>
    </div>
  );
};
