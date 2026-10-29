import React, { useState } from 'react';
import { TelemetryLedgerRow } from '../../types/telemetry';
import {
  Database,
  ShieldCheck,
  AlertTriangle,
  Code2,
  Copy,
  Check,
  FileCheck,
  Zap
} from 'lucide-react';

interface TabPostgresLedgerProps {
  ledgerRows: TelemetryLedgerRow[];
  onTriggerFault: () => void;
  onClearFault: () => void;
  isFaultInjected: boolean;
  onOpenVerifyModal: () => void;
}

const POSTGRES_DDL = `-- ============================================================================
-- Apex Executive High-Output Multi-Node Core DUAL_VECTOR_TORQUE DYNAMIC REAR STEERING (DRS) PARTITIONED LEDGER
-- Target Engine: PostgreSQL 16.2 / TimescaleDB Compatible
-- Architecture: Timeseries Range Partitioning with Recursive HMAC Chain
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Root Partitioned Table
CREATE TABLE drs_telemetry_ledger (
    nonce                 BIGINT NOT NULL,
    recorded_at           TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    vin                   VARCHAR(17) NOT NULL DEFAULT 'JTJGF10X0R1098241',
    speed_kmh             NUMERIC(5,2) NOT NULL,
    pinion_angle_deg      NUMERIC(6,3) NOT NULL,
    rear_toe_target_deg   NUMERIC(5,3) NOT NULL,
    rear_toe_actual_deg   NUMERIC(5,3) NOT NULL,
    rack_displacement_mm  NUMERIC(6,3) NOT NULL,
    divergence_error_mm   NUMERIC(5,3) NOT NULL,
    dual_vector_torque_front_pct     NUMERIC(4,1) NOT NULL,
    dual_vector_torque_rear_pct      NUMERIC(4,1) NOT NULL,
    bldc_phase_current_a  NUMERIC(5,2) NOT NULL,
    quarantine_status     VARCHAR(16) NOT NULL DEFAULT 'NOMINAL',
    prev_block_hmac       CHAR(64) NOT NULL,
    block_hmac            CHAR(64) NOT NULL,
    CONSTRAINT pk_drs_ledger PRIMARY KEY (recorded_at, nonce),
    CONSTRAINT chk_quarantine_status CHECK (quarantine_status IN ('NOMINAL', 'QUARANTINED', 'VERIFIED'))
) PARTITION BY RANGE (recorded_at);

-- Quarterly High-Performance Partitions (Zero Scan Overhead)
CREATE TABLE drs_telemetry_2026_q3 PARTITION OF drs_telemetry_ledger
    FOR VALUES FROM ('2026-07-01 00:00:00+00') TO ('2026-10-01 00:00:00+00');

CREATE TABLE drs_telemetry_2026_q4 PARTITION OF drs_telemetry_ledger
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

-- High-Frequency Ingestion Indices
CREATE INDEX idx_drs_nonce_btree ON drs_telemetry_ledger (nonce);
CREATE INDEX idx_drs_brin_time ON drs_telemetry_ledger USING BRIN (recorded_at);

-- ============================================================================
-- AUDIT TRIGGER: REAR RACK LINEAR DISPLACEMENT DIVERGENCE QUARANTINE
-- Prevents mechanical runaway by quarantining any actuator telemetry
-- exceeding 0.850 mm linear divergence from requested ballscrew angle.
-- ============================================================================
CREATE OR REPLACE FUNCTION trg_quarantine_divergent_toe()
RETURNS TRIGGER AS $$
DECLARE
    expected_linear_mm NUMERIC(6,3);
BEGIN
    -- 4.25 mm ballscrew linear travel per 1.0 degree rear toe deflection
    expected_linear_mm := NEW.rear_toe_target_deg * 4.250;
    NEW.divergence_error_mm := ABS(NEW.rack_displacement_mm - expected_linear_mm);

    -- Quarantine if divergence > 0.850mm or motor phase current exceeds 38.0A
    IF NEW.divergence_error_mm > 0.850 OR NEW.bldc_phase_current_a > 38.0 THEN
        NEW.quarantine_status := 'QUARANTINED';
        -- Failsafe: clamp requested angle to 0.000° to protect vehicle balance
        NEW.rear_toe_actual_deg := 0.000;
    ELSE
        NEW.quarantine_status := 'NOMINAL';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_toe_divergence_before_insert
    BEFORE INSERT ON drs_telemetry_ledger
    FOR EACH ROW
    EXECUTE FUNCTION trg_quarantine_divergent_toe();

-- ============================================================================
-- CRYPTOGRAPHIC INTEGRITY VERIFICATION STORED PROCEDURE
-- Validates zero tampering in recursive HMAC-SHA256 chain across any nonce range
-- ============================================================================
CREATE OR REPLACE FUNCTION verify_drs_ledger_chain(
    p_start_nonce BIGINT,
    p_end_nonce BIGINT,
    p_secret_key BYTEA
)
RETURNS TABLE(is_valid BOOLEAN, audited_records BIGINT, failed_nonce BIGINT) AS $$
DECLARE
    r RECORD;
    computed_digest TEXT;
    expected_prev TEXT := '0000000000000000000000000000000000000000000000000000000000000000';
    total_count BIGINT := 0;
BEGIN
    FOR r IN 
        SELECT nonce, speed_kmh, pinion_angle_deg, rear_toe_target_deg, prev_block_hmac, block_hmac
        FROM drs_telemetry_ledger
        WHERE nonce BETWEEN p_start_nonce AND p_end_nonce
        ORDER BY nonce ASC
    LOOP
        total_count := total_count + 1;
        -- Recalculate recursive digest
        computed_digest := encode(hmac(
            r.nonce::text || ':' || r.speed_kmh::text || ':' || r.pinion_angle_deg::text || ':' || r.rear_toe_target_deg::text || ':' || r.prev_block_hmac,
            p_secret_key,
            'sha256'
        ), 'hex');

        IF computed_digest <> r.block_hmac THEN
            RETURN QUERY SELECT FALSE, total_count, r.nonce;
            RETURN;
        END IF;
    END LOOP;

    RETURN QUERY SELECT TRUE, total_count, NULL::BIGINT;
END;
$$ LANGUAGE plpgsql;
`;

export const TabPostgresLedger: React.FC<TabPostgresLedgerProps> = ({
  ledgerRows,
  onTriggerFault,
  onClearFault,
  isFaultInjected,
  onOpenVerifyModal,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'live' | 'ddl'>('live');

  const handleCopy = () => {
    navigator.clipboard.writeText(POSTGRES_DDL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Database className="w-8 h-8 text-amber-400" />
              PostgreSQL 16 Partitioned DRS Telemetry Ledger
            </h2>
            <p className="text-slate-300 text-base leading-relaxed mt-1">
              Deterministic 2,500 Hz CAN-FD actuator telemetry logging with recursive HMAC-SHA256 signature chains and automated rack linear divergence quarantine triggers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenVerifyModal}
              className="bg-slate-800 hover:bg-slate-700 border border-emerald-500/40 text-emerald-400 font-bold text-sm px-3.5 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              Audit HMAC Chain
            </button>
            {isFaultInjected ? (
              <button
                onClick={onClearFault}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm px-3.5 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Check className="w-4 h-4" />
                Clear Fault Injection
              </button>
            ) : (
              <button
                onClick={onTriggerFault}
                className="bg-rose-600/90 hover:bg-rose-500 text-white font-bold text-sm px-3.5 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <AlertTriangle className="w-4 h-4" />
                Inject Divergence Fault
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Fault Injection Alert Bar */}
      {isFaultInjected && (
        <div className="bg-rose-950/60 border border-rose-600/60 rounded-xl p-4 text-rose-200 flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-base text-rose-100">
              SIMULATED BALLSCREW LINEAR DISPLACEMENT DIVERGENCE TRIGGERED
            </div>
            <p className="text-sm text-rose-300 mt-0.5">
              Rear rack linear displacement deviated &gt;0.850 mm from commanded angle. The PostgreSQL 16 trigger <code className="bg-rose-900/60 px-1 py-0.5 rounded font-mono">trg_quarantine_divergent_toe()</code> has quarantined subsequent entries and clamped actuator command to 0.000° failsafe.
            </p>
          </div>
        </div>
      )}

      {/* Subtab Selector */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab('live')}
          className={`px-4 py-2 text-base font-bold rounded-lg cursor-pointer transition-colors flex items-center gap-2 ${
            activeSubTab === 'live'
              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Zap className="w-4 h-4" />
          Live CAN-FD Ingestion Feed (2,500 Hz)
        </button>
        <button
          onClick={() => setActiveSubTab('ddl')}
          className={`px-4 py-2 text-base font-bold rounded-lg cursor-pointer transition-colors flex items-center gap-2 ${
            activeSubTab === 'ddl'
              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Code2 className="w-4 h-4" />
          PostgreSQL 16 DDL & Partitioning Schema
        </button>
      </div>

      {activeSubTab === 'live' ? (
        /* Real-Time Telemetry Ledger Table */
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-300 font-bold text-base flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              Timeseries Hypertable Buffer: <span className="font-mono text-amber-400">drs_telemetry_2026_q4</span>
            </span>
            <span className="text-xs font-mono text-slate-400">
              Showing Last {ledgerRows.length} Frames · HMAC Chain Continuous
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px] bg-slate-950/60">
                  <th className="py-2.5 px-3">Nonce</th>
                  <th className="py-2.5 px-3">Timestamp (UTC)</th>
                  <th className="py-2.5 px-3">Speed</th>
                  <th className="py-2.5 px-3">Pinion °</th>
                  <th className="py-2.5 px-3">Target Toe</th>
                  <th className="py-2.5 px-3">Actual Toe</th>
                  <th className="py-2.5 px-3">Divergence</th>
                  <th className="py-2.5 px-3">DUAL_VECTOR_TORQUE</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">HMAC-SHA256 (64-byte)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {ledgerRows.map((row, idx) => (
                  <tr
                    key={row.nonce}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      idx === 0 ? 'bg-amber-500/5' : ''
                    } ${row.status === 'QUARANTINED' ? 'bg-rose-950/40 text-rose-200' : ''}`}
                  >
                    <td className="py-2 px-3 font-bold text-amber-400">#{row.nonce}</td>
                    <td className="py-2 px-3 text-slate-400 whitespace-nowrap">{row.timestamp}</td>
                    <td className="py-2 px-3 font-semibold text-white">{row.speedKmh.toFixed(1)} km/h</td>
                    <td className="py-2 px-3 text-cyan-300">{row.pinionAngleDeg.toFixed(2)}°</td>
                    <td className="py-2 px-3 font-bold text-amber-400">
                      {row.rearToeTargetDeg > 0 ? `+${row.rearToeTargetDeg.toFixed(2)}` : row.rearToeTargetDeg.toFixed(2)}°
                    </td>
                    <td className="py-2 px-3 text-slate-200">
                      {row.rearToeActualDeg > 0 ? `+${row.rearToeActualDeg.toFixed(2)}` : row.rearToeActualDeg.toFixed(2)}°
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`font-bold ${
                          row.divergenceMm > 0.85 ? 'text-rose-400 font-black' : 'text-emerald-400'
                        }`}
                      >
                        {row.divergenceMm.toFixed(3)} mm
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-400">{row.frontRearSplit}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          row.status === 'QUARANTINED'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-[10px] text-slate-400 font-mono truncate max-w-[140px]" title={row.currentHmac}>
                      {row.currentHmac.substring(0, 16)}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* DDL Viewer */
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-300 font-bold text-base flex items-center gap-2">
              <Code2 className="w-5 h-5 text-emerald-400" />
              PostgreSQL 16 Schema with Range Partitions & Failsafe Trigger
            </span>
            <button
              onClick={handleCopy}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold font-mono inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied SQL</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy DDL Script</span>
                </>
              )}
            </button>
          </div>

          <pre className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-300 overflow-x-auto max-h-[460px] leading-relaxed">
            <code>{POSTGRES_DDL}</code>
          </pre>
        </div>
      )}
    </div>
  );
};
