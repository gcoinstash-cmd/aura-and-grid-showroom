import React from 'react';
import { Play, ShieldCheck, Download, GitCommit, FileSpreadsheet } from 'lucide-react';

interface MonroneyBannerProps {
  onSimulateAero: () => void;
  onVerifyHash: () => void;
  onExportSpec: () => void;
  onOpenGitLog: () => void;
  onExportCsv: () => void;
  isSimulating: boolean;
}

export const MonroneyBanner: React.FC<MonroneyBannerProps> = ({
  onSimulateAero,
  onVerifyHash,
  onExportSpec,
  onOpenGitLog,
  onExportCsv,
  isSimulating,
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 mb-6 shadow-2xl backdrop-blur-md">
      {/* a) Top Badge Strip */}
      <div className="flex flex-row flex-wrap items-center gap-1.5 mb-3">
        <span className="text-amber-400 bg-amber-500/10 border border-amber-500/30 text-[11px] font-mono font-bold px-2 py-0.5 rounded inline-flex w-auto whitespace-nowrap">
          GF-T3-189
        </span>
        <span className="text-slate-300 bg-slate-800 border border-slate-700 text-[11px] font-mono font-semibold px-2 py-0.5 rounded inline-flex w-auto whitespace-nowrap">
          High-Aero Grand Touring Telemetry Core AERO CORE
        </span>
        <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono font-bold px-2 py-0.5 rounded inline-flex w-auto whitespace-nowrap">
          v1.0.0-PROD
        </span>
      </div>

      {/* b) Title & Description */}
      <h1 className="text-2xl font-black text-white tracking-tight mb-1">
        Heavy Overland Dynamics Platform High-Aero Grand Touring Telemetry Core Convertible Structural Aero Core
      </h1>
      <p className="text-slate-400 text-sm line-clamp-2 mb-4 leading-relaxed">
        Turnkey micro-APA deliverable with performance cowl resonance damping, open-top acoustic suppression, and PostgreSQL 16 HMAC ledger.
      </p>

      {/* c) Action Buttons (STRICT SINGLE HORIZONTAL ROW, NEVER VERTICALLY STACKED) */}
      <div className="flex flex-row items-center gap-1.5 pb-3 mb-3 border-b border-slate-800 overflow-x-auto">
        <button
          onClick={onSimulateAero}
          className={`bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs h-8 px-2.5 rounded-lg inline-flex items-center gap-1 shrink-0 transition-all cursor-pointer ${
            isSimulating ? 'ring-2 ring-amber-300 animate-pulse' : ''
          }`}
          title="Trigger dynamic high-speed aero flex simulation"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          {isSimulating ? 'Simulating...' : 'Simulate Aero'}
        </button>

        <button
          onClick={onVerifyHash}
          className="bg-slate-800 hover:bg-slate-700 border border-emerald-500/40 text-emerald-400 font-bold text-xs h-8 px-2.5 rounded-lg inline-flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
          title="Verify clean-room build artifacts & HMAC ledger hash"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Verify Hash
        </button>

        <button
          onClick={onExportSpec}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-8 px-2.5 rounded-lg inline-flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
          title="Download complete technical documentation as GF_T3_189_SPEC.md"
        >
          <Download className="w-3.5 h-3.5" />
          Export Spec
        </button>

        {/* Auxiliary institutional tools without wrapping */}
        <button
          onClick={onExportCsv}
          className="bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium text-xs h-8 px-2.5 rounded-lg inline-flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
          title="Export CSV telemetry records"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
          Export CSV
        </button>

        <button
          onClick={onOpenGitLog}
          className="bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium text-xs h-8 px-2.5 rounded-lg inline-flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
          title="View Git Commit History & Build Fingerprints"
        >
          <GitCommit className="w-3.5 h-3.5 text-amber-400" />
          Git Log
        </button>
      </div>

      {/* d) Specification & Audit Strip */}
      <div className="flex flex-row flex-wrap items-center gap-3 text-xs text-slate-400">
        <span className="font-medium text-slate-300">
          Execution: <strong className="text-amber-400 font-mono font-bold">20 kHz</strong>
        </span>
        <span className="text-slate-600">|</span>
        <span className="font-medium text-slate-300">
          Moat: <strong className="text-emerald-400 font-mono font-bold">PostgreSQL 16</strong>
        </span>
        <span className="text-slate-600">|</span>
        <span className="bg-slate-800/80 px-2 py-0.5 rounded text-slate-300 border border-slate-700/60 font-mono">
          MIT Permissive
        </span>
        <span className="text-slate-600">|</span>
        <span className="bg-emerald-950/40 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 font-mono">
          Clean-Room Certified
        </span>
      </div>
    </div>
  );
};
