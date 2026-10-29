import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Sliders, 
  Headphones, 
  Radio, 
  CloudRain, 
  Coffee, 
  Sparkles, 
  Wind,
  Maximize2
} from 'lucide-react';
import { SoundscapePresetId } from '../types';
import { audioEngine, SOUNDSCAPE_PRESETS } from '../utils/audio';

interface FooterEqualizerBarProps {
  onOpenSoundscapeModal: () => void;
}

export const FooterEqualizerBar: React.FC<FooterEqualizerBarProps> = ({
  onOpenSoundscapeModal
}) => {
  const [activePreset, setActivePreset] = useState<SoundscapePresetId>(audioEngine.getSoundscapePreset());
  const [isPlaying, setIsPlaying] = useState<boolean>(audioEngine.isSoundscapeActive());
  const [volume, setVolume] = useState<number>(audioEngine.getSoundscapeVolume());
  const [isMuted, setIsMuted] = useState<boolean>(audioEngine.isMuted());

  // Real-time canvas equalizer ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    setActivePreset(audioEngine.getSoundscapePreset());
    setIsPlaying(audioEngine.isSoundscapeActive());
    setVolume(audioEngine.getSoundscapeVolume());
    setIsMuted(audioEngine.isMuted());

    const unsubSoundscape = audioEngine.onSoundscapeChange((state) => {
      setActivePreset(state.preset);
      setIsPlaying(state.active);
      setVolume(state.volume);
    });

    const unsubMute = audioEngine.onMuteChange((muted) => {
      setIsMuted(muted);
    });

    return () => {
      unsubSoundscape();
      unsubMute();
    };
  }, []);

  // Equalizer visual animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dataArray = new Uint8Array(32);

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      audioEngine.getFrequencyData(dataArray);

      const numBars = 18;
      const barSpacing = 3;
      const totalBarWidth = (width - (numBars - 1) * barSpacing) / numBars;

      const currentPresetObj = SOUNDSCAPE_PRESETS.find((p) => p.id === activePreset) || SOUNDSCAPE_PRESETS[0];

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
        const freqIndex = Math.min(31, Math.floor((i / numBars) * 26));
        const rawValue = dataArray[freqIndex] || 0;

        let normHeight = isPlaying && !isMuted
          ? (rawValue / 255) * height * 0.92
          : (Math.sin(Date.now() * 0.0025 + i * 0.5) * 0.15 + 0.18) * height;

        normHeight = Math.max(4, normHeight);

        const x = i * (totalBarWidth + barSpacing);
        const y = height - normHeight;

        const grad = ctx.createLinearGradient(0, y, 0, height);
        grad.addColorStop(0, barGradStart);
        grad.addColorStop(1, barGradEnd);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, totalBarWidth, normHeight, [2, 2, 0, 0]);
        ctx.fill();

        if (isPlaying && !isMuted && rawValue > 40) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x, y, totalBarWidth, 1.5);
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [activePreset, isPlaying, isMuted]);

  const currentPresetObj = SOUNDSCAPE_PRESETS.find((p) => p.id === activePreset) || SOUNDSCAPE_PRESETS[0];

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    audioEngine.playClick();
    audioEngine.toggleSoundscape(activePreset);
  };

  const getPresetIcon = (iconName: string) => {
    switch (iconName) {
      case 'CloudRain':
        return <CloudRain className="w-5 h-5 text-cyan-400" />;
      case 'Coffee':
        return <Coffee className="w-5 h-5 text-amber-400" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-purple-400" />;
      case 'Wind':
        return <Wind className="w-5 h-5 text-emerald-400" />;
      case 'Radio':
        return <Radio className="w-5 h-5 text-blue-400" />;
      default:
        return <Radio className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
      <div 
        onClick={onOpenSoundscapeModal}
        className="group relative rounded-2xl p-4 sm:p-5 border border-zinc-800 bg-zinc-950/90 hover:border-cyan-500/50 transition-all cursor-pointer shadow-[0_4px_25px_rgba(0,0,0,0.5)] overflow-hidden"
      >
        {/* Subtle accent glow matching preset */}
        <div className={`absolute top-0 right-1/4 w-96 h-20 blur-3xl opacity-15 pointer-events-none transition-colors ${
          currentPresetObj.accentColor === 'amber' ? 'bg-amber-500' :
          currentPresetObj.accentColor === 'purple' ? 'bg-purple-500' :
          currentPresetObj.accentColor === 'emerald' ? 'bg-emerald-500' :
          currentPresetObj.accentColor === 'blue' ? 'bg-blue-500' : 'bg-cyan-500'
        }`} />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          
          {/* Left: Preset Meta & Status */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
              isPlaying && !isMuted
                ? 'bg-cyan-500/15 border-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.25)]'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400'
            }`}>
              {getPresetIcon(currentPresetObj.iconName)}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-bold text-zinc-400 uppercase tracking-wider">
                  AMBIENT SOUNDSCAPE
                </span>
                <span className={`px-2.5 py-0.5 rounded text-sm font-mono font-bold transition-all ${
                  isPlaying && !isMuted
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                    : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {isPlaying && !isMuted ? 'LIVE SYNTH' : 'STANDBY'}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-0.5">
                <h4 className="text-base sm:text-lg font-mono font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                  {currentPresetObj.name}
                </h4>
                <span className="text-sm text-zinc-400 hidden sm:inline">·</span>
                <span className="text-sm text-zinc-400 truncate hidden sm:inline">
                  {currentPresetObj.tagline}
                </span>
              </div>
            </div>
          </div>

          {/* Center: Live 18-Band Frequency Equalizer Canvas */}
          <div className="flex-1 w-full md:w-auto flex flex-col items-center max-w-xs sm:max-w-sm md:max-w-md">
            <div className="w-full flex items-center justify-between text-sm font-mono text-zinc-400 mb-1.5 px-0.5">
              <span className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                <span>EQUALIZER</span>
              </span>
              <span className="text-zinc-400 font-mono">
                {currentPresetObj.frequencyRange}
              </span>
            </div>
            <canvas
              ref={canvasRef}
              width={260}
              height={36}
              className="w-full h-9 bg-zinc-900/90 rounded-lg border border-zinc-800 shadow-inner"
            />
          </div>

          {/* Right: Quick Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto justify-between md:justify-end shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-800/80">
            {/* Play/Pause Button */}
            <button
              onClick={handleTogglePlay}
              className={`min-h-[44px] px-4 py-2 rounded-xl font-mono text-base font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 ${
                isPlaying && !isMuted
                  ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-zinc-950 shadow-[0_0_15px_rgba(34,211,238,0.3)]'
              }`}
              title={isPlaying && !isMuted ? 'Pause soundscape' : 'Engage soundscape'}
            >
              {isPlaying && !isMuted ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>PAUSE</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>START</span>
                </>
              )}
            </button>

            {/* Open Preset Selector Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                audioEngine.playClick();
                onOpenSoundscapeModal();
              }}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 hover:text-white font-mono text-base font-semibold flex items-center gap-2 transition-all"
              title="Change soundscape preset and adjust parameters"
            >
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">CHANGE</span>
              <span>PRESET</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
