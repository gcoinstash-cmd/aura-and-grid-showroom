/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MonroneyBanner } from './components/MonroneyBanner';
import { TelemetryMetricsStrip } from './components/TelemetryMetricsStrip';
import { QuadMotorTab } from './components/tabs/QuadMotorTab';
import { PostgresLedgerTab } from './components/tabs/PostgresLedgerTab';
import { OpenApiTab } from './components/tabs/OpenApiTab';
import { CloudRunHarnessTab } from './components/tabs/CloudRunHarnessTab';
import { ApaCovenantTab } from './components/tabs/ApaCovenantTab';
import { SimulationModal } from './components/SimulationModal';
import { HashVerifyModal } from './components/HashVerifyModal';
import { downloadSpecFile } from './utils/specExporter';
import { LedgerBlock } from './types/telemetry';
import { Activity, Database, Network, Server, ShieldCheck, Download, ExternalLink } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'vectoring' | 'postgres' | 'openapi' | 'cloudrun' | 'covenant'>('vectoring');
  const [currentNonce, setCurrentNonce] = useState(1048588);
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);
  const [isHashModalOpen, setIsHashModalOpen] = useState(false);

  // Pre-seeded ledger blocks
  const [recentBlocks, setRecentBlocks] = useState<LedgerBlock[]>([
    {
      blockHeight: 9812402,
      timestamp: '2026-10-12T22:45:10.428Z',
      nonce: 1048588,
      telemetryHash: '0x9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      previousHash: '0x3a4b7f8e1c2d9e0f5b6a7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f',
      signatureHmac: '0x8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c',
      verified: true,
      event: 'NORMAL_TELEMETRY: 5,000 Hz quad-motor torque loop synchronous heartbeat committed.',
    },
    {
      blockHeight: 9812401,
      timestamp: '2026-10-12T22:45:09.912Z',
      nonce: 1048587,
      telemetryHash: '0x3a4b7f8e1c2d9e0f5b6a7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f',
      previousHash: '0x1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d',
      signatureHmac: '0x7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b',
      verified: true,
      event: 'DYNAMIC_STEERING: Cornering yaw rate error corrected to +0.004 rad/s via inside wheel regen.',
    },
    {
      blockHeight: 9812400,
      timestamp: '2026-10-12T22:45:09.401Z',
      nonce: 1048586,
      telemetryHash: '0x1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d',
      previousHash: '0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f',
      signatureHmac: '0x6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a',
      verified: true,
      event: 'CATAPULT_LAUNCH: Full torque distribution verified (75% rear bias, 1,200 Nm clamp).',
    },
  ]);

  // Increment nonce on clock tick
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentNonce((n) => n + 1);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  const handleAddBlock = (block: LedgerBlock) => {
    setRecentBlocks((prev) => [block, ...prev.slice(0, 9)]);
    setCurrentNonce((n) => n + 1);
  };

  const navTabs = [
    { id: 'vectoring', label: '1. Quad-Motor Vectoring Core', icon: Activity },
    { id: 'postgres', label: '2. Postgres Solid-State Ledger', icon: Database },
    { id: 'openapi', label: '3. OpenAPI 3.1 Telemetry Contract', icon: Network },
    { id: 'cloudrun', label: '4. Turnkey Cloud Run Harness', icon: Server },
    { id: 'covenant', label: '5. Acquire.com APA Covenant', icon: ShieldCheck },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Main Content Container with standard relative/static flow */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Bulletproof MonroneyBanner (Hardened non-breaking layout) */}
        <MonroneyBanner
          onSimulate={() => setIsSimModalOpen(true)}
          onVerifyHash={() => setIsHashModalOpen(true)}
          onExportSpec={downloadSpecFile}
        />

        {/* Live Telemetry Metrics Strip */}
        <TelemetryMetricsStrip currentNonce={currentNonce} />

        {/* Five Navigable Tabs Selector */}
        <div className="border-b border-slate-800 mb-8 overflow-x-auto">
          <nav className="flex space-x-2 min-w-max pb-2" aria-label="Tabs">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-base font-bold rounded-lg transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-lg'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content Panels */}
        <div className="tab-content transition-all duration-150">
          {activeTab === 'vectoring' && <QuadMotorTab />}
          {activeTab === 'postgres' && (
            <PostgresLedgerTab recentBlocks={recentBlocks} onAddBlock={handleAddBlock} />
          )}
          {activeTab === 'openapi' && <OpenApiTab />}
          {activeTab === 'cloudrun' && <CloudRunHarnessTab />}
          {activeTab === 'covenant' && <ApaCovenantTab />}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950/80 py-8 px-4 sm:px-6 lg:px-8 mt-12 text-sm text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <span className="font-mono text-white font-bold">GF-T3-200-PROD</span>
            <span className="hidden sm:inline text-slate-700">|</span>
            <span className="text-slate-400">Heavy Overland Dynamics Platform Electrified Supercar Concept Core</span>
            <span className="hidden sm:inline text-slate-700">|</span>
            <span className="text-emerald-400 font-mono">Delaware Clean-Room Verified</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <button
              onClick={downloadSpecFile}
              className="hover:text-amber-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download GF_T3_200_SPEC.md
            </button>
            <span className="text-slate-700">|</span>
            <span className="text-slate-400">Standard Commercial Jurisdiction Jurisdiction</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <SimulationModal isOpen={isSimModalOpen} onClose={() => setIsSimModalOpen(false)} />
      <HashVerifyModal
        isOpen={isHashModalOpen}
        onClose={() => setIsHashModalOpen(false)}
        recentBlocks={recentBlocks}
      />
    </div>
  );
}
