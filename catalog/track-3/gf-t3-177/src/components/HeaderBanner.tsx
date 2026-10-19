import React from 'react';
import { Download, Activity, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface HeaderBannerProps {
  onOpenYawSim: () => void;
  onOpenLedgerVerify: () => void;
  onExportSpec: () => void;
  onOpenApaModal: () => void;
}

export const HeaderBanner: React.FC<HeaderBannerProps> = ({
  onOpenYawSim,
  onOpenLedgerVerify,
  onExportSpec,
  onOpenApaModal,
}) => {
  return (
    <header className="relative w-full bg-neutral-900/90 border-b border-neutral-800 text-neutral-100 px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Badge Bar: Place "ASSET ID: GF-T3-177", "Heavy Overland Dynamics Platform High-Aero Grand Touring Telemetry Core GRAND TOURING CORE", and "v1.0.0-PROD" into a single, clean horizontal flex row */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="inline-flex items-center px-3 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 text-base font-bold font-mono tracking-wider">
          ASSET ID: GF-T3-177
        </span>
        <span className="inline-flex items-center px-3 py-1 rounded bg-neutral-800 text-neutral-200 border border-neutral-700 text-base font-semibold tracking-wide">
          Heavy Overland Dynamics Platform High-Aero Grand Touring Telemetry Core GRAND TOURING CORE
        </span>
        <span className="inline-flex items-center px-3 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-base font-bold font-mono">
          v1.0.0-PROD
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30 text-base font-medium">
          <CheckCircle2 className="w-4 h-4" />
          Acquire.com Turnkey Ready
        </span>
      </div>

      {/* Header Layout: 2-column or flex layout with title/summary on the left, and action buttons arranged horizontally side-by-side */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-6 border-b border-neutral-800">
        <div className="max-w-3xl">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
            Heavy Overland Dynamics Platform High-Aero Grand Touring Telemetry Core Convertible Grand Touring Cockpit
          </h1>
          <p className="text-base sm:text-lg text-neutral-300 leading-relaxed">
            Turnkey micro-APA asset transfer asset for Acquire.com. Production-grade active rear steering (DRS) phase transition state machine, 2UR-GSE 5.0L naturally aspirated V8 bimodal acoustic exhaust matrix, and partitioned PostgreSQL cryptographic ledger.
          </p>
        </div>

        {/* Action buttons arranged horizontally side-by-side: flex flex-row flex-wrap items-center gap-3 */}
        <div className="flex flex-row flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onOpenYawSim}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-base transition-all shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer"
          >
            <Activity className="w-5 h-5 text-neutral-950" />
            <span>Simulate DRS Dynamic Yaw</span>
          </button>

          <button
            type="button"
            onClick={onOpenLedgerVerify}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-100 border border-neutral-700 hover:border-neutral-600 font-semibold text-base transition-all active:scale-95 cursor-pointer"
          >
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Verify Touring Ledger Hash</span>
          </button>

          <button
            type="button"
            onClick={onExportSpec}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-base transition-all shadow-md shadow-blue-600/20 active:scale-95 cursor-pointer"
          >
            <Download className="w-5 h-5" />
            <span>Export GF_T3_177_SPEC.md</span>
          </button>
        </div>
      </div>

      {/* Financial Bar: Horizontal flex container for asset transfer pills */}
      <div className="flex flex-wrap items-center gap-3 pt-4">
        <button
          type="button"
          onClick={onOpenApaModal}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono font-bold text-base transition-colors cursor-pointer"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
          20 kHz Execution Loop
        </button>

        <button
          type="button"
          onClick={onOpenApaModal}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/40 text-purple-300 font-mono font-bold text-base transition-colors cursor-pointer"
        >
          PostgreSQL 16 + RLS
        </button>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 font-mono font-semibold text-base">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          100% Permissive MIT
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-cyan-500/10 border border-cyan-500/40 text-cyan-300 font-mono font-semibold text-base">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          Clean-Room Certified
        </div>

        <div className="ml-auto hidden md:flex items-center gap-2 text-neutral-400 text-base font-mono">
          <span>Escrow: Acquire.com Verified</span>
        </div>
      </div>
    </header>
  );
};
