import React from 'react';
import { Activity, ShieldCheck, Download } from 'lucide-react';

interface MonroneyBannerProps {
  isSimulating: boolean;
  onSimulateSwingValve: () => void;
  onVerifyHash: () => void;
  onExportSpec: () => void;
  hashVerifiedState: 'idle' | 'verifying' | 'verified';
  lastVerifiedHash: string;
}

export const MonroneyBanner: React.FC<MonroneyBannerProps> = ({
  isSimulating,
  onSimulateSwingValve,
  onVerifyHash,
  onExportSpec,
  hashVerifiedState,
  lastVerifiedHash,
}) => {
  return (
    <header className="relative bg-slate-900/90 border border-slate-800 rounded-xl p-5 mb-6 shadow-sm">
      {/* a) Top Badge Strip */}
      <div className="flex flex-row flex-wrap items-center gap-2 mb-3">
        <span className="text-amber-400 bg-amber-500/10 border border-amber-500/30 text-xs font-mono font-bold px-2.5 py-1 rounded inline-flex w-auto whitespace-nowrap">
          GF-T3-187
        </span>
        <span className="text-slate-300 bg-slate-800 border border-slate-700 text-xs font-mono font-semibold px-2.5 py-1 rounded inline-flex w-auto whitespace-nowrap">
          ES 300h SWING-VALVE CORE
        </span>
        <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono font-bold px-2.5 py-1 rounded inline-flex w-auto whitespace-nowrap">
          v1.0.0-PROD
        </span>
      </div>

      {/* b) Title & Description */}
      <h1 className="text-2xl font-black text-white tracking-tight mb-1">
        Heavy Overland Dynamics Platform ES 300h Ultra Luxury Core
      </h1>
      <p className="text-slate-400 text-sm line-clamp-2 mb-4 leading-relaxed">
        Turnkey micro-APA deliverable with swing-valve shock damping, Atkinson-cycle regenerative energy arbitration, and PostgreSQL 16 HMAC ledger.
      </p>

      {/* c) Action Buttons (STRICT SINGLE HORIZONTAL ROW, NEVER VERTICALLY STACKED) */}
      <div className="flex flex-row items-center gap-2 pb-3 mb-3 border-b border-slate-800 overflow-x-auto">
        <button
          type="button"
          onClick={onSimulateSwingValve}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs h-8 px-2.5 rounded-lg inline-flex items-center gap-1 shrink-0 whitespace-nowrap transition-colors cursor-pointer"
        >
          <Activity className="w-4 h-4 shrink-0" />
          <span>{isSimulating ? 'Pulse 0.002 m/s Active' : 'Simulate Swing-Valve'}</span>
        </button>

        <button
          type="button"
          onClick={onVerifyHash}
          className="bg-slate-800 hover:bg-slate-700 border border-emerald-500/40 text-emerald-400 font-bold text-xs h-8 px-2.5 rounded-lg inline-flex items-center gap-1 shrink-0 whitespace-nowrap transition-colors cursor-pointer"
        >
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>
            {hashVerifiedState === 'verifying'
              ? 'Verifying HMAC...'
              : hashVerifiedState === 'verified'
              ? `Verified (${lastVerifiedHash.slice(0, 8)})`
              : 'Verify Hash'}
          </span>
        </button>

        <button
          type="button"
          onClick={onExportSpec}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-8 px-2.5 rounded-lg inline-flex items-center gap-1 shrink-0 whitespace-nowrap transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4 shrink-0" />
          <span>Export Spec</span>
        </button>
      </div>

      {/* d) Specification & Audit Strip */}
      <div className="flex flex-row flex-wrap items-center gap-3 text-xs text-slate-300 font-mono tabular-nums">
        <span>
          Execution: <strong className="text-amber-400 font-mono font-bold">20 kHz</strong>
        </span>
        <span className="text-slate-600" aria-hidden="true">|</span>
        <span>
          Moat: <strong className="text-emerald-400 font-mono font-bold">PostgreSQL 16</strong>
        </span>
        <span className="text-slate-600" aria-hidden="true">|</span>
        <span className="text-slate-200 font-semibold">MIT Permissive</span>
        <span className="text-slate-600" aria-hidden="true">|</span>
        <span className="text-emerald-400 font-semibold">Clean-Room Certified</span>
      </div>
    </header>
  );
};
