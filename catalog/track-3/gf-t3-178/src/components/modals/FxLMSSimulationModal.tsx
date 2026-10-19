import React, { useState, useEffect } from 'react';
import { X, Activity, Volume2, VolumeX, Sliders, CheckCircle2, AlertCircle } from 'lucide-react';

interface FxLMSSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FxLMSSimulationModal: React.FC<FxLMSSimulationModalProps> = ({ isOpen, onClose }) => {
  const [freqHz, setFreqHz] = useState(120);
  const [phaseDegrees, setPhaseDegrees] = useState(180);
  const [secondaryDelayMs, setSecondaryDelayMs] = useState(1.5);
  const [antiPhaseActive, setAntiPhaseActive] = useState(true);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Compute calculated attenuation based on phase angle and delay
  // Ideal is 180 degrees and < 1.7 ms delay
  const phaseError = Math.abs(phaseDegrees - 180);
  const delayPenalty = Math.max(0, (secondaryDelayMs - 1.5) * 4);
  const calculatedAttenuation = antiPhaseActive
    ? -Math.max(1.2, 19.5 - (phaseError * 0.12) - delayPenalty)
    : 0.0;
  const rawNoiseDb = 68.4;
  const residualDb = Math.max(48.0, rawNoiseDb + calculatedAttenuation);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 text-slate-100 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top-right close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Close Modal"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800 pr-10">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-white tracking-tight">
              Interactive FxLMS Acoustic Inversion Simulator
            </h3>
            <p className="text-sm text-slate-300">
              Heavy Overland Dynamics Platform LS 500 Cabin Acoustic Noise-Inversion Transducer Transfer Function Calibration Bench
            </p>
          </div>
        </div>

        {/* Real-Time Attenuation Scoreboard */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
            <span className="text-sm text-slate-400 font-medium">Harmonic Input</span>
            <div className="text-2xl font-extrabold text-amber-400 font-mono mt-1 tabular-nums">
              {rawNoiseDb.toFixed(1)} dB
            </div>
            <span className="text-sm text-slate-400 mt-1 block">@ {freqHz} Hz Crank Rumble</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
            <span className="text-sm text-slate-400 font-medium">FxLMS Attenuation</span>
            <div className="text-2xl font-extrabold text-emerald-400 font-mono mt-1 tabular-nums">
              {calculatedAttenuation.toFixed(1)} dB
            </div>
            <span className="text-sm text-emerald-400/80 mt-1 block">Active Inversion Loop</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
            <span className="text-sm text-slate-400 font-medium">Executive Quiet Floor</span>
            <div className="text-2xl font-extrabold text-cyan-300 font-mono mt-1 tabular-nums">
              {residualDb.toFixed(1)} dB
            </div>
            <span className="text-sm text-cyan-400/80 mt-1 block">Passenger Ear Level</span>
          </div>
        </div>

        {/* Interactive Calibrations */}
        <div className="mt-6 space-y-5 p-5 bg-slate-950 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              Transfer Function Parameters
            </span>
            <button
              type="button"
              onClick={() => setAntiPhaseActive(!antiPhaseActive)}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                antiPhaseActive
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              {antiPhaseActive ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>{antiPhaseActive ? 'Inversion Active (ON)' : 'Inversion Bypassed (OFF)'}</span>
            </button>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1.5 font-medium">
              <span className="text-slate-300">Crankshaft Harmonic Frequency:</span>
              <span className="font-mono text-amber-400 tabular-nums">{freqHz} Hz</span>
            </div>
            <input
              type="range"
              min="60"
              max="400"
              step="5"
              value={freqHz}
              onChange={(e) => setFreqHz(parseInt(e.target.value, 10))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1.5 font-medium">
              <span className="text-slate-300">Anti-Phase Phase Inversion Angle:</span>
              <span className="font-mono text-cyan-400 tabular-nums">{phaseDegrees}° (Optimal: 180°)</span>
            </div>
            <input
              type="range"
              min="90"
              max="270"
              step="1"
              value={phaseDegrees}
              onChange={(e) => setPhaseDegrees(parseInt(e.target.value, 10))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1.5 font-medium">
              <span className="text-slate-300">Secondary Path Cabin Transit Delay:</span>
              <span className="font-mono text-emerald-400 tabular-nums">{secondaryDelayMs.toFixed(2)} ms</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.05"
              value={secondaryDelayMs}
              onChange={(e) => setSecondaryDelayMs(parseFloat(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Verification Status */}
        <div className="mt-6 p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {calculatedAttenuation <= -15.0 ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-400" />
            )}
            <span className="text-slate-200 font-medium">
              Acoustic Coherence Test: {calculatedAttenuation <= -15.0 ? 'Exceeds Flagship -15 dB Target' : 'Sub-Optimal Inversion'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg text-sm transition-colors cursor-pointer"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
