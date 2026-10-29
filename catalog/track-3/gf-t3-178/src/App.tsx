/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TelemetryState, ActiveTab } from './types';
import { MonroneyBanner } from './components/MonroneyBanner';
import { TelemetryCards } from './components/TelemetryCards';
import { TabFxLMSCore } from './components/tabs/TabFxLMSCore';
import { TabPostgresLedger } from './components/tabs/TabPostgresLedger';
import { TabOpenAPIContract } from './components/tabs/TabOpenAPIContract';
import { TabCloudRunHarness } from './components/tabs/TabCloudRunHarness';
import { TabAPACovenant } from './components/tabs/TabAPACovenant';
import { FxLMSSimulationModal } from './components/modals/FxLMSSimulationModal';
import { VerifyLedgerModal } from './components/modals/VerifyLedgerModal';
import { TransferOfferModal } from './components/modals/TransferOfferModal';
import { GF_T3_178_SPEC_MD } from './data/specDocument';
import { Cpu, Database, Network, Cloud, FileCheck, Download } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('fxlms');
  const [fxlmsModalOpen, setFxlmsModalOpen] = useState(false);
  const [verifyLedgerModalOpen, setVerifyLedgerModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);

  // Live telemetry state
  const [telemetry, setTelemetry] = useState<TelemetryState>({
    engineRpm: 2400,
    engineHarmonicHz: 120.0,
    primaryNoiseDb: 68.4,
    antiPhaseAttenuationDb: -18.4,
    residualCabinDb: 50.0,
    targetBoostPsi: 17.2,
    actualBoostPsi: 16.92,
    wastegateDutyPercent: 44.8,
    throttlePositionPercent: 65.0,
    secondaryPathLatencyMs: 0.75,
    filterConvergenceEpochs: 420,
    isSimulating: true,
    isAntiPhaseActive: true,
    ledgerSequenceId: 1048580,
    lastHmacHash: '0d49f69ce831d4592ca972f778a481c00a6cb4433c2a685f67b55f1710b10e3c',
  });

  // Export GF_T3_178_SPEC.md file download
  const handleExportSpec = () => {
    const blob = new Blob([GF_T3_178_SPEC_MD], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'GF_T3_178_SPEC.md');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Main Cockpit Body Container with MonroneyBanner as sole clean top element */}
      <main className="relative flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Monroney Banner */}
        <MonroneyBanner
          onSimulate={() => setFxlmsModalOpen(true)}
          onVerifyLedger={() => setVerifyLedgerModalOpen(true)}
          onExportSpec={handleExportSpec}
        />

        {/* 4 Live Telemetry Metric Cards */}
        <TelemetryCards telemetry={telemetry} />

        {/* Tab Navigation: Five Navigable Tabs with Full Technical Implementation */}
        <div className="relative mb-8 border-b border-slate-800">
          <nav className="flex space-x-2 overflow-x-auto pb-1" aria-label="Flagship Engine Tabs">
            <button
              type="button"
              onClick={() => setActiveTab('fxlms')}
              className={`inline-flex items-center gap-2.5 px-5 py-3.5 rounded-t-xl text-base font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 border-b-2 ${
                activeTab === 'fxlms'
                  ? 'border-amber-400 text-amber-400 bg-slate-900/90'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <Cpu className="w-5 h-5 shrink-0" />
              <span>1. FxLMS Acoustic &amp; Boost Core</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('postgres')}
              className={`inline-flex items-center gap-2.5 px-5 py-3.5 rounded-t-xl text-base font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 border-b-2 ${
                activeTab === 'postgres'
                  ? 'border-cyan-400 text-cyan-400 bg-slate-900/90'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <Database className="w-5 h-5 shrink-0" />
              <span>2. Postgres Flagship Ledger</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('openapi')}
              className={`inline-flex items-center gap-2.5 px-5 py-3.5 rounded-t-xl text-base font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 border-b-2 ${
                activeTab === 'openapi'
                  ? 'border-purple-400 text-purple-400 bg-slate-900/90'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <Network className="w-5 h-5 shrink-0" />
              <span>3. OpenAPI 3.1 Flagship Contract</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('cloudrun')}
              className={`inline-flex items-center gap-2.5 px-5 py-3.5 rounded-t-xl text-base font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 border-b-2 ${
                activeTab === 'cloudrun'
                  ? 'border-emerald-400 text-emerald-400 bg-slate-900/90'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <Cloud className="w-5 h-5 shrink-0" />
              <span>4. Turnkey Cloud Run Harness</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('apa')}
              className={`inline-flex items-center gap-2.5 px-5 py-3.5 rounded-t-xl text-base font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 border-b-2 ${
                activeTab === 'apa'
                  ? 'border-amber-400 text-amber-400 bg-slate-900/90'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <FileCheck className="w-5 h-5 shrink-0" />
              <span>5. Acquire.com APA Covenant</span>
            </button>
          </nav>
        </div>

        {/* Tab Content Rendering */}
        <div className="relative">
          {activeTab === 'fxlms' && (
            <TabFxLMSCore telemetry={telemetry} setTelemetry={setTelemetry} />
          )}

          {activeTab === 'postgres' && (
            <TabPostgresLedger />
          )}

          {activeTab === 'openapi' && (
            <TabOpenAPIContract />
          )}

          {activeTab === 'cloudrun' && (
            <TabCloudRunHarness />
          )}

          {activeTab === 'apa' && (
            <TabAPACovenant
              onOpenTransferInquiry={() => setTransferModalOpen(true)}
              onExportSpec={handleExportSpec}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative w-full border-t border-slate-800 bg-slate-950 px-6 py-8 mt-16 text-slate-400 text-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-semibold text-slate-300">GF-T3-178 Flagship Core</span>
            <span className="mx-2">·</span>
            <span>Target Platform: Apex Executive LS 500 Executive AWD Saloon</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={handleExportSpec}
              className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export GF_T3_178_SPEC.md</span>
            </button>
            <button
              type="button"
              onClick={() => setTransferModalOpen(true)}
              className="text-amber-400 hover:text-amber-300 transition-colors cursor-pointer font-semibold"
            >
              Acquire.com Asset Transfer Escrow (20 kHz (0.48ms))
            </button>
          </div>
        </div>
      </footer>

      {/* Modals with top-right ✕, backdrop dismiss, and Escape listener */}
      <FxLMSSimulationModal
        isOpen={fxlmsModalOpen}
        onClose={() => setFxlmsModalOpen(false)}
      />

      <VerifyLedgerModal
        isOpen={verifyLedgerModalOpen}
        onClose={() => setVerifyLedgerModalOpen(false)}
      />

      <TransferOfferModal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        onExportSpec={handleExportSpec}
      />
    </div>
  );
}
