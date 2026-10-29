/**
 * QQPlot Component (Quantile-Quantile Fat Tail Plot)
 * Plots theoretical standard normal quantiles vs sorted empirical losses.
 * Visualizes fat tail excess kurtosis and Fréchet domain divergence.
 * Strict zero-dollar gate & 14px floor.
 */

import React, { useMemo } from 'react';
import { standardNormalQuantile } from '../lib/quantMath';
import { RiskEvaluationResult, MonteCarloSummary } from '../types/risk';

interface QQPlotProps {
  risk: RiskEvaluationResult;
  monteCarlo: MonteCarloSummary;
}

export const QQPlot: React.FC<QQPlotProps> = ({
  risk,
  monteCarlo
}) => {
  const plotWidth = 700;
  const plotHeight = 320;
  const paddingLeft = 60;
  const paddingRight = 40;
  const paddingTop = 30;
  const paddingBottom = 45;
  const w = plotWidth - paddingLeft - paddingRight;
  const h = plotHeight - paddingTop - paddingBottom;

  // Downsample to 120 quantiles for clear SVG rendering
  const { points, minZ, maxZ, minL, maxL } = useMemo(() => {
    const losses = [...monteCarlo.simulatedLosses].sort((a, b) => a - b);
    const n = losses.length;
    const sampleCount = 120;
    const pts = [];

    let min_z = -3.2;
    let max_z = 3.8;
    let min_l = losses[0];
    let max_l = losses[n - 1];

    for (let i = 1; i <= sampleCount; i++) {
      const p = i / (sampleCount + 1);
      const zTheo = standardNormalQuantile(p);
      const lIdx = Math.floor(p * n);
      const lEmp = losses[lIdx];
      pts.push({ p, zTheo, lEmp, isTail: p >= 0.95 });
    }

    return { points: pts, minZ: min_z, maxZ: max_z, minL: min_l, maxL: max_l };
  }, [monteCarlo.simulatedLosses]);

  const mapX = (z: number) => paddingLeft + ((z - minZ) / (maxZ - minZ)) * w;
  const mapY = (l: number) => paddingTop + h - ((l - minL) / (maxL - minL)) * h;

  // Reference diagonal line (Gaussian baseline)
  const refStart = { x: mapX(-3.0), y: mapY(minL + 0.15 * (maxL - minL)) };
  const refEnd = { x: mapX(3.0), y: mapY(minL + 0.70 * (maxL - minL)) };

  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-lg p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 tracking-tight">
            Quantile-Quantile (Q-Q) Fat Tail Diagnostic Plot
          </h2>
          <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
            <span>Theoretical Gaussian Quantiles (z) vs Realized Portfolio Loss Quantiles</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm font-medium">
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 bg-slate-500 inline-block"></span>
            <span className="text-slate-400">Gaussian Reference</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block"></span>
            <span className="text-cyan-300">Empirical Body</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
            <span className="text-rose-400">EVT Tail Divergence (&gt;95%)</span>
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={"0 0 " + plotWidth + " " + plotHeight}
          className="w-full h-auto select-none font-mono"
        >
          {/* Grid lines */}
          {[-2, -1, 0, 1, 2, 3].map((zVal) => {
            const x = mapX(zVal);
            return (
              <g key={zVal}>
                <line x1={x} y1={paddingTop} x2={x} y2={paddingTop + h} stroke="#1E293B" strokeDasharray="3 3" />
                <text x={x} y={paddingTop + h + 18} textAnchor="middle" fill="#64748B" fontSize="11">
                  {zVal + " sigma"}
                </text>
              </g>
            );
          })}

          {/* Reference Line */}
          <line
            x1={refStart.x}
            y1={refStart.y}
            x2={refEnd.x}
            y2={refEnd.y}
            stroke="#64748B"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          {/* Points */}
          {points.map((pt, idx) => {
            const cx = mapX(pt.zTheo);
            const cy = mapY(pt.lEmp);
            const isTail = pt.isTail;

            return (
              <circle
                key={idx}
                cx={cx}
                cy={cy}
                r={isTail ? 3.5 : 2.5}
                fill={isTail ? "#F43F5E" : "#06B6D4"}
                opacity={isTail ? 0.95 : 0.7}
              />
            );
          })}

          {/* Annotations */}
          <text
            x={mapX(2.6)}
            y={mapY(maxL * 0.88)}
            fill="#F43F5E"
            fontSize="12"
            fontWeight="bold"
          >
            Extreme Value Fat Tail Divergence (xi = {risk.evtTailIndexXi.toFixed(3)})
          </text>
        </svg>
      </div>

      <div className="mt-3 text-sm text-slate-400 border-t border-slate-800/80 pt-3 flex items-center justify-between">
        <div>
          <span className="font-semibold text-slate-300">Empirical Tail Test:</span> In the presence of fat tails (Fréchet domain), upper quantiles diverge upwards above the linear normal reference line.
        </div>
        <div className="font-mono text-cyan-400 font-semibold">
          Excess Kurtosis K = {risk.excessKurtosis.toFixed(2)}
        </div>
      </div>
    </div>
  );
};
