import React, { useState } from 'react';
import { 
  Sparkles, 
  RotateCw, 
  Bookmark, 
  BookmarkCheck, 
  Cpu, 
  Share2, 
  Compass, 
  ShieldCheck,
  Zap,
  Snowflake,
  Link2,
  ArrowRight,
  Layers,
  HelpCircle,
  X
} from 'lucide-react';
import { Perk } from '../types';
import { audioEngine } from '../utils/audio';

interface MythicPerkDeckProps {
  currentPerk: Perk;
  allPerks: Perk[];
  vaultPerks: Perk[];
  onRerollPerk: () => void;
  onToggleVaultPerk: (perk: Perk) => void;
  onSelectSpecificPerk: (perk: Perk) => void;
}

export const MythicPerkDeck: React.FC<MythicPerkDeckProps> = ({
  currentPerk,
  allPerks,
  vaultPerks,
  onRerollPerk,
  onToggleVaultPerk,
  onSelectSpecificPerk
}) => {
  const [isFlipping, setIsFlipping] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [isSynergyMatrixOpen, setIsSynergyMatrixOpen] = useState(false);
  const [highlightedSynergyTag, setHighlightedSynergyTag] = useState<string | null>(null);

  const isSaved = vaultPerks.some((p) => p.id === currentPerk.id);

  // Synergy partners sharing the same synergy tag
  const activeSynergyTag = currentPerk.synergyTag;
  const synergyPartners = allPerks.filter(
    (p) => p.id !== currentPerk.id && p.synergyTag && p.synergyTag === activeSynergyTag
  );

  const handleReroll = () => {
    if (isFlipping) return;
    audioEngine.playCardFlip();
    setIsFlipping(true);
    setTimeout(() => {
      onRerollPerk();
      setTimeout(() => {
        setIsFlipping(false);
      }, 250);
    }, 250);
  };

  const handleShareAffirmation = () => {
    audioEngine.playClick();
    const synergyInfo = currentPerk.synergyTag ? ` · Synergy: [${currentPerk.synergyTag}]` : '';
    const text = `TITAN CORE // PERK DROP [${currentPerk.rarity}]: "${currentPerk.affirmation}" · ${currentPerk.statBonus}${synergyInfo}`;
    navigator.clipboard.writeText(text);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const filteredPool = activeCategory === 'All' 
    ? allPerks 
    : activeCategory === 'Synergies'
    ? allPerks.filter((p) => Boolean(p.synergyTag))
    : allPerks.filter((p) => p.category === activeCategory);

  const getRarityStyles = (perk: Perk) => {
    if (perk.isStreakFreeze || perk.id === 'perk_streak_freeze') {
      return {
        badge: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/60 shadow-[0_0_15px_rgba(56,189,248,0.35)]',
        glow: 'from-cyan-400/35 via-blue-500/20 to-transparent',
        border: 'border-cyan-400/70 hover:border-cyan-300 shadow-[0_0_25px_rgba(56,189,248,0.25)]',
        accent: 'text-cyan-300'
      };
    }
    switch (perk.rarity) {
      case 'Mythic':
        return {
          badge: 'bg-amber-500/10 text-amber-300 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]',
          glow: 'from-amber-500/20 via-cyan-500/10 to-transparent',
          border: 'border-amber-500/40 hover:border-amber-400',
          accent: 'text-amber-400'
        };
      case 'Exotic':
        return {
          badge: 'bg-purple-500/10 text-purple-300 border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.2)]',
          glow: 'from-purple-500/20 via-pink-500/10 to-transparent',
          border: 'border-purple-500/40 hover:border-purple-400',
          accent: 'text-purple-400'
        };
      default: // Legendary
        return {
          badge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/40 shadow-[0_0_12px_rgba(34,211,238,0.2)]',
          glow: 'from-cyan-500/20 via-emerald-500/10 to-transparent',
          border: 'border-cyan-500/40 hover:border-cyan-400',
          accent: 'text-cyan-400'
        };
    }
  };

  const rarityTheme = getRarityStyles(currentPerk);

  // Group all perks by synergy tag for the matrix preview
  const synergyGroups = allPerks.reduce((acc, p) => {
    if (!p.synergyTag) return acc;
    if (!acc[p.synergyTag]) {
      acc[p.synergyTag] = {
        tag: p.synergyTag,
        name: p.synergyName || p.synergyTag,
        bonus: p.synergyComboBonus || 'Synchronized Combat Buff',
        description: p.synergyDescription || '',
        perks: []
      };
    }
    acc[p.synergyTag].perks.push(p);
    return acc;
  }, {} as Record<string, { tag: string; name: string; bonus: string; description: string; perks: Perk[] }>);

  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
      {/* Decorative Cockpit Grid Underlay */}
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" 
        aria-hidden="true"
      />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">The Mythic Perk Deck</h2>
            <span className="text-base font-mono text-zinc-400">· DAILY DROP</span>
          </div>
          <p className="text-base sm:text-lg text-zinc-300 mt-1 leading-relaxed">
            Empowering neural mindset dropped every rotation. Pair perks sharing synergy tags to activate compound resonance buffs.
          </p>
        </div>

        {/* Filter categories & Synergy Matrix Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 p-1.5 bg-zinc-950/80 border border-zinc-800 rounded-xl shrink-0 overflow-x-auto">
            {['All', 'Synergies', 'Focus', 'Energy', 'Resilience', 'Squad'].map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  audioEngine.playClick();
                  setActiveCategory(cat);
                }}
                className={`min-h-[44px] px-4 py-2 text-base font-mono rounded-lg transition-colors whitespace-nowrap font-medium flex items-center gap-1.5 ${
                  activeCategory === cat
                    ? 'bg-zinc-800 text-cyan-300 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {cat === 'Synergies' && <Zap className="w-4 h-4 text-amber-400 animate-pulse" />}
                <span>{cat}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              audioEngine.playSynergyActivation();
              setIsSynergyMatrixOpen(true);
            }}
            className="min-h-[44px] px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 text-base font-mono font-bold rounded-xl flex items-center gap-2 transition-all shadow-[0_0_12px_rgba(245,158,11,0.15)]"
            title="Inspect all active perk synergy pairs in circulation"
          >
            <Link2 className="w-5 h-5 text-amber-400 animate-pulse" />
            <span>SYNERGY MATRIX</span>
          </button>
        </div>
      </div>

      {/* 3D Interactive Perk Card Display */}
      <div className="perspective-1000 max-w-3xl mx-auto my-3">
        <div
          className={`relative rounded-3xl p-6 sm:p-9 bg-zinc-950 border transition-all duration-300 transform-style-3d ${rarityTheme.border} ${
            isFlipping ? 'rotate-y-180 scale-95 opacity-50' : 'rotate-y-0 scale-100 opacity-100'
          }`}
          style={{ minHeight: '340px' }}
        >
          {/* Subtle Ambient Radial Glow */}
          <div 
            className={`absolute -inset-0.5 bg-gradient-to-br ${rarityTheme.glow} rounded-3xl blur-2xl opacity-35 pointer-events-none`}
            aria-hidden="true"
          />

          <div className="relative z-10 flex flex-col justify-between h-full space-y-5">
            {/* Card Metadata Top */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className={`text-base font-mono font-bold tracking-wider px-3 py-1 rounded-lg border flex items-center gap-1.5 ${rarityTheme.badge}`}>
                  {(currentPerk.isStreakFreeze || currentPerk.id === 'perk_streak_freeze') && (
                    <Snowflake className="w-4 h-4 text-cyan-300 animate-pulse" />
                  )}
                  {(currentPerk.isStreakFreeze || currentPerk.id === 'perk_streak_freeze') 
                    ? 'MYTHIC // CRYO-PRESERVE' 
                    : currentPerk.rarity.toUpperCase()}
                </span>
                
                {/* Synergy Tag Chip on the Card Header */}
                {currentPerk.synergyTag && (
                  <button
                    onClick={() => {
                      audioEngine.playSynergyActivation();
                      setIsSynergyMatrixOpen(true);
                    }}
                    onMouseEnter={() => setHighlightedSynergyTag(currentPerk.synergyTag || null)}
                    onMouseLeave={() => setHighlightedSynergyTag(null)}
                    className="px-3 py-1 rounded-md text-sm font-mono font-bold tracking-wide transition-all bg-amber-500/15 text-amber-300 border border-amber-500/50 hover:border-amber-400 hover:bg-amber-500/25 flex items-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
                    title="Shares this synergy tag with partner perks in circulation"
                  >
                    <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span>SYNERGY: {currentPerk.synergyTag}</span>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                    </span>
                  </button>
                )}

                <span className="text-base font-mono text-zinc-400 hidden sm:inline">
                  DROP RATE {currentPerk.dropRate}
                </span>
              </div>

              <div className="flex items-center gap-2 text-base font-mono text-zinc-300">
                <Cpu className="w-5 h-5 text-zinc-400" />
                <span className="font-semibold">{currentPerk.category}</span>
              </div>
            </div>

            {/* Perk Title & Main Mindset Affirmation */}
            <div className="space-y-3 py-1">
              <div className="text-lg font-mono font-bold tracking-wider text-cyan-400 flex items-center gap-2">
                <span>{currentPerk.title}</span>
                {currentPerk.audioSignature && (
                  <span className="text-sm font-mono text-zinc-400">
                    [{currentPerk.audioSignature}]
                  </span>
                )}
              </div>
              <blockquote className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-snug">
                “{currentPerk.affirmation}”
              </blockquote>
              <p className="text-base sm:text-lg text-zinc-300 leading-relaxed max-w-2xl">
                {currentPerk.subtext}
              </p>
            </div>

            {/* ============================================================ */}
            {/* VISUAL SYNERGY LINK ENGINE (ANIMATED COMBINATION LINK ON CARD) */}
            {/* ============================================================ */}
            {currentPerk.synergyTag && synergyPartners.length > 0 && (
              <div className="relative rounded-2xl p-4 bg-zinc-900/90 border border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.18)] overflow-hidden">
                {/* Background Particle Stream Shimmer */}
                <div 
                  className="absolute inset-0 pointer-events-none opacity-20 bg-gradient-to-r from-transparent via-amber-400/40 to-transparent animate-particle-flow" 
                  aria-hidden="true" 
                />

                {/* Synergy Link Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link2 className="w-5 h-5 text-amber-400 animate-pulse" />
                    <span className="text-sm sm:text-base font-mono font-bold text-amber-300 tracking-wider">
                      SYNERGY LINK ACTIVE
                    </span>
                    <span className="px-3 py-1 text-sm font-semibold rounded-md bg-amber-500/20 text-amber-200 border border-amber-500/40">
                      {currentPerk.synergyName || currentPerk.synergyTag}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-mono">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
                    </span>
                    <span className="text-emerald-400 font-bold">2/2 RESONANCE PAIRED</span>
                  </div>
                </div>

                {/* Animated Visual Connection Node Matrix */}
                <div className="relative flex flex-col md:flex-row items-center justify-between gap-3">
                  {/* Node 1: Equipped Perk Card Node */}
                  <div className="w-full md:flex-1 p-3.5 rounded-xl bg-zinc-950 border border-cyan-500/50 shadow-inner flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center shrink-0">
                      <Zap className="w-5 h-5 text-cyan-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-base font-mono text-cyan-300 font-bold truncate">
                        {currentPerk.title}
                      </div>
                      <div className="text-sm text-zinc-400 font-mono flex items-center gap-1.5">
                        <span className="text-cyan-400 font-bold">[EQUIPPED]</span>
                        <span>·</span>
                        <span>{currentPerk.category}</span>
                      </div>
                    </div>
                  </div>

                  {/* Animated Energy Conduit (SVG Laser Beam Visual Link) */}
                  <div className="relative flex flex-col items-center justify-center shrink-0 w-full md:w-32 py-1 md:py-0">
                    <div className="w-full flex items-center justify-center">
                      <svg className="w-full h-9 overflow-visible" viewBox="0 0 100 24" fill="none">
                        {/* Static Low-Pass Conduit Beam */}
                        <line
                          x1="4"
                          y1="12"
                          x2="96"
                          y2="12"
                          stroke="#f59e0b"
                          strokeWidth="4"
                          strokeOpacity="0.25"
                          strokeLinecap="round"
                        />
                        {/* Animated Laser Dash Conduit Flow */}
                        <line
                          x1="4"
                          y1="12"
                          x2="96"
                          y2="12"
                          stroke="url(#synergyLaserGrad)"
                          strokeWidth="3"
                          strokeDasharray="10 6"
                          strokeLinecap="round"
                          className="animate-laser-flow"
                        />
                        {/* Pulsing Central Synchronization Node */}
                        <circle cx="50" cy="12" r="7" fill="#f59e0b" className="animate-ping opacity-60" />
                        <circle cx="50" cy="12" r="4.5" fill="#fef08a" />
                        <defs>
                          <linearGradient id="synergyLaserGrad" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#22d3ee" />
                            <stop offset="50%" stopColor="#f59e0b" />
                            <stop offset="100%" stopColor="#a855f7" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                    <span className="text-sm font-mono font-bold text-amber-400 tracking-wider uppercase text-center mt-0.5">
                      SYNAPSE LINK
                    </span>
                  </div>

                  {/* Node 2: Synergy Partner Card Node (Interactive Switcher) */}
                  {synergyPartners.slice(0, 1).map((partner) => (
                    <button
                      key={partner.id}
                      onClick={() => {
                        audioEngine.playSynergyActivation();
                        onSelectSpecificPerk(partner);
                      }}
                      className="w-full md:flex-1 min-h-[44px] p-3.5 rounded-xl bg-zinc-950 border border-amber-500/60 hover:border-amber-400 transition-all text-left flex items-center justify-between gap-3 shadow-[0_0_15px_rgba(245,158,11,0.2)] group cursor-pointer"
                      title={`Click to equip synergy partner: ${partner.title}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-400/50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                          <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-base font-mono text-amber-300 font-bold truncate group-hover:text-amber-200">
                            {partner.title}
                          </div>
                          <div className="text-sm text-zinc-400 font-mono flex items-center gap-1.5">
                            <span className="text-amber-400 font-bold">[PARTNER]</span>
                            <span>·</span>
                            <span>{partner.category}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 text-amber-400 group-hover:translate-x-1 transition-transform">
                        <span className="text-sm font-mono font-bold hidden sm:inline">EQUIP</span>
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    </button>
                  ))}
                </div>

                {/* Resonance Buff Readout Bar */}
                <div className="mt-3 pt-2.5 border-t border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm font-mono">
                  <div className="flex items-center gap-2 text-amber-300 font-bold">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>COMBO BUFF:</span>
                    <span className="text-white font-medium">{currentPerk.synergyComboBonus}</span>
                  </div>
                  <div className="text-zinc-400">
                    {currentPerk.synergyDescription}
                  </div>
                </div>
              </div>
            )}

            {/* Card Stat Bonus Bottom Bar */}
            <div className="pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2.5 font-mono text-emerald-400 font-bold text-base sm:text-lg">
                <ShieldCheck className="w-6 h-6 shrink-0 text-emerald-400" />
                <span>{currentPerk.statBonus}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 self-end sm:self-auto flex-wrap">
                <button
                  onClick={handleShareAffirmation}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-colors flex items-center gap-2 font-mono text-base font-semibold"
                  title="Copy affirmation to clipboard"
                >
                  <Share2 className="w-5 h-5" />
                  <span>{copyFeedback ? 'COPIED!' : 'SHARE'}</span>
                </button>

                <button
                  onClick={() => {
                    audioEngine.playSlotLock();
                    onToggleVaultPerk(currentPerk);
                  }}
                  className={`min-h-[44px] px-5 py-2.5 rounded-xl border font-mono text-base font-bold transition-colors flex items-center gap-2 ${
                    isSaved
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                      : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white'
                  }`}
                  title={isSaved ? 'In your Codex Vault' : 'Save to Codex Vault'}
                >
                  {isSaved ? <BookmarkCheck className="w-5 h-5 text-emerald-400" /> : <Bookmark className="w-5 h-5" />}
                  <span>{isSaved ? 'IN VAULT' : 'SAVE'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reroll & Deck Browser Bar */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 border-t border-zinc-800/80">
        <div className="text-base text-zinc-300 flex items-center gap-2.5">
          <Compass className="w-5 h-5 text-zinc-400" />
          <span>Deck Size: <strong className="text-white tabular-nums font-bold">{filteredPool.length}</strong> perks in circulation</span>
          {activeCategory !== 'All' && (
            <span className="text-sm font-mono text-cyan-400 font-bold">
              [FILTER: {activeCategory.toUpperCase()}]
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReroll}
            disabled={isFlipping}
            className="min-h-[44px] py-2.5 px-6 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/80 text-white text-base font-mono font-bold flex items-center gap-2.5 transition-all active:scale-95 shadow-md"
          >
            <RotateCw className={`w-5 h-5 text-cyan-400 ${isFlipping ? 'animate-spin' : ''}`} />
            <span>REROLL PERK</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MINI PERK ROSTER / QUICK-EQUIP ROW WITH SYNERGY HIGHLIGHTING */}
      {/* ============================================================ */}
      <div className="mt-6 pt-3">
        <div className="flex items-center justify-between mb-3">
          <span className="text-base font-mono font-bold text-zinc-300 flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <span>TACTICAL ROSTER POOL</span>
          </span>
          <span className="text-sm font-mono text-zinc-400">
            Click any card to equip · Synergy partners glow in amber
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredPool.slice(0, 4).map((perk) => {
            const isEquipped = perk.id === currentPerk.id;
            const isSynergyMatch = !isEquipped && Boolean(
              perk.synergyTag && currentPerk.synergyTag && perk.synergyTag === currentPerk.synergyTag
            );
            const isHoveredSynergy = highlightedSynergyTag && perk.synergyTag === highlightedSynergyTag;

            return (
              <div key={perk.id} className="relative">
                {/* Floating Synergy Link Indicator if this card shares synergy with active perk */}
                {isSynergyMatch && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 px-3 py-0.5 rounded-full bg-amber-500 text-zinc-950 text-sm font-mono font-bold shadow-[0_0_15px_rgba(245,158,11,0.6)] animate-bounce">
                    <Zap className="w-3.5 h-3.5 fill-zinc-950" />
                    <span>SYNERGY LINKED</span>
                  </div>
                )}

                <button
                  onClick={() => {
                    if (isSynergyMatch) {
                      audioEngine.playSynergyActivation();
                    } else {
                      audioEngine.playCardFlip();
                    }
                    onSelectSpecificPerk(perk);
                  }}
                  onMouseEnter={() => setHighlightedSynergyTag(perk.synergyTag || null)}
                  onMouseLeave={() => setHighlightedSynergyTag(null)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all relative overflow-hidden group ${
                    isEquipped
                      ? 'bg-zinc-800/95 border-cyan-500/70 text-cyan-300 ring-2 ring-cyan-500/40 shadow-[0_0_20px_rgba(34,211,238,0.2)]'
                      : isSynergyMatch || isHoveredSynergy
                      ? 'bg-amber-950/25 border-amber-500/80 text-amber-200 ring-2 ring-amber-400/50 animate-synergy-highlight shadow-[0_0_25px_rgba(245,158,11,0.25)]'
                      : 'bg-zinc-950/70 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  {/* Subtle animated border trace for synergy match */}
                  {isSynergyMatch && (
                    <div 
                      className="absolute inset-0 pointer-events-none opacity-20 bg-gradient-to-r from-amber-500/0 via-amber-400/40 to-amber-500/0 animate-particle-flow" 
                      aria-hidden="true" 
                    />
                  )}

                  <div className="text-base font-mono flex items-center justify-between">
                    <span className="text-zinc-400">{perk.category}</span>
                    <span className="text-amber-400 font-bold">{perk.rarity}</span>
                  </div>

                  <div className="text-lg font-bold text-zinc-100 truncate mt-1 flex items-center gap-1.5">
                    {(perk.isStreakFreeze || perk.id === 'perk_streak_freeze') && (
                      <Snowflake className="w-4 h-4 text-cyan-400 shrink-0" />
                    )}
                    <span className="truncate group-hover:text-cyan-300 transition-colors">
                      {perk.title}
                    </span>
                  </div>

                  {/* Card synergy tag pill & status */}
                  <div className="mt-2.5 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-sm font-mono">
                    {perk.synergyTag ? (
                      <span className={`px-2 py-0.5 rounded text-sm font-semibold flex items-center gap-1 ${
                        isSynergyMatch 
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50' 
                          : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>{perk.synergyTag}</span>
                      </span>
                    ) : (
                      <span className="text-zinc-400">Solo Protocol</span>
                    )}

                    {isEquipped ? (
                      <span className="text-cyan-400 font-bold">EQUIPPED</span>
                    ) : isSynergyMatch ? (
                      <span className="text-amber-300 font-bold flex items-center gap-1">
                        <Link2 className="w-3.5 h-3.5" />
                        <span>PAIR</span>
                      </span>
                    ) : (
                      <span className="text-zinc-400 group-hover:text-zinc-200">SELECT</span>
                    )}
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* SYNERGY MATRIX MODAL: DETAILED BREAKDOWN OF ALL 4 COMBOS */}
      {/* ============================================================ */}
      {isSynergyMatrixOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsSynergyMatrixOpen(false)}
        >
          <div 
            className="bg-zinc-900 border border-amber-500/40 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-5 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Link2 className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Perk Synergy Combinations Matrix
                  </h3>
                  <p className="text-base text-zinc-300 font-mono mt-0.5">
                    Pairing matching perks activates synchronized mindset amplification
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSynergyMatrixOpen(false)}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                title="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Synergy List */}
            <div className="mt-6 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {Object.values(synergyGroups).map((group) => {
                const isActiveCombo = currentPerk.synergyTag === group.tag;
                return (
                  <div
                    key={group.tag}
                    className={`p-5 rounded-2xl border transition-all ${
                      isActiveCombo
                        ? 'bg-amber-950/20 border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                        : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-amber-400" />
                        <span className="text-base sm:text-lg font-bold text-white">
                          {group.name}
                        </span>
                        <span className="px-2.5 py-0.5 rounded text-sm font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          {group.tag}
                        </span>
                      </div>
                      {isActiveCombo && (
                        <span className="px-3 py-1 rounded-md text-sm font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                          <span>CURRENTLY EQUIPPED</span>
                        </span>
                      )}
                    </div>

                    <p className="text-base text-zinc-300 leading-relaxed mb-3">
                      {group.description}
                    </p>

                    <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-sm font-mono mb-3">
                      <span className="text-amber-400 font-bold">RESONANCE BENEFIT:</span>
                      <span className="text-white font-medium">{group.bonus}</span>
                    </div>

                    {/* Member perks buttons */}
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      <span className="text-sm font-mono text-zinc-400 mr-1">LINKED PERKS:</span>
                      {group.perks.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            audioEngine.playSynergyActivation();
                            onSelectSpecificPerk(p);
                            setIsSynergyMatrixOpen(false);
                          }}
                          className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-mono font-bold border transition-all flex items-center gap-2 ${
                            p.id === currentPerk.id
                              ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
                              : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:border-amber-400 hover:text-white'
                          }`}
                        >
                          <Sparkles className="w-4 h-4 text-cyan-400" />
                          <span>{p.title}</span>
                          {p.id === currentPerk.id && <span className="text-cyan-300">[ACTIVE]</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer close */}
            <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-end">
              <button
                onClick={() => setIsSynergyMatrixOpen(false)}
                className="min-h-[44px] px-6 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-base font-bold transition-colors"
              >
                CLOSE MATRIX
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
