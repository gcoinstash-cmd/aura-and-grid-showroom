import React from 'react';
import { Play, CheckCircle2, Download, Gauge, FileCode, Layers } from 'lucide-react';

interface MonroneyBannerProps {
  onSimulateDisruptor: () => void;
  onVerifyAudit: () => void;
  onExportSpec: () => void;
  isSimulating: boolean;
  isAuditing: boolean;
}

export const MonroneyBanner: React.FC<MonroneyBannerProps> = ({
  onSimulateDisruptor,
  onVerifyAudit,
  onExportSpec,
  isSimulating,
  isAuditing,
}) => {
  return (
    <section className="relative w-full border-b border-slate-800 bg-slate-900/40 py-6 px-6 md:px-10">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Top Meta Strip: Asset ID, Model, Powertrain Specs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-sm text-cyan-400 font-mono font-medium">
              <span>ASSET ID: GF-T3-171</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-slate-300">TRACK 3 F1 SKUNKWORKS SERVICE ENGINE</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-emerald-400">TURNKEY ACQUIRE.COM ASSET</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Apex Executive IS 500 High-G Dynamic Telemetry Dynamic Core v1.0.0-PROD
            </h1>
            <p className="text-base text-slate-300 max-w-3xl">
              Deterministic, sub-250ns HFT telemetry ingest &amp; execution engine calibrated for the 5.0L 2UR-GSE Quad-Cam 32V V8 powertrain (472 hp @ 7,100 RPM).
            </p>
          </div>

          {/* Pricing & Specification Metadata (Clean unboxed/structural layout, min 14px floor) */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-900 border border-cyan-500/30 rounded-lg px-4 py-2.5">
              <span className="text-sm text-slate-400 block font-medium">Micro-APA Asset Transfer</span>
              <span className="text-xl font-bold font-mono text-cyan-300">20 kHz (0.48ms)</span>
            </div>
            <div className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5">
              <span className="text-sm text-slate-400 block font-medium">Architecture Moat</span>
              <span className="text-xl font-bold font-mono text-slate-200">PostgreSQL 16 + RLS</span>
            </div>
            <div className="bg-slate-900 border border-emerald-500/30 rounded-lg px-4 py-2.5">
              <span className="text-sm text-slate-400 block font-medium">License / Legal Audit</span>
              <span className="text-xl font-bold font-mono text-emerald-400">100% Permissive MIT</span>
            </div>
          </div>
        </div>

        {/* Action Controls Toolbar: Required 3 Buttons with high visibility and 14px floor */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={onSimulateDisruptor}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-lg transition-all shadow-sm ${
              isSimulating
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 ring-2 ring-amber-400/50'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
            }`}
          >
            <Play className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
            {isSimulating ? 'Simulating Ring Buffer Ingest...' : 'Simulate Disruptor Ring Buffer'}
          </button>

          <button
            onClick={onVerifyAudit}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-lg transition-all border ${
              isAuditing
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white'
            }`}
          >
            <CheckCircle2 className={`w-4 h-4 text-emerald-400 ${isAuditing ? 'animate-pulse' : ''}`} />
            {isAuditing ? 'Auditing Monotonic Hashes...' : 'Verify Monotonic Audit'}
          </button>

          <button
            onClick={onExportSpec}
            className="flex items-center gap-2 px-5 py-3 text-sm font-semibold text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 rounded-lg transition-all"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            Export GF_T3_171_SPEC.md
          </button>

          {/* Quick Technical Architecture Indicators */}
          <div className="ml-auto hidden xl:flex items-center gap-4 text-sm text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              LMAX Ring Buffer: 1,048,576 Slots
            </span>
            <span className="text-slate-600">·</span>
            <span className="flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-emerald-400" />
              PG16 Range Partitioned WAL
            </span>
            <span className="text-slate-600">·</span>
            <span className="flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-amber-400" />
              7,100 RPM V8 Redline Ingest
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
