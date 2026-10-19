import React from 'react';
import { ShieldCheck, Cpu, DollarSign, Activity } from 'lucide-react';

interface HeaderProps {
  currentLatencyUs: number;
}

export const Header: React.FC<HeaderProps> = ({ currentLatencyUs }) => {
  return (
    <header className="border-b border-slate-800 bg-[#090d16]/95 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        {/* Top Bar Contract: Brand + Primary Status */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-fuchsia-600 via-indigo-600 to-blue-600 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-fuchsia-950/50">
              PM
            </div>
            <div>
              <div className="flex items-baseline gap-3">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
                  PRISMMESH ENGINE
                </h1>
                <span className="text-sm font-mono font-bold text-fuchsia-400">
                  GF-T3-155
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">
                PBS MEV Auction & Deterministic Bundle Sequencing Core · Sub-12µs Block Packing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-3 py-1.5 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              SLOT 8,945,120 · TARGET: 30.0M GAS
            </div>
          </div>
        </div>

        {/* 4 Required Telemetry Badges in Responsive 2x2 Grid (grid-cols-2 lg:grid-cols-4) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full pt-1">
          {/* Card 1: 20 kHz (0.48ms) APA ASSET TRANSFER */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3 hover:border-fuchsia-500/50 transition-colors">
            <div className="p-2 rounded-lg bg-fuchsia-500/10 text-fuchsia-400 shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Asset Specification</div>
              <div className="text-sm sm:text-base font-black font-mono text-white whitespace-normal leading-snug">
                20 kHz (0.48ms) APA ASSET TRANSFER
              </div>
            </div>
          </div>

          {/* Card 2: 100 µs BENCHMARK */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3 hover:border-blue-500/50 transition-colors">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Benchmark Speed</div>
              <div className="text-sm sm:text-base font-black font-mono text-blue-400 whitespace-normal leading-snug">
                {currentLatencyUs > 0 ? `${currentLatencyUs} µs BENCHMARK` : '100 µs BENCHMARK'}
              </div>
            </div>
          </div>

          {/* Card 3: DAG TopoSort */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3 hover:border-emerald-500/50 transition-colors">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Sequencer Core</div>
              <div className="text-sm sm:text-base font-black font-mono text-emerald-400 whitespace-normal leading-snug">
                DAG TopoSort
              </div>
            </div>
          </div>

          {/* Card 4: Verified Permissive */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3 hover:border-amber-500/50 transition-colors">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Clean-Room Audit</div>
              <div className="text-sm sm:text-base font-black font-mono text-amber-300 whitespace-normal leading-snug">
                Verified Permissive
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
