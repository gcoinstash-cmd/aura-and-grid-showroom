import React, { useState } from 'react';
import { ChildSlice, ExecutionStrategy } from '../types';

interface TrajectoryChartProps {
  totalShares: number;
  slices: ChildSlice[];
  strategy: ExecutionStrategy;
  riskAversion: number;
  volatility: number;
  temporaryImpact: number;
}

export const TrajectoryChart: React.FC<TrajectoryChartProps> = ({
  totalShares,
  slices,
  strategy,
  riskAversion,
  volatility,
  temporaryImpact,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<{
    index: number;
    targetRem: number;
    actualRem: number;
    timePct: number;
    x: number;
    y: number;
  } | null>(null);

  const nSlices = slices.length || 20;

  // Build target remaining trajectory
  const targetTrajectory: number[] = [totalShares];
  let currentTargetRem = totalShares;
  for (const s of slices) {
    currentTargetRem -= s.target_shares;
    targetTrajectory.push(Math.max(0, currentTargetRem));
  }

  // Build actual executed trajectory
  const actualTrajectory: number[] = [totalShares];
  let currentActualRem = totalShares;
  for (const s of slices) {
    if (s.status === 'FILLED') {
      currentActualRem -= s.filled_shares;
      actualTrajectory.push(Math.max(0, currentActualRem));
    } else {
      actualTrajectory.push(currentActualRem);
    }
  }

  // Calculate Urgency parameter kappa for Almgren-Chriss
  const kappa = Math.sqrt((riskAversion * Math.pow(volatility, 2)) / Math.max(temporaryImpact, 1e-12));

  // Chart dimensions
  const width = 640;
  const height = 240;
  const padding = { top: 20, right: 30, bottom: 35, left: 60 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const pointsCount = targetTrajectory.length;
  const getX = (index: number) => padding.left + (index / (pointsCount - 1)) * plotWidth;
  const getY = (shares: number) =>
    padding.top + plotHeight - (shares / Math.max(1, totalShares)) * plotHeight;

  // SVG Path generator for smooth target line
  const targetPath = targetTrajectory.reduce((acc, shares, idx) => {
    const x = getX(idx);
    const y = getY(shares);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  // Stepped path for actual executions
  let actualPath = `M ${getX(0)} ${getY(actualTrajectory[0])}`;
  for (let i = 1; i < actualTrajectory.length; i++) {
    const prevY = getY(actualTrajectory[i - 1]);
    const curX = getX(i);
    const curY = getY(actualTrajectory[i]);
    actualPath += ` L ${curX} ${prevY} L ${curX} ${curY}`;
  }

  // Horizontal Grid Lines (5 divisions)
  const gridLines = [0, 0.25, 0.5, 0.75, 1.0].map((frac) => ({
    shares: totalShares * frac,
    y: getY(totalShares * frac),
  }));

  return (
    <div className="bg-zinc-900/70 border border-zinc-800 rounded-lg p-5 flex flex-col justify-between">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-3 mb-3">
        <div className="flex items-center gap-3">
          <div>
            <span className="text-sm uppercase tracking-wider text-zinc-400 font-medium">Optimal Liquidation</span>
            <div className="text-base font-semibold text-zinc-200">Target vs Actual Trajectory</div>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-sm font-mono pl-3 border-l border-zinc-800">
            <span className="flex items-center gap-1.5 text-zinc-300">
              <span className="w-3.5 h-0.5 bg-cyan-400 inline-block"></span>
              <span>Target Schedule</span>
            </span>
            <span className="flex items-center gap-1.5 text-zinc-300">
              <span className="w-3.5 h-0.5 bg-amber-400 inline-block"></span>
              <span>Actual Fills</span>
            </span>
          </div>
        </div>

        {/* Dynamic Formula Annotation */}
        <div className="text-sm font-mono text-zinc-300 bg-zinc-950/70 border border-zinc-800 px-3 py-1.5 rounded-md">
          {strategy === 'ALMGREN_CHRISS' && (
            <span>κ = {kappa.toFixed(2)} · λ={riskAversion.toExponential(1)} · σ={(volatility * 100).toFixed(1)}%</span>
          )}
          {strategy === 'VWAP' && <span>U-Curve Intraday Volume Match</span>}
          {strategy === 'TWAP' && <span>Uniform Linear + Anti-Gaming Jitter</span>}
        </div>
      </div>

      {/* SVG Canvas Chart */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          onMouseLeave={() => setHoveredPoint(null)}
        >
          {/* Horizontal Grid lines */}
          {gridLines.map((line, idx) => (
            <g key={idx}>
              <line
                x1={padding.left}
                y1={line.y}
                x2={width - padding.right}
                y2={line.y}
                stroke="#27272a"
                strokeWidth="1"
                strokeDasharray={idx === 0 || idx === gridLines.length - 1 ? 'none' : '3 3'}
              />
              <text
                x={padding.left - 8}
                y={line.y + 4}
                fill="#71717a"
                fontSize="11"
                fontFamily="JetBrains Mono, monospace"
                textAnchor="end"
              >
                {Math.round(line.shares).toLocaleString()}
              </text>
            </g>
          ))}

          {/* Time timeline ticks (0% to 100%) */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((frac, idx) => {
            const x = padding.left + frac * plotWidth;
            return (
              <g key={idx}>
                <line x1={x} y1={height - padding.bottom} x2={x} y2={height - padding.bottom + 4} stroke="#3f3f46" />
                <text
                  x={x}
                  y={height - padding.bottom + 18}
                  fill="#71717a"
                  fontSize="11"
                  fontFamily="JetBrains Mono, monospace"
                  textAnchor="middle"
                >
                  {(frac * 100).toFixed(0)}% T
                </text>
              </g>
            );
          })}

          {/* Target Trajectory Curve Area fill */}
          <path
            d={`${targetPath} L ${getX(pointsCount - 1)} ${getY(0)} L ${getX(0)} ${getY(0)} Z`}
            fill="url(#targetGradient)"
            opacity="0.12"
          />

          <defs>
            <linearGradient id="targetGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Target Trajectory Line */}
          <path
            d={targetPath}
            fill="none"
            stroke="#22d3ee"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="transition-all duration-300"
          />

          {/* Actual Executed Stepped Line */}
          <path
            d={actualPath}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeLinecap="square"
            className="transition-all duration-200"
          />

          {/* Interactive node hover hitboxes */}
          {targetTrajectory.map((shares, idx) => {
            const x = getX(idx);
            const y = getY(shares);
            const actShares = actualTrajectory[idx];
            return (
              <g
                key={idx}
                className="cursor-pointer"
                onMouseEnter={() =>
                  setHoveredPoint({
                    index: idx,
                    targetRem: shares,
                    actualRem: actShares,
                    timePct: (idx / (pointsCount - 1)) * 100,
                    x,
                    y,
                  })
                }
              >
                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  fill="#09090b"
                  stroke="#22d3ee"
                  strokeWidth="2"
                  className="hover:r-6 transition-all"
                />
              </g>
            );
          })}

          {/* Hover indicator crosshair & badge */}
          {hoveredPoint && (
            <g>
              <line
                x1={hoveredPoint.x}
                y1={padding.top}
                x2={hoveredPoint.x}
                y2={height - padding.bottom}
                stroke="#06b6d4"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r="5" fill="#22d3ee" />
            </g>
          )}
        </svg>

        {/* Tooltip Overlay */}
        {hoveredPoint && (
          <div
            className="absolute z-20 pointer-events-none bg-zinc-950/95 border border-zinc-700/80 rounded-md px-3 py-2 text-sm font-mono shadow-xl text-zinc-200 backdrop-blur"
            style={{
              left: `${Math.min(hoveredPoint.x + 10, width - 200)}px`,
              top: `${Math.max(10, hoveredPoint.y - 45)}px`,
            }}
          >
            <div className="font-semibold text-cyan-400">Step {hoveredPoint.index} ({hoveredPoint.timePct.toFixed(0)}% Horizon)</div>
            <div>Target Rem: <span className="text-zinc-100">{Math.round(hoveredPoint.targetRem).toLocaleString()} shs</span></div>
            <div>Actual Rem: <span className="text-amber-400">{Math.round(hoveredPoint.actualRem).toLocaleString()} shs</span></div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-zinc-400 font-mono pt-3 border-t border-zinc-800/80 mt-2">
        <span>Order Horizon: 09:30 - 16:00 EST ({nSlices} Interval Slices)</span>
        <span>Liquidated: {Math.max(0, Math.round(totalShares - actualTrajectory[actualTrajectory.length - 1])).toLocaleString()} / {Math.round(totalShares).toLocaleString()} Shares</span>
      </div>
    </div>
  );
};
