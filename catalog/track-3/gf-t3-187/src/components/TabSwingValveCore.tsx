import React, { useState } from 'react';
import { Copy, Check, Zap, Cpu } from 'lucide-react';
import { PYTHON_SWING_VALVE_CODE } from '../data/specDocument';

export interface SimulationState {
  roadProfile: 'washboard' | 'cobblestone' | 'expansion' | 'emergency_brake';
  pistonVelocityMs: number;
  strokeDisplacementMm: number;
  swingAperturePct: number;
  dampingForceN: number;
  chamberPressureKpa: number;
  sprungAccelMs2: number;
  regime: string;
  atkinsonBtePct: number;
  mg2RegenNm: number;
  frictionBrakeNm: number;
  fluidTempC: number;
  driverBrakeNm: number;
  batterySocPct: number;
  history: Array<{
    nonce: number;
    vel: number;
    aperture: number;
    force: number;
    bte: number;
  }>;
}

interface TabSwingValveCoreProps {
  simState: SimulationState;
  onSelectProfile: (profile: SimulationState['roadProfile']) => void;
  onUpdateParams: (params: Partial<Pick<SimulationState, 'fluidTempC' | 'driverBrakeNm' | 'batterySocPct' | 'pistonVelocityMs'>>) => void;
  onStepManualPulse: () => void;
}

export const TabSwingValveCore: React.FC<TabSwingValveCoreProps> = ({
  simState,
  onSelectProfile,
  onUpdateParams,
  onStepManualPulse,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(PYTHON_SWING_VALVE_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalBrakeTorque = Math.max(1, simState.mg2RegenNm + simState.frictionBrakeNm);
  const regenSharePct = (simState.mg2RegenNm / totalBrakeTorque) * 100;

  return (
    <div className="space-y-6">
      {/* Top Interactive Simulation & Cross-Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Interactive Physics Controls & Road Excitation Profiles */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                Swing-Valve &amp; Atkinson Energy Core
              </h2>
              <span className="text-xs font-mono font-bold text-amber-400">
                PYTHON 3.12 · 2,500 HZ LOOP
              </span>
            </div>
            <p className="text-slate-300 text-sm mb-5 leading-relaxed">
              Dual-passage hydraulic damper state machine regulating ultra-low piston velocities (<code className="text-amber-300 font-mono">0.002 m/s</code> micro-stroke) via a preload-free floating swing-valve check gallery, synchronized with A25A-FXS 2.5L Atkinson-cycle regenerative torque blending.
            </p>

            {/* Road Surface Profile Selector */}
            <div className="mb-5">
              <div className="text-xs font-mono font-semibold text-slate-300 mb-2">
                Select Road Surface &amp; Dynamic Excitation Profile
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => onSelectProfile('washboard')}
                  className={`px-3.5 py-2.5 rounded-lg border text-left font-mono text-xs transition-colors cursor-pointer ${
                    simState.roadProfile === 'washboard'
                      ? 'bg-amber-500/15 border-amber-400 text-amber-300 font-bold'
                      : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div>1. Washboard Micro-Ripple</div>
                  <div className="text-slate-400">v_p = 0.0020 m/s · Bypass 94%</div>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectProfile('cobblestone')}
                  className={`px-3.5 py-2.5 rounded-lg border text-left font-mono text-xs transition-colors cursor-pointer ${
                    simState.roadProfile === 'cobblestone'
                      ? 'bg-amber-500/15 border-amber-400 text-amber-300 font-bold'
                      : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div>2. Cobblestone Chatter</div>
                  <div className="text-slate-400">v_p = 0.0085 m/s · Transitional</div>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectProfile('expansion')}
                  className={`px-3.5 py-2.5 rounded-lg border text-left font-mono text-xs transition-colors cursor-pointer ${
                    simState.roadProfile === 'expansion'
                      ? 'bg-amber-500/15 border-amber-400 text-amber-300 font-bold'
                      : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div>3. Highway Bridge Joint</div>
                  <div className="text-slate-400">v_p = 0.0620 m/s · Main Leaf Stack</div>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectProfile('emergency_brake')}
                  className={`px-3.5 py-2.5 rounded-lg border text-left font-mono text-xs transition-colors cursor-pointer ${
                    simState.roadProfile === 'emergency_brake'
                      ? 'bg-amber-500/15 border-amber-400 text-amber-300 font-bold'
                      : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div>4. Emergency Brake Dive</div>
                  <div className="text-slate-400">v_p = 0.1950 m/s · Anti-Dive Lock</div>
                </button>
              </div>
            </div>

            {/* Interactive Parameter Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950/80 border border-slate-800/90 rounded-lg p-4 mb-5">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">
                  Piston Velocity: <span className="text-amber-400 font-bold">{simState.pistonVelocityMs.toFixed(4)} m/s</span>
                </label>
                <input
                  type="range"
                  min={0.0005}
                  max={0.22}
                  step={0.0005}
                  value={simState.pistonVelocityMs}
                  onChange={(e) =>
                    onUpdateParams({ pistonVelocityMs: parseFloat(e.target.value) })
                  }
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">
                  Brake Demand: <span className="text-emerald-400 font-bold">{simState.driverBrakeNm.toFixed(0)} Nm</span>
                </label>
                <input
                  type="range"
                  min={80}
                  max={1800}
                  step={20}
                  value={simState.driverBrakeNm}
                  onChange={(e) =>
                    onUpdateParams({ driverBrakeNm: parseFloat(e.target.value) })
                  }
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">
                  HV Battery SoC: <span className="text-sky-400 font-bold">{simState.batterySocPct.toFixed(0)}%</span>
                </label>
                <input
                  type="range"
                  min={25}
                  max={94}
                  step={1}
                  value={simState.batterySocPct}
                  onChange={(e) =>
                    onUpdateParams({ batterySocPct: parseFloat(e.target.value) })
                  }
                  className="w-full accent-sky-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Atkinson & Regenerative Braking Arbitration Readout */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="text-xs font-mono font-bold text-slate-200 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-emerald-400" />
                A25A-FXS Planetary MG2 Regenerative vs. Hydraulic Friction Split
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                Regen Capture: {regenSharePct.toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-4 bg-slate-800 rounded overflow-hidden flex mb-3">
              <div
                className="bg-emerald-500 h-full transition-all duration-150"
                style={{ width: `${Math.min(100, Math.max(0, regenSharePct))}%` }}
                title="MG2 Planetary Regenerative Torque"
              />
              <div
                className="bg-amber-500 h-full transition-all duration-150"
                style={{ width: `${Math.min(100, Math.max(0, 100 - regenSharePct))}%` }}
                title="Electro-Hydraulic Friction Brake Torque"
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono tabular-nums">
              <div>
                <div className="text-slate-400">MG2 Regen Torque</div>
                <div className="text-emerald-400 font-bold">{simState.mg2RegenNm.toFixed(1)} Nm</div>
              </div>
              <div>
                <div className="text-slate-400">Friction Torque</div>
                <div className="text-amber-400 font-bold">{simState.frictionBrakeNm.toFixed(1)} Nm</div>
              </div>
              <div>
                <div className="text-slate-400">Damping Force</div>
                <div className="text-white font-bold">{simState.dampingForceN.toFixed(2)} N</div>
              </div>
              <div>
                <div className="text-slate-400">Chamber ΔP</div>
                <div className="text-sky-400 font-bold">{simState.chamberPressureKpa.toFixed(2)} kPa</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dual-Passage Hydraulic Damper Cross-Section & Oscilloscope */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className="text-xl font-bold text-white">
                Dual-Passage Hydraulic Cross-Section
              </h3>
              <button
                type="button"
                onClick={onStepManualPulse}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 font-mono text-xs px-3 py-1 rounded-lg cursor-pointer transition-colors"
              >
                +1 Frame (400 μs)
              </button>
            </div>

            {/* Interactive SVG Damper Schematic */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 mb-4">
              <svg
                viewBox="0 0 420 210"
                className="w-full h-48"
                role="img"
                aria-label="Dual-Passage Swing-Valve Hydraulic Damper Schematic"
              >
                {/* Cylinder Outer Wall */}
                <rect
                  x="20"
                  y="20"
                  width="380"
                  height="170"
                  rx="10"
                  fill="#0f172a"
                  stroke="#334155"
                  strokeWidth="2"
                />
                {/* Upper Compression Chamber & Lower Rebound Chamber */}
                <rect x="28" y="28" width="165" height="154" fill="#0284c7" fillOpacity="0.14" />
                <rect x="227" y="28" width="165" height="154" fill="#f59e0b" fillOpacity="0.12" />

                {/* Piston Rod */}
                <rect x="28" y="96" width="165" height="18" fill="#64748b" />

                {/* Main Piston Assembly */}
                <rect
                  x="190"
                  y="32"
                  width="40"
                  height="146"
                  rx="4"
                  fill="#1e293b"
                  stroke="#94a3b8"
                  strokeWidth="2"
                />

                {/* Passage 1: Main Laminated Leaf Stack (Top Orifice) */}
                <rect x="186" y="54" width="48" height="18" fill="#090d16" stroke="#475569" />
                <line
                  x1="170"
                  y1="63"
                  x2="250"
                  y2="63"
                  stroke="#38bdf8"
                  strokeWidth={Math.max(1.5, (100 - simState.swingAperturePct * 0.65) / 18)}
                  strokeDasharray="6 3"
                />

                {/* Passage 2: Auxiliary Swing-Valve Micro-Bypass Gallery (Bottom Orifice) */}
                <rect x="186" y="135" width="48" height="24" fill="#090d16" stroke="#f59e0b" />
                <line
                  x1="168"
                  y1="147"
                  x2="252"
                  y2="147"
                  stroke="#fbbf24"
                  strokeWidth={Math.max(1, (simState.swingAperturePct / 100) * 6)}
                />
                {/* Floating Swing-Valve Vane Indicator */}
                <circle
                  cx={210 + (1 - simState.swingAperturePct / 100) * 12}
                  cy="147"
                  r="6"
                  fill={simState.swingAperturePct > 50 ? '#10b981' : '#f59e0b'}
                />

                {/* Labels inside Schematic */}
                <text x="38" y="48" fill="#bae6fd" fontSize="12" fontFamily="monospace">
                  UPPER CHAMBER
                </text>
                <text x="255" y="48" fill="#fde68a" fontSize="12" fontFamily="monospace">
                  LOWER CHAMBER
                </text>
                <text x="242" y="78" fill="#94a3b8" fontSize="11" fontFamily="monospace">
                  Main Leaf Orifice
                </text>
                <text x="242" y="168" fill="#fbbf24" fontSize="11" fontFamily="monospace">
                  Swing-Valve ({simState.swingAperturePct.toFixed(0)}% Open)
                </text>
              </svg>
            </div>
          </div>

          {/* Live 2,500 Hz Telemetry History Table */}
          <div>
            <div className="text-xs font-mono font-semibold text-slate-300 mb-2">
              Recent 2,500 Hz Control Frames (Tabular Telemetry Stream)
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse font-mono text-xs tabular-nums">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/60">
                    <th className="py-2 px-3">Nonce</th>
                    <th className="py-2 px-3 text-right">v_p (m/s)</th>
                    <th className="py-2 px-3 text-right">Bypass</th>
                    <th className="py-2 px-3 text-right">Force (N)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {simState.history.slice(0, 4).map((row) => (
                    <tr key={row.nonce} className="hover:bg-slate-900/40">
                      <td className="py-2 px-3 text-sky-400">#{row.nonce}</td>
                      <td className="py-2 px-3 text-right text-slate-200">{row.vel.toFixed(4)}</td>
                      <td className="py-2 px-3 text-right text-amber-400">{row.aperture.toFixed(1)}%</td>
                      <td className="py-2 px-3 text-right text-emerald-400">{row.force.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Full Python 3.12 Implementation Code Block */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-2xl font-extrabold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-amber-400" />
              <span>Production Python 3.12 State Machine (`swing_valve_atkinson_core.py`)</span>
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Zero-placeholder implementation · Extended Kalman Observer + Walther Viscosity Compensation + Chained HMAC-SHA256
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopyCode}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-mono text-xs px-3.5 py-2 rounded-lg inline-flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Copied Python Module</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Python 3.12 Source</span>
              </>
            )}
          </button>
        </div>
        <pre className="bg-slate-950 border border-slate-800 rounded-lg p-4 overflow-x-auto text-xs font-mono text-slate-200 leading-relaxed max-h-[520px]">
          <code>{PYTHON_SWING_VALVE_CODE}</code>
        </pre>
      </div>
    </div>
  );
};
