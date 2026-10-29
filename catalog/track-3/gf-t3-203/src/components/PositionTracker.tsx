import React from 'react';
import { AssetPairConfig, ClosedTrade, PositionState } from '../engine/types';

interface PositionTrackerProps {
  position: PositionState;
  closedTrades: ClosedTrade[];
  pairConfig: AssetPairConfig;
  currentPriceY: number;
  currentPriceX: number;
  currentSpread: number;
  currentZScore: number;
}

export const PositionTracker: React.FC<PositionTrackerProps> = ({
  position,
  closedTrades,
  pairConfig,
  currentPriceY,
  currentPriceX,
  currentSpread,
  currentZScore,
}) => {
  const totalRealizedPnL = closedTrades.reduce((acc, t) => acc + t.realizedPnL, 0);
  const winningTrades = closedTrades.filter((t) => t.realizedPnL > 0).length;
  const winRate = closedTrades.length > 0 ? (winningTrades / closedTrades.length) * 100 : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded p-4 font-mono text-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] font-sans">
            Active Position & Execution Ledger
          </span>
          <span className="text-slate-500 text-[10px]">·</span>
          <span className="text-slate-400 text-[10px]">
            {position.active ? '1 Active Hedged Pair' : 'No Open Exposure'}
          </span>
        </div>

        {/* Realized Performance Summary (Points format, zero currency symbols) */}
        <div className="flex items-center gap-4 text-[11px]">
          <div>
            <span className="text-slate-500">Cumulative PnL: </span>
            <span
              className={`font-semibold tabular-nums ${
                totalRealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {totalRealizedPnL >= 0 ? `+${totalRealizedPnL.toFixed(2)} pts` : `-${Math.abs(totalRealizedPnL).toFixed(2)} pts`}
            </span>
          </div>
          <span className="text-slate-700">|</span>
          <div>
            <span className="text-slate-500">Win Rate: </span>
            <span className="text-slate-200 font-semibold tabular-nums">
              {winRate.toFixed(1)}% ({winningTrades}/{closedTrades.length})
            </span>
          </div>
        </div>
      </div>

      {/* Active Position Card */}
      {position.active ? (
        <div className="bg-slate-950 border border-slate-800 rounded p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span
                className={`font-semibold text-xs px-2 py-0.5 rounded font-sans ${
                  position.side === 'LONG_SPREAD'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                }`}
              >
                {position.side === 'LONG_SPREAD' ? 'LONG SPREAD' : 'SHORT SPREAD'}
              </span>
              <span className="text-slate-300">
                {position.side === 'LONG_SPREAD'
                  ? `+1.0 ${pairConfig.assetY} · -${position.entryBeta.toFixed(4)} ${pairConfig.assetX}`
                  : `-1.0 ${pairConfig.assetY} · +${position.entryBeta.toFixed(4)} ${pairConfig.assetX}`}
              </span>
            </div>

            <div className="text-right">
              <span className="text-slate-500 text-[10px] uppercase font-sans mr-2">Unrealized PnL:</span>
              <span
                className={`text-sm font-bold tabular-nums ${
                  position.unrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {position.unrealizedPnL >= 0 ? `+${position.unrealizedPnL.toFixed(2)} pts` : `-${Math.abs(position.unrealizedPnL).toFixed(2)} pts`}
                {' '}
                <span className="text-xs font-normal">
                  ({position.unrealizedReturnPct >= 0 ? '+' : ''}{position.unrealizedReturnPct.toFixed(2)}%)
                </span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] pt-2 border-t border-slate-900 text-slate-400">
            <div>
              <span className="text-slate-500">Entry Spread:</span>{' '}
              <span className="text-slate-200 tabular-nums">{position.entrySpread.toFixed(2)} pts</span>
            </div>
            <div>
              <span className="text-slate-500">Current Spread:</span>{' '}
              <span className="text-slate-200 tabular-nums">{currentSpread.toFixed(2)} pts</span>
            </div>
            <div>
              <span className="text-slate-500">Entry Z-Score:</span>{' '}
              <span className="text-slate-200 tabular-nums">{position.entryZScore.toFixed(2)}σ</span>
            </div>
            <div>
              <span className="text-slate-500">Current Z-Score:</span>{' '}
              <span className="text-slate-200 tabular-nums">{currentZScore.toFixed(2)}σ</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-950/60 border border-slate-800/80 rounded p-4 text-center text-slate-500">
          <p className="text-slate-400 text-xs font-sans">No Active Position</p>
          <p className="text-[11px] text-slate-600 font-sans mt-0.5">
            Waiting for Welford Z-Score to breach entry thresholds (≤ -2.0 for Long, ≥ +2.0 for Short)
          </p>
        </div>
      )}

      {/* Closed Trades History */}
      <div>
        <div className="text-[11px] text-slate-400 uppercase tracking-wider font-sans mb-2">
          Closed Arbitrage Roundtrips ({closedTrades.length})
        </div>

        {closedTrades.length === 0 ? (
          <div className="text-slate-600 text-center py-4 text-xs font-sans">
            No completed roundtrip trades yet in this session.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-48 overflow-y-auto">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 font-normal">
                  <th className="py-1.5 px-2">ID</th>
                  <th className="py-1.5 px-2">Side</th>
                  <th className="py-1.5 px-2 text-right">Hedge Ratio (β)</th>
                  <th className="py-1.5 px-2 text-right">Entry Spread (pts)</th>
                  <th className="py-1.5 px-2 text-right">Exit Spread (pts)</th>
                  <th className="py-1.5 px-2 text-right">Realized PnL (pts)</th>
                  <th className="py-1.5 px-2">Exit Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {closedTrades.slice(0, 8).map((trade) => (
                  <tr key={trade.id} className="hover:bg-slate-800/30">
                    <td className="py-1.5 px-2 text-slate-500 font-mono text-[10px]">{trade.id}</td>
                    <td className="py-1.5 px-2">
                      <span className={trade.side === 'LONG_SPREAD' ? 'text-emerald-400' : 'text-rose-400'}>
                        {trade.side === 'LONG_SPREAD' ? 'LONG' : 'SHORT'}
                      </span>
                    </td>
                    <td className="py-1.5 px-2 text-right tabular-nums">{trade.hedgeRatio.toFixed(4)}</td>
                    <td className="py-1.5 px-2 text-right tabular-nums">{trade.entrySpread.toFixed(2)}</td>
                    <td className="py-1.5 px-2 text-right tabular-nums">{trade.exitSpread.toFixed(2)}</td>
                    <td
                      className={`py-1.5 px-2 text-right tabular-nums font-semibold ${
                        trade.realizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {trade.realizedPnL >= 0 ? `+${trade.realizedPnL.toFixed(2)} pts` : `-${Math.abs(trade.realizedPnL).toFixed(2)} pts`}
                    </td>
                    <td className="py-1.5 px-2 text-[10px] text-slate-400">
                      {trade.exitReason === 'EXIT_NEUTRAL' ? 'Reversion Exit' : 'Stop-Out'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
