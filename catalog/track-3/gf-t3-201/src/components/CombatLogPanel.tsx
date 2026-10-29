import React, { useState, useRef, useEffect } from 'react';
import { 
  Terminal, 
  ShieldCheck, 
  Zap, 
  Flame, 
  Award, 
  Timer, 
  Sparkles, 
  Trash2, 
  Activity, 
  Check, 
  Plus, 
  Target, 
  RotateCcw, 
  BookOpen, 
  Dumbbell, 
  Brain, 
  Coffee, 
  CheckCircle2, 
  ArrowRight, 
  Snowflake, 
  Crown, 
  Calendar, 
  ChevronRight,
  TrendingUp,
  Clock,
  Layers,
  ChevronUp,
  ChevronDown,
  CheckSquare,
  BarChart3
} from 'lucide-react';
import { CombatEvent, DailyQuest, PlayerStats, WeeklyQuestDay, WeeklyGoal } from '../types';
import { audioEngine } from '../utils/audio';
import { INITIAL_WEEKLY_DAYS, INITIAL_WEEKLY_GOALS } from '../utils/storage';

interface CombatLogPanelProps {
  events: CombatEvent[];
  quests: DailyQuest[];
  stats?: PlayerStats;
  weeklyDays?: WeeklyQuestDay[];
  weeklyGoals?: WeeklyGoal[];
  onToggleQuest: (questId: string) => void;
  onAddQuest: (title: string, category: DailyQuest['category'], xpReward: number) => void;
  onDeleteQuest: (questId: string) => void;
  onResetQuests: () => void;
  onClearLogs: () => void;
  onOpenMilestones?: () => void;
  onToggleWeeklyDay?: (dayId: string) => void;
  onToggleWeeklyGoal?: (goalId: string) => void;
  onStepWeeklyGoal?: (goalId: string, increment: number) => void;
  onAddWeeklyGoal?: (title: string, category: WeeklyGoal['category'], targetCount: number, unit: string, xpReward: number) => void;
  onResetWeeklyWindow?: () => void;
}

export const CombatLogPanel: React.FC<CombatLogPanelProps> = ({ 
  events, 
  quests,
  stats,
  weeklyDays: externalWeeklyDays,
  weeklyGoals: externalWeeklyGoals,
  onToggleQuest,
  onAddQuest,
  onDeleteQuest,
  onResetQuests,
  onClearLogs,
  onOpenMilestones,
  onToggleWeeklyDay,
  onToggleWeeklyGoal,
  onStepWeeklyGoal,
  onAddWeeklyGoal,
  onResetWeeklyWindow
}) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Active View Tab in Daily Quest Module
  const [activeQuestTab, setActiveQuestTab] = useState<'all' | 'weekly_window' | 'daily_quests'>('all');

  // Internal Weekly State (used if not passed from parent)
  const [localWeeklyDays, setLocalWeeklyDays] = useState<WeeklyQuestDay[]>(INITIAL_WEEKLY_DAYS);
  const [localWeeklyGoals, setLocalWeeklyGoals] = useState<WeeklyGoal[]>(INITIAL_WEEKLY_GOALS);

  const weeklyDays = externalWeeklyDays || localWeeklyDays;
  const weeklyGoals = externalWeeklyGoals || localWeeklyGoals;

  // New Daily Quest Input State
  const [newQuestTitle, setNewQuestTitle] = useState('');
  const [newQuestCategory, setNewQuestCategory] = useState<DailyQuest['category']>('Intel');
  const [newQuestXp, setNewQuestXp] = useState<number>(75);
  const [showAddForm, setShowAddForm] = useState(false);

  // New Weekly Goal Input State
  const [showAddWeeklyGoalForm, setShowAddWeeklyGoalForm] = useState(false);
  const [newWeeklyGoalTitle, setNewWeeklyGoalTitle] = useState('');
  const [newWeeklyGoalCategory, setNewWeeklyGoalCategory] = useState<WeeklyGoal['category']>('Tactical');
  const [newWeeklyGoalTarget, setNewWeeklyGoalTarget] = useState<number>(5);
  const [newWeeklyGoalUnit, setNewWeeklyGoalUnit] = useState('sessions');
  const [newWeeklyGoalXp, setNewWeeklyGoalXp] = useState<number>(250);

  // Calculate Daily Quests Progress
  const totalQuests = quests.length;
  const completedQuests = quests.filter((q) => q.completed).length;
  const dailyProgressPercent = totalQuests > 0 ? Math.round((completedQuests / totalQuests) * 100) : 0;
  const dailyEarnedXp = quests.filter((q) => q.completed).reduce((sum, q) => sum + q.xpReward, 0);
  const totalPossibleDailyXp = quests.reduce((sum, q) => sum + q.xpReward, 0);

  // Calculate 7-Day Streak Window Progress
  const totalWeeklyDays = weeklyDays.length;
  const completedWeeklyDays = weeklyDays.filter((d) => d.isCompleted).length;
  const weeklyDaysPercent = totalWeeklyDays > 0 ? Math.round((completedWeeklyDays / totalWeeklyDays) * 100) : 0;
  const weeklyDaysEarnedXp = weeklyDays.filter((d) => d.isCompleted).reduce((sum, d) => sum + d.xpReward, 0);

  // Calculate Weekly Goals Checklist Progress
  const totalWeeklyGoals = weeklyGoals.length;
  const completedWeeklyGoals = weeklyGoals.filter((g) => g.completed).length;
  const weeklyGoalsPercent = totalWeeklyGoals > 0 ? Math.round((completedWeeklyGoals / totalWeeklyGoals) * 100) : 0;

  // Quick preset objectives
  const PRESET_OBJECTIVES = [
    { title: 'Read 10 pages of book or tactical manual', category: 'Intel' as const, xp: 75, icon: <BookOpen className="w-4 h-4" /> },
    { title: 'Exercise or physical stretch for 30 mins', category: 'Physical' as const, xp: 100, icon: <Dumbbell className="w-4 h-4" /> },
    { title: '20 mins deliberate practice / skill grind', category: 'Focus' as const, xp: 100, icon: <Brain className="w-4 h-4" /> },
    { title: 'Hydrate with 2L water & take morning fuel', category: 'Recovery' as const, xp: 50, icon: <Coffee className="w-4 h-4" /> },
    { title: 'Clean and reset gaming battlestation desk', category: 'Tactical' as const, xp: 75, icon: <Sparkles className="w-4 h-4" /> }
  ];

  const handleCreateQuest = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newQuestTitle.trim()) return;
    audioEngine.playSlotLock();
    onAddQuest(newQuestTitle.trim(), newQuestCategory, newQuestXp);
    setNewQuestTitle('');
  };

  const handleAddPreset = (preset: typeof PRESET_OBJECTIVES[0]) => {
    audioEngine.playSlotLock();
    if (quests.some((q) => q.title.toLowerCase() === preset.title.toLowerCase())) {
      return;
    }
    onAddQuest(preset.title, preset.category, preset.xp);
  };

  const handleDayCheckboxToggle = (dayId: string) => {
    if (onToggleWeeklyDay) {
      onToggleWeeklyDay(dayId);
    } else {
      audioEngine.playSlotLock();
      setLocalWeeklyDays((prev) =>
        prev.map((d) => (d.id === dayId ? { ...d, isCompleted: !d.isCompleted } : d))
      );
    }
  };

  const handleWeeklyGoalCheckboxToggle = (goalId: string) => {
    if (onToggleWeeklyGoal) {
      onToggleWeeklyGoal(goalId);
    } else {
      audioEngine.playSlotLock();
      setLocalWeeklyGoals((prev) =>
        prev.map((g) => {
          if (g.id === goalId) {
            const nextCompleted = !g.completed;
            return {
              ...g,
              completed: nextCompleted,
              currentCount: nextCompleted ? g.targetCount : 0
            };
          }
          return g;
        })
      );
    }
  };

  const handleWeeklyGoalStep = (goalId: string, increment: number) => {
    if (onStepWeeklyGoal) {
      onStepWeeklyGoal(goalId, increment);
    } else {
      audioEngine.playClick();
      setLocalWeeklyGoals((prev) =>
        prev.map((g) => {
          if (g.id === goalId) {
            const nextCount = Math.max(0, Math.min(g.targetCount, g.currentCount + increment));
            return {
              ...g,
              currentCount: nextCount,
              completed: nextCount >= g.targetCount
            };
          }
          return g;
        })
      );
    }
  };

  const handleCreateWeeklyGoal = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newWeeklyGoalTitle.trim()) return;
    if (onAddWeeklyGoal) {
      onAddWeeklyGoal(
        newWeeklyGoalTitle.trim(),
        newWeeklyGoalCategory,
        newWeeklyGoalTarget,
        newWeeklyGoalUnit,
        newWeeklyGoalXp
      );
    } else {
      audioEngine.playSlotLock();
      const newGoal: WeeklyGoal = {
        id: `wgoal_${Date.now()}`,
        title: newWeeklyGoalTitle.trim(),
        category: newWeeklyGoalCategory,
        currentCount: 0,
        targetCount: newWeeklyGoalTarget,
        unit: newWeeklyGoalUnit,
        completed: false,
        xpReward: newWeeklyGoalXp
      };
      setLocalWeeklyGoals((prev) => [...prev, newGoal]);
    }
    setNewWeeklyGoalTitle('');
    setShowAddWeeklyGoalForm(false);
  };

  const handleResetWeeklyWindowClick = () => {
    if (onResetWeeklyWindow) {
      onResetWeeklyWindow();
    } else {
      audioEngine.playClick();
      setLocalWeeklyDays((prev) => prev.map((d) => ({ ...d, isCompleted: false })));
      setLocalWeeklyGoals((prev) => prev.map((g) => ({ ...g, currentCount: 0, completed: false })));
    }
  };

  const getEventIcon = (type: CombatEvent['type']) => {
    switch (type) {
      case 'slot_lock':
        return <ShieldCheck className="w-5 h-5 text-emerald-400" />;
      case 'deep_work':
        return <Timer className="w-5 h-5 text-cyan-400" />;
      case 'level_up':
        return <Award className="w-5 h-5 text-amber-400" />;
      case 'shield_max':
        return <Flame className="w-5 h-5 text-amber-400" />;
      case 'quest_complete':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'recharge':
        return <Activity className="w-5 h-5 text-purple-400" />;
      case 'streak_freeze':
        return <Snowflake className="w-5 h-5 text-cyan-300 animate-pulse" />;
      case 'mythic_achievement':
        return <Crown className="w-5 h-5 text-amber-300 animate-bounce" />;
      case 'perk_drop':
      default:
        return <Sparkles className="w-5 h-5 text-cyan-400" />;
    }
  };

  const getEventBadgeColor = (type: CombatEvent['type']) => {
    switch (type) {
      case 'slot_lock':
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300';
      case 'deep_work':
        return 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300';
      case 'level_up':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-300';
      case 'shield_max':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-300';
      case 'quest_complete':
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300';
      case 'recharge':
        return 'bg-purple-500/10 border-purple-500/30 text-purple-300';
      case 'streak_freeze':
        return 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200 shadow-[0_0_12px_rgba(56,189,248,0.25)]';
      case 'mythic_achievement':
        return 'bg-gradient-to-r from-amber-500/25 via-yellow-500/20 to-amber-500/25 border-amber-400 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.35)] font-bold';
      case 'perk_drop':
      default:
        return 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300';
    }
  };

  const getCategoryColor = (category: DailyQuest['category'] | WeeklyGoal['category']) => {
    switch (category) {
      case 'Intel':
        return 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300';
      case 'Physical':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-300';
      case 'Focus':
        return 'bg-purple-500/10 border-purple-500/30 text-purple-300';
      case 'Recovery':
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300';
      case 'Tactical':
      default:
        return 'bg-blue-500/10 border-blue-500/30 text-blue-300';
    }
  };

  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-8">
      
      {/* ========================================================
          1. DAILY QUEST & 7-DAY STREAK WINDOW SECTION
          ======================================================== */}
      <div>
        {/* Module Header Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 mb-6 pb-5 border-b border-zinc-800/80">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-[0_0_15px_rgba(34,211,238,0.15)]">
              <Target className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Tactical Quests & Streak Window
                </h3>
                <span className="px-3 py-1 rounded-md text-sm font-semibold font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  {completedWeeklyDays} / {totalWeeklyDays} DAYS SECURED
                </span>
                {completedWeeklyDays === 7 && (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-semibold font-mono bg-emerald-500/20 border border-emerald-400 text-emerald-300 animate-pulse">
                    <Flame className="w-4 h-4 text-emerald-400" />
                    7-DAY STREAK LOCKED
                  </span>
                )}
              </div>
              <p className="text-base text-zinc-300 mt-1 leading-relaxed">
                Track personal habits across the 7-day streak window and check off today's daily tactical objectives for instant XP.
              </p>
            </div>
          </div>

          {/* Quick Action Navigation & Forms */}
          <div className="flex items-center gap-2.5 flex-wrap self-start lg:self-center shrink-0">
            {/* View Filter Scope Tabs */}
            <div className="bg-zinc-950 p-1 rounded-xl border border-zinc-800 flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  audioEngine.playClick();
                  setActiveQuestTab('all');
                }}
                className={`min-h-[44px] px-3.5 py-2 rounded-lg text-base font-bold transition-all ${
                  activeQuestTab === 'all'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                All Views
              </button>
              <button
                type="button"
                onClick={() => {
                  audioEngine.playClick();
                  setActiveQuestTab('weekly_window');
                }}
                className={`min-h-[44px] px-3.5 py-2 rounded-lg text-base font-bold flex items-center gap-1.5 transition-all ${
                  activeQuestTab === 'weekly_window'
                    ? 'bg-cyan-500 text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-cyan-300'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>7-Day Window</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  audioEngine.playClick();
                  setActiveQuestTab('daily_quests');
                }}
                className={`min-h-[44px] px-3.5 py-2 rounded-lg text-base font-bold flex items-center gap-1.5 transition-all ${
                  activeQuestTab === 'daily_quests'
                    ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-emerald-300'
                }`}
              >
                <CheckSquare className="w-4 h-4" />
                <span>Daily Quests</span>
              </button>
            </div>

            {/* Add Daily Quest Button */}
            <button
              onClick={() => {
                audioEngine.playClick();
                setShowAddForm(!showAddForm);
              }}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-mono text-base font-bold flex items-center gap-2 transition-all shadow-md active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <span>{showAddForm ? 'CLOSE' : '+ QUEST'}</span>
            </button>
          </div>
        </div>

        {/* ========================================================
            SUBSECTION A: 7-DAY STREAK WINDOW PROGRESS BAR & CHECKBOXES
            ======================================================== */}
        {(activeQuestTab === 'all' || activeQuestTab === 'weekly_window') && (
          <div className="bg-zinc-950/90 border border-cyan-500/30 rounded-2xl p-5 sm:p-6 mb-6 shadow-inner space-y-5">
            {/* 7-Day Window Title & Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-5 h-5 text-cyan-400" />
                <span className="text-lg font-bold text-white tracking-tight">
                  7-Day Streak Window Progression
                </span>
                <span className="px-3 py-1 rounded-md text-sm font-semibold font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  {completedWeeklyDays} / {totalWeeklyDays} DAYS ({weeklyDaysPercent}%)
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-emerald-400 font-mono text-base font-bold tabular-nums">
                  +{weeklyDaysEarnedXp} XP EARNED
                </span>
                <span className="text-zinc-600">|</span>
                <button
                  type="button"
                  onClick={handleResetWeeklyWindowClick}
                  className="text-sm font-semibold font-mono text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 transition-colors"
                  title="Reset 7-day streak cycle for a new weekly rotation"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>RESET CYCLE</span>
                </button>
              </div>
            </div>

            {/* VISUAL PROGRESS BAR ACROSS THE ENTIRE 7-DAY STREAK WINDOW */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-base font-mono">
                <span className="text-zinc-400 flex items-center gap-2 font-medium">
                  <Flame className="w-4 h-4 text-amber-400" />
                  WEEKLY STREAK INTEGRITY TRACK:
                </span>
                <span className="text-zinc-300 font-bold">
                  {completedWeeklyDays === 7 
                    ? '🏆 7/7 DAYS COMPLETED · OVERDRIVE BONUS ACTIVE' 
                    : `${7 - completedWeeklyDays} days until 7/7 Overdrive (+500 XP)`}
                </span>
              </div>

              {/* High-Tech Segmented Progress Bar */}
              <div className="relative w-full h-5 bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden p-0.5">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 transition-all duration-500 shadow-[0_0_15px_rgba(34,211,238,0.5)]"
                  style={{ width: `${weeklyDaysPercent}%` }}
                />
                
                {/* 7 Checkpoint Tick Lines */}
                <div className="absolute inset-0 flex justify-between pointer-events-none px-4 items-center">
                  {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                    <div 
                      key={num} 
                      className={`w-0.5 h-2.5 transition-colors ${
                        completedWeeklyDays >= num ? 'bg-zinc-950/70' : 'bg-zinc-700'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-zinc-400 font-mono pt-0.5">
                <span>Start: Day 1 (Mon)</span>
                <span className="text-cyan-400 font-bold">Target: 7-Day Window Closure</span>
                <span>Day 7 (Sun) · Milestone Overdrive</span>
              </div>
            </div>

            {/* 7-DAY STREAK WINDOW INTERACTIVE CHECKBOXES SECTION */}
            <div>
              <div className="text-sm font-semibold font-mono text-zinc-400 mb-3 flex items-center justify-between">
                <span>7-DAY STREAK WINDOW CHECKPOINTS (TAP CHECKBOX TO LOG COMPLETION):</span>
                <span className="text-zinc-500">Auto-synced with active streak</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {weeklyDays.map((day) => {
                  return (
                    <div
                      key={day.id}
                      onClick={() => handleDayCheckboxToggle(day.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between min-h-[110px] ${
                        day.isCompleted
                          ? 'bg-emerald-950/40 border-emerald-500/50 hover:border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.15)]'
                          : day.isToday
                          ? 'bg-cyan-950/30 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)] ring-1 ring-cyan-400/50'
                          : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      {/* Day Label & Today Badge */}
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-base font-mono font-bold text-white tracking-wider">
                          {day.dayLabel}
                        </span>
                        {day.isToday && (
                          <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-cyan-500/30 text-cyan-300 border border-cyan-400/50 animate-pulse">
                            TODAY
                          </span>
                        )}
                      </div>

                      {/* Day Name / Subtitle */}
                      <div className="text-sm text-zinc-400 font-mono">
                        {day.dayName.split('·')[0].trim()}
                      </div>

                      {/* Checkbox Button + XP Reward */}
                      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDayCheckboxToggle(day.id);
                          }}
                          className={`w-6 h-6 rounded-md flex items-center justify-center border transition-all ${
                            day.isCompleted
                              ? 'bg-emerald-500 border-emerald-400 text-zinc-950 shadow-sm'
                              : 'bg-zinc-800 border-zinc-700 hover:border-cyan-400 text-transparent'
                          }`}
                          title={day.isCompleted ? 'Mark day incomplete' : 'Mark day complete (+100 XP)'}
                        >
                          <Check className={`w-4 h-4 stroke-[3] ${day.isCompleted ? 'opacity-100' : 'opacity-0'}`} />
                        </button>

                        <span className={`text-sm font-mono font-bold ${
                          day.isCompleted ? 'text-emerald-400' : 'text-zinc-500'
                        }`}>
                          +{day.xpReward} XP
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Weekly Strategic Objectives Checklist Header & List */}
            <div className="pt-4 border-t border-zinc-800/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <Award className="w-5 h-5 text-amber-400" />
                  <span className="text-base sm:text-lg font-bold text-white tracking-tight">
                    Weekly Strategic Objectives
                  </span>
                  <span className="px-3 py-1 rounded-md text-sm font-semibold font-mono bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {completedWeeklyGoals} / {totalWeeklyGoals} SECURED ({weeklyGoalsPercent}%)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      audioEngine.playClick();
                      setShowAddWeeklyGoalForm(!showAddWeeklyGoalForm);
                    }}
                    className="text-sm font-semibold font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{showAddWeeklyGoalForm ? 'CANCEL' : '+ ADD WEEKLY GOAL'}</span>
                  </button>
                </div>
              </div>

              {/* Add Custom Weekly Goal Form */}
              {showAddWeeklyGoalForm && (
                <form onSubmit={handleCreateWeeklyGoal} className="bg-zinc-900 border border-cyan-500/40 rounded-xl p-4 mb-4 space-y-3 animate-in fade-in duration-200">
                  <div className="text-sm font-semibold font-mono text-cyan-300 flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    DEPLOY CUSTOM WEEKLY STRATEGIC OBJECTIVE
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <input
                      type="text"
                      value={newWeeklyGoalTitle}
                      onChange={(e) => setNewWeeklyGoalTitle(e.target.value)}
                      placeholder="Goal description (e.g., 'Log 5 workouts', 'Complete 30m reading 6 days')..."
                      className="sm:col-span-5 bg-zinc-950 border border-zinc-700 focus:border-cyan-400 rounded-lg px-3.5 py-2.5 text-base text-white placeholder-zinc-500 outline-none"
                      autoFocus
                    />
                    <select
                      value={newWeeklyGoalCategory}
                      onChange={(e) => setNewWeeklyGoalCategory(e.target.value as WeeklyGoal['category'])}
                      className="sm:col-span-3 bg-zinc-950 border border-zinc-700 text-zinc-200 rounded-lg px-3 py-2.5 text-sm font-semibold font-mono"
                    >
                      <option value="Tactical">Tactical</option>
                      <option value="Focus">Focus</option>
                      <option value="Physical">Physical</option>
                      <option value="Intel">Intel</option>
                      <option value="Recovery">Recovery</option>
                    </select>
                    <div className="sm:col-span-2 flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={newWeeklyGoalTarget}
                        onChange={(e) => setNewWeeklyGoalTarget(parseInt(e.target.value, 10) || 1)}
                        className="w-full bg-zinc-950 border border-zinc-700 text-zinc-200 rounded-lg px-2.5 py-2.5 text-base font-mono text-center"
                        title="Target count"
                      />
                    </div>
                    <div className="sm:col-span-2 flex items-center gap-2">
                      <button
                        type="submit"
                        disabled={!newWeeklyGoalTitle.trim()}
                        className="w-full min-h-[44px] px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-zinc-950 font-bold text-base font-mono transition-colors"
                      >
                        DEPLOY
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Weekly Goals Checklist Items */}
              <div className="space-y-2.5">
                {weeklyGoals.map((goal) => {
                  const goalPercent = Math.min(100, Math.round((goal.currentCount / goal.targetCount) * 100));
                  return (
                    <div
                      key={goal.id}
                      className={`p-3.5 sm:p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        goal.completed
                          ? 'bg-emerald-950/30 border-emerald-500/40 shadow-[0_0_12px_rgba(52,211,153,0.1)]'
                          : 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      {/* Checkbox & Info */}
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => handleWeeklyGoalCheckboxToggle(goal.id)}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                            goal.completed
                              ? 'bg-emerald-500 border-emerald-400 text-zinc-950 shadow-sm active:scale-95'
                              : 'bg-zinc-800 border-zinc-700 hover:border-cyan-400 text-transparent active:scale-95'
                          }`}
                          title={goal.completed ? 'Mark goal incomplete' : 'Mark goal complete'}
                        >
                          <Check className={`w-4 h-4 stroke-[3] ${goal.completed ? 'opacity-100' : 'opacity-0'}`} />
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-base sm:text-lg font-bold tracking-tight ${
                              goal.completed ? 'line-through text-zinc-400' : 'text-white'
                            }`}>
                              {goal.title}
                            </span>
                            <span className={`px-3 py-1 rounded-md text-sm font-semibold font-mono border ${getCategoryColor(goal.category)}`}>
                              {goal.category.toUpperCase()}
                            </span>
                          </div>

                          {/* Mini Progress Bar for each weekly goal */}
                          <div className="flex items-center gap-3 mt-1.5 max-w-md">
                            <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  goal.completed ? 'bg-emerald-400' : 'bg-cyan-400'
                                }`}
                                style={{ width: `${goalPercent}%` }}
                              />
                            </div>
                            <span className="text-sm font-mono text-zinc-400 shrink-0">
                              {goal.currentCount} / {goal.targetCount} {goal.unit} ({goalPercent}%)
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Step Controls & XP Badge */}
                      <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                        {/* Step Buttons */}
                        <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => handleWeeklyGoalStep(goal.id, -1)}
                            disabled={goal.currentCount <= 0}
                            className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-white disabled:opacity-30 rounded hover:bg-zinc-800 transition-colors"
                            title="Decrement progress"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          <span className="px-2 text-sm font-mono font-bold text-zinc-200">
                            {goal.currentCount}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleWeeklyGoalStep(goal.id, 1)}
                            disabled={goal.currentCount >= goal.targetCount}
                            className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-white disabled:opacity-30 rounded hover:bg-zinc-800 transition-colors"
                            title="Increment progress"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                        </div>

                        {/* XP Reward Badge */}
                        <span className={`px-3 py-1 rounded-md text-sm font-semibold font-mono border ${
                          goal.completed
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                            : 'bg-zinc-900 border-zinc-800 text-cyan-400'
                        }`}>
                          +{goal.xpReward} XP
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            SUBSECTION B: TODAY'S DAILY TACTICAL QUESTS
            ======================================================== */}
        {(activeQuestTab === 'all' || activeQuestTab === 'daily_quests') && (
          <div className="space-y-4">
            {/* Daily Objectives Progress Bar Track */}
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-base font-mono">
                <span className="text-zinc-300 font-bold flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  TODAY'S DAILY OBJECTIVES COMPLETION:
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 font-bold tabular-nums">
                    +{dailyEarnedXp} XP CLAIMED
                  </span>
                  <span className="text-zinc-500">/</span>
                  <span className="text-zinc-400 tabular-nums">
                    {totalPossibleDailyXp} XP TOTAL
                  </span>
                </div>
              </div>

              {/* Progress Bar Track */}
              <div className="w-full h-4 bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden p-0.5">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 transition-all duration-500 shadow-[0_0_12px_rgba(34,211,238,0.4)]"
                  style={{ width: `${dailyProgressPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-base text-zinc-400">
                <span>Daily Execution: {dailyProgressPercent}% secured</span>
                <span className="font-mono text-zinc-300">
                  {totalQuests - completedQuests} remaining today
                </span>
              </div>
            </div>

            {/* Inline Add Custom Objective Form (Expandable) */}
            {showAddForm && (
              <form onSubmit={handleCreateQuest} className="bg-zinc-950 border border-cyan-500/30 rounded-2xl p-5 space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-base font-mono font-bold text-cyan-300 flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    CREATE CUSTOM DAILY OBJECTIVE
                  </span>
                  <span className="text-base text-zinc-400">User-Defined Mission</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <input
                    type="text"
                    value={newQuestTitle}
                    onChange={(e) => setNewQuestTitle(e.target.value)}
                    placeholder="Objective name (e.g., 'Read 10 pages', 'Exercise 30 mins')..."
                    className="sm:col-span-6 bg-zinc-900 border border-zinc-700 focus:border-cyan-400 rounded-xl px-4 py-3 text-lg text-white placeholder-zinc-500 outline-none transition-colors"
                    autoFocus
                  />

                  <div className="sm:col-span-3 flex items-center gap-2">
                    <select
                      value={newQuestCategory}
                      onChange={(e) => setNewQuestCategory(e.target.value as DailyQuest['category'])}
                      className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 rounded-xl px-3 py-3 text-base font-mono font-bold outline-none cursor-pointer"
                    >
                      <option value="Intel">Intel (Study / Read)</option>
                      <option value="Physical">Physical (Fitness / Stretch)</option>
                      <option value="Focus">Focus (Deep Work / Coding)</option>
                      <option value="Recovery">Recovery (Hydration / Sleep)</option>
                      <option value="Tactical">Tactical (Habit / Routine)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3 flex items-center gap-2">
                    <select
                      value={newQuestXp}
                      onChange={(e) => setNewQuestXp(parseInt(e.target.value, 10))}
                      className="w-full bg-zinc-900 border border-zinc-700 text-emerald-400 rounded-xl px-3 py-3 text-base font-mono font-bold outline-none cursor-pointer"
                    >
                      <option value={50}>+50 XP</option>
                      <option value={75}>+75 XP</option>
                      <option value={100}>+100 XP</option>
                      <option value={150}>+150 XP</option>
                    </select>

                    <button
                      type="submit"
                      disabled={!newQuestTitle.trim()}
                      className="min-h-[44px] px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-zinc-950 font-bold text-base font-mono transition-colors shrink-0"
                    >
                      DEPLOY
                    </button>
                  </div>
                </div>

                {/* Quick Presets Strip */}
                <div>
                  <div className="text-base font-mono text-zinc-400 mb-2 font-semibold">
                    QUICK-DEPLOY HABIT PRESETS (TAP TO ADD):
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {PRESET_OBJECTIVES.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAddPreset(p)}
                        className="py-1.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-base font-medium flex items-center gap-2 transition-colors active:scale-95"
                      >
                        {p.icon}
                        <span>{p.title.split(' ')[0]} {p.title.split(' ')[1]}</span>
                        <span className="text-emerald-400 font-mono text-base font-bold">+{p.xp}xp</span>
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            )}

            {/* Daily Quests List */}
            <div className="space-y-3">
              {quests.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-zinc-800 rounded-2xl p-6 bg-zinc-950/40">
                  <Target className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                  <div className="text-lg font-bold text-zinc-300">No Daily Objectives Deployed</div>
                  <p className="text-base text-zinc-500 mt-1 max-w-md mx-auto">
                    Click "+ QUEST" or select one of the tactical presets to establish your daily focus missions.
                  </p>
                </div>
              ) : (
                quests.map((quest) => (
                  <div
                    key={quest.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                      quest.completed
                        ? 'bg-zinc-950/90 border-emerald-500/30 shadow-[0_0_15px_rgba(52,211,153,0.08)]'
                        : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    {/* Left: Custom Checkbox + Title */}
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => {
                          onToggleQuest(quest.id);
                        }}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                          quest.completed
                            ? 'bg-emerald-500 border-emerald-400 text-zinc-950 shadow-[0_0_12px_rgba(52,211,153,0.4)] active:scale-90'
                            : 'bg-zinc-900 border-zinc-700 hover:border-cyan-400 text-transparent hover:text-zinc-600 active:scale-90'
                        }`}
                        title={quest.completed ? 'Mark incomplete' : 'Mark complete'}
                      >
                        <Check className={`w-5 h-5 stroke-[3] ${quest.completed ? 'opacity-100' : 'opacity-0'}`} />
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className={`text-lg sm:text-xl font-bold tracking-tight transition-colors ${
                            quest.completed ? 'line-through text-zinc-500' : 'text-white'
                          }`}>
                            {quest.title}
                          </span>

                          <span className={`px-3 py-1 rounded-md text-sm font-semibold font-mono border ${getCategoryColor(quest.category)}`}>
                            {quest.category.toUpperCase()}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-base text-zinc-400 mt-1 font-mono">
                          <span>Logged: {quest.createdAt}</span>
                          <span>·</span>
                          <span className={quest.completed ? 'text-emerald-400 font-bold' : 'text-zinc-400 font-semibold'}>
                            {quest.completed ? 'COMPLETED' : 'PENDING'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: XP Reward Tag + Delete */}
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`px-3 py-1 rounded-md text-sm font-semibold font-mono border ${
                        quest.completed
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                          : 'bg-zinc-900 border-zinc-800 text-cyan-400'
                      }`}>
                        +{quest.xpReward} XP
                      </span>

                      <button
                        onClick={() => {
                          audioEngine.playClick();
                          onDeleteQuest(quest.id);
                        }}
                        className="p-2 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Remove objective"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          2. LIVE ACCOMPLISHMENTS STREAM (COMBAT FEED)
          ======================================================== */}
      <div className="pt-6 border-t border-zinc-800/80">
        {/* Stream Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-cyan-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h4 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Tactical Event Stream
                </h4>
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-semibold bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                  LIVE LOG
                </span>
              </div>
              <p className="text-base text-zinc-400 mt-0.5">
                Real-time dopamine feed of sealed slots, quest completions, focus blocks, and chassis upgrades.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-base font-mono text-zinc-400 font-bold">
              {events.length} LOGGED EVENTS
            </span>
            {events.length > 0 && (
              <button
                onClick={() => {
                  audioEngine.playClick();
                  onClearLogs();
                }}
                className="py-2 px-3.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 text-base font-mono flex items-center gap-2 transition-colors font-semibold"
                title="Clear combat logs"
              >
                <Trash2 className="w-4 h-4" />
                <span>CLEAR</span>
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Events Stream */}
        <div 
          ref={scrollContainerRef}
          className="space-y-3 max-h-60 overflow-y-auto pr-2"
        >
          {events.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-zinc-800 rounded-2xl p-6 bg-zinc-950/40">
              <Terminal className="w-7 h-7 text-zinc-600 mx-auto mb-2" />
              <div className="text-base sm:text-lg font-bold text-zinc-400">Combat Log Cleared</div>
              <div className="text-base text-zinc-500 mt-1">
                Engage with loadouts, deep work timers, daily quests, or perks to populate real-time events.
              </div>
            </div>
          ) : (
            events.map((evt) => (
              <div
                key={evt.id}
                className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700 transition-colors flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                    {getEventIcon(evt.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-base sm:text-lg font-bold text-white tracking-tight">
                        {evt.title}
                      </span>
                      <span className={`px-3 py-1 rounded-md text-sm font-semibold font-mono border ${getEventBadgeColor(evt.type)}`}>
                        {evt.type.toUpperCase().replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-base text-zinc-300 mt-1 leading-relaxed">
                      {evt.description}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {evt.xpAwarded && (
                    <div className="text-base font-mono font-bold text-emerald-400">
                      +{evt.xpAwarded} XP
                    </div>
                  )}
                  <div className="text-base font-mono text-zinc-500 mt-0.5">
                    {evt.timestamp}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </section>
  );
};
