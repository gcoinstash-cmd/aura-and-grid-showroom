export type PerkRarity = 'Mythic' | 'Legendary' | 'Exotic';

export interface Perk {
  id: string;
  title: string;
  affirmation: string;
  category: 'Focus' | 'Resilience' | 'Energy' | 'Squad';
  rarity: PerkRarity;
  subtext: string;
  statBonus: string;
  dropRate: string;
  audioSignature: string;
  isStreakFreeze?: boolean;
  synergyTag?: string;
  synergyName?: string;
  synergyDescription?: string;
  synergyComboBonus?: string;
}

export type SlotKey = 'slot_boss' | 'slot_squad' | 'slot_energy';

export interface LoadoutSlotData {
  id: SlotKey;
  label: string;
  title: string;
  prompt: string;
  placeholder: string;
  content: string;
  locked: boolean;
  timestamp?: string;
  presetHints: string[];
}

export type WeaponTier = 'Scout' | 'Vanguard' | 'Titan Prime';

export interface PlayerStats {
  level: number;
  xp: number;
  nextLevelXp: number;
  streak: number;
  bestStreak: number;
  shieldPercentage: number;
  totalWins: number;
  rechargeMinutes: number;
  weaponTier: WeaponTier;
  lastLoggedDate?: string;
  streakFrozenToday?: boolean;
  streakFreezeUsedCount?: number;
  celebratedMilestones?: number[];
}

export interface StreakMilestone {
  days: number;
  title: string;
  tier: string;
  badge: string;
  quote: string;
  description: string;
  xpReward: number;
  armorUnlock: string;
  soundSignature: string;
}

export interface DayLog {
  date: string;
  bossWin: string;
  squadSupport: string;
  powerSurge: string;
  perkTitle: string;
  xpGained: number;
}

export interface TournamentAlert {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'daily_reset' | 'shield_alert' | 'streak_checkpoint' | 'tournament_drop';
  enabled: boolean;
  priority: 'high' | 'normal';
}

export interface CombatEvent {
  id: string;
  title: string;
  description: string;
  type: 'slot_lock' | 'deep_work' | 'level_up' | 'perk_drop' | 'recharge' | 'shield_max' | 'quest_complete' | 'streak_freeze' | 'mythic_achievement';
  xpAwarded?: number;
  timestamp: string;
  milestoneDays?: number;
}

export interface DailyQuest {
  id: string;
  title: string;
  category: 'Focus' | 'Physical' | 'Intel' | 'Recovery' | 'Tactical';
  completed: boolean;
  xpReward: number;
  createdAt: string;
}

export type SoundscapePresetId = 'deep_void' | 'rain_in_space' | 'cyber_cafe' | 'solar_wind' | 'alpha_flow';

export interface SoundscapePreset {
  id: SoundscapePresetId;
  name: string;
  tagline: string;
  description: string;
  frequencyRange: string;
  accentColor: string;
  badge: string;
  iconName: 'Sparkles' | 'CloudRain' | 'Coffee' | 'Wind' | 'Radio' | 'Disc';
  recommendedState: string;
  noiseType: string;
}

export type HeatmapDayStatus = 'completed' | 'partial' | 'missed' | 'frozen';

export interface GratitudeHeatmapDay {
  dateStr: string;
  displayDate: string;
  displayDay: string;
  dayOfWeek: string;
  dayIndex: number;
  status: HeatmapDayStatus;
  slotsCompleted: number;
  isToday: boolean;
  bossWin?: string;
  squadSupport?: string;
  powerSurge?: string;
  perkTitle?: string;
  xpGained: number;
  streakAtDay: number;
}

export interface WeeklyQuestDay {
  id: string;
  dayLabel: string;
  dayName: string;
  dayIndex: number;
  isCompleted: boolean;
  isToday: boolean;
  dateStr?: string;
  xpReward: number;
}

export interface WeeklyGoal {
  id: string;
  title: string;
  category: 'Focus' | 'Physical' | 'Intel' | 'Recovery' | 'Tactical';
  currentCount: number;
  targetCount: number;
  unit: string;
  completed: boolean;
  xpReward: number;
}

