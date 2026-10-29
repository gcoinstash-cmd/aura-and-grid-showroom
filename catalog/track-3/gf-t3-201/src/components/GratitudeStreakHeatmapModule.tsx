import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Flame, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Snowflake, 
  TrendingUp, 
  Zap, 
  Award, 
  ChevronRight, 
  Clock, 
  ArrowUpRight,
  Filter,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { PlayerStats, LoadoutSlotData, DayLog, Perk, GratitudeHeatmapDay, HeatmapDayStatus } from '../types';
import { generate30DayGratitudeData } from '../utils/heatmapGenerator';
import { audioEngine } from '../utils/audio';

interface GratitudeStreakHeatmapModuleProps {
  stats: PlayerStats;
  slots: LoadoutSlotData[];
  logs: DayLog[];
  activePerk?: Perk;
  onOpenAnalytics?: () => void;
  onFocusSlots?: () => void;
}

type FilterOption = 'all' | 'completed' | 'partial' | 'missed' | 'streak_run';

export const GratitudeStreakHeatmapModule: React.FC<GratitudeStreakHeatmapModuleProps> = ({
  stats,
  slots,
  logs,
  activePerk,
  onOpenAnalytics,
  onFocusSlots
}) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(29); // Default to today (index 29)
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'weeks'>('grid');

  // Generate 30-day data dynamically based on current player state
  const days = useMemo(() => {
    return generate30DayGratitudeData(stats, slots, logs, activePerk);
  }, [stats, slots, logs, activePerk]);

  // Selected day object
  const selectedDay = days[selectedDayIndex] || days[days.length - 1];

  // Telemetry Aggregations
  const completedCount = useMemo(() => days.filter((d) => d.status === 'completed').length, [days]);
  const partialCount = useMemo(() => days.filter((d) => d.status === 'partial').length, [days]);
  const missedCount = useMemo(() => days.filter((d) => d.status === 'missed').length, [days]);
  const frozenCount = useMemo(() => days.filter((d) => d.status === 'frozen').length, [days]);
  const totalXp = useMemo(() => days.reduce((acc, d) => acc + d.xpGained, 0), [days]);
  const completionRate = Math.round((completedCount / 30) * 100);

  // Filtered days for display
  const filteredDays = useMemo(() => {
    if (activeFilter === 'completed') return days.filter((d) => d.status === 'completed');
    if (activeFilter === 'partial') return days.filter((d) => d.status === 'partial');
    if (activeFilter === 'missed') return days.filter((d) => d.status === 'missed');
    if (activeFilter === 'streak_run') {
      const currentStreak = Math.max(1, stats.streak);
      return days.filter((d) => (29 - d.dayIndex) < currentStreak);
    }
    return days;
  }, [days, activeFilter, stats.streak]);

  // Group by weeks for week-by-week view mode
  const weeks = useMemo(() => {
    const chunks: GratitudeHeatmapDay[][] = [];
    // 30 days split into 4 full weeks + 2 days, or 5 weeks of 6/7 days
    for (let i = 0; i < days.length; i += 7) {
      chunks.push(days.slice(i, i + 7));
    }
    return chunks;
  }, [days]);

  const handleSelectDay = (index: number) => {
    audioEngine.playClick();
    setSelectedDayIndex(index);
  };

  const getStatusColor = (status: HeatmapDayStatus, isToday: boolean, isSelected: boolean) => {
    if (isSelected) {
      return 'ring-2 ring-cyan-400 border-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.4)]';
    }

    switch (status) {
      case 'completed':
        return isToday 
          ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200 shadow-[0_0_15px_rgba(52,211,153,0.3)] ring-1 ring-emerald-400/50' 
          : 'bg-emerald-950/60 border-emerald-600/70 text-emerald-300 hover:border-emerald-400 hover:bg-emerald-900/60';
      case 'partial':
        return isToday 
          ? 'bg-amber-950/80 border-amber-400 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.3)] ring-1 ring-amber-400/50' 
          : 'bg-amber-950/60 border-amber-600/70 text-amber-300 hover:border-amber-400 hover:bg-amber-900/60';
      case 'frozen':
        return 'bg-cyan-950/60 border-cyan-400/70 text-cyan-300 hover:border-cyan-300 hover:bg-cyan-900/60';
      case 'missed':
      default:
        return isToday 
          ? 'bg-zinc-900 border-zinc-700 text-zinc-400 ring-1 ring-zinc-500' 
          : 'bg-zinc-900/80 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300';
    }
  };

  const getStatusBadge = (status: HeatmapDayStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="px-3 py-1 rounded-md text-sm font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>100% SEALED · 3/3 SLOTS</span>
          </span>
        );
      case 'partial':
        return (
          <span className="px-3 py-1 rounded-md text-sm font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span>PARTIAL · {selectedDay.slotsCompleted}/3 SLOTS</span>
          </span>
        );
      case 'frozen':
        return (
          <span className="px-3 py-1 rounded-md text-sm font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5">
            <Snowflake className="w-4 h-4 text-cyan-400" />
            <span>CRYO STREAK PRESERVED</span>
          </span>
        );
      case 'missed':
      default:
        return (
          <span className="px-3 py-1 rounded-md text-sm font-mono font-bold bg-zinc-800 text-zinc-400 border border-zinc-700 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-zinc-400" />
            <span>{selectedDay.isToday ? 'INCOMPLETE TODAY' : 'MISSED CYCLE'}</span>
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-full rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-[0_10px_35px_rgba(0,0,0,0.4)] overflow-hidden">
      
      {/* Module Header Strip */}
      <div className="p-6 border-b border-zinc-800/90 bg-zinc-950/60 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.25)]">
            <Calendar className="w-7 h-7" />
          </div>

          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="text-xl sm:text-2xl font-mono font-bold tracking-tight text-white flex items-center gap-2">
                <span>30-DAY GRATITUDE HABIT HEATMAP</span>
              </h3>
              <span className="px-3 py-1 rounded-md text-sm font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                {stats.streak}d ACTIVE RUN
              </span>
              <span className="px-3 py-1 rounded-md text-sm font-mono font-bold bg-purple-500/15 text-purple-300 border border-purple-500/40">
                BEST: {stats.bestStreak}d
              </span>
            </div>
            <p className="text-sm sm:text-base text-zinc-300 font-sans mt-1">
              Visual telemetry of sealed vs missed daily loadouts over a rolling 30-day cycle
            </p>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
          <div className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 shrink-0">
            <div className="text-sm font-mono text-zinc-400 font-medium">COMPLETION</div>
            <div className="text-2xl font-mono font-bold text-emerald-400 tabular-nums">
              {completionRate}% <span className="text-sm text-zinc-400 font-normal">({completedCount}/30)</span>
            </div>
          </div>

          <div className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 shrink-0">
            <div className="text-sm font-mono text-zinc-400 font-medium">TOTAL XP GAINED</div>
            <div className="text-2xl font-mono font-bold text-cyan-400 tabular-nums">
              +{totalXp.toLocaleString()} <span className="text-sm text-zinc-400 font-normal">XP</span>
            </div>
          </div>

          {onOpenAnalytics && (
            <button
              onClick={() => {
                audioEngine.playClick();
                onOpenAnalytics();
              }}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 hover:text-white font-mono text-base font-bold flex items-center gap-2 transition-colors shrink-0"
            >
              <span>TELEMETRY</span>
              <ArrowUpRight className="w-4 h-4 text-cyan-400" />
            </button>
          )}
        </div>
      </div>

      {/* Main Heatmap Body */}
      <div className="p-6 space-y-6">

        {/* Filter Bar & View Toggle */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Segmented Filter Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap p-1.5 bg-zinc-950 rounded-xl border border-zinc-800 w-full sm:w-auto">
            <button
              onClick={() => {
                audioEngine.playClick();
                setActiveFilter('all');
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-mono font-bold transition-all ${
                activeFilter === 'all'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              ALL 30 DAYS
            </button>

            <button
              onClick={() => {
                audioEngine.playClick();
                setActiveFilter('completed');
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-mono font-bold transition-all flex items-center gap-1.5 ${
                activeFilter === 'completed'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                  : 'text-zinc-400 hover:text-emerald-400'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>SEALED ({completedCount})</span>
            </button>

            <button
              onClick={() => {
                audioEngine.playClick();
                setActiveFilter('partial');
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-mono font-bold transition-all flex items-center gap-1.5 ${
                activeFilter === 'partial'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                  : 'text-zinc-400 hover:text-amber-400'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>PARTIAL ({partialCount})</span>
            </button>

            <button
              onClick={() => {
                audioEngine.playClick();
                setActiveFilter('missed');
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-mono font-bold transition-all flex items-center gap-1.5 ${
                activeFilter === 'missed'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/50 shadow-sm'
                  : 'text-zinc-400 hover:text-red-400'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span>MISSED ({missedCount})</span>
            </button>

            <button
              onClick={() => {
                audioEngine.playClick();
                setActiveFilter('streak_run');
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-mono font-bold transition-all flex items-center gap-1.5 ${
                activeFilter === 'streak_run'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-sm'
                  : 'text-zinc-400 hover:text-cyan-400'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-cyan-400" />
              <span>STREAK RUN ({stats.streak}d)</span>
            </button>
          </div>

          {/* Legend Strip */}
          <div className="flex items-center gap-4 text-sm font-mono text-zinc-400 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500 border border-emerald-400" />
              <span>Sealed (3/3)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-500 border border-amber-400" />
              <span>Partial (1-2/3)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-zinc-800 border border-zinc-700" />
              <span>Missed (0/3)</span>
            </div>
            {frozenCount > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-cyan-500 border border-cyan-300" />
                <span>Cryo-Frozen</span>
              </div>
            )}
          </div>
        </div>

        {/* 30-Day Heatmap Grid */}
        <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800/90 shadow-inner">
          <div className="flex items-center justify-between text-sm font-mono text-zinc-400 mb-3 px-1">
            <span>ROLLING TIMELINE (29 DAYS AGO → TODAY)</span>
            <span>CLICK ANY CELL TO INSPECT GRATITUDE ENTRIES</span>
          </div>

          {/* 30 Cells Grid: 6 columns on mobile, 10 on tablet, 15 or 30 on desktop */}
          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 lg:grid-cols-15 xl:grid-cols-15 gap-2.5 sm:gap-3">
            {days.map((day) => {
              const isSelected = day.dayIndex === selectedDay.dayIndex;
              const matchesFilter = filteredDays.some((fd) => fd.dayIndex === day.dayIndex);

              return (
                <button
                  key={day.dateStr}
                  onClick={() => handleSelectDay(day.dayIndex)}
                  className={`min-h-[64px] p-2 rounded-xl border flex flex-col justify-between items-center transition-all cursor-pointer relative select-none group active:scale-95 ${
                    getStatusColor(day.status, day.isToday, isSelected)
                  } ${!matchesFilter ? 'opacity-30' : 'opacity-100'}`}
                  title={`${day.displayDate} (${day.dayOfWeek}) · ${day.status.toUpperCase()}: ${day.slotsCompleted}/3 Slots Sealed`}
                >
                  {/* Top: Day of week */}
                  <div className="w-full flex items-center justify-between text-sm font-mono leading-none">
                    <span className="text-zinc-400 group-hover:text-zinc-200">
                      {day.dayOfWeek}
                    </span>
                    {day.isToday && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    )}
                  </div>

                  {/* Middle: Day number */}
                  <div className="text-lg font-mono font-bold leading-none my-1">
                    {day.displayDay}
                  </div>

                  {/* Bottom: 3-Slot Pips or Status Indicator */}
                  <div className="flex items-center gap-1">
                    {day.status === 'frozen' ? (
                      <Snowflake className="w-3.5 h-3.5 text-cyan-300" />
                    ) : (
                      <>
                        <span className={`w-1.5 h-1.5 rounded-full ${day.slotsCompleted >= 1 ? 'bg-emerald-400' : 'bg-zinc-700'}`} />
                        <span className={`w-1.5 h-1.5 rounded-full ${day.slotsCompleted >= 2 ? 'bg-emerald-400' : 'bg-zinc-700'}`} />
                        <span className={`w-1.5 h-1.5 rounded-full ${day.slotsCompleted >= 3 ? 'bg-emerald-400' : 'bg-zinc-700'}`} />
                      </>
                    )}
                  </div>

                  {/* Today marker label on bottom if today */}
                  {day.isToday && (
                    <div className="absolute -bottom-2 bg-cyan-500 text-zinc-950 font-mono font-bold text-sm px-1.5 py-0.2 rounded shadow-md">
                      TODAY
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Inspector Panel */}
        <div className="p-5 sm:p-6 rounded-2xl bg-zinc-950 border border-zinc-800 relative overflow-hidden transition-all">
          {/* Subtle accent glow */}
          <div className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-10 pointer-events-none ${
            selectedDay.status === 'completed' ? 'bg-emerald-500' :
            selectedDay.status === 'partial' ? 'bg-amber-500' :
            selectedDay.status === 'frozen' ? 'bg-cyan-500' : 'bg-zinc-500'
          }`} />

          <div className="relative z-10 space-y-4">
            
            {/* Inspector Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-mono font-bold text-lg border ${
                  selectedDay.status === 'completed' ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300' :
                  selectedDay.status === 'partial' ? 'bg-amber-500/20 border-amber-400 text-amber-300' :
                  selectedDay.status === 'frozen' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' :
                  'bg-zinc-800 border-zinc-700 text-zinc-400'
                }`}>
                  {selectedDay.displayDay}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xl font-mono font-bold text-white">
                      {selectedDay.displayDate} ({selectedDay.dayOfWeek})
                    </h4>
                    {selectedDay.isToday && (
                      <span className="px-2.5 py-0.5 rounded text-sm font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                        TODAY
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-mono text-zinc-400 mt-0.5">
                    {selectedDay.isToday ? 'Active Logging Cycle' : `${29 - selectedDay.dayIndex} Days Ago`}
                    {selectedDay.streakAtDay > 0 && ` · Streak Position: Day ${selectedDay.streakAtDay}`}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {getStatusBadge(selectedDay.status)}
                <span className="text-base font-mono font-bold text-cyan-400">
                  +{selectedDay.xpGained} XP
                </span>
              </div>
            </div>

            {/* Gratitude Slots Breakdown */}
            <div className="space-y-3">
              <div className="text-sm font-mono text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                <span>SEALED GRATITUDE VECTORS</span>
                {selectedDay.perkTitle && (
                  <span className="text-cyan-400">
                    Mindset: <strong>{selectedDay.perkTitle}</strong>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                
                {/* Slot 01: The Boss Win */}
                <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1.5">
                  <div className="flex items-center justify-between text-sm font-mono">
                    <span className="text-cyan-400 font-bold">SLOT 01 · THE BOSS WIN</span>
                    <span className={selectedDay.bossWin ? 'text-emerald-400' : 'text-zinc-500'}>
                      {selectedDay.bossWin ? 'SEALED' : 'UNSEALED'}
                    </span>
                  </div>
                  <p className="text-base text-zinc-200 font-sans leading-relaxed">
                    {selectedDay.bossWin || (
                      <span className="text-zinc-500 italic">No entry recorded for this slot.</span>
                    )}
                  </p>
                </div>

                {/* Slot 02: Squad Support */}
                <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1.5">
                  <div className="flex items-center justify-between text-sm font-mono">
                    <span className="text-cyan-400 font-bold">SLOT 02 · SQUAD SUPPORT</span>
                    <span className={selectedDay.squadSupport ? 'text-emerald-400' : 'text-zinc-500'}>
                      {selectedDay.squadSupport ? 'SEALED' : 'UNSEALED'}
                    </span>
                  </div>
                  <p className="text-base text-zinc-200 font-sans leading-relaxed">
                    {selectedDay.squadSupport || (
                      <span className="text-zinc-500 italic">No entry recorded for this slot.</span>
                    )}
                  </p>
                </div>

                {/* Slot 03: Power Surge */}
                <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1.5">
                  <div className="flex items-center justify-between text-sm font-mono">
                    <span className="text-cyan-400 font-bold">SLOT 03 · POWER SURGE</span>
                    <span className={selectedDay.powerSurge ? 'text-emerald-400' : 'text-zinc-500'}>
                      {selectedDay.powerSurge ? 'SEALED' : 'UNSEALED'}
                    </span>
                  </div>
                  <p className="text-base text-zinc-200 font-sans leading-relaxed">
                    {selectedDay.powerSurge || (
                      <span className="text-zinc-500 italic">No entry recorded for this slot.</span>
                    )}
                  </p>
                </div>

              </div>
            </div>

            {/* Quick Action Footer if Today is incomplete */}
            {selectedDay.isToday && selectedDay.slotsCompleted < 3 && (
              <div className="pt-3 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-900/40 p-3 rounded-xl">
                <div className="flex items-center gap-2 text-sm text-amber-300 font-mono">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Today is currently incomplete ({3 - selectedDay.slotsCompleted} slots remaining). Lock in your entries to maintain full shield.</span>
                </div>

                <button
                  onClick={() => {
                    audioEngine.playClick();
                    if (onFocusSlots) {
                      onFocusSlots();
                    } else {
                      window.scrollTo({ top: 400, behavior: 'smooth' });
                    }
                  }}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono text-base font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 shrink-0"
                >
                  <ShieldCheck className="w-4 h-4 text-zinc-950" />
                  <span>COMPLETE TODAY'S SLOTS</span>
                </button>
              </div>
            )}

          </div>
        </div>

        {/* Behavioral Habit Telemetry Banner */}
        <div className="p-5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-sm font-mono text-zinc-400">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="text-zinc-200 font-bold">NEUROPLASTIC HABIT COHESION:</span> Unbroken 30-day streak runs structurally rewire executive resistance, establishing automatic dopamine payoff for morning reflection.
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0 text-sm">
            <span className="text-zinc-300">Habit Index: <strong className="text-emerald-400">ALPHA COHERENCE</strong></span>
            <span>·</span>
            <span className="text-zinc-300">Target: <strong className="text-cyan-400">30/30 CYCLE</strong></span>
          </div>
        </div>

      </div>
    </div>
  );
};
