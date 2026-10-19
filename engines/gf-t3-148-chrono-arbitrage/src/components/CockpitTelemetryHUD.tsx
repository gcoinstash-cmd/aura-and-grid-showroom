import React, { useState } from 'react';
import {
  ArbitrageRoute,
  OrderBookTick,
  VenueLatencyTelemetry,
  ExecutionDispatch,
} from '../types/quant';
import { CurrencyGraphCanvas } from './CurrencyGraphCanvas';
import { ClientCurrencyGraph } from '../core/bellmanFord';
import {
  TrendingUp,
  Clock,
  Cpu,
  Layers,
  CheckCircle2,
  Sliders,
  Radio,
  Lock,
} from 'lucide-react';

interface Props {
  routes: ArbitrageRoute[];
  ticks: OrderBookTick[];
  graph: ClientCurrencyGraph;
  venues: VenueLatencyTelemetry[];
  dispatches: ExecutionDispatch[];
  onDispatchRoute: (route: ArbitrageRoute, capital: number) => void;
  ticksPerSec: number;
  solverLatencyUs: number;
  capitalUsd: number;
  setCapitalUsd: (val: number) => void;
  cumulativePnL: number;
}

export const CockpitTelemetryHUD: React.FC<Props> = ({
  routes,
  ticks,
  graph,
  venues,
  dispatches,
  onDispatchRoute,
  ticksPerSec,
  solverLatencyUs,
  capitalUsd,
  setCapitalUsd,
  cumulativePnL,
}) => {
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  const activeRoute =
    routes.find((r) => r.id === selectedRouteId) || (routes.length > 0 ? routes[0] : null);

  const { nodes, edges } = graph.getSnapshot();

  const topSpreadBps = routes.length > 0 ? routes[0].netProfitBps : 0.0;

  return (
    <div className="space-y-6">
      {/* 1. HIGH-CONTRAST HERO COCKPIT METRICS (BOLD TEXT-3XL/4XL NUMBERS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Cumulative Realized PnL */}
        <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between text-zinc-300 font-mono text-sm mb-1.5 font-bold">
            <span className="uppercase tracking-wider">Cumulative Realized PnL</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-emerald-400">
            +${cumulativePnL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-2.5 flex items-center gap-2 text-sm font-mono text-zinc-200">
            <span className="px-2 py-0.5 rounded bg-emerald-950/90 text-emerald-300 font-bold border border-emerald-700/60">
              ATOMIC 2PC
            </span>
            <span className="font-semibold text-zinc-300">Zero Unhedged Legs</span>
          </div>
        </div>

        {/* Metric 2: Top Detected Negative Cycle Spread */}
        <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between text-zinc-300 font-mono text-sm mb-1.5 font-bold">
            <span className="uppercase tracking-wider">Top Detected Net Spread</span>
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-ping" />
          </div>
          <div className="text-3xl sm:text-4xl font-black font-mono text-amber-300 drop-shadow-[0_0_14px_rgba(251,191,36,0.35)]">
            +{topSpreadBps.toFixed(1)} <span className="text-xl font-bold text-amber-500">BPS</span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-sm font-mono text-zinc-200">
            <span>Active Cycles: <strong className="text-white font-extrabold">{routes.length}</strong></span>
            <span>Fee Deducted: <strong className="text-zinc-100 font-bold">~22.5 bps</strong></span>
          </div>
        </div>

        {/* Metric 3: Tick Ingestion Throughput */}
        <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-300 font-mono text-sm mb-1.5 font-bold">
            <span className="uppercase tracking-wider">Tick Ingestion Rate</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl sm:text-4xl font-black font-mono text-cyan-400">
            {ticksPerSec.toLocaleString()} <span className="text-xl font-bold text-cyan-500">TICKS/S</span>
          </div>
          <div className="mt-2.5 flex items-center gap-2 text-sm font-mono text-zinc-200">
            <span className="px-2 py-0.5 rounded bg-cyan-950/90 text-cyan-300 font-bold border border-cyan-700/60">
              TARGET &ge; 50,000
            </span>
            <span className="font-semibold text-zinc-300">Zero-Copy Ring Buffer</span>
          </div>
        </div>

        {/* Metric 4: Solver Latency P99 */}
        <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-300 font-mono text-sm mb-1.5 font-bold">
            <span className="uppercase tracking-wider">P99 Solver Latency</span>
            <Clock className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-3xl sm:text-4xl font-black font-mono text-violet-400">
            {solverLatencyUs} <span className="text-xl font-bold text-violet-500">&mu;s</span>
          </div>
          <div className="mt-2.5 flex items-center gap-2 text-sm font-mono text-zinc-200">
            <span className="px-2 py-0.5 rounded bg-violet-950/90 text-violet-300 font-bold border border-violet-700/60">
              &lt; 420 &mu;s TARGET
            </span>
            <span className="font-semibold text-zinc-300">Negative-Log Relaxation</span>
          </div>
        </div>
      </div>

      {/* 2. GRAPH & CAPITAL SIZING ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visual Currency DAG Graph */}
        <div className="lg:col-span-8 space-y-4">
          <CurrencyGraphCanvas
            nodes={nodes}
            edges={edges}
            activeRoute={activeRoute}
            onSelectNode={() => {}}
          />

          {/* Quick Capital Allocation & Quadratic Depth Sizer */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex flex-wrap items-center justify-between gap-4 font-mono text-sm">
            <div className="flex items-center gap-2 text-zinc-100 font-bold">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>CAPITAL SIZER &amp; SLIPPAGE SENSITIVITY:</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-zinc-300 font-medium">Allocation:</span>
              <input
                type="range"
                min="5000"
                max="100000"
                step="5000"
                value={capitalUsd}
                onChange={(e) => setCapitalUsd(Number(e.target.value))}
                className="w-36 accent-emerald-500 cursor-pointer"
              />
              <span className="text-emerald-400 font-black text-base px-2.5 py-0.5 rounded bg-zinc-900 border border-zinc-700">
                ${capitalUsd.toLocaleString()} USD
              </span>
            </div>

            <div className="text-zinc-300 font-medium">
              Quadratic Impact: <span className="text-amber-300 font-bold">0.125 &times; (Q/Depth)&sup2;</span>
            </div>
          </div>
        </div>

        {/* Right Column: Venue Latency Radar & Status */}
        <div className="lg:col-span-4 bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 text-sm font-mono">
              <div className="flex items-center gap-2 font-bold text-zinc-100">
                <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span>CROSS-VENUE LATENCY RADAR</span>
              </div>
              <span className="text-zinc-400 font-bold">5/5 Connected</span>
            </div>

            <div className="mt-3.5 space-y-3 font-mono text-sm">
              {venues.map((v) => (
                <div
                  key={v.venue}
                  className="p-3 rounded-lg bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 transition flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white text-base">{v.venue}</span>
                      <span className="text-xs text-zinc-400">({v.location})</span>
                    </div>
                    <div className="text-xs text-zinc-300 font-medium">
                      Depth: <span className="text-zinc-100 font-bold">${(v.orderbookDepthUsd / 1_000_000).toFixed(2)}M</span> | Jitter: <span className="text-zinc-100 font-bold">{v.jitterUs}&mu;s</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`text-base font-black ${
                        v.pingMs < 1.0
                          ? 'text-emerald-400'
                          : v.pingMs < 1.5
                          ? 'text-cyan-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {v.pingMs.toFixed(2)} ms
                    </div>
                    <div className="text-xs text-emerald-400 font-bold flex items-center justify-end gap-1.5 mt-0.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      {v.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800 text-xs font-mono text-zinc-300 flex items-center justify-between">
            <span>Direct Co-located Equinix LD4 / NY4</span>
            <span className="text-emerald-400 font-bold">0% Packets Dropped</span>
          </div>
        </div>
      </div>

      {/* 3. HIGH-VISIBILITY MONOSPACE TABLE: DETECTED NEGATIVE CYCLES */}
      <div className="bg-zinc-950 rounded-xl border border-zinc-800 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-emerald-400" />
            <h3 className="font-mono text-base font-extrabold text-white uppercase tracking-wider">
              Detected Negative-Log Cycles (w = -ln(R(1-f)) &lt; 0)
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-800 font-mono text-zinc-200 font-bold border border-zinc-700">
              {routes.length} Active Opportunities
            </span>
          </div>

          <div className="text-sm font-mono text-zinc-300 flex items-center gap-4">
            <span>Locking Mode: <strong className="text-emerald-400 font-bold">Isolated 2PC</strong></span>
            <span>Fee Floor: <strong className="text-amber-400 font-bold">&ge; 4.0 BPS</strong></span>
          </div>
        </div>

        {routes.length === 0 ? (
          <div className="py-12 text-center font-mono text-sm text-zinc-400 border border-dashed border-zinc-800 rounded-lg">
            Scanning cross-venue orderbooks... All exchange loops currently balanced within fee bands.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-sm border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/90 text-zinc-300 text-xs font-bold tracking-wider">
                  <th className="py-3 px-3.5">CYCLE ID &amp; PATH</th>
                  <th className="py-3 px-3.5">EXECUTION ROUTE LEGS</th>
                  <th className="py-3 px-3.5 text-right">GROSS MULT</th>
                  <th className="py-3 px-3.5 text-right">NET SPREAD</th>
                  <th className="py-3 px-3.5 text-right">SLIPPAGE</th>
                  <th className="py-3 px-3.5 text-right">EST. NET YIELD</th>
                  <th className="py-3 px-3.5 text-center">FILL LATENCY</th>
                  <th className="py-3 px-3.5 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {routes.map((route) => {
                  const isSelected = route.id === activeRoute?.id;
                  return (
                    <tr
                      key={route.id}
                      onClick={() => setSelectedRouteId(route.id)}
                      className={`cursor-pointer transition ${
                        isSelected
                          ? 'bg-emerald-950/30 border-l-4 border-emerald-400'
                          : 'hover:bg-zinc-900/60'
                      }`}
                    >
                      <td className="py-3.5 px-3.5">
                        <div className="text-xs text-zinc-400 font-medium">
                          {route.id.split('-').slice(0, 2).join('-')}
                        </div>
                        <div className="text-emerald-400 font-black text-base mt-0.5 flex items-center gap-1.5">
                          {route.cycleNodes.join(' → ')}
                        </div>
                      </td>

                      <td className="py-3.5 px-3.5">
                        <div className="flex flex-wrap gap-1.5">
                          {route.edges.map((edge, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-xs font-semibold text-zinc-100"
                            >
                              <strong className="text-cyan-400">{edge.venue}</strong>: {edge.action} {edge.symbol}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3.5 px-3.5 text-right text-zinc-100 font-bold">
                        {route.grossMultiplier.toFixed(5)}x
                      </td>

                      <td className="py-3.5 px-3.5 text-right">
                        <span className="text-base font-black text-amber-300">
                          +{route.netProfitBps.toFixed(1)} BPS
                        </span>
                      </td>

                      <td className="py-3.5 px-3.5 text-right text-zinc-300 font-semibold">
                        -{route.slippageBps.toFixed(1)} BPS
                      </td>

                      <td className="py-3.5 px-3.5 text-right">
                        <span className="text-base font-black text-emerald-400">
                          +${route.expectedProfitUsd.toFixed(2)}
                        </span>
                        <div className="text-xs text-zinc-400">on ${capitalUsd.toLocaleString()}</div>
                      </td>

                      <td className="py-3.5 px-3.5 text-center text-zinc-200">
                        <span className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-violet-300 font-bold text-xs">
                          ~{route.estimatedFillMs} ms
                        </span>
                      </td>

                      <td className="py-3.5 px-3.5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDispatchRoute(route, capitalUsd);
                          }}
                          className="px-3.5 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black text-xs transition flex items-center gap-1.5 shadow-md ml-auto"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          DISPATCH 2PC
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. DUAL PANELS: LIVE ORDERBOOK STREAM & EXECUTION DISPATCH AUDIT LEDGER */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel: High-Frequency L1 Orderbook Stream */}
        <div className="bg-zinc-950 rounded-xl border border-zinc-800 p-5 space-y-3.5">
          <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800">
            <div className="flex items-center gap-2 font-mono text-sm font-bold text-white">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping" />
              <span>LIVE L1 ORDERBOOK STREAM</span>
            </div>
            <span className="font-mono text-xs text-zinc-400 font-semibold">Top-of-Book Feeds</span>
          </div>

          <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
            <table className="w-full text-left font-mono text-sm border-collapse">
              <thead>
                <tr className="text-zinc-400 border-b border-zinc-800/80 sticky top-0 bg-zinc-950 text-xs font-bold tracking-wider">
                  <th className="py-2 px-3">VENUE / PAIR</th>
                  <th className="py-2 px-3 text-right">BID PRICE</th>
                  <th className="py-2 px-3 text-right">ASK PRICE</th>
                  <th className="py-2 px-3 text-right">SPREAD</th>
                  <th className="py-2 px-3 text-right">TAKER FEE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {ticks.map((t, idx) => {
                  const spread = t.askPrice - t.bidPrice;
                  const spreadBps = (spread / t.bidPrice) * 10000;
                  return (
                    <tr key={`${t.venue}-${t.symbol}-${idx}`} className="hover:bg-zinc-900/70 transition">
                      <td className="py-2.5 px-3">
                        <span className="font-black text-cyan-400">{t.venue}</span>{' '}
                        <span className="text-zinc-100 font-extrabold">{t.symbol}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-400 font-black">
                        {t.bidPrice > 100 ? t.bidPrice.toFixed(2) : t.bidPrice.toFixed(5)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-rose-400 font-black">
                        {t.askPrice > 100 ? t.askPrice.toFixed(2) : t.askPrice.toFixed(5)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-zinc-200 font-semibold">
                        {spreadBps.toFixed(1)} bps
                      </td>
                      <td className="py-2.5 px-3 text-right text-amber-300 font-bold">
                        {t.takerFeeBps.toFixed(1)} bps
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Panel: Execution Dispatch Audit Ledger */}
        <div className="bg-zinc-950 rounded-xl border border-zinc-800 p-5 space-y-3.5">
          <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800">
            <div className="flex items-center gap-2 font-mono text-sm font-bold text-white">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>ATOMIC 2PC DISPATCH AUDIT LEDGER</span>
            </div>
            <span className="font-mono text-xs text-zinc-400 font-semibold">AlloyDB Sync</span>
          </div>

          <div className="overflow-x-auto max-h-[320px] overflow-y-auto space-y-2.5">
            {dispatches.length === 0 ? (
              <div className="py-12 text-center font-mono text-sm text-zinc-400">
                No orders dispatched in this session. Click &quot;DISPATCH 2PC&quot; on any detected cycle above.
              </div>
            ) : (
              dispatches.map((disp) => (
                <div
                  key={disp.dispatchId}
                  className="p-3 rounded-lg bg-zinc-900/90 border border-zinc-800 font-mono text-sm space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-emerald-400 text-base">{disp.path}</span>
                    <span className="px-2.5 py-0.5 rounded bg-emerald-950 border border-emerald-500 text-emerald-300 font-black text-xs">
                      {disp.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-zinc-200 text-xs sm:text-sm">
                    <span>
                      Capital: <strong className="text-white font-extrabold">${disp.allocatedCapitalUsd.toLocaleString()}</strong>
                    </span>
                    <span>
                      Realized PnL:{' '}
                      <strong className="text-emerald-400 font-black">
                        +${disp.realizedProfitUsd.toFixed(2)}
                      </strong>
                    </span>
                    <span>
                      Dispatch Time: <strong className="text-violet-300 font-bold">{disp.dispatchTimeUs}&mu;s</strong>
                    </span>
                  </div>

                  <div className="pt-1.5 border-t border-zinc-800 flex flex-wrap gap-1.5 text-xs text-zinc-300 font-medium">
                    {disp.legs.map((leg, lIdx) => (
                      <span key={lIdx} className="bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 text-zinc-200">
                        <strong className="text-cyan-400">{leg.venue}</strong>: {leg.action} {leg.pair} @ {leg.price} (lat: {leg.latencyUs}&mu;s)
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
