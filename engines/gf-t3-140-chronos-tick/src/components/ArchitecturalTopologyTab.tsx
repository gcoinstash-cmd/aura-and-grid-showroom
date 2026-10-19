import React, { useState } from 'react';
import { 
  Network, 
  Cpu, 
  Database, 
  Server, 
  Zap, 
  ShieldCheck, 
  Clock, 
  Layers, 
  ArrowRight, 
  CheckCircle2,
  Lock,
  Activity,
  Workflow
} from 'lucide-react';

interface TopologyNode {
  id: string;
  title: string;
  techStack: string;
  latencyBudget: string;
  description: string;
  specs: string[];
  status: string;
}

export const ArchitecturalTopologyTab: React.FC = () => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('almgren-engine');

  const nodes: TopologyNode[] = [
    {
      id: 'asgi-gateway',
      title: '1. FIX 4.4 / REST ASGI Gateway',
      techStack: 'Python 3.12 + Starlette/uvloop + C++ Parser',
      latencyBudget: '0.80 ms',
      status: 'HEALTHY / ACTIVE',
      description: 'Ingests parent execution mandates, performs cryptographic authentication, token-bucket rate limiting, and zero-allocation message parsing.',
      specs: [
        'Throughput: 120,000 req/sec per cluster node',
        'TLS 1.3 Termination with Hardware Offload',
        'Strict payload schema verification against OpenAPI 3.1 contract',
        'Connection pooling with institutional counterparties',
      ],
    },
    {
      id: 'almgren-engine',
      title: '2. Almgren-Chriss Slicing & Poisson Engine',
      techStack: 'NumPy / C-Extension Vectorized Math',
      latencyBudget: '1.40 ms',
      status: 'P99 DETERMINISTIC',
      description: 'Calculates optimal non-linear trading velocity trajectory sinh(κ(T - t))/sinh(κT) and Poisson-randomized arrival schedule.',
      specs: [
        'Quadratic variance-impact minimization: min E[x] + λ Var[x]',
        'Dynamic intraday U-shaped volume curve weighting',
        'Sub-millisecond matrix decomposition and risk penalty calculation',
        'Anti-footprint Poisson randomization preventing HFT front-running',
      ],
    },
    {
      id: 'redis-ringbuffer',
      title: '3. In-Memory RingBuffer Order Queue',
      techStack: 'Redis Cluster 7.2 + In-Memory Micro-Queue',
      latencyBudget: '0.60 ms',
      status: 'LOWEST JITTER (<0.2ms)',
      description: 'High-speed FIFO/Priority ring buffer maintaining child slices ready for instant monotonic dispatch to venue routing workers.',
      specs: [
        'Sub-millisecond memory latency with lock-free atomic pointers',
        'Redis persistence configured for low-overhead AOF',
        'Dynamic priority escalation for delayed child slices',
        'Instantaneous circuit-breaker purge on mandate abort command',
      ],
    },
    {
      id: 'multi-venue-router',
      title: '4. Multi-Exchange Low-Impact FIX Router',
      techStack: 'Asynchronous FIX Engine + Smart Order Routing',
      latencyBudget: '1.20 ms',
      status: '4/4 VENUES CONNECTED',
      description: 'Dispatches child slices concurrently across Coinbase Prime, Binance US, Kraken Institutional, and LMAX Digital using real-time liquidity book depth.',
      specs: [
        'Deterministic venue weight distribution based on top-of-book depth',
        'Passive post-only and IOC (Immediate-or-Cancel) execution policies',
        'Dynamic spread capture maximizing mid-market fill opportunities',
        'Automatic routing failover if venue latency spikes > 25ms',
      ],
    },
    {
      id: 'alloydb-ledger',
      title: '5. AlloyDB PostgreSQL Persistent ACID Ledger',
      techStack: 'Google Cloud AlloyDB (PostgreSQL 16 Engine)',
      latencyBudget: '0.80 ms (Async WAL)',
      status: 'RPO = 0 / RTO < 10s',
      description: 'Immutable append-only execution log, time-partitioned child order tables, and automated compliance slippage audit calculation.',
      specs: [
        'Recovery Point Objective (RPO) = 0 with synchronous WAL replication',
        'Recovery Time Objective (RTO) < 10 seconds with hot-standby auto-failover',
        'Composite B-tree indices on (symbol, scheduled_timestamp)',
        'Zero circular foreign keys with strict data integrity triggers',
      ],
    },
  ];

  const currentNode = nodes.find((n) => n.id === selectedNodeId) || nodes[1];

  return (
    <div className="space-y-6">
      
      {/* Topology Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Workflow className="w-6 h-6 text-cyan-400" />
            <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wide">
              Ultra-Low-Latency ASGI & AlloyDB System Topology
            </h2>
            <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
              GF-T3-141 ENGINE
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            End-to-end deterministic high-throughput quantitative execution pipeline engineered for strict 4.80 ms total latency envelope.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-950 border border-emerald-500/40 shrink-0">
          <Clock className="w-4 h-4 text-emerald-400" />
          <div className="text-xs font-mono">
            <span className="text-slate-400">Total Latency Threshold:</span>{' '}
            <span className="text-emerald-300 font-bold text-sm">4.80 ms (P99.9)</span>
          </div>
        </div>
      </div>

      {/* Latency Threshold Breakdown Bars */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
        <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span>Deterministic Latency Threshold Allocation (4.80 ms Total)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div className="text-xs text-slate-400 font-mono">1. FIX Ingest</div>
            <div className="text-lg font-black font-mono text-cyan-400 mt-0.5">0.80 ms</div>
            <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
              <div className="bg-cyan-400 h-full" style={{ width: '16.6%' }} />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div className="text-xs text-slate-400 font-mono">2. Almgren Slicing</div>
            <div className="text-lg font-black font-mono text-emerald-400 mt-0.5">1.40 ms</div>
            <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
              <div className="bg-emerald-400 h-full" style={{ width: '29.1%' }} />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div className="text-xs text-slate-400 font-mono">3. Redis RingQueue</div>
            <div className="text-lg font-black font-mono text-purple-400 mt-0.5">0.60 ms</div>
            <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
              <div className="bg-purple-400 h-full" style={{ width: '12.5%' }} />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div className="text-xs text-slate-400 font-mono">4. Multi-Router</div>
            <div className="text-lg font-black font-mono text-amber-400 mt-0.5">1.20 ms</div>
            <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
              <div className="bg-amber-400 h-full" style={{ width: '25.0%' }} />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div className="text-xs text-slate-400 font-mono">5. AlloyDB Audit</div>
            <div className="text-lg font-black font-mono text-teal-400 mt-0.5">0.80 ms</div>
            <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
              <div className="bg-teal-400 h-full" style={{ width: '16.6%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Topology Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Pipeline Nodes List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider px-1">
            Execution Pipeline Architecture
          </div>

          {nodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            return (
              <div
                key={node.id}
                onClick={() => setSelectedNodeId(node.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 border-cyan-500/60 shadow-lg shadow-cyan-950/40'
                    : 'bg-slate-950/70 border-slate-800 hover:bg-slate-900/50 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">
                    {node.title}
                  </span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                    {node.latencyBudget}
                  </span>
                </div>
                <div className="text-xs font-mono text-emerald-400 mt-1">
                  {node.techStack}
                </div>
                <div className="text-xs text-slate-400 mt-1.5 line-clamp-2">
                  {node.description}
                </div>
              </div>
            );
          })}
        </div>

        {/* Node Deep Dive Inspector (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                Component Telemetry & Architecture
              </span>
              <h3 className="text-lg font-black text-white mt-0.5">
                {currentNode.title}
              </h3>
            </div>
            <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
              {currentNode.status}
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
            <div className="text-xs font-mono text-slate-400 uppercase font-bold">Tech Stack & Runtime</div>
            <div className="text-sm font-mono font-bold text-emerald-300 mt-1">
              {currentNode.techStack}
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            {currentNode.description}
          </p>

          <div className="space-y-2 pt-2">
            <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
              Engineering Invariants & Specifications:
            </div>
            <div className="space-y-2">
              {currentNode.specs.map((spec, idx) => (
                <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded bg-slate-950/80 border border-slate-800/80">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm font-mono text-slate-200">{spec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* High-Availability Guarantee Callout */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 to-slate-900 border border-emerald-500/30 flex items-start gap-3 mt-4">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-mono font-bold text-emerald-300 uppercase">
                Zero-Data-Loss & RPO=0 SLA
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Every child slice executed across any exchange is synchronously written to WAL before client status acknowledgment. Automatic sub-10-second failover guarantees zero orphaned fills.
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
