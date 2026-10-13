/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Play, RefreshCw, CheckCircle2, Sliders, ArrowRight } from 'lucide-react';
import { KinematicsState } from '../types/telemetry';

interface SimulateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyAndNavigate: (speed: number, steerAngle: number) => void;
}

export const SimulateModal: React.FC<SimulateModalProps> = ({
  isOpen,
  onClose,
  onApplyAndNavigate,
}) => {
  const [selectedSpeed, setSelectedSpeed] = useState<number>(15);
  const [selectedSteer, setSelectedSteer] = useState<number>(360);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400 border border-amber-500/20">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <h3 className="text-xl font-black text-white">Simulate DRS Kinematics</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-base text-slate-300 leading-relaxed">
          Select a test profile to compute dynamic rear toe deflection (±4.0°) and DIRECT4 torque distribution across the active chassis:
        </p>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => {
              setSelectedSpeed(15);
              setSelectedSteer(420);
            }}
            className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer ${
              selectedSpeed === 15
                ? 'bg-amber-500/10 border-amber-500 text-white'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="flex justify-between font-bold text-base">
              <span>Low-Speed Tight U-Turn (15 mph)</span>
              <span className="text-amber-400 font-mono">-3.95° Counter-Phase</span>
            </div>
            <span className="text-base text-slate-400">
              Curb radius reduced by 1.8 ft; 75:25 front launch torque
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedSpeed(78);
              setSelectedSteer(60);
            }}
            className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer ${
              selectedSpeed === 78
                ? 'bg-cyan-500/10 border-cyan-500 text-white'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="flex justify-between font-bold text-base">
              <span>High-Speed Interstate Swerve (78 mph)</span>
              <span className="text-cyan-400 font-mono">+2.30° In-Phase</span>
            </div>
            <span className="text-base text-slate-400">
              Zero body side-slip angle (β → 0°); 20:80 rear eAxle vectoring
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedSpeed(50);
              setSelectedSteer(120);
            }}
            className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer ${
              selectedSpeed === 50
                ? 'bg-purple-500/10 border-purple-500 text-white'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="flex justify-between font-bold text-base">
              <span>Phase Shift Boundary Transition (50 mph)</span>
              <span className="text-purple-400 font-mono">0.00° Neutral Hand-off</span>
            </div>
            <span className="text-base text-slate-400">
              Harmonic transition threshold between agility and stability
            </span>
          </button>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-base text-slate-400 hover:text-white font-medium cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onApplyAndNavigate(selectedSpeed, selectedSteer);
              onClose();
            }}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-base rounded-xl inline-flex items-center gap-2 cursor-pointer shadow-md"
          >
            <span>Load into Kinematics Core</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
