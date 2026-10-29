import React from 'react';
import { Gauge, ShieldCheck, Download, CheckCircle, Sparkles } from 'lucide-react';

interface MonroneyBannerProps {
  onSimulateShift: () => void;
  onVerifyHash: () => void;
  onExportSpec: () => void;
  lastActionMessage?: string | null;
  hashVerified?: boolean;
}

export const MonroneyBanner: React.FC<MonroneyBannerProps> = ({
  onSimulateShift,
  onVerifyHash,
  onExportSpec,
  lastActionMessage,
  hashVerified = true,
}) => {
  return (
    <header className="relative w-full bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-2xl backdrop-blur-md mb-6">
      {/* a) Top Badge Strip */}
      <div className="flex flex-row flex-wrap items-center gap-1.5 mb-3">
        <span className="text-amber-400 bg-amber-500/10 border border-amber-500/30 text-[11px] font-mono font-bold px-2 py-0.5 rounded inline-flex w-auto whitespace-nowrap items-center gap-1">
          <Sparkles className="w-3 h-3 inline text-amber-400" />
          GF-T3-190
        </span>
        <span className="text-slate-300 bg-slate-800 border border-slate-700 text-[11px] font-mono font-semibold px-2 py-0.5 rounded inline-flex w-auto whitespace-nowrap">
          ELECTRIFIED SPORT CORE
        </span>
        <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono font-bold px-2 py-0.5 rounded inline-flex w-auto whitespace-nowrap items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          v1.0.0-PROD
        </span>
      </div>

      {/* b) Title & Description */}
      <h1 className="text-2xl font-black text-white tracking-tight mb-1">
        Apex Executive Electrified Sport Solid-State Core
      </h1>
      <p className="text-slate-400 text-sm line-clamp-2 mb-4 leading-relaxed">
        Turnkey micro-APA deliverable with solid-state battery thermal matrix, simulated virtual manual transmission, and PostgreSQL 16 HMAC ledger.
      </p>

      {/* c) Action Buttons (STRICT SINGLE HORIZONTAL ROW, NEVER VERTICALLY STACKED) */}
      <div className="flex flex-row items-center gap-1.5 pb-3 mb-3 border-b border-slate-800 overflow-x-auto">
        <button
          type="button"
          onClick={onSimulateShift}
          className="bg-amber-500 hover:bg-amber-400 active:scale-95 transition-all text-slate-950 font-bold text-xs h-8 px-2.5 rounded-lg inline-flex items-center gap-1 shrink-0 cursor-pointer shadow-md shadow-amber-500/20"
          title="Trigger a virtual gear shift with torque cut and ledger logging"
        >
          <Gauge className="w-3.5 h-3.5 shrink-0" />
          <span>Simulate Shift</span>
        </button>

        <button
          type="button"
          onClick={onVerifyHash}
          className="bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all border border-emerald-500/40 text-emerald-400 font-bold text-xs h-8 px-2.5 rounded-lg inline-flex items-center gap-1 shrink-0 cursor-pointer shadow-sm"
          title="Cryptographically verify HMAC-SHA256 signature chain"
        >
          <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
          <span>Verify Hash</span>
        </button>

        <button
          type="button"
          onClick={onExportSpec}
          className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all text-white font-bold text-xs h-8 px-2.5 rounded-lg inline-flex items-center gap-1 shrink-0 cursor-pointer shadow-md shadow-emerald-600/20"
          title="Download complete GF_T3_190_SPEC.md vault archive"
        >
          <Download className="w-3.5 h-3.5 shrink-0" />
          <span>Export Spec</span>
        </button>

        {lastActionMessage && (
          <div className="ml-auto pl-3 flex items-center gap-1.5 text-xs text-amber-300 font-mono shrink-0 animate-fadeIn bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
            <CheckCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>{lastActionMessage}</span>
          </div>
        )}
      </div>

      {/* d) Specification & Audit Strip */}
      <div className="flex flex-row flex-wrap items-center gap-3 text-xs text-slate-400">
        <div className="inline-flex items-center gap-1.5 font-medium">
          <span className="text-slate-500">Asset Transfer:</span>
          <span className="text-emerald-400 font-bold font-mono">20 kHz (0.48ms)</span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="inline-flex items-center gap-1.5 font-medium">
          <span className="text-slate-500">Enterprise:</span>
          <span className="text-amber-400 font-bold font-mono">PostgreSQL 16 + RLS</span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="inline-flex items-center gap-1 text-slate-300 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>MIT Permissive</span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="inline-flex items-center gap-1 text-emerald-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 inline" />
          <span>Clean-Room Certified</span>
        </div>
        {hashVerified && (
          <>
            <span className="text-slate-700 hidden sm:inline">|</span>
            <span className="text-emerald-400/90 font-mono text-[11px] hidden sm:inline-flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Ledger HMAC Root Valid
            </span>
          </>
        )}
      </div>
    </header>
  );
};
