import React, { useState, useEffect } from 'react';
import { Database, ShieldAlert, CheckCircle2, AlertTriangle, Copy, Check, RefreshCw, Flame, Lock } from 'lucide-react';
import { TelemetryBlock, computeHmacSha256, formatBlockHashPayload, verifyBlockHmac } from '../../utils/cryptoLedger';

interface TabPostgresLedgerProps {
  blocks: TelemetryBlock[];
  onAddBlock: (block: TelemetryBlock) => void;
  onTamperBlock: (index: number) => void;
  onResetLedger: () => void;
  isTampered: boolean;
}

export const TabPostgresLedger: React.FC<TabPostgresLedgerProps> = ({
  blocks,
  onAddBlock,
  onTamperBlock,
  onResetLedger,
  isTampered,
}) => {
  const [copiedSql, setCopiedSql] = useState(false);
  const [simDiffTemp, setSimDiffTemp] = useState(94.5);
  const [verificationResult, setVerificationResult] = useState<{
    valid: boolean;
    checkedCount: number;
    tamperedIndex?: number;
  } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const postgresDDL = `-- =====================================================================
-- POSTGRESQL 16 ENTERPRISE TELEMETRY LEDGER SCHEMA (GF-T3-193)
-- Strict Timeseries Range Partitioning, Differential Thermal Quarantine,
-- and Monotonic HMAC-SHA256 Signature Constraints
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Root Partitioned Table
CREATE TABLE telemetry_blocks (
    block_height BIGSERIAL,
    nonce BIGINT NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    rpm INTEGER NOT NULL CHECK (rpm >= 0 AND rpm <= 8500),
    throttle_pct NUMERIC(5,2) NOT NULL CHECK (throttle_pct >= 0 AND throttle_pct <= 100),
    manifold_pressure_kpa NUMERIC(6,2) NOT NULL,
    maf_flow_gps NUMERIC(6,2) NOT NULL,
    acoustic_valve_state VARCHAR(20) NOT NULL CHECK (acoustic_valve_state IN ('STAGE_1_CLOSED', 'STAGE_2_OPEN')),
    diff_oil_temp_c NUMERIC(5,2) NOT NULL,
    tbr_ratio NUMERIC(4,2) NOT NULL CHECK (tbr_ratio >= 1.00 AND tbr_ratio <= 3.50),
    left_wheel_rpm NUMERIC(7,2) NOT NULL,
    right_wheel_rpm NUMERIC(7,2) NOT NULL,
    yaw_moment_nm NUMERIC(7,2) NOT NULL,
    prev_hash CHAR(64) NOT NULL,
    hmac_signature CHAR(64) NOT NULL,
    block_status VARCHAR(30) NOT NULL DEFAULT 'COMMITTED',
    PRIMARY KEY (block_height, recorded_at)
) PARTITION BY RANGE (recorded_at);

-- Monthly Timeseries Partitions (Automated via pg_partman or DDL)
CREATE TABLE telemetry_blocks_y2026m10 PARTITION OF telemetry_blocks
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2026-11-01 00:00:00+00');

CREATE TABLE telemetry_blocks_y2026m11 PARTITION OF telemetry_blocks
    FOR VALUES FROM ('2026-11-01 00:00:00+00') TO ('2026-12-01 00:00:00+00');

-- High-Frequency Timeseries Indices
CREATE INDEX idx_telemetry_recorded_at ON telemetry_blocks (recorded_at DESC);
CREATE INDEX idx_telemetry_nonce ON telemetry_blocks (nonce);
CREATE INDEX idx_telemetry_status ON telemetry_blocks (block_status) WHERE block_status != 'COMMITTED';

-- Thermal Isolation Quarantine Audit Table
CREATE TABLE telemetry_security_quarantine (
    quarantine_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    block_height BIGINT NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL,
    diff_oil_temp_c NUMERIC(5,2) NOT NULL,
    quarantine_reason TEXT NOT NULL,
    operator_signature TEXT,
    audited_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Differential Oil Thermal Limit Trigger (> 135.0°C Torsen Safeguard)
CREATE OR REPLACE FUNCTION trg_torsen_oil_temp_quarantine_fn()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.diff_oil_temp_c > 135.0 THEN
        NEW.block_status := 'QUARANTINED_THERMAL_LIMIT';
        INSERT INTO telemetry_security_quarantine (
            block_height, recorded_at, diff_oil_temp_c, quarantine_reason
        ) VALUES (
            NEW.block_height,
            NEW.recorded_at,
            NEW.diff_oil_temp_c,
            'CRITICAL: Torsen differential oil temp ' || NEW.diff_oil_temp_c || 'C exceeds safe operating threshold (135.0C)'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_torsen_oil_temp_quarantine
    BEFORE INSERT ON telemetry_blocks
    FOR EACH ROW
    EXECUTE FUNCTION trg_torsen_oil_temp_quarantine_fn();
`;

  const copySql = () => {
    navigator.clipboard.writeText(postgresDDL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleVerifyChain = async () => {
    setIsVerifying(true);
    setVerificationResult(null);

    let allValid = true;
    let tamperedIdx: number | undefined = undefined;

    for (let i = 0; i < blocks.length; i++) {
      const isValid = await verifyBlockHmac(blocks[i]);
      if (!isValid) {
        allValid = false;
        tamperedIdx = i;
        break;
      }
    }

    setIsVerifying(false);
    setVerificationResult({
      valid: allValid,
      checkedCount: blocks.length,
      tamperedIndex: tamperedIdx,
    });
  };

  const handleInjectOverheatBlock = async () => {
    const lastBlock = blocks[0];
    const newHeight = lastBlock.blockHeight + 1;
    const newNonce = lastBlock.nonce + 1;
    const nowIso = new Date().toISOString();
    const temp = simDiffTemp;
    const status = temp > 135 ? 'QUARANTINED_THERMAL_LIMIT' : 'COMMITTED';

    const draftBlock: Omit<TelemetryBlock, 'hmacSignature'> = {
      blockHeight: newHeight,
      nonce: newNonce,
      timestamp: nowIso,
      rpm: 4200,
      throttlePct: 85.0,
      manifoldPressureKpa: 98.4,
      acousticValveState: 'STAGE_2_OPEN',
      diffOilTempC: temp,
      tbrRatio: 2.80,
      leftWheelRpm: 480.0,
      rightWheelRpm: 520.0,
      yawMomentNm: 340.0,
      prevHash: lastBlock.hmacSignature,
      status: status,
    };

    const signature = await computeHmacSha256(formatBlockHashPayload(draftBlock));
    onAddBlock({
      ...draftBlock,
      hmacSignature: signature,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-3">
          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Database className="w-8 h-8 text-emerald-400" />
              <span>PostgreSQL 16 Performance Ledger & Quarantine</span>
            </h2>
            <p className="text-base text-slate-400 mt-1">
              Range partitioned timeseries hypertables, cryptographic HMAC-SHA256 signature continuity, and automated Torsen oil temperature isolation (&gt;135°C).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleVerifyChain}
              disabled={isVerifying}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl inline-flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>{isVerifying ? 'Verifying...' : 'Verify Cryptographic Chain'}</span>
            </button>

            {isTampered ? (
              <button
                onClick={onResetLedger}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-sm rounded-xl inline-flex items-center gap-2 transition-colors"
              >
                <RefreshCw className="w-4 h-4 text-emerald-400" />
                <span>Restore Chain</span>
              </button>
            ) : (
              <button
                onClick={() => onTamperBlock(1)}
                className="px-4 py-2.5 bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-700/50 font-bold text-sm rounded-xl inline-flex items-center gap-2 transition-colors"
                title="Simulate unauthorized tampering of block data to test security detection"
              >
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span>Simulate Data Tamper</span>
              </button>
            )}
          </div>
        </div>

        {/* Verification Result Banner */}
        {verificationResult && (
          <div
            className={`p-4 rounded-xl border mt-4 flex items-start gap-3 ${
              verificationResult.valid
                ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
                : 'bg-red-950/40 border-red-500/50 text-red-200'
            }`}
          >
            {verificationResult.valid ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
            )}
            <div>
              <h4 className="text-base font-bold">
                {verificationResult.valid
                  ? `Cryptographic Audit Passed: All ${verificationResult.checkedCount} Blocks Verified`
                  : `Audit Breach Detected: HMAC Signature Mismatch on Block #${blocks[verificationResult.tamperedIndex!].blockHeight}`}
              </h4>
              <p className="text-sm mt-0.5 opacity-90">
                {verificationResult.valid
                  ? 'Every block height, monotonic nonce, and sensor payload mathematically matches its HMAC-SHA256 digest.'
                  : 'A historical sensor value was modified without the master HMAC private key. The cryptographic ledger prevented unauthorized mutation.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Thermal Quarantine Simulation */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            <h3 className="text-xl font-bold text-white">
              Differential Oil Temp Quarantine Trigger (&gt;135.0°C)
            </h3>
          </div>
          <span
            className={`text-sm font-mono font-bold px-3 py-1 rounded-full ${
              simDiffTemp > 135
                ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
            }`}
          >
            {simDiffTemp > 135 ? 'TRIGGER CONDITION: TRIPPED' : 'TRIGGER CONDITION: NORMAL'}
          </span>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 mb-4">
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="temp-slider" className="text-base font-bold text-slate-200">
              Simulated Torsen Differential Oil Temperature:
            </label>
            <span
              className={`text-2xl font-black font-mono tabular-nums ${
                simDiffTemp > 135 ? 'text-red-400 font-bold' : 'text-emerald-400'
              }`}
            >
              {simDiffTemp.toFixed(1)}°C
            </span>
          </div>
          <input
            id="temp-slider"
            type="range"
            min="60"
            max="165"
            step="0.5"
            value={simDiffTemp}
            onChange={(e) => setSimDiffTemp(Number(e.target.value))}
            className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-xs font-mono text-slate-500 mt-1.5">
            <span>60°C (Warm-up)</span>
            <span className="text-emerald-400 font-semibold">90°C–110°C (Track Nominal)</span>
            <span className="text-red-400 font-bold">▲ 135.0°C Quarantine Threshold</span>
            <span>165°C (Extreme)</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">
            Clicking commit inserts a new block. If temp &gt; 135°C, Postgres PL/pgSQL trigger quarantines block automatically into <code className="text-amber-300 font-mono">telemetry_security_quarantine</code>.
          </p>
          <button
            onClick={handleInjectOverheatBlock}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl shrink-0 transition-colors shadow-lg shadow-amber-500/20"
          >
            Commit Block with {simDiffTemp.toFixed(1)}°C
          </button>
        </div>
      </div>

      {/* Live Partitioned Ledger Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white">Live Monotonic Block Table</h3>
            <p className="text-sm text-slate-400">
              Showing active partition: <code className="text-slate-300 font-mono">telemetry_blocks_y2026m10</code>
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            {blocks.length} Blocks Cached
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
          <table className="w-full text-left text-sm font-mono">
            <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 text-xs">
              <tr>
                <th className="py-3 px-4">HEIGHT</th>
                <th className="py-3 px-4">NONCE</th>
                <th className="py-3 px-4">RPM</th>
                <th className="py-3 px-4">DIFF TEMP</th>
                <th className="py-3 px-4">TBR</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4">HMAC SIGNATURE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {blocks.slice(0, 7).map((b, idx) => (
                <tr
                  key={b.blockHeight}
                  className={`transition-colors hover:bg-slate-900/60 ${
                    b.status === 'QUARANTINED_THERMAL_LIMIT'
                      ? 'bg-red-950/20'
                      : b.status === 'CORRUPTED'
                      ? 'bg-amber-950/20'
                      : ''
                  }`}
                >
                  <td className="py-3 px-4 font-bold text-white">#{b.blockHeight}</td>
                  <td className="py-3 px-4 text-emerald-400">#{b.nonce.toLocaleString()}</td>
                  <td className="py-3 px-4 text-slate-200">{b.rpm}</td>
                  <td
                    className={`py-3 px-4 font-bold ${
                      b.diffOilTempC > 135 ? 'text-red-400' : 'text-slate-300'
                    }`}
                  >
                    {b.diffOilTempC.toFixed(1)}°C
                  </td>
                  <td className="py-3 px-4 text-indigo-300">{b.tbrRatio.toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold ${
                        b.status === 'COMMITTED'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : b.status === 'QUARANTINED_THERMAL_LIMIT'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-400 font-mono">
                    <span className="truncate block max-w-[220px]" title={b.hmacSignature}>
                      {b.hmacSignature.slice(0, 16)}...{b.hmacSignature.slice(-8)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PostgreSQL 16 DDL Viewer */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white">PostgreSQL 16 Production DDL</h3>
            <p className="text-sm text-slate-400">
              Clean-room schema with range partitions, triggers, and indices
            </p>
          </div>
          <button
            onClick={copySql}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm rounded-lg border border-slate-700 inline-flex items-center gap-1.5 transition-colors"
          >
            {copiedSql ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedSql ? 'Copied' : 'Copy SQL DDL'}</span>
          </button>
        </div>

        <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-emerald-400/90 overflow-x-auto max-h-[350px] leading-relaxed">
          <code>{postgresDDL}</code>
        </pre>
      </div>
    </div>
  );
};
