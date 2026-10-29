import React from 'react';
import { Gauge, CheckCircle2, Download, Zap, FileText } from 'lucide-react';

interface MonroneyBannerProps {
  onSimulateTorque: () => void;
  onVerifyMerkle: () => void;
  onExportSpec: () => void;
  onOpenApa: () => void;
}

export const MonroneyBanner: React.FC<MonroneyBannerProps> = ({
  onSimulateTorque,
  onVerifyMerkle,
  onExportSpec,
  onOpenApa,
}) => {
  return (
    <section className="relative w-full rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 md:p-8 mb-8 shadow-xl">
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
        {/* Left side: Monroney Asset Identification & Model Specs */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
            <span className="px-3 py-1 rounded bg-rose-950/80 border border-rose-700 text-rose-300 font-mono tracking-wider font-semibold">
              ASSET ID: GF-T3-169
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-300 font-semibold">Apex Executive NX 450h+ High-G Dynamic Telemetry Agile Core</span>
            <span className="text-slate-400">·</span>
            <span className="text-emerald-400 font-mono font-semibold">v1.0.0-PROD</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Agile Hybrid Core Powertrain Cockpit
          </h1>

          {/* Three Monroney Badges */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div 
              onClick={onOpenApa}
              className="cursor-pointer group flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-950/70 border border-emerald-600/80 text-emerald-300 text-sm font-semibold hover:bg-emerald-900/80 transition-colors"
            >
              <Zap className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>Micro-APA Asset Transfer: 20 kHz (0.48ms)</span>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-blue-950/70 border border-blue-600/80 text-blue-300 text-sm font-semibold">
              <span>Architecture Moat: PostgreSQL 16 + RLS</span>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-purple-950/70 border border-purple-600/80 text-purple-300 text-sm font-semibold">
              <CheckCircle2 className="w-4 h-4 text-purple-400" />
              <span>100% Permissive MIT</span>
            </div>
          </div>
        </div>

        {/* Right side: 3 Monroney Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <button
            onClick={onSimulateTorque}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold shadow-lg shadow-cyan-950/50 hover:shadow-cyan-900/80 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <Gauge className="w-4 h-4" />
            <span>Simulate Torque Vectoring</span>
          </button>

          <button
            onClick={onVerifyMerkle}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-100 text-sm font-bold transition-all cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Verify Merkle Tree</span>
          </button>

          <button
            onClick={onExportSpec}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold shadow-lg shadow-rose-950/50 hover:shadow-rose-900/80 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            <span>Export GF_T3_169_SPEC.md</span>
          </button>
        </div>
      </div>
    </section>
  );
};
