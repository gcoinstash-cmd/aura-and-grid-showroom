/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, Cpu, Download, Play, CheckCircle2 } from 'lucide-react';

interface MonroneyBannerProps {
  onSimulateConsensus: () => void;
  onVerifyMerkleRoot: () => void;
  onExportSpec: () => void;
  isSimulating: boolean;
}

export const MonroneyBanner: React.FC<MonroneyBannerProps> = ({
  onSimulateConsensus,
  onVerifyMerkleRoot,
  onExportSpec,
  isSimulating,
}) => {
  return (
    <header className="relative w-full bg-slate-950 border-b border-slate-800 text-slate-100">
      {/* Top Monroney Asset Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          {/* Asset Identity */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center px-3 py-1 rounded border border-cyan-500/40 bg-cyan-950/60 text-cyan-300 font-mono text-sm font-semibold tracking-wider">
                ASSET ID: GF-T3-172
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded border border-emerald-500/40 bg-emerald-950/50 text-emerald-300 font-mono text-sm font-medium">
                ACQUIRE.COM DEAL ROOM VERIFIED
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded border border-purple-500/40 bg-purple-950/50 text-purple-300 font-mono text-sm">
                F-SPORT PERFORMANCE CORE
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Apex Executive Multi-Node High-Output Core High-G Dynamic Telemetry Core
              </h1>
              <span className="font-mono text-slate-400 text-sm font-semibold">
                v1.0.0-PROD
              </span>
            </div>
            <p className="text-slate-400 text-sm max-w-3xl leading-relaxed">
              Deterministic 3f+1 BFT HotStuff consensus coordinating distributed steer-by-wire and DUAL_VECTOR_TORQUE dual-axle torque split for the T24A-FTS hybrid powertrain.
            </p>
          </div>

          {/* Monroney Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-900 border border-emerald-500/40 rounded-lg p-3 min-w-[170px] shadow-sm">
              <div className="text-slate-400 text-sm font-medium">Micro-APA Asset Transfer</div>
              <div className="text-2xl font-bold text-emerald-400 font-mono">20 kHz (0.48ms)</div>
              <div className="text-emerald-300/80 text-sm font-mono">Immediate Escrow Closing</div>
            </div>

            <div className="bg-slate-900 border border-cyan-500/30 rounded-lg p-3 min-w-[170px] shadow-sm">
              <div className="text-slate-400 text-sm font-medium">Architecture Moat</div>
              <div className="text-2xl font-bold text-cyan-300 font-mono">PostgreSQL 16 + RLS</div>
              <div className="text-cyan-300/80 text-sm font-mono">Monopoly Vault Tier</div>
            </div>

            <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 min-w-[150px] shadow-sm">
              <div className="text-slate-400 text-sm font-medium">IP Classification</div>
              <div className="text-xl font-bold text-slate-100 font-mono flex items-center gap-1.5 mt-0.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                100% MIT
              </div>
              <div className="text-slate-400 text-sm font-mono">0% Copyleft Taint</div>
            </div>
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onSimulateConsensus}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition shadow-sm ${
                isSimulating
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/30'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/30'
              }`}
            >
              {isSimulating ? (
                <>
                  <Cpu className="w-4 h-4 animate-spin text-amber-200" />
                  Consensus Engine Active (10 Hz)
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  Simulate Swarm Consensus
                </>
              )}
            </button>

            <button
              onClick={onVerifyMerkleRoot}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 transition"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Verify Epoch Merkle Root
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onExportSpec}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition"
            >
              <Download className="w-4 h-4" />
              Export GF_T3_172_SPEC.md
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
