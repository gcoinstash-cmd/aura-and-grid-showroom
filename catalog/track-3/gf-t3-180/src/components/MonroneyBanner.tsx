import React from 'react';
import { Sliders, ShieldCheck, Download, CheckCircle2, DollarSign, Award, FileCheck } from 'lucide-react';

interface MonroneyBannerProps {
  onSimulateHeight: () => void;
  onVerifyLedgerHash: () => void;
  onExportSpec: () => void;
}

export const MonroneyBanner: React.FC<MonroneyBannerProps> = ({
  onSimulateHeight,
  onVerifyLedgerHash,
  onExportSpec,
}) => {
  return (
    <header className="relative w-full bg-slate-900/90 border border-slate-800 rounded-xl p-4 md:p-6 mb-6 shadow-2xl backdrop-blur-md">
      {/* a) Top Badge Strip */}
      <div className="flex flex-row flex-wrap items-center gap-2 mb-3">
        <span className="text-amber-400 bg-amber-500/10 border border-amber-500/30 text-[11px] font-mono font-bold px-2 py-0.5 rounded inline-flex w-auto whitespace-nowrap">
          GF-T3-180
        </span>
        <span className="text-slate-300 bg-slate-800 border border-slate-700 text-[11px] font-mono font-semibold px-2 py-0.5 rounded inline-flex w-auto whitespace-nowrap">
          Ultra-Heavy Telemetry Core EXEC CORE
        </span>
        <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono font-bold px-2 py-0.5 rounded inline-flex w-auto whitespace-nowrap">
          v1.0.0-PROD
        </span>
      </div>

      {/* b) Title & Description */}
      <h1 className="text-2xl font-black text-white tracking-tight mb-1">
        Apex Executive Ultra-Heavy Telemetry Core Ultra Luxury Executive Core
      </h1>
      <p className="text-slate-400 text-xs md:text-sm line-clamp-2 mb-4">
        Turnkey micro-APA deliverable with 4-Wheel AHC electro-hydraulic suspension damping, V35A-FTS twin-turbo wastegate management, and PostgreSQL 16 HMAC ledger.
      </p>

      {/* c) Action Buttons (STRICTLY HORIZONTAL ROW, NEVER VERTICAL) */}
      <div className="flex flex-row items-center gap-2 pb-3 mb-3 border-b border-slate-800 overflow-x-auto">
        <button
          type="button"
          onClick={onSimulateHeight}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs h-8 px-2.5 rounded-lg inline-flex items-center gap-1 shrink-0 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
        >
          <Sliders className="w-3.5 h-3.5 shrink-0" />
          <span>Simulate AHC</span>
        </button>

        <button
          type="button"
          onClick={onVerifyLedgerHash}
          className="bg-slate-800 hover:bg-slate-700 border border-emerald-500/40 text-emerald-400 font-bold text-xs h-8 px-2.5 rounded-lg inline-flex items-center gap-1 shrink-0 transition-colors cursor-pointer whitespace-nowrap"
        >
          <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
          <span>Verify Hash</span>
        </button>

        <button
          type="button"
          onClick={onExportSpec}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-8 px-2.5 rounded-lg inline-flex items-center gap-1 shrink-0 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5 shrink-0" />
          <span>Export Spec</span>
        </button>
      </div>

      {/* d) Specification & Audit Strip */}
      <div className="flex flex-row flex-wrap items-center gap-3 text-xs">
        <div className="inline-flex items-center gap-1 text-slate-300 font-medium">
          <DollarSign className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-400">Asset Transfer:</span>
          <span className="text-white font-bold font-mono">20 kHz (0.48ms)</span>
        </div>
        <span className="text-slate-700 hidden sm:inline">|</span>

        <div className="inline-flex items-center gap-1 text-slate-300 font-medium">
          <Award className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-slate-400">Enterprise:</span>
          <span className="text-amber-300 font-bold font-mono">PostgreSQL 16 + RLS</span>
        </div>
        <span className="text-slate-700 hidden sm:inline">|</span>

        <div className="inline-flex items-center gap-1 text-slate-300 font-medium">
          <FileCheck className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-slate-400">License:</span>
          <span className="text-blue-300 font-semibold">MIT Permissive</span>
        </div>
        <span className="text-slate-700 hidden sm:inline">|</span>

        <div className="inline-flex items-center gap-1 text-emerald-400 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Clean-Room Certified</span>
        </div>
      </div>
    </header>
  );
};
