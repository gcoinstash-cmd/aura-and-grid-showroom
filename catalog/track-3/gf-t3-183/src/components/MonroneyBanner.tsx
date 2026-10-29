import React from 'react';
import { Play, ShieldCheck, Download } from 'lucide-react';

interface MonroneyBannerProps {
  onSimulate: () => void;
  onVerifyHash: () => void;
  onExportSpec: () => void;
  isSimulating?: boolean;
}

export const MonroneyBanner: React.FC<MonroneyBannerProps> = ({
  onSimulate,
  onVerifyHash,
  onExportSpec,
  isSimulating = false,
}) => {
  return (
    <header className="relative w-full bg-slate-900 border-b border-slate-800 px-4 py-4 md:px-6">
      {/* a) Top Badge Strip */}
      <div className="flex flex-row flex-wrap items-center gap-2 mb-3">
        <span className="text-amber-400 bg-amber-500/10 border border-amber-500/30 text-[11px] font-mono font-bold px-2 py-0.5 rounded inline-flex w-auto whitespace-nowrap">
          GF-T3-183
        </span>
        <span className="text-slate-300 bg-slate-800 border border-slate-700 text-[11px] font-mono font-semibold px-2 py-0.5 rounded inline-flex w-auto whitespace-nowrap">
          RZ 450e BEV CORE
        </span>
        <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono font-bold px-2 py-0.5 rounded inline-flex w-auto whitespace-nowrap">
          v1.0.0-PROD
        </span>
      </div>

      {/* b) Title & Description */}
      <h1 className="text-2xl font-black text-white tracking-tight mb-1">
        Apex Executive RZ 450e DualVectorTorque Dual-Motor Electric Core
      </h1>
      <p className="text-slate-400 text-xs md:text-sm line-clamp-2 mb-4">
        Turnkey micro-APA deliverable with dual SiC inverter flux weakening, steer-by-wire variable ratio steering, and PostgreSQL 16 HMAC ledger.
      </p>

      {/* c) Action Buttons (STRICT SINGLE HORIZONTAL ROW, NEVER VERTICALLY STACKED) */}
      <div className="flex flex-row items-center gap-2 pb-3 mb-3 border-b border-slate-800 overflow-x-auto">
        <button
          type="button"
          onClick={onSimulate}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs h-8 px-2.5 rounded-lg inline-flex items-center gap-1 shrink-0 cursor-pointer transition-colors shadow-sm active:scale-98"
          title="Trigger dynamic DualVectorTorque simulation iteration"
        >
          <Play className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
          <span className="whitespace-nowrap">Simulate DualVectorTorque</span>
        </button>

        <button
          type="button"
          onClick={onVerifyHash}
          className="bg-slate-800 hover:bg-slate-700 border border-emerald-500/40 text-emerald-400 font-bold text-xs h-8 px-2.5 rounded-lg inline-flex items-center gap-1 shrink-0 cursor-pointer transition-colors active:scale-98"
          title="Verify telemetry HMAC-SHA256 signature chain"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="whitespace-nowrap">Verify Hash</span>
        </button>

        <button
          type="button"
          onClick={onExportSpec}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-8 px-2.5 rounded-lg inline-flex items-center gap-1 shrink-0 cursor-pointer transition-colors shadow-sm active:scale-98"
          title="Download complete GF_T3_183_SPEC.md architectural vault deliverable"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="whitespace-nowrap">Export Spec</span>
        </button>
      </div>

      {/* d) Specification & Audit Strip */}
      <div className="flex flex-row flex-wrap items-center gap-3 text-xs text-slate-400">
        <span className="text-slate-300">
          <strong className="text-amber-400 font-medium">Asset Transfer:</strong> 20 kHz (0.48ms)
        </span>
        <span className="text-slate-600" aria-hidden="true">|</span>
        <span className="text-slate-300">
          <strong className="text-emerald-400 font-medium">Enterprise:</strong> PostgreSQL 16 + RLS
        </span>
        <span className="text-slate-600" aria-hidden="true">|</span>
        <span className="text-slate-300 font-mono">MIT Permissive</span>
        <span className="text-slate-600" aria-hidden="true">|</span>
        <span className="text-emerald-400 font-mono font-medium">Clean-Room Certified</span>
      </div>
    </header>
  );
};
