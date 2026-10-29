import React from 'react';
import { Activity, ShieldCheck, Download, ExternalLink } from 'lucide-react';

interface MonroneyBannerProps {
  onSimulate: () => void;
  onVerifyLedger: () => void;
  onExportSpec: () => void;
}

export const MonroneyBanner: React.FC<MonroneyBannerProps> = ({
  onSimulate,
  onVerifyLedger,
  onExportSpec,
}) => {
  return (
    <header className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-4 mb-6 shadow-xl">
      {/* 1. Single Inline Badges Row */}
      <div className="flex flex-row flex-wrap items-center gap-2 mb-3">
        <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold whitespace-nowrap">
          GF-T3-178
        </span>
        <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs font-semibold whitespace-nowrap">
          Apex Executive LS 500 AWD CORE
        </span>
        <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold whitespace-nowrap">
          v1.0.0-PROD
        </span>
      </div>

      {/* 2. Main Title */}
      <h1 className="text-xl md:text-2xl font-black text-white tracking-tight mb-1">
        Apex Executive AWD Flagship Core
      </h1>
      <p className="text-slate-400 text-xs md:text-sm line-clamp-2 mb-4 leading-relaxed">
        Turnkey micro-APA asset transfer deliverable with 2,000 Hz FxLMS acoustic noise cancellation, twin-turbo V35A-FTS wastegate regulation, and PostgreSQL 16 HMAC ledger.
      </p>

      {/* 3. Action Buttons Row (Strictly Inline-Flex & Compact) */}
      <div className="flex flex-row items-center gap-2 pb-4 mb-3 border-b border-slate-800 overflow-x-auto">
        <button
          onClick={onSimulate}
          className="shrink-0 inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs whitespace-nowrap transition-colors cursor-pointer"
        >
          <Activity className="w-3.5 h-3.5 shrink-0" />
          <span>Simulate FxLMS</span>
        </button>
        <button
          onClick={onVerifyLedger}
          className="shrink-0 inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-emerald-500/40 text-emerald-400 font-bold text-xs whitespace-nowrap transition-colors cursor-pointer"
        >
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          <span>Verify Ledger</span>
        </button>
        <button
          onClick={onExportSpec}
          className="shrink-0 inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs whitespace-nowrap transition-colors shadow-sm cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 shrink-0" />
          <span>Export Spec</span>
        </button>
      </div>

      {/* 4. Compact Specification Bar */}
      <div className="flex flex-row flex-wrap items-center gap-3 text-xs">
        <div className="inline-flex items-center gap-1 text-slate-400">
          Asset Transfer: <span className="font-bold text-amber-400">20 kHz (0.48ms)</span>
        </div>
        <div className="inline-flex items-center gap-1 text-slate-400">
          Vault: <span className="font-bold text-white">PostgreSQL 16 + RLS</span>
        </div>
        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium">
          MIT Permissive
        </span>
        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-medium">
          Clean-Room Clean
        </span>
      </div>
    </header>
  );
};
