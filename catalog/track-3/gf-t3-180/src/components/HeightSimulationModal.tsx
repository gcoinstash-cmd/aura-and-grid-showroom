import React, { useState } from 'react';
import { X, Sliders, ArrowUp, ArrowDown, Activity, Check, Gauge } from 'lucide-react';
import { RideHeightMode } from '../types/cockpit';

interface HeightSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMode: RideHeightMode;
  onSelectMode: (mode: RideHeightMode) => void;
}

export const HeightSimulationModal: React.FC<HeightSimulationModalProps> = ({
  isOpen,
  onClose,
  currentMode,
  onSelectMode,
}) => {
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationProgress, setCalibrationProgress] = useState(100);

  if (!isOpen) return null;

  const handleModeChange = (mode: RideHeightMode) => {
    setIsCalibrating(true);
    setCalibrationProgress(20);
    onSelectMode(mode);

    setTimeout(() => setCalibrationProgress(60), 300);
    setTimeout(() => {
      setCalibrationProgress(100);
      setIsCalibrating(false);
    }, 700);
  };

  const modes: { id: RideHeightMode; name: string; delta: string; desc: string }[] = [
    { id: 'LOW', name: 'Low / Ingress', delta: '-1.2″ (-30mm)', desc: 'Hydraulic accumulator return line vented for luxury curb egress' },
    { id: 'NORMAL', name: 'Normal Core', delta: '0.0″ (0mm)', desc: 'Standard 8.3-inch running ground clearance baseline' },
    { id: 'COMFORT', name: 'Ultra Luxury Executive', delta: '+0.4″ (+10mm)', desc: 'Soft damping step 3, cross-linked float calibration' },
    { id: 'SPORT_PLUS', name: 'Sport S+ Dynamic', delta: '-0.8″ (-20mm)', desc: 'Firm damping step 15, aerodynamic anti-pitch stance' },
    { id: 'HIGH1', name: 'High 1 Rough Trail', delta: '+1.2″ (+30mm)', desc: 'Intermediate articulation for graded terrain up to 30 MPH' },
    { id: 'HIGH2', name: 'High 2 Apex Obstacle', delta: '+2.8″ (+71mm)', desc: 'Maximum 11.1-inch obstacle clearance with full pump boost' },
    { id: 'ROCK', name: 'Rock Crawl Articulate', delta: '+2.4″ (+61mm)', desc: 'Cross-axle valve decoupling for maximum wheel travel' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                AHC Electro-Hydraulic Height Simulation Bench
              </h3>
              <p className="text-[15px] text-slate-400">
                Lexus 4-Wheel Active Height Control displacement &amp; accumulator calibration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Leveling Calibration Progress */}
        <div className="mb-5 p-4 bg-slate-950/80 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center text-[15px] mb-2">
            <span className="text-slate-300 font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              {isCalibrating ? 'Electro-Hydraulic Leveling in Progress...' : 'Suspension Stance Locked & Stabilized'}
            </span>
            <span className="font-mono text-amber-400 font-bold">{calibrationProgress}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${calibrationProgress}%` }}
            ></div>
          </div>
        </div>

        {/* Height Mode Selectors */}
        <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
          {modes.map((m) => {
            const isSelected = currentMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => handleModeChange(m.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500 ring-1 ring-amber-500/40 text-white'
                    : 'bg-slate-950/50 border-slate-800 hover:bg-slate-800/60 text-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[16px] font-bold text-white">{m.name}</span>
                    <span className="px-2 py-0.5 rounded text-[15px] font-mono font-bold bg-slate-800 text-amber-400 border border-slate-700">
                      {m.delta}
                    </span>
                  </div>
                  <p className="text-[15px] text-slate-400 mt-0.5">{m.desc}</p>
                </div>

                <div className="shrink-0">
                  {isSelected ? (
                    <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </span>
                  ) : (
                    <div className="w-6 h-6 rounded-full border border-slate-700"></div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[15px] text-slate-400 font-mono">
            Working Pressure: <span className="text-white font-bold">18.5 MPa Max Relief</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[15px] font-semibold cursor-pointer transition-colors"
          >
            Close Bench
          </button>
        </div>
      </div>
    </div>
  );
};
