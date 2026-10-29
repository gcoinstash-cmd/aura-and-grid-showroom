import React from 'react';
import {
  TradeSettlementEvent,
  formatCurrency,
  formatUnits,
  formatQty,
} from '../types/apex';

interface TradeTapeProps {
  trades: TradeSettlementEvent[];
  onTriggerBurst: () => Promise<void>;
  onTriggerSweep: () => Promise<void>;
  onExportAuditLog: () => void;
  onSnapshot: () => void;
  onRestore: () => void;
  hasSnapshot: boolean;
}

export const TradeTape: React.FC<TradeTapeProps> = ({
  trades,
  onTriggerBurst,
  onTriggerSweep,
  onExportAuditLog,
  onSnapshot,
  onRestore,
  hasSnapshot,
}) => {
  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-950/60">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-200">
            Execution Tape & Settlement Stream
          </span>
          <span className="text-xs text-slate-500 font-mono">
            {trades.length} fills
          </span>
        </div>
        <button
          onClick={onExportAuditLog}
          className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          Export JSON
        </button>
      </div>

      {/* HFT Stress & Tooling Toolbar */}
      <div className="p-3 border-b border-slate-800 bg-slate-950/40">
        <div className="text-[11px] font-medium text-slate-400 mb-2">
          Deterministic Simulation & Load Generators
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onTriggerBurst}
            className="px-2.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition-colors cursor-pointer text-center"
          >
            Burst 10 Orders
          </button>
          <button
            onClick={onTriggerSweep}
            className="px-2.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition-colors cursor-pointer text-center"
          >
            Market Sweep
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <button
            onClick={onSnapshot}
            className="px-2.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition-colors cursor-pointer text-center"
          >
            Create Snapshot
          </button>
          <button
            onClick={onRestore}
            disabled={!hasSnapshot}
            className="px-2.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition-colors cursor-pointer text-center disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Restore State
          </button>
        </div>
      </div>

      {/* Grid Headers */}
      <div className="grid grid-cols-5 px-3 py-1.5 text-[11px] font-medium text-slate-400 border-b border-slate-800 bg-slate-950/30 font-mono">
        <div>Seq</div>
        <div>Price</div>
        <div className="text-right">Qty</div>
        <div className="text-right">Settlement</div>
        <div className="text-right">Side</div>
      </div>

      {/* Trade Rows */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40 font-mono text-xs">
        {trades.length === 0 ? (
          <div className="py-12 text-center text-slate-600 text-xs italic">
            Awaiting execution matches...
          </div>
        ) : (
          trades.map((t) => {
            const isTakerBuy = t.takerSide === 'BUY';
            return (
              <div
                key={t.fillId}
                className="grid grid-cols-5 px-3 py-1.5 hover:bg-slate-800/40 transition-colors items-center text-[11px]"
              >
                <div className="text-slate-500 tabular-nums">#{t.sequenceNumber}</div>
                <div
                  className={`font-semibold tabular-nums ${
                    isTakerBuy ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {formatCurrency(t.priceMicros)}
                </div>
                <div className="text-right text-slate-300 tabular-nums">
                  {formatQty(t.quantityMicros)}
                </div>
                <div className="text-right text-slate-400 tabular-nums">
                  {formatUnits(t.settlementMicros)}
                </div>
                <div className="text-right">
                  <span
                    className={`font-semibold text-[10px] ${
                      isTakerBuy ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {t.takerSide}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Cryptographic Hash Chaining Status Footer */}
      {trades.length > 0 && (
        <div className="p-2.5 border-t border-slate-800 bg-slate-950/90 text-[10px] font-mono text-slate-400">
          <div className="flex items-center justify-between text-slate-500 mb-0.5">
            <span>Audit Checksum (SHA-256 Chained):</span>
            <span className="text-emerald-500">TAMPER-EVIDENT</span>
          </div>
          <div className="truncate text-slate-400">
            {trades[0]?.checksumSha256}
          </div>
        </div>
      )}
    </div>
  );
};
