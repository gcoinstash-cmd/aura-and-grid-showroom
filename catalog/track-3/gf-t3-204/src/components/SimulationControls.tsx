import React from 'react';
import { ExecutionStrategy, SimulationParams } from '../types';

interface SimulationControlsProps {
  params: SimulationParams;
  setParams: React.Dispatch<React.SetStateAction<SimulationParams>>;
  isExecuting: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onReset: () => void;
  onInjectMillionOrder: () => void;
  onTriggerVolumeSpike: () => void;
  onSimulateSpreadWidening: () => void;
  onExportFillTape: (format: 'csv' | 'json') => void;
  volumeShock: boolean;
  spreadWidened: boolean;
  spreadBps: number;
  execSpeed: number;
  setExecSpeed: (speed: number) => void;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  params,
  setParams,
  isExecuting,
  onPlay,
  onPause,
  onStep,
  onReset,
  onInjectMillionOrder,
  onTriggerVolumeSpike,
  onSimulateSpreadWidening,
  onExportFillTape,
  volumeShock,
  spreadWidened,
  spreadBps,
  execSpeed,
  setExecSpeed,
}) => {
  return (
    <div className="bg-zinc-900/70 border border-zinc-800 rounded-lg p-5 space-y-4">
      {/* Header and Required Simulation Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
        <div>
          <span className="text-sm uppercase tracking-wider text-zinc-400 font-medium">Quant Execution Simulator</span>
          <div className="text-base font-semibold text-zinc-200">Execution Controls & Shock Injections</div>
        </div>

        {/* 4 Required Simulation Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onInjectMillionOrder}
            disabled={isExecuting}
            className="min-h-[44px] px-4 py-2.5 text-sm font-bold rounded-md bg-cyan-500 hover:bg-cyan-400 text-zinc-950 transition-all disabled:opacity-50 cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.3)]"
          >
            Inject 1M Notional Parent Order
          </button>

          <button
            onClick={onTriggerVolumeSpike}
            className={`min-h-[44px] px-4 py-2.5 text-sm font-bold rounded-md border transition-all cursor-pointer ${
              volumeShock
                ? 'bg-rose-500/20 text-rose-300 border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                : 'bg-zinc-950 text-zinc-300 border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800'
            }`}
          >
            {volumeShock ? 'Volume Spike Active (Shock ON)' : 'Trigger Sudden Volume Spike'}
          </button>

          <button
            onClick={onSimulateSpreadWidening}
            className={`min-h-[44px] px-4 py-2.5 text-sm font-bold rounded-md border transition-all cursor-pointer ${
              spreadWidened
                ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                : 'bg-zinc-950 text-zinc-300 border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800'
            }`}
          >
            {spreadWidened ? `Spread Widened (${spreadBps} bps)` : 'Simulate Spread Widening'}
          </button>

          {/* Export dropdown */}
          <div className="relative inline-flex rounded-md bg-zinc-950 border border-zinc-700 min-h-[44px] items-center">
            <button
              onClick={() => onExportFillTape('csv')}
              className="px-4 py-2.5 text-sm font-semibold text-zinc-200 hover:bg-zinc-800 transition-colors rounded-l-md cursor-pointer"
            >
              Export Fill Tape (CSV)
            </button>
            <span className="w-px bg-zinc-700 self-stretch"></span>
            <button
              onClick={() => onExportFillTape('json')}
              className="px-3 py-2.5 text-sm font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors rounded-r-md cursor-pointer"
              title="Export as JSON"
            >
              JSON
            </button>
          </div>
        </div>
      </div>

      {/* Playback & Speed Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-950/80 p-3 rounded-md border border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          {isExecuting ? (
            <button
              onClick={onPause}
              className="min-h-[40px] px-4 py-2 text-sm font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-md hover:bg-amber-500/30 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Pause Execution</span>
            </button>
          ) : (
            <button
              onClick={onPlay}
              className="min-h-[40px] px-4 py-2 text-sm font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-md hover:bg-emerald-500/30 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Resume Execution</span>
            </button>
          )}

          <button
            onClick={onStep}
            disabled={isExecuting}
            className="min-h-[40px] px-3.5 py-2 text-sm font-semibold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-md transition-all disabled:opacity-40 cursor-pointer"
          >
            Step Slice (+1)
          </button>

          <button
            onClick={onReset}
            className="min-h-[40px] px-3.5 py-2 text-sm font-semibold text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md transition-all cursor-pointer"
          >
            Reset Order
          </button>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-2 text-sm font-mono">
          <span className="text-zinc-400 font-medium mr-1">Sim Speed:</span>
          {[1, 2, 5, 10].map((spd) => (
            <button
              key={spd}
              onClick={() => setExecSpeed(spd)}
              className={`px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                execSpeed === spd
                  ? 'bg-cyan-500 text-zinc-950 font-bold'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              {spd}x
            </button>
          ))}
          <button
            onClick={() => setExecSpeed(999)}
            className={`px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
              execSpeed === 999
                ? 'bg-cyan-500 text-zinc-950 font-bold'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
            title="Instant fill all slices"
          >
            Instant
          </button>
        </div>
      </div>

      {/* Quantitative Parameter Tuning Form */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 text-sm font-mono">
        {/* Symbol */}
        <div>
          <label className="text-zinc-400 block mb-1 font-medium">Symbol</label>
          <select
            value={params.symbol}
            disabled={isExecuting}
            onChange={(e) => setParams((p) => ({ ...p, symbol: e.target.value }))}
            className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-md px-3 py-2 focus:border-cyan-500 focus:outline-none"
          >
            <option value="SYNTH-ALPHA">SYNTH-ALPHA (125.50 pts)</option>
            <option value="SYNTH-BETA">SYNTH-BETA (228.00 pts)</option>
            <option value="INDEX-CORE">INDEX-CORE (442.20 pts)</option>
            <option value="ETF-BENCH">ETF-BENCH (585.10 pts)</option>
            <option value="QUANT-PRIME">QUANT-PRIME (260.40 pts)</option>
          </select>
        </div>

        {/* Strategy */}
        <div>
          <label className="text-zinc-400 block mb-1 font-medium">Execution Model</label>
          <select
            value={params.strategy}
            disabled={isExecuting}
            onChange={(e) => setParams((p) => ({ ...p, strategy: e.target.value as ExecutionStrategy }))}
            className="w-full bg-zinc-950 border border-zinc-800 text-cyan-400 font-semibold rounded-md px-3 py-2 focus:border-cyan-500 focus:outline-none"
          >
            <option value="ALMGREN_CHRISS">Almgren-Chriss (Euler)</option>
            <option value="VWAP">VWAP Intraday Profile</option>
            <option value="TWAP">TWAP Linear + Jitter</option>
          </select>
        </div>

        {/* Notional */}
        <div>
          <label className="text-zinc-400 block mb-1 font-medium">Notional Units</label>
          <select
            value={params.notional}
            disabled={isExecuting}
            onChange={(e) => setParams((p) => ({ ...p, notional: parseFloat(e.target.value) }))}
            className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-md px-3 py-2 focus:border-cyan-500 focus:outline-none"
          >
            <option value="250000">250,000 Units</option>
            <option value="500000">500,000 Units</option>
            <option value="1000000">1,000,000 Units</option>
            <option value="2500000">2,500,000 Units</option>
            <option value="5000000">5,000,000 Units</option>
          </select>
        </div>

        {/* Slices Count */}
        <div>
          <label className="text-zinc-400 block mb-1 font-medium">Slices Count (N)</label>
          <select
            value={params.slices}
            disabled={isExecuting}
            onChange={(e) => setParams((p) => ({ ...p, slices: parseInt(e.target.value, 10) }))}
            className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-md px-3 py-2 focus:border-cyan-500 focus:outline-none"
          >
            <option value="10">10 Slices</option>
            <option value="15">15 Slices</option>
            <option value="20">20 Slices</option>
            <option value="30">30 Slices</option>
            <option value="40">40 Slices</option>
          </select>
        </div>

        {/* Almgren-Chriss Risk Aversion Lambda */}
        <div>
          <label className="text-zinc-400 block mb-1 font-medium">Risk Aversion (λ)</label>
          <select
            value={params.risk_aversion_lambda}
            disabled={isExecuting || params.strategy !== 'ALMGREN_CHRISS'}
            onChange={(e) => setParams((p) => ({ ...p, risk_aversion_lambda: parseFloat(e.target.value) }))}
            className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-md px-3 py-2 focus:border-cyan-500 focus:outline-none disabled:opacity-30"
          >
            <option value="1e-8">1e-8 (Patient)</option>
            <option value="1e-6">1e-6 (Balanced)</option>
            <option value="1e-5">1e-5 (Aggressive)</option>
            <option value="5e-5">5e-5 (Urgent Exit)</option>
          </select>
        </div>

        {/* TWAP Jitter % */}
        <div>
          <label className="text-zinc-400 block mb-1 font-medium">TWAP Jitter (±δ)</label>
          <select
            value={params.twap_jitter_pct}
            disabled={isExecuting || params.strategy !== 'TWAP'}
            onChange={(e) => setParams((p) => ({ ...p, twap_jitter_pct: parseFloat(e.target.value) }))}
            className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-md px-3 py-2 focus:border-cyan-500 focus:outline-none disabled:opacity-30"
          >
            <option value="0.05">± 5% Jitter</option>
            <option value="0.15">± 15% Jitter</option>
            <option value="0.30">± 30% Jitter</option>
            <option value="0.45">± 45% Jitter</option>
          </select>
        </div>
      </div>
    </div>
  );
};
