import React from 'react';
import { Target, CheckCircle2 } from 'lucide-react';
import { DailyQuest } from '../types';
import { audioEngine } from '../utils/audio';

interface DailyQuestRadialProgressProps {
  quests: DailyQuest[];
  onOpenQuests?: () => void;
}

export const DailyQuestRadialProgress: React.FC<DailyQuestRadialProgressProps> = ({
  quests,
  onOpenQuests
}) => {
  const totalQuests = quests.length;
  const completedQuests = quests.filter((q) => q.completed).length;
  const percentage = totalQuests > 0 ? Math.round((completedQuests / totalQuests) * 100) : 0;

  // SVG parameters for radial circle
  const size = 64;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div 
      onClick={() => {
        audioEngine.playClick();
        if (onOpenQuests) onOpenQuests();
      }}
      className="w-full bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 hover:border-cyan-500/50 rounded-3xl p-4 sm:p-5 shadow-lg flex items-center justify-between gap-4 cursor-pointer transition-all group select-none"
      title="Daily Quest Completion Status. Click to view or toggle quests in the Combat Log."
    >
      <div className="flex items-center gap-4 min-w-0">
        {/* Radial SVG Progress Bar */}
        <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
            {/* Background Track Circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-zinc-800"
              fill="transparent"
            />
            {/* Animated Progress Circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="text-cyan-400 transition-all duration-700 ease-out"
              fill="transparent"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-sm font-mono font-black text-white tabular-nums">
              {percentage}%
            </span>
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Target className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
              Daily Quest Progress Bar
            </span>
            <span className="px-2.5 py-0.5 rounded text-sm font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              {completedQuests} OF {totalQuests} CLEARED
            </span>
          </div>
          <p className="text-base text-zinc-300 mt-1 truncate">
            {completedQuests === totalQuests && totalQuests > 0
              ? '✨ All daily operational objectives cleared! Maximum dopamine achieved.'
              : `${totalQuests - completedQuests} objective${totalQuests - completedQuests === 1 ? '' : 's'} remaining for today's combat deployment.`}
          </p>
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-2 shrink-0 text-zinc-400 group-hover:text-cyan-400 font-mono text-base font-bold transition-colors">
        <span>VIEW LOGS</span>
        <CheckCircle2 className="w-5 h-5" />
      </div>
    </div>
  );
};
