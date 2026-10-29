import { Perk, LoadoutSlotData, PlayerStats, DayLog, TournamentAlert, WeaponTier, CombatEvent, DailyQuest, WeeklyQuestDay, WeeklyGoal } from '../types';

export const MYTHIC_PERKS_POOL: Perk[] = [
  {
    id: 'perk_1',
    title: 'VECTOR FOCUS',
    affirmation: 'I control my focus. My energy does not leak.',
    category: 'Focus',
    rarity: 'Mythic',
    subtext: 'High-bandwidth neural lock. Direct your beam at one objective.',
    statBonus: '+28% Target Lock · Zero Leakage',
    dropRate: '0.4%',
    audioSignature: 'Sub-bass pulse 432Hz',
    synergyTag: 'NEURAL_OVERCLOCK',
    synergyName: 'Neural Overclock Resonance',
    synergyDescription: 'Locks together laser focus and sprint velocity into an unbroken flow state.',
    synergyComboBonus: '+40% Focus Coherence · Zero Cognitive Drift'
  },
  {
    id: 'perk_2',
    title: 'HYPER-DRIVE RAILGUN',
    affirmation: 'Hyperfocus is my superpower when I choose the target.',
    category: 'Energy',
    rarity: 'Mythic',
    subtext: 'Channel the ADHD overclock mode into your chosen mission.',
    statBonus: '+35% Sprint Velocity · Overclocked',
    dropRate: '0.8%',
    audioSignature: 'Resonant harmonic 528Hz',
    synergyTag: 'NEURAL_OVERCLOCK',
    synergyName: 'Neural Overclock Resonance',
    synergyDescription: 'Channels raw ADHD hyperfocus directly into the Vector Focus target beam.',
    synergyComboBonus: '+40% Focus Coherence · Zero Cognitive Drift'
  },
  {
    id: 'perk_3',
    title: 'TACTICAL RESPAWN',
    affirmation: 'Errors are never game overs. They are tactical respawn points.',
    category: 'Resilience',
    rarity: 'Legendary',
    subtext: 'Zero shame in a wipe. Analyze the replay, calibrate, and re-engage.',
    statBonus: '+40% Tilt Resistance · Instant Reboot',
    dropRate: '2.1%',
    audioSignature: 'Dual Sine Sweep',
    synergyTag: 'CRYO_IRONCLAD',
    synergyName: 'Cryo-Ironclad Stasis Matrix',
    synergyDescription: 'Binds tactical respawns to cryo-freeze preservation for total tilt immunity.',
    synergyComboBonus: 'Zero Tilt Impact · Dual Failure Defense Matrix'
  },
  {
    id: 'perk_4',
    title: 'HIGH REFRESH CONSCIOUSNESS',
    affirmation: 'My brain operates at 240Hz. I steer the speed instead of fighting it.',
    category: 'Focus',
    rarity: 'Mythic',
    subtext: 'Fast thoughts are a racing engine. Master the steering wheel.',
    statBonus: '+25% Reflex Purity · Flow State',
    dropRate: '0.6%',
    audioSignature: 'Phase-Modulated Drone',
    synergyTag: 'SYNAPSE_VELOCITY',
    synergyName: 'Synapse Kinetic Surge',
    synergyDescription: 'Channels 240Hz rapid neural cognition directly into immediate physical execution.',
    synergyComboBonus: '+32% Flow State Initiation · Anti-Paralysis Lock'
  },
  {
    id: 'perk_5',
    title: 'SQUAD NEXUS',
    affirmation: 'My squad needs my authentic spark, not robotic perfection.',
    category: 'Squad',
    rarity: 'Legendary',
    subtext: 'True teammates value real energy, loyalty, and your creative play.',
    statBonus: '+30% Synergy Aura · High Morale',
    dropRate: '3.4%',
    audioSignature: 'Warm Pentatonic Chime',
    synergyTag: 'SQUADRON_IRONCLAD',
    synergyName: 'Squadron Ironclad Equilibrium',
    synergyDescription: 'Synergizes team morale with cooling reset protocols to protect the whole fireteam.',
    synergyComboBonus: '+35% Morale Equilibrium · Coolant Surge Venting'
  },
  {
    id: 'perk_6',
    title: 'LOBBY RESET PROTOCOL',
    affirmation: 'When tilted, I vent the heat. Calm is the ultimate flex.',
    category: 'Resilience',
    rarity: 'Exotic',
    subtext: 'Disengage before overheating. The strongest gamer is unshakeable.',
    statBonus: '+50% Coolant Flow · Zen Armor',
    dropRate: '1.2%',
    audioSignature: 'Crystalline Lowpass Bell',
    synergyTag: 'SQUADRON_IRONCLAD',
    synergyName: 'Squadron Ironclad Equilibrium',
    synergyDescription: 'Vents accumulated heat and protects squad focus with unshakeable composure.',
    synergyComboBonus: '+35% Morale Equilibrium · Coolant Surge Venting'
  },
  {
    id: 'perk_7',
    title: 'MOMENTUM SPARK',
    affirmation: 'Action destroys brain lag. Five seconds of movement breaks any freeze.',
    category: 'Energy',
    rarity: 'Legendary',
    subtext: 'Paralysis ends the instant your hands touch the controls.',
    statBonus: '+22% Kinetic Drive · Anti-Procrastination',
    dropRate: '2.8%',
    audioSignature: 'Sawtooth Harmonic Lift',
    synergyTag: 'SYNAPSE_VELOCITY',
    synergyName: 'Synapse Kinetic Surge',
    synergyDescription: 'Destroys dopamine latency and breaks executive function freezes.',
    synergyComboBonus: '+32% Flow State Initiation · Anti-Paralysis Lock'
  },
  {
    id: 'perk_8',
    title: 'TITAN PRIME DISCIPLINE',
    affirmation: 'I do not wait for motivation. I boot the protocol and generate my own fire.',
    category: 'Focus',
    rarity: 'Mythic',
    subtext: 'Motivation is a byproduct of execution. Start small, finish massive.',
    statBonus: '+45% Willpower Output · Core Reactor',
    dropRate: '0.3%',
    audioSignature: 'Deep Sub Drone 60Hz',
    synergyTag: 'NEURAL_OVERCLOCK',
    synergyName: 'Neural Overclock Resonance',
    synergyDescription: 'Generates self-sustaining motivation loops when paired with high-bandwidth focus.',
    synergyComboBonus: '+50% Willpower Core Output · Anti-Distraction Shield'
  },
  {
    id: 'perk_streak_freeze',
    title: 'CRYO STREAK FREEZE',
    affirmation: 'A missed day does not shatter my momentum. My persistence is cryo-shielded.',
    category: 'Resilience',
    rarity: 'Mythic',
    subtext: 'Equipped cryo-preservation matrix. If daily logging is missed, your streak counter freezes in stasis instead of resetting to zero.',
    statBonus: 'Cryo-Shielding · Zero Streak Reset on Missed Days',
    dropRate: '0.5%',
    audioSignature: 'Sub-Zero Shimmer 432Hz',
    isStreakFreeze: true,
    synergyTag: 'CRYO_IRONCLAD',
    synergyName: 'Cryo-Ironclad Stasis Matrix',
    synergyDescription: 'Cryo-preserves streak progression and binds with Tactical Respawn to eliminate game-over guilt.',
    synergyComboBonus: 'Zero Tilt Impact · Dual Failure Defense Matrix'
  }
];

export const INITIAL_LOADOUT_SLOTS: LoadoutSlotData[] = [
  {
    id: 'slot_boss',
    label: 'SLOT 01',
    title: 'The Boss Win',
    prompt: 'What was your victory today? (Big or small, you took ground)',
    placeholder: 'e.g., Aced the science lab & clutched a 1v3 in Discord...',
    content: 'Finished the science robotics presentation early and got the top score.',
    locked: true,
    timestamp: 'Today · 14:20',
    presetHints: [
      'Finished school boss fight without procrastination',
      'Clutched the final round in gaming session',
      'Organized my desk battlestation setup',
      'Practiced guitar / skateboard tricks for 20 mins',
      'Spoke up during class when called upon'
    ]
  },
  {
    id: 'slot_squad',
    label: 'SLOT 02',
    title: 'Squad Support',
    prompt: 'Who had your back today? (Friend, parent, pet, coach, teammate)',
    placeholder: 'e.g., Marcus shared notes, mom made loaded nachos...',
    content: 'Leo sent the missing physics equations and mom made homemade burgers.',
    locked: true,
    timestamp: 'Today · 15:45',
    presetHints: [
      'Squad queued up together and communicated cleanly',
      'Dad helped me troubleshoot the audio glitch',
      'My dog sat by my feet while doing homework',
      'Teacher explained the tough problem patiently',
      'My best friend hyped me up after a rough match'
    ]
  },
  {
    id: 'slot_energy',
    label: 'SLOT 03',
    title: 'Power Surge',
    prompt: 'What gave you pure energy today? (A song, moment, laugh, workout)',
    placeholder: 'e.g., That new drum & bass drop, running with my dog...',
    content: 'Discovered a 140 BPM synthwave track that gave me pure instant focus.',
    locked: true,
    timestamp: 'Today · 16:10',
    presetHints: [
      'Found a god-tier soundtrack playlist on repeat',
      'Cold water splash & 15 pushups before sitting down',
      'Cracked up laughing with friends at lunch',
      'Took a 15-minute walk outside in the fresh breeze',
      'Cleaned up my inventory and felt instant mental clarity'
    ]
  }
];

export const INITIAL_STATS: PlayerStats = {
  level: 14,
  xp: 3450,
  nextLevelXp: 4000,
  streak: 8,
  bestStreak: 12,
  shieldPercentage: 100,
  totalWins: 42,
  rechargeMinutes: 38,
  weaponTier: 'Titan Prime',
  lastLoggedDate: new Date().toISOString().slice(0, 10),
  streakFrozenToday: false,
  streakFreezeUsedCount: 0
};

export const INITIAL_DAY_LOGS: DayLog[] = [
  {
    date: 'Yesterday',
    bossWin: 'Finished history chapter review without getting distracted once.',
    squadSupport: 'Coach praised my defensive rotation in basketball practice.',
    powerSurge: 'Smashed a 20-minute bodyweight circuit before dinner.',
    perkTitle: 'VECTOR FOCUS',
    xpGained: 450
  },
  {
    date: '2 Days Ago',
    bossWin: 'Fixed the broken Discord audio bot script on my server.',
    squadSupport: 'Older brother taught me how to configure the audio compressor.',
    powerSurge: 'Listening to Japanese lo-fi beats while sketching mecha.',
    perkTitle: 'HYPER-DRIVE RAILGUN',
    xpGained: 450
  },
  {
    date: '3 Days Ago',
    bossWin: 'Stood up for a classmate during lunch group chat.',
    squadSupport: 'Mom cheered me on at soccer drills in the rain.',
    powerSurge: 'Hot shower and cold smoothie after high-intensity training.',
    perkTitle: 'TACTICAL RESPAWN',
    xpGained: 450
  },
  {
    date: '4 Days Ago',
    bossWin: 'Cleaned entire room and wiped down monitor screens.',
    squadSupport: 'Teammates gave positive callouts in ranked match.',
    powerSurge: 'Skating down the hill at sunset with my favorite playlist.',
    perkTitle: 'LOBBY RESET PROTOCOL',
    xpGained: 450
  }
];

export const INITIAL_ALERTS: TournamentAlert[] = [
  {
    id: 'alert_1',
    title: 'DAILY CORE RESET',
    message: 'Global daily reset occurs at 00:00 UTC. Lock in your 3 loadout slots to maintain streak protection.',
    time: 'Every day @ 20:00',
    type: 'daily_reset',
    enabled: true,
    priority: 'high'
  },
  {
    id: 'alert_2',
    title: 'CORE SHIELD DECAY WATCH',
    message: 'Shield falls to 0% if daily gratitude slots are unsealed by nightfall.',
    time: '2 hours before reset',
    type: 'shield_alert',
    enabled: true,
    priority: 'normal'
  },
  {
    id: 'alert_3',
    title: 'STREAK LEVEL MILESTONE',
    message: 'Streak Day 10 unlocks the Mythic Holo Banner skin for Gamer Card export.',
    time: 'Milestone target',
    type: 'streak_checkpoint',
    enabled: true,
    priority: 'normal'
  },
  {
    id: 'alert_4',
    title: 'CRYO STREAK DEFENSE WATCH',
    message: 'Equip [CRYO STREAK FREEZE] from the Mythic Perk Deck to prevent active streak resets if you skip a logging rotation.',
    time: 'Persistent watch',
    type: 'streak_checkpoint',
    enabled: true,
    priority: 'high'
  }
];

export const INITIAL_COMBAT_LOGS: CombatEvent[] = [
  {
    id: 'evt_1',
    title: 'Slot 01 ("The Boss Win") Sealed',
    description: 'Robotics presentation win logged and encrypted into Core Shield.',
    type: 'slot_lock',
    xpAwarded: 150,
    timestamp: '14:20'
  },
  {
    id: 'evt_2',
    title: 'Slot 02 ("Squad Support") Sealed',
    description: 'Leo & Mom support vector secured into Core Shield telemetry.',
    type: 'slot_lock',
    xpAwarded: 150,
    timestamp: '15:45'
  },
  {
    id: 'evt_3',
    title: 'Slot 03 ("Power Surge") Sealed',
    description: 'Synthwave playlist flow state registered into energy reserves.',
    type: 'slot_lock',
    xpAwarded: 150,
    timestamp: '16:10'
  },
  {
    id: 'evt_4',
    title: 'Core Shield Overcharged (100%)',
    description: 'Maximum defense barrier active. Tilt vulnerability reduced to 0%.',
    type: 'shield_max',
    xpAwarded: 200,
    timestamp: '16:11'
  },
  {
    id: 'evt_5',
    title: 'Deep Work Focus Burst Complete',
    description: '25-minute Pomodoro session concluded with zero tab leakage.',
    type: 'deep_work',
    xpAwarded: 250,
    timestamp: '15:15'
  }
];

export const INITIAL_DAILY_QUESTS: DailyQuest[] = [
  {
    id: 'quest_1',
    title: 'Read 10 pages of book or tactical manual',
    category: 'Intel',
    completed: true,
    xpReward: 75,
    createdAt: '08:30'
  },
  {
    id: 'quest_2',
    title: 'Exercise or physical stretch for 30 mins',
    category: 'Physical',
    completed: false,
    xpReward: 100,
    createdAt: '09:00'
  },
  {
    id: 'quest_3',
    title: 'Execute 1 full Deep Work focus block (25m)',
    category: 'Focus',
    completed: true,
    xpReward: 100,
    createdAt: '11:15'
  },
  {
    id: 'quest_4',
    title: 'Lock in all 3 gratitude loadout slots',
    category: 'Tactical',
    completed: false,
    xpReward: 150,
    createdAt: '12:00'
  }
];

export const INITIAL_WEEKLY_DAYS: WeeklyQuestDay[] = [
  { id: 'wday_0', dayLabel: 'MON', dayName: 'Day 1 · Mon', dayIndex: 0, isCompleted: true, isToday: false, xpReward: 100 },
  { id: 'wday_1', dayLabel: 'TUE', dayName: 'Day 2 · Tue', dayIndex: 1, isCompleted: true, isToday: false, xpReward: 100 },
  { id: 'wday_2', dayLabel: 'WED', dayName: 'Day 3 · Wed', dayIndex: 2, isCompleted: true, isToday: false, xpReward: 100 },
  { id: 'wday_3', dayLabel: 'THU', dayName: 'Day 4 · Thu', dayIndex: 3, isCompleted: true, isToday: false, xpReward: 100 },
  { id: 'wday_4', dayLabel: 'FRI', dayName: 'Day 5 · Fri', dayIndex: 4, isCompleted: true, isToday: true, xpReward: 100 },
  { id: 'wday_5', dayLabel: 'SAT', dayName: 'Day 6 · Sat', dayIndex: 5, isCompleted: false, isToday: false, xpReward: 100 },
  { id: 'wday_6', dayLabel: 'SUN', dayName: 'Day 7 · Sun', dayIndex: 6, isCompleted: false, isToday: false, xpReward: 100 }
];

export const INITIAL_WEEKLY_GOALS: WeeklyGoal[] = [
  {
    id: 'wgoal_1',
    title: 'Maintain 7-Day Continuous Streak Lock',
    category: 'Tactical',
    currentCount: 5,
    targetCount: 7,
    unit: 'days',
    completed: false,
    xpReward: 350
  },
  {
    id: 'wgoal_2',
    title: 'Complete 5 Deep Work Focus Blocks (25m+)',
    category: 'Focus',
    currentCount: 4,
    targetCount: 5,
    unit: 'blocks',
    completed: false,
    xpReward: 250
  },
  {
    id: 'wgoal_3',
    title: 'Clear 15 Daily Tactical Objectives',
    category: 'Intel',
    currentCount: 11,
    targetCount: 15,
    unit: 'quests',
    completed: false,
    xpReward: 200
  },
  {
    id: 'wgoal_4',
    title: 'Log 4 Physical Training or Mobility Blocks',
    category: 'Physical',
    currentCount: 3,
    targetCount: 4,
    unit: 'sessions',
    completed: false,
    xpReward: 250
  },
  {
    id: 'wgoal_5',
    title: 'Execute 5 Evening Recovery & Hydration Resets',
    category: 'Recovery',
    currentCount: 4,
    targetCount: 5,
    unit: 'resets',
    completed: false,
    xpReward: 150
  }
];

const STORAGE_KEYS = {
  STATS: 'titan_core_stats',
  SLOTS: 'titan_core_slots',
  ACTIVE_PERK: 'titan_core_active_perk',
  VAULT_PERKS: 'titan_core_vault_perks',
  LOGS: 'titan_core_logs',
  ALERTS: 'titan_core_alerts',
  WEAPON_TIER: 'titan_core_weapon_tier',
  HAS_SEEN_TUTORIAL: 'titan_core_tutorial_seen',
  COMBAT_LOGS: 'titan_core_combat_events',
  DAILY_QUESTS: 'titan_core_daily_quests',
  WEEKLY_DAYS: 'titan_core_weekly_days',
  WEEKLY_GOALS: 'titan_core_weekly_goals'
};

export function loadStoredData() {
  try {
    const statsStr = localStorage.getItem(STORAGE_KEYS.STATS);
    const slotsStr = localStorage.getItem(STORAGE_KEYS.SLOTS);
    const activePerkStr = localStorage.getItem(STORAGE_KEYS.ACTIVE_PERK);
    const vaultPerksStr = localStorage.getItem(STORAGE_KEYS.VAULT_PERKS);
    const logsStr = localStorage.getItem(STORAGE_KEYS.LOGS);
    const alertsStr = localStorage.getItem(STORAGE_KEYS.ALERTS);
    const tierStr = localStorage.getItem(STORAGE_KEYS.WEAPON_TIER);
    const tutorialSeenStr = localStorage.getItem(STORAGE_KEYS.HAS_SEEN_TUTORIAL);
    const combatLogsStr = localStorage.getItem(STORAGE_KEYS.COMBAT_LOGS);
    const questsStr = localStorage.getItem(STORAGE_KEYS.DAILY_QUESTS);
    const weeklyDaysStr = localStorage.getItem(STORAGE_KEYS.WEEKLY_DAYS);
    const weeklyGoalsStr = localStorage.getItem(STORAGE_KEYS.WEEKLY_GOALS);

    return {
      stats: statsStr ? { ...INITIAL_STATS, ...(JSON.parse(statsStr) as PlayerStats) } : INITIAL_STATS,
      slots: slotsStr ? (JSON.parse(slotsStr) as LoadoutSlotData[]) : INITIAL_LOADOUT_SLOTS,
      activePerk: activePerkStr ? (JSON.parse(activePerkStr) as Perk) : MYTHIC_PERKS_POOL[0],
      vaultPerks: vaultPerksStr ? (JSON.parse(vaultPerksStr) as Perk[]) : [MYTHIC_PERKS_POOL[0], MYTHIC_PERKS_POOL[1]],
      logs: logsStr ? (JSON.parse(logsStr) as DayLog[]) : INITIAL_DAY_LOGS,
      alerts: alertsStr ? (JSON.parse(alertsStr) as TournamentAlert[]) : INITIAL_ALERTS,
      weaponTier: (tierStr as WeaponTier) || 'Titan Prime',
      tutorialSeen: tutorialSeenStr === 'true',
      combatLogs: combatLogsStr ? (JSON.parse(combatLogsStr) as CombatEvent[]) : INITIAL_COMBAT_LOGS,
      quests: questsStr ? (JSON.parse(questsStr) as DailyQuest[]) : INITIAL_DAILY_QUESTS,
      weeklyDays: weeklyDaysStr ? (JSON.parse(weeklyDaysStr) as WeeklyQuestDay[]) : INITIAL_WEEKLY_DAYS,
      weeklyGoals: weeklyGoalsStr ? (JSON.parse(weeklyGoalsStr) as WeeklyGoal[]) : INITIAL_WEEKLY_GOALS
    };
  } catch (err) {
    console.error('Failed to load local storage:', err);
    return {
      stats: INITIAL_STATS,
      slots: INITIAL_LOADOUT_SLOTS,
      activePerk: MYTHIC_PERKS_POOL[0],
      vaultPerks: [MYTHIC_PERKS_POOL[0], MYTHIC_PERKS_POOL[1]],
      logs: INITIAL_DAY_LOGS,
      alerts: INITIAL_ALERTS,
      weaponTier: 'Titan Prime' as WeaponTier,
      tutorialSeen: false,
      combatLogs: INITIAL_COMBAT_LOGS,
      quests: INITIAL_DAILY_QUESTS,
      weeklyDays: INITIAL_WEEKLY_DAYS,
      weeklyGoals: INITIAL_WEEKLY_GOALS
    };
  }
}

export function saveStats(stats: PlayerStats) {
  try {
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
  } catch (e) {
    console.warn(e);
  }
}

export function saveSlots(slots: LoadoutSlotData[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.SLOTS, JSON.stringify(slots));
  } catch (e) {
    console.warn(e);
  }
}

export function saveActivePerk(perk: Perk) {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PERK, JSON.stringify(perk));
  } catch (e) {
    console.warn(e);
  }
}

export function saveVaultPerks(perks: Perk[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.VAULT_PERKS, JSON.stringify(perks));
  } catch (e) {
    console.warn(e);
  }
}

export function saveWeaponTier(tier: WeaponTier) {
  try {
    localStorage.setItem(STORAGE_KEYS.WEAPON_TIER, tier);
  } catch (e) {
    console.warn(e);
  }
}

export function saveTutorialSeen(seen: boolean) {
  try {
    localStorage.setItem(STORAGE_KEYS.HAS_SEEN_TUTORIAL, seen ? 'true' : 'false');
  } catch (e) {
    console.warn(e);
  }
}

export function saveCombatLogs(events: CombatEvent[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.COMBAT_LOGS, JSON.stringify(events));
  } catch (e) {
    console.warn(e);
  }
}

export function saveDailyQuests(quests: DailyQuest[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.DAILY_QUESTS, JSON.stringify(quests));
  } catch (e) {
    console.warn(e);
  }
}

export function saveWeeklyDays(days: WeeklyQuestDay[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.WEEKLY_DAYS, JSON.stringify(days));
  } catch (e) {
    console.warn(e);
  }
}

export function saveWeeklyGoals(goals: WeeklyGoal[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.WEEKLY_GOALS, JSON.stringify(goals));
  } catch (e) {
    console.warn(e);
  }
}

