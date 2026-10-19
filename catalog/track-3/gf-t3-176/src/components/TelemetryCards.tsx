import React from 'react';
import { Cpu, Gauge, Layers, ShieldCheck } from 'lucide-react';

interface TelemetryCardsProps {
  loopFrequencyHz: number;
  maxTravelInches: number;
  sequenceBlockCount: number;
  isCleanRoomCertified: boolean;
}

export const TelemetryCards: React.FC<TelemetryCardsProps> = ({
  loopFrequencyHz = 1000,
  maxTravelInches = 24.5,
  sequenceBlockCount = 1000420,
  isCleanRoomCertified = true,
}) => {
  return (
    <div className="relative w-full p-6 md:p-8 bg-neutral-950">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Suspension Loop Frequency */}
        <div className="relative bg-neutral-900 border border-neutral-800 rounded-xl p-6 transition-all hover:border-neutral-700">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <span className="text-base font-mono text-neutral-400 uppercase tracking-wider font-semibold">
              Control Loop
            </span>
            <Cpu className="w-5 h-5 text-amber-400" />
          </div>

          <div className="mt-4">
            <div className="text-3xl md:text-4xl font-extrabold text-white num-tabular tracking-tight">
              {loopFrequencyHz.toLocaleString()} Hz
            </div>
            <div className="mt-1.5 text-base font-semibold text-amber-400">
              Real-Time Hydraulic Valve Cycle
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-neutral-800/80 space-y-2.5 text-base text-neutral-200">
            <div className="flex justify-between items-center">
              <span className="text-neutral-400 font-medium">Valve Slew Latency:</span>
              <span className="font-mono font-bold text-white num-tabular">3.8 ms</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400 font-medium">Hydraulic Pressure:</span>
              <span className="font-mono font-bold text-emerald-400 num-tabular">14.2 MPa</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400 font-medium">Jitter Variance:</span>
              <span className="font-mono text-neutral-200 num-tabular">&lt; 14 µs</span>
            </div>
          </div>
        </div>

        {/* Card 2: Wheel Articulation Index */}
        <div className="relative bg-neutral-900 border border-neutral-800 rounded-xl p-6 transition-all hover:border-neutral-700">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <span className="text-base font-mono text-neutral-400 uppercase tracking-wider font-semibold">
              Kinematics
            </span>
            <Gauge className="w-5 h-5 text-emerald-400" />
          </div>

          <div className="mt-4">
            <div className="text-3xl md:text-4xl font-extrabold text-white num-tabular tracking-tight">
              {maxTravelInches.toFixed(1)} in
            </div>
            <div className="mt-1.5 text-base font-semibold text-emerald-400">
              Independent Wheel Articulation
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-neutral-800/80 space-y-2.5 text-base text-neutral-200">
            <div className="flex justify-between items-center">
              <span className="text-neutral-400 font-medium">Ramp Travel Index (RTI):</span>
              <span className="font-mono font-bold text-white num-tabular">685 (Decoupled)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400 font-medium">Front / Rear Bypass:</span>
              <span className="font-mono font-bold text-amber-400">Active Dynamic Kinetic Suspension Telemetry</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400 font-medium">Ground Clearance:</span>
              <span className="font-mono text-neutral-200 num-tabular">10.9 in</span>
            </div>
          </div>
        </div>

        {/* Card 3: Monotonic Terrain Sequence */}
        <div className="relative bg-neutral-900 border border-neutral-800 rounded-xl p-6 transition-all hover:border-neutral-700">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <span className="text-base font-mono text-neutral-400 uppercase tracking-wider font-semibold">
              Ledger State
            </span>
            <Layers className="w-5 h-5 text-sky-400" />
          </div>

          <div className="mt-4">
            <div className="text-3xl md:text-4xl font-extrabold text-white num-tabular tracking-tight">
              #{sequenceBlockCount.toLocaleString()}
            </div>
            <div className="mt-1.5 text-base font-semibold text-sky-400">
              Monotonic Terrain Sequence
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-neutral-800/80 space-y-2.5 text-base text-neutral-200">
            <div className="flex justify-between items-center">
              <span className="text-neutral-400 font-medium">Hash Collision Rate:</span>
              <span className="font-mono font-bold text-emerald-400">0.00% (Zero Collision)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400 font-medium">Ingestion Cadence:</span>
              <span className="font-mono font-bold text-white num-tabular">100 pkts/s</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400 font-medium">Postgres 16 Hypertable:</span>
              <span className="font-mono text-neutral-200">Partitioned M10</span>
            </div>
          </div>
        </div>

        {/* Card 4: IP Clean-Room Audit */}
        <div className="relative bg-neutral-900 border border-neutral-800 rounded-xl p-6 transition-all hover:border-neutral-700">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <span className="text-base font-mono text-neutral-400 uppercase tracking-wider font-semibold">
              Legal Due Diligence
            </span>
            <ShieldCheck className="w-5 h-5 text-purple-400" />
          </div>

          <div className="mt-4">
            <div className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              0% Copyleft
            </div>
            <div className="mt-1.5 text-base font-semibold text-purple-400">
              Clean-Room Certified Provenance
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-neutral-800/80 space-y-2.5 text-base text-neutral-200">
            <div className="flex justify-between items-center">
              <span className="text-neutral-400 font-medium">Permissive License:</span>
              <span className="font-bold text-emerald-400">100% MIT / Apache 2.0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400 font-medium">GPL / AGPL Contamination:</span>
              <span className="font-mono font-bold text-emerald-400">0% Detected</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400 font-medium">Acquire.com Escrow:</span>
              <span className="font-bold text-white">Pre-Approved Vault</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
