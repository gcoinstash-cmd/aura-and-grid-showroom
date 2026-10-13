import React from 'react';
import { Cpu, CheckCircle2, FileDown, ShieldCheck, Zap } from 'lucide-react';
import { downloadSpecificationMarkdown } from '../utils/specExport';

interface MonroneyBannerProps {
  onInjectFrames: () => void;
  onVerifyMerkle: () => void;
  isVerifying: boolean;
}

export const MonroneyBanner: React.FC<MonroneyBannerProps> = ({
  onInjectFrames,
  onVerifyMerkle,
  isVerifying,
}) => {
  return (
    <section className="relative w-full border-b border-neutral-800 bg-neutral-900/60 py-6 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Vehicle & Core Identity */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-400">
              <span className="font-mono font-semibold text-amber-400">Asset ID: GF-T3-170</span>
              <span aria-hidden="true" className="text-neutral-600">·</span>
              <span className="text-neutral-200">Model: Lexus ES 350h Executive Core v1.0.0-PROD</span>
              <span aria-hidden="true" className="text-neutral-600">·</span>
              <span className="text-neutral-400">ISO/SAE 21434 Zero-Trust HSM</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-100 text-wrap-balance">
              Lexus ES 350h Executive Quietude Core
            </h1>
            <p className="text-sm md:text-base text-neutral-400 max-w-3xl">
              Turnkey micro-APA buyout asset for Acquire.com: CAN-FD zero-trust hardware security module, sub-1.5ms anti-replay filter, and PostgreSQL 16 immutable Merkle audit ledger.
            </p>

            {/* Badges / Unboxed Monroney Specs with clear 14px floor */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="flex items-center gap-2 rounded-md bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 text-sm font-semibold text-amber-400">
                <span>Micro-APA Buyout: $45,000 USD</span>
              </div>
              <div className="flex items-center gap-2 rounded-md bg-neutral-800/80 border border-neutral-700 px-3 py-1.5 text-sm font-semibold text-neutral-200">
                <span>Enterprise Valuation: $125,000 USD</span>
              </div>
              <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-sm font-semibold text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>100% Permissive MIT</span>
              </div>
              <div className="flex items-center gap-2 rounded-md bg-neutral-800/80 border border-neutral-700 px-3 py-1.5 text-sm font-mono text-neutral-300">
                <span>5000 kbps CAN-FD Data</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 lg:shrink-0">
            <button
              onClick={onInjectFrames}
              className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-bold text-neutral-950 transition-all hover:bg-amber-400 active:scale-95 cursor-pointer shadow-md"
            >
              <Zap className="h-4 w-4 fill-current" />
              <span>Inject CAN-FD Frames</span>
            </button>

            <button
              onClick={onVerifyMerkle}
              disabled={isVerifying}
              className="flex items-center gap-2 rounded-lg bg-neutral-800 border border-neutral-700 px-4 py-2.5 text-sm font-bold text-neutral-100 transition-all hover:bg-neutral-700 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck className={`h-4 w-4 text-emerald-400 ${isVerifying ? 'animate-spin' : ''}`} />
              <span>{isVerifying ? 'Verifying Tree...' : 'Verify Merkle Chain'}</span>
            </button>

            <button
              onClick={downloadSpecificationMarkdown}
              className="flex items-center gap-2 rounded-lg bg-neutral-900 border border-neutral-700 px-4 py-2.5 text-sm font-bold text-neutral-200 transition-all hover:bg-neutral-800 active:scale-95 cursor-pointer"
            >
              <FileDown className="h-4 w-4 text-amber-400" />
              <span>Export GF_T3_170_SPEC.md</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
