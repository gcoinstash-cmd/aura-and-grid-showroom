import React, { useState } from 'react';
import { Copy, Check, Download, ShieldCheck, AlertTriangle, RefreshCw, FileCode, Database } from 'lucide-react';
import { SQL_TIMESCALEDB_CODE } from '../../data/sourceCode';
import { LedgerBlock } from '../../types/telemetry';

interface TimescaleLedgerTabProps {
  ledgerBlocks: LedgerBlock[];
  onVerifyChain: () => void;
  onInjectTamper: (index: number) => void;
  onRepairChain: () => void;
  isVerifying: boolean;
  tamperDetected: boolean;
  tamperedIndex: number | null;
}

export const TimescaleLedgerTab: React.FC<TimescaleLedgerTabProps> = ({
  ledgerBlocks,
  onVerifyChain,
  onInjectTamper,
  onRepairChain,
  isVerifying,
  tamperDetected,
  tamperedIndex,
}) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'blocks' | 'schema'>('blocks');

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_TIMESCALEDB_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSql = () => {
    const blob = new Blob([SQL_TIMESCALEDB_CODE], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '001_timescale_ledger.sql');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Timescale SQL Ledger & Cryptographic Integrity</h2>
          <p className="text-base text-slate-300 mt-1">
            PostgreSQL 16 time-series hypertable with immutable append-only triggers and HMAC-SHA256 validation
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-lg">
            <button
              onClick={() => setViewMode('blocks')}
              className={`px-3.5 py-2 text-sm font-semibold rounded-md transition-colors ${
                viewMode === 'blocks'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Live Ledger Blocks
            </button>
            <button
              onClick={() => setViewMode('schema')}
              className={`px-3.5 py-2 text-sm font-semibold rounded-md transition-colors ${
                viewMode === 'schema'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              PostgreSQL DDL (001_ledger.sql)
            </button>
          </div>

          <button
            onClick={handleCopySql}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleDownloadSql}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download .sql</span>
          </button>
        </div>
      </div>

      {viewMode === 'blocks' ? (
        <div className="space-y-6">
          {/* Cryptographic Verification Toolbar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div className="flex items-center gap-3.5">
              <div
                className={`p-3 rounded-lg ${
                  tamperDetected
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {tamperDetected ? (
                  <AlertTriangle className="w-6 h-6 text-rose-400" />
                ) : (
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {tamperDetected
                    ? `Cryptographic Anomaly at Block #${tamperedIndex !== null ? ledgerBlocks[tamperedIndex]?.height : 'Target'}`
                    : 'Monotonic Hash Chain Integrity: Fully Verified'}
                </h3>
                <p className="text-sm text-slate-300 mt-0.5">
                  {tamperDetected
                    ? 'SHA-256 digest or HMAC mismatch detected. Append-only invariant violated.'
                    : 'All blocks chained monotonically via SHA-256 and sealed with HMAC-256.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {tamperDetected ? (
                <button
                  onClick={onRepairChain}
                  className="px-4 py-2.5 text-sm font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                >
                  Repair & Re-seal Chain
                </button>
              ) : (
                <button
                  onClick={() => onInjectTamper(1)}
                  className="px-4 py-2.5 text-sm font-semibold rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 transition-colors"
                >
                  Simulate Tampering Attack
                </button>
              )}

              <button
                onClick={onVerifyChain}
                disabled={isVerifying}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isVerifying ? 'animate-spin text-cyan-400' : ''}`} />
                <span>Re-verify Full Chain</span>
              </button>
            </div>
          </div>

          {/* Ledger Blocks Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-sm text-slate-300 font-mono font-semibold">
              <span className="flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <span>TimescaleDB Hypertable [vehicle_telemetry_ticks]</span>
              </span>
              <span>Chunk Partitioning: 1 Hour Interval</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm font-mono">
                <thead className="bg-slate-950 text-slate-300 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-bold">Height</th>
                    <th className="py-3 px-4 font-bold">Timestamp</th>
                    <th className="py-3 px-4 font-bold">IMU Tick / State Hash</th>
                    <th className="py-3 px-4 font-bold">4-Wheel Speeds [FL,FR,RL,RR]</th>
                    <th className="py-3 px-4 font-bold">DIRECT4 TQ</th>
                    <th className="py-3 px-4 font-bold">SHA-256 Digest</th>
                    <th className="py-3 px-4 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {ledgerBlocks.map((block, idx) => (
                    <tr
                      key={block.height}
                      className={
                        block.isTampered
                          ? 'bg-rose-950/30 text-rose-200'
                          : idx % 2 === 0
                          ? 'bg-slate-900/40'
                          : 'bg-slate-900/80'
                      }
                    >
                      <td className="py-3 px-4 font-bold text-white">#{block.height}</td>
                      <td className="py-3 px-4 text-slate-400">{block.timestamp}</td>
                      <td className="py-3 px-4 text-cyan-400 font-semibold truncate max-w-[170px]">
                        {block.sensorPayload.ekf_state_hash}
                      </td>
                      <td className="py-3 px-4">
                        [{block.sensorPayload.wheel_speeds_rpm.join(', ')}] km/h
                      </td>
                      <td className="py-3 px-4 text-slate-200">
                        {block.sensorPayload.torque_distribution_nm[0]} / {block.sensorPayload.torque_distribution_nm[1]} Nm
                      </td>
                      <td className="py-3 px-4 truncate max-w-[160px] text-slate-400 font-mono">
                        {block.hash.slice(0, 18)}...
                      </td>
                      <td className="py-3 px-4">
                        {block.isTampered ? (
                          <span className="text-rose-400 font-bold bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800">
                            TAMPERED
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                            SEALED
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* SQL DDL Schema Viewer */
        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 bg-slate-900 border-b border-slate-800 text-sm text-slate-300 font-mono">
            <span className="flex items-center gap-2 font-semibold">
              <FileCode className="w-4 h-4 text-cyan-400" />
              <span>001_timescale_ledger.sql — Production DDL, Triggers & Continuous Rollups</span>
            </span>
            <span className="text-emerald-400 font-semibold">Target: PostgreSQL 16 + TimescaleDB</span>
          </div>
          <pre className="p-5 text-sm font-mono text-slate-200 overflow-x-auto max-h-[600px] leading-relaxed">
            {SQL_TIMESCALEDB_CODE}
          </pre>
        </div>
      )}
    </div>
  );
};
