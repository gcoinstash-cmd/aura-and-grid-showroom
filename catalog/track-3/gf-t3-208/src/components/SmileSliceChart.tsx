/**
 * APEX-208 2D Volatility Smile Slices & Skew Calibration
 * Compares Market Solved IV Quotes against Hagan SABR Model Fit.
 * Absolute Zero-Dollar compliance verified.
 * Minimum 14px typography floor enforced.
 */

import React, { useState } from 'react';
import { OptionQuote, SABRParameters } from '../quant/types.ts';
import { STANDARD_MATURITIES } from '../quant/assets.ts';
import { Activity, Target, GitCommit } from 'lucide-react';

interface SmileSliceChartProps {
  spot: number;
  quotes: OptionQuote[];
  selectedMaturity: number;
  onSelectMaturity: (mat: number) => void;
  params: SABRParameters;
  rmse: number;
}

export const SmileSliceChart: React.FC<SmileSliceChartProps> = ({
  spot,
  quotes,
  selectedMaturity,
  onSelectMaturity,
  params,
  rmse
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<OptionQuote | null>(null);

  if (quotes.length === 0) return null;

  // Chart dimensions
  const width = 760;
  const height = 300;
  const padding = { top: 25, right: 35, bottom: 45, left: 65 };

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Domain calculations
  const strikes = quotes.map(q => q.strike);
  const minStrike = Math.min(...strikes);
  const maxStrike = Math.max(...strikes);

  const allVols = quotes.flatMap(q => [q.solvedIV, q.sabrIV]);
  const minVol = Math.max(0.05, Math.min(...allVols) - 0.04);
  const maxVol = Math.max(...allVols) + 0.04;

  const scaleX = (k: number) => padding.left + ((k - minStrike) / (maxStrike - minStrike)) * plotWidth;
  const scaleY = (v: number) => padding.top + plotHeight - ((v - minVol) / (maxVol - minVol)) * plotHeight;

  // Build SVG path for SABR fitted curve
  const sabrPoints = quotes.map(q => ({ x: scaleX(q.strike), y: scaleY(q.sabrIV) }));
  const pathD = sabrPoints.reduce((acc, pt, idx) => {
    return idx === 0 ? 'M ' + pt.x + ' ' + pt.y : acc + ' L ' + pt.x + ' ' + pt.y;
  }, '');

  // Grid tick values
  const yTicks = [
    minVol,
    minVol + (maxVol - minVol) * 0.333,
    minVol + (maxVol - minVol) * 0.666,
    maxVol
  ];

  // ATM Vol & Skew calculation
  const atmQuote = quotes.reduce((prev, curr) =>
    Math.abs(curr.strike - spot) < Math.abs(prev.strike - spot) ? curr : prev
  );

  return (
    <div className="w-full bg-[#090D16] border border-slate-800 rounded-lg p-5 flex flex-col gap-4">
      {/* Top Header & Maturity Segmented Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <span>FITTED VOLATILITY SMILE</span>
          </h3>
          <p className="text-sm text-slate-400 mt-0.5">
            Hagan et al. Analytical Model vs Vectorized Black-76 Inversion
          </p>
        </div>

        {/* Maturity Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg">
          {STANDARD_MATURITIES.map(mat => (
            <button
              key={mat.label}
              onClick={() => onSelectMaturity(mat.value)}
              className={
                'px-3 py-1.5 text-sm font-semibold rounded-md transition-colors cursor-pointer ' +
                (Math.abs(selectedMaturity - mat.value) < 1e-3
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800')
              }
            >
              {mat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-1">
        <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-md">
          <div className="text-sm font-medium text-slate-400">ATM Strike (pts)</div>
          <div className="text-xl font-bold font-mono text-cyan-400 tracking-tight mt-0.5">
            {atmQuote.strike.toFixed(2)} pts
          </div>
        </div>

        <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-md">
          <div className="text-sm font-medium text-slate-400">ATM Implied Vol</div>
          <div className="text-xl font-bold font-mono text-white tracking-tight mt-0.5">
            {(atmQuote.sabrIV * 100).toFixed(2)}%
          </div>
        </div>

        <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-md">
          <div className="text-sm font-medium text-slate-400">Calibration RMSE</div>
          <div className="text-xl font-bold font-mono text-emerald-400 tracking-tight mt-0.5">
            {(rmse * 10000).toFixed(1)} bps
          </div>
        </div>

        <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-md">
          <div className="text-sm font-medium text-slate-400">SABR Skew (rho)</div>
          <div className="text-xl font-bold font-mono text-violet-400 tracking-tight mt-0.5">
            {params.rho.toFixed(3)}
          </div>
        </div>
      </div>

      {/* Primary SVG Chart */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={'0 0 ' + width + ' ' + height}
          className="w-full h-auto min-w-[600px] select-none"
        >
          {/* Background grid lines */}
          {yTicks.map((tick, i) => {
            const y = scaleY(tick);
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#1E293B"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  fill="#94A3B8"
                  fontSize="14"
                  textAnchor="end"
                  className="font-mono text-sm"
                >
                  {(tick * 100).toFixed(1)}%
                </text>
              </g>
            );
          })}

          {/* ATM Spot Reference Line */}
          <line
            x1={scaleX(spot)}
            y1={padding.top}
            x2={scaleX(spot)}
            y2={height - padding.bottom}
            stroke="#64748B"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
          <text
            x={scaleX(spot)}
            y={padding.top - 8}
            fill="#94A3B8"
            fontSize="14"
            textAnchor="middle"
            className="font-mono text-sm"
          >
            {'ATM (' + spot.toFixed(1) + ' pts)'}
          </text>

          {/* Fitted SABR Curve */}
          <path
            d={pathD}
            fill="none"
            stroke="#06B6D4"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Market Quote Points (Circles) */}
          {quotes.map((q, idx) => {
            const cx = scaleX(q.strike);
            const cy = scaleY(q.solvedIV);
            const isHovered = hoveredPoint?.strike === q.strike;

            return (
              <g
                key={idx}
                onMouseEnter={() => setHoveredPoint(q)}
                onMouseLeave={() => setHoveredPoint(null)}
                className="cursor-pointer"
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 7 : 5}
                  fill={isHovered ? '#38BDF8' : '#8B5CF6'}
                  stroke="#090D16"
                  strokeWidth="2"
                  className="transition-all"
                />
              </g>
            );
          })}

          {/* X-Axis Horizontal Line */}
          <line
            x1={padding.left}
            y1={height - padding.bottom}
            x2={width - padding.right}
            y2={height - padding.bottom}
            stroke="#334155"
            strokeWidth="1.5"
          />

          {/* X-Axis Strike Labels */}
          {quotes
            .filter((_, i) => i % 2 === 0)
            .map((q, i) => {
              const x = scaleX(q.strike);
              return (
                <g key={i}>
                  <line
                    x1={x}
                    y1={height - padding.bottom}
                    x2={x}
                    y2={height - padding.bottom + 6}
                    stroke="#475569"
                  />
                  <text
                    x={x}
                    y={height - padding.bottom + 22}
                    fill="#94A3B8"
                    fontSize="14"
                    textAnchor="middle"
                    className="font-mono text-sm"
                  >
                    {q.strike.toFixed(0)}
                  </text>
                </g>
              );
            })}
        </svg>

        {/* Floating Tooltip */}
        {hoveredPoint && (
          <div className="absolute top-2 right-4 p-3 bg-slate-900 border border-slate-700 rounded-md shadow-lg pointer-events-none text-sm z-20">
            <div className="font-bold text-white mb-1">
              {'Strike: ' + hoveredPoint.strike.toFixed(2) + ' pts'}
            </div>
            <div className="font-mono text-cyan-400">
              {'Market Solved IV: ' + (hoveredPoint.solvedIV * 100).toFixed(2) + '%'}
            </div>
            <div className="font-mono text-violet-400">
              {'SABR Model IV: ' + (hoveredPoint.sabrIV * 100).toFixed(2) + '%'}
            </div>
            <div className="font-mono text-slate-300">
              {'Residual: ' + hoveredPoint.residualBps + ' bps'}
            </div>
          </div>
        )}
      </div>

      {/* Legend & Attribution Bar */}
      <div className="flex flex-wrap items-center justify-between text-sm text-slate-400 pt-2 border-t border-slate-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-cyan-400" />
            <span className="text-slate-300">Hagan SABR Fitted Curve</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-violet-500" />
            <span className="text-slate-300">Market Quotes (Newton-Raphson)</span>
          </div>
        </div>
        <div className="font-mono text-slate-400">
          Convergence: 1e-7 pts tolerance
        </div>
      </div>
    </div>
  );
};
