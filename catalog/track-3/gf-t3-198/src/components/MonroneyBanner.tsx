import React from 'react';
import { Play, ShieldCheck, Download, CheckCircle2 } from 'lucide-react';
import { triggerSpecDownload } from '../utils/specExport';

interface MonroneyBannerProps {
  onSimulateV10: () => void;
  onVerifyHash: () => void;
  isSimulating: boolean;
  onExportSpec?: () => void;
}

export const MonroneyBanner: React.FC<MonroneyBannerProps> = ({
  onSimulateV10,
  onVerifyHash,
  isSimulating,
  onExportSpec,
}) => {
  const handleExport = () => {
    if (onExportSpec) {
      onExportSpec();
    } else {
      triggerSpecDownload();
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-2xl relative overflow-hidden">
      {/* Decorative subtle carbon weave ambient gradient */}
      <div className="absolute top-0 right-0 w-96 h-48 bg-amber-500/5 blur-3xl pointer-events-none -z-0" />

      <div className="relative z-10">
        {/* a) Top Badge Strip */}
        <div className="flex flex-row flex-wrap items-center gap-1.5 mb-3">
          <span className="text-amber-400 bg-amber-500/10 border border-amber-500/30 text-[11px] font-mono font-bold px-2 py-0.5 rounded inline-flex w-auto whitespace-nowrap">
            GF-T3-198
          </span>
          <span className="text-slate-300 bg-slate-800 border border-slate-700 text-[11px] font-mono font-semibold px-2 py-0.5 rounded inline-flex w-auto whitespace-nowrap">
            LFA V10 NÜRBURGRING CORE
          </span>
          <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono font-bold px-2 py-0.5 rounded inline-flex w-auto whitespace-nowrap">
            v1.0.0-PROD
          </span>
        </div>

        {/* b) Title & Description */}
        <h1 className="text-2xl font-black text-white tracking-tight mb-1">
          Heavy Overland Dynamics Platform LFA Nürburgring Edition V10 Core
        </h1>
        <p className="text-slate-400 text-sm line-clamp-2 mb-4 leading-relaxed">
          Turnkey micro-APA deliverable with 1LR-GUE 9,000 RPM acoustic surge mapping, ASG automated sequential shift dynamics, and PostgreSQL 16 HMAC ledger.
        </p>

        {/* c) Action Buttons (STRICT SINGLE HORIZONTAL ROW, NEVER VERTICALLY STACKED) */}
        <div className="flex flex-row items-center gap-1.5 pb-3 mb-3 border-b border-slate-800 overflow-x-auto">
          <button
            onClick={onSimulateV10}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs h-8 px-2.5 rounded-lg inline-flex items-center gap-1 shrink-0 transition-colors shadow-sm cursor-pointer"
            title="Toggle interactive 1LR-GUE acoustic & valvetrain simulation"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Active V10 Sim' : 'Simulate V10'}</span>
          </button>

          <button
            onClick={onVerifyHash}
            className="bg-slate-800 hover:bg-slate-700 border border-emerald-500/40 text-emerald-400 font-bold text-xs h-8 px-2.5 rounded-lg inline-flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
            title="Verify HMAC-SHA256 telemetry ledger hash integrity"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verify Hash</span>
          </button>

          <button
            onClick={handleExport}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-8 px-2.5 rounded-lg inline-flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
            title="Download full GF_T3_198_SPEC.md archive"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Spec</span>
          </button>
        </div>

        {/* d) Specification & Audit Strip */}
        <div className="flex flex-row flex-wrap items-center gap-3 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-1 text-slate-200">
            <span className="text-slate-400 font-sans">Asset Transfer:</span>
            <span className="font-bold text-amber-400">20 kHz (0.48ms)</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1 text-slate-200">
            <span className="text-slate-400 font-sans">Enterprise:</span>
            <span className="font-bold text-emerald-400">PostgreSQL 16 + RLS</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1 text-slate-300">
            <span className="font-sans">MIT Permissive</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Clean-Room Certified</span>
          </div>
        </div>
      </div>
    </div>
  );
};
