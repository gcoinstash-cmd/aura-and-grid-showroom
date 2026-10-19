import React from 'react';
import { ArbitrageCycle, LiquidityPool } from '../engine/arbitrageEngine';
import { TrendingUp, ArrowRight, Zap, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';

interface SpreadLadderHUDProps {
  cycles: ArbitrageCycle[];
  selectedCycle: ArbitrageCycle | null;
  onSelectCycle: (cycle: ArbitrageCycle) => void;
  onExecuteFlashSwap: (cycle: ArbitrageCycle) => void;
  onInjectShock: (type: 'sushi_spread' | 'curve_spread' | 'reset') => void;
  isLiveTick: boolean;
  onToggleLiveTick: () => void;
}

export const SpreadLadderHUD: React.FC<SpreadLadderHUDProps> = ({
  cycles,
  selectedCycle,
  onSelectCycle,
  onExecuteFlashSwap,
  onInjectShock,
  isLiveTick,
  onToggleLiveTick,
}) => {
  return (
    <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md">
      {/* Top Header & Shock Injection Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-cyan-400" />
            <h2 className="text-3xl font-extrabold uppercase tracking-wide text-white">
              Arbitrage Opportunity HUD & Spread Ladder
            </h2>
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            Bellman-Ford negative-log-product relaxation running with sub-5ms closed-form $s^*$ optimal swap size calculus.
          </p>
        </div>

        {/* Live Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={onToggleLiveTick}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-base font-semibold transition-all ${
              isLiveTick
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-slate-800 text-zinc-300 border border-slate-700'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isLiveTick ? 'animate-spin' : ''}`} />
            <span>{isLiveTick ? 'Live Mempool Tick: ON' : 'Live Tick: PAUSED'}</span>
          </button>

          <button
            onClick={() => onInjectShock('sushi_spread')}
            className="px-3.5 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/40 text-base font-semibold transition-all"
          >
            +2% WETH Shock
          </button>

          <button
            onClick={() => onInjectShock('curve_spread')}
            className="px-3.5 py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-500/40 text-base font-semibold transition-all"
          >
            +3% WBTC Shock
          </button>

          <button
            onClick={() => onInjectShock('reset')}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-zinc-300 border border-slate-700 text-base font-semibold transition-all"
          >
            Reset Pools
          </button>
        </div>
      </div>

      {/* Cycle Opportunity Feed */}
      <div className="mt-5 space-y-4">
        {cycles.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/60 border border-slate-800/80 rounded-xl">
            <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            <div className="text-xl font-bold text-white mb-1">Zero Disparities Exceed Fee Floor</div>
            <p className="text-sm text-zinc-400 max-w-lg mx-auto">
              Current pool price distributions are in zero-arbitrage equilibrium. Fee drag exceeds cross-venue spread. Click "Shock" buttons above to simulate live DEX liquidity displacement.
            </p>
          </div>
        ) : (
          cycles.map((cycle, idx) => {
            const isSelected = selectedCycle?.cycle_id === cycle.cycle_id;

            return (
              <div
                key={cycle.cycle_id}
                onClick={() => onSelectCycle(cycle)}
                className={`p-5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-950 border-cyan-400 ring-1 ring-cyan-400 shadow-lg shadow-cyan-950/40'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Upper Metadata Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-base font-bold font-mono px-3 py-1 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                      {cycle.cycle_id}
                    </span>
                    <span className="text-sm font-mono text-zinc-400">
                      Path: {cycle.tokens.join(' → ')}
                    </span>
                    <span className="text-xs font-mono text-zinc-500">
                      · {cycle.pools.length} Hops
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-base font-semibold px-4 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 font-mono">
                      +{cycle.profit_bps} BPS SPREAD
                    </span>
                    <span className="text-xs font-mono text-zinc-400">
                      Latency: {cycle.execution_latency_ms}ms
                    </span>
                  </div>
                </div>

                {/* Reader Zone 1: Monospace 24px-30px Bold Spread Ladder Display */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-3 my-2 border-y border-slate-800/80 bg-slate-900/40 px-4 rounded-lg">
                  <div>
                    <div className="text-xs uppercase font-mono text-zinc-400 mb-1">
                      Optimal Input (s*)
                    </div>
                    {/* Oversized typography requirement: 24px-30px font-mono font-bold tracking-tight text-cyan-400 */}
                    <div className="text-2xl md:text-3xl font-mono font-bold tracking-tight text-cyan-400 tabular-nums">
                      ${cycle.optimal_input.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs uppercase font-mono text-zinc-400 mb-1">
                      Gross Settlement (x_out)
                    </div>
                    <div className="text-2xl md:text-3xl font-mono font-bold tracking-tight text-zinc-100 tabular-nums">
                      ${cycle.expected_output.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs uppercase font-mono text-zinc-400 mb-1">
                      Net PnL Yield (Π*)
                    </div>
                    <div className="text-2xl md:text-3xl font-mono font-bold tracking-tight text-emerald-400 tabular-nums">
                      +${cycle.net_profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                {/* Bottom Execution Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 mt-3">
                  <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-cyan-400" />
                      <span>Zero-Loss Trade Cancellation Guard: ACTIVE</span>
                    </div>
                    <span>·</span>
                    <div>
                      DUAL_VECTOR_TORQUE Torque: {Math.round((1 - cycle.rear_torque_bias) * 100)}% F / {Math.round(cycle.rear_torque_bias * 100)}% R
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onExecuteFlashSwap(cycle);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-base transition-transform active:scale-95 shadow-md shadow-cyan-400/20"
                  >
                    <Zap className="w-4 h-4 fill-slate-950" />
                    <span>Simulate Flash Swap</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
