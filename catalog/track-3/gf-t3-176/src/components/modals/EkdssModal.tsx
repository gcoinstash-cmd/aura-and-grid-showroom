import React, { useEffect, useState } from 'react';
import { X, Sliders, ShieldCheck, Activity, Gauge } from 'lucide-react';

interface EkdssModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EkdssModal: React.FC<EkdssModalProps> = ({ isOpen, onClose }) => {
  const [crossAxleInches, setCrossAxleInches] = useState<number>(21.4);
  const [hydraulicPressureMpa, setHydraulicPressureMpa] = useState<number>(14.2);
  const [inclineDeg, setInclineDeg] = useState<number>(24.0);

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
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isDecoupled = crossAxleInches > 5.0;
  const rollStiffness = isDecoupled ? 12600 : 45000;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <Sliders className="w-6 h-6 text-amber-400" />
            <div>
              <h3 className="text-2xl font-bold text-white">
                Simulate Dynamic Kinetic Suspension Telemetry Articulation & Hydraulic Solenoid Slew
              </h3>
              <p className="text-[15px] text-neutral-400 mt-0.5">
                Dynamic stabilizer decoupling test harness for Apex Executive
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Live Articulation Visual Canvas */}
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 text-center space-y-4">
          <div className="flex flex-wrap items-center justify-between text-base font-mono text-neutral-400 gap-2">
            <span>RAMP TRAVEL INDEX (RTI): <strong className="text-emerald-400 num-tabular">685</strong></span>
            <span>VALVE SLEW LATENCY: <strong className="text-white num-tabular">3.8 ms</strong></span>
            <span>HYDRAULIC STATUS: <strong className="text-sky-400">DUAL-CIRCUIT NOMINAL</strong></span>
          </div>

          <div className="relative py-8">
            <div className="flex justify-around items-end h-48 border-b-2 border-neutral-700 pb-2">
              {/* Left Wheel */}
              <div className="flex flex-col items-center">
                <span className="text-base font-mono font-bold text-amber-400 mb-2">
                  FL: +{(crossAxleInches / 2).toFixed(1)}"
                </span>
                <div
                  className="w-18 bg-neutral-800 border-2 border-amber-400 rounded-t-xl transition-all duration-300"
                  style={{ height: `${60 + crossAxleInches * 3}px` }}
                />
                <span className="text-base text-neutral-300 mt-2 font-mono font-medium">FRONT-LEFT</span>
              </div>

              {/* Center Decoupled Stabilizer Bar Hydraulic Link */}
              <div className="flex flex-col items-center justify-center space-y-2 mb-10">
                <div className={`px-5 py-2.5 rounded-xl border text-base font-mono font-bold transition-all ${
                  isDecoupled
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-blue-500/20 border-blue-500 text-blue-300'
                }`}>
                  {isDecoupled ? 'Dynamic Kinetic Suspension Telemetry VALVE OPEN (FREE BYPASS)' : 'Dynamic Kinetic Suspension Telemetry VALVE CLOSED (RIGID)'}
                </div>
                <div className="text-base text-neutral-300 font-mono">
                  Roll Stiffness: <strong className="text-white">{rollStiffness.toLocaleString()} Nm/rad</strong>
                </div>
              </div>

              {/* Right Wheel */}
              <div className="flex flex-col items-center">
                <span className="text-base font-mono font-bold text-amber-400 mb-2">
                  FR: -{(crossAxleInches / 2).toFixed(1)}"
                </span>
                <div
                  className="w-18 bg-neutral-800 border-2 border-amber-400 rounded-t-xl transition-all duration-300"
                  style={{ height: `${Math.max(20, 100 - crossAxleInches * 2)}px` }}
                />
                <span className="text-base text-neutral-300 mt-2 font-mono font-medium">FRONT-RIGHT</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sliders in Modal */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-base">
              <span className="text-neutral-300 font-medium">Cross-Axle Travel:</span>
              <span className="font-mono font-bold text-amber-400 num-tabular">{crossAxleInches.toFixed(1)}"</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="24.5"
              step="0.5"
              value={crossAxleInches}
              onChange={(e) => setCrossAxleInches(parseFloat(e.target.value))}
              className="w-full h-2.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <span className="text-base text-neutral-400 block">0.0" to 24.5" Full Travel</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-base">
              <span className="text-neutral-300 font-medium">Accumulator Pressure:</span>
              <span className="font-mono font-bold text-sky-400 num-tabular">{hydraulicPressureMpa.toFixed(1)} MPa</span>
            </div>
            <input
              type="range"
              min="8.0"
              max="20.0"
              step="0.2"
              value={hydraulicPressureMpa}
              onChange={(e) => setHydraulicPressureMpa(parseFloat(e.target.value))}
              className="w-full h-2.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
            <span className="text-base text-neutral-400 block">Nominal: 14.2 MPa</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-base">
              <span className="text-neutral-300 font-medium">Terrain Gradient Incline:</span>
              <span className="font-mono font-bold text-emerald-400 num-tabular">{inclineDeg}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="45"
              step="1"
              value={inclineDeg}
              onChange={(e) => setInclineDeg(parseFloat(e.target.value))}
              className="w-full h-2.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <span className="text-base text-neutral-400 block">Off-Camber Angle</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end pt-4 border-t border-neutral-800">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-base rounded-xl transition-colors cursor-pointer"
          >
            Dismiss Simulation
          </button>
        </div>
      </div>
    </div>
  );
};
