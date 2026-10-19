/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { SettlementBay } from './components/SettlementBay';
import { TssClusterMesh } from './components/TssClusterMesh';
import { EngineSpecViewer } from './components/EngineSpecViewer';
import { MonopolyVaultViewer } from './components/MonopolyVaultViewer';
import { CodeViewer } from './components/CodeViewer';
import { ClientSettlementEngine } from './core/settlementEngine';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('settlement');
  const [currentLatency, setCurrentLatency] = useState<number>(11.8);

  // Memoize client-side cryptographic engine instance
  const engine = useMemo(() => new ClientSettlementEngine(), []);

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      {/* HUD Header */}
      <Header
        currentLatency={currentLatency}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Cockpit Bay Viewport */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'settlement' && (
          <SettlementBay
            engine={engine}
            onLatencyUpdate={lat => setCurrentLatency(lat)}
          />
        )}

        {activeTab === 'tss' && (
          <TssClusterMesh engine={engine} />
        )}

        {activeTab === 'spec' && (
          <EngineSpecViewer />
        )}

        {activeTab === 'vault' && (
          <MonopolyVaultViewer />
        )}

        {activeTab === 'code' && (
          <CodeViewer />
        )}
      </main>

      {/* Cockpit Footer */}
      <footer className="border-t border-slate-900 bg-[#050811] py-6 px-6">
        <div className="max-w-[1700px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm font-mono text-slate-300 font-bold">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-cyan-400">GF-T3-153 // AEGISSOVEREIGN ENGINE</span>
            <span>•</span>
            <span>THRESHOLD SCHNORR TSS &amp; ATOMIC DVP</span>
            <span>•</span>
            <span className="text-emerald-400">CLEAN-ROOM PROVENANCE</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-slate-300">
            <span>PORT 8080 DISTROLESS</span>
            <span>•</span>
            <span className="text-amber-400">20 kHz (0.48ms) STANDALONE ASSET TRANSFER</span>
            <span>•</span>
            <span>GHOST FACTORYOS INSTITUTIONAL</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
