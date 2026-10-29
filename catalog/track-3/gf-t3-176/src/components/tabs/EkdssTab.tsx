import React, { useState, useMemo } from 'react';
import { Sliders, Copy, Check, Lock, Unlock, ArrowRightLeft, ShieldAlert } from 'lucide-react';
import { EKDSS_PYTHON_CODE } from '../../data/pythonCode';

export const EkdssTab: React.FC = () => {
  // Simulator state
  const [roughness, setRoughness] = useState<number>(0.72);
  const [speedKph, setSpeedKph] = useState<number>(18.0);
  const [pitchDeg, setPitchDeg] = useState<number>(14.5);
  const [rollDeg, setRollDeg] = useState<number>(-8.2);
  const [crawlSpeedMph, setCrawlSpeedMph] = useState<number>(2.5);
  const [rearLockerManual, setRearLockerManual] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Dynamic calculations based on Python 3.12 state machine logic
  const simulation = useMemo(() => {
    // Speed lockout condition
    const isHighSpeed = speedKph > 65.0;

    // Cross-axle travel in inches based on roughness and roll angle
    const rollFactor = Math.sin((rollDeg * Math.PI) / 180) * 16.0;
    const roughnessFactor = roughness * 12.0;

    const flStroke = +(roughnessFactor + rollFactor * 0.5).toFixed(1);
    const frStroke = +(-roughnessFactor * 0.7 - rollFactor * 0.5).toFixed(1);
    const rlStroke = +(roughnessFactor * 1.1 - rollFactor * 0.6).toFixed(1);
    const rrStroke = +(-roughnessFactor * 0.9 + rollFactor * 0.6).toFixed(1);

    const totalSpread = +(Math.max(flStroke, frStroke, rlStroke, rrStroke) - Math.min(flStroke, frStroke, rlStroke, rrStroke)).toFixed(1);
    const crossAxleDelta = +(Math.max(Math.abs(flStroke - frStroke), Math.abs(rlStroke - rrStroke))).toFixed(1);

    // Dynamic Kinetic Suspension Telemetry Decoupling logic
    let frontDecoupled = false;
    let rearDecoupled = false;
    let modeName = 'RIGID_HIGHWAY';
    let rollStiffness = 45000;

    if (!isHighSpeed) {
      if (crossAxleDelta >= 5.0 || roughness >= 0.40 || Math.abs(rollDeg) > 10.0) {
        frontDecoupled = true;
        rearDecoupled = true;
        modeName = 'FULL_DECOUPLED';
        rollStiffness = 12600;
      } else if (crossAxleDelta >= 2.5 || roughness >= 0.20) {
        frontDecoupled = true;
        rearDecoupled = false;
        modeName = 'PARTIAL_DAMPING';
        rollStiffness = 26500;
      }
    }

    // Torsen & Rear E-Locker logic
    let torsenRatio = '40:60 (NOMINAL TORSEN)';
    let frontTorquePct = 40;
    let rearTorquePct = 60;
    let rearLocked = rearLockerManual;

    if (rearLockerManual || (roughness > 0.60 && crawlSpeedMph > 0)) {
      rearLocked = true;
      torsenRatio = '50:50 (REAR LOCKER 100%)';
      frontTorquePct = 50;
      rearTorquePct = 50;
    } else if (roughness > 0.45) {
      // Slip dynamic
      torsenRatio = '30:70 (FRONT SLIP BIAS)';
      frontTorquePct = 30;
      rearTorquePct = 70;
    }

    return {
      flStroke,
      frStroke,
      rlStroke,
      rrStroke,
      totalSpread: Math.min(24.5, Math.max(3.0, totalSpread)),
      crossAxleDelta,
      frontDecoupled,
      rearDecoupled,
      modeName,
      rollStiffness,
      torsenRatio,
      frontTorquePct,
      rearTorquePct,
      rearLocked,
    };
  }, [roughness, speedKph, pitchDeg, rollDeg, crawlSpeedMph, rearLockerManual]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(EKDSS_PYTHON_CODE);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative w-full space-y-8 p-6 md:p-8 bg-neutral-950 text-neutral-100">
      
      {/* Intro Header */}
      <div className="border-b border-neutral-800 pb-5">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Dynamic Kinetic Suspension Telemetry & Differential Core Engine
        </h2>
        <p className="mt-2 text-[16px] text-neutral-400 max-w-4xl leading-relaxed">
          Pure Python 3.12 active off-road suspension state machine. Dynamically unlatches front and rear stabilizer bar hydraulic cylinders within 3.8ms, allowing up to 24.5 inches of independent axle articulation while orchestrating Torsen center and electronic rear differential lock allocation.
        </p>
      </div>

      {/* Interactive Telemetry & Kinematic Chassis Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Interactive Controls */}
        <div className="lg:col-span-5 bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-400" />
              <span>Real-Time Terrain Inputs</span>
            </h3>
            <span className="text-base font-mono text-emerald-400 font-semibold">1,000 Hz Clock</span>
          </div>

          {/* Roughness Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-base">
              <span className="text-neutral-300 font-medium">Surface Roughness Index (R):</span>
              <span className="font-mono font-bold text-amber-400 num-tabular">{roughness.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.01"
              value={roughness}
              onChange={(e) => setRoughness(parseFloat(e.target.value))}
              className="w-full h-2.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            {/* Presets */}
            <div className="flex flex-wrap gap-2.5 pt-1">
              {[
                { name: 'Highway', val: 0.05 },
                { name: 'Gravel', val: 0.28 },
                { name: 'Moguls', val: 0.65 },
                { name: 'Rock Crawl', val: 0.88 },
              ].map((p) => (
                <button
                  key={p.name}
                  onClick={() => setRoughness(p.val)}
                  className={`px-3 py-1.5 text-base rounded-lg border transition-colors cursor-pointer ${
                    Math.abs(roughness - p.val) < 0.08
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                      : 'bg-neutral-800/80 border-neutral-700 text-neutral-300 hover:text-white'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Vehicle Speed Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-base">
              <span className="text-neutral-300 font-medium">Vehicle Velocity:</span>
              <span className="font-mono font-bold text-white num-tabular">{speedKph.toFixed(0)} km/h</span>
            </div>
            <input
              type="range"
              min="0"
              max="120"
              step="1"
              value={speedKph}
              onChange={(e) => setSpeedKph(parseFloat(e.target.value))}
              className="w-full h-2.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="text-base text-neutral-400 flex justify-between">
              <span>0 km/h (Crawl)</span>
              <span>65 km/h (Dynamic Kinetic Suspension Telemetry Cutoff)</span>
              <span>120 km/h</span>
            </div>
          </div>

          {/* Pitch & Roll Sliders */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-base">
                <span className="text-neutral-300 font-medium">Pitch Angle:</span>
                <span className="font-mono font-bold text-amber-400 num-tabular">{pitchDeg}°</span>
              </div>
              <input
                type="range"
                min="-20"
                max="35"
                step="0.5"
                value={pitchDeg}
                onChange={(e) => setPitchDeg(parseFloat(e.target.value))}
                className="w-full h-2.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-base">
                <span className="text-neutral-300 font-medium">Roll Angle:</span>
                <span className="font-mono font-bold text-amber-400 num-tabular">{rollDeg}°</span>
              </div>
              <input
                type="range"
                min="-25"
                max="25"
                step="0.5"
                value={rollDeg}
                onChange={(e) => setRollDeg(parseFloat(e.target.value))}
                className="w-full h-2.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>

          {/* Crawl Control & Differential Overrides */}
          <div className="pt-4 border-t border-neutral-800 space-y-4">
            <div className="flex items-center justify-between text-base">
              <span className="text-neutral-300 font-medium">Crawl Control Speed Setpoint:</span>
              <span className="font-mono font-bold text-sky-400 num-tabular">{crawlSpeedMph.toFixed(1)} mph</span>
            </div>
            <div className="flex gap-2.5">
              {[1.0, 1.8, 2.5, 3.8, 5.0].map((s) => (
                <button
                  key={s}
                  onClick={() => setCrawlSpeedMph(s)}
                  className={`flex-1 py-2 text-base font-mono rounded-lg border transition-colors cursor-pointer ${
                    crawlSpeedMph === s
                      ? 'bg-sky-500/20 border-sky-400 text-sky-300 font-bold'
                      : 'bg-neutral-800/80 border-neutral-700 text-neutral-300 hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-base text-neutral-300 font-medium">Rear E-Locker Dog-Clutch:</span>
              <button
                onClick={() => setRearLockerManual(!rearLockerManual)}
                className={`flex items-center gap-2.5 px-4 py-2 rounded-lg text-base font-semibold border transition-colors cursor-pointer ${
                  simulation.rearLocked
                    ? 'bg-amber-500 text-neutral-950 border-amber-400 font-bold'
                    : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:text-white'
                }`}
              >
                {simulation.rearLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                <span>{simulation.rearLocked ? 'ENGAGED 100%' : 'OPEN / AUTO'}</span>
              </button>
            </div>
          </div>

        </div>

        {/* Right Column: Visual Telemetry Chassis & State Machine HUD */}
        <div className="lg:col-span-7 bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <h3 className="text-xl font-bold text-white">
              Kinematic Articulation HUD & Hydraulic Slew
            </h3>
            <span className={`px-3.5 py-1.5 text-base font-mono font-bold rounded-lg border ${
              simulation.modeName === 'FULL_DECOUPLED'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                : simulation.modeName === 'PARTIAL_DAMPING'
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                : 'bg-blue-500/10 border-blue-500/40 text-blue-400'
            }`}>
              MODE: {simulation.modeName}
            </span>
          </div>

          {/* SVG Vehicle Chassis & Axle Decouple Representation */}
          <div className="relative w-full bg-neutral-950 border border-neutral-800 rounded-xl p-6">
            <svg viewBox="0 0 560 300" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="chassisGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#262626" />
                  <stop offset="100%" stopColor="#171717" />
                </linearGradient>
              </defs>

              {/* Main Chassis Frame Box */}
              <rect x="130" y="50" width="300" height="200" rx="16" fill="url(#chassisGrad)" stroke="#525252" strokeWidth="2.5" />
              <text x="280" y="145" textAnchor="middle" fill="#a3a3a3" fontSize="20" fontFamily="JetBrains Mono" fontWeight="bold">
                Apex Executive
              </text>
              <text x="280" y="175" textAnchor="middle" fill="#d4d4d4" fontSize="17" fontFamily="JetBrains Mono" fontWeight="600">
                Heavy Boxed Steel Frame Architecture LADDER FRAME (Modular Cyber-Physical Chassis)
              </text>

              {/* Front Stabilizer Bar Circuit */}
              <line x1="80" y1="80" x2="480" y2="80" stroke={simulation.frontDecoupled ? '#10b981' : '#3b82f6'} strokeWidth="6" strokeDasharray={simulation.frontDecoupled ? '8 5' : 'none'} />
              {/* Front Hydraulic Cylinder */}
              <rect x="225" y="66" width="110" height="28" rx="6" fill="#0a0a0a" stroke={simulation.frontDecoupled ? '#10b981' : '#3b82f6'} strokeWidth="2.5" />
              <text x="280" y="86" textAnchor="middle" fill={simulation.frontDecoupled ? '#34d399' : '#60a5fa'} fontSize="17" fontFamily="JetBrains Mono" fontWeight="bold">
                {simulation.frontDecoupled ? 'VALVE OPEN' : 'RIGID'}
              </text>

              {/* Rear Stabilizer Bar Circuit */}
              <line x1="80" y1="220" x2="480" y2="220" stroke={simulation.rearDecoupled ? '#10b981' : '#3b82f6'} strokeWidth="6" strokeDasharray={simulation.rearDecoupled ? '8 5' : 'none'} />
              {/* Rear Hydraulic Cylinder */}
              <rect x="225" y="206" width="110" height="28" rx="6" fill="#0a0a0a" stroke={simulation.rearDecoupled ? '#10b981' : '#3b82f6'} strokeWidth="2.5" />
              <text x="280" y="226" textAnchor="middle" fill={simulation.rearDecoupled ? '#34d399' : '#60a5fa'} fontSize="17" fontFamily="JetBrains Mono" fontWeight="bold">
                {simulation.rearDecoupled ? 'VALVE OPEN' : 'RIGID'}
              </text>

              {/* Front-Left Wheel */}
              <rect x="35" y={60 - simulation.flStroke * 1.5} width="45" height="65" rx="8" fill="#171717" stroke="#f5f5f5" strokeWidth="2.5" />
              <text x="58" y={42 - simulation.flStroke * 1.5} textAnchor="middle" fill="#fbbf24" fontSize="18" fontFamily="JetBrains Mono" fontWeight="bold">
                FL: {simulation.flStroke > 0 ? `+${simulation.flStroke}` : simulation.flStroke}"
              </text>

              {/* Front-Right Wheel */}
              <rect x="480" y={60 - simulation.frStroke * 1.5} width="45" height="65" rx="8" fill="#171717" stroke="#f5f5f5" strokeWidth="2.5" />
              <text x="502" y={42 - simulation.frStroke * 1.5} textAnchor="middle" fill="#fbbf24" fontSize="18" fontFamily="JetBrains Mono" fontWeight="bold">
                FR: {simulation.frStroke > 0 ? `+${simulation.frStroke}` : simulation.frStroke}"
              </text>

              {/* Rear-Left Wheel */}
              <rect x="35" y={190 - simulation.rlStroke * 1.5} width="45" height="65" rx="8" fill="#171717" stroke="#f5f5f5" strokeWidth="2.5" />
              <text x="58" y={280 - simulation.rlStroke * 1.5} textAnchor="middle" fill="#fbbf24" fontSize="18" fontFamily="JetBrains Mono" fontWeight="bold">
                RL: {simulation.rlStroke > 0 ? `+${simulation.rlStroke}` : simulation.rlStroke}"
              </text>

              {/* Rear-Right Wheel */}
              <rect x="480" y={190 - simulation.rrStroke * 1.5} width="45" height="65" rx="8" fill="#171717" stroke="#f5f5f5" strokeWidth="2.5" />
              <text x="502" y={280 - simulation.rrStroke * 1.5} textAnchor="middle" fill="#fbbf24" fontSize="18" fontFamily="JetBrains Mono" fontWeight="bold">
                RR: {simulation.rrStroke > 0 ? `+${simulation.rrStroke}` : simulation.rrStroke}"
              </text>
            </svg>
          </div>

          {/* Real-Time Metrics Strip (2x2 Grid ensures all 4 cards fit cleanly inside the box) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 w-full min-w-0 box-border">
            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 min-w-0 overflow-hidden box-border">
              <span className="text-sm sm:text-base text-neutral-400 block font-medium truncate">Total Articulation:</span>
              <span className="text-2xl md:text-3xl font-extrabold text-emerald-400 num-tabular block mt-0.5 truncate">
                {simulation.totalSpread} in
              </span>
              <span className="text-xs sm:text-sm text-neutral-500 block truncate">Max 24.5 in Travel</span>
            </div>

            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 min-w-0 overflow-hidden box-border">
              <span className="text-sm sm:text-base text-neutral-400 block font-medium truncate">Roll Stiffness:</span>
              <span className="text-2xl md:text-3xl font-extrabold text-amber-400 num-tabular block mt-0.5 truncate">
                {simulation.rollStiffness.toLocaleString()}
              </span>
              <span className="text-xs sm:text-sm text-neutral-500 block truncate">Nm / rad</span>
            </div>

            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 min-w-0 overflow-hidden box-border">
              <span className="text-sm sm:text-base text-neutral-400 block font-medium truncate">Torsen Split:</span>
              <span className="text-2xl md:text-3xl font-extrabold text-white num-tabular block mt-0.5 truncate">
                {simulation.frontTorquePct}:{simulation.rearTorquePct}
              </span>
              <span className="text-xs sm:text-sm text-neutral-500 block truncate">Front : Rear Torque</span>
            </div>

            <div
              onClick={() => setRearLockerManual(!rearLockerManual)}
              className={`p-4 rounded-xl border transition-all cursor-pointer select-none min-w-0 overflow-hidden box-border ${
                simulation.rearLocked
                  ? 'bg-emerald-950/30 border-emerald-500/50 hover:border-emerald-400'
                  : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-sm sm:text-base text-neutral-400 block font-medium truncate">Rear E-Locker:</span>
                {simulation.rearLocked ? (
                  <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Unlock className="w-4 h-4 text-neutral-400 shrink-0" />
                )}
              </div>
              <span className={`text-2xl md:text-3xl font-extrabold num-tabular block mt-0.5 truncate ${
                simulation.rearLocked ? 'text-emerald-400' : 'text-neutral-100'
              }`}>
                {simulation.rearLocked ? 'LOCKED' : 'OPEN'}
              </span>
              <span className="text-xs sm:text-sm text-neutral-400 block mt-0.5 truncate">
                {simulation.rearLocked ? 'Dog-Clutch Engaged' : 'Click to Toggle'}
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* Production Python 3.12 Engine Source Code Display */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 bg-neutral-950 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <span className="text-[15px] font-mono font-bold text-white">
              src/ekdss_terrain_core.py
            </span>
            <span className="text-[15px] px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono border border-amber-500/20">
              Python 3.12+ Production Engine
            </span>
          </div>

          <button
            onClick={handleCopyCode}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-[15px] font-medium transition-colors cursor-pointer"
          >
            {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-neutral-400" />}
            <span>{isCopied ? 'Copied to Clipboard' : 'Copy Python Source'}</span>
          </button>
        </div>

        <div className="p-4 max-h-96 overflow-y-auto bg-neutral-950 text-neutral-300 font-mono text-[15px] leading-relaxed">
          <pre><code>{EKDSS_PYTHON_CODE}</code></pre>
        </div>
      </div>

    </div>
  );
};
