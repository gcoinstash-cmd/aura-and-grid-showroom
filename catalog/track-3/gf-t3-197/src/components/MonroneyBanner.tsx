/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, ShieldCheck, Download, Award, DollarSign } from 'lucide-react';
import { GF_T3_197_SPEC_MARKDOWN } from '../data/specContent';

interface MonroneyBannerProps {
  onSimulateDRS: () => void;
  onVerifyHash: () => void;
  onExportSpec?: () => void;
}

export const MonroneyBanner: React.FC<MonroneyBannerProps> = ({
  onSimulateDRS,
  onVerifyHash,
  onExportSpec,
}) => {
  const handleExport = () => {
    if (onExportSpec) {
      onExportSpec();
      return;
    }
    const blob = new Blob([GF_T3_197_SPEC_MARKDOWN], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'GF_T3_197_SPEC.md');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <header className="relative bg-slate-900/90 border border-slate-800 rounded-2xl p-5 mb-6 shadow-2xl backdrop-blur-md">
      {/* a) Top Badge Strip */}
      <div className="flex flex-row flex-wrap items-center gap-1.5 mb-3">
        <span className="text-amber-400 bg-amber-500/10 border border-amber-500/30 text-[11px] font-mono font-bold px-2 py-0.5 rounded inline-flex w-auto whitespace-nowrap items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block"></span>
          GF-T3-197
        </span>
        <span className="text-slate-300 bg-slate-800 border border-slate-700 text-[11px] font-mono font-semibold px-2 py-0.5 rounded inline-flex w-auto whitespace-nowrap">
          TX 500h DRS CORE
        </span>
        <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono font-bold px-2 py-0.5 rounded inline-flex w-auto whitespace-nowrap items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
          v1.0.0-PROD
        </span>
      </div>

      {/* b) Title & Description */}
      <h1 className="text-2xl font-black text-white tracking-tight mb-1">
        Lexus TX 500h F SPORT Performance Core
      </h1>
      <p className="text-slate-400 text-sm line-clamp-2 mb-4 leading-relaxed">
        Turnkey micro-APA deliverable with Dynamic Rear Steering (DRS), DIRECT4 rear eAxle vectoring, and PostgreSQL 16 HMAC ledger.
      </p>

      {/* c) Action Buttons (STRICT SINGLE HORIZONTAL ROW, NEVER VERTICALLY STACKED) */}
      <div className="flex flex-row items-center gap-1.5 pb-3 mb-3 border-b border-slate-800 overflow-x-auto">
        <button
          type="button"
          onClick={onSimulateDRS}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs h-8 px-2.5 rounded-lg inline-flex items-center gap-1 shrink-0 transition-all cursor-pointer shadow-sm active:scale-95"
          title="Simulate Dynamic Rear Steering Kinematics"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span className="whitespace-nowrap">Simulate DRS</span>
        </button>

        <button
          type="button"
          onClick={onVerifyHash}
          className="bg-slate-800 hover:bg-slate-700 border border-emerald-500/40 text-emerald-400 font-bold text-xs h-8 px-2.5 rounded-lg inline-flex items-center gap-1 shrink-0 transition-all cursor-pointer shadow-sm active:scale-95"
          title="Verify Cryptographic Ledger Hash Chain"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="whitespace-nowrap">Verify Hash</span>
        </button>

        <button
          type="button"
          onClick={handleExport}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-8 px-2.5 rounded-lg inline-flex items-center gap-1 shrink-0 transition-all cursor-pointer shadow-sm active:scale-95"
          title="Export Monopoly Vault Technical Specification (GF_T3_197_SPEC.md)"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="whitespace-nowrap">Export Spec</span>
        </button>
      </div>

      {/* d) Valuation & Audit Strip */}
      <div className="flex flex-row flex-wrap items-center gap-3 text-xs text-slate-400 font-medium">
        <span className="inline-flex items-center gap-1 text-slate-200">
          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          <span>Buyout: <strong className="text-white font-mono">$45,000 USD</strong></span>
        </span>
        <span className="text-slate-600">|</span>
        <span className="inline-flex items-center gap-1 text-slate-200">
          <span>Enterprise: <strong className="text-amber-300 font-mono">$125,000 USD</strong></span>
        </span>
        <span className="text-slate-600">|</span>
        <span className="inline-flex items-center gap-1 text-slate-300">
          <Award className="w-3.5 h-3.5 text-blue-400" />
          <span>MIT Permissive</span>
        </span>
        <span className="text-slate-600">|</span>
        <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Clean-Room Certified</span>
        </span>
      </div>
    </header>
  );
};
