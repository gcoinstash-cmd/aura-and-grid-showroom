import React from 'react';
import { Download, ShieldCheck, Cpu, Activity, Play } from 'lucide-react';
import { GF_T3_173_SPEC_MARKDOWN } from '../data/specMarkdown';

interface MonroneyBannerProps {
  onOpenSimulate: () => void;
  onOpenAudit: () => void;
}

export const MonroneyBanner: React.FC<MonroneyBannerProps> = ({
  onOpenSimulate,
  onOpenAudit
}) => {
  const handleExportSpec = () => {
    const blob = new Blob([GF_T3_173_SPEC_MARKDOWN], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'GF_T3_173_SPEC.md');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative w-full bg-slate-900 border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Asset Identity & Architecture Title */}
          <div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300 mb-2">
              <span className="font-mono font-semibold tracking-wide text-cyan-400">
                ASSET ID: GF-T3-173
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-slate-300 font-medium">
                CHASSIS: Apex Executive RC F TRACK EDITION
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="font-mono text-emerald-400">
                REVISION: v1.0.0-PROD
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <span>Hypercar Flagship Trim Aero Core</span>
            </h1>
            
            <p className="mt-1 text-sm text-slate-400 max-w-2xl">
              Turnkey active aerodynamic vectoring engine, 1,000 Hz dual-flap controller, and partitioned PostgreSQL HMAC telemetry ledger for Acquire.com asset transfer.
            </p>
          </div>

          {/* Pricing & Specification Indicators */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg px-3.5 py-2">
              <div className="text-sm uppercase tracking-wider text-slate-400 font-mono">Micro-APA Asset Transfer</div>
              <div className="text-lg font-bold font-mono text-cyan-300">20 kHz (0.48ms)</div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg px-3.5 py-2">
              <div className="text-sm uppercase tracking-wider text-slate-400 font-mono">Architecture Moat</div>
              <div className="text-lg font-bold font-mono text-emerald-300">PostgreSQL 16 + RLS</div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-lg px-3.5 py-2">
              <div className="text-sm uppercase tracking-wider text-slate-400 font-mono">License Class</div>
              <div className="text-lg font-bold text-white font-mono">100% Permissive MIT</div>
            </div>
          </div>
        </div>

        {/* Action Controls & Monroney Bar Nav */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-400">Escrow Ready:</span>
            <span className="text-sm font-medium text-slate-200">Acquire.com Verified Ledger</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-sm text-slate-400">Architecture:</span>
            <span className="text-sm font-medium text-slate-200">Ghost FactoryOS Track 3 Engine</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenSimulate}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors cursor-pointer shadow-sm"
              title="Launch dynamic downforce vectoring simulation"
            >
              <Play className="w-4 h-4" />
              <span>Simulate Downforce Vectoring</span>
            </button>

            <button
              onClick={onOpenAudit}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Verify cryptographic SHA-256 telemetry audit chain"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Verify Aero Hash Chain</span>
            </button>

            <button
              onClick={handleExportSpec}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-cyan-500/50 rounded-lg transition-colors cursor-pointer"
              title="Download GF_T3_173_SPEC.md master technical specification"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Export GF_T3_173_SPEC.md</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
