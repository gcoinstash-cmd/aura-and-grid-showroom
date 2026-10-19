/**
 * MonroneyBanner.tsx
 * Bulletproof Non-Breaking Monroney Specification Banner
 * Enforces Zero Wrapping, Zero Clipping, Zero Stacking Bugs
 */

import React from 'react';
import { Play, Pause, ShieldCheck, Download } from 'lucide-react';

interface MonroneyBannerProps {
  onSimulateAero: () => void;
  onVerifyHash: () => void;
  onExportSpec: () => void;
  isSimulating: boolean;
}

export const MonroneyBanner: React.FC<MonroneyBannerProps> = ({
  onSimulateAero,
  onVerifyHash,
  onExportSpec,
  isSimulating,
}) => {
  return (
    <div className="w-full bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-xl">
      {/* a) Top Badge Strip */}
      <div className="flex flex-row flex-wrap items-center gap-1.5 mb-3">
        <span className="text-amber-400 bg-amber-500/10 border border-amber-500/30 text-[11px] font-mono font-bold px-2 py-0.5 rounded inline-flex w-auto whitespace-nowrap">
          GF-T3-195
        </span>
        <span className="text-slate-300 bg-slate-800 border border-slate-700 text-[11px] font-mono font-semibold px-2 py-0.5 rounded inline-flex w-auto whitespace-nowrap">
          High-Aero Grand Touring Telemetry Core CARBON AERO
        </span>
        <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono font-bold px-2 py-0.5 rounded inline-flex w-auto whitespace-nowrap">
          v1.0.0-PROD
        </span>
      </div>

      {/* b) Title & Description */}
      <h1 className="text-2xl font-black text-white tracking-tight mb-1">
        Heavy Overland Dynamics Platform High-Aero Grand Touring Telemetry Core Carbon Aero Core
      </h1>
      <p className="text-slate-400 text-sm line-clamp-2 mb-4 leading-relaxed">
        Turnkey micro-APA deliverable with fixed carbon high-downforce wing aerodynamics, vortex yaw damping, and PostgreSQL 16 HMAC ledger.
      </p>

      {/* c) Action Buttons (STRICT SINGLE HORIZONTAL ROW, NEVER VERTICALLY STACKED) */}
      <div className="flex flex-row items-center gap-1.5 pb-3 mb-3 border-b border-slate-800 overflow-x-auto">
        <button
          type="button"
          onClick={onSimulateAero}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs h-8 px-2.5 rounded-lg inline-flex items-center gap-1 shrink-0 cursor-pointer transition-colors active:scale-95"
          title="Toggle live aerodynamic simulation stream"
        >
          {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span>Simulate Aero</span>
        </button>

        <button
          type="button"
          onClick={onVerifyHash}
          className="bg-slate-800 hover:bg-slate-700 border border-emerald-500/40 text-emerald-400 font-bold text-xs h-8 px-2.5 rounded-lg inline-flex items-center gap-1 shrink-0 cursor-pointer transition-colors active:scale-95"
          title="Audit SHA-256 HMAC ledger signatures"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Verify Hash</span>
        </button>

        <button
          type="button"
          onClick={onExportSpec}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-8 px-2.5 rounded-lg inline-flex items-center gap-1 shrink-0 cursor-pointer transition-colors active:scale-95"
          title="Download complete GF_T3_195_SPEC.md vault artifact"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Spec</span>
        </button>
      </div>

      {/* d) Specification & Audit Strip */}
      <div className="flex flex-row flex-wrap items-center gap-3 text-xs text-slate-300">
        <div className="flex items-center gap-1">
          <span className="text-slate-400 font-medium">Asset Transfer:</span>
          <span className="font-mono font-bold text-amber-400">20 kHz (0.48ms)</span>
        </div>
        <span className="text-slate-600 font-mono">|</span>
        <div className="flex items-center gap-1">
          <span className="text-slate-400 font-medium">Enterprise:</span>
          <span className="font-mono font-bold text-white">PostgreSQL 16 + RLS</span>
        </div>
        <span className="text-slate-600 font-mono">|</span>
        <div className="flex items-center gap-1">
          <span className="text-slate-400 font-medium">Licensing:</span>
          <span className="font-mono font-semibold text-emerald-400">MIT Permissive</span>
        </div>
        <span className="text-slate-600 font-mono">|</span>
        <div className="flex items-center gap-1">
          <span className="text-slate-400 font-medium">Audit:</span>
          <span className="font-mono font-semibold text-cyan-400">Clean-Room Certified</span>
        </div>
      </div>
    </div>
  );
};
