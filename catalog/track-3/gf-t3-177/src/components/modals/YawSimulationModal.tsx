import React, { useEffect, useState } from 'react';
import { X, Play, RotateCcw, Activity, CheckCircle2, Zap } from 'lucide-react';
import { TelemetryState, RearSteeringPhase } from '../../types/telemetry';

interface YawSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTelemetry: TelemetryState;
  onApplyTelemetry: (partial: Partial<TelemetryState>) => void;
}

export const YawSimulationModal: React.FC<YawSimulationModalProps> = ({
  isOpen,
  onClose,
  currentTelemetry,
  onApplyTelemetry,
}) => {
  const [simSpeed, setSimSpeed] = useState(currentTelemetry.speedKph);
  const [simSteer, setSimSteer] = useState(currentTelemetry.steeringWheelAngleDeg);
  const [simG, setSimG] = useState(currentTelemetry.lateralG);
  const [isSimulatingRun, setIsSimulatingRun] = useState(false);

  // Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Real-time calculations inside modal
  const frontAngle = simSteer / 13.6;
  const isCounter = simSpeed < 80.0;
  const phase: RearSteeringPhase = simSpeed < 77.5 ? 'COUNTER_PHASE' : simSpeed > 82.5 ? 'IN_PHASE' : 'NEUTRAL';
  let rearAngle = 0;
  if (phase === 'COUNTER_PHASE') {
    rearAngle = -1.0 * (frontAngle * 0.024) - (simG * 0.15);
  } else if (phase === 'IN_PHASE') {
    rearAngle = (frontAngle * 0.018) + (simG * 0.28);
  }
  rearAngle = Math.max(-2.0, Math.min(2.0, rearAngle));

  const handleRunSweep = () => {
    setIsSimulatingRun(true);
    let currentV = 30;
    const interval = setInterval(() => {
      currentV += 8;
      setSimSpeed(currentV);
      if (currentV >= 150) {
        clearInterval(interval);
        setIsSimulatingRun(false);
      }
    }, 120);
  };

  const handleApplyToCockpit = () => {
    onApplyTelemetry({
      speedKph: simSpeed,
      steeringWheelAngleDeg: simSteer,
      lateralG: simG,
      rearWheelAngleDeg: parseFloat(rearAngle.toFixed(3)),
      phase,
    });
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-700 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 text-neutral-100 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top-right close button (✕) */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Modal"
          className="absolute top-6 right-6 p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Modal Header */}
        <div className="pr-12">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded bg-amber-500/10 text-amber-400 font-mono font-bold text-base border border-amber-500/30">
              DRS Real-Time Dynamic Yaw Simulation
            </span>
            <span className="px-3 py-1 rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold text-base border border-emerald-500/30">
              Kinematic Bicycle Model
            </span>
          </div>
          <h2 className="text-3xl font-extrabold text-white">
            Simulate DRS Dynamic Yaw & Phase Inversion
          </h2>
          <p className="text-base text-neutral-300 mt-2">
            Sweep vehicle speed across the 80 km/h boundary to observe the transition from counter-phase yaw agility to in-phase lateral stabilization.
          </p>
        </div>

        {/* Interactive Sliders in Modal */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-5 rounded-xl bg-neutral-950 border border-neutral-800">
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-base font-bold text-neutral-200">Speed (km/h)</span>
              <span className="text-2xl font-mono font-extrabold text-amber-400">{simSpeed.toFixed(0)} km/h</span>
            </div>
            <input
              type="range"
              min="10"
              max="200"
              value={simSpeed}
              onChange={(e) => setSimSpeed(parseFloat(e.target.value))}
              className="w-full h-2.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="text-base text-neutral-400 font-mono">
              {simSpeed < 80 ? 'Counter-Phase Zone (<80)' : 'In-Phase Zone (≥80)'}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-base font-bold text-neutral-200">Steering Input</span>
              <span className="text-2xl font-mono font-extrabold text-white">{simSteer.toFixed(0)}°</span>
            </div>
            <input
              type="range"
              min="-360"
              max="360"
              value={simSteer}
              onChange={(e) => setSimSteer(parseFloat(e.target.value))}
              className="w-full h-2.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="text-base text-neutral-400 font-mono">
              Front: {(frontAngle).toFixed(1)}° rack
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-base font-bold text-neutral-200">Lateral Force (G)</span>
              <span className="text-2xl font-mono font-extrabold text-cyan-400">{simG.toFixed(2)} g</span>
            </div>
            <input
              type="range"
              min="-1.0"
              max="1.0"
              step="0.05"
              value={simG}
              onChange={(e) => setSimG(parseFloat(e.target.value))}
              className="w-full h-2.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="text-base text-neutral-400 font-mono">
              Tire cornering load
            </div>
          </div>
        </div>

        {/* Phase Dynamics Visual Curve */}
        <div className="p-6 rounded-xl bg-neutral-950 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-400" />
              <span>Real-Time Actuator Output State</span>
            </div>
            <span className={`px-3 py-1 rounded text-base font-mono font-bold ${
              phase === 'COUNTER_PHASE'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : phase === 'IN_PHASE'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-neutral-800 text-neutral-300'
            }`}>
              {phase === 'COUNTER_PHASE' ? 'COUNTER-PHASE ACTIVE' : phase === 'IN_PHASE' ? 'IN-PHASE ACTIVE' : 'TRANSITION DEADBAND'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-800">
              <div className="text-base text-neutral-400">Rear Steer Angle</div>
              <div className={`text-2xl font-bold font-mono mt-1 ${
                rearAngle < 0 ? 'text-amber-400' : 'text-cyan-400'
              }`}>
                {rearAngle > 0 ? `+${rearAngle.toFixed(2)}°` : `${rearAngle.toFixed(2)}°`}
              </div>
              <div className="text-base text-neutral-400 mt-1">
                {rearAngle < 0 ? 'Opposes front wheels' : 'Parallels front wheels'}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-800">
              <div className="text-base text-neutral-400">Virtual Wheelbase Effect</div>
              <div className="text-2xl font-bold font-mono text-white mt-1">
                {isCounter ? '2,420 mm (-15.7%)' : '3,180 mm (+10.8%)'}
              </div>
              <div className="text-base text-neutral-400 mt-1">
                {isCounter ? 'Tight turning circle' : 'High speed stability'}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-800">
              <div className="text-base text-neutral-400">Side-Slip Angle (β)</div>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                {isCounter ? '1.84° Yaw Gain' : '0.12° (Near Zero)'}
              </div>
              <div className="text-base text-neutral-400 mt-1">
                Body slip eliminated at speed
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-neutral-800">
          <button
            type="button"
            onClick={handleRunSweep}
            disabled={isSimulatingRun}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 font-bold text-base transition-colors cursor-pointer"
          >
            <Play className="w-5 h-5 text-amber-400" />
            <span>{isSimulatingRun ? 'Sweeping Speed...' : 'Simulate 30 -> 150 km/h Sweep'}</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-base transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApplyToCockpit}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-base transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Apply Parameters to Cockpit</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
