import React from 'react';
import { ShieldCheck, Cpu } from 'lucide-react';

interface HeaderProps {
  onSelectTab: (tabIndex: number) => void;
  activeTab: number;
}

export const Header: React.FC<HeaderProps> = ({ onSelectTab, activeTab }) => {
  return (
    <header className="relative w-full border-b border-slate-800 bg-slate-950/90 py-4 px-6 md:px-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-lg bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white whitespace-nowrap">
              Ghost FactoryOS
            </span>
            <span className="text-sm text-slate-400 ml-2 hidden sm:inline">
              | F1 Skunkworks Engine
            </span>
          </div>
        </div>

        {/* Zone 2: 4-5 single-line clean text navigation links */}
        <nav className="flex flex-wrap items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => onSelectTab(0)}
            className={`whitespace-nowrap transition-colors hover:text-white ${
              activeTab === 0 ? 'text-cyan-400 font-semibold underline underline-offset-4' : ''
            }`}
          >
            Disruptor Core
          </button>
          <button
            onClick={() => onSelectTab(1)}
            className={`whitespace-nowrap transition-colors hover:text-white ${
              activeTab === 1 ? 'text-cyan-400 font-semibold underline underline-offset-4' : ''
            }`}
          >
            WAL Ledger
          </button>
          <button
            onClick={() => onSelectTab(2)}
            className={`whitespace-nowrap transition-colors hover:text-white ${
              activeTab === 2 ? 'text-cyan-400 font-semibold underline underline-offset-4' : ''
            }`}
          >
            OpenAPI 3.1
          </button>
          <button
            onClick={() => onSelectTab(3)}
            className={`whitespace-nowrap transition-colors hover:text-white ${
              activeTab === 3 ? 'text-cyan-400 font-semibold underline underline-offset-4' : ''
            }`}
          >
            Cloud Run
          </button>
          <button
            onClick={() => onSelectTab(4)}
            className={`whitespace-nowrap transition-colors hover:text-white ${
              activeTab === 4 ? 'text-cyan-400 font-semibold underline underline-offset-4' : ''
            }`}
          >
            APA Covenant
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onSelectTab(4)}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shadow-sm shadow-cyan-950"
          >
            <ShieldCheck className="w-4 h-4 text-slate-900" />
            Acquire.com Asset (20 kHz (0.48ms))
          </button>
        </div>
      </div>
    </header>
  );
};
