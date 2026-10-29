/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Car, Database, FileCode, Server, FileText, 
  CheckCircle2, ExternalLink, ShieldCheck, Download, Sliders, Hash 
} from 'lucide-react';

import { RideHeightMode } from './types/cockpit';
import { MonroneyBanner } from './components/MonroneyBanner';
import { TelemetryMetricsStrip } from './components/TelemetryMetricsStrip';
import { SuspensionCoreTab } from './components/tabs/SuspensionCoreTab';
import { HydraulicLedgerTab } from './components/tabs/HydraulicLedgerTab';
import { OpenApiContractTab } from './components/tabs/OpenApiContractTab';
import { CloudRunHarnessTab } from './components/tabs/CloudRunHarnessTab';
import { ApaCovenantTab } from './components/tabs/ApaCovenantTab';
import { HeightSimulationModal } from './components/HeightSimulationModal';
import { LedgerVerificationModal } from './components/LedgerVerificationModal';
import { downloadSpecFile } from './utils/specExporter';

type ActiveTab = 'suspension' | 'ledger' | 'openapi' | 'cloudrun' | 'apa';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('suspension');
  const [currentMode, setCurrentMode] = useState<RideHeightMode>('NORMAL');
  const [nonce, setNonce] = useState<number>(1000042);
  const [isHeightModalOpen, setIsHeightModalOpen] = useState(false);
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);

  // Monotonic nonce counter to reflect active 1,250 Hz loop telemetry
  useEffect(() => {
    const timer = setInterval(() => {
      setNonce((prev) => prev + 1);
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  const getModeDeltaIn = (mode: RideHeightMode): number => {
    switch (mode) {
      case 'LOW':
        return -1.2;
      case 'NORMAL':
        return 0.0;
      case 'COMFORT':
        return 0.4;
      case 'SPORT_PLUS':
        return -0.8;
      case 'HIGH1':
        return 1.2;
      case 'HIGH2':
        return 2.8;
      case 'ROCK':
        return 2.4;
    }
  };

  const handleExportSpec = () => {
    downloadSpecFile();
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950">
      {/* Background ambient gradient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-amber-500/5 via-transparent to-transparent pointer-events-none -z-10" />

      {/* Main Container - strictly relative document flow */}
      <main className="relative max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16">
        {/* MANDATORY HARDENED HEADER: MonroneyBanner */}
        <MonroneyBanner
          onSimulateHeight={() => setIsHeightModalOpen(true)}
          onVerifyLedgerHash={() => setIsLedgerModalOpen(true)}
          onExportSpec={handleExportSpec}
        />

        {/* LIVE TELEMETRY METRICS STRIP: 4 Cards */}
        <TelemetryMetricsStrip
          currentMode={currentMode}
          heightDeltaIn={getModeDeltaIn(currentMode)}
          nonce={nonce}
          isSimulating={false}
        />

        {/* 5-Tab Navigation Bar */}
        <nav aria-label="Engine Cockpit Navigation" className="relative mb-6">
          <div className="flex flex-row items-center gap-1.5 p-1.5 bg-slate-900/90 border border-slate-800 rounded-xl overflow-x-auto shadow-md">
            {[
              {
                id: 'suspension' as const,
                label: '1. AHC Suspension & Twin-Turbo',
                icon: Car,
                badge: '1,250 Hz',
              },
              {
                id: 'ledger' as const,
                label: '2. Postgres Hydraulic Ledger',
                icon: Database,
                badge: 'HMAC-SHA256',
              },
              {
                id: 'openapi' as const,
                label: '3. OpenAPI 3.1 Contract',
                icon: FileCode,
                badge: 'WSS Stream',
              },
              {
                id: 'cloudrun' as const,
                label: '4. Turnkey Cloud Run Harness',
                icon: Server,
                badge: '>90% PyTest',
              },
              {
                id: 'apa' as const,
                label: '5. Acquire.com APA Covenant',
                icon: FileText,
                badge: '20 kHz (0.48ms) APA',
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-[15px] font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                  <span
                    className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
                      isActive
                        ? 'bg-slate-950/20 text-slate-950'
                        : 'bg-slate-800 text-amber-400/90 border border-slate-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Tab Content Display */}
        <section aria-label="Active Tab Specification">
          {activeTab === 'suspension' && (
            <SuspensionCoreTab
              currentMode={currentMode}
              onSelectMode={(mode) => setCurrentMode(mode)}
            />
          )}

          {activeTab === 'ledger' && <HydraulicLedgerTab />}

          {activeTab === 'openapi' && <OpenApiContractTab />}

          {activeTab === 'cloudrun' && <CloudRunHarnessTab />}

          {activeTab === 'apa' && <ApaCovenantTab />}
        </section>
      </main>

      {/* Footer in natural document flow */}
      <footer className="relative w-full border-t border-slate-800/80 bg-slate-950 py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-white font-bold">GF-T3-180</span>
            <span className="text-slate-700">|</span>
            <span>Apex Executive Ultra-Heavy Telemetry Core Ultra Luxury Executive Core</span>
            <span className="text-slate-700 hidden md:inline">|</span>
            <span className="text-emerald-400 hidden md:inline">Acquire.com Turnkey Micro-APA Asset</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={handleExportSpec}
              className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Download GF_T3_180_SPEC.md</span>
            </button>
            <span className="text-slate-700">|</span>
            <span>Clean-Room Certified</span>
          </div>
        </div>
      </footer>

      {/* Interactive Modals */}
      <HeightSimulationModal
        isOpen={isHeightModalOpen}
        onClose={() => setIsHeightModalOpen(false)}
        currentMode={currentMode}
        onSelectMode={(mode) => setCurrentMode(mode)}
      />

      <LedgerVerificationModal
        isOpen={isLedgerModalOpen}
        onClose={() => setIsLedgerModalOpen(false)}
        nonce={nonce}
      />
    </div>
  );
}
