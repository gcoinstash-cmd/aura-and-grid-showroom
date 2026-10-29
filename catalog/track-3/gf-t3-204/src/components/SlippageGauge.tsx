import React from 'react';

interface SlippageGaugeProps {
  slippageBps: number;
  implementationShortfallUsd: number;
  arrivalPrice: number;
  averageExecPrice: number;
  side: 'BUY' | 'SELL';
  executedShares: number;
  totalShares: number;
}

export const SlippageGauge: React.FC<SlippageGaugeProps> = ({
  slippageBps,
  implementationShortfallUsd,
  arrivalPrice,
  averageExecPrice,
  side,
  executedShares,
  totalShares,
}) => {
  // Gauge scale from -4 bps to +16 bps
  const minBps = -4;
  const maxBps = 16;
  const clampedBps = Math.max(minBps, Math.min(slippageBps, maxBps));
  const normalizedPct = ((clampedBps - minBps) / (maxBps - minBps)) * 100;

  // Determine severity tier
  let statusColor = 'text-cyan-400';
  let statusBg = 'bg-cyan-500/10 border-cyan-500/30';
  let statusLabel = 'Nominal Execution';

  if (slippageBps < 0) {
    statusColor = 'text-emerald-400';
    statusBg = 'bg-emerald-500/10 border-emerald-500/30';
    statusLabel = 'Price Improvement';
  } else if (slippageBps <= 3.5) {
    statusColor = 'text-cyan-400';
    statusBg = 'bg-cyan-500/10 border-cyan-500/30';
    statusLabel = 'Nominal Impact';
  } else if (slippageBps <= 8.0) {
    statusColor = 'text-amber-400';
    statusBg = 'bg-amber-500/10 border-amber-500/30';
    statusLabel = 'Moderate Concession';
  } else {
    statusColor = 'text-rose-400';
    statusBg = 'bg-rose-500/10 border-rose-500/30';
    statusLabel = 'Adverse Selection';
  }

  // Calculate angle for semicircular gauge (-90 to +90 deg)
  const angle = -90 + (normalizedPct / 100) * 180;

  return (
    <div className="bg-zinc-900/70 border border-zinc-800 rounded-lg p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 mb-4">
        <div>
          <span className="text-sm uppercase tracking-wider text-zinc-400 font-medium">Implementation Shortfall</span>
          <div className="text-base font-semibold text-zinc-200">Arrival Price Benchmark</div>
        </div>
        <div className={`px-3 py-1 rounded-md text-sm font-mono font-semibold border ${statusBg} ${statusColor}`}>
          {statusLabel}
        </div>
      </div>

      {/* Semicircular Gauge Display */}
      <div className="relative flex flex-col items-center justify-center my-2">
        <svg viewBox="0 0 200 110" className="w-52 h-32 overflow-visible">
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="25%" stopColor="#06b6d4" />
              <stop offset="60%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>
          </defs>

          {/* Background Track Arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#27272a"
            strokeWidth="14"
            strokeLinecap="round"
          />

          {/* Active Colored Arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray="251.3"
            strokeDashoffset={251.3 - (251.3 * (normalizedPct / 100))}
            className="transition-all duration-300 ease-out"
          />

          {/* Needle Center Pin */}
          <circle cx="100" cy="100" r="5" fill="#f4f4f5" />

          {/* Gauge Needle Pointer */}
          <g transform={`rotate(${angle} 100 100)`} className="transition-transform duration-300 ease-out">
            <line x1="100" y1="100" x2="100" y2="28" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
            <polygon points="98,34 102,34 100,22" fill="#22d3ee" />
          </g>
        </svg>

        {/* Center Digital Reading */}
        <div className="text-center -mt-4">
          <div className="text-3xl font-bold tracking-tight font-mono tabular-nums text-zinc-100 flex items-center justify-center gap-1.5">
            <span>{slippageBps > 0 ? `+${slippageBps.toFixed(2)}` : slippageBps.toFixed(2)}</span>
            <span className="text-base text-zinc-400 font-sans font-normal">bps</span>
          </div>
          <div className="text-sm font-mono tabular-nums text-zinc-400 mt-0.5">
            Shortfall: {implementationShortfallUsd >= 0 ? `+${implementationShortfallUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `-${Math.abs(implementationShortfallUsd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} pts
          </div>
        </div>
      </div>

      {/* Benchmark Decomposition Grid */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-zinc-800/80 text-sm font-mono">
        <div>
          <span className="text-sm text-zinc-500 uppercase block font-medium">Arrival Ref (S0)</span>
          <span className="text-zinc-200 tabular-nums text-base">{arrivalPrice.toFixed(2)} pts</span>
        </div>
        <div>
          <span className="text-sm text-zinc-500 uppercase block font-medium">Exec VWAP (P*)</span>
          <span className="text-zinc-200 tabular-nums text-base">
            {averageExecPrice > 0 ? `${averageExecPrice.toFixed(4)} pts` : 'Awaiting Fills'}
          </span>
        </div>
        <div>
          <span className="text-sm text-zinc-500 uppercase block font-medium">Side & Horizon</span>
          <span className="text-zinc-300 font-sans text-base">{side} · 1-Day Intraday</span>
        </div>
        <div>
          <span className="text-sm text-zinc-500 uppercase block font-medium">Filled Proportion</span>
          <span className="text-zinc-300 tabular-nums text-base">
            {((executedShares / Math.max(1, totalShares)) * 100).toFixed(1)}% ({executedShares.toFixed(0)}/{totalShares.toFixed(0)})
          </span>
        </div>
      </div>
    </div>
  );
};
