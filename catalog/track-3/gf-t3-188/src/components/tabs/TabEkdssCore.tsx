import React, { useState } from 'react';
import {
  Sliders,
  Play,
  Pause,
  RotateCcw,
  Code2,
  Copy,
  Check,
  Flame,
  Zap,
  Gauge,
  Compass,
  AlertTriangle
} from 'lucide-react';
import {
  CrawlSpeedMode,
  TransferCaseMode,
  TerrainMode,
} from '../../types/telemetry';
import { SuspensionDiagram } from '../SuspensionDiagram';

interface TabEkdssCoreProps {
  speedMph: number;
  setSpeedMph: (v: number) => void;
  articulationAngleDeg: number;
  setArticulationAngleDeg: (v: number) => void;
  crawlMode: CrawlSpeedMode;
  setCrawlMode: (m: CrawlSpeedMode) => void;
  transferCase: TransferCaseMode;
  setTransferCase: (tc: TransferCaseMode) => void;
  rearDiffLocked: boolean;
  setRearDiffLocked: (l: boolean) => void;
  centerDiffLocked: boolean;
  setCenterDiffLocked: (l: boolean) => void;
  terrainMode: TerrainMode;
  setTerrainMode: (t: TerrainMode) => void;
  isSimulating: boolean;
  setIsSimulating: (s: boolean) => void;
  // Computed values
  frontValve: 'OPEN' | 'CLOSED';
  rearValve: 'OPEN' | 'CLOSED';
  frontPressureMpa: number;
  rearPressureMpa: number;
  rollStiffnessNmPerDeg: number;
  wheelStroke: {
    fl: number;
    fr: number;
    rl: number;
    rr: number;
  };
  brakeRotorTempC: number;
  pwmBrake: {
    fl: number;
    fr: number;
    rl: number;
    rr: number;
  };
}

export const TabEkdssCore: React.FC<TabEkdssCoreProps> = ({
  speedMph,
  setSpeedMph,
  articulationAngleDeg,
  setArticulationAngleDeg,
  crawlMode,
  setCrawlMode,
  transferCase,
  setTransferCase,
  rearDiffLocked,
  setRearDiffLocked,
  centerDiffLocked,
  setCenterDiffLocked,
  terrainMode,
  setTerrainMode,
  isSimulating,
  setIsSimulating,
  frontValve,
  rearValve,
  frontPressureMpa,
  rearPressureMpa,
  rollStiffnessNmPerDeg,
  wheelStroke,
  brakeRotorTempC,
  pwmBrake,
}) => {
  const [activeCodeTab, setActiveCodeTab] = useState<'visualizer' | 'python_code'>('visualizer');
  const [copied, setCopied] = useState(false);

  // Python 3.12 Reference implementation
  const pythonEngineCode = `"""
GF-T3-188: Heavy Overland Dynamics Platform Dynamic Kinetic Suspension Telemetry & CRAWL CONTROL ARBITRATION ENGINE
Zero-placeholder production Python 3.12 reference implementation.
Frequency: 2,000 Hz real-time deterministic loop.
"""

from dataclasses import dataclass
from enum import StrEnum
import math
import numpy as np


class ValveState(StrEnum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"
    FAILSAFE_LOCKED = "FAILSAFE_LOCKED"


class CrawlMode(StrEnum):
    OFF = "OFF"
    LO = "LO"          # 1.0 mph (0.447 m/s)
    MED_LO = "MED_LO"  # 2.0 mph (0.894 m/s)
    MED = "MED"        # 3.0 mph (1.341 m/s)
    MED_HI = "MED_HI"  # 4.0 mph (1.788 m/s)
    HI = "HI"          # 5.0 mph (2.235 m/s)


@dataclass(frozen=True)
class WheelHeights:
    fl_mm: float
    fr_mm: float
    rl_mm: float
    rr_mm: float

    @property
    def cross_axle_articulation(self) -> float:
        return abs((self.fl_mm - self.fr_mm) - (self.rl_mm - self.rr_mm))


@dataclass
class EkdssTelemetryOutput:
    front_solenoid: ValveState
    rear_solenoid: ValveState
    front_pressure_mpa: float
    rear_pressure_mpa: float
    differential_pressure_mpa: float
    roll_stiffness_nm_deg: float
    quarantine_failsafe: bool


class EkdssStateController:
    """
    Electronic Kinetic Dynamic Suspension System (Dynamic Kinetic Suspension Telemetry) State Machine.
    Controls hydraulic cylinder bypass solenoid valves connecting front and rear
    stabilizer bars across nitrogen gas-charged accumulators.
    """
    def __init__(self, baseline_pressure_mpa: float = 6.20) -> None:
        self.baseline_pressure = baseline_pressure_mpa
        self.max_road_speed_mps = 12.0  # 43.2 km/h disconnect ceiling
        self.min_articulation_mm = 45.0  # Threshold to trigger sway bar free articulation
        self.max_lateral_accel_g = 0.22  # Force stabilizer lock if cornering g > 0.22g
        self.k_springs_nm_deg = 195.0
        self.k_bars_rigid_nm_deg = 1655.0

    def evaluate_cycle(
        self,
        speed_mps: float,
        heights: WheelHeights,
        lateral_accel_g: float,
        last_pressure_mpa: float
    ) -> EkdssTelemetryOutput:
        cross_art = heights.cross_axle_articulation

        # Safety Check: Sudden pressure drop indicates hydraulic hose puncture
        if abs(last_pressure_mpa - self.baseline_pressure) > 4.80:
            return EkdssTelemetryOutput(
                front_solenoid=ValveState.FAILSAFE_LOCKED,
                rear_solenoid=ValveState.FAILSAFE_LOCKED,
                front_pressure_mpa=0.8,
                rear_pressure_mpa=0.8,
                differential_pressure_mpa=0.0,
                roll_stiffness_nm_deg=self.k_springs_nm_deg + self.k_bars_rigid_nm_deg,
                quarantine_failsafe=True,
            )

        # Disconnect Condition: Low speed AND high cross-axle articulation AND low cornering g
        should_disconnect = (
            speed_mps <= self.max_road_speed_mps and
            cross_art >= self.min_articulation_mm and
            abs(lateral_accel_g) < self.max_lateral_accel_g
        )

        if should_disconnect:
            # Bypass valves energized OPEN: Fluid circulates, zero sway bar twist resistance
            roll_stiffness = self.k_springs_nm_deg
            p_front = self.baseline_pressure + (heights.fl_mm - heights.fr_mm) * 0.008
            p_rear = self.baseline_pressure + (heights.rl_mm - heights.rr_mm) * 0.007
            return EkdssTelemetryOutput(
                front_solenoid=ValveState.OPEN,
                rear_solenoid=ValveState.OPEN,
                front_pressure_mpa=round(p_front, 2),
                rear_pressure_mpa=round(p_rear, 2),
                differential_pressure_mpa=round(abs(p_front - p_rear), 2),
                roll_stiffness_nm_deg=roll_stiffness,
                quarantine_failsafe=False,
            )
        else:
            # Bypass valves CLOSED: Stabilizers mechanically locked resisting roll
            roll_stiffness = self.k_springs_nm_deg + self.k_bars_rigid_nm_deg
            return EkdssTelemetryOutput(
                front_solenoid=ValveState.CLOSED,
                rear_solenoid=ValveState.CLOSED,
                front_pressure_mpa=self.baseline_pressure,
                rear_pressure_mpa=self.baseline_pressure,
                differential_pressure_mpa=0.0,
                roll_stiffness_nm_deg=roll_stiffness,
                quarantine_failsafe=False,
            )


class CrawlControlArbitrator:
    """
    Closed-loop 5-speed crawl control arbitration.
    Modulates individual wheel hydraulic brake pressure (PWM) and engine throttle.
    """
    SPEED_MAP_MPS = {
        CrawlMode.OFF: 0.0,
        CrawlMode.LO: 0.447,      # 1.0 mph
        CrawlMode.MED_LO: 0.894,  # 2.0 mph
        CrawlMode.MED: 1.341,     # 3.0 mph
        CrawlMode.MED_HI: 1.788,  # 4.0 mph
        CrawlMode.HI: 2.235,      # 5.0 mph
    }

    def __init__(self, kp: float = 14.5, ki: float = 2.1, kd: float = 0.85) -> None:
        self.kp = kp
        self.ki = ki
        self.kd = kd
        self.integral_error = 0.0
        self.last_error = 0.0

    def compute_brake_pwm(
        self,
        mode: CrawlMode,
        current_speed_mps: float,
        dt_s: float = 0.0005  # 2,000 Hz loop
    ) -> tuple[float, float]:
        if mode == CrawlMode.OFF:
            self.integral_error = 0.0
            return 0.0, 0.0  # throttle_pct, brake_pwm_pct

        target_v = self.SPEED_MAP_MPS[mode]
        error = target_v - current_speed_mps

        # Anti-windup clamped integral
        self.integral_error = max(-10.0, min(10.0, self.integral_error + error * dt_s))
        derivative = (error - self.last_error) / dt_s if dt_s > 0 else 0.0
        self.last_error = error

        u = self.kp * error + self.ki * self.integral_error + self.kd * derivative

        if u > 0:
            # Needs throttle
            throttle = min(45.0, u * 15.0)
            brake_pwm = 0.0
        else:
            # Needs hydraulic brake pressure
            throttle = 0.0
            brake_pwm = min(100.0, abs(u) * 22.0)

        return round(throttle, 1), round(brake_pwm, 1)
`;

  const copyCode = () => {
    navigator.clipboard.writeText(pythonEngineCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Preset Configurations
  const applyPreset = (preset: 'rock' | 'highway' | 'mogul' | 'mud') => {
    if (preset === 'rock') {
      setSpeedMph(1.8);
      setArticulationAngleDeg(16.5);
      setCrawlMode('LO');
      setTransferCase('4L');
      setRearDiffLocked(true);
      setCenterDiffLocked(true);
      setTerrainMode('ROCK');
    } else if (preset === 'highway') {
      setSpeedMph(68);
      setArticulationAngleDeg(0.5);
      setCrawlMode('OFF');
      setTransferCase('4H');
      setRearDiffLocked(false);
      setCenterDiffLocked(false);
      setTerrainMode('AUTO');
    } else if (preset === 'mogul') {
      setSpeedMph(3.2);
      setArticulationAngleDeg(14.0);
      setCrawlMode('MED');
      setTransferCase('4L');
      setRearDiffLocked(true);
      setCenterDiffLocked(true);
      setTerrainMode('DIRT');
    } else if (preset === 'mud') {
      setSpeedMph(4.5);
      setArticulationAngleDeg(8.5);
      setCrawlMode('MED_HI');
      setTransferCase('4L');
      setRearDiffLocked(false);
      setCenterDiffLocked(true);
      setTerrainMode('MUD');
    }
  };

  const isBypassOpen = frontValve === 'OPEN';

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-3xl font-extrabold text-white flex items-center gap-3">
              <span className="w-3.5 h-3.5 rounded-full bg-amber-400"></span>
              Dynamic Kinetic Suspension Telemetry & Crawl Control Core Engine
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Deterministic 2,000 Hz closed-loop suspension stabilizer bar disconnect and 5-stage closed-loop crawl arbitration
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSimulating(!isSimulating)}
              className={`text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-2 cursor-pointer transition-all ${
                isSimulating
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500'
              }`}
            >
              {isSimulating ? (
                <>
                  <Pause className="w-4 h-4" /> Pause Loop
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" /> Start Real-Time Loop
                </>
              )}
            </button>

            <button
              onClick={() => applyPreset('rock')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              Reset Boulder Baseline
            </button>
          </div>
        </div>

        {/* Quick Presets Strip */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-semibold mr-1">Quick Scenarios:</span>
          <button
            onClick={() => applyPreset('rock')}
            className="bg-slate-800/80 hover:bg-slate-800 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded cursor-pointer transition-colors"
          >
            Extreme Rock Crawl (4L, Disconnected)
          </button>
          <button
            onClick={() => applyPreset('highway')}
            className="bg-slate-800/80 hover:bg-slate-800 text-blue-300 border border-blue-500/30 px-2.5 py-1 rounded cursor-pointer transition-colors"
          >
            High-Speed Highway (4H, Rigid Lock)
          </button>
          <button
            onClick={() => applyPreset('mogul')}
            className="bg-slate-800/80 hover:bg-slate-800 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded cursor-pointer transition-colors"
          >
            Off-Camber Moguls (4L, 14° Articulation)
          </button>
          <button
            onClick={() => applyPreset('mud')}
            className="bg-slate-800/80 hover:bg-slate-800 text-orange-300 border border-orange-500/30 px-2.5 py-1 rounded cursor-pointer transition-colors"
          >
            Deep Rut Mud Track (Med-High Crawl)
          </button>
        </div>
      </div>

      {/* Main Grid: Controls vs Visualizer / Code */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Telemetry Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Sliders className="w-5 h-5 text-amber-400" />
              Real-Time Actuation Controls
            </h3>

            {/* Speed Slider */}
            <div>
              <div className="flex justify-between items-center mb-1.5 text-xs">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-amber-400" />
                  Vehicle Ground Speed
                </span>
                <span className="font-mono font-bold text-amber-400 text-sm">
                  {speedMph.toFixed(1)} mph ({Math.round(speedMph * 1.609)} km/h)
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="85"
                step="0.5"
                value={speedMph}
                onChange={(e) => setSpeedMph(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1 font-mono">
                <span>0 mph (Crawl)</span>
                <span className="text-amber-500/90 font-bold">26.8 mph (Disconnect Ceiling)</span>
                <span>85 mph</span>
              </div>
            </div>

            {/* Articulation Angle Slider */}
            <div>
              <div className="flex justify-between items-center mb-1.5 text-xs">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-emerald-400" />
                  Cross-Axle Off-Camber Angle
                </span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {articulationAngleDeg > 0 ? `+${articulationAngleDeg.toFixed(1)}` : articulationAngleDeg.toFixed(1)}°
                </span>
              </div>
              <input
                type="range"
                min="-18"
                max="18"
                step="0.5"
                value={articulationAngleDeg}
                onChange={(e) => setArticulationAngleDeg(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1 font-mono">
                <span>-18° (Full Left Droop)</span>
                <span>0° Flat</span>
                <span>+18° (Full Right Droop)</span>
              </div>
            </div>

            {/* 5-Speed Crawl Control Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                5-Speed Crawl Control Throttle/Brake Dial
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {(['OFF', 'LO', 'MED_LO', 'MED', 'MED_HI', 'HI'] as CrawlSpeedMode[]).map((mode) => {
                  const labels: Record<CrawlSpeedMode, string> = {
                    OFF: 'OFF (Driver)',
                    LO: '1: LO (1.0 mph)',
                    MED_LO: '2: MED-LO (2.0)',
                    MED: '3: MED (3.0)',
                    MED_HI: '4: MED-HI (4.0)',
                    HI: '5: HI (5.0 mph)',
                  };
                  const active = crawlMode === mode;
                  return (
                    <button
                      key={mode}
                      onClick={() => setCrawlMode(mode)}
                      className={`py-2 px-2 rounded-lg font-mono font-bold text-center border cursor-pointer transition-all ${
                        active
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md scale-102'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                      }`}
                    >
                      {labels[mode]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Transfer Case & Differentials Controls */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
              {/* T-Case */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Transfer Case Range
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-800 rounded-lg">
                  <button
                    onClick={() => setTransferCase('4H')}
                    className={`py-1.5 text-xs font-mono font-bold rounded cursor-pointer transition-colors ${
                      transferCase === '4H'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    4H (High)
                  </button>
                  <button
                    onClick={() => setTransferCase('4L')}
                    className={`py-1.5 text-xs font-mono font-bold rounded cursor-pointer transition-colors ${
                      transferCase === '4L'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    4L (Low 2.57:1)
                  </button>
                </div>
              </div>

              {/* Terrain Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Multi-Terrain Select (MTS)
                </label>
                <select
                  value={terrainMode}
                  onChange={(e) => setTerrainMode(e.target.value as TerrainMode)}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono rounded-lg p-2 focus:ring-1 focus:ring-amber-500 outline-none"
                >
                  <option value="AUTO">AUTO (Adaptive)</option>
                  <option value="DIRT">DIRT (Loose Surface)</option>
                  <option value="SAND">SAND (Slip Allowed)</option>
                  <option value="MUD">MUD (High Momentum)</option>
                  <option value="DEEP_SNOW">DEEP SNOW</option>
                  <option value="ROCK">ROCK (Dynamic Kinetic Suspension Telemetry Max Articulation)</option>
                </select>
              </div>
            </div>

            {/* Differential Locks */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setCenterDiffLocked(!centerDiffLocked)}
                className={`p-2.5 rounded-lg border text-xs font-mono font-bold flex items-center justify-between cursor-pointer transition-all ${
                  centerDiffLocked
                    ? 'bg-amber-500/15 border-amber-500 text-amber-300'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Center Torsen Lock:</span>
                <span className="font-extrabold">{centerDiffLocked ? 'LOCKED' : 'OPEN'}</span>
              </button>

              <button
                onClick={() => setRearDiffLocked(!rearDiffLocked)}
                className={`p-2.5 rounded-lg border text-xs font-mono font-bold flex items-center justify-between cursor-pointer transition-all ${
                  rearDiffLocked
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Rear E-Locker:</span>
                <span className="font-extrabold">{rearDiffLocked ? 'LOCKED' : 'OPEN'}</span>
              </button>
            </div>
          </div>

          {/* Thermal Dissipation & Brake PWM Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-400" />
                Crawl Control Brake Modulator Thermal Guard
              </span>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                brakeRotorTempC > 500 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {brakeRotorTempC.toFixed(0)}°C Rotor Temp
              </span>
            </h4>

            {/* 4 Wheels PWM Modulation Meters */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Front Left (FL)</span>
                  <span className="text-amber-400 font-bold">{pwmBrake.fl.toFixed(0)}% PWM</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-400 h-full transition-all duration-150" style={{ width: `${pwmBrake.fl}%` }}></div>
                </div>
              </div>

              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Front Right (FR)</span>
                  <span className="text-amber-400 font-bold">{pwmBrake.fr.toFixed(0)}% PWM</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-400 h-full transition-all duration-150" style={{ width: `${pwmBrake.fr}%` }}></div>
                </div>
              </div>

              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Rear Left (RL)</span>
                  <span className="text-amber-400 font-bold">{pwmBrake.rl.toFixed(0)}% PWM</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-400 h-full transition-all duration-150" style={{ width: `${pwmBrake.rl}%` }}></div>
                </div>
              </div>

              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Rear Right (RR)</span>
                  <span className="text-amber-400 font-bold">{pwmBrake.rr.toFixed(0)}% PWM</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-400 h-full transition-all duration-150" style={{ width: `${pwmBrake.rr}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Suspension Schematic or Python Code (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Sub-tab switcher */}
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-2 rounded-xl">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveCodeTab('visualizer')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
                  activeCodeTab === 'visualizer'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Heavy Boxed Steel Frame Architecture Kinetic Suspension Schematic
              </button>
              <button
                onClick={() => setActiveCodeTab('python_code')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors ${
                  activeCodeTab === 'python_code'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                Python 3.12 Engine Source
              </button>
            </div>

            {activeCodeTab === 'python_code' && (
              <button
                onClick={copyCode}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-2.5 py-1 rounded-md border border-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Engine'}</span>
              </button>
            )}
          </div>

          {activeCodeTab === 'visualizer' ? (
            <div className="space-y-4">
              <SuspensionDiagram
                speedMph={speedMph}
                articulationAngleDeg={articulationAngleDeg}
                frontValve={frontValve}
                rearValve={rearValve}
                frontPressureMpa={frontPressureMpa}
                rearPressureMpa={rearPressureMpa}
                wheelStroke={wheelStroke}
                rollStiffnessNmPerDeg={rollStiffnessNmPerDeg}
              />

              {/* State Machine Logic Diagnostics */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs font-mono space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Dynamic Kinetic Suspension Telemetry Solenoid Arbitration State:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded ${
                      isBypassOpen
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-blue-500/20 text-blue-300'
                    }`}
                  >
                    {isBypassOpen ? 'DISCONNECTED_ARTICULATING (OPEN)' : 'CONNECTED_STABILIZED (RIGID)'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-slate-300 pt-1">
                  <div>
                    <span className="text-slate-400">Threshold Velocity:</span>{' '}
                    <strong className="text-white">v &le; 26.8 mph</strong> (Now: {speedMph.toFixed(1)} mph)
                  </div>
                  <div>
                    <span className="text-slate-400">Min Articulation:</span>{' '}
                    <strong className="text-white">&Delta;z &ge; 45.0 mm</strong> (Now: {Math.round(Math.abs(articulationAngleDeg) * 18.2)} mm)
                  </div>
                  <div>
                    <span className="text-slate-400">Front Accumulator Valve:</span>{' '}
                    <strong className={frontValve === 'OPEN' ? 'text-amber-400' : 'text-blue-400'}>
                      {frontValve}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Rear Accumulator Valve:</span>{' '}
                    <strong className={rearValve === 'OPEN' ? 'text-amber-400' : 'text-blue-400'}>
                      {rearValve}
                    </strong>
                  </div>
                </div>

                {isBypassOpen ? (
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-emerald-300 flex items-center gap-2 mt-2">
                    <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Free-stroke articulation active. Roll resistance decoupled by 89.5% for maximum tire contact patch on off-road obstacles.</span>
                  </div>
                ) : (
                  <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded text-blue-300 flex items-center gap-2 mt-2">
                    <AlertTriangle className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>High-speed on-road cornering mode. Rigid stabilizer bars prevent chassis body roll (K_roll = 1,850 Nm/deg).</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-x-auto max-h-[520px]">
              <pre className="text-xs font-mono text-slate-300 leading-relaxed">
                <code>{pythonEngineCode}</code>
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
