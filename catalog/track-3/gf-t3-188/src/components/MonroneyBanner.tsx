import React from 'react';
import { Sliders, ShieldCheck, Download, DollarSign, Award, CheckCircle2 } from 'lucide-react';

interface MonroneyBannerProps {
  onSimulateEkdss: () => void;
  onVerifyHash: () => void;
  onExportSpec: () => void;
}

export const MonroneyBanner: React.FC<MonroneyBannerProps> = ({
  onSimulateEkdss,
  onVerifyHash,
  onExportSpec,
}) => {
  return (
    <header className="relative bg-slate-900 border border-slate-800/80 rounded-2xl p-5 mb-6 shadow-2xl backdrop-blur-md">
      {/* a) Top Badge Strip */}
      <div className="flex flex-row flex-wrap items-center gap-2 mb-3">
        <span className="text-amber-400 bg-amber-500/10 border border-amber-500/30 text-[11px] font-mono font-bold px-2 py-0.5 rounded inline-flex w-auto whitespace-nowrap items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
          GF-T3-188
        </span>
        <span className="text-slate-300 bg-slate-800 border border-slate-700 text-[11px] font-mono font-semibold px-2 py-0.5 rounded inline-flex w-auto whitespace-nowrap">
          GX 550 E-KDSS
        </span>
        <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono font-bold px-2 py-0.5 rounded inline-flex w-auto whitespace-nowrap items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
          v1.0.0-PROD
        </span>
      </div>

      {/* b) Title & Description */}
      <h1 className="text-2xl font-black text-white tracking-tight mb-1">
        Lexus GX 550 Overtrail+ Core
      </h1>
      <p className="text-slate-400 text-sm line-clamp-2 mb-4 leading-relaxed">
        Turnkey micro-APA deliverable with E-KDSS electronic stabilizer bar disconnect, 5-speed crawl control arbitration, and PostgreSQL 16 HMAC ledger.
      </p>

      {/* c) Action Buttons (STRICT SINGLE HORIZONTAL ROW, NEVER VERTICALLY STACKED) */}
      <div className="flex flex-row items-center gap-1.5 pb-3 mb-3 border-b border-slate-800 overflow-x-auto">
        <button
          onClick={onSimulateEkdss}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-2 h-8 shrink-0 whitespace-nowrap rounded-lg inline-flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-sm"
          title="Jump to E-KDSS & Crawl Control Simulation"
        >
          <Sliders className="w-3.5 h-3.5 shrink-0" />
          <span>Simulate E-KDSS</span>
        </button>

        <button
          onClick={onVerifyHash}
          className="bg-slate-800 hover:bg-slate-700 border border-emerald-500/40 text-emerald-400 font-bold text-xs px-2 h-8 shrink-0 whitespace-nowrap rounded-lg inline-flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-sm"
          title="Verify Cryptographic HMAC-SHA256 Chain"
        >
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          <span>Verify Hash</span>
        </button>

        <button
          onClick={onExportSpec}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-2 h-8 shrink-0 whitespace-nowrap rounded-lg inline-flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-sm"
          title="Export Full Master Spec as GF_T3_188_SPEC.md"
        >
          <Download className="w-3.5 h-3.5 shrink-0" />
          <span>Export Spec</span>
        </button>
      </div>

      {/* d) Valuation & Audit Strip */}
      <div className="flex flex-row flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1 text-slate-300">
          <DollarSign className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-400">Buyout:</span>
          <span className="font-mono font-bold text-amber-400">$45,000 USD</span>
        </div>
        <span className="text-slate-600">|</span>
        <div className="flex items-center gap-1 text-slate-300">
          <Award className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-400">Enterprise:</span>
          <span className="font-mono font-bold text-emerald-400">$125,000 USD</span>
        </div>
        <span className="text-slate-600">|</span>
        <div className="text-slate-300">
          <span className="font-semibold text-slate-200">MIT Permissive</span>
        </div>
        <span className="text-slate-600">|</span>
        <div className="text-emerald-400 font-semibold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          Clean-Room Certified
        </div>
      </div>
    </header>
  );
};
