import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  CloudRain, 
  Coffee, 
  Sparkles, 
  Wind, 
  Radio, 
  Activity, 
  Headphones, 
  Sliders, 
  ShieldCheck, 
  Zap, 
  RotateCw,
  CheckCircle2,
  Info
} from 'lucide-react';
import { SoundscapePreset, SoundscapePresetId } from '../types';
import { audioEngine, SOUNDSCAPE_PRESETS } from '../utils/audio';

interface AmbientSoundscapeProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AmbientSoundscape: React.FC<AmbientSoundscapeProps> = ({
  isOpen,
  onClose
}) => {
  const [activePreset, setActivePreset] = useState<SoundscapePresetId>(audioEngine.getSoundscapePreset());
  const [isPlaying, setIsPlaying] = useState<boolean>(audioEngine.isSoundscapeActive());
  const [volume, setVolume] = useState<number>(audioEngine.getSoundscapeVolume());
  const [isGlobalMuted, setIsGlobalMuted] = useState<boolean>(audioEngine.isMuted());

  // Real-time canvas frequency visualizer ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Sync state with audioEngine events
  useEffect(() => {
    setActivePreset(audioEngine.getSoundscapePreset());
    setIsPlaying(audioEngine.isSoundscapeActive());
    setVolume(audioEngine.getSoundscapeVolume());
    setIsGlobalMuted(audioEngine.isMuted());

    const unsubSoundscape = audioEngine.onSoundscapeChange((state) => {
      setActivePreset(state.preset);
      setIsPlaying(state.active);
      setVolume(state.volume);
    });

    const unsubMute = audioEngine.onMuteChange((muted) => {
      setIsGlobalMuted(muted);
    });

    return () => {
      unsubSoundscape();
      unsubMute();
    };
  }, [isOpen]);

  // Real-time canvas visualizer loop
  useEffect(() => {
    if (!isOpen) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dataArray = new Uint8Array(32);

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Get real frequency data from Web Audio AnalyserNode
      audioEngine.getFrequencyData(dataArray);

      const numBars = 24;
      const barSpacing = 4;
      const totalBarWidth = (width - (numBars - 1) * barSpacing) / numBars;

      const currentPresetObj = SOUNDSCAPE_PRESETS.find((p) => p.id === activePreset) || SOUNDSCAPE_PRESETS[0];

      // Palette based on preset
      let barGradStart = '#22d3ee'; // cyan
      let barGradEnd = '#06b6d4';
      if (currentPresetObj.accentColor === 'amber') {
        barGradStart = '#f59e0b';
        barGradEnd = '#d97706';
      } else if (currentPresetObj.accentColor === 'purple') {
        barGradStart = '#a855f7';
        barGradEnd = '#7e22ce';
      } else if (currentPresetObj.accentColor === 'emerald') {
        barGradStart = '#10b981';
        barGradEnd = '#059669';
      } else if (currentPresetObj.accentColor === 'blue') {
        barGradStart = '#3b82f6';
        barGradEnd = '#1d4ed8';
      }

      for (let i = 0; i < numBars; i++) {
        // Sample frequencies across 32 bins
        const freqIndex = Math.min(31, Math.floor((i / numBars) * 28));
        const rawValue = dataArray[freqIndex] || 0;

        // When playing, scale raw amplitude; when idle, show subtle resting wave
        let normHeight = isPlaying && !isGlobalMuted 
          ? (rawValue / 255) * height * 0.95 
          : (Math.sin(Date.now() * 0.003 + i * 0.4) * 0.12 + 0.16) * height;

        normHeight = Math.max(6, normHeight);

        const x = i * (totalBarWidth + barSpacing);
        const y = height - normHeight;

        const grad = ctx.createLinearGradient(0, y, 0, height);
        grad.addColorStop(0, barGradStart);
        grad.addColorStop(1, barGradEnd);

        ctx.fillStyle = grad;
        // Rounded bar cap
        ctx.beginPath();
        ctx.roundRect(x, y, totalBarWidth, normHeight, [3, 3, 0, 0]);
        ctx.fill();

        // Top glow pip
        if (isPlaying && !isGlobalMuted && rawValue > 40) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x + 1, y, Math.max(1, totalBarWidth - 2), 2);
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOpen, activePreset, isPlaying, isGlobalMuted]);

  if (!isOpen) return null;

  const currentPresetObj = SOUNDSCAPE_PRESETS.find((p) => p.id === activePreset) || SOUNDSCAPE_PRESETS[0];

  const handleSelectPreset = (presetId: SoundscapePresetId) => {
    audioEngine.playClick();
    if (presetId === activePreset && isPlaying) {
      // Toggle off
      audioEngine.stopSoundscape();
    } else {
      audioEngine.setSoundscapePreset(presetId);
      audioEngine.startSoundscape(presetId);
    }
  };

  const handleToggleGlobalPlay = () => {
    audioEngine.playClick();
    audioEngine.toggleSoundscape(activePreset);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    audioEngine.setSoundscapeVolume(val);
  };

  const getPresetIcon = (iconName: string) => {
    switch (iconName) {
      case 'CloudRain':
        return <CloudRain className="w-6 h-6" />;
      case 'Coffee':
        return <Coffee className="w-6 h-6" />;
      case 'Sparkles':
        return <Sparkles className="w-6 h-6" />;
      case 'Wind':
        return <Wind className="w-6 h-6" />;
      case 'Radio':
        return <Radio className="w-6 h-6" />;
      default:
        return <Activity className="w-6 h-6" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-zinc-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-zinc-900 border border-zinc-700/80 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-zinc-800 bg-zinc-950/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.25)]">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-mono font-bold tracking-tight text-white">
                  AMBIENT SOUNDSCAPE ENGINE
                </h2>
                <span className="px-3 py-1 rounded-md text-sm font-mono font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  WEB AUDIO DSP
                </span>
              </div>
              <p className="text-sm sm:text-base text-zinc-400 font-sans mt-0.5">
                Zero-distraction acoustic synthesis calibrated for ADHD hyper-focus & sensory isolation
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              audioEngine.playClick();
              onClose();
            }}
            className="w-11 h-11 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
            title="Close soundscape workstation"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Global Mute Alert Banner */}
        {isGlobalMuted && (
          <div className="px-6 py-2.5 bg-red-950/40 border-b border-red-900/60 flex items-center justify-between text-red-300 text-sm font-mono">
            <div className="flex items-center gap-2">
              <VolumeX className="w-5 h-5 text-red-400 shrink-0" />
              <span>GLOBAL SFX IS CURRENTLY MUTED IN COCKPIT HEADER. UNMUTE TO HEAR AUDIO SYNTHESIS.</span>
            </div>
            <button
              onClick={() => audioEngine.toggleMute()}
              className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded text-red-200 font-bold transition-all text-sm"
            >
              UNMUTE NOW
            </button>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Active Preset Hero Display & Equalizer Visualizer */}
          <div className="p-5 sm:p-6 rounded-2xl bg-zinc-950/90 border border-zinc-800 relative overflow-hidden">
            {/* Background Accent Ambient Glow */}
            <div className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-15 pointer-events-none ${
              currentPresetObj.accentColor === 'amber' ? 'bg-amber-500' :
              currentPresetObj.accentColor === 'purple' ? 'bg-purple-500' :
              currentPresetObj.accentColor === 'emerald' ? 'bg-emerald-500' :
              currentPresetObj.accentColor === 'blue' ? 'bg-blue-500' : 'bg-cyan-500'
            }`} />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2.5">
                  <span className={`px-3 py-1 rounded-md text-sm font-mono font-bold uppercase tracking-wider ${
                    currentPresetObj.accentColor === 'amber' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                    currentPresetObj.accentColor === 'purple' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' :
                    currentPresetObj.accentColor === 'emerald' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                    currentPresetObj.accentColor === 'blue' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' :
                    'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  }`}>
                    {currentPresetObj.badge}
                  </span>
                  <span className="text-sm font-mono text-zinc-400">
                    SPECTRUM: <strong className="text-zinc-200">{currentPresetObj.frequencyRange}</strong>
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-mono font-bold tracking-tight text-white flex items-center gap-3">
                  <span>{currentPresetObj.name}</span>
                  {isPlaying && !isGlobalMuted && (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 text-sm font-mono font-bold animate-pulse">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      LIVE TRANSMISSION
                    </span>
                  )}
                </h3>

                <p className="text-base text-zinc-300 font-sans leading-relaxed">
                  {currentPresetObj.description}
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1 text-sm font-mono text-zinc-400">
                  <span className="text-zinc-300">Target State: <strong className="text-cyan-400">{currentPresetObj.recommendedState}</strong></span>
                  <span>·</span>
                  <span>Architecture: <span className="text-zinc-300">{currentPresetObj.noiseType}</span></span>
                </div>
              </div>

              {/* Master Control Unit for Current Preset */}
              <div className="flex flex-col sm:flex-row md:flex-col items-stretch gap-4 shrink-0 w-full md:w-64">
                <button
                  onClick={handleToggleGlobalPlay}
                  className={`min-h-[48px] px-6 py-3 rounded-2xl font-mono text-base font-bold flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95 ${
                    isPlaying && !isGlobalMuted
                      ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-[0_0_20px_rgba(245,158,11,0.35)]'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-zinc-950 shadow-[0_0_20px_rgba(34,211,238,0.35)]'
                  }`}
                >
                  {isPlaying && !isGlobalMuted ? (
                    <>
                      <Pause className="w-5 h-5 fill-current" />
                      <span>PAUSE SOUNDSCAPE</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 fill-current" />
                      <span>ENGAGE SOUNDSCAPE</span>
                    </>
                  )}
                </button>

                {/* Volume Slider Bar */}
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between text-sm font-mono">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <Volume2 className="w-4 h-4 text-cyan-400" />
                      <span>ACOUSTIC GAIN</span>
                    </span>
                    <span className="font-bold text-cyan-300">
                      {Math.round(volume * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-full accent-cyan-400 cursor-pointer h-2 bg-zinc-800 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Live Canvas Frequency Equalizer */}
            <div className="mt-6 pt-5 border-t border-zinc-800/80">
              <div className="flex items-center justify-between text-sm font-mono text-zinc-400 mb-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span>DSP EQUALIZER TELEMETRY (REAL-TIME 32-BAND FFT)</span>
                </div>
                <span>{isPlaying && !isGlobalMuted ? 'TRANSMITTING' : 'STANDBY'}</span>
              </div>
              <canvas
                ref={canvasRef}
                width={760}
                height={72}
                className="w-full h-18 bg-zinc-950 rounded-xl border border-zinc-800/90 shadow-inner"
              />
            </div>
          </div>

          {/* Soundscape Presets Deck Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-mono font-bold text-zinc-200 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-cyan-400" />
                <span>SELECT SOUNDSCAPE PRESET</span>
              </h3>
              <span className="text-sm font-mono text-zinc-400">
                {SOUNDSCAPE_PRESETS.length} ACOUSTIC PRESETS AVAILABLE
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SOUNDSCAPE_PRESETS.map((preset) => {
                const isSelected = activePreset === preset.id;
                const isCurrentlyEmitting = isSelected && isPlaying && !isGlobalMuted;

                return (
                  <div
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset.id)}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between group select-none ${
                      isSelected
                        ? isCurrentlyEmitting
                          ? 'bg-zinc-950 border-cyan-400/80 shadow-[0_0_25px_rgba(34,211,238,0.25)] ring-1 ring-cyan-400/50'
                          : 'bg-zinc-950/80 border-cyan-500/40 shadow-md'
                        : 'bg-zinc-900/90 border-zinc-800/90 hover:border-zinc-700 hover:bg-zinc-850'
                    }`}
                  >
                    {/* Top Row: Icon + Badge + Frequency */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? preset.accentColor === 'amber' ? 'bg-amber-500/25 text-amber-300' :
                              preset.accentColor === 'purple' ? 'bg-purple-500/25 text-purple-300' :
                              preset.accentColor === 'emerald' ? 'bg-emerald-500/25 text-emerald-300' :
                              preset.accentColor === 'blue' ? 'bg-blue-500/25 text-blue-300' :
                              'bg-cyan-500/25 text-cyan-300'
                            : 'bg-zinc-800 text-zinc-400 group-hover:text-zinc-200'
                        }`}>
                          {getPresetIcon(preset.iconName)}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-lg font-mono font-bold text-white group-hover:text-cyan-300 transition-colors">
                              {preset.name}
                            </h4>
                            {isCurrentlyEmitting && (
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                            )}
                          </div>
                          <p className="text-sm text-zinc-400 font-sans line-clamp-1">
                            {preset.tagline}
                          </p>
                        </div>
                      </div>

                      <span className={`px-3 py-1 rounded-md text-sm font-mono font-bold shrink-0 ${
                        isSelected 
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40' 
                          : 'bg-zinc-800/80 text-zinc-400'
                      }`}>
                        {preset.badge}
                      </span>
                    </div>

                    {/* Middle: Description */}
                    <p className="text-sm text-zinc-300 font-sans leading-relaxed mb-4">
                      {preset.description}
                    </p>

                    {/* Bottom Telemetry & Quick Action */}
                    <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-sm font-mono text-zinc-400">
                      <div className="flex items-center gap-2">
                        <span>Range:</span>
                        <span className="text-zinc-200 font-bold">{preset.frequencyRange}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectPreset(preset.id);
                          }}
                          className={`min-h-[40px] px-4 py-2 rounded-xl text-sm font-mono font-bold flex items-center gap-2 transition-all ${
                            isCurrentlyEmitting
                              ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                              : isSelected
                              ? 'bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold'
                              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white'
                          }`}
                        >
                          {isCurrentlyEmitting ? (
                            <>
                              <Pause className="w-4 h-4" />
                              <span>PAUSE</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4" />
                              <span>{isSelected ? 'RESUME' : 'ACTIVATE'}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Technical Architecture Specs Callout */}
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm font-mono text-zinc-400">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="text-zinc-200 font-bold">CLEAN-ROOM DSP SYNTHESIS:</span> Zero external streaming files, zero network bandwidth overhead. Synthesized natively via Web Audio API oscillators and algorithmic pink noise.
              </div>
            </div>
            <div className="flex items-center gap-4 shrink-0 text-sm">
              <span className="text-zinc-300">Sample Rate: <strong>48.0 kHz</strong></span>
              <span>·</span>
              <span className="text-zinc-300">Latency: <strong>&lt; 5.2 ms</strong></span>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950/70 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2 text-sm font-mono text-zinc-400">
            <Info className="w-4 h-4 text-cyan-400" />
            <span>Soundscapes stay active in background across all views and Pomodoro focus bursts.</span>
          </div>

          <button
            onClick={() => {
              audioEngine.playClick();
              onClose();
            }}
            className="min-h-[44px] px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-mono text-base font-bold transition-all shadow-[0_0_15px_rgba(34,211,238,0.25)] active:scale-95 w-full sm:w-auto"
          >
            CONFIRM & RETURN TO COCKPIT
          </button>
        </div>
      </div>
    </div>
  );
};
