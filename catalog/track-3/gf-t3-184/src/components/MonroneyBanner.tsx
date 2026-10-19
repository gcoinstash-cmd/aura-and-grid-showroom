import React from 'react';
import { Zap, ShieldCheck, Download, Award, DollarSign } from 'lucide-react';
import { exportSpecMarkdown } from '../utils/exportSpec';

interface MonroneyBannerProps {
  onSimulateRev: () => void;
  onVerifyHash: () => void;
  isRevving: boolean;
  isVerifying: boolean;
}

export const MonroneyBanner: React.FC<MonroneyBannerProps> = ({
  onSimulateRev,
  onVerifyHash,
  isRevving,
  isVerifying,
}) => {
  return (
    <div className="relative w-full bg-slate-900/90 border border-slate-800 rounded-xl p-4 md:p-5 shadow-2xl backdrop-blur-sm">
      {/* a) Top Badge Strip */}
      <div className="flex flex-row flex-wrap items-center gap-2 mb-3">
        <span className="text-amber-400 bg-amber-500/10 border border-amber-500/30 text-xs font-mono font-bold px-2.5 py-1 rounded inline-flex w-auto whitespace-nowrap items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
          GF-T3-184
        </span>
        <span className="text-slate-300 bg-slate-800 border border-slate-700 text-xs font-mono font-semibold px-2.5 py-1 rounded inline-flex w-auto whitespace-nowrap">
          LFA V10 APEX CORE
        </span>
        <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono font-bold px-2.5 py-1 rounded inline-flex w-auto whitespace-nowrap items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          v1.0.0-PROD
        </span>
      </div>

      {/* b) Title & Description */}
      <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1">
        Heavy Overland Dynamics Platform LFA Nürburgring Edition V10 Apex Core
      </h1>
      <p className="text-slate-400 text-base line-clamp-2 mb-4 leading-relaxed">
        Turnkey micro-APA deliverable with 1LR-GUE 4.8L V10 9,000 RPM acoustic resonance, 150 ms ASG single-clutch shift timing, and PostgreSQL 16 HMAC ledger.
      </p>

      {/* c) Action Buttons (STRICT SINGLE HORIZONTAL ROW, NEVER VERTICALLY STACKED) */}
      <div className="flex flex-row items-center gap-2 pb-3 mb-3 border-b border-slate-800 overflow-x-auto">
        <button
          type="button"
          onClick={onSimulateRev}
          disabled={isRevving}
          className="bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-bold text-sm h-9 px-3 rounded-lg inline-flex items-center gap-1.5 shrink-0 cursor-pointer transition-all active:scale-95 shadow-sm shadow-amber-500/20 whitespace-nowrap"
          title="Simulate 0.6s idle to 9,000 RPM sweep"
        >
          <Zap className={`w-4 h-4 ${isRevving ? 'animate-bounce' : ''}`} />
          <span>{isRevving ? 'Revving...' : 'Simulate V10 Rev'}</span>
        </button>

        <button
          type="button"
          onClick={onVerifyHash}
          disabled={isVerifying}
          className="bg-slate-800 hover:bg-slate-700 border border-emerald-500/40 text-emerald-400 font-bold text-sm h-9 px-3 rounded-lg inline-flex items-center gap-1.5 shrink-0 cursor-pointer transition-all active:scale-95 shadow-sm whitespace-nowrap"
          title="Validate SHA-256 HMAC cryptographic chain"
        >
          <ShieldCheck className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
          <span>{isVerifying ? 'Verifying...' : 'Verify Hash'}</span>
        </button>

        <button
          type="button"
          onClick={exportSpecMarkdown}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm h-9 px-3 rounded-lg inline-flex items-center gap-1.5 shrink-0 cursor-pointer transition-all active:scale-95 shadow-sm shadow-emerald-600/20 whitespace-nowrap"
          title="Download GF_T3_184_SPEC.md"
        >
          <Download className="w-4 h-4" />
          <span>Export Spec</span>
        </button>
      </div>

      {/* d) Specification & Audit Strip */}
      <div className="flex flex-row flex-wrap items-center gap-3.5 text-sm">
        <div className="inline-flex items-center gap-1.5 font-mono text-slate-300">
          <DollarSign className="w-4 h-4 text-amber-400" />
          <span className="text-slate-400">Asset Transfer:</span>
          <span className="font-bold text-amber-300">20 kHz (0.48ms)</span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="inline-flex items-center gap-1.5 font-mono text-slate-300">
          <span className="text-slate-400">Enterprise:</span>
          <span className="font-bold text-emerald-400">PostgreSQL 16 + RLS</span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="inline-flex items-center gap-1 font-mono text-slate-300">
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700">
            MIT Permissive
          </span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="inline-flex items-center gap-1 font-mono text-emerald-400">
          <Award className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-xs">Clean-Room Certified</span>
        </div>
      </div>
    </div>
  );
};
