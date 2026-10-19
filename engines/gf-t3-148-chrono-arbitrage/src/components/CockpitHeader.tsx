import React from 'react';
import { Activity, Shield, Zap, Terminal, Database, FileCode } from 'lucide-react';

interface Props {
  activeTab: 'hud' | 'spec' | 'vault' | 'api' | 'artifacts';
  setActiveTab: (tab: 'hud' | 'spec' | 'vault' | 'api' | 'artifacts') => void;
  ticksPerSec: number;
  activeCyclesCount: number;
  engineTimeNs: number;
  isSimulating: boolean;
  setIsSimulating: (val: boolean | ((prev: boolean) => boolean)) => void;
  onRunBurst: () => void;
  isBursting: boolean;
}

export const CockpitHeader: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  activeCyclesCount,
  isSimulating,
  setIsSimulating,
  onRunBurst,
  isBursting,
}) => {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/95 backdrop-blur sticky top-0 z-50 shadow-md">
      {/* Top Banner: Engine Nomenclature & Institutional Status */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 border-b border-zinc-800/80 text-sm font-mono text-zinc-300">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 font-bold tracking-wider text-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            LIVE MESH
          </span>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-200 font-bold">SYSTEM CODE:</span>
          <span className="text-amber-400 font-semibold">T3-QUANT-02</span>
          <span className="hidden sm:inline text-zinc-600">|</span>
          <span className="hidden sm:inline text-zinc-300 font-medium">GHOST FACTORYOS F1 SKUNKWORKS</span>
        </div>

        <div className="flex items-center gap-4 mt-1 sm:mt-0">
          <div className="flex items-center gap-1.5 text-zinc-200 font-medium">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span>CLEAN-ROOM MIT/APACHE 2.0</span>
          </div>
          <span className="text-zinc-600">|</span>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-amber-950/60 border border-amber-500/50 text-amber-300 font-bold">
            <span>APA SPECIFICATION:</span>
            <span className="text-white">PostgreSQL 16 + RLS</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between px-4 py-3 gap-3">
        {/* Brand & Title */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-700/80 shadow-inner">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white font-mono uppercase">
                  Chrono-Arbitrage
                </h1>
                <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-mono text-zinc-200 font-semibold">
                  v1.0.4-PROD
                </span>
              </div>
              <p className="text-sm text-zinc-300 font-sans hidden lg:block">
                Sub-Millisecond Cross-Venue Latency &amp; Negative-Log Triangular Engine
              </p>
            </div>
          </div>

          {/* Quick Simulation Controls for Desktop / Mobile */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setIsSimulating((prev) => !prev)}
              className={`px-2.5 py-1.5 rounded text-xs font-mono font-bold transition flex items-center gap-1.5 border ${
                isSimulating
                  ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-300'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-200'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isSimulating ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'
                }`}
              />
              {isSimulating ? 'STREAM' : 'PAUSED'}
            </button>
          </div>
        </div>

        {/* Tab Navigation - Single Line Horizontal Scroll on <768px */}
        <nav
          aria-label="Navigation Tabs"
          className="w-full md:w-auto flex overflow-x-auto snap-x scrollbar-none gap-2 pb-1 items-center bg-zinc-900/90 p-1.5 rounded-lg border border-zinc-800 text-sm font-mono"
        >
          <button
            onClick={() => setActiveTab('hud')}
            className={`shrink-0 snap-start flex items-center gap-1.5 px-3.5 py-1.5 rounded-md transition text-sm font-bold ${
              activeTab === 'hud'
                ? 'bg-zinc-800 text-emerald-400 shadow-sm border border-emerald-500/30'
                : 'text-zinc-300 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            Cockpit HUD
            {activeCyclesCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 text-xs font-extrabold">
                {activeCyclesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('spec')}
            className={`shrink-0 snap-start flex items-center gap-1.5 px-3.5 py-1.5 rounded-md transition text-sm font-bold ${
              activeTab === 'spec'
                ? 'bg-zinc-800 text-amber-300 shadow-sm border border-amber-500/30'
                : 'text-zinc-300 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <Terminal className="w-4 h-4 text-amber-300" />
            ENGINE_SPEC.md
          </button>

          <button
            onClick={() => setActiveTab('vault')}
            className={`shrink-0 snap-start flex items-center gap-1.5 px-3.5 py-1.5 rounded-md transition text-sm font-bold ${
              activeTab === 'vault'
                ? 'bg-zinc-800 text-cyan-300 shadow-sm border border-cyan-500/30'
                : 'text-zinc-300 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <Shield className="w-4 h-4 text-cyan-400" />
            Monopoly Vault Docs
          </button>

          <button
            onClick={() => setActiveTab('api')}
            className={`shrink-0 snap-start flex items-center gap-1.5 px-3.5 py-1.5 rounded-md transition text-sm font-bold ${
              activeTab === 'api'
                ? 'bg-zinc-800 text-violet-300 shadow-sm border border-violet-500/30'
                : 'text-zinc-300 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <Database className="w-4 h-4 text-violet-400" />
            OpenAPI &amp; WS
          </button>

          <button
            onClick={() => setActiveTab('artifacts')}
            className={`shrink-0 snap-start flex items-center gap-1.5 px-3.5 py-1.5 rounded-md transition text-sm font-bold ${
              activeTab === 'artifacts'
                ? 'bg-zinc-800 text-pink-300 shadow-sm border border-pink-500/30'
                : 'text-zinc-300 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <FileCode className="w-4 h-4 text-pink-400" />
            Deploy &amp; PyTest
          </button>
        </nav>

        {/* Quick Simulation Controls - Desktop */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => setIsSimulating((prev) => !prev)}
            className={`px-3 py-1.5 rounded text-sm font-mono font-bold transition flex items-center gap-2 border ${
              isSimulating
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400 hover:bg-emerald-900/60'
                : 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700'
            }`}
          >
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isSimulating ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'
              }`}
            />
            {isSimulating ? 'ENGINE STREAMING' : 'STREAM PAUSED'}
          </button>

          <button
            onClick={onRunBurst}
            disabled={isBursting}
            className="px-3.5 py-1.5 rounded text-sm font-mono font-bold bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 hover:bg-cyan-900/60 transition flex items-center gap-1.5 disabled:opacity-50"
            title="Pumps 50,000 synthetic ticks into the solver ring buffer"
          >
            <Zap className={`w-4 h-4 ${isBursting ? 'animate-spin' : ''}`} />
            {isBursting ? 'BURSTING...' : 'TEST 50K TICKS/S'}
          </button>
        </div>
      </div>
    </header>
  );
};
