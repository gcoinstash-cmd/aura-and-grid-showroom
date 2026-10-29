/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Track 2 Sovereign Flagship Steer-by-Wire Core (GF-T3-174)
 * Steer-by-Wire Simulation Scenario Modal
 */

import React, { useEffect } from 'react';
import { X, Play, RotateCcw, Activity, ShieldCheck } from 'lucide-react';

interface SimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScenario: (scenario: 'parking' | 'highway' | 'evasive' | 'crosswind') => void;
  activeScenario: string | null;
}

export const SimulationModal: React.FC<SimulationModalProps> = ({
  isOpen,
  onClose,
  onSelectScenario,
  activeScenario,
}) => {
  // Escape key listener for instant dismissal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="simulation-modal-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 md:p-8 shadow-2xl text-slate-100 flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <Activity className="h-6 w-6 text-amber-400" />
              <h3 id="simulation-modal-title" className="text-xl md:text-2xl font-bold text-white">
                Simulate Steer-by-Wire Input Scenario
              </h3>
            </div>
            {/* Prominent, high-contrast close button */}
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors bg-slate-800/80 border border-slate-700 cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <p className="mt-4 text-base text-slate-300">
            Select an automotive verification maneuver to simulate live kinematic input across the 1000 Hz CAN-FD bus. Observe real-time speed-adaptive variable ratios and discrete Kalman yaw damping:
          </p>

          <div className="mt-6 space-y-3.5">
            {/* Scenario 1 */}
            <div
              onClick={() => onSelectScenario('parking')}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                activeScenario === 'parking'
                  ? 'border-amber-500 bg-amber-500/15 shadow-md'
                  : 'border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-white">
                  1. Low-Speed U-Turn Parking (Full 150° Lock-to-Lock)
                </span>
                <span className="rounded bg-amber-500/20 px-2 py-0.5 text-sm font-mono text-amber-300 font-semibold">
                  8 km/h · 6.50:1 Ratio
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-300">
                Demonstrates 150° yoke rotation achieving maximum 38° road-wheel angle with zero hand-over-hand turning.
              </p>
            </div>

            {/* Scenario 2 */}
            <div
              onClick={() => onSelectScenario('highway')}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                activeScenario === 'highway'
                  ? 'border-cyan-500 bg-cyan-500/15 shadow-md'
                  : 'border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-white">
                  2. High-Speed Highway Gentle Slalom
                </span>
                <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-sm font-mono text-cyan-300 font-semibold">
                  125 km/h · 14.80:1 Ratio
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-300">
                High-speed ratio dampening eliminates nervous steering inputs; active yaw damping prevents body sway.
              </p>
            </div>

            {/* Scenario 3 */}
            <div
              onClick={() => onSelectScenario('evasive')}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                activeScenario === 'evasive'
                  ? 'border-indigo-500 bg-indigo-500/15 shadow-md'
                  : 'border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-white">
                  3. ISO 3888-2 Emergency Obstacle Evasion (Elk Test)
                </span>
                <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-sm font-mono text-indigo-300 font-semibold">
                  72 km/h · 11.20:1 Ratio
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-300">
                Rapid oscillatory steering inputs with heavy self-aligning counter-torque (up to 7.8 Nm) preventing spinout.
              </p>
            </div>

            {/* Scenario 4 */}
            <div
              onClick={() => onSelectScenario('crosswind')}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                activeScenario === 'crosswind'
                  ? 'border-emerald-500 bg-emerald-500/15 shadow-md'
                  : 'border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-white">
                  4. Strong Crosswind Lateral Yaw Rejection
                </span>
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-sm font-mono text-emerald-300 font-semibold">
                  100 km/h · Kalman Correction
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-300">
                Kalman observer detects lateral acceleration error and synthesizes stabilizing micro-steering correction.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-800 shrink-0">
          <button
            onClick={onClose}
            className="rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            Close & View Cockpit
          </button>
        </div>
      </div>
    </div>
  );
};
