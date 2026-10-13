import React, { useState } from 'react';
import {
  Database,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Copy,
  Check,
  AlertTriangle,
  Play,
  RotateCcw,
  Lock,
  Layers,
  Battery
} from 'lucide-react';
import { TelemetryFrame, LedgerBlock } from '../../types/telemetry';

interface PostgresLedgerTabProps {
  frame: TelemetryFrame;
  onUpdateCellSpread: (spreadMv: number) => void;
}

export const PostgresLedgerTab: React.FC<PostgresLedgerTabProps> = ({
  frame,
  onUpdateCellSpread,
}) => {
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeView, setActiveView] = useState<'explorer' | 'schema' | 'query'>('explorer');
  const [simulatedQuery, setSimulatedQuery] = useState(
    'SELECT nonce, road_surface, rear_torque_nm, cell_spread_mv, is_quarantined FROM vehicle_telemetry_frames_2026_m10 ORDER BY nonce DESC LIMIT 5;'
  );
  const [queryOutput, setQueryOutput] = useState<string | null>(null);

  // Initial mock blocks for the interactive chain explorer
  const [blocks, setBlocks] = useState<LedgerBlock[]>([
    {
      id: 1,
      nonce: 1000005,
      timestamp: '2026-10-11T22:45:00.454Z',
      cellSpreadMv: frame.cellVoltageSpreadMv,
      rearTorqueNm: frame.rearMotorTorqueNm,
      torqueSplit: `${frame.frontTorquePercent.toFixed(0)}:${frame.rearTorquePercent.toFixed(0)}`,
      status: frame.quarantineTriggered ? 'QUARANTINE_ALERT' : 'NOMINAL',
      prevHash: '6d9f8b4172a084bc3e811c7fa82f420e6a88b50201dc93847aa1f868019312b0',
      blockHash: 'a89c42de310864ba153b3dcf06540c9462f48386dc072d6819ebf41d3b5d259c',
      hmac: '7e23a412f864e6291d9b3e150fca7a20c45b736746cf6173a11885627f12e841',
    },
    {
      id: 2,
      nonce: 1000004,
      timestamp: '2026-10-11T22:45:00.000Z',
      cellSpreadMv: 18.2,
      rearTorqueNm: 45.0,
      torqueSplit: '50:50',
      status: 'NOMINAL',
      prevHash: 'bf916c043e0984a141a238e8331fa946ef2256da61b36d39d9361ea870a4a9c1',
      blockHash: '6d9f8b4172a084bc3e811c7fa82f420e6a88b50201dc93847aa1f868019312b0',
      hmac: '38a16db48f07b140cc5c3459c381a340798363a0a67e416801f41b3df5e902b7',
    },
    {
      id: 3,
      nonce: 1000003,
      timestamp: '2026-10-11T22:44:59.546Z',
      cellSpreadMv: 17.8,
      rearTorqueNm: 78.4,
      torqueSplit: '20:80',
      status: 'NOMINAL',
      prevHash: '19fa830bb4298dce41829e28fa0318c50401b52a466f2095f32998a1fca82d33',
      blockHash: 'bf916c043e0984a141a238e8331fa946ef2256da61b36d39d9361ea870a4a9c1',
      hmac: '849d7c2a4128f1e56b4f7380cd49a215386cf20a89b52a16d8a7c49301e828aa',
    },
    {
      id: 4,
      nonce: 1000002,
      timestamp: '2026-10-11T22:44:59.092Z',
      cellSpreadMv: 16.5,
      rearTorqueNm: 84.0,
      torqueSplit: '20:80',
      status: 'NOMINAL',
      prevHash: '5e4129b0f48a9726dc8319f3014a6839d4817a26fba83416c1482f3a18a994ef',
      blockHash: '19fa830bb4298dce41829e28fa0318c50401b52a466f2095f32998a1fca82d33',
      hmac: '91f63ac945e8b012354c4187ef2489a7123957bf8490a612d7c58e391b4092bc',
    },
    {
      id: 5,
      nonce: 1000001,
      timestamp: '2026-10-11T22:44:58.638Z',
      cellSpreadMv: 16.1,
      rearTorqueNm: 60.0,
      torqueSplit: '40:60',
      status: 'NOMINAL',
      prevHash: '0000000000000000000000000000000000000000000000000000000000000000',
      blockHash: '5e4129b0f48a9726dc8319f3014a6839d4817a26fba83416c1482f3a18a994ef',
      hmac: 'a40f81d45c9284ba5618793081e7d23f819438fa723bc4501a92358fd9401826',
    },
  ]);

  const [chainTampered, setChainTampered] = useState(false);

  const handleSimulateTamper = () => {
    setBlocks(prev =>
      prev.map(b => {
        if (b.nonce === 1000003) {
          return {
            ...b,
            rearTorqueNm: 999.9, // Tampered data
            blockHash: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
            status: 'CHAIN_TAMPERED',
            tampered: true,
          };
        }
        if (b.nonce === 1000004 || b.nonce === 1000005) {
          return {
            ...b,
            status: 'CHAIN_TAMPERED',
            tampered: true,
          };
        }
        return b;
      })
    );
    setChainTampered(true);
  };

  const handleRestoreChain = () => {
    setBlocks([
      {
        id: 1,
        nonce: 1000005,
        timestamp: '2026-10-11T22:45:00.454Z',
        cellSpreadMv: frame.cellVoltageSpreadMv,
        rearTorqueNm: frame.rearMotorTorqueNm,
        torqueSplit: `${frame.frontTorquePercent.toFixed(0)}:${frame.rearTorquePercent.toFixed(0)}`,
        status: frame.quarantineTriggered ? 'QUARANTINE_ALERT' : 'NOMINAL',
        prevHash: '6d9f8b4172a084bc3e811c7fa82f420e6a88b50201dc93847aa1f868019312b0',
        blockHash: 'a89c42de310864ba153b3dcf06540c9462f48386dc072d6819ebf41d3b5d259c',
        hmac: '7e23a412f864e6291d9b3e150fca7a20c45b736746cf6173a11885627f12e841',
      },
      {
        id: 2,
        nonce: 1000004,
        timestamp: '2026-10-11T22:45:00.000Z',
        cellSpreadMv: 18.2,
        rearTorqueNm: 45.0,
        torqueSplit: '50:50',
        status: 'NOMINAL',
        prevHash: 'bf916c043e0984a141a238e8331fa946ef2256da61b36d39d9361ea870a4a9c1',
        blockHash: '6d9f8b4172a084bc3e811c7fa82f420e6a88b50201dc93847aa1f868019312b0',
        hmac: '38a16db48f07b140cc5c3459c381a340798363a0a67e416801f41b3df5e902b7',
      },
      {
        id: 3,
        nonce: 1000003,
        timestamp: '2026-10-11T22:44:59.546Z',
        cellSpreadMv: 17.8,
        rearTorqueNm: 78.4,
        torqueSplit: '20:80',
        status: 'NOMINAL',
        prevHash: '19fa830bb4298dce41829e28fa0318c50401b52a466f2095f32998a1fca82d33',
        blockHash: 'bf916c043e0984a141a238e8331fa946ef2256da61b36d39d9361ea870a4a9c1',
        hmac: '849d7c2a4128f1e56b4f7380cd49a215386cf20a89b52a16d8a7c49301e828aa',
      },
      {
        id: 4,
        nonce: 1000002,
        timestamp: '2026-10-11T22:44:59.092Z',
        cellSpreadMv: 16.5,
        rearTorqueNm: 84.0,
        torqueSplit: '20:80',
        status: 'NOMINAL',
        prevHash: '5e4129b0f48a9726dc8319f3014a6839d4817a26fba83416c1482f3a18a994ef',
        blockHash: '19fa830bb4298dce41829e28fa0318c50401b52a466f2095f32998a1fca82d33',
        hmac: '91f63ac945e8b012354c4187ef2489a7123957bf8490a612d7c58e391b4092bc',
      },
      {
        id: 5,
        nonce: 1000001,
        timestamp: '2026-10-11T22:44:58.638Z',
        cellSpreadMv: 16.1,
        rearTorqueNm: 60.0,
        torqueSplit: '40:60',
        status: 'NOMINAL',
        prevHash: '0000000000000000000000000000000000000000000000000000000000000000',
        blockHash: '5e4129b0f48a9726dc8319f3014a6839d4817a26fba83416c1482f3a18a994ef',
        hmac: 'a40f81d45c9284ba5618793081e7d23f819438fa723bc4501a92358fd9401826',
      },
    ]);
    setChainTampered(false);
  };

  const handleExecuteQuery = () => {
    setQueryOutput(`-- Query execution successful (took 0.42ms)
-- Rows returned: 5
┌─────────┬──────────────┬────────────────┬────────────────┬─────────────────┐
│  nonce  │ road_surface │ rear_torque_nm │ cell_spread_mv │ is_quarantined  │
├─────────┼──────────────┼────────────────┼────────────────┼─────────────────┤
│ 1000005 │ dry_asphalt  │          ${frame.rearMotorTorqueNm.toFixed(1).padEnd(5)} │          ${frame.cellVoltageSpreadMv.toFixed(1).padEnd(5)} │ ${frame.quarantineTriggered ? 'true (ALERT!)' : 'false (PASS) '} │
│ 1000004 │ wet_tarmac   │          45.0  │          18.2  │ false (PASS)    │
│ 1000003 │ packed_snow  │          78.4  │          17.8  │ false (PASS)    │
│ 1000002 │ black_ice    │          84.0  │          16.5  │ false (PASS)    │
│ 1000001 │ dry_asphalt  │          60.0  │          16.1  │ false (PASS)    │
└─────────┴──────────────┴────────────────┴────────────────┴─────────────────┘
Audit validation: 0 quarantine events logged in historical partition.`);
  };

  const sqlSchema = `-- =====================================================================
-- POSTGRESQL 16 PRODUCTION TIMESERIES HYPERTABLE & QUARANTINE TRIGGER
-- ASSET: GF-T3-186 (Lexus UX 300h F SPORT Handling Core)
-- COMPATIBILITY: PostgreSQL 16+ / TimescaleDB / AlloyDB
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Partitioned Parent Ledger Table
CREATE TABLE IF NOT EXISTS vehicle_telemetry_frames (
    frame_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nonce               BIGINT NOT NULL,
    recorded_at         TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    vehicle_vin         VARCHAR(17) NOT NULL DEFAULT 'JTHEX300H202600186',
    road_surface        VARCHAR(32) NOT NULL,
    friction_mu         NUMERIC(4,3) NOT NULL CHECK (friction_mu BETWEEN 0.05 AND 1.20),
    throttle_pct        NUMERIC(5,2) NOT NULL CHECK (throttle_pct BETWEEN 0.0 AND 100.0),
    vehicle_speed_kmh   NUMERIC(5,2) NOT NULL CHECK (vehicle_speed_kmh >= 0.0),
    ice_rpm             NUMERIC(6,1) NOT NULL CHECK (ice_rpm BETWEEN 0.0 AND 6600.0),
    mg1_rpm             NUMERIC(7,1) NOT NULL,
    mg2_rpm             NUMERIC(7,1) NOT NULL,
    rear_torque_nm      NUMERIC(6,2) NOT NULL CHECK (rear_torque_nm BETWEEN 0.0 AND 120.0),
    front_torque_pct    NUMERIC(5,2) NOT NULL,
    rear_torque_pct     NUMERIC(5,2) NOT NULL,
    battery_soc_pct     NUMERIC(5,2) NOT NULL CHECK (battery_soc_pct BETWEEN 0.0 AND 100.0),
    battery_voltage_v   NUMERIC(6,2) NOT NULL,
    cell_spread_mv      NUMERIC(5,2) NOT NULL CHECK (cell_spread_mv >= 0.0),
    is_quarantined      BOOLEAN NOT NULL DEFAULT FALSE,
    prev_block_hash     CHAR(64) NOT NULL,
    current_block_hash  CHAR(64) NOT NULL,
    hmac_signature      CHAR(64) NOT NULL,
    CONSTRAINT chk_torque_balance CHECK (ABS(front_torque_pct + rear_torque_pct - 100.0) < 0.1)
) PARTITION BY RANGE (recorded_at);

-- Monthly Timeseries Partition
CREATE TABLE IF NOT EXISTS vehicle_telemetry_frames_2026_m10
    PARTITION OF vehicle_telemetry_frames
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2026-11-01 00:00:00+00');

-- High-Frequency Composite Indices for B-Tree and Merkle Traversal
CREATE INDEX IF NOT EXISTS idx_telemetry_nonce_recorded
    ON vehicle_telemetry_frames_2026_m10 (nonce DESC, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_telemetry_quarantine_scan
    ON vehicle_telemetry_frames_2026_m10 (is_quarantined)
    WHERE is_quarantined = TRUE;

-- Dedicated Battery Quarantine Incident Audit Log
CREATE TABLE IF NOT EXISTS battery_quarantine_events (
    event_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    frame_id            UUID NOT NULL,
    nonce               BIGINT NOT NULL,
    cell_spread_mv      NUMERIC(5,2) NOT NULL,
    fault_code          VARCHAR(64) NOT NULL,
    triggered_at        TIMESTAMPTZ NOT NULL
);

-- =====================================================================
-- AUTOMATED LITHIUM-ION CELL SPREAD QUARANTINE TRIGGER
-- Safety Specification: If max(V_cell) - min(V_cell) > 45.0 mV,
-- trigger safety isolation and record tamper-proof incident.
-- =====================================================================
CREATE OR REPLACE FUNCTION trg_fn_enforce_battery_quarantine()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.cell_spread_mv > 45.0 THEN
        NEW.is_quarantined := TRUE;
        
        INSERT INTO battery_quarantine_events (
            frame_id, nonce, cell_spread_mv, fault_code, triggered_at
        ) VALUES (
            NEW.frame_id, NEW.nonce, NEW.cell_spread_mv, 'B2194-01_CELL_SPREAD_EXCEEDED', clock_timestamp()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_battery_quarantine ON vehicle_telemetry_frames;
CREATE TRIGGER trg_battery_quarantine
    BEFORE INSERT ON vehicle_telemetry_frames
    FOR EACH ROW
    EXECUTE FUNCTION trg_fn_enforce_battery_quarantine();`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Tab Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              PostgreSQL 16 Hybrid Ledger
            </h2>
            <p className="text-base text-slate-400 mt-1">
              Partitioned Hypertables with Chained HMAC-SHA256 Signatures & Automated 45 mV Battery Quarantine Triggers
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg shrink-0">
            <button
              onClick={() => setActiveView('explorer')}
              className={`px-3 py-1.5 text-base font-semibold rounded-md transition-colors cursor-pointer ${
                activeView === 'explorer'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Ledger Nonce Explorer
            </button>
            <button
              onClick={() => setActiveView('schema')}
              className={`px-3 py-1.5 text-base font-semibold rounded-md transition-colors cursor-pointer ${
                activeView === 'schema'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              PostgreSQL DDL & Triggers
            </button>
            <button
              onClick={() => setActiveView('query')}
              className={`px-3 py-1.5 text-base font-semibold rounded-md transition-colors cursor-pointer ${
                activeView === 'query'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              SQL Runner Simulation
            </button>
          </div>
        </div>

        {/* Battery Cell Voltage Spread Quarantine Controller */}
        <div className="mt-6 p-5 rounded-xl bg-slate-950 border border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <span className="text-base font-bold text-white flex items-center gap-2">
                <Battery className="w-5 h-5 text-emerald-400" />
                Lithium-Ion 60-Cell Pack Spread Monitor (222V Nominal)
              </span>
              <p className="text-base text-slate-400 mt-0.5">
                Lexus UX 300h BMS Safety Limit: &Delta;V Spread &le; 45.0 mV. Beyond 45 mV, the PostgreSQL trigger isolates the pack.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 rounded text-base font-mono font-bold border ${
                  frame.cellVoltageSpreadMv > 45.0
                    ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                    : frame.cellVoltageSpreadMv > 30.0
                    ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                    : 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                }`}
              >
                {frame.cellVoltageSpreadMv > 45.0
                  ? 'FAULT: SMR RELAYS OPEN (QUARANTINED)'
                  : frame.cellVoltageSpreadMv > 30.0
                  ? 'WARNING: CELL DRIFT'
                  : 'NOMINAL (HEALTHY)'}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-base">
              <span className="text-slate-300 font-semibold">
                Simulated Cell Spread &Delta;V (max - min):
              </span>
              <span className="font-mono font-bold text-xl text-amber-400">
                {frame.cellVoltageSpreadMv.toFixed(1)} mV
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="65"
              step="0.5"
              value={frame.cellVoltageSpreadMv}
              onChange={e => onUpdateCellSpread(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
            />
            <div className="flex justify-between text-base text-slate-500 font-mono">
              <span>10 mV (Factory Fresh)</span>
              <span className="text-amber-400 font-semibold">30 mV (Advisory Limit)</span>
              <span className="text-rose-400 font-bold">45 mV (Quarantine Trigger Threshold)</span>
              <span>65 mV (Severely Degraded)</span>
            </div>
          </div>
        </div>
      </div>

      {activeView === 'explorer' && (
        <div className="space-y-6">
          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  chainTampered ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'
                }`}
              />
              <span className="text-base font-semibold text-slate-200">
                Merkle HMAC Ledger Integrity:{' '}
                <strong className={chainTampered ? 'text-rose-400' : 'text-emerald-400'}>
                  {chainTampered ? 'CHAIN BROKEN — TAMPER DETECTED' : 'UNBROKEN & VERIFIED'}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSimulateTamper}
                disabled={chainTampered}
                className="px-3.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-base font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Simulate Bitflip Tamper Attack</span>
              </button>
              <button
                onClick={handleRestoreChain}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-base font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Restore Chain</span>
              </button>
            </div>
          </div>

          {/* Table of Ledger Blocks */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 text-base font-mono uppercase tracking-wider">
                    <th className="p-4">Nonce</th>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Cell &Delta;V</th>
                    <th className="p-4">Rear Torque</th>
                    <th className="p-4">Torque Split</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">HMAC Signature</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-base font-mono">
                  {blocks.map(block => (
                    <tr
                      key={block.nonce}
                      className={`transition-colors ${
                        block.tampered
                          ? 'bg-rose-950/30 text-rose-200'
                          : block.status === 'QUARANTINE_ALERT'
                          ? 'bg-amber-950/20 text-amber-200'
                          : 'hover:bg-slate-800/50 text-slate-300'
                      }`}
                    >
                      <td className="p-4 font-bold text-amber-400">#{block.nonce}</td>
                      <td className="p-4 text-slate-400">{block.timestamp.slice(11, 23)}</td>
                      <td className="p-4">
                        <span
                          className={`font-semibold ${
                            block.cellSpreadMv > 45 ? 'text-rose-400' : 'text-slate-200'
                          }`}
                        >
                          {block.cellSpreadMv.toFixed(1)} mV
                        </span>
                      </td>
                      <td className="p-4 text-slate-200 font-bold">{block.rearTorqueNm.toFixed(1)} Nm</td>
                      <td className="p-4 text-cyan-400">{block.torqueSplit}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold border inline-flex items-center gap-1 ${
                            block.status === 'CHAIN_TAMPERED'
                              ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                              : block.status === 'QUARANTINE_ALERT'
                              ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                              : 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                          }`}
                        >
                          {block.status === 'CHAIN_TAMPERED' ? (
                            <>
                              <ShieldAlert className="w-3.5 h-3.5" />
                              SIGNATURE MISMATCH
                            </>
                          ) : block.status === 'QUARANTINE_ALERT' ? (
                            <>
                              <AlertTriangle className="w-3.5 h-3.5" />
                              QUARANTINED
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-3.5 h-3.5" />
                              NOMINAL
                            </>
                          )}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400 truncate max-w-[140px]" title={block.hmac}>
                        {block.hmac.slice(0, 14)}...
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeView === 'schema' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
            <div>
              <span className="text-base font-bold text-white font-mono">
                schema_001_partitioned_ledger.sql
              </span>
              <span className="text-base text-slate-500 ml-3">
                PostgreSQL 16 Hypertables with Range Partitioning and Triggers
              </span>
            </div>
            <button
              onClick={handleCopySql}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-base font-semibold inline-flex items-center gap-2 cursor-pointer transition-colors"
            >
              {copiedSql ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedSql ? 'Copied SQL' : 'Copy DDL'}</span>
            </button>
          </div>
          <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg overflow-x-auto text-sm font-mono text-slate-300 leading-relaxed max-h-[580px]">
            <code>{sqlSchema}</code>
          </pre>
        </div>
      )}

      {activeView === 'query' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-amber-400" />
              Interactive PostgreSQL 16 REPL Simulator
            </span>
            <span className="text-base font-mono text-slate-400">
              Database: <code className="text-amber-400">gf_t3_186_ledger</code> (Port 5432)
            </span>
          </div>

          <div className="relative">
            <textarea
              rows={3}
              value={simulatedQuery}
              onChange={e => setSimulatedQuery(e.target.value)}
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-sm text-slate-200 focus:outline-none focus:border-amber-500 resize-none"
            />
            <button
              onClick={handleExecuteQuery}
              className="mt-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-base rounded-lg inline-flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Execute SQL Query</span>
            </button>
          </div>

          {queryOutput && (
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-sm text-emerald-400 whitespace-pre overflow-x-auto">
              {queryOutput}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
