/**
 * MetricCards Component
 * High-impact quant telemetry with text-2xl/text-3xl bold figures, tabular-nums,
 * strict 14px (text-sm) floor, and zero-dollar compliance.
 */

import React from 'react';
import { ShieldAlert, TrendingDown, Layers, CheckCircle2, AlertTriangle } from 'lucide-react';
import { RiskEvaluationResult, MonteCarloSummary, KupiecResult } from '../types/risk';

interface MetricCardsProps {
  risk: RiskEvaluationResult;
  monteCarlo: MonteCarloSummary;
  kupiec: KupiecResult;
  activeMethodology: 'evt' | 'cf' | 'hw';
  onSelectMethodology: (m: 'evt' | 'cf' | 'hw') => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  risk,
  monteCarlo,
  kupiec,
  activeMethodology,
  onSelectMethodology
}) => {
  // Determine current active metrics
  let activeVarUnits = risk.evtVarUnits;
  let activeVarPct = risk.evtVarPct;
  let activeEsUnits = risk.evtEsUnits;
  let activeEsPct = risk.evtEsPct;
  let methodLabel = "Extreme Value Theory (POT GPD)";

  if (activeMethodology === 'cf') {
    activeVarUnits = risk.cfVarUnits;
    activeVarPct = risk.cfVarPct;
    activeEsUnits = risk.cfEsUnits;
    activeEsPct = risk.cfEsPct;
    methodLabel = "Cornish-Fisher Expansion";
  } else if (activeMethodology === 'hw') {
    activeVarUnits = risk.hwVarUnits;
    activeVarPct = risk.hwVarPct;
    activeEsUnits = risk.hwEsUnits;
    activeEsPct = risk.hwEsPct;
    methodLabel = "Hull-White EWMA Historical";
  }

  // Format large integer with commas without dollar sign
  const formatUnits = (num: number) => {
    return Math.round(num).toLocaleString('en-US') + " Units";
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 my-4">
      
      {/* CARD 1: 99% VALUE AT RISK (VaR) */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-lg py-3 px-4 flex flex-col justify-between hover:border-slate-700 transition-colors shadow-sm h-full">
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-sm font-semibold tracking-wide text-slate-400 uppercase">
              99% 1-Day VaR ({activeMethodology.toUpperCase()})
            </span>
            <span className="p-1.5 rounded bg-cyan-950/60 text-cyan-400">
              <TrendingDown className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-bold font-mono tabular-nums tracking-tight text-cyan-400 mt-1">
            {formatUnits(activeVarUnits)}
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-sm text-slate-400">
          <span>Loss Cutoff:</span>
          <span className="font-mono font-semibold text-slate-200">
            {activeVarPct.toFixed(2) + "%"} of Portfolio
          </span>
        </div>
      </div>

      {/* CARD 2: EXPECTED SHORTFALL (CVaR) */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-lg py-3 px-4 flex flex-col justify-between hover:border-slate-700 transition-colors shadow-sm h-full">
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-sm font-semibold tracking-wide text-slate-400 uppercase">
              Expected Shortfall (ES_99)
            </span>
            <span className="p-1.5 rounded bg-rose-950/60 text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-bold font-mono tabular-nums tracking-tight text-rose-400 mt-1">
            {formatUnits(activeEsUnits)}
          </div>
        </div>
        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-sm text-slate-400">
          <span>Tail Severity:</span>
          <span className="font-mono font-semibold text-rose-300">
            {activeEsPct.toFixed(2) + "%"}
          </span>
        </div>
      </div>

      {/* CARD 3: EVT TAIL INDEX (xi) & SHAPE */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-lg py-3 px-4 flex flex-col justify-between hover:border-slate-700 transition-colors shadow-sm h-full">
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-sm font-semibold tracking-wide text-slate-400 uppercase">
              EVT Tail Index (xi)
            </span>
            <span className="p-1.5 rounded bg-purple-950/60 text-purple-400">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-bold font-mono tabular-nums tracking-tight text-purple-300 mt-1">
            {risk.evtTailIndexXi.toFixed(4)}
          </div>
        </div>
        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-sm text-slate-400">
          <span>Regime:</span>
          <span className="font-mono font-semibold text-purple-200">
            Fréchet Tail (ξ &gt; 0)
          </span>
        </div>
      </div>

      {/* CARD 4: BASEL TRAFFIC LIGHT / KUPIEC BACKTEST */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-lg py-3 px-4 flex flex-col justify-between hover:border-slate-700 transition-colors shadow-sm h-full">
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-sm font-semibold tracking-wide text-slate-400 uppercase">
              Basel Backtest Zone
            </span>
            <span className={"p-1.5 rounded " + (kupiec.baselZone === 'GREEN' ? "bg-emerald-950/60 text-emerald-400" : kupiec.baselZone === 'YELLOW' ? "bg-amber-950/60 text-amber-400" : "bg-rose-950/60 text-rose-400")}>
              {kupiec.baselZone === 'GREEN' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <div className={"text-3xl font-bold font-mono tracking-tight " + (kupiec.baselZone === 'GREEN' ? "text-emerald-400" : kupiec.baselZone === 'YELLOW' ? "text-amber-400" : "text-rose-400")}>
              {kupiec.baselZone} ZONE
            </div>
          </div>
        </div>
        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-sm text-slate-400">
          <span>Realized Breaches:</span>
          <span className="font-mono font-semibold text-slate-200">
            {kupiec.failures} / {kupiec.totalObs} Obs (p = {kupiec.pValue.toFixed(3)})
          </span>
        </div>
      </div>

    </div>
  );
};
