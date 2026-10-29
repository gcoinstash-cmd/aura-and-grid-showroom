/**
 * GF-T3-209: APEX-209 Hardened Top Navigation
 * Compact 2-row layout with strict single-line flex constraints:
 * Row 1: Left inline title & badges + Right docked action cluster (Export Vector + Run 10k Paths)
 * Row 2: Subtitle "EVT POT · Cornish-Fisher · Hull-White EWMA · 10k Monte Carlo" + Right docked Confidence Level selector
 * Strict zero-dollar compliance
 */

import React from 'react';
import { Activity, RefreshCw, Download } from 'lucide-react';

export type AppTabType = 'distribution' | 'methodology' | 'backtest' | 'ledger' | 'spec';

interface TopNavProps {
  onResimulate: () => void;
  onExportRiskVector: () => void;
  isSimulating: boolean;
  alpha: number;
  onSelectAlpha: (alpha: number) => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  onResimulate,
  onExportRiskVector,
  isSimulating,
  alpha,
  onSelectAlpha
}) => {
  return (
    <header className="w-full bg-[#0E1524] border-b border-slate-800/80 px-4 sm:px-6 py-2.5 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col">
        
        {/* ROW 1: STRICT SINGLE LINE FLEX ROW */}
        <div className="flex items-center justify-between gap-3 w-full">
          
          {/* Left flex-group: Title, badge, and pill all inline on ONE single line */}
          <div className="flex items-center gap-2 shrink-0 whitespace-nowrap overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-7 h-7 rounded bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/20">
                <Activity className="w-4 h-4 text-slate-950 font-bold" />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-100 font-mono">
                APEX-209
              </span>
            </div>

            <span className="px-2.5 py-0.5 text-sm font-semibold rounded-md bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 whitespace-nowrap shrink-0">
              VaR / ES Risk Engine
            </span>

            <span className="px-2 py-0.5 text-sm font-semibold rounded-md bg-slate-800 border border-slate-700 text-slate-300 whitespace-nowrap shrink-0">
              Track 3
            </span>
          </div>

          {/* Right flex-group: Action buttons docked on far right */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onExportRiskVector}
              className="min-h-[40px] px-3 py-1.5 text-sm font-bold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 transition-all rounded-lg flex items-center gap-1.5 whitespace-nowrap cursor-pointer shadow-sm hover:text-slate-100 shrink-0"
              title="Download JSON risk vector with EVT parameters, factor allocations, and SHA-256 block hash"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Export Vector</span>
            </button>

            <button
              onClick={onResimulate}
              disabled={isSimulating}
              className="min-h-[40px] px-3.5 py-1.5 text-sm font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 transition-all rounded-lg shadow-md shadow-cyan-500/20 flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0"
            >
              <RefreshCw className={"w-4 h-4 " + (isSimulating ? "animate-spin" : "")} />
              <span>{isSimulating ? "Calculating..." : "Run 10k Paths"}</span>
            </button>
          </div>

        </div>

        {/* ROW 2: SUBTITLE (LEFT) + CONFIDENCE SELECTOR (RIGHT) */}
        <div className="flex items-center justify-between gap-3 w-full mt-2 pt-2 border-t border-slate-800/60">
          
          {/* Left: Subtitle */}
          <div className="text-xs sm:text-sm text-slate-400 font-mono truncate shrink min-w-0">
            EVT POT · Cornish-Fisher · Hull-White · 10k Monte Carlo
          </div>

          {/* Right: Confidence Selector */}
          <div className="flex items-center gap-2 text-sm text-slate-300 shrink-0">
            <span className="font-medium text-slate-400 text-xs sm:text-sm">Confidence (α):</span>
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg shrink-0">
              {[0.95, 0.99, 0.995].map((lvl) => {
                const isActive = alpha === lvl;
                return (
                  <button
                    key={lvl}
                    onClick={() => onSelectAlpha(lvl)}
                    className={"px-2.5 py-0.5 rounded-md text-xs sm:text-sm font-bold font-mono transition-all cursor-pointer " +
                      (isActive
                        ? "bg-cyan-400 text-slate-950 shadow-sm shadow-cyan-400/20"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                      )}
                  >
                    {(lvl * 100).toFixed(1) + "%"}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </header>
  );
};
