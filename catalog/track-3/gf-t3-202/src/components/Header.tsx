import React from 'react';

interface HeaderProps {
  activeTab: 'terminal' | 'spec' | 'openapi' | 'tests' | 'source';
  setActiveTab: (tab: 'terminal' | 'spec' | 'openapi' | 'tests' | 'source') => void;
  onResetBook: () => void;
  symbol: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onResetBook,
  symbol,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-800 bg-slate-950 text-slate-100">
      {/* Zone 1: Single text wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <a
          href="#terminal"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('terminal');
          }}
          className="text-lg font-bold tracking-tight text-white whitespace-nowrap font-['Plus_Jakarta_Sans',sans-serif]"
        >
          APEX-202 Engine
        </a>
        <span className="text-xs text-slate-500 font-mono tracking-wider">
          {symbol}
        </span>
      </div>

      {/* Zone 2: 4-5 clean single-line navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('terminal')}
          className={`transition-colors whitespace-nowrap shrink-0 text-left cursor-pointer ${
            activeTab === 'terminal' ? 'text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Matching Terminal
        </button>
        <button
          onClick={() => setActiveTab('spec')}
          className={`transition-colors whitespace-nowrap shrink-0 text-left cursor-pointer ${
            activeTab === 'spec' ? 'text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Engine Spec
        </button>
        <button
          onClick={() => setActiveTab('openapi')}
          className={`transition-colors whitespace-nowrap shrink-0 text-left cursor-pointer ${
            activeTab === 'openapi' ? 'text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          OpenAPI 3.1
        </button>
        <button
          onClick={() => setActiveTab('tests')}
          className={`transition-colors whitespace-nowrap shrink-0 text-left cursor-pointer ${
            activeTab === 'tests' ? 'text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Test Suite
        </button>
        <button
          onClick={() => setActiveTab('source')}
          className={`transition-colors whitespace-nowrap shrink-0 text-left cursor-pointer ${
            activeTab === 'source' ? 'text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Python Source
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onResetBook}
          className="px-3.5 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded border border-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Re-seed Liquidity
        </button>
      </div>
    </header>
  );
};
