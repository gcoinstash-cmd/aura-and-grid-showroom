/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Lexus RZ 450e Steer-by-Wire Precision Core (GF-T3-174)
 * Interactive Steer-by-Wire Yoke & Dynamics Cockpit
 */

import React, { useState } from 'react';
import { RotateCcw, Gauge, Zap, AlertTriangle, ShieldCheck, Sliders, Waves, Compass } from 'lucide-react';
import { VehicleDynamicsState, DualChannelTelemetry } from '../types/steerByWire';

interface SteerByWireCockpitProps {
  dynamics: VehicleDynamicsState;
  dualChannel: DualChannelTelemetry;
  onAngleChange: (angle: number) => void;
  onSpeedChange: (speed: number) => void;
  onTextureChange: (texture: 'asphalt' | 'cobblestone' | 'ice' | 'rumble') => void;
  onInjectFault: (divergenceOffset: number) => void;
  onReset: () => void;
}

export const SteerByWireCockpit: React.FC<SteerByWireCockpitProps> = ({
  dynamics,
  dualChannel,
  onAngleChange,
  onSpeedChange,
  onTextureChange,
  onInjectFault,
  onReset,
}) => {
  return (
    <section id="cockpit-section" className="relative w-full bg-slate-950 px-6 py-6 border-t border-slate-900">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Compass className="h-5 w-5 text-amber-400" />
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                One Motion Grip Steer-by-Wire Telemetry Cockpit
              </h2>
            </div>
            <p className="mt-1 text-sm md:text-base text-slate-300">
              Direct physical column decoupled. ±150° lock-to-lock butterfly yoke with real-time speed-adaptive variable ratio transmission.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onReset}
              className="flex items-center gap-2 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Center Yoke (0.00°)</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Interactive Yoke Graphic & Visual Wheel Angle Rack (7 cols) */}
          <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <span className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                Yoke Actuation View (±150° Sweep)
              </span>
              <span className="text-sm font-mono text-amber-400 font-semibold">
                Angle: {dynamics.yokeAngleDeg >= 0 ? `+${dynamics.yokeAngleDeg.toFixed(1)}°` : `${dynamics.yokeAngleDeg.toFixed(1)}°`}
              </span>
            </div>

            {/* SVG Interactive Butterfly Yoke Visualizer */}
            <div className="relative my-6 flex flex-col items-center justify-center min-h-[300px]">
              {/* Outer Angle Scale Arc */}
              <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 320 320">
                  {/* Angle Ticks from -150 to +150 */}
                  <circle
                    cx="160"
                    cy="160"
                    r="140"
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="3"
                    strokeDasharray="6 4"
                  />

                  {/* Limit Markers */}
                  <text x="35" y="275" fill="#f59e0b" fontSize="14" fontWeight="600" textAnchor="middle">-150°</text>
                  <text x="160" y="24" fill="#94a3b8" fontSize="14" fontWeight="600" textAnchor="middle">0°</text>
                  <text x="285" y="275" fill="#f59e0b" fontSize="14" fontWeight="600" textAnchor="middle">+150°</text>

                  {/* Active Angle Sweep Arc */}
                  {(() => {
                    const startAngle = -90;
                    const endAngle = startAngle + (dynamics.yokeAngleDeg * (240 / 300));
                    return null;
                  })()}

                  {/* Rotating Butterfly Yoke Group */}
                  <g
                    transform={`rotate(${dynamics.yokeAngleDeg}, 160, 160)`}
                    style={{ transition: 'transform 120ms cubic-bezier(0.16, 1, 0.3, 1)' }}
                  >
                    {/* Yoke Hub */}
                    <circle cx="160" cy="160" r="42" fill="#0f172a" stroke="#334155" strokeWidth="4" />
                    
                    {/* Hub Lexus / Core Emblem */}
                    <circle cx="160" cy="160" r="28" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />
                    <text x="160" y="165" fill="#f8fafc" fontSize="15" fontWeight="bold" textAnchor="middle" letterSpacing="1">
                      RZ 450e
                    </text>

                    {/* Left Grip Wing */}
                    <path
                      d="M 120 160 C 80 155, 45 130, 42 95 C 40 70, 70 65, 85 85 C 95 98, 120 135, 130 148 Z"
                      fill="#1e293b"
                      stroke="#475569"
                      strokeWidth="3"
                    />
                    {/* Left Lower Wing */}
                    <path
                      d="M 120 160 C 80 165, 45 190, 42 225 C 40 250, 70 255, 85 235 C 95 222, 120 185, 130 172 Z"
                      fill="#1e293b"
                      stroke="#475569"
                      strokeWidth="3"
                    />

                    {/* Right Grip Wing */}
                    <path
                      d="M 200 160 C 240 155, 275 130, 278 95 C 280 70, 250 65, 235 85 C 225 98, 200 135, 190 148 Z"
                      fill="#1e293b"
                      stroke="#475569"
                      strokeWidth="3"
                    />
                    {/* Right Lower Wing */}
                    <path
                      d="M 200 160 C 240 165, 275 190, 278 225 C 280 250, 250 255, 235 235 C 225 222, 200 185, 190 172 Z"
                      fill="#1e293b"
                      stroke="#475569"
                      strokeWidth="3"
                    />

                    {/* Top Crossbar Center Cutout */}
                    <path
                      d="M 85 85 Q 160 110 235 85"
                      fill="none"
                      stroke="#334155"
                      strokeWidth="8"
                      strokeLinecap="round"
                    />

                    {/* Bottom Crossbar Center Cutout */}
                    <path
                      d="M 85 235 Q 160 210 235 235"
                      fill="none"
                      stroke="#334155"
                      strokeWidth="8"
                      strokeLinecap="round"
                    />

                    {/* Thumb Rest Haptic Touchpads */}
                    <rect x="85" y="145" width="22" height="30" rx="4" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" />
                    <rect x="213" y="145" width="22" height="30" rx="4" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" />
                  </g>
                </svg>

                {/* Road wheel steering rack angle overlay */}
                <div className="absolute -bottom-2 flex items-center gap-2 rounded bg-slate-900 border border-slate-700 px-3 py-1 shadow">
                  <span className="text-sm text-slate-400 font-medium">Front Wheels:</span>
                  <span className="text-sm font-bold font-mono text-cyan-400 tabular-nums">
                    {dynamics.roadWheelAngleDeg >= 0 ? `+${dynamics.roadWheelAngleDeg.toFixed(2)}°` : `${dynamics.roadWheelAngleDeg.toFixed(2)}°`}
                  </span>
                </div>
              </div>
            </div>

            {/* Angle Slider & Snap presets */}
            <div className="mt-4 space-y-3 pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-300">Yoke Command Slider:</span>
                <span className="font-mono text-amber-400 font-bold tabular-nums">
                  {dynamics.yokeAngleDeg.toFixed(1)}°
                </span>
              </div>
              <input
                type="range"
                min="-150"
                max="150"
                step="0.5"
                value={dynamics.yokeAngleDeg}
                onChange={(e) => onAngleChange(parseFloat(e.target.value))}
                className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />

              <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 text-sm font-mono">
                <button
                  onClick={() => onAngleChange(-150)}
                  className="rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-slate-300 hover:text-white cursor-pointer"
                >
                  -150° (Full Left)
                </button>
                <button
                  onClick={() => onAngleChange(-60)}
                  className="rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-slate-300 hover:text-white cursor-pointer"
                >
                  -60° (Turn)
                </button>
                <button
                  onClick={() => onAngleChange(0)}
                  className="rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-amber-400 font-bold hover:text-amber-300 cursor-pointer"
                >
                  0° (Center)
                </button>
                <button
                  onClick={() => onAngleChange(60)}
                  className="rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-slate-300 hover:text-white cursor-pointer"
                >
                  +60° (Turn)
                </button>
                <button
                  onClick={() => onAngleChange(150)}
                  className="rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-slate-300 hover:text-white cursor-pointer"
                >
                  +150° (Full Right)
                </button>
              </div>
            </div>
          </div>

          {/* Right: Dynamics & Redundancy Controls (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Speed & Variable Ratio Panel */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-cyan-400" />
                  Speed-Adaptive Ratio R(v)
                </span>
                <span className="text-sm font-mono font-bold text-cyan-400 tabular-nums">
                  {dynamics.effectiveGearRatio.toFixed(2)} : 1
                </span>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Vehicle Speed:</span>
                  <span className="text-white font-mono font-bold tabular-nums">
                    {dynamics.vehicleSpeedKmh.toFixed(0)} km/h
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="220"
                  step="1"
                  value={dynamics.vehicleSpeedKmh}
                  onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <div className="mt-2 flex justify-between text-sm text-slate-400 font-mono">
                  <span>0 km/h (6.50:1)</span>
                  <span>50 km/h</span>
                  <span>120+ km/h (14.80:1)</span>
                </div>
              </div>

              {/* Speed presets */}
              <div className="grid grid-cols-3 gap-2 pt-1 text-sm">
                <button
                  onClick={() => onSpeedChange(8)}
                  className={`rounded border px-2.5 py-1.5 font-medium transition-colors cursor-pointer ${
                    dynamics.vehicleSpeedKmh < 15
                      ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300 font-bold'
                      : 'border-slate-800 bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Parking (8 km/h)
                </button>
                <button
                  onClick={() => onSpeedChange(55)}
                  className={`rounded border px-2.5 py-1.5 font-medium transition-colors cursor-pointer ${
                    dynamics.vehicleSpeedKmh >= 15 && dynamics.vehicleSpeedKmh < 90
                      ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300 font-bold'
                      : 'border-slate-800 bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  City (55 km/h)
                </button>
                <button
                  onClick={() => onSpeedChange(130)}
                  className={`rounded border px-2.5 py-1.5 font-medium transition-colors cursor-pointer ${
                    dynamics.vehicleSpeedKmh >= 90
                      ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300 font-bold'
                      : 'border-slate-800 bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Highway (130 km/h)
                </button>
              </div>
            </div>

            {/* Active Yaw Damping & Haptic Torque Synthesizer */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-4 hover:border-slate-700/80 transition-colors shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Waves className="h-4 w-4 text-emerald-400" />
                  Active Force-Feedback & Yaw Observer
                </span>
                <span className="text-sm font-mono font-bold text-emerald-400 tabular-nums flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                  1000 Hz Observer
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm font-mono">
                <div className="rounded-lg bg-slate-950/90 p-3 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-colors">
                  <span className="text-slate-400 block text-sm font-sans font-medium">Haptic Feedback:</span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-xl font-bold text-emerald-400 tabular-nums">
                      {dynamics.counterTorqueNm.toFixed(2)}
                    </span>
                    <span className="text-sm text-slate-400 font-semibold">Nm</span>
                  </div>
                </div>
                <div className="rounded-lg bg-slate-950/90 p-3 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-colors">
                  <span className="text-slate-400 block text-sm font-sans font-medium">Dynamic Yaw Rate:</span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-xl font-bold text-cyan-400 tabular-nums">
                      {dynamics.yawRateDegPerSec.toFixed(1)}
                    </span>
                    <span className="text-sm text-slate-400 font-semibold">°/s</span>
                  </div>
                </div>
                <div className="rounded-lg bg-slate-950/90 p-3 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-colors">
                  <span className="text-slate-400 block text-sm font-sans font-medium">Lateral Acceleration:</span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-xl font-bold text-amber-400 tabular-nums">
                      {dynamics.lateralAccelerationG.toFixed(2)}
                    </span>
                    <span className="text-sm text-slate-400 font-semibold">G</span>
                  </div>
                </div>
                <div className="rounded-lg bg-slate-950/90 p-3 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-colors">
                  <span className="text-slate-400 block text-sm font-sans font-medium">Actuator Rack Stroke:</span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-xl font-bold text-indigo-400 tabular-nums">
                      {(dynamics.roadWheelAngleDeg * 1.85).toFixed(1)}
                    </span>
                    <span className="text-sm text-slate-400 font-semibold">mm</span>
                  </div>
                </div>
              </div>

              {/* Surface Texture Selector */}
              <div className="pt-1">
                <span className="text-sm font-semibold text-slate-300 block mb-2">
                  Road Surface Haptic Profile:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                  {(['asphalt', 'cobblestone', 'ice', 'rumble'] as const).map((tex) => (
                    <button
                      key={tex}
                      onClick={() => onTextureChange(tex)}
                      title={`Select ${tex} surface texture`}
                      className={`h-10 flex items-center justify-center px-1.5 text-sm font-medium transition-all cursor-pointer select-none rounded-lg border capitalize tracking-tight whitespace-nowrap active:scale-[0.98] ${
                        dynamics.surfaceTexture === tex
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 font-bold shadow-sm ring-1 ring-emerald-500/40'
                          : 'border-slate-800 bg-slate-950/80 hover:bg-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
                      }`}
                    >
                      {tex}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Dual Channel Fault Injection Test Bench */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  Dual-Channel Fault Injection
                </span>
                <span className={`text-sm font-mono font-bold ${
                  dualChannel.consensusStatus === 'NOMINAL_ASIL_D' ? 'text-emerald-400' :
                  dualChannel.consensusStatus === 'DEGRADED_FAIL_OP' ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {dualChannel.consensusStatus}
                </span>
              </div>

              <p className="text-sm text-slate-300">
                Test ISO 26262 ASIL-D threshold monitor by introducing synthetic encoder divergence:
              </p>

              <div className="flex flex-wrap gap-2 text-sm font-medium">
                <button
                  onClick={() => onInjectFault(0.0)}
                  className="rounded border border-emerald-600/40 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 text-emerald-300 transition-colors cursor-pointer"
                >
                  Nominal (Δθ = 0.01°)
                </button>
                <button
                  onClick={() => onInjectFault(0.12)}
                  className="rounded border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 text-amber-300 transition-colors cursor-pointer"
                >
                  Warn (Δθ = 0.12°)
                </button>
                <button
                  onClick={() => onInjectFault(0.35)}
                  className="rounded border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 text-rose-300 transition-colors cursor-pointer"
                >
                  Trip Lockdown (Δθ = 0.35°)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
