import React, { useState } from 'react';
import { TelemetryState } from '../../types/telemetry';
import { PYTHON_CORE_ENGINE_CODE } from '../../data/codeSnippets';
import { 
  Gauge, 
  Volume2, 
  VolumeX, 
  Compass, 
  RotateCcw, 
  Copy, 
  Check, 
  Sliders, 
  Car, 
  Zap, 
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

interface DrsAcousticCoreTabProps {
  telemetry: TelemetryState;
  onUpdateTelemetry: (partial: Partial<TelemetryState>) => void;
  onTriggerPreset: (presetKey: string) => void;
}

export const DrsAcousticCoreTab: React.FC<DrsAcousticCoreTabProps> = ({
  telemetry,
  onUpdateTelemetry,
  onTriggerPreset,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeSubView, setActiveSubView] = useState<'cockpit' | 'python_code'>('cockpit');

  const handleCopyCode = () => {
    navigator.clipboard.writeText(PYTHON_CORE_ENGINE_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const frontWheelAngle = (telemetry.steeringWheelAngleDeg / 13.6);
  const isCounterPhase = telemetry.phase === 'COUNTER_PHASE';
  const isInPhase = telemetry.phase === 'IN_PHASE';

  return (
    <div className="space-y-6">
      {/* Subview Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-neutral-900 border border-neutral-800">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveSubView('cockpit')}
            className={`px-5 py-2.5 rounded-lg text-base font-bold transition-all cursor-pointer ${
              activeSubView === 'cockpit'
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                : 'bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700'
            }`}
          >
            Interactive Telemetry Cockpit & Visualizer
          </button>
          <button
            type="button"
            onClick={() => setActiveSubView('python_code')}
            className={`px-5 py-2.5 rounded-lg text-base font-bold transition-all cursor-pointer ${
              activeSubView === 'python_code'
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                : 'bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700'
            }`}
          >
            Python 3.12 Engine Source (Zero Placeholder)
          </button>
        </div>

        {activeSubView === 'python_code' && (
          <button
            type="button"
            onClick={handleCopyCode}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 text-base font-semibold transition-colors cursor-pointer"
          >
            {copiedCode ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-neutral-400" />}
            <span>{copiedCode ? 'Copied Python 3.12 Source!' : 'Copy drs_acoustic_engine.py'}</span>
          </button>
        )}
      </div>

      {activeSubView === 'python_code' ? (
        /* Python 3.12 Production Code Panel */
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-800">
            <div>
              <h2 className="text-3xl font-extrabold text-white">
                Active Rear Steering & Acoustic Valve State Machine
              </h2>
              <p className="text-base text-neutral-300 mt-1">
                Pure Python 3.12 implementation conforming to SAE vehicle dynamics equations and 2UR-GSE 5.0L naturally aspirated V8 acoustic harmonic mapping.
              </p>
            </div>
            <span className="px-3 py-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-base">
              MIT Permissive Verified
            </span>
          </div>

          <pre className="p-5 rounded-lg bg-neutral-950 text-neutral-200 font-mono text-base overflow-x-auto leading-relaxed border border-neutral-800 max-h-[650px] overflow-y-auto">
            <code>{PYTHON_CORE_ENGINE_CODE}</code>
          </pre>
        </div>
      ) : (
        /* Interactive Cockpit & Visualizer */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Visual Chassis & Acoustic Actuator Display */}
          <div className="lg:col-span-7 space-y-6">
            {/* Visualizer Card */}
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-800">
                <div>
                  <h2 className="text-3xl font-extrabold text-white">
                    Apex Executive High-Aero Grand Touring Telemetry Core GA-L Chassis Dynamics
                  </h2>
                  <p className="text-base text-neutral-300">
                    Live dynamic rear steering phase and acoustic valve position
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-md font-mono font-bold text-base ${
                    isCounterPhase
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : isInPhase
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                  }`}>
                    {telemetry.phase === 'COUNTER_PHASE' ? 'COUNTER-PHASE' : telemetry.phase === 'IN_PHASE' ? 'IN-PHASE' : 'NEUTRAL ZONE'}
                  </span>
                </div>
              </div>

              {/* Dynamic SVG Vehicle Diagram */}
              <div className="relative w-full h-[320px] bg-neutral-950 rounded-xl border border-neutral-800/80 flex items-center justify-center p-4 overflow-hidden">
                <svg
                  className="w-full h-full max-w-[560px]"
                  viewBox="0 0 500 280"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="chassisGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#1e293b" />
                      <stop offset="50%" stopColor="#334155" />
                      <stop offset="100%" stopColor="#1e293b" />
                    </linearGradient>
                    <linearGradient id="cockpitGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0f172a" />
                      <stop offset="100%" stopColor="#020617" />
                    </linearGradient>
                  </defs>

                  {/* Centerline Grid & Road Vector */}
                  <line x1="20" y1="140" x2="480" y2="140" stroke="#374151" strokeDasharray="6 6" strokeWidth="1.5" />

                  {/* Vehicle Body Shadow */}
                  <rect x="75" y="55" width="350" height="170" rx="40" fill="#000000" opacity="0.6" />

                  {/* Apex Executive High-Aero Grand Touring Telemetry Core Convertible Chassis Outline */}
                  <rect x="80" y="50" width="340" height="180" rx="35" fill="url(#chassisGrad)" stroke="#475569" strokeWidth="2.5" />
                  
                  {/* Convertible Open Cabin Area */}
                  <rect x="180" y="70" width="140" height="140" rx="20" fill="url(#cockpitGrad)" stroke="#64748b" strokeWidth="1.5" />

                  {/* Cabin Seating & Center Console */}
                  <rect x="220" y="80" width="45" height="50" rx="8" fill="#1e293b" stroke="#334155" />
                  <rect x="220" y="150" width="45" height="50" rx="8" fill="#1e293b" stroke="#334155" />
                  <line x1="242" y1="75" x2="242" y2="205" stroke="#475569" strokeWidth="2" />

                  {/* Roof Status Indicator in SVG */}
                  <text x="242" y="145" textAnchor="middle" fill="#94a3b8" fontSize="16" fontFamily="Plus Jakarta Sans" fontWeight="600">
                    {telemetry.topStatus === 'STOWED' ? 'ROOF STOWED (OPEN)' : 'ROOF DEPLOYED'}
                  </text>

                  {/* Front Wheels (Steered by front rack angle) */}
                  <g transform={`translate(370, 40) rotate(${frontWheelAngle})`}>
                    <rect x="-18" y="-12" width="36" height="24" rx="4" fill="#0f172a" stroke="#f59e0b" strokeWidth="2.5" />
                    <line x1="-10" y1="0" x2="10" y2="0" stroke="#f59e0b" strokeWidth="2" />
                  </g>
                  <g transform={`translate(370, 240) rotate(${frontWheelAngle})`}>
                    <rect x="-18" y="-12" width="36" height="24" rx="4" fill="#0f172a" stroke="#f59e0b" strokeWidth="2.5" />
                    <line x1="-10" y1="0" x2="10" y2="0" stroke="#f59e0b" strokeWidth="2" />
                  </g>

                  {/* Front Axle */}
                  <line x1="370" y1="52" x2="370" y2="228" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="4 2" />
                  <text x="370" y="270" textAnchor="middle" fill="#f59e0b" fontSize="16" fontFamily="JetBrains Mono" fontWeight="bold">
                    Front: {frontWheelAngle > 0 ? `+${frontWheelAngle.toFixed(1)}°` : `${frontWheelAngle.toFixed(1)}°`}
                  </text>

                  {/* Rear Wheels (Active Rear Steering with ±2.0° dynamic phase) */}
                  <g transform={`translate(130, 40) rotate(${telemetry.rearWheelAngleDeg * 4})`}>
                    <rect 
                      x="-18" 
                      y="-12" 
                      width="36" 
                      height="24" 
                      rx="4" 
                      fill="#0f172a" 
                      stroke={isCounterPhase ? '#f59e0b' : isInPhase ? '#06b6d4' : '#94a3b8'} 
                      strokeWidth="2.5" 
                    />
                    <line x1="-10" y1="0" x2="10" y2="0" stroke={isCounterPhase ? '#f59e0b' : isInPhase ? '#06b6d4' : '#94a3b8'} strokeWidth="2" />
                  </g>
                  <g transform={`translate(130, 240) rotate(${telemetry.rearWheelAngleDeg * 4})`}>
                    <rect 
                      x="-18" 
                      y="-12" 
                      width="36" 
                      height="24" 
                      rx="4" 
                      fill="#0f172a" 
                      stroke={isCounterPhase ? '#f59e0b' : isInPhase ? '#06b6d4' : '#94a3b8'} 
                      strokeWidth="2.5" 
                    />
                    <line x1="-10" y1="0" x2="10" y2="0" stroke={isCounterPhase ? '#f59e0b' : isInPhase ? '#06b6d4' : '#94a3b8'} strokeWidth="2" />
                  </g>

                  {/* Rear Axle */}
                  <line x1="130" y1="52" x2="130" y2="228" stroke={isCounterPhase ? '#f59e0b' : isInPhase ? '#06b6d4' : '#94a3b8'} strokeWidth="2.5" strokeDasharray="4 2" />
                  <text x="130" y="270" textAnchor="middle" fill={isCounterPhase ? '#f59e0b' : isInPhase ? '#06b6d4' : '#94a3b8'} fontSize="16" fontFamily="JetBrains Mono" fontWeight="bold">
                    DRS Rear: {telemetry.rearWheelAngleDeg > 0 ? `+${telemetry.rearWheelAngleDeg.toFixed(2)}°` : `${telemetry.rearWheelAngleDeg.toFixed(2)}°`}
                  </text>

                  {/* Rear Dual Exhaust Pipes with Acoustic Flaps */}
                  {/* Left Exhaust Flap */}
                  <rect x="52" y="80" width="28" height="16" rx="3" fill="#18181b" stroke="#ef4444" strokeWidth="2" />
                  <circle cx="56" cy="88" r="4" fill={telemetry.exhaustFlapDutyPct > 10 ? '#ef4444' : '#52525b'} />
                  {/* Right Exhaust Flap */}
                  <rect x="52" y="184" width="28" height="16" rx="3" fill="#18181b" stroke="#ef4444" strokeWidth="2" />
                  <circle cx="56" cy="192" r="4" fill={telemetry.exhaustFlapDutyPct > 10 ? '#ef4444' : '#52525b'} />

                  {/* Acoustic Flap Label */}
                  <text x="36" y="145" textAnchor="middle" fill="#ef4444" fontSize="16" fontFamily="JetBrains Mono" fontWeight="bold">
                    {telemetry.exhaustFlapDutyPct.toFixed(0)}%
                  </text>

                  {/* Wheelbase Dimension Marker */}
                  <line x1="130" y1="20" x2="370" y2="20" stroke="#64748b" strokeWidth="1" />
                  <text x="250" y="16" textAnchor="middle" fill="#94a3b8" fontSize="16" fontFamily="JetBrains Mono">
                    Wheelbase: 2,870 mm (GA-L)
                  </text>
                </svg>
              </div>

              {/* Physical Telemetry Readout Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-neutral-800">
                <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800">
                  <div className="text-base text-neutral-400">Front Steer Angle</div>
                  <div className="text-xl font-bold font-mono text-white mt-1">
                    {frontWheelAngle > 0 ? `+${frontWheelAngle.toFixed(1)}°` : `${frontWheelAngle.toFixed(1)}°`}
                  </div>
                </div>
                <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800">
                  <div className="text-base text-neutral-400">Target Yaw Rate</div>
                  <div className="text-xl font-bold font-mono text-white mt-1">
                    {telemetry.targetYawRateDegS.toFixed(1)} °/s
                  </div>
                </div>
                <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800">
                  <div className="text-base text-neutral-400">Measured Yaw Rate</div>
                  <div className="text-xl font-bold font-mono text-cyan-400 mt-1">
                    {telemetry.yawRateDegS.toFixed(1)} °/s
                  </div>
                </div>
                <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800">
                  <div className="text-base text-neutral-400">V8 Firing Hz</div>
                  <div className="text-xl font-bold font-mono text-amber-400 mt-1">
                    {telemetry.harmonicFreqHz.toFixed(1)} Hz
                  </div>
                </div>
              </div>
            </div>

            {/* Acoustic Flap Actuator Gauge Card */}
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-extrabold text-white flex items-center gap-2">
                    <Volume2 className="w-6 h-6 text-red-500" />
                    2UR-GSE 5.0L V8 Bimodal Exhaust Actuators
                  </h3>
                  <p className="text-base text-neutral-300 mt-1">
                    Continuous electronic servo flap duty cycle & atmospheric sound pressure
                  </p>
                </div>
                <span className="px-3 py-1 rounded bg-red-500/10 border border-red-500/30 text-red-400 font-mono font-bold text-base">
                  {telemetry.exhaustDecibels.toFixed(1)} dB SPL
                </span>
              </div>

              {/* Duty Cycle Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-base">
                  <span className="text-neutral-300 font-semibold">Exhaust Flap Position (Left & Right Servos)</span>
                  <span className="text-red-400 font-mono font-bold">{telemetry.exhaustFlapDutyPct.toFixed(1)}% OPEN</span>
                </div>
                <div className="w-full h-4 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 transition-all duration-150"
                    style={{ width: `${telemetry.exhaustFlapDutyPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-base text-neutral-400 pt-1 font-mono">
                  <span>0% (Quiet Touring: 66 dB)</span>
                  <span>45% Threshold</span>
                  <span>100% (High-Flow Sonic Wave: 94 dB)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Telemetry Controls & Scenario Bench */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <h3 className="text-2xl font-extrabold text-white flex items-center gap-2">
                  <Sliders className="w-6 h-6 text-amber-500" />
                  Vehicle Dynamics Controls
                </h3>
                <span className="px-3 py-1 rounded bg-neutral-800 text-neutral-300 font-mono text-base">
                  Live Sync (1,000 Hz)
                </span>
              </div>

              {/* Slider 1: Vehicle Speed */}
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <label htmlFor="speed-slider" className="text-base font-bold text-neutral-200">Vehicle Speed</label>
                  <span className="text-2xl font-extrabold font-mono text-amber-400">
                    {telemetry.speedKph.toFixed(1)} km/h
                  </span>
                </div>
                <input
                  id="speed-slider"
                  type="range"
                  min="0"
                  max="280"
                  step="0.5"
                  value={telemetry.speedKph}
                  onChange={(e) => onUpdateTelemetry({ speedKph: parseFloat(e.target.value) })}
                  className="w-full h-2.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-base font-mono text-neutral-400">
                  <span>0 km/h</span>
                  <span className="text-amber-300 font-bold">80 km/h (Phase Inversion)</span>
                  <span>280 km/h</span>
                </div>
              </div>

              {/* Slider 2: Steering Wheel Angle */}
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <label htmlFor="steering-slider" className="text-base font-bold text-neutral-200">Steering Wheel Angle</label>
                  <span className="text-2xl font-extrabold font-mono text-white">
                    {telemetry.steeringWheelAngleDeg > 0 ? `+${telemetry.steeringWheelAngleDeg.toFixed(1)}°` : `${telemetry.steeringWheelAngleDeg.toFixed(1)}°`}
                  </span>
                </div>
                <input
                  id="steering-slider"
                  type="range"
                  min="-450"
                  max="450"
                  step="1"
                  value={telemetry.steeringWheelAngleDeg}
                  onChange={(e) => onUpdateTelemetry({ steeringWheelAngleDeg: parseFloat(e.target.value) })}
                  className="w-full h-2.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-base font-mono text-neutral-400">
                  <span>-450° (Full Left)</span>
                  <span>0° Center</span>
                  <span>+450° (Full Right)</span>
                </div>
              </div>

              {/* Slider 3: Lateral Acceleration G */}
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <label htmlFor="lateralg-slider" className="text-base font-bold text-neutral-200">Lateral Acceleration (G)</label>
                  <span className="text-2xl font-extrabold font-mono text-cyan-400">
                    {telemetry.lateralG > 0 ? `+${telemetry.lateralG.toFixed(2)} g` : `${telemetry.lateralG.toFixed(2)} g`}
                  </span>
                </div>
                <input
                  id="lateralg-slider"
                  type="range"
                  min="-1.2"
                  max="1.2"
                  step="0.02"
                  value={telemetry.lateralG}
                  onChange={(e) => onUpdateTelemetry({ lateralG: parseFloat(e.target.value) })}
                  className="w-full h-2.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <div className="flex justify-between text-base font-mono text-neutral-400">
                  <span>-1.20 g</span>
                  <span>0.00 g</span>
                  <span>+1.20 g</span>
                </div>
              </div>

              {/* Slider 4: Engine RPM (2UR-GSE V8) */}
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <label htmlFor="rpm-slider" className="text-base font-bold text-neutral-200">Engine Speed (5.0L V8)</label>
                  <span className="text-2xl font-extrabold font-mono text-red-400">
                    {Math.round(telemetry.engineRpm).toLocaleString()} RPM
                  </span>
                </div>
                <input
                  id="rpm-slider"
                  type="range"
                  min="800"
                  max="7300"
                  step="50"
                  value={telemetry.engineRpm}
                  onChange={(e) => onUpdateTelemetry({ engineRpm: parseFloat(e.target.value) })}
                  className="w-full h-2.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                />
                <div className="flex justify-between text-base font-mono text-neutral-400">
                  <span>800 (Idle)</span>
                  <span>3,500 (Bypass Open)</span>
                  <span className="text-red-400 font-bold">7,300 (Redline)</span>
                </div>
              </div>

              {/* Slider 5: Throttle Load */}
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <label htmlFor="load-slider" className="text-base font-bold text-neutral-200">Throttle Load</label>
                  <span className="text-2xl font-extrabold font-mono text-white">
                    {telemetry.engineLoadPct.toFixed(0)}%
                  </span>
                </div>
                <input
                  id="load-slider"
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={telemetry.engineLoadPct}
                  onChange={(e) => onUpdateTelemetry({ engineLoadPct: parseFloat(e.target.value) })}
                  className="w-full h-2.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-base font-mono text-neutral-400">
                  <span>0% (Closed)</span>
                  <span>50%</span>
                  <span>100% (WOT)</span>
                </div>
              </div>

              {/* Convertible Soft-Top Status Toggle */}
              <div className="pt-2 border-t border-neutral-800">
                <div className="text-base font-bold text-neutral-200 mb-2">Convertible Top Mode</div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => onUpdateTelemetry({ topStatus: 'STOWED' })}
                    className={`px-4 py-2.5 rounded-lg text-base font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      telemetry.topStatus === 'STOWED'
                        ? 'bg-amber-500 text-neutral-950 font-bold'
                        : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                    }`}
                  >
                    <Volume2 className="w-5 h-5" />
                    <span>Top Stowed (Open Air)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateTelemetry({ topStatus: 'DEPLOYED' })}
                    className={`px-4 py-2.5 rounded-lg text-base font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      telemetry.topStatus === 'DEPLOYED'
                        ? 'bg-amber-500 text-neutral-950 font-bold'
                        : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                    }`}
                  >
                    <VolumeX className="w-5 h-5" />
                    <span>Top Deployed (Coupe)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Test Scenarios */}
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-6 shadow-xl space-y-4">
              <h3 className="text-2xl font-extrabold text-white flex items-center gap-2">
                <Zap className="w-6 h-6 text-amber-400" />
                Quick Test Scenarios
              </h3>
              <div className="grid grid-cols-1 gap-2.5">
                <button
                  type="button"
                  onClick={() => onTriggerPreset('transition')}
                  className="w-full text-left p-3.5 rounded-lg bg-neutral-950 hover:bg-neutral-800/80 border border-neutral-800 hover:border-amber-500/50 transition-all flex items-center justify-between cursor-pointer group"
                >
                  <div>
                    <div className="text-base font-bold text-white group-hover:text-amber-400">
                      80 km/h Phase Threshold Transition
                    </div>
                    <div className="text-base text-neutral-400">
                      Evaluates the Schmitt-trigger hysteresis and phase inversion boundary
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-neutral-500 group-hover:text-amber-400" />
                </button>

                <button
                  type="button"
                  onClick={() => onTriggerPreset('parking')}
                  className="w-full text-left p-3.5 rounded-lg bg-neutral-950 hover:bg-neutral-800/80 border border-neutral-800 hover:border-amber-500/50 transition-all flex items-center justify-between cursor-pointer group"
                >
                  <div>
                    <div className="text-base font-bold text-white group-hover:text-amber-400">
                      Tight Hairpin Counter-Phase (35 km/h)
                    </div>
                    <div className="text-base text-neutral-400">
                      High front angle with opposing rear steer (-1.82°) for tight turning circle
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-neutral-500 group-hover:text-amber-400" />
                </button>

                <button
                  type="button"
                  onClick={() => onTriggerPreset('autobahn')}
                  className="w-full text-left p-3.5 rounded-lg bg-neutral-950 hover:bg-neutral-800/80 border border-neutral-800 hover:border-amber-500/50 transition-all flex items-center justify-between cursor-pointer group"
                >
                  <div>
                    <div className="text-base font-bold text-white group-hover:text-amber-400">
                      Autobahn High-Speed Lane Change (160 km/h)
                    </div>
                    <div className="text-base text-neutral-400">
                      In-phase rear steer (+1.45°) produces pure lateral shift with 0° body slip
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-neutral-500 group-hover:text-amber-400" />
                </button>

                <button
                  type="button"
                  onClick={() => onTriggerPreset('wot')}
                  className="w-full text-left p-3.5 rounded-lg bg-neutral-950 hover:bg-neutral-800/80 border border-neutral-800 hover:border-amber-500/50 transition-all flex items-center justify-between cursor-pointer group"
                >
                  <div>
                    <div className="text-base font-bold text-white group-hover:text-amber-400">
                      WOT 7,100 RPM V8 Acoustic Surge
                    </div>
                    <div className="text-base text-neutral-400">
                      Wide open throttle with 100% flap duty cycle and 94 dB open-air roar
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-neutral-500 group-hover:text-amber-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
