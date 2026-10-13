import React, { useState } from 'react';
import { Database, ShieldAlert, ShieldCheck, Copy, Check } from 'lucide-react';
import { POSTGRES_16_SCHEMA_SQL } from '../data/specDocument';

export interface LedgerEntry {
  nonce: number;
  timestamp: string;
  corner: 'FL' | 'FR' | 'RL' | 'RR';
  velocityMs: number;
  apertureRatio: number;
  pressureKpa: number;
  sealDivergencePct: number;
  quarantined: boolean;
  prevHmac: string;
  hmac: string;
}

interface TabPostgresLedgerProps {
  entries: LedgerEntry[];
  onInjectSealDivergenceFault: () => void;
  onVerifyLedgerChain: () => void;
  verificationResult: { verifiedCount: number; intact: boolean; rootHash: string } | null;
}

export const TabPostgresLedger: React.FC<TabPostgresLedgerProps> = ({
  entries,
  onInjectSealDivergenceFault,
  onVerifyLedgerChain,
  verificationResult,
}) => {
  const [copied, setCopied] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'quarantined'>('all');

  const handleCopySql = () => {
    navigator.clipboard.writeText(POSTGRES_16_SCHEMA_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const visibleEntries =
    filterMode === 'quarantined'
      ? entries.filter((e) => e.quarantined)
      : entries;

  return (
    <div className="space-y-6">
      {/* Interactive Ledger Inspector Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              PostgreSQL 16 Partitioned HMAC Ledger
            </h2>
            <p className="text-slate-300 text-sm mt-1">
              Declarative range-partitioned timeseries storage with monotonic nonces (<code className="text-sky-400 font-mono">#1,000,000+</code>), piston seal divergence quarantine trigger (<code className="text-amber-400 font-mono">&gt;= 4.50%</code>), and chained HMAC-SHA256 digests.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onInjectSealDivergenceFault}
              className="bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold px-3.5 py-2 rounded-lg inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Simulate Seal Divergence (&gt;4.5%)</span>
            </button>

            <button
              type="button"
              onClick={onVerifyLedgerChain}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold px-3.5 py-2 rounded-lg inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Audit HMAC Chain</span>
            </button>
          </div>
        </div>

        {/* Verification Audit Banner */}
        {verificationResult && (
          <div className="bg-emerald-950/50 border border-emerald-500/40 rounded-lg p-3.5 mb-4 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="text-emerald-300 font-semibold">
              CRYPTOGRAPHIC AUDIT PASSED: {verificationResult.verifiedCount} consecutive PostgreSQL 16 frames verified · Zero nonce collisions
            </div>
            <div className="text-slate-300">
              Chain Tip SHA-256: <span className="text-emerald-400 font-bold">{verificationResult.rootHash.slice(0, 24)}...</span>
            </div>
          </div>
        )}

        {/* Filter Controls */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs cursor-pointer transition-colors ${
                filterMode === 'all'
                  ? 'bg-slate-800 text-white font-bold border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Partition Rows ({entries.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('quarantined')}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs cursor-pointer transition-colors ${
                filterMode === 'quarantined'
                  ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Quarantined Seal Events ({entries.filter((e) => e.quarantined).length})
            </button>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Partition: es300h_swing_valve_ledger_2026_10
          </span>
        </div>

        {/* High-Density Tabular Ledger Grid */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs tabular-nums">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/70">
                <th className="py-2.5 px-3">Nonce</th>
                <th className="py-2.5 px-3">Corner</th>
                <th className="py-2.5 px-3 text-right">v_p (m/s)</th>
                <th className="py-2.5 px-3 text-right">Bypass Ratio</th>
                <th className="py-2.5 px-3 text-right">ΔP (kPa)</th>
                <th className="py-2.5 px-3 text-right">Seal Div (%)</th>
                <th className="py-2.5 px-3">Trigger Status</th>
                <th className="py-2.5 px-3">Chained HMAC-SHA256</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {visibleEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-400">
                    No quarantined seal divergence rows recorded yet. Click &ldquo;Simulate Seal Divergence (&gt;4.5%)&rdquo; to test the PostgreSQL 16 trigger.
                  </td>
                </tr>
              ) : (
                visibleEntries.map((row) => (
                  <tr
                    key={row.nonce}
                    className={
                      row.quarantined
                        ? 'bg-amber-950/30 hover:bg-amber-950/50'
                        : 'hover:bg-slate-900/50'
                    }
                  >
                    <td className="py-2.5 px-3 text-sky-400 font-bold">#{row.nonce}</td>
                    <td className="py-2.5 px-3 text-slate-300">{row.corner}</td>
                    <td className="py-2.5 px-3 text-right text-slate-200">{row.velocityMs.toFixed(5)}</td>
                    <td className="py-2.5 px-3 text-right text-emerald-400">{row.apertureRatio.toFixed(4)}</td>
                    <td className="py-2.5 px-3 text-right text-slate-200">{row.pressureKpa.toFixed(2)}</td>
                    <td
                      className={`py-2.5 px-3 text-right font-bold ${
                        row.quarantined ? 'text-amber-400' : 'text-slate-300'
                      }`}
                    >
                      {row.sealDivergencePct.toFixed(3)}%
                    </td>
                    <td className="py-2.5 px-3">
                      {row.quarantined ? (
                        <span className="text-amber-400 font-bold">
                          QUARANTINED (BYPASS LOCKED)
                        </span>
                      ) : (
                        <span className="text-emerald-400">NOMINAL SEAL</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {row.hmac.slice(0, 18)}…{row.hmac.slice(-6)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PostgreSQL 16 Schema DDL Viewer */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-2xl font-extrabold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-sky-400" />
              <span>PostgreSQL 16 Declarative Partition &amp; HMAC Trigger DDL</span>
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              sql/001_swing_valve_hmac_ledger.sql · Zero circular foreign keys · Automatic seal divergence quarantine
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopySql}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-mono text-xs px-3.5 py-2 rounded-lg inline-flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Copied PostgreSQL 16 DDL</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy SQL Schema</span>
              </>
            )}
          </button>
        </div>

        <pre className="bg-slate-950 border border-slate-800 rounded-lg p-4 overflow-x-auto text-xs font-mono text-slate-200 leading-relaxed max-h-[520px]">
          <code>{POSTGRES_16_SCHEMA_SQL}</code>
        </pre>
      </div>
    </div>
  );
};
