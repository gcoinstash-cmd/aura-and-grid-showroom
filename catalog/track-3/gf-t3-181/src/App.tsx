/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HeaderNav } from './components/HeaderNav';
import { MonroneyBanner } from './components/MonroneyBanner';
import { TelemetryMetricsStrip } from './components/TelemetryMetricsStrip';
import { ThrottleTorsenTab } from './components/tabs/ThrottleTorsenTab';
import { PostgresLedgerTab } from './components/tabs/PostgresLedgerTab';
import { OpenApiContractTab } from './components/tabs/OpenApiContractTab';
import { CloudRunHarnessTab } from './components/tabs/CloudRunHarnessTab';
import { AcquireApaTab } from './components/tabs/AcquireApaTab';
import { VerificationModal } from './components/VerificationModal';
import { TelemetryState, DriveMode, LedgerBlock } from './types/telemetry';
import { computeHmacSha256, HMAC_SECRET_SEED } from './utils/crypto';
import { GF_T3_181_SPEC_MARKDOWN } from './utils/specContent';
import { Gauge, Database, Network, Cloud, FileText } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [verificationReport, setVerificationReport] = useState<{
    verified: boolean;
    checkedCount: number;
    brokenIndex?: number;
  } | null>(null);

  // Core Telemetry State
  const [telemetry, setTelemetry] = useState<TelemetryState>({
    pedalPct: 65.0,
    rpm: 4800,
    driveMode: 'SPORT_PLUS',
    throttleValveAnglePct: 78.4,
    engineTorqueLbFt: 395.0,
    enginePowerHp: 361.0,
    diffOilTempC: 98.4,
    kinematicViscosityCSt: 11.8,
    torqueBiasRatio: 2.80,
    leftWheelRpm: 1240,
    rightWheelRpm: 1252,
    wheelSlipDelta: 12.0,
    nonce: 1048219,
    hash: '8f43a0d17e65b93478954318c652bd852a65fe094b79c3e9827b500363bb53e1',
    isSimulating: false,
  });

  // Ledger Blocks State
  const [blocks, setBlocks] = useState<LedgerBlock[]>([
    {
      blockNumber: 1048216,
      timestamp: '2026-10-11 20:34:10.124 UTC',
      nonce: 1048216,
      pedalPct: 22.0,
      throttleAnglePct: 28.5,
      rpm: 2400,
      diffTempC: 84.2,
      viscosityCSt: 18.4,
      prevHash: '0000000000000000000000000000000000000000000000000000000000000000',
      blockHmac: '3f7a1d5e9b8c0421aa6e2d14785b9630c8f5e12479a32c65874b01e9d562f1a8',
    },
    {
      blockNumber: 1048217,
      timestamp: '2026-10-11 20:34:30.582 UTC',
      nonce: 1048217,
      pedalPct: 45.0,
      throttleAnglePct: 56.2,
      rpm: 3800,
      diffTempC: 91.0,
      viscosityCSt: 14.6,
      prevHash: '3f7a1d5e9b8c0421aa6e2d14785b9630c8f5e12479a32c65874b01e9d562f1a8',
      blockHmac: '6b9c8e2a14d5789f03c2a5e8714b96321f8a7e45d62c10b95384e721fa05c891',
    },
    {
      blockNumber: 1048218,
      timestamp: '2026-10-11 20:34:55.912 UTC',
      nonce: 1048218,
      pedalPct: 65.0,
      throttleAnglePct: 78.4,
      rpm: 4800,
      diffTempC: 98.4,
      viscosityCSt: 11.8,
      prevHash: '6b9c8e2a14d5789f03c2a5e8714b96321f8a7e45d62c10b95384e721fa05c891',
      blockHmac: '8f43a0d17e65b93478954318c652bd852a65fe094b79c3e9827b500363bb53e1',
    },
  ]);

  // Pure Math Calculation for 2UR-GSE & Torsen Type-B
  const calculateTelemetry = useCallback((pedal: number, rpm: number, mode: DriveMode, currentTemp: number) => {
    // Mode parameters
    let alpha = 1.0;
    let gamma = 1.1;
    let beta = 0.15;

    if (mode === 'ECO') {
      alpha = 0.85;
      gamma = 1.35;
      beta = 0.08;
    } else if (mode === 'NORMAL') {
      alpha = 1.00;
      gamma = 1.10;
      beta = 0.15;
    } else if (mode === 'SPORT') {
      alpha = 1.15;
      gamma = 0.92;
      beta = 0.25;
    } else if (mode === 'SPORT_PLUS') {
      alpha = 1.28;
      gamma = 0.78;
      beta = 0.38;
    }

    const pNorm = Math.max(0, Math.min(1, pedal / 100));
    const rpmFactor = Math.max(0, Math.min(1, (rpm - 1000) / (7300 - 1000)));

    // Non-linear valve opening
    let valveAngle = (alpha * Math.pow(pNorm, gamma)) * (1.0 + beta * rpmFactor) * 100;
    valveAngle = Math.max(0, Math.min(100, valveAngle));

    // Torque & Power curves for naturally aspirated 5.0L 2UR-GSE
    // Peak torque 395 lb-ft @ 4800 RPM; Peak power 472 hp @ 7100 RPM
    const torqueNormalized = Math.sin((rpm / 7300) * Math.PI) * (valveAngle / 100);
    const engineTorque = Math.max(20, torqueNormalized * 395.0);
    const enginePower = Math.min(472, (engineTorque * rpm) / 5252);

    // ASTM D341 Walther viscosity approximation for SAE 75W-85 gear oil
    const visc = Math.max(1.2, 74.2 * Math.exp(-0.0315 * (currentTemp - 40.0)));

    // Wheel speed split under cornering / slip
    const slipDelta = (engineTorque / 395.0) * (valveAngle / 100) * 18.0;
    const baseWheelSpeed = (rpm / 7300) * 1800;
    const leftWheel = baseWheelSpeed - slipDelta / 2;
    const rightWheel = baseWheelSpeed + slipDelta / 2;

    return {
      throttleValveAnglePct: valveAngle,
      engineTorqueLbFt: engineTorque,
      enginePowerHp: enginePower,
      kinematicViscosityCSt: visc,
      leftWheelRpm: leftWheel,
      rightWheelRpm: rightWheel,
      wheelSlipDelta: slipDelta,
    };
  }, []);

  // Update handlers
  const handleUpdatePedal = (val: number) => {
    setTelemetry(prev => {
      const calc = calculateTelemetry(val, prev.rpm, prev.driveMode, prev.diffOilTempC);
      return {
        ...prev,
        pedalPct: val,
        ...calc,
      };
    });
  };

  const handleUpdateRpm = (val: number) => {
    setTelemetry(prev => {
      const calc = calculateTelemetry(prev.pedalPct, val, prev.driveMode, prev.diffOilTempC);
      return {
        ...prev,
        rpm: val,
        ...calc,
      };
    });
  };

  const handleSelectDriveMode = (mode: DriveMode) => {
    setTelemetry(prev => {
      const calc = calculateTelemetry(prev.pedalPct, prev.rpm, mode, prev.diffOilTempC);
      return {
        ...prev,
        driveMode: mode,
        ...calc,
      };
    });
  };

  // Toggle Live Simulation
  const handleToggleSimulation = () => {
    setTelemetry(prev => ({ ...prev, isSimulating: !prev.isSimulating }));
  };

  // Simulation loop effect
  const simStepRef = useRef(0);
  useEffect(() => {
    if (!telemetry.isSimulating) return;

    const interval = setInterval(() => {
      simStepRef.current += 0.08;
      const step = simStepRef.current;

      // Oscillate pedal and RPM smoothly between high-RPM corner exit and straightaway
      const wave = (Math.sin(step) + 1) / 2;
      const newPedal = 20 + wave * 75; // 20% to 95%
      const newRpm = Math.floor(2800 + wave * 4300); // 2800 to 7100 RPM

      setTelemetry(prev => {
        // Temperature rises under aggressive throttle
        const tempDelta = wave > 0.6 ? 0.35 : -0.15;
        const newTemp = Math.max(75, Math.min(145, prev.diffOilTempC + tempDelta));
        const calc = calculateTelemetry(newPedal, newRpm, prev.driveMode, newTemp);
        const newNonce = prev.nonce + 1;

        return {
          ...prev,
          pedalPct: newPedal,
          rpm: newRpm,
          diffOilTempC: newTemp,
          nonce: newNonce,
          ...calc,
        };
      });
    }, 250);

    return () => clearInterval(interval);
  }, [telemetry.isSimulating, calculateTelemetry]);

  // Append new telemetry block to PostgreSQL Ledger
  const handleAppendBlock = async () => {
    const lastBlock = blocks[blocks.length - 1];
    const newBlockNum = (lastBlock ? lastBlock.blockNumber : 1048200) + 1;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 23) + ' UTC';
    const prevHash = lastBlock ? lastBlock.blockHmac : '0000000000000000000000000000000000000000000000000000000000000000';

    const payload = `${newBlockNum}:${telemetry.nonce}:${telemetry.pedalPct.toFixed(2)}:${telemetry.throttleValveAnglePct.toFixed(2)}:${telemetry.rpm}:${telemetry.diffOilTempC.toFixed(2)}:${prevHash}`;
    const hmac = await computeHmacSha256(HMAC_SECRET_SEED, payload);

    const isQuarantined = telemetry.diffOilTempC >= 140 || telemetry.kinematicViscosityCSt <= 4.8;

    const newBlock: LedgerBlock = {
      blockNumber: newBlockNum,
      timestamp: nowStr,
      nonce: telemetry.nonce,
      pedalPct: Number(telemetry.pedalPct.toFixed(1)),
      throttleAnglePct: Number(telemetry.throttleValveAnglePct.toFixed(1)),
      rpm: telemetry.rpm,
      diffTempC: Number(telemetry.diffOilTempC.toFixed(1)),
      viscosityCSt: Number(telemetry.kinematicViscosityCSt.toFixed(2)),
      prevHash,
      blockHmac: hmac,
      isQuarantined,
    };

    setBlocks(prev => [...prev, newBlock]);
    setTelemetry(prev => ({
      ...prev,
      nonce: prev.nonce + 1,
      hash: hmac,
    }));
  };

  // Verify Ledger Hash Chain
  const handleVerifyLedger = async () => {
    setIsVerifying(true);
    let verified = true;
    let brokenIndex: number | undefined = undefined;

    for (let i = 0; i < blocks.length; i++) {
      const blk = blocks[i];
      if (i > 0) {
        const prevBlk = blocks[i - 1];
        if (blk.prevHash !== prevBlk.blockHmac) {
          verified = false;
          brokenIndex = blk.blockNumber;
          break;
        }
      }
      const payload = `${blk.blockNumber}:${blk.nonce}:${blk.pedalPct.toFixed(2)}:${blk.throttleAnglePct.toFixed(2)}:${blk.rpm}:${blk.diffTempC.toFixed(2)}:${blk.prevHash}`;
      const expectedHmac = await computeHmacSha256(HMAC_SECRET_SEED, payload);
      if (expectedHmac !== blk.blockHmac) {
        verified = false;
        brokenIndex = blk.blockNumber;
        break;
      }
    }

    setVerificationReport({
      verified,
      checkedCount: blocks.length,
      brokenIndex,
    });
    setIsVerifying(false);
    setVerificationModalOpen(true);
  };

  // Simulate Block Tampering
  const handleTamperBlock = (index: number) => {
    setBlocks(prev => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        rpm: copy[index].rpm + 1200, // Unauthorized RPM modification!
      };
      return copy;
    });
    setVerificationReport(null);
  };

  // Repair Chain
  const handleRepairChain = async () => {
    let currentPrevHash = blocks[0]?.prevHash || '0000000000000000000000000000000000000000000000000000000000000000';
    const repaired: LedgerBlock[] = [];

    for (let i = 0; i < blocks.length; i++) {
      const blk = blocks[i];
      const payload = `${blk.blockNumber}:${blk.nonce}:${blk.pedalPct.toFixed(2)}:${blk.throttleAnglePct.toFixed(2)}:${blk.rpm}:${blk.diffTempC.toFixed(2)}:${currentPrevHash}`;
      const validHmac = await computeHmacSha256(HMAC_SECRET_SEED, payload);

      const repBlk: LedgerBlock = {
        ...blk,
        prevHash: currentPrevHash,
        blockHmac: validHmac,
      };
      repaired.push(repBlk);
      currentPrevHash = validHmac;
    }

    setBlocks(repaired);
    setVerificationReport({
      verified: true,
      checkedCount: repaired.length,
    });
  };

  // Export Spec function: downloads GF_T3_181_SPEC.md immediately
  const handleExportSpec = () => {
    const blob = new Blob([GF_T3_181_SPEC_MARKDOWN], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'GF_T3_181_SPEC.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // "Simulate Throttle" header action
  const handleHeaderSimulateThrottle = () => {
    setActiveTab(0);
    handleToggleSimulation();
  };

  const navTabItems = [
    { label: 'Throttle Mapping & Torsen Core', icon: Gauge },
    { label: 'Postgres Performance Ledger', icon: Database },
    { label: 'OpenAPI 3.1 Telemetry Contract', icon: Network },
    { label: 'Turnkey Cloud Run Harness', icon: Cloud },
    { label: 'Acquire.com APA Covenant', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top 3-Zone Navigation Header */}
      <HeaderNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onExportSpec={handleExportSpec}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Monroney Banner (Compliant with Hardened Header Protocol) */}
        <MonroneyBanner
          onSimulateThrottle={handleHeaderSimulateThrottle}
          onVerifyHash={handleVerifyLedger}
          onExportSpec={handleExportSpec}
          isSimulating={telemetry.isSimulating}
        />

        {/* Live Telemetry Metrics Strip */}
        <TelemetryMetricsStrip telemetry={telemetry} />

        {/* Five Navigable Tabs Bar */}
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-900/90 border border-slate-800 rounded-xl overflow-x-auto mb-6 scrollbar-none">
          {navTabItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = activeTab === idx;
            return (
              <button
                key={item.label}
                onClick={() => setActiveTab(idx)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Viewport Content */}
        <div className="relative">
          {activeTab === 0 && (
            <ThrottleTorsenTab
              telemetry={telemetry}
              onUpdatePedal={handleUpdatePedal}
              onUpdateRpm={handleUpdateRpm}
              onSelectDriveMode={handleSelectDriveMode}
              onToggleSimulation={handleToggleSimulation}
            />
          )}

          {activeTab === 1 && (
            <PostgresLedgerTab
              blocks={blocks}
              telemetry={telemetry}
              onAppendBlock={handleAppendBlock}
              onVerifyLedger={handleVerifyLedger}
              onTamperBlock={handleTamperBlock}
              onRepairChain={handleRepairChain}
              isVerifying={isVerifying}
              verificationReport={verificationReport}
            />
          )}

          {activeTab === 2 && (
            <OpenApiContractTab telemetry={telemetry} />
          )}

          {activeTab === 3 && (
            <CloudRunHarnessTab />
          )}

          {activeTab === 4 && (
            <AcquireApaTab />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-400">GHOST FACTORYOS</span>
            <span>·</span>
            <span>GF-T3-181 (Heavy Overland Dynamics Platform IS 500 High-G Dynamic Telemetry Core)</span>
            <span>·</span>
            <span className="text-emerald-400 font-mono">Clean-Room Certified</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Delaware Micro-APA Asset ID: GF-T3-181</span>
            <span>Acquire.com Verified Asset Transfer</span>
          </div>
        </div>
      </footer>

      {/* Verification Dialog / Proof Modal */}
      <VerificationModal
        isOpen={verificationModalOpen}
        onClose={() => setVerificationModalOpen(false)}
        blocks={blocks}
        isTampered={verificationReport ? !verificationReport.verified : false}
        brokenIndex={verificationReport?.brokenIndex}
      />
    </div>
  );
}
