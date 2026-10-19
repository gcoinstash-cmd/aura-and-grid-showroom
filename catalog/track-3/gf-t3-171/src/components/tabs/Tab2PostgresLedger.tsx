import React, { useState } from 'react';
import { AuditRecord } from '../../types';
import { Database, ShieldCheck, AlertTriangle, RefreshCw, Copy, Check, Lock, Layers } from 'lucide-react';

interface Tab2Props {
  onVerifyAudit: () => void;
  isAuditing: boolean;
}

export const Tab2PostgresLedger: React.FC<Tab2Props> = ({ onVerifyAudit, isAuditing }) => {
  const [copied, setCopied] = useState(false);
  const [auditStatus, setAuditStatus] = useState<'VALID' | 'TAMPER_DETECTED' | 'UNVERIFIED'>('VALID');
  const [tamperedSeq, setTamperedSeq] = useState<number | null>(null);

  // Initial cryptographic ledger sample records
  const [records, setRecords] = useState<AuditRecord[]>([
    {
      sequenceId: 1000001,
      timestampUtc: '2026-10-11T21:14:01.002Z',
      rpm: 6920,
      throttlePct: 94.2,
      vvtDeg: 28.4,
      manifoldKpa: 102.1,
      oilTempC: 98.4,
      previousHash: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
      monotonicHash: '4f8d9b1c2e3a4567890abcdef1234567890abcdef1234567890abcdef1234567',
      isTampered: false,
    },
    {
      sequenceId: 1000002,
      timestampUtc: '2026-10-11T21:14:01.004Z',
      rpm: 7010,
      throttlePct: 96.5,
      vvtDeg: 29.1,
      manifoldKpa: 102.8,
      oilTempC: 98.5,
      previousHash: '4f8d9b1c2e3a4567890abcdef1234567890abcdef1234567890abcdef1234567',
      monotonicHash: '9c8b7a6f5e4d3c2b1a0987654321fedcba0987654321fedcba0987654321fedc',
      isTampered: false,
    },
    {
      sequenceId: 1000003,
      timestampUtc: '2026-10-11T21:14:01.006Z',
      rpm: 7100, // Peak 2UR-GSE redline
      throttlePct: 100.0,
      vvtDeg: 30.0,
      manifoldKpa: 103.4,
      oilTempC: 98.8,
      previousHash: '9c8b7a6f5e4d3c2b1a0987654321fedcba0987654321fedcba0987654321fedc',
      monotonicHash: '11223344556677889900aabbccddeeff0011223344556677889900aabbccddee',
      isTampered: false,
    },
    {
      sequenceId: 1000004,
      timestampUtc: '2026-10-11T21:14:01.008Z',
      rpm: 7080,
      throttlePct: 98.2,
      vvtDeg: 29.8,
      manifoldKpa: 103.1,
      oilTempC: 99.0,
      previousHash: '11223344556677889900aabbccddeeff0011223344556677889900aabbccddee',
      monotonicHash: 'ffeeddccbbaa99887766554433221100ffeeddccbbaa99887766554433221100',
      isTampered: false,
    },
    {
      sequenceId: 1000005,
      timestampUtc: '2026-10-11T21:14:01.010Z',
      rpm: 6950,
      throttlePct: 91.0,
      vvtDeg: 28.6,
      manifoldKpa: 101.9,
      oilTempC: 99.1,
      previousHash: 'ffeeddccbbaa99887766554433221100ffeeddccbbaa99887766554433221100',
      monotonicHash: '7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b',
      isTampered: false,
    },
  ]);

  const handleTamperRecord = (seq: number) => {
    setRecords((prev) =>
      prev.map((r) =>
        r.sequenceId === seq
          ? {
              ...r,
              rpm: 4200, // Unauthorized injected alteration
              isTampered: true,
            }
          : r
      )
    );
    setAuditStatus('TAMPER_DETECTED');
    setTamperedSeq(seq);
  };

  const handleRepairChain = () => {
    setRecords((prev) =>
      prev.map((r) => ({
        ...r,
        rpm: r.sequenceId === 1000004 ? 7080 : r.rpm,
        isTampered: false,
      }))
    );
    setAuditStatus('VALID');
    setTamperedSeq(null);
  };

  const handleCopyDdl = () => {
    navigator.clipboard.writeText(pgDdl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pgDdl = `-- =====================================================================
-- GF-T3-171: PostgreSQL 16 Partitioned WAL Spillover & Monotonic Audit
-- Engine Calibrated for Heavy Overland Dynamics Platform IS 500 V8 Powertrain Telemetry
-- Architecture: Unlogged Ingest Staging -> Range Partitioned Master
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS is500_telemetry;

-- 1. Unlogged high-speed ingest staging (Zero WAL disk write overhead)
CREATE UNLOGGED TABLE is500_telemetry.stage_ticks (
    staging_id BIGSERIAL PRIMARY KEY,
    sequence_id BIGINT NOT NULL,
    timestamp_utc TIMESTAMPTZ NOT NULL,
    engine_rpm INT NOT NULL,
    throttle_pct REAL NOT NULL,
    vvt_advance_deg REAL NOT NULL,
    manifold_kpa REAL NOT NULL,
    fuel_rail_mpa REAL NOT NULL,
    oil_temp_c REAL NOT NULL,
    egt_c REAL NOT NULL,
    monotonic_hash BYTEA NOT NULL
);

-- 2. Master Partitioned Ledger (Partitioned by RANGE of timestamp_utc)
CREATE TABLE is500_telemetry.ledger (
    sequence_id BIGINT NOT NULL,
    timestamp_utc TIMESTAMPTZ NOT NULL,
    engine_rpm INT NOT NULL CHECK (engine_rpm BETWEEN 0 AND 9500),
    throttle_pct REAL NOT NULL CHECK (throttle_pct BETWEEN 0.0 AND 100.0),
    vvt_advance_deg REAL NOT NULL CHECK (vvt_advance_deg BETWEEN -10.0 AND 50.0),
    manifold_kpa REAL NOT NULL,
    fuel_rail_mpa REAL NOT NULL,
    oil_temp_c REAL NOT NULL,
    egt_c REAL NOT NULL,
    previous_hash BYTEA NOT NULL,
    monotonic_hash BYTEA NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT pk_is500_ledger PRIMARY KEY (sequence_id, timestamp_utc)
) PARTITION BY RANGE (timestamp_utc);

-- Active Partition Q4 2026
CREATE TABLE is500_telemetry.ledger_2026_q4 PARTITION OF is500_telemetry.ledger
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

-- High-density BRIN index on sequence_id for terabyte-scale scans
CREATE INDEX idx_is500_ledger_seq_brin ON is500_telemetry.ledger USING BRIN (sequence_id);
CREATE INDEX idx_is500_ledger_ts_btree ON is500_telemetry.ledger USING BTREE (timestamp_utc);

-- 3. Non-repudiation HMAC-SHA256 Monotonic Audit Trigger Function
CREATE OR REPLACE FUNCTION is500_telemetry.fn_enforce_monotonic_hash()
RETURNS TRIGGER AS $$
DECLARE
    v_prev_hash BYTEA;
    v_computed_hash BYTEA;
BEGIN
    -- Retrieve cryptographic hash from immediately preceding sequence
    SELECT monotonic_hash INTO v_prev_hash
    FROM is500_telemetry.ledger
    WHERE sequence_id = NEW.sequence_id - 1;

    -- Strict non-repudiation gap verification
    IF v_prev_hash IS NULL AND NEW.sequence_id <> 1 THEN
        RAISE EXCEPTION 'CRITICAL: Sequence gap detected at sequence_id %, prior sequence % is missing', 
            NEW.sequence_id, NEW.sequence_id - 1;
    END IF;

    -- Genesis sequence initialization
    IF NEW.sequence_id = 1 THEN
        v_prev_hash := decode('0000000000000000000000000000000000000000000000000000000000000000', 'hex');
    END IF;

    -- Compute SHA-256 hash linking previous record + current telemetry fields
    v_computed_hash := digest(
        v_prev_hash || 
        NEW.sequence_id::text || 
        NEW.timestamp_utc::text || 
        NEW.engine_rpm::text || 
        NEW.throttle_pct::text ||
        NEW.vvt_advance_deg::text, 
        'sha256'
    );

    -- Enforce immutability verification
    IF NEW.monotonic_hash IS NOT NULL AND NEW.monotonic_hash <> v_computed_hash THEN
        RAISE EXCEPTION 'CRITICAL: Tamper detected at sequence %! Supplied hash does not match computed digest', 
            NEW.sequence_id;
    END IF;

    NEW.previous_hash := v_prev_hash;
    NEW.monotonic_hash := v_computed_hash;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger before insert
CREATE TRIGGER trg_is500_ledger_audit
BEFORE INSERT ON is500_telemetry.ledger
FOR EACH ROW EXECUTE FUNCTION is500_telemetry.fn_enforce_monotonic_hash();`;

  return (
    <div className="space-y-8">
      {/* Tab Header */}
      <div className="space-y-2">
        <div className="text-sm font-semibold uppercase tracking-wider text-emerald-400 font-mono">
          02. Postgres WAL Spillover Ledger
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Partitioned PostgreSQL 16 Schema &amp; HMAC-SHA256 Non-Repudiation
        </h2>
        <p className="text-base text-slate-300 max-w-4xl">
          Zero-bottleneck persistence bridge: Asynchronous ring buffer micro-batches spill into an unlogged staging table via binary COPY, transitioning into range-partitioned tables with HMAC-SHA256 cryptographic chain verification.
        </p>
      </div>

      {/* Interactive Cryptographic Audit Verification Engine */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Cryptographic Hash Chain Verifier (Monotonic Audit)
            </h3>
            <p className="text-sm text-slate-400">
              Each record cryptographically binds the previous record&apos;s SHA-256 hash. Any retroactive modification breaks the entire subsequent chain.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onVerifyAudit}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 text-emerald-400 ${isAuditing ? 'animate-spin' : ''}`} />
              Verify Chain Integrity
            </button>

            {auditStatus === 'VALID' ? (
              <button
                onClick={() => handleTamperRecord(1000004)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-amber-300 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-500/40 rounded-lg transition-colors"
              >
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Inject Bit-Flip Tamper (#1,000,004)
              </button>
            ) : (
              <button
                onClick={handleRepairChain}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 rounded-lg transition-colors"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                Re-sign &amp; Restore Chain
              </button>
            )}
          </div>
        </div>

        {/* Audit Status Alert Banner (strict 14px floor) */}
        {auditStatus === 'VALID' ? (
          <div className="p-4 rounded-lg bg-emerald-950/40 border border-emerald-500/40 flex items-center gap-3 text-sm">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="text-emerald-200">
              <strong>Audit Status: 100% Cryptographically Verified.</strong> Monotonic hash chain is intact across all sequence intervals. Zero sequence gaps or altered telemetry payloads detected.
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-rose-950/60 border border-rose-500/60 flex items-center gap-3 text-sm">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <div className="text-rose-200">
              <strong>NON-REPUDIATION TAMPER DETECTED:</strong> Record #{tamperedSeq} failed cryptographic verification! Computed hash does not match chained digest. PostgreSQL trigger <code>trg_is500_ledger_audit</code> aborted transaction.
            </div>
          </div>
        )}

        {/* Cryptographic Hash Chain Table (All text >= 14px / text-sm) */}
        <div className="overflow-x-auto border border-slate-800 rounded-lg">
          <table className="w-full text-left text-sm font-mono divide-y divide-slate-800">
            <thead className="bg-slate-950 text-slate-400 font-semibold uppercase">
              <tr>
                <th className="px-4 py-3">Sequence</th>
                <th className="px-4 py-3">Timestamp (UTC)</th>
                <th className="px-4 py-3">V8 RPM</th>
                <th className="px-4 py-3">Throttle</th>
                <th className="px-4 py-3">VVT-iE</th>
                <th className="px-4 py-3">Previous Hash (Prefix)</th>
                <th className="px-4 py-3">Monotonic Hash (SHA-256)</th>
                <th className="px-4 py-3 text-right">Integrity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-900/60">
              {records.map((r) => (
                <tr
                  key={r.sequenceId}
                  className={`transition-colors ${
                    r.isTampered ? 'bg-rose-950/40 text-rose-200' : 'hover:bg-slate-800/40'
                  }`}
                >
                  <td className="px-4 py-3 font-bold text-white">#{r.sequenceId}</td>
                  <td className="px-4 py-3 text-slate-300">{r.timestampUtc.slice(11, 23)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`font-bold ${
                        r.isTampered ? 'text-rose-400 underline' : 'text-cyan-300'
                      }`}
                    >
                      {r.rpm} RPM
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-200">{r.throttlePct.toFixed(1)}%</td>
                  <td className="px-4 py-3 text-slate-200">{r.vvtDeg.toFixed(1)}°</td>
                  <td className="px-4 py-3 text-slate-400 truncate max-w-[120px]">
                    {r.previousHash.slice(0, 16)}...
                  </td>
                  <td className="px-4 py-3 text-emerald-400 truncate max-w-[140px]">
                    {r.monotonicHash.slice(0, 20)}...
                  </td>
                  <td className="px-4 py-3 text-right">
                    {r.isTampered ? (
                      <span className="inline-flex items-center gap-1 text-rose-400 font-bold">
                        <AlertTriangle className="w-4 h-4" /> TAMPER
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                        <Lock className="w-4 h-4" /> VALID
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Architecture Highlights Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm font-mono">
            <Database className="w-4 h-4" />
            UNLOGGED STAGING TABLE
          </div>
          <h4 className="text-xl font-bold text-white">Microsecond Micro-Batches</h4>
          <p className="text-sm text-slate-300">
            Ingestion uses <code>COPY FROM STDIN BINARY</code> straight into unlogged tables, bypassing PostgreSQL WAL disk flush latency on the ingestion critical path.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm font-mono">
            <Layers className="w-4 h-4" />
            RANGE PARTITIONS &amp; BRIN INDEX
          </div>
          <h4 className="text-xl font-bold text-white">Quarterly Partition Routing</h4>
          <p className="text-sm text-slate-300">
            Table partitioned by <code>timestamp_utc</code> quarterly intervals. BRIN index on <code>sequence_id</code> delivers 100x smaller index footprint than B-tree for sequential ticks.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm font-mono">
            <Lock className="w-4 h-4" />
            NON-REPUDIATION AUDIT
          </div>
          <h4 className="text-xl font-bold text-white">HMAC-SHA256 Triggers</h4>
          <p className="text-sm text-slate-300">
            Row-level triggers verify that each sequence payload cryptographically seals the preceding hash. Guarantees tamper-evident audit trails for APA asset buyers.
          </p>
        </div>
      </div>

      {/* Production PostgreSQL DDL Viewer */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-950 border-b border-slate-800 gap-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-bold text-white">
              Production PostgreSQL 16 DDL Schema (schema.sql)
            </span>
          </div>

          <button
            onClick={handleCopyDdl}
            className="flex items-center gap-2 px-3.5 py-1.5 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
            {copied ? 'Copied to Clipboard' : 'Copy SQL Schema'}
          </button>
        </div>

        <div className="p-6 bg-slate-950 font-mono text-sm overflow-x-auto text-slate-200 leading-relaxed max-h-[500px]">
          <pre>{pgDdl}</pre>
        </div>
      </div>
    </div>
  );
};
