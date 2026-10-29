import React, { useState, useEffect } from 'react';
import {
  Side,
  OrderType,
  TimeInForce,
  Order,
  PRICE_SCALE,
  QTY_SCALE,
  toMicros,
  formatCurrency,
  formatQty,
} from '../types/apex';

interface OrderEntryConsoleProps {
  symbol: string;
  bestBid: number | null;
  bestAsk: number | null;
  selectedPrice: number | null;
  onSubmitOrder: (
    side: Side,
    orderType: OrderType,
    quantityMicros: number,
    priceMicros: number,
    timeInForce: TimeInForce
  ) => Promise<void>;
  openOrders: Order[];
  onCancelOrder: (orderId: string) => void;
  lastExecutionNotice: string | null;
}

export const OrderEntryConsole: React.FC<OrderEntryConsoleProps> = ({
  symbol,
  bestBid,
  bestAsk,
  selectedPrice,
  onSubmitOrder,
  openOrders,
  onCancelOrder,
  lastExecutionNotice,
}) => {
  const [side, setSide] = useState<Side>('BUY');
  const [orderType, setOrderType] = useState<OrderType>('LIMIT');
  const [priceInput, setPriceInput] = useState<string>('65000.00');
  const [qtyInput, setQtyInput] = useState<string>('0.5000');
  const [timeInForce, setTimeInForce] = useState<TimeInForce>('GTC');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync clicked price from L2 ladder
  useEffect(() => {
    if (selectedPrice !== null) {
      setPriceInput(selectedPrice.toFixed(2));
    }
  }, [selectedPrice]);

  const priceDecimal = parseFloat(priceInput) || 0;
  const qtyDecimal = parseFloat(qtyInput) || 0;
  const priceMicros = toMicros(priceDecimal, PRICE_SCALE);
  const qtyMicros = toMicros(qtyDecimal, QTY_SCALE);

  // Deterministic fixed-point settlement preview: (Price * Qty) // QTY_SCALE
  const estimatedSettlementMicros =
    orderType === 'LIMIT'
      ? Math.floor((priceMicros * qtyMicros) / QTY_SCALE)
      : Math.floor(
          ((side === 'BUY' ? (bestAsk || 65000 * PRICE_SCALE) : (bestBid || 65000 * PRICE_SCALE)) *
            qtyMicros) /
            QTY_SCALE
        );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (qtyDecimal <= 0) {
      setErrorMsg('Quantity must be greater than zero.');
      return;
    }

    if (orderType === 'LIMIT' && priceDecimal <= 0) {
      setErrorMsg('Limit price must be greater than zero.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmitOrder(side, orderType, qtyMicros, priceMicros, timeInForce);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Order submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-950/60">
        <span className="text-xs font-semibold text-slate-200">Order Placement Gateway</span>
        <span className="text-xs text-slate-400 font-mono">Clean-Room MIT Engine</span>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between overflow-y-auto space-y-4">
        {/* Execution Notice */}
        {lastExecutionNotice && (
          <div className="p-2.5 rounded bg-slate-800/80 border border-slate-700 text-xs text-slate-200 font-mono">
            {lastExecutionNotice}
          </div>
        )}

        {errorMsg && (
          <div className="p-2.5 rounded bg-rose-950/40 border border-rose-800 text-xs text-rose-300 font-mono">
            {errorMsg}
          </div>
        )}

        {/* Side Selector (Segmented Button Control) */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => setSide('BUY')}
            className={`py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              side === 'BUY'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Buy / Bid
          </button>
          <button
            type="button"
            onClick={() => setSide('SELL')}
            className={`py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              side === 'SELL'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sell / Ask
          </button>
        </div>

        {/* Order Type & Time-in-Force Segmented Controls */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Order Type
            </label>
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950 rounded border border-slate-800">
              <button
                type="button"
                onClick={() => setOrderType('LIMIT')}
                className={`py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                  orderType === 'LIMIT'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Limit
              </button>
              <button
                type="button"
                onClick={() => setOrderType('MARKET')}
                className={`py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                  orderType === 'MARKET'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Market
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Time In Force
            </label>
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 rounded border border-slate-800">
              {(['GTC', 'IOC', 'FOK'] as TimeInForce[]).map((tif) => (
                <button
                  key={tif}
                  type="button"
                  onClick={() => setTimeInForce(tif)}
                  className={`py-1 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                    timeInForce === tif
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tif}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Price Input */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-medium text-slate-400">
              Order Price (pts)
            </label>
            <span className="text-[11px] text-slate-500 font-mono tabular-nums">
              {priceMicros.toLocaleString()} micros
            </span>
          </div>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              disabled={orderType === 'MARKET'}
              value={orderType === 'MARKET' ? '' : priceInput}
              placeholder={orderType === 'MARKET' ? 'Market Sweep' : '0.00'}
              onChange={(e) => setPriceInput(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-100 font-mono text-xs focus:outline-none focus:border-slate-600 disabled:bg-slate-950/40 disabled:text-slate-600"
            />
            <span className="absolute right-3 top-2 text-xs text-slate-500 font-mono">
              pts
            </span>
          </div>
        </div>

        {/* Quantity Input with Quick Presets */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-medium text-slate-400">
              Quantity ({symbol.split('/')[0]?.trim() || 'SYNTH'})
            </label>
            <span className="text-[11px] text-slate-500 font-mono tabular-nums">
              {qtyMicros.toLocaleString()} micros
            </span>
          </div>
          <div className="relative">
            <input
              type="number"
              step="0.0001"
              value={qtyInput}
              onChange={(e) => setQtyInput(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-100 font-mono text-xs focus:outline-none focus:border-slate-600"
            />
            <span className="absolute right-3 top-2 text-xs text-slate-500 font-mono">
              {symbol.split('/')[0]?.trim() || 'SYNTH'}
            </span>
          </div>

          {/* Quick Preset Buttons */}
          <div className="grid grid-cols-4 gap-1.5 mt-2">
            {['0.1', '0.25', '0.5', '1.0'].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setQtyInput(preset)}
                className="py-1 text-[11px] bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 rounded font-mono transition-colors cursor-pointer"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Settlement Summary Strip */}
        <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded space-y-1 text-xs font-mono">
          <div className="flex justify-between text-slate-400 text-[11px]">
            <span>Est. Settlement Quote:</span>
            <span className="text-slate-200 font-semibold tabular-nums">
              {(estimatedSettlementMicros / PRICE_SCALE).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 4,
              })}{' '}
              Units
            </span>
          </div>
          <div className="flex justify-between text-slate-500 text-[10px]">
            <span>Settlement Microunits:</span>
            <span className="tabular-nums">
              {estimatedSettlementMicros.toLocaleString()} micros
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`w-full py-2.5 rounded text-xs font-semibold tracking-wide transition-colors cursor-pointer whitespace-nowrap ${
            side === 'BUY'
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
              : 'bg-rose-600 hover:bg-rose-500 text-white'
          }`}
        >
          {isSubmitting
            ? 'Matching...'
            : `${side === 'BUY' ? 'Submit Buy' : 'Submit Sell'} ${orderType}`}
        </button>

        {/* Resting Open Orders Subsection */}
        <div className="pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-300">
              Active Resting Orders ({openOrders.length})
            </span>
            <span className="text-[10px] text-slate-500 font-mono">O(1) Cancellation</span>
          </div>

          <div className="max-h-36 overflow-y-auto space-y-1 font-mono text-[11px]">
            {openOrders.length === 0 ? (
              <div className="py-3 text-center text-slate-600 text-[11px] italic">
                No active resting orders
              </div>
            ) : (
              openOrders.map((ord) => (
                <div
                  key={ord.orderId}
                  className="flex items-center justify-between p-2 bg-slate-950 border border-slate-800/80 rounded"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-semibold text-[10px] ${
                        ord.side === 'BUY' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {ord.side}
                    </span>
                    <span className="text-slate-300 tabular-nums">
                      {formatQty(ord.remainingQtyMicros)} @ {formatCurrency(ord.priceMicros)}
                    </span>
                  </div>
                  <button
                    onClick={() => onCancelOrder(ord.orderId)}
                    className="px-2 py-0.5 text-[10px] bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 border border-slate-700 rounded transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
