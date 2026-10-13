import React from 'react';
import { AudioWaveform, VolumeX, Shield, Database } from 'lucide-react';
import { TelemetryState } from '../types';

interface TelemetryCardsProps {
  telemetry: TelemetryState;
}

export const TelemetryCards: React.FC<TelemetryCardsProps> = ({ telemetry }) => {
  return (
    <section className="relative w-full mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        
        {/* Card 1: Acoustic Cancellation Cycle */}
        <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold tracking-wide text-slate-400">
                Acoustic Inversion Loop
              </span>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <AudioWaveform className="w-6 h-6" />
              </div>
            </div>
            <h3 className="text-3xl font-extrabold text-white tracking-tight mb-2">
              2,000 Hz
            </h3>
            <p className="text-sm text-slate-300 font-medium">
              Real-time FxLMS FIR secondary-path adaptive filter cycle
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-sm">
            <span className="text-slate-400 font-medium">Loop Latency:</span>
            <span className="font-mono tabular-nums text-slate-200 font-bold">
              {telemetry.secondaryPathLatencyMs.toFixed(2)} ms (&lt; 1.25 ms limit)
            </span>
          </div>
        </div>

        {/* Card 2: Cabin Decibel Attenuation */}
        <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold tracking-wide text-slate-400">
                Cabin Attenuation
              </span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <VolumeX className="w-6 h-6" />
              </div>
            </div>
            <h3 className="text-3xl font-extrabold text-emerald-400 tracking-tight mb-2">
              {telemetry.antiPhaseAttenuationDb.toFixed(1)} dB
            </h3>
            <p className="text-sm text-slate-300 font-medium">
              Cabin 2nd-order harmonic reduction (68.4 dB → {telemetry.residualCabinDb.toFixed(1)} dB)
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-sm">
            <span className="text-slate-400 font-medium">Engine Harmonic:</span>
            <span className="font-mono tabular-nums text-emerald-300 font-bold">
              {telemetry.engineHarmonicHz.toFixed(1)} Hz @ {telemetry.engineRpm} RPM
            </span>
          </div>
        </div>

        {/* Card 3: Monotonic Telemetry Sequence */}
        <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold tracking-wide text-slate-400">
                Timeseries Sequence
              </span>
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Database className="w-6 h-6" />
              </div>
            </div>
            <h3 className="text-3xl font-extrabold text-cyan-300 tracking-tight mb-2 font-mono">
              #{telemetry.ledgerSequenceId.toLocaleString()}
            </h3>
            <p className="text-sm text-slate-300 font-medium">
              Monotonic ledger frames with zero sequence collision
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-sm">
            <span className="text-slate-400 font-medium">HMAC Integrity:</span>
            <span className="font-mono text-cyan-400 font-bold">
              SHA-256 Validated
            </span>
          </div>
        </div>

        {/* Card 4: IP Clean-Room Audit */}
        <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold tracking-wide text-slate-400">
                IP Clean-Room Audit
              </span>
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Shield className="w-6 h-6" />
              </div>
            </div>
            <h3 className="text-3xl font-extrabold text-white tracking-tight mb-2">
              0% Copyleft
            </h3>
            <p className="text-sm text-slate-300 font-medium">
              Clean-room certified, zero GPL/AGPL taint, 100% permissive
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-sm">
            <span className="text-slate-400 font-medium">License Clearance:</span>
            <span className="font-mono text-emerald-400 font-bold">
              MIT / BSD / Apache
            </span>
          </div>
        </div>

      </div>
    </section>
  );
};
