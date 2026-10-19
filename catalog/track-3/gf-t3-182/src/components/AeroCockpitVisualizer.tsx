import React from 'react';
import { Gauge, Sliders, Wind, Compass, Zap, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { AeroTelemetry, PitotSensorReading, SimulationPreset } from '../types/aero';

interface AeroCockpitVisualizerProps {
  telemetry: AeroTelemetry;
  sensors: PitotSensorReading[];
  onSpeedChange: (speed: number) => void;
  onLateralGChange: (latG: number) => void;
  onLongitudinalGChange: (longG: number) => void;
  onYawRateChange: (yaw: number) => void;
  onApplyPreset: (preset: SimulationPreset) => void;
  onResetToNominal: () => void;
}

const PRESETS: SimulationPreset[] = [
  {
    id: 'fuji_straight',
    name: 'Fuji Straight (305 km/h DRS)',
    trackContext: '1.475 km Main Straight',
    speedKmh: 305,
    lateralG: 0.0,
    longitudinalG: 0.25,
    yawRateDegS: 0.0
  },
  {
    id: 'fuji_100r',
    name: '100R Sweeper (1.65G Vectoring)',
    trackContext: 'High-speed right turn entry',
    speedKmh: 195,
    lateralG: 1.65,
    longitudinalG: 0.0,
    yawRateDegS: 18.5
  },
  {
    id: 'dunlop_braking',
    name: 'Dunlop Chicane (-1.4G Airbrake)',
    trackContext: 'Threshold trail-braking zone',
    speedKmh: 240,
    lateralG: 0.0,
    longitudinalG: -1.4,
    yawRateDegS: 0.0
  },
  {
    id: 'panasonic_apex',
    name: 'Panasonic Apex Balance',
    trackContext: 'Final corner technical acceleration',
    speedKmh: 145,
    lateralG: -1.2,
    longitudinalG: 0.4,
    yawRateDegS: -12.0
  }
];

export const AeroCockpitVisualizer: React.FC<AeroCockpitVisualizerProps> = ({
  telemetry,
  sensors,
  onSpeedChange,
  onLateralGChange,
  onLongitudinalGChange,
  onYawRateChange,
  onApplyPreset,
  onResetToNominal
}) => {
  // Determine state badge styling
  const getStateBadge = () => {
    switch (telemetry.stateMode) {
      case 'EMERGENCY_AIRBRAKE':
        return {
          label: 'AIRBRAKE DEPLOYED (+35° MAX PITCH)',
          classes: 'bg-rose-950 text-rose-300 border-rose-800'
        };
      case 'LOW_DRAG_DRS':
        return {
          label: 'LOW DRAG DRS ACTIVE (-3.5°)',
          classes: 'bg-emerald-950 text-emerald-300 border-emerald-800'
        };
      case 'CORNERING_VECTORING':
        return {
          label: 'AERO TORQUE VECTORING (DIFFERENTIAL AoA)',
          classes: 'bg-amber-950 text-amber-300 border-amber-800'
        };
      case 'HIGH_SPEED_STABILITY':
        return {
          label: 'HIGH-SPEED DOWNFORCE STABILITY',
          classes: 'bg-cyan-950 text-cyan-300 border-cyan-800'
        };
      default:
        return {
          label: 'NOMINAL TRACK DOWNFORCE BALANCE',
          classes: 'bg-slate-800 text-slate-200 border-slate-700'
        };
    }
  };

  const stateBadge = getStateBadge();

  return (
    <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* Top Console Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-t-xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="text-sm font-mono text-cyan-400 uppercase tracking-wider mb-1">
            Active Aerodynamic Telemetry Console
          </div>
          <h2 className="text-2xl font-bold text-white">
            Heavy Overland Dynamics Platform RC F Track Edition Aero Vectoring HUD
          </h2>
        </div>

        {/* State Mode Badge - text-sm floor enforced */}
        <div className={`px-4 py-2 rounded-lg border text-sm font-mono font-semibold flex items-center gap-2 ${stateBadge.classes}`}>
          {telemetry.airbrakeActive ? (
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          )}
          <span>{stateBadge.label}</span>
        </div>
      </div>

      {/* Main Grid: Telemetry Visualizer + Parameter Sliders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 bg-slate-950 border-x border-b border-slate-800 rounded-b-xl overflow-hidden">
        
        {/* Left / Center Visualizer Stage (7 Cols) */}
        <div className="lg:col-span-7 p-6 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col justify-between">
          <div>
            {/* Visual Header */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-mono text-slate-300 flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-400" />
                <span>CHASSIS PLANFORM & SURFACE PRESSURE MAPPING</span>
              </span>
              <span className="text-sm font-mono text-slate-400">
                DYNAMIC PRESSURE q: <strong className="text-white">{telemetry.dynamicPressurePa.toLocaleString()} Pa</strong>
              </span>
            </div>

            {/* Automotive Aerodynamics Planform SVG */}
            <div className="relative w-full bg-slate-900/90 rounded-xl border border-slate-800 p-4 overflow-hidden">
              <svg
                viewBox="0 0 800 480"
                className="w-full h-auto max-h-[380px] select-none"
                aria-label="Heavy Overland Dynamics Platform RC F Track Edition Aerodynamic Flow Vectoring Blueprint"
              >
                {/* Background Coordinate Grid */}
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.8" />
                  </pattern>
                  <linearGradient id="streamlineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity="0.4" />
                  </linearGradient>
                  <linearGradient id="canardGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0284c7" />
                    <stop offset="100%" stopColor="#0369a1" />
                  </linearGradient>
                </defs>

                <rect width="800" height="480" fill="url(#grid)" />

                {/* Centerline Datum */}
                <line x1="40" y1="240" x2="760" y2="240" stroke="#334155" strokeDasharray="6,4" strokeWidth="1" />

                {/* Aerodynamic Streamlines */}
                <g opacity={telemetry.speedKmh > 20 ? "0.85" : "0.3"}>
                  {/* Streamlines over hood and roof */}
                  <path d="M 60 170 Q 220 180 400 185 T 700 190" fill="none" stroke="url(#streamlineGrad)" strokeWidth="2" strokeDasharray="10,6" />
                  <path d="M 60 210 Q 220 215 400 220 T 700 220" fill="none" stroke="url(#streamlineGrad)" strokeWidth="2.5" strokeDasharray="12,5" />
                  <path d="M 60 270 Q 220 265 400 260 T 700 260" fill="none" stroke="url(#streamlineGrad)" strokeWidth="2.5" strokeDasharray="12,5" />
                  <path d="M 60 310 Q 220 300 400 295 T 700 290" fill="none" stroke="url(#streamlineGrad)" strokeWidth="2" strokeDasharray="10,6" />
                </g>

                {/* Heavy Overland Dynamics Platform RC F Vehicle Chassis Silhouette (Top-Down Engineering Blueprint) */}
                <g id="chassis" transform="translate(100, 40)">
                  {/* Front Carbon Fiber Splitter */}
                  <path
                    d="M 50 160 C 20 170, 0 190, 0 200 C 0 210, 20 230, 50 240 L 70 240 L 70 160 Z"
                    fill="#1e293b"
                    stroke="#06b6d4"
                    strokeWidth="2.5"
                  />
                  {/* Front Splitter Strakes */}
                  <line x1="15" y1="180" x2="50" y2="180" stroke="#38bdf8" strokeWidth="2" />
                  <line x1="15" y1="220" x2="50" y2="220" stroke="#38bdf8" strokeWidth="2" />

                  {/* Dual Front Bumper Canards (Dive Planes) */}
                  <polygon points="40,140 70,145 65,155 35,150" fill="url(#canardGrad)" stroke="#38bdf8" strokeWidth="1.5" />
                  <polygon points="40,260 70,255 65,245 35,250" fill="url(#canardGrad)" stroke="#38bdf8" strokeWidth="1.5" />

                  {/* Main RC F Track Edition Body Outline */}
                  <path
                    d="M 65 160 
                       C 90 145, 140 135, 200 135 
                       C 280 135, 340 140, 420 140 
                       C 480 140, 520 150, 550 165
                       L 550 235
                       C 520 250, 480 260, 420 260
                       C 340 260, 280 265, 200 265
                       C 140 265, 90 255, 65 240
                       Z"
                    fill="#0f172a"
                    stroke="#475569"
                    strokeWidth="2.5"
                  />

                  {/* Carbon Fiber Hood & Heat Extractor */}
                  <polygon points="120,165 210,165 200,235 120,235" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
                  <path d="M 155 185 L 185 185 M 155 200 L 185 200 M 155 215 L 185 215" stroke="#06b6d4" strokeWidth="1.5" />

                  {/* Greenhouse & Roofline */}
                  <path
                    d="M 230 155 C 270 155, 360 160, 390 170 L 390 230 C 360 240, 270 245, 230 245 Z"
                    fill="#090d16"
                    stroke="#334155"
                    strokeWidth="1.5"
                  />

                  {/* Underbody Venturi Diffusers */}
                  <rect x="420" y="155" width="90" height="25" fill="#1e293b" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="3,3" />
                  <rect x="420" y="220" width="90" height="25" fill="#1e293b" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="3,3" />

                  {/* Rear Carbon Fiber Diffuser Fences */}
                  <line x1="530" y1="175" x2="565" y2="175" stroke="#0ea5e9" strokeWidth="3" />
                  <line x1="530" y1="192" x2="565" y2="192" stroke="#0ea5e9" strokeWidth="3" />
                  <line x1="530" y1="208" x2="565" y2="208" stroke="#0ea5e9" strokeWidth="3" />
                  <line x1="530" y1="225" x2="565" y2="225" stroke="#0ea5e9" strokeWidth="3" />

                  {/* Carbon Swan-Neck Rear Wing Mounting Pylons */}
                  <line x1="490" y1="150" x2="535" y2="140" stroke="#94a3b8" strokeWidth="3" />
                  <line x1="490" y1="250" x2="535" y2="260" stroke="#94a3b8" strokeWidth="3" />

                  {/* ACTIVE REAR WING DUAL INDEPENDENT ARTICULATING FLAPS */}
                  {/* Left Flap Assembly */}
                  <g id="left-flap" transform={`translate(540, 130) rotate(${telemetry.leftFlapAoADeg * 0.8}, 10, 30)`}>
                    <rect
                      x="0"
                      y="0"
                      width="24"
                      height="65"
                      rx="3"
                      fill={telemetry.airbrakeActive ? "#e11d48" : "#0284c7"}
                      stroke="#38bdf8"
                      strokeWidth="2"
                    />
                    {/* Endplate */}
                    <line x1="-3" y1="0" x2="27" y2="0" stroke="#f8fafc" strokeWidth="3" />
                  </g>

                  {/* Right Flap Assembly */}
                  <g id="right-flap" transform={`translate(540, 205) rotate(${telemetry.rightFlapAoADeg * 0.8}, 10, 35)`}>
                    <rect
                      x="0"
                      y="0"
                      width="24"
                      height="65"
                      rx="3"
                      fill={telemetry.airbrakeActive ? "#e11d48" : "#0284c7"}
                      stroke="#38bdf8"
                      strokeWidth="2"
                    />
                    {/* Endplate */}
                    <line x1="-3" y1="65" x2="27" y2="65" stroke="#f8fafc" strokeWidth="3" />
                  </g>

                  {/* Center Wing Main Spar */}
                  <line x1="540" y1="130" x2="540" y2="270" stroke="#f1f5f9" strokeWidth="2" strokeDasharray="4,2" />
                </g>

                {/* SENSOR PITOT LABELS & VALUE CALLOUTS (14px FLOOR STRICTLY ENFORCED) */}
                <g id="sensor-labels" className="text-sm font-mono font-medium">
                  {/* Front Splitter Sensor Callout */}
                  <circle cx="150" cy="200" r="5" fill="#06b6d4" stroke="#ffffff" strokeWidth="1.5" />
                  <text x="160" y="195" fill="#e2e8f0" fontSize="14" fontWeight="600">
                    PITOT-FL: {sensors[0]?.pressurePa} Pa
                  </text>

                  {/* Underbody Venturi Callout */}
                  <circle cx="480" cy="275" r="5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
                  <text x="360" y="325" fill="#e2e8f0" fontSize="14" fontWeight="600">
                    VENTURI THROAT: {sensors[2]?.pressurePa} Pa (Suction)
                  </text>

                  {/* Left Flap Callout */}
                  <circle cx="650" cy="140" r="5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
                  <text x="660" y="135" fill="#38bdf8" fontSize="14" fontWeight="700">
                    LEFT FLAP α: {telemetry.leftFlapAoADeg}°
                  </text>

                  {/* Right Flap Callout */}
                  <circle cx="650" cy="330" r="5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
                  <text x="660" y="340" fill="#38bdf8" fontSize="14" fontWeight="700">
                    RIGHT FLAP α: {telemetry.rightFlapAoADeg}°
                  </text>

                  {/* Airbrake Alert Callout on Canvas if active */}
                  {telemetry.airbrakeActive && (
                    <g transform="translate(560, 420)">
                      <rect x="-10" y="-22" width="230" height="34" rx="4" fill="#881337" stroke="#f43f5e" strokeWidth="1.5" />
                      <text x="5" y="0" fill="#ffffff" fontSize="14" fontWeight="700">
                        AIRBRAKE PITCH: +35.0°
                      </text>
                    </g>
                  )}
                </g>
              </svg>
            </div>
          </div>

          {/* Aerodynamic Balance & Performance Gauge Bar */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900 border border-slate-800 rounded-lg p-3">
            <div>
              <div className="text-sm font-mono text-slate-400">Front Downforce</div>
              <div className="text-lg font-bold font-mono text-cyan-400 tabular-nums">
                {telemetry.frontDownforceN.toLocaleString()} N
              </div>
              <div className="text-sm text-slate-400">{telemetry.frontAeroBalancePct}% Balance</div>
            </div>

            <div>
              <div className="text-sm font-mono text-slate-400">Rear Downforce</div>
              <div className="text-lg font-bold font-mono text-cyan-400 tabular-nums">
                {telemetry.rearDownforceN.toLocaleString()} N
              </div>
              <div className="text-sm text-slate-400">{telemetry.rearAeroBalancePct}% Balance</div>
            </div>

            <div>
              <div className="text-sm font-mono text-slate-400">Total Drag Force</div>
              <div className="text-lg font-bold font-mono text-amber-400 tabular-nums">
                {telemetry.dragForceN.toLocaleString()} N
              </div>
              <div className="text-sm text-slate-400">Induced + Parasitic</div>
            </div>

            <div>
              <div className="text-sm font-mono text-slate-400">Lift/Drag Ratio</div>
              <div className="text-lg font-bold font-mono text-emerald-400 tabular-nums">
                {telemetry.liftToDragRatio} : 1
              </div>
              <div className="text-sm text-slate-400">Aerodynamic Efficiency</div>
            </div>
          </div>
        </div>

        {/* Right Stage: Interactive Dynamic Sliders & Presets (5 Cols) */}
        <div className="lg:col-span-5 p-6 bg-slate-900/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-mono text-slate-300 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>DYNAMIC TELEMETRY INJECTION</span>
              </span>

              <button
                onClick={onResetToNominal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>

            {/* Presets List */}
            <div className="mb-5">
              <div className="text-sm font-semibold text-slate-300 mb-2">Track Scenarios:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onApplyPreset(p)}
                    className="text-left p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 transition-colors cursor-pointer"
                  >
                    <div className="text-sm font-semibold text-cyan-300">{p.name}</div>
                    <div className="text-sm text-slate-400">{p.trackContext}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Sliders */}
            <div className="space-y-4">
              {/* Slider 1: Speed */}
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-semibold text-slate-200">Vehicle Speed</span>
                  <span className="font-mono text-cyan-400 font-bold tabular-nums">
                    {telemetry.speedKmh} km/h ({telemetry.speedMs} m/s)
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="330"
                  step="5"
                  value={telemetry.speedKmh}
                  onChange={(e) => onSpeedChange(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <div className="flex justify-between text-sm text-slate-400 font-mono mt-0.5">
                  <span>0 km/h</span>
                  <span>160 km/h</span>
                  <span>330 km/h (V-Max)</span>
                </div>
              </div>

              {/* Slider 2: Lateral G */}
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-semibold text-slate-200">Lateral Cornering Load</span>
                  <span className="font-mono text-cyan-400 font-bold tabular-nums">
                    {telemetry.lateralG > 0 ? `+${telemetry.lateralG}` : telemetry.lateralG} G
                  </span>
                </div>
                <input
                  type="range"
                  min="-1.8"
                  max="1.8"
                  step="0.05"
                  value={telemetry.lateralG}
                  onChange={(e) => onLateralGChange(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <div className="flex justify-between text-sm text-slate-400 font-mono mt-0.5">
                  <span>-1.8G (Left apex)</span>
                  <span>0.0G (Center)</span>
                  <span>+1.8G (Right apex)</span>
                </div>
              </div>

              {/* Slider 3: Longitudinal G */}
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-semibold text-slate-200">Longitudinal Braking / Accel</span>
                  <span className="font-mono text-cyan-400 font-bold tabular-nums">
                    {telemetry.longitudinalG > 0 ? `+${telemetry.longitudinalG}` : telemetry.longitudinalG} G
                  </span>
                </div>
                <input
                  type="range"
                  min="-1.5"
                  max="1.0"
                  step="0.05"
                  value={telemetry.longitudinalG}
                  onChange={(e) => onLongitudinalGChange(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <div className="flex justify-between text-sm text-slate-400 font-mono mt-0.5">
                  <span>-1.5G (Full Airbrake)</span>
                  <span>0.0G</span>
                  <span>+1.0G (Launch)</span>
                </div>
              </div>

              {/* Slider 4: Yaw Rate */}
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-semibold text-slate-200">Yaw Rate (Slip Dynamic)</span>
                  <span className="font-mono text-cyan-400 font-bold tabular-nums">
                    {telemetry.yawRateDegS > 0 ? `+${telemetry.yawRateDegS}` : telemetry.yawRateDegS} °/s
                  </span>
                </div>
                <input
                  type="range"
                  min="-45"
                  max="45"
                  step="1"
                  value={telemetry.yawRateDegS}
                  onChange={(e) => onYawRateChange(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <div className="flex justify-between text-sm text-slate-400 font-mono mt-0.5">
                  <span>-45°/s (Left Yaw)</span>
                  <span>0°/s (Straight)</span>
                  <span>+45°/s (Right Yaw)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Hardware Envelope Indicator */}
          <div className="mt-5 pt-4 border-t border-slate-800 text-sm text-slate-300">
            <div className="flex items-center justify-between font-mono mb-1">
              <span>CAN-FD STATUS: <strong className="text-emerald-400">5.0 Mbps DUAL-CH</strong></span>
              <span>SERVO SLEW: <strong className="text-white">120°/s MAX</strong></span>
            </div>
            <p className="text-sm text-slate-400">
              Active aerodynamic wing surfaces modulate continuously at 1,000 Hz, compensating for vehicle pitch dive, roll anti-lift, and slip angle transient yaw.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
