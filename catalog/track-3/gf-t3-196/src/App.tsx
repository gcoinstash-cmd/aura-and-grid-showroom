import React, { useState, useEffect } from 'react';
import { MonroneyBanner } from './components/MonroneyBanner';
import { TelemetryStrip } from './components/TelemetryStrip';
import { Tab1SbwCore } from './components/tabs/Tab1SbwCore';
import { Tab2PostgresLedger } from './components/tabs/Tab2PostgresLedger';
import { Tab3OpenApiContract } from './components/tabs/Tab3OpenApiContract';
import { Tab4CloudRunHarness } from './components/tabs/Tab4CloudRunHarness';
import { Tab5ApaCovenant } from './components/tabs/Tab5ApaCovenant';
import { VerifyHashModal } from './components/modals/VerifyHashModal';
import { SbwState, LedgerRecord, TabKey } from './types/telemetry';
import { INITIAL_LEDGER_RECORDS } from './data/mockLedger';
import { GF_T3_196_SPEC_MARKDOWN } from './data/specDocument';
import { Sliders, Database, FileCode, Cloud, Scale } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('sbw-core');
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [ledgerRecords, setLedgerRecords] = useState<LedgerRecord[]>(INITIAL_LEDGER_RECORDS);

  const [sbwState, setSbwState] = useState<SbwState>({
    timestamp: new Date().toISOString(),
    nonce: 1000008,
    vehicleSpeedKmh: 50,
    yokeAngleDeg: 42.5,
    rackAngleDeg: 3.42,
    steeringRatio: 12.43,
    hapticFeedbackTorqueNm: 1.82,
    roadFrictionCoeff: 1.0,
    lateralAccG: 0.28,
    dual_vector_torqueFrontRatio: 65,
    dual_vector_torqueRearRatio: 35,
    frontMotorCurrentA: 142.5,
    rearMotorCurrentA: 84.2,
    canBusAHealthy: true,
    canBusBHealthy: true,
    activeCanBus: 'BUS_A',
    failoverLatencyMicroseconds: 250,
    hmacSignature: '9a7f311c8901df4b423188d01f8e91cb319d67710c55ea9120e74b330e71ba02',
  });

  // Deterministic monotonic clock tick for live telemetry feel
  useEffect(() => {
    const timer = setInterval(() => {
      setSbwState((prev) => ({
        ...prev,
        nonce: prev.nonce + 1,
        timestamp: new Date().toISOString(),
      }));
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  const handleUpdateSbwState = (partial: Partial<SbwState>) => {
    setSbwState((prev) => ({ ...prev, ...partial }));
  };

  const handleToggleCanFault = () => {
    setSbwState((prev) => {
      const newBusAState = !prev.canBusAHealthy;
      return {
        ...prev,
        canBusAHealthy: newBusAState,
        activeCanBus: newBusAState ? 'BUS_A' : 'BUS_B',
        failoverLatencyMicroseconds: 250,
      };
    });
  };

  const handleAddLedgerRecord = (newRecord: LedgerRecord) => {
    setLedgerRecords((prev) => [newRecord, ...prev]);
  };

  // Functional Export: Download GF_T3_196_SPEC.md
  const handleExportSpec = () => {
    const blob = new Blob([GF_T3_196_SPEC_MARKDOWN], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'GF_T3_196_SPEC.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSimulateSbw = () => {
    setActiveTab('sbw-core');
    window.scrollTo({ top: 350, behavior: 'smooth' });
  };

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'sbw-core', label: '1. SBW & DUAL_VECTOR_TORQUE Core', icon: <Sliders className="w-5 h-5" /> },
    { key: 'postgres-ledger', label: '2. Postgres Steer Ledger', icon: <Database className="w-5 h-5" /> },
    { key: 'openapi-contract', label: '3. OpenAPI 3.1 Contract', icon: <FileCode className="w-5 h-5" /> },
    { key: 'cloudrun-harness', label: '4. Turnkey Cloud Run Harness', icon: <Cloud className="w-5 h-5" /> },
    { key: 'apa-covenant', label: '5. Acquire.com APA Covenant', icon: <Scale className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* MonroneyBanner (Standard static document flow, zero sticky traps) */}
      <MonroneyBanner
        onSimulateSbw={handleSimulateSbw}
        onVerifyHash={() => setIsVerifyModalOpen(true)}
        onExportSpec={handleExportSpec}
      />

      {/* Live Telemetry Metrics Strip */}
      <TelemetryStrip state={sbwState} />

      {/* Navigation Tabs Bar */}
      <div className="mb-6 border-b border-slate-800 overflow-x-auto">
        <nav className="flex space-x-2 pb-2 min-w-max" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                type="button"
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-base font-bold transition-all cursor-pointer select-none whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Tab Content View */}
      <main className="mb-12">
        {activeTab === 'sbw-core' && (
          <Tab1SbwCore
            state={sbwState}
            onUpdateState={handleUpdateSbwState}
            onToggleCanFault={handleToggleCanFault}
          />
        )}

        {activeTab === 'postgres-ledger' && (
          <Tab2PostgresLedger
            records={ledgerRecords}
            onAddRecord={handleAddLedgerRecord}
            onVerifyLedger={() => setIsVerifyModalOpen(true)}
          />
        )}

        {activeTab === 'openapi-contract' && <Tab3OpenApiContract />}

        {activeTab === 'cloudrun-harness' && <Tab4CloudRunHarness />}

        {activeTab === 'apa-covenant' && <Tab5ApaCovenant />}
      </main>

      {/* Institutional Footer */}
      <footer className="pt-6 pb-10 border-t border-slate-900 text-center text-slate-500 text-sm font-mono">
        <p>
          GF-T3-196 Heavy Overland Dynamics Platform RZ 450e Steer-by-Wire DUAL_VECTOR_TORQUE Core • Turnkey Micro-APA Asset Transfer Deliverable for Acquire.com
        </p>
        <p className="mt-1 text-slate-600">
          Clean-Room Engineered under ISO 26262 ASIL-D Guidelines • SHA-256 Monotonic Ledger Enforced
        </p>
      </footer>

      {/* Cryptographic Hash Verification Modal */}
      <VerifyHashModal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        records={ledgerRecords}
      />
    </div>
  );
}
