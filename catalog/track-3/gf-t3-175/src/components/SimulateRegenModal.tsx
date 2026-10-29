import React, { useState, useEffect } from 'react';
import { X, Play, RotateCcw, Zap, Gauge, CheckCircle2, ShieldCheck, Flame, ArrowRight } from 'lucide-react';
import { LedgerBlock } from '../types/telemetry';

interface SimulateRegenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBlockGenerated?: (block: LedgerBlock) => void;
}

export const SimulateRegenModal: React.FC<SimulateRegenModalProps> = ({
  isOpen,
  onClose,
  onBlockGenerated,
}) => {
  const [speedKmh, setSpeedKmh] = useState<number>(52);
  const [decelRate, setDecelRate] = useState<number>(2.4); // m/s^2
  const [ambientTemp, setAmbientTemp] = useState<number>(24.0); // C
  const [step, setStep] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [completed, setCompleted] = useState<boolean>(false);

  // Simulation metrics
  const [currentSpeed, setCurrentSpeed] = useState<number>(52);
  const [regenPowerKw, setRegenPowerKw] = useState<number>(0);
  const [frictionPowerKw, setFrictionPowerKw] = useState<number>(0);
  const [recapturedWh, setRecapturedWh] = useState<number>(0);
  const [socGained, setSocGained] = useState<number>(0);
  const [packTempDelta, setPackTempDelta] = useState<number>(0);
  const [currentHash, setCurrentHash] = useState<string>('');

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle step-by-step simulation loop
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning && currentSpeed > 0) {
      timer = setTimeout(() => {
        const nextSpeed = Math.max(0, currentSpeed - (decelRate * 3.6 * 0.2));
        const vMps = (currentSpeed / 3.6);
        // Kinetic power: P = m * v * a (UX 300h mass ~ 1680 kg)
        const kineticKw = (1680 * vMps * decelRate) / 1000;
        
        // Regen efficiency split: 92.4% above 8 km/h, handoff to hydraulic below 8 km/h
        let splitRatio = 0.924;
        if (currentSpeed < 8) {
          splitRatio = Math.max(0, currentSpeed / 8) * 0.924;
        }

        const regenKw = kineticKw * splitRatio;
        const frictionKw = kineticKw * (1 - splitRatio);
        const energyIncrementWh = (regenKw * 1000 * 0.2) / 3600;

        setCurrentSpeed(Number(nextSpeed.toFixed(1)));
        setRegenPowerKw(Number(regenKw.toFixed(2)));
        setFrictionPowerKw(Number(frictionKw.toFixed(2)));
        setRecapturedWh((prev) => Number((prev + energyIncrementWh).toFixed(2)));
        setSocGained((prev) => Number((prev + (energyIncrementWh / 40.8)).toFixed(3)));
        setPackTempDelta((prev) => Number((prev + 0.04).toFixed(2)));
        setStep((prev) => prev + 1);

        if (nextSpeed <= 0) {
          setIsRunning(false);
          setCompleted(true);
          const newHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
          setCurrentHash(newHash);

          if (onBlockGenerated) {
            const newBlock: LedgerBlock = {
              blockHeight: 1048576,
              sequenceId: 1000192,
              timestamp: new Date().toISOString(),
              prevHash: '0x17c0a82b99ef73145021a8d9b13907cbf41982ea09c0012e8b23398ca12801ef',
              currHash: newHash,
              payloadDigest: 'sha256:' + newHash.substring(2, 66),
              metrics: {
                soc: Number((78.9 + (recapturedWh / 40.8)).toFixed(2)),
                soh: 99.2,
                packVoltage: 223.4,
                regenKwh: Number((15.06 + (recapturedWh / 1000)).toFixed(3)),
                anomalousCells: 0,
              },
              verified: true,
            };
            onBlockGenerated(newBlock);
          }
        }
      }, 150);
    }
    return () => clearTimeout(timer);
  }, [isRunning, currentSpeed, decelRate, recapturedWh, onBlockGenerated]);

  const handleStartSim = () => {
    setCurrentSpeed(speedKmh);
    setRecapturedWh(0);
    setSocGained(0);
    setPackTempDelta(0);
    setStep(0);
    setCompleted(false);
    setIsRunning(true);
  };

  const handleReset = () => {
    setIsRunning(false);
    setCurrentSpeed(speedKmh);
    setRecapturedWh(0);
    setSocGained(0);
    setPackTempDelta(0);
    setStep(0);
    setCompleted(false);
    setRegenPowerKw(0);
    setFrictionPowerKw(0);
  };

  if (!isOpen) return null;

  const totalKw = regenPowerKw + frictionPowerKw;
  const regenPercent = totalKw > 0 ? (regenPowerKw / totalKw) * 100 : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 md:p-8 text-slate-100 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-950 border border-cyan-500/40 rounded-xl text-cyan-400">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/70 border border-cyan-800/60 px-2.5 py-0.5 rounded">
                  GF-T3-175 SIMULATION BENCH
                </span>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
                  500 Hz Real-Time
                </span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white mt-1">
                Apex Executive UX 300h Urban Regen Braking Cycle
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Configuration Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6 p-5 bg-slate-950 border border-slate-800 rounded-xl">
          <div>
            <label className="block text-base font-semibold text-slate-200 mb-1.5">
              Initial City Speed: <span className="text-cyan-400 font-mono font-bold text-lg">{speedKmh} km/h</span>
            </label>
            <input
              type="range"
              min="20"
              max="80"
              step="2"
              value={speedKmh}
              disabled={isRunning}
              onChange={(e) => {
                setSpeedKmh(Number(e.target.value));
                if (!isRunning) setCurrentSpeed(Number(e.target.value));
              }}
              className="w-full accent-cyan-400"
            />
            <div className="flex justify-between text-sm text-slate-400 mt-1 font-mono">
              <span>20 km/h (Slow)</span>
              <span>80 km/h (Boulevard)</span>
            </div>
          </div>

          <div>
            <label className="block text-base font-semibold text-slate-200 mb-1.5">
              Deceleration Gradient: <span className="text-amber-400 font-mono font-bold text-lg">{decelRate} m/s²</span>
            </label>
            <input
              type="range"
              min="1.0"
              max="4.5"
              step="0.1"
              value={decelRate}
              disabled={isRunning}
              onChange={(e) => setDecelRate(Number(e.target.value))}
              className="w-full accent-amber-400"
            />
            <div className="flex justify-between text-sm text-slate-400 mt-1 font-mono">
              <span>1.0 m/s² (Gentle)</span>
              <span>4.5 m/s² (Urban Stop)</span>
            </div>
          </div>

          <div>
            <label className="block text-base font-semibold text-slate-200 mb-1.5">
              Ambient Pack Temp: <span className="text-emerald-400 font-mono font-bold text-lg">{ambientTemp}°C</span>
            </label>
            <input
              type="range"
              min="-10"
              max="45"
              step="1"
              value={ambientTemp}
              disabled={isRunning}
              onChange={(e) => setAmbientTemp(Number(e.target.value))}
              className="w-full accent-emerald-400"
            />
            <div className="flex justify-between text-sm text-slate-400 mt-1 font-mono">
              <span>-10°C (Cold Soak)</span>
              <span>45°C (Desert Peak)</span>
            </div>
          </div>
        </div>

        {/* Live Simulation Display */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          {/* Main Visual Dial & Speed */}
          <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center">
            <span className="text-sm font-mono uppercase tracking-wider text-slate-300 font-semibold mb-2">
              Vehicle Deceleration Telemetry
            </span>
            <div className="relative w-48 h-48 flex items-center justify-center">
              {/* SVG Circular Gauge */}
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke="#1e293b"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke={currentSpeed > 8 ? '#06b6d4' : '#f59e0b'}
                  strokeWidth="8"
                  strokeDasharray="314.16"
                  strokeDashoffset={314.16 - (314.16 * (currentSpeed / 80))}
                  strokeLinecap="round"
                  fill="none"
                  className="transition-all duration-150"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black font-mono tracking-tight text-white">
                  {currentSpeed.toFixed(0)}
                </span>
                <span className="text-base font-mono text-slate-400 uppercase tracking-widest font-bold">
                  km/h
                </span>
              </div>
            </div>

            <div className="w-full mt-4 flex items-center justify-between text-base px-2">
              <span className="text-slate-300">Control Tick:</span>
              <span className="font-mono text-cyan-400 font-bold">{step} cycles @ 500 Hz</span>
            </div>
            <div className="w-full flex items-center justify-between text-base px-2 mt-1.5">
              <span className="text-slate-300">Braking Regime:</span>
              <span className={`font-mono font-bold ${currentSpeed > 8 ? 'text-cyan-400' : currentSpeed > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {currentSpeed > 8 ? 'Kinetic Motor Regen (MG2)' : currentSpeed > 0 ? 'Hydraulic Friction Handoff' : 'Vehicle At Rest'}
              </span>
            </div>
          </div>

          {/* Regenerative Power Split & Metrics */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* Split Bar */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between text-base mb-2.5">
                <span className="font-bold text-white flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-cyan-400" />
                  Braking Power Split (Kinetic vs Hydraulic)
                </span>
                <span className="font-mono text-cyan-400 font-bold text-lg">
                  {regenPercent.toFixed(1)}% Recapture
                </span>
              </div>

              {/* Stacked Progress Bar */}
              <div className="w-full h-6 bg-slate-900 rounded-full overflow-hidden flex border border-slate-700">
                <div
                  className="bg-cyan-500 h-full transition-all duration-150 flex items-center justify-center text-sm font-mono font-bold text-slate-950"
                  style={{ width: `${regenPercent}%` }}
                >
                  {regenPercent > 15 ? `${regenPercent.toFixed(0)}%` : ''}
                </div>
                <div
                  className="bg-amber-500/80 h-full transition-all duration-150 flex items-center justify-center text-sm font-mono font-bold text-slate-950"
                  style={{ width: `${100 - regenPercent}%` }}
                >
                  {100 - regenPercent > 15 ? `${(100 - regenPercent).toFixed(0)}%` : ''}
                </div>
              </div>

              <div className="flex justify-between items-center text-base font-mono mt-3.5">
                <div className="flex items-center gap-2 text-cyan-400">
                  <div className="w-3.5 h-3.5 rounded-full bg-cyan-400" />
                  <span>MG2 Regen: <strong>{regenPowerKw.toFixed(1)} kW</strong></span>
                </div>
                <div className="flex items-center gap-2 text-amber-400">
                  <div className="w-3.5 h-3.5 rounded-full bg-amber-400" />
                  <span>Friction Pads: <strong>{frictionPowerKw.toFixed(1)} kW</strong></span>
                </div>
              </div>
            </div>

            {/* Recaptured Energy Metrics Grid */}
            <div className="grid grid-cols-3 gap-3.5">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center">
                <span className="block text-sm font-mono uppercase text-slate-400 mb-1">Energy Recaptured</span>
                <span className="text-2xl font-bold font-mono text-emerald-400">+{recapturedWh.toFixed(2)} Wh</span>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center">
                <span className="block text-sm font-mono uppercase text-slate-400 mb-1">SOC Increment</span>
                <span className="text-2xl font-bold font-mono text-cyan-400">+{socGained.toFixed(3)}%</span>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center">
                <span className="block text-sm font-mono uppercase text-slate-400 mb-1">Pack Temp Rise</span>
                <span className="text-2xl font-bold font-mono text-amber-400">+{packTempDelta.toFixed(2)}°C</span>
              </div>
            </div>

            {/* Status Feedback */}
            {completed && (
              <div className="p-3.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-emerald-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>Urban Stop Complete. Kinetic Recapture efficiency <strong>92.4%</strong> verified.</span>
                </div>
                <span className="font-mono text-xs text-emerald-400 bg-emerald-900/80 px-2 py-1 rounded border border-emerald-700">
                  Block #1,048,576 Appended
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 pt-5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm font-mono text-slate-400">
            Apex Executive UX 300h 60S2P NiMH/Li-Ion Pack • 222V Nominal Architecture
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              disabled={isRunning}
              className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Parameters
            </button>
            <button
              onClick={handleStartSim}
              disabled={isRunning}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              {isRunning ? 'Simulating 500 Hz Cycle...' : 'Run Urban Regen Cycle'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
