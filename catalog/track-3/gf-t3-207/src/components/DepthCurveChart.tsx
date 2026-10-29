/**
 * GF-T3-207: Concentrated Liquidity Depth Curve Chart
 * Real-Time SVG Telemetry with Interactive Tick Boundaries
 * Zero Third-Party Financial Marks | Zero Currency Symbols
 */

import React, { useState } from 'react';
import { TelemetryState } from '../types/amm';
import { Sliders, Maximize2, ShieldAlert } from 'lucide-react';

interface DepthCurveChartProps {
  telemetry: TelemetryState;
  onUpdateBounds: (pLower: number, pUpper: number) => void;
}

export const DepthCurveChart: React.FC<DepthCurveChartProps> = ({
  telemetry,
  onUpdateBounds,
}) => {
  const [lowerInput, setLowerInput] = useState<string>(telemetry.priceLower.toFixed(2));
  const [upperInput, setUpperInput] = useState<string>(telemetry.priceUpper.toFixed(2));
  const [hoveredTick, setHoveredTick] = useState<{ price: number; depth: number } | null>(null);

  // Define chart coordinate system
  const minDomainPrice = Math.max(0.1, telemetry.activePrice * 0.4);
  const maxDomainPrice = telemetry.activePrice * 1.8;
  const chartWidth = 800;
  const chartHeight = 280;
  const paddingX = 40;
  const paddingY = 30;

  const priceToX = (price: number): number => {
    const clamped = Math.max(minDomainPrice, Math.min(maxDomainPrice, price));
    const ratio = (clamped - minDomainPrice) / (maxDomainPrice - minDomainPrice);
    return paddingX + ratio * (chartWidth - 2 * paddingX);
  };

  // Generate tick density bins across the spectrum
  const binCount = 48;
  const priceStep = (maxDomainPrice - minDomainPrice) / binCount;
  const bins: { price: number; depth: number; isConcentrated: boolean }[] = [];

  for (let i = 0; i < binCount; i++) {
    const binPrice = minDomainPrice + (i + 0.5) * priceStep;
    const isConcentrated = binPrice >= telemetry.priceLower && binPrice <= telemetry.priceUpper;

    // Concentrated bins have CE multiplier depth; outside bins have baseline virtual depth
    const depth = isConcentrated
      ? telemetry.capitalEfficiencyMultiplier * (1.0 - 0.25 * Math.pow((binPrice - telemetry.activePrice) / (telemetry.priceUpper - telemetry.priceLower), 2))
      : 1.0;

    bins.push({
      price: binPrice,
      depth: Math.max(0.2, depth),
      isConcentrated,
    });
  }

  const maxDepth = Math.max(...bins.map((b) => b.depth), 4);
  const depthToY = (depth: number): number => {
    const ratio = depth / maxDepth;
    return chartHeight - paddingY - ratio * (chartHeight - 2 * paddingY);
  };

  // Generate smooth SVG curve path for concentrated depth profile
  const curvePoints = bins.map((b) => ({
    x: priceToX(b.price),
    y: depthToY(b.depth),
  }));

  let pathD = 'M ' + priceToX(minDomainPrice) + ' ' + (chartHeight - paddingY);
  curvePoints.forEach((pt) => {
    pathD += ' L ' + pt.x + ' ' + pt.y;
  });
  pathD += ' L ' + priceToX(maxDomainPrice) + ' ' + (chartHeight - paddingY) + ' Z';

  const activePriceX = priceToX(telemetry.activePrice);
  const lowerX = priceToX(telemetry.priceLower);
  const upperX = priceToX(telemetry.priceUpper);

  const handleApplyBounds = () => {
    const pL = parseFloat(lowerInput);
    const pU = parseFloat(upperInput);
    if (!isNaN(pL) && !isNaN(pU) && pL > 0 && pU > pL) {
      onUpdateBounds(pL, pU);
    }
  };

  const setPresetInterval = (pct: number) => {
    const pL = +(telemetry.activePrice * (1 - pct)).toFixed(2);
    const pU = +(telemetry.activePrice * (1 + pct)).toFixed(2);
    setLowerInput(pL.toFixed(2));
    setUpperInput(pU.toFixed(2));
    onUpdateBounds(pL, pU);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5">
      
      {/* Header and Telemetry Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-100 uppercase tracking-wider">
              Concentrated Liquidity Depth Profile
            </h3>
            <span className="bg-violet-950 text-violet-300 border border-violet-800/60 px-2.5 py-0.5 rounded text-sm font-semibold font-mono">
              [p_a, p_b] Virtual Invariant
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-0.5">
            Real-time depth density curve with dynamic tick boundaries and mark price telemetry.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-cyan-400 shadow-sm shadow-cyan-500/50" />
            <span className="text-slate-300 font-medium">Spot Price</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-violet-500" />
            <span className="text-slate-300 font-medium">Concentrated Band</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-slate-700" />
            <span className="text-slate-400 font-medium">Full-Range x*y=k</span>
          </div>
        </div>
      </div>

      {/* SVG Depth Canvas */}
      <div className="relative border border-slate-800/80 rounded-md bg-[#070A11] p-2 overflow-hidden">
        <svg
          viewBox={'0 0 ' + chartWidth + ' ' + chartHeight}
          className="w-full h-64 md:h-72 select-none"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="concentratedGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.45" />
              <stop offset="85%" stopColor="#06B6D4" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#0A0E17" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="cyanLineGlow" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={paddingX}
            y1={chartHeight - paddingY}
            x2={chartWidth - paddingX}
            y2={chartHeight - paddingY}
            stroke="#1E293B"
            strokeWidth="1.5"
          />
          <line
            x1={paddingX}
            y1={paddingY}
            x2={chartWidth - paddingX}
            y2={paddingY}
            stroke="#1E293B"
            strokeDasharray="4 4"
            strokeWidth="1"
          />

          {/* Inactive Zone Shading (Outside [p_a, p_b]) */}
          <rect
            x={paddingX}
            y={paddingY}
            width={Math.max(0, lowerX - paddingX)}
            height={chartHeight - 2 * paddingY}
            fill="#0F172A"
            fillOpacity="0.4"
          />
          <rect
            x={upperX}
            y={paddingY}
            width={Math.max(0, chartWidth - paddingX - upperX)}
            height={chartHeight - 2 * paddingY}
            fill="#0F172A"
            fillOpacity="0.4"
          />

          {/* Active Range Highlight Area */}
          <rect
            x={lowerX}
            y={paddingY}
            width={Math.max(0, upperX - lowerX)}
            height={chartHeight - 2 * paddingY}
            fill="#8B5CF6"
            fillOpacity="0.06"
          />

          {/* Filled Area Depth Profile */}
          <path d={pathD} fill="url(#concentratedGrad)" />

          {/* Stepped Density Bins */}
          {bins.map((b, idx) => {
            const bx = priceToX(b.price - priceStep / 2);
            const bw = priceToX(b.price + priceStep / 2) - bx;
            const by = depthToY(b.depth);
            const bh = chartHeight - paddingY - by;

            return (
              <rect
                key={idx}
                x={bx + 1}
                y={by}
                width={Math.max(1, bw - 2)}
                height={Math.max(0, bh)}
                fill={b.isConcentrated ? '#8B5CF6' : '#334155'}
                fillOpacity={b.isConcentrated ? 0.35 : 0.20}
                stroke={b.isConcentrated ? '#A78BFA' : '#475569'}
                strokeWidth="0.5"
                className="cursor-pointer hover:fill-opacity-80 transition-opacity"
                onMouseEnter={() => setHoveredTick({ price: b.price, depth: b.depth })}
                onMouseLeave={() => setHoveredTick(null)}
              />
            );
          })}

          {/* Lower Bound p_a Vertical Line */}
          <line
            x1={lowerX}
            y1={paddingY - 10}
            x2={lowerX}
            y2={chartHeight - paddingY}
            stroke="#8B5CF6"
            strokeWidth="2"
            strokeDasharray="5 3"
          />
          <text
            x={lowerX}
            y={paddingY - 14}
            textAnchor="middle"
            fill="#A78BFA"
            className="text-sm font-mono font-bold"
          >
            {'p_a: ' + telemetry.priceLower.toFixed(2) + ' pts'}
          </text>

          {/* Upper Bound p_b Vertical Line */}
          <line
            x1={upperX}
            y1={paddingY - 10}
            x2={upperX}
            y2={chartHeight - paddingY}
            stroke="#8B5CF6"
            strokeWidth="2"
            strokeDasharray="5 3"
          />
          <text
            x={upperX}
            y={paddingY - 14}
            textAnchor="middle"
            fill="#A78BFA"
            className="text-sm font-mono font-bold"
          >
            {'p_b: ' + telemetry.priceUpper.toFixed(2) + ' pts'}
          </text>

          {/* Active Spot Price Line and Glowing Marker */}
          <line
            x1={activePriceX}
            y1={paddingY - 5}
            x2={activePriceX}
            y2={chartHeight - paddingY}
            stroke="#06B6D4"
            strokeWidth="2.5"
          />
          <circle
            cx={activePriceX}
            cy={depthToY(bins.find((b) => Math.abs(b.price - telemetry.activePrice) < priceStep)?.depth || 2.0)}
            r="6"
            fill="#06B6D4"
            className="animate-pulse"
          />
          <circle
            cx={activePriceX}
            cy={depthToY(bins.find((b) => Math.abs(b.price - telemetry.activePrice) < priceStep)?.depth || 2.0)}
            r="12"
            fill="none"
            stroke="#06B6D4"
            strokeWidth="1.5"
            strokeOpacity="0.4"
          />

          {/* Spot Price Label */}
          <text
            x={activePriceX}
            y={chartHeight - paddingY + 20}
            textAnchor="middle"
            fill="#22D3EE"
            className="text-sm font-mono font-bold"
          >
            {'Active: ' + telemetry.activePrice.toFixed(4) + ' pts'}
          </text>
        </svg>

        {/* Hovered Price Overlay Tooltip */}
        {hoveredTick && (
          <div className="absolute top-4 right-4 bg-slate-900/95 border border-cyan-500/40 px-3.5 py-2 rounded-md shadow-xl text-sm font-mono pointer-events-none">
            <div className="text-slate-400">Tick Mark: <span className="text-cyan-300 font-bold">{hoveredTick.price.toFixed(4)} pts</span></div>
            <div className="text-slate-400">Depth Scalar: <span className="text-violet-300 font-bold">{hoveredTick.depth.toFixed(2)}x</span></div>
          </div>
        )}
      </div>

      {/* Interactive Tick Boundary Adjustment Controls */}
      <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Quick Range Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-400 flex items-center gap-1.5 mr-1">
            <Sliders className="w-4 h-4 text-violet-400" />
            <span>Range Band:</span>
          </span>
          <button
            onClick={() => setPresetInterval(0.05)}
            className="min-h-[44px] px-3.5 py-2 text-base font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md transition-colors"
          >
            +/-5% (Ultra-Tight)
          </button>
          <button
            onClick={() => setPresetInterval(0.15)}
            className="min-h-[44px] px-3.5 py-2 text-base font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md transition-colors"
          >
            +/-15% (Institutional)
          </button>
          <button
            onClick={() => setPresetInterval(0.30)}
            className="min-h-[44px] px-3.5 py-2 text-base font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md transition-colors"
          >
            +/-30% (Standard)
          </button>
          <button
            onClick={() => setPresetInterval(0.50)}
            className="min-h-[44px] px-3.5 py-2 text-base font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md transition-colors"
          >
            +/-50% (Wide Volatility)
          </button>
        </div>

        {/* Manual Tick Bound Inputs */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5">
            <span className="text-sm font-mono text-violet-400">p_a:</span>
            <input
              type="number"
              step="0.01"
              value={lowerInput}
              onChange={(e) => setLowerInput(e.target.value)}
              className="w-24 bg-transparent text-base font-mono font-bold text-slate-100 focus:outline-none"
            />
            <span className="text-sm text-slate-500">pts</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5">
            <span className="text-sm font-mono text-violet-400">p_b:</span>
            <input
              type="number"
              step="0.01"
              value={upperInput}
              onChange={(e) => setUpperInput(e.target.value)}
              className="w-24 bg-transparent text-base font-mono font-bold text-slate-100 focus:outline-none"
            />
            <span className="text-sm text-slate-500">pts</span>
          </div>

          <button
            onClick={handleApplyBounds}
            className="min-h-[44px] px-5 py-2.5 text-base font-bold text-slate-900 bg-violet-400 hover:bg-violet-300 rounded-md transition-colors shadow-md shadow-violet-500/20"
          >
            Rebalance Range
          </button>
        </div>

      </div>

    </div>
  );
};
