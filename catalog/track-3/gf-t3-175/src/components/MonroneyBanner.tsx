import React from 'react';
import { Download, Zap, ShieldCheck, Cpu, ArrowUpRight, CheckCircle2, FileText } from 'lucide-react';

interface MonroneyBannerProps {
  onSimulateRegen: () => void;
  onVerifyLedger: () => void;
  onExportSpec: () => void;
}

export const MonroneyBanner: React.FC<MonroneyBannerProps> = ({
  onSimulateRegen,
  onVerifyLedger,
  onExportSpec,
}) => {
  return (
    <div className="relative w-full bg-slate-900 border-b border-slate-800 text-slate-100">
      {/* Top Telemetry Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          
          {/* Left Column: Asset Identity & Spec info */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-sm sm:text-base font-black bg-cyan-950 text-cyan-400 border border-cyan-700/60 px-3.5 py-1.5 rounded-lg uppercase tracking-wider">
                Asset ID: GF-T3-175
              </span>
              <span className="font-mono text-sm sm:text-base font-semibold bg-slate-800 text-slate-200 border border-slate-700 px-3.5 py-1.5 rounded-lg">
                Model: Apex Executive Urban Edge Core v1.0.0-PROD
              </span>
              <span className="inline-flex items-center gap-2 text-sm sm:text-base font-mono font-medium text-emerald-400 bg-emerald-950/70 border border-emerald-800/70 px-3.5 py-1.5 rounded-lg">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                Turnkey Acquire.com Asset
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white flex items-center gap-3 pt-1">
              <span>Apex Executive Urban Edge Core</span>
            </h1>

            <p className="text-slate-300 text-base sm:text-lg max-w-4xl leading-relaxed pt-1">
              500 Hz deterministic battery state-of-charge (SOC) & state-of-health (SOH) estimation coprocessor with dynamic urban regenerative kinetic recovery, PostgreSQL 16 cryptographic ledger, and OpenAPI 3.1 contracts.
            </p>

            {/* Badges Row with Expanded 15px+ typography and padding */}
            <div className="flex flex-wrap items-center gap-4 pt-3">
              <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-950/90 to-slate-900 border border-emerald-500/60 px-5 py-3 rounded-xl shadow-md">
                <span className="text-base font-semibold text-slate-200">Micro-APA Asset Transfer:</span>
                <span className="text-lg sm:text-xl font-mono font-black text-emerald-400">20 kHz (0.48ms)</span>
              </div>

              <div className="flex items-center gap-3 bg-slate-950 border border-slate-700 px-5 py-3 rounded-xl shadow-md">
                <span className="text-base font-semibold text-slate-200">Architecture Moat:</span>
                <span className="text-lg sm:text-xl font-mono font-black text-cyan-400">PostgreSQL 16 + RLS</span>
              </div>

              <div className="flex items-center gap-3 bg-slate-950 border border-slate-700 px-5 py-3 rounded-xl shadow-md">
                <span className="text-base font-semibold text-slate-200">License Model:</span>
                <span className="text-lg font-mono font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  100% Permissive MIT
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: High-Impact Action Buttons with Expanded Padding py-3.5 px-6 and text-base sm:text-lg */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3.5 lg:w-80 shrink-0">
            <button
              onClick={onSimulateRegen}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-base sm:text-lg flex items-center justify-center gap-2.5 shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
            >
              <Zap className="w-5 h-5 fill-slate-950" />
              Simulate Urban Regen Cycle
            </button>

            <button
              onClick={onVerifyLedger}
              className="w-full py-3.5 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-white font-bold text-base sm:text-lg flex items-center justify-center gap-2.5 transition-all cursor-pointer"
            >
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Verify Battery Ledger Hash
            </button>

            <button
              onClick={onExportSpec}
              className="w-full py-3.5 px-6 rounded-xl bg-slate-950 hover:bg-slate-900 border border-cyan-700 hover:border-cyan-500 text-cyan-300 hover:text-cyan-200 font-bold text-base sm:text-lg flex items-center justify-center gap-2.5 transition-all cursor-pointer"
            >
              <Download className="w-5 h-5" />
              Export GF_T3_175_SPEC.md
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
