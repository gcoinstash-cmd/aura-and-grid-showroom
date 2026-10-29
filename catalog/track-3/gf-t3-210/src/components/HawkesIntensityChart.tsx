import React from 'react';
import { HawkesState } from '../types/microstructure';
import { Activity, AlertTriangle, ShieldCheck } from 'lucide-react';

interface HawkesIntensityChartProps {
  hawkes: HawkesState;
}

export const HawkesIntensityChart: React.FC<HawkesIntensityChartProps> = ({ hawkes }) => {
  const history = hawkes.history;
  const maxIntensity = Math.max(5.0, ...history.map((h) => h.intensity));
  const minIntensity = 0;

  // Build SVG polyline points
  const width = 600;
  const height = 180;
  const padding = 20;

  const points = history
    .map((point, idx) => {
      const x = padding + (idx / Math.max(1, history.length - 1)) * (width - 2 * padding);
      const normalizedY = (point.intensity - minIntensity) / (maxIntensity - minIntensity || 1);
      const y = height - padding - normalizedY * (height - 2 * padding);
      return x.toFixed(1) + ',' + y.toFixed(1);
    })
    .join(' ');

  const isSubCritical = hawkes.branchingRatio < 1.0;
  const badgeClass = 'px-3 py-1 rounded-md text-sm font-semibold flex items-center gap-1.5 ' + (
    isSubCritical
      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
      : 'bg-rose-950 text-rose-300 border border-rose-800'
  );

  const viewBoxValue = '0 0 ' + width + ' ' + height;

  return (
    <div className="flex flex-col bg-[#090D18] border border-slate-800 rounded-lg p-4 text-slate-100">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-bold text-white uppercase tracking-wider">
            Hawkes Self-Exciting Point Process
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className={badgeClass}>
            {isSubCritical ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Sub-Critical (eta = {hawkes.branchingRatio.toFixed(3)} &lt; 1.0)</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Super-Critical Cascade Risk (eta &gt;= 1.0)</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Mathematical derivation summary */}
      <div className="p-3 bg-slate-950 rounded border border-slate-800 mb-3 font-mono text-sm space-y-1">
        <div className="text-cyan-300 font-bold">
          lambda(t) = mu + sum[ alpha * exp( -beta * (t - t_i) ) ]
        </div>
        <div className="text-slate-400 flex flex-wrap gap-x-4 gap-y-1 pt-1">
          <span>Baseline mu: {hawkes.mu.toFixed(2)} events/s</span>
          <span>Jump alpha: {hawkes.alpha.toFixed(2)}</span>
          <span>Decay beta: {hawkes.beta.toFixed(2)}</span>
          <span>Branching Ratio: {hawkes.branchingRatio.toFixed(3)}</span>
        </div>
      </div>

      {/* SVG Intensity Curve */}
      <div className="relative w-full h-[180px] bg-slate-950/80 rounded border border-slate-800 overflow-hidden flex items-center justify-center">
        {history.length > 1 ? (
          <svg viewBox={viewBoxValue} className="w-full h-full">
            {/* Horizontal guideline for baseline mu */}
            {(() => {
              const muY = height - padding - (hawkes.mu / maxIntensity) * (height - 2 * padding);
              return (
                <line
                  x1={padding}
                  y1={muY}
                  x2={width - padding}
                  y2={muY}
                  stroke="#334155"
                  strokeDasharray="4 4"
                  strokeWidth="1.5"
                />
              );
            })()}

            {/* Gradient definition */}
            <defs>
              <linearGradient id="hawkesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Intensity Path */}
            <polyline
              fill="none"
              stroke="#F59E0B"
              strokeWidth="2.5"
              points={points}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <div className="text-slate-500 font-mono text-sm">
            Sampling trade cluster arrivals...
          </div>
        )}

        <div className="absolute top-2 right-3 px-2 py-1 bg-slate-900/90 border border-slate-700 rounded text-sm font-mono font-bold text-amber-300">
          Peak: {maxIntensity.toFixed(2)} events/s
        </div>
      </div>

      <div className="mt-3 text-sm text-slate-400 leading-relaxed">
        Hawkes self-exciting processes capture endogenous microstructure feedback: trade executions trigger subsequent orders, clustering execution bursts in sub-millisecond windows.
      </div>
    </div>
  );
};
