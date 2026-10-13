import React, { useState } from 'react';
import { LedgerBlock } from '../types/telemetry';
import { Database, ShieldCheck, AlertTriangle, CheckCircle, Copy, Check, RefreshCw } from 'lucide-react';

interface TabPostgresLedgerProps {
  blocks: LedgerBlock[];
  onTriggerTamper: () => void;
  onRestoreChain: () => void;
  isTampered: boolean;
}

export const TabPostgresLedger: React.FC<TabPostgresLedgerProps> = ({
  blocks,
  onTriggerTamper,
  onRestoreChain,
  isTampered,
}) => {
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'blocks' | 'schema' | 'quarantine'>('blocks');

  const copySqlCode = () => {
    const sql = `-- GF-T3-183: PostgreSQL 16 Partitioned BEV Ledger
CREATE TABLE IF NOT EXISTS telemetry_pack_partitions (
    nonce BIGINT NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    speed_kmh NUMERIC(5, 2) NOT NULL,
    front_torque_nm NUMERIC(6, 2) NOT NULL,
    rear_torque_nm NUMERIC(6, 2) NOT NULL,
    yoke_angle_deg NUMERIC(5, 2) NOT NULL,
    road_wheel_angle_deg NUMERIC(5, 2) NOT NULL,
    steering_ratio NUMERIC(4, 2) NOT NULL,
    front_inverter_temp_c NUMERIC(5, 2) NOT NULL,
    rear_inverter_temp_c NUMERIC(5, 2) NOT NULL,
    thermal_divergence_c NUMERIC(5, 2) GENERATED ALWAYS AS (ABS(front_inverter_temp_c - rear_inverter_temp_c)) STORED,
    prev_block_hash CHAR(64) NOT NULL,
    block_hash CHAR(64) NOT NULL,
    hmac_signature CHAR(64) NOT NULL,
    is_quarantined BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (nonce, recorded_at)
) PARTITION BY RANGE (recorded_at);`;
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Ledger Header & Integrity Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" />
              PostgreSQL 16 Partitioned BEV Ledger & HMAC Audit Chain
            </h2>
            <p className="text-[15px] text-slate-400 mt-1">
              Deterministic cryptographically chained telemetry ledger. Every 2,500 Hz FOC telemetry frame is committed to time-partitioned hypertables with SHA-256 block hashing and HMAC signature validation.
            </p>
          </div>

          {/* Tamper testing simulation controls */}
          <div className="flex items-center gap-2 shrink-0">
            {isTampered ? (
              <button
                type="button"
                onClick={onRestoreChain}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Restore Valid Signatures
              </button>
            ) : (
              <button
                type="button"
                onClick={onTriggerTamper}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/60 hover:bg-red-800/80 border border-red-500/50 text-red-200 text-xs font-bold rounded-lg cursor-pointer transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                Simulate Tamper Injection
              </button>
            )}
          </div>
        </div>

        {/* Ledger Integrity Alert Banner */}
        <div className="mt-4 pt-4 border-t border-slate-800">
          {isTampered ? (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-between text-[15px]">
              <div className="flex items-center gap-2 text-red-400 font-semibold">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                <span>INTEGRITY FAILURE: Block #3 HMAC-SHA256 signature mismatch detected. Ingestion pipeline halted!</span>
              </div>
              <span className="text-xs font-mono text-red-300">TRIGGER: trg_verify_and_quarantine()</span>
            </div>
          ) : (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center justify-between text-[15px]">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>HMAC CHAIN VERIFIED: Zero block mutations. All cryptographic hashes validate across partition slices.</span>
              </div>
              <span className="text-xs font-mono text-emerald-300">CHAIN HEIGHT: #{blocks.length}</span>
            </div>
          )}
        </div>
      </div>

      {/* Subtabs Selector */}
      <div className="flex border-b border-slate-800 gap-6">
        <button
          onClick={() => setActiveSubTab('blocks')}
          className={`pb-3 text-[15px] font-semibold border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'blocks'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Live Telemetry Block Chain ({blocks.length} Blocks)
        </button>
        <button
          onClick={() => setActiveSubTab('schema')}
          className={`pb-3 text-[15px] font-semibold border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'schema'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          PostgreSQL 16 Partitioned DDL Schema
        </button>
        <button
          onClick={() => setActiveSubTab('quarantine')}
          className={`pb-3 text-[15px] font-semibold border-b-2 transition-colors cursor-pointer ${
            activeSubTab === 'quarantine'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Inverter Thermal Quarantine Trigger
        </button>
      </div>

      {/* Subtab 1: Blocks */}
      {activeSubTab === 'blocks' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center">
            <h3 className="text-[15px] font-bold text-white">Chained Telemetry Records (HMAC-SHA256)</h3>
            <span className="text-xs text-slate-400 font-mono">Algorithm: HMAC-SHA256(BlockDigest, Key)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[15px]">
              <thead className="bg-slate-950/80 text-xs font-mono uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Height / Nonce</th>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Torque (F / R)</th>
                  <th className="px-4 py-3">Yoke / Ratio</th>
                  <th className="px-4 py-3">Thermal Div</th>
                  <th className="px-4 py-3">SHA-256 Digest</th>
                  <th className="px-4 py-3">HMAC Signature</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {blocks.map((block) => {
                  const isBlockTampered = isTampered && block.blockHeight === 3;
                  return (
                    <tr
                      key={block.blockHeight}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isBlockTampered ? 'bg-red-950/30' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-white font-bold tabular-nums">
                        #{block.blockHeight} (nonce: {block.nonce})
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {block.timestamp.split('T')[1].replace('Z', '')}
                      </td>
                      <td className="px-4 py-3 text-slate-300 tabular-nums">
                        <span className="text-sky-400">{block.frontTorqueNm.toFixed(1)}</span> /{' '}
                        <span className="text-amber-400">{block.rearTorqueNm.toFixed(1)}</span> Nm
                      </td>
                      <td className="px-4 py-3 text-slate-300 tabular-nums">
                        {block.yokeAngle}° ({block.steeringRatio.toFixed(1)}:1)
                      </td>
                      <td className="px-4 py-3 text-slate-300 tabular-nums">
                        <span
                          className={block.thermalDivergenceC > 15.0 ? 'text-red-400 font-bold' : 'text-slate-300'}
                        >
                          {block.thermalDivergenceC.toFixed(1)} °C
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        <span
                          className={isBlockTampered ? 'text-red-400 font-bold' : 'text-slate-400'}
                          title={block.blockHash}
                        >
                          {isBlockTampered ? '0xBAD_SIGNATURE_TAMPERED' : `${block.blockHash.slice(0, 12)}...`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        <span
                          className={isBlockTampered ? 'text-red-400 font-bold' : 'text-emerald-400'}
                          title={block.hmacDigest}
                        >
                          {isBlockTampered ? 'MISMATCH_FAIL' : `${block.hmacDigest.slice(0, 10)}...`}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {isBlockTampered ? (
                          <span className="inline-flex items-center text-xs text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                            CORRUPTED
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            VALID
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab 2: Schema */}
      {activeSubTab === 'schema' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" />
              PostgreSQL 16 Production DDL Schema
            </h3>
            <button
              onClick={copySqlCode}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              {copiedSql ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedSql ? 'Copied' : 'Copy DDL Script'}</span>
            </button>
          </div>
          <p className="text-[15px] text-slate-400 mb-3">
            Includes strict numeric range constraints, automatic generated thermal divergence columns, cryptographic HMAC verification functions, and partition slices.
          </p>
          <pre className="bg-slate-950 p-4 rounded-lg overflow-x-auto text-xs font-mono text-emerald-300 border border-slate-800/80 leading-relaxed max-h-[400px]">
            <code>{`-- 1. Partitioned Master Table
CREATE TABLE IF NOT EXISTS telemetry_pack_partitions (
    nonce BIGINT NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    speed_kmh NUMERIC(5, 2) NOT NULL CHECK (speed_kmh >= 0.00 AND speed_kmh <= 250.00),
    throttle_demand NUMERIC(5, 2) NOT NULL CHECK (throttle_demand >= -100.00 AND throttle_demand <= 100.00),
    yoke_angle_deg NUMERIC(5, 2) NOT NULL CHECK (yoke_angle_deg >= -150.00 AND yoke_angle_deg <= 150.00),
    road_wheel_angle_deg NUMERIC(5, 2) NOT NULL CHECK (road_wheel_angle_deg >= -35.00 AND road_wheel_angle_deg <= 35.00),
    steering_ratio NUMERIC(4, 2) NOT NULL CHECK (steering_ratio >= 4.00 AND steering_ratio <= 15.00),
    front_torque_nm NUMERIC(6, 2) NOT NULL CHECK (front_torque_nm >= -266.30 AND front_torque_nm <= 266.30),
    rear_torque_nm NUMERIC(6, 2) NOT NULL CHECK (rear_torque_nm >= -168.50 AND rear_torque_nm <= 168.50),
    front_rpm INT NOT NULL CHECK (front_rpm >= 0 AND front_rpm <= 13500),
    rear_rpm INT NOT NULL CHECK (rear_rpm >= 0 AND rear_rpm <= 13500),
    dc_bus_voltage NUMERIC(5, 2) NOT NULL CHECK (dc_bus_voltage >= 280.00 AND dc_bus_voltage <= 420.00),
    battery_cell_delta_mv NUMERIC(5, 2) NOT NULL CHECK (battery_cell_delta_mv >= 0.00 AND battery_cell_delta_mv <= 250.00),
    front_inverter_temp_c NUMERIC(5, 2) NOT NULL,
    rear_inverter_temp_c NUMERIC(5, 2) NOT NULL,
    thermal_divergence_c NUMERIC(5, 2) GENERATED ALWAYS AS (ABS(front_inverter_temp_c - rear_inverter_temp_c)) STORED,
    prev_block_hash CHAR(64) NOT NULL,
    block_hash CHAR(64) NOT NULL,
    hmac_signature CHAR(64) NOT NULL,
    is_quarantined BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (nonce, recorded_at)
) PARTITION BY RANGE (recorded_at);`}</code>
          </pre>
        </div>
      )}

      {/* Subtab 3: Quarantine */}
      {activeSubTab === 'quarantine' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            Inverter Thermal Junction Divergence Quarantine Specification
          </h3>
          <p className="text-[15px] text-slate-300">
            Silicon Carbide (SiC) power modules experience thermal stress under sustained track duty. If the temperature differential between the Front 1XM inverter and Rear 1YM inverter exceeds <strong>15.0 °C</strong>, the PostgreSQL trigger isolates the frame into the quarantine hypertable and issues an active power derate directive.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[15px]">
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
              <div className="text-xs text-slate-400 uppercase font-mono">Divergence Ceiling</div>
              <div className="text-xl font-bold font-mono text-amber-400 mt-1">15.0 °C Delta</div>
              <div className="text-xs text-slate-400 mt-2">Trigger Threshold for Automated Derate</div>
            </div>
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
              <div className="text-xs text-slate-400 uppercase font-mono">Derate Formula</div>
              <div className="text-xl font-bold font-mono text-sky-400 mt-1">5% / °C Excess</div>
              <div className="text-xs text-slate-400 mt-2">Dynamic Power Derate Percentage</div>
            </div>
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
              <div className="text-xs text-slate-400 uppercase font-mono">Audit Table</div>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-1">quarantine_log</div>
              <div className="text-xs text-slate-400 mt-2">Zero-Data-Loss Quarantine Audit</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
