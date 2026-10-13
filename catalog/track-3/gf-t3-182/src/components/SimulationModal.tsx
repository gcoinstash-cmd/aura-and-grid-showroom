import React, { useState, useEffect } from 'react';
import { X, Play, Pause, RotateCcw, Activity, Wind, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { computeAeroState } from '../utils/aeroCalculations';

interface SimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SimStep {
  timeSec: number;
  segmentName: string;
  speedKmh: number;
  lateralG: number;
  longitudinalG: number;
  yawRateDegS: number;
}

const TRACK_PROFILE: SimStep[] = [
  { timeSec: 0.0, segmentName: 'Straight Acceleration', speedKmh: 160, lateralG: 0.0, longitudinalG: 0.6, yawRateDegS: 0.0 },
  { timeSec: 1.0, segmentName: 'DRS Low-Drag Activation', speedKmh: 220, lateralG: 0.0, longitudinalG: 0.5, yawRateDegS: 0.0 },
  { timeSec: 2.0, segmentName: 'V-Max Main Straight', speedKmh: 285, lateralG: 0.0, longitudinalG: 0.3, yawRateDegS: 0.0 },
  { timeSec: 3.0, segmentName: 'Peak V-Max High-Speed', speedKmh: 305, lateralG: 0.0, longitudinalG: 0.1, yawRateDegS: 0.0 },
  { timeSec: 4.0, segmentName: 'Threshold Braking Airbrake', speedKmh: 250, lateralG: 0.0, longitudinalG: -1.45, yawRateDegS: 0.0 },
  { timeSec: 5.0, segmentName: 'Airbrake Rapid Deceleration', speedKmh: 175, lateralG: 0.0, longitudinalG: -1.2, yawRateDegS: 0.0 },
  { timeSec: 6.0, segmentName: 'Chicane Turn-In Torque Vectoring', speedKmh: 135, lateralG: 1.6, longitudinalG: -0.2, yawRateDegS: 22.0 },
  { timeSec: 7.0, segmentName: 'Mid-Apex Aerodynamic Load', speedKmh: 120, lateralG: 1.75, longitudinalG: 0.0, yawRateDegS: 18.0 },
  { timeSec: 8.0, segmentName: 'Corner Exit Power Down', speedKmh: 155, lateralG: 0.8, longitudinalG: 0.7, yawRateDegS: 6.0 }
];

export const SimulationModal: React.FC<SimulationModalProps> = ({ isOpen, onClose }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen && isPlaying) {
      timer = setInterval(() => {
        setStepIndex((prev) => (prev + 1) % TRACK_PROFILE.length);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen, isPlaying]);

  if (!isOpen) return null;

  const currentStep = TRACK_PROFILE[stepIndex];
  const aero = computeAeroState(
    currentStep.speedKmh,
    currentStep.lateralG,
    currentStep.longitudinalG,
    currentStep.yawRateDegS,
    1000400 + stepIndex,
    'a4f89d34201bc7e829370129bc65ef3190847291a1829038472918237492aef1'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-xl font-bold text-white">Dynamic Downforce Vectoring Simulation</h3>
              <p className="text-sm text-slate-400">Fuji Speedway Sector 1: Straightaway &rarr; Dunlop Chicane Entry</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-950 border border-slate-800 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors cursor-pointer"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isPlaying ? 'Pause Dynamic Run' : 'Start Simulation'}</span>
              </button>

              <button
                onClick={() => { setStepIndex(0); setIsPlaying(false); }}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset</span>
              </button>
            </div>

            <div className="flex items-center gap-4 text-sm font-mono">
              <span className="text-slate-400">Sector Elapsed:</span>
              <span className="text-cyan-400 font-bold text-base">T+{currentStep.timeSec.toFixed(1)}s</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-300 font-semibold">{currentStep.segmentName}</span>
            </div>
          </div>

          {/* Stepper Timeline */}
          <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5">
            {TRACK_PROFILE.map((step, idx) => (
              <button
                key={idx}
                onClick={() => setStepIndex(idx)}
                className={`p-2 rounded border text-center transition-colors cursor-pointer ${
                  idx === stepIndex
                    ? 'bg-cyan-950 border-cyan-500 text-cyan-200 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="text-sm font-mono">{idx}s</div>
                <div className="text-sm truncate">{step.speedKmh} km/h</div>
              </button>
            ))}
          </div>

          {/* Live Telemetry Readout Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-950 border border-slate-800 p-5 rounded-lg">
            <div>
              <div className="text-sm font-mono text-slate-400">Total Downforce</div>
              <div className="text-2xl font-bold font-mono text-cyan-400 tabular-nums">
                {aero.totalDownforceN.toLocaleString()} N
              </div>
              <div className="text-sm text-slate-400">{Math.round(aero.totalDownforceN / 9.80665)} kgf</div>
            </div>

            <div>
              <div className="text-sm font-mono text-slate-400">Left Flap AoA</div>
              <div className="text-2xl font-bold font-mono text-white tabular-nums">
                {aero.leftFlapAoADeg}°
              </div>
              <div className="text-sm text-slate-400">Left Wing Flap Angle</div>
            </div>

            <div>
              <div className="text-sm font-mono text-slate-400">Right Flap AoA</div>
              <div className="text-2xl font-bold font-mono text-white tabular-nums">
                {aero.rightFlapAoADeg}°
              </div>
              <div className="text-sm text-slate-400">Right Wing Flap Angle</div>
            </div>

            <div>
              <div className="text-sm font-mono text-slate-400">Operating Mode</div>
              <div className="text-lg font-bold font-mono text-emerald-400 truncate">
                {aero.stateMode}
              </div>
              <div className="text-sm text-slate-400">
                {aero.airbrakeActive ? 'AIRBRAKE SPIKE' : 'STABLE VECTORING'}
              </div>
            </div>
          </div>

          {/* Dynamic Vectoring Explanation */}
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-lg text-sm text-slate-300">
            <div className="font-semibold text-white mb-1">Active Vectoring State Analysis:</div>
            {aero.airbrakeActive ? (
              <p className="text-rose-300">
                Threshold braking detected ({currentStep.longitudinalG}G). Airbrake logic engaged: dual carbon wing flaps pitched to maximum +35.0°, generating {aero.dragForceN} N of deceleration drag and locking the rear axle downforce to eliminate high-speed rear lift.
              </p>
            ) : aero.stateMode === 'CORNERING_VECTORING' ? (
              <p className="text-amber-300">
                High lateral cornering load ({currentStep.lateralG}G, yaw rate {currentStep.yawRateDegS}°/s). Active differential trimming engaged: Left flap at {aero.leftFlapAoADeg}° vs Right flap at {aero.rightFlapAoADeg}°, producing aerodynamic restoring torque and canceling body roll.
              </p>
            ) : aero.stateMode === 'LOW_DRAG_DRS' ? (
              <p className="text-emerald-300">
                High-speed straightaway DRS mode active at {currentStep.speedKmh} km/h: Wing flaps flattened to -3.5° AoA to reduce aerodynamic parasitic drag by 28% and maximize terminal straight speed.
              </p>
            ) : (
              <p className="text-slate-300">
                Nominal high-downforce track mode: balanced 39% front / 61% rear aerodynamic distribution providing planted turn-in stability.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Close Simulation
          </button>
        </div>

      </div>
    </div>
  );
};
