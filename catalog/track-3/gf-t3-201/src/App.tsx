import React, { useState, useEffect } from 'react';
import { 
  CockpitHeader 
} from './components/CockpitHeader';
import { 
  MythicPerkDeck 
} from './components/MythicPerkDeck';
import { 
  LoadoutSlots 
} from './components/LoadoutSlots';
import { 
  CombatLogPanel 
} from './components/CombatLogPanel';
import { 
  ReactorRechargeModal 
} from './components/ReactorRechargeModal';
import { 
  GamerCardExporterModal 
} from './components/GamerCardExporterModal';
import { 
  AnalyticsDashboardModal 
} from './components/AnalyticsDashboardModal';
import { 
  CockpitXpSparklineModule 
} from './components/CockpitXpSparklineModule';
import { 
  GratitudeStreakHeatmapModule 
} from './components/GratitudeStreakHeatmapModule';
import { 
  TutorialOverlay 
} from './components/TutorialOverlay';
import { 
  TournamentAlertsModal 
} from './components/TournamentAlertsModal';
import { 
  ProfileVaultModal 
} from './components/ProfileVaultModal';
import { 
  StreakMilestoneModal, 
  STREAK_MILESTONES 
} from './components/StreakMilestoneModal';
import { 
  AmbientSoundscape 
} from './components/AmbientSoundscape';
import { 
  FooterEqualizerBar 
} from './components/FooterEqualizerBar';
import { 
  DailyQuestRadialProgress 
} from './components/DailyQuestRadialProgress';

import { 
  Perk, 
  LoadoutSlotData, 
  PlayerStats, 
  SlotKey, 
  DayLog, 
  TournamentAlert, 
  WeaponTier,
  CombatEvent,
  DailyQuest,
  StreakMilestone,
  WeeklyQuestDay,
  WeeklyGoal
} from './types';
import { 
  MYTHIC_PERKS_POOL, 
  INITIAL_LOADOUT_SLOTS, 
  INITIAL_WEEKLY_DAYS,
  INITIAL_WEEKLY_GOALS,
  loadStoredData, 
  saveStats, 
  saveSlots, 
  saveActivePerk, 
  saveVaultPerks, 
  saveWeaponTier, 
  saveTutorialSeen,
  saveCombatLogs,
  saveDailyQuests,
  saveWeeklyDays,
  saveWeeklyGoals
} from './utils/storage';
import { audioEngine, SOUNDSCAPE_PRESETS } from './utils/audio';

import { 
  Zap, 
  ShieldCheck, 
  Flame, 
  Sparkles, 
  Activity, 
  Smartphone, 
  ChevronRight,
  Shield,
  Layers,
  Award,
  Crown,
  Eye,
  EyeOff
} from 'lucide-react';

export default function App() {
  // State Initialization from Persistent LocalStorage
  const [initialData] = useState(() => loadStoredData());

  const [stats, setStats] = useState<PlayerStats>(initialData.stats);
  const [slots, setSlots] = useState<LoadoutSlotData[]>(initialData.slots);
  const [activePerk, setActivePerk] = useState<Perk>(initialData.activePerk);
  const [vaultPerks, setVaultPerks] = useState<Perk[]>(initialData.vaultPerks);
  const [logs, setLogs] = useState<DayLog[]>(initialData.logs);
  const [alerts, setAlerts] = useState<TournamentAlert[]>(initialData.alerts);
  const [combatLogs, setCombatLogs] = useState<CombatEvent[]>(initialData.combatLogs);
  const [quests, setQuests] = useState<DailyQuest[]>(initialData.quests);
  const [weeklyDays, setWeeklyDays] = useState<WeeklyQuestDay[]>(initialData.weeklyDays || INITIAL_WEEKLY_DAYS);
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoal[]>(initialData.weeklyGoals || INITIAL_WEEKLY_GOALS);
  const [isAmbientActive, setIsAmbientActive] = useState<boolean>(false);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(() => audioEngine.isMuted());
  const [isZenMode, setIsZenMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('titan_core_zen_mode') === 'true';
    } catch {
      return false;
    }
  });

  // Persistent Storage Sync Mode ('local_only' | 'backend_synced')
  const [syncMode, setSyncMode] = useState<'local_only' | 'backend_synced'>(() => {
    try {
      return (localStorage.getItem('titan_core_sync_mode') as 'local_only' | 'backend_synced') || 'local_only';
    } catch {
      return 'local_only';
    }
  });

  // Sync Audio Mute and Soundscape State across the entire app
  useEffect(() => {
    const unsubMute = audioEngine.onMuteChange((muted) => {
      setIsAudioMuted(muted);
      if (muted && isAmbientActive) {
        setIsAmbientActive(false);
      }
    });

    const unsubSoundscape = audioEngine.onSoundscapeChange((state) => {
      setIsAmbientActive(state.active);
    });

    return () => {
      unsubMute();
      unsubSoundscape();
    };
  }, [isAmbientActive]);

  // Modals
  const [isRechargeOpen, setIsRechargeOpen] = useState(false);
  const [isExporterOpen, setIsExporterOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [isMilestoneOpen, setIsMilestoneOpen] = useState(false);
  const [isSoundscapeOpen, setIsSoundscapeOpen] = useState(false);
  const [milestoneTargetDays, setMilestoneTargetDays] = useState<number>(7);

  // Auto-detect if current streak has achieved an uncelebrated milestone (7, 30, 100 days)
  useEffect(() => {
    const celebrated = stats.celebratedMilestones || [];
    // Check milestones from highest to lowest so we celebrate the highest achieved first
    const hitMilestone = [...STREAK_MILESTONES].reverse().find(
      (m) => stats.streak >= m.days && !celebrated.includes(m.days)
    );

    if (hitMilestone) {
      setMilestoneTargetDays(hitMilestone.days);
      setIsMilestoneOpen(true);
    }
  }, [stats.streak, stats.celebratedMilestones]);

  // Show tutorial on very first boot if never seen
  useEffect(() => {
    if (!initialData.tutorialSeen) {
      const timer = setTimeout(() => {
        setIsTutorialOpen(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [initialData.tutorialSeen]);

  // Daily Streak Integrity Check: Detects missed days and executes Cryo Streak Freeze protection
  useEffect(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const lastDateStr = stats.lastLoggedDate;

    if (lastDateStr && lastDateStr !== todayStr) {
      const lastDate = new Date(lastDateStr);
      const today = new Date(todayStr);
      const diffTime = Math.abs(today.getTime() - lastDate.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays >= 2) {
        const isFreezeEquipped = activePerk.id === 'perk_streak_freeze' || activePerk.isStreakFreeze;
        if (isFreezeEquipped) {
          audioEngine.playStreakFreeze();
          const updatedStats: PlayerStats = {
            ...stats,
            lastLoggedDate: todayStr,
            streakFrozenToday: true,
            streakFreezeUsedCount: (stats.streakFreezeUsedCount || 0) + 1
          };
          setStats(updatedStats);
          saveStats(updatedStats);
          addCombatEvent({
            title: '❄️ Cryo Streak Freeze Activated',
            description: `Missed logging rotation detected (${diffDays} days skipped). [CRYO STREAK FREEZE] preserved your ${stats.streak}-day streak without reset!`,
            type: 'streak_freeze'
          });
        } else {
          const prevStreak = stats.streak;
          const updatedStats: PlayerStats = {
            ...stats,
            streak: 1,
            lastLoggedDate: todayStr,
            streakFrozenToday: false
          };
          setStats(updatedStats);
          saveStats(updatedStats);
          addCombatEvent({
            title: '⚠️ Streak Reset: Inactivity Detected',
            description: `Daily gratitude loadout was missed without Cryo Streak Freeze equipped. Streak reset from ${prevStreak} to 1.`,
            type: 'slot_lock'
          });
        }
      }
    }
  }, []);

  // Helper to append a real-time combat accomplishment
  const addCombatEvent = (event: Omit<CombatEvent, 'id' | 'timestamp'>) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newEvent: CombatEvent = {
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: timeStr
    };
    setCombatLogs((prev) => {
      const updated = [newEvent, ...prev.slice(0, 49)];
      saveCombatLogs(updated);
      return updated;
    });
  };

  const handleClearCombatLogs = () => {
    setCombatLogs([]);
    saveCombatLogs([]);
  };

  // Recalculate Core Shield percentage based on slots sealed (0%, 33%, 66%, 100%)
  const updateShieldAndStats = (updatedSlots: LoadoutSlotData[], xpBonus = 0) => {
    const lockedCount = updatedSlots.filter((s) => s.locked).length;
    let newPercentage = 0;
    if (lockedCount === 1) newPercentage = 33;
    else if (lockedCount === 2) newPercentage = 66;
    else if (lockedCount === 3) newPercentage = 100;

    const newXp = stats.xp + xpBonus;
    let newLevel = stats.level;
    let nextLevelXp = stats.nextLevelXp;

    if (newXp >= nextLevelXp) {
      newLevel += 1;
      nextLevelXp += 750;
      audioEngine.playOvercharge();
      addCombatEvent({
        title: `Chassis Overclocked (LVL ${newLevel})`,
        description: `Player Level increased to LVL ${newLevel}! Defenses and neural throughput upgraded.`,
        type: 'level_up',
        xpAwarded: 100
      });
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    let newStreak = stats.streak;
    let newBestStreak = stats.bestStreak;

    // Advance streak when all 3 slots are sealed on a new day
    if (newPercentage === 100 && stats.shieldPercentage < 100) {
      if (stats.lastLoggedDate !== todayStr) {
        newStreak = stats.streak + 1;
        newBestStreak = Math.max(newBestStreak, newStreak);
      }
    }

    const newStats: PlayerStats = {
      ...stats,
      shieldPercentage: newPercentage,
      xp: newXp,
      level: newLevel,
      nextLevelXp,
      streak: newStreak,
      bestStreak: newBestStreak,
      lastLoggedDate: todayStr,
      streakFrozenToday: false
    };

    setStats(newStats);
    saveStats(newStats);

    if (newPercentage === 100 && stats.shieldPercentage < 100) {
      audioEngine.playOvercharge();
      addCombatEvent({
        title: 'Core Shield Overcharged (100%)',
        description: `Maximum defense barrier activated. All 3 gratitude vectors secured. Streak: ${newStreak} days!`,
        type: 'shield_max',
        xpAwarded: 200
      });
    }
  };

  // Update a single loadout slot
  const handleUpdateSlot = (slotId: SlotKey, content: string, locked: boolean) => {
    const updatedSlots = slots.map((s) => {
      if (s.id === slotId) {
        return {
          ...s,
          content,
          locked,
          timestamp: locked ? `Today · ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : undefined
        };
      }
      return s;
    });

    setSlots(updatedSlots);
    saveSlots(updatedSlots);

    // If locked was just enabled, award +150 XP
    const targetSlot = slots.find((s) => s.id === slotId);
    const xpBonus = (!targetSlot?.locked && locked) ? 150 : 0;
    updateShieldAndStats(updatedSlots, xpBonus);

    if (!targetSlot?.locked && locked) {
      addCombatEvent({
        title: `${targetSlot?.label || 'Slot'} ("${targetSlot?.title}") Sealed`,
        description: `"${content}" locked into Core Shield defense telemetry.`,
        type: 'slot_lock',
        xpAwarded: 150
      });
    }
  };

  // Reset all 3 slots
  const handleResetAllSlots = () => {
    const cleared = INITIAL_LOADOUT_SLOTS.map((s) => ({
      ...s,
      content: '',
      locked: false,
      timestamp: undefined
    }));
    setSlots(cleared);
    saveSlots(cleared);
    updateShieldAndStats(cleared, 0);
  };

  // Reroll Perk
  const handleRerollPerk = () => {
    const pool = MYTHIC_PERKS_POOL.filter((p) => p.id !== activePerk.id);
    const randomIndex = Math.floor(Math.random() * pool.length);
    const nextPerk = pool[randomIndex];
    setActivePerk(nextPerk);
    saveActivePerk(nextPerk);

    if (nextPerk.id === 'perk_streak_freeze' || nextPerk.isStreakFreeze) {
      audioEngine.playStreakFreeze();
      addCombatEvent({
        title: `❄️ Mythic Drop: ${nextPerk.title}`,
        description: `CRYO-SHIELD ACTIVE: Your daily streak is now protected from resetting if you miss a logging day.`,
        type: 'streak_freeze'
      });
    } else {
      addCombatEvent({
        title: `Perk Drawn: ${nextPerk.title}`,
        description: `Equipped [${nextPerk.rarity}] mindset: "${nextPerk.affirmation}"`,
        type: 'perk_drop'
      });
    }
  };

  // Select specific perk
  const handleSelectSpecificPerk = (perk: Perk) => {
    setActivePerk(perk);
    saveActivePerk(perk);

    if (perk.id === 'perk_streak_freeze' || perk.isStreakFreeze) {
      audioEngine.playStreakFreeze();
      addCombatEvent({
        title: `❄️ Perk Equipped: ${perk.title}`,
        description: `CRYO-SHIELD ACTIVATED: Missed logging days will freeze your streak in stasis rather than resetting it.`,
        type: 'streak_freeze'
      });
    } else {
      addCombatEvent({
        title: `Perk Equipped: ${perk.title}`,
        description: `Active mindset anchor set to "${perk.affirmation}"`,
        type: 'perk_drop'
      });
    }
  };

  // Streak Freeze Simulation & Management
  const handleSimulateMissedDay = () => {
    const isFreezeEquipped = activePerk.id === 'perk_streak_freeze' || activePerk.isStreakFreeze;
    if (isFreezeEquipped) {
      audioEngine.playStreakFreeze();
      const updatedStats: PlayerStats = {
        ...stats,
        streakFrozenToday: true,
        streakFreezeUsedCount: (stats.streakFreezeUsedCount || 0) + 1
      };
      setStats(updatedStats);
      saveStats(updatedStats);
      addCombatEvent({
        title: '❄️ Cryo Streak Freeze Intercepted Decay',
        description: `Simulated 48-hour missed log. Cryo-shield matrix held your ${stats.streak}-day streak frozen in stasis! Zero penalty.`,
        type: 'streak_freeze'
      });
      return { preserved: true, streak: stats.streak };
    } else {
      audioEngine.playSlotLock();
      const prevStreak = stats.streak;
      const updatedStats: PlayerStats = {
        ...stats,
        streak: 1,
        streakFrozenToday: false
      };
      setStats(updatedStats);
      saveStats(updatedStats);
      addCombatEvent({
        title: '⚠️ Streak Decayed to 1 Day',
        description: `Simulated 48-hour missed log without Cryo Streak Freeze equipped. Active streak collapsed from ${prevStreak} to 1.`,
        type: 'slot_lock'
      });
      return { preserved: false, streak: 1, prevStreak };
    }
  };

  const handleRestoreStreak = (previousStreak = 8) => {
    const updatedStats: PlayerStats = {
      ...stats,
      streak: previousStreak
    };
    setStats(updatedStats);
    saveStats(updatedStats);
    audioEngine.playOvercharge();
    addCombatEvent({
      title: 'Streak Restored',
      description: `Streak counter restored to ${previousStreak} days.`,
      type: 'slot_lock'
    });
  };

  const handleEquipStreakFreeze = () => {
    const freezePerk = MYTHIC_PERKS_POOL.find((p) => p.id === 'perk_streak_freeze' || p.isStreakFreeze);
    if (freezePerk) {
      handleSelectSpecificPerk(freezePerk);
    }
  };

  // Toggle saving to vault
  const handleToggleVaultPerk = (perk: Perk) => {
    const exists = vaultPerks.some((p) => p.id === perk.id);
    let updated: Perk[];
    if (exists) {
      updated = vaultPerks.filter((p) => p.id !== perk.id);
    } else {
      updated = [...vaultPerks, perk];
    }
    setVaultPerks(updated);
    saveVaultPerks(updated);
  };

  // Remove perk from vault
  const handleRemoveVaultPerk = (perkId: string) => {
    const updated = vaultPerks.filter((p) => p.id !== perkId);
    setVaultPerks(updated);
    saveVaultPerks(updated);
  };

  // Ambient Soundscape Toggle
  const handleToggleAmbient = () => {
    const active = audioEngine.toggleSoundscape();
    setIsAmbientActive(active);
    const presetId = audioEngine.getSoundscapePreset();
    const presetObj = SOUNDSCAPE_PRESETS.find((p) => p.id === presetId);
    if (active) {
      addCombatEvent({
        title: `Soundscape Engaged: ${presetObj?.name || 'Deep Void'}`,
        description: `Acoustic frequency modulation engaged (${presetObj?.frequencyRange || '55Hz'}). Zero-distraction sensory flow online.`,
        type: 'slot_lock'
      });
    } else {
      addCombatEvent({
        title: 'Soundscape Suspended',
        description: 'Ambient acoustic synthesizer entered standby mode.',
        type: 'slot_lock'
      });
    }
  };

  // Global Audio Mute / Unmute Toggle
  const handleToggleAudioMute = () => {
    const nextMuted = audioEngine.toggleMute();
    setIsAudioMuted(nextMuted);
    if (!nextMuted) {
      audioEngine.playClick();
      addCombatEvent({
        title: 'Cockpit Audio Unmuted',
        description: 'Global Web Audio synthesizer unmuted. Sound feedback online.',
        type: 'slot_lock'
      });
    } else {
      addCombatEvent({
        title: 'Cockpit Audio Muted',
        description: 'All audio synthesizers and SFX silenced globally.',
        type: 'slot_lock'
      });
    }
  };

  // Streak Milestone & Mythic Achievement Claim Handler
  const handleClaimMilestone = (milestone: StreakMilestone) => {
    const celebrated = stats.celebratedMilestones || [];
    const isAlreadyClaimed = celebrated.includes(milestone.days);

    const xpToAdd = isAlreadyClaimed ? 0 : milestone.xpReward;
    const newXp = stats.xp + xpToAdd;
    let newLevel = stats.level;
    let nextLevelXp = stats.nextLevelXp;
    if (newXp >= nextLevelXp) {
      newLevel += 1;
      nextLevelXp += 750;
      audioEngine.playOvercharge();
    }

    const updatedCelebrated = Array.from(new Set([...celebrated, milestone.days]));
    const updatedStats: PlayerStats = {
      ...stats,
      xp: newXp,
      level: newLevel,
      nextLevelXp,
      celebratedMilestones: updatedCelebrated
    };
    setStats(updatedStats);
    saveStats(updatedStats);

    // Register in Combat Log as Mythic Achievement
    addCombatEvent({
      title: `Mythic Achievement: "${milestone.title}"`,
      description: `${milestone.badge} secured (${milestone.days}-day streak milestone). Permanent chassis trait unlocked: [${milestone.armorUnlock}]. +${milestone.xpReward} XP awarded to neural core.`,
      type: 'mythic_achievement',
      xpAwarded: milestone.xpReward,
      milestoneDays: milestone.days
    });
  };

  const handleOpenMilestones = (days = 7) => {
    audioEngine.playClick();
    setMilestoneTargetDays(days);
    setIsMilestoneOpen(true);
  };

  // Chassis Tier selection
  const handleSelectTier = (tier: WeaponTier) => {
    const updated = { ...stats, weaponTier: tier };
    setStats(updated);
    saveStats(updated);
    saveWeaponTier(tier);
  };

  // Recharge session finished (+100 XP)
  const handleRechargeComplete = (xpEarned: number) => {
    const newStats = {
      ...stats,
      xp: stats.xp + xpEarned,
      rechargeMinutes: stats.rechargeMinutes + 1
    };
    setStats(newStats);
    saveStats(newStats);

    addCombatEvent({
      title: 'Reactor Core Calibrated',
      description: '60s tactical box breathing cycle completed. Pre-frontal lag cooled down.',
      type: 'recharge',
      xpAwarded: xpEarned
    });
  };

  // Pomodoro Deep Work Complete (+250 XP & logged focus minutes)
  const handleDeepWorkComplete = (minutes: number, xpEarned: number) => {
    let newXp = stats.xp + xpEarned;
    let newLevel = stats.level;
    let nextLevelXp = stats.nextLevelXp;

    if (newXp >= nextLevelXp) {
      newLevel += 1;
      nextLevelXp += 750;
      audioEngine.playOvercharge();
    }

    const newStats: PlayerStats = {
      ...stats,
      xp: newXp,
      level: newLevel,
      nextLevelXp,
      rechargeMinutes: stats.rechargeMinutes + minutes
    };
    setStats(newStats);
    saveStats(newStats);

    addCombatEvent({
      title: 'Deep Work Focus Burst Complete',
      description: `${minutes}-minute Pomodoro session concluded with zero tab leakage.`,
      type: 'deep_work',
      xpAwarded: xpEarned
    });
  };

  // Toggle Alert channel
  const handleToggleAlert = (alertId: string) => {
    const updated = alerts.map((a) => (a.id === alertId ? { ...a, enabled: !a.enabled } : a));
    setAlerts(updated);
  };

  // Import Backup Data
  const handleImportData = (data: { stats: PlayerStats; slots: LoadoutSlotData[]; vaultPerks: Perk[]; logs: DayLog[] }) => {
    setStats(data.stats);
    setSlots(data.slots);
    setVaultPerks(data.vaultPerks);
    setLogs(data.logs);
    saveStats(data.stats);
    saveSlots(data.slots);
    saveVaultPerks(data.vaultPerks);
  };

  // Handle Tutorial Close
  const handleCloseTutorial = () => {
    setIsTutorialOpen(false);
    saveTutorialSeen(true);
  };

  // --- DAILY QUEST / TACTICAL OBJECTIVES HANDLERS ---
  const handleToggleQuest = (questId: string) => {
    let questTitle = '';
    let isNowCompleted = false;
    let earnedXp = 0;

    const updated = quests.map((q) => {
      if (q.id === questId) {
        questTitle = q.title;
        isNowCompleted = !q.completed;
        earnedXp = q.xpReward;
        return { ...q, completed: !q.completed };
      }
      return q;
    });

    setQuests(updated);
    saveDailyQuests(updated);

    if (isNowCompleted) {
      audioEngine.playSlotLock();

      // Award XP
      const newXp = stats.xp + earnedXp;
      let newLevel = stats.level;
      let nextLevelXp = stats.nextLevelXp;
      if (newXp >= nextLevelXp) {
        newLevel += 1;
        nextLevelXp += 750;
        audioEngine.playOvercharge();
        addCombatEvent({
          title: `Chassis Overclocked (LVL ${newLevel})`,
          description: `Player Level increased to LVL ${newLevel}! Neural throughput upgraded.`,
          type: 'level_up',
          xpAwarded: 100
        });
      }

      const newStats: PlayerStats = {
        ...stats,
        xp: newXp,
        level: newLevel,
        nextLevelXp
      };
      setStats(newStats);
      saveStats(newStats);

      addCombatEvent({
        title: `Daily Quest Cleared: "${questTitle}"`,
        description: `Tactical objective executed. +${earnedXp} XP awarded to neural core.`,
        type: 'quest_complete',
        xpAwarded: earnedXp
      });

      // Check if all quests are complete
      const allDone = updated.length > 0 && updated.every((q) => q.completed);
      if (allDone) {
        setTimeout(() => {
          audioEngine.playOvercharge();
          addCombatEvent({
            title: 'All Daily Quests Cleared (100%)',
            description: 'Full objective matrix secured. Daily habit overclock active.',
            type: 'quest_complete',
            xpAwarded: 150
          });
        }, 300);
      }
    } else {
      audioEngine.playClick();
    }
  };

  const handleAddQuest = (title: string, category: DailyQuest['category'] = 'Tactical', xpReward = 75) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newQuest: DailyQuest = {
      id: `quest_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title,
      category,
      completed: false,
      xpReward,
      createdAt: timeStr
    };

    const updated = [newQuest, ...quests];
    setQuests(updated);
    saveDailyQuests(updated);

    addCombatEvent({
      title: `Objective Deployed: "${title}"`,
      description: `New daily quest registered in [${category}]. Potential reward: +${xpReward} XP.`,
      type: 'quest_complete'
    });
  };

  const handleDeleteQuest = (questId: string) => {
    const deleted = quests.find((q) => q.id === questId);
    const updated = quests.filter((q) => q.id !== questId);
    setQuests(updated);
    saveDailyQuests(updated);
    if (deleted) {
      addCombatEvent({
        title: `Objective Purged: "${deleted.title}"`,
        description: 'Mission removed from daily tactical rotation.',
        type: 'quest_complete'
      });
    }
  };

  const handleResetQuests = () => {
    const updated = quests.map((q) => ({ ...q, completed: false }));
    setQuests(updated);
    saveDailyQuests(updated);
    audioEngine.playSlotLock();
    addCombatEvent({
      title: 'Daily Objectives Reset',
      description: 'All tactical quests reset for fresh daily cycle engagement.',
      type: 'quest_complete'
    });
  };

  // --- 7-DAY STREAK WINDOW & WEEKLY GOALS HANDLERS ---
  const handleToggleWeeklyDay = (dayId: string) => {
    let dayName = '';
    let isNowCompleted = false;
    let xpReward = 100;

    const updated = weeklyDays.map((d) => {
      if (d.id === dayId) {
        dayName = d.dayName;
        isNowCompleted = !d.isCompleted;
        xpReward = d.xpReward;
        return { ...d, isCompleted: !d.isCompleted };
      }
      return d;
    });

    setWeeklyDays(updated);
    saveWeeklyDays(updated);

    if (isNowCompleted) {
      audioEngine.playSlotLock();
      const newXp = stats.xp + xpReward;
      let newLevel = stats.level;
      let nextLevelXp = stats.nextLevelXp;
      if (newXp >= nextLevelXp) {
        newLevel += 1;
        nextLevelXp += 750;
        audioEngine.playOvercharge();
      }
      const newStats: PlayerStats = {
        ...stats,
        xp: newXp,
        level: newLevel,
        nextLevelXp
      };
      setStats(newStats);
      saveStats(newStats);

      addCombatEvent({
        title: `Weekly Streak Node Secured: ${dayName}`,
        description: `7-Day streak window checkpoint marked complete. +${xpReward} XP awarded to neural core.`,
        type: 'quest_complete',
        xpAwarded: xpReward
      });

      // If all 7 days in the streak window are complete, award weekly overdrive bonus (+500 XP)
      const allSevenDone = updated.every((d) => d.isCompleted);
      if (allSevenDone) {
        audioEngine.playOvercharge();
        const bonusXp = 500;
        const overdriveStats: PlayerStats = {
          ...newStats,
          xp: newStats.xp + bonusXp,
          streak: Math.max(newStats.streak, 7)
        };
        setStats(overdriveStats);
        saveStats(overdriveStats);
        addCombatEvent({
          title: '🏆 7-Day Streak Window Mastered!',
          description: 'All 7 daily checkpoints in the weekly streak cycle secured! +500 XP Overdrive bonus unlocked.',
          type: 'mythic_achievement',
          xpAwarded: bonusXp
        });
      }
    } else {
      audioEngine.playClick();
    }
  };

  const handleToggleWeeklyGoal = (goalId: string) => {
    let goalTitle = '';
    let isNowCompleted = false;
    let earnedXp = 0;

    const updated = weeklyGoals.map((g) => {
      if (g.id === goalId) {
        goalTitle = g.title;
        isNowCompleted = !g.completed;
        earnedXp = g.xpReward;
        return {
          ...g,
          completed: isNowCompleted,
          currentCount: isNowCompleted ? g.targetCount : 0
        };
      }
      return g;
    });

    setWeeklyGoals(updated);
    saveWeeklyGoals(updated);

    if (isNowCompleted) {
      audioEngine.playSlotLock();
      const newXp = stats.xp + earnedXp;
      let newLevel = stats.level;
      let nextLevelXp = stats.nextLevelXp;
      if (newXp >= nextLevelXp) {
        newLevel += 1;
        nextLevelXp += 750;
        audioEngine.playOvercharge();
      }
      const newStats: PlayerStats = {
        ...stats,
        xp: newXp,
        level: newLevel,
        nextLevelXp
      };
      setStats(newStats);
      saveStats(newStats);

      addCombatEvent({
        title: `Weekly Goal Achieved: "${goalTitle}"`,
        description: `Strategic weekly objective cleared across the 7-day streak window. +${earnedXp} XP secured.`,
        type: 'quest_complete',
        xpAwarded: earnedXp
      });
    } else {
      audioEngine.playClick();
    }
  };

  const handleStepWeeklyGoal = (goalId: string, increment: number) => {
    let newlyCompleted = false;
    let earnedXp = 0;
    let goalTitle = '';

    const updated = weeklyGoals.map((g) => {
      if (g.id === goalId) {
        const nextCount = Math.max(0, Math.min(g.targetCount, g.currentCount + increment));
        const wasCompleted = g.completed;
        const isNowCompleted = nextCount >= g.targetCount;
        if (!wasCompleted && isNowCompleted) {
          newlyCompleted = true;
          earnedXp = g.xpReward;
          goalTitle = g.title;
        }
        return {
          ...g,
          currentCount: nextCount,
          completed: isNowCompleted
        };
      }
      return g;
    });

    setWeeklyGoals(updated);
    saveWeeklyGoals(updated);

    if (newlyCompleted) {
      audioEngine.playOvercharge();
      const newXp = stats.xp + earnedXp;
      const newStats = { ...stats, xp: newXp };
      setStats(newStats);
      saveStats(newStats);
      addCombatEvent({
        title: `Weekly Goal Completed: "${goalTitle}"`,
        description: `Target payload reached in 7-day streak cycle. +${earnedXp} XP awarded.`,
        type: 'quest_complete',
        xpAwarded: earnedXp
      });
    } else {
      audioEngine.playClick();
    }
  };

  const handleAddWeeklyGoal = (title: string, category: WeeklyGoal['category'], targetCount: number, unit: string, xpReward: number) => {
    const newGoal: WeeklyGoal = {
      id: `wgoal_${Date.now()}`,
      title,
      category,
      currentCount: 0,
      targetCount,
      unit,
      completed: false,
      xpReward
    };
    const updated = [...weeklyGoals, newGoal];
    setWeeklyGoals(updated);
    saveWeeklyGoals(updated);
    addCombatEvent({
      title: `Strategic Weekly Goal Deployed: "${title}"`,
      description: `Target set: ${targetCount} ${unit} across the 7-day streak window (+${xpReward} XP).`,
      type: 'quest_complete'
    });
  };

  const handleResetWeeklyWindow = () => {
    const resetDays = weeklyDays.map((d) => ({ ...d, isCompleted: false }));
    const resetGoals = weeklyGoals.map((g) => ({ ...g, currentCount: 0, completed: false }));
    setWeeklyDays(resetDays);
    setWeeklyGoals(resetGoals);
    saveWeeklyDays(resetDays);
    saveWeeklyGoals(resetGoals);
    audioEngine.playClick();
    addCombatEvent({
      title: '7-Day Streak Window Cycle Reset',
      description: 'Weekly checkpoints and strategic objectives refreshed for the new 7-day streak rotation.',
      type: 'slot_lock'
    });
  };

  // --- ZEN MODE HANDLER ---
  const handleToggleZenMode = () => {
    const nextState = !isZenMode;
    setIsZenMode(nextState);
    try {
      localStorage.setItem('titan_core_zen_mode', String(nextState));
    } catch (e) {
      console.warn(e);
    }
    if (nextState) {
      audioEngine.playSlotLock();
      addCombatEvent({
        title: 'Zen Mode Engaged',
        description: 'Non-essential UI docked. Cockpit focused solely on active Affirmation Perk & 3-Slot Loadout.',
        type: 'slot_lock'
      });
    } else {
      audioEngine.playClick();
      addCombatEvent({
        title: 'Zen Mode Deactivated',
        description: 'Full cockpit event stream and tactical telemetry restored.',
        type: 'slot_lock'
      });
    }
  };

  // --- SYNC MODE HANDLERS ---
  const handleToggleSyncMode = (newMode: 'local_only' | 'backend_synced') => {
    setSyncMode(newMode);
    try {
      localStorage.setItem('titan_core_sync_mode', newMode);
    } catch (e) {
      console.warn(e);
    }
    if (newMode === 'backend_synced') {
      addCombatEvent({
        title: 'Backend Persistent Storage Connected',
        description: 'Chassis stats, loadouts, and habit streaks synchronized with remote cloud storage.',
        type: 'slot_lock'
      });
    } else {
      addCombatEvent({
        title: 'Local Storage Sandbox Engaged',
        description: 'Persistent telemetry isolated to private browser LocalStorage enclave.',
        type: 'slot_lock'
      });
    }
  };

  const handleManualSync = () => {
    addCombatEvent({
      title: syncMode === 'backend_synced' ? 'Backend Storage Reconciled' : 'Local Storage Cache Flushed',
      description: syncMode === 'backend_synced' 
        ? 'Full telemetry snapshot dispatched to persistent backend database.'
        : 'All 12 telemetry state records verified and locked in browser storage.',
      type: 'slot_lock'
    });
  };

  // Listen for Escape key to exit Zen Mode when no modals are open
  useEffect(() => {
    if (!isZenMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'Escape' &&
        !isRechargeOpen &&
        !isExporterOpen &&
        !isAnalyticsOpen &&
        !isTutorialOpen &&
        !isAlertsOpen &&
        !isVaultOpen
      ) {
        handleToggleZenMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isZenMode, isRechargeOpen, isExporterOpen, isAnalyticsOpen, isTutorialOpen, isAlertsOpen, isVaultOpen]);

  const isShieldMax = stats.shieldPercentage >= 100;

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      
      {/* 1. Cockpit Header & HUD Telemetry Bar (Unstuck: natural relative flow, no sideways scroll) */}
      <CockpitHeader
        stats={stats}
        activePerk={activePerk}
        isAmbientActive={isAmbientActive}
        onToggleAmbient={handleToggleAmbient}
        isMuted={isAudioMuted}
        onToggleMute={handleToggleAudioMute}
        onOpenMilestones={() => handleOpenMilestones(stats.streak >= 100 ? 100 : stats.streak >= 30 ? 30 : 7)}
        onOpenRecharge={() => {
          audioEngine.playClick();
          setIsRechargeOpen(true);
        }}
        onOpenExporter={() => {
          audioEngine.playClick();
          setIsExporterOpen(true);
        }}
        onOpenTutorial={() => {
          audioEngine.playClick();
          setIsTutorialOpen(true);
        }}
        onOpenAnalytics={() => {
          audioEngine.playClick();
          setIsAnalyticsOpen(true);
        }}
        onOpenAlerts={() => {
          audioEngine.playClick();
          setIsAlertsOpen(true);
        }}
        onOpenVault={() => {
          audioEngine.playClick();
          setIsVaultOpen(true);
        }}
        onOpenSoundscape={() => {
          audioEngine.playClick();
          setIsSoundscapeOpen(true);
        }}
        onSelectTier={handleSelectTier}
        onDeepWorkComplete={handleDeepWorkComplete}
        isZenMode={isZenMode}
        onToggleZenMode={handleToggleZenMode}
        syncMode={syncMode}
        onSyncModeToggle={handleToggleSyncMode}
        onManualSync={handleManualSync}
      />

      {/* 2. Main Cockpit Viewport (Strict containment: 100% width, zero overflow) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 overflow-x-hidden">
        
        {/* Daily Quest Radial Progress Bar at the top of main viewport */}
        {!isZenMode && (
          <DailyQuestRadialProgress
            quests={quests}
            onOpenQuests={() => {
              const el = document.getElementById('combat-log-panel-anchor');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          />
        )}

        {/* Zen Mode Active Banner */}
        {isZenMode && (
          <div className="p-5 rounded-3xl bg-gradient-to-r from-purple-950/40 via-zinc-900 to-zinc-950 border border-purple-500/40 shadow-[0_0_30px_rgba(168,85,247,0.15)] flex flex-col sm:flex-row items-center justify-between gap-5 animate-in fade-in duration-300">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-400 text-purple-300 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                <EyeOff className="w-7 h-7 text-purple-400 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold text-white tracking-tight">
                    ZEN FOCUS PROTOCOL ENGAGED
                  </span>
                  <span className="text-base font-mono font-bold px-3 py-0.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    ZERO DISTRACTIONS
                  </span>
                </div>
                <p className="text-base sm:text-lg text-zinc-300 mt-1 leading-relaxed">
                  Combat logs, footer, and secondary panels docked. Focus solely on your active Affirmation Perk and 3-Slot Gratitude Loadout.
                </p>
              </div>
            </div>

            <button
              onClick={handleToggleZenMode}
              className="py-3.5 px-6 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-purple-400/50 text-purple-200 text-base font-mono font-bold flex items-center gap-2.5 transition-all shadow-md active:scale-95 shrink-0 self-stretch sm:self-auto justify-center"
              title="Exit Zen Mode (or press Escape)"
            >
              <Eye className="w-5 h-5 text-purple-400" />
              <span>EXIT ZEN MODE (ESC)</span>
            </button>
          </div>
        )}

        {/* Cockpit Status Banner (Shield Overcharge / Daily Quest Anchor) - Hidden in Zen Mode */}
        {!isZenMode && (
          <div className={`p-6 rounded-3xl border transition-all duration-500 flex flex-col sm:flex-row items-center justify-between gap-5 ${
            isShieldMax
              ? 'bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-cyan-950/30 border-emerald-500/40 shadow-[0_0_30px_rgba(52,211,153,0.15)]'
              : 'bg-zinc-900/70 border-zinc-800'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${
                isShieldMax
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.3)]'
                  : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
              }`}>
                {isShieldMax ? <ShieldCheck className="w-8 h-8 text-emerald-400" /> : <Zap className="w-7 h-7 text-cyan-400 animate-pulse" />}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    {isShieldMax ? 'CORE SHIELD OVERCHARGED · DEFENSES AT 100%' : 'DAILY FOCUS LOADOUT IN PROGRESS'}
                  </span>
                  <span className="text-base font-mono font-bold px-3 py-0.5 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {stats.weaponTier}
                  </span>
                </div>
                <p className="text-base sm:text-lg text-zinc-300 mt-1 leading-relaxed">
                  {isShieldMax 
                    ? 'All 3 gratitude vectors secured. Dopamine calibrated. Tilt resistance maximum.' 
                    : `Lock in your 3 gratitude slots below to achieve maximum shield defense (+${(3 - slots.filter(s => s.locked).length) * 150} XP available).`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-stretch sm:self-auto shrink-0">
              <button
                onClick={() => {
                  audioEngine.playClick();
                  setIsRechargeOpen(true);
                }}
                className="flex-1 sm:flex-initial py-3.5 px-6 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-base font-mono font-bold flex items-center justify-center gap-2.5 transition-colors"
              >
                <Activity className="w-5 h-5 text-cyan-400" />
                <span>60s RECHARGE</span>
              </button>
              <button
                onClick={() => {
                  audioEngine.playClick();
                  setIsExporterOpen(true);
                }}
                className="flex-1 sm:flex-initial py-3.5 px-6 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-base font-mono font-bold flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-95"
              >
                <Smartphone className="w-5 h-5" />
                <span>9:16 WALLPAPER</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. The Mythic Perk Deck (Affirmation Drop) - Always Visible */}
        <MythicPerkDeck
          currentPerk={activePerk}
          allPerks={MYTHIC_PERKS_POOL}
          vaultPerks={vaultPerks}
          onRerollPerk={handleRerollPerk}
          onToggleVaultPerk={handleToggleVaultPerk}
          onSelectSpecificPerk={handleSelectSpecificPerk}
        />

        {/* 4. The 3-Slot Tactical Loadout (Gratitude Entries) - Always Visible */}
        <LoadoutSlots
          slots={slots}
          onUpdateSlot={handleUpdateSlot}
          onResetAllSlots={handleResetAllSlots}
        />

        {/* 5. Cockpit Tactical Modules Section - Hidden in Zen Mode */}
        {!isZenMode && (
          <div className="w-full max-w-full space-y-6">
            
            {/* Visual Telemetry Module 1: 30-Day Gratitude Habit Heatmap */}
            <GratitudeStreakHeatmapModule
              stats={stats}
              slots={slots}
              logs={logs}
              activePerk={activePerk}
              onOpenAnalytics={() => {
                audioEngine.playClick();
                setIsAnalyticsOpen(true);
              }}
              onFocusSlots={() => {
                document.getElementById('tactical-loadout-slots')?.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* Visual Telemetry Module 2: 7-Day XP Velocity Sparkline Chart */}
            <CockpitXpSparklineModule
              stats={stats}
              logs={logs}
              slots={slots}
              quests={quests}
              onOpenAnalytics={() => {
                audioEngine.playClick();
                setIsAnalyticsOpen(true);
              }}
            />

            {/* Tactical Sub-Modules Grid */}
            <div className="w-full max-w-full grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Module 1: Reactor Core Calibration */}
              <div 
                onClick={() => {
                  audioEngine.playClick();
                  setIsRechargeOpen(true);
                }}
                className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 hover:border-cyan-500/40 cursor-pointer transition-all group flex items-start gap-5 shadow-sm"
              >
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 group-hover:scale-105 transition-transform">
                  <Activity className="w-7 h-7 text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-base font-mono text-zinc-400 flex items-center justify-between font-bold">
                    <span>NEURAL CALIBRATION</span>
                    <span className="text-cyan-400">READY</span>
                  </div>
                  <div className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors mt-1">
                    60s Reactor Recharge
                  </div>
                  <p className="text-base text-zinc-300 mt-1.5 leading-relaxed line-clamp-2">
                    Paced box breathing (4-4-4-2s) to purge adrenaline spikes and reset executive focus.
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-cyan-400 self-center transition-colors" />
              </div>

              {/* Module 2: Focus Analytics & Efficiency HUD */}
              <div 
                onClick={() => {
                  audioEngine.playClick();
                  setIsAnalyticsOpen(true);
                }}
                className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 hover:border-emerald-500/40 cursor-pointer transition-all group flex items-start gap-5 shadow-sm"
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
                  <Award className="w-7 h-7 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-base font-mono text-zinc-400 flex items-center justify-between font-bold">
                    <span>SYSTEM PERFORMANCE</span>
                    <span className="text-emerald-400 font-bold">{stats.streak}d STREAK</span>
                  </div>
                  <div className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors mt-1">
                    Focus Analytics HUD
                  </div>
                  <p className="text-base text-zinc-300 mt-1.5 leading-relaxed line-clamp-2">
                    Deep telemetry on shield uptime, daily progression charts, and cryo-shield matrix state.
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-emerald-400 self-center transition-colors" />
              </div>

              {/* Module 3: Codex Vault */}
              <div 
                onClick={() => {
                  audioEngine.playClick();
                  setIsVaultOpen(true);
                }}
                className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 hover:border-purple-500/40 cursor-pointer transition-all group flex items-start gap-5 shadow-sm"
              >
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 group-hover:scale-105 transition-transform">
                  <Layers className="w-7 h-7 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-base font-mono text-zinc-400 flex items-center justify-between font-bold">
                    <span>MINDSET REPOSITORY</span>
                    <span className="text-purple-400 font-bold">{vaultPerks.length} SAVED</span>
                  </div>
                  <div className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors mt-1">
                    Codex Vault & Backups
                  </div>
                  <p className="text-base text-zinc-300 mt-1.5 leading-relaxed line-clamp-2">
                    Access your favorited affirmation cards and export zero-loss JSON backup packages.
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-purple-400 self-center transition-colors" />
              </div>

            </div>
          </div>
        )}

        {/* Streak Milestone Rewards & Mythic Achievement Banner - Hidden in Zen Mode */}
        {!isZenMode && (
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-950/30 via-zinc-900 to-yellow-950/20 border border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.12)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400 text-amber-300 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
                <Crown className="w-7 h-7 text-amber-400 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    Streak Milestones & Mythic Achievements
                  </span>
                  <span className="px-2.5 py-0.5 rounded text-sm font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    7d · 30d · 100d TIERS
                  </span>
                </div>
                <p className="text-base text-zinc-300 mt-1 leading-relaxed">
                  Celebrate key persistence checkpoints. Unlock permanent chassis traits and credit up to +5,000 XP to your neural core. Current Streak: <strong className="text-amber-400">{stats.streak} Days</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 self-stretch sm:self-auto">
              <button
                onClick={() => handleOpenMilestones(stats.streak >= 100 ? 100 : stats.streak >= 30 ? 30 : 7)}
                className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-zinc-950 font-mono text-base font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] active:scale-95 w-full sm:w-auto"
              >
                <Award className="w-5 h-5 text-zinc-950" />
                <span>INSPECT MILESTONES</span>
              </button>
            </div>
          </div>
        )}

        {/* 6. Combat Log & Daily Tactical Quests Panel - Hidden in Zen Mode */}
        {!isZenMode && (
          <CombatLogPanel
            events={combatLogs}
            quests={quests}
            stats={stats}
            weeklyDays={weeklyDays}
            weeklyGoals={weeklyGoals}
            onToggleQuest={handleToggleQuest}
            onAddQuest={handleAddQuest}
            onDeleteQuest={handleDeleteQuest}
            onResetQuests={handleResetQuests}
            onClearLogs={handleClearCombatLogs}
            onOpenMilestones={() => handleOpenMilestones(stats.streak >= 100 ? 100 : stats.streak >= 30 ? 30 : 7)}
            onToggleWeeklyDay={handleToggleWeeklyDay}
            onToggleWeeklyGoal={handleToggleWeeklyGoal}
            onStepWeeklyGoal={handleStepWeeklyGoal}
            onAddWeeklyGoal={handleAddWeeklyGoal}
            onResetWeeklyWindow={handleResetWeeklyWindow}
          />
        )}

      </main>

      {/* 6.5. Ambient Soundscape Real-Time Visual Equalizer Bar - Hidden in Zen Mode */}
      {!isZenMode && (
        <FooterEqualizerBar
          onOpenSoundscapeModal={() => {
            audioEngine.playClick();
            setIsSoundscapeOpen(true);
          }}
        />
      )}

      {/* 7. Cockpit Footer - Hidden in Zen Mode */}
      {!isZenMode && (
        <footer className="w-full max-w-full overflow-x-hidden border-t border-zinc-800/80 bg-zinc-950/80 py-6 mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-base text-zinc-400">
            <div className="flex items-center gap-3">
              <span className="font-mono text-zinc-200 font-bold">TITAN CORE</span>
              <span>·</span>
              <span>Build #201</span>
              <span>·</span>
              <span>High-Performance ADHD Affirmation & Gratitude Engine</span>
            </div>

            <div className="flex items-center gap-6">
              <button 
                onClick={() => {
                  audioEngine.playClick();
                  setIsSoundscapeOpen(true);
                }}
                className="hover:text-cyan-400 text-cyan-300 transition-colors font-medium flex items-center gap-1.5"
              >
                <span>Soundscapes</span>
              </button>
              <button 
                onClick={() => {
                  audioEngine.playClick();
                  setIsTutorialOpen(true);
                }}
                className="hover:text-white transition-colors font-medium"
              >
                Field Manual
              </button>
              <button 
                onClick={() => {
                  audioEngine.playClick();
                  setIsAlertsOpen(true);
                }}
                className="hover:text-white transition-colors font-medium"
              >
                Raid Alerts
              </button>
              <span className="font-mono text-base text-emerald-400 font-bold">LOCAL ENCRYPTION ACTIVE</span>
            </div>
          </div>
        </footer>
      )}

      {/* Modals & Overlays */}
      <ReactorRechargeModal
        isOpen={isRechargeOpen}
        onClose={() => setIsRechargeOpen(false)}
        onSessionComplete={handleRechargeComplete}
      />

      <GamerCardExporterModal
        isOpen={isExporterOpen}
        onClose={() => setIsExporterOpen(false)}
        stats={stats}
        perk={activePerk}
        slots={slots}
      />

      <AnalyticsDashboardModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        stats={stats}
        logs={logs}
        slots={slots}
        activePerk={activePerk}
        onSimulateMissedDay={handleSimulateMissedDay}
        onRestoreStreak={handleRestoreStreak}
        onEquipStreakFreeze={handleEquipStreakFreeze}
        onOpenMilestones={() => handleOpenMilestones(stats.streak >= 100 ? 100 : stats.streak >= 30 ? 30 : 7)}
      />

      <TutorialOverlay
        isOpen={isTutorialOpen}
        onClose={handleCloseTutorial}
      />

      <TournamentAlertsModal
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
        alerts={alerts}
        onToggleAlert={handleToggleAlert}
      />

      <ProfileVaultModal
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        vaultPerks={vaultPerks}
        onRemoveVaultPerk={handleRemoveVaultPerk}
        stats={stats}
        slots={slots}
        logs={logs}
        onImportData={handleImportData}
      />

      {/* 8. Streak Milestone Celebratory Modal */}
      <StreakMilestoneModal
        isOpen={isMilestoneOpen}
        onClose={() => setIsMilestoneOpen(false)}
        currentStreak={stats.streak}
        initialMilestoneDays={milestoneTargetDays}
        celebratedMilestones={stats.celebratedMilestones}
        onClaimMilestone={handleClaimMilestone}
      />

      {/* 9. Ambient Soundscape Workstation Modal */}
      <AmbientSoundscape
        isOpen={isSoundscapeOpen}
        onClose={() => setIsSoundscapeOpen(false)}
      />


    </div>
  );
}
