import React from 'react';
import { Cpu, RefreshCw, Zap, Shield, CheckCircle } from 'lucide-react';
import { TelemetryFrame } from '../types/telemetry';

interface MetricsStripProps {
  currentFrame: TelemetryFrame;
  isSimulating: boolean;
  onToggleSimulating: () => void;
}

export const MetricsStrip: React.FC<MetricsStripProps> = ({
  currentFrame,
  isSimulating,
  onToggleSimulating,
}) => {
  return (
    <div className="w-full mb-8">
      {/* Telemetry Control Bar */}
      <div className="flex flex-row items-center justify-between mb-3 text-slate-300">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold tracking-wide uppercase text-slate-300">
            Live Telemetry Metrics Strip
          </span>
          <span className="text-slate-500 font-mono text-base">|</span>
          <span className="text-base text-slate-400 font-mono">
            CAN-FD 2,200 Hz Ingress Buffer
          </span>
        </div>
        <button
          onClick={onToggleSimulating}
          className="text-base font-medium px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 inline-flex items-center gap-2 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isSimulating ? 'animate-spin text-amber-400' : 'text-slate-400'}`} />
          <span>{isSimulating ? 'Stream: Active (454μs loop)' : 'Stream: Paused'}</span>
        </button>
      </div>

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: E-Four Torque Loop */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-base font-bold text-amber-400 uppercase tracking-wide flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                E-Four Torque Loop
              </span>
              <span className="text-base font-mono font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                2,200 Hz
              </span>
            </div>
            <div className="text-4xl font-black text-white font-mono tracking-tight tabular-nums mt-1 mb-2">
              {currentFrame.rearMotorTorqueNm.toFixed(1)} <span className="text-2xl font-bold text-slate-400">Nm</span>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-base">
            <span className="text-slate-400">Inverter Ingress:</span>
            <span className="font-mono font-semibold text-slate-200 tabular-nums">
              {currentFrame.rearInverterCurrentA.toFixed(1)} A @ 454μs
            </span>
          </div>
        </div>

        {/* Card 2: Planetary PSD Split */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-base font-bold text-cyan-400 uppercase tracking-wide flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                Planetary PSD Split
              </span>
              <span className="text-base font-mono font-semibold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                M20A-FXS
              </span>
            </div>
            <div className="text-4xl font-black text-white font-mono tracking-tight tabular-nums mt-1 mb-2">
              {currentFrame.frontTorquePercent.toFixed(0)}:{currentFrame.rearTorquePercent.toFixed(0)}
              <span className="text-xl font-bold text-slate-400 ml-2">F/R %</span>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-base">
            <span className="text-slate-400">ICE / MG1 / MG2:</span>
            <span className="font-mono font-semibold text-slate-200 tabular-nums">
              {currentFrame.iceRpm.toFixed(0)} / {currentFrame.mg1Rpm.toFixed(0)} / {currentFrame.mg2Rpm.toFixed(0)}
            </span>
          </div>
        </div>

        {/* Card 3: Monotonic Telemetry Nonce */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-base font-bold text-indigo-400 uppercase tracking-wide flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-indigo-400" />
                Monotonic Nonce
              </span>
              <span className="text-base font-mono font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                0-COLLISION
              </span>
            </div>
            <div className="text-4xl font-black text-white font-mono tracking-tight tabular-nums mt-1 mb-2">
              #{currentFrame.nonce.toLocaleString()}
            </div>
          </div>
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-base">
            <span className="text-slate-400">HMAC-SHA256:</span>
            <span className="font-mono text-emerald-400 truncate max-w-[150px] font-semibold" title={currentFrame.hmacSignature}>
              {currentFrame.hmacSignature.slice(0, 10)}...
            </span>
          </div>
        </div>

        {/* Card 4: IP Clean-Room Audit */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-base font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                IP Clean-Room Audit
              </span>
              <span className="text-base font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                100% VALID
              </span>
            </div>
            <div className="text-4xl font-black text-white font-mono tracking-tight tabular-nums mt-1 mb-2">
              0% <span className="text-2xl font-bold text-slate-300">Copyleft</span>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-base">
            <span className="text-slate-400">License Assurance:</span>
            <span className="font-mono font-bold text-emerald-400">
              MIT / BSD-3 (No GPL)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
