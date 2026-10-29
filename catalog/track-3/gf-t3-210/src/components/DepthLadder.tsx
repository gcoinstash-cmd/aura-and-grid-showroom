import React from 'react';
import { DepthLevel, UserChildOrder } from '../types/microstructure';
import { User, Eye } from 'lucide-react';

interface DepthLadderProps {
  bids: DepthLevel[];
  asks: DepthLevel[];
  midPricePts: number;
  spreadPts: number;
  spreadBps: number;
  userOrder: UserChildOrder | null;
  onSelectPrice: (pricePts: number) => void;
}

export const DepthLadder: React.FC<DepthLadderProps> = ({
  bids,
  asks,
  midPricePts,
  spreadPts,
  spreadBps,
  userOrder,
  onSelectPrice,
}) => {
  // Max cumulative depth for bar width normalization
  const maxAskCum = asks.length > 0 ? asks[asks.length - 1].cumulativeUnits : 1;
  const maxBidCum = bids.length > 0 ? bids[bids.length - 1].cumulativeUnits : 1;
  const maxDepth = Math.max(maxAskCum, maxBidCum, 1);

  // We display asks descending down to the best ask (touch)
  const displayAsks = [...asks].reverse();

  return (
    <div className="flex flex-col h-full bg-[#090D18] border border-slate-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-white uppercase tracking-wider">
            Level 2 DOM Depth Ladder
          </h2>
        </div>
        <div className="text-sm font-mono text-slate-400">
          Click any level to populate ticket
        </div>
      </div>

      {/* Table Column Headers */}
      <div className="grid grid-cols-12 px-4 py-2 bg-slate-950 text-sm font-mono font-semibold text-slate-400 border-b border-slate-800/80">
        <div className="col-span-3 text-left">Price (pts)</div>
        <div className="col-span-3 text-right">Size (Units)</div>
        <div className="col-span-3 text-right">Total Depth</div>
        <div className="col-span-3 text-right">Orders</div>
      </div>

      {/* Scrollable Book Ladder Body */}
      <div className="flex-1 overflow-y-auto font-mono text-sm divide-y divide-slate-800/40">
        {/* ASKS (Sells) - Red/Rose */}
        <div className="flex flex-col">
          {displayAsks.map((ask) => {
            const hasUserOrder =
              userOrder &&
              userOrder.status === 'RESTING' &&
              userOrder.side === 'SELL' &&
              Math.abs(userOrder.pricePts - ask.pricePts) < 0.001;
            const barWidthPercent = Math.min(100, Math.round((ask.cumulativeUnits / maxDepth) * 100));

            const rowClass = 'group relative grid grid-cols-12 px-4 py-1.5 cursor-pointer transition-colors ' +
              (hasUserOrder ? 'bg-cyan-950/60 border-l-4 border-cyan-400' : 'hover:bg-slate-800/70');

            const orderCellText = hasUserOrder
              ? 'Pos ' + userOrder.queueIndex + '/' + userOrder.totalOrdersAtLevel
              : String(ask.orderCount);

            return (
              <div
                key={'ask-' + ask.pricePts}
                onClick={() => onSelectPrice(ask.pricePts)}
                className={rowClass}
              >
                {/* Visual Depth Bar Fill */}
                <div
                  className="absolute right-0 top-0 bottom-0 bg-rose-500/10 transition-all pointer-events-none group-hover:bg-rose-500/20"
                  style={{ width: barWidthPercent.toString() + '%' }}
                />

                {/* Price Column */}
                <div className="col-span-3 text-rose-400 font-bold tabular-nums z-10 flex items-center gap-1.5">
                  <span>{ask.pricePts.toFixed(2)}</span>
                  {hasUserOrder && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 bg-cyan-400 text-slate-950 rounded text-sm font-bold">
                      <User className="w-3.5 h-3.5" />
                      YOU
                    </span>
                  )}
                </div>

                {/* Size Column */}
                <div className="col-span-3 text-right text-slate-200 tabular-nums z-10">
                  {ask.units.toLocaleString()}
                </div>

                {/* Cumulative Depth */}
                <div className="col-span-3 text-right text-slate-400 tabular-nums z-10">
                  {ask.cumulativeUnits.toLocaleString()}
                </div>

                {/* Order Count / Position indicator */}
                <div className="col-span-3 text-right text-slate-400 tabular-nums z-10">
                  {orderCellText}
                </div>
              </div>
            );
          })}
        </div>

        {/* MID-PRICE & SPREAD RIBBON */}
        <div className="grid grid-cols-12 px-4 py-2.5 bg-slate-900/95 border-y border-cyan-500/30 my-0.5">
          <div className="col-span-6 flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-400">MID:</span>
            <span className="text-base font-bold font-mono text-white tabular-nums">
              {midPricePts.toFixed(2)} pts
            </span>
          </div>
          <div className="col-span-6 flex items-center justify-end gap-2 text-sm font-mono">
            <span className="text-slate-400">SPREAD:</span>
            <span className="font-bold text-cyan-400 tabular-nums">
              {spreadPts.toFixed(2)} pts ({spreadBps.toFixed(1)} bps)
            </span>
          </div>
        </div>

        {/* BIDS (Buys) - Green/Emerald */}
        <div className="flex flex-col">
          {bids.map((bid) => {
            const hasUserOrder =
              userOrder &&
              userOrder.status === 'RESTING' &&
              userOrder.side === 'BUY' &&
              Math.abs(userOrder.pricePts - bid.pricePts) < 0.001;
            const barWidthPercent = Math.min(100, Math.round((bid.cumulativeUnits / maxDepth) * 100));

            const rowClass = 'group relative grid grid-cols-12 px-4 py-1.5 cursor-pointer transition-colors ' +
              (hasUserOrder ? 'bg-cyan-950/60 border-l-4 border-cyan-400' : 'hover:bg-slate-800/70');

            const orderCellText = hasUserOrder
              ? 'Pos ' + userOrder.queueIndex + '/' + userOrder.totalOrdersAtLevel
              : String(bid.orderCount);

            return (
              <div
                key={'bid-' + bid.pricePts}
                onClick={() => onSelectPrice(bid.pricePts)}
                className={rowClass}
              >
                {/* Visual Depth Bar Fill */}
                <div
                  className="absolute right-0 top-0 bottom-0 bg-emerald-500/10 transition-all pointer-events-none group-hover:bg-emerald-500/20"
                  style={{ width: barWidthPercent.toString() + '%' }}
                />

                {/* Price Column */}
                <div className="col-span-3 text-emerald-400 font-bold tabular-nums z-10 flex items-center gap-1.5">
                  <span>{bid.pricePts.toFixed(2)}</span>
                  {hasUserOrder && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 bg-cyan-400 text-slate-950 rounded text-sm font-bold">
                      <User className="w-3.5 h-3.5" />
                      YOU
                    </span>
                  )}
                </div>

                {/* Size Column */}
                <div className="col-span-3 text-right text-slate-200 tabular-nums z-10">
                  {bid.units.toLocaleString()}
                </div>

                {/* Cumulative Depth */}
                <div className="col-span-3 text-right text-slate-400 tabular-nums z-10">
                  {bid.cumulativeUnits.toLocaleString()}
                </div>

                {/* Order Count / Position indicator */}
                <div className="col-span-3 text-right text-slate-400 tabular-nums z-10">
                  {orderCellText}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
