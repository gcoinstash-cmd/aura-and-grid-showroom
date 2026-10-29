import React from 'react';
import { ExecutionFill } from '../types/microstructure';
import { History } from 'lucide-react';

interface TradeTapeProps {
  tape: ExecutionFill[];
}

export const TradeTape: React.FC<TradeTapeProps> = ({ tape }) => {
  return (
    <div className="flex flex-col h-full bg-[#090D18] border border-slate-800 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-white uppercase tracking-wider">
            Real-Time Trade Tape (L3 Fills)
          </h2>
        </div>
        <div className="text-sm font-mono text-slate-400">
          {tape.length} Recorded Fills
        </div>
      </div>

      <div className="grid grid-cols-12 px-4 py-2 bg-slate-950 text-sm font-mono font-semibold text-slate-400 border-b border-slate-800/80">
        <div className="col-span-2 text-left">Time</div>
        <div className="col-span-2 text-left">Side</div>
        <div className="col-span-3 text-right">Price (pts)</div>
        <div className="col-span-3 text-right">Quantity (Units)</div>
        <div className="col-span-2 text-right">Impact</div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40 font-mono text-sm">
        {tape.length === 0 ? (
          <div className="p-6 text-center text-slate-500">
            Awaiting market order sweeps...
          </div>
        ) : (
          tape.map((fill) => {
            const isBuy = fill.side === 'BUY';
            const date = new Date(fill.timestamp);
            const timeStr = date.toTimeString().split(' ')[0] + '.' + String(fill.timestamp % 1000).padStart(3, '0');
            const sideClass = 'font-bold ' + (isBuy ? 'text-emerald-400' : 'text-rose-400');
            const impactClass = 'col-span-2 text-right tabular-nums ' + (isBuy ? 'text-emerald-400' : 'text-rose-400');

            return (
              <div
                key={fill.fillId}
                className="grid grid-cols-12 px-4 py-1.5 hover:bg-slate-850/50 transition-colors"
              >
                <div className="col-span-2 text-slate-400 tabular-nums">
                  {timeStr}
                </div>
                <div className="col-span-2">
                  <span className={sideClass}>
                    {fill.side}
                  </span>
                </div>
                <div className="col-span-3 text-right font-bold text-white tabular-nums">
                  {fill.pricePts.toFixed(2)}
                </div>
                <div className="col-span-3 text-right text-slate-300 tabular-nums">
                  {fill.units.toLocaleString()}
                </div>
                <div className={impactClass}>
                  {isBuy ? '+' : ''}{fill.priceImpactPts.toFixed(2)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
