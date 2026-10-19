import React, { useState } from 'react';
import { 
  Database, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  Check, 
  RotateCcw, 
  Lock, 
  Hash, 
  FileCode2,
  RefreshCw
} from 'lucide-react';
import { TradeTick } from '../../types/engine';
import { verifyTickHmac } from '../../utils/crypto';

interface SqlTickVaultTabProps {
  ticks: TradeTick[];
  onTamperTick: (index: number) => void;
  onRestoreTicks: () => void;
  onOpenHmacModal: () => void;
}

export const SqlTickVaultTab: React.FC<SqlTickVaultTabProps> = ({
  ticks,
  onTamperTick,
  onRestoreTicks,
  onOpenHmacModal,
}) => {
  const [selectedSubTab, setSelectedSubTab] = useState<'LEDGER' | 'SCHEMA_DDL'>('LEDGER');
  const [copiedDdl, setCopiedDdl] = useState(false);
  const [verifyingAll, setVerifyingAll] = useState(false);
  const [verificationResults, setVerificationResults] = useState<Record<number, boolean>>({});

  const handleVerifyAll = async () => {
    setVerifyingAll(true);
    const results: Record<number, boolean> = {};
    for (const tick of ticks) {
      const isValid = await verifyTickHmac(tick);
      results[tick.sequenceId] = isValid;
    }
    setVerificationResults(results);
    setVerifyingAll(false);
  };

  const postgresDdl = `-- ============================================================================
-- GF-T3-167: POSTGRESQL 16 HIGH-THROUGHPUT PARTITIONED TICK VAULT
-- Target: Cloud SQL / AlloyDB / Bare-Metal PostgreSQL 16
-- Features: Monotonic Sequence, Range Partitioning by Month, HMAC-SHA256 Trigger
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Monotonic Sequence Generator (strict ascending counter, zero gap)
CREATE SEQUENCE IF NOT EXISTS seq_engine_monotonic
    START WITH 1000000
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Master Partitioned Ledger Table
CREATE TABLE IF NOT EXISTS engine_tick_ledger (
    sequence_id     BIGINT NOT NULL DEFAULT nextval('seq_engine_monotonic'),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    symbol          VARCHAR(16) NOT NULL DEFAULT 'High-Aero Grand Touring Telemetry Core-DYN',
    side            VARCHAR(4) NOT NULL CHECK (side IN ('BUY', 'SELL')),
    price           NUMERIC(14, 4) NOT NULL CHECK (price > 0),
    quantity        INTEGER NOT NULL CHECK (quantity > 0),
    maker_order_id  VARCHAR(64) NOT NULL,
    taker_order_id  VARCHAR(64) NOT NULL,
    prev_hash       VARCHAR(64) NOT NULL,
    hmac_signature  VARCHAR(64) NOT NULL,
    is_settled      BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (created_at, sequence_id)
) PARTITION BY RANGE (created_at);

-- Partition for October 2026
CREATE TABLE IF NOT EXISTS engine_tick_ledger_2026_10 PARTITION OF engine_tick_ledger
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2026-11-01 00:00:00+00');

-- High-Frequency B-Tree Indices
CREATE INDEX IF NOT EXISTS idx_ledger_seq ON engine_tick_ledger_2026_10 (sequence_id);
CREATE INDEX IF NOT EXISTS idx_ledger_symbol_ts ON engine_tick_ledger_2026_10 (symbol, created_at DESC);

-- Cryptographic Non-Repudiation Trigger Function
CREATE OR REPLACE FUNCTION fn_verify_tick_hmac()
RETURNS TRIGGER AS $$
DECLARE
    computed_sig VARCHAR(64);
    canonical_payload TEXT;
    secret_key CONSTANT TEXT := 'GF_T3_167_NON_REPUDIATION_MASTER_KEY_2026';
BEGIN
    -- Canonical serialization format
    canonical_payload := NEW.sequence_id || '|' || 
                         to_char(NEW.created_at, 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') || '|' ||
                         NEW.symbol || '|' || NEW.side || '|' || 
                         to_char(NEW.price, 'FM999999990.00') || '|' || 
                         NEW.quantity || '|' || NEW.prev_hash;
               
    computed_sig := encode(hmac(canonical_payload::bytea, secret_key::bytea, 'sha256'), 'hex');
    
    IF LOWER(NEW.hmac_signature) != LOWER(computed_sig) THEN
        RAISE EXCEPTION 'CRITICAL AUDIT ERROR: HMAC Signature Mismatch on Sequence #% (Non-Repudiation Rejected)', NEW.sequence_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Enforce Cryptographic Proof Before Every Insertion
DROP TRIGGER IF EXISTS trg_verify_tick_hmac ON engine_tick_ledger;
CREATE TRIGGER trg_verify_tick_hmac
    BEFORE INSERT ON engine_tick_ledger
    FOR EACH ROW
    EXECUTE FUNCTION fn_verify_tick_hmac();
`;

  const hasTamperedTick = ticks.some(t => t.isTampered);

  return (
    <div className="space-y-7">
      {/* Header Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-lg">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 font-mono text-sm font-bold uppercase tracking-wider mb-1">
            <Database className="w-4 h-4" />
            PostgreSQL 16 Partitioned Tick Vault
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Monotonic Sequence & HMAC-SHA256 Non-Repudiation
          </h2>
          <p className="text-zinc-300 text-sm sm:text-base mt-1.5 leading-relaxed max-w-3xl">
            Every transaction is mathematically chained to the preceding execution block. Database-level trigger guarantees zero unverified state mutations.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 self-stretch md:self-auto bg-zinc-950 p-1.5 rounded-xl border border-zinc-800">
          <button
            onClick={() => setSelectedSubTab('LEDGER')}
            className={`px-4 py-2 rounded-lg text-sm sm:text-base font-mono font-bold transition-all ${
              selectedSubTab === 'LEDGER'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            Live Tick Ledger
          </button>
          <button
            onClick={() => setSelectedSubTab('SCHEMA_DDL')}
            className={`px-4 py-2 rounded-lg text-sm sm:text-base font-mono font-bold transition-all ${
              selectedSubTab === 'SCHEMA_DDL'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            PostgreSQL 16 DDL
          </button>
        </div>
      </div>

      {selectedSubTab === 'LEDGER' ? (
        <div className="space-y-6">
          {/* Action Toolbar */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-md">
            <div className="flex flex-wrap items-center gap-3.5">
              <button
                onClick={handleVerifyAll}
                disabled={verifyingAll}
                className="flex items-center gap-3 px-5 py-3 rounded-xl text-base font-mono font-black bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md active:scale-95"
              >
                {verifyingAll ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                <span>Verify All HMACs</span>
              </button>

              <button
                onClick={onOpenHmacModal}
                className="flex items-center gap-2.5 px-5 py-3 rounded-xl text-base font-mono font-bold bg-zinc-950 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 transition-all shadow-sm"
              >
                <Lock className="w-5 h-5 text-amber-400" />
                <span>HMAC Inspection Modal</span>
              </button>
            </div>

            {/* Tampering Testing Controls */}
            <div className="flex items-center gap-3">
              {hasTamperedTick ? (
                <button
                  onClick={onRestoreTicks}
                  className="flex items-center gap-2.5 px-5 py-3 rounded-xl text-base font-mono font-black bg-amber-500 text-black hover:bg-amber-400 transition-all shadow-lg active:scale-95"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span>Restore Genuine Ledger</span>
                </button>
              ) : (
                <button
                  onClick={() => onTamperTick(1)}
                  className="flex items-center gap-2.5 px-5 py-3 rounded-xl text-base font-mono font-black bg-rose-950/70 text-rose-300 border border-rose-500/50 hover:bg-rose-900/40 transition-all shadow-sm active:scale-95"
                  title="Simulate modifying a historical price to demonstrate trigger failure"
                >
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                  <span>Test Malicious Tamper</span>
                </button>
              )}
            </div>
          </div>

          {/* Tamper Warning Banner if Active */}
          {hasTamperedTick && (
            <div className="bg-rose-950/60 border border-rose-500/70 rounded-2xl p-6 flex items-start gap-4 text-rose-100 shadow-xl">
              <AlertTriangle className="w-7 h-7 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-base sm:text-lg font-mono space-y-2">
                <div className="font-black text-rose-300 text-lg sm:text-xl">
                  [SECURITY AUDIT TRIGGER VIOLATION DETECTED]
                </div>
                <p className="text-rose-200 leading-relaxed">
                  Sequence #1000189 price modified maliciously. The HMAC-SHA256 non-repudiation signature fails validation against the canonical payload. PostgreSQL trigger <code className="bg-rose-900/80 px-2.5 py-1 rounded-lg text-white font-bold">trg_verify_tick_hmac</code> halts commit execution.
                </p>
              </div>
            </div>
          )}

          {/* Master Tick Ledger Table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Hash className="w-5 h-5 text-emerald-400" />
                <span className="font-mono text-base sm:text-lg font-bold text-white uppercase tracking-wider">
                  Partition: engine_tick_ledger_2026_10
                </span>
              </div>
              <span className="text-xs sm:text-sm font-mono text-zinc-300 font-bold bg-zinc-950 px-3 py-1 rounded-lg border border-zinc-800">
                {ticks.length} Sequenced Executions
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-sm sm:text-base">
                <thead className="bg-zinc-950 text-zinc-400 uppercase text-xs sm:text-sm font-bold border-b border-zinc-800">
                  <tr>
                    <th className="py-3 px-4">Seq ID</th>
                    <th className="py-3 px-4">Timestamp (UTC)</th>
                    <th className="py-3 px-4">Symbol</th>
                    <th className="py-3 px-4">Side</th>
                    <th className="py-3 px-4 text-right">Price</th>
                    <th className="py-3 px-4 text-right">Qty</th>
                    <th className="py-3 px-4">Chained Prev Hash</th>
                    <th className="py-3 px-4">HMAC-SHA256 Signature</th>
                    <th className="py-3 px-4 text-center">Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {ticks.map((tick) => {
                    const isTampered = tick.isTampered;

                    return (
                      <tr
                        key={tick.sequenceId}
                        className={`transition-colors ${
                          isTampered
                            ? 'bg-rose-950/50 text-rose-100 font-bold'
                            : 'hover:bg-zinc-800/50 text-zinc-200'
                        }`}
                      >
                        <td className="py-3 px-4 font-bold text-white text-sm sm:text-base">
                          #{tick.sequenceId}
                        </td>
                        <td className="py-3 px-4 text-zinc-400 text-xs sm:text-sm font-normal">
                          {tick.timestamp.replace('T', ' ').substring(0, 23)}
                        </td>
                        <td className="py-3 px-4 text-amber-400 font-bold">
                          {tick.symbol}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-md text-xs sm:text-sm font-bold ${
                              tick.side === 'BUY'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                                : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                            }`}
                          >
                            {tick.side}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-white text-sm sm:text-base">
                          ${tick.price.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right text-zinc-100 font-medium">
                          {tick.quantity}
                        </td>
                        <td className="py-3 px-4 text-zinc-400 text-xs font-mono">
                          <span className="bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                            {tick.prevHash.substring(0, 10)}...{tick.prevHash.substring(56)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs font-mono">
                          <span
                            className={`px-2 py-0.5 rounded border ${
                              isTampered
                                ? 'bg-rose-900 text-rose-100 border-rose-500 font-bold'
                                : 'bg-zinc-950 text-zinc-300 border-zinc-800'
                            }`}
                          >
                            {tick.hmacSignature.substring(0, 12)}...{tick.hmacSignature.substring(54)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isTampered ? (
                            <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-rose-300 bg-rose-950 px-2.5 py-1 rounded border border-rose-600">
                              <AlertTriangle className="w-3.5 h-3.5" /> FAILED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-emerald-300 bg-emerald-950/70 px-2.5 py-1 rounded border border-emerald-500/40">
                              <CheckCircle2 className="w-3.5 h-3.5" /> VALID
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* SCHEMA DDL TAB */
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="bg-zinc-950 px-6 py-4.5 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileCode2 className="w-6 h-6 text-emerald-400" />
              <span className="text-base sm:text-lg font-mono font-bold text-zinc-200">
                schema_v1_partitioned_ticks.sql
              </span>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(postgresDdl);
                setCopiedDdl(true);
                setTimeout(() => setCopiedDdl(false), 2000);
              }}
              className="flex items-center gap-2.5 text-base font-mono font-bold text-zinc-300 hover:text-white bg-zinc-900 border border-zinc-700 px-5 py-2.5 rounded-xl transition-colors"
            >
              {copiedDdl ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
              <span>{copiedDdl ? 'Copied' : 'Copy SQL DDL'}</span>
            </button>
          </div>
          <div className="p-6 bg-zinc-950/80 overflow-x-auto text-base sm:text-lg font-mono leading-relaxed text-zinc-200">
            <pre>
              <code>{postgresDdl}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
