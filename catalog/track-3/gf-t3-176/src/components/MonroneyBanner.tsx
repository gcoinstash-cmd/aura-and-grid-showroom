import React from 'react';
import { Sliders, Hash, Download, CheckCircle, Shield, Award } from 'lucide-react';

interface MonroneyBannerProps {
  onSimulate: () => void;
  onVerifyLedger: () => void;
  onExportSpec: () => void;
}

export const MonroneyBanner: React.FC<MonroneyBannerProps> = ({
  onSimulate,
  onVerifyLedger,
  onExportSpec,
}) => {
  return (
    <header className="relative w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 mb-8 shadow-2xl">
      {/* 1. Horizontal Badge Strip */}
      <div className="flex flex-row flex-wrap items-center gap-2 mb-4">
        <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-sm font-bold rounded-md whitespace-nowrap">
          ASSET ID: GF-T3-176
        </span>
        <span className="px-3 py-1 bg-slate-800 border border-slate-700 text-slate-200 font-mono text-sm font-semibold rounded-md whitespace-nowrap">
          Apex Executive TERRAIN CORE
        </span>
        <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-sm font-bold rounded-md whitespace-nowrap">
          v1.0.0-PROD
        </span>
      </div>

      {/* 2. Main Title & Action Row (Side-by-Side) */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-6 border-b border-slate-800/80">
        <div className="max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">
            Ghost FactoryOS Terrain Core Engine
          </h1>
          <p className="text-slate-400 text-base md:text-lg leading-relaxed">
            Turnkey micro-APA asset transfer asset engineered for Acquire.com syndication. Includes 1,000 Hz Dynamic Kinetic Suspension Telemetry dynamic stabilizer bar decoupling, partitioned PostgreSQL 16 HMAC ledger, OpenAPI 3.1 contracts, and non-root Cloud Run deployment harness.
          </p>
        </div>

        {/* Compact Button Row (Stop Full-Width Vertical Stacking) */}
        <div className="flex flex-row flex-wrap items-center gap-3 mt-4 lg:mt-0 shrink-0">
          <button
            onClick={onSimulate}
            className="w-auto inline-flex items-center justify-center gap-2 h-10 px-4 text-sm font-bold rounded-lg whitespace-nowrap bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer"
          >
            <Sliders className="w-4 h-4" />
            <span>Simulate Dynamic Kinetic Suspension Telemetry</span>
          </button>
          <button
            onClick={onVerifyLedger}
            className="w-auto inline-flex items-center justify-center gap-2 h-10 px-4 text-sm font-bold rounded-lg whitespace-nowrap bg-slate-800 hover:bg-slate-700 border border-emerald-500/40 text-emerald-400 transition-all active:scale-95 cursor-pointer"
          >
            <Hash className="w-4 h-4" />
            <span>Verify Ledger</span>
          </button>
          <button
            onClick={onExportSpec}
            className="w-auto inline-flex items-center justify-center gap-2 h-10 px-4 text-sm font-bold rounded-lg whitespace-nowrap bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Spec</span>
          </button>
        </div>
      </div>

      {/* 3. Clean Bottom Financial Bar */}
      <div className="flex flex-row flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-800">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-lg text-sm">
          <span className="text-slate-400">Micro-APA Asset Transfer:</span>
          <span className="font-extrabold text-amber-400 num-tabular">20 kHz (0.48ms)</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-lg text-sm">
          <span className="text-slate-400">Architecture Moat:</span>
          <span className="font-bold text-white num-tabular">PostgreSQL 16 + RLS</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-sm text-emerald-300">
          <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">100% Permissive MIT</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-slate-300">
          <Award className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-semibold">Clean-Room Certified</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-400 font-mono sm:ml-auto">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Escrow Target: <strong className="text-white font-semibold">Acquire.com Verified Buyer Vault</strong></span>
        </div>
      </div>
    </header>
  );
};
