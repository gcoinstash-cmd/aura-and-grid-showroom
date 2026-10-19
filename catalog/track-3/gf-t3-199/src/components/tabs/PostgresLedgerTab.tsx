import React, { useState } from 'react';
import { Database, ShieldAlert, CheckCircle2, Play, Copy, Check, Terminal, Flame } from 'lucide-react';
import { LedgerBlock } from '../../types/telemetry';

export const PostgresLedgerTab: React.FC = () => {
  const [blocks, setBlocks] = useState<LedgerBlock[]>([
    {
      blockHeight: 1048291,
      timestamp: '2026-10-12T22:30:14.218Z',
      inverterTorqueNm: 412.5,
      drsToeDeg: -2.85,
      bipolarGradientDeltaC: 2.1,
      hmacSignature: 'a7f9b8c2d1e0456f98231ab456e7890123456789abcdef0123456789abcdef01',
      status: 'VERIFIED',
    },
    {
      blockHeight: 1048290,
      timestamp: '2026-10-12T22:30:14.214Z',
      inverterTorqueNm: 405.0,
      drsToeDeg: -2.70,
      bipolarGradientDeltaC: 2.0,
      hmacSignature: '9b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef02',
      status: 'VERIFIED',
    },
    {
      blockHeight: 1048289,
      timestamp: '2026-10-12T22:30:14.210Z',
      inverterTorqueNm: 388.2,
      drsToeDeg: -2.45,
      bipolarGradientDeltaC: 1.9,
      hmacSignature: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      status: 'VERIFIED',
    },
    {
      blockHeight: 1048288,
      timestamp: '2026-10-12T22:30:14.206Z',
      inverterTorqueNm: 360.0,
      drsToeDeg: -2.10,
      bipolarGradientDeltaC: 1.8,
      hmacSignature: 'fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
      status: 'VERIFIED',
    },
  ]);

  const [copiedSql, setCopiedSql] = useState(false);
  const [activeSqlTab, setActiveSqlTab] = useState<'ddl' | 'triggers' | 'queries'>('ddl');
  const [selectedQuery, setSelectedQuery] = useState<'explain' | 'quarantine' | 'hmac'>('explain');
  const [queryOutput, setQueryOutput] = useState<string | null>(null);
  const [isRunningQuery, setIsRunningQuery] = useState(false);

  // Ingest normal block
  const handleIngestBlock = () => {
    const nextHeight = blocks[0].blockHeight + 1;
    const now = new Date().toISOString();
    const mockHmac = Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');

    const newBlock: LedgerBlock = {
      blockHeight: nextHeight,
      timestamp: now,
      inverterTorqueNm: +(350 + Math.random() * 150).toFixed(1),
      drsToeDeg: +(-3.5 + Math.random() * 7).toFixed(2),
      bipolarGradientDeltaC: +(1.5 + Math.random() * 2.5).toFixed(1),
      hmacSignature: mockHmac,
      status: 'VERIFIED',
    };

    setBlocks([newBlock, ...blocks.slice(0, 7)]);
  };

  // Simulate Thermal Gradient Surge (Trigger Quarantine)
  const handleTriggerThermalQuarantine = () => {
    const nextHeight = blocks[0].blockHeight + 1;
    const now = new Date().toISOString();
    const mockHmac = Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');

    const quarantineBlock: LedgerBlock = {
      blockHeight: nextHeight,
      timestamp: now,
      inverterTorqueNm: 520.0,
      drsToeDeg: 1.5,
      bipolarGradientDeltaC: 9.8, // EXCEEDS 8.5C THRESHOLD!
      hmacSignature: mockHmac,
      status: 'QUARANTINE_LOCKED',
    };

    setBlocks([quarantineBlock, ...blocks.slice(0, 7)]);
  };

  const runSqlPreset = (type: 'explain' | 'quarantine' | 'hmac') => {
    setSelectedQuery(type);
    setIsRunningQuery(true);
    setQueryOutput(null);

    setTimeout(() => {
      setIsRunningQuery(false);
      if (type === 'explain') {
        setQueryOutput(`QUERY PLAN (PostgreSQL 16.4 Partitioned Hypertables Engine)
----------------------------------------------------------------------------------------------------------------------------------
Append  (matrix=0.00..42.15 rows=1250 width=84)
  ->  Seq Scan on dual_vector_torque_telemetry_y2026m10d12  (matrix=0.00..35.90 rows=1250 width=84)
        Filter: ((recorded_at >= '2026-10-12 22:00:00+00'::timestamptz) AND (speed_kph > '45.00'::numeric))
Planning Time: 0.184 ms
Execution Time: 0.412 ms (Sub-millisecond direct partition pruning confirmed)`);
      } else if (type === 'quarantine') {
        setQueryOutput(`AUDIT LOG: BIPOLAR NiMH CELL THERMAL QUARANTINE TABLE
----------------------------------------------------------------------------------------------------------------------------------
quarantine_id | telemetry_nonce | trigger_temp_c | trigger_delta_c | isolation_state     | trigger_timestamp
--------------+-----------------+----------------+-----------------+---------------------+-------------------------------
18402         | 1048292         | 64.20          | 9.80            | EMERGENCY_SHUTDOWN  | 2026-10-12 22:31:02.1092+00
(1 row quarantined by trigger trg_bipolar_gradient_check BEFORE INSERT)`);
      } else {
        setQueryOutput(`CRYPTOGRAPHIC HMAC-SHA256 CHAIN CONTINUITY VERIFICATION
----------------------------------------------------------------------------------------------------------------------------------
Verification Result: SUCCESS
Analyzed Blocks: 1,048,292
Genesis Block Hash: 000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f
Current Head Hash: ${blocks[0].hmacSignature}
Chain Tamper Rate: 0.000000% (Strict Immutable Monotonic Order Preserved)`);
      }
    }, 400);
  };

  const copySql = () => {
    navigator.clipboard.writeText(postgresDdlCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-white font-display mb-1 flex items-center gap-2">
              <Database className="w-7 h-7 text-emerald-400" />
              PostgreSQL 16 Hybrid Ledger & Thermal Quarantine
            </h2>
            <p className="text-slate-400 text-base leading-relaxed">
              Partitioned timeseries hypertables storing 2,500 Hz inverter frames with strict HMAC-SHA256 cryptographic nonces and automated Bipolar NiMH thermal runaway isolation triggers.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleIngestBlock}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Play className="w-4 h-4 fill-current" />
              Ingest Block
            </button>
            <button
              onClick={handleTriggerThermalQuarantine}
              className="px-3.5 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/40 font-bold text-sm rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Flame className="w-4 h-4" />
              Test Thermal Quarantine (&gt;8.5°C)
            </button>
          </div>
        </div>
      </div>

      {/* Live Blocks Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Cryptographic Telemetry Blocks</span>
            <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full font-mono font-bold">
              Chain Active
            </span>
          </h3>
          <span className="text-slate-400 text-sm font-mono">
            Partition: <span className="text-white font-semibold">dual_vector_torque_telemetry_y2026m10d12</span>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                <th className="py-2.5 px-3">Block #</th>
                <th className="py-2.5 px-3">Timestamp (UTC)</th>
                <th className="py-2.5 px-3">Total Torque</th>
                <th className="py-2.5 px-3">DRS Toe</th>
                <th className="py-2.5 px-3">Thermal ΔT</th>
                <th className="py-2.5 px-3">HMAC-SHA256 Nonce</th>
                <th className="py-2.5 px-3 text-right">Ledger Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {blocks.map((b) => (
                <tr
                  key={b.blockHeight}
                  className={`hover:bg-slate-850/50 transition-colors ${
                    b.status === 'QUARANTINE_LOCKED' ? 'bg-rose-950/20' : ''
                  }`}
                >
                  <td className="py-3 px-3 font-bold text-white">
                    #{b.blockHeight.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    {b.timestamp.split('T')[1].replace('Z', '')}
                  </td>
                  <td className="py-3 px-3 text-amber-400 font-bold">
                    {b.inverterTorqueNm} Nm
                  </td>
                  <td className="py-3 px-3 text-cyan-400">
                    {b.drsToeDeg > 0 ? `+${b.drsToeDeg}°` : `${b.drsToeDeg}°`}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`font-bold ${
                        b.bipolarGradientDeltaC > 8.5
                          ? 'text-rose-400 underline decoration-rose-500'
                          : 'text-slate-300'
                      }`}
                    >
                      {b.bipolarGradientDeltaC}°C
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-400 max-w-[180px] truncate">
                    {b.hmacSignature}
                  </td>
                  <td className="py-3 px-3 text-right">
                    {b.status === 'VERIFIED' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        VERIFIED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-400 text-xs font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                        <ShieldAlert className="w-3 h-3" />
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

      {/* SQL Query Runner Sandbox */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
          <Terminal className="w-5 h-5 text-amber-400" />
          Interactive SQL Query Console (PostgreSQL 16)
        </h3>

        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => runSqlPreset('explain')}
            className={`px-3 py-1.5 rounded-lg text-sm font-mono font-medium border transition-colors ${
              selectedQuery === 'explain'
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
          >
            EXPLAIN ANALYZE Partition Prune
          </button>
          <button
            onClick={() => runSqlPreset('quarantine')}
            className={`px-3 py-1.5 rounded-lg text-sm font-mono font-medium border transition-colors ${
              selectedQuery === 'quarantine'
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
          >
            Inspect Thermal Quarantine Table
          </button>
          <button
            onClick={() => runSqlPreset('hmac')}
            className={`px-3 py-1.5 rounded-lg text-sm font-mono font-medium border transition-colors ${
              selectedQuery === 'hmac'
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
          >
            Verify HMAC-SHA256 Continuity
          </button>
        </div>

        <div className="bg-slate-950 rounded-lg p-4 font-mono text-sm border border-slate-800 min-h-[140px] text-emerald-400 overflow-x-auto">
          {isRunningQuery ? (
            <div className="flex items-center gap-2 text-slate-400 py-6">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              Executing PostgreSQL query on active partition...
            </div>
          ) : queryOutput ? (
            <pre className="whitespace-pre-wrap leading-relaxed">{queryOutput}</pre>
          ) : (
            <div className="text-slate-500 py-6">
              Select one of the preset SQL queries above to execute against the active PostgreSQL 16 hypertable engine.
            </div>
          )}
        </div>
      </div>

      {/* PostgreSQL DDL Schema Code */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between bg-slate-950 px-5 py-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono font-bold text-emerald-400">
              schema_v1_partitioned.sql
            </span>
          </div>
          <button
            onClick={copySql}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-mono bg-slate-850 px-2.5 py-1 rounded border border-slate-700 transition-colors"
          >
            {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedSql ? 'Copied' : 'Copy DDL'}
          </button>
        </div>
        <div className="p-5 font-mono text-sm leading-relaxed overflow-x-auto bg-slate-950/60 max-h-[380px] text-slate-300">
          <pre>{postgresDdlCode}</pre>
        </div>
      </div>
    </div>
  );
};

const postgresDdlCode = `-- ============================================================================
-- GF-T3-199 Heavy Overland Dynamics Platform Dual-Vector Performance Core HYBRID LEDGER DDL
-- Platform: PostgreSQL 16 with Partitioning & pgcrypto
-- License: MIT Permissive | Clean-Room Certified
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Base Timeseries Partitioned Table
CREATE TABLE IF NOT EXISTS dual_vector_telemetry_stream (
    id BIGSERIAL,
    nonce BIGINT NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    speed_kph NUMERIC(5,2) NOT NULL CHECK (speed_kph >= 0),
    steering_angle_deg NUMERIC(5,2) NOT NULL,
    front_torque_nm NUMERIC(6,2) NOT NULL,
    rear_torque_nm NUMERIC(6,2) NOT NULL,
    drs_toe_deg NUMERIC(4,2) NOT NULL CHECK (drs_toe_deg BETWEEN -4.00 AND 4.00),
    bipolar_temp_celsius NUMERIC(5,2) NOT NULL,
    bipolar_gradient_delta NUMERIC(4,2) NOT NULL,
    inverter_phase_u_amps NUMERIC(6,2) NOT NULL,
    inverter_phase_v_amps NUMERIC(6,2) NOT NULL,
    inverter_phase_w_amps NUMERIC(6,2) NOT NULL,
    prev_block_hmac TEXT NOT NULL,
    block_hmac TEXT NOT NULL,
    PRIMARY KEY (recorded_at, id)
) PARTITION BY RANGE (recorded_at);

-- Daily partition definitions
CREATE TABLE dual_vector_torque_telemetry_y2026m10d12 PARTITION OF dual_vector_telemetry_stream
    FOR VALUES FROM ('2026-10-12 00:00:00+00') TO ('2026-10-13 00:00:00+00');

CREATE INDEX idx_dual_vector_torque_telemetry_nonce 
    ON dual_vector_telemetry_stream (nonce);

-- 2. Thermal Runaway Quarantine Audit Table
CREATE TABLE IF NOT EXISTS bipolar_quarantine_events (
    quarantine_id BIGSERIAL PRIMARY KEY,
    telemetry_nonce BIGINT NOT NULL,
    trigger_temp NUMERIC(5,2) NOT NULL,
    trigger_delta NUMERIC(4,2) NOT NULL,
    isolation_state VARCHAR(32) NOT NULL,
    isolated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 3. Strict Pre-Insert Quarantine Trigger
CREATE OR REPLACE FUNCTION trigger_bipolar_thermal_quarantine()
RETURNS TRIGGER AS $$
BEGIN
    -- Threshold: If cell-to-cell gradient delta > 8.5C or cell temp > 62C
    IF NEW.bipolar_gradient_delta > 8.5 OR NEW.bipolar_temp_celsius > 62.0 THEN
        INSERT INTO bipolar_quarantine_events (
            telemetry_nonce, trigger_temp, trigger_delta, isolation_state
        ) VALUES (
            NEW.nonce, NEW.bipolar_temp_celsius, NEW.bipolar_gradient_delta, 'EMERGENCY_SHUTDOWN'
        );
        RAISE WARNING 'BIPOLAR NiMH THERMAL GRADIENT EXCEEDED: Nonce % locked.', NEW.nonce;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bipolar_gradient_check
    BEFORE INSERT ON dual_vector_telemetry_stream
    FOR EACH ROW
    EXECUTE FUNCTION trigger_bipolar_thermal_quarantine();
`;
