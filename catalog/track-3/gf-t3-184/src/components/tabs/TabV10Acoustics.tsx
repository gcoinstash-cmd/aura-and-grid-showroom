import React, { useState } from 'react';
import { Copy, Check, Terminal, Cpu, Music, Play, Layers } from 'lucide-react';
import { TelemetryState } from '../../types/telemetry';

interface TabV10AcousticsProps {
  telemetry: TelemetryState;
  onSimulateRev: () => void;
  isRevving: boolean;
}

export const TabV10Acoustics: React.FC<TabV10AcousticsProps> = ({
  telemetry,
  onSimulateRev,
  isRevving,
}) => {
  const [copied, setCopied] = useState(false);

  const pythonSnippet = `"""
GF-T3-184: 1LR-GUE 4.8L V10 & ASG 150ms State Machine
Architecture: Python 3.12 (Zero external dependencies, clean-room specification)
"""
from dataclasses import dataclass
from enum import Enum
import hashlib, hmac, math, time

class ShiftState(Enum):
    ENGAGED = "ENGAGED"
    DISENGAGING_CLUTCH = "DISENGAGING_CLUTCH"
    FORK_TRAVERSAL = "FORK_TRAVERSAL"
    REV_MATCHING = "REV_MATCHING"
    ENGAGING_CLUTCH = "ENGAGING_CLUTCH"

@dataclass(slots=True)
class V10AcousticHarmonics:
    fundamental_hz: float            # F0 = RPM / 12 (10-cyl 4-stroke firing pulse)
    secondary_harmonic_hz: float     # F1 = F0 * 2.0 (Dual surge tank Helmholtz coupling)
    surge_tank_resonance_hz: float   # 750 Hz at 9000 RPM (Yamaha acoustic duct)
    titanium_valve_gear_hz: float    # 40 solid-lifter titanium valves
    exhaust_decibels: float          # 92 dB idle to 128 dB redline

class LFAEngineCore:
    IDLE_RPM: float = 950.0
    REDLINE_RPM: float = 9000.0
    REV_RATE_MAX_RPM_S: float = 13416.0    # 0.60 seconds from 950 to 9000 RPM
    SHIFT_ACTUATION_TARGET_MS: float = 150.0 # ASG electro-hydraulic threshold

    def __init__(self, hmac_secret: bytes):
        self._secret = hmac_secret
        self.rpm = self.IDLE_RPM
        self.gear = 1
        self.throttle_pct = 0.0
        self.shift_state = ShiftState.ENGAGED
        self.shift_timer_ms = 0.0

    def compute_acoustic_spectrum(self, rpm: float, throttle: float) -> V10AcousticHarmonics:
        f0 = rpm / 12.0
        f1 = f0 * 2.0
        surge = 750.0 * (rpm / self.REDLINE_RPM) ** 1.08
        valves = (rpm / 60.0) * 20.0
        db = 92.0 + (36.0 * (rpm / self.REDLINE_RPM) ** 1.3) * (0.4 + 0.6 * (throttle / 100.0))
        return V10AcousticHarmonics(f0, f1, surge, valves, db)`;

  const handleCopy = () => {
    navigator.clipboard.writeText(pythonSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ASG shift phases breakdown
  const shiftPhases = [
    { name: '1. Clutch Disengage', targetMs: 30, color: 'bg-cyan-500' },
    { name: '2. Fork Traversal', targetMs: 60, color: 'bg-blue-500' },
    { name: '3. Rev Matching (Blip)', targetMs: 30, color: 'bg-amber-500' },
    { name: '4. Clutch Re-engage', targetMs: 30, color: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Intro Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4.5">
          <div className="flex items-center gap-2 mb-2">
            <Music className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">Yamaha Acoustic Harmonics</h3>
          </div>
          <p className="text-base text-slate-400 leading-relaxed mb-3">
            The 1LR-GUE features twin surgically tuned surge tanks feeding individual throttle bodies. Acoustic duct routing channels the 750 Hz 10-cylinder firing frequency straight into the bulkhead.
          </p>
          <div className="space-y-2 font-mono text-base">
            <div className="flex justify-between p-2.5 rounded bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-400">Firing Fundamental (F0):</span>
              <span className="text-amber-400 font-bold">{telemetry.intakeHarmonicHz.toFixed(1)} Hz</span>
            </div>
            <div className="flex justify-between p-2.5 rounded bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-400">2nd Order Harmonic:</span>
              <span className="text-white font-bold">{(telemetry.intakeHarmonicHz * 2).toFixed(1)} Hz</span>
            </div>
            <div className="flex justify-between p-2.5 rounded bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-400">Surge Chamber SPL:</span>
              <span className="text-purple-400 font-bold">{telemetry.surgeTankDecibels.toFixed(1)} dB</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4.5">
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-bold text-white">ASG 150 ms Actuation Model</h3>
          </div>
          <p className="text-base text-slate-400 leading-relaxed mb-3">
            Electro-hydraulic single-clutch Automated Sequential Gearbox. Complete clutch release, dog-ring engagement, and throttle blip executes within a strict 150 ms window.
          </p>
          <div className="space-y-2.5">
            <div className="flex justify-between text-base font-mono text-slate-300">
              <span>Shift State:</span>
              <span className="text-cyan-400 font-bold">{telemetry.isShifting ? 'EXECUTING' : 'ENGAGED'}</span>
            </div>
            <div className="w-full bg-slate-950 h-3.5 rounded-full overflow-hidden flex border border-slate-800">
              {shiftPhases.map((phase) => (
                <div
                  key={phase.name}
                  className={`h-full ${phase.color}`}
                  style={{ width: `${(phase.targetMs / 150) * 100}%` }}
                  title={`${phase.name}: ${phase.targetMs}ms`}
                />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-sm font-mono text-slate-400 pt-1">
              <span>Clutch: 30ms</span>
              <span>Fork: 60ms</span>
              <span>Blip: 30ms</span>
              <span>Lock: 30ms</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-bold text-white">0.6s Rev Dynamics Engine</h3>
            </div>
            <p className="text-base text-slate-400 leading-relaxed mb-3">
              Rotational inertia of titanium valves, titanium connecting rods, and forged aluminum pistons enables 0–9,000 RPM in 0.60 seconds (13,416 RPM/sec acceleration rate).
            </p>
          </div>
          <button
            type="button"
            onClick={onSimulateRev}
            disabled={isRevving}
            className="w-full cursor-pointer py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-md shadow-amber-500/20"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            {isRevving ? 'Rev Sweeping to Redline...' : 'Run 0.6s Rev Simulator'}
          </button>
        </div>
      </div>

      {/* Code Display Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-amber-400" />
            <span className="font-mono text-base font-semibold text-slate-200">
              src/core/v10_acoustics_engine.py (Python 3.12 Clean-Room Core)
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="cursor-pointer text-sm font-mono text-slate-300 hover:text-white px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-1.5 transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied Python' : 'Copy Engine Code'}
          </button>
        </div>
        <div className="p-4 bg-slate-950/90 overflow-x-auto max-h-[420px] font-mono text-base text-slate-200 leading-relaxed">
          <pre>{pythonSnippet}</pre>
        </div>
      </div>
    </div>
  );
};
