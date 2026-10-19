import React from 'react';
import { DollarSign, Zap, Shield, CheckCircle2 } from 'lucide-react';

interface KpiRibbonProps {
  currentLatencyUs?: number;
}

export const KpiRibbon: React.FC<KpiRibbonProps> = ({ currentLatencyUs = 7.8 }) => {
  return (
    <section className="w-full bg-slate-900/60 border-b border-slate-800 py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs uppercase font-mono tracking-wider text-slate-400">
              Turnkey Software Asset Purchase Agreement Reference Core
            </span>
            <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
          </div>
          <div className="text-2xl lg:text-3xl font-mono font-bold text-slate-100 tracking-tight">
            20 kHz (0.48ms)
          </div>
          <p className="mt-1.5 text-xs text-slate-400 font-sans">
            Turnkey M&A Transfer · 100% IP Assignment
          </p>
        </div>

        {/* Card 2 */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs uppercase font-mono tracking-wider text-slate-400">
              Per-Node QP Solver Latency
            </span>
            <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
          </div>
          <div className="text-2xl lg:text-3xl font-mono font-bold text-cyan-300 tracking-tight tabular-nums">
            {currentLatencyUs.toFixed(1)} µs
          </div>
          <p className="mt-1.5 text-xs text-slate-400 font-sans">
            Active-Set Quadratic Program · Hard Real-Time
          </p>
        </div>

        {/* Card 3 */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs uppercase font-mono tracking-wider text-slate-400">
              Safety Margin Invariant
            </span>
            <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
          </div>
          <div className="text-2xl lg:text-3xl font-mono font-bold text-emerald-300 tracking-tight">
            ISO 26262 ASIL-D
          </div>
          <p className="mt-1.5 text-xs text-slate-400 font-sans">
            Forward Invariant Super-level Set h(x) ≥ 0
          </p>
        </div>

        {/* Card 4 */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs uppercase font-mono tracking-wider text-slate-400">
              Verified License Architecture
            </span>
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
          </div>
          <div className="text-2xl lg:text-3xl font-mono font-bold text-amber-300 tracking-tight">
            Clean-Room IP
          </div>
          <p className="mt-1.5 text-xs text-slate-400 font-sans">
            Verified Apache 2.0 / MIT Dual License
          </p>
        </div>
      </div>
    </section>
  );
};
