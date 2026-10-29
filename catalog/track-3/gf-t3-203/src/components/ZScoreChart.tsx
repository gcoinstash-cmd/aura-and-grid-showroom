import React, { useState } from 'react';
import { QuantEngineTelemetry } from '../engine/types';

interface ZScoreChartProps {
  history: QuantEngineTelemetry[];
}

export const ZScoreChart: React.FC<ZScoreChartProps> = ({ history }) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (history.length < 2) {
    return (
      <div className="h-64 flex items-center justify-center bg-slate-900 border border-slate-800 rounded text-slate-500 font-mono text-xs">
        Buffering initial Z-score stream...
      </div>
    );
  }

  const width = 800;
  const height = 240;
  const padTop = 20;
  const padBottom = 30;
  const padLeft = 45;
  const padRight = 20;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  // Fix vertical scale symmetric from -4.0 to +4.0 for institutional readability
  const yMin = -4.0;
  const yMax = 4.0;
  const effectiveRange = yMax - yMin;

  const getX = (index: number) => padLeft + (index / (history.length - 1)) * chartW;
  const getY = (val: number) => {
    const clamped = Math.max(yMin, Math.min(yMax, val));
    return padTop + chartH - ((clamped - yMin) / effectiveRange) * chartH;
  };

  const zeroY = getY(0);
  const entryShortY = getY(2.0);
  const exitUpperY = getY(0.5);
  const exitLowerY = getY(-0.5);
  const entryLongY = getY(-2.0);
  const stopUpperY = getY(3.5);
  const stopLowerY = getY(-3.5);

  const zScores = history.map((h) => h.welford.zScore);

  const zScorePath = zScores
    .map((z, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx).toFixed(1)} ${getY(z).toFixed(1)}`)
    .join(' ');

  const hoveredTick = hoverIndex !== null && history[hoverIndex] ? history[hoverIndex] : history[history.length - 1];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded p-4 font-mono text-xs flex flex-col justify-between">
      {/* Chart Title and Header Info */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] font-sans">
            Welford Rolling Z-Score & Trigger Bands
          </span>
          <span className="text-slate-500 text-[10px]">·</span>
          <span className="text-slate-400 text-[10px]">Z = (e_t - μ) / σ</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-rose-500 inline-block"></span>
            <span className="text-slate-400">Short: +2.0σ</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-emerald-500 inline-block"></span>
            <span className="text-slate-400">Long: -2.0σ</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Current:</span>
            <span
              className={`font-bold tabular-nums ${
                hoveredTick.welford.zScore <= -2.0
                  ? 'text-emerald-400'
                  : hoveredTick.welford.zScore >= 2.0
                  ? 'text-rose-400'
                  : 'text-slate-200'
              }`}
            >
              {hoveredTick.welford.zScore >= 0 ? `+${hoveredTick.welford.zScore.toFixed(2)}` : hoveredTick.welford.zScore.toFixed(2)}σ
            </span>
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
          {/* Overbought / Oversold Background Shading */}
          <rect
            x={padLeft}
            y={stopUpperY}
            width={chartW}
            height={entryShortY - stopUpperY}
            fill="#f43f5e"
            fillOpacity="0.04"
          />
          <rect
            x={padLeft}
            y={entryLongY}
            width={chartW}
            height={stopLowerY - entryLongY}
            fill="#10b981"
            fillOpacity="0.04"
          />

          {/* Stop Out Line (+3.5) */}
          <line x1={padLeft} y1={stopUpperY} x2={width - padRight} y2={stopUpperY} stroke="#b91c1c" strokeDasharray="3 3" />
          <text x={padLeft - 6} y={stopUpperY + 3} textAnchor="end" fill="#ef4444" fontSize="9" className="font-mono">
            +3.5
          </text>

          {/* Enter Short Spread Line (+2.0) */}
          <line x1={padLeft} y1={entryShortY} x2={width - padRight} y2={entryShortY} stroke="#f43f5e" strokeWidth="1.2" />
          <text x={padLeft - 6} y={entryShortY + 3} textAnchor="end" fill="#f43f5e" fontSize="9" className="font-mono font-semibold">
            +2.0
          </text>

          {/* Exit Reversion Band (+0.5 and -0.5) */}
          <line x1={padLeft} y1={exitUpperY} x2={width - padRight} y2={exitUpperY} stroke="#64748b" strokeDasharray="2 2" strokeOpacity="0.5" />
          <line x1={padLeft} y1={exitLowerY} x2={width - padRight} y2={exitLowerY} stroke="#64748b" strokeDasharray="2 2" strokeOpacity="0.5" />

          {/* Center Zero Line */}
          <line x1={padLeft} y1={zeroY} x2={width - padRight} y2={zeroY} stroke="#475569" strokeWidth="1" />
          <text x={padLeft - 6} y={zeroY + 3} textAnchor="end" fill="#94a3b8" fontSize="9" className="font-mono">
            0.0
          </text>

          {/* Enter Long Spread Line (-2.0) */}
          <line x1={padLeft} y1={entryLongY} x2={width - padRight} y2={entryLongY} stroke="#10b981" strokeWidth="1.2" />
          <text x={padLeft - 6} y={entryLongY + 3} textAnchor="end" fill="#10b981" fontSize="9" className="font-mono font-semibold">
            -2.0
          </text>

          {/* Stop Out Line (-3.5) */}
          <line x1={padLeft} y1={stopLowerY} x2={width - padRight} y2={stopLowerY} stroke="#b91c1c" strokeDasharray="3 3" />
          <text x={padLeft - 6} y={stopLowerY + 3} textAnchor="end" fill="#ef4444" fontSize="9" className="font-mono">
            -3.5
          </text>

          {/* Z-Score Path */}
          <path d={zScorePath} fill="none" stroke="#f8fafc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

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
                cy={getY(history[hoverIndex].welford.zScore)}
                r="4"
                fill="#f8fafc"
                stroke="#0f172a"
                strokeWidth="2"
              />
            </g>
          )}

          {/* Latest Point */}
          {hoverIndex === null && (
            <circle
              cx={getX(history.length - 1)}
              cy={getY(history[history.length - 1].welford.zScore)}
              r="3.5"
              fill={
                history[history.length - 1].welford.zScore <= -2.0
                  ? '#10b981'
                  : history[history.length - 1].welford.zScore >= 2.0
                  ? '#f43f5e'
                  : '#38bdf8'
              }
            />
          )}

          {/* Bottom baseline */}
          <line x1={padLeft} y1={height - padBottom} x2={width - padRight} y2={height - padBottom} stroke="#334155" />
          <text x={padLeft} y={height - 12} fill="#64748b" fontSize="9" className="font-mono">
            t - {history.length}
          </text>
          <text x={width - padRight} y={height - 12} textAnchor="end" fill="#64748b" fontSize="9" className="font-mono">
            Live Tick
          </text>
        </svg>
      </div>
    </div>
  );
};
