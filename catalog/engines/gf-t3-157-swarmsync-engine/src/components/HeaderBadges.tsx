import React from 'react';
import { ShieldCheck, Cpu, Zap, DollarSign, Activity } from 'lucide-react';
import { TelemetryState } from '../types/swarm';

interface HeaderBadgesProps {
  telemetry: TelemetryState;
  nodeCount: number;
}

export const HeaderBadges: React.FC<HeaderBadgesProps> = ({ telemetry, nodeCount }) => {
  return (
    <header className="border-b border-slate-800 bg-[#0a0f1d]/90 backdrop-blur-md px-4 py-4 md:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Title row */}
        <div>
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-emerald-400 font-bold uppercase mb-1">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            GHOST FACTORYOS // TRACK 3 F1 SKUNKWORKS
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2">
            SWARMSYNC ENGINE <span className="text-slate-500 font-light">//</span>{' '}
            <span className="text-cyan-400 whitespace-nowrap font-mono">GF-T3-157</span>
          </h1>
          <p className="text-sm text-slate-400 font-medium mt-0.5">
            Decentralized Peer Consensus &amp; Collision-Free Control Barrier Function (CBF) Flocking Core
          </p>
        </div>

        {/* Global Controls & Status Indicator */}
        <div className="flex items-center gap-3">
          <div className="bg-[#11192b] border border-cyan-500/30 px-3 py-1.5 rounded text-xs font-mono flex items-center gap-2">
            <span className="text-slate-400">EPOCH:</span>
            <span className="text-cyan-300 font-bold">#{telemetry.epoch.toLocaleString()}</span>
          </div>
          <div className="bg-[#11192b] border border-emerald-500/30 px-3 py-1.5 rounded text-xs font-mono flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">NODES:</span>
            <span className="text-emerald-300 font-bold">{nodeCount} ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Responsive 4-Badge Grid (Auto-wrapping 2x2 on mobile, 4 on desktop) */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        {/* Badge 1: APA Asset Transfer */}
        <div className="bg-gradient-to-br from-[#0c1424] to-[#080d1a] border border-emerald-500/30 hover:border-emerald-500/60 transition-colors p-3 sm:p-3.5 rounded-lg flex items-start gap-2.5 sm:gap-3 min-h-[72px] sm:min-h-[82px]">
          <div className="p-1.5 sm:p-2 bg-emerald-500/10 rounded-md border border-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1 flex flex-col justify-between">
            <div className="text-xs sm:text-sm uppercase font-mono tracking-wider text-slate-400 font-semibold leading-tight whitespace-normal">
              STANDALONE APA ASSET TRANSFER
            </div>
            <div className="text-sm sm:text-base md:text-lg font-mono font-bold text-emerald-400 whitespace-normal leading-tight mt-0.5">
              20 kHz (0.48ms)
            </div>
            <div className="text-[10px] sm:text-xs text-slate-400 font-medium whitespace-normal leading-snug mt-0.5">
              Delaware Turnkey Asset Transfer
            </div>
          </div>
        </div>

        {/* Badge 2: Consensus Latency */}
        <div className="bg-gradient-to-br from-[#0c1424] to-[#080d1a] border border-cyan-500/30 hover:border-cyan-500/60 transition-colors p-3 sm:p-3.5 rounded-lg flex items-start gap-2.5 sm:gap-3 min-h-[72px] sm:min-h-[82px]">
          <div className="p-1.5 sm:p-2 bg-cyan-500/10 rounded-md border border-cyan-500/20 text-cyan-400 shrink-0 mt-0.5">
            <Cpu className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1 flex flex-col justify-between">
            <div className="text-xs sm:text-sm uppercase font-mono tracking-wider text-slate-400 font-semibold leading-tight whitespace-normal">
              CONSENSUS LATENCY
            </div>
            <div className="text-sm sm:text-base md:text-lg font-mono font-bold text-cyan-300 whitespace-normal leading-tight mt-0.5">
              {telemetry.avgConsensusLatencyUs} µs <span className="text-[10px] sm:text-xs font-normal text-slate-400">(&lt;10 µs)</span>
            </div>
            <div className="text-[10px] sm:text-xs text-slate-400 font-medium whitespace-normal leading-snug mt-0.5">
              P2P O(log N) Gossip Cycle
            </div>
          </div>
        </div>

        {/* Badge 3: Protocol */}
        <div className="bg-gradient-to-br from-[#0c1424] to-[#080d1a] border border-amber-500/30 hover:border-amber-500/60 transition-colors p-3 sm:p-3.5 rounded-lg flex items-start gap-2.5 sm:gap-3 min-h-[72px] sm:min-h-[82px]">
          <div className="p-1.5 sm:p-2 bg-amber-500/10 rounded-md border border-amber-500/20 text-amber-400 shrink-0 mt-0.5">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1 flex flex-col justify-between">
            <div className="text-xs sm:text-sm uppercase font-mono tracking-wider text-slate-400 font-semibold leading-tight whitespace-normal">
              SAFETY PROTOCOL
            </div>
            <div className="text-sm sm:text-base md:text-lg font-mono font-bold text-amber-300 whitespace-normal leading-tight mt-0.5">
              CBF Flocking Mesh
            </div>
            <div className="text-[10px] sm:text-xs text-slate-400 font-medium whitespace-normal leading-snug mt-0.5">
              {telemetry.zeroCollisionInvariantHolds ? '✓ Invariant 100% Held' : '⚠️ Resolving Envelope'}
            </div>
          </div>
        </div>

        {/* Badge 4: Clean IP */}
        <div className="bg-gradient-to-br from-[#0c1424] to-[#080d1a] border border-indigo-500/30 hover:border-indigo-500/60 transition-colors p-3 sm:p-3.5 rounded-lg flex items-start gap-2.5 sm:gap-3 min-h-[72px] sm:min-h-[82px]">
          <div className="p-1.5 sm:p-2 bg-indigo-500/10 rounded-md border border-indigo-500/20 text-indigo-400 shrink-0 mt-0.5">
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1 flex flex-col justify-between">
            <div className="text-xs sm:text-sm uppercase font-mono tracking-wider text-slate-400 font-semibold leading-tight whitespace-normal">
              IP PROVENANCE
            </div>
            <div className="text-sm sm:text-base md:text-lg font-mono font-bold text-indigo-300 whitespace-normal leading-tight mt-0.5">
              Verified Permissive
            </div>
            <div className="text-[10px] sm:text-xs text-slate-400 font-medium whitespace-normal leading-snug mt-0.5">
              100% Clean-Room (MIT / Apache)
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
