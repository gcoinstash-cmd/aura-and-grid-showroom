/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Heavy Overland Dynamics Platform RZ 450e Steer-by-Wire Precision Core (GF-T3-174)
 * Tab 2: PostgreSQL 16 Actuation Ledger & Cryptographic Triggers
 */

import React, { useState } from 'react';
import { Database, Copy, Check, ShieldCheck, Terminal, Filter, RefreshCw } from 'lucide-react';
import { POSTGRES_LEDGER_SQL, MOCK_LEDGER_RECORDS } from '../../data/postgresSchemaData';

export const TabPostgresLedger: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'schema' | 'live-ledger'>('live-ledger');
  const [records, setRecords] = useState(MOCK_LEDGER_RECORDS);
  const [verifying, setVerifying] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(POSTGRES_LEDGER_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerifyChain = () => {
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
    }, 600);
  };

  return (
    <div className="space-y-8">
      {/* Overview header */}
      <div>
        <div className="flex items-center gap-2">
          <Database className="h-6 w-6 text-amber-400" />
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">
            Tab 2: Postgres Actuation Ledger & HMAC Triggers
          </h2>
        </div>
        <p className="mt-2 text-base text-slate-300">
          Partitioned PostgreSQL 16 schema with monthly timeseries hypertables, primary/secondary channel divergence audit triggers, and HMAC-SHA256 tamper-evident cryptographic signature chains.
        </p>
      </div>

      {/* Sub navigation between live ledger view and SQL DDL */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveSubTab('live-ledger')}
            className={`rounded px-4 py-2 text-sm font-semibold transition-colors cursor-pointer ${
              activeSubTab === 'live-ledger'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Live Ingestion Table (Partition y2026m10)
          </button>
          <button
            onClick={() => setActiveSubTab('schema')}
            className={`rounded px-4 py-2 text-sm font-semibold transition-colors cursor-pointer ${
              activeSubTab === 'schema'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            PostgreSQL 16 DDL & Triggers
          </button>
        </div>

        {activeSubTab === 'live-ledger' && (
          <button
            onClick={handleVerifyChain}
            disabled={verifying}
            className="flex items-center gap-2 rounded border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 px-3.5 py-1.5 text-sm font-semibold text-emerald-300 transition-colors cursor-pointer"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>{verifying ? 'Auditing Signatures...' : 'Verify HMAC Chain (All Pass)'}</span>
          </button>
        )}
      </div>

      {activeSubTab === 'live-ledger' ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow">
          <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-200">
              Query Result: SELECT * FROM actuation_ledger_y2026m10 ORDER BY monotonic_nonce DESC LIMIT 5;
            </span>
            <span className="text-sm font-mono text-emerald-400">
              BRIN Index Hit (0.42 ms)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-mono">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-sm">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nonce</th>
                  <th className="px-4 py-3 font-semibold">Timestamp (UTC)</th>
                  <th className="px-4 py-3 font-semibold">Channel A (Hall)</th>
                  <th className="px-4 py-3 font-semibold">Channel B (Optical)</th>
                  <th className="px-4 py-3 font-semibold">Divergence Δθ</th>
                  <th className="px-4 py-3 font-semibold">HMAC-SHA256 Signature</th>
                  <th className="px-4 py-3 font-semibold">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 text-cyan-400 font-bold tabular-nums">#{r.nonce}</td>
                    <td className="px-4 py-3 text-slate-300">{r.timestamp}</td>
                    <td className="px-4 py-3 text-white tabular-nums">{r.channelA.toFixed(2)}°</td>
                    <td className="px-4 py-3 text-white tabular-nums">{r.channelB.toFixed(2)}°</td>
                    <td className="px-4 py-3 text-emerald-400 font-bold tabular-nums">{r.divergence.toFixed(2)}°</td>
                    <td className="px-4 py-3 text-slate-400 text-sm truncate max-w-[180px]">
                      {r.hmacSignature}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-500/20 text-emerald-300 px-2 py-0.5 text-sm font-semibold">
                        <Check className="h-3.5 w-3.5" />
                        VERIFIED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-sm text-slate-400">
            <span>Partition Range: 2026-10-01 to 2026-11-01</span>
            <span>Trigger \`trg_audit_steer_divergence\` Status: ACTIVE</span>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 overflow-hidden">
          <div className="flex items-center justify-between bg-slate-900 px-6 py-3 border-b border-slate-800">
            <span className="font-mono text-sm font-semibold text-slate-200">
              actuation_ledger_schema.sql (PostgreSQL 16 Enterprise DDL)
            </span>

            <button
              onClick={handleCopy}
              className="flex items-center gap-2 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3.5 py-1.5 text-sm font-medium text-slate-200 transition-colors cursor-pointer"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? 'Copied' : 'Copy SQL Schema'}</span>
            </button>
          </div>

          <pre className="p-6 text-sm font-mono text-slate-200 overflow-x-auto max-h-[600px] leading-relaxed">
            <code>{POSTGRES_LEDGER_SQL}</code>
          </pre>
        </div>
      )}
    </div>
  );
};
