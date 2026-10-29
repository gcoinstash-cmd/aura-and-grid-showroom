/**
 * GF-T3-207: Append-Only Cryptographic SHA-256 State Ledger
 * Real-Time Blockchain Verification & Tamper Rejection Inspector
 * Zero Third-Party Financial Marks | Zero Currency Symbols
 */

import React, { useState } from 'react';
import { LedgerBlock } from '../types/amm';
import { ShieldCheck, ShieldAlert, Terminal, Lock, Download, AlertOctagon, RefreshCw } from 'lucide-react';

interface LedgerInspectorProps {
  blocks: LedgerBlock[];
  isVerified: boolean;
  onVerifyChain: () => void;
  onInjectTamper: (blockIndex: number) => void;
}

export const LedgerInspector: React.FC<LedgerInspectorProps> = ({
  blocks,
  isVerified,
  onVerifyChain,
  onInjectTamper,
}) => {
  const [selectedBlock, setSelectedBlock] = useState<LedgerBlock | null>(null);

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(blocks, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'apex_207_cryptographic_ledger.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5">
      
      {/* Header and Cryptographic Audit Telemetry */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-100 uppercase tracking-wider">
              Cryptographic SHA-256 Append-Only State Ledger
            </h3>
            <span
              className={'px-3 py-1 text-sm font-semibold rounded-md border flex items-center gap-1.5 ' + (
                isVerified
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800/60'
                  : 'bg-rose-950 text-rose-300 border-rose-800/60 animate-pulse'
              )}
            >
              {isVerified ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Chain Verified: 100% Valid</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Tamper Detected: Chain Broken</span>
                </>
              )}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-0.5">
            Deterministic cryptographic audit trail. Each block hashes (index + timestamp + action + state + parent_hash).
          </p>
        </div>

        {/* Verification & Tamper Simulation Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onVerifyChain}
            className="min-h-[44px] px-4 py-2 text-base font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4 text-cyan-400" />
            <span>Verify Hashes</span>
          </button>

          <button
            onClick={() => onInjectTamper(Math.max(1, blocks.length - 1))}
            disabled={blocks.length <= 1}
            className="min-h-[44px] px-4 py-2 text-base font-semibold bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800/70 rounded-md transition-colors flex items-center gap-1.5 disabled:opacity-50"
            title="Simulates bit-flip tampering on latest block to demonstrate cryptographic rejection"
          >
            <AlertOctagon className="w-4 h-4 text-rose-400" />
            <span>Inject Tamper Test</span>
          </button>

          <button
            onClick={handleExportJson}
            className="min-h-[44px] px-5 py-2.5 text-base font-bold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 rounded-md transition-colors flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Export Ledger JSON</span>
          </button>
        </div>
      </div>

      {/* Block List Table */}
      <div className="border border-slate-800 rounded-md overflow-hidden bg-[#070A11]">
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-950 sticky top-0 border-b border-slate-800 text-sm font-semibold text-slate-400">
              <tr>
                <th className="py-2.5 px-4">Height</th>
                <th className="py-2.5 px-4">Action Type</th>
                <th className="py-2.5 px-4">Timestamp (UTC)</th>
                <th className="py-2.5 px-4">State Hash</th>
                <th className="py-2.5 px-4">Block Hash (SHA-256)</th>
                <th className="py-2.5 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-sm">
              {[...blocks].reverse().map((block) => (
                <tr
                  key={block.index}
                  onClick={() => setSelectedBlock(block)}
                  className="hover:bg-slate-900/60 transition-colors cursor-pointer"
                >
                  <td className="py-2 px-4 text-cyan-400 font-bold">
                    #{block.index}
                  </td>
                  <td className="py-2 px-4">
                    <span className="px-2 py-0.5 rounded text-sm font-semibold bg-slate-800 text-slate-200">
                      {block.actionType}
                    </span>
                  </td>
                  <td className="py-2 px-4 text-slate-400 text-sm">
                    {block.timestampIso.replace('T', ' ').slice(0, 19)}
                  </td>
                  <td className="py-2 px-4 text-slate-400 text-sm" title={block.stateHash}>
                    {block.stateHash.slice(0, 10)}...{block.stateHash.slice(-6)}
                  </td>
                  <td className="py-2 px-4 text-cyan-300 text-sm font-semibold" title={block.blockHash}>
                    {block.blockHash.slice(0, 12)}...{block.blockHash.slice(-8)}
                  </td>
                  <td className="py-2 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBlock(block);
                      }}
                      className="px-2.5 py-1 text-sm font-semibold text-cyan-400 hover:text-cyan-300 bg-slate-900 hover:bg-slate-800 rounded border border-slate-700"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Block Inspector Modal / Drawer */}
      {selectedBlock && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A0E17] border border-cyan-500/40 rounded-lg max-w-2xl w-full p-6 shadow-2xl flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-cyan-400" />
                <h4 className="text-lg font-bold text-slate-100 font-mono">
                  Block #{selectedBlock.index} Inspector ({selectedBlock.actionType})
                </h4>
              </div>
              <button
                onClick={() => setSelectedBlock(null)}
                className="text-slate-400 hover:text-white px-2 py-1 text-base font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 font-mono text-sm overflow-y-auto pr-1">
              <div>
                <span className="text-slate-400 block mb-0.5">Block Hash (SHA-256):</span>
                <span className="text-cyan-300 font-bold break-all bg-slate-950 p-2 rounded block border border-slate-800">
                  {selectedBlock.blockHash}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Parent Block Hash (prev_hash):</span>
                <span className="text-slate-300 break-all bg-slate-950 p-2 rounded block border border-slate-800">
                  {selectedBlock.prevHash}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">State Root Fingerprint (state_hash):</span>
                <span className="text-violet-300 break-all bg-slate-950 p-2 rounded block border border-slate-800">
                  {selectedBlock.stateHash}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Timestamp (Nanoseconds / UTC):</span>
                <span className="text-slate-300 bg-slate-950 p-2 rounded block border border-slate-800">
                  {selectedBlock.timestampNs} ns ({selectedBlock.timestampIso})
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Serialized Payload JSON:</span>
                <pre className="text-emerald-400 bg-slate-950 p-3 rounded block border border-slate-800 overflow-x-auto text-sm leading-relaxed">
                  {JSON.stringify(selectedBlock.payload, null, 2)}
                </pre>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedBlock(null)}
                className="min-h-[44px] px-6 py-2.5 text-base font-bold bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-md"
              >
                Close Inspector
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
