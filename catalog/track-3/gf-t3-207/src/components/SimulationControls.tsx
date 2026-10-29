/**
 * GF-T3-207: Quantitative Stress Testing & Simulation Controls
 * Interactive Scenario Generators for Liquidity Positions
 * Zero Third-Party Financial Marks | Zero Currency Symbols
 */

import React, { useState } from 'react';
import { TelemetryState, SwapExecution } from '../types/amm';
import { ArrowLeftRight, TrendingUp, TrendingDown, Flame, RotateCcw, AlertTriangle } from 'lucide-react';

interface SimulationControlsProps {
  telemetry: TelemetryState;
  onSwapAForB: (amountA: number) => SwapExecution;
  onSwapBForA: (amountB: number) => SwapExecution;
  onPriceShift: (targetPrice: number) => void;
  onVolatilitySpike: (multiplier: number) => void;
  onReset: () => void;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  telemetry,
  onSwapAForB,
  onSwapBForA,
  onPriceShift,
  onVolatilitySpike,
  onReset,
}) => {
  const [swapAmount, setSwapAmount] = useState<number>(100_000);
  const [swapDirection, setSwapDirection] = useState<'A_TO_B' | 'B_TO_A'>('A_TO_B');
  const [lastExecution, setLastExecution] = useState<SwapExecution | null>(null);

  const handleExecuteSwap = () => {
    if (swapAmount <= 0) return;
    try {
      if (swapDirection === 'A_TO_B') {
        const res = onSwapAForB(swapAmount);
        setLastExecution(res);
      } else {
        const res = onSwapBForA(swapAmount);
        setLastExecution(res);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickSwap = (amount: number, dir: 'A_TO_B' | 'B_TO_A') => {
    setSwapAmount(amount);
    setSwapDirection(dir);
    if (dir === 'A_TO_B') {
      const res = onSwapAForB(amount);
      setLastExecution(res);
    } else {
      const res = onSwapBForA(amount);
      setLastExecution(res);
    }
  };

  const handlePriceShiftPct = (pctDelta: number) => {
    const target = +(telemetry.activePrice * (1.0 + pctDelta)).toFixed(4);
    onPriceShift(target);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-100 uppercase tracking-wider">
              Stress Testing & Execution Simulation
            </h3>
            <span className="bg-amber-950 text-amber-300 border border-amber-800/60 px-2.5 py-0.5 rounded text-sm font-semibold">
              Live Mock Kernel
            </span>
          </div>
          <span className="text-sm font-mono text-slate-400">
            {telemetry.reserveAName} &lt;--&gt; {telemetry.reserveBName}
          </span>
        </div>

        {/* Primary Simulation Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          
          {/* Action 1: Execute 100K Swap A -> B */}
          <button
            onClick={() => handleQuickSwap(100_000, 'A_TO_B')}
            className="min-h-[44px] px-5 py-2.5 text-base font-bold bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-slate-950 rounded-md transition-all shadow-md shadow-cyan-600/20 flex items-center justify-center gap-2"
          >
            <ArrowLeftRight className="w-5 h-5 text-slate-950" />
            <span>Execute 100K Swap (A-&gt;B)</span>
          </button>

          {/* Action 2: Execute 250K Swap B -> A */}
          <button
            onClick={() => handleQuickSwap(250_000, 'B_TO_A')}
            className="min-h-[44px] px-5 py-2.5 text-base font-bold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 rounded-md transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeftRight className="w-5 h-5 text-cyan-400" />
            <span>Execute 250K Swap (B-&gt;A)</span>
          </button>

          {/* Action 3: Trigger Volatility Spike */}
          <button
            onClick={() => onVolatilitySpike(2.5)}
            className="min-h-[44px] px-5 py-2.5 text-base font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 rounded-md transition-all shadow-md shadow-amber-500/10 flex items-center justify-center gap-2"
          >
            <Flame className="w-5 h-5 text-amber-400" />
            <span>Trigger Volatility Spike (+2.5x Fees)</span>
          </button>

          {/* Action 4: Reset Pool */}
          <button
            onClick={onReset}
            className="min-h-[44px] px-5 py-2.5 text-base font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-md transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5 text-slate-400" />
            <span>Reset to Baseline State</span>
          </button>
        </div>

        {/* Custom Swap Input & Direction Toggle */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4 mb-5">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            
            {/* Input Direction */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-400">Direction:</span>
              <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-md">
                <button
                  onClick={() => setSwapDirection('A_TO_B')}
                  className={'px-3 py-1 text-sm font-semibold rounded ' + (
                    swapDirection === 'A_TO_B'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  )}
                >
                  {telemetry.reserveAName} &rarr; {telemetry.reserveBName}
                </button>
                <button
                  onClick={() => setSwapDirection('B_TO_A')}
                  className={'px-3 py-1 text-sm font-semibold rounded ' + (
                    swapDirection === 'B_TO_A'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  )}
                >
                  {telemetry.reserveBName} &rarr; {telemetry.reserveAName}
                </button>
              </div>
            </div>

            {/* Swap Amount Input */}
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <span className="text-sm font-semibold text-slate-400">Amount In:</span>
              <div className="relative flex-1">
                <input
                  type="number"
                  step="5000"
                  min="1000"
                  value={swapAmount}
                  onChange={(e) => setSwapAmount(Math.max(1, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-base font-mono font-bold text-slate-100 focus:outline-none focus:border-cyan-500"
                />
                <span className="absolute right-3 top-2.5 text-sm text-slate-500">Units</span>
              </div>
            </div>

            {/* Execute Button */}
            <button
              onClick={handleExecuteSwap}
              className="min-h-[44px] px-6 py-2.5 text-base font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-md transition-colors"
            >
              Simulate Swap
            </button>
          </div>

          {/* Last Swap Execution Telemetry Feedback */}
          {lastExecution && (
            <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm font-mono">
              <div className="text-slate-400">
                Out: <span className="text-emerald-400 font-bold">{lastExecution.amountOut.toFixed(2)} Units</span>
              </div>
              <div className="text-slate-400">
                Fee Paid: <span className="text-amber-400 font-bold">{lastExecution.feeDeducted.toFixed(2)} Units</span>
              </div>
              <div className="text-slate-400">
                Impact: <span className="text-cyan-400 font-bold">{lastExecution.priceImpactBps.toFixed(1)} bps</span>
              </div>
              <div className="text-slate-400">
                New Mark: <span className="text-slate-200 font-bold">{lastExecution.priceAfter.toFixed(4)} pts</span>
              </div>
            </div>
          )}
        </div>

        {/* Divergence Stress Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <span className="text-sm font-semibold text-slate-400">
            Simulate External Oracle Divergence:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handlePriceShiftPct(-0.50)}
              className="min-h-[44px] px-4 py-2 text-base font-semibold bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 rounded-md transition-colors flex items-center gap-1.5"
            >
              <TrendingDown className="w-4 h-4 text-rose-400" />
              <span>Simulate -50% Divergence</span>
            </button>
            <button
              onClick={() => handlePriceShiftPct(-0.25)}
              className="min-h-[44px] px-4 py-2 text-base font-semibold bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 rounded-md transition-colors"
            >
              -25%
            </button>
            <button
              onClick={() => handlePriceShiftPct(0.25)}
              className="min-h-[44px] px-4 py-2 text-base font-semibold bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 rounded-md transition-colors"
            >
              +25%
            </button>
            <button
              onClick={() => handlePriceShiftPct(0.50)}
              className="min-h-[44px] px-4 py-2 text-base font-semibold bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/60 rounded-md transition-colors flex items-center gap-1.5"
            >
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Simulate +50% Divergence</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
