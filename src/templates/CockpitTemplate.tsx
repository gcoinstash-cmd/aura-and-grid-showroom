import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Zap,
  Flame,
  Gauge,
  Activity,
  RotateCcw,
  Play,
  Pause,
  ShieldAlert,
  Radio,
  Sparkles,
  Cpu,
  Maximize2,
  Minimize2,
  CheckCircle2,
} from 'lucide-react';

export interface CockpitTemplateProps {
  chassisId?: string;
  chassisName?: string;
  trackTier?: 'Track 1' | 'Track 2' | 'Track 3';
  samplingRateHz?: number;
  onAction?: (actionName: string, payload?: any) => void;
}

interface RadioMessage {
  id: string;
  timestamp: string;
  callsign: 'CREW CHIEF' | 'TELEMETRY' | 'PIT WALL';
  text: string;
  type: 'info' | 'warning' | 'alert';
}

export const CockpitTemplate: React.FC<CockpitTemplateProps> = ({
  chassisId = 'GF-T3-138',
  chassisName = 'Nexus Ultra-LOB Engine Workstation',
  trackTier = 'Track 3',
  samplingRateHz = 120,
  onAction,
}) => {
  // Gamified ADHD State
  const [nitroMultiplier, setNitroMultiplier] = useState<number>(1.0);
  const [comboStreak, setComboStreak] = useState<number>(42);
  const [gearK, setGearK] = useState<number>(3);
  const [tokenScore, setTokenScore] = useState<number>(84200);
  const [chaosActive, setChaosActive] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Calibration Parameters (Dimensionless / Physical SI)
  const [thrustFactor, setThrustFactor] = useState<number>(78.5);
  const [vectorAngleDeg, setVectorAngleDeg] = useState<number>(14.2);
  const [dampingRatio, setDampingRatio] = useState<number>(0.84);
  const [driveMode, setDriveMode] = useState<'NOMINAL' | 'OVERDRIVE' | 'SYNAPSE' | 'GRIDSYNC'>('NOMINAL');

  // Animated Telemetry Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const tickCountRef = useRef<number>(0);

  // Pit-Wall Radio Monospace Log
  const [radioLogs, setRadioLogs] = useState<RadioMessage[]>([
    {
      id: '1',
      timestamp: '00:00:01.024',
      callsign: 'CREW CHIEF',
      text: 'Cockpit telemetry link established. All 4 Dyno gates verified nominal.',
      type: 'info',
    },
    {
      id: '2',
      timestamp: '00:00:02.450',
      callsign: 'PIT WALL',
      text: 'Deterministic state machine locked. GridSync zero-trust sanitization active.',
      type: 'info',
    },
    {
      id: '3',
      timestamp: '00:00:03.180',
      callsign: 'TELEMETRY',
      text: 'Sector 1 ingress verified. Vector delta: +0.024 rad. Flow rate 100%.',
      type: 'info',
    },
  ]);

  const addRadioLog = useCallback((callsign: 'CREW CHIEF' | 'TELEMETRY' | 'PIT WALL', text: string, type: 'info' | 'warning' | 'alert' = 'info') => {
    const now = new Date();
    const timeStr = `${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}:${String(now.getMilliseconds()).padStart(3, '0')}`;
    setRadioLogs(prev => [
      ...prev.slice(-4),
      { id: Math.random().toString(36).slice(2, 9), timestamp: timeStr, callsign, text, type },
    ]);
  }, []);

  // 1. Launch Control Dock Action: INJECT CHAOS
  const handleInjectChaos = useCallback(() => {
    setChaosActive(prev => {
      const next = !prev;
      if (next) {
        addRadioLog('TELEMETRY', 'CHAOS INJECTION ACTIVE: Synthetic noise perturbation applied to telemetry bus!', 'alert');
        setComboStreak(0);
      } else {
        addRadioLog('CREW CHIEF', 'Chaos perturbation purged. State bus returned to nominal damping.', 'info');
      }
      onAction?.('INJECT_CHAOS', { active: next });
      return next;
    });
  }, [addRadioLog, onAction]);

  // 2. Launch Control Dock Action: NITRO OVERDRIVE
  const handleNitroOverdrive = useCallback(() => {
    setNitroMultiplier(prev => {
      const next = prev === 1.0 ? 5.0 : 1.0;
      if (next > 1.0) {
        addRadioLog('CREW CHIEF', 'NITRO OVERDRIVE ENGAGED: Simulation tick rate boosted to 5.0x!', 'warning');
        setGearK(6);
      } else {
        addRadioLog('PIT WALL', 'Nitro burn complete. Restored baseline 1.0x cruise velocity.', 'info');
        setGearK(3);
      }
      onAction?.('NITRO_OVERDRIVE', { multiplier: next });
      return next;
    });
  }, [addRadioLog, onAction]);

  // 3. Launch Control Dock Action: STEP ENGINE
  const handleStepEngine = useCallback(() => {
    tickCountRef.current += 1;
    setTokenScore(s => s + Math.round(50 * nitroMultiplier));
    setComboStreak(c => c + 1);
    addRadioLog('PIT WALL', `Manual engine tick step frame #${tickCountRef.current} executed (+50 PTS).`, 'info');
    onAction?.('STEP_ENGINE', { tick: tickCountRef.current });
  }, [addRadioLog, nitroMultiplier, onAction]);

  // 4. Launch Control Dock Action: PIT STOP RESET
  const handlePitStopReset = useCallback(() => {
    setChaosActive(false);
    setNitroMultiplier(1.0);
    setGearK(1);
    setThrustFactor(75.0);
    setVectorAngleDeg(12.0);
    setDampingRatio(0.85);
    setDriveMode('NOMINAL');
    addRadioLog('CREW CHIEF', 'PIT STOP COMPLETE: Re-zeroed sensor buses and calibrated baseline vectors.', 'info');
    onAction?.('PIT_STOP_RESET');
  }, [addRadioLog, onAction]);

  // Keyboard Hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        handleStepEngine();
      } else if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleNitroOverdrive();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleInjectChaos();
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        handlePitStopReset();
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsFullscreen(f => !f);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleStepEngine, handleNitroOverdrive, handleInjectChaos, handlePitStopReset]);

  // Animated Telemetry Canvas Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localFrame = 0;

    const render = () => {
      localFrame++;
      if (isRunning) {
        tickCountRef.current += 1;
        if (localFrame % 10 === 0) {
          setTokenScore(s => s + Math.round(12 * nitroMultiplier));
          if (!chaosActive) setComboStreak(c => c + 1);
        }
      }

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Grid Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Sine Wave Telemetry Vector
      ctx.beginPath();
      ctx.strokeStyle = chaosActive ? '#EF4444' : nitroMultiplier > 1 ? '#FF9F0A' : '#00F0FF';
      ctx.lineWidth = 2.5;

      const noiseAmp = chaosActive ? 18.0 : 2.5;
      const speedOffset = (tickCountRef.current * 0.04 * nitroMultiplier);

      for (let x = 0; x < w; x += 3) {
        const rad = (x * 0.02) + speedOffset;
        const noise = (Math.sin(x * 0.15 + speedOffset * 2) * noiseAmp);
        const y = (h / 2) + Math.sin(rad) * (thrustFactor * 0.5) + noise;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Current Leading Pulse Beacon
      const leadX = (w * 0.85);
      const leadRad = (leadX * 0.02) + speedOffset;
      const leadY = (h / 2) + Math.sin(leadRad) * (thrustFactor * 0.5);

      ctx.fillStyle = chaosActive ? '#EF4444' : '#10B981';
      ctx.beginPath();
      ctx.arc(leadX, leadY, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = chaosActive ? 'rgba(239, 68, 68, 0.5)' : 'rgba(16, 185, 129, 0.5)';
      ctx.beginPath();
      ctx.arc(leadX, leadY, 12, 0, Math.PI * 2);
      ctx.stroke();

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isRunning, nitroMultiplier, chaosActive, thrustFactor]);

  return (
    <div className={`w-full bg-[#05070B] text-slate-100 flex flex-col font-sans select-none ${isFullscreen ? 'fixed inset-0 z-50 h-screen' : 'h-screen'} overflow-hidden`}>
      {/* 1. TOP COMMAND DECK (SINGLE-LINE COMPACT HEADER) */}
      <header className="h-12 bg-[#0B101B]/95 border-b border-white/10 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono font-black text-sm text-cyan-400 tracking-wider bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-400/40">
              {chassisId}
            </span>
            <span className="font-sans font-bold text-xs text-white truncate max-w-[200px] sm:max-w-[340px]">
              {chassisName}
            </span>
          </div>
          <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold tracking-wider uppercase border border-cyan-400/40 text-cyan-300 bg-cyan-500/15">
            {trackTier} // F1 PIT WALL
          </span>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 text-[11px] font-mono font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>[DYNO SEALED 4/4 GATES]</span>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-slate-400 hidden md:inline">
            TICK: <strong className="text-cyan-300">{tickCountRef.current}</strong>
          </span>
          <span className="text-slate-400 hidden lg:inline">
            HZ: <strong className="text-emerald-400">{samplingRateHz}</strong>
          </span>
          <button
            onClick={() => setIsRunning(r => !r)}
            className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 text-xs font-mono font-bold transition-all flex items-center gap-1 cursor-pointer"
          >
            {isRunning ? <Pause size={12} className="text-amber-400" /> : <Play size={12} className="text-emerald-400" />}
            <span>{isRunning ? 'PAUSE' : 'RESUME'}</span>
          </button>
          <button
            onClick={() => setIsFullscreen(f => !f)}
            className="p-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/15 text-slate-300 hover:text-white cursor-pointer"
            title="Toggle Viewport Fullscreen [Key: F]"
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      </header>

      {/* 2. 4-CARD HUD RIBBON */}
      <section className="h-16 bg-[#070A10] border-b border-white/10 px-4 grid grid-cols-4 gap-2.5 py-1.5 shrink-0 font-mono">
        {/* Ribbon 1: Speedup Nitro */}
        <div className="bg-[#111724]/80 border border-amber-500/30 rounded-xl px-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-amber-400/80 font-bold uppercase tracking-wider flex items-center gap-1">
              <Zap size={11} className="text-amber-400" />
              <span>Speedup Nitro</span>
            </div>
            <div className="text-sm sm:text-base font-black text-amber-300">
              {nitroMultiplier.toFixed(1)}x {nitroMultiplier > 1 ? 'OVERDRIVE' : 'NOMINAL'}
            </div>
          </div>
          <span className={`w-2 h-2 rounded-full ${nitroMultiplier > 1 ? 'bg-amber-400 animate-ping' : 'bg-slate-600'}`} />
        </div>

        {/* Ribbon 2: Combo Streak */}
        <div className="bg-[#111724]/80 border border-orange-500/30 rounded-xl px-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-orange-400/80 font-bold uppercase tracking-wider flex items-center gap-1">
              <Flame size={11} className="text-orange-400" />
              <span>Combo Streak</span>
            </div>
            <div className="text-sm sm:text-base font-black text-orange-300">
              {comboStreak}x STREAK 🔥
            </div>
          </div>
          <span className="text-xs text-orange-400 font-black">HIGH-Q</span>
        </div>

        {/* Ribbon 3: Shift Gear K=X */}
        <div className="bg-[#111724]/80 border border-cyan-500/30 rounded-xl px-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-cyan-400/80 font-bold uppercase tracking-wider flex items-center gap-1">
              <Gauge size={11} className="text-cyan-400" />
              <span>Transmission</span>
            </div>
            <div className="text-sm sm:text-base font-black text-cyan-300">
              GEAR K={gearK}
            </div>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-200 border border-cyan-400/30 font-bold">
            1:{gearK * 2}.5
          </span>
        </div>

        {/* Ribbon 4: Token Score PTS */}
        <div className="bg-[#111724]/80 border border-emerald-500/30 rounded-xl px-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-emerald-400/80 font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={11} className="text-emerald-400" />
              <span>Telemetry Score</span>
            </div>
            <div className="text-sm sm:text-base font-black text-emerald-300">
              {tokenScore.toLocaleString()} PTS
            </div>
          </div>
          <span className="text-xs text-emerald-400 font-black">+12/t</span>
        </div>
      </section>

      {/* 3. INTERACTIVE CENTER BAY (ZERO SCROLLBARS, DENSE BENTO GRID) */}
      <main className="flex-1 min-h-0 px-4 py-2.5 grid grid-cols-1 lg:grid-cols-12 gap-3 overflow-hidden">
        {/* Left Bay: SCADA Visualizer & Vector Graph (Col 7) */}
        <div className="lg:col-span-7 bg-[#0E1422]/90 border border-white/10 rounded-2xl p-3 flex flex-col justify-between overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          <div className="flex items-center justify-between mb-1.5 font-mono text-xs">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-cyan-400" />
              <span className="font-bold text-white uppercase tracking-wider">
                Real-Time Kinematic Waveform
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${chaosActive ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'}`}>
                {chaosActive ? 'CHAOS INJECTED' : 'STATE LOCKED'}
              </span>
              <span className="text-slate-400 text-[10px]">DT: 10ms</span>
            </div>
          </div>

          {/* Canvas Waveform */}
          <div className="relative flex-1 w-full bg-[#05070B] rounded-xl border border-white/10 overflow-hidden flex items-center justify-center">
            <canvas ref={canvasRef} width={640} height={200} className="w-full h-full object-cover" />
            <div className="absolute top-2 left-3 font-mono text-[10px] text-slate-400 space-y-0.5 pointer-events-none">
              <div>AMP: <strong className="text-cyan-300">{(thrustFactor * 0.5).toFixed(1)} kN</strong></div>
              <div>VECTOR: <strong className="text-amber-300">{vectorAngleDeg.toFixed(1)}°</strong></div>
              <div>DAMPING: <strong className="text-emerald-300">{dampingRatio.toFixed(2)} ζ</strong></div>
            </div>
            <div className="absolute bottom-2 right-3 font-mono text-[10px] text-slate-400 flex items-center gap-2 pointer-events-none">
              <span>ZERO-TRUST GRIDSYNC:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 size={11} /> 100% CLEAN
              </span>
            </div>
          </div>

          {/* Quick Telemetry Bar */}
          <div className="mt-2 grid grid-cols-3 gap-2 font-mono text-xs">
            <div className="p-2 rounded-lg bg-white/[0.03] border border-white/10">
              <span className="text-slate-400 text-[10px] block">DYNAMIC LOAD</span>
              <strong className="text-cyan-300">{(thrustFactor * 1.84).toFixed(1)} kPa</strong>
            </div>
            <div className="p-2 rounded-lg bg-white/[0.03] border border-white/10">
              <span className="text-slate-400 text-[10px] block">G-FORCE RESIDUAL</span>
              <strong className="text-amber-300">{(vectorAngleDeg * 0.28).toFixed(2)} G</strong>
            </div>
            <div className="p-2 rounded-lg bg-white/[0.03] border border-white/10">
              <span className="text-slate-400 text-[10px] block">THROUGHPUT</span>
              <strong className="text-emerald-300">{(nitroMultiplier * 1.42).toFixed(2)} GB/s</strong>
            </div>
          </div>
        </div>

        {/* Right Bay: Tactile Calibration Deck (Col 5) */}
        <div className="lg:col-span-5 bg-[#0E1422]/90 border border-white/10 rounded-2xl p-3 flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-2 font-mono text-xs">
              <div className="flex items-center gap-2">
                <Cpu size={14} className="text-amber-400" />
                <span className="font-bold text-white uppercase tracking-wider">Tactile Calibration Deck</span>
              </div>
              <span className="text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-400/30 font-bold">
                MODE: {driveMode}
              </span>
            </div>

            {/* Mode Selector Buttons */}
            <div className="grid grid-cols-4 gap-1.5 mb-3 font-mono text-[11px]">
              {(['NOMINAL', 'OVERDRIVE', 'SYNAPSE', 'GRIDSYNC'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => {
                    setDriveMode(mode);
                    addRadioLog('CREW CHIEF', `Operating mode shifted to ${mode}.`, 'info');
                  }}
                  className={`py-1.5 px-1 rounded-lg font-bold border transition-all cursor-pointer text-center ${
                    driveMode === mode
                      ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.35)]'
                      : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Tactile Sliders */}
            <div className="space-y-2.5 font-mono text-xs">
              <div>
                <div className="flex justify-between text-slate-300 mb-1 text-[11px]">
                  <span>THRUST FACTOR:</span>
                  <span className="text-amber-300 font-bold">{thrustFactor.toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="120"
                  step="0.5"
                  value={thrustFactor}
                  onChange={e => setThrustFactor(parseFloat(e.target.value))}
                  className="w-full accent-amber-400 bg-white/10 h-1.5 rounded cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1 text-[11px]">
                  <span>VECTOR ANGLE:</span>
                  <span className="text-cyan-300 font-bold">{vectorAngleDeg.toFixed(1)} deg</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="45"
                  step="0.2"
                  value={vectorAngleDeg}
                  onChange={e => setVectorAngleDeg(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 bg-white/10 h-1.5 rounded cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1 text-[11px]">
                  <span>DAMPING RATIO:</span>
                  <span className="text-emerald-300 font-bold">{dampingRatio.toFixed(2)} ζ</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.5"
                  step="0.05"
                  value={dampingRatio}
                  onChange={e => setDampingRatio(parseFloat(e.target.value))}
                  className="w-full accent-emerald-400 bg-white/10 h-1.5 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Hotkey Legend Banner */}
          <div className="mt-2 py-1.5 px-2.5 rounded-lg bg-black/40 border border-white/5 font-mono text-[10px] text-slate-400 flex items-center justify-between">
            <span>HOTKEYS:</span>
            <span><kbd className="px-1 py-0.5 rounded bg-white/10 text-white font-bold">Space</kbd> Step</span>
            <span><kbd className="px-1 py-0.5 rounded bg-white/10 text-white font-bold">N</kbd> Nitro</span>
            <span><kbd className="px-1 py-0.5 rounded bg-white/10 text-white font-bold">C</kbd> Chaos</span>
            <span><kbd className="px-1 py-0.5 rounded bg-white/10 text-white font-bold">R</kbd> Reset</span>
          </div>
        </div>
      </main>

      {/* 4. LAUNCH CONTROL DOCK (4 TACTILE ARCADE SWITCHES) */}
      <section className="h-14 bg-[#0A0E18] border-t border-b border-white/10 px-4 grid grid-cols-4 gap-2.5 py-1.5 shrink-0 font-mono text-xs">
        {/* Switch 1: INJECT CHAOS */}
        <button
          onClick={handleInjectChaos}
          className={`py-2 px-3 rounded-xl font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 border ${
            chaosActive
              ? 'bg-red-500 text-white border-red-400 shadow-[0_0_18px_rgba(239,68,68,0.5)] animate-pulse'
              : 'bg-red-500/15 hover:bg-red-500/25 text-red-300 border-red-500/40'
          }`}
          title="Inject synthetic perturbation anomaly into telemetry stream [Key: C]"
        >
          <ShieldAlert size={14} />
          <span>[INJECT CHAOS]</span>
        </button>

        {/* Switch 2: NITRO OVERDRIVE */}
        <button
          onClick={handleNitroOverdrive}
          className={`py-2 px-3 rounded-xl font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 border ${
            nitroMultiplier > 1
              ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_18px_rgba(245,158,11,0.5)]'
              : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40'
          }`}
          title="Engage 5.0x simulation clock rate multiplier [Key: N]"
        >
          <Zap size={14} />
          <span>[NITRO OVERDRIVE]</span>
        </button>

        {/* Switch 3: STEP ENGINE */}
        <button
          onClick={handleStepEngine}
          className="py-2 px-3 rounded-xl font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 border bg-cyan-500/20 hover:bg-cyan-500 text-cyan-200 hover:text-black border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.25)]"
          title="Execute single deterministic clock tick frame [Key: Space]"
        >
          <Play size={14} />
          <span>[STEP ENGINE]</span>
        </button>

        {/* Switch 4: PIT STOP RESET */}
        <button
          onClick={handlePitStopReset}
          className="py-2 px-3 rounded-xl font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 border bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white border-white/20"
          title="Restore baseline parameters and clear faults [Key: R]"
        >
          <RotateCcw size={14} />
          <span>[PIT STOP RESET]</span>
        </button>
      </section>

      {/* 5. PIT-WALL RADIO COMMS LOG (BOUNDED MONOSPACE TERMINAL STRIP h-14) */}
      <footer className="h-14 bg-[#05070B] px-4 py-1.5 font-mono text-[11px] flex flex-col justify-center overflow-hidden shrink-0">
        <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-bold mb-0.5">
          <Radio size={11} className="text-cyan-400" />
          <span>PIT-WALL RADIO COMMS LOG // ZERO-DOLLAR TELEMETRY STREAM</span>
        </div>
        <div className="space-y-0.5 overflow-hidden">
          {radioLogs.slice(-2).map(log => (
            <div key={log.id} className="truncate flex items-center gap-2">
              <span className="text-slate-400">[{log.timestamp}]</span>
              <span className={`font-bold px-1 rounded text-[10px] ${
                log.callsign === 'CREW CHIEF'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : log.callsign === 'TELEMETRY'
                  ? 'bg-red-500/20 text-red-300'
                  : 'bg-amber-500/20 text-amber-300'
              }`}>
                {log.callsign === 'CREW CHIEF' ? '🟢 CREW CHIEF' : log.callsign === 'TELEMETRY' ? '🔴 TELEMETRY' : '⚡ PIT WALL'}:
              </span>
              <span className={log.type === 'alert' ? 'text-red-300 font-bold' : log.type === 'warning' ? 'text-amber-200' : 'text-slate-200'}>
                {log.text}
              </span>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
};

export default CockpitTemplate;
