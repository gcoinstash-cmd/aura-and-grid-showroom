import React from 'react';
import { ShieldCheck, Download } from 'lucide-react';
import { downloadSpecificationMarkdown } from '../utils/specExport';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'canfd', label: 'CAN-FD & HSM' },
    { id: 'postgres', label: 'Security Ledger' },
    { id: 'openapi', label: 'OpenAPI 3.1' },
    { id: 'cloudrun', label: 'Cloud Run Harness' },
    { id: 'apa', label: 'Acquire.com Covenant' },
  ];

  return (
    <header className="relative w-full border-b border-neutral-800 bg-neutral-950 px-6 py-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <a href="/" className="text-xl font-bold tracking-tight text-neutral-100 whitespace-nowrap">
            GHOST FACTORYOS <span className="font-normal text-neutral-400">/ GF-T3-170</span>
          </a>
        </div>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-neutral-400">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`whitespace-nowrap transition-colors hover:text-neutral-100 cursor-pointer ${
                activeTab === item.id ? 'text-amber-400 font-semibold underline underline-offset-8 decoration-2 decoration-amber-400' : ''
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={downloadSpecificationMarkdown}
            className="flex items-center gap-2 rounded-lg bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-950 transition-colors hover:bg-neutral-200 cursor-pointer whitespace-nowrap"
          >
            <Download className="h-4 w-4" />
            <span>Export Spec</span>
          </button>
        </div>
      </div>
    </header>
  );
};
