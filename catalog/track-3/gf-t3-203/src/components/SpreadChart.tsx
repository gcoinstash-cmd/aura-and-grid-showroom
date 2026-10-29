import React, { useState } from 'react';
import { QuantEngineTelemetry } from '../engine/types';

interface SpreadChartProps {
  history: QuantEngineTelemetry[];
  pairName: string;
}

export const SpreadChart: React.FC<SpreadChartProps> = ({ history, pairName }) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (history.length < 2) {
    return (
      <div className="h-64 flex items-center justify-center bg-slate-900 border border-slate-800 rounded text-slate-500 font-mono text-xs">
        Buffering initial tick stream...
      </div>
    );
  }

  // Dimensions
  const width = 800;
  const height = 240;
  const padTop = 20;
  const padBottom = 30;
  const padLeft = 55;
  const padRight = 20;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  // Extract spreads and bounds
  const spreads = history.map((h) => h.kalman.spread);
  const welfordMeans = history.map((h) => h.welford.mean);
  const welfordStdevs = history.map((h) => h.welford.stdev);

  let minVal = Math.min(...spreads);
  let maxVal = Math.max(...spreads);

  // Expand bounds to include +/- 2 sigma from latest Welford
  const latestMean = welfordMeans[welfordMeans.length - 1];
  const latestStdev = welfordStdevs[welfordStdevs.length - 1];
  minVal = Math.min(minVal, latestMean - 2.2 * latestStdev, -5.0);
  maxVal = Math.max(maxVal, latestMean + 2.2 * latestStdev, 5.0);

  // Add 10% vertical padding
  const valRange = maxVal - minVal || 1.0;
  const yMin = minVal - valRange * 0.08;
  const yMax = maxVal + valRange * 0.08;
  const effectiveRange = yMax - yMin;

  const getX = (index: number) => padLeft + (index / (history.length - 1)) * chartW;
  const getY = (val: number) => padTop + chartH - ((val - yMin) / effectiveRange) * chartH;

  const zeroY = getY(0);

  // Generate path string
  const spreadPath = spreads
    .map((s, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx).toFixed(1)} ${getY(s).toFixed(1)}`)
    .join(' ');

  // Upper & lower +2 sigma envelope path
  const upperBandPath = history
    .map((h, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx).toFixed(1)} ${getY(h.welford.mean + 2 * h.welford.stdev).toFixed(1)}`)
    .join(' ');

  const lowerBandPath = history
    .slice()
    .reverse()
    .map((h, revIdx) => {
      const idx = history.length - 1 - revIdx;
      return `L ${getX(idx).toFixed(1)} ${getY(h.welford.mean - 2 * h.welford.stdev).toFixed(1)}`;
    })
    .join(' ');

  const envelopeAreaPath = `${upperBandPath} ${lowerBandPath} Z`;

  // Mean path
  const meanPath = history
    .map((h, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx).toFixed(1)} ${getY(h.welford.mean).toFixed(1)}`)
    .join(' ');

  // Y-axis tick intervals
  const yTicks = [
    yMin + effectiveRange * 0.15,
    yMin + effectiveRange * 0.5,
    yMin + effectiveRange * 0.85,
  ];

  const hoveredTick = hoverIndex !== null && history[hoverIndex] ? history[hoverIndex] : history[history.length - 1];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded p-4 font-mono text-xs flex flex-col justify-between">
      {/* Chart Title and Header Info */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] font-sans">
            Spread Residual vs Kalman Mean Band
          </span>
          <span className="text-slate-500 text-[10px]">·</span>
          <span className="text-slate-400 text-[10px]">e_t = Y_t - (β·X_t + α)</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-cyan-400 inline-block"></span>
            <span className="text-slate-400">Spread:</span>
            <span className="text-cyan-400 font-semibold tabular-nums">{hoveredTick.kalman.spread.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-slate-500 border-t border-dashed border-slate-400 inline-block"></span>
            <span className="text-slate-400">±2σ Band</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          onMouseLeave={() => setHoverIndex(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = ((e.clientX - rect.left) / rect.width) * width;
            if (relX >= padLeft && relX <= width - padRight) {
              const ratio = (relX - padLeft) / chartW;
              const idx = Math.min(history.length - 1, Math.max(0, Math.round(ratio * (history.length - 1))));
              setHoverIndex(idx);
            }
          }}
        >
          {/* Grid lines */}
          {yTicks.map((tickVal, i) => {
            const y = getY(tickVal);
            return (
              <g key={i}>
                <line x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke="#1e293b" strokeDasharray="3 3" />
                <text x={padLeft - 8} y={y + 3} textAnchor="end" fill="#64748b" fontSize="9" className="font-mono">
                  {tickVal.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Zero Line */}
          {zeroY >= padTop && zeroY <= height - padBottom && (
            <line x1={padLeft} y1={zeroY} x2={width - padRight} y2={zeroY} stroke="#334155" strokeWidth="1" />
          )}

          {/* +/- 2 Sigma Confidence Band Area */}
          <path d={envelopeAreaPath} fill="#0ea5e9" fillOpacity="0.06" />
          <path d={upperBandPath} fill="none" stroke="#38bdf8" strokeOpacity="0.3" strokeDasharray="3 3" strokeWidth="1" />
          <path d={lowerBandPath} fill="none" stroke="#38bdf8" strokeOpacity="0.3" strokeDasharray="3 3" strokeWidth="1" />

          {/* Running Mean Line */}
          <path d={meanPath} fill="none" stroke="#64748b" strokeWidth="1" strokeDasharray="4 4" />

          {/* Spread Curve */}
          <path d={spreadPath} fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          {/* Hover Crosshair */}
          {hoverIndex !== null && (
            <g>
              <line
                x1={getX(hoverIndex)}
                y1={padTop}
                x2={getX(hoverIndex)}
                y2={height - padBottom}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <circle
                cx={getX(hoverIndex)}
                cy={getY(history[hoverIndex].kalman.spread)}
                r="4"
                fill="#06b6d4"
                stroke="#0f172a"
                strokeWidth="2"
              />
            </g>
          )}

          {/* Current Latest Point Pulse */}
          {hoverIndex === null && (
            <circle
              cx={getX(history.length - 1)}
              cy={getY(history[history.length - 1].kalman.spread)}
              r="3.5"
              fill="#22d3ee"
            />
          )}

          {/* X Axis Baseline */}
          <line x1={padLeft} y1={height - padBottom} x2={width - padRight} y2={height - padBottom} stroke="#334155" />
          <text x={padLeft} y={height - 12} fill="#64748b" fontSize="9" className="font-mono">
            t - {history.length}
          </text>
          <text x={width - padRight} y={height - 12} textAnchor="end" fill="#64748b" fontSize="9" className="font-mono">
            Latest Tick
          </text>
        </svg>
      </div>
    </div>
  );
};
