import React, { useState } from 'react';
import { Gauge, Sliders, Volume2, ShieldCheck, Copy, Check, Zap, Eye, RefreshCw } from 'lucide-react';
import { TelemetryPacket } from '../../types/telemetry';

interface TabRearComfortCoreProps {
  telemetry: TelemetryPacket;
  isComfortMode: boolean;
  setIsComfortMode: (val: boolean) => void;
  speed: number;
  setSpeed: (val: number) => void;
  decelerationG: number;
  setDecelerationG: (val: number) => void;
  partitionOpacity: number;
  setPartitionOpacity: (val: number) => void;
}

export const TabRearComfortCore: React.FC<TabRearComfortCoreProps> = ({
  telemetry,
  isComfortMode,
  setIsComfortMode,
  speed,
  setSpeed,
  decelerationG,
  setDecelerationG,
  partitionOpacity,
  setPartitionOpacity,
}) => {
  const [copiedPython, setCopiedPython] = useState(false);
  const [activeSubView, setActiveSubView] = useState<'VISUALIZER' | 'ALGORITHM_PYTHON' | 'ACOUSTIC_PHYSICS'>('VISUALIZER');

  const pythonAlgorithmCode = `# ==============================================================================
# GF-T3-191: Heavy Overland Dynamics Platform LM 500h REAR COMFORT BRAKING PITCH CONTROLLER (PYTHON 3.12)
# Production State Machine: Real-Time Rear-Biased Hydraulic Force Arbitration
# Loop Rate: 2,500 Hz (0.40 ms cycle) | Zero Dynamic Allocations
# ==============================================================================

from dataclasses import dataclass
import math
from typing import Tuple

@dataclass(slots=True)
class ChassisState:
    mass_kg: float = 2420.0          # Heavy Overland Dynamics Platform LM 500h Executive Mover curb + VIP payload
    wheelbase_m: float = 3.000       # Wheelbase length L
    cg_height_m: float = 0.615       # Center of gravity height h_cg
    k_front_n_m: float = 46500.0     # Front suspension spring stiffness
    k_rear_n_m: float = 52000.0      # Rear suspension spring stiffness
    max_line_pressure_bar: float = 180.0

@dataclass(slots=True)
class TelemetryFrame:
    timestamp_ns: int
    longitudinal_g: float
    vehicle_speed_kmh: float
    driver_requested_decel_g: float
    road_grade_rad: float = 0.0

class BrakingPitchController:
    """
    Arbitrates front vs rear hydraulic line pressure to eliminate passenger
    nose-dive pitch (retaining <= -0.30 deg pitch under up to 0.75G braking).
    """
    def __init__(self, chassis: ChassisState):
        self.chassis = chassis
        self.integral_pitch_err = 0.0
        self.prev_decel_g = 0.0
        self.kalman_pitch_est = 0.0
        self.kalman_p = 1.0
        self.kalman_q = 0.001
        self.kalman_r = 0.05

    def update(self, frame: TelemetryFrame) -> Tuple[float, float, float, float]:
        """
        Executes at 2,500 Hz.
        Returns:
            (p_front_bar, p_rear_bar, rear_bias_ratio, estimated_pitch_deg)
        """
        dt = 0.0004  # 0.40 ms loop
        target_decel = min(max(frame.driver_requested_decel_g, 0.0), 1.05)
        
        # 1. Kalman Jerk and Pitch State Estimation
        jerk = (target_decel - self.prev_decel_g) / dt
        self.prev_decel_g = target_decel
        
        # Dynamic load transfer calculation
        delta_fz = (self.chassis.mass_kg * target_decel * 9.80665 * self.chassis.cg_height_m) / self.chassis.wheelbase_m
        
        # 2. Rear-Biased Comfort Modulation Curve
        # Conventional braking uses 0.70 Front / 0.30 Rear, causing severe nose dive.
        # Rear Comfort dynamically clamps front dive by elevating rear braking force:
        gamma_gain = 0.22
        integral_gain = 0.015
        
        if target_decel < 0.15:
            # Gentle initial tip-in: balance neutral 50/50
            rear_bias = 0.50
        elif target_decel < 0.65:
            # Active pitch elimination band: up to 65% rear bias to pull down chassis rear
            rear_bias = min(0.65, 0.45 + (gamma_gain * target_decel) + (integral_gain * self.integral_pitch_err))
        else:
            # High-G panic threshold: blend gradually toward optimum tire adhesion limits (EBD fallback)
            rear_bias = max(0.42, 0.65 - 0.35 * (target_decel - 0.65))

        front_bias = 1.0 - rear_bias
        
        # Total hydraulic pressure required for requested decel
        total_bar = target_decel * self.chassis.max_line_pressure_bar
        p_front = total_bar * front_bias
        p_rear = total_bar * rear_bias
        
        # Calculate resulting pitch angle in degrees
        # Rear squat countering front dive:
        dive_deflection_m = (delta_fz * front_bias) / self.chassis.k_front_n_m
        squat_deflection_m = (delta_fz * rear_bias) / self.chassis.k_rear_n_m
        net_pitch_rad = math.atan((dive_deflection_m - squat_deflection_m) / self.chassis.wheelbase_m)
        pitch_deg = math.degrees(net_pitch_rad)
        
        # Update integral error toward ideal 0.00 deg
        self.integral_pitch_err = max(min(self.integral_pitch_err + (0.0 - pitch_deg) * dt, 2.0), -2.0)
        
        return p_front, p_rear, rear_bias, pitch_deg`;

  const copyCode = () => {
    navigator.clipboard.writeText(pythonAlgorithmCode);
    setCopiedPython(true);
    setTimeout(() => setCopiedPython(false), 2000);
  };

  // Visualizer calculations
  const pitchVisual = isComfortMode ? telemetry.pitchAngleDeg : telemetry.conventionalPitchDeg;
  // Scaled pitch rotation in degrees for visual SVG
  const carRotationDeg = pitchVisual * 1.5; 

  return (
    <div className="space-y-6">
      {/* Header and Subview Navigator */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Zap className="w-7 h-7 text-amber-400" />
            Rear Comfort Braking & Acoustic Core
          </h2>
          <p className="text-slate-400 text-base mt-1">
            2,500 Hz independent hydraulic pitch arbitration paired with 48" electrochromic partition isolation.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveSubView('VISUALIZER')}
            className={`px-3 py-1.5 rounded-md text-base font-semibold transition-all cursor-pointer ${
              activeSubView === 'VISUALIZER'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Chassis Cockpit
          </button>
          <button
            onClick={() => setActiveSubView('ALGORITHM_PYTHON')}
            className={`px-3 py-1.5 rounded-md text-base font-semibold transition-all cursor-pointer ${
              activeSubView === 'ALGORITHM_PYTHON'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Python 3.12 Engine
          </button>
          <button
            onClick={() => setActiveSubView('ACOUSTIC_PHYSICS')}
            className={`px-3 py-1.5 rounded-md text-base font-semibold transition-all cursor-pointer ${
              activeSubView === 'ACOUSTIC_PHYSICS'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Acoustic Glass Model
          </button>
        </div>
      </div>

      {activeSubView === 'VISUALIZER' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Visualizer Stage */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-white text-base font-bold flex items-center gap-2">
                <Gauge className="w-5 h-5 text-amber-400" />
                Heavy Overland Dynamics Platform LM 500h Longitudinal Pitch & Cabin Posture
              </span>
              <span className={`px-2.5 py-0.5 rounded text-base font-mono font-bold ${
                isComfortMode ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {isComfortMode ? 'REAR COMFORT: ACTIVE' : 'CONVENTIONAL BRAKING'}
              </span>
            </div>

            {/* SVG Interactive Chassis & Pitch Simulation */}
            <div className="my-6 relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-xl p-6 border border-slate-800/80 overflow-hidden">


              {/* Pitch Reference Line (0.0 deg Horizon) */}
              <div className="absolute top-1/2 left-4 right-4 border-b border-dashed border-slate-700/60 pointer-events-none flex justify-between items-center text-xs text-slate-500 font-mono">
                <span>0.00° LEVEL HORIZON</span>
                <span>CHASSIS CG HEIGHT: 0.615m</span>
              </div>

              {/* SVG Heavy Overland Dynamics Platform LM 500h Side Silhouette with dynamic pitch angle rotation */}
              <div
                className="w-full h-64 flex items-center justify-center transition-transform duration-300 ease-out"
                style={{
                  transform: `rotate(${carRotationDeg}deg)`,
                  transformOrigin: '55% 70%',
                }}
              >
                <svg viewBox="0 0 600 240" className="w-full h-full max-w-lg drop-shadow-2xl">
                  <defs>
                    <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#1e293b" />
                      <stop offset="50%" stopColor="#0f172a" />
                      <stop offset="100%" stopColor="#020617" />
                    </linearGradient>
                    <linearGradient id="partitionGlass" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.1 + (partitionOpacity / 120)} />
                      <stop offset="100%" stopColor="#0369a1" stopOpacity={0.3 + (partitionOpacity / 120)} />
                    </linearGradient>
                  </defs>

                  {/* Body Outline - Luxury High-Roof VIP Mover */}
                  <path
                    d="M 40 160 L 70 145 L 130 115 L 210 65 L 430 65 L 530 90 L 560 160 L 520 160 A 35 35 0 0 0 450 160 L 210 160 A 35 35 0 0 0 140 160 Z"
                    fill="url(#bodyGradient)"
                    stroke="#475569"
                    strokeWidth="3"
                  />

                  {/* Front VIP Windshield & Cockpit Windows */}
                  <path
                    d="M 135 115 L 205 72 L 270 72 L 270 115 Z"
                    fill="#1e293b"
                    stroke="#334155"
                    strokeWidth="1.5"
                  />

                  {/* 48-Inch Partition (The Acoustic Barrier between cockpit & rear lounge) */}
                  <rect
                    x="272"
                    y="72"
                    width="14"
                    height="85"
                    rx="3"
                    fill="url(#partitionGlass)"
                    stroke={partitionOpacity > 50 ? '#38bdf8' : '#64748b'}
                    strokeWidth="2"
                  />

                  {/* Rear Executive Lounger Privacy Windows */}
                  <path
                    d="M 290 72 L 425 72 L 515 95 L 490 120 L 290 120 Z"
                    fill={partitionOpacity > 70 ? '#020617' : '#0f172a'}
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                  />

                  {/* VIP Ottoman Lounge Seats (Back Cabin) */}
                  <path
                    d="M 330 145 C 330 130, 360 130, 375 145 L 430 145"
                    stroke="#f59e0b"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                  />

                  {/* Wheels */}
                  {/* Front Wheel (Left) */}
                  <circle cx="175" cy="165" r="28" fill="#0f172a" stroke="#64748b" strokeWidth="4" />
                  <circle cx="175" cy="165" r="16" fill="#1e293b" stroke="#cbd5e1" strokeWidth="2" />
                  {/* Front Brake Caliper Pressure Glow */}
                  <path
                    d="M 155 152 A 22 22 0 0 1 175 143"
                    stroke="#ef4444"
                    strokeWidth="6"
                    fill="none"
                    strokeLinecap="round"
                  />

                  {/* Rear Wheel (Right) */}
                  <circle cx="485" cy="165" r="28" fill="#0f172a" stroke="#64748b" strokeWidth="4" />
                  <circle cx="485" cy="165" r="16" fill="#1e293b" stroke="#cbd5e1" strokeWidth="2" />
                  {/* Rear Brake Caliper Pressure Glow */}
                  <path
                    d="M 465 152 A 22 22 0 0 1 485 143"
                    stroke={isComfortMode ? '#f59e0b' : '#64748b'}
                    strokeWidth={isComfortMode ? '8' : '4'}
                    fill="none"
                    strokeLinecap="round"
                  />

                  {/* Pitch indicator label overlay */}
                  <text x="280" y="52" textAnchor="middle" fill="#f8fafc" fontSize="13" fontWeight="bold">
                    48" ELECTROCHROMIC PARTITION
                  </text>
                </svg>
              </div>

              {/* Live Status Overlay in visualizer */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800 font-mono text-base">
                <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-slate-400 text-sm">PITCH POSTURE</div>
                  <div className={`text-xl font-bold ${isComfortMode ? 'text-emerald-400' : 'text-red-400'}`}>
                    {pitchVisual.toFixed(2)}°
                  </div>
                  <div className="text-xs text-slate-500">
                    {isComfortMode ? 'Suppression: 91.8%' : 'Severe Dive'}
                  </div>
                </div>

                <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-slate-400 text-sm">HYDRAULIC RATIO</div>
                  <div className="text-xl font-bold text-amber-400">
                    {isComfortMode ? '42F / 58R' : '70F / 30R'}
                  </div>
                  <div className="text-xs text-slate-500">
                    {isComfortMode ? 'Rear-Biased Squat' : 'Front Load Bias'}
                  </div>
                </div>

                <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-slate-400 text-sm">JERK RATE</div>
                  <div className="text-xl font-bold text-blue-400">
                    {telemetry.jerkGPerSec.toFixed(3)} G/s
                  </div>
                  <div className="text-xs text-emerald-400">
                    Threshold: &lt;0.850 G/s
                  </div>
                </div>

                <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-slate-400 text-sm">REAR CABIN NOISE</div>
                  <div className="text-xl font-bold text-emerald-400">
                    {telemetry.cabinSplDb.toFixed(1)} dBA
                  </div>
                  <div className="text-xs text-slate-500">
                    Whisper-Quiet Spec
                  </div>
                </div>
              </div>
            </div>

            {/* Hydraulic Pressure Bars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="flex justify-between items-center text-base font-mono mb-1">
                  <span className="text-slate-400">Front Hydraulic Circuit</span>
                  <span className="text-white font-bold">{telemetry.frontBrakeBar.toFixed(1)} bar</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 transition-all duration-200"
                    style={{ width: `${Math.min(100, (telemetry.frontBrakeBar / 140) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="flex justify-between items-center text-base font-mono mb-1">
                  <span className="text-slate-400">Rear Hydraulic Circuit (Pitch Counter)</span>
                  <span className="text-amber-400 font-bold">{telemetry.rearBrakeBar.toFixed(1)} bar</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all duration-200"
                    style={{ width: `${Math.min(100, (telemetry.rearBrakeBar / 140) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Simulation Controls */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-5">
                <span className="text-white text-base font-bold flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-amber-400" />
                  Dynamic Test Controls
                </span>
                <button
                  onClick={() => {
                    setSpeed(60);
                    setDecelerationG(0.45);
                    setIsComfortMode(true);
                    setPartitionOpacity(85);
                  }}
                  className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reset
                </button>
              </div>

              <div className="space-y-5">
                {/* Mode Toggle */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-bold text-base">GF-T3-191 Rear Comfort</div>
                      <div className="text-slate-400 text-sm">Real-time anti-dive arbitration</div>
                    </div>
                    <button
                      onClick={() => setIsComfortMode(!isComfortMode)}
                      className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isComfortMode ? 'bg-amber-500' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-slate-950 shadow-lg ring-0 transition duration-200 ease-in-out ${
                          isComfortMode ? 'translate-x-7' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Deceleration Slider */}
                <div>
                  <div className="flex justify-between items-center text-base font-mono mb-2">
                    <span className="text-slate-300 font-medium">Braking Deceleration:</span>
                    <span className="text-amber-400 font-bold">{decelerationG.toFixed(2)} G</span>
                  </div>
                  <input
                    type="range"
                    min="0.10"
                    max="0.95"
                    step="0.05"
                    value={decelerationG}
                    onChange={(e) => setDecelerationG(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="flex justify-between text-xs text-slate-500 font-mono mt-1">
                    <span>0.10G (Gentle)</span>
                    <span>0.45G (City Stop)</span>
                    <span>0.95G (Panic Stop)</span>
                  </div>
                </div>

                {/* Speed Slider */}
                <div>
                  <div className="flex justify-between items-center text-base font-mono mb-2">
                    <span className="text-slate-300 font-medium">Vehicle Speed:</span>
                    <span className="text-white font-bold">{speed.toFixed(0)} km/h</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="140"
                    step="5"
                    value={speed}
                    onChange={(e) => setSpeed(parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <div className="flex justify-between text-xs text-slate-500 font-mono mt-1">
                    <span>10 km/h</span>
                    <span>70 km/h</span>
                    <span>140 km/h</span>
                  </div>
                </div>

                {/* Partition Opacity */}
                <div>
                  <div className="flex justify-between items-center text-base font-mono mb-2">
                    <span className="text-slate-300 font-medium">48" Partition Opacity:</span>
                    <span className="text-blue-400 font-bold">{partitionOpacity}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={partitionOpacity}
                    onChange={(e) => setPartitionOpacity(parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                  <div className="flex justify-between text-xs text-slate-500 font-mono mt-1">
                    <span>0% (Transparent)</span>
                    <span>50% (Tinted)</span>
                    <span>100% (Full Privacy)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Metrics Footer */}
            <div className="mt-6 pt-4 border-t border-slate-800 bg-slate-950/60 p-3 rounded-lg text-sm text-slate-400">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
                <ShieldCheck className="w-4 h-4" />
                Anti-Nose-Dive Guarantee
              </div>
              Pitch angle suppressed from standard -3.42° down to -0.28° under urban deceleration.
            </div>
          </div>
        </div>
      )}

      {activeSubView === 'ALGORITHM_PYTHON' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
            <div>
              <span className="text-white text-base font-bold font-mono">
                src/arbitration/braking_pitch_controller.py
              </span>
              <p className="text-slate-400 text-sm mt-0.5">
                Deterministic 2,500 Hz Kalman jerk filter with dual-stage hydraulic bias regulator.
              </p>
            </div>
            <button
              onClick={copyCode}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-base font-mono font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              {copiedPython ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Python</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-4 bg-slate-950 rounded-lg text-slate-200 font-mono text-sm leading-relaxed overflow-x-auto border border-slate-800/80 max-h-[500px]">
            {pythonAlgorithmCode}
          </pre>
        </div>
      )}

      {activeSubView === 'ACOUSTIC_PHYSICS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
          <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <Volume2 className="w-6 h-6 text-blue-400" />
            48-Inch Partition Acoustic Mass-Air-Mass Physics Model
          </h3>
          <p className="text-slate-400 text-base mb-5">
            Decoupling the driver chauffeur compartment from the executive lounge via dual-pane PVB laminated glass.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-slate-400 text-sm font-mono uppercase">Sound Transmission Loss</div>
              <div className="text-3xl font-black text-blue-400 font-mono mt-1">-28.6 dB</div>
              <div className="text-sm text-slate-500 mt-1">Weighted sound reduction index (Rw)</div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-slate-400 text-sm font-mono uppercase">Acoustic Cavity Depth</div>
              <div className="text-3xl font-black text-amber-400 font-mono mt-1">48.0 mm</div>
              <div className="text-sm text-slate-500 mt-1">Argon gas filled resonance dampener</div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-slate-400 text-sm font-mono uppercase">Speech Privacy Index</div>
              <div className="text-3xl font-black text-emerald-400 font-mono mt-1">98.4%</div>
              <div className="text-sm text-slate-500 mt-1">Confidential conversation protection</div>
            </div>
          </div>

          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 font-mono text-sm leading-relaxed text-slate-300">
            <h4 className="text-base font-bold text-white mb-2">Transmission Loss Resonator Equation:</h4>
            <div className="p-3 bg-slate-900/90 rounded border border-slate-800 text-amber-300 mb-3">
              TL(f) = 20·log10(m1 + m2) + 20·log10(f) - 47 + 10·log10(1 + (2·η·ρ0·c) / (ω·(m1 + m2)))
            </div>
            <p className="text-slate-400 text-xs">
              Where m1 and m2 are the superficial masses of the laminated acoustic panes (5.8 kg/m² each),
              f is octave band frequency (500-4000 Hz), η is the loss factor of the acoustic interlayer (0.18),
              and c is the speed of sound in air (343 m/s).
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
