/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Activity,
  ShieldCheck,
  RotateCcw,
  Server,
  FileCheck,
} from 'lucide-react';

import { ClientCQRSEngine } from './engine/cqrsEngine';
import { CorridorId } from './types/cqrs';
import { HudRibbon } from './components/HudRibbon';
import { CommandBusTab } from './components/CommandBusTab';
import { ReadProjectionsTab } from './components/ReadProjectionsTab';
import { EventReplayTab } from './components/EventReplayTab';
import { TamperDlqTab } from './components/TamperDlqTab';
import { TransferSpecTab } from './components/TransferSpecTab';

export default function App() {
  const [engine] = useState<ClientCQRSEngine>(() => new ClientCQRSEngine());
  const [activeCorridor, setActiveCorridor] = useState<string>(CorridorId.CORRIDOR_ALPHA);
  const [activeTab, setActiveTab] = useState<
    'COMMANDS' | 'PROJECTIONS' | 'REPLAY' | 'TAMPER_DLQ' | 'TRANSFER_SPEC'
  >('COMMANDS');
  const [, setTicker] = useState<number>(0);

  const forceRefresh = () => {
    setTicker((prev) => prev + 1);
  };

  // Periodic telemetry refresh loop (1 Hz)
  useEffect(() => {
    const timer = setInterval(() => {
      setTicker((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const telemetry = engine.getTelemetry();
  const currentVersion = engine.aggregateVersions.get(activeCorridor) || 1;
  const activeProjection = engine.materializedViews.get(activeCorridor);

  const handleResetGenesis = () => {
    engine.seedGenesisState();
    setActiveCorridor(CorridorId.CORRIDOR_ALPHA);
    forceRefresh();
  };

  return (
    <div className="min-h-screen bg-[#070A11] text-slate-100 flex flex-col font-sans">
      {/* 1. DOCKED TOP COMMAND BAR INLINE (Clean 2-Row Layout) */}
      <header className="border-b border-slate-800 bg-[#0B111E] px-3 sm:px-4 lg:px-6 py-2">
        <div className="max-w-7xl mx-auto space-y-1">
          {/* Row 1: flex items-center justify-between gap-1 w-full */}
          <div className="flex items-center justify-between gap-1 w-full">
            {/* Left: flex items-center gap-1.5 shrink min-w-0 */}
            <div className="flex items-center gap-1.5 shrink min-w-0">
              <div className="w-6 h-6 rounded bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center shrink-0">
                <Server className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-100 whitespace-nowrap">
                APEX-213
              </h1>
              <span className="font-mono text-[11px] text-cyan-400 font-semibold px-1.5 py-0.5 bg-cyan-950/60 rounded border border-cyan-800/50 whitespace-nowrap">
                TRACK 3
              </span>
            </div>

            {/* Right: flex items-center gap-1.5 shrink-0 */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-900 border border-slate-800 rounded font-mono text-[11px] text-emerald-400 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>ONLINE</span>
              </div>
              <button
                onClick={handleResetGenesis}
                className="px-2 py-0.5 text-[11px] font-semibold rounded border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1 shrink-0"
              >
                <RotateCcw className="w-3 h-3 text-slate-400" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Row 2: Shortened subtitle */}
          <div className="text-[11px] sm:text-xs text-slate-400 font-mono">
            Distributed CQRS · Event Sourcing · OCC · SHA-256
          </div>
        </div>
      </header>

      {/* Main Workspace Cockpit Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 lg:px-6 py-2">
        {/* 2. 4-Card Balanced Grid HUD Ribbon with Snapshot Compaction Gauge */}
        <HudRibbon
          telemetry={telemetry}
          activeCorridorVersion={currentVersion}
        />

        {/* 3. Un-clipped Horizontal Tab Strip */}
        <div className="w-full overflow-x-auto no-scrollbar scroll-smooth">
          <div className="flex items-center gap-1 p-1 bg-slate-900/90 border border-slate-800 rounded-xl my-2 text-xs font-medium min-w-max pr-6">
            {[
              { id: 'COMMANDS', label: 'Commands', icon: Terminal },
              { id: 'PROJECTIONS', label: 'Projections', icon: Activity },
              { id: 'REPLAY', label: 'Replay', icon: RotateCcw },
              { id: 'TAMPER_DLQ', label: 'DLQ', icon: ShieldCheck },
              { id: 'TRANSFER_SPEC', label: 'Transfer', icon: FileCheck },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={
                    'px-2.5 py-1 text-[11px] whitespace-nowrap shrink-0 rounded-lg transition-colors flex items-center gap-1 ' +
                    (isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60')
                  }
                >
                  <Icon className={'w-3 h-3 ' + (isActive ? 'text-cyan-400' : 'text-slate-400')} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Tab Workspace Panel */}
        <div className="mt-3">
          {activeTab === 'COMMANDS' && (
            <CommandBusTab
              engine={engine}
              activeCorridor={activeCorridor}
              onCorridorChange={(c) => {
                setActiveCorridor(c);
                forceRefresh();
              }}
              onRefresh={forceRefresh}
              projection={activeProjection}
            />
          )}

          {activeTab === 'PROJECTIONS' && (
            <ReadProjectionsTab
              engine={engine}
              activeCorridor={activeCorridor}
              onSelectCorridor={(c) => {
                setActiveCorridor(c);
                forceRefresh();
              }}
            />
          )}

          {activeTab === 'REPLAY' && (
            <EventReplayTab
              engine={engine}
              activeCorridor={activeCorridor}
            />
          )}

          {activeTab === 'TAMPER_DLQ' && (
            <TamperDlqTab
              engine={engine}
              onRefresh={forceRefresh}
            />
          )}

          {activeTab === 'TRANSFER_SPEC' && <TransferSpecTab />}
        </div>
      </main>

      {/* Institutional Cockpit Minimal Footer */}
      <footer className="border-t border-slate-800 bg-[#0B111E] py-2.5 mt-auto px-4 lg:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 font-mono">
          <div>
            APEX-213 Distributed CQRS &amp; Event Sourcing Engine · Standalone Direct Repository Transfer
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-300">NIST SP 800-218 SSDF v1.1</span>
            <span>·</span>
            <span className="text-emerald-400 font-semibold">100% Permissive Clean-Room IP</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
