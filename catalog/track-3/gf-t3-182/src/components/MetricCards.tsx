import React from 'react';
import { Cpu, Wind, Hash, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { AeroTelemetry } from '../types/aero';

interface MetricCardsProps {
  telemetry: AeroTelemetry;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ telemetry }) => {
  return (
    <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Aero Control Loop */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-sm font-medium uppercase tracking-wider text-slate-300">
              Aero Control Loop
            </span>
            <Cpu className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-white tabular-nums">
            1,000 Hz
          </div>
          <div className="mt-3 text-sm text-slate-300 font-medium flex items-center justify-between">
            <span>Real-Time Surface Optimization</span>
            <span className="font-mono text-cyan-400">1.0 ms dt</span>
          </div>
          <div className="mt-2 text-sm text-slate-400">
            Active dual brushless servo bus with dual-redundant CAN-FD channel sync.
          </div>
        </div>

        {/* Card 2: Net Downforce Vector */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-sm font-medium uppercase tracking-wider text-slate-300">
              Net Downforce Vector
            </span>
            <Wind className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-white tabular-nums flex items-baseline gap-2">
            <span>{telemetry.totalDownforceN.toLocaleString()}</span>
            <span className="text-lg font-normal text-slate-400 font-sans">N</span>
          </div>
          <div className="mt-3 text-sm text-slate-300 font-medium flex items-center justify-between">
            <span>Peak 3,850 N @ 250 km/h</span>
            <span className="font-mono text-emerald-400">
              {Math.round(telemetry.totalDownforceN / 9.80665)} kgf
            </span>
          </div>
          <div className="mt-2 text-sm text-slate-400">
            Split: {telemetry.frontAeroBalancePct}% Front / {telemetry.rearAeroBalancePct}% Rear aerodynamic balance.
          </div>
        </div>

        {/* Card 3: Monotonic Telemetry Sequence */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-sm font-medium uppercase tracking-wider text-slate-300">
              Monotonic Telemetry Nonce
            </span>
            <Hash className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-white tabular-nums">
            #{telemetry.sequenceNonce.toLocaleString()}
          </div>
          <div className="mt-3 text-sm text-slate-300 font-medium flex items-center justify-between">
            <span>1,000,000+ Continuous Nonces</span>
            <span className="font-mono text-emerald-400">Zero Gaps</span>
          </div>
          <div className="mt-2 text-sm text-slate-400 truncate font-mono">
            Chain: {telemetry.currentHash ? telemetry.currentHash.substring(0, 18) : '000000000000000000'}...
          </div>
        </div>

        {/* Card 4: IP Clean-Room Audit */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-sm font-medium uppercase tracking-wider text-slate-300">
              IP Clean-Room Audit
            </span>
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-emerald-400">
            0% Copyleft
          </div>
          <div className="mt-3 text-sm text-slate-300 font-medium flex items-center justify-between">
            <span>Clean-Room Certified</span>
            <span className="font-mono text-white">MIT / BSD</span>
          </div>
          <div className="mt-2 text-sm text-slate-400">
            Zero GPL / AGPL / SSPL code. Fully unencumbered asset ready for immediate APA transfer.
          </div>
        </div>
      </div>
    </div>
  );
};
