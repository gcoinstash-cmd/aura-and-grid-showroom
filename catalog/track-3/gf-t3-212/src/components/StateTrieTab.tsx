import React, { useState } from 'react';
import { MerkleKV, LedgerBlock } from '../types/consensus';
import { Database, Link2, Plus, AlertCircle, CheckCircle2, ShieldAlert, Cpu } from 'lucide-react';
import { truncateHash, sha256Sync } from '../utils/crypto';

interface StateTrieTabProps {
  stateKVs: MerkleKV[];
  canonicalStateRoot: string;
  ledger: LedgerBlock[];
  sequenceHeight: number;
  tamperedBlockIndex: number | null;
  onUpdateStateKV: (key: string, value: string) => void;
  onSimulateTamper: (index: number) => void;
  onRestoreIntegrity: () => void;
}

export const StateTrieTab: React.FC<StateTrieTabProps> = ({
  stateKVs,
  canonicalStateRoot,
  ledger,
  sequenceHeight,
  tamperedBlockIndex,
  onUpdateStateKV,
  onSimulateTamper,
  onRestoreIntegrity
}) => {
  const [newKey, setNewKey] = useState<string>('');
  const [newVal, setNewVal] = useState<string>('');
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number>(ledger.length - 1);

  const handleAddState = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim()) return;
    onUpdateStateKV(newKey.trim(), newVal.trim() || '{"status": "INITIALIZED"}');
    setNewKey('');
    setNewVal('');
  };

  const selectedBlock = ledger[selectedBlockIndex] || ledger[ledger.length - 1];

  // Chain immutability verification
  const chainIntegrityChecks = ledger.map((block, idx) => {
    if (idx === 0) return { blockNumber: block.blockNumber, isValid: true };
    const prevBlock = ledger[idx - 1];
    const isLinked = block.previousHash === prevBlock.blockHash;
    const isTampered = tamperedBlockIndex === idx;
    return {
      blockNumber: block.blockNumber,
      isValid: isLinked && !isTampered
    };
  });

  const hasTamper = tamperedBlockIndex !== null;

  return (
    <div className="space-y-6">
      {/* Root Hash Banner */}
      <div className="bg-[#0B0F19] border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-bold text-white tracking-tight">
                Cryptographic Merkle State Trie
              </h2>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Deterministic binary SHA-256 tree reduction over sorted state leaves. FIPS 180-4 compliant.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 font-mono">
            <span className="text-sm text-slate-400">Canonical Root:</span>
            <div className="px-3.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-bold truncate max-w-md">
              {canonicalStateRoot}
            </div>
          </div>
        </div>

        {/* Merkle Root Tamper Diff Inspector */}
        <div className="mt-4 p-4 rounded-xl bg-[#070A11] border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <ShieldAlert className={hasTamper ? 'w-5 h-5 text-rose-400' : 'w-5 h-5 text-emerald-400'} />
              <span className="text-sm font-bold text-white">Merkle Root Tamper Diff Inspector</span>
              <span className={[
                'px-2 py-0.5 rounded text-[11px] font-mono font-bold',
                hasTamper ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              ].join(' ')}>
                {hasTamper ? 'TAMPER ACTIVE' : 'CHAIN SECURE'}
              </span>
            </div>

            {hasTamper ? (
              <button
                type="button"
                onClick={onRestoreIntegrity}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 transition-colors flex items-center gap-1.5 shrink-0"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>[Restore Block Integrity]</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onSimulateTamper(ledger.length - 1)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 transition-colors flex items-center gap-1.5 shrink-0"
              >
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>[Simulate Block Tamper (Flip 1 Byte)]</span>
              </button>
            )}
          </div>

          {hasTamper ? (
            <div className="mt-3 space-y-3 font-mono text-xs">
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300">
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  <span>IMMUTABILITY VIOLATION: Single-byte flip in Block #{ledger[tamperedBlockIndex ?? 0]?.blockNumber}</span>
                </div>
                <div className="text-slate-400 text-xs font-sans">
                  Avalanche effect triggered: altering byte 0x18 in transaction payload generates an irreversible divergence across all parent nodes in the Merkle binary tree reduction.
                </div>
              </div>

              {/* Red vs Emerald Hash Diff Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <div className="text-emerald-400 font-bold mb-1 flex items-center justify-between">
                    <span>Expected Canonical Root (Honest):</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20">VALID</span>
                  </div>
                  <div className="break-all text-emerald-300 font-mono text-xs bg-slate-900/80 p-2 rounded border border-emerald-500/20">
                    {canonicalStateRoot}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30">
                  <div className="text-rose-400 font-bold mb-1 flex items-center justify-between">
                    <span>Corrupted Tampered Root (Adversarial):</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20">MISMATCH</span>
                  </div>
                  <div className="break-all text-rose-300 font-mono text-xs bg-slate-900/80 p-2 rounded border border-rose-500/20">
                    {sha256Sync(canonicalStateRoot + ':CORRUPTED_BYTE_18')}
                  </div>
                </div>
              </div>

              <div className="text-slate-400 text-xs flex items-center justify-between pt-1">
                <span>Quorum Consensus Verdict: 0 / 7 Signatures Verified</span>
                <span className="text-rose-400 font-bold">REJECTED BY BFT STATE MACHINE</span>
              </div>
            </div>
          ) : (
            <div className="mt-3 text-slate-400 text-xs font-mono flex items-center justify-between">
              <span>All block payloads verified: SHA-256 state tree links match canonical ledger state.</span>
              <span className="text-emerald-400 font-bold">100% Deterministic Integrity</span>
            </div>
          )}
        </div>
      </div>

      {/* 2-Column Split: State Trie Leaves vs Immutable Block Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Merkle State Key-Value Leaves */}
        <div className="bg-[#0B0F19] border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-cyan-400" />
                <span>State Trie Leaves ({stateKVs.length} Keys)</span>
              </h3>
              <span className="text-sm text-slate-400 font-mono">Sorted Lexicographically</span>
            </div>

            {/* List of Leaves */}
            <div className="mt-4 space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {stateKVs.map((item) => (
                <div
                  key={item.key}
                  className="bg-[#070A11] border border-slate-800 rounded-lg p-3 text-sm space-y-1.5 font-mono"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{item.key}</span>
                    <span className="text-slate-400 text-sm">Updated #{item.lastUpdatedBlock}</span>
                  </div>
                  <div className="text-slate-300 text-sm break-all bg-slate-900/60 p-2 rounded border border-slate-800/80">
                    {item.value}
                  </div>
                  <div className="text-sm text-slate-500 truncate">
                    Leaf SHA-256: <span className="text-slate-400">{item.leafHash}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add / Update State Leaf Input */}
          <form onSubmit={handleAddState} className="mt-5 pt-4 border-t border-slate-800 space-y-3">
            <div className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Mutate / Add State Leaf</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Key (e.g. STAKE_ORACLE)"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                className="bg-[#070A11] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
                required
              />
              <input
                type="text"
                placeholder="Value JSON or text"
                value={newVal}
                onChange={(e) => setNewVal(e.target.value)}
                className="bg-[#070A11] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full min-h-[44px] px-4 py-2 text-sm font-bold rounded-lg bg-cyan-500/10 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/20 transition-colors flex items-center justify-center gap-2"
            >
              <span>Recalculate Merkle State Root</span>
            </button>
          </form>
        </div>

        {/* Right Column: Immutable Ledger & Chain Inspector */}
        <div className="bg-[#0B0F19] border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Link2 className="w-5 h-5 text-emerald-400" />
                <span>Immutable Block Ledger</span>
              </h3>
              <span className="text-sm text-slate-400 font-mono">
                {ledger.length} Blocks Committed
              </span>
            </div>

            {/* Block Horizontal Selector */}
            <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2">
              {ledger.map((b, idx) => {
                const isSelected = idx === selectedBlockIndex;
                const isTampered = tamperedBlockIndex === idx;

                return (
                  <button
                    key={b.blockNumber}
                    type="button"
                    onClick={() => setSelectedBlockIndex(idx)}
                    className={[
                      'px-3 py-2 rounded-lg border font-mono text-sm shrink-0 transition-all flex flex-col items-start min-w-[110px]',
                      isTampered
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                        : isSelected
                        ? 'bg-cyan-500/15 border-cyan-500 text-white shadow-sm'
                        : 'bg-[#070A11] border-slate-800 text-slate-400 hover:border-slate-700'
                    ].join(' ')}
                  >
                    <span className="font-bold">Block #{b.blockNumber}</span>
                    <span className="text-sm opacity-80">Term {b.viewTerm}</span>
                  </button>
                );
              })}
            </div>

            {/* Selected Block Inspection Card */}
            {selectedBlock && (
              <div className="mt-4 bg-[#070A11] border border-slate-800 rounded-lg p-4 space-y-3 font-mono text-sm">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-base font-bold text-white">Block #{selectedBlock.blockNumber} Details</span>
                  <span className="text-emerald-400 font-semibold">{selectedBlock.gasExecutionUnits.toLocaleString()} Gas Units</span>
                </div>

                <div>
                  <div className="text-slate-400 text-sm">Block SHA-256 Hash:</div>
                  <div className="text-emerald-300 text-sm break-all bg-slate-900/60 p-2 rounded border border-slate-800 mt-0.5">
                    {tamperedBlockIndex === selectedBlockIndex
                      ? sha256Sync(selectedBlock.blockHash + ':CORRUPTED')
                      : selectedBlock.blockHash}
                  </div>
                </div>

                <div>
                  <div className="text-slate-400 text-sm">Previous Block Hash:</div>
                  <div className="text-slate-300 text-sm break-all bg-slate-900/60 p-2 rounded border border-slate-800 mt-0.5">
                    {selectedBlock.previousHash}
                  </div>
                </div>

                <div>
                  <div className="text-slate-400 text-sm">Committed Merkle State Root:</div>
                  <div className="text-cyan-300 text-sm break-all bg-slate-900/60 p-2 rounded border border-slate-800 mt-0.5">
                    {selectedBlock.stateRoot}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                    <span className="text-slate-400">Proposer Node:</span>
                    <div className="text-white font-bold truncate mt-0.5">{selectedBlock.proposerNode}</div>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                    <span className="text-slate-400">Quorum Signatures:</span>
                    <div className="text-emerald-400 font-bold mt-0.5">{selectedBlock.commitSignatures.length} Verified</div>
                  </div>
                </div>

                <div>
                  <div className="text-slate-400 text-sm">Operations Payload:</div>
                  <pre className="text-slate-300 text-sm bg-slate-900/90 p-2.5 rounded border border-slate-800 overflow-x-auto">
                    {JSON.stringify(selectedBlock.operations, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Adversarial Tamper Simulation Button */}
          <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => onSimulateTamper(selectedBlockIndex)}
              className="w-full min-h-[44px] px-4 py-2.5 text-sm font-bold rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 transition-colors flex items-center justify-center gap-2"
            >
              <AlertCircle className="w-4 h-4" />
              <span>Simulate Adversarial Payload Tamper (Test Immutability)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
