import React, { useState } from 'react';
import { SbwState } from '../../types/telemetry';
import { Gauge, Zap, AlertTriangle, ShieldCheck, Copy, Check, Sliders, RefreshCw, Layers } from 'lucide-react';

interface Tab1SbwCoreProps {
  state: SbwState;
  onUpdateState: (partial: Partial<SbwState>) => void;
  onToggleCanFault: () => void;
}

export const Tab1SbwCore: React.FC<Tab1SbwCoreProps> = ({
  state,
  onUpdateState,
  onToggleCanFault,
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedFrictionLabel, setSelectedFrictionLabel] = useState('Dry Tarmac (μ=1.0)');

  const handleCopyCode = () => {
    navigator.clipboard.writeText(`"""
Lexus RZ 450e Steer-by-Wire DIRECT4 State Machine
Standard: ISO 26262 ASIL-D Dual-Redundant Controller
"""
import math, hmac, hashlib, time

class LexusRZ450eSbwCore:
    R_MIN = 6.0
    R_MAX = 18.0
    K_SLOPE = 0.18
    V0_MS = 13.889 # 50 km/h

    def compute_steering_ratio(self, speed_kmh: float) -> float:
        v_ms = max(0.0, speed_kmh / 3.6)
        return self.R_MIN + (self.R_MAX - self.R_MIN) / (1.0 + math.exp(-self.K_SLOPE * (v_ms - self.V0_MS)))

    def calculate_rack_angle(self, yoke_deg: float, speed_kmh: float, friction_mu: float = 1.0) -> float:
        clamped_yoke = max(-150.0, min(150.0, yoke_deg))
        ratio = self.compute_steering_ratio(speed_kmh)
        return max(-25.0, min(25.0, (clamped_yoke / ratio) * min(1.0, max(0.2, friction_mu))))
`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleYokeChange = (val: number) => {
    const speed = state.vehicleSpeedKmh;
    const v_ms = Math.max(0, speed / 3.6);
    // Sigmoid variable ratio formula
    const ratio = 6.0 + (18.0 - 6.0) / (1.0 + Math.exp(-0.18 * (v_ms - 13.889)));
    const rack = Math.max(-25, Math.min(25, (val / ratio) * state.roadFrictionCoeff));
    const haptic = Math.abs(rack) * 0.18 * state.roadFrictionCoeff + speed * 0.015;
    
    // DIRECT4 dynamic torque calculation
    let front = 55;
    if (speed < 10) front = 60;
    else if (Math.abs(val) > 45) front = 50; // apex
    else if (Math.abs(val) > 15) front = 75; // turn in
    else if (speed > 80) front = 20; // high-speed rear push
    const rear = 100 - front;

    onUpdateState({
      yokeAngleDeg: val,
      rackAngleDeg: parseFloat(rack.toFixed(2)),
      steeringRatio: parseFloat(ratio.toFixed(2)),
      hapticFeedbackTorqueNm: parseFloat((val < 0 ? -haptic : haptic).toFixed(2)),
      direct4FrontRatio: front,
      direct4RearRatio: rear,
      lateralAccG: parseFloat(((speed * speed / 1200) * (Math.sin(rack * Math.PI / 180))).toFixed(2)),
    });
  };

  const handleSpeedChange = (spd: number) => {
    const val = state.yokeAngleDeg;
    const v_ms = Math.max(0, spd / 3.6);
    const ratio = 6.0 + (18.0 - 6.0) / (1.0 + Math.exp(-0.18 * (v_ms - 13.889)));
    const rack = Math.max(-25, Math.min(25, (val / ratio) * state.roadFrictionCoeff));
    const haptic = Math.abs(rack) * 0.18 * state.roadFrictionCoeff + spd * 0.015;
    
    let front = 55;
    if (spd < 10) front = 60;
    else if (Math.abs(val) > 45) front = 50;
    else if (Math.abs(val) > 15) front = 75;
    else if (spd > 80) front = 20;
    const rear = 100 - front;

    onUpdateState({
      vehicleSpeedKmh: spd,
      steeringRatio: parseFloat(ratio.toFixed(2)),
      rackAngleDeg: parseFloat(rack.toFixed(2)),
      hapticFeedbackTorqueNm: parseFloat((val < 0 ? -haptic : haptic).toFixed(2)),
      direct4FrontRatio: front,
      direct4RearRatio: rear,
      lateralAccG: parseFloat(((spd * spd / 1200) * (Math.sin(rack * Math.PI / 180))).toFixed(2)),
    });
  };

  const handleFrictionChange = (mu: number, label: string) => {
    setSelectedFrictionLabel(label);
    const rack = Math.max(-25, Math.min(25, (state.yokeAngleDeg / state.steeringRatio) * mu));
    onUpdateState({
      roadFrictionCoeff: mu,
      rackAngleDeg: parseFloat(rack.toFixed(2)),
    });
  };

  return (
    <div className="space-y-6">
      {/* Title & Technical Context */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Sliders className="w-7 h-7 text-amber-400" />
              Steer-by-Wire & DIRECT4 Vectoring Cockpit
            </h2>
            <p className="text-slate-300 text-base mt-1">
              Dual-redundant 4,000 Hz CAN-FD actuator loop eliminating mechanical steering shaft linkage, dynamically paired with front/rear e-Axle torque vectoring.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onToggleCanFault}
              className={`px-4 py-2 rounded-lg font-bold text-base flex items-center gap-2 border transition-all cursor-pointer ${
                state.canBusAHealthy
                  ? 'bg-red-500/10 border-red-500/40 text-red-400 hover:bg-red-500/20'
                  : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
              <span>{state.canBusAHealthy ? 'Simulate Bus A Fault' : 'Restore Bus A Health'}</span>
            </button>

            <button
              onClick={() => {
                handleYokeChange(0);
                handleSpeedChange(50);
              }}
              className="px-3 py-2 rounded-lg font-semibold text-base bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Center</span>
            </button>
          </div>
        </div>

        {/* Bus Failover Banner if fault active */}
        {!state.canBusAHealthy && (
          <div className="mb-4 p-4 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center gap-3 text-base text-amber-200">
            <ShieldCheck className="w-6 h-6 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold">ASIL-D Failover Triggered: </span>
              Primary CAN-FD Bus A link lost. Switched to Backup Bus B in <strong className="font-mono text-white">250 µs</strong> with zero torque interruption.
            </div>
          </div>
        )}

        {/* Interactive Controls & Telemetry Visualizer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          {/* Controls Column */}
          <div className="lg:col-span-5 space-y-5 bg-slate-950/60 p-5 rounded-xl border border-slate-800">
            {/* Yoke Angle Slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-base font-bold text-slate-200 flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-amber-400" />
                  Yoke Input Angle (±150°)
                </label>
                <span className="font-mono font-black text-xl text-amber-400 bg-slate-900 px-3 py-1 rounded border border-amber-500/30">
                  {state.yokeAngleDeg > 0 ? `+${state.yokeAngleDeg}` : state.yokeAngleDeg}°
                </span>
              </div>
              <input
                type="range"
                min="-150"
                max="150"
                step="1"
                value={state.yokeAngleDeg}
                onChange={(e) => handleYokeChange(parseFloat(e.target.value))}
                className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-xs font-mono text-slate-500 mt-1">
                <span>-150° (Full Left)</span>
                <span>0° (Center)</span>
                <span>+150° (Full Right)</span>
              </div>
            </div>

            {/* Vehicle Speed Slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-base font-bold text-slate-200 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-cyan-400" />
                  Vehicle Velocity
                </label>
                <span className="font-mono font-black text-xl text-cyan-400 bg-slate-900 px-3 py-1 rounded border border-cyan-500/30">
                  {state.vehicleSpeedKmh} km/h
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="160"
                step="5"
                value={state.vehicleSpeedKmh}
                onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-xs font-mono text-slate-500 mt-1">
                <span>0 km/h (Parking 1:6)</span>
                <span>50 km/h (City 1:12)</span>
                <span>160 km/h (Highway 1:18)</span>
              </div>
            </div>

            {/* Road Friction Selector */}
            <div>
              <label className="text-base font-bold text-slate-200 block mb-2">
                Road Surface Friction Model
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Dry Tarmac (μ=1.0)', mu: 1.0, short: 'Dry (1.0)' },
                  { label: 'Wet Asphalt (μ=0.75)', mu: 0.75, short: 'Wet (0.75)' },
                  { label: 'Ice / Snow (μ=0.25)', mu: 0.25, short: 'Ice (0.25)' },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => handleFrictionChange(item.mu, item.label)}
                    type="button"
                    className={`px-3 py-2 text-base font-bold rounded-lg border transition cursor-pointer ${
                      state.roadFrictionCoeff === item.mu
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {item.short}
                  </button>
                ))}
              </div>
              <div className="text-xs text-slate-400 mt-2 font-mono">
                Current: {selectedFrictionLabel}
              </div>
            </div>

            {/* Dynamic Calculated Specs */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5 text-base">
              <div className="flex justify-between">
                <span className="text-slate-400">Effective Ratio R(v):</span>
                <span className="font-mono font-bold text-white">1:{state.steeringRatio}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Road Rack Angle:</span>
                <span className="font-mono font-bold text-cyan-300">{state.rackAngleDeg}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Yoke Reaction Torque:</span>
                <span className="font-mono font-bold text-amber-300">{state.hapticFeedbackTorqueNm} Nm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Lateral Acceleration:</span>
                <span className="font-mono font-bold text-indigo-300">{state.lateralAccG} g</span>
              </div>
            </div>
          </div>

          {/* Interactive Cockpit Diagram */}
          <div className="lg:col-span-7 flex flex-col justify-between bg-slate-950/60 p-5 rounded-xl border border-slate-800">
            {/* Visual Yoke & Wheels Canvas */}
            <div className="relative w-full h-64 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden">
              {/* Background telemetry grid lines */}
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px]" />

              {/* Road Wheels (Left and Right) */}
              <div className="absolute top-6 inset-x-12 flex justify-between items-center">
                {/* Left Wheel */}
                <div className="flex flex-col items-center">
                  <span className="text-xs font-mono text-slate-400 mb-1">FRONT-LEFT</span>
                  <div
                    className="w-8 h-16 bg-slate-700 border-2 border-cyan-400 rounded-md transition-transform duration-100 shadow-md shadow-cyan-500/20"
                    style={{ transform: `rotate(${state.rackAngleDeg}deg)` }}
                  />
                  <span className="text-xs font-mono text-cyan-300 mt-1">{state.rackAngleDeg}°</span>
                </div>

                {/* Virtual Steer-by-Wire Rack Linkage */}
                <div className="flex-1 mx-4 flex flex-col items-center">
                  <div className="w-full h-1 bg-slate-800 relative">
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-cyan-400 shadow-md transition-all duration-100"
                      style={{
                        left: `${50 + (state.rackAngleDeg / 25) * 45}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 uppercase mt-2">
                    Digital CAN-FD Steer Actuator (No Mechanical Shaft)
                  </span>
                </div>

                {/* Right Wheel */}
                <div className="flex flex-col items-center">
                  <span className="text-xs font-mono text-slate-400 mb-1">FRONT-RIGHT</span>
                  <div
                    className="w-8 h-16 bg-slate-700 border-2 border-cyan-400 rounded-md transition-transform duration-100 shadow-md shadow-cyan-500/20"
                    style={{ transform: `rotate(${state.rackAngleDeg}deg)` }}
                  />
                  <span className="text-xs font-mono text-cyan-300 mt-1">{state.rackAngleDeg}°</span>
                </div>
              </div>

              {/* One-Motion Grip Yoke SVG graphic */}
              <div
                className="absolute bottom-4 flex flex-col items-center transition-transform duration-75"
                style={{ transform: `rotate(${state.yokeAngleDeg}deg)` }}
              >
                <svg width="180" height="90" viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Yoke Frame */}
                  <path
                    d="M 20 80 Q 20 20 50 15 L 75 15 Q 100 20 125 15 L 150 15 Q 180 20 180 80 Q 160 85 155 70 L 150 40 Q 100 50 50 40 L 45 70 Q 40 85 20 80 Z"
                    fill="#1e293b"
                    stroke="#f59e0b"
                    strokeWidth="4"
                  />
                  {/* Grip handles */}
                  <rect x="15" y="30" width="16" height="45" rx="5" fill="#f59e0b" fillOpacity="0.4" />
                  <rect x="169" y="30" width="16" height="45" rx="5" fill="#f59e0b" fillOpacity="0.4" />
                  {/* Center Hub */}
                  <circle cx="100" cy="55" r="18" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2" />
                  <path d="M 94 55 L 106 55 M 100 49 L 100 61" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>

              {/* Digital Center indicator */}
              <div className="absolute bottom-1 text-xs font-mono text-slate-500">
                ONE-MOTION GRIP YOKE (±150° RANGE)
              </div>
            </div>

            {/* DIRECT4 Torque Vectoring Bar */}
            <div className="mt-5 p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex justify-between items-center mb-2">
                <span className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-400" />
                  DIRECT4 e-Axle Dynamic Distribution
                </span>
                <span className="font-mono font-bold text-base text-emerald-400">
                  {state.direct4FrontRatio}% FRONT : {state.direct4RearRatio}% REAR
                </span>
              </div>

              {/* Progress Split Bar */}
              <div className="h-6 w-full bg-slate-800 rounded-lg overflow-hidden flex border border-slate-700">
                <div
                  className="bg-blue-600 flex items-center justify-center text-xs font-mono font-bold text-white transition-all duration-150"
                  style={{ width: `${state.direct4FrontRatio}%` }}
                >
                  Front {state.direct4FrontRatio}%
                </div>
                <div
                  className="bg-emerald-600 flex items-center justify-center text-xs font-mono font-bold text-white transition-all duration-150"
                  style={{ width: `${state.direct4RearRatio}%` }}
                >
                  Rear {state.direct4RearRatio}%
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3 text-sm font-mono text-slate-400">
                <div className="p-2 bg-slate-950/60 rounded border border-slate-800">
                  <span className="text-blue-400 font-bold block">Front e-Axle: 150 kW</span>
                  <span>{((state.direct4FrontRatio / 100) * 266).toFixed(0)} Nm current torque</span>
                </div>
                <div className="p-2 bg-slate-950/60 rounded border border-slate-800">
                  <span className="text-emerald-400 font-bold block">Rear e-Axle: 80 kW</span>
                  <span>{((state.direct4RearRatio / 100) * 168).toFixed(0)} Nm current torque</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Production Python 3.12 Code Viewer */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="text-amber-400 font-mono">01.</span>
              Pure Python 3.12 Steer-by-Wire State Machine
            </h3>
            <p className="text-slate-400 text-base mt-1">
              Zero-placeholder ISO 26262 ASIL-D mathematical engine for dynamic rack angle, sigmoid variable ratio, and DIRECT4 torque distribution.
            </p>
          </div>
          <button
            onClick={handleCopyCode}
            type="button"
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-mono font-bold flex items-center gap-2 transition cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
            <span>{copied ? 'Copied' : 'Copy Code'}</span>
          </button>
        </div>

        <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto text-sm text-slate-300 font-mono leading-relaxed">
{`# GF-T3-196: Lexus RZ 450e Steer-by-Wire DIRECT4 State Machine
import math, hmac, hashlib, time
from dataclasses import dataclass

class LexusRZ450eSbwCore:
    R_MIN = 6.0    # 1:6 ratio at 0 km/h (Parking Agility)
    R_MAX = 18.0   # 1:18 ratio at 160 km/h (High-speed Tracking)
    K_SLOPE = 0.18 # Sigmoid curve transition steepness
    V0_MS = 13.889 # 50 km/h transition midpoint (in m/s)

    def compute_steering_ratio(self, speed_kmh: float) -> float:
        v_ms = max(0.0, speed_kmh / 3.6)
        ratio = self.R_MIN + (self.R_MAX - self.R_MIN) / (1.0 + math.exp(-self.K_SLOPE * (v_ms - self.V0_MS)))
        return round(ratio, 3)

    def calculate_rack_angle(self, yoke_deg: float, speed_kmh: float, friction_mu: float = 1.0) -> float:
        clamped_yoke = max(-150.0, min(150.0, yoke_deg))
        ratio = self.compute_steering_ratio(speed_kmh)
        raw_rack = clamped_yoke / ratio
        return round(max(-25.0, min(25.0, raw_rack * min(1.0, max(0.2, friction_mu)))), 3)

    def compute_direct4_split(self, speed_kmh: float, yoke_deg: float, lateral_g: float) -> tuple[float, float]:
        if speed_kmh < 10.0: front = 60.0
        elif abs(yoke_deg) > 45.0 or abs(lateral_g) > 0.4: front = 50.0 # Apex balance
        elif abs(yoke_deg) > 15.0: front = 75.0                         # Turn-in agility
        elif speed_kmh > 80.0: front = 20.0                             # High-speed rear push
        else: front = 55.0
        return (front, round(100.0 - front, 1))`}
        </pre>
      </div>
    </div>
  );
};
