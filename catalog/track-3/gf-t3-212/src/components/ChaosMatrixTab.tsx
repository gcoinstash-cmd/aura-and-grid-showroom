import React from 'react';
import { ChaosActionLog, ClusterNodeInfo } from '../types/consensus';
import { ShieldAlert, WifiOff, RefreshCw, CheckCheck, Flame, AlertOctagon, Terminal } from 'lucide-react';
import { playFaultChime, playCommitChime, playMicroClick } from '../utils/audio';

interface ChaosMatrixTabProps {
  nodes: ClusterNodeInfo[];
  chaosLogs: ChaosActionLog[];
  currentView: number;
  sequenceHeight: number;
  requiredQuorum: number;
  totalNodes: number;
  onInjectEquivocation: () => void;
  onInjectPartition: () => void;
  onDropLeaderHeartbeat: () => void;
  onResynchronizeAll: () => void;
}

export const ChaosMatrixTab: React.FC<ChaosMatrixTabProps> = ({
  nodes,
  chaosLogs,
  currentView,
  sequenceHeight,
  requiredQuorum,
  totalNodes,
  onInjectEquivocation,
  onInjectPartition,
  onDropLeaderHeartbeat,
  onResynchronizeAll
}) => {
  const byzantineNodes = nodes.filter(n => n.isByzantine);
  const partitionedNodes = nodes.filter(n => n.isPartitioned);
  const honestOnlineNodes = nodes.filter(n => !n.isByzantine && !n.isPartitioned);
  const isQuorumMet = honestOnlineNodes.length >= requiredQuorum;

  return (
    <div className="space-y-6">
      {/* Top Header & Invariants Banner */}
      <div className="bg-[#0B0F19] border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-400" />
              <span>Fault &amp; Chaos Injection Matrix</span>
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Deterministic adversarial test triggers evaluating PBFT safety and liveness invariants under active network partition and Byzantine double-voting.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className={[
              'px-4 py-2 rounded-lg border text-sm font-semibold flex items-center gap-2',
              isQuorumMet
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            ].join(' ')}>
              <AlertOctagon className="w-4 h-4" />
              <span>
                Safety Status: {isQuorumMet ? 'QUORUM_SECURE (NO FORKS)' : 'SAFETY_HALTED (PREVENTING FORK)'}
              </span>
            </div>
          </div>
        </div>

        {/* Invariant Health Gauges */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-[#070A11] p-3.5 rounded-lg border border-slate-800">
            <div className="text-slate-400 text-sm">Active Byzantine Nodes</div>
            <div className="text-xl font-bold text-rose-400 font-mono mt-1">
              {byzantineNodes.length} / 3 f_max
            </div>
            <div className="text-sm text-slate-500 mt-1">
              {byzantineNodes.length <= 3 ? 'Within Tolerance Bound' : 'Tolerance Exceeded'}
            </div>
          </div>

          <div className="bg-[#070A11] p-3.5 rounded-lg border border-slate-800">
            <div className="text-slate-400 text-sm">Partitioned Node Links</div>
            <div className="text-xl font-bold text-amber-400 font-mono mt-1">
              {partitionedNodes.length} / {totalNodes} Nodes
            </div>
            <div className="text-sm text-slate-500 mt-1">
              {partitionedNodes.length > 0 ? 'Degraded Network Mesh' : 'Full Mesh Available'}
            </div>
          </div>

          <div className="bg-[#070A11] p-3.5 rounded-lg border border-slate-800">
            <div className="text-slate-400 text-sm">Honest Quorum Available</div>
            <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
              {honestOnlineNodes.length} / {requiredQuorum} Required
            </div>
            <div className="text-sm text-slate-500 mt-1">
              {isQuorumMet ? 'Consensus Operational' : 'Halted to Protect State'}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Interactive Simulation Triggers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Trigger 1: Byzantine Equivocation */}
        <div className="bg-[#0B0F19] border border-slate-800 rounded-xl p-4.5 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-3">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">
              Inject Byzantine Double-Vote
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Forces validator nodes to broadcast conflicting block digests during Prepare phase to test equivocation detection.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              playFaultChime();
              onInjectEquivocation();
            }}
            className="mt-4 min-h-[44px] w-full px-4 py-2.5 text-sm font-bold rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20 transition-colors"
          >
            Trigger Equivocation
          </button>
        </div>

        {/* Trigger 2: 33% Network Partition */}
        <div className="bg-[#0B0F19] border border-slate-800 rounded-xl p-4.5 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-3">
              <WifiOff className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">
              Simulate 33% Partition
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Isolates exactly 3 of 10 nodes (f nodes) into a disconnected network partition, driving quorum to the razor edge.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              playFaultChime();
              onInjectPartition();
            }}
            className="mt-4 min-h-[44px] w-full px-4 py-2.5 text-sm font-bold rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20 transition-colors"
          >
            Apply 33% Partition
          </button>
        </div>

        {/* Trigger 3: Drop Leader Heartbeat */}
        <div className="bg-[#0B0F19] border border-slate-800 rounded-xl p-4.5 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-3">
              <RefreshCw className="w-5 h-5 text-cyan-400" />
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">
              Drop Leader Heartbeat
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Simulates primary node crash, triggering PBFT view change timer and deterministic round-robin leader handover.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              playMicroClick(680);
              onDropLeaderHeartbeat();
            }}
            className="mt-4 min-h-[44px] w-full px-4 py-2.5 text-sm font-bold rounded-lg border border-cyan-500/40 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20 transition-colors"
          >
            Trigger View Change
          </button>
        </div>

        {/* Trigger 4: Re-synchronize Partitioned Nodes */}
        <div className="bg-[#0B0F19] border border-slate-800 rounded-xl p-4.5 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-3">
              <CheckCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">
              Re-synchronize Partitioned Nodes
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Dissolves partitions, clears Byzantine flags, and catches up all nodes to canonical state height #{sequenceHeight}.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              playCommitChime();
              onResynchronizeAll();
            }}
            className="mt-4 min-h-[44px] w-full px-4 py-2.5 text-sm font-bold rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20 transition-colors"
          >
            Restore Full Mesh
          </button>
        </div>
      </div>

      {/* Adversarial Event Log */}
      <div className="bg-[#0B0F19] border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <span>Adversarial Execution &amp; Invariant Log</span>
          </h3>
          <span className="text-sm text-slate-400 font-mono">
            {chaosLogs.length} Events Recorded
          </span>
        </div>

        <div className="mt-4 space-y-2 max-h-[320px] overflow-y-auto pr-1">
          {chaosLogs.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              No adversarial events recorded. Click one of the simulation triggers above to stress-test the cluster.
            </div>
          ) : (
            chaosLogs.map((log) => (
              <div
                key={log.id}
                className="bg-[#070A11] border border-slate-800 rounded-lg p-3 text-sm font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className="text-slate-500">{log.timestamp}</span>
                  <span className={[
                    'px-2 py-0.5 rounded text-sm font-bold border',
                    log.invariantStatus === 'SAFE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                    log.invariantStatus === 'DEGRADED' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                    'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                  ].join(' ')}>
                    {log.invariantStatus}
                  </span>
                  <span className="text-white font-bold">{log.action}</span>
                </div>
                <div className="text-slate-400 text-sm truncate max-w-lg">
                  {log.impact}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
