import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Crown, 
  Award, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Share2, 
  CheckCircle2, 
  X, 
  ChevronRight, 
  Play, 
  RotateCw,
  TrendingUp,
  Clock
} from 'lucide-react';
import { StreakMilestone } from '../types';
import { audioEngine } from '../utils/audio';

export const STREAK_MILESTONES: StreakMilestone[] = [
  {
    days: 7,
    title: 'NEURAL FOUNDATION PRIME',
    tier: 'Tier 1 Mythic Achievement',
    badge: '7-DAY COHESION',
    quote: 'Seven suns of iron execution. The neural habit loop has hardened into muscle memory.',
    description: 'Sustained a full 7-day uninterrupted streak. Dopamine circuits synchronized and baseline habit resistance broken.',
    xpReward: 500,
    armorUnlock: 'Vanguard Alloy Plating',
    soundSignature: 'Heroic Quad-Harmonic Fanfare (432Hz)'
  },
  {
    days: 30,
    title: 'TITAN CHASSIS ASCENDANT',
    tier: 'Tier 2 Mythic Achievement',
    badge: '30-DAY CITADEL',
    quote: 'A full lunar rotation conquered. Procrastination and self-doubt shattered against your shield.',
    description: 'One full month of unshakeable persistence. Executive dysfunction overridden with supreme consistency.',
    xpReward: 1500,
    armorUnlock: 'Hyper-Conductive Kinetic Core',
    soundSignature: 'Citadel Tri-Tone Resonant Fanfare (528Hz)'
  },
  {
    days: 100,
    title: 'MONOLITH IMMORTAL',
    tier: 'Omega Mythic Achievement',
    badge: 'CENTURION OMEGA',
    quote: 'One hundred unbroken suns. You are no longer fighting the process—you ARE the protocol.',
    description: 'Triple-digit centurion milestone achieved. Legend among Titan pilots. Indomitable will verified.',
    xpReward: 5000,
    armorUnlock: 'Quantum Singularity Aura',
    soundSignature: 'Omega Deep Sub Harmonic Fanfare (60Hz / 1760Hz)'
  }
];

interface StreakMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStreak: number;
  initialMilestoneDays?: number;
  celebratedMilestones?: number[];
  onClaimMilestone: (milestone: StreakMilestone) => void;
}

export const StreakMilestoneModal: React.FC<StreakMilestoneModalProps> = ({
  isOpen,
  onClose,
  currentStreak,
  initialMilestoneDays = 7,
  celebratedMilestones = [],
  onClaimMilestone
}) => {
  const [selectedMilestoneDays, setSelectedMilestoneDays] = useState<number>(initialMilestoneDays);
  const [copiedFeedback, setCopiedFeedback] = useState(false);
  const [isAnimating, setIsAnimating] = useState(true);

  // Sync with initial milestone or closest relevant tier
  useEffect(() => {
    if (isOpen) {
      const target = initialMilestoneDays || (currentStreak >= 100 ? 100 : currentStreak >= 30 ? 30 : 7);
      setSelectedMilestoneDays(target);
      setIsAnimating(true);
      // Play celebratory sound on modal appearance
      audioEngine.playStreakMilestoneFanfare(target);
    }
  }, [isOpen, initialMilestoneDays, currentStreak]);

  if (!isOpen) return null;

  const currentMilestone = STREAK_MILESTONES.find((m) => m.days === selectedMilestoneDays) || STREAK_MILESTONES[0];
  const isUnlocked = currentStreak >= currentMilestone.days;
  const isAlreadyClaimed = celebratedMilestones.includes(currentMilestone.days);

  const handleSelectTier = (days: number) => {
    setSelectedMilestoneDays(days);
    setIsAnimating(false);
    setTimeout(() => {
      setIsAnimating(true);
      audioEngine.playStreakMilestoneFanfare(days);
    }, 50);
  };

  const handleClaim = () => {
    audioEngine.playOvercharge();
    onClaimMilestone(currentMilestone);
    onClose();
  };

  const handleShare = () => {
    audioEngine.playClick();
    const text = `🏆 TITAN CORE // MYTHIC ACHIEVEMENT UNLOCKED: [${currentMilestone.badge} · ${currentMilestone.title}]\n"${currentMilestone.quote}"\n+${currentMilestone.xpReward} XP Awarded · Unlocked: ${currentMilestone.armorUnlock}`;
    navigator.clipboard.writeText(text);
    setCopiedFeedback(true);
    setTimeout(() => setCopiedFeedback(false), 2000);
  };

  // Tier theme colors
  const getTierTheme = (days: number) => {
    switch (days) {
      case 100:
        return {
          glow: 'from-purple-500/30 via-pink-500/20 to-amber-500/30',
          border: 'border-purple-400/80 shadow-[0_0_40px_rgba(168,85,247,0.35)]',
          badge: 'bg-purple-500/20 text-purple-200 border-purple-400',
          text: 'text-purple-300',
          accent: 'from-purple-400 to-pink-400',
          ring: 'ring-purple-500/40'
        };
      case 30:
        return {
          glow: 'from-amber-500/30 via-yellow-500/20 to-cyan-500/20',
          border: 'border-amber-400/80 shadow-[0_0_40px_rgba(245,158,11,0.35)]',
          badge: 'bg-amber-500/20 text-amber-200 border-amber-400',
          text: 'text-amber-300',
          accent: 'from-amber-400 to-yellow-300',
          ring: 'ring-amber-500/40'
        };
      default: // 7 days
        return {
          glow: 'from-cyan-500/30 via-emerald-500/20 to-blue-500/20',
          border: 'border-cyan-400/80 shadow-[0_0_40px_rgba(34,211,238,0.35)]',
          badge: 'bg-cyan-500/20 text-cyan-200 border-cyan-400',
          text: 'text-cyan-300',
          accent: 'from-cyan-400 to-emerald-400',
          ring: 'ring-cyan-500/40'
        };
    }
  };

  const theme = getTierTheme(currentMilestone.days);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          audioEngine.playClick();
          onClose();
        }
      }}
    >
      <div 
        className={`relative w-full max-w-2xl bg-zinc-950 border ${theme.border} rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Celebratory Radial Ambient Glow */}
        <div 
          className={`absolute -inset-1 bg-gradient-to-br ${theme.glow} rounded-3xl blur-3xl opacity-50 pointer-events-none animate-milestone-halo`}
          aria-hidden="true" 
        />

        {/* Top Header & Close Bar */}
        <div className="relative z-10 p-5 sm:p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Crown className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Streak Milestone Achieved
                </h3>
                <span className="px-2.5 py-0.5 rounded text-sm font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  MYTHIC
                </span>
              </div>
              <p className="text-base font-mono text-zinc-400">
                Persistence telemetry verification & reward claim
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              audioEngine.playClick();
              onClose();
            }}
            className="p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Close milestone modal (ESC)"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Milestone Tier Navigation Tabs */}
        <div className="relative z-10 px-6 pt-4 pb-1 flex items-center gap-2 bg-zinc-900/60 border-b border-zinc-800/80 overflow-x-auto">
          {STREAK_MILESTONES.map((m) => {
            const isTabSelected = m.days === selectedMilestoneDays;
            const isTierCompleted = currentStreak >= m.days;

            return (
              <button
                key={m.days}
                onClick={() => handleSelectTier(m.days)}
                className={`min-h-[44px] px-4 py-2 rounded-xl text-base font-mono font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isTabSelected
                    ? 'bg-zinc-800 text-white border border-zinc-700 shadow-md ring-1 ring-cyan-500/30'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                }`}
              >
                <span>{m.days} DAYS</span>
                {isTierCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <span className="text-sm text-zinc-500 font-normal">({currentStreak}/{m.days})</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Scrollable Celebration Content Container */}
        <div className="relative z-10 overflow-y-auto p-6 sm:p-8 space-y-6 flex-1">
          
          {/* Animated Trophy Crest & Visual Emblem */}
          <div className="text-center relative py-2">
            {/* Halo Rings */}
            <div className="relative inline-block">
              <div 
                className={`w-32 h-32 sm:w-36 sm:h-36 mx-auto rounded-3xl bg-gradient-to-br ${theme.glow} border-2 ${theme.border} flex flex-col items-center justify-center relative shadow-2xl animate-trophy-float`}
              >
                <div className="relative flex items-center justify-center">
                  <Flame className="w-16 h-16 sm:w-20 sm:h-20 text-amber-400 animate-pulse drop-shadow-[0_0_15px_rgba(245,158,11,0.6)]" />
                  <Crown className="w-8 h-8 text-yellow-200 absolute -top-4 sm:-top-5 drop-shadow-md" />
                </div>
                <div className="mt-1 font-mono font-black text-2xl sm:text-3xl text-white tracking-wider">
                  {currentMilestone.days}d
                </div>
              </div>

              {/* Sparkle Badges Floating */}
              <div className="absolute -top-2 -right-2 p-2 rounded-full bg-amber-400/20 border border-amber-300 text-amber-300 shadow-lg animate-bounce">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>

            {/* Title & Badge */}
            <div className="mt-4 space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg border font-mono text-base font-bold tracking-wider uppercase mb-1 shadow-sm bg-zinc-900/90 text-amber-300 border-amber-400/50">
                <Award className="w-4 h-4 text-amber-400" />
                <span>{currentMilestone.badge}</span>
                <span>·</span>
                <span>{currentMilestone.tier}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {currentMilestone.title}
              </h2>
            </div>

            {/* Affirmation Quote */}
            <blockquote className="mt-3 text-lg sm:text-xl font-bold italic text-zinc-200 max-w-lg mx-auto leading-relaxed">
              “{currentMilestone.quote}”
            </blockquote>
            <p className="mt-2 text-base text-zinc-400 max-w-md mx-auto leading-relaxed">
              {currentMilestone.description}
            </p>
          </div>

          {/* Rewards & Unlocks Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* XP Awarded Card */}
            <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center gap-3.5 shadow-inner">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shrink-0">
                <Zap className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="text-sm font-mono text-zinc-400 font-bold uppercase">
                  XP ACQUIRED
                </div>
                <div className="text-2xl font-black font-mono text-emerald-400">
                  +{currentMilestone.xpReward} XP
                </div>
                <div className="text-sm font-mono text-zinc-400">
                  Credited to Chassis Level
                </div>
              </div>
            </div>

            {/* Armor Plating / Title Card */}
            <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center gap-3.5 shadow-inner">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-400 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-mono text-zinc-400 font-bold uppercase truncate">
                  CHASSIS TITLE UNLOCK
                </div>
                <div className="text-lg font-bold font-mono text-cyan-300 truncate">
                  {currentMilestone.armorUnlock}
                </div>
                <div className="text-sm font-mono text-zinc-400 truncate">
                  Permanent Profile Trait
                </div>
              </div>
            </div>
          </div>

          {/* Current Progress & Verification Notice */}
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Clock className="w-5 h-5 text-zinc-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-base font-mono text-zinc-200 font-bold truncate">
                  Current Pilot Streak: <strong className="text-amber-400">{currentStreak} Days</strong>
                </div>
                <div className="text-sm text-zinc-400 font-mono">
                  {isUnlocked 
                    ? 'Milestone condition met. Ready for tactical logging.' 
                    : `Requires ${currentMilestone.days - currentStreak} more consecutive active daily logs.`}
                </div>
              </div>
            </div>

            <button
              onClick={() => audioEngine.playStreakMilestoneFanfare(currentMilestone.days)}
              className="min-h-[44px] px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white text-sm font-mono font-bold flex items-center gap-1.5 shrink-0 transition-colors"
              title="Replay celebratory audio fanfare"
            >
              <RotateCw className="w-4 h-4 text-cyan-400" />
              <span>REPLAY SFX</span>
            </button>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="relative z-10 p-5 sm:p-6 border-t border-zinc-800 bg-zinc-950 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            onClick={handleShare}
            className="min-h-[44px] w-full sm:w-auto px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-base font-mono font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Share2 className="w-5 h-5 text-zinc-400" />
            <span>{copiedFeedback ? 'COPIED TO CLIPBOARD!' : 'SHARE BRAG CARD'}</span>
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => {
                audioEngine.playClick();
                onClose();
              }}
              className="min-h-[44px] flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white text-base font-mono font-bold transition-colors"
            >
              DISMISS
            </button>

            <button
              onClick={handleClaim}
              className={`min-h-[44px] flex-1 sm:flex-initial px-6 py-2.5 rounded-xl text-base font-mono font-bold flex items-center justify-center gap-2.5 transition-all shadow-lg active:scale-95 ${
                isAlreadyClaimed
                  ? 'bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                  : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-zinc-950 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
              }`}
            >
              <Award className="w-5 h-5" />
              <span>
                {isAlreadyClaimed ? 'CLAIMED · LOG TO COMBAT' : `CLAIM +${currentMilestone.xpReward} XP`}
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
