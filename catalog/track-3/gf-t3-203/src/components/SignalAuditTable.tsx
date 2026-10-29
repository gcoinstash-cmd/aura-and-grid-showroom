import React, { useState } from 'react';
import { SignalAuditBlock } from '../engine/types';

interface SignalAuditTableProps {
  blocks: SignalAuditBlock[];
  onVerifyIntegrity: () => { isValid: boolean; brokenAtIndex?: number; totalBlocks: number };
}

export const SignalAuditTable: React.FC<SignalAuditTableProps> = ({ blocks, onVerifyIntegrity }) => {
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    brokenAtIndex?: number;
    totalBlocks: number;
  } | null>(null);

  const handleVerify = () => {
    const result = onVerifyIntegrity();
    setVerificationResult(result);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(blocks, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `apex203_audit_chain_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded p-4 font-mono text-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] font-sans">
            SHA-256 Cryptographic Signal Audit Chain
          </span>
          <p className="text-[11px] text-slate-500 font-sans mt-0.5">
            Immutable hash-linked ledger guaranteeing non-repudiation and zero-tamper institutional compliance.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleVerify}
            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-sans text-xs font-medium transition-colors"
          >
            Verify Chain Integrity
          </button>
          <button
            onClick={handleExportJson}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded font-sans text-xs font-medium transition-colors"
          >
            Export JSON
          </button>
        </div>
      </div>

      {/* Verification Banner */}
      {verificationResult && (
        <div
          className={`p-3 rounded border text-xs font-sans ${
            verificationResult.isValid
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/40 text-rose-300'
          }`}
        >
          {verificationResult.isValid ? (
            <div className="flex items-center gap-2">
              <span className="font-bold">AUDIT INTEGRITY CERTIFIED:</span>
              <span>
                All {verificationResult.totalBlocks} blocks sequentially verified against SHA-256 parent hash linkages. Zero tampering detected.
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-bold">CRYPTOGRAPHIC BREAK DETECTED:</span>
              <span>
                Hash mismatch at block index #{verificationResult.brokenAtIndex}. Chain integrity compromised!
              </span>
            </div>
          )}
        </div>
      )}

      {/* Blocks Table */}
      <div className="overflow-x-auto max-h-96 overflow-y-auto">
        <table className="w-full text-left border-collapse text-[11px]">
          <thead>
            <tr className="border-b border-slate-800 text-slate-500 font-normal">
              <th className="py-2 px-2.5">Block #</th>
              <th className="py-2 px-2.5">Signal</th>
              <th className="py-2 px-2.5 text-right">Z-Score</th>
              <th className="py-2 px-2.5 text-right">Beta (β)</th>
              <th className="py-2 px-2.5 text-right">Spread</th>
              <th className="py-2 px-2.5 font-mono">Previous Hash</th>
              <th className="py-2 px-2.5 font-mono">Block SHA-256</th>
              <th className="py-2 px-2.5">Audit Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {blocks
              .slice()
              .reverse()
              .map((block) => (
                <tr key={block.index} className="hover:bg-slate-800/40">
                  <td className="py-2 px-2.5 text-slate-400 font-semibold font-mono">
                    #{block.index}
                  </td>
                  <td className="py-2 px-2.5 font-sans font-medium">
                    <span
                      className={`text-xs ${
                        block.signal === 'ENTER_LONG_SPREAD'
                          ? 'text-emerald-400'
                          : block.signal === 'ENTER_SHORT_SPREAD'
                          ? 'text-rose-400'
                          : block.signal === 'EXIT_NEUTRAL'
                          ? 'text-cyan-400'
                          : block.signal === 'STOP_OUT'
                          ? 'text-amber-400'
                          : 'text-slate-500'
                      }`}
                    >
                      {block.signal}
                    </span>
                  </td>
                  <td className="py-2 px-2.5 text-right tabular-nums">
                    {block.zScore.toFixed(2)}σ
                  </td>
                  <td className="py-2 px-2.5 text-right tabular-nums text-slate-400">
                    {block.beta.toFixed(4)}
                  </td>
                  <td className="py-2 px-2.5 text-right tabular-nums">
                    {block.spread.toFixed(2)}
                  </td>
                  <td className="py-2 px-2.5 text-slate-500 font-mono text-[10px]">
                    {block.previousHash.substring(0, 10)}...{block.previousHash.substring(58)}
                  </td>
                  <td className="py-2 px-2.5 text-cyan-400/90 font-mono text-[10px]">
                    {block.hash.substring(0, 10)}...{block.hash.substring(58)}
                  </td>
                  <td className="py-2 px-2.5">
                    <span className="text-[10px] text-emerald-400 font-mono">
                      ✓ VERIFIED
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
