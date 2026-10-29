import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Shield, Sparkles, Trophy, Activity, Smartphone, Check, ArrowLeft } from 'lucide-react';
import { audioEngine } from '../utils/audio';

interface TutorialOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const TUTORIAL_STEPS = [
  {
    title: 'WELCOME TO TITAN CORE',
    tag: 'TACTICAL BRIEFING',
    icon: <Shield className="w-8 h-8 text-cyan-400" />,
    heading: 'A High-Performance Cockpit for Gamer Minds',
    description: 'Gamers with ADHD often battle brain lag, attention leakage, and motivation crashes. Titan Core transforms daily gratitude and mindset into an authentic RPG loadout system to anchor your daily momentum.',
    callout: 'Rule #1: Small victories build the momentum needed to clutch big encounters.'
  },
  {
    title: 'THE HUD TELEMETRY BAR',
    tag: 'SYSTEM 01',
    icon: <Sparkles className="w-8 h-8 text-amber-400" />,
    heading: 'Streak Flame & Core Shield Overcharge',
    description: 'Your Core Shield starts empty each day. As you register your 3 daily loadout slots, the shield charges from 0% to 100%. Keep your daily streak flame lit to level up your chassis.',
    callout: 'Pro-tip: Toggle the 55Hz "Focus Drone" ambient synthesizer in the header to soothe brain static.'
  },
  {
    title: 'THE MYTHIC PERK DECK',
    tag: 'SYSTEM 02',
    icon: <Trophy className="w-8 h-8 text-purple-400" />,
    heading: 'High-Tier Mindset Affirmations',
    description: 'Every rotation, draw a collectible affirmation card with Mythic or Legendary rarity. These are hardcoded mental anchors ("I control my focus. My energy does not leak.") designed for gaming resilience.',
    callout: 'Hit "Reroll Perk" if you need a different mindset boost for your current mission.'
  },
  {
    title: 'THE 3-SLOT LOADOUT',
    tag: 'SYSTEM 03',
    icon: <Activity className="w-8 h-8 text-emerald-400" />,
    heading: 'Boss Win, Squad Support & Power Surge',
    description: 'Three targeted slots to lock in daily gratitude: 1) What was your victory? 2) Who had your back? 3) What gave you pure energy? Use the 1-tap rapid hints when typing feels exhausting.',
    callout: 'Each sealed slot rewards +150 XP and instantly charges 33% of your Core Shield.'
  },
  {
    title: 'REACTOR RECHARGE & 9:16 EXPORT',
    tag: 'SYSTEM 04',
    icon: <Smartphone className="w-8 h-8 text-cyan-400" />,
    heading: 'Calibrate & Lock Screen Export',
    description: 'When feeling tilted or overwhelmed, fire up the 60-Second Reactor Core breathing tool. When your loadout is locked, export an ultra-sharp 9:16 mobile wallpaper to keep your head in the game.',
    callout: 'You are now ready to engage. Lock in your loadout and claim the day.'
  }
];

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

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

  const step = TUTORIAL_STEPS[currentStep];

  const handleNext = () => {
    audioEngine.playClick();
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      audioEngine.playSlotLock();
      onClose();
    }
  };

  const handlePrev = () => {
    audioEngine.playClick();
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          audioEngine.playClick();
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
    >
      <div className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Sticky Top Close Header */}
        <div className="sticky top-0 z-20 bg-zinc-900/95 backdrop-blur border-b border-zinc-800 p-4 sm:p-5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">Cockpit Field Manual</h3>
              <span className="text-base font-mono text-zinc-400">TACTICAL ONBOARDING BRIEF</span>
            </div>
          </div>

          <button
            onClick={() => {
              audioEngine.playClick();
              onClose();
            }}
            className="py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-mono text-base font-bold flex items-center gap-2 transition-all hover:border-cyan-400 shadow-md"
            title="Close manual (Escape)"
          >
            <X className="w-5 h-5 text-cyan-400" />
            <span>✕ CLOSE (ESC)</span>
          </button>
        </div>

        {/* Scrollable Modal Content Container */}
        <div className="overflow-y-auto flex-1 p-6 sm:p-8 space-y-6">
          
          {/* Step Indicator */}
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-base font-mono font-bold">
              {step.tag} · STEP {currentStep + 1} OF {TUTORIAL_STEPS.length}
            </div>

            <div className="flex items-center gap-1.5">
              {TUTORIAL_STEPS.map((_, idx) => (
                <span
                  key={idx}
                  className={`h-2.5 rounded-full transition-all ${
                    idx === currentStep ? 'w-7 bg-cyan-400' : 'w-2.5 bg-zinc-800'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Visual Icon Badge */}
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-inner">
            {step.icon}
          </div>

          {/* Step Content */}
          <div className="space-y-3">
            <div className="text-base font-mono text-zinc-400 font-bold tracking-wider">
              {step.title}
            </div>
            <h3 className="text-2xl font-bold text-white tracking-tight">
              {step.heading}
            </h3>
            <p className="text-lg text-zinc-300 leading-relaxed">
              {step.description}
            </p>

            <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 text-base text-cyan-300 font-mono mt-4 leading-relaxed">
              💡 {step.callout}
            </div>
          </div>

        </div>

        {/* Pinned Bottom Action Bar */}
        <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-950/95 shrink-0 flex items-center justify-between gap-4">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="py-3 px-5 rounded-xl text-base font-mono font-bold text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none flex items-center gap-2 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>BACK</span>
          </button>

          <button
            onClick={handleNext}
            className="py-3.5 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-base font-mono flex items-center gap-2.5 transition-all shadow-md active:scale-95"
          >
            <span>{currentStep === TUTORIAL_STEPS.length - 1 ? 'READY FOR COMBAT' : 'NEXT PROTOCOL'}</span>
            {currentStep === TUTORIAL_STEPS.length - 1 ? <Check className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>

      </div>
    </div>
  );
};
