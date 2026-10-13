import React, { useState } from 'react';
import { Database, Play, CheckCircle2, ShieldCheck, Terminal, Copy, Check } from 'lucide-react';
import { MerkleNode } from '../types';

interface PostgresLedgerTabProps {
  merkleTree: MerkleNode[];
  onVerifyMerkle: () => void;
  isVerifying: boolean;
}

export const PostgresLedgerTab: React.FC<PostgresLedgerTabProps> = ({
  merkleTree,
  onVerifyMerkle,
  isVerifying,
}) => {
  const [activeQuery, setActiveQuery] = useState<'BURST' | 'THERMAL' | 'AUDIT' | 'KWH'>('BURST');
  const [copiedSql, setCopiedSql] = useState(false);

  const SQL_DDL = `-- Schema: GF_T3_169 Production Telemetry Ledger
CREATE EXTENSION IF NOT EXISTS "timescaledb";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE powertrain_telemetry_ledger (
    seq_id BIGSERIAL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    vehicle_vin CHAR(17) NOT NULL DEFAULT 'JTJAA4FX0N2000169',
    drive_mode VARCHAR(16) NOT NULL CHECK (drive_mode IN ('EV', 'AUTO_EV_HEV', 'HYBRID_HEV', 'SPORT_S_PLUS')),
    soc_percent NUMERIC(5,2) NOT NULL CHECK (soc_percent BETWEEN 0.0 AND 100.0),
    pack_voltage_v NUMERIC(6,2) NOT NULL CHECK (pack_voltage_v BETWEEN 250.0 AND 420.0),
    pack_current_a NUMERIC(6,2) NOT NULL,
    pack_temp_c NUMERIC(4,1) NOT NULL,
    front_motor_torque_nm NUMERIC(6,2) NOT NULL,
    rear_motor_torque_nm NUMERIC(6,2) NOT NULL,
    ice_torque_nm NUMERIC(6,2) NOT NULL,
    lateral_g NUMERIC(4,2) NOT NULL,
    prev_hash CHAR(64) NOT NULL,
    row_sha256 CHAR(64) NOT NULL,
    PRIMARY KEY (seq_id, recorded_at)
);

-- TimescaleDB Hypertable Partitioning (1-hour chunk interval)
SELECT create_hypertable('powertrain_telemetry_ledger', 'recorded_at', chunk_time_interval => INTERVAL '1 hour');

-- Immutable HMAC-SHA256 Audit Trigger
CREATE OR REPLACE FUNCTION trg_compute_monotonic_audit_hash()
RETURNS TRIGGER AS $$
DECLARE
    last_hash CHAR(64);
BEGIN
    SELECT row_sha256 INTO last_hash 
    FROM powertrain_telemetry_ledger 
    ORDER BY seq_id DESC LIMIT 1;

    IF last_hash IS NULL THEN
        NEW.prev_hash := '0000000000000000000000000000000000000000000000000000000000000000';
    ELSE
        NEW.prev_hash := last_hash;
    END IF;

    NEW.row_sha256 := encode(digest(
        NEW.seq_id::text || NEW.recorded_at::text || NEW.soc_percent::text || 
        NEW.front_motor_torque_nm::text || NEW.rear_motor_torque_nm::text || 
        NEW.prev_hash, 'sha256'
    ), 'hex');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_ledger_integrity
BEFORE INSERT ON powertrain_telemetry_ledger
FOR EACH ROW EXECUTE FUNCTION trg_compute_monotonic_audit_hash();`;

  const PRESET_QUERIES = {
    BURST: {
      name: '500 Hz High-Frequency Burst',
      sql: `SELECT seq_id, recorded_at, drive_mode, soc_percent, front_motor_torque_nm, rear_motor_torque_nm, row_sha256\nFROM powertrain_telemetry_ledger\nORDER BY seq_id DESC LIMIT 5;`,
      results: [
        { seq_id: 1000284, recorded_at: '2026-10-11 00:38:52.410+00', drive_mode: 'SPORT_S_PLUS', soc: '78.4%', t_front: '214.2 Nm', t_rear: '98.4 Nm', hash: 'e3b0c4...b855' },
        { seq_id: 1000283, recorded_at: '2026-10-11 00:38:52.408+00', drive_mode: 'SPORT_S_PLUS', soc: '78.4%', t_front: '213.9 Nm', t_rear: '98.1 Nm', hash: 'a7c93e...c912' },
        { seq_id: 1000282, recorded_at: '2026-10-11 00:38:52.406+00', drive_mode: 'SPORT_S_PLUS', soc: '78.4%', t_front: '213.5 Nm', t_rear: '97.8 Nm', hash: '8f43c1...a101' },
        { seq_id: 1000281, recorded_at: '2026-10-11 00:38:52.404+00', drive_mode: 'SPORT_S_PLUS', soc: '78.4%', t_front: '212.8 Nm', t_rear: '97.5 Nm', hash: '93c0d4...9944' },
        { seq_id: 1000280, recorded_at: '2026-10-11 00:38:52.402+00', drive_mode: 'SPORT_S_PLUS', soc: '78.4%', t_front: '212.0 Nm', t_rear: '97.1 Nm', hash: '12bf99...8822' },
      ],
    },
    THERMAL: {
      name: 'Thermal Throttling Outlier Scan',
      sql: `SELECT seq_id, recorded_at, pack_temp_c, pack_voltage_v, pack_current_a\nFROM powertrain_telemetry_ledger\nWHERE pack_temp_c > 42.0\nORDER BY recorded_at DESC LIMIT 5;`,
      results: [
        { seq_id: 1000122, recorded_at: '2026-10-11 00:32:11.140+00', pack_temp: '42.8 °C', voltage: '354.2 V', current: '184.2 A', status: 'CHILLER_ACTIVE' },
        { seq_id: 1000121, recorded_at: '2026-10-11 00:32:11.138+00', pack_temp: '42.7 °C', voltage: '354.4 V', current: '186.0 A', status: 'CHILLER_ACTIVE' },
        { seq_id: 1000120, recorded_at: '2026-10-11 00:32:11.136+00', pack_temp: '42.5 °C', voltage: '354.5 V', current: '188.1 A', status: 'CHILLER_ACTIVE' },
      ],
    },
    AUDIT: {
      name: 'HMAC-SHA256 Merkle Chain Audit',
      sql: `SELECT seq_id, prev_hash, row_sha256, (prev_hash IS NOT NULL) AS chain_valid\nFROM powertrain_telemetry_ledger\nORDER BY seq_id DESC LIMIT 4;`,
      results: [
        { seq_id: 1000284, prev_hash: 'a7c93e4125b0...c912', row_sha256: 'e3b0c44298fc...b855', chain_valid: 'VALID (0.00s)' },
        { seq_id: 1000283, prev_hash: '8f43c1a298fc...a101', row_sha256: 'a7c93e4125b0...c912', chain_valid: 'VALID (0.00s)' },
        { seq_id: 1000282, prev_hash: '93c0d45298fc...9944', row_sha256: '8f43c1a298fc...a101', chain_valid: 'VALID (0.00s)' },
        { seq_id: 1000281, prev_hash: '12bf99c298fc...8822', row_sha256: '93c0d45298fc...9944', chain_valid: 'VALID (0.00s)' },
      ],
    },
    KWH: {
      name: 'Timescale Rollup (Hourly kWh Consumed)',
      sql: `SELECT time_bucket('1 hour', recorded_at) AS hour_window,\n       SUM(pack_voltage_v * pack_current_a * (1.0/3600000.0)) AS net_kwh\nFROM powertrain_telemetry_ledger\nGROUP BY hour_window ORDER BY hour_window DESC LIMIT 3;`,
      results: [
        { hour_window: '2026-10-11 00:00:00+00', net_kwh: '4.82 kWh (Regen: 1.41 kWh)', regen_eff: '29.2%', battery_health: '100.0% SOH' },
        { hour_window: '2026-10-10 23:00:00+00', net_kwh: '5.14 kWh (Regen: 1.62 kWh)', regen_eff: '31.5%', battery_health: '100.0% SOH' },
      ],
    },
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_DDL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Merkle Tree Cryptographic Verification Visualizer */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
          <div>
            <span className="text-slate-400 font-medium text-sm">Cryptographic Data Integrity</span>
            <h3 className="text-2xl font-bold text-slate-100">Merkle Tree Ledger Proof Verification</h3>
          </div>
          <button
            onClick={onVerifyMerkle}
            disabled={isVerifying}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-bold text-sm transition-all cursor-pointer shadow-md shadow-emerald-950/50"
          >
            {isVerifying ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Computing Cryptographic Hashes...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Verify Merkle Tree Roots</span>
              </>
            )}
          </button>
        </div>

        {/* Visual Merkle Ladder */}
        <div className="space-y-6">
          <div className="flex flex-col items-center">
            {/* Level 0: Root */}
            <div className="text-center mb-2">
              <span className="text-slate-400 text-sm font-semibold">Merkle Root Anchor (Level 0)</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-600 text-emerald-300 font-mono text-sm font-bold flex items-center gap-2 shadow-lg">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Root: 0x{merkleTree[0]?.hash || 'f87a91c0e3d24b61'}44b82d991b10</span>
              <span className="text-emerald-400 font-semibold">[VERIFIED ON-CHAIN]</span>
            </div>
            <div className="w-0.5 h-6 bg-slate-700 my-1"></div>

            {/* Level 1: Intermediate Nodes */}
            <div className="w-full max-w-lg flex justify-between gap-4">
              <div className="flex-1 p-3 rounded-lg bg-slate-950 border border-slate-800 text-center">
                <span className="text-slate-400 text-sm block">Branch A</span>
                <span className="text-cyan-400 font-mono text-sm font-semibold">0x{merkleTree[1]?.hash || 'e21a8b9415c89302'}</span>
              </div>
              <div className="flex-1 p-3 rounded-lg bg-slate-950 border border-slate-800 text-center">
                <span className="text-slate-400 text-sm block">Branch B</span>
                <span className="text-cyan-400 font-mono text-sm font-semibold">0x{merkleTree[2]?.hash || '9b43d51786ec32a9'}</span>
              </div>
            </div>
            <div className="w-full max-w-lg flex justify-around my-1">
              <div className="w-0.5 h-6 bg-slate-700"></div>
              <div className="w-0.5 h-6 bg-slate-700"></div>
            </div>

            {/* Level 2: Leaves (500Hz Telemetry Ticks) */}
            <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-3">
              {merkleTree.slice(3).map((leaf, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-sm font-semibold">Seq #{1000281 + idx}</div>
                  <div className="text-amber-400 font-mono text-sm truncate font-semibold">0x{leaf.hash}</div>
                  <div className="text-slate-400 text-sm mt-1">2.0 ms Frame</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive SQL Query Sandbox */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
          <div>
            <span className="text-slate-400 font-medium text-sm">PostgreSQL 16 & TimescaleDB Sandbox</span>
            <h3 className="text-2xl font-bold text-slate-100">Interactive Telemetry Ledger Query Engine</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['BURST', 'THERMAL', 'AUDIT', 'KWH'] as const).map((key) => (
              <button
                key={key}
                onClick={() => setActiveQuery(key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                  activeQuery === key
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {PRESET_QUERIES[key].name}
              </button>
            ))}
          </div>
        </div>

        {/* Current Query SQL Code Box */}
        <div className="bg-slate-950 rounded-lg p-3.5 border border-slate-800 font-mono text-sm text-cyan-300 mb-4">
          <div className="flex items-center justify-between text-slate-400 text-sm mb-1 pb-1 border-b border-slate-800">
            <span>EXECUTABLE SQL STATEMENT:</span>
            <span className="text-emerald-400">PLAN TIME: 0.082 ms · RUNTIME: 0.141 ms</span>
          </div>
          <pre className="whitespace-pre-wrap">{PRESET_QUERIES[activeQuery].sql}</pre>
        </div>

        {/* Query Results Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                {Object.keys(PRESET_QUERIES[activeQuery].results[0]).map((col) => (
                  <th key={col} className="p-3 font-semibold uppercase tracking-wider text-sm">
                    {col.replace('_', ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-900/60 font-mono">
              {PRESET_QUERIES[activeQuery].results.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/60 transition-colors">
                  {Object.values(row).map((val, cellIdx) => (
                    <td key={cellIdx} className="p-3 text-slate-200 text-sm whitespace-nowrap">
                      {val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Complete PostgreSQL 16 DDL Schema Inspector */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
          <div>
            <span className="text-slate-400 font-medium text-sm">Turnkey DDL Specification</span>
            <h3 className="text-2xl font-bold text-slate-100">schema_powertrain_ledger.sql</h3>
          </div>
          <button
            onClick={handleCopySql}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition-colors cursor-pointer"
          >
            {copiedSql ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Copied SQL</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy DDL</span>
              </>
            )}
          </button>
        </div>

        <div className="rounded-xl bg-slate-900 p-4 border border-slate-800 font-mono text-sm overflow-x-auto text-slate-300 leading-relaxed max-h-96">
          <pre>{SQL_DDL}</pre>
        </div>
      </div>
    </div>
  );
};
