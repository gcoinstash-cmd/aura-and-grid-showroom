import React from 'react';
import { VectorIndexEngine } from '../engine/vectorEngine';
import { AlertTriangle, RotateCcw, Activity, ShieldCheck, Flame, Compass } from 'lucide-react';

interface CentroidDriftTabProps {
  engine: VectorIndexEngine;
  onSimulateDrift: () => void;
  onRecalibrate: () => void;
}

export const CentroidDriftTab: React.FC<CentroidDriftTabProps> = ({
  engine,
  onSimulateDrift,
  onRecalibrate,
}) => {
  const stats = engine.getCodebookStats();
  const driftMagnitude = Math.abs(engine.driftOffset);
  const isDrifting = driftMagnitude > 0.001;

  // Theoretical estimated recall given current drift
  const estimatedRecall = Math.max(52.0, Number((98.4 - driftMagnitude * 120.0).toFixed(1)));
  const quantizationRmsError = Number((0.042 + driftMagnitude * 1.85).toFixed(4));

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Top Banner Warning or Nominal Notice */}
      <div
        className={
          'p-5 rounded-lg border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ' +
          (isDrifting
            ? 'bg-amber-950/20 border-amber-800/80 text-amber-200'
            : 'bg-emerald-950/20 border-emerald-800/80 text-emerald-200')
        }
      >
        <div className="flex items-center gap-3">
          {isDrifting ? (
            <Flame className="h-6 w-6 text-amber-400 shrink-0" />
          ) : (
            <ShieldCheck className="h-6 w-6 text-emerald-400 shrink-0" />
          )}
          <div>
            <h2 className="text-base font-bold">
              {isDrifting
                ? 'Centroid Codebook Drift Detected'
                : 'Codebook Manifold Calibration Nominal'}
            </h2>
            <div className="text-sm opacity-90 mt-0.5">
              {isDrifting
                ? 'Voronoi centroids displaced by delta = ' + engine.driftOffset.toFixed(3) + ' units. Re-quantization error elevated.'
                : 'Zero drift detected. Voronoi codebook centroids aligned with current synthetic vector distribution.'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onSimulateDrift}
            className="min-h-[44px] px-5 py-2.5 text-base font-bold flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <AlertTriangle className="h-4 w-4" />
            <span>Inject +0.08 Centroid Drift</span>
          </button>

          {isDrifting && (
            <button
              onClick={onRecalibrate}
              className="min-h-[44px] px-5 py-2.5 text-base font-bold flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Re-calibrate & Align Codebook</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-slate-800 bg-[#090D18] p-4">
          <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
            <span>Drift Displacement (RMS)</span>
            <Compass className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-amber-400">
            {stats.driftRmsError}
          </div>
          <div className="text-sm text-slate-400 mt-1">Offset: {engine.driftOffset.toFixed(3)}</div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-[#090D18] p-4">
          <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
            <span>Degraded Recall@10</span>
            <Activity className="h-4 w-4 text-cyan-400" />
          </div>
          <div className={'text-3xl font-bold font-mono ' + (isDrifting ? 'text-amber-400' : 'text-emerald-400')}>
            {estimatedRecall}%
          </div>
          <div className="text-sm text-slate-400 mt-1">Baseline: 98.4%</div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-[#090D18] p-4">
          <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
            <span>Quantization RMS Error</span>
            <AlertTriangle className="h-4 w-4 text-violet-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-slate-100">
            {quantizationRmsError}
          </div>
          <div className="text-sm text-slate-400 mt-1">L2 Distortion Bound</div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-[#090D18] p-4">
          <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
            <span>Codebook Entropy</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-slate-100">
            {stats.codebookEntropy} <span className="text-base text-slate-400">bits</span>
          </div>
          <div className="text-sm text-slate-400 mt-1">Max: 8.00 bits (256 bins)</div>
        </div>
      </div>

      {/* Degradation Model Matrix & Synthetic Drift Simulator Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-slate-800 bg-[#090D18] p-5">
          <h3 className="text-base font-bold text-slate-100 border-b border-slate-800 pb-3 mb-4">
            Recall Degradation vs. Codebook Perturbation
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            In non-stationary embedding environments, embedding manifolds shift over time. If Voronoi centroids remain static while the query distribution drifts, Asymmetric Distance Computation (ADC) introduces an asymmetric distortion bias.
          </p>

          <div className="flex flex-col gap-2 font-mono text-sm">
            <div className="flex justify-between p-2 bg-[#070A11] rounded border border-slate-800">
              <span className="text-slate-400">Delta = 0.00 (Calibrated):</span>
              <span className="text-emerald-400 font-bold">Recall@10: 98.4% · Distortion: 0.042</span>
            </div>
            <div className="flex justify-between p-2 bg-[#070A11] rounded border border-slate-800">
              <span className="text-slate-400">Delta = 0.08 (Mild Drift):</span>
              <span className="text-cyan-400 font-bold">Recall@10: 88.8% · Distortion: 0.190</span>
            </div>
            <div className="flex justify-between p-2 bg-[#070A11] rounded border border-slate-800">
              <span className="text-slate-400">Delta = 0.16 (Moderate Drift):</span>
              <span className="text-amber-400 font-bold">Recall@10: 79.2% · Distortion: 0.338</span>
            </div>
            <div className="flex justify-between p-2 bg-[#070A11] rounded border border-slate-800">
              <span className="text-slate-400">Delta = 0.32 (Critical Drift):</span>
              <span className="text-rose-400 font-bold">Recall@10: 60.0% · Distortion: 0.634</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-[#090D18] p-5">
          <h3 className="text-base font-bold text-slate-100 border-b border-slate-800 pb-3 mb-4">
            Autonomous Re-balancing & Re-indexing Protocol
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            The APEX-215 engine implements an autonomous Lloyd-Max re-clustering trigger. When the RMS quantization distortion exceeds predefined thresholds, the background re-indexer partitions the active vector space without offline indexing downtime.
          </p>

          <div className="flex flex-col gap-3 text-sm">
            <div className="p-3 rounded bg-slate-900/60 border border-slate-800">
              <span className="font-semibold text-slate-200 block mb-1">Online Dual-Buffer Switching:</span>
              <span className="text-slate-400">
                While primary queries continue executing against Codebook Buffer A, secondary Lloyd-Max clustering converges on Codebook Buffer B. At zero latency, pointers atomically swap.
              </span>
            </div>
            <div className="p-3 rounded bg-slate-900/60 border border-slate-800">
              <span className="font-semibold text-slate-200 block mb-1">Deterministic Recovery:</span>
              <span className="text-slate-400">
                Executing "Re-calibrate Codebooks" resets delta to 0.00 and validates instantaneous restoration of 98.4% Recall@10.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
