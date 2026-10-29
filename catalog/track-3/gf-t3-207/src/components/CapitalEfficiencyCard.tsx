/**
 * GF-T3-207: Capital Efficiency & Constant Product Fallback Matrix
 * Quantitative Multiplier & Depth Conservation Analysis
 * Zero Third-Party Financial Marks | Zero Currency Symbols
 */

import React from 'react';
import { TelemetryState } from '../types/amm';
import { Layers, ShieldCheck, Zap } from 'lucide-react';

interface CapitalEfficiencyCardProps {
  telemetry: TelemetryState;
}

export const CapitalEfficiencyCard: React.FC<CapitalEfficiencyCardProps> = ({ telemetry }) => {
  const formatUnits = (val: number): string => {
    if (val >= 1_000_000) {
      return (val / 1_000_000).toFixed(2) + 'M';
    } else if (val >= 1_000) {
      return (val / 1_000).toFixed(1) + 'K';
    }
    return val.toFixed(2);
  };

  const concCapitalTotal = telemetry.realReserveA * telemetry.activePrice + telemetry.realReserveB;
  const flatCapitalTotal = telemetry.constantProductRequiredA * telemetry.activePrice + telemetry.constantProductRequiredB;
  const capitalSavingsPct = Math.max(0, ((flatCapitalTotal - concCapitalTotal) / flatCapitalTotal) * 100);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-100 uppercase tracking-wider">
              Capital Efficiency vs Uniform Pool (x * y = k)
            </h3>
            <span className="bg-violet-950 text-violet-300 border border-violet-800/60 px-2.5 py-0.5 rounded text-sm font-semibold">
              Multiplier {telemetry.capitalEfficiencyMultiplier.toFixed(2)}x
            </span>
          </div>
          <span className="text-sm text-slate-400 font-mono">
            Analytical Invariant Comparison
          </span>
        </div>

        {/* Side-by-Side Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          
          {/* Column A: APEX-207 Concentrated Liquidity */}
          <div className="bg-violet-950/20 border border-violet-800/40 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-violet-300 uppercase tracking-wide">
                APEX-207 Concentrated Pool
              </span>
              <span className="bg-violet-900/60 text-violet-300 px-2 py-0.5 rounded text-sm font-mono font-bold">
                Active Architecture
              </span>
            </div>

            <div className="space-y-2 text-sm mt-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Total Capital Committed:</span>
                <span className="font-mono text-slate-100 font-bold">{formatUnits(concCapitalTotal)} Units</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Physical {telemetry.reserveAName}:</span>
                <span className="font-mono text-violet-300 font-semibold">{formatUnits(telemetry.realReserveA)} Units</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Physical {telemetry.reserveBName}:</span>
                <span className="font-mono text-violet-300 font-semibold">{formatUnits(telemetry.realReserveB)} Units</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-violet-900/40">
                <span className="text-slate-400">Slippage Mitigation:</span>
                <span className="font-mono text-emerald-400 font-bold">-{capitalSavingsPct.toFixed(1)}% vs Uniform</span>
              </div>
            </div>
          </div>

          {/* Column B: Classical Full-Range Constant Product */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-slate-400 uppercase tracking-wide">
                Classical Constant Product (x * y = k)
              </span>
              <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-sm font-mono">
                Full Spectrum (0, inf)
              </span>
            </div>

            <div className="space-y-2 text-sm mt-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Required Capital for Same Depth:</span>
                <span className="font-mono text-slate-300 font-bold">{formatUnits(flatCapitalTotal)} Units</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Required {telemetry.reserveAName}:</span>
                <span className="font-mono text-slate-400">{formatUnits(telemetry.constantProductRequiredA)} Units</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Required {telemetry.reserveBName}:</span>
                <span className="font-mono text-slate-400">{formatUnits(telemetry.constantProductRequiredB)} Units</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-slate-400">Capital Idle / Dormant:</span>
                <span className="font-mono text-rose-400 font-semibold">95%+ Outside Active Band</span>
              </div>
            </div>
          </div>

        </div>

        {/* Analytical Takeaway Banner */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-md p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-2 text-slate-300">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>
              Achieves <strong className="text-cyan-300">{telemetry.capitalEfficiencyMultiplier.toFixed(2)}x</strong> liquidity depth concentration, requiring <strong className="text-emerald-400">{capitalSavingsPct.toFixed(1)}% less capital</strong> to maintain identical market impact.
            </span>
          </div>
          <span className="font-mono text-slate-500 whitespace-nowrap">
            Formula: CE = 1 / (1 - sqrt(p_a/p_b))
          </span>
        </div>

      </div>
    </div>
  );
};
