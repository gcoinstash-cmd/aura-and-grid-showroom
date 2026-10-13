import React from 'react';
import { 
  Zap, 
  Hash, 
  Gauge, 
  ShieldCheck, 
  ArrowUpRight, 
  Activity, 
  CheckCircle2 
} from 'lucide-react';
import { TelemetryMetrics } from '../types/engine';

interface TelemetryCardsProps {
  metrics: TelemetryMetrics;
  onOpenHmacAudit: () => void;
  onOpenCleanRoomDoc: () => void;
}

export const TelemetryCards: React.FC<TelemetryCardsProps> = ({
  metrics,
  onOpenHmacAudit,
  onOpenCleanRoomDoc,
}) => {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        
        {/* CARD 1: Engine Throughput */}
        <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 hover:border-amber-500/40 rounded-2xl p-6 shadow-xl transition-all duration-200 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-bl-full pointer-events-none"></div>
          
          <div className="flex items-center justify-between text-zinc-300 mb-3.5">
            <span className="text-base sm:text-lg font-mono uppercase font-black tracking-wider flex items-center gap-2.5">
              <Zap className="w-5 h-5 text-amber-400" />
              Engine Throughput
            </span>
            <span className="flex items-center gap-2 text-sm sm:text-base font-mono text-emerald-300 font-bold bg-emerald-950/60 border border-emerald-500/40 px-3 py-1 rounded-xl">
              <Activity className="w-4 h-4 animate-pulse text-emerald-400" />
              LOCK-FREE
            </span>
          </div>

          {/* Metric Value: Text 3xl / 4xl font-black */}
          <div className="my-2.5">
            <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white group-hover:text-amber-300 transition-colors">
              {metrics.opsPerSec.toLocaleString()}
            </div>
            <div className="text-sm font-mono font-medium text-zinc-400 mt-1">
              ops / second
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-zinc-800 flex items-center justify-between text-base sm:text-lg font-mono text-zinc-300 font-semibold">
            <span>Peak: {metrics.peakOpsPerSec.toLocaleString()} ops/s</span>
            <span className="text-emerald-400 font-bold">RingBuf: {metrics.ringBufferOccupancy}%</span>
          </div>
        </div>

        {/* CARD 2: Monotonic Sequence Counter */}
        <div 
          onClick={onOpenHmacAudit}
          className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 hover:border-emerald-500/40 rounded-2xl p-6 shadow-xl transition-all duration-200 group relative overflow-hidden cursor-pointer"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full pointer-events-none"></div>

          <div className="flex items-center justify-between text-zinc-300 mb-3.5">
            <span className="text-base sm:text-lg font-mono uppercase font-black tracking-wider flex items-center gap-2.5">
              <Hash className="w-5 h-5 text-emerald-400" />
              Monotonic Sequence
            </span>
            <span className="text-sm sm:text-base font-mono text-emerald-300 font-bold bg-emerald-950/60 border border-emerald-500/40 px-3 py-1 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ZERO-SKIP
            </span>
          </div>

          {/* Metric Value */}
          <div className="my-2.5">
            <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-emerald-400 group-hover:text-emerald-300 transition-colors">
              #{metrics.monotonicSequence.toLocaleString()}
            </div>
            <div className="text-sm font-mono font-medium text-zinc-400 mt-1">
              strict sequence counter
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-sm font-mono text-zinc-300 font-medium">
            <span>Chain: SHA-256</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              Verify HMAC <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
        </div>

        {/* CARD 3: Deterministic Latency */}
        <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 hover:border-cyan-500/40 rounded-2xl p-6 shadow-xl transition-all duration-200 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-bl-full pointer-events-none"></div>

          <div className="flex items-center justify-between text-zinc-300 mb-3.5">
            <span className="text-base sm:text-lg font-mono uppercase font-black tracking-wider flex items-center gap-2.5">
              <Gauge className="w-5 h-5 text-cyan-400" />
              Deterministic Latency
            </span>
            <span className="text-sm sm:text-base font-mono text-cyan-300 font-bold bg-cyan-950/60 border border-cyan-500/40 px-3 py-1 rounded-xl">
              SLA &lt; 1.20 ms
            </span>
          </div>

          {/* Metric Value */}
          <div className="my-2.5">
            <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white group-hover:text-cyan-300 transition-colors">
              {metrics.p99LatencyMs.toFixed(2)}
              <span className="text-2xl sm:text-3xl font-bold text-cyan-400 ml-1.5">ms</span>
            </div>
            <div className="text-sm font-mono font-medium text-zinc-400 mt-1">
              p99 matching latency
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-sm font-mono text-zinc-300 font-medium">
            <span>p50: {metrics.p50LatencyMs.toFixed(2)} ms</span>
            <span className="text-cyan-400 font-bold">p99.9: {metrics.p999LatencyMs.toFixed(2)} ms</span>
          </div>
        </div>

        {/* CARD 4: IP Clean-Room Audit */}
        <div 
          onClick={onOpenCleanRoomDoc}
          className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 hover:border-purple-500/40 rounded-2xl p-6 shadow-xl transition-all duration-200 group relative overflow-hidden cursor-pointer"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-bl-full pointer-events-none"></div>

          <div className="flex items-center justify-between text-zinc-300 mb-3.5">
            <span className="text-base sm:text-lg font-mono uppercase font-black tracking-wider flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
              IP Clean-Room Audit
            </span>
            <span className="text-sm sm:text-base font-mono text-purple-300 font-bold bg-purple-950/60 border border-purple-500/40 px-3 py-1 rounded-xl">
              ZERO COPYLEFT
            </span>
          </div>

          {/* Metric Value */}
          <div className="my-2.5">
            <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-purple-300 group-hover:text-purple-200 transition-colors">
              {metrics.cleanRoomScore}%
            </div>
            <div className="text-sm font-mono font-medium text-zinc-400 mt-1">
              permissive MIT / BSD
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-sm font-mono text-zinc-300 font-medium">
            <span>GPL / AGPL: 0.0%</span>
            <span className="text-purple-400 font-bold flex items-center gap-1">
              Audit Warrant <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
        </div>

      </div>
    </section>
  );
};
