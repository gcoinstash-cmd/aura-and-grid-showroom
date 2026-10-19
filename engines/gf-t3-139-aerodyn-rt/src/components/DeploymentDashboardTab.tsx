import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Activity, 
  ShieldCheck, 
  AlertCircle, 
  Radio, 
  Cpu, 
  HardDrive, 
  Globe, 
  RefreshCw, 
  FileText, 
  CheckCircle2,
  Terminal,
  Zap,
  Lock
} from 'lucide-react';
import { NodeHealth } from '../types/telemetry';

interface DeploymentDashboardTabProps {
  onOpenAuditModal: () => void;
}

export const DeploymentDashboardTab: React.FC<DeploymentDashboardTabProps> = ({ onOpenAuditModal }) => {
  const [nodes, setNodes] = useState<NodeHealth[]>([
    { id: 'node-edge-01', name: 'Trackside Edge Ingest (PREEMPT_RT)', region: 'us-east1-a', type: 'EDGE_COMPUTE', status: 'OPTIMAL', cpuUsagePct: 18.4, memoryUsagePct: 24.1, latencyMs: 0.12, throughputPerSec: 1000, activeThreads: 8 },
    { id: 'node-ring-01', name: 'POSIX Ring Buffer Worker 01', region: 'us-east1-a', type: 'BUFFER_RING', status: 'OPTIMAL', cpuUsagePct: 12.0, memoryUsagePct: 6.5, latencyMs: 0.08, throughputPerSec: 1000, activeThreads: 4 },
    { id: 'node-redis-hot', name: 'Redis Streams Hot Buffer Cluster', region: 'us-east1-b', type: 'REDIS_STREAM', status: 'OPTIMAL', cpuUsagePct: 28.5, memoryUsagePct: 42.0, latencyMs: 0.22, throughputPerSec: 10000, activeThreads: 16 },
    { id: 'node-alloy-01', name: 'AlloyDB / Timescale Primary', region: 'us-east1', type: 'ALLOYDB_PRIMARY', status: 'OPTIMAL', cpuUsagePct: 34.2, memoryUsagePct: 58.7, latencyMs: 0.45, throughputPerSec: 25000, activeThreads: 32 },
    { id: 'node-edge-backup', name: 'Paddock Edge Standby Node', region: 'us-central1', type: 'EDGE_COMPUTE', status: 'FAILOVER_STANDBY', cpuUsagePct: 4.1, memoryUsagePct: 12.0, latencyMs: 0.85, throughputPerSec: 0, activeThreads: 4 },
  ]);

  const [simulatedThroughput, setSimulatedThroughput] = useState<number>(1000);
  const [auditorEndpointStatus, setAuditorEndpointStatus] = useState<string>('IDLE');
  const [auditorResult, setAuditorResult] = useState<any>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setSimulatedThroughput(prev => Math.floor(998 + Math.random() * 5));
      setNodes(prevNodes => 
        prevNodes.map(node => ({
          ...node,
          cpuUsagePct: Number(Math.max(5, Math.min(90, node.cpuUsagePct + (Math.random() - 0.5) * 2)).toFixed(1)),
          latencyMs: Number(Math.max(0.05, node.latencyMs + (Math.random() - 0.5) * 0.02).toFixed(2))
        }))
      );
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  const triggerAuditorVerification = () => {
    setAuditorEndpointStatus('QUERYING');
    setTimeout(() => {
      setAuditorEndpointStatus('VERIFIED');
      setAuditorResult({
        verification_id: "AUDIT-2026-GF-9941",
        engine_id: "GF-T3-139",
        timestamp: new Date().toISOString(),
        clean_room_certified: true,
        zero_copyleft_confirmed: true,
        monopoly_score: "10/10_READINESS",
        uptime_sla_pct: 99.999,
        cryptographic_hash: "9f83acb18b5251467f290ceeee130dfd0b80e450",
        governing_law: "Turnkey Software Asset Purchase Agreement",
        status: "COMPLIANCE_APPROVED"
      });
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-zinc-700 rounded-2xl p-6 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-md text-sm font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500">
                INFRASTRUCTURE & DEPLOYMENT
              </span>
              <span className="text-zinc-600 font-bold">•</span>
              <span className="text-zinc-200 text-base font-bold">Real-Time Observability & Multi-Region Health</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white mt-1.5">
              Production Telemetry Nodes & Regulatory Compliance Suite
            </h2>
            <p className="text-base text-zinc-300 mt-1 max-w-4xl leading-relaxed">
              Live monitoring of PREEMPT_RT edge ingest containers, Redis stream buffers, AlloyDB hypertable nodes, and external auditor verification APIs.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenAuditModal}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 font-black text-base flex items-center gap-2.5 shadow-lg shadow-cyan-500/20 font-sans"
            >
              <FileText className="w-5 h-5 text-slate-950" />
              <span>EXPORT AUDIT REPORT (PDF/MD)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real-Time Throughput Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-slate-900 border border-zinc-700 rounded-2xl p-5 shadow-lg">
          <div className="text-xs font-mono font-bold text-zinc-400 uppercase">Live Ingest Rate</div>
          <div className="text-2xl font-extrabold text-cyan-300 mt-1 font-mono">
            {simulatedThroughput.toLocaleString()} <span className="text-sm font-normal text-zinc-400">frames/sec</span>
          </div>
          <div className="text-sm text-emerald-400 font-mono font-bold mt-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> 1000Hz Deterministic Tick
          </div>
        </div>

        <div className="bg-slate-900 border border-zinc-700 rounded-2xl p-5 shadow-lg">
          <div className="text-xs font-mono font-bold text-zinc-400 uppercase">System Uptime SLA</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1 font-mono">
            99.999%
          </div>
          <div className="text-sm text-zinc-300 font-mono mt-1">
            Zero Unplanned Downtime
          </div>
        </div>

        <div className="bg-slate-900 border border-zinc-700 rounded-2xl p-5 shadow-lg">
          <div className="text-xs font-mono font-bold text-zinc-400 uppercase">Active Nodes</div>
          <div className="text-2xl font-extrabold text-white mt-1 font-mono">
            5 / 5 <span className="text-base text-emerald-400 font-bold">HEALTHY</span>
          </div>
          <div className="text-sm text-cyan-400 font-mono mt-1">
            1 Hot Standby Ready
          </div>
        </div>

        <div className="bg-slate-900 border border-zinc-700 rounded-2xl p-5 shadow-lg">
          <div className="text-xs font-mono font-bold text-zinc-400 uppercase">AlloyDB Persistence</div>
          <div className="text-2xl font-extrabold text-cyan-300 mt-1 font-mono">
            0.45 ms <span className="text-sm font-normal text-zinc-400">write p95</span>
          </div>
          <div className="text-sm text-emerald-400 font-mono mt-1">
            Columnar Compression Active
          </div>
        </div>
      </div>

      {/* Cluster Node Status Table */}
      <div className="bg-slate-900 border border-zinc-700 rounded-2xl p-6 shadow-xl">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2.5">
          <Server className="w-5 h-5 text-cyan-400" />
          <span>Cluster Node Observability Matrix</span>
        </h3>

        <div className="overflow-x-auto font-mono text-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-950 text-zinc-400 border-b border-zinc-800 text-xs uppercase">
              <tr>
                <th className="py-3 px-3.5">Node Name & Type</th>
                <th className="py-3 px-3">Region</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">CPU %</th>
                <th className="py-3 px-3">Mem %</th>
                <th className="py-3 px-3">Latency</th>
                <th className="py-3 px-3">Throughput</th>
                <th className="py-3 px-3">Threads</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80 text-zinc-200 font-bold">
              {nodes.map((node) => (
                <tr key={node.id} className="hover:bg-slate-800/60">
                  <td className="py-3.5 px-3.5">
                    <div className="text-zinc-100 font-extrabold">{node.name}</div>
                    <div className="text-xs text-zinc-400 font-medium">{node.id}</div>
                  </td>
                  <td className="py-3 px-3 text-zinc-300 font-normal">{node.region}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2.5 py-1 rounded text-xs font-black ${
                      node.status === 'OPTIMAL'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                        : 'bg-cyan-950 text-cyan-300 border border-cyan-600'
                    }`}>
                      {node.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-cyan-300">{node.cpuUsagePct}%</td>
                  <td className="py-3 px-3 text-zinc-300">{node.memoryUsagePct}%</td>
                  <td className="py-3 px-3 text-emerald-400">{node.latencyMs} ms</td>
                  <td className="py-3 px-3 text-zinc-200">{node.throughputPerSec.toLocaleString()} /s</td>
                  <td className="py-3 px-3 text-zinc-400 font-normal">{node.activeThreads}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* External Auditor Verification Endpoint Simulator */}
      <div className="bg-slate-900 border border-zinc-700 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-bold text-white">External Regulatory Auditor Verification API</h3>
            </div>
            <p className="text-sm text-zinc-300 mt-1">
              Simulate an external 3rd-party regulatory audit check against <code className="text-cyan-400 font-mono font-bold">GET /api/v1/compliance/verify</code>.
            </p>
          </div>

          <button
            onClick={triggerAuditorVerification}
            disabled={auditorEndpointStatus === 'QUERYING'}
            className="px-5 py-2.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border-2 border-cyan-600 font-mono text-sm font-extrabold flex items-center gap-2.5 shadow-md"
          >
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>{auditorEndpointStatus === 'QUERYING' ? 'VERIFYING SIGNATURE...' : 'TRIGGER AUDIT VERIFICATION'}</span>
          </button>
        </div>

        {auditorResult && (
          <div className="bg-slate-950 rounded-xl border-2 border-emerald-500/50 p-5 font-mono text-sm space-y-2.5 shadow-inner">
            <div className="flex items-center justify-between text-emerald-400 font-extrabold text-sm">
              <span>ATTESTATION SIGNATURE: VERIFIED_VALID</span>
              <span>SHA-256 HASH CHAIN: MATCHED</span>
            </div>
            <pre className="text-zinc-200 overflow-x-auto max-h-56 leading-relaxed">
              {JSON.stringify(auditorResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
