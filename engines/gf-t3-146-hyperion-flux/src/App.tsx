/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Header } from './components/Header';
import { TelemetryHud } from './components/TelemetryHud';
import { MathEngineViewer } from './components/MathEngineViewer';
import { AlloyDbExplorer } from './components/AlloyDbExplorer';
import { OpenApiConsole } from './components/OpenApiConsole';
import { LegalVaultViewer } from './components/LegalVaultViewer';
import { EngineSpecViewer } from './components/EngineSpecViewer';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('hud');
  const [p99LatencyUs, setP99LatencyUs] = useState<number>(418.4);
  const [throughputEvSec, setThroughputEvSec] = useState<number>(10420000);
  const [clockUs, setClockUs] = useState<number>(1000000);

  const handleMetricsUpdate = (metrics: { p99LatencyUs: number; throughputEvSec: number; clockUs: number }) => {
    setP99LatencyUs(metrics.p99LatencyUs);
    setThroughputEvSec(metrics.throughputEvSec);
    setClockUs(metrics.clockUs);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Header & Subsystem Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        p99LatencyUs={p99LatencyUs}
        currentThroughputEvSec={throughputEvSec}
        clockUs={clockUs}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {activeTab === 'hud' && <TelemetryHud onMetricsUpdate={handleMetricsUpdate} />}
        {activeTab === 'math' && <MathEngineViewer />}
        {activeTab === 'alloydb' && <AlloyDbExplorer />}
        {activeTab === 'openapi' && <OpenApiConsole />}
        {activeTab === 'legal' && <LegalVaultViewer />}
        {activeTab === 'spec' && <EngineSpecViewer />}
      </main>

      {/* Enterprise Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="font-mono font-bold text-slate-300">GHOST FACTORYOS FLEET TRACK 3 (F1 SKUNKWORKS)</span>
            <span>•</span>
            <span>Asset GF-T3-146</span>
          </div>
          <div className="flex items-center gap-6">
            <span>Delaware Court of Chancery Jurisdiction</span>
            <span>100% Permissive Clean-Room IP</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
