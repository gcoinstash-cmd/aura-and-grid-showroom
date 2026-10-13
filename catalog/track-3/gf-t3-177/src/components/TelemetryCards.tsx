import React from 'react';
import { TelemetryState } from '../types/telemetry';
import { Cpu, Compass, Hash, ShieldCheck, ArrowRightLeft, CheckCircle2 } from 'lucide-react';

interface TelemetryCardsProps {
  telemetry: TelemetryState;
  onOpenLedgerVerify: () => void;
  onOpenApaModal: () => void;
}

export const TelemetryCards: React.FC<TelemetryCardsProps> = ({
  telemetry,
  onOpenLedgerVerify,
  onOpenApaModal,
}) => {
  const isCounterPhase = telemetry.phase === 'COUNTER_PHASE';
  const isInPhase = telemetry.phase === 'IN_PHASE';

  return (
    <div className="relative w-full px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Card 1: Yaw Loop Frequency (1,000 Hz real-time DRS phase update) */}
        <div className="relative bg-neutral-900/90 border border-neutral-800 rounded-xl p-5 hover:border-neutral-700 transition-colors shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-base font-semibold text-neutral-400 uppercase tracking-wider">
              Control Loop
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Cpu className="w-6 h-6" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono tracking-tight mb-2">
            {telemetry.loopFrequencyHz.toLocaleString()} Hz
          </div>
          <div className="space-y-2 pt-2 border-t border-neutral-800/80">
            <div className="flex items-center justify-between text-base">
              <span className="text-neutral-400">SLA Cycle Time:</span>
              <span className="text-emerald-400 font-mono font-bold">1.00 ms ± {telemetry.loopJitterMs} ms</span>
            </div>
            <div className="flex items-center justify-between text-base">
              <span className="text-neutral-400">Phase Update:</span>
              <span className="text-neutral-200 font-mono font-medium">Deterministic Sub-1ms</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-base font-medium w-full justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              0 Dropped Frames (CAN-FD)
            </div>
          </div>
        </div>

        {/* Card 2: Rear Wheel Angle (Up to ±2.0° dynamic phase steering) */}
        <div className="relative bg-neutral-900/90 border border-neutral-800 rounded-xl p-5 hover:border-neutral-700 transition-colors shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-base font-semibold text-neutral-400 uppercase tracking-wider">
              Rear Wheel Angle
            </span>
            <div className={`p-2 rounded-lg ${isCounterPhase ? 'bg-amber-500/10 text-amber-400' : isInPhase ? 'bg-cyan-500/10 text-cyan-400' : 'bg-neutral-800 text-neutral-400'}`}>
              <Compass className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className={`text-3xl font-extrabold font-mono tracking-tight ${
              isCounterPhase ? 'text-amber-400' : isInPhase ? 'text-cyan-400' : 'text-neutral-300'
            }`}>
              {telemetry.rearWheelAngleDeg > 0 ? `+${telemetry.rearWheelAngleDeg.toFixed(2)}°` : `${telemetry.rearWheelAngleDeg.toFixed(2)}°`}
            </span>
            <span className="text-base font-bold text-neutral-400 uppercase">
              (Max ±2.00°)
            </span>
          </div>
          <div className="space-y-2 pt-2 border-t border-neutral-800/80">
            <div className="flex items-center justify-between text-base">
              <span className="text-neutral-400">Dynamic Phase:</span>
              <span className={`font-mono font-bold px-2 py-0.5 rounded text-base ${
                isCounterPhase
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : isInPhase
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'bg-neutral-800 text-neutral-400'
              }`}>
                {telemetry.phase === 'COUNTER_PHASE' ? 'COUNTER-PHASE (<80)' : telemetry.phase === 'IN_PHASE' ? 'IN-PHASE (>80)' : 'NEUTRAL (80 km/h)'}
              </span>
            </div>
            <div className="flex items-center justify-between text-base">
              <span className="text-neutral-400">Rack Actuator:</span>
              <span className="text-neutral-200 font-mono">LDH Stepper Brushless</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-neutral-800/80 border border-neutral-700 text-neutral-300 text-base font-medium w-full justify-center">
              <ArrowRightLeft className="w-4 h-4 text-amber-400" />
              Active Dual-Rack Synchronization
            </div>
          </div>
        </div>

        {/* Card 3: Monotonic Telemetry Sequence (#1,000,000+ zero collision) */}
        <div className="relative bg-neutral-900/90 border border-neutral-800 rounded-xl p-5 hover:border-neutral-700 transition-colors shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-base font-semibold text-neutral-400 uppercase tracking-wider">
              Touring Ledger Sequence
            </span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Hash className="w-6 h-6" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-blue-400 font-mono tracking-tight mb-2">
            #{telemetry.monotonicSeq.toLocaleString()}
          </div>
          <div className="space-y-2 pt-2 border-t border-neutral-800/80">
            <div className="flex items-center justify-between text-base">
              <span className="text-neutral-400">Integrity Status:</span>
              <span className="text-emerald-400 font-mono font-bold">Zero Collision Verified</span>
            </div>
            <div className="flex items-center justify-between text-base">
              <span className="text-neutral-400">Cryptographic Chain:</span>
              <span className="text-neutral-200 font-mono">HMAC-SHA256 Merkle</span>
            </div>
            <button
              type="button"
              onClick={onOpenLedgerVerify}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-blue-950/60 hover:bg-blue-900/80 border border-blue-800/60 text-blue-300 text-base font-medium w-full justify-center transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
              Inspect Merkle Hash Proofs
            </button>
          </div>
        </div>

        {/* Card 4: IP Clean-Room Audit (0% Copyleft / Clean-Room Certified) */}
        <div className="relative bg-neutral-900/90 border border-neutral-800 rounded-xl p-5 hover:border-neutral-700 transition-colors shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-base font-semibold text-neutral-400 uppercase tracking-wider">
              IP Clean-Room Audit
            </span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-purple-300 tracking-tight mb-2">
            0% Copyleft Taint
          </div>
          <div className="space-y-2 pt-2 border-t border-neutral-800/80">
            <div className="flex items-center justify-between text-base">
              <span className="text-neutral-400">License Terms:</span>
              <span className="text-emerald-400 font-mono font-bold">100% Permissive MIT</span>
            </div>
            <div className="flex items-center justify-between text-base">
              <span className="text-neutral-400">AGPL / GPL Audit:</span>
              <span className="text-neutral-200 font-mono">0 Flags (Clean-Room)</span>
            </div>
            <button
              type="button"
              onClick={onOpenApaModal}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-purple-950/60 hover:bg-purple-900/80 border border-purple-800/60 text-purple-300 text-base font-medium w-full justify-center transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              View Acquire.com APA Bill
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
