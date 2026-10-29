import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, RotateCcw, Activity, ShieldCheck, Zap, ArrowLeft } from 'lucide-react';
import { audioEngine } from '../utils/audio';

interface ReactorRechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionComplete: (xpEarned: number) => void;
}

type BreathPhase = 'inhale' | 'hold' | 'exhale' | 'rest';

interface PhaseConfig {
  phase: BreathPhase;
  label: string;
  duration: number;
  instruction: string;
  color: string;
  scale: string;
}

const PHASES: PhaseConfig[] = [
  { 
    phase: 'inhale', 
    label: 'INHALE POWER', 
    duration: 4, 
    instruction: 'Fill lungs smoothly. Draw clean oxygen into the core.', 
    color: 'border-cyan-400 text-cyan-300 shadow-[0_0_35px_rgba(34,211,238,0.4)]',
    scale: 'scale-125'
  },
  { 
    phase: 'hold', 
    label: 'LOCK THE CORE', 
    duration: 4, 
    instruction: 'Hold pressure steady. Zero tension in the shoulders.', 
    color: 'border-amber-400 text-amber-300 shadow-[0_0_35px_rgba(245,158,11,0.4)]',
    scale: 'scale-125'
  },
  { 
    phase: 'exhale', 
    label: 'VENT THE STATIC', 
    duration: 4, 
    instruction: 'Slow steady release through mouth. Clear all mental chatter.', 
    color: 'border-emerald-400 text-emerald-300 shadow-[0_0_35px_rgba(52,211,153,0.4)]',
    scale: 'scale-90'
  },
  { 
    phase: 'rest', 
    label: 'STABILIZE', 
    duration: 2, 
    instruction: 'Neutral stillness. Wait for the next charge.', 
    color: 'border-zinc-500 text-zinc-400 shadow-none',
    scale: 'scale-95'
  }
];

export const ReactorRechargeModal: React.FC<ReactorRechargeModalProps> = ({
  isOpen,
  onClose,
  onSessionComplete
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds total session
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState(PHASES[0].duration);
  const [sessionFinished, setSessionFinished] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentPhase = PHASES[currentPhaseIndex];

  // Wire Escape key listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        audioEngine.playClick();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Tick loop
  useEffect(() => {
    if (!isOpen) {
      setIsRunning(false);
      setTimeLeft(60);
      setCurrentPhaseIndex(0);
      setPhaseSecondsLeft(PHASES[0].duration);
      setSessionFinished(false);
      return;
    }

    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });

        setPhaseSecondsLeft((prev) => {
          if (prev <= 1) {
            // Next phase
            setCurrentPhaseIndex((prevIdx) => {
              const nextIdx = (prevIdx + 1) % PHASES.length;
              audioEngine.playBreathingTone(PHASES[nextIdx].phase);
              return nextIdx;
            });
            const nextIdx = (currentPhaseIndex + 1) % PHASES.length;
            return PHASES[nextIdx].duration;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timeLeft, currentPhaseIndex, isOpen]);

  const handleStart = () => {
    audioEngine.playClick();
    audioEngine.playBreathingTone(currentPhase.phase);
    setIsRunning(true);
  };

  const handlePause = () => {
    audioEngine.playClick();
    setIsRunning(false);
  };

  const handleReset = () => {
    audioEngine.playClick();
    setIsRunning(false);
    setTimeLeft(60);
    setCurrentPhaseIndex(0);
    setPhaseSecondsLeft(PHASES[0].duration);
    setSessionFinished(false);
  };

  const handleComplete = () => {
    setIsRunning(false);
    setSessionFinished(true);
    audioEngine.playOvercharge();
    onSessionComplete(100);
  };

  if (!isOpen) return null;

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          audioEngine.playClick();
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
    >
      <div className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Sticky Top Close Header */}
        <div className="sticky top-0 z-20 bg-zinc-900/95 backdrop-blur border-b border-zinc-800 p-4 sm:p-5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">Reactor Core Recharge</h3>
              <span className="text-base font-mono text-zinc-400">TACTICAL 60s CALIBRATION</span>
            </div>
          </div>

          <button
            onClick={() => {
              audioEngine.playClick();
              onClose();
            }}
            className="py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-mono text-base font-bold flex items-center gap-2 transition-all hover:border-cyan-400 shadow-md"
            title="Close modal (Escape)"
          >
            <X className="w-5 h-5 text-cyan-400" />
            <span>✕ CLOSE COCKPIT (ESC)</span>
          </button>
        </div>

        {/* Scrollable Modal Content Container */}
        <div className="overflow-y-auto flex-1 p-6 sm:p-8 space-y-6">
          
          <div className="text-center">
            <p className="text-base sm:text-lg text-zinc-300 max-w-md mx-auto leading-relaxed">
              Tactical box breathing to cool down pre-frontal cortex lag and reset executive focus.
            </p>
          </div>

          {/* Reactor Core Visualizer */}
          <div className="relative my-4 flex items-center justify-center h-64">
            {/* Concentric Outer Waves */}
            <div 
              className={`absolute w-60 h-60 rounded-full border border-dashed border-zinc-800 transition-transform duration-1000 ${
                isRunning ? 'animate-spin' : ''
              }`}
              style={{ animationDuration: '30s' }}
            />

            {/* Dynamic Pulsing Phase Ring */}
            <div
              className={`absolute w-48 h-48 rounded-full border-2 transition-all duration-1000 ease-in-out flex items-center justify-center ${
                currentPhase.color
              } ${isRunning ? currentPhase.scale : 'scale-100'}`}
            >
              {/* Core Glow Particle Center */}
              <div className="w-32 h-32 rounded-full bg-zinc-900 border border-zinc-700/80 flex flex-col items-center justify-center text-center p-2 shadow-inner">
                <span className="text-base font-mono text-zinc-300 font-bold leading-tight">
                  {currentPhase.label}
                </span>
                <span className="text-4xl font-black font-mono text-white tabular-nums my-0.5">
                  {phaseSecondsLeft}s
                </span>
                <span className="text-base font-mono text-cyan-400 font-bold">
                  TOTAL: {timeLeft}s
                </span>
              </div>
            </div>
          </div>

          {/* Instruction Guidance Text */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 text-center">
            <div className="text-lg font-semibold text-zinc-100">
              {sessionFinished ? 'Core calibrated! +100 XP gained.' : currentPhase.instruction}
            </div>
            <div className="text-base font-mono text-zinc-400 mt-2">
              Phase {currentPhaseIndex + 1} of 4 · Tactical Box Cycle (4-4-4-2s)
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center justify-center gap-4">
            {!isRunning ? (
              <button
                onClick={handleStart}
                className="py-3.5 px-7 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-base flex items-center gap-2.5 transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)] active:scale-95"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>{timeLeft < 60 && !sessionFinished ? 'RESUME RECHARGE' : 'INITIALIZE RECHARGE'}</span>
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="py-3.5 px-7 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-base flex items-center gap-2.5 transition-all border border-zinc-700 active:scale-95"
              >
                <Pause className="w-5 h-5 fill-current" />
                <span>PAUSE RECHARGE</span>
              </button>
            )}

            <button
              onClick={handleReset}
              className="p-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors"
              title="Reset timer"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          {sessionFinished && (
            <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-base font-mono font-bold flex items-center justify-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>NEURAL CORE FULLY CHARGED · +100 XP LOGGED</span>
            </div>
          )}

        </div>

        {/* Pinned Bottom Action Bar */}
        <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-950/95 shrink-0 flex items-center justify-between gap-4">
          <div className="text-base text-zinc-400">
            Press <kbd className="px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-200 font-mono text-base">Esc</kbd> or click outside to dismiss.
          </div>

          <button
            onClick={() => {
              audioEngine.playClick();
              onClose();
            }}
            className="py-3 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-base font-mono flex items-center gap-2.5 transition-all shadow-md active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>EXIT TO COCKPIT</span>
          </button>
        </div>

      </div>
    </div>
  );
};
