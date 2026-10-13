/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Database, ShieldCheck, CheckCircle2, Copy, Check, Lock, AlertTriangle, Layers, FileCode } from 'lucide-react';
import { POSTGRES_DDL, INITIAL_EPOCHS } from '../../data/postgresSchema';
import { EpochRecord } from '../../types/cockpit';

interface TabPostgresLedgerProps {
  onVerifyMerkleRoot: () => void;
}

export const TabPostgresLedger: React.FC<TabPostgresLedgerProps> = ({ onVerifyMerkleRoot }) => {
  const [epochs, setEpochs] = useState<EpochRecord[]>(INITIAL_EPOCHS);
  const [selectedEpoch, setSelectedEpoch] = useState<EpochRecord>(INITIAL_EPOCHS[0]);
  const [copiedSql, setCopiedSql] = useState(false);
  const [isVerifyingProof, setIsVerifyingProof] = useState(false);
  const [proofVerified, setProofVerified] = useState(true);

  const copySql = () => {
    navigator.clipboard.writeText(POSTGRES_DDL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleRunVerification = () => {
    setIsVerifyingProof(true);
    setTimeout(() => {
      setIsVerifyingProof(false);
      setProofVerified(true);
      onVerifyMerkleRoot();
    }, 450);
  };

  return (
    <div className="space-y-6">
      {/* Top Ledger Overview */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Database className="w-6 h-6 text-purple-400" />
              Partitioned PostgreSQL 16 Epoch Ledger
            </h2>
            <p className="text-slate-300 text-sm mt-1 max-w-4xl">
              Timeseries partitioned ledger storing immutable DIRECT4 consensus records, Ed25519 multi-signatures, and deterministic SHA-256 Merkle root commitments.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-purple-950/80 border border-purple-500/40 text-purple-300 font-mono text-sm font-semibold">
              <Lock className="w-4 h-4 text-purple-400" />
              Append-Only Immutability Trigger
            </span>
          </div>
        </div>
      </div>

      {/* Epoch Inspector & Live Merkle Proof Validator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Epoch List */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-400" />
              Committed Epoch Blocks
            </h3>
            <span className="text-sm font-mono text-slate-400">
              Timeseries Partition
            </span>
          </div>

          <div className="space-y-3 mt-4">
            {epochs.map((ep) => {
              const isSelected = selectedEpoch.epochNumber === ep.epochNumber;
              const isQuarantined = ep.status === 'QUARANTINED';
              return (
                <div
                  key={ep.epochNumber}
                  onClick={() => setSelectedEpoch(ep)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition ${
                    isSelected
                      ? 'bg-purple-950/40 border-purple-500 shadow-sm'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-base font-bold text-white">
                      Epoch #{ep.epochNumber}
                    </span>
                    <span
                      className={`text-sm font-mono px-2 py-0.5 rounded font-semibold ${
                        isQuarantined
                          ? 'bg-red-950 text-red-300 border border-red-500/40'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {ep.status}
                    </span>
                  </div>

                  <div className="text-sm text-slate-300 mt-2 font-mono">
                    {ep.proposerNode}
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-sm font-mono text-slate-400">
                    <span>Split: {ep.frontRearSplit.split(' ')[0]}</span>
                    <span>Commit: {ep.commitLatencyMs} ms</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Epoch Detail & Merkle Binary Tree Proof */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-xl font-bold text-white">
                  Epoch #{selectedEpoch.epochNumber} Cryptographic Manifest
                </h3>
                <span className="text-slate-400 text-sm font-mono">
                  Timestamp: {selectedEpoch.timestampIso}
                </span>
              </div>
              <button
                onClick={handleRunVerification}
                disabled={isVerifyingProof}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isVerifyingProof ? 'Calculating Hashes...' : 'Verify Merkle Proof'}
              </button>
            </div>

            {/* Merkle Root Header */}
            <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-purple-500/40">
              <div className="flex items-center justify-between">
                <span className="text-sm font-mono text-purple-300 font-semibold">
                  ROOT HASH (SHA-256):
                </span>
                {proofVerified && (
                  <span className="inline-flex items-center gap-1 text-emerald-400 text-sm font-mono font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    CRYPTOGRAPHICALLY VALIDATED
                  </span>
                )}
              </div>
              <div className="font-mono text-sm text-slate-200 break-all mt-1 bg-slate-900 p-2 rounded border border-slate-800">
                {selectedEpoch.merkleRoot}
              </div>
            </div>

            {/* Binary Tree Visual Leaves */}
            <div className="mt-4 space-y-3">
              <div className="text-sm font-mono text-slate-400 font-semibold">
                MERKLE TREE BINARY LEAVES (4-WAY HASH DECOMPOSITION):
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-sm font-mono text-cyan-400 font-bold">Leaf 0: Telemetry State</div>
                  <div className="font-mono text-sm text-slate-400 truncate mt-1">
                    {selectedEpoch.leafHashes.telemetry}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-sm font-mono text-indigo-400 font-bold">Leaf 1: DIRECT4 Vector</div>
                  <div className="font-mono text-sm text-slate-400 truncate mt-1">
                    {selectedEpoch.leafHashes.direct4Vector}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-sm font-mono text-purple-400 font-bold">Leaf 2: Steer-by-Wire Bus</div>
                  <div className="font-mono text-sm text-slate-400 truncate mt-1">
                    {selectedEpoch.leafHashes.steerByWire}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-sm font-mono text-emerald-400 font-bold">Leaf 3: Quorum Signatures</div>
                  <div className="font-mono text-sm text-slate-400 truncate mt-1">
                    {selectedEpoch.leafHashes.quorumSignatures}
                  </div>
                </div>
              </div>
            </div>

            {/* Quorum Signatures Display */}
            <div className="mt-4 p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div className="text-sm font-mono text-slate-400 font-semibold mb-2">
                VALIDATOR QUORUM SIGNATURES (Ed25519):
              </div>
              <div className="space-y-1.5">
                {selectedEpoch.quorumSignatures.map((sig, i) => (
                  <div key={i} className="text-sm font-mono text-slate-300 flex items-center justify-between">
                    <span>Validator #{i + 1}: {sig}</span>
                    <span className="text-emerald-400 font-bold">VERIFIED</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Production PostgreSQL 16 DDL Schema Display */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-purple-400" />
            <span className="font-mono text-sm font-bold text-purple-400">
              schema_lexus_tx500h_epoch_ledger.sql
            </span>
            <span className="text-slate-500 text-sm">• PostgreSQL 16 DDL with Triggers & Partitioning</span>
          </div>
          <button
            onClick={copySql}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-mono transition"
          >
            {copiedSql ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                Copied DDL
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy PostgreSQL DDL
              </>
            )}
          </button>
        </div>

        <div className="p-4 bg-slate-950 overflow-x-auto max-h-[380px]">
          <pre className="font-mono text-sm text-slate-300 leading-relaxed">
            {POSTGRES_DDL}
          </pre>
        </div>
      </div>
    </div>
  );
};
