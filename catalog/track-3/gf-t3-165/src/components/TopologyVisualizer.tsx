import React, { useState } from 'react';
import { LiquidityPool, ArbitrageCycle } from '../engine/arbitrageEngine';
import { Activity, Zap, Cpu, ArrowRight, Layers, ShieldCheck } from 'lucide-react';

interface TopologyVisualizerProps {
  pools: LiquidityPool[];
  activeCycle: ArbitrageCycle | null;
  onSelectPool: (pool: LiquidityPool) => void;
  selectedPool: LiquidityPool | null;
}

export const TopologyVisualizer: React.FC<TopologyVisualizerProps> = ({
  pools,
  activeCycle,
  onSelectPool,
  selectedPool,
}) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Graph nodes representation for tokens
  const tokenCoords: Record<string, { x: number; y: number; label: string; color: string }> = {
    USDC: { x: 120, y: 220, label: 'USDC (Base)', color: '#38bdf8' },
    WETH: { x: 380, y: 90, label: 'WETH (Front MG2)', color: '#818cf8' },
    WBTC: { x: 640, y: 220, label: 'WBTC (Rear eAxle)', color: '#f59e0b' },
  };

  const poolVenues: Record<string, { label: string; border: string; bg: string }> = {
    UNISWAP_V3: { label: 'Uniswap v3', border: 'border-pink-500/40', bg: 'bg-pink-950/20' },
    SUSHISWAP: { label: 'Sushiswap', border: 'border-blue-500/40', bg: 'bg-blue-950/20' },
    CURVE_CRYPTO: { label: 'Curve Crypto', border: 'border-amber-500/40', bg: 'bg-amber-950/20' },
    DIRECT4_EAXLE: { label: 'DIRECT4 eAxle', border: 'border-cyan-400/60', bg: 'bg-cyan-950/30' },
  };

  return (
    <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md">
      {/* Background ambient grid lines */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      {/* Header telemetry line */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <span className="text-xl font-bold uppercase tracking-wide text-white">
              Multi-Venue Liquidity Topology
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-zinc-400 mt-1">
            <span>Graph Dimension: 3 Vertices</span>
            <span aria-hidden="true">·</span>
            <span>6 Directed Constant-Product Pools</span>
            <span aria-hidden="true">·</span>
            <span className="text-cyan-400 font-mono">Bellman-Ford Relaxed</span>
          </div>
        </div>

        {/* Live DIRECT4 torque indicator */}
        <div className="flex items-center gap-4 bg-slate-950/80 border border-slate-800 px-4 py-2 rounded-xl">
          <div className="text-right">
            <div className="text-xs text-zinc-400 uppercase font-mono tracking-wider">DIRECT4 Vector</div>
            <div className="text-base font-bold font-mono text-cyan-400">
              {activeCycle ? `${Math.round((1 - activeCycle.rear_torque_bias) * 100)}% F : ${Math.round(activeCycle.rear_torque_bias * 100)}% R` : '70% F : 30% R'}
            </div>
          </div>
          <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden flex">
            <div
              className="bg-cyan-400 transition-all duration-500"
              style={{
                width: activeCycle ? `${(1 - activeCycle.rear_torque_bias) * 100}%` : '70%',
              }}
            />
            <div
              className="bg-emerald-400 transition-all duration-500"
              style={{
                width: activeCycle ? `${activeCycle.rear_torque_bias * 100}%` : '30%',
              }}
            />
          </div>
        </div>
      </div>

      {/* SVG Canvas Topology Graph */}
      <div className="relative w-full overflow-x-auto py-4">
        <svg
          viewBox="0 0 760 340"
          className="w-full max-w-4xl mx-auto h-[320px] select-none"
        >
          <defs>
            <linearGradient id="gradCyanEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0.8" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Render Pool Connections (Curves between Token Nodes) */}
          {/* Edge 1: USDC <-> WETH */}
          <path
            d="M 140 200 Q 250 110 360 100"
            fill="none"
            stroke={activeCycle ? '#06b6d4' : '#334155'}
            strokeWidth={activeCycle ? '3' : '2'}
            strokeDasharray={activeCycle ? '8 4' : 'none'}
            className={activeCycle ? 'animate-pulse' : ''}
          />
          {/* Edge 2: WETH <-> WBTC */}
          <path
            d="M 400 100 Q 510 110 620 200"
            fill="none"
            stroke={activeCycle ? '#10b981' : '#334155'}
            strokeWidth={activeCycle ? '3' : '2'}
            strokeDasharray={activeCycle ? '8 4' : 'none'}
            className={activeCycle ? 'animate-pulse' : ''}
          />
          {/* Edge 3: WBTC <-> USDC (Direct Rear eAxle Flash Link) */}
          <path
            d="M 620 230 Q 380 300 140 230"
            fill="none"
            stroke={activeCycle ? '#38bdf8' : '#334155'}
            strokeWidth={activeCycle ? '3.5' : '2'}
            strokeDasharray={activeCycle ? '6 3' : 'none'}
          />

          {/* Edge Venue Markers */}
          <g transform="translate(230, 130)">
            <rect x="-45" y="-12" width="90" height="24" rx="6" fill="#0f172a" stroke="#334155" strokeWidth="1" />
            <text x="0" y="4" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="JetBrains Mono" fontWeight="600">
              UNI / SUSHI
            </text>
          </g>

          <g transform="translate(530, 130)">
            <rect x="-45" y="-12" width="90" height="24" rx="6" fill="#0f172a" stroke="#334155" strokeWidth="1" />
            <text x="0" y="4" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="JetBrains Mono" fontWeight="600">
              UNI / CURVE
            </text>
          </g>

          <g transform="translate(380, 275)">
            <rect x="-65" y="-14" width="130" height="28" rx="6" fill="#032b30" stroke="#06b6d4" strokeWidth="1.5" />
            <text x="0" y="4" textAnchor="middle" fill="#22d3ee" fontSize="11" fontFamily="JetBrains Mono" fontWeight="700">
              DIRECT4 eAxle 15bp
            </text>
          </g>

          {/* Render Token Vertices */}
          {Object.entries(tokenCoords).map(([token, coord]) => {
            const isHovered = hoveredNode === token;
            const isInActiveCycle = activeCycle?.tokens.includes(token);

            return (
              <g
                key={token}
                transform={`translate(${coord.x}, ${coord.y})`}
                className="cursor-pointer transition-transform duration-200"
                onMouseEnter={() => setHoveredNode(token)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* Outer Glow Ring */}
                {isInActiveCycle && (
                  <circle
                    r="44"
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth="1.5"
                    strokeOpacity="0.4"
                    className="animate-ping"
                  />
                )}
                {/* Node Body */}
                <circle
                  r="36"
                  fill="#020617"
                  stroke={isInActiveCycle ? '#22d3ee' : '#334155'}
                  strokeWidth={isInActiveCycle ? '3' : '2'}
                  filter={isInActiveCycle ? 'url(#glow)' : undefined}
                />
                {/* Token Symbol */}
                <text
                  x="0"
                  y="-4"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="16"
                  fontFamily="Plus Jakarta Sans"
                  fontWeight="800"
                >
                  {token}
                </text>
                {/* Subtext */}
                <text
                  x="0"
                  y="14"
                  textAnchor="middle"
                  fill={isInActiveCycle ? '#34d399' : '#94a3b8'}
                  fontSize="10"
                  fontFamily="JetBrains Mono"
                  fontWeight="600"
                >
                  {token === 'USDC' ? 'BASE REF' : token === 'WETH' ? 'FRONT MG2' : 'REAR AXLE'}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Pool Inspection Strip */}
      <div className="mt-4 pt-4 border-t border-slate-800">
        <div className="text-xs uppercase font-mono tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Active Venue Liquidity Matrix (Click to inspect reserves & fee drag)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {pools.map((p) => {
            const isSelected = selectedPool?.pool_id === p.pool_id;
            const venueStyle = poolVenues[p.venue_id] || {
              label: p.venue_id,
              border: 'border-slate-700',
              bg: 'bg-slate-900',
            };

            return (
              <button
                key={p.pool_id}
                onClick={() => onSelectPool(p)}
                className={`text-left p-3.5 rounded-xl border transition-all duration-150 ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-950/30 ring-1 ring-cyan-400'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-bold font-mono text-white">
                    {p.token_a} / {p.token_b}
                  </span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                    {p.fee_bps} bps
                  </span>
                </div>
                <div className="text-xs text-zinc-400 font-mono mb-1 truncate">
                  {venueStyle.label} · {p.pool_id}
                </div>
                <div className="text-xs text-zinc-300 font-mono flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <span>R_A: {p.reserve_a.toLocaleString()}</span>
                  <span>R_B: {p.reserve_b.toLocaleString()}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
