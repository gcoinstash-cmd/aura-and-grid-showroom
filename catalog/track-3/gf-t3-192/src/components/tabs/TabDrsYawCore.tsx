import React, { useState } from 'react';
import { DrsPhysicsState } from '../../types/telemetry';
import {
  Gauge,
  Sliders,
  Code2,
  Copy,
  Check,
  Zap,
  Info,
  Car,
  TrendingDown,
  TrendingUp,
  RefreshCw
} from 'lucide-react';

interface TabDrsYawCoreProps {
  state: DrsPhysicsState;
  onUpdateSensors: (speed: number, steer: number, latG: number) => void;
  onReset: () => void;
}

const PYTHON_CODE = `"""
GF-T3-192: Dynamic Rear Steering (DRS) & DUAL_VECTOR_TORQUE AWD Arbitration Engine
Target Vehicle: Heavy Overland Dynamics Platform High-Output Multi-Node Core (Modular Cyber-Physical Chassis Architecture, 3.5L V6 PHEV)
License: MIT Permissive | Clean-Room Audited
"""
from dataclasses import dataclass
import math
import time
import hmac
import hashlib

# Vehicle Physical Geometry
WHEELBASE_METERS = 2.950          # L
FRONT_AXLE_TO_CG = 1.415          # a
REAR_AXLE_TO_CG = 1.535           # b
CURB_WEIGHT_KG = 2440.0           # m
STEERING_RACK_RATIO = 14.8        # Steering wheel deg to front wheel deg
MAX_REAR_TOE_DEG = 4.0            # +/- 4.0 degrees mechanical limit
CROSSOVER_SPEED_KMH = 80.0        # Anti-phase (<80) vs In-phase (>=80)
HYSTERESIS_BAND_KMH = 2.5         # Prevents phase hunting around 80 km/h
BALLSCREW_PITCH_MM_PER_DEG = 4.25 # Linear actuator displacement coefficient

@dataclass(slots=True)
class TelemetryInput:
    speed_kmh: float
    steering_wheel_deg: float
    lateral_accel_g: float
    bldc_phase_current_a: float
    rack_linear_feedback_mm: float

@dataclass(slots=True)
class ArbitrationOutput:
    front_wheel_angle_deg: float
    target_rear_toe_deg: float
    phase_mode: str
    dual_vector_torque_front_pct: float
    dual_vector_torque_rear_pct: float
    turning_radius_m: float
    divergence_error_mm: float
    quarantine_alert: bool
    hmac_signature: str

class OverlandTxDrsCore:
    def __init__(self, hmac_key: bytes):
        self.key = hmac_key
        self.last_rear_toe = 0.0
        self.prev_hmac = "0" * 64
        self.frame_nonce = 1000000

    def step(self, inp: TelemetryInput, dt_s: float = 0.0004) -> ArbitrationOutput:
        self.frame_nonce += 1
        front_deg = inp.steering_wheel_deg / STEERING_RACK_RATIO

        # Anti-phase counter-steer (<80 km/h) vs In-phase crab-angle (>=80 km/h)
        if inp.speed_kmh < (CROSSOVER_SPEED_KMH - HYSTERESIS_BAND_KMH / 2.0):
            mode = "ANTI_PHASE_TURNING"
            # Low-speed agility: steer opposite to front rack
            speed_decay = max(0.12, 1.0 - (inp.speed_kmh / CROSSOVER_SPEED_KMH))
            target_rear = -front_deg * 0.32 * speed_decay
        elif inp.speed_kmh > (CROSSOVER_SPEED_KMH + HYSTERESIS_BAND_KMH / 2.0):
            mode = "IN_PHASE_STABILIZATION"
            # High-speed stability: steer parallel with front rack
            speed_ramp = min(1.0, (inp.speed_kmh - CROSSOVER_SPEED_KMH) / 35.0)
            target_rear = front_deg * 0.22 * speed_ramp
        else:
            mode = "NEUTRAL_ZERO_OFFSET"
            target_rear = 0.0

        # Mechanical stroke clamp: [-4.0°, +4.0°]
        target_rear = max(-MAX_REAR_TOE_DEG, min(MAX_REAR_TOE_DEG, target_rear))

        # Dynamic Slew Rate Limiting (12.0 deg/s max actuator velocity)
        max_delta = 12.0 * dt_s
        target_rear = self.last_rear_toe + max(-max_delta, min(max_delta, target_rear - self.last_rear_toe))
        self.last_rear_toe = target_rear

        # DUAL_VECTOR_TORQUE AWD torque vectoring arbitration (80:20 up to 20:80 split)
        lat_ratio = min(1.0, abs(inp.lateral_accel_g) / 0.8)
        rear_torque_pct = 20.0 + (60.0 * lat_ratio)
        if mode == "IN_PHASE_STABILIZATION":
            rear_torque_pct = min(80.0, rear_torque_pct + 10.0)
        front_torque_pct = 100.0 - rear_torque_pct

        # Kinematic turning radius R = L / (tan(delta_f) - tan(delta_r))
        delta_f_rad = math.radians(abs(front_deg))
        delta_r_rad = math.radians(target_rear) if mode == "ANTI_PHASE_TURNING" else -math.radians(target_rear)
        denom = max(0.001, math.tan(delta_f_rad) + math.tan(abs(delta_r_rad)))
        radius_m = WHEELBASE_METERS / denom if abs(front_deg) > 0.1 else 999.9

        # Actuator linear displacement consistency check
        expected_rack_mm = target_rear * BALLSCREW_PITCH_MM_PER_DEG
        divergence = abs(inp.rack_linear_feedback_mm - expected_rack_mm)
        quarantine = (divergence > 0.850) or (inp.bldc_phase_current_a > 38.0)

        # Cryptographic chain computation
        msg = f"{self.frame_nonce}:{inp.speed_kmh:.1f}:{front_deg:.3f}:{target_rear:.3f}:{self.prev_hmac}"
        sig = hmac.new(self.key, msg.encode(), hashlib.sha256).hexdigest()
        self.prev_hmac = sig

        return ArbitrationOutput(
            front_wheel_angle_deg=round(front_deg, 3),
            target_rear_toe_deg=round(target_rear, 3),
            phase_mode=mode,
            dual_vector_torque_front_pct=round(front_torque_pct, 1),
            dual_vector_torque_rear_pct=round(rear_torque_pct, 1),
            turning_radius_m=round(radius_m, 2),
            divergence_error_mm=round(divergence, 3),
            quarantine_alert=quarantine,
            hmac_signature=sig
        )
`;

export const TabDrsYawCore: React.FC<TabDrsYawCoreProps> = ({
  state,
  onUpdateSensors,
  onReset,
}) => {
  const [copied, setCopied] = useState(false);
  const [activePreset, setActivePreset] = useState<string>('custom');

  const handleCopy = () => {
    navigator.clipboard.writeText(PYTHON_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const setPreset = (name: string, speed: number, steer: number, latG: number) => {
    setActivePreset(name);
    onUpdateSensors(speed, steer, latG);
  };

  // Visual calculations for SVG
  const frontDeg = state.frontWheelAngleDeg;
  const rearDeg = state.rearWheelAngleDeg;
  const isAntiPhase = state.phaseMode.includes('ANTI');
  const isInPhase = state.phaseMode.includes('IN_PHASE');

  return (
    <div className="space-y-6">
      {/* Overview & Mode Status Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                DRS Dynamic Yaw Control & DUAL_VECTOR_TORQUE Core
              </h2>
            </div>
            <p className="text-slate-300 text-base leading-relaxed">
              Heavy Overland Dynamics Platform High-Output Multi-Node Core continuous rear toe-angle arbitration ($\pm 4.0^\circ$) coupled with 3.5L V6 PHEV rear e-Axle torque vectoring.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`text-base font-bold px-3 py-1.5 rounded-lg border flex items-center gap-2 ${
                isAntiPhase
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : isInPhase
                  ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              {isAntiPhase ? (
                <>
                  <TrendingDown className="w-5 h-5 text-amber-400" />
                  <span>ANTI-PHASE (<span className="font-mono">&lt;80 km/h</span>)</span>
                </>
              ) : isInPhase ? (
                <>
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                  <span>IN-PHASE CRAB (<span className="font-mono">&ge;80 km/h</span>)</span>
                </>
              ) : (
                <>
                  <span>NEUTRAL DEAD-BAND</span>
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Preset Scenario Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-slate-300 font-semibold text-base flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            Operational Drive Scenarios
          </span>
          <button
            onClick={() => {
              setActivePreset('custom');
              onReset();
            }}
            className="text-slate-400 hover:text-white text-sm font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => setPreset('parking', 12, 380, 0.15)}
            className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
              activePreset === 'parking'
                ? 'bg-amber-500/15 border-amber-500/60 text-white shadow-md'
                : 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="text-base font-bold">1. Tight Parking Radius</div>
            <div className="text-xs text-amber-400 font-mono mt-0.5">12 km/h · Full Lock Counter-Steer</div>
          </button>

          <button
            onClick={() => setPreset('city', 45, 180, 0.35)}
            className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
              activePreset === 'city'
                ? 'bg-amber-500/15 border-amber-500/60 text-white shadow-md'
                : 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="text-base font-bold">2. Urban Intersection</div>
            <div className="text-xs text-amber-400 font-mono mt-0.5">45 km/h · Anti-Phase Turn</div>
          </button>

          <button
            onClick={() => setPreset('highway', 115, 65, 0.45)}
            className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
              activePreset === 'highway'
                ? 'bg-cyan-500/15 border-cyan-500/60 text-white shadow-md'
                : 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="text-base font-bold">3. Interstate Lane Change</div>
            <div className="text-xs text-cyan-400 font-mono mt-0.5">115 km/h · In-Phase Crab Stabilizer</div>
          </button>

          <button
            onClick={() => setPreset('sport', 145, 120, 0.72)}
            className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
              activePreset === 'sport'
                ? 'bg-emerald-500/15 border-emerald-500/60 text-white shadow-md'
                : 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="text-base font-bold">4. High-Frequency Compute Mode High Lateral</div>
            <div className="text-xs text-emerald-400 font-mono mt-0.5">145 km/h · 20:80 DUAL_VECTOR_TORQUE Vector</div>
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive Visualization & Real-time Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visual Chassis Kinematics (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-300 font-bold text-lg flex items-center gap-2">
              <Car className="w-5 h-5 text-amber-400" />
              Heavy Overland Dynamics Platform Modular Cyber-Physical Chassis Dynamic Steering Kinematics
            </span>
            <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2.5 py-1 rounded">
              Wheelbase: 2,950 mm
            </span>
          </div>

          {/* SVG Vehicle Simulation Canvas */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex flex-col items-center justify-center relative min-h-[360px]">
            {/* Speed threshold indicator overlay */}
            <div className="absolute top-3 left-4 text-xs font-mono flex items-center gap-3 text-slate-400">
              <span>Crossover: <strong className="text-white">80.0 km/h</strong></span>
              <span>·</span>
              <span>
                Current: <strong className="text-amber-400 font-bold">{state.vehicleSpeedKmh.toFixed(0)} km/h</strong>
              </span>
            </div>

            <svg viewBox="0 0 460 330" className="w-full max-w-[420px] h-auto">
              {/* Centerline */}
              <line x1="230" y1="20" x2="230" y2="310" stroke="#334155" strokeWidth="1.5" strokeDasharray="4 4" />

              {/* Turning radius curvature guide */}
              {Math.abs(frontDeg) > 0.5 && (
                <path
                  d={
                    isAntiPhase
                      ? "M 230 40 Q 280 160 230 290"
                      : "M 230 40 Q 250 160 270 290"
                  }
                  fill="none"
                  stroke={isAntiPhase ? "rgba(245, 158, 11, 0.25)" : "rgba(6, 182, 212, 0.25)"}
                  strokeWidth="3"
                  strokeDasharray="6 4"
                />
              )}

              {/* Vehicle Body Chassis Box (Heavy Overland Dynamics Platform TX Profile) */}
              <rect
                x="160"
                y="40"
                width="140"
                height="240"
                rx="18"
                fill="#0f172a"
                stroke="#1e293b"
                strokeWidth="2.5"
              />

              {/* Cabin & Rooflines */}
              <rect
                x="172"
                y="85"
                width="116"
                height="150"
                rx="10"
                fill="#1e293b"
                fillOpacity="0.5"
                stroke="#334155"
                strokeWidth="1"
              />

              {/* Front Axle Bar */}
              <line x1="145" y1="75" x2="315" y2="75" stroke="#475569" strokeWidth="4" />
              {/* Front Differential / DUAL_VECTOR_TORQUE Motor representation */}
              <rect x="210" y="66" width="40" height="18" rx="3" fill="#3b82f6" />
              <text x="230" y="79" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">e-CVT</text>

              {/* Rear Axle Bar */}
              <line x1="145" y1="245" x2="315" y2="245" stroke="#475569" strokeWidth="4" />
              {/* Rear DUAL_VECTOR_TORQUE High-Torque e-Axle */}
              <rect x="206" y="235" width="48" height="20" rx="3" fill="#10b981" />
              <text x="230" y="249" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">e-Axle</text>

              {/* FRONT LEFT WHEEL */}
              <g transform={`translate(145, 75) rotate(${frontDeg})`}>
                <rect x="-10" y="-24" width="20" height="48" rx="5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
                <line x1="0" y1="-28" x2="0" y2="-44" stroke="#38bdf8" strokeWidth="2.5" />
                <polygon points="-4,-40 0,-48 4,-40" fill="#38bdf8" />
              </g>

              {/* FRONT RIGHT WHEEL */}
              <g transform={`translate(315, 75) rotate(${frontDeg})`}>
                <rect x="-10" y="-24" width="20" height="48" rx="5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
                <line x1="0" y1="-28" x2="0" y2="-44" stroke="#38bdf8" strokeWidth="2.5" />
                <polygon points="-4,-40 0,-48 4,-40" fill="#38bdf8" />
              </g>

              {/* REAR LEFT WHEEL (DRS Controlled) */}
              <g transform={`translate(145, 245) rotate(${rearDeg})`}>
                <rect
                  x="-10"
                  y="-24"
                  width="20"
                  height="48"
                  rx="5"
                  fill={isAntiPhase ? "#f59e0b" : "#06b6d4"}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                <line
                  x1="0"
                  y1={rearDeg >= 0 ? "-28" : "-28"}
                  x2="0"
                  y2="-42"
                  stroke={isAntiPhase ? "#f59e0b" : "#06b6d4"}
                  strokeWidth="2.5"
                />
                <polygon
                  points="-4,-38 0,-46 4,-38"
                  fill={isAntiPhase ? "#f59e0b" : "#06b6d4"}
                />
              </g>

              {/* REAR RIGHT WHEEL (DRS Controlled) */}
              <g transform={`translate(315, 245) rotate(${rearDeg})`}>
                <rect
                  x="-10"
                  y="-24"
                  width="20"
                  height="48"
                  rx="5"
                  fill={isAntiPhase ? "#f59e0b" : "#06b6d4"}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                <line
                  x1="0"
                  y1={rearDeg >= 0 ? "-28" : "-28"}
                  x2="0"
                  y2="-42"
                  stroke={isAntiPhase ? "#f59e0b" : "#06b6d4"}
                  strokeWidth="2.5"
                />
                <polygon
                  points="-4,-38 0,-46 4,-38"
                  fill={isAntiPhase ? "#f59e0b" : "#06b6d4"}
                />
              </g>

              {/* Front Wheel Angle Label */}
              <text x="230" y="48" textAnchor="middle" fill="#94a3b8" fontSize="12" fontWeight="600">
                Front Rack Angle: <tspan fill="#38bdf8" fontWeight="bold">{frontDeg.toFixed(1)}°</tspan>
              </text>

              {/* Rear Wheel Angle Label */}
              <text x="230" y="280" textAnchor="middle" fill="#94a3b8" fontSize="12" fontWeight="600">
                Rear DRS Toe: <tspan fill={isAntiPhase ? "#f59e0b" : "#06b6d4"} fontWeight="bold">
                  {rearDeg > 0 ? `+${rearDeg.toFixed(2)}` : rearDeg.toFixed(2)}°
                </tspan>
              </text>

              {/* Phase description in chassis center */}
              <rect x="180" y="135" width="100" height="45" rx="6" fill="#020617" stroke="#334155" />
              <text x="230" y="152" textAnchor="middle" fill="#cbd5e1" fontSize="10" fontWeight="bold">
                {isAntiPhase ? 'COUNTER-STEER' : isInPhase ? 'CRAB YAW-DAMP' : 'NEUTRAL'}
              </text>
              <text x="230" y="168" textAnchor="middle" fill={isAntiPhase ? "#fbbf24" : "#22d3ee"} fontSize="9" fontWeight="bold">
                {isAntiPhase ? 'Shortens Wheelbase' : isInPhase ? 'Stabilizes High-G' : 'Center Aligned'}
              </text>
            </svg>

            {/* Readout Footnote */}
            <div className="w-full mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Turning Radius: <strong className="text-white">{state.turningRadiusMeters.toFixed(1)} m</strong></span>
              <span>Curb Circle Benefit: <strong className="text-emerald-400">-{(state.curbRadiusDeltaMeters).toFixed(2)} m</strong></span>
              <span>Rack Travel: <strong className="text-white">{state.rackDisplacementMm.toFixed(2)} mm</strong></span>
            </div>
          </div>

          {/* DUAL_VECTOR_TORQUE Torque Vectoring Meter */}
          <div className="mt-4 p-3 bg-slate-950 border border-slate-800 rounded-lg">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-bold text-slate-300 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-emerald-400" />
                DUAL_VECTOR_TORQUE PHEV Dynamic Torque Distribution
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                {state.dual_vector_torqueFrontRatio}% Front : {state.dual_vector_torqueRearRatio}% Rear e-Axle
              </span>
            </div>
            {/* Split Bar */}
            <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden flex">
              <div
                className="bg-blue-500 transition-all duration-200 flex items-center justify-center text-[10px] font-bold text-white font-mono"
                style={{ width: `${state.dual_vector_torqueFrontRatio}%` }}
              >
                Front {state.dual_vector_torqueFrontRatio}%
              </div>
              <div
                className="bg-emerald-500 transition-all duration-200 flex items-center justify-center text-[10px] font-bold text-slate-950 font-mono"
                style={{ width: `${state.dual_vector_torqueRearRatio}%` }}
              >
                Rear {state.dual_vector_torqueRearRatio}%
              </div>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-400 font-mono mt-1.5">
              <span>Front: 3.5L V6 Atkinson + Transaxle Motor</span>
              <span>Rear: 150 kW High-Torque Water-Cooled e-Axle</span>
            </div>
          </div>
        </div>

        {/* Right Column: Live Telemetry Knobs & Mathematical Equations (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Sliders Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-400" />
              Dynamic Sensor Simulation Inputs
            </h3>

            {/* Slider 1: Vehicle Speed */}
            <div>
              <div className="flex justify-between items-center text-base mb-1">
                <label className="text-slate-300 font-semibold">Vehicle Forward Speed</label>
                <span className="font-mono text-amber-400 font-bold text-lg">
                  {state.vehicleSpeedKmh.toFixed(0)} <span className="text-xs text-slate-400">km/h</span>
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="180"
                step="1"
                value={state.vehicleSpeedKmh}
                onChange={(e) => {
                  setActivePreset('custom');
                  onUpdateSensors(parseFloat(e.target.value), state.steeringWheelDeg, state.lateralAccelG);
                }}
                className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-xs text-slate-500 font-mono mt-0.5">
                <span>0 km/h (Parking)</span>
                <span className="text-amber-400 font-bold">80 km/h Crossover</span>
                <span>180 km/h (Autobahn)</span>
              </div>
            </div>

            {/* Slider 2: Steering Wheel Angle */}
            <div>
              <div className="flex justify-between items-center text-base mb-1">
                <label className="text-slate-300 font-semibold">Steering Wheel Angle</label>
                <span className="font-mono text-cyan-400 font-bold text-lg">
                  {state.steeringWheelDeg > 0 ? `+${state.steeringWheelDeg.toFixed(0)}` : state.steeringWheelDeg.toFixed(0)}°
                </span>
              </div>
              <input
                type="range"
                min="-540"
                max="540"
                step="5"
                value={state.steeringWheelDeg}
                onChange={(e) => {
                  setActivePreset('custom');
                  onUpdateSensors(state.vehicleSpeedKmh, parseFloat(e.target.value), state.lateralAccelG);
                }}
                className="w-full accent-cyan-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-xs text-slate-500 font-mono mt-0.5">
                <span>-540° (Full Left)</span>
                <span>0° (Center)</span>
                <span>+540° (Full Right)</span>
              </div>
            </div>

            {/* Slider 3: Lateral Acceleration */}
            <div>
              <div className="flex justify-between items-center text-base mb-1">
                <label className="text-slate-300 font-semibold">Lateral Acceleration (a_y)</label>
                <span className="font-mono text-emerald-400 font-bold text-lg">
                  {state.lateralAccelG > 0 ? `+${state.lateralAccelG.toFixed(2)}` : state.lateralAccelG.toFixed(2)} <span className="text-xs text-slate-400">G</span>
                </span>
              </div>
              <input
                type="range"
                min="-0.80"
                max="0.80"
                step="0.05"
                value={state.lateralAccelG}
                onChange={(e) => {
                  setActivePreset('custom');
                  onUpdateSensors(state.vehicleSpeedKmh, state.steeringWheelDeg, parseFloat(e.target.value));
                }}
                className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-xs text-slate-500 font-mono mt-0.5">
                <span>-0.80 G (Hard Left)</span>
                <span>0.00 G</span>
                <span>+0.80 G (Hard Right)</span>
              </div>
            </div>
          </div>

          {/* Mathematical Equations Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <h3 className="text-base font-bold text-slate-200 flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-cyan-400" />
              Kinematic Equations of Motion
            </h3>
            <div className="space-y-2 text-xs font-mono text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div className="text-amber-400 font-bold">1. Anti-Phase Yaw Rate Gain (v &lt; 80 km/h):</div>
              <div className="text-slate-400 pl-2">
                δ_r = -δ_f · 0.32 · [1 - (v / 80.0)]
              </div>
              <div className="text-cyan-400 font-bold pt-1">2. In-Phase Crab Stabilization (v ≥ 80 km/h):</div>
              <div className="text-slate-400 pl-2">
                δ_r = +δ_f · 0.22 · min(1.0, (v - 80.0)/35.0)
              </div>
              <div className="text-emerald-400 font-bold pt-1">3. DUAL_VECTOR_TORQUE Torque Partition:</div>
              <div className="text-slate-400 pl-2">
                T_rear = 0.20 + 0.60 · (|a_y| / 0.80)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Production Python 3.12 Engine Code Viewer */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-white">
              Production Python 3.12 Dynamic Steering Arbiter (<span className="font-mono text-amber-400 text-sm">tx_drs_arbiter.py</span>)
            </h3>
          </div>
          <button
            onClick={handleCopy}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold font-mono inline-flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied to Clipboard</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Python 3.12 Source</span>
              </>
            )}
          </button>
        </div>

        <pre className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-300 overflow-x-auto max-h-[380px] leading-relaxed">
          <code>{PYTHON_CODE}</code>
        </pre>
      </div>
    </div>
  );
};
