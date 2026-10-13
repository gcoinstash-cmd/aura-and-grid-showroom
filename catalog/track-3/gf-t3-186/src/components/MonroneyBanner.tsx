import React from 'react';
import { Play, ShieldCheck, Download, CheckCircle2 } from 'lucide-react';
import { downloadSpecFile } from '../utils/exportSpec';

interface MonroneyBannerProps {
  onSimulateEfour: () => void;
  onVerifyHash: () => void;
}

export const MonroneyBanner: React.FC<MonroneyBannerProps> = ({
  onSimulateEfour,
  onVerifyHash,
}) => {
  return (
    <header className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-5 mb-6 shadow-xl backdrop-blur-md">
      {/* a) Top Badge Strip */}
      <div className="flex flex-row flex-wrap items-center gap-2 mb-3">
        <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold px-2.5 py-1 rounded inline-flex w-auto whitespace-nowrap">
          GF-T3-186
        </span>
        <span className="bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono font-semibold px-2.5 py-1 rounded inline-flex w-auto whitespace-nowrap">
          UX 300h E-FOUR CORE
        </span>
        <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold px-2.5 py-1 rounded inline-flex w-auto whitespace-nowrap">
          v1.0.0-PROD
        </span>
      </div>

      {/* b) Title & Description */}
      <h1 className="text-2xl font-black text-white tracking-tight mb-1">
        Lexus UX 300h F SPORT Handling Core
      </h1>
      <p className="text-slate-400 text-sm line-clamp-2 mb-4 leading-relaxed">
        Turnkey micro-APA deliverable with 5th-gen hybrid power split device, E-Four electronic rear axle torque control, and PostgreSQL 16 HMAC ledger.
      </p>

      {/* c) Action Buttons (STRICT SINGLE HORIZONTAL ROW, NEVER VERTICALLY STACKED) */}
      <div className="flex flex-row items-center gap-2 pb-3 mb-3 border-b border-slate-800 overflow-x-auto">
        <button
          onClick={onSimulateEfour}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs h-8 px-2.5 rounded-lg inline-flex items-center gap-1 shrink-0 transition-colors shadow-sm cursor-pointer"
          title="Trigger high-load E-Four AWD slip & transient torque vectoring cycle"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Simulate E-Four</span>
        </button>

        <button
          onClick={onVerifyHash}
          className="bg-slate-800 hover:bg-slate-700 border border-emerald-500/40 text-emerald-400 font-bold text-xs h-8 px-2.5 rounded-lg inline-flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
          title="Verify HMAC-SHA256 signature chain across all partitioned ledger blocks"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Verify Hash</span>
        </button>

        <button
          onClick={downloadSpecFile}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-8 px-2.5 rounded-lg inline-flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
          title="Download complete technical documentation as GF_T3_186_SPEC.md"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Spec</span>
        </button>
      </div>

      {/* d) Valuation & Audit Strip */}
      <div className="flex flex-row flex-wrap items-center gap-3 text-xs text-slate-400">
        <span className="font-semibold text-slate-200">
          Buyout: <strong className="text-amber-400 font-mono font-bold">$45,000 USD</strong>
        </span>
        <span className="text-slate-600" aria-hidden="true">|</span>
        <span className="font-semibold text-slate-200">
          Enterprise: <strong className="text-emerald-400 font-mono font-bold">$125,000 USD</strong>
        </span>
        <span className="text-slate-600" aria-hidden="true">|</span>
        <span className="inline-flex items-center gap-1 text-slate-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          MIT Permissive
        </span>
        <span className="text-slate-600" aria-hidden="true">|</span>
        <span className="inline-flex items-center gap-1 text-slate-300">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          Clean-Room Certified
        </span>
      </div>
    </header>
  );
};
