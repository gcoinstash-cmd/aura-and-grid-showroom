import React from 'react';
import { Download } from 'lucide-react';

interface HeaderNavProps {
  activeTab: number;
  onSelectTab: (idx: number) => void;
  onExportSpec: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  activeTab,
  onSelectTab,
  onExportSpec,
}) => {
  const tabs = [
    'Throttle & Torsen',
    'Postgres Ledger',
    'OpenAPI 3.1',
    'Cloud Run Harness',
    'Acquire.com APA',
  ];

  return (
    <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-lg font-black tracking-wider text-white uppercase whitespace-nowrap">
          GHOST FACTORY<span className="text-amber-500">OS</span>
        </span>
      </div>

      {/* Zone 2: 5 Concise Single-Line Navigation Links */}
      <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-400">
        {tabs.map((tab, idx) => {
          const isActive = activeTab === idx;
          return (
            <button
              key={tab}
              onClick={() => onSelectTab(idx)}
              className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 text-xs font-semibold ${
                isActive
                  ? 'text-white border-b-2 border-amber-500'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: 1 Primary Action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onExportSpec}
          className="px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
          title="Download complete GF_T3_181_SPEC.md deliverable"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Spec</span>
        </button>
      </div>
    </header>
  );
};
