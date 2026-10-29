import React from 'react';
import { MicrostructureMetrics, HawkesState } from '../types/microstructure';

interface MetricsRibbonProps {
  metrics: MicrostructureMetrics;
  hawkes: HawkesState;
}

export const MetricsRibbon: React.FC<MetricsRibbonProps> = ({ metrics, hawkes }) => {
  const isObiPositive = metrics.orderBookImbalance >= 0;
  const obiPercent = Math.min(100, Math.max(0, (metrics.orderBookImbalance + 1) * 50));

  const obiTextClass = 'text-sm font-mono font-bold ' + (isObiPositive ? 'text-emerald-400' : 'text-rose-400');
  const obiBarClass = 'h-full transition-all duration-300 ' + (isObiPositive ? 'bg-emerald-500' : 'bg-rose-500');
  const hawkesBadgeClass = 'px-2 py-0.5 rounded text-sm font-mono font-bold ' + (
    hawkes.branchingRatio < 1.0
      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
      : 'bg-rose-950 text-rose-400 border border-rose-800'
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 p-4 bg-[#0A0E1A] border-b border-slate-800 text-slate-100">
      {/* 1. Mid-Price */}
      <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
        <div className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-1">
          Mid-Price
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold font-mono tracking-tight text-white tabular-nums">
            {metrics.midPricePts.toFixed(2)}
          </span>
          <span className="text-sm font-mono font-semibold text-slate-400">pts</span>
        </div>
        <div className="flex items-center gap-1.5 mt-1 text-sm font-mono text-slate-400">
          <span>Bid: {metrics.bestBidPts.toFixed(2)}</span>
          <span>·</span>
          <span>Ask: {metrics.bestAskPts.toFixed(2)}</span>
        </div>
      </div>

      {/* 2. Spread pts & bps */}
      <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
        <div className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-1">
          Bid-Ask Spread
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold font-mono tracking-tight text-cyan-400 tabular-nums">
            {metrics.spreadPts.toFixed(2)}
          </span>
          <span className="text-sm font-mono font-semibold text-slate-400">pts</span>
        </div>
        <div className="flex items-center gap-1 mt-1 text-sm font-mono text-cyan-300">
          <span>({metrics.spreadBps.toFixed(1)} bps)</span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-400">Tight Liquidity</span>
        </div>
      </div>

      {/* 3. Order Book Imbalance (OBI) */}
      <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">
            Book Imbalance (OBI)
          </span>
          <span className={obiTextClass}>
            {metrics.orderBookImbalance > 0 ? '+' : ''}{metrics.orderBookImbalance.toFixed(3)}
          </span>
        </div>
        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mt-2 flex">
          <div
            className={obiBarClass}
            style={{ width: obiPercent.toFixed(1) + '%' }}
          />
        </div>
        <div className="flex justify-between items-center mt-2 text-sm font-mono text-slate-400">
          <span>Bid Pressure</span>
          <span>Ask Pressure</span>
        </div>
      </div>

      {/* 4. Kyle's Lambda (Permanent Impact) */}
      <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
        <div className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-1">
          Kyle&apos;s Lambda (Impact)
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tracking-tight text-amber-400 tabular-nums">
            {metrics.kylesLambda.toFixed(5)}
          </span>
        </div>
        <div className="mt-1 text-sm font-mono text-slate-400">
          pts / kUnits permanent impact
        </div>
      </div>

      {/* 5. Hawkes Intensity & Branching Ratio */}
      <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">
            Hawkes Intensity
          </span>
          <span className={hawkesBadgeClass}>
            eta: {hawkes.branchingRatio.toFixed(2)}
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
            {hawkes.currentIntensity.toFixed(2)}
          </span>
          <span className="text-sm font-mono text-slate-400">events/sec</span>
        </div>
        <div className="mt-1 text-sm font-mono text-slate-400">
          {hawkes.branchingRatio < 1.0 ? 'Sub-Critical (Stable)' : 'Super-Critical Risk'}
        </div>
      </div>

      {/* 6. Amihud Illiquidity & VWAP */}
      <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
        <div className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-1">
          Amihud Ratio & VWAP
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tracking-tight text-slate-200 tabular-nums">
            {metrics.vwapPts.toFixed(2)}
          </span>
          <span className="text-sm font-mono font-semibold text-slate-400">VWAP pts</span>
        </div>
        <div className="mt-1 text-sm font-mono text-slate-400">
          Amihud: {metrics.amihudRatio.toFixed(5)} pts/Unit
        </div>
      </div>
    </div>
  );
};
