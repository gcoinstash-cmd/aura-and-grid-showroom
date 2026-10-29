/**
 * GF-T3-207: Quant Terminal Cockpit Header & Telemetry Ribbon
 * Refactored 2-Row Layout with High-Contrast Telemetry
 * Zero Third-Party Financial Marks | Zero Currency Symbols
 */

import React from 'react';
import { Activity, ShieldCheck, Terminal, FileCode2, RotateCcw, TrendingUp, Zap, Scale, Layers } from 'lucide-react';
import { PRESET_POOLS } from '../lib/amm-engine';
import { TelemetryState } from '../types/amm';

interface HeaderProps {
  currentPoolId: string;
  onSelectPool: (poolId: string) => void;
  onOpenSpecs: () => void;
  onResetPool: () => void;
  ledgerHeight: number;
  isLedgerValid: boolean;
  telemetry: TelemetryState;
}

export const Header: React.FC<HeaderProps> = ({
  currentPoolId,
  onSelectPool,
  onOpenSpecs,
  onResetPool,
  ledgerHeight,
  isLedgerValid,
  telemetry,
}) => {
  const formatUnits = (val: number): string => {
    if (val >= 1_000_000) {
      return (val / 1_000_000).toFixed(2) + 'M';
    } else if (val >= 1_000) {
      return (val / 1_000).toFixed(1) + 'K';
    }
    return val.toFixed(1);
  };

  const markRatioK = telemetry.activePrice / Math.max(0.0001, telemetry.entryPrice);

  return (
    <header className="border-b border-slate-800 bg-[#0A0E17]/95 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-6 py-3">
      <div className="max-w-[1720px] mx-auto flex flex-col gap-3">
        
        {/* Row 1: Engine Badge + Active Pool Selector | Ledger Status + Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 w-full">
          
          {/* Left: Engine Badge and Pool Pills */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 bg-slate-900/90 border border-cyan-500/30 px-3 py-1.5 rounded-lg shadow-sm whitespace-nowrap">
              <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
              <div className="flex items-center gap-1.5 font-mono">
                <span className="font-bold text-base text-cyan-300 tracking-wide">
                  GF-T3-207
                </span>
                <span className="text-slate-600">|</span>
                <span className="text-sm font-semibold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
                  APEX-207 CORE
                </span>
              </div>
            </div>

            {/* Active Pool Pill Selector */}
            <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-lg p-1 whitespace-nowrap">
              <span className="text-sm font-semibold text-slate-400 pl-2 pr-1">Pool:</span>
              {Object.keys(PRESET_POOLS).map((poolKey) => {
                const active = poolKey === currentPoolId;
                return (
                  <button
                    key={poolKey}
                    onClick={() => onSelectPool(poolKey)}
                    className={'px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ' + (
                      active
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    )}
                  >
                    {poolKey}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Grouped into a single flex row (gap-2) so nothing wraps onto an orphaned line */}
          <div className="flex flex-nowrap items-center gap-2 justify-end shrink-0">
            {/* Ledger Status Chip */}
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-md text-sm whitespace-nowrap">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span className="text-slate-400 font-mono">&gt;_ Ledger:</span>
              <span className="font-mono text-cyan-300 font-bold">{'Block #' + (ledgerHeight - 1)}</span>
              <span
                className={'px-2 py-0.5 rounded text-sm font-semibold ' + (
                  isLedgerValid
                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                    : 'bg-rose-950/80 text-rose-400 border border-rose-800/60 animate-pulse'
                )}
              >
                {isLedgerValid ? 'CHAIN VALID' : 'TAMPER DETECTED'}
              </span>
            </div>

            {/* Reset Button */}
            <button
              onClick={onResetPool}
              className="min-h-[44px] px-3.5 py-2 text-base font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
              title="Reset Pool State to Deterministic Baseline"
            >
              <RotateCcw className="w-4 h-4 text-slate-400" />
              <span>Reset</span>
            </button>

            {/* Transfer Suite & Spec Modal Trigger */}
            <button
              onClick={onOpenSpecs}
              className="min-h-[44px] px-4 py-2 text-base font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 rounded-md shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <FileCode2 className="w-5 h-5 text-slate-950" />
              <span>Transfer Suite & Spec</span>
            </button>
          </div>

        </div>

        {/* Row 2: Sleek 4-Column High-Contrast Telemetry Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2.5 border-t border-slate-800/80">
          
          {/* Card 1: Active Spot Price */}
          <div className="bg-slate-900/70 border border-slate-800/90 rounded-lg p-3 hover:border-cyan-500/30 transition-colors flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span>Active Spot Price</span>
              </div>
              <span
                className={'px-2 py-0.5 rounded text-sm font-semibold ' + (
                  telemetry.tickInRange
                    ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/60'
                    : 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                )}
              >
                {telemetry.tickInRange ? 'IN RANGE' : 'OUT OF RANGE'}
              </span>
            </div>

            <div className="text-2xl font-bold tracking-tight text-cyan-400 font-mono my-0.5">
              {telemetry.activePrice.toFixed(4)} <span className="text-sm text-cyan-600 font-normal">pts</span>
            </div>

            <div className="text-sm text-slate-400 font-mono">
              {'Interval: [' + telemetry.priceLower.toFixed(2) + ' - ' + telemetry.priceUpper.toFixed(2) + '] pts'}
            </div>
          </div>

          {/* Card 2: Dynamic Pool Fee */}
          <div className="bg-slate-900/70 border border-slate-800/90 rounded-lg p-3 hover:border-amber-500/30 transition-colors flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Dynamic Pool Fee</span>
              </div>
              <span className="bg-amber-950/80 text-amber-300 border border-amber-800/60 px-2 py-0.5 rounded text-sm font-semibold">
                alpha = 1.50
              </span>
            </div>

            <div className="text-2xl font-bold tracking-tight text-amber-400 font-mono my-0.5">
              {telemetry.dynamicFeeBps.toFixed(1)} <span className="text-sm text-amber-600 font-normal">bps</span>
              <span className="text-sm text-slate-400 font-normal ml-2">({(telemetry.dynamicFeeBps / 100).toFixed(3)}%)</span>
            </div>

            <div className="text-sm text-slate-400 font-mono">
              {'Rolling Sigma: ' + (telemetry.rollingSigma * 100).toFixed(3) + '%'}
            </div>
          </div>

          {/* Card 3: Impermanent Loss */}
          <div className="bg-slate-900/70 border border-slate-800/90 rounded-lg p-3 hover:border-rose-500/30 transition-colors flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                <Scale className="w-4 h-4 text-rose-400" />
                <span>Impermanent Loss</span>
              </div>
              <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-sm font-semibold">
                Closed-Form
              </span>
            </div>

            <div className="text-2xl font-bold tracking-tight text-rose-400 font-mono my-0.5">
              {telemetry.impermanentLossPct.toFixed(2)}%
            </div>

            <div className="text-sm text-slate-400 font-mono">
              {'Mark Ratio k: ' + markRatioK.toFixed(4) + 'x'}
            </div>
          </div>

          {/* Card 4: Capital Efficiency Multiplier */}
          <div className="bg-slate-900/70 border border-slate-800/90 rounded-lg p-3 hover:border-violet-500/30 transition-colors flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                <Layers className="w-4 h-4 text-violet-400" />
                <span>Capital Efficiency</span>
              </div>
              <span className="bg-violet-950/80 text-violet-300 border border-violet-800/60 px-2 py-0.5 rounded text-sm font-semibold">
                vs x*y=k
              </span>
            </div>

            <div className="text-2xl font-bold tracking-tight text-violet-400 font-mono my-0.5">
              {telemetry.capitalEfficiencyMultiplier.toFixed(2)}x
            </div>

            <div className="text-sm text-slate-400 font-mono truncate">
              {'Reserves: ' + formatUnits(telemetry.realReserveA) + ' A / ' + formatUnits(telemetry.realReserveB) + ' B'}
            </div>
          </div>

        </div>

      </div>
    </header>
  );
};
