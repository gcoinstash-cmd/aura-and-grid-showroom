/**
 * StressControls Component
 * Interactive quant stress test inject triggers:
 * 1. "Inject 2008-Style Vol Shock (+3.5x)"
 * 2. "Simulate Flash Liquidity Evaporation"
 * 3. "Trigger Tail Correlation Breakdown"
 * 4. "Reset Nominal Risk Regime"
 * Strict zero-dollar compliance & 14px floor.
 */

import React from 'react';
import { Flame, Droplets, Unlink, RotateCcw } from 'lucide-react';

interface StressControlsProps {
  volMultiplier: number;
  flashLiquidity: boolean;
  correlationBreakdown: boolean;
  onToggleVolShock: () => void;
  onToggleFlashLiquidity: () => void;
  onToggleCorrelationBreakdown: () => void;
  onResetNominal: () => void;
}

export const StressControls: React.FC<StressControlsProps> = ({
  volMultiplier,
  flashLiquidity,
  correlationBreakdown,
  onToggleVolShock,
  onToggleFlashLiquidity,
  onToggleCorrelationBreakdown,
  onResetNominal
}) => {
  const isVolShocked = volMultiplier > 1.5;
  const isStressed = isVolShocked || flashLiquidity || correlationBreakdown;

  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-lg p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 tracking-tight uppercase">
            Synthetic Regime Stress Matrix & Shock Injection
          </h2>
          <div className="text-sm text-slate-400 mt-0.5">
            Test tail risk robustness against historical macro crisis conditions
          </div>
        </div>
      </div>

      {/* ROW 1: 3-COLUMN BALANCED SHOCK GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 w-full">
        {/* SHOCK 1: VOLATILITY SHOCK */}
        <button
          onClick={onToggleVolShock}
          className={"min-h-[44px] px-4 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border " + 
            (isVolShocked
              ? "bg-rose-950/80 border-rose-500 text-rose-300 shadow-md shadow-rose-950/40"
              : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-slate-100"
            )}
        >
          <Flame className={"w-4 h-4 " + (isVolShocked ? "text-rose-400" : "text-slate-400")} />
          <span>2008 Vol Shock (+3.5x)</span>
        </button>

        {/* SHOCK 2: FLASH LIQUIDITY EVAPORATION */}
        <button
          onClick={onToggleFlashLiquidity}
          className={"min-h-[44px] px-4 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border " + 
            (flashLiquidity
              ? "bg-amber-950/80 border-amber-500 text-amber-300 shadow-md shadow-amber-950/40"
              : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-slate-100"
            )}
        >
          <Droplets className={"w-4 h-4 " + (flashLiquidity ? "text-amber-400" : "text-slate-400")} />
          <span>Flash Liquidity Evaporation</span>
        </button>

        {/* SHOCK 3: CORRELATION BREAKDOWN */}
        <button
          onClick={onToggleCorrelationBreakdown}
          className={"min-h-[44px] px-4 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border " + 
            (correlationBreakdown
              ? "bg-purple-950/80 border-purple-500 text-purple-300 shadow-md shadow-purple-950/40"
              : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-slate-100"
            )}
        >
          <Unlink className={"w-4 h-4 " + (correlationBreakdown ? "text-purple-400" : "text-slate-400")} />
          <span>Tail Correlation Breakdown</span>
        </button>
      </div>

      {/* ROW 2: CLEAN FLEX ALIGNMENT BAR */}
      <div className="flex items-center justify-between w-full mt-3 pt-2 border-t border-slate-800/80">
        {/* Left: Regime status indicator */}
        <div className="flex items-center gap-2">
          {isStressed ? (
            <div className="px-3 py-1.5 rounded-md text-sm font-bold bg-rose-950/80 border border-rose-500 text-rose-300 animate-pulse flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              <span>STRESS REGIME ENGAGED</span>
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-md text-sm font-semibold bg-slate-900 border border-slate-800 text-emerald-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Nominal Market Regime</span>
            </div>
          )}
        </div>

        {/* Right: Reset Nominal button docked on the right */}
        <button
          onClick={onResetNominal}
          disabled={!isStressed}
          className="min-h-[40px] px-4 py-2 rounded-lg text-sm font-bold bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 disabled:opacity-40 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset Nominal</span>
        </button>
      </div>
    </div>
  );
};
