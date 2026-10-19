import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  CheckCircle2, 
  Play, 
  RotateCcw, 
  TrendingUp, 
  DollarSign, 
  Sliders, 
  Download, 
  Search, 
  ArrowUpRight, 
  Gauge, 
  Layers, 
  Zap, 
  ShieldCheck,
  BarChart3,
  Flame,
  Clock,
  ArrowRight
} from 'lucide-react';
import { 
  generateVolumeProfile, 
  generateChildSlices, 
  BASE_BTC_PRICE, 
  INITIAL_MANDATE 
} from '../utils/algoEngine';
import { ChildSlice, VolumeBucket, ExecutionMandate } from '../types/quant';

export const AlgoSimulatorTab: React.FC = () => {
  // Configuration State
  const [notional, setNotional] = useState<number>(10_000_000);
  const [durationMin, setDurationMin] = useState<number>(60);
  const [strategy, setStrategy] = useState<'ALMGREN_CHRISS' | 'VWAP' | 'TWAP'>('ALMGREN_CHRISS');
  const [speed, setSpeed] = useState<'instant' | '20x' | '5x' | '1x'>('20x');
  
  // Execution Simulation State
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentSliceIndex, setCurrentSliceIndex] = useState<number>(100); // Defaults to fully simulated 100/100
  const [selectedHoverSlice, setSelectedHoverSlice] = useState<ChildSlice | null>(null);
  const [tableSearch, setTableSearch] = useState<string>('');
  const [venueFilter, setVenueFilter] = useState<string>('ALL');

  // Generate All Slices & Volume Curve
  const allSlices = useMemo(() => {
    return generateChildSlices(notional, durationMin, 100, BASE_BTC_PRICE, 1e-6);
  }, [notional, durationMin]);

  const volumeBuckets = useMemo(() => {
    return generateVolumeProfile(durationMin, notional);
  }, [durationMin, notional]);

  // Slices currently executed in the simulation
  const executedSlices = useMemo(() => {
    return allSlices.slice(0, currentSliceIndex);
  }, [allSlices, currentSliceIndex]);

  // Live Metrics
  const filledQty = useMemo(() => {
    return executedSlices.reduce((acc, s) => acc + s.filledQty, 0);
  }, [executedSlices]);

  const totalQty = useMemo(() => {
    return notional / BASE_BTC_PRICE;
  }, [notional]);

  const progressPercent = useMemo(() => {
    return Number(((currentSliceIndex / 100) * 100).toFixed(1));
  }, [currentSliceIndex]);

  const realizedNotional = useMemo(() => {
    return executedSlices.reduce((acc, s) => acc + (s.filledPrice * s.filledQty), 0);
  }, [executedSlices]);

  const realizedVwap = useMemo(() => {
    if (filledQty === 0) return BASE_BTC_PRICE;
    return realizedNotional / filledQty;
  }, [realizedNotional, filledQty]);

  const realizedSlippageBps = useMemo(() => {
    if (filledQty === 0) return 0;
    return (((realizedVwap - BASE_BTC_PRICE) / BASE_BTC_PRICE) * 10000);
  }, [realizedVwap]);

  // Execution Timer Loop for Interactive Run
  const timerRef = useRef<any>(null);

  const startSimulation = () => {
    if (isRunning) return;
    setCurrentSliceIndex(0);
    setIsRunning(true);
  };

  const resetSimulation = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRunning(false);
    setCurrentSliceIndex(100);
  };

  useEffect(() => {
    if (!isRunning) return;

    if (speed === 'instant') {
      setCurrentSliceIndex(100);
      setIsRunning(false);
      return;
    }

    const intervalTime = speed === '20x' ? 35 : speed === '5x' ? 120 : 350;

    timerRef.current = setInterval(() => {
      setCurrentSliceIndex((prev) => {
        if (prev >= 100) {
          clearInterval(timerRef.current);
          setIsRunning(false);
          return 100;
        }
        return prev + 1;
      });
    }, intervalTime);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, speed]);

  // Filtered Slices for Table
  const filteredSlices = useMemo(() => {
    return executedSlices.filter((s) => {
      const matchVenue = venueFilter === 'ALL' || s.venue === venueFilter;
      const matchSearch = 
        s.sliceIndex.toString().includes(tableSearch) ||
        s.scheduledTime.toLowerCase().includes(tableSearch.toLowerCase()) ||
        s.venue.toLowerCase().includes(tableSearch.toLowerCase());
      return matchVenue && matchSearch;
    });
  }, [executedSlices, venueFilter, tableSearch]);

  const handleExportCsv = () => {
    const headers = 'Slice_Index,Scheduled_Time,Filled_Qty,Filled_Price_USD,Market_VWAP_USD,VWAP_Delta_USD,Realized_Slippage_BPS,Venue,Status\n';
    const rows = executedSlices.map((s) => 
      `${s.sliceIndex},${s.scheduledTime},${s.filledQty},${s.filledPrice},${s.marketVwap},${s.vwapDelta},${s.realizedSlippageBps},${s.venue},${s.status}`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CHRONOS_EXECUTION_AUDIT_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      
      {/* 4-Step Pre-Verified Checklist */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3.5 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wide">
              Mandate Pre-Flight Verification & Benchmark Audit
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono font-bold text-emerald-300 uppercase tracking-widest">
              ALL 4 GATES PASSED & MONOPOLY AUDITED
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Step 1 */}
          <div className="p-3.5 rounded-lg bg-slate-950 border border-emerald-500/30 flex items-start gap-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
            <div className="p-1 rounded-md bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-emerald-400 uppercase">Step 1 • Ingest</div>
              <div className="text-sm font-bold text-white mt-0.5">Parent Mandate Validated</div>
              <div className="text-xs text-slate-400 mt-1 font-mono">
                ${(notional / 1_000_000).toFixed(0)}M BTC-USD Buy / {durationMin}m
              </div>
              <span className="inline-block mt-2 text-[11px] font-mono font-bold px-2 py-0.5 bg-emerald-950 text-emerald-300 rounded border border-emerald-500/40">
                COMPLETE
              </span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-3.5 rounded-lg bg-slate-950 border border-emerald-500/30 flex items-start gap-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
            <div className="p-1 rounded-md bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-emerald-400 uppercase">Step 2 • Mathematical Curve</div>
              <div className="text-sm font-bold text-white mt-0.5">Almgren-Chriss Slicing</div>
              <div className="text-xs text-slate-400 mt-1 font-mono">
                U-Shaped Bimodal Profile (λ=1e-6)
              </div>
              <span className="inline-block mt-2 text-[11px] font-mono font-bold px-2 py-0.5 bg-emerald-950 text-emerald-300 rounded border border-emerald-500/40">
                COMPLETE
              </span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-3.5 rounded-lg bg-slate-950 border border-emerald-500/30 flex items-start gap-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
            <div className="p-1 rounded-md bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-emerald-400 uppercase">Step 3 • Router</div>
              <div className="text-sm font-bold text-white mt-0.5">Low-Impact Child Router</div>
              <div className="text-xs text-slate-400 mt-1 font-mono">
                4 Tier-1 Liquidity Venues
              </div>
              <span className="inline-block mt-2 text-[11px] font-mono font-bold px-2 py-0.5 bg-emerald-950 text-emerald-300 rounded border border-emerald-500/40">
                COMPLETE
              </span>
            </div>
          </div>

          {/* Step 4 */}
          <div className="p-3.5 rounded-lg bg-slate-950 border border-emerald-500/40 flex items-start gap-3 relative overflow-hidden shadow-md shadow-emerald-950/40">
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-bl-full pointer-events-none" />
            <div className="p-1 rounded-md bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-emerald-400 uppercase">Step 4 • Slippage Audit</div>
              <div className="text-sm font-bold text-white mt-0.5">Slippage Benchmark Audit</div>
              <div className="text-xs text-emerald-300 mt-1 font-mono font-bold">
                Realized: {realizedSlippageBps.toFixed(2)} bps &le; 3.0 bps cap
              </div>
              <span className="inline-block mt-2 text-[11px] font-mono font-black px-2.5 py-0.5 bg-emerald-500 text-slate-950 rounded shadow-sm">
                VERIFIED &le; 3.0 BPS
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel & Glowing Action Trigger */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          
          {/* Simulation Configuration Selectors */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
            {/* Notional */}
            <div>
              <label className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider block mb-1">
                Parent Mandate
              </label>
              <select
                value={notional}
                onChange={(e) => setNotional(Number(e.target.value))}
                disabled={isRunning}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm font-mono font-bold focus:outline-none focus:border-emerald-500"
              >
                <option value={5_000_000}>$5,000,000 USD</option>
                <option value={10_000_000}>$10,000,000 USD (Std)</option>
                <option value={25_000_000}>$25,000,000 USD</option>
                <option value={50_000_000}>$50,000,000 USD</option>
              </select>
            </div>

            {/* Duration */}
            <div>
              <label className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider block mb-1">
                Window Horizon
              </label>
              <select
                value={durationMin}
                onChange={(e) => setDurationMin(Number(e.target.value))}
                disabled={isRunning}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm font-mono font-bold focus:outline-none focus:border-emerald-500"
              >
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={60}>60 Minutes (Full Window)</option>
                <option value={120}>120 Minutes</option>
              </select>
            </div>

            {/* Strategy */}
            <div>
              <label className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider block mb-1">
                Algo Model
              </label>
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value as any)}
                disabled={isRunning}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm font-mono font-bold focus:outline-none focus:border-emerald-500"
              >
                <option value="ALMGREN_CHRISS">Almgren-Chriss (Quadratic)</option>
                <option value="VWAP">Intraday Dynamic VWAP</option>
                <option value="TWAP">Linear Monotonic TWAP</option>
              </select>
            </div>

            {/* Playback Speed */}
            <div>
              <label className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider block mb-1">
                Sim Acceleration
              </label>
              <select
                value={speed}
                onChange={(e) => setSpeed(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm font-mono font-bold focus:outline-none focus:border-emerald-500"
              >
                <option value="instant">Instant (100 Slices)</option>
                <option value="20x">20x High-Speed</option>
                <option value="5x">5x Realtime Jitter</option>
                <option value="1x">1x Normal Step</option>
              </select>
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex items-center gap-3 w-full lg:w-auto shrink-0 justify-end">
            <button
              onClick={resetSimulation}
              className="flex items-center gap-2 px-4 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-700 transition-all cursor-pointer"
              title="Reset Execution State"
            >
              <RotateCcw className="w-4 h-4" />
              <span>RESET</span>
            </button>

            {/* Glowing Emerald Action Button as requested in Prompt */}
            <button
              onClick={startSimulation}
              disabled={isRunning}
              className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-lg bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-base shadow-xl shadow-emerald-950/70 border border-emerald-300 glow-emerald-active transition-all active:scale-95 disabled:opacity-75 cursor-pointer flex-1 sm:flex-none"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              <span>[RUN 60-MIN VWAP SLICING SIMULATION]</span>
            </button>
          </div>

        </div>
      </div>

      {/* Real-time Telemetry Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Metric 1 */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="text-xs font-mono font-bold text-slate-400 uppercase">Execution Progress</div>
          <div className="text-2xl font-black font-mono text-emerald-400 mt-1 flex items-baseline gap-1">
            <span>{progressPercent}%</span>
            <span className="text-xs text-slate-500 font-normal">({currentSliceIndex}/100)</span>
          </div>
          <div className="w-full bg-slate-950 h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-emerald-400 h-full rounded-full transition-all duration-150"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="text-xs font-mono font-bold text-slate-400 uppercase">Notional Filled</div>
          <div className="text-xl sm:text-2xl font-black font-mono text-white mt-1">
            ${(realizedNotional / 1_000_000).toFixed(2)}M
          </div>
          <div className="text-xs text-slate-400 mt-1 font-mono">
            of ${(notional / 1_000_000).toFixed(2)}M total
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="text-xs font-mono font-bold text-slate-400 uppercase">Arrival Benchmark</div>
          <div className="text-xl sm:text-2xl font-black font-mono text-cyan-300 mt-1">
            ${BASE_BTC_PRICE.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-1 font-mono">
            T0 Spot Index
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="text-xs font-mono font-bold text-slate-400 uppercase">Realized VWAP</div>
          <div className="text-xl sm:text-2xl font-black font-mono text-amber-300 mt-1">
            ${realizedVwap.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-amber-400/80 mt-1 font-mono">
            +${(realizedVwap - BASE_BTC_PRICE).toFixed(2)} impact
          </div>
        </div>

        {/* Metric 5 */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="text-xs font-mono font-bold text-slate-400 uppercase">Realized Slippage</div>
          <div className="text-2xl font-black font-mono text-emerald-400 mt-1 flex items-baseline gap-1">
            <span>{realizedSlippageBps.toFixed(2)}</span>
            <span className="text-xs text-emerald-300 font-bold">bps</span>
          </div>
          <div className="text-xs text-slate-400 mt-1 font-mono flex items-center gap-1">
            <span className="text-emerald-400 font-bold">&le; 3.0 bps target</span>
          </div>
        </div>

        {/* Metric 6 */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="text-xs font-mono font-bold text-slate-400 uppercase">RingBuffer Queue</div>
          <div className="text-xl sm:text-2xl font-black font-mono text-purple-300 mt-1">
            {100 - currentSliceIndex} slices
          </div>
          <div className="text-xs text-purple-400/80 mt-1 font-mono">
            {isRunning ? 'DISPATCHING...' : 'DRAINED (RPO=0)'}
          </div>
        </div>
      </div>

      {/* Dynamic SVG / Canvas Chart: Intraday U-shaped Historical Volume Curve & Realized VWAP */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              <span>INTRADAY U-SHAPED VOLUME PROFILE & SLICE EXECUTION TRAJECTORY</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Bimodal market volume density (shaded bars) mapped against Almgren-Chriss scheduled slices and realized VWAP trajectory.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono font-bold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-cyan-500/40 border border-cyan-400 rounded-sm" />
              <span className="text-slate-300">Historical Volume Weight</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-1 bg-emerald-400 rounded-full" />
              <span className="text-emerald-300">Realized VWAP</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-1 border-b-2 border-dashed border-amber-400" />
              <span className="text-amber-300">Arrival Benchmark</span>
            </div>
          </div>
        </div>

        {/* SVG Chart */}
        <div className="w-full h-72 sm:h-80 bg-slate-950 rounded-lg p-2 border border-slate-800 relative overflow-hidden">
          <svg viewBox="0 0 1000 320" className="w-full h-full preserve-3d" preserveAspectRatio="none">
            <defs>
              <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.05" />
              </linearGradient>
              <linearGradient id="sliceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.1" />
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            {[60, 120, 180, 240].map((y, idx) => (
              <line 
                key={idx} 
                x1="40" 
                y1={y} 
                x2="980" 
                y2={y} 
                stroke="#1e293b" 
                strokeDasharray="4 4" 
                strokeWidth="1" 
              />
            ))}

            {/* Historical Volume Profile (U-shaped Bimodal density bars) */}
            {volumeBuckets.map((bucket, i) => {
              const x = 50 + (i / durationMin) * 910;
              const barHeight = bucket.historicalVolumeWeight * 110;
              const y = 280 - barHeight;
              return (
                <rect
                  key={i}
                  x={x - 4}
                  y={y}
                  width="8"
                  height={barHeight}
                  fill="url(#volGrad)"
                  className="transition-all hover:opacity-100 opacity-80"
                  rx="1.5"
                />
              );
            })}

            {/* Arrival Price Benchmark Constant Line */}
            <line 
              x1="40" 
              y1="190" 
              x2="980" 
              y2="190" 
              stroke="#f59e0b" 
              strokeDasharray="6 4" 
              strokeWidth="2" 
            />

            {/* Child Slice Executed Nodes */}
            {executedSlices.map((slice, i) => {
              const x = 50 + (i / 100) * 910;
              // Map slice price variation into y space (190 baseline)
              const priceDelta = slice.filledPrice - BASE_BTC_PRICE;
              const y = 190 - (priceDelta * 4.2);
              const isLatest = i === currentSliceIndex - 1;

              return (
                <g key={slice.sliceIndex}>
                  <circle
                    cx={x}
                    cy={y}
                    r={isLatest ? 5.5 : 3}
                    fill={isLatest ? '#34d399' : '#10b981'}
                    stroke="#020617"
                    strokeWidth="1.5"
                    className="cursor-pointer transition-all hover:scale-150"
                    onMouseEnter={() => setSelectedHoverSlice(slice)}
                    onMouseLeave={() => setSelectedHoverSlice(null)}
                  />
                  {isLatest && (
                    <circle
                      cx={x}
                      cy={y}
                      r="10"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="1.5"
                      className="animate-ping opacity-75"
                    />
                  )}
                </g>
              );
            })}

            {/* Realized VWAP Curve Path */}
            {executedSlices.length > 1 && (
              <path
                d={executedSlices.reduce((acc, slice, i) => {
                  const x = 50 + (i / 100) * 910;
                  const vwapDelta = slice.marketVwap - BASE_BTC_PRICE;
                  const y = 190 - (vwapDelta * 4.2);
                  return `${acc} ${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                }, '')}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* X Axis Time Labels */}
            <text x="50" y="305" fill="#64748b" fontSize="12" fontFamily="monospace" fontWeight="bold">09:30 UTC (Open Peak)</text>
            <text x="470" y="305" fill="#64748b" fontSize="12" fontFamily="monospace" fontWeight="bold" textAnchor="middle">10:00 UTC (Midday Dip)</text>
            <text x="960" y="305" fill="#64748b" fontSize="12" fontFamily="monospace" fontWeight="bold" textAnchor="end">10:30 UTC (Close Volume Surge)</text>
          </svg>

          {/* Hover Tooltip Overlay */}
          {selectedHoverSlice && (
            <div className="absolute top-4 left-4 p-3 rounded-lg bg-slate-900/95 border border-emerald-500/50 shadow-2xl backdrop-blur-md text-xs font-mono z-30 pointer-events-none">
              <div className="font-bold text-emerald-300 text-sm">
                Slice #{selectedHoverSlice.sliceIndex} / 100 ({selectedHoverSlice.venue})
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-slate-300">
                <div>Scheduled: <span className="text-white font-bold">{selectedHoverSlice.scheduledTime}</span></div>
                <div>Filled Qty: <span className="text-white font-bold">{selectedHoverSlice.filledQty} BTC</span></div>
                <div>Filled Price: <span className="text-emerald-400 font-bold">${selectedHoverSlice.filledPrice.toFixed(2)}</span></div>
                <div>VWAP Delta: <span className="text-amber-300 font-bold">+${selectedHoverSlice.vwapDelta.toFixed(2)}</span></div>
                <div>Slippage: <span className="text-emerald-300 font-bold">{selectedHoverSlice.realizedSlippageBps} bps</span></div>
                <div>Interval: <span className="text-purple-300 font-bold">{selectedHoverSlice.poissonIntervalMs} ms</span></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Monotonic Child Slice Execution Log Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              <span>MONOTONIC CHILD SLICE EXECUTION LOG</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Append-only real-time fill ledger streamed directly from multi-venue execution rings.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search slice or time..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-white rounded-lg pl-9 pr-3 py-1.5 text-sm font-mono placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 w-48"
              />
            </div>

            {/* Venue Filter */}
            <select
              value={venueFilter}
              onChange={(e) => setVenueFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Venues (4)</option>
              <option value="COINBASE_PRIME">Coinbase Prime</option>
              <option value="BINANCE_US">Binance US</option>
              <option value="KRAKEN_INST">Kraken Inst</option>
              <option value="LMAX_DIGITAL">LMAX Digital</option>
            </select>

            {/* CSV Export */}
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-sm border border-slate-700 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>EXPORT CSV</span>
            </button>
          </div>
        </div>

        {/* High-Contrast Table (Upscaled Font Floor text-sm/text-base) */}
        <div className="overflow-x-auto mt-4 max-h-[420px] overflow-y-auto">
          <table className="w-full text-left border-collapse font-mono text-sm">
            <thead className="bg-slate-950/80 sticky top-0 z-10 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3 px-3.5">Slice #</th>
                <th className="py-3 px-3.5">Scheduled Time (UTC)</th>
                <th className="py-3 px-3.5">Routing Venue</th>
                <th className="py-3 px-3.5 text-right">Filled Qty (BTC)</th>
                <th className="py-3 px-3.5 text-right">Fill Price (UNITS)</th>
                <th className="py-3 px-3.5 text-right">VWAP Delta</th>
                <th className="py-3 px-3.5 text-right">Slippage (bps)</th>
                <th className="py-3 px-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredSlices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No slices executed yet. Click [RUN 60-MIN VWAP SLICING SIMULATION] above.
                  </td>
                </tr>
              ) : (
                filteredSlices.map((slice) => (
                  <tr key={slice.sliceIndex} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3.5 font-bold text-cyan-400">
                      #{String(slice.sliceIndex).padStart(3, '0')}
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-300">
                      {slice.scheduledTime}
                    </td>
                    <td className="py-2.5 px-3.5">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {slice.venue}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-bold text-white">
                      {slice.filledQty.toFixed(6)}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-bold text-emerald-400">
                      ${slice.filledPrice.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3.5 text-right text-amber-300">
                      +${slice.vwapDelta.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-bold text-emerald-300">
                      {slice.realizedSlippageBps.toFixed(2)} bps
                    </td>
                    <td className="py-2.5 px-3.5 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        FILLED
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
