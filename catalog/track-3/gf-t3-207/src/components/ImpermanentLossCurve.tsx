/**
 * GF-T3-207: Impermanent Loss Analytical Curve & Net Position Calculator
 * Closed-Form Formula & Yield Cushion Breakdown
 * Zero Third-Party Financial Marks | Zero Currency Symbols
 */

import React from 'react';
import { TelemetryState } from '../types/amm';
import { Scale, CheckCircle2 } from 'lucide-react';
import { AmmSimulator } from '../lib/amm-engine';

interface ImpermanentLossCurveProps {
  telemetry: TelemetryState;
}

export const ImpermanentLossCurve: React.FC<ImpermanentLossCurveProps> = ({ telemetry }) => {
  const currentK = telemetry.activePrice / Math.max(0.0001, telemetry.entryPrice);
  const currentIL = AmmSimulator.calculateAnalyticalImpermanentLoss(currentK);

  // SVG Coordinate mapping for IL curve: k in [0.2, 5.0], IL in [-0.30, 0.0]
  const svgWidth = 600;
  const svgHeight = 220;
  const padX = 45;
  const padY = 25;

  const minK = 0.2;
  const maxK = 5.0;
  const minIL = -0.30;
  const maxIL = 0.0;

  const kToX = (k: number): number => {
    const ratio = (k - minK) / (maxK - minK);
    return padX + ratio * (svgWidth - 2 * padX);
  };

  const ilToY = (il: number): number => {
    const clamped = Math.max(minIL, Math.min(maxIL, il));
    const ratio = (clamped - minIL) / (maxIL - minIL);
    // Y is inverted in SVG (0 is top)
    return svgHeight - padY - ratio * (svgHeight - 2 * padY);
  };

  // Generate curve path points
  const points: { x: number; y: number }[] = [];
  const sampleSteps = 60;
  for (let i = 0; i <= sampleSteps; i++) {
    const k = minK + (i / sampleSteps) * (maxK - minK);
    const il = AmmSimulator.calculateAnalyticalImpermanentLoss(k);
    points.push({ x: kToX(k), y: ilToY(il) });
  }

  let curvePathD = 'M ' + points[0].x + ' ' + points[0].y;
  for (let i = 1; i < points.length; i++) {
    curvePathD += ' L ' + points[i].x + ' ' + points[i].y;
  }

  const activeMarkerX = kToX(Math.max(minK, Math.min(maxK, currentK)));
  const activeMarkerY = ilToY(currentIL);

  // Fee cushion calculations in units
  const totalFeesUnits = telemetry.totalFeeAccrualA * telemetry.activePrice + telemetry.totalFeeAccrualB;
  const initialCapitalUnits = telemetry.liquidityL * 0.4; // Normalized reference
  const ilPenaltyUnits = Math.abs(currentIL) * initialCapitalUnits;
  const netPositionDeltaUnits = totalFeesUnits - ilPenaltyUnits;

  const benchmarkTable = [
    { k: 1.10, label: '+10%', il: '-0.11%' },
    { k: 1.25, label: '+25%', il: '-0.62%' },
    { k: 1.50, label: '+50%', il: '-2.02%' },
    { k: 2.00, label: '+100%', il: '-5.72%' },
    { k: 3.00, label: '+200%', il: '-13.40%' },
    { k: 5.00, label: '+400%', il: '-25.46%' },
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5">
      
      {/* Title & Formula Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-100 uppercase tracking-wider">
              Analytical Impermanent Loss & Net Cushion
            </h3>
            <span className="bg-rose-950 text-rose-300 border border-rose-800/60 px-2.5 py-0.5 rounded text-sm font-semibold font-mono">
              IL(k) = (2*sqrt(k)/(1+k)) - 1
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-0.5">
            Closed-form mathematical loss vs HODL, offset by volatility-scaled dynamic fee cushion.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-md text-sm font-mono">
          <span className="text-slate-400">Mark Ratio k:</span>
          <span className="text-cyan-400 font-bold">{currentK.toFixed(4)}x</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left: SVG Impermanent Loss Graph */}
        <div className="lg:col-span-7 bg-[#070A11] border border-slate-800/80 rounded-md p-2 relative overflow-hidden">
          <svg
            viewBox={'0 0 ' + svgWidth + ' ' + svgHeight}
            className="w-full h-56 select-none"
            preserveAspectRatio="none"
          >
            {/* Grid & Zero Axis */}
            <line
              x1={padX}
              y1={ilToY(0.0)}
              x2={svgWidth - padX}
              y2={ilToY(0.0)}
              stroke="#334155"
              strokeWidth="1.5"
            />
            <line
              x1={padX}
              y1={ilToY(-0.10)}
              x2={svgWidth - padX}
              y2={ilToY(-0.10)}
              stroke="#1E293B"
              strokeDasharray="4 4"
            />
            <line
              x1={padX}
              y1={ilToY(-0.20)}
              x2={svgWidth - padX}
              y2={ilToY(-0.20)}
              stroke="#1E293B"
              strokeDasharray="4 4"
            />

            {/* k = 1.0 Unity Axis */}
            <line
              x1={kToX(1.0)}
              y1={padY}
              x2={kToX(1.0)}
              y2={svgHeight - padY}
              stroke="#475569"
              strokeDasharray="3 3"
              strokeWidth="1"
            />
            <text
              x={kToX(1.0)}
              y={padY + 12}
              textAnchor="middle"
              fill="#94A3B8"
              className="text-sm font-mono"
            >
              k = 1.0 (Zero IL)
            </text>

            {/* IL Curve */}
            <path
              d={curvePathD}
              fill="none"
              stroke="#F43F5E"
              strokeWidth="2.5"
            />

            {/* Active Position Indicator */}
            <circle
              cx={activeMarkerX}
              cy={activeMarkerY}
              r="6"
              fill="#06B6D4"
              className="animate-pulse"
            />
            <circle
              cx={activeMarkerX}
              cy={activeMarkerY}
              r="12"
              fill="none"
              stroke="#06B6D4"
              strokeWidth="1.5"
              strokeOpacity="0.5"
            />
            <line
              x1={activeMarkerX}
              y1={ilToY(0.0)}
              x2={activeMarkerX}
              y2={activeMarkerY}
              stroke="#06B6D4"
              strokeDasharray="2 2"
              strokeWidth="1.5"
            />

            {/* Labels */}
            <text x={padX} y={ilToY(0.0) - 6} fill="#64748B" className="text-sm font-mono">0.0%</text>
            <text x={padX} y={ilToY(-0.10) - 6} fill="#64748B" className="text-sm font-mono">-10.0%</text>
            <text x={padX} y={ilToY(-0.20) - 6} fill="#64748B" className="text-sm font-mono">-20.0%</text>
            <text x={svgWidth - padX} y={svgHeight - 6} textAnchor="end" fill="#64748B" className="text-sm font-mono">
              k = 5.0x
            </text>
          </svg>

          {/* Active Tag */}
          <div className="absolute bottom-2 left-4 bg-slate-900/90 border border-slate-700 px-3 py-1 rounded text-sm font-mono">
            Active IL: <span className="text-rose-400 font-bold">{telemetry.impermanentLossPct.toFixed(2)}%</span>
          </div>
        </div>

        {/* Right: Net Position & Yield Cushion Breakdown */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
          
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3.5 space-y-2">
            <div className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Net LP Position Cushion</span>
              <span className={netPositionDeltaUnits >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {netPositionDeltaUnits >= 0 ? 'FEES OUTWEIGH IL' : 'DEFICIT'}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Total Fee Accrual (Yield):</span>
              <span className="font-mono text-emerald-400 font-bold">
                +{totalFeesUnits.toFixed(2)} Units
              </span>
            </div>

            <div className="flex items-center justify-between text-sm py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Impermanent Loss Penalty:</span>
              <span className="font-mono text-rose-400 font-bold">
                -{ilPenaltyUnits.toFixed(2)} Units
              </span>
            </div>

            <div className="flex items-center justify-between text-base py-1 font-bold">
              <span className="text-slate-200">Net Surplus / Cushion:</span>
              <span className={'font-mono ' + (netPositionDeltaUnits >= 0 ? 'text-emerald-300' : 'text-rose-400')}>
                {netPositionDeltaUnits >= 0 ? '+' : ''}{netPositionDeltaUnits.toFixed(2)} Units
              </span>
            </div>
          </div>

          {/* Benchmark Table */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3">
            <div className="text-sm font-semibold text-slate-400 mb-2">
              Closed-Form Proof Reference Table:
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-center text-sm font-mono">
              {benchmarkTable.map((row) => (
                <div key={row.k} className="bg-slate-900 border border-slate-800/80 p-1.5 rounded">
                  <div className="text-slate-400">{row.label}</div>
                  <div className="text-rose-400 font-bold mt-0.5">{row.il}</div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
