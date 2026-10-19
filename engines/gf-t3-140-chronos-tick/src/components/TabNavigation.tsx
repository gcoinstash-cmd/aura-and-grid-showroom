import React from 'react';
import { 
  PlayCircle, 
  Terminal, 
  FileText, 
  Network, 
  Database, 
  ShieldCheck 
} from 'lucide-react';
import { ActiveTab } from '../types/quant';

interface TabNavigationProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
}

interface TabItem {
  id: ActiveTab;
  label: string;
  badge?: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onSelectTab }) => {
  const tabs: TabItem[] = [
    {
      id: 'simulator',
      label: '1. ALGORITHMIC EXECUTION SIMULATOR',
      badge: 'LIVE ENGINE',
      icon: PlayCircle,
    },
    {
      id: 'sandbox',
      label: '2. OPENAPI 3.1 LIVE SANDBOX',
      badge: 'REST / FIX',
      icon: Terminal,
    },
    {
      id: 'spec',
      label: '3. SPECIFICATION & 10/10 EXPORT',
      badge: 'ENGINE_SPEC',
      icon: FileText,
    },
    {
      id: 'topology',
      label: '4. ARCHITECTURAL TOPOLOGY',
      badge: '4.8ms THRESHOLD',
      icon: Network,
    },
    {
      id: 'alloydb',
      label: '5. ALLOYDB DDL SCHEMA',
      badge: 'RPO=0 SQL',
      icon: Database,
    },
    {
      id: 'vault',
      label: '6. MONOPOLY VAULT & APA AGREEMENT',
      badge: 'VAULT COVENANT',
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="bg-slate-900 border-b border-slate-800 sticky top-[73px] z-40 px-4 lg:px-6 shadow-md overflow-x-auto scrollbar-none">
      <div className="max-w-[1720px] mx-auto flex items-center gap-1.5 min-w-max py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-950 to-slate-900 text-emerald-300 border border-emerald-500/50 shadow-md shadow-emerald-950/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span className="tracking-tight">{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[11px] font-mono px-2 py-0.5 rounded font-bold ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
