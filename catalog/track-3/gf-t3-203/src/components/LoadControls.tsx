import React from 'react';

interface LoadControlsProps {
  onBurstVolatility: () => void;
  onForceReversion: () => void;
  onRegimeShift: () => void;
  onSnapshotState: () => void;
  isBurstActive: boolean;
  isForcedReversionActive: boolean;
  tickIntervalMs: number;
  setTickIntervalMs: (ms: number) => void;
  onStepTick: () => void;
}

export const LoadControls: React.FC<LoadControlsProps> = ({
  onBurstVolatility,
  onForceReversion,
  onRegimeShift,
  onSnapshotState,
  isBurstActive,
  isForcedReversionActive,
  tickIntervalMs,
  setTickIntervalMs,
  onStepTick,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded p-4 font-mono text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 mb-3 border-b border-slate-800">
        <div>
          <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] font-sans">
            Load Generator & Stress Testing Controls
          </span>
          <p className="text-[11px] text-slate-500 font-sans mt-0.5">
            Inject stochastic anomalies, force mean-reversion drift, or trigger structural cointegration breakdown.
          </p>
        </div>

        {/* Tick Frequency Slider */}
        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-[11px]">Stream Interval:</span>
          <div className="flex items-center gap-2">
            {[100, 250, 500, 1000].map((interval) => (
              <button
                key={interval}
                onClick={() => setTickIntervalMs(interval)}
                className={`px-2 py-1 text-[11px] rounded transition-colors ${
                  tickIntervalMs === interval
                    ? 'bg-slate-800 text-cyan-400 font-semibold border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {interval}ms
              </button>
            ))}
          </div>
          <button
            onClick={onStepTick}
            className="px-2.5 py-1 text-[11px] text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors"
            title="Inject single tick"
          >
            +1 Tick
          </button>
        </div>
      </div>

      {/* The 4 Required Monopoly Gate Controls */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* 1. Burst Tick Volatility */}
        <button
          onClick={onBurstVolatility}
          className={`flex flex-col items-start p-2.5 rounded border transition-colors text-left ${
            isBurstActive
              ? 'bg-amber-500/10 border-amber-500/50 text-amber-300'
              : 'bg-slate-950 hover:bg-slate-800/80 border-slate-800 text-slate-200'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="font-medium text-xs font-sans">Burst Volatility</span>
            <span className="text-[10px] text-amber-400 font-mono">
              {isBurstActive ? 'ACTIVE' : '4.5x'}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-sans mt-1">
            Spikes variance to test Kalman innovation adaptation
          </span>
        </button>

        {/* 2. Force Mean Reversion */}
        <button
          onClick={onForceReversion}
          className={`flex flex-col items-start p-2.5 rounded border transition-colors text-left ${
            isForcedReversionActive
              ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300'
              : 'bg-slate-950 hover:bg-slate-800/80 border-slate-800 text-slate-200'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="font-medium text-xs font-sans">Force Reversion</span>
            <span className="text-[10px] text-emerald-400 font-mono">
              {isForcedReversionActive ? 'ACTIVE' : 'OU θ=0.65'}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-sans mt-1">
            Accelerates spread decay toward fair value
          </span>
        </button>

        {/* 3. Regime Shift */}
        <button
          onClick={onRegimeShift}
          className="flex flex-col items-start p-2.5 rounded border border-slate-800 bg-slate-950 hover:bg-slate-800/80 text-slate-200 transition-colors text-left group"
        >
          <div className="flex items-center justify-between w-full">
            <span className="font-medium text-xs font-sans">Regime Shift</span>
            <span className="text-[10px] text-rose-400 font-mono">Δβ ±35%</span>
          </div>
          <span className="text-[10px] text-slate-500 font-sans mt-1">
            Induces structural cointegration breakdown
          </span>
        </button>

        {/* 4. Snapshot Model State */}
        <button
          onClick={onSnapshotState}
          className="flex flex-col items-start p-2.5 rounded border border-slate-800 bg-slate-950 hover:bg-slate-800/80 text-slate-200 transition-colors text-left"
        >
          <div className="flex items-center justify-between w-full">
            <span className="font-medium text-xs font-sans">Snapshot State</span>
            <span className="text-[10px] text-cyan-400 font-mono">JSON DUMP</span>
          </div>
          <span className="text-[10px] text-slate-500 font-sans mt-1">
            Captures state vector θ, matrix P, and Welford moments
          </span>
        </button>
      </div>
    </div>
  );
};
