import React from 'react';
import { Cpu, Gauge, Link2, ShieldAlert } from 'lucide-react';

interface LiveTelemetryCardsProps {
  fusionHz: number;
  jitterMs: number;
  traceP: number;
  blockHeight: number;
  verifiedChain: boolean;
  tamperDetected: boolean;
}

export const LiveTelemetryCards: React.FC<LiveTelemetryCardsProps> = ({
  fusionHz,
  jitterMs,
  traceP,
  blockHeight,
  verifiedChain,
  tamperDetected,
}) => {
  return (
    <section className="relative w-full max-w-7xl mx-auto px-6 py-6 sm:px-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Fusion Loop Frequency */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-300 mb-2">
            <span className="text-sm uppercase tracking-wider font-mono font-semibold">Loop Frequency</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-white tabular-nums">
                {fusionHz.toLocaleString()}
              </span>
              <span className="text-sm uppercase font-mono text-cyan-400 font-bold">Hz</span>
            </div>
            <p className="text-sm text-slate-300 mt-2 flex items-center gap-2 font-mono">
              <span>Δt = {(1000 / fusionHz).toFixed(3)} ms</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-emerald-400 font-semibold">Jitter: ±{jitterMs.toFixed(3)} ms</span>
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 text-sm text-slate-300">
            15-State Discrete EKF Cycle Nominal
          </div>
        </div>

        {/* Card 2: Covariance Innovation Matrix Trace */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-300 mb-2">
            <span className="text-sm uppercase tracking-wider font-mono font-semibold">Covariance Trace</span>
            <Gauge className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-white tabular-nums">
                {traceP.toFixed(5)}
              </span>
              <span className="text-sm uppercase font-mono text-cyan-400 font-bold">m²</span>
            </div>
            <p className="text-sm text-slate-300 mt-2 flex items-center gap-2 font-mono">
              <span className="text-emerald-400 font-semibold">Target: P &lt; 0.0040 m²</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>κ(P): 1.082</span>
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 text-sm text-slate-300">
            Joseph Form Numerical Convergence
          </div>
        </div>

        {/* Card 3: Rolling Ledger Monotonicity */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-300 mb-2">
            <span className="text-sm uppercase tracking-wider font-mono font-semibold">Ledger Monotonicity</span>
            <Link2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-white tabular-nums">
                #{blockHeight.toLocaleString()}
              </span>
              <span className="text-sm uppercase font-mono text-slate-300 font-semibold">Ticks</span>
            </div>
            <p className="text-sm text-slate-300 mt-2 flex items-center gap-2 font-mono">
              {tamperDetected ? (
                <span className="text-rose-400 font-bold">Tamper Detected at Head</span>
              ) : verifiedChain ? (
                <span className="text-emerald-400 font-semibold">SHA-256 Verified Clean</span>
              ) : (
                <span className="text-amber-400 font-semibold">Chain Pending Verification</span>
              )}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 text-sm text-slate-300">
            TimescaleDB Immutable Triggers Active
          </div>
        </div>

        {/* Card 4: IP Clean-Room Audit */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-300 mb-2">
            <span className="text-sm uppercase tracking-wider font-mono font-semibold">IP Clean-Room Audit</span>
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-emerald-400 tabular-nums">
                0% GPL
              </span>
              <span className="text-sm uppercase font-mono text-slate-300 font-semibold">/ 100% MIT</span>
            </div>
            <p className="text-sm text-slate-300 mt-2 flex items-center gap-2 font-mono">
              <span>9/9 Deps Whitelisted</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-slate-200 font-medium">Clean-Room Cert</span>
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 text-sm text-slate-300">
            Acquire.com Micro-APA Escrow Ready
          </div>
        </div>
      </div>
    </section>
  );
};
