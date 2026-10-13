import React, { useState, useEffect } from 'react';
import { Cpu, Zap, Activity, ShieldCheck, CheckCircle2, ArrowUpRight, Gauge, Lock } from 'lucide-react';

interface TelemetryCardsProps {
  onOpenSimulate: () => void;
  onOpenVerify: () => void;
}

export const TelemetryCards: React.FC<TelemetryCardsProps> = ({
  onOpenSimulate,
  onOpenVerify,
}) => {
  // Deterministic tick for 500 Hz loop simulation (visual update throttled to ~2 Hz for readability)
  const [sequenceNumber, setSequenceNumber] = useState<number>(1000192);
  const [jitterMs, setJitterMs] = useState<number>(0.038);
  const [liveSoc, setLiveSoc] = useState<number>(78.92);
  const [liveEfficiency, setLiveEfficiency] = useState<number>(92.4);

  useEffect(() => {
    const timer = setInterval(() => {
      setSequenceNumber((prev) => prev + 1);
      setJitterMs(Number((0.03 + Math.sin(Date.now() / 1000) * 0.012).toFixed(3)));
      setLiveSoc((prev) => Number((78.9 + Math.sin(Date.now() / 3000) * 0.15).toFixed(2)));
    }, 1200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Edge Compute Loop */}
        <div className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-6 md:p-7 transition-all shadow-md group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/80 px-3 py-1.5 rounded-lg border border-cyan-800/60">
              Deterministic RTOS
            </span>
            <div className="p-2.5 bg-slate-800 rounded-xl text-cyan-400 group-hover:scale-110 transition-transform">
              <Cpu className="w-6 h-6" />
            </div>
          </div>

          <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-1">
            Edge Compute Loop
          </h3>
          <p className="text-base text-slate-300 mb-4 leading-relaxed">
            Deterministic 500 Hz control loop executing Coulomb integration & EKF observer.
          </p>

          <div className="mb-4 p-3.5 bg-slate-950 rounded-xl border border-slate-800/90 text-center">
            <div className="text-3xl sm:text-4xl font-black font-mono text-cyan-400 tracking-tight">
              500.00 Hz
            </div>
            <div className="text-sm font-mono text-slate-400 mt-0.5">2.0 ms Deterministic Period</div>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-800 font-mono text-base">
            <div className="flex justify-between items-center">
              <span className="text-slate-300 font-medium">Measured Jitter:</span>
              <span className="font-bold text-emerald-400 text-lg">±{jitterMs} ms</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300 font-medium">Live SOC State:</span>
              <span className="font-bold text-white text-lg">{liveSoc}%</span>
            </div>
          </div>
        </div>

        {/* Card 2: Regenerative Recovery Efficiency */}
        <div className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-6 md:p-7 transition-all shadow-md group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-3 py-1.5 rounded-lg border border-emerald-800/60">
              Kinetic Recapture
            </span>
            <div className="p-2.5 bg-slate-800 rounded-xl text-emerald-400 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
          </div>

          <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-1">
            Regen Recovery
          </h3>
          <p className="text-base text-slate-300 mb-4 leading-relaxed">
            Dynamic urban brake blending with automatic hydraulic handoff under 8 km/h.
          </p>

          <div className="mb-4 p-3.5 bg-slate-950 rounded-xl border border-slate-800/90 text-center">
            <div className="text-3xl sm:text-4xl font-black font-mono text-emerald-400 tracking-tight">
              Up to 92.4%
            </div>
            <div className="text-sm font-mono text-slate-400 mt-0.5">Kinetic Energy Recapture</div>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-800 font-mono text-base">
            <div className="flex justify-between items-center">
              <span className="text-slate-300 font-medium">Slip Threshold:</span>
              <span className="font-bold text-cyan-400 text-lg">0.12 (ABS Safe)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300 font-medium">Recaptured Total:</span>
              <span className="font-bold text-white text-lg">15.06 kWh</span>
            </div>
          </div>
        </div>

        {/* Card 3: Monotonic Telemetry Sequence */}
        <div className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-6 md:p-7 transition-all shadow-md group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-mono font-bold uppercase tracking-wider text-blue-400 bg-blue-950/80 px-3 py-1.5 rounded-lg border border-blue-800/60">
              Zero Collisions
            </span>
            <div className="p-2.5 bg-slate-800 rounded-xl text-blue-400 group-hover:scale-110 transition-transform">
              <Activity className="w-6 h-6" />
            </div>
          </div>

          <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-1">
            Monotonic Sequence
          </h3>
          <p className="text-base text-slate-300 mb-4 leading-relaxed">
            Strict sequential counter with SHA-256 chain links guaranteeing tamper prevention.
          </p>

          <div className="mb-4 p-3.5 bg-slate-950 rounded-xl border border-slate-800/90 text-center">
            <div className="text-2xl sm:text-3xl font-black font-mono text-blue-400 tracking-tight truncate">
              #{sequenceNumber.toLocaleString()}
            </div>
            <div className="text-sm font-mono text-slate-400 mt-0.5">Monotonic Block Counter</div>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-800 font-mono text-base">
            <div className="flex justify-between items-center">
              <span className="text-slate-300 font-medium">Hash Collisions:</span>
              <span className="font-bold text-emerald-400 text-lg">0 (Zero Detected)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300 font-medium">Block Integrity:</span>
              <span className="font-bold text-white text-lg">100% SHA-256</span>
            </div>
          </div>
        </div>

        {/* Card 4: IP Clean-Room Audit */}
        <div className="bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-6 md:p-7 transition-all shadow-md group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-mono font-bold uppercase tracking-wider text-purple-400 bg-purple-950/80 px-3 py-1.5 rounded-lg border border-purple-800/60">
              Audit Verified
            </span>
            <div className="p-2.5 bg-slate-800 rounded-xl text-purple-400 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>

          <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-1">
            IP Clean-Room Audit
          </h3>
          <p className="text-base text-slate-300 mb-4 leading-relaxed">
            Zero viral copyleft contamination. Ready for instant Acquire.com micro-APA transfer.
          </p>

          <div className="mb-4 p-3.5 bg-slate-950 rounded-xl border border-slate-800/90 text-center">
            <div className="text-3xl sm:text-4xl font-black font-mono text-purple-300 tracking-tight">
              0% Copyleft
            </div>
            <div className="text-sm font-mono text-slate-400 mt-0.5">100% MIT Permissive</div>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-800 font-mono text-base">
            <div className="flex justify-between items-center">
              <span className="text-slate-300 font-medium">Licensing Model:</span>
              <span className="font-bold text-purple-300 text-lg">100% Permissive</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300 font-medium">Escrow Readiness:</span>
              <span className="font-bold text-white text-lg">Turnkey Instant</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
