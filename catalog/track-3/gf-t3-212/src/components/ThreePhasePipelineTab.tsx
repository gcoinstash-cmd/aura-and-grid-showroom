import React, { useState } from 'react';
import { ConsensusPhase, ConsensusRoundMessage, ClusterNodeInfo } from '../types/consensus';
import { ArrowRight, CheckCircle, Clock, AlertTriangle, Send, ShieldCheck, Cpu } from 'lucide-react';
import { truncateHash } from '../utils/crypto';

interface ThreePhasePipelineTabProps {
  phase: ConsensusPhase;
  currentView: number;
  sequenceHeight: number;
  messages: ConsensusRoundMessage[];
  nodes: ClusterNodeInfo[];
  requiredQuorum: number;
  totalNodes: number;
  roundLatencyMs: number;
  onExecuteRound: (customOp?: Record<string, unknown>) => void;
  onTriggerViewChange: () => void;
}

export const ThreePhasePipelineTab: React.FC<ThreePhasePipelineTabProps> = ({
  phase,
  currentView,
  sequenceHeight,
  messages,
  nodes,
  requiredQuorum,
  totalNodes,
  roundLatencyMs,
  onExecuteRound,
  onTriggerViewChange
}) => {
  const [filterPhase, setFilterPhase] = useState<string>('ALL');
  const [customOpKey, setCustomOpKey] = useState<string>('ORACLE_DYNAMIC_FEED');
  const [customOpVal, setCustomOpVal] = useState<string>('{"medianTick": 1422.8, "units": 50000}');

  const leader = nodes.find(n => n.role === 'LEADER') || nodes[0];
  const honestCount = nodes.filter(n => !n.isByzantine && !n.isPartitioned).length;

  const filteredMessages = messages.filter(msg => {
    if (filterPhase === 'ALL') return true;
    return msg.phase === filterPhase;
  });

  const handleProposeCustom = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(customOpVal);
      onExecuteRound({ [customOpKey]: parsed });
    } catch {
      onExecuteRound({ [customOpKey]: customOpVal });
    }
  };

  const phases = [
    {
      id: 'PRE_PREPARE',
      name: 'Phase 1: Pre-Prepare',
      desc: 'Leader creates proposal, attaches Merkle root, and broadcasts digest to all peers.',
      active: phase === 'PRE_PREPARE',
      completed: ['PREPARE', 'COMMIT', 'FINALIZED'].includes(phase)
    },
    {
      id: 'PREPARE',
      name: 'Phase 2: Prepare',
      desc: 'Peers verify non-equivocation and exchange prepare signatures until 2f + 1 threshold is reached.',
      active: phase === 'PREPARE',
      completed: ['COMMIT', 'FINALIZED'].includes(phase)
    },
    {
      id: 'COMMIT',
      name: 'Phase 3: Commit',
      desc: 'Peers broadcast commit certificates, mutate canonical Merkle trie, and append immutable block.',
      active: phase === 'COMMIT',
      completed: phase === 'FINALIZED'
    }
  ];

  return (
    <div className="space-y-6">
      {/* 3-Phase Visual Pipeline Diagram */}
      <div className="bg-[#0B0F19] border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Cpu className="w-5 h-5 text-emerald-400" />
              <span>PBFT 3-Phase State Transition Pipeline</span>
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">
              Sequence Height #{sequenceHeight} - View Term #{currentView} - Leader: {leader.id}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">
              Quorum Floor: <span className="font-mono text-emerald-400 font-bold">{requiredQuorum} / {totalNodes} Nodes</span>
            </span>
          </div>
        </div>

        {/* Pipeline Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {phases.map((st, index) => {
            let cardBg = 'bg-[#070A11] border-slate-800 text-slate-400';
            if (st.active) {
              cardBg = 'bg-cyan-500/10 border-cyan-500/50 text-cyan-200 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/30';
            } else if (st.completed) {
              cardBg = 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200';
            }

            return (
              <div
                key={st.id}
                className={['rounded-xl p-4.5 border transition-all flex flex-col justify-between relative', cardBg].join(' ')}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-sm font-bold font-mono uppercase tracking-wider text-slate-300">
                      Step 0{index + 1}
                    </span>
                    {st.completed ? (
                      <span className="flex items-center gap-1 text-sm font-semibold text-emerald-400">
                        <CheckCircle className="w-4 h-4" /> Quorum Met
                      </span>
                    ) : st.active ? (
                      <span className="flex items-center gap-1 text-sm font-semibold text-cyan-400 animate-pulse">
                        <Clock className="w-4 h-4" /> Voting
                      </span>
                    ) : (
                      <span className="text-sm text-slate-500">Standby</span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-white mb-1.5">{st.name}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{st.desc}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-sm">
                  <span className="text-slate-400">Target Invariant</span>
                  <span className="font-mono text-slate-200 font-semibold">
                    {index === 0 ? 'Unique Proposal' : index === 1 ? '2f+1 Non-Equivocation' : 'Atomic Commit'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Manual Proposer Form & Round Control */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Custom State Batch Proposer */}
        <div className="bg-[#0B0F19] border border-slate-800 rounded-xl p-5">
          <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <Send className="w-5 h-5 text-cyan-400" />
            <span>Propose State Mutation Batch</span>
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            Construct a state transition operation to broadcast through the PBFT pipeline.
          </p>

          <form onSubmit={handleProposeCustom} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">State Key Identifier</label>
              <input
                type="text"
                value={customOpKey}
                onChange={(e) => setCustomOpKey(e.target.value)}
                className="w-full bg-[#070A11] border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
                placeholder="e.g. ACCOUNT_LEDGER_008"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Payload JSON / Value</label>
              <textarea
                value={customOpVal}
                onChange={(e) => setCustomOpVal(e.target.value)}
                rows={3}
                className="w-full bg-[#070A11] border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
                placeholder="JSON state payload"
                required
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={phase !== 'IDLE'}
                className="w-full min-h-[44px] px-5 py-2.5 text-base font-bold rounded-lg bg-emerald-400 text-slate-950 hover:bg-emerald-300 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShieldCheck className="w-5 h-5" />
                <span>Execute PBFT State Transition</span>
              </button>
            </div>
          </form>
        </div>

        {/* Live Inter-Node Consensus Message Bus (2 Columns) */}
        <div className="lg:col-span-2 bg-[#0B0F19] border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ArrowRight className="w-5 h-5 text-cyan-400" />
                  <span>Real-Time Consensus Message Bus</span>
                </h3>
                <span className="text-sm text-slate-400">
                  Signed peer broadcast packets &amp; verification verdicts
                </span>
              </div>

              {/* Segmented Filter Buttons */}
              <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
                {['ALL', 'PRE_PREPARE', 'PREPARE', 'COMMIT'].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilterPhase(f)}
                    className={[
                      'px-3 py-1.5 text-sm font-semibold rounded-md transition-colors',
                      filterPhase === f
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    ].join(' ')}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Messages Feed */}
            <div className="mt-4 space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {filteredMessages.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  No consensus messages recorded for this phase filter. Propose a batch to view packets.
                </div>
              ) : (
                filteredMessages.slice(0, 15).map((msg) => {
                  let badgeColor = 'bg-slate-800 text-slate-300 border-slate-700';
                  if (msg.status === 'REJECTED_BYZANTINE') {
                    badgeColor = 'bg-rose-500/10 text-rose-300 border-rose-500/30';
                  } else if (msg.status === 'DROPPED_PARTITION') {
                    badgeColor = 'bg-amber-500/10 text-amber-300 border-amber-500/30';
                  } else if (msg.phase === 'PRE_PREPARE') {
                    badgeColor = 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30';
                  } else if (msg.phase === 'PREPARE') {
                    badgeColor = 'bg-amber-500/10 text-amber-300 border-amber-500/30';
                  } else if (msg.phase === 'COMMIT') {
                    badgeColor = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
                  }

                  return (
                    <div
                      key={msg.id}
                      className="bg-[#070A11] border border-slate-800/90 rounded-lg p-3 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 font-mono"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className={['px-2 py-0.5 rounded text-sm font-bold border shrink-0', badgeColor].join(' ')}>
                          {msg.phase}
                        </span>
                        <span className="text-slate-300 truncate">
                          {msg.senderNodeId} &rarr; {msg.targetNodeId}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 text-slate-400">
                        <span className="text-slate-400 text-sm">
                          Digest: <span className="text-slate-200">{truncateHash(msg.digest, 6)}</span>
                        </span>
                        <span className={[
                          'text-sm font-semibold',
                          msg.status === 'DELIVERED' ? 'text-emerald-400' :
                          msg.status === 'DROPPED_PARTITION' ? 'text-amber-400' : 'text-rose-400'
                        ].join(' ')}>
                          [{msg.status}]
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-sm text-slate-400">
            <span>Buffer: Last 40 Packet Telemetry Frames</span>
            <span>Round-Trip Transit: {roundLatencyMs} ms</span>
          </div>
        </div>
      </div>
    </div>
  );
};
