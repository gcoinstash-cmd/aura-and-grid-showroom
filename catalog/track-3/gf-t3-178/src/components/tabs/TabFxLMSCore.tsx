import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Copy, Check, Gauge, Sliders, Volume2, Cpu } from 'lucide-react';
import { TelemetryState } from '../../types';
import { PYTHON_FXLMS_CODE } from '../../data/pythonCode';

interface TabFxLMSCoreProps {
  telemetry: TelemetryState;
  setTelemetry: React.Dispatch<React.SetStateAction<TelemetryState>>;
}

export const TabFxLMSCore: React.FC<TabFxLMSCoreProps> = ({ telemetry, setTelemetry }) => {
  const [copied, setCopied] = useState(false);
  const [simRunning, setSimRunning] = useState(true);
  const [phaseOffset, setPhaseOffset] = useState(0);

  // Animate waveform phase when simulation is running
  useEffect(() => {
    if (!simRunning) return;
    const interval = setInterval(() => {
      setPhaseOffset((prev) => (prev + 0.15) % (Math.PI * 2));
    }, 40);
    return () => clearInterval(interval);
  }, [simRunning]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(PYTHON_FXLMS_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rpm = parseInt(e.target.value, 10);
    const harmonic = rpm / 20.0;
    const attenuation = -16.0 - Math.min(3.5, (rpm / 3000.0) * 2.0);
    const rawNoise = 64.0 + (rpm / 6000.0) * 14.0;
    setTelemetry((prev) => ({
      ...prev,
      engineRpm: rpm,
      engineHarmonicHz: harmonic,
      primaryNoiseDb: rawNoise,
      antiPhaseAttenuationDb: attenuation,
      residualCabinDb: rawNoise + attenuation,
    }));
  };

  const handleThrottleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const throttle = parseFloat(e.target.value);
    const target = (throttle / 100.0) * 19.5;
    const actual = Math.min(23.0, target * 0.98 + (Math.random() * 0.3 - 0.15));
    const duty = Math.max(10, Math.min(90, 85 - throttle * 0.65));
    setTelemetry((prev) => ({
      ...prev,
      throttlePositionPercent: throttle,
      targetBoostPsi: target,
      actualBoostPsi: actual,
      wastegateDutyPercent: actual >= 22.8 ? 100.0 : duty,
    }));
  };

  // Generate SVG points for dynamic dual-path waveform
  const pointsCount = 100;
  const primaryWavePoints: string[] = [];
  const antiPhaseWavePoints: string[] = [];
  const residualWavePoints: string[] = [];

  for (let i = 0; i < pointsCount; i++) {
    const x = (i / (pointsCount - 1)) * 600;
    const angle = (i / 10) + phaseOffset;
    
    // Primary engine cabin noise
    const yPrimary = 60 + Math.sin(angle) * 35;
    primaryWavePoints.push(`${x},${yPrimary.toFixed(1)}`);
    
    // Anti-phase signal (inverted 180 degrees)
    const yAnti = 60 + Math.sin(angle + Math.PI) * 33;
    antiPhaseWavePoints.push(`${x},${yAnti.toFixed(1)}`);
    
    // Residual error noise (drastically attenuated)
    const yResidual = 60 + (Math.sin(angle) * 35 + Math.sin(angle + Math.PI) * 33);
    residualWavePoints.push(`${x},${yResidual.toFixed(1)}`);
  }

  const isOverboost = telemetry.actualBoostPsi >= 22.8;

  return (
    <div className="space-y-8">
      {/* Interactive Telemetry & Waveform Cockpit */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Cpu className="w-8 h-8 text-amber-400" />
              FxLMS Acoustic Inversion & Twin-Turbo Boost Regulator
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              Real-time secondary-path transfer function estimation $\hat&#123;S&#125;(z)$ injecting inverted anti-phase acoustics into cabin Acoustic Noise-Inversion Transducer speakers.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSimRunning(!simRunning)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors cursor-pointer ${
                simRunning
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                  : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
              }`}
            >
              {simRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{simRunning ? 'Pause Engine' : 'Resume Engine'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTelemetry((prev) => ({
                  ...prev,
                  engineRpm: 2400,
                  engineHarmonicHz: 120.0,
                  primaryNoiseDb: 68.4,
                  antiPhaseAttenuationDb: -18.4,
                  residualCabinDb: 50.0,
                  throttlePositionPercent: 65.0,
                  targetBoostPsi: 17.2,
                  actualBoostPsi: 16.9,
                  wastegateDutyPercent: 44.8,
                }));
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-medium text-sm transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Calibrations</span>
            </button>
          </div>
        </div>

        {/* Dynamic Waveform Display & Status Gauges */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Dual-Waveform Oscilloscope */}
          <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <span className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-cyan-400" />
                Dual-Path Cabin Acoustic Oscilloscope (2,000 Hz Sampling)
              </span>
              <div className="flex items-center gap-4 text-sm font-mono">
                <span className="flex items-center gap-1.5 text-amber-400">
                  <span className="w-3 h-0.5 bg-amber-400 inline-block"></span> Primary Noise
                </span>
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <span className="w-3 h-0.5 bg-cyan-400 inline-block"></span> Inverted Anti-Phase (180°)
                </span>
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-3 h-0.5 bg-emerald-400 inline-block"></span> Residual Cabin
                </span>
              </div>
            </div>

            {/* SVG Waveform Canvas */}
            <div className="relative w-full h-44 bg-slate-900/60 rounded-lg border border-slate-800/80 overflow-hidden flex items-center justify-center">
              {/* Background grid lines */}
              <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 pointer-events-none opacity-20">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={i} className="border border-slate-700"></div>
                ))}
              </div>

              <svg viewBox="0 0 600 120" className="w-full h-full relative z-10" preserveAspectRatio="none">
                {/* Center baseline */}
                <line x1="0" y1="60" x2="600" y2="600" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
                
                {/* Primary noise wave */}
                <polyline
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  points={primaryWavePoints.join(' ')}
                />
                
                {/* Inverted Anti-Phase wave */}
                <polyline
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray="6 3"
                  points={antiPhaseWavePoints.join(' ')}
                />

                {/* Residual error signal */}
                <polyline
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeLinecap="round"
                  points={residualWavePoints.join(' ')}
                />
              </svg>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                <div className="text-slate-400 font-medium">Harmonic Freq</div>
                <div className="text-lg font-bold font-mono text-amber-400 tabular-nums">
                  {telemetry.engineHarmonicHz.toFixed(1)} Hz
                </div>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                <div className="text-slate-400 font-medium">Raw Cabin Noise</div>
                <div className="text-lg font-bold font-mono text-slate-200 tabular-nums">
                  {telemetry.primaryNoiseDb.toFixed(1)} dB
                </div>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                <div className="text-slate-400 font-medium">Net Quiet Floor</div>
                <div className="text-lg font-bold font-mono text-emerald-400 tabular-nums">
                  {telemetry.residualCabinDb.toFixed(1)} dB
                </div>
              </div>
            </div>
          </div>

          {/* Twin-Turbo Wastegate & Boost Status */}
          <div className="lg:col-span-4 bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-amber-400" />
                  V35A-FTS Boost Pressure (PSI)
                </span>
                {isOverboost ? (
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono text-sm font-bold">
                    OVERBOOST TRIPPED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-sm font-bold">
                    CLOSED LOOP PID
                  </span>
                )}
              </div>

              {/* Boost Meter */}
              <div className="relative pt-2">
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-3xl font-extrabold font-mono text-white tabular-nums">
                    {telemetry.actualBoostPsi.toFixed(2)}{' '}
                    <span className="text-base text-slate-400 font-normal">PSI</span>
                  </span>
                  <span className="text-sm font-mono text-slate-400">
                    Target: {telemetry.targetBoostPsi.toFixed(2)} PSI
                  </span>
                </div>

                {/* Progress bar with safety threshold */}
                <div className="w-full h-4 bg-slate-900 rounded-full overflow-hidden border border-slate-800 relative">
                  <div
                    className={`h-full transition-all duration-150 ${
                      isOverboost ? 'bg-rose-500' : 'bg-gradient-to-r from-cyan-500 to-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, (telemetry.actualBoostPsi / 25.0) * 100)}%` }}
                  ></div>
                  {/* Overboost threshold line at 22.8 PSI (91.2%) */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-rose-400 z-10"
                    style={{ left: '91.2%' }}
                    title="22.8 PSI Overboost Cutoff"
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-slate-400 mt-1 font-mono">
                  <span>0 PSI</span>
                  <span>15 PSI</span>
                  <span className="text-rose-400 font-semibold">22.80 PSI Trip</span>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 font-medium">Dual Wastegate Duty:</span>
                <span className="font-mono font-bold text-amber-300 tabular-nums">
                  {telemetry.wastegateDutyPercent.toFixed(1)}% PWM
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 font-medium">Throttle Demand:</span>
                <span className="font-mono font-bold text-slate-200 tabular-nums">
                  {telemetry.throttlePositionPercent.toFixed(0)}% WOT
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 font-medium">Acoustic Coherence Window:</span>
                <span className="font-mono font-bold text-emerald-400 tabular-nums">
                  0.75 ms (Pass)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Controls Row */}
        <div className="mt-6 p-5 bg-slate-950 border border-slate-800 rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <Sliders className="w-5 h-5 text-amber-400" />
            <span className="text-base font-bold text-slate-200">
              Real-Time Actuator & Acoustic Calibrations
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between text-sm mb-2 font-medium">
                <label htmlFor="rpm-slider" className="text-slate-300">
                  Engine Speed (Crankshaft RPM):
                </label>
                <span className="font-mono font-bold text-amber-400 tabular-nums">
                  {telemetry.engineRpm} RPM
                </span>
              </div>
              <input
                id="rpm-slider"
                type="range"
                min="1000"
                max="6000"
                step="50"
                value={telemetry.engineRpm}
                onChange={handleRpmChange}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-sm text-slate-400 mt-1 font-mono">
                <span>1,000 (Idle)</span>
                <span>2,400 (Cruising)</span>
                <span>6,000 (Redline)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2 font-medium">
                <label htmlFor="throttle-slider" className="text-slate-300">
                  Electronic Throttle Position:
                </label>
                <span className="font-mono font-bold text-cyan-400 tabular-nums">
                  {telemetry.throttlePositionPercent.toFixed(0)}%
                </span>
              </div>
              <input
                id="throttle-slider"
                type="range"
                min="0"
                max="100"
                step="1"
                value={telemetry.throttlePositionPercent}
                onChange={handleThrottleChange}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <div className="flex justify-between text-sm text-slate-400 mt-1 font-mono">
                <span>0% (Closed)</span>
                <span>50% (Cruise)</span>
                <span>100% (Full Boost)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Production Python Code Viewer */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-2xl font-bold text-white tracking-tight">
              Production Python 3.12 Engine Source (fxlms_boost_core.py)
            </h3>
            <p className="text-sm text-slate-300 mt-1">
              Zero-placeholder implementation. Uses normalized gradient descent, FIR transfer functions, and HMAC-SHA256 signature chaining.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopyCode}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-750 font-semibold text-sm transition-colors cursor-pointer shrink-0"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
            <span>{copied ? 'Code Copied!' : 'Copy Python Source'}</span>
          </button>
        </div>

        <div className="relative bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-sm font-mono text-slate-400">
            <span>src/engine/fxlms_boost_core.py</span>
            <span>Python 3.12 · 185 Lines</span>
          </div>
          <pre className="p-4 text-sm font-mono text-slate-200 overflow-x-auto max-h-[500px] leading-relaxed">
            <code>{PYTHON_FXLMS_CODE}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
