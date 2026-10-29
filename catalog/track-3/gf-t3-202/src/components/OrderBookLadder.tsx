import React from 'react';
import { L2Snapshot, formatCurrency, formatQty, PRICE_SCALE } from '../types/apex';

interface OrderBookLadderProps {
  snapshot: L2Snapshot;
  onSelectPrice: (priceDecimal: number) => void;
}

export const OrderBookLadder: React.FC<OrderBookLadderProps> = ({
  snapshot,
  onSelectPrice,
}) => {
  // Max cumulative depth to calculate bar width percentages
  const maxAskDepth =
    snapshot.asks.length > 0
      ? snapshot.asks[snapshot.asks.length - 1].cumulativeVolumeMicros || 1
      : 1;
  const maxBidDepth =
    snapshot.bids.length > 0
      ? snapshot.bids[snapshot.bids.length - 1].cumulativeVolumeMicros || 1
      : 1;
  const maxDepth = Math.max(maxAskDepth, maxBidDepth, 1);

  // We display asks in reverse order (highest ask at top down to best ask at bottom)
  const reversedAsks = [...snapshot.asks].reverse();

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
      {/* Title & Metadata Strip */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-950/60">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-200">Level 2 Depth Ladder</span>
          <span className="text-xs text-slate-500 font-mono">
            Seq #{snapshot.sequenceNumber}
          </span>
        </div>
        <div className="text-xs text-slate-400 font-mono">
          Depth: {snapshot.bids.length + snapshot.asks.length} levels
        </div>
      </div>

      {/* Grid Headers */}
      <div className="grid grid-cols-4 px-3 py-1.5 text-[11px] font-medium text-slate-400 border-b border-slate-800 bg-slate-950/30 font-mono">
        <div>Price (pts)</div>
        <div className="text-right">Microunits</div>
        <div className="text-right">Size</div>
        <div className="text-right">Orders</div>
      </div>

      {/* Scrollable Ladder Area */}
      <div className="flex-1 flex flex-col justify-between overflow-y-auto font-mono text-xs select-none">
        {/* Asks (Sell Orders) */}
        <div className="flex flex-col justify-end min-h-[140px]">
          {reversedAsks.length === 0 ? (
            <div className="py-6 text-center text-slate-600 text-xs italic">
              No resting asks on book
            </div>
          ) : (
            reversedAsks.map((level) => {
              const barWidth = Math.min(
                100,
                Math.round(((level.cumulativeVolumeMicros || level.totalVolumeMicros) / maxDepth) * 100)
              );
              return (
                <div
                  key={`ask-${level.priceMicros}`}
                  onClick={() => onSelectPrice(level.priceMicros / PRICE_SCALE)}
                  className="relative grid grid-cols-4 px-3 py-0.5 hover:bg-rose-950/30 cursor-pointer transition-colors group"
                >
                  {/* Depth background bar */}
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-rose-500/10 pointer-events-none transition-all duration-150"
                    style={{ width: `${barWidth}%` }}
                  />
                  <div className="text-rose-400 font-semibold tabular-nums z-10">
                    {formatCurrency(level.priceMicros)}
                  </div>
                  <div className="text-right text-slate-500 tabular-nums z-10 text-[11px]">
                    {level.priceMicros.toLocaleString()}
                  </div>
                  <div className="text-right text-slate-300 tabular-nums z-10">
                    {formatQty(level.totalVolumeMicros)}
                  </div>
                  <div className="text-right text-slate-500 tabular-nums z-10">
                    {level.orderCount}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Spread Strip */}
        <div className="flex items-center justify-between px-3 py-2 border-y border-slate-800 bg-slate-950/80 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider">Spread</span>
            <span className="font-semibold text-slate-100 tabular-nums">
              {snapshot.spreadMicros !== null ? formatCurrency(snapshot.spreadMicros) : '—'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 tabular-nums">
            {snapshot.spreadMicros !== null
              ? `${(snapshot.spreadMicros).toLocaleString()} micros`
              : 'Book Crossed or Empty'}
          </div>
        </div>

        {/* Bids (Buy Orders) */}
        <div className="flex flex-col min-h-[140px]">
          {snapshot.bids.length === 0 ? (
            <div className="py-6 text-center text-slate-600 text-xs italic">
              No resting bids on book
            </div>
          ) : (
            snapshot.bids.map((level) => {
              const barWidth = Math.min(
                100,
                Math.round(((level.cumulativeVolumeMicros || level.totalVolumeMicros) / maxDepth) * 100)
              );
              return (
                <div
                  key={`bid-${level.priceMicros}`}
                  onClick={() => onSelectPrice(level.priceMicros / PRICE_SCALE)}
                  className="relative grid grid-cols-4 px-3 py-0.5 hover:bg-emerald-950/30 cursor-pointer transition-colors group"
                >
                  {/* Depth background bar */}
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-emerald-500/10 pointer-events-none transition-all duration-150"
                    style={{ width: `${barWidth}%` }}
                  />
                  <div className="text-emerald-400 font-semibold tabular-nums z-10">
                    {formatCurrency(level.priceMicros)}
                  </div>
                  <div className="text-right text-slate-500 tabular-nums z-10 text-[11px]">
                    {level.priceMicros.toLocaleString()}
                  </div>
                  <div className="text-right text-slate-300 tabular-nums z-10">
                    {formatQty(level.totalVolumeMicros)}
                  </div>
                  <div className="text-right text-slate-500 tabular-nums z-10">
                    {level.orderCount}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
