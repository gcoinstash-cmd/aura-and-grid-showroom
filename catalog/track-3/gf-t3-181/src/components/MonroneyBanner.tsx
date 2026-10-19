import React from 'react';
import { Gauge, ShieldCheck, Download } from 'lucide-react';

interface MonroneyBannerProps {
  onSimulateThrottle: () => void;
  onVerifyHash: () => void;
  onExportSpec: () => void;
  isSimulating?: boolean;
}

export const MonroneyBanner: React.FC<MonroneyBannerProps> = ({
  onSimulateThrottle,
  onVerifyHash,
  onExportSpec,
  isSimulating = false,
}) => {
  return (
    <div className="relative w-full bg-slate-900/90 border border-slate-800 rounded-xl p-4 md:p-5 shadow-2xl backdrop-blur-md">
      {/* a) Top Badge Strip */}
      <div className="flex flex-row flex-wrap items-center gap-2 mb-3">
        <span className="text-amber-400 bg-amber-500/10 border border-amber-500/30 text-[11px] font-mono font-bold px-2 py-0.5 rounded inline-flex w-auto whitespace-nowrap">
          GF-T3-181
        </span>
        <span className="text-slate-300 bg-slate-800 border border-slate-700 text-[11px] font-mono font-semibold px-2 py-0.5 rounded inline-flex w-auto whitespace-nowrap">
          IS 500 High-G Dynamic Telemetry CORE
        </span>
        <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono font-bold px-2 py-0.5 rounded inline-flex w-auto whitespace-nowrap">
          v1.0.0-PROD
        </span>
      </div>

      {/* b) Title & Description */}
      <h1 className="text-2xl font-black text-white tracking-tight mb-1">
        Heavy Overland Dynamics Platform IS 500 High-G Dynamic Telemetry Core
      </h1>
      <p className="text-slate-400 text-xs md:text-sm line-clamp-2 mb-4">
        Turnkey micro-APA deliverable with 2UR-GSE 5.0L V8 throttle mapping, Torsen LSD thermal viscosity monitoring, and PostgreSQL 16 HMAC ledger.
      </p>

      {/* c) Action Buttons (STRICT SINGLE HORIZONTAL ROW, NEVER VERTICALLY STACKED) */}
      <div className="flex flex-row items-center gap-2 pb-3 mb-3 border-b border-slate-800 overflow-x-auto">
        <button
          onClick={onSimulateThrottle}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs h-8 px-2.5 rounded-lg inline-flex items-center gap-1 shrink-0 cursor-pointer transition-all active:scale-95"
          title="Toggle or trigger 2UR-GSE 1,600 Hz throttle actuation"
        >
          <Gauge className="w-3.5 h-3.5" />
          <span>{isSimulating ? 'Stop Throttle' : 'Simulate Throttle'}</span>
        </button>

        <button
          onClick={onVerifyHash}
          className="bg-slate-800 hover:bg-slate-700 border border-emerald-500/40 text-emerald-400 font-bold text-xs h-8 px-2.5 rounded-lg inline-flex items-center gap-1 shrink-0 cursor-pointer transition-all active:scale-95"
          title="Verify SHA-256 HMAC integrity of all timeseries ledger blocks"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Verify Hash</span>
        </button>

        <button
          onClick={onExportSpec}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-8 px-2.5 rounded-lg inline-flex items-center gap-1 shrink-0 cursor-pointer transition-all active:scale-95 shadow-sm"
          title="Download GF_T3_181_SPEC.md deliverable file"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Spec</span>
        </button>
      </div>

      {/* d) Specification & Audit Strip */}
      <div className="flex flex-row flex-wrap items-center gap-3 text-xs">
        <span className="text-slate-300">
          <strong className="text-white font-semibold">Asset Transfer:</strong> 20 kHz (0.48ms)
        </span>
        <span className="text-slate-600">|</span>
        <span className="text-slate-300">
          <strong className="text-white font-semibold">Enterprise:</strong> PostgreSQL 16 + RLS
        </span>
        <span className="text-slate-600">|</span>
        <span className="text-emerald-400 font-mono font-medium">MIT Permissive</span>
        <span className="text-slate-600">|</span>
        <span className="text-amber-400 font-mono font-medium">Clean-Room Certified</span>
      </div>
    </div>
  );
};
