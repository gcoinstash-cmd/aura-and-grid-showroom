import React, { useState } from 'react';
import { HeaderHUD } from './components/HeaderHUD';
import { TabNavigation } from './components/TabNavigation';
import { AlgoSimulatorTab } from './components/AlgoSimulatorTab';
import { OpenApiSandboxTab } from './components/OpenApiSandboxTab';
import { SpecAndExportTab } from './components/SpecAndExportTab';
import { ArchitecturalTopologyTab } from './components/ArchitecturalTopologyTab';
import { AlloyDbSchemaTab } from './components/AlloyDbSchemaTab';
import { MonopolyVaultTab } from './components/MonopolyVaultTab';
import { ActiveTab } from './types/quant';
import { ShieldCheck, Cpu, Database, Network, Zap } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('simulator');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-300">
      
      {/* HUD Header with live monotonic clock and latency meter */}
      <HeaderHUD activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* 6 Core Navigation Tabs */}
      <TabNavigation activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Main Engineering Workstation Viewport */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto px-4 lg:px-6 py-6">
        {activeTab === 'simulator' && <AlgoSimulatorTab />}
        {activeTab === 'sandbox' && <OpenApiSandboxTab />}
        {activeTab === 'spec' && <SpecAndExportTab />}
        {activeTab === 'topology' && <ArchitecturalTopologyTab />}
        {activeTab === 'alloydb' && <AlloyDbSchemaTab />}
        {activeTab === 'vault' && <MonopolyVaultTab />}
      </main>

      {/* Institutional Engineering Footer */}
      <footer className="bg-slate-900/80 border-t border-slate-800/80 py-4 px-4 lg:px-6 mt-12 text-xs font-mono">
        <div className="max-w-[1720px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-slate-400">
          <div className="flex items-center gap-3">
            <span className="text-white font-bold flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              CHRONOS-TICK // GF-T3-141
            </span>
            <span>•</span>
            <span>Ghost FactoryOS Lead Systems Architecture</span>
            <span>•</span>
            <span className="text-emerald-400 font-bold">100% Permissive MIT / Apache-2.0</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span className="text-slate-300">Target Latency: <strong className="text-emerald-400">4.80 ms</strong></span>
            <span>•</span>
            <span className="text-slate-300">AlloyDB: <strong className="text-amber-400">RPO = 0</strong></span>
            <span>•</span>
            <span className="text-slate-300">Specification: <strong className="text-emerald-300">PostgreSQL 16 + RLS</strong></span>
          </div>
        </div>
      </footer>

    </div>
  );
}
