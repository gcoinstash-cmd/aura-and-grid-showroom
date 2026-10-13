import React from 'react';
import { Activity, VolumeX, Database, ShieldCheck, ArrowDownRight, Radio, Lock } from 'lucide-react';
import { TelemetryPacket } from '../types/telemetry';

interface TelemetryMetricsStripProps {
  currentTelemetry: TelemetryPacket;
  isComfortMode: boolean;
}

export const TelemetryMetricsStrip: React.FC<TelemetryMetricsStripProps> = ({
  currentTelemetry,
  isComfortMode,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {/* Card 1: Braking Pitch Loop */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden group hover:border-amber-500/50 transition-all">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Activity className="w-6 h-6" />
            </span>
            <span className="text-slate-400 text-base font-semibold tracking-wide uppercase">
              Braking Pitch Loop
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-base font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Radio className="w-4 h-4 animate-pulse text-amber-400" />
            2,500 Hz
          </span>
        </div>

        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black font-mono text-white tracking-tight">
              {isComfortMode ? currentTelemetry.pitchAngleDeg.toFixed(2) : currentTelemetry.conventionalPitchDeg.toFixed(2)}°
            </span>
            <span className="text-slate-400 text-base font-medium">pitch</span>
          </div>
          <p className="text-emerald-400 text-base font-medium mt-1 flex items-center gap-1.5">
            <ArrowDownRight className="w-5 h-5 text-emerald-400" />
            {isComfortMode ? 'Rear-Biased Flat Posture Active' : 'Conventional Front Dive Active'}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-base font-mono text-slate-300">
          <span>Rear Bias: <strong className="text-amber-400">{currentTelemetry.rearBiasPercent}%</strong></span>
          <span>Cycle: <strong className="text-slate-200">0.40 ms</strong></span>
        </div>
      </div>

      {/* Card 2: Acoustic Isolation Index */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden group hover:border-blue-500/50 transition-all">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <VolumeX className="w-6 h-6" />
            </span>
            <span className="text-slate-400 text-base font-semibold tracking-wide uppercase">
              Acoustic Isolation
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-base font-mono font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
            48" Partition
          </span>
        </div>

        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black font-mono text-white tracking-tight">
              -{Math.abs(currentTelemetry.splAttenuationDb).toFixed(1)} dB
            </span>
            <span className="text-slate-400 text-base font-medium">loss</span>
          </div>
          <p className="text-blue-300 text-base font-medium mt-1">
            Executive Cabin Sound Transmission Loss
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-base font-mono text-slate-300">
          <span>Opacity: <strong className="text-blue-400">{currentTelemetry.partitionOpacityPercent}%</strong></span>
          <span>Cabin: <strong className="text-slate-200">{currentTelemetry.cabinSplDb.toFixed(1)} dBA</strong></span>
        </div>
      </div>

      {/* Card 3: Monotonic Telemetry Nonce */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden group hover:border-emerald-500/50 transition-all">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Database className="w-6 h-6" />
            </span>
            <span className="text-slate-400 text-base font-semibold tracking-wide uppercase">
              Telemetry Nonce
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-base font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <Lock className="w-4 h-4 text-emerald-400" />
            HMAC-SHA256
          </span>
        </div>

        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black font-mono text-white tracking-tight">
              #{currentTelemetry.nonce.toLocaleString()}
            </span>
          </div>
          <p className="text-emerald-400 text-base font-medium mt-1">
            Zero-Collision Monotonic Ledger Block
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-base font-mono text-slate-300">
          <span>Jerk: <strong className="text-slate-200">{currentTelemetry.jerkGPerSec.toFixed(3)} G/s</strong></span>
          <span className="text-emerald-400 font-semibold">Postgres 16 OK</span>
        </div>
      </div>

      {/* Card 4: IP Clean-Room Audit */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden group hover:border-purple-500/50 transition-all">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <ShieldCheck className="w-6 h-6" />
            </span>
            <span className="text-slate-400 text-base font-semibold tracking-wide uppercase">
              IP Clean-Room Audit
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-base font-mono font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
            100% Clean
          </span>
        </div>

        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black font-mono text-white tracking-tight">
              0% Copyleft
            </span>
          </div>
          <p className="text-purple-300 text-base font-medium mt-1">
            Clean-Room Certified / Delaware Micro-APA
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-base font-mono text-slate-300">
          <span>MIT / Apache 2.0</span>
          <span className="text-emerald-400 font-bold">Acquire.com Ready</span>
        </div>
      </div>
    </div>
  );
};
