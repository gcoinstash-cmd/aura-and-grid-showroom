import React, { useState, useEffect } from 'react';
import { MonroneyBanner } from './components/MonroneyBanner';
import { TelemetryMetricsStrip } from './components/TelemetryMetricsStrip';
import { DualVectorTorqueSimulationTab } from './components/tabs/DualVectorTorqueSimulationTab';
import { PostgresLedgerTab } from './components/tabs/PostgresLedgerTab';
import { OpenApiContractTab } from './components/tabs/OpenApiContractTab';
import { CloudRunHarnessTab } from './components/tabs/CloudRunHarnessTab';
import { ApaCovenantTab } from './components/tabs/ApaCovenantTab';
import { VerifyHashModal } from './components/VerifyHashModal';
import { downloadSpecMarkdown } from './utils/exportSpec';
import { TelemetryState } from './types/telemetry';
import { Sliders, Database, Globe, Cloud, Scale } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dual_vector_torque' | 'ledger' | 'openapi' | 'cloudrun' | 'covenant'>('dual_vector_torque');
  const [isHashModalOpen, setIsHashModalOpen] = useState(false);

  // Live telemetry state
  const [telemetry, setTelemetry] = useState<TelemetryState>({
    speedMph: 45,
    throttlePercent: 40,
    brakePercent: 0,
    steeringAngleDeg: 25,
    yawRateDegPerSec: 2.4,
    lateralG: 0.32,
    longitudinalG: 0.18,
    driveMode: 'SPORT',
    corneringPhase: 'STRAIGHT',
    frontTorqueSplit: 70,
    rearTorqueSplit: 30,
    drsAngleDeg: 0.12,
    inverterFreqHz: 2500,
    frontMotorKw: 24,
    engineHp: 108,
    rearEaxleKw: 32,
    bipolarBatteryTempC: 34.2,
    batterySocPercent: 74,
    nonce: 1048292,
    ledgerHmac: 'a7f9b8c2d1e0456f98231ab456e7890123456789abcdef0123456789abcdef01',
  });

  // Background subtle monotonic ledger tick
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry((prev) => ({
        ...prev,
        nonce: prev.nonce + 1,
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateTelemetry = (partial: Partial<TelemetryState>) => {
    setTelemetry((prev) => ({
      ...prev,
      ...partial,
    }));
  };

  const handleSimulateDualVectorTorque = () => {
    setActiveTab('dual_vector_torque');
    // Set an exciting corner-exit catapult state
    handleUpdateTelemetry({
      speedMph: 52,
      throttlePercent: 90,
      brakePercent: 0,
      steeringAngleDeg: 110,
      corneringPhase: 'ACCEL_EXIT',
      frontTorqueSplit: 20,
      rearTorqueSplit: 80,
      drsAngleDeg: 1.85,
      frontMotorKw: 55,
      engineHp: 245,
      rearEaxleKw: 80,
    });
  };

  const tabs = [
    { id: 'dual_vector_torque', label: '1. DUAL_VECTOR_TORQUE & DRS Performance Core', icon: Sliders },
    { id: 'ledger', label: '2. PostgreSQL 16 Hybrid Ledger', icon: Database },
    { id: 'openapi', label: '3. OpenAPI 3.1 Telemetry Contract', icon: Globe },
    { id: 'cloudrun', label: '4. Turnkey Cloud Run Harness', icon: Cloud },
    { id: 'covenant', label: '5. Acquire.com APA Covenant', icon: Scale },
  ] as const;

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 antialiased font-sans">
      {/* Top Application Bar */}
      <header className="border-b border-slate-800 bg-slate-950/80 px-4 sm:px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold font-mono text-sm">
              GF
            </div>
            <div>
              <span className="font-extrabold text-white font-display text-lg tracking-tight block">
                Ghost FactoryOS
              </span>
              <span className="text-xs font-mono text-slate-400 block -mt-1">
                Autonomous Vehicle Dealership Fleet Tier 3
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded">
              Acquire.com Turnkey Asset Transfer Ready
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* 1. Bulletproof MonroneyBanner Layout */}
        <MonroneyBanner
          onSimulate={handleSimulateDualVectorTorque}
          onVerifyHash={() => setIsHashModalOpen(true)}
          onExportSpec={downloadSpecMarkdown}
        />

        {/* 2. Live Telemetry Metrics Strip (Strict 16px font floor on labels) */}
        <TelemetryMetricsStrip
          telemetry={telemetry}
          onSelectTab={(tabId) => setActiveTab(tabId as any)}
        />

        {/* 3. Five Navigable Tabs Segmented Navigation */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-1.5 overflow-x-auto">
          <div className="flex items-center gap-1 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  type="button"
                  className={`px-3.5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Tab Content Body */}
        <div className="min-h-[500px]">
          {activeTab === 'dual_vector_torque' && (
            <DualVectorTorqueSimulationTab
              telemetry={telemetry}
              onUpdateTelemetry={handleUpdateTelemetry}
            />
          )}

          {activeTab === 'ledger' && <PostgresLedgerTab />}

          {activeTab === 'openapi' && <OpenApiContractTab telemetry={telemetry} />}

          {activeTab === 'cloudrun' && <CloudRunHarnessTab />}

          {activeTab === 'covenant' && <ApaCovenantTab />}
        </div>
      </main>

      {/* Verification Modal */}
      <VerifyHashModal
        isOpen={isHashModalOpen}
        onClose={() => setIsHashModalOpen(false)}
        telemetry={telemetry}
      />
    </div>
  );
}
