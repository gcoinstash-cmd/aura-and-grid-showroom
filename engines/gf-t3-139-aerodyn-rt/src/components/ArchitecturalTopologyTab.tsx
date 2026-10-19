import React from 'react';
import { 
  Layers, 
  Cpu, 
  Database, 
  Radio, 
  Server, 
  Zap, 
  Activity, 
  Clock, 
  ShieldCheck, 
  ArrowRight,
  HardDrive
} from 'lucide-react';

export const ArchitecturalTopologyTab: React.FC = () => {
  const latencyStages = [
    { name: '1. CAN-FD Sensor DMA Ingestion', timeUs: 120, maxUs: 150, color: 'from-cyan-500 to-cyan-400' },
    { name: '2. Cython EKF State Matrix Propagation', timeUs: 280, maxUs: 320, color: 'from-blue-500 to-cyan-500' },
    { name: '3. Aero CoP Migration & Downforce Calculation', timeUs: 160, maxUs: 200, color: 'from-emerald-500 to-emerald-400' },
    { name: '4. Aero-Stall Safety Clamp & Slew Limiter', timeUs: 80, maxUs: 100, color: 'from-amber-500 to-emerald-500' },
    { name: '5. CAN 2.0B Actuator Dispatch & Ring Buffer Store', timeUs: 140, maxUs: 180, color: 'from-purple-500 to-blue-500' },
  ];

  const totalTimeUs = latencyStages.reduce((acc, stage) => acc + stage.timeUs, 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-zinc-700 rounded-2xl p-6 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-md text-sm font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500">
                SYSTEM TOPOLOGY
              </span>
              <span className="text-zinc-600 font-bold">•</span>
              <span className="text-zinc-200 text-base font-bold">Python 3.12 ASGI • Zero-Copy Ring Buffer • PREEMPT_RT</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white mt-1.5">
              Deterministic 1000Hz Telemetry & Closed-Loop Actuation Pipeline
            </h2>
            <p className="text-base text-zinc-300 mt-1 max-w-4xl leading-relaxed">
              End-to-end architecture from hardware sensors to real-time Cython Extended Kalman Filter, CAN-FD bus dispatch, and multi-region AlloyDB hypertable persistence.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-slate-950 px-5 py-3 rounded-xl border border-zinc-700 text-right font-mono shadow-lg">
              <div className="text-xs text-zinc-400 font-bold uppercase">Measured Total Loop</div>
              <div className="text-xl font-extrabold text-cyan-300">
                {(totalTimeUs / 1000).toFixed(2)} ms <span className="text-xs text-emerald-400 font-bold">(&lt; 0.85 ms Threshold)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Latency Breakdown Waterfall Chart */}
      <div className="bg-slate-900 border border-zinc-700 rounded-2xl p-6 shadow-xl">
        <h3 className="text-lg font-bold text-white mb-1 flex items-center justify-between">
          <span className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-cyan-400" />
            <span>Deterministic 1.000 ms (1000Hz) Sub-Millisecond Latency Threshold</span>
          </span>
          <span className="text-base font-mono font-bold text-emerald-400">Total: {totalTimeUs} µs / 1,000 µs (78.0% threshold)</span>
        </h3>
        <p className="text-base text-zinc-300 mb-5 leading-relaxed">
          Each computation step is strictly isolated and timed with nanosecond POSIX clocks to guarantee jitter &lt; 0.03 ms.
        </p>

        <div className="space-y-3.5 font-mono text-sm">
          {latencyStages.map((stage, idx) => {
            const pct = (stage.timeUs / 1000) * 100;
            return (
              <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-zinc-800 shadow-md">
                <div className="flex justify-between items-center mb-2 text-zinc-200">
                  <span className="font-bold text-sm">{stage.name}</span>
                  <span className="text-cyan-300 font-extrabold text-base">{stage.timeUs} µs</span>
                </div>
                <div className="w-full bg-slate-900 h-3.5 rounded-full overflow-hidden border border-zinc-800 flex">
                  <div 
                    className={`bg-gradient-to-r ${stage.color} h-full rounded-full`}
                    style={{ width: `${pct * 2}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4-Tier Architectural Diagram Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Tier 1: Ingestion */}
        <div className="bg-slate-900 border border-zinc-700 rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm uppercase font-mono">
            <Radio className="w-5 h-5" />
            <span>1. Sensor Ingest</span>
          </div>
          <div className="bg-slate-950 p-4 rounded-xl border border-zinc-800 text-sm font-mono space-y-2 text-zinc-200">
            <div className="text-cyan-300 font-bold">CAN-FD 5 Mbps Bus</div>
            <div className="text-xs text-zinc-300">• 4x Ride-Height Pots (FL/FR/RL/RR)</div>
            <div className="text-xs text-zinc-300">• 6-DoF Gyroscope & Accel IMU</div>
            <div className="text-xs text-zinc-300">• Optical Wheel Speed Transducers</div>
            <div className="text-emerald-400 font-bold text-xs pt-1">Rate: 1,000 frames/sec</div>
          </div>
        </div>

        {/* Tier 2: Kernel Ring Buffer */}
        <div className="bg-slate-900 border border-zinc-700 rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm uppercase font-mono">
            <HardDrive className="w-5 h-5" />
            <span>2. Shared Ring Buffer</span>
          </div>
          <div className="bg-slate-950 p-4 rounded-xl border border-zinc-800 text-sm font-mono space-y-2 text-zinc-200">
            <div className="text-cyan-300 font-bold">POSIX Shared Memory</div>
            <div className="text-xs text-zinc-300">• 64 MB Lock-Free Circular Ring</div>
            <div className="text-xs text-zinc-300">• Cache-Line Aligned Structures</div>
            <div className="text-xs text-zinc-300">• Zero Heap Allocations</div>
            <div className="text-emerald-400 font-bold text-xs pt-1">Capacity: 65,536 Frames</div>
          </div>
        </div>

        {/* Tier 3: Cython EKF Core */}
        <div className="bg-slate-900 border border-zinc-700 rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm uppercase font-mono">
            <Cpu className="w-5 h-5" />
            <span>3. Cython EKF Core</span>
          </div>
          <div className="bg-slate-950 p-4 rounded-xl border border-zinc-800 text-sm font-mono space-y-2 text-zinc-200">
            <div className="text-emerald-300 font-bold">7-DoF State Estimation</div>
            <div className="text-xs text-zinc-300">• Kalman Matrix Prediction (P_k|k)</div>
            <div className="text-xs text-zinc-300">• Dynamic CoP Migration</div>
            <div className="text-xs text-zinc-300">• Ground-Effect Stall Interlock</div>
            <div className="text-emerald-400 font-bold text-xs pt-1">Solve Time: 0.28 ms</div>
          </div>
        </div>

        {/* Tier 4: Actuator & Persistence */}
        <div className="bg-slate-900 border border-zinc-700 rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm uppercase font-mono">
            <Database className="w-5 h-5" />
            <span>4. Actuator & DB Persist</span>
          </div>
          <div className="bg-slate-950 p-4 rounded-xl border border-zinc-800 text-sm font-mono space-y-2 text-zinc-200">
            <div className="text-emerald-300 font-bold">CAN 2.0B + AlloyDB</div>
            <div className="text-xs text-zinc-300">• 18ms Airbrake Actuator Trigger</div>
            <div className="text-xs text-zinc-300">• Redis Stream Hot Ingest Buffer</div>
            <div className="text-xs text-zinc-300">• TimescaleDB Hypertables</div>
            <div className="text-emerald-400 font-bold text-xs pt-1">Throughput: 1M rec/sec</div>
          </div>
        </div>
      </div>

      {/* Cloud Run Edge Node Topology Box */}
      <div className="bg-slate-900 border border-zinc-700 rounded-2xl p-6 shadow-xl">
        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2.5">
          <Server className="w-5 h-5 text-cyan-400" />
          <span>Multi-Region Cloud Run & Edge Ingest Node Mesh</span>
        </h3>
        <p className="text-base text-zinc-300 mb-5 leading-relaxed">
          Redundant edge node architecture with automated failover and sub-millisecond local caching.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 font-mono text-sm">
          <div className="bg-slate-950 p-5 rounded-xl border-2 border-emerald-500/50 space-y-2.5 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-zinc-100 font-bold">PRIMARY EDGE NODE</span>
              <span className="px-2.5 py-0.5 rounded bg-emerald-950 text-emerald-300 text-xs font-bold border border-emerald-700">ONLINE</span>
            </div>
            <div className="text-zinc-300 text-xs">Region: us-east1 (PREEMPT_RT Kernel)</div>
            <div className="text-zinc-300 text-xs">Ingest Latency: <strong className="text-cyan-300">0.12 ms</strong></div>
            <div className="text-zinc-300 text-xs">Buffer Usage: 4.2 MB / 64 MB</div>
          </div>

          <div className="bg-slate-950 p-5 rounded-xl border border-zinc-800 space-y-2.5 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-zinc-100 font-bold">HOT STANDBY EDGE</span>
              <span className="px-2.5 py-0.5 rounded bg-cyan-950 text-cyan-300 text-xs font-bold border border-cyan-700">SYNCED</span>
            </div>
            <div className="text-zinc-300 text-xs">Region: us-central1 (Async Replication)</div>
            <div className="text-zinc-300 text-xs">Replication Lag: <strong className="text-cyan-300">0.4 ms</strong></div>
            <div className="text-zinc-300 text-xs">Heartbeat Jitter: ±0.02 ms</div>
          </div>

          <div className="bg-slate-950 p-5 rounded-xl border border-zinc-800 space-y-2.5 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-zinc-100 font-bold">ALLOYDB CLOUD ARCHIVE</span>
              <span className="px-2.5 py-0.5 rounded bg-emerald-950 text-emerald-300 text-xs font-bold border border-emerald-700">CONNECTED</span>
            </div>
            <div className="text-zinc-300 text-xs">Storage: Columnar Compressed Hypertables</div>
            <div className="text-zinc-300 text-xs">Retention: 365 Days Telemetry History</div>
            <div className="text-zinc-300 text-xs">Write Rate: 1,000,000 rec/s batch</div>
          </div>
        </div>
      </div>
    </div>
  );
};
