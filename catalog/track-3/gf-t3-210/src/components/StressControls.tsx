import React from 'react';
import { Zap, Flame, WifiOff, Play, Pause, RefreshCw } from 'lucide-react';

interface StressControlsProps {
  onCancelWave: () => void;
  onFlashSweep: () => void;
  onLatencySpike: () => void;
  latencyJitterMs: number;
  tickRateMs: number;
  isPaused: boolean;
  onChangeTickRate: (rateMs: number) => void;
  onTogglePause: () => void;
  onReset: () => void;
}

export const StressControls: React.FC<StressControlsProps> = ({
  onCancelWave,
  onFlashSweep,
  onLatencySpike,
  latencyJitterMs,
  tickRateMs,
  isPaused,
  onChangeTickRate,
  onTogglePause,
  onReset,
}) => {
  const latencyButtonClass = 'flex items-center gap-1.5 min-h-[44px] px-4 py-2 border rounded-lg text-sm font-bold transition-colors shadow-sm ' +
    (latencyJitterMs > 0
      ? 'bg-purple-950 text-purple-200 border-purple-600 animate-pulse'
      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700');

  const getTickRateButtonClass = (targetRate: number) => {
    const isSelected = tickRateMs === targetRate && !isPaused;
    return 'px-3 py-1.5 text-sm font-bold rounded-md transition-colors ' +
      (isSelected ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white');
  };

  const pauseButtonClass = 'flex items-center justify-center min-h-[44px] px-4 rounded-lg font-bold text-sm border transition-colors ' +
    (isPaused
      ? 'bg-emerald-950 text-emerald-300 border-emerald-800 hover:bg-emerald-900'
      : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800');

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#0A0E1A] border-b border-slate-800 text-slate-100">
      {/* Simulation stress triggers */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold uppercase tracking-wider text-slate-400 mr-2">
          Microstructure Stress Controls:
        </span>
        <button
          onClick={onCancelWave}
          className="flex items-center gap-1.5 min-h-[44px] px-4 py-2 bg-amber-950/80 hover:bg-amber-900 text-amber-200 border border-amber-800 rounded-lg text-sm font-bold transition-colors shadow-sm"
        >
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Inject Cancel Wave (60%)</span>
        </button>

        <button
          onClick={onFlashSweep}
          className="flex items-center gap-1.5 min-h-[44px] px-4 py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-800 rounded-lg text-sm font-bold transition-colors shadow-sm"
        >
          <Flame className="w-4 h-4 text-rose-400" />
          <span>Trigger Flash Sweep (50k Units)</span>
        </button>

        <button
          onClick={onLatencySpike}
          className={latencyButtonClass}
        >
          <WifiOff className="w-4 h-4 text-purple-400" />
          <span>
            {latencyJitterMs > 0 ? 'Latency Jitter Active (' + latencyJitterMs + 'ms)' : 'Simulate Latency Spike'}
          </span>
        </button>
      </div>

      {/* Clock speed & playback controls */}
      <div className="flex items-center gap-2">
        <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-lg">
          <button
            onClick={() => onChangeTickRate(100)}
            className={getTickRateButtonClass(100)}
          >
            100ms
          </button>
          <button
            onClick={() => onChangeTickRate(250)}
            className={getTickRateButtonClass(250)}
          >
            250ms
          </button>
          <button
            onClick={() => onChangeTickRate(1000)}
            className={getTickRateButtonClass(1000)}
          >
            1.0s
          </button>
        </div>

        <button
          onClick={onTogglePause}
          className={pauseButtonClass}
        >
          {isPaused ? (
            <span className="flex items-center gap-1.5">
              <Play className="w-4 h-4 text-emerald-400" />
              Resume
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <Pause className="w-4 h-4 text-amber-400" />
              Pause
            </span>
          )}
        </button>

        <button
          onClick={onReset}
          className="flex items-center justify-center min-h-[44px] px-4 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-sm font-bold transition-colors"
          title="Reset Book State"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
