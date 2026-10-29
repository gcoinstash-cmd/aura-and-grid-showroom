import React from 'react';
import { Zap, ShieldCheck, Download } from 'lucide-react';

interface MonroneyBannerProps {
  onSimulate: () => void;
  onVerifyHash: () => void;
  onExportSpec: () => void;
}

export const MonroneyBanner: React.FC<MonroneyBannerProps> = ({
  onSimulate,
  onVerifyHash,
  onExportSpec,
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 mb-6 shadow-2xl relative">
      {/* Top Badge Strip */}
      <div className="flex flex-row flex-wrap items-center gap-1.5 mb-3">
        <span className="text-amber-400 bg-amber-500/10 border border-amber-500/30 text-[11px] font-mono font-bold px-2 py-0.5 rounded inline-flex w-auto whitespace-nowrap">
          GF-T3-200
        </span>
        <span className="text-slate-300 bg-slate-800 border border-slate-700 text-[11px] font-mono font-semibold px-2 py-0.5 rounded inline-flex w-auto whitespace-nowrap">
          LFA EV QUAD-MOTOR CORE
        </span>
        <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono font-bold px-2 py-0.5 rounded inline-flex w-auto whitespace-nowrap">
          v1.0.0-PROD
        </span>
      </div>

      {/* Title & Description */}
      <h1 className="text-2xl font-black text-white tracking-tight mb-1">
        Hypercar Flagship Trim Electrified Supercar Concept Core
      </h1>
      <p className="text-slate-400 text-sm line-clamp-2 mb-4 leading-relaxed">
        Turnkey micro-APA deliverable with quad-motor independent torque vectoring, solid-state battery thermal matrix, sub-2.0s launch dynamics, and PostgreSQL 16 HMAC ledger.
      </p>

      {/* Action Buttons (STRICT SINGLE HORIZONTAL ROW, NEVER VERTICALLY STACKED) */}
      <div className="flex flex-row items-center gap-1.5 pb-3 mb-3 border-b border-slate-800 overflow-x-auto">
        <button
          onClick={onSimulate}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs h-8 px-2.5 rounded-lg inline-flex items-center gap-1 shrink-0 transition-colors cursor-pointer shadow-md"
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>Simulate Quad-Motor</span>
        </button>

        <button
          onClick={onVerifyHash}
          className="bg-slate-800 hover:bg-slate-700 border border-emerald-500/40 text-emerald-400 font-bold text-xs h-8 px-2.5 rounded-lg inline-flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Verify Hash</span>
        </button>

        <button
          onClick={onExportSpec}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-8 px-2.5 rounded-lg inline-flex items-center gap-1 shrink-0 transition-colors cursor-pointer shadow-md"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Spec</span>
        </button>
      </div>

      {/* Specification & Audit Strip */}
      <div className="flex flex-row flex-wrap items-center gap-3 text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">Asset Transfer:</span>
          <span className="text-white font-semibold">20 kHz (0.48ms)</span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">Enterprise:</span>
          <span className="text-amber-300 font-semibold">PostgreSQL 16 + RLS</span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">License:</span>
          <span className="text-emerald-400 font-semibold">MIT Permissive</span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">Audit:</span>
          <span className="text-sky-400 font-semibold">Clean-Room Certified</span>
        </div>
      </div>
    </div>
  );
};
