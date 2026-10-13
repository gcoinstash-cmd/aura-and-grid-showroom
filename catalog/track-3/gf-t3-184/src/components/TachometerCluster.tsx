import React from 'react';
import { Volume2, VolumeX, Flame, Zap, Droplets, Thermometer, Activity } from 'lucide-react';
import { TelemetryState } from '../types/telemetry';
import { lfaSound } from '../utils/audioSynth';

interface TachometerClusterProps {
  telemetry: TelemetryState;
  onThrottleChange: (pct: number) => void;
  onShiftUp: () => void;
  onShiftDown: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onSimulateRev: () => void;
}

export const TachometerCluster: React.FC<TachometerClusterProps> = ({
  telemetry,
  onThrottleChange,
  onShiftUp,
  onShiftDown,
  isMuted,
  onToggleMute,
  onSimulateRev,
}) => {
  // Calculate tachometer needle angle (from -135deg at 0 RPM to +135deg at 10,000 RPM)
  const maxRpm = 10000;
  const rpmClamped = Math.min(10000, Math.max(0, telemetry.rpm));
  const angle = -135 + (rpmClamped / maxRpm) * 270;

  // Redline starts at 9,000 RPM
  const isRedline = telemetry.rpm >= 8900;
  const isHighRev = telemetry.rpm >= 7000;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-2xl relative overflow-hidden">
      {/* Background radial accent */}
      <div
        className={`absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-all duration-300 ${
          isRedline ? 'bg-red-600/25' : isHighRev ? 'bg-amber-500/20' : 'bg-blue-600/10'
        }`}
      />

      {/* Cluster Header */}
      <div className="flex flex-row flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-base font-mono font-bold text-white tracking-wider">
            YAMAHA 1LR-GUE OPTICAL TELEMETRY CLUSTER
          </span>
          <span className="text-sm font-mono text-slate-400 hidden sm:inline">
            | 72° V10 EVEN-FIRING
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleMute}
            className={`cursor-pointer px-3 py-1.5 rounded-lg text-sm font-mono font-semibold flex items-center gap-2 transition-all border ${
              !isMuted
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 glow-amber'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title="Toggle authentic 1LR-GUE Yamaha acoustic synthesizer"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
            {isMuted ? 'Acoustics: Muted' : 'Acoustics: Live Synth'}
          </button>
        </div>
      </div>

      {/* Main Tachometer Dial & Telemetry Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Side: Secondary Engine Telemetry */}
        <div className="lg:col-span-3 space-y-3.5 order-2 lg:order-1">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-base text-slate-300 mb-1.5 font-medium">
              <span className="flex items-center gap-2">
                <Droplets className="w-4.5 h-4.5 text-amber-400" />
                Scavenge Oil Press
              </span>
              <span className="font-mono text-white font-bold text-lg">{telemetry.scavengePressureBar.toFixed(2)} bar</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-amber-400 h-full transition-all"
                style={{ width: `${Math.min(100, (telemetry.scavengePressureBar / 6.5) * 100)}%` }}
              />
            </div>
            <span className="text-xs font-mono text-slate-400 mt-1.5 block">
              3-Stage Dry-Sump (Quarantine threshold: 2.80 bar)
            </span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-base text-slate-300 mb-1.5 font-medium">
              <span className="flex items-center gap-2">
                <Thermometer className="w-4.5 h-4.5 text-rose-400" />
                Engine Oil Temp
              </span>
              <span className="font-mono text-white font-bold text-lg">{telemetry.oilTempC.toFixed(0)} °C</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-rose-400 h-full transition-all"
                style={{ width: `${Math.min(100, (telemetry.oilTempC / 130) * 100)}%` }}
              />
            </div>
            <span className="text-xs font-mono text-slate-400 mt-1.5 block">
              Nominal: 92–105 °C | Redline rated
            </span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-base text-slate-300 mb-1.5 font-medium">
              <span className="flex items-center gap-2">
                <Activity className="w-4.5 h-4.5 text-purple-400" />
                Yamaha Surge Duct
              </span>
              <span className="font-mono text-purple-300 font-bold text-lg">{telemetry.surgeTankDecibels.toFixed(1)} dB</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-purple-500 h-full transition-all"
                style={{ width: `${Math.min(100, (telemetry.surgeTankDecibels / 130) * 100)}%` }}
              />
            </div>
            <span className="text-xs font-mono text-purple-300/80 mt-1.5 block">
              Dual surge tanks Helmholtz frequency
            </span>
          </div>
        </div>

        {/* Center: The Iconic Central TFT Tachometer Ring */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center order-1 lg:order-2">
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
            {/* Outer Physical Bezel Ring Simulation */}
            <div
              className={`absolute inset-0 rounded-full border-4 transition-all duration-200 ${
                isRedline
                  ? 'border-red-500 glow-red ring-4 ring-red-500/30'
                  : isHighRev
                  ? 'border-amber-400 glow-amber ring-2 ring-amber-400/20'
                  : 'border-slate-700 bg-slate-950/80'
              }`}
            />

            {/* Inner Metallic Dial SVG */}
            <svg className="w-full h-full transform -rotate-90 pointer-events-none" viewBox="0 0 200 200">
              {/* Background Arc */}
              <circle
                cx="100"
                cy="100"
                r="82"
                fill="none"
                stroke="#1e293b"
                strokeWidth="8"
                strokeDasharray="386"
                strokeDashoffset="96"
                strokeLinecap="round"
              />
              {/* Active RPM Arc */}
              <circle
                cx="100"
                cy="100"
                r="82"
                fill="none"
                stroke={isRedline ? '#ef4444' : isHighRev ? '#f59e0b' : '#38bdf8'}
                strokeWidth="9"
                strokeDasharray="386"
                strokeDashoffset={386 - ((rpmClamped / 10000) * 290)}
                strokeLinecap="round"
                className="transition-all duration-75"
              />
              {/* Redline Zone Arc (9000 to 10000) */}
              <circle
                cx="100"
                cy="100"
                r="82"
                fill="none"
                stroke="#dc2626"
                strokeWidth="10"
                strokeDasharray="386"
                strokeDashoffset="125"
                strokeLinecap="butt"
                opacity="0.35"
              />
            </svg>

            {/* Needle Pivot & Needle Line */}
            <div
              className="absolute w-full h-full flex items-center justify-center pointer-events-none transition-transform duration-75"
              style={{ transform: `rotate(${angle}deg)` }}
            >
              <div className="w-1 h-32 bg-gradient-to-t from-transparent via-amber-400 to-amber-300 absolute -top-4 rounded-full shadow-lg shadow-amber-500/50" />
            </div>

            {/* Center Digital Display Hub */}
            <div className="absolute flex flex-col items-center justify-center text-center z-10 w-44 h-44 rounded-full bg-slate-950/90 border border-slate-800 shadow-inner">
              <span className="text-xs font-mono text-slate-400 tracking-wider uppercase font-semibold">
                1LR-GUE V10
              </span>
              <div className="flex items-baseline justify-center">
                <span
                  className={`text-4xl sm:text-5xl font-black font-mono tracking-tighter ${
                    isRedline ? 'text-red-500 animate-pulse' : isHighRev ? 'text-amber-400' : 'text-white'
                  }`}
                >
                  {Math.round(telemetry.rpm)}
                </span>
              </div>
              <span className="text-sm font-mono font-bold text-amber-500">
                RPM × 1000
              </span>

              {/* Gear Indicator */}
              <div className="mt-2 flex items-center justify-center gap-1.5">
                <span className="text-xs font-mono text-slate-400 uppercase font-semibold">GEAR</span>
                <span
                  className={`w-8 h-8 rounded flex items-center justify-center font-mono font-black text-xl border ${
                    telemetry.isShifting
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 animate-pulse'
                      : 'bg-slate-800 text-white border-slate-700'
                  }`}
                >
                  {telemetry.gear === 0 ? 'N' : telemetry.gear}
                </span>
              </div>
            </div>
          </div>

          {/* Quick controls underneath tachometer */}
          <div className="flex items-center gap-3 mt-4">
            <button
              type="button"
              onClick={onShiftDown}
              className="cursor-pointer px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg font-mono text-base font-bold active:scale-95 transition-all shadow-sm"
            >
              ASG Paddle Down [ - ]
            </button>
            <button
              type="button"
              onClick={onShiftUp}
              className="cursor-pointer px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg font-mono text-base font-bold active:scale-95 transition-all shadow-sm"
            >
              ASG Paddle Up [ + ]
            </button>
          </div>
        </div>

        {/* Right Side: Acoustic Frequencies & Throttle Actuator */}
        <div className="lg:col-span-3 space-y-3.5 order-3">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
            <div className="flex items-center justify-between text-base text-slate-300 mb-1.5 font-medium">
              <span>Throttle Angle:</span>
              <span className="font-mono text-amber-400 font-bold text-lg">{telemetry.throttlePct.toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={telemetry.throttlePct}
              onChange={(e) => onThrottleChange(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-xs font-mono text-slate-400 mt-1.5">
              <span>Idle (0%)</span>
              <span>WOT (100%)</span>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
            <div className="text-base font-semibold text-slate-300 mb-1.5">Yamaha Firing Fundamental</div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-mono font-bold text-white">
                {telemetry.intakeHarmonicHz.toFixed(1)}
              </span>
              <span className="text-base font-mono text-amber-400 font-bold">Hz</span>
              <span className="text-xs font-mono text-slate-400 ml-auto font-medium">(RPM / 12)</span>
            </div>
            <span className="text-xs font-mono text-slate-400 mt-1.5 block">
              750 Hz at 9,000 RPM (Pure F1 Acoustic Pitch)
            </span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
            <div className="text-base font-semibold text-slate-300 mb-1.5">Titanium Valvetrain Freq</div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-mono font-bold text-white">
                {telemetry.titaniumValveHz.toFixed(1)}
              </span>
              <span className="text-base font-mono text-cyan-400 font-bold">Hz</span>
              <span className="text-xs font-mono text-slate-400 ml-auto font-medium">40 Titanium Valves</span>
            </div>
            <span className="text-xs font-mono text-slate-400 mt-1.5 block">
              High-RPM solid lifter harmonic resonance
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
