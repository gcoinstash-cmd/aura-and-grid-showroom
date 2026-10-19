import React, { useState } from 'react';
import { Database, Copy, Check, Terminal, Layers, ShieldCheck, Play, Code2 } from 'lucide-react';
import { ALLOYDB_SCHEMA_SQL } from '../artifacts/alloydbSchema';

export const AlloyDbExplorer: React.FC = () => {
  const [copied, setCopied] = useState<boolean>(false);
  const [selectedTable, setSelectedTable] = useState<string>('optical_flow_vectors');
  const [selectedQueryIdx, setSelectedQueryIdx] = useState<number>(0);
  const [queryResult, setQueryResult] = useState<any | null>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(ALLOYDB_SCHEMA_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sampleQueries = [
    {
      name: '1. Microsecond Optical Divergence & Collision Hazards',
      description: 'Query imminent collision triggers within 150ms Time-To-Collision window across all active edge nodes.',
      sql: `SELECT 
    t.anomaly_id,
    n.fleet_vehicle_id,
    t.trigger_timestamp_us,
    t.anomaly_type,
    t.time_to_collision_ms,
    t.target_centroid_x,
    t.target_centroid_y,
    t.relative_approach_speed_m_s
FROM edge_anomaly_triggers t
JOIN neuromorphic_sensor_nodes n ON t.sensor_id = n.sensor_id
WHERE t.time_to_collision_ms <= 150.00
  AND t.severity_level = 'CRITICAL'
ORDER BY t.trigger_timestamp_us DESC
LIMIT 10;`,
      result: [
        {
          anomaly_id: 'e4a291f0-7b24-4df8-9d41-3b7c2d140e01',
          fleet_vehicle_id: 'VEH-F1-PRO-08',
          trigger_timestamp_us: '1728169200481920',
          anomaly_type: 'IMMINENT_COLLISION',
          time_to_collision_ms: '68.40',
          target_centroid_x: '134.20',
          target_centroid_y: '122.80',
          relative_approach_speed_m_s: '42.60',
        },
        {
          anomaly_id: 'f9b312a1-8c35-4ef9-ae52-4c8d3e251f12',
          fleet_vehicle_id: 'VEH-F1-PRO-08',
          trigger_timestamp_us: '1728169200421880',
          anomaly_type: 'OPTICAL_DIVERGENCE_SHOCKWAVE',
          time_to_collision_ms: '84.10',
          target_centroid_x: '128.00',
          target_centroid_y: '128.00',
          relative_approach_speed_m_s: '38.40',
        },
      ],
      executionPlan: `Index Scan using idx_anomaly_triggers_ttc on edge_anomaly_triggers t (matrix=0.14..8.28 rows=2 width=148)
  Filter: (severity_level = 'CRITICAL'::character varying)
Nested Loop (matrix=0.28..16.59 rows=2 width=180)
  -> Index Scan using neuromorphic_sensor_nodes_pkey on neuromorphic_sensor_nodes n
Planning Time: 0.084 ms | Execution Time: 0.312 ms`,
    },
    {
      name: '2. Time-Series Partition Pruning & P99 Flow Latency',
      description: 'Scan partitioned optical_flow_vectors with BRIN acceleration for sub-millisecond computation audit.',
      sql: `SELECT 
    date_trunc('minute', recorded_at) as window_min,
    COUNT(*) as calculated_vector_count,
    ROUND(AVG(computation_latency_us), 2) as mean_latency_us,
    ROUND(PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY computation_latency_us)::numeric, 2) as p99_latency_us,
    ROUND(AVG(condition_number_kappa), 2) as mean_kappa
FROM optical_flow_vectors
WHERE recorded_at >= '2026-10-05 00:00:00+00'
  AND recorded_at <  '2026-10-06 00:00:00+00'
  AND aperture_confidence_score > 0.85
GROUP BY window_min
ORDER BY window_min DESC
LIMIT 5;`,
      result: [
        {
          window_min: '2026-10-05 22:35:00+00',
          calculated_vector_count: '624,190',
          mean_latency_us: '224.80',
          p99_latency_us: '418.60',
          mean_kappa: '3.42',
        },
        {
          window_min: '2026-10-05 22:34:00+00',
          calculated_vector_count: '618,920',
          mean_latency_us: '221.40',
          p99_latency_us: '412.10',
          mean_kappa: '3.38',
        },
      ],
      executionPlan: `Append (matrix=0.00..42.15 rows=1240000 width=32)
  -> Bitmap Heap Scan on optical_flow_vectors_2026_10_05 (Partition Pruned: 1 of 3 partitions scanned)
     Recheck Cond: (aperture_confidence_score > 0.85)
     -> Bitmap Index Scan on idx_flow_vectors_confidence
Planning Time: 0.112 ms | Execution Time: 0.742 ms`,
    },
  ];

  const handleRunQuery = (idx: number) => {
    setSelectedQueryIdx(idx);
    setIsExecuting(true);
    setTimeout(() => {
      setQueryResult(sampleQueries[idx]);
      setIsExecuting(false);
    }, 250);
  };

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Database className="w-7 h-7 text-cyan-400" />
            <h2 className="text-2xl font-bold text-white">
              Cloud-Scale AlloyDB / PostgreSQL Normalized DDL Architecture
            </h2>
          </div>
          <p className="text-base text-slate-300">
            Engineered for Google Cloud AlloyDB / PostgreSQL 16+. Zero circular foreign keys, time-series range partitioning, BRIN indices, and immutable audit triggers.
          </p>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2.5 rounded-xl border border-slate-700 transition-all cursor-pointer text-base whitespace-nowrap"
        >
          {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-cyan-400" />}
          {copied ? 'Copied DDL!' : 'Copy SQL Schema'}
        </button>
      </div>

      {/* Tables Breakdown & Partition Topology */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table Selector */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
            <Layers className="w-5 h-5 text-amber-400" />
            Database Table Schema Registry
          </h3>

          {[
            { id: 'neuromorphic_sensor_nodes', name: '1. neuromorphic_sensor_nodes', desc: 'Hardware registry, PCIe slot, calibration hash' },
            { id: 'event_stream_partitions', name: '2. event_stream_partitions', desc: 'Time-range partitioned raw event blocks' },
            { id: 'optical_flow_vectors', name: '3. optical_flow_vectors', desc: 'Microsecond 2D velocity kinematics & condition kappa' },
            { id: 'edge_anomaly_triggers', name: '4. edge_anomaly_triggers', desc: 'LIF spiking alerts & collision warning overrides' },
            { id: 'firmware_calibration_records', name: '5. firmware_calibration_records', desc: 'Refractory & contrast threshold registers' },
            { id: 'audit_telemetry_ledger', name: '6. audit_telemetry_ledger', desc: 'Append-only immutable transaction audit trail' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTable(t.id)}
              className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                selectedTable === t.id
                  ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 shadow-sm'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="text-base font-bold font-mono text-white mb-0.5">{t.name}</div>
              <div className="text-sm text-slate-400">{t.desc}</div>
            </button>
          ))}
        </div>

        {/* Partition & Architecture Details */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            AlloyDB Partitioning & Performance Invariants
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-base font-bold text-cyan-300 block mb-1">Time-Series Range Partitioning</span>
              <p className="text-base text-slate-300">
                Tables <code className="text-amber-400 font-mono">event_stream_partitions</code> and <code className="text-amber-400 font-mono">optical_flow_vectors</code> are partitioned daily by <code className="text-slate-200 font-mono">recorded_at</code> with sub-millisecond partition pruning.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-base font-bold text-amber-300 block mb-1">High-Throughput BRIN Indexing</span>
              <p className="text-base text-slate-300">
                Uses Block Range Indexing (BRIN) on append-only timestamps, reducing index storage overhead by 98% while sustaining 10M events/sec ingestion.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-base font-bold text-emerald-300 block mb-1">Zero-RPO Telemetry Audit Triggers</span>
              <p className="text-base text-slate-300">
                PostgreSQL PL/pgSQL function <code className="text-slate-200 font-mono">record_immutable_audit_log()</code> logs all configuration changes to an immutable ledger.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-base font-bold text-white block mb-1">Zero Circular Foreign Keys</span>
              <p className="text-base text-slate-300">
                Hierarchical star topology anchored strictly on <code className="text-cyan-400 font-mono">sensor_id</code> with explicit <code className="text-slate-200 font-mono">ON DELETE RESTRICT</code> safety guards.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <h4 className="text-base font-bold text-slate-300 mb-2">Selected DDL Snippet:</h4>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-cyan-300 text-sm overflow-x-auto max-h-56">
              <pre>{ALLOYDB_SCHEMA_SQL.split(`CREATE TABLE IF NOT EXISTS ${selectedTable}`)[1]?.split(';')[0]
                ? `CREATE TABLE IF NOT EXISTS ${selectedTable}${ALLOYDB_SCHEMA_SQL.split(`CREATE TABLE IF NOT EXISTS ${selectedTable}`)[1]?.split(';')[0]};`
                : ALLOYDB_SCHEMA_SQL.slice(0, 1200)}</pre>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive SQL Query Runner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-amber-400" />
            Interactive SQL Query & EXPLAIN Execution Analyzer
          </h3>
          <span className="text-sm font-mono text-emerald-400">PostgreSQL 16+ Query Optimizer</span>
        </div>

        <div className="flex gap-2 flex-wrap">
          {sampleQueries.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleRunQuery(idx)}
              className={`px-4 py-2 rounded-xl text-base font-semibold border transition-all cursor-pointer flex items-center gap-2 ${
                selectedQueryIdx === idx
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <Play className="w-4 h-4 text-amber-400" />
              {q.name}
            </button>
          ))}
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-sm text-cyan-300 overflow-x-auto">
          <pre>{sampleQueries[selectedQueryIdx].sql}</pre>
        </div>

        {/* Results & EXPLAIN Output */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-base font-bold text-slate-300 block mb-2">Simulated Query Execution Result:</span>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    {Object.keys(sampleQueries[selectedQueryIdx].result[0]).map((k) => (
                      <th key={k} className="p-2">{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sampleQueries[selectedQueryIdx].result.map((row: any, i: number) => (
                    <tr key={i} className="border-b border-slate-900 text-cyan-300">
                      {Object.values(row).map((val: any, j: number) => (
                        <td key={j} className="p-2">{val}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-base font-bold text-slate-300 block mb-2">EXPLAIN (ANALYZE, BUFFERS) Plan:</span>
            <pre className="text-sm font-mono text-emerald-400 whitespace-pre-wrap leading-relaxed">
              {sampleQueries[selectedQueryIdx].executionPlan}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
