/**
 * AeroCockpitSimulator.tsx
 * Interactive telemetry simulator & high-downforce aerodynamic HUD
 */

import React from 'react';
import { Sliders, RotateCcw, AlertTriangle, CheckCircle2, Wind } from 'lucide-react';
import { AeroParameters, AeroTelemetryFrame } from '../utils/aeroPhysics';

interface AeroCockpitSimulatorProps {
  params: AeroParameters;
  setParams: React.Dispatch<React.SetStateAction<AeroParameters>>;
  frame: AeroTelemetryFrame;
  isSimulating: boolean;
  onToggleSim: () => void;
}

export const AeroCockpitSimulator: React.FC<AeroCockpitSimulatorProps> = ({
  params,
  setParams,
  frame,
  isSimulating,
  onToggleSim,
}) => {
  const handlePreset = (preset: 'CRUISE' | 'HIGH_SPEED' | 'FUJI_TOP_SPEED' | 'CROSSWIND_STORM') => {
    switch (preset) {
      case 'CRUISE':
        setParams({
          speedKmh: 120,
          wingAoaDeg: 9.5,
          yawSlipDeg: 0,
          groundClearanceMm: 130,
          turbulenceIntensity: 0.1,
        });
        break;
      case 'HIGH_SPEED':
        setParams({
          speedKmh: 240,
          wingAoaDeg: 11.0,
          yawSlipDeg: 0.5,
          groundClearanceMm: 120,
          turbulenceIntensity: 0.2,
        });
        break;
      case 'FUJI_TOP_SPEED':
        setParams({
          speedKmh: 285,
          wingAoaDeg: 10.0,
          yawSlipDeg: -1.2,
          groundClearanceMm: 115,
          turbulenceIntensity: 0.35,
        });
        break;
      case 'CROSSWIND_STORM':
        setParams({
          speedKmh: 220,
          wingAoaDeg: 12.5,
          yawSlipDeg: 9.8,
          groundClearanceMm: 120,
          turbulenceIntensity: 0.6,
        });
        break;
    }
  };

  const handleReset = () => {
    setParams({
      speedKmh: 240,
      wingAoaDeg: 11.0,
      yawSlipDeg: 0,
      groundClearanceMm: 125,
      turbulenceIntensity: 0.15,
    });
  };

  const isStall = frame.boundaryLayerStatus === 'STALL_RISK';
  const isVortex = frame.boundaryLayerStatus === 'VORTEX_SHEDDING';

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-6">
      {/* Title & Presets Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-black text-white tracking-tight">
              Aero Boundary Dynamics Cockpit
            </h2>
          </div>
          <p className="text-[16px] text-slate-400 mt-0.5">
            Real-time multi-point aerodynamic state estimation for Apex Executive High-Aero Grand Touring Telemetry Core Inspiration Series
          </p>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handlePreset('CRUISE')}
            className="text-[16px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 cursor-pointer transition-colors"
          >
            Cruising 120k
          </button>
          <button
            type="button"
            onClick={() => handlePreset('HIGH_SPEED')}
            className="text-[16px] font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 px-3 py-1.5 rounded-lg border border-amber-500/40 cursor-pointer transition-colors"
          >
            Ring 240k (+185kg)
          </button>
          <button
            type="button"
            onClick={() => handlePreset('FUJI_TOP_SPEED')}
            className="text-[16px] font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 px-3 py-1.5 rounded-lg border border-emerald-500/40 cursor-pointer transition-colors"
          >
            Fuji 285k
          </button>
          <button
            type="button"
            onClick={() => handlePreset('CROSSWIND_STORM')}
            className="text-[16px] font-semibold bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 px-3 py-1.5 rounded-lg border border-purple-500/40 cursor-pointer transition-colors"
          >
            Crosswind 10°
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="text-[16px] font-semibold text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
            title="Reset to default parameters"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Grid: Controls vs Visual Telemetry Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Controls Column */}
        <div className="lg:col-span-5 space-y-5 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
          {/* Airspeed Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[16px]">
              <span className="font-semibold text-slate-200">Airspeed Velocity (Pitot)</span>
              <span className="font-mono font-bold text-amber-400 text-lg">{params.speedKmh} km/h</span>
            </div>
            <input
              type="range"
              min={60}
              max={320}
              step={1}
              value={params.speedKmh}
              onChange={(e) => setParams((p) => ({ ...p, speedKmh: parseFloat(e.target.value) }))}
              className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[16px] font-mono text-slate-400">
              <span>60 km/h</span>
              <span>{( (params.speedKmh * 1000) / 3600 ).toFixed(1)} m/s (Mach {( (params.speedKmh / 1234.8) ).toFixed(2)})</span>
              <span>320 km/h</span>
            </div>
          </div>

          {/* Wing Angle of Attack (AoA) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[16px]">
              <span className="font-semibold text-slate-200">Carbon Wing Angle of Attack (AoA)</span>
              <span className="font-mono font-bold text-cyan-400 text-lg">{params.wingAoaDeg.toFixed(1)}°</span>
            </div>
            <input
              type="range"
              min={8.0}
              max={17.0}
              step={0.1}
              value={params.wingAoaDeg}
              onChange={(e) => setParams((p) => ({ ...p, wingAoaDeg: parseFloat(e.target.value) }))}
              className="w-full accent-cyan-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[16px] font-mono text-slate-400">
              <span>8.0° (Low Drag)</span>
              <span className={params.wingAoaDeg > 15.2 ? 'text-red-400 font-bold' : ''}>
                {params.wingAoaDeg > 15.2 ? 'STALL BOUNDARY EXCEEDED' : 'Nominal Range'}
              </span>
              <span>17.0°</span>
            </div>
          </div>

          {/* Yaw Slip Angle */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[16px]">
              <span className="font-semibold text-slate-200">Yaw Crosswind Slip Angle (β)</span>
              <span className="font-mono font-bold text-purple-400 text-lg">{params.yawSlipDeg.toFixed(1)}°</span>
            </div>
            <input
              type="range"
              min={-15.0}
              max={15.0}
              step={0.5}
              value={params.yawSlipDeg}
              onChange={(e) => setParams((p) => ({ ...p, yawSlipDeg: parseFloat(e.target.value) }))}
              className="w-full accent-purple-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[16px] font-mono text-slate-400">
              <span>-15.0° (Port)</span>
              <span>Restoring Torque: {frame.vortexDampingNm} Nm</span>
              <span>+15.0° (Starboard)</span>
            </div>
          </div>

          {/* Underbody Ride Height */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[16px]">
              <span className="font-semibold text-slate-200">Diffuser Ground Clearance</span>
              <span className="font-mono font-bold text-emerald-400 text-lg">{params.groundClearanceMm} mm</span>
            </div>
            <input
              type="range"
              min={105}
              max={135}
              step={1}
              value={params.groundClearanceMm}
              onChange={(e) => setParams((p) => ({ ...p, groundClearanceMm: parseFloat(e.target.value) }))}
              className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[16px] font-mono text-slate-400">
              <span>105 mm (Track Low)</span>
              <span>Venturi Suction Booster</span>
              <span>135 mm (Street)</span>
            </div>
          </div>

          {/* Live Engine Stream Controller */}
          <div className="pt-2 flex items-center justify-between bg-slate-900 p-3 rounded-lg border border-slate-800">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${isSimulating ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
              <span className="text-[16px] font-semibold text-slate-200">
                {isSimulating ? '2,600 Hz Loop: RUNNING' : 'Engine State: PAUSED'}
              </span>
            </div>
            <button
              type="button"
              onClick={onToggleSim}
              className={`text-[16px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                isSimulating
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
              }`}
            >
              {isSimulating ? 'Pause Stream' : 'Run Live Loop'}
            </button>
          </div>
        </div>

        {/* Visual Telemetry HUD & Aerofoil Canvas */}
        <div className="lg:col-span-7 flex flex-col justify-between bg-slate-950 p-5 rounded-xl border border-slate-800">
          {/* Top Status Indicators */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <Wind className="w-5 h-5 text-cyan-400" />
              <span className="text-[16px] font-semibold text-slate-300">Aero State:</span>
              <span
                className={`text-[16px] font-mono font-bold px-2 py-0.5 rounded border ${
                  isStall
                    ? 'bg-red-500/20 text-red-400 border-red-500/40'
                    : isVortex
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}
              >
                {frame.boundaryLayerStatus}
              </span>
            </div>

            <div className="text-[16px] font-mono text-slate-300">
              L/D Efficiency: <span className="font-bold text-amber-400">{frame.liftToDragRatio}</span>
            </div>
          </div>

          {/* Interactive SVG Aerofoil / Streamline Simulation */}
          <div className="relative my-4 h-56 w-full bg-slate-900/60 rounded-xl border border-slate-800/80 overflow-hidden flex items-center justify-center p-2">
            <svg viewBox="0 0 500 240" className="w-full h-full">
              <defs>
                <linearGradient id="streamlineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.2" />
                  <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.1" />
                </linearGradient>
                <linearGradient id="suctionGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.1" />
                  <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.1" />
                </linearGradient>
                <linearGradient id="carbonTexture" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="50%" stopColor="#0f172a" />
                  <stop offset="100%" stopColor="#334155" />
                </linearGradient>
              </defs>

              {/* Grid backdrop */}
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.8" />
              </pattern>
              <rect width="500" height="240" fill="url(#grid)" />

              {/* Free-stream Streamlines */}
              <g className={isSimulating ? 'opacity-90' : 'opacity-70'}>
                {/* Upper flow streamlines */}
                <path
                  d={`M 10 50 Q 200 ${30 - params.wingAoaDeg * 1.5} 490 ${45 - params.wingAoaDeg * 0.8}`}
                  fill="none"
                  stroke="url(#streamlineGrad)"
                  strokeWidth="2.5"
                  strokeDasharray={isSimulating ? "8, 4" : "none"}
                />
                <path
                  d={`M 10 75 Q 190 ${55 - params.wingAoaDeg * 1.8} 490 ${70 - params.wingAoaDeg}`}
                  fill="none"
                  stroke="url(#streamlineGrad)"
                  strokeWidth="3"
                  strokeDasharray={isSimulating ? "12, 6" : "none"}
                />
                <path
                  d={`M 10 100 Q 180 ${85 - params.wingAoaDeg * 2.2} 490 ${110 + params.wingAoaDeg * 1.5}`}
                  fill="none"
                  stroke="url(#streamlineGrad)"
                  strokeWidth="3.5"
                  strokeDasharray={isSimulating ? "10, 5" : "none"}
                />

                {/* Underbody Venturi Suction Streamline */}
                <path
                  d={`M 10 190 Q 250 ${225 - (135 - params.groundClearanceMm) * 0.7} 490 190`}
                  fill="none"
                  stroke="url(#suctionGrad)"
                  strokeWidth="4"
                  strokeDasharray={isSimulating ? "14, 6" : "none"}
                />
              </g>

              {/* Ground level representation */}
              <line x1="10" y1="215" x2="490" y2="215" stroke="#475569" strokeWidth="3" strokeDasharray="6,4" />
              <text x="20" y="232" fill="#94a3b8" fontSize="12" fontFamily="monospace">
                GROUND PLANE (CLEARANCE: {params.groundClearanceMm}mm)
              </text>

              {/* Apex Executive Inspiration Fixed Carbon Swan-Neck Wing Foil */}
              <g
                transform={`translate(240, 110) rotate(${params.wingAoaDeg}, 0, 0)`}
                className="transition-transform duration-200"
              >
                {/* Swan-Neck Mount Strut */}
                <path
                  d="M -40 -35 Q -10 -20 -15 0 L -10 5 Q -5 -15 -35 -30 Z"
                  fill="#64748b"
                  opacity="0.8"
                />

                {/* High-downforce cambered carbon aerofoil profile */}
                <path
                  d="M -110 0 C -90 -22, -10 -26, 90 -4 C 110 0, 95 12, 50 14 C -10 16, -85 14, -110 0 Z"
                  fill="url(#carbonTexture)"
                  stroke="#38bdf8"
                  strokeWidth="2"
                />

                {/* Trailing edge Gurney Flap */}
                <rect x="88" y="-9" width="3" height="12" fill="#f59e0b" />

                {/* Downforce Vector Arrow (pointing downward) */}
                <line
                  x1="0"
                  y1="5"
                  x2="0"
                  y2={Math.min(95, 20 + frame.downforceRearKg * 0.55)}
                  stroke="#10b981"
                  strokeWidth="4"
                  markerEnd="url(#arrow)"
                />
                <polygon
                  points={`-6,${Math.min(95, 20 + frame.downforceRearKg * 0.55)} 6,${Math.min(95, 20 + frame.downforceRearKg * 0.55)} 0,${Math.min(95, 20 + frame.downforceRearKg * 0.55) + 12}`}
                  fill="#10b981"
                />
              </g>

              {/* Vortex Shedding Effect when Yaw or Stall occurs */}
              {(isVortex || isStall) && (
                <g transform="translate(370, 100)" className="animate-pulse">
                  <circle cx="20" cy="0" r="14" fill="none" stroke="#f43f5e" strokeWidth="2" strokeDasharray="4,2" />
                  <circle cx="50" cy="-10" r="20" fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeDasharray="5,3" />
                  <circle cx="85" cy="5" r="26" fill="none" stroke="#f43f5e" strokeWidth="3" strokeDasharray="6,4" />
                  <text x="10" y="-25" fill="#f43f5e" fontSize="13" fontWeight="bold" fontFamily="monospace">
                    {isStall ? 'BOUNDARY STALL DETACHMENT' : 'VORTEX CORE SHEDDING'}
                  </text>
                </g>
              )}

              {/* Real-time on-canvas vector labels */}
              <text x="20" y="28" fill="#38bdf8" fontSize="13" fontWeight="bold" fontFamily="monospace">
                v = {frame.speedKmh} km/h (q = {frame.dynamicPressurePa} Pa)
              </text>
              <text x="320" y="28" fill="#10b981" fontSize="13" fontWeight="bold" fontFamily="monospace">
                F_z (Rear) = +{frame.downforceRearKg.toFixed(1)} kg
              </text>
            </svg>

            {/* Warning overlay if stalled */}
            {isStall && (
              <div className="absolute inset-0 bg-red-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center">
                <AlertTriangle className="w-10 h-10 text-red-400 mb-2 animate-bounce" />
                <h4 className="text-xl font-black text-white">AERODYNAMIC STALL DETECTED</h4>
                <p className="text-[16px] text-red-200 mt-1 max-w-md">
                  Wing AoA at {params.wingAoaDeg.toFixed(1)}° exceeds safe 15.2° threshold. PostgreSQL ledger quarantine trigger automatically engaged.
                </p>
              </div>
            )}
          </div>

          {/* Bottom Telemetry Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800">
            <div>
              <span className="text-[16px] text-slate-400 block">Wing Strain</span>
              <span className="text-[16px] font-mono font-bold text-white">
                {frame.wingStrainMicrostrain.toLocaleString()} με
              </span>
            </div>
            <div>
              <span className="text-[16px] text-slate-400 block">Strouhal Shedding</span>
              <span className="text-[16px] font-mono font-bold text-cyan-400">
                {frame.strouhalFrequencyHz} Hz
              </span>
            </div>
            <div>
              <span className="text-[16px] text-slate-400 block">Front Balance</span>
              <span className="text-[16px] font-mono font-bold text-amber-400">
                {(100 - frame.balanceRearPercent).toFixed(1)}% (+{frame.downforceFrontKg.toFixed(1)}kg)
              </span>
            </div>
            <div>
              <span className="text-[16px] text-slate-400 block">Rear Balance</span>
              <span className="text-[16px] font-mono font-bold text-emerald-400">
                {frame.balanceRearPercent.toFixed(1)}% (+{frame.downforceRearKg.toFixed(1)}kg)
              </span>
            </div>
          </div>

          {/* Cryptographic Hash Ledger Strip */}
          <div className="mt-3 p-2.5 bg-slate-900 rounded-lg border border-slate-800/80 flex items-center justify-between text-[16px]">
            <div className="flex items-center gap-2 overflow-hidden mr-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-slate-400 shrink-0 font-medium">HMAC-SHA256:</span>
              <span className="font-mono text-slate-300 truncate text-[14px]">
                {frame.hmacSignature}
              </span>
            </div>
            <span className="font-mono text-emerald-400 text-[14px] shrink-0 font-bold">
              SIGNED ✓
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
