import React from 'react';
import { Cpu, ShieldCheck, DollarSign, Activity } from 'lucide-react';

interface HeaderBadgesProps {
  latencyUs: number;
  totalSteps: number;
}

export const HeaderBadges: React.FC<HeaderBadgesProps> = ({ latencyUs, totalSteps }) => {
  return (
    <header className="border-b border-slate-800/80 bg-[#0a0e17]/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Top title bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 text-teal-400 text-xs font-mono tracking-widest uppercase">
              <span>TRACK 3 // AUTONOMOUS GUIDANCE</span>
              <span>·</span>
              <span>70/30 SKUNKWORKS CORE</span>
              <span>·</span>
              <span>1,000 HZ ES-EKF</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-white mt-1 flex flex-wrap items-baseline gap-x-2">
              <span>AEROKINETIC ENGINE</span>
              <span className="text-teal-400 font-mono font-bold whitespace-nowrap">// GF-T3-156</span>
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Multi-Rate Error-State Extended Kalman Filter & 6-DoF Sensor Fusion Core
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-400">
              CYCLES: <strong className="text-teal-300 font-bold tabular-nums">{(totalSteps).toLocaleString()}</strong>
            </span>
            <div className="h-4 w-[1px] bg-slate-700" />
            <span className="text-xs font-mono px-2.5 py-1 bg-teal-500/10 border border-teal-500/30 text-teal-300 font-bold rounded">
              DETERMINISTIC FUSION NOMINAL
            </span>
          </div>
        </div>

        {/* Responsive 2x2 Telemetry Grid (grid-cols-2 md:grid-cols-4) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Badge 1: 20 kHz (0.48ms) APA ASSET TRANSFER */}
          <div className="bg-[#0f172a]/80 border border-teal-500/30 rounded-lg p-3 hover:border-teal-400/60 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400">SPECIFICATION ANCHOR</span>
              <DollarSign className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-white mt-1">
              20 kHz (0.48ms) <span className="text-xs font-normal text-slate-400">USD</span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Standard APA Reference Core</div>
          </div>

          {/* Badge 2: Filter Latency: 12.8 µs */}
          <div className="bg-[#0f172a]/80 border border-sky-500/30 rounded-lg p-3 hover:border-sky-400/60 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-400">FILTER LATENCY</span>
              <Activity className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-sky-300 mt-1 tabular-nums">
              {latencyUs.toFixed(1)} <span className="text-xs font-normal text-slate-400">µs / cycle</span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Sub-15 µs Prediction Benchmark</div>
          </div>

          {/* Badge 3: Fusion: 16-State ES-EKF */}
          <div className="bg-[#0f172a]/80 border border-amber-500/30 rounded-lg p-3 hover:border-amber-400/60 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">FUSION ARCHITECTURE</span>
              <Cpu className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-base sm:text-lg font-black font-mono text-white mt-1 whitespace-nowrap">
              16-State ES-EKF
            </div>
            <div className="text-xs text-slate-400 mt-0.5">1 kHz IMU · 10 Hz GNSS · Flow</div>
          </div>

          {/* Badge 4: Clean IP: Verified Permissive */}
          <div className="bg-[#0f172a]/80 border border-emerald-500/30 rounded-lg p-3 hover:border-emerald-400/60 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">CLEAN-ROOM IP</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-lg sm:text-xl font-black font-mono text-emerald-300 mt-1">
              100% Permissive
            </div>
            <div className="text-xs text-slate-400 mt-0.5">Zero GPL · MIT/Apache-2.0</div>
          </div>
        </div>
      </div>
    </header>
  );
};
