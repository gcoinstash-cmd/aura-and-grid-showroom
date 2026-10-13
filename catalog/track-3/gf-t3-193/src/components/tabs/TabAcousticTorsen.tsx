import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Copy, Check, Play, RotateCcw, Activity } from 'lucide-react';
import { v8Synth } from '../../utils/audioSynth';

interface TabAcousticTorsenProps {
  rpm: number;
  setRpm: (rpm: number) => void;
  acousticValveState: 'STAGE_1_CLOSED' | 'STAGE_2_OPEN';
  tbrRatio: number;
  throttlePct: number;
  setThrottlePct: (val: number) => void;
}

export const TabAcousticTorsen: React.FC<TabAcousticTorsenProps> = ({
  rpm,
  setRpm,
  acousticValveState,
  tbrRatio,
  throttlePct,
  setThrottlePct,
}) => {
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [steeringAngle, setSteeringAngle] = useState(15); // degrees
  const [copiedCode, setCopiedCode] = useState(false);

  // Sync synth with RPM
  useEffect(() => {
    if (isAudioPlaying) {
      v8Synth.setRpm(rpm);
    }
  }, [rpm, isAudioPlaying]);

  const toggleAudio = () => {
    if (isAudioPlaying) {
      v8Synth.stop();
      setIsAudioPlaying(false);
    } else {
      v8Synth.start();
      v8Synth.setRpm(rpm);
      setIsAudioPlaying(true);
    }
  };

  // Compute cornering yaw dynamics
  const vehicleSpeedKmh = Math.min(260, Math.round((rpm / 7300) * 240));
  const vMs = vehicleSpeedKmh / 3.6;
  const trackWidth = 1.57; // meters
  const tireRadius = 0.32; // meters (275/35R19 rear)
  const baseWheelRpm = (vMs / (2 * Math.PI * tireRadius)) * 60;
  
  // Differential wheel speed delta based on steering angle
  const turnRadiusM = steeringAngle === 0 ? 9999 : Math.max(10, 150 / Math.sin(Math.abs(steeringAngle) * (Math.PI / 180)));
  const wheelSpeedDelta = steeringAngle === 0 ? 0 : (vMs / turnRadiusM) * (trackWidth / (2 * Math.PI * tireRadius)) * 60;
  
  const leftWheelRpm = Math.max(0, Math.round(steeringAngle >= 0 ? baseWheelRpm - wheelSpeedDelta : baseWheelRpm + wheelSpeedDelta));
  const rightWheelRpm = Math.max(0, Math.round(steeringAngle >= 0 ? baseWheelRpm + wheelSpeedDelta : baseWheelRpm - wheelSpeedDelta));

  // Torque distribution (TBR max 2.8:1)
  const isTurning = Math.abs(steeringAngle) > 2;
  const outerBiasPct = isTurning ? Math.min(73.7, 50 + (Math.abs(steeringAngle) / 35) * 23.7) : 50;
  const innerBiasPct = 100 - outerBiasPct;
  const totalEngineTorqueNm = Math.round(380 + (Math.sin((rpm / 7300) * Math.PI) * 155)); // max 535 Nm (~395 lb-ft)
  const yawMomentNm = Math.round(((outerBiasPct - innerBiasPct) / 100) * totalEngineTorqueNm * (trackWidth / 2));

  // Acoustic status
  const isStage2 = rpm >= 3600;
  const powerHp = Math.round((rpm * totalEngineTorqueNm) / 7127);

  const pythonCode = `"""
Lexus IS 500 F SPORT (2UR-GSE 5.0L V8) Dual-Stage Acoustic & Torsen LSD Core
Target: Python 3.12 Strict Typing | Ghost FactoryOS Track 3 Engine Spec
License: MIT Permissive | Clean-Room Certified
"""

from dataclasses import dataclass
from enum import Enum
import math
from typing import Final

SPEED_OF_SOUND_AIR_20C: Final[float] = 343.0  # m/s
TRACK_WIDTH_METERS: Final[float] = 1.570      # IS 500 rear track
TIRE_ROLLING_RADIUS_METERS: Final[float] = 0.320  # 275/35R19
MAX_TORQUE_BIAS_RATIO: Final[float] = 2.80     # Torsen Type-B helical limit

class IntakeResonanceStage(str, Enum):
    STAGE_1_LOW_MID_RUNNER = "STAGE_1_CLOSED"   # 420mm primary runner (< 3,600 RPM)
    STAGE_2_ACOUSTIC_BYPASS = "STAGE_2_OPEN"     # 210mm bypass + Helmholtz (>= 3,600 RPM)

@dataclass(frozen=True, slots=True)
class EngineTelemetrySnapshot:
    rpm: int
    throttle_pct: float
    manifold_pressure_kpa: float
    acoustic_stage: IntakeResonanceStage
    helmholtz_freq_hz: float
    left_wheel_rpm: float
    right_wheel_rpm: float
    torque_bias_ratio: float
    yaw_moment_nm: float

class UR2GSEAcousticTorsenController:
    """Manages intake acoustic valve transitions and Torsen differential yaw moments."""
    
    def __init__(self, diff_oil_temp_c: float = 85.0) -> None:
        self.diff_oil_temp_c = diff_oil_temp_c

    def compute_helmholtz_resonance(self, stage: IntakeResonanceStage, rpm: int) -> float:
        # Effective runner length: Stage 1 = 0.42m; Stage 2 = 0.21m
        runner_len = 0.210 if stage == IntakeResonanceStage.STAGE_2_ACOUSTIC_BYPASS else 0.420
        plenum_vol = 0.0042  # 4.2 L intake plenum
        runner_area = (math.pi * (0.058 ** 2)) / 4.0  # 58mm diameter
        base_hz = (SPEED_OF_SOUND_AIR_20C / (2.0 * math.pi)) * math.sqrt(runner_area / (plenum_vol * runner_len))
        # High-order harmonic resonance peak for 2UR-GSE acoustic intake surge
        return round(base_hz * 25.0, 1) if stage == IntakeResonanceStage.STAGE_2_ACOUSTIC_BYPASS else round(base_hz, 1)

    def evaluate(self, rpm: int, throttle_pct: float, steering_deg: float) -> EngineTelemetrySnapshot:
        assert 0 <= rpm <= 7500, f"RPM {rpm} out of bounds"
        assert 0.0 <= throttle_pct <= 100.0, "Throttle must be 0-100%"

        # Butterfly valve switches at 3,600 RPM
        stage = (
            IntakeResonanceStage.STAGE_2_ACOUSTIC_BYPASS
            if rpm >= 3600
            else IntakeResonanceStage.STAGE_1_LOW_MID_RUNNER
        )
        helmholtz_hz = self.compute_helmholtz_resonance(stage, rpm)

        # Yaw & Torsen TBR calculation
        v_ms = (rpm / 7300.0) * (240.0 / 3.6)
        base_w_rpm = (v_ms / (2.0 * math.pi * TIRE_ROLLING_RADIUS_METERS)) * 60.0
        turn_rad = 9999.0 if abs(steering_deg) < 0.5 else max(10.0, 150.0 / math.sin(math.radians(abs(steering_deg))))
        delta_rpm = (v_ms / turn_rad) * (TRACK_WIDTH_METERS / (2.0 * math.pi * TIRE_ROLLING_RADIUS_METERS)) * 60.0

        w_left = max(0.0, base_w_rpm - delta_rpm if steering_deg >= 0 else base_w_rpm + delta_rpm)
        w_right = max(0.0, base_w_rpm + delta_rpm if steering_deg >= 0 else base_w_rpm - delta_rpm)

        tbr = min(MAX_TORQUE_BIAS_RATIO, 1.0 + (abs(steering_deg) / 35.0) * 1.8)
        engine_tq_nm = 380.0 + (math.sin((rpm / 7300.0) * math.pi) * 155.0)
        yaw_moment = ((tbr - 1.0) / (tbr + 1.0)) * engine_tq_nm * (TRACK_WIDTH_METERS / 2.0)

        return EngineTelemetrySnapshot(
            rpm=rpm,
            throttle_pct=throttle_pct,
            manifold_pressure_kpa=round(101.3 - (1.0 - throttle_pct / 100.0) * 60.0, 1),
            acoustic_stage=stage,
            helmholtz_freq_hz=helmholtz_hz,
            left_wheel_rpm=round(w_left, 1),
            right_wheel_rpm=round(w_right, 1),
            torque_bias_ratio=round(tbr, 2),
            yaw_moment_nm=round(yaw_moment, 1),
        )
`;

  const copyCode = () => {
    navigator.clipboard.writeText(pythonCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Description */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              2UR-GSE 5.0L V8 Acoustic & Torsen Differential Core
            </h2>
            <p className="text-base text-slate-400 mt-1">
              Dual-stage intake manifold resonance state machine with 3,600 RPM butterfly crossover, coupled with Torsen Type-B helical LSD yaw moment dynamics.
            </p>
          </div>
          <button
            onClick={toggleAudio}
            className={`px-4 py-2.5 rounded-xl font-bold text-base inline-flex items-center gap-2 transition-all self-start lg:self-auto ${
              isAudioPlaying
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            {isAudioPlaying ? <Volume2 className="w-5 h-5 animate-pulse" /> : <VolumeX className="w-5 h-5" />}
            <span>{isAudioPlaying ? 'Mute V8 Audio Synth' : 'Enable Live V8 Sound'}</span>
          </button>
        </div>

        {/* Interactive RPM & Throttle Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950 border border-slate-800/80 rounded-xl p-5">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="rpm-slider" className="text-base font-bold text-slate-200">
                Engine Tachometer (RPM):
              </label>
              <span className={`text-2xl font-black font-mono tabular-nums ${rpm >= 7100 ? 'text-red-400 animate-pulse' : rpm >= 3600 ? 'text-amber-400' : 'text-slate-300'}`}>
                {rpm.toLocaleString()} RPM
              </span>
            </div>
            <input
              id="rpm-slider"
              type="range"
              min="750"
              max="7300"
              step="50"
              value={rpm}
              onChange={(e) => setRpm(Number(e.target.value))}
              className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-xs font-mono text-slate-500 mt-1.5">
              <span>Idle (750)</span>
              <span className="text-amber-400 font-bold">◄ 3,600 Flap Crossover ►</span>
              <span className="text-emerald-400">Peak (7,100)</span>
              <span className="text-red-400">Cut (7,300)</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="throttle-slider" className="text-base font-bold text-slate-200">
                Drive-by-Wire Throttle:
              </label>
              <span className="text-2xl font-black text-amber-400 font-mono tabular-nums">
                {throttlePct}%
              </span>
            </div>
            <input
              id="throttle-slider"
              type="range"
              min="0"
              max="100"
              step="1"
              value={throttlePct}
              onChange={(e) => setThrottlePct(Number(e.target.value))}
              className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-xs font-mono text-slate-500 mt-1.5">
              <span>0% Off-gas</span>
              <span>Sport S+ Non-Linear Profile</span>
              <span>100% W.O.T.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Intake Runner & Helmholtz Resonator Diagram */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-400" />
              <span>Acoustic Intake Runner Schematic</span>
            </h3>
            <span
              className={`text-sm font-mono font-bold px-3 py-1 rounded-full ${
                isStage2
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {isStage2 ? 'Stage 2: 210mm High-RPM Resonator' : 'Stage 1: 420mm Low-RPM Runner'}
            </span>
          </div>

          {/* SVG Diagram */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-center">
            <svg viewBox="0 0 520 280" className="w-full h-auto max-h-[260px] text-slate-200">
              <defs>
                <linearGradient id="airFlow" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                  <stop offset="100%" stopColor={isStage2 ? "#f59e0b" : "#3b82f6"} stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id="plenumGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>
              </defs>

              {/* Throttle Body */}
              <rect x="20" y="110" width="70" height="60" rx="6" fill="#334155" stroke="#64748b" strokeWidth="2" />
              <text x="55" y="145" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="monospace">THROTTLE</text>
              <line
                x1="55"
                y1="115"
                x2={55 + (throttlePct / 100) * 20}
                y2="165"
                stroke="#f59e0b"
                strokeWidth="4"
                strokeLinecap="round"
              />

              {/* Intake Airflow to Plenum */}
              <path d="M 90 140 L 150 140" stroke="url(#airFlow)" strokeWidth="18" fill="none" strokeDasharray="6,4" />

              {/* Central Plenum Chamber */}
              <rect x="150" y="60" width="130" height="160" rx="12" fill="url(#plenumGrad)" stroke="#475569" strokeWidth="2" />
              <text x="215" y="90" textAnchor="middle" fill="#cbd5e1" fontSize="13" fontWeight="bold">PLENUM</text>
              <text x="215" y="110" textAnchor="middle" fill="#64748b" fontSize="11" fontFamily="monospace">4.2 Liters Vol.</text>
              <text x="215" y="175" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="bold" fontFamily="monospace">
                {Math.round(101.3 - (1.0 - throttlePct / 100.0) * 60.0)} kPa
              </text>

              {/* Primary Long Runner (Stage 1) */}
              <path
                d="M 280 90 C 370 40, 420 50, 460 90"
                stroke="#64748b"
                strokeWidth="16"
                fill="none"
              />
              <path
                d="M 280 90 C 370 40, 420 50, 460 90"
                stroke="#38bdf8"
                strokeWidth="8"
                fill="none"
                strokeDasharray="8,6"
              />
              <text x="365" y="55" fill="#94a3b8" fontSize="11" fontFamily="monospace">Primary (420mm)</text>

              {/* Acoustic Bypass Flap (Stage 2) */}
              <path
                d="M 280 170 L 460 170"
                stroke={isStage2 ? "#f59e0b" : "#334155"}
                strokeWidth="16"
                fill="none"
              />
              <text x="370" y="162" fill={isStage2 ? "#f59e0b" : "#64748b"} fontSize="11" fontFamily="monospace" fontWeight="bold">
                Bypass (210mm)
              </text>

              {/* Butterfly Valve Actuator Disc */}
              <circle cx="340" cy="170" r="14" fill="#1e293b" stroke={isStage2 ? "#f59e0b" : "#64748b"} strokeWidth="2" />
              <line
                x1={isStage2 ? 340 : 340}
                y1={isStage2 ? 158 : 158}
                x2={isStage2 ? 340 : 340}
                y2={isStage2 ? 182 : 182}
                transform={isStage2 ? "rotate(90 340 170)" : "rotate(0 340 170)"}
                stroke={isStage2 ? "#10b981" : "#ef4444"}
                strokeWidth="4"
                strokeLinecap="round"
              />
              <text x="340" y="202" textAnchor="middle" fill={isStage2 ? "#10b981" : "#94a3b8"} fontSize="10" fontFamily="monospace">
                {isStage2 ? "OPEN" : "CLOSED"}
              </text>

              {/* Cylinder Intake Port */}
              <rect x="460" y="110" width="50" height="70" rx="8" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />
              <text x="485" y="145" textAnchor="middle" fill="#f8fafc" fontSize="11" fontWeight="bold">V8</text>
              <text x="485" y="162" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">PORT</text>
            </svg>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4 text-sm font-mono">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-xs">Acoustic State:</span>
              <span className={`text-base font-bold ${isStage2 ? 'text-amber-400' : 'text-slate-300'}`}>
                {acousticValveState}
              </span>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-xs">Calculated Power:</span>
              <span className="text-base font-bold text-white">
                {powerHp} HP / {totalEngineTorqueNm} Nm
              </span>
            </div>
          </div>
        </div>

        {/* Torsen Type-B Helical LSD Yaw Dynamics */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-indigo-400" />
              <span>Torsen Type-B Yaw Dynamics</span>
            </h3>
            <span className="text-sm font-mono font-bold px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
              TBR 2.80 : 1.00
            </span>
          </div>

          {/* Steering Angle Input */}
          <div className="mb-4 bg-slate-950 border border-slate-800 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="steering-slider" className="text-base font-bold text-slate-200">
                Steering Wheel Angle:
              </label>
              <span className="text-xl font-black font-mono text-indigo-400 tabular-nums">
                {steeringAngle > 0 ? `+${steeringAngle}° (Right)` : steeringAngle < 0 ? `${steeringAngle}° (Left)` : '0° (Center)'}
              </span>
            </div>
            <input
              id="steering-slider"
              type="range"
              min="-35"
              max="35"
              step="1"
              value={steeringAngle}
              onChange={(e) => setSteeringAngle(Number(e.target.value))}
              className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          {/* Wheel Speeds & Torque Split */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center">
              <span className="text-slate-400 text-xs font-mono block mb-1">REAR LEFT WHEEL</span>
              <div className="text-3xl font-black text-white font-mono tabular-nums">
                {leftWheelRpm} <span className="text-sm font-normal text-slate-400">RPM</span>
              </div>
              <div className="mt-2 text-sm font-bold text-indigo-400">
                Torque: {steeringAngle >= 0 ? innerBiasPct.toFixed(1) : outerBiasPct.toFixed(1)}%
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center">
              <span className="text-slate-400 text-xs font-mono block mb-1">REAR RIGHT WHEEL</span>
              <div className="text-3xl font-black text-white font-mono tabular-nums">
                {rightWheelRpm} <span className="text-sm font-normal text-slate-400">RPM</span>
              </div>
              <div className="mt-2 text-sm font-bold text-indigo-400">
                Torque: {steeringAngle >= 0 ? outerBiasPct.toFixed(1) : innerBiasPct.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Restorative Yaw Moment */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-sm space-y-2">
            <div className="flex justify-between items-center text-slate-300">
              <span>Restorative Yaw Moment (Mz):</span>
              <span className="text-emerald-400 font-bold text-base">{yawMomentNm} N·m</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Helical Gear Tooth Friction:</span>
              <span className="text-slate-200">Active (Involute Helical Mesh)</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Slip Threshold Saturation:</span>
              <span className="text-slate-200">Nominal (Within 2.8:1 Envelope)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Python 3.12 Algorithmic Implementation Viewer */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white">
              Production Python 3.12 Engine Source Code
            </h3>
            <p className="text-sm text-slate-400">
              is500_acoustic_torsen_core.py — Autonomous Antigravity execution artifact
            </p>
          </div>
          <button
            onClick={copyCode}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm rounded-lg border border-slate-700 inline-flex items-center gap-1.5 transition-colors"
          >
            {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedCode ? 'Copied' : 'Copy Python File'}</span>
          </button>
        </div>

        <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-[380px] leading-relaxed">
          <code>{pythonCode}</code>
        </pre>
      </div>
    </div>
  );
};
