import React from 'react';
import { Cpu, Database, Network, Container, FileText } from 'lucide-react';

interface TabNavProps {
  activeTab: number;
  onSelectTab: (index: number) => void;
}

export const TabNav: React.FC<TabNavProps> = ({ activeTab, onSelectTab }) => {
  const tabs = [
    {
      id: 0,
      label: 'LMAX Disruptor & Ring Buffer Core',
      shortLabel: 'Disruptor Core',
      icon: Cpu,
      subtext: 'Python 3.12 / Cython Lock-Free Ring Buffer',
    },
    {
      id: 1,
      label: 'Postgres WAL Spillover Ledger',
      shortLabel: 'WAL Ledger',
      icon: Database,
      subtext: 'PG16 Partitioned Ingest & HMAC-SHA256 Triggers',
    },
    {
      id: 2,
      label: 'OpenAPI 3.1 Direct Execution Contract',
      shortLabel: 'OpenAPI 3.1',
      icon: Network,
      subtext: '64-byte Binary Wire Protocol & Sequence Claim',
    },
    {
      id: 3,
      label: 'Turnkey Cloud Run Harness',
      shortLabel: 'Cloud Run',
      icon: Container,
      subtext: 'Non-Root Dockerfile, PyTest Bench (>90% cov)',
    },
    {
      id: 4,
      label: 'Acquire.com APA Covenant',
      shortLabel: 'APA Covenant',
      icon: FileText,
      subtext: '$45k Micro-Buyout Terms, Bill of Sale, Escrow',
    },
  ];

  return (
    <section className="relative w-full border-b border-slate-800 bg-slate-950/60 px-6 md:px-10">
      <div className="max-w-7xl mx-auto overflow-x-auto py-2">
        <div className="flex items-center gap-2 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-3 px-5 py-3 rounded-lg text-left transition-all ${
                  isActive
                    ? 'bg-slate-800 text-white border border-cyan-500/50 shadow-sm shadow-cyan-950'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
                    isActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold whitespace-nowrap">
                    {tab.label}
                  </div>
                  <div className="text-sm text-slate-400 font-mono hidden sm:block whitespace-nowrap">
                    {tab.subtext}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
