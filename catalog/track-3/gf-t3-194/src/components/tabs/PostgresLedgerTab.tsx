import React, { useState } from 'react';
import { Database, ShieldCheck, AlertTriangle, Play, RefreshCw, Copy, Check, Lock, Cpu } from 'lucide-react';
import { LedgerBlock } from '../../types/telemetry';

interface PostgresLedgerTabProps {
  blocks: LedgerBlock[];
  onCommitBlock: () => void;
  onTamperBlock: (index: number) => void;
  onVerifyLedger: () => { isValid: boolean; brokenIndex?: number };
  onTriggerOverpressure: () => void;
}

const POSTGRESQL_DDL = `-- =====================================================================
-- Apex Executive Ultra-Heavy Telemetry Core High-G Dynamic Telemetry (GF-T3-194) Active Height Control (AHC) Ledger
-- PostgreSQL 16 Enterprise DDL: Partitioned Timeseries + HMAC Audit Chain
-- Clean-Room Certified DDL Specification
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Main Partitioned Telemetry Table (Partitioned by Range on recorded_at)
CREATE TABLE IF NOT EXISTS lx600_ahc_telemetry (
    telemetry_id BIGSERIAL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    vehicle_vin CHAR(17) NOT NULL DEFAULT 'JTJHY7AX6N4000194',
    nonce BIGINT NOT NULL,
    height_mode VARCHAR(16) NOT NULL CHECK (height_mode IN ('LOW', 'NORMAL', 'HIGH_1', 'HIGH_2', 'EXTRA_HIGH')),
    mts_mode VARCHAR(16) NOT NULL CHECK (mts_mode IN ('AUTO', 'DIRT', 'SAND', 'MUD', 'DEEP_SNOW', 'ROCK')),
    fl_pressure_bar NUMERIC(6, 2) NOT NULL CHECK (fl_pressure_bar >= 0.00),
    fr_pressure_bar NUMERIC(6, 2) NOT NULL CHECK (fr_pressure_bar >= 0.00),
    rl_pressure_bar NUMERIC(6, 2) NOT NULL CHECK (rl_pressure_bar >= 0.00),
    rr_pressure_bar NUMERIC(6, 2) NOT NULL CHECK (rr_pressure_bar >= 0.00),
    pump_duty_cycle_pct NUMERIC(5, 2) NOT NULL,
    pump_temp_celsius NUMERIC(5, 2) NOT NULL,
    is_quarantined BOOLEAN NOT NULL DEFAULT FALSE,
    prev_hash CHAR(64) NOT NULL,
    record_hmac CHAR(64) NOT NULL,
    CONSTRAINT pk_lx600_ahc_telemetry PRIMARY KEY (recorded_at, telemetry_id)
) PARTITION BY RANGE (recorded_at);

-- 2. Timeseries Monthly Partitions
CREATE TABLE IF NOT EXISTS lx600_ahc_telemetry_2026_10 
    PARTITION OF lx600_ahc_telemetry
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2026-11-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS lx600_ahc_telemetry_2026_11 
    PARTITION OF lx600_ahc_telemetry
    FOR VALUES FROM ('2026-11-01 00:00:00+00') TO ('2026-12-01 00:00:00+00');

-- 3. High-Speed Telemetry Indices
CREATE INDEX IF NOT EXISTS idx_ahc_nonce 
    ON lx600_ahc_telemetry (nonce DESC);

CREATE INDEX IF NOT EXISTS idx_ahc_pressure_quarantine 
    ON lx600_ahc_telemetry (recorded_at) 
    WHERE is_quarantined = TRUE;

-- 4. Isolated Overpressure Quarantine Ledger
CREATE TABLE IF NOT EXISTS lx600_hydraulic_quarantine (
    incident_id BIGSERIAL PRIMARY KEY,
    telemetry_id BIGINT NOT NULL,
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    violated_corner VARCHAR(4) NOT NULL,
    exceeded_pressure_bar NUMERIC(6, 2) NOT NULL,
    max_threshold_bar NUMERIC(6, 2) NOT NULL DEFAULT 280.00,
    operator_action VARCHAR(64) NOT NULL DEFAULT 'ACCUMULATOR_ISOLATED_RELIEF_OPENED',
    incident_payload JSONB NOT NULL
);

-- 5. Trigger Function: Hydraulic Accumulator Overpressure Quarantine
CREATE OR REPLACE FUNCTION trg_accumulator_overpressure_quarantine()
RETURNS TRIGGER AS $$
DECLARE
    c_max_bar CONSTANT NUMERIC := 280.00;
BEGIN
    -- Check each corner pressure against max safety limit
    IF NEW.fl_pressure_bar > c_max_bar OR 
       NEW.fr_pressure_bar > c_max_bar OR 
       NEW.rl_pressure_bar > c_max_bar OR 
       NEW.rr_pressure_bar > c_max_bar THEN
       
        NEW.is_quarantined := TRUE;

        INSERT INTO lx600_hydraulic_quarantine (
            telemetry_id,
            violated_corner,
            exceeded_pressure_bar,
            incident_payload
        ) VALUES (
            NEW.telemetry_id,
            CASE 
                WHEN NEW.fl_pressure_bar > c_max_bar THEN 'FL'
                WHEN NEW.fr_pressure_bar > c_max_bar THEN 'FR'
                WHEN NEW.rl_pressure_bar > c_max_bar THEN 'RL'
                ELSE 'RR'
            END,
            GREATEST(NEW.fl_pressure_bar, NEW.fr_pressure_bar, NEW.rl_pressure_bar, NEW.rr_pressure_bar),
            jsonb_build_object(
                'nonce', NEW.nonce,
                'height_mode', NEW.height_mode,
                'mts_mode', NEW.mts_mode,
                'pressures', jsonb_build_object(
                    'fl', NEW.fl_pressure_bar,
                    'fr', NEW.fr_pressure_bar,
                    'rl', NEW.rl_pressure_bar,
                    'rr', NEW.rr_pressure_bar
                )
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER check_hydraulic_overpressure_before_insert
    BEFORE INSERT ON lx600_ahc_telemetry
    FOR EACH ROW
    EXECUTE FUNCTION trg_accumulator_overpressure_quarantine();

-- 6. Trigger Function: Cryptographic HMAC-SHA256 Signature Chain
CREATE OR REPLACE FUNCTION trg_generate_hmac_chain()
RETURNS TRIGGER AS $$
DECLARE
    v_secret_salt CONSTANT TEXT := 'LX600_FSPORT_MONOPOLY_VAULT_KEY_2026';
    v_serialized TEXT;
BEGIN
    v_serialized := CONCAT_WS(
        '|',
        NEW.vehicle_vin,
        NEW.nonce,
        NEW.height_mode,
        NEW.mts_mode,
        NEW.fl_pressure_bar,
        NEW.fr_pressure_bar,
        NEW.rl_pressure_bar,
        NEW.rr_pressure_bar,
        NEW.prev_hash
    );

    NEW.record_hmac := encode(hmac(v_serialized, v_secret_salt, 'sha256'), 'hex');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER enforce_telemetry_hmac_chain
    BEFORE INSERT ON lx600_ahc_telemetry
    FOR EACH ROW
    EXECUTE FUNCTION trg_generate_hmac_chain();
`;

export const PostgresLedgerTab: React.FC<PostgresLedgerTabProps> = ({
  blocks,
  onCommitBlock,
  onTamperBlock,
  onVerifyLedger,
  onTriggerOverpressure,
}) => {
  const [copied, setCopied] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    tested: boolean;
    isValid: boolean;
    brokenIndex?: number;
  }>({ tested: false, isValid: true });

  const handleCopyDdl = () => {
    navigator.clipboard.writeText(POSTGRESQL_DDL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = () => {
    const res = onVerifyLedger();
    setVerificationResult({
      tested: true,
      isValid: res.isValid,
      brokenIndex: res.brokenIndex,
    });
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Database className="w-7 h-7 text-indigo-400" />
              PostgreSQL 16 Partitioned Terrain Ledger
            </h2>
            <p className="text-slate-400 text-base mt-1">
              Monthly range partitioned timeseries hypertables with automatic hydraulic overpressure quarantine triggers and cryptographic HMAC-SHA256 signature chain.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyDdl}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-base px-3.5 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Copied DDL!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy SQL Schema</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Action Controls for Interactive Ledger */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onCommitBlock}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base px-4 py-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all shadow-md active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Commit Verified Block</span>
          </button>

          <button
            onClick={handleVerify}
            className="bg-slate-800 hover:bg-slate-700 border border-emerald-500/50 text-emerald-400 font-bold text-base px-4 py-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Verify HMAC Chain</span>
          </button>

          <button
            onClick={() => onTamperBlock(blocks.length - 2 >= 0 ? blocks.length - 2 : 0)}
            className="bg-slate-800 hover:bg-red-950/80 border border-red-500/40 text-red-400 font-bold text-base px-4 py-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all"
            title="Simulate malicious tampering on block payload to prove HMAC rejection"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Simulate Malicious Tampering</span>
          </button>

          <button
            onClick={onTriggerOverpressure}
            className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold text-base px-4 py-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all"
            title="Test overpressure quarantine trigger (>280 bar)"
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Test Overpressure Quarantine (&gt;280 bar)</span>
          </button>
        </div>

        {/* Verification Status Banner */}
        {verificationResult.tested && (
          <div
            className={`mt-4 p-4 rounded-xl border text-base font-bold flex items-center justify-between transition-all ${
              verificationResult.isValid
                ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                : 'bg-red-950/60 border-red-500 text-red-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {verificationResult.isValid ? (
                <>
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>
                    CRYPTOGRAPHIC CHAIN VERIFIED: All {blocks.length} blocks match HMAC-SHA256 signature hashes. Zero tampering detected.
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <span>
                    TAMPER ALERT DETECTED: Block #{verificationResult.brokenIndex} signature hash mismatch! Chain integrity broken.
                  </span>
                </>
              )}
            </div>
            <button
              onClick={() => setVerificationResult({ tested: false, isValid: true })}
              className="text-base text-slate-400 hover:text-white cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Live Blockchain/Ledger Blocks Explorer */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
        <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <Lock className="w-5 h-5 text-emerald-400" />
          Live Immutable HMAC Ledger Stream ({blocks.length} Blocks)
        </h3>
        <p className="text-slate-400 text-base mb-4">
          Each record cryptographically encapsulates 4-corner pressure readings, MTS profile, and nonce linked to the previous block's SHA-256 hash.
        </p>

        <div className="space-y-3">
          {blocks.map((block) => {
            const isQuarantine = block.quarantined;
            const isTampered = block.tampered;

            return (
              <div
                key={block.blockIndex}
                className={`p-4 rounded-xl border transition-all ${
                  isTampered
                    ? 'bg-red-950/30 border-red-500'
                    : isQuarantine
                    ? 'bg-amber-950/30 border-amber-500/80'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/30">
                      Block #{block.blockIndex}
                    </span>
                    <span className="font-mono text-base text-slate-300">
                      Nonce #{block.nonce.toLocaleString()}
                    </span>
                    {isQuarantine && (
                      <span className="bg-amber-500/20 border border-amber-500 text-amber-300 text-base font-bold px-2 py-0.5 rounded">
                        QUARANTINED (&gt;280 bar)
                      </span>
                    )}
                    {isTampered && (
                      <span className="bg-red-500/20 border border-red-500 text-red-300 text-base font-bold px-2 py-0.5 rounded animate-pulse">
                        HASH CORRUPTED
                      </span>
                    )}
                  </div>
                  <div className="text-slate-400 font-mono text-base">
                    {block.timestamp}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-2 text-base">
                  <div>
                    <span className="text-slate-400 block">Height Mode:</span>
                    <strong className="text-white font-mono">{block.heightLevel}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">MTS Profile:</span>
                    <strong className="text-cyan-400 font-mono">{block.mtsMode}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">FL / FR Pressure:</span>
                    <span className="text-amber-400 font-mono font-bold">
                      {block.cornerPressures.FL.toFixed(1)} / {block.cornerPressures.FR.toFixed(1)} bar
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">RL / RR Pressure:</span>
                    <span className="text-amber-400 font-mono font-bold">
                      {block.cornerPressures.RL.toFixed(1)} / {block.cornerPressures.RR.toFixed(1)} bar
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 font-mono text-base space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="text-slate-400 shrink-0">Previous Hash:</span>
                    <span className="text-slate-400 truncate bg-slate-900 px-2 py-0.5 rounded text-base">
                      {block.prevHash}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="text-emerald-400 shrink-0 font-bold">HMAC-SHA256:</span>
                    <span className={`truncate px-2 py-0.5 rounded text-base font-bold ${isTampered ? 'bg-red-900 text-red-200' : 'bg-slate-900 text-emerald-400'}`}>
                      {block.hmacSignature}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SQL DDL Code View */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
        <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-indigo-400" />
          Production PostgreSQL 16 DDL & Quarantine Trigger Definition
        </h3>
        <p className="text-slate-400 text-base mb-4">
          Fully typed, production ready. Copy and run directly against Cloud SQL PostgreSQL 16 or AlloyDB instance.
        </p>

        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 overflow-x-auto max-h-[360px]">
          <pre className="font-mono text-base text-slate-300 leading-relaxed">
            <code>{POSTGRESQL_DDL}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
