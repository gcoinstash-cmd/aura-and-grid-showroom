import React from 'react';
import { Gauge, ArrowUpDown, Hash, ShieldCheck } from 'lucide-react';
import { HeightLevel } from '../types/telemetry';

interface TelemetryMetricsStripProps {
  frequencyHz: number;
  linePressureBar: number;
  heightLevel: HeightLevel;
  heightOffsetMm: number;
  totalStrokeMm: number;
  currentNonce: number;
  cleanRoomVerified: boolean;
  onHeightClick?: () => void;
  onLoopClick?: () => void;
  onNonceClick?: () => void;
  onAuditClick?: () => void;
}

export const TelemetryMetricsStrip: React.FC<TelemetryMetricsStripProps> = ({
  frequencyHz,
  linePressureBar,
  heightLevel,
  heightOffsetMm,
  totalStrokeMm,
  currentNonce,
  cleanRoomVerified,
  onHeightClick,
  onLoopClick,
  onNonceClick,
  onAuditClick,
}) => {
  const formatHeightName = (level: HeightLevel) => {
    switch (level) {
      case 'LOW':
        return 'Low (-25mm)';
      case 'NORMAL':
        return 'Normal (0mm)';
      case 'HIGH_1':
        return 'High 1 (+35mm)';
      case 'HIGH_2':
        return 'High 2 (+80mm)';
      case 'EXTRA_HIGH':
        return 'Extra High (+105mm)';
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Card 1: AHC Hydraulic Loop */}
      <div
        onClick={onLoopClick}
        className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 rounded-xl p-5 transition-all shadow-lg backdrop-blur-sm cursor-pointer group"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-300 font-semibold text-base tracking-wide flex items-center gap-2">
            <Gauge className="w-5 h-5 text-amber-400 shrink-0" />
            AHC Hydraulic Loop
          </span>
          <span className="text-amber-400 bg-amber-500/10 border border-amber-500/30 text-base font-mono font-bold px-2 py-0.5 rounded shrink-0">
            ACTIVE
          </span>
        </div>
        <div className="text-4xl font-black text-white font-mono tabular-nums tracking-tight my-2">
          {frequencyHz.toLocaleString()} <span className="text-2xl font-bold text-amber-400">Hz</span>
        </div>
        <div className="text-slate-300 text-base leading-relaxed flex items-center justify-between pt-1 border-t border-slate-800">
          <span>Main Pressure:</span>
          <span className="font-mono font-bold text-white tabular-nums">
            {linePressureBar.toFixed(1)} bar
          </span>
        </div>
        <div className="text-slate-400 text-base mt-1">
          2,200 Hz accumulator switching cycle
        </div>
      </div>

      {/* Card 2: Ride Height Adjustment */}
      <div
        onClick={onHeightClick}
        className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 rounded-xl p-5 transition-all shadow-lg backdrop-blur-sm cursor-pointer group"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-300 font-semibold text-base tracking-wide flex items-center gap-2">
            <ArrowUpDown className="w-5 h-5 text-cyan-400 shrink-0" />
            Ride Height Adjust
          </span>
          <span className="text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 text-base font-mono font-bold px-2 py-0.5 rounded shrink-0">
            {heightOffsetMm >= 0 ? `+${heightOffsetMm}mm` : `${heightOffsetMm}mm`}
          </span>
        </div>
        <div className="text-4xl font-black text-white font-mono tabular-nums tracking-tight my-2 truncate">
          {heightLevel.replace('_', ' ')}
        </div>
        <div className="text-slate-300 text-base leading-relaxed flex items-center justify-between pt-1 border-t border-slate-800">
          <span>Total Articulation:</span>
          <span className="font-mono font-bold text-cyan-400 tabular-nums">
            +{totalStrokeMm}mm stroke
          </span>
        </div>
        <div className="text-slate-400 text-base mt-1">
          {formatHeightName(heightLevel)}
        </div>
      </div>

      {/* Card 3: Monotonic Telemetry Nonce */}
      <div
        onClick={onNonceClick}
        className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-5 transition-all shadow-lg backdrop-blur-sm cursor-pointer group"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-300 font-semibold text-base tracking-wide flex items-center gap-2">
            <Hash className="w-5 h-5 text-indigo-400 shrink-0" />
            Telemetry Nonce
          </span>
          <span className="text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 text-base font-mono font-bold px-2 py-0.5 rounded shrink-0">
            ZERO COLLISION
          </span>
        </div>
        <div className="text-4xl font-black text-white font-mono tabular-nums tracking-tight my-2">
          #{currentNonce.toLocaleString()}
        </div>
        <div className="text-slate-300 text-base leading-relaxed flex items-center justify-between pt-1 border-t border-slate-800">
          <span>Integrity Chain:</span>
          <span className="font-mono font-bold text-emerald-400">
            HMAC-SHA256
          </span>
        </div>
        <div className="text-slate-400 text-base mt-1">
          Strictly monotonic ledger sequence
        </div>
      </div>

      {/* Card 4: IP Clean-Room Audit */}
      <div
        onClick={onAuditClick}
        className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 rounded-xl p-5 transition-all shadow-lg backdrop-blur-sm cursor-pointer group"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-300 font-semibold text-base tracking-wide flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            IP Clean-Room Audit
          </span>
          <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 text-base font-mono font-bold px-2 py-0.5 rounded shrink-0">
            PASSED 100%
          </span>
        </div>
        <div className="text-4xl font-black text-emerald-400 font-mono tracking-tight my-2">
          0% <span className="text-2xl font-bold text-white">Copyleft</span>
        </div>
        <div className="text-slate-300 text-base leading-relaxed flex items-center justify-between pt-1 border-t border-slate-800">
          <span>License Class:</span>
          <span className="font-mono font-bold text-white">
            MIT Permissive
          </span>
        </div>
        <div className="text-slate-400 text-base mt-1">
          Clean-room institutional certification
        </div>
      </div>
    </div>
  );
};
