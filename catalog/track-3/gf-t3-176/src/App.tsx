/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sliders, Database, FileCode, Server, ShieldCheck, Download, ExternalLink } from 'lucide-react';
import { MonroneyBanner } from './components/MonroneyBanner';
import { TelemetryCards } from './components/TelemetryCards';
import { EkdssTab } from './components/tabs/EkdssTab';
import { PostgresLedgerTab } from './components/tabs/PostgresLedgerTab';
import { OpenApiTab } from './components/tabs/OpenApiTab';
import { CloudRunTab } from './components/tabs/CloudRunTab';
import { ApaCovenantTab } from './components/tabs/ApaCovenantTab';
import { EkdssModal } from './components/modals/EkdssModal';
import { LedgerHashModal } from './components/modals/LedgerHashModal';
import { GF_T3_176_SPECIFICATION_MARKDOWN } from './data/specificationMarkdown';

type TabId = 'EKDSS_CORE' | 'POSTGRES_LEDGER' | 'OPENAPI_CONTRACT' | 'CLOUD_RUN' | 'APA_COVENANT';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('EKDSS_CORE');
  const [isEkdssModalOpen, setIsEkdssModalOpen] = useState<boolean>(false);
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState<boolean>(false);

  // Direct Markdown Spec Exporter function
  const handleExportSpec = () => {
    const blob = new Blob([GF_T3_176_SPECIFICATION_MARKDOWN], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'GF_T3_176_SPEC.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
      {/* 1. Monroney Top Banner (Relative / Static positioning so it scrolls off naturally) */}
      <div className="w-full px-4 sm:px-6 md:px-8 pt-6">
        <MonroneyBanner
          onSimulate={() => setIsEkdssModalOpen(true)}
          onVerifyLedger={() => setIsLedgerModalOpen(true)}
          onExportSpec={handleExportSpec}
        />
      </div>

      {/* 2. Live Telemetry Metrics Strip (Relative / Static positioning) */}
      <TelemetryCards
        loopFrequencyHz={1000}
        maxTravelInches={24.5}
        sequenceBlockCount={1000424}
        isCleanRoomCertified={true}
      />

      {/* 3. Five Navigable Tabs Navigation Bar (Relative / Static) */}
      <div className="relative w-full border-y border-neutral-800 bg-neutral-900/60 px-6 md:px-8">
        <div className="flex overflow-x-auto gap-3 py-3.5 no-scrollbar">
          {[
            {
              id: 'EKDSS_CORE',
              label: '1. E-KDSS & Differential Core',
              icon: Sliders,
              subtext: 'Python 3.12 State Machine',
            },
            {
              id: 'POSTGRES_LEDGER',
              label: '2. Postgres Terrain Ledger',
              icon: Database,
              subtext: 'PostgreSQL 16 Hypertables & HMAC',
            },
            {
              id: 'OPENAPI_CONTRACT',
              label: '3. OpenAPI 3.1 Terrain Contract',
              icon: FileCode,
              subtext: 'REST & 100 Hz WebSocket Schemas',
            },
            {
              id: 'CLOUD_RUN',
              label: '4. Turnkey Cloud Run Harness',
              icon: Server,
              subtext: 'Multi-Stage Docker & PyTest Bench',
            },
            {
              id: 'APA_COVENANT',
              label: '5. Acquire.com APA Covenant',
              icon: ShieldCheck,
              subtext: '$45k Buyout & Escrow Schedule',
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabId)}
                className={`flex items-center gap-3.5 px-6 py-3.5 rounded-xl border text-left whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-500/10 border-amber-500 text-amber-300 shadow-md shadow-amber-500/5'
                    : 'bg-neutral-950/60 border-neutral-800/80 text-neutral-400 hover:text-white hover:border-neutral-700'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-amber-400' : 'text-neutral-500'}`} />
                <div>
                  <div className={`text-[17px] font-bold ${isActive ? 'text-white' : 'text-neutral-200'}`}>
                    {tab.label}
                  </div>
                  <div className="text-base font-mono text-neutral-400">
                    {tab.subtext}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Active Tab Content (Document scroll naturally) */}
      <main className="relative flex-1 w-full max-w-7xl mx-auto">
        {activeTab === 'EKDSS_CORE' && <EkdssTab />}
        {activeTab === 'POSTGRES_LEDGER' && <PostgresLedgerTab />}
        {activeTab === 'OPENAPI_CONTRACT' && <OpenApiTab />}
        {activeTab === 'CLOUD_RUN' && <CloudRunTab />}
        {activeTab === 'APA_COVENANT' && <ApaCovenantTab />}
      </main>

      {/* 5. Quiet Institutional Footer */}
      <footer className="relative w-full border-t border-neutral-800 bg-neutral-900/50 py-8 px-6 md:px-8 mt-12 text-base text-neutral-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-bold text-white tracking-wider font-mono">GF-T3-176</span>
            <span>·</span>
            <span>Ghost FactoryOS Chief Systems Architecture Council</span>
            <span>·</span>
            <span className="text-emerald-400 font-semibold">Acquire.com Micro-APA Escrow Asset</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleExportSpec}
              className="hover:text-amber-400 transition-colors cursor-pointer flex items-center gap-2 font-medium"
            >
              <Download className="w-5 h-5" />
              <span>Export GF_T3_176_SPEC.md</span>
            </button>
          </div>
        </div>
      </footer>

      {/* 6. Modals */}
      <EkdssModal
        isOpen={isEkdssModalOpen}
        onClose={() => setIsEkdssModalOpen(false)}
      />

      <LedgerHashModal
        isOpen={isLedgerModalOpen}
        onClose={() => setIsLedgerModalOpen(false)}
      />
    </div>
  );
}
