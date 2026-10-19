import React from 'react';
import { ShieldCheck, Download, Activity, Cpu, FileText, Scale, Terminal } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenExportModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenExportModal,
}) => {
  const navTabs = [
    { id: 'radar', label: 'Airspace Radar', icon: Activity, index: '01' },
    { id: 'math', label: 'CBF Math & State Matrix', icon: Cpu, index: '02' },
    { id: 'engine_spec', label: 'ENGINE_SPEC.md', icon: FileText, index: '03' },
    { id: 'apa', label: 'Turnkey Software Asset Purchase Agreement (20 kHz (0.48ms))', icon: Scale, index: '04' },
    { id: 'python', label: 'Python Core & Tests', icon: Terminal, index: '05' },
  ];

  return (
    <header className="w-full bg-slate-950 border-b border-slate-800/80 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 flex-wrap">
        {/* Top bar row on mobile/tablet: Title & Export Action */}
        <div className="flex items-center justify-between gap-3 w-full md:w-auto shrink-0 flex-wrap sm:flex-nowrap">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shrink-0">
              <ShieldCheck className="w-5 h-5 shrink-0" />
            </div>
            <span className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-100 whitespace-nowrap shrink-0">
              AeroVex CBF <span className="text-cyan-400 font-mono text-base font-normal ml-1">GF-T3-158</span>
            </span>
          </div>

          {/* Action button visible in top row for mobile / compact split view */}
          <div className="flex md:hidden items-center shrink-0">
            <button
              onClick={onOpenExportModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 active:bg-cyan-500 rounded-md transition-colors shadow-sm whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>Export Vault</span>
            </button>
          </div>
        </div>

        {/* Zone 2: Horizontally scrollable tab header list with zero text clipping */}
        <nav
          className="w-full md:w-auto flex items-center gap-1.5 sm:gap-2 overflow-x-auto flex-nowrap whitespace-nowrap scrollbar-none pb-1 md:pb-0"
          aria-label="Main Navigation"
        >
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`shrink-0 flex items-center gap-2 px-3 py-2 text-sm sm:text-base font-medium transition-all whitespace-nowrap rounded-md border cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-cyan-300 border-cyan-500/60 shadow-sm shadow-cyan-950'
                    : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span className="text-xs font-mono opacity-60 mr-0.5 shrink-0">{tab.index}</span>
                <span className="whitespace-nowrap shrink-0">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary CTA for Desktop */}
        <div className="hidden md:flex items-center shrink-0">
          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-2 px-4 py-2 text-sm sm:text-base font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 active:bg-cyan-500 rounded-md transition-colors shadow-sm whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>Export Vault Bundle</span>
          </button>
        </div>
      </div>
    </header>
  );
};

