import React from 'react';
import { ShieldCheck, Zap, DollarSign, Activity } from 'lucide-react';

interface HeaderProps {
  currentLatencyUs: number;
}

export const Header: React.FC<HeaderProps> = ({ currentLatencyUs }) => {
  return (
    <header className="border-b border-slate-800 bg-[#0b0f19]/95 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-6 py-4 sm:py-5">
      <div className="max-w-7xl mx-auto flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 sm:gap-5">
        {/* Brand & Codename */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-800 flex items-center justify-center border border-violet-500/50 shadow-xl shadow-violet-600/35 shrink-0">
            <Zap className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white uppercase font-mono truncate">
                VORTEXROUTE ENGINE <span className="text-violet-400">// GF-T3-154</span>
              </h1>
              <span className="inline-flex items-center px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-black uppercase tracking-wider bg-violet-950 text-violet-300 border border-violet-600/80 shrink-0">
                TRACK 3 F1
              </span>
            </div>
            <p className="text-sm sm:text-base font-semibold text-slate-300 tracking-wide mt-0.5 sm:mt-1 truncate">
              High-Frequency Cross-Venue Smart Order Router &amp; Liquidity Aggregation Core
            </p>
          </div>
        </div>

        {/* 4 Telemetry Badges - Responsive Auto-Wrapping Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 w-full xl:max-w-3xl">
          {/* Badge 1: Reference Core */}
          <div className="w-full min-w-0 overflow-hidden flex items-center gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-xl bg-amber-950/40 border border-amber-500/50 shadow-md">
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-xs sm:text-sm font-black tracking-wider uppercase text-amber-400 truncate">
                Anchor Specification
              </div>
              <div className="flex items-baseline gap-1.5 truncate">
                <span className="text-base sm:text-lg md:text-xl font-black text-amber-300 font-mono tracking-tight truncate">
                  20 kHz (0.48ms)
                </span>
                <span className="text-xs sm:text-sm font-bold text-amber-400/90 shrink-0">
                  APA ASSET TRANSFER
                </span>
              </div>
            </div>
          </div>

          {/* Badge 2: Route Latency */}
          <div className="w-full min-w-0 overflow-hidden flex items-center gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-xl bg-violet-950/50 border border-violet-500/60 shadow-md">
            <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-violet-400 shrink-0 animate-pulse" />
            <div className="min-w-0 flex-1">
              <div className="text-xs sm:text-sm font-black tracking-wider uppercase text-violet-300 truncate">
                Route Latency
              </div>
              <div className="flex items-baseline gap-1.5 truncate">
                <span className="text-base sm:text-lg md:text-xl font-black text-violet-200 font-mono tracking-tight truncate">
                  {currentLatencyUs.toFixed(1)} µs
                </span>
                <span className="text-xs sm:text-sm font-bold text-violet-400/90 shrink-0">
                  AVG
                </span>
              </div>
            </div>
          </div>

          {/* Badge 3: Optimization Model */}
          <div className="w-full min-w-0 overflow-hidden flex items-center gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/50 shadow-md">
            <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-xs sm:text-sm font-black tracking-wider uppercase text-emerald-400 truncate">
                Optimizer Model
              </div>
              <div className="flex items-baseline gap-1.5 truncate">
                <span className="text-base sm:text-lg md:text-xl font-black text-emerald-300 font-mono tracking-tight truncate">
                  Dynamic Convex
                </span>
                <span className="text-xs sm:text-sm font-bold text-emerald-400/90 shrink-0">
                  Split
                </span>
              </div>
            </div>
          </div>

          {/* Badge 4: Clean IP */}
          <div className="w-full min-w-0 overflow-hidden flex items-center gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-xl bg-slate-900 border border-emerald-500/50 shadow-md">
            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-xs sm:text-sm font-black tracking-wider uppercase text-slate-300 truncate">
                Legal Audit
              </div>
              <div className="flex items-baseline gap-1.5 truncate">
                <span className="text-base sm:text-lg md:text-xl font-black text-emerald-400 font-mono tracking-tight truncate">
                  Clean IP
                </span>
                <span className="text-xs sm:text-sm font-bold text-emerald-400/90 shrink-0">
                  Verified
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
