/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Radar,
  Network,
  FileText,
  DollarSign,
  Code2,
  Sliders,
  ShieldCheck,
  Cpu,
} from 'lucide-react';
import { SwarmSimulation } from './engine/swarmSimulation';
import { SwarmConfig, TelemetryState } from './types/swarm';
import { HeaderBadges } from './components/HeaderBadges';
import { RadarFlightBay } from './components/RadarFlightBay';
import { MeshTopologyView } from './components/MeshTopologyView';
import { EngineSpecView } from './components/EngineSpecView';
import { MonopolyVaultView } from './components/MonopolyVaultView';
import { PythonCoreView } from './components/PythonCoreView';

type CockpitTab = 'radar' | 'topology' | 'spec' | 'vault' | 'python';

export default function App() {
  const [activeTab, setActiveTab] = useState<CockpitTab>('radar');

  // Single persistent simulation instance
  const sim = useMemo(() => new SwarmSimulation(48), []);
  const [config, setConfig] = useState<SwarmConfig>(sim.config);
  const [telemetry, setTelemetry] = useState<TelemetryState>(sim.telemetry);

  // Sync state periodically from simulation
  React.useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry({ ...sim.telemetry });
    }, 250);
    return () => clearInterval(interval);
  }, [sim]);

  const handleConfigChange = (newConfig: Partial<SwarmConfig>) => {
    sim.config = { ...sim.config, ...newConfig };
    setConfig({ ...sim.config });
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950 font-medium">
      {/* 1. Header with Asset Tag & 4 Responsive Telemetry Badges */}
      <HeaderBadges telemetry={telemetry} nodeCount={sim.nodes.length} />

      {/* 2. Cockpit Navigation Bar */}
      <nav className="border-b border-slate-800/80 bg-[#0a0f1d] sticky top-0 z-40 backdrop-blur-md px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between py-2.5 gap-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-nowrap py-1 scroll-smooth w-full lg:w-auto">
            <button
              onClick={() => setActiveTab('radar')}
              className={`flex-shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm md:text-base font-mono font-bold transition-all whitespace-nowrap ${
                activeTab === 'radar'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-400 shadow-[0_0_15px_-3px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <Radar className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>1. Live Swarm Radar &amp; Bay</span>
            </button>

            <button
              onClick={() => setActiveTab('topology')}
              className={`flex-shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm md:text-base font-mono font-bold transition-all whitespace-nowrap ${
                activeTab === 'topology'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-400 shadow-[0_0_15px_-3px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <Network className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>2. Mesh Topology &amp; Fiedler λ₂</span>
            </button>

            <button
              onClick={() => setActiveTab('spec')}
              className={`flex-shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm md:text-base font-mono font-bold transition-all whitespace-nowrap ${
                activeTab === 'spec'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-400 shadow-[0_0_15px_-3px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <FileText className="w-4 h-4 text-amber-400 shrink-0" />
              <span>3. ENGINE_SPEC.md</span>
            </button>

            <button
              onClick={() => setActiveTab('vault')}
              className={`flex-shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm md:text-base font-mono font-bold transition-all whitespace-nowrap ${
                activeTab === 'vault'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-400 shadow-[0_0_15px_-3px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <DollarSign className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>4. Monopoly Vault &amp; APA</span>
            </button>

            <button
              onClick={() => setActiveTab('python')}
              className={`flex-shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm md:text-base font-mono font-bold transition-all whitespace-nowrap ${
                activeTab === 'python'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-400 shadow-[0_0_15px_-3px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <Code2 className="w-4 h-4 text-rose-400 shrink-0" />
              <span>5. Python Core &amp; Tests</span>
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-slate-500 pl-4 border-l border-slate-800 shrink-0">
            <span>GF-T3-157</span>
            <span className="text-emerald-400 font-bold">100Hz</span>
          </div>
        </div>
      </nav>

      {/* 3. Main Cockpit Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8">
        {activeTab === 'radar' && (
          <RadarFlightBay
            sim={sim}
            telemetry={telemetry}
            config={config}
            onConfigChange={handleConfigChange}
          />
        )}

        {activeTab === 'topology' && (
          <MeshTopologyView sim={sim} telemetry={telemetry} />
        )}

        {activeTab === 'spec' && <EngineSpecView />}

        {activeTab === 'vault' && <MonopolyVaultView />}

        {activeTab === 'python' && <PythonCoreView />}
      </main>

      {/* 4. Footer Telemetry Bar */}
      <footer className="border-t border-slate-800/80 bg-[#070b13] px-4 py-3 text-xs font-mono text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="text-white font-bold">GF-T3-157 // SWARMSYNC</span>
            <span className="text-slate-600">|</span>
            <span>Sub-10µs Neighbor Consensus</span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400 font-bold">Zero-Collision CBF Guaranteed</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Asset Asset Transfer: <strong className="text-emerald-300">20 kHz (0.48ms)</strong></span>
            <span>Delaware Turnkey IP</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
