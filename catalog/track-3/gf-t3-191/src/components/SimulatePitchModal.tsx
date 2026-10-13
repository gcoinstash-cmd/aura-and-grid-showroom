import React, { useState, useEffect } from 'react';
import { X, Play, RefreshCw, Activity, ArrowDownRight, CheckCircle2, ShieldCheck } from 'lucide-react';

interface SimulatePitchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SimulatePitchModal: React.FC<SimulatePitchModalProps> = ({ isOpen, onClose }) => {
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [comfortMode, setComfortMode] = useState(true);

  // Simulation steps from 80 km/h down to 0 km/h
  const simData = [
    { time: '0.00s', speed: 80, g: 0.00, pitchConv: 0.0, pitchComfort: 0.0, rearBias: 30, rearBar: 0, frontBar: 0 },
    { time: '0.20s', speed: 76, g: 0.25, pitchConv: -1.2, pitchComfort: -0.15, rearBias: 48, rearBar: 24, frontBar: 26 },
    { time: '0.40s', speed: 68, g: 0.55, pitchConv: -2.8, pitchComfort: -0.24, rearBias: 56, rearBar: 61, frontBar: 48 },
    { time: '0.60s', speed: 56, g: 0.65, pitchConv: -3.4, pitchComfort: -0.28, rearBias: 58, rearBar: 75, frontBar: 54 },
    { time: '0.80s', speed: 42, g: 0.65, pitchConv: -3.4, pitchComfort: -0.27, rearBias: 58, rearBar: 75, frontBar: 54 },
    { time: '1.00s', speed: 28, g: 0.60, pitchConv: -3.1, pitchComfort: -0.25, rearBias: 57, rearBar: 68, frontBar: 51 },
    { time: '1.20s', speed: 14, g: 0.45, pitchConv: -2.2, pitchComfort: -0.18, rearBias: 52, rearBar: 46, frontBar: 42 },
    { time: '1.40s', speed: 2, g: 0.20, pitchConv: -0.9, pitchComfort: -0.08, rearBias: 48, rearBar: 19, frontBar: 20 },
    { time: '1.55s', speed: 0, g: 0.00, pitchConv: 0.0, pitchComfort: 0.0, rearBias: 30, rearBar: 0, frontBar: 0 },
  ];

  useEffect(() => {
    if (!simulationRunning) return;

    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= simData.length - 1) {
          setSimulationRunning(false);
          return prev;
        }
        return prev + 1;
      });
    }, 280);

    return () => clearInterval(timer);
  }, [simulationRunning]);

  if (!isOpen) return null;

  const current = simData[currentStep];
  const activePitch = comfortMode ? current.pitchComfort : current.pitchConv;

  const startSim = () => {
    setCurrentStep(0);
    setSimulationRunning(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold text-xs font-mono uppercase bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                2,500 Hz Ingestion Loop
              </span>
              <h2 className="text-xl font-bold text-white">
                Braking Pitch Elimination Simulation
              </h2>
            </div>
            <p className="text-slate-400 text-sm mt-0.5">
              Comparative analysis: Conventional 70/30 braking vs GF-T3-191 Rear-Biased comfort posture.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="py-4 space-y-5 overflow-y-auto pr-1">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-4">
              <button
                onClick={startSim}
                disabled={simulationRunning}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm px-4 py-2 rounded-lg inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-md disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{simulationRunning ? 'Simulating Stop...' : 'Run 80 km/h Decel Test'}</span>
              </button>

              <button
                onClick={() => {
                  setCurrentStep(0);
                  setSimulationRunning(false);
                }}
                className="text-slate-400 hover:text-white text-xs font-mono inline-flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset
              </button>
            </div>

            {/* Mode Selector */}
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-slate-400">Posture Algorithm:</span>
              <button
                onClick={() => setComfortMode(true)}
                className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-colors ${
                  comfortMode ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'text-slate-400 hover:text-white'
                }`}
              >
                GF-T3-191 Rear Comfort
              </button>
              <button
                onClick={() => setComfortMode(false)}
                className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-colors ${
                  !comfortMode ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'text-slate-400 hover:text-white'
                }`}
              >
                Conventional 70/30 (Nose-Dive)
              </button>
            </div>
          </div>

          {/* Live Telemetry Display */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-sm">
            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
              <span className="text-slate-500 text-xs uppercase">Speed</span>
              <div className="text-2xl font-black text-white">{current.speed} km/h</div>
              <span className="text-xs text-slate-400">Elapsed: {current.time}</span>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
              <span className="text-slate-500 text-xs uppercase">Decel Force</span>
              <div className="text-2xl font-black text-amber-400">{current.g.toFixed(2)} G</div>
              <span className="text-xs text-slate-400">Peak target: 0.65G</span>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
              <span className="text-slate-500 text-xs uppercase">Pitch Angle</span>
              <div className={`text-2xl font-black ${comfortMode ? 'text-emerald-400' : 'text-red-400'}`}>
                {activePitch.toFixed(2)}°
              </div>
              <span className="text-xs text-slate-400">{comfortMode ? 'Flat Posture' : 'Severe Dive'}</span>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
              <span className="text-slate-500 text-xs uppercase">Hydraulic Rear Bias</span>
              <div className="text-2xl font-black text-blue-400">{comfortMode ? `${current.rearBias}%` : '30%'}</div>
              <span className="text-xs text-slate-400">Line: {comfortMode ? current.rearBar : 22} bar</span>
            </div>
          </div>

          {/* Graphical Tilt Visualization */}
          <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center relative overflow-hidden">
            <div className="text-xs font-mono text-slate-500 mb-2">
              REAL-TIME CHASSIS PITCH INCLINATION ({activePitch.toFixed(2)}°)
            </div>

            {/* Horizontal level line */}
            <div className="w-full border-b border-dashed border-slate-800 my-4" />

            {/* Rotating chassis beam */}
            <div
              className="mx-auto w-3/4 h-3 bg-gradient-to-r from-red-500 via-amber-400 to-emerald-400 rounded-full transition-transform duration-200 shadow-lg"
              style={{ transform: `rotate(${activePitch * 3.5}deg)` }}
            />

            <div className="flex justify-between items-center text-xs font-mono text-slate-500 mt-5 px-8">
              <span className="text-red-400">FRONT AXLE (Dive)</span>
              <span className="text-slate-400">CG FULCRUM</span>
              <span className="text-emerald-400">REAR AXLE (Squat Pull)</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400 font-mono">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            91.8% Peak Pitch Suppression Confirmed
          </span>
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2 rounded-lg cursor-pointer transition-colors"
          >
            Close Simulator
          </button>
        </div>
      </div>
    </div>
  );
};
