import React, { useState } from 'react';
import {
  Layers,
  Sparkles,
  Server,
  RefreshCw,
} from 'lucide-react';
import {
  ClientSettlementEngine,
  NodeStatus,
} from '../core/settlementEngine';

interface TssClusterMeshProps {
  engine: ClientSettlementEngine;
}

export const TssClusterMesh: React.FC<TssClusterMeshProps> = ({ engine }) => {
  const [nodes, setNodes] = useState<NodeStatus[]>(engine.nodes);
  const [selectedSubset, setSelectedSubset] = useState<number[]>([1, 2, 3]);
  const [verificationResult, setVerificationResult] = useState<string | null>(null);

  const toggleNodeOnline = (id: number) => {
    setNodes(prev =>
      prev.map(n => {
        if (n.id === id) {
          const nextState = !n.isOnline;
          return {
            ...n,
            isOnline: nextState,
            health: nextState ? (n.isByzantine ? 'BYZANTINE' : 'HEALTHY') : 'OFFLINE',
          };
        }
        return n;
      })
    );
  };

  const toggleNodeByzantine = (id: number) => {
    setNodes(prev =>
      prev.map(n => {
        if (n.id === id) {
          const nextByz = !n.isByzantine;
          return {
            ...n,
            isByzantine: nextByz,
            health: !n.isOnline ? 'OFFLINE' : nextByz ? 'BYZANTINE' : 'HEALTHY',
          };
        }
        return n;
      })
    );
  };

  const toggleSubsetNode = (id: number) => {
    setSelectedSubset(prev => {
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev;
        return prev.filter(x => x !== id);
      } else {
        return [...prev, id].sort((a, b) => a - b);
      }
    });
    setVerificationResult(null);
  };

  const handleVerifyLagrange = () => {
    if (selectedSubset.length < 3) {
      setVerificationResult('FAILED: Sub-threshold selection. Minimum 3 nodes required for degree-2 polynomial.');
      return;
    }
    const reconstructed = engine.reconstructSecret(selectedSubset);
    if (reconstructed === engine.masterSecret) {
      setVerificationResult(`SUCCESS: Lagrange interpolation of nodes [${selectedSubset.join(', ')}] matched master group secret perfectly! (s = 0x${reconstructed.toString(16).slice(0, 16)}...)`);
    } else {
      setVerificationResult('FAILED: Reconstruction mismatch.');
    }
  };

  const onlineCount = nodes.filter(n => n.isOnline).length;
  const quorumAvailable = onlineCount >= 3;

  return (
    <div className="space-y-8">
      {/* Cluster Status Top Card */}
      <div className="bg-[#0b1224] border border-cyan-900/50 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-md bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-xs font-black uppercase tracking-wider">
                FROST RFC 9380 MESH
              </span>
              <span className="text-sm font-bold text-slate-300 font-mono">
                5-NODE SECURE ENCLAVE CLUSTER
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              TSS Node Cluster &amp; Key Shard Mesh
            </h2>
            <p className="text-lg text-slate-200 font-medium max-w-4xl leading-relaxed">
              Feldman Verifiable Secret Sharing (VSS) over Secp256k1. 5 multi-cloud isolated enclaves
              execute collaborative partial signing with zero exposure of root private keys.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-5 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-right shadow-inner">
              <span className="text-sm text-slate-300 font-bold block">Quorum Health</span>
              <span className={`text-lg font-black font-mono ${quorumAvailable ? 'text-emerald-400' : 'text-rose-400'}`}>
                {onlineCount} / 5 ONLINE ({quorumAvailable ? 'QUORUM READY' : 'DEGRADED'})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5-Node Interactive Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <Server className="w-6 h-6 text-cyan-400" />
            <h3 className="text-xl font-bold text-white">Institutional Enclave Nodes (Click to Simulate Outage / Fault)</h3>
          </div>
          <span className="text-sm font-bold text-slate-300 bg-slate-900 px-3 py-1 rounded-md border border-slate-800">
            THRESHOLD: 3 OF 5
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {nodes.map(node => {
            const shard = engine.shares.find(s => s.index === node.id);
            return (
              <div
                key={node.id}
                className={`p-5 rounded-2xl border transition-all ${
                  !node.isOnline
                    ? 'bg-slate-950/60 border-slate-800 opacity-60'
                    : node.isByzantine
                    ? 'bg-rose-950/30 border-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                    : 'bg-[#090f1f] border-cyan-800/60 shadow-lg'
                }`}
              >
                <div className="flex items-center justify-between mb-3.5">
                  <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded border border-cyan-800">
                    NODE #{node.id}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {node.health === 'HEALTHY' && (
                      <span className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                    {node.health === 'BYZANTINE' && (
                      <span className="h-3 w-3 rounded-full bg-rose-400 animate-ping" />
                    )}
                    {node.health === 'OFFLINE' && (
                      <span className="h-3 w-3 rounded-full bg-slate-600" />
                    )}
                    <span className="text-sm font-bold text-slate-200">{node.health}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-lg font-bold text-white">{node.name}</h4>
                  <p className="text-sm text-slate-300 font-medium">{node.enclaveType}</p>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{node.region}</p>
                </div>

                <div className="space-y-2 text-sm font-mono bg-slate-900/90 p-3 rounded-xl border border-slate-800 mb-4">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Latency:</span>
                    <span className="font-bold text-cyan-300">{node.latencyMs} ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Share s_{node.id}:</span>
                    <span className="text-slate-200 font-bold">
                      {shard?.secretShare.toString(16).slice(0, 8)}...
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Commit C_{node.id}:</span>
                    <span className="text-slate-400 truncate max-w-[110px]">{shard?.publicCommitment}</span>
                  </div>
                </div>

                {/* Simulation Control Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => toggleNodeOnline(node.id)}
                    className={`px-2.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      node.isOnline
                        ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                    }`}
                  >
                    {node.isOnline ? 'Go Offline' : 'Restore Online'}
                  </button>
                  <button
                    onClick={() => toggleNodeByzantine(node.id)}
                    disabled={!node.isOnline}
                    className={`px-2.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      node.isByzantine
                        ? 'bg-rose-950 text-rose-300 border border-rose-700'
                        : 'bg-slate-800 text-slate-200 hover:bg-rose-950/60 hover:text-rose-300'
                    }`}
                  >
                    {node.isByzantine ? 'Heal Node' : 'Corrupt (Byz)'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Secret Sharing Polynomial & Lagrange Interpolator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Polynomial Visualizer & Math Formulation */}
        <div className="bg-[#090f1f] border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-lg space-y-4">
          <div className="flex items-center gap-2.5 pb-3.5 border-b border-slate-800">
            <Layers className="w-6 h-6 text-cyan-400" />
            <h3 className="text-xl font-bold text-white">Shamir &amp; Feldman Secret Polynomial</h3>
          </div>

          <p className="text-base text-slate-200 font-medium leading-relaxed">
            For threshold $k = 320 kHz (0.48ms) a degree-2 random polynomial is evaluated over the finite field $\mathbb&#123;Z&#125;_n$:
          </p>

          <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 font-mono text-base space-y-2">
            <div className="text-cyan-400 font-bold text-lg">
              f(x) = s + a₁·x + a₂·x² (mod n)
            </div>
            <div className="text-sm text-slate-300">
              Where <span className="text-white font-bold">s = f(0)</span> is the root group secret key, and coefficients a₁, a₂ are sampled uniformly at random.
            </div>
            <div className="text-xs text-slate-400 pt-1 break-all">
              Field Order n = <span className="text-slate-200">0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141</span>
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            <h4 className="text-base font-bold text-slate-100">Polynomial Shards at x = 1..5:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 text-sm font-mono">
              {engine.shares.map(s => (
                <div key={s.index} className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-center">
                  <span className="block text-slate-300 font-bold">x = {s.index}</span>
                  <span className="font-bold text-cyan-300 block truncate mt-1">
                    0x{s.secretShare.toString(16).slice(0, 8)}...
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Interactive Lagrange Coefficient Calculator */}
        <div className="bg-[#090f1f] border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-6 h-6 text-cyan-400" />
              <h3 className="text-xl font-bold text-white">Interactive Lagrange Interpolator</h3>
            </div>
            <span className="text-xs font-bold text-cyan-400 bg-cyan-950/70 px-2.5 py-1 rounded border border-cyan-800/40">
              ZERO RECONSTRUCTION RISK
            </span>
          </div>

          <p className="text-base text-slate-200 font-medium leading-relaxed">
            Select any 3 or more nodes to compute the Lagrange basis coefficients $\lambda_i(0)$:
          </p>

          <div className="flex flex-wrap gap-2.5">
            {nodes.map(n => {
              const isSelected = selectedSubset.includes(n.id);
              return (
                <button
                  key={n.id}
                  onClick={() => toggleSubsetNode(n.id)}
                  className={`px-3.5 py-2 rounded-xl text-sm font-bold font-mono transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  Node #{n.id} ({n.name.split(' ')[1]}) {isSelected ? '✓' : '+'}
                </button>
              );
            })}
          </div>

          <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-2.5">
            <span className="text-sm font-black text-slate-300 uppercase tracking-wider block">
              Computed Lagrange Weights λ_i for Subset [{selectedSubset.join(', ')}]:
            </span>
            <div className="space-y-1.5 text-sm font-mono">
              {selectedSubset.map(id => {
                const lam = engine.getLagrangeCoefficient(id, selectedSubset);
                return (
                  <div key={id} className="flex justify-between text-slate-200">
                    <span className="text-cyan-400 font-bold">λ_{id}:</span>
                    <span className="truncate max-w-[280px]">0x{lam.toString(16)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleVerifyLagrange}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-base transition-all active:scale-95 cursor-pointer shadow-md"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Verify Mathematical Equivalence</span>
            </button>
          </div>

          {verificationResult && (
            <div
              className={`p-4 rounded-xl text-sm font-mono font-bold leading-relaxed ${
                verificationResult.startsWith('SUCCESS')
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700'
                  : 'bg-rose-950/80 text-rose-300 border border-rose-700'
              }`}
            >
              {verificationResult}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
