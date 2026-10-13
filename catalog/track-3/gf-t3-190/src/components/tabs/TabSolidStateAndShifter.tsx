import React, { useState, useEffect } from 'react';
import { 
  Gauge, 
  BatteryCharging, 
  Flame, 
  Volume2, 
  VolumeX, 
  AlertTriangle, 
  CheckCircle2, 
  Cpu, 
  RotateCcw, 
  Zap, 
  Copy, 
  Check, 
  Terminal,
  Activity,
  Layers
} from 'lucide-react';
import { audioSynth } from '../../utils/audioSynth';

interface TabSolidStateAndShifterProps {
  currentGear: string;
  rpm: number;
  speedMph: number;
  torqueNm: number;
  clutchPct: number;
  throttlePct: number;
  isStalled: boolean;
  torqueCutActive: boolean;
  autoRevMatch: boolean;
  onShiftGear: (gear: string) => void;
  onClutchChange: (val: number) => void;
  onThrottleChange: (val: number) => void;
  onToggleRevMatch: () => void;
  onRestartEngine: () => void;
  onTriggerLaunchControl: () => void;
  coolingMode: 'STANDARD' | 'FAST_CHARGE' | 'HOT_LAP';
  onChangeCoolingMode: (mode: 'STANDARD' | 'FAST_CHARGE' | 'HOT_LAP') => void;
  activeCellId: number;
  onSelectCell: (id: number) => void;
  quarantinedCells: number[];
  onTriggerCellSpike: (id: number) => void;
}

export const TabSolidStateAndShifter: React.FC<TabSolidStateAndShifterProps> = ({
  currentGear,
  rpm,
  speedMph,
  torqueNm,
  clutchPct,
  throttlePct,
  isStalled,
  torqueCutActive,
  autoRevMatch,
  onShiftGear,
  onClutchChange,
  onThrottleChange,
  onToggleRevMatch,
  onRestartEngine,
  onTriggerLaunchControl,
  coolingMode,
  onChangeCoolingMode,
  activeCellId,
  onSelectCell,
  quarantinedCells,
  onTriggerCellSpike,
}) => {
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedCodeTab, setSelectedCodeTab] = useState<'thermal' | 'vmt'>('thermal');

  const gears = ['R', 'N', '1', '2', '3', '4', '5', '6'];

  const toggleAudio = () => {
    const muted = audioSynth.toggleMute();
    setIsAudioMuted(muted);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(label);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Tachometer color calculation
  const getTachColor = (r: number) => {
    if (r >= 9500) return 'text-red-500 animate-pulse';
    if (r >= 7500) return 'text-amber-400';
    if (r >= 4500) return 'text-yellow-300';
    return 'text-emerald-400';
  };

  const pythonThermalCode = `"""
GF-T3-190: Solid-State Battery Thermal Management State Machine
License: MIT Permissive | Clean-Room Certified
"""
import math
from dataclasses import dataclass

NOMINAL_ACTIVATION_ENERGY_EA = 34500.0  # J/mol (Li-ion hopping in Argyrodite Li6PS5Cl)
R_GAS = 8.314462618

@dataclass(slots=True)
class CellImpedanceState:
    cell_id: int
    impedance_mohm: float
    sei_thickness_nm: float
    temp_kelvin: float
    dendrite_margin_pct: float
    quarantined: bool = False

class SSBThermalCore:
    def __init__(self, cell_count=96):
        self.cells = [
            CellImpedanceState(
                cell_id=i,
                impedance_mohm=0.82 + (i % 6) * 0.015,
                sei_thickness_nm=12.4,
                temp_kelvin=305.15,
                dendrite_margin_pct=99.8
            ) for i in range(cell_count)
        ]

    def evaluate_eis_impedance(self, cell_id: int, current_amps: float) -> CellImpedanceState:
        cell = self.cells[cell_id]
        if cell.quarantined:
            return cell
        # Arrhenius kinetics: ionic conductivity of sulfide solid electrolyte
        sigma_t = math.exp((-NOMINAL_ACTIVATION_ENERGY_EA / R_GAS) * ((1.0 / cell.temp_kelvin) - (1.0 / 298.15)))
        effective_z = 0.82 / max(sigma_t, 0.1)
        cell.impedance_mohm = round(effective_z, 4)
        if abs(effective_z - 0.82) > 0.35:
            cell.quarantined = True
        return cell`;

  const pythonVmtCode = `"""
GF-T3-190: Virtual Manual Transmission 6-Speed Clutch-By-Wire Engine
License: MIT Permissive | Clean-Room Certified
"""
GEAR_RATIOS = {"R": -3.85, "N": 0.0, "1": 3.82, "2": 2.36, "3": 1.69, "4": 1.31, "5": 1.00, "6": 0.79}
FINAL_DRIVE = 3.65
MAX_RPM = 11000.0
IDLE_RPM = 850.0

class VirtualTransmission:
    def __init__(self):
        self.gear = "1"
        self.rpm = IDLE_RPM
        self.clutch_pedal = 0.0  # 0.0=engaged, 1.0=disengaged
        self.throttle = 0.0
        self.speed_mph = 0.0
        self.torque_cut_ms = 42

    def update_cycle(self, dt: float):
        if self.gear != "N" and self.speed_mph < 2.0 and self.clutch_pedal < 0.20 and self.throttle < 0.10:
            return {"stalled": True, "rpm": 0.0} # Engine stall detected
        
        # 42% Bite point friction calculation
        friction = max(0.0, (0.42 - self.clutch_pedal) / 0.42) if self.clutch_pedal < 0.42 else 0.0
        output_torque = self.throttle * 1280.0 * friction
        return {"stalled": False, "torque_nm": output_torque, "rpm": self.rpm}`;

  return (
    <div className="space-y-8">
      {/* SECTION 1: VIRTUAL MANUAL TRANSMISSION COCKPIT */}
      <div className="cockpit-panel rounded-2xl p-6 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Gauge className="w-6 h-6 text-amber-400" />
              <h2 className="text-2xl font-extrabold text-white tracking-tight">
                6-Speed Virtual Manual Transmission Cockpit
              </h2>
            </div>
            <p className="text-base text-slate-400 mt-1">
              Synthetic clutch-by-wire torque interruption model replicating mechanical flywheel inertia & rev matching.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleAudio}
              className={`px-3 py-1.5 rounded-lg border text-sm font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                isAudioMuted
                  ? 'bg-slate-800 border-slate-700 text-slate-400'
                  : 'bg-amber-500/10 border-amber-500/40 text-amber-300'
              }`}
            >
              {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
              <span>{isAudioMuted ? 'Synth Muted' : 'Audio Active'}</span>
            </button>

            <button
              type="button"
              onClick={onToggleRevMatch}
              className={`px-3 py-1.5 rounded-lg border text-sm font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                autoRevMatch
                  ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Auto-Blip: {autoRevMatch ? 'ON' : 'OFF'}</span>
            </button>

            <button
              type="button"
              onClick={onTriggerLaunchControl}
              className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 active:scale-95 text-white text-sm font-bold inline-flex items-center gap-1.5 shadow-md shadow-red-600/20 cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>Launch Control</span>
            </button>
          </div>
        </div>

        {/* Stall Warning Banner */}
        {isStalled && (
          <div className="mb-6 bg-red-950/80 border-2 border-red-500 rounded-xl p-4 flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-7 h-7 text-red-400 shrink-0" />
              <div>
                <h4 className="text-lg font-black text-red-200">
                  VIRTUAL ENGINE STALLED!
                </h4>
                <p className="text-sm text-red-300">
                  Clutch dumped below bite point in gear without throttle. Depress clutch or click restart.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onRestartEngine}
              className="px-4 py-2 bg-red-500 hover:bg-red-400 text-slate-950 font-black rounded-lg text-sm inline-flex items-center gap-1.5 cursor-pointer shadow-lg"
            >
              <RotateCcw className="w-4 h-4" />
              <span>START ENGINE</span>
            </button>
          </div>
        )}

        {/* Instrument Cluster Readouts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Gauge 1: Tachometer */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-base text-slate-400 mb-2">
              <span className="font-semibold uppercase tracking-wider">Engine Tachometer</span>
              <span className="font-mono text-sm text-slate-500">REDLINE 9,500</span>
            </div>

            {/* Visual Shift Light Bar */}
            <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden flex gap-0.5 p-0.5 mb-4 border border-slate-800">
              {Array.from({ length: 16 }).map((_, i) => {
                const threshold = (i / 16) * 11000;
                const active = rpm >= threshold;
                let color = 'bg-emerald-500';
                if (i >= 10 && i < 14) color = 'bg-amber-400';
                if (i >= 14) color = 'bg-red-500 animate-pulse';
                return (
                  <div
                    key={i}
                    className={`flex-1 rounded-sm transition-colors ${
                      active ? color : 'bg-slate-800/40'
                    }`}
                  />
                );
              })}
            </div>

            <div className="text-center py-2">
              <div className={`text-5xl font-black font-mono tracking-tight ${getTachColor(rpm)}`}>
                {Math.round(rpm).toLocaleString()}
              </div>
              <span className="text-base text-slate-400 font-semibold uppercase tracking-widest">
                RPM
              </span>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-sm">
              <span className="text-slate-400">Torque Interruption:</span>
              <span className={`font-mono font-bold ${torqueCutActive ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`}>
                {torqueCutActive ? '42ms TORQUE CUT ACTIVE' : 'NOMINAL (FLYWHEEL ENGAGED)'}
              </span>
            </div>
          </div>

          {/* Gauge 2: Digital Speedometer & Current Gear */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between items-center text-center">
            <div className="w-full flex items-center justify-between text-base text-slate-400 mb-2">
              <span className="font-semibold uppercase tracking-wider">Vehicle Velocity</span>
              <span className="font-mono text-sm text-cyan-400">SUB-2.0s 0-60 READY</span>
            </div>

            <div className="py-2">
              <div className="text-6xl font-black font-mono text-white tracking-tight">
                {Math.round(speedMph)}
              </div>
              <span className="text-base text-cyan-400 font-bold uppercase tracking-widest">
                MPH
              </span>
            </div>

            {/* Huge Gear Indicator */}
            <div className="w-full pt-3 border-t border-slate-800/80 flex items-center justify-around">
              <div className="text-center">
                <span className="text-xs text-slate-500 font-bold uppercase block">ACTIVE GEAR</span>
                <span className="text-3xl font-black text-amber-400 font-mono">
                  {currentGear}
                </span>
              </div>
              <div className="h-8 w-px bg-slate-800"></div>
              <div className="text-center">
                <span className="text-xs text-slate-500 font-bold uppercase block">MOTOR TORQUE</span>
                <span className="text-2xl font-black text-white font-mono">
                  {Math.round(torqueNm)} <span className="text-sm text-slate-400">Nm</span>
                </span>
              </div>
            </div>
          </div>

          {/* Gauge 3: 6-Speed Gated Shifter */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-base text-slate-400 mb-2">
              <span className="font-semibold uppercase tracking-wider">H-Gate Gear Selector</span>
              <span className="text-xs text-slate-500 font-mono">CLUTCH-BY-WIRE</span>
            </div>

            <div className="grid grid-cols-4 gap-2 my-auto">
              {gears.map((g) => {
                const isActive = currentGear === g;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => onShiftGear(g)}
                    className={`h-12 rounded-xl font-mono text-lg font-black transition-all cursor-pointer flex items-center justify-center ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400 shadow-lg shadow-amber-500/30 scale-105'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {g}
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>Shift Protocol:</span>
              <span className="font-mono text-emerald-400">Sequential & H-Gate</span>
            </div>
          </div>
        </div>

        {/* Pedals & Controls Strip */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-950/60 rounded-xl border border-slate-800">
          {/* Clutch Pedal */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-base font-bold text-slate-300 flex items-center gap-2">
                <span>Clutch Pedal</span>
                <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                  Bite Point: 42%
                </span>
              </label>
              <span className="text-base font-mono font-bold text-amber-400">
                {Math.round(clutchPct * 100)}% Depressed
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={clutchPct}
              onChange={(e) => onClutchChange(parseFloat(e.target.value))}
              className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />

            <div className="flex items-center justify-between mt-2.5 gap-2">
              <button
                type="button"
                onClick={() => onClutchChange(0)}
                className="flex-1 py-1 text-xs font-bold rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
              >
                Released (0%)
              </button>
              <button
                type="button"
                onClick={() => onClutchChange(0.42)}
                className="flex-1 py-1 text-xs font-bold rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 cursor-pointer"
              >
                Bite Point (42%)
              </button>
              <button
                type="button"
                onClick={() => onClutchChange(1.0)}
                className="flex-1 py-1 text-xs font-bold rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
              >
                Depressed (100%)
              </button>
            </div>
          </div>

          {/* Throttle Pedal */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-base font-bold text-slate-300 flex items-center gap-2">
                <span>Throttle Pedal</span>
                <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
                  Flywheel Inertia
                </span>
              </label>
              <span className="text-base font-mono font-bold text-cyan-400">
                {Math.round(throttlePct * 100)}% Input
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={throttlePct}
              onChange={(e) => onThrottleChange(parseFloat(e.target.value))}
              className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />

            <div className="flex items-center justify-between mt-2.5 gap-2">
              <button
                type="button"
                onClick={() => onThrottleChange(0)}
                className="flex-1 py-1 text-xs font-bold rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
              >
                Idle (0%)
              </button>
              <button
                type="button"
                onClick={() => onThrottleChange(0.4)}
                className="flex-1 py-1 text-xs font-bold rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
              >
                Cruise (40%)
              </button>
              <button
                type="button"
                onClick={() => onThrottleChange(1.0)}
                className="flex-1 py-1 text-xs font-bold rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 cursor-pointer"
              >
                Full Throttle (100%)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: 96-CELL SOLID-STATE BATTERY THERMAL & IMPEDANCE MATRIX */}
      <div className="cockpit-panel rounded-2xl p-6 border border-slate-800 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <BatteryCharging className="w-6 h-6 text-emerald-400" />
              <h2 className="text-2xl font-extrabold text-white tracking-tight">
                96-Cell Solid-State Battery (ASSB) Thermal Matrix
              </h2>
            </div>
            <p className="text-base text-slate-400 mt-1">
              Electrochemical Impedance Spectroscopy (EIS) monitoring at 2,800 Hz to prevent lithium dendrite nucleation.
            </p>
          </div>

          {/* Cooling Loop Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400 font-semibold mr-1">Thermal Loop:</span>
            {(['STANDARD', 'FAST_CHARGE', 'HOT_LAP'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onChangeCoolingMode(mode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  coolingMode === mode
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                {mode === 'STANDARD' && '32°C Road'}
                {mode === 'FAST_CHARGE' && 'High-C Chiller'}
                {mode === 'HOT_LAP' && 'Hot Lap 100%'}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive 96-Cell Grid */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3 text-sm text-slate-400">
            <span className="font-semibold">
              8 Modules × 12 Cells (Total 96 Solid-State Cells)
            </span>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span> Nominal (&lt;0.90 mΩ)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-amber-400"></span> Elevated (0.90-1.10 mΩ)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-red-500"></span> Quarantined / Dendrite Spike
              </span>
            </div>
          </div>

          <div className="grid grid-cols-8 sm:grid-cols-12 gap-1.5 p-3 bg-slate-950/80 rounded-xl border border-slate-800">
            {Array.from({ length: 96 }).map((_, idx) => {
              const isQuarantined = quarantinedCells.includes(idx);
              const isSelected = activeCellId === idx;
              const baseImp = 0.82 + (idx % 6) * 0.015;
              const cellImp = isQuarantined ? 1.42 : baseImp;

              let cellBg = 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300';
              if (cellImp >= 1.2 || isQuarantined) {
                cellBg = 'bg-red-950 border-red-500 text-red-300 animate-pulse';
              } else if (cellImp >= 0.89) {
                cellBg = 'bg-amber-950/60 border-amber-500/30 text-amber-300';
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSelectCell(idx)}
                  className={`h-10 rounded border text-xs font-mono font-bold flex flex-col items-center justify-center transition-all cursor-pointer ${cellBg} ${
                    isSelected ? 'ring-2 ring-white scale-105 z-10' : 'hover:scale-102'
                  }`}
                  title={`Cell #${idx} | ${cellImp.toFixed(2)} mΩ`}
                >
                  <span className="text-[10px] opacity-75">#{idx + 1}</span>
                  <span className="text-[11px]">{cellImp.toFixed(2)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Cell Deep Inspector */}
        <div className="bg-slate-950/90 rounded-xl p-5 border border-slate-800 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-slate-900 border border-slate-700 flex flex-col items-center justify-center">
              <span className="text-[11px] text-slate-400 uppercase">CELL</span>
              <span className="text-xl font-black font-mono text-white">#{activeCellId + 1}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-bold text-white">
                  Cell Telemetry Details (Argyrodite Li₆PS₅Cl Solid Electrolyte)
                </h4>
                {quarantinedCells.includes(activeCellId) ? (
                  <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/40 text-xs font-mono font-bold">
                    QUARANTINED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-mono font-bold">
                    HEALTHY NOMINAL
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-4 mt-1 text-sm font-mono text-slate-300">
                <span>Voltage: <strong className="text-white">3.84 V</strong></span>
                <span>•</span>
                <span>Impedance: <strong className="text-amber-400">{quarantinedCells.includes(activeCellId) ? '1.42 mΩ' : '0.84 mΩ'}</strong></span>
                <span>•</span>
                <span>Temp: <strong className="text-cyan-400">{coolingMode === 'FAST_CHARGE' ? '28.4°C' : '32.1°C'}</strong></span>
                <span>•</span>
                <span>SEI Layer: <strong className="text-slate-200">12.4 nm</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onTriggerCellSpike(activeCellId)}
              className="px-3.5 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>Inject Dendrite Spike Test</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 3: PURE PYTHON 3.12 CODE REPOSITORY */}
      <div className="cockpit-panel rounded-2xl p-6 border border-slate-800 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-6 h-6 text-amber-400" />
            <h3 className="text-xl font-bold text-white">
              Production Python 3.12 Core Algorithms (Strict Clean-Room Architecture)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedCodeTab('thermal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedCodeTab === 'thermal'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              ssb_thermal_matrix.py
            </button>
            <button
              type="button"
              onClick={() => setSelectedCodeTab('vmt')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedCodeTab === 'vmt'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              virtual_manual_transmission.py
            </button>
            <button
              type="button"
              onClick={() =>
                copyToClipboard(
                  selectedCodeTab === 'thermal' ? pythonThermalCode : pythonVmtCode,
                  selectedCodeTab
                )
              }
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ml-2"
            >
              {copiedCode === selectedCodeTab ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 overflow-x-auto text-sm font-mono text-slate-300 leading-relaxed max-h-80 overflow-y-auto">
          <pre>{selectedCodeTab === 'thermal' ? pythonThermalCode : pythonVmtCode}</pre>
        </div>
      </div>
    </div>
  );
};
