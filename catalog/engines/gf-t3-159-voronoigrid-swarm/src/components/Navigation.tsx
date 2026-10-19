import React from 'react';
import {
  Radar,
  Sigma,
  FileCode2,
  FileSpreadsheet,
  TerminalSquare,
  Sun,
  Moon,
  Sparkles,
  Contrast,
} from 'lucide-react';

export type TabId = 'radar' | 'math' | 'spec' | 'apa' | 'python';

interface NavigationProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  highContrast: boolean;
  onToggleHighContrast: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  highContrast,
  onToggleHighContrast,
}) => {
  const tabs = [
    {
      id: 'radar' as TabId,
      label: 'Tab 1: Live Voronoi Partitioning',
      shortLabel: '1. Live Voronoi Radar',
      icon: Radar,
      badge: '60 FPS',
      badgeColor: 'text-cyan-300 border-cyan-800 bg-cyan-950/60',
    },
    {
      id: 'math' as TabId,
      label: "Tab 2: Lloyd's Algorithm & Centroid Math",
      shortLabel: "2. Lloyd's Math & Lyapunov",
      icon: Sigma,
      badge: 'dH/dt ≤ 0',
      badgeColor: 'text-violet-300 border-violet-800 bg-violet-950/60',
    },
    {
      id: 'spec' as TabId,
      label: 'Tab 3: ENGINE_SPEC.md',
      shortLabel: '3. ENGINE_SPEC.md',
      icon: FileCode2,
      badge: 'MONOPOLY VAULT',
      badgeColor: 'text-sky-300 border-sky-800 bg-sky-950/60',
    },
    {
      id: 'apa' as TabId,
      label: 'Tab 4: Turnkey Software Asset Purchase Agreement',
      shortLabel: '4. Turnkey Software Asset Purchase Agreement (20 kHz (0.48ms))',
      icon: FileSpreadsheet,
      badge: '20 kHz (0.48ms)',
      badgeColor: 'text-emerald-300 border-emerald-800 bg-emerald-950/60',
    },
    {
      id: 'python' as TabId,
      label: 'Tab 5: Python Core & Tests',
      shortLabel: '5. Python & Pytest Suite',
      icon: TerminalSquare,
      badge: '88.4% COV',
      badgeColor: 'text-emerald-300 border-emerald-800 bg-emerald-950/60',
    },
  ];

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex = index;
    if (e.key === 'ArrowRight') {
      nextIndex = (index + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = tabs.length - 1;
    } else {
      return;
    }
    e.preventDefault();
    onSelectTab(tabs[nextIndex].id);
    const target = document.getElementById(`tab-btn-${tabs[nextIndex].id}`);
    if (target) target.focus();
  };

  return (
    <nav
      aria-label="Enterprise Architecture Navigation"
      className="w-full my-3"
    >
      <div className="flex items-center justify-between gap-3 p-1.5 rounded-xl border border-slate-800 bg-slate-900/90 backdrop-blur-md shadow-lg overflow-hidden">
        {/* Horizontally scrollable tab buttons with shrink-0 to prevent label clipping */}
        <div
          role="tablist"
          aria-label="Main system tabs"
          className="flex items-center gap-2 overflow-x-auto py-1 px-1 scrollbar-none flex-1"
        >
          {tabs.map((tab, idx) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-btn-${tab.id}`}
                role="tab"
                aria-selected={isSelected}
                aria-controls={`tab-panel-${tab.id}`}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => onSelectTab(tab.id)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                className={`shrink-0 flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg font-mono text-xs sm:text-sm font-semibold transition-all duration-150 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/40 font-bold'
                    : 'bg-slate-950/60 text-slate-300 hover:text-slate-100 hover:bg-slate-800 border border-slate-800/80'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-slate-950' : 'text-cyan-400'}`} aria-hidden="true" />
                <span className="whitespace-nowrap">{tab.label}</span>
                <span
                  className={`hidden md:inline text-[11px] font-mono tracking-wider px-1.5 py-0.5 rounded border uppercase ${
                    isSelected
                      ? 'bg-slate-950/20 text-slate-950 border-slate-900/40'
                      : tab.badgeColor
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Accessibility & High-Contrast Toggle Button */}
        <div className="shrink-0 pl-2 pr-1 border-l border-slate-800">
          <button
            type="button"
            onClick={onToggleHighContrast}
            aria-label={highContrast ? 'Switch to Standard Theme' : 'Switch to Ultra High-Contrast Mode'}
            title={highContrast ? 'Switch to Standard Theme' : 'Switch to Ultra High-Contrast Mode'}
            className={`p-2.5 rounded-lg border font-mono text-xs flex items-center gap-1.5 transition-all focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none ${
              highContrast
                ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
          >
            <Contrast className="w-4 h-4" />
            <span className="hidden lg:inline text-xs font-semibold">
              {highContrast ? 'HIGH CONTRAST ON' : 'WCAG CONTRAST'}
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
};
