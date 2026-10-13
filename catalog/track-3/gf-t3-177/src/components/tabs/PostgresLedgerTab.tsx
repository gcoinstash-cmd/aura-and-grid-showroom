import React, { useState } from 'react';
import { LedgerBlock, TelemetryState } from '../../types/telemetry';
import { POSTGRES_DDL_SCHEMA } from '../../data/codeSnippets';
import { 
  Database, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  Copy, 
  Check, 
  PlusCircle, 
  RefreshCw, 
  AlertTriangle,
  Lock,
  Layers
} from 'lucide-react';

interface PostgresLedgerTabProps {
  ledgerBlocks: LedgerBlock[];
  telemetry: TelemetryState;
  onAddNewBlock: () => void;
  onOpenLedgerModal: () => void;
}

export const PostgresLedgerTab: React.FC<PostgresLedgerTabProps> = ({
  ledgerBlocks,
  telemetry,
  onAddNewBlock,
  onOpenLedgerModal,
}) => {
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeSubView, setActiveSubView] = useState<'ledger' | 'schema_ddl'>('ledger');
  const [tamperedBlockIndex, setTamperedBlockIndex] = useState<number | null>(null);

  const handleCopySql = () => {
    navigator.clipboard.writeText(POSTGRES_DDL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleSimulateTamper = (index: number) => {
    if (tamperedBlockIndex === index) {
      setTamperedBlockIndex(null);
    } else {
      setTamperedBlockIndex(index);
    }
  };

  return (
    <div className="space-y-6">
      {/* Subview Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-neutral-900 border border-neutral-800">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveSubView('ledger')}
            className={`px-5 py-2.5 rounded-lg text-base font-bold transition-all cursor-pointer ${
              activeSubView === 'ledger'
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                : 'bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700'
            }`}
          >
            Cryptographic Touring Ledger Blocks
          </button>
          <button
            type="button"
            onClick={() => setActiveSubView('schema_ddl')}
            className={`px-5 py-2.5 rounded-lg text-base font-bold transition-all cursor-pointer ${
              activeSubView === 'schema_ddl'
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                : 'bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700'
            }`}
          >
            PostgreSQL 16 Partitioned DDL Schema
          </button>
        </div>

        <div className="flex items-center gap-3">
          {activeSubView === 'ledger' ? (
            <button
              type="button"
              onClick={onOpenLedgerModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-base font-bold transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>Audit HMAC-SHA256 Integrity</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCopySql}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 text-base font-semibold transition-colors cursor-pointer"
            >
              {copiedSql ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-neutral-400" />}
              <span>{copiedSql ? 'Copied DDL!' : 'Copy schema_touring_ledger.sql'}</span>
            </button>
          )}
        </div>
      </div>

      {activeSubView === 'schema_ddl' ? (
        /* DDL Panel */
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-800">
            <div>
              <h2 className="text-3xl font-extrabold text-white">
                PostgreSQL 16 Partitioned Timeseries DDL
              </h2>
              <p className="text-base text-neutral-300 mt-1">
                Zero-vacuum monthly range partition architecture with BRIN indexing, steering divergence quarantine, and continuous HMAC-SHA256 signature chains.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-400 font-mono font-bold text-base">
                PostgreSQL 16 Enterprise
              </span>
            </div>
          </div>

          <pre className="p-5 rounded-lg bg-neutral-950 text-neutral-200 font-mono text-base overflow-x-auto leading-relaxed border border-neutral-800 max-h-[650px] overflow-y-auto">
            <code>{POSTGRES_DDL_SCHEMA}</code>
          </pre>
        </div>
      ) : (
        /* Interactive Cryptographic Ledger Blocks */
        <div className="space-y-6">
          {/* Header Card with Overview */}
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-6 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-3xl font-extrabold text-white flex items-center gap-3">
                  <Database className="w-8 h-8 text-amber-500" />
                  LC 500 Cryptographic Touring Timeseries Ledger
                </h2>
                <p className="text-base text-neutral-300 mt-1 max-w-3xl">
                  Each telemetry frame is hashed in real time and chained to the previous block via HMAC-SHA256. 
                  Any unauthorized modification instantly breaks chain continuity and triggers row-level quarantine.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onAddNewBlock}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-base transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-5 h-5 text-neutral-950" />
                  <span>Record Telemetry Block</span>
                </button>
              </div>
            </div>

            {/* Architecture Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-neutral-800">
              <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-800">
                <div className="flex items-center gap-2 text-base font-bold text-white mb-1">
                  <Layers className="w-5 h-5 text-amber-400" />
                  <span>Timeseries Partitioning</span>
                </div>
                <p className="text-base text-neutral-400">
                  Monthly partition table slices (<code>y2026m10</code>) eliminate autovacuum table-locks on 1,000 Hz writes.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-800">
                <div className="flex items-center gap-2 text-base font-bold text-white mb-1">
                  <Lock className="w-5 h-5 text-emerald-400" />
                  <span>HMAC-SHA256 Merkle Chain</span>
                </div>
                <p className="text-base text-neutral-400">
                  Continuous cryptographic link ensures telemetry provenance for insurance and Acquire.com verification.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-neutral-950 border border-neutral-800">
                <div className="flex items-center gap-2 text-base font-bold text-white mb-1">
                  <ShieldAlert className="w-5 h-5 text-red-400" />
                  <span>Steering Divergence Quarantine</span>
                </div>
                <p className="text-base text-neutral-400">
                  Trigger table automatically isolates rack divergence exceeding safety limits at speeds &gt; 100 km/h.
                </p>
              </div>
            </div>
          </div>

          {/* Ledger Table Card */}
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-extrabold text-white">
                Live Touring Block Feed ({ledgerBlocks.length} Blocks Sequenced)
              </h3>
              <span className="text-base text-neutral-400 font-mono">
                Current Sequence: #{telemetry.monotonicSeq.toLocaleString()}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800 text-neutral-400 text-base font-semibold">
                    <th className="py-3 px-4">Block #</th>
                    <th className="py-3 px-4">Timestamp (UTC)</th>
                    <th className="py-3 px-4">Speed</th>
                    <th className="py-3 px-4">Rear Steer</th>
                    <th className="py-3 px-4">Yaw Rate</th>
                    <th className="py-3 px-4">Flap %</th>
                    <th className="py-3 px-4">HMAC-SHA256 Hash</th>
                    <th className="py-3 px-4 text-center">Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 font-mono text-base">
                  {ledgerBlocks.map((block) => {
                    const isTampered = tamperedBlockIndex === block.blockIndex;
                    return (
                      <tr 
                        key={block.blockIndex} 
                        className={`hover:bg-neutral-800/40 transition-colors ${
                          isTampered ? 'bg-red-950/40 border border-red-500/50' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4 font-bold text-blue-400">
                          #{block.blockIndex.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-neutral-300">
                          {block.timestampUtc.replace('T', ' ').replace('Z', '')}
                        </td>
                        <td className="py-3.5 px-4 text-amber-300 font-bold">
                          {isTampered ? '195.0 km/h (MODIFIED)' : `${block.speedKph.toFixed(1)} km/h`}
                        </td>
                        <td className={`py-3.5 px-4 font-bold ${
                          block.rearSteerAngleDeg < 0 ? 'text-amber-400' : 'text-cyan-400'
                        }`}>
                          {block.rearSteerAngleDeg > 0 ? `+${block.rearSteerAngleDeg.toFixed(2)}°` : `${block.rearSteerAngleDeg.toFixed(2)}°`}
                        </td>
                        <td className="py-3.5 px-4 text-neutral-200">
                          {block.yawRateDegS.toFixed(1)} °/s
                        </td>
                        <td className="py-3.5 px-4 text-red-400 font-bold">
                          {block.exhaustFlapDutyPct.toFixed(0)}%
                        </td>
                        <td className="py-3.5 px-4 text-neutral-300 max-w-[200px] truncate" title={block.blockHash}>
                          {isTampered ? (
                            <span className="text-red-400 line-through">
                              {block.blockHash.substring(0, 16)}...
                            </span>
                          ) : (
                            <span>{block.blockHash.substring(0, 16)}...</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {isTampered ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-red-900/60 text-red-300 text-base font-sans font-bold">
                              <AlertTriangle className="w-4 h-4" />
                              INVALID
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-900/40 text-emerald-300 text-base font-sans font-bold">
                              <CheckCircle2 className="w-4 h-4" />
                              VALID
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Tamper Test Simulation Bar */}
            <div className="mt-6 p-4 rounded-lg bg-neutral-950 border border-neutral-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
                <div>
                  <div className="text-base font-bold text-white">Cryptographic Tamper-Proofing Sandbox</div>
                  <div className="text-base text-neutral-400">
                    Simulate an attacker altering telemetry speed data to test automatic merkle chain failure and quarantine.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleSimulateTamper(ledgerBlocks[1]?.blockIndex || 1048573)}
                className={`px-4 py-2 rounded-lg text-base font-bold transition-colors cursor-pointer ${
                  tamperedBlockIndex !== null
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700'
                }`}
              >
                {tamperedBlockIndex !== null ? 'Reset Ledger to Cryptographic Truth' : 'Simulate Data Tampering on Block #1048573'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
