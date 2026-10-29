/**
 * APEX-208 High-Density Quantitative Option Chain Grid
 * Solved Newton-Raphson Implied Vol vs SABR Model Fit and Full Analytic Greeks.
 * Strict Zero-Dollar Compliance: Spot, strikes, premiums, and greeks rendered in pts, bps, or %.
 * Minimum 14px typography floor maintained across all table cells and headers.
 */

import React from 'react';
import { OptionQuote } from '../quant/types.ts';
import { Table, ArrowUpDown, Info } from 'lucide-react';

interface OptionChainGridProps {
  quotes: OptionQuote[];
  spot: number;
  maturity: number;
}

export const OptionChainGrid: React.FC<OptionChainGridProps> = ({
  quotes,
  spot,
  maturity
}) => {
  return (
    <div className="w-full bg-[#090D16] border border-slate-800 rounded-lg p-5 flex flex-col gap-4">
      {/* Table Header / Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Table className="w-5 h-5 text-cyan-400" />
            <span>OPTIONS CALIBRATION & RISK CHAIN</span>
          </h3>
          <p className="text-sm text-slate-400 mt-0.5">
            Vectorized Black-76 Inversion, SABR Discrepancy (bps), and Analytic First/Second-Order Greeks
          </p>
        </div>

        <div className="text-sm font-mono text-slate-300 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-md">
          {'Expiry: ' + (maturity * 365).toFixed(0) + ' Days (' + maturity.toFixed(3) + 'Y)'}
        </div>
      </div>

      {/* Primary Table Container */}
      <div className="w-full overflow-x-auto border border-slate-800 rounded-md">
        <table className="w-full text-left text-sm font-mono border-collapse tabular-nums">
          <thead>
            <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-300">
              <th className="py-3 px-3 font-semibold text-left">Strike (pts)</th>
              <th className="py-3 px-3 font-semibold text-right">Moneyness</th>
              <th className="py-3 px-3 font-semibold text-right">Mid (pts)</th>
              <th className="py-3 px-3 font-semibold text-right">Bid / Ask (pts)</th>
              <th className="py-3 px-3 font-semibold text-right text-cyan-400">Solved IV</th>
              <th className="py-3 px-3 font-semibold text-right text-violet-400">SABR IV</th>
              <th className="py-3 px-3 font-semibold text-right">Resid (bps)</th>
              <th className="py-3 px-3 font-semibold text-right text-emerald-400">Delta</th>
              <th className="py-3 px-3 font-semibold text-right">Gamma</th>
              <th className="py-3 px-3 font-semibold text-right text-amber-400">Vega (pts/%)</th>
              <th className="py-3 px-3 font-semibold text-right">Theta (pts/d)</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((q, idx) => {
              const isAtm = Math.abs(q.strike - spot) < (spot * 0.02);
              const absResidual = Math.abs(q.residualBps);

              return (
                <tr
                  key={idx}
                  className={
                    'border-b border-slate-800/60 transition-colors ' +
                    (isAtm
                      ? 'bg-cyan-950/20 font-semibold text-cyan-100 hover:bg-cyan-950/30'
                      : 'hover:bg-slate-900/40 text-slate-300')
                  }
                >
                  <td className="py-2.5 px-3 font-bold text-white">
                    {q.strike.toFixed(2)}
                    {isAtm && (
                      <span className="ml-2 text-sm text-cyan-400 font-sans font-normal">
                        ATM
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-400">
                    {(q.moneyness * 100).toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold text-white">
                    {q.marketMidPrice.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-400">
                    {q.bidPrice.toFixed(2) + ' / ' + q.askPrice.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold text-cyan-400">
                    {(q.solvedIV * 100).toFixed(2)}%
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold text-violet-400">
                    {(q.sabrIV * 100).toFixed(2)}%
                  </td>
                  <td
                    className={
                      'py-2.5 px-3 text-right font-semibold ' +
                      (absResidual < 10
                        ? 'text-emerald-400'
                        : absResidual < 25
                        ? 'text-slate-300'
                        : 'text-amber-400')
                    }
                  >
                    {(q.residualBps > 0 ? '+' : '') + q.residualBps}
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-400 font-medium">
                    {q.greeks.delta.toFixed(3)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-300 font-medium">
                    {q.greeks.gamma.toFixed(4)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-amber-400 font-medium">
                    {q.greeks.vega.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-400 font-medium">
                    {q.greeks.theta.toFixed(3)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Notes */}
      <div className="flex flex-wrap items-center justify-between text-sm text-slate-400 pt-2 border-t border-slate-800">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>All options quoted European style. Underlying Forward F = Spot e^(rT). Zero arbitrage bound enforced.</span>
        </div>
        <div className="font-mono text-slate-400">
          Root Solver: Newton-Raphson (Brenner-Subrahmanyam seed)
        </div>
      </div>
    </div>
  );
};
