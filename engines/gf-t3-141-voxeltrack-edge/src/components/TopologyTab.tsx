/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Share2, 
  Cpu, 
  Database, 
  Zap, 
  Layers, 
  ArrowRight, 
  CheckCircle2, 
  Activity, 
  Server, 
  HardDrive, 
  Radio, 
  ShieldCheck 
} from 'lucide-react';

export const TopologyTab: React.FC = () => {
  const [activeStage, setActiveStage] = useState<number>(1);

  const stages = [
    {
      id: 0,
      title: 'Stage 0: Zero-Copy Kernel Bypass Ingest',
      tech: 'AF_XDP Socket Driver + Pinned POSIX shm',
      latency: '0.42 ms',
      memory: 'Ring Buffer: 512 MB (/dev/shm/voxeltrack_ingest_ring)',
      throughput: '12.4M points/sec (64-beam UDP/pcap)',
      details: 'Ingests raw LiDAR packets directly from hardware NIC into pinned user-space virtual memory without kernel context switches. Synchronized via IEEE 1588v2 PTP hardware timestamps with sub-microsecond precision.'
    },
    {
      id: 1,
      title: 'Stage 1: TensorRT PointPillars & SE(3) Projection',
      tech: 'CUDA 12.4 + TensorRT FP16 Acceleration',
      latency: '2.84 ms',
      memory: 'GPU VRAM: 1.84 GB Pinned DMA',
      throughput: '125 FPS continuous batching',
      details: 'Projects 64-beam spherical coordinates into vehicle ego-frame via SE(3) homogeneous matrix transform. Executes CUDA PointPillars neural encoder to extract 3D spatial pillar features and segment ground planes.'
    },
    {
      id: 2,
      title: 'Stage 2: Dynamic Octree 3D Voxel Hash Generator',
      tech: 'Morton-Code Z-Order 64-bit Bitmask',
      latency: '1.68 ms',
      memory: 'Octree Nodes: 14,280 (0.1m³ Res)',
      throughput: 'Sub-150µs neighbor lookup',
      details: 'Constructs an 8-level hierarchical 3D octree over a [-80m, +80m] bounding envelope. Applies Bayesian occupancy updates with fast free-space ray-casting evaporation to discard transient ghost obstacles.'
    },
    {
      id: 3,
      title: 'Stage 3: 11-D Kinematic Kalman & Hungarian Association',
      tech: 'GIoU-3D Metric + LAPJV Solver',
      latency: '1.45 ms',
      memory: 'Track Table: 64 Active Targets',
      throughput: '99.8% Association Accuracy',
      details: 'Maintains state vectors [px, py, pz, vx, vy, vz, ax, ay, yaw, yaw_rate, scale] for all vehicles, pedestrians, and obstacles. Solves bipartite assignment via Generalized 3D IoU bounding matrix matrix.'
    },
    {
      id: 4,
      title: 'Stage 4: Collision Horizon & AlloyDB Async Writeback',
      tech: 'Lockless IPC Ring + AlloyDB COPY Pipeline',
      latency: '0.95 ms',
      memory: 'AlloyDB Batch: 25ms Flush Horizon',
      throughput: 'CAN-FD / Ethernet Evasive Trigger',
      details: 'Calculates continuous Time-to-Collision (TTC). If TTC <= 1.2s, fires immediate emergency braking signals over CAN-FD and asynchronously flushes full 3D spatial sweep frames into AlloyDB PostGIS tables.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-zinc-800 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-500/30">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Parallel Perception Pipeline & Hardware Topology
            </h3>
            <p className="text-sm text-zinc-400 font-mono">
              Deterministic Lockless Ring-Buffers • CPU-GPU Unified Virtual Addressing (UVA)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded bg-purple-950/80 border border-purple-500/30 text-purple-300 font-mono text-xs font-bold">
            P99 LOOP: 7.34 ms
          </span>
          <span className="px-3 py-1 rounded bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-bold">
            125Hz REAL-TIME
          </span>
        </div>
      </div>

      {/* Interactive Topology Pipeline Block Diagram */}
      <div className="p-6 rounded-xl bg-slate-900/90 border border-zinc-800 shadow-xl space-y-6">
        <div className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
          END-TO-END DATAFLOW PIPELINE (CLICK ANY STAGE TO INSPECT ARCHITECTURE)
        </div>

        {/* Pipeline Stage Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {stages.map((stage) => {
            const isSelected = activeStage === stage.id;
            return (
              <button
                key={stage.id}
                onClick={() => setActiveStage(stage.id)}
                className={`p-3.5 rounded-xl border text-left transition-all relative ${
                  isSelected
                    ? 'bg-slate-950 border-cyan-500 shadow-lg shadow-cyan-950/50 text-white'
                    : 'bg-slate-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-cyan-300">
                    STAGE {stage.id}
                  </span>
                  <span className="text-xs font-mono text-emerald-400 font-bold">
                    {stage.latency}
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-100 line-clamp-2">
                  {stage.title.split(': ')[1]}
                </div>
                <div className="text-[11px] font-mono text-zinc-500 mt-2 line-clamp-1">
                  {stage.tech}
                </div>
                {isSelected && (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-2 bg-cyan-500 clip-triangle" />
                )}
              </button>
            );
          })}
        </div>

        {/* Stage Deep Dive Inspector */}
        <div className="p-5 rounded-xl bg-slate-950 border border-cyan-500/40 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
            <div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                ACTIVE PIPELINE NODE
              </span>
              <h4 className="text-lg font-bold text-white mt-1">
                {stages[activeStage].title}
              </h4>
            </div>
            <div className="flex items-center gap-3 font-mono text-xs">
              <span className="text-zinc-400">P99 LATENCY:</span>
              <span className="text-emerald-400 font-bold text-sm">{stages[activeStage].latency}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
            <div className="p-3 rounded-lg bg-slate-900 border border-zinc-800">
              <span className="text-zinc-500 block text-[10px] uppercase">RUNTIME ENGINE</span>
              <span className="text-cyan-300 font-bold text-sm">{stages[activeStage].tech}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-zinc-800">
              <span className="text-zinc-500 block text-[10px] uppercase">MEMORY ALLOCATION</span>
              <span className="text-purple-300 font-bold text-sm">{stages[activeStage].memory}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-zinc-800">
              <span className="text-zinc-500 block text-[10px] uppercase">THROUGHPUT CAPACITY</span>
              <span className="text-emerald-300 font-bold text-sm">{stages[activeStage].throughput}</span>
            </div>
          </div>

          <p className="text-sm text-zinc-300 leading-relaxed font-sans">
            {stages[activeStage].details}
          </p>
        </div>

        {/* System Architecture Specifications Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
          <div className="p-3 rounded-lg bg-slate-950 border border-zinc-800">
            <div className="text-zinc-500 text-[10px]">CPU CORE PINNING</div>
            <div className="text-white font-bold text-sm mt-0.5">ISOLCPUS 2-9 (8 Cores)</div>
            <div className="text-zinc-400 text-[11px] mt-1">Zero context switch jitter</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-zinc-800">
            <div className="text-zinc-500 text-[10px]">MEMORY BANDWIDTH</div>
            <div className="text-cyan-300 font-bold text-sm mt-0.5">118.4 GB/s (PCIe 5.0)</div>
            <div className="text-zinc-400 text-[11px] mt-1">DMA Direct memory bus</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-zinc-800">
            <div className="text-zinc-500 text-[10px]">ALLOYDB BATCH WRITER</div>
            <div className="text-purple-300 font-bold text-sm mt-0.5">25ms Micro-Flush COPY</div>
            <div className="text-zinc-400 text-[11px] mt-1">Async non-blocking worker</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-zinc-800">
            <div className="text-zinc-500 text-[10px]">SAFETY ASSURANCE</div>
            <div className="text-emerald-400 font-bold text-sm mt-0.5">ISO 26262 ASIL-D</div>
            <div className="text-zinc-400 text-[11px] mt-1">Fault-tolerant dual watchdog</div>
          </div>
        </div>
      </div>
    </div>
  );
};
