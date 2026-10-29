import React from 'react';
import { AssetPairConfig, QuantEngineTelemetry } from '../engine/types';

interface TelemetryRibbonProps {
  telemetry: QuantEngineTelemetry;
  pairConfig: AssetPairConfig;
}

export const TelemetryRibbon: React.FC<TelemetryRibbonProps> = ({ telemetry, pairConfig }) => {
  const { priceY, priceX, kalman, welford, ou, signal, position } = telemetry;
  const betaStdErr = Math.sqrt(Math.max(0, kalman.p00));

  const formatPrice = (val: number) => {
    if (val >= 1000) return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (val >= 10) return val.toFixed(2);
    return val.toFixed(4);
  };

  return (
    <div className="bg-slate-900/90 border-b border-slate-800 px-6 py-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs font-mono">
        {/* Metric 1: Pair Prices (Dimensionless pts) */}
        <div className="space-y-1">
          <div className="text-slate-500 uppercase tracking-wider text-[10px] font-sans">
            Pair Telemetry ({pairConfig.assetY} / {pairConfig.assetX})
          </div>
          <div className="text-slate-100 font-medium tabular-nums text-sm">
            {formatPrice(priceY)} <span className="text-slate-500 text-xs">/</span> {formatPrice(priceX)}{' '}
            <span className="text-[10px] text-slate-400 font-sans">pts</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Raw ratio: {(priceY / Math.max(0.0001, priceX)).toFixed(4)}
          </div>
        </div>

        {/* Metric 2: Dynamic Beta Hedge Ratio */}
        <div className="space-y-1">
          <div className="text-slate-500 uppercase tracking-wider text-[10px] font-sans">
            Dynamic Beta (Hedge Ratio)
          </div>
          <div className="text-cyan-400 font-semibold tabular-nums text-sm flex items-baseline gap-1.5">
            <span>{kalman.beta.toFixed(4)}</span>
            <span className="text-[11px] text-slate-500 font-normal">±{betaStdErr.toFixed(4)}</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Intercept Alpha: {kalman.alpha.toFixed(2)} pts
          </div>
        </div>

        {/* Metric 3: Live Spread vs Fair Value */}
        <div className="space-y-1">
          <div className="text-slate-500 uppercase tracking-wider text-[10px] font-sans">
            Spread Residual (e_t)
          </div>
          <div className={`font-semibold tabular-nums text-sm ${kalman.spread >= 0 ? 'text-amber-400' : 'text-blue-400'}`}>
            {kalman.spread >= 0 ? `+${kalman.spread.toFixed(2)}` : kalman.spread.toFixed(2)}{' '}
            <span className="text-[10px] font-sans">pts</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Fair value: {formatPrice(kalman.fairValueY)} pts
          </div>
        </div>

        {/* Metric 4: Rolling Z-Score (Welford O(1)) */}
        <div className="space-y-1">
          <div className="text-slate-500 uppercase tracking-wider text-[10px] font-sans">
            Welford Rolling Z-Score
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`font-bold tabular-nums text-sm ${
                welford.zScore <= -2.0
                  ? 'text-emerald-400'
                  : welford.zScore >= 2.0
                  ? 'text-rose-400'
                  : 'text-slate-200'
              }`}
            >
              {welford.zScore >= 0 ? `+${welford.zScore.toFixed(2)}` : welford.zScore.toFixed(2)}σ
            </span>
            <span className="text-[10px] text-slate-400 font-sans">
              {welford.zScore <= -2.0 ? '· Undervalued' : welford.zScore >= 2.0 ? '· Overvalued' : '· Normal'}
            </span>
          </div>
          <div className="text-[11px] text-slate-500">
            μ: {welford.mean.toFixed(2)} · σ: {welford.stdev.toFixed(2)}
          </div>
        </div>

        {/* Metric 5: Ornstein-Uhlenbeck Half-Life */}
        <div className="space-y-1">
          <div className="text-slate-500 uppercase tracking-wider text-[10px] font-sans">
            OU Half-Life (τ₁/₂)
          </div>
          <div className="text-slate-200 font-medium tabular-nums text-sm">
            {isFinite(ou.halfLife) ? `${ou.halfLife.toFixed(1)} ticks` : 'Non-Stationary (∞)'}
          </div>
          <div className="text-[11px] text-slate-500">
            θ: {ou.theta.toFixed(4)} · {ou.isMeanReverting ? 'Stationary' : 'Trending'}
          </div>
        </div>

        {/* Metric 6: Engine State / Active Position */}
        <div className="space-y-1">
          <div className="text-slate-500 uppercase tracking-wider text-[10px] font-sans">
            Portfolio State & Signal
          </div>
          <div className="text-sm font-semibold">
            {position.active ? (
              <span className={position.side === 'LONG_SPREAD' ? 'text-emerald-400' : 'text-rose-400'}>
                {position.side === 'LONG_SPREAD' ? 'LONG SPREAD' : 'SHORT SPREAD'}
              </span>
            ) : (
              <span className="text-slate-400">FLAT (MONITORING)</span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 tabular-nums">
            {position.active ? (
              <span className={position.unrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                Unrealized: {position.unrealizedPnL >= 0 ? `+${position.unrealizedPnL.toFixed(2)} pts` : `-${Math.abs(position.unrealizedPnL).toFixed(2)} pts`} ({position.unrealizedReturnPct >= 0 ? '+' : ''}{position.unrealizedReturnPct.toFixed(2)}%)
              </span>
            ) : (
              <span>Last emitted: {signal}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
