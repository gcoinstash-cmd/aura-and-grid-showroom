/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Activity, 
  ShieldCheck, 
  Zap, 
  Layers, 
  Cpu, 
  Database, 
  Radio, 
  Code2, 
  FileText, 
  Share2, 
  FileCode, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface HeaderHUDProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  frameSeq: number;
  loopLatencyMs: number;
  isSimulating: boolean;
  onQuickRunTest: () => void;
}

export const HeaderHUD: React.FC<HeaderHUDProps> = ({
  activeTab,
  setActiveTab,
  frameSeq,
  loopLatencyMs,
  isSimulating,
  onQuickRunTest,
}) => {
  const tabs = [
    { id: 'simulator', label: '1. 3D SPATIAL FUSION SIMULATOR', icon: Radio, badge: '125Hz LIVE' },
    { id: 'openapi', label: '2. OPENAPI 3.1 LIVE SANDBOX', icon: Code2, badge: 'v3.1.0' },
    { id: 'spec', label: '3. SPECIFICATION & 10/10 EXPORT', icon: FileText, badge: '70% BLUEPRINT' },
    { id: 'topology', label: '4. ARCHITECTURAL TOPOLOGY', icon: Share2, badge: 'ZERO-COPY' },
    { id: 'alloydb', label: '5. ALLOYDB DDL SCHEMA', icon: Database, badge: 'POSTGIS 3D' },
    { id: 'vault', label: '6. MONOPOLY VAULT & APA AGREEMENT', icon: ShieldCheck, badge: 'Turnkey Software Asset Purchase Agreement' },
  ];

  return (
    <header className="border-b border-zinc-800/80 bg-slate-950/95 backdrop-blur-md sticky top-0 z-50">
      {/* Top Telemetry Strip */}
      <div className="border-b border-zinc-800/60 bg-slate-900/60 px-4 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-sm font-mono">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-zinc-400">ENGINE:</span>
              <span className="text-cyan-300 font-bold tracking-wider">GF-T3-140 (VOXELTRACK-EDGE)</span>
            </div>
            <div className="hidden sm:inline-block text-zinc-700">|</div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">LOOP:</span>
              <span className="text-emerald-400 font-bold">125 Hz (8.0ms clock)</span>
            </div>
            <div className="hidden md:inline-block text-zinc-700">|</div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">INGEST:</span>
              <span className="text-slate-200 font-medium">12.4M pts/sec (64-Beam)</span>
            </div>
            <div className="hidden lg:inline-block text-zinc-700">|</div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">ZERO-COPY SHM:</span>
              <span className="text-purple-300 font-medium">/dev/shm/ring (0.00% DROP)</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 px-3 py-1 rounded-full text-xs font-semibold shadow-sm emerald-glow">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="tracking-wider uppercase">10/10 MONOPOLY READY</span>
            </div>
            <div className="text-xs text-zinc-400 bg-zinc-900/80 px-2.5 py-1 rounded border border-zinc-800 font-mono">
              SPECIFICATION: <span className="text-amber-400 font-bold">PostgreSQL 16 + RLS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Brand & HUD Header */}
      <div className="px-4 py-3.5 max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 via-blue-600/20 to-purple-600/20 border border-cyan-500/40 text-cyan-400 shadow-lg shadow-cyan-950/50">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-300 to-purple-400">
                    GHOST FACTORYOS
                  </span>
                  <span className="text-zinc-500 font-light">/</span>
                  <span className="text-slate-100 font-bold text-xl">VoxelTrack-Edge 3D</span>
                </h1>
                <span className="text-xs font-mono font-semibold uppercase px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                  Track 3 Skunkworks
                </span>
              </div>
              <p className="text-sm text-zinc-400 mt-0.5">
                3D Spatial Perception & Dynamic Octree Voxel Fusion Engine • Enterprise Dealership Fleet Tier 3
              </p>
            </div>
          </div>
        </div>

        {/* Real-Time Gauges & Test Button */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Frame Sequence Counter */}
          <div className="bg-slate-900/90 border border-zinc-800 px-3.5 py-1.5 rounded-lg text-left shadow-sm">
            <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center justify-between gap-2">
              <span>FRAME SEQ</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
            </div>
            <div className="text-base font-mono font-bold text-cyan-300">
              #{frameSeq.toLocaleString()}
            </div>
          </div>

          {/* 125Hz Loop Latency Gauge */}
          <div className="bg-slate-900/90 border border-zinc-800 px-3.5 py-1.5 rounded-lg text-left shadow-sm">
            <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center justify-between gap-2">
              <span>LOOP LATENCY</span>
              <span className="text-[10px] text-emerald-400 font-bold">TARGET: 7.4ms</span>
            </div>
            <div className="text-base font-mono font-bold flex items-center gap-1.5">
              <span className={loopLatencyMs <= 7.6 ? 'text-emerald-400' : 'text-amber-400'}>
                {loopLatencyMs.toFixed(2)} ms
              </span>
              <span className="text-[11px] text-zinc-500 font-normal">P99</span>
            </div>
          </div>

          {/* Quick Action Button */}
          <button
            onClick={onQuickRunTest}
            className={`px-4 py-2 rounded-lg font-bold text-sm tracking-wide transition-all duration-200 flex items-center gap-2 shadow-lg ${
              isSimulating
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 emerald-glow'
            }`}
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>{isSimulating ? 'PAUSE FUSION STREAM' : 'RUN 125Hz FUSION TEST'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="px-4 max-w-7xl mx-auto overflow-x-auto no-scrollbar">
        <nav className="flex items-center gap-1.5 border-t border-zinc-800/60 pt-1 pb-1.5 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 relative ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-zinc-400 hover:text-slate-100 hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-zinc-500'}`} />
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase ${
                    isActive
                      ? 'bg-cyan-400/20 text-cyan-200 border border-cyan-400/30'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {tab.badge}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
