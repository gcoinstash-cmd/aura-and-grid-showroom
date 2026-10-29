import React from 'react';
import { Play, ShieldCheck, Download, CheckCircle2, RotateCw } from 'lucide-react';

interface MonroneyBannerProps {
  onSimulate: () => void;
  onVerifyHash: () => void;
  onExportSpec: () => void;
  isSimulating: boolean;
  hashVerified: boolean;
}

export const MonroneyBanner: React.FC<MonroneyBannerProps> = ({
  onSimulate,
  onVerifyHash,
  onExportSpec,
  isSimulating,
  hashVerified,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 mb-6 shadow-2xl">
      {/* a) Top Badge Strip */}
      <div className="flex flex-row flex-wrap items-center gap-1.5 mb-3">
        <span className="text-amber-400 bg-amber-500/10 border border-amber-500/30 text-[11px] font-mono font-bold px-2 py-0.5 rounded inline-flex w-auto whitespace-nowrap">
          GF-T3-192
        </span>
        <span className="text-slate-300 bg-slate-800 border border-slate-700 text-[11px] font-mono font-semibold px-2 py-0.5 rounded inline-flex w-auto whitespace-nowrap">
          High-Output Multi-Node Core DRS CORE
        </span>
        <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono font-bold px-2 py-0.5 rounded inline-flex w-auto whitespace-nowrap">
          v1.0.0-PROD
        </span>
      </div>

      {/* b) Title & Description */}
      <h1 className="text-2xl font-black text-white tracking-tight mb-1">
        Apex Executive High-Output Multi-Node Core DUAL_VECTOR_TORQUE DRS Core
      </h1>
      <p className="text-slate-400 text-sm line-clamp-2 mb-4 leading-relaxed">
        Turnkey micro-APA deliverable with Dynamic Rear Steering crab-angle arbitration, DUAL_VECTOR_TORQUE PHEV e-Axle vectoring, and PostgreSQL 16 HMAC ledger.
      </p>

      {/* c) Action Buttons (STRICT SINGLE HORIZONTAL ROW, NEVER VERTICALLY STACKED) */}
      <div className="flex flex-row items-center gap-1.5 pb-3 mb-3 border-b border-slate-800 overflow-x-auto">
        <button
          onClick={onSimulate}
          type="button"
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs h-8 px-2.5 rounded-lg inline-flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
          title="Run Dynamic Rear Steering Physics Simulation"
        >
          {isSimulating ? (
            <>
              <RotateCw className="w-3.5 h-3.5 animate-spin" />
              <span>Simulating...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Simulate DRS</span>
            </>
          )}
        </button>

        <button
          onClick={onVerifyHash}
          type="button"
          className="bg-slate-800 hover:bg-slate-700 border border-emerald-500/40 text-emerald-400 font-bold text-xs h-8 px-2.5 rounded-lg inline-flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
          title="Verify Cryptographic HMAC-SHA256 Telemetry Hash"
        >
          {hashVerified ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Hash Verified</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verify Hash</span>
            </>
          )}
        </button>

        <button
          onClick={onExportSpec}
          type="button"
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-8 px-2.5 rounded-lg inline-flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
          title="Export GF_T3_192_SPEC.md Master Vault Specification"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Spec</span>
        </button>
      </div>

      {/* d) Specification & Audit Strip */}
      <div className="flex flex-row flex-wrap items-center gap-3 text-xs">
        <span className="text-slate-300 font-medium">
          Execution: <strong className="text-amber-400 font-mono font-bold">20 kHz</strong>
        </span>
        <span className="text-slate-600 font-bold" aria-hidden="true">|</span>
        <span className="text-slate-300 font-medium">
          Moat: <strong className="text-emerald-400 font-mono font-bold">PostgreSQL 16</strong>
        </span>
        <span className="text-slate-600 font-bold" aria-hidden="true">|</span>
        <span className="text-slate-300 font-medium">
          <strong className="text-amber-400 font-semibold">MIT Permissive</strong>
        </span>
        <span className="text-slate-600 font-bold" aria-hidden="true">|</span>
        <span className="text-slate-300 font-medium inline-flex items-center gap-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <strong className="text-slate-200 font-semibold">Clean-Room Certified</strong>
        </span>
      </div>
    </div>
  );
};
