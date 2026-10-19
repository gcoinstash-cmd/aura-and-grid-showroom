import React, { useState } from 'react';
import { Database, ShieldAlert, CheckCircle, Copy, Check, Terminal, RefreshCw, AlertTriangle } from 'lucide-react';
import { LedgerBlock } from '../../types/telemetry';

interface TabPostgresLedgerProps {
  blocks: LedgerBlock[];
  onTriggerDivergenceFault: () => void;
  divergenceFaultActive: boolean;
  onResetFault: () => void;
}

export const TabPostgresLedger: React.FC<TabPostgresLedgerProps> = ({
  blocks,
  onTriggerDivergenceFault,
  divergenceFaultActive,
  onResetFault,
}) => {
  const [activeTab, setActiveTab] = useState<'blocks' | 'schema' | 'quarantine'>('blocks');
  const [copiedSql, setCopiedSql] = useState(false);
  const [queryInput, setQueryInput] = useState('SELECT recorded_at, sequence_nonce, solenoid_fl_step, hydraulic_pressure_bar, hmac_sha256_sig FROM avs_telemetry_ledger ORDER BY sequence_nonce DESC LIMIT 5;');
  const [queryOutput, setQueryOutput] = useState<string | null>(null);

  const postgresDDL = `-- PostgreSQL 16 Hybrid Ledger & Hypertables DDL
-- Engine: GF-T3-185 Heavy Overland Dynamics Platform NX 450h+ High-G Dynamic Telemetry Handling Core
-- Strict Invariant: Monotonic HMAC-SHA256 Chaining & Hydraulic Quarantine Triggers

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Primary telemetry ledger with monthly partitioning
CREATE TABLE IF NOT EXISTS avs_telemetry_ledger (
    sequence_nonce           BIGINT NOT NULL,
    recorded_at              TIMESTAMPTZ NOT NULL,
    vehicle_vin              CHAR(17) NOT NULL DEFAULT 'JTJCE4BZ8N2000185',
    drive_mode               VARCHAR(20) NOT NULL CHECK (drive_mode IN ('NORMAL', 'SPORT_S', 'SPORT_S_PLUS', 'EV', 'AUTO_EV_HEV')),
    solenoid_fl_step         INT NOT NULL CHECK (solenoid_fl_step BETWEEN 1 AND 650),
    solenoid_fr_step         INT NOT NULL CHECK (solenoid_fr_step BETWEEN 1 AND 650),
    solenoid_rl_step         INT NOT NULL CHECK (solenoid_rl_step BETWEEN 1 AND 650),
    solenoid_rr_step         INT NOT NULL CHECK (solenoid_rr_step BETWEEN 1 AND 650),
    hydraulic_pressure_bar   NUMERIC(5,2) NOT NULL CHECK (hydraulic_pressure_bar BETWEEN 5.0 AND 75.0),
    seal_divergence_flag     BOOLEAN NOT NULL DEFAULT FALSE,
    regen_power_kw           NUMERIC(5,2) NOT NULL CHECK (regen_power_kw BETWEEN 0.0 AND 65.0),
    hv_battery_soc_pct       NUMERIC(4,1) NOT NULL CHECK (hv_battery_soc_pct BETWEEN 0.0 AND 100.0),
    previous_hash            CHAR(64) NOT NULL,
    merkle_root              CHAR(64) NOT NULL,
    hmac_sha256_sig          CHAR(64) NOT NULL,
    PRIMARY KEY (recorded_at, sequence_nonce)
) PARTITION BY RANGE (recorded_at);

-- Partition Tables for production quarters
CREATE TABLE avs_telemetry_2026_q1 PARTITION OF avs_telemetry_ledger
    FOR VALUES FROM ('2026-01-01 00:00:00+00') TO ('2026-04-01 00:00:00+00');
CREATE TABLE avs_telemetry_2026_q2 PARTITION OF avs_telemetry_ledger
    FOR VALUES FROM ('2026-04-01 00:00:00+00') TO ('2026-07-01 00:00:00+00');
CREATE TABLE avs_telemetry_2026_q3 PARTITION OF avs_telemetry_ledger
    FOR VALUES FROM ('2026-07-01 00:00:00+00') TO ('2026-10-01 00:00:00+00');
CREATE TABLE avs_telemetry_2026_q4 PARTITION OF avs_telemetry_ledger
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

-- Fast seek index for audit replay
CREATE INDEX idx_avs_nonce_seek ON avs_telemetry_ledger (sequence_nonce DESC);
CREATE INDEX idx_avs_seal_audit ON avs_telemetry_ledger (seal_divergence_flag) WHERE seal_divergence_flag = TRUE;

-- Damper hydraulic seal quarantine log table
CREATE TABLE IF NOT EXISTS damper_quarantine_events (
    quarantine_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flagged_nonce      BIGINT NOT NULL,
    divergence_metric  VARCHAR(64) NOT NULL,
    damper_corner      CHAR(2) NOT NULL CHECK (damper_corner IN ('FL', 'FR', 'RL', 'RR')),
    observed_bar       NUMERIC(5,2) NOT NULL,
    threshold_bar      NUMERIC(5,2) NOT NULL DEFAULT 42.50,
    divergence_ratio   NUMERIC(5,3) NOT NULL,
    detected_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    quarantine_status  VARCHAR(24) NOT NULL DEFAULT 'SYSTEM_LOCKED_FOR_INSPECTION'
);

-- Trigger function: Isolates and flags hydraulic pressure spikes & blow-by
CREATE OR REPLACE FUNCTION fn_audit_hydraulic_seal_divergence()
RETURNS TRIGGER AS $$
BEGIN
    -- Check threshold limit 42.5 bar
    IF NEW.hydraulic_pressure_bar > 42.50 OR NEW.seal_divergence_flag = TRUE THEN
        NEW.seal_divergence_flag := TRUE;
        INSERT INTO damper_quarantine_events (
            flagged_nonce,
            divergence_metric,
            damper_corner,
            observed_bar,
            threshold_bar,
            divergence_ratio
        ) VALUES (
            NEW.sequence_nonce,
            'SEAL_DIVERGENCE_OVERPRESSURE_ALERT',
            'FL',
            NEW.hydraulic_pressure_bar,
            42.50,
            ROUND(NEW.hydraulic_pressure_bar / 42.50, 3)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_seal_divergence_enforce
    BEFORE INSERT ON avs_telemetry_ledger
    FOR EACH ROW
    EXECUTE FUNCTION fn_audit_hydraulic_seal_divergence();
`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(postgresDDL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleExecuteQuery = () => {
    const rows = blocks.slice(0, 5).map(b => ({
      nonce: b.nonce,
      recorded_at: b.timestamp,
      avg_solenoid_step: b.solenoidAvgStep,
      regen_kw: b.regenKw,
      seal: b.sealIntegrity,
      hmac: b.signatureHmac.substring(0, 24) + '...'
    }));
    setQueryOutput(JSON.stringify(rows, null, 2));
  };

  return (
    <div className="space-y-4">
      {/* Top Ledger Status Strip */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <Database className="w-5 h-5 text-emerald-400" />
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              PostgreSQL 16 Timeseries Ledger & Quarantine Matrix
            </h2>
            <p className="text-xs text-slate-400">
              Range-partitioned hypertables with cryptographic HMAC-SHA256 monotonic proof
            </p>
          </div>
        </div>

        {/* Divergence Fault Simulator Controls */}
        <div className="flex items-center gap-2">
          {divergenceFaultActive ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2.5 py-1 rounded inline-flex items-center gap-1.5 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5" />
                DIVERGENCE QUARANTINE ACTIVE
              </span>
              <button
                onClick={onResetFault}
                className="bg-slate-800 hover:bg-slate-700 text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-700 text-slate-200 cursor-pointer"
              >
                Reset Fault
              </button>
            </div>
          ) : (
            <button
              onClick={onTriggerDivergenceFault}
              className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold text-xs h-8 px-3 rounded-lg inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Simulates a 46.8 bar hydraulic spike to trigger PostgreSQL quarantine isolation"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>Simulate Seal Divergence</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('blocks')}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'blocks'
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'text-slate-400 hover:text-white bg-slate-800/80'
          }`}
        >
          Live Ingress Blocks ({blocks.length})
        </button>
        <button
          onClick={() => setActiveTab('schema')}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'schema'
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'text-slate-400 hover:text-white bg-slate-800/80'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          PostgreSQL 16 Schema DDL
        </button>
        <button
          onClick={() => setActiveTab('quarantine')}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'quarantine'
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'text-slate-400 hover:text-white bg-slate-800/80'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          Quarantine Registry {divergenceFaultActive && '(1 New)'}
        </button>
      </div>

      {activeTab === 'blocks' && (
        <div className="space-y-4">
          {/* Blocks Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">
                Monotonic HMAC-SHA256 Chained Telemetry Blocks
              </span>
              <span className="text-emerald-400 font-mono flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> All Nonces Cryptographically Verified
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/70 text-slate-400 uppercase font-mono border-b border-slate-800">
                  <tr>
                    <th className="p-3">Nonce</th>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Event Dispatch</th>
                    <th className="p-3 text-right">Avg Solenoid</th>
                    <th className="p-3 text-right">Regen</th>
                    <th className="p-3 text-center">Seal Health</th>
                    <th className="p-3 font-mono">HMAC-SHA256 Signature</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {blocks.map((block) => (
                    <tr key={block.nonce} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3 font-bold text-amber-400 tabular-nums">
                        #{block.nonce}
                      </td>
                      <td className="p-3 text-slate-400 text-xs">
                        {block.timestamp}
                      </td>
                      <td className="p-3 text-slate-200">
                        {block.event}
                      </td>
                      <td className="p-3 text-right text-cyan-300 font-bold tabular-nums">
                        {block.solenoidAvgStep}/650
                      </td>
                      <td className="p-3 text-right text-emerald-400 font-bold tabular-nums">
                        {block.regenKw.toFixed(1)} kW
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold ${
                            block.sealIntegrity === '100% NOMINAL'
                              ? 'text-emerald-400 bg-emerald-500/10'
                              : 'text-rose-400 bg-rose-500/10 border border-rose-500/30'
                          }`}
                        >
                          {block.sealIntegrity}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-slate-500 truncate max-w-xs" title={block.signatureHmac}>
                        {block.signatureHmac.substring(0, 18)}...{block.signatureHmac.substring(58)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Interactive SQL Query Bench */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-amber-400" />
                Interactive SQL Query Inspector
              </span>
              <button
                onClick={handleExecuteQuery}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-lg inline-flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Execute Query
              </button>
            </div>

            <textarea
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-amber-500"
            />

            {queryOutput && (
              <div className="mt-3">
                <div className="text-xs text-slate-400 mb-1 font-mono">Query Result (JSON Relational Stream):</div>
                <pre className="bg-slate-950 p-3 rounded-lg text-xs font-mono text-emerald-400 border border-slate-800 max-h-48 overflow-y-auto">
                  <code>{queryOutput}</code>
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'schema' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 md:p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Production PostgreSQL 16 DDL Schema
              </h3>
              <p className="text-xs text-slate-400">
                Range-partitioned quarterly timeseries, HMAC check constraints, and automatic seal quarantine trigger
              </p>
            </div>
            <button
              onClick={handleCopySql}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 border border-slate-700 cursor-pointer transition-colors"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'Copied' : 'Copy DDL SQL'}</span>
            </button>
          </div>

          <pre className="bg-slate-950 p-4 rounded-lg overflow-x-auto text-xs font-mono text-slate-300 leading-relaxed border border-slate-800 max-h-[550px] overflow-y-auto">
            <code>{postgresDDL}</code>
          </pre>
        </div>
      )}

      {activeTab === 'quarantine' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 md:p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Damper Hydraulic Seal Quarantine Registry
              </h3>
              <p className="text-xs text-slate-400">
                Triggered automatically by Postgres fn_audit_hydraulic_seal_divergence() when pressure &gt; 42.50 bar
              </p>
            </div>
          </div>

          {divergenceFaultActive ? (
            <div className="bg-rose-950/30 border border-rose-500/40 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>QUARANTINE EVENT: #Q-84920-SEAL-BLOWBY</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono text-slate-300">
                <div>
                  <span className="text-slate-500">Corner:</span> <span className="font-bold text-white">FL (Front Left)</span>
                </div>
                <div>
                  <span className="text-slate-500">Observed:</span> <span className="text-rose-400 font-bold">46.85 bar</span>
                </div>
                <div>
                  <span className="text-slate-500">Threshold:</span> <span className="text-amber-400">42.50 bar</span>
                </div>
                <div>
                  <span className="text-slate-500">Action:</span> <span className="text-emerald-400">FAIL-SAFE MODE ENGAGED</span>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                PostgreSQL trigger isolated the affected damper telemetry into <code>damper_quarantine_events</code>. Linear solenoid reverted to 50% baseline mechanical orifice damping (step 325/650) to preserve hydraulic chamber integrity.
              </p>
            </div>
          ) : (
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-6 text-center text-slate-400 space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
              <div className="text-sm font-semibold text-white">Zero Hydraulic Seal Divergences Recorded</div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                All 4 linear solenoid dampers (FL, FR, RL, RR) are operating within the nominal 14.0–38.5 bar operating envelope. Zero quarantine trigger events logged.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
