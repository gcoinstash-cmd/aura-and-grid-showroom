import React, { useState } from 'react';
import { LedgerRecord } from '../../types/telemetry';
import { Database, ShieldCheck, AlertOctagon, Copy, Check, Filter, Search, PlusCircle, CheckCircle2 } from 'lucide-react';

interface Tab2PostgresLedgerProps {
  records: LedgerRecord[];
  onAddRecord: (record: LedgerRecord) => void;
  onVerifyLedger: () => void;
}

export const Tab2PostgresLedger: React.FC<Tab2PostgresLedgerProps> = ({
  records,
  onAddRecord,
  onVerifyLedger,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterQuarantined, setFilterQuarantined] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.nonce.toString().includes(searchTerm) ||
      r.hmacSignature.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.direct4Split.includes(searchTerm);
    if (filterQuarantined) {
      return matchesSearch && r.divergenceDelta > 0.40;
    }
    return matchesSearch;
  });

  const handleSimulateDivergenceAnomaly = () => {
    const latestNonce = records[0] ? records[0].nonce + 1 : 1000010;
    const anomalousRecord: LedgerRecord = {
      id: `anomaly-${Date.now()}`,
      nonce: latestNonce,
      recordedAt: new Date().toISOString(),
      yokeAngle: 45.0,
      rackAngle: 5.17,
      divergenceDelta: 0.62, // Greater than ASIL-D limit of 0.40 deg!
      pinionResistanceNm: 4.85,
      direct4Split: "75:25",
      canBusState: "BUS_B (Quarantine Triggered)",
      hmacSignature: "fa8819273c661e892d77443190abce109988112233445566778899aabbccdde0",
      verified: true
    };
    onAddRecord(anomalousRecord);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(`-- GF-T3-196: Lexus RZ 450e Steer-by-Wire & DIRECT4 PostgreSQL 16 Schema
CREATE TABLE steer_telemetry_partitioned (
    record_id UUID DEFAULT gen_random_uuid(),
    nonce BIGINT NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    speed_kmh NUMERIC(5,2) NOT NULL,
    yoke_angle_deg NUMERIC(6,3) NOT NULL,
    target_rack_angle_deg NUMERIC(6,3) NOT NULL,
    actual_pinion_angle_deg NUMERIC(6,3) NOT NULL,
    actuator_divergence_delta NUMERIC(6,3) GENERATED ALWAYS AS (abs(target_rack_angle_deg - actual_pinion_angle_deg)) STORED,
    pinion_resistance_nm NUMERIC(6,2) NOT NULL,
    direct4_front_pct NUMERIC(4,1) NOT NULL,
    direct4_rear_pct NUMERIC(4,1) NOT NULL,
    active_can_bus VARCHAR(10) NOT NULL,
    record_hmac_sha256 CHAR(64) NOT NULL,
    is_quarantined BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (recorded_at, record_id)
) PARTITION BY RANGE (recorded_at);

CREATE OR REPLACE FUNCTION trg_enforce_sbw_safety_sentinel()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.actuator_divergence_delta > 0.40 THEN
        NEW.is_quarantined := TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;`);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Database className="w-7 h-7 text-indigo-400" />
              PostgreSQL 16 Timeseries Steer Ledger
            </h2>
            <p className="text-slate-300 text-base mt-1">
              Range-partitioned hypertable structure enforcing ASIL-D actuator divergence quarantine (&gt;0.40°) and HMAC-SHA256 cryptographically linked nonces.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleSimulateDivergenceAnomaly}
              type="button"
              className="px-4 py-2 rounded-lg font-bold text-base bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center gap-2 transition cursor-pointer"
              title="Insert a test record with divergence delta > 0.40 deg to trigger ASIL-D quarantine"
            >
              <PlusCircle className="w-5 h-5 text-amber-400" />
              <span>Simulate Divergence Anomaly</span>
            </button>

            <button
              onClick={onVerifyLedger}
              type="button"
              className="px-4 py-2 rounded-lg font-bold text-base bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 transition cursor-pointer shadow-sm"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>Audit HMAC Signatures</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-800">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by Nonce #, HMAC signature prefix, or split ratio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-base text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            onClick={() => setFilterQuarantined(!filterQuarantined)}
            type="button"
            className={`px-4 py-2 rounded-lg text-base font-bold flex items-center gap-2 border transition cursor-pointer ${
              filterQuarantined
                ? 'bg-red-500/20 border-red-500 text-red-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>{filterQuarantined ? 'Showing Quarantined (>0.40°)' : 'Filter Quarantined'}</span>
          </button>
        </div>

        {/* Table View */}
        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-left text-base">
            <thead className="bg-slate-950 text-slate-400 text-sm font-mono uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Nonce</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Yoke / Rack</th>
                <th className="py-3 px-4">Divergence Δ</th>
                <th className="py-3 px-4">Pinion (Nm)</th>
                <th className="py-3 px-4">DIRECT4</th>
                <th className="py-3 px-4">Bus State</th>
                <th className="py-3 px-4">HMAC-SHA256</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-base">
              {filteredRecords.map((r) => {
                const isQuarantined = r.divergenceDelta > 0.40;
                return (
                  <tr
                    key={r.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isQuarantined ? 'bg-red-950/20 border-l-4 border-l-red-500' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-bold text-amber-400">#{r.nonce}</td>
                    <td className="py-3 px-4 text-slate-400 text-sm">
                      {new Date(r.recordedAt).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 text-white">
                      {r.yokeAngle > 0 ? `+${r.yokeAngle}` : r.yokeAngle}° /{' '}
                      <span className="text-cyan-300">{r.rackAngle > 0 ? `+${r.rackAngle}` : r.rackAngle}°</span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-sm ${
                          isQuarantined
                            ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                            : 'text-slate-300'
                        }`}
                      >
                        {r.divergenceDelta.toFixed(2)}°
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{r.pinionResistanceNm}</td>
                    <td className="py-3 px-4 text-emerald-400 font-bold">{r.direct4Split}</td>
                    <td className="py-3 px-4 text-xs text-slate-300">{r.canBusState}</td>
                    <td className="py-3 px-4 text-xs text-slate-400">
                      <span title={r.hmacSignature}>
                        {r.hmacSignature.slice(0, 8)}...{r.hmacSignature.slice(-6)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {isQuarantined ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/30 whitespace-nowrap">
                          <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
                          QUARANTINED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 whitespace-nowrap">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          VALIDATED
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

      {/* PostgreSQL 16 DDL Schema Code View */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="text-indigo-400 font-mono">02.</span>
              PostgreSQL 16 Partitioned DDL & Sentinel Trigger
            </h3>
            <p className="text-slate-400 text-base mt-1">
              Production schema with auto-generated divergence columns, ASIL-D trigger sentinel, and composite primary key for high-throughput write partitioning.
            </p>
          </div>
          <button
            onClick={handleCopySql}
            type="button"
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-mono font-bold flex items-center gap-2 transition cursor-pointer"
          >
            {copiedSql ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
            <span>{copiedSql ? 'Copied' : 'Copy DDL'}</span>
          </button>
        </div>

        <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto text-sm text-slate-300 font-mono leading-relaxed">
{`-- GF-T3-196: Lexus RZ 450e Steer-by-Wire & DIRECT4 High-Frequency Telemetry Ledger
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE steer_telemetry_partitioned (
    record_id UUID DEFAULT gen_random_uuid(),
    nonce BIGINT NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    vehicle_vin VARCHAR(17) NOT NULL DEFAULT 'JTJAAABA4P00196RZ',
    speed_kmh NUMERIC(5,2) NOT NULL CHECK (speed_kmh >= 0.0),
    yoke_angle_deg NUMERIC(6,3) NOT NULL CHECK (yoke_angle_deg BETWEEN -150.0 AND 150.0),
    target_rack_angle_deg NUMERIC(6,3) NOT NULL CHECK (target_rack_angle_deg BETWEEN -25.0 AND 25.0),
    actual_pinion_angle_deg NUMERIC(6,3) NOT NULL,
    actuator_divergence_delta NUMERIC(6,3) GENERATED ALWAYS AS (abs(target_rack_angle_deg - actual_pinion_angle_deg)) STORED,
    pinion_resistance_nm NUMERIC(6,2) NOT NULL,
    direct4_front_pct NUMERIC(4,1) NOT NULL,
    direct4_rear_pct NUMERIC(4,1) NOT NULL,
    active_can_bus VARCHAR(10) NOT NULL CHECK (active_can_bus IN ('BUS_A', 'BUS_B')),
    record_hmac_sha256 CHAR(64) NOT NULL,
    is_quarantined BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (recorded_at, record_id)
) PARTITION BY RANGE (recorded_at);

-- ASIL-D Actuator Divergence Quarantine Sentinel Trigger
CREATE OR REPLACE FUNCTION trg_enforce_sbw_safety_sentinel()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.actuator_divergence_delta > 0.40 THEN
        NEW.is_quarantined := TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_sbw_divergence_before_insert
BEFORE INSERT ON steer_telemetry_partitioned
FOR EACH ROW EXECUTE FUNCTION trg_enforce_sbw_safety_sentinel();`}
        </pre>
      </div>
    </div>
  );
};
