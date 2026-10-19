/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Cpu,
  Clock,
  Radio,
  ExternalLink,
  Info,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { KpiRibbon } from './components/KpiRibbon';
import { Navigation, TabId } from './components/Navigation';
import { RadarSimulation } from './components/RadarSimulation';
import { LloydMathDerivation } from './components/LloydMathDerivation';
import { EngineSpecView } from './components/EngineSpecView';
import { DelawareApaView } from './components/DelawareApaView';
import { PythonCoreView } from './components/PythonCoreView';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('radar');
  const [currentEnergy, setCurrentEnergy] = useState<number>(425000);
  const [currentLatencyUs, setCurrentLatencyUs] = useState<number>(8.4);
  const [currentCoverage, setCurrentCoverage] = useState<number>(99.98);
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [timeString, setTimeString] = useState<string>('');

  // Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard navigation for tabs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === '1') setActiveTab('radar');
      else if (e.key === '2') setActiveTab('math');
      else if (e.key === '3') setActiveTab('spec');
      else if (e.key === '4') setActiveTab('apa');
      else if (e.key === '5') setActiveTab('python');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-200 ${
        highContrast ? 'bg-black text-white' : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* Skip to Main Content Link for WCAG Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-cyan-400 focus:text-slate-950 focus:font-bold focus:rounded-md focus:shadow-xl"
      >
        Skip to main content
      </a>

      {/* Main Top Header */}
      <header
        role="banner"
        className="w-full border-b border-slate-800/90 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 lg:px-8 py-3.5 shadow-md"
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Brand & Fleet Tier */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Cpu className="w-6 h-6 animate-pulse" aria-hidden="true" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold tracking-widest px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800 text-cyan-300 uppercase">
                  TRACK 3 // F1 SKUNKWORKS SERVICE ENGINE
                </span>
                <span className="text-xs font-mono text-emerald-400 font-bold hidden sm:inline">
                  70% BLUEPRINT COMPLETE
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-slate-50 font-mono mt-0.5">
                GF-T3-159 // VoronoiGrid Swarm
              </h1>
            </div>
          </div>

          {/* Right Header Status Bar */}
          <div className="flex items-center gap-4 text-xs font-mono text-slate-400 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800">
              <Clock className="w-4 h-4 text-cyan-400" aria-hidden="true" />
              <span className="text-slate-200">{timeString || '2026-10-09 20:26:25 UTC'}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800">
              <Lock className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              <span className="text-emerald-300 font-semibold">DELAWARE VAULT #749210</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main
        id="main-content"
        role="main"
        className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col gap-4"
      >
        {/* Top 4-Card KPI Ribbon */}
        <KpiRibbon
          currentLatencyUs={currentLatencyUs}
          currentCoverage={currentCoverage}
        />

        {/* 5-Tab Navigation Bar */}
        <Navigation
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          highContrast={highContrast}
          onToggleHighContrast={() => setHighContrast(!highContrast)}
        />

        {/* Tab 1: Live Voronoi Partitioning */}
        <div
          id="tab-panel-radar"
          role="tabpanel"
          aria-labelledby="tab-btn-radar"
          hidden={activeTab !== 'radar'}
          className={activeTab === 'radar' ? 'block w-full' : 'hidden'}
        >
          <RadarSimulation
            onEnergyUpdate={setCurrentEnergy}
            onLatencyUpdate={setCurrentLatencyUs}
            onCoverageUpdate={setCurrentCoverage}
          />
        </div>

        {/* Tab 2: Lloyd's Algorithm & Centroid Math */}
        <div
          id="tab-panel-math"
          role="tabpanel"
          aria-labelledby="tab-btn-math"
          hidden={activeTab !== 'math'}
          className={activeTab === 'math' ? 'block w-full' : 'hidden'}
        >
          <LloydMathDerivation currentEnergy={currentEnergy} />
        </div>

        {/* Tab 3: ENGINE_SPEC.md */}
        <div
          id="tab-panel-spec"
          role="tabpanel"
          aria-labelledby="tab-btn-spec"
          hidden={activeTab !== 'spec'}
          className={activeTab === 'spec' ? 'block w-full' : 'hidden'}
        >
          <EngineSpecView />
        </div>

        {/* Tab 4: Turnkey Software Asset Purchase Agreement */}
        <div
          id="tab-panel-apa"
          role="tabpanel"
          aria-labelledby="tab-btn-apa"
          hidden={activeTab !== 'apa'}
          className={activeTab === 'apa' ? 'block w-full' : 'hidden'}
        >
          <DelawareApaView />
        </div>

        {/* Tab 5: Python Core & Tests */}
        <div
          id="tab-panel-python"
          role="tabpanel"
          aria-labelledby="tab-btn-python"
          hidden={activeTab !== 'python'}
          className={activeTab === 'python' ? 'block w-full' : 'hidden'}
        >
          <PythonCoreView />
        </div>
      </main>

      {/* Cyber Defense Footer */}
      <footer
        role="contentinfo"
        className="w-full border-t border-slate-900 bg-slate-950 py-4 px-4 sm:px-6 lg:px-8 mt-auto text-xs font-mono text-slate-500"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>GF-T3-159 VORONOIGRID SWARM // CHIEF SYSTEMS ARCHITECT VERIFIED</span>
          </div>
          <div>
            <span>MONOPOLY VAULT LEVEL 3 // ZERO COPYLEFT // APA JURISDICTION DELAWARE</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
