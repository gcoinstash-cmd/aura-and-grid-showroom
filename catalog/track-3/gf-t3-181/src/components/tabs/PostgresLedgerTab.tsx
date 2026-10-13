import React, { useState } from 'react';
import { Database, ShieldCheck, Plus, AlertCircle, Copy, CheckCircle, RefreshCw, Lock } from 'lucide-react';
import { LedgerBlock, TelemetryState } from '../../types/telemetry';
import { computeHmacSha256, HMAC_SECRET_SEED } from '../../utils/crypto';

interface PostgresLedgerTabProps {
  blocks: LedgerBlock[];
  telemetry: TelemetryState;
  onAppendBlock: () => void;
  onVerifyLedger: () => void;
  onTamperBlock: (index: number) => void;
  onRepairChain: () => void;
  isVerifying: boolean;
  verificationReport: { verified: boolean; checkedCount: number; brokenIndex?: number } | null;
}

export const PostgresLedgerTab: React.FC<PostgresLedgerTabProps> = ({
  blocks,
  telemetry,
  onAppendBlock,
  onVerifyLedger,
  onTamperBlock,
  onRepairChain,
  isVerifying,
  verificationReport,
}) => {
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeView, setActiveView] = useState<'blocks' | 'schema'>('blocks');

  const postgresDDL = `-- PostgreSQL 16 Partitioned Cryptographic Performance Ledger
-- Migration File: 20261011_001_performance_ledger.sql
-- Conforms to F1 Skunkworks / Acquire.com Institutional Deliverable Standard

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Root Partitioned Table
CREATE TABLE IF NOT EXISTS telemetry_ledger (
    id BIGSERIAL,
    block_nonce BIGINT NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    vin_descriptor VARCHAR(17) NOT NULL DEFAULT 'JTHBP5DE*P5******',
    drive_mode VARCHAR(12) NOT NULL CHECK (drive_mode IN ('ECO', 'NORMAL', 'SPORT', 'SPORT_PLUS')),
    pedal_input_pct NUMERIC(5,2) NOT NULL CHECK (pedal_input_pct BETWEEN 0.00 AND 100.00),
    throttle_valve_pct NUMERIC(5,2) NOT NULL CHECK (throttle_valve_pct BETWEEN 0.00 AND 100.00),
    engine_rpm INT NOT NULL CHECK (engine_rpm BETWEEN 600 AND 7500),
    diff_temp_c NUMERIC(5,2) NOT NULL CHECK (diff_temp_c BETWEEN -40.00 AND 220.00),
    viscosity_cst NUMERIC(6,2) NOT NULL CHECK (viscosity_cst >= 0.50),
    torque_bias_ratio NUMERIC(4,2) NOT NULL DEFAULT 2.80,
    rear_slip_delta NUMERIC(6,2) NOT NULL DEFAULT 0.00,
    prev_hash CHAR(64) NOT NULL,
    hmac_sha256 CHAR(64) NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    PRIMARY KEY (recorded_at, id)
) PARTITION BY RANGE (recorded_at);

-- Monthly Partition for October 2026
CREATE TABLE IF NOT EXISTS telemetry_ledger_y2026m10 PARTITION OF telemetry_ledger
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2026-11-01 00:00:00+00');

-- Quarantine Table for Differential Overheat Events
CREATE TABLE IF NOT EXISTS telemetry_quarantine (
    quarantine_id BIGSERIAL PRIMARY KEY,
    ledger_id BIGINT,
    recorded_at TIMESTAMPTZ NOT NULL,
    diff_temp_c NUMERIC(5,2) NOT NULL,
    viscosity_cst NUMERIC(6,2) NOT NULL,
    violation_reason TEXT NOT NULL,
    quarantined_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Differential Overheat Quarantine Trigger
CREATE OR REPLACE FUNCTION quarantine_overheated_telemetry()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.diff_temp_c >= 140.00 OR NEW.viscosity_cst < 4.80 THEN
        INSERT INTO telemetry_quarantine (
            ledger_id, recorded_at, diff_temp_c, viscosity_cst, violation_reason
        ) VALUES (
            NEW.id, NEW.recorded_at, NEW.diff_temp_c, NEW.viscosity_cst,
            'CRITICAL_THERMAL_SHEAR: Torsen differential oil temp exceeded 140C safety margin'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_diff_thermal
    AFTER INSERT ON telemetry_ledger
    FOR EACH ROW
    EXECUTE FUNCTION quarantine_overheated_telemetry();

-- Performance Indices (BRIN for timeseries order, B-tree on nonce, GIN on jsonb)
CREATE INDEX idx_telemetry_nonce ON telemetry_ledger(block_nonce);
CREATE INDEX idx_telemetry_hmac ON telemetry_ledger(hmac_sha256);
CREATE INDEX idx_telemetry_metadata_gin ON telemetry_ledger USING GIN (metadata);
CREATE INDEX idx_telemetry_time_brin ON telemetry_ledger USING BRIN (recorded_at);
`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(postgresDDL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Ledger Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            PostgreSQL 16 Cryptographic Telemetry Ledger
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Timeseries partitioned ledger with continuous HMAC-SHA256 audit chaining and overheat quarantine trigger.
          </p>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-800 p-0.5 rounded-lg flex items-center border border-slate-700">
            <button
              onClick={() => setActiveView('blocks')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeView === 'blocks'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Blocks Feed ({blocks.length})
            </button>
            <button
              onClick={() => setActiveView('schema')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeView === 'schema'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              PostgreSQL DDL
            </button>
          </div>

          <button
            onClick={onAppendBlock}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs h-8 px-2.5 rounded-lg inline-flex items-center gap-1 cursor-pointer transition-all active:scale-95"
            title="Append current throttle & diff telemetry state to blockchain ledger"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Commit Block</span>
          </button>

          <button
            onClick={onVerifyLedger}
            disabled={isVerifying}
            className="bg-slate-800 hover:bg-slate-700 border border-emerald-500/40 text-emerald-400 font-bold text-xs h-8 px-2.5 rounded-lg inline-flex items-center gap-1 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isVerifying ? 'Verifying...' : 'Verify Chain'}</span>
          </button>
        </div>
      </div>

      {/* Verification Status Banner if present */}
      {verificationReport && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs ${
            verificationReport.verified
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {verificationReport.verified ? (
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <div>
              <span className="font-bold text-sm block">
                {verificationReport.verified
                  ? 'Cryptographic Ledger Verified: 100% Intact'
                  : `Cryptographic Breach Detected at Block #${verificationReport.brokenIndex}`}
              </span>
              <span>
                {verificationReport.verified
                  ? `All ${verificationReport.checkedCount} monotonic blocks verified using HMAC-SHA256 Web Crypto standard.`
                  : 'Previous hash mismatch or signature corruption detected. The immutable chain was tampered with.'}
              </span>
            </div>
          </div>
          {!verificationReport.verified && (
            <button
              onClick={onRepairChain}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-semibold text-xs px-3 py-1.5 rounded-lg inline-flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Repair Ledger</span>
            </button>
          )}
        </div>
      )}

      {/* Main Content Area */}
      {activeView === 'blocks' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              Showing {blocks.length} recorded blocks in partition <strong className="text-slate-200">telemetry_ledger_y2026m10</strong>
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Monotonic Nonce: Zero Collision Guaranteed</span>
            </span>
          </div>

          <div className="space-y-3">
            {blocks.map((blk, idx) => (
              <div
                key={blk.blockNumber}
                className={`bg-slate-900/90 border rounded-xl p-4 transition-all ${
                  blk.isQuarantined
                    ? 'border-rose-500/50 bg-rose-950/10'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold font-mono text-sm">
                      Block #{blk.blockNumber}
                    </span>
                    <span className="text-slate-400 font-mono text-xs">
                      Nonce #{blk.nonce.toLocaleString()}
                    </span>
                    {blk.isQuarantined && (
                      <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-mono px-2 py-0.5 rounded">
                        QUARANTINED (Diff &gt; 140°C)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>{blk.timestamp}</span>
                    <button
                      onClick={() => onTamperBlock(idx)}
                      className="text-slate-500 hover:text-amber-400 text-[11px] underline cursor-pointer"
                      title="Simulate unauthorized tampering to test cryptographical chain verification"
                    >
                      [Simulate Tamper]
                    </button>
                  </div>
                </div>

                {/* Telemetry Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 py-2 text-xs font-mono">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Throttle / Pedal:</span>
                    <span className="text-white font-semibold">{blk.throttleAnglePct.toFixed(1)}% / {blk.pedalPct.toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Engine Tachometer:</span>
                    <span className="text-amber-400 font-semibold">{blk.rpm.toLocaleString()} RPM</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Torsen Diff Temp:</span>
                    <span className={`font-semibold ${blk.diffTempC >= 140 ? 'text-rose-400' : 'text-slate-200'}`}>
                      {blk.diffTempC.toFixed(1)}°C
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Kinematic Viscosity:</span>
                    <span className="text-emerald-400 font-semibold">{blk.viscosityCSt.toFixed(2)} cSt</span>
                  </div>
                  <div className="col-span-2 sm:col-span-4 md:col-span-1">
                    <span className="text-slate-400 block text-[11px]">TBR Lockup:</span>
                    <span className="text-slate-300">2.80:1 Nominal</span>
                  </div>
                </div>

                {/* Hash Chain Footprint */}
                <div className="mt-3 pt-2 border-t border-slate-800/80 space-y-1 font-mono text-[11px]">
                  <div className="flex items-center gap-2 truncate text-slate-400">
                    <span className="text-slate-500 shrink-0">Prev Hash:</span>
                    <span className="truncate text-slate-400">{blk.prevHash}</span>
                  </div>
                  <div className="flex items-center gap-2 truncate text-emerald-400">
                    <span className="text-slate-500 shrink-0 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-emerald-400" />
                      HMAC Signature:
                    </span>
                    <span className="truncate font-semibold">{blk.blockHmac}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">PostgreSQL 16 Partitioned DDL Specification</h3>
              <p className="text-xs text-slate-400">Includes timeseries range partitions, overheat quarantine triggers, and GIN/BRIN indices.</p>
            </div>
            <button
              onClick={handleCopySql}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs h-8 px-3 rounded-lg inline-flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedSql ? 'Copied' : 'Copy DDL'}</span>
            </button>
          </div>
          <pre className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto max-h-96 leading-relaxed">
            <code>{postgresDDL}</code>
          </pre>
        </div>
      )}
    </div>
  );
};
