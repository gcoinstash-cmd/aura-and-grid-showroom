import React from 'react';
import { BatteryCharging, Zap, Hash, ShieldCheck, Activity } from 'lucide-react';

interface TelemetryMetricsStripProps {
  currentImpedance: number; // e.g. 0.84 mΩ
  samplingRate: number; // 2800 Hz
  dendriteSafetyMargin: number; // e.g. 99.8%
  accelZeroToSixty: number; // e.g. 1.88s
  peakKw: number; // e.g. 710 kW
  currentNonce: number; // e.g. 1004812
  lastBlockHash: string; // e.g. 0x8a91...
  licenseStatus: string;
}

export const TelemetryMetricsStrip: React.FC<TelemetryMetricsStripProps> = ({
  currentImpedance,
  samplingRate,
  dendriteSafetyMargin,
  accelZeroToSixty,
  peakKw,
  currentNonce,
  lastBlockHash,
  licenseStatus,
}) => {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Card 1: Solid-State Battery Loop */}
      <div className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 rounded-xl p-5 shadow-lg transition-all relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3 opacity-10 text-amber-400">
          <BatteryCharging className="w-16 h-16" />
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-base font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
            SSB Thermal Loop
          </span>
          <span className="text-base font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded">
            {samplingRate} Hz
          </span>
        </div>
        
        <div className="my-2">
          <div className="text-4xl font-black text-white tracking-tight font-mono">
            {currentImpedance.toFixed(2)} <span className="text-2xl font-bold text-amber-400">mΩ</span>
          </div>
          <p className="text-base text-slate-400 mt-1 font-medium">
            Avg Impedance Cycle (96 Cells)
          </p>
        </div>

        <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-base">
          <span className="text-slate-400 font-medium">Dendrite Safety:</span>
          <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
            <Activity className="w-4 h-4 text-emerald-400" />
            {dendriteSafetyMargin.toFixed(1)}% Nom
          </span>
        </div>
      </div>

      {/* Card 2: 0-60 Acceleration Benchmark */}
      <div className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 rounded-xl p-5 shadow-lg transition-all relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3 opacity-10 text-cyan-400">
          <Zap className="w-16 h-16" />
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-base font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            0-60 Benchmark
          </span>
          <span className="text-base font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded">
            SUB-2.0s
          </span>
        </div>
        
        <div className="my-2">
          <div className="text-4xl font-black text-white tracking-tight font-mono">
            {accelZeroToSixty.toFixed(2)} <span className="text-2xl font-bold text-cyan-400">sec</span>
          </div>
          <p className="text-base text-slate-400 mt-1 font-medium">
            Dual-Motor Dynamic Vectoring
          </p>
        </div>

        <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-base">
          <span className="text-slate-400 font-medium">Peak Combined:</span>
          <span className="text-cyan-300 font-mono font-bold">
            {peakKw} kW / 1,280 Nm
          </span>
        </div>
      </div>

      {/* Card 3: Monotonic Telemetry Nonce */}
      <div className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 rounded-xl p-5 shadow-lg transition-all relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3 opacity-10 text-emerald-400">
          <Hash className="w-16 h-16" />
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-base font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            Telemetry Nonce
          </span>
          <span className="text-base font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded">
            ZERO COLLISION
          </span>
        </div>
        
        <div className="my-2">
          <div className="text-4xl font-black text-white tracking-tight font-mono">
            #{currentNonce.toLocaleString()}
          </div>
          <p className="text-base text-slate-400 mt-1 font-medium font-mono truncate">
            {lastBlockHash}
          </p>
        </div>

        <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-base">
          <span className="text-slate-400 font-medium">HMAC-SHA256:</span>
          <span className="text-emerald-400 font-mono font-bold">
            Strict Monotonic
          </span>
        </div>
      </div>

      {/* Card 4: IP Clean-Room Audit */}
      <div className="bg-slate-900/90 border border-slate-800 hover:border-purple-500/40 rounded-xl p-5 shadow-lg transition-all relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3 opacity-10 text-purple-400">
          <ShieldCheck className="w-16 h-16" />
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-base font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-400" />
            IP Clean-Room Audit
          </span>
          <span className="text-base font-mono font-bold text-purple-300 bg-purple-500/10 px-2.5 py-1 rounded">
            0% COPYLEFT
          </span>
        </div>
        
        <div className="my-2">
          <div className="text-4xl font-black text-white tracking-tight font-mono">
            100% <span className="text-2xl font-bold text-purple-400">CLEAN</span>
          </div>
          <p className="text-base text-slate-400 mt-1 font-medium">
            MIT / Apache 2.0 Permissive
          </p>
        </div>

        <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-base">
          <span className="text-slate-400 font-medium">Acquire.com Status:</span>
          <span className="text-emerald-400 font-mono font-bold">
            {licenseStatus}
          </span>
        </div>
      </div>
    </section>
  );
};
