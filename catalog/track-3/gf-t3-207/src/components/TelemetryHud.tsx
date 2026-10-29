/**
 * GF-T3-207: Primary Quantitative Telemetry HUD
 * Large High-Contrast 24px+ Metric Readouts
 * Zero Third-Party Financial Marks | Zero Currency Symbols
 */

import React from 'react';
import { TelemetryState } from '../types/amm';
import { TrendingUp, Layers, Zap, Scale, BarChart3, Database } from 'lucide-react';

interface TelemetryHudProps {
  telemetry: TelemetryState;
}

export const TelemetryHud: React.FC<TelemetryHudProps> = ({ telemetry }) => {
  const formatUnits = (val: number): string => {
    if (val >= 1_000_000) {
      return (val / 1_000_000).toFixed(2) + 'M';
    } else if (val >= 1_000) {
      return (val / 1_000).toFixed(1) + 'K';
    }
    return val.toFixed(2);
  };

  const priceDivergencePct = ((telemetry.activePrice - telemetry.entryPrice) / telemetry.entryPrice) * 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
      
      {/* 1. Active Spot Price Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span>Active Spot Price</span>
          </div>
          <span
            className={'px-2.5 py-0.5 rounded text-sm font-semibold ' + (
              telemetry.tickInRange
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60'
                : 'bg-amber-950 text-amber-300 border border-amber-800/60'
            )}
          >
            {telemetry.tickInRange ? 'IN RANGE' : 'RANGE EXCEEDED'}
          </span>
        </div>

        <div className="my-1">
          <div className="text-3xl font-bold tracking-tight text-cyan-400 font-mono">
            {telemetry.activePrice.toFixed(4)} <span className="text-base text-cyan-600 font-normal">pts</span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-sm text-slate-400">
            <span>Entry: {telemetry.entryPrice.toFixed(4)} pts</span>
            <span className={priceDivergencePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              ({priceDivergencePct >= 0 ? '+' : ''}{priceDivergencePct.toFixed(2)}%)
            </span>
          </div>
        </div>

        <div className="text-sm text-slate-500 pt-2 border-t border-slate-800/80 font-mono">
          Interval: [{telemetry.priceLower.toFixed(2)} - {telemetry.priceUpper.toFixed(2)}] pts
        </div>
      </div>

      {/* 2. Dynamic Volatility-Scaled Fee Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Dynamic Pool Fee</span>
          </div>
          <span className="bg-amber-950 text-amber-300 border border-amber-800/60 px-2.5 py-0.5 rounded text-sm font-semibold">
            alpha = 1.50
          </span>
        </div>

        <div className="my-1">
          <div className="text-3xl font-bold tracking-tight text-amber-400 font-mono">
            {telemetry.dynamicFeeBps.toFixed(1)} <span className="text-base text-amber-600 font-normal">bps</span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-sm text-slate-400">
            <span>Rate: {(telemetry.dynamicFeeBps / 100).toFixed(3)}%</span>
            <span className="text-slate-500">|</span>
            <span>Floor: 5 bps</span>
          </div>
        </div>

        <div className="text-sm text-slate-500 pt-2 border-t border-slate-800/80 font-mono">
          Rolling Sigma: {(telemetry.rollingSigma * 100).toFixed(3)}%
        </div>
      </div>

      {/* 3. Impermanent Loss Closed-Form Metric */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <Scale className="w-4 h-4 text-rose-400" />
            <span>Impermanent Loss</span>
          </div>
          <span className="bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded text-sm font-semibold">
            Closed-Form
          </span>
        </div>

        <div className="my-1">
          <div className="text-3xl font-bold tracking-tight text-rose-400 font-mono">
            {telemetry.impermanentLossPct.toFixed(2)}%
          </div>
          <div className="text-sm text-slate-400 mt-1">
            IL(k) = (2 * sqrt(k) / (1 + k)) - 1
          </div>
        </div>

        <div className="text-sm text-slate-500 pt-2 border-t border-slate-800/80 font-mono">
          Ratio k: {(telemetry.activePrice / telemetry.entryPrice).toFixed(4)}x
        </div>
      </div>

      {/* 4. Capital Efficiency Multiplier */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <Layers className="w-4 h-4 text-violet-400" />
            <span>Capital Efficiency</span>
          </div>
          <span className="bg-violet-950 text-violet-300 border border-violet-800/60 px-2.5 py-0.5 rounded text-sm font-semibold">
            vs x*y=k
          </span>
        </div>

        <div className="my-1">
          <div className="text-3xl font-bold tracking-tight text-violet-400 font-mono">
            {telemetry.capitalEfficiencyMultiplier.toFixed(2)}x
          </div>
          <div className="text-sm text-slate-400 mt-1">
            CE = 1 / (1 - sqrt(p_a / p_b))
          </div>
        </div>

        <div className="text-sm text-slate-500 pt-2 border-t border-slate-800/80 font-mono">
          Depth Density: Concentrated
        </div>
      </div>

      {/* 5. Physical Reserves Held */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <Database className="w-4 h-4 text-slate-300" />
            <span>Pool Reserves</span>
          </div>
          <span className="bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded text-sm font-semibold">
            Physical
          </span>
        </div>

        <div className="my-1 space-y-1">
          <div className="flex items-center justify-between text-base font-semibold">
            <span className="text-slate-400">{telemetry.reserveAName}:</span>
            <span className="font-mono text-slate-200">{formatUnits(telemetry.realReserveA)} Units</span>
          </div>
          <div className="flex items-center justify-between text-base font-semibold">
            <span className="text-slate-400">{telemetry.reserveBName}:</span>
            <span className="font-mono text-slate-200">{formatUnits(telemetry.realReserveB)} Units</span>
          </div>
        </div>

        <div className="text-sm text-slate-500 pt-2 border-t border-slate-800/80 font-mono">
          Virtual Scalar L: {formatUnits(telemetry.liquidityL)}
        </div>
      </div>

      {/* 6. Cumulative Fee Accrual Yield */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-4 relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span>Accrued LP Fees</span>
          </div>
          <span className="bg-emerald-950 text-emerald-300 border border-emerald-800/60 px-2.5 py-0.5 rounded text-sm font-semibold">
            Yield Buffer
          </span>
        </div>

        <div className="my-1">
          <div className="text-3xl font-bold tracking-tight text-emerald-400 font-mono">
            +{formatUnits(telemetry.totalFeeAccrualA * telemetry.activePrice + telemetry.totalFeeAccrualB)} <span className="text-base text-emerald-600 font-normal">Units</span>
          </div>
          <div className="text-sm text-slate-400 mt-1">
            Swaps Executed: {telemetry.swapCount}
          </div>
        </div>

        <div className="text-sm text-slate-500 pt-2 border-t border-slate-800/80 font-mono">
          Volume: {formatUnits(telemetry.totalVolumeUnits)} Units
        </div>
      </div>

    </div>
  );
};
