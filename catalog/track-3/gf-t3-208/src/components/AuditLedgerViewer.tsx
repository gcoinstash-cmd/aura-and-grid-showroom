/**
 * APEX-208 Cryptographic SHA-256 State Ledger Viewer
 * Append-only state hashing and tamper-evident audit trail for every calibration cycle.
 * Strict Zero-Dollar Compliance: Spot prices and metrics rendered in pts or bps.
 * Minimum 14px typography floor maintained across all table cells and controls.
 */

import React, { useState } from 'react';
import { AuditLedgerBlockData } from '../quant/types.ts';
import { Lock, ShieldCheck, ShieldAlert, Download, RefreshCw, KeyRound, CheckCircle2 } from 'lucide-react';

interface AuditLedgerViewerProps {
  blocks: AuditLedgerBlockData[];
  onVerifyChain: () => Promise<{ isValid: boolean; errorDetail: string | null }>;
}

export const AuditLedgerViewer: React.FC<AuditLedgerViewerProps> = ({
  blocks,
  onVerifyChain
}) => {
  const [verificationResult, setVerificationResult] = useState<{
    tested: boolean;
    isValid: boolean;
    detail: string | null;
  }>({
    tested: false,
    isValid: true,
    detail: null
  });
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const res = await onVerifyChain();
      setVerificationResult({
        tested: true,
        isValid: res.isValid,
        detail: res.errorDetail
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(blocks, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'apex208_crypto_ledger_' + Date.now() + '.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="w-full bg-[#090D16] border border-slate-800 rounded-lg p-5 flex flex-col gap-4">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-cyan-400" />
            <span>CRYPTOGRAPHIC AUDIT LEDGER (SHA-256)</span>
          </h3>
          <p className="text-sm text-slate-400 mt-0.5">
            Immutable Append-Only State Hashing of All Volatility Surfaces & SABR Calibrations
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className="min-h-[44px] px-5 py-2.5 text-base font-bold bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-200 rounded-lg transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <KeyRound className="w-4 h-4 text-cyan-400" />
            <span>{isVerifying ? 'Verifying Hashes...' : 'Traverse & Verify Chain'}</span>
          </button>

          <button
            onClick={handleExportJson}
            className="min-h-[44px] px-5 py-2.5 text-base font-bold bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-200 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export Audit JSON</span>
          </button>
        </div>
      </div>

      {/* Verification Feedback Banner */}
      {verificationResult.tested && (
        <div
          className={
            'p-4 rounded-lg border flex items-center gap-3 text-sm ' +
            (verificationResult.isValid
              ? 'bg-emerald-950/30 border-emerald-700 text-emerald-200'
              : 'bg-rose-950/30 border-rose-700 text-rose-200')
          }
        >
          {verificationResult.isValid ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <div className="flex-1">
            <div className="font-bold">
              {verificationResult.isValid
                ? 'Cryptographic Chain Integrity Verified: 100% Intact'
                : 'Cryptographic Hash Violation Detected'}
            </div>
            <div className="text-sm opacity-90 mt-0.5">
              {verificationResult.isValid
                ? 'All SHA-256 block hashes, parent hash pointers, and state payload merkle seeds match.'
                : verificationResult.detail}
            </div>
          </div>
        </div>
      )}

      {/* Chain Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-md">
          <div className="text-sm font-medium text-slate-400">Total Block Height</div>
          <div className="text-2xl font-bold font-mono text-cyan-400 mt-0.5">
            {blocks.length}
          </div>
        </div>

        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-md">
          <div className="text-sm font-medium text-slate-400">Genesis Block Hash</div>
          <div className="text-sm font-mono text-slate-300 mt-1 truncate" title={blocks[0]?.blockHash}>
            {blocks[0]?.blockHash.substring(0, 16) + '...'}
          </div>
        </div>

        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-md">
          <div className="text-sm font-medium text-slate-400">Latest Block Hash</div>
          <div className="text-sm font-mono text-emerald-400 mt-1 truncate" title={blocks[blocks.length - 1]?.blockHash}>
            {blocks[blocks.length - 1]?.blockHash.substring(0, 16) + '...'}
          </div>
        </div>

        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-md">
          <div className="text-sm font-medium text-slate-400">Hashing Standard</div>
          <div className="text-2xl font-bold font-mono text-white mt-0.5">
            FIPS 180-4
          </div>
        </div>
      </div>

      {/* Blocks Table */}
      <div className="w-full overflow-x-auto border border-slate-800 rounded-md">
        <table className="w-full text-left text-sm font-mono border-collapse tabular-nums">
          <thead>
            <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-300">
              <th className="py-2.5 px-3 font-semibold text-left">Index</th>
              <th className="py-2.5 px-3 font-semibold text-left">Timestamp (UTC)</th>
              <th className="py-2.5 px-3 font-semibold text-left">Underlying</th>
              <th className="py-2.5 px-3 font-semibold text-right">Spot (pts)</th>
              <th className="py-2.5 px-3 font-semibold text-center">Parameters [a, b, r, n]</th>
              <th className="py-2.5 px-3 font-semibold text-right">RMSE</th>
              <th className="py-2.5 px-3 font-semibold text-center">Arbitrage Status</th>
              <th className="py-2.5 px-3 font-semibold text-left">SHA-256 Block Hash</th>
            </tr>
          </thead>
          <tbody>
            {[...blocks].reverse().map(b => (
              <tr
                key={b.index}
                className="border-b border-slate-800/60 hover:bg-slate-900/40 transition-colors"
              >
                <td className="py-2.5 px-3 font-bold text-cyan-400">
                  {'#' + b.index}
                </td>
                <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                  {b.timestampUtc.replace('T', ' ').replace('Z', '')}
                </td>
                <td className="py-2.5 px-3 font-bold text-slate-200">
                  {b.underlying}
                </td>
                <td className="py-2.5 px-3 text-right font-semibold text-white">
                  {b.spot > 0 ? b.spot.toFixed(2) + ' pts' : '-'}
                </td>
                <td className="py-2.5 px-3 text-center text-slate-400">
                  {'[' +
                    b.sabrParams.alpha.toFixed(2) + ', ' +
                    b.sabrParams.beta.toFixed(2) + ', ' +
                    b.sabrParams.rho.toFixed(2) + ', ' +
                    b.sabrParams.nu.toFixed(2) + ']'}
                </td>
                <td className="py-2.5 px-3 text-right text-emerald-400">
                  {b.rmse > 0 ? (b.rmse * 10000).toFixed(1) + ' bps' : '-'}
                </td>
                <td className="py-2.5 px-3 text-center">
                  <span
                    className={
                      'px-2.5 py-0.5 rounded text-sm font-semibold ' +
                      (b.arbitrageStatus === 'ARBITRAGE_FREE'
                        ? 'bg-emerald-950/40 text-emerald-300'
                        : b.arbitrageStatus === 'GENESIS_INITIALIZED'
                        ? 'bg-slate-800 text-slate-300'
                        : 'bg-amber-950/40 text-amber-300')
                    }
                  >
                    {b.arbitrageStatus}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-slate-400 font-mono text-sm">
                  <span className="text-cyan-300" title={b.blockHash}>
                    {b.blockHash.substring(0, 12) + '...'}
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
