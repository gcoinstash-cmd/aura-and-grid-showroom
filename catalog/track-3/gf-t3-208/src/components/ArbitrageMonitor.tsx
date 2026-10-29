/**
 * APEX-208 Arbitrage-Free Boundary Verification Monitor
 * Calendar Spread Monotonicity (dw/dT >= 0) and
 * Breeden-Litzenberger Risk-Neutral Density (d2C/dK2 >= 0).
 *
 * Strict Zero-Dollar Compliance: No dollar signs anywhere.
 * Minimum 14px typography floor maintained.
 */

import React from 'react';
import { CalendarArbitrageReport, ButterflyArbitrageReport } from '../quant/types.ts';
import { STANDARD_MATURITIES } from '../quant/assets.ts';
import { ShieldCheck, AlertTriangle, CheckCircle2, TrendingUp, Layers } from 'lucide-react';

interface ArbitrageMonitorProps {
  calendarReport: CalendarArbitrageReport;
  butterflyReport: ButterflyArbitrageReport;
  selectedMaturity: number;
}

export const ArbitrageMonitor: React.FC<ArbitrageMonitorProps> = ({
  calendarReport,
  butterflyReport,
  selectedMaturity
}) => {
  // Density SVG dimensions
  const width = 760;
  const height = 200;
  const padding = { top: 20, right: 30, bottom: 40, left: 60 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const densityPts = butterflyReport.densityCurve;
  const minK = densityPts.length > 0 ? densityPts[0].strike : 200;
  const maxK = densityPts.length > 0 ? densityPts[densityPts.length - 1].strike : 300;

  const densities = densityPts.map(d => d.density);
  const minDensity = Math.min(0.0, ...densities);
  const maxDensity = Math.max(0.005, ...densities);

  const scaleX = (k: number) => padding.left + ((k - minK) / (maxK - minK)) * plotWidth;
  const scaleY = (d: number) => padding.top + plotHeight - ((d - minDensity) / (maxDensity - minDensity)) * plotHeight;

  // Build path for risk-neutral density
  const pathD = densityPts.reduce((acc, pt, idx) => {
    const x = scaleX(pt.strike);
    const y = scaleY(pt.density);
    return idx === 0 ? 'M ' + x + ' ' + y : acc + ' L ' + x + ' ' + y;
  }, '');

  const zeroY = scaleY(0.0);

  return (
    <div className="w-full bg-[#090D16] border border-slate-800 rounded-lg p-5 flex flex-col gap-6">
      {/* Header and Summary Status Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>ARBITRAGE-FREE SURFACE VERIFICATION</span>
          </h3>
          <p className="text-sm text-slate-400 mt-0.5">
            Static & Dynamic Mathematical Boundaries (Breeden-Litzenberger & Calendar Monotonicity)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={
              'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold border ' +
              (calendarReport.isArbitrageFree
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
                : 'bg-amber-950/40 text-amber-300 border-amber-800/60')
            }
          >
            {calendarReport.isArbitrageFree ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            )}
            <span>
              {'Calendar: ' + (calendarReport.isArbitrageFree ? 'CLEAN (dw/dT >= 0)' : 'VIOLATION DETECTED')}
            </span>
          </div>

          <div
            className={
              'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold border ' +
              (butterflyReport.isArbitrageFree
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
                : 'bg-amber-950/40 text-amber-300 border-amber-800/60')
            }
          >
            {butterflyReport.isArbitrageFree ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            )}
            <span>
              {'Butterfly: ' + (butterflyReport.isArbitrageFree ? 'CLEAN (q(K) >= 0)' : 'VIOLATION DETECTED')}
            </span>
          </div>
        </div>
      </div>

      {/* Part 1: Risk-Neutral Density Curve (Breeden-Litzenberger) */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-semibold text-slate-200 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span>Risk-Neutral State Density Distribution q(K) = d2C / dK2</span>
          </h4>
          <span className="text-sm font-mono text-slate-400">
            {'Target Slice: ' + (selectedMaturity * 365).toFixed(0) + ' Days'}
          </span>
        </div>

        <div className="relative w-full overflow-x-auto bg-slate-900/60 border border-slate-800 rounded-md p-2">
          <svg viewBox={'0 0 ' + width + ' ' + height} className="w-full h-auto min-w-[600px]">
            {/* Zero Density Baseline */}
            <line
              x1={padding.left}
              y1={zeroY}
              x2={width - padding.right}
              y2={zeroY}
              stroke="#E2E8F0"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            <text
              x={padding.left - 8}
              y={zeroY + 4}
              fill="#E2E8F0"
              fontSize="14"
              textAnchor="end"
              className="font-mono text-sm"
            >
              0.00
            </text>

            {/* Density Curve Path */}
            <path
              d={pathD}
              fill="none"
              stroke="#10B981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* X-Axis Stencil */}
            <line
              x1={padding.left}
              y1={height - padding.bottom}
              x2={width - padding.right}
              y2={height - padding.bottom}
              stroke="#334155"
              strokeWidth="1.5"
            />

            {densityPts
              .filter((_, idx) => idx % 2 === 0)
              .map((pt, idx) => {
                const x = scaleX(pt.strike);
                return (
                  <g key={idx}>
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
                      {pt.strike.toFixed(0)}
                    </text>
                  </g>
                );
              })}
          </svg>
        </div>
      </div>

      {/* Part 2: Calendar Spread Total Variance Matrix w(K, T) */}
      <div className="flex flex-col gap-3">
        <h4 className="text-base font-semibold text-slate-200 flex items-center gap-2">
          <Layers className="w-4 h-4 text-violet-400" />
          <span>Calendar Spread Total Implied Variance Matrix w(K, T) = vol^2 * T (pts^2)</span>
        </h4>

        <div className="w-full overflow-x-auto border border-slate-800 rounded-md">
          <table className="w-full text-left text-sm font-mono border-collapse">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-800 text-slate-300">
                <th className="py-2.5 px-4 font-semibold text-left">Strike (pts)</th>
                {STANDARD_MATURITIES.map(mat => (
                  <th key={mat.label} className="py-2.5 px-4 font-semibold text-right">
                    {mat.label}
                  </th>
                ))}
                <th className="py-2.5 px-4 font-semibold text-center">Calendar Check</th>
              </tr>
            </thead>
            <tbody>
              {calendarReport.varianceMatrix.slice(2, 9).map((row, rIdx) => {
                // Check if row has any monotonicity violation
                let rowViolates = false;
                for (let j = 0; j < row.variances.length - 1; j++) {
                  if (row.variances[j + 1].totalVariance < row.variances[j].totalVariance - 1e-6) {
                    rowViolates = true;
                    break;
                  }
                }

                return (
                  <tr
                    key={rIdx}
                    className="border-b border-slate-800/60 hover:bg-slate-900/40 transition-colors"
                  >
                    <td className="py-2.5 px-4 font-bold text-slate-200">
                      {row.strike.toFixed(1)} pts
                    </td>
                    {row.variances.map((v, cIdx) => (
                      <td key={cIdx} className="py-2.5 px-4 text-right text-slate-300">
                        {v.totalVariance.toFixed(4)}
                      </td>
                    ))}
                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={
                          'px-2.5 py-0.5 rounded text-sm font-semibold ' +
                          (rowViolates
                            ? 'bg-amber-900/40 text-amber-300'
                            : 'bg-emerald-950/40 text-emerald-400')
                        }
                      >
                        {rowViolates ? 'FAIL' : 'PASS'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
