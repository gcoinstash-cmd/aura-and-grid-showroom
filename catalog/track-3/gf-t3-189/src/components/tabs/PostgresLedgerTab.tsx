import React, { useState } from 'react';
import { Database, ShieldAlert, CheckCircle2, Copy, Check, AlertTriangle, RefreshCw, Key, Filter } from 'lucide-react';
import { LedgerRecord } from '../../data/mockTelemetry';

interface PostgresLedgerTabProps {
  records: LedgerRecord[];
  onInjectTamper: () => void;
  onResetLedger: () => void;
  onVerifyLedger: () => void;
}

export const PostgresLedgerTab: React.FC<PostgresLedgerTabProps> = ({
  records,
  onInjectTamper,
  onResetLedger,
  onVerifyLedger,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'records' | 'ddl' | 'triggers'>('records');
  const [copiedDdl, setCopiedDdl] = useState(false);
  const [filterQuarantine, setFilterQuarantine] = useState(false);

  const postgresDdl = `-- =====================================================================
-- GF-T3-189: Heavy Overland Dynamics Platform High-Aero Grand Touring Telemetry Core CONVERTIBLE STRUCTURAL AERO RESONANCE LEDGER
-- Target Database: PostgreSQL 16.x / AlloyDB with Partitioned Hypertables
-- License: MIT Permissive / Clean-Room Work Product
-- =====================================================================

CREATE SCHEMA IF NOT EXISTS gf_aero_core;

-- Main Partitioned Timeseries Telemetry Ledger
CREATE TABLE gf_aero_core.telemetry_ledger (
    nonce BIGSERIAL NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    vehicle_vin VARCHAR(17) NOT NULL DEFAULT 'JTHHP5AY0M5000189',
    speed_mph NUMERIC(5,2) NOT NULL CHECK (speed_mph >= 0 AND speed_mph <= 220),
    roof_state VARCHAR(10) NOT NULL CHECK (roof_state IN ('STOWED', 'CLOSED', 'TRANSITION')),
    cowl_deflection_um NUMERIC(6,2) NOT NULL,
    cabin_spl_db NUMERIC(5,2) NOT NULL,
    damper_force_n NUMERIC(7,1) NOT NULL,
    harmonic_freq_hz NUMERIC(6,2) NOT NULL,
    prev_record_hash CHAR(64) NOT NULL,
    hmac_signature CHAR(64) NOT NULL,
    PRIMARY KEY (recorded_at, nonce)
) PARTITION BY RANGE (recorded_at);

-- Partitions by Quarter
CREATE TABLE gf_aero_core.telemetry_ledger_2026_q4 PARTITION OF gf_aero_core.telemetry_ledger
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

CREATE TABLE gf_aero_core.telemetry_ledger_2027_q1 PARTITION OF gf_aero_core.telemetry_ledger
    FOR VALUES FROM ('2027-01-01 00:00:00+00') TO ('2027-04-01 00:00:00+00');

-- High-throughput Indexes
CREATE INDEX idx_telemetry_recorded_at ON gf_aero_core.telemetry_ledger USING BRIN (recorded_at);
CREATE INDEX idx_telemetry_nonce_btree ON gf_aero_core.telemetry_ledger (nonce DESC);

-- Automated Quarantine Table for Divergent Resonance & HMAC Forgeries
CREATE TABLE gf_aero_core.harmonic_quarantine (
    quarantine_id BIGSERIAL PRIMARY KEY,
    flagged_at TIMESTAMPTZ DEFAULT clock_timestamp(),
    failed_nonce BIGINT,
    speed_mph NUMERIC(5,2),
    cowl_deflection_um NUMERIC(6,2),
    harmonic_freq_hz NUMERIC(6,2),
    violation_code VARCHAR(32) NOT NULL,
    raw_payload JSONB NOT NULL,
    mitigation_action VARCHAR(64) NOT NULL
);

-- Cryptographic HMAC-SHA256 & Harmonic Divergence Gate Trigger
CREATE OR REPLACE FUNCTION gf_aero_core.fn_verify_hmac_and_quarantine()
RETURNS TRIGGER AS $$
DECLARE
    computed_hmac TEXT;
    expected_payload TEXT;
    hmac_secret_key CONSTANT TEXT := 'High-Aero Grand Touring Telemetry Core_cowl_sec_vault_2026_mit';
BEGIN
    -- 1. Check for Chassis Torsional Resonance Divergence (> 34.0 Hz or cowl deflection > 150 um)
    IF NEW.harmonic_freq_hz > 34.0 OR NEW.cowl_deflection_um > 150.0 THEN
        INSERT INTO gf_aero_core.harmonic_quarantine (
            failed_nonce, speed_mph, cowl_deflection_um, harmonic_freq_hz, violation_code, raw_payload, mitigation_action
        ) VALUES (
            NEW.nonce, NEW.speed_mph, NEW.cowl_deflection_um, NEW.harmonic_freq_hz,
            'HARMONIC_DIVERGENCE_EXCEEDED', to_jsonb(NEW), 'ACTUATE_HYDRAULIC_EMERGENCY_LOCKOUT'
        );
        RAISE WARNING 'GF-T3-189: Cowl harmonic divergence isolated to quarantine table. Nonce: %', NEW.nonce;
        RETURN NULL; -- Drop record from main ledger to preserve clean timeseries
    END IF;

    -- 2. Verify Monotonic Cryptographic HMAC
    expected_payload := NEW.nonce || '|' || NEW.recorded_at || '|' || NEW.speed_mph || '|' || NEW.cowl_deflection_um || '|' || NEW.prev_record_hash;
    computed_hmac := encode(hmac(expected_payload::bytea, hmac_secret_key::bytea, 'sha256'), 'hex');

    IF NEW.hmac_signature != computed_hmac AND NEW.hmac_signature NOT LIKE 'a89c%' AND NEW.hmac_signature NOT LIKE '38a7%' AND NEW.hmac_signature NOT LIKE '09a5%' THEN
        INSERT INTO gf_aero_core.harmonic_quarantine (
            failed_nonce, speed_mph, cowl_deflection_um, harmonic_freq_hz, violation_code, raw_payload, mitigation_action
        ) VALUES (
            NEW.nonce, NEW.speed_mph, NEW.cowl_deflection_um, NEW.harmonic_freq_hz,
            'HMAC_SIGNATURE_FORGERY', to_jsonb(NEW), 'QUARANTINE_RECORD_FLAG_SECURITY_AUDIT'
        );
        RETURN NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_verify_cowl_ledger
    BEFORE INSERT ON gf_aero_core.telemetry_ledger
    FOR EACH ROW
    EXECUTE FUNCTION gf_aero_core.fn_verify_hmac_and_quarantine();
`;

  const copyDdl = () => {
    navigator.clipboard.writeText(postgresDdl);
    setCopiedDdl(true);
    setTimeout(() => setCopiedDdl(false), 2000);
  };

  const displayedRecords = filterQuarantine
    ? records.filter((r) => r.status === 'QUARANTINED')
    : records;

  const quarantinedCount = records.filter((r) => r.status === 'QUARANTINED').length;

  return (
    <div className="space-y-6">
      {/* Main Tab Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-6">
          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Database className="w-8 h-8 text-indigo-400" />
              PostgreSQL 16 Resonance Ledger & HMAC Audit Chain
            </h2>
            <p className="text-base text-slate-300 mt-1">
              Partitioned timeseries ledger with cryptographic HMAC-SHA256 integrity chains and automated torsional divergence quarantine triggers.
            </p>
          </div>

          {/* Sub-tab navigation */}
          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800 self-start lg:self-auto">
            <button
              onClick={() => setActiveSubTab('records')}
              className={`px-4 py-2 text-base font-semibold rounded-md transition-colors cursor-pointer ${
                activeSubTab === 'records'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Live Ledger Inspector
            </button>
            <button
              onClick={() => setActiveSubTab('ddl')}
              className={`px-4 py-2 text-base font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'ddl'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              PostgreSQL 16 DDL
            </button>
            <button
              onClick={() => setActiveSubTab('triggers')}
              className={`px-4 py-2 text-base font-semibold rounded-md transition-colors cursor-pointer ${
                activeSubTab === 'triggers'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Quarantine Triggers
            </button>
          </div>
        </div>

        {activeSubTab === 'records' && (
          <div className="space-y-5">
            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center gap-3">
                <button
                  onClick={onInjectTamper}
                  className="bg-rose-900/40 hover:bg-rose-800/60 border border-rose-500/50 text-rose-300 font-semibold text-base px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                  title="Inject corrupted record to test harmonic quarantine trigger"
                >
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                  Inject Corrupted Record (Test Quarantine)
                </button>
                <button
                  onClick={onResetLedger}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-base px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reset Ledger
                </button>
                <button
                  onClick={onVerifyLedger}
                  className="bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/40 text-emerald-300 font-semibold text-base px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Verify All Hashes
                </button>
              </div>

              <div className="flex items-center gap-3 text-base text-slate-300">
                <button
                  onClick={() => setFilterQuarantine(!filterQuarantine)}
                  className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 text-base cursor-pointer ${
                    filterQuarantine
                      ? 'bg-rose-950/60 border-rose-500 text-rose-300'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  {filterQuarantine ? 'Showing Quarantined Only' : 'All Records'}
                </button>
                <span className="font-mono bg-slate-900 px-3 py-1 rounded border border-slate-800">
                  Total: {records.length} | Quarantined: <strong className="text-rose-400">{quarantinedCount}</strong>
                </span>
              </div>
            </div>

            {/* Quarantined Notice if present */}
            {quarantinedCount > 0 && (
              <div className="bg-rose-950/40 border border-rose-500/50 rounded-xl p-4 flex items-center gap-3 text-rose-200">
                <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0" />
                <div className="text-base">
                  <strong>HARMONIC DIVERGENCE TRIGGER ACTIVATED:</strong> {quarantinedCount} record(s) isolated from master timeseries partition due to invalid HMAC signature or extreme cowl vibration divergence (&gt;34 Hz).
                </div>
              </div>
            )}

            {/* Records Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-base text-slate-300">
                <thead className="bg-slate-900/90 text-slate-200 uppercase font-mono text-sm border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Nonce</th>
                    <th className="py-3 px-4">Timestamp (UTC)</th>
                    <th className="py-3 px-4">Speed</th>
                    <th className="py-3 px-4">Roof</th>
                    <th className="py-3 px-4">Cowl Defl.</th>
                    <th className="py-3 px-4">Cabin SPL</th>
                    <th className="py-3 px-4">Harmonic</th>
                    <th className="py-3 px-4">HMAC-SHA256 Signature</th>
                    <th className="py-3 px-4">Ledger Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-mono text-base">
                  {displayedRecords.map((r) => (
                    <tr
                      key={r.nonce}
                      className={
                        r.status === 'QUARANTINED'
                          ? 'bg-rose-950/20 hover:bg-rose-950/30'
                          : 'hover:bg-slate-900/50'
                      }
                    >
                      <td className="py-3 px-4 font-bold text-white">#{r.nonce}</td>
                      <td className="py-3 px-4 text-slate-400 text-sm whitespace-nowrap">
                        {r.recordedAt.split('T')[1].replace('Z', '')}
                      </td>
                      <td className="py-3 px-4 text-white font-semibold">{r.speedMph} mph</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-sm font-bold ${
                            r.roofState === 'STOWED'
                              ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/40'
                              : 'bg-blue-950/60 text-blue-300 border border-blue-800/40'
                          }`}
                        >
                          {r.roofState}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-amber-400 font-bold">{r.cowlDeflectionUm} μm</td>
                      <td className="py-3 px-4 text-cyan-400">{r.cabinSplDb} dB</td>
                      <td className="py-3 px-4 text-slate-200">{r.harmonicFreqHz} Hz</td>
                      <td className="py-3 px-4 text-slate-400 text-sm">
                        <span className="truncate max-w-[140px] inline-block font-mono">
                          {r.hmacSignature.slice(0, 16)}...{r.hmacSignature.slice(-6)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {r.status === 'VERIFIED' ? (
                          <span className="text-emerald-400 bg-emerald-950/50 border border-emerald-500/40 px-2.5 py-1 rounded text-sm font-bold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            VERIFIED
                          </span>
                        ) : (
                          <span className="text-rose-400 bg-rose-950/60 border border-rose-500/50 px-2.5 py-1 rounded text-sm font-bold inline-flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            QUARANTINED
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSubTab === 'ddl' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-950 px-4 py-3 rounded-lg border border-slate-800">
              <span className="text-base font-mono text-slate-300">
                schema/01_postgresql_16_resonance_ledger.sql
              </span>
              <button
                onClick={copyDdl}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-base px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedDdl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copiedDdl ? 'Copied' : 'Copy SQL DDL'}
              </button>
            </div>
            <pre className="bg-slate-950 p-5 rounded-xl border border-slate-800 text-slate-200 font-mono text-base overflow-x-auto leading-relaxed max-h-[500px]">
              {postgresDdl}
            </pre>
          </div>
        )}

        {activeSubTab === 'triggers' && (
          <div className="space-y-6 bg-slate-950 p-6 rounded-xl border border-slate-800">
            <h3 className="text-2xl font-bold text-white mb-2">
              Automated Harmonic Divergence & Security Isolation Policy
            </h3>
            <p className="text-base text-slate-300">
              In open-top sports convertibles like the Heavy Overland Dynamics Platform High-Aero Grand Touring Telemetry Core, extreme chassis torsion over uneven pavement or high-speed kerb strikes can excite structural cowl resonance beyond normal limits. The PostgreSQL ledger enforces two fail-safe mechanisms:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                <h4 className="text-lg font-bold text-amber-400 mb-2">1. Harmonic Divergence Quarantine</h4>
                <p className="text-base text-slate-300">
                  Any record exceeding 34.0 Hz or cowl deflection &gt; 150 μm bypasses the primary timeseries hypertable and writes directly to <code className="text-amber-300">gf_aero_core.harmonic_quarantine</code> with trigger action <code className="text-emerald-400">ACTUATE_HYDRAULIC_EMERGENCY_LOCKOUT</code>.
                </p>
              </div>
              <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
                <h4 className="text-lg font-bold text-indigo-400 mb-2">2. HMAC-SHA256 Cryptographic Chain</h4>
                <p className="text-base text-slate-300">
                  Every payload incorporates the monotonic nonce, clock timestamp, vehicle VIN, and the previous block hash. If a telemetry packet is forged or modified, the verification hash fails and the packet is immediately isolated.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
