import React, { useState, useEffect } from 'react';
import { TelemetryFrame, DriveMode } from '../../types/telemetry';
import { Sliders, BatteryCharging, Zap, Gauge, Copy, Check, Activity, ShieldAlert, Cpu } from 'lucide-react';

interface TabAVSDampingProps {
  telemetry: TelemetryFrame;
  onUpdateParams: (params: {
    rollDeg: number;
    pitchDegS: number;
    vertG: number;
    latG: number;
    speedMph: number;
    mode: DriveMode;
    decelG: number;
  }) => void;
}

export const TabAVSDamping: React.FC<TabAVSDampingProps> = ({
  telemetry,
  onUpdateParams,
}) => {
  const [rollDeg, setRollDeg] = useState(telemetry.rollAngleDeg);
  const [pitchDegS, setPitchDegS] = useState(telemetry.pitchVelocityDegS);
  const [vertG, setVertG] = useState(telemetry.verticalAccelG);
  const [latG, setLatG] = useState(telemetry.lateralAccelG);
  const [speedMph, setSpeedMph] = useState(telemetry.speedMph);
  const [mode, setMode] = useState<DriveMode>(telemetry.driveMode);
  const [decelG, setDecelG] = useState(0.42);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeSubView, setActiveSubView] = useState<'cockpit' | 'python'>('cockpit');

  // Push updates when controls change
  useEffect(() => {
    onUpdateParams({
      rollDeg,
      pitchDegS,
      vertG,
      latG,
      speedMph,
      mode,
      decelG,
    });
  }, [rollDeg, pitchDegS, vertG, latG, speedMph, mode, decelG, onUpdateParams]);

  const pythonSourceCode = `"""
Heavy Overland Dynamics Platform NX 450h+ High-G Dynamic Telemetry Handling Plug-In Core
Pure Python 3.12 Linear Solenoid Damping State Machine & Predictive Deceleration
SPDX-License-Identifier: MIT | Clean-Room Certified
"""
import math
import hmac
import hashlib
from typing import Dict, NamedTuple, Tuple

class DamperState(NamedTuple):
    corner: str
    current_ma: float
    force_step: int  # 1 to 650
    damping_coefficient_ns_m: float
    hydraulic_pressure_bar: float
    seal_nominal: bool

class OverlandNXLinearSolenoidAVS:
    """
    Continuous 650-step linear solenoid Adaptive Variable Suspension state machine.
    Processes 4-wheel independent stroke velocity and 6-DOF inertial sensor telemetry at 2,000 Hz.
    """
    MIN_STEP: int = 1
    MAX_STEP: int = 650
    MIN_CURRENT_MA: float = 200.0
    MAX_CURRENT_MA: float = 1800.0
    MIN_DAMPING_NS_M: float = 1200.0
    MAX_DAMPING_NS_M: float = 6800.0

    MODE_MULTIPLIERS = {
        "NORMAL": 1.00,
        "SPORT_S": 1.18,
        "SPORT_S_PLUS": 1.38,
        "EV": 0.95,
        "AUTO_EV_HEV": 1.05
    }

    def __init__(self, drive_mode: str = "SPORT_S_PLUS"):
        self.drive_mode = drive_mode
        self.mode_scale = self.MODE_MULTIPLIERS.get(drive_mode, 1.0)
        self.quarantine_pressure_bar = 42.5

    def calculate_corner_damping(
        self,
        corner: str,
        roll_angle_deg: float,
        pitch_velocity_deg_s: float,
        vertical_accel_g: float,
        lateral_accel_g: float,
        stroke_velocity_mm_s: float
    ) -> DamperState:
        # Skyhook body control acceleration
        z_component = abs(vertical_accel_g * 9.80665) * 34.0

        # Roll moment distribution (Left vs Right differential)
        is_left = "L" in corner
        lateral_sign = 1.0 if is_left else -1.0
        roll_component = abs(roll_angle_deg * 28.0 + lateral_accel_g * 42.0 * lateral_sign)

        # Anti-dive & anti-squat pitch moment (Front vs Rear differential)
        is_front = "F" in corner
        pitch_component = abs(pitch_velocity_deg_s * (38.0 if is_front else 24.0))

        # Rebound & compression high-frequency stroke damping
        stroke_component = abs(stroke_velocity_mm_s * 0.45)

        raw_demand = (z_component + roll_component + pitch_component + stroke_component) * self.mode_scale
        step = max(self.MIN_STEP, min(self.MAX_STEP, int(math.floor(raw_demand))))

        # Linear proportional excitation current across 650 steps
        step_ratio = (step - self.MIN_STEP) / (self.MAX_STEP - self.MIN_STEP)
        current_ma = self.MIN_CURRENT_MA + step_ratio * (self.MAX_CURRENT_MA - self.MIN_CURRENT_MA)
        damping_ns = self.MIN_DAMPING_NS_M + step_ratio * (self.MAX_DAMPING_NS_M - self.MIN_DAMPING_NS_M)

        # Damper internal hydraulic pressure
        pressure_bar = 14.0 + (step_ratio * 26.5)
        seal_nominal = pressure_bar < self.quarantine_pressure_bar

        return DamperState(
            corner=corner,
            current_ma=round(current_ma, 2),
            force_step=step,
            damping_coefficient_ns_m=round(damping_ns, 1),
            hydraulic_pressure_bar=round(pressure_bar, 2),
            seal_nominal=seal_nominal
        )

    def calculate_predictive_phev_regen(
        self,
        decel_request_g: float,
        battery_soc_pct: float,
        speed_mph: float,
        nav_curve_ahead: bool = False
    ) -> Tuple[float, float]:
        """
        Calculates regenerative braking recapture power and hydraulic friction blending ratio.
        Peak regen capacity: 62 kW (Heavy Overland Dynamics Platform NX 450h+ Front 134 kW + Rear 40 kW e-Four MGs).
        """
        if battery_soc_pct >= 98.0:
            return 0.0, 1.0  # Battery saturated; 100% friction

        base_regen_demand = decel_request_g * 85.0
        if nav_curve_ahead:
            base_regen_demand += 12.0  # Predictive curve deceleration bonus

        effective_regen_kw = min(62.0, max(0.0, base_regen_demand))

        # Battery thermal & high-SoC de-rate
        if battery_soc_pct > 80.0:
            taper_factor = (100.0 - battery_soc_pct) / 20.0
            effective_regen_kw *= taper_factor

        friction_ratio = 1.0 - (effective_regen_kw / (decel_request_g * 85.0 + 1e-5))
        return round(effective_regen_kw, 2), round(max(0.0, min(1.0, friction_ratio)), 3)
`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(pythonSourceCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const corners: Array<'FL' | 'FR' | 'RL' | 'RR'> = ['FL', 'FR', 'RL', 'RR'];

  return (
    <div className="space-y-4">
      {/* View Switcher Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 rounded-xl p-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubView('cockpit')}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeSubView === 'cockpit'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white bg-slate-800'
            }`}
          >
            Live AVS & Regen Telemetry
          </button>
          <button
            onClick={() => setActiveSubView('python')}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeSubView === 'python'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white bg-slate-800'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Python 3.12 Engine Source
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
          <span className="text-slate-500">Mode:</span>
          <span className="text-amber-400 font-bold">{telemetry.driveMode}</span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-500">Loop:</span>
          <span className="text-emerald-400 font-bold">2,000 Hz</span>
        </div>
      </div>

      {activeSubView === 'cockpit' ? (
        <>
          {/* Real-Time Interactive Telemetry Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* 4-Corner Damping HUD (7 cols) */}
            <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-xl p-4 md:p-5 shadow-lg">
              <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-amber-400" />
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    Linear Solenoid Actuators (4-Corner Matrix)
                  </h2>
                </div>
                <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded">
                  650-Level Modulation
                </span>
              </div>

              {/* Four Dampers Grid */}
              <div className="grid grid-cols-2 gap-3.5">
                {corners.map((corner) => {
                  const data = telemetry.dampers[corner];
                  const isFront = corner.startsWith('F');
                  const isLeft = corner.endsWith('L');
                  const cornerLabel = `${isFront ? 'Front' : 'Rear'} ${isLeft ? 'Left' : 'Right'} (${corner})`;

                  return (
                    <div
                      key={corner}
                      className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 flex flex-col justify-between hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-300 font-mono">
                          {cornerLabel}
                        </span>
                        <span
                          className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
                            data.sealStatus === 'NOMINAL'
                              ? 'text-emerald-400 bg-emerald-500/10'
                              : 'text-rose-400 bg-rose-500/10 border border-rose-500/30'
                          }`}
                        >
                          {data.sealStatus}
                        </span>
                      </div>

                      <div className="my-1 flex items-baseline justify-between">
                        <div>
                          <div className="text-3xl font-black text-cyan-300 font-mono tabular-nums">
                            {data.forceStep}
                            <span className="text-slate-600 text-sm font-semibold">/650</span>
                          </div>
                          <div className="text-xs text-slate-400">Step Level</div>
                        </div>

                        <div className="text-right">
                          <div className="text-xl font-bold text-amber-400 font-mono tabular-nums">
                            {data.solenoidCurrentMa.toFixed(0)}
                            <span className="text-slate-500 text-xs ml-0.5">mA</span>
                          </div>
                          <div className="text-xs text-slate-400">Excitation</div>
                        </div>
                      </div>

                      {/* Progress bar of 650 levels */}
                      <div className="w-full bg-slate-800 h-1.5 rounded-full my-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-cyan-500 to-amber-500 h-full rounded-full transition-all duration-150"
                          style={{ width: `${(data.forceStep / 650) * 100}%` }}
                        ></div>
                      </div>

                      <div className="grid grid-cols-2 gap-1 text-xs text-slate-400 font-mono pt-1 border-t border-slate-900">
                        <div>
                          <span className="text-slate-500">Coeff:</span>{' '}
                          <span className="text-slate-200">{data.dampingCoefficientNs.toFixed(0)} Ns/m</span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-500">Hydr:</span>{' '}
                          <span className="text-slate-200">{data.hydraulicPressureBar.toFixed(1)} bar</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Dynamic Waveform Visualizer */}
              <div className="mt-4 p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <div className="flex items-center justify-between mb-2 text-xs">
                  <span className="text-slate-400 font-medium">Real-Time Damping Force Waveform (2,000 Hz Sampling)</span>
                  <span className="text-emerald-400 font-mono">Continuous Steady-State</span>
                </div>
                <div className="h-16 w-full flex items-end gap-1 px-1">
                  {Array.from({ length: 48 }).map((_, i) => {
                    const seed = (telemetry.nonce + i * 3) % 100;
                    const h = Math.min(100, Math.max(15, 20 + Math.sin((telemetry.nonce * 0.05) + i * 0.3) * 35 + (telemetry.dampers.FL.forceStep / 650) * 45));
                    return (
                      <div
                        key={i}
                        className="flex-1 bg-gradient-to-t from-cyan-600/60 to-amber-400/90 rounded-t-sm transition-all duration-100"
                        style={{ height: `${h}%` }}
                      ></div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* PHEV High-Voltage Battery & Regen Core (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 md:p-5 shadow-lg">
                <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <BatteryCharging className="w-5 h-5 text-emerald-400" />
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      PHEV 18.1 kWh Regen Core
                    </h2>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                    355V Pack
                  </span>
                </div>

                {/* Battery Energy Readout */}
                <div className="space-y-4">
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400">High-Voltage Battery SoC</span>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {telemetry.phev.batterySocPercent.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${telemetry.phev.batterySocPercent}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-500 mt-2 font-mono">
                      <span>Pack Voltage: {telemetry.phev.batteryPackVoltageV.toFixed(1)} V</span>
                      <span>Total Capacity: 18.1 kWh</span>
                    </div>
                  </div>

                  {/* Regen Power Meter */}
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5">
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-xs text-slate-400">Recaptured Kinetic Power</span>
                      <span className="text-2xl font-black text-emerald-300 font-mono tabular-nums">
                        {telemetry.phev.regenPowerKw.toFixed(1)}
                        <span className="text-slate-500 text-sm ml-1">kW</span>
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mb-2">Dual Permanent Magnet Motors (MG1 + MG2)</div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full rounded-full transition-all duration-150"
                        style={{ width: `${Math.min(100, (telemetry.phev.regenPowerKw / 62) * 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 mt-2 font-mono">
                      <span>0 kW</span>
                      <span className="text-slate-500">Max Regen 62 kW Peak</span>
                      <span>62 kW</span>
                    </div>
                  </div>

                  {/* Brake Blending Status */}
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-400">Hydraulic Brake Blending Ratio</span>
                      <span className="text-xs font-mono font-bold text-amber-400">
                        {((1 - telemetry.phev.brakeBlendingRatio) * 100).toFixed(0)}% Regen / {(telemetry.phev.brakeBlendingRatio * 100).toFixed(0)}% Friction
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-150"
                        style={{ width: `${(1 - telemetry.phev.brakeBlendingRatio) * 100}%` }}
                        title="Regenerative Portion"
                      ></div>
                      <div
                        className="bg-amber-500 h-full transition-all duration-150"
                        style={{ width: `${telemetry.phev.brakeBlendingRatio * 100}%` }}
                        title="Hydraulic Friction Caliper Portion"
                      ></div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">Predictive Decel Support:</span>
                      <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                        ENABLED (NAV-LINKED)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Drive Mode Selector */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-slate-300">Drive Mode Damping Profile</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['NORMAL', 'SPORT_S', 'SPORT_S_PLUS', 'EV', 'AUTO_EV_HEV'] as DriveMode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={`text-xs font-semibold py-2 px-2 rounded-lg transition-colors cursor-pointer text-center ${
                        mode === m
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {m.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Dynamics Flight Simulator Panel */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 md:p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Gauge className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Dynamic Vehicle Dynamics Simulator (Input Telemetry)
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Manual Override Injector
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Roll Angle */}
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-slate-400">Roll Angle (Body Lean)</span>
                  <span className="text-cyan-400 font-mono font-bold">{rollDeg.toFixed(1)}°</span>
                </div>
                <input
                  type="range"
                  min="-12.0"
                  max="12.0"
                  step="0.2"
                  value={rollDeg}
                  onChange={(e) => setRollDeg(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-xs text-slate-600 font-mono mt-1">
                  <span>-12° Left</span>
                  <span>0°</span>
                  <span>+12° Right</span>
                </div>
              </div>

              {/* Pitch Velocity */}
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-slate-400">Pitch Velocity (Dive/Squat)</span>
                  <span className="text-cyan-400 font-mono font-bold">{pitchDegS.toFixed(1)}°/s</span>
                </div>
                <input
                  type="range"
                  min="-8.0"
                  max="8.0"
                  step="0.2"
                  value={pitchDegS}
                  onChange={(e) => setPitchDegS(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-xs text-slate-600 font-mono mt-1">
                  <span>-8° Dive</span>
                  <span>0°</span>
                  <span>+8° Squat</span>
                </div>
              </div>

              {/* Vertical Acceleration (G) */}
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-slate-400">Vertical Road Disturbance</span>
                  <span className="text-cyan-400 font-mono font-bold">{vertG.toFixed(2)} G</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="2.5"
                  step="0.05"
                  value={vertG}
                  onChange={(e) => setVertG(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-xs text-slate-600 font-mono mt-1">
                  <span>Smooth</span>
                  <span>1.0 G</span>
                  <span>Rough Pavement</span>
                </div>
              </div>

              {/* Deceleration Demand */}
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-slate-400">Braking Deceleration (G)</span>
                  <span className="text-emerald-400 font-mono font-bold">{decelG.toFixed(2)} G</span>
                </div>
                <input
                  type="range"
                  min="0.00"
                  max="0.85"
                  step="0.02"
                  value={decelG}
                  onChange={(e) => setDecelG(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-xs text-slate-600 font-mono mt-1">
                  <span>Coasting</span>
                  <span>0.4 G</span>
                  <span>0.85 G Hard Stop</span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Python 3.12 Engine Source View */
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 md:p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  src/engine/Overland_nx_avs_core.py
                </h3>
                <p className="text-xs text-slate-400">
                  Pure Python 3.12 reference implementation · Zero external C-extensions · 2,000 Hz target cycle
                </p>
              </div>
            </div>
            <button
              onClick={handleCopyCode}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 border border-slate-700 cursor-pointer transition-colors"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied' : 'Copy Python Code'}</span>
            </button>
          </div>

          <pre className="bg-slate-950 p-4 rounded-lg overflow-x-auto text-xs font-mono text-slate-300 leading-relaxed border border-slate-800 max-h-[600px] overflow-y-auto">
            <code>{pythonSourceCode}</code>
          </pre>
        </div>
      )}
    </div>
  );
};
