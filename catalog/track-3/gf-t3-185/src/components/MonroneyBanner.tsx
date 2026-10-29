import React from 'react';
import { Play, CheckCircle2, Download } from 'lucide-react';

interface MonroneyBannerProps {
  onSimulateAVS: () => void;
  onVerifyHash: () => void;
  onExportSpec: () => void;
  isSimulating: boolean;
  isVerifying: boolean;
}

export const MonroneyBanner: React.FC<MonroneyBannerProps> = ({
  onSimulateAVS,
  onVerifyHash,
  onExportSpec,
  isSimulating,
  isVerifying,
}) => {
  return (
    <header className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 md:p-5 shadow-2xl relative">
      {/* a) Top Badge Strip */}
      <div className="flex flex-row flex-wrap items-center gap-2 mb-3">
        <span className="text-amber-400 bg-amber-500/10 border border-amber-500/30 text-xs font-mono font-bold px-2.5 py-1 rounded inline-flex w-auto whitespace-nowrap">
          GF-T3-185
        </span>
        <span className="text-slate-300 bg-slate-800 border border-slate-700 text-xs font-mono font-semibold px-2.5 py-1 rounded inline-flex w-auto whitespace-nowrap">
          NX 450h+ High-G Dynamic Telemetry CORE
        </span>
        <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono font-bold px-2.5 py-1 rounded inline-flex w-auto whitespace-nowrap">
          v1.0.0-PROD
        </span>
      </div>

      {/* b) Title & Description */}
      <h1 className="text-2xl font-black text-white tracking-tight mb-1">
        Apex Executive NX 450h+ High-G Dynamic Telemetry Handling Plug-In Core
      </h1>
      <p className="text-slate-400 text-sm line-clamp-2 mb-4 leading-relaxed">
        Turnkey micro-APA deliverable with linear solenoid AVS damping, predictive deceleration regeneration, and PostgreSQL 16 HMAC ledger.
      </p>

      {/* c) Action Buttons (STRICT SINGLE HORIZONTAL ROW, NEVER VERTICALLY STACKED) */}
      <div className="flex flex-row items-center gap-2 pb-3 mb-3 border-b border-slate-800 overflow-x-auto">
        <button
          onClick={onSimulateAVS}
          disabled={isSimulating}
          className="bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold text-xs h-8 px-2.5 rounded-lg inline-flex items-center gap-1 shrink-0 cursor-pointer transition-colors shadow-sm disabled:opacity-50"
          title="Run dynamic AVS slalom & damping maneuver simulation"
        >
          <Play className={`w-3.5 h-3.5 fill-current ${isSimulating ? 'animate-spin' : ''}`} />
          <span>{isSimulating ? 'Simulating...' : 'Simulate AVS'}</span>
        </button>

        <button
          onClick={onVerifyHash}
          disabled={isVerifying}
          className="bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-emerald-500/40 text-emerald-400 font-bold text-xs h-8 px-2.5 rounded-lg inline-flex items-center gap-1 shrink-0 cursor-pointer transition-colors shadow-sm"
          title="Run cryptographic SHA-256 integrity verification across the ledger"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{isVerifying ? 'Verifying...' : 'Verify Hash'}</span>
        </button>

        <button
          onClick={onExportSpec}
          className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs h-8 px-2.5 rounded-lg inline-flex items-center gap-1 shrink-0 cursor-pointer transition-colors shadow-sm"
          title="Download complete technical documentation as GF_T3_185_SPEC.md"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Spec</span>
        </button>
      </div>

      {/* d) Specification & Audit Strip */}
      <div className="flex flex-row flex-wrap items-center gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-medium">Asset Transfer:</span>
          <span className="text-emerald-400 font-mono font-bold">20 kHz (0.48ms)</span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-medium">Enterprise:</span>
          <span className="text-amber-400 font-mono font-bold">PostgreSQL 16 + RLS</span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-medium">License:</span>
          <span className="text-slate-200 font-mono font-semibold">MIT Permissive</span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-medium">Audit:</span>
          <span className="text-emerald-300 font-mono font-semibold">Clean-Room Certified</span>
        </div>
      </div>
    </header>
  );
};
