import React, { useState } from 'react';
import { ClusterNodeInfo } from '../types/consensus';
import { Shield, ShieldAlert, WifiOff, CheckCircle2, Crown, Zap, Server, SlidersHorizontal } from 'lucide-react';
import { truncateHash } from '../utils/crypto';
import { playFaultChime } from '../utils/audio';

interface NodeMeshTabProps {
  nodes: ClusterNodeInfo[];
  currentView: number;
  sequenceHeight: number;
  totalNodes: number;
  requiredQuorum: number;
  byzantineToleranceF: number;
  onToggleByzantine: (id: string) => void;
  onTogglePartition: (id: string) => void;
}

export const NodeMeshTab: React.FC<NodeMeshTabProps> = ({
  nodes,
  currentView,
  sequenceHeight,
  totalNodes,
  requiredQuorum,
  byzantineToleranceF,
  onToggleByzantine,
  onTogglePartition
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>(nodes[0]?.id || '');
  const selectedNode = nodes.find(n => n.id === selectedNodeId) || nodes[0];

  const honestCount = nodes.filter(n => !n.isByzantine && !n.isPartitioned).length;
  const isQuorumSafe = honestCount >= requiredQuorum;

  return (
    <div className="space-y-6">
      {/* Top Topology Summary Bar */}
      <div className="bg-[#0B0F19] border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Server className="w-5 h-5 text-cyan-400" />
              <span>Synthetic Cluster Validator Mesh</span>
              <span className="text-sm font-normal text-slate-400 font-mono">
                (Cluster View #{currentView})
              </span>
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Fully connected peer-to-peer Byzantine fault-tolerant topology. Demonstrates quorum consensus safety (n = {totalNodes}, f = {byzantineToleranceF}).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className={[
              'px-4 py-2 rounded-lg border text-sm font-semibold flex items-center gap-2',
              isQuorumSafe
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            ].join(' ')}>
              {isQuorumSafe ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Quorum Invariant Maintained ({honestCount} / {requiredQuorum} Required)</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Quorum Deficit: Liveness Halted for Safety</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Quorum Visual Meter */}
        <div className="mt-4 pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
            <span>Quorum Threshold: 2f + 1 = {requiredQuorum} / {totalNodes} Nodes (66.7% - 70.0% Floor)</span>
            <span className="font-mono text-slate-200">{honestCount} Honest Online Nodes</span>
          </div>
          <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden flex gap-1 p-0.5 border border-slate-800">
            {nodes.map(n => {
              let segmentColor = 'bg-emerald-500';
              if (n.isPartitioned) segmentColor = 'bg-slate-700';
              else if (n.isByzantine) segmentColor = 'bg-rose-500';
              else if (n.role === 'LEADER') segmentColor = 'bg-cyan-400';

              return (
                <div
                  key={n.id}
                  className={['h-full flex-1 rounded-sm transition-all', segmentColor].join(' ')}
                  title={n.id + ' (' + (n.isPartitioned ? 'Partitioned' : n.isByzantine ? 'Byzantine' : n.role) + ')'}
                />
              );
            })}
          </div>
          <div className="flex items-center justify-between text-sm text-slate-500 mt-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-cyan-400" /> Leader</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Honest Follower</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> Byzantine Equivocator</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-slate-700" /> Partitioned Node</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Nodes + Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Node Cards List (2 Columns) */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {nodes.map(node => {
            const isSelected = node.id === selectedNode.id;
            const isLeader = node.role === 'LEADER';

            let cardBorder = 'border-slate-800 hover:border-slate-700';
            if (isSelected) cardBorder = 'border-cyan-500/60 ring-1 ring-cyan-500/30';
            else if (node.isPartitioned) cardBorder = 'border-slate-800/60 opacity-65';
            else if (node.isByzantine) cardBorder = 'border-rose-500/30';

            return (
              <div
                key={node.id}
                onClick={() => setSelectedNodeId(node.id)}
                className={[
                  'bg-[#0B0F19] rounded-xl p-4.5 border transition-all cursor-pointer relative flex flex-col justify-between',
                  cardBorder
                ].join(' ')}
              >
                <div>
                  {/* Node Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {isLeader ? (
                        <div className="p-1.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                          <Crown className="w-4 h-4" />
                        </div>
                      ) : node.isByzantine ? (
                        <div className="p-1.5 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-400">
                          <ShieldAlert className="w-4 h-4" />
                        </div>
                      ) : node.isPartitioned ? (
                        <div className="p-1.5 rounded-md bg-slate-800 border border-slate-700 text-slate-400">
                          <WifiOff className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="p-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                          <Shield className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-bold text-white font-mono truncate">
                          {node.id}
                        </div>
                        <div className="text-sm text-slate-400">
                          Stake Weight: <span className="text-slate-200 font-mono font-semibold">{node.stakeUnits.toLocaleString()} Units</span>
                        </div>
                      </div>
                    </div>

                    <span className={[
                      'px-2.5 py-1 text-sm font-semibold rounded-md border shrink-0',
                      isLeader
                        ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                        : node.isByzantine
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                        : node.isPartitioned
                        ? 'bg-slate-800 border-slate-700 text-slate-400'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    ].join(' ')}>
                      {isLeader ? 'LEADER' : node.isByzantine ? 'BYZANTINE' : node.isPartitioned ? 'PARTITIONED' : 'HONEST'}
                    </span>
                  </div>

                  {node.phaseBadge && (
                    <div className="mt-2 text-xs font-mono font-bold px-2 py-0.5 rounded border border-cyan-500/40 bg-cyan-500/15 text-cyan-300 inline-block">
                      {node.phaseBadge}
                    </div>
                  )}

                  {/* Telemetry metrics */}
                  <div className="mt-3.5 grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-[#070A11] p-2.5 rounded-lg border border-slate-800/80">
                      <div className="text-slate-400">Committed Height</div>
                      <div className="text-base font-bold text-white font-mono mt-0.5">
                        #{node.committedHeight}
                      </div>
                    </div>
                    <div className="bg-[#070A11] p-2.5 rounded-lg border border-slate-800/80">
                      <div className="text-slate-400">Votes Cast</div>
                      <div className="text-base font-bold text-slate-200 font-mono mt-0.5">
                        {node.votesCast.toLocaleString()} Rounds
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Toggle Controls */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      playFaultChime();
                      onToggleByzantine(node.id);
                    }}
                    className={[
                      'px-3 py-1.5 text-sm font-semibold rounded-md border transition-colors',
                      node.isByzantine
                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-200 hover:bg-rose-500/30'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-rose-400'
                    ].join(' ')}
                  >
                    {node.isByzantine ? 'Byzantine (Active)' : 'Flag Byzantine'}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      playFaultChime();
                      onTogglePartition(node.id);
                    }}
                    className={[
                      'px-3 py-1.5 text-sm font-semibold rounded-md border transition-colors',
                      node.isPartitioned
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-200 hover:bg-amber-500/30'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-amber-400'
                    ].join(' ')}
                  >
                    {node.isPartitioned ? 'Partitioned' : 'Partition Link'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Node Telemetry & Cryptographic Inspector */}
        <div className="bg-[#0B0F19] border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-emerald-400" />
                <span>Validator Telemetry Drawer</span>
              </h3>
              <span className="text-sm font-mono text-cyan-400">{selectedNode.id}</span>
            </div>

            <div className="mt-4 space-y-4">
              <div className="bg-[#070A11] p-3.5 rounded-lg border border-slate-800">
                <div className="text-sm text-slate-400">Node Designation</div>
                <div className="text-base font-bold text-white font-mono mt-0.5">{selectedNode.label}</div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-[#070A11] p-3 rounded-lg border border-slate-800">
                  <div className="text-slate-400">Stake Weight</div>
                  <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">
                    {selectedNode.stakeUnits.toLocaleString()} Units
                  </div>
                </div>
                <div className="bg-[#070A11] p-3 rounded-lg border border-slate-800">
                  <div className="text-slate-400">Role In Cluster</div>
                  <div className="text-base font-bold text-white font-mono mt-0.5">
                    {selectedNode.role}
                  </div>
                </div>
              </div>

              <div className="bg-[#070A11] p-3.5 rounded-lg border border-slate-800 text-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Byzantine Equivocation:</span>
                  <span className={selectedNode.isByzantine ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                    {selectedNode.isByzantine ? 'ACTIVE ADVERSARY' : 'NORMAL HONEST'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Network Link State:</span>
                  <span className={selectedNode.isPartitioned ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                    {selectedNode.isPartitioned ? 'LINK DROP (33% PARTITION)' : 'ONLINE & SYNCHRONIZED'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Committed Sequence:</span>
                  <span className="text-white font-mono font-bold">#{selectedNode.committedHeight}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Rounds Participated:</span>
                  <span className="text-slate-200 font-mono">{selectedNode.votesCast} Rounds</span>
                </div>
              </div>

              <div className="bg-[#070A11] p-3.5 rounded-lg border border-slate-800 text-sm">
                <div className="text-slate-400">Last Verified Signature Digest</div>
                <div className="text-sm font-mono text-emerald-400/90 break-all mt-1 bg-slate-900/60 p-2 rounded border border-slate-800">
                  {selectedNode.lastCommitDigest ? selectedNode.lastCommitDigest : 'SHA-256(GENESIS_INITIAL_EPOCH)'}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 space-y-2.5">
            <button
              type="button"
              onClick={() => {
                playFaultChime();
                onToggleByzantine(selectedNode.id);
              }}
              className="w-full min-h-[44px] px-4 py-2.5 text-sm font-bold rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 transition-colors flex items-center justify-center gap-2"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Toggle Byzantine Equivocation ({selectedNode.isByzantine ? 'Disable' : 'Enable'})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                playFaultChime();
                onTogglePartition(selectedNode.id);
              }}
              className="w-full min-h-[44px] px-4 py-2.5 text-sm font-bold rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition-colors flex items-center justify-center gap-2"
            >
              <WifiOff className="w-4 h-4" />
              <span>Toggle Network Partition ({selectedNode.isPartitioned ? 'Restore' : 'Isolate'})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
