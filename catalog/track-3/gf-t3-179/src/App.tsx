/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { MonroneyBanner } from './components/MonroneyBanner';
import { TelemetryMetricsStrip } from './components/TelemetryMetricsStrip';
import { TabDirect4EnergyCore } from './components/tabs/TabDirect4EnergyCore';
import { TabPostgresLedger } from './components/tabs/TabPostgresLedger';
import { TabOpenApiContract } from './components/tabs/TabOpenApiContract';
import { TabCloudRunHarness } from './components/tabs/TabCloudRunHarness';
import { TabAcquireCovenant } from './components/tabs/TabAcquireCovenant';
import { Cpu, Database, Network, Cloud, FileText } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'TAB1' | 'TAB2' | 'TAB3' | 'TAB4' | 'TAB5'>('TAB1');
  const [biasRatio, setBiasRatio] = useState<{ front: number; rear: number }>({ front: 55, rear: 45 });
  const [nonce, setNonce] = useState<number>(1048576);
  const [sweepSignal, setSweepSignal] = useState<number>(0);

  const mainContentRef = useRef<HTMLDivElement>(null);

  // Background monotonic nonce ticker (simulates live 1 kHz telemetry nonces)
  useEffect(() => {
    const interval = setInterval(() => {
      setNonce((prev) => prev + 1);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  const handleSimulateBias = () => {
    setActiveTab('TAB1');
    setSweepSignal((prev) => prev + 1);
    if (mainContentRef.current) {
      mainContentRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleVerifyLedger = () => {
    setActiveTab('TAB2');
    if (mainContentRef.current) {
      mainContentRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleUpdateBias = (front: number, rear: number) => {
    setBiasRatio({ front, rear });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Main Container in Standard Document Flow (No Sticky / Fixed Headers eating viewport) */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Bulletproof MonroneyBanner Layout */}
        <MonroneyBanner
          onSimulateBias={handleSimulateBias}
          onVerifyLedger={handleVerifyLedger}
        />

        {/* Live Telemetry Metrics Strip */}
        <TelemetryMetricsStrip
          currentBiasRatio={biasRatio}
          currentNonce={nonce}
          loopFrequencyHz={1000}
        />

        {/* 5-Tab Navigation Bar */}
        <div ref={mainContentRef} className="relative w-full mb-6">
          <div className="flex flex-row items-center gap-1.5 p-1.5 bg-slate-900/90 border border-slate-800 rounded-xl overflow-x-auto shadow-lg">
            <button
              onClick={() => setActiveTab('TAB1')}
              type="button"
              className={`px-3.5 py-2.5 rounded-lg text-[15px] font-semibold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'TAB1'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>DIRECT4 & PHEV Core</span>
            </button>

            <button
              onClick={() => setActiveTab('TAB2')}
              type="button"
              className={`px-3.5 py-2.5 rounded-lg text-[15px] font-semibold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'TAB2'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Postgres Hybrid Ledger</span>
            </button>

            <button
              onClick={() => setActiveTab('TAB3')}
              type="button"
              className={`px-3.5 py-2.5 rounded-lg text-[15px] font-semibold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'TAB3'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Network className="w-4 h-4" />
              <span>OpenAPI 3.1 Contract</span>
            </button>

            <button
              onClick={() => setActiveTab('TAB4')}
              type="button"
              className={`px-3.5 py-2.5 rounded-lg text-[15px] font-semibold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'TAB4'
                  ? 'bg-indigo-500 text-white font-bold shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Cloud className="w-4 h-4" />
              <span>Cloud Run Harness</span>
            </button>

            <button
              onClick={() => setActiveTab('TAB5')}
              type="button"
              className={`px-3.5 py-2.5 rounded-lg text-[15px] font-semibold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'TAB5'
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Acquire.com APA Covenant</span>
            </button>
          </div>
        </div>

        {/* Tab Content Panes */}
        <div className="relative w-full">
          {activeTab === 'TAB1' && (
            <TabDirect4EnergyCore
              onUpdateBias={handleUpdateBias}
              triggerSweepSignal={sweepSignal}
            />
          )}

          {activeTab === 'TAB2' && <TabPostgresLedger />}

          {activeTab === 'TAB3' && <TabOpenApiContract />}

          {activeTab === 'TAB4' && <TabCloudRunHarness />}

          {activeTab === 'TAB5' && <TabAcquireCovenant />}
        </div>
      </main>

      {/* Footer in Natural Document Flow */}
      <footer className="w-full border-t border-slate-900 bg-slate-950 py-6 px-4 sm:px-6 lg:px-8 mt-12 text-[15px] text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 font-mono">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold">Ghost FactoryOS</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-300">GF-T3-179 Master Engine</span>
          </div>
          <div className="text-center sm:text-right text-slate-500">
            Delaware Escrow Protocol · 100% Clean-Room Certified · Turnkey Acquire.com Buyout ($45,000 USD)
          </div>
        </div>
      </footer>
    </div>
  );
}
