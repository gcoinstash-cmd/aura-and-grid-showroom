/**
 * @license
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 Ghost FactoryOS
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MonroneyBanner } from './components/MonroneyBanner';
import { TelemetryMetricsStrip } from './components/TelemetryMetricsStrip';
import { TabAVSDamping } from './components/tabs/TabAVSDamping';
import { TabPostgresLedger } from './components/tabs/TabPostgresLedger';
import { TabOpenAPISpec } from './components/tabs/TabOpenAPISpec';
import { TabCloudRunHarness } from './components/tabs/TabCloudRunHarness';
import { TabAPACovenant } from './components/tabs/TabAPACovenant';
import { HashVerificationModal } from './components/HashVerificationModal';
import { TelemetryFrame, LedgerBlock, DriveMode } from './types/telemetry';
import { GF_T3_185_SPEC_CONTENT } from './data/specDocument';
import { Activity, Database, Network, Cloud, Scale, Download } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'avs' | 'ledger' | 'openapi' | 'cloudrun' | 'apa'>('avs');
  const [isSimulating, setIsSimulating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [divergenceFaultActive, setDivergenceFaultActive] = useState(false);

  // Initial Telemetry State
  const [telemetry, setTelemetry] = useState<TelemetryFrame>({
    nonce: 1048291,
    timestamp: new Date().toISOString(),
    speedMph: 62.4,
    rollAngleDeg: 1.4,
    pitchVelocityDegS: -0.6,
    verticalAccelG: 0.98,
    lateralAccelG: 0.18,
    driveMode: 'SPORT_S_PLUS',
    dampers: {
      FL: {
        corner: 'FL',
        solenoidCurrentMa: 980.0,
        forceStep: 312,
        dampingCoefficientNs: 3880.0,
        strokeVelocityMmS: 28.4,
        hydraulicPressureBar: 24.5,
        sealStatus: 'NOMINAL',
      },
      FR: {
        corner: 'FR',
        solenoidCurrentMa: 1020.0,
        forceStep: 330,
        dampingCoefficientNs: 4020.0,
        strokeVelocityMmS: -24.1,
        hydraulicPressureBar: 25.1,
        sealStatus: 'NOMINAL',
      },
      RL: {
        corner: 'RL',
        solenoidCurrentMa: 860.0,
        forceStep: 268,
        dampingCoefficientNs: 3500.0,
        strokeVelocityMmS: 18.2,
        hydraulicPressureBar: 22.8,
        sealStatus: 'NOMINAL',
      },
      RR: {
        corner: 'RR',
        solenoidCurrentMa: 890.0,
        forceStep: 275,
        dampingCoefficientNs: 3560.0,
        strokeVelocityMmS: -16.5,
        hydraulicPressureBar: 23.2,
        sealStatus: 'NOMINAL',
      },
    },
    phev: {
      batterySocPercent: 84.6,
      batteryPackVoltageV: 355.2,
      regenPowerKw: 34.2,
      brakeBlendingRatio: 0.18,
      predictiveDecelActive: true,
    },
    blockHash: '7e9b04f98126d405e32a68c919faec0b4e29bca17a941e9760dc484920ab20e1',
    previousHash: '5a4c990b71239e248b1a8d052718e03bc98fa240984da6281047192bf483011b',
  });

  // Ledger Blocks history
  const [ledgerBlocks, setLedgerBlocks] = useState<LedgerBlock[]>([
    {
      blockNumber: 42089,
      nonce: 1048291,
      timestamp: '2026-10-11T22:12:00.184Z',
      event: 'STEADY_STATE_CRUISE_DISPATCH',
      solenoidAvgStep: 312,
      regenKw: 34.2,
      sealIntegrity: '100% NOMINAL',
      previousHash: '5a4c990b71239e248b1a8d052718e03bc98fa240984da6281047192bf483011b',
      merkleRoot: 'd8924b11e290af102837bcde20184910efab7310298374102948751029384756',
      signatureHmac: '7e9b04f98126d405e32a68c919faec0b4e29bca17a941e9760dc484920ab20e1',
      verified: true,
    },
    {
      blockNumber: 42088,
      nonce: 1048290,
      timestamp: '2026-10-11T22:11:59.684Z',
      event: 'CURVE_APPROACH_PREDICTIVE_REGEN',
      solenoidAvgStep: 345,
      regenKw: 48.6,
      sealIntegrity: '100% NOMINAL',
      previousHash: '1a98e4726bf02819472658190284716294719284719284719284719284719284',
      merkleRoot: 'c748291038471920384719203847192038471920384719203847192038471920',
      signatureHmac: '5a4c990b71239e248b1a8d052718e03bc98fa240984da6281047192bf483011b',
      verified: true,
    },
    {
      blockNumber: 42087,
      nonce: 1048289,
      timestamp: '2026-10-11T22:11:59.184Z',
      event: 'SURFACE_EXPANSION_JOINT_HEAVE',
      solenoidAvgStep: 420,
      regenKw: 22.4,
      sealIntegrity: '100% NOMINAL',
      previousHash: '9847192837461928374619283746192837461928374619283746192837461928',
      merkleRoot: 'b192837465019283746501928374650192837465019283746501928374650192',
      signatureHmac: '1a98e4726bf02819472658190284716294719284719284719284719284719284',
      verified: true,
    },
  ]);

  // Telemetry periodic gentle tick for live feeling
  useEffect(() => {
    if (isSimulating) return;

    const interval = setInterval(() => {
      setTelemetry((prev) => {
        const nextNonce = prev.nonce + 1;
        const jitter = Math.sin(nextNonce * 0.1) * 0.3;
        const flStep = Math.min(650, Math.max(1, Math.round(312 + jitter * 15)));
        const frStep = Math.min(650, Math.max(1, Math.round(330 - jitter * 12)));
        const rlStep = Math.min(650, Math.max(1, Math.round(268 + jitter * 8)));
        const rrStep = Math.min(650, Math.max(1, Math.round(275 - jitter * 8)));

        return {
          ...prev,
          nonce: nextNonce,
          timestamp: new Date().toISOString(),
          dampers: {
            ...prev.dampers,
            FL: {
              ...prev.dampers.FL,
              forceStep: flStep,
              solenoidCurrentMa: 200 + (flStep / 650) * 1600,
            },
            FR: {
              ...prev.dampers.FR,
              forceStep: frStep,
              solenoidCurrentMa: 200 + (frStep / 650) * 1600,
            },
            RL: {
              ...prev.dampers.RL,
              forceStep: rlStep,
              solenoidCurrentMa: 200 + (rlStep / 650) * 1600,
            },
            RR: {
              ...prev.dampers.RR,
              forceStep: rrStep,
              solenoidCurrentMa: 200 + (rrStep / 650) * 1600,
            },
          },
        };
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [isSimulating]);

  // Compute average solenoid step
  const avgSolenoidStep = useMemo(() => {
    const { FL, FR, RL, RR } = telemetry.dampers;
    return Math.round((FL.forceStep + FR.forceStep + RL.forceStep + RR.forceStep) / 4);
  }, [telemetry.dampers]);

  // Action: Simulate AVS Dynamic Slalom Maneuver
  const handleSimulateAVS = () => {
    setIsSimulating(true);
    setActiveTab('avs');

    // Run dynamic 3-phase slalom transition
    let tick = 0;
    const simInterval = setInterval(() => {
      tick++;

      setTelemetry((prev) => {
        const nextNonce = prev.nonce + 1;
        let roll = 0;
        let latG = 0;
        let stepMultiplier = 1;

        if (tick < 5) {
          // Sharp Left Swerve
          roll = -6.8;
          latG = -0.78;
          stepMultiplier = 1.65;
        } else if (tick < 10) {
          // Sharp Right Counter-Swerve
          roll = 7.4;
          latG = 0.84;
          stepMultiplier = 1.78;
        } else {
          // Settling back to center
          roll = 0.8;
          latG = 0.12;
          stepMultiplier = 1.0;
        }

        const flStep = Math.min(650, Math.max(1, Math.round(280 * stepMultiplier + (roll > 0 ? 140 : -60))));
        const frStep = Math.min(650, Math.max(1, Math.round(280 * stepMultiplier + (roll < 0 ? 140 : -60))));
        const rlStep = Math.min(650, Math.max(1, Math.round(240 * stepMultiplier + (roll > 0 ? 110 : -40))));
        const rrStep = Math.min(650, Math.max(1, Math.round(240 * stepMultiplier + (roll < 0 ? 110 : -40))));

        return {
          ...prev,
          nonce: nextNonce,
          rollAngleDeg: roll,
          lateralAccelG: latG,
          dampers: {
            FL: {
              ...prev.dampers.FL,
              forceStep: flStep,
              solenoidCurrentMa: 200 + (flStep / 650) * 1600,
              dampingCoefficientNs: 1200 + (flStep / 650) * 5600,
            },
            FR: {
              ...prev.dampers.FR,
              forceStep: frStep,
              solenoidCurrentMa: 200 + (frStep / 650) * 1600,
              dampingCoefficientNs: 1200 + (frStep / 650) * 5600,
            },
            RL: {
              ...prev.dampers.RL,
              forceStep: rlStep,
              solenoidCurrentMa: 200 + (rlStep / 650) * 1600,
              dampingCoefficientNs: 1200 + (rlStep / 650) * 5600,
            },
            RR: {
              ...prev.dampers.RR,
              forceStep: rrStep,
              solenoidCurrentMa: 200 + (rrStep / 650) * 1600,
              dampingCoefficientNs: 1200 + (rrStep / 650) * 5600,
            },
          },
        };
      });

      if (tick >= 14) {
        clearInterval(simInterval);
        setIsSimulating(false);

        // Append to ledger blocks
        const newBlockNonce = telemetry.nonce + 15;
        const newBlock: LedgerBlock = {
          blockNumber: 42090,
          nonce: newBlockNonce,
          timestamp: new Date().toISOString(),
          event: 'ISO_3888_2_SLALOM_AVS_DISPATCH',
          solenoidAvgStep: 564,
          regenKw: 52.8,
          sealIntegrity: '100% NOMINAL',
          previousHash: telemetry.blockHash,
          merkleRoot: 'ef9281a04b18c928471029384710293847102938471029384710293847102938',
          signatureHmac: 'a38f901b2c4819e0928471029384710293847102938471029384710293847102',
          verified: true,
        };
        setLedgerBlocks((prev) => [newBlock, ...prev.slice(0, 8)]);
      }
    }, 200);
  };

  // Action: Verify Hash
  const handleVerifyHash = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setShowVerifyModal(true);
    }, 400);
  };

  // Action: Export Spec (GF_T3_185_SPEC.md)
  const handleExportSpec = () => {
    const blob = new Blob([GF_T3_185_SPEC_CONTENT], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'GF_T3_185_SPEC.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Trigger Divergence Fault
  const handleTriggerDivergenceFault = () => {
    setDivergenceFaultActive(true);
    setTelemetry((prev) => ({
      ...prev,
      dampers: {
        ...prev.dampers,
        FL: {
          ...prev.dampers.FL,
          hydraulicPressureBar: 46.85,
          sealStatus: 'QUARANTINE',
          forceStep: 325, // Fallback safe mode
        },
      },
    }));

    // Add quarantine entry into ledger
    const quarantineBlock: LedgerBlock = {
      blockNumber: 42091,
      nonce: telemetry.nonce + 1,
      timestamp: new Date().toISOString(),
      event: 'QUARANTINE_TRIGGER: SEAL_DIVERGENCE_FL',
      solenoidAvgStep: 325,
      regenKw: 14.2,
      sealIntegrity: 'FAULT_DETECTED',
      previousHash: telemetry.blockHash,
      merkleRoot: 'ff00112233445566778899aabbccddeeff00112233445566778899aabbccddee',
      signatureHmac: '8910abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456',
      verified: true,
    };
    setLedgerBlocks((prev) => [quarantineBlock, ...prev]);
  };

  // Reset Divergence Fault
  const handleResetFault = () => {
    setDivergenceFaultActive(false);
    setTelemetry((prev) => ({
      ...prev,
      dampers: {
        ...prev.dampers,
        FL: {
          ...prev.dampers.FL,
          hydraulicPressureBar: 24.5,
          sealStatus: 'NOMINAL',
        },
      },
    }));
  };

  // Dynamics parameter update callback
  const handleUpdateParams = useCallback(
    ({
      rollDeg,
      pitchDegS,
      vertG,
      latG,
      speedMph,
      mode,
      decelG,
    }: {
      rollDeg: number;
      pitchDegS: number;
      vertG: number;
      latG: number;
      speedMph: number;
      mode: DriveMode;
      decelG: number;
    }) => {
      const modeMultiplier = mode === 'SPORT_S_PLUS' ? 1.38 : mode === 'SPORT_S' ? 1.18 : 1.0;
      const baseDemand = (Math.abs(vertG * 9.8) * 32 + Math.abs(pitchDegS * 30)) * modeMultiplier;

      const flStep = Math.min(650, Math.max(1, Math.round(baseDemand + (rollDeg < 0 ? 120 : 20))));
      const frStep = Math.min(650, Math.max(1, Math.round(baseDemand + (rollDeg > 0 ? 120 : 20))));
      const rlStep = Math.min(650, Math.max(1, Math.round(baseDemand * 0.85 + (rollDeg < 0 ? 90 : 15))));
      const rrStep = Math.min(650, Math.max(1, Math.round(baseDemand * 0.85 + (rollDeg > 0 ? 90 : 15))));

      const regenKw = Math.min(62.0, decelG * 85.0);
      const frictionRatio = 1.0 - regenKw / (decelG * 85.0 + 1e-5);

      setTelemetry((prev) => ({
        ...prev,
        rollAngleDeg: rollDeg,
        pitchVelocityDegS: pitchDegS,
        verticalAccelG: vertG,
        lateralAccelG: latG,
        speedMph: speedMph,
        driveMode: mode,
        dampers: {
          FL: {
            ...prev.dampers.FL,
            forceStep: flStep,
            solenoidCurrentMa: 200 + (flStep / 650) * 1600,
            dampingCoefficientNs: 1200 + (flStep / 650) * 5600,
          },
          FR: {
            ...prev.dampers.FR,
            forceStep: frStep,
            solenoidCurrentMa: 200 + (frStep / 650) * 1600,
            dampingCoefficientNs: 1200 + (frStep / 650) * 5600,
          },
          RL: {
            ...prev.dampers.RL,
            forceStep: rlStep,
            solenoidCurrentMa: 200 + (rlStep / 650) * 1600,
            dampingCoefficientNs: 1200 + (rlStep / 650) * 5600,
          },
          RR: {
            ...prev.dampers.RR,
            forceStep: rrStep,
            solenoidCurrentMa: 200 + (rrStep / 650) * 1600,
            dampingCoefficientNs: 1200 + (rrStep / 650) * 5600,
          },
        },
        phev: {
          ...prev.phev,
          regenPowerKw: regenKw,
          brakeBlendingRatio: frictionRatio,
        },
      }));
    },
    []
  );

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans">
      {/* Main Container - Standard relative/static document flow */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-5 flex-1 space-y-4">
        {/* Bulletproof MonroneyBanner Header */}
        <MonroneyBanner
          onSimulateAVS={handleSimulateAVS}
          onVerifyHash={handleVerifyHash}
          onExportSpec={handleExportSpec}
          isSimulating={isSimulating}
          isVerifying={isVerifying}
        />

        {/* Live Telemetry Metrics Strip */}
        <TelemetryMetricsStrip
          telemetry={telemetry}
          currentStep={avgSolenoidStep}
        />

        {/* 5-Tab Navigation Strip */}
        <nav
          aria-label="Technical Specification Modules"
          className="bg-slate-900/90 border border-slate-800 rounded-xl p-1.5 flex flex-wrap items-center gap-1.5 shadow-md"
        >
          <button
            onClick={() => setActiveTab('avs')}
            className={`flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors cursor-pointer shrink-0 ${
              activeTab === 'avs'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Tab 1: AVS Damping & PHEV Regen</span>
          </button>

          <button
            onClick={() => setActiveTab('ledger')}
            className={`flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors cursor-pointer shrink-0 ${
              activeTab === 'ledger'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Tab 2: Postgres Hybrid Ledger</span>
          </button>

          <button
            onClick={() => setActiveTab('openapi')}
            className={`flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors cursor-pointer shrink-0 ${
              activeTab === 'openapi'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Network className="w-4 h-4" />
            <span>Tab 3: OpenAPI 3.1 Contract</span>
          </button>

          <button
            onClick={() => setActiveTab('cloudrun')}
            className={`flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors cursor-pointer shrink-0 ${
              activeTab === 'cloudrun'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>Tab 4: Cloud Run & PyTest Bench</span>
          </button>

          <button
            onClick={() => setActiveTab('apa')}
            className={`flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors cursor-pointer shrink-0 ${
              activeTab === 'apa'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Tab 5: Acquire.com APA Covenant</span>
          </button>
        </nav>

        {/* Active Tab View */}
        <section className="pt-1">
          {activeTab === 'avs' && (
            <TabAVSDamping
              telemetry={telemetry}
              onUpdateParams={handleUpdateParams}
            />
          )}

          {activeTab === 'ledger' && (
            <TabPostgresLedger
              blocks={ledgerBlocks}
              onTriggerDivergenceFault={handleTriggerDivergenceFault}
              divergenceFaultActive={divergenceFaultActive}
              onResetFault={handleResetFault}
            />
          )}

          {activeTab === 'openapi' && <TabOpenAPISpec />}

          {activeTab === 'cloudrun' && <TabCloudRunHarness />}

          {activeTab === 'apa' && <TabAPACovenant />}
        </section>
      </main>

      {/* Cryptographic Hash Verification Modal */}
      <HashVerificationModal
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        telemetry={telemetry}
      />

      {/* Institutional Legal Vault Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-4 px-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            GF-T3-185 · Ghost FactoryOS Track 3 F1 Skunkworks Service Engine
          </div>
          <div className="text-slate-400">
            Turnkey Software Asset Purchase Agreement Escrow Ready · Acquire.com Qualified
          </div>
        </div>
      </footer>
    </div>
  );
}
