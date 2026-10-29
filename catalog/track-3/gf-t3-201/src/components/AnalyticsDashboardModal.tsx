import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  TrendingUp, 
  ShieldCheck, 
  ShieldAlert,
  Flame, 
  Zap, 
  Award, 
  Calendar, 
  BarChart3, 
  ArrowLeft,
  Activity,
  Sparkles,
  ChevronRight,
  Snowflake,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Filter,
  Check
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  ComposedChart,
  ReferenceLine,
  Cell,
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  Dot
} from 'recharts';
import { PlayerStats, DayLog, Perk, LoadoutSlotData } from '../types';
import { audioEngine } from '../utils/audio';
import { generate30DayGratitudeData } from '../utils/heatmapGenerator';

interface AnalyticsDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: PlayerStats;
  logs: DayLog[];
  slots?: LoadoutSlotData[];
  activePerk?: Perk;
  onSimulateMissedDay?: () => { preserved: boolean; streak: number; prevStreak?: number };
  onRestoreStreak?: (streak?: number) => void;
  onEquipStreakFreeze?: () => void;
  onOpenMilestones?: () => void;
}

// Custom tooltip renderer for Recharts XP/Streak with HUD cyber aesthetics
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
    dataKey: string;
  }>;
  label?: string;
  unit?: string;
}

const CustomCyberTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, unit = 'XP' }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="p-3.5 bg-zinc-950/95 border border-cyan-500/50 rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.25)] backdrop-blur-md">
        <div className="text-base font-mono font-bold text-cyan-400 mb-1">{label}</div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color || '#22d3ee' }} />
          <span className="text-base font-mono text-zinc-300 font-semibold">{data.name}:</span>
          <span className="text-lg font-mono font-black text-white tabular-nums">
            {data.value.toLocaleString()} {unit}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

// Custom tooltip renderer specifically for the 30-Day Shield Integrity History
const CustomShieldCyberTooltip: React.FC<{
  active?: boolean;
  payload?: Array<{ value: number; payload: any }>;
  label?: string;
}> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    const isFull = item.shieldIntegrity === 100;
    return (
      <div className="p-4 bg-zinc-950/95 border border-emerald-500/50 rounded-2xl shadow-[0_0_25px_rgba(16,185,129,0.3)] backdrop-blur-md max-w-xs space-y-2.5">
        <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-2">
          <div className="text-base font-mono font-bold text-white">
            {item.displayDate} ({item.dayOfWeek}) {item.isToday && '· TODAY'}
          </div>
          <span
            className={`px-2.5 py-0.5 rounded text-sm font-mono font-bold ${
              isFull
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : item.shieldIntegrity > 0
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            }`}
          >
            {item.shieldIntegrity}% INTEGRITY
          </span>
        </div>

        <div className="space-y-1.5 text-sm font-mono">
          <div className="flex items-center justify-between text-zinc-300">
            <span>Core Status:</span>
            <strong className={isFull ? 'text-emerald-400 font-bold flex items-center gap-1' : 'text-amber-400 flex items-center gap-1'}>
              {isFull ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> : <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />}
              {isFull ? 'Full Core Lock' : `${item.shieldIntegrity}% Degraded`}
            </strong>
          </div>
          <div className="flex items-center justify-between text-zinc-300">
            <span>Slots Sealed:</span>
            <span className="text-white font-bold">{item.slotsCompleted} of 3 Slots</span>
          </div>
          <div className="flex items-center justify-between text-zinc-300">
            <span>XP Credit:</span>
            <span className="text-cyan-400 font-bold">+{item.xpGained || (item.slotsCompleted * 150)} XP</span>
          </div>
        </div>

        {item.bossWin && (
          <div className="pt-2 border-t border-zinc-800/80 text-sm text-zinc-300">
            <span className="text-cyan-400 font-mono font-semibold block mb-0.5">Boss Win:</span>
            <span className="italic">"{item.bossWin}"</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export const AnalyticsDashboardModal: React.FC<AnalyticsDashboardModalProps> = ({
  isOpen,
  onClose,
  stats,
  logs,
  slots = [],
  activePerk,
  onSimulateMissedDay,
  onRestoreStreak,
  onEquipStreakFreeze,
  onOpenMilestones
}) => {
  const [activeChartTab, setActiveChartTab] = useState<'both' | 'shield' | 'xp' | 'streak' | 'heatmap'>('shield');
  const [selectedModalDayIndex, setSelectedModalDayIndex] = useState<number>(29);
  const [selectedShieldDayIndex, setSelectedShieldDayIndex] = useState<number>(29);
  const [shieldFilter, setShieldFilter] = useState<'all' | '100_only' | 'degraded'>('all');
  const [simFeedback, setSimFeedback] = useState<{ message: string; preserved: boolean; prevStreak?: number } | null>(null);

  const isStreakFreezeEquipped = activePerk?.id === 'perk_streak_freeze' || activePerk?.isStreakFreeze;

  const heatmapDays = useMemo(() => {
    return generate30DayGratitudeData(stats, slots, logs, activePerk);
  }, [stats, slots, logs, activePerk]);

  // Build the 30-Day Monthly Shield Integrity History Dataset
  const shield30DayHistory = useMemo(() => {
    return heatmapDays.map((d, index) => {
      let shield = 0;
      if (d.slotsCompleted === 3 || d.status === 'completed') {
        shield = 100;
      } else if (d.slotsCompleted === 2) {
        shield = 66;
      } else if (d.slotsCompleted === 1) {
        shield = 33;
      } else if (d.status === 'frozen') {
        shield = 100; // Preserved via cryo freeze
      } else {
        shield = 0;
      }

      // If today, reflect live active player shield percentage
      if (d.isToday) {
        shield = stats.shieldPercentage;
      }

      const isFullShield = shield === 100;

      return {
        index,
        dayIndex: d.dayIndex,
        dateStr: d.dateStr,
        displayDate: d.displayDate,
        displayDay: d.displayDay,
        dayOfWeek: d.dayOfWeek,
        isToday: d.isToday,
        status: d.status,
        slotsCompleted: d.isToday
          ? (stats.shieldPercentage === 100 ? 3 : Math.floor((stats.shieldPercentage / 100) * 3))
          : d.slotsCompleted,
        shieldIntegrity: shield,
        isFullShield,
        bossWin: d.bossWin,
        squadSupport: d.squadSupport,
        powerSurge: d.powerSurge,
        xpGained: d.xpGained,
        statusLabel: isFullShield
          ? '100% MAXIMUM SHIELD'
          : shield > 0
          ? `${shield}% DEGRADED DEFENSE`
          : '0% COMPROMISED'
      };
    });
  }, [heatmapDays, stats.shieldPercentage]);

  // Aggregate Shield Telemetry Statistics
  const fullShieldDaysCount = shield30DayHistory.filter(d => d.isFullShield).length;
  const fullShieldRate = ((fullShieldDaysCount / 30) * 100).toFixed(1);
  const partialShieldDaysCount = shield30DayHistory.filter(d => !d.isFullShield && d.shieldIntegrity > 0).length;
  const breachedShieldDaysCount = shield30DayHistory.filter(d => d.shieldIntegrity === 0).length;
  const avgShieldIntegrity = Math.round(
    shield30DayHistory.reduce((acc, curr) => acc + curr.shieldIntegrity, 0) / 30
  );

  // Longest 100% full shield streak during 30 days
  let longest100Streak = 0;
  let tempStreak = 0;
  shield30DayHistory.forEach(d => {
    if (d.isFullShield) {
      tempStreak++;
      if (tempStreak > longest100Streak) longest100Streak = tempStreak;
    } else {
      tempStreak = 0;
    }
  });

  // Current active 100% full shield streak
  let current100Streak = 0;
  for (let i = shield30DayHistory.length - 1; i >= 0; i--) {
    if (shield30DayHistory[i].isFullShield) {
      current100Streak++;
    } else {
      break;
    }
  }

  // Filtered dataset for table or grid
  const displayedShieldDays = useMemo(() => {
    if (shieldFilter === '100_only') {
      return shield30DayHistory.filter(d => d.isFullShield);
    }
    if (shieldFilter === 'degraded') {
      return shield30DayHistory.filter(d => !d.isFullShield);
    }
    return shield30DayHistory;
  }, [shield30DayHistory, shieldFilter]);

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

  // Build realistic 7-day progression data based on current stats and streak
  const currentStreak = Math.max(1, stats.streak);
  
  // Weekly trend dataset for Recharts
  const weeklyTrendData = [
    { day: 'Mon', dayFull: 'Monday', xp: 420, cumulativeXp: 420, streak: Math.max(1, currentStreak - 6), shield: 100 },
    { day: 'Tue', dayFull: 'Tuesday', xp: 480, cumulativeXp: 900, streak: Math.max(1, currentStreak - 5), shield: 100 },
    { day: 'Wed', dayFull: 'Wednesday', xp: 320, cumulativeXp: 1220, streak: Math.max(1, currentStreak - 4), shield: 66 },
    { day: 'Thu', dayFull: 'Thursday', xp: 550, cumulativeXp: 1770, streak: Math.max(1, currentStreak - 3), shield: 100 },
    { day: 'Fri', dayFull: 'Friday', xp: 510, cumulativeXp: 2280, streak: Math.max(1, currentStreak - 2), shield: 100 },
    { day: 'Sat', dayFull: 'Saturday', xp: 620, cumulativeXp: 2900, streak: Math.max(1, currentStreak - 1), shield: 100 },
    { day: 'Sun (Today)', dayFull: 'Sunday (Today)', xp: 450 + (stats.shieldPercentage === 100 ? 150 : 0), cumulativeXp: 3350, streak: currentStreak, shield: stats.shieldPercentage }
  ];

  // Mini sparkline data for quick card visualizations
  const miniStreakSparkline = weeklyTrendData.map(d => ({ v: d.streak }));
  const miniXpSparkline = weeklyTrendData.map(d => ({ v: d.xp }));
  const miniShieldSparkline = shield30DayHistory.slice(-7).map(d => ({ v: d.shieldIntegrity }));

  const activeInspectedShieldDay = shield30DayHistory[selectedShieldDayIndex] || shield30DayHistory[shield30DayHistory.length - 1];

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
      <div className="relative w-full max-w-5xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Sticky Top Close Header (Cannot be trapped) */}
        <div className="sticky top-0 z-20 bg-zinc-900/95 backdrop-blur border-b border-zinc-800 p-4 sm:p-5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Cockpit Focus Analytics</h3>
              <span className="text-base font-mono text-zinc-400">RECHARTS TELEMETRY & SHIELD INTEGRITY AUDIT</span>
            </div>
          </div>

          <button
            onClick={() => {
              audioEngine.playClick();
              onClose();
            }}
            className="min-h-[44px] py-2.5 px-4 sm:px-5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-mono text-base font-bold flex items-center gap-2 transition-all hover:border-cyan-400 shadow-md active:scale-95"
            title="Close modal (Escape)"
          >
            <X className="w-5 h-5 text-cyan-400" />
            <span>✕ CLOSE COCKPIT (ESC)</span>
          </button>
        </div>

        {/* Scrollable Modal Content Container */}
        <div className="overflow-y-auto flex-1 p-6 sm:p-8 space-y-7">
          
          {/* Top KPI Metrics Strip with Integrated Mini Sparklines */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* KPI 1: Shield Uptime & 100% Full Shield Frequency */}
            <div 
              onClick={() => {
                audioEngine.playClick();
                setActiveChartTab('shield');
              }}
              className="bg-zinc-900/90 hover:bg-zinc-900 border border-emerald-500/30 hover:border-emerald-400/60 rounded-2xl p-5 shadow-sm flex flex-col justify-between cursor-pointer transition-all group"
            >
              <div>
                <div className="text-base font-mono text-zinc-400 flex items-center justify-between font-bold">
                  <span>100% SHIELD UPTIME</span>
                  <ShieldCheck className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-3xl sm:text-4xl font-black font-mono text-emerald-400 mt-2 tabular-nums">
                  {fullShieldRate}%
                </div>
                <div className="text-base text-zinc-300 mt-1 font-mono">
                  {fullShieldDaysCount} of 30 days @ 100% lock
                </div>
              </div>
              <div className="h-10 mt-3 pt-1 border-t border-zinc-800/60">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={miniShieldSparkline}>
                    <defs>
                      <linearGradient id="miniGreenGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="v" stroke="#10b981" strokeWidth={2} fill="url(#miniGreenGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* KPI 2: Current Streak with Mini Sparkline */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="text-base font-mono text-zinc-400 flex items-center justify-between font-bold">
                  <span>CURRENT STREAK</span>
                  <Flame className="w-5 h-5 text-amber-400" />
                </div>
                <div className="text-3xl sm:text-4xl font-black font-mono text-amber-400 mt-2 tabular-nums">
                  {stats.streak} DAYS
                </div>
                <div className="flex items-center justify-between text-base text-zinc-400 mt-1">
                  <span>Best record: {stats.bestStreak} days</span>
                  {onOpenMilestones && (
                    <button
                      onClick={() => {
                        audioEngine.playClick();
                        onClose();
                        onOpenMilestones();
                      }}
                      className="text-sm font-mono font-bold text-amber-400 hover:text-amber-300 underline underline-offset-2"
                    >
                      REWARDS →
                    </button>
                  )}
                </div>
              </div>
              <div className="h-10 mt-3 pt-1 border-t border-zinc-800/60">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={miniStreakSparkline}>
                    <Line type="monotone" dataKey="v" stroke="#f59e0b" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* KPI 3: Total Wins */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="text-base font-mono text-zinc-400 flex items-center justify-between font-bold">
                  <span>TOTAL WINS</span>
                  <Award className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="text-3xl sm:text-4xl font-black font-mono text-cyan-400 mt-2 tabular-nums">
                  {stats.totalWins}
                </div>
                <div className="text-base text-zinc-400 mt-1">Boss wins registered</div>
              </div>
              <div className="h-10 mt-3 pt-1 border-t border-zinc-800/60">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={miniXpSparkline}>
                    <defs>
                      <linearGradient id="miniCyanGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="v" stroke="#06b6d4" strokeWidth={2} fill="url(#miniCyanGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* KPI 4: Reactor Breathing Time */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="text-base font-mono text-zinc-400 flex items-center justify-between font-bold">
                  <span>REACTOR TIME</span>
                  <Zap className="w-5 h-5 text-purple-400" />
                </div>
                <div className="text-3xl sm:text-4xl font-black font-mono text-purple-400 mt-2 tabular-nums">
                  {stats.rechargeMinutes}m
                </div>
                <div className="text-base text-zinc-400 mt-1">Calibrated breathing time</div>
              </div>
              <div className="h-10 mt-3 pt-1 border-t border-zinc-800/60">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={miniXpSparkline}>
                    <defs>
                      <linearGradient id="miniPurpleGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#a855f7" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="v" stroke="#a855f7" strokeWidth={2} fill="url(#miniPurpleGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* RECHARTS FOCUS ANALYTICS & 30-DAY SHIELD INTEGRITY HISTORY */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-lg">
            
            {/* Header & View Switcher */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
              <div>
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                  <h4 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Shield Integrity History & Telemetry
                  </h4>
                </div>
                <p className="text-base text-zinc-400 mt-1">
                  Precision visualizer tracking monthly 100% Core Shield status, defensive uptime, and habit continuity.
                </p>
              </div>

              {/* View Selector Controls */}
              <div className="flex flex-wrap items-center gap-2 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800 self-start lg:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    audioEngine.playClick();
                    setActiveChartTab('shield');
                  }}
                  className={`min-h-[44px] py-2 px-3.5 rounded-xl text-base font-mono font-bold transition-all flex items-center gap-2 ${
                    activeChartTab === 'shield'
                      ? 'bg-emerald-500 text-zinc-950 shadow-[0_0_15px_rgba(16,185,129,0.3)] ring-1 ring-emerald-400'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>30D SHIELD HISTORY</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    audioEngine.playClick();
                    setActiveChartTab('both');
                  }}
                  className={`min-h-[44px] py-2 px-3.5 rounded-xl text-base font-mono font-bold transition-all ${
                    activeChartTab === 'both'
                      ? 'bg-cyan-500 text-zinc-950 shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  DUAL HUD (7D)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    audioEngine.playClick();
                    setActiveChartTab('xp');
                  }}
                  className={`min-h-[44px] py-2 px-3.5 rounded-xl text-base font-mono font-bold transition-all ${
                    activeChartTab === 'xp'
                      ? 'bg-cyan-500 text-zinc-950 shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  XP TREND
                </button>

                <button
                  type="button"
                  onClick={() => {
                    audioEngine.playClick();
                    setActiveChartTab('streak');
                  }}
                  className={`min-h-[44px] py-2 px-3.5 rounded-xl text-base font-mono font-bold transition-all ${
                    activeChartTab === 'streak'
                      ? 'bg-amber-500 text-zinc-950 shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  STREAK CURVE
                </button>

                <button
                  type="button"
                  onClick={() => {
                    audioEngine.playClick();
                    setActiveChartTab('heatmap');
                  }}
                  className={`min-h-[44px] py-2 px-3.5 rounded-xl text-base font-mono font-bold transition-all ${
                    activeChartTab === 'heatmap'
                      ? 'bg-emerald-500 text-zinc-950 shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  30D HEATMAP
                </button>
              </div>
            </div>

            {/* Dynamic Chart Display Canvas */}
            <div className="mt-6 space-y-6">
              
              {/* PRIMARY VIEW: 30-Day Shield Integrity History Chart */}
              {activeChartTab === 'shield' && (
                <div className="space-y-6">
                  
                  {/* Top Stats Bar for Shield History */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/90">
                      <div className="text-sm font-mono text-zinc-400 font-bold">100% SHIELD DAYS</div>
                      <div className="text-2xl font-bold font-mono text-emerald-400 mt-1 tabular-nums">
                        {fullShieldDaysCount} <span className="text-base text-zinc-500 font-normal">/ 30 Days</span>
                      </div>
                      <div className="text-sm text-zinc-400 mt-0.5">{fullShieldRate}% monthly frequency</div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/90">
                      <div className="text-sm font-mono text-zinc-400 font-bold">AVG MONTHLY INTEGRITY</div>
                      <div className="text-2xl font-bold font-mono text-cyan-400 mt-1 tabular-nums">
                        {avgShieldIntegrity}%
                      </div>
                      <div className="text-sm text-zinc-400 mt-0.5">Mean defensive charge</div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/90">
                      <div className="text-sm font-mono text-zinc-400 font-bold">LONGEST 100% RUN</div>
                      <div className="text-2xl font-bold font-mono text-amber-400 mt-1 tabular-nums">
                        {longest100Streak} <span className="text-base text-zinc-500 font-normal">Days</span>
                      </div>
                      <div className="text-sm text-zinc-400 mt-0.5">Max unbroken defense</div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/90">
                      <div className="text-sm font-mono text-zinc-400 font-bold">CURRENT 100% STREAK</div>
                      <div className="text-2xl font-bold font-mono text-emerald-300 mt-1 tabular-nums">
                        {current100Streak} <span className="text-base text-zinc-500 font-normal">Days</span>
                      </div>
                      <div className="text-sm text-zinc-400 mt-0.5">Active locked status</div>
                    </div>
                  </div>

                  {/* Main Recharts 30-Day Shield Integrity History Chart */}
                  <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/90 shadow-inner">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse" />
                        <div>
                          <span className="text-base font-mono font-bold text-emerald-300 uppercase tracking-wide block">
                            30-Day Shield Integrity History & 100% Core Status Trajectory
                          </span>
                          <span className="text-sm text-zinc-400 font-mono">
                            Green columns represent full 100% Core Shield lock (all 3 slots sealed).
                          </span>
                        </div>
                      </div>

                      {/* Legend Chips */}
                      <div className="flex items-center gap-3 font-mono text-sm">
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded bg-emerald-500" />
                          <span className="text-zinc-300">100% Lock</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded bg-amber-500" />
                          <span className="text-zinc-300">Partial (&lt;100%)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded bg-rose-500" />
                          <span className="text-zinc-300">0% Breached</span>
                        </div>
                      </div>
                    </div>

                    {/* Chart Container */}
                    <div className="h-64 sm:h-72 w-full pt-3">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart 
                          data={shield30DayHistory} 
                          margin={{ top: 15, right: 15, left: -15, bottom: 5 }}
                        >
                          <defs>
                            <linearGradient id="shieldAreaGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                              <stop offset="60%" stopColor="#059669" stopOpacity={0.12} />
                              <stop offset="100%" stopColor="#064e3b" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>

                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />

                          <XAxis 
                            dataKey="displayDay" 
                            stroke="#71717a" 
                            tick={{ fill: '#a1a1aa', fontSize: 13, fontFamily: 'monospace' }}
                            tickLine={{ stroke: '#3f3f46' }}
                          />

                          <YAxis 
                            stroke="#71717a" 
                            tick={{ fill: '#71717a', fontSize: 13, fontFamily: 'monospace' }}
                            tickLine={{ stroke: '#3f3f46' }}
                            domain={[0, 105]}
                            ticks={[0, 33, 66, 100]}
                            unit="%"
                          />

                          <Tooltip content={<CustomShieldCyberTooltip />} />

                          {/* 100% Core Shield Target Baseline */}
                          <ReferenceLine 
                            y={100} 
                            stroke="#10b981" 
                            strokeDasharray="4 4" 
                            strokeWidth={1.5}
                            label={{ 
                              value: '100% CORE SHIELD BARRIER', 
                              position: 'insideTopRight', 
                              fill: '#34d399', 
                              fontSize: 12, 
                              fontFamily: 'monospace',
                              fontWeight: 'bold'
                            }} 
                          />

                          {/* Background Integrity Area Fill */}
                          <Area 
                            type="monotone" 
                            dataKey="shieldIntegrity" 
                            stroke="#10b981" 
                            strokeWidth={2}
                            fill="url(#shieldAreaGrad)" 
                            dot={false}
                          />

                          {/* Individual Day Integrity Bars */}
                          <Bar 
                            dataKey="shieldIntegrity" 
                            name="Core Shield Integrity"
                            radius={[4, 4, 0, 0]}
                            barSize={12}
                          >
                            {shield30DayHistory.map((entry, idx) => (
                              <Cell 
                                key={`cell-${idx}`} 
                                fill={
                                  entry.shieldIntegrity === 100
                                    ? '#10b981'
                                    : entry.shieldIntegrity === 66
                                    ? '#06b6d4'
                                    : entry.shieldIntegrity === 33
                                    ? '#f59e0b'
                                    : '#ef4444'
                                }
                                stroke={entry.index === selectedShieldDayIndex ? '#ffffff' : 'none'}
                                strokeWidth={entry.index === selectedShieldDayIndex ? 2 : 0}
                              />
                            ))}
                          </Bar>
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* 30-Day Day-by-Day Interactive Matrix Strip */}
                  <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/90 shadow-inner space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-emerald-400" />
                        <span className="text-base font-mono font-bold text-white uppercase tracking-wide">
                          Monthly Shield Lock Day-by-Day Matrix (Click to Inspect)
                        </span>
                      </div>

                      {/* Filter Chips */}
                      <div className="flex items-center gap-2 font-mono text-sm">
                        <button
                          type="button"
                          onClick={() => {
                            audioEngine.playClick();
                            setShieldFilter('all');
                          }}
                          className={`px-3 py-1 rounded-md text-sm font-semibold transition-all ${
                            shieldFilter === 'all'
                              ? 'bg-zinc-800 text-white border border-zinc-600'
                              : 'text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          All (30)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            audioEngine.playClick();
                            setShieldFilter('100_only');
                          }}
                          className={`px-3 py-1 rounded-md text-sm font-semibold transition-all ${
                            shieldFilter === '100_only'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                              : 'text-zinc-400 hover:text-emerald-400'
                          }`}
                        >
                          100% Lock ({fullShieldDaysCount})
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            audioEngine.playClick();
                            setShieldFilter('degraded');
                          }}
                          className={`px-3 py-1 rounded-md text-sm font-semibold transition-all ${
                            shieldFilter === 'degraded'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                              : 'text-zinc-400 hover:text-amber-400'
                          }`}
                        >
                          Degraded ({30 - fullShieldDaysCount})
                        </button>
                      </div>
                    </div>

                    {/* 30 Interactive Day Capsules */}
                    <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2">
                      {displayedShieldDays.map((day) => {
                        const isSelected = day.index === selectedShieldDayIndex;
                        const isFull = day.shieldIntegrity === 100;
                        return (
                          <button
                            key={day.dateStr}
                            type="button"
                            onClick={() => {
                              audioEngine.playClick();
                              setSelectedShieldDayIndex(day.index);
                            }}
                            className={`min-h-[58px] p-2 rounded-xl border flex flex-col justify-between items-center transition-all cursor-pointer relative ${
                              isSelected
                                ? 'ring-2 ring-emerald-400 border-white shadow-[0_0_15px_rgba(16,185,129,0.5)] bg-zinc-900'
                                : isFull
                                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 hover:border-emerald-400'
                                : day.shieldIntegrity > 0
                                ? 'bg-amber-950/40 border-amber-500/40 text-amber-300 hover:border-amber-400'
                                : 'bg-rose-950/20 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                            }`}
                          >
                            <div className="text-sm font-mono text-zinc-400">{day.dayOfWeek}</div>
                            <div className="text-base font-mono font-bold text-white">{day.displayDay}</div>
                            
                            <div className="flex items-center gap-1">
                              {isFull ? (
                                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                              ) : day.shieldIntegrity > 0 ? (
                                <span className="w-2 h-2 rounded-full bg-amber-400" />
                              ) : (
                                <span className="w-2 h-2 rounded-full bg-rose-500" />
                              )}
                              <span className="text-sm font-mono font-bold">{day.shieldIntegrity}%</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Inspector Panel for Selected Day */}
                    <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2.5 mt-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-base font-mono border-b border-zinc-800/80 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold text-lg">
                            {activeInspectedShieldDay.displayDate} ({activeInspectedShieldDay.dayOfWeek}) {activeInspectedShieldDay.isToday && '· TODAY'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 text-sm font-semibold rounded-md font-mono flex items-center gap-1.5 ${
                            activeInspectedShieldDay.isFullShield 
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                              : activeInspectedShieldDay.shieldIntegrity > 0 
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          }`}>
                            {activeInspectedShieldDay.isFullShield ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                            {activeInspectedShieldDay.shieldIntegrity}% CORE SHIELD STATUS
                          </span>
                          <span className="px-3 py-1 text-sm font-semibold rounded-md bg-zinc-800 text-zinc-300 font-mono">
                            {activeInspectedShieldDay.slotsCompleted} / 3 SLOTS LOCKED
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-sm text-zinc-300 pt-1">
                        <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80">
                          <span className="text-cyan-400 font-mono font-bold block mb-1">Boss Win Entry:</span>
                          <span className="leading-relaxed">{activeInspectedShieldDay.bossWin || 'No entry logged for this cycle'}</span>
                        </div>
                        <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80">
                          <span className="text-cyan-400 font-mono font-bold block mb-1">Squad Support Entry:</span>
                          <span className="leading-relaxed">{activeInspectedShieldDay.squadSupport || 'No entry logged for this cycle'}</span>
                        </div>
                        <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80">
                          <span className="text-cyan-400 font-mono font-bold block mb-1">Power Surge Entry:</span>
                          <span className="leading-relaxed">{activeInspectedShieldDay.powerSurge || 'No entry logged for this cycle'}</span>
                        </div>
                      </div>
                    </div>

                  </div>

                </div>
              )}

              {/* Dual View or XP Trend View */}
              {(activeChartTab === 'both' || activeChartTab === 'xp') && (
                <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/90 shadow-inner">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                      <span className="text-base font-mono font-bold text-cyan-300 uppercase tracking-wide">
                        7-Day Daily XP Accumulation Trend (Recharts Area Sparkline)
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-base font-mono">
                      <span className="text-zinc-400">Peak: <strong className="text-cyan-400">620 XP</strong></span>
                      <span className="text-zinc-400">Avg: <strong className="text-emerald-400">+478 XP/day</strong></span>
                    </div>
                  </div>

                  {/* Recharts Area Sparkline Container */}
                  <div className="h-56 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={weeklyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="rechartsXpGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.45} />
                            <stop offset="50%" stopColor="#06b6d4" stopOpacity={0.15} />
                            <stop offset="100%" stopColor="#0891b2" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis 
                          dataKey="day" 
                          stroke="#71717a" 
                          tick={{ fill: '#a1a1aa', fontSize: 13, fontFamily: 'monospace' }}
                          tickLine={{ stroke: '#3f3f46' }}
                        />
                        <YAxis 
                          stroke="#71717a" 
                          tick={{ fill: '#71717a', fontSize: 13, fontFamily: 'monospace' }}
                          tickLine={{ stroke: '#3f3f46' }}
                          domain={[0, 700]}
                        />
                        <Tooltip content={<CustomCyberTooltip unit="XP" />} />
                        <Area 
                          type="monotone" 
                          dataKey="xp" 
                          name="Daily XP Gained"
                          stroke="#22d3ee" 
                          strokeWidth={3} 
                          fill="url(#rechartsXpGrad)" 
                          activeDot={{ r: 6, fill: '#22d3ee', stroke: '#ffffff', strokeWidth: 2 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Dual View or Streak Progression View */}
              {(activeChartTab === 'both' || activeChartTab === 'streak') && (
                <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/90 shadow-inner">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                      <span className="text-base font-mono font-bold text-amber-300 uppercase tracking-wide">
                        7-Day Consecutive Daily Streak Progression (Recharts Line Sparkline)
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-base font-mono">
                      <span className="text-zinc-400">Current Velocity: <strong className="text-amber-400">{stats.streak} Days</strong></span>
                      <span className="text-zinc-400">Reliability Index: <strong className="text-emerald-400">100%</strong></span>
                    </div>
                  </div>

                  {/* Recharts Line Sparkline Container */}
                  <div className="h-56 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weeklyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis 
                          dataKey="day" 
                          stroke="#71717a" 
                          tick={{ fill: '#a1a1aa', fontSize: 13, fontFamily: 'monospace' }}
                          tickLine={{ stroke: '#3f3f46' }}
                        />
                        <YAxis 
                          stroke="#71717a" 
                          tick={{ fill: '#71717a', fontSize: 13, fontFamily: 'monospace' }}
                          tickLine={{ stroke: '#3f3f46' }}
                          domain={[0, Math.max(10, currentStreak + 2)]}
                        />
                        <Tooltip content={<CustomCyberTooltip unit="Days" />} />
                        <Line 
                          type="monotone" 
                          dataKey="streak" 
                          name="Daily Streak"
                          stroke="#fbbf24" 
                          strokeWidth={3.5} 
                          dot={{ r: 4, fill: '#fbbf24', stroke: '#18181b', strokeWidth: 2 }}
                          activeDot={{ r: 7, fill: '#fbbf24', stroke: '#ffffff', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* 30-Day Gratitude Heatmap View */}
              {activeChartTab === 'heatmap' && (
                <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/90 shadow-inner space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-emerald-400" />
                      <span className="text-base font-mono font-bold text-emerald-300 uppercase tracking-wide">
                        30-Day Gratitude Habit Heatmap Matrix
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-base font-mono">
                      <span className="text-zinc-400">Completed: <strong className="text-emerald-400">{heatmapDays.filter(d => d.status === 'completed').length}/30 Days</strong></span>
                      <span className="text-zinc-400">Active Run: <strong className="text-cyan-400">{stats.streak}d</strong></span>
                    </div>
                  </div>

                  {/* 30-Day Grid */}
                  <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2 pt-2">
                    {heatmapDays.map((day) => {
                      const isSelected = day.dayIndex === selectedModalDayIndex;
                      return (
                        <button
                          key={day.dateStr}
                          type="button"
                          onClick={() => {
                            audioEngine.playClick();
                            setSelectedModalDayIndex(day.dayIndex);
                          }}
                          className={`min-h-[58px] p-2 rounded-xl border flex flex-col justify-between items-center transition-all cursor-pointer relative ${
                            isSelected
                              ? 'ring-2 ring-cyan-400 border-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.4)]'
                              : day.status === 'completed'
                              ? 'bg-emerald-950/60 border-emerald-600/70 text-emerald-300 hover:border-emerald-400'
                              : day.status === 'partial'
                              ? 'bg-amber-950/60 border-amber-600/70 text-amber-300 hover:border-amber-400'
                              : day.status === 'frozen'
                              ? 'bg-cyan-950/60 border-cyan-400 text-cyan-300'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                          }`}
                        >
                          <div className="text-sm font-mono text-zinc-400">{day.dayOfWeek}</div>
                          <div className="text-base font-mono font-bold">{day.displayDay}</div>
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
                        </button>
                      );
                    })}
                  </div>

                  {/* Inspector Panel for Selected Day */}
                  {(() => {
                    const day = heatmapDays[selectedModalDayIndex] || heatmapDays[heatmapDays.length - 1];
                    return (
                      <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2 mt-3">
                        <div className="flex items-center justify-between text-base font-mono">
                          <span className="text-white font-bold">{day.displayDate} ({day.dayOfWeek}) {day.isToday && '· TODAY'}</span>
                          <span className={`px-2.5 py-0.5 rounded text-sm font-bold ${
                            day.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' :
                            day.status === 'partial' ? 'bg-amber-500/20 text-amber-300' :
                            day.status === 'frozen' ? 'bg-cyan-500/20 text-cyan-300' :
                            'bg-zinc-800 text-zinc-400'
                          }`}>
                            {day.status.toUpperCase()}: {day.slotsCompleted}/3 SLOTS
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-zinc-300 pt-1">
                          <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800/80">
                            <span className="text-cyan-400 font-mono font-bold block mb-0.5">Boss Win:</span>
                            <span>{day.bossWin || 'No entry logged'}</span>
                          </div>
                          <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800/80">
                            <span className="text-cyan-400 font-mono font-bold block mb-0.5">Squad Support:</span>
                            <span>{day.squadSupport || 'No entry logged'}</span>
                          </div>
                          <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800/80">
                            <span className="text-cyan-400 font-mono font-bold block mb-0.5">Power Surge:</span>
                            <span>{day.powerSurge || 'No entry logged'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

            </div>

            {/* Tactical Streak Analysis Micro-Insights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-5">
              <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-base font-bold text-white">Consistent Loadouts</div>
                  <div className="text-base text-zinc-400">{fullShieldDaysCount} of 30 days completed with 100% defense</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-base font-bold text-white">Streak Multiplier</div>
                  <div className="text-base text-zinc-400">+{stats.streak * 10} Bonus XP on midnight roll</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-base font-bold text-white">Chassis Uptime</div>
                  <div className="text-base text-zinc-400">Zero downtime breaches this week</div>
                </div>
              </div>
            </div>

          </div>

          {/* Cryo Streak Freeze & Persistence Telemetry Matrix */}
          <div className={`rounded-3xl p-6 sm:p-7 border transition-all ${
            isStreakFreezeEquipped
              ? 'bg-gradient-to-br from-cyan-950/40 via-zinc-900 to-zinc-950 border-cyan-400/50 shadow-[0_0_25px_rgba(56,189,248,0.15)]'
              : 'bg-zinc-900/90 border-zinc-800'
          }`}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-5 border-b border-zinc-800/80">
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${
                  isStreakFreezeEquipped
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_20px_rgba(56,189,248,0.35)]'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                }`}>
                  <Snowflake className={`w-7 h-7 ${isStreakFreezeEquipped ? 'text-cyan-300 animate-pulse' : 'text-zinc-500'}`} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h4 className="text-xl font-bold text-white tracking-tight">
                      Cryo Streak Defense Matrix
                    </h4>
                    {isStreakFreezeEquipped ? (
                      <span className="px-3 py-1 text-sm font-semibold rounded-md font-mono bg-cyan-400/20 text-cyan-300 border border-cyan-400/50 shadow-sm flex items-center gap-1.5">
                        <Snowflake className="w-3.5 h-3.5 text-cyan-300" />
                        CRYO-SHIELD ACTIVE (IMMUNE TO RESETS)
                      </span>
                    ) : (
                      <span className="px-3 py-1 text-sm font-semibold rounded-md font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        STANDARD RESETS ENABLED
                      </span>
                    )}
                  </div>
                  <p className="text-base text-zinc-300 mt-1.5 leading-relaxed max-w-2xl">
                    {isStreakFreezeEquipped ? (
                      <>
                        <strong className="text-cyan-300">Equipped:</strong> Your <span className="font-mono font-bold text-white">CRYO STREAK FREEZE</span> mythic perk prevents streak reset if you miss a 24-hour daily logging cycle. Your <strong>{stats.streak}-day streak</strong> will remain frozen in cryo-stasis.
                      </>
                    ) : (
                      <>
                        Missing a day of logging currently resets your streak to 1. Equip the <strong>CRYO STREAK FREEZE</strong> mythic perk to preserve streak progress across missed rotations.
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Action Cluster: Equip or Simulator Trigger */}
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                {!isStreakFreezeEquipped && onEquipStreakFreeze && (
                  <button
                    type="button"
                    onClick={() => {
                      audioEngine.playSlotLock();
                      onEquipStreakFreeze();
                    }}
                    className="min-h-[44px] py-2.5 px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold font-mono text-base flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(34,211,238,0.25)] active:scale-95"
                  >
                    <Snowflake className="w-5 h-5" />
                    <span>EQUIP CRYO FREEZE</span>
                  </button>
                )}

                {onSimulateMissedDay && (
                  <button
                    type="button"
                    onClick={() => {
                      const res = onSimulateMissedDay();
                      if (res.preserved) {
                        setSimFeedback({
                          message: `❄️ CRYO-SHIELD ENGAGED: Missed day simulated! Streak remained frozen at ${res.streak} days (zero decay).`,
                          preserved: true
                        });
                      } else {
                        setSimFeedback({
                          message: `⚠️ STREAK RESET: Missed day simulated without Cryo Freeze! Streak reset from ${res.prevStreak ?? 8} to 1 day.`,
                          preserved: false,
                          prevStreak: res.prevStreak ?? 8
                        });
                      }
                    }}
                    className="min-h-[44px] py-2.5 px-5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-mono text-base font-bold flex items-center gap-2 transition-colors active:scale-95"
                    title="Simulate what happens when 48h elapse without logging"
                  >
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <span>SIMULATE MISSED DAY</span>
                  </button>
                )}
              </div>
            </div>

            {/* Simulation Feedback Banner */}
            {simFeedback && (
              <div className={`mt-4 p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200 ${
                simFeedback.preserved
                  ? 'bg-cyan-950/40 border-cyan-400/50 text-cyan-200'
                  : 'bg-amber-950/40 border-amber-500/50 text-amber-200'
              }`}>
                <div className="flex items-center gap-2.5 text-base font-medium">
                  {simFeedback.preserved ? (
                    <Snowflake className="w-5 h-5 text-cyan-300 shrink-0 animate-pulse" />
                  ) : (
                    <Flame className="w-5 h-5 text-amber-400 shrink-0" />
                  )}
                  <span>{simFeedback.message}</span>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  {!simFeedback.preserved && onRestoreStreak && (
                    <button
                      type="button"
                      onClick={() => {
                        onRestoreStreak(simFeedback.prevStreak || 8);
                        setSimFeedback(null);
                      }}
                      className="py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-mono font-bold transition-colors"
                    >
                      RESTORE STREAK ({simFeedback.prevStreak || 8}d)
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSimFeedback(null)}
                    className="py-1.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-mono transition-colors"
                  >
                    DISMISS
                  </button>
                </div>
              </div>
            )}

            {/* Micro Stats & Cryo Telemetry Points */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
              <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <div className="text-sm font-mono text-zinc-400">PERSISTENCE PROTOCOL</div>
                <div className="text-base font-bold text-zinc-100 mt-1">
                  {isStreakFreezeEquipped ? 'Cryo-Shielded (Stasis Lock)' : 'Volatile 24h Window'}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <div className="text-sm font-mono text-zinc-400">CRYO-SAVED OCCURRENCES</div>
                <div className="text-base font-bold text-cyan-400 mt-1 tabular-nums">
                  {stats.streakFreezeUsedCount || 0} Missed Days Preserved
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <div className="text-sm font-mono text-zinc-400">STRATEGIC SYNERGY</div>
                <div className="text-base font-bold text-zinc-100 mt-1">
                  Prevents Reset on Missed Logging
                </div>
              </div>
            </div>
          </div>

          {/* Previous Mission Log Archives */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-base font-mono font-bold text-zinc-200 flex items-center gap-2.5">
                <Calendar className="w-5 h-5 text-cyan-400" />
                <span>PREVIOUS MISSION LOG ARCHIVES</span>
              </div>
              <span className="text-base font-mono text-zinc-400 font-semibold">
                {logs.length} logged sessions
              </span>
            </div>

            <div className="space-y-3.5">
              {logs.map((log, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80">
                  <div className="flex items-center justify-between text-base font-mono text-zinc-400 mb-1.5">
                    <span className="text-cyan-400 font-bold">{log.date}</span>
                    <span className="text-emerald-400 font-bold">+{log.xpGained} XP</span>
                  </div>
                  <div className="text-lg font-bold text-zinc-100">
                    🏆 Boss Win: "{log.bossWin}"
                  </div>
                  <div className="text-base text-zinc-300 mt-1 leading-relaxed">
                    🛡️ Squad: {log.squadSupport} · ⚡ Surge: {log.powerSurge}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Pinned Bottom Action Bar with Large Obvious Exit Button */}
        <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-950/95 shrink-0 flex items-center justify-between gap-4">
          <div className="text-base text-zinc-400">
            Press <kbd className="px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-200 font-mono text-base">Esc</kbd> or click outside to dismiss.
          </div>

          <button
            type="button"
            onClick={() => {
              audioEngine.playClick();
              onClose();
            }}
            className="min-h-[44px] py-2.5 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-base font-mono flex items-center gap-2.5 transition-all shadow-md active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>EXIT TO COCKPIT</span>
          </button>
        </div>

      </div>
    </div>
  );
};
