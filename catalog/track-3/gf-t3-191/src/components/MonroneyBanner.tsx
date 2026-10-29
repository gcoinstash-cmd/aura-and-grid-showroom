import React from 'react';
import { Play, ShieldCheck, Download, Award, FileCode, CheckCircle2 } from 'lucide-react';

interface MonroneyBannerProps {
  onSimulatePitch: () => void;
  onVerifyHash: () => void;
  onExportSpec: () => void;
}

export const MonroneyBanner: React.FC<MonroneyBannerProps> = ({
  onSimulatePitch,
  onVerifyHash,
  onExportSpec,
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 mb-5 shadow-2xl relative overflow-hidden backdrop-blur-md">
      {/* Decorative subtle ambient glow */}
      <div className="absolute top-0 right-0 w-80 h-32 bg-amber-500/5 blur-3xl pointer-events-none" />

      {/* a) Top Badge Strip */}
      <div className="flex flex-row flex-wrap items-center gap-1.5 mb-3">
        <span className="text-amber-400 bg-amber-500/10 border border-amber-500/30 text-[11px] font-mono font-bold px-2 py-0.5 rounded inline-flex w-auto whitespace-nowrap">
          GF-T3-191
        </span>
        <span className="text-slate-300 bg-slate-800 border border-slate-700 text-[11px] font-mono font-semibold px-2 py-0.5 rounded inline-flex w-auto whitespace-nowrap">
          LM 500h COMFORT CORE
        </span>
        <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono font-bold px-2 py-0.5 rounded inline-flex w-auto whitespace-nowrap">
          v1.0.0-PROD
        </span>
      </div>

      {/* b) Title & Description */}
      <h1 className="text-2xl font-black text-white tracking-tight mb-1">
        Apex Executive Mover Core
      </h1>
      <p className="text-slate-400 text-sm line-clamp-2 mb-4 leading-relaxed">
        Turnkey micro-APA deliverable with Rear Comfort braking pitch control, electrochromic partition acoustic isolation, and PostgreSQL 16 HMAC ledger.
      </p>

      {/* c) Action Buttons (STRICT SINGLE HORIZONTAL ROW, NEVER VERTICALLY STACKED) */}
      <div className="flex flex-row items-center gap-1.5 pb-3 mb-3 border-b border-slate-800 overflow-x-auto">
        <button
          onClick={onSimulatePitch}
          type="button"
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs h-8 px-2.5 rounded-lg inline-flex items-center gap-1 shrink-0 cursor-pointer transition-colors active:scale-95 shadow-sm"
          title="Open Real-Time Pitch Suppression Simulator"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Simulate Pitch</span>
        </button>

        <button
          onClick={onVerifyHash}
          type="button"
          className="bg-slate-800 hover:bg-slate-700 border border-emerald-500/40 text-emerald-400 font-bold text-xs h-8 px-2.5 rounded-lg inline-flex items-center gap-1 shrink-0 cursor-pointer transition-colors active:scale-95 shadow-sm"
          title="Verify Cryptographic HMAC-SHA256 Ledger Digest"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Verify Hash</span>
        </button>

        <button
          onClick={onExportSpec}
          type="button"
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-8 px-2.5 rounded-lg inline-flex items-center gap-1 shrink-0 cursor-pointer transition-colors active:scale-95 shadow-sm"
          title="Download Complete GF_T3_191_SPEC.md Master Vault Spec"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Spec</span>
        </button>
      </div>

      {/* d) Specification & Audit Strip */}
      <div className="flex flex-row flex-wrap items-center gap-3 text-xs">
        <div className="inline-flex items-center gap-1.5 text-slate-300 font-mono">
          <span className="text-slate-500 uppercase font-semibold">Asset Transfer:</span>
          <span className="text-amber-400 font-bold">20 kHz (0.48ms)</span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="inline-flex items-center gap-1.5 text-slate-300 font-mono">
          <span className="text-slate-500 uppercase font-semibold">Enterprise:</span>
          <span className="text-emerald-400 font-bold">PostgreSQL 16 + RLS</span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="inline-flex items-center gap-1.5 text-slate-300 font-mono">
          <FileCode className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-blue-300 font-medium">MIT Permissive</span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="inline-flex items-center gap-1.5 text-slate-300 font-mono">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-emerald-300 font-medium">Clean-Room Certified</span>
        </div>
      </div>
    </div>
  );
};
