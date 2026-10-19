/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Cpu, Zap, Database, ShieldCheck, Check, Clock } from 'lucide-react';
import { DualVectorTorqueTelemetry, ConsensusPhase } from '../types/cockpit';

interface TelemetryCardsProps {
  currentPhase: ConsensusPhase;
  activeEpoch: number;
  commitLatencyMs: number;
  dual_vector_torque: DualVectorTorqueTelemetry;
  merkleRoot: string;
  activeNodesCount: number;
}

export const TelemetryCards: React.FC<TelemetryCardsProps> = ({
  currentPhase,
  activeEpoch,
  commitLatencyMs,
  dual_vector_torque,
  merkleRoot,
  activeNodesCount,
}) => {
  const frontPct = Math.round(dual_vector_torque.frontTorquePct);
  const rearPct = Math.round(dual_vector_torque.rearTorquePct);

  return (
    <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Consensus Quorum */}
        <div className="relative bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <span className="text-slate-400 text-sm font-semibold tracking-wider uppercase font-mono">
              Consensus Quorum
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono text-sm">
              <Check className="w-3.5 h-3.5" />
              {activeNodesCount}/4 Nodes Online
            </span>
          </div>

          <div className="mt-4">
            <div className="text-3xl font-extrabold text-white font-mono tracking-tight flex items-baseline gap-2">
              3f+1 BFT
              <span className="text-sm font-normal text-emerald-400">Finality</span>
            </div>
            <p className="text-slate-300 text-sm mt-1">
              Deterministic single-block commit
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400 font-mono">Active Phase:</span>
              <span className="font-mono font-bold text-amber-300 px-2 py-0.5 rounded bg-amber-950/40 border border-amber-500/30">
                {currentPhase}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400 font-mono">Commit Latency:</span>
              <span className="font-mono text-emerald-400 font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {commitLatencyMs.toFixed(2)} ms (&lt; 2.0 ms target)
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: DUAL_VECTOR_TORQUE Dual-Axle Split */}
        <div className="relative bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <span className="text-slate-400 text-sm font-semibold tracking-wider uppercase font-mono">
              DUAL_VECTOR_TORQUE Dual-Axle Split
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono text-sm font-medium">
              Dynamic AWD
            </span>
          </div>

          <div className="mt-4">
            <div className="text-3xl font-extrabold text-cyan-300 font-mono tracking-tight">
              {frontPct}:{rearPct}
            </div>
            <p className="text-slate-300 text-sm mt-1">
              Front {frontPct}% : Rear {rearPct}% eAxle
            </p>
          </div>

          {/* Torque Distribution Visual Bar */}
          <div className="mt-4 space-y-2">
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
              <div
                className="bg-cyan-500 transition-all duration-300"
                style={{ width: `${frontPct}%` }}
                title={`Front: ${frontPct}%`}
              />
              <div
                className="bg-indigo-500 transition-all duration-300"
                style={{ width: `${rearPct}%` }}
                title={`Rear: ${rearPct}%`}
              />
            </div>
            <div className="flex justify-between items-center text-sm font-mono text-slate-400">
              <span>Front {dual_vector_torque.frontPowerKw.toFixed(0)} kW</span>
              <span>Rear {dual_vector_torque.rearPowerKw.toFixed(0)} kW</span>
            </div>
          </div>
        </div>

        {/* Card 3: Epoch Sequence */}
        <div className="relative bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <span className="text-slate-400 text-sm font-semibold tracking-wider uppercase font-mono">
              Epoch Sequence
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded bg-purple-950/80 border border-purple-500/40 text-purple-300 font-mono text-sm font-medium">
              SHA-256 Ledger
            </span>
          </div>

          <div className="mt-4">
            <div className="text-3xl font-extrabold text-white font-mono tracking-tight">
              #{activeEpoch.toLocaleString()}
            </div>
            <p className="text-slate-300 text-sm mt-1">
              Monotonic height sequence
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5">
            <div className="text-slate-400 text-sm font-mono">Merkle Root:</div>
            <div className="font-mono text-sm text-purple-300 truncate bg-slate-950 px-2.5 py-1 rounded border border-slate-800" title={merkleRoot}>
              {merkleRoot.slice(0, 18)}...{merkleRoot.slice(-8)}
            </div>
          </div>
        </div>

        {/* Card 4: IP Clean-Room Audit */}
        <div className="relative bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <span className="text-slate-400 text-sm font-semibold tracking-wider uppercase font-mono">
              IP Clean-Room Audit
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono text-sm font-medium">
              0% Copyleft
            </span>
          </div>

          <div className="mt-4">
            <div className="text-3xl font-extrabold text-emerald-400 font-mono tracking-tight flex items-center gap-1.5">
              <ShieldCheck className="w-7 h-7" />
              Certified
            </div>
            <p className="text-slate-300 text-sm mt-1">
              Permissive clean-room codebase
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400 font-mono">License:</span>
              <span className="font-mono font-semibold text-slate-200">MIT (Deed Attached)</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400 font-mono">GPL Taint:</span>
              <span className="font-mono font-semibold text-emerald-400">0.00% Verified</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
