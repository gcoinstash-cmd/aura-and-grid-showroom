/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Lexus RZ 450e Steer-by-Wire Precision Core (GF-T3-174)
 * Monroney Top Banner (Relative positioning - scrolls naturally off viewport)
 */

import React from 'react';
import { Play, CheckCircle2, Download, ShieldCheck, DollarSign, Award, Layers } from 'lucide-react';

interface MonroneyBannerProps {
  onSimulateInput: () => void;
  onVerifyConsensus: () => void;
  onExportSpec: () => void;
  isSimulating: boolean;
}

export const MonroneyBanner: React.FC<MonroneyBannerProps> = ({
  onSimulateInput,
  onVerifyConsensus,
  onExportSpec,
  isSimulating,
}) => {
  return (
    <section className="relative w-full border-b border-slate-800 bg-slate-900/90 p-6 md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Top identification row */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div className="flex flex-wrap items-center gap-3 text-sm font-mono text-slate-300">
            <span className="font-bold text-amber-400">ASSET ID: GF-T3-174</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-200 font-semibold">MODEL: Lexus RZ 450e Steer-by-Wire Core v1.0.0-PROD</span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400 font-semibold">ISO 26262 ASIL-D</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">ACQUIRE.COM MONOPOLY VAULT</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span>Clean-Room Certified</span>
            <span>·</span>
            <span className="text-slate-300 font-mono">SHA-256 Verified</span>
          </div>
        </div>

        {/* Hero Title & Value proposition */}
        <div className="mt-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white text-balance">
              Lexus RZ 450e Steer-by-Wire Precision Core
            </h1>
            <p className="mt-2 text-base md:text-lg text-slate-300">
              Turnkey Micro-APA buyout asset delivering sub-millisecond dual-channel arbitration, speed-adaptive variable ratio kinematics (150° lock-to-lock), and discrete Kalman yaw damping for next-generation digital cockpits.
            </p>

            {/* Structured Value Badges - Clean typography with clear semantic contrast */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded border border-amber-500/40 bg-amber-500/10 px-3.5 py-1.5 text-sm font-semibold text-amber-300">
                <DollarSign className="h-4 w-4 text-amber-400" />
                <span>Micro-APA Buyout: $45,000 USD</span>
              </div>
              <div className="flex items-center gap-2 rounded border border-cyan-500/40 bg-cyan-500/10 px-3.5 py-1.5 text-sm font-semibold text-cyan-300">
                <Award className="h-4 w-4 text-cyan-400" />
                <span>Enterprise Valuation: $125,000 USD</span>
              </div>
              <div className="flex items-center gap-2 rounded border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-1.5 text-sm font-semibold text-emerald-300">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>100% Permissive MIT (Zero Copyleft)</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <button
              onClick={onSimulateInput}
              className={`flex items-center justify-center gap-2.5 rounded px-5 py-3 text-sm font-semibold transition-all shadow cursor-pointer whitespace-nowrap ${
                isSimulating
                  ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              <Play className="h-4 w-4 fill-current" />
              <span>{isSimulating ? 'Active Simulation Running' : 'Simulate Steer-by-Wire Input'}</span>
            </button>

            <button
              onClick={onVerifyConsensus}
              className="flex items-center justify-center gap-2.5 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 hover:border-slate-600 px-5 py-3 text-sm font-semibold text-slate-100 transition-all cursor-pointer whitespace-nowrap"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Verify Dual-Channel Consensus</span>
            </button>

            <button
              onClick={onExportSpec}
              className="flex items-center justify-center gap-2.5 rounded border border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 px-5 py-3 text-sm font-semibold text-amber-300 transition-all cursor-pointer whitespace-nowrap"
            >
              <Download className="h-4 w-4 text-amber-400" />
              <span>Export GF_T3_174_SPEC.md</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
