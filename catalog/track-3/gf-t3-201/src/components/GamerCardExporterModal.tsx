import React, { useState, useEffect } from 'react';
import { X, Download, Share2, Check, Sparkles, Smartphone, ArrowLeft } from 'lucide-react';
import { PlayerStats, Perk, LoadoutSlotData } from '../types';
import { audioEngine } from '../utils/audio';

interface GamerCardExporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: PlayerStats;
  perk: Perk;
  slots: LoadoutSlotData[];
}

type WallpaperSkin = 'cyber-cyan' | 'emerald-overdrive' | 'solar-mythic' | 'obsidian-void';

export const GamerCardExporterModal: React.FC<GamerCardExporterModalProps> = ({
  isOpen,
  onClose,
  stats,
  perk,
  slots
}) => {
  const [skin, setSkin] = useState<WallpaperSkin>('cyber-cyan');
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);

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

  if (!isOpen) return null;

  const getSkinDetails = () => {
    switch (skin) {
      case 'emerald-overdrive':
        return {
          bgGradient: 'from-emerald-950 via-zinc-950 to-black',
          accentColor: '#34d399',
          accentText: 'text-emerald-400',
          accentBorder: 'border-emerald-500/40',
          name: 'Emerald Overdrive'
        };
      case 'solar-mythic':
        return {
          bgGradient: 'from-amber-950 via-zinc-950 to-black',
          accentColor: '#fbbf24',
          accentText: 'text-amber-400',
          accentBorder: 'border-amber-500/40',
          name: 'Solar Mythic'
        };
      case 'obsidian-void':
        return {
          bgGradient: 'from-zinc-900 via-zinc-950 to-black',
          accentColor: '#e4e4e7',
          accentText: 'text-zinc-200',
          accentBorder: 'border-zinc-700',
          name: 'Obsidian Void'
        };
      default:
        return {
          bgGradient: 'from-cyan-950 via-zinc-950 to-black',
          accentColor: '#22d3ee',
          accentText: 'text-cyan-400',
          accentBorder: 'border-cyan-500/40',
          name: 'Cyber Cyan'
        };
    }
  };

  const skinDetails = getSkinDetails();

  // Generate real 1080x1920 high-res wallpaper image on canvas
  const handleDownloadWallpaper = () => {
    audioEngine.playSlotLock();
    setIsExporting(true);

    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      setIsExporting(false);
      return;
    }

    // 1. Background gradient
    const bg = ctx.createLinearGradient(0, 0, 1080, 1920);
    if (skin === 'emerald-overdrive') {
      bg.addColorStop(0, '#064e3b');
      bg.addColorStop(0.3, '#09090b');
      bg.addColorStop(1, '#020617');
    } else if (skin === 'solar-mythic') {
      bg.addColorStop(0, '#451a03');
      bg.addColorStop(0.3, '#09090b');
      bg.addColorStop(1, '#020617');
    } else if (skin === 'obsidian-void') {
      bg.addColorStop(0, '#18181b');
      bg.addColorStop(0.3, '#09090b');
      bg.addColorStop(1, '#000000');
    } else {
      bg.addColorStop(0, '#083344');
      bg.addColorStop(0.3, '#09090b');
      bg.addColorStop(1, '#020617');
    }
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1080, 1920);

    // 2. High-tech grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 1080; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 1920);
      ctx.stroke();
    }
    for (let y = 0; y < 1920; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1080, y);
      ctx.stroke();
    }

    // 3. Top Header
    ctx.fillStyle = skinDetails.accentColor;
    ctx.font = 'bold 36px monospace';
    ctx.fillText('TITAN CORE · BUILD #201', 80, 140);

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 64px sans-serif';
    ctx.fillText('DAILY COCKPIT LOADOUT', 80, 220);

    // 4. Stats Ribbon
    ctx.fillStyle = '#18181b';
    ctx.strokeStyle = skinDetails.accentColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(80, 260, 920, 140, 24);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#a1a1aa';
    ctx.font = '500 28px monospace';
    ctx.fillText(`PLAYER LVL ${stats.level}  ·  ${stats.streak} DAYS STREAK  ·  SHIELD ${stats.shieldPercentage}%`, 110, 345);

    // 5. Mythic Perk Section
    ctx.fillStyle = '#111114';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(80, 440, 920, 480, 28);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = skinDetails.accentColor;
    ctx.font = 'bold 30px monospace';
    const synergyStr = perk.synergyTag ? ` · ⚡ ${perk.synergyTag}` : '';
    ctx.fillText(`[${perk.rarity.toUpperCase()} PERK DROP] ${perk.title}${synergyStr}`, 120, 520);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 50px sans-serif';

    // Wrap affirmation text
    const words = `"${perk.affirmation}"`.split(' ');
    let line = '';
    let y = 600;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > 840 && n > 0) {
        ctx.fillText(line, 120, y);
        line = words[n] + ' ';
        y += 65;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 120, y);

    ctx.fillStyle = skinDetails.accentColor;
    ctx.font = '28px monospace';
    ctx.fillText(`✦ BONUS: ${perk.statBonus}`, 120, 860);

    // 6. The 3 Slots Section
    const slotYStarts = [960, 1220, 1480];
    const slotTitles = ['SLOT 01 · THE BOSS WIN', 'SLOT 02 · SQUAD SUPPORT', 'SLOT 03 · POWER SURGE'];
    const slotIcons = ['🏆', '🛡️', '⚡'];

    slots.forEach((s, idx) => {
      const topY = slotYStarts[idx];
      ctx.fillStyle = '#18181b';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(80, topY, 920, 220, 24);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#a1a1aa';
      ctx.font = 'bold 26px monospace';
      ctx.fillText(`${slotIcons[idx]} ${slotTitles[idx]}`, 120, topY + 55);

      ctx.fillStyle = '#ffffff';
      ctx.font = '500 36px sans-serif';
      
      const content = s.locked && s.content ? s.content : 'Slot armed and charging...';
      const slotWords = content.split(' ');
      let slotLine = '';
      let textY = topY + 120;
      for (let n = 0; n < slotWords.length; n++) {
        const testLine = slotLine + slotWords[n] + ' ';
        if (ctx.measureText(testLine).width > 820 && n > 0) {
          ctx.fillText(slotLine, 120, textY);
          slotLine = slotWords[n] + ' ';
          textY += 45;
        } else {
          slotLine = testLine;
        }
      }
      ctx.fillText(slotLine, 120, textY);
    });

    // 7. Footer Watermark
    ctx.fillStyle = '#71717a';
    ctx.font = 'bold 24px monospace';
    ctx.fillText('TITAN CORE · ULTRA-PERFORMANCE NEURAL TELEMETRY', 80, 1830);

    // Download trigger
    setTimeout(() => {
      const link = document.createElement('a');
      link.download = `titan-core-loadout-lvl${stats.level}-${skin}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      setIsExporting(false);
    }, 200);
  };

  const handleCopyText = () => {
    audioEngine.playClick();
    const slotSummary = slots.map((s) => `• ${s.title}: "${s.content || 'Pending'}"`).join('\n');
    const text = `🎮 TITAN CORE COCKPIT REPORT (LVL ${stats.level} · Streak: ${stats.streak}d)\n\n✨ Active Perk: "${perk.affirmation}" [${perk.rarity}]\n\n🎯 3-Slot Daily Loadout:\n${slotSummary}\n\n🛡️ Core Shield: ${stats.shieldPercentage}%`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
      <div className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Sticky Top Close Header */}
        <div className="sticky top-0 z-20 bg-zinc-900/95 backdrop-blur border-b border-zinc-800 p-4 sm:p-5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">9:16 Gamer Card Wallpaper Exporter</h3>
              <span className="text-base font-mono text-zinc-400">LOCKSCREEN RENDERER</span>
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
          
          {/* Skin Selector */}
          <div className="flex flex-wrap items-center gap-2.5 p-2.5 bg-zinc-900/80 border border-zinc-800 rounded-2xl">
            <span className="text-base font-mono text-zinc-400 px-3 font-semibold">CHASSIS SKIN:</span>
            {[
              { id: 'cyber-cyan', name: 'Cyber Cyan' },
              { id: 'emerald-overdrive', name: 'Emerald Overdrive' },
              { id: 'solar-mythic', name: 'Solar Mythic' },
              { id: 'obsidian-void', name: 'Obsidian Void' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  audioEngine.playClick();
                  setSkin(item.id as WallpaperSkin);
                }}
                className={`py-2 px-4 text-base font-bold rounded-xl transition-all ${
                  skin === item.id
                    ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>

          {/* Center Preview & Controls Split */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-7 items-center">
            
            {/* 9:16 Mobile Phone Frame Mockup */}
            <div className="md:col-span-5 flex justify-center">
              <div 
                className={`w-72 aspect-[9/16] rounded-[2.5rem] p-4 border-4 border-zinc-800 bg-gradient-to-b ${skinDetails.bgGradient} shadow-2xl relative overflow-hidden flex flex-col justify-between`}
              >
                {/* Dynamic Island / Camera Notch */}
                <div className="w-24 h-4 bg-zinc-900 rounded-full mx-auto mb-3 shrink-0 border border-zinc-800" />

                {/* Wallpaper Content Preview */}
                <div className="flex-1 flex flex-col justify-between py-1 space-y-3 overflow-hidden">
                  {/* Header */}
                  <div>
                    <div className="text-base font-mono font-bold text-zinc-400">TITAN CORE #201</div>
                    <div className="text-lg font-black text-white leading-tight">DAILY LOADOUT</div>
                    <div className="flex items-center gap-2 mt-1 text-base font-mono text-zinc-300">
                      <span className="text-cyan-400 font-bold">LVL {stats.level}</span>
                      <span>·</span>
                      <span className="text-amber-400 font-bold">{stats.streak}d HOT</span>
                    </div>
                  </div>

                  {/* Mythic Perk Card */}
                  <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800">
                    <div className={`text-base font-mono font-bold ${skinDetails.accentText}`}>
                      [{perk.rarity}] {perk.title}
                    </div>
                    <div className="text-base font-bold text-white leading-tight mt-1.5">
                      “{perk.affirmation}”
                    </div>
                    <div className="text-base text-emerald-400 font-mono mt-1 font-semibold">
                      {perk.statBonus}
                    </div>
                  </div>

                  {/* 3 Slots */}
                  <div className="space-y-2">
                    {slots.map((s) => (
                      <div key={s.id} className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                        <div className="text-base font-mono text-zinc-400 font-bold uppercase">
                          {s.title}
                        </div>
                        <div className="text-base text-zinc-200 line-clamp-1 font-medium mt-0.5">
                          {s.locked ? s.content : 'Armed and ready'}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer status */}
                  <div className="pt-2 border-t border-zinc-800 text-base font-mono text-zinc-400 flex items-center justify-between">
                    <span>SHIELD {stats.shieldPercentage}%</span>
                    <span className="text-cyan-400 font-bold">TITAN PRIME</span>
                  </div>
                </div>

                {/* Home Indicator Bar */}
                <div className="w-28 h-1 bg-zinc-600 rounded-full mx-auto mt-3 shrink-0" />
              </div>
            </div>

            {/* Controls & Details */}
            <div className="md:col-span-7 space-y-5">
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 space-y-4">
                <h4 className="text-lg font-bold text-white flex items-center gap-2.5">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                  <span>Ultra-Res 1080x1920 Wallpaper Generator</span>
                </h4>
                <p className="text-base sm:text-lg text-zinc-300 leading-relaxed">
                  Renders a native 1080x1920 PNG designed specifically for phone lockscreens. When you glance at your device, your affirmations and locked victories are front and center, blocking doomscrolling impulses with tangible pride.
                </p>

                <div className="pt-2 grid grid-cols-2 gap-3 text-base font-mono text-zinc-300">
                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                    <span className="text-zinc-400 font-bold">RESOLUTION:</span> 1080x1920
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                    <span className="text-zinc-400 font-bold">FORMAT:</span> Lossless PNG
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <button
                  onClick={handleDownloadWallpaper}
                  disabled={isExporting}
                  className="w-full sm:flex-1 py-4 px-6 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-base flex items-center justify-center gap-2.5 transition-all shadow-[0_0_20px_rgba(34,211,238,0.25)] active:scale-95"
                >
                  <Download className="w-5 h-5" />
                  <span>{isExporting ? 'RENDERING CANVAS...' : 'DOWNLOAD 9:16 WALLPAPER'}</span>
                </button>

                <button
                  onClick={handleCopyText}
                  className="w-full sm:w-auto py-4 px-5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-mono text-base font-bold flex items-center justify-center gap-2.5 transition-colors"
                >
                  {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Share2 className="w-5 h-5" />}
                  <span>{copied ? 'COPIED TO CLIPBOARD' : 'COPY LOADOUT TEXT'}</span>
                </button>
              </div>
            </div>

          </div>

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
