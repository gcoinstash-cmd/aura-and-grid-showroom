/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Gauge, ShieldCheck, Download } from 'lucide-react';
import { MASTER_SPEC_MARKDOWN } from '../data/specContent';

interface MonroneyBannerProps {
  onSimulateBias: () => void;
  onVerifyLedger: () => void;
}

export const MonroneyBanner: React.FC<MonroneyBannerProps> = ({
  onSimulateBias,
  onVerifyLedger,
}) => {
  const handleExportSpec = () => {
    const blob = new Blob([MASTER_SPEC_MARKDOWN], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'GF_T3_179_SPEC.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <header className="relative w-full bg-slate-900/90 border border-slate-800 rounded-xl p-4 md:p-6 mb-6 shadow-2xl backdrop-blur-sm">
      {/* a) Top Badge Strip */}
      <div className="flex flex-row flex-wrap items-center gap-2 mb-3">
        <span className="text-amber-400 bg-amber-500/10 border border-amber-500/30 text-xs font-mono font-bold px-2.5 py-1 rounded inline-flex w-auto whitespace-nowrap">
          GF-T3-179
        </span>
        <span className="text-slate-300 bg-slate-800 border border-slate-700 text-xs font-mono font-semibold px-2.5 py-1 rounded inline-flex w-auto whitespace-nowrap">
          Apex Executive High-Output Multi-Node Core DUAL_VECTOR_TORQUE CORE
        </span>
        <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono font-bold px-2.5 py-1 rounded inline-flex w-auto whitespace-nowrap">
          v1.0.0-PROD
        </span>
      </div>

      {/* b) Title & Description */}
      <h1 className="text-2xl font-black text-white tracking-tight mb-1">
        Apex Executive High-Output Multi-Node Core Luxury Plug-in Core
      </h1>
      <p className="text-slate-400 text-xs md:text-sm line-clamp-2 mb-4">
        Turnkey micro-APA deliverable with DUAL_VECTOR_TORQUE 100:0–20:80 dynamic e-Axle torque vectoring, 18.1 kWh PHEV energy arbitration, and PostgreSQL 16 HMAC ledger.
      </p>

      {/* c) Action Buttons (STRICTLY HORIZONTAL, ZERO FULL-WIDTH STACKING, ZERO ORPHANING) */}
      <div className="flex flex-row items-center gap-2 pb-3 mb-3 border-b border-slate-800 overflow-x-auto">
        <button
          onClick={onSimulateBias}
          type="button"
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs h-8 px-3 rounded-lg inline-flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors whitespace-nowrap shadow-sm"
        >
          <Gauge className="w-3.5 h-3.5" />
          <span>Simulate DUAL_VECTOR_TORQUE Bias</span>
        </button>

        <button
          onClick={onVerifyLedger}
          type="button"
          className="bg-slate-800 hover:bg-slate-700 border border-emerald-500/40 text-emerald-400 font-bold text-xs h-8 px-3 rounded-lg inline-flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors whitespace-nowrap"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Verify Ledger Hash</span>
        </button>

        <button
          onClick={handleExportSpec}
          type="button"
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-8 px-3 rounded-lg inline-flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors whitespace-nowrap shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Spec</span>
        </button>
      </div>

      {/* d) Specification & Audit Strip */}
      <div className="flex flex-row flex-wrap items-center gap-3 text-xs text-slate-400 font-mono">
        <div className="inline-flex items-center gap-1">
          <span className="text-slate-500">Asset Transfer:</span>
          <span className="text-emerald-400 font-bold">20 kHz (0.48ms)</span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="inline-flex items-center gap-1">
          <span className="text-slate-500">Enterprise:</span>
          <span className="text-cyan-400 font-bold">PostgreSQL 16 + RLS</span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="inline-flex items-center gap-1">
          <span className="text-amber-400 font-medium">MIT Permissive</span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="inline-flex items-center gap-1">
          <span className="text-emerald-300 font-medium">Clean-Room Certified</span>
        </div>
      </div>
    </header>
  );
};
