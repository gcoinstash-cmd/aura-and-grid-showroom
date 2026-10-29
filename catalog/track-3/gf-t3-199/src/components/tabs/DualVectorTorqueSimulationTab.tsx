import React, { useState } from 'react';
import { TelemetryState, CorneringPhase } from '../../types/telemetry';
import { Gauge, Zap, Compass, RotateCcw, Copy, Check, ChevronRight } from 'lucide-react';

interface DualVectorTorqueSimulationTabProps {
  telemetry: TelemetryState;
  onUpdateTelemetry: (partial: Partial<TelemetryState>) => void;
}

export const DualVectorTorqueSimulationTab: React.FC<DualVectorTorqueSimulationTabProps> = ({
  telemetry,
  onUpdateTelemetry,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeCodeView, setActiveCodeView] = useState<'python' | 'math'>('python');

  // Handle Preset Scenarios
  const applyPreset = (preset: {
    name: string;
    speed: number;
    throttle: number;
    brake: number;
    steer: number;
    phase: CorneringPhase;
  }) => {
    // Calculate new torque split and DRS
    const speedKph = preset.speed * 1.60934;
    let front = 70;
    let rear = 30;

    if (preset.brake > 10) {
      front = 60;
      rear = 40;
    } else if (preset.speed < 15 && preset.throttle > 30) {
      front = 50;
      rear = 50;
    } else if (Math.abs(preset.steer) > 20 && preset.throttle > 45 && preset.speed > 18) {
      front = 20;
      rear = 80;
    } else if (Math.abs(preset.steer) > 30) {
      front = 50;
      rear = 50;
    }

    // DRS calculation
    let drs = 0;
    const steerNorm = preset.steer / 540.0;
    if (speedKph < 50.0) {
      const factor = 1.0 - (speedKph / 50.0);
      drs = -4.0 * steerNorm * factor;
    } else {
      const factor = Math.min(1.0, (speedKph - 50.0) / 50.0);
      drs = 3.6 * steerNorm * factor;
    }

    onUpdateTelemetry({
      speedMph: preset.speed,
      throttlePercent: preset.throttle,
      brakePercent: preset.brake,
      steeringAngleDeg: preset.steer,
      corneringPhase: preset.phase,
      frontTorqueSplit: front,
      rearTorqueSplit: rear,
      drsAngleDeg: drs,
      frontMotorKw: Math.round((preset.throttle / 100) * 61 * (front / 100)),
      engineHp: Math.round((preset.throttle / 100) * 271 * (front / 100)),
      rearEaxleKw: Math.round((preset.throttle / 100) * 80 * (rear / 100)),
    });
  };

  const handleSliderChange = (key: keyof TelemetryState, val: number) => {
    const nextState = { ...telemetry, [key]: val };
    const speedKph = (key === 'speedMph' ? val : nextState.speedMph) * 1.60934;
    const steer = key === 'steeringAngleDeg' ? val : nextState.steeringAngleDeg;
    const throttle = key === 'throttlePercent' ? val : nextState.throttlePercent;
    const brake = key === 'brakePercent' ? val : nextState.brakePercent;

    let front = 70;
    let rear = 30;

    if (brake > 10) {
      front = 60;
      rear = 40;
    } else if (nextState.speedMph < 15 && throttle > 30) {
      front = 50;
      rear = 50;
    } else if (Math.abs(steer) > 20 && throttle > 40 && nextState.speedMph > 15) {
      front = 20;
      rear = 80;
    } else if (Math.abs(steer) > 30) {
      front = 50;
      rear = 50;
    }

    let drs = 0;
    const steerNorm = steer / 540.0;
    if (speedKph < 50.0) {
      const factor = Math.max(0, 1.0 - (speedKph / 50.0));
      drs = -4.0 * steerNorm * factor;
    } else {
      const factor = Math.min(1.0, (speedKph - 50.0) / 50.0);
      drs = 3.6 * steerNorm * factor;
    }

    onUpdateTelemetry({
      [key]: val,
      frontTorqueSplit: front,
      rearTorqueSplit: rear,
      drsAngleDeg: drs,
      frontMotorKw: Math.round((throttle / 100) * 61 * (front / 100)),
      engineHp: Math.round((throttle / 100) * 271 * (front / 100)),
      rearEaxleKw: Math.round((throttle / 100) * 80 * (rear / 100)),
    });
  };

  const copyPythonCode = () => {
    navigator.clipboard.writeText(pythonCodeSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const frontWheelVisualAngle = (telemetry.steeringAngleDeg / 540) * 32; // max ~32 deg
  const rearWheelVisualAngle = telemetry.drsAngleDeg * 3.5; // visual magnification for clarity

  const isCounterPhase = telemetry.speedMph < 31.0;
  const turningRadiusM = isCounterPhase
    ? (6.0 - Math.abs(telemetry.drsAngleDeg) * 0.15).toFixed(2)
    : (6.0 + Math.abs(telemetry.drsAngleDeg) * 0.2).toFixed(2);

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-white font-display mb-1">
              DUAL_VECTOR_TORQUE & DRS Dynamic AWD State Machine
            </h2>
            <p className="text-slate-400 text-base leading-relaxed">
              Real-time torque vectoring controller arbitrating the 2.4L Turbo engine, front 1NM motor-generator, and rear water-cooled e-Axle with ±4.0° Dynamic Rear Steering.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              onClick={() =>
                applyPreset({
                  name: 'Launch',
                  speed: 5,
                  throttle: 100,
                  brake: 0,
                  steer: 0,
                  phase: 'STRAIGHT',
                })
              }
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 text-sm font-semibold rounded-lg border border-slate-700 transition-colors"
            >
              Launch (50:50)
            </button>
            <button
              onClick={() =>
                applyPreset({
                  name: 'Corner-Exit Catapult',
                  speed: 48,
                  throttle: 85,
                  brake: 0,
                  steer: 120,
                  phase: 'ACCEL_EXIT',
                })
              }
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 text-sm font-semibold rounded-lg border border-slate-700 transition-colors"
            >
              Catapult (20:80)
            </button>
            <button
              onClick={() =>
                applyPreset({
                  name: 'Trail-Braking Entry',
                  speed: 55,
                  throttle: 0,
                  brake: 65,
                  steer: -80,
                  phase: 'TRAIL_BRAKE',
                })
              }
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-sm font-semibold rounded-lg border border-slate-700 transition-colors"
            >
              Trail-Braking Entry
            </button>
            <button
              onClick={() =>
                applyPreset({
                  name: 'High-Speed Lane Change',
                  speed: 72,
                  throttle: 40,
                  brake: 0,
                  steer: 45,
                  phase: 'STRAIGHT',
                })
              }
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-sm font-semibold rounded-lg border border-slate-700 transition-colors"
            >
              High-Speed In-Phase
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Visual Chassis + Telemetry & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Chassis SVG Visualization (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-3">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-amber-400" />
              Chassis Torque & Vector HUD
            </h3>
            <span className="text-xs font-mono px-2 py-1 bg-slate-800 text-slate-300 rounded border border-slate-700">
              TALH17 Platform
            </span>
          </div>

          {/* SVG Vehicle Chassis */}
          <div className="relative py-4 flex items-center justify-center">
            <svg
              viewBox="0 0 340 480"
              className="w-full max-w-[320px] h-auto drop-shadow-2xl"
            >
              {/* Chassis outline */}
              <rect
                x="80"
                y="60"
                width="180"
                height="360"
                rx="36"
                fill="#0d1424"
                stroke="#1e293b"
                strokeWidth="3"
              />
              <path
                d="M 100 130 Q 170 110 240 130"
                fill="none"
                stroke="#334155"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              <path
                d="M 100 370 Q 170 390 240 370"
                fill="none"
                stroke="#334155"
                strokeWidth="2"
                strokeDasharray="4 4"
              />

              {/* Front Drive Axle */}
              <line x1="60" y1="120" x2="280" y2="120" stroke="#475569" strokeWidth="6" />
              {/* Rear Drive Axle */}
              <line x1="60" y1="380" x2="280" y2="380" stroke="#475569" strokeWidth="6" />

              {/* Central Drive Tunnel / High-Voltage Harness */}
              <line
                x1="170"
                y1="130"
                x2="170"
                y2="370"
                stroke="#d97706"
                strokeWidth="4"
                strokeDasharray="6 3"
              />

              {/* Front Powertrain: 2.4L Turbo + 1NM Motor */}
              <rect
                x="125"
                y="90"
                width="90"
                height="65"
                rx="8"
                fill="#1e293b"
                stroke="#f59e0b"
                strokeWidth="2"
              />
              <text
                x="170"
                y="118"
                textAnchor="middle"
                fill="#f59e0b"
                fontSize="11"
                fontWeight="bold"
                fontFamily="JetBrains Mono"
              >
                2.4L TURBO+1NM
              </text>
              <text
                x="170"
                y="138"
                textAnchor="middle"
                fill="#e2e8f0"
                fontSize="13"
                fontWeight="bold"
                fontFamily="JetBrains Mono"
              >
                {telemetry.frontTorqueSplit}% TORQUE
              </text>

              {/* Bipolar NiMH Battery Pack in Central Tunnel */}
              <rect
                x="140"
                y="215"
                width="60"
                height="70"
                rx="6"
                fill="#111827"
                stroke="#06b6d4"
                strokeWidth="2"
              />
              <text
                x="170"
                y="245"
                textAnchor="middle"
                fill="#06b6d4"
                fontSize="10"
                fontWeight="bold"
                fontFamily="JetBrains Mono"
              >
                BIPOLAR
              </text>
              <text
                x="170"
                y="262"
                textAnchor="middle"
                fill="#38bdf8"
                fontSize="11"
                fontWeight="bold"
                fontFamily="JetBrains Mono"
              >
                NiMH 288V
              </text>

              {/* Rear e-Axle Unit */}
              <rect
                x="125"
                y="350"
                width="90"
                height="60"
                rx="8"
                fill="#1e293b"
                stroke="#10b981"
                strokeWidth="2"
              />
              <text
                x="170"
                y="375"
                textAnchor="middle"
                fill="#10b981"
                fontSize="11"
                fontWeight="bold"
                fontFamily="JetBrains Mono"
              >
                REAR e-AXLE
              </text>
              <text
                x="170"
                y="395"
                textAnchor="middle"
                fill="#e2e8f0"
                fontSize="13"
                fontWeight="bold"
                fontFamily="JetBrains Mono"
              >
                {telemetry.rearTorqueSplit}% TORQUE
              </text>

              {/* Front Left Wheel */}
              <g transform={`rotate(${frontWheelVisualAngle}, 55, 120)`}>
                <rect
                  x="40"
                  y="90"
                  width="30"
                  height="60"
                  rx="6"
                  fill="#334155"
                  stroke="#f59e0b"
                  strokeWidth="2"
                />
              </g>

              {/* Front Right Wheel */}
              <g transform={`rotate(${frontWheelVisualAngle}, 285, 120)`}>
                <rect
                  x="270"
                  y="90"
                  width="30"
                  height="60"
                  rx="6"
                  fill="#334155"
                  stroke="#f59e0b"
                  strokeWidth="2"
                />
              </g>

              {/* Rear Left Wheel with DRS */}
              <g transform={`rotate(${rearWheelVisualAngle}, 55, 380)`}>
                <rect
                  x="40"
                  y="350"
                  width="30"
                  height="60"
                  rx="6"
                  fill="#334155"
                  stroke="#06b6d4"
                  strokeWidth="2"
                />
              </g>

              {/* Rear Right Wheel with DRS */}
              <g transform={`rotate(${rearWheelVisualAngle}, 285, 380)`}>
                <rect
                  x="270"
                  y="350"
                  width="30"
                  height="60"
                  rx="6"
                  fill="#334155"
                  stroke="#06b6d4"
                  strokeWidth="2"
                />
              </g>

              {/* Dynamic Rear Steering Indicator */}
              <text
                x="170"
                y="435"
                textAnchor="middle"
                fill="#38bdf8"
                fontSize="12"
                fontWeight="bold"
                fontFamily="JetBrains Mono"
              >
                DRS TOE: {telemetry.drsAngleDeg > 0 ? `+${telemetry.drsAngleDeg.toFixed(2)}` : telemetry.drsAngleDeg.toFixed(2)}°
              </text>
            </svg>
          </div>

          {/* Under SVG Stats */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-sm font-mono">
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-xs block">DRS Phase</span>
              <span className="text-cyan-400 font-bold text-base">
                {isCounterPhase ? 'COUNTER-PHASE' : 'IN-PHASE'}
              </span>
              <span className="text-slate-500 text-xs block mt-0.5">
                {isCounterPhase ? '< 31 mph Agile' : '≥ 31 mph High-G'}
              </span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-xs block">Turning Radius</span>
              <span className="text-white font-bold text-base">{turningRadiusM} m</span>
              <span className="text-slate-500 text-xs block mt-0.5">
                Standard: 6.00 m
              </span>
            </div>
          </div>
        </div>

        {/* Right: Interactive Sliders & Live Inverter Output (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Controls Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xl font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Gauge className="w-5 h-5 text-amber-400" />
                Live Dynamic AWD Inputs
              </span>
              <button
                onClick={() =>
                  onUpdateTelemetry({
                    speedMph: 45,
                    throttlePercent: 35,
                    brakePercent: 0,
                    steeringAngleDeg: 0,
                    frontTorqueSplit: 70,
                    rearTorqueSplit: 30,
                    drsAngleDeg: 0,
                  })
                }
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-mono transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Defaults
              </button>
            </h3>

            {/* Speed Slider */}
            <div>
              <div className="flex justify-between items-center mb-1 text-base">
                <label className="text-slate-300 font-medium">Vehicle Speed</label>
                <span className="font-mono text-white font-bold text-lg">
                  {telemetry.speedMph} mph <span className="text-slate-400 text-sm">({Math.round(telemetry.speedMph * 1.60934)} km/h)</span>
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="125"
                value={telemetry.speedMph}
                onChange={(e) => handleSliderChange('speedMph', Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-xs text-slate-500 font-mono mt-0.5">
                <span>0 mph (Standstill)</span>
                <span className="text-cyan-400 font-bold">31 mph (DRS Phase Shift)</span>
                <span>125 mph (Top Track)</span>
              </div>
            </div>

            {/* Throttle Slider */}
            <div>
              <div className="flex justify-between items-center mb-1 text-base">
                <label className="text-slate-300 font-medium">Throttle Position</label>
                <span className="font-mono text-amber-400 font-bold text-lg">
                  {telemetry.throttlePercent}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={telemetry.throttlePercent}
                onChange={(e) => handleSliderChange('throttlePercent', Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Brake Slider */}
            <div>
              <div className="flex justify-between items-center mb-1 text-base">
                <label className="text-slate-300 font-medium">Braking Hydraulic Pressure</label>
                <span className="font-mono text-rose-400 font-bold text-lg">
                  {telemetry.brakePercent}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={telemetry.brakePercent}
                onChange={(e) => handleSliderChange('brakePercent', Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
            </div>

            {/* Steering Wheel Slider */}
            <div>
              <div className="flex justify-between items-center mb-1 text-base">
                <label className="text-slate-300 font-medium">Steering Wheel Angle</label>
                <span className="font-mono text-cyan-400 font-bold text-lg">
                  {telemetry.steeringAngleDeg > 0 ? `+${telemetry.steeringAngleDeg}` : telemetry.steeringAngleDeg}°
                </span>
              </div>
              <input
                type="range"
                min="-540"
                max="540"
                value={telemetry.steeringAngleDeg}
                onChange={(e) => handleSliderChange('steeringAngleDeg', Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <div className="flex justify-between text-xs text-slate-500 font-mono mt-0.5">
                <span>-540° (Full Left Lock)</span>
                <span>0° (Centered)</span>
                <span>+540° (Full Right Lock)</span>
              </div>
            </div>
          </div>

          {/* Real-time Computed Powertrain Powerflow */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Subsystem Mechanical & Electrical Torque Outputs
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-xs font-mono block">2.4L T24A-FTS TURBO</span>
                <span className="text-2xl font-black text-amber-400 font-mono">
                  {telemetry.engineHp} <span className="text-sm font-normal text-slate-400">hp</span>
                </span>
                <span className="text-xs text-slate-400 block mt-1">
                  Peak: 271 hp @ 6000 rpm
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-xs font-mono block">FRONT 1NM MOTOR</span>
                <span className="text-2xl font-black text-cyan-400 font-mono">
                  {telemetry.frontMotorKw} <span className="text-sm font-normal text-slate-400">kW</span>
                </span>
                <span className="text-xs text-slate-400 block mt-1">
                  Peak: 61 kW (82 hp)
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-xs font-mono block">REAR e-AXLE INVERTER</span>
                <span className="text-2xl font-black text-emerald-400 font-mono">
                  {telemetry.rearEaxleKw} <span className="text-sm font-normal text-slate-400">kW</span>
                </span>
                <span className="text-xs text-slate-400 block mt-1">
                  Peak: 80 kW (107 hp)
                </span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-base font-mono">
              <span className="text-slate-300">Total System Combined Output:</span>
              <span className="text-white font-extrabold text-xl">
                {Math.round(telemetry.engineHp + telemetry.frontMotorKw * 1.341 + telemetry.rearEaxleKw * 1.341)} hp / 550 Nm
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Code & Algorithmic Implementation Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between bg-slate-950 px-5 py-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveCodeView('python')}
              className={`text-sm font-mono font-bold px-3 py-1 rounded transition-colors ${
                activeCodeView === 'python'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              dual_vector_torque_controller.py (Python 3.12)
            </button>
            <button
              onClick={() => setActiveCodeView('math')}
              className={`text-sm font-mono font-bold px-3 py-1 rounded transition-colors ${
                activeCodeView === 'math'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Mathematical Formulas
            </button>
          </div>
          <button
            onClick={copyPythonCode}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-mono bg-slate-850 px-2.5 py-1 rounded border border-slate-700 transition-colors"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedCode ? 'Copied' : 'Copy Source'}
          </button>
        </div>

        <div className="p-5 font-mono text-sm leading-relaxed overflow-x-auto bg-slate-950/60 max-h-[420px] text-slate-300">
          {activeCodeView === 'python' ? (
            <pre className="text-slate-300">{pythonCodeSnippet}</pre>
          ) : (
            <div className="space-y-4 text-base font-sans">
              <div>
                <h4 className="text-lg font-bold text-white font-display mb-1">
                  1. Front-to-Rear Dynamic Torque Arbitrator
                </h4>
                <p className="text-slate-300 text-sm">
                  Let T_dem = T_max × (throttle_% / 100) be driver demand. The arbitrator yields front torque T_f and rear torque T_r:
                </p>
                <div className="p-3 bg-slate-900 rounded font-mono text-sm text-amber-400 my-2">
                  T_f = T_dem · α(V, θ_steer, dθ/dt, a_y), &nbsp;&nbsp; T_r = T_dem · (1 - α)
                </div>
                <p className="text-slate-400 text-xs">
                  Where α ∈ [0.20, 1.00]. During hard launch: α = 0.50. In apex exit: α = 0.20 (80% rear catapult). Cruising: α = 0.70.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-bold text-white font-display mb-1">
                  2. Dynamic Rear Steering (DRS) Resolver Equations
                </h4>
                <div className="p-3 bg-slate-900 rounded font-mono text-sm text-cyan-400 my-2">
                  δ_r(V) = {'{'} -4.0° · (θ_steer / θ_lock) · [1 - V/50] &nbsp; (if V &lt; 50 km/h)
                  <br />
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; +3.6° · (θ_steer / θ_lock) · min(1, [V-50]/50) &nbsp; (if V ≥ 50 km/h) {'}'}
                </div>
                <p className="text-slate-400 text-xs">
                  Phase transition occurs smoothly at exactly V_switch = 50.0 km/h (31.1 mph) to prevent zero-crossing torque oscillation in the rear rack stepper actuator.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const pythonCodeSnippet = `#!/usr/bin/env python3
"""
GF-T3-199 Performance Controller: DUAL_VECTOR_TORQUE & DRS Core
Platform: Apex Executive Dual-Vector Performance Core High-G Dynamic Telemetry (TALH17)
License: MIT Permissive | Clean-Room Certified
"""
from dataclasses import dataclass
from typing import Tuple
import math

@dataclass(frozen=True)
class VehicleState:
    speed_kph: float
    steering_deg: float
    throttle_pct: float
    brake_pct: float
    yaw_rate_deg_s: float
    lat_g: float

@dataclass(frozen=True)
class TorqueVectorCommand:
    front_ratio: float      # e.g. 0.70 (70% Front)
    rear_ratio: float       # e.g. 0.30 (30% Rear)
    drs_angle_deg: float    # -4.0 to +4.0 degrees
    front_torque_nm: float  # Up to 460 Nm
    rear_torque_nm: float   # Up to 169 Nm rear e-Axle

class DualVectorTorqueController:
    """High-frequency 2,500 Hz DUAL_VECTOR_TORQUE AWD & Dynamic Rear Steering State Machine"""
    MAX_TOTAL_TORQUE_NM = 550.0
    FRONT_MAX_NM = 460.0
    REAR_EAXLE_MAX_NM = 169.0
    V_SWITCH_KPH = 50.0

    @classmethod
    def compute(cls, state: VehicleState) -> TorqueVectorCommand:
        v = max(0.0, state.speed_kph)
        steer = state.steering_deg
        throttle = min(1.0, max(0.0, state.throttle_pct / 100.0))
        brake = min(1.0, max(0.0, state.brake_pct / 100.0))

        # 1. Base Torque Request Arbitration
        target_torque = cls.MAX_TOTAL_TORQUE_NM * throttle

        if brake > 0.05:
            # Regenerative trail braking (anti-dive stability)
            front_ratio = 0.60
            rear_ratio = 0.40
        elif v < 15.0 and throttle > 0.40:
            # Standstill launch catapult: 50:50 anti-hop
            front_ratio = 0.50
            rear_ratio = 0.50
        elif abs(steer) > 20.0 and throttle > 0.45 and v > 20.0:
            # Corner exit acceleration bias: 20:80 rear catapult
            front_ratio = 0.20
            rear_ratio = 0.80
        elif abs(steer) > 25.0:
            # Apex transition: 50:50 neutral balance
            front_ratio = 0.50
            rear_ratio = 0.50
        else:
            # Steady-state cruising: 70:30 aerodynamic efficiency
            front_ratio = 0.70
            rear_ratio = 0.30

        # Physical component saturation clamping
        req_front_nm = target_torque * front_ratio
        req_rear_nm = target_torque * rear_ratio
        if req_rear_nm > cls.REAR_EAXLE_MAX_NM:
            overflow = req_rear_nm - cls.REAR_EAXLE_MAX_NM
            req_rear_nm = cls.REAR_EAXLE_MAX_NM
            req_front_nm = min(cls.FRONT_MAX_NM, req_front_nm + overflow)
            total = req_front_nm + req_rear_nm
            front_ratio = req_front_nm / total if total > 0 else 0.7
            rear_ratio = req_rear_nm / total if total > 0 else 0.3

        # 2. Dynamic Rear Steering (DRS) Resolving
        steer_norm = steer / 540.0
        if v < cls.V_SWITCH_KPH:
            # Low speed Counter-Phase (up to -4.0 deg)
            factor = max(0.0, 1.0 - (v / cls.V_SWITCH_KPH))
            drs_angle = -4.0 * steer_norm * factor
        else:
            # High speed In-Phase (up to +4.0 deg)
            factor = min(1.0, (v - cls.V_SWITCH_KPH) / 50.0)
            drs_angle = 3.6 * steer_norm * factor

        drs_angle = max(-4.0, min(4.0, drs_angle))

        return TorqueVectorCommand(
            front_ratio=round(front_ratio, 3),
            rear_ratio=round(rear_ratio, 3),
            drs_angle_deg=round(drs_angle, 2),
            front_torque_nm=round(req_front_nm, 1),
            rear_torque_nm=round(req_rear_nm, 1),
        )
`;
