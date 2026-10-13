/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Lexus RZ 450e Steer-by-Wire Precision Core (GF-T3-174)
 * Tab 1: Steer-by-Wire & Yaw Control Core Implementation
 */

import React, { useState } from 'react';
import { Copy, Check, Play, Cpu, Code2, BookOpen, Layers } from 'lucide-react';
import { PYTHON_SBW_CORE_CODE, calculateSbwCycle } from '../../data/pythonImplementation';

export const TabYawControlCore: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [testYokeDeg, setTestYokeDeg] = useState(45.0);
  const [testSpeedKmh, setTestSpeedKmh] = useState(65.0);
  const [testResult, setTestResult] = useState<any>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(PYTHON_SBW_CORE_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunExecution = () => {
    const res = calculateSbwCycle(testYokeDeg, testYokeDeg + 0.012, testSpeedKmh, 'asphalt');
    setTestResult(res);
  };

  return (
    <div className="space-y-8">
      {/* Overview header */}
      <div>
        <div className="flex items-center gap-2">
          <Cpu className="h-6 w-6 text-amber-400" />
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">
            Tab 1: Steer-by-Wire & Yaw Control Core (Pure Python 3.12)
          </h2>
        </div>
        <p className="mt-2 text-base text-slate-300">
          Production-grade, zero-placeholder controller implementing speed-adaptive 150° lock-to-lock variable ratio steering, cross-channel divergence health monitors, and active yaw-rate damping feedback loops with discrete Kalman filtering.
        </p>
      </div>

      {/* Mathematical Formulations Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-400">
            <Layers className="h-5 w-5" />
            <h3 className="text-base font-bold text-white uppercase tracking-wider">
              1. Sigmoidal Variable Ratio
            </h3>
          </div>
          <div className="bg-slate-950 p-3 rounded border border-slate-800 font-mono text-sm text-cyan-300 overflow-x-auto">
            R(v) = R_park + (R_hwy - R_park) / (1 + exp(-κ·(v - v0)))
          </div>
          <p className="text-sm text-slate-300">
            Smoothly transitions from 6.50:1 (parking 150° full lock) to 14.80:1 (highway stability) around 50 km/h midpoint.
          </p>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-5 space-y-3">
          <div className="flex items-center gap-2 text-cyan-400">
            <BookOpen className="h-5 w-5" />
            <h3 className="text-base font-bold text-white uppercase tracking-wider">
              2. Discrete Kalman Observer
            </h3>
          </div>
          <div className="bg-slate-950 p-3 rounded border border-slate-800 font-mono text-sm text-cyan-300 overflow-x-auto">
            x̂_k = Ad·x̂_(k-1) + Bd·u + K_k·(z_k - H·x̂_pred)
          </div>
          <p className="text-sm text-slate-300">
            2-DOF bicycle state-space model predicting vehicle sideslip β and yaw rate r at 1000 Hz CAN-FD loop.
          </p>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-5 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400">
            <Play className="h-5 w-5" />
            <h3 className="text-base font-bold text-white uppercase tracking-wider">
              3. ASIL-D Consensus Voting
            </h3>
          </div>
          <div className="bg-slate-950 p-3 rounded border border-slate-800 font-mono text-sm text-cyan-300 overflow-x-auto">
            Δθ = |θ_A - θ_B| ≤ 0.05° (Nominal ASIL-D)
          </div>
          <p className="text-sm text-slate-300">
            Dual-channel cross-monitoring between TMR Hall resolver and optical inductive encoder with fail-operational degradation.
          </p>
        </div>
      </div>

      {/* Interactive In-Browser Controller Execution Bench */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Play className="h-5 w-5 text-amber-400" />
            Live Mathematical Engine Execution Bench
          </h3>
          <span className="text-sm font-mono text-slate-400">Pure Python 3.12 Emulation</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1">
              Yoke Angle θ_yoke (-150° to +150°):
            </label>
            <input
              type="number"
              value={testYokeDeg}
              onChange={(e) => setTestYokeDeg(parseFloat(e.target.value) || 0)}
              className="w-full rounded bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1">
              Vehicle Speed v (km/h):
            </label>
            <input
              type="number"
              value={testSpeedKmh}
              onChange={(e) => setTestSpeedKmh(parseFloat(e.target.value) || 0)}
              className="w-full rounded bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white font-mono"
            />
          </div>

          <div>
            <button
              onClick={handleRunExecution}
              className="w-full flex items-center justify-center gap-2 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 text-sm font-bold transition-colors cursor-pointer"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>Execute 1kHz Cycle</span>
            </button>
          </div>
        </div>

        {testResult && (
          <div className="mt-4 rounded-lg bg-slate-950 p-4 border border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-mono">
            <div>
              <span className="text-slate-400 block">Effective Ratio R(v):</span>
              <span className="text-base font-bold text-cyan-400">{testResult.effectiveRatio}:1</span>
            </div>
            <div>
              <span className="text-slate-400 block">Road Wheel θ_road:</span>
              <span className="text-base font-bold text-amber-400">{testResult.roadWheelAngleDeg}°</span>
            </div>
            <div>
              <span className="text-slate-400 block">Feedback Torque T_fb:</span>
              <span className="text-base font-bold text-emerald-400">{testResult.feedbackTorqueNm} Nm</span>
            </div>
            <div>
              <span className="text-slate-400 block">Consensus Status:</span>
              <span className="text-base font-bold text-emerald-400">{testResult.status}</span>
            </div>
          </div>
        )}
      </div>

      {/* Code Inspector with Copy to Clipboard */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 overflow-hidden">
        <div className="flex items-center justify-between bg-slate-900 px-6 py-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-amber-400" />
            <span className="font-mono text-sm font-semibold text-slate-200">
              steer_by_wire_core.py (Python 3.12 Engine)
            </span>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-2 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3.5 py-1.5 text-sm font-medium text-slate-200 transition-colors cursor-pointer"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy Python Source'}</span>
          </button>
        </div>

        <pre className="p-6 text-sm font-mono text-slate-200 overflow-x-auto max-h-[600px] leading-relaxed">
          <code>{PYTHON_SBW_CORE_CODE}</code>
        </pre>
      </div>
    </div>
  );
};
