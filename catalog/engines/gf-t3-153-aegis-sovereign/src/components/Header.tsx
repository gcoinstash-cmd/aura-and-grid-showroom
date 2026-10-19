import React from 'react';
import { ShieldCheck, Cpu, DollarSign, Activity, Zap, Layers, Terminal } from 'lucide-react';

interface HeaderProps {
  currentLatency: number;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentLatency, activeTab, setActiveTab }) => {
  return (
    <header className="border-b border-cyan-900/40 bg-[#080d1a]/95 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 py-4">
        {/* Top Bar: Title & High-Visibility Badges */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.3)] shrink-0">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-widest text-cyan-400/90 bg-cyan-950/70 px-2.5 py-0.5 rounded border border-cyan-500/30">
                  TRACK 3 // F1 SKUNKWORKS
                </span>
                <span className="text-xs font-bold text-slate-300 font-mono">
                  PROD v1.0.0
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white flex items-center gap-2 mt-0.5">
                AEGISSOVEREIGN ENGINE <span className="text-cyan-400">// GF-T3-153</span>
              </h1>
            </div>
          </div>

          {/* High-Visibility Status Pill Badges */}
          <div className="flex flex-wrap items-center gap-3">
            {/* 20 kHz (0.48ms) APA ASSET TRANSFER */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-950/40 border border-amber-500/70 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
              <DollarSign className="w-5 h-5 text-amber-400" />
              <span className="text-base font-black tracking-wide">20 kHz (0.48ms) APA ASSET TRANSFER</span>
            </div>

            {/* Latency Gauge */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-950/40 border border-cyan-500/70 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
              <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
              <span className="text-base font-bold font-mono">Latency: {currentLatency.toFixed(1)} ms</span>
            </div>

            {/* Consensus Badge */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-950/40 border border-emerald-500/70 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <Zap className="w-5 h-5 text-emerald-400" />
              <span className="text-base font-bold">Consensus: 3-of-5 FROST TSS</span>
            </div>

            {/* Clean IP Verified */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/90 border border-cyan-400/50 text-slate-100">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              <span className="text-base font-bold">Clean IP Verified</span>
            </div>
          </div>
        </div>

        {/* Cockpit Navigation Tabs */}
        <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'settlement', label: '1. Live Atomic Settlement Bay', icon: Zap },
            { id: 'tss', label: '2. TSS Node Cluster & Key Mesh', icon: Cpu },
            { id: 'spec', label: '3. ENGINE_SPEC.md', icon: Layers },
            { id: 'vault', label: '4. Monopoly Vault & APA Agreement', icon: DollarSign },
            { id: 'code', label: '5. Production Python Core & Cloud Run', icon: Terminal },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-4.5 py-3 rounded-xl text-base font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)] font-black'
                    : 'text-slate-200 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-slate-950' : 'text-cyan-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
