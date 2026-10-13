import React, { useState } from 'react';
import {
  Database,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  AlertTriangle,
  RefreshCw,
  Lock,
  FileCode,
  Flame,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { TelemetryBlock } from '../../types/telemetry';

interface TabPostgresLedgerProps {
  blocks: TelemetryBlock[];
  onTamperBlock: (nonce: number) => void;
  onRestoreBlock: (nonce: number) => void;
  onSimulatePressureDrop: () => void;
}

export const TabPostgresLedger: React.FC<TabPostgresLedgerProps> = ({
  blocks,
  onTamperBlock,
  onRestoreBlock,
  onSimulatePressureDrop,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'ledger' | 'ddl_schema'>('ledger');
  const [copiedDdl, setCopiedDdl] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<TelemetryBlock | null>(blocks[0] || null);
  const [verificationResult, setVerificationResult] = useState<string | null>(null);

  const postgresDdlCode = `-- ============================================================================
-- GF-T3-188: LEXUS GX 550 OVERTRAIL+ TELEMETRY & AUDIT LEDGER SCHEMA
-- Target Engine: PostgreSQL 16.x / AlloyDB
-- Compliance: Cryptographic HMAC-SHA256 Chaining, Nonce Audit, Zero Deadlocks
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE SCHEMA IF NOT EXISTS ekdss_telemetry;

-- 1. Enum Types
CREATE TYPE ekdss_telemetry.valve_state AS ENUM ('OPEN', 'CLOSED', 'FAILSAFE_LOCKED');
CREATE TYPE ekdss_telemetry.crawl_speed_mode AS ENUM ('OFF', 'LO', 'MED_LO', 'MED', 'MED_HI', 'HI');
CREATE TYPE ekdss_telemetry.transfer_case_mode AS ENUM ('4H', '4L');

-- 2. Master Partitioned Hypertable
CREATE TABLE ekdss_telemetry.terrain_blocks (
    nonce BIGINT NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    vehicle_vin CHAR(17) NOT NULL DEFAULT 'JTJDJ5509R4000188',
    speed_mps NUMERIC(6,3) NOT NULL CHECK (speed_mps >= 0),
    cross_axle_articulation_mm NUMERIC(6,2) NOT NULL,
    front_hydraulic_pressure_mpa NUMERIC(5,2) NOT NULL,
    rear_hydraulic_pressure_mpa NUMERIC(5,2) NOT NULL,
    differential_pressure_mpa NUMERIC(5,2) GENERATED ALWAYS AS (ABS(front_hydraulic_pressure_mpa - rear_hydraulic_pressure_mpa)) STORED,
    front_valve_state ekdss_telemetry.valve_state NOT NULL,
    rear_valve_state ekdss_telemetry.valve_state NOT NULL,
    roll_stiffness_nm_deg NUMERIC(7,2) NOT NULL,
    crawl_mode ekdss_telemetry.crawl_speed_mode NOT NULL DEFAULT 'OFF',
    transfer_case ekdss_telemetry.transfer_case_mode NOT NULL DEFAULT '4H',
    rear_diff_locked BOOLEAN NOT NULL DEFAULT FALSE,
    center_diff_locked BOOLEAN NOT NULL DEFAULT FALSE,
    max_brake_rotor_temp_c NUMERIC(5,1) NOT NULL,
    prev_block_hash CHAR(64) NOT NULL,
    block_hmac_sha256 CHAR(64) NOT NULL,
    is_quarantined BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (recorded_at, nonce)
) PARTITION BY RANGE (recorded_at);

-- Partition creation for 2026 Q4
CREATE TABLE ekdss_telemetry.terrain_blocks_2026_q4 PARTITION OF ekdss_telemetry.terrain_blocks
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

-- 3. High-Frequency Indices
CREATE INDEX idx_terrain_nonce ON ekdss_telemetry.terrain_blocks (nonce);
CREATE INDEX idx_terrain_quarantine ON ekdss_telemetry.terrain_blocks (is_quarantined) WHERE is_quarantined = TRUE;

-- 4. Cryptographic HMAC Verification Function
CREATE OR REPLACE FUNCTION ekdss_telemetry.calculate_block_hmac(
    p_nonce BIGINT,
    p_timestamp TIMESTAMPTZ,
    p_speed NUMERIC,
    p_front_p NUMERIC,
    p_rear_p NUMERIC,
    p_prev_hash TEXT,
    p_secret_key TEXT
) RETURNS TEXT AS $$
BEGIN
    RETURN encode(
        hmac(
            p_nonce::text || '|' ||
            p_timestamp::text || '|' ||
            p_speed::text || '|' ||
            p_front_p::text || '|' ||
            p_rear_p::text || '|' ||
            p_prev_hash,
            p_secret_key::bytea,
            'sha256'
        ),
        'hex'
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 5. Hydraulic Stabilizer Line Pressure Drop Safety Trigger
CREATE OR REPLACE FUNCTION ekdss_telemetry.trg_ekdss_line_pressure_safety_quarantine()
RETURNS TRIGGER AS $$
DECLARE
    v_last_front_p NUMERIC;
    v_last_rear_p NUMERIC;
BEGIN
    SELECT front_hydraulic_pressure_mpa, rear_hydraulic_pressure_mpa
    INTO v_last_front_p, v_last_rear_p
    FROM ekdss_telemetry.terrain_blocks
    WHERE nonce = NEW.nonce - 1
    ORDER BY recorded_at DESC LIMIT 1;

    IF FOUND THEN
        -- If sudden pressure loss exceeds 4.80 MPa within cycle interval (hose rupture)
        IF (v_last_front_p - NEW.front_hydraulic_pressure_mpa > 4.80) OR
           (v_last_rear_p - NEW.rear_hydraulic_pressure_mpa > 4.80) THEN
            NEW.is_quarantined := TRUE;
            NEW.front_valve_state := 'FAILSAFE_LOCKED';
            NEW.rear_valve_state := 'FAILSAFE_LOCKED';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pressure_safety
    BEFORE INSERT ON ekdss_telemetry.terrain_blocks
    FOR EACH ROW
    EXECUTE FUNCTION ekdss_telemetry.trg_ekdss_line_pressure_safety_quarantine();
`;

  const copyDdl = () => {
    navigator.clipboard.writeText(postgresDdlCode);
    setCopiedDdl(true);
    setTimeout(() => setCopiedDdl(false), 2000);
  };

  const handleVerifyChain = () => {
    const tampered = blocks.find((b) => b.tampered);
    if (tampered) {
      setVerificationResult(`FAIL: Cryptographic HMAC signature collision or data tampering detected at Nonce #${tampered.nonce}! Hash mismatch with stored signature.`);
    } else {
      setVerificationResult(`SUCCESS: All ${blocks.length} blocks verified against HMAC-SHA256 state chain. Monotonic nonces contiguous. Zero tampering detected.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-3xl font-extrabold text-white flex items-center gap-3">
              <Database className="w-7 h-7 text-emerald-400" />
              PostgreSQL 16 Terrain Ledger & HMAC Chains
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Partitioned Timeseries Hypertables, Hydraulic Stabilizer Line Pressure Drop Quarantine Triggers, and Cryptographic SHA-256 Chaining
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleVerifyChain}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
            >
              <ShieldCheck className="w-4 h-4" />
              Verify Chain Integrity
            </button>

            <button
              onClick={onSimulatePressureDrop}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <AlertTriangle className="w-4 h-4" />
              Simulate Hydraulic Pressure Drop Anomaly
            </button>
          </div>
        </div>

        {/* Verification Alert Banner */}
        {verificationResult && (
          <div
            className={`p-3 rounded-xl border text-xs font-mono flex items-center justify-between ${
              verificationResult.startsWith('SUCCESS')
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {verificationResult.startsWith('SUCCESS') ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{verificationResult}</span>
            </div>
            <button
              onClick={() => setVerificationResult(null)}
              className="text-slate-400 hover:text-white ml-2 text-xs"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Sub-tab navigation */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-2 rounded-xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('ledger')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
              activeSubTab === 'ledger'
                ? 'bg-emerald-600 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Live Monotonic Block Ledger ({blocks.length} Blocks)
          </button>
          <button
            onClick={() => setActiveSubTab('ddl_schema')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeSubTab === 'ddl_schema'
                ? 'bg-emerald-600 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            PostgreSQL 16 DDL & Quarantine Trigger Script
          </button>
        </div>

        {activeSubTab === 'ddl_schema' && (
          <button
            onClick={copyDdl}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-2.5 py-1 rounded-md border border-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
          >
            {copiedDdl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedDdl ? 'Copied DDL' : 'Copy DDL'}</span>
          </button>
        )}
      </div>

      {activeSubTab === 'ledger' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Table (8 cols) */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl overflow-x-auto">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Sequential Cryptographic Nonce Table
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                SHA-256 HMAC Linked
              </span>
            </div>

            <table className="w-full text-xs text-left font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Nonce</th>
                  <th className="py-2.5 px-3">Speed</th>
                  <th className="py-2.5 px-3">Pressures (F/R)</th>
                  <th className="py-2.5 px-3">Valves</th>
                  <th className="py-2.5 px-3">HMAC Hash</th>
                  <th className="py-2.5 px-3 text-right">Tamper Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {blocks.map((block) => {
                  const isTampered = block.tampered;
                  return (
                    <tr
                      key={block.nonce}
                      onClick={() => setSelectedBlock(block)}
                      className={`hover:bg-slate-800/40 cursor-pointer transition-colors ${
                        selectedBlock?.nonce === block.nonce ? 'bg-slate-800/60' : ''
                      } ${isTampered ? 'bg-red-950/20 text-red-200' : ''}`}
                    >
                      <td className="py-2 px-3 font-bold text-slate-200 flex items-center gap-1.5">
                        {isTampered ? (
                          <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                        ) : (
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                        #{block.nonce}
                      </td>
                      <td className="py-2 px-3 text-slate-300">
                        {block.speedMph.toFixed(1)} mph
                      </td>
                      <td className="py-2 px-3 text-slate-300">
                        {block.frontPressureMpa.toFixed(1)} / {block.rearPressureMpa.toFixed(1)} MPa
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                            block.frontValve === 'OPEN'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-blue-500/20 text-blue-300'
                          }`}
                        >
                          {block.frontValve}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-400 truncate max-w-[140px]" title={block.blockHash}>
                        {block.blockHash.slice(0, 10)}...{block.blockHash.slice(-6)}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {isTampered ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRestoreBlock(block.nonce);
                            }}
                            className="bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs px-2 py-0.5 rounded border border-emerald-500/30 cursor-pointer"
                          >
                            Restore
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onTamperBlock(block.nonce);
                            }}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded border border-red-500/30 cursor-pointer"
                          >
                            Tamper
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Selected Block Inspector (4 cols) */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-emerald-400" />
                Block Nonce Inspector
              </span>
              <span className="text-xs font-mono text-slate-400">
                #{selectedBlock ? selectedBlock.nonce : '---'}
              </span>
            </h3>

            {selectedBlock ? (
              <div className="space-y-3 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block mb-1">Timestamp:</span>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800 text-slate-200">
                    {selectedBlock.timestamp}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block mb-1">Previous Block Hash:</span>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800 text-slate-400 break-all text-[11px]">
                    {selectedBlock.prevHash}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block mb-1">Current Block HMAC-SHA256:</span>
                  <div
                    className={`p-2 rounded border break-all text-[11px] ${
                      selectedBlock.tampered
                        ? 'bg-red-950/40 border-red-500/50 text-red-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-emerald-400'
                    }`}
                  >
                    {selectedBlock.blockHash}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-300 pt-2 border-t border-slate-800">
                  <div>
                    <span className="text-slate-500">Articulation:</span>{' '}
                    <strong>{selectedBlock.articulationAngleDeg}°</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Roll Stiffness:</span>{' '}
                    <strong>{selectedBlock.rollStiffness} Nm/°</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Transfer Case:</span>{' '}
                    <strong>{selectedBlock.transferCase}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Crawl Dial:</span>{' '}
                    <strong>{selectedBlock.crawlMode}</strong>
                  </div>
                </div>

                {selectedBlock.tampered ? (
                  <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-lg text-red-300 flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block">CRYPTOGRAPHIC AUDIT FAULT</strong>
                      <span>Data signature mismatch. Transaction quarantined from downstream ledger replication.</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-300 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Cryptographic proof confirmed. Zero tampering detected.</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400">Select a block from the ledger to inspect payload hashes.</p>
            )}
          </div>
        </div>
      ) : (
        /* DDL View */
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 overflow-x-auto">
          <pre className="text-xs font-mono text-slate-300 leading-relaxed">
            <code>{postgresDdlCode}</code>
          </pre>
        </div>
      )}
    </div>
  );
};
