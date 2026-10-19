/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { MonroneyBanner } from './components/MonroneyBanner';
import { TelemetryMetricsStrip } from './components/TelemetryMetricsStrip';
import { TabDualVectorTorqueCore } from './components/TabDualVectorTorqueCore';
import { TabPostgresLedger } from './components/TabPostgresLedger';
import { TabOpenApiContract } from './components/TabOpenApiContract';
import { TabCloudRunHarness } from './components/TabCloudRunHarness';
import { TabAcquireApa } from './components/TabAcquireApa';
import { HashVerificationModal } from './components/HashVerificationModal';
import { PowertrainState, LedgerBlock } from './types/telemetry';
import { simulateStep, generateInitialLedgerBlocks } from './utils/dual_vector_torqueEngine';
import { GF_T3_183_FULL_SPEC } from './data/specDocument';
import { Zap, Database, Network, Terminal, FileText } from 'lucide-react';

export default function App() {
  // Master powertrain state
  const [powertrainState, setPowertrainState] = useState<PowertrainState>({
    speedKmh: 45.0,
    throttleDemand: 60.0,
    yokeAngleDeg: -25.0,
    roadFrictionMu: 1.0,
    frontTorqueNm: 154.2,
    rearTorqueNm: 102.8,
    frontPowerKw: 48.5,
    rearPowerKw: 32.3,
    frontRpm: 3280,
    rearRpm: 3280,
    frontInverterTempC: 51.4,
    rearInverterTempC: 48.2,
    dual_vector_torqueSplitFront: 60,
    dual_vector_torqueSplitRear: 40,
    steeringRatio: 8.3,
    roadWheelAngleDeg: -3.0,
    fluxWeakeningActive: false,
    idFluxA: -7.2,
    iqTorqueA: 138.5,
    dcBusVoltage: 351.4,
    packCurrentA: 230.1,
    batterySoc: 82.5,
    batteryCellDeltaMv: 11.2,
    focFrequencyHz: 2500,
    monotonicNonce: 1000183,
    hmacSignature: 'a7f9b8c2d1e0f4a3b5c6d7e8f90123456789abcdef0123456789abcdef012345',
  });

  const [ledgerBlocks, setLedgerBlocks] = useState<LedgerBlock[]>([]);
  const [activeTab, setActiveTab] = useState<number>(1);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isTampered, setIsTampered] = useState(false);

  // Initialize ledger blocks on mount
  useEffect(() => {
    generateInitialLedgerBlocks().then((blocks) => {
      setLedgerBlocks(blocks);
    });
  }, []);

  // Update inputs and re-run simulation step
  const handleUpdateInputs = useCallback(
    async (inputs: {
      speedKmh?: number;
      throttleDemand?: number;
      yokeAngleDeg?: number;
      roadFrictionMu?: number;
    }) => {
      const nextState = await simulateStep(powertrainState, inputs);
      setPowertrainState(nextState);
    },
    [powertrainState]
  );

  // Simulate DualVectorTorque button action
  const handleSimulate = async () => {
    setIsSimulating(true);
    // Dynamic iteration: vary inputs slightly or cycle to simulate active dynamics
    const targetSpeed = Math.min(180, Math.max(0, powertrainState.speedKmh + (Math.random() * 8 - 4)));
    const targetYoke = Math.min(150, Math.max(-150, powertrainState.yokeAngleDeg + (Math.random() * 20 - 10)));
    const nextState = await simulateStep(powertrainState, {
      speedKmh: Math.round(targetSpeed * 10) / 10,
      yokeAngleDeg: Math.round(targetYoke),
    });
    setPowertrainState(nextState);
    setTimeout(() => setIsSimulating(false), 250);
  };

  // Verify Hash button action
  const handleVerifyHash = () => {
    setIsVerifyModalOpen(true);
  };

  // Export Spec button action (downloads GF_T3_183_SPEC.md)
  const handleExportSpec = () => {
    const blob = new Blob([GF_T3_183_FULL_SPEC], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'GF_T3_183_SPEC.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleTriggerTamper = () => {
    setIsTampered(true);
  };

  const handleRestoreChain = () => {
    setIsTampered(false);
  };

  const navTabs = [
    { id: 1, label: 'DualVectorTorque BEV & Steer-by-Wire Core', icon: Zap },
    { id: 2, label: 'Postgres BEV Ledger', icon: Database },
    { id: 3, label: 'OpenAPI 3.1 Telemetry Contract', icon: Network },
    { id: 4, label: 'Turnkey Cloud Run Harness', icon: Terminal },
    { id: 5, label: 'Acquire.com APA Covenant', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 1. Monroney Banner (Hardened Non-Breaking Protocol) */}
      <MonroneyBanner
        onSimulate={handleSimulate}
        onVerifyHash={handleVerifyHash}
        onExportSpec={handleExportSpec}
        isSimulating={isSimulating}
      />

      {/* 2. Live Telemetry Metrics Strip */}
      <TelemetryMetricsStrip state={powertrainState} />

      {/* 3. Five Navigable Tabs Navigation Bar */}
      <nav aria-label="Cockpit Tabs" className="w-full px-4 md:px-6 border-b border-slate-800 bg-slate-950/80">
        <div className="flex flex-row items-center gap-1 sm:gap-2 overflow-x-auto py-2">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[15px] font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Tab Content Viewport */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-6">
        {activeTab === 1 && (
          <TabDualVectorTorqueCore state={powertrainState} onUpdateInputs={handleUpdateInputs} />
        )}
        {activeTab === 2 && (
          <TabPostgresLedger
            blocks={ledgerBlocks}
            onTriggerTamper={handleTriggerTamper}
            onRestoreChain={handleRestoreChain}
            isTampered={isTampered}
          />
        )}
        {activeTab === 3 && <TabOpenApiContract state={powertrainState} />}
        {activeTab === 4 && <TabCloudRunHarness />}
        {activeTab === 5 && <TabAcquireApa />}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 py-6 px-4 md:px-6 text-center text-xs text-slate-400 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span>Ghost FactoryOS · GF-T3-183 Heavy Overland Dynamics Platform RZ 450e DualVectorTorque Core</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Delaware Micro-APA Asset</span>
            <span aria-hidden="true">·</span>
            <span>0% Copyleft</span>
            <span aria-hidden="true">·</span>
            <span>SHA-256 Verified</span>
          </div>
        </div>
      </footer>

      {/* Cryptographic Verification Modal */}
      <HashVerificationModal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        state={powertrainState}
        blocks={ledgerBlocks}
        isTampered={isTampered}
      />
    </div>
  );
}
