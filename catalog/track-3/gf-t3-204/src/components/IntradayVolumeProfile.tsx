import React from 'react';
import { IntradayVolumeBin } from '../types';

interface IntradayVolumeProfileProps {
  bins: IntradayVolumeBin[];
  volumeShock: boolean;
  activeSliceIndex: number;
}

export const IntradayVolumeProfile: React.FC<IntradayVolumeProfileProps> = ({
  bins,
  volumeShock,
  activeSliceIndex,
}) => {
  const maxWeight = Math.max(...bins.map((b) => Math.max(b.expected_weight, b.realized_weight)), 0.1);

  return (
    <div className="bg-zinc-900/70 border border-zinc-800 rounded-lg p-5 flex flex-col justify-between">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-3 mb-3">
        <div>
          <span className="text-sm uppercase tracking-wider text-zinc-400 font-medium">Historical Liquidity Model</span>
          <div className="text-base font-semibold text-zinc-200">Intraday Volume Profile (U-Shape Smile)</div>
        </div>

        <div className="flex items-center gap-3 text-sm font-mono">
          <div className="flex items-center gap-1.5 text-zinc-300">
            <span className="w-3 h-3 rounded-sm bg-cyan-500/40 border border-cyan-400 inline-block"></span>
            <span>Expected Weight</span>
          </div>
          {volumeShock && (
            <div className="flex items-center gap-1.5 text-rose-300 font-semibold bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-500/30">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
              <span>Sudden Volume Shock</span>
            </div>
          )}
        </div>
      </div>

      {/* Intraday Histogram Bars */}
      <div className="pt-2 pb-1">
        <div className="h-36 flex items-end gap-1.5 px-2 bg-zinc-950/60 rounded-md border border-zinc-800/60 pt-4 pb-2">
          {bins.map((bin, idx) => {
            const expectedHeightPct = (bin.expected_weight / maxWeight) * 100;
            const realizedHeightPct = (bin.realized_weight / maxWeight) * 100;
            const isActive = idx === activeSliceIndex;
            const isCompleted = idx < activeSliceIndex;

            return (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center h-full justify-end relative group cursor-pointer"
              >
                {/* Active slice indicator beacon */}
                {isActive && (
                  <div className="absolute -top-3.5 w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]"></div>
                )}

                {/* Realized Volume overlay (if shock) */}
                {volumeShock && bin.realized_weight > bin.expected_weight ? (
                  <div
                    style={{ height: `${realizedHeightPct}%` }}
                    className="w-full bg-rose-500/30 border-t-2 border-rose-400 rounded-t-sm transition-all duration-300"
                  ></div>
                ) : (
                  <div
                    style={{ height: `${expectedHeightPct}%` }}
                    className={`w-full rounded-t-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.5)]'
                        : isCompleted
                        ? 'bg-cyan-600/60 hover:bg-cyan-500/70'
                        : 'bg-zinc-700/60 hover:bg-zinc-600/70'
                    }`}
                  ></div>
                )}

                {/* Hover Tooltip */}
                <div className="absolute bottom-full mb-2 hidden group-hover:block z-30 pointer-events-none bg-zinc-950 border border-zinc-700 rounded-md px-3 py-1.5 text-sm font-mono whitespace-nowrap shadow-xl text-zinc-200">
                  <div className="text-cyan-400 font-semibold">{bin.time_label} (Bin {bin.bin_index})</div>
                  <div>Exp Weight: {(bin.expected_weight * 100).toFixed(2)}%</div>
                  {volumeShock && <div className="text-rose-400">Realized: {(bin.realized_weight * 100).toFixed(2)}%</div>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Intraday Time Labels along X-Axis */}
        <div className="flex items-center justify-between text-sm text-zinc-400 font-mono mt-2 px-1">
          <span>09:30 (Open Cross)</span>
          <span>11:00</span>
          <span>12:30 (Midday Trough)</span>
          <span>14:30</span>
          <span>16:00 (Closing Auction)</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-zinc-400 font-mono pt-3 border-t border-zinc-800/80 mt-2">
        <span>Current Active Bin: {activeSliceIndex + 1} of {bins.length}</span>
        <span className="text-zinc-500">Intraday Profile: Historical Bimodal Smile Distribution</span>
      </div>
    </div>
  );
};
