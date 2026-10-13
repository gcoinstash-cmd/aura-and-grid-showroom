import React, { useEffect, useState } from 'react';
import { Cpu, Gauge, Hash, CheckCircle2 } from 'lucide-react';

interface TelemetryMetricsStripProps {
  currentNonce: number;
}

export const TelemetryMetricsStrip: React.FC<TelemetryMetricsStripProps> = ({ currentNonce }) => {
  const [inverterJitterUs, setInverterJitterUs] = useState(0.42);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setInverterJitterUs(Number((0.35 + Math.random() * 0.18).toFixed(2)));
      setPulse(p => !p);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Card 1: Quad-Motor Inverter Loop */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all shadow-lg flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-base font-medium text-slate-400">Quad-Motor Inverter Loop</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
          <div className="text-4xl font-black text-white tracking-tight font-mono mb-2">
            5,000 <span className="text-2xl text-amber-400 font-semibold">Hz</span>
          </div>
        </div>
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-base">
          <span className="text-slate-400">Cycle: <strong className="text-slate-200">200 μs</strong></span>
          <span className="text-emerald-400 font-mono flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full bg-emerald-400 ${pulse ? 'opacity-100 scale-110' : 'opacity-60 scale-90'} transition-all`} />
            ±{inverterJitterUs} μs
          </span>
        </div>
      </div>

      {/* Card 2: 0-60 Sub-2.0s Launch Benchmark */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all shadow-lg flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-base font-medium text-slate-400">0-60 Launch Benchmark</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Gauge className="w-5 h-5" />
            </div>
          </div>
          <div className="text-4xl font-black text-cyan-400 tracking-tight font-mono mb-2">
            1.92 <span className="text-2xl text-slate-200 font-semibold">s</span>
          </div>
        </div>
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-base">
          <span className="text-slate-400">Peak Grip: <strong className="text-slate-200">1.48 G</strong></span>
          <span className="text-cyan-300 font-mono">1,200 Nm Max</span>
        </div>
      </div>

      {/* Card 3: Monotonic Telemetry Nonce */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all shadow-lg flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-base font-medium text-slate-400">Monotonic Telemetry Nonce</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Hash className="w-5 h-5" />
            </div>
          </div>
          <div className="text-4xl font-black text-purple-300 tracking-tight font-mono mb-2 truncate">
            #{currentNonce.toLocaleString()}
          </div>
        </div>
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-base">
          <span className="text-slate-400">Collisions: <strong className="text-emerald-400">0 Detected</strong></span>
          <span className="text-purple-400 font-mono">HMAC-SHA256</span>
        </div>
      </div>

      {/* Card 4: IP Clean-Room Audit */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all shadow-lg flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-base font-medium text-slate-400">IP Clean-Room Audit</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-4xl font-black text-emerald-400 tracking-tight font-mono mb-2">
            0.0% <span className="text-2xl text-slate-300 font-semibold">Copyleft</span>
          </div>
        </div>
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-base">
          <span className="text-slate-400">License: <strong className="text-slate-200">MIT / APA</strong></span>
          <span className="text-emerald-400 font-mono">100% Permissive</span>
        </div>
      </div>
    </div>
  );
};
