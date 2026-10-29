import React from 'react';
import { Play, ShieldCheck, Download, Activity } from 'lucide-react';

interface MonroneyBannerProps {
  onSimulateAhc: () => void;
  onVerifyHash: () => void;
  onExportSpec: () => void;
  isSimulating?: boolean;
}

export const MonroneyBanner: React.FC<MonroneyBannerProps> = ({
  onSimulateAhc,
  onVerifyHash,
  onExportSpec,
  isSimulating = false,
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 mb-5 shadow-2xl relative overflow-hidden backdrop-blur-md">
      {/* Top Badge Strip: Exactly 3 ultra-compact inline badges */}
      <div className="flex flex-row flex-wrap items-center gap-1.5 mb-3">
        <span className="text-amber-400 bg-amber-500/10 border border-amber-500/30 text-[11px] font-mono font-bold px-2 py-0.5 rounded inline-flex w-auto whitespace-nowrap">
          GF-T3-194
        </span>
        <span className="text-slate-300 bg-slate-800 border border-slate-700 text-[11px] font-mono font-semibold px-2 py-0.5 rounded inline-flex w-auto whitespace-nowrap">
          Ultra-Heavy Telemetry Core AHC CORE
        </span>
        <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono font-bold px-2 py-0.5 rounded inline-flex w-auto whitespace-nowrap">
          v1.0.0-PROD
        </span>
      </div>

      {/* Title & Description */}
      <h1 className="text-2xl font-black text-white tracking-tight mb-1">
        Apex Executive Ultra-Heavy Telemetry Core High-G Dynamic Telemetry Core
      </h1>
      <p className="text-slate-400 text-sm line-clamp-2 mb-4 leading-relaxed">
        Turnkey micro-APA deliverable with 4-wheel Active Height Control (AHC), multi-terrain hydraulic spring rate switching, and PostgreSQL 16 HMAC ledger.
      </p>

      {/* Action Buttons: STRICT SINGLE HORIZONTAL ROW, NEVER VERTICALLY STACKED */}
      <div className="flex flex-row items-center gap-1.5 pb-3 mb-3 border-b border-slate-800 overflow-x-auto">
        <button
          onClick={onSimulateAhc}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs h-8 px-2.5 rounded-lg inline-flex items-center gap-1 shrink-0 cursor-pointer transition-all active:scale-95 shadow-sm"
          title="Run 4-corner Active Height Control cycle simulation"
        >
          {isSimulating ? (
            <Activity className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" />
          )}
          <span>Simulate AHC</span>
        </button>

        <button
          onClick={onVerifyHash}
          className="bg-slate-800 hover:bg-slate-700 border border-emerald-500/40 text-emerald-400 font-bold text-xs h-8 px-2.5 rounded-lg inline-flex items-center gap-1 shrink-0 cursor-pointer transition-all active:scale-95 shadow-sm"
          title="Cryptographically verify HMAC-SHA256 signature chain"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Verify Hash</span>
        </button>

        <button
          onClick={onExportSpec}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-8 px-2.5 rounded-lg inline-flex items-center gap-1 shrink-0 cursor-pointer transition-all active:scale-95 shadow-sm"
          title="Download complete technical documentation as GF_T3_194_SPEC.md"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Spec</span>
        </button>
      </div>

      {/* Specification & Audit Strip */}
      <div className="flex flex-row flex-wrap items-center gap-3 text-xs text-slate-300">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-medium">Asset Transfer:</span>
          <span className="text-amber-400 font-bold font-mono tabular-nums">20 kHz (0.48ms)</span>
        </div>
        <span className="text-slate-700" aria-hidden="true">|</span>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-medium">Enterprise:</span>
          <span className="text-emerald-400 font-bold font-mono tabular-nums">PostgreSQL 16 + RLS</span>
        </div>
        <span className="text-slate-700" aria-hidden="true">|</span>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-300 font-medium">MIT Permissive</span>
        </div>
        <span className="text-slate-700" aria-hidden="true">|</span>
        <div className="flex items-center gap-1.5">
          <span className="text-emerald-400 font-medium">Clean-Room Certified</span>
        </div>
      </div>
    </div>
  );
};
