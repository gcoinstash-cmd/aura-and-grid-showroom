import React, { useState } from 'react';
import { Wind, Gauge, Shield, Zap, RefreshCw, Copy, Check, Sliders, ChevronRight } from 'lucide-react';
import { TelemetryState, computeAeroMetrics } from '../../data/mockTelemetry';

interface CowlAeroTabProps {
  telemetry: TelemetryState;
  onUpdateTelemetry: (updates: Partial<TelemetryState>) => void;
  isSimulating: boolean;
}

export const CowlAeroTab: React.FC<CowlAeroTabProps> = ({
  telemetry,
  onUpdateTelemetry,
  isSimulating,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeSubView, setActiveSubView] = useState<'canvas' | 'code' | 'equations'>('canvas');

  const {
    speedMph,
    roofState,
    crosswindKt,
    cowlDamperForce,
    harmonicFrequencyHz,
    cowlDeflectionUm,
    cabinDecibels,
    suppressionDeltaDb,
    torsionalStiffnessGainPct,
    hydraulicPressurePsi,
  } = telemetry;

  const pythonCoreCode = `"""
GF-T3-189: Heavy Overland Dynamics Platform High-Aero Grand Touring Telemetry Core Convertible Structural Aero Core
Proprietary Cowl Resonant Damper & Boundary-Layer Vortex Suppression Engine
Target: URZ100 Platform (5.0L 2UR-GSE V8)
Language: Python 3.12 (Pure Standard Library + NumPy, Zero Copyleft Dependencies)
"""

from dataclasses import dataclass
from enum import Enum
import math
import time

class RoofState(Enum):
    STOWED = "STOWED"      # Open-top convertible configuration
    CLOSED = "CLOSED"      # Four-layer soft-top tensioned latched
    TRANSITION = "TRANSITION"

@dataclass(frozen=True)
class ChassisKinematics:
    speed_mph: float
    roof_state: RoofState
    cowl_deflection_microns: float
    crosswind_knots: float
    yaw_angle_rad: float
    timestamp_ns: int

@dataclass(frozen=True)
class DamperCommand:
    actuator_pressure_psi: float
    target_damping_ns_m: float
    cowl_counter_force_n: float
    boundary_layer_bleed_duty_cycle: float
    cabin_spl_attenuation_db: float

class CowlAeroMitigationEngine:
    """
    2,400 Hz Real-Time Structural Flex & Acoustic Suppression State Machine.
    Mitigates convertible cowl shake (18-34 Hz) and cabin buffeting.
    """
    
    # Calibrated physical constants for High-Aero Grand Touring Telemetry Core Convertible
    COWL_MASS_KG = 34.2
    BASE_CLOSED_NATURAL_FREQ_HZ = 26.8
    BASE_OPEN_NATURAL_FREQ_HZ = 19.4
    HYDRAULIC_MAX_FORCE_N = 8600.0
    AIR_DENSITY_SEA_LEVEL = 1.225  # kg/m^3

    def __init__(self, sample_rate_hz: int = 2400):
        self.sample_rate = sample_rate_hz
        self.dt = 1.0 / sample_rate_hz
        self.prev_displacement_m = 0.0
        self.integral_error = 0.0

    def compute_damping_response(self, state: ChassisKinematics) -> DamperCommand:
        v_mps = state.speed_mph * 0.44704
        x_m = state.cowl_deflection_microns * 1e-6
        v_deflection = (x_m - self.prev_displacement_m) / self.dt
        self.prev_displacement_m = x_m

        # 1. Structural Cowl Resonance Suppression
        # Open-top configuration loses shear box rigidity across header rail
        is_open = (state.roof_state == RoofState.STOWED)
        omega_n = 2.0 * math.pi * (self.BASE_OPEN_NATURAL_FREQ_HZ if is_open else self.BASE_CLOSED_NATURAL_FREQ_HZ)
        
        # Adaptive damping coefficient c_eff based on velocity and deflection
        zeta_target = 0.68 if is_open else 0.45
        c_critical = 2.0 * math.sqrt(self.COWL_MASS_KG * (omega_n ** 2 * self.COWL_MASS_KG))
        c_eff = min(8600.0, max(1200.0, zeta_target * c_critical))

        # Opposing damping force calculation
        f_damping = -c_eff * v_deflection - (32000.0 * x_m)
        f_clamped = min(self.HYDRAULIC_MAX_FORCE_N, max(-self.HYDRAULIC_MAX_FORCE_N, f_damping))

        # 2. Open-Top Dynamic Acoustic Boundary Layer Suppression
        # Stowed roof creates shear layer detachment over windshield header rail
        if is_open and v_mps > 15.0:
            q_dynamic = 0.5 * self.AIR_DENSITY_SEA_LEVEL * (v_mps ** 2)
            bleed_duty = min(1.0, max(0.0, (state.speed_mph - 35.0) / 90.0))
            suppression_db = min(14.2, 3.5 + 10.7 * (1.0 - math.exp(-v_mps / 22.0)))
        else:
            bleed_duty = 0.0
            suppression_db = 4.2 if not is_open else 0.0

        actuator_pressure = 450.0 + (abs(f_clamped) / self.HYDRAULIC_MAX_FORCE_N) * 1850.0

        return DamperCommand(
            actuator_pressure_psi=round(actuator_pressure, 1),
            target_damping_ns_m=round(c_eff, 1),
            cowl_counter_force_n=round(abs(f_clamped), 1),
            boundary_layer_bleed_duty_cycle=round(bleed_duty, 3),
            cabin_spl_attenuation_db=round(suppression_db, 1)
        )
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(pythonCoreCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Tab Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-6">
          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Wind className="w-8 h-8 text-amber-400" />
              Cowl Damper & Aero Acoustic State Machine
            </h2>
            <p className="text-base text-slate-300 mt-1">
              Active hydraulic cowl brace micro-stroke damping vs. chassis torsional flex & open-cockpit boundary layer vortex dissipation.
            </p>
          </div>

          {/* Sub-view toggle */}
          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800 self-start lg:self-auto">
            <button
              onClick={() => setActiveSubView('canvas')}
              className={`px-4 py-2 text-base font-semibold rounded-md transition-colors cursor-pointer ${
                activeSubView === 'canvas'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Interactive Telemetry & Aero Model
            </button>
            <button
              onClick={() => setActiveSubView('code')}
              className={`px-4 py-2 text-base font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSubView === 'code'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Python 3.12 Core
            </button>
            <button
              onClick={() => setActiveSubView('equations')}
              className={`px-4 py-2 text-base font-semibold rounded-md transition-colors cursor-pointer ${
                activeSubView === 'equations'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Physical Equations
            </button>
          </div>
        </div>

        {/* Dynamic Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 bg-slate-950/80 p-5 rounded-xl border border-slate-800/80 mb-6">
          {/* Speed slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-base font-medium text-slate-300 flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-amber-400" />
                Vehicle Velocity
              </label>
              <span className="text-base font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                {speedMph} mph
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={168}
              value={speedMph}
              onChange={(e) => {
                const speed = Number(e.target.value);
                const computed = computeAeroMetrics(speed, roofState, crosswindKt, cowlDamperForce);
                onUpdateTelemetry({ speedMph: speed, ...computed });
              }}
              className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-base text-slate-400 mt-1">
              <span>0 mph (Idle)</span>
              <span>168 mph (V-Max)</span>
            </div>
          </div>

          {/* Roof State Toggle */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-base font-medium text-slate-300">
                Heavy Overland Dynamics Platform Soft-Top Roof
              </label>
              <span className="text-base font-mono font-bold text-cyan-400 bg-cyan-950/40 border border-cyan-800/50 px-2 py-0.5 rounded">
                {roofState}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                onClick={() => {
                  const computed = computeAeroMetrics(speedMph, 'STOWED', crosswindKt, cowlDamperForce);
                  onUpdateTelemetry({ roofState: 'STOWED', ...computed });
                }}
                className={`py-2 px-3 text-base font-semibold rounded-lg border transition-all cursor-pointer ${
                  roofState === 'STOWED'
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                STOWED (Open)
              </button>
              <button
                onClick={() => {
                  const computed = computeAeroMetrics(speedMph, 'CLOSED', crosswindKt, cowlDamperForce);
                  onUpdateTelemetry({ roofState: 'CLOSED', ...computed });
                }}
                className={`py-2 px-3 text-base font-semibold rounded-lg border transition-all cursor-pointer ${
                  roofState === 'CLOSED'
                    ? 'bg-blue-500/20 border-blue-500 text-blue-300 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                CLOSED (Coupe)
              </button>
            </div>
          </div>

          {/* Crosswind Shear Slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-base font-medium text-slate-300 flex items-center gap-1.5">
                <Wind className="w-4 h-4 text-indigo-400" />
                Crosswind Shear
              </label>
              <span className="text-base font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                {crosswindKt} kt
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={45}
              value={crosswindKt}
              onChange={(e) => {
                const wind = Number(e.target.value);
                const computed = computeAeroMetrics(speedMph, roofState, wind, cowlDamperForce);
                onUpdateTelemetry({ crosswindKt: wind, ...computed });
              }}
              className="w-full accent-indigo-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-base text-slate-400 mt-1">
              <span>0 kt (Calm)</span>
              <span>45 kt (Gale)</span>
            </div>
          </div>

          {/* Cowl Damper Actuation Slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-base font-medium text-slate-300 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-emerald-400" />
                Cowl Damper Force
              </label>
              <span className="text-base font-mono font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
                {cowlDamperForce}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={cowlDamperForce}
              onChange={(e) => {
                const force = Number(e.target.value);
                const computed = computeAeroMetrics(speedMph, roofState, crosswindKt, force);
                onUpdateTelemetry({ cowlDamperForce: force, ...computed });
              }}
              className="w-full accent-emerald-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-base text-slate-400 mt-1">
              <span>0% (Undamped)</span>
              <span>100% (Max Rigid)</span>
            </div>
          </div>
        </div>

        {/* View 1: Canvas & Interactive Aerodynamic Profile */}
        {activeSubView === 'canvas' && (
          <div className="space-y-6">
            {/* Visual Aero Wind Tunnel Diagram */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <span className="text-base font-bold text-slate-200 flex items-center gap-2">
                  <Wind className="w-5 h-5 text-amber-400" />
                  High-Aero Grand Touring Telemetry Core Convertible Wind Tunnel Aero & Cowl Deflection Vector
                </span>
                <span className="text-base font-mono text-slate-400">
                  Laminar Boundary Layer · Shear Layer Bleed Active
                </span>
              </div>

              {/* Interactive SVG Diagram */}
              <div className="relative w-full h-64 bg-slate-900/60 rounded-lg border border-slate-800/80 flex items-center justify-center overflow-hidden">
                <svg
                  viewBox="0 0 900 280"
                  className="w-full h-full"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="streamlineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                      <stop offset="60%" stopColor="#818cf8" stopOpacity="0.7" />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.9" />
                    </linearGradient>
                    <linearGradient id="cowlStressGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>

                  {/* Grid Lines */}
                  <g stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4">
                    <line x1="50" y1="50" x2="850" y2="50" />
                    <line x1="50" y1="120" x2="850" y2="120" />
                    <line x1="50" y1="190" x2="850" y2="190" />
                    <line x1="150" y1="20" x2="150" y2="260" />
                    <line x1="450" y1="20" x2="450" y2="260" />
                    <line x1="750" y1="20" x2="750" y2="260" />
                  </g>

                  {/* Airflow Streamlines */}
                  {/* Streamline 1: High laminar flow */}
                  <path
                    d={`M 20 60 Q 300 ${50 - speedMph * 0.1} 480 ${70 + (roofState === 'STOWED' ? 40 : 10)} Q 650 ${roofState === 'STOWED' ? 140 : 70} 880 75`}
                    fill="none"
                    stroke="url(#streamlineGrad)"
                    strokeWidth={2 + Math.min(3, speedMph / 40)}
                    strokeDasharray={isSimulating ? '10 5' : 'none'}
                    className={isSimulating ? 'animate-pulse' : ''}
                  />

                  {/* Streamline 2: Hood to Cowl boundary layer */}
                  <path
                    d={`M 20 110 Q 220 105 360 118 Q 420 ${roofState === 'STOWED' ? 160 : 130} 880 120`}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    opacity="0.85"
                  />

                  {/* Streamline 3: Lower beltline flow */}
                  <path
                    d="M 20 180 Q 260 178 520 185 Q 740 185 880 180"
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth="2"
                    opacity="0.6"
                  />

                  {/* Turbulent Vortex in Cabin when top is STOWED */}
                  {roofState === 'STOWED' && (
                    <g>
                      <circle
                        cx="540"
                        cy="135"
                        r={Math.min(32, 12 + speedMph * 0.14)}
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="2.5"
                        strokeDasharray="6 3"
                        opacity={Math.max(0.2, 1 - (cowlDamperForce / 100) * 0.8)}
                      />
                      <text
                        x="540"
                        y="140"
                        textAnchor="middle"
                        fill="#f59e0b"
                        fontSize="16"
                        fontWeight="bold"
                      >
                        {cowlDamperForce > 60 ? 'Suppressed Vortex' : 'Cabin Buffeting Vortex'}
                      </text>
                    </g>
                  )}

                  {/* Car Profile Silhouette: Heavy Overland Dynamics Platform High-Aero Grand Touring Telemetry Core Convertible */}
                  <g fill="none" stroke="#94a3b8" strokeWidth="2.5">
                    {/* Front nose / Spindle grille area */}
                    <path d="M 120 195 L 140 180 L 190 175 L 340 165 L 430 115 L 490 112" />
                    
                    {/* Roof / Cabin Area */}
                    {roofState === 'CLOSED' ? (
                      /* Soft-Top Raised */
                      <path
                        d="M 490 112 Q 570 108 670 145 L 750 175"
                        stroke="#38bdf8"
                        strokeWidth="3"
                      />
                    ) : (
                      /* Soft-Top Stowed in Tonneau Deck */
                      <path
                        d="M 490 112 L 495 130 L 680 148 L 750 175"
                        stroke="#f59e0b"
                        strokeWidth="2.5"
                        strokeDasharray="4 2"
                      />
                    )}

                    {/* Rear Deck / Trunk Lid */}
                    <path d="M 750 175 L 820 178 L 835 195 L 825 210 L 780 210" />

                    {/* Rocker panel / Underside */}
                    <path d="M 700 210 L 260 210" />
                    
                    {/* Front Wheel & Arch */}
                    <circle cx="210" cy="205" r="28" fill="#0f172a" stroke="#64748b" strokeWidth="3" />
                    {/* Rear Wheel & Arch */}
                    <circle cx="740" cy="205" r="28" fill="#0f172a" stroke="#64748b" strokeWidth="3" />
                  </g>

                  {/* ACTIVE COWL DAMPER BRACE CALLOUT */}
                  <g>
                    {/* Cowl bulkhead location (~x=380, y=140) */}
                    <line
                      x1="370"
                      y1="145"
                      x2="420"
                      y2="145"
                      stroke="#10b981"
                      strokeWidth="6"
                      strokeLinecap="round"
                    />
                    <circle cx="395" cy="145" r="5" fill="#34d399" />
                    
                    {/* Force Vector Arrows */}
                    <line
                      x1="395"
                      y1="145"
                      x2="395"
                      y2={145 - (cowlDamperForce * 0.4)}
                      stroke="#34d399"
                      strokeWidth="3"
                    />
                    <polygon
                      points={`395,${140 - (cowlDamperForce * 0.4)} 390,${148 - (cowlDamperForce * 0.4)} 400,${148 - (cowlDamperForce * 0.4)}`}
                      fill="#34d399"
                    />

                    {/* Label Callout */}
                    <rect x="310" y="80" width="170" height="30" rx="4" fill="#030712" stroke="#10b981" strokeWidth="1.5" />
                    <text x="395" y="100" textAnchor="middle" fill="#34d399" fontSize="16" fontWeight="bold">
                      Active Cowl Brace ({hydraulicPressurePsi} PSI)
                    </text>
                  </g>

                  {/* Windshield Header Rail Acoustic Bleed Vector */}
                  <g>
                    <circle cx="490" cy="112" r="4" fill="#38bdf8" />
                    <line x1="490" y1="112" x2="520" y2="95" stroke="#38bdf8" strokeWidth="2" strokeDasharray="2 2" />
                    <rect x="525" y="82" width="160" height="26" rx="4" fill="#030712" stroke="#38bdf8" strokeWidth="1" />
                    <text x="605" y="100" textAnchor="middle" fill="#38bdf8" fontSize="16" fontWeight="bold">
                      Header Rail Deflector -{suppressionDeltaDb}dB
                    </text>
                  </g>
                </svg>
              </div>
            </div>

            {/* Live Readout Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
                <span className="text-base font-semibold text-slate-300 block mb-1">
                  Bulkhead Micro-Deflection
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-amber-400 font-mono">
                    {cowlDeflectionUm}
                  </span>
                  <span className="text-xl font-bold text-slate-400">μm</span>
                </div>
                <p className="text-base text-slate-400 mt-2">
                  Fiber-optic Bragg grating strain loop measuring transverse chassis torsion.
                </p>
              </div>

              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
                <span className="text-base font-semibold text-slate-300 block mb-1">
                  Cabin Sound Pressure Level
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-cyan-400 font-mono">
                    {cabinDecibels}
                  </span>
                  <span className="text-xl font-bold text-slate-400">dB SPL</span>
                </div>
                <p className="text-base text-slate-400 mt-2">
                  Suppressed from {(cabinDecibels + suppressionDeltaDb).toFixed(1)} dB via active vortex boundary layer energized flow.
                </p>
              </div>

              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
                <span className="text-base font-semibold text-slate-300 block mb-1">
                  Chassis Torsional Rigidity
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-emerald-400 font-mono">
                    +{torsionalStiffnessGainPct}%
                  </span>
                </div>
                <p className="text-base text-slate-400 mt-2">
                  Dynamic hydraulic tensioning across A-pillar cowl bulkhead bridges stiffness deficit.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* View 2: Python Code View */}
        {activeSubView === 'code' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-950 px-4 py-3 rounded-lg border border-slate-800">
              <span className="text-base font-mono text-slate-300">
                src/aero_core/cowl_aero_core.py (Clean-Room Certified / Python 3.12)
              </span>
              <button
                onClick={copyToClipboard}
                className="bg-slate-800 hover:bg-slate-700 text-white font-semibold text-base px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copiedCode ? 'Copied' : 'Copy Code'}
              </button>
            </div>
            <pre className="bg-slate-950 p-5 rounded-xl border border-slate-800 text-slate-200 font-mono text-base overflow-x-auto leading-relaxed max-h-[500px]">
              {pythonCoreCode}
            </pre>
          </div>
        )}

        {/* View 3: Mathematical Equations */}
        {activeSubView === 'equations' && (
          <div className="space-y-6 bg-slate-950 p-6 rounded-xl border border-slate-800">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Governing Hydraulic Cowl Damping Formulations
              </h3>
              <p className="text-base text-slate-300 mb-4">
                The active hydraulic strut operates as a second-order tunable resonant damper across the A-pillar cowl bulkhead:
              </p>
              <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 font-mono text-base text-amber-300 mb-4">
                F_damper(t) = -c_eff(θ̇) · ẋ_cowl(t) - k_flex · x_cowl(t) + Γ(ω_r)
              </div>
              <ul className="list-disc pl-6 space-y-2 text-base text-slate-300">
                <li>
                  <strong className="text-white">ẋ_cowl(t):</strong> Bulkhead rate of displacement sampled at 2,400 Hz via Bragg strain grating.
                </li>
                <li>
                  <strong className="text-white">c_eff(θ̇):</strong> Dynamic damping coefficient modulated between 1,200 N·s/m and 8,600 N·s/m.
                </li>
                <li>
                  <strong className="text-white">Γ(ω_r):</strong> Notch filter targeting the 24.5 Hz URZ100 V8 engine second-order harmonic excitation.
                </li>
              </ul>
            </div>

            <div className="border-t border-slate-800 pt-5">
              <h3 className="text-2xl font-bold text-white mb-2">
                Open-Cockpit Acoustic Suppression Formulation
              </h3>
              <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 font-mono text-base text-cyan-300 mb-4">
                SPL_cabin = 20 · log10( (ρ_∞ · v² · C_buffet(α_cowl)) / (2 · 10⁻⁵) ) - Δ_suppress(F_actuator)
              </div>
              <p className="text-base text-slate-300">
                At 100 mph (146.7 ft/s), cabin wind turbulence is suppressed by -14.2 dB by coordinating windshield header rail bleed with cowl boundary layer energization.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
