import React, { useState, useEffect } from 'react';
import { OrderSide, UserChildOrder } from '../types/microstructure';
import { Target, XCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

interface QueueTrackerCardProps {
  userOrder: UserChildOrder | null;
  bestBidPts: number;
  bestAskPts: number;
  midPricePts: number;
  selectedPricePts: number | null;
  onPlaceOrder: (side: OrderSide, pricePts: number, quantityUnits: number) => void;
  onCancelOrder: () => void;
}

export const QueueTrackerCard: React.FC<QueueTrackerCardProps> = ({
  userOrder,
  bestBidPts,
  bestAskPts,
  midPricePts,
  selectedPricePts,
  onPlaceOrder,
  onCancelOrder,
}) => {
  const [side, setSide] = useState<OrderSide>('BUY');
  const [price, setPrice] = useState<number>(bestBidPts || 100.0);
  const [quantity, setQuantity] = useState<number>(5000);

  // Sync when user clicks a price level on DOM
  useEffect(() => {
    if (selectedPricePts !== null) {
      setPrice(selectedPricePts);
      if (selectedPricePts >= (bestAskPts || 100.0)) {
        setSide('SELL');
      } else {
        setSide('BUY');
      }
    }
  }, [selectedPricePts, bestAskPts]);

  const handleQuickPrice = (type: 'BID' | 'MID' | 'ASK') => {
    if (type === 'BID') setPrice(bestBidPts);
    if (type === 'MID') setPrice(Number(midPricePts.toFixed(2)));
    if (type === 'ASK') setPrice(bestAskPts);
  };

  const handleStepPrice = (step: number) => {
    setPrice((prev) => Number((prev + step).toFixed(2)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (price <= 0 || quantity <= 0) return;
    onPlaceOrder(side, price, quantity);
  };

  const activeBadgeClass = 'px-3 py-1 rounded-md text-sm font-bold font-mono ' +
    (userOrder && userOrder.side === 'BUY'
      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
      : 'bg-rose-950 text-rose-300 border border-rose-700');

  const buyButtonClass = 'min-h-[44px] px-4 py-2 text-base font-bold rounded-md transition-colors ' +
    (side === 'BUY' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white');

  const sellButtonClass = 'min-h-[44px] px-4 py-2 text-base font-bold rounded-md transition-colors ' +
    (side === 'SELL' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white');

  const submitButtonClass = 'w-full flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 text-base font-bold text-slate-950 rounded-lg transition-colors ' +
    (side === 'BUY' ? 'bg-emerald-400 hover:bg-emerald-300' : 'bg-rose-400 hover:bg-rose-300');

  const progressPercent = userOrder && userOrder.initialUnitsAhead > 0
    ? Math.max(
        5,
        Math.round(
          ((userOrder.initialUnitsAhead - userOrder.unitsAhead) /
            userOrder.initialUnitsAhead) *
            100
        )
      )
    : 100;

  return (
    <div className="flex flex-col bg-[#090D18] border border-slate-800 rounded-lg p-4 text-slate-100">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-white uppercase tracking-wider">
            Child Order & Queue Tracker
          </h2>
        </div>
        <div className="px-3 py-1 bg-cyan-950/60 border border-cyan-800/80 rounded-md text-sm font-mono text-cyan-300">
          FIFO Priority Simulated
        </div>
      </div>

      {/* ACTIVE ORDER STATE */}
      {userOrder && userOrder.status === 'RESTING' ? (
        <div className="p-4 bg-slate-900 border border-cyan-500/40 rounded-lg mb-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={activeBadgeClass}>
                {userOrder.side} LIMIT
              </span>
              <span className="text-sm font-mono text-slate-300">
                {userOrder.orderId}
              </span>
            </div>
            <span className="text-sm font-mono text-cyan-400 font-semibold">
              RESTING IN BOOK
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800 text-sm font-mono">
            <div>
              <div className="text-slate-400">Order Price</div>
              <div className="text-xl font-bold text-white">
                {userOrder.pricePts.toFixed(2)} pts
              </div>
            </div>
            <div>
              <div className="text-slate-400">Quantity</div>
              <div className="text-xl font-bold text-white">
                {userOrder.quantityUnits.toLocaleString()} Units
              </div>
            </div>
          </div>

          {/* QUEUE TELEMETRY */}
          <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400 font-medium">Queue Priority Rank</span>
              <span className="font-bold text-cyan-300 font-mono text-base">
                Position {userOrder.queueIndex} of {userOrder.totalOrdersAtLevel}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400 font-medium">Units Ahead in Queue</span>
              <span className="font-bold text-amber-300 font-mono text-base">
                {userOrder.unitsAhead.toLocaleString()} Units
              </span>
            </div>

            {/* Visual Queue Progress Bar */}
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mt-2">
              {userOrder.initialUnitsAhead > 0 ? (
                <div
                  className="bg-cyan-400 h-full transition-all duration-300"
                  style={{ width: progressPercent.toString() + '%' }}
                />
              ) : (
                <div className="bg-emerald-400 h-full w-full" />
              )}
            </div>

            <div className="flex items-center justify-between text-sm pt-1">
              <span className="text-slate-400">Est. Fill Probability</span>
              <span className="font-mono font-bold text-emerald-400">
                {(userOrder.estimatedFillProbability * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          <button
            onClick={onCancelOrder}
            className="w-full flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 text-base font-bold text-rose-200 bg-rose-950/70 hover:bg-rose-900 border border-rose-800 rounded-lg transition-colors"
          >
            <XCircle className="w-5 h-5 text-rose-300" />
            <span>Cancel Active Order</span>
          </button>
        </div>
      ) : userOrder && userOrder.status === 'FILLED' ? (
        <div className="p-4 bg-emerald-950/40 border border-emerald-600/50 rounded-lg mb-4 text-emerald-200 space-y-2">
          <div className="flex items-center gap-2 text-base font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>Order Completely Filled!</span>
          </div>
          <div className="text-sm font-mono text-slate-300">
            {userOrder.orderId}: {userOrder.quantityUnits.toLocaleString()} Units @ {userOrder.pricePts.toFixed(2)} pts
          </div>
        </div>
      ) : null}

      {/* ORDER SUBMISSION FORM */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Side Selector */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => setSide('BUY')}
            className={buyButtonClass}
          >
            BUY (BID)
          </button>
          <button
            type="button"
            onClick={() => setSide('SELL')}
            className={sellButtonClass}
          >
            SELL (ASK)
          </button>
        </div>

        {/* Price Input with quick shortcuts */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-semibold text-slate-300">
              Limit Price (pts)
            </label>
            <div className="flex items-center gap-1 text-sm font-mono">
              <button
                type="button"
                onClick={() => handleQuickPrice('BID')}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded"
              >
                Bid: {bestBidPts.toFixed(2)}
              </button>
              <button
                type="button"
                onClick={() => handleQuickPrice('MID')}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
              >
                Mid
              </button>
              <button
                type="button"
                onClick={() => handleQuickPrice('ASK')}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-rose-300 rounded"
              >
                Ask: {bestAskPts.toFixed(2)}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.05"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              className="flex-1 min-h-[44px] px-4 bg-slate-900 border border-slate-700 rounded-lg text-lg font-mono font-bold text-white focus:outline-none focus:border-cyan-400"
            />
            <button
              type="button"
              onClick={() => handleStepPrice(-0.05)}
              className="min-h-[44px] px-3 bg-slate-800 hover:bg-slate-700 font-mono font-bold text-base rounded-lg border border-slate-700"
            >
              -0.05
            </button>
            <button
              type="button"
              onClick={() => handleStepPrice(+0.05)}
              className="min-h-[44px] px-3 bg-slate-800 hover:bg-slate-700 font-mono font-bold text-base rounded-lg border border-slate-700"
            >
              +0.05
            </button>
          </div>
        </div>

        {/* Quantity Input with quick size chips */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-semibold text-slate-300">
              Quantity (Units)
            </label>
            <div className="flex items-center gap-1.5 text-sm font-mono">
              {[1000, 5000, 10000, 25000].map((preset) => {
                const isSelected = quantity === preset;
                const chipClass = 'px-2 py-0.5 rounded transition-colors ' +
                  (isSelected
                    ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500'
                    : 'bg-slate-800 text-slate-400 hover:text-white');
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setQuantity(preset)}
                    className={chipClass}
                  >
                    {(preset / 1000).toFixed(0)}k
                  </button>
                );
              })}
            </div>
          </div>
          <input
            type="number"
            step="500"
            min="100"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)}
            className="w-full min-h-[44px] px-4 bg-slate-900 border border-slate-700 rounded-lg text-lg font-mono font-bold text-white focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className={submitButtonClass}
        >
          <span>
            Submit {side} Limit Order ({quantity.toLocaleString()} Units @ {price.toFixed(2)} pts)
          </span>
          <ArrowRight className="w-5 h-5 text-slate-950" />
        </button>
      </form>
    </div>
  );
};
