/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Activity } from 'lucide-react';
import { RebalanceExecution } from '../types';

interface SpreadChartProps {
  spreadHistory: number[];
  zScore: number;
  hedgeRatio: number;
  zEntry: number;
  rebalanceEvents?: RebalanceExecution[];
}

export const SpreadChart: React.FC<SpreadChartProps> = ({
  spreadHistory,
  zScore,
  hedgeRatio,
  zEntry,
}) => {
  return (
    <div className="bg-[#0C1220] border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Activity className="h-5 w-5 text-cyan-400" />
          <h2 className="text-base font-bold text-slate-100">Rolling Residual Spread & Z-Score Bands</h2>
        </div>
        <div className="flex items-center gap-4 text-sm font-semibold text-slate-400">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-cyan-400" /> Spread</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Upper/Lower Bands (+{zEntry}σ)</span>
        </div>
      </div>

      <div className="flex-1 bg-slate-950/60 border border-slate-800/80 rounded-lg p-4 relative min-h-[300px] flex items-center justify-center">
        {spreadHistory && spreadHistory.length > 0 ? (
          <div className="w-full h-full flex flex-col justify-between">
            <div className="absolute top-3 right-4 font-mono text-sm text-cyan-400 bg-cyan-950/80 border border-cyan-800 px-3 py-1 rounded-md">
              Z: {zScore.toFixed(2)}σ | β: {hedgeRatio.toFixed(3)}
            </div>
            <svg className="w-full h-64 overflow-visible" viewBox="0 0 400 200" preserveAspectRatio="none">
              <line x1="0" y1="40" x2="400" y2="40" stroke="#F59E0B" strokeDasharray="4" strokeWidth="1.5" opacity="0.6" />
              <line x1="0" y1="100" x2="400" y2="100" stroke="#475569" strokeWidth="1" />
              <line x1="0" y1="160" x2="400" y2="160" stroke="#F59E0B" strokeDasharray="4" strokeWidth="1.5" opacity="0.6" />

              <polyline
                fill="none"
                stroke="#06B6D4"
                strokeWidth="2.5"
                points={spreadHistory.map((val, idx, arr) => {
                  const x = (idx / (arr.length - 1)) * 400;
                  const clampedZ = Math.max(-3.5, Math.min(3.5, val));
                  const y = 100 - (clampedZ / 3.5) * 60;
                  return `${x},${y}`;
                }).join(' ')}
              />
            </svg>
            <div className="flex justify-between text-sm text-slate-400 pt-2 border-t border-slate-800">
              <span>T - 40 periods</span>
              <span>Current Tick (t)</span>
            </div>
          </div>
        ) : (
          <div className="text-slate-400 text-sm font-semibold">Calibrating co-integration matrix...</div>
        )}
      </div>
    </div>
  );
};
