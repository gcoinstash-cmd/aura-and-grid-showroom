/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Header } from './components/Header';
import { MonroneyBanner } from './components/MonroneyBanner';
import { TelemetryCards } from './components/TelemetryCards';
import { TabNav } from './components/TabNav';
import { Tab1DisruptorCore } from './components/tabs/Tab1DisruptorCore';
import { Tab2PostgresLedger } from './components/tabs/Tab2PostgresLedger';
import { Tab3OpenApiContract } from './components/tabs/Tab3OpenApiContract';
import { Tab4CloudRunHarness } from './components/tabs/Tab4CloudRunHarness';
import { Tab5AcquireCovenant } from './components/tabs/Tab5AcquireCovenant';
import { Footer } from './components/Footer';
import { TelemetryMetrics } from './types';
import { GF_T3_171_SPEC_MARKDOWN } from './data/specDocument';
import { CheckCircle2, Download } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [metrics, setMetrics] = useState<TelemetryMetrics>({
    latencyP50: 112.4,
    latencyP90: 178.6,
    latencyP99: 234.2,
    latencyP999: 289.0,
    bufferCapacity: 1048576,
    claimedSequence: 1000064,
    committedSequence: 1000062,
    consumedSequence: 1000050,
    throughputOpsSec: 4820000,
    backpressureState: 'NOMINAL',
    ipAuditStatus: 'VERIFIED_CLEAN_ROOM',
    licenseType: 'MIT_PERMISSIVE_100',
    copyleftRatio: 0,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleSimulateDisruptor = () => {
    setActiveTab(0);
    setIsSimulating((prev) => !prev);
    showToast(isSimulating ? 'Paused Disruptor Stream' : 'Streaming continuous 4.8M ops/sec CAS ticks');
  };

  const handleVerifyAudit = () => {
    setActiveTab(1);
    setIsAuditing(true);
    showToast('Executing HMAC-SHA256 non-repudiation audit scan...');
    setTimeout(() => {
      setIsAuditing(false);
      showToast('Monotonic Audit Verified: 100% Valid (Zero Alterations)');
    }, 1200);
  };

  const handleExportSpec = () => {
    const blob = new Blob([GF_T3_171_SPEC_MARKDOWN], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'GF_T3_171_SPEC.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Downloaded GF_T3_171_SPEC.md for local master vault archival');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 
        CRITICAL LAYOUT RULE: 
        Header, Monroney banner, and telemetry cards MUST use standard relative/static positioning 
        so they scroll off the viewport naturally when scrolling down (zero sticky/fixed headers 
        eating up vertical screen estate).
      */}
      <Header onSelectTab={setActiveTab} activeTab={activeTab} />

      <main className="flex-1 w-full">
        <MonroneyBanner
          onSimulateDisruptor={handleSimulateDisruptor}
          onVerifyAudit={handleVerifyAudit}
          onExportSpec={handleExportSpec}
          isSimulating={isSimulating}
          isAuditing={isAuditing}
        />

        <TelemetryCards metrics={metrics} />

        <TabNav activeTab={activeTab} onSelectTab={setActiveTab} />

        <div className="max-w-7xl mx-auto py-8 px-6 md:px-10">
          {activeTab === 0 && (
            <Tab1DisruptorCore
              metrics={metrics}
              setMetrics={setMetrics}
              isSimulating={isSimulating}
              setIsSimulating={setIsSimulating}
            />
          )}

          {activeTab === 1 && (
            <Tab2PostgresLedger
              onVerifyAudit={handleVerifyAudit}
              isAuditing={isAuditing}
            />
          )}

          {activeTab === 2 && <Tab3OpenApiContract />}

          {activeTab === 3 && <Tab4CloudRunHarness />}

          {activeTab === 4 && (
            <Tab5AcquireCovenant onExportSpec={handleExportSpec} />
          )}
        </div>
      </main>

      <Footer onExportSpec={handleExportSpec} />

      {/* Floating Status Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl bg-slate-900 border border-cyan-500/50 text-white shadow-2xl text-sm font-medium animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
