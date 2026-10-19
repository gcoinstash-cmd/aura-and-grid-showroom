import React, { useState } from 'react';
import {
  Cpu,
  Zap,
  Gauge,
  Sliders,
  Play,
  RotateCw,
  Copy,
  Check,
  Activity,
  Flame,
  Layers,
  ArrowRight
} from 'lucide-react';
import { TelemetryFrame } from '../../types/telemetry';

interface PsdHybridCoreTabProps {
  frame: TelemetryFrame;
  onUpdateParams: (params: {
    roadSurface?: TelemetryFrame['roadSurface'];
    throttlePercent?: number;
    vehicleSpeedKmh?: number;
  }) => void;
  onSimulateTransient: () => void;
}

export const PsdHybridCoreTab: React.FC<PsdHybridCoreTabProps> = ({
  frame,
  onUpdateParams,
  onSimulateTransient,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeSubView, setActiveSubView] = useState<'visualizer' | 'code'>('visualizer');

  const pythonCode = `# psd_state_machine.py
# Pure Python 3.12 State Machine | Heavy Overland Dynamics Platform UX 300h 5th-Gen Hybrid
# Clean-Room Engineering | MIT Permissive License

from dataclasses import dataclass
import hashlib
import hmac
import math

RING_TEETH: int = 78
SUN_TEETH: int = 30
PLANET_CARRIER_RATIO: float = (RING_TEETH + SUN_TEETH) / SUN_TEETH  # 3.6
RING_TO_SUN_RATIO: float = RING_TEETH / SUN_TEETH                   # 2.6
TIRE_RADIUS_METERS: float = 0.334
FINAL_DRIVE_RATIO: float = 3.288
MAX_REAR_TORQUE_NM: float = 84.0

@dataclass(slots=True, frozen=True)
class KinematicState:
    vehicle_speed_kmh: float
    throttle_pct: float
    friction_mu: float
    ice_rpm: float
    mg1_rpm: float
    mg2_rpm: float
    rear_torque_nm: float
    front_torque_pct: float
    rear_torque_pct: float
    cell_spread_mv: float
    quarantine: bool
    nonce: int
    prev_hash: str
    current_hash: str
    hmac_sig: str

class PowerSplitDeviceEngine:
    """
    Epicyclic gear train and E-Four electronic rear axle torque controller.
    Willis Kinematic Relation: R * w_ring + S * w_sun = (R + S) * w_carrier
    """
    def __init__(self, hmac_secret: str = "GF-T3-186-CLEANROOM-SECRET"):
        self._secret = hmac_secret.encode("utf-8")
        self._nonce = 1000000
        self._last_hash = "0000000000000000000000000000000000000000000000000000000000000000"

    def compute_kinematics(
        self,
        vehicle_speed_kmh: float,
        throttle_pct: float,
        friction_mu: float,
        cell_spread_mv: float = 18.5,
    ) -> KinematicState:
        self._nonce += 1
        
        # Ring gear speed derived from road velocity
        v_ms = max(0.0, vehicle_speed_kmh) / 3.6
        wheel_rad_s = v_ms / TIRE_RADIUS_METERS
        ring_rad_s = wheel_rad_s * FINAL_DRIVE_RATIO
        mg2_rpm = (ring_rad_s * 60.0) / (2.0 * math.pi)

        # M20A-FXS 2.0L Engine Target (Atkinson-cycle thermal peak at 1400-3800 RPM)
        if throttle_pct < 5.0 and vehicle_speed_kmh < 40.0:
            ice_rpm = 0.0  # EV stealth drive mode
        else:
            base_ice = 1100.0 + (throttle_pct / 100.0) * 4500.0
            ice_rpm = min(6000.0, max(1000.0, base_ice))

        # Willis PSD relation: w_s = 3.6 * w_carrier - 2.6 * w_ring
        mg1_rpm = (PLANET_CARRIER_RATIO * ice_rpm) - (RING_TO_SUN_RATIO * mg2_rpm)

        # E-Four Electronic Rear Axle allocation (20:80 launch bias down to 100:0 cruise)
        if vehicle_speed_kmh < 35.0:
            rear_bias = 0.80 - (vehicle_speed_kmh / 35.0) * 0.40
        else:
            rear_bias = 0.00

        # Surface friction compensation (low mu triggers immediate e-Axle torque vectoring)
        slip_demand = max(0.0, (1.0 - friction_mu) * 0.50)
        total_rear_ratio = min(0.80, max(0.0, rear_bias + slip_demand * (throttle_pct / 100.0)))
        total_front_ratio = 1.0 - total_rear_ratio

        rear_torque_nm = (total_rear_ratio / 0.80) * MAX_REAR_TORQUE_NM * (throttle_pct / 100.0)
        quarantine = cell_spread_mv > 45.0

        # HMAC block signature
        payload = f"{self._nonce}:{vehicle_speed_kmh:.2f}:{throttle_pct:.2f}:{rear_torque_nm:.2f}:{cell_spread_mv:.2f}:{self._last_hash}"
        current_hash = hashlib.sha256(payload.encode("utf-8")).hexdigest()
        hmac_sig = hmac.new(self._secret, current_hash.encode("utf-8"), hashlib.sha256).hexdigest()
        self._last_hash = current_hash

        return KinematicState(
            vehicle_speed_kmh=vehicle_speed_kmh,
            throttle_pct=throttle_pct,
            friction_mu=friction_mu,
            ice_rpm=ice_rpm,
            mg1_rpm=mg1_rpm,
            mg2_rpm=mg2_rpm,
            rear_torque_nm=rear_torque_nm,
            front_torque_pct=round(total_front_ratio * 100.0, 1),
            rear_torque_pct=round(total_rear_ratio * 100.0, 1),
            cell_spread_mv=cell_spread_mv,
            quarantine=quarantine,
            nonce=self._nonce,
            prev_hash=self._last_hash,
            current_hash=current_hash,
            hmac_sig=hmac_sig,
        )`;

  const handleCopy = () => {
    navigator.clipboard.writeText(pythonCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const roadSurfaces = [
    { id: 'dry_asphalt', name: 'Dry Asphalt', mu: 0.90, desc: 'High Grip (μ=0.90)' },
    { id: 'wet_tarmac', name: 'Wet Tarmac', mu: 0.60, desc: 'Damp (μ=0.60)' },
    { id: 'packed_snow', name: 'Packed Snow', mu: 0.30, desc: 'Low Grip (μ=0.30)' },
    { id: 'black_ice', name: 'Black Ice', mu: 0.15, desc: 'Extreme Slip (μ=0.15)' },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Tab Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              E-Four Torque & PSD Hybrid Core
            </h2>
            <p className="text-base text-slate-400 mt-1">
              5th-Generation Hybrid Power Split Device (M20A-FXS 2.0L + MG1 + MG2) & Electronic Rear e-Axle State Machine
            </p>
          </div>

          {/* Sub-view segmented selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg shrink-0">
            <button
              onClick={() => setActiveSubView('visualizer')}
              className={`px-3 py-1.5 text-base font-semibold rounded-md transition-colors cursor-pointer ${
                activeSubView === 'visualizer'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Interactive Kinematics HUD
            </button>
            <button
              onClick={() => setActiveSubView('code')}
              className={`px-3 py-1.5 text-base font-semibold rounded-md transition-colors cursor-pointer ${
                activeSubView === 'code'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Python 3.12 Engine Source
            </button>
          </div>
        </div>

        {/* Live Simulator Controls */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Surface Selector */}
          <div>
            <label className="block text-base font-bold text-slate-300 mb-2">
              Road Surface Friction (μ)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {roadSurfaces.map(surface => (
                <button
                  key={surface.id}
                  onClick={() => onUpdateParams({ roadSurface: surface.id })}
                  className={`p-2.5 rounded-lg text-left border transition-all cursor-pointer ${
                    frame.roadSurface === surface.id
                      ? 'bg-amber-500/10 border-amber-500 text-amber-400 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="text-base font-semibold">{surface.name}</div>
                  <div className="text-base text-slate-500 font-mono mt-0.5">{surface.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Throttle Slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-base font-bold text-slate-300">
                Throttle Demand (Pedal %)
              </label>
              <span className="text-base font-mono font-bold text-amber-400">
                {frame.throttlePercent}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={frame.throttlePercent}
              onChange={e => onUpdateParams({ throttlePercent: Number(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
            />
            <div className="flex justify-between text-base text-slate-500 font-mono mt-2">
              <span>0% EV Glide</span>
              <span>50% Atkinson Cruise</span>
              <span>100% WOT Launch</span>
            </div>
          </div>

          {/* Vehicle Velocity Slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-base font-bold text-slate-300">
                Vehicle Velocity (km/h)
              </label>
              <span className="text-base font-mono font-bold text-cyan-400">
                {frame.vehicleSpeedKmh.toFixed(1)} km/h
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="180"
              value={frame.vehicleSpeedKmh}
              onChange={e => onUpdateParams({ vehicleSpeedKmh: Number(e.target.value) })}
              className="w-full accent-cyan-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
            />
            <div className="flex justify-between text-base text-slate-500 font-mono mt-2">
              <span>0 km/h (Standstill)</span>
              <span>80 km/h</span>
              <span>180 km/h (Max)</span>
            </div>
          </div>
        </div>

        {/* Action Trigger Banner */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="text-base text-slate-400">
            Dynamic Willis Equation: <code className="text-slate-200 font-mono font-semibold">R·ω_ring + S·ω_sun = (R+S)·ω_carrier</code> (R=78, S=30)
          </div>
          <button
            onClick={onSimulateTransient}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-base inline-flex items-center gap-2 cursor-pointer transition-all shadow-md"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Simulate High-Load E-Four AWD Launch (80% Rear)</span>
          </button>
        </div>
      </div>

      {activeSubView === 'visualizer' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Epicyclic Planetary & e-Axle SVG Visualizer (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-base font-bold text-slate-200 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-amber-400" />
                  Powertrain Kinematic Architecture & Torque Flow
                </span>
                <span className="text-base font-mono font-semibold px-2.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                  Transaxle P910 + Rear Q510
                </span>
              </div>

              {/* Dynamic SVG Schematic */}
              <div className="w-full bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex items-center justify-center relative overflow-hidden">
                <svg viewBox="0 0 600 340" className="w-full h-auto max-h-[340px]">
                  {/* Background grid */}
                  <defs>
                    <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="600" height="340" fill="url(#grid)" />

                  {/* FRONT TRANSAXLE BOUNDARY */}
                  <rect x="20" y="20" width="360" height="300" rx="12" fill="#0f172a" stroke="#334155" strokeWidth="1.5" strokeDasharray="4 2" />
                  <text x="35" y="42" fill="#94a3b8" fontSize="13" fontWeight="bold" fontFamily="Plus Jakarta Sans">FRONT P910 TRANSAXLE (PSD + M20A-FXS)</text>

                  {/* Engine Carrier */}
                  <rect x="40" y="65" width="130" height="60" rx="8" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />
                  <text x="50" y="90" fill="#f59e0b" fontSize="14" fontWeight="bold">M20A-FXS ICE</text>
                  <text x="50" y="112" fill="#cbd5e1" fontSize="12" fontFamily="JetBrains Mono">
                    {frame.iceRpm.toFixed(0)} RPM (Carrier)
                  </text>

                  {/* Sun Gear (MG1) */}
                  <rect x="230" y="65" width="130" height="60" rx="8" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
                  <text x="240" y="90" fill="#38bdf8" fontSize="14" fontWeight="bold">MG1 (Sun Gear)</text>
                  <text x="240" y="112" fill="#cbd5e1" fontSize="12" fontFamily="JetBrains Mono">
                    {frame.mg1Rpm.toFixed(0)} RPM
                  </text>

                  {/* Planetary Power Split Device Center Circle */}
                  <circle cx="200" cy="180" r="45" fill="#090d16" stroke="#e2e8f0" strokeWidth="3" />
                  <circle cx="200" cy="180" r="18" fill="#38bdf8" stroke="#0284c7" strokeWidth="2" />
                  <text x="187" y="185" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="JetBrains Mono">PSD</text>
                  <text x="175" y="240" fill="#94a3b8" fontSize="11" fontFamily="JetBrains Mono">Ring: R=78 | Sun: S=30</text>

                  {/* Ring Gear & MG2 */}
                  <rect x="40" y="245" width="130" height="60" rx="8" fill="#1e293b" stroke="#10b981" strokeWidth="2" />
                  <text x="50" y="270" fill="#10b981" fontSize="14" fontWeight="bold">MG2 (Traction)</text>
                  <text x="50" y="292" fill="#cbd5e1" fontSize="12" fontFamily="JetBrains Mono">
                    {frame.mg2Rpm.toFixed(0)} RPM
                  </text>

                  {/* Front Wheels Connection */}
                  <rect x="230" y="245" width="130" height="60" rx="8" fill="#1e293b" stroke="#cbd5e1" strokeWidth="1.5" />
                  <text x="240" y="270" fill="#f8fafc" fontSize="13" fontWeight="bold">Front Axle Drive</text>
                  <text x="240" y="292" fill="#38bdf8" fontSize="12" fontFamily="JetBrains Mono" fontWeight="bold">
                    {frame.frontTorquePercent.toFixed(0)}% Torque
                  </text>

                  {/* Dynamic Power Flow Lines */}
                  <path d="M 105 125 L 105 180 L 155 180" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="5 3" />
                  <path d="M 295 125 L 295 180 L 245 180" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="5 3" />
                  <path d="M 170 205 L 105 205 L 105 245" fill="none" stroke="#10b981" strokeWidth="2.5" strokeDasharray="5 3" />

                  {/* REAR E-AXLE BOUNDARY */}
                  <rect x="410" y="20" width="170" height="300" rx="12" fill="#0f172a" stroke="#d97706" strokeWidth="1.5" strokeDasharray="4 2" />
                  <text x="420" y="42" fill="#fbbf24" fontSize="13" fontWeight="bold" fontFamily="Plus Jakarta Sans">REAR Q510 E-AXLE</text>

                  {/* Rear Inverter & Motor */}
                  <rect x="425" y="70" width="140" height="90" rx="8" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />
                  <text x="435" y="95" fill="#f59e0b" fontSize="14" fontWeight="bold">E-Four Rear Motor</text>
                  <text x="435" y="117" fill="#cbd5e1" fontSize="12" fontFamily="JetBrains Mono">
                    30 kW / 84 Nm Peak
                  </text>
                  <text x="435" y="137" fill="#38bdf8" fontSize="12" fontFamily="JetBrains Mono">
                    {frame.rearInverterCurrentA.toFixed(1)} A Inverter
                  </text>

                  {/* Rear Axle Drive Output */}
                  <rect x="425" y="210" width="140" height="95" rx="8" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />
                  <text x="435" y="235" fill="#f59e0b" fontSize="13" fontWeight="bold">Rear Wheels</text>
                  <text x="435" y="260" fill="#f8fafc" fontSize="18" fontWeight="bold" fontFamily="JetBrains Mono">
                    {frame.rearTorquePercent.toFixed(0)}% Split
                  </text>
                  <text x="435" y="285" fill="#cbd5e1" fontSize="12" fontFamily="JetBrains Mono">
                    {frame.rearMotorTorqueNm.toFixed(1)} Nm Real-Time
                  </text>

                  {/* Wireless/Electric Fly-By-Wire link */}
                  <path d="M 380 170 L 410 170" fill="none" stroke="#f59e0b" strokeWidth="3" strokeDasharray="6 3" />
                  <text x="365" y="158" fill="#fbbf24" fontSize="10" fontFamily="JetBrains Mono">CAN-FD 2.2kHz</text>
                </svg>
              </div>
            </div>

            {/* Torque Split Distribution Bar */}
            <div className="mt-4 pt-4 border-t border-slate-800">
              <div className="flex justify-between items-center text-base mb-2">
                <span className="font-bold text-slate-200">
                  Dynamic AWD Torque Split: Front {frame.frontTorquePercent.toFixed(0)}% / Rear {frame.rearTorquePercent.toFixed(0)}%
                </span>
                <span className="font-mono text-amber-400 font-bold">
                  {frame.rearTorquePercent > 50 ? 'Launch / Slip Vectoring' : 'High Efficiency Cruise'}
                </span>
              </div>
              <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  className="bg-cyan-500 transition-all duration-300"
                  style={{ width: `${frame.frontTorquePercent}%` }}
                />
                <div
                  className="bg-amber-500 transition-all duration-300"
                  style={{ width: `${frame.rearTorquePercent}%` }}
                />
              </div>
              <div className="flex justify-between text-base text-slate-400 font-mono mt-1">
                <span>Front P910 Transaxle</span>
                <span>Rear Q510 Electronic e-Axle</span>
              </div>
            </div>
          </div>

          {/* Right: Telemetry & Inverter Kinematic Readouts (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Readout 1: M20A-FXS 2.0L Engine */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-base font-bold text-slate-200 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-500" />
                  M20A-FXS 2.0L Atkinson ICE
                </span>
                <span className="text-base font-mono font-bold text-amber-400">
                  150 hp / 188 Nm
                </span>
              </div>
              <div className="text-4xl font-black text-white font-mono tabular-nums">
                {frame.iceRpm.toFixed(0)} <span className="text-2xl font-bold text-slate-400">RPM</span>
              </div>
              <p className="text-base text-slate-400 mt-2">
                Coupled directly to planetary carrier gear. Peak thermal efficiency 41% under Atkinson cycle.
              </p>
            </div>

            {/* Readout 2: MG1 Sun Gear Speed */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-base font-bold text-slate-200 flex items-center gap-2">
                  <RotateCw className="w-4 h-4 text-cyan-400" />
                  MG1 Sun Gear Generator
                </span>
                <span className="text-base font-mono font-bold text-cyan-400">
                  Continuous Variable Ratio
                </span>
              </div>
              <div className="text-4xl font-black text-white font-mono tabular-nums">
                {frame.mg1Rpm.toFixed(0)} <span className="text-2xl font-bold text-slate-400">RPM</span>
              </div>
              <p className="text-base text-slate-400 mt-2">
                Willis balance gear: absorbs excess engine torque and charges the high-voltage Li-Ion battery.
              </p>
            </div>

            {/* Readout 3: MG2 Front Traction Motor */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-base font-bold text-slate-200 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  MG2 Front Traction Motor
                </span>
                <span className="text-base font-mono font-bold text-emerald-400">
                  83 kW (111 hp) / 206 Nm
                </span>
              </div>
              <div className="text-4xl font-black text-white font-mono tabular-nums">
                {frame.mg2Rpm.toFixed(0)} <span className="text-2xl font-bold text-slate-400">RPM</span>
              </div>
              <p className="text-base text-slate-400 mt-2">
                Mechanically locked to the ring gear and differential counter-gear for instantaneous electric launch.
              </p>
            </div>

            {/* Readout 4: Rear E-Four e-Axle */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-base font-bold text-slate-200 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-amber-400" />
                  E-Four Rear Inverter (2,200 Hz)
                </span>
                <span className="text-base font-mono font-bold text-amber-400">
                  CAN-FD Fly-by-Wire
                </span>
              </div>
              <div className="text-4xl font-black text-amber-400 font-mono tabular-nums">
                {frame.rearMotorTorqueNm.toFixed(1)} <span className="text-2xl font-bold text-slate-400">Nm</span>
              </div>
              <p className="text-base text-slate-400 mt-2">
                Independent rear traction without heavy mechanical propeller shaft. Active anti-slip vectoring in &lt;8.2ms.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Code View */
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
            <div>
              <span className="text-base font-bold text-white font-mono">
                psd_state_machine.py
              </span>
              <span className="text-base text-slate-500 ml-3">
                Python 3.12 | Zero external heavy runtime dependencies
              </span>
            </div>
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-base font-semibold inline-flex items-center gap-2 cursor-pointer transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy Source'}</span>
            </button>
          </div>
          <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg overflow-x-auto text-sm font-mono text-slate-300 leading-relaxed max-h-[580px]">
            <code>{pythonCode}</code>
          </pre>
        </div>
      )}
    </div>
  );
};
