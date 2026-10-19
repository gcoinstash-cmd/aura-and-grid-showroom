/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Gauge,
  Sliders,
  Code2,
  Copy,
  Check,
  Zap,
  RotateCcw,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  Navigation2
} from 'lucide-react';
import { KinematicsState } from '../../types/telemetry';

interface DrsKinematicsTabProps {
  state: KinematicsState;
  onChange: (updates: Partial<KinematicsState>) => void;
}

export const DrsKinematicsTab: React.FC<DrsKinematicsTabProps> = ({
  state,
  onChange,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'SIMULATOR' | 'PYTHON_SOURCE'>('SIMULATOR');
  const [copied, setCopied] = useState(false);

  // Preset scenarios
  const applyPreset = (preset: 'PARKING' | 'CITY' | 'TRANSITION' | 'HIGHWAY' | 'EMERGENCY') => {
    switch (preset) {
      case 'PARKING':
        onChange({
          vehicleSpeedMph: 12,
          steeringWheelAngleDeg: 420,
          lateralG: 0.15,
          frictionCoeff: 0.95,
          drivingMode: 'NORMAL',
        });
        break;
      case 'CITY':
        onChange({
          vehicleSpeedMph: 32,
          steeringWheelAngleDeg: 180,
          lateralG: 0.45,
          frictionCoeff: 0.9,
          drivingMode: 'NORMAL',
        });
        break;
      case 'TRANSITION':
        onChange({
          vehicleSpeedMph: 50,
          steeringWheelAngleDeg: 90,
          lateralG: 0.55,
          frictionCoeff: 0.9,
          drivingMode: 'SPORT_PLUS',
        });
        break;
      case 'HIGHWAY':
        onChange({
          vehicleSpeedMph: 75,
          steeringWheelAngleDeg: 45,
          lateralG: 0.35,
          frictionCoeff: 0.95,
          drivingMode: 'SPORT_PLUS',
        });
        break;
      case 'EMERGENCY':
        onChange({
          vehicleSpeedMph: 85,
          steeringWheelAngleDeg: 120,
          lateralG: 0.88,
          frictionCoeff: 0.85,
          drivingMode: 'CUSTOM_TRACK',
        });
        break;
    }
  };

  const pythonCode = `"""
Heavy Overland Dynamics Platform Multi-Node High-Output Core High-G Dynamic Telemetry Core - Dynamic Rear Steering (DRS) & DUAL_VECTOR_TORQUE Kinematics
Asset ID: GF-T3-197
Python 3.12 Production Engine

Proprietary Bicycle Model with Active Rear Wheel Toe Kinematics.
Calculates counter-phase steering up to 4.0° below 50 mph (turning radius reduction)
and in-phase steering above 50 mph (high-speed yaw damping and zero side-slip).
"""

from dataclasses import dataclass
import math

@dataclass(frozen=True)
class VehicleParameters:
    wheelbase_m: float = 2.950          # Heavy Overland Dynamics Platform Multi-Node High-Output Core wheelbase (m)
    dist_cg_to_front_m: float = 1.385   # l_f
    dist_cg_to_rear_m: float = 1.565    # l_r
    curb_weight_kg: float = 2250.0      # Kerb mass (kg)
    steering_ratio: float = 14.8        # Steering wheel to front road wheel ratio
    max_drs_angle_deg: float = 4.00     # Hardware physical mechanical stop
    v_transition_mps: float = 22.352    # 50.0 mph threshold (22.352 m/s)

class DrsKinematicsEngine:
    def __init__(self, params: VehicleParameters = VehicleParameters()):
        self.p = params

    def calculate_steering(self, speed_mph: float, steering_wheel_deg: float, lateral_g: float = 0.0) -> dict:
        speed_mps = speed_mph * 0.44704
        delta_front_deg = steering_wheel_deg / self.p.steering_ratio

        # Phase Arbiter
        if speed_mph < 50.0:
            # Low-speed Counter-Phase: Rear turns opposite to front
            # Maximizes curb-to-curb agility & reduces turning radius
            speed_ratio = max(0.0, 1.0 - (speed_mph / 50.0))
            raw_rear_deg = - (delta_front_deg * 0.22) * (0.4 + 0.6 * speed_ratio)
            phase = "COUNTER_PHASE"
        else:
            # High-speed In-Phase: Rear turns parallel with front
            # Eliminates body yaw lag (beta -> 0) during lane changes
            high_speed_gain = min(1.0, (speed_mph - 50.0) / 40.0)
            raw_rear_deg = + (delta_front_deg * 0.14) * (0.5 + 0.5 * high_speed_gain)
            phase = "IN_PHASE"

        # Hardware Clamp: Strict Physical ±4.00° Boundary
        delta_rear_deg = max(-self.p.max_drs_angle_deg, min(self.p.max_drs_angle_deg, raw_rear_deg))

        # Effective Turning Radius: R = L / (tan(delta_front) - tan(delta_rear))
        rad_f = math.radians(abs(delta_front_deg))
        rad_r = math.radians(delta_rear_deg) if phase == "COUNTER_PHASE" else 0.0
        
        effective_angle = max(0.001, rad_f - rad_r)
        turning_radius_m = self.p.wheelbase_m / math.sin(effective_angle) if effective_angle > 0 else 100.0
        standard_radius_m = self.p.wheelbase_m / math.sin(max(0.001, rad_f)) if rad_f > 0 else 100.0
        
        radius_reduction_pct = max(0.0, ((standard_radius_m - turning_radius_m) / standard_radius_m) * 100.0)

        # DUAL_VECTOR_TORQUE Dynamic Torque Vectoring (Front 2.4T Hybrid : Rear eAxle)
        if speed_mph < 25.0:
            # Launch / Low speed traction
            front_pct, rear_pct = 75, 25
        elif speed_mph < 65.0:
            # Apex & Mid-speed cornering balance
            front_pct, rear_pct = 50, 50
        else:
            # High-speed exit / directional stability push
            front_pct, rear_pct = 20, 80

        return {
            "speed_mph": speed_mph,
            "delta_front_deg": round(delta_front_deg, 3),
            "delta_rear_deg": round(delta_rear_deg, 3),
            "phase": phase,
            "turning_radius_m": round(turning_radius_m, 2),
            "radius_reduction_pct": round(radius_reduction_pct, 1),
            "dual_vector_torque_front_pct": front_pct,
            "dual_vector_torque_rear_pct": rear_pct,
            "status": "NOMINAL"
        }

# Production Assertions / Unit Test Harness
if __name__ == "__main__":
    engine = DrsKinematicsEngine()
    
    # 1. Low-Speed Counter-Phase Check
    res_low = engine.calculate_steering(speed_mph=15.0, steering_wheel_deg=360.0)
    assert res_low["phase"] == "COUNTER_PHASE"
    assert res_low["delta_rear_deg"] < 0.0
    assert abs(res_low["delta_rear_deg"]) <= 4.00
    assert res_low["radius_reduction_pct"] > 5.0

    # 2. High-Speed In-Phase Check
    res_high = engine.calculate_steering(speed_mph=75.0, steering_wheel_deg=60.0)
    assert res_high["phase"] == "IN_PHASE"
    assert res_high["delta_rear_deg"] > 0.0
    assert res_high["dual_vector_torque_rear_pct"] == 80
    
    print("GF-T3-197 DRS KINEMATICS ENGINE: ALL SANITY CONSTRAINTS PASSED.")
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(pythonCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Tab Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Sliders className="w-8 h-8 text-amber-400" />
            DRS & DUAL_VECTOR_TORQUE Vectoring Core
          </h2>
          <p className="text-base text-slate-400 mt-1">
            Dynamic Rear Steering (±4.0° toe actuator) and DUAL_VECTOR_TORQUE high-output rear eAxle vectoring model.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveSubTab('SIMULATOR')}
            className={`px-4 py-2 rounded-lg text-base font-semibold transition-all cursor-pointer ${
              activeSubTab === 'SIMULATOR'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Live Visualizer
          </button>
          <button
            onClick={() => setActiveSubTab('PYTHON_SOURCE')}
            className={`px-4 py-2 rounded-lg text-base font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'PYTHON_SOURCE'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Code2 className="w-4 h-4" />
            Python 3.12 Engine
          </button>
        </div>
      </div>

      {activeSubTab === 'SIMULATOR' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Column (5 cols) */}
          <div className="lg:col-span-5 space-y-5 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Gauge className="w-5 h-5 text-amber-400" />
                Kinematics Inputs
              </span>
              <button
                onClick={() => applyPreset('PARKING')}
                className="text-base text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
                title="Reset to parking test"
              >
                <RotateCcw className="w-4 h-4" /> Reset
              </button>
            </div>

            {/* Quick Presets */}
            <div>
              <label className="block text-base font-semibold text-slate-300 mb-2">
                Dynamic Scenarios:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset('PARKING')}
                  className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-base font-medium text-center transition-all"
                >
                  U-Turn (12 mph)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('CITY')}
                  className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-base font-medium text-center transition-all"
                >
                  City (32 mph)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('TRANSITION')}
                  className="px-2 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-base font-bold text-center transition-all"
                >
                  50 mph Boundary
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('HIGHWAY')}
                  className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-base font-medium text-center transition-all"
                >
                  Interstate (75)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('EMERGENCY')}
                  className="px-2 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-lg text-base font-medium text-center transition-all"
                >
                  Swerve (85 mph)
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ vehicleSpeedMph: 105, steeringWheelAngleDeg: 160, lateralG: 0.95 })}
                  className="px-2 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded-lg text-base font-medium text-center transition-all"
                >
                  Track Apex
                </button>
              </div>
            </div>

            {/* Slider 1: Vehicle Speed */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-base">
                <span className="font-semibold text-slate-200">Vehicle Speed</span>
                <span className="font-mono font-bold text-amber-400 text-xl">
                  {state.vehicleSpeedMph} mph
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="125"
                step="1"
                value={state.vehicleSpeedMph}
                onChange={(e) => onChange({ vehicleSpeedMph: Number(e.target.value) })}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-base text-slate-400 font-mono">
                <span>0 mph (Standstill)</span>
                <span className="text-amber-400 font-bold">50 mph Phase Split</span>
                <span>125 mph</span>
              </div>
            </div>

            {/* Slider 2: Steering Wheel Angle */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-base">
                <span className="font-semibold text-slate-200">Steering Wheel Lock</span>
                <span className="font-mono font-bold text-cyan-400 text-xl">
                  {state.steeringWheelAngleDeg > 0 ? `+${state.steeringWheelAngleDeg}°` : `${state.steeringWheelAngleDeg}°`}
                </span>
              </div>
              <input
                type="range"
                min="-540"
                max="540"
                step="5"
                value={state.steeringWheelAngleDeg}
                onChange={(e) => onChange({ steeringWheelAngleDeg: Number(e.target.value) })}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-base text-slate-400 font-mono">
                <span>-540° (Full Left)</span>
                <span>0° Center</span>
                <span>+540° (Full Right)</span>
              </div>
            </div>

            {/* Slider 3: Lateral G-Force */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-base">
                <span className="font-semibold text-slate-200">Lateral Acceleration</span>
                <span className="font-mono font-bold text-purple-400 text-xl">
                  {state.lateralG.toFixed(2)} G
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.1"
                step="0.05"
                value={state.lateralG}
                onChange={(e) => onChange({ lateralG: Number(e.target.value) })}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-400"
              />
              <div className="flex justify-between text-base text-slate-400 font-mono">
                <span>0.00 G (Cruising)</span>
                <span>0.50 G (Moderate)</span>
                <span>1.10 G (Limit)</span>
              </div>
            </div>

            {/* Driving Mode Selector */}
            <div>
              <label className="block text-base font-semibold text-slate-300 mb-2">
                Chassis Drive Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['NORMAL', 'SPORT_PLUS', 'CUSTOM_TRACK'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => onChange({ drivingMode: mode })}
                    className={`py-2 px-3 rounded-lg text-base font-bold transition-all border ${
                      state.drivingMode === mode
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    {mode === 'NORMAL' ? 'Normal' : mode === 'SPORT_PLUS' ? 'High-Frequency Compute Mode' : 'Track DRS'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Visual Canvas & Telemetry Readout (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Visual Vehicle Chassis Diagram */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                <span className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Navigation2 className="w-5 h-5 text-cyan-400" />
                  Heavy Overland Dynamics Platform Multi-Node High-Output Core Active Chassis Plane (Wheelbase: 2,950 mm)
                </span>
                <span className="text-base font-mono text-slate-400">
                  Scale: 1:35 Dynamic
                </span>
              </div>

              {/* SVG Chassis Visualization */}
              <div className="relative w-full h-72 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-center justify-center p-4">
                <svg
                  viewBox="0 0 500 280"
                  className="w-full h-full max-h-68 select-none"
                >
                  <defs>
                    <radialGradient id="cgGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  {/* Center Line & Trajectory Arc */}
                  <line
                    x1="40"
                    y1="140"
                    x2="460"
                    y2="140"
                    stroke="#334155"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />

                  {/* Vehicle Body Outline (Heavy Overland Dynamics Platform TX Profile from Top) */}
                  <rect
                    x="110"
                    y="60"
                    width="280"
                    height="160"
                    rx="32"
                    fill="#0f172a"
                    stroke="#475569"
                    strokeWidth="2.5"
                  />

                  {/* Hood crease lines & windshield */}
                  <path
                    d="M 120 100 Q 170 100 200 80 M 120 180 Q 170 180 200 200"
                    stroke="#1e293b"
                    strokeWidth="2"
                    fill="none"
                  />
                  <rect
                    x="210"
                    y="80"
                    width="110"
                    height="120"
                    rx="12"
                    fill="#1e293b"
                    stroke="#334155"
                    strokeWidth="1.5"
                  />
                  <text
                    x="265"
                    y="145"
                    fill="#64748b"
                    fontSize="12"
                    fontWeight="bold"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    Multi-Node High-Output Core DUAL_VECTOR_TORQUE
                  </text>

                  {/* Center of Gravity (CG) marker */}
                  <circle cx="265" cy="140" r="16" fill="url(#cgGlow)" />
                  <circle cx="265" cy="140" r="5" fill="#f59e0b" />

                  {/* FRONT WHEEL LEFT (x=160, y=40) */}
                  <g transform={`translate(165, 45) rotate(${state.calculatedFrontSteerDeg})`}>
                    <rect
                      x="-15"
                      y="-12"
                      width="30"
                      height="24"
                      rx="4"
                      fill="#38bdf8"
                      stroke="#0284c7"
                      strokeWidth="2"
                    />
                    <line x1="0" y1="-12" x2="0" y2="12" stroke="#ffffff" strokeWidth="2" />
                  </g>

                  {/* FRONT WHEEL RIGHT (x=165, y=235) */}
                  <g transform={`translate(165, 235) rotate(${state.calculatedFrontSteerDeg})`}>
                    <rect
                      x="-15"
                      y="-12"
                      width="30"
                      height="24"
                      rx="4"
                      fill="#38bdf8"
                      stroke="#0284c7"
                      strokeWidth="2"
                    />
                    <line x1="0" y1="-12" x2="0" y2="12" stroke="#ffffff" strokeWidth="2" />
                  </g>

                  {/* REAR WHEEL LEFT (x=360, y=45) with DRS Steer Angle */}
                  <g transform={`translate(355, 45) rotate(${state.calculatedRearSteerDeg})`}>
                    <rect
                      x="-15"
                      y="-12"
                      width="30"
                      height="24"
                      rx="4"
                      fill={state.calculatedRearSteerDeg !== 0 ? "#f59e0b" : "#475569"}
                      stroke={state.calculatedRearSteerDeg !== 0 ? "#d97706" : "#64748b"}
                      strokeWidth="2"
                    />
                    <line x1="0" y1="-12" x2="0" y2="12" stroke="#ffffff" strokeWidth="2" />
                  </g>

                  {/* REAR WHEEL RIGHT (x=360, y=235) with DRS Steer Angle */}
                  <g transform={`translate(355, 235) rotate(${state.calculatedRearSteerDeg})`}>
                    <rect
                      x="-15"
                      y="-12"
                      width="30"
                      height="24"
                      rx="4"
                      fill={state.calculatedRearSteerDeg !== 0 ? "#f59e0b" : "#475569"}
                      stroke={state.calculatedRearSteerDeg !== 0 ? "#d97706" : "#64748b"}
                      strokeWidth="2"
                    />
                    <line x1="0" y1="-12" x2="0" y2="12" stroke="#ffffff" strokeWidth="2" />
                  </g>

                  {/* Steering Angle Annotations */}
                  <text
                    x="165"
                    y="22"
                    fill="#38bdf8"
                    fontSize="13"
                    fontWeight="bold"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    Front: {state.calculatedFrontSteerDeg > 0 ? `+${state.calculatedFrontSteerDeg}°` : `${state.calculatedFrontSteerDeg}°`}
                  </text>

                  <text
                    x="355"
                    y="22"
                    fill="#f59e0b"
                    fontSize="13"
                    fontWeight="bold"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    DRS Rear: {state.calculatedRearSteerDeg > 0 ? `+${state.calculatedRearSteerDeg}°` : `${state.calculatedRearSteerDeg}°`}
                  </text>
                </svg>

                {/* Floating Phase Indicator */}
                <div className="absolute bottom-3 left-4 bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 rounded-lg flex items-center gap-2">
                  <span className="text-base text-slate-300 font-semibold">Active DRS Phase:</span>
                  <span
                    className={`font-mono font-bold text-base px-2 py-0.5 rounded ${
                      state.rearSteerPhase === 'COUNTER_PHASE'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : state.rearSteerPhase === 'IN_PHASE'
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {state.rearSteerPhase === 'COUNTER_PHASE'
                      ? 'COUNTER-PHASE (Low Speed Agility)'
                      : state.rearSteerPhase === 'IN_PHASE'
                      ? 'IN-PHASE (High Speed Damping)'
                      : 'CENTERED'}
                  </span>
                </div>
              </div>

              {/* DUAL_VECTOR_TORQUE Dynamic Torque Vectoring Bar */}
              <div className="mt-5 space-y-2">
                <div className="flex justify-between items-center text-base">
                  <span className="font-bold text-slate-200 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-400" />
                    DUAL_VECTOR_TORQUE Dynamic Torque Distribution
                  </span>
                  <span className="font-mono font-bold text-white text-base">
                    {state.dual_vector_torqueFrontPct}% Front 2.4T Hybrid / {state.dual_vector_torqueRearPct}% Rear eAxle
                  </span>
                </div>
                <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden flex p-0.5 border border-slate-700">
                  <div
                    className="h-full bg-cyan-500 rounded-l-full transition-all duration-300"
                    style={{ width: `${state.dual_vector_torqueFrontPct}%` }}
                    title={`Front Axle: ${state.dual_vector_torqueFrontPct}%`}
                  ></div>
                  <div
                    className="h-full bg-amber-500 rounded-r-full transition-all duration-300"
                    style={{ width: `${state.dual_vector_torqueRearPct}%` }}
                    title={`Rear eAxle: ${state.dual_vector_torqueRearPct}%`}
                  ></div>
                </div>
                <div className="flex justify-between text-base text-slate-400 font-mono">
                  <span>Front Transaxle (Engine + MG1/MG2)</span>
                  <span>Rear High-Output eAxle Motor</span>
                </div>
              </div>

              {/* Turning Radius & Yaw Metrics Strip */}
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-base text-slate-400 font-semibold">Turning Circle Radius</span>
                    <span className="text-emerald-400 font-mono text-base font-bold flex items-center gap-1">
                      <TrendingDown className="w-4 h-4" />
                      -{state.turningRadiusReductionPct}%
                    </span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white font-mono">
                      {state.turningRadiusMeters.toFixed(1)}
                    </span>
                    <span className="text-base font-bold text-slate-400">meters</span>
                    <span className="text-base text-slate-400 font-mono ml-auto">
                      ({(state.turningRadiusMeters * 3.28084).toFixed(1)} ft curb)
                    </span>
                  </div>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-base text-slate-400 font-semibold">Side-Slip Angle (β)</span>
                    <span className="text-cyan-400 font-mono text-base font-bold">
                      Zero-Yaw Goal
                    </span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white font-mono">
                      {state.sideSlipAngleBetaDeg.toFixed(2)}°
                    </span>
                    <span className="text-base font-bold text-slate-400">damping</span>
                    <span className="text-base text-slate-400 font-mono ml-auto">
                      Yaw: {state.yawRateDegPerSec.toFixed(1)}°/s
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Python Source Code View */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-md font-mono text-base font-bold">
                drs_kinematics_engine.py
              </span>
              <span className="text-base text-slate-400">
                Pure Python 3.12 (Zero external C-bindings, clean room verified)
              </span>
            </div>

            <button
              onClick={copyToClipboard}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-base font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          <pre className="bg-slate-950 p-4 rounded-xl overflow-x-auto text-base font-mono text-slate-300 leading-relaxed border border-slate-800">
            <code>{pythonCode}</code>
          </pre>
        </div>
      )}
    </div>
  );
};
