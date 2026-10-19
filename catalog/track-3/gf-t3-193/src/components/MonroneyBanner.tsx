import React from 'react';
import { Gauge, ShieldCheck, Download, DollarSign, Award } from 'lucide-react';
import { downloadSpecFile } from '../utils/specExporter';

interface MonroneyBannerProps {
  onSimulateThrottle: () => void;
  onVerifyHash: () => void;
  isSimulating: boolean;
}

export const MonroneyBanner: React.FC<MonroneyBannerProps> = ({
  onSimulateThrottle,
  onVerifyHash,
  isSimulating,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 mb-6 shadow-xl">
      {/* a) Top Badge Strip */}
      <div className="flex flex-row flex-wrap items-center gap-1.5 mb-3">
        <span className="text-amber-400 bg-amber-500/10 border border-amber-500/30 text-[11px] font-mono font-bold px-2 py-0.5 rounded inline-flex w-auto whitespace-nowrap items-center">
          GF-T3-193
        </span>
        <span className="text-slate-300 bg-slate-800 border border-slate-700 text-[11px] font-mono font-semibold px-2 py-0.5 rounded inline-flex w-auto whitespace-nowrap items-center">
          IS 500 V8 CORE
        </span>
        <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono font-bold px-2 py-0.5 rounded inline-flex w-auto whitespace-nowrap items-center">
          v1.0.0-PROD
        </span>
      </div>

      {/* b) Title & Description */}
      <h1 className="text-2xl font-black text-white tracking-tight mb-1">
        Heavy Overland Dynamics Platform IS 500 High-G Dynamic Telemetry Core
      </h1>
      <p className="text-slate-400 text-sm line-clamp-2 mb-4 leading-relaxed">
        Turnkey micro-APA deliverable with naturally aspirated 2UR-GSE 5.0L V8 acoustic intake runner tuning, Torsen LSD yaw control, and PostgreSQL 16 HMAC ledger.
      </p>

      {/* c) Action Buttons (STRICT SINGLE HORIZONTAL ROW, NEVER VERTICALLY STACKED) */}
      <div className="flex flex-row items-center gap-1.5 pb-3 mb-3 border-b border-slate-800 overflow-x-auto">
        <button
          onClick={onSimulateThrottle}
          className={`bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs h-8 px-2.5 rounded-lg inline-flex items-center gap-1 shrink-0 transition-all ${
            isSimulating ? 'ring-2 ring-amber-300 animate-pulse' : ''
          }`}
          title="Simulate dynamic V8 throttle sweep across 3,600 RPM intake crossover"
        >
          <Gauge className="w-3.5 h-3.5" />
          <span>{isSimulating ? 'Sweeping RPM...' : 'Simulate V8 Throttle'}</span>
        </button>

        <button
          onClick={onVerifyHash}
          className="bg-slate-800 hover:bg-slate-700 border border-emerald-500/40 text-emerald-400 font-bold text-xs h-8 px-2.5 rounded-lg inline-flex items-center gap-1 shrink-0 transition-colors"
          title="Verify active SHA-256 and HMAC cryptographic signatures"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Verify Hash</span>
        </button>

        <button
          onClick={downloadSpecFile}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-8 px-2.5 rounded-lg inline-flex items-center gap-1 shrink-0 transition-colors"
          title="Download master GF_T3_193_SPEC.md vault artifact"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Spec</span>
        </button>
      </div>

      {/* d) Specification & Audit Strip */}
      <div className="flex flex-row flex-wrap items-center gap-3 text-xs text-slate-300">
        <div className="flex items-center gap-1">
          <DollarSign className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-slate-400">Asset Transfer:</span>
          <span className="font-semibold text-white font-mono">20 kHz (0.48ms)</span>
        </div>
        <span className="text-slate-600 hidden sm:inline" aria-hidden="true">|</span>
        <div className="flex items-center gap-1">
          <span className="text-slate-400">Enterprise:</span>
          <span className="font-semibold text-amber-400 font-mono">PostgreSQL 16 + RLS</span>
        </div>
        <span className="text-slate-600 hidden sm:inline" aria-hidden="true">|</span>
        <div className="flex items-center gap-1">
          <span className="text-slate-400">License:</span>
          <span className="font-medium text-slate-200">MIT Permissive</span>
        </div>
        <span className="text-slate-600 hidden sm:inline" aria-hidden="true">|</span>
        <div className="flex items-center gap-1">
          <Award className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="font-medium text-emerald-400">Clean-Room Certified</span>
        </div>
      </div>
    </div>
  );
};
