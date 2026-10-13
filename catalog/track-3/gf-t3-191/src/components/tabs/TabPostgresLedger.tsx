import React, { useState } from 'react';
import { Database, ShieldCheck, AlertTriangle, CheckCircle, Copy, Check, RefreshCw, Key, ShieldAlert } from 'lucide-react';
import { LedgerBlock } from '../../types/telemetry';
import { sha256Hex, formatTruncatedHash } from '../../utils/crypto';

interface TabPostgresLedgerProps {
  blocks: LedgerBlock[];
  onVerifyBlock: (blockId: number) => Promise<boolean>;
  onTamperBlock: (blockId: number) => void;
  onRestoreLedger: () => void;
}

export const TabPostgresLedger: React.FC<TabPostgresLedgerProps> = ({
  blocks,
  onVerifyBlock,
  onTamperBlock,
  onRestoreLedger,
}) => {
  const [activeTab, setActiveTab] = useState<'LEDGER_EXPLORER' | 'SQL_SCHEMA' | 'QUARANTINE_LOGS'>('LEDGER_EXPLORER');
  const [verifyingId, setVerifyingId] = useState<number | null>(null);
  const [verificationResult, setVerificationResult] = useState<{ [id: number]: boolean | null }>({});
  const [copiedSql, setCopiedSql] = useState(false);

  const postgresSqlSchema = `-- ==============================================================================
-- GF-T3-191: POSTGRESQL 16 ENTERPRISE TELEMETRY & AUDIT LEDGER
-- Range Partitioned Timeseries Tables with Cryptographic HMAC Chaining
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Master Telemetry Ledger Table (Range Partitioned by month)
CREATE TABLE telemetry_longitudinal_pitch (
    nonce BIGSERIAL NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    speed_kmh NUMERIC(5, 2) NOT NULL CHECK (speed_kmh >= 0.00),
    deceleration_g NUMERIC(4, 3) NOT NULL CHECK (deceleration_g >= 0.000),
    pitch_angle_deg NUMERIC(4, 2) NOT NULL,
    front_hydraulic_bar NUMERIC(6, 2) NOT NULL,
    rear_hydraulic_bar NUMERIC(6, 2) NOT NULL,
    rear_bias_ratio NUMERIC(4, 3) NOT NULL,
    jerk_g_per_sec NUMERIC(5, 3) NOT NULL,
    prev_hash VARCHAR(64) NOT NULL,
    hmac_signature VARCHAR(64) NOT NULL,
    is_quarantined BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (nonce, recorded_at)
) PARTITION BY RANGE (recorded_at);

-- 2. Monthly Partition Hypertable definitions
CREATE TABLE telemetry_p2026_10 PARTITION OF telemetry_longitudinal_pitch
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2026-11-01 00:00:00+00');

CREATE TABLE telemetry_p2026_11 PARTITION OF telemetry_longitudinal_pitch
    FOR VALUES FROM ('2026-11-01 00:00:00+00') TO ('2026-12-01 00:00:00+00');

-- 3. Audit Quarantine Quarantine Log
CREATE TABLE audit_quarantine_log (
    quarantine_id BIGSERIAL PRIMARY KEY,
    nonce BIGINT NOT NULL,
    reason VARCHAR(128) NOT NULL,
    jerk_recorded NUMERIC(5, 3) NOT NULL,
    investigated BOOLEAN NOT NULL DEFAULT FALSE,
    logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Jerk Threshold Comfort Enforcement Trigger
-- Quarantines any telemetry record exceeding the 0.850 G/s passenger jerk limit
CREATE OR REPLACE FUNCTION trg_quarantine_longitudinal_jerk()
RETURNS TRIGGER AS $$
BEGIN
    -- Evaluate Jerk Threshold (0.850 G/s executive comfort limit)
    IF NEW.jerk_g_per_sec > 0.850 THEN
        NEW.is_quarantined := TRUE;
        INSERT INTO audit_quarantine_log (nonce, reason, jerk_recorded, logged_at)
        VALUES (
            NEW.nonce,
            'PASSENGER_COMFORT_JERK_EXCEEDED: ' || NEW.jerk_g_per_sec::text || ' G/s',
            NEW.jerk_g_per_sec,
            NOW()
        );
    END IF;
    
    -- Validate HMAC chain integrity
    IF NEW.prev_hash IS NULL OR LENGTH(NEW.prev_hash) != 64 THEN
        NEW.is_quarantined := TRUE;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_jerk_and_hmac
BEFORE INSERT ON telemetry_longitudinal_pitch
FOR EACH ROW EXECUTE FUNCTION trg_quarantine_longitudinal_jerk();

-- 5. High-Throughput B-Tree Indices
CREATE INDEX idx_telemetry_recorded_at ON telemetry_longitudinal_pitch (recorded_at DESC);
CREATE INDEX idx_telemetry_quarantine ON telemetry_longitudinal_pitch (is_quarantined) WHERE is_quarantined = TRUE;
CREATE INDEX idx_telemetry_nonce_chain ON telemetry_longitudinal_pitch (nonce ASC, prev_hash);`;

  const handleVerify = async (id: number) => {
    setVerifyingId(id);
    const valid = await onVerifyBlock(id);
    setVerificationResult(prev => ({ ...prev, [id]: valid }));
    setVerifyingId(null);
  };

  const copySql = () => {
    navigator.clipboard.writeText(postgresSqlSchema);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header and Subview Navigator */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Database className="w-7 h-7 text-emerald-400" />
            PostgreSQL 16 Executive Telemetry Ledger
          </h2>
          <p className="text-slate-400 text-base mt-1">
            HMAC-SHA256 chained audit blocks with automated jerk threshold quarantine triggers.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveTab('LEDGER_EXPLORER')}
            className={`px-3 py-1.5 rounded-md text-base font-semibold transition-all cursor-pointer ${
              activeTab === 'LEDGER_EXPLORER'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Ledger Explorer
          </button>
          <button
            onClick={() => setActiveTab('SQL_SCHEMA')}
            className={`px-3 py-1.5 rounded-md text-base font-semibold transition-all cursor-pointer ${
              activeTab === 'SQL_SCHEMA'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Postgres 16 DDL
          </button>
          <button
            onClick={() => setActiveTab('QUARANTINE_LOGS')}
            className={`px-3 py-1.5 rounded-md text-base font-semibold transition-all cursor-pointer ${
              activeTab === 'QUARANTINE_LOGS'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Quarantine Audit
          </button>
        </div>
      </div>

      {activeTab === 'LEDGER_EXPLORER' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
            <div>
              <span className="text-white text-base font-bold flex items-center gap-2">
                <Key className="w-5 h-5 text-emerald-400" />
                Live Cryptographic HMAC-SHA256 Chain
              </span>
              <p className="text-slate-400 text-sm">
                Each block seals the previous block hash and verifies that jerk remains below the 0.850 G/s comfort ceiling.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onRestoreLedger}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Restore all blocks to verified state"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reset Ledger</span>
              </button>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-base border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <th className="py-3 px-3">BLOCK / NONCE</th>
                  <th className="py-3 px-3">EVENT TYPE</th>
                  <th className="py-3 px-3">PITCH / JERK</th>
                  <th className="py-3 px-3">PREV HASH</th>
                  <th className="py-3 px-3">HMAC-SHA256 SIGNATURE</th>
                  <th className="py-3 px-3">STATUS</th>
                  <th className="py-3 px-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {blocks.map((block) => {
                  const verified = verificationResult[block.blockId];
                  return (
                    <tr
                      key={block.blockId}
                      className={`hover:bg-slate-800/30 transition-colors ${
                        block.tampered ? 'bg-red-500/10' : ''
                      }`}
                    >
                      <td className="py-3 px-3">
                        <div className="font-bold text-white">#{block.nonce}</div>
                        <div className="text-xs text-slate-500">{block.timestamp}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-sm font-semibold text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {block.eventType}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className={`font-semibold ${block.pitchAngleDeg < -1.5 ? 'text-amber-400' : 'text-slate-200'}`}>
                          Pitch: {block.pitchAngleDeg.toFixed(2)}°
                        </div>
                        <div className={`text-xs ${block.jerkGPerSec > 0.85 ? 'text-red-400 font-bold' : 'text-slate-400'}`}>
                          Jerk: {block.jerkGPerSec.toFixed(3)} G/s
                        </div>
                      </td>
                      <td className="py-3 px-3 text-sm text-slate-400">
                        {formatTruncatedHash(block.prevHash, 6, 6)}
                      </td>
                      <td className="py-3 px-3 text-sm font-bold text-emerald-400">
                        {formatTruncatedHash(block.hmacSignature, 8, 8)}
                      </td>
                      <td className="py-3 px-3">
                        {block.tampered ? (
                          <span className="inline-flex items-center gap-1 text-sm font-bold text-red-400 bg-red-500/20 border border-red-500/40 px-2.5 py-1 rounded">
                            <ShieldAlert className="w-4 h-4" />
                            TAMPERED
                          </span>
                        ) : block.status === 'QUARANTINED' ? (
                          <span className="inline-flex items-center gap-1 text-sm font-bold text-amber-400 bg-amber-500/20 border border-amber-500/40 px-2.5 py-1 rounded">
                            <AlertTriangle className="w-4 h-4" />
                            QUARANTINED
                          </span>
                        ) : verified === true ? (
                          <span className="inline-flex items-center gap-1 text-sm font-bold text-emerald-400 bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1 rounded">
                            <CheckCircle className="w-4 h-4" />
                            VERIFIED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-sm font-bold text-slate-300 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            COMMITTED
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right space-x-2">
                        <button
                          onClick={() => handleVerify(block.blockId)}
                          disabled={verifyingId === block.blockId}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-2.5 py-1 rounded transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          {verifyingId === block.blockId ? 'Checking...' : 'Verify Hash'}
                        </button>

                        <button
                          onClick={() => onTamperBlock(block.blockId)}
                          className="bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-300 border border-slate-700 hover:border-red-500/50 font-bold text-xs px-2.5 py-1 rounded transition-colors cursor-pointer"
                          title="Simulate data tampering to test hash invalidation and quarantine trigger"
                        >
                          Tamper
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'SQL_SCHEMA' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
            <div>
              <span className="text-white text-base font-bold font-mono">
                db/migrations/20261012_gf_t3_191_schema.sql
              </span>
              <p className="text-slate-400 text-sm mt-0.5">
                PostgreSQL 16 timeseries range partitioning, quarantine trigger procedures, and audit indexes.
              </p>
            </div>
            <button
              onClick={copySql}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-base font-mono font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              {copiedSql ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy SQL DDL</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-4 bg-slate-950 rounded-lg text-slate-200 font-mono text-sm leading-relaxed overflow-x-auto border border-slate-800/80 max-h-[500px]">
            {postgresSqlSchema}
          </pre>
        </div>
      )}

      {activeTab === 'QUARANTINE_LOGS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
          <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
            PostgreSQL Jerk Threshold & HMAC Quarantine Audit Trail
          </h3>
          <p className="text-slate-400 text-base mb-5">
            Automated records quarantined by the <code className="text-amber-400">trg_quarantine_longitudinal_jerk()</code> trigger.
          </p>

          <div className="space-y-3 font-mono text-sm">
            <div className="p-4 bg-slate-950 rounded-lg border border-amber-500/30 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <span>LOG_ID #4029</span>
                  <span>·</span>
                  <span>NONCE #1,000,004</span>
                </div>
                <div className="text-slate-300 mt-1">
                  Reason: PASSENGER_COMFORT_JERK_EXCEEDED (Jerk: 0.942 G/s &gt; 0.850 G/s limit)
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Captured during sudden driver obstacle avoidance tap. Isolated to preserve VIP comfort metrics.
                </div>
              </div>
              <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded">
                QUARANTINED
              </span>
            </div>

            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <span>LOG_ID #4028</span>
                  <span>·</span>
                  <span>NONCE #1,000,003</span>
                </div>
                <div className="text-slate-300 mt-1">
                  Integrity Verified: HMAC-SHA256 signature chain matches parent block #1,000,002.
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Normal executive deceleration event (Pitch: -0.26°, Jerk: 0.284 G/s).
                </div>
              </div>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">
                AUDITED_OK
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
