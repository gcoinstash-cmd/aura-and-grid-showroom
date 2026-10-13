/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Zap,
  Database,
  FileCode2,
  Server,
  Scale,
  ShieldCheck,
  Download,
  CheckCircle2,
  Terminal,
  Activity,
  Award,
} from 'lucide-react';
import { MonroneyBanner } from './components/MonroneyBanner';
import { TelemetryCards } from './components/TelemetryCards';
import { TabRegenCore } from './components/TabRegenCore';
import { TabPostgresLedger } from './components/TabPostgresLedger';
import { TabOpenApiContract } from './components/TabOpenApiContract';
import { TabCloudRunHarness } from './components/TabCloudRunHarness';
import { TabApaCovenant } from './components/TabApaCovenant';
import { SimulateRegenModal } from './components/SimulateRegenModal';
import { VerifyLedgerModal } from './components/VerifyLedgerModal';
import { INITIAL_LEDGER_BLOCKS } from './data/mockTelemetry';
import { LedgerBlock } from './types/telemetry';
import { GF_T3_175_SPEC_CONTENT } from './data/specDocument';

export default function App() {
  const [activeTab, setActiveTab] = useState<number>(1);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState<boolean>(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState<boolean>(false);
  const [ledgerBlocks, setLedgerBlocks] = useState<LedgerBlock[]>(INITIAL_LEDGER_BLOCKS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleExportSpec = () => {
    const blob = new Blob([GF_T3_175_SPEC_CONTENT], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'GF_T3_175_SPEC.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('GF_T3_175_SPEC.md exported successfully for local vault archival.');
  };

  const handleBlockGenerated = (newBlock: LedgerBlock) => {
    setLedgerBlocks((prev) => [newBlock, ...prev]);
    showToast(`New Block #${newBlock.blockHeight.toLocaleString()} appended to PostgreSQL ledger.`);
  };

  const tabs = [
    {
      id: 1,
      name: 'Urban Edge & Regen Core',
      icon: Zap,
      badge: '500 Hz Python 3.12',
    },
    {
      id: 2,
      name: 'Postgres Battery Ledger',
      icon: Database,
      badge: 'PG16 Hypertables',
    },
    {
      id: 3,
      name: 'OpenAPI 3.1 Contract',
      icon: FileCode2,
      badge: 'REST & WebSocket',
    },
    {
      id: 4,
      name: 'Cloud Run Harness',
      icon: Server,
      badge: 'Distroless & PyTest',
    },
    {
      id: 5,
      name: 'Acquire.com APA Covenant',
      icon: Scale,
      badge: '$45K Turnkey Buyout',
    },
  ];

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-950 border border-emerald-500/50 text-emerald-200 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 font-mono text-sm transition-all animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 
        LAYOUT CONSTRAINT (CRITICAL):
        Header, Monroney banner, and telemetry cards MUST use standard relative/static positioning 
        so they scroll off the viewport naturally when scrolling down (zero sticky/fixed headers eating up vertical screen estate).
      */}
      <header className="relative w-full border-b border-slate-800 bg-slate-900/95 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500 flex items-center justify-center font-mono font-black text-slate-950 text-lg shadow-md shadow-cyan-500/30">
              GF
            </div>
            <div>
              <div className="text-base font-black tracking-wider uppercase text-white font-mono flex items-center gap-2">
                <span>GHOST FACTORYOS</span>
                <span className="text-slate-500 font-normal">|</span>
                <span className="text-cyan-400 font-semibold">SKUNKWORKS ASSET ENGINE</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm font-mono text-slate-300">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>ACQUIRE.COM MONOPOLY VAULT</span>
            </span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="hidden sm:inline text-slate-300 font-medium">
              TIER 3: F1 SKUNKWORKS SERVICE ENGINE
            </span>
          </div>
        </div>
      </header>

      {/* Monroney Top Banner (Relative / Static positioning) */}
      <MonroneyBanner
        onSimulateRegen={() => setIsSimulateModalOpen(true)}
        onVerifyLedger={() => setIsVerifyModalOpen(true)}
        onExportSpec={handleExportSpec}
      />

      {/* Live Telemetry Metrics Cards (Relative / Static positioning) */}
      <TelemetryCards
        onOpenSimulate={() => setIsSimulateModalOpen(true)}
        onOpenVerify={() => setIsVerifyModalOpen(true)}
      />

      {/* Main Tab Navigation & Workspaces */}
      <main className="relative flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Navigation Tabs Bar with standard relative positioning */}
        <div className="relative mb-8 border-b border-slate-800">
          <nav className="flex space-x-3 overflow-x-auto pb-3.5 scrollbar-thin" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group relative min-w-fit px-5 py-3.5 rounded-xl font-bold text-base sm:text-lg flex items-center gap-3 transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-slate-900 text-white border border-slate-700 shadow-md ring-2 ring-cyan-500/50'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 sm:w-6 sm:h-6 ${
                      isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                  />
                  <span>{tab.name}</span>
                  <span
                    className={`text-xs sm:text-sm font-mono px-2.5 py-1 rounded-md font-semibold ${
                      isActive
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                        : 'bg-slate-800/80 text-slate-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content Display */}
        <div className="relative pb-16">
          {activeTab === 1 && <TabRegenCore />}
          {activeTab === 2 && <TabPostgresLedger />}
          {activeTab === 3 && <TabOpenApiContract />}
          {activeTab === 4 && <TabCloudRunHarness />}
          {activeTab === 5 && <TabApaCovenant />}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative w-full border-t border-slate-800 bg-slate-900/90 py-8 px-4 sm:px-6 lg:px-8 mt-auto text-slate-300 text-base font-mono">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <span className="font-semibold">
              GF-T3-175 Lexus UX 300h Urban Edge Core • 100% Clean-Room Permissive MIT
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 font-mono">
            <span>Root Merkle: 0x98fa...e721</span>
            <span>•</span>
            <span>NIST FIPS 180-4</span>
            <span>•</span>
            <span className="text-emerald-400 font-bold">Escrow Buyout: $45,000 USD</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <SimulateRegenModal
        isOpen={isSimulateModalOpen}
        onClose={() => setIsSimulateModalOpen(false)}
        onBlockGenerated={handleBlockGenerated}
      />

      <VerifyLedgerModal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        blocks={ledgerBlocks}
      />
    </div>
  );
}
