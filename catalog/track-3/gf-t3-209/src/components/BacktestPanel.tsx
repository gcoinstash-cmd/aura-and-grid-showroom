/**
 * BacktestPanel Component
 * Regulatory backtesting suite implementing:
 * 1. Kupiec Proportion of Failures (POF) Likelihood Ratio test
 * 2. Christoffersen Independence test for breach clustering
 * 3. Basel Committee Traffic Light Framework (Green / Yellow / Red)
 * Strict zero-dollar compliance & 14px text floor.
 */

import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Sliders } from 'lucide-react';
import { KupiecResult, ChristoffersenResult } from '../types/risk';
import { evaluateKupiecTest, evaluateChristoffersenTest } from '../lib/quantMath';

interface BacktestPanelProps {
  kupiec: KupiecResult;
  christoffersen: ChristoffersenResult;
  onUpdateBreaches: (failures: number) => void;
}

export const BacktestPanel: React.FC<BacktestPanelProps> = ({
  kupiec,
  christoffersen,
  onUpdateBreaches
}) => {
  const [sliderVal, setSliderVal] = useState(kupiec.failures);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setSliderVal(val);
    onUpdateBreaches(val);
  };

  // Generate a mock 250-day visual breach strip
  const totalDays = 250;
  const breachDays: boolean[] = [];
  // Deterministically place failures
  for (let i = 0; i < totalDays; i++) {
    const interval = Math.floor(totalDays / Math.max(kupiec.failures, 1));
    breachDays.push(kupiec.failures > 0 && (i % interval === 0) && (breachDays.filter(Boolean).length < kupiec.failures));
  }

  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-lg p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-100 tracking-tight">
            Regulatory Model Validation & Backtest Suite (Basel Framework)
          </h2>
          <div className="text-sm text-slate-400 mt-0.5">
            Statistical hypothesis verification across 250 trading days at 99% 1-day confidence
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-3">
          <div className={"px-3 py-1 text-sm font-semibold rounded-md border flex items-center gap-2 " +
            (kupiec.baselZone === 'GREEN'
              ? "bg-emerald-950/60 border-emerald-500 text-emerald-400"
              : kupiec.baselZone === 'YELLOW'
              ? "bg-amber-950/60 border-amber-500 text-amber-400"
              : "bg-rose-950/60 border-rose-500 text-rose-400"
            )}
          >
            {kupiec.baselZone === 'GREEN' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>BASEL {kupiec.baselZone} ZONE</span>
          </div>
        </div>
      </div>

      {/* Grid of Statistical Tests */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* TEST 1: KUPIEC POF LIKELIHOOD RATIO */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-slate-200">
              1. Kupiec POF Likelihood Ratio Test
            </h3>
            <span className={"text-sm font-semibold " + (kupiec.isAccepted ? "text-emerald-400" : "text-rose-400")}>
              {kupiec.isAccepted ? "NULL HYPOTHESIS ACCEPTED" : "REJECTED (MODEL UNDER-REPRESENTATION)"}
            </span>
          </div>

          <div className="space-y-2 text-sm text-slate-300">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Total Backtest Days (N):</span>
              <span className="font-mono font-semibold">{kupiec.totalObs} days</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Nominal Expected Breaches (N * (1 - alpha)):</span>
              <span className="font-mono font-semibold">2.50 breaches</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Realized VaR Breaches (x):</span>
              <span className="font-mono font-bold text-cyan-400">{kupiec.failures} breaches</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Empirical Breach Rate (x / N):</span>
              <span className="font-mono font-semibold">{kupiec.empiricalRatePct.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Kupiec LR Statistic:</span>
              <span className="font-mono font-semibold">{kupiec.lrStat.toFixed(4)} (~ Chi^2(1))</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">p-value (Significance alpha = 0.05):</span>
              <span className={"font-mono font-bold " + (kupiec.pValue >= 0.05 ? "text-emerald-400" : "text-rose-400")}>
                {kupiec.pValue.toFixed(5)}
              </span>
            </div>
          </div>

          {/* Interactive Failure Sensitivity Slider */}
          <div className="mt-4 pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
              <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>Simulate Realized Breaches (x):</span>
              </span>
              <span className="font-mono text-cyan-400 font-bold">{sliderVal} / 250</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              step="1"
              value={sliderVal}
              onChange={handleSliderChange}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-sm text-slate-500 mt-1 font-mono">
              <span>0 (Green)</span>
              <span>4 (Green Limit)</span>
              <span>9 (Yellow Limit)</span>
              <span>20 (Red Zone)</span>
            </div>
          </div>
        </div>

        {/* TEST 2: CHRISTOFFERSEN INDEPENDENCE TEST */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-slate-200">
              2. Christoffersen Independence Test
            </h3>
            <span className={"text-sm font-semibold " + (christoffersen.isIndependent ? "text-emerald-400" : "text-amber-400")}>
              {christoffersen.isIndependent ? "INDEPENDENT (NO CLUSTERING)" : "BREACH CLUSTERING DETECTED"}
            </span>
          </div>

          <div className="space-y-2 text-sm text-slate-300">
            <div className="text-slate-400 mb-1">
              First-order Markov Transition Frequencies:
            </div>
            <div className="grid grid-cols-2 gap-2 text-center font-mono my-2">
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <div className="text-slate-400 text-sm">No-Breach -&gt; No-Breach (n00)</div>
                <div className="text-base font-bold text-slate-200">{christoffersen.n00}</div>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <div className="text-slate-400 text-sm">No-Breach -&gt; Breach (n01)</div>
                <div className="text-base font-bold text-cyan-400">{christoffersen.n01}</div>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <div className="text-slate-400 text-sm">Breach -&gt; No-Breach (n10)</div>
                <div className="text-base font-bold text-slate-200">{christoffersen.n10}</div>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <div className="text-slate-400 text-sm">Breach -&gt; Breach (n11)</div>
                <div className={"text-base font-bold " + (christoffersen.n11 > 0 ? "text-rose-400" : "text-slate-200")}>
                  {christoffersen.n11}
                </div>
              </div>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Christoffersen LR Statistic:</span>
              <span className="font-mono font-semibold">{christoffersen.lrStat.toFixed(4)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Independence p-value:</span>
              <span className="font-mono font-bold text-emerald-400">{christoffersen.pValue.toFixed(5)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Combined Coverage LR_cc (Kupiec + Christoffersen):</span>
              <span className="font-mono font-semibold">{(kupiec.lrStat + christoffersen.lrStat).toFixed(4)} (~ Chi^2(2))</span>
            </div>
          </div>
        </div>

      </div>

      {/* 250-Day Breach Visual Timeline */}
      <div className="mt-6 pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
          <span className="font-semibold text-slate-300">Realized 250-Day Backtest Observation Timeline:</span>
          <span>Each cell = 1 trading day</span>
        </div>
        <div className="flex flex-wrap gap-1 p-3 bg-slate-950 rounded-lg border border-slate-800/80">
          {breachDays.map((isBreach, i) => (
            <div
              key={i}
              title={"Day " + (i + 1) + ": " + (isBreach ? "VaR Breach Realized" : "Within 99% VaR Limit")}
              className={"w-2.5 h-4 rounded-xs transition-colors " +
                (isBreach ? "bg-rose-500 shadow-sm shadow-rose-500/50" : "bg-slate-800 hover:bg-slate-700")
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
};
