import React from 'react';
import { Play, Pause, RefreshCw, ShieldCheck, Activity, Cpu, Network, Zap } from 'lucide-react';
import { ConsensusMode, ConsensusPhase } from '../types/consensus';
import { playMicroClick } from '../utils/audio';

interface HeaderHUDProps {
  currentView: number;
  sequenceHeight: number;
  consensusMode: ConsensusMode;
  phase: ConsensusPhase;
  roundLatencyMs: number;
  totalNodes: number;
  byzantineToleranceF: number;
  requiredQuorum: number;
  honestOnlineCount: number;
  activeLeaderId: string;
  isAutoProposing: boolean;
  onProposeBlock: () => void;
  onTriggerViewChange: () => void;
  onToggleMode: () => void;
  onToggleAutoPropose: () => void;
}

export const HeaderHUD: React.FC<HeaderHUDProps> = ({
  currentView,
  sequenceHeight,
  consensusMode,
  phase,
  roundLatencyMs,
  totalNodes,
  byzantineToleranceF,
  requiredQuorum,
  honestOnlineCount,
  activeLeaderId,
  isAutoProposing,
  onProposeBlock,
  onTriggerViewChange,
  onToggleMode,
  onToggleAutoPropose,
}) => {
  const quorumPercentage = ((honestOnlineCount / totalNodes) * 100).toFixed(1);
  const isQuorumMet = honestOnlineCount >= requiredQuorum;

  return (
    <header className="relative w-full border-b border-slate-800/80 bg-[#070A11] px-4 py-3">
      <div className="max-w-7xl mx-auto w-full">
        {/* ROW 1: Consolidated Sleek Command Bar */}
        <div className="flex items-center justify-between gap-2 w-full overflow-x-auto no-scrollbar">
          {/* Left: Flex group with icon, title, cyan badge TRACK 3, and compact mode pill */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <Cpu className="w-4 h-4 text-emerald-400" />
            </div>

            <span className="text-lg font-bold tracking-tight text-white font-mono shrink-0">
              APEX-212
            </span>

            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 shrink-0">
              TRACK 3
            </span>

            <button
              type="button"
              onClick={() => {
                playMicroClick(720);
                onToggleMode();
              }}
              title="Click to toggle consensus mode between PBFT and Raft"
              className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-900 border border-slate-700 text-slate-300 hover:border-cyan-500/50 hover:text-white transition-colors flex items-center gap-1 shrink-0"
            >
              <Network className="w-3 h-3 text-cyan-400" />
              <span>[{consensusMode}]</span>
            </button>
          </div>

          {/* Right: Action buttons docked with distinct slot and zero overlap */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                playMicroClick(650);
                onTriggerViewChange();
              }}
              className="px-2 py-0.5 text-[10px] font-semibold rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20 transition-colors flex items-center gap-1 shrink-0 whitespace-nowrap"
            >
              <RefreshCw className="w-3 h-3 text-amber-400" />
              <span>[View]</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playMicroClick(800);
                onToggleAutoPropose();
              }}
              className={[
                'px-2 py-0.5 text-[10px] font-semibold rounded-lg border transition-colors flex items-center gap-1 shrink-0 whitespace-nowrap',
                isAutoProposing
                  ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                  : 'border-slate-700 bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              ].join(' ')}
            >
              {isAutoProposing ? (
                <>
                  <Pause className="w-3 h-3 text-emerald-400" />
                  <span>[Pause]</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 text-slate-400" />
                  <span>[Stream]</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                playMicroClick(980);
                onProposeBlock();
              }}
              disabled={phase !== 'IDLE'}
              className={[
                'px-2 py-0.5 text-[10px] font-semibold rounded-lg transition-all flex items-center gap-1 shrink-0 whitespace-nowrap shadow-sm',
                phase === 'IDLE'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 active:scale-[0.98]'
                  : 'bg-emerald-500/10 text-emerald-400/50 border border-emerald-500/20 cursor-not-allowed opacity-60'
              ].join(' ')}
            >
              <Zap className="w-3 h-3 text-emerald-400" />
              <span>[+ Propose]</span>
            </button>
          </div>
        </div>

        {/* ROW 2: Condensed Subtitle Never Truncating */}
        <div className="text-xs text-slate-400 mt-1 whitespace-nowrap overflow-hidden">
          BFT Consensus &middot; 3-Phase PBFT &middot; Merkle State Trie &middot; Quorum n &gt;= 3f + 1
        </div>

        {/* 4-Card Horizontal Telemetry Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 my-3 w-full">
          {/* Card 1: Term / Height */}
          <div className="bg-[#070A11] border border-slate-800 rounded-lg py-3 px-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-sm">
              <span className="font-medium">Active Cluster View</span>
              <Activity className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-bold tracking-tight text-white font-mono">
                Term #{currentView}
              </span>
              <span className="text-sm font-semibold text-cyan-400 font-mono">
                Height #{sequenceHeight}
              </span>
            </div>
            <div className="mt-1 text-sm text-slate-400 truncate">
              Leader: <span className="text-cyan-300 font-mono">{activeLeaderId}</span>
            </div>
          </div>

          {/* Card 2: Quorum Health */}
          <div className="bg-[#070A11] border border-slate-800 rounded-lg py-3 px-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-sm">
              <span className="font-medium">Quorum Health</span>
              <ShieldCheck className={isQuorumMet ? 'w-4 h-4 text-emerald-400' : 'w-4 h-4 text-rose-400'} />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-bold tracking-tight text-white font-mono">
                {honestOnlineCount} / {totalNodes} Nodes
              </span>
              <span className={[
                'text-sm font-semibold font-mono',
                isQuorumMet ? 'text-emerald-400' : 'text-rose-400'
              ].join(' ')}>
                {quorumPercentage}%
              </span>
            </div>
            <div className="mt-1 text-sm text-slate-400">
              Required Quorum:{' '}
              <span className="text-slate-200 font-semibold font-mono">{requiredQuorum} Nodes</span>
            </div>
          </div>

          {/* Card 3: BFT Floor f_max */}
          <div className="bg-[#070A11] border border-slate-800 rounded-lg py-3 px-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-sm">
              <span className="font-medium">BFT Floor (f_max)</span>
              <Network className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-bold tracking-tight text-amber-400 font-mono">
                f_max = {byzantineToleranceF}
              </span>
              <span className="text-sm text-slate-400 font-mono">
                n = {totalNodes} Nodes
              </span>
            </div>
            <div className="mt-1 text-sm text-slate-400">
              Invariant: <span className="text-slate-200 font-mono">n &gt;= 3f + 1</span>
            </div>
          </div>

          {/* Card 4: Consensus Round Latency */}
          <div className="bg-[#070A11] border border-slate-800 rounded-lg py-3 px-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-sm">
              <span className="font-medium">Consensus Latency</span>
              <Zap className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-bold tracking-tight text-emerald-400 font-mono">
                {roundLatencyMs} ms
              </span>
              <span className="text-sm font-semibold text-emerald-300 font-mono">
                {phase}
              </span>
            </div>
            <div className="mt-1 text-sm text-slate-400">
              RTT Target:{' '}
              <span className="text-emerald-400 font-mono font-medium">Sub-50ms RTT</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
